import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatBRL } from '../lib/format'
import { valorPessoasEsperado } from '../lib/schedule'
import type { Booking, BookingItem } from '../types'

interface Props {
  bookings: Booking[]
  items: BookingItem[]
}

const MESES = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

function monthKey(isoDate: string) {
  return isoDate.slice(0, 7)
}

function monthLabel(key: string) {
  const [year, month] = key.split('-')
  return `${MESES[Number(month) - 1]}/${year.slice(2)}`
}

export function RevenueDashboard({ bookings, items }: Props) {
  const itemsTotalByBooking = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of items) {
      map[item.booking_id] = (map[item.booking_id] ?? 0) + item.quantidade * item.valor_unitario
    }
    return map
  }, [items])

  const monthly = useMemo(() => {
    const map = new Map<string, { recebido: number; pendente: number; faturado: number }>()
    for (const booking of bookings) {
      const key = monthKey(booking.data_agendamento)
      const total = valorPessoasEsperado(booking) + (itemsTotalByBooking[booking.id] ?? 0)
      const recebido = Math.min(booking.valor_pago, total)
      const pendente = Math.max(total - booking.valor_pago, 0)
      const current = map.get(key) ?? { recebido: 0, pendente: 0, faturado: 0 }
      current.recebido += recebido
      current.pendente += pendente
      current.faturado += total
      map.set(key, current)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ key, label: monthLabel(key), ...value }))
  }, [bookings, itemsTotalByBooking])

  const currentMonthKey = new Date().toISOString().slice(0, 7)
  const currentMonth = monthly.find((m) => m.key === currentMonthKey)

  const totalGeral = monthly.reduce((sum, m) => sum + m.faturado, 0)
  const totalRecebido = monthly.reduce((sum, m) => sum + m.recebido, 0)
  const totalPendente = monthly.reduce((sum, m) => sum + m.pendente, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faturamento do mês" value={formatBRL(currentMonth?.faturado ?? 0)} accent="sun" />
        <StatCard label="Recebido no mês" value={formatBRL(currentMonth?.recebido ?? 0)} accent="field" />
        <StatCard label="A receber no mês" value={formatBRL(currentMonth?.pendente ?? 0)} accent="earth" />
        <StatCard label="Faturamento total" value={formatBRL(totalGeral)} accent="sun" />
      </div>

      <div className="rounded-2xl border border-earth-200 bg-white p-4">
        <h3 className="mb-4 font-script text-xl text-earth-900">Evolução mensal do faturamento</h3>
        {monthly.length === 0 ? (
          <p className="py-10 text-center text-sm text-earth-500">Sem dados suficientes ainda.</p>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2d3b8" />
                <XAxis dataKey="label" stroke="#7a5c3a" fontSize={12} />
                <YAxis stroke="#7a5c3a" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(value) => formatBRL(Number(value))} />
                <Legend />
                <Bar dataKey="recebido" name="Recebido" stackId="a" fill="#e2911a" radius={[0, 0, 4, 4]} />
                <Bar dataKey="pendente" name="A receber" stackId="a" fill="#cbb287" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-earth-200 bg-white p-4 text-sm text-earth-600">
        <div className="flex justify-between border-b border-earth-100 py-2">
          <span>Total recebido (todos os meses)</span>
          <span className="font-semibold text-earth-900">{formatBRL(totalRecebido)}</span>
        </div>
        <div className="flex justify-between py-2">
          <span>Total a receber (todos os meses)</span>
          <span className="font-semibold text-earth-900">{formatBRL(totalPendente)}</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: 'sun' | 'field' | 'earth' }) {
  const accentClasses = {
    sun: 'border-sun-200 bg-sun-50',
    field: 'border-field-100 bg-field-50',
    earth: 'border-earth-200 bg-earth-50',
  }[accent]
  return (
    <div className={`rounded-2xl border p-4 ${accentClasses}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-earth-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-earth-900">{value}</p>
    </div>
  )
}
