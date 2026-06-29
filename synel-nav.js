/* ════════════════════════════════════════════════════════
   synel-nav.js — מעטפת ניווט משותפת לכל התבניות
   ────────────────────────────────────────────────────────
   מזריק לתצוגת הטלפון של כל תבנית את אלמנטי המעטפת הקבועים:
     • פס התקדמות כתום (לפי שלב נוכחי / סה"כ)
     • שורת ניווט עליונה: חזרה ← | לוגו + שם עובד | המשך מאוחר יותר
     • "חזרה לרשימה" בתחתית (מתחת לכפתור הפעולה)

   אלה אלמנטים של *שלד* — בפרוטוטיפ הם ויזואליים בלבד;
   בפרודקשן Harmony מחווט את ההתנהגות בפועל (ניווט, שמירת התקדמות).

   שימוש: הוסף <script src="synel-nav.js"><\/script> לכל תבנית.
   המודול מאתחל את עצמו. לעדכון ערכים: SynelNav.set({...}).
   ════════════════════════════════════════════════════════ */
var SynelNav = {
  _injected: false,
  cfg: {
    employeeName: '',          // שם העובד שמוצג במרכז (ריק = מוסתר)
    stepCurrent: 1,            // שלב נוכחי (לפס ההתקדמות)
    stepTotal: 6,              // סה"כ שלבים
    showBack: true,            // כפתור "חזרה ←"
    showLater: true,           // "המשך מאוחר יותר"
    showLogo: false,           // לוגו במרכז המעטפת (כבוי — הלוגו הגדול בגוף העמוד מספיק)
    showBackList: true,        // "חזרה לרשימה"
    showProgress: true,        // פס התקדמות כתום
    logoText: 'SY',
    logoImage: '',
    backText: 'חזרה ←',
    laterText: 'המשך מאוחר יותר',
    backListText: 'חזרה לרשימה'
  },

  _injectCss: function () {
    if (document.getElementById('synel-nav-css')) return;
    var s = document.createElement('style');
    s.id = 'synel-nav-css';
    s.textContent =
      '.synel-progress{height:3px;background:rgba(0,0,0,.06);overflow:hidden;flex-shrink:0;}' +
      '.synel-progress > i{display:block;height:100%;background:var(--orange,#E8603C);transition:width .3s;}' +
      '.synel-nav{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 16px;border-bottom:1px solid var(--border,#E5E7EB);flex-shrink:0;}' +
      '.synel-nav .sn-side{display:flex;align-items:center;gap:6px;min-width:64px;}' +
      '.synel-nav .sn-side.end{justify-content:flex-end;}' +
      '.synel-nav .sn-link{font-size:12px;color:var(--orange,#E8603C);cursor:pointer;background:none;border:none;font-family:inherit;padding:0;white-space:nowrap;}' +
      '.synel-nav .sn-link:hover{text-decoration:underline;}' +
      '.synel-nav .sn-center{display:flex;align-items:center;gap:7px;}' +
      '.synel-nav .sn-logo{width:24px;height:24px;border-radius:50%;background:var(--orange,#E8603C);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;letter-spacing:.3px;}' +
      '.synel-nav .sn-name{font-size:13px;font-weight:600;color:var(--text,#1a1a1a);}' +
      '.synel-backlist{padding:0 16px 16px;text-align:center;flex-shrink:0;}' +
      '.synel-backlist button{font-size:13px;color:var(--text2,#6B7280);background:none;border:none;font-family:inherit;cursor:pointer;padding:6px;}' +
      '.synel-backlist button:hover{color:var(--orange,#E8603C);}';
    document.head.appendChild(s);
  },

  _build: function (wrap) {
    if (wrap.getAttribute('data-synel-nav') === '1') return;
    wrap.setAttribute('data-synel-nav', '1');
    var c = this.cfg;

    var bar = wrap.querySelector('.phone-bar, .top-bar');

    // 1) פס התקדמות כתום — מיד אחרי שורת הסטטוס (או בראש המעטפת)
    //    דילוג אם כבר קיים פס התקדמות בתבנית (למשל .progress ב-template-101) למניעת כפילות
    if (c.showProgress && !wrap.querySelector('.progress, .progress-fill, .synel-progress')) {
      var prog = document.createElement('div');
      prog.className = 'synel-progress';
      var fill = document.createElement('i');
      var pct = c.stepTotal > 0 ? Math.round((c.stepCurrent / c.stepTotal) * 100) : 0;
      fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
      prog.appendChild(fill);
      if (bar && bar.parentNode === wrap) bar.insertAdjacentElement('afterend', prog);
      else wrap.insertBefore(prog, wrap.firstChild);
    }

    // 2) שורת ניווט: חזרה ← (ימין) | לוגו + שם (מרכז) | המשך מאוחר יותר (שמאל)
    var nav = document.createElement('div');
    nav.className = 'synel-nav';

    var right = document.createElement('div');
    right.className = 'sn-side';
    if (c.showBack) {
      var back = document.createElement('button');
      back.className = 'sn-link';
      back.textContent = c.backText;
      back.title = 'ניווט אחורה (מנוהל ע"י Harmony)';
      right.appendChild(back);
    }

    var center = document.createElement('div');
    center.className = 'sn-center';
    if (c.showLogo) {
      var logo = document.createElement('span');
      logo.className = 'sn-logo';
      if (c.logoImage) {
        logo.style.background = 'transparent';
        var im = document.createElement('img');
        im.src = c.logoImage;
        im.alt = 'logo';
        im.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:50%;';
        logo.appendChild(im);
      } else {
        logo.textContent = c.logoText;
      }
      center.appendChild(logo);
    }
    if (c.employeeName) {
      var nm = document.createElement('span');
      nm.className = 'sn-name';
      nm.textContent = c.employeeName;
      center.appendChild(nm);
    }

    var left = document.createElement('div');
    left.className = 'sn-side end';
    if (c.showLater) {
      var later = document.createElement('button');
      later.className = 'sn-link';
      later.textContent = c.laterText;
      later.title = 'שמירת התקדמות והמשך מאוחר יותר (מנוהל ע"י Harmony)';
      left.appendChild(later);
    }

    nav.appendChild(right);
    nav.appendChild(center);
    nav.appendChild(left);

    var progEl = wrap.querySelector('.synel-progress');
    if (progEl) progEl.insertAdjacentElement('afterend', nav);
    else if (bar && bar.parentNode === wrap) bar.insertAdjacentElement('afterend', nav);
    else wrap.insertBefore(nav, wrap.firstChild);

    // 3) "חזרה לרשימה" אחיד בתחתית — מסתיר כל גרסת inline קיימת (pv-back / back-link / טקסט זהה) למניעת כפילות
    if (c.showBackList) {
      var olds = wrap.querySelectorAll('.pv-back, .back-link');
      for (var k = 0; k < olds.length; k++) olds[k].style.display = 'none';
      // גיבוי: כל אלמנט-עלה עם בדיוק הטקסט "חזרה לרשימה" (חוץ מזה של המודול)
      var leaves = wrap.querySelectorAll('span, a, button, div');
      for (var m2 = 0; m2 < leaves.length; m2++) {
        var le = leaves[m2];
        if (le.className && ('' + le.className).indexOf('synel-backlist') >= 0) continue;
        if (le.children.length === 0 && le.textContent.trim() === (c.backListText || '').trim()) le.style.display = 'none';
      }
      var bl = document.createElement('div');
      bl.className = 'synel-backlist';
      var btn = document.createElement('button');
      btn.textContent = c.backListText;
      btn.title = 'חזרה לרשימת השלבים (מנוהל ע"י Harmony)';
      bl.appendChild(btn);
      wrap.appendChild(bl); // sibling אחרי הפוטר — שורד רינדור מחדש של תוכן/פוטר
    }
  },

  _injectPanel: function () {
    var panel = document.querySelector('.editor-panel, .ep');
    if (!panel || document.getElementById('synel-nav-panel')) return;
    var c = this.cfg;
    function esc(v){return (''+(v||'')).replace(/"/g,'&quot;');}
    function block(id,label,txtId,txtVal,show){
      return '<div style="margin-bottom:10px;">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">'
        +   '<span style="font-size:12px;color:#374151;">'+label+'</span>'
        +   '<input type="checkbox" id="'+id+'" '+(show?'checked':'')+' style="width:16px;height:16px;cursor:pointer;">'
        + '</div>'
        + '<input id="'+txtId+'" value="'+esc(txtVal)+'" style="width:100%;padding:6px 10px;font-size:12px;border:1px solid #E5E7EB;border-radius:8px;font-family:inherit;outline:none;box-sizing:border-box;">'
        + '</div>';
    }
    var sec = document.createElement('div');
    sec.id = 'synel-nav-panel';
    sec.style.cssText = 'border-top:1px solid #E5E7EB;margin-top:14px;padding-top:14px;padding-bottom:8px;';
    sec.innerHTML =
      '<div style="font-size:12px;font-weight:700;color:#6B7280;margin-bottom:4px;">ניווט (מעטפת אחידה)</div>'
      + '<div style="font-size:11px;color:#9CA3AF;margin-bottom:10px;">משותף לכל הטפסים. כבה/שנה טקסט — מתעדכן בתצוגה.</div>'
      + block('snBack','כפתור "חזרה ←" (עליון)','snBackTxt',c.backText,c.showBack)
      + block('snLater','"המשך מאוחר יותר" (עליון)','snLaterTxt',c.laterText,c.showLater)
      + block('snBackList','"חזרה לרשימה" (תחתון)','snBackListTxt',c.backListText,c.showBackList);
    panel.appendChild(sec);
    function bind(){
      SynelNav.set({
        showBack: document.getElementById('snBack').checked,
        backText: document.getElementById('snBackTxt').value,
        showLater: document.getElementById('snLater').checked,
        laterText: document.getElementById('snLaterTxt').value,
        showBackList: document.getElementById('snBackList').checked,
        backListText: document.getElementById('snBackListTxt').value
      });
    }
    ['snBack','snLater','snBackList'].forEach(function(id){var el=document.getElementById(id);if(el)el.onchange=bind;});
    ['snBackTxt','snLaterTxt','snBackListTxt'].forEach(function(id){var el=document.getElementById(id);if(el)el.oninput=bind;});
  },

  _bsActions: function (name) {
    name = name || '';
    var MAP = [
      ['101', ['פרטי השכר והניכויים נקלטו במערכת','נשלח לאישור מחלקת השכר','עודכן הסטטוס בתיק האונבורדינג']],
      ['חוזה', ['החוזה החתום נשמר בתיק העובד','נשלח עותק למחלקת הכספים','עודכן הסטטוס בתיק האונבורדינג']],
      ['סעיף 14', ['ההסדר הפנסיוני נרשם בתיק העובד','נשלח עדכון למחלקת השכר']],
      ['נהלי', ['נרשם אישור קריאת הנהלים','עודכן הסטטוס בתיק האונבורדינג']],
      ['קבלת ציוד', ['נרשמה קבלת הציוד במלאי','נשלחה הודעה לצוות ה-IT','עודכן הסטטוס בתיק האונבורדינג']],
      ['החזרת ציוד', ['עודכן מלאי הציוד שהוחזר','נסגרו הרשאות הגישה למערכות','עודכן תיק העזיבה']],
      ['פנסיה', ['נפתח תיק פנסיה','נשלח עדכון למחלקת הכספים','עודכן הסטטוס בתיק האונבורדינג']],
      ['רשימת קליטה', ['עודכנה התקדמות הקליטה','נשלחו תזכורות לטפסים שטרם הושלמו']],
      ['יום אחרון', ['עודכן לוח הזמנים ביומן העובד','נשלחו הזמנות לפגישות הסיום','עודכן תיק העזיבה']],
      ['ראיון עזיבה', ['התשובות נשמרו לניתוח של HR','עודכן תיק העזיבה']],
      ['161', ['נתוני גמר החשבון נשלחו למחלקת השכר','נוצר מסמך 161 רשמי','עודכן תיק העזיבה']],
      ['חפיפה', ['ההערות הועברו למחליף/ה','נשלח עדכון למנהל הישיר','עודכן תיק העזיבה']],
      ['המלצה', ['נשלחה בקשה למנהל הישיר','נפתחה משימה במערכת','יישלח עדכון כשהמכתב יהיה מוכן']]
    ];
    for (var i = 0; i < MAP.length; i++) { if (name.indexOf(MAP[i][0]) >= 0) return MAP[i][1]; }
    return ['הנתונים נשמרו במערכת Harmony', 'עודכן תיק העובד'];
  },

  _injectBackstage: function () {
    // אם התבנית כבר כוללת backstage משלה (פנסיה) — לא מזריקים כדי למנוע כפילות
    if (document.querySelector('.backstage')) return;
    var wrap = document.querySelector('.phone-wrap, .phone');
    if (!wrap || document.getElementById('synel-backstage-box')) return;
    var box = document.createElement('div');
    box.id = 'synel-backstage-box';
    box.style.cssText = 'width:375px;max-width:100%;background:#1e1b2e;border-radius:16px;padding:14px 16px;margin-top:14px;box-sizing:border-box;';
    box.innerHTML =
      '<div style="font-size:12px;font-weight:600;color:#C7C3E0;margin-bottom:10px;display:flex;align-items:center;gap:7px;">'
      + '<span style="width:7px;height:7px;border-radius:50%;background:#A78BFA;display:inline-block;"></span>'
      + 'מה קורה ברקע · לא מוצג לעובד</div>'
      + '<div id="synel-backstage-list"></div>';
    wrap.insertAdjacentElement('afterend', box);
  },

  _updateBackstage: function () {
    var list = document.getElementById('synel-backstage-list');
    if (!list) return;
    var nameEl = document.getElementById('fName');
    var name = nameEl ? nameEl.value : '';
    var acts = this._bsActions(name);
    var html = '';
    for (var i = 0; i < acts.length; i++) {
      html += '<div style="display:flex;align-items:center;gap:9px;font-size:12px;color:#E5E3F0;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:9px 12px;margin-bottom:6px;">'
        + '<span style="width:18px;height:18px;border-radius:50%;background:#2D7A4F;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;">\u2713</span>'
        + '<span>' + acts[i] + '</span></div>';
    }
    list.innerHTML = html;
  },

  _sigEnsure: function (cb) {
    if (typeof window.SynelSignature !== 'undefined') { cb(); return; }
    var ex = document.getElementById('synel-sig-dyn');
    if (ex) { ex.addEventListener('load', cb); return; }
    var sc = document.createElement('script');
    sc.id = 'synel-sig-dyn'; sc.src = 'synel-signature.js';
    sc.onload = function () { cb(); };
    document.head.appendChild(sc);
  },

  _enhanceSignatures: function () {
    var self = this;
    var cans = document.querySelectorAll('.phone-wrap canvas, .phone canvas');
    for (var i = 0; i < cans.length; i++) {
      (function (canvas) {
        if (canvas.getAttribute('data-ssig')) return;
        canvas.setAttribute('data-ssig', '1');
        canvas.style.cursor = 'pointer';
        function openBig(ev) {
          if (ev) { ev.preventDefault(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
          if (Date.now() - (self._sigLastOpen || 0) < 500) return;
          self._sigLastOpen = Date.now();
          var nm = (document.getElementById('fName') || {}).value || '';
          self._sigEnsure(function () {
            if (typeof window.SynelSignature === 'undefined') return;
            window.SynelSignature.open({ title: 'חתימה דיגיטלית', signer: nm }, function (result) {
              if (!result || !result.image) return;
              var img = new Image();
              img.onload = function () {
                try { var ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); } catch (e) {}
              };
              img.src = result.image;
              canvas.classList.add('signed');
            });
          });
        }
        canvas.addEventListener('pointerdown', openBig, true);
        canvas.addEventListener('mousedown', openBig, true);
        canvas.addEventListener('touchstart', openBig, true);
      })(cans[i]);
    }
  },

  _watchSignatures: function () {
    var self = this;
    var host = document.querySelector('.phone-content') || document.getElementById('pvContent') || document.querySelector('.phone-wrap') || document.querySelector('.phone') || document.body;
    this._enhanceSignatures();
    if (host && !this._sigObserver) {
      this._sigObserver = new MutationObserver(function () { self._enhanceSignatures(); });
      this._sigObserver.observe(host, { childList: true, subtree: true });
    }
  },

  apply: function () {
    this._injectCss();
    if (typeof SynelBrand !== 'undefined' && SynelBrand.get) {
      var b = SynelBrand.get();
      this.cfg.logoText = b.logoText || this.cfg.logoText;
      this.cfg.logoImage = b.logoImage || '';
    }
    var wraps = document.querySelectorAll('.phone-wrap, .phone');
    for (var i = 0; i < wraps.length; i++) this._build(wraps[i]);
    this._injected = true;
    try { this._injectPanel(); } catch (e) {}
    try {
      this._injectBackstage(); this._updateBackstage();
      var self = this;
      var fn = document.getElementById('fName');
      if (fn) fn.addEventListener('input', function(){ self._updateBackstage(); });
      setTimeout(function(){ self._injectBackstage(); self._updateBackstage(); }, 700);
      this._watchSignatures();
      setTimeout(function(){ self._watchSignatures(); }, 700);
    } catch (e) {}
  },

  /* עדכון ערכים (שם עובד, התקדמות) — בונה מחדש את המעטפת */
  set: function (opts) {
    opts = opts || {};
    for (var k in opts) if (opts.hasOwnProperty(k)) this.cfg[k] = opts[k];
    var wraps = document.querySelectorAll('.phone-wrap, .phone');
    for (var i = 0; i < wraps.length; i++) {
      var w = wraps[i];
      var old;
      while ((old = w.querySelector('.synel-progress, .synel-nav, .synel-backlist'))) old.remove();
      w.removeAttribute('data-synel-nav');
      this._build(w);
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { SynelNav.apply(); });
} else {
  SynelNav.apply();
}
console.log('[Synel Nav] Loaded');
