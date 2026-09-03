'use client'
import { useEffect, useState, useCallback } from 'react'
import { CalendarDays, Plus, X, AlertCircle, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

interface Agent { id: number; nom_complet: string; poste: string }
interface Conge {
  id: number; agent: number; agent_nom: string; agent_poste: string
  type_conge: string; type_display: string
  date_debut: string; date_fin: string; nb_jours: number
  motif: string; statut: string; statut_display: string
}
interface ApiList<T> { count: number; results: T[] }

const TYPES_C   = ['annuel','maladie','maternite','paternite','sans_solde','autre']
const TYPE_CL: Record<string,string> = { annuel:'Congé annuel', maladie:'Maladie', maternite:'Maternité', paternite:'Paternité', sans_solde:'Sans solde', autre:'Autre' }
const STATUTS_C = ['en_attente','approuve','refuse']
const STATUT_LC: Record<string,string> = { en_attente:'En attente', approuve:'Approuvé', refuse:'Refusé' }
const STATUT_COLOR: Record<string,{bg:string;color:string}> = {
  en_attente:{ bg:'#fef9c3', color:'#ca8a04' },
  approuve:  { bg:'#f0fdf4', color:'#10b981' },
  refuse:    { bg:'#fef2f2', color:'#ef4444' },
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
    .cg { max-width:1100px; margin:0 auto; }
    .pg-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
    .pg-title { font-size:1.25rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
    .pg-sub { font-size:.8rem; color:#94a3b8; margin:.2rem 0 0; }
    .toolbar { display:flex; gap:.625rem; flex-wrap:wrap; margin-bottom:1rem; align-items:center; }
    .sel { background:#fff; border:1px solid #e2e8f0; border-radius:9px; padding:.45rem .75rem; font-size:.8125rem; color:#475569; cursor:pointer; outline:none; }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; }
    .tbl { width:100%; border-collapse:collapse; }
    .tbl th { padding:.7rem 1rem; text-align:left; font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid #f1f5f9; background:#fafafa; }
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
    .mo-box { background:#fff; border-radius:18px; width:100%; max-width:520px; max-height:90vh; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,.18); }
    .mo-head { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f1f5f9; }
    .mo-title { display:flex; align-items:center; gap:.625rem; font-size:1rem; font-weight:700; color:#0f172a; }
    .mo-x { background:none; border:none; cursor:pointer; color:#94a3b8; padding:.25rem; border-radius:6px; }
    .mo-body { padding:1.5rem; overflow-y:auto; display:flex; flex-direction:column; gap:1rem; }
    .mo-foot { padding:1rem 1.5rem; border-top:1px solid #f1f5f9; display:flex; gap:.625rem; justify-content:flex-end; }
    .fl { display:flex; flex-direction:column; gap:.375rem; }
    .fl label { font-size:.75rem; font-weight:600; color:#475569; text-transform:uppercase; letter-spacing:.04em; }
    .fl input, .fl select, .fl textarea { border:1px solid #e2e8f0; border-radius:9px; padding:.55rem .75rem; font-size:.875rem; color:#334155; outline:none; background:#fff; font-family:inherit; }
    .fl input:focus, .fl select:focus, .fl textarea:focus { border-color:#ec4899; box-shadow:0 0 0 3px rgba(236,72,153,.1); }
    .fl textarea { resize:vertical; min-height:70px; }
    .g2 { display:grid; grid-template-columns:1fr 1fr; gap:.875rem; }
    .err-b { background:#fff1f2; border:1px solid #fecaca; border-radius:10px; padding:.75rem 1rem; display:flex; gap:.5rem; align-items:flex-start; }
  `}</style>
)

function CongeModal({ open, conge, agents, onClose, onSaved }:
  { open: boolean; conge: Conge | null; agents: Agent[]; onClose: () => void; onSaved: () => void }) {
  const blank = () => ({ agent:'', type_conge:'annuel', date_debut:'', date_fin:'', motif:'', statut:'en_attente' })
  const [form, setForm] = useState(blank())
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setForm(conge ? { agent:String(conge.agent), type_conge:conge.type_conge, date_debut:conge.date_debut, date_fin:conge.date_fin, motif:conge.motif, statut:conge.statut } : blank())
    setErr(null)
  }, [conge, open])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr(null)
    const payload = { ...form, agent: Number(form.agent) }
    try {
      if (conge) await apiFetch(`/personnel/conges/${conge.id}/`, { method:'PATCH', body:JSON.stringify(payload) })
      else await apiFetch('/personnel/conges/', { method:'POST', body:JSON.stringify(payload) })
      onSaved(); onClose()
    } catch(ex) { setErr(extractApiError(ex)) }
    finally { setLoading(false) }
  }

  if (!open) return null
  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo-box">
        <div className="mo-head">
          <div className="mo-title"><CalendarDays size={16} color="#ec4899" />{conge ? 'Modifier le congé' : 'Nouveau congé'}</div>
          <button className="mo-x" onClick={onClose}><X size={16} /></button>
        </div>
        {err && <div style={{ padding:'0 1.5rem', paddingTop:'1rem' }}><div className="err-b"><AlertCircle size={14} color="#dc2626" style={{ flexShrink:0,marginTop:1 }} /><div style={{ fontSize:'.8rem',color:'#b91c1c' }}>{err}</div></div></div>}
        <form onSubmit={submit}>
          <div className="mo-body">
            <div className="fl"><label>Agent *</label>
              <select required value={form.agent} onChange={e => setForm(f=>({...f,agent:e.target.value}))}>
                <option value="">— Choisir un agent —</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.nom_complet} — {a.poste}</option>)}
              </select>
            </div>
            <div className="g2">
              <div className="fl"><label>Type</label>
                <select value={form.type_conge} onChange={e => setForm(f=>({...f,type_conge:e.target.value}))}>
                  {TYPES_C.map(t => <option key={t} value={t}>{TYPE_CL[t]}</option>)}
                </select>
              </div>
              <div className="fl"><label>Statut</label>
                <select value={form.statut} onChange={e => setForm(f=>({...f,statut:e.target.value}))}>
                  {STATUTS_C.map(s => <option key={s} value={s}>{STATUT_LC[s]}</option>)}
                </select>
              </div>
            </div>
            <div className="g2">
              <div className="fl"><label>Date début *</label><input required type="date" value={form.date_debut} onChange={e => setForm(f=>({...f,date_debut:e.target.value}))} /></div>
              <div className="fl"><label>Date fin *</label><input required type="date" value={form.date_fin} onChange={e => setForm(f=>({...f,date_fin:e.target.value}))} /></div>
            </div>
            <div className="fl"><label>Motif</label><textarea value={form.motif} onChange={e => setForm(f=>({...f,motif:e.target.value}))} placeholder="Motif optionnel…" /></div>
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

export default function CongesPage() {
  const { user } = useAuth()
  void user
  const [conges, setConges]     = useState<Conge[]>([])
  const [total, setTotal]       = useState(0)
  const [offset, setOffset]     = useState(0)
  const [filterStatut, setFs]   = useState('')
  const [agents, setAgents]     = useState<Agent[]>([])
  const [showModal, setShow]    = useState(false)
  const [editConge, setEdit]    = useState<Conge | null>(null)

  const fetchConges = useCallback((off: number) => {
    let url = `/personnel/conges/?limit=${PAGE_SIZE}&offset=${off}`
    if (filterStatut) url += `&statut=${filterStatut}`
    apiFetch<ApiList<Conge>>(url).then(d => { setConges(d.results); setTotal(d.count) }).catch(() => {})
  }, [filterStatut])

  useEffect(() => { apiFetch<ApiList<Agent>>('/personnel/agents/?limit=200').then(d => setAgents(d.results)).catch(() => {}) }, [])
  useEffect(() => { setOffset(0); fetchConges(0) }, [fetchConges])

  const pages = Math.ceil(total / PAGE_SIZE)
  const page  = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div className="cg">
      {ST}
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Congés</h1>
          <p className="pg-sub">Gestion des congés du personnel</p>
        </div>
        <button className="btn btn-pink" onClick={() => { setEdit(null); setShow(true) }}><Plus size={14} /> Nouveau congé</button>
      </div>
      <div className="toolbar">
        <select className="sel" value={filterStatut} onChange={e => setFs(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUTS_C.map(s => <option key={s} value={s}>{STATUT_LC[s]}</option>)}
        </select>
      </div>
      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table className="tbl">
            <thead>
              <tr><th>Agent</th><th>Type</th><th>Période</th><th>Durée</th><th>Statut</th><th></th></tr>
            </thead>
            <tbody>
              {conges.length === 0 && <tr><td colSpan={6} className="empty">Aucun congé enregistré</td></tr>}
              {conges.map(c => {
                const sc = STATUT_COLOR[c.statut] ?? { bg:'#f1f5f9', color:'#64748b' }
                return (
                  <tr key={c.id}>
                    <td><div className="tbl-name">{c.agent_nom}</div><div className="tbl-sub">{c.agent_poste}</div></td>
                    <td>{c.type_display}</td>
                    <td style={{ whiteSpace:'nowrap' }}>
                      {new Date(c.date_debut).toLocaleDateString('fr-FR')} → {new Date(c.date_fin).toLocaleDateString('fr-FR')}
                    </td>
                    <td>{c.nb_jours} j</td>
                    <td><span className="badge" style={{ background:sc.bg, color:sc.color }}>{c.statut_display}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn-icon" onClick={() => { setEdit(c); setShow(true) }}><Edit2 size={13} /></button>
                        <button className="btn-icon del" onClick={async () => { if(!confirm('Supprimer ?')) return; await apiFetch(`/personnel/conges/${c.id}/`,{method:'DELETE'}); fetchConges(offset) }}><Trash2 size={13} /></button>
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
            <span className="pg-count">{total} congés — page {page}/{pages}</span>
            <div className="pg-btns">
              <button className="pg-btn" disabled={page<=1} onClick={() => { const n=offset-PAGE_SIZE; setOffset(n); fetchConges(n) }}><ChevronLeft size={14} /></button>
              <button className="pg-btn" disabled={page>=pages} onClick={() => { const n=offset+PAGE_SIZE; setOffset(n); fetchConges(n) }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
      <CongeModal open={showModal} conge={editConge} agents={agents} onClose={() => setShow(false)} onSaved={() => fetchConges(offset)} />
    </div>
  )
}
