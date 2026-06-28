/* SYNEL ACCESSIBILITY
   WCAG 2.1 AA compliance for all templates
   Add: <script src="synel-accessibility.js"></script>
*/

var SynelA11y = {

  init: function() {
    this.addSkipLink();
    this.fixInputLabels();
    this.addKeyboardNav();
    this.addFocusStyles();
    this.fixColorContrast();
    this.addLiveRegion();
    this.fixFormRoles();
    console.log('[A11y] Initialized');
  },

  /* Skip to main content link */
  addSkipLink: function() {
    if(document.getElementById('skip-to-main')) return;
    var skip = document.createElement('a');
    skip.id = 'skip-to-main';
    skip.href = '#main-content';
    skip.textContent = 'דלג לתוכן הראשי';
    skip.style.cssText = 'position:fixed;top:-40px;right:0;background:#4F46E5;color:white;padding:8px 16px;border-radius:0 0 8px 0;font-size:13px;z-index:9999;text-decoration:none;transition:top .2s;direction:rtl;';
    skip.addEventListener('focus', function(){ this.style.top = '0'; });
    skip.addEventListener('blur', function(){ this.style.top = '-40px'; });
    document.body.prepend(skip);

    // Add id to main content area
    var main = document.querySelector('.main, .phone-content, .doc-paper, #pvContent');
    if(main && !main.id) main.id = 'main-content';
  },

  /* Ensure all inputs have labels */
  fixInputLabels: function() {
    document.querySelectorAll('input, select, textarea').forEach(function(el) {
      if(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return;
      var label = el.closest('label') ||
                  (el.id && document.querySelector('label[for="'+el.id+'"]'));
      if(!label) {
        var placeholder = el.placeholder || el.name || 'שדה';
        el.setAttribute('aria-label', placeholder);
      }
      if(el.required) el.setAttribute('aria-required', 'true');
    });
  },

  /* Keyboard navigation for custom elements */
  addKeyboardNav: function() {
    // Make clickable divs keyboard accessible
    document.querySelectorAll('[onclick]:not(button):not(a):not(input)').forEach(function(el) {
      // דלג על אזורי עריכה — אסור לחטוף בהם רווח/Enter
      if(el.isContentEditable || el.closest('[contenteditable="true"]') ||
         el.querySelector('[contenteditable], input, textarea, select') ||
         /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if(!el.getAttribute('tabindex')) el.setAttribute('tabindex', '0');
      if(!el.getAttribute('role')) el.setAttribute('role', 'button');
      el.addEventListener('keydown', function(e) {
        // אל תתערב כשהפוקוס בתוך שדה עריכה
        var t=e.target;
        if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        if(e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });

    // Trap focus in modals
    document.querySelectorAll('.modal-overlay, [id$="Modal"]').forEach(function(modal) {
      modal.addEventListener('keydown', function(e) {
        if(e.key !== 'Tab') return;
        var focusable = modal.querySelectorAll('button, input, select, textarea, a, [tabindex]:not([tabindex="-1"])');
        if(!focusable.length) return;
        var first = focusable[0], last = focusable[focusable.length-1];
        if(e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
      // Close on Escape
      modal.addEventListener('keydown', function(e) {
        if(e.key === 'Escape') modal.style.display = 'none';
      });
    });
  },

  /* Visible focus styles */
  addFocusStyles: function() {
    var style = document.createElement('style');
    style.textContent = [
      ':focus-visible { outline: 2px solid #4F46E5 !important; outline-offset: 2px !important; border-radius: 4px; }',
      'button:focus-visible { outline: 2px solid #4F46E5 !important; }',
      'input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid #4F46E5 !important; }',
      '.inline-field:focus { background: #EEF2FF !important; border-radius: 3px; }',
      /* Larger touch targets on mobile */
      '@media (max-width: 768px) {',
      '  button { min-height: 44px; }',
      '  input, select { min-height: 40px; font-size: 16px !important; }', /* 16px prevents iOS zoom */
      '}',
    ].join('\n');
    document.head.appendChild(style);
  },

  /* Fix low-contrast colors */
  fixColorContrast: function() {
    var style = document.createElement('style');
    style.textContent = [
      '.text3, [style*="color:#9CA3AF"], [style*="color: #9CA3AF"] { color: #6B7280 !important; }',
      'input::placeholder, textarea::placeholder { color: #6B7280 !important; }',
      '.frc-req { background: #FEE2E2 !important; color: #991B1B !important; font-weight: 600; }',
    ].join('\n');
    document.head.appendChild(style);
  },

  /* Live region for dynamic announcements */
  addLiveRegion: function() {
    if(document.getElementById('a11y-live')) return;
    var live = document.createElement('div');
    live.id = 'a11y-live';
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    live.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;';
    document.body.appendChild(live);
  },

  /* Announce message to screen readers */
  announce: function(msg) {
    var live = document.getElementById('a11y-live');
    if(live) { live.textContent = ''; setTimeout(function(){ live.textContent = msg; }, 50); }
  },

  /* Add ARIA roles to form elements */
  fixFormRoles: function() {
    // Progress indicators
    document.querySelectorAll('.pbar-dots, .ocr-steps').forEach(function(el) {
      el.setAttribute('role', 'progressbar');
      el.setAttribute('aria-label', 'התקדמות בטופס');
    });
    // Required field markers
    document.querySelectorAll('.frc-req, [class*="req"]').forEach(function(el) {
      el.setAttribute('aria-label', 'שדה חובה');
    });
    // Error messages
    document.querySelectorAll('[id^="err_"]').forEach(function(el) {
      el.setAttribute('role', 'alert');
    });
  },

  /* Font size controls */
  addFontControls: function(containerId) {
    var container = document.getElementById(containerId);
    if(!container) return;
    var ctrl = document.createElement('div');
    ctrl.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:8px;';
    ctrl.innerHTML = '<span style="font-size:11px;color:#6B7280;">גודל טקסט:</span>'
      + '<button onclick="SynelA11y.setFontSize(14)" style="padding:3px 8px;font-size:11px;border:1px solid #E5E7EB;border-radius:6px;cursor:pointer;background:white;">A</button>'
      + '<button onclick="SynelA11y.setFontSize(17)" style="padding:3px 8px;font-size:13px;border:1px solid #E5E7EB;border-radius:6px;cursor:pointer;background:white;">A</button>'
      + '<button onclick="SynelA11y.setFontSize(20)" style="padding:3px 8px;font-size:16px;border:1px solid #E5E7EB;border-radius:6px;cursor:pointer;background:white;">A</button>';
    container.prepend(ctrl);
  },

  setFontSize: function(size) {
    var targets = document.querySelectorAll('.doc-paper, .pv-editor, .inline-field, .phone-content');
    targets.forEach(function(el){ el.style.fontSize = size+'px'; });
    localStorage.setItem('synel_font_size', size);
  },

  loadFontSize: function() {
    var saved = localStorage.getItem('synel_font_size');
    if(saved) this.setFontSize(parseInt(saved));
  }
};

/* Auto-init on DOM ready */
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function(){ SynelA11y.init(); SynelA11y.loadFontSize(); });
} else {
  SynelA11y.init(); SynelA11y.loadFontSize();
}

console.log('[A11y] Loaded');
