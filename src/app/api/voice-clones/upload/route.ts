import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadVoice } from '@/lib/external-tts-api'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription to check clone limits
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscriptions: {
          include: {
            plan: true
          },
          where: {
            status: 'active'
          },
          orderBy: {
            createdAt: 'desc'
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
      return NextResponse.json({ error: 'No active subscription' }, { status: 403 })
    }

    // Check if user has reached their clone limit
    const existingClonesCount = await db.voiceClone.count({
      where: {
        userId: session.user.id
      }
    })

    if (subscription.plan.maxClones !== -1 && existingClonesCount >= subscription.plan.maxClones) {
      return NextResponse.json(
        { error: 'Voice clone limit reached. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Get form data
    const formData = await req.formData()
    const file = formData.get('voice_file') as File
    const name = formData.get('name') as string

    if (!file) {
      return NextResponse.json({ error: 'Voice file is required' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: 'Voice name is required' }, { status: 400 })
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const validExtensions = ['wav', 'mp3', 'flac', 'ogg']

    if (!validExtensions.includes(fileExtension || '')) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload .wav, .mp3, .flac, or .ogg' },
        { status: 400 }
      )
    }

    // Generate voice ID (name + number)
    const timestamp = Date.now()
    const randomNum = Math.floor(Math.random() * 1000)
    const voiceId = `${name.replace(/\s+/g, '_').toLowerCase()}_${randomNum}`

    // Upload to external API
    try {
      const uploadResponse = await uploadVoice(voiceId, file)

      // Save to database
      const voiceClone = await db.voiceClone.create({
        data: {
          userId: session.user.id,
          voiceId,
          name,
          description: `Uploaded at ${new Date().toLocaleDateString()}`,
          sampleUrl: uploadResponse.path,
          active: true
        }
      })

      return NextResponse.json({
        id: voiceClone.id,
        voiceId: voiceClone.voiceId,
        name: voiceClone.name,
        description: voiceClone.description,
        sampleUrl: voiceClone.sampleUrl,
        createdAt: voiceClone.createdAt
      })
    } catch (error: any) {
      console.error('Error uploading voice:', error)
      return NextResponse.json(
        { error: error.message || 'Voice upload failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in voice upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
