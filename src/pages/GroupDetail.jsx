import { useState } from 'react'
import { Avatar, Badge, Button, Card, Empty, Field, IconButton, Modal, PageHeader, Select, StatCard, confirmAction } from '../components/ui'
import PaymentModal from '../components/PaymentModal'
import { GroupForm } from './Groups'
import { useStore } from '../store/StoreContext'
import { Link, navigate } from '../router'
import { t } from '../i18n'
import { currentMonth, fmtDate, label, money, TONES, wdLabel } from '../utils/format'
import { attendanceStats, courseById, dueForGroup, groupStudents, studentPaid, teacherById } from '../utils/finance'

export default function GroupDetail({ id }) {
  const { db, update, remove, notify } = useStore()
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addId, setAddId] = useState('')
  const [payFor, setPayFor] = useState(null)
  const g = db.groups.find((x) => x.id === id)
  if (!g) return <Empty icon="alert" title={t('common.notFound')} action={<Link className="btn btn-ghost" to="/groups">{t('common.back')}</Link>} />

  const month = currentMonth()
  const students = groupStudents(db, g.id).sort((a, b) => a.fullName.localeCompare(b.fullName))
  const stats = attendanceStats(db, { groupId: g.id })
  const rows = students.map((s) => {
    const due = dueForGroup(db, s, g.id, month)
    const paid = studentPaid(db, s.id, month, g.id)
    return { s, due, paid, left: Math.max(0, due - paid), att: attendanceStats(db, { studentId: s.id, groupId: g.id }) }
  })
  const collected = rows.reduce((sum, r) => sum + r.paid, 0)
  const expected = rows.reduce((sum, r) => sum + r.due, 0)
  const candidates = db.students.filter((s) => s.status !== 'left' && !s.groupIds?.includes(g.id))

  const removeFromGroup = (s) => {
    if (!confirmAction(t('group.confirmRemove', { name: s.fullName }))) return
    update('students', s.id, { groupIds: s.groupIds.filter((x) => x !== g.id) })
    notify(t('common.saved'), 'info')
  }
  const addToGroup = () => {
    const s = db.students.find((x) => x.id === addId)
    if (!s) return
    update('students', s.id, { groupIds: [...(s.groupIds || []), g.id] })
    notify(t('common.saved'))
    setAddId('')
    setAdding(false)
  }
  const delGroup = () => {
    if (!confirmAction(t('group.confirmDelete', { name: g.name }))) return
    remove('groups', g.id)
    notify(t('common.deleted'), 'info')
    navigate('/groups')
  }

  return (
    <>
      <PageHeader
        back="/groups"
        title={<span className="title-person">{g.name} <Badge tone={TONES.group[g.status]}>{label('group', g.status)}</Badge></span>}
        subtitle={`${courseById(db, g.courseId)?.name || ''} · ${teacherById(db, g.teacherId)?.fullName || ''}`}
        actions={
          <>
            <Button variant="ghost" icon="trash" onClick={delGroup}>{t('common.delete')}</Button>
            <Button variant="ghost" icon="edit" onClick={() => setEditing(true)}>{t('common.edit')}</Button>
            <Link className="btn btn-primary" to={`/attendance/${g.id}`}>{t('att.take')}</Link>
          </>
        }
      />

      <div className="stats">
        <StatCard label={t('nav.students')} value={students.length} icon="students" tone="green" foot={`${g.days.map(wdLabel).join(', ')} · ${g.startTime}–${g.endTime}`} />
        <StatCard label={t('group.collected')} value={money(collected)} icon="wallet" tone="blue" foot={`${t('pay.due')}: ${money(expected)}`} />
        <StatCard label={t('pay.left')} value={money(expected - collected)} icon="alert" tone="red" />
        <StatCard label={t('att.rate')} value={`${stats.rate}%`} icon="check" tone="amber" foot={`${g.room} · ${t('field.startDate')}: ${fmtDate(g.startDate)}`} />
      </div>

      <Card
        title={t('group.studentsList')}
        pad={false}
        actions={<Button size="sm" icon="plus" onClick={() => setAdding(true)}>{t('group.addStudent')}</Button>}
      >
        {rows.length === 0 ? (
          <Empty icon="students" title={t('group.noStudents')} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>{t('field.fullName')}</th><th>{t('field.phone')}</th><th>{t('att.rate')}</th>
                  <th className="num">{t('pay.due')}</th><th className="num">{t('pay.paid')}</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ s, due, paid, left, att }, i) => (
                  <tr key={s.id}>
                    <td className="muted">{i + 1}</td>
                    <td><Link to={`/students/${s.id}`} className="person"><Avatar name={s.fullName} size={30} /><span>{s.fullName}</span></Link></td>
                    <td className="nowrap">{s.phone}</td>
                    <td>
                      <div className="meter"><span style={{ width: att.rate + '%' }} /></div>
                      <small className="muted">{att.rate}%</small>
                    </td>
                    <td className="num">{money(due)}</td>
                    <td className="num">{left ? <b className="text-red">{money(paid)}</b> : <span className="text-green">{money(paid)} ✓</span>}</td>
                    <td className="actions">
                      <IconButton icon="wallet" tone="green" title={t('pay.accept')} onClick={() => setPayFor(s.id)} />
                      <IconButton icon="x" tone="red" title={t('group.remove')} onClick={() => removeFromGroup(s)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={adding}
        title={t('group.addStudent')}
        onClose={() => setAdding(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>{t('common.cancel')}</Button>
            <Button onClick={addToGroup} disabled={!addId}>{t('common.add')}</Button>
          </>
        }
      >
        <Field label={t('field.student')} hint={t('group.addHint')}>
          <Select value={addId} onChange={(e) => setAddId(e.target.value)} placeholder={t('common.choose')}
            options={candidates.map((s) => ({ value: s.id, label: `${s.fullName} · ${s.phone}` }))} />
        </Field>
      </Modal>

      <GroupForm open={editing} group={g} onClose={() => setEditing(false)} />
      <PaymentModal open={!!payFor} studentId={payFor} groupId={g.id} onClose={() => setPayFor(null)} />
    </>
  )
}
