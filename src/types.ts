export type Periodo = 'manha' | 'tarde'

export interface Booking {
  id: string
  nome: string
  telefone: string
  data_agendamento: string
  periodo: Periodo
  qtd_adultos: number
  qtd_criancas: number
  qtd_gratuitos: number
  valor_pessoas: number
  valor_pago: number
  observacao: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type BookingInput = Pick<
  Booking,
  | 'nome'
  | 'telefone'
  | 'data_agendamento'
  | 'periodo'
  | 'qtd_adultos'
  | 'qtd_criancas'
  | 'qtd_gratuitos'
  | 'valor_pessoas'
  | 'valor_pago'
  | 'observacao'
>

export interface BookingItem {
  id: string
  booking_id: string
  descricao: string
  quantidade: number
  valor_unitario: number
  created_at: string
}

export type BookingItemInput = Pick<BookingItem, 'booking_id' | 'descricao' | 'quantidade' | 'valor_unitario'>

export interface PricingSettings {
  id: number
  valor_adulto: number
  valor_crianca: number
  updated_at: string
}

export type FormaPagamento = 'dinheiro' | 'pix' | 'credito' | 'debito'

export interface BookingPayment {
  id: string
  booking_id: string
  forma_pagamento: FormaPagamento
  valor: number
  comprovante_url: string | null
  pagante: string | null
  created_at: string
}

export type BookingPaymentInput = Pick<BookingPayment, 'booking_id' | 'forma_pagamento' | 'valor' | 'pagante'>

export type Role = 'administrador' | 'colaborador'

export interface Profile {
  id: string
  role: Role
  created_at: string
}

export interface MenuItem {
  id: string
  nome: string
  valor: number
  created_at: string
}

export type MenuItemInput = Pick<MenuItem, 'nome' | 'valor'>
