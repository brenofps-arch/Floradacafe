import type { Booking, Periodo } from '../types'

export function weekdayOf(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).getDay() // 0 = domingo, 6 = sábado
}

export function isSaturday(isoDate: string) {
  return weekdayOf(isoDate) === 6
}

export function allowedPeriodos(isoDate: string): Periodo[] {
  return isSaturday(isoDate) ? ['tarde'] : ['manha', 'tarde']
}

export function periodoLabel(periodo: Periodo) {
  return periodo === 'manha' ? 'Manhã' : 'Tarde'
}

export function totalPessoas(booking: Pick<Booking, 'qtd_adultos' | 'qtd_criancas' | 'qtd_gratuitos'>) {
  return booking.qtd_adultos + booking.qtd_criancas + booking.qtd_gratuitos
}
