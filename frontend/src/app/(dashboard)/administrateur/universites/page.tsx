'use client'
import { useEffect, useState, useCallback } from 'react'
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { University, ApiList } from '../_shared'
import { ErrBox, ConfirmDialog, F, ListRow } from '../_shared'

export default function UniversitesPage() {
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

  function openNew() {
    setEditing(null); setForm({ code: '', libelle: '', email_contact: '', tel_contact: '', ville: '' }); setErr(null); setOpen(true)
  }
  function openEdit(u: University) {
    setEditing(u); setForm({ code: u.code, libelle: u.libelle, email_contact: u.email_contact, tel_contact: u.tel_contact, ville: u.ville }); setErr(null); setOpen(true)
  }

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
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Universités</h1>
          <p className="text-sm text-slate-400 mt-0.5">{list.length} institution{list.length > 1 ? 's' : ''} partenaire{list.length > 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus size={14} /> Nouvelle université</Button>
      </div>

      <Card>
        {list.length === 0
          ? <div className="py-16 text-center text-slate-400 text-sm">Aucune université enregistrée.</div>
          : list.map((u, i) => (
            <ListRow key={u.id} icon={Building2} iconColor="#1AAFE6" iconBg="rgba(26,175,230,0.08)"
              primary={u.libelle} secondary={[u.code, u.ville, u.email_contact].filter(Boolean).join(' · ')}
              onEdit={() => openEdit(u)} onDelete={() => setDel(u)} isLast={i === list.length - 1}
            />
          ))}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'université" : 'Nouvelle université'}</DialogTitle>
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
