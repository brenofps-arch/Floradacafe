import { useState, type FormEvent } from 'react'
import { MENU_CATEGORIAS, type MenuCategoria, type MenuItem, type MenuTamanho } from '../types'
import { CardapioView, itensDaLinha, type LinhaCardapio } from './CardapioView'

interface Props {
  menuItems: MenuItem[]
  onAdd: (
    nome: string,
    valor: number,
    categoria: MenuCategoria | null,
    grupo: string | null,
    tamanho: MenuTamanho | null,
  ) => Promise<void>
  onEdit: (
    item: MenuItem,
    nome: string,
    valor: number,
    categoria: MenuCategoria | null,
    grupo: string | null,
    tamanho: MenuTamanho | null,
  ) => Promise<void>
  onUploadFoto: (itens: MenuItem[], file: File) => Promise<void>
  onDelete: (item: MenuItem) => Promise<void>
  onClose: () => void
}

const inputClass =
  'rounded-lg border border-earth-200 bg-white px-2 py-1.5 text-sm focus:border-sun-500 focus:outline-none'

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
      className={`${inputClass} w-full`}
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

function TamanhoFields({
  grupo,
  tamanho,
  onGrupo,
  onTamanho,
}: {
  grupo: string
  tamanho: MenuTamanho | ''
  onGrupo: (v: string) => void
  onTamanho: (v: MenuTamanho | '') => void
}) {
  return (
    <div className="flex gap-2">
      <select
        value={tamanho}
        onChange={(e) => onTamanho(e.target.value as MenuTamanho | '')}
        className={`${inputClass} w-1/2`}
      >
        <option value="">Tamanho único</option>
        <option value="pequeno">Pequeno</option>
        <option value="grande">Grande</option>
      </select>
      <input
        value={grupo}
        onChange={(e) => onGrupo(e.target.value)}
        disabled={!tamanho}
        placeholder="Nome na linha (ex.: Café chemics)"
        className={`${inputClass} w-1/2 disabled:bg-earth-50`}
      />
    </div>
  )
}

export function MenuModal({ menuItems, onAdd, onEdit, onUploadFoto, onDelete, onClose }: Props) {
  const [fotoUploadingKey, setFotoUploadingKey] = useState<string | null>(null)
  const [fotoError, setFotoError] = useState<string | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState<MenuCategoria | ''>('')
  const [grupo, setGrupo] = useState('')
  const [tamanho, setTamanho] = useState<MenuTamanho | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editValor, setEditValor] = useState('')
  const [editCategoria, setEditCategoria] = useState<MenuCategoria | ''>('')
  const [editGrupo, setEditGrupo] = useState('')
  const [editTamanho, setEditTamanho] = useState<MenuTamanho | ''>('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  async function handleFoto(linha: LinhaCardapio, file: File | undefined) {
    if (!file) return
    setFotoError(null)
    setFotoUploadingKey(linha.key)
    try {
      await onUploadFoto(itensDaLinha(linha), file)
    } catch (err) {
      setFotoError(err instanceof Error ? err.message : 'Erro ao enviar a foto.')
    } finally {
      setFotoUploadingKey(null)
    }
  }

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
      await onAdd(nome.trim(), valorNum, categoria || null, tamanho ? grupo.trim() || null : null, tamanho || null)
      setNome('')
      setValor('')
      setCategoria('')
      setGrupo('')
      setTamanho('')
      setShowAdd(false)
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
    setEditGrupo(item.grupo ?? '')
    setEditTamanho(item.tamanho ?? '')
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
      await onEdit(
        item,
        editNome.trim(),
        valorNum,
        editCategoria || null,
        editTamanho ? editGrupo.trim() || null : null,
        editTamanho || null,
      )
      setEditingId(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erro ao editar produto.')
    } finally {
      setEditSaving(false)
    }
  }

  function renderAcoes(linha: LinhaCardapio) {
    const itens = itensDaLinha(linha)
    const varios = itens.length > 1
    return (
      <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
        <label className="cursor-pointer font-medium text-earth-500 underline">
          {fotoUploadingKey === linha.key ? 'Enviando...' : linha.foto ? 'Trocar foto' : 'Foto'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={fotoUploadingKey === linha.key}
            onChange={(e) => {
              void handleFoto(linha, e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
        {itens.map((item) => (
          <span key={item.id} className="flex gap-x-2">
            {varios && <span className="capitalize text-earth-400">{item.tamanho}:</span>}
            <button onClick={() => startEdit(item)} className="font-medium text-earth-500 underline">
              Editar
            </button>
            <button onClick={() => onDelete(item)} className="text-red-600 hover:underline">
              Remover
            </button>
          </span>
        ))}
      </span>
    )
  }

  function renderExtra(linha: LinhaCardapio) {
    const item = itensDaLinha(linha).find((i) => i.id === editingId)
    if (!item) return null
    return (
      <div className="mb-2 rounded-xl border border-sun-200 bg-sun-50 p-3">
        <div className="flex gap-2">
          <input
            value={editNome}
            onChange={(e) => setEditNome(e.target.value)}
            className={`${inputClass} min-w-0 flex-1`}
          />
          <input
            inputMode="decimal"
            value={editValor}
            onChange={(e) => setEditValor(e.target.value)}
            className={`${inputClass} w-24`}
          />
        </div>
        <div className="mt-2">
          <CategoriaSelect value={editCategoria} onChange={setEditCategoria} />
        </div>
        <div className="mt-2">
          <TamanhoFields
            grupo={editGrupo}
            tamanho={editTamanho}
            onGrupo={setEditGrupo}
            onTamanho={setEditTamanho}
          />
        </div>
        <p className="mt-2 text-[11px] text-earth-500">Valor 0 aparece como "Sob consulta" no cardápio público.</p>
        {editError && <p className="mt-1 text-xs text-red-600">{editError}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <button onClick={() => setEditingId(null)} className="rounded-lg px-2 py-1 text-xs text-earth-500 hover:bg-earth-100">
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
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-earth-900/40 px-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-sun-50 p-5 shadow-lg">
        <h2 className="mb-3 font-script text-2xl text-earth-900">Cardápio</h2>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <CardapioView items={menuItems} incluirOcultos renderAcoes={renderAcoes} renderExtra={renderExtra} />
        </div>

        {fotoError && <p className="mt-2 text-sm text-red-600">{fotoError}</p>}
        <p className="my-3 text-xs text-earth-400">
          Alterar um produto aqui não muda os produtos já lançados em reservas anteriores — vale só a partir de agora.
        </p>

        {showAdd ? (
          <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-xl border border-field-100 bg-field-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-field-700">Adicionar produto ao cardápio</p>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Café expresso"
              className={`${inputClass} w-full`}
            />
            <input
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder='Valor (R$) — 0 aparece como "Sob consulta" no cardápio público'
              className={`${inputClass} w-full`}
            />
            <CategoriaSelect value={categoria} onChange={setCategoria} />
            <TamanhoFields grupo={grupo} tamanho={tamanho} onGrupo={setGrupo} onTamanho={setTamanho} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-earth-600 hover:bg-earth-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-field-600 px-4 py-2 text-sm font-medium text-white hover:bg-field-700 disabled:opacity-60"
              >
                {saving ? 'Adicionando...' : '+ Adicionar ao cardápio'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full rounded-lg bg-field-600 px-4 py-2 text-sm font-medium text-white hover:bg-field-700"
          >
            + Adicionar produto
          </button>
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
