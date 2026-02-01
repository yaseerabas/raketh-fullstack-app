import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getVoicesOverview, DEFAULT_MALE_SPEAKER, DEFAULT_FEMALE_SPEAKER } from '@/lib/external-tts-api'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's voice clones from database
    const userClones = await db.voiceClone.findMany({
      where: {
        userId: session.user.id,
        active: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Try to get all voices from external API
    let externalVoices: any[] = []
    try {
      const response = await getVoicesOverview()
      externalVoices = response.voices
    } catch (error) {
      console.error('Error fetching external voices:', error)
      // Continue with just database voices if external API is unavailable
    }

    // Combine default voices + user clones
    // Default voices should always be available
    const voices = [
      {
        id: DEFAULT_FEMALE_SPEAKER,
        voiceId: DEFAULT_FEMALE_SPEAKER,
        name: 'Default Female',
        description: 'Standard female TTS voice',
        sampleUrl: null,
        isDefault: true,
        available: true
      },
      {
        id: DEFAULT_MALE_SPEAKER,
        voiceId: DEFAULT_MALE_SPEAKER,
        name: 'Default Male',
        description: 'Standard male TTS voice',
        sampleUrl: null,
        isDefault: true,
        available: true
      },
      ...userClones.map(clone => {
        const externalVoice = externalVoices.find(v => v.user_id === clone.voiceId)
        return {
          id: clone.id,
          voiceId: clone.voiceId,
          name: clone.name,
          description: clone.description,
          sampleUrl: clone.sampleUrl,
          isDefault: false,
          available: externalVoice?.available ?? true,
          createdAt: clone.createdAt
        }
      })
    ]

    return NextResponse.json({ voices })
  } catch (error) {
    console.error('Error fetching voice clones:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
