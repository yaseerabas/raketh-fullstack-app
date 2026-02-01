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

    // Get counts (exclude admin from user count)
    const [totalUsers, totalGenerations, activeSubscriptions] = await Promise.all([
      db.user.count({ where: { role: { not: 'admin' } } }),
      db.voiceGeneration.count(),
      db.subscription.count({ where: { status: 'active' } }),
    ])

    // Calculate revenue and total credits used from subscriptions
    const allSubscriptions = await db.subscription.findMany({
      include: { plan: true }
    })

    const totalRevenue = allSubscriptions.reduce((sum, sub) => sum + sub.plan.price, 0)
    const totalCreditsUsed = allSubscriptions.reduce((sum, sub) => sum + sub.creditsUsed, 0)

    // Get recent activity
    const recentGenerations = await db.voiceGeneration.findMany({
      take: 5,
      include: {
        voiceModel: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const recentUsers = await db.user.findMany({
      where: { role: { not: 'admin' } },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Return flat structure for admin dashboard
    return NextResponse.json({
      totalUsers,
      totalGenerations,
      activeSubscriptions,
      totalRevenue,
      totalCreditsUsed,
      recentGenerations: totalGenerations,
      recentActivity: {
        generations: recentGenerations,
        users: recentUsers
      }
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
