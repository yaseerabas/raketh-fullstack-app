import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, planId } = body

    if (!userId || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get target user and plan
    const targetUser = await db.user.findUnique({
      where: { id: userId }
    })

    const plan = await db.plan.findUnique({
      where: { id: planId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Check if user already has an active subscription
    const existingSubscription = await db.subscription.findFirst({
      where: {
        userId,
        status: 'active'
      }
    })

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Create subscription for user
    const subscription = await db.subscription.create({
      data: {
        userId,
        planId,
        status: 'active',
        creditsPurchased: plan.credits,
        creditsUsed: 0,
        startDate: new Date(),
        endDate: null, // One-time purchase
        purchasedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'User subscribed successfully',
      subscription: {
        id: subscription.id,
        userId: targetUser.id,
        planName: plan.name,
        creditsPurchased: plan.credits,
        status: subscription.status
      }
    })
  } catch (error) {
    console.error('Error subscribing user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE method to expire/cancel a subscription
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const subscriptionId = searchParams.get('subscriptionId')

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
    }

    // Find the subscription
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, user: true }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Update subscription status to expired (keep in database for history)
    const updatedSubscription = await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'expired',
        endDate: new Date()
      }
    })

    return NextResponse.json({
      message: 'Subscription cancelled successfully',
      subscription: {
        id: updatedSubscription.id,
        userId: subscription.userId,
        userName: subscription.user.name || subscription.user.email,
        planName: subscription.plan.name,
        status: updatedSubscription.status,
        endDate: updatedSubscription.endDate
      }
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
