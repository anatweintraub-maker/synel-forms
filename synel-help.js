/* ════════════════════════════════════════════════════════
   SYNEL HELP — עוזר מובנה למייצרי טפסים
   קובץ אחד לכל המסכים. מזהה לבד באיזה דף הוא נמצא
   ומציג טיפים ושאלות שמתאימים לאותו מסך.

   שימוש: הוסף בכל קובץ, לפני </body>:
     <script src="synel-help.js"></script>
════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── זיהוי הדף הנוכחי ── */
  function pageCtx() {
    var p = location.pathname.toLowerCase();
    var f = p.substring(p.lastIndexOf('/') + 1);
    if (f === '' || f === 'index.html') return 'home';
    if (f === 'form-studio.html') return 'editor';
    if (f === 'template-upload-ocr.html') return 'ocr';
    if (f.indexOf('template-') === 0) return 'template';
    return 'home';
  }

  /* ── טיפ דינמי לפי תת-המסך ── */
  function subTip(ctx) {
    if (ctx === 'home') {
      var t = document.querySelector('.tab.active');
      var label = t ? t.textContent.replace(/[^\u0590-\u05FF ]/g, '').trim() : '';
      if (label.indexOf('בנה') >= 0) return 'בלשונית <b>בנה מאפס</b> נכנסים לעורך החופשי — כותבים טקסט וגוררים שדות.';
      if (label.indexOf('העלא') >= 0) return 'בלשונית <b>העלאת מסמך</b> מעלים טופס קיים והמערכת מזהה את השדות לבד.';
      if (label.indexOf('שמור') >= 0) return 'בלשונית <b>שמורים</b> נמצאות התבניות לשימוש חוזר.';
      return 'בחר/י <b>תבנית מוכנה</b>, <b>בנה מאפס</b>, או <b>העלאת מסמך</b> — לפי מה שנוח לך.';
    }
    if (ctx === 'editor') return 'את/ה <b>בעורך החופשי</b>. כתוב/י טקסט, גרור/י שדות מהפאנל, ולחיצה על שדה פותחת את מאפייניו.';
    if (ctx === 'ocr') {
      var s = document.querySelector('.ocr-screen.active');
      var id = s ? s.id : 'os1';
      if (id === 'os2') return 'את/ה במסך <b>אישור שדות</b>. אפשר להוסיף, למחוק, לשנות תווית/סוג ולשייך ל-DB.';
      if (id === 'os3') return 'את/ה במסך <b>הטופס הדיגיטלי</b>. אפשר לשמור כתבנית או לייצא JSON.';
      return 'את/ה במסך <b>קלט מסמך</b>. בחר/י העלאת תמונה או הדבקת טקסט (הדבקה = הכי מדויק).';
    }
    return 'זו <b>תבנית מוכנה</b>. אפשר לערוך את השדות והטקסט, ולשמור גרסה משלך לשימוש חוזר.';
  }

  /* ── מאגר שאלות ותשובות לפי הקשר ── */
  var KB = {
    home: [
      { q: 'מה ההבדל בין תבניות, בנה מאפס והעלאת מסמך?', k: 'הבדל תבניות בנה מאפס העלאה',
        a: '<b>תבניות מוכנות</b> — נקודת פתיחה מהירה למבנים נפוצים (סקר, שאלון, חוזה...).<br><b>בנה מאפס</b> — עורך חופשי שבו כותבים וגוררים שדות איך שרוצים.<br><b>העלאת מסמך</b> — מעלים טופס קיים והמערכת מזהה את השדות אוטומטית.' },
      { q: 'איזו תבנית מתאימה לי?', k: 'איזו תבנית מתאים בחירה סוג',
        a: '<b>שאלה/תשובה</b> — שאלות פתוחות.<br><b>רשימה</b> — לוז ומשימות.<br><b>שאלה מותנית</b> — כן/לא עם הסתעפויות.<br><b>סקר</b> — דירוג, NPS, בחירה.<br><b>הצגת מידע DB</b> — נתונים מהמערכת + חתימה.<br><b>Highlights</b> — חוזה לחתימה.<br><b>מידע + שאלות</b> — הבנת הנקרא.<br><b>פנסיה</b> / <b>101</b> — טפסים רשמיים.' },
      { q: 'מה זה לשונית "שמורים"?', k: 'שמורים שמירה תבניות שלי',
        a: 'מרכז התבניות לשימוש חוזר. כל טופס ששמרת ב"שמור בשם" יופיע כאן, ותוכל/י לפתוח אותו שוב בלי לבנות מחדש.' },
      { q: 'איך מתחילים להעלות מסמך קיים?', k: 'העלאה מסמך התחלה ocr',
        a: 'בלשונית <b>העלאת מסמך</b> לוחצים על הכלי, ואז בוחרים: <b>תמונה</b> (סריקה/צילום) או <b>הדבקת טקסט</b>. המערכת מזהה את השדות, ואת/ה מאשר/ת בשלב הבא.' }
    ],
    editor: [
      { q: 'איך מוסיפים שדה לטופס?', k: 'הוספה שדה גרירה פאנל',
        a: 'מהפאנל בצד גוררים שדה אל תוך הטקסט, או לוחצים עליו כדי להוסיף. השדה משתלב inline בתוך המסמך, בדיוק במקום שבחרת.' },
      { q: 'איך עורכים שדה אחרי שהוספתי?', k: 'עריכה מאפיינים תווית סוג לחיצה',
        a: 'לחיצה על שדה פותחת את פאנל <b>המאפיינים</b> מצד שני. שם משנים: תווית, סוג, placeholder, מי ממלא, ולידציה, שיוך ל-DB ועוד.' },
      { q: 'מה זה "מי ממלא"?', k: 'מי ממלא filler עובד מנהל',
        a: 'קובע מי אחראי למלא את השדה: <b>עובד</b>, <b>מנהל</b>, <b>מנהל על</b>, או <b>כולם</b>. זה עוזר לחלק טופס בין כמה גורמים.' },
      { q: 'מה זה שיוך DB / "טבלה / API"?', k: 'db שיוך טבלה api מסד נתונים',
        a: 'מקשר שדה לנתון במערכת סינל, כך שיתמלא אוטומטית (למשל שם עובד, ת.ז). אפשר גם להצביע על טבלה ושדה תצוגה לרשימות נפתחות.' },
      { q: 'מה זה "נוסחה"?', k: 'נוסחה חישוב formula',
        a: 'מאפשרת לחשב ערך משדות אחרים — למשל <code>{שכר} * 0.06</code> להפרשה פנסיונית. השדה יציג את התוצאה אוטומטית.' },
      { q: 'איך שומרים, ואיך חוזרים לגרסה קודמת?', k: 'שמירה גרסאות היסטוריה שחזור',
        a: 'העבודה נשמרת אוטומטית תוך כדי. דרך כפתור <b>הגרסאות</b> אפשר לראות עד 10 גרסאות אחרונות ולשחזר כל אחת מהן.' }
    ],
    ocr: [
      { q: 'מאיפה מתחילים? איך זה עובד?', k: 'התחלה שלבים תהליך',
        a: 'התהליך ב-3 שלבים:<br><b>1. קלט מסמך</b> — תמונה או הדבקת טקסט.<br><b>2. אישור שדות</b> — מאשרים ומתקנים את מה שזוהה.<br><b>3. טופס דיגיטלי</b> — טופס מוכן לשמירה ולשימוש חוזר.' },
      { q: 'תמונה או הדבקת טקסט — מה לבחור?', k: 'תמונה טקסט הדבקה הבדל עדיף',
        a: '<b>הדבקת טקסט</b> היא המדויקת ביותר — כל השדות יזוהו בשמות נכונים.<br><b>העלאת תמונה</b> נוחה כשיש רק סריקה — כל השדות יזוהו, אך לעיתים השמות פחות מדויקים. תמיד אפשר לתקן בשלב האישור.' },
      { q: 'הזיהוי לא מצא את כל השדות — מה עושים?', k: 'לא מצא חסר זיהוי בעיה',
        a: 'נסו <b>הדבקת טקסט</b> במקום תמונה — המדויק ביותר.<br>בכל מקרה, במסך <b>אישור שדות</b> אפשר להוסיף ידנית כל שדה חסר ולמחוק מיותרים.' },
      { q: 'מה עושים במסך "אישור שדות"?', k: 'אישור עריכה הוספה מחיקה תווית סוג',
        a: 'לכל שדה אפשר לשנות <b>תווית</b> ו<b>סוג</b>, לסמן <b>חובה</b>, <b>לשייך ל-DB</b>, או <b>למחוק</b>. למטה יש "הוסף שדה". בסיום — "אשר והמשך לטופס".' },
      { q: 'מה זה "שיוך לשדה DB"?', k: 'db שיוך מסד נתונים emp_name',
        a: 'מקשר שדה לעמודה במסד הנתונים של סינל (למשל "שם מלא" ← <b>EMP_NAME</b>), כך שהשדה יכול להתמלא אוטומטית. <b>אופציונלי</b>.' },
      { q: 'מה ההבדל בין סוגי השדות?', k: 'סוג טקסט תאריך מספר אימייל טלפון חתימה',
        a: '<b>טקסט</b> — שמות/כתובות. <b>תאריך</b> — בורר תאריך. <b>מספר</b> — סכומים/ת.ז. <b>אימייל/טלפון</b> — עם בדיקת תקינות. <b>חתימה</b> — חתימה דיגיטלית. תמיד ניתן לשינוי.' },
      { q: 'איך שומרים תבנית לשימוש חוזר?', k: 'שמירה תבנית שימוש חוזר',
        a: 'בלחיצה על <b>"שמור בשם"</b> התבנית נשמרת ותופיע בלשונית "שמורים" בדף הבית.' },
      { q: 'מה זה "ייצא JSON"?', k: 'json ייצוא קוד מפתח',
        a: 'קובץ טקסט שמתאר את מבנה הטופס (שדות, סוגים, שיוכים). שימושי להעברה למפתח או לייבוא למערכת אחרת. לא חובה.' },
      { q: 'הקריאה מהתמונה איטית או נתקעת', k: 'איטי נתקע טעינה אינטרנט',
        a: 'בפעם הראשונה מורידים את מנוע הקריאה (כמה שניות, עם אחוז התקדמות). נדרש <b>חיבור אינטרנט</b>. אם לא מצליח — השתמשו ב<b>הדבקת טקסט</b>, שעובדת תמיד.' }
    ],
    template: [
      { q: 'מה אני עושה עם התבנית הזו?', k: 'תבנית מה לעשות שימוש',
        a: 'זו נקודת פתיחה מוכנה. אפשר להתאים את הטקסט והשדות לצרכים שלך, ואז לשמור גרסה משלך או להשתמש בה כמו שהיא.' },
      { q: 'איך עורכים את השדות בתבנית?', k: 'עריכה שדות תבנית שינוי',
        a: 'כל שדה ניתן לעריכה — תווית, סוג, והאם הוא חובה. השינויים נשמרים בתבנית שלך.' },
      { q: 'איך שומרים גרסה משלי?', k: 'שמירה גרסה שמורים שלי',
        a: 'בלחיצה על "שמור בשם" התבנית נשמרת אצלך ותופיע בלשונית "שמורים" בדף הבית, לשימוש חוזר.' },
      { q: 'רוצה משהו שונה מהתבניות', k: 'שונה מאפס חופשי אחר',
        a: 'אפשר תמיד לחזור לדף הבית ולבחור <b>בנה מאפס</b> (עורך חופשי) או <b>העלאת מסמך</b> (זיהוי אוטומטי ממסמך קיים).' }
    ]
  };

  /* ── בניית הממשק ── */
  function build() {
    if (document.getElementById('fsHelpBtn')) return;
    var ctx = pageCtx();

    var style = document.createElement('style');
    style.textContent = [
      '#fsHelpBtn{position:fixed;bottom:18px;left:18px;width:52px;height:52px;border-radius:50%;background:#4F46E5;color:#fff;border:none;cursor:pointer;font-size:24px;font-weight:700;box-shadow:0 6px 20px rgba(79,70,229,.4);z-index:9000;display:flex;align-items:center;justify-content:center;transition:transform .15s;}',
      '#fsHelpBtn:hover{transform:scale(1.06);}',
      '#fsHelpPanel{position:fixed;bottom:80px;left:18px;width:340px;max-width:calc(100vw - 36px);max-height:74vh;background:#fff;border:1px solid #E5E7EB;border-radius:16px;box-shadow:0 16px 50px rgba(0,0,0,.22);z-index:9001;display:none;flex-direction:column;overflow:hidden;direction:rtl;font-family:inherit;}',
      '#fsHelpPanel.show{display:flex;}',
      '.fsh-head{background:#4F46E5;color:#fff;padding:13px 16px;display:flex;align-items:center;gap:8px;flex-shrink:0;}',
      '.fsh-head .t{font-size:14px;font-weight:700;}',
      '.fsh-head .s{font-size:11px;opacity:.85;}',
      '.fsh-x{margin-right:auto;background:rgba(255,255,255,.2);border:none;color:#fff;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1;}',
      '.fsh-tip{margin:12px;padding:10px 12px;background:#EEF2FF;border:1px solid #C7D2FE;border-radius:10px;font-size:12px;color:#3730A3;line-height:1.6;}',
      '.fsh-search{margin:0 12px 8px;}',
      '.fsh-search input{width:100%;padding:8px 11px;font-size:12px;border:1px solid #E5E7EB;border-radius:9px;font-family:inherit;outline:none;direction:rtl;}',
      '.fsh-body{flex:1;overflow-y:auto;padding:0 12px 12px;}',
      '.fsh-q{display:block;width:100%;text-align:right;padding:9px 12px;margin-bottom:6px;background:#FAFAFA;border:1px solid #E5E7EB;border-radius:9px;font-size:12.5px;font-family:inherit;color:#1a1a1a;cursor:pointer;line-height:1.4;}',
      '.fsh-q:hover{border-color:#4F46E5;background:#F5F3FF;}',
      '.fsh-ans{border:1px solid #C7D2FE;border-radius:10px;padding:11px 13px;font-size:12.5px;line-height:1.7;color:#1a1a1a;}',
      '.fsh-ans b{color:#4F46E5;}',
      '.fsh-ans code{background:#EEF2FF;color:#3730A3;padding:1px 5px;border-radius:4px;font-size:11.5px;}',
      '.fsh-ans .fsh-back{display:inline-block;margin-top:8px;font-size:11px;color:#4F46E5;cursor:pointer;background:none;border:none;font-family:inherit;padding:0;}',
      '.fsh-empty{font-size:12px;color:#9CA3AF;text-align:center;padding:16px 8px;}',
      '@media (max-width:768px){#fsHelpBtn{bottom:64px;}#fsHelpPanel{bottom:124px;}}'
    ].join('');
    document.head.appendChild(style);

    var btn = document.createElement('button');
    btn.id = 'fsHelpBtn';
    btn.setAttribute('aria-label', 'עזרה');
    btn.textContent = '?';
    btn.onclick = toggle;
    document.body.appendChild(btn);

    var panel = document.createElement('div');
    panel.id = 'fsHelpPanel';
    panel.innerHTML =
      '<div class="fsh-head"><div><div class="t">עוזר Form Studio</div>' +
      '<div class="s">מדריך ליצירת טפסים</div></div>' +
      '<button class="fsh-x" aria-label="סגור">\u2715</button></div>' +
      '<div class="fsh-tip" id="fshTip"></div>' +
      '<div class="fsh-search"><input id="fshSearch" placeholder="\uD83D\uDD0D חיפוש שאלה..."></div>' +
      '<div class="fsh-body" id="fshBody"></div>';
    document.body.appendChild(panel);

    panel.querySelector('.fsh-x').onclick = toggle;
    panel.querySelector('#fshSearch').oninput = function () { render(this.value, ctx); };

    panel._ctx = ctx;
  }

  function toggle() {
    var p = document.getElementById('fsHelpPanel');
    p.classList.toggle('show');
    if (p.classList.contains('show')) {
      document.getElementById('fshTip').innerHTML = '\uD83D\uDCA1 ' + subTip(p._ctx);
      document.getElementById('fshSearch').value = '';
      render('', p._ctx);
    }
  }

  function render(filter, ctx) {
    var body = document.getElementById('fshBody');
    body.innerHTML = '';
    var list = KB[ctx] || KB.home;
    var f = (filter || '').trim().toLowerCase();
    var shown = list.filter(function (it) {
      return !f || (it.q + ' ' + (it.k || '')).toLowerCase().indexOf(f) >= 0;
    });
    if (!shown.length) {
      body.innerHTML = '<div class="fsh-empty">לא נמצאה שאלה מתאימה.<br>נסה/י מילה אחרת.</div>';
      return;
    }
    shown.forEach(function (it) {
      var b = document.createElement('button');
      b.className = 'fsh-q';
      b.textContent = it.q;
      b.onclick = function () { answer(it, ctx); };
      body.appendChild(b);
    });
  }

  function answer(it, ctx) {
    var body = document.getElementById('fshBody');
    body.innerHTML = '';
    var d = document.createElement('div');
    d.className = 'fsh-ans';
    d.innerHTML = '<div style="font-weight:600;margin-bottom:6px;">' + it.q + '</div>' + it.a +
      '<br><button class="fsh-back">\u2039 חזרה לשאלות</button>';
    d.querySelector('.fsh-back').onclick = function () {
      document.getElementById('fshSearch').value = '';
      render('', ctx);
    };
    body.appendChild(d);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

  console.log('[Help] Loaded — context:', pageCtx());
})();
