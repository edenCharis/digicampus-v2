'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  Building2, GraduationCap, Users, Settings,
  Plus, Pencil, Trash2, CheckCircle, XCircle, ChevronDown,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'

/* ── Types ── */
interface University  { id: number; code: string; libelle: string; email_contact: string; tel_contact: string; ville: string }
interface Etablissement { id: number; code: string; libelle: string; university: number; university_name: string; email: string; tel: string; ville: string }
interface AppUser { id: number; login: string; nom: string; email: string; role: string; university: number; etablissement: number | null; etablissement_name: string | null; is_active: boolean }
interface Annee { id: number; libelle: string; is_active: boolean; etablissement: number }
interface Cycle { id: number; code: string; libelle: string; etablissement: number }
interface Specialite { id: number; code: string; libelle: string; cycle: number | null; cycle_libelle: string | null; etablissement: number }
interface ApiList<T> { count: number; results: T[] }

/* ── Constantes ── */
const ROLES = [
  'scolarité','doyen','enseignant','professeur','cours',
  'inscription','anonymat','daarhspe','gesnote','soutenance','suivi','caisse','pvd',
]
const ROLE_COLORS: Record<string, string> = {
  'scolarité': '#1AAFE6', doyen: '#8b5cf6', enseignant: '#f59e0b',
  professeur: '#10b981', cours: '#06b6d4', inscription: '#3b82f6',
  anonymat: '#6366f1', daarhspe: '#ec4899', gesnote: '#14b8a6',
  soutenance: '#f97316', suivi: '#84cc16', caisse: '#eab308', pvd: '#a78bfa',
}

/* ── Styles ── */
const S: Record<string, React.CSSProperties> = {
  tabs:      { display: 'flex', gap: 0, borderBottom: '2px solid #e2e8f0', marginBottom: '1.75rem' },
  tab:       { padding: '0.625rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#64748b', borderBottom: '2px solid transparent', marginBottom: '-2px' },
  tabActive: { padding: '0.625rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, color: '#1AAFE6', borderBottom: '2px solid #1AAFE6', marginBottom: '-2px' },
  hdr:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' },
  h2:        { fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  btnPrimary:{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 1rem', background: '#1AAFE6', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' },
  card:      { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: '1rem' },
  cardRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.125rem', borderBottom: '1px solid #f1f5f9' },
  cardRowLast:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.125rem' },
  rowMain:   { fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' },
  rowSub:    { fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 },
  iconBtn:   { background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' },
  iconBtns:  { display: 'flex', gap: 4 },
  empty:     { padding: '2.5rem', textAlign: 'center' as const, color: '#94a3b8', fontSize: '0.875rem' },
  // Modal
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal:     { background: '#fff', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 480 },
  mTitle:    { fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.25rem' },
  fg:        { marginBottom: '1rem' },
  label:     { display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#475569', marginBottom: 5 },
  input:     { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' as const },
  fSelect:   { width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', background: '#fff', boxSizing: 'border-box' as const },
  row2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' },
  actions:   { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' },
  btnCancel: { padding: '0.45rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: 8, color: '#64748b', fontSize: '0.875rem', cursor: 'pointer' },
  errBox:    { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.5rem 0.75rem', color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.875rem' },
  badge:     { display: 'inline-flex', alignItems: 'center', padding: '0.18rem 0.55rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 },
}

/* ── Helpers ── */
function roleBadge(role: string) {
  const color = ROLE_COLORS[role] ?? '#64748b'
  return <span style={{ ...S.badge, background: `${color}18`, color }}>{role}</span>
}

function Confirm({ msg, onYes, onNo }: { msg: string; onYes: () => void; onNo: () => void }) {
  return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: 360 }}>
        <p style={{ color: '#1e293b', fontWeight: 600, margin: '0 0 1rem' }}>{msg}</p>
        <div style={S.actions}>
          <button style={S.btnCancel} onClick={onNo}>Annuler</button>
          <button style={{ ...S.btnPrimary, background: '#ef4444' }} onClick={onYes}>Supprimer</button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════
   ONGLET 1 — UNIVERSITÉS
════════════════════════════════════════ */
function TabUniversites() {
  const [list, setList] = useState<University[]>([])
  const [modal, setModal] = useState<University | null | 'new'>(null)
  const [del, setDel] = useState<University | null>(null)
  const [form, setForm] = useState({ code: '', libelle: '', email_contact: '', tel_contact: '', ville: '' })
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    apiFetch<ApiList<University>>('/universities/').then(d => setList(d.results)).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  function openNew() { setForm({ code: '', libelle: '', email_contact: '', tel_contact: '', ville: '' }); setErr(null); setModal('new') }
  function openEdit(u: University) { setForm({ code: u.code, libelle: u.libelle, email_contact: u.email_contact, tel_contact: u.tel_contact, ville: u.ville }); setErr(null); setModal(u) }

  async function save() {
    setSaving(true); setErr(null)
    try {
      if (modal === 'new') await apiFetch('/universities/', { method: 'POST', body: JSON.stringify(form) })
      else await apiFetch(`/universities/${(modal as University).id}/`, { method: 'PATCH', body: JSON.stringify(form) })
      setModal(null); load()
    } catch (e: unknown) {
      setErr(JSON.stringify(e))
    } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!del) return
    await apiFetch(`/universities/${del.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  return (
    <div>
      <div style={S.hdr}>
        <h2 style={S.h2}>Universités <span style={{ color: '#94a3b8', fontWeight: 400 }}>({list.length})</span></h2>
        <button style={S.btnPrimary} onClick={openNew}><Plus size={14} /> Nouvelle université</button>
      </div>

      <div style={S.card}>
        {list.length === 0 ? <div style={S.empty}>Aucune université enregistrée.</div>
          : list.map((u, i) => (
            <div key={u.id} style={i === list.length - 1 ? S.cardRowLast : S.cardRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(26,175,230,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} color="#1AAFE6" />
                </div>
                <div>
                  <div style={S.rowMain}>{u.libelle}</div>
                  <div style={S.rowSub}>{u.code} · {u.ville}</div>
                </div>
              </div>
              <div style={S.iconBtns}>
                <button style={S.iconBtn} onClick={() => openEdit(u)} title="Modifier"><Pencil size={15} color="#64748b" /></button>
                <button style={S.iconBtn} onClick={() => setDel(u)} title="Supprimer"><Trash2 size={15} color="#ef4444" /></button>
              </div>
            </div>
          ))}
      </div>

      {modal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={S.mTitle}>{modal === 'new' ? 'Nouvelle université' : 'Modifier l\'université'}</h3>
            {err && <div style={S.errBox}>{err}</div>}
            <div style={S.row2}>
              <div style={S.fg}><label style={S.label}>Code *</label><input style={S.input} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="UDSN" /></div>
              <div style={S.fg}><label style={S.label}>Ville</label><input style={S.input} value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} placeholder="Brazzaville" /></div>
            </div>
            <div style={S.fg}><label style={S.label}>Libellé *</label><input style={S.input} value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Université Denis Sassou N'Guesso" /></div>
            <div style={S.row2}>
              <div style={S.fg}><label style={S.label}>Email</label><input style={S.input} value={form.email_contact} onChange={e => setForm(f => ({ ...f, email_contact: e.target.value }))} /></div>
              <div style={S.fg}><label style={S.label}>Téléphone</label><input style={S.input} value={form.tel_contact} onChange={e => setForm(f => ({ ...f, tel_contact: e.target.value }))} /></div>
            </div>
            <div style={S.actions}>
              <button style={S.btnCancel} onClick={() => setModal(null)}>Annuler</button>
              <button style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
      {del && <Confirm msg={`Supprimer l'université "${del.libelle}" ?`} onYes={doDelete} onNo={() => setDel(null)} />}
    </div>
  )
}

/* ════════════════════════════════════════
   ONGLET 2 — ÉTABLISSEMENTS
════════════════════════════════════════ */
function TabEtablissements() {
  const [univs, setUnivs] = useState<University[]>([])
  const [list, setList] = useState<Etablissement[]>([])
  const [filterUniv, setFilterUniv] = useState('')
  const [modal, setModal] = useState<Etablissement | null | 'new'>(null)
  const [del, setDel] = useState<Etablissement | null>(null)
  const [form, setForm] = useState({ code: '', libelle: '', university: '', email: '', tel: '', ville: '' })
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch<ApiList<University>>('/universities/').then(d => { setUnivs(d.results); if (d.results[0]) setFilterUniv(String(d.results[0].id)) }).catch(() => {})
  }, [])

  const load = useCallback(() => {
    const q = filterUniv ? `?university=${filterUniv}` : ''
    apiFetch<ApiList<Etablissement>>(`/etablissements/${q}`).then(d => setList(d.results)).catch(() => {})
  }, [filterUniv])
  useEffect(() => { load() }, [load])

  function openNew() { setForm({ code: '', libelle: '', university: filterUniv, email: '', tel: '', ville: '' }); setErr(null); setModal('new') }
  function openEdit(e: Etablissement) { setForm({ code: e.code, libelle: e.libelle, university: String(e.university), email: e.email, tel: e.tel, ville: e.ville }); setErr(null); setModal(e) }

  async function save() {
    setSaving(true); setErr(null)
    try {
      const body = { ...form, university: Number(form.university) }
      if (modal === 'new') await apiFetch('/etablissements/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/etablissements/${(modal as Etablissement).id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setModal(null); load()
    } catch (e: unknown) { setErr(JSON.stringify(e)) } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!del) return
    await apiFetch(`/etablissements/${del.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  return (
    <div>
      <div style={S.hdr}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={S.h2}>Établissements <span style={{ color: '#94a3b8', fontWeight: 400 }}>({list.length})</span></h2>
          <select style={{ padding: '0.4rem 0.65rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', outline: 'none', background: '#fff' }}
            value={filterUniv} onChange={e => setFilterUniv(e.target.value)}>
            <option value="">Toutes les universités</option>
            {univs.map(u => <option key={u.id} value={u.id}>{u.code}</option>)}
          </select>
        </div>
        <button style={S.btnPrimary} onClick={openNew}><Plus size={14} /> Nouvel établissement</button>
      </div>

      <div style={S.card}>
        {list.length === 0 ? <div style={S.empty}>Aucun établissement trouvé.</div>
          : list.map((e, i) => (
            <div key={e.id} style={i === list.length - 1 ? S.cardRowLast : S.cardRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={18} color="#8b5cf6" />
                </div>
                <div>
                  <div style={S.rowMain}>{e.libelle}</div>
                  <div style={S.rowSub}>{e.code} · {e.university_name} · {e.ville}</div>
                </div>
              </div>
              <div style={S.iconBtns}>
                <button style={S.iconBtn} onClick={() => openEdit(e)}><Pencil size={15} color="#64748b" /></button>
                <button style={S.iconBtn} onClick={() => setDel(e)}><Trash2 size={15} color="#ef4444" /></button>
              </div>
            </div>
          ))}
      </div>

      {modal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={S.mTitle}>{modal === 'new' ? 'Nouvel établissement' : 'Modifier l\'établissement'}</h3>
            {err && <div style={S.errBox}>{err}</div>}
            <div style={S.fg}>
              <label style={S.label}>Université *</label>
              <select style={S.fSelect} value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))}>
                <option value="">— sélectionner —</option>
                {univs.map(u => <option key={u.id} value={u.id}>{u.libelle}</option>)}
              </select>
            </div>
            <div style={S.row2}>
              <div style={S.fg}><label style={S.label}>Code *</label><input style={S.input} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="FIT" /></div>
              <div style={S.fg}><label style={S.label}>Ville</label><input style={S.input} value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} /></div>
            </div>
            <div style={S.fg}><label style={S.label}>Libellé *</label><input style={S.input} value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Faculté des Sciences…" /></div>
            <div style={S.row2}>
              <div style={S.fg}><label style={S.label}>Email</label><input style={S.input} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div style={S.fg}><label style={S.label}>Téléphone</label><input style={S.input} value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} /></div>
            </div>
            <div style={S.actions}>
              <button style={S.btnCancel} onClick={() => setModal(null)}>Annuler</button>
              <button style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
      {del && <Confirm msg={`Supprimer "${del.libelle}" ?`} onYes={doDelete} onNo={() => setDel(null)} />}
    </div>
  )
}

/* ════════════════════════════════════════
   ONGLET 3 — COMPTES
════════════════════════════════════════ */
function TabComptes() {
  const [etabs, setEtabs] = useState<Etablissement[]>([])
  const [list, setList] = useState<AppUser[]>([])
  const [filterRole, setFilterRole] = useState('')
  const [modal, setModal] = useState<AppUser | null | 'new'>(null)
  const [del, setDel] = useState<AppUser | null>(null)
  const [form, setForm] = useState({ login: '', nom: '', email: '', role: '', password: '', etablissement: '', is_active: true })
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    const q = filterRole ? `?role=${encodeURIComponent(filterRole)}` : ''
    apiFetch<ApiList<AppUser>>(`/users/${q}`).then(d => setList(d.results)).catch(() => {})
  }, [filterRole])

  useEffect(() => {
    load()
    apiFetch<ApiList<Etablissement>>('/etablissements/?limit=100').then(d => setEtabs(d.results)).catch(() => {})
  }, [load])

  function openNew() {
    const raw = localStorage.getItem('dc_user')
    const me = raw ? JSON.parse(raw) : {}
    setForm({ login: '', nom: '', email: '', role: ROLES[0], password: '', etablissement: String(me.etablissement ?? etabs[0]?.id ?? ''), is_active: true })
    setErr(null); setModal('new')
  }
  function openEdit(u: AppUser) {
    setForm({ login: u.login, nom: u.nom, email: u.email ?? '', role: u.role, password: '', etablissement: String(u.etablissement ?? ''), is_active: u.is_active })
    setErr(null); setModal(u)
  }

  async function save() {
    setSaving(true); setErr(null)
    try {
      const raw = localStorage.getItem('dc_user')
      const me = raw ? JSON.parse(raw) : {}
      const body: Record<string, unknown> = {
        login: form.login, nom: form.nom, email: form.email || undefined,
        role: form.role, is_active: form.is_active,
        university: me.university,
        etablissement: form.etablissement ? Number(form.etablissement) : null,
      }
      if (form.password) body.password = form.password
      if (modal === 'new') await apiFetch('/users/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/users/${(modal as AppUser).id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setModal(null); load()
    } catch (e: unknown) {
      const err = e as Record<string, unknown>
      setErr(err?.login ? `Login : ${err.login}` : JSON.stringify(e))
    } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!del) return
    await apiFetch(`/users/${del.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  // Grouper par rôle
  const grouped = ROLES.reduce<Record<string, AppUser[]>>((acc, r) => {
    const users = list.filter(u => u.role === r)
    if (users.length) acc[r] = users
    return acc
  }, {})

  return (
    <div>
      <div style={S.hdr}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={S.h2}>Comptes <span style={{ color: '#94a3b8', fontWeight: 400 }}>({list.length})</span></h2>
          <select style={{ padding: '0.4rem 0.65rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem', outline: 'none', background: '#fff' }}
            value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">Tous les rôles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button style={S.btnPrimary} onClick={openNew}><Plus size={14} /> Nouveau compte</button>
      </div>

      {Object.entries(grouped).map(([role, users]) => (
        <div key={role} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
            {roleBadge(role)}
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{users.length} compte{users.length > 1 ? 's' : ''}</span>
          </div>
          <div style={S.card}>
            {users.map((u, i) => (
              <div key={u.id} style={i === users.length - 1 ? S.cardRowLast : S.cardRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 50, background: `${ROLE_COLORS[role] ?? '#64748b'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: ROLE_COLORS[role] ?? '#64748b' }}>
                    {u.nom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ ...S.rowMain, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {u.nom}
                      {!u.is_active && <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#ef4444', padding: '0.1rem 0.4rem', borderRadius: 20, fontWeight: 600 }}>Inactif</span>}
                    </div>
                    <div style={S.rowSub}>{u.login} {u.etablissement_name ? `· ${u.etablissement_name}` : ''}</div>
                  </div>
                </div>
                <div style={S.iconBtns}>
                  <button style={S.iconBtn} onClick={() => openEdit(u)}><Pencil size={15} color="#64748b" /></button>
                  <button style={S.iconBtn} onClick={() => setDel(u)}><Trash2 size={15} color="#ef4444" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {list.length === 0 && <div style={{ ...S.empty, border: '1px solid #e2e8f0', borderRadius: 12 }}>Aucun compte trouvé.</div>}

      {modal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={S.mTitle}>{modal === 'new' ? 'Nouveau compte' : 'Modifier le compte'}</h3>
            {err && <div style={S.errBox}>{err}</div>}
            <div style={S.row2}>
              <div style={S.fg}><label style={S.label}>Login *</label><input style={S.input} value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} placeholder="scolarite" /></div>
              <div style={S.fg}><label style={S.label}>Mot de passe {modal === 'new' ? '*' : '(laisser vide = inchangé)'}</label><input type="password" style={S.input} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" /></div>
            </div>
            <div style={S.fg}><label style={S.label}>Nom complet *</label><input style={S.input} value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Agent Scolarité" /></div>
            <div style={S.row2}>
              <div style={S.fg}>
                <label style={S.label}>Rôle *</label>
                <select style={S.fSelect} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={S.fg}>
                <label style={S.label}>Établissement</label>
                <select style={S.fSelect} value={form.etablissement} onChange={e => setForm(f => ({ ...f, etablissement: e.target.value }))}>
                  <option value="">— aucun —</option>
                  {etabs.map(e => <option key={e.id} value={e.id}>{e.code} — {e.libelle}</option>)}
                </select>
              </div>
            </div>
            <div style={S.fg}><label style={S.label}>Email</label><input type="email" style={S.input} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#1AAFE6' }} />
              Compte actif
            </label>
            <div style={S.actions}>
              <button style={S.btnCancel} onClick={() => setModal(null)}>Annuler</button>
              <button style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
      {del && <Confirm msg={`Supprimer le compte "${del.nom}" (${del.login}) ?`} onYes={doDelete} onNo={() => setDel(null)} />}
    </div>
  )
}

/* ════════════════════════════════════════
   ONGLET 4 — PARAMÉTRAGE
════════════════════════════════════════ */
function TabParametrage() {
  const [etabs, setEtabs]         = useState<Etablissement[]>([])
  const [etabSel, setEtabSel]     = useState('')
  const [annees, setAnnees]       = useState<Annee[]>([])
  const [cycles, setCycles]       = useState<Cycle[]>([])
  const [specs, setSpecs]         = useState<Specialite[]>([])
  const [section, setSection]     = useState<'annees' | 'cycles' | 'specialites'>('annees')

  // Modals
  const [anneeModal, setAnneeModal] = useState<Annee | 'new' | null>(null)
  const [cycleModal, setCycleModal] = useState<Cycle | 'new' | null>(null)
  const [specModal,  setSpecModal]  = useState<Specialite | 'new' | null>(null)
  const [delTarget, setDelTarget]   = useState<{ type: string; id: number; label: string } | null>(null)

  const [anneeForm, setAnneeForm] = useState({ libelle: '', is_active: false })
  const [cycleForm, setCycleForm] = useState({ code: '', libelle: '' })
  const [specForm,  setSpecForm]  = useState({ code: '', libelle: '', cycle: '' })
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch<ApiList<Etablissement>>('/etablissements/?limit=100').then(d => {
      setEtabs(d.results)
      if (d.results[0]) setEtabSel(String(d.results[0].id))
    }).catch(() => {})
  }, [])

  const loadAll = useCallback(() => {
    if (!etabSel) return
    apiFetch<ApiList<Annee>>('/annees/?limit=100').then(d => setAnnees(d.results.filter(a => a.etablissement === Number(etabSel)))).catch(() => {})
    apiFetch<ApiList<Cycle>>('/cycles/?limit=100').then(d => setCycles(d.results.filter(c => c.etablissement === Number(etabSel)))).catch(() => {})
    apiFetch<ApiList<Specialite>>('/specialites/?limit=100').then(d => setSpecs(d.results.filter(s => s.etablissement === Number(etabSel)))).catch(() => {})
  }, [etabSel])
  useEffect(() => { loadAll() }, [loadAll])

  async function saveAnnee() {
    setSaving(true); setErr(null)
    try {
      const body = { ...anneeForm, etablissement: Number(etabSel) }
      if (anneeModal === 'new') await apiFetch('/annees/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/annees/${(anneeModal as Annee).id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setAnneeModal(null); loadAll()
    } catch (e: unknown) { setErr(JSON.stringify(e)) } finally { setSaving(false) }
  }

  async function saveCycle() {
    setSaving(true); setErr(null)
    try {
      const body = { ...cycleForm, etablissement: Number(etabSel) }
      if (cycleModal === 'new') await apiFetch('/cycles/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/cycles/${(cycleModal as Cycle).id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setCycleModal(null); loadAll()
    } catch (e: unknown) { setErr(JSON.stringify(e)) } finally { setSaving(false) }
  }

  async function saveSpec() {
    setSaving(true); setErr(null)
    try {
      const body = { ...specForm, cycle: specForm.cycle ? Number(specForm.cycle) : null, etablissement: Number(etabSel) }
      if (specModal === 'new') await apiFetch('/specialites/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/specialites/${(specModal as Specialite).id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setSpecModal(null); loadAll()
    } catch (e: unknown) { setErr(JSON.stringify(e)) } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!delTarget) return
    const map: Record<string, string> = { annee: '/annees/', cycle: '/cycles/', specialite: '/specialites/' }
    await apiFetch(`${map[delTarget.type]}${delTarget.id}/`, { method: 'DELETE' }).catch(() => {})
    setDelTarget(null); loadAll()
  }

  return (
    <div>
      {/* Sélecteur établissement */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <h2 style={S.h2}>Paramétrage académique</h2>
        <select style={{ padding: '0.4rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.875rem', outline: 'none', background: '#fff' }}
          value={etabSel} onChange={e => setEtabSel(e.target.value)}>
          {etabs.map(e => <option key={e.id} value={e.id}>{e.code} — {e.libelle}</option>)}
        </select>
      </div>

      {/* Sous-sections */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
        {(['annees', 'cycles', 'specialites'] as const).map(s => {
          const labels = { annees: 'Années académiques', cycles: 'Cycles', specialites: 'Spécialités' }
          return (
            <button key={s} onClick={() => setSection(s)} style={{
              padding: '0.4rem 0.875rem', border: '1px solid', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              background: section === s ? '#1AAFE6' : '#fff',
              color: section === s ? '#fff' : '#64748b',
              borderColor: section === s ? '#1AAFE6' : '#e2e8f0',
            }}>{labels[s]}</button>
          )
        })}
      </div>

      {/* ── Années ── */}
      {section === 'annees' && (
        <div>
          <div style={S.hdr}>
            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{annees.length} année{annees.length > 1 ? 's' : ''}</span>
            <button style={S.btnPrimary} onClick={() => { setAnneeForm({ libelle: '', is_active: false }); setErr(null); setAnneeModal('new') }}>
              <Plus size={14} /> Nouvelle année
            </button>
          </div>
          <div style={S.card}>
            {annees.length === 0 ? <div style={S.empty}>Aucune année académique.</div>
              : annees.map((a, i) => (
                <div key={a.id} style={i === annees.length - 1 ? S.cardRowLast : S.cardRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{a.libelle}</span>
                    {a.is_active && <span style={{ ...S.badge, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Active</span>}
                  </div>
                  <div style={S.iconBtns}>
                    <button style={S.iconBtn} onClick={() => { setAnneeForm({ libelle: a.libelle, is_active: a.is_active }); setErr(null); setAnneeModal(a) }}><Pencil size={15} color="#64748b" /></button>
                    <button style={S.iconBtn} onClick={() => setDelTarget({ type: 'annee', id: a.id, label: a.libelle })}><Trash2 size={15} color="#ef4444" /></button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Cycles ── */}
      {section === 'cycles' && (
        <div>
          <div style={S.hdr}>
            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{cycles.length} cycle{cycles.length > 1 ? 's' : ''}</span>
            <button style={S.btnPrimary} onClick={() => { setCycleForm({ code: '', libelle: '' }); setErr(null); setCycleModal('new') }}>
              <Plus size={14} /> Nouveau cycle
            </button>
          </div>
          <div style={S.card}>
            {cycles.length === 0 ? <div style={S.empty}>Aucun cycle.</div>
              : cycles.map((c, i) => (
                <div key={c.id} style={i === cycles.length - 1 ? S.cardRowLast : S.cardRow}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{c.libelle}</span>
                    <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#94a3b8' }}>{c.code}</span>
                  </div>
                  <div style={S.iconBtns}>
                    <button style={S.iconBtn} onClick={() => { setCycleForm({ code: c.code, libelle: c.libelle }); setErr(null); setCycleModal(c) }}><Pencil size={15} color="#64748b" /></button>
                    <button style={S.iconBtn} onClick={() => setDelTarget({ type: 'cycle', id: c.id, label: c.libelle })}><Trash2 size={15} color="#ef4444" /></button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Spécialités ── */}
      {section === 'specialites' && (
        <div>
          <div style={S.hdr}>
            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{specs.length} spécialité{specs.length > 1 ? 's' : ''}</span>
            <button style={S.btnPrimary} onClick={() => { setSpecForm({ code: '', libelle: '', cycle: cycles[0] ? String(cycles[0].id) : '' }); setErr(null); setSpecModal('new') }}>
              <Plus size={14} /> Nouvelle spécialité
            </button>
          </div>
          <div style={S.card}>
            {specs.length === 0 ? <div style={S.empty}>Aucune spécialité.</div>
              : specs.map((s, i) => (
                <div key={s.id} style={i === specs.length - 1 ? S.cardRowLast : S.cardRow}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{s.libelle}</div>
                    <div style={S.rowSub}>{s.code}{s.cycle_libelle ? ` · ${s.cycle_libelle}` : ''}</div>
                  </div>
                  <div style={S.iconBtns}>
                    <button style={S.iconBtn} onClick={() => { setSpecForm({ code: s.code, libelle: s.libelle, cycle: s.cycle ? String(s.cycle) : '' }); setErr(null); setSpecModal(s) }}><Pencil size={15} color="#64748b" /></button>
                    <button style={S.iconBtn} onClick={() => setDelTarget({ type: 'specialite', id: s.id, label: s.libelle })}><Trash2 size={15} color="#ef4444" /></button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal Année */}
      {anneeModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={S.mTitle}>{anneeModal === 'new' ? 'Nouvelle année académique' : 'Modifier l\'année'}</h3>
            {err && <div style={S.errBox}>{err}</div>}
            <div style={S.fg}><label style={S.label}>Libellé * (ex: 2024-2025)</label><input style={S.input} value={anneeForm.libelle} onChange={e => setAnneeForm(f => ({ ...f, libelle: e.target.value }))} placeholder="2024-2025" /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
              <input type="checkbox" checked={anneeForm.is_active} onChange={e => setAnneeForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#10b981' }} />
              Année active (désactive automatiquement les autres)
            </label>
            <div style={S.actions}>
              <button style={S.btnCancel} onClick={() => setAnneeModal(null)}>Annuler</button>
              <button style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={saveAnnee} disabled={saving}>{saving ? '…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cycle */}
      {cycleModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={S.mTitle}>{cycleModal === 'new' ? 'Nouveau cycle' : 'Modifier le cycle'}</h3>
            {err && <div style={S.errBox}>{err}</div>}
            <div style={S.row2}>
              <div style={S.fg}><label style={S.label}>Code *</label><input style={S.input} value={cycleForm.code} onChange={e => setCycleForm(f => ({ ...f, code: e.target.value }))} placeholder="LIC" /></div>
              <div style={S.fg}><label style={S.label}>Libellé *</label><input style={S.input} value={cycleForm.libelle} onChange={e => setCycleForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Licence" /></div>
            </div>
            <div style={S.actions}>
              <button style={S.btnCancel} onClick={() => setCycleModal(null)}>Annuler</button>
              <button style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={saveCycle} disabled={saving}>{saving ? '…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Spécialité */}
      {specModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={S.mTitle}>{specModal === 'new' ? 'Nouvelle spécialité' : 'Modifier la spécialité'}</h3>
            {err && <div style={S.errBox}>{err}</div>}
            <div style={S.fg}>
              <label style={S.label}>Cycle</label>
              <select style={S.fSelect} value={specForm.cycle} onChange={e => setSpecForm(f => ({ ...f, cycle: e.target.value }))}>
                <option value="">— sans cycle —</option>
                {cycles.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
              </select>
            </div>
            <div style={S.row2}>
              <div style={S.fg}><label style={S.label}>Code *</label><input style={S.input} value={specForm.code} onChange={e => setSpecForm(f => ({ ...f, code: e.target.value }))} placeholder="INFO" /></div>
              <div style={S.fg}><label style={S.label}>Libellé *</label><input style={S.input} value={specForm.libelle} onChange={e => setSpecForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Informatique" /></div>
            </div>
            <div style={S.actions}>
              <button style={S.btnCancel} onClick={() => setSpecModal(null)}>Annuler</button>
              <button style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={saveSpec} disabled={saving}>{saving ? '…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {delTarget && <Confirm msg={`Supprimer "${delTarget.label}" ?`} onYes={doDelete} onNo={() => setDelTarget(null)} />}
    </div>
  )
}

/* ════════════════════════════════════════
   PAGE PRINCIPALE
════════════════════════════════════════ */
type Tab = 'universites' | 'etablissements' | 'comptes' | 'parametrage'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('universites')

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'universites',    label: 'Universités',      icon: <Building2 size={15} /> },
    { id: 'etablissements', label: 'Établissements',   icon: <GraduationCap size={15} /> },
    { id: 'comptes',        label: 'Comptes',          icon: <Users size={15} /> },
    { id: 'parametrage',    label: 'Paramétrage',      icon: <Settings size={15} /> },
  ]

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>
          Administration
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
          Configuration du système — universités, établissements, comptes et paramétrage académique
        </p>
      </div>

      <div style={S.tabs}>
        {tabs.map(t => (
          <button key={t.id} style={tab === t.id ? S.tabActive : S.tab} onClick={() => setTab(t.id)}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{t.icon}{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'universites'    && <TabUniversites />}
      {tab === 'etablissements' && <TabEtablissements />}
      {tab === 'comptes'        && <TabComptes />}
      {tab === 'parametrage'    && <TabParametrage />}
    </div>
  )
}
