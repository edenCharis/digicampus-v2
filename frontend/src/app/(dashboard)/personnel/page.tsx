'use client'
import { useEffect, useState, useCallback } from 'react'
import { Users, UserCheck, Clock, Building2, CalendarDays } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'

interface Stats { total: number; actifs: number; en_conge: number; departements: number; conges_en_attente: number }

const ST = (
  <style>{`
    .rh { max-width:1100px; margin:0 auto; }
    .pg-title { font-size:1.25rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0 0 .25rem; }
    .pg-sub { font-size:.8rem; color:#94a3b8; margin:0 0 1.75rem; }
    .kpi-row { display:grid; grid-template-columns:repeat(5,1fr); gap:.875rem; margin-bottom:1.5rem; }
    @media(max-width:800px){ .kpi-row { grid-template-columns:repeat(3,1fr); } }
    @media(max-width:500px){ .kpi-row { grid-template-columns:repeat(2,1fr); } }
    .kpi { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:1rem 1.25rem; text-decoration:none; display:flex; flex-direction:column; gap:.25rem; transition:box-shadow .15s; }
    .kpi:hover { box-shadow:0 4px 16px rgba(0,0,0,.08); }
    .kpi-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; margin-bottom:.625rem; }
    .kpi-val { font-size:1.625rem; font-weight:800; color:#0f172a; letter-spacing:-.03em; line-height:1; }
    .kpi-label { font-size:.72rem; color:#94a3b8; font-weight:500; margin-top:.25rem; }
    .nav-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
    @media(max-width:600px){ .nav-grid { grid-template-columns:1fr 1fr; } }
    .nav-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:1.5rem; text-decoration:none; display:flex; flex-direction:column; gap:.5rem; transition:all .15s; }
    .nav-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.08); border-color:#ec4899; }
    .nav-card-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:.25rem; }
    .nav-card-title { font-size:.9375rem; font-weight:700; color:#0f172a; }
    .nav-card-sub { font-size:.78rem; color:#94a3b8; }
  `}</style>
)

export default function PersonnelDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  const fetchStats = useCallback(() => {
    apiFetch<Stats>('/personnel/stats/').then(setStats).catch(() => {})
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const KPI = [
    { icon: <Users size={16} color="#ec4899" />, bg:'rgba(236,72,153,0.1)', val: stats?.total ?? '—', label:'Total agents', href:'/personnel/agents' },
    { icon: <UserCheck size={16} color="#10b981" />, bg:'rgba(16,185,129,0.1)', val: stats?.actifs ?? '—', label:'Actifs', href:'/personnel/agents' },
    { icon: <Clock size={16} color="#ca8a04" />, bg:'rgba(202,138,4,0.1)', val: stats?.en_conge ?? '—', label:'En congé', href:'/personnel/conges' },
    { icon: <Building2 size={16} color="#8b5cf6" />, bg:'rgba(139,92,246,0.1)', val: stats?.departements ?? '—', label:'Départements', href:'/personnel/departements' },
    { icon: <CalendarDays size={16} color="#ef4444" />, bg:'rgba(239,68,68,0.1)', val: stats?.conges_en_attente ?? '—', label:'Congés en attente', href:'/personnel/conges' },
  ]

  const NAV = [
    { icon: <Users size={20} color="#ec4899" />, bg:'rgba(236,72,153,0.1)', title:'Agents', sub:'Gérer le personnel administratif', href:'/personnel/agents' },
    { icon: <UserCheck size={20} color="#6366f1" />, bg:'rgba(99,102,241,0.1)', title:'Enseignants', sub:'Corps enseignant de l\'établissement', href:'/personnel/enseignants' },
    { icon: <CalendarDays size={20} color="#ca8a04" />, bg:'rgba(202,138,4,0.1)', title:'Congés', sub:'Demandes et suivi des congés', href:'/personnel/conges' },
    { icon: <Building2 size={20} color="#8b5cf6" />, bg:'rgba(139,92,246,0.1)', title:'Départements', sub:'Services et départements', href:'/personnel/departements' },
  ]

  return (
    <div className="rh">
      {ST}
      <h1 className="pg-title">Gestion du Personnel</h1>
      <p className="pg-sub">Administration des ressources humaines</p>

      <div className="kpi-row">
        {KPI.map((k, i) => (
          <Link href={k.href} key={i} className="kpi">
            <div className="kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-label">{k.label}</div>
          </Link>
        ))}
      </div>

      <div className="nav-grid">
        {NAV.map((n, i) => (
          <Link href={n.href} key={i} className="nav-card">
            <div className="nav-card-icon" style={{ background: n.bg }}>{n.icon}</div>
            <div className="nav-card-title">{n.title}</div>
            <div className="nav-card-sub">{n.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
