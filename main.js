/* MotionFit download site — behaviour
 * ---------------------------------------------------------------
 * DOWNLOAD_URL is the one thing to change per host.
 *   • GitHub Releases (recommended): the "latest" alias below always
 *     points at the newest release asset named MotionFit-Setup.exe —
 *     you never have to touch this again after each release.
 *   • Cloudflare R2 / other: replace with your public file URL, e.g.
 *     https://downloads.motionfit.example/MotionFit-Setup.exe
 * DOWNLOAD_SIZE is just cosmetic copy shown next to the button.
 *
 * Motion stack (vendored in /vendor): GSAP + ScrollTrigger + Lenis.
 * Everything degrades: no GSAP → IntersectionObserver reveals;
 * prefers-reduced-motion → fully static page.
 * --------------------------------------------------------------- */
const DOWNLOAD_URL =
  "https://github.com/alibadawi25/MotionFit/releases/latest/download/MotionFit-Setup.exe";
const DOWNLOAD_SIZE = "~99 MB";

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// Point every download control at the URL + fill cosmetic bits.
$$("[data-download]").forEach((el) => el.setAttribute("href", DOWNLOAD_URL));
$$("[data-size]").forEach((el) => (el.textContent = DOWNLOAD_SIZE));
$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;
const hasGSAP = !!(window.gsap && window.ScrollTrigger);
const loader = $("#loader");

/* ---------- scroll chrome: progress bar + hide/show nav (all paths) ---------- */
const bar = $("#scrollProgress");
const nav = $("#nav");
let lastY = 0;
function onScroll() {
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  const y = h.scrollTop;
  if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
  if (nav && !reduceMotion) {
    nav.classList.toggle("is-scrolled", y > 30);
    if (Math.abs(y - lastY) > 6) {
      nav.classList.toggle("is-hidden", y > lastY && y > 340);
      lastY = y;
    }
  }
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- live fitness HUD ---------- */
const hudEls = {
  cal: $('[data-hud="cal"]'),
  bpm: $('[data-hud="bpm"]'),
  steps: $('[data-hud="steps"]'),
};
function hudRender(cal, bpm, steps) {
  if (!hudEls.cal) return;
  hudEls.cal.textContent = cal;
  hudEls.bpm.textContent = bpm;
  hudEls.steps.textContent = steps.toLocaleString();
}
function hudLive() {
  if (!hudEls.cal) return;
  let cal = 128, bpm = 142, steps = 2140;
  hudRender(cal, bpm, steps);
  setInterval(() => {
    cal += Math.floor(Math.random() * 3);
    steps += 3 + Math.floor(Math.random() * 5);
    bpm = 138 + Math.floor(Math.random() * 12);
    hudRender(cal, bpm, steps);
  }, 1400);
}

/* ---------- count-up for stat numbers ---------- */
function countUp(el, dur = 1100) {
  const target = parseInt(el.dataset.count, 10);
  if (!target) { el.textContent = el.dataset.count || el.textContent; return; }
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased);
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

/* ---------- HUD-style text scramble ---------- */
function scrambleText(el, dur = 650) {
  if (!el || el.children.length) return;
  const orig = el.dataset.orig || (el.dataset.orig = el.textContent);
  const glyphs = "!<>-_\\/[]{}=+*^?#0123456789";
  const n = orig.length;
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const solved = Math.floor(p * n);
    let out = orig.slice(0, solved);
    for (let i = solved; i < n; i++) {
      out += orig[i] === " " ? " " : glyphs[(Math.random() * glyphs.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = orig;
  })(start);
}

/* ---------- hero: cursor spotlight + pointer parallax on frames + HUD ---------- */
function heroPointerParallax() {
  const hero = $("#hero");
  const heroArt = $("#heroArt");
  if (!hero || !heroArt || !finePointer) return;
  const layers = $$("[data-parallax]", heroArt);
  let raf = 0, tx = 0, ty = 0;
  const apply = () => {
    layers.forEach((l) => {
      const depth = parseFloat(l.dataset.parallax) / 1000;
      const rot = l.classList.contains("frame")
        ? ` rotate(${getComputedStyle(l).getPropertyValue("--rot") || "0deg"})`
        : "";
      l.style.transform = `translate3d(${tx * depth * 30}px, ${ty * depth * 30}px, 0)${rot}`;
    });
    raf = 0;
  };
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    hero.style.setProperty("--mx", px * 100 + "%");
    hero.style.setProperty("--my", py * 100 + "%");
    tx = px - 0.5; ty = py - 0.5;
    if (!raf) raf = requestAnimationFrame(apply);
  });
  hero.addEventListener("pointerleave", () => {
    tx = 0; ty = 0;
    if (!raf) raf = requestAnimationFrame(apply);
  });
}

/* ---------- 3D tilt + pointer glare on game cards ---------- */
function initTilt() {
  if (!finePointer) return;
  $$(".tilt").forEach((card) => {
    const glare = document.createElement("div");
    glare.className = "card-glare";
    card.appendChild(glare);
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        `translateY(-6px) perspective(800px) rotateX(${-py * 7}deg) rotateY(${px * 7}deg)`;
      card.style.setProperty("--gx", (px + 0.5) * 100 + "%");
      card.style.setProperty("--gy", (py + 0.5) * 100 + "%");
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
}

/* ---------- magnetic pull on primary buttons ---------- */
function initMagnet() {
  if (!finePointer) return;
  $$(".btn-primary, .nav-dl").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      btn.style.transform =
        `translate(${mx * 0.16}px, ${my * 0.26 - 2}px) scale(1.02)`;
    });
    // the .btn transform transition springs it back for us
    btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
  });
}

/* ---------- rising ember particles on the ambient canvas ---------- */
function initEmbers() {
  const canvas = $("#embers");
  const ctx = canvas && canvas.getContext("2d");
  if (!ctx) return;
  let w = innerWidth, h = innerHeight;
  const parts = [];
  const spawn = (anywhere) => ({
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 8,
    r: 0.6 + Math.random() * 1.8,
    vy: 0.22 + Math.random() * 0.55,
    drift: 0.4 + Math.random() * 1.4,
    phase: Math.random() * Math.PI * 2,
    hue: 18 + Math.random() * 24,
    a: 0.22 + Math.random() * 0.45,
  });
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.min(70, Math.round((w * h) / 24000));
    while (parts.length < target) parts.push(spawn(true));
    parts.length = target;
  };
  addEventListener("resize", resize);
  resize();
  let t = 0;
  (function frame() {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    t += 0.012;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.y -= p.vy;
      p.x += Math.sin(t * 2 + p.phase) * 0.2 * p.drift;
      if (p.y < -10) { parts[i] = spawn(false); continue; }
      const twinkle = 0.72 + Math.sin(t * 6 + p.phase * 3) * 0.28;
      ctx.globalAlpha = p.a * twinkle;
      ctx.fillStyle = `hsl(${p.hue} 100% 60%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  })();
}

/* ---------- custom cursor (dot + trailing ring) ---------- */
function initCursor() {
  const dot = $("#cursorDot");
  const ring = $("#cursorRing");
  if (!dot || !ring || !finePointer) return;
  document.documentElement.classList.add("cursor-on");
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
  addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    dot.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
  });
  (function loop() {
    requestAnimationFrame(loop);
    rx += (x - rx) * 0.16;
    ry += (y - ry) * 0.16;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
  })();
  const hoverSel = "a, button, .btn, .game-card, .frame, [data-download]";
  document.addEventListener("pointerover", (e) => {
    ring.classList.toggle("is-hover", !!(e.target.closest && e.target.closest(hoverSel)));
  });
  addEventListener("pointerdown", () => ring.classList.add("is-down"));
  addEventListener("pointerup", () => ring.classList.remove("is-down"));
}

/* ---------- spark burst when a download button is clicked ---------- */
function initSparks() {
  if (!window.gsap) return;
  const colors = ["#ffb85c", "#ff7a18", "#ff5722", "#c6ff4a"];
  $$("[data-download]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      for (let i = 0; i < 18; i++) {
        const s = document.createElement("span");
        s.className = "spark";
        s.style.background = colors[i % colors.length];
        s.style.left = e.clientX + "px";
        s.style.top = e.clientY + "px";
        document.body.appendChild(s);
        const ang = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 95;
        gsap.fromTo(s,
          { x: 0, y: 0, scale: 1, opacity: 1, rotation: 0 },
          { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist - 34, scale: 0.15,
            opacity: 0, rotation: (Math.random() - 0.5) * 380, duration: 0.85,
            ease: "power3.out", onComplete: () => s.remove() });
      }
    });
  });
}

/* ================================================================
   Path 1 — reduced motion: everything visible, nothing moves.
   ================================================================ */
function reducedPath() {
  if (loader) loader.remove();
  $$("[data-count]").forEach((el) => (el.textContent = el.dataset.count));
  $$(".reveal-up").forEach((el) => el.classList.add("in"));
  hudRender(236, 147, 3421);
}

/* ================================================================
   Path 2 — classic: no GSAP available (CDN/file missing).
   IntersectionObserver reveals + the always-on niceties.
   ================================================================ */
function classicPath() {
  if (loader) {
    loader.classList.add("done");
    setTimeout(() => loader.remove(), 600);
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          $$("[data-count]", e.target).forEach((el) => countUp(el));
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  $$(".reveal-up").forEach((el) => io.observe(el));
  heroPointerParallax();
  hudLive();
  initTilt();
  initMagnet();
  initEmbers();
  initCursor();
}

/* ================================================================
   Path 3 — kinetic: GSAP + ScrollTrigger (+ Lenis smooth scroll).
   READY·SET·GO intro, char-slam hero, scroll choreography.
   ================================================================ */
function kineticPath() {
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("gsap-on");

  /* --- Lenis smooth scrolling, driven by GSAP's ticker --- */
  let lenis = null;
  if (window.Lenis) {
    try { lenis = new Lenis({ lerp: 0.1 }); } catch (_) { lenis = null; }
  }
  if (lenis) {
    document.documentElement.classList.add("lenis-on");
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length > 1 && $(id)) {
          e.preventDefault();
          lenis.scrollTo(id, { offset: -84 });
        }
      });
    });
  }

  /* --- take the hero away from the CSS reveal keyframes --- */
  const h1 = $(".hero h1");
  const chars = [];
  if (h1) {
    h1.classList.remove("reveal");
    [...h1.childNodes].forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const frag = document.createDocumentFragment();
      for (const c of node.textContent) {
        if (c.trim() === "") {
          frag.appendChild(document.createTextNode(c));
          continue;
        }
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = c;
        frag.appendChild(s);
        chars.push(s);
      }
      h1.replaceChild(frag, node);
    });
  }
  const hlWord = h1 && $(".hl", h1);
  const heroBits = $$(".hero-copy .reveal");
  heroBits.forEach((el) => el.classList.remove("reveal"));
  const heroArt = $("#heroArt");
  if (heroArt) heroArt.classList.remove("reveal-art");
  const frameMain = $(".frame-main");
  const frameSub = $(".frame-sub");
  const hud = $(".hud");

  gsap.set(chars, {
    yPercent: 120, opacity: 0,
    rotation: () => gsap.utils.random(-9, 9),
  });
  if (hlWord) gsap.set(hlWord, { yPercent: 130, opacity: 0, scale: 1.25, transformOrigin: "50% 100%" });
  if (heroBits.length) gsap.set(heroBits, { autoAlpha: 0, y: 26 });
  if (frameMain) gsap.set(frameMain, { autoAlpha: 0, y: 70, rotation: 8, scale: 0.92 });
  if (frameSub) gsap.set(frameSub, { autoAlpha: 0, y: 90, rotation: -10, scale: 0.9 });
  if (hud) gsap.set(hud, { autoAlpha: 0, scale: 0.5, rotation: 8 });

  /* --- READY · SET · GO intro (full show once per session) --- */
  let seenIntro = false;
  try { seenIntro = !!sessionStorage.getItem("mf-intro"); } catch (_) {}
  try { sessionStorage.setItem("mf-intro", "1"); } catch (_) {}

  if (lenis) lenis.stop(); else document.body.style.overflow = "hidden";
  const introDone = () => {
    if (lenis) lenis.start(); else document.body.style.overflow = "";
    if (loader) loader.remove();
  };

  const word = $("#loaderWord");
  const lbar = $("#loaderBar");
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

  const loaderLogo = $("#loaderLogo");
  if (loader && word && lbar && !seenIntro) {
    if (loaderLogo) {
      tl.fromTo(loaderLogo, { scale: 0, autoAlpha: 0, rotation: -14 },
        { scale: 1, autoAlpha: 1, rotation: 0, duration: 0.34, ease: "back.out(2.2)" }, 0);
    }
    const flash = (w) => {
      tl.call(() => { word.textContent = w; });
      tl.fromTo(word, { opacity: 0, scale: 0.7, y: 16 },
        { opacity: 1, scale: 1, y: 0, duration: 0.16 });
      tl.to(word, { opacity: 0, scale: 1.22, duration: 0.13, ease: "power2.in" }, "+=0.26");
    };
    flash("READY");
    flash("SET");
    tl.call(() => { word.textContent = "GO!"; word.classList.add("flame"); });
    tl.fromTo(word, { opacity: 0, scale: 0.6 },
      { opacity: 1, scale: 1.08, duration: 0.2, ease: "back.out(2.5)" });
    tl.fromTo(lbar, { width: "0%" },
      { width: "100%", duration: tl.duration() + 0.15, ease: "power1.inOut" }, 0);
    tl.to(loader, { yPercent: -100, duration: 0.62, ease: "power4.inOut" }, "+=0.18");
    tl.call(introDone);
  } else if (loader) {
    tl.to(loader, { autoAlpha: 0, duration: 0.35 });
    tl.call(introDone);
  } else {
    introDone();
  }

  /* --- hero entrance, overlapping the wipe --- */
  tl.addLabel("hero", "-=0.5");
  if (chars.length) {
    tl.to(chars, {
      yPercent: 0, opacity: 1, rotation: 0,
      duration: 0.7, ease: "back.out(1.6)", stagger: 0.028,
    }, "hero");
  }
  if (hlWord) {
    tl.to(hlWord, { yPercent: 0, opacity: 1, scale: 1, duration: 0.55, ease: "back.out(2)" }, "hero+=0.38");
  }
  if (heroBits.length) {
    tl.to(heroBits, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.09 }, "hero+=0.25");
  }
  if (frameMain) {
    tl.to(frameMain, { autoAlpha: 1, y: 0, rotation: 2.2, scale: 1, duration: 0.9, ease: "power4.out" }, "hero+=0.2");
  }
  if (frameSub) {
    tl.to(frameSub, { autoAlpha: 1, y: 0, rotation: -3.5, scale: 1, duration: 0.9, ease: "power4.out" }, "hero+=0.34");
  }
  if (hud) {
    tl.to(hud, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.55)" }, "hero+=0.55");
  }
  tl.call(() => {
    const se = $(".hero-copy [data-scramble]");
    if (se) scrambleText(se);
  }, null, "hero+=0.15");
  tl.call(heroPointerParallax);

  /* --- hero drifts up slightly as you scroll away --- */
  gsap.to("#heroArt", {
    y: -54, ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
  });
  gsap.to(".hero-copy", {
    y: -26, ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
  });

  /* --- scroll reveals (replaces the CSS-transition path) --- */
  $$(".reveal-up").forEach((el) => {
    const d = (parseFloat(el.style.getPropertyValue("--d")) || 0) / 1000;
    gsap.fromTo(el,
      { autoAlpha: 0, y: 44 },
      { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", delay: d,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onComplete: () => el.classList.add("in") });
  });

  /* --- stat counters --- */
  $$("[data-count]").forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: "top 87%", once: true,
      onEnter: () => countUp(el),
    });
  });

  /* --- HUD-style scramble on eyebrows/kickers as they enter --- */
  $$("[data-scramble]").forEach((el) => {
    if (el.closest(".hero")) return; // hero one runs inside the intro
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => scrambleText(el),
    });
  });

  /* --- headings wipe in from below a clip mask --- */
  $$(".section-head h2, .mocap-copy h2, .db-copy h2, .show-copy h3").forEach((el) => {
    gsap.fromTo(el,
      { clipPath: "inset(0 0 100% 0)", y: 40 },
      { clipPath: "inset(-10% 0 -10% 0)", y: 0, duration: 0.9, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true } });
  });

  /* --- showcase art: directional clip wipe + settle + scroll parallax --- */
  $$(".show-row").forEach((row) => {
    const art = $(".show-art", row);
    const img = $(".show-img", row);
    if (!art) return;
    const fromRight = row.classList.contains("reverse");
    gsap.fromTo(art,
      { clipPath: fromRight ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0%)", duration: 1.1, ease: "power4.inOut",
        scrollTrigger: { trigger: row, start: "top 74%", once: true } });
    if (img) {
      gsap.fromTo(img, { scale: 1.3 },
        { scale: 1.08, duration: 1.5, ease: "power3.out",
          scrollTrigger: { trigger: row, start: "top 74%", once: true } });
      gsap.fromTo(img, { yPercent: -4 },
        { yPercent: 4, ease: "none",
          scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: true } });
    }
  });

  /* --- marquee: velocity-reactive speed + skew --- */
  const track = $(".marquee-track");
  if (track) {
    track.style.animation = "none";
    const loop = gsap.to(track, { xPercent: -50, duration: 22, ease: "none", repeat: -1 });
    let vel = 0;
    ScrollTrigger.create({ onUpdate: (self) => { vel = self.getVelocity(); } });
    gsap.ticker.add(() => {
      vel *= 0.9;
      loop.timeScale(1 + gsap.utils.clamp(0, 4, Math.abs(vel) / 350));
      gsap.set(track, { skewX: gsap.utils.clamp(-9, 9, vel / -110) });
    });
  }

  /* --- kinetic type strips scrub sideways with the scroll --- */
  $$(".strip").forEach((strip) => {
    const st = $(".strip-track", strip);
    if (!st) return;
    const dir = parseFloat(strip.dataset.dir) || -1;
    gsap.fromTo(st,
      { xPercent: dir > 0 ? -22 : 0 },
      { xPercent: dir > 0 ? 0 : -22, ease: "none",
        scrollTrigger: { trigger: strip, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* --- mocap skeleton draws itself in --- */
  const mocap = $(".mocap-visual");
  if (mocap) {
    const strokes = $$(".bones line, .bones polyline, .bone-head", mocap);
    strokes.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    gsap.to(strokes, {
      strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.08,
      scrollTrigger: { trigger: mocap, start: "top 70%", once: true },
      onComplete: () => strokes.forEach((p) => { p.style.strokeDasharray = "none"; }),
    });
  }

  /* --- giant footer wordmark fills with flame as the page ends --- */
  const giant = $(".foot-giant");
  if (giant) {
    gsap.fromTo(giant,
      { backgroundPosition: "100% 0%" },
      { backgroundPosition: "0% 0%", ease: "none",
        scrollTrigger: { trigger: ".foot", start: "top 95%", end: "bottom bottom", scrub: true } });
  }

  /* --- always-on niceties --- */
  hudLive();
  initTilt();
  initMagnet();
  initEmbers();
  initCursor();
  initSparks();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

/* ---------- pick a path ---------- */
if (reduceMotion) {
  reducedPath();
} else if (hasGSAP) {
  // if anything in the kinetic path blows up, never leave the loader stuck
  try {
    kineticPath();
  } catch (err) {
    console.error("MotionFit: kinetic path failed, falling back", err);
    document.documentElement.classList.remove("gsap-on");
    classicPath();
  }
} else {
  classicPath();
}
