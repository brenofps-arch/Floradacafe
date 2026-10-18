import { useState, type FormEvent } from 'react'
import { formatBRL } from '../lib/format'
import { MENU_CATEGORIAS, type MenuCategoria, type MenuItem } from '../types'

interface Props {
  menuItems: MenuItem[]
  onAdd: (nome: string, valor: number, categoria: MenuCategoria | null) => Promise<void>
  onEdit: (item: MenuItem, nome: string, valor: number, categoria: MenuCategoria | null) => Promise<void>
  onUploadFoto: (item: MenuItem, file: File) => Promise<void>
  onDelete: (item: MenuItem) => Promise<void>
  onClose: () => void
}

function CategoriaSelect({
  value,
  onChange,
}: {
  value: MenuCategoria | ''
  onChange: (v: MenuCategoria | '') => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as MenuCategoria | '')}
      className="w-full rounded-lg border border-earth-200 bg-white px-2 py-1.5 text-sm focus:border-sun-500 focus:outline-none"
    >
      <option value="">Não mostrar no cardápio público</option>
      {MENU_CATEGORIAS.map((c) => (
        <option key={c.id} value={c.id}>
          {c.label}
        </option>
      ))}
    </select>
  )
}

export function MenuModal({ menuItems, onAdd, onEdit, onUploadFoto, onDelete, onClose }: Props) {
  const [fotoUploadingId, setFotoUploadingId] = useState<string | null>(null)
  const [fotoError, setFotoError] = useState<string | null>(null)

  async function handleFoto(item: MenuItem, file: File | undefined) {
    if (!file) return
    setFotoError(null)
    setFotoUploadingId(item.id)
    try {
      await onUploadFoto(item, file)
    } catch (err) {
      setFotoError(err instanceof Error ? err.message : 'Erro ao enviar a foto.')
    } finally {
      setFotoUploadingId(null)
    }
  }

  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState<MenuCategoria | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editValor, setEditValor] = useState('')
  const [editCategoria, setEditCategoria] = useState<MenuCategoria | ''>('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const valorNum = Number(valor.replace(',', '.'))
    if (!nome.trim()) {
      setError('Informe o nome do produto.')
      return
    }
    if (Number.isNaN(valorNum) || valorNum < 0) {
      setError('Informe um valor válido.')
      return
    }
    setSaving(true)
    try {
      await onAdd(nome.trim(), valorNum, categoria || null)
      setNome('')
      setValor('')
      setCategoria('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar produto.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id)
    setEditNome(item.nome)
    setEditValor(item.valor.toFixed(2).replace('.', ','))
    setEditCategoria(item.categoria ?? '')
    setEditError(null)
  }

  async function saveEdit(item: MenuItem) {
    setEditError(null)
    const valorNum = Number(editValor.replace(',', '.'))
    if (!editNome.trim()) {
      setEditError('Informe o nome do produto.')
      return
    }
    if (Number.isNaN(valorNum) || valorNum < 0) {
      setEditError('Informe um valor válido.')
      return
    }
    setEditSaving(true)
    try {
      await onEdit(item, editNome.trim(), valorNum, editCategoria || null)
      setEditingId(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao editar produto.')
    } finally {
      setEditSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-earth-900/40 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-sun-50 p-6 shadow-lg">
        <h2 className="mb-4 font-script text-2xl text-earth-900">Cardápio</h2>

        {menuItems.length > 0 && (
          <ul className="mb-4 divide-y divide-earth-100 rounded-lg border border-earth-100 bg-white">
            {menuItems.map((item) =>
              editingId === item.id ? (
                <li key={item.id} className="p-2">
                  <div className="flex gap-2">
                    <input
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      className="flex-1 rounded-lg border border-earth-200 bg-white px-2 py-1.5 text-sm focus:border-sun-500 focus:outline-none"
                    />
                    <input
                      inputMode="decimal"
                      value={editValor}
                      onChange={(e) => setEditValor(e.target.value)}
                      className="w-24 rounded-lg border border-earth-200 bg-white px-2 py-1.5 text-sm focus:border-sun-500 focus:outline-none"
                    />
                  </div>
                  <div className="mt-2">
                    <CategoriaSelect value={editCategoria} onChange={setEditCategoria} />
                  </div>
                  {editError && <p className="mt-1 text-xs text-red-600">{editError}</p>}
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg px-2 py-1 text-xs text-earth-500 hover:bg-earth-100"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => saveEdit(item)}
                      disabled={editSaving}
                      className="rounded-lg bg-sun-500 px-3 py-1 text-xs font-medium text-white hover:bg-sun-600 disabled:opacity-60"
                    >
                      {editSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </li>
              ) : (
                <li key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-earth-900">
                    {item.foto_url ? (
                      <img src={item.foto_url} alt="" className="h-9 w-9 rounded-md object-cover" />
                    ) : (
                      <span className="h-9 w-9 rounded-md bg-earth-100" />
                    )}
                    <span>
                    {item.nome}
                    <span className="ml-2 text-xs text-earth-400">
                      {MENU_CATEGORIAS.find((c) => c.id === item.categoria)?.label ?? 'oculto no público'}
                    </span>
                    </span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-earth-600">{formatBRL(item.valor)}</span>
                    <label className="cursor-pointer text-xs font-medium text-earth-500 underline">
                      {fotoUploadingId === item.id ? 'Enviando...' : item.foto_url ? 'Trocar foto' : 'Foto'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={fotoUploadingId === item.id}
                        onChange={(e) => {
                          void handleFoto(item, e.target.files?.[0])
                          e.target.value = ''
                        }}
                      />
                    </label>
                    <button
                      onClick={() => startEdit(item)}
                      className="text-xs font-medium text-earth-500 underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Remover
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}

        {fotoError && <p className="mb-2 text-sm text-red-600">{fotoError}</p>}
        <p className="mb-3 text-xs text-earth-400">
          Alterar um produto aqui não muda os produtos já lançados em reservas anteriores — vale só a partir de agora.
        </p>

        <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-xl border border-field-100 bg-field-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-field-700">Adicionar produto ao cardápio</p>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Café expresso"
            className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
          />
          <input
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Valor (R$)"
            className="w-full rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
          />
          <CategoriaSelect value={categoria} onChange={setCategoria} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-field-600 px-4 py-2 text-sm font-medium text-white hover:bg-field-700 disabled:opacity-60"
          >
            {saving ? 'Adicionando...' : '+ Adicionar ao cardápio'}
          </button>
        </form>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-earth-600 hover:bg-earth-100">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
