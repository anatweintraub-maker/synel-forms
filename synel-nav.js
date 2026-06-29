/* synel-nav v12 — fix: signature unlocks after reading doc (חוזה/סעיף 14) */
/* ===== רכיב חתימה דיגיטלית מוטמע (מוגן) — מבטיח שהמודאל זמין בכל הטפסים ===== */
if (typeof window.SynelSignature === 'undefined') {
(function(){
/* SYNEL DIGITAL SIGNATURE
   משטח חתימה דיגיטלית כבילה — משותף לכל הטפסים שדורשים חתימה.
   Add to template: <script src="synel-signature.js"><\/script>

   שימוש:
     SynelSignature.open({ signer: 'שם החתום', title: 'חתימה על טופס פנסיה' }, function(result){
       if(!result) return;            // המשתמש ביטל
       result.image     // dataURL (PNG) של החתימה
       result.points    // רצף נקודות דינמי [{x,y,t,p}] — בסיס לחתימה כבילה
       result.strokes   // מספר משיכות
       result.durationMs// משך החתימה
       result.coverage  // אחוז ניצול שטח המשטח
     });

   הלכידה הדינמית (נקודות, זמנים, לחץ) היא מה שמבסס חתימה "כבילה".
   התוקף המשפטי המלא תלוי גם ברמת החתימה (רגילה / מאובטחת / מאושרת עם תעודה)
   ובספק החתימה — ראו נקודת האינטגרציה ב-onComplete.
*/

var SynelSignature = {

  _built: false,
  _cb: null,
  _ctx: null,
  _drawing: false,
  _points: [],
  _strokes: 0,
  _t0: 0,
  _minPoints: 25,   /* סף מינימלי ללכידה משמעותית */

  /* בניית ה-DOM של המודאל פעם אחת והזרקה ל-body */
  _build: function(){
    if(this._built) return;
    var self = this;
    var wrap = document.createElement('div');
    wrap.id = 'synelSigModal';
    wrap.setAttribute('dir','rtl');
    wrap.innerHTML =
      '<div class="ssig-overlay" id="ssigOverlay">'+
        '<div class="ssig-panel">'+
          '<div class="ssig-head">'+
            '<div><div class="ssig-title" id="ssigTitle">חתימה דיגיטלית</div>'+
              '<div class="ssig-sub" id="ssigSub"></div></div>'+
            '<button class="ssig-x" id="ssigClose" aria-label="סגירה">✕</button>'+
          '</div>'+
          '<div class="ssig-rotate" id="ssigRotate">לחוויה טובה יותר, סובב/י את המכשיר לרוחב</div>'+
          '<div class="ssig-canvas-wrap">'+
            '<canvas class="ssig-canvas" id="ssigCanvas"></canvas>'+
            '<div class="ssig-baseline"></div>'+
            '<div class="ssig-hint" id="ssigHint">חתמ/י כאן — מלא/י את רוחב המשטח</div>'+
          '</div>'+
          '<div class="ssig-meter"><div class="ssig-meter-fill" id="ssigMeter"></div></div>'+
          '<div class="ssig-foot">'+
            '<button class="ssig-clear" id="ssigClear">נקה</button>'+
            '<button class="ssig-ok" id="ssigOk" disabled>אישור החתימה</button>'+
          '</div>'+
        '</div>'+
      '</div>';
    document.body.appendChild(wrap);
    this._injectStyle();

    this._canvas = document.getElementById('ssigCanvas');
    this._ctx = this._canvas.getContext('2d');

    document.getElementById('ssigClose').onclick = function(){ self._finish(null); };
    document.getElementById('ssigClear').onclick = function(){ self.clear(); };
    document.getElementById('ssigOk').onclick    = function(){ self._confirm(); };

    var c = this._canvas;
    c.addEventListener('pointerdown', function(e){ self._down(e); });
    c.addEventListener('pointermove', function(e){ self._move(e); });
    window.addEventListener('pointerup', function(e){ self._up(e); });
    c.style.touchAction = 'none';

    window.addEventListener('resize', function(){ if(self._open) self._resize(); });
    this._built = true;
  },

  _injectStyle: function(){
    if(document.getElementById('ssigStyle')) return;
    var s = document.createElement('style');
    s.id = 'ssigStyle';
    s.textContent =
      '.ssig-overlay{position:fixed;inset:0;background:rgba(17,17,17,.55);z-index:9000;display:none;align-items:center;justify-content:center;padding:16px;}'+
      '.ssig-overlay.show{display:flex;}'+
      '.ssig-panel{background:#fff;border-radius:16px;width:100%;max-width:720px;box-shadow:0 24px 60px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden;}'+
      '.ssig-head{display:flex;justify-content:space-between;align-items:flex-start;padding:16px 18px;border-bottom:1px solid #E5E7EB;}'+
      '.ssig-title{font-size:16px;font-weight:700;color:#1a1a1a;}'+
      '.ssig-sub{font-size:12px;color:#6B7280;margin-top:2px;}'+
      '.ssig-x{border:none;background:none;font-size:18px;color:#9CA3AF;cursor:pointer;line-height:1;}'+
      '.ssig-rotate{display:none;font-size:12px;color:#C2410C;background:#FFF7ED;padding:7px 14px;}'+
      '.ssig-canvas-wrap{position:relative;padding:14px 18px;}'+
      '.ssig-canvas{width:100%;height:260px;border:1.5px solid #E5E7EB;border-radius:12px;background:#FAFAFA;display:block;cursor:crosshair;touch-action:none;}'+
      '.ssig-baseline{position:absolute;left:42px;right:42px;bottom:58px;border-bottom:1.5px dashed #D1D5DB;pointer-events:none;}'+
      '.ssig-hint{position:absolute;inset:14px 18px;display:flex;align-items:center;justify-content:center;color:#9CA3AF;font-size:13px;pointer-events:none;}'+
      '.ssig-meter{height:4px;background:#F3F4F6;margin:0 18px;border-radius:2px;overflow:hidden;}'+
      '.ssig-meter-fill{height:100%;width:0;background:#2D7A4F;border-radius:2px;transition:width .15s;}'+
      '.ssig-foot{display:flex;gap:10px;padding:14px 18px 18px;}'+
      '.ssig-clear{flex:0 0 auto;padding:11px 18px;border:1px solid #E5E7EB;border-radius:50px;background:#fff;color:#6B7280;cursor:pointer;font-family:inherit;font-size:14px;}'+
      '.ssig-ok{flex:1;padding:13px;border:none;border-radius:50px;background:#4F46E5;color:#fff;cursor:pointer;font-family:inherit;font-size:15px;font-weight:600;}'+
      '.ssig-ok:disabled{opacity:.4;cursor:not-allowed;}'+
      '@media (max-width:600px){'+
        '.ssig-canvas{height:200px;}'+
        '.ssig-rotate{display:block;}'+
        '.ssig-panel{max-width:100%;height:100%;border-radius:0;justify-content:center;}'+
        '.ssig-overlay{padding:0;}'+
      '}';
    document.head.appendChild(s);
  },

  /* פתיחת המודאל. onComplete(result|null) */
  open: function(opts, onComplete){
    this._build();
    opts = opts || {};
    this._cb = onComplete || function(){};
    document.getElementById('ssigTitle').textContent = opts.title || 'חתימה דיגיטלית';
    document.getElementById('ssigSub').textContent   = opts.signer ? ('החתום: '+opts.signer) : '';
    document.getElementById('ssigOverlay').classList.add('show');
    this._open = true;
    this.clear();
    var self = this;
    setTimeout(function(){ self._resize(); }, 30);
  },

  /* התאמת רזולוציית הקנבס לגודל בפועל (חדות) */
  _resize: function(){
    var c = this._canvas;
    var rect = c.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    /* שמירת ציור קיים */
    var prev = this._points.length ? c.toDataURL() : null;
    c.width  = Math.max(1, Math.round(rect.width  * dpr));
    c.height = Math.max(1, Math.round(rect.height * dpr));
    this._ctx.setTransform(dpr,0,0,dpr,0,0);
    this._ctx.lineWidth = 2.4;
    this._ctx.lineCap = 'round';
    this._ctx.lineJoin = 'round';
    this._ctx.strokeStyle = '#1a1a1a';
    if(prev){ var img=new Image(); var ctx=this._ctx, w=rect.width, h=rect.height;
      img.onload=function(){ ctx.drawImage(img,0,0,w,h); }; img.src=prev; }
  },

  _pos: function(e){
    var r = this._canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, p: (e.pressure!=null? e.pressure : 0.5) };
  },

  _down: function(e){
    e.preventDefault();
    this._drawing = true;
    this._strokes++;
    if(this._t0===0) this._t0 = Date.now();
    var p = this._pos(e);
    this._ctx.beginPath();
    this._ctx.moveTo(p.x, p.y);
    this._points.push({x:p.x, y:p.y, t:Date.now()-this._t0, p:p.p, s:this._strokes});
    this._hideHint();
  },
  _move: function(e){
    if(!this._drawing) return;
    e.preventDefault();
    var p = this._pos(e);
    /* עובי קו מושפע מלחץ (אם נתמך) — חיזוק לדינמיקה */
    this._ctx.lineWidth = 1.6 + (p.p||0.5)*2.2;
    this._ctx.lineTo(p.x, p.y);
    this._ctx.stroke();
    this._points.push({x:p.x, y:p.y, t:Date.now()-this._t0, p:p.p, s:this._strokes});
    this._updateMeter();
  },
  _up: function(){ this._drawing = false; },

  _hideHint: function(){ var h=document.getElementById('ssigHint'); if(h)h.style.display='none'; },

  /* מד "מילוי" — כמה החתימה מנצלת את המשטח. סף ל-OK. */
  _coverage: function(){
    if(this._points.length<2) return 0;
    var minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
    this._points.forEach(function(p){
      if(p.x<minX)minX=p.x; if(p.x>maxX)maxX=p.x;
      if(p.y<minY)minY=p.y; if(p.y>maxY)maxY=p.y;
    });
    var r = this._canvas.getBoundingClientRect();
    var cov = ((maxX-minX)/Math.max(1,r.width)) * ((maxY-minY)/Math.max(1,r.height));
    return Math.min(1, cov*2.2);
  },
  _ready: function(){
    return this._points.length >= this._minPoints && this._coverage() >= 0.18;
  },
  _updateMeter: function(){
    var pct = Math.min(1, this._points.length/this._minPoints);
    var cov = this._coverage();
    var score = Math.min(1, (pct*0.5 + cov*0.5));
    document.getElementById('ssigMeter').style.width = Math.round(score*100)+'%';
    document.getElementById('ssigOk').disabled = !this._ready();
  },

  clear: function(){
    if(!this._ctx) return;
    var r = this._canvas.getBoundingClientRect();
    this._ctx.clearRect(0,0,this._canvas.width,this._canvas.height);
    this._points = []; this._strokes = 0; this._t0 = 0; this._drawing = false;
    var h=document.getElementById('ssigHint'); if(h)h.style.display='';
    document.getElementById('ssigMeter').style.width='0';
    document.getElementById('ssigOk').disabled = true;
  },

  _confirm: function(){
    if(!this._ready()) return;
    var result = {
      image: this._canvas.toDataURL('image/png'),
      points: this._points.slice(),
      strokes: this._strokes,
      durationMs: this._points.length ? this._points[this._points.length-1].t : 0,
      coverage: Math.round(this._coverage()*100)/100,
      capturedAt: new Date().toISOString(),
    };
    this._finish(result);
  },

  _finish: function(result){
    document.getElementById('ssigOverlay').classList.remove('show');
    this._open = false;
    var cb = this._cb; this._cb = null;
    if(cb) cb(result);
  },
};

if (typeof window !== 'undefined') { window.SynelSignature = SynelSignature; }

})();
}


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
    this._enhanceSignatures(); this._enhanceDocs();
    if (host && !this._sigObserver) {
      this._sigObserver = new MutationObserver(function () { self._enhanceSignatures(); self._enhanceDocs(); });
      this._sigObserver.observe(host, { childList: true, subtree: true });
    }
  },

  _docContent: function (name) {
    name = name || '';
    var C = {};
    C['חוזה'] = {
      title: 'חוזה העסקה',
      html: '<h3>הסכם העסקה אישי</h3>'
        + '<p>הסכם זה נערך ונחתם בין החברה ("המעסיק") לבין העובד/ת, ומסדיר את תנאי ההעסקה.</p>'
        + '<h4>1. תפקיד והיקף משרה</h4><p>העובד/ת יועסק/תועסק בתפקיד שהוגדר, במשרה מלאה, בכפוף לנהלי החברה. שעות העבודה יהיו בהתאם למקובל ולחוק שעות עבודה ומנוחה.</p>'
        + '<h4>2. שכר ותנאים נלווים</h4><p>השכר ישולם מדי חודש, בכפוף לניכויי חובה על פי דין. לעובד/ת יופרשו הפרשות לפנסיה ולפיצויים בהתאם לחוק ולהסכם.</p>'
        + '<h4>3. תקופת ניסיון</h4><p>שלושת החודשים הראשונים ייחשבו כתקופת ניסיון, שבמהלכה ניתן לסיים את ההעסקה בהתראה מקוצרת.</p>'
        + '<h4>4. סודיות</h4><p>העובד/ת מתחייב/ת לשמור על סודיות מלאה ביחס לכל מידע עסקי, טכנולוגי או אישי שייחשף במהלך העבודה, גם לאחר סיומה.</p>'
        + '<h4>5. קניין רוחני</h4><p>כל תוצר, פיתוח או רעיון שייווצרו במסגרת העבודה יהיו קניינה הבלעדי של החברה.</p>'
        + '<h4>6. סיום העסקה</h4><p>כל צד רשאי לסיים את ההעסקה במתן הודעה מוקדמת בכתב, בהתאם לוותק ולחוק הודעה מוקדמת.</p>'
        + '<p style="margin-top:18px;color:#6B7280;">בחתימתך אתה/את מאשר/ת שקראת והבנת את כל סעיפי ההסכם והנך מסכים/ה לתנאיו.</p>'
    };
    C['סעיף 14'] = {
      title: 'הסדר לפי סעיף 14 לחוק פיצויי פיטורים',
      html: '<h3>אישור הסדר לפי סעיף 14</h3>'
        + '<p>מסמך זה מסדיר את תחולת סעיף 14 לחוק פיצויי פיטורים, התשכ"ג–1963, על יחסי העבודה.</p>'
        + '<h4>מהות ההסדר</h4><p>הפרשות המעסיק לרכיב פיצויים בקופת הפנסיה/ביטוח המנהלים יבואו במקום תשלום פיצויי פיטורים, בכפוף לתנאי האישור הכללי של שר העבודה.</p>'
        + '<h4>משמעות עבורך</h4><p>הכספים שהופרשו לרכיב הפיצויים יישארו בבעלותך גם אם תתפטר/י, ולא רק בעת פיטורים. ההסדר חל ממועד תחילת ההפרשות ואילך.</p>'
        + '<h4>תחולה</h4><p>ההסדר חל על מלוא השכר המבוטח ומרגע תחילת העבודה, אלא אם צוין אחרת.</p>'
        + '<p style="margin-top:18px;color:#6B7280;">חתימתך מהווה אישור להחלת הסדר סעיף 14 על תנאי העסקתך.</p>'
    };
    C['161'] = {
      title: 'טופס 161 — הודעת מעביד על פרישה מעבודה',
      html: '<h3>טופס 161 — גמר חשבון</h3>'
        + '<p>טופס זה מדווח לרשות המסים על סיום העסקה ועל המענקים והתשלומים הנלווים, לצורך חישוב המס וההטבות.</p>'
        + '<h4>פרטי סיום ההעסקה</h4><p>מפורטים בו תאריך תחילת וסיום העבודה, סיבת הפרישה, והוותק המצטבר.</p>'
        + '<h4>רכיבי גמר החשבון</h4><p>פיצויי פיטורים, פדיון ימי חופשה, דמי הבראה, והשלמות שכר — בהתאם לזכאותך ולחוק.</p>'
        + '<h4>בחירת מסלול מס</h4><p>ניתן לבחור בין משיכת הפיצויים (חייבת במס בהתאם לתקרה) לבין רצף פיצויים או רצף קצבה הדוחים את אירוע המס.</p>'
        + '<p style="margin-top:18px;color:#6B7280;">מומלץ להיוועץ ביועץ מס לפני בחירת המסלול. חתימתך מאשרת את נכונות הנתונים.</p>'
    };
    for (var k in C) { if (C.hasOwnProperty(k) && name.indexOf(k) >= 0) return C[k]; }
    return { title: 'מסמך לעיון', html: '<h3>מסמך</h3><p>זהו מסמך לעיון. יש לגלול עד סופו לפני אישור.</p><p>תוכן המסמך יוצג כאן.</p>' };
  },

  _docBuild: function () {
    if (this._docBuilt) return;
    var self = this;
    if (!document.getElementById('sdocStyle')) {
      var st = document.createElement('style'); st.id = 'sdocStyle';
      st.textContent =
        '.sdoc-overlay{position:fixed;inset:0;background:rgba(17,17,17,.55);z-index:9100;display:none;align-items:center;justify-content:center;padding:16px;}'
        + '.sdoc-overlay.show{display:flex;}'
        + '.sdoc-panel{background:#fff;border-radius:16px;width:100%;max-width:680px;height:80vh;max-height:760px;box-shadow:0 24px 60px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden;}'
        + '.sdoc-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid #E5E7EB;flex-shrink:0;}'
        + '.sdoc-title{font-size:16px;font-weight:700;color:#1a1a1a;}'
        + '.sdoc-x{border:none;background:none;font-size:18px;color:#9CA3AF;cursor:pointer;line-height:1;}'
        + '.sdoc-body{padding:20px 22px;overflow-y:auto;flex:1;line-height:1.7;color:#374151;font-size:14px;text-align:right;}'
        + '.sdoc-body h3{font-size:18px;color:#1a1a1a;margin:0 0 12px;}'
        + '.sdoc-body h4{font-size:14px;color:#111827;margin:16px 0 4px;}'
        + '.sdoc-body p{margin:0 0 10px;}'
        + '.sdoc-foot{padding:14px 18px;border-top:1px solid #E5E7EB;flex-shrink:0;}'
        + '.sdoc-done{width:100%;padding:13px;border:none;border-radius:50px;background:#4F46E5;color:#fff;cursor:pointer;font-family:inherit;font-size:15px;font-weight:600;}'
        + '.sdoc-done:disabled{opacity:.4;cursor:not-allowed;}'
        + '.sdoc-note{font-size:11px;color:#9CA3AF;text-align:center;margin-top:8px;}'
        + '@media(max-width:600px){.sdoc-panel{max-width:100%;height:100%;border-radius:0;}}';
      document.head.appendChild(st);
    }
    var wrap = document.createElement('div'); wrap.id = 'synelDocModal'; wrap.setAttribute('dir', 'rtl');
    wrap.innerHTML =
      '<div class="sdoc-overlay" id="sdocOverlay">'
      + '<div class="sdoc-panel">'
      + '<div class="sdoc-head"><div class="sdoc-title" id="sdocTitle">מסמך</div><button class="sdoc-x" id="sdocClose">✕</button></div>'
      + '<div class="sdoc-body" id="sdocBody"></div>'
      + '<div class="sdoc-foot"><button class="sdoc-done" id="sdocDone" disabled>סיימתי לקרוא ✓</button><div class="sdoc-note" id="sdocNote">גלול/י עד סוף המסמך כדי להמשיך</div></div>'
      + '</div></div>';
    document.body.appendChild(wrap);
    this._docOverlay = document.getElementById('sdocOverlay');
    var body = document.getElementById('sdocBody');
    var done = document.getElementById('sdocDone');
    document.getElementById('sdocClose').onclick = function () { self._docOverlay.classList.remove('show'); if (self._docCb) self._docCb(false); };
    body.addEventListener('scroll', function () {
      if (body.scrollTop + body.clientHeight >= body.scrollHeight - 8) {
        done.disabled = false; document.getElementById('sdocNote').textContent = 'הגעת לסוף המסמך';
      }
    });
    done.onclick = function () { self._docOverlay.classList.remove('show'); var cb = self._docCb; self._docCb = null; if (cb) cb(true); };
    this._docBuilt = true;
  },

  _docOpen: function (name, onDone) {
    this._docBuild();
    var d = this._docContent(name);
    document.getElementById('sdocTitle').textContent = d.title;
    var body = document.getElementById('sdocBody');
    body.innerHTML = d.html;
    var done = document.getElementById('sdocDone');
    // if content is short (no scroll needed) enable immediately
    this._docCb = onDone;
    this._docOverlay.classList.add('show');
    var self = this;
    setTimeout(function () {
      if (body.scrollHeight <= body.clientHeight + 8) { done.disabled = false; document.getElementById('sdocNote').textContent = 'ניתן להמשיך'; }
      else { done.disabled = true; document.getElementById('sdocNote').textContent = 'גלול/י עד סוף המסמך כדי להמשיך'; body.scrollTop = 0; }
    }, 30);
  },

  _enhanceDocs: function () {
    var self = this;
    var btns = document.querySelectorAll('.phone-wrap .pv-doc-btn, .phone .pv-doc-btn');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        if (btn.getAttribute('data-sdoc')) return;
        btn.setAttribute('data-sdoc', '1');
        btn.addEventListener('click', function (ev) {
          ev.preventDefault(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
          var nm = (document.getElementById('fName') || {}).value || '';
          self._docOpen(nm, function (done) {
            if (!done) return;
            btn.classList.add('opened');
            try { btn.textContent = '✓ המסמך נפתח'; } catch (e) {}
            try { window.docOpened = true; } catch (e) {}
            var rc = document.querySelector('.pv-confirm'); if (rc) rc.classList.add('enabled');
            var sg = document.querySelector('.pv-sig'); if (sg) sg.classList.add('enabled');
            var hint = document.querySelector('.pv-scroll-hint'); if (hint) hint.style.display = 'none';
            var sd = document.querySelector('.pv-scroll-done'); if (sd) sd.classList.add('show');
          });
        }, true);
      })(btns[i]);
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
