'use client'
import { useEffect, useState, useCallback } from 'react'
import { Calendar, Clock, RefreshCw } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { SelectNative } from '@/components/ui/select-native'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import type { LogEntry, ApiList } from '../_shared'
import { ACTION_COLORS } from '../_shared'

export default function LogsPage() {
  const [logs, setLogs]               = useState<LogEntry[]>([])
  const [loading, setLoading]         = useState(true)
  const [filterAction, setFilterAction] = useState('')
  const [filterUser, setFilterUser]   = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (filterAction) p.set('action', filterAction)
    if (filterUser)   p.set('user', filterUser)
    apiFetch<ApiList<LogEntry>>(`/logs/?${p}`).then(d => setLogs(d.results)).catch(() => {}).finally(() => setLoading(false))
  }, [filterAction, filterUser])
  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Journal d'activité</h1>
          <p className="text-sm text-slate-400 mt-0.5">{logs.length} entrée{logs.length > 1 ? 's' : ''} — actions et connexions</p>
        </div>
        <button onClick={load} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors">
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Input className="h-8 text-xs w-52" placeholder="Rechercher un login…" value={filterUser} onChange={e => setFilterUser(e.target.value)} />
        <SelectNative className="h-8 text-xs w-auto" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="">Toutes les actions</option>
          <option value="login">Connexions</option>
          <option value="logout">Déconnexions</option>
          <option value="create_user">Création comptes</option>
          <option value="update_user">Modification comptes</option>
          <option value="delete_user">Suppression comptes</option>
          <option value="create_insc">Inscriptions</option>
          <option value="reinscription">Réinscriptions</option>
          <option value="create_classe">Création classes</option>
          <option value="create_ue">Création UE</option>
        </SelectNative>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date / Heure</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Université</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(10).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-14">Aucun log trouvé.</TableCell></TableRow>
            ) : logs.map(log => {
              const ac = ACTION_COLORS[log.action] ?? { bg: 'rgba(100,116,139,0.1)', color: '#64748b' }
              return (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><Calendar size={11} className="text-slate-300" />{new Date(log.created_at).toLocaleDateString('fr-FR')}</div>
                    <div className="flex items-center gap-1.5 mt-0.5"><Clock size={11} className="text-slate-300" />{new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900 text-sm">{log.user_nom || log.user_login || '—'}</div>
                    {log.user_nom && log.user_login && <div className="text-xs text-slate-400">{log.user_login}</div>}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap" style={{ background: ac.bg, color: ac.color }}>
                      {log.action_label}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 max-w-xs truncate">{log.description || '—'}</TableCell>
                  <TableCell className="text-xs text-slate-400">{log.university_name ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{log.ip ?? '—'}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
