import { useEffect, useState } from 'react'
import Icon from './Icon'
import { t } from '../i18n'
import { initials } from '../utils/format'

export function Button({ variant = 'primary', size, icon, children, className = '', ...rest }) {
  return (
    <button className={`btn btn-${variant} ${size ? 'btn-' + size : ''} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
    </button>
  )
}

export function IconButton({ icon, title, tone, ...rest }) {
  return (
    <button className={`icon-btn ${tone ? 'icon-btn-' + tone : ''}`} title={title} aria-label={title} {...rest}>
      <Icon name={icon} size={16} />
    </button>
  )
}

export function Field({ label, hint, error, children, full }) {
  return (
    <label className={`field ${full ? 'field-full' : ''}`}>
      {label && <span className="field-label">{label}</span>}
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}

export const Input = (props) => <input className="input" {...props} />
export const Textarea = (props) => <textarea className="input" rows={3} {...props} />
export function Select({ options, placeholder, ...rest }) {
  return (
    <select className="input" {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="search">
      <Icon name="search" size={16} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || t('common.search')} />
    </div>
  )
}

export const Badge = ({ tone = 'gray', children }) => <span className={`badge badge-${tone}`}>{children}</span>

export const Avatar = ({ name, size = 34 }) => {
  const hue = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <span className="avatar" style={{ width: size, height: size, background: `hsl(${hue} 45% 92%)`, color: `hsl(${hue} 45% 32%)` }}>
      {initials(name)}
    </span>
  )
}

export function Modal({ open, title, onClose, children, footer, width = 560 }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth: width }} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <IconButton icon="x" title={t('common.close')} onClick={onClose} />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="page-head">
      <div>
        {back && (
          <a className="back-link" href={'#' + back}>
            <Icon name="arrowLeft" size={15} /> {t('common.back')}
          </a>
        )}
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, icon, tone = 'green', foot }) {
  return (
    <div className={`stat stat-${tone}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-icon"><Icon name={icon} size={18} /></span>}
      </div>
      <div className="stat-value">{value}</div>
      {foot && <div className="stat-foot">{foot}</div>}
    </div>
  )
}

export function Empty({ icon = 'search', title, text, action }) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon name={icon} size={22} /></span>
      <strong>{title || t('common.empty')}</strong>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  )
}

export function Card({ title, actions, children, className = '', pad = true }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-head">
          <h3>{title}</h3>
          {actions}
        </div>
      )}
      <div className={pad ? 'card-body' : ''}>{children}</div>
    </section>
  )
}

export function Tabs({ value, onChange, items }) {
  return (
    <div className="tabs">
      {items.map((it) => (
        <button key={it.value} className={`tab ${value === it.value ? 'active' : ''}`} onClick={() => onChange(it.value)}>
          {it.label}
          {it.count !== undefined && <span className="tab-count">{it.count}</span>}
        </button>
      ))}
    </div>
  )
}

/** Oddiy forma holati: [qiymatlar, set('kalit') => onChange handler, setAll] */
export function useForm(initial) {
  const [values, setValues] = useState(initial)
  const set = (key) => (e) => {
    const v = e && e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e
    setValues((p) => ({ ...p, [key]: v }))
  }
  return [values, set, setValues]
}

export const confirmAction = (message) => window.confirm(message)
