/* Mufti Talha Badar — v3 interactions (vanilla JS) */
(() => {
  'use strict';
  const doc = document;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header shrink -------------------------------------------------------- */
  const header = doc.querySelector('[data-header]');
  const onScroll = () => header && header.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* reveal on scroll ------------------------------------------------------ */
  const revealEls = [...doc.querySelectorAll('[data-reveal], .stagger')];
  if (!REDUCED && 'IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
    /* safety net: content must never stay invisible — everything is on the
       page within 2 seconds of load, whatever the observer does */
    setTimeout(() => {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    }, 1800);
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* stat counters ---------------------------------------------------------- */
  const counters = [...doc.querySelectorAll('[data-count]')];
  const runCount = (el) => {
    const end = Number(el.dataset.count);
    if (REDUCED) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1400;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length && 'IntersectionObserver' in window && !REDUCED) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { runCount(entry.target); io2.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => io2.observe(el));
  } else {
    counters.forEach((el) => { el.textContent = el.dataset.count; });
  }

  /* mobile slide-in panel ---------------------------------------------------- */
  const panel = doc.getElementById('mobile-panel');
  const navToggle = doc.querySelector('.nav-toggle');
  let lastFocus = null;
  const focusables = (root) => [...root.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((n) => n.offsetParent !== null || n === doc.activeElement);
  const openPanel = () => {
    if (!panel) return;
    lastFocus = doc.activeElement;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    navToggle.setAttribute('aria-expanded', 'true');
    doc.body.classList.add('menu-open');
    const f = focusables(panel);
    if (f.length) f[0].focus();
  };
  const closePanel = () => {
    if (!panel || !panel.classList.contains('open')) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    navToggle.setAttribute('aria-expanded', 'false');
    doc.body.classList.remove('menu-open');
    if (lastFocus) lastFocus.focus();
  };
  if (navToggle && panel) {
    navToggle.addEventListener('click', () =>
      panel.classList.contains('open') ? closePanel() : openPanel());
    doc.addEventListener('keydown', (e) => {
      if (!panel.classList.contains('open')) return;
      if (e.key === 'Escape') { closePanel(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables(panel);
      if (!f.length) return;
      if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
  }
  /* mobile accordions */
  doc.querySelectorAll('.sub-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      const sub = doc.getElementById(btn.getAttribute('aria-controls'));
      if (sub) sub.classList.toggle('open', !open);
    });
  });

  /* tabs --------------------------------------------------------------------- */
  doc.querySelectorAll('[data-tabs]').forEach((group) => {
    const tabs = [...group.querySelectorAll('[role="tab"]')];
    const rtl = doc.documentElement.dir === 'rtl';
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = doc.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (e) => {
        let d = 0;
        if (e.key === 'ArrowRight') d = rtl ? -1 : 1;
        else if (e.key === 'ArrowLeft') d = rtl ? 1 : -1;
        else if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); return; }
        else if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); return; }
        else return;
        e.preventDefault();
        select(tabs[(i + d + tabs.length) % tabs.length], true);
      });
    });
    const cur = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
    if (cur) select(cur, false);
  });

  /* filter chips ---------------------------------------------------------------- */
  doc.querySelectorAll('[data-filter-group]').forEach((group) => {
    const chips = [...group.querySelectorAll('.chip')];
    const scope = doc.getElementById(group.dataset.filterGroup) || doc;
    const items = [...scope.querySelectorAll('[data-cat]')];
    chips.forEach((chip) => chip.addEventListener('click', () => {
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      const cat = chip.dataset.filter;
      items.forEach((it) => {
        it.hidden = !(cat === 'all' || (it.dataset.cat || '').split(' ').includes(cat));
      });
    }));
  });

  /* accordion (one open) ------------------------------------------------------------ */
  doc.querySelectorAll('.acc-item').forEach((item) => {
    const trigger = item.querySelector('.acc-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      doc.querySelectorAll('.acc-item.open').forEach((other) => {
        other.classList.remove('open');
        const t = other.querySelector('.acc-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('open', !isOpen);
      trigger.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* quiz ------------------------------------------------------------------------------ */
  const QUIZ = {
    steps: [
      { q: 'Who is the learning for?', opts: ['A teenager', 'A university student', 'A working professional', 'A senior learner'] },
      { q: 'Where are they starting from?', opts: ['Complete beginner', 'Some knowledge already', 'Confident, wants more depth'] },
      { q: 'The main goal?', opts: ['Read the Qur’an correctly', 'Understand fiqh and daily rulings', 'Deepen spirituality and character', 'Academic and historical study'] },
      { q: 'Preferred format?', opts: ['One-to-one lessons', 'A small online group'] }
    ],
    result(answers) {
      const goal = answers[2] || '';
      if (goal.startsWith('Read the Qur'))
        return { course: 'Qur’an & Tajweed', why: 'Nazira reading, the rules of Tajweed and memorisation plans are exactly where this goal begins.', href: 'course.html' };
      if (goal.startsWith('Understand fiqh'))
        return { course: 'Fiqh Essentials', why: 'Purification, prayer, fasting and the rulings of daily life are the heart of this group course.', href: 'teaching.html#programme-2' };
      if (goal.startsWith('Deepen spirituality'))
        return { course: 'Islamic Spirituality & Ethics', why: 'Classical texts on purification of the heart and prophetic character, read within an authorised lineage.', href: 'teaching.html#programme-4' };
      return { course: 'Arabic Foundations', why: 'Grammar, vocabulary and reading for Qur’anic comprehension — the doorway to academic study.', href: 'teaching.html#programme-3' };
    }
  };
  doc.querySelectorAll('[data-quiz]').forEach((host) => {
    const answers = [];
    let step = 0;
    const card = host.classList.contains('quiz-card') ? host : host.querySelector('.quiz-card');
    const label = host.querySelector('.step-label');
    const fill = host.querySelector('.fill');
    const body = host.querySelector('.quiz-body');
    const backBtn = host.querySelector('.quiz-back');
    const render = () => {
      if (!card) return;
      const total = QUIZ.steps.length;
      if (label) label.textContent = `Step ${Math.min(step + 1, total)} of ${total}`;
      if (fill) fill.style.width = `${(step / total) * 100}%`;
      if (backBtn) backBtn.style.visibility = step > 0 ? 'visible' : 'hidden';
      if (step < total) {
        const s = QUIZ.steps[step];
        body.innerHTML = `<p class="quiz-q"></p><div class="quiz-options"></div>`;
        body.querySelector('.quiz-q').textContent = s.q;
        const box = body.querySelector('.quiz-options');
        s.opts.forEach((opt) => {
          const b = doc.createElement('button');
          b.type = 'button';
          b.className = 'quiz-option';
          b.textContent = opt;
          b.addEventListener('click', () => { answers[step] = opt; step += 1; render(); });
          box.appendChild(b);
        });
      } else {
        const r = QUIZ.result(answers);
        if (fill) fill.style.width = '100%';
        if (label) label.textContent = 'Recommended';
        body.innerHTML = `<div class="quiz-result">
          <span class="pill-tag">Recommended course</span>
          <h3 class="quiz-q"></h3>
          <p style="color:var(--ink-2);font-size:15px"></p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px">
            <a class="btn btn-gold" href="course.html">View the course</a>
            <a class="btn btn-outline" href="contact.html">Enquire now</a>
          </div>
          <button type="button" class="text-link quiz-restart">Start again</button>
        </div>`;
        body.querySelector('.quiz-q').textContent = r.course;
        body.querySelector('.quiz-result p').textContent = r.why;
        const rs = body.querySelector('.quiz-restart');
        if (rs) rs.addEventListener('click', () => { answers.length = 0; step = 0; render(); });
      }
    };
    if (card) {
      render();
      if (backBtn) backBtn.addEventListener('click', () => { if (step > 0) { step -= 1; answers.length = step; render(); } });
    }
  });

  /* forms ------------------------------------------------------------------------------ */
  doc.querySelectorAll('form[data-form]').forEach((form) => {
    const status = form.querySelector('.form-status');
    const success = doc.getElementById(form.getAttribute('data-success') || '');
    const setErr = (input, msg) => {
      const holder = doc.getElementById(input.getAttribute('aria-describedby') || '');
      if (holder) holder.textContent = msg || '';
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };
    const validate = (input) => {
      const v = (input.value || '').trim();
      if (input.required && input.type === 'checkbox' && !input.checked) return 'This confirmation is required.';
      if (input.required && !v) return 'This field is required.';
      if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
      return '';
    };
    form.querySelectorAll('input, select, textarea').forEach((input) => {
      input.addEventListener('input', () => setErr(input, ''));
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let bad = null;
      form.querySelectorAll('input, select, textarea').forEach((input) => {
        const msg = validate(input);
        setErr(input, msg);
        if (msg && !bad) bad = input;
      });
      if (status) status.innerHTML = '';
      if (bad) {
        if (status) status.innerHTML = '<p class="err">Please review the highlighted fields.</p>';
        bad.focus();
        return;
      }
      if (success) {
        form.hidden = true;
        success.hidden = false;
        success.setAttribute('tabindex', '-1');
        success.focus();
      } else if (status) {
        status.innerHTML = '<p class="err">Thank you. Your message has been recorded.</p>';
        form.reset();
      }
    });
  });

  /* video facade ------------------------------------------------------------------------ */
  doc.querySelectorAll('[data-video]').forEach((facade) => {
    facade.addEventListener('click', () => {
      const id = facade.getAttribute('data-video');
      if (!id) return;
      const iframe = doc.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      iframe.title = facade.getAttribute('data-title') || 'YouTube video';
      iframe.allow = 'encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      facade.replaceChildren(iframe);
    });
  });

  /* audio bar ------------------------------------------------------------------------------ */
  const audioBar = doc.getElementById('audio-bar');
  if (audioBar) {
    const audio = audioBar.querySelector('audio');
    const playBtn = audioBar.querySelector('.ab-play');
    const seek = audioBar.querySelector('input[type="range"]');
    const timeEl = audioBar.querySelector('.ab-time');
    const titleEl = audioBar.querySelector('.t');
    const closeBtn = audioBar.querySelector('.ab-close');
    const iPlay = audioBar.querySelector('.ic-play');
    const iPause = audioBar.querySelector('.ic-pause');
    const fmt = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');
    const setIcon = (playing) => {
      if (iPlay) iPlay.style.display = playing ? 'none' : 'block';
      if (iPause) iPause.style.display = playing ? 'block' : 'none';
      playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    };
    doc.querySelectorAll('[data-audio]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const src = btn.getAttribute('data-audio');
        if (audio.getAttribute('src') !== src) audio.setAttribute('src', src);
        if (titleEl) titleEl.textContent = btn.getAttribute('data-audio-title') || 'Audio';
        audioBar.hidden = false;
        doc.body.classList.add('has-audio-bar');
        audio.play().catch(() => setIcon(false));
      });
    });
    playBtn.addEventListener('click', () => (audio.paused ? audio.play().catch(() => {}) : audio.pause()));
    if (closeBtn) closeBtn.addEventListener('click', () => {
      audio.pause(); audioBar.hidden = true; doc.body.classList.remove('has-audio-bar');
    });
    audio.addEventListener('play', () => setIcon(true));
    audio.addEventListener('pause', () => setIcon(false));
    audio.addEventListener('ended', () => setIcon(false));
    audio.addEventListener('timeupdate', () => {
      if (seek && audio.duration) seek.value = String(Math.round((audio.currentTime / audio.duration) * 100));
      if (timeEl) timeEl.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
    });
    if (seek) seek.addEventListener('input', () => {
      if (audio.duration) audio.currentTime = (Number(seek.value) / 100) * audio.duration;
    });
  }

  /* copy to clipboard ------------------------------------------------------ */
  doc.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = doc.querySelector(btn.getAttribute('data-copy'));
      if (!target) return;
      const text = target.textContent.trim().replace(/\s+/g, ' ');
      const done = () => {
        const original = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = original; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else { done(); }
    });
  });

  /* back to top ------------------------------------------------------------------------------ */
  const toTop = doc.querySelector('.to-top-circle');
  if (toTop) {
    const toggleTop = () => toTop.classList.toggle('show', scrollY > 600);
    addEventListener('scroll', toggleTop, { passive: true });
    toggleTop();
    toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }));
  }
})();
