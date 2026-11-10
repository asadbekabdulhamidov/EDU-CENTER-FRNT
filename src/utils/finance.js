// Moliyaviy hisob-kitoblar. Barcha funksiyalar "db" obyektini qabul qiladi.
// Qoida: o'quvchi har oy o'zi o'qiydigan har bir guruh narxini to'laydi
// (chegirma foizi hisobga olinadi). Qo'shilgan oyidan boshlab hisoblanadi.

const monthOf = (iso) => (iso || '').slice(0, 7)

export const groupById = (db, id) => db.groups.find((g) => g.id === id)
export const studentById = (db, id) => db.students.find((s) => s.id === id)
export const teacherById = (db, id) => db.teachers.find((t) => t.id === id)
export const courseById = (db, id) => db.courses.find((c) => c.id === id)

export const groupStudents = (db, groupId) =>
  db.students.filter((s) => s.groupIds?.includes(groupId) && s.status !== 'left')

/** O'quvchining shu oy shu guruh uchun to'lashi kerak bo'lgan summa */
export const dueForGroup = (db, student, groupId, month) => {
  const g = groupById(db, groupId)
  if (!g || student.status !== 'active') return 0
  if (student.joinedAt && monthOf(student.joinedAt) > month) return 0
  const discount = Number(student.discount) || 0
  return Math.round((Number(g.price) || 0) * (1 - discount / 100))
}

export const studentDue = (db, student, month) =>
  (student.groupIds || []).reduce((sum, gid) => sum + dueForGroup(db, student, gid, month), 0)

export const studentPaid = (db, studentId, month, groupId) =>
  db.payments
    .filter((p) => p.studentId === studentId && p.month === month && (!groupId || p.groupId === groupId))
    .reduce((s, p) => s + Number(p.amount), 0)

export const studentDebt = (db, student, month) =>
  Math.max(0, studentDue(db, student, month) - studentPaid(db, student.id, month))

export const debtors = (db, month) =>
  db.students
    .filter((s) => s.status === 'active')
    .map((s) => {
      const due = studentDue(db, s, month)
      const paid = studentPaid(db, s.id, month)
      return { student: s, due, paid, debt: Math.max(0, due - paid) }
    })
    .filter((r) => r.debt > 0)
    .sort((a, b) => b.debt - a.debt)

export const incomeByDate = (db, month) =>
  db.payments.filter((p) => monthOf(p.date) === month).reduce((s, p) => s + Number(p.amount), 0)

export const expenseByDate = (db, month) =>
  db.expenses.filter((e) => monthOf(e.date) === month).reduce((s, e) => s + Number(e.amount), 0)

/** O'qituvchi maoshi: foiz — guruhlaridan shu oy uchun tushgan to'lovlardan; fiks — belgilangan summa */
export const teacherSalary = (db, teacher, month) => {
  if (teacher.salaryType === 'fixed') return Number(teacher.salaryValue) || 0
  const groupIds = db.groups.filter((g) => g.teacherId === teacher.id).map((g) => g.id)
  const collected = db.payments
    .filter((p) => p.month === month && groupIds.includes(p.groupId))
    .reduce((s, p) => s + Number(p.amount), 0)
  return Math.round((collected * (Number(teacher.salaryValue) || 0)) / 100)
}

/** Davomat statistikasi: { present, late, absent, total, rate } */
export const attendanceStats = (db, { studentId, groupId } = {}) => {
  const res = { present: 0, late: 0, absent: 0, total: 0, rate: 0 }
  db.attendance
    .filter((a) => !groupId || a.groupId === groupId)
    .forEach((a) => {
      Object.entries(a.records || {}).forEach(([sid, st]) => {
        if (studentId && sid !== studentId) return
        if (res[st] !== undefined) {
          res[st]++
          res.total++
        }
      })
    })
  res.rate = res.total ? Math.round(((res.present + res.late) / res.total) * 100) : 0
  return res
}
