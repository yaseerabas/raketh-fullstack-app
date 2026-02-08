import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { streamTTS, streamTranslateTTS, MAX_TEXT_LENGTH } from '@/lib/external-tts-api'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { text, voiceId, type, sourceLanguage, targetLanguage } = body

    if (!text || !voiceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!type || !['tts', 'translate-tts'].includes(type)) {
      return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 })
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: 'Text too long', message: `Text exceeds ${MAX_TEXT_LENGTH.toLocaleString()} character limit (you have ${text.length.toLocaleString()}).` },
        { status: 413 }
      )
    }
    if (type === 'translate-tts' && (!sourceLanguage || !targetLanguage)) {
      return NextResponse.json({ error: 'Source and target languages required' }, { status: 400 })
    }

    // ── auth & subscription checks ────────────────────────────
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
          include: { plan: true },
          where: { status: 'active', expiresAt: { gt: new Date() } },
          orderBy: { purchasedAt: 'desc' },
          take: 1
        }
      }
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const subscription = user.subscriptions[0]
    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription. Please renew your plan.' }, { status: 403 })
    }
    if (!subscription.expiresAt || new Date(subscription.expiresAt) < new Date()) {
      await db.subscription.update({ where: { id: subscription.id }, data: { status: 'expired', endDate: new Date() } })
      return NextResponse.json({ error: 'Subscription expired. Please renew your plan.' }, { status: 403 })
    }

    const textLength = text.length
    const creditsRemaining = subscription.creditsPurchased - subscription.creditsUsed
    if (creditsRemaining < textLength) {
      return NextResponse.json(
        { error: 'Insufficient credits', message: `Need ${textLength} credits but only ${creditsRemaining} remaining.` },
        { status: 403 }
      )
    }

    // ── deduct credits upfront (refund on failure) ────────────
    const newCreditsUsed = subscription.creditsUsed + textLength
    await db.subscription.update({
      where: { id: subscription.id },
      data: { creditsUsed: newCreditsUsed }
    })

    // ── prepare file & db record ──────────────────────────────
    const generationId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const filename = `${generationId}.wav`
    const storageDir = path.join(process.cwd(), 'storage', 'audio')
    const audioUrl = `/api/audio/${filename}`
    const duration = Math.max(1, textLength / 15)

    const generation = await db.voiceGeneration.create({
      data: {
        userId: session.user.id,
        voiceCloneId: null,
        text: text.substring(0, 500),
        textLength,
        audioUrl,
        duration,
        status: 'processing',
        type,
        sourceLanguage: type === 'translate-tts' ? sourceLanguage : null,
        targetLanguage: type === 'translate-tts' ? targetLanguage : null,
      }
    })

    // ── call external streaming API ───────────────────────────
    let externalResponse: Response
    try {
      if (type === 'tts') {
        const language = body.language || 'en'
        const voiceClone = await db.voiceClone.findFirst({ where: { voiceId, active: true } })
        const validDefaults = ['default_male_01', 'default_female_01']
        const speakerId = voiceClone ? voiceClone.voiceId :
                         validDefaults.includes(voiceId) ? voiceId : 'default_female_01'

        console.log(`[Stream] TTS: speaker=${speakerId}, lang=${language}, chars=${textLength}`)
        externalResponse = await streamTTS(text, speakerId, language)
      } else {
        console.log(`[Stream] Translate-TTS: ${sourceLanguage} → ${targetLanguage}, chars=${textLength}`)
        externalResponse = await streamTranslateTTS(text, voiceId, sourceLanguage, targetLanguage)
      }
    } catch (error: any) {
      // refund credits
      await db.subscription.update({ where: { id: subscription.id }, data: { creditsUsed: subscription.creditsUsed } })
      await db.voiceGeneration.update({ where: { id: generation.id }, data: { status: 'failed' } })
      return NextResponse.json({ error: 'Failed to generate audio', message: error.message }, { status: 500 })
    }

    if (!externalResponse.body) {
      await db.subscription.update({ where: { id: subscription.id }, data: { creditsUsed: subscription.creditsUsed } })
      await db.voiceGeneration.update({ where: { id: generation.id }, data: { status: 'failed' } })
      return NextResponse.json({ error: 'No audio stream received' }, { status: 500 })
    }

    // ── tee the stream: one → client, one → disk ─────────────
    const [clientStream, saveStream] = externalResponse.body.tee()

    // Save to disk in background (non-blocking)
    ;(async () => {
      try {
        await mkdir(storageDir, { recursive: true })
        const reader = saveStream.getReader()
        const chunks: Uint8Array[] = []
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }
        const totalLen = chunks.reduce((s, c) => s + c.length, 0)
        const buf = new Uint8Array(totalLen)
        let off = 0
        for (const c of chunks) { buf.set(c, off); off += c.length }
        await writeFile(path.join(storageDir, filename), buf)
        await db.voiceGeneration.update({ where: { id: generation.id }, data: { status: 'completed' } })
        console.log(`[Stream] Saved ${totalLen} bytes → ${filename}`)
      } catch (err) {
        console.error('[Stream] Background save error:', err)
        await db.voiceGeneration.update({ where: { id: generation.id }, data: { status: 'completed' } }).catch(() => {})
      }
    })()

    // ── pipe audio stream directly to browser ─────────────────
    return new Response(clientStream, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Generation-Id': generation.id,
        'X-Audio-Url': audioUrl,
        'X-Credits-Remaining': String(subscription.creditsPurchased - newCreditsUsed),
        'X-Text-Length': String(textLength),
        'Access-Control-Expose-Headers': 'X-Generation-Id, X-Audio-Url, X-Credits-Remaining, X-Text-Length',
      }
    })
  } catch (error: any) {
    console.error('[Stream] Unhandled error:', error)
    const msg = error.message || 'Unknown error'
    return NextResponse.json({
      error: msg.includes('timeout') || msg.includes('abort') ? 'Request timed out.' : 'Internal server error',
      message: msg
    }, { status: 500 })
  }
}
