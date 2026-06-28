/* SYNEL MOBILE EDITOR
   Responsive editor layout for mobile devices
   Add: <script src="synel-mobile.js"></script>
*/

var SynelMobile = {

  isMobile: function() {
    return window.innerWidth <= 768;
  },

  init: function() {
    if(!this.isMobile()) return;
    this.addMobileCSS();
    this.addBottomNav();
    this.collapseEditorPanel();
    this.addSwipeSupport();
    window.addEventListener('resize', function(){
      if(SynelMobile.isMobile()) SynelMobile.addMobileCSS();
    });
    console.log('[Mobile] Initialized');
  },

  addMobileCSS: function() {
    if(document.getElementById('synel-mobile-css')) return;
    var style = document.createElement('style');
    style.id = 'synel-mobile-css';
    style.textContent = [
      /* Force column layout on mobile */
      '@media (max-width: 768px) {',

      /* Editor panels */
      '  body { flex-direction: column !important; }',
      '  .ep, .pp, .fp { width: 100% !important; height: auto !important; border-left: none !important; border-right: none !important; border-bottom: 1px solid #E5E7EB !important; }',

      /* Studio wrap */
      '  .studio-wrap { flex-direction: column !important; overflow: visible !important; }',
      '  .canvas-area { padding: 12px !important; }',

      /* Phone preview */
      '  .preview-panel { padding: 12px !important; }',
      '  .phone-wrap { width: 100% !important; border-radius: 12px !important; }',

      /* OCR screens */
      '  #os2 { flex-direction: column !important; }',
      '  .os2-left { max-height: 200px; overflow-y: auto; border-left: none !important; border-bottom: 1px solid #E5E7EB; }',
      '  .os2-right { width: 100% !important; }',
      '  #os3 { flex-direction: column-reverse !important; }',
      '  .os3-doc { min-height: 300px; padding: 12px !important; }',
      '  .os3-right { width: 100% !important; border-right: none !important; border-bottom: 1px solid #E5E7EB; }',

      /* Toolbar */
      '  .studio-toolbar { flex-wrap: wrap; height: auto !important; padding: 4px 8px; gap: 2px; }',

      /* Tabs */
      '  .nav-tabs, .tabs { overflow-x: auto; white-space: nowrap; }',
      '  .nav-tab, .tab { padding: 0 12px !important; font-size: 12px !important; }',

      /* OCR options side by side -> stacked */
      '  .ocr-options { flex-direction: column !important; gap: 10px !important; }',

      /* Buttons full width */
      '  .ep-footer { flex-wrap: wrap; }',
      '  .ep-footer .btn { min-width: 45%; }',

      /* Larger touch targets */
      '  .rc-rm, .hc-rm, .frc-del, .point-rm { width: 30px !important; height: 30px !important; }',
      '  .add-btn { padding: 12px !important; font-size: 13px !important; }',

      /* Sticky footer on forms */
      '  .phone-footer, .os3-footer { position: sticky; bottom: 0; background: white; z-index: 10; box-shadow: 0 -2px 10px rgba(0,0,0,.08); }',

      '}',
    ].join('\n');
    document.head.appendChild(style);
  },

  /* Collapsible editor panel on mobile */
  collapseEditorPanel: function() {
    if(!this.isMobile()) return;
    var ep = document.querySelector('.ep');
    if(!ep) return;

    var epHead = ep.querySelector('.ep-head');
    if(!epHead) return;

    var epBody = ep.querySelector('.ep-body');
    var epFooter = ep.querySelector('.ep-footer');
    var collapsed = false;

    // Add toggle button
    var toggleBtn = document.createElement('button');
    toggleBtn.style.cssText = 'margin-right:auto;padding:4px 10px;font-size:11px;border-radius:20px;border:1px solid #E5E7EB;background:white;cursor:pointer;font-family:inherit;';
    toggleBtn.textContent = 'הסתר ▲';
    epHead.appendChild(toggleBtn);

    toggleBtn.onclick = function() {
      collapsed = !collapsed;
      if(epBody) epBody.style.display = collapsed ? 'none' : '';
      if(epFooter) epFooter.style.display = collapsed ? 'none' : '';
      toggleBtn.textContent = collapsed ? 'הצג עורך ▼' : 'הסתר ▲';
    };
  },

  /* Bottom navigation for mobile - switch between Edit/Preview */
  addBottomNav: function() {
    if(!this.isMobile()) return;
    // Only for studio view
    var editor = document.getElementById('editor');
    var previewPanel = document.querySelector('.preview-panel');
    if(!editor || !previewPanel) return;

    var nav = document.createElement('div');
    nav.id = 'mobile-bottom-nav';
    nav.style.cssText = 'position:fixed;bottom:0;right:0;left:0;height:52px;background:white;border-top:1px solid #E5E7EB;display:flex;z-index:200;';

    var tabs = [
      {label:'✏️ עריכה',  id:'edit'},
      {label:'👁 תצוגה', id:'preview'},
    ];

    var active = 'edit';
    tabs.forEach(function(tab){
      var btn = document.createElement('button');
      btn.style.cssText = 'flex:1;border:none;background:none;font-size:13px;cursor:pointer;font-family:inherit;border-top:2px solid '+(tab.id===active?'#4F46E5':'transparent')+';color:'+(tab.id===active?'#4F46E5':'#6B7280')+';';
      btn.textContent = tab.label;
      btn.onclick = function(){
        active = tab.id;
        nav.querySelectorAll('button').forEach(function(b,i){
          b.style.borderTopColor = tabs[i].id===active?'#4F46E5':'transparent';
          b.style.color = tabs[i].id===active?'#4F46E5':'#6B7280';
        });
        if(tab.id==='edit'){
          document.querySelector('.ep').style.display='';
          previewPanel.style.display='none';
        } else {
          document.querySelector('.ep').style.display='none';
          previewPanel.style.display='';
        }
      };
      nav.appendChild(btn);
    });

    document.body.appendChild(nav);
    // Add padding to avoid overlap
    document.body.style.paddingBottom = '52px';

    // Start in edit mode
    previewPanel.style.display = 'none';
  },

  /* Swipe left/right to switch panels */
  addSwipeSupport: function() {
    var startX = 0;
    var threshold = 60;
    document.addEventListener('touchstart', function(e){
      startX = e.touches[0].clientX;
    }, {passive: true});
    document.addEventListener('touchend', function(e){
      var diff = startX - e.changedTouches[0].clientX;
      var nav = document.getElementById('mobile-bottom-nav');
      if(!nav) return;
      if(Math.abs(diff) > threshold){
        var btns = nav.querySelectorAll('button');
        if(diff > 0) btns[1] && btns[1].click(); // swipe left = preview
        else btns[0] && btns[0].click();          // swipe right = edit
      }
    }, {passive: true});
  }
};

/* Auto-init */
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', function(){ SynelMobile.init(); });
} else {
  SynelMobile.init();
}

console.log('[Mobile] Loaded');
