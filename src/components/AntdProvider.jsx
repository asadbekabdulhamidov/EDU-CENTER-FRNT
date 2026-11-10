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

dayjs.extend(customParseFormat)

const ANTD_LOCALES = { uz: uzUZ, uzc: uzUZ, ru: ruRU }
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
    <ConfigProvider locale={ANTD_LOCALES[lang] || uzUZ} theme={theme}>
      {children}
    </ConfigProvider>
  )
}
