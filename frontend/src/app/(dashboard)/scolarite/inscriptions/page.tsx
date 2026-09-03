'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Search, Plus, ChevronLeft, ChevronRight, UserPlus, RefreshCw,
  CheckCircle, XCircle, CheckCircle2, ChevronDown, Upload, Download,
  FileSpreadsheet, X, AlertCircle,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'

/* ── Types ── */
interface Specialite { id: number; libelle: string; code: string }
interface Classe     { id: number; libelle: string; niveau: string; specialite: number; specialite_libelle: string }
interface Annee      { id: number; libelle: string; is_active: boolean }
interface Inscription {
  id: number; etudiant: number; etudiant_nom: string; etudiant_code: string; etudiant_sexe: string
  classe: number; classe_libelle: string; classe_niveau: string
  annee: number; annee_libelle: string; etablissement: number
  type_inscription: 'nouveau' | 'reinscrit' | 'transfert'
  statut_paiement: boolean; montant_paye: string; date_inscription: string; est_valide: boolean
}
interface Etudiant   { id: number; code: string; nom: string; prenom: string; sexe: string; email: string; tel: string; statut: string; specialite_libelle: string | null; date_candidature?: string }
interface ApiList<T> { count: number; next: string | null; previous: string | null; results: T[] }

const PAGE_SIZE  = 20
const TYPES      = [{ value: 'nouveau', label: 'Nouveau' }, { value: 'reinscrit', label: 'Réinscrit' }, { value: 'transfert', label: 'Transfert' }]
const SERIES_BAC = ['A','C','D','E','F6','H','R1','R5','R6']
const MENTIONS   = ['Passable','Assez-bien','Bien','Très-bien']
const CYCLES     = ['Licence','Master','Doctorat']
const NIVEAUX    = ['L1','L2','L3','M1','M2','D1','D2','D3']

/* ── Inline styles ── */
const ST = (
  <style>{`
    .insc-wrap { min-height:100vh; }
    .pg-hdr { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
    .pg-title { font-size:1.25rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
    .pg-sub { font-size:.8rem; color:#94a3b8; margin:.2rem 0 0; }
    .hdr-btns { display:flex; gap:.5rem; flex-wrap:wrap; }

    /* tabs */
    .tabs { display:flex; border-bottom:2px solid #f1f5f9; margin-bottom:1.25rem; }
    .tab { padding:.625rem 1.25rem; font-size:.875rem; font-weight:500; border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-2px; color:#94a3b8; transition:all .15s; }
    .tab.active { border-bottom-color:#EF4444; color:#EF4444; font-weight:700; }

    /* toolbar */
    .toolbar { display:flex; gap:.625rem; flex-wrap:wrap; margin-bottom:1rem; align-items:center; }
    .toolbar-search { display:flex; align-items:center; gap:.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:9px; padding:.45rem .75rem; flex:1; min-width:200px; max-width:300px; }
    .toolbar-search input { background:none; border:none; outline:none; font-size:.8125rem; color:#334155; width:100%; }
    .toolbar-search input::placeholder { color:#94a3b8; }
    .toolbar-sel { background:#fff; border:1px solid #e2e8f0; border-radius:9px; padding:.45rem .75rem; font-size:.8125rem; color:#475569; cursor:pointer; outline:none; }

    /* table */
    .sc-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; }
    .sc-table { width:100%; border-collapse:collapse; }
    .sc-table th { padding:.75rem 1rem; text-align:left; font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid #f1f5f9; background:#fafafa; white-space:nowrap; }
    .sc-table td { padding:.75rem 1rem; font-size:.8125rem; color:#475569; border-bottom:1px solid #f8fafc; vertical-align:middle; }
    .sc-table tr:last-child td { border-bottom:none; }
    .sc-table tr:hover td { background:#fafafa; }
    .sc-primary { font-weight:600; color:#0f172a; }
    .sc-sub { font-size:.75rem; color:#94a3b8; margin-top:1px; }
    .sc-mono { font-family:monospace; font-weight:700; color:#EF4444; font-size:.8125rem; }
    .sc-empty { padding:3rem 1rem; text-align:center; color:#94a3b8; font-size:.875rem; }

    /* badge */
    .badge { display:inline-flex; align-items:center; padding:.2rem .6rem; border-radius:99px; font-size:.7rem; font-weight:700; white-space:nowrap; }

    /* pagination */
    .pg-foot { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1rem; border-top:1px solid #f1f5f9; }
    .pg-count { font-size:.75rem; color:#94a3b8; }
    .pg-btns { display:flex; gap:.25rem; }
    .pg-btn { padding:.35rem .5rem; border:1px solid #e2e8f0; border-radius:7px; background:#fff; cursor:pointer; color:#64748b; transition:all .15s; display:flex; align-items:center; }
    .pg-btn:disabled { opacity:.4; cursor:not-allowed; }
    .pg-btn:not(:disabled):hover { background:#fafafa; }

    /* action buttons */
    .btn { display:inline-flex; align-items:center; gap:.375rem; border:none; border-radius:9px; padding:.5rem 1rem; font-size:.8125rem; font-weight:600; cursor:pointer; transition:all .15s; white-space:nowrap; }
    .btn-primary { background:#EF4444; color:#fff; }
    .btn-primary:hover { background:#DC2626; }
    .btn-secondary { background:#f1f5f9; color:#475569; }
    .btn-secondary:hover { background:#e2e8f0; }
    .btn-green { background:#10b981; color:#fff; }
    .btn-green:hover { background:#059669; }
    .btn-outline { background:#fff; color:#475569; border:1px solid #e2e8f0; }
    .btn-outline:hover { background:#f8fafc; }
    .btn:disabled { opacity:.6; cursor:not-allowed; }

    /* modal */
    .mo { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:200; display:flex; align-items:flex-end; justify-content:center; padding:0; }
    @media(min-width:640px){ .mo { align-items:center; padding:1rem; } }
    .mo-box { background:#fff; border-radius:16px 16px 0 0; width:100%; max-width:640px; max-height:92vh; overflow-y:auto; display:flex; flex-direction:column; }
    @media(min-width:640px){ .mo-box { border-radius:16px; } }
    .mo-box-sm { max-width:480px; }
    .mo-head { display:flex; align-items:center; justify-content:space-between; padding:1.125rem 1.5rem 1rem; border-bottom:1px solid #f1f5f9; flex-shrink:0; position:sticky; top:0; background:#fff; z-index:1; }
    .mo-title { font-size:1rem; font-weight:700; color:#0f172a; display:flex; align-items:center; gap:.625rem; }
    .mo-title-icon { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .mo-x { background:none; border:none; cursor:pointer; color:#94a3b8; padding:4px; border-radius:7px; display:flex; align-items:center; }
    .mo-x:hover { background:#f1f5f9; color:#475569; }
    .mo-body { padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:.875rem; flex:1; }
    .mo-foot { display:flex; justify-content:flex-end; gap:.5rem; padding:1rem 1.5rem; border-top:1px solid #f1f5f9; flex-shrink:0; background:#fff; }

    /* form fields */
    .fl { display:flex; flex-direction:column; gap:.375rem; }
    .fl label { font-size:.68rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.07em; }
    .fl label .req { color:#ef4444; margin-left:2px; }
    .fl input[type=text], .fl input[type=email], .fl input[type=number], .fl input[type=date], .fl input[type=tel] {
      width:100%; border:1px solid #e2e8f0; border-radius:9px; padding:.55rem .75rem;
      font-size:.875rem; color:#334155; outline:none; transition:border .15s; background:#fff;
    }
    .fl input:focus { border-color:#EF4444; }
    .g2 { display:grid; grid-template-columns:1fr 1fr; gap:.875rem; }
    .g3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:.875rem; }

    /* section title */
    .sec-title { font-size:.68rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:.1em; border-bottom:1px solid #f1f5f9; padding-bottom:.375rem; margin-top:.25rem; }

    /* SearchSelect */
    .ss-wrap { position:relative; }
    .ss-trigger {
      border:1px solid #e2e8f0; border-radius:9px; padding:.55rem .75rem;
      font-size:.875rem; color:#334155; cursor:pointer; background:#fff;
      display:flex; justify-content:space-between; align-items:center; gap:.5rem;
      transition:border .15s; user-select:none; min-height:38px;
    }
    .ss-trigger:hover, .ss-trigger.open { border-color:#EF4444; }
    .ss-trigger .placeholder { color:#94a3b8; }
    .ss-dropdown {
      position:absolute; top:calc(100% + 4px); left:0; right:0; z-index:400;
      background:#fff; border:1px solid #e2e8f0; border-radius:9px;
      box-shadow:0 8px 24px rgba(0,0,0,0.1); overflow:hidden;
    }
    .ss-search { padding:6px 8px; border-bottom:1px solid #f1f5f9; }
    .ss-search input { width:100%; border:none; outline:none; font-size:.8125rem; color:#334155; background:none; }
    .ss-search input::placeholder { color:#94a3b8; }
    .ss-list { max-height:180px; overflow-y:auto; }
    .ss-opt { padding:.5rem .75rem; font-size:.8125rem; cursor:pointer; color:#475569; transition:background .1s; }
    .ss-opt:hover { background:#f8fafc; color:#0f172a; }
    .ss-opt.sel { background:#FEF2F2; color:#EF4444; font-weight:600; }
    .ss-opt.empty { color:#94a3b8; cursor:default; }

    /* error */
    .err { background:#fef2f2; border:1px solid #fecaca; border-radius:9px; padding:.65rem .875rem; font-size:.8rem; color:#dc2626; display:flex; align-items:flex-start; gap:.5rem; }

    /* import */
    .import-zone { border:2px dashed #e2e8f0; border-radius:12px; padding:2rem 1rem; text-align:center; cursor:pointer; transition:border-color .15s; }
    .import-zone:hover, .import-zone.drag { border-color:#EF4444; background:#FEF2F2; }
    .import-row { display:flex; align-items:center; gap:1rem; padding:.5rem 0; border-bottom:1px solid #f1f5f9; font-size:.8rem; }
    .import-row:last-child { border:none; }
    .import-row .idx { width:24px; text-align:right; color:#94a3b8; font-size:.7rem; }
    .import-row.err-row { background:#FEF2F2; border-radius:7px; padding:.5rem .5rem; }
    .import-progress { height:4px; background:#f1f5f9; border-radius:4px; overflow:hidden; margin-top:.5rem; }
    .import-progress-bar { height:100%; background:#EF4444; border-radius:4px; transition:width .2s; }
    .reinsc-result { display:flex; align-items:center; justify-content:space-between; padding:.5rem .75rem; cursor:pointer; border-radius:9px; }
    .reinsc-result:hover { background:#f8fafc; }
  `}</style>
)

/* ── SearchSelect ── */
interface Opt { value: string; label: string }
function SearchSelect({ value, onChange, options, placeholder = '— sélectionner —' }: { value: string; onChange: (v: string) => void; options: Opt[]; placeholder?: string }) {
  const [open, setOpen]   = useState(false)
  const [q, setQ]         = useState('')
  const ref               = useRef<HTMLDivElement>(null)
  const inputRef          = useRef<HTMLInputElement>(null)
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())) : options
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])

  return (
    <div ref={ref} className="ss-wrap">
      <div className={`ss-trigger${open ? ' open' : ''}`} onClick={() => setOpen(v => !v)}>
        <span className={selected ? '' : 'placeholder'}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={13} color="#94a3b8" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </div>
      {open && (
        <div className="ss-dropdown">
          <div className="ss-search">
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher…" />
          </div>
          <div className="ss-list">
            {filtered.length === 0
              ? <div className="ss-opt empty">Aucun résultat</div>
              : filtered.map(o => (
                <div key={o.value} className={`ss-opt${o.value === value ? ' sel' : ''}`}
                  onClick={() => { onChange(o.value); setOpen(false); setQ('') }}>
                  {o.label}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Badges ── */
function TypeBadge({ type }: { type: string }) {
  const m: Record<string, [string, string]> = { nouveau: ['rgba(239,68,68,0.12)', '#EF4444'], reinscrit: ['rgba(16,185,129,0.12)', '#10b981'], transfert: ['rgba(245,158,11,0.12)', '#f59e0b'] }
  const [bg, c] = m[type] ?? ['#f1f5f9', '#64748b']
  const l = { nouveau: 'Nouveau', reinscrit: 'Réinscrit', transfert: 'Transfert' }[type] ?? type
  return <span className="badge" style={{ background: bg, color: c }}>{l}</span>
}

/* ── Excel import helpers ── */
const CSV_HEADERS = ['nom','prenom','sexe','date_nais','lieu_nais','nationalite','email','tel','bac','mention','moyenne_bac','annee_bac','specialite','cycle','classe','annee_academique','type_inscription','montant_paye','frais_payes']
const CSV_SAMPLE  = ['NGOUANDA','Eden','M','2000-01-15','Brazzaville','Congolaise','eden@email.com','+242060000000','D','Bien','13.5','2018','Informatique','Licence','L1-INFO-2024','2024-2025','nouveau','50000','false']

function downloadTemplate() {
  const rows = [CSV_HEADERS.join(','), CSV_SAMPLE.join(',')]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'modele_inscriptions.csv'
  a.click()
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
}

/* ══════════════════════════════════════════
   MODAL: Nouvelle inscription
══════════════════════════════════════════ */
function NewInscModal({ open, classes, annees, specialites, etablissementId, onClose, onSuccess }:
  { open: boolean; classes: Classe[]; annees: Annee[]; specialites: Specialite[]; etablissementId: number | null; onClose: () => void; onSuccess: () => void }) {

  const anneeActive = annees.find(a => a.is_active)
  const blank = () => ({
    classe: '', annee: String(anneeActive?.id ?? ''), type_inscription: 'nouveau',
    nom: '', prenom: '', sexe: 'M', date_nais: '', lieu_nais: '', nationalite: '',
    email: '', tel: '', bac: '', mention: '', moyenne_bac: '', annee_bac: '',
    cycle: '', specialite: '', montant_paye: '', statut_paiement: false,
  })

  const [form, setForm]           = useState(blank())
  const [loading, setLoading]     = useState(false)
  const [err, setErr]             = useState<string | null>(null)
  const [done, setDone]           = useState(false)
  const [createdCode, setCreatedCode] = useState('')

  const classeOptions = form.specialite
    ? classes.filter(c => c.specialite === Number(form.specialite)).map(c => ({ value: String(c.id), label: `${c.libelle} (${c.niveau})` }))
    : classes.map(c => ({ value: String(c.id), label: `${c.libelle} (${c.niveau})` }))

  function s(k: string, v: string | boolean) {
    if (k === 'specialite') { setForm(f => ({ ...f, specialite: v as string, classe: '' })); return }
    setForm(f => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom || !form.prenom || !form.classe || !form.annee) { setErr('Nom, prénom, classe et année sont obligatoires.'); return }
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
      const msgs = Object.entries(err).map(([k, v]) => k === 'non_field_errors' ? String(v) : `${k}: ${v}`).join(' — ')
      setErr(msgs || 'Erreur lors de l\'enregistrement')
    } finally { setLoading(false) }
  }

  if (!open) return null
  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo-box">
        <div className="mo-head">
          <div className="mo-title">
            <div className="mo-title-icon" style={{ background: 'rgba(239,68,68,0.1)' }}><UserPlus size={16} color="#EF4444" /></div>
            Nouvelle inscription
          </div>
          <button className="mo-x" onClick={onClose}><X size={16} /></button>
        </div>

        {done ? (
          <div className="mo-body" style={{ alignItems: 'center', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem' }}>
              <CheckCircle2 size={30} color="#10b981" />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 .5rem' }}>Inscription réussie !</h2>
            <p style={{ fontSize: '.875rem', color: '#94a3b8', margin: '0 0 1rem' }}>L&apos;étudiant a été inscrit avec succès.</p>
            <div style={{ background: '#fef2f2', borderRadius: 10, padding: '.75rem 1.5rem', display: 'inline-block', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '.8rem', color: '#94a3b8' }}>Code étudiant : </span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800, color: '#EF4444' }}>{createdCode}</span>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={onClose}>Fermer</button>
              <button className="btn btn-primary" onClick={() => { setDone(false); setForm(blank()); onSuccess() }}>Nouvelle inscription</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="mo-body">
              {err && <div className="err"><AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{err}</div>}

              {/* 1. Classe & Inscription */}
              <div className="sec-title">Classe & Inscription</div>
              <div className="g2">
                <div className="fl">
                  <label>Classe <span className="req">*</span></label>
                  <SearchSelect value={form.classe} onChange={v => s('classe', v)}
                    options={classeOptions} placeholder="— sélectionner une classe —" />
                </div>
                <div className="fl">
                  <label>Année académique <span className="req">*</span></label>
                  <SearchSelect value={form.annee} onChange={v => s('annee', v)}
                    options={annees.map(a => ({ value: String(a.id), label: a.libelle + (a.is_active ? ' ✓' : '') }))} />
                </div>
              </div>
              <div className="g3">
                <div className="fl">
                  <label>Type</label>
                  <SearchSelect value={form.type_inscription} onChange={v => s('type_inscription', v)}
                    options={TYPES.map(t => ({ value: t.value, label: t.label }))} />
                </div>
                <div className="fl">
                  <label>Spécialité (filtre classe)</label>
                  <SearchSelect value={form.specialite} onChange={v => s('specialite', v)}
                    options={[{ value: '', label: '— toutes —' }, ...specialites.map(sp => ({ value: String(sp.id), label: sp.libelle }))]} />
                </div>
                <div className="fl">
                  <label>Cycle</label>
                  <SearchSelect value={form.cycle} onChange={v => s('cycle', v)}
                    options={[{ value: '', label: '— aucun —' }, ...CYCLES.map(c => ({ value: c, label: c }))]} />
                </div>
              </div>

              {/* 2. Identité */}
              <div className="sec-title">Identité</div>
              <div className="g2">
                <div className="fl"><label>Nom <span className="req">*</span></label><input type="text" value={form.nom} onChange={e => s('nom', e.target.value)} placeholder="DOE" required /></div>
                <div className="fl"><label>Prénom <span className="req">*</span></label><input type="text" value={form.prenom} onChange={e => s('prenom', e.target.value)} placeholder="John" required /></div>
              </div>
              <div className="g3">
                <div className="fl">
                  <label>Sexe</label>
                  <SearchSelect value={form.sexe} onChange={v => s('sexe', v)} options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]} />
                </div>
                <div className="fl"><label>Date de naissance</label><input type="date" value={form.date_nais} onChange={e => s('date_nais', e.target.value)} /></div>
                <div className="fl"><label>Nationalité</label><input type="text" value={form.nationalite} onChange={e => s('nationalite', e.target.value)} placeholder="Congolaise" /></div>
              </div>
              <div className="g2">
                <div className="fl"><label>Lieu de naissance</label><input type="text" value={form.lieu_nais} onChange={e => s('lieu_nais', e.target.value)} placeholder="Brazzaville" /></div>
                <div className="fl"><label>Téléphone</label><input type="tel" value={form.tel} onChange={e => s('tel', e.target.value)} placeholder="+242 06 000 0000" /></div>
              </div>
              <div className="fl"><label>Email</label><input type="email" value={form.email} onChange={e => s('email', e.target.value)} placeholder="email@exemple.com" /></div>

              {/* 3. Baccalauréat */}
              <div className="sec-title">Baccalauréat</div>
              <div className="g2">
                <div className="fl">
                  <label>Série</label>
                  <SearchSelect value={form.bac} onChange={v => s('bac', v)} options={[{ value: '', label: '— aucune —' }, ...SERIES_BAC.map(b => ({ value: b, label: b }))]} />
                </div>
                <div className="fl">
                  <label>Mention</label>
                  <SearchSelect value={form.mention} onChange={v => s('mention', v)} options={[{ value: '', label: '— aucune —' }, ...MENTIONS.map(m => ({ value: m, label: m }))]} />
                </div>
              </div>
              <div className="g2">
                <div className="fl"><label>Moyenne</label><input type="number" step="0.01" min="0" max="20" value={form.moyenne_bac} onChange={e => s('moyenne_bac', e.target.value)} placeholder="12.50" /></div>
                <div className="fl"><label>Année d&apos;obtention</label><input type="text" value={form.annee_bac} onChange={e => s('annee_bac', e.target.value)} placeholder="2024" maxLength={4} /></div>
              </div>

              {/* 4. Paiement */}
              <div className="sec-title">Paiement</div>
              <div className="g2">
                <div className="fl"><label>Montant payé (FCFA)</label><input type="number" min="0" value={form.montant_paye} onChange={e => s('montant_paye', e.target.value)} placeholder="0" /></div>
                <div className="fl" style={{ justifyContent: 'flex-end', paddingBottom: '.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', textTransform: 'none', fontSize: '.8125rem', color: '#475569' }}>
                    <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#EF4444', cursor: 'pointer' }} checked={form.statut_paiement} onChange={e => s('statut_paiement', e.target.checked)} />
                    Frais d&apos;inscription payés
                  </label>
                </div>
              </div>
            </div>

            <div className="mo-foot">
              <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Enregistrement…' : 'Inscrire l\'étudiant'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: Réinscription
══════════════════════════════════════════ */
function ReinscModal({ open, classes, annees, etablissementId, onClose, onSuccess }:
  { open: boolean; classes: Classe[]; annees: Annee[]; etablissementId: number | null; onClose: () => void; onSuccess: () => void }) {

  void etablissementId
  const anneeActive = annees.find(a => a.is_active)
  const [search, setSearch]   = useState('')
  const [etudiants, setEts]   = useState<Etudiant[]>([])
  const [selected, setSel]    = useState<Etudiant | null>(null)
  const [classe, setClasse]   = useState('')
  const [annee, setAnnee]     = useState(String(anneeActive?.id ?? ''))
  const [montant, setMontant] = useState('')
  const [paye, setPaye]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [searching, setSrch]  = useState(false)
  const [err, setErr]         = useState<string | null>(null)
  const [done, setDone]       = useState(false)

  async function doSearch() {
    if (!search.trim()) return
    setSrch(true)
    try { const d = await apiFetch<ApiList<Etudiant>>(`/etudiants/?search=${encodeURIComponent(search)}&limit=10`); setEts(d.results) }
    finally { setSrch(false) }
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

  if (!open) return null
  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo-box mo-box-sm">
        <div className="mo-head">
          <div className="mo-title">
            <div className="mo-title-icon" style={{ background: '#f0fdf4' }}><RefreshCw size={15} color="#10b981" /></div>
            Réinscription
          </div>
          <button className="mo-x" onClick={onClose}><X size={16} /></button>
        </div>

        {done ? (
          <div className="mo-body" style={{ alignItems: 'center', textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem' }}>
              <CheckCircle2 size={28} color="#10b981" />
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 .375rem' }}>Réinscription réussie !</h2>
            <p style={{ fontSize: '.875rem', color: '#94a3b8', margin: '0 0 1rem' }}>{selected?.nom} {selected?.prenom} a été réinscrit.</p>
            <button className="btn btn-outline" onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="mo-body">
              {err && <div className="err"><AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{err}</div>}

              <div className="sec-title">Rechercher l&apos;étudiant</div>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <input type="text" style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 9, padding: '.55rem .75rem', fontSize: '.875rem', color: '#334155', outline: 'none' }}
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Nom, prénom ou code…"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), doSearch())} />
                <button type="button" className="btn btn-secondary" onClick={doSearch} disabled={searching}>{searching ? '…' : 'Rechercher'}</button>
              </div>

              {etudiants.length > 0 && !selected && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  {etudiants.map((et, i) => (
                    <div key={et.id} className="reinsc-result"
                      style={{ borderBottom: i < etudiants.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                      onClick={() => { setSel(et); setEts([]) }}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '.875rem' }}>{et.nom} {et.prenom}</span>
                        <span style={{ marginLeft: '.5rem', fontFamily: 'monospace', fontSize: '.75rem', color: '#94a3b8' }}>{et.code}</span>
                      </div>
                      <span style={{ fontSize: '.75rem', color: '#94a3b8' }}>{et.specialite_libelle ?? '—'}</span>
                    </div>
                  ))}
                </div>
              )}

              {selected && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef2f2', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '.75rem 1rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{selected.nom} {selected.prenom}</span>
                    <span style={{ marginLeft: '.5rem', fontFamily: 'monospace', fontWeight: 700, color: '#EF4444', fontSize: '.875rem' }}>{selected.code}</span>
                  </div>
                  <button type="button" onClick={() => { setSel(null); setEts([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                    <XCircle size={16} />
                  </button>
                </div>
              )}

              <div className="sec-title">Nouvelle classe</div>
              <div className="g2">
                <div className="fl">
                  <label>Classe <span className="req">*</span></label>
                  <SearchSelect value={classe} onChange={setClasse}
                    options={classes.map(c => ({ value: String(c.id), label: `${c.libelle} (${c.niveau})` }))} />
                </div>
                <div className="fl">
                  <label>Année <span className="req">*</span></label>
                  <SearchSelect value={annee} onChange={setAnnee}
                    options={annees.map(a => ({ value: String(a.id), label: a.libelle + (a.is_active ? ' ✓' : '') }))} />
                </div>
              </div>
              <div className="g2">
                <div className="fl"><label>Montant payé (FCFA)</label>
                  <input type="number" min="0" style={{ border: '1px solid #e2e8f0', borderRadius: 9, padding: '.55rem .75rem', fontSize: '.875rem', outline: 'none', width: '100%' }} value={montant} onChange={e => setMontant(e.target.value)} placeholder="0" />
                </div>
                <div className="fl" style={{ justifyContent: 'flex-end', paddingBottom: '.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer', fontSize: '.8125rem', color: '#475569' }}>
                    <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#10b981' }} checked={paye} onChange={e => setPaye(e.target.checked)} />
                    Frais payés
                  </label>
                </div>
              </div>
            </div>
            <div className="mo-foot">
              <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn btn-green" disabled={loading || !selected}>{loading ? 'Enregistrement…' : 'Réinscrire'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MODAL: Import Excel
══════════════════════════════════════════ */
function ImportModal({ open, classes, annees, specialites, etablissementId, onClose, onSuccess }:
  { open: boolean; classes: Classe[]; annees: Annee[]; specialites: Specialite[]; etablissementId: number | null; onClose: () => void; onSuccess: () => void }) {

  const [rows, setRows]       = useState<Record<string, string>[]>([])
  const [errors, setErrors]   = useState<string[]>([])
  const [progress, setProg]   = useState(0)
  const [importing, setImport] = useState(false)
  const [done, setDone]       = useState(false)
  const [drag, setDrag]       = useState(false)
  const [fileName, setFileName] = useState('')
  const fileRef               = useRef<HTMLInputElement>(null)

  function parseFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed); setFileName(file.name); setErrors([]); setDone(false); setProg(0)
    }
    reader.readAsText(file, 'utf-8')
  }

  function onFileDrop(e: React.DragEvent) {
    e.preventDefault(); setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  async function runImport() {
    setImport(true); setErrors([]); setProg(0)
    const errs: string[] = []
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const classe = classes.find(c => c.libelle.toLowerCase() === (r.classe ?? '').toLowerCase())
      const annee  = annees.find(a => a.libelle === r.annee_academique)
      const spec   = specialites.find(sp => sp.libelle.toLowerCase() === (r.specialite ?? '').toLowerCase())

      if (!r.nom || !r.prenom) { errs.push(`Ligne ${i + 2}: nom et prénom obligatoires`); continue }
      if (!classe) { errs.push(`Ligne ${i + 2}: classe "${r.classe}" introuvable`); continue }
      if (!annee)  { errs.push(`Ligne ${i + 2}: année "${r.annee_academique}" introuvable`); continue }

      try {
        await apiFetch('/inscriptions/create/', { method: 'POST', body: JSON.stringify({
          nom: r.nom, prenom: r.prenom, sexe: r.sexe || 'M',
          date_nais: r.date_nais || null, lieu_nais: r.lieu_nais || '', nationalite: r.nationalite || '',
          email: r.email || '', tel: r.tel || '',
          bac: r.bac || undefined, mention: r.mention || undefined, cycle: r.cycle || undefined,
          moyenne_bac: r.moyenne_bac ? Number(r.moyenne_bac) : undefined,
          annee_bac: r.annee_bac || undefined,
          specialite: spec?.id ?? undefined,
          classe: classe.id, annee: annee.id, etablissement: etablissementId,
          type_inscription: r.type_inscription || 'nouveau',
          statut_paiement: r.frais_payes === 'true',
          montant_paye: r.montant_paye ? Number(r.montant_paye) : 0,
        }) })
      } catch (e: unknown) {
        const err = e as Record<string, unknown>
        errs.push(`Ligne ${i + 2}: ${Object.values(err).flat().join(', ')}`)
      }
      setProg(Math.round(((i + 1) / rows.length) * 100))
    }
    setErrors(errs); setImport(false); setDone(true)
    if (errs.length < rows.length) onSuccess()
  }

  if (!open) return null
  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo-box">
        <div className="mo-head">
          <div className="mo-title">
            <div className="mo-title-icon" style={{ background: 'rgba(16,185,129,0.1)' }}><FileSpreadsheet size={16} color="#10b981" /></div>
            Import Excel / CSV
          </div>
          <button className="mo-x" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="mo-body">
          {/* template */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 10, padding: '.75rem 1rem' }}>
            <div>
              <div style={{ fontSize: '.875rem', fontWeight: 600, color: '#0f172a' }}>Modèle CSV</div>
              <div style={{ fontSize: '.75rem', color: '#94a3b8', marginTop: 2 }}>Téléchargez et remplissez ce modèle avant d&apos;importer</div>
            </div>
            <button className="btn btn-outline" style={{ gap: '.375rem' }} onClick={downloadTemplate}>
              <Download size={13} /> Télécharger
            </button>
          </div>

          {/* drop zone */}
          <div
            className={`import-zone${drag ? ' drag' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={onFileDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f) }} />
            <Upload size={24} color="#94a3b8" style={{ margin: '0 auto .5rem', display: 'block' }} />
            <div style={{ fontSize: '.875rem', fontWeight: 600, color: '#475569' }}>
              {fileName || 'Glissez un fichier CSV ici ou cliquez pour parcourir'}
            </div>
            <div style={{ fontSize: '.75rem', color: '#94a3b8', marginTop: 4 }}>CSV, XLS, XLSX acceptés</div>
          </div>

          {/* preview */}
          {rows.length > 0 && (
            <div>
              <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#475569', marginBottom: '.5rem' }}>
                {rows.length} ligne{rows.length > 1 ? 's' : ''} détectée{rows.length > 1 ? 's' : ''} — aperçu (5 premières)
              </div>
              {rows.slice(0, 5).map((r, i) => (
                <div key={i} className="import-row">
                  <span className="idx">{i + 1}</span>
                  <span style={{ fontWeight: 600, color: '#0f172a', minWidth: 80 }}>{r.nom} {r.prenom}</span>
                  <span style={{ color: '#94a3b8' }}>{r.classe || '—'}</span>
                  <span style={{ color: '#94a3b8', marginLeft: 'auto' }}>{r.annee_academique || '—'}</span>
                </div>
              ))}
              {rows.length > 5 && <div style={{ fontSize: '.75rem', color: '#94a3b8', paddingTop: '.25rem' }}>…et {rows.length - 5} autres lignes</div>}
            </div>
          )}

          {/* progress */}
          {importing && (
            <div>
              <div style={{ fontSize: '.8rem', color: '#475569', marginBottom: '.375rem' }}>Importation en cours… {progress}%</div>
              <div className="import-progress"><div className="import-progress-bar" style={{ width: `${progress}%` }} /></div>
            </div>
          )}

          {/* result */}
          {done && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                {errors.length === 0
                  ? <><CheckCircle size={15} color="#10b981" /><span style={{ fontSize: '.875rem', fontWeight: 600, color: '#10b981' }}>{rows.length} inscriptions importées avec succès</span></>
                  : <><AlertCircle size={15} color="#f59e0b" /><span style={{ fontSize: '.875rem', fontWeight: 600, color: '#f59e0b' }}>{rows.length - errors.length}/{rows.length} réussies</span></>
                }
              </div>
              {errors.map((e, i) => (
                <div key={i} className="import-row err-row">
                  <AlertCircle size={12} color="#EF4444" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '.75rem', color: '#dc2626' }}>{e}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mo-foot">
          <button className="btn btn-outline" onClick={onClose}>Fermer</button>
          {rows.length > 0 && !done && (
            <button className="btn btn-green" onClick={runImport} disabled={importing}>
              <Upload size={13} /> {importing ? 'Importation…' : `Importer ${rows.length} lignes`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════ */
export default function InscriptionsPage() {
  const [tab, setTab]               = useState<'liste' | 'etudiants'>('liste')
  const [inscriptions, setInsc]     = useState<Inscription[]>([])
  const [etudiants, setEtds]        = useState<Etudiant[]>([])
  const [classes, setClasses]       = useState<Classe[]>([])
  const [annees, setAnnees]         = useState<Annee[]>([])
  const [specialites, setSpecs]     = useState<Specialite[]>([])
  const [count, setCount]           = useState(0)
  const [etudCount, setEtudCount]   = useState(0)
  const [offset, setOffset]         = useState(0)
  const [etudOffset, setEtudOffset] = useState(0)
  const [search, setSearch]         = useState('')
  const [etudSearch, setEtudSearch] = useState('')
  const [filterAnnee, setFA]        = useState('')
  const [filterClasse, setFC]       = useState('')
  const [filterType, setFT]         = useState('')
  const [filterStatut, setFS]       = useState('')
  const [filterNiveau, setFN]       = useState('')
  const [loadingInsc, setLI]        = useState(false)
  const [loadingEtud, setLE]        = useState(false)
  const [showNew, setShowNew]       = useState(false)
  const [showReinsc, setShowRe]     = useState(false)
  const [showImport, setShowIm]     = useState(false)
  const [etablissementId, setEtab]  = useState<number | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('dc_user')
    if (raw) { const u = JSON.parse(raw); setEtab(u.etablissement ?? null) }
    apiFetch<ApiList<Classe>>('/classes/?limit=200').then(d => setClasses(d.results)).catch(() => {})
    apiFetch<ApiList<Annee>>('/annees/?limit=50').then(d => {
      setAnnees(d.results)
      const act = d.results.find(a => a.is_active)
      if (act) setFA(String(act.id))
    }).catch(() => {})
    apiFetch<ApiList<Specialite>>('/specialites/?limit=200').then(d => setSpecs(d.results)).catch(() => {})
  }, [])

  const fetchInsc = useCallback(async (off: number) => {
    setLI(true)
    try {
      const p = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(off) })
      if (search)       p.set('search', search)
      if (filterAnnee)  p.set('annee', filterAnnee)
      if (filterClasse) p.set('classe', filterClasse)
      if (filterType)   p.set('type', filterType)
      const d = await apiFetch<ApiList<Inscription>>(`/inscriptions/?${p}`)
      setInsc(d.results); setCount(d.count)
    } finally { setLI(false) }
  }, [search, filterAnnee, filterClasse, filterType])

  const fetchEtud = useCallback(async (off: number) => {
    setLE(true)
    try {
      const p = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(off) })
      if (etudSearch)  p.set('search', etudSearch)
      if (filterStatut) p.set('statut', filterStatut)
      if (filterNiveau) p.set('niveau', filterNiveau)
      const d = await apiFetch<ApiList<Etudiant>>(`/etudiants/?${p}`)
      setEtds(d.results); setEtudCount(d.count)
    } finally { setLE(false) }
  }, [etudSearch, filterStatut, filterNiveau])

  useEffect(() => { setOffset(0); fetchInsc(0) }, [fetchInsc])
  useEffect(() => { setEtudOffset(0); fetchEtud(0) }, [fetchEtud])

  const totalIP = Math.ceil(count / PAGE_SIZE)
  const curIP   = Math.floor(offset / PAGE_SIZE) + 1
  const totalEP = Math.ceil(etudCount / PAGE_SIZE)
  const curEP   = Math.floor(etudOffset / PAGE_SIZE) + 1

  return (
    <div className="insc-wrap">
      {ST}

      <div className="pg-hdr">
        <div>
          <h1 className="pg-title">Inscriptions</h1>
          <p className="pg-sub">Gestion des inscriptions et des étudiants</p>
        </div>
        <div className="hdr-btns">
          <button className="btn btn-outline" onClick={downloadTemplate}><Download size={13} /> Modèle CSV</button>
          <button className="btn btn-secondary" onClick={() => setShowIm(true)}><FileSpreadsheet size={13} /> Importer Excel</button>
          <button className="btn btn-secondary" onClick={() => setShowRe(true)}><RefreshCw size={13} /> Réinscription</button>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={13} /> Nouvelle inscription</button>
        </div>
      </div>

      <div className="tabs">
        {([
          { id: 'liste' as const,     label: `Inscriptions (${count})` },
          { id: 'etudiants' as const, label: `Étudiants (${etudCount})` },
        ] as {id:'liste'|'etudiants'; label:string}[]).map(t => (
          <button key={t.id} className={cn('tab', tab === t.id && 'active')} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── TAB: Inscriptions ── */}
      {tab === 'liste' && (
        <>
          <div className="toolbar">
            <div className="toolbar-search">
              <Search size={13} color="#94a3b8" />
              <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="toolbar-sel" value={filterAnnee} onChange={e => setFA(e.target.value)}>
              <option value="">Toutes les années</option>
              {annees.map(a => <option key={a.id} value={a.id}>{a.libelle}</option>)}
            </select>
            <select className="toolbar-sel" value={filterClasse} onChange={e => setFC(e.target.value)}>
              <option value="">Toutes les classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
            </select>
            <select className="toolbar-sel" value={filterType} onChange={e => setFT(e.target.value)}>
              <option value="">Tous types</option>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="sc-card">
            <div style={{ overflowX: 'auto' }}>
              <table className="sc-table">
                <thead>
                  <tr>
                    <th>Code</th><th>Étudiant</th><th>Classe</th><th>Année</th><th>Type</th><th>Paiement</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingInsc ? (
                    <tr><td colSpan={7} className="sc-empty">Chargement…</td></tr>
                  ) : inscriptions.length === 0 ? (
                    <tr><td colSpan={7} className="sc-empty">Aucune inscription trouvée.</td></tr>
                  ) : inscriptions.map(i => (
                    <tr key={i.id}>
                      <td><span className="sc-mono">{i.etudiant_code}</span></td>
                      <td><div className="sc-primary">{i.etudiant_nom}</div><div className="sc-sub">{i.etudiant_sexe === 'M' ? 'Homme' : 'Femme'}</div></td>
                      <td><div style={{ fontWeight: 500, color: '#0f172a' }}>{i.classe_libelle}</div><div className="sc-sub">{i.classe_niveau}</div></td>
                      <td style={{ color: '#64748b', fontSize: '.8rem' }}>{i.annee_libelle}</td>
                      <td><TypeBadge type={i.type_inscription} /></td>
                      <td>
                        {i.statut_paiement
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#10b981', fontWeight: 600, fontSize: '.8rem' }}><CheckCircle size={13} /> Payé</span>
                          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 600, fontSize: '.8rem' }}><XCircle size={13} /> En attente</span>
                        }
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '.75rem' }}>{new Date(i.date_inscription).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pg-foot">
              <span className="pg-count">{count === 0 ? '0 résultat' : `${offset + 1}–${Math.min(offset + PAGE_SIZE, count)} sur ${count}`}</span>
              <div className="pg-btns">
                <button className="pg-btn" disabled={curIP <= 1} onClick={() => { const n = offset - PAGE_SIZE; setOffset(n); fetchInsc(n) }}><ChevronLeft size={14} /></button>
                <button className="pg-btn" disabled={curIP >= totalIP} onClick={() => { const n = offset + PAGE_SIZE; setOffset(n); fetchInsc(n) }}><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TAB: Étudiants ── */}
      {tab === 'etudiants' && (
        <>
          <div className="toolbar">
            <div className="toolbar-search">
              <Search size={13} color="#94a3b8" />
              <input placeholder="Nom, code…" value={etudSearch} onChange={e => setEtudSearch(e.target.value)} />
            </div>
            <select className="toolbar-sel" value={filterStatut} onChange={e => setFS(e.target.value)}>
              <option value="">Tous statuts</option>
              <option value="inscrit">Inscrit</option>
              <option value="en cours">En cours</option>
              <option value="admis">Admis</option>
              <option value="refusé">Refusé</option>
            </select>
            <select className="toolbar-sel" value={filterNiveau} onChange={e => setFN(e.target.value)}>
              <option value="">Tous niveaux</option>
              {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="sc-card">
            <div style={{ overflowX: 'auto' }}>
              <table className="sc-table">
                <thead>
                  <tr>
                    <th>Code</th><th>Nom complet</th><th>Sexe</th><th>Spécialité</th><th>Statut</th><th>Contact</th><th>Candidature</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingEtud ? (
                    <tr><td colSpan={7} className="sc-empty">Chargement…</td></tr>
                  ) : etudiants.length === 0 ? (
                    <tr><td colSpan={7} className="sc-empty">Aucun étudiant trouvé.</td></tr>
                  ) : etudiants.map(et => (
                    <tr key={et.id}>
                      <td><span className="sc-mono">{et.code}</span></td>
                      <td className="sc-primary">{et.nom} {et.prenom}</td>
                      <td style={{ color: '#64748b' }}>{et.sexe === 'M' ? 'H' : 'F'}</td>
                      <td style={{ color: '#64748b' }}>{et.specialite_libelle ?? '—'}</td>
                      <td>
                        {(() => {
                          const m: Record<string, [string, string]> = { inscrit: ['rgba(16,185,129,0.12)', '#10b981'], 'en cours': ['rgba(245,158,11,0.12)', '#f59e0b'], admis: ['rgba(239,68,68,0.12)', '#EF4444'], 'refusé': ['rgba(239,68,68,0.12)', '#ef4444'] }
                          const [bg, c] = m[et.statut] ?? ['#f1f5f9', '#64748b']
                          const labels: Record<string, string> = { inscrit: 'Inscrit', 'en cours': 'En cours', admis: 'Admis', 'refusé': 'Refusé' }
                          return <span className="badge" style={{ background: bg, color: c }}>{labels[et.statut] ?? et.statut}</span>
                        })()}
                      </td>
                      <td style={{ color: '#64748b', fontSize: '.75rem' }}>{et.email || et.tel || '—'}</td>
                      <td style={{ color: '#94a3b8', fontSize: '.75rem' }}>{et.date_candidature ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pg-foot">
              <span className="pg-count">{etudCount === 0 ? '0 résultat' : `${etudOffset + 1}–${Math.min(etudOffset + PAGE_SIZE, etudCount)} sur ${etudCount}`}</span>
              <div className="pg-btns">
                <button className="pg-btn" disabled={curEP <= 1} onClick={() => { const n = etudOffset - PAGE_SIZE; setEtudOffset(n); fetchEtud(n) }}><ChevronLeft size={14} /></button>
                <button className="pg-btn" disabled={curEP >= totalEP} onClick={() => { const n = etudOffset + PAGE_SIZE; setEtudOffset(n); fetchEtud(n) }}><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        </>
      )}

      <NewInscModal open={showNew} classes={classes} annees={annees} specialites={specialites}
        etablissementId={etablissementId} onClose={() => setShowNew(false)} onSuccess={() => fetchInsc(0)} />
      <ReinscModal open={showReinsc} classes={classes} annees={annees}
        etablissementId={etablissementId} onClose={() => setShowRe(false)} onSuccess={() => fetchInsc(0)} />
      <ImportModal open={showImport} classes={classes} annees={annees} specialites={specialites}
        etablissementId={etablissementId} onClose={() => setShowIm(false)} onSuccess={() => fetchInsc(0)} />
    </div>
  )
}
