'use client'
import { Users, BookOpen, GraduationCap, Building2, TrendingUp, UserCheck } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: string
  trend?: string
}

function KpiCard({ title, value, sub, icon, color, trend }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <style>{`
        .kpi-card {
          background: #fff;
          border-radius: 12px;
          padding: 1.25rem;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .kpi-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .kpi-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .kpi-label {
          font-size: 0.8125rem;
          color: #64748b;
          font-weight: 500;
        }
        .kpi-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
        }
        .kpi-sub {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        .kpi-trend {
          font-size: 0.75rem;
          color: #22c55e;
          font-weight: 500;
        }
      `}</style>
      <div className="kpi-top">
        <span className="kpi-label">{title}</span>
        <div className="kpi-icon" style={{ background: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div>
        <div className="kpi-value">{value}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
      {trend && <div className="kpi-trend">{trend}</div>}
    </div>
  )
}

export default function AdminDashboard() {
  const kpis = [
    { title: 'Universités', value: '—', sub: 'Chargement…', icon: <Building2 size={20} />, color: '#1AAFE6' },
    { title: 'Établissements', value: '—', sub: 'Chargement…', icon: <GraduationCap size={20} />, color: '#8b5cf6' },
    { title: 'Utilisateurs', value: '—', sub: 'Chargement…', icon: <Users size={20} />, color: '#f59e0b' },
    { title: 'Étudiants actifs', value: '—', sub: 'Chargement…', icon: <UserCheck size={20} />, color: '#22c55e' },
    { title: 'Cours', value: '—', sub: 'Chargement…', icon: <BookOpen size={20} />, color: '#ef4444' },
    { title: 'Taux de réussite', value: '—', sub: 'Délibérations', icon: <TrendingUp size={20} />, color: '#0ea5e9' },
  ]

  return (
    <div>
      <style>{`
        .page-header {
          margin-bottom: 1.75rem;
        }
        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.25rem;
        }
        .page-sub {
          color: #64748b;
          font-size: 0.875rem;
          margin: 0;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 1rem;
        }
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 0.75rem;
        }
        .quick-action {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: #475569;
          font-size: 0.875rem;
          font-weight: 500;
          transition: border-color 0.15s, box-shadow 0.15s;
          text-align: center;
        }
        .quick-action:hover {
          border-color: #1AAFE6;
          box-shadow: 0 0 0 3px rgba(26,175,230,0.08);
          color: #1AAFE6;
        }
        .quick-action-icon {
          width: 40px;
          height: 40px;
          background: rgba(26,175,230,0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1AAFE6;
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">Tableau de bord — Administration</h1>
        <p className="page-sub">Vue d&apos;ensemble du système DigitalCampus</p>
      </div>

      <div className="kpi-grid">
        {kpis.map((k) => (
          <KpiCard key={k.title} {...k} />
        ))}
      </div>

      <h2 className="section-title">Accès rapide</h2>
      <div className="quick-actions">
        {[
          { label: 'Universités', icon: <Building2 size={20} />, href: '/administrateur/universites' },
          { label: 'Établissements', icon: <GraduationCap size={20} />, href: '/administrateur/etablissements' },
          { label: 'Utilisateurs', icon: <Users size={20} />, href: '/administrateur/utilisateurs' },
          { label: 'Cours', icon: <BookOpen size={20} />, href: '/cours' },
        ].map((a) => (
          <a key={a.label} href={a.href} className="quick-action">
            <div className="quick-action-icon">{a.icon}</div>
            {a.label}
          </a>
        ))}
      </div>
    </div>
  )
}
