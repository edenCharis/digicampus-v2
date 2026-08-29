'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SelectNative } from '@/components/ui/select-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Etablissement, Annee, Cycle, Specialite, ApiList } from '../_shared'
import { ErrBox, ConfirmDialog, F } from '../_shared'

export default function ParametragePage() {
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
    { id: 'annees' as const,      label: 'Années académiques', count: annees.length },
    { id: 'cycles' as const,      label: 'Cycles',             count: cycles.length },
    { id: 'specialites' as const, label: 'Spécialités',        count: specs.length },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Paramétrage</h1>
          <p className="text-sm text-slate-400 mt-0.5">Années, cycles et spécialités par établissement</p>
        </div>
        <SelectNative className="h-8 text-xs w-auto max-w-56" value={etabSel} onChange={e => setEtabSel(e.target.value)}>
          {etabs.map(e => <option key={e.id} value={e.id}>{e.code} — {e.libelle}</option>)}
        </SelectNative>
      </div>

      <div className="flex gap-1.5 mb-5">
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={cn('flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all border', section === s.id ? 'bg-brand text-white border-brand shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300')}>
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
              ? <div className="py-12 text-center text-slate-400 text-sm">Aucune année académique.</div>
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
              ? <div className="py-12 text-center text-slate-400 text-sm">Aucun cycle.</div>
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
              ? <div className="py-12 text-center text-slate-400 text-sm">Aucune spécialité.</div>
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

      {/* Dialogs */}
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
