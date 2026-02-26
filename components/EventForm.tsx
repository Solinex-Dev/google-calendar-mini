'use client'

import { useState } from 'react'

interface EventFormProps {
  onSubmit: (eventData: {
    summary: string
    description?: string
    start: { dateTime: string }
    end: { dateTime: string }
  }) => void
  onCancel: () => void
  initialData?: {
    summary?: string
    description?: string
    start?: string
    end?: string
  }
}

export default function EventForm({ onSubmit, onCancel, initialData }: EventFormProps) {
  const [summary, setSummary] = useState(initialData?.summary || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [startDateTime, setStartDateTime] = useState(
    initialData?.start || new Date().toISOString().slice(0, 16)
  )
  const [endDateTime, setEndDateTime] = useState(
    initialData?.end || new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!summary.trim()) {
      alert('กรุณากรอกชื่อกิจกรรม')
      return
    }

    onSubmit({
      summary: summary.trim(),
      description: description.trim() || undefined,
      start: { dateTime: new Date(startDateTime).toISOString() },
      end: { dateTime: new Date(endDateTime).toISOString() }
    })
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900/50 to-gray-700/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-500 scale-100 opacity-100 border border-gray-200/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">
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

          <div className="flex gap-3 pt-6">
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
