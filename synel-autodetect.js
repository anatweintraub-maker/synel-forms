/* ============================================================================
 * synel-autodetect.js — מנוע זיהוי שדות אוטומטי ממסמך סרוק
 * ----------------------------------------------------------------------------
 * מקבל תמונת מסמך ומחזיר רשימת שדות מזוהים, מוכנה ל-Form Studio.
 *
 * השלבים:
 *   1. זיהוי קווים תחתונים מהפיקסלים  → "איפה" כל מקום למילוי
 *   2. OCR (Tesseract, אם נטען)        → "מה" התווית ליד כל קו
 *   3. AI (Claude, אופציונלי)          → סיווג סוג חכם
 *
 * שימוש:
 *   const fields = await SynelAutoDetect.detectFields(dataUrl, { ai:false });
 *   // fields = [{ label, type, box:{x,y,w,h} }]   (x,y,w,h באחוזים)
 *
 * סוגי השדות תואמים ל-Form Studio:
 *   text, email, phone, id, address, number, currency,
 *   date, signature, checkbox, readconf, dropdown
 * ========================================================================== */
(function (global) {
  'use strict';

  /* ---------- זיהוי סוג לפי התווית (מחזיר סוגי Form Studio) ---------- */
  function inferType(label) {
    var l = String(label || '').toLowerCase();
    if (/דוא"?ל|אימייל|מייל|email|@/.test(l)) return 'email';
    if (/טלפון|נייד|פלאפון|סלולר|phone/.test(l)) return 'phone';
    if (/ת\.?\s?ז|תעודת\s?זהות|ת״ז|מספר\s?זהות/.test(l)) return 'id';
    if (/עיר|ישוב|יישוב|רחוב|כתובת|מיקוד|מ?עיר/.test(l)) return 'address';
    if (/תאריך|לידה|מ-?תאריך|עד\s?תאריך|יום|חודש|שנה|date/.test(l)) return 'date';
    if (/חתימה|חתום|signature/.test(l)) return 'signature';
    if (/קראתי|אישור|מאשר|הסכמה/.test(l)) return 'readconf';
    if (/סכום|תשלום|שכר|דמי|מחיר|₪/.test(l)) return 'currency';
    if (/מס'|מס׳|מספר|כמות|גיל/.test(l)) return 'number';
    return 'text';
  }

  /* ---------- 1. זיהוי קווים תחתונים מהפיקסלים ---------- */
  function detectUnderlines(dataUrl) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var W = img.naturalWidth, H = img.naturalHeight;
        var scale = Math.min(1, 1400 / W), cw = Math.round(W * scale), ch = Math.round(H * scale);
        var c = document.createElement('canvas'); c.width = cw; c.height = ch;
        var ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, cw, ch);
        var d; try { d = ctx.getImageData(0, 0, cw, ch).data; } catch (e) { resolve([]); return; }

        var minLen = cw * 0.025, raw = [];
        function dark(x, y) { var i = (y * cw + x) * 4; return (d[i] + d[i + 1] + d[i + 2]) / 3 < 120; }
        function bright(x, y) { var i = (y * cw + x) * 4; return (d[i] + d[i + 1] + d[i + 2]) / 3 >= 150; }
        function thickAt(x, y) { var t = 0; for (var dy = 0; dy < 6; dy++) { if (dark(x, y + dy)) t++; else break; } return t; }

        for (var y = 5; y < ch - 8; y++) {
          var run = -1;
          for (var x = 0; x < cw; x++) {
            if (dark(x, y)) { if (run < 0) run = x; }
            else { if (run >= 0) { if (x - run >= minLen) checkLine(run, x, y); run = -1; } }
          }
          if (run >= 0 && cw - run >= minLen) checkLine(run, cw, y);
        }
        function checkLine(x0, x1, y) {
          var step = Math.max(1, Math.floor((x1 - x0) / 18));
          var thickSum = 0, samples = 0;
          for (var tx = x0; tx < x1; tx += step) { thickSum += thickAt(tx, y); samples++; }
          if (thickSum / Math.max(1, samples) > 3) return;          // עבה מדי — קו דקורטיבי
          var clearAbove = 0, total = 0;
          for (var sx = x0; sx < x1; sx += step) { total++; if (bright(sx, y - 5) && bright(sx, y - 9) && bright(sx, y - 13)) clearAbove++; }
          if (total > 2 && clearAbove / total > 0.85) raw.push({ x: x0, y: y, w: x1 - x0 });
        }

        // מיזוג רק קווים שכמעט נוגעים — קווים נפרדים נשארים נפרדים
        raw.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
        var merged = [];
        raw.forEach(function (l) {
          var m = null;
          for (var k = 0; k < merged.length; k++) {
            var e = merged[k];
            var touch = l.x < e.x + e.w + cw * 0.015 && l.x + l.w > e.x - cw * 0.015;
            if (Math.abs(e.y - l.y) < ch * 0.01 && touch) { m = e; break; }
          }
          if (m) { var nx = Math.min(m.x, l.x), nr = Math.max(m.x + m.w, l.x + l.w); m.x = nx; m.w = nr - nx; m.y = Math.max(m.y, l.y); }
          else merged.push({ x: l.x, y: l.y, w: l.w });
        });
        resolve(merged.map(function (l) { return { x: l.x / cw * 100, y: l.y / ch * 100, w: l.w / cw * 100 }; }));
      };
      img.onerror = function () { resolve([]); };
      img.src = dataUrl;
    });
  }

  /* ---------- מימדי תמונה ---------- */
  function imageDims(dataUrl) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
      img.onerror = function () { resolve({ w: 1000, h: 1400 }); };
      img.src = dataUrl;
    });
  }

  /* ---------- 2. OCR עם Tesseract (אם נטען) ---------- */
  function ocrWords(dataUrl) {
    if (!global.Tesseract) return Promise.resolve([]);
    return global.Tesseract.recognize(dataUrl, 'heb')
      .then(function (res) { return (res && res.data && res.data.words) ? res.data.words : []; })
      .catch(function () { return []; });
  }

  /* ---------- בניית שדות: מיקום מהקו, תווית מהמילה שמימין ---------- */
  function buildFromLines(lines, words, imgW, imgH) {
    var W = (words || []).map(function (w) {
      var b = w.bbox || {};
      return { t: String(w.text || '').trim(), x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 };
    }).filter(function (w) { return w.t && typeof w.x0 === 'number'; });

    return lines.map(function (ln) {
      var lineYpx = ln.y / 100 * imgH, lineRightPx = (ln.x + ln.w) / 100 * imgW;
      var cand = W.filter(function (w) {
        var cy = (w.y0 + w.y1) / 2;
        return Math.abs(cy - lineYpx) < imgH * 0.018 && w.x0 >= lineRightPx - imgW * 0.02;
      }).sort(function (a, b) { return a.x0 - b.x0; });
      var label = cand.length ? cand[0].t.replace(/[:：]$/, '').trim() : 'שדה';
      return { label: label, type: inferType(label), box: { x: ln.x, y: Math.max(0, ln.y - 2.4), w: ln.w, h: 2.2 } };
    });
  }

  /* ---------- 3. AI אופציונלי: סיווג סוגים חכם (Claude) ---------- */
  function aiClassify(dataUrl) {
    var prompt = 'List the fillable fields in this Hebrew form. For each return "label" (exact Hebrew label text) and "type" (one of: text,email,phone,id,address,number,currency,date,signature,checkbox,readconf,dropdown). Return ONLY JSON: {"fields":[{"label":"","type":""}]}';
    var base64 = dataUrl.split(',')[1];
    var media = dataUrl.substring(5, dataUrl.indexOf(';'));
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6', max_tokens: 2048,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: media, data: base64 } },
          { type: 'text', text: prompt }
        ] }]
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (data) {
      var text = (data.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
      return (JSON.parse(text.replace(/```json|```/g, '').trim()).fields) || [];
    });
  }

  /* ---------- הפונקציה הראשית ---------- */
  // opts: { ocr:true, ai:false }
  async function detectFields(dataUrl, opts) {
    opts = opts || {};
    var dims = await imageDims(dataUrl);
    var lines = await detectUnderlines(dataUrl);
    var words = (opts.ocr !== false) ? await ocrWords(dataUrl) : [];
    var fields = buildFromLines(lines, words, dims.w, dims.h);

    // אם מבקשים AI — נשפר את הסוגים לפי התאמת תוויות
    if (opts.ai) {
      try {
        var aiFields = await aiClassify(dataUrl);
        fields.forEach(function (f) {
          var match = aiFields.find(function (a) {
            return a.label && f.label && (a.label.indexOf(f.label) >= 0 || f.label.indexOf(a.label) >= 0);
          });
          if (match && match.type) f.type = match.type;
        });
      } catch (e) { /* אם AI לא זמין — ממשיכים עם הסוגים מ-inferType */ }
    }
    return fields;
  }

  global.SynelAutoDetect = {
    detectFields: detectFields,
    detectUnderlines: detectUnderlines,
    inferType: inferType
  };

})(typeof window !== 'undefined' ? window : this);
