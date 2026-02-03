import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateTTS, generateTranslateTTS } from '@/lib/external-tts-api'

// Extend timeout for this route - TTS generation can take a while for long text
export const maxDuration = 300 // 5 minutes
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

    // For translate-tts, validate language fields
    if (type === 'translate-tts') {
      if (!sourceLanguage || !targetLanguage) {
        return NextResponse.json(
          { error: 'Source and target languages are required for translate-tts' },
          { status: 400 }
        )
      }
    }

    // Get user's subscription to check credit limits
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
          include: {
            plan: true
          },
          where: {
            status: 'active',
            expiresAt: {
              gt: new Date() // Only get non-expired subscriptions
            }
          },
          orderBy: {
            purchasedAt: 'desc'
          },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const subscription = user.subscriptions[0]
    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription or your subscription has expired. Please contact us via WhatsApp to renew your plan.' },
        { status: 403 }
      )
    }

    // Double-check expiration (in case it just expired)
    if (new Date(subscription.expiresAt) < new Date()) {
      // Mark as expired
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: 'expired', endDate: new Date() }
      })
      return NextResponse.json(
        { error: 'Your subscription has expired. Please contact us via WhatsApp to renew your plan.' },
        { status: 403 }
      )
    }

    // Check if user has enough credits
    const textLength = text.length
    const creditsPurchased = subscription.creditsPurchased
    const creditsUsed = subscription.creditsUsed
    const creditsRemaining = creditsPurchased - creditsUsed

    if (creditsRemaining < textLength) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          creditsRemaining,
          creditsNeeded: textLength,
          message: `You need ${textLength} credits but only have ${creditsRemaining} credits remaining`
        },
        { status: 403 }
      )
    }

    // Generate audio using external API
    let audioBlob: Blob
    let duration: number

    console.log(`[Generate] Starting TTS generation for ${text.length} chars, type: ${type}`)

    try {
      if (type === 'tts') {
        // Get language from request body, default to 'en'
        const language = body.language || 'en'

        // Validate voice exists or use default
        const voiceClone = await db.voiceClone.findFirst({
          where: {
            voiceId,
            active: true
          }
        })

        // Use the voice ID if it's a valid clone, otherwise check if it's a default voice
        const validDefaults = ['default_male_01', 'default_female_01']
        const speakerId = voiceClone ? voiceClone.voiceId : 
                         validDefaults.includes(voiceId) ? voiceId : 'default_female_01'

        console.log(`[Generate] Calling TTS API with speaker: ${speakerId}, language: ${language}`)
        
        // Generate TTS - API needs text, speaker_id, and language
        audioBlob = await generateTTS(text, speakerId, language)
        
        console.log(`[Generate] TTS API returned blob of size: ${audioBlob.size}`)

        duration = Math.max(1, text.length / 15)

      } else {
        // Translate-TTS - translate text to target language and generate speech
        console.log(`[Generate] Calling Translate-TTS API: ${sourceLanguage} -> ${targetLanguage}`)
        
        audioBlob = await generateTranslateTTS(
          text,
          voiceId,
          sourceLanguage,
          targetLanguage
        )
        
        console.log(`[Generate] Translate-TTS API returned blob of size: ${audioBlob.size}`)

        duration = Math.max(1, text.length / 15)
      }
    } catch (error: any) {
      console.error('[Generate] Error generating audio:', error)
      const errorMessage = error.message || 'Unknown error'
      return NextResponse.json(
        { 
          error: 'Failed to generate audio', 
          message: errorMessage,
          details: errorMessage.includes('TTS API') ? 'External TTS service is unavailable' : undefined
        },
        { status: 500 }
      )
    }

    // Generate unique filename and save to storage/audio
    console.log(`[Generate] Saving audio file...`)
    const generationId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const filename = `${generationId}.wav`
    const storageDir = path.join(process.cwd(), 'storage', 'audio')
    const filePath = path.join(storageDir, filename)

    try {
      // Ensure storage directory exists
      await mkdir(storageDir, { recursive: true })

      // Save audio blob to file
      console.log(`[Generate] Converting blob to buffer...`)
      const arrayBuffer = await audioBlob.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      console.log(`[Generate] Writing ${buffer.length} bytes to ${filePath}`)
      await writeFile(filePath, buffer)
      console.log(`[Generate] File saved successfully`)
    } catch (error: any) {
      console.error('[Generate] Error saving audio file:', error)
      return NextResponse.json(
        { error: 'Failed to save audio file', message: error.message },
        { status: 500 }
      )
    }

    // Create audio URL pointing to API endpoint
    const audioUrl = `/api/audio/${filename}`

    // Update user's credits
    const newCreditsUsed = creditsUsed + textLength
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        creditsUsed: newCreditsUsed
      }
    })

    // Save generation to database
    const generation = await db.voiceGeneration.create({
      data: {
        userId: session.user.id,
        voiceCloneId: null,
        text: text.substring(0, 500),
        textLength,
        audioUrl,
        duration,
        status: 'completed',
        type,
        sourceLanguage: type === 'translate-tts' ? sourceLanguage : null,
        targetLanguage: type === 'translate-tts' ? targetLanguage : null,
      }
    })

    // Calculate new credits remaining
    const newCreditsRemaining = creditsPurchased - newCreditsUsed

    return NextResponse.json({
      id: generation.id,
      url: audioUrl,
      duration,
      type,
      textLength,
      credits: {
        purchased: creditsPurchased,
        used: newCreditsUsed,
        remaining: newCreditsRemaining
      }
    })
  } catch (error: any) {
    console.error('Error in generate route:', error)
    // Provide more detailed error message
    const errorMessage = error.message || 'Unknown error occurred'
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('aborted')
    return NextResponse.json({ 
      error: isTimeout ? 'Request timed out. Try with shorter text.' : 'Internal server error',
      message: errorMessage
    }, { status: 500 })
  }
}
