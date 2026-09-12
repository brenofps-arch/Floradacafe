import { useState, type FormEvent } from 'react'
import { formatBRL } from '../lib/format'
import type { Booking, BookingItem, MenuItem } from '../types'

interface Props {
  booking: Booking
  items: BookingItem[]
  menuItems: MenuItem[]
  onAdd: (descricao: string, quantidade: number, valorUnitario: number) => Promise<void>
  onDelete: (item: BookingItem) => Promise<void>
  onClose: () => void
}

export function BookingItemsModal({ booking, items, menuItems, onAdd, onDelete, onClose }: Props) {
  const [descricao, setDescricao] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [valorUnitario, setValorUnitario] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalItens = items.reduce((sum, item) => sum + item.quantidade * item.valor_unitario, 0)

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const qtd = Number(quantidade.replace(',', '.'))
    const valor = Number(valorUnitario.replace(',', '.'))

    if (!descricao.trim()) {
      setError('Informe o produto.')
      return
    }
    if (Number.isNaN(qtd) || qtd <= 0) {
      setError('Informe uma quantidade válida.')
      return
    }
    if (Number.isNaN(valor) || valor < 0) {
      setError('Informe um valor válido.')
      return
    }

    setSaving(true)
    try {
      await onAdd(descricao.trim(), qtd, valor)
      setDescricao('')
      setQuantidade('1')
      setValorUnitario('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar produto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-earth-900/40 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-sun-50 p-6 shadow-lg">
        <h2 className="mb-1 font-script text-2xl text-earth-900">Produtos extras</h2>
        <p className="mb-4 text-sm text-earth-600">{booking.nome}</p>

        {items.length > 0 && (
          <ul className="mb-4 divide-y divide-earth-100 rounded-lg border border-earth-100 bg-white">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div>
                  <p className="text-earth-900">{item.descricao}</p>
                  <p className="text-xs text-earth-500">
                    {item.quantidade} × {formatBRL(item.valor_unitario)} = {formatBRL(item.quantidade * item.valor_unitario)}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(item)}
                  className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-xl border border-field-100 bg-field-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-field-700">Adicionar produto</p>
          {menuItems.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => {
                const item = menuItems.find((m) => m.id === e.target.value)
                if (item) {
                  setDescricao(item.nome)
                  setValorUnitario(item.valor.toFixed(2).replace('.', ','))
                }
              }}
              className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
            >
              <option value="" disabled>
                Escolher do cardápio...
              </option>
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} — {formatBRL(item.valor)}
                </option>
              ))}
            </select>
          )}
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: Café expresso"
            className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-earth-600">Quantidade</label>
              <input
                inputMode="decimal"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full rounded-lg border border-earth-200 bg-white px-2 py-2 text-sm focus:border-sun-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-earth-600">Valor unitário (R$)</label>
              <input
                inputMode="decimal"
                value={valorUnitario}
                onChange={(e) => setValorUnitario(e.target.value)}
                placeholder="10,00"
                className="w-full rounded-lg border border-earth-200 bg-white px-2 py-2 text-sm focus:border-sun-500 focus:outline-none"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-field-600 px-4 py-2 text-sm font-medium text-white hover:bg-field-700 disabled:opacity-60"
          >
            {saving ? 'Adicionando...' : '+ Adicionar produto'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between border-t border-earth-100 pt-3 text-sm">
          <span className="text-earth-600">Total em produtos</span>
          <span className="font-semibold text-earth-900">{formatBRL(totalItens)}</span>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-earth-600 hover:bg-earth-100">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
