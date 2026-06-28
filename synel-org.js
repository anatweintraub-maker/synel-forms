/* ════════════════════════════════════════════════════════
   SYNEL ORG — נתוני ארגון (זמני!)
   ────────────────────────────────────────────────────────
   ⚠️  נתוני דמו בלבד — להחלפה בנתונים אמיתיים מ-Harmony.
   המפתח: החלף את המערכים כאן (או את הפונקציות) בקריאות API
   ל-Harmony. כל המסכים מושכים מכאן, אז שינוי כאן = שינוי בכל מקום.

   שימוש: <script src="synel-org.js"></script>
════════════════════════════════════════════════════════ */
var SynelOrg = {

  _isDemo: true, // סימון שאלה נתוני דמו

  /* אוכלוסיות יעד — למי הטופס מיועד */
  populations: [
    { id: 'all',         name: 'כל העובדים' },
    { id: 'new_hires',   name: 'עובדים חדשים' },
    { id: 'dept_rnd',    name: 'מחלקת פיתוח' },
    { id: 'dept_sales',  name: 'מחלקת מכירות' },
    { id: 'dept_hr',     name: 'משאבי אנוש' },
    { id: 'managers',    name: 'מנהלים' },
    { id: 'leaving',     name: 'עובדים בסיום העסקה' }
  ],

  /* עובדים אחראים — מי אחראי על הטופס */
  owners: [
    { id: 'hr',        name: 'HR' },
    { id: 'manager',   name: 'מנהל ישיר' },
    { id: 'it',        name: 'IT' },
    { id: 'payroll',   name: 'חשב שכר' },
    { id: 'welfare',   name: 'רווחה' }
  ],

  /* קבוצות לשליחה */
  groups: [
    { id: 'all',        name: 'כל העובדים',        count: 248 },
    { id: 'rnd',        name: 'פיתוח',             count: 42 },
    { id: 'sales',      name: 'מכירות',            count: 31 },
    { id: 'new_2026',   name: 'מצטרפי 2026',       count: 17 }
  ],

  /* עובדים בודדים (לשליחה ליחיד) */
  employees: [
    { id: 'E1001', name: 'ישראל ישראלי',  dept: 'פיתוח' },
    { id: 'E1002', name: 'דנה כהן',         dept: 'מכירות' },
    { id: 'E1003', name: 'מאיה לוי',        dept: 'HR' },
    { id: 'E1004', name: 'יוסי מזרחי',      dept: 'IT' },
    { id: 'E1005', name: 'נועה פרידמן',     dept: 'פיתוח' }
  ],

  /* ── עוזרים לבניית תפריטים ── */
  fillSelect: function (sel, list, placeholder, valueKey, labelKey) {
    if (!sel) return;
    valueKey = valueKey || 'id'; labelKey = labelKey || 'name';
    sel.innerHTML = '';
    if (placeholder) {
      var o = document.createElement('option');
      o.value = ''; o.textContent = placeholder; sel.appendChild(o);
    }
    list.forEach(function (item) {
      var o = document.createElement('option');
      o.value = item[valueKey];
      o.textContent = item[labelKey] + (typeof item.count === 'number' ? ' (' + item.count + ')' : '');
      sel.appendChild(o);
    });
  },

  populateOwner:      function (sel) { this.fillSelect(sel, this.owners, '— עובד אחראי —'); },
  populatePopulation: function (sel) { this.fillSelect(sel, this.populations, '— אוכלוסיית יעד —'); },
  populateGroups:     function (sel) { this.fillSelect(sel, this.groups, '— בחר קבוצה —'); },
  populateEmployees:  function (sel) { this.fillSelect(sel, this.employees, '— בחר עובד —'); },

  nameById: function (list, id) {
    var hit = (this[list] || []).find(function (x) { return x.id === id; });
    return hit ? hit.name : '';
  }
};

console.log('[Synel Org] Loaded — DEMO data (replace with Harmony)');
