'use client'
import { useEffect, useState } from 'react'
import { Users, BookOpen, GraduationCap, Building2, ClipboardList, BookMarked } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Stats {
  universites: number
  etablissements: number
  utilisateurs: number
  etudiants: number
  classes: number
  ues: number
  inscriptions: number
  annee_active: string | null
}

interface KpiCardProps {
  title: string
  value: number | string
  sub?: string
  icon: React.ReactNode
  color: string
}

function KpiCard({ title, value, sub, icon, color }: KpiCardProps) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '1.25rem',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>{title}</span>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>{icon}</div>
      </div>
      <div>
        <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<Stats>('/stats/')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number | undefined) => loading ? '…' : (n ?? 0)

  const kpis = [
    { title: 'Universités', value: fmt(stats?.universites), icon: <Building2 size={20} />, color: '#1AAFE6' },
    { title: 'Établissements', value: fmt(stats?.etablissements), icon: <GraduationCap size={20} />, color: '#8b5cf6', sub: 'Facultés / écoles' },
    { title: 'Utilisateurs', value: fmt(stats?.utilisateurs), icon: <Users size={20} />, color: '#f59e0b', sub: 'Comptes actifs' },
    { title: 'Étudiants', value: fmt(stats?.etudiants), icon: <Users size={20} />, color: '#22c55e', sub: stats?.annee_active ?? 'Aucune année active' },
    { title: 'Inscriptions', value: fmt(stats?.inscriptions), icon: <ClipboardList size={20} />, color: '#ef4444', sub: stats?.annee_active ?? '—' },
    { title: 'UE / Cours', value: fmt(stats?.ues), icon: <BookOpen size={20} />, color: '#0ea5e9', sub: `${fmt(stats?.classes)} classes` },
  ]

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>
          Tableau de bord — Administration
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
          Vue d&apos;ensemble du système DigitalCampus
          {stats?.annee_active && <span style={{ marginLeft: 8, color: '#1AAFE6', fontWeight: 600 }}>· {stats.annee_active}</span>}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {kpis.map((k) => <KpiCard key={k.title} {...k} />)}
      </div>

      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: '0 0 1rem' }}>Accès rapide</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Universités', icon: <Building2 size={20} />, href: '/administrateur/universites' },
          { label: 'Établissements', icon: <GraduationCap size={20} />, href: '/administrateur/etablissements' },
          { label: 'Utilisateurs', icon: <Users size={20} />, href: '/administrateur/utilisateurs' },
          { label: 'UE & ECUE', icon: <BookOpen size={20} />, href: '/scolarite/ues' },
          { label: 'Étudiants', icon: <Users size={20} />, href: '/scolarite/etudiants' },
          { label: 'Inscriptions', icon: <ClipboardList size={20} />, href: '/scolarite/inscriptions' },
        ].map((a) => (
          <a key={a.label} href={a.href} style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            color: '#475569',
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'border-color 0.15s',
            textAlign: 'center',
          }}
            onMouseOver={e => (e.currentTarget.style.borderColor = '#1AAFE6')}
            onMouseOut={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
          >
            <div style={{
              width: 40, height: 40, background: 'rgba(26,175,230,0.1)',
              borderRadius: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#1AAFE6',
            }}>{a.icon}</div>
            {a.label}
          </a>
        ))}
      </div>
    </div>
  )
}
