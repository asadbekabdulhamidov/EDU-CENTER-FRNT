import { useState } from 'react'
import { Avatar, Badge, Button, Card, Empty, IconButton, PageHeader, StatCard, confirmAction } from '../components/ui'
import StudentForm from '../components/StudentForm'
import PaymentModal from '../components/PaymentModal'
import { useStore } from '../store/StoreContext'
import { can } from '../utils/permissions'
import { Link } from '../router'
import { t } from '../i18n'
import { addMonths, currentMonth, fmtDate, label, monthLabel, money, TONES, ATT_SHORT, wdLabel } from '../utils/format'
import { attendanceStats, courseById, groupById, studentDue, studentPaid, teacherById } from '../utils/finance'

export default function StudentDetail({ id }) {
  const { db, user, remove, notify } = useStore()
  const [editing, setEditing] = useState(false)
  const [paying, setPaying] = useState(false)
  const s = db.students.find((x) => x.id === id)
  if (!s) return <Empty icon="alert" title={t('common.notFound')} action={<Link className="btn btn-ghost" to="/students">{t('common.back')}</Link>} />

  const month = currentMonth()
  const months = Array.from({ length: 6 }, (_, i) => addMonths(month, -i)).filter((m) => !s.joinedAt || m >= s.joinedAt.slice(0, 7))
  const stats = attendanceStats(db, { studentId: s.id })
  const payments = db.payments.filter((p) => p.studentId === s.id).sort((a, b) => b.date.localeCompare(a.date))
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const debtNow = Math.max(0, studentDue(db, s, month) - studentPaid(db, s.id, month))
  const recentAtt = db.attendance
    .filter((a) => a.records?.[s.id])
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14)

  const delPayment = (p) => {
    if (!confirmAction(t('pay.confirmDelete'))) return
    remove('payments', p.id)
    notify(t('common.deleted'), 'info')
  }

  return (
    <>
      <PageHeader
        back="/students"
        title={
          <span className="title-person">
            <Avatar name={s.fullName} size={44} />
            <span>{s.fullName}</span>
            <Badge tone={TONES.student[s.status]}>{label('student', s.status)}</Badge>
          </span>
        }
        actions={
          <>
            {can(user, 'students.edit') && <Button variant="ghost" icon="edit" onClick={() => setEditing(true)}>{t('common.edit')}</Button>}
            {can(user, 'payments.add') && <Button icon="wallet" onClick={() => setPaying(true)}>{t('pay.accept')}</Button>}
          </>
        }
      />

      <div className="stats">
        <StatCard label={t('student.debtMonth')} value={money(debtNow)} icon="alert" tone={debtNow ? 'red' : 'green'} />
        <StatCard label={t('student.totalPaid')} value={money(totalPaid)} icon="wallet" tone="blue" />
        <StatCard label={t('att.rate')} value={`${stats.rate}%`} icon="check" tone="green"
          foot={`${t('att.present')}: ${stats.present} · ${t('att.late')}: ${stats.late} · ${t('att.absent')}: ${stats.absent}`} />
        <StatCard label={t('field.joinedAt')} value={fmtDate(s.joinedAt)} icon="clock" tone="amber" />
      </div>

      <div className="grid-2">
        <Card title={t('student.info')}>
          <dl className="info-list">
            <dt>{t('field.phone')}</dt><dd><a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a></dd>
            <dt>{t('field.parentPhone')}</dt><dd>{s.parentPhone || '—'}</dd>
            <dt>{t('field.birthDate')}</dt><dd>{fmtDate(s.birthDate)}</dd>
            <dt>{t('field.discount')}</dt><dd>{s.discount ? `${s.discount}%` : '—'}</dd>
            <dt>{t('field.note')}</dt><dd>{s.note || '—'}</dd>
          </dl>
        </Card>
        <Card title={t('nav.groups')}>
          {!s.groupIds?.length ? (
            <Empty icon="groups" title={t('student.noGroups')} />
          ) : (
            <ul className="people-list">
              {s.groupIds.map((gid) => {
                const g = groupById(db, gid)
                if (!g) return null
                return (
                  <li key={gid}>
                    <span className="group-dot" />
                    <div>
                      <Link to={`/groups/${g.id}`}><strong>{g.name}</strong></Link>
                      <small>{courseById(db, g.courseId)?.name} · {teacherById(db, g.teacherId)?.fullName}</small>
                    </div>
                    <div className="right">
                      <b>{money(g.price)}</b>
                      <small>{g.days.map(wdLabel).join(', ')} · {g.startTime}</small>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid-2">
        <Card title={t('student.monthly')} pad={false}>
          <table className="table">
            <thead>
              <tr><th>{t('field.month')}</th><th className="num">{t('pay.due')}</th><th className="num">{t('pay.paid')}</th><th className="num">{t('pay.left')}</th></tr>
            </thead>
            <tbody>
              {months.map((m) => {
                const due = studentDue(db, s, m)
                const paid = studentPaid(db, s.id, m)
                const left = Math.max(0, due - paid)
                return (
                  <tr key={m}>
                    <td>{monthLabel(m)}</td>
                    <td className="num">{money(due)}</td>
                    <td className="num text-green">{money(paid)}</td>
                    <td className="num">{left ? <b className="text-red">{money(left)}</b> : <span className="text-green">✓</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <Card title={t('att.recent')}>
          {recentAtt.length === 0 ? (
            <Empty icon="check" />
          ) : (
            <div className="att-strip">
              {recentAtt.map((a) => {
                const st = a.records[s.id]
                return (
                  <div key={a.id} className={`att-cell att-${st}`} title={`${fmtDate(a.date)} · ${groupById(db, a.groupId)?.name || ''} · ${label('att', st)}`}>
                    <b>{ATT_SHORT[st]}</b>
                    <small>{a.date.slice(8)}.{a.date.slice(5, 7)}</small>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <Card title={t('student.paymentHistory')} pad={false}>
        {payments.length === 0 ? (
          <Empty icon="wallet" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>{t('field.date')}</th><th>{t('field.forMonth')}</th><th>{t('field.group')}</th><th>{t('field.method')}</th><th>{t('pay.receivedBy')}</th><th className="num">{t('field.amount')}</th><th /></tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{fmtDate(p.date)}</td>
                    <td>{monthLabel(p.month)}</td>
                    <td>{groupById(db, p.groupId)?.name || '—'}</td>
                    <td><Badge>{t('method.' + p.method)}</Badge></td>
                    <td className="muted">{db.users.find((u) => u.id === p.createdBy)?.fullName || '—'}</td>
                    <td className="num"><b>{money(p.amount)}</b></td>
                    <td className="actions">{can(user, 'payments.delete') && <IconButton icon="trash" tone="red" title={t('common.delete')} onClick={() => delPayment(p)} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <StudentForm open={editing} student={s} onClose={() => setEditing(false)} />
      <PaymentModal open={paying} studentId={s.id} onClose={() => setPaying(false)} />
    </>
  )
}
