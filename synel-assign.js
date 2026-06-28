/* ════════════════════════════════════════════════════════
   SYNEL ASSIGN — רכיב שיוך אחיד לכל המסכים
   כפתור "שיוך" + מודאל עם כרטיסיות תהליך/אוכלוסייה + עובד אחראי.
   נראות והתנהגות זהות בכל מסך. מבוסס על synel-org.js.

   שימוש:
     <script src="synel-org.js"></script>
     <script src="synel-assign.js"></script>
     // הצבת כפתור במקום כלשהו:
     document.getElementById('myToolbar').appendChild(SynelAssign.button());
     // קריאת השיוך (לייצוא/שמירה):
     var a = SynelAssign.get();  // {process, populations:[], owner, ownerLabel}
════════════════════════════════════════════════════════ */
var SynelAssign = {

  _state: { process: '', populations: [], owner: '' },
  _injected: false,

  /* תהליכים (אם synel-org לא מגדיר — ברירת מחדל) */
  processes: [
    { id: 'onboarding',  icon: '🚀', title: 'Onboarding',  sub: 'קליטת עובד חדש' },
    { id: 'offboarding', icon: '🚪', title: 'Offboarding', sub: 'עזיבת עובד' },
    { id: 'lifecycle',   icon: '🔄', title: 'Life Cycle',  sub: 'שינויים שוטפים' },
    { id: 'payroll',     icon: '💰', title: 'שכר',          sub: 'תלושים ומסמכי שכר' }
  ],

  _inject: function () {
    if (this._injected) return;
    this._injected = true;
    var css = document.createElement('style');
    css.textContent = [
      '.sa-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:600;display:none;align-items:center;justify-content:center;direction:rtl;}',
      '.sa-overlay.show{display:flex;}',
      '.sa-modal{background:#fff;border-radius:16px;width:460px;max-width:92%;max-height:86vh;overflow-y:auto;padding:22px;box-shadow:0 20px 50px rgba(0,0,0,.25);font-family:inherit;}',
      '.sa-modal h3{font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 4px;display:flex;align-items:center;gap:7px;}',
      '.sa-sub{font-size:11px;color:#6B7280;margin-bottom:14px;}',
      '.sa-label{font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:.04em;margin:14px 0 7px;}',
      '.sa-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}',
      '.sa-item{border:1.5px solid #E5E7EB;border-radius:10px;padding:10px 12px;cursor:pointer;transition:all .12s;}',
      '.sa-item:hover{border-color:#A5B4FC;}',
      '.sa-item.sel{border-color:#4F46E5;background:#EEF2FF;}',
      '.sa-it-title{font-size:13px;font-weight:600;color:#1a1a1a;}',
      '.sa-it-sub{font-size:10px;color:#6B7280;margin-top:2px;}',
      '.sa-inp{width:100%;padding:9px;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;font-family:inherit;outline:none;background:#fff;}',
      '.sa-btns{display:flex;gap:8px;margin-top:18px;}',
      '.sa-ok{flex:1;padding:11px;font-size:13px;font-weight:600;border-radius:50px;border:none;background:#4F46E5;color:#fff;cursor:pointer;font-family:inherit;}',
      '.sa-cancel{flex:1;padding:11px;font-size:13px;border-radius:50px;border:1px solid #E5E7EB;background:#fff;cursor:pointer;font-family:inherit;}',
      '.sa-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;font-size:13px;border-radius:8px;border:1px solid #E5E7EB;background:#fff;color:#1a1a1a;cursor:pointer;font-family:inherit;}',
      '.sa-btn:hover{border-color:#4F46E5;color:#4F46E5;}',
      '.sa-btn .dot{width:7px;height:7px;border-radius:50%;background:#9CA3AF;}',
      '.sa-btn.has .dot{background:#2D7A4F;}',
      '.sa-demo{font-size:10px;color:#9CA3AF;text-align:center;margin-top:10px;}'
    ].join('');
    document.head.appendChild(css);

    var ov = document.createElement('div');
    ov.className = 'sa-overlay'; ov.id = 'saOverlay';
    ov.onclick = function (e) { if (e.target === ov) SynelAssign.close(); };
    ov.innerHTML =
      '<div class="sa-modal">' +
      '<h3>🗂 שיוך טופס</h3>' +
      '<div class="sa-sub">בחר תהליך, אוכלוסיית יעד ועובד אחראי</div>' +
      '<div class="sa-label">תהליך</div><div class="sa-grid" id="saProcess"></div>' +
      '<div class="sa-label">אוכלוסיית יעד</div><div class="sa-grid" id="saPops"></div>' +
      '<div class="sa-label">עובד אחראי</div><select class="sa-inp" id="saOwner"></select>' +
      '<div class="sa-btns"><button class="sa-ok" onclick="SynelAssign.save()">שמור שיוך ✓</button>' +
      '<button class="sa-cancel" onclick="SynelAssign.close()">ביטול</button></div>' +
      '<div class="sa-demo">נתוני דמו — יוחלפו בנתונים מ-Harmony</div>' +
      '</div>';
    document.body.appendChild(ov);
  },

  button: function () {
    this._inject();
    var b = document.createElement('button');
    b.className = 'sa-btn'; b.id = 'saBtn';
    b.innerHTML = '<span class="dot"></span>🗂 שיוך';
    b.onclick = function () { SynelAssign.open(); };
    this._refreshBtn(b);
    return b;
  },

  _refreshBtn: function (b) {
    b = b || document.getElementById('saBtn'); if (!b) return;
    var has = this._state.process || this._state.populations.length || this._state.owner;
    b.classList.toggle('has', !!has);
  },

  open: function () {
    this._inject();
    var procWrap = document.getElementById('saProcess'); procWrap.innerHTML = '';
    var procs = (typeof SynelOrg !== 'undefined' && SynelOrg.processes && SynelOrg.processes.length) ? null : this.processes;
    // תהליך — בחירה יחידה
    this.processes.forEach(function (p) {
      var d = document.createElement('div');
      d.className = 'sa-item' + (SynelAssign._state.process === p.id ? ' sel' : '');
      d.innerHTML = '<div class="sa-it-title">' + p.icon + ' ' + p.title + '</div><div class="sa-it-sub">' + p.sub + '</div>';
      d.onclick = function () {
        SynelAssign._state.process = (SynelAssign._state.process === p.id) ? '' : p.id;
        SynelAssign.open();
      };
      procWrap.appendChild(d);
    });
    // אוכלוסיות — בחירה מרובה
    var popWrap = document.getElementById('saPops'); popWrap.innerHTML = '';
    var pops = (typeof SynelOrg !== 'undefined') ? SynelOrg.populations : [];
    pops.forEach(function (p) {
      var sel = SynelAssign._state.populations.indexOf(p.id) >= 0;
      var d = document.createElement('div');
      d.className = 'sa-item' + (sel ? ' sel' : '');
      d.innerHTML = '<div class="sa-it-title">' + p.name + '</div>';
      d.onclick = function () {
        var idx = SynelAssign._state.populations.indexOf(p.id);
        if (idx >= 0) SynelAssign._state.populations.splice(idx, 1);
        else SynelAssign._state.populations.push(p.id);
        d.classList.toggle('sel');
      };
      popWrap.appendChild(d);
    });
    // עובד אחראי
    var ownerSel = document.getElementById('saOwner');
    if (typeof SynelOrg !== 'undefined') SynelOrg.populateOwner(ownerSel);
    ownerSel.value = this._state.owner || '';
    document.getElementById('saOverlay').classList.add('show');
  },

  close: function () { var o = document.getElementById('saOverlay'); if (o) o.classList.remove('show'); },

  save: function () {
    this._state.owner = document.getElementById('saOwner').value || '';
    this.close();
    this._refreshBtn();
    if (typeof toast === 'function') toast('✓ שיוך נשמר');
  },

  get: function () {
    var ownerLabel = (typeof SynelOrg !== 'undefined') ? SynelOrg.nameById('owners', this._state.owner) : '';
    var popLabels = (typeof SynelOrg !== 'undefined') ? this._state.populations.map(function (id) { return SynelOrg.nameById('populations', id); }) : [];
    return {
      process: this._state.process,
      populations: this._state.populations.slice(),
      populationLabels: popLabels,
      owner: this._state.owner,
      ownerLabel: ownerLabel
    };
  },

  set: function (data) {
    data = data || {};
    this._state.process = data.process || '';
    this._state.populations = Array.isArray(data.populations) ? data.populations.slice() : [];
    this._state.owner = data.owner || '';
    this._refreshBtn();
  }
};

console.log('[Synel Assign] Loaded');
