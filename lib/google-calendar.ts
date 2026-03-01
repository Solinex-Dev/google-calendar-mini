import { google } from 'googleapis'

export async function getCalendarEvents(accessToken: string) {
  try {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })

    const calendar = google.calendar({ version: 'v3', auth })
    
    const now = new Date()
    const timeMin = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
    const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50,
    })

    return response.data.items || []
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    throw error
  }
}

export async function createCalendarEvent(accessToken: string, eventData: {
  summary: string
  description?: string
  start: { dateTime: string; timeZone?: string }
  end: { dateTime: string; timeZone?: string }
  reminders?: {
    useDefault: boolean
    overrides: Array<{
      method: 'email'
      minutes: number
    }>
  }
}) {
  try {
    console.log('Creating event with data:', JSON.stringify(eventData, null, 2))
    
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })

    const calendar = google.calendar({ version: 'v3', auth })
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventData,
    })

    console.log('Event created successfully:', response.data)
    return response.data
  } catch (error) {
    console.error('Error creating calendar event:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw error
  }
}

export async function updateCalendarEvent(accessToken: string, eventId: string, eventData: {
  summary?: string
  description?: string
  start?: { dateTime?: string; timeZone?: string }
  end?: { dateTime?: string; timeZone?: string }
  reminders?: {
    useDefault: boolean
    overrides: Array<{
      method: 'email'
      minutes: number
    }>
  }
}) {
  try {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })

    const calendar = google.calendar({ version: 'v3', auth })
    
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: eventData,
    })

    return response.data
  } catch (error) {
    console.error('Error updating calendar event:', error)
    throw error
  }
}

export async function deleteCalendarEvent(accessToken: string, eventId: string) {
  try {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })

    const calendar = google.calendar({ version: 'v3', auth })
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    })

    return true
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    throw error
  }
}
