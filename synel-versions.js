/* SYNEL VERSION HISTORY
   Saves up to 10 versions of each form with ability to restore
   Add: <script src="synel-versions.js"></script>
*/

var SynelVersions = {

  MAX_VERSIONS: 10,

  /* Save a new version */
  save: function(formKey, data, label) {
    var key = 'versions_' + formKey;
    var versions = this.getAll(formKey);

    var version = {
      v:       versions.length + 1,
      label:   label || 'גרסה ' + (versions.length + 1),
      savedAt: new Date().toISOString(),
      data:    JSON.parse(JSON.stringify(data)),
    };

    versions.push(version);

    // Keep only last MAX_VERSIONS
    if(versions.length > this.MAX_VERSIONS) {
      versions = versions.slice(versions.length - this.MAX_VERSIONS);
    }

    try { localStorage.setItem(key, JSON.stringify(versions)); } catch(e) {}
    console.log('[Versions] Saved v'+version.v+' for:', formKey);
    return version;
  },

  /* Get all versions */
  getAll: function(formKey) {
    try {
      var raw = localStorage.getItem('versions_' + formKey);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  },

  /* Get specific version */
  get: function(formKey, vIndex) {
    var versions = this.getAll(formKey);
    return versions[vIndex] || null;
  },

  /* Delete all versions */
  clear: function(formKey) {
    localStorage.removeItem('versions_' + formKey);
  },

  /* Show version history panel */
  showPanel: function(formKey, onRestore) {
    var versions = this.getAll(formKey).reverse(); // newest first

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:500;display:flex;align-items:center;justify-content:center;direction:rtl;';

    var box = document.createElement('div');
    box.style.cssText = 'background:white;border-radius:14px;width:420px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 20px 50px rgba(0,0,0,.2);overflow:hidden;';

    // Header
    var head = document.createElement('div');
    head.style.cssText = 'padding:16px 20px;border-bottom:1px solid #E5E7EB;display:flex;align-items:center;justify-content:space-between;';
    head.innerHTML = '<div><div style="font-size:14px;font-weight:700;color:#1a1a1a;">היסטוריית גרסאות</div>'
      + '<div style="font-size:11px;color:#9CA3AF;margin-top:2px;">עד 10 גרסאות אחרונות</div></div>';
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'width:28px;height:28px;border-radius:50%;border:1px solid #E5E7EB;background:none;cursor:pointer;font-size:14px;color:#6B7280;';
    closeBtn.onclick = function(){ overlay.remove(); };
    head.appendChild(closeBtn);

    // List
    var list = document.createElement('div');
    list.style.cssText = 'flex:1;overflow-y:auto;padding:12px 16px;';

    if(!versions.length) {
      list.innerHTML = '<div style="text-align:center;padding:24px;color:#9CA3AF;font-size:13px;">אין גרסאות שמורות עדיין</div>';
    } else {
      versions.forEach(function(ver, i) {
        var saved = new Date(ver.savedAt);
        var dateStr = saved.toLocaleDateString('he-IL') + ' ' + saved.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'});
        var isLatest = i === 0;

        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1px solid '+(isLatest?'#C7D2FE':'#E5E7EB')+';background:'+(isLatest?'#EEF2FF':'white')+';margin-bottom:7px;';

        var info = document.createElement('div');
        info.style.flex = '1';
        info.innerHTML = '<div style="font-size:13px;font-weight:'+(isLatest?'600':'400')+';color:#1a1a1a;">'
          + ver.label
          + (isLatest?'<span style="font-size:10px;margin-right:6px;padding:1px 6px;border-radius:10px;background:#4F46E5;color:white;">נוכחי</span>':'')
          + '</div>'
          + '<div style="font-size:11px;color:#9CA3AF;margin-top:2px;">' + dateStr + '</div>';

        var restoreBtn = document.createElement('button');
        restoreBtn.textContent = isLatest ? 'נוכחי' : 'שחזר';
        restoreBtn.disabled = isLatest;
        restoreBtn.style.cssText = 'padding:5px 12px;font-size:11px;border-radius:20px;border:none;background:'+(isLatest?'#E5E7EB':'#4F46E5')+';color:'+(isLatest?'#9CA3AF':'white')+';cursor:'+(isLatest?'default':'pointer')+';font-family:inherit;';

        (function(version){
          restoreBtn.onclick = function() {
            if(confirm('לשחזר לגרסה "'+version.label+'" מ-'+dateStr+'?')) {
              overlay.remove();
              if(onRestore) onRestore(version.data, version);
            }
          };
        })(ver);

        row.appendChild(info);
        row.appendChild(restoreBtn);
        list.appendChild(row);
      });
    }

    // Footer
    var foot = document.createElement('div');
    foot.style.cssText = 'padding:12px 16px;border-top:1px solid #E5E7EB;display:flex;gap:8px;';
    var closeBtn2 = document.createElement('button');
    closeBtn2.textContent = 'סגור';
    closeBtn2.style.cssText = 'flex:1;padding:9px;font-size:13px;border-radius:50px;border:1px solid #E5E7EB;background:white;cursor:pointer;font-family:inherit;';
    closeBtn2.onclick = function(){ overlay.remove(); };
    var clearBtn = document.createElement('button');
    clearBtn.textContent = 'מחק היסטוריה';
    clearBtn.style.cssText = 'flex:1;padding:9px;font-size:13px;border-radius:50px;border:1px solid #FECACA;background:#FEF2F2;color:#DC2626;cursor:pointer;font-family:inherit;';
    clearBtn.onclick = function(){
      if(confirm('למחוק את כל ההיסטוריה?')){
        SynelVersions.clear(formKey);
        overlay.remove();
        if(typeof toast === 'function') toast('היסטוריה נמחקה');
      }
    };
    foot.appendChild(closeBtn2);
    foot.appendChild(clearBtn);

    box.appendChild(head);
    box.appendChild(list);
    box.appendChild(foot);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Close on backdrop click
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });

    // Escape to close
    document.addEventListener('keydown', function h(e){
      if(e.key==='Escape'){ overlay.remove(); document.removeEventListener('keydown',h); }
    });
  },

  /* Add history button to toolbar */
  addButton: function(containerId, formKeyFn, getDataFn, onRestore) {
    var container = document.getElementById(containerId);
    if(!container) return;
    var btn = document.createElement('button');
    btn.innerHTML = '🕐 גרסאות';
    btn.style.cssText = 'padding:5px 12px;font-size:12px;border-radius:8px;border:1px solid #E5E7EB;background:white;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;';
    btn.onclick = function(){
      var key = typeof formKeyFn === 'function' ? formKeyFn() : formKeyFn;
      SynelVersions.showPanel(key, onRestore);
    };
    container.appendChild(btn);
    return btn;
  }
};

console.log('[Versions] Loaded');
