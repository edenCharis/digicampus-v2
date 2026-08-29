'use client'
import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, UserPlus, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'

/* ───── Types ───── */
interface Specialite { id: number; libelle: string; code: string }
interface Classe { id: number; libelle: string; niveau: string; specialite: number; specialite_libelle: string; etablissement: number }
interface Annee { id: number; libelle: string; is_active: boolean; etablissement: number }
interface Inscription {
  id: number
  etudiant: number
  etudiant_nom: string
  etudiant_code: string
  etudiant_sexe: string
  classe: number
  classe_libelle: string
  classe_niveau: string
  annee: number
  annee_libelle: string
  etablissement: number
  type_inscription: 'nouveau' | 'reinscrit' | 'transfert'
  statut_paiement: boolean
  montant_paye: string
  date_inscription: string
  est_valide: boolean
}
interface Etudiant {
  id: number
  code: string
  nom: string
  prenom: string
  sexe: string
  email: string
  tel: string
  statut: string
  specialite_libelle: string | null
  date_candidature?: string
}
interface ApiList<T> { count: number; next: string | null; previous: string | null; results: T[] }

/* ───── Helpers ───── */
const PAGE_SIZE = 20

const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3']
const TYPES = [
  { value: 'nouveau', label: 'Nouveau' },
  { value: 'reinscrit', label: 'Réinscrit' },
  { value: 'transfert', label: 'Transfert' },
]
const SERIES_BAC = ['A', 'C', 'D', 'E', 'F6', 'H', 'R1', 'R5', 'R6']
const MENTIONS = ['Passable', 'Assez-bien', 'Bien', 'Très-bien']

function typeBadge(t: string) {
  const map: Record<string, { bg: string; color: string }> = {
    nouveau: { bg: 'rgba(26,175,230,0.12)', color: '#1AAFE6' },
    reinscrit: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    transfert: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  }
  const s = map[t] ?? { bg: '#f1f5f9', color: '#64748b' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.65rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color }}>
      {TYPES.find(x => x.value === t)?.label ?? t}
    </span>
  )
}

/* ───── Styles ───── */
const S: Record<string, React.CSSProperties> = {
  tabs: { display: 'flex', gap: 4, marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: 0 },
  tab: { padding: '0.6rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#64748b', borderBottom: '2px solid transparent', marginBottom: '-2px', borderRadius: 0 },
  tabActive: { padding: '0.6rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, color: '#1AAFE6', borderBottom: '2px solid #1AAFE6', marginBottom: '-2px', borderRadius: 0 },
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '1.375rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', background: '#1AAFE6', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', background: 'rgba(26,175,230,0.1)', color: '#1AAFE6', border: '1px solid rgba(26,175,230,0.3)', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
  toolbar: { display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' },
  searchWrap: { position: 'relative', flex: 1, minWidth: 220, maxWidth: 340 },
  searchIcon: { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', outline: 'none', background: '#fff' },
  select: { padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', outline: 'none', background: '#fff' },
  tableWrap: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' },
  th: { background: '#f8fafc', padding: '0.75rem 1rem', textAlign: 'left' as const, color: '#64748b', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#1e293b', fontSize: '0.875rem', verticalAlign: 'middle' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderTop: '1px solid #f1f5f9' },
  pagInfo: { fontSize: '0.8rem', color: '#64748b' },
  pagBtns: { display: 'flex', gap: 4 },
  pagBtn: { padding: '0.375rem 0.625rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#475569', fontSize: '0.8125rem' },
  empty: { padding: '3rem', textAlign: 'center' as const, color: '#94a3b8' },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' },
  modal: { background: '#fff', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 640, marginBottom: '2rem' },
  modalTitle: { fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' },
  modalSub: { color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' },
  sectionTitle: { fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '1.25rem 0 0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  formGroup: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#475569', marginBottom: 6 },
  labelReq: { color: '#ef4444', marginLeft: 2 },
  input: { width: '100%', padding: '0.5625rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const },
  fSelect: { width: '100%', padding: '0.5625rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', background: '#fff', boxSizing: 'border-box' as const },
  formActions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' },
  btnCancel: { padding: '0.5rem 1.25rem', background: '#f1f5f9', border: 'none', borderRadius: 8, color: '#64748b', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 },
  errBox: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.625rem 0.875rem', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' },
  successBox: { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '0.625rem 0.875rem', color: '#10b981', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 },
}

/* ──────────────────────────────────────────
   MODAL: Nouvelle inscription
────────────────────────────────────────── */
interface NewInscModalProps {
  classes: Classe[]
  annees: Annee[]
  specialites: Specialite[]
  etablissementId: number | null
  onClose: () => void
  onSuccess: () => void
}

function NewInscModal({ classes, annees, specialites, etablissementId, onClose, onSuccess }: NewInscModalProps) {
  const anneeActive = annees.find(a => a.is_active) ?? annees[0]

  const [form, setForm] = useState({
    nom: '', prenom: '', sexe: 'M',
    date_nais: '', lieu_nais: '', nationalite: '', email: '', tel: '',
    bac: '', moyenne_bac: '', annee_bac: '', mention: '', cycle: '',
    specialite: '', classe: '', annee: String(anneeActive?.id ?? ''),
    type_inscription: 'nouveau', statut_paiement: false, montant_paye: '',
  })

  const filteredClasses = form.specialite
    ? classes.filter(c => c.specialite === Number(form.specialite))
    : classes

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [createdCode, setCreatedCode] = useState('')

  function set(k: string, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'specialite') setForm(f => ({ ...f, specialite: v as string, classe: '' }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom || !form.prenom || !form.classe || !form.annee) {
      setErr('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setLoading(true); setErr(null)
    try {
      const payload: Record<string, unknown> = {
        nom: form.nom, prenom: form.prenom, sexe: form.sexe,
        date_nais: form.date_nais || null,
        lieu_nais: form.lieu_nais, nationalite: form.nationalite,
        email: form.email, tel: form.tel,
        bac: form.bac || undefined, mention: form.mention || undefined,
        cycle: form.cycle || undefined,
        classe: Number(form.classe), annee: Number(form.annee),
        etablissement: etablissementId,
        type_inscription: form.type_inscription,
        statut_paiement: form.statut_paiement,
        montant_paye: form.montant_paye ? Number(form.montant_paye) : 0,
      }
      if (form.specialite) payload.specialite = Number(form.specialite)
      if (form.moyenne_bac) payload.moyenne_bac = Number(form.moyenne_bac)
      if (form.annee_bac) payload.annee_bac = form.annee_bac

      const res = await apiFetch<{ etudiant: { code: string }; inscription: unknown }>(
        '/inscriptions/create/', { method: 'POST', body: JSON.stringify(payload) }
      )
      setCreatedCode(res.etudiant.code)
      setDone(true)
    } catch (e: unknown) {
      const err = e as Record<string, unknown>
      const msg = err?.detail ?? err?.non_field_errors ?? JSON.stringify(err)
      setErr(String(msg))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={S.overlay}>
        <div style={{ ...S.modal, textAlign: 'center', paddingTop: '3rem' }}>
          <CheckCircle size={56} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Inscription réussie !</h2>
          <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>L'étudiant a été inscrit avec succès.</p>
          <p style={{ fontWeight: 700, color: '#1AAFE6', fontSize: '1.1rem', marginBottom: '2rem' }}>Code étudiant : {createdCode}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button style={S.btnCancel} onClick={onClose}>Fermer</button>
            <button style={S.btnPrimary} onClick={() => { setDone(false); setForm({ nom: '', prenom: '', sexe: 'M', date_nais: '', lieu_nais: '', nationalite: '', email: '', tel: '', bac: '', moyenne_bac: '', annee_bac: '', mention: '', cycle: '', specialite: '', classe: '', annee: String(anneeActive?.id ?? ''), type_inscription: 'nouveau', statut_paiement: false, montant_paye: '' }); onSuccess() }}>
              Nouvelle inscription
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <h2 style={S.modalTitle}><UserPlus size={20} style={{ verticalAlign: 'middle', marginRight: 8, color: '#1AAFE6' }} />Nouvelle inscription</h2>
        <p style={S.modalSub}>Enregistrement d'un nouvel étudiant et de son inscription.</p>
        {err && <div style={S.errBox}>{err}</div>}
        <form onSubmit={submit}>
          <p style={S.sectionTitle}>Informations personnelles</p>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Nom <span style={S.labelReq}>*</span></label>
              <input style={S.input} value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="DOE" autoFocus />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Prénom <span style={S.labelReq}>*</span></label>
              <input style={S.input} value={form.prenom} onChange={e => set('prenom', e.target.value)} placeholder="John" />
            </div>
          </div>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Sexe</label>
              <select style={S.fSelect} value={form.sexe} onChange={e => set('sexe', e.target.value)}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Date de naissance</label>
              <input type="date" style={S.input} value={form.date_nais} onChange={e => set('date_nais', e.target.value)} />
            </div>
          </div>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Lieu de naissance</label>
              <input style={S.input} value={form.lieu_nais} onChange={e => set('lieu_nais', e.target.value)} placeholder="Brazzaville" />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Nationalité</label>
              <input style={S.input} value={form.nationalite} onChange={e => set('nationalite', e.target.value)} placeholder="Congolaise" />
            </div>
          </div>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Email</label>
              <input type="email" style={S.input} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemple.com" />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Téléphone</label>
              <input style={S.input} value={form.tel} onChange={e => set('tel', e.target.value)} placeholder="+242 06 000 0000" />
            </div>
          </div>

          <p style={S.sectionTitle}>Baccalauréat</p>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Série du bac</label>
              <select style={S.fSelect} value={form.bac} onChange={e => set('bac', e.target.value)}>
                <option value="">— sélectionner —</option>
                {SERIES_BAC.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Mention</label>
              <select style={S.fSelect} value={form.mention} onChange={e => set('mention', e.target.value)}>
                <option value="">— sélectionner —</option>
                {MENTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Moyenne bac</label>
              <input type="number" step="0.01" min="0" max="20" style={S.input} value={form.moyenne_bac} onChange={e => set('moyenne_bac', e.target.value)} placeholder="12.50" />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Année d'obtention</label>
              <input style={S.input} value={form.annee_bac} onChange={e => set('annee_bac', e.target.value)} placeholder="2024" maxLength={4} />
            </div>
          </div>

          <p style={S.sectionTitle}>Orientation académique</p>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Spécialité</label>
              <select style={S.fSelect} value={form.specialite} onChange={e => set('specialite', e.target.value)}>
                <option value="">— toutes —</option>
                {specialites.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
              </select>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Cycle</label>
              <select style={S.fSelect} value={form.cycle} onChange={e => set('cycle', e.target.value)}>
                <option value="">— sélectionner —</option>
                <option value="Licence">Licence</option>
                <option value="Master">Master</option>
                <option value="Doctorat">Doctorat</option>
              </select>
            </div>
          </div>

          <p style={S.sectionTitle}>Inscription</p>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Classe <span style={S.labelReq}>*</span></label>
              <select style={S.fSelect} value={form.classe} onChange={e => set('classe', e.target.value)} required>
                <option value="">— sélectionner —</option>
                {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.libelle} ({c.niveau})</option>)}
              </select>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Année académique <span style={S.labelReq}>*</span></label>
              <select style={S.fSelect} value={form.annee} onChange={e => set('annee', e.target.value)} required>
                {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}{a.is_active ? ' (active)' : ''}</option>)}
              </select>
            </div>
          </div>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Type d'inscription</label>
              <select style={S.fSelect} value={form.type_inscription} onChange={e => set('type_inscription', e.target.value)}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Montant payé (FCFA)</label>
              <input type="number" min="0" style={S.input} value={form.montant_paye} onChange={e => set('montant_paye', e.target.value)} placeholder="0" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <input type="checkbox" id="sp" checked={form.statut_paiement} onChange={e => set('statut_paiement', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#1AAFE6' }} />
            <label htmlFor="sp" style={{ fontSize: '0.875rem', color: '#475569', cursor: 'pointer' }}>Frais d'inscription payés</label>
          </div>

          <div style={S.formActions}>
            <button type="button" style={S.btnCancel} onClick={onClose}>Annuler</button>
            <button type="submit" style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Enregistrement…' : 'Inscrire l\'étudiant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────
   MODAL: Réinscription
────────────────────────────────────────── */
interface ReinscModalProps {
  classes: Classe[]
  annees: Annee[]
  etablissementId: number | null
  onClose: () => void
  onSuccess: () => void
}

function ReinscModal({ classes, annees, etablissementId, onClose, onSuccess }: ReinscModalProps) {
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
      await apiFetch('/inscriptions/reinscription/', {
        method: 'POST',
        body: JSON.stringify({
          etudiant: selected.id, classe: Number(classe), annee: Number(annee),
          statut_paiement: paye, montant_paye: montant ? Number(montant) : 0,
        }),
      })
      setDone(true); onSuccess()
    } catch (e: unknown) {
      const err = e as Record<string, unknown>
      setErr(String(err?.detail ?? JSON.stringify(err)))
    } finally { setLoading(false) }
  }

  if (done) {
    return (
      <div style={S.overlay}>
        <div style={{ ...S.modal, textAlign: 'center', paddingTop: '3rem' }}>
          <CheckCircle size={56} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Réinscription réussie !</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>{selected?.nom} {selected?.prenom} a été réinscrit.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button style={S.btnCancel} onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <h2 style={S.modalTitle}><RefreshCw size={20} style={{ verticalAlign: 'middle', marginRight: 8, color: '#10b981' }} />Réinscription</h2>
        <p style={S.modalSub}>Réinscrire un étudiant existant dans une nouvelle classe ou année.</p>
        {err && <div style={S.errBox}>{err}</div>}
        <form onSubmit={submit}>
          <p style={S.sectionTitle}>Rechercher l'étudiant</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input style={{ ...S.input, flex: 1 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, prénom ou code étudiant…" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), doSearch())} />
            <button type="button" style={S.btnSecondary} onClick={doSearch} disabled={searching}>{searching ? '…' : 'Rechercher'}</button>
          </div>
          {etudiants.length > 0 && !selected && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: '1rem' }}>
              {etudiants.map(et => (
                <div key={et.id} onClick={() => setSelected(et)} style={{ padding: '0.625rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{et.nom} {et.prenom}</span>
                    <span style={{ marginLeft: 8, fontSize: '0.8rem', color: '#64748b' }}>{et.code}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{et.specialite_libelle ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
          {selected && (
            <div style={{ background: 'rgba(26,175,230,0.08)', border: '1px solid rgba(26,175,230,0.25)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{selected.nom} {selected.prenom}</span>
                <span style={{ marginLeft: 8, fontSize: '0.8rem', color: '#1AAFE6', fontWeight: 600 }}>{selected.code}</span>
              </div>
              <button type="button" onClick={() => { setSelected(null); setEtudiants([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <XCircle size={18} />
              </button>
            </div>
          )}

          <p style={S.sectionTitle}>Nouvelle inscription</p>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Classe <span style={S.labelReq}>*</span></label>
              <select style={S.fSelect} value={classe} onChange={e => setClasse(e.target.value)} required>
                <option value="">— sélectionner —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.libelle} ({c.niveau})</option>)}
              </select>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Année académique <span style={S.labelReq}>*</span></label>
              <select style={S.fSelect} value={annee} onChange={e => setAnnee(e.target.value)} required>
                {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}{a.is_active ? ' (active)' : ''}</option>)}
              </select>
            </div>
          </div>
          <div style={S.formRow}>
            <div style={S.formGroup}>
              <label style={S.label}>Montant payé (FCFA)</label>
              <input type="number" min="0" style={S.input} value={montant} onChange={e => setMontant(e.target.value)} placeholder="0" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: '#475569' }}>
                <input type="checkbox" checked={paye} onChange={e => setPaye(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#10b981' }} />
                Frais payés
              </label>
            </div>
          </div>

          <div style={S.formActions}>
            <button type="button" style={S.btnCancel} onClick={onClose}>Annuler</button>
            <button type="submit" style={{ ...S.btnSecondary, opacity: loading ? 0.7 : 1 }} disabled={loading || !selected}>
              {loading ? 'Enregistrement…' : 'Réinscrire'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────
   PAGE PRINCIPALE
────────────────────────────────────────── */
export default function InscriptionsPage() {
  const [tab, setTab] = useState<'liste' | 'etudiants'>('liste')
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [etudiants, setEtudiants] = useState<Etudiant[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [annees, setAnnees] = useState<Annee[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [count, setCount] = useState(0)
  const [etudCount, setEtudCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [etudOffset, setEtudOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [etudSearch, setEtudSearch] = useState('')
  const [filterAnnee, setFilterAnnee] = useState('')
  const [filterClasse, setFilterClasse] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [loadingInsc, setLoadingInsc] = useState(false)
  const [loadingEtud, setLoadingEtud] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showReinsc, setShowReinsc] = useState(false)
  const [etablissementId, setEtablissementId] = useState<number | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('dc_user')
    if (raw) {
      const u = JSON.parse(raw)
      setEtablissementId(u.etablissement ?? null)
    }
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
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(off) })
      if (search) params.set('search', search)
      if (filterAnnee) params.set('annee', filterAnnee)
      if (filterClasse) params.set('classe', filterClasse)
      if (filterType) params.set('type', filterType)
      const data = await apiFetch<ApiList<Inscription>>(`/inscriptions/?${params}`)
      setInscriptions(data.results)
      setCount(data.count)
    } finally { setLoadingInsc(false) }
  }, [search, filterAnnee, filterClasse, filterType])

  const fetchEtudiants = useCallback(async (off: number) => {
    setLoadingEtud(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(off) })
      if (etudSearch) params.set('search', etudSearch)
      if (filterStatut) params.set('statut', filterStatut)
      const data = await apiFetch<ApiList<Etudiant>>(`/etudiants/?${params}`)
      setEtudiants(data.results)
      setEtudCount(data.count)
    } finally { setLoadingEtud(false) }
  }, [etudSearch, filterStatut])

  useEffect(() => { setOffset(0); fetchInscriptions(0) }, [fetchInscriptions])
  useEffect(() => { setEtudOffset(0); fetchEtudiants(0) }, [fetchEtudiants])

  function handleInscPage(dir: 1 | -1) {
    const next = offset + dir * PAGE_SIZE
    setOffset(next); fetchInscriptions(next)
  }
  function handleEtudPage(dir: 1 | -1) {
    const next = etudOffset + dir * PAGE_SIZE
    setEtudOffset(next); fetchEtudiants(next)
  }

  const totalInscPages = Math.ceil(count / PAGE_SIZE)
  const curInscPage = Math.floor(offset / PAGE_SIZE) + 1
  const totalEtudPages = Math.ceil(etudCount / PAGE_SIZE)
  const curEtudPage = Math.floor(etudOffset / PAGE_SIZE) + 1

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.title}>Inscriptions</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Gestion des inscriptions et des étudiants
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={S.btnSecondary} onClick={() => setShowReinsc(true)}>
            <RefreshCw size={15} /> Réinscription
          </button>
          <button style={S.btnPrimary} onClick={() => setShowNew(true)}>
            <Plus size={15} /> Nouvelle inscription
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        <button style={tab === 'liste' ? S.tabActive : S.tab} onClick={() => setTab('liste')}>
          Inscriptions ({count})
        </button>
        <button style={tab === 'etudiants' ? S.tabActive : S.tab} onClick={() => setTab('etudiants')}>
          Étudiants ({etudCount})
        </button>
      </div>

      {/* ── TAB: Liste inscriptions ── */}
      {tab === 'liste' && (
        <>
          <div style={S.toolbar}>
            <div style={S.searchWrap}>
              <Search size={14} style={S.searchIcon} />
              <input style={S.searchInput} placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select style={S.select} value={filterAnnee} onChange={e => setFilterAnnee(e.target.value)}>
              <option value="">Toutes les années</option>
              {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
            </select>
            <select style={S.select} value={filterClasse} onChange={e => setFilterClasse(e.target.value)}>
              <option value="">Toutes les classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
            </select>
            <select style={S.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Tous types</option>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div style={S.tableWrap}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={S.th}>Code</th>
                    <th style={S.th}>Étudiant</th>
                    <th style={S.th}>Classe</th>
                    <th style={S.th}>Année</th>
                    <th style={S.th}>Type</th>
                    <th style={S.th}>Paiement</th>
                    <th style={S.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingInsc ? (
                    <tr><td colSpan={7} style={S.empty}>Chargement…</td></tr>
                  ) : inscriptions.length === 0 ? (
                    <tr><td colSpan={7} style={S.empty}>Aucune inscription trouvée.</td></tr>
                  ) : inscriptions.map(i => (
                    <tr key={i.id} style={{ cursor: 'default' }}>
                      <td style={S.td}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: '#1AAFE6' }}>{i.etudiant_code}</span>
                      </td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{i.etudiant_nom}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{i.etudiant_sexe === 'M' ? 'Homme' : 'Femme'}</div>
                      </td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 500 }}>{i.classe_libelle}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{i.classe_niveau}</div>
                      </td>
                      <td style={{ ...S.td, color: '#475569' }}>{i.annee_libelle}</td>
                      <td style={S.td}>{typeBadge(i.type_inscription)}</td>
                      <td style={S.td}>
                        {i.statut_paiement ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}>
                            <CheckCircle size={14} /> Payé
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 600, fontSize: '0.8rem' }}>
                            <XCircle size={14} /> En attente
                          </span>
                        )}
                      </td>
                      <td style={{ ...S.td, color: '#64748b', fontSize: '0.8rem' }}>
                        {new Date(i.date_inscription).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={S.pagination}>
              <span style={S.pagInfo}>
                {count === 0 ? '0 résultat' : `${offset + 1}–${Math.min(offset + PAGE_SIZE, count)} sur ${count}`}
              </span>
              <div style={S.pagBtns}>
                <button style={S.pagBtn} onClick={() => handleInscPage(-1)} disabled={curInscPage === 1}><ChevronLeft size={14} /></button>
                <button style={S.pagBtn} onClick={() => handleInscPage(1)} disabled={curInscPage === totalInscPages || totalInscPages === 0}><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TAB: Étudiants ── */}
      {tab === 'etudiants' && (
        <>
          <div style={S.toolbar}>
            <div style={S.searchWrap}>
              <Search size={14} style={S.searchIcon} />
              <input style={S.searchInput} placeholder="Rechercher par nom, code…" value={etudSearch} onChange={e => setEtudSearch(e.target.value)} />
            </div>
            <select style={S.select} value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
              <option value="">Tous statuts</option>
              <option value="inscrit">Inscrit</option>
              <option value="en cours">En cours</option>
              <option value="admis">Admis</option>
              <option value="refusé">Refusé</option>
            </select>
          </div>
          <div style={S.tableWrap}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={S.th}>Code</th>
                    <th style={S.th}>Nom complet</th>
                    <th style={S.th}>Sexe</th>
                    <th style={S.th}>Spécialité</th>
                    <th style={S.th}>Statut</th>
                    <th style={S.th}>Contact</th>
                    <th style={S.th}>Date candidature</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingEtud ? (
                    <tr><td colSpan={7} style={S.empty}>Chargement…</td></tr>
                  ) : etudiants.length === 0 ? (
                    <tr><td colSpan={7} style={S.empty}>Aucun étudiant trouvé.</td></tr>
                  ) : etudiants.map(et => (
                    <tr key={et.id}>
                      <td style={S.td}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: '#1AAFE6' }}>{et.code}</span>
                      </td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{et.nom} {et.prenom}</div>
                      </td>
                      <td style={S.td}>{et.sexe === 'M' ? 'M' : 'F'}</td>
                      <td style={{ ...S.td, color: '#64748b' }}>{et.specialite_libelle ?? '—'}</td>
                      <td style={S.td}>
                        <StatutBadge statut={et.statut} />
                      </td>
                      <td style={{ ...S.td, fontSize: '0.8rem', color: '#64748b' }}>
                        {et.email || et.tel || '—'}
                      </td>
                      <td style={{ ...S.td, color: '#64748b', fontSize: '0.8rem' }}>
                        {et.date_candidature}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={S.pagination}>
              <span style={S.pagInfo}>
                {etudCount === 0 ? '0 résultat' : `${etudOffset + 1}–${Math.min(etudOffset + PAGE_SIZE, etudCount)} sur ${etudCount}`}
              </span>
              <div style={S.pagBtns}>
                <button style={S.pagBtn} onClick={() => handleEtudPage(-1)} disabled={curEtudPage === 1}><ChevronLeft size={14} /></button>
                <button style={S.pagBtn} onClick={() => handleEtudPage(1)} disabled={curEtudPage === totalEtudPages || totalEtudPages === 0}><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showNew && (
        <NewInscModal
          classes={classes} annees={annees} specialites={specialites}
          etablissementId={etablissementId}
          onClose={() => setShowNew(false)}
          onSuccess={() => fetchInscriptions(0)}
        />
      )}
      {showReinsc && (
        <ReinscModal
          classes={classes} annees={annees}
          etablissementId={etablissementId}
          onClose={() => setShowReinsc(false)}
          onSuccess={() => fetchInscriptions(0)}
        />
      )}
    </div>
  )
}

function StatutBadge({ statut }: { statut: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    inscrit: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    'en cours': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    admis: { bg: 'rgba(26,175,230,0.12)', color: '#1AAFE6' },
    'refusé': { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  }
  const s = map[statut] ?? { bg: '#f1f5f9', color: '#64748b' }
  const labels: Record<string, string> = { inscrit: 'Inscrit', 'en cours': 'En cours', admis: 'Admis', 'refusé': 'Refusé' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color }}>
      {labels[statut] ?? statut}
    </span>
  )
}
