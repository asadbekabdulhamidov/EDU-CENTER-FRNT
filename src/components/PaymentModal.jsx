import { useMemo, useState } from 'react'
import { Button, Field, Input, Modal, Select, Textarea, useForm } from './ui'
import { useStore } from '../store/StoreContext'
import { t } from '../i18n'
import { currentMonth, money, PAYMENT_METHODS, today } from '../utils/format'
import { dueForGroup, groupById, studentPaid } from '../utils/finance'

/** To'lov qo'shish oynasi. studentId berilsa — o'quvchi oldindan tanlangan bo'ladi. */
export default function PaymentModal({ open, onClose, studentId, groupId }) {
  if (!open) return null
  return <PaymentForm onClose={onClose} studentId={studentId} groupId={groupId} />
}

function PaymentForm({ onClose, studentId, groupId }) {
  const { db, add, notify } = useStore()
  const [v, set, setV] = useForm({
    studentId: studentId || '',
    groupId: groupId || '',
    month: currentMonth(),
    amount: '',
    method: 'cash',
    date: today(),
    note: '',
  })
  const [errors, setErrors] = useState({})

  const student = db.students.find((s) => s.id === v.studentId)
  const groupOptions = useMemo(
    () => (student?.groupIds || []).map((gid) => groupById(db, gid)).filter(Boolean).map((g) => ({ value: g.id, label: g.name })),
    [db, student],
  )
  const effectiveGroup = v.groupId || (groupOptions.length === 1 ? groupOptions[0].value : '')
  const due = student && effectiveGroup ? dueForGroup(db, student, effectiveGroup, v.month) : 0
  const paid = student && effectiveGroup ? studentPaid(db, student.id, v.month, effectiveGroup) : 0
  const left = Math.max(0, due - paid)

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!v.studentId) errs.studentId = t('form.required')
    if (!effectiveGroup) errs.groupId = t('form.required')
    if (!(Number(v.amount) > 0)) errs.amount = t('form.positive')
    setErrors(errs)
    if (Object.keys(errs).length) return
    add('payments', { ...v, groupId: effectiveGroup, amount: Number(v.amount) })
    notify(t('pay.saved'))
    onClose()
  }

  return (
    <Modal
      open
      title={t('pay.add')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button form="pay-form" type="submit" icon="check">{t('common.save')}</Button>
        </>
      }
    >
      <form id="pay-form" className="form-grid" onSubmit={submit}>
        <Field label={t('field.student')} error={errors.studentId} full>
          <Select
            value={v.studentId}
            onChange={(e) => setV((p) => ({ ...p, studentId: e.target.value, groupId: '' }))}
            placeholder={t('common.choose')}
            disabled={!!studentId}
            options={db.students
              .filter((s) => s.status !== 'left')
              .sort((a, b) => a.fullName.localeCompare(b.fullName))
              .map((s) => ({ value: s.id, label: s.fullName }))}
          />
        </Field>
        <Field label={t('field.group')} error={errors.groupId}>
          <Select value={effectiveGroup} onChange={set('groupId')} placeholder={t('common.choose')} options={groupOptions} />
        </Field>
        <Field label={t('field.forMonth')}>
          <Input type="month" value={v.month} onChange={set('month')} />
        </Field>
        {student && effectiveGroup && (
          <div className="pay-hint field-full">
            <span>{t('pay.due')}: <b>{money(due)}</b></span>
            <span>{t('pay.paid')}: <b>{money(paid)}</b></span>
            <span>{t('pay.left')}: <b className={left ? 'text-red' : 'text-green'}>{money(left)}</b></span>
            {left > 0 && (
              <button type="button" className="link-btn" onClick={() => setV((p) => ({ ...p, amount: String(left) }))}>
                {t('pay.fillLeft')}
              </button>
            )}
          </div>
        )}
        <Field label={t('field.amount')} error={errors.amount}>
          <Input type="number" min="0" step="1000" value={v.amount} onChange={set('amount')} placeholder="0" />
        </Field>
        <Field label={t('field.method')}>
          <Select value={v.method} onChange={set('method')} options={PAYMENT_METHODS.map((m) => ({ value: m, label: t('method.' + m) }))} />
        </Field>
        <Field label={t('field.payDate')}>
          <Input type="date" value={v.date} onChange={set('date')} />
        </Field>
        <Field label={t('field.note')} full>
          <Textarea value={v.note} onChange={set('note')} rows={2} />
        </Field>
      </form>
    </Modal>
  )
}
