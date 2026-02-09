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

    // First, auto-expire any subscriptions that have passed their expiration date
    await db.subscription.updateMany({
      where: {
        userId: session.user.id,
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
        },
        _count: {
          select: {
            voiceClones: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const subscription = user.subscriptions[0]
    const plan = subscription?.plan

    // Get generation count for this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const generationsThisMonth = await db.voiceGeneration.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startOfMonth
        }
      }
    })

    const totalGenerations = await db.voiceGeneration.count({
      where: {
        userId: session.user.id
      }
    })

    // Calculate credits
    const creditsPurchased = subscription?.creditsPurchased || 0
    const creditsUsed = subscription?.creditsUsed || 0
    const creditsRemaining = Math.max(0, creditsPurchased - creditsUsed)
    const rawCreditsPercent = creditsPurchased > 0
      ? (creditsUsed / creditsPurchased) * 100
      : 0
    const creditsPercentage = creditsPurchased > 0
      ? Math.min(100, Math.max(creditsUsed > 0 ? 1 : 0, Math.round(rawCreditsPercent * 10) / 10))
      : 0

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        whatsapp: user.whatsapp,
        role: user.role
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        startDate: subscription.startDate,
        expiresAt: subscription.expiresAt,
        endDate: subscription.endDate,
        purchasedAt: subscription.purchasedAt,
        creditsPurchased,
        creditsUsed,
        creditsRemaining,
        creditsPercentage,
        daysRemaining: subscription.expiresAt
          ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null,
        plan: plan ? {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          credits: plan.credits,
          maxClones: plan.maxClones,
          features: JSON.parse(plan.features || '{}')
        } : null
      } : null,
      stats: {
        generationsThisMonth,
        totalGenerations,
        voiceClonesCount: user._count.voiceClones
      }
    })
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
