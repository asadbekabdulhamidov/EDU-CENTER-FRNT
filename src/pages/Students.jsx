import { useMemo, useState } from 'react'
import { Avatar, Badge, Button, Card, Empty, IconButton, PageHeader, SearchInput, Select, Tabs, confirmAction } from '../components/ui'
import StudentForm from '../components/StudentForm'
import PaymentModal from '../components/PaymentModal'
import { useStore } from '../store/StoreContext'
import { can } from '../utils/permissions'
import { Link } from '../router'
import { t } from '../i18n'
import { currentMonth, label, money, TONES } from '../utils/format'
import { groupById, studentDebt } from '../utils/finance'

export default function Students() {
  const { db, user, remove, notify } = useStore()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('active')
  const [groupId, setGroupId] = useState('')
  const [debtOnly, setDebtOnly] = useState(false)
  const [edit, setEdit] = useState(null) // null | {} | student
  const [payFor, setPayFor] = useState(null)
  const month = currentMonth()

  const counts = useMemo(() => {
    const c = { all: db.students.length, active: 0, frozen: 0, left: 0 }
    db.students.forEach((s) => c[s.status]++)
    return c
  }, [db.students])

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return db.students
      .filter((s) => status === 'all' || s.status === status)
      .filter((s) => !groupId || s.groupIds?.includes(groupId))
      .filter((s) => !query || s.fullName.toLowerCase().includes(query) || s.phone.replace(/\s/g, '').includes(query.replace(/\s/g, '')))
      .map((s) => ({ s, debt: studentDebt(db, s, month) }))
      .filter((r) => !debtOnly || r.debt > 0)
      .sort((a, b) => a.s.fullName.localeCompare(b.s.fullName))
  }, [db, q, status, groupId, debtOnly, month])

  const del = (s) => {
    if (!confirmAction(t('student.confirmDelete', { name: s.fullName }))) return
    remove('students', s.id)
    notify(t('common.deleted'), 'info')
  }

  return (
    <>
      <PageHeader
        title={t('nav.students')}
        subtitle={t('student.subtitle', { n: counts.active })}
        actions={can(user, 'students.edit') && <Button icon="plus" onClick={() => setEdit({})}>{t('student.add')}</Button>}
      />

      <Tabs
        value={status}
        onChange={setStatus}
        items={[
          { value: 'active', label: t('student.active'), count: counts.active },
          { value: 'frozen', label: t('student.frozen'), count: counts.frozen },
          { value: 'left', label: t('student.left'), count: counts.left },
          { value: 'all', label: t('common.all'), count: counts.all },
        ]}
      />

      <Card pad={false}>
        <div className="toolbar">
          <SearchInput value={q} onChange={setQ} placeholder={t('student.searchPh')} />
          <Select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder={t('group.all')}
            options={db.groups.map((g) => ({ value: g.id, label: g.name }))}
          />
          <label className="switch">
            <input type="checkbox" checked={debtOnly} onChange={(e) => setDebtOnly(e.target.checked)} />
            <span>{t('student.debtOnly')}</span>
          </label>
        </div>

        {rows.length === 0 ? (
          <Empty icon="students" text={t('common.tryFilter')} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('field.fullName')}</th>
                  <th>{t('field.phone')}</th>
                  <th>{t('nav.groups')}</th>
                  <th>{t('field.status')}</th>
                  <th className="num">{t('student.debtMonth')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ s, debt }, i) => (
                  <tr key={s.id}>
                    <td className="muted">{i + 1}</td>
                    <td>
                      <Link to={`/students/${s.id}`} className="person">
                        <Avatar name={s.fullName} size={30} />
                        <span>{s.fullName}{s.discount > 0 && <small className="text-violet"> −{s.discount}%</small>}</span>
                      </Link>
                    </td>
                    <td className="nowrap">{s.phone}</td>
                    <td>
                      <div className="chips">
                        {(s.groupIds || []).map((gid) => {
                          const g = groupById(db, gid)
                          return g ? <Link key={gid} to={`/groups/${gid}`}><Badge tone="blue">{g.name}</Badge></Link> : null
                        })}
                        {!s.groupIds?.length && <span className="muted">—</span>}
                      </div>
                    </td>
                    <td><Badge tone={TONES.student[s.status]}>{label('student', s.status)}</Badge></td>
                    <td className="num nowrap">
                      {debt > 0 ? <b className="text-red">{money(debt)}</b> : <span className="text-green">{t('pay.ok')}</span>}
                    </td>
                    <td className="actions">
                      {can(user, 'payments.add') && <IconButton icon="wallet" title={t('pay.accept')} tone="green" onClick={() => setPayFor(s.id)} />}
                      {can(user, 'students.edit') && <IconButton icon="edit" title={t('common.edit')} onClick={() => setEdit(s)} />}
                      {can(user, 'students.delete') && <IconButton icon="trash" title={t('common.delete')} tone="red" onClick={() => del(s)} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <StudentForm open={!!edit} student={edit?.id ? edit : null} onClose={() => setEdit(null)} />
      <PaymentModal open={!!payFor} studentId={payFor} onClose={() => setPayFor(null)} />
    </>
  )
}
