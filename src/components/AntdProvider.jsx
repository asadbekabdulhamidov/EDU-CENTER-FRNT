// Ant Design sozlamalari: til (UZ / ЎЗ / RU) va markaz dizayniga mos tema
import { useEffect } from 'react'
import { ConfigProvider } from 'antd'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/uz-latn'
import 'dayjs/locale/uz'
import 'dayjs/locale/ru'
import uzUZ from 'antd/locale/uz_UZ'
import ruRU from 'antd/locale/ru_RU'
import { useStore } from '../store/StoreContext'
import { toCyrillic } from '../i18n'

dayjs.extend(customParseFormat)

// MUHIM: rc-picker sana tilini DatePicker.lang.locale dan oladi va 'uz_UZ' ni
// dayjs'ning KIRILL 'uz' locale'iga aylantiradi. Shuning uchun lotin rejimida
// oy nomlari "ноябр" bo'lib chiqardi. Bu yerda har bir til uchun aniq dayjs locale beramiz.
const withPickerLocale = (base, dayjsLocale) => {
  const dp = { ...base.DatePicker, lang: { ...base.DatePicker.lang, locale: dayjsLocale } }
  const cal = base.Calendar ? { ...base.Calendar, lang: { ...base.Calendar.lang, locale: dayjsLocale } } : base.Calendar
  return { ...base, DatePicker: dp, Calendar: cal }
}

// Kirill rejimi: antd'ning o'zbekcha (lotin) matnlarini kirillga o'giramiz.
// Format satrlari (YYYY-MM-DD) va locale kodlari o'zgarmaydi.
const SKIP_KEY = /locale|format/i
const cyrillize = (obj) => {
  if (typeof obj === 'string') return toCyrillic(obj)
  if (Array.isArray(obj)) return obj.map(cyrillize)
  if (obj && typeof obj === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(obj)) out[k] = SKIP_KEY.test(k) || typeof v === 'function' ? v : cyrillize(v)
    return out
  }
  return obj
}

const ANTD_LOCALES = {
  uz: withPickerLocale(uzUZ, 'uz-latn'),
  uzc: { ...withPickerLocale(cyrillize(uzUZ), 'uz'), locale: 'uz' },
  ru: ruRU,
}
const DAYJS_LOCALES = { uz: 'uz-latn', uzc: 'uz', ru: 'ru' }

const theme = {
  token: {
    colorPrimary: '#1f4d3f',
    colorLink: '#1f4d3f',
    colorError: '#c8443a',
    colorBorder: '#d6d0c3',
    colorText: '#1d2420',
    colorTextPlaceholder: '#9a9f9b',
    borderRadius: 9,
    controlHeight: 40,
    fontFamily: "'Manrope', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
  },
  components: {
    Select: { optionSelectedBg: '#e9f1ed', optionActiveBg: '#f5f3ee', optionSelectedFontWeight: 700 },
    DatePicker: { cellActiveWithRangeBg: '#e9f1ed' },
  },
}

export default function AntdProvider({ children }) {
  const { lang } = useStore()
  dayjs.locale(DAYJS_LOCALES[lang] || 'uz-latn')
  useEffect(() => {
    dayjs.locale(DAYJS_LOCALES[lang] || 'uz-latn')
  }, [lang])
  return (
    <ConfigProvider locale={ANTD_LOCALES[lang] || ANTD_LOCALES.uz} theme={theme}>
      {children}
    </ConfigProvider>
  )
}
