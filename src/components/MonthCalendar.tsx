import { useMemo } from 'react'
import { totalPessoas } from '../lib/schedule'
import type { Booking } from '../types'

interface Props {
  monthDate: Date
  bookings: Booking[]
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
  onMonthChange: (date: Date) => void
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function isoOf(year: number, monthIndex: number, day: number) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
}

export function MonthCalendar({ monthDate, bookings, selectedDate, onSelectDate, onMonthChange }: Props) {
  const year = monthDate.getFullYear()
  const monthIndex = monthDate.getMonth()

  const perDay = useMemo(() => {
    const map = new Map<string, { manha: number; tarde: number }>()
    for (const booking of bookings) {
      const current = map.get(booking.data_agendamento) ?? { manha: 0, tarde: 0 }
      current[booking.periodo] += totalPessoas(booking)
      map.set(booking.data_agendamento, current)
    }
    return map
  }, [bookings])

  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

  const cells: Array<{ day: number; iso: string } | null> = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push({ day, iso: isoOf(year, monthIndex, day) })

  const todayIso = new Date().toISOString().slice(0, 10)

  return (
    <div className="rounded-2xl border border-earth-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
          className="rounded-lg px-3 py-1.5 text-earth-600 hover:bg-earth-100"
        >
          ‹
        </button>
        <h3 className="font-script text-xl text-earth-900">
          {MESES[monthIndex]} {year}
        </h3>
        <button
          onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
          className="rounded-lg px-3 py-1.5 text-earth-600 hover:bg-earth-100"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase text-earth-400">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell) return <div key={`empty-${idx}`} />
          const weekday = new Date(year, monthIndex, cell.day).getDay()
          const isWeekend = weekday === 0 || weekday === 6
          const totals = perDay.get(cell.iso)
          const isSelected = selectedDate === cell.iso
          const isToday = cell.iso === todayIso

          return (
            <button
              key={cell.iso}
              onClick={() => onSelectDate(isSelected ? null : cell.iso)}
              className={`flex min-h-[64px] flex-col items-center rounded-lg border p-1 text-left transition ${
                isSelected
                  ? 'border-sun-500 bg-sun-100'
                  : isWeekend
                    ? 'border-field-100 bg-field-50 hover:bg-field-100'
                    : 'border-earth-100 bg-white hover:bg-earth-50'
              }`}
            >
              <span className={`text-sm ${isToday ? 'font-bold text-sun-700' : 'text-earth-700'}`}>{cell.day}</span>
              {totals && (
                <span className="mt-1 flex flex-col gap-0.5 text-[10px] leading-tight">
                  {totals.manha > 0 && <span className="rounded bg-sun-200 px-1 text-sun-800">M {totals.manha}</span>}
                  {totals.tarde > 0 && <span className="rounded bg-field-100 px-1 text-field-700">T {totals.tarde}</span>}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
