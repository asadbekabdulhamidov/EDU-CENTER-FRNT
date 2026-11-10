import { getLang, t } from '../i18n'

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

const pad = (n) => String(n).padStart(2, '0')

export const toISODate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Bugungi sana: YYYY-MM-DD (lokal vaqt bo'yicha) */
export const today = () => toISODate(new Date())

/** Joriy oy: YYYY-MM */
export const currentMonth = () => today().slice(0, 7)

/** '2026-11' ga n oy qo'shish */
export const addMonths = (month, n) => {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export const monthName = (i) => t(`month.${i + 1}`)
export const monthShort = (i) => {
  const name = monthName(i)
  // Iyun/Iyul, Июнь/Июль bir xil bo'lib qolmasligi uchun qisqa nomlar to'liq qoladi
  if (name.length <= 4 || (getLang() === 'ru' && /^Июн|^Июл/.test(name))) return name.replace(/ь$/, '')
  return name.slice(0, 3)
}

export const monthLabel = (month) => {
  if (!month) return '—'
  const [y, m] = month.split('-').map(Number)
  return `${monthName(m - 1)} ${y}`
}

/** Hafta kunlari kodlari (ma'lumotda saqlanadi). Ko'rsatish uchun: wdLabel(code) */
export const WEEKDAYS = ['Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha', 'Yak']
export const wdLabel = (code) => t(`wd.${code}`)
export const wdFull = (code) => t(`wdf.${code}`)

/** Sana -> hafta kuni kodi */
export const weekdayOf = (iso) => {
  const d = iso ? new Date(iso + 'T00:00:00') : new Date()
  return WEEKDAYS[(d.getDay() + 6) % 7]
}

export const num = (n) =>
  Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

export const money = (n) => `${num(n)} ${t('currency')}`

export const shortMoney = (n) => {
  const v = Number(n) || 0
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1) + ' ' + t('mln')
  if (Math.abs(v) >= 1e3) return Math.round(v / 1e3) + ' ' + t('thousand')
  return String(v)
}

export const fmtDate = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}.${m}.${y}`
}

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase()

// --- Holatlar: kalit -> rang. Matn: label('student', key) ---
export const TONES = {
  student: { active: 'green', frozen: 'amber', left: 'gray' },
  group: { active: 'green', forming: 'blue', finished: 'gray' },
  lead: { new: 'blue', contacted: 'amber', trial: 'violet', converted: 'green', lost: 'gray' },
  att: { present: 'green', late: 'amber', absent: 'red' },
}
export const label = (kind, key) => t(`${kind}.${key}`)

export const PAYMENT_METHODS = ['cash', 'card', 'click', 'payme', 'transfer']
export const LEAD_SOURCES = ['instagram', 'telegram', 'friend', 'banner', 'call', 'other']
export const EXPENSE_CATEGORIES = ['rent', 'salary', 'utilities', 'marketing', 'equipment', 'stationery', 'other']
export const ATT_SHORT = { present: '✓', late: 'K', absent: '✕' }
