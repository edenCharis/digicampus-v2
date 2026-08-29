'use client'
import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectNative } from '@/components/ui/select-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface Specialite { id: number; libelle: string; code: string }
interface Classe {
  id: number; libelle: string; niveau: string; effectif: number
  specialite: number; specialite_libelle: string; etablissement: number
}
interface ApiList<T> { count: number; next: string | null; previous: string | null; results: T[] }

const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3']
const PAGE_SIZE = 20

const NIVEAU_COLOR: Record<string, { bg: string; color: string }> = {
  L1: { bg: 'rgba(26,175,230,0.12)',  color: '#1AAFE6' },
  L2: { bg: 'rgba(14,165,233,0.12)',  color: '#0ea5e9' },
  L3: { bg: 'rgba(6,182,212,0.12)',   color: '#06b6d4' },
  M1: { bg: 'rgba(139,92,246,0.12)',  color: '#8b5cf6' },
  M2: { bg: 'rgba(124,58,237,0.12)',  color: '#7c3aed' },
  D1: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  D2: { bg: 'rgba(217,119,6,0.12)',   color: '#d97706' },
  D3: { bg: 'rgba(180,83,9,0.12)',    color: '#b45309' },
}

function NiveauBadge({ niveau }: { niveau: string }) {
  const c = NIVEAU_COLOR[niveau] ?? { bg: 'rgba(100,116,139,0.12)', color: '#64748b' }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: c.bg, color: c.color }}>
      {niveau}
    </span>
  )
}

export default function ClassesPage() {
  const [data, setData]             = useState<ApiList<Classe> | null>(null)
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [search, setSearch]         = useState('')
  const [filterNiveau, setFilterNiveau] = useState('')
  const [filterSpec, setFilterSpec] = useState('')
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [open, setOpen]             = useState(false)
  const [editTarget, setEditTarget] = useState<Classe | null>(null)
  const [form, setForm]             = useState({ libelle: '', niveau: 'L1', specialite: '', effectif: '' })
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    apiFetch<ApiList<Specialite>>('/specialites/?limit=200').then(r => setSpecialites(r.results)).catch(console.error)
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (search)       p.set('search', search)
    if (filterNiveau) p.set('niveau', filterNiveau)
    if (filterSpec)   p.set('specialite', filterSpec)
    p.set('limit', String(PAGE_SIZE))
    p.set('offset', String((page - 1) * PAGE_SIZE))
    apiFetch<ApiList<Classe>>(`/classes/?${p}`).then(setData).catch(console.error).finally(() => setLoading(false))
  }, [search, filterNiveau, filterSpec, page])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditTarget(null)
    setForm({ libelle: '', niveau: 'L1', specialite: specialites[0]?.id.toString() ?? '', effectif: '' })
    setError(null); setOpen(true)
  }

  function openEdit(c: Classe) {
    setEditTarget(c)
    setForm({ libelle: c.libelle, niveau: c.niveau, specialite: c.specialite.toString(), effectif: c.effectif.toString() })
    setError(null); setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      const user = JSON.parse(localStorage.getItem('dc_user') ?? '{}')
      const body = { libelle: form.libelle, niveau: form.niveau, specialite: Number(form.specialite), effectif: Number(form.effectif) || 0, etablissement: user.etablissement }
      if (editTarget) await apiFetch(`/classes/${editTarget.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      else await apiFetch('/classes/', { method: 'POST', body: JSON.stringify(body) })
      setOpen(false); load()
    } catch (err: unknown) {
      const e = err as Record<string, string[]>
      setError(Object.values(e).flat().join(' ') || 'Erreur lors de l\'enregistrement')
    } finally { setSaving(false) }
  }

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Classes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Groupes pédagogiques par niveau et spécialité</p>
        </div>
        <Button onClick={openAdd}><Plus size={15} /> Ajouter une classe</Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-[340px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input className="pl-8" placeholder="Rechercher une classe…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <SelectNative className="w-auto" value={filterNiveau} onChange={e => { setFilterNiveau(e.target.value); setPage(1) }}>
          <option value="">Tous les niveaux</option>
          {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
        </SelectNative>
        <SelectNative className="w-auto" value={filterSpec} onChange={e => { setFilterSpec(e.target.value); setPage(1) }}>
          <option value="">Toutes les spécialités</option>
          {specialites.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
        </SelectNative>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Classe</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Spécialité</TableHead>
              <TableHead>Effectif</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-10">Chargement…</TableCell></TableRow>
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-14 text-center">
                  <LayoutGrid size={36} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-slate-400 text-sm">Aucune classe trouvée</p>
                </TableCell>
              </TableRow>
            ) : data?.results.map(c => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => openEdit(c)}>
                <TableCell className="font-semibold text-slate-900">{c.libelle}</TableCell>
                <TableCell><NiveauBadge niveau={c.niveau} /></TableCell>
                <TableCell className="text-slate-500">{c.specialite_libelle}</TableCell>
                <TableCell>
                  {c.effectif > 0
                    ? <span className="font-semibold text-slate-800">{c.effectif} <span className="text-slate-400 font-normal text-xs">étudiants</span></span>
                    : <span className="text-slate-300">—</span>}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-xs font-medium text-brand">Modifier →</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {data && data.count > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">{data.count} classe{data.count > 1 ? 's' : ''} · Page {page}/{totalPages}</span>
            <div className="flex gap-1">
              <button className={cn('p-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors', page <= 1 && 'opacity-40 pointer-events-none')}
                onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
              <button className={cn('p-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors', page >= totalPages && 'opacity-40 pointer-events-none')}
                onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Modifier la classe' : 'Nouvelle classe'}</DialogTitle>
            <DialogDescription>Renseignez les informations de la classe.</DialogDescription>
          </DialogHeader>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-2">
              {error}
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Libellé <span className="text-red-400">*</span></label>
              <Input value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} required placeholder="ex: Licence 1 Informatique" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Niveau <span className="text-red-400">*</span></label>
                <SelectNative value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })}>
                  {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                </SelectNative>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Effectif</label>
                <Input type="number" min="0" value={form.effectif} onChange={e => setForm({ ...form, effectif: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Spécialité <span className="text-red-400">*</span></label>
              <SelectNative value={form.specialite} onChange={e => setForm({ ...form, specialite: e.target.value })} required>
                <option value="">— Sélectionner —</option>
                {specialites.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
              </SelectNative>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" size="sm" disabled={saving}>{saving ? 'Enregistrement…' : editTarget ? 'Mettre à jour' : 'Enregistrer'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
