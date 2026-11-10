import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createSeed, demoUsers, emptyDb } from './seed'
import { uid } from '../utils/format'
import { getLang, setLang } from '../i18n'

const DB_KEY = 'educenter_db_v1'
const SESSION_KEY = 'educenter_session'

const COLLECTIONS = ['users', 'courses', 'teachers', 'groups', 'students', 'payments', 'attendance', 'leads', 'expenses']

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

/** Import qilingan / eski ma'lumotni tekshiradi, yetishmayotgan maydonlarni to'ldiradi */
export function normalizeDb(data) {
  if (!data || typeof data !== 'object') throw new Error('invalid')
  const base = emptyDb()
  const out = { ...base, ...data, settings: { ...base.settings, ...(data.settings || {}) } }
  COLLECTIONS.forEach((c) => {
    if (!Array.isArray(out[c])) out[c] = []
  })
  // Migratsiya: rollardan oldingi versiyada faqat settings.admin bor edi
  if (!out.users.length) out.users = demoUsers(out.teachers, data.settings?.admin)
  delete out.settings.admin
  return out
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [db, setDb] = useState(() => {
    try {
      const saved = safeGet(DB_KEY)
      return saved ? normalizeDb(saved) : createSeed()
    } catch {
      return createSeed()
    }
  })
  const [session, setSession] = useState(() => safeGet(SESSION_KEY))
  const [toasts, setToasts] = useState([])
  const [lang, setLangState] = useState(getLang)

  // Joriy foydalanuvchi har doim bazadan olinadi (rol yoki parol o'zgarsa darhol ta'sir qiladi)
  const user = useMemo(() => {
    const u = session?.userId && db.users.find((x) => x.id === session.userId)
    return u && u.active !== false ? u : null
  }, [db.users, session])

  const dbRef = useRef(db)
  dbRef.current = db
  const userRef = useRef(user)
  userRef.current = user

  useEffect(() => safeSet(DB_KEY, db), [db])
  useEffect(() => safeSet(SESSION_KEY, user ? session : null), [session, user])

  const setLanguage = useCallback((code) => {
    setLang(code)
    setLangState(code)
  }, [])

  const notify = useCallback((message, tone = 'success') => {
    const id = uid()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const actions = useMemo(() => ({
    add(col, item) {
      const rec = { id: uid(), createdAt: new Date().toISOString(), createdBy: userRef.current?.id, ...item }
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
        if (col === 'teachers') next.users = d.users.filter((u) => u.teacherId !== id)
        return next
      })
    },
    /** O'qituvchining tizimga kirish hisobini yaratadi / yangilaydi / o'chiradi */
    saveTeacherAccount(teacherId, { login, password, fullName }) {
      setDb((d) => {
        const existing = d.users.find((u) => u.teacherId === teacherId)
        if (!login) return { ...d, users: d.users.filter((u) => u.teacherId !== teacherId) }
        if (existing) {
          return {
            ...d,
            users: d.users.map((u) => (u.id === existing.id ? { ...u, login, fullName, ...(password ? { password } : {}) } : u)),
          }
        }
        const rec = { id: uid(), role: 'teacher', teacherId, login, password, fullName, active: true, createdAt: new Date().toISOString() }
        return { ...d, users: [...d.users, rec] }
      })
    },
    saveAttendance(groupId, date, records) {
      setDb((d) => {
        const id = `${groupId}_${date}`
        const rest = d.attendance.filter((a) => a.id !== id)
        return { ...d, attendance: [{ id, groupId, date, records, createdBy: userRef.current?.id, updatedAt: new Date().toISOString() }, ...rest] }
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
      // Xodimlar hisoblari saqlanadi (o'qituvchilarnikidan tashqari), aks holda hech kim kira olmaydi
      setDb((d) => ({ ...e, settings: d.settings, users: d.users.filter((u) => u.role !== 'teacher') }))
    },
    login(login, password) {
      const u = dbRef.current.users.find(
        (x) => x.login.toLowerCase() === login.trim().toLowerCase() && x.password === password,
      )
      if (!u) return 'wrong'
      if (u.active === false) return 'blocked'
      setSession({ userId: u.id, at: new Date().toISOString() })
      return 'ok'
    },
    logout() {
      setSession(null)
    },
  }), [])

  const value = useMemo(
    () => ({ db, session: user, user, notify, lang, setLanguage, ...actions }),
    [db, user, notify, lang, setLanguage, actions],
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
