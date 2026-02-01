import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: cloneId } = await params

    // Find the voice clone
    const voiceClone = await db.voiceClone.findUnique({
      where: { id: cloneId }
    })

    if (!voiceClone) {
      return NextResponse.json({ error: 'Voice clone not found' }, { status: 404 })
    }

    // Check if the user owns this clone
    if (voiceClone.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete by marking as inactive
    await db.voiceClone.update({
      where: { id: cloneId },
      data: { active: false }
    })

    return NextResponse.json({ message: 'Voice clone deleted successfully' })
  } catch (error) {
    console.error('Error deleting voice clone:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
