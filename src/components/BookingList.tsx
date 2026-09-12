import { useState } from 'react'
import { formatBRL, formatDateDisplay } from '../lib/format'
import { periodoLabel, totalNaoCompareceram, valorPessoasEsperado } from '../lib/schedule'
import type { Booking, PricingSettings } from '../types'

interface Props {
  bookings: Booking[]
  itemsTotalByBooking: Record<string, number>
  pricing: PricingSettings
  onCloseTable: (booking: Booking) => void
  onEdit: (booking: Booking) => void
  onDelete: (booking: Booking) => Promise<void>
  onManageItems: (booking: Booking) => void
  showDateColumns?: boolean
  sortAlpha?: boolean
  onToggleSort?: () => void
}

export function BookingList({
  bookings,
  itemsTotalByBooking,
  pricing,
  onCloseTable,
  onEdit,
  onDelete,
  onManageItems,
  showDateColumns = true,
  sortAlpha = false,
  onToggleSort,
}: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; stage: 1 | 2 } | null>(null)
  const [deleting, setDeleting] = useState(false)

  function totalGeral(booking: Booking) {
    return valorPessoasEsperado(booking, pricing) + (itemsTotalByBooking[booking.id] ?? 0)
  }

  function handleDeleteClick(booking: Booking) {
    if (!deleteConfirm || deleteConfirm.id !== booking.id) {
      setDeleteConfirm({ id: booking.id, stage: 1 })
      return
    }
    if (deleteConfirm.stage === 1) {
      setDeleteConfirm({ id: booking.id, stage: 2 })
      return
    }
    setDeleting(true)
    onDelete(booking).finally(() => {
      setDeleting(false)
      setDeleteConfirm(null)
    })
  }

  if (bookings.length === 0) {
    return <p className="py-10 text-center text-sm text-earth-500">Nenhum agendamento encontrado.</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-earth-200 bg-white">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="bg-sun-100/60 text-xs uppercase tracking-wide text-earth-600">
          <tr>
            <th className="whitespace-nowrap px-4 py-3">
              {onToggleSort ? (
                <button
                  onClick={onToggleSort}
                  className="flex items-center gap-1 whitespace-nowrap uppercase tracking-wide text-earth-600 hover:text-earth-900"
                >
                  Cliente <span className="text-earth-400">{sortAlpha ? '▲ A-Z' : '⇅'}</span>
                </button>
              ) : (
                'Cliente'
              )}
            </th>
            <th className="px-4 py-3">Telefone</th>
            {showDateColumns && <th className="px-4 py-3">Data</th>}
            {showDateColumns && <th className="px-4 py-3">Período</th>}
            <th className="px-4 py-3">Pessoas</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Pago</th>
            <th className="px-4 py-3">Valor a Pagar</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-earth-100">
          {bookings.map((booking) => {
            const total = totalGeral(booking)
            const saldo = total - booking.valor_pago
            const pagoTotal = saldo <= 0.009
            const entradaEsperada = booking.valor_pessoas / 2
            const naoCompareceram = totalNaoCompareceram(booking)
            const status = pagoTotal
              ? naoCompareceram > 0
                ? { label: 'Fechado', classes: 'bg-field-100 text-field-700' }
                : { label: 'Pago total', classes: 'bg-field-100 text-field-700' }
              : booking.valor_pago <= 0.009
                ? { label: 'Entrada não paga', classes: 'bg-red-100 text-red-700' }
                : booking.valor_pago < entradaEsperada - 0.009
                  ? { label: 'Entrada paga parcial', classes: 'bg-sun-100 text-sun-700' }
                  : { label: 'Entrada paga', classes: 'bg-sun-200 text-sun-800' }
            const totalPessoas = booking.qtd_adultos + booking.qtd_criancas + booking.qtd_gratuitos
            const itensTotal = itemsTotalByBooking[booking.id] ?? 0
            return (
              <tr key={booking.id} className="align-top">
                <td className="px-4 py-3 font-medium text-earth-900">
                  {booking.nome}
                  {booking.observacao && (
                    <p className="mt-0.5 max-w-[220px] whitespace-normal text-xs font-normal italic text-earth-500">
                      📝 {booking.observacao}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-earth-600">{booking.telefone || '—'}</td>
                {showDateColumns && (
                  <td className="whitespace-nowrap px-4 py-3 text-earth-600">
                    {formatDateDisplay(booking.data_agendamento)}
                  </td>
                )}
                {showDateColumns && (
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
                        booking.periodo === 'manha' ? 'bg-sun-100 text-sun-800' : 'bg-field-100 text-field-700'
                      }`}
                    >
                      {periodoLabel(booking.periodo)}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3 text-earth-600">
                  <span>{totalPessoas}</span>
                  <div className="text-xs text-earth-400">
                    {booking.qtd_adultos > 0 && <span>{booking.qtd_adultos} adulto(s)</span>}
                    {booking.qtd_criancas > 0 && <span> · {booking.qtd_criancas} criança</span>}
                    {booking.qtd_gratuitos > 0 && <span> · {booking.qtd_gratuitos} gratuito(s)</span>}
                  </div>
                  {naoCompareceram > 0 && (
                    <div className="text-xs text-red-500">
                      {booking.qtd_adultos_nao_compareceram > 0 && <span>{booking.qtd_adultos_nao_compareceram} adulto(s)</span>}
                      {booking.qtd_adultos_nao_compareceram > 0 && booking.qtd_criancas_nao_compareceram > 0 && <span> · </span>}
                      {booking.qtd_criancas_nao_compareceram > 0 && <span>{booking.qtd_criancas_nao_compareceram} criança(s)</span>}
                      {' '}não veio
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-earth-600">
                  {formatBRL(total)}
                  {itensTotal > 0 && <div className="text-xs text-earth-400">inclui {formatBRL(itensTotal)} em produtos</div>}
                  {naoCompareceram > 0 && (
                    <div className="text-xs text-earth-400">
                      já descontado quem não veio (<span className="line-through">{formatBRL(booking.valor_pessoas + itensTotal)}</span>)
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-earth-600">{formatBRL(booking.valor_pago)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-earth-600">{formatBRL(Math.max(saldo, 0))}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${status.classes}`}>
                    {status.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onCloseTable(booking)}
                      className={`whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium text-white ${
                        pagoTotal ? 'bg-field-600 hover:bg-field-700' : 'bg-earth-800 hover:bg-earth-700'
                      }`}
                    >
                      {pagoTotal ? 'Ver pagamentos' : 'Fechar mesa'}
                    </button>
                    <button
                      onClick={() => onManageItems(booking)}
                      className="whitespace-nowrap rounded-lg bg-field-600 px-2 py-1 text-xs font-medium text-white hover:bg-field-700"
                    >
                      Produtos
                    </button>
                    <button
                      onClick={() => onEdit(booking)}
                      className="whitespace-nowrap rounded-lg border border-earth-200 bg-white px-2 py-1 text-xs font-medium text-earth-600 hover:bg-earth-50"
                    >
                      Editar
                    </button>
                    {deleteConfirm?.id === booking.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteClick(booking)}
                          disabled={deleting}
                          className="whitespace-nowrap rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {deleting
                            ? 'Excluindo...'
                            : deleteConfirm.stage === 1
                              ? 'Confirmar exclusão?'
                              : 'Tem certeza? Excluir de vez'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="whitespace-nowrap rounded-lg px-2 py-1 text-xs text-earth-500 hover:bg-earth-100"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(booking)}
                        className="whitespace-nowrap rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
