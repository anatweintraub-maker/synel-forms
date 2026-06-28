/* ════════════════════════════════════════════════════════
   SYNEL HARMONY — DB FIELD MAPPING
   fnc_eHrm_getTemplateFormsEmployeeMapping
   
   שימוש: הוסף <script src="synel-db.js"></script> לכל תבנית
   עדכון: שנה קובץ זה בלבד — כל התבניות מתעדכנות
════════════════════════════════════════════════════════ */

var SYNEL_DB_FIELDS = [

  /* ── פרטי עובד ── */
  {dbField:'EMP_NO',               labelHe:'מספר עובד',           type:'text',   category:'עובד',      prefix:'E_', readonly:true},
  {dbField:'EMP_NAME',             labelHe:'שם מלא',              type:'text',   category:'עובד',      prefix:'E_'},
  {dbField:'EMP_FIRST_NAME',       labelHe:'שם פרטי',             type:'text',   category:'עובד',      prefix:'E_'},
  {dbField:'EMP_LAST_NAME',        labelHe:'שם משפחה',            type:'text',   category:'עובד',      prefix:'E_'},
  {dbField:'TZ',                   labelHe:'תעודת זהות',          type:'text',   category:'עובד',      prefix:'E_'},
  {dbField:'EMP_PASSPORTNO',       labelHe:'מספר דרכון',          type:'text',   category:'עובד',      prefix:'E_'},
  {dbField:'EMP_BIRTH_DAY',        labelHe:'תאריך לידה',          type:'date',   category:'עובד',      prefix:'E_'},
  {dbField:'EMP_MARITAL_STATUS',   labelHe:'מצב משפחתי',          type:'text',   category:'עובד',      prefix:'E_'},

  /* ── תפקיד ומחלקה ── */
  {dbField:'EMP_JOB_CODE',         labelHe:'קוד תפקיד',           type:'text',   category:'תפקיד',     prefix:'E_'},
  {dbField:'EMP_JOB_DESCR',        labelHe:'תיאור תפקיד',         type:'text',   category:'תפקיד',     prefix:'E_'},
  {dbField:'EMP_DEPARTMENT_CODE',  labelHe:'קוד מחלקה',           type:'text',   category:'תפקיד',     prefix:'E_'},
  {dbField:'EMP_DEPARTMENT_DESCR', labelHe:'שם מחלקה',            type:'text',   category:'תפקיד',     prefix:'E_'},
  {dbField:'EMP_SECTION_CODE',     labelHe:'קוד ענף',             type:'text',   category:'תפקיד',     prefix:'E_'},
  {dbField:'EMP_SECTION_DESCR',    labelHe:'שם ענף',              type:'text',   category:'תפקיד',     prefix:'E_'},

  /* ── תאריכים ── */
  {dbField:'EMP_DATE_START',       labelHe:'תאריך תחילת עבודה',   type:'date',   category:'תאריכים',   prefix:'E_'},
  {dbField:'EMP_DATE_START_DD',    labelHe:'יום תחילה',           type:'text',   category:'תאריכים',   prefix:'E_'},
  {dbField:'EMP_DATE_START_MM',    labelHe:'חודש תחילה',          type:'text',   category:'תאריכים',   prefix:'E_'},
  {dbField:'EMP_DATE_START_YYYY',  labelHe:'שנת תחילה',           type:'text',   category:'תאריכים',   prefix:'E_'},
  {dbField:'DATE_CURRENT',         labelHe:'תאריך נוכחי',         type:'date',   category:'תאריכים',   readonly:true},
  {dbField:'DATE_START',           labelHe:'תאריך התחלה',         type:'date',   category:'תאריכים',   prefix:'E_'},

  /* ── פרטי קשר ── */
  {dbField:'EMP_CONTACT_001',      labelHe:'טלפון בית',           type:'tel',    category:'קשר',       prefix:'E_'},
  {dbField:'EMP_CONTACT_002',      labelHe:'אימייל',              type:'email',  category:'קשר',       prefix:'E_'},
  {dbField:'EMP_CONTACT_003',      labelHe:'פקס',                 type:'tel',    category:'קשר',       prefix:'E_'},
  {dbField:'EMP_CONTACT_004',      labelHe:'נייד',                type:'tel',    category:'קשר',       prefix:'E_'},
  {dbField:'EMP_CONTACT_005',      labelHe:'כתובת',               type:'text',   category:'קשר',       prefix:'E_'},
  {dbField:'EMP_CONTACT_006',      labelHe:'עיר',                 type:'text',   category:'קשר',       prefix:'E_'},

  /* ── מנהל ── */
  {dbField:'MNG_NO',               labelHe:'מספר מנהל',           type:'text',   category:'מנהל',      readonly:true},
  {dbField:'MNG_NAME',             labelHe:'שם מנהל',             type:'text',   category:'מנהל',      readonly:true},

  /* ── מעסיק ── */
  {dbField:'EMP_TIK_NIKUIM_ID',    labelHe:'תיק ניכויים',         type:'text',   category:'מעסיק',     readonly:true},
  {dbField:'EMP_TIK_NIKUIM_DESCR', labelHe:'שם תיק ניכויים',      type:'text',   category:'מעסיק',     readonly:true},

  /* ── שכר (ממולא ע"י מנהל/שכר) ── */
  {dbField:'NUM_SALARY',           labelHe:'שכר חודשי',           type:'currency',category:'שכר',      prefix:'M_'},
  {dbField:'NUM_HOURS',            labelHe:'שעות עבודה',          type:'number', category:'שכר',       prefix:'M_'},
  {dbField:'NUM_VACATION_DAYS',    labelHe:'ימי חופשה',           type:'number', category:'שכר',       prefix:'M_'},
  {dbField:'TXT_BENEFITS',         labelHe:'תנאים סוציאליים',      type:'text',   category:'שכר',       prefix:'M_'},
  {dbField:'NUM_BANK_NO',          labelHe:'מספר חשבון בנק',      type:'number', category:'שכר',       prefix:'E_'},
  {dbField:'TXT_BANK_NAME',        labelHe:'שם בנק',              type:'text',   category:'שכר',       prefix:'E_'},

];

/* ── LOOKUP ── */
var SYNEL_DB_MAP = {};
SYNEL_DB_FIELDS.forEach(function(f){ SYNEL_DB_MAP[f.dbField] = f; });

/* ── BUILD DROPDOWN ── */
function buildDBDropdown(currentValue, onChangeFn){
  var sel = document.createElement('select');
  sel.style.cssText = 'flex:1;padding:4px 6px;font-size:11px;border:1px solid #C7D2FE;border-radius:6px;font-family:inherit;outline:none;background:#EEF2FF;color:#4338CA;';

  var empty = document.createElement('option');
  empty.value=''; empty.textContent='— בחר שדה DB —';
  sel.appendChild(empty);

  var cats = {};
  SYNEL_DB_FIELDS.forEach(function(f){
    if(!cats[f.category]) cats[f.category]=[];
    cats[f.category].push(f);
  });

  Object.keys(cats).forEach(function(cat){
    var og = document.createElement('optgroup');
    og.label = cat;
    cats[cat].forEach(function(f){
      var o = document.createElement('option');
      o.value = f.dbField;
      o.textContent = f.labelHe + ' — ' + f.dbField;
      if(f.dbField === currentValue) o.selected = true;
      og.appendChild(o);
    });
    sel.appendChild(og);
  });

  sel.onchange = function(){
    var chosen = this.value;
    var meta = SYNEL_DB_MAP[chosen];
    onChangeFn(chosen, meta);
  };
  return sel;
}

/* ── GET DISPLAY VALUE ── */
function getSynelDisplayValue(dbField, demoValues){
  if(demoValues && demoValues[dbField]) return demoValues[dbField];
  var meta = SYNEL_DB_MAP[dbField];
  return meta ? '{{'+meta.labelHe+'}}' : '{{'+dbField+'}}';
}

/* ── FUTURE: FETCH FROM API ── */
// async function fetchEmployeeData(empNo){
//   const res = await fetch('/api/fnc_eHrm_getTemplateFormsEmployeeMapping?empNo='+empNo);
//   const data = await res.json();
//   return data; // {TZ: '123456789', EMP_NAME: 'ישראל ישראלי', ...}
// }


/* Filler options - who fills each field */
var SYNEL_FILLERS = [
  {value:'E_', label:'עובד',      color:'#ECFDF5', textColor:'#065F46'},
  {value:'M_', label:'מנהל',      color:'#FEF3C7', textColor:'#92400E'},
  {value:'S_', label:'מנהל על',   color:'#FEE2E2', textColor:'#991B1B'},
  {value:'',   label:'כולם',      color:'#F3F4F6', textColor:'#374151'},
];

function buildFillerSelect(currentVal, onChangeFn){
  var sel = document.createElement('select');
  sel.style.cssText = 'padding:4px 6px;font-size:11px;border:1px solid #E5E7EB;border-radius:6px;font-family:inherit;outline:none;background:white;';
  SYNEL_FILLERS.forEach(function(opt){
    var o = document.createElement('option');
    o.value = opt.value;
    o.textContent = opt.label;
    if(opt.value === (currentVal||'E_')) o.selected = true;
    sel.appendChild(o);
  });
  sel.onchange = function(){ onChangeFn(this.value); };
  return sel;
}

function getFillerBadgeHTML(filler){
  var f = SYNEL_FILLERS.find(function(x){return x.value===filler;});
  if(!f||!filler) return '';
  return '<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:'+f.color+';color:'+f.textColor+';">'+f.label+'</span>';
}

console.log('[Synel DB] Loaded '+SYNEL_DB_FIELDS.length+' field definitions');
