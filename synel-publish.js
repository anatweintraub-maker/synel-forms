/* ════════════════════════════════════════════════════════
   synel-publish.js — פרסום (מסירה ל-Harmony)
   ────────────────────────────────────────────────────────
   נקודת אינטגרציה #4 של Form Studio.
   "פרסם" אינו מפיץ בעצמו — הוא מוסר את הגדרת הטופס ל-Harmony,
   ש-מטפל בהפצה בפועל (קישורים מוצפנים, שיוך אוכלוסיות, מעקב).

   ה-payload הוא אותו JSON ש-"ייצא JSON" מייצר (SynelExport / exportJSON
   של התבנית) — אותו חוזה בדיוק, כדי ששני המסלולים לא יתפצלו.

   שימוש: הוסף <script src="synel-publish.js"><\/script> לכל תבנית,
   ושנה את exportForm לקרוא ל-SynelPublish.publish(name [, payload]).
   ════════════════════════════════════════════════════════ */
var SynelPublish = {
  endpoint: '/api/harmony/publish',   // ← כתובת Harmony (להחלפה ע"י המפתח)
  lastPayload: null,

  publish: function (name, payload) {
    name = name || 'טופס';
    if (payload) this.lastPayload = payload;

    /* ─────────── נקודת אינטגרציה #4 — מסירה ל-Harmony ───────────
       בפרודקשן: שליחת ה-JSON הקנוני (אותו אובייקט מ-"ייצא JSON") ל-Harmony.
       Harmony מטפל מכאן בהפצה: קישורים מוצפנים, שיוך אוכלוסיות, מעקב.

         return fetch(SynelPublish.endpoint, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
         }).then(function (r) { return r.json(); });

       בפרוטוטיפ אין שרת — לכן רק מסמנים שההגדרה מוכנה למסירה.
       ──────────────────────────────────────────────────────────── */

    if (typeof toast === 'function') {
      toast('🚀 "' + name + '" מוכן לפרסום → נמסר ל-Harmony (נקודת אינטגרציה)');
    } else {
      alert('"' + name + '" מוכן לפרסום → נמסר ל-Harmony');
    }
    if (typeof console !== 'undefined' && console.log) {
      console.log('[Synel Publish] payload →', this.lastPayload || '(נבנה ע"י exportJSON של התבנית)');
    }
    return { name: name, payload: payload || null, endpoint: this.endpoint };
  }
};
console.log('[Synel Publish] Loaded');
