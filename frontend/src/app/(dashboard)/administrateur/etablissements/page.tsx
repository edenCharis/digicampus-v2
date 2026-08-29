'use client'
import { useEffect, useState, useCallback } from 'react'
import { GraduationCap, Plus } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SelectNative } from '@/components/ui/select-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { University, Etablissement, ApiList } from '../_shared'
import { ErrBox, ConfirmDialog, F, ListRow } from '../_shared'

export default function EtablissementsPage() {
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

  function openNew() {
    setEditing(null); setForm({ code: '', libelle: '', university: filterUniv, email: '', tel: '', ville: '' }); setErr(null); setOpen(true)
  }
  function openEdit(e: Etablissement) {
    setEditing(e); setForm({ code: e.code, libelle: e.libelle, university: String(e.university), email: e.email, tel: e.tel, ville: e.ville }); setErr(null); setOpen(true)
  }

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
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Établissements</h1>
          <p className="text-sm text-slate-400 mt-0.5">{list.length} établissement{list.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <SelectNative className="h-8 text-xs" value={filterUniv} onChange={e => setFilterUniv(e.target.value)}>
            <option value="">Toutes les universités</option>
            {univs.map(u => <option key={u.id} value={u.id}>{u.code} — {u.libelle}</option>)}
          </SelectNative>
          <Button size="sm" onClick={openNew}><Plus size={14} /> Ajouter</Button>
        </div>
      </div>

      <Card>
        {list.length === 0
          ? <div className="py-16 text-center text-slate-400 text-sm">Aucun établissement.</div>
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
