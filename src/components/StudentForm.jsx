import { useState } from 'react'
import { Button, Field, Input, Modal, Select, Textarea, useForm } from './ui'
import { useStore } from '../store/StoreContext'
import { t } from '../i18n'
import { money, today } from '../utils/format'
import { courseById } from '../utils/finance'

const STATUSES = ['active', 'frozen', 'left']

/** O'quvchi qo'shish / tahrirlash. initial — boshlang'ich qiymatlar (masalan liddan). */
export default function StudentForm({ open, onClose, student, initial, onSaved }) {
  if (!open) return null
  return <Inner onClose={onClose} student={student} initial={initial} onSaved={onSaved} />
}

function Inner({ onClose, student, initial, onSaved }) {
  const { db, add, update, notify } = useStore()
  const [v, set, setV] = useForm({
    fullName: '', phone: '+998 ', parentPhone: '', birthDate: '', groupIds: [],
    status: 'active', discount: 0, joinedAt: today(), note: '',
    ...initial,
    ...student,
  })
  const [errors, setErrors] = useState({})

  const toggleGroup = (id) =>
    setV((p) => ({ ...p, groupIds: p.groupIds.includes(id) ? p.groupIds.filter((g) => g !== id) : [...p.groupIds, id] }))

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (v.fullName.trim().length < 3) errs.fullName = t('form.required')
    if (v.phone.replace(/\D/g, '').length < 9) errs.phone = t('form.phone')
    const dup = db.students.find((s) => s.phone.replace(/\D/g, '') === v.phone.replace(/\D/g, '') && s.id !== student?.id)
    if (dup) errs.phone = t('form.phoneExists', { name: dup.fullName })
    setErrors(errs)
    if (Object.keys(errs).length) return
    const data = { ...v, fullName: v.fullName.trim(), discount: Number(v.discount) || 0 }
    let saved
    if (student) {
      update('students', student.id, data)
      saved = { ...student, ...data }
    } else {
      saved = add('students', data)
    }
    notify(t('common.saved'))
    onSaved?.(saved)
    onClose()
  }

  const groups = db.groups.filter((g) => g.status !== 'finished' || v.groupIds.includes(g.id))

  return (
    <Modal
      open
      width={640}
      title={student ? t('student.edit') : t('student.add')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button form="student-form" type="submit" icon="check">{t('common.save')}</Button>
        </>
      }
    >
      <form id="student-form" className="form-grid" onSubmit={submit}>
        <Field label={t('field.fullName')} error={errors.fullName} full>
          <Input autoFocus value={v.fullName} onChange={set('fullName')} placeholder={t('field.fullNamePh')} />
        </Field>
        <Field label={t('field.phone')} error={errors.phone}>
          <Input value={v.phone} onChange={set('phone')} />
        </Field>
        <Field label={t('field.parentPhone')}>
          <Input value={v.parentPhone} onChange={set('parentPhone')} placeholder="+998" />
        </Field>
        <Field label={t('field.birthDate')}>
          <Input type="date" value={v.birthDate} onChange={set('birthDate')} />
        </Field>
        <Field label={t('field.joinedAt')}>
          <Input type="date" value={v.joinedAt} onChange={set('joinedAt')} />
        </Field>
        <Field label={t('field.status')}>
          <Select value={v.status} onChange={set('status')} options={STATUSES.map((s) => ({ value: s, label: t('student.' + s) }))} />
        </Field>
        <Field label={t('field.discount')} hint={t('field.discountHint')}>
          <Input type="number" min="0" max="100" value={v.discount} onChange={set('discount')} />
        </Field>
        <div className="field field-full">
          <span className="field-label">{t('nav.groups')}</span>
          {groups.length === 0 ? (
            <span className="muted">{t('group.none')}</span>
          ) : (
            <div className="check-grid">
              {groups.map((g) => (
                <label key={g.id} className={`check-card ${v.groupIds.includes(g.id) ? 'checked' : ''}`}>
                  <input type="checkbox" checked={v.groupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} />
                  <span>
                    <strong>{g.name}</strong>
                    <small>{courseById(db, g.courseId)?.name} · {money(g.price)}</small>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        <Field label={t('field.note')} full>
          <Textarea value={v.note} onChange={set('note')} rows={2} />
        </Field>
      </form>
    </Modal>
  )
}
