import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { formatBRL, formatTelefone } from '../lib/format'
import { allowedPeriodos, periodoLabel } from '../lib/schedule'
import type { Booking, Periodo, PricingSettings } from '../types'

export interface BookingEditPatch {
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
}

interface Props {
  booking: Booking
  pricing: PricingSettings
  onSave: (bookingId: string, patch: BookingEditPatch) => Promise<void>
  onClose: () => void
}

export function EditBookingModal({ booking, pricing, onSave, onClose }: Props) {
  const [nome, setNome] = useState(booking.nome)
  const [telefone, setTelefone] = useState(booking.telefone)
  const [dataAgendamento, setDataAgendamento] = useState(booking.data_agendamento)
  const [periodo, setPeriodo] = useState<Periodo>(booking.periodo)
  const [qtdAdultos, setQtdAdultos] = useState(String(booking.qtd_adultos))
  const [qtdCriancas, setQtdCriancas] = useState(String(booking.qtd_criancas))
  const [qtdGratuitos, setQtdGratuitos] = useState(String(booking.qtd_gratuitos))
  const [valorPago, setValorPago] = useState(booking.valor_pago.toFixed(2).replace('.', ','))
  const [observacao, setObservacao] = useState(booking.observacao ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const opcoesPeriodo = useMemo(() => allowedPeriodos(dataAgendamento), [dataAgendamento])

  useEffect(() => {
    if (!opcoesPeriodo.includes(periodo)) {
      setPeriodo(opcoesPeriodo[0])
    }
  }, [opcoesPeriodo, periodo])

  const adultos = Number(qtdAdultos) || 0
  const criancas = Number(qtdCriancas) || 0
  const gratuitos = Number(qtdGratuitos) || 0
  const totalPessoas = adultos + criancas + gratuitos

  const valorCalculado = useMemo(
    () => adultos * pricing.valor_adulto + criancas * pricing.valor_crianca,
    [adultos, criancas, pricing],
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nome.trim() || !telefone.trim()) {
      setError('Preencha nome e telefone.')
      return
    }
    if (totalPessoas <= 0) {
      setError('Informe ao menos 1 pessoa.')
      return
    }
    const pago = Number(valorPago.replace(',', '.'))
    if (Number.isNaN(pago) || pago < 0) {
      setError('Informe um valor pago válido.')
      return
    }

    setSaving(true)
    try {
      await onSave(booking.id, {
        nome: nome.trim(),
        telefone: telefone.trim(),
        data_agendamento: dataAgendamento,
        periodo,
        qtd_adultos: adultos,
        qtd_criancas: criancas,
        qtd_gratuitos: gratuitos,
        valor_pessoas: valorCalculado,
        valor_pago: pago,
        observacao: observacao.trim() || null,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao editar agendamento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-earth-900/40 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-sun-50 p-6 shadow-lg">
        <h2 className="mb-4 font-script text-2xl text-earth-900">Editar agendamento</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-earth-700">Nome do cliente</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-earth-700">WhatsApp / Telefone</label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(formatTelefone(e.target.value))}
              placeholder="(11) 91234-5678"
              inputMode="numeric"
              className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-earth-700">Data</label>
              <input
                type="date"
                value={dataAgendamento}
                onChange={(e) => setDataAgendamento(e.target.value)}
                className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-earth-700">Período</label>
              {opcoesPeriodo.length === 1 ? (
                <div className="flex h-[38px] items-center rounded-lg border border-earth-200 bg-earth-50 px-3 text-sm text-earth-600">
                  {periodoLabel(opcoesPeriodo[0])} (sábado)
                </div>
              ) : (
                <div className="flex gap-1">
                  {opcoesPeriodo.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPeriodo(opt)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        periodo === opt
                          ? 'border-sun-500 bg-sun-500 text-white'
                          : 'border-earth-200 bg-white text-earth-600 hover:bg-earth-50'
                      }`}
                    >
                      {periodoLabel(opt)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-field-100 bg-field-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-field-700">Pessoas na reserva</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-xs text-earth-600">Adultos ({formatBRL(pricing.valor_adulto)})</label>
                <input
                  type="number"
                  min={0}
                  value={qtdAdultos}
                  onChange={(e) => setQtdAdultos(e.target.value)}
                  className="w-full rounded-lg border border-earth-200 bg-white px-2 py-2 text-sm focus:border-sun-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-earth-600">Criança ({formatBRL(pricing.valor_crianca)})</label>
                <input
                  type="number"
                  min={0}
                  value={qtdCriancas}
                  onChange={(e) => setQtdCriancas(e.target.value)}
                  className="w-full rounded-lg border border-earth-200 bg-white px-2 py-2 text-sm focus:border-sun-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-earth-600">Gratuitos (R$ 0)</label>
                <input
                  type="number"
                  min={0}
                  value={qtdGratuitos}
                  onChange={(e) => setQtdGratuitos(e.target.value)}
                  className="w-full rounded-lg border border-earth-200 bg-white px-2 py-2 text-sm focus:border-sun-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-earth-600">{totalPessoas} pessoa(s) no total</span>
              <span className="font-semibold text-earth-900">{formatBRL(valorCalculado)}</span>
            </div>
            {valorCalculado !== booking.valor_pessoas && (
              <p className="mt-1 text-xs text-earth-400">
                Valor anterior era {formatBRL(booking.valor_pessoas)} — será atualizado para {formatBRL(valorCalculado)}.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-earth-700">
              Valor pago (R$) <span className="font-normal text-earth-400">— total já recebido</span>
            </label>
            <input
              inputMode="decimal"
              value={valorPago}
              onChange={(e) => setValorPago(e.target.value)}
              className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
            />
            {Number(valorPago.replace(',', '.')) !== booking.valor_pago && !Number.isNaN(Number(valorPago.replace(',', '.'))) && (
              <p className="mt-1 text-xs text-earth-400">
                Isso vai lançar um ajuste de pagamento para bater com o novo valor. Para detalhar a forma de pagamento, use
                "Fechar mesa".
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-earth-700">Observação (opcional)</label>
            <input
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex.: fechou o espaço, aniversário — dar um brinde"
              className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-earth-600 hover:bg-earth-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-sun-500 px-4 py-2 text-sm font-medium text-white hover:bg-sun-600 disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
