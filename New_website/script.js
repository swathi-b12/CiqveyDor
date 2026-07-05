/* ═══════════════════════════════════════════════════════════════
   CENOVA — script.js
   Shared across all pages
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ═══════════════════════
     1. THEME SYSTEM
  ════════════════════════ */
  const THEME_KEY = 'cenova-theme';

  function getSavedTheme() { return localStorage.getItem(THEME_KEY); }
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('aria-pressed', theme === 'dark');
    });
  }

  // Apply before render (no flash)
  applyTheme(getSavedTheme() || getSystemTheme());

  /* ═══════════════════════
     2. DOM READY
  ════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {

    // ── Theme toggle
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    });

    // ── Sticky header shadow
    const header = document.querySelector('.site-header');
    if (header) {
      const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // ── Mobile nav
    const hamburger = document.querySelector('.hamburger');
    const navLinks  = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        const open = hamburger.classList.toggle('open');
        navLinks.classList.toggle('open', open);
        hamburger.setAttribute('aria-expanded', open);
        document.body.style.overflow = open ? 'hidden' : '';
      });
      navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          hamburger.classList.remove('open');
          navLinks.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    // ── Active nav link
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
      if (a.getAttribute('href') === path) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });

    // ── Hero Slider
    initSlider();

    // ── Scroll reveal
    initReveal();

    // ── Voting (Customer Favorite)
    initVoting();

    // ── Future product voting
    initFutureVote();

    // ── Gallery (product detail pages)
    initGallery();

    // ── Contact form
    initContactForm();

    // ── Category tag interactions
    initCategoryTags();

  });

  /* ═══════════════════════
     3. HERO SLIDER
  ════════════════════════ */
  function initSlider() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const track  = hero.querySelector('.slides-track');
    const slides = hero.querySelectorAll('.slide');
    if (!track || !slides.length) return;

    const dotsWrap = hero.querySelector('.slider-dots');
    const counter  = hero.querySelector('.slide-counter');
    const prevBtn  = hero.querySelector('.slider-arrow.prev');
    const nextBtn  = hero.querySelector('.slider-arrow.next');

    let current   = 0;
    let timer     = null;
    const total   = slides.length;
    const DELAY   = 5500;

    // Build dots
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
      });
    }

    function updateUI() {
      slides.forEach((s, i) => s.classList.toggle('active', i === current));
      if (dotsWrap) {
        dotsWrap.querySelectorAll('.slider-dot').forEach((d, i) =>
          d.classList.toggle('active', i === current)
        );
      }
      if (counter) {
        counter.innerHTML = `<strong>${String(current + 1).padStart(2,'0')}</strong> / ${String(total).padStart(2,'0')}`;
      }
      track.style.transform = `translateX(-${current * 100}%)`;
    }

    function goTo(index) {
      current = ((index % total) + total) % total;
      updateUI();
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startTimer() {
      stopTimer();
      timer = setInterval(next, DELAY);
    }
    function stopTimer() { clearInterval(timer); }

    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); startTimer(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { next(); startTimer(); });

    hero.addEventListener('mouseenter', stopTimer);
    hero.addEventListener('mouseleave', startTimer);

    // Touch
    let tx = 0;
    hero.addEventListener('touchstart', e => { tx = e.changedTouches[0].screenX; }, { passive: true });
    hero.addEventListener('touchend', e => {
      const dx = tx - e.changedTouches[0].screenX;
      if (Math.abs(dx) > 50) { dx > 0 ? next() : prev(); startTimer(); }
    }, { passive: true });

    // Keyboard
    hero.setAttribute('tabindex', '0');
    hero.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { next(); startTimer(); }
      if (e.key === 'ArrowLeft')  { prev(); startTimer(); }
    });

    goTo(0);
    startTimer();
  }

  /* ═══════════════════════
     4. SCROLL REVEAL
  ════════════════════════ */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      els.forEach(el => io.observe(el));
    } else {
      els.forEach(el => el.classList.add('visible'));
    }
  }

  /* ═══════════════════════
     5. CUSTOMER VOTE
  ════════════════════════ */
  function initVoting() {
    const voteCards = document.querySelectorAll('.vote-card');
    const submitBtn = document.querySelector('#vote-submit');
    const result    = document.querySelector('#vote-result');
    if (!voteCards.length) return;

    let selected = null;

    voteCards.forEach(card => {
      card.addEventListener('click', () => {
        voteCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selected = card.dataset.product;
      });
    });

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (!selected) { alert('Please select a product first!'); return; }
        submitBtn.textContent = 'Voted! ✓';
        submitBtn.disabled = true;
        if (result) {
          result.style.display = 'block';
          result.textContent = `Thank you! Your vote for "${selected}" has been recorded.`;
        }
      });
    }
  }

  /* ═══════════════════════
     6. FUTURE VOTE
  ════════════════════════ */
  function initFutureVote() {
    const opts = document.querySelectorAll('.future-option');
    const notifyCheck = document.querySelector('#notify-check');
    const emailWrap   = document.querySelector('#email-wrap');
    const submitBtn   = document.querySelector('#future-submit');
    const resultMsg   = document.querySelector('#future-result');

    if (!opts.length) return;

    let selectedFuture = null;

    opts.forEach(opt => {
      opt.addEventListener('click', () => {
        opts.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedFuture = opt.dataset.product;
      });
    });

    if (notifyCheck && emailWrap) {
      notifyCheck.addEventListener('change', () => {
        emailWrap.style.display = notifyCheck.checked ? 'flex' : 'none';
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (!selectedFuture) { alert('Please select a product!'); return; }
        submitBtn.textContent = 'Submitted! ✓';
        submitBtn.disabled = true;
        if (resultMsg) {
          resultMsg.style.display = 'block';
          resultMsg.textContent = `Great choice! We'll consider "${selectedFuture}" for our next launch.`;
        }
      });
    }
  }

  /* ═══════════════════════
     7. GALLERY
  ════════════════════════ */
  function initGallery() {
    const mainImg  = document.querySelector('.gallery-main img');
    const thumbs   = document.querySelectorAll('.gallery-thumb');
    if (!mainImg || !thumbs.length) return;

    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        const src = thumb.querySelector('img')?.src;
        if (src) {
          mainImg.style.opacity = '0';
          mainImg.style.transform = 'scale(0.97)';
          setTimeout(() => {
            mainImg.src = src;
            mainImg.style.opacity = '1';
            mainImg.style.transform = '';
          }, 200);
        }
      });
    });

    // Style transition on main image
    mainImg.style.transition = 'opacity 0.2s, transform 0.2s';
  }

  /* ═══════════════════════
     8. CONTACT FORM
  ════════════════════════ */
  function initContactForm() {
    const form = document.querySelector('#contact-form');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = 'Message Sent ✓';
        btn.disabled = true;
        btn.style.background = '#4caf7d';
      }
      setTimeout(() => {
        form.reset();
        if (btn) { btn.textContent = 'Send Message'; btn.disabled = false; btn.style.background = ''; }
      }, 3000);
    });
  }

  /* ═══════════════════════
     9. CATEGORY TAGS
  ════════════════════════ */
  function initCategoryTags() {
    const tags = document.querySelectorAll('.cat-tag');
    tags.forEach(tag => {
      tag.addEventListener('click', () => {
        tags.forEach(t => t.classList.remove('active-cat'));
        tag.classList.add('active-cat');
      });
    });
  }

})();
