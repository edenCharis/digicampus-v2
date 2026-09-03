'use client'
import { useEffect, useState, useCallback } from 'react'
import { Users, Plus, Search, X, AlertCircle, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

interface Departement { id: number; nom: string }
interface Agent {
  id: number; nom: string; prenom: string; nom_complet: string; sexe: string
  email: string; tel: string; poste: string; type_contrat: string; contrat_display: string
  departement: number | null; departement_nom: string | null
  date_embauche: string | null; salaire: string | null; statut: string; statut_display: string
}
interface ApiList<T> { count: number; results: T[] }

const CONTRATS  = ['cdi','cdd','vacataire','stage','benevole']
const CONTRAT_L: Record<string,string> = { cdi:'CDI', cdd:'CDD', vacataire:'Vacataire', stage:'Stage', benevole:'Bénévole' }
const STATUTS_A = ['actif','conge','suspendu','quitte']
const STATUT_LA: Record<string,string> = { actif:'Actif', conge:'En congé', suspendu:'Suspendu', quitte:'A quitté' }
const STATUT_COLOR: Record<string,{bg:string;color:string}> = {
  actif:     { bg:'#f0fdf4', color:'#10b981' },
  conge:     { bg:'#fef9c3', color:'#ca8a04' },
  suspendu:  { bg:'#fef2f2', color:'#ef4444' },
  quitte:    { bg:'#f1f5f9', color:'#94a3b8' },
}
const PAGE_SIZE = 20

function extractApiError(e: unknown): string {
  if (!e || typeof e !== 'object') return 'Erreur inconnue'
  const r = e as Record<string, unknown>
  if (r.detail) return String(r.detail)
  const parts = Object.entries(r).map(([k, v]) => {
    const msg = Array.isArray(v) ? v.flat().join(', ') : String(v)
    return k === 'non_field_errors' ? msg : `${k} : ${msg}`
  })
  return parts.join('\n') || 'Erreur'
}

const ST = (
  <style>{`
    .ag { max-width:1100px; margin:0 auto; }
    .pg-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
    .pg-title { font-size:1.25rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
    .pg-sub { font-size:.8rem; color:#94a3b8; margin:.2rem 0 0; }
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
    .tbl-sub { font-size:.73rem; color:#94a3b8; }
    .empty { padding:3rem 1rem; text-align:center; color:#94a3b8; font-size:.875rem; }
    .badge { display:inline-flex; align-items:center; padding:.2rem .6rem; border-radius:99px; font-size:.7rem; font-weight:700; }
    .pg-foot { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1rem; border-top:1px solid #f1f5f9; }
    .pg-count { font-size:.75rem; color:#94a3b8; }
    .pg-btns { display:flex; gap:.25rem; }
    .pg-btn { padding:.35rem .5rem; border:1px solid #e2e8f0; border-radius:7px; background:#fff; cursor:pointer; color:#64748b; display:flex; align-items:center; }
    .pg-btn:disabled { opacity:.4; cursor:not-allowed; }
    .btn { display:inline-flex; align-items:center; gap:.375rem; border:none; border-radius:9px; padding:.5rem 1rem; font-size:.8125rem; font-weight:600; cursor:pointer; transition:all .15s; }
    .btn-pink { background:#ec4899; color:#fff; }
    .btn-pink:hover { background:#db2777; }
    .btn-outline { background:#fff; border:1px solid #e2e8f0; color:#475569; }
    .btn-icon { padding:.35rem; border-radius:7px; background:none; border:none; cursor:pointer; color:#94a3b8; }
    .btn-icon:hover { background:#f1f5f9; color:#475569; }
    .btn-icon.del:hover { background:#fef2f2; color:#ef4444; }
    .mo { position:fixed; inset:0; background:rgba(15,23,42,.45); display:flex; align-items:center; justify-content:center; z-index:50; padding:1rem; }
    .mo-box { background:#fff; border-radius:18px; width:100%; max-width:560px; max-height:90vh; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,.18); }
    .mo-head { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f1f5f9; }
    .mo-title { display:flex; align-items:center; gap:.625rem; font-size:1rem; font-weight:700; color:#0f172a; }
    .mo-x { background:none; border:none; cursor:pointer; color:#94a3b8; padding:.25rem; border-radius:6px; }
    .mo-body { padding:1.5rem; overflow-y:auto; display:flex; flex-direction:column; gap:1rem; }
    .mo-foot { padding:1rem 1.5rem; border-top:1px solid #f1f5f9; display:flex; gap:.625rem; justify-content:flex-end; }
    .fl { display:flex; flex-direction:column; gap:.375rem; }
    .fl label { font-size:.75rem; font-weight:600; color:#475569; text-transform:uppercase; letter-spacing:.04em; }
    .fl input, .fl select { border:1px solid #e2e8f0; border-radius:9px; padding:.55rem .75rem; font-size:.875rem; color:#334155; outline:none; background:#fff; font-family:inherit; }
    .fl input:focus, .fl select:focus { border-color:#ec4899; box-shadow:0 0 0 3px rgba(236,72,153,.1); }
    .g2 { display:grid; grid-template-columns:1fr 1fr; gap:.875rem; }
    .g3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:.875rem; }
    .err-b { background:#fff1f2; border:1px solid #fecaca; border-radius:10px; padding:.75rem 1rem; display:flex; gap:.5rem; align-items:flex-start; }
  `}</style>
)

function AgentModal({ open, agent, departements, etablissementId, onClose, onSaved }:
  { open: boolean; agent: Agent | null; departements: Departement[]; etablissementId: number | null; onClose: () => void; onSaved: () => void }) {
  const blank = () => ({ nom:'', prenom:'', sexe:'M', email:'', tel:'', poste:'', type_contrat:'cdi', departement:'', date_embauche:'', salaire:'', statut:'actif' })
  const [form, setForm] = useState(blank())
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setForm(agent ? { nom:agent.nom, prenom:agent.prenom, sexe:agent.sexe, email:agent.email, tel:agent.tel, poste:agent.poste, type_contrat:agent.type_contrat, departement:agent.departement?String(agent.departement):'', date_embauche:agent.date_embauche??'', salaire:agent.salaire??'', statut:agent.statut } : blank())
    setErr(null)
  }, [agent, open])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr(null)
    const payload: Record<string, unknown> = { nom:form.nom, prenom:form.prenom, sexe:form.sexe, email:form.email, tel:form.tel, poste:form.poste, type_contrat:form.type_contrat, statut:form.statut }
    if (form.departement) payload.departement = Number(form.departement)
    if (form.date_embauche) payload.date_embauche = form.date_embauche
    if (form.salaire) payload.salaire = Number(form.salaire)
    if (!agent && etablissementId) payload.etablissement = etablissementId
    try {
      if (agent) await apiFetch(`/personnel/agents/${agent.id}/`, { method:'PATCH', body:JSON.stringify(payload) })
      else await apiFetch('/personnel/agents/', { method:'POST', body:JSON.stringify(payload) })
      onSaved(); onClose()
    } catch(ex) { setErr(extractApiError(ex)) }
    finally { setLoading(false) }
  }

  if (!open) return null
  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo-box">
        <div className="mo-head">
          <div className="mo-title"><Users size={16} color="#ec4899" />{agent ? 'Modifier l\'agent' : 'Nouvel agent'}</div>
          <button className="mo-x" onClick={onClose}><X size={16} /></button>
        </div>
        {err && <div style={{ padding:'0 1.5rem', paddingTop:'1rem' }}><div className="err-b"><AlertCircle size={14} color="#dc2626" style={{ flexShrink:0,marginTop:1 }} /><div style={{ fontSize:'.8rem',color:'#b91c1c' }}>{err}</div></div></div>}
        <form onSubmit={submit}>
          <div className="mo-body">
            <div className="g2">
              <div className="fl"><label>Nom *</label><input required value={form.nom} onChange={e => setForm(f=>({...f,nom:e.target.value}))} /></div>
              <div className="fl"><label>Prénom *</label><input required value={form.prenom} onChange={e => setForm(f=>({...f,prenom:e.target.value}))} /></div>
            </div>
            <div className="g3">
              <div className="fl"><label>Sexe</label>
                <select value={form.sexe} onChange={e => setForm(f=>({...f,sexe:e.target.value}))}>
                  <option value="M">Masculin</option><option value="F">Féminin</option>
                </select>
              </div>
              <div className="fl"><label>Tél</label><input value={form.tel} onChange={e => setForm(f=>({...f,tel:e.target.value}))} /></div>
              <div className="fl"><label>Email</label><input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} /></div>
            </div>
            <div className="g2">
              <div className="fl"><label>Poste *</label><input required value={form.poste} onChange={e => setForm(f=>({...f,poste:e.target.value}))} /></div>
              <div className="fl"><label>Département</label>
                <select value={form.departement} onChange={e => setForm(f=>({...f,departement:e.target.value}))}>
                  <option value="">— Aucun —</option>
                  {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                </select>
              </div>
            </div>
            <div className="g3">
              <div className="fl"><label>Contrat</label>
                <select value={form.type_contrat} onChange={e => setForm(f=>({...f,type_contrat:e.target.value}))}>
                  {CONTRATS.map(c => <option key={c} value={c}>{CONTRAT_L[c]}</option>)}
                </select>
              </div>
              <div className="fl"><label>Date embauche</label><input type="date" value={form.date_embauche} onChange={e => setForm(f=>({...f,date_embauche:e.target.value}))} /></div>
              <div className="fl"><label>Salaire (FCFA)</label><input type="number" min="0" value={form.salaire} onChange={e => setForm(f=>({...f,salaire:e.target.value}))} /></div>
            </div>
            <div className="fl"><label>Statut</label>
              <select value={form.statut} onChange={e => setForm(f=>({...f,statut:e.target.value}))}>
                {STATUTS_A.map(s => <option key={s} value={s}>{STATUT_LA[s]}</option>)}
              </select>
            </div>
          </div>
          <div className="mo-foot">
            <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-pink" disabled={loading}>{loading?'…':'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AgentsPage() {
  const { user } = useAuth()
  const etabId = user?.etablissement ?? null
  const [agents, setAgents]     = useState<Agent[]>([])
  const [total, setTotal]       = useState(0)
  const [offset, setOffset]     = useState(0)
  const [search, setSearch]     = useState('')
  const [filterStatut, setFs]   = useState('')
  const [filterDep, setFd]      = useState('')
  const [departements, setDeps] = useState<Departement[]>([])
  const [showModal, setShow]    = useState(false)
  const [editAgent, setEdit]    = useState<Agent | null>(null)

  const fetchAgents = useCallback((off: number) => {
    let url = `/personnel/agents/?limit=${PAGE_SIZE}&offset=${off}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    if (filterStatut) url += `&statut=${filterStatut}`
    if (filterDep) url += `&departement=${filterDep}`
    apiFetch<ApiList<Agent>>(url).then(d => { setAgents(d.results); setTotal(d.count) }).catch(() => {})
  }, [search, filterStatut, filterDep])

  useEffect(() => { apiFetch<ApiList<Departement>>('/personnel/departements/?limit=100').then(d => setDeps(d.results)).catch(() => {}) }, [])
  useEffect(() => { setOffset(0); fetchAgents(0) }, [fetchAgents])

  const pages = Math.ceil(total / PAGE_SIZE)
  const page  = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div className="ag">
      {ST}
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Agents</h1>
          <p className="pg-sub">Liste du personnel administratif</p>
        </div>
        <button className="btn btn-pink" onClick={() => { setEdit(null); setShow(true) }}><Plus size={14} /> Nouvel agent</button>
      </div>
      <div className="toolbar">
        <div className="search-box"><Search size={14} color="#94a3b8" /><input placeholder="Nom, poste…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="sel" value={filterStatut} onChange={e => setFs(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUTS_A.map(s => <option key={s} value={s}>{STATUT_LA[s]}</option>)}
        </select>
        <select className="sel" value={filterDep} onChange={e => setFd(e.target.value)}>
          <option value="">Tous les départements</option>
          {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
        </select>
      </div>
      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table className="tbl">
            <thead>
              <tr><th>Agent</th><th>Poste</th><th>Département</th><th>Contrat</th><th>Embauche</th><th>Statut</th><th></th></tr>
            </thead>
            <tbody>
              {agents.length === 0 && <tr><td colSpan={7} className="empty">Aucun agent trouvé</td></tr>}
              {agents.map(a => {
                const sc = STATUT_COLOR[a.statut] ?? { bg:'#f1f5f9', color:'#64748b' }
                return (
                  <tr key={a.id}>
                    <td><div className="tbl-name">{a.nom_complet}</div><div className="tbl-sub">{a.email||a.tel||'—'}</div></td>
                    <td>{a.poste}</td>
                    <td>{a.departement_nom ?? <span style={{ color:'#94a3b8' }}>—</span>}</td>
                    <td><span className="badge" style={{ background:'#f1f5f9', color:'#475569' }}>{a.contrat_display}</span></td>
                    <td>{a.date_embauche ? new Date(a.date_embauche).toLocaleDateString('fr-FR') : '—'}</td>
                    <td><span className="badge" style={{ background:sc.bg, color:sc.color }}>{a.statut_display}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn-icon" onClick={() => { setEdit(a); setShow(true) }}><Edit2 size={13} /></button>
                        <button className="btn-icon del" onClick={async () => { if(!confirm('Supprimer ?')) return; await apiFetch(`/personnel/agents/${a.id}/`,{method:'DELETE'}); fetchAgents(offset) }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {total > PAGE_SIZE && (
          <div className="pg-foot">
            <span className="pg-count">{total} agents — page {page}/{pages}</span>
            <div className="pg-btns">
              <button className="pg-btn" disabled={page<=1} onClick={() => { const n=offset-PAGE_SIZE; setOffset(n); fetchAgents(n) }}><ChevronLeft size={14} /></button>
              <button className="pg-btn" disabled={page>=pages} onClick={() => { const n=offset+PAGE_SIZE; setOffset(n); fetchAgents(n) }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
      <AgentModal open={showModal} agent={editAgent} departements={departements} etablissementId={etabId} onClose={() => setShow(false)} onSaved={() => fetchAgents(offset)} />
    </div>
  )
}
