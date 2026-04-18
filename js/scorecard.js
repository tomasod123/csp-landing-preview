/* ============================================================
 * CSP Scorecard · interactive self-assessment
 * Vanilla JS, no framework. Updates score, revenue-leak estimate,
 * and primary CTA URL live as the user drags sliders.
 * ============================================================ */
(function () {
  'use strict';

  var root = document.getElementById('csp-scorecard');
  if (!root) return;

  var rows       = root.querySelectorAll('.sc-row');
  var scoreEl    = document.getElementById('sc-score-val');
  var barEl      = document.getElementById('sc-bar');
  var estLblEl   = document.getElementById('sc-estimate-label');
  var estNumEl   = document.getElementById('sc-est-num');
  var estSufEl   = document.getElementById('sc-est-suf');
  var estCapEl   = document.getElementById('sc-estimate-cap');
  var ctaEl      = document.getElementById('sc-cta');

  var MAX        = rows.length * 5;         // 35
  var STORE_KEY  = 'csp-scorecard-v1';
  var CTA_BASE   = 'https://book.clinicsuccesspartners.com/schedule-call';
  var CTA_UTMS   = 'utm_source=csp_homepage&utm_medium=organic&utm_campaign=vsl_v1';

  function formatDollar(n) {
    if (n >= 1000) {
      return '~$' + Math.round(n / 1000).toLocaleString() + 'k';
    }
    return '~$' + n.toLocaleString();
  }

  function computeEstimate(score) {
    // Every point below max maps to ~$2,000/mo structural loss
    // Floor at $2k, ceiling at $60k for display sanity
    var gap = Math.max(0, MAX - score);
    var est = gap * 2000;
    if (est < 2000 && gap > 0) est = 2000;
    if (est > 60000) est = 60000;
    // Round to nearest $500
    return Math.round(est / 500) * 500;
  }

  function tierLabel(score) {
    if (score <= 14) return 'red';
    if (score <= 24) return 'amber';
    return 'green';
  }

  function ctaCopy(est, score) {
    if (score >= 30) {
      return 'Pressure-test my system →';
    }
    if (est <= 0) return 'Book a diagnostic call →';
    return 'Find where my ' + formatDollar(est) + '/mo is leaking →';
  }

  function update() {
    var total = 0;
    rows.forEach(function (row) {
      var input = row.querySelector('input[type="range"]');
      var val   = row.querySelector('.sc-val');
      var v     = parseInt(input.value, 10) || 0;
      val.textContent = v;
      total += v;
    });

    // Update score number
    if (scoreEl) scoreEl.textContent = total;

    // Update bar
    if (barEl) {
      var pct = Math.max(2, Math.round((total / MAX) * 100));
      barEl.style.width = pct + '%';
      barEl.classList.remove('amber', 'green');
      var tier = tierLabel(total);
      if (tier === 'amber') barEl.classList.add('amber');
      if (tier === 'green') barEl.classList.add('green');
    }

    // Update estimate (textContent only , no innerHTML to avoid XSS footgun)
    var est = computeEstimate(total);
    if (est <= 0) {
      if (estNumEl) estNumEl.textContent = 'Dialed in';
      if (estSufEl) estSufEl.textContent = ' · ship-ready';
      if (estLblEl) estLblEl.textContent = 'No structural leak detected';
      if (estCapEl) estCapEl.textContent = 'Operators at this score usually want a 12-month growth/exit plan. Book a scope call.';
    } else {
      if (estNumEl) estNumEl.textContent = formatDollar(est);
      if (estSufEl) estSufEl.textContent = '/mo';
      if (estLblEl) estLblEl.textContent = 'Estimated monthly revenue leak';
      if (estCapEl) estCapEl.textContent = 'Every point below 35 maps to roughly $2k/mo of structural revenue loss. The diagnostic shows you exactly where it leaks.';
    }

    // Update CTA
    if (ctaEl) {
      ctaEl.textContent = ctaCopy(est, total);
      var utmContent = 'scorecard_' + total;
      var estParam = est > 0 ? '&est=' + est : '';
      ctaEl.href = CTA_BASE + '?' + CTA_UTMS + '&utm_content=' + utmContent + '&score=' + total + estParam;
    }

    // Persist
    try {
      var state = {};
      rows.forEach(function (row) {
        var key = row.getAttribute('data-sc');
        var input = row.querySelector('input[type="range"]');
        state[key] = parseInt(input.value, 10);
      });
      sessionStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) { /* private mode etc */ }
  }

  // Restore state
  try {
    var saved = sessionStorage.getItem(STORE_KEY);
    if (saved) {
      var state = JSON.parse(saved);
      rows.forEach(function (row) {
        var key = row.getAttribute('data-sc');
        var input = row.querySelector('input[type="range"]');
        if (state[key] != null) input.value = state[key];
      });
    }
  } catch (e) { /* ignore */ }

  // Wire up listeners
  rows.forEach(function (row) {
    var input = row.querySelector('input[type="range"]');
    input.addEventListener('input', update);
    input.addEventListener('change', update);
  });

  // Initial render
  update();
})();
