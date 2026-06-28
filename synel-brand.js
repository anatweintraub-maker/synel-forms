/* ════════════════════════════════════════════════════════
   synel-brand.js — מיתוג גלובלי (לוגו + צבע מותג)
   ────────────────────────────────────────────────────────
   מגדירים פעם אחת (לוגו טקסט/תמונה + צבע מותג) — מוחל על כל התבניות:
     • הצבע נכנס למשתנה --orange שמניע כפתורי פעולה, פס התקדמות והלוגו
     • הלוגו מוזרם למעטפת הניווט (synel-nav.js)
   נשמר ב-localStorage תחת 'synel_brand' — לכן הגדרה אחת חלה בכל מקום.

   שימוש: הוסף <script src="synel-brand.js"><\/script> (לפני synel-nav.js).
   לפתיחת חלון ההגדרות: SynelBrand.open()  או  כפתור SynelBrand.button().
   ════════════════════════════════════════════════════════ */
var SynelBrand = {
  KEY: 'synel_brand',
  defaults: { logoText: 'SY', logoImage: '', brandColor: '#E8603C' },
  _injected: false,

  get: function () {
    var b = {};
    try { b = JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) {}
    return {
      logoText: b.logoText != null ? b.logoText : this.defaults.logoText,
      logoImage: b.logoImage || this.defaults.logoImage,
      brandColor: b.brandColor || this.defaults.brandColor
    };
  },

  save: function (b) {
    try { localStorage.setItem(this.KEY, JSON.stringify(b)); } catch (e) {}
  },

  /* מחיל את המיתוג על המסמך: צבע → CSS var, לוגו → מעטפת הניווט */
  apply: function () {
    var b = this.get();
    var root = document.documentElement;
    if (b.brandColor) {
      root.style.setProperty('--orange', b.brandColor);
      root.style.setProperty('--brand', b.brandColor);
    }
    if (typeof SynelNav !== 'undefined' && SynelNav.set) {
      SynelNav.set({ logoText: b.logoText || 'SY', logoImage: b.logoImage || '' });
    }
    try { document.dispatchEvent(new CustomEvent('synel-brand-change', { detail: b })); } catch (e) {}
  },

  _injectCss: function () {
    if (document.getElementById('synel-brand-css')) return;
    var s = document.createElement('style');
    s.id = 'synel-brand-css';
    s.textContent =
      '.sb-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:400;display:none;align-items:center;justify-content:center;}' +
      '.sb-overlay.show{display:flex;}' +
      '.sb-box{background:#fff;border-radius:16px;padding:22px;width:360px;max-width:92vw;font-family:inherit;direction:rtl;}' +
      '.sb-box h3{font-size:15px;margin-bottom:14px;color:#1a1a1a;}' +
      '.sb-lbl{font-size:11px;font-weight:600;color:#6B7280;letter-spacing:.04em;text-transform:uppercase;display:block;margin:12px 0 6px;}' +
      '.sb-inp{width:100%;padding:8px 12px;font-size:13px;border:1px solid #E5E7EB;border-radius:10px;font-family:inherit;outline:none;}' +
      '.sb-row{display:flex;align-items:center;gap:10px;}' +
      '.sb-color{width:44px;height:38px;border:1px solid #E5E7EB;border-radius:10px;padding:0;cursor:pointer;background:none;}' +
      '.sb-file{font-size:12px;}' +
      '.sb-preview{display:flex;align-items:center;gap:12px;margin-top:14px;padding:14px;border:1px solid #E5E7EB;border-radius:12px;background:#FAFAFA;}' +
      '.sb-logo{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;overflow:hidden;flex-shrink:0;}' +
      '.sb-logo img{width:100%;height:100%;object-fit:contain;}' +
      '.sb-btn-demo{flex:1;padding:11px;border-radius:50px;border:none;color:#fff;font-family:inherit;font-weight:600;font-size:14px;text-align:center;}' +
      '.sb-btns{display:flex;gap:8px;margin-top:18px;}' +
      '.sb-ok{flex:1;padding:10px;border:none;border-radius:10px;background:#1a1a1a;color:#fff;cursor:pointer;font-family:inherit;font-weight:500;}' +
      '.sb-cancel{padding:10px 14px;border:1px solid #E5E7EB;border-radius:10px;background:#fff;cursor:pointer;font-family:inherit;}' +
      '.sb-reset{padding:10px 14px;border:1px solid #E5E7EB;border-radius:10px;background:#fff;cursor:pointer;font-family:inherit;color:#6B7280;}' +
      '.sb-clear-img{font-size:11px;color:#DC2626;background:none;border:none;cursor:pointer;font-family:inherit;}' +
      '.sb-trigger{display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:7px 12px;border:1px solid #E5E7EB;border-radius:50px;background:#fff;cursor:pointer;font-family:inherit;color:#1a1a1a;}';
    document.head.appendChild(s);
  },

  _ensureOverlay: function () {
    if (this._injected) return;
    this._injected = true;
    this._injectCss();
    var ov = document.createElement('div');
    ov.className = 'sb-overlay';
    ov.id = 'sbOverlay';
    ov.innerHTML =
      '<div class="sb-box">' +
        '<h3>🎨 מיתוג</h3>' +
        '<span class="sb-lbl">לוגו — טקסט</span>' +
        '<input class="sb-inp" id="sbLogoText" maxlength="4" placeholder="SY">' +
        '<span class="sb-lbl">לוגו — תמונה (אופציונלי)</span>' +
        '<div class="sb-row"><input class="sb-file" type="file" id="sbLogoFile" accept="image/*">' +
        '<button class="sb-clear-img" id="sbClearImg">הסר תמונה</button></div>' +
        '<span class="sb-lbl">צבע מותג</span>' +
        '<div class="sb-row"><input class="sb-color" type="color" id="sbColor"><input class="sb-inp" id="sbColorHex" style="flex:1;" placeholder="#E8603C"></div>' +
        '<div class="sb-preview"><span class="sb-logo" id="sbPrevLogo"></span><button class="sb-btn-demo" id="sbPrevBtn">אישור והמשך ←</button></div>' +
        '<div class="sb-btns"><button class="sb-ok" onclick="SynelBrand._commit()">שמור מיתוג ✓</button>' +
        '<button class="sb-cancel" onclick="SynelBrand.close()">ביטול</button>' +
        '<button class="sb-reset" onclick="SynelBrand._reset()">איפוס</button></div>' +
      '</div>';
    ov.onclick = function (e) { if (e.target === ov) SynelBrand.close(); };
    document.body.appendChild(ov);

    var self = this;
    this._draft = { logoImage: '' };
    document.getElementById('sbLogoText').oninput = function () { self._refreshPreview(); };
    document.getElementById('sbColor').oninput = function () { document.getElementById('sbColorHex').value = this.value; self._refreshPreview(); };
    document.getElementById('sbColorHex').oninput = function () {
      var v = this.value.trim(); if (/^#?[0-9a-fA-F]{6}$/.test(v)) { if (v[0] !== '#') v = '#' + v; document.getElementById('sbColor').value = v; self._refreshPreview(); }
    };
    document.getElementById('sbClearImg').onclick = function () { self._draft.logoImage = ''; document.getElementById('sbLogoFile').value = ''; self._refreshPreview(); };
    document.getElementById('sbLogoFile').onchange = function () {
      var f = this.files && this.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () { self._draft.logoImage = r.result; self._refreshPreview(); };
      r.readAsDataURL(f);
    };
  },

  _refreshPreview: function () {
    var color = document.getElementById('sbColorHex').value || '#E8603C';
    var txt = document.getElementById('sbLogoText').value || 'SY';
    var logo = document.getElementById('sbPrevLogo');
    var btn = document.getElementById('sbPrevBtn');
    btn.style.background = color;
    if (this._draft.logoImage) { logo.style.background = 'transparent'; logo.innerHTML = '<img src="' + this._draft.logoImage + '">'; }
    else { logo.style.background = color; logo.textContent = txt; }
  },

  open: function () {
    this._ensureOverlay();
    var b = this.get();
    this._draft.logoImage = b.logoImage || '';
    document.getElementById('sbLogoText').value = b.logoText || '';
    document.getElementById('sbColor').value = b.brandColor || '#E8603C';
    document.getElementById('sbColorHex').value = b.brandColor || '#E8603C';
    this._refreshPreview();
    document.getElementById('sbOverlay').classList.add('show');
  },

  close: function () { var o = document.getElementById('sbOverlay'); if (o) o.classList.remove('show'); },

  _commit: function () {
    var b = {
      logoText: (document.getElementById('sbLogoText').value || 'SY').trim(),
      logoImage: this._draft.logoImage || '',
      brandColor: document.getElementById('sbColorHex').value || '#E8603C'
    };
    this.save(b);
    this.apply();
    this.close();
    if (typeof toast === 'function') toast('✓ מיתוג נשמר והוחל');
  },

  _reset: function () {
    this.save(this.defaults);
    this._draft.logoImage = '';
    this.apply();
    this.open();
    if (typeof toast === 'function') toast('המיתוג אופס לברירת מחדל');
  },

  /* כפתור שניתן למקם בכותרת/סרגל של כל תבנית */
  button: function () {
    this._injectCss();
    var b = document.createElement('button');
    b.className = 'sb-trigger';
    b.innerHTML = '🎨 מיתוג';
    b.onclick = function () { SynelBrand.open(); };
    return b;
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { SynelBrand.apply(); });
} else {
  SynelBrand.apply();
}
console.log('[Synel Brand] Loaded');
