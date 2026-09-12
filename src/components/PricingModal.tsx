import { useState, type FormEvent } from 'react'
import type { PricingSettings } from '../types'

interface Props {
  pricing: PricingSettings
  onSave: (valorAdulto: number, valorCrianca: number) => Promise<void>
  onClose: () => void
}

export function PricingModal({ pricing, onSave, onClose }: Props) {
  const [valorAdulto, setValorAdulto] = useState(pricing.valor_adulto.toFixed(2).replace('.', ','))
  const [valorCrianca, setValorCrianca] = useState(pricing.valor_crianca.toFixed(2).replace('.', ','))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const adulto = Number(valorAdulto.replace(',', '.'))
    const crianca = Number(valorCrianca.replace(',', '.'))
    if (Number.isNaN(adulto) || adulto < 0 || Number.isNaN(crianca) || crianca < 0) {
      setError('Informe valores válidos.')
      return
    }
    setSaving(true)
    try {
      await onSave(adulto, crianca)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar preços.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-earth-900/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-sun-50 p-6 shadow-lg">
        <h2 className="mb-4 font-script text-2xl text-earth-900">Preços por pessoa</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-earth-700">Valor adulto (R$)</label>
            <input
              inputMode="decimal"
              value={valorAdulto}
              onChange={(e) => setValorAdulto(e.target.value)}
              className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-earth-700">Valor criança (R$)</label>
            <input
              inputMode="decimal"
              value={valorCrianca}
              onChange={(e) => setValorCrianca(e.target.value)}
              className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
            />
          </div>
          <p className="text-xs text-earth-500">Gratuitos sempre valem R$ 0. Essa alteração vale para novos agendamentos.</p>
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
              {saving ? 'Salvando...' : 'Salvar preços'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
