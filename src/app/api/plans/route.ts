import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public endpoint - no auth required
export async function GET(req: NextRequest) {
  try {
    // Get all pinned and active plans for homepage
    const plans = await db.plan.findMany({
      where: { 
        active: true,
        pinnedOnHomepage: true
      },
      orderBy: [
        { displayOrder: 'asc' },
        { price: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        credits: true,
        maxClones: true,
        features: true,
        displayOrder: true
      }
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Error fetching public plans:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
