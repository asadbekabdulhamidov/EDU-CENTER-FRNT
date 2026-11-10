import { useState } from 'react'
import { Button, Field, Input } from '../components/ui'
import Icon from '../components/Icon'
import { LangSwitch } from '../components/Layout'
import { useStore } from '../store/StoreContext'
import { t } from '../i18n'

const DEMO = [
  { role: 'director', login: 'admin', password: 'admin123' },
  { role: 'admin', login: 'menejer', password: '123456' },
  { role: 'teacher', login: 'asadbek', password: '123456' },
]

export default function Login() {
  const { db, login } = useStore()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const res = login(form.login, form.password)
    if (res === 'wrong') setError(t('auth.wrong'))
    if (res === 'blocked') setError(t('auth.blocked'))
  }

  // Demo hisoblar faqat bazada mavjud bo'lsa ko'rsatiladi
  const demo = DEMO.filter((d) => db.users.some((u) => u.login === d.login && u.password === d.password))

  return (
    <div className="login">
      <div className="login-art">
        <div className="brand brand-lg">
          <span className="brand-mark"><Icon name="teacher" size={24} /></span>
          <div>
            <strong>{db.settings.centerName}</strong>
            <small>ERP · MVP</small>
          </div>
        </div>
        <h2>{t('auth.heroTitle')}</h2>
        <ul>
          <li><Icon name="students" /> {t('auth.f1')}</li>
          <li><Icon name="wallet" /> {t('auth.f2')}</li>
          <li><Icon name="check" /> {t('auth.f3')}</li>
          <li><Icon name="funnel" /> {t('auth.f4')}</li>
        </ul>
      </div>
      <div className="login-panel">
        <div className="login-lang"><LangSwitch /></div>
        <form className="login-form" onSubmit={submit}>
          <h1>{t('auth.title')}</h1>
          <p className="muted">{t('auth.subtitle')}</p>
          <Field label={t('auth.login')}>
            <Input autoFocus value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} placeholder="login" autoComplete="username" />
          </Field>
          <Field label={t('auth.password')} error={error}>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" autoComplete="current-password" />
          </Field>
          <Button type="submit" className="btn-block">{t('auth.enter')}</Button>
          {demo.length > 0 && (
            <div className="demo-hint">
              <span>{t('auth.demo')}:</span>
              <div className="demo-accounts">
                {demo.map((d) => (
                  <button type="button" key={d.login} onClick={() => { setForm({ login: d.login, password: d.password }); setError('') }}>
                    <b>{t('role.' + d.role)}</b>
                    <code>{d.login} / {d.password}</code>
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
