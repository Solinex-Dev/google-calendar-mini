'use client'

import { useState } from 'react'

interface EventFormProps {
  onSubmit: (eventData: {
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
  }) => void
  onCancel: () => void
  initialData?: {
    summary?: string
    description?: string
    start?: string
    end?: string
    reminders?: {
      useDefault: boolean
      overrides: Array<{
        method: 'email'
        minutes: number
      }>
    }
  }
}

export default function EventForm({ onSubmit, onCancel, initialData }: EventFormProps) {
  const [summary, setSummary] = useState(initialData?.summary || '')
  const [description, setDescription] = useState(initialData?.description || '')
  
  // Helper function to format datetime-local for Thai timezone
  const formatDateTimeLocal = (dateString?: string) => {
    if (!dateString) {
      // Return current time in user's local timezone
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }
    
    const date = new Date(dateString)
    // Use local time directly (datetime-local input expects local time)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }
  
  const [startDateTime, setStartDateTime] = useState(
    formatDateTimeLocal(initialData?.start)
  )
  const [endDateTime, setEndDateTime] = useState(
    formatDateTimeLocal(initialData?.end) || new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
  )
  const [reminderMinutes, setReminderMinutes] = useState(
    initialData?.reminders?.overrides[0]?.minutes || 30
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!summary.trim()) {
      alert('กรุณากรอกชื่อกิจกรรม')
      return
    }

    const eventData: any = {
      summary: summary.trim(),
      description: description.trim() || undefined,
      start: { 
        dateTime: new Date(startDateTime).toISOString(),
        timeZone: 'Asia/Bangkok'
      },
      end: { 
        dateTime: new Date(endDateTime).toISOString(),
        timeZone: 'Asia/Bangkok'
      },
      reminders: {
        useDefault: false,
        overrides: [
          {
            method: 'email' as const,
            minutes: reminderMinutes
          }
        ]
      }
    }

    onSubmit(eventData)
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900/50 to-gray-700/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-500 scale-100 opacity-100 border border-gray-200/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">
            {initialData ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรมใหม่'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อกิจกรรม *
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="กรอกชื่อกิจกรรม"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รายละเอียด
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              rows={3}
              placeholder="กรอกรายละเอียดกิจกรรม (ถ้ามี)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เวลาเริ่ม *
            </label>
            <input
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เวลาสิ้นสุด *
            </label>
            <input
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              แจ้งเตือนทางอีเมล
            </label>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value={1}>1 นาทีก่อนเริ่ม (ทดสอบ)</option>
              <option value={10}>10 นาทีก่อนเริ่ม</option>
              <option value={30}>30 นาทีก่อนเริ่ม</option>
              <option value={60}>1 ชั่วโมงก่อนเริ่ม</option>
              <option value={1440}>1 วันก่อนเริ่ม</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {initialData ? 'บันทึกการแก้ไข' : 'สร้างกิจกรรม'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 py-3 px-4 rounded-xl hover:from-gray-300 hover:to-gray-400 transition-all duration-300 font-semibold hover:shadow-md transform hover:scale-105"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
