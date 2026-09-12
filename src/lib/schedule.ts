import type { Booking, Periodo, PricingSettings } from '../types'

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

export function totalNaoCompareceram(
  booking: Pick<Booking, 'qtd_adultos_nao_compareceram' | 'qtd_criancas_nao_compareceram'>,
) {
  return booking.qtd_adultos_nao_compareceram + booking.qtd_criancas_nao_compareceram
}

/**
 * Valor de pessoas esperado descontando quem não compareceu, por categoria
 * (adulto ou criança, cada um com seu próprio preço).
 * A entrada (50%) já paga fica retida, mas os outros 50% de quem faltou não são cobrados.
 */
export function valorPessoasEsperado(
  booking: Pick<
    Booking,
    'qtd_adultos' | 'qtd_criancas' | 'qtd_adultos_nao_compareceram' | 'qtd_criancas_nao_compareceram' | 'valor_pessoas'
  >,
  pricing: Pick<PricingSettings, 'valor_adulto' | 'valor_crianca'>,
) {
  const adultosFaltantes = Math.min(booking.qtd_adultos_nao_compareceram, booking.qtd_adultos)
  const criancasFaltantes = Math.min(booking.qtd_criancas_nao_compareceram, booking.qtd_criancas)
  if (adultosFaltantes <= 0 && criancasFaltantes <= 0) return booking.valor_pessoas
  const abatimento = (adultosFaltantes * pricing.valor_adulto + criancasFaltantes * pricing.valor_crianca) * 0.5
  return Math.max(booking.valor_pessoas - abatimento, 0)
}
