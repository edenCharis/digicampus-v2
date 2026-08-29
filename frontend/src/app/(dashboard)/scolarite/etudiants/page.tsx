'use client'
import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Etudiant {
  id: number
  matricule: string
  nom: string
  prenom: string
  sexe: string
  email: string
  tel: string
  created_at: string
}

interface ApiList {
  count: number
  next: string | null
  previous: string | null
  results: Etudiant[]
}

const PAGE_SIZE = 20

export default function EtudiantsPage() {
  const [data, setData] = useState<ApiList | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ matricule: '', nom: '', prenom: '', sexe: 'M', email: '', tel: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('limit', String(PAGE_SIZE))
    params.set('offset', String((page - 1) * PAGE_SIZE))
    apiFetch<ApiList>(`/etudiants/?${params}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search, page])

  useEffect(() => { load() }, [load])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const user = JSON.parse(localStorage.getItem('dc_user') ?? '{}')
      await apiFetch('/etudiants/', {
        method: 'POST',
        body: JSON.stringify({ ...form, etablissement: user.etablissement }),
      })
      setShowForm(false)
      setForm({ matricule: '', nom: '', prenom: '', sexe: 'M', email: '', tel: '' })
      load()
    } catch (err: unknown) {
      const e = err as Record<string, string[]>
      setError(Object.values(e).flat().join(' ') || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  return (
    <div>
      <style>{`
        .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .page-title { font-size: 1.375rem; font-weight: 700; color: #1e293b; margin: 0; }
        .btn-primary { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; background: #1AAFE6; color: #fff; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
        .btn-primary:hover { background: #1490c2; }
        .search-bar { position: relative; margin-bottom: 1rem; }
        .search-bar input { width: 100%; max-width: 360px; padding: 0.5rem 0.75rem 0.5rem 2.25rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; outline: none; }
        .search-bar input:focus { border-color: #1AAFE6; }
        .search-icon { position: absolute; left: 0.625rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .table-wrap { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        th { background: #f8fafc; padding: 0.75rem 1rem; text-align: left; color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #e2e8f0; }
        td { padding: 0.875rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #f8fafc; }
        .badge { display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .badge-m { background: rgba(26,175,230,0.12); color: #1AAFE6; }
        .badge-f { background: rgba(236,72,153,0.12); color: #ec4899; }
        .pagination { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1rem; border-top: 1px solid #f1f5f9; }
        .pag-info { font-size: 0.8rem; color: #64748b; }
        .pag-btns { display: flex; gap: 0.375rem; }
        .pag-btn { padding: 0.375rem 0.625rem; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; cursor: pointer; color: #475569; font-size: 0.8125rem; display: flex; align-items: center; }
        .pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pag-btn.active { background: #1AAFE6; color: #fff; border-color: #1AAFE6; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .modal { background: #fff; border-radius: 16px; padding: 1.75rem; width: 100%; max-width: 520px; }
        .modal-title { font-size: 1.125rem; font-weight: 700; color: #1e293b; margin: 0 0 1.25rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { margin-bottom: 1rem; }
        .form-label { display: block; font-size: 0.8125rem; font-weight: 500; color: #475569; margin-bottom: 0.375rem; }
        .form-input { width: 100%; padding: 0.5625rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; outline: none; }
        .form-input:focus { border-color: #1AAFE6; }
        .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.25rem; }
        .btn-cancel { padding: 0.5rem 1rem; background: #f1f5f9; border: none; border-radius: 8px; color: #64748b; font-size: 0.875rem; cursor: pointer; }
        .error-box { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); border-radius: 8px; padding: 0.625rem 0.875rem; color: #dc2626; font-size: 0.875rem; margin-bottom: 1rem; }
        .empty-state { padding: 3rem 1rem; text-align: center; color: #94a3b8; }
        .avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #0E3358, #1AAFE6); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.75rem; font-weight: 600; flex-shrink: 0; }
        .student-cell { display: flex; align-items: center; gap: 0.625rem; }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">Étudiants</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Ajouter un étudiant
        </button>
      </div>

      <div className="search-bar">
        <span className="search-icon"><Search size={15} /></span>
        <input
          type="search"
          placeholder="Rechercher par matricule, nom ou prénom…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Étudiant</th>
              <th>Matricule</th>
              <th>Sexe</th>
              <th>Email</th>
              <th>Tél</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Chargement…</td></tr>
            ) : data?.results.length === 0 ? (
              <tr><td colSpan={5}><div className="empty-state"><User size={40} style={{ marginBottom: 8, opacity: 0.3 }} /><br />Aucun étudiant trouvé</div></td></tr>
            ) : data?.results.map((e) => (
              <tr key={e.id}>
                <td>
                  <div className="student-cell">
                    <div className="avatar">{e.nom[0]}{e.prenom[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{e.nom} {e.prenom}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#64748b' }}>{e.matricule}</td>
                <td><span className={`badge badge-${e.sexe.toLowerCase()}`}>{e.sexe === 'M' ? 'Masculin' : 'Féminin'}</span></td>
                <td style={{ color: '#64748b' }}>{e.email || '—'}</td>
                <td style={{ color: '#64748b' }}>{e.tel || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && data.count > 0 && (
          <div className="pagination">
            <span className="pag-info">
              {data.count} étudiant{data.count > 1 ? 's' : ''} · Page {page}/{totalPages}
            </span>
            <div className="pag-btns">
              <button className="pag-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </button>
              <button className="pag-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <h2 className="modal-title">Nouvel étudiant</h2>
            {error && <div className="error-box">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Matricule *</label>
                  <input className="form-input" value={form.matricule} onChange={e => setForm({ ...form, matricule: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Sexe</label>
                  <select className="form-input" value={form.sexe} onChange={e => setForm({ ...form, sexe: e.target.value })}>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input className="form-input" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Prénom *</label>
                  <input className="form-input" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input className="form-input" value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
