import { useState, type ReactNode } from 'react'
import { MENU_CATEGORIAS, type MenuCategoria, type MenuItem } from '../types'

type Filtro = MenuCategoria | 'oculto'

export interface LinhaCardapio {
  key: string
  nome: string
  foto: string | null
  unico?: MenuItem
  pequeno?: MenuItem
  grande?: MenuItem
}

function formatPreco(valor: number) {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(2).replace('.', ',')
}

function medidaDe(nome: string) {
  return nome.match(/\(([^)]+)\)/)?.[1] ?? nome.match(/\d+\s*(?:ml|l|g|kg)\b/i)?.[0] ?? null
}

function pontosDe(nome: string) {
  const texto = nome.match(/\(([^)]*pont[^)]*)\)/i)?.[1]
  return texto ? texto.replace(/menos de/i, '<').replace(/mais de/i, '>') : null
}

export function itensDaLinha(linha: LinhaCardapio) {
  return [linha.unico, linha.pequeno, linha.grande].filter(Boolean) as MenuItem[]
}

function montarLinhas(itens: MenuItem[]): LinhaCardapio[] {
  const linhas: LinhaCardapio[] = []
  const porGrupo = new Map<string, LinhaCardapio>()
  for (const item of itens) {
    if (item.tamanho && item.grupo) {
      let linha = porGrupo.get(item.grupo)
      if (!linha) {
        linha = { key: `g-${item.grupo}`, nome: item.grupo, foto: null }
        porGrupo.set(item.grupo, linha)
        linhas.push(linha)
      }
      linha[item.tamanho] = item
      linha.foto ??= item.foto_url
    } else {
      linhas.push({ key: item.id, nome: item.nome, foto: item.foto_url, unico: item })
    }
  }
  return linhas
}

function Preco({
  item,
  comMedida = false,
  rotulo,
  semMedida = false,
}: {
  item?: MenuItem
  comMedida?: boolean
  rotulo?: string
  semMedida?: boolean
}) {
  if (!item) return <span className="text-earth-300">-</span>
  const medida = !semMedida && (comMedida || rotulo) ? medidaDe(item.nome) : null
  return (
    <span className="flex flex-col items-center leading-tight">
      {rotulo && (
        <span className="text-center text-[9px] font-medium uppercase tracking-wide text-earth-400">{rotulo}</span>
      )}
      {item.valor === 0 ? (
        <span className="text-center text-[11px] font-medium leading-tight text-earth-600">Sob consulta</span>
      ) : (
        <span className="font-semibold text-earth-800">{formatPreco(item.valor)}</span>
      )}
      {medida && <span className="text-[10px] text-earth-500">{medida}</span>}
    </span>
  )
}

interface Props {
  items: MenuItem[] | null
  /** Admin: mostra também a aba com os produtos que não aparecem no cardápio público. */
  incluirOcultos?: boolean
  renderAcoes?: (linha: LinhaCardapio) => ReactNode
  renderExtra?: (linha: LinhaCardapio) => ReactNode
}

export function CardapioView({ items, incluirOcultos = false, renderAcoes, renderExtra }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('cafes')

  const pills: { id: Filtro; label: string }[] = [
    ...MENU_CATEGORIAS,
    ...(incluirOcultos ? [{ id: 'oculto' as const, label: 'Fora do cardápio' }] : []),
  ]
  const linhas = montarLinhas(
    (items ?? []).filter((i) => (filtro === 'oculto' ? i.categoria === null : i.categoria === filtro)),
  )
  const colunas = filtro === 'cafes' && linhas.some((l) => !l.unico)

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {pills.map((c) => (
          <button
            key={c.id}
            onClick={() => setFiltro(c.id)}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition ${
              filtro === c.id ? 'border-sun-500 bg-sun-500 text-white' : 'border-earth-200 bg-white text-earth-600'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      {items === null ? (
        <p className="py-4 text-center text-sm text-earth-500">Carregando...</p>
      ) : linhas.length === 0 ? (
        <p className="py-4 text-center text-sm text-earth-500">
          {incluirOcultos ? 'Nenhum produto nesta categoria.' : 'Cardápio em breve.'}
        </p>
      ) : (
        <div>
          {colunas && (
            <div className="flex items-center gap-3 border-b border-earth-100 pb-1 text-[11px] font-medium uppercase tracking-wide text-earth-500">
              <span className="w-16 shrink-0" />
              <span className="flex-1" />
              <span className="w-14 text-center">Pequeno</span>
              <span className="w-14 text-center">Grande</span>
            </div>
          )}
          <ul className="divide-y divide-earth-100">
            {linhas.map((linha) => (
              <li key={linha.key}>
                <div className="flex items-center gap-3 py-2 text-sm">
                  {linha.foto ? (
                    <img
                      src={linha.foto}
                      alt={linha.nome}
                      loading="lazy"
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-earth-100" />
                  )}
                  <span className="min-w-0 flex-1 text-earth-900">
                    {linha.unico ? linha.unico.nome : linha.nome}
                    {renderAcoes?.(linha)}
                  </span>
                  {!colunas ? (
                    linha.unico ? (
                      <Preco item={linha.unico} />
                    ) : (
                      <span className="flex shrink-0 gap-3">
                        {linha.pequeno && (
                          <Preco
                            item={linha.pequeno}
                            rotulo={pontosDe(linha.pequeno.nome) ?? 'Pequeno'}
                            semMedida={!!pontosDe(linha.pequeno.nome)}
                          />
                        )}
                        {linha.grande && (
                          <Preco
                            item={linha.grande}
                            rotulo={pontosDe(linha.grande.nome) ?? 'Grande'}
                            semMedida={!!pontosDe(linha.grande.nome)}
                          />
                        )}
                      </span>
                    )
                  ) : (
                    <>
                      <span className="flex w-14 shrink-0 justify-center">
                        <Preco
                          item={linha.unico ?? linha.pequeno}
                          comMedida={!linha.unico}
                          rotulo={(linha.pequeno && pontosDe(linha.pequeno.nome)) || undefined}
                          semMedida={!!linha.pequeno && !!pontosDe(linha.pequeno.nome)}
                        />
                      </span>
                      <span className="flex w-14 shrink-0 justify-center">
                        <Preco
                          item={linha.grande}
                          comMedida
                          rotulo={(linha.grande && pontosDe(linha.grande.nome)) || undefined}
                          semMedida={!!linha.grande && !!pontosDe(linha.grande.nome)}
                        />
                      </span>
                    </>
                  )}
                </div>
                {renderExtra?.(linha)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
