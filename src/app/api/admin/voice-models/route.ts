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

    const voiceModels = await db.voiceModel.findMany({
      include: {
        _count: {
          select: {
            generations: true
          }
        }
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, displayName, language, gender, category, description, active } = body

    if (!name || !displayName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const voiceModel = await db.voiceModel.create({
      data: {
        name,
        displayName,
        language: language || 'en-US',
        gender: gender || 'neutral',
        category: category || 'standard',
        description,
        active: active ?? true
      }
    })

    return NextResponse.json({ voiceModel }, { status: 201 })
  } catch (error) {
    console.error('Error creating voice model:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing voice model id' }, { status: 400 })
    }

    const voiceModel = await db.voiceModel.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ voiceModel })
  } catch (error) {
    console.error('Error updating voice model:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing voice model id' }, { status: 400 })
    }

    await db.voiceModel.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting voice model:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
