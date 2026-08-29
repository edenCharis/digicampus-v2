'use client'
import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, UserPlus, RefreshCw, CheckCircle, XCircle, CheckCircle2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectNative } from '@/components/ui/select-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'

/* ── Types ── */
interface Specialite { id: number; libelle: string; code: string }
interface Classe { id: number; libelle: string; niveau: string; specialite: number; specialite_libelle: string; etablissement: number }
interface Annee { id: number; libelle: string; is_active: boolean; etablissement: number }
interface Inscription {
  id: number; etudiant: number; etudiant_nom: string; etudiant_code: string; etudiant_sexe: string
  classe: number; classe_libelle: string; classe_niveau: string
  annee: number; annee_libelle: string; etablissement: number
  type_inscription: 'nouveau' | 'reinscrit' | 'transfert'
  statut_paiement: boolean; montant_paye: string; date_inscription: string; est_valide: boolean
}
interface Etudiant {
  id: number; code: string; nom: string; prenom: string; sexe: string; email: string; tel: string
  statut: string; specialite_libelle: string | null; date_candidature?: string
}
interface ApiList<T> { count: number; next: string | null; previous: string | null; results: T[] }

const PAGE_SIZE = 20
const NIVEAUX = ['L1','L2','L3','M1','M2','D1','D2','D3']
const TYPES = [{ value: 'nouveau', label: 'Nouveau' }, { value: 'reinscrit', label: 'Réinscrit' }, { value: 'transfert', label: 'Transfert' }]
const SERIES_BAC = ['A','C','D','E','F6','H','R1','R5','R6']
const MENTIONS = ['Passable','Assez-bien','Bien','Très-bien']

/* ── Inline micro-components ── */
function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    nouveau:   { bg: 'rgba(26,175,230,0.12)',  color: '#1AAFE6',  label: 'Nouveau' },
    reinscrit: { bg: 'rgba(16,185,129,0.12)',  color: '#10b981',  label: 'Réinscrit' },
    transfert: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b',  label: 'Transfert' },
  }
  const s = map[type] ?? { bg: '#f1f5f9', color: '#64748b', label: type }
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    inscrit:    { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', label: 'Inscrit' },
    'en cours': { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', label: 'En cours' },
    admis:      { bg: 'rgba(26,175,230,0.12)',  color: '#1AAFE6', label: 'Admis' },
    'refusé':   { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', label: 'Refusé' },
  }
  const s = map[statut] ?? { bg: '#f1f5f9', color: '#64748b', label: statut }
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
}

function Pg({ page, total, onPrev, onNext, label }: { page: number; total: number; onPrev: () => void; onNext: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex gap-1">
        <button className={cn('p-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors', page <= 1 && 'opacity-40 pointer-events-none')} onClick={onPrev}><ChevronLeft size={14} /></button>
        <button className={cn('p-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors', page >= total && 'opacity-40 pointer-events-none')} onClick={onNext}><ChevronRight size={14} /></button>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3 pb-1.5 border-b border-slate-100">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{children}</span>
    </div>
  )
}

function F({ label, req, children, className }: { label: string; req?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}{req && <span className="text-red-400 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: Nouvelle inscription
══════════════════════════════════════════ */
interface NewInscModalProps {
  open: boolean; classes: Classe[]; annees: Annee[]; specialites: Specialite[]
  etablissementId: number | null; onClose: () => void; onSuccess: () => void
}

function NewInscModal({ open, classes, annees, specialites, etablissementId, onClose, onSuccess }: NewInscModalProps) {
  const anneeActive = annees.find(a => a.is_active) ?? annees[0]
  const blank = () => ({ nom: '', prenom: '', sexe: 'M', date_nais: '', lieu_nais: '', nationalite: '', email: '', tel: '', bac: '', moyenne_bac: '', annee_bac: '', mention: '', cycle: '', specialite: '', classe: '', annee: String(anneeActive?.id ?? ''), type_inscription: 'nouveau', statut_paiement: false, montant_paye: '' })

  const [form, setForm] = useState(blank())
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [createdCode, setCreatedCode] = useState('')

  const filteredClasses = form.specialite ? classes.filter(c => c.specialite === Number(form.specialite)) : classes

  function set(k: string, v: string | boolean) {
    if (k === 'specialite') { setForm(f => ({ ...f, specialite: v as string, classe: '' })); return }
    setForm(f => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom || !form.prenom || !form.classe || !form.annee) { setErr('Veuillez remplir tous les champs obligatoires.'); return }
    setLoading(true); setErr(null)
    try {
      const payload: Record<string, unknown> = {
        nom: form.nom, prenom: form.prenom, sexe: form.sexe,
        date_nais: form.date_nais || null, lieu_nais: form.lieu_nais, nationalite: form.nationalite,
        email: form.email, tel: form.tel,
        bac: form.bac || undefined, mention: form.mention || undefined, cycle: form.cycle || undefined,
        classe: Number(form.classe), annee: Number(form.annee), etablissement: etablissementId,
        type_inscription: form.type_inscription, statut_paiement: form.statut_paiement,
        montant_paye: form.montant_paye ? Number(form.montant_paye) : 0,
      }
      if (form.specialite) payload.specialite = Number(form.specialite)
      if (form.moyenne_bac) payload.moyenne_bac = Number(form.moyenne_bac)
      if (form.annee_bac) payload.annee_bac = form.annee_bac

      const res = await apiFetch<{ etudiant: { code: string } }>('/inscriptions/create/', { method: 'POST', body: JSON.stringify(payload) })
      setCreatedCode(res.etudiant.code); setDone(true)
    } catch (e: unknown) {
      const err = e as Record<string, unknown>
      setErr(String(err?.detail ?? err?.non_field_errors ?? JSON.stringify(err)))
    } finally { setLoading(false) }
  }

  function resetAndNew() { setDone(false); setForm(blank()); onSuccess() }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {done ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Inscription réussie !</h2>
            <p className="text-slate-500">L'étudiant a été inscrit avec succès.</p>
            <div className="inline-flex items-center gap-2 bg-brand/8 rounded-xl px-5 py-2.5">
              <span className="text-sm font-medium text-slate-500">Code étudiant :</span>
              <span className="text-lg font-bold text-brand font-mono">{createdCode}</span>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" onClick={onClose}>Fermer</Button>
              <Button onClick={resetAndNew}>Nouvelle inscription</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                  <UserPlus size={18} className="text-brand" />
                </div>
                <div>
                  <DialogTitle>Nouvelle inscription</DialogTitle>
                  <DialogDescription>Enregistrement d'un nouvel étudiant et de son inscription.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">{err}</div>}
            <form onSubmit={submit} className="space-y-1">
              <SectionTitle>Informations personnelles</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <F label="Nom" req><Input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="DOE" autoFocus /></F>
                <F label="Prénom" req><Input value={form.prenom} onChange={e => set('prenom', e.target.value)} placeholder="John" /></F>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <F label="Sexe">
                  <SelectNative value={form.sexe} onChange={e => set('sexe', e.target.value)}>
                    <option value="M">Masculin</option><option value="F">Féminin</option>
                  </SelectNative>
                </F>
                <F label="Date de naissance"><Input type="date" value={form.date_nais} onChange={e => set('date_nais', e.target.value)} /></F>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <F label="Lieu de naissance"><Input value={form.lieu_nais} onChange={e => set('lieu_nais', e.target.value)} placeholder="Brazzaville" /></F>
                <F label="Nationalité"><Input value={form.nationalite} onChange={e => set('nationalite', e.target.value)} placeholder="Congolaise" /></F>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <F label="Email"><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemple.com" /></F>
                <F label="Téléphone"><Input value={form.tel} onChange={e => set('tel', e.target.value)} placeholder="+242 06 000 0000" /></F>
              </div>

              <SectionTitle>Baccalauréat</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <F label="Série">
                  <SelectNative value={form.bac} onChange={e => set('bac', e.target.value)}>
                    <option value="">— sélectionner —</option>
                    {SERIES_BAC.map(s => <option key={s} value={s}>{s}</option>)}
                  </SelectNative>
                </F>
                <F label="Mention">
                  <SelectNative value={form.mention} onChange={e => set('mention', e.target.value)}>
                    <option value="">— sélectionner —</option>
                    {MENTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                  </SelectNative>
                </F>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <F label="Moyenne"><Input type="number" step="0.01" min="0" max="20" value={form.moyenne_bac} onChange={e => set('moyenne_bac', e.target.value)} placeholder="12.50" /></F>
                <F label="Année d'obtention"><Input value={form.annee_bac} onChange={e => set('annee_bac', e.target.value)} placeholder="2024" maxLength={4} /></F>
              </div>

              <SectionTitle>Orientation académique</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <F label="Spécialité">
                  <SelectNative value={form.specialite} onChange={e => set('specialite', e.target.value)}>
                    <option value="">— toutes —</option>
                    {specialites.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                  </SelectNative>
                </F>
                <F label="Cycle">
                  <SelectNative value={form.cycle} onChange={e => set('cycle', e.target.value)}>
                    <option value="">— sélectionner —</option>
                    <option value="Licence">Licence</option>
                    <option value="Master">Master</option>
                    <option value="Doctorat">Doctorat</option>
                  </SelectNative>
                </F>
              </div>

              <SectionTitle>Inscription</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <F label="Classe" req>
                  <SelectNative value={form.classe} onChange={e => set('classe', e.target.value)} required>
                    <option value="">— sélectionner —</option>
                    {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.libelle} ({c.niveau})</option>)}
                  </SelectNative>
                </F>
                <F label="Année académique" req>
                  <SelectNative value={form.annee} onChange={e => set('annee', e.target.value)} required>
                    {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}{a.is_active ? ' (active)' : ''}</option>)}
                  </SelectNative>
                </F>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <F label="Type d'inscription">
                  <SelectNative value={form.type_inscription} onChange={e => set('type_inscription', e.target.value)}>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </SelectNative>
                </F>
                <F label="Montant payé (FCFA)"><Input type="number" min="0" value={form.montant_paye} onChange={e => set('montant_paye', e.target.value)} placeholder="0" /></F>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 mt-3">
                <input type="checkbox" className="w-4 h-4 rounded accent-brand" checked={form.statut_paiement} onChange={e => set('statut_paiement', e.target.checked)} />
                Frais d'inscription payés
              </label>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>Annuler</Button>
                <Button type="submit" size="sm" disabled={loading}>{loading ? 'Enregistrement…' : 'Inscrire l\'étudiant'}</Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ══════════════════════════════════════════
   MODAL: Réinscription
══════════════════════════════════════════ */
interface ReinscModalProps {
  open: boolean; classes: Classe[]; annees: Annee[]; etablissementId: number | null
  onClose: () => void; onSuccess: () => void
}

function ReinscModal({ open, classes, annees, etablissementId, onClose, onSuccess }: ReinscModalProps) {
  const anneeActive = annees.find(a => a.is_active) ?? annees[0]
  const [search, setSearch] = useState('')
  const [etudiants, setEtudiants] = useState<Etudiant[]>([])
  const [selected, setSelected] = useState<Etudiant | null>(null)
  const [classe, setClasse] = useState('')
  const [annee, setAnnee] = useState(String(anneeActive?.id ?? ''))
  const [montant, setMontant] = useState('')
  const [paye, setPaye] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // suppress unused warning
  void etablissementId

  async function doSearch() {
    if (!search.trim()) return
    setSearching(true)
    try {
      const data = await apiFetch<ApiList<Etudiant>>(`/etudiants/?search=${encodeURIComponent(search)}&limit=10`)
      setEtudiants(data.results)
    } finally { setSearching(false) }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !classe || !annee) { setErr('Sélectionnez un étudiant, une classe et une année.'); return }
    setLoading(true); setErr(null)
    try {
      await apiFetch('/inscriptions/reinscription/', { method: 'POST', body: JSON.stringify({ etudiant: selected.id, classe: Number(classe), annee: Number(annee), statut_paiement: paye, montant_paye: montant ? Number(montant) : 0 }) })
      setDone(true); onSuccess()
    } catch (e: unknown) {
      const err = e as Record<string, unknown>
      setErr(String(err?.detail ?? JSON.stringify(err)))
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        {done ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Réinscription réussie !</h2>
            <p className="text-slate-500">{selected?.nom} {selected?.prenom} a été réinscrit.</p>
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <RefreshCw size={17} className="text-emerald-500" />
                </div>
                <div>
                  <DialogTitle>Réinscription</DialogTitle>
                  <DialogDescription>Réinscrire un étudiant existant dans une nouvelle classe ou année.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">{err}</div>}
            <form onSubmit={submit} className="space-y-3">
              <SectionTitle>Rechercher l'étudiant</SectionTitle>
              <div className="flex gap-2">
                <Input className="flex-1" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Nom, prénom ou code étudiant…"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), doSearch())} />
                <Button type="button" variant="secondary" size="sm" onClick={doSearch} disabled={searching}>{searching ? '…' : 'Rechercher'}</Button>
              </div>

              {etudiants.length > 0 && !selected && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  {etudiants.map((et, i) => (
                    <div key={et.id} onClick={() => { setSelected(et); setEtudiants([]) }}
                      className={cn('flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors', i < etudiants.length - 1 && 'border-b border-slate-100')}>
                      <div>
                        <span className="font-semibold text-slate-900 text-sm">{et.nom} {et.prenom}</span>
                        <span className="ml-2 text-xs text-slate-400 font-mono">{et.code}</span>
                      </div>
                      <span className="text-xs text-slate-400">{et.specialite_libelle ?? '—'}</span>
                    </div>
                  ))}
                </div>
              )}

              {selected && (
                <div className="flex items-center justify-between px-4 py-3 bg-brand/8 border border-brand/20 rounded-lg">
                  <div>
                    <span className="font-bold text-slate-900">{selected.nom} {selected.prenom}</span>
                    <span className="ml-2 text-sm font-bold text-brand font-mono">{selected.code}</span>
                  </div>
                  <button type="button" onClick={() => { setSelected(null); setEtudiants([]) }} className="text-slate-400 hover:text-red-400 transition-colors">
                    <XCircle size={17} />
                  </button>
                </div>
              )}

              <SectionTitle>Nouvelle inscription</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <F label="Classe" req>
                  <SelectNative value={classe} onChange={e => setClasse(e.target.value)} required>
                    <option value="">— sélectionner —</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.libelle} ({c.niveau})</option>)}
                  </SelectNative>
                </F>
                <F label="Année académique" req>
                  <SelectNative value={annee} onChange={e => setAnnee(e.target.value)} required>
                    {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}{a.is_active ? ' (active)' : ''}</option>)}
                  </SelectNative>
                </F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Montant payé (FCFA)"><Input type="number" min="0" value={montant} onChange={e => setMontant(e.target.value)} placeholder="0" /></F>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                    <input type="checkbox" className="w-4 h-4 rounded accent-emerald-500" checked={paye} onChange={e => setPaye(e.target.checked)} />
                    Frais payés
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>Annuler</Button>
                <Button type="submit" variant="secondary" size="sm" disabled={loading || !selected}>{loading ? 'Enregistrement…' : 'Réinscrire'}</Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ══════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════ */
export default function InscriptionsPage() {
  const [tab, setTab] = useState<'liste' | 'etudiants'>('liste')
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [etudiants, setEtudiants]       = useState<Etudiant[]>([])
  const [classes, setClasses]           = useState<Classe[]>([])
  const [annees, setAnnees]             = useState<Annee[]>([])
  const [specialites, setSpecialites]   = useState<Specialite[]>([])
  const [count, setCount]               = useState(0)
  const [etudCount, setEtudCount]       = useState(0)
  const [offset, setOffset]             = useState(0)
  const [etudOffset, setEtudOffset]     = useState(0)
  const [search, setSearch]             = useState('')
  const [etudSearch, setEtudSearch]     = useState('')
  const [filterAnnee, setFilterAnnee]   = useState('')
  const [filterClasse, setFilterClasse] = useState('')
  const [filterType, setFilterType]     = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [loadingInsc, setLoadingInsc]   = useState(false)
  const [loadingEtud, setLoadingEtud]   = useState(false)
  const [showNew, setShowNew]           = useState(false)
  const [showReinsc, setShowReinsc]     = useState(false)
  const [etablissementId, setEtablissementId] = useState<number | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('dc_user')
    if (raw) { const u = JSON.parse(raw); setEtablissementId(u.etablissement ?? null) }
    apiFetch<ApiList<Classe>>('/classes/?limit=200').then(d => setClasses(d.results)).catch(() => {})
    apiFetch<ApiList<Annee>>('/annees/?limit=50').then(d => {
      setAnnees(d.results)
      const active = d.results.find(a => a.is_active)
      if (active) setFilterAnnee(String(active.id))
    }).catch(() => {})
    apiFetch<ApiList<Specialite>>('/specialites/?limit=200').then(d => setSpecialites(d.results)).catch(() => {})
  }, [])

  const fetchInscriptions = useCallback(async (off: number) => {
    setLoadingInsc(true)
    try {
      const p = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(off) })
      if (search)       p.set('search', search)
      if (filterAnnee)  p.set('annee', filterAnnee)
      if (filterClasse) p.set('classe', filterClasse)
      if (filterType)   p.set('type', filterType)
      const data = await apiFetch<ApiList<Inscription>>(`/inscriptions/?${p}`)
      setInscriptions(data.results); setCount(data.count)
    } finally { setLoadingInsc(false) }
  }, [search, filterAnnee, filterClasse, filterType])

  const fetchEtudiants = useCallback(async (off: number) => {
    setLoadingEtud(true)
    try {
      const p = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(off) })
      if (etudSearch)    p.set('search', etudSearch)
      if (filterStatut)  p.set('statut', filterStatut)
      const data = await apiFetch<ApiList<Etudiant>>(`/etudiants/?${p}`)
      setEtudiants(data.results); setEtudCount(data.count)
    } finally { setLoadingEtud(false) }
  }, [etudSearch, filterStatut])

  useEffect(() => { setOffset(0); fetchInscriptions(0) }, [fetchInscriptions])
  useEffect(() => { setEtudOffset(0); fetchEtudiants(0) }, [fetchEtudiants])

  const totalInscPages = Math.ceil(count / PAGE_SIZE)
  const curInscPage    = Math.floor(offset / PAGE_SIZE) + 1
  const totalEtudPages = Math.ceil(etudCount / PAGE_SIZE)
  const curEtudPage    = Math.floor(etudOffset / PAGE_SIZE) + 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inscriptions</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestion des inscriptions et des étudiants</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowReinsc(true)}><RefreshCw size={14} /> Réinscription</Button>
          <Button onClick={() => setShowNew(true)}><Plus size={14} /> Nouvelle inscription</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b-2 border-slate-200">
        {[
          { id: 'liste' as const, label: `Inscriptions (${count})` },
          { id: 'etudiants' as const, label: `Étudiants (${etudCount})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-5 py-2.5 text-sm font-medium border-b-2 -mb-[2px] transition-colors', tab === t.id ? 'border-brand text-brand font-bold' : 'border-transparent text-slate-500 hover:text-slate-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Inscriptions ── */}
      {tab === 'liste' && (
        <div className="space-y-3">
          <div className="flex gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-[320px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input className="pl-8" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <SelectNative className="w-auto" value={filterAnnee} onChange={e => setFilterAnnee(e.target.value)}>
              <option value="">Toutes les années</option>
              {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
            </SelectNative>
            <SelectNative className="w-auto" value={filterClasse} onChange={e => setFilterClasse(e.target.value)}>
              <option value="">Toutes les classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
            </SelectNative>
            <SelectNative className="w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Tous types</option>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </SelectNative>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Année</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingInsc ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-10">Chargement…</TableCell></TableRow>
                ) : inscriptions.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-10">Aucune inscription trouvée.</TableCell></TableRow>
                ) : inscriptions.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono font-bold text-brand text-[13px]">{i.etudiant_code}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{i.etudiant_nom}</div>
                      <div className="text-xs text-slate-400">{i.etudiant_sexe === 'M' ? 'Homme' : 'Femme'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{i.classe_libelle}</div>
                      <div className="text-xs text-slate-400">{i.classe_niveau}</div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{i.annee_libelle}</TableCell>
                    <TableCell><TypeBadge type={i.type_inscription} /></TableCell>
                    <TableCell>
                      {i.statut_paiement ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-xs"><CheckCircle size={13} /> Payé</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-500 font-semibold text-xs"><XCircle size={13} /> En attente</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">{new Date(i.date_inscription).toLocaleDateString('fr-FR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pg page={curInscPage} total={totalInscPages}
              onPrev={() => { const n = offset - PAGE_SIZE; setOffset(n); fetchInscriptions(n) }}
              onNext={() => { const n = offset + PAGE_SIZE; setOffset(n); fetchInscriptions(n) }}
              label={count === 0 ? '0 résultat' : `${offset + 1}–${Math.min(offset + PAGE_SIZE, count)} sur ${count}`}
            />
          </div>
        </div>
      )}

      {/* ── TAB: Étudiants ── */}
      {tab === 'etudiants' && (
        <div className="space-y-3">
          <div className="flex gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-[320px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input className="pl-8" placeholder="Nom, code étudiant…" value={etudSearch} onChange={e => setEtudSearch(e.target.value)} />
            </div>
            <SelectNative className="w-auto" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
              <option value="">Tous statuts</option>
              <option value="inscrit">Inscrit</option>
              <option value="en cours">En cours</option>
              <option value="admis">Admis</option>
              <option value="refusé">Refusé</option>
            </SelectNative>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Sexe</TableHead>
                  <TableHead>Spécialité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date candidature</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingEtud ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-10">Chargement…</TableCell></TableRow>
                ) : etudiants.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-10">Aucun étudiant trouvé.</TableCell></TableRow>
                ) : etudiants.map(et => (
                  <TableRow key={et.id}>
                    <TableCell className="font-mono font-bold text-brand text-[13px]">{et.code}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{et.nom} {et.prenom}</TableCell>
                    <TableCell className="text-slate-500">{et.sexe}</TableCell>
                    <TableCell className="text-slate-500">{et.specialite_libelle ?? '—'}</TableCell>
                    <TableCell><StatutBadge statut={et.statut} /></TableCell>
                    <TableCell className="text-slate-500 text-xs">{et.email || et.tel || '—'}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{et.date_candidature ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pg page={curEtudPage} total={totalEtudPages}
              onPrev={() => { const n = etudOffset - PAGE_SIZE; setEtudOffset(n); fetchEtudiants(n) }}
              onNext={() => { const n = etudOffset + PAGE_SIZE; setEtudOffset(n); fetchEtudiants(n) }}
              label={etudCount === 0 ? '0 résultat' : `${etudOffset + 1}–${Math.min(etudOffset + PAGE_SIZE, etudCount)} sur ${etudCount}`}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <NewInscModal open={showNew} classes={classes} annees={annees} specialites={specialites}
        etablissementId={etablissementId} onClose={() => setShowNew(false)} onSuccess={() => fetchInscriptions(0)} />
      <ReinscModal open={showReinsc} classes={classes} annees={annees}
        etablissementId={etablissementId} onClose={() => setShowReinsc(false)} onSuccess={() => fetchInscriptions(0)} />
    </div>
  )
}
