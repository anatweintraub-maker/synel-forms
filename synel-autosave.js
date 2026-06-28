/* SYNEL AUTOSAVE
   Auto-saves form progress every 30 seconds + on change
   Add to all templates: <script src="synel-autosave.js"></script>
*/

var SynelAutosave = {

  saveKey: null,
  saveInterval: null,
  lastSaved: null,
  statusEl: null,
  dirty: false,

  /* Initialize autosave for a form */
  init: function(formKey, getDataFn, statusElId) {
    this.saveKey = 'autosave_' + formKey;
    this.getDataFn = getDataFn;
    this.statusEl = document.getElementById(statusElId);
    var self = this;

    // Auto-save every 30 seconds
    this.saveInterval = setInterval(function() {
      if(self.dirty) self.save();
    }, 30000);

    // Save on page unload
    window.addEventListener('beforeunload', function() {
      self.save();
    });

    // Listen for any input changes
    document.addEventListener('input', function() { self.dirty = true; });
    document.addEventListener('change', function() { self.dirty = true; });

    console.log('[Autosave] Initialized for:', formKey);
  },

  /* Save current state */
  save: function() {
    if(!this.saveKey || !this.getDataFn) return;
    try {
      var data = this.getDataFn();
      data._autosaved = new Date().toISOString();
      data._version = (data._version || 0) + 1;
      localStorage.setItem(this.saveKey, JSON.stringify(data));
      this.lastSaved = new Date();
      this.dirty = false;
      this.updateStatus('saved');
      console.log('[Autosave] Saved at', this.lastSaved.toLocaleTimeString('he-IL'));
    } catch(e) {
      console.error('[Autosave] Error:', e);
    }
  },

  /* Load saved state */
  load: function() {
    if(!this.saveKey) return null;
    try {
      var raw = localStorage.getItem(this.saveKey);
      if(!raw) return null;
      return JSON.parse(raw);
    } catch(e) { return null; }
  },

  /* Check if there's a saved draft */
  hasDraft: function() {
    var data = this.load();
    return data && data._autosaved;
  },

  /* Clear saved draft */
  clear: function() {
    if(this.saveKey) localStorage.removeItem(this.saveKey);
    this.updateStatus('cleared');
  },

  /* Show restore prompt */
  showRestorePrompt: function(onRestore, onDiscard) {
    var data = this.load();
    if(!data || !data._autosaved) return;

    var saved = new Date(data._autosaved);
    var timeStr = saved.toLocaleString('he-IL');

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:500;display:flex;align-items:center;justify-content:center;';

    var box = document.createElement('div');
    box.style.cssText = 'background:white;border-radius:14px;padding:24px;max-width:380px;width:90%;box-shadow:0 20px 50px rgba(0,0,0,.2);direction:rtl;font-family:inherit;';
    box.innerHTML = '<div style="font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:8px;">יש טיוטה שמורה</div>'
      + '<div style="font-size:13px;color:#6B7280;margin-bottom:16px;line-height:1.6;">נמצאה טיוטה שמורה מ-<strong>' + timeStr + '</strong>.<br>רוצה להמשיך ממנה?</div>'
      + '<div style="display:flex;gap:8px;">'
      + '<button id="restoreBtn" style="flex:1;padding:10px;font-size:13px;border-radius:50px;border:none;background:#4F46E5;color:white;cursor:pointer;font-family:inherit;font-weight:500;">המשך מהטיוטה</button>'
      + '<button id="discardBtn" style="flex:1;padding:10px;font-size:13px;border-radius:50px;border:1px solid #E5E7EB;background:white;cursor:pointer;font-family:inherit;">התחל מחדש</button>'
      + '</div>';

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById('restoreBtn').onclick = function() {
      overlay.remove();
      if(onRestore) onRestore(data);
    };
    document.getElementById('discardBtn').onclick = function() {
      overlay.remove();
      SynelAutosave.clear();
      if(onDiscard) onDiscard();
    };
  },

  /* Update status indicator */
  updateStatus: function(state) {
    if(!this.statusEl) return;
    var msgs = {
      saved:   { text: 'נשמר אוטומטית ' + (this.lastSaved ? this.lastSaved.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'}) : ''), color: '#065F46', bg: '#F0FDF4' },
      saving:  { text: 'שומר...', color: '#4F46E5', bg: '#EEF2FF' },
      cleared: { text: 'טיוטה נמחקה', color: '#6B7280', bg: '#F3F4F6' },
      dirty:   { text: 'לא נשמר', color: '#92400E', bg: '#FFFBEB' },
    };
    var m = msgs[state] || msgs.saved;
    this.statusEl.textContent = m.text;
    this.statusEl.style.cssText = 'font-size:11px;padding:3px 10px;border-radius:20px;background:'+m.bg+';color:'+m.color+';display:inline-block;';
  },

  /* Add status badge to page */
  addStatusBadge: function(containerId) {
    var container = document.getElementById(containerId) || document.body;
    var badge = document.createElement('div');
    badge.id = 'autosave_status';
    badge.style.cssText = 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);z-index:100;font-size:11px;padding:4px 12px;border-radius:20px;background:#F0FDF4;color:#065F46;box-shadow:0 2px 8px rgba(0,0,0,.1);pointer-events:none;opacity:0;transition:opacity .3s;';
    document.body.appendChild(badge);
    this.statusEl = badge;
    return badge;
  },

  /* Show toast-style save confirmation */
  showSavedToast: function() {
    var badge = this.statusEl || this.addStatusBadge();
    badge.textContent = 'נשמר אוטומטית ' + new Date().toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});
    badge.style.opacity = '1';
    setTimeout(function(){ badge.style.opacity = '0'; }, 2000);
  }
};

console.log('[Autosave] Loaded');
