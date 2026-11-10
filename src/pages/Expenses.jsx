import { useMemo, useState } from 'react'
import { Badge, Button, Card, Empty, Field, IconButton, Input, Modal, PageHeader, Select, StatCard, Textarea, confirmAction, useForm } from '../components/ui'
import { useStore } from '../store/StoreContext'
import { t } from '../i18n'
import { currentMonth, EXPENSE_CATEGORIES, fmtDate, monthLabel, money, today } from '../utils/format'
import { expenseByDate, incomeByDate, teacherSalary } from '../utils/finance'

export default function Expenses() {
  const { db, remove, notify } = useStore()
  const [month, setMonth] = useState(currentMonth())
  const [cat, setCat] = useState('')
  const [edit, setEdit] = useState(null)

  const list = useMemo(
    () => db.expenses.filter((e) => e.date.slice(0, 7) === month && (!cat || e.category === cat)).sort((a, b) => b.date.localeCompare(a.date)),
    [db.expenses, month, cat],
  )
  const total = expenseByDate(db, month)
  const income = incomeByDate(db, month)
  const salaries = db.teachers.reduce((s, tch) => s + teacherSalary(db, tch, month), 0)
  const byCat = EXPENSE_CATEGORIES.map((c) => ({
    c, sum: db.expenses.filter((e) => e.date.slice(0, 7) === month && e.category === c).reduce((s, e) => s + Number(e.amount), 0),
  })).filter((x) => x.sum > 0).sort((a, b) => b.sum - a.sum)
  const maxCat = Math.max(1, ...byCat.map((x) => x.sum))

  const del = (e) => {
    if (!confirmAction(t('common.confirmDelete', { name: e.title }))) return
    remove('expenses', e.id)
    notify(t('common.deleted'), 'info')
  }

  return (
    <>
      <PageHeader
        title={t('nav.expenses')}
        subtitle={monthLabel(month)}
        actions={
          <>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value || currentMonth())} style={{ width: 170 }} />
            <Button icon="plus" onClick={() => setEdit({})}>{t('exp.add')}</Button>
          </>
        }
      />
      <div className="stats">
        <StatCard label={t('exp.total')} value={money(total)} icon="receipt" tone="amber" />
        <StatCard label={t('dash.incomeShort')} value={money(income)} icon="trend" tone="blue" />
        <StatCard label={t('exp.salaries')} value={money(salaries)} icon="teacher" tone="violet" foot={t('exp.salariesHint')} />
        <StatCard label={t('exp.net')} value={money(income - total - salaries)} icon="wallet" tone={income - total - salaries >= 0 ? 'green' : 'red'} foot={t('exp.netHint')} />
      </div>

      <div className="grid-2 grid-2-wide">
        <Card pad={false} title={t('exp.list')} actions={
          <Select value={cat} onChange={(e) => setCat(e.target.value)} placeholder={t('exp.allCats')}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: t('cat.' + c) }))} />
        }>
          {list.length === 0 ? (
            <Empty icon="receipt" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>{t('field.date')}</th><th>{t('field.title')}</th><th>{t('field.category')}</th><th className="num">{t('field.amount')}</th><th /></tr></thead>
                <tbody>
                  {list.map((e) => (
                    <tr key={e.id}>
                      <td className="nowrap">{fmtDate(e.date)}</td>
                      <td>{e.title}{e.note && <small className="muted block">{e.note}</small>}</td>
                      <td><Badge tone="amber">{t('cat.' + e.category)}</Badge></td>
                      <td className="num"><b>{money(e.amount)}</b></td>
                      <td className="actions">
                        <IconButton icon="edit" title={t('common.edit')} onClick={() => setEdit(e)} />
                        <IconButton icon="trash" tone="red" title={t('common.delete')} onClick={() => del(e)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card title={t('exp.byCategory')}>
          {byCat.length === 0 ? <Empty icon="receipt" /> : (
            <ul className="hbars">
              {byCat.map(({ c, sum }) => (
                <li key={c}>
                  <div className="hbar-top"><span>{t('cat.' + c)}</span><b>{money(sum)}</b></div>
                  <div className="meter meter-amber"><span style={{ width: (sum / maxCat) * 100 + '%' }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ExpenseForm open={!!edit} expense={edit?.id ? edit : null} onClose={() => setEdit(null)} />
    </>
  )
}

function ExpenseForm({ open, onClose, expense }) {
  if (!open) return null
  return <Inner onClose={onClose} expense={expense} />
}

function Inner({ onClose, expense }) {
  const { add, update, notify } = useStore()
  const [v, set] = useForm({ title: '', category: 'other', amount: '', date: today(), note: '', ...expense })
  const [errors, setErrors] = useState({})
  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!v.title.trim()) errs.title = t('form.required')
    if (!(Number(v.amount) > 0)) errs.amount = t('form.positive')
    setErrors(errs)
    if (Object.keys(errs).length) return
    const data = { ...v, amount: Number(v.amount) }
    if (expense) update('expenses', expense.id, data)
    else add('expenses', data)
    notify(t('common.saved'))
    onClose()
  }
  return (
    <Modal open title={expense ? t('exp.edit') : t('exp.add')} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button><Button form="exp-form" type="submit" icon="check">{t('common.save')}</Button></>}>
      <form id="exp-form" className="form-grid" onSubmit={submit}>
        <Field label={t('field.title')} error={errors.title} full><Input autoFocus value={v.title} onChange={set('title')} /></Field>
        <Field label={t('field.category')}>
          <Select value={v.category} onChange={set('category')} options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: t('cat.' + c) }))} />
        </Field>
        <Field label={t('field.amount')} error={errors.amount}><Input type="number" min="0" step="1000" value={v.amount} onChange={set('amount')} /></Field>
        <Field label={t('field.date')}><Input type="date" value={v.date} onChange={set('date')} /></Field>
        <Field label={t('field.note')} full><Textarea value={v.note} onChange={set('note')} rows={2} /></Field>
      </form>
    </Modal>
  )
}
