/* ============================================================
 * CSP MOTION LIBRARY — v5
 *
 * Drop into any page: <script src="motion.js" defer></script>
 *
 * Automatically wires the v5 motion doctrine PLUS a set of
 * Webflow-grade opt-in animations (stagger, tilt, arrow-slide,
 * text-reveal, marquee, gradient-cursor-follow).
 *
 * All animations are opt-in via data attributes or class names.
 * Respects prefers-reduced-motion automatically.
 * ============================================================ */

(function () {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- CURSOR-MAGNETIC BUTTONS ----------
  // Usage: <a class="btn-primary magnetic">...</a>
  // Or any element with data-magnetic attribute.
  // Optional: data-magnetic-strength="0.3" (default 0.2)
  function initMagnetic() {
    if (reducedMotion) return;
    document.querySelectorAll('.magnetic, [data-magnetic]').forEach(el => {
      const strength = parseFloat(el.dataset.magneticStrength) || 0.2;
      el.style.willChange = 'transform';
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * strength}px, ${y * strength - 1}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // ---------- COUNT-UP NUMBERS ----------
  // Usage: <span class="count" data-count="184" data-prefix="$" data-suffix="k">$0k</span>
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = parseInt(el.dataset.duration) || 1100;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(target * eased);
      el.textContent = `${prefix}${v.toLocaleString()}${suffix}`;
      if (p < 1) requestAnimationFrame(step);
    };
    if (reducedMotion) {
      el.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
      return;
    }
    requestAnimationFrame(step);
  }

  // ---------- SPARKLINE DRAW-ON-VIEW ----------
  // Usage: <svg class="spark"><path d="..." /></svg>
  // CSS handles the animation via .drawn class; we just add it.

  // ---------- REVEAL-ON-SCROLL ----------
  // Usage: <div class="reveal">...</div>
  // CSS: .reveal { opacity:0; transform:translateY(12px); }
  //      .reveal.revealed { opacity:1; transform:translateY(0); }

  // Shared IntersectionObserver
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.classList.contains('count')) countUp(el);
      if (el.classList.contains('spark')) el.classList.add('drawn');
      if (el.classList.contains('reveal')) el.classList.add('revealed');
      if (el.classList.contains('stagger')) {
        Array.from(el.children).forEach((child, i) => {
          child.style.transitionDelay = `${i * 80}ms`;
          child.classList.add('stagger-in');
        });
      }
      if (el.classList.contains('text-reveal')) {
        el.classList.add('text-reveal-in');
      }
      io.unobserve(el);
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -60px 0px' });

  function initObservers() {
    document.querySelectorAll('.count, .spark, .reveal, .stagger, .text-reveal')
      .forEach(el => io.observe(el));
  }

  // ---------- TILT ON HOVER ----------
  // Usage: <div class="tilt">...</div>
  // Optional: data-tilt-max="8" (default 6 deg)
  function initTilt() {
    if (reducedMotion) return;
    document.querySelectorAll('.tilt, [data-tilt]').forEach(el => {
      const max = parseFloat(el.dataset.tiltMax) || 6;
      el.style.willChange = 'transform';
      el.style.transition = 'transform 0.2s cubic-bezier(0.4,0,0.2,1)';
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const rx = (py - 0.5) * -max;
        const ry = (px - 0.5) * max;
        el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // ---------- ARROW-SLIDE ON PRIMARY CTAS ----------
  // Usage: <a class="btn arrow-slide">Book <span class="arrow">→</span></a>
  // CSS handles the animation; no JS needed except to mark hover state.
  // Keeping this as pure CSS in the stylesheet — no JS handler required.

  // ---------- GRADIENT-CURSOR-FOLLOW ----------
  // Usage: <section data-gradient-cursor>...</section>
  // Creates a radial blue glow that follows the mouse within the section.
  function initGradientCursor() {
    if (reducedMotion) return;
    document.querySelectorAll('[data-gradient-cursor]').forEach(el => {
      el.style.position = el.style.position || 'relative';
      const glow = document.createElement('div');
      glow.className = 'csp-cursor-glow';
      glow.style.cssText = `
        position: absolute; top: 0; left: 0;
        width: 400px; height: 400px; border-radius: 50%;
        background: radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 65%);
        pointer-events: none; transform: translate(-50%,-50%);
        transition: opacity 0.3s; opacity: 0; z-index: 0;
      `;
      el.appendChild(glow);
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        glow.style.left = `${e.clientX - rect.left}px`;
        glow.style.top  = `${e.clientY - rect.top}px`;
        glow.style.opacity = '1';
      });
      el.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
    });
  }

  // ---------- MARQUEE (infinite horizontal scroll) ----------
  // Usage: <div class="marquee"><div class="track">...items...</div></div>
  // Clones track contents to enable seamless loop.
  function initMarquee() {
    document.querySelectorAll('.marquee').forEach(m => {
      const track = m.querySelector('.track');
      if (!track) return;
      track.innerHTML = track.innerHTML + track.innerHTML; // duplicate for loop
    });
  }

  // ---------- INIT ----------
  function init() {
    initMagnetic();
    initTilt();
    initGradientCursor();
    initMarquee();
    initObservers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
