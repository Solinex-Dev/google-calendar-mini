import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { getCalendarEvents, createCalendarEvent } from '@/lib/google-calendar'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const events = await getCalendarEvents(session.accessToken)
    
    return NextResponse.json({ events })
  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const eventData = await request.json()
    
    if (!eventData.summary || !eventData.start || !eventData.end) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const event = await createCalendarEvent(session.accessToken, eventData)
    
    return NextResponse.json({ event })
  } catch (error) {
    console.error('Create event error:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
