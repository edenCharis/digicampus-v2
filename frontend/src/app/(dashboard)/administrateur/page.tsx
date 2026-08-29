'use client'
import { useEffect, useState, useCallback } from 'react'
import { Building2, GraduationCap, Users, Settings, Plus, Pencil, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SelectNative } from '@/components/ui/select-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/* ── Types ── */
interface University    { id: number; code: string; libelle: string; email_contact: string; tel_contact: string; ville: string }
interface Etablissement { id: number; code: string; libelle: string; university: number; university_name: string; email: string; tel: string; ville: string }
interface AppUser       { id: number; login: string; nom: string; email: string; role: string; university: number; etablissement: number | null; etablissement_name: string | null; is_active: boolean }
interface Annee         { id: number; libelle: string; is_active: boolean; etablissement: number }
interface Cycle         { id: number; code: string; libelle: string; etablissement: number }
interface Specialite    { id: number; code: string; libelle: string; cycle: number | null; cycle_libelle: string | null; etablissement: number }
interface ApiList<T>    { count: number; results: T[] }

const ROLES = ['scolarité','doyen','enseignant','professeur','cours','inscription','anonymat','daarhspe','gesnote','soutenance','suivi','caisse','pvd']
const ROLE_COLORS: Record<string, string> = {
  'scolarité':'#1AAFE6', doyen:'#8b5cf6', enseignant:'#f59e0b', professeur:'#10b981',
  cours:'#06b6d4', inscription:'#3b82f6', anonymat:'#6366f1', daarhspe:'#ec4899',
  gesnote:'#14b8a6', soutenance:'#f97316', suivi:'#84cc16', caisse:'#eab308', pvd:'#a78bfa',
}

/* ── Shared sub-components ── */
function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700 mb-4">
      <AlertTriangle size={15} className="shrink-0" /> {msg}
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
              <Trash2 size={18} className="text-red-500" />
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

function FormRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-3', className)}>{children}</div>
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════
   TAB SHARED: List row
══════════════════════════════════════════ */
function ListRow({ icon: Icon, iconColor, iconBg, primary, secondary, onEdit, onDelete, isLast }: {
  icon: React.ElementType; iconColor: string; iconBg: string
  primary: string; secondary?: string
  onEdit: () => void; onDelete: () => void; isLast: boolean
}) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3.5', !isLast && 'border-b border-slate-50')}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <Icon size={17} style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-800 text-sm truncate">{primary}</div>
        {secondary && <div className="text-xs text-slate-400 mt-0.5 truncate">{secondary}</div>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   TAB 1 — UNIVERSITÉS
══════════════════════════════════════════ */
function TabUniversites() {
  const [list, setList] = useState<University[]>([])
  const [open, setOpen]   = useState(false)
  const [editing, setEditing] = useState<University | null>(null)
  const [del, setDel]     = useState<University | null>(null)
  const [form, setForm]   = useState({ code: '', libelle: '', email_contact: '', tel_contact: '', ville: '' })
  const [err, setErr]     = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
        <p className="text-sm text-slate-500">{list.length} université{list.length > 1 ? 's' : ''} enregistrée{list.length > 1 ? 's' : ''}</p>
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
            <DialogTitle>{editing ? 'Modifier l\'université' : 'Nouvelle université'}</DialogTitle>
            <DialogDescription>Renseignez les informations de l'université.</DialogDescription>
          </DialogHeader>
          {err && <ErrBox msg={err} />}
          <div className="space-y-3">
            <FormRow>
              <Field label="Code" required><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="UDSN" /></Field>
              <Field label="Ville"><Input value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} placeholder="Brazzaville" /></Field>
            </FormRow>
            <Field label="Libellé" required><Input value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Université Denis Sassou N'Guesso" /></Field>
            <FormRow>
              <Field label="Email"><Input type="email" value={form.email_contact} onChange={e => setForm(f => ({ ...f, email_contact: e.target.value }))} /></Field>
              <Field label="Téléphone"><Input value={form.tel_contact} onChange={e => setForm(f => ({ ...f, tel_contact: e.target.value }))} /></Field>
            </FormRow>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!del} msg={`Supprimer l'université "${del?.libelle}" ?`} onYes={doDelete} onNo={() => setDel(null)} />
    </div>
  )
}

/* ══════════════════════════════════════════
   TAB 2 — ÉTABLISSEMENTS
══════════════════════════════════════════ */
function TabEtablissements() {
  const [univs, setUnivs]     = useState<University[]>([])
  const [list, setList]       = useState<Etablissement[]>([])
  const [filterUniv, setFilterUniv] = useState('')
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Etablissement | null>(null)
  const [del, setDel]         = useState<Etablissement | null>(null)
  const [form, setForm]       = useState({ code: '', libelle: '', university: '', email: '', tel: '', ville: '' })
  const [err, setErr]         = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

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
          <SelectNative className="w-auto text-xs" value={filterUniv} onChange={e => setFilterUniv(e.target.value)}>
            <option value="">Toutes les universités</option>
            {univs.map(u => <option key={u.id} value={u.id}>{u.code}</option>)}
          </SelectNative>
        </div>
        <Button size="sm" onClick={openNew}><Plus size={14} /> Nouvel établissement</Button>
      </div>

      <Card>
        {list.length === 0
          ? <div className="py-12 text-center text-slate-400 text-sm">Aucun établissement trouvé.</div>
          : list.map((e, i) => (
            <ListRow key={e.id} icon={GraduationCap} iconColor="#8b5cf6" iconBg="rgba(139,92,246,0.08)"
              primary={e.libelle} secondary={`${e.code} · ${e.university_name} · ${e.ville}`}
              onEdit={() => openEdit(e)} onDelete={() => setDel(e)} isLast={i === list.length - 1}
            />
          ))}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier l\'établissement' : 'Nouvel établissement'}</DialogTitle>
            <DialogDescription>Renseignez les informations de la faculté ou école.</DialogDescription>
          </DialogHeader>
          {err && <ErrBox msg={err} />}
          <div className="space-y-3">
            <Field label="Université" required>
              <SelectNative value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))}>
                <option value="">— sélectionner —</option>
                {univs.map(u => <option key={u.id} value={u.id}>{u.libelle}</option>)}
              </SelectNative>
            </Field>
            <FormRow>
              <Field label="Code" required><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="FIT" /></Field>
              <Field label="Ville"><Input value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} /></Field>
            </FormRow>
            <Field label="Libellé" required><Input value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Faculté des Sciences…" /></Field>
            <FormRow>
              <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
              <Field label="Téléphone"><Input value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} /></Field>
            </FormRow>
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
   TAB 3 — COMPTES
══════════════════════════════════════════ */
function TabComptes() {
  const [etabs, setEtabs]     = useState<Etablissement[]>([])
  const [list, setList]       = useState<AppUser[]>([])
  const [filterRole, setFilterRole] = useState('')
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<AppUser | null>(null)
  const [del, setDel]         = useState<AppUser | null>(null)
  const [form, setForm]       = useState({ login: '', nom: '', email: '', role: ROLES[0], password: '', etablissement: '', is_active: true })
  const [err, setErr]         = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

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
    const raw = localStorage.getItem('dc_user')
    const me = raw ? JSON.parse(raw) : {}
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
      const raw = localStorage.getItem('dc_user')
      const me = raw ? JSON.parse(raw) : {}
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
          <SelectNative className="w-auto text-xs" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
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
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: `${color}18`, color }}>
                  {role}
                </span>
                <span className="text-xs text-slate-400">{users.length}</span>
              </div>
              <Card>
                {users.map((u, i) => (
                  <div key={u.id} className={cn('flex items-center gap-3 px-4 py-3', i < users.length - 1 && 'border-b border-slate-50')}>
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
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => setDel(u)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )
        })}
        {list.length === 0 && <Card><div className="py-12 text-center text-slate-400 text-sm">Aucun compte trouvé.</div></Card>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le compte' : 'Nouveau compte'}</DialogTitle>
            <DialogDescription>Renseignez les informations du compte utilisateur.</DialogDescription>
          </DialogHeader>
          {err && <ErrBox msg={err} />}
          <div className="space-y-3">
            <FormRow>
              <Field label="Login" required><Input value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} placeholder="scolarite" /></Field>
              <Field label={editing ? 'Nouveau mot de passe' : 'Mot de passe *'}>
                <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
              </Field>
            </FormRow>
            <Field label="Nom complet" required><Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Agent Scolarité" /></Field>
            <FormRow>
              <Field label="Rôle" required>
                <SelectNative value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </SelectNative>
              </Field>
              <Field label="Établissement">
                <SelectNative value={form.etablissement} onChange={e => setForm(f => ({ ...f, etablissement: e.target.value }))}>
                  <option value="">— aucun —</option>
                  {etabs.map(e => <option key={e.id} value={e.id}>{e.code} — {e.libelle}</option>)}
                </SelectNative>
              </Field>
            </FormRow>
            <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
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

      <ConfirmDialog open={!!del} msg={`Supprimer le compte "${del?.nom}" (${del?.login}) ?`} onYes={doDelete} onNo={() => setDel(null)} />
    </div>
  )
}

/* ══════════════════════════════════════════
   TAB 4 — PARAMÉTRAGE
══════════════════════════════════════════ */
function TabParametrage() {
  const [etabs, setEtabs]     = useState<Etablissement[]>([])
  const [etabSel, setEtabSel] = useState('')
  const [annees, setAnnees]   = useState<Annee[]>([])
  const [cycles, setCycles]   = useState<Cycle[]>([])
  const [specs, setSpecs]     = useState<Specialite[]>([])
  const [section, setSection] = useState<'annees'|'cycles'|'specialites'>('annees')

  const [anneeOpen, setAnneeOpen]   = useState(false)
  const [cycleOpen, setCycleOpen]   = useState(false)
  const [specOpen,  setSpecOpen]    = useState(false)
  const [editAnnee, setEditAnnee]   = useState<Annee | null>(null)
  const [editCycle, setEditCycle]   = useState<Cycle | null>(null)
  const [editSpec,  setEditSpec]    = useState<Specialite | null>(null)
  const [delTarget, setDelTarget]   = useState<{ type: string; id: number; label: string } | null>(null)

  const [anneeForm, setAnneeForm] = useState({ libelle: '', is_active: false })
  const [cycleForm, setCycleForm] = useState({ code: '', libelle: '' })
  const [specForm,  setSpecForm]  = useState({ code: '', libelle: '', cycle: '' })
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
    { id: 'annees' as const, label: 'Années académiques', count: annees.length },
    { id: 'cycles' as const, label: 'Cycles', count: cycles.length },
    { id: 'specialites' as const, label: 'Spécialités', count: specs.length },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sm font-medium text-slate-700">Établissement :</p>
        <SelectNative className="w-auto" value={etabSel} onChange={e => setEtabSel(e.target.value)}>
          {etabs.map(e => <option key={e.id} value={e.id}>{e.code} — {e.libelle}</option>)}
        </SelectNative>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2">
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={cn('flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border', section === s.id ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}
          >
            {s.label}
            <span className={cn('text-xs rounded-full px-1.5 py-0.5 font-semibold', section === s.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500')}>{s.count}</span>
          </button>
        ))}
      </div>

      {/* ── Années ── */}
      {section === 'annees' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditAnnee(null); setAnneeForm({ libelle: '', is_active: false }); setErr(null); setAnneeOpen(true) }}>
              <Plus size={14} /> Nouvelle année
            </Button>
          </div>
          <Card>
            {annees.length === 0 ? <div className="py-10 text-center text-slate-400 text-sm">Aucune année académique.</div>
              : annees.map((a, i) => (
                <div key={a.id} className={cn('flex items-center gap-3 px-4 py-3.5', i < annees.length - 1 && 'border-b border-slate-50')}>
                  <div className="flex-1 flex items-center gap-3">
                    <span className="font-bold text-slate-800">{a.libelle}</span>
                    {a.is_active && (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 size={10} /> Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditAnnee(a); setAnneeForm({ libelle: a.libelle, is_active: a.is_active }); setErr(null); setAnneeOpen(true) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDelTarget({ type: 'annee', id: a.id, label: a.libelle })} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
          </Card>
        </div>
      )}

      {/* ── Cycles ── */}
      {section === 'cycles' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditCycle(null); setCycleForm({ code: '', libelle: '' }); setErr(null); setCycleOpen(true) }}>
              <Plus size={14} /> Nouveau cycle
            </Button>
          </div>
          <Card>
            {cycles.length === 0 ? <div className="py-10 text-center text-slate-400 text-sm">Aucun cycle.</div>
              : cycles.map((c, i) => (
                <div key={c.id} className={cn('flex items-center gap-3 px-4 py-3.5', i < cycles.length - 1 && 'border-b border-slate-50')}>
                  <div className="flex-1">
                    <span className="font-semibold text-slate-800">{c.libelle}</span>
                    <span className="ml-2 text-xs text-slate-400">{c.code}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditCycle(c); setCycleForm({ code: c.code, libelle: c.libelle }); setErr(null); setCycleOpen(true) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDelTarget({ type: 'cycle', id: c.id, label: c.libelle })} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
          </Card>
        </div>
      )}

      {/* ── Spécialités ── */}
      {section === 'specialites' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setEditSpec(null); setSpecForm({ code: '', libelle: '', cycle: cycles[0] ? String(cycles[0].id) : '' }); setErr(null); setSpecOpen(true) }}>
              <Plus size={14} /> Nouvelle spécialité
            </Button>
          </div>
          <Card>
            {specs.length === 0 ? <div className="py-10 text-center text-slate-400 text-sm">Aucune spécialité.</div>
              : specs.map((s, i) => (
                <div key={s.id} className={cn('flex items-center gap-3 px-4 py-3.5', i < specs.length - 1 && 'border-b border-slate-50')}>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">{s.libelle}</div>
                    <div className="text-xs text-slate-400">{s.code}{s.cycle_libelle ? ` · ${s.cycle_libelle}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditSpec(s); setSpecForm({ code: s.code, libelle: s.libelle, cycle: s.cycle ? String(s.cycle) : '' }); setErr(null); setSpecOpen(true) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDelTarget({ type: 'specialite', id: s.id, label: s.libelle })} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
          </Card>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={anneeOpen} onOpenChange={setAnneeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editAnnee ? 'Modifier l\'année' : 'Nouvelle année académique'}</DialogTitle></DialogHeader>
          {err && <ErrBox msg={err} />}
          <Field label="Libellé (ex: 2024-2025)" required><Input value={anneeForm.libelle} onChange={e => setAnneeForm(f => ({ ...f, libelle: e.target.value }))} placeholder="2024-2025" /></Field>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer mt-2">
            <input type="checkbox" className="rounded accent-emerald-500 w-4 h-4" checked={anneeForm.is_active} onChange={e => setAnneeForm(f => ({ ...f, is_active: e.target.checked }))} />
            Marquer comme année active
          </label>
          <div className="flex justify-end gap-2 mt-4"><Button variant="outline" size="sm" onClick={() => setAnneeOpen(false)}>Annuler</Button><Button size="sm" onClick={saveAnnee} disabled={saving}>{saving ? '…' : 'Enregistrer'}</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={cycleOpen} onOpenChange={setCycleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editCycle ? 'Modifier le cycle' : 'Nouveau cycle'}</DialogTitle></DialogHeader>
          {err && <ErrBox msg={err} />}
          <FormRow><Field label="Code" required><Input value={cycleForm.code} onChange={e => setCycleForm(f => ({ ...f, code: e.target.value }))} placeholder="LIC" /></Field><Field label="Libellé" required><Input value={cycleForm.libelle} onChange={e => setCycleForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Licence" /></Field></FormRow>
          <div className="flex justify-end gap-2 mt-4"><Button variant="outline" size="sm" onClick={() => setCycleOpen(false)}>Annuler</Button><Button size="sm" onClick={saveCycle} disabled={saving}>{saving ? '…' : 'Enregistrer'}</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={specOpen} onOpenChange={setSpecOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editSpec ? 'Modifier la spécialité' : 'Nouvelle spécialité'}</DialogTitle></DialogHeader>
          {err && <ErrBox msg={err} />}
          <Field label="Cycle"><SelectNative value={specForm.cycle} onChange={e => setSpecForm(f => ({ ...f, cycle: e.target.value }))}><option value="">— sans cycle —</option>{cycles.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}</SelectNative></Field>
          <FormRow className="mt-3"><Field label="Code" required><Input value={specForm.code} onChange={e => setSpecForm(f => ({ ...f, code: e.target.value }))} placeholder="INFO" /></Field><Field label="Libellé" required><Input value={specForm.libelle} onChange={e => setSpecForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Informatique" /></Field></FormRow>
          <div className="flex justify-end gap-2 mt-4"><Button variant="outline" size="sm" onClick={() => setSpecOpen(false)}>Annuler</Button><Button size="sm" onClick={saveSpec} disabled={saving}>{saving ? '…' : 'Enregistrer'}</Button></div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!delTarget} msg={`Supprimer "${delTarget?.label}" ?`} onYes={doDelete} onNo={() => setDelTarget(null)} />
    </div>
  )
}

/* ══════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════ */
type Tab = 'universites' | 'etablissements' | 'comptes' | 'parametrage'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'universites',    label: 'Universités',    icon: Building2 },
  { id: 'etablissements', label: 'Établissements', icon: GraduationCap },
  { id: 'comptes',        label: 'Comptes',        icon: Users },
  { id: 'parametrage',    label: 'Paramétrage',    icon: Settings },
]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('universites')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Administration</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configuration du système — universités, établissements, comptes et paramétrage académique
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                tab === t.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'universites'    && <TabUniversites />}
      {tab === 'etablissements' && <TabEtablissements />}
      {tab === 'comptes'        && <TabComptes />}
      {tab === 'parametrage'    && <TabParametrage />}
    </div>
  )
}
