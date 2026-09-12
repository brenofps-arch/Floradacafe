import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { formatBRL, formatTelefone } from '../lib/format'
import { FORMAS_PAGAMENTO, formaPagamentoLabel } from '../lib/payments'
import { allowedPeriodos, periodoLabel, totalPessoas as sumPessoas } from '../lib/schedule'
import type { Booking, BookingInput, FormaPagamento, Periodo, PricingSettings } from '../types'

interface Props {
  pricing: PricingSettings
  bookings: Booking[]
  variant?: 'reserva' | 'extra'
  onSubmit: (
    input: BookingInput,
    entradaForma: FormaPagamento | null,
    entradaPagante: string | null,
    comprovante: File | null,
  ) => Promise<void>
  onClose: () => void
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function BookingForm({ pricing, bookings, variant = 'reserva', onSubmit, onClose }: Props) {
  const isExtra = variant === 'extra'
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataAgendamento, setDataAgendamento] = useState(todayIso())
  const [periodo, setPeriodo] = useState<Periodo>('tarde')
  const [qtdAdultos, setQtdAdultos] = useState('1')
  const [qtdCriancas, setQtdCriancas] = useState('0')
  const [qtdGratuitos, setQtdGratuitos] = useState('0')
  const [valorPago, setValorPago] = useState('')
  const [formaPagamentoEntrada, setFormaPagamentoEntrada] = useState<FormaPagamento>('pix')
  const [pagante, setPagante] = useState('')
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [observacao, setObservacao] = useState('')
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

  const sugestaoEntrada = (isExtra ? valorCalculado : valorCalculado / 2).toFixed(2).replace('.', ',')

  const jaAgendados = useMemo(() => {
    return bookings
      .filter((b) => b.data_agendamento === dataAgendamento && b.periodo === periodo)
      .reduce((sum, b) => sum + sumPessoas(b), 0)
  }, [bookings, dataAgendamento, periodo])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const pago = Number((valorPago || '0').replace(',', '.'))

    if (!isExtra && (!nome.trim() || !telefone.trim())) {
      setError('Preencha nome e telefone.')
      return
    }
    if (totalPessoas <= 0) {
      setError('Informe ao menos 1 pessoa.')
      return
    }
    if (Number.isNaN(pago) || pago < 0) {
      setError('Informe um valor de entrada válido.')
      return
    }

    setSaving(true)
    try {
      await onSubmit(
        {
          nome: isExtra ? nome.trim() || 'Extra' : nome.trim(),
          telefone: isExtra ? '' : telefone.trim(),
          data_agendamento: dataAgendamento,
          periodo,
          qtd_adultos: adultos,
          qtd_criancas: criancas,
          qtd_gratuitos: gratuitos,
          valor_pessoas: valorCalculado,
          valor_pago: pago,
          observacao: observacao.trim() || null,
        },
        pago > 0 ? formaPagamentoEntrada : null,
        pago > 0 ? pagante.trim() || null : null,
        pago > 0 ? comprovante : null,
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar agendamento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-earth-900/40 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-sun-50 p-6 shadow-lg">
        <h2 className="mb-4 font-script text-2xl text-earth-900">{isExtra ? 'Adicionar extra' : 'Novo agendamento'}</h2>
        {isExtra && (
          <p className="-mt-2 mb-3 text-xs text-earth-500">
            Para quem chegou sem reserva — não precisa de nome nem telefone.
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {!isExtra && (
            <>
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
            </>
          )}
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

          {jaAgendados > 0 && (
            <p className="rounded-lg bg-earth-100 px-3 py-2 text-xs text-earth-600">
              👥 Já há <strong>{jaAgendados} pessoa(s)</strong> agendada(s) para este dia, período da {periodoLabel(periodo).toLowerCase()}.
            </p>
          )}

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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-earth-700">
                {isExtra ? 'Valor pago (R$)' : 'Entrada paga (R$)'}{' '}
                <span className="font-normal text-earth-400">
                  — {isExtra ? 'total' : '50%'}: {sugestaoEntrada}
                </span>
              </label>
              <input
                inputMode="decimal"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                placeholder={sugestaoEntrada}
                className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-earth-700">Forma de pagamento</label>
              <select
                value={formaPagamentoEntrada}
                onChange={(e) => setFormaPagamentoEntrada(e.target.value as FormaPagamento)}
                className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
              >
                {FORMAS_PAGAMENTO.map((f) => (
                  <option key={f} value={f}>
                    {formaPagamentoLabel(f)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {Number((valorPago || '0').replace(',', '.')) > 0 && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-earth-700">
                  Nome de quem pagou (opcional) <span className="font-normal text-earth-400">— útil quando é outra pessoa do grupo</span>
                </label>
                <input
                  value={pagante}
                  onChange={(e) => setPagante(e.target.value)}
                  placeholder="Ex.: irmã da noiva"
                  className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-earth-700">
                  Print do comprovante (opcional) <span className="font-normal text-earth-400">— pode inserir depois</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setComprovante(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-earth-100 file:px-2 file:py-1 file:text-xs focus:border-sun-500 focus:outline-none"
                />
              </div>
            </>
          )}
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
              {saving ? 'Salvando...' : isExtra ? 'Adicionar extra' : 'Salvar agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
