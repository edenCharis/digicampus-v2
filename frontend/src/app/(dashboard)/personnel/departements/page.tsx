'use client'
import { useEffect, useState, useCallback } from 'react'
import { Building2, Plus, X, AlertCircle, Edit2, Trash2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

interface Departement { id: number; code: string; nom: string; description: string; nb_agents: number; etablissement: number }
interface ApiList<T> { count: number; results: T[] }

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
    .dp { max-width:900px; margin:0 auto; }
    .pg-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
    .pg-title { font-size:1.25rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
    .pg-sub { font-size:.8rem; color:#94a3b8; margin:.2rem 0 0; }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; }
    .tbl { width:100%; border-collapse:collapse; }
    .tbl th { padding:.7rem 1rem; text-align:left; font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid #f1f5f9; background:#fafafa; }
    .tbl td { padding:.75rem 1rem; font-size:.8125rem; color:#475569; border-bottom:1px solid #f8fafc; vertical-align:middle; }
    .tbl tr:last-child td { border-bottom:none; }
    .tbl tr:hover td { background:#fafafa; }
    .tbl-name { font-weight:600; color:#0f172a; }
    .empty { padding:3rem 1rem; text-align:center; color:#94a3b8; font-size:.875rem; }
    .btn { display:inline-flex; align-items:center; gap:.375rem; border:none; border-radius:9px; padding:.5rem 1rem; font-size:.8125rem; font-weight:600; cursor:pointer; transition:all .15s; }
    .btn-pink { background:#ec4899; color:#fff; }
    .btn-pink:hover { background:#db2777; }
    .btn-outline { background:#fff; border:1px solid #e2e8f0; color:#475569; }
    .btn-icon { padding:.35rem; border-radius:7px; background:none; border:none; cursor:pointer; color:#94a3b8; }
    .btn-icon:hover { background:#f1f5f9; color:#475569; }
    .btn-icon.del:hover { background:#fef2f2; color:#ef4444; }
    .mo { position:fixed; inset:0; background:rgba(15,23,42,.45); display:flex; align-items:center; justify-content:center; z-index:50; padding:1rem; }
    .mo-box { background:#fff; border-radius:18px; width:100%; max-width:420px; max-height:90vh; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,.18); }
    .mo-head { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f1f5f9; }
    .mo-title { display:flex; align-items:center; gap:.625rem; font-size:1rem; font-weight:700; color:#0f172a; }
    .mo-x { background:none; border:none; cursor:pointer; color:#94a3b8; padding:.25rem; border-radius:6px; }
    .mo-body { padding:1.5rem; overflow-y:auto; display:flex; flex-direction:column; gap:1rem; }
    .mo-foot { padding:1rem 1.5rem; border-top:1px solid #f1f5f9; display:flex; gap:.625rem; justify-content:flex-end; }
    .fl { display:flex; flex-direction:column; gap:.375rem; }
    .fl label { font-size:.75rem; font-weight:600; color:#475569; text-transform:uppercase; letter-spacing:.04em; }
    .fl input, .fl textarea { border:1px solid #e2e8f0; border-radius:9px; padding:.55rem .75rem; font-size:.875rem; color:#334155; outline:none; background:#fff; font-family:inherit; }
    .fl input:focus, .fl textarea:focus { border-color:#ec4899; box-shadow:0 0 0 3px rgba(236,72,153,.1); }
    .fl textarea { resize:vertical; min-height:70px; }
    .g2 { display:grid; grid-template-columns:1fr 1fr; gap:.875rem; }
    .err-b { background:#fff1f2; border:1px solid #fecaca; border-radius:10px; padding:.75rem 1rem; display:flex; gap:.5rem; align-items:flex-start; }
  `}</style>
)

function DepModal({ open, dep, etablissementId, onClose, onSaved }:
  { open: boolean; dep: Departement | null; etablissementId: number | null; onClose: () => void; onSaved: () => void }) {
  const blank = () => ({ code:'', nom:'', description:'' })
  const [form, setForm] = useState(blank())
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => { setForm(dep ? { code:dep.code, nom:dep.nom, description:dep.description } : blank()); setErr(null) }, [dep, open])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr(null)
    const payload: Record<string, unknown> = { ...form }
    if (!dep && etablissementId) payload.etablissement = etablissementId
    try {
      if (dep) await apiFetch(`/personnel/departements/${dep.id}/`, { method:'PATCH', body:JSON.stringify(payload) })
      else await apiFetch('/personnel/departements/', { method:'POST', body:JSON.stringify(payload) })
      onSaved(); onClose()
    } catch(ex) { setErr(extractApiError(ex)) }
    finally { setLoading(false) }
  }

  if (!open) return null
  return (
    <div className="mo" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mo-box">
        <div className="mo-head">
          <div className="mo-title"><Building2 size={16} color="#ec4899" />{dep ? 'Modifier' : 'Nouveau département'}</div>
          <button className="mo-x" onClick={onClose}><X size={16} /></button>
        </div>
        {err && <div style={{ padding:'0 1.5rem', paddingTop:'1rem' }}><div className="err-b"><AlertCircle size={14} color="#dc2626" style={{ flexShrink:0,marginTop:1 }} /><div style={{ fontSize:'.8rem',color:'#b91c1c' }}>{err}</div></div></div>}
        <form onSubmit={submit}>
          <div className="mo-body">
            <div className="fl" style={{ maxWidth:120 }}><label>Code *</label><input required value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value}))} placeholder="RH" /></div>
            <div className="fl"><label>Nom *</label><input required value={form.nom} onChange={e => setForm(f=>({...f,nom:e.target.value}))} placeholder="Ressources Humaines" /></div>
            <div className="fl"><label>Description</label><textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Description optionnelle…" /></div>
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

export default function DepartementsPage() {
  const { user } = useAuth()
  const etabId = user?.etablissement ?? null
  const [departements, setDeps] = useState<Departement[]>([])
  const [showModal, setShow]    = useState(false)
  const [editDep, setEdit]      = useState<Departement | null>(null)

  const fetchDeps = useCallback(() => {
    apiFetch<ApiList<Departement>>('/personnel/departements/?limit=200').then(d => setDeps(d.results)).catch(() => {})
  }, [])

  useEffect(() => { fetchDeps() }, [fetchDeps])

  return (
    <div className="dp">
      {ST}
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Départements</h1>
          <p className="pg-sub">Gestion des départements et services</p>
        </div>
        <button className="btn btn-pink" onClick={() => { setEdit(null); setShow(true) }}><Plus size={14} /> Nouveau département</button>
      </div>
      <div className="card">
        <table className="tbl">
          <thead>
            <tr><th>Code</th><th>Département</th><th>Description</th><th>Agents actifs</th><th></th></tr>
          </thead>
          <tbody>
            {departements.length === 0 && <tr><td colSpan={5} className="empty">Aucun département créé</td></tr>}
            {departements.map(d => (
              <tr key={d.id}>
                <td><span style={{ fontFamily:'monospace', fontWeight:700, color:'#ec4899', fontSize:'.8rem' }}>{d.code}</span></td>
                <td><div className="tbl-name">{d.nom}</div></td>
                <td style={{ color:'#94a3b8' }}>{d.description || '—'}</td>
                <td>{d.nb_agents}</td>
                <td>
                  <div style={{ display:'flex', gap:4 }}>
                    <button className="btn-icon" onClick={() => { setEdit(d); setShow(true) }}><Edit2 size={13} /></button>
                    <button className="btn-icon del" onClick={async () => { if(!confirm('Supprimer ?')) return; await apiFetch(`/personnel/departements/${d.id}/`,{method:'DELETE'}); fetchDeps() }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DepModal open={showModal} dep={editDep} etablissementId={etabId} onClose={() => setShow(false)} onSaved={fetchDeps} />
    </div>
  )
}
