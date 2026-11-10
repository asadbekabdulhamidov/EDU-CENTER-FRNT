import { useRef, useState } from 'react'
import { Button, Card, Field, Input, PageHeader, useForm, confirmAction } from '../components/ui'
import { LangSwitch } from '../components/Layout'
import { useStore } from '../store/StoreContext'
import { t } from '../i18n'
import { today } from '../utils/format'

export default function Settings() {
  const { db, user, update, updateSettings, replaceAll, resetDemo, clearAll, notify } = useStore()
  const [v, set] = useForm({ centerName: db.settings.centerName, phone: db.settings.phone, address: db.settings.address })
  const [acc, setAcc] = useState({ login: user.login, fullName: user.fullName, password: '', password2: '' })
  const [accErr, setAccErr] = useState('')
  const fileRef = useRef(null)

  const saveCenter = (e) => {
    e.preventDefault()
    updateSettings(v)
    notify(t('common.saved'))
  }
  const saveAccount = (e) => {
    e.preventDefault()
    if (!acc.login.trim()) return setAccErr(t('form.required'))
    if (acc.password && acc.password.length < 6) return setAccErr(t('settings.passShort'))
    if (acc.password !== acc.password2) return setAccErr(t('settings.passMismatch'))
    if (db.users.some((u) => u.login.toLowerCase() === acc.login.trim().toLowerCase() && u.id !== user.id)) return setAccErr(t('form.loginTaken'))
    setAccErr('')
    update('users', user.id, { login: acc.login.trim(), fullName: acc.fullName, ...(acc.password ? { password: acc.password } : {}) })
    setAcc((a) => ({ ...a, password: '', password2: '' }))
    notify(t('common.saved'))
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `edu-center-backup-${today()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importJson = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!confirmAction(t('settings.confirmImport'))) return
        replaceAll(data)
        notify(t('settings.imported'))
      } catch {
        notify(t('settings.badFile'), 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const counts = [
    ['nav.students', db.students.length], ['nav.groups', db.groups.length], ['nav.teachers', db.teachers.length],
    ['nav.payments', db.payments.length], ['nav.leads', db.leads.length], ['nav.staff', db.users.length],
  ]

  return (
    <>
      <PageHeader title={t('nav.settings')} />
      <div className="grid-2">
        <Card title={t('settings.center')}>
          <form className="form-grid" onSubmit={saveCenter}>
            <Field label={t('settings.centerName')} full><Input value={v.centerName} onChange={set('centerName')} /></Field>
            <Field label={t('field.phone')}><Input value={v.phone} onChange={set('phone')} /></Field>
            <Field label={t('settings.address')}><Input value={v.address} onChange={set('address')} /></Field>
            <div className="field-full"><Button type="submit" icon="check">{t('common.save')}</Button></div>
          </form>
        </Card>
        <Card title={t('settings.account')}>
          <form className="form-grid" onSubmit={saveAccount}>
            <Field label={t('settings.fullName')}><Input value={acc.fullName} onChange={(e) => setAcc({ ...acc, fullName: e.target.value })} /></Field>
            <Field label={t('auth.login')}><Input value={acc.login} onChange={(e) => setAcc({ ...acc, login: e.target.value })} /></Field>
            <Field label={t('settings.newPassword')} hint={t('settings.passHint')}><Input type="password" value={acc.password} onChange={(e) => setAcc({ ...acc, password: e.target.value })} /></Field>
            <Field label={t('settings.repeatPassword')} error={accErr}><Input type="password" value={acc.password2} onChange={(e) => setAcc({ ...acc, password2: e.target.value })} /></Field>
            <div className="field-full"><Button type="submit" icon="check">{t('common.save')}</Button></div>
          </form>
        </Card>
      </div>

      <div className="grid-2">
        <Card title={t('common.language')}>
          <p className="muted">{t('settings.langHint')}</p>
          <LangSwitch />
        </Card>
        <Card title={t('settings.data')}>
          <p className="muted">{t('settings.dataHint')}</p>
          <div className="data-counts">
            {counts.map(([k, n]) => <span key={k}><b>{n}</b>{t(k)}</span>)}
          </div>
          <div className="row-actions wrap">
            <Button variant="ghost" icon="download" onClick={exportJson}>{t('settings.export')}</Button>
            <Button variant="ghost" icon="upload" onClick={() => fileRef.current?.click()}>{t('settings.import')}</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importJson} />
          </div>
          <div className="danger-zone">
            <Button variant="soft" onClick={() => { if (confirmAction(t('settings.confirmDemo'))) { resetDemo(); notify(t('settings.demoLoaded')) } }}>{t('settings.loadDemo')}</Button>
            <Button variant="danger" icon="trash" onClick={() => { if (confirmAction(t('settings.confirmClear'))) { clearAll(); notify(t('settings.cleared'), 'info') } }}>{t('settings.clear')}</Button>
          </div>
        </Card>
      </div>
    </>
  )
}
