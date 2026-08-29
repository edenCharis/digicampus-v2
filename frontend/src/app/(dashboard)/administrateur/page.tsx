'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Building2, GraduationCap, Users, Settings, Plus, Pencil, Trash2,
  CheckCircle2, AlertTriangle, Globe, BarChart2, Activity,
  ShieldCheck, TrendingUp, TrendingDown, Minus,
  Calendar, Clock, Wifi, WifiOff, Ban, RefreshCw,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SelectNative } from '@/components/ui/select-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'

/* ── Types ── */
interface University    { id: number; code: string; libelle: string; email_contact: string; tel_contact: string; ville: string }
interface Etablissement { id: number; code: string; libelle: string; university: number; university_name: string; email: string; tel: string; ville: string }
interface AppUser       { id: number; login: string; nom: string; email: string; role: string; university: number; etablissement: number | null; etablissement_name: string | null; is_active: boolean }
interface Annee         { id: number; libelle: string; is_active: boolean; etablissement: number }
interface Cycle         { id: number; code: string; libelle: string; etablissement: number }
interface Specialite    { id: number; code: string; libelle: string; cycle: number | null; cycle_libelle: string | null; etablissement: number }
interface Abonnement    { id: number; university: number; university_name: string; university_code: string; statut: string; date_debut: string | null; date_fin: string | null; max_users: number; modules: string[]; notes: string; user_count: number; updated_at: string }
interface LogEntry      { id: number; user_login: string; user_nom: string; action: string; action_label: string; description: string; ip: string | null; university_name: string | null; created_at: string }
interface AdminStats    { universities: number; etablissements: number; users_total: number; abonnements: number; abonnes_actifs: number; connexions_today: number; connexions_yesterday: number; connexions_week: { date: string; count: number }[]; users_by_role: { role: string; count: number }[]; recent_logs: LogEntry[] }
interface ApiList<T>    { count: number; results: T[] }

const ROLES = ['scolarité','doyen','enseignant','professeur','cours','inscription','anonymat','daarhspe','gesnote','soutenance','suivi','caisse','pvd']
const ALL_MODULES = ['scolarite','inscription','notes','cours','anonymat','suivi','caisse','pvd','soutenance','daarhspe']
const ABONNEMENT_STATUTS = [
  { value: 'actif',    label: 'Actif',     color: '#10b981' },
  { value: 'essai',    label: 'Essai',     color: '#f59e0b' },
  { value: 'expiré',  label: 'Expiré',    color: '#ef4444' },
  { value: 'suspendu', label: 'Suspendu',  color: '#6b7280' },
]
const ROLE_COLORS: Record<string, string> = {
  'scolarité':'#1AAFE6',doyen:'#8b5cf6',enseignant:'#f59e0b',professeur:'#10b981',
  cours:'#06b6d4',inscription:'#3b82f6',anonymat:'#6366f1',daarhspe:'#ec4899',
  gesnote:'#14b8a6',soutenance:'#f97316',suivi:'#84cc16',caisse:'#eab308',pvd:'#a78bfa',
}

/* ── Micro-components ── */
function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700 mb-4">
      <AlertTriangle size={14} className="shrink-0" /> {msg}
    </div>
  )
}
function ConfirmDialog({ open, msg, onYes, onNo }: { open: boolean; msg: string; onYes: () => void; onNo: () => void }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onNo()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 size={17} className="text-red-500" />
            </div>
            <DialogTitle>Confirmation</DialogTitle>
          </div>
          <DialogDescription>{msg}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={onNo}>Annuler</Button>
          <Button variant="danger" size="sm" onClick={onYes}>Supprimer</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
function F({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {label}{req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
function ListRow({ icon: Icon, iconColor, iconBg, primary, secondary, onEdit, onDelete, isLast }: {
  icon: React.ElementType; iconColor: string; iconBg: string
  primary: string; secondary?: string
  onEdit: () => void; onDelete: () => void; isLast: boolean
}) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3.5 group', !isLast && 'border-b border-slate-50')}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-800 text-sm truncate">{primary}</div>
        {secondary && <div className="text-xs text-slate-400 mt-0.5 truncate">{secondary}</div>}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Pencil size={13} /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   TAB 1 — DASHBOARD
══════════════════════════════════════════ */
function TabDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<AdminStats>('/admin-stats/').then(setStats).catch(console.error).finally(() => setLoading(false))
  }, [])

  const connexionTrend = stats ? stats.connexions_today - stats.connexions_yesterday : 0
  const maxConn = Math.max(...(stats?.connexions_week.map(d => d.count) ?? [1]), 1)

  const kpis = [
    { label: 'Universités',          value: stats?.universities ?? '—',      icon: Building2,     color: '#1AAFE6', bg: 'rgba(26,175,230,0.08)',  sub: 'Partenaires actifs' },
    { label: 'Établissements',       value: stats?.etablissements ?? '—',    icon: GraduationCap, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', sub: 'Facultés & écoles' },
    { label: 'Comptes actifs',       value: stats?.users_total ?? '—',       icon: Users,         color: '#10b981', bg: 'rgba(16,185,129,0.08)', sub: 'Utilisateurs du système' },
    { label: "Connexions aujourd'hui", value: stats?.connexions_today ?? '—', icon: Wifi,          color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', sub: connexionTrend === 0 ? 'Stable' : connexionTrend > 0 ? `+${connexionTrend} vs hier` : `${connexionTrend} vs hier`, trend: connexionTrend },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <Card key={k.label} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
                    <Icon size={17} style={{ color: k.color }} />
                  </div>
                  {k.trend !== undefined && k.trend !== 0 && (
                    <span className={cn('flex items-center gap-0.5 text-xs font-semibold', k.trend > 0 ? 'text-emerald-500' : 'text-red-400')}>
                      {k.trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {Math.abs(k.trend)}
                    </span>
                  )}
                  {k.trend === 0 && k.trend !== undefined && <Minus size={13} className="text-slate-300" />}
                </div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">{loading ? <span className="text-slate-200">—</span> : k.value}</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{k.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{k.sub}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-bold text-slate-900 text-sm">Connexions — 7 derniers jours</div>
                <div className="text-xs text-slate-400 mt-0.5">Activité quotidienne de la plateforme</div>
              </div>
              <BarChart2 size={16} className="text-slate-300" />
            </div>
            <div className="flex items-end gap-2 h-28">
              {(stats?.connexions_week ?? Array(7).fill({ date: '', count: 0 })).map((d, i) => {
                const h = maxConn > 0 ? Math.max(4, Math.round((d.count / maxConn) * 96)) : 4
                const isToday = i === 6
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-semibold text-slate-400">{d.count || ''}</span>
                    <div className="w-full rounded-md transition-all" style={{ height: `${h}px`, background: isToday ? '#1AAFE6' : 'rgba(26,175,230,0.18)' }} />
                    <span className="text-[9px] text-slate-400">
                      {d.date ? new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }) : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="font-bold text-slate-900 text-sm mb-1">Comptes par rôle</div>
            <div className="text-xs text-slate-400 mb-4">Répartition des utilisateurs</div>
            <div className="space-y-2.5">
              {loading
                ? Array(5).fill(0).map((_, i) => <div key={i} className="h-5 bg-slate-100 rounded animate-pulse" />)
                : stats?.users_by_role.slice(0, 6).map(r => {
                    const color = ROLE_COLORS[r.role] ?? '#64748b'
                    const pct = stats.users_total > 0 ? Math.round((r.count / stats.users_total) * 100) : 0
                    return (
                      <div key={r.role}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-slate-700 capitalize">{r.role}</span>
                          <span className="text-xs font-bold text-slate-500">{r.count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    )
                  })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50">
          <div className="font-bold text-slate-900 text-sm">Activité récente</div>
          <Activity size={14} className="text-slate-300" />
        </div>
        {loading
          ? <div className="p-5 space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}</div>
          : stats?.recent_logs.length === 0
            ? <div className="py-10 text-center text-slate-400 text-sm">Aucune activité récente.</div>
            : stats?.recent_logs.map((log, i) => (
              <div key={log.id} className={cn('flex items-center gap-3 px-5 py-3', i < (stats.recent_logs.length - 1) && 'border-b border-slate-50')}>
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                  <Activity size={13} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-800 truncate">
                    <span className="font-semibold">{log.user_nom || log.user_login || 'Système'}</span>
                    <span className="text-slate-400 ml-1.5">{log.description}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{log.university_name ?? ''}</div>
                </div>
                <div className="text-[11px] text-slate-400 shrink-0">
                  {new Date(log.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
      </Card>
    </div>
  )
}

/* ══════════════════════════════════════════
   TAB 2 — UNIVERSITÉS
══════════════════════════════════════════ */
function TabUniversites() {
  const [list, setList]       = useState<University[]>([])
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<University | null>(null)
  const [del, setDel]         = useState<University | null>(null)
  const [form, setForm]       = useState({ code: '', libelle: '', email_contact: '', tel_contact: '', ville: '' })
  const [err, setErr]         = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(() => {
    apiFetch<ApiList<University>>('/universities/').then(d => setList(d.results)).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  function openNew() { setEditing(null); setForm({ code: '', libelle: '', email_contact: '', tel_contact: '', ville: '' }); setErr(null); setOpen(true) }
  function openEdit(u: University) { setEditing(u); setForm({ code: u.code, libelle: u.libelle, email_contact: u.email_contact, tel_contact: u.tel_contact, ville: u.ville }); setErr(null); setOpen(true) }

  async function save() {
    setSaving(true); setErr(null)
    try {
      if (!editing) await apiFetch('/universities/', { method: 'POST', body: JSON.stringify(form) })
      else await apiFetch(`/universities/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(form) })
      setOpen(false); load()
    } catch (e: unknown) { setErr(JSON.stringify(e)) } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!del) return
    await apiFetch(`/universities/${del.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{list.length} université{list.length > 1 ? 's' : ''}</p>
        <Button size="sm" onClick={openNew}><Plus size={14} /> Nouvelle université</Button>
      </div>
      <Card>
        {list.length === 0
          ? <div className="py-12 text-center text-slate-400 text-sm">Aucune université enregistrée.</div>
          : list.map((u, i) => (
            <ListRow key={u.id} icon={Building2} iconColor="#1AAFE6" iconBg="rgba(26,175,230,0.08)"
              primary={u.libelle} secondary={`${u.code} · ${u.ville}`}
              onEdit={() => openEdit(u)} onDelete={() => setDel(u)} isLast={i === list.length - 1}
            />
          ))}
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier' : 'Nouvelle université'}</DialogTitle>
            <DialogDescription>Informations de l'institution partenaire.</DialogDescription>
          </DialogHeader>
          {err && <ErrBox msg={err} />}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <F label="Code" req><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="UDSN" /></F>
              <F label="Ville"><Input value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} /></F>
            </div>
            <F label="Libellé" req><Input value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Email"><Input type="email" value={form.email_contact} onChange={e => setForm(f => ({ ...f, email_contact: e.target.value }))} /></F>
              <F label="Téléphone"><Input value={form.tel_contact} onChange={e => setForm(f => ({ ...f, tel_contact: e.target.value }))} /></F>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? '…' : 'Enregistrer'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} msg={`Supprimer "${del?.libelle}" ?`} onYes={doDelete} onNo={() => setDel(null)} />
    </div>
  )
}

/* ══════════════════════════════════════════
   TAB 3 — ÉTABLISSEMENTS
══════════════════════════════════════════ */
function TabEtablissements() {
  const [univs, setUnivs]       = useState<University[]>([])
  const [list, setList]         = useState<Etablissement[]>([])
  const [filterUniv, setFilterUniv] = useState('')
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState<Etablissement | null>(null)
  const [del, setDel]           = useState<Etablissement | null>(null)
  const [form, setForm]         = useState({ code: '', libelle: '', university: '', email: '', tel: '', ville: '' })
  const [err, setErr]           = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    apiFetch<ApiList<University>>('/universities/').then(d => {
      setUnivs(d.results)
      if (d.results[0]) setFilterUniv(String(d.results[0].id))
    }).catch(() => {})
  }, [])

  const load = useCallback(() => {
    const q = filterUniv ? `?university=${filterUniv}` : ''
    apiFetch<ApiList<Etablissement>>(`/etablissements/${q}`).then(d => setList(d.results)).catch(() => {})
  }, [filterUniv])
  useEffect(() => { load() }, [load])

  function openNew() { setEditing(null); setForm({ code: '', libelle: '', university: filterUniv, email: '', tel: '', ville: '' }); setErr(null); setOpen(true) }
  function openEdit(e: Etablissement) { setEditing(e); setForm({ code: e.code, libelle: e.libelle, university: String(e.university), email: e.email, tel: e.tel, ville: e.ville }); setErr(null); setOpen(true) }

  async function save() {
    setSaving(true); setErr(null)
    try {
      const body = { ...form, university: Number(form.university) }
      if (!editing) await apiFetch('/etablissements/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/etablissements/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setOpen(false); load()
    } catch (e: unknown) { setErr(JSON.stringify(e)) } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!del) return
    await apiFetch(`/etablissements/${del.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-500">{list.length} établissement{list.length > 1 ? 's' : ''}</p>
          <SelectNative className="w-auto text-xs h-7" value={filterUniv} onChange={e => setFilterUniv(e.target.value)}>
            {univs.map(u => <option key={u.id} value={u.id}>{u.code}</option>)}
          </SelectNative>
        </div>
        <Button size="sm" onClick={openNew}><Plus size={14} /> Nouvel établissement</Button>
      </div>
      <Card>
        {list.length === 0
          ? <div className="py-12 text-center text-slate-400 text-sm">Aucun établissement.</div>
          : list.map((e, i) => (
            <ListRow key={e.id} icon={GraduationCap} iconColor="#8b5cf6" iconBg="rgba(139,92,246,0.08)"
              primary={e.libelle} secondary={`${e.code} · ${e.university_name} · ${e.ville}`}
              onEdit={() => openEdit(e)} onDelete={() => setDel(e)} isLast={i === list.length - 1}
            />
          ))}
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier' : 'Nouvel établissement'}</DialogTitle></DialogHeader>
          {err && <ErrBox msg={err} />}
          <div className="space-y-3">
            <F label="Université" req>
              <SelectNative value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))}>
                <option value="">— sélectionner —</option>
                {univs.map(u => <option key={u.id} value={u.id}>{u.libelle}</option>)}
              </SelectNative>
            </F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Code" req><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="FIT" /></F>
              <F label="Ville"><Input value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} /></F>
            </div>
            <F label="Libellé" req><Input value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Email"><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></F>
              <F label="Téléphone"><Input value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} /></F>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? '…' : 'Enregistrer'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} msg={`Supprimer "${del?.libelle}" ?`} onYes={doDelete} onNo={() => setDel(null)} />
    </div>
  )
}

/* ══════════════════════════════════════════
   TAB 4 — COMPTES
══════════════════════════════════════════ */
function TabComptes() {
  const [etabs, setEtabs]       = useState<Etablissement[]>([])
  const [list, setList]         = useState<AppUser[]>([])
  const [filterRole, setFilterRole] = useState('')
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState<AppUser | null>(null)
  const [del, setDel]           = useState<AppUser | null>(null)
  const [form, setForm]         = useState({ login: '', nom: '', email: '', role: ROLES[0], password: '', etablissement: '', is_active: true })
  const [err, setErr]           = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)

  const load = useCallback(() => {
    const q = filterRole ? `?role=${encodeURIComponent(filterRole)}` : ''
    apiFetch<ApiList<AppUser>>(`/users/${q}`).then(d => setList(d.results)).catch(() => {})
  }, [filterRole])

  useEffect(() => {
    load()
    apiFetch<ApiList<Etablissement>>('/etablissements/?limit=100').then(d => setEtabs(d.results)).catch(() => {})
  }, [load])

  function openNew() {
    setEditing(null)
    const me = JSON.parse(localStorage.getItem('dc_user') ?? '{}')
    setForm({ login: '', nom: '', email: '', role: ROLES[0], password: '', etablissement: String(me.etablissement ?? etabs[0]?.id ?? ''), is_active: true })
    setErr(null); setOpen(true)
  }
  function openEdit(u: AppUser) {
    setEditing(u)
    setForm({ login: u.login, nom: u.nom, email: u.email ?? '', role: u.role, password: '', etablissement: String(u.etablissement ?? ''), is_active: u.is_active })
    setErr(null); setOpen(true)
  }

  async function save() {
    setSaving(true); setErr(null)
    try {
      const me = JSON.parse(localStorage.getItem('dc_user') ?? '{}')
      const body: Record<string, unknown> = { login: form.login, nom: form.nom, email: form.email || undefined, role: form.role, is_active: form.is_active, university: me.university, etablissement: form.etablissement ? Number(form.etablissement) : null }
      if (form.password) body.password = form.password
      if (!editing) await apiFetch('/users/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/users/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setOpen(false); load()
    } catch (e: unknown) {
      const err = e as Record<string, unknown>
      setErr(err?.login ? `Login : ${err.login}` : JSON.stringify(e))
    } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!del) return
    await apiFetch(`/users/${del.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  const grouped = ROLES.reduce<Record<string, AppUser[]>>((acc, r) => {
    const users = list.filter(u => u.role === r)
    if (users.length) acc[r] = users
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-500">{list.length} compte{list.length > 1 ? 's' : ''}</p>
          <SelectNative className="w-auto text-xs h-7" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">Tous les rôles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </SelectNative>
        </div>
        <Button size="sm" onClick={openNew}><Plus size={14} /> Nouveau compte</Button>
      </div>
      <div className="space-y-3">
        {Object.entries(grouped).map(([role, users]) => {
          const color = ROLE_COLORS[role] ?? '#64748b'
          return (
            <div key={role}>
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: `${color}18`, color }}>{role}</span>
                <span className="text-xs text-slate-400">{users.length}</span>
              </div>
              <Card>
                {users.map((u, i) => (
                  <div key={u.id} className={cn('flex items-center gap-3 px-4 py-3 group', i < users.length - 1 && 'border-b border-slate-50')}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `${color}18`, color }}>
                      {u.nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-sm">{u.nom}</span>
                        {!u.is_active && <Badge variant="danger" className="text-[10px] py-0">Inactif</Badge>}
                      </div>
                      <div className="text-xs text-slate-400">{u.login}{u.etablissement_name ? ` · ${u.etablissement_name}` : ''}</div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => setDel(u)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )
        })}
        {list.length === 0 && <Card><div className="py-12 text-center text-slate-400 text-sm">Aucun compte.</div></Card>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier le compte' : 'Nouveau compte'}</DialogTitle></DialogHeader>
          {err && <ErrBox msg={err} />}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <F label="Login" req><Input value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} /></F>
              <F label={editing ? 'Nouveau mdp' : 'Mot de passe *'}>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
              </F>
            </div>
            <F label="Nom complet" req><Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></F>
            <div className="grid grid-cols-2 gap-3">
              <F label="Rôle" req>
                <SelectNative value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </SelectNative>
              </F>
              <F label="Établissement">
                <SelectNative value={form.etablissement} onChange={e => setForm(f => ({ ...f, etablissement: e.target.value }))}>
                  <option value="">— aucun —</option>
                  {etabs.map(e => <option key={e.id} value={e.id}>{e.code}</option>)}
                </SelectNative>
              </F>
            </div>
            <F label="Email"><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></F>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
              <input type="checkbox" className="rounded accent-brand w-4 h-4" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              Compte actif
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? '…' : 'Enregistrer'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} msg={`Supprimer "${del?.nom}" ?`} onYes={doDelete} onNo={() => setDel(null)} />
    </div>
  )
}

/* ══════════════════════════════════════════
   TAB 5 — ABONNEMENTS
══════════════════════════════════════════ */
function TabAbonnements() {
  const [univs, setUnivs]     = useState<University[]>([])
  const [abons, setAbons]     = useState<Abonnement[]>([])
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Abonnement | null>(null)
  const [form, setForm]       = useState({ statut: 'essai', date_debut: '', date_fin: '', max_users: '50', modules: [] as string[], notes: '' })
  const [err, setErr]         = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(() => {
    apiFetch<ApiList<Abonnement>>('/abonnements/').then(d => setAbons(d.results)).catch(() => {})
    apiFetch<ApiList<University>>('/universities/').then(d => setUnivs(d.results)).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  function openEdit(ab: Abonnement) {
    setEditing(ab)
    setForm({ statut: ab.statut, date_debut: ab.date_debut ?? '', date_fin: ab.date_fin ?? '', max_users: String(ab.max_users), modules: ab.modules ?? [], notes: ab.notes })
    setErr(null); setOpen(true)
  }

  async function ensureAndEdit(univ: University) {
    try {
      const ab = await apiFetch<Abonnement>('/abonnements/ensure/', { method: 'POST', body: JSON.stringify({ university: univ.id }) })
      openEdit(ab); load()
    } catch (e) { console.error(e) }
  }

  async function save() {
    if (!editing) return
    setSaving(true); setErr(null)
    try {
      await apiFetch(`/abonnements/${editing.id}/`, { method: 'PATCH', body: JSON.stringify({ ...form, max_users: Number(form.max_users), date_debut: form.date_debut || null, date_fin: form.date_fin || null }) })
      setOpen(false); load()
    } catch (e: unknown) { setErr(JSON.stringify(e)) } finally { setSaving(false) }
  }

  function toggleModule(m: string) {
    setForm(f => ({ ...f, modules: f.modules.includes(m) ? f.modules.filter(x => x !== m) : [...f.modules, m] }))
  }

  const rows = univs.map(u => ({ univ: u, ab: abons.find(a => a.university === u.id) ?? null }))

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Gestion des licences et accès par université</p>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Université</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Utilisateurs</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0
              ? <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-10">Aucune université.</TableCell></TableRow>
              : rows.map(({ univ, ab }) => {
                const s = ABONNEMENT_STATUTS.find(x => x.value === ab?.statut)
                return (
                  <TableRow key={univ.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Globe size={14} className="text-brand" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{univ.libelle}</div>
                          <div className="text-xs text-slate-400">{univ.code} · {univ.ville}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ab
                        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: `${s?.color ?? '#64748b'}18`, color: s?.color ?? '#64748b' }}>
                            {ab.statut === 'actif' ? <CheckCircle2 size={11} /> : ab.statut === 'suspendu' ? <Ban size={11} /> : ab.statut === 'expiré' ? <WifiOff size={11} /> : <Clock size={11} />}
                            {s?.label ?? ab.statut}
                          </span>
                        : <span className="text-xs text-slate-400 italic">Non configuré</span>}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {ab?.date_fin ? new Date(ab.date_fin).toLocaleDateString('fr-FR') : <span className="text-slate-300">—</span>}
                    </TableCell>
                    <TableCell>
                      {ab ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 text-sm">{ab.user_count}</span>
                          <span className="text-slate-400 text-xs">/ {ab.max_users}</span>
                          <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.round((ab.user_count / ab.max_users) * 100))}%` }} />
                          </div>
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </TableCell>
                    <TableCell>
                      {ab?.modules?.length
                        ? <div className="flex flex-wrap gap-1">{ab.modules.slice(0, 3).map(m => <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{m}</span>)}{ab.modules.length > 3 && <span className="text-[10px] text-slate-400">+{ab.modules.length - 3}</span>}</div>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => ab ? openEdit(ab) : ensureAndEdit(univ)}
                        className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline ml-auto">
                        <Pencil size={12} /> {ab ? 'Modifier' : 'Configurer'}
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Abonnement — {editing?.university_name}</DialogTitle>
            <DialogDescription>Configurez la licence et les modules activés pour cette université.</DialogDescription>
          </DialogHeader>
          {err && <ErrBox msg={err} />}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <F label="Statut">
                <SelectNative value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                  {ABONNEMENT_STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </SelectNative>
              </F>
              <F label="Max utilisateurs">
                <Input type="number" min="1" value={form.max_users} onChange={e => setForm(f => ({ ...f, max_users: e.target.value }))} />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F label="Date début"><Input type="date" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} /></F>
              <F label="Date fin"><Input type="date" value={form.date_fin} onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))} /></F>
            </div>
            <F label="Modules activés">
              <div className="flex flex-wrap gap-2 pt-1">
                {ALL_MODULES.map(m => (
                  <button key={m} type="button" onClick={() => toggleModule(m)}
                    className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors', form.modules.includes(m) ? 'bg-brand text-white border-brand' : 'bg-white text-slate-500 border-slate-200 hover:border-brand/50')}>
                    {m}
                  </button>
                ))}
              </div>
            </F>
            <F label="Notes">
              <textarea className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </F>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? '…' : 'Enregistrer'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ══════════════════════════════════════════
   TAB 6 — LOGS
══════════════════════════════════════════ */
const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  login:         { bg: 'rgba(26,175,230,0.1)',  color: '#1AAFE6' },
  logout:        { bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
  create_user:   { bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
  update_user:   { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
  delete_user:   { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
  create_insc:   { bg: 'rgba(139,92,246,0.1)',  color: '#8b5cf6' },
  reinscription: { bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  create_classe: { bg: 'rgba(6,182,212,0.1)',   color: '#06b6d4' },
  create_ue:     { bg: 'rgba(249,115,22,0.1)',  color: '#f97316' },
  system:        { bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
}

function TabLogs() {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-500">Journal d'activité de la plateforme</p>
        <div className="flex gap-2 flex-wrap">
          <Input className="h-8 text-xs w-48" placeholder="Rechercher un login…" value={filterUser} onChange={e => setFilterUser(e.target.value)} />
          <SelectNative className="h-8 text-xs w-auto" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
            <option value="">Toutes les actions</option>
            <option value="login">Connexions</option>
            <option value="logout">Déconnexions</option>
            <option value="create_user">Création comptes</option>
            <option value="delete_user">Suppression comptes</option>
            <option value="create_insc">Inscriptions</option>
          </SelectNative>
          <button onClick={load} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw size={13} />
          </button>
        </div>
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
              Array(8).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {Array(6).fill(0).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-slate-100 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-12">Aucun log trouvé.</TableCell></TableRow>
            ) : logs.map(log => {
              const ac = ACTION_COLORS[log.action] ?? { bg: 'rgba(100,116,139,0.1)', color: '#64748b' }
              return (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-slate-300" />
                      {new Date(log.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock size={11} className="text-slate-300" />
                      {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
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

/* ══════════════════════════════════════════
   TAB 7 — PARAMÉTRAGE
══════════════════════════════════════════ */
function TabParametrage() {
  const [etabs, setEtabs]         = useState<Etablissement[]>([])
  const [etabSel, setEtabSel]     = useState('')
  const [annees, setAnnees]       = useState<Annee[]>([])
  const [cycles, setCycles]       = useState<Cycle[]>([])
  const [specs, setSpecs]         = useState<Specialite[]>([])
  const [section, setSection]     = useState<'annees'|'cycles'|'specialites'>('annees')
  const [anneeOpen, setAnneeOpen] = useState(false)
  const [cycleOpen, setCycleOpen] = useState(false)
  const [specOpen, setSpecOpen]   = useState(false)
  const [editAnnee, setEditAnnee] = useState<Annee | null>(null)
  const [editCycle, setEditCycle] = useState<Cycle | null>(null)
  const [editSpec, setEditSpec]   = useState<Specialite | null>(null)
  const [delTarget, setDelTarget] = useState<{ type: string; id: number; label: string } | null>(null)
  const [anneeForm, setAnneeForm] = useState({ libelle: '', is_active: false })
  const [cycleForm, setCycleForm] = useState({ code: '', libelle: '' })
  const [specForm, setSpecForm]   = useState({ code: '', libelle: '', cycle: '' })
  const [err, setErr]             = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    apiFetch<ApiList<Etablissement>>('/etablissements/?limit=100').then(d => {
      setEtabs(d.results)
      if (d.results[0]) setEtabSel(String(d.results[0].id))
    }).catch(() => {})
  }, [])

  const loadAll = useCallback(() => {
    if (!etabSel) return
    apiFetch<ApiList<Annee>>('/annees/?limit=100').then(d => setAnnees(d.results.filter(a => a.etablissement === Number(etabSel)))).catch(() => {})
    apiFetch<ApiList<Cycle>>('/cycles/?limit=100').then(d => setCycles(d.results.filter(c => c.etablissement === Number(etabSel)))).catch(() => {})
    apiFetch<ApiList<Specialite>>('/specialites/?limit=100').then(d => setSpecs(d.results.filter(s => s.etablissement === Number(etabSel)))).catch(() => {})
  }, [etabSel])
  useEffect(() => { loadAll() }, [loadAll])

  async function saveAnnee() {
    setSaving(true); setErr(null)
    try {
      const body = { ...anneeForm, etablissement: Number(etabSel) }
      if (!editAnnee) await apiFetch('/annees/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/annees/${editAnnee.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setAnneeOpen(false); loadAll()
    } catch (e: unknown) { setErr(JSON.stringify(e)) } finally { setSaving(false) }
  }
  async function saveCycle() {
    setSaving(true); setErr(null)
    try {
      const body = { ...cycleForm, etablissement: Number(etabSel) }
      if (!editCycle) await apiFetch('/cycles/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/cycles/${editCycle.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setCycleOpen(false); loadAll()
    } catch (e: unknown) { setErr(JSON.stringify(e)) } finally { setSaving(false) }
  }
  async function saveSpec() {
    setSaving(true); setErr(null)
    try {
      const body = { ...specForm, cycle: specForm.cycle ? Number(specForm.cycle) : null, etablissement: Number(etabSel) }
      if (!editSpec) await apiFetch('/specialites/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/specialites/${editSpec.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setSpecOpen(false); loadAll()
    } catch (e: unknown) { setErr(JSON.stringify(e)) } finally { setSaving(false) }
  }
  async function doDelete() {
    if (!delTarget) return
    const map: Record<string, string> = { annee: '/annees/', cycle: '/cycles/', specialite: '/specialites/' }
    await apiFetch(`${map[delTarget.type]}${delTarget.id}/`, { method: 'DELETE' }).catch(() => {})
    setDelTarget(null); loadAll()
  }

  const sections = [
    { id: 'annees' as const,      label: 'Années',      count: annees.length },
    { id: 'cycles' as const,      label: 'Cycles',      count: cycles.length },
    { id: 'specialites' as const, label: 'Spécialités', count: specs.length },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <SelectNative className="w-auto" value={etabSel} onChange={e => setEtabSel(e.target.value)}>
          {etabs.map(e => <option key={e.id} value={e.id}>{e.code} — {e.libelle}</option>)}
        </SelectNative>
      </div>
      <div className="flex gap-1.5">
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border', section === s.id ? 'bg-brand text-white border-brand shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}>
            {s.label}
            <span className={cn('text-[10px] font-bold rounded-full px-1.5', section === s.id ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500')}>{s.count}</span>
          </button>
        ))}
      </div>

      {section === 'annees' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditAnnee(null); setAnneeForm({ libelle: '', is_active: false }); setErr(null); setAnneeOpen(true) }}>
              <Plus size={14} /> Nouvelle année
            </Button>
          </div>
          <Card>
            {annees.length === 0
              ? <div className="py-10 text-center text-slate-400 text-sm">Aucune année.</div>
              : annees.map((a, i) => (
                <div key={a.id} className={cn('flex items-center gap-3 px-4 py-3.5 group', i < annees.length - 1 && 'border-b border-slate-50')}>
                  <div className="flex-1 flex items-center gap-3">
                    <span className="font-bold text-slate-800">{a.libelle}</span>
                    {a.is_active && <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> Active</span>}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditAnnee(a); setAnneeForm({ libelle: a.libelle, is_active: a.is_active }); setErr(null); setAnneeOpen(true) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil size={13} /></button>
                    <button onClick={() => setDelTarget({ type: 'annee', id: a.id, label: a.libelle })} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
          </Card>
        </div>
      )}
      {section === 'cycles' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditCycle(null); setCycleForm({ code: '', libelle: '' }); setErr(null); setCycleOpen(true) }}>
              <Plus size={14} /> Nouveau cycle
            </Button>
          </div>
          <Card>
            {cycles.length === 0
              ? <div className="py-10 text-center text-slate-400 text-sm">Aucun cycle.</div>
              : cycles.map((c, i) => (
                <div key={c.id} className={cn('flex items-center gap-3 px-4 py-3.5 group', i < cycles.length - 1 && 'border-b border-slate-50')}>
                  <div className="flex-1"><span className="font-semibold text-slate-800">{c.libelle}</span><span className="ml-2 text-xs text-slate-400">{c.code}</span></div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditCycle(c); setCycleForm({ code: c.code, libelle: c.libelle }); setErr(null); setCycleOpen(true) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><Pencil size={13} /></button>
                    <button onClick={() => setDelTarget({ type: 'cycle', id: c.id, label: c.libelle })} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
          </Card>
        </div>
      )}
      {section === 'specialites' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditSpec(null); setSpecForm({ code: '', libelle: '', cycle: cycles[0] ? String(cycles[0].id) : '' }); setErr(null); setSpecOpen(true) }}>
              <Plus size={14} /> Nouvelle spécialité
            </Button>
          </div>
          <Card>
            {specs.length === 0
              ? <div className="py-10 text-center text-slate-400 text-sm">Aucune spécialité.</div>
              : specs.map((s, i) => (
                <div key={s.id} className={cn('flex items-center gap-3 px-4 py-3.5 group', i < specs.length - 1 && 'border-b border-slate-50')}>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 text-sm">{s.libelle}</div>
                    <div className="text-xs text-slate-400">{s.code}{s.cycle_libelle ? ` · ${s.cycle_libelle}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditSpec(s); setSpecForm({ code: s.code, libelle: s.libelle, cycle: s.cycle ? String(s.cycle) : '' }); setErr(null); setSpecOpen(true) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><Pencil size={13} /></button>
                    <button onClick={() => setDelTarget({ type: 'specialite', id: s.id, label: s.libelle })} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
          </Card>
        </div>
      )}

      <Dialog open={anneeOpen} onOpenChange={setAnneeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editAnnee ? "Modifier l'année" : 'Nouvelle année académique'}</DialogTitle></DialogHeader>
          {err && <ErrBox msg={err} />}
          <F label="Libellé (ex: 2024-2025)" req><Input value={anneeForm.libelle} onChange={e => setAnneeForm(f => ({ ...f, libelle: e.target.value }))} placeholder="2024-2025" /></F>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer mt-3">
            <input type="checkbox" className="rounded accent-emerald-500 w-4 h-4" checked={anneeForm.is_active} onChange={e => setAnneeForm(f => ({ ...f, is_active: e.target.checked }))} />
            Marquer comme année active
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setAnneeOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={saveAnnee} disabled={saving}>{saving ? '…' : 'Enregistrer'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={cycleOpen} onOpenChange={setCycleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editCycle ? 'Modifier' : 'Nouveau cycle'}</DialogTitle></DialogHeader>
          {err && <ErrBox msg={err} />}
          <div className="grid grid-cols-2 gap-3">
            <F label="Code" req><Input value={cycleForm.code} onChange={e => setCycleForm(f => ({ ...f, code: e.target.value }))} placeholder="LIC" /></F>
            <F label="Libellé" req><Input value={cycleForm.libelle} onChange={e => setCycleForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Licence" /></F>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setCycleOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={saveCycle} disabled={saving}>{saving ? '…' : 'Enregistrer'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={specOpen} onOpenChange={setSpecOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editSpec ? 'Modifier' : 'Nouvelle spécialité'}</DialogTitle></DialogHeader>
          {err && <ErrBox msg={err} />}
          <F label="Cycle">
            <SelectNative value={specForm.cycle} onChange={e => setSpecForm(f => ({ ...f, cycle: e.target.value }))}>
              <option value="">— sans cycle —</option>
              {cycles.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
            </SelectNative>
          </F>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <F label="Code" req><Input value={specForm.code} onChange={e => setSpecForm(f => ({ ...f, code: e.target.value }))} placeholder="INFO" /></F>
            <F label="Libellé" req><Input value={specForm.libelle} onChange={e => setSpecForm(f => ({ ...f, libelle: e.target.value }))} /></F>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setSpecOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={saveSpec} disabled={saving}>{saving ? '…' : 'Enregistrer'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!delTarget} msg={`Supprimer "${delTarget?.label}" ?`} onYes={doDelete} onNo={() => setDelTarget(null)} />
    </div>
  )
}

/* ══════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════ */
type Tab = 'dashboard' | 'universites' | 'etablissements' | 'comptes' | 'abonnements' | 'logs' | 'parametrage'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',      label: 'Tableau de bord', icon: BarChart2 },
  { id: 'universites',    label: 'Universités',      icon: Building2 },
  { id: 'etablissements', label: 'Établissements',   icon: GraduationCap },
  { id: 'comptes',        label: 'Comptes',          icon: Users },
  { id: 'abonnements',    label: 'Abonnements',      icon: ShieldCheck },
  { id: 'logs',           label: 'Logs',             icon: Activity },
  { id: 'parametrage',    label: 'Paramétrage',      icon: Settings },
]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-[1.375rem] font-bold text-slate-900 tracking-tight">Administration</h1>
        <p className="text-sm text-slate-400 mt-0.5">Digital Technology Congo — Console de gestion de la plateforme</p>
      </div>

      <div className="flex gap-0 overflow-x-auto border-b border-slate-200 scrollbar-hide">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors shrink-0',
                active ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              )}>
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="pt-1">
        {tab === 'dashboard'      && <TabDashboard />}
        {tab === 'universites'    && <TabUniversites />}
        {tab === 'etablissements' && <TabEtablissements />}
        {tab === 'comptes'        && <TabComptes />}
        {tab === 'abonnements'    && <TabAbonnements />}
        {tab === 'logs'           && <TabLogs />}
        {tab === 'parametrage'    && <TabParametrage />}
      </div>
    </div>
  )
}
