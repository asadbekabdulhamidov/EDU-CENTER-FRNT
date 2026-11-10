import { useState } from 'react'
import { Avatar, Badge, Button, Card, Empty, Field, IconButton, Input, Modal, PageHeader, Select, confirmAction, useForm } from '../components/ui'
import { useStore } from '../store/StoreContext'
import { Link } from '../router'
import { t } from '../i18n'
import { currentMonth, fmtDate, monthLabel, money, today } from '../utils/format'
import { groupStudents, teacherSalary } from '../utils/finance'

export default function Teachers() {
  const { db, remove, notify } = useStore()
  const [edit, setEdit] = useState(null)
  const month = currentMonth()
  const totalSalary = db.teachers.reduce((s, tch) => s + teacherSalary(db, tch, month), 0)

  const del = (tch) => {
    if (db.groups.some((g) => g.teacherId === tch.id)) {
      notify(t('teacher.hasGroups'), 'error')
      return
    }
    if (!confirmAction(t('common.confirmDelete', { name: tch.fullName }))) return
    remove('teachers', tch.id)
    notify(t('common.deleted'), 'info')
  }

  return (
    <>
      <PageHeader
        title={t('nav.teachers')}
        subtitle={t('teacher.subtitle', { month: monthLabel(month), sum: money(totalSalary) })}
        actions={<Button icon="plus" onClick={() => setEdit({})}>{t('teacher.add')}</Button>}
      />
      <Card pad={false}>
        {db.teachers.length === 0 ? (
          <Empty icon="teacher" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('field.fullName')}</th><th>{t('field.phone')}</th><th>{t('field.subject')}</th><th>{t('nav.groups')}</th>
                  <th>{t('field.salaryType')}</th><th>{t('teacher.account')}</th><th className="num">{t('teacher.salaryMonth')}</th><th />
                </tr>
              </thead>
              <tbody>
                {db.teachers.map((tch) => {
                  const groups = db.groups.filter((g) => g.teacherId === tch.id && g.status !== 'finished')
                  const studentsN = groups.reduce((s, g) => s + groupStudents(db, g.id).length, 0)
                  return (
                    <tr key={tch.id}>
                      <td>
                        <span className="person"><Avatar name={tch.fullName} size={30} />
                          <span>{tch.fullName}<small className="muted block">{t('teacher.since', { date: fmtDate(tch.hiredAt) })}</small></span>
                        </span>
                      </td>
                      <td className="nowrap">{tch.phone}</td>
                      <td>{tch.subject}</td>
                      <td>
                        <div className="chips">
                          {groups.map((g) => <Link key={g.id} to={`/groups/${g.id}`}><Badge tone="blue">{g.name}</Badge></Link>)}
                          {!groups.length && <span className="muted">—</span>}
                        </div>
                        <small className="muted">{t('group.studentsN', { n: studentsN })}</small>
                      </td>
                      <td>{tch.salaryType === 'percent' ? `${tch.salaryValue}% ${t('teacher.ofPayments')}` : money(tch.salaryValue)}</td>
                      <td>
                        {(() => {
                          const acc = db.users.find((u) => u.teacherId === tch.id)
                          if (!acc) return <Badge tone="gray">{t('teacher.noAccount')}</Badge>
                          return acc.active === false
                            ? <Badge tone="red">{acc.login} · {t('staff.inactive')}</Badge>
                            : <code className="code">{acc.login}</code>
                        })()}
                      </td>
                      <td className="num"><b>{money(teacherSalary(db, tch, month))}</b></td>
                      <td className="actions">
                        <IconButton icon="edit" title={t('common.edit')} onClick={() => setEdit(tch)} />
                        <IconButton icon="trash" tone="red" title={t('common.delete')} onClick={() => del(tch)} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <TeacherForm open={!!edit} teacher={edit?.id ? edit : null} onClose={() => setEdit(null)} />
    </>
  )
}

function TeacherForm({ open, onClose, teacher }) {
  if (!open) return null
  return <Inner onClose={onClose} teacher={teacher} />
}

function Inner({ onClose, teacher }) {
  const { db, add, update, saveTeacherAccount, notify } = useStore()
  const account = teacher && db.users.find((u) => u.teacherId === teacher.id)
  const [v, set] = useForm({
    fullName: '', phone: '+998 ', subject: '', salaryType: 'percent', salaryValue: 40, hiredAt: today(), ...teacher,
    login: account?.login || '', password: '',
  })
  const [errors, setErrors] = useState({})
  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (v.fullName.trim().length < 3) errs.fullName = t('form.required')
    if (v.phone.replace(/\D/g, '').length < 9) errs.phone = t('form.phone')
    if (!(Number(v.salaryValue) > 0)) errs.salaryValue = t('form.positive')
    if (v.salaryType === 'percent' && Number(v.salaryValue) > 100) errs.salaryValue = '0–100%'
    if (v.login) {
      if (!/^[a-zA-Z0-9_.]{3,}$/.test(v.login)) errs.login = t('form.login')
      else if (db.users.some((u) => u.login.toLowerCase() === v.login.toLowerCase() && u.id !== account?.id)) errs.login = t('form.loginTaken')
      if (!account && v.password.length < 6) errs.password = t('settings.passShort')
      if (account && v.password && v.password.length < 6) errs.password = t('settings.passShort')
    }
    setErrors(errs)
    if (Object.keys(errs).length) return
    const { login, password, ...rest } = v
    const data = { ...rest, salaryValue: Number(v.salaryValue) }
    const saved = teacher ? (update('teachers', teacher.id, data), teacher) : add('teachers', data)
    if (login || account) saveTeacherAccount(saved.id, { login: login.trim(), password, fullName: data.fullName })
    notify(t('common.saved'))
    onClose()
  }
  return (
    <Modal open title={teacher ? t('teacher.edit') : t('teacher.add')} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button><Button form="teacher-form" type="submit" icon="check">{t('common.save')}</Button></>}>
      <form id="teacher-form" className="form-grid" onSubmit={submit}>
        <Field label={t('field.fullName')} error={errors.fullName} full><Input autoFocus value={v.fullName} onChange={set('fullName')} /></Field>
        <Field label={t('field.phone')} error={errors.phone}><Input value={v.phone} onChange={set('phone')} /></Field>
        <Field label={t('field.subject')}><Input value={v.subject} onChange={set('subject')} /></Field>
        <Field label={t('field.salaryType')}>
          <Select value={v.salaryType} onChange={set('salaryType')} options={[
            { value: 'percent', label: t('teacher.percent') },
            { value: 'fixed', label: t('teacher.fixed') },
          ]} />
        </Field>
        <Field label={v.salaryType === 'percent' ? t('teacher.percentValue') : t('teacher.fixedValue')} error={errors.salaryValue}>
          <Input type="number" min="0" value={v.salaryValue} onChange={set('salaryValue')} />
        </Field>
        <Field label={t('field.hiredAt')}><Input type="date" value={v.hiredAt} onChange={set('hiredAt')} /></Field>
        <div className="form-section field-full">
          <strong>{t('teacher.accountTitle')}</strong>
          <span className="muted">{t('teacher.accountHint')}</span>
        </div>
        <Field label={t('auth.login')} error={errors.login} hint={account ? t('teacher.clearLogin') : t('form.loginHint')}>
          <Input value={v.login} onChange={set('login')} autoComplete="off" placeholder="ism.familiya" />
        </Field>
        <Field label={account ? t('settings.newPassword') : t('auth.password')} error={errors.password} hint={account ? t('settings.passHint') : ''}>
          <Input type="text" value={v.password} onChange={set('password')} autoComplete="new-password" disabled={!v.login} />
        </Field>
      </form>
    </Modal>
  )
}
