'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { Etablissement, AppUser, ApiList } from '../_shared'
import { ROLES, ROLE_COLORS } from '../_shared'
import {
  TABLE_STYLE, SearchInput, Pager, Modal, ModalHead, ModalBody, ModalFoot,
  FLabel, FInput, FSelect, BtnPrimary, BtnGhost, ErrBanner, ConfirmModal
} from '../_table'

const PAGE_SIZE = 15

export default function ComptesPage() {
  const [etabs, setEtabs]       = useState<Etablissement[]>([])
  const [list, setList]         = useState<AppUser[]>([])
  const [search, setSearch]     = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [page, setPage]         = useState(1)
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState<AppUser | null>(null)
  const [del, setDel]           = useState<AppUser | null>(null)
  const [form, setForm]         = useState({ login: '', nom: '', email: '', role: ROLES[0], password: '', etablissement: '', is_active: true })
  const [err, setErr]           = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    apiFetch<ApiList<Etablissement>>('/etablissements/?limit=200').then(d => setEtabs(d.results)).catch(() => {})
  }, [])

  const load = useCallback(() => {
    const p = new URLSearchParams({ limit: '500' })
    if (filterRole) p.set('role', filterRole)
    apiFetch<ApiList<AppUser>>(`/users/?${p}`).then(d => setList(d.results)).catch(() => {})
  }, [filterRole])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let r = list
    if (filterActive !== '') r = r.filter(u => String(u.is_active) === filterActive)
    const q = search.toLowerCase()
    if (q) r = r.filter(u => u.nom.toLowerCase().includes(q) || u.login.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    return r
  }, [list, search, filterActive])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() {
    setEditing(null)
    setForm({ login: '', nom: '', email: '', role: ROLES[0], password: '', etablissement: '', is_active: true })
    setErr(null); setOpen(true)
  }
  function openEdit(u: AppUser) {
    setEditing(u)
    setForm({ login: u.login, nom: u.nom, email: u.email, role: u.role, password: '', etablissement: u.etablissement ? String(u.etablissement) : '', is_active: u.is_active })
    setErr(null); setOpen(true)
  }

  async function save() {
    if (!form.login || !form.nom || !form.role) { setErr('Login, nom et rôle obligatoires'); return }
    if (!editing && !form.password) { setErr('Le mot de passe est obligatoire'); return }
    setSaving(true); setErr(null)
    try {
      const body: Record<string, unknown> = { login: form.login, nom: form.nom, email: form.email, role: form.role, is_active: form.is_active }
      if (form.password) body.password = form.password
      if (form.etablissement) body.etablissement = Number(form.etablissement)
      if (!editing) await apiFetch('/users/', { method: 'POST', body: JSON.stringify(body) })
      else await apiFetch(`/users/${editing.id}/`, { method: 'PATCH', body: JSON.stringify(body) })
      setOpen(false); load()
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'detail' in e ? String((e as {detail: string}).detail) : 'Erreur lors de la sauvegarde'
      setErr(msg)
    } finally { setSaving(false) }
  }

  async function doDelete() {
    if (!del) return
    await apiFetch(`/users/${del.id}/`, { method: 'DELETE' }).catch(() => {})
    setDel(null); load()
  }

  function initials(nom: string) {
    return nom.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
  }

  return (
    <>
      {TABLE_STYLE}
      <style>{`
        .pg-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:0.75rem; }
        .pg-title  { font-size:1.125rem; font-weight:800; color:#0f172a; letter-spacing:-.02em; margin:0; }
        .pg-sub    { font-size:0.75rem; color:#94a3b8; margin:.25rem 0 0; }
        .role-dot  { width:6px; height:6px; border-radius:50%; display:inline-block; margin-right:5px; }
        .status-on { display:inline-flex; align-items:center; gap:4px; font-size:0.68rem; font-weight:700; padding:2px 8px; border-radius:20px; background:rgba(16,185,129,0.1); color:#10b981; }
        .status-off{ display:inline-flex; align-items:center; gap:4px; font-size:0.68rem; font-weight:700; padding:2px 8px; border-radius:20px; background:rgba(239,68,68,0.08); color:#ef4444; }
      `}</style>

      <div className="pg-header">
        <div>
          <h1 className="pg-title">Comptes utilisateurs</h1>
          <p className="pg-sub">{filtered.length} compte{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="pt-add" onClick={openAdd}><Plus size={13} /> Ajouter</button>
      </div>

      <div className="pt-wrap">
        <div className="pt-toolbar">
          <div className="pt-toolbar-left">
            <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Nom, login, email…" />
            <select className="pt-sel" value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1) }}>
              <option value="">Tous les rôles</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="pt-sel" value={filterActive} onChange={e => { setFilterActive(e.target.value); setPage(1) }}>
              <option value="">Tous les statuts</option>
              <option value="true">Actifs</option>
              <option value="false">Inactifs</option>
            </select>
          </div>
        </div>

        <table className="pt-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Login</th>
              <th>Rôle</th>
              <th>Établissement</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={6}><div className="pt-empty"><Users size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} /><div>Aucun compte trouvé</div></div></td></tr>
            )}
            {paged.map(u => {
              const color = ROLE_COLORS[u.role] || '#94a3b8'
              return (
                <tr key={u.id}>
                  <td>
                    <div className="pt-cell-row">
                      <div className="pt-avatar" style={{ background: color }}>{initials(u.nom)}</div>
                      <div>
                        <div className="pt-primary">{u.nom}</div>
                        <div className="pt-secondary">{u.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>{u.login}</td>
                  <td>
                    <span className="pt-badge" style={{ background: `${color}18`, color }}>
                      <span className="role-dot" style={{ background: color }} />{u.role}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>{u.etablissement_name || <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td>
                    {u.is_active
                      ? <span className="status-on"><svg width="6" height="6" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#10b981"/></svg>Actif</span>
                      : <span className="status-off"><svg width="6" height="6" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#ef4444"/></svg>Inactif</span>
                    }
                  </td>
                  <td>
                    <div className="pt-actions">
                      <button className="pt-ico-btn" onClick={() => openEdit(u)} title="Modifier"><Pencil size={12} /></button>
                      <button className="pt-ico-btn del" onClick={() => setDel(u)} title="Supprimer"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
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
          <ModalHead title={editing ? 'Modifier le compte' : 'Nouveau compte'} onClose={() => setOpen(false)} />
          <ModalBody>
            {err && <ErrBanner msg={err} />}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <FLabel label="Nom complet" req><FInput value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Nom Prénom" /></FLabel>
              <FLabel label="Login" req><FInput value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} placeholder="identifiant" /></FLabel>
            </div>
            <FLabel label="Email"><FInput type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></FLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <FLabel label="Rôle" req>
                <FSelect value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </FSelect>
              </FLabel>
              <FLabel label="Établissement">
                <FSelect value={form.etablissement} onChange={e => setForm(f => ({ ...f, etablissement: e.target.value }))}>
                  <option value="">— Aucun —</option>
                  {etabs.map(e => <option key={e.id} value={e.id}>{e.libelle}</option>)}
                </FSelect>
              </FLabel>
            </div>
            <FLabel label={editing ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'} req={!editing}>
              <FInput type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            </FLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="active-chk" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="active-chk" style={{ fontSize: '0.8125rem', color: '#475569', cursor: 'pointer' }}>Compte actif</label>
            </div>
          </ModalBody>
          <ModalFoot>
            <BtnGhost onClick={() => setOpen(false)}>Annuler</BtnGhost>
            <BtnPrimary onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</BtnPrimary>
          </ModalFoot>
        </Modal>
      )}

      {del && <ConfirmModal name={del.nom} onYes={doDelete} onNo={() => setDel(null)} />}
    </>
  )
}
