'use client'
import { useEffect, useState } from 'react'
import { Layers, LayoutGrid, CalendarDays, BookOpen } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface Annee { id: number; libelle: string; is_active: boolean }
interface ApiList<T> { count: number; results: T[] }

const ST = (
  <style>{`
    .ens-db { max-width:900px; margin:0 auto; }
    .pg-title { font-size:1.25rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0 0 .25rem; }
    .pg-sub { font-size:.8rem; color:#94a3b8; margin:0 0 1.75rem; }
    .kpi-row { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1.5rem; }
    @media(max-width:600px){ .kpi-row { grid-template-columns:1fr 1fr; } }
    .kpi { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:1.25rem 1.5rem; text-decoration:none; display:flex; flex-direction:column; gap:.25rem; transition:box-shadow .15s; }
    .kpi:hover { box-shadow:0 4px 16px rgba(0,0,0,.08); }
    .kpi-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:.5rem; }
    .kpi-val { font-size:1.75rem; font-weight:800; color:#0f172a; letter-spacing:-.03em; }
    .kpi-label { font-size:.75rem; color:#94a3b8; font-weight:500; }
    .annee-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:1.25rem 1.5rem; display:flex; align-items:center; gap:1rem; }
    .annee-badge { background:rgba(239,68,68,0.1); color:#EF4444; border:1px solid rgba(239,68,68,0.2); border-radius:99px; padding:.3rem .875rem; font-size:.75rem; font-weight:700; }
    .annee-label { font-size:1rem; font-weight:700; color:#0f172a; }
    .annee-sub { font-size:.78rem; color:#94a3b8; }
  `}</style>
)

export default function EnseignantDashboard() {
  const { user } = useAuth()
  const [anneeActive, setAnnee] = useState<Annee | null>(null)
  const [nbEcues, setNbEcues]   = useState<number | null>(null)
  const [nbClasses, setNbCls]   = useState<number | null>(null)

  useEffect(() => {
    apiFetch<ApiList<Annee>>('/annees/?limit=10').then(d => {
      setAnnee(d.results.find(a => a.is_active) ?? d.results[0] ?? null)
    }).catch(() => {})
    apiFetch<ApiList<unknown>>('/ecues/?limit=1').then(d => setNbEcues(d.count)).catch(() => {})
    apiFetch<ApiList<unknown>>('/classes/?limit=1').then(d => setNbCls(d.count)).catch(() => {})
  }, [])

  return (
    <div className="ens-db">
      {ST}
      <h1 className="pg-title">Bonjour, {user?.nom || 'Enseignant'}</h1>
      <p className="pg-sub">Tableau de bord — espace enseignant</p>

      {anneeActive && (
        <div className="annee-card" style={{ marginBottom:'1.5rem' }}>
          <CalendarDays size={20} color="#EF4444" />
          <div>
            <div className="annee-label">{anneeActive.libelle}</div>
            <div className="annee-sub">Année académique en cours</div>
          </div>
          <span className="annee-badge">Active</span>
        </div>
      )}

      <div className="kpi-row">
        <Link href="/enseignant/ecues" className="kpi">
          <div className="kpi-icon" style={{ background:'rgba(99,102,241,0.1)' }}><Layers size={18} color="#6366f1" /></div>
          <div className="kpi-val">{nbEcues ?? '—'}</div>
          <div className="kpi-label">ECUEs disponibles</div>
        </Link>
        <Link href="/enseignant/classes" className="kpi">
          <div className="kpi-icon" style={{ background:'rgba(16,185,129,0.1)' }}><LayoutGrid size={18} color="#10b981" /></div>
          <div className="kpi-val">{nbClasses ?? '—'}</div>
          <div className="kpi-label">Classes</div>
        </Link>
        <Link href="/enseignant/annee" className="kpi">
          <div className="kpi-icon" style={{ background:'rgba(239,68,68,0.1)' }}><CalendarDays size={18} color="#EF4444" /></div>
          <div className="kpi-val">{anneeActive?.libelle ?? '—'}</div>
          <div className="kpi-label">Année académique</div>
        </Link>
      </div>
    </div>
  )
}
