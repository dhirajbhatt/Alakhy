/* ALAKHY - main.js */
(function () {
  'use strict';

  /* ── LOAD PARTIALS ── */
  function loadPartial(url, targetId) {
    return fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var el = document.getElementById(targetId);
        if (el) el.innerHTML = html;
      });
  }

  /* ── VIEWPORT HEIGHT ── */
  /* --vh = window.innerHeight minus the fixed header height.
     This is the real usable screen per section — the header
     is always visible and must not be counted as free space.
     Called once immediately (header may not exist yet, falls back to 80px)
     and again after partials load when the real header height is known. */
  function makeSetVh() {
    function setVh() {
      var headerEl = document.getElementById('header');
      var headerH  = headerEl ? headerEl.offsetHeight : 80;
      document.documentElement.style.setProperty('--vh', (window.innerHeight - headerH) + 'px');
    }
    setVh();
    window.addEventListener('resize', setVh, { passive: true });
    return setVh; /* return so boot can call it again after partials inject the header */
  }

  /* ── NAV SCROLL BORDER ── */
  function initScrollBorder() {
    var header = document.getElementById('header');
    if (!header) return;
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* ── MOBILE MENU ── */
  function initMobileMenu() {
    var toggle = document.getElementById('navToggle');
    var menu   = document.getElementById('mobileMenu');
    if (!toggle || !menu) return;

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
      if (e.key === 'Escape') {
        menu.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── CONTACT FORM ── */
  function initContactForm() {
    var form    = document.getElementById('contactForm');
    var sendBtn = document.getElementById('sendBtn');
    if (!form || !sendBtn) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name  = form.querySelector('[name="name"]').value.trim();
      var email = form.querySelector('[name="email"]').value.trim();

      if (!name || !email) {
        var orig = sendBtn.textContent;
        sendBtn.textContent = 'Please fill required fields';
        setTimeout(function () { sendBtn.textContent = orig; }, 2500);
        return;
      }

      var endpoint = form.getAttribute('action');
      if (!endpoint || endpoint === '#') {
        sendBtn.textContent = 'Sent. We will be in touch.';
        sendBtn.disabled = true;
        return;
      }

      sendBtn.textContent = 'Sending...';
      sendBtn.disabled = true;

      fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        body: new FormData(form)
      })
        .then(function () {
          sendBtn.textContent = 'Sent. We will be in touch.';
          form.reset();
        })
        .catch(function () {
          sendBtn.textContent = 'Something went wrong. Try email.';
          sendBtn.disabled = false;
        });
    });
  }

  /* ── FULL-PAGE SCROLL ── */
  function initFullPage() {
    /* Only on homepage */
    var isHome = window.location.pathname === '/' ||
                 window.location.pathname === '/index.html' ||
                 window.location.pathname.endsWith('/alakhy-website/') ||
                 window.location.pathname.endsWith('/alakhy-website/index.html');
    if (!isHome) return;

    var sections = Array.from(document.querySelectorAll('main section[id]'));
    if (!sections.length) return;

    var current    = 0;
    var animating  = false;
    var DURATION   = 800; /* ms */

    /* Easing: ease-in-out quart */
    function ease(t) {
      return t < 0.5
        ? 8 * t * t * t * t
        : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }

    function getTop(el) {
      return el.getBoundingClientRect().top + window.scrollY;
    }

    /* Header height used to offset scroll target so sections land
       below the fixed bar, not hidden behind it */
    var headerEl = document.getElementById('header');
    function headerH() { return headerEl ? headerEl.offsetHeight : 0; }

    function goTo(index, immediate) {
      if (index < 0 || index >= sections.length) return;
      if (animating && !immediate) return;

      current   = index;
      animating = true;

      var target    = Math.max(0, getTop(sections[index]) - headerH());
      var startPos  = window.scrollY;
      var distance  = target - startPos;
      var startTime = null;

      if (immediate || distance === 0) {
        window.scrollTo(0, target);
        animating = false;
        updateIndicator(index);
        updateNav(index);
        updateArrows(index);
        return;
      }

      function tick(now) {
        if (!startTime) startTime = now;
        var elapsed  = now - startTime;
        var progress = Math.min(elapsed / DURATION, 1);
        window.scrollTo(0, startPos + distance * ease(progress));
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          animating = false;
          updateIndicator(index);
          updateNav(index);
          updateArrows(index);
        }
      }
      requestAnimationFrame(tick);
    }

    /* ── Active nav ── */
    var sectionLabels = {
      'hero':       'Home',
      'what-we-do': 'What we do',
      'services':   'Services',
      'incubator':  'Incubator',
      'products':   'Products',
      'contact':    'Contact'
    };

    function updateNav(index) {
      var id = sections[index] ? sections[index].id : null;
      document.querySelectorAll('.nav-links a[data-section]').forEach(function (a) {
        a.classList.toggle('nav-active', a.getAttribute('data-section') === id);
      });
    }

    /* ── Section indicator ── */
    var indicator  = document.getElementById('sectionIndicator');
    var hideTimer;

    function updateIndicator(index) {
      if (!indicator) return;
      var id = sections[index] ? sections[index].id : null;
      if (!id || id === 'hero') {
        indicator.classList.remove('visible');
        return;
      }
      clearTimeout(hideTimer);
      indicator.textContent = sectionLabels[id] || id;
      indicator.classList.add('visible');
      hideTimer = setTimeout(function () {
        indicator.classList.remove('visible');
      }, 1800);
    }

    /* ── Floating nav arrows ── */
    var fpNav  = document.createElement('div');
    fpNav.className = 'fp-nav';
    fpNav.innerHTML =
      '<button class="fp-arrow fp-up"   aria-label="Previous section">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="18 15 12 9 6 15"/>' +
        '</svg>' +
      '</button>' +
      '<button class="fp-arrow fp-down" aria-label="Next section">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="6 9 12 15 18 9"/>' +
        '</svg>' +
      '</button>';
    document.body.appendChild(fpNav);

    var fpUp   = fpNav.querySelector('.fp-up');
    var fpDown = fpNav.querySelector('.fp-down');

    /* Dark sections — arrows adapt their background */
    var darkSections = ['incubator'];

    function updateArrows(index) {
      var isDark = darkSections.indexOf(sections[index] ? sections[index].id : '') !== -1;
      [fpUp, fpDown].forEach(function (btn) {
        btn.classList.toggle('dark-bg', isDark);
      });
      /* First section: only down */
      fpUp.classList.toggle('visible',   index > 0);
      /* Last section: only up */
      fpDown.classList.toggle('visible', index < sections.length - 1);
    }

    fpUp.addEventListener('click',   function () { goTo(current - 1); });
    fpDown.addEventListener('click', function () { goTo(current + 1); });

    /* Detect which section is currently in view on load */
    function detectCurrent() {
      var mid = window.scrollY + window.innerHeight / 2;
      for (var i = sections.length - 1; i >= 0; i--) {
        if (getTop(sections[i]) <= mid) { current = i; break; }
      }
      updateNav(current);
      updateArrows(current);
    }
    detectCurrent();

    /* ── Wheel ── */
    var wheelCooldown = false;
    window.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (animating || wheelCooldown) return;
      wheelCooldown = true;
      setTimeout(function () { wheelCooldown = false; }, 100);
      goTo(current + (e.deltaY > 0 ? 1 : -1));
    }, { passive: false });

    /* ── Touch ── */
    /* If a section's content is taller than the viewport (overflows),
       only trigger a section transition when the user has scrolled to
       the top or bottom boundary of that section. Otherwise let the
       browser handle natural scroll within the section. */
    function sectionOverflows(index) {
      var sec = sections[index];
      var usable = window.innerHeight - headerH();
      return sec && sec.scrollHeight > usable + 20;
    }

    var touchY = 0;
    window.addEventListener('touchstart', function (e) {
      touchY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', function (e) {
      var diff = touchY - e.changedTouches[0].clientY;
      if (Math.abs(diff) < 50) return;

      if (sectionOverflows(current)) {
        /* Only transition at the boundaries of the overflowing section */
        var sec      = sections[current];
        var secTop   = getTop(sec);
        var secBot   = secTop + sec.scrollHeight;
        var viewBot  = window.scrollY + window.innerHeight;

        if (diff > 0 && viewBot >= secBot - 30) {
          goTo(current + 1); /* reached bottom — go to next */
        } else if (diff < 0 && window.scrollY <= secTop + 30) {
          goTo(current - 1); /* reached top — go to prev */
        }
        /* else: mid-section scroll — let browser handle it naturally */
      } else {
        goTo(current + (diff > 0 ? 1 : -1));
      }
    }, { passive: true });

    /* Keep `current` accurate during natural scroll on mobile
       (fires when browser scrolls within an overflowing section) */
    window.addEventListener('scroll', function () {
      if (animating) return;
      var mid = window.scrollY + window.innerHeight / 2;
      for (var i = sections.length - 1; i >= 0; i--) {
        if (getTop(sections[i]) <= mid) {
          if (current !== i) {
            current = i;
            updateNav(i);
            updateArrows(i);
          }
          break;
        }
      }
    }, { passive: true });

    /* ── Keyboard ── */
    window.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goTo(current + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(current - 1);
      }
    });

    /* ── Nav link clicks ── */
    document.querySelectorAll('.nav-links a[data-section], .mobile-menu a[data-section]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id  = a.getAttribute('data-section');
        var idx = sections.findIndex(function (s) { return s.id === id; });
        if (idx !== -1) {
          e.preventDefault();
          goTo(idx);
        }
      });
    });

    /* ── Hero CTA links ── */
    document.querySelectorAll('a[href="#what-we-do"], a[href="#services"], a[href="#incubator"], a[href="#products"], a[href="#contact"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var hash = a.getAttribute('href').replace('#', '');
        var idx  = sections.findIndex(function (s) { return s.id === hash; });
        if (idx !== -1) {
          e.preventDefault();
          goTo(idx);
        }
      });
    });
  }

  /* ── BOOT ── */
  var setVh = makeSetVh(); /* run immediately with 80px header fallback */

  Promise.all([
    loadPartial('/assets/partials/nav.html',    'nav-root'),
    loadPartial('/assets/partials/footer.html', 'footer-root')
  ]).then(function () {
    setVh(); /* recalculate now that the real header is in the DOM */
    initScrollBorder();
    initMobileMenu();
    initContactForm();
    initFullPage();
  });

}());
