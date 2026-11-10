import { useMemo, useState } from 'react'
import { Badge, Button, Empty, Field, Input, Modal, PageHeader, SearchInput, Select, Tabs, useForm } from '../components/ui'
import Icon from '../components/Icon'
import { useStore } from '../store/StoreContext'
import { can, visibleGroups } from '../utils/permissions'
import { Link } from '../router'
import { t } from '../i18n'
import { label, money, today, TONES, WEEKDAYS, wdLabel } from '../utils/format'
import { courseById, groupStudents, teacherById } from '../utils/finance'

export default function Groups() {
  const { db, user } = useStore()
  const mine = visibleGroups(db, user)
  const canEdit = can(user, 'groups.edit')
  const [status, setStatus] = useState('active')
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return mine
      .filter((g) => status === 'all' || g.status === status)
      .filter((g) => !query || g.name.toLowerCase().includes(query) || courseById(db, g.courseId)?.name.toLowerCase().includes(query))
  }, [db, mine, status, q])

  const count = (st) => mine.filter((g) => g.status === st).length

  return (
    <>
      <PageHeader
        title={t('nav.groups')}
        subtitle={t('group.subtitle', { n: count('active') })}
        actions={canEdit && <Button icon="plus" onClick={() => setEdit({})}>{t('group.add')}</Button>}
      />
      <div className="toolbar toolbar-plain">
        <Tabs
          value={status}
          onChange={setStatus}
          items={[
            { value: 'active', label: t('group.active'), count: count('active') },
            { value: 'forming', label: t('group.forming'), count: count('forming') },
            { value: 'finished', label: t('group.finished'), count: count('finished') },
            { value: 'all', label: t('common.all'), count: mine.length },
          ]}
        />
        <SearchInput value={q} onChange={setQ} />
      </div>

      {list.length === 0 ? (
        <Empty icon="groups" action={canEdit && <Button icon="plus" onClick={() => setEdit({})}>{t('group.add')}</Button>} />
      ) : (
        <div className="cards-grid">
          {list.map((g) => {
            const n = groupStudents(db, g.id).length
            return (
              <Link key={g.id} to={`/groups/${g.id}`} className="group-card">
                <div className="group-card-head">
                  <div>
                    <h3>{g.name}</h3>
                    <small>{courseById(db, g.courseId)?.name || '—'}</small>
                  </div>
                  <Badge tone={TONES.group[g.status]}>{label('group', g.status)}</Badge>
                </div>
                <div className="group-meta">
                  <span><Icon name="teacher" size={15} />{teacherById(db, g.teacherId)?.fullName || '—'}</span>
                  <span><Icon name="clock" size={15} />{g.days.map(wdLabel).join(', ')} · {g.startTime}–{g.endTime}</span>
                  <span><Icon name="door" size={15} />{g.room || '—'}</span>
                </div>
                <div className="group-card-foot">
                  <span><Icon name="students" size={15} /> {t('group.studentsN', { n })}</span>
                  {can(user, 'money.view') && <b>{money(g.price)}</b>}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <GroupForm open={!!edit} group={edit?.id ? edit : null} onClose={() => setEdit(null)} />
    </>
  )
}

export function GroupForm({ open, onClose, group }) {
  if (!open) return null
  return <GroupFormInner onClose={onClose} group={group} />
}

function GroupFormInner({ onClose, group }) {
  const { db, add, update, notify } = useStore()
  const [v, set, setV] = useForm({
    name: '', courseId: '', teacherId: '', days: ['Du', 'Chor', 'Ju'], startTime: '14:00', endTime: '15:30',
    room: '', price: '', startDate: today(), status: 'active',
    ...group,
  })
  const [errors, setErrors] = useState({})

  const onCourse = (e) => {
    const c = courseById(db, e.target.value)
    setV((p) => ({ ...p, courseId: e.target.value, price: p.price || (c ? String(c.price) : '') }))
  }
  const toggleDay = (d) => setV((p) => ({ ...p, days: p.days.includes(d) ? p.days.filter((x) => x !== d) : WEEKDAYS.filter((x) => x === d || p.days.includes(x)) }))

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!v.name.trim()) errs.name = t('form.required')
    if (!v.courseId) errs.courseId = t('form.required')
    if (!v.teacherId) errs.teacherId = t('form.required')
    if (!v.days.length) errs.days = t('form.required')
    if (!(Number(v.price) > 0)) errs.price = t('form.positive')
    if (v.endTime <= v.startTime) errs.endTime = t('form.timeOrder')
    // Xona to'qnashuvi: bir xil xona, kesishgan kun va vaqt
    const clash = v.room && db.groups.find((g) =>
      g.id !== group?.id && g.status !== 'finished' && g.room.trim().toLowerCase() === v.room.trim().toLowerCase() &&
      g.days.some((d) => v.days.includes(d)) && g.startTime < v.endTime && v.startTime < g.endTime)
    if (clash) errs.room = t('form.roomBusy', { name: clash.name })
    setErrors(errs)
    if (Object.keys(errs).length) return
    const data = { ...v, name: v.name.trim(), price: Number(v.price) }
    if (group) update('groups', group.id, data)
    else add('groups', data)
    notify(t('common.saved'))
    onClose()
  }

  return (
    <Modal
      open
      width={620}
      title={group ? t('group.edit') : t('group.add')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button form="group-form" type="submit" icon="check">{t('common.save')}</Button>
        </>
      }
    >
      <form id="group-form" className="form-grid" onSubmit={submit}>
        <Field label={t('field.groupName')} error={errors.name}>
          <Input autoFocus value={v.name} onChange={set('name')} placeholder="FE-14" />
        </Field>
        <Field label={t('field.status')}>
          <Select value={v.status} onChange={set('status')} options={['active', 'forming', 'finished'].map((s) => ({ value: s, label: t('group.' + s) }))} />
        </Field>
        <Field label={t('field.course')} error={errors.courseId}>
          <Select value={v.courseId} onChange={onCourse} placeholder={t('common.choose')} options={db.courses.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label={t('field.teacher')} error={errors.teacherId}>
          <Select value={v.teacherId} onChange={set('teacherId')} placeholder={t('common.choose')} options={db.teachers.map((c) => ({ value: c.id, label: c.fullName }))} />
        </Field>
        <div className="field field-full">
          <span className="field-label">{t('field.days')}</span>
          <div className="day-picker">
            {WEEKDAYS.map((d) => (
              <button type="button" key={d} className={v.days.includes(d) ? 'active' : ''} onClick={() => toggleDay(d)}>{wdLabel(d)}</button>
            ))}
            <button type="button" className="ghost" onClick={() => setV((p) => ({ ...p, days: ['Du', 'Chor', 'Ju'] }))}>{t('group.odd')}</button>
            <button type="button" className="ghost" onClick={() => setV((p) => ({ ...p, days: ['Se', 'Pay', 'Sha'] }))}>{t('group.even')}</button>
          </div>
          {errors.days && <span className="field-error">{errors.days}</span>}
        </div>
        <Field label={t('field.startTime')}>
          <Input type="time" value={v.startTime} onChange={set('startTime')} />
        </Field>
        <Field label={t('field.endTime')} error={errors.endTime}>
          <Input type="time" value={v.endTime} onChange={set('endTime')} />
        </Field>
        <Field label={t('field.room')} error={errors.room}>
          <Input value={v.room} onChange={set('room')} placeholder="101-xona" />
        </Field>
        <Field label={t('field.monthlyPrice')} error={errors.price}>
          <Input type="number" min="0" step="10000" value={v.price} onChange={set('price')} />
        </Field>
        <Field label={t('field.startDate')}>
          <Input type="date" value={v.startDate} onChange={set('startDate')} />
        </Field>
      </form>
    </Modal>
  )
}
