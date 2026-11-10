// Demo ma'lumotlar — sanalar bugungi kunga nisbatan yaratiladi.
import { addMonths, currentMonth, toISODate, uid, WEEKDAYS } from '../utils/format'

export const emptyDb = () => ({
  version: 1,
  settings: {
    centerName: "Bilim O'quv Markazi",
    phone: '+998 90 123 45 67',
    address: 'Toshkent sh., Chilonzor tumani',
    admin: { login: 'admin', password: 'admin123', fullName: 'Administrator' },
  },
  courses: [],
  teachers: [],
  groups: [],
  students: [],
  payments: [],
  attendance: [],
  leads: [],
  expenses: [],
})

export function createSeed() {
  const db = emptyDb()
  const now = new Date()
  const month = currentMonth()
  const m = (n) => addMonths(month, n)
  const day = (mon, d) => `${mon}-${String(d).padStart(2, '0')}`
  const daysAgo = (n) => toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - n))

  const courses = [
    { id: 'c1', name: 'Frontend dasturlash', price: 800000, durationMonths: 8, description: 'HTML, CSS, JavaScript, React' },
    { id: 'c2', name: 'Ingliz tili (General)', price: 450000, durationMonths: 6, description: 'Beginner dan Intermediate gacha' },
    { id: 'c3', name: 'Matematika (DTM)', price: 400000, durationMonths: 9, description: 'Abituriyentlar uchun' },
    { id: 'c4', name: 'Kompyuter savodxonligi', price: 350000, durationMonths: 3, description: 'Word, Excel, internet' },
  ]

  const teachers = [
    { id: 't1', fullName: 'Asadbek Abdulhamidov', phone: '+998 90 111 22 33', subject: 'Frontend', salaryType: 'percent', salaryValue: 40, hiredAt: day(m(-10), 1) },
    { id: 't2', fullName: 'Dilnoza Karimova', phone: '+998 91 222 33 44', subject: 'Ingliz tili', salaryType: 'percent', salaryValue: 45, hiredAt: day(m(-14), 10) },
    { id: 't3', fullName: 'Jamshid Toshmatov', phone: '+998 93 333 44 55', subject: 'Matematika', salaryType: 'fixed', salaryValue: 4500000, hiredAt: day(m(-6), 5) },
  ]

  const groups = [
    { id: 'g1', name: 'FE-12', courseId: 'c1', teacherId: 't1', days: ['Du', 'Chor', 'Ju'], startTime: '14:00', endTime: '16:00', room: '101-xona', price: 800000, startDate: day(m(-3), 1), status: 'active' },
    { id: 'g2', name: 'ENG-B1', courseId: 'c2', teacherId: 't2', days: ['Se', 'Pay', 'Sha'], startTime: '10:00', endTime: '11:30', room: '203-xona', price: 450000, startDate: day(m(-2), 5), status: 'active' },
    { id: 'g3', name: 'MATH-DTM', courseId: 'c3', teacherId: 't3', days: ['Du', 'Chor', 'Ju'], startTime: '09:00', endTime: '10:30', room: '105-xona', price: 400000, startDate: day(m(-4), 1), status: 'active' },
    { id: 'g4', name: 'ENG-Kids', courseId: 'c2', teacherId: 't2', days: ['Se', 'Pay'], startTime: '15:00', endTime: '16:30', room: '203-xona', price: 400000, startDate: day(m(-1), 10), status: 'active' },
    { id: 'g5', name: 'FE-13', courseId: 'c1', teacherId: 't1', days: ['Se', 'Pay', 'Sha'], startTime: '18:00', endTime: '20:00', room: '101-xona', price: 800000, startDate: day(m(1), 1), status: 'forming' },
  ]

  const names = [
    ['Aziz Rahimov', ['g1'], -3], ['Madina Yusupova', ['g1', 'g2'], -3], ['Sardor Aliyev', ['g1'], -2],
    ['Nilufar Qodirova', ['g2'], -2], ['Bekzod Ergashev', ['g3'], -4], ['Shahzoda Murodova', ['g3', 'g2'], -3],
    ['Javohir Nazarov', ['g1'], -1], ['Gulnoza Saidova', ['g4'], -1], ['Otabek Xolmatov', ['g3'], -2],
    ['Zarina Abdullayeva', ['g4'], 0], ['Doston Umarov', ['g2'], -1], ['Malika Tursunova', ['g1'], 0],
    ['Ulug\'bek Sobirov', ['g3'], -3], ['Kamola Ismoilova', ['g4'], -1], ['Shoxrux Mirzayev', ['g5'], 0],
  ]
  const students = names.map(([fullName, groupIds, joinOffset], i) => ({
    id: 's' + (i + 1),
    fullName,
    phone: `+998 9${i % 10} ${String(100 + i * 37).slice(0, 3)} ${String(10 + i).padStart(2, '0')} ${String(20 + i * 3).slice(0, 2)}`,
    parentPhone: i % 3 === 0 ? `+998 97 5${i}0 1${i} 2${i}` : '',
    birthDate: `${2004 + (i % 8)}-0${(i % 9) + 1}-1${i % 9}`,
    groupIds,
    status: i === 12 ? 'frozen' : 'active',
    discount: i === 4 ? 10 : i === 9 ? 20 : 0,
    joinedAt: day(m(joinOffset), 3 + (i % 10)),
    note: '',
  }))
  students.push({
    id: 's16', fullName: 'Ravshan Qosimov', phone: '+998 99 765 43 21', parentPhone: '', birthDate: '2003-05-12',
    groupIds: [], status: 'left', discount: 0, joinedAt: day(m(-5), 2), note: "Boshqa shaharga ko'chib ketdi",
  })

  // To'lovlar: o'tgan oylar asosan to'langan, joriy oyda ba'zilari qarzdor
  const payments = []
  const methods = ['cash', 'card', 'click', 'payme']
  students.forEach((s, i) => {
    if (s.status === 'left') return
    s.groupIds.forEach((gid) => {
      const g = groups.find((x) => x.id === gid)
      if (g.status !== 'active') return
      for (let k = -3; k <= 0; k++) {
        const mon = m(k)
        if (s.joinedAt.slice(0, 7) > mon) continue
        const amount = Math.round(g.price * (1 - s.discount / 100))
        let pay = amount
        if (k === 0) {
          if (i % 3 === 0) continue // to'lamagan
          if (i % 4 === 1) pay = Math.round(amount / 2) // qisman
        }
        if (k === -1 && i === 6) continue
        payments.push({
          id: uid(), studentId: s.id, groupId: gid, amount: pay, month: mon,
          date: k === 0 ? daysAgo((i % 8) + 1) : day(mon, 3 + (i % 12)),
          method: methods[i % 4], note: '',
        })
      }
    })
  })

  // Davomat: har bir faol guruh uchun oxirgi 3 haftadagi dars kunlari
  const attendance = []
  for (let back = 21; back >= 1; back--) {
    const iso = daysAgo(back)
    const wd = WEEKDAYS[(new Date(iso + 'T00:00:00').getDay() + 6) % 7]
    groups.filter((g) => g.status === 'active' && g.days.includes(wd)).forEach((g) => {
      const records = {}
      students.filter((s) => s.groupIds.includes(g.id) && s.status === 'active' && s.joinedAt <= iso).forEach((s, idx) => {
        const r = (back * 7 + idx * 3) % 10
        records[s.id] = r < 7 ? 'present' : r < 8 ? 'late' : 'absent'
      })
      if (Object.keys(records).length) attendance.push({ id: `${g.id}_${iso}`, groupId: g.id, date: iso, records })
    })
  }

  const leads = [
    { id: uid(), fullName: 'Feruza Hamidova', phone: '+998 90 555 11 22', courseId: 'c1', source: 'instagram', status: 'new', createdAt: daysAgo(0), note: 'Kechki guruh so\'radi' },
    { id: uid(), fullName: 'Bobur Rustamov', phone: '+998 93 444 22 11', courseId: 'c2', source: 'telegram', status: 'new', createdAt: daysAgo(1), note: '' },
    { id: uid(), fullName: 'Sevara Nurmatova', phone: '+998 97 333 66 77', courseId: 'c3', source: 'friend', status: 'contacted', createdAt: daysAgo(2), note: 'Shanba kuni qayta qo\'ng\'iroq' },
    { id: uid(), fullName: 'Islom Karimov', phone: '+998 91 777 88 99', courseId: 'c1', source: 'instagram', status: 'trial', createdAt: daysAgo(4), note: 'FE-13 ga sinov darsi' },
    { id: uid(), fullName: 'Laylo Ahmedova', phone: '+998 94 121 21 21', courseId: 'c4', source: 'banner', status: 'contacted', createdAt: daysAgo(5), note: '' },
    { id: uid(), fullName: 'Temur Valiyev', phone: '+998 99 909 09 09', courseId: 'c2', source: 'call', status: 'lost', createdAt: daysAgo(12), note: 'Narx qimmat dedi' },
  ]

  const expenses = []
  for (let k = -3; k <= 0; k++) {
    const mon = m(k)
    expenses.push(
      { id: uid(), title: 'Bino ijarasi', category: 'rent', amount: 6000000, date: day(mon, 1), note: '' },
      { id: uid(), title: 'Elektr va gaz', category: 'utilities', amount: 650000 + k * -30000, date: day(mon, 5), note: '' },
      { id: uid(), title: 'Instagram reklama', category: 'marketing', amount: 1200000, date: day(mon, 7), note: '' },
    )
    if (k === -2) expenses.push({ id: uid(), title: 'Proyektor', category: 'equipment', amount: 3500000, date: day(mon, 15), note: '203-xona uchun' })
  }
  expenses.forEach((e) => { if (e.date > toISODate(now)) e.date = toISODate(now) })

  return { ...db, courses, teachers, groups, students, payments, attendance, leads, expenses }
}
