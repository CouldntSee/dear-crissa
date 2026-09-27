/* ————————————————————————————————————————
   for crissa mae — interactions
   envelope · petals · reveals · parallax ·
   signal waves · generative music box
———————————————————————————————————————— */

(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const main = $('#main');
  const opening = $('#opening');
  const openBtn = $('#openBtn');
  const musicBtn = $('#musicBtn');

  main.inert = true; // the letter waits behind the envelope

  /* ————— a few faint stars on the envelope ————— */
  const stars = $('.stars');
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('i');
    s.style.setProperty('--x', (Math.random() * 94 + 3) + '%');
    s.style.setProperty('--y', (Math.random() * 88 + 3) + '%');
    s.style.setProperty('--s', (Math.random() * 1.2 + 1.1) + 'px');
    s.style.setProperty('--d', (Math.random() * 3.5 + 3.5) + 's');
    s.style.setProperty('--dl', (Math.random() * 5) + 's');
    stars.appendChild(s);
  }

  /* ————— music box (Web Audio, no files, never autoplays) ————— */
  const MusicBox = (() => {
    let ctx = null, master, filter, delay, fb, wet, drone, timer = null, playing = false;
    // F major pentatonic — warm, music-box register
    const scale = [53, 55, 57, 60, 62, 65, 67, 69, 72, 74];
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
    let idx = 3;

    function setup() {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0;
      filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 2200; filter.Q.value = .5;
      master.connect(filter); filter.connect(ctx.destination);

      delay = ctx.createDelay(1.5); delay.delayTime.value = .42;
      fb = ctx.createGain(); fb.gain.value = .32;
      wet = ctx.createGain(); wet.gain.value = .28;
      delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);

      drone = ctx.createGain(); drone.gain.value = 0; drone.connect(master);
      [87.31, 130.81].forEach(f => {           // a soft F2 + C3 floor
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const g = ctx.createGain(); g.gain.value = .5;
        o.connect(g); g.connect(drone); o.start();
      });
    }

    function pluck() {
      if (!playing) return;
      idx += [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
      idx = Math.max(0, Math.min(scale.length - 1, idx));
      const m = scale[idx] + (Math.random() < .15 ? 12 : 0);
      const f = mtof(m), now = ctx.currentTime;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(.16, now + .012);
      g.gain.exponentialRampToValueAtTime(.0001, now + 3.8);

      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
      const g2 = ctx.createGain(); g2.gain.value = .25;
      o1.connect(g); o2.connect(g2); g2.connect(g);
      g.connect(master); g.connect(delay);

      o1.start(now); o2.start(now);
      o1.stop(now + 4.1); o2.stop(now + 4.1);

      timer = setTimeout(pluck, 750 + Math.random() * 1500);
    }

    return {
      toggle() {
        playing = !playing;
        if (playing) {
          if (!ctx) setup();
          ctx.resume();
          master.gain.setTargetAtTime(.9, ctx.currentTime, .8);
          drone.gain.setTargetAtTime(.018, ctx.currentTime, 2.5);
          pluck();
        } else {
          master.gain.setTargetAtTime(0, ctx.currentTime, .35);
          drone.gain.setTargetAtTime(0, ctx.currentTime, .35);
          clearTimeout(timer);
          setTimeout(() => { if (!playing && ctx) ctx.suspend(); }, 1500);
        }
        return playing;
      }
    };
  })();

  musicBtn.addEventListener('click', () => {
    const on = MusicBox.toggle();
    musicBtn.classList.toggle('playing', on);
    musicBtn.setAttribute('aria-pressed', String(on));
    musicBtn.setAttribute('aria-label', on ? 'Pause the music box' : 'Play a little music box');
  });

  /* ————— petals: a handful, faint, slightly thicker near the birthday ————— */
  const Petals = (() => {
    const cv = $('#petals'); if (!cv) return { start() {} };
    const ctx = cv.getContext('2d');
    const COLORS = [[152, 134, 182], [203, 190, 222], [226, 207, 150], [228, 214, 192]];
    let W, H, ps = [], running = false, started = false, last = 0;
    let mult = .4, zoneTop = -1, frameNo = 0;

    function measure() {
      const b = $('#birthday');
      if (b) zoneTop = b.getBoundingClientRect().top + scrollY;
    }
    function resize() {
      const d = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * d; cv.height = H * d;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    function make(y) {
      return {
        x: Math.random() * W, y: (y ?? -30),
        s: 5 + Math.random() * 7,
        vy: 12 + Math.random() * 18,
        ph: Math.random() * 6.28, sw: 18 + Math.random() * 26,
        rot: Math.random() * 6.28, vr: (Math.random() - .5) * 1.1,
        a: .11 + Math.random() * .13,
        c: COLORS[(Math.random() * COLORS.length) | 0]
      };
    }
    function draw(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = p.a * mult; ctx.fillStyle = `rgb(${p.c})`;
      const s = p.s;
      ctx.beginPath(); ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * .85, -s * .55, s * .65, s * .65, 0, s);
      ctx.bezierCurveTo(-s * .65, s * .65, -s * .85, -s * .55, 0, -s);
      ctx.fill(); ctx.restore();
    }
    function tick(t) {
      if (!running) return;
      requestAnimationFrame(tick);
      const dt = Math.min(.05, (t - last) / 1000 || .016); last = t;

      // petals thicken only near the birthday chapter — pacing, not decoration
      if (++frameNo % 90 === 0) measure();
      const target = (zoneTop > 0 && scrollY > zoneTop - H * .85) ? 1 : .38;
      mult += (target - mult) * Math.min(1, dt * 1.5);

      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.ph += dt; p.y += p.vy * dt;
        p.x += Math.sin(p.ph) * p.sw * dt;
        p.rot += p.vr * dt;
        if (p.y > H + 40) Object.assign(p, make());
        draw(p);
      }
    }
    return {
      start() {
        if (started || reduceMotion) return;
        started = true; resize(); measure();
        const n = Math.min(10, Math.max(6, (W / 140) | 0));
        ps = Array.from({ length: n }, () => make(Math.random() * H));
        running = true; requestAnimationFrame(tick);
      }
    };
  })();
  addEventListener('resize', () => { if (!reduceMotion) Petals.start(); }, { once: true });

  /* ————— opening the envelope ————— */
  let opened = false;
  openBtn.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    opening.classList.add('open');
    document.body.classList.remove('locked');
    main.inert = false;
    setTimeout(() => { musicBtn.hidden = false; }, 900);
    setTimeout(() => { opening.classList.add('gone'); opening.setAttribute('aria-hidden', 'true'); }, 1300);
    Petals.start();
    openBtn.blur();
  });

  /* ————— reveals: artifacts get a moment, prose just fades in ————— */
  function reveal(el) {
    el.classList.add('is-in');
    const f = el.querySelector('.pframe.focus');
    if (f) f.classList.add('is-focused');   // the memory comes into focus
  }
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      reveal(e.target);
      io.unobserve(e.target);
    }
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('[data-reveal]').forEach(el => {
    const t = parseFloat(el.dataset.threshold);
    if (!isNaN(t)) {
      const io2 = new IntersectionObserver(es => {
        es.forEach(en => {
          if (en.isIntersecting) { reveal(en.target); io2.unobserve(en.target); }
        });
      }, { threshold: t });
      io2.observe(el);
    } else {
      io.observe(el);
    }
  });

  /* ————— gentle parallax inside the photographs ————— */
  const pImgs = [...document.querySelectorAll('.pframe .photo')];
  if (!reduceMotion && pImgs.length) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = innerHeight;
      for (const img of pImgs) {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) continue;
        const prog = (r.top + r.height / 2 - vh / 2) / vh;
        const t = Math.max(-5.5, Math.min(5.5, prog * 9));
        img.style.transform = `translate3d(0, ${t.toFixed(2)}%, 0)`;
      }
    };
    addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ————— the distance · a waveform that fades into silence ————— */
  (function buildDistanceWave() {
    const path = $('#distPath'); if (!path) return;
    const W = 1200, mid = 75, amp = 40;
    let d = `M0 ${mid}`;
    for (let x = 3; x <= W; x += 3) {
      const u = x / W;
      const clean = u < .30 ? 1 : Math.max(0, 1 - (u - .30) / .22);
      const noise = u < .28 ? 0 : Math.min(1, (u - .28) / .10) * Math.max(0, 1 - (u - .60) / .12);
      const n = Math.sin(x * .21 + 1.7) * Math.sin(x * .087 - .6) + .5 * Math.sin(x * .33);
      const y = mid + Math.sin(x * .026) * amp * clean + n * amp * .85 * noise;
      d += ` L${x} ${y.toFixed(1)}`;
    }
    path.setAttribute('d', d);
  })();

  /* ————— the oscilloscope · noisy → steady → quiet → a lily ————— */
  (function scope() {
    const cv = $('#scopeCanvas'); if (!cv) return;
    const ctx = cv.getContext('2d');
    let W, H, mid, amp, run = false, raf = 0, t = 1.3, last = 0;

    function y(x, ph) {
      const u = x / W;
      const noise = u < .30 ? 1 : Math.max(0, 1 - (u - .30) / .28);
      const base  = u < .60 ? 1 : Math.max(0, 1 - (u - .60) / .24);
      const n = Math.sin(x * .09 + ph * 2.4) * Math.sin(x * .041 - ph * 1.5)
              + .45 * Math.sin(x * .153 + ph * .8);
      return mid + Math.sin(x * .020 + ph * 1.15) * amp * base + n * amp * .8 * noise;
    }
    function trace(ph, alpha, w) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const yy = y(x, ph);
        x ? ctx.lineTo(x, yy) : ctx.moveTo(0, yy);
      }
      ctx.strokeStyle = `rgba(96, 84, 120, ${alpha})`;
      ctx.lineWidth = w; ctx.stroke();
    }
    function draw(ph) {
      ctx.clearRect(0, 0, W, H);
      ctx.setLineDash([2, 7]);
      ctx.strokeStyle = 'rgba(46,42,51,.14)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();
      ctx.setLineDash([]);
      trace(ph + .55, .15, 1);   // a faint persistence echo
      trace(ph, .85, 1.5);       // the trace itself
    }
    function resize() {
      const d = Math.min(devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * d; cv.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      mid = H * .52; amp = H * .24;
      if (reduceMotion) draw(1.3);
    }
    function loop(ts) {
      if (!run) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min(.05, (ts - last) / 1000 || .016); last = ts;
      t += dt * 1.5;
      draw(t);  
    }
    new IntersectionObserver(([e]) => {
      if (reduceMotion) { draw(1.3); return; }
      if (e.isIntersecting) {
        if (!run) { run = true; last = performance.now(); raf = requestAnimationFrame(loop); }
      } else { run = false; cancelAnimationFrame(raf); }
    }, { threshold: .05 }).observe(cv);

    addEventListener('resize', resize);
    resize();
  })();
})();