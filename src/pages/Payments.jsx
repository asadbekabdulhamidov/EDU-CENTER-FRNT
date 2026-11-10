import { useMemo, useState } from 'react'
import { Avatar, Badge, Button, Card, Empty, IconButton, Input, PageHeader, SearchInput, Select, StatCard, Tabs, confirmAction } from '../components/ui'
import PaymentModal from '../components/PaymentModal'
import { useStore } from '../store/StoreContext'
import { can } from '../utils/permissions'
import { Link } from '../router'
import { t } from '../i18n'
import { currentMonth, fmtDate, monthLabel, money, PAYMENT_METHODS } from '../utils/format'
import { debtors, groupById, studentById } from '../utils/finance'

export default function Payments() {
  const { db, user, remove, notify } = useStore()
  const [tab, setTab] = useState('payments')
  const [month, setMonth] = useState(currentMonth())
  const [method, setMethod] = useState('')
  const [q, setQ] = useState('')
  const [payFor, setPayFor] = useState(null)

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return db.payments
      .filter((p) => p.month === month)
      .filter((p) => !method || p.method === method)
      .filter((p) => !query || (studentById(db, p.studentId)?.fullName || '').toLowerCase().includes(query))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [db, month, method, q])

  const debtList = useMemo(() => debtors(db, month), [db, month])
  const total = list.reduce((s, p) => s + Number(p.amount), 0)
  const totalDebt = debtList.reduce((s, d) => s + d.debt, 0)
  const byMethod = PAYMENT_METHODS.map((m) => ({
    m, sum: db.payments.filter((p) => p.month === month && p.method === m).reduce((s, p) => s + Number(p.amount), 0),
  })).filter((x) => x.sum > 0)

  const del = (p) => {
    if (!confirmAction(t('pay.confirmDelete'))) return
    remove('payments', p.id)
    notify(t('common.deleted'), 'info')
  }

  const exportCsv = () => {
    const head = [t('field.date'), t('field.student'), t('field.group'), t('field.forMonth'), t('field.method'), t('pay.receivedBy'), t('field.amount')]
    const rows = list.map((p) => [p.date, studentById(db, p.studentId)?.fullName || '', groupById(db, p.groupId)?.name || '', p.month, t('method.' + p.method), db.users.find((u) => u.id === p.createdBy)?.fullName || '', p.amount])
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `tolovlar-${month}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <PageHeader
        title={t('nav.payments')}
        subtitle={monthLabel(month)}
        actions={
          <>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value || currentMonth())} style={{ width: 170 }} />
            <Button icon="plus" onClick={() => setPayFor({})}>{t('pay.add')}</Button>
          </>
        }
      />

      <div className="stats">
        <StatCard label={t('pay.collected')} value={money(totalAll(db, month))} icon="wallet" tone="green" foot={t('pay.countN', { n: db.payments.filter((p) => p.month === month).length })} />
        <StatCard label={t('dash.debt')} value={money(totalDebt)} icon="alert" tone="red" foot={t('dash.debtorsCount', { n: debtList.length })} />
        <div className="stat stat-blue stat-wide">
          <div className="stat-top"><span className="stat-label">{t('pay.byMethod')}</span></div>
          <div className="method-split">
            {byMethod.length === 0 && <span className="muted">—</span>}
            {byMethod.map(({ m, sum }) => (
              <div key={m}><small>{t('method.' + m)}</small><b>{money(sum)}</b></div>
            ))}
          </div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} items={[
        { value: 'payments', label: t('nav.payments'), count: list.length },
        { value: 'debtors', label: t('pay.debtors'), count: debtList.length },
      ]} />

      {tab === 'payments' ? (
        <Card pad={false}>
          <div className="toolbar">
            <SearchInput value={q} onChange={setQ} placeholder={t('student.searchPh')} />
            <Select value={method} onChange={(e) => setMethod(e.target.value)} placeholder={t('pay.allMethods')}
              options={PAYMENT_METHODS.map((m) => ({ value: m, label: t('method.' + m) }))} />
            <Button variant="ghost" size="sm" icon="download" onClick={exportCsv} disabled={!list.length}>CSV</Button>
          </div>
          {list.length === 0 ? (
            <Empty icon="wallet" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>{t('field.date')}</th><th>{t('field.student')}</th><th>{t('field.group')}</th><th>{t('field.method')}</th><th>{t('pay.receivedBy')}</th><th>{t('field.note')}</th><th className="num">{t('field.amount')}</th><th /></tr>
                </thead>
                <tbody>
                  {list.map((p) => {
                    const s = studentById(db, p.studentId)
                    return (
                      <tr key={p.id}>
                        <td className="nowrap">{fmtDate(p.date)}</td>
                        <td>{s ? <Link to={`/students/${s.id}`} className="person"><Avatar name={s.fullName} size={28} /><span>{s.fullName}</span></Link> : '—'}</td>
                        <td>{groupById(db, p.groupId)?.name || '—'}</td>
                        <td><Badge>{t('method.' + p.method)}</Badge></td>
                        <td className="nowrap">{db.users.find((u) => u.id === p.createdBy)?.fullName || <span className="muted">—</span>}</td>
                        <td className="muted">{p.note || ''}</td>
                        <td className="num"><b>{money(p.amount)}</b></td>
                        <td className="actions">{can(user, 'payments.delete') && <IconButton icon="trash" tone="red" title={t('common.delete')} onClick={() => del(p)} />}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr><td colSpan={6}>{t('common.total')}</td><td className="num"><b>{money(total)}</b></td><td /></tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card pad={false}>
          {debtList.length === 0 ? (
            <Empty icon="check" title={t('dash.noDebtors')} />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>{t('field.student')}</th><th>{t('field.phone')}</th><th>{t('nav.groups')}</th><th className="num">{t('pay.due')}</th><th className="num">{t('pay.paid')}</th><th className="num">{t('pay.left')}</th><th /></tr>
                </thead>
                <tbody>
                  {debtList.map(({ student: s, due, paid, debt }) => (
                    <tr key={s.id}>
                      <td><Link to={`/students/${s.id}`} className="person"><Avatar name={s.fullName} size={28} /><span>{s.fullName}</span></Link></td>
                      <td className="nowrap"><a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a></td>
                      <td>{s.groupIds.map((g) => groupById(db, g)?.name).filter(Boolean).join(', ')}</td>
                      <td className="num">{money(due)}</td>
                      <td className="num">{money(paid)}</td>
                      <td className="num"><b className="text-red">{money(debt)}</b></td>
                      <td className="actions"><Button size="sm" variant="ghost" onClick={() => setPayFor({ studentId: s.id })}>{t('pay.accept')}</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <PaymentModal open={!!payFor} studentId={payFor?.studentId} onClose={() => setPayFor(null)} />
    </>
  )
}

const totalAll = (db, month) => db.payments.filter((p) => p.month === month).reduce((s, p) => s + Number(p.amount), 0)
