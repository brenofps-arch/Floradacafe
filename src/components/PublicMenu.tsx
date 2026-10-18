import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MENU_CATEGORIAS, type MenuCategoria, type MenuItem } from '../types'

const WIFI_REDE = 'FLORADA'
const WIFI_SENHA = 'floradacafe'
// Cole aqui o link da playlist (ex.: https://open.spotify.com/playlist/XXXX). Vazio = aba mostra "em breve".
const SPOTIFY_PLAYLIST_URL = 'https://open.spotify.com/playlist/1zvmbztOk2poYumzkOUxXn'

type Aba = 'historia' | 'cardapio' | 'wifi' | 'playlist'
const ABAS: { id: Aba; label: string }[] = [
  { id: 'historia', label: 'História' },
  { id: 'cardapio', label: 'Cardápio' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'playlist', label: 'Playlist' },
]

function formatPreco(valor: number) {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(2).replace('.', ',')
}

function medidaDe(nome: string) {
  return nome.match(/\(([^)]+)\)/)?.[1] ?? nome.match(/\d+\s*(?:ml|l|g|kg)\b/i)?.[0] ?? null
}

interface LinhaCardapio {
  key: string
  nome: string
  foto: string | null
  unico?: MenuItem
  pequeno?: MenuItem
  grande?: MenuItem
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

function pontosDe(nome: string) {
  const texto = nome.match(/\(([^)]*pont[^)]*)\)/i)?.[1]
  return texto ? texto.replace(/menos de/i, '<').replace(/mais de/i, '>') : null
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

function spotifyEmbedUrl(url: string) {
  const match = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|album|track)\/([A-Za-z0-9]+)/)
  return match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}` : null
}

export function PublicMenu() {
  const [items, setItems] = useState<MenuItem[] | null>(null)
  const [copied, setCopied] = useState(false)
  const [aba, setAba] = useState<Aba>('historia')
  const [categoria, setCategoria] = useState<MenuCategoria>('cafes')
  const embedUrl = spotifyEmbedUrl(SPOTIFY_PLAYLIST_URL)
  const linhas = montarLinhas((items ?? []).filter((i) => i.categoria === categoria))
  const colunas = categoria === 'cafes' && linhas.some((l) => !l.unico)

  useEffect(() => {
    supabase
      .from('menu_items')
      .select('*')
      .not('categoria', 'is', null)
      .order('nome')
      .then(({ data }) => setItems((data as MenuItem[]) ?? []))
  }, [])

  async function copySenha() {
    try {
      await navigator.clipboard.writeText(WIFI_SENHA)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* sem permissão de clipboard: a senha continua visível na tela */
    }
  }

  return (
    <div className="min-h-screen bg-sun-50 pb-10">
      <header className="flex flex-col items-center gap-3 bg-sun-100 px-6 pb-8 pt-10 text-center">
        <img src="/florada-logo.jpg" alt="Florada Café" className="h-24 w-24 rounded-full border-4 border-white shadow" />
        <h1 className="font-script text-4xl text-earth-900">Florada Café</h1>
        <p className="text-sm text-earth-600">Café rural entre os girassóis · Ibiraçu, ES</p>
      </header>

      <nav className="sticky top-0 z-10 flex border-b border-earth-200 bg-sun-50">
        {ABAS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAba(tab.id)}
            className={`flex-1 border-b-2 px-2 py-3 text-sm font-medium transition ${
              aba === tab.id ? 'border-sun-500 text-sun-700' : 'border-transparent text-earth-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="mx-auto max-w-md px-4 pt-6">
        {aba === 'historia' && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-script text-2xl text-earth-900">Nossa história</h2>
            <div className="space-y-3 text-sm leading-relaxed text-earth-700">
              <p>
                Há mais de 80 anos, esta terra é o lar do Sr. João e da Dona Maria de Lourdes. Casados por cerca de 60 anos, eles
                construíram aqui a nossa família, com muito amor pelo campo: nasceu a filha Lucia e, mais tarde,
                com a união ao Sebastião (o querido Tião), chegou a neta Gabrielle.
              </p>
              <figure>
                <img
                  src="/historia-joao-maria.jpg"
                  alt="Sr. João e Dona Maria de Lourdes"
                  loading="lazy"
                  className="w-full rounded-xl object-cover"
                />
                <figcaption className="mt-1 text-center text-xs text-earth-500">Sr. João e Dona Maria de Lourdes</figcaption>
              </figure>
              <p>
                Trabalhar a terra e acompanhar o ritmo da natureza sempre foi a nossa vocação, mas no coração pulsava um
                sonho antigo: criar um refúgio acolhedor onde as pessoas pudessem se reunir para dividir risos, alegrias
                e momentos inesquecíveis.
              </p>
              <p>Em dezembro de 2025, esse sonho ganhou vida com a abertura do Florada Café.</p>
              <figure>
                <img
                  src="/historia-lucia-tiao.jpg"
                  alt="Lucia e Tião"
                  loading="lazy"
                  className="w-full rounded-xl object-cover"
                />
                <figcaption className="mt-1 text-center text-xs text-earth-500">Lucia e Tião</figcaption>
              </figure>
              <p>
                Projetamos cada cantinho para transmitir a paz e a calmaria do campo, um convite sincero para desacelerar
                da rotina e viver um tempo de qualidade de verdade. Em cada xícara servida e em cada receita preparada,
                está o cuidado de gerações, para que você sinta o amor que dedicamos a este lugar.
              </p>
              <h3 className="pt-2 font-script text-xl text-earth-900">Uma homenagem sincera</h3>
              <p>
                O Florada Café carrega hoje uma luz ainda mais especial. Partiu recentemente o nosso querido Sr. João, o
                patriarca que nos ensinou o valor da terra, da simplicidade e do trabalho feito com o coração.
              </p>
              <p>
                Embora sua presença física faça falta, sua essência e seus ensinamentos continuam vivos em cada detalhe
                deste espaço. O Florada é também a realização do seu legado: uma eterna homenagem ao homem que plantou as
                primeiras sementes de tudo o que somos.
              </p>
              <p>Seja bem-vindo ao Florada Café. Sinta-se em casa e faça parte da nossa história.</p>
            </div>
          </section>
        )}

        {aba === 'cardapio' && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-script text-2xl text-earth-900">Cardápio</h2>
            <div className="mb-3 flex flex-wrap gap-2">
              {MENU_CATEGORIAS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoria(c.id)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition ${
                    categoria === c.id
                      ? 'border-sun-500 bg-sun-500 text-white'
                      : 'border-earth-200 bg-white text-earth-600'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {items === null ? (
              <p className="py-4 text-center text-sm text-earth-500">Carregando...</p>
            ) : linhas.length === 0 ? (
              <p className="py-4 text-center text-sm text-earth-500">Cardápio em breve.</p>
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
                    <li key={linha.key} className="flex items-center gap-3 py-2 text-sm">
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
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-3 text-center text-xs text-earth-500">Para pedir, chame um de nossos atendentes.</p>
          </section>
        )}

        {aba === 'wifi' && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-script text-2xl text-earth-900">Wi-Fi</h2>
            <dl className="space-y-1 text-sm text-earth-700">
              <div className="flex justify-between">
                <dt className="text-earth-500">Rede</dt>
                <dd className="font-semibold">{WIFI_REDE}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-earth-500">Senha</dt>
                <dd className="font-semibold">{WIFI_SENHA}</dd>
              </div>
            </dl>
            <button
              onClick={copySenha}
              className="mt-3 w-full rounded-lg bg-sun-500 px-4 py-2 text-sm font-medium text-white hover:bg-sun-600"
            >
              {copied ? 'Senha copiada!' : 'Copiar senha'}
            </button>
          </section>
        )}

        {aba === 'playlist' && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-script text-2xl text-earth-900">Nossa playlist</h2>
            {embedUrl ? (
              <iframe
                title="Playlist do Florada Café"
                src={embedUrl}
                width="100%"
                height="380"
                allow="encrypted-media"
                loading="lazy"
                className="rounded-xl border-0"
              />
            ) : (
              <p className="py-4 text-center text-sm text-earth-500">Playlist em breve.</p>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
