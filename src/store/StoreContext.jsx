import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createSeed, emptyDb } from './seed'
import { uid } from '../utils/format'
import { getLang, setLang } from '../i18n'

const DB_KEY = 'educenter_db_v1'
const SESSION_KEY = 'educenter_session'

const COLLECTIONS = ['courses', 'teachers', 'groups', 'students', 'payments', 'attendance', 'leads', 'expenses']

function safeGet(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function safeSet(key, value) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* localStorage mavjud emas — xotirada ishlayveradi */
  }
}

/** Import qilingan ma'lumotni tekshiradi va yetishmayotgan maydonlarni to'ldiradi */
export function normalizeDb(data) {
  if (!data || typeof data !== 'object') throw new Error('invalid')
  const base = emptyDb()
  const out = { ...base, ...data, settings: { ...base.settings, ...(data.settings || {}) } }
  COLLECTIONS.forEach((c) => {
    if (!Array.isArray(out[c])) out[c] = []
  })
  return out
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [db, setDb] = useState(() => {
    const saved = safeGet(DB_KEY)
    try {
      return saved ? normalizeDb(saved) : createSeed()
    } catch {
      return createSeed()
    }
  })
  const [session, setSession] = useState(() => safeGet(SESSION_KEY))
  const [toasts, setToasts] = useState([])
  const [lang, setLangState] = useState(getLang)
  const setLanguage = useCallback((code) => {
    setLang(code)
    setLangState(code)
  }, [])
  const dbRef = useRef(db)
  dbRef.current = db

  useEffect(() => safeSet(DB_KEY, db), [db])
  useEffect(() => safeSet(SESSION_KEY, session), [session])

  const notify = useCallback((message, tone = 'success') => {
    const id = uid()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const actions = useMemo(() => ({
    add(col, item) {
      const rec = { id: uid(), createdAt: new Date().toISOString(), ...item }
      setDb((d) => ({ ...d, [col]: [rec, ...d[col]] }))
      return rec
    },
    update(col, id, patch) {
      setDb((d) => ({ ...d, [col]: d[col].map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
    },
    remove(col, id) {
      setDb((d) => {
        const next = { ...d, [col]: d[col].filter((x) => x.id !== id) }
        // Bog'liq ma'lumotlarni tozalash
        if (col === 'groups') {
          next.students = d.students.map((s) =>
            s.groupIds?.includes(id) ? { ...s, groupIds: s.groupIds.filter((g) => g !== id) } : s,
          )
          next.attendance = d.attendance.filter((a) => a.groupId !== id)
        }
        if (col === 'students') {
          next.payments = d.payments.filter((p) => p.studentId !== id)
          next.attendance = d.attendance.map((a) => {
            if (!a.records?.[id]) return a
            const records = { ...a.records }
            delete records[id]
            return { ...a, records }
          })
        }
        return next
      })
    },
    saveAttendance(groupId, date, records) {
      setDb((d) => {
        const id = `${groupId}_${date}`
        const rest = d.attendance.filter((a) => a.id !== id)
        return { ...d, attendance: [{ id, groupId, date, records }, ...rest] }
      })
    },
    updateSettings(patch) {
      setDb((d) => ({ ...d, settings: { ...d.settings, ...patch } }))
    },
    replaceAll(data) {
      setDb(normalizeDb(data))
    },
    resetDemo() {
      setDb(createSeed())
    },
    clearAll() {
      const e = emptyDb()
      setDb((d) => ({ ...e, settings: d.settings }))
    },
    login(login, password) {
      const admin = dbRef.current.settings.admin
      if (login.trim() === admin.login && password === admin.password) {
        setSession({ login: admin.login, fullName: admin.fullName, at: new Date().toISOString() })
        return true
      }
      return false
    },
    logout() {
      setSession(null)
    },
  }), [])

  const value = useMemo(
    () => ({ db, session, notify, lang, setLanguage, ...actions }),
    [db, session, notify, lang, setLanguage, actions],
  )

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>{t.message}</div>
        ))}
      </div>
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
