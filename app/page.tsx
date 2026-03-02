'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import EventForm from '@/components/EventForm'

interface CalendarEvent {
  id?: string
  summary?: string
  description?: string
  start?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  reminders?: {
    useDefault: boolean
    overrides: Array<{
      method: 'email'
      minutes: number
    }>
  }
}

export default function Home() {
  const { data: session, status } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const fetchEvents = async () => {
    if (!session) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/calendar')
      const data = await response.json()
      
      console.log('Fetched events:', data.events)
      console.log('Events count:', data.events?.length || 0)
      
      if (response.ok) {
        setEvents(data.events || [])
      } else {
        setError(data.error || 'Failed to fetch events')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchEvents()
    }
  }, [session])

  const createEvent = async (eventData: {
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
  }) => {
    if (!session) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })
      
      if (response.ok) {
        setShowForm(false)
        fetchEvents() // Fetch events again to show new event
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create event')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const updateEvent = async (eventId: string, eventData: Partial<CalendarEvent>) => {
    if (!session) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/calendar/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })
      
      if (response.ok) {
        setEditingEvent(null)
        fetchEvents() // Fetch events again to show updated event
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update event')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (eventId: string) => {
    console.log('Deleting event with ID:', eventId) // ← เพิ่ม log
    
    if (!eventId) {
      console.error('No event ID provided') // ← เพิ่ม log
      setError('Event ID is required')
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch(`/api/calendar/${eventId}`, {
        method: 'DELETE',
      })
      
      console.log('Delete response status:', response.status) // ← เพิ่ม log
      
      if (response.ok) {
        fetchEvents()
      } else {
        const data = await response.json()
        console.log('Delete error:', data) // ← เพิ่ม log
        setError(data.error || 'Failed to delete event')
      }
    } catch (err) {
      console.error('Delete error:', err) // ← เพิ่ม log
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return ''
    return new Date(dateTime).toLocaleString('th-TH', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateTime?: string) => {
    if (!dateTime) return ''
    return new Date(dateTime).toLocaleDateString('th-TH', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateTime?: string) => {
    if (!dateTime) return ''
    return new Date(dateTime).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateCompact = (dateTime?: string) => {
    if (!dateTime) return ''
    return new Date(dateTime).toLocaleDateString('th-TH', {
      weekday: 'short',
      day: 'numeric'
    })
  }

  const formatDateRange = (startDateTime?: string, endDateTime?: string) => {
    if (!startDateTime || !endDateTime) return ''
    const startDate = new Date(startDateTime)
    let endDate = new Date(endDateTime)

    // Check if it's an all-day event (no time component)
    const isAllDay = !startDateTime.includes('T') && !endDateTime.includes('T')

    // For all-day events, Google Calendar's end date is exclusive (the day after event ends)
    // So we subtract one day to get the actual end date
    if (isAllDay) {
      endDate.setDate(endDate.getDate() - 1)
    }

    const startOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric'
    }
    
    const endOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
    
    // Add month to start date if months are different
    if (startDate.getMonth() !== endDate.getMonth()) {
      startOptions.month = 'short'
    }
    
    const startStr = startDate.toLocaleDateString('th-TH', startOptions)
    const endStr = endDate.toLocaleDateString('th-TH', endOptions)
    
    console.log('Formatted:', startStr, '-', endStr)
    
    return `${startStr} - ${endStr}`
  }

  const isMultiDayEvent = (startDateTime?: string, endDateTime?: string, startDate?: string, endDate?: string) => {
    // Check date-only events
    if (startDate && endDate && !startDateTime && !endDateTime) {
      return new Date(startDate).toDateString() !== new Date(endDate).toDateString()
    }
    
    // Check datetime events
    if (startDateTime && endDateTime) {
      const start = new Date(startDateTime)
      const end = new Date(endDateTime)
      return start.toDateString() !== end.toDateString()
    }
    
    return false
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-900">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
        <main className="flex flex-col items-center gap-6 p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-3xl font-semibold text-gray-900">
            Google Calendar Mini
          </h1>
          <p className="text-lg text-gray-600 text-center">
            เชื่อมต่อกับ Google Calendar เพื่อดูกิจกรรมของคุณ
          </p>
          <button
            onClick={() => signIn('google')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Google Calendar Mini
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <span className="text-sm text-gray-600 truncate">
              {session.user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors w-full sm:w-auto"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto p-4">
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors w-full sm:w-auto"
          >
            {loading ? 'Loading...' : 'Refresh Events'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors w-full sm:w-auto"
          >
            สร้างกิจกรรมใหม่
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    กิจกรรม
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    วันที่
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    เวลาเริ่ม
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    เวลาสิ้นสุด
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    รายละเอียด
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    แจ้งเตือนล่วงหน้า
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    จัดการ
                  </th>
                </tr>
              </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    ไม่มีกิจกรรมในช่วง 7 วันข้างหน้า
                  </td>
                </tr>
              )}

              {events.map((event) => {
                try {
                  const multiDay = isMultiDayEvent(event.start?.dateTime, event.end?.dateTime, event.start?.date, event.end?.date)
                  
                  // Debug logging for all events
                  console.log('Event:', event.summary, {
                    startDate: event.start?.date,
                    startDateTime: event.start?.dateTime,
                    endDate: event.end?.date,
                    endDateTime: event.end?.dateTime,
                    isMultiDay: multiDay
                  })
                  
                  return (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {event.summary || 'No Title'}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {multiDay ? (
                          <div>
                            {formatDateRange(event.start?.dateTime || event.start?.date, event.end?.dateTime || event.end?.date)}
                          </div>
                        ) : (
                          <div>{formatDate(event.start?.dateTime || event.start?.date)}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {formatTime(event.start?.dateTime || event.start?.date)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {formatTime(event.end?.dateTime || event.end?.date)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {event.description || '-'}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {event.reminders?.overrides?.length ? (
                          <div>
                            {(() => {
                              // Sort reminders by unit: minutes -> hours -> days -> weeks
                              const sortedReminders = [...event.reminders.overrides].sort((a, b) => {
                                const unitOrder = { 'minutes': 1, 'hours': 2, 'days': 3, 'weeks': 4 }
                                const getUnit = (minutes: number) => {
                                  if (minutes >= 10080) return 'weeks'
                                  if (minutes >= 1440) return 'days'
                                  if (minutes >= 60) return 'hours'
                                  return 'minutes'
                                }
                                const unitA = getUnit(a.minutes)
                                const unitB = getUnit(b.minutes)
                                return unitOrder[unitA] - unitOrder[unitB]
                              })

                              const reminderTexts = sortedReminders.map((reminder) => {
                                const minutes = reminder.minutes
                                if (minutes < 60) {
                                  return `${minutes} นาที`
                                } else if (minutes < 1440) {
                                  const hours = Math.floor(minutes / 60)
                                  const remainingMinutes = minutes % 60
                                  return remainingMinutes > 0 ? `${hours} ชั่วโมง ${remainingMinutes} นาที` : `${hours} ชั่วโมง`
                                } else if (minutes < 10080) {
                                  const days = Math.floor(minutes / 1440)
                                  const remainingHours = Math.floor((minutes % 1440) / 60)
                                  const remainingMinutes = minutes % 60
                                  if (remainingHours > 0 && remainingMinutes > 0) {
                                    return `${days} วัน ${remainingHours} ชั่วโมง ${remainingMinutes} นาที`
                                  } else if (remainingHours > 0) {
                                    return `${days} วัน ${remainingHours} ชั่วโมง`
                                  } else if (remainingMinutes > 0) {
                                    return `${days} วัน ${remainingMinutes} นาที`
                                  } else {
                                    return `${days} วัน`
                                  }
                                } else {
                                  const weeks = Math.floor(minutes / 10080)
                                  const remainingDays = Math.floor((minutes % 10080) / 1440)
                                  const remainingHours = Math.floor(((minutes % 10080) % 1440) / 60)
                                  const remainingMinutes = minutes % 60
                                  if (remainingDays > 0 && remainingHours > 0 && remainingMinutes > 0) {
                                    return `${weeks} สัปดาห์ ${remainingDays} วัน ${remainingHours} ชั่วโมง ${remainingMinutes} นาที`
                                  } else if (remainingDays > 0 && remainingHours > 0) {
                                    return `${weeks} สัปดาห์ ${remainingDays} วัน ${remainingHours} ชั่วโมง`
                                  } else if (remainingDays > 0 && remainingMinutes > 0) {
                                    return `${weeks} สัปดาห์ ${remainingDays} วัน ${remainingMinutes} นาที`
                                  } else if (remainingHours > 0 && remainingMinutes > 0) {
                                    return `${weeks} สัปดาห์ ${remainingHours} ชั่วโมง ${remainingMinutes} นาที`
                                  } else if (remainingDays > 0) {
                                    return `${weeks} สัปดาห์ ${remainingDays} วัน`
                                  } else if (remainingHours > 0) {
                                    return `${weeks} สัปดาห์ ${remainingHours} ชั่วโมง`
                                  } else if (remainingMinutes > 0) {
                                    return `${weeks} สัปดาห์ ${remainingMinutes} นาที`
                                  } else {
                                    return `${weeks} สัปดาห์`
                                  }
                                }
                              })

                              return reminderTexts.join(' / ')
                            })()}
                          </div>
                        ) : (
                          <span className="text-gray-400">ไม่มี</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        <button
                          onClick={() => {
                            console.log('Editing event:', event.id, event)
                            setEditingEvent(event)
                          }}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('ยืนยันที่จะลบกิจกรรม')) {
                              console.log('Deleting event:', event.id, event)
                              deleteEvent(event.id!)
                            }
                          }}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                } catch (error) {
                  console.error('Error rendering event:', event, error)
                  return (
                    <tr key={event.id}>
                      <td colSpan={7} className="px-4 py-4 text-center text-red-500">
                        Error rendering event: {event.summary}
                      </td>
                    </tr>
                  )
                }
              })}
            </tbody>
          </table>
          </div>
        </div>
      </main>

      {showForm && (
        <EventForm
          onSubmit={createEvent}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingEvent && (
        <EventForm
          onSubmit={(eventData) => updateEvent(editingEvent.id!, eventData)}
          onCancel={() => setEditingEvent(null)}
          initialData={{
            summary: editingEvent.summary || '',
            description: editingEvent.description || '',
            start: editingEvent.start || { dateTime: '', date: '' },
            end: editingEvent.end || { dateTime: '', date: '' },
            reminders: editingEvent.reminders ? {
              useDefault: editingEvent.reminders.useDefault || false,
              overrides: editingEvent.reminders.overrides || []
            } : undefined
          }}
        />
      )}
    </div>
  )
}
