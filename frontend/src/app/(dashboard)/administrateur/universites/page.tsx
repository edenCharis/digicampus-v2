'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, MapPin, Mail, Phone, X, AlertTriangle, Search } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { University, ApiList } from '../_shared'

const CARD_ACCENTS = [
  { from: '#1AAFE6', to: '#0E80B8' },
  { from: '#8b5cf6', to: '#6d35d9' },
  { from: '#10b981', to: '#059669' },
  { from: '#f59e0b', to: '#d97706' },
  { from: '#ef4444', to: '#dc2626' },
  { from: '#06b6d4', to: '#0891b2' },
  { from: '#ec4899', to: '#db2777' },
  { from: '#14b8a6', to: '#0d9488' },
]

function monogram(libelle: string) {
  return libelle.split(' ').filter(w => w.length > 2).map(w => w[0]).join('').slice(0, 3).toUpperCase() || libelle.slice(0, 2).toUpperCase()
}

export default function UniversitesPage() {
  const [list, setList]       = useState<University[]>([])
  const [search, setSearch]   = useState('')
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<University | null>(null)
  const [delTarget, setDel]   = useState<University | null>(null)
  const [form, setForm]       = useState({ code: '', libelle: '', email_contact: '', tel_contact: '', ville: '' })
  const [err, setErr]         = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(() => {
    apiFetch<ApiList<University>>('/universities/').then(d => setList(d.results)).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  function openNew() {
    setEditing(null); setForm({ code: '', libelle: '', email_contact: '', tel_contact: '', ville: '' }); setErr(null); setOpen(true)
  }
  function openEdit(u: University) {
    setEditing(u); setForm({ code: u.code, libelle: u.libelle, email_contact: u.email_contact, tel_contact: u.tel_contact, ville: u.ville }); setErr(null); setOpen(true)
  }
  async function save() {
    if (!form.code.trim() || !form.libelle.trim()) { setErr('Le code et le libellé sont obligatoires.'); return }
    setSaving(true); setErr(null)
    try {
      if (!editing) await apiFetch('/universities/', { method: 'POST', body: JSON.stringify(form) })
      else await apiFetch(`/universities/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(form) })
      setOpen(false); load()
    } catch (e: unknown) {
      const msg = Object.values(e as Record<string, string[]>).flat().join(' ') || 'Erreur lors de la sauvegarde.'
      setErr(msg)
    } finally { setSaving(false) }
  }
  async function doDelete() {
    if (!delTarget) return
    await apiFetch(`/universities/${delTarget.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  const filtered = list.filter(u =>
    !search || u.libelle.toLowerCase().includes(search.toLowerCase()) || u.code.toLowerCase().includes(search.toLowerCase()) || u.ville.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <style>{`
        /* ── Header ── */
        .uv-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
        .uv-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin: 0; }
        .uv-sub { font-size: 0.8125rem; color: #94a3b8; margin-top: 3px; }
        .uv-actions { display: flex; align-items: center; gap: 0.625rem; }

        /* Search */
        .uv-search-wrap { position: relative; }
        .uv-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
        .uv-search {
          height: 36px; padding: 0 0.75rem 0 2rem; border-radius: 9px;
          border: 1px solid #e2e8f0; background: #fff; font-size: 0.8125rem; color: #1e293b;
          outline: none; width: 200px; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .uv-search:focus { border-color: #1AAFE6; box-shadow: 0 0 0 3px rgba(26,175,230,0.1); }

        /* Add button */
        .uv-add {
          height: 36px; padding: 0 1rem; border-radius: 9px; border: none; cursor: pointer;
          background: #1AAFE6; color: #fff; font-size: 0.8125rem; font-weight: 600;
          display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s;
          white-space: nowrap;
        }
        .uv-add:hover { background: #1490c2; }

        /* ── Grid ── */
        .uv-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        /* ── Card ── */
        .uv-card {
          background: #fff; border-radius: 16px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px rgba(15,23,42,0.05);
          overflow: hidden; position: relative;
          transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
          display: flex; flex-direction: column;
        }
        .uv-card:hover {
          box-shadow: 0 8px 24px rgba(15,23,42,0.1);
          transform: translateY(-2px);
          border-color: #e2e8f0;
        }
        .uv-card:hover .uv-card-actions { opacity: 1; }

        /* Top accent bar */
        .uv-accent { height: 4px; width: 100%; }

        /* Card body */
        .uv-card-body { padding: 1.25rem 1.25rem 1rem; flex: 1; }

        /* Monogram */
        .uv-mono-row { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1rem; }
        .uv-mono {
          width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.875rem; font-weight: 800; color: #fff; letter-spacing: -0.02em;
        }
        .uv-code-badge {
          font-size: 0.65rem; font-weight: 800; letter-spacing: 0.08em;
          padding: 0.2rem 0.6rem; border-radius: 20px; text-transform: uppercase;
          background: rgba(26,175,230,0.08); color: #1AAFE6; border: 1px solid rgba(26,175,230,0.12);
        }

        .uv-name {
          font-size: 1rem; font-weight: 700; color: #0f172a; line-height: 1.3;
          letter-spacing: -0.01em; margin: 0 0 0.5rem;
        }

        /* Meta info */
        .uv-meta { display: flex; flex-direction: column; gap: 0.375rem; }
        .uv-meta-row {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.75rem; color: #64748b;
        }
        .uv-meta-icon { color: #cbd5e1; flex-shrink: 0; }
        .uv-meta-val { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Card footer actions */
        .uv-card-foot {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid #f8fafc;
          display: flex; align-items: center; justify-content: space-between;
        }
        .uv-card-actions { display: flex; gap: 0.375rem; }
        .uv-btn-icon {
          width: 30px; height: 30px; border-radius: 8px; border: 1px solid #f1f5f9;
          background: #fff; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s; color: #94a3b8;
        }
        .uv-btn-icon:hover { background: #f8fafc; color: #475569; border-color: #e2e8f0; }
        .uv-btn-icon.danger:hover { background: rgba(239,68,68,0.05); color: #ef4444; border-color: rgba(239,68,68,0.2); }
        .uv-ville-chip {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.7rem; font-weight: 600; color: #94a3b8;
        }

        /* Empty state */
        .uv-empty {
          grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;
          display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
        }
        .uv-empty-icon {
          width: 56px; height: 56px; border-radius: 16px;
          background: rgba(26,175,230,0.06); border: 1px solid rgba(26,175,230,0.1);
          display: flex; align-items: center; justify-content: center; margin-bottom: 0.25rem;
        }
        .uv-empty-title { font-size: 0.9375rem; font-weight: 700; color: #1e293b; }
        .uv-empty-sub { font-size: 0.8125rem; color: #94a3b8; max-width: 280px; line-height: 1.6; }

        /* ── Modal ── */
        .uv-modal-bg {
          position: fixed; inset: 0; background: rgba(15,23,42,0.45);
          backdrop-filter: blur(4px); z-index: 200;
          display: flex; align-items: center; justify-content: center; padding: 1rem;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .uv-modal {
          background: #fff; border-radius: 18px; width: 100%; max-width: 480px;
          box-shadow: 0 24px 48px rgba(15,23,42,0.16);
          animation: slideUp 0.2s ease;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .uv-modal-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9;
        }
        .uv-modal-title-row { display: flex; align-items: center; gap: 0.75rem; }
        .uv-modal-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(26,175,230,0.08); display: flex; align-items: center; justify-content: center;
        }
        .uv-modal-title { font-size: 0.9375rem; font-weight: 700; color: #0f172a; }
        .uv-modal-close {
          background: none; border: none; cursor: pointer; padding: 5px; border-radius: 8px;
          color: #94a3b8; display: flex; transition: all 0.15s;
        }
        .uv-modal-close:hover { background: #f8fafc; color: #475569; }
        .uv-modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .uv-modal-foot { padding: 1rem 1.5rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 0.5rem; }

        /* Form */
        .uv-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
        .uv-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 5px; }
        .uv-req { color: #ef4444; }
        .uv-input {
          width: 100%; height: 38px; padding: 0 0.75rem;
          border: 1px solid #e2e8f0; border-radius: 9px;
          font-size: 0.875rem; color: #1e293b; background: #fff;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .uv-input:focus { border-color: #1AAFE6; box-shadow: 0 0 0 3px rgba(26,175,230,0.1); }
        .uv-err {
          display: flex; align-items: center; gap: 8px;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 9px; padding: 0.625rem 0.875rem;
          font-size: 0.8125rem; color: #991b1b;
        }

        .uv-btn-cancel {
          height: 36px; padding: 0 1rem; border-radius: 9px; border: 1px solid #e2e8f0;
          background: #fff; color: #475569; font-size: 0.8125rem; font-weight: 600; cursor: pointer;
          transition: background 0.15s;
        }
        .uv-btn-cancel:hover { background: #f8fafc; }
        .uv-btn-save {
          height: 36px; padding: 0 1.25rem; border-radius: 9px; border: none;
          background: #1AAFE6; color: #fff; font-size: 0.8125rem; font-weight: 600; cursor: pointer;
          transition: background 0.15s;
        }
        .uv-btn-save:hover { background: #1490c2; }
        .uv-btn-save:disabled { opacity: 0.6; cursor: default; }

        /* Confirm delete */
        .uv-confirm-body { padding: 1.5rem; display: flex; gap: 1rem; align-items: flex-start; }
        .uv-confirm-icon {
          width: 40px; height: 40px; border-radius: 50%; background: #fef2f2;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .uv-confirm-title { font-size: 0.9375rem; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
        .uv-confirm-sub { font-size: 0.8125rem; color: #64748b; margin: 0; line-height: 1.5; }
        .uv-btn-del {
          height: 36px; padding: 0 1.25rem; border-radius: 9px; border: none;
          background: #ef4444; color: #fff; font-size: 0.8125rem; font-weight: 600; cursor: pointer;
          transition: background 0.15s;
        }
        .uv-btn-del:hover { background: #dc2626; }
      `}</style>

      {/* Header */}
      <div className="uv-header">
        <div>
          <h1 className="uv-title">Universités</h1>
          <p className="uv-sub">{list.length} institution{list.length !== 1 ? 's' : ''} partenaire{list.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="uv-actions">
          <div className="uv-search-wrap">
            <Search size={13} className="uv-search-icon" />
            <input className="uv-search" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="uv-add" onClick={openNew}>
            <Plus size={14} /> Nouvelle université
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="uv-grid">
        {filtered.length === 0 ? (
          <div className="uv-empty">
            <div className="uv-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1AAFE6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div className="uv-empty-title">{search ? 'Aucun résultat' : 'Aucune université'}</div>
            <div className="uv-empty-sub">{search ? `Aucune université ne correspond à "${search}".` : 'Ajoutez votre première institution partenaire.'}</div>
            {!search && <button className="uv-add" onClick={openNew}><Plus size={13} /> Ajouter</button>}
          </div>
        ) : filtered.map((u, i) => {
          const accent = CARD_ACCENTS[i % CARD_ACCENTS.length]
          const mono = monogram(u.libelle)
          return (
            <div key={u.id} className="uv-card">
              <div className="uv-accent" style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }} />
              <div className="uv-card-body">
                <div className="uv-mono-row">
                  <div className="uv-mono" style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}>
                    {mono}
                  </div>
                  <span className="uv-code-badge">{u.code}</span>
                </div>
                <h2 className="uv-name">{u.libelle}</h2>
                <div className="uv-meta">
                  {u.ville && (
                    <div className="uv-meta-row">
                      <MapPin size={12} className="uv-meta-icon" />
                      <span className="uv-meta-val">{u.ville}</span>
                    </div>
                  )}
                  {u.email_contact && (
                    <div className="uv-meta-row">
                      <Mail size={12} className="uv-meta-icon" />
                      <span className="uv-meta-val">{u.email_contact}</span>
                    </div>
                  )}
                  {u.tel_contact && (
                    <div className="uv-meta-row">
                      <Phone size={12} className="uv-meta-icon" />
                      <span className="uv-meta-val">{u.tel_contact}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="uv-card-foot">
                <span className="uv-ville-chip">
                  {u.ville && <><MapPin size={10} /> {u.ville}</>}
                </span>
                <div className="uv-card-actions">
                  <button className="uv-btn-icon" onClick={() => openEdit(u)} title="Modifier">
                    <Pencil size={13} />
                  </button>
                  <button className="uv-btn-icon danger" onClick={() => setDel(u)} title="Supprimer">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Add/Edit */}
      {open && (
        <div className="uv-modal-bg" onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="uv-modal">
            <div className="uv-modal-head">
              <div className="uv-modal-title-row">
                <div className="uv-modal-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1AAFE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <span className="uv-modal-title">{editing ? "Modifier l'université" : 'Nouvelle université'}</span>
              </div>
              <button className="uv-modal-close" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            <div className="uv-modal-body">
              {err && (
                <div className="uv-err">
                  <AlertTriangle size={14} style={{ flexShrink: 0, color: '#ef4444' }} /> {err}
                </div>
              )}
              <div className="uv-row2">
                <div>
                  <label className="uv-label">Code <span className="uv-req">*</span></label>
                  <input className="uv-input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="ex. UDSN" />
                </div>
                <div>
                  <label className="uv-label">Ville</label>
                  <input className="uv-input" value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} placeholder="ex. Brazzaville" />
                </div>
              </div>
              <div>
                <label className="uv-label">Nom complet <span className="uv-req">*</span></label>
                <input className="uv-input" value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="ex. Université Denis Sassou Nguesso" />
              </div>
              <div className="uv-row2">
                <div>
                  <label className="uv-label">Email</label>
                  <input className="uv-input" type="email" value={form.email_contact} onChange={e => setForm(f => ({ ...f, email_contact: e.target.value }))} placeholder="contact@univ.cg" />
                </div>
                <div>
                  <label className="uv-label">Téléphone</label>
                  <input className="uv-input" value={form.tel_contact} onChange={e => setForm(f => ({ ...f, tel_contact: e.target.value }))} placeholder="+242 06 …" />
                </div>
              </div>
            </div>
            <div className="uv-modal-foot">
              <button className="uv-btn-cancel" onClick={() => setOpen(false)}>Annuler</button>
              <button className="uv-btn-save" onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {delTarget && (
        <div className="uv-modal-bg" onClick={e => { if (e.target === e.currentTarget) setDel(null) }}>
          <div className="uv-modal" style={{ maxWidth: 400 }}>
            <div className="uv-confirm-body">
              <div className="uv-confirm-icon">
                <Trash2 size={18} color="#ef4444" />
              </div>
              <div>
                <p className="uv-confirm-title">Supprimer cette université ?</p>
                <p className="uv-confirm-sub">
                  <strong>{delTarget.libelle}</strong> sera définitivement supprimée. Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="uv-modal-foot">
              <button className="uv-btn-cancel" onClick={() => setDel(null)}>Annuler</button>
              <button className="uv-btn-del" onClick={doDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: '2rem' }} />
    </div>
  )
}
