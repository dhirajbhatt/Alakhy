/* ============================================================
   ALAKHY - main.js
   ============================================================ */

(function () {
  'use strict';

  /* ── THEME TOGGLE ── */
  var themeToggle = document.getElementById('themeToggle');
  var root = document.documentElement;

  (function initTheme() {
    var saved = localStorage.getItem('alakhy-theme');
    if (saved) {
      root.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
  }());

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('alakhy-theme', next);
    });
  }

  /* ── NAV PIN ── */
  var nav = document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('pinned', window.scrollY > 12);
    }, { passive: true });
  }

  /* ── MOBILE MENU ── */
  var toggle = document.getElementById('navToggle');
  var menu   = document.getElementById('mobileMenu');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── SCROLL REVEAL ── */
  var els = document.querySelectorAll('.fade-up');
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

  els.forEach(function (el) {
    if (el.closest('.hero')) {
      var delay = parseInt((el.className.match(/delay-(\d)/) || [, 0])[1], 10);
      setTimeout(function () { el.classList.add('visible'); }, 100 + delay * 80);
    } else {
      observer.observe(el);
    }
  });

  /* Reveal all visible elements after anchor-link navigation (instant jump bypasses IntersectionObserver) */
  function revealInView() {
    document.querySelectorAll('.fade-up:not(.visible)').forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('visible');
      }
    });
  }

  window.addEventListener('hashchange', function () {
    setTimeout(revealInView, 50);
  });

  /* Also reveal on nav link clicks before the scroll completes */
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function (a) {
    a.addEventListener('click', function () {
      setTimeout(revealInView, 100);
      setTimeout(revealInView, 400);
    });
  });

  /* ── CONTACT FORM ── */
  var form    = document.getElementById('contactForm');
  var sendBtn = document.getElementById('sendBtn');

  if (form && sendBtn) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name  = form.querySelector('[name="name"]').value.trim();
      var email = form.querySelector('[name="email"]').value.trim();
      var type  = form.querySelector('[name="engagementType"]').value;

      if (!name || !email || !type) {
        var orig = sendBtn.textContent;
        sendBtn.textContent = 'Please fill required fields';
        setTimeout(function () { sendBtn.textContent = orig; }, 2500);
        return;
      }

      var endpoint = form.getAttribute('action');
      if (!endpoint || endpoint === '#') {
        sendBtn.textContent = "Sent. We will be in touch.";
        sendBtn.disabled = true;
        return;
      }

      sendBtn.textContent = 'Sending...';
      sendBtn.disabled = true;

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
        .then(function (res) {
          if (res.ok) {
            sendBtn.textContent = "Sent. We will be in touch.";
            form.reset();
          } else {
            sendBtn.textContent = 'Something went wrong. Try email.';
            sendBtn.disabled = false;
          }
        })
        .catch(function () {
          sendBtn.textContent = 'Something went wrong. Try email.';
          sendBtn.disabled = false;
        });
    });
  }

}());
