import { Badge, Card, Empty, PageHeader, StatCard } from '../components/ui'
import Icon from '../components/Icon'
import { useStore } from '../store/StoreContext'
import { Link } from '../router'
import { t } from '../i18n'
import { currentMonth, monthLabel, money, today, wdFull, wdLabel, weekdayOf, WEEKDAYS } from '../utils/format'
import { attendanceStats, courseById, groupStudents, teacherById, teacherSalary } from '../utils/finance'
import { visibleGroups } from '../utils/permissions'

/** O'qituvchi kabineti: bugungi darslar, guruhlar, haftalik jadval, oylik maosh */
export default function TeacherHome() {
  const { db, user } = useStore()
  const teacher = teacherById(db, user.teacherId)
  const month = currentMonth()
  const groups = visibleGroups(db, user).filter((g) => g.status !== 'finished')
  const wd = weekdayOf(today())
  const todays = groups.filter((g) => g.status === 'active' && g.days.includes(wd)).sort((a, b) => a.startTime.localeCompare(b.startTime))
  const studentsN = groups.reduce((s, g) => s + groupStudents(db, g.id).length, 0)
  const markedToday = (g) => db.attendance.some((a) => a.id === `${g.id}_${today()}`)
  const stats = groups.map((g) => attendanceStats(db, { groupId: g.id }))
  const avgRate = stats.length ? Math.round(stats.reduce((s, x) => s + x.rate, 0) / stats.length) : 0

  if (!teacher) return <Empty icon="alert" title={t('teacher.notLinked')} />

  return (
    <>
      <PageHeader title={t('th.hello', { name: teacher.fullName.split(' ')[0] })} subtitle={`${wdFull(wd)} · ${teacher.subject || ''}`} />

      <div className="stats">
        <StatCard label={t('th.todayLessons')} value={todays.length} icon="clock" tone="blue"
          foot={todays.length ? t('th.marked', { n: todays.filter(markedToday).length, total: todays.length }) : t('dash.noLessons')} />
        <StatCard label={t('nav.groups')} value={groups.length} icon="groups" tone="green" foot={t('group.studentsN', { n: studentsN })} />
        <StatCard label={t('att.rate')} value={`${avgRate}%`} icon="check" tone="amber" foot={t('th.avgRate')} />
        <StatCard label={t('th.salary', { month: monthLabel(month) })} value={money(teacherSalary(db, teacher, month))} icon="wallet" tone="violet"
          foot={teacher.salaryType === 'percent' ? `${teacher.salaryValue}% ${t('teacher.ofPayments')}` : t('teacher.fixed')} />
      </div>

      <div className="grid-2">
        <Card title={t('dash.todayLessons')}>
          {todays.length === 0 ? (
            <Empty icon="clock" title={t('dash.noLessons')} />
          ) : (
            <ul className="lesson-list">
              {todays.map((g) => (
                <li key={g.id}>
                  <span className="lesson-time">{g.startTime}<small>{g.endTime}</small></span>
                  <div className="lesson-info">
                    <Link to={`/groups/${g.id}`}><strong>{g.name}</strong></Link>
                    <small>{courseById(db, g.courseId)?.name} · {g.room} · {t('group.studentsN', { n: groupStudents(db, g.id).length })}</small>
                  </div>
                  {markedToday(g)
                    ? <Link to={`/attendance/${g.id}`}><Badge tone="green">✓ {t('att.alreadySaved')}</Badge></Link>
                    : <Link className="btn btn-primary btn-sm" to={`/attendance/${g.id}`}>{t('att.take')}</Link>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t('th.week')}>
          <div className="week">
            {WEEKDAYS.map((d) => {
              const list = groups.filter((g) => g.days.includes(d)).sort((a, b) => a.startTime.localeCompare(b.startTime))
              return (
                <div key={d} className={`week-day ${d === wd ? 'today' : ''}`}>
                  <b>{wdLabel(d)}</b>
                  {list.length === 0 && <span className="muted">—</span>}
                  {list.map((g) => (
                    <Link key={g.id} to={`/groups/${g.id}`} className="week-item">
                      <span>{g.startTime}</span>{g.name}
                    </Link>
                  ))}
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card title={t('th.myGroups')} pad={false}>
        {groups.length === 0 ? <Empty icon="groups" title={t('group.none')} /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{t('field.group')}</th><th>{t('field.course')}</th><th>{t('field.days')}</th><th>{t('field.room')}</th><th>{t('nav.students')}</th><th>{t('att.rate')}</th><th /></tr></thead>
              <tbody>
                {groups.map((g, i) => (
                  <tr key={g.id}>
                    <td><Link to={`/groups/${g.id}`}><b>{g.name}</b></Link></td>
                    <td>{courseById(db, g.courseId)?.name}</td>
                    <td className="nowrap">{g.days.map(wdLabel).join(', ')} · {g.startTime}</td>
                    <td>{g.room}</td>
                    <td>{groupStudents(db, g.id).length}</td>
                    <td><div className="meter"><span style={{ width: stats[i].rate + '%' }} /></div><small className="muted">{stats[i].rate}%</small></td>
                    <td className="actions"><Link className="btn btn-ghost btn-sm" to={`/attendance/${g.id}`}><Icon name="check" size={15} />{t('nav.attendance')}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
