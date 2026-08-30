// Shared paginated table primitives for admin pages
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

export const TABLE_CSS = `
  /* Layout */
  .pt-wrap { background: #fff; border: 1px solid #e8edf3; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(15,23,42,0.04); }

  /* Toolbar */
  .pt-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1.25rem; border-bottom: 1px solid #f1f5f9; gap: 0.75rem; flex-wrap: wrap; }
  .pt-toolbar-left { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }
  .pt-toolbar-right { display: flex; align-items: center; gap: 0.5rem; }

  /* Search */
  .pt-search-wrap { position: relative; }
  .pt-search-ico { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
  .pt-search { height: 34px; padding: 0 0.75rem 0 1.875rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.8rem; color: #1e293b; background: #f8fafc; outline: none; width: 190px; transition: all 0.15s; }
  .pt-search:focus { border-color: #1AAFE6; background: #fff; box-shadow: 0 0 0 3px rgba(26,175,230,0.08); }

  /* Select filter */
  .pt-sel { height: 34px; padding: 0 2rem 0 0.625rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.8rem; color: #475569; background: #f8fafc url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 8px center; appearance: none; -webkit-appearance: none; outline: none; cursor: pointer; transition: all 0.15s; }
  .pt-sel:focus { border-color: #1AAFE6; background-color: #fff; box-shadow: 0 0 0 3px rgba(26,175,230,0.08); }

  /* Add button */
  .pt-add { height: 34px; padding: 0 0.875rem; border-radius: 8px; border: none; background: #1AAFE6; color: #fff; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; transition: background 0.15s; }
  .pt-add:hover { background: #1490c2; }

  /* Table */
  .pt-table { width: 100%; border-collapse: collapse; }
  .pt-table th { padding: 0.625rem 1rem; text-align: left; font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; background: #fafbfc; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
  .pt-table th:first-child { padding-left: 1.25rem; }
  .pt-table th:last-child { padding-right: 1.25rem; text-align: right; }
  .pt-table td { padding: 0.75rem 1rem; font-size: 0.8125rem; color: #334155; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
  .pt-table td:first-child { padding-left: 1.25rem; }
  .pt-table td:last-child { padding-right: 1.25rem; text-align: right; }
  .pt-table tr:last-child td { border-bottom: none; }
  .pt-table tr:hover td { background: #fafbfd; }

  /* Cell helpers */
  .pt-primary { font-weight: 600; color: #0f172a; }
  .pt-secondary { font-size: 0.72rem; color: #94a3b8; margin-top: 1px; }
  .pt-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
  .pt-avatar { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 800; color: #fff; flex-shrink: 0; }
  .pt-cell-row { display: flex; align-items: center; gap: 0.625rem; }

  /* Actions */
  .pt-actions { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
  .pt-ico-btn { width: 28px; height: 28px; border-radius: 7px; border: 1px solid #f1f5f9; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #94a3b8; transition: all 0.12s; }
  .pt-ico-btn:hover { background: #f8fafc; color: #475569; border-color: #e2e8f0; }
  .pt-ico-btn.del:hover { background: rgba(239,68,68,0.06); color: #ef4444; border-color: rgba(239,68,68,0.15); }

  /* Empty */
  .pt-empty { padding: 3.5rem 2rem; text-align: center; color: #94a3b8; font-size: 0.875rem; }

  /* Footer / pagination */
  .pt-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; border-top: 1px solid #f1f5f9; flex-wrap: wrap; gap: 0.5rem; }
  .pt-count { font-size: 0.75rem; color: #94a3b8; }
  .pt-pager { display: flex; align-items: center; gap: 4px; }
  .pt-pg-btn { width: 28px; height: 28px; border-radius: 7px; border: 1px solid #e2e8f0; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.75rem; font-weight: 600; color: #475569; transition: all 0.12s; }
  .pt-pg-btn:hover:not(:disabled) { background: #f1f5f9; }
  .pt-pg-btn:disabled { opacity: 0.4; cursor: default; }
  .pt-pg-btn.active { background: #1AAFE6; border-color: #1AAFE6; color: #fff; }
`

export const TABLE_STYLE = <style>{TABLE_CSS}</style>

export function usePager<T>(items: T[], pageSize = 20) {
  return { items, pageSize }
}

interface PagerProps {
  total: number
  page: number
  pageSize: number
  onPage: (p: number) => void
}

export function Pager({ total, page, pageSize, onPage }: PagerProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const pages: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
  }

  return (
    <div className="pt-pager">
      <button className="pt-pg-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={13} />
      </button>
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`e${i}`} style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '0 2px' }}>…</span>
          : <button key={p} className={`pt-pg-btn${page === p ? ' active' : ''}`} onClick={() => onPage(Number(p))}>{p}</button>
      )}
      <button className="pt-pg-btn" disabled={page === totalPages} onClick={() => onPage(page + 1)}>
        <ChevronRight size={13} />
      </button>
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Rechercher…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="pt-search-wrap">
      <Search size={12} className="pt-search-ico" />
      <input className="pt-search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

// Shared modal backdrop + box
export function Modal({ children, onClose, width = 480 }: { children: React.ReactNode; onClose: () => void; width?: number }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn .15s ease' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: width, boxShadow: '0 24px 48px rgba(15,23,42,0.16)', animation: 'slideUp .2s ease' }}>
        {children}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

export function ModalHead({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.125rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>{title}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 8, color: '#94a3b8', display: 'flex', transition: 'all .15s' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  )
}

export function ModalBody({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>{children}</div>
}

export function ModalFoot({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>{children}</div>
}

export function FLabel({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
        {label}{req && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export function FInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} style={{ width: '100%', height: 38, padding: '0 0.75rem', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: '0.875rem', color: '#1e293b', background: '#fff', outline: 'none', boxSizing: 'border-box', ...props.style }}
      onFocus={e => { e.currentTarget.style.borderColor = '#1AAFE6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,175,230,0.1)' }}
      onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
    />
  )
}

export function FSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className="pt-sel" style={{ width: '100%', height: 38, ...props.style as React.CSSProperties }}>
      {children}
    </select>
  )
}

export function ErrBanner({ msg }: { msg: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '0.625rem 0.875rem', fontSize: '0.8rem', color: '#991b1b' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      {msg}
    </div>
  )
}

export function BtnPrimary({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} style={{ height: 36, padding: '0 1.125rem', borderRadius: 9, border: 'none', background: '#1AAFE6', color: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, opacity: props.disabled ? 0.6 : 1, ...props.style }}>
      {children}
    </button>
  )
}

export function BtnGhost({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} style={{ height: 36, padding: '0 1.125rem', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, ...props.style }}>
      {children}
    </button>
  )
}

export function ConfirmModal({ name, onYes, onNo }: { name: string; onYes: () => void; onNo: () => void }) {
  return (
    <Modal onClose={onNo} width={380}>
      <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </div>
        <div>
          <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 4px', fontSize: '0.9375rem' }}>Confirmer la suppression</p>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            <strong>{name}</strong> sera définitivement supprimé. Cette action est irréversible.
          </p>
        </div>
      </div>
      <ModalFoot>
        <BtnGhost onClick={onNo}>Annuler</BtnGhost>
        <button onClick={onYes} style={{ height: 36, padding: '0 1.125rem', borderRadius: 9, border: 'none', background: '#ef4444', color: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>Supprimer</button>
      </ModalFoot>
    </Modal>
  )
}
