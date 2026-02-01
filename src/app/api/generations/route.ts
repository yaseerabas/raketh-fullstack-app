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

    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const [generations, total] = await Promise.all([
      db.voiceGeneration.findMany({
        where: {
          userId: session.user.id
        },
        include: {
          voiceModel: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      db.voiceGeneration.count({
        where: {
          userId: session.user.id
        }
      })
    ])

    return NextResponse.json({
      generations,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching generations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
