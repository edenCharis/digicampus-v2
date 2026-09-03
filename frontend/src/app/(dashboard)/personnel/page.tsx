'use client'
import { Users, UserCheck, Briefcase, Clock } from 'lucide-react'

const STYLE = (
  <style>{`
    .rh-wrap { max-width: 1100px; margin: 0 auto; }
    .pg-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.75rem; flex-wrap:wrap; gap:.75rem; }
    .pg-title { font-size:1.375rem; font-weight:800; color:#0f172a; letter-spacing:-.03em; margin:0; }
    .pg-sub { font-size:.8125rem; color:#94a3b8; margin:.25rem 0 0; }

    .kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
    @media(max-width:700px){ .kpi-row { grid-template-columns:repeat(2,1fr); } }
    .kpi { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:.25rem; }
    .kpi-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:.5rem; }
    .kpi-val { font-size:1.75rem; font-weight:800; color:#0f172a; letter-spacing:-.03em; }
    .kpi-label { font-size:.75rem; color:#94a3b8; font-weight:500; }

    .soon-box { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:3.5rem 2rem; text-align:center; }
    .soon-icon { width:64px; height:64px; border-radius:50%; background:rgba(236,72,153,0.08); display:flex; align-items:center; justify-content:center; margin:0 auto 1rem; }
    .soon-title { font-size:1.1rem; font-weight:700; color:#0f172a; margin:0 0 .375rem; }
    .soon-desc { font-size:.875rem; color:#94a3b8; max-width:360px; margin:0 auto; line-height:1.6; }
  `}</style>
)

const KPI_DATA = [
  { icon: <Users size={18} color="#ec4899" />, bg: 'rgba(236,72,153,0.1)', val: '—', label: 'Agents' },
  { icon: <UserCheck size={18} color="#10b981" />, bg: 'rgba(16,185,129,0.1)', val: '—', label: 'Actifs' },
  { icon: <Briefcase size={18} color="#8b5cf6" />, bg: 'rgba(139,92,246,0.1)', val: '—', label: 'Départements' },
  { icon: <Clock size={18} color="#f59e0b" />, bg: 'rgba(245,158,11,0.1)', val: '—', label: 'En congé' },
]

export default function PersonnelPage() {
  return (
    <div className="rh-wrap">
      {STYLE}
      <div className="pg-head">
        <div>
          <h1 className="pg-title">Gestion du Personnel</h1>
          <p className="pg-sub">Administration des ressources humaines</p>
        </div>
      </div>

      <div className="kpi-row">
        {KPI_DATA.map((k, i) => (
          <div className="kpi" key={i}>
            <div className="kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="soon-box">
        <div className="soon-icon">
          <Users size={28} color="#ec4899" />
        </div>
        <h2 className="soon-title">Module en construction</h2>
        <p className="soon-desc">
          La gestion du personnel (agents, contrats, congés, départements) sera disponible prochainement.
        </p>
      </div>
    </div>
  )
}
