import { useState } from 'react'
import { Badge, Button, Field, IconButton, Input, Modal, PageHeader, SearchInput, Select, Textarea, confirmAction, useForm } from '../components/ui'
import Icon from '../components/Icon'
import StudentForm from '../components/StudentForm'
import { useStore } from '../store/StoreContext'
import { t } from '../i18n'
import { fmtDate, label, LEAD_SOURCES, TONES, today } from '../utils/format'
import { courseById } from '../utils/finance'

const COLUMNS = ['new', 'contacted', 'trial', 'converted', 'lost']

export default function Leads() {
  const { db, update, remove, notify } = useStore()
  const [edit, setEdit] = useState(null)
  const [convert, setConvert] = useState(null)
  const [q, setQ] = useState('')
  const [showClosed, setShowClosed] = useState(false)

  const query = q.trim().toLowerCase()
  const leads = db.leads.filter((l) => !query || l.fullName.toLowerCase().includes(query) || l.phone.replace(/\s/g, '').includes(query.replace(/\s/g, '')))
  const columns = showClosed ? COLUMNS : COLUMNS.filter((c) => c !== 'converted' && c !== 'lost')
  const converted = db.leads.filter((l) => l.status === 'converted').length
  const conversion = db.leads.length ? Math.round((converted / db.leads.length) * 100) : 0

  const move = (l, status) => {
    update('leads', l.id, { status })
  }
  const del = (l) => {
    if (!confirmAction(t('common.confirmDelete', { name: l.fullName }))) return
    remove('leads', l.id)
    notify(t('common.deleted'), 'info')
  }

  // Drag & drop: kartani ustunga tashlash
  const onDrop = (e, status) => {
    const id = e.dataTransfer.getData('text/plain')
    const l = db.leads.find((x) => x.id === id)
    if (!l || l.status === status) return
    if (status === 'converted') setConvert(l)
    else move(l, status)
  }

  return (
    <>
      <PageHeader
        title={t('nav.leads')}
        subtitle={t('lead.subtitle', { n: db.leads.length, p: conversion })}
        actions={<Button icon="plus" onClick={() => setEdit({})}>{t('lead.add')}</Button>}
      />
      <div className="toolbar toolbar-plain">
        <SearchInput value={q} onChange={setQ} />
        <label className="switch">
          <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
          <span>{t('lead.showClosed')}</span>
        </label>
      </div>

      <div className="kanban" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(240px, 1fr))` }}>
        {columns.map((col) => {
          const items = leads.filter((l) => l.status === col).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
          return (
            <div key={col} className="kanban-col" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, col)}>
              <div className="kanban-head">
                <Badge tone={TONES.lead[col]}>{label('lead', col)}</Badge>
                <span className="muted">{items.length}</span>
              </div>
              {items.map((l) => (
                <div key={l.id} className="lead-card" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', l.id)}>
                  <div className="lead-top">
                    <strong>{l.fullName}</strong>
                    <div className="row-actions">
                      <IconButton icon="edit" title={t('common.edit')} onClick={() => setEdit(l)} />
                      <IconButton icon="trash" tone="red" title={t('common.delete')} onClick={() => del(l)} />
                    </div>
                  </div>
                  <a className="lead-phone" href={`tel:${l.phone.replace(/\s/g, '')}`}><Icon name="phone" size={14} />{l.phone}</a>
                  <small className="muted">{courseById(db, l.courseId)?.name || '—'} · {t('source.' + l.source)}</small>
                  {l.note && <p className="lead-note">{l.note}</p>}
                  <div className="lead-foot">
                    <small className="muted">{fmtDate(l.createdAt)}</small>
                    {col !== 'converted' && col !== 'lost' && (
                      <div className="row-actions">
                        <Select value={l.status} onChange={(e) => (e.target.value === 'converted' ? setConvert(l) : move(l, e.target.value))}
                          options={COLUMNS.map((c) => ({ value: c, label: label('lead', c) }))} />
                      </div>
                    )}
                  </div>
                  {(col === 'trial' || col === 'contacted') && (
                    <Button size="sm" variant="soft" className="btn-block" onClick={() => setConvert(l)}>{t('lead.convert')}</Button>
                  )}
                </div>
              ))}
              {items.length === 0 && <div className="kanban-empty">{t('lead.dropHere')}</div>}
            </div>
          )
        })}
      </div>

      <LeadForm open={!!edit} lead={edit?.id ? edit : null} onClose={() => setEdit(null)} />
      <StudentForm
        open={!!convert}
        initial={convert ? {
          fullName: convert.fullName, phone: convert.phone, note: convert.note,
          groupIds: db.groups.filter((g) => g.courseId === convert.courseId && g.status !== 'finished').slice(0, 1).map((g) => g.id),
        } : undefined}
        onClose={() => setConvert(null)}
        onSaved={() => {
          update('leads', convert.id, { status: 'converted' })
          notify(t('lead.convertedMsg'))
        }}
      />
    </>
  )
}

function LeadForm({ open, onClose, lead }) {
  if (!open) return null
  return <Inner onClose={onClose} lead={lead} />
}

function Inner({ onClose, lead }) {
  const { db, add, update, notify } = useStore()
  const [v, set] = useForm({ fullName: '', phone: '+998 ', courseId: '', source: 'instagram', status: 'new', note: '', createdAt: today(), ...lead })
  const [errors, setErrors] = useState({})
  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (v.fullName.trim().length < 2) errs.fullName = t('form.required')
    if (v.phone.replace(/\D/g, '').length < 9) errs.phone = t('form.phone')
    setErrors(errs)
    if (Object.keys(errs).length) return
    if (lead) update('leads', lead.id, v)
    else add('leads', { ...v, createdAt: today() })
    notify(t('common.saved'))
    onClose()
  }
  return (
    <Modal open title={lead ? t('lead.edit') : t('lead.add')} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button><Button form="lead-form" type="submit" icon="check">{t('common.save')}</Button></>}>
      <form id="lead-form" className="form-grid" onSubmit={submit}>
        <Field label={t('field.fullName')} error={errors.fullName} full><Input autoFocus value={v.fullName} onChange={set('fullName')} /></Field>
        <Field label={t('field.phone')} error={errors.phone}><Input value={v.phone} onChange={set('phone')} /></Field>
        <Field label={t('field.course')}>
          <Select value={v.courseId} onChange={set('courseId')} placeholder={t('common.choose')} options={db.courses.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label={t('field.source')}>
          <Select value={v.source} onChange={set('source')} options={LEAD_SOURCES.map((s) => ({ value: s, label: t('source.' + s) }))} />
        </Field>
        <Field label={t('field.status')}>
          <Select value={v.status} onChange={set('status')} options={COLUMNS.filter((c) => c !== 'converted').map((c) => ({ value: c, label: label('lead', c) }))} />
        </Field>
        <Field label={t('field.note')} full><Textarea value={v.note} onChange={set('note')} /></Field>
      </form>
    </Modal>
  )
}
