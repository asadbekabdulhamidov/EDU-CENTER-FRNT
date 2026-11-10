// Rollar va ruxsatlar.
// director — hammasi; admin — kundalik ish (moliyaviy hisobotlarsiz);
// teacher — faqat o'z guruhlari va davomat.
export const ROLES = ['director', 'admin', 'teacher']

export const ROLE_TONES = { director: 'violet', admin: 'blue', teacher: 'green' }

const PERMS = {
  director: ['*'],
  admin: [
    'page.dashboard', 'page.students', 'page.groups', 'page.courses', 'page.payments', 'page.attendance', 'page.leads',
    'students.edit', 'groups.edit', 'payments.add', 'money.view',
  ],
  teacher: ['page.dashboard', 'page.groups', 'page.attendance', 'scope.own'],
}

/**
 * Ruxsatlar ro'yxati:
 * page.<bo'lim>      — sahifaga kirish
 * students.edit      — o'quvchi qo'shish/tahrirlash
 * students.delete    — o'quvchini o'chirish
 * groups.edit        — guruh yaratish/tahrirlash, o'quvchi qo'shish/chiqarish
 * courses.edit       — kurslarni boshqarish
 * payments.add       — to'lov qabul qilish
 * payments.delete    — to'lovni o'chirish
 * money.view         — o'quvchi to'lov summalarini ko'rish
 * finance.view       — xarajat, foyda, maoshlar
 * scope.own          — faqat o'z guruhlari (o'qituvchi)
 */
export const can = (user, perm) => {
  if (!user) return false
  const list = PERMS[user.role] || []
  if (list.includes('*')) return perm !== 'scope.own'
  return list.includes(perm)
}

/** Foydalanuvchi ko'ra oladigan guruhlar */
export const visibleGroups = (db, user) =>
  can(user, 'scope.own') ? db.groups.filter((g) => g.teacherId === user.teacherId) : db.groups
