import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatBRL } from '../lib/format'
import type { MenuItem } from '../types'

const WIFI_REDE = 'FLORADA'
const WIFI_SENHA = 'floradacafe'
// Cole aqui o link da playlist (ex.: https://open.spotify.com/playlist/XXXX). Vazio = aba mostra "em breve".
const SPOTIFY_PLAYLIST_URL = ''

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
  const embedUrl = spotifyEmbedUrl(SPOTIFY_PLAYLIST_URL)

  useEffect(() => {
    supabase
      .from('menu_items')
      .select('*')
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
            <h2 className="mb-2 font-script text-2xl text-earth-900">Nossa história</h2>
            <div className="space-y-3 text-sm leading-relaxed text-earth-700">
              <p>
                O Florada nasceu do desejo de reunir as pessoas ao redor de uma boa mesa, no meio do campo. Tudo começou
                com um pedaço de terra, algumas sementes de girassol e a vontade de desacelerar.
              </p>
              <p>
                Hoje, nos fins de semana e feriados, abrimos as portas para você tomar um café com calma, provar o que é
                feito com carinho e se perder entre as flores que dão nome ao lugar.
              </p>
              <p>Seja bem-vindo à nossa casa. Aproveite cada instante!</p>
            </div>
          </section>
        )}

        {aba === 'cardapio' && (
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-script text-2xl text-earth-900">Cardápio</h2>
            {items === null ? (
              <p className="py-4 text-center text-sm text-earth-500">Carregando...</p>
            ) : items.length === 0 ? (
              <p className="py-4 text-center text-sm text-earth-500">Cardápio em breve.</p>
            ) : (
              <ul className="divide-y divide-earth-100">
                {items.map((item) => (
                  <li key={item.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                    <span className="text-earth-900">{item.nome}</span>
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
