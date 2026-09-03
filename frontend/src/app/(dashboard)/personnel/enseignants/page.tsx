'use client'
import { useEffect, useState, useCallback } from 'react'
import { UserCheck, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Enseignant { id: number; nom: string; prenom: string; sexe: string; email: string; tel: string; grade: string; grade_display: string; specialite_libelle: string | null; etat: boolean }
interface ApiList<T> { count: number; results: T[] }

const PAGE_SIZE = 20

const ST = (
  <style>{`
    .en { max-width:1100px; margin:0 auto; }
    .pg-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
    .pg-title { font-size:1.25rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
    .pg-sub { font-size:.8rem; color:#94a3b8; margin:.2rem 0 0; }
    .toolbar { display:flex; gap:.625rem; flex-wrap:wrap; margin-bottom:1rem; align-items:center; }
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
    .badge { display:inline-flex; align-items:center; padding:.2rem .6rem; border-radius:99px; font-size:.7rem; font-weight:700; }
    .pg-foot { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1rem; border-top:1px solid #f1f5f9; }
    .pg-count { font-size:.75rem; color:#94a3b8; }
    .pg-btns { display:flex; gap:.25rem; }
    .pg-btn { padding:.35rem .5rem; border:1px solid #e2e8f0; border-radius:7px; background:#fff; cursor:pointer; color:#64748b; display:flex; align-items:center; }
    .pg-btn:disabled { opacity:.4; cursor:not-allowed; }
  `}</style>
)

export default function EnseignantsPersonnelPage() {
  const [enseignants, setEns] = useState<Enseignant[]>([])
  const [total, setTotal]     = useState(0)
  const [offset, setOffset]   = useState(0)
  const [search, setSearch]   = useState('')

  const fetchEns = useCallback((off: number) => {
    let url = `/enseignants/?limit=${PAGE_SIZE}&offset=${off}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    apiFetch<ApiList<Enseignant>>(url).then(d => { setEns(d.results); setTotal(d.count) }).catch(() => {})
  }, [search])

  useEffect(() => { setOffset(0); fetchEns(0) }, [fetchEns])

  const pages = Math.ceil(total / PAGE_SIZE)
  const page  = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div className="en">
      {ST}
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Enseignants</h1>
          <p className="pg-sub">Corps enseignant de l&apos;établissement</p>
        </div>
      </div>
      <div className="toolbar">
        <div className="search-box"><Search size={14} color="#94a3b8" /><input placeholder="Nom, email…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>
      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table className="tbl">
            <thead>
              <tr><th>Enseignant</th><th>Grade</th><th>Spécialité</th><th>Contact</th><th>État</th></tr>
            </thead>
            <tbody>
              {enseignants.length === 0 && <tr><td colSpan={5} className="empty">Aucun enseignant trouvé</td></tr>}
              {enseignants.map(e => (
                <tr key={e.id}>
                  <td>
                    <div className="tbl-name">{e.nom} {e.prenom}</div>
                    <div className="tbl-sub">{e.sexe === 'M' ? 'M.' : 'Mme'}</div>
                  </td>
                  <td>{e.grade_display}</td>
                  <td>{e.specialite_libelle ?? <span style={{ color:'#94a3b8' }}>—</span>}</td>
                  <td><div>{e.email || '—'}</div><div style={{ fontSize:'.73rem', color:'#94a3b8' }}>{e.tel || ''}</div></td>
                  <td>
                    <span className="badge" style={{ background: e.etat ? '#f0fdf4' : '#f1f5f9', color: e.etat ? '#10b981' : '#94a3b8' }}>
                      {e.etat ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > PAGE_SIZE && (
          <div className="pg-foot">
            <span className="pg-count">{total} enseignants — page {page}/{pages}</span>
            <div className="pg-btns">
              <button className="pg-btn" disabled={page<=1} onClick={() => { const n=offset-PAGE_SIZE; setOffset(n); fetchEns(n) }}><ChevronLeft size={14} /></button>
              <button className="pg-btn" disabled={page>=pages} onClick={() => { const n=offset+PAGE_SIZE; setOffset(n); fetchEns(n) }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
