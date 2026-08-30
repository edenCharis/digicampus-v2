'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { Etablissement, Annee, Parcours, Specialite, ApiList } from '../_shared'
import {
  TABLE_STYLE, Modal, ModalHead, ModalBody, ModalFoot,
  FLabel, FInput, FSelect, BtnPrimary, BtnGhost, ErrBanner, ConfirmModal
} from '../_table'

type Section = 'annees' | 'parcours' | 'specialites'

export default function ParametragePage() {
  const [etabs, setEtabs]           = useState<Etablissement[]>([])
  const [etabSel, setEtabSel]       = useState('')
  const [annees, setAnnees]         = useState<Annee[]>([])
  const [parcours, setParcours]     = useState<Parcours[]>([])
  const [specs, setSpecs]           = useState<Specialite[]>([])
  const [section, setSection]       = useState<Section>('annees')

  const [anneeOpen, setAnneeOpen]   = useState(false)
  const [parcoursOpen, setParcoursOpen] = useState(false)
  const [specOpen, setSpecOpen]     = useState(false)

  const [editAnnee, setEditAnnee]   = useState<Annee | null>(null)
  const [editParcours, setEditParcours] = useState<Parcours | null>(null)
  const [editSpec, setEditSpec]     = useState<Specialite | null>(null)
  const [delTarget, setDelTarget]   = useState<{ type: string; id: number; label: string } | null>(null)

  const [anneeForm, setAnneeForm]   = useState({ libelle: '', is_active: false })
  const [parcoursForm, setParcoursForm] = useState({ code: '', libelle: '' })
  const [specForm, setSpecForm]     = useState({ code: '', libelle: '', parcours: '' })
  const [err, setErr]               = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    // scope etabs to current user's university so annees/parcours stay in scope
    const stored = typeof window !== 'undefined' ? localStorage.getItem('dc_user') : null
    const me = stored ? JSON.parse(stored) : null
    const q = me?.university ? `?university=${me.university}&limit=100` : '?limit=100'
    apiFetch<ApiList<Etablissement>>(`/etablissements/${q}`).then(d => {
      setEtabs(d.results)
      if (d.results[0]) setEtabSel(String(d.results[0].id))
    }).catch(() => {})
  }, [])

  const loadAll = useCallback(() => {
    if (!etabSel) return
    const etabId = Number(etabSel)
    apiFetch<ApiList<Annee>>(`/annees/?etablissement=${etabId}&limit=100`).then(d => setAnnees(d.results)).catch(() => {})
    apiFetch<ApiList<Parcours>>(`/parcours/?etablissement=${etabId}&limit=100`).then(d => setParcours(d.results)).catch(() => {})
    apiFetch<ApiList<Specialite>>(`/specialites/?etablissement=${etabId}&limit=100`).then(d => setSpecs(d.results)).catch(() => {})
  }, [etabSel])
  useEffect(() => { loadAll() }, [loadAll])

  function extractErr(e: unknown) {
    const raw = e && typeof e === 'object' ? e as Record<string, unknown> : {}
    return typeof raw.detail === 'string'
      ? raw.detail
      : Object.values(raw).flat().join(' ') || 'Erreur lors de la sauvegarde'
  }

  async function saveAnnee() {
    if (!anneeForm.libelle) { setErr('Libellé obligatoire'); return }
    setSaving(true); setErr(null)
    try {
      const body = { ...anneeForm, etablissement: Number(etabSel) }
      if (!editAnnee) await apiFetch('/annees/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/annees/${editAnnee.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setAnneeOpen(false); loadAll()
    } catch (e: unknown) { setErr(extractErr(e)) } finally { setSaving(false) }
  }

  async function saveParcours() {
    if (!parcoursForm.libelle || !parcoursForm.code) { setErr('Code et libellé obligatoires'); return }
    setSaving(true); setErr(null)
    try {
      const body = { ...parcoursForm, etablissement: Number(etabSel) }
      if (!editParcours) await apiFetch('/parcours/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/parcours/${editParcours.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setParcoursOpen(false); loadAll()
    } catch (e: unknown) { setErr(extractErr(e)) } finally { setSaving(false) }
  }

  async function saveSpec() {
    if (!specForm.libelle || !specForm.code) { setErr('Code et libellé obligatoires'); return }
    setSaving(true); setErr(null)
    try {
      const body = { ...specForm, parcours: specForm.parcours ? Number(specForm.parcours) : null, etablissement: Number(etabSel) }
      if (!editSpec) await apiFetch('/specialites/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/specialites/${editSpec.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setSpecOpen(false); loadAll()
    } catch (e: unknown) { setErr(extractErr(e)) } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!delTarget) return
    const map: Record<string, string> = { annee: '/annees/', parcours: '/parcours/', specialite: '/specialites/' }
    await apiFetch(`${map[delTarget.type]}${delTarget.id}/`, { method: 'DELETE' }).catch(() => {})
    setDelTarget(null); loadAll()
  }

  const sections: { id: Section; label: string; count: number }[] = [
    { id: 'annees',      label: 'Années académiques', count: annees.length },
    { id: 'parcours',    label: 'Parcours',            count: parcours.length },
    { id: 'specialites', label: 'Spécialités',         count: specs.length },
  ]

  return (
    <>
      {TABLE_STYLE}
      <style>{`
        .pm-wrap  { max-width:700px; margin:0 auto; }
        .pm-head  { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:.75rem; }
        .pm-title { font-size:1.125rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
        .pm-sub   { font-size:0.75rem; color:#94a3b8; margin:.25rem 0 0; }
        .pm-tabs  { display:flex; gap:6px; margin-bottom:1.25rem; flex-wrap:wrap; }
        .pm-tab   { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:9px; border:1.5px solid #e2e8f0; background:#fff; font-size:0.8rem; font-weight:600; color:#64748b; cursor:pointer; transition:all .15s; }
        .pm-tab.on{ border-color:#1AAFE6; background:rgba(26,175,230,0.07); color:#1AAFE6; }
        .pm-badge { font-size:0.65rem; font-weight:800; padding:1px 6px; border-radius:20px; background:#f1f5f9; color:#94a3b8; }
        .pm-tab.on .pm-badge { background:rgba(26,175,230,0.15); color:#1AAFE6; }
        .pm-card  { background:#fff; border:1px solid #e8edf3; border-radius:14px; overflow:hidden; box-shadow:0 1px 3px rgba(15,23,42,0.04); }
        .pm-bar   { display:flex; justify-content:flex-end; padding:.75rem 1rem; border-bottom:1px solid #f1f5f9; }
        .pm-row   { display:flex; align-items:center; gap:.75rem; padding:.875rem 1.25rem; transition:background .1s; }
        .pm-row:not(:last-child){ border-bottom:1px solid #f8fafc; }
        .pm-row:hover { background:#fafbfd; }
        .pm-row-actions { display:flex; gap:3px; opacity:0; transition:opacity .15s; }
        .pm-row:hover .pm-row-actions { opacity:1; }
        .pm-empty { padding:3rem 1rem; text-align:center; color:#94a3b8; font-size:.875rem; }
        .pm-etab-sel { height:32px; padding:0 1.5rem 0 .625rem; border:1px solid #e2e8f0; border-radius:8px; font-size:.75rem; color:#475569; background:#f8fafc url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 6px center; appearance:none; -webkit-appearance:none; outline:none; cursor:pointer; }
        .active-pill { display:inline-flex; align-items:center; gap:4px; font-size:.7rem; font-weight:700; padding:2px 8px; border-radius:20px; background:rgba(16,185,129,.1); color:#10b981; }
      `}</style>

      <div className="pm-wrap">
        <div className="pm-head">
          <div>
            <h1 className="pm-title">Paramétrage</h1>
            <p className="pm-sub">Années, parcours et spécialités par établissement</p>
          </div>
          <select className="pm-etab-sel" value={etabSel} onChange={e => setEtabSel(e.target.value)}>
            {etabs.map(e => <option key={e.id} value={e.id}>{e.code} — {e.libelle}</option>)}
          </select>
        </div>

        <div className="pm-tabs">
          {sections.map(s => (
            <button key={s.id} className={`pm-tab${section === s.id ? ' on' : ''}`} onClick={() => setSection(s.id)}>
              {s.label}<span className="pm-badge">{s.count}</span>
            </button>
          ))}
        </div>

        {/* Années */}
        {section === 'annees' && (
          <div className="pm-card">
            <div className="pm-bar">
              <button className="pt-add" onClick={() => { setEditAnnee(null); setAnneeForm({ libelle: '', is_active: false }); setErr(null); setAnneeOpen(true) }}>
                <Plus size={13} /> Nouvelle année
              </button>
            </div>
            {annees.length === 0
              ? <div className="pm-empty">Aucune année académique pour cet établissement.</div>
              : annees.map(a => (
                <div key={a.id} className="pm-row">
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{a.libelle}</span>
                    {a.is_active && <span className="active-pill"><CheckCircle2 size={10} /> Active</span>}
                  </div>
                  <div className="pm-row-actions">
                    <button className="pt-ico-btn" onClick={() => { setEditAnnee(a); setAnneeForm({ libelle: a.libelle, is_active: a.is_active }); setErr(null); setAnneeOpen(true) }}><Pencil size={12} /></button>
                    <button className="pt-ico-btn del" onClick={() => setDelTarget({ type: 'annee', id: a.id, label: a.libelle })}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Parcours */}
        {section === 'parcours' && (
          <div className="pm-card">
            <div className="pm-bar">
              <button className="pt-add" onClick={() => { setEditParcours(null); setParcoursForm({ code: '', libelle: '' }); setErr(null); setParcoursOpen(true) }}>
                <Plus size={13} /> Nouveau parcours
              </button>
            </div>
            {parcours.length === 0
              ? <div className="pm-empty">Aucun parcours pour cet établissement.</div>
              : parcours.map(p => (
                <div key={p.id} className="pm-row">
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{p.libelle}</span>
                    <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#94a3b8' }}>{p.code}</span>
                  </div>
                  <div className="pm-row-actions">
                    <button className="pt-ico-btn" onClick={() => { setEditParcours(p); setParcoursForm({ code: p.code, libelle: p.libelle }); setErr(null); setParcoursOpen(true) }}><Pencil size={12} /></button>
                    <button className="pt-ico-btn del" onClick={() => setDelTarget({ type: 'parcours', id: p.id, label: p.libelle })}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Spécialités */}
        {section === 'specialites' && (
          <div className="pm-card">
            <div className="pm-bar">
              <button className="pt-add" onClick={() => { setEditSpec(null); setSpecForm({ code: '', libelle: '', parcours: parcours[0] ? String(parcours[0].id) : '' }); setErr(null); setSpecOpen(true) }}>
                <Plus size={13} /> Nouvelle spécialité
              </button>
            </div>
            {specs.length === 0
              ? <div className="pm-empty">Aucune spécialité pour cet établissement.</div>
              : specs.map(s => (
                <div key={s.id} className="pm-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>{s.libelle}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 1 }}>
                      {s.code}{s.parcours_libelle ? ` · ${s.parcours_libelle}` : ''}
                    </div>
                  </div>
                  <div className="pm-row-actions">
                    <button className="pt-ico-btn" onClick={() => { setEditSpec(s); setSpecForm({ code: s.code, libelle: s.libelle, parcours: s.parcours ? String(s.parcours) : '' }); setErr(null); setSpecOpen(true) }}><Pencil size={12} /></button>
                    <button className="pt-ico-btn del" onClick={() => setDelTarget({ type: 'specialite', id: s.id, label: s.libelle })}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* Modals */}
      {anneeOpen && (
        <Modal onClose={() => setAnneeOpen(false)} width={380}>
          <ModalHead title={editAnnee ? "Modifier l'année" : 'Nouvelle année académique'} onClose={() => setAnneeOpen(false)} />
          <ModalBody>
            {err && <ErrBanner msg={err} />}
            <FLabel label="Libellé (ex: 2024-2025)" req>
              <FInput value={anneeForm.libelle} onChange={e => setAnneeForm(f => ({ ...f, libelle: e.target.value }))} placeholder="2024-2025" />
            </FLabel>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8125rem', color: '#475569' }}>
              <input type="checkbox" checked={anneeForm.is_active} onChange={e => setAnneeForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: 16, height: 16 }} />
              Marquer comme année active
            </label>
          </ModalBody>
          <ModalFoot>
            <BtnGhost onClick={() => setAnneeOpen(false)}>Annuler</BtnGhost>
            <BtnPrimary onClick={saveAnnee} disabled={saving}>{saving ? '…' : 'Enregistrer'}</BtnPrimary>
          </ModalFoot>
        </Modal>
      )}

      {parcoursOpen && (
        <Modal onClose={() => setParcoursOpen(false)} width={380}>
          <ModalHead title={editParcours ? 'Modifier le parcours' : 'Nouveau parcours'} onClose={() => setParcoursOpen(false)} />
          <ModalBody>
            {err && <ErrBanner msg={err} />}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <FLabel label="Code" req><FInput value={parcoursForm.code} onChange={e => setParcoursForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="LIC" /></FLabel>
              <FLabel label="Libellé" req><FInput value={parcoursForm.libelle} onChange={e => setParcoursForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Licence" /></FLabel>
            </div>
          </ModalBody>
          <ModalFoot>
            <BtnGhost onClick={() => setParcoursOpen(false)}>Annuler</BtnGhost>
            <BtnPrimary onClick={saveParcours} disabled={saving}>{saving ? '…' : 'Enregistrer'}</BtnPrimary>
          </ModalFoot>
        </Modal>
      )}

      {specOpen && (
        <Modal onClose={() => setSpecOpen(false)} width={400}>
          <ModalHead title={editSpec ? 'Modifier la spécialité' : 'Nouvelle spécialité'} onClose={() => setSpecOpen(false)} />
          <ModalBody>
            {err && <ErrBanner msg={err} />}
            <FLabel label="Parcours">
              <FSelect value={specForm.parcours} onChange={e => setSpecForm(f => ({ ...f, parcours: e.target.value }))}>
                <option value="">— sans parcours —</option>
                {parcours.map(p => <option key={p.id} value={p.id}>{p.libelle}</option>)}
              </FSelect>
            </FLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <FLabel label="Code" req><FInput value={specForm.code} onChange={e => setSpecForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="INFO" /></FLabel>
              <FLabel label="Libellé" req><FInput value={specForm.libelle} onChange={e => setSpecForm(f => ({ ...f, libelle: e.target.value }))} /></FLabel>
            </div>
          </ModalBody>
          <ModalFoot>
            <BtnGhost onClick={() => setSpecOpen(false)}>Annuler</BtnGhost>
            <BtnPrimary onClick={saveSpec} disabled={saving}>{saving ? '…' : 'Enregistrer'}</BtnPrimary>
          </ModalFoot>
        </Modal>
      )}

      {delTarget && <ConfirmModal name={delTarget.label} onYes={doDelete} onNo={() => setDelTarget(null)} />}
    </>
  )
}
