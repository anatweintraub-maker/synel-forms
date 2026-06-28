/* ════════════════════════════════════════════════════════
   SYNEL EXPORT — פורמט JSON אחיד לכל המסכים
   מייצר "הגדרת טופס" קנונית, מוכנה לסנכרון ל-Harmony.

   שימוש בכל מסך:
     <script src="synel-export.js"></script>
   ואז במקום קוד ייצוא מקומי:
     SynelExport.download({ formType:'...', fields:[...], meta:{...} });

   המבנה זהה בכל המסכים — כך שהמפתח מקבל פורמט עקבי תמיד.
════════════════════════════════════════════════════════ */
var SynelExport = {

  SCHEMA_VERSION: '1.0',

  /* בונה את אובייקט הגדרת-הטופס הקנוני */
  build: function (opts) {
    opts = opts || {};
    var meta = opts.meta || {};
    var fields = (opts.fields || []).map(function (f, i) {
      return SynelExport.normField(f, i);
    });
    return {
      schemaVersion: SynelExport.SCHEMA_VERSION,
      formType: opts.formType || 'unknown',
      meta: {
        name: meta.name || '',
        docTitle: meta.docTitle || meta.name || '',
        process: meta.process || '',          // תהליך
        owner: meta.owner || '',              // עובד אחראי
        population: meta.population || '',     // אוכלוסיית יעד
        hasSignature: !!meta.hasSignature,
        hasReadConfirm: !!meta.hasReadConfirm,
        createdWith: 'Synel Form Studio',
        exportedAt: new Date().toISOString()
      },
      source: {
        kind: (opts.source && opts.source.kind) || 'manual',  // image | pdf | text | template | manual
        pageCount: (opts.source && opts.source.pageCount) || 1,
        rawText: (opts.source && opts.source.rawText) || ''
      },
      recipients: opts.recipients || { mode: '', value: '' }, // group | individual (לשלב השליחה)
      flow: opts.flow ? SynelExport.normFlow(opts.flow) : null, // מעטפת תהליך: פתיחה/מקדים/סיום (או null לטופס רגיל)
      fields: fields
    };
  },

  /* ── מנרמל "מעטפת תהליך" (Onboarding / Offboarding) ──
     תוספת לסכמה v1.0 — תוספתית ותואמת לאחור.
     מתארת את עמודי המעטפת שעוטפים את כל המסע: מקדים → פתיחה → [טפסים] → סיום.
     Harmony משתמש בזה כדי להציג את מסכי הפתיחה/הסיום לעובד. */
  normFlow: function (fl) {
    fl = fl || {};
    var prelim = fl.preliminary;
    var intro  = fl.intro  || {};
    var outro  = fl.outro  || {};
    return {
      processType: fl.processType || 'onboarding',   // onboarding | offboarding

      // עמוד מקדים (למשל בחירת מגדר לצורך פנייה נכונה). null = מושבת.
      preliminary: (prelim && prelim.enabled !== false) ? {
        kind: prelim.kind || 'gender',               // gender | custom
        title: prelim.title || '',
        question: prelim.question || '',
        options: (prelim.options || []).map(function (o) {
          return { value: o.value || '', label: o.label || '', emoji: o.emoji || '' };
        }),
        buttonText: prelim.buttonText || 'המשך ←',
        // התשובה כאן נשמרת ומחזיקה את אופן הפנייה בכל המסכים שאחריו
        bindsTo: prelim.bindsTo || 'addressing'
      } : null,

      // עמוד פתיחה (welcome)
      intro: {
        greeting: intro.greeting || '',              // תומך ב-{{שדה DB}}
        emoji: intro.emoji || '',
        subtitle: intro.subtitle || '',
        details: (intro.details || []).map(function (d) {
          return { label: d.label || '', dbField: d.dbField || '', value: d.value || '' };
        }),
        durationNote: intro.durationNote || '',
        buttonText: intro.buttonText || 'מתחילים ←'
      },

      // עמוד סיום (completion)
      outro: {
        icon: outro.icon || 'check',                 // check | none
        headline: outro.headline || '',              // תומך ב-{{שדה DB}}
        emoji: outro.emoji || '',
        subtitle: outro.subtitle || '',
        nextStepsTitle: outro.nextStepsTitle || 'מה הלאה?',
        nextSteps: (outro.nextSteps || []).filter(Boolean),
        summaryButton: outro.summaryButton || '',
        links: (outro.links || []).map(function (l) {
          return { label: l.label || '', sub: l.sub || '', url: l.url || '', icon: l.icon || '🔗' };
        })
      }
    };
  },

  /* מנרמל שדה בודד למבנה אחיד */
  normField: function (f, i) {
    f = f || {};
    return {
      id: f.id || ('f' + i),
      label: f.label || ('שדה ' + (i + 1)),
      type: f.type || 'text',                 // text|number|email|tel|date|signature|select
      required: !!f.required,
      placeholder: f.placeholder || '',
      filler: (typeof f.filler !== 'undefined') ? f.filler : 'E_',  // E_|M_|S_|''
      validation: f.validation || '',
      formula: f.formula || '',
      options: Array.isArray(f.options) ? f.options : [],
      db: f.dbField ? { field: f.dbField, source: 'harmony' } : null,
      position: f.position || null,           // {page,x,y,w,h} — אם הוגדר מיקום על תמונה
      value: (typeof f.value !== 'undefined') ? f.value : ''
    };
  },

  /* מחזיר מחרוזת JSON יפה */
  toString: function (opts) {
    return JSON.stringify(SynelExport.build(opts), null, 2);
  },

  /* מוריד קובץ JSON */
  download: function (opts) {
    var data = SynelExport.build(opts);
    var fname = (data.meta.name || data.formType || 'form').replace(/\s+/g, '_') + '.json';
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof toast === 'function') toast('JSON יוצא: ' + fname);
    return data;
  }
};

console.log('[Synel Export] Loaded — schema ' + SynelExport.SCHEMA_VERSION);
