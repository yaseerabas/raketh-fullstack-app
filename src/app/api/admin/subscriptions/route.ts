import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Auto-expire subscriptions that have passed their expiration date
    await db.subscription.updateMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: new Date()
        }
      },
      data: {
        status: 'expired',
        endDate: new Date()
      }
    })

    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const [subscriptions, total] = await Promise.all([
      db.subscription.findMany({
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          },
          plan: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      db.subscription.count()
    ])

    // Add computed fields
    const subscriptionsWithMeta = subscriptions.map(sub => ({
      ...sub,
      daysRemaining: sub.expiresAt ? Math.max(0, Math.ceil((new Date(sub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null,
      isExpired: sub.expiresAt ? new Date(sub.expiresAt) < new Date() : false
    }))

    return NextResponse.json({
      subscriptions: subscriptionsWithMeta,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
