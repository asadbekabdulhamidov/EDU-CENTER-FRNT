// Oddiy i18n: lotin (uz), kirill (uzc) va rus (ru).
// Lug'atda har bir kalit: [lotin, rus] yoki [lotin, rus, kirill].
// Kirill berilmasa — lotindan avtomatik transliteratsiya qilinadi.
import { DICT } from './dict'

export const LANGS = [
  { code: 'uz', label: "O'zbekcha", short: 'UZ' },
  { code: 'uzc', label: 'Ўзбекча', short: 'ЎЗ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
]

const LANG_KEY = 'educenter_lang'
let current = (() => {
  try {
    const v = localStorage.getItem(LANG_KEY)
    return LANGS.some((l) => l.code === v) ? v : 'uz'
  } catch {
    return 'uz'
  }
})()

export const getLang = () => current
export const setLang = (code) => {
  current = code
  try { localStorage.setItem(LANG_KEY, code) } catch { /* ignore */ }
  if (typeof document !== 'undefined') document.documentElement.lang = code === 'ru' ? 'ru' : code === 'uzc' ? 'uz-Cyrl' : 'uz'
}

const cache = new Map()

/** t('key', { n: 5 }) -> tarjima, {n} o'rniga qiymat qo'yiladi */
export function t(key, vars) {
  const entry = DICT[key]
  let s
  if (!entry) {
    if (import.meta.env?.DEV) console.warn('[i18n] kalit topilmadi:', key)
    s = key
  } else if (current === 'ru') s = entry[1]
  else if (current === 'uzc') {
    if (entry[2]) s = entry[2]
    else {
      if (!cache.has(key)) cache.set(key, toCyrillic(entry[0]))
      s = cache.get(key)
    }
  } else s = entry[0]
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))
  return s
}

// ---------- Lotin -> Kirill transliteratsiya ----------
const DIGRAPHS = { sh: 'ш', ch: 'ч', "o'": 'ў', "g'": 'ғ', yo: 'ё', yu: 'ю', ya: 'я', ye: 'е' }
const SINGLE = {
  a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж', k: 'к', l: 'л',
  m: 'м', n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х',
  y: 'й', z: 'з', c: 'с', w: 'в', "'": 'ъ',
}
const VOWELS = 'aeiou'

function translitWord(word) {
  // Brendlar va qisqartmalar (ERP, JSON) o'zgarmaydi
  if (/^[A-Z0-9-]{2,}$/.test(word)) return word
  let out = ''
  const lower = word.toLowerCase()
  for (let i = 0; i < word.length; ) {
    const two = lower.slice(i, i + 2)
    const isUpper = word[i] !== lower[i]
    let cyr
    let step = 1
    if (two === 'yo' && word[i + 2] === "'") {
      // "yo'q" -> "йўқ" (o' ustun turadi)
      cyr = 'й'
    } else if (DIGRAPHS[two]) {
      cyr = DIGRAPHS[two]
      step = 2
    } else if (lower[i] === 'e' && (i === 0 || VOWELS.includes(lower[i - 1]))) {
      cyr = 'э'
    } else if (SINGLE[lower[i]] !== undefined) {
      cyr = SINGLE[lower[i]]
    } else {
      cyr = word[i]
    }
    out += isUpper ? cyr.toUpperCase() : cyr
    i += step
  }
  return out
}

export function toCyrillic(text) {
  return text
    .replace(/[‘’ʻʼ`]/g, "'")
    // {placeholder} larni saqlab, qolgan so'zlarni o'giramiz
    .split(/(\{\w+\}|[A-Za-z']+)/g)
    .map((part) => (/^\{\w+\}$/.test(part) ? part : /^[A-Za-z']+$/.test(part) ? translitWord(part) : part))
    .join('')
}
