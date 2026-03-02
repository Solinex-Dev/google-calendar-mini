'use client'

import React, { useState } from 'react'

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
    start?: { dateTime?: string; date?: string }
    end?: { dateTime?: string; date?: string }
    reminders?: {
      useDefault: boolean
      overrides?: Array<{
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
  const formatDateTimeLocal = (dateObj?: { dateTime?: string; date?: string }) => {
    if (!dateObj) {
      // Return current time in user's local timezone
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }
    
    const dateStr = dateObj.dateTime || dateObj.date
    if (!dateStr) return ''
    
    const date = new Date(dateStr)
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
    initialData?.reminders?.overrides?.[0]?.minutes || 30
  )
  const [reminderUnit, setReminderUnit] = useState<'minutes' | 'hours' | 'days' | 'weeks'>('minutes')
  const [reminderValue, setReminderValue] = useState(30)
  const [reminders, setReminders] = useState<Array<{value: number, unit: 'minutes' | 'hours' | 'days' | 'weeks'}>>(
    () => {
      if (initialData?.reminders?.overrides) {
        const sortedReminders = initialData.reminders.overrides.map(override => {
          const minutes = override.minutes
          let value = minutes
          let unit: 'minutes' | 'hours' | 'days' | 'weeks' = 'minutes'
          
          if (minutes >= 10080) { // weeks
            value = Math.floor(minutes / 10080)
            unit = 'weeks'
          } else if (minutes >= 1440) { // days
            value = Math.floor(minutes / 1440)
            unit = 'days'
          } else if (minutes >= 60) { // hours
            value = Math.floor(minutes / 60)
            unit = 'hours'
          }
          
          return { value, unit } as {value: number, unit: 'minutes' | 'hours' | 'days' | 'weeks'}
        })
        
        // Sort by unit: minutes -> hours -> days -> weeks
        const unitOrder = { 'minutes': 1, 'hours': 2, 'days': 3, 'weeks': 4 }
        return sortedReminders.sort((a, b) => unitOrder[a.unit] - unitOrder[b.unit])
      }
      return [{ value: 30, unit: 'minutes' }]
    }
  )

  // Calculate total minutes based on unit and value
  const calculateReminderMinutes = (value: number, unit: 'minutes' | 'hours' | 'days' | 'weeks'): number => {
    switch (unit) {
      case 'minutes':
        return value
      case 'hours':
        return value * 60
      case 'days':
        return value * 24 * 60
      case 'weeks':
        return value * 7 * 24 * 60
      default:
        return value
    }
  }

  // Validate reminder doesn't exceed 1 month (28 days)
  const validateReminder = (minutes: number): boolean => {
    return minutes <= 28 * 24 * 60 // 28 days in minutes
  }

  // Add reminder functions
  const addReminder = () => {
    if (reminders.length < 5) {
      setReminders([...reminders, { value: 30, unit: 'minutes' }])
    }
  }

  const removeReminder = (index: number) => {
    if (reminders.length > 1) {
      setReminders(reminders.filter((_, i) => i !== index))
    }
  }

  const updateReminder = (index: number, field: 'value' | 'unit', newValue: number | 'minutes' | 'hours' | 'days' | 'weeks') => {
    const updatedReminders = [...reminders]
    if (field === 'value') {
      updatedReminders[index].value = newValue as number
    } else {
      updatedReminders[index].unit = newValue as 'minutes' | 'hours' | 'days' | 'weeks'
    }
    setReminders(updatedReminders)
  }

  // Dynamic validation
  const [inputErrors, setInputErrors] = useState<{[key: number]: string}>({})

  const validateInput = (index: number, value: number, unit: string) => {
    const maxValue = unit === 'weeks' ? 4 : unit === 'days' ? 28 : unit === 'hours' ? 24 : 60
    const unitNames: { weeks: 'สัปดาห์', days: 'วัน', hours: 'ชั่วโมง', minutes: 'นาที' } = { weeks: 'สัปดาห์', days: 'วัน', hours: 'ชั่วโมง', minutes: 'นาที' }
    
    if (value > maxValue) {
      setInputErrors((prev: {[key: number]: string}) => ({
        ...prev,
        [index]: `ไม่สามารถเกิน ${maxValue} ${unitNames[unit as keyof typeof unitNames]}`
      }))
      return false
    }
    
    setInputErrors((prev: {[key: number]: string}) => ({
      ...prev,
      [index]: ''
    }))
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!summary.trim()) {
      alert('กรุณากรอกชื่อกิจกรรม')
      return
    }

    // Convert reminders array to Google Calendar format
    const reminderOverrides = reminders.map(reminder => ({
      method: 'email' as const,
      minutes: calculateReminderMinutes(reminder.value, reminder.unit)
    }))

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
        overrides: reminderOverrides
      }
    }

    onSubmit(eventData)
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900/50 to-gray-700/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-500 scale-100 opacity-100 border border-gray-200/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">
            {initialData ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรมใหม่'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-bold"
          >
            ×
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                แจ้งเตือนทางอีเมล ({reminders.length}/5)
              </label>
              {reminders.length < 5 && (
                <button
                  type="button"
                  onClick={addReminder}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md hover:from-green-600 hover:to-green-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105 border border-green-400/30"
                >
                  + เพิ่มแจ้งเตือน
                </button>
              )}
            </div>
            <div className="space-y-2">
              {reminders.map((reminder, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      max={reminder.unit === 'weeks' ? 4 : reminder.unit === 'days' ? 28 : reminder.unit === 'hours' ? 24 : 60}
                      value={reminder.value}
                      onChange={(e) => {
                        const newValue = Number(e.target.value)
                        if (validateInput(index, newValue, reminder.unit)) {
                          updateReminder(index, 'value', newValue)
                        }
                      }}
                      className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                        inputErrors[index] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <select
                      value={reminder.unit}
                      onChange={(e) => updateReminder(index, 'unit', e.target.value as 'minutes' | 'hours' | 'days' | 'weeks')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="minutes">นาที</option>
                      <option value="hours">ชั่วโมง</option>
                      <option value="days">วัน</option>
                      <option value="weeks">สัปดาห์</option>
                    </select>
                    {reminders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeReminder(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                  {inputErrors[index] && (
                    <p className="text-xs text-red-500" style={{marginLeft: '7rem'}}>{inputErrors[index]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 order-2 sm:order-1"
            >
              {initialData ? 'บันทึกการแก้ไข' : 'สร้างกิจกรรม'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-6 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 order-1 sm:order-2"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
