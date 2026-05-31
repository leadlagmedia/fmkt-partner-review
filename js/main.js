/* FMKT prototype — shared interactions.
   COMPLIANCE: No analytics, no social pixels, no external form submission.
   The advisor form is intentionally INERT — it never POSTs anywhere; it only
   shows an on-page acknowledgement so reviewers can see the intended UX. */

(function () {
  /* ---- Temporary static review gate ----
     SECURITY NOTE: This is a lightweight client-side gate for short-term partner review,
     not server-side authentication. */
  const PASSWORD_HASH = 'dab442b95b5a717f2c9dbea946f5dafa763e14aaad9702fdce68347e2023a160';
  const gate = document.querySelector('[data-review-gate]');
  const reviewForm = document.querySelector('[data-review-form]');
  const reviewPassword = document.querySelector('[data-review-password]');
  const reviewError = document.querySelector('[data-review-error]');
  const AUTH_KEY = '__Host-fmkt-review-ok';

  async function sha256Hex(value) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  function unlock() {
    document.body.classList.remove('auth-locked');
    if (gate) gate.hidden = true;
  }
  try {
    if (sessionStorage.getItem(AUTH_KEY) === '1') unlock();
  } catch (_) {}
  if (reviewForm && reviewPassword) {
    reviewForm.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      const attempted = await sha256Hex(reviewPassword.value || '');
      if (attempted === PASSWORD_HASH) {
        try { sessionStorage.setItem(AUTH_KEY, '1'); } catch (_) {}
        unlock();
      } else {
        if (reviewError) reviewError.hidden = false;
        reviewPassword.value = '';
        reviewPassword.focus();
      }
    });
  }

  /* ---- Theme toggle (in-memory only; sandboxed iframes block localStorage) ---- */
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', mode);
  const sun = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v2.5M12 20v2.5M4 4l1.8 1.8M18.2 18.2 20 20M1.5 12h2.5M20 12h2.5M4 20l1.8-1.8M18.2 5.8 20 4"/></svg>';
  const moon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>';
  function paint() { if (toggle) toggle.innerHTML = mode === 'dark' ? sun : moon; }
  paint();
  if (toggle) {
    toggle.addEventListener('click', function () {
      mode = mode === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', mode);
      toggle.setAttribute('aria-label', 'Switch to ' + (mode === 'dark' ? 'light' : 'dark') + ' mode');
      paint();
    });
  }

  /* ---- Mobile menu ---- */
  const menuBtn = document.querySelector('[data-menu-btn]');
  const nav = document.querySelector('[data-nav]');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---- Scroll-reveal (progressive enhancement) ----
     Fail-safe: elements are only hidden if JS runs AND motion is allowed.
     A fallback timer guarantees everything becomes visible even if the
     observer never fires (e.g. headless capture, edge browsers). */
  const revealEls = document.querySelectorAll('[data-reveal]');
  function show(el) { el.style.opacity = '1'; el.style.transform = 'none'; }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) {
      el.style.opacity = '0'; el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)';
      io.observe(el);
    });
    // Safety net: reveal anything still hidden after 2.5s.
    setTimeout(function () { revealEls.forEach(show); }, 2500);
  }

  /* ---- Advisor form: INERT, no network call ---- */
  const form = document.querySelector('[data-advisor-form]');
  if (form) {
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault(); // never submits anywhere
      if (status) {
        status.textContent = 'Prototype only — no information is transmitted. In production this request would route to the fund\u2019s advisor relations team.';
        status.classList.add('is-visible');
      }
      form.querySelectorAll('input, textarea, select').forEach(function (f) { if (f.type !== 'submit') f.value = ''; });
    });
  }
})();
