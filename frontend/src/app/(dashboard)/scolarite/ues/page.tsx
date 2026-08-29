'use client'
import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, BookOpen, Trash2, PlusCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectNative } from '@/components/ui/select-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface Specialite { id: number; libelle: string; code: string }
interface ECUE { id?: number; code: string; libelle: string; credits: number; coefficient: number; ue?: number }
interface UE {
  id: number; code: string; libelle: string; semestre: string; niveau: string
  credits: number; specialite: number; specialite_libelle: string; etablissement: number; ecues: ECUE[]
}
interface ApiList<T> { count: number; next: string | null; previous: string | null; results: T[] }

const NIVEAUX  = ['L1','L2','L3','M1','M2','D1','D2','D3']
const SEMESTRES = ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10']
const PAGE_SIZE = 25

const SEM_COLOR: Record<string, { bg: string; text: string }> = {
  S1:  { bg: 'rgba(26,175,230,0.12)',  text: '#1AAFE6' },
  S2:  { bg: 'rgba(14,165,233,0.12)',  text: '#0ea5e9' },
  S3:  { bg: 'rgba(139,92,246,0.12)',  text: '#8b5cf6' },
  S4:  { bg: 'rgba(124,58,237,0.12)',  text: '#7c3aed' },
  S5:  { bg: 'rgba(34,197,94,0.12)',   text: '#22c55e' },
  S6:  { bg: 'rgba(16,185,129,0.12)',  text: '#10b981' },
  S7:  { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b' },
  S8:  { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444' },
  S9:  { bg: 'rgba(249,115,22,0.12)',  text: '#f97316' },
  S10: { bg: 'rgba(168,85,247,0.12)',  text: '#a855f7' },
}

function emptyEcue(): ECUE { return { code: '', libelle: '', credits: 0, coefficient: 1 } }

export default function UEsPage() {
  const [data, setData]             = useState<ApiList<UE> | null>(null)
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [search, setSearch]         = useState('')
  const [filterNiveau, setFilterNiveau] = useState('')
  const [filterSem, setFilterSem]   = useState('')
  const [filterSpec, setFilterSpec] = useState('')
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [open, setOpen]             = useState(false)
  const [editTarget, setEditTarget] = useState<UE | null>(null)
  const [form, setForm]             = useState({ code: '', libelle: '', niveau: 'L1', semestre: 'S1', credits: '', specialite: '' })
  const [ecues, setEcues]           = useState<ECUE[]>([emptyEcue()])
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
    if (filterSem)    p.set('semestre', filterSem)
    if (filterSpec)   p.set('specialite', filterSpec)
    p.set('limit', String(PAGE_SIZE))
    p.set('offset', String((page - 1) * PAGE_SIZE))
    apiFetch<ApiList<UE>>(`/ues/?${p}`).then(setData).catch(console.error).finally(() => setLoading(false))
  }, [search, filterNiveau, filterSem, filterSpec, page])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditTarget(null)
    setForm({ code: '', libelle: '', niveau: 'L1', semestre: 'S1', credits: '', specialite: specialites[0]?.id.toString() ?? '' })
    setEcues([emptyEcue()]); setError(null); setOpen(true)
  }

  function openEdit(ue: UE) {
    setEditTarget(ue)
    setForm({ code: ue.code, libelle: ue.libelle, niveau: ue.niveau, semestre: ue.semestre, credits: ue.credits.toString(), specialite: ue.specialite.toString() })
    setEcues(ue.ecues.length > 0 ? ue.ecues.map(e => ({ ...e })) : [emptyEcue()])
    setError(null); setOpen(true)
  }

  function updateEcue(idx: number, field: keyof ECUE, val: string) {
    setEcues(prev => prev.map((e, i) => i === idx ? { ...e, [field]: field === 'credits' || field === 'coefficient' ? Number(val) : val } : e))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      const user = JSON.parse(localStorage.getItem('dc_user') ?? '{}')
      const ueBody = { code: form.code, libelle: form.libelle, niveau: form.niveau, semestre: form.semestre, credits: Number(form.credits) || 0, specialite: Number(form.specialite), etablissement: user.etablissement }
      let ueId: number
      if (editTarget) {
        const updated = await apiFetch<UE>(`/ues/${editTarget.id}/`, { method: 'PATCH', body: JSON.stringify(ueBody) })
        ueId = updated.id
      } else {
        const created = await apiFetch<UE>('/ues/', { method: 'POST', body: JSON.stringify(ueBody) })
        ueId = created.id
      }
      const validEcues = ecues.filter(ec => ec.code.trim() && ec.libelle.trim())
      for (const ec of validEcues) {
        const ecueBody = { code: ec.code, libelle: ec.libelle, credits: ec.credits, coefficient: ec.coefficient, ue: ueId }
        if (ec.id) await apiFetch(`/ecues/${ec.id}/`, { method: 'PATCH', body: JSON.stringify(ecueBody) })
        else await apiFetch('/ecues/', { method: 'POST', body: JSON.stringify(ecueBody) })
      }
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Unités d&apos;Enseignement</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configuration des UE et éléments constitutifs (ECUE)</p>
        </div>
        <Button onClick={openAdd}><Plus size={15} /> Ajouter une UE</Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-[340px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input className="pl-8" placeholder="Code ou libellé…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <SelectNative className="w-auto" value={filterNiveau} onChange={e => { setFilterNiveau(e.target.value); setPage(1) }}>
          <option value="">Tous niveaux</option>
          {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
        </SelectNative>
        <SelectNative className="w-auto" value={filterSem} onChange={e => { setFilterSem(e.target.value); setPage(1) }}>
          <option value="">Tous semestres</option>
          {SEMESTRES.map(s => <option key={s} value={s}>{s}</option>)}
        </SelectNative>
        <SelectNative className="w-auto" value={filterSpec} onChange={e => { setFilterSpec(e.target.value); setPage(1) }}>
          <option value="">Toutes spécialités</option>
          {specialites.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
        </SelectNative>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Libellé UE</TableHead>
              <TableHead>Sem.</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Crédits</TableHead>
              <TableHead>ECUEs</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-10">Chargement…</TableCell></TableRow>
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center">
                  <BookOpen size={36} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-slate-400 text-sm">Aucune UE trouvée</p>
                </TableCell>
              </TableRow>
            ) : data?.results.map(ue => {
              const sc = SEM_COLOR[ue.semestre] ?? { bg: 'rgba(100,116,139,0.12)', text: '#64748b' }
              return (
                <TableRow key={ue.id} className="cursor-pointer" onClick={() => openEdit(ue)}>
                  <TableCell className="font-mono font-bold text-brand text-[13px]">{ue.code}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{ue.libelle}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{ue.specialite_libelle}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: sc.bg, color: sc.text }}>{ue.semestre}</span>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs font-semibold">{ue.niveau}</TableCell>
                  <TableCell className="font-semibold">{ue.credits}</TableCell>
                  <TableCell>
                    {ue.ecues.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ue.ecues.map(ec => (
                          <span key={ec.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand/10 text-brand">{ec.code}</span>
                        ))}
                      </div>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs font-medium text-brand">Modifier →</span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {data && data.count > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">{data.count} UE{data.count > 1 ? 's' : ''} · Page {page}/{totalPages}</span>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Modifier l\'UE' : 'Nouvelle UE'}</DialogTitle>
            <DialogDescription>Renseignez les informations de l'unité d'enseignement et ses éléments constitutifs.</DialogDescription>
          </DialogHeader>
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-2">{error}</div>
          )}
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Code UE <span className="text-red-400">*</span></label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required placeholder="UE-INFO-101" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Crédits</label>
                <Input type="number" min="0" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} placeholder="3" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Libellé <span className="text-red-400">*</span></label>
              <Input value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} required placeholder="Algorithmique et Structures de Données" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Niveau <span className="text-red-400">*</span></label>
                <SelectNative value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })}>
                  {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                </SelectNative>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Semestre <span className="text-red-400">*</span></label>
                <SelectNative value={form.semestre} onChange={e => setForm({ ...form, semestre: e.target.value })}>
                  {SEMESTRES.map(s => <option key={s} value={s}>{s}</option>)}
                </SelectNative>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Spécialité <span className="text-red-400">*</span></label>
                <SelectNative value={form.specialite} onChange={e => setForm({ ...form, specialite: e.target.value })} required>
                  <option value="">— Choisir —</option>
                  {specialites.map(s => <option key={s.id} value={s.id}>{s.code} — {s.libelle}</option>)}
                </SelectNative>
              </div>
            </div>

            {/* ECUEs */}
            <div>
              <div className="flex items-center justify-between mb-2 mt-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ECUEs (éléments constitutifs)</span>
                <button type="button" onClick={() => setEcues(p => [...p, emptyEcue()])}
                  className="flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-dark transition-colors">
                  <PlusCircle size={13} /> Ajouter ECUE
                </button>
              </div>
              <div className="grid grid-cols-[1fr_2fr_56px_56px_32px] gap-1.5 mb-1 px-0.5">
                {['Code', 'Libellé', 'Cred.', 'Coef.', ''].map(h => (
                  <span key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{h}</span>
                ))}
              </div>
              <div className="space-y-1.5">
                {ecues.map((ec, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_2fr_56px_56px_32px] gap-1.5 items-center">
                    <Input className="text-xs h-8 px-2" placeholder="CODE" value={ec.code} onChange={e => updateEcue(idx, 'code', e.target.value)} />
                    <Input className="text-xs h-8 px-2" placeholder="Libellé ECUE" value={ec.libelle} onChange={e => updateEcue(idx, 'libelle', e.target.value)} />
                    <Input className="text-xs h-8 px-2 text-center" type="number" min="0" placeholder="0" value={ec.credits} onChange={e => updateEcue(idx, 'credits', e.target.value)} />
                    <Input className="text-xs h-8 px-2 text-center" type="number" min="0" step="0.5" placeholder="1" value={ec.coefficient} onChange={e => updateEcue(idx, 'coefficient', e.target.value)} />
                    <button type="button" onClick={() => setEcues(p => p.filter((_, i) => i !== idx))}
                      className="flex items-center justify-center w-7 h-7 rounded text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
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
