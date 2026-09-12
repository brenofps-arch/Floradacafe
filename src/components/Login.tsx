import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'

const LOGIN_DOMAIN = 'floradacafe.app'

function toEmail(usuario: string) {
  const trimmed = usuario.trim()
  return trimmed.includes('@') ? trimmed : `${trimmed.toLowerCase()}@${LOGIN_DOMAIN}`
}

export function Login() {
  const { signIn } = useAuth()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(toEmail(usuario), password)
    setLoading(false)
    if (error) setError('Usuário ou senha inválidos.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sun-100 via-sun-50 to-field-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-sun-200 bg-white p-8 shadow-sm">
        <p className="mb-1 text-center text-4xl">🌻</p>
        <h1 className="mb-1 text-center font-script text-4xl text-earth-900">Florada Café</h1>
        <p className="mb-6 text-center text-sm text-earth-500">Agendamentos e faturamento do café rural</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-earth-700">Usuário</label>
            <input
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full rounded-lg border border-earth-200 px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
              placeholder="Seu usuário"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-earth-700">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-earth-200 px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-sun-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sun-600 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-earth-400">
          Contas de funcionários são criadas pelo dono no painel do Supabase (Authentication → Users).
        </p>
      </div>
    </div>
  )
}
