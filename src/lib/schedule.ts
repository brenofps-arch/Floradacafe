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

/**
 * Valor de pessoas esperado descontando quem não compareceu.
 * A entrada (50%) já paga fica retida, mas os outros 50% de quem faltou não são cobrados.
 */
export function valorPessoasEsperado(
  booking: Pick<Booking, 'qtd_adultos' | 'qtd_criancas' | 'qtd_gratuitos' | 'qtd_nao_compareceram' | 'valor_pessoas'>,
) {
  const total = totalPessoas(booking)
  if (total <= 0 || booking.qtd_nao_compareceram <= 0) return booking.valor_pessoas
  const precoMedio = booking.valor_pessoas / total
  const faltantes = Math.min(booking.qtd_nao_compareceram, total)
  const abatimento = precoMedio * faltantes * 0.5
  return Math.max(booking.valor_pessoas - abatimento, 0)
}
