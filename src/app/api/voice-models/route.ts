import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const voiceModels = await db.voiceModel.findMany({
      where: {
        active: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ voiceModels })
  } catch (error) {
    console.error('Error fetching voice models:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
