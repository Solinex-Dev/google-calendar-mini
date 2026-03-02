import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { deleteCalendarEvent, updateCalendarEvent } from '@/lib/google-calendar'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('DELETE request received')
    
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: eventId } = await params
    console.log('Event ID:', eventId)
    
    if (!eventId) {
      console.log('No event ID provided')
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Use lib/google-calendar.ts
    await deleteCalendarEvent(session.accessToken as string, eventId)
    
    console.log('Event deleted successfully')
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('PUT request received')
    
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: eventId } = await params
    const eventData = await request.json()
    console.log('Event ID:', eventId, 'Data:', eventData)

    if (!eventId) {
      console.log('No event ID provided')
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Use lib/google-calendar.ts
    const updatedEvent = await updateCalendarEvent(
      session.accessToken as string, 
      eventId, 
      eventData
    )
    
    console.log('Event updated successfully')
    return NextResponse.json(updatedEvent, { status: 200 })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}
