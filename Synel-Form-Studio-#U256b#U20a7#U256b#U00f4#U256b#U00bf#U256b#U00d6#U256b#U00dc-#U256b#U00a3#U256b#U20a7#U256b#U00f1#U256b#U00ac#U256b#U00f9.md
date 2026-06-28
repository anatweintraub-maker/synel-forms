# Synel Form Studio — מדריך הטמעה למפתח

**גרסה:** 1.0 · **תאריך:** יוני 2026
**מטרת המסמך:** להסביר למפתח כיצד לחבר את מחולל הטפסים (Synel Form Studio) למערכת **Harmony** ולמסד הנתונים של סינאל.

---

## 1. מה זה המחולל, ומה התפקיד שלו

**Synel Form Studio** הוא כלי דפדפן (HTML/JS, ללא שרת) **ליצירת טפסים** דיגיטליים. הוא מאפשר:

- להעלות מסמך קיים (תמונה / PDF) ולזהות ממנו שדות אוטומטית, **או** לבנות טופס מאפס.
- לערוך ולאשר את השדות (תווית, סוג, חובה, מי ממלא, ולידציה, שיוך ל-DB, נוסחאות, רשימות).
- לשייך את הטופס לתהליך, אוכלוסיית יעד ועובד אחראי.
- לשמור את הגדרת הטופס ולייצא אותה כ-**JSON**.

### הפרדת אחריות (חשוב!)

| המחולל (Form Studio) | Harmony (מערכת סינאל) |
|---|---|
| **יוצר** את הגדרת הטופס | **מפיץ** את הטפסים לעובדים |
| מגדיר שדות, סוגים, מי ממלא, שיוך | מחזיק את העובדים, הקבוצות, האוכלוסיות |
| מפיק JSON תקני | מקבל את ה-JSON ובונה/שולח את הטופס בפועל |

> המחולל **לא** שולח טפסים ולא מנהל עובדים. הוא רק יוצר את ה"הגדרה" (definition). Harmony עושה את כל החלק התפעולי.

**מצב נוכחי:** הקבצים שמצורפים הם **אב-טיפוס עובד (prototype)** — הם מדגימים את ההתנהגות המלאה הרצויה, עם **נתוני דמו**. תפקידך כמפתח: להחליף את נתוני הדמו ונקודות החיבור בקריאות אמיתיות ל-Harmony / ל-DB.

---

## 2. מבנה הקבצים

```
synel-forms/
├── index.html                  # דף הבית — תבניות / יצירת טופס / שמורים
├── form-studio.html            # עורך "דף ריק" (WYSIWYG)
├── template-upload-ocr.html    # העלאת מסמך + זיהוי שדות (הליבה)
├── template-*.html (×10)         # תבניות מובנות (כולל "מעטפת תהליך")
│
├── synel-org.js        ← נקודת חיבור #1 (אוכלוסיות/עובדים/קבוצות)
├── synel-db.js         ← נקודת חיבור #2 (שדות DB + שליפת ערכי עובד)
├── synel-export.js     ← נקודת חיבור #3 (סכמת ה-JSON — "החוזה")
├── synel-publish.js    ← נקודת חיבור #4 (פרסום — מסירה ל-Harmony)
├── synel-assign.js     # רכיב שיוך אחיד (משתמש ב-synel-org)
├── synel-nav.js        # מעטפת ניווט אחידה (חזרה/לוגו/המשך מאוחר/חזרה לרשימה)
├── synel-brand.js      # מיתוג גלובלי (לוגו + צבע מותג → CSS var)
├── synel-help.js       # עוזר contextual
├── synel-validation.js # ולידציות (ת"ז, אימייל, טלפון...)
├── synel-autosave.js   # שמירה אוטומטית
├── synel-versions.js   # גרסאות
├── synel-mobile.js     # התאמת מובייל
└── synel-accessibility.js # נגישות
```

הרעיון המרכזי: **ארבע נקודות חיבור** מרכזות את כל הקשר ל-Harmony. שינוי בהן = שינוי בכל המסכים.

---

## 3. שלוש נקודות החיבור ל-Harmony

### נקודת חיבור #1 — `synel-org.js` (אוכלוסיות, עובדים, קבוצות)

כרגע הקובץ מכיל **מערכים קבועים של נתוני דמו**:

```javascript
var SynelOrg = {
  _isDemo: true,
  populations: [ { id:'all', name:'כל העובדים' }, ... ],
  owners:      [ { id:'hr', name:'HR' }, ... ],
  groups:      [ { id:'all', name:'כל העובדים', count:248 }, ... ],
  employees:   [ { id:'E1001', name:'ישראל ישראלי', dept:'פיתוח' }, ... ],
  // + פונקציות populate* שממלאות תפריטים
};
```

**מה לעשות:** להחליף את המערכים בקריאות API ל-Harmony. לדוגמה:

```javascript
// במקום מערך קבוע:
SynelOrg.loadPopulations = async function () {
  const res = await fetch('/api/harmony/populations');
  this.populations = await res.json(); // [{id, name}, ...]
};
SynelOrg.loadOwners = async function () {
  const res = await fetch('/api/harmony/owners');
  this.owners = await res.json();
};
SynelOrg.loadGroups = async function () {
  const res = await fetch('/api/harmony/groups');
  this.groups = await res.json(); // [{id, name, count}, ...]
};
```

> שמור על אותו **מבנה אובייקט** (`{id, name}` וכו') כדי שפונקציות ה-`populate*` והרכיבים האחרים ימשיכו לעבוד ללא שינוי.

---

### נקודת חיבור #2 — `synel-db.js` (שדות DB ושליפת ערכי עובד)

הקובץ מגדיר את כל **שדות ה-DB הזמינים** לשיוך (36 שדות), למשל:

```javascript
var SYNEL_DB_FIELDS = [
  {dbField:'EMP_NAME', labelHe:'שם מלא',      type:'text', category:'עובד', prefix:'E_'},
  {dbField:'TZ',       labelHe:'תעודת זהות',  type:'text', category:'עובד', prefix:'E_'},
  ...
];
```

הקובץ כבר כולל **שלד מסומן** לפונקציית שליפה מ-API (כרגע בהערה):

```javascript
/* ── FUTURE: FETCH FROM API ── */
// async function fetchEmployeeData(empNo){
//   const res = await fetch('/api/fnc_eHrm_getTemplateFormsEmployeeMapping?empNo=' + empNo);
//   const data = await res.json();
//   return data; // {TZ:'123456789', EMP_NAME:'ישראל ישראלי', ...}
// }
```

**מה לעשות:**
1. ודא ש-`SYNEL_DB_FIELDS` תואם לשדות האמיתיים ב-Harmony (או טען אותם דינמית מ-API).
2. ממש את `fetchEmployeeData(empNo)` מול ה-endpoint האמיתי. זה מה שממלא ערכים אוטומטית לשדות שמשויכים ל-DB (כשהמחולל מציג טופס לעובד מסוים, או כש-Harmony מאכלס ערכים).

---

### נקודת חיבור #3 — `synel-export.js` (סכמת ה-JSON — "החוזה")

זהו **הלב של החיבור**. ה-JSON הזה הוא הפורמט שבו המחולל מוסר את הגדרת הטופס ל-Harmony. כל המסכים מייצרים את אותו מבנה בדיוק.

**סכמה (schema v1.0):**

```jsonc
{
  "schemaVersion": "1.0",
  "formType": "upload-ocr",          // או template-qa, blank וכו'
  "meta": {
    "name": "חוזה שכירות",
    "docTitle": "חוזה שכירות",
    "process": "onboarding",         // תהליך
    "owner": "HR",                   // עובד אחראי
    "population": "עובדים חדשים",     // אוכלוסיית יעד
    "hasSignature": true,
    "hasReadConfirm": false,
    "createdWith": "Synel Form Studio",
    "exportedAt": "2026-06-20T10:00:00.000Z"
  },
  "source": {
    "kind": "pdf",                   // image | pdf | text | template | manual
    "pageCount": 3,
    "rawText": "..."                 // טקסט המסמך (אם רלוונטי)
  },
  "recipients": { "mode": "", "value": "" },  // group | individual (לשלב ההפצה ב-Harmony)
  "fields": [
    {
      "id": "f0",
      "label": "שם מלא",
      "type": "text",                // text|number|email|tel|date|signature|select
      "required": true,
      "placeholder": "",
      "filler": "E_",                // מי ממלא: E_=עובד, M_=מנהל, S_=מנהל-על, ""=כולם
      "validation": "",              // id|email|tel|number|date|passport
      "formula": "",                 // למשל "{שכר} * 0.06"
      "options": [],                 // לרשימות נפתחות
      "db": { "field": "EMP_NAME", "source": "harmony" },  // שיוך ל-DB (או null)
      "position": { "page": 0, "x": 100, "y": 200, "w": 150, "h": 26 }, // מיקום על התמונה (או null)
      "value": ""
    }
  ]
}
```

**מה לעשות:** זהו ה-contract. ודא ש-Harmony יודע לקרוא את המבנה הזה (במיוחד: `fields[].db.field`, `fields[].filler`, `meta.population`, `meta.owner`). אם צריך שדות נוספים — הוסף אותם לסכמה כאן, והמחולל יכלול אותם אוטומטית.

---

## 4. זרימת הנתונים (end-to-end)

```
┌─────────────────┐     JSON      ┌──────────────────┐
│  Form Studio    │ ────────────▶ │     Harmony      │
│  (יצירת טופס)    │  (הגדרת טופס)  │   (הפצה לעובדים)  │
└─────────────────┘               └──────────────────┘
        ▲                                  │
        │  שדות DB / אוכלוסיות / עובדים     │
        └──────────────────────────────────┘
                   (קריאות API)
```

1. המשתמש יוצר טופס במחולל (העלאה / מאפס).
2. בזמן השיוך והעריכה — המחולל **מושך** מ-Harmony: רשימות אוכלוסיות, עובדים, שדות DB (נקודות חיבור #1, #2).
3. המשתמש שומר → המחולל **מפיק JSON** לפי הסכמה (#3).
4. ה-JSON עובר ל-Harmony.
5. **Harmony** מפיץ את הטופס לעובדים/קבוצות ומאכלס ערכי DB.

---

## 5. החלטה פתוחה שצריך לקבל: Push או Pull?

איך ה-JSON עובר מהמחולל ל-Harmony? שתי אפשרויות — **תחליט לפי הארכיטקטורה של Harmony**:

| | Push (המחולל שולח) | Pull (Harmony מושך) |
|---|---|---|
| **איך** | המחולל קורא ל-API של Harmony עם ה-JSON | המחולל שומר את ה-JSON; Harmony קורא אותו דרך API |
| **מתאים כש** | יש endpoint ב-Harmony לקבלת טפסים | Harmony מנהל את מחזור החיים של הטפסים |
| **שינוי במחולל** | להוסיף `fetch(POST)` בכפתור השמירה | המחולל כבר שומר/מייצא — מספיק |

**הפרסום מרוכז כעת ב-`synel-publish.js` (נקודת חיבור #4).** כל כפתורי "פרסם" קוראים ל-`SynelPublish.publish(name [, payload])`, ובתוכו מסומן מקום **אחד** להזרקת הקריאה ל-Harmony (Push) — או להשארה כ-Pull אם Harmony מושך את ה-JSON שמיוצא. ה-payload הוא אותו חוזה JSON של "ייצא JSON", כדי ששני המסלולים לא יתפצלו.

---

## 6. צעדים מעשיים — Checklist למפתח

1. **הרץ את אב-הטיפוס** מקומית (פתח `index.html`) כדי לראות את הזרימה המלאה הרצויה.
2. **`synel-org.js`** — החלף את ה-4 מערכי הדמו בקריאות API ל-Harmony (אוכלוסיות, עובדים אחראים, קבוצות, עובדים).
3. **`synel-db.js`** — סנכרן את `SYNEL_DB_FIELDS` עם שדות Harmony, וממש את `fetchEmployeeData()`.
4. **`synel-export.js`** — אשר את הסכמה מול Harmony; הוסף שדות אם צריך.
5. **`synel-publish.js`** (#4) — החלט Push/Pull (סעיף 5) וממש את הקריאה ל-Harmony במקום המסומן בתוך `SynelPublish.publish`.
6. **שמירה** — כיום השמירה היא ב-`localStorage` (זמני, פר-דפדפן). החלף לשמירה אמיתית (DB / Harmony) כך שטפסים יהיו זמינים מכל מקום ולכל המשתמשים.
7. **אבטחה** — הוסף אימות (auth) לקריאות ה-API; ודא הרשאות צפייה/יצירה/שליחה.

---

## 7. הערות חשובות

- **localStorage זמני:** כל השמירות כיום הן מקומיות לדפדפן. זו נקודה שחייבת להשתנות לשמירה מרכזית.
- **קריאת תמונות/PDF:** רצה בדפדפן (Tesseract.js + PDF.js). עובדת רק מ-HTTPS / file:// (לא בתוך iframe מסוים בגלל Web Workers). ב-production מומלץ לוודא הגשה מ-HTTPS.
- **הרכיבים המשותפים** (`synel-assign`, `synel-export`, `synel-nav`, `synel-brand`, `synel-publish`, `synel-help`) נטענים בכל התבניות באמצעות `<script src="...">`, כך שהנראות וההתנהגות אחידות בכל המסכים. הוספת תבנית חדשה = הוספת אותן שורות `<script>`.
- **אב-טיפוס, לא production:** הקוד נכתב להדגמה ולתקשורת דרישות. בבנייה מחדש ב-production מומלץ framework מסודר (React/Vue וכו') תוך שמירה על אותה זרימה, אותה סכמת JSON, ואותן נקודות חיבור.

---

*מסמך זה מתאר את אב-הטיפוס Synel Form Studio ואת נקודות החיבור הנדרשות ל-Harmony. לשאלות על ההתנהגות הרצויה — הפעל את אב-הטיפוס וצפה בזרימה.*
