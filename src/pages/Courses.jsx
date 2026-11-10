import { useState } from 'react'
import { Button, Empty, Field, IconButton, Input, Modal, PageHeader, Textarea, confirmAction, useForm } from '../components/ui'
import Icon from '../components/Icon'
import { useStore } from '../store/StoreContext'
import { can } from '../utils/permissions'
import { t } from '../i18n'
import { money } from '../utils/format'
import { groupStudents } from '../utils/finance'

export default function Courses() {
  const { db, user, remove, notify } = useStore()
  const canEdit = can(user, 'courses.edit')
  const [edit, setEdit] = useState(null)

  const del = (c) => {
    if (db.groups.some((g) => g.courseId === c.id)) {
      notify(t('course.hasGroups'), 'error')
      return
    }
    if (!confirmAction(t('common.confirmDelete', { name: c.name }))) return
    remove('courses', c.id)
    notify(t('common.deleted'), 'info')
  }

  return (
    <>
      <PageHeader
        title={t('nav.courses')}
        subtitle={t('course.subtitle')}
        actions={canEdit && <Button icon="plus" onClick={() => setEdit({})}>{t('course.add')}</Button>}
      />
      {db.courses.length === 0 ? (
        <Empty icon="book" />
      ) : (
        <div className="cards-grid">
          {db.courses.map((c) => {
            const groups = db.groups.filter((g) => g.courseId === c.id && g.status !== 'finished')
            const students = groups.reduce((s, g) => s + groupStudents(db, g.id).length, 0)
            return (
              <div key={c.id} className="group-card course-card">
                <div className="group-card-head">
                  <span className="course-icon"><Icon name="book" size={20} /></span>
                  {canEdit && <div className="row-actions">
                    <IconButton icon="edit" title={t('common.edit')} onClick={() => setEdit(c)} />
                    <IconButton icon="trash" tone="red" title={t('common.delete')} onClick={() => del(c)} />
                  </div>}
                </div>
                <h3>{c.name}</h3>
                <p className="muted">{c.description || '—'}</p>
                <div className="group-meta">
                  <span><Icon name="clock" size={15} />{t('course.months', { n: c.durationMonths })}</span>
                  <span><Icon name="groups" size={15} />{t('course.groupsN', { n: groups.length })} · {t('group.studentsN', { n: students })}</span>
                </div>
                <div className="group-card-foot"><span>{t('field.monthlyPrice')}</span><b>{money(c.price)}</b></div>
              </div>
            )
          })}
        </div>
      )}
      <CourseForm open={!!edit} course={edit?.id ? edit : null} onClose={() => setEdit(null)} />
    </>
  )
}

function CourseForm({ open, onClose, course }) {
  if (!open) return null
  return <Inner onClose={onClose} course={course} />
}

function Inner({ onClose, course }) {
  const { add, update, notify } = useStore()
  const [v, set] = useForm({ name: '', price: '', durationMonths: 6, description: '', ...course })
  const [errors, setErrors] = useState({})
  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!v.name.trim()) errs.name = t('form.required')
    if (!(Number(v.price) > 0)) errs.price = t('form.positive')
    setErrors(errs)
    if (Object.keys(errs).length) return
    const data = { ...v, price: Number(v.price), durationMonths: Number(v.durationMonths) || 1 }
    if (course) update('courses', course.id, data)
    else add('courses', data)
    notify(t('common.saved'))
    onClose()
  }
  return (
    <Modal open title={course ? t('course.edit') : t('course.add')} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button><Button form="course-form" type="submit" icon="check">{t('common.save')}</Button></>}>
      <form id="course-form" className="form-grid" onSubmit={submit}>
        <Field label={t('field.courseName')} error={errors.name} full><Input autoFocus value={v.name} onChange={set('name')} /></Field>
        <Field label={t('field.monthlyPrice')} error={errors.price}><Input type="number" min="0" step="10000" value={v.price} onChange={set('price')} /></Field>
        <Field label={t('field.duration')}><Input type="number" min="1" value={v.durationMonths} onChange={set('durationMonths')} /></Field>
        <Field label={t('field.description')} full><Textarea value={v.description} onChange={set('description')} /></Field>
      </form>
    </Modal>
  )
}
