'use client'
import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, BookOpen, Trash2, PlusCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Specialite { id: number; libelle: string; code: string }
interface ECUE { id?: number; code: string; libelle: string; credits: number; coefficient: number; ue?: number }
interface UE {
  id: number
  code: string
  libelle: string
  semestre: string
  niveau: string
  credits: number
  specialite: number
  specialite_libelle: string
  etablissement: number
  ecues: ECUE[]
}
interface ApiList<T> { count: number; next: string | null; previous: string | null; results: T[] }

const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3']
const SEMESTRES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10']
const PAGE_SIZE = 25

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
  td: { padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9', color: '#1e293b', fontSize: '0.875rem', verticalAlign: 'top' as const },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderTop: '1px solid #f1f5f9' },
  pagInfo: { fontSize: '0.8rem', color: '#64748b' },
  pagBtns: { display: 'flex', gap: 4 },
  pagBtn: { padding: '0.375rem 0.625rem', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#475569' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal: { background: '#fff', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' as const },
  modalTitle: { fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.25rem' },
  formGroup: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#475569', marginBottom: 6 },
  input: { width: '100%', padding: '0.5625rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  formRow3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' },
  formActions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' },
  btnCancel: { padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: 8, color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' },
  errBox: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.625rem 0.875rem', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' },
  empty: { padding: '3rem', textAlign: 'center' as const, color: '#94a3b8' },
  ecueRow: { display: 'grid', gridTemplateColumns: '1fr 2fr auto auto auto', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' },
  ecueInput: { padding: '0.4rem 0.6rem', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.8rem', outline: 'none', width: '100%' },
  sectionLabel: { fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.625rem', marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  btnAddEcue: { display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#1AAFE6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 },
  btnDeleteEcue: { background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 4px', display: 'flex', alignItems: 'center' },
  semBadge: { display: 'inline-flex', alignItems: 'center', padding: '0.175rem 0.5rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 },
  ecueChip: { display: 'inline-flex', alignItems: 'center', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', background: 'rgba(26,175,230,0.1)', color: '#1AAFE6', margin: '2px', fontWeight: 500 },
}

const semColor: Record<string, { bg: string; text: string }> = {
  S1: { bg: 'rgba(26,175,230,0.12)', text: '#1AAFE6' }, S2: { bg: 'rgba(14,165,233,0.12)', text: '#0ea5e9' },
  S3: { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6' }, S4: { bg: 'rgba(124,58,237,0.12)', text: '#7c3aed' },
  S5: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' }, S6: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  S7: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' }, S8: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
}

function emptyEcue(): ECUE { return { code: '', libelle: '', credits: 0, coefficient: 1 } }

export default function UEsPage() {
  const [data, setData] = useState<ApiList<UE> | null>(null)
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [search, setSearch] = useState('')
  const [filterNiveau, setFilterNiveau] = useState('')
  const [filterSem, setFilterSem] = useState('')
  const [filterSpec, setFilterSpec] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<UE | null>(null)
  const [form, setForm] = useState({ code: '', libelle: '', niveau: 'L1', semestre: 'S1', credits: '', specialite: '' })
  const [ecues, setEcues] = useState<ECUE[]>([emptyEcue()])
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
    if (filterSem) params.set('semestre', filterSem)
    if (filterSpec) params.set('specialite', filterSpec)
    params.set('limit', String(PAGE_SIZE))
    params.set('offset', String((page - 1) * PAGE_SIZE))
    apiFetch<ApiList<UE>>(`/ues/?${params}`)
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [search, filterNiveau, filterSem, filterSpec, page])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditTarget(null)
    setForm({ code: '', libelle: '', niveau: 'L1', semestre: 'S1', credits: '', specialite: specialites[0]?.id.toString() ?? '' })
    setEcues([emptyEcue()])
    setError(null)
    setShowForm(true)
  }

  function openEdit(ue: UE) {
    setEditTarget(ue)
    setForm({ code: ue.code, libelle: ue.libelle, niveau: ue.niveau, semestre: ue.semestre, credits: ue.credits.toString(), specialite: ue.specialite.toString() })
    setEcues(ue.ecues.length > 0 ? ue.ecues.map(e => ({ ...e })) : [emptyEcue()])
    setError(null)
    setShowForm(true)
  }

  function updateEcue(idx: number, field: keyof ECUE, val: string) {
    setEcues(prev => prev.map((e, i) => i === idx ? { ...e, [field]: field === 'credits' || field === 'coefficient' ? Number(val) : val } : e))
  }

  function addEcue() { setEcues(prev => [...prev, emptyEcue()]) }
  function removeEcue(idx: number) { setEcues(prev => prev.filter((_, i) => i !== idx)) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const user = JSON.parse(localStorage.getItem('dc_user') ?? '{}')
      const ueBody = {
        code: form.code, libelle: form.libelle, niveau: form.niveau,
        semestre: form.semestre, credits: Number(form.credits) || 0,
        specialite: Number(form.specialite), etablissement: user.etablissement,
      }

      let ueId: number
      if (editTarget) {
        const updated = await apiFetch<UE>(`/ues/${editTarget.id}/`, { method: 'PATCH', body: JSON.stringify(ueBody) })
        ueId = updated.id
      } else {
        const created = await apiFetch<UE>('/ues/', { method: 'POST', body: JSON.stringify(ueBody) })
        ueId = created.id
      }

      // Save ECUEs
      const validEcues = ecues.filter(ec => ec.code.trim() && ec.libelle.trim())
      for (const ec of validEcues) {
        const ecueBody = { code: ec.code, libelle: ec.libelle, credits: ec.credits, coefficient: ec.coefficient, ue: ueId }
        if (ec.id) {
          await apiFetch(`/ecues/${ec.id}/`, { method: 'PATCH', body: JSON.stringify(ecueBody) })
        } else {
          await apiFetch('/ecues/', { method: 'POST', body: JSON.stringify(ecueBody) })
        }
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

  return (
    <div>
      <div style={S.pageHeader}>
        <h1 style={S.title}>Unités d&apos;Enseignement</h1>
        <button style={S.btnPrimary} onClick={openAdd}><Plus size={16} /> Ajouter une UE</button>
      </div>

      <div style={S.toolbar}>
        <div style={S.searchWrap}>
          <span style={S.searchIcon}><Search size={15} /></span>
          <input style={S.searchInput} placeholder="Rechercher par code ou libellé…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select style={S.select} value={filterNiveau} onChange={e => { setFilterNiveau(e.target.value); setPage(1) }}>
          <option value="">Tous niveaux</option>
          {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select style={S.select} value={filterSem} onChange={e => { setFilterSem(e.target.value); setPage(1) }}>
          <option value="">Tous semestres</option>
          {SEMESTRES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={S.select} value={filterSpec} onChange={e => { setFilterSpec(e.target.value); setPage(1) }}>
          <option value="">Toutes spécialités</option>
          {specialites.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
        </select>
      </div>

      <div style={S.tableWrap}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={S.th}>Code</th>
              <th style={S.th}>Libellé UE</th>
              <th style={S.th}>Sem.</th>
              <th style={S.th}>Niveau</th>
              <th style={S.th}>Crédits</th>
              <th style={S.th}>ECUEs</th>
              <th style={S.th}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#94a3b8' }}>Chargement…</td></tr>
            ) : data?.results.length === 0 ? (
              <tr><td colSpan={7}><div style={S.empty}><BookOpen size={40} style={{ marginBottom: 8, opacity: 0.3 }} /><br />Aucune UE trouvée</div></td></tr>
            ) : data?.results.map(ue => {
              const sc = semColor[ue.semestre] ?? { bg: 'rgba(100,116,139,0.12)', text: '#64748b' }
              return (
                <tr key={ue.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(ue)}>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem', color: '#1AAFE6' }}>{ue.code}</td>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600 }}>{ue.libelle}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{ue.specialite_libelle}</div>
                  </td>
                  <td style={S.td}>
                    <span style={{ ...S.semBadge, background: sc.bg, color: sc.text }}>{ue.semestre}</span>
                  </td>
                  <td style={{ ...S.td, color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>{ue.niveau}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{ue.credits}</td>
                  <td style={S.td}>
                    {ue.ecues.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {ue.ecues.map(ec => (
                          <span key={ec.id} style={S.ecueChip}>{ec.code}</span>
                        ))}
                      </div>
                    ) : <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>}
                  </td>
                  <td style={{ ...S.td, textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#1AAFE6', fontWeight: 500 }}>Modifier →</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {data && data.count > PAGE_SIZE && (
          <div style={S.pagination}>
            <span style={S.pagInfo}>{data.count} UE{data.count > 1 ? 's' : ''} · Page {page}/{totalPages}</span>
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
            <h2 style={S.modalTitle}>{editTarget ? 'Modifier l\'UE' : 'Nouvelle UE'}</h2>
            {error && <div style={S.errBox}>{error}</div>}
            <form onSubmit={handleSave}>
              {/* UE fields */}
              <div style={S.formRow}>
                <div style={S.formGroup}>
                  <label style={S.label}>Code UE *</label>
                  <input style={S.input} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required placeholder="ex: UE-INFO-101" />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Crédits</label>
                  <input style={S.input} type="number" min="0" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Libellé *</label>
                <input style={S.input} value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} required placeholder="ex: Algorithmique et Structures de Données" />
              </div>
              <div style={S.formRow3}>
                <div style={S.formGroup}>
                  <label style={S.label}>Niveau *</label>
                  <select style={S.input} value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })}>
                    {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Semestre *</label>
                  <select style={S.input} value={form.semestre} onChange={e => setForm({ ...form, semestre: e.target.value })}>
                    {SEMESTRES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Spécialité *</label>
                  <select style={S.input} value={form.specialite} onChange={e => setForm({ ...form, specialite: e.target.value })} required>
                    <option value="">— Choisir —</option>
                    {specialites.map(s => <option key={s.id} value={s.id}>{s.code} — {s.libelle}</option>)}
                  </select>
                </div>
              </div>

              {/* ECUEs section */}
              <div style={S.sectionLabel}>
                <span>ECUEs (éléments constitutifs)</span>
                <button type="button" style={S.btnAddEcue} onClick={addEcue}>
                  <PlusCircle size={14} /> Ajouter ECUE
                </button>
              </div>

              {/* ECUE header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto auto auto', gap: '0.5rem', marginBottom: '0.375rem' }}>
                {['Code', 'Libellé', 'Crédits', 'Coeff.', ''].map(h => (
                  <span key={h} style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
                ))}
              </div>

              {ecues.map((ec, idx) => (
                <div key={idx} style={S.ecueRow}>
                  <input style={S.ecueInput} placeholder="CODE" value={ec.code} onChange={e => updateEcue(idx, 'code', e.target.value)} />
                  <input style={S.ecueInput} placeholder="Libellé ECUE" value={ec.libelle} onChange={e => updateEcue(idx, 'libelle', e.target.value)} />
                  <input style={{ ...S.ecueInput, width: 54 }} type="number" min="0" placeholder="0" value={ec.credits} onChange={e => updateEcue(idx, 'credits', e.target.value)} />
                  <input style={{ ...S.ecueInput, width: 54 }} type="number" min="0" step="0.5" placeholder="1" value={ec.coefficient} onChange={e => updateEcue(idx, 'coefficient', e.target.value)} />
                  <button type="button" style={S.btnDeleteEcue} onClick={() => removeEcue(idx)} title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

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
