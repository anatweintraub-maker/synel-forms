/* SYNEL FORM VALIDATION
   Add to all templates: <script src="synel-validation.js"></script>
*/

var SynelValidation = {

  rules: {
    text:     function(v){ return v.trim().length > 0; },
    email:    function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
    tel:      function(v){ return /^(\+972|0)([23489]|5[0-9]|77)[0-9]{7}$/.test(v.replace(/[-\s]/g,'')); },
    id:       function(v){ return SynelValidation.validateIsraeliID(v.trim()); },
    number:   function(v){ return !isNaN(parseFloat(v)) && isFinite(v); },
    date:     function(v){ var d=new Date(v); return !isNaN(d.getTime()); },
    passport: function(v){ return /^[A-Z0-9]{6,12}$/.test(v.trim().toUpperCase()); },
  },

  messages: {
    text:     'שדה חובה',
    email:    'כתובת אימייל לא תקינה',
    tel:      'מספר טלפון לא תקין (לדוגמה: 050-1234567)',
    id:       'מספר תעודת זהות לא תקין',
    number:   'יש להזין מספר',
    date:     'תאריך לא תקין',
    passport: 'מספר דרכון לא תקין',
    required: 'שדה חובה',
  },

  // Israeli ID check digit algorithm
  validateIsraeliID: function(id) {
    id = String(id).trim();
    if (!/^\d{5,9}$/.test(id)) return false;
    id = id.padStart(9, '0');
    var sum = 0;
    for (var i = 0; i < 9; i++) {
      var digit = parseInt(id[i]);
      var val = digit * ((i % 2) + 1);
      sum += val > 9 ? val - 9 : val;
    }
    return sum % 10 === 0;
  },

  // Detect field type from dbField name
  detectType: function(dbField, inputType) {
    if (!dbField) return inputType || 'text';
    var lc = dbField.toLowerCase();
    if (lc === 'tz' || lc.indexOf('passportno') > -1) return 'id';
    if (lc.indexOf('mail') > -1 || lc === 'emp_contact_002') return 'email';
    if (lc.indexOf('contact_00') > -1 && lc !== 'emp_contact_002') return 'tel';
    if (lc.indexOf('date') > -1) return 'date';
    if (lc.indexOf('num_') > -1 || lc.indexOf('no') > -1) return 'number';
    return inputType || 'text';
  },

  // Validate single field
  validateField: function(value, type, required) {
    if (!value || !value.trim()) {
      return required ? { valid: false, msg: this.messages.required } : { valid: true };
    }
    var rule = this.rules[type];
    if (!rule) return { valid: true };
    var ok = rule(value);
    return { valid: ok, msg: ok ? '' : (this.messages[type] || 'ערך לא תקין') };
  },

  // Show error on input element
  showError: function(inputEl, msg) {
    inputEl.style.borderColor = '#DC2626';
    inputEl.style.background = '#FEF2F2';
    var errId = 'err_' + inputEl.id;
    var existing = document.getElementById(errId);
    if (existing) existing.remove();
    var err = document.createElement('div');
    err.id = errId;
    err.style.cssText = 'font-size:10px;color:#DC2626;margin-top:2px;';
    err.textContent = msg;
    inputEl.parentNode.insertBefore(err, inputEl.nextSibling);
  },

  // Clear error
  clearError: function(inputEl) {
    inputEl.style.borderColor = '';
    inputEl.style.background = '';
    var errId = 'err_' + inputEl.id;
    var existing = document.getElementById(errId);
    if (existing) existing.remove();
  },

  // Show success
  showSuccess: function(inputEl) {
    inputEl.style.borderColor = '#059669';
    inputEl.style.background = '#F0FDF4';
  },

  // Attach live validation to input
  attachLive: function(inputEl, type, required, dbField) {
    var self = this;
    var detectedType = this.detectType(dbField, type);
    inputEl.addEventListener('blur', function() {
      var result = self.validateField(this.value, detectedType, required);
      if (!result.valid) { self.showError(this, result.msg); }
      else if (this.value.trim()) { self.showSuccess(this); }
      else { self.clearError(this); }
    });
    inputEl.addEventListener('input', function() {
      if (this.style.borderColor === 'rgb(220, 38, 38)') {
        var result = self.validateField(this.value, detectedType, required);
        if (result.valid) { self.clearError(this); if(this.value.trim()) self.showSuccess(this); }
      }
    });
  },

  // Validate entire form - returns {valid, errors[]}
  validateForm: function(fields) {
    var self = this;
    var errors = [];
    fields.forEach(function(f) {
      var inp = document.getElementById('inp_' + f.id);
      if (!inp) return;
      var detectedType = self.detectType(f.dbField, f.type);
      var result = self.validateField(inp.value, detectedType, f.required);
      if (!result.valid) {
        errors.push({ field: f, msg: result.msg });
        self.showError(inp, result.msg);
        inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (inp.value.trim()) {
        self.showSuccess(inp);
      }
    });
    return { valid: errors.length === 0, errors: errors };
  }
};

console.log('[Synel Validation] Loaded');
