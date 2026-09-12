import type { FormaPagamento } from '../types'

export const FORMAS_PAGAMENTO: FormaPagamento[] = ['dinheiro', 'pix', 'credito', 'debito']

export function formaPagamentoLabel(forma: FormaPagamento) {
  switch (forma) {
    case 'dinheiro':
      return 'Dinheiro'
    case 'pix':
      return 'PIX'
    case 'credito':
      return 'Crédito'
    case 'debito':
      return 'Débito'
  }
}
