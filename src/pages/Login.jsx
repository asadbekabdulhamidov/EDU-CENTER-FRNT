import { useState } from 'react'
import { Button, Field, Input } from '../components/ui'
import Icon from '../components/Icon'
import { LangSwitch } from '../components/Layout'
import { useStore } from '../store/StoreContext'
import { t } from '../i18n'

export default function Login() {
  const { db, login } = useStore()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!login(form.login, form.password)) setError(t('auth.wrong'))
  }

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
            <Input autoFocus value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} placeholder="admin" />
          </Field>
          <Field label={t('auth.password')} error={error}>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
          </Field>
          <Button type="submit" className="btn-block">{t('auth.enter')}</Button>
          <div className="demo-hint">
            {t('auth.demo')}: <code>admin</code> / <code>admin123</code>
          </div>
        </form>
      </div>
    </div>
  )
}
