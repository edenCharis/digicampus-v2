'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Users, UserCheck, Clock, Plus, Search, X, AlertCircle,
  ChevronLeft, ChevronRight, Edit2, Trash2,
  CalendarDays, Building2,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

/* ── Types ── */
interface Departement { id: number; code: string; nom: string; description: string; nb_agents: number; etablissement: number }
interface Agent {
  id: number; nom: string; prenom: string; nom_complet: string; sexe: string
  email: string; tel: string; poste: string
  type_contrat: string; contrat_display: string
  departement: number | null; departement_nom: string | null
  date_embauche: string | null; salaire: string | null
  statut: string; statut_display: string; etablissement: number
}
interface Conge {
  id: number; agent: number; agent_nom: string; agent_poste: string
  type_conge: string; type_display: string
  date_debut: string; date_fin: string; nb_jours: number
  motif: string; statut: string; statut_display: string
}
interface Stats { total: number; actifs: number; en_conge: number; departements: number; conges_en_attente: number }
interface ApiList<T> { count: number; results: T[] }

const CONTRATS  = ['cdi','cdd','vacataire','stage','benevole']
const CONTRAT_L: Record<string,string> = { cdi:'CDI', cdd:'CDD', vacataire:'Vacataire', stage:'Stage', benevole:'Bénévole' }
const STATUTS_A = ['actif','conge','suspendu','quitte']
const STATUT_LA: Record<string,string> = { actif:'Actif', conge:'En congé', suspendu:'Suspendu', quitte:'A quitté' }
const TYPES_C   = ['annuel','maladie','maternite','paternite','sans_solde','autre']
const TYPE_CL: Record<string,string> = { annuel:'Congé annuel', maladie:'Maladie', maternite:'Maternité', paternite:'Paternité', sans_solde:'Sans solde', autre:'Autre' }
const STATUTS_C = ['en_attente','approuve','refuse']
const STATUT_LC: Record<string,string> = { en_attente:'En attente', approuve:'Approuvé', refuse:'Refusé' }

const STATUT_COLOR: Record<string,{bg:string;color:string}> = {
  actif:     { bg:'#f0fdf4', color:'#10b981' },
  conge:     { bg:'#fef9c3', color:'#ca8a04' },
  suspendu:  { bg:'#fef2f2', color:'#ef4444' },
  quitte:    { bg:'#f1f5f9', color:'#94a3b8' },
  en_attente:{ bg:'#fef9c3', color:'#ca8a04' },
  approuve:  { bg:'#f0fdf4', color:'#10b981' },
  refuse:    { bg:'#fef2f2', color:'#ef4444' },
}

const PAGE_SIZE = 20

/* ── Inline styles ── */
const ST = (
  <style>{`
    .rh { max-width:1100px; margin:0 auto; }
    .pg-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
    .pg-title { font-size:1.25rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
    .pg-sub { font-size:.8rem; color:#94a3b8; margin:.2rem 0 0; }

    .kpi-row { display:grid; grid-template-columns:repeat(5,1fr); gap:.875rem; margin-bottom:1.5rem; }
    @media(max-width:800px){ .kpi-row { grid-template-columns:repeat(3,1fr); } }
    @media(max-width:500px){ .kpi-row { grid-template-columns:repeat(2,1fr); } }
    .kpi { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:1rem 1.25rem; }
    .kpi-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; margin-bottom:.625rem; }
    .kpi-val { font-size:1.625rem; font-weight:800; color:#0f172a; letter-spacing:-.03em; line-height:1; }
    .kpi-label { font-size:.72rem; color:#94a3b8; font-weight:500; margin-top:.25rem; }

    .tabs { display:flex; border-bottom:2px solid #f1f5f9; margin-bottom:1.25rem; gap:.25rem; }
    .tab { padding:.6rem 1.1rem; font-size:.875rem; font-weight:500; border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-2px; color:#94a3b8; transition:all .15s; }
    .tab.active { border-bottom-color:#ec4899; color:#ec4899; font-weight:700; }

    .toolbar { display:flex; gap:.625rem; flex-wrap:wrap; margin-bottom:1rem; align-items:center; }
    .search-box { display:flex; align-items:center; gap:.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:9px; padding:.45rem .75rem; flex:1; min-width:180px; max-width:280px; }
    .search-box input { background:none; border:none; outline:none; font-size:.8125rem; color:#334155; width:100%; }
    .search-box input::placeholder { color:#94a3b8; }
    .sel { background:#fff; border:1px solid #e2e8f0; border-radius:9px; padding:.45rem .75rem; font-size:.8125rem; color:#475569; cursor:pointer; outline:none; }

    .card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; }
    .tbl { width:100%; border-collapse:collapse; }
    .tbl th { padding:.7rem 1rem; text-align:left; font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid #f1f5f9; background:#fafafa; white-space:nowrap; }
    .tbl td { padding:.75rem 1rem; font-size:.8125rem; color:#475569; border-bottom:1px solid #f8fafc; vertical-align:middle; }
    .tbl tr:last-child td { border-bottom:none; }
    .tbl tr:hover td { background:#fafafa; }
    .tbl-name { font-weight:600; color:#0f172a; }
    .tbl-sub { font-size:.73rem; color:#94a3b8; margin-top:1px; }
    .empty { padding:3rem 1rem; text-align:center; color:#94a3b8; font-size:.875rem; }

    .badge { display:inline-flex; align-items:center; padding:.2rem .6rem; border-radius:99px; font-size:.7rem; font-weight:700; white-space:nowrap; }

    .pg-foot { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1rem; border-top:1px solid #f1f5f9; }
    .pg-count { font-size:.75rem; color:#94a3b8; }
    .pg-btns { display:flex; gap:.25rem; }
    .pg-btn { padding:.35rem .5rem; border:1px solid #e2e8f0; border-radius:7px; background:#fff; cursor:pointer; color:#64748b; display:flex; align-items:center; }
    .pg-btn:disabled { opacity:.4; cursor:not-allowed; }

    .btn { display:inline-flex; align-items:center; gap:.375rem; border:none; border-radius:9px; padding:.5rem 1rem; font-size:.8125rem; font-weight:600; cursor:pointer; transition:all .15s; white-space:nowrap; }
    .btn-pink { background:#ec4899; color:#fff; }
    .btn-pink:hover { background:#db2777; }
    .btn-outline { background:#fff; border:1px solid #e2e8f0; color:#475569; }
    .btn-outline:hover { background:#f8fafc; }
    .btn-sm { padding:.35rem .75rem; font-size:.75rem; }
    .btn-icon { padding:.35rem; border-radius:7px; background:none; border:none; cursor:pointer; color:#94a3b8; transition:all .15s; }
    .btn-icon:hover { background:#f1f5f9; color:#475569; }
    .btn-icon.del:hover { background:#fef2f2; color:#ef4444; }

    /* modal */
    .mo { position:fixed; inset:0; background:rgba(15,23,42,.45); display:flex; align-items:center; justify-content:center; z-index:50; padding:1rem; }
    .mo-box { background:#fff; border-radius:18px; width:100%; max-width:560px; max-height:90vh; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,.18); }
    .mo-head { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f1f5f9; flex-shrink:0; }
    .mo-title { display:flex; align-items:center; gap:.625rem; font-size:1rem; font-weight:700; color:#0f172a; }
    .mo-x { background:none; border:none; cursor:pointer; color:#94a3b8; padding:.25rem; border-radius:6px; }
    .mo-x:hover { background:#f1f5f9; color:#475569; }
    .mo-body { padding:1.5rem; overflow-y:auto; display:flex; flex-direction:column; gap:1rem; }
    .mo-foot { padding:1rem 1.5rem; border-top:1px solid #f1f5f9; display:flex; gap:.625rem; justify-content:flex-end; flex-shrink:0; }

    .fl { display:flex; flex-direction:column; gap:.375rem; }
    .fl label { font-size:.75rem; font-weight:600; color:#475569; text-transform:uppercase; letter-spacing:.04em; }
    .fl input, .fl select, .fl textarea { border:1px solid #e2e8f0; border-radius:9px; padding:.55rem .75rem; font-size:.875rem; color:#334155; outline:none; background:#fff; font-family:inherit; }
    .fl input:focus, .fl select:focus, .fl textarea:focus { border-color:#ec4899; box-shadow:0 0 0 3px rgba(236,72,153,.1); }
    .fl textarea { resize:vertical; min-height:70px; }
    .g2 { display:grid; grid-template-columns:1fr 1fr; gap:.875rem; }
    .g3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:.875rem; }

    .err-banner { background:#fff1f2; border:1px solid #fecaca; border-radius:10px; padding:.75rem 1rem; display:flex; gap:.5rem; align-items:flex-start; }
  `}</style>
)

/* ── Helpers ── */
function extractApiError(e: unknown): string {
  if (!e || typeof e !== 'object') return 'Erreur inconnue'
  const r = e as Record<string, unknown>
  if (r.detail) return String(r.detail)
  const parts = Object.entries(r).map(([k, v]) => {
    const msg = Array.isArray(v) ? v.flat().join(', ') : String(v)
    return k === 'non_field_errors' ? msg : `${k} : ${msg}`
  })
  return parts.join('\n') || 'Erreur lors de l\'enregistrement'
}

function Badge({ val, map }: { val: string; map: Record<string, { bg: string; color: string }> }) {
  const s = map[val] ?? { bg: '#f1f5f9', color: '#64748b' }
  return <span className="badge" style={{ background: s.bg, color: s.color }}>{STATUT_LA[val] ?? STATUT_LC[val] ?? val}</span>
}

/* ═══════════════════════════════════════════════════════
   MODAL AGENT
═══════════════════════════════════════════════════════ */
function AgentModal({ open, agent, departements, etablissementId, onClose, onSaved }:
  { open: boolean; agent: Agent | null; departements: Departement[]; etablissementId: number | null; onClose: () => void; onSaved: () => void }) {

  const blank = () => ({ nom:'', prenom:'', sexe:'M', email:'', tel:'', poste:'', type_contrat:'cdi', departement:'', date_embauche:'', salaire:'', statut:'actif' })
  const [form, setForm] = useState(blank())
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (agent) {
      setForm({
        nom: agent.nom, prenom: agent.prenom, sexe: agent.sexe,
        email: agent.email, tel: agent.tel, poste: agent.poste,
        type_contrat: agent.type_contrat,
        departement: agent.departement ? String(agent.departement) : '',
        date_embauche: agent.date_embauche ?? '',
        salaire: agent.salaire ?? '', statut: agent.statut,
      })
    } else {
      setForm(blank())
    }
    setErr(null)
  }, [agent, open])

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null)
    const payload: Record<string, unknown> = {
      nom: form.nom, prenom: form.prenom, sexe: form.sexe,
      email: form.email, tel: form.tel, poste: form.poste,
      type_contrat: form.type_contrat, statut: form.statut,
    }
    if (form.departement) payload.departement = Number(form.departement)
    if (form.date_embauche) payload.date_embauche = form.date_embauche
    if (form.salaire) payload.salaire = Number(form.salaire)
    if (!agent && etablissementId) payload.etablissement = etablissementId
    try {
      if (agent) {
        await apiFetch(`/personnel/agents/${agent.id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/personnel/agents/', { method: 'POST', body: JSON.stringify(payload) })
      }
      onSaved(); onClose()
    } catch (ex) {
      setErr(extractApiError(ex))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo-box">
        <div className="mo-head">
          <div className="mo-title">
            <div style={{ width:32, height:32, borderRadius:9, background:'rgba(236,72,153,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Users size={15} color="#ec4899" />
            </div>
            {agent ? 'Modifier l\'agent' : 'Nouvel agent'}
          </div>
          <button className="mo-x" onClick={onClose}><X size={16} /></button>
        </div>
        {err && (
          <div style={{ padding:'0 1.5rem', paddingTop:'1rem' }}>
            <div className="err-banner">
              <AlertCircle size={15} color="#dc2626" style={{ flexShrink:0, marginTop:1 }} />
              <div style={{ fontSize:'.8rem', color:'#b91c1c' }}>{err}</div>
            </div>
          </div>
        )}
        <form onSubmit={submit}>
          <div className="mo-body">
            <div className="g2">
              <div className="fl"><label>Nom *</label><input required value={form.nom} onChange={e => s('nom', e.target.value)} placeholder="Nom" /></div>
              <div className="fl"><label>Prénom *</label><input required value={form.prenom} onChange={e => s('prenom', e.target.value)} placeholder="Prénom" /></div>
            </div>
            <div className="g3">
              <div className="fl"><label>Sexe</label>
                <select value={form.sexe} onChange={e => s('sexe', e.target.value)}>
                  <option value="M">Masculin</option><option value="F">Féminin</option>
                </select>
              </div>
              <div className="fl"><label>Tél</label><input value={form.tel} onChange={e => s('tel', e.target.value)} placeholder="+242..." /></div>
              <div className="fl"><label>Email</label><input type="email" value={form.email} onChange={e => s('email', e.target.value)} placeholder="email@..." /></div>
            </div>
            <div className="g2">
              <div className="fl"><label>Poste *</label><input required value={form.poste} onChange={e => s('poste', e.target.value)} placeholder="Ex: Comptable" /></div>
              <div className="fl"><label>Département</label>
                <select value={form.departement} onChange={e => s('departement', e.target.value)}>
                  <option value="">— Aucun —</option>
                  {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                </select>
              </div>
            </div>
            <div className="g3">
              <div className="fl"><label>Contrat</label>
                <select value={form.type_contrat} onChange={e => s('type_contrat', e.target.value)}>
                  {CONTRATS.map(c => <option key={c} value={c}>{CONTRAT_L[c]}</option>)}
                </select>
              </div>
              <div className="fl"><label>Date d&apos;embauche</label><input type="date" value={form.date_embauche} onChange={e => s('date_embauche', e.target.value)} /></div>
              <div className="fl"><label>Salaire (FCFA)</label><input type="number" min="0" value={form.salaire} onChange={e => s('salaire', e.target.value)} placeholder="0" /></div>
            </div>
            <div className="fl"><label>Statut</label>
              <select value={form.statut} onChange={e => s('statut', e.target.value)}>
                {STATUTS_A.map(s2 => <option key={s2} value={s2}>{STATUT_LA[s2]}</option>)}
              </select>
            </div>
          </div>
          <div className="mo-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-pink" disabled={loading}>{loading ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MODAL DÉPARTEMENT
═══════════════════════════════════════════════════════ */
function DepModal({ open, dep, etablissementId, onClose, onSaved }:
  { open: boolean; dep: Departement | null; etablissementId: number | null; onClose: () => void; onSaved: () => void }) {

  const blank = () => ({ code:'', nom:'', description:'' })
  const [form, setForm] = useState(blank())
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setForm(dep ? { code: dep.code, nom: dep.nom, description: dep.description } : blank())
    setErr(null)
  }, [dep, open])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null)
    const payload: Record<string, unknown> = { ...form }
    if (!dep && etablissementId) payload.etablissement = etablissementId
    try {
      if (dep) {
        await apiFetch(`/personnel/departements/${dep.id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/personnel/departements/', { method: 'POST', body: JSON.stringify(payload) })
      }
      onSaved(); onClose()
    } catch (ex) {
      setErr(extractApiError(ex))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo-box" style={{ maxWidth:420 }}>
        <div className="mo-head">
          <div className="mo-title">
            <div style={{ width:32, height:32, borderRadius:9, background:'rgba(236,72,153,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Building2 size={15} color="#ec4899" />
            </div>
            {dep ? 'Modifier le département' : 'Nouveau département'}
          </div>
          <button className="mo-x" onClick={onClose}><X size={16} /></button>
        </div>
        {err && (
          <div style={{ padding:'0 1.5rem', paddingTop:'1rem' }}>
            <div className="err-banner">
              <AlertCircle size={15} color="#dc2626" style={{ flexShrink:0, marginTop:1 }} />
              <div style={{ fontSize:'.8rem', color:'#b91c1c' }}>{err}</div>
            </div>
          </div>
        )}
        <form onSubmit={submit}>
          <div className="mo-body">
            <div className="g2">
              <div className="fl"><label>Code *</label><input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="RH" /></div>
              <div className="fl"><label>Nom *</label><input required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ressources Humaines" /></div>
            </div>
            <div className="fl"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description optionnelle…" /></div>
          </div>
          <div className="mo-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-pink" disabled={loading}>{loading ? '…' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MODAL CONGÉ
═══════════════════════════════════════════════════════ */
function CongeModal({ open, conge, agents, onClose, onSaved }:
  { open: boolean; conge: Conge | null; agents: Agent[]; onClose: () => void; onSaved: () => void }) {

  const blank = () => ({ agent:'', type_conge:'annuel', date_debut:'', date_fin:'', motif:'', statut:'en_attente' })
  const [form, setForm] = useState(blank())
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setForm(conge ? {
      agent: String(conge.agent), type_conge: conge.type_conge,
      date_debut: conge.date_debut, date_fin: conge.date_fin,
      motif: conge.motif, statut: conge.statut,
    } : blank())
    setErr(null)
  }, [conge, open])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(null)
    const payload = { ...form, agent: Number(form.agent) }
    try {
      if (conge) {
        await apiFetch(`/personnel/conges/${conge.id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/personnel/conges/', { method: 'POST', body: JSON.stringify(payload) })
      }
      onSaved(); onClose()
    } catch (ex) {
      setErr(extractApiError(ex))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo-box">
        <div className="mo-head">
          <div className="mo-title">
            <div style={{ width:32, height:32, borderRadius:9, background:'rgba(236,72,153,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <CalendarDays size={15} color="#ec4899" />
            </div>
            {conge ? 'Modifier le congé' : 'Nouveau congé'}
          </div>
          <button className="mo-x" onClick={onClose}><X size={16} /></button>
        </div>
        {err && (
          <div style={{ padding:'0 1.5rem', paddingTop:'1rem' }}>
            <div className="err-banner">
              <AlertCircle size={15} color="#dc2626" style={{ flexShrink:0, marginTop:1 }} />
              <div style={{ fontSize:'.8rem', color:'#b91c1c' }}>{err}</div>
            </div>
          </div>
        )}
        <form onSubmit={submit}>
          <div className="mo-body">
            <div className="fl"><label>Agent *</label>
              <select required value={form.agent} onChange={e => setForm(f => ({ ...f, agent: e.target.value }))}>
                <option value="">— Choisir un agent —</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.nom_complet} — {a.poste}</option>)}
              </select>
            </div>
            <div className="g2">
              <div className="fl"><label>Type de congé</label>
                <select value={form.type_conge} onChange={e => setForm(f => ({ ...f, type_conge: e.target.value }))}>
                  {TYPES_C.map(t => <option key={t} value={t}>{TYPE_CL[t]}</option>)}
                </select>
              </div>
              <div className="fl"><label>Statut</label>
                <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                  {STATUTS_C.map(s => <option key={s} value={s}>{STATUT_LC[s]}</option>)}
                </select>
              </div>
            </div>
            <div className="g2">
              <div className="fl"><label>Date début *</label><input required type="date" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} /></div>
              <div className="fl"><label>Date fin *</label><input required type="date" value={form.date_fin} onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))} /></div>
            </div>
            <div className="fl"><label>Motif</label><textarea value={form.motif} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))} placeholder="Motif optionnel…" /></div>
          </div>
          <div className="mo-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-pink" disabled={loading}>{loading ? '…' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════ */
export default function PersonnelPage() {
  const { user } = useAuth()
  const etabId = user?.etablissement ?? null

  const [tab, setTab] = useState<'agents' | 'conges' | 'departements'>('agents')
  const [stats, setStats] = useState<Stats | null>(null)

  // Agents
  const [agents, setAgents]         = useState<Agent[]>([])
  const [agentsTotal, setAgentsTotal] = useState(0)
  const [agentsOffset, setAgentsOffset] = useState(0)
  const [agentSearch, setAgentSearch] = useState('')
  const [agentStatut, setAgentStatut] = useState('')
  const [agentDep, setAgentDep]     = useState('')
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [editAgent, setEditAgent]   = useState<Agent | null>(null)

  // Congés
  const [conges, setConges]         = useState<Conge[]>([])
  const [congesTotal, setCongesTotal] = useState(0)
  const [congesOffset, setCongesOffset] = useState(0)
  const [congeStatut, setCongeStatut] = useState('')
  const [showCongeModal, setShowCongeModal] = useState(false)
  const [editConge, setEditConge]   = useState<Conge | null>(null)

  // Départements
  const [departements, setDepartements] = useState<Departement[]>([])
  const [showDepModal, setShowDepModal] = useState(false)
  const [editDep, setEditDep]       = useState<Departement | null>(null)

  const fetchStats = useCallback(() => {
    apiFetch<Stats>('/personnel/stats/').then(setStats).catch(() => {})
  }, [])

  const fetchAgents = useCallback((off: number) => {
    let url = `/personnel/agents/?limit=${PAGE_SIZE}&offset=${off}`
    if (agentSearch) url += `&search=${encodeURIComponent(agentSearch)}`
    if (agentStatut) url += `&statut=${agentStatut}`
    if (agentDep)    url += `&departement=${agentDep}`
    apiFetch<ApiList<Agent>>(url).then(d => { setAgents(d.results); setAgentsTotal(d.count) }).catch(() => {})
  }, [agentSearch, agentStatut, agentDep])

  const fetchConges = useCallback((off: number) => {
    let url = `/personnel/conges/?limit=${PAGE_SIZE}&offset=${off}`
    if (congeStatut) url += `&statut=${congeStatut}`
    apiFetch<ApiList<Conge>>(url).then(d => { setConges(d.results); setCongesTotal(d.count) }).catch(() => {})
  }, [congeStatut])

  const fetchDeps = useCallback(() => {
    apiFetch<ApiList<Departement>>('/personnel/departements/?limit=100').then(d => setDepartements(d.results)).catch(() => {})
  }, [])

  useEffect(() => { fetchStats(); fetchDeps() }, [fetchStats, fetchDeps])
  useEffect(() => { setAgentsOffset(0); fetchAgents(0) }, [fetchAgents])
  useEffect(() => { setCongesOffset(0); fetchConges(0) }, [fetchConges])

  async function deleteAgent(id: number) {
    if (!confirm('Supprimer cet agent ?')) return
    await apiFetch(`/personnel/agents/${id}/`, { method: 'DELETE' })
    fetchAgents(agentsOffset); fetchStats()
  }
  async function deleteDep(id: number) {
    if (!confirm('Supprimer ce département ?')) return
    await apiFetch(`/personnel/departements/${id}/`, { method: 'DELETE' })
    fetchDeps(); fetchStats()
  }
  async function deleteConge(id: number) {
    if (!confirm('Supprimer ce congé ?')) return
    await apiFetch(`/personnel/conges/${id}/`, { method: 'DELETE' })
    fetchConges(congesOffset); fetchStats()
  }

  const agentPages = Math.ceil(agentsTotal / PAGE_SIZE)
  const agentPage  = Math.floor(agentsOffset / PAGE_SIZE) + 1
  const congePages = Math.ceil(congesTotal / PAGE_SIZE)
  const congePage  = Math.floor(congesOffset / PAGE_SIZE) + 1

  const KPI = [
    { icon: <Users size={16} color="#ec4899" />, bg:'rgba(236,72,153,0.1)', val: stats?.total ?? '—', label:'Total agents' },
    { icon: <UserCheck size={16} color="#10b981" />, bg:'rgba(16,185,129,0.1)', val: stats?.actifs ?? '—', label:'Actifs' },
    { icon: <Clock size={16} color="#ca8a04" />, bg:'rgba(202,138,4,0.1)', val: stats?.en_conge ?? '—', label:'En congé' },
    { icon: <Building2 size={16} color="#8b5cf6" />, bg:'rgba(139,92,246,0.1)', val: stats?.departements ?? '—', label:'Départements' },
    { icon: <CalendarDays size={16} color="#ef4444" />, bg:'rgba(239,68,68,0.1)', val: stats?.conges_en_attente ?? '—', label:'Congés en attente' },
  ]

  return (
    <div className="rh">
      {ST}

      <div className="pg-head">
        <div>
          <h1 className="pg-title">Gestion du Personnel</h1>
          <p className="pg-sub">Administration des ressources humaines</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        {KPI.map((k, i) => (
          <div className="kpi" key={i}>
            <div className="kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab${tab==='agents' ? ' active' : ''}`} onClick={() => setTab('agents')}>Agents</button>
        <button className={`tab${tab==='conges' ? ' active' : ''}`} onClick={() => setTab('conges')}>Congés</button>
        <button className={`tab${tab==='departements' ? ' active' : ''}`} onClick={() => setTab('departements')}>Départements</button>
      </div>

      {/* ── AGENTS ── */}
      {tab === 'agents' && (
        <>
          <div className="toolbar">
            <div className="search-box">
              <Search size={14} color="#94a3b8" />
              <input placeholder="Nom, poste…" value={agentSearch} onChange={e => setAgentSearch(e.target.value)} />
            </div>
            <select className="sel" value={agentStatut} onChange={e => setAgentStatut(e.target.value)}>
              <option value="">Tous les statuts</option>
              {STATUTS_A.map(s => <option key={s} value={s}>{STATUT_LA[s]}</option>)}
            </select>
            <select className="sel" value={agentDep} onChange={e => setAgentDep(e.target.value)}>
              <option value="">Tous les départements</option>
              {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
            <button className="btn btn-pink" style={{ marginLeft:'auto' }} onClick={() => { setEditAgent(null); setShowAgentModal(true) }}>
              <Plus size={14} /> Nouvel agent
            </button>
          </div>
          <div className="card">
            <div style={{ overflowX:'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Agent</th><th>Poste</th><th>Département</th>
                    <th>Contrat</th><th>Embauche</th><th>Statut</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {agents.length === 0 && (
                    <tr><td colSpan={7} className="empty">Aucun agent trouvé</td></tr>
                  )}
                  {agents.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div className="tbl-name">{a.nom_complet}</div>
                        <div className="tbl-sub">{a.email || a.tel || '—'}</div>
                      </td>
                      <td>{a.poste}</td>
                      <td>{a.departement_nom ?? <span style={{ color:'#94a3b8' }}>—</span>}</td>
                      <td><span className="badge" style={{ background:'#f1f5f9', color:'#475569' }}>{a.contrat_display}</span></td>
                      <td>{a.date_embauche ? new Date(a.date_embauche).toLocaleDateString('fr-FR') : '—'}</td>
                      <td><Badge val={a.statut} map={STATUT_COLOR} /></td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          <button className="btn-icon" onClick={() => { setEditAgent(a); setShowAgentModal(true) }}><Edit2 size={13} /></button>
                          <button className="btn-icon del" onClick={() => deleteAgent(a.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {agentsTotal > PAGE_SIZE && (
              <div className="pg-foot">
                <span className="pg-count">{agentsTotal} agents — page {agentPage}/{agentPages}</span>
                <div className="pg-btns">
                  <button className="pg-btn" disabled={agentPage <= 1} onClick={() => { const n = agentsOffset - PAGE_SIZE; setAgentsOffset(n); fetchAgents(n) }}><ChevronLeft size={14} /></button>
                  <button className="pg-btn" disabled={agentPage >= agentPages} onClick={() => { const n = agentsOffset + PAGE_SIZE; setAgentsOffset(n); fetchAgents(n) }}><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── CONGÉS ── */}
      {tab === 'conges' && (
        <>
          <div className="toolbar">
            <select className="sel" value={congeStatut} onChange={e => setCongeStatut(e.target.value)}>
              <option value="">Tous les statuts</option>
              {STATUTS_C.map(s => <option key={s} value={s}>{STATUT_LC[s]}</option>)}
            </select>
            <button className="btn btn-pink" style={{ marginLeft:'auto' }} onClick={() => { setEditConge(null); setShowCongeModal(true) }}>
              <Plus size={14} /> Nouveau congé
            </button>
          </div>
          <div className="card">
            <div style={{ overflowX:'auto' }}>
              <table className="tbl">
                <thead>
                  <tr><th>Agent</th><th>Type</th><th>Période</th><th>Durée</th><th>Statut</th><th></th></tr>
                </thead>
                <tbody>
                  {conges.length === 0 && (
                    <tr><td colSpan={6} className="empty">Aucun congé enregistré</td></tr>
                  )}
                  {conges.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="tbl-name">{c.agent_nom}</div>
                        <div className="tbl-sub">{c.agent_poste}</div>
                      </td>
                      <td>{c.type_display}</td>
                      <td style={{ whiteSpace:'nowrap' }}>
                        {new Date(c.date_debut).toLocaleDateString('fr-FR')} → {new Date(c.date_fin).toLocaleDateString('fr-FR')}
                      </td>
                      <td>{c.nb_jours} j</td>
                      <td><Badge val={c.statut} map={STATUT_COLOR} /></td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          <button className="btn-icon" onClick={() => { setEditConge(c); setShowCongeModal(true) }}><Edit2 size={13} /></button>
                          <button className="btn-icon del" onClick={() => deleteConge(c.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {congesTotal > PAGE_SIZE && (
              <div className="pg-foot">
                <span className="pg-count">{congesTotal} congés — page {congePage}/{congePages}</span>
                <div className="pg-btns">
                  <button className="pg-btn" disabled={congePage <= 1} onClick={() => { const n = congesOffset - PAGE_SIZE; setCongesOffset(n); fetchConges(n) }}><ChevronLeft size={14} /></button>
                  <button className="pg-btn" disabled={congePage >= congePages} onClick={() => { const n = congesOffset + PAGE_SIZE; setCongesOffset(n); fetchConges(n) }}><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── DÉPARTEMENTS ── */}
      {tab === 'departements' && (
        <>
          <div className="toolbar">
            <button className="btn btn-pink" style={{ marginLeft:'auto' }} onClick={() => { setEditDep(null); setShowDepModal(true) }}>
              <Plus size={14} /> Nouveau département
            </button>
          </div>
          <div className="card">
            <table className="tbl">
              <thead>
                <tr><th>Code</th><th>Département</th><th>Description</th><th>Agents actifs</th><th></th></tr>
              </thead>
              <tbody>
                {departements.length === 0 && (
                  <tr><td colSpan={5} className="empty">Aucun département créé</td></tr>
                )}
                {departements.map(d => (
                  <tr key={d.id}>
                    <td><span style={{ fontFamily:'monospace', fontWeight:700, color:'#ec4899', fontSize:'.8rem' }}>{d.code}</span></td>
                    <td><div className="tbl-name">{d.nom}</div></td>
                    <td style={{ color:'#94a3b8' }}>{d.description || '—'}</td>
                    <td>{d.nb_agents}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn-icon" onClick={() => { setEditDep(d); setShowDepModal(true) }}><Edit2 size={13} /></button>
                        <button className="btn-icon del" onClick={() => deleteDep(d.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modals */}
      <AgentModal
        open={showAgentModal} agent={editAgent} departements={departements}
        etablissementId={etabId}
        onClose={() => setShowAgentModal(false)}
        onSaved={() => { fetchAgents(agentsOffset); fetchStats(); fetchDeps() }}
      />
      <DepModal
        open={showDepModal} dep={editDep} etablissementId={etabId}
        onClose={() => setShowDepModal(false)}
        onSaved={() => { fetchDeps(); fetchStats() }}
      />
      <CongeModal
        open={showCongeModal} conge={editConge} agents={agents}
        onClose={() => setShowCongeModal(false)}
        onSaved={() => { fetchConges(congesOffset); fetchStats() }}
      />
    </div>
  )
}
