import { useMemo, useState } from 'react'
import { formatBRL } from '../lib/format'
import { FORMAS_PAGAMENTO, formaPagamentoLabel } from '../lib/payments'
import type { Booking, BookingPayment, FormaPagamento } from '../types'

interface NewEntry {
  forma_pagamento: FormaPagamento
  valor: number
  pagante: string | null
  comprovante: File | null
}

interface EditEntry {
  forma_pagamento: FormaPagamento
  valor: number
  pagante: string | null
}

interface Props {
  booking: Booking
  itemsTotal: number
  payments: BookingPayment[]
  onAddPayments: (entries: NewEntry[]) => Promise<void>
  onEditPayment: (payment: BookingPayment, patch: EditEntry) => Promise<void>
  onDeletePayment: (payment: BookingPayment) => Promise<void>
  onAttachComprovante: (payment: BookingPayment, file: File) => Promise<void>
  onClose: () => void
}

interface Row {
  forma_pagamento: FormaPagamento
  valor: string
  pagante: string
  comprovante: File | null
}

export function CloseTableModal({
  booking,
  itemsTotal,
  payments,
  onAddPayments,
  onEditPayment,
  onDeletePayment,
  onAttachComprovante,
  onClose,
}: Props) {
  const totalGeral = booking.valor_pessoas + itemsTotal
  const saldo = Math.max(totalGeral - booking.valor_pago, 0)

  const [rows, setRows] = useState<Row[]>([
    { forma_pagamento: 'pix', valor: saldo > 0 ? saldo.toFixed(2).replace('.', ',') : '', pagante: '', comprovante: null },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachingId, setAttachingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<{ forma_pagamento: FormaPagamento; valor: string; pagante: string } | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const totalDigitado = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.valor.replace(',', '.')) || 0), 0),
    [rows],
  )
  const diferenca = Math.round((saldo - totalDigitado) * 100) / 100

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, { forma_pagamento: 'dinheiro', valor: '', pagante: '', comprovante: null }])
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleConfirm() {
    setError(null)
    const entries = rows
      .map((r) => ({
        forma_pagamento: r.forma_pagamento,
        valor: Number(r.valor.replace(',', '.')),
        pagante: r.pagante.trim() || null,
        comprovante: r.comprovante,
      }))
      .filter((e) => !Number.isNaN(e.valor) && e.valor > 0)

    if (entries.length === 0) {
      setError('Informe ao menos um valor de pagamento.')
      return
    }

    setSaving(true)
    try {
      await onAddPayments(entries)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar pagamento.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAttach(payment: BookingPayment, file: File) {
    setAttachingId(payment.id)
    try {
      await onAttachComprovante(payment, file)
    } finally {
      setAttachingId(null)
    }
  }

  function startEdit(payment: BookingPayment) {
    setEditingId(payment.id)
    setEditRow({
      forma_pagamento: payment.forma_pagamento,
      valor: payment.valor.toFixed(2).replace('.', ','),
      pagante: payment.pagante ?? '',
    })
  }

  async function saveEdit(payment: BookingPayment) {
    if (!editRow) return
    const valor = Number(editRow.valor.replace(',', '.'))
    if (Number.isNaN(valor) || valor <= 0) {
      setError('Informe um valor válido para o pagamento.')
      return
    }
    setEditSaving(true)
    try {
      await onEditPayment(payment, {
        forma_pagamento: editRow.forma_pagamento,
        valor,
        pagante: editRow.pagante.trim() || null,
      })
      setEditingId(null)
      setEditRow(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao editar pagamento.')
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete(payment: BookingPayment) {
    if (deleteConfirmId !== payment.id) {
      setDeleteConfirmId(payment.id)
      return
    }
    await onDeletePayment(payment)
    setDeleteConfirmId(null)
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-earth-900/40 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-sun-50 p-6 shadow-lg">
        <h2 className="mb-1 font-script text-2xl text-earth-900">Fechar mesa</h2>
        <p className="mb-4 text-sm text-earth-600">{booking.nome}</p>

        <div className="mb-4 rounded-xl border border-earth-200 bg-white p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-earth-600">Pessoas</span>
            <span className="text-earth-900">{formatBRL(booking.valor_pessoas)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-earth-600">Produtos extras</span>
            <span className="text-earth-900">{formatBRL(itemsTotal)}</span>
          </div>
          <div className="flex justify-between border-t border-earth-100 py-1 font-medium">
            <span className="text-earth-700">Total geral</span>
            <span className="text-earth-900">{formatBRL(totalGeral)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-earth-600">Já pago</span>
            <span className="text-earth-900">{formatBRL(booking.valor_pago)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-sun-100 px-3 py-2">
            <span className="font-semibold text-earth-800">Falta pagar agora</span>
            <span className="text-xl font-bold text-sun-800">{formatBRL(saldo)}</span>
          </div>
        </div>

        {payments.length > 0 && (
          <div className="mb-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-earth-500">Pagamentos já registrados</p>
            <ul className="divide-y divide-earth-100 rounded-lg border border-earth-100 bg-white text-sm">
              {payments.map((p) =>
                editingId === p.id && editRow ? (
                  <li key={p.id} className="p-2">
                    <div className="flex gap-2">
                      <select
                        value={editRow.forma_pagamento}
                        onChange={(e) => setEditRow({ ...editRow, forma_pagamento: e.target.value as FormaPagamento })}
                        className="flex-1 rounded-lg border border-earth-200 bg-white px-2 py-1.5 text-sm focus:border-sun-500 focus:outline-none"
                      >
                        {FORMAS_PAGAMENTO.map((f) => (
                          <option key={f} value={f}>
                            {formaPagamentoLabel(f)}
                          </option>
                        ))}
                      </select>
                      <input
                        inputMode="decimal"
                        value={editRow.valor}
                        onChange={(e) => setEditRow({ ...editRow, valor: e.target.value })}
                        className="w-24 rounded-lg border border-earth-200 bg-white px-2 py-1.5 text-sm focus:border-sun-500 focus:outline-none"
                      />
                    </div>
                    <input
                      value={editRow.pagante}
                      onChange={(e) => setEditRow({ ...editRow, pagante: e.target.value })}
                      placeholder="Nome de quem pagou (opcional)"
                      className="mt-2 w-full rounded-lg border border-earth-200 bg-white px-2 py-1.5 text-sm focus:border-sun-500 focus:outline-none"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingId(null)
                          setEditRow(null)
                        }}
                        className="rounded-lg px-2 py-1 text-xs text-earth-500 hover:bg-earth-100"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => saveEdit(p)}
                        disabled={editSaving}
                        className="rounded-lg bg-sun-500 px-3 py-1 text-xs font-medium text-white hover:bg-sun-600 disabled:opacity-60"
                      >
                        {editSaving ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </li>
                ) : (
                  <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                    <div>
                      <span className="text-earth-600">{formaPagamentoLabel(p.forma_pagamento)}</span>
                      <span className="ml-2 text-earth-900">{formatBRL(p.valor)}</span>
                      {p.pagante && <span className="ml-2 text-xs text-earth-400">({p.pagante})</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {p.comprovante_url ? (
                        <a
                          href={p.comprovante_url}
                          target="_blank"
                          rel="noreferrer"
                          className="whitespace-nowrap text-xs font-medium text-field-700 underline"
                        >
                          Ver comprovante
                        </a>
                      ) : (
                        <label className="whitespace-nowrap text-xs font-medium text-sun-700 underline hover:cursor-pointer">
                          {attachingId === p.id ? 'Enviando...' : '+ comprovante'}
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            disabled={attachingId === p.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleAttach(p, file)
                            }}
                          />
                        </label>
                      )}
                      <button
                        onClick={() => startEdit(p)}
                        className="whitespace-nowrap text-xs font-medium text-earth-500 underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="whitespace-nowrap text-xs font-medium text-red-600 underline"
                      >
                        {deleteConfirmId === p.id ? 'Confirmar?' : 'Excluir'}
                      </button>
                    </div>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}

        {saldo <= 0 ? (
          <p className="rounded-lg bg-field-100 px-3 py-3 text-center text-sm font-medium text-field-700">
            Conta já quitada 🎉
          </p>
        ) : (
          <div className="rounded-xl border border-field-100 bg-field-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-field-700">
              Registrar pagamento (pode dividir entre formas e entre pessoas)
            </p>
            <div className="flex flex-col gap-2">
              {rows.map((row, idx) => (
                <div key={idx} className="rounded-lg border border-earth-100 bg-white p-2">
                  <div className="flex gap-2">
                    <select
                      value={row.forma_pagamento}
                      onChange={(e) => updateRow(idx, { forma_pagamento: e.target.value as FormaPagamento })}
                      className="flex-1 rounded-lg border border-earth-200 bg-white px-2 py-2 text-sm focus:border-sun-500 focus:outline-none"
                    >
                      {FORMAS_PAGAMENTO.map((f) => (
                        <option key={f} value={f}>
                          {formaPagamentoLabel(f)}
                        </option>
                      ))}
                    </select>
                    <input
                      inputMode="decimal"
                      value={row.valor}
                      onChange={(e) => updateRow(idx, { valor: e.target.value })}
                      placeholder="0,00"
                      className="w-24 rounded-lg border border-earth-200 bg-white px-2 py-2 text-sm focus:border-sun-500 focus:outline-none"
                    />
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="rounded-lg px-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <input
                    value={row.pagante}
                    onChange={(e) => updateRow(idx, { pagante: e.target.value })}
                    placeholder="Nome de quem pagou (opcional)"
                    className="mt-2 w-full rounded-lg border border-earth-200 bg-white px-2 py-1.5 text-sm focus:border-sun-500 focus:outline-none"
                  />
                  {row.forma_pagamento === 'pix' && (
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => updateRow(idx, { comprovante: e.target.files?.[0] ?? null })}
                      className="mt-2 w-full text-xs text-earth-500 file:mr-2 file:rounded-md file:border-0 file:bg-earth-100 file:px-2 file:py-1 file:text-xs"
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRow}
              className="mt-2 text-xs font-medium text-field-700 underline"
            >
              + dividir com outra forma de pagamento
            </button>

            <div className="mt-3 text-xs">
              {diferenca > 0.009 && <p className="text-earth-500">Faltam {formatBRL(diferenca)} para completar o saldo.</p>}
              {diferenca < -0.009 && <p className="text-earth-500">Valor digitado excede o saldo em {formatBRL(-diferenca)}.</p>}
              {Math.abs(diferenca) <= 0.009 && <p className="text-field-700">Valor confere com o saldo ✓</p>}
              {diferenca > 0.009 && <p className="text-earth-400">Pode registrar um pagamento parcial — o restante fica pendente.</p>}
            </div>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <button
              onClick={handleConfirm}
              disabled={saving}
              className="mt-3 w-full rounded-lg bg-sun-500 px-4 py-2 text-sm font-medium text-white hover:bg-sun-600 disabled:opacity-60"
            >
              {saving ? 'Registrando...' : 'Confirmar pagamento'}
            </button>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-earth-600 hover:bg-earth-100">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
