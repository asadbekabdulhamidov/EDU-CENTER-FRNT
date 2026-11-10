# EduCenter ERP — o'quv markaz uchun MVP (frontend)

O'quv markazni boshqarish tizimining **faqat frontend** qismi. Barcha ma'lumotlar brauzerning
`localStorage`ida saqlanadi — backend keyin ulanadi.

Interfeys 3 tilda: **O'zbekcha (lotin)**, **Ўзбекча (кирилл)**, **Русский**.

## Ishga tushirish

```bash
npm install
npm run dev
```

Brauzerda `http://localhost:5173` ochiladi. Demo kirish: **admin / admin123**

## Bo'limlar

| Bo'lim | Imkoniyatlar |
|---|---|
| Bosh sahifa | Faol o'quvchilar, oylik tushum, qarzdorlik, sof foyda, 6 oylik grafik, bugungi darslar, qarzdorlar, so'nggi to'lovlar |
| O'quvchilar | Qo'shish/tahrirlash/o'chirish, qidiruv, guruh va holat bo'yicha filter, qarzdorlar filtri, chegirma %, profil sahifasi (oylik to'lov holati, davomat, to'lovlar tarixi) |
| Guruhlar | Kurs, o'qituvchi, dars kunlari, vaqt, xona, narx; xona band bo'lsa ogohlantirish; guruh sahifasida o'quvchilar, to'lov va davomat foizi |
| O'qituvchilar | Foiz (guruh to'lovlaridan) yoki belgilangan oylik — oylik maosh avtomatik hisoblanadi |
| Kurslar | Nomi, narxi, davomiyligi |
| To'lovlar | Oy bo'yicha ro'yxat, to'lov turlari (naqd, karta, Click, Payme, o'tkazma), qarzdorlar ro'yxati, CSV eksport |
| Davomat | Guruh + sana, Keldi/Kechikdi/Kelmadi, "Hammasi keldi", oxirgi 10 dars jadvali |
| Lidlar | Kanban (drag & drop), holatlar, o'quvchiga aylantirish, konversiya foizi |
| Xarajatlar | Turkumlar, oy bo'yicha, taxminiy foyda (tushum − xarajat − maosh) |
| Sozlamalar | Markaz ma'lumotlari, login/parol, til, JSON zaxira/tiklash, demo ma'lumot, tozalash |

## Hisob-kitob qoidasi

O'quvchi har oy o'zi o'qiydigan **har bir guruh narxini** to'laydi (chegirma hisobga olinadi),
qo'shilgan oyidan boshlab. Faqat `Faol` holatdagi o'quvchilarga hisoblanadi.
Mantiq: `src/utils/finance.js`.

## Tuzilma

```
src/
  i18n/           # tarjima: dict.js (lug'at), index.js (t(), kirill transliteratsiya)
  store/          # StoreContext (localStorage), seed.js (demo ma'lumot)
  utils/          # format.js, finance.js
  components/     # Layout, ui (Button, Modal, ...), Icon, PaymentModal, StudentForm
  pages/          # har bir bo'lim sahifasi
  router.jsx      # hash router (#/students, #/groups/g1)
```

### Yangi tarjima qo'shish
`src/i18n/dict.js` ga `'kalit': ['lotin', 'русский']` qo'shing. Kirill avtomatik hosil bo'ladi;
noto'g'ri chiqsa uchinchi element sifatida qo'lda yozing: `['Iyun', 'Июнь', 'Июн']`.

## Keyingi qadamlar (kamchiliklar)

- Backend (Node.js + DB) va API ga ulash
- Rollar: admin, menejer, o'qituvchi, kassir
- SMS / Telegram eslatmalar (qarzdorlarga, darsdan qolganlarga)
- Haqiqiy autentifikatsiya (hozir parol localStorage'da)
- Hisobotlar: o'qituvchi bo'yicha, kurs bo'yicha, PDF/Excel
- O'quvchi guruhdan chiqqan sanani saqlash (qarz hisobini aniqlashtirish)
