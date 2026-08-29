'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, ClipboardList, BookOpen, LayoutGrid, UserCheck } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Stats {
  etudiants: number
  classes: number
  ues: number
  inscriptions: number
  annee_active: string | null
}

export default function ScolariteDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    apiFetch<Stats>('/stats/').then(setStats).catch(console.error)
  }, [])

  const fmt = (n: number | undefined) => n ?? '…'

  const cards = [
    { label: 'Étudiants', value: fmt(stats?.etudiants), icon: <Users size={22} />, color: '#1AAFE6', href: '/scolarite/etudiants' },
    { label: 'Inscriptions', value: fmt(stats?.inscriptions), icon: <ClipboardList size={22} />, color: '#22c55e', href: '/scolarite/inscriptions', sub: stats?.annee_active ?? '—' },
    { label: 'Classes', value: fmt(stats?.classes), icon: <LayoutGrid size={22} />, color: '#8b5cf6', href: '/scolarite/classes' },
    { label: 'UEs', value: fmt(stats?.ues), icon: <BookOpen size={22} />, color: '#f59e0b', href: '/scolarite/ues' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>
          Scolarité
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
          Gestion des étudiants, inscriptions et paramétrage académique
          {stats?.annee_active && (
            <span style={{ marginLeft: 8, color: '#1AAFE6', fontWeight: 600 }}>· {stats.annee_active}</span>
          )}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {cards.map((c) => (
          <Link key={c.label} href={c.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.color}18` }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>{c.label}</span>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color }}>
                  {c.icon}
                </div>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{c.value}</div>
              {c.sub && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>{c.sub}</div>}
            </div>
          </Link>
        ))}
      </div>

      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: '0 0 1rem' }}>Actions rapides</h2>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Nouvel étudiant', href: '/scolarite/etudiants?new=1' },
          { label: 'Nouvelle inscription', href: '/scolarite/inscriptions?new=1' },
          { label: 'Gérer les classes', href: '/scolarite/classes' },
          { label: 'Gérer les UEs', href: '/scolarite/ues' },
        ].map((a) => (
          <Link key={a.label} href={a.href} style={{
            padding: '0.5rem 1rem',
            background: '#fff',
            border: '1px solid #1AAFE6',
            borderRadius: 8,
            color: '#1AAFE6',
            fontWeight: 500,
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}>
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
