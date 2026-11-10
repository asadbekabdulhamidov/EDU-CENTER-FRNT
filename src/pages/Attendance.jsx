import { useEffect, useMemo, useState } from 'react'
import { Avatar, Button, Card, Empty, Field, Input, PageHeader, Select } from '../components/ui'
import { useStore } from '../store/StoreContext'
import { Link, navigate } from '../router'
import { t } from '../i18n'
import { ATT_SHORT, fmtDate, label, today, wdFull, wdLabel, weekdayOf } from '../utils/format'
import { groupStudents } from '../utils/finance'

const STATES = ['present', 'late', 'absent']

export default function Attendance({ groupId }) {
  const { db, saveAttendance, notify } = useStore()
  const activeGroups = db.groups.filter((g) => g.status !== 'finished')
  const todayWd = weekdayOf(today())
  const defaultGroup = groupId || activeGroups.find((g) => g.days.includes(todayWd))?.id || activeGroups[0]?.id || ''
  const [gid, setGid] = useState(defaultGroup)
  const [date, setDate] = useState(today())
  const group = db.groups.find((g) => g.id === gid)
  const students = useMemo(() => (group ? groupStudents(db, group.id).sort((a, b) => a.fullName.localeCompare(b.fullName)) : []), [db, group])
  const existing = db.attendance.find((a) => a.id === `${gid}_${date}`)
  const [records, setRecords] = useState({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (groupId && groupId !== gid) setGid(groupId)
  }, [groupId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Guruh yoki sana o'zgarsa — saqlangan davomatni yuklaymiz
  useEffect(() => {
    setRecords(existing?.records ? { ...existing.records } : {})
    setDirty(false)
  }, [gid, date, existing?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const setOne = (sid, st) => {
    setRecords((r) => ({ ...r, [sid]: st }))
    setDirty(true)
  }
  const markAll = (st) => {
    setRecords(Object.fromEntries(students.map((s) => [s.id, st])))
    setDirty(true)
  }
  const save = () => {
    const missing = students.filter((s) => !records[s.id])
    if (missing.length) {
      notify(t('att.missing', { n: missing.length }), 'error')
      return
    }
    saveAttendance(gid, date, records)
    setDirty(false)
    notify(t('att.saved'))
  }

  const notLessonDay = group && !group.days.includes(weekdayOf(date))
  const history = useMemo(
    () => db.attendance.filter((a) => a.groupId === gid).sort((a, b) => a.date.localeCompare(b.date)).slice(-10),
    [db.attendance, gid],
  )
  const summary = STATES.map((st) => ({ st, n: students.filter((s) => records[s.id] === st).length }))

  if (!activeGroups.length) return <><PageHeader title={t('nav.attendance')} /><Empty icon="groups" title={t('group.none')} /></>

  return (
    <>
      <PageHeader title={t('nav.attendance')} subtitle={t('att.subtitle')} />

      <Card>
        <div className="form-grid form-grid-3">
          <Field label={t('field.group')}>
            <Select value={gid} onChange={(e) => { setGid(e.target.value); navigate('/attendance/' + e.target.value) }}
              options={activeGroups.map((g) => ({ value: g.id, label: `${g.name} · ${g.days.map(wdLabel).join(', ')} ${g.startTime}` }))} />
          </Field>
          <Field label={t('field.date')} hint={`${wdFull(weekdayOf(date))}${notLessonDay ? ' · ' + t('att.notLessonDay') : ''}`}>
            <Input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value || today())} />
          </Field>
          <div className="att-summary">
            {summary.map(({ st, n }) => (
              <span key={st} className={`att-pill att-${st}`}>{label('att', st)}: <b>{n}</b></span>
            ))}
          </div>
        </div>
      </Card>

      <Card
        title={group ? `${group.name} · ${fmtDate(date)}` : ''}
        actions={
          <div className="row-actions">
            {existing && !dirty && <span className="badge badge-green">{t('att.alreadySaved')}</span>}
            <Button size="sm" variant="ghost" onClick={() => markAll('present')}>{t('att.allPresent')}</Button>
          </div>
        }
        pad={false}
      >
        {students.length === 0 ? (
          <Empty icon="students" title={t('group.noStudents')} action={group && <Link className="btn btn-ghost" to={`/groups/${group.id}`}>{t('group.addStudent')}</Link>} />
        ) : (
          <ul className="att-list">
            {students.map((s, i) => (
              <li key={s.id}>
                <span className="muted idx">{i + 1}</span>
                <Avatar name={s.fullName} size={32} />
                <Link to={`/students/${s.id}`} className="att-name">{s.fullName}</Link>
                <div className="seg">
                  {STATES.map((st) => (
                    <button key={st} className={`seg-${st} ${records[s.id] === st ? 'on' : ''}`} onClick={() => setOne(s.id, st)}>
                      {label('att', st)}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
        {students.length > 0 && (
          <div className="card-foot">
            <Button icon="check" onClick={save} disabled={!dirty && !!existing}>{t('common.save')}</Button>
          </div>
        )}
      </Card>

      {history.length > 0 && students.length > 0 && (
        <Card title={t('att.history')} pad={false}>
          <div className="table-wrap">
            <table className="table att-matrix">
              <thead>
                <tr>
                  <th>{t('field.student')}</th>
                  {history.map((a) => (
                    <th key={a.id} className={`center ${a.date === date ? 'hl' : ''}`}>
                      <button className="link-btn" onClick={() => setDate(a.date)}>{a.date.slice(8)}.{a.date.slice(5, 7)}</button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="nowrap">{s.fullName}</td>
                    {history.map((a) => {
                      const st = a.records?.[s.id]
                      return <td key={a.id} className={`center ${a.date === date ? 'hl' : ''}`}>{st ? <span className={`att-dot att-${st}`}>{ATT_SHORT[st]}</span> : <span className="muted">·</span>}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
