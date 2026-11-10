import { useState } from 'react'
import Icon from './Icon'
import { Avatar } from './ui'
import { useStore } from '../store/StoreContext'
import { can } from '../utils/permissions'
import { LANGS, t } from '../i18n'
import { fmtDate, today, wdFull, weekdayOf } from '../utils/format'

export const NAV = [
  { key: '', page: 'dashboard', icon: 'home', label: 'nav.dashboard' },
  { key: 'students', icon: 'students', label: 'nav.students' },
  { key: 'groups', icon: 'groups', label: 'nav.groups' },
  { key: 'teachers', icon: 'teacher', label: 'nav.teachers' },
  { key: 'courses', icon: 'book', label: 'nav.courses' },
  { key: 'payments', icon: 'wallet', label: 'nav.payments' },
  { key: 'attendance', icon: 'check', label: 'nav.attendance' },
  { key: 'leads', icon: 'funnel', label: 'nav.leads' },
  { key: 'expenses', icon: 'receipt', label: 'nav.expenses' },
  { key: 'staff', icon: 'shield', label: 'nav.staff' },
  { key: 'settings', icon: 'settings', label: 'nav.settings' },
]

/** Bo'limga kirish ruxsati kaliti: '' -> page.dashboard */
export const pagePerm = (section) => 'page.' + (section || 'dashboard')

export function LangSwitch({ compact }) {
  const { lang, setLanguage } = useStore()
  return (
    <div className={`lang-switch ${compact ? 'compact' : ''}`} role="group" aria-label={t('common.language')}>
      {LANGS.map((l) => (
        <button key={l.code} className={lang === l.code ? 'active' : ''} onClick={() => setLanguage(l.code)} title={l.label}>
          {l.short}
        </button>
      ))}
    </div>
  )
}

export default function Layout({ active, children }) {
  const { db, session, logout } = useStore()
  const [open, setOpen] = useState(false)
  const newLeads = db.leads.filter((l) => l.status === 'new').length

  return (
    <div className={`shell ${open ? 'nav-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Icon name="teacher" size={20} /></span>
          <div>
            <strong>{db.settings.centerName}</strong>
            <small>ERP · MVP</small>
          </div>
        </div>
        <nav>
          {NAV.filter((n) => can(session, pagePerm(n.key))).map((n) => (
            <a
              key={n.key}
              href={'#/' + n.key}
              className={`nav-item ${active === n.key ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon name={n.icon} size={18} />
              <span>{t(n.label)}</span>
              {n.key === 'leads' && newLeads > 0 && <span className="nav-count">{newLeads}</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-foot">
          <Avatar name={session?.fullName || 'A'} size={32} />
          <div className="who">
            <strong>{session?.fullName}</strong>
            <small>{t('role.' + session?.role)}</small>
          </div>
          <button className="icon-btn ghost-light" onClick={logout} title={t('auth.logout')} aria-label={t('auth.logout')}>
            <Icon name="logout" size={17} />
          </button>
        </div>
      </aside>
      <div className="backdrop" onClick={() => setOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="menu">
            <Icon name="menu" />
          </button>
          <div className="topbar-date">
            <Icon name="clock" size={16} />
            {wdFull(weekdayOf(today()))}, {fmtDate(today())}
          </div>
          <LangSwitch />
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
