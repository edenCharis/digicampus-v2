'use client'
import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Specialite { id: number; libelle: string; code: string }
interface Classe {
  id: number
  libelle: string
  niveau: string
  effectif: number
  specialite: number
  specialite_libelle: string
  etablissement: number
}
interface ApiList<T> { count: number; next: string | null; previous: string | null; results: T[] }

const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3']
const PAGE_SIZE = 20

const S: Record<string, React.CSSProperties> = {
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  title: { fontSize: '1.375rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1rem', background: '#1AAFE6', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
  toolbar: { display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' },
  searchWrap: { position: 'relative', flex: 1, minWidth: 220, maxWidth: 340 },
  searchIcon: { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', outline: 'none' },
  select: { padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', outline: 'none', background: '#fff' },
  tableWrap: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' },
  th: { background: '#f8fafc', padding: '0.75rem 1rem', textAlign: 'left' as const, color: '#64748b', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#1e293b', fontSize: '0.875rem' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderTop: '1px solid #f1f5f9' },
  pagInfo: { fontSize: '0.8rem', color: '#64748b' },
  pagBtns: { display: 'flex', gap: 4 },
  pagBtn: { padding: '0.375rem 0.625rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#475569', fontSize: '0.8125rem' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal: { background: '#fff', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 480 },
  modalTitle: { fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.25rem' },
  formGroup: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#475569', marginBottom: 6 },
  input: { width: '100%', padding: '0.5625rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  formActions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' },
  btnCancel: { padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: 8, color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' },
  errBox: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.625rem 0.875rem', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
  empty: { padding: '3rem', textAlign: 'center' as const, color: '#94a3b8' },
}

export default function ClassesPage() {
  const [data, setData] = useState<ApiList<Classe> | null>(null)
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [search, setSearch] = useState('')
  const [filterNiveau, setFilterNiveau] = useState('')
  const [filterSpec, setFilterSpec] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Classe | null>(null)
  const [form, setForm] = useState({ libelle: '', niveau: 'L1', specialite: '', effectif: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<ApiList<Specialite>>('/specialites/?limit=200').then(r => setSpecialites(r.results)).catch(console.error)
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterNiveau) params.set('niveau', filterNiveau)
    if (filterSpec) params.set('specialite', filterSpec)
    params.set('limit', String(PAGE_SIZE))
    params.set('offset', String((page - 1) * PAGE_SIZE))
    apiFetch<ApiList<Classe>>(`/classes/?${params}`)
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [search, filterNiveau, filterSpec, page])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditTarget(null)
    setForm({ libelle: '', niveau: 'L1', specialite: specialites[0]?.id.toString() ?? '', effectif: '' })
    setError(null)
    setShowForm(true)
  }

  function openEdit(c: Classe) {
    setEditTarget(c)
    setForm({ libelle: c.libelle, niveau: c.niveau, specialite: c.specialite.toString(), effectif: c.effectif.toString() })
    setError(null)
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const user = JSON.parse(localStorage.getItem('dc_user') ?? '{}')
      const body = { libelle: form.libelle, niveau: form.niveau, specialite: Number(form.specialite), effectif: Number(form.effectif) || 0, etablissement: user.etablissement }
      if (editTarget) {
        await apiFetch(`/classes/${editTarget.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      } else {
        await apiFetch('/classes/', { method: 'POST', body: JSON.stringify(body) })
      }
      setShowForm(false)
      load()
    } catch (err: unknown) {
      const e = err as Record<string, string[]>
      setError(Object.values(e).flat().join(' ') || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0
  const niveauColor: Record<string, string> = { L1: '#1AAFE6', L2: '#0ea5e9', L3: '#06b6d4', M1: '#8b5cf6', M2: '#7c3aed', D1: '#f59e0b', D2: '#d97706', D3: '#b45309' }

  return (
    <div>
      <div style={S.pageHeader}>
        <h1 style={S.title}>Classes</h1>
        <button style={S.btnPrimary} onClick={openAdd}><Plus size={16} /> Ajouter une classe</button>
      </div>

      <div style={S.toolbar}>
        <div style={S.searchWrap}>
          <span style={S.searchIcon}><Search size={15} /></span>
          <input style={S.searchInput} placeholder="Rechercher une classe…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select style={S.select} value={filterNiveau} onChange={e => { setFilterNiveau(e.target.value); setPage(1) }}>
          <option value="">Tous les niveaux</option>
          {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select style={S.select} value={filterSpec} onChange={e => { setFilterSpec(e.target.value); setPage(1) }}>
          <option value="">Toutes les spécialités</option>
          {specialites.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
        </select>
      </div>

      <div style={S.tableWrap}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={S.th}>Classe</th>
              <th style={S.th}>Niveau</th>
              <th style={S.th}>Spécialité</th>
              <th style={S.th}>Effectif</th>
              <th style={S.th}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', color: '#94a3b8' }}>Chargement…</td></tr>
            ) : data?.results.length === 0 ? (
              <tr><td colSpan={5}><div style={S.empty}><LayoutGrid size={40} style={{ marginBottom: 8, opacity: 0.3 }} /><br />Aucune classe trouvée</div></td></tr>
            ) : data?.results.map(c => (
              <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(c)}>
                <td style={{ ...S.td, fontWeight: 600 }}>{c.libelle}</td>
                <td style={S.td}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: `${niveauColor[c.niveau] ?? '#64748b'}18`, color: niveauColor[c.niveau] ?? '#64748b' }}>
                    {c.niveau}
                  </span>
                </td>
                <td style={{ ...S.td, color: '#64748b' }}>{c.specialite_libelle}</td>
                <td style={S.td}>
                  <span style={{ fontWeight: 600, color: c.effectif > 0 ? '#1e293b' : '#94a3b8' }}>
                    {c.effectif > 0 ? c.effectif : '—'}
                  </span>
                  {c.effectif > 0 && <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: 4 }}>étudiants</span>}
                </td>
                <td style={{ ...S.td, textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#1AAFE6', fontWeight: 500 }}>Modifier →</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && data.count > PAGE_SIZE && (
          <div style={S.pagination}>
            <span style={S.pagInfo}>{data.count} classe{data.count > 1 ? 's' : ''} · Page {page}/{totalPages}</span>
            <div style={S.pagBtns}>
              <button style={S.pagBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
              <button style={S.pagBtn} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div style={S.modalOverlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>{editTarget ? 'Modifier la classe' : 'Nouvelle classe'}</h2>
            {error && <div style={S.errBox}>{error}</div>}
            <form onSubmit={handleSave}>
              <div style={S.formGroup}>
                <label style={S.label}>Libellé *</label>
                <input style={S.input} value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} required placeholder="ex: Licence 1 Informatique" />
              </div>
              <div style={S.formRow}>
                <div style={S.formGroup}>
                  <label style={S.label}>Niveau *</label>
                  <select style={S.input} value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })}>
                    {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Effectif</label>
                  <input style={S.input} type="number" min="0" value={form.effectif} onChange={e => setForm({ ...form, effectif: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Spécialité *</label>
                <select style={S.input} value={form.specialite} onChange={e => setForm({ ...form, specialite: e.target.value })} required>
                  <option value="">— Sélectionner —</option>
                  {specialites.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                </select>
              </div>
              <div style={S.formActions}>
                <button type="button" style={S.btnCancel} onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" style={S.btnPrimary} disabled={saving}>
                  {saving ? 'Enregistrement…' : editTarget ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
