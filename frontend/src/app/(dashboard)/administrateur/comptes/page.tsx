'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SelectNative } from '@/components/ui/select-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Etablissement, AppUser, ApiList } from '../_shared'
import { ErrBox, ConfirmDialog, F, ROLES, ROLE_COLORS } from '../_shared'

export default function ComptesPage() {
  const [etabs, setEtabs]       = useState<Etablissement[]>([])
  const [list, setList]         = useState<AppUser[]>([])
  const [filterRole, setFilterRole] = useState('')
  const [search, setSearch]     = useState('')
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
      const er = e as Record<string, unknown>
      setErr(er?.login ? `Login : ${er.login}` : JSON.stringify(e))
    } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!del) return
    await apiFetch(`/users/${del.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  const filtered = list.filter(u => !search || u.nom.toLowerCase().includes(search.toLowerCase()) || u.login.toLowerCase().includes(search.toLowerCase()))
  const grouped = ROLES.reduce<Record<string, AppUser[]>>((acc, r) => {
    const users = filtered.filter(u => u.role === r)
    if (users.length) acc[r] = users
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Comptes utilisateurs</h1>
          <p className="text-sm text-slate-400 mt-0.5">{list.length} compte{list.length > 1 ? 's' : ''} au total</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus size={14} /> Nouveau compte</Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Input className="h-8 text-xs flex-1" placeholder="Rechercher nom ou login…" value={search} onChange={e => setSearch(e.target.value)} />
        <SelectNative className="h-8 text-xs w-auto" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">Tous les rôles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </SelectNative>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([role, users]) => {
          const color = ROLE_COLORS[role] ?? '#64748b'
          return (
            <div key={role}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize" style={{ background: `${color}18`, color }}>{role}</span>
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
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil size={13} /></button>
                      <button onClick={() => setDel(u)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )
        })}
        {filtered.length === 0 && <Card><div className="py-12 text-center text-slate-400 text-sm">Aucun compte trouvé.</div></Card>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Modifier le compte' : 'Nouveau compte'}</DialogTitle></DialogHeader>
          {err && <ErrBox msg={err} />}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <F label="Login" req><Input value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} /></F>
              <F label={editing ? 'Nouveau mot de passe' : 'Mot de passe *'}>
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
                  {etabs.map(e => <option key={e.id} value={e.id}>{e.code} — {e.libelle}</option>)}
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
