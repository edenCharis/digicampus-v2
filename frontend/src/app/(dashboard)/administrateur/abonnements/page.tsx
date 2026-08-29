'use client'
import { useEffect, useState, useCallback } from 'react'
import { Globe, Pencil, CheckCircle2, Ban, WifiOff, Clock } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectNative } from '@/components/ui/select-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { University, Abonnement, ApiList } from '../_shared'
import { ErrBox, F, ABONNEMENT_STATUTS, ALL_MODULES } from '../_shared'

export default function AbonnementsPage() {
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
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Abonnements</h1>
        <p className="text-sm text-slate-400 mt-0.5">Licences et modules activés par université</p>
      </div>

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
                        ? <div className="flex flex-wrap gap-1">
                            {ab.modules.slice(0, 3).map(m => <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">{m}</span>)}
                            {ab.modules.length > 3 && <span className="text-[10px] text-slate-400">+{ab.modules.length - 3}</span>}
                          </div>
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
