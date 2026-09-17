import { useState } from 'react'
import { displayNameFromEmail } from '../lib/format'
import type { AuditLogEntry } from '../types'

interface Props {
  entries: AuditLogEntry[]
  loading: boolean
  onClose: () => void
}

const ACTION_LABEL: Record<AuditLogEntry['action'], { label: string; classes: string }> = {
  insert: { label: 'Criou', classes: 'bg-field-100 text-field-700' },
  update: { label: 'Editou', classes: 'bg-sun-100 text-sun-800' },
  delete: { label: 'Excluiu', classes: 'bg-red-100 text-red-700' },
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AuditLogModal({ entries, loading, onClose }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-earth-900/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-sun-50 p-6 shadow-lg">
        <h2 className="mb-1 font-script text-2xl text-earth-900">Atividade recente</h2>
        <p className="mb-4 text-sm text-earth-600">
          Quem criou, editou ou excluiu agendamentos — as {entries.length} ações mais recentes.
        </p>

        {loading ? (
          <p className="py-10 text-center text-sm text-earth-500">Carregando...</p>
        ) : entries.length === 0 ? (
          <p className="py-10 text-center text-sm text-earth-500">Nenhuma atividade registrada ainda.</p>
        ) : (
          <ul className="divide-y divide-earth-100 rounded-lg border border-earth-100 bg-white">
            {entries.map((entry) => {
              const action = ACTION_LABEL[entry.action]
              const isExpanded = expandedId === entry.id
              return (
                <li key={entry.id} className="px-3 py-2 text-sm">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="flex w-full items-start justify-between gap-2 text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${action.classes}`}>
                          {action.label}
                        </span>
                        <span className="text-earth-900">{entry.summary ?? entry.record_id}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-earth-500">
                        {entry.actor_email ? displayNameFromEmail(entry.actor_email) : 'Desconhecido'} ·{' '}
                        {formatDateTime(entry.created_at)}
                      </p>
                    </div>
                    <span className="text-earth-400">{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  {isExpanded && (
                    <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-earth-50 p-2 text-xs text-earth-700">
                      {JSON.stringify(entry.data, null, 2)}
                    </pre>
                  )}
                </li>
              )
            })}
          </ul>
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
