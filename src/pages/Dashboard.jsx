import { useState } from 'react'
import { Avatar, Badge, Button, Card, Empty, PageHeader, StatCard } from '../components/ui'
import PaymentModal from '../components/PaymentModal'
import { useStore } from '../store/StoreContext'
import { Link } from '../router'
import { t } from '../i18n'
import {
  addMonths, currentMonth, fmtDate, monthLabel, monthShort, money, shortMoney, today, weekdayOf,
} from '../utils/format'
import { courseById, debtors, expenseByDate, groupStudents, incomeByDate, studentById, teacherById } from '../utils/finance'

export default function Dashboard() {
  const { db } = useStore()
  const [payFor, setPayFor] = useState(null)
  const month = currentMonth()
  const wd = weekdayOf(today())

  const activeStudents = db.students.filter((s) => s.status === 'active').length
  const activeGroups = db.groups.filter((g) => g.status === 'active').length
  const income = incomeByDate(db, month)
  const prevIncome = incomeByDate(db, addMonths(month, -1))
  const expense = expenseByDate(db, month)
  const debtList = debtors(db, month)
  const totalDebt = debtList.reduce((s, d) => s + d.debt, 0)
  const newLeads = db.leads.filter((l) => l.status === 'new').length
  const growth = prevIncome ? Math.round(((income - prevIncome) / prevIncome) * 100) : 0

  const todayGroups = db.groups
    .filter((g) => g.status === 'active' && g.days.includes(wd))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const chart = Array.from({ length: 6 }, (_, i) => {
    const m = addMonths(month, i - 5)
    return { m, income: incomeByDate(db, m), expense: expenseByDate(db, m) }
  })
  const max = Math.max(1, ...chart.flatMap((c) => [c.income, c.expense]))

  const recent = [...db.payments].sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || ''))).slice(0, 6)

  return (
    <>
      <PageHeader
        title={t('dash.title')}
        subtitle={t('dash.subtitle', { month: monthLabel(month) })}
        actions={<Button icon="plus" onClick={() => setPayFor({})}>{t('pay.add')}</Button>}
      />

      <div className="stats">
        <StatCard label={t('dash.activeStudents')} value={activeStudents} icon="students" tone="green"
          foot={t('dash.groupsCount', { n: activeGroups })} />
        <StatCard label={t('dash.income')} value={shortMoney(income)} icon="trend" tone="blue"
          foot={prevIncome ? <span className={growth >= 0 ? 'text-green' : 'text-red'}>{growth >= 0 ? '+' : ''}{growth}% {t('dash.vsPrev')}</span> : '—'} />
        <StatCard label={t('dash.debt')} value={shortMoney(totalDebt)} icon="alert" tone="red"
          foot={t('dash.debtorsCount', { n: debtList.length })} />
        <StatCard label={t('dash.profit')} value={shortMoney(income - expense)} icon="wallet" tone="amber"
          foot={`${t('nav.expenses')}: ${shortMoney(expense)}`} />
      </div>

      <div className="grid-2">
        <Card title={t('dash.chartTitle')} actions={
          <div className="legend"><span className="dot dot-blue" />{t('dash.incomeShort')}<span className="dot dot-amber" />{t('nav.expenses')}</div>
        }>
          <div className="bars">
            {chart.map((c) => (
              <div className="bar-col" key={c.m} title={`${monthLabel(c.m)}\n${money(c.income)}\n${money(c.expense)}`}>
                <div className="bar-pair">
                  <div className="bar bar-blue" style={{ height: `${(c.income / max) * 100}%` }} />
                  <div className="bar bar-amber" style={{ height: `${(c.expense / max) * 100}%` }} />
                </div>
                <span className="bar-label">{monthShort(Number(c.m.slice(5)) - 1)}</span>
                <span className="bar-value">{shortMoney(c.income)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('dash.todayLessons')} actions={<Badge tone="blue">{todayGroups.length}</Badge>}>
          {todayGroups.length === 0 ? (
            <Empty icon="clock" title={t('dash.noLessons')} />
          ) : (
            <ul className="lesson-list">
              {todayGroups.map((g) => (
                <li key={g.id}>
                  <span className="lesson-time">{g.startTime}<small>{g.endTime}</small></span>
                  <div className="lesson-info">
                    <Link to={`/groups/${g.id}`}><strong>{g.name}</strong></Link>
                    <small>{courseById(db, g.courseId)?.name} · {teacherById(db, g.teacherId)?.fullName} · {g.room}</small>
                  </div>
                  <Link className="btn btn-ghost btn-sm" to={`/attendance/${g.id}`}>
                    {t('nav.attendance')} ({groupStudents(db, g.id).length})
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid-2">
        <Card title={t('dash.topDebtors')} actions={<Link to="/payments" className="link">{t('common.all')}</Link>}>
          {debtList.length === 0 ? (
            <Empty icon="check" title={t('dash.noDebtors')} />
          ) : (
            <ul className="people-list">
              {debtList.slice(0, 6).map(({ student, debt, due }) => (
                <li key={student.id}>
                  <Avatar name={student.fullName} />
                  <div>
                    <Link to={`/students/${student.id}`}><strong>{student.fullName}</strong></Link>
                    <small>{student.phone}</small>
                  </div>
                  <div className="right">
                    <b className="text-red">{money(debt)}</b>
                    <small>{t('pay.due')}: {shortMoney(due)}</small>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setPayFor({ studentId: student.id })}>{t('pay.accept')}</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t('dash.recentPayments')} actions={newLeads > 0 && <Link to="/leads"><Badge tone="violet">{t('dash.newLeads', { n: newLeads })}</Badge></Link>}>
          {recent.length === 0 ? (
            <Empty icon="wallet" />
          ) : (
            <ul className="people-list">
              {recent.map((p) => {
                const s = studentById(db, p.studentId)
                return (
                  <li key={p.id}>
                    <Avatar name={s?.fullName} />
                    <div>
                      <strong>{s?.fullName || '—'}</strong>
                      <small>{fmtDate(p.date)} · {t('method.' + p.method)}</small>
                    </div>
                    <b className="right text-green">+{money(p.amount)}</b>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <PaymentModal open={!!payFor} onClose={() => setPayFor(null)} studentId={payFor?.studentId} />
    </>
  )
}
