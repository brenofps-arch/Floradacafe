import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatBRL } from '../lib/format'
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
  const itensDaCategoria = (items ?? []).filter((i) => i.categoria === categoria)

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
                Há mais de 80 anos, esta terra é o lar do Sr. João e da Dona Maria. Casados por cerca de 50 anos, eles
                construíram aqui a nossa família, com muito amor pelo campo: nasceu a filha Lúcia Helena e, mais tarde,
                com a união ao Sebastião (o querido Tião), chegou a neta Gabrielle.
              </p>
              <figure>
                <img
                  src="/historia-joao-maria.jpg"
                  alt="Sr. João e Dona Maria"
                  loading="lazy"
                  className="w-full rounded-xl object-cover"
                />
                <figcaption className="mt-1 text-center text-xs text-earth-500">Sr. João e Dona Maria</figcaption>
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
                  alt="Lúcia Helena e Tião"
                  loading="lazy"
                  className="w-full rounded-xl object-cover"
                />
                <figcaption className="mt-1 text-center text-xs text-earth-500">Lúcia Helena e Tião</figcaption>
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
            <div className="mb-3 flex gap-2 overflow-x-auto">
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
            ) : itensDaCategoria.length === 0 ? (
              <p className="py-4 text-center text-sm text-earth-500">Cardápio em breve.</p>
            ) : (
              <ul className="divide-y divide-earth-100">
                {itensDaCategoria.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2 text-sm">
                    {item.foto_url ? (
                      <img
                        src={item.foto_url}
                        alt={item.nome}
                        loading="lazy"
                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-xl bg-earth-100" />
                    )}
                    <span className="flex-1 text-earth-900">{item.nome}</span>
                    <span className="whitespace-nowrap font-medium text-earth-700">{formatBRL(item.valor)}</span>
                  </li>
                ))}
              </ul>
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
