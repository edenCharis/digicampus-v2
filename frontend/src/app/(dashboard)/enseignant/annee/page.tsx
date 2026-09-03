'use client'
import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Annee { id: number; libelle: string; is_active: boolean }
interface ApiList<T> { count: number; results: T[] }

const ST = (
  <style>{`
    .an { max-width:700px; margin:0 auto; }
    .pg-title { font-size:1.25rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0 0 .25rem; }
    .pg-sub { font-size:.8rem; color:#94a3b8; margin:0 0 1.5rem; }
    .an-active { background:rgba(239,68,68,0.06); border:1.5px solid rgba(239,68,68,0.25); border-radius:16px; padding:1.5rem 2rem; display:flex; align-items:center; gap:1.25rem; margin-bottom:1.5rem; }
    .an-active-label { font-size:1.5rem; font-weight:800; color:#0f172a; letter-spacing:-.03em; }
    .an-active-sub { font-size:.8125rem; color:#94a3b8; margin-top:.25rem; }
    .an-list { background:#fff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; }
    .an-row { display:flex; align-items:center; justify-content:space-between; padding:.875rem 1.25rem; border-bottom:1px solid #f1f5f9; }
    .an-row:last-child { border-bottom:none; }
    .an-libelle { font-size:.875rem; font-weight:600; color:#0f172a; }
    .badge { display:inline-flex; align-items:center; padding:.2rem .6rem; border-radius:99px; font-size:.7rem; font-weight:700; }
    .empty { padding:3rem 1rem; text-align:center; color:#94a3b8; font-size:.875rem; }
  `}</style>
)

export default function AnneeEnseignantPage() {
  const [annees, setAnnees] = useState<Annee[]>([])

  useEffect(() => {
    apiFetch<ApiList<Annee>>('/annees/?limit=20').then(d => setAnnees(d.results)).catch(() => {})
  }, [])

  const active = annees.find(a => a.is_active)

  return (
    <div className="an">
      {ST}
      <h1 className="pg-title">Année académique</h1>
      <p className="pg-sub">Années académiques de l&apos;établissement</p>

      {active && (
        <div className="an-active">
          <div style={{ width:48, height:48, borderRadius:12, background:'rgba(239,68,68,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <CalendarDays size={22} color="#EF4444" />
          </div>
          <div>
            <div className="an-active-label">{active.libelle}</div>
            <div className="an-active-sub">Année en cours</div>
          </div>
          <CheckCircle2 size={22} color="#10b981" style={{ marginLeft:'auto', flexShrink:0 }} />
        </div>
      )}

      <div className="an-list">
        {annees.length === 0 && <div className="empty">Aucune année trouvée</div>}
        {annees.map(a => (
          <div className="an-row" key={a.id}>
            <span className="an-libelle">{a.libelle}</span>
            {a.is_active
              ? <span className="badge" style={{ background:'#f0fdf4', color:'#10b981' }}>Active</span>
              : <span className="badge" style={{ background:'#f1f5f9', color:'#94a3b8' }}>Terminée</span>
            }
          </div>
        ))}
      </div>
    </div>
  )
}
