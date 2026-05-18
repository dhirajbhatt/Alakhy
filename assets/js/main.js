/* ============================================================
   ALAKHY — main.js
   Vanilla JS only. No dependencies.
   ============================================================ */

(function () {
  'use strict';

  /* ── THEME TOGGLE ───────────────────────────────────── */
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  // On load: apply saved preference
  var savedTheme = localStorage.getItem('alakhy-theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var isDark = root.getAttribute('data-theme') === 'dark' ||
        (!root.getAttribute('data-theme') &&
         window.matchMedia('(prefers-color-scheme: dark)').matches);
      var next = isDark ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('alakhy-theme', next);
    });
  }

  /* ── NAV PIN ─────────────────────────────────────────── */
  const nav = document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('pinned', window.scrollY > 12);
    }, { passive: true });
  }

  /* ── MOBILE MENU ─────────────────────────────────────── */
  const toggle  = document.getElementById('mobileToggle');
  const overlay = document.getElementById('navOverlay');
  const label   = toggle ? toggle.querySelector('.nav-menu-label') : null;

  function openOverlay() {
    overlay.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    if (label) label.textContent = 'Close';
    document.body.style.overflow = 'hidden';
  }
  function closeOverlay() {
    overlay.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    if (label) label.textContent = 'Menu';
    document.body.style.overflow = '';
  }

  if (toggle && overlay) {
    toggle.addEventListener('click', function () {
      overlay.classList.contains('open') ? closeOverlay() : openOverlay();
    });
    overlay.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeOverlay);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay();
    });
  }

  /* ── SCROLL REVEAL ───────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(function (el) {
    if (el.closest('.hero')) {
      const delayClass = el.className.match(/reveal-d(\d)/);
      const step = delayClass ? parseInt(delayClass[1], 10) : 0;
      setTimeout(function () { el.classList.add('visible'); }, 180 + step * 120);
    } else {
      observer.observe(el);
    }
  });

  /* ── ENQUIRY FORM ────────────────────────────────────── */
  const form   = document.getElementById('enquiryForm');
  const sendBtn = document.getElementById('sendBtn');

  if (form && sendBtn) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const name    = form.querySelector('[name="name"]').value.trim();
      const email   = form.querySelector('[name="email"]').value.trim();
      const nature  = form.querySelector('[name="nature"]').value;
      const context = form.querySelector('[name="context"]').value.trim();

      if (!name || !email || !nature || !context) {
        const orig = sendBtn.textContent;
        sendBtn.textContent = 'Please fill in all fields';
        setTimeout(function () { sendBtn.textContent = orig; }, 2500);
        return;
      }

      const endpoint = form.getAttribute('action');

      if (!endpoint || endpoint === '#') {
        sendBtn.textContent = "Sent — we'll be in touch";
        sendBtn.disabled = true;
        return;
      }

      sendBtn.textContent = 'Sending\u2026';
      sendBtn.disabled = true;

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
        .then(function (res) {
          if (res.ok) {
            sendBtn.textContent = "Sent — we'll be in touch";
            form.reset();
          } else {
            sendBtn.textContent = 'Something went wrong — try email';
            sendBtn.disabled = false;
          }
        })
        .catch(function () {
          sendBtn.textContent = 'Something went wrong — try email';
          sendBtn.disabled = false;
        });
    });
  }

}());
