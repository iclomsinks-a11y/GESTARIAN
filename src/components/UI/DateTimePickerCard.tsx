import React, { useState } from 'react'
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X, Check } from 'lucide-react'

interface DateTimePickerCardProps {
  initialDate?: string
  initialTime?: string
  onSelect: (date: string, time: string) => void
  onClose: () => void
}

export const DateTimePickerCard: React.FC<DateTimePickerCardProps> = ({
  initialDate,
  initialTime = '09:00',
  onSelect,
  onClose
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  )
  const [selectedHour, setSelectedHour] = useState<number>(
    parseInt(initialTime.split(':')[0], 10) || 9
  )
  const [selectedMinute, setSelectedMinute] = useState<number>(
    parseInt(initialTime.split(':')[1], 10) || 0
  )
  const [step, setStep] = useState<'hours' | 'minutes'>('hours')

  // Horas de apertura del taller (08:00 a 20:00)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8)
  const minutes = [0, 15, 30, 45]

  const handleHourClick = (h: number) => {
    setSelectedHour(h)
    setStep('minutes')
  }

  const handleMinuteClick = (m: number) => {
    setSelectedMinute(m)
    const formattedHour = String(selectedHour).padStart(2, '0')
    const formattedMinute = String(m).padStart(2, '0')
    onSelect(selectedDate, `${formattedHour}:${formattedMinute}`)
  }

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-white max-w-sm mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4 text-cyan-400" /> Proponga fecha de entrega
        </span>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selector de Fecha */}
      <div>
        <label className="text-xs text-slate-400 font-semibold block mb-1">Fecha seleccionada:</label>
        <input 
          type="date"
          value={selectedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none focus:border-cyan-400"
        />
      </div>

      {/* Selector de Hora Circular / Grid 2x */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-slate-400 font-semibold">
            {step === 'hours' ? '1. Seleccione la Hora' : '2. Seleccione los Minutos'}
          </label>
          <span className="text-xs font-mono font-black text-cyan-400">
            {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')} h
          </span>
        </div>

        {step === 'hours' ? (
          <div className="grid grid-cols-4 gap-2">
            {hours.map((h) => (
              <button
                key={h}
                onClick={() => handleHourClick(h)}
                className={`py-3 rounded-xl font-black text-2xl transition-all cursor-pointer ${
                  selectedHour === h 
                    ? 'bg-cyan-500 text-slate-950 shadow-lg scale-105' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {String(h).padStart(2, '0')}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {minutes.map((m) => (
                <button
                  key={m}
                  onClick={() => handleMinuteClick(m)}
                  className={`py-3.5 rounded-xl font-black text-3xl transition-all cursor-pointer ${
                    selectedMinute === m 
                      ? 'bg-emerald-500 text-slate-950 shadow-lg scale-105' 
                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                  }`}
                >
                  :{String(m).padStart(2, '0')}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep('hours')}
              className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold transition-colors"
            >
              ← Volver a cambiar hora
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
