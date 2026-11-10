import { useState } from 'react'
import { Avatar, Badge, Button, Card, Empty, Field, IconButton, Input, Modal, PageHeader, Select, Tabs, confirmAction, useForm } from '../components/ui'
import { useStore } from '../store/StoreContext'
import { Link } from '../router'
import { t } from '../i18n'
import { fmtDate } from '../utils/format'
import { ROLE_TONES } from '../utils/permissions'
import { teacherById } from '../utils/finance'

/** Xodimlar va ularning tizimga kirish hisoblari (faqat direktor) */
export default function Staff() {
  const { db, user, update, remove, notify } = useStore()
  const [role, setRole] = useState('all')
  const [edit, setEdit] = useState(null)

  const list = db.users
    .filter((u) => role === 'all' || u.role === role)
    .sort((a, b) => ['director', 'admin', 'teacher'].indexOf(a.role) - ['director', 'admin', 'teacher'].indexOf(b.role))
  const count = (r) => db.users.filter((u) => u.role === r).length
  const activeDirectors = db.users.filter((u) => u.role === 'director' && u.active !== false)

  const isLastDirector = (u) => u.role === 'director' && u.active !== false && activeDirectors.length <= 1

  const toggle = (u) => {
    if (u.id === user.id) return notify(t('staff.notSelf'), 'error')
    if (isLastDirector(u)) return notify(t('staff.lastDirector'), 'error')
    update('users', u.id, { active: u.active === false })
    notify(u.active === false ? t('staff.unblocked') : t('staff.blocked'), 'info')
  }
  const del = (u) => {
    if (u.id === user.id) return notify(t('staff.notSelf'), 'error')
    if (isLastDirector(u)) return notify(t('staff.lastDirector'), 'error')
    if (!confirmAction(t('common.confirmDelete', { name: u.fullName }))) return
    remove('users', u.id)
    notify(t('common.deleted'), 'info')
  }

  return (
    <>
      <PageHeader
        title={t('nav.staff')}
        subtitle={t('staff.subtitle')}
        actions={<Button icon="plus" onClick={() => setEdit({})}>{t('staff.add')}</Button>}
      />
      <Tabs value={role} onChange={setRole} items={[
        { value: 'all', label: t('common.all'), count: db.users.length },
        { value: 'director', label: t('role.director'), count: count('director') },
        { value: 'admin', label: t('role.admin'), count: count('admin') },
        { value: 'teacher', label: t('role.teacher'), count: count('teacher') },
      ]} />

      <div className="role-legend">
        {['director', 'admin', 'teacher'].map((r) => (
          <div key={r}><Badge tone={ROLE_TONES[r]}>{t('role.' + r)}</Badge><span className="muted">{t('roleHint.' + r)}</span></div>
        ))}
      </div>

      <Card pad={false}>
        {list.length === 0 ? (
          <Empty icon="shield" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>{t('field.fullName')}</th><th>{t('auth.login')}</th><th>{t('field.role')}</th><th>{t('field.status')}</th><th>{t('staff.created')}</th><th /></tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id} className={u.active === false ? 'row-off' : ''}>
                    <td>
                      <span className="person"><Avatar name={u.fullName} size={30} />
                        <span>
                          {u.fullName} {u.id === user.id && <small className="muted">({t('staff.you')})</small>}
                          {u.teacherId && <small className="muted block">{teacherById(db, u.teacherId)?.subject}</small>}
                        </span>
                      </span>
                    </td>
                    <td><code className="code">{u.login}</code></td>
                    <td><Badge tone={ROLE_TONES[u.role]}>{t('role.' + u.role)}</Badge></td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" checked={u.active !== false} onChange={() => toggle(u)} />
                        <span>{u.active !== false ? t('staff.active') : t('staff.inactive')}</span>
                      </label>
                    </td>
                    <td className="muted">{u.createdAt ? fmtDate(u.createdAt) : '—'}</td>
                    <td className="actions">
                      {u.role === 'teacher' ? (
                        <Link className="btn btn-ghost btn-sm" to="/teachers">{t('staff.manageInTeachers')}</Link>
                      ) : (
                        <>
                          <IconButton icon="edit" title={t('common.edit')} onClick={() => setEdit(u)} />
                          <IconButton icon="trash" tone="red" title={t('common.delete')} onClick={() => del(u)} />
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="muted small-note">{t('staff.teacherNote')}</p>

      <StaffForm open={!!edit} staff={edit?.id ? edit : null} onClose={() => setEdit(null)} />
    </>
  )
}

function StaffForm({ open, onClose, staff }) {
  if (!open) return null
  return <Inner onClose={onClose} staff={staff} />
}

function Inner({ onClose, staff }) {
  const { db, user, add, update, notify } = useStore()
  const [v, set] = useForm({ fullName: '', login: '', role: 'admin', ...staff, password: '' })
  const [errors, setErrors] = useState({})
  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (v.fullName.trim().length < 3) errs.fullName = t('form.required')
    if (!/^[a-zA-Z0-9_.]{3,}$/.test(v.login)) errs.login = t('form.login')
    else if (db.users.some((u) => u.login.toLowerCase() === v.login.toLowerCase() && u.id !== staff?.id)) errs.login = t('form.loginTaken')
    if (!staff && v.password.length < 6) errs.password = t('settings.passShort')
    if (staff && v.password && v.password.length < 6) errs.password = t('settings.passShort')
    if (staff?.id === user.id && v.role !== 'director') errs.role = t('staff.notSelf')
    setErrors(errs)
    if (Object.keys(errs).length) return
    const data = { fullName: v.fullName.trim(), login: v.login.trim(), role: v.role, ...(v.password ? { password: v.password } : {}) }
    if (staff) update('users', staff.id, data)
    else add('users', { ...data, active: true })
    notify(t('common.saved'))
    onClose()
  }
  return (
    <Modal open title={staff ? t('staff.edit') : t('staff.add')} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button><Button form="staff-form" type="submit" icon="check">{t('common.save')}</Button></>}>
      <form id="staff-form" className="form-grid" onSubmit={submit}>
        <Field label={t('field.fullName')} error={errors.fullName} full><Input autoFocus value={v.fullName} onChange={set('fullName')} /></Field>
        <Field label={t('field.role')} error={errors.role}>
          <Select value={v.role} onChange={set('role')} options={['admin', 'director'].map((r) => ({ value: r, label: t('role.' + r) }))} />
        </Field>
        <Field label={t('auth.login')} error={errors.login} hint={t('form.loginHint')}><Input value={v.login} onChange={set('login')} autoComplete="off" /></Field>
        <Field label={staff ? t('settings.newPassword') : t('auth.password')} error={errors.password} hint={staff ? t('settings.passHint') : t('settings.passShort')} full>
          <Input type="text" value={v.password} onChange={set('password')} autoComplete="new-password" />
        </Field>
      </form>
    </Modal>
  )
}
