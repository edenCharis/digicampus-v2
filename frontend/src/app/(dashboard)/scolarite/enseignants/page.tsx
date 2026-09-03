'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, Users, Search, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const PAGE_SIZE = 20

interface Specialite { id: number; libelle: string; code: string }
interface Enseignant {
  id: number; nom: string; prenom: string; nom_complet: string; sexe: string
  email: string; tel: string; grade: string; grade_display: string
  specialite: number | null; specialite_libelle: string | null
  etat: boolean; etablissement: number
}
interface ApiList<T> { count: number; results: T[] }

const GRADES = [
  { value: 'professeur',   label: 'Professeur Titulaire' },
  { value: 'mcf',          label: 'Maître de Conférences' },
  { value: 'assistant',    label: 'Assistant' },
  { value: 'charge_cours', label: 'Chargé de Cours' },
  { value: 'vacataire',    label: 'Vacataire' },
  { value: 'autre',        label: 'Autre' },
]

const GRADE_COLORS: Record<string, { bg: string; color: string }> = {
  professeur:   { bg: 'rgba(139,92,246,0.1)',  color: '#8b5cf6' },
  mcf:          { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444' },
  assistant:    { bg: 'rgba(16,185,129,0.1)',   color: '#10b981' },
  charge_cours: { bg: 'rgba(245,158,11,0.1)',   color: '#f59e0b' },
  vacataire:    { bg: 'rgba(249,115,22,0.1)',   color: '#f97316' },
  autre:        { bg: 'rgba(100,116,139,0.1)',  color: '#64748b' },
}

const AVATAR_COLORS = ['#EF4444','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#3b82f6']
function av(nom: string) { return AVATAR_COLORS[nom.charCodeAt(0) % AVATAR_COLORS.length] }

function emptyForm() {
  return { nom: '', prenom: '', sexe: 'M', email: '', tel: '', grade: 'assistant', specialite: '', etat: true }
}

const STYLE = (
  <style>{`
    :root { --br: #e2e8f0; --bg: #f8fafc; }
    .sc-wrap { background:#fff; border:1px solid var(--br); border-radius:14px; overflow:hidden; }
    .sc-toolbar { display:flex; align-items:center; gap:.75rem; padding:.875rem 1.125rem; border-bottom:1px solid var(--br); flex-wrap:wrap; }
    .sc-search { display:flex; align-items:center; gap:.5rem; background:var(--bg); border:1px solid var(--br); border-radius:8px; padding:.45rem .75rem; flex:1; min-width:180px; max-width:320px; }
    .sc-search input { background:none; border:none; outline:none; font-size:.8125rem; color:#334155; width:100%; }
    .sc-search input::placeholder { color:#94a3b8; }
    .sc-sel { background:var(--bg); border:1px solid var(--br); border-radius:8px; padding:.45rem .75rem; font-size:.8125rem; color:#475569; cursor:pointer; outline:none; }
    .sc-sel:focus { border-color:#EF4444; }
    .sc-table { width:100%; border-collapse:collapse; }
    .sc-table th { padding:.75rem 1.125rem; text-align:left; font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid var(--br); background:var(--bg); white-space:nowrap; }
    .sc-table td { padding:.75rem 1.125rem; font-size:.8125rem; color:#334155; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
    .sc-table tr:last-child td { border-bottom:none; }
    .sc-table tr:hover td { background:#f8fafc; }
    .sc-avatar { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:.72rem; font-weight:700; color:#fff; flex-shrink:0; }
    .sc-row { display:flex; align-items:center; gap:.625rem; }
    .sc-primary { font-weight:600; color:#0f172a; }
    .sc-sub { font-size:.75rem; color:#94a3b8; margin-top:1px; }
    .sc-badge { display:inline-flex; align-items:center; padding:.25rem .625rem; border-radius:99px; font-size:.7rem; font-weight:700; white-space:nowrap; }
    .sc-actions { display:flex; align-items:center; gap:.25rem; }
    .sc-btn { padding:.35rem .5rem; border:none; background:none; border-radius:7px; cursor:pointer; color:#94a3b8; display:flex; align-items:center; transition:all .15s; }
    .sc-btn:hover { background:#f1f5f9; color:#475569; }
    .sc-btn.del:hover { background:rgba(239,68,68,0.08); color:#ef4444; }
    .sc-footer { display:flex; align-items:center; justify-content:space-between; padding:.75rem 1.125rem; border-top:1px solid var(--br); }
    .sc-count { font-size:.75rem; color:#94a3b8; }
    .sc-pager { display:flex; gap:.25rem; }
    .sc-pg { padding:.35rem .6rem; border:1px solid var(--br); border-radius:7px; background:#fff; font-size:.75rem; cursor:pointer; color:#64748b; transition:all .15s; min-width:2rem; text-align:center; }
    .sc-pg:hover { background:#f8fafc; }
    .sc-pg.cur { background:#EF4444; color:#fff; border-color:#EF4444; font-weight:700; }
    .sc-add { display:inline-flex; align-items:center; gap:.375rem; background:#EF4444; color:#fff; border:none; border-radius:9px; padding:.5rem 1rem; font-size:.8125rem; font-weight:600; cursor:pointer; transition:background .15s; white-space:nowrap; }
    .sc-add:hover { background:#DC2626; }
    .sc-empty { padding:2.5rem 1rem; text-align:center; color:#94a3b8; font-size:.875rem; }
    .pg-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
    .pg-title  { font-size:1.125rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
    .pg-sub    { font-size:.75rem; color:#94a3b8; margin:.25rem 0 0; }
    .mo { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
    @media(min-width:640px){ .mo { align-items:center; } }
    .mo-box { background:#fff; border-radius:16px 16px 0 0; width:100%; max-width:520px; max-height:92vh; overflow-y:auto; display:flex; flex-direction:column; }
    @media(min-width:640px){ .mo-box { border-radius:16px; } }
    .mo-head { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem 1rem; border-bottom:1px solid #f1f5f9; flex-shrink:0; }
    .mo-title { font-size:1rem; font-weight:700; color:#0f172a; }
    .mo-x { background:none; border:none; cursor:pointer; color:#94a3b8; padding:4px; border-radius:7px; }
    .mo-x:hover { background:#f1f5f9; color:#475569; }
    .mo-body { padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:.875rem; flex:1; }
    .mo-foot { display:flex; justify-content:flex-end; gap:.5rem; padding:1rem 1.5rem; border-top:1px solid #f1f5f9; flex-shrink:0; }
    .fl { display:flex; flex-direction:column; gap:.375rem; }
    .fl label { font-size:.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; }
    .fl label span { color:#ef4444; margin-left:2px; }
    .fl input, .fl select { width:100%; border:1px solid #e2e8f0; border-radius:9px; padding:.55rem .75rem; font-size:.875rem; color:#334155; outline:none; transition:border .15s; background:#fff; }
    .fl input:focus, .fl select:focus { border-color:#EF4444; }
    .fl-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:.875rem; }
    .fl-grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:.875rem; }
    .mo-section { font-size:.65rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:.1em; padding:.125rem 0; border-bottom:1px solid #f1f5f9; margin-bottom:.125rem; }
    .btn-cancel { background:#f1f5f9; border:none; border-radius:9px; padding:.55rem 1.125rem; font-size:.875rem; font-weight:600; color:#475569; cursor:pointer; }
    .btn-cancel:hover { background:#e2e8f0; }
    .btn-save { background:#EF4444; border:none; border-radius:9px; padding:.55rem 1.25rem; font-size:.875rem; font-weight:600; color:#fff; cursor:pointer; }
    .btn-save:hover { background:#DC2626; }
    .btn-save:disabled { opacity:.6; cursor:not-allowed; }
    .err { background:#fef2f2; border:1px solid #fecaca; border-radius:9px; padding:.65rem .875rem; font-size:.8rem; color:#dc2626; margin-bottom:.5rem; }
    .etat-dot { width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:5px; }
  `}</style>
)

export default function EnseignantsPage() {
  const [all, setAll]           = useState<Enseignant[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [search, setSearch]     = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [open, setOpen]         = useState(false)
  const [editTarget, setEditTarget] = useState<Enseignant | null>(null)
  const [form, setForm]         = useState(emptyForm())
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [delTarget, setDelTarget] = useState<Enseignant | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    apiFetch<ApiList<Enseignant>>('/enseignants/?limit=500')
      .then(r => setAll(r.results))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    apiFetch<ApiList<Specialite>>('/specialites/?limit=200')
      .then(r => setSpecialites(r.results)).catch(console.error)
  }, [])

  const filtered = useMemo(() => {
    let r = all
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(e => e.nom_complet.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
    }
    if (filterGrade) r = r.filter(e => e.grade === filterGrade)
    return r
  }, [all, search, filterGrade])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() {
    setEditTarget(null)
    setForm(emptyForm())
    setError(null); setOpen(true)
  }
  function openEdit(e: Enseignant) {
    setEditTarget(e)
    setForm({
      nom: e.nom, prenom: e.prenom, sexe: e.sexe,
      email: e.email, tel: e.tel, grade: e.grade,
      specialite: e.specialite?.toString() ?? '',
      etat: e.etat,
    })
    setError(null); setOpen(true)
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault(); setSaving(true); setError(null)
    try {
      const user = JSON.parse(localStorage.getItem('dc_user') ?? '{}')
      const body = {
        nom: form.nom, prenom: form.prenom, sexe: form.sexe,
        email: form.email, tel: form.tel, grade: form.grade,
        specialite: form.specialite ? Number(form.specialite) : null,
        etat: form.etat,
        etablissement: user.etablissement,
      }
      if (editTarget) {
        await apiFetch(`/enseignants/${editTarget.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      } else {
        await apiFetch('/enseignants/', { method: 'POST', body: JSON.stringify(body) })
      }
      setOpen(false); load()
    } catch (err: unknown) {
      const e = err as Record<string, string[]>
      setError(Object.values(e).flat().join(' ') || 'Erreur lors de l\'enregistrement')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!delTarget) return
    setDeleting(true)
    try {
      await apiFetch(`/enseignants/${delTarget.id}/`, { method: 'DELETE' })
      setDelTarget(null); load()
    } catch { setDeleting(false) }
  }

  function pagerPages(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const arr: (number | '…')[] = [1]
    if (page > 3) arr.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) arr.push(i)
    if (page < totalPages - 2) arr.push('…')
    arr.push(totalPages)
    return arr
  }

  return (
    <>
      {STYLE}
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Enseignants</h1>
          <p className="pg-sub">{loading ? '…' : `${filtered.length} enseignant${filtered.length !== 1 ? 's' : ''}`}</p>
        </div>
        <button className="sc-add" onClick={openAdd}><Plus size={14} /> Ajouter</button>
      </div>

      <div className="sc-wrap">
        <div className="sc-toolbar">
          <div className="sc-search">
            <Search size={13} color="#94a3b8" />
            <input placeholder="Nom, prénom, email…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="sc-sel" value={filterGrade}
            onChange={e => { setFilterGrade(e.target.value); setPage(1) }}>
            <option value="">Tous grades</option>
            {GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="sc-table">
            <thead>
              <tr>
                <th>Enseignant</th>
                <th>Grade</th>
                <th>Spécialité</th>
                <th>Contact</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="sc-empty">Chargement…</td></tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="sc-empty">
                    <Users size={36} color="#e2e8f0" style={{ margin: '0 auto .5rem', display: 'block' }} />
                    Aucun enseignant trouvé
                  </td>
                </tr>
              ) : paged.map(ens => {
                const gc = GRADE_COLORS[ens.grade] ?? { bg: '#f1f5f9', color: '#64748b' }
                return (
                  <tr key={ens.id}>
                    <td>
                      <div className="sc-row">
                        <div className="sc-avatar" style={{ background: av(ens.nom) }}>
                          {(ens.nom[0] ?? '?').toUpperCase()}{(ens.prenom[0] ?? '').toUpperCase()}
                        </div>
                        <div>
                          <div className="sc-primary">{ens.nom} {ens.prenom}</div>
                          <div className="sc-sub">{ens.sexe === 'F' ? 'F' : 'M'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="sc-badge" style={{ background: gc.bg, color: gc.color }}>
                        {ens.grade_display}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{ens.specialite_libelle ?? <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                    <td>
                      <div style={{ fontSize: '.8rem', color: '#475569' }}>{ens.email || <span style={{ color: '#cbd5e1' }}>—</span>}</div>
                      <div style={{ fontSize: '.75rem', color: '#94a3b8' }}>{ens.tel}</div>
                    </td>
                    <td>
                      {ens.etat
                        ? <span className="sc-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            <span className="etat-dot" style={{ background: '#10b981' }} />Actif
                          </span>
                        : <span className="sc-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            <span className="etat-dot" style={{ background: '#ef4444' }} />Inactif
                          </span>
                      }
                    </td>
                    <td>
                      <div className="sc-actions">
                        <button className="sc-btn" onClick={() => openEdit(ens)} title="Modifier"><Pencil size={14} /></button>
                        <button className="sc-btn del" onClick={() => setDelTarget(ens)} title="Supprimer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="sc-footer">
            <span className="sc-count">{filtered.length} enseignant{filtered.length !== 1 ? 's' : ''} · Page {page}/{totalPages}</span>
            <div className="sc-pager">
              {pagerPages().map((p, i) =>
                p === '…'
                  ? <span key={i} className="sc-pg dot">…</span>
                  : <button key={p} className={`sc-pg${page === p ? ' cur' : ''}`} onClick={() => setPage(p as number)}>{p}</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {open && (
        <div className="mo" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="mo-box">
            <div className="mo-head">
              <span className="mo-title">{editTarget ? 'Modifier l\'enseignant' : 'Nouvel enseignant'}</span>
              <button className="mo-x" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="mo-body">
                {error && <div className="err">{error}</div>}

                <div className="mo-section">Identité</div>
                <div className="fl-grid2">
                  <div className="fl">
                    <label>Nom <span>*</span></label>
                    <input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="MAKAYA" />
                  </div>
                  <div className="fl">
                    <label>Prénom <span>*</span></label>
                    <input required value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Arsène" />
                  </div>
                </div>
                <div className="fl-grid2">
                  <div className="fl">
                    <label>Sexe</label>
                    <select value={form.sexe} onChange={e => setForm({ ...form, sexe: e.target.value })}>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                  <div className="fl">
                    <label>Grade <span>*</span></label>
                    <select required value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
                      {GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mo-section">Contact</div>
                <div className="fl-grid2">
                  <div className="fl">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="nom@exemple.com" />
                  </div>
                  <div className="fl">
                    <label>Téléphone</label>
                    <input value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} placeholder="+242 06 000 0000" />
                  </div>
                </div>

                <div className="mo-section">Affectation</div>
                <div className="fl-grid2">
                  <div className="fl">
                    <label>Spécialité</label>
                    <select value={form.specialite} onChange={e => setForm({ ...form, specialite: e.target.value })}>
                      <option value="">— Aucune —</option>
                      {specialites.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                    </select>
                  </div>
                  <div className="fl">
                    <label>Statut</label>
                    <select value={form.etat ? 'true' : 'false'} onChange={e => setForm({ ...form, etat: e.target.value === 'true' })}>
                      <option value="true">Actif</option>
                      <option value="false">Inactif</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mo-foot">
                <button type="button" className="btn-cancel" onClick={() => setOpen(false)}>Annuler</button>
                <button type="submit" className="btn-save" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delTarget && (
        <div className="mo" onClick={e => e.target === e.currentTarget && setDelTarget(null)}>
          <div className="mo-box" style={{ maxWidth: 400 }}>
            <div className="mo-head">
              <span className="mo-title">Supprimer l&apos;enseignant</span>
              <button className="mo-x" onClick={() => setDelTarget(null)}><X size={16} /></button>
            </div>
            <div className="mo-body">
              <p style={{ fontSize: '.875rem', color: '#475569' }}>
                Confirmer la suppression de <strong>{delTarget.nom_complet}</strong> ?
                Cette action est irréversible.
              </p>
            </div>
            <div className="mo-foot">
              <button className="btn-cancel" onClick={() => setDelTarget(null)}>Annuler</button>
              <button className="btn-save" style={{ background: '#ef4444' }}
                onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
