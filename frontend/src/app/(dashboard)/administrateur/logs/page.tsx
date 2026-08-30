'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { RefreshCw, Activity } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { LogEntry, ApiList } from '../_shared'
import { ACTION_COLORS } from '../_shared'
import { TABLE_STYLE, SearchInput, Pager } from '../_table'

const PAGE_SIZE = 20

const ACTIONS = [
  { value: 'login',         label: 'Connexion' },
  { value: 'logout',        label: 'Déconnexion' },
  { value: 'create_user',   label: 'Création compte' },
  { value: 'update_user',   label: 'Modif. compte' },
  { value: 'delete_user',   label: 'Suppression compte' },
  { value: 'create_insc',   label: 'Inscription' },
  { value: 'reinscription', label: 'Réinscription' },
  { value: 'create_classe', label: 'Classe créée' },
  { value: 'create_ue',     label: 'UE créée' },
  { value: 'system',        label: 'Système' },
]

export default function LogsPage() {
  const [logs, setLogs]             = useState<LogEntry[]>([])
  const [loading, setLoading]       = useState(true)
  const [filterAction, setFilterAction] = useState('')
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams({ limit: '500' })
    if (filterAction) p.set('action', filterAction)
    if (search) p.set('user', search)
    apiFetch<ApiList<LogEntry>>(`/logs/?${p}`).then(d => setLogs(d.results)).catch(() => {}).finally(() => setLoading(false))
  }, [filterAction, search])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => logs, [logs])
  const paged    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function fmtDate(s: string) {
    const d = new Date(s)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  function actionStyle(action: string) {
    return ACTION_COLORS[action] || { bg: 'rgba(100,116,139,0.1)', color: '#64748b' }
  }

  function actionLabel(action: string) {
    return ACTIONS.find(a => a.value === action)?.label || action
  }

  return (
    <>
      {TABLE_STYLE}
      <style>{`
        .pg-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:0.75rem; }
        .pg-title  { font-size:1.125rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
        .pg-sub    { font-size:0.75rem; color:#94a3b8; margin:.25rem 0 0; }
        .spin      { animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="pg-header">
        <div>
          <h1 className="pg-title">Journal d'activité</h1>
          <p className="pg-sub">{loading ? 'Chargement…' : `${filtered.length} entrée${filtered.length !== 1 ? 's' : ''}`}</p>
        </div>
        <button className="pt-add" onClick={load} style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Actualiser
        </button>
      </div>

      <div className="pt-wrap">
        <div className="pt-toolbar">
          <div className="pt-toolbar-left">
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Rechercher un utilisateur…" />
            <select className="pt-sel" value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1) }}>
              <option value="">Toutes les actions</option>
              {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        </div>

        <table className="pt-table">
          <thead>
            <tr>
              <th>Date & heure</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Université</th>
              <th>Description</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6}><div className="pt-empty" style={{ padding: '2.5rem' }}><RefreshCw size={22} className="spin" style={{ margin: '0 auto 8px', opacity: 0.4, display: 'block' }} /><div>Chargement…</div></div></td></tr>
            )}
            {!loading && paged.length === 0 && (
              <tr><td colSpan={6}><div className="pt-empty"><Activity size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} /><div>Aucune activité trouvée</div></div></td></tr>
            )}
            {!loading && paged.map(log => {
              const st = actionStyle(log.action)
              return (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtDate(log.created_at)}</td>
                  <td>
                    <div className="pt-primary">{log.user_nom || log.user_login}</div>
                    {log.user_nom && <div className="pt-secondary">{log.user_login}</div>}
                  </td>
                  <td>
                    <span className="pt-badge" style={{ background: st.bg, color: st.color }}>{actionLabel(log.action)}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{log.university_name || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ fontSize: '0.8rem', color: '#475569', maxWidth: 280 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.description || '—'}</div>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{log.ip || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="pt-footer">
          <span className="pt-count">
            {filtered.length === 0 ? 'Aucun résultat' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} sur ${filtered.length}`}
          </span>
          <Pager total={filtered.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>
    </>
  )
}
