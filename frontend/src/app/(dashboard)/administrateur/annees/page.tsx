'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { Etablissement, Annee, ApiList } from '../_shared'
import {
  TABLE_STYLE, SearchInput, Pager, Modal, ModalHead, ModalBody, ModalFoot,
  FLabel, FInput, FSelect, BtnPrimary, BtnGhost, ErrBanner, ConfirmModal
} from '../_table'

const PAGE_SIZE = 15

function getMe() {
  try { return JSON.parse(localStorage.getItem('dc_user') || 'null') } catch { return null }
}

export default function AnneesPage() {
  const [etabs, setEtabs]       = useState<Etablissement[]>([])
  const [etabId, setEtabId]     = useState('')
  const [list, setList]         = useState<Annee[]>([])
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState<Annee | null>(null)
  const [del, setDel]           = useState<Annee | null>(null)
  const [form, setForm]         = useState({ libelle: '', is_active: false })
  const [err, setErr]           = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    const me = getMe()
    const q = me?.university ? `?university=${me.university}&limit=100` : '?limit=100'
    apiFetch<ApiList<Etablissement>>(`/etablissements/${q}`).then(d => {
      setEtabs(d.results)
      if (d.results.length > 0) setEtabId(String(d.results[0].id))
    }).catch(() => {})
  }, [])

  const load = useCallback(() => {
    if (!etabId) return
    apiFetch<ApiList<Annee>>(`/annees/?etablissement=${etabId}&limit=200`)
      .then(d => setList(d.results)).catch(() => {})
  }, [etabId])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return list
    return list.filter(a => a.libelle.toLowerCase().includes(q))
  }, [list, search])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() {
    setEditing(null)
    setForm({ libelle: '', is_active: false })
    setErr(null); setOpen(true)
  }
  function openEdit(a: Annee) {
    setEditing(a)
    setForm({ libelle: a.libelle, is_active: a.is_active })
    setErr(null); setOpen(true)
  }

  async function save() {
    if (!form.libelle || !etabId) { setErr('Libellé et établissement obligatoires'); return }
    setSaving(true); setErr(null)
    try {
      const body = { libelle: form.libelle, is_active: form.is_active, etablissement: Number(etabId) }
      if (!editing) await apiFetch('/annees/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/annees/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setOpen(false); load()
    } catch (e: unknown) {
      const raw = e && typeof e === 'object' ? e as Record<string, unknown> : {}
      setErr(typeof raw.detail === 'string' ? raw.detail : Object.values(raw).flat().join(' ') || 'Erreur')
    } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!del) return
    await apiFetch(`/annees/${del.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  const etabLabel = etabs.find(e => String(e.id) === etabId)?.libelle || ''

  return (
    <>
      {TABLE_STYLE}
      <style>{`
        .pg-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:0.75rem; }
        .pg-title  { font-size:1.125rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
        .pg-sub    { font-size:0.75rem; color:#94a3b8; margin:.25rem 0 0; }
        .etab-bar  { display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem; flex-wrap:wrap; }
        .etab-label { font-size:0.75rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.06em; white-space:nowrap; }
        .active-dot { width:8px; height:8px; border-radius:50%; background:#10b981; display:inline-block; margin-right:4px; }
        .inactive-dot { width:8px; height:8px; border-radius:50%; background:#e2e8f0; display:inline-block; margin-right:4px; }
      `}</style>

      <div className="pg-header">
        <div>
          <h1 className="pg-title">Années académiques</h1>
          <p className="pg-sub">{etabLabel && `${etabLabel} · `}{filtered.length} année{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {etabs.length > 1 && (
            <select className="pt-sel" value={etabId} onChange={e => { setEtabId(e.target.value); setPage(1) }}>
              {etabs.map(e => <option key={e.id} value={e.id}>{e.libelle}</option>)}
            </select>
          )}
          <button className="pt-add" onClick={openAdd} disabled={!etabId}><Plus size={13} /> Ajouter</button>
        </div>
      </div>

      <div className="pt-wrap">
        <div className="pt-toolbar">
          <div className="pt-toolbar-left">
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Rechercher une année…" />
          </div>
        </div>

        <table className="pt-table">
          <thead>
            <tr>
              <th>Libellé</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={3}><div className="pt-empty"><Calendar size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} /><div>Aucune année académique</div></div></td></tr>
            )}
            {paged.map(a => (
              <tr key={a.id}>
                <td>
                  <div className="pt-cell-row">
                    <div className="pt-avatar" style={{ background: a.is_active ? '#10b981' : '#94a3b8' }}>
                      {a.libelle.slice(0, 2)}
                    </div>
                    <span className="pt-primary">{a.libelle}</span>
                  </div>
                </td>
                <td>
                  <span className="pt-badge" style={a.is_active
                    ? { background: 'rgba(16,185,129,0.1)', color: '#10b981' }
                    : { background: 'rgba(148,163,184,0.1)', color: '#94a3b8' }}>
                    <span className={a.is_active ? 'active-dot' : 'inactive-dot'} />
                    {a.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="pt-actions">
                    <button className="pt-ico-btn" onClick={() => openEdit(a)} title="Modifier"><Pencil size={12} /></button>
                    <button className="pt-ico-btn del" onClick={() => setDel(a)} title="Supprimer"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-footer">
          <span className="pt-count">
            {filtered.length === 0 ? 'Aucun résultat' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} sur ${filtered.length}`}
          </span>
          <Pager total={filtered.length} page={page} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>

      {open && (
        <Modal onClose={() => setOpen(false)}>
          <ModalHead title={editing ? 'Modifier l\'année' : 'Nouvelle année académique'} onClose={() => setOpen(false)} />
          <ModalBody>
            {err && <ErrBanner msg={err} />}
            <FLabel label="Libellé" req>
              <FInput value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Ex: 2025-2026" />
            </FLabel>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#475569' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              Année active (désactive les autres automatiquement)
            </label>
          </ModalBody>
          <ModalFoot>
            <BtnGhost onClick={() => setOpen(false)}>Annuler</BtnGhost>
            <BtnPrimary onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</BtnPrimary>
          </ModalFoot>
        </Modal>
      )}

      {del && <ConfirmModal name={del.libelle} onYes={doDelete} onNo={() => setDel(null)} />}
    </>
  )
}
