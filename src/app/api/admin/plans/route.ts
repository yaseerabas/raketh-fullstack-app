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

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all plans (including inactive)
    const plans = await db.plan.findMany({
      orderBy: [
        { displayOrder: 'asc' },
        { price: 'asc' }
      ]
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, price, credits, maxClones, features, durationDays, pinnedOnHomepage, displayOrder } = await req.json()

    if (!name || price === undefined || credits === undefined || maxClones === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if plan name already exists
    const existingPlan = await db.plan.findUnique({
      where: { name }
    })

    if (existingPlan) {
      return NextResponse.json({ error: 'Plan name already exists' }, { status: 400 })
    }

    const plan = await db.plan.create({
      data: {
        name,
        price: parseFloat(price),
        credits: parseInt(credits),
        maxClones: parseInt(maxClones),
        features: features || '[]',
        durationDays: parseInt(durationDays) || 30,
        pinnedOnHomepage: pinnedOnHomepage || false,
        displayOrder: parseInt(displayOrder) || 0,
        active: true
      }
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, name, price, credits, maxClones, features, durationDays, active, pinnedOnHomepage, displayOrder } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Check if plan exists
    const existingPlan = await db.plan.findUnique({
      where: { id }
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // If name is being changed, check it doesn't conflict
    if (name && name !== existingPlan.name) {
      const nameConflict = await db.plan.findUnique({
        where: { name }
      })
      if (nameConflict) {
        return NextResponse.json({ error: 'Plan name already exists' }, { status: 400 })
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (price !== undefined) updateData.price = parseFloat(price)
    if (credits !== undefined) updateData.credits = parseInt(credits)
    if (maxClones !== undefined) updateData.maxClones = parseInt(maxClones)
    if (features !== undefined) updateData.features = features
    if (durationDays !== undefined) updateData.durationDays = parseInt(durationDays)
    if (active !== undefined) updateData.active = active
    if (pinnedOnHomepage !== undefined) updateData.pinnedOnHomepage = pinnedOnHomepage
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder

    const plan = await db.plan.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const planId = searchParams.get('planId')

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Check if plan has any subscriptions
    const subscriptions = await db.subscription.count({
      where: { planId }
    })

    if (subscriptions > 0) {
      // Soft delete - just deactivate
      await db.plan.update({
        where: { id: planId },
        data: { active: false, pinnedOnHomepage: false }
      })
      return NextResponse.json({ message: 'Plan deactivated (has existing subscriptions)' })
    }

    // Hard delete if no subscriptions
    await db.plan.delete({
      where: { id: planId }
    })

    return NextResponse.json({ message: 'Plan deleted successfully' })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
