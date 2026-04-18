/* ============================================================
 * CSP Scorecard · interactive self-assessment
 * 10 sliders (1-10 each) → score out of 100.
 * Color-coded tier (red/amber/green), biggest-opportunity readout,
 * currency-aware recovery estimate (USD/GBP/EUR/AUD), dynamic CTA
 * with score + top_gap + optional revenue/currency in UTM.
 * ============================================================ */
(function () {
  'use strict';

  var root = document.getElementById('csp-scorecard');
  if (!root) return;

  var rows          = root.querySelectorAll('.sc-row');
  var revInput      = document.getElementById('sc-revenue-input');
  var currencyInput = document.getElementById('sc-currency-input');
  var scoreBox      = document.getElementById('sc-score');
  var scoreEl       = document.getElementById('sc-score-val');
  var barEl         = document.getElementById('sc-bar');
  var oppLblEl      = document.getElementById('sc-opp-label');
  var oppTitleEl    = document.getElementById('sc-opp-title');
  var oppCopyEl     = document.getElementById('sc-opp-copy');
  var oppSecEl      = document.getElementById('sc-opp-secondary');
  var ctaEl         = document.getElementById('sc-cta');
  var tierBox       = document.getElementById('sc-tier');
  var chips         = root.querySelectorAll('.sc-chip');
  var skipBtn       = document.getElementById('sc-tier-skip');
  var expandBtn     = document.getElementById('sc-expand-btn');
  var rowsBox       = root.querySelector('.sc-rows');

  var MAX       = rows.length * 10; // 10 rows × 10 = 100
  var STORE_KEY = 'csp-scorecard-v4';
  var CTA_BASE  = 'https://book.clinicsuccesspartners.com/schedule-call';
  var CTA_UTMS  = 'utm_source=csp_homepage&utm_medium=organic&utm_campaign=vsl_v3';

  var CURRENCY_SYMBOLS = { USD: '$', GBP: '£', EUR: '€', AUD: 'A$' };

  var CATALOG = {
    speed: {
      label: 'Speed to lead',
      module: 'Speed-to-lead automation',
      copy: function (amt) {
        return 'The average clinic takes 24 to 48 hours to call a new inquiry. 78% of sales go to the vendor who responds first. Installing speed-to-lead automation, every inbound contacted inside 5 minutes, 24/7, typically recovers <strong>' + amt + '</strong> in the first 60 days.';
      },
      pctOfRev: 0.09,
      staticMid: 22000
    },
    conversion: {
      label: 'Website to booked appointment',
      module: 'Conversion architecture',
      copy: function (amt) {
        return 'The average clinic site converts under 2% of visitors into booked consults. Rebuilding the booking path, qualifier, and offer structure typically lifts visit-to-book 2 to 3×, recovering <strong>' + amt + '</strong> in the first 60 days from the same ad spend you are already paying for.';
      },
      pctOfRev: 0.08,
      staticMid: 20000
    },
    attribution: {
      label: 'Lead source attribution',
      module: 'Revenue attribution layer',
      copy: function (amt) {
        return 'The average clinic wastes 20 to 40% of ad spend on channels that never produce a paying patient. Wiring attribution campaign-to-cash typically exposes <strong>' + amt + '</strong> of reallocatable spend inside the first 30 days.';
      },
      pctOfRev: 0.08,
      staticMid: 16000
    },
    frontdesk: {
      label: 'Front desk sales performance',
      module: 'Front-desk scripting and training',
      copy: function (amt) {
        return 'The front desk is where paid leads turn into booked consults, or do not. With installed scripts, call review, and weekly coaching, call-to-book rate typically lifts 25 to 40%, recovering <strong>' + amt + '</strong> per month without adding a single new lead.';
      },
      pctOfRev: 0.10,
      staticMid: 24000
    },
    reactivation: {
      label: 'Patient reactivation',
      module: 'Database reactivation engine',
      copy: function (amt) {
        return 'You have already paid to acquire these patients. A properly segmented reactivation campaign typically produces <strong>' + amt + '</strong> in the first 30 days, most of it inside week two. This is usually the single largest line item in month one.';
      },
      pctOfRev: 0.12,
      staticMid: 30000
    },
    roi: {
      label: 'Marketing ROI visibility',
      module: 'Full-funnel ROI visibility',
      copy: function (amt) {
        return 'Vanity dashboards hide the real leak. Rebuilding reporting around collected revenue per channel typically frees <strong>' + amt + '</strong> of inefficient spend in the first two reporting cycles.';
      },
      pctOfRev: 0.07,
      staticMid: 16000
    },
    integration: {
      label: 'Tech-stack integration',
      module: 'Unified tech stack',
      copy: function (amt) {
        return 'Five tools that do not talk to each other is five places your team loses trust in the data. A single integrated layer typically recovers <strong>' + amt + '</strong> by cutting tool waste, closing handoff gaps, and freeing front-desk hours for actual sales.';
      },
      pctOfRev: 0.05,
      staticMid: 11000
    },
    ltv: {
      label: 'LTV and retention',
      module: 'LTV engine',
      copy: function (amt) {
        return 'Without LTV visibility you price consults wrong and miss cross-sells. Installing LTV tracking per treatment and cross-treatment pathways typically adds <strong>' + amt + '</strong> per month from patients already in the door.';
      },
      pctOfRev: 0.09,
      staticMid: 20000
    },
    reviews: {
      label: 'Reputation and reviews',
      module: 'Authority stack',
      copy: function (amt) {
        return 'Sitting on 40 reviews when the market leader has 500+ is how you lose on Google Maps before a patient even clicks. Installed review workflows and managed response cadence typically recover <strong>' + amt + '</strong> of organic patient flow you are invisible to today.';
      },
      pctOfRev: 0.06,
      staticMid: 13000
    },
    noshow: {
      label: 'No-show and cancellation recovery',
      module: 'No-show recovery flows',
      copy: function (amt) {
        return 'Every missed appointment is revenue you already paid to acquire and prepared to deliver. Predictive ghost-risk scoring plus human-voice recovery typically claws back <strong>' + amt + '</strong> of no-show revenue per month.';
      },
      pctOfRev: 0.09,
      staticMid: 19000
    }
  };

  function readCurrency() {
    return (currencyInput && currencyInput.value) || 'USD';
  }

  function formatAmount(n) {
    var sym = CURRENCY_SYMBOLS[readCurrency()] || '$';
    if (n >= 1000) return '~' + sym + Math.round(n / 1000).toLocaleString() + 'k';
    return '~' + sym + n.toLocaleString();
  }

  /* Tier thresholds on /100 scale:
     red 0–40 · amber 41–70 · green 71–100 */
  function tier(score) {
    if (score <= 40) return 'red';
    if (score <= 70) return 'amber';
    return 'green';
  }

  /* Multiplier on 1-10 per-slider scale */
  function multForScore(s) {
    if (s <= 2) return 1.4;
    if (s <= 4) return 1.0;
    if (s <= 6) return 0.55;
    if (s <= 8) return 0.25;
    return 0;
  }

  function recoveryFor(key, score, revenue) {
    var cat = CATALOG[key];
    if (!cat) return 0;
    var m = multForScore(score);
    var raw = (revenue && revenue > 0)
      ? revenue * cat.pctOfRev * m
      : cat.staticMid * m;
    return Math.round(raw / 500) * 500;
  }

  function readRevenue() {
    if (!revInput || !revInput.value) return 0;
    var n = parseInt(String(revInput.value).replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }

  function pickConstraints() {
    var arr = [];
    rows.forEach(function (row) {
      var key = row.getAttribute('data-sc');
      var input = row.querySelector('input[type="range"]');
      arr.push({ key: key, score: parseInt(input.value, 10) || 5 });
    });
    arr.sort(function (a, b) { return a.score - b.score; });
    return arr;
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

    if (scoreEl) scoreEl.textContent = total;

    var t = tier(total);
    if (scoreBox) {
      scoreBox.classList.remove('tier-red', 'tier-amber', 'tier-green');
      scoreBox.classList.add('tier-' + t);
    }

    if (barEl) {
      var pct = Math.max(2, Math.round((total / MAX) * 100));
      barEl.style.width = pct + '%';
      barEl.classList.remove('amber', 'green');
      if (t === 'amber') barEl.classList.add('amber');
      if (t === 'green') barEl.classList.add('green');
    }

    var revenue = readRevenue();
    var constraints = pickConstraints();
    var primary = constraints[0];
    var secondary = constraints[1];

    if (total >= 85) {
      if (oppLblEl)   oppLblEl.textContent = 'Scorecard read';
      if (oppTitleEl) oppTitleEl.textContent = 'Mostly dialed in';
      if (oppCopyEl)  oppCopyEl.innerHTML = 'At this score the structural leaks are small. The conversation is usually about <strong>a 12-month growth or exit plan</strong>, not firefighting operational gaps. Book a scoping call.';
      if (oppSecEl)   oppSecEl.innerHTML = 'Next step: <strong>strategic scope call</strong>';
    } else if (primary) {
      var pc = CATALOG[primary.key];
      var est = recoveryFor(primary.key, primary.score, revenue);
      var estStr = est > 0 ? formatAmount(est) : 'a 5-figure monthly lift';
      if (oppLblEl)   oppLblEl.textContent = 'Your biggest opportunity';
      if (oppTitleEl) oppTitleEl.textContent = pc.label;
      if (oppCopyEl)  oppCopyEl.innerHTML = pc.copy(estStr);
      if (oppSecEl && secondary) {
        var sc = CATALOG[secondary.key];
        oppSecEl.innerHTML = 'Secondary opportunity: <strong>' + sc.module + '</strong>';
      }
    }

    if (ctaEl) {
      var label;
      if (total >= 85) {
        label = 'Book a strategic scope call →';
      } else if (primary) {
        label = 'Fix my ' + CATALOG[primary.key].label.toLowerCase() + ' →';
      } else {
        label = 'Book a clinic roadmap call →';
      }
      ctaEl.textContent = label;
      var utmContent = 'scorecard_' + total + (primary ? '_' + primary.key : '');
      var href = CTA_BASE + '?' + CTA_UTMS + '&utm_content=' + utmContent + '&score=' + total;
      if (primary) href += '&top_gap=' + primary.key;
      if (revenue > 0) href += '&rev=' + revenue + '&cur=' + readCurrency();
      ctaEl.href = href;
    }

    try {
      var state = { rev: revenue, cur: readCurrency() };
      rows.forEach(function (row) {
        var key = row.getAttribute('data-sc');
        var input = row.querySelector('input[type="range"]');
        state[key] = parseInt(input.value, 10);
      });
      sessionStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) { /* private mode etc */ }
  }

  // Restore
  try {
    var saved = sessionStorage.getItem(STORE_KEY);
    if (saved) {
      var state = JSON.parse(saved);
      rows.forEach(function (row) {
        var key = row.getAttribute('data-sc');
        var input = row.querySelector('input[type="range"]');
        if (state[key] != null) input.value = state[key];
      });
      if (state.rev && revInput) revInput.value = state.rev;
      if (state.cur && currencyInput) currencyInput.value = state.cur;
    }
  } catch (e) { /* ignore */ }

  // Wire sliders + revenue + currency
  rows.forEach(function (row) {
    var input = row.querySelector('input[type="range"]');
    input.addEventListener('input', update);
    input.addEventListener('change', update);
  });
  if (revInput) {
    revInput.addEventListener('input', update);
    revInput.addEventListener('change', update);
  }
  if (currencyInput) {
    currencyInput.addEventListener('change', update);
  }

  /* Two-tier UX:
     - Initial state: .sc-rows is hidden (locked), chips visible
     - Pick 3 chips → reveal those 3 rows (still "locked" = only selected shown)
     - "Score all 10" button or skip link → unlock all rows */
  function enterLockedMode() {
    if (rowsBox) rowsBox.classList.add('sc-locked');
  }
  function exitLockedMode() {
    if (rowsBox) rowsBox.classList.remove('sc-locked');
    rows.forEach(function (r) { r.classList.remove('sc-selected'); });
  }
  function refreshLockedRows() {
    var selected = [];
    chips.forEach(function (c) {
      if (c.classList.contains('active')) selected.push(c.getAttribute('data-target'));
    });
    rows.forEach(function (row) {
      var key = row.getAttribute('data-sc');
      if (selected.indexOf(key) !== -1) row.classList.add('sc-selected');
      else row.classList.remove('sc-selected');
    });
  }
  function countActive() {
    var n = 0;
    chips.forEach(function (c) { if (c.classList.contains('active')) n++; });
    return n;
  }

  // Start locked
  enterLockedMode();

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var isActive = chip.classList.contains('active');
      if (!isActive && countActive() >= 3) return; // max 3
      chip.classList.toggle('active');
      refreshLockedRows();
      if (countActive() === 3) {
        // Smooth scroll to first selected row
        var firstSel = root.querySelector('.sc-row.sc-selected');
        if (firstSel) firstSel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  if (skipBtn) {
    skipBtn.addEventListener('click', function () {
      exitLockedMode();
      if (tierBox) tierBox.style.display = 'none';
    });
  }
  if (expandBtn) {
    expandBtn.addEventListener('click', function () {
      exitLockedMode();
    });
  }

  update();
})();
