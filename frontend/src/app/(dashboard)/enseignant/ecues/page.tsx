'use client'
import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface ECUE { id: number; code: string; libelle: string; credits: number; coefficient: number; ue_code: string; ue_libelle: string }
interface ApiList<T> { count: number; results: T[] }

const PAGE_SIZE = 20

const ST = (
  <style>{`
    .ec { max-width:1100px; margin:0 auto; }
    .pg-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
    .pg-title { font-size:1.25rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
    .pg-sub { font-size:.8rem; color:#94a3b8; margin:.2rem 0 0; }
    .toolbar { display:flex; gap:.625rem; flex-wrap:wrap; margin-bottom:1rem; }
    .search-box { display:flex; align-items:center; gap:.5rem; background:#fff; border:1px solid #e2e8f0; border-radius:9px; padding:.45rem .75rem; flex:1; min-width:180px; max-width:300px; }
    .search-box input { background:none; border:none; outline:none; font-size:.8125rem; color:#334155; width:100%; }
    .search-box input::placeholder { color:#94a3b8; }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; }
    .tbl { width:100%; border-collapse:collapse; }
    .tbl th { padding:.7rem 1rem; text-align:left; font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid #f1f5f9; background:#fafafa; white-space:nowrap; }
    .tbl td { padding:.75rem 1rem; font-size:.8125rem; color:#475569; border-bottom:1px solid #f8fafc; vertical-align:middle; }
    .tbl tr:last-child td { border-bottom:none; }
    .tbl tr:hover td { background:#fafafa; }
    .tbl-name { font-weight:600; color:#0f172a; }
    .tbl-sub { font-size:.73rem; color:#94a3b8; }
    .empty { padding:3rem 1rem; text-align:center; color:#94a3b8; font-size:.875rem; }
    .badge { display:inline-flex; align-items:center; padding:.2rem .6rem; border-radius:99px; font-size:.7rem; font-weight:700; background:#f1f5f9; color:#475569; }
    .pg-foot { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1rem; border-top:1px solid #f1f5f9; }
    .pg-count { font-size:.75rem; color:#94a3b8; }
    .pg-btns { display:flex; gap:.25rem; }
    .pg-btn { padding:.35rem .5rem; border:1px solid #e2e8f0; border-radius:7px; background:#fff; cursor:pointer; color:#64748b; display:flex; align-items:center; }
    .pg-btn:disabled { opacity:.4; cursor:not-allowed; }
  `}</style>
)

export default function EcuesEnseignantPage() {
  const [ecues, setEcues]   = useState<ECUE[]>([])
  const [total, setTotal]   = useState(0)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')

  const fetchEcues = useCallback((off: number) => {
    let url = `/ecues/?limit=${PAGE_SIZE}&offset=${off}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    apiFetch<ApiList<ECUE>>(url).then(d => { setEcues(d.results); setTotal(d.count) }).catch(() => {})
  }, [search])

  useEffect(() => { setOffset(0); fetchEcues(0) }, [fetchEcues])

  const pages = Math.ceil(total / PAGE_SIZE)
  const page  = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div className="ec">
      {ST}
      <div className="pg-head">
        <div>
          <h1 className="pg-title">ECUEs enseignées</h1>
          <p className="pg-sub">Éléments constitutifs des unités d&apos;enseignement</p>
        </div>
      </div>
      <div className="toolbar">
        <div className="search-box"><Search size={14} color="#94a3b8" /><input placeholder="Code, libellé…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>
      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table className="tbl">
            <thead>
              <tr><th>Code</th><th>ECUE</th><th>UE rattachée</th><th>Crédits</th><th>Coefficient</th></tr>
            </thead>
            <tbody>
              {ecues.length === 0 && <tr><td colSpan={5} className="empty">Aucune ECUE trouvée</td></tr>}
              {ecues.map(e => (
                <tr key={e.id}>
                  <td><span style={{ fontFamily:'monospace', fontWeight:700, color:'#6366f1', fontSize:'.8rem' }}>{e.code}</span></td>
                  <td><div className="tbl-name">{e.libelle}</div></td>
                  <td><div className="tbl-sub">{e.ue_code}</div><div>{e.ue_libelle}</div></td>
                  <td><span className="badge">{e.credits} cr.</span></td>
                  <td>{e.coefficient}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > PAGE_SIZE && (
          <div className="pg-foot">
            <span className="pg-count">{total} ECUEs — page {page}/{pages}</span>
            <div className="pg-btns">
              <button className="pg-btn" disabled={page<=1} onClick={() => { const n=offset-PAGE_SIZE; setOffset(n); fetchEcues(n) }}><ChevronLeft size={14} /></button>
              <button className="pg-btn" disabled={page>=pages} onClick={() => { const n=offset+PAGE_SIZE; setOffset(n); fetchEcues(n) }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
