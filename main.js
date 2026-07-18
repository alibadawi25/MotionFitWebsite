/* MotionFit download site — behaviour
 * ---------------------------------------------------------------
 * DOWNLOAD_URL is the one thing to change per host.
 *   • GitHub Releases (recommended): the "latest" alias below always
 *     points at the newest release asset named MotionFit-Setup.exe —
 *     you never have to touch this again after each release.
 *   • Cloudflare R2 / other: replace with your public file URL, e.g.
 *     https://downloads.motionfit.example/MotionFit-Setup.exe
 * DOWNLOAD_SIZE is just cosmetic copy shown next to the button.
 * --------------------------------------------------------------- */
const DOWNLOAD_URL =
  "https://github.com/alibadawi25/MotionFit/releases/latest/download/MotionFit-Setup.exe";
const DOWNLOAD_SIZE = "~99 MB";

// Point every download control at the URL.
document.querySelectorAll("[data-download]").forEach((el) => {
  el.setAttribute("href", DOWNLOAD_URL);
});

// Fill in cosmetic bits.
document.querySelectorAll("[data-size]").forEach((el) => {
  el.textContent = DOWNLOAD_SIZE;
});
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Count-up animation for stat numbers.
function countUp(el) {
  const target = parseInt(el.dataset.count, 10);
  if (reduceMotion || !target) { el.textContent = target || el.textContent; return; }
  const dur = 1100, start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased);
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

// Scroll-triggered reveals (respects reduced-motion via CSS fallback).
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        e.target.querySelectorAll("[data-count]").forEach(countUp);
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal-up").forEach((el) => io.observe(el));

// Scroll progress bar.
const bar = document.getElementById("scrollProgress");
if (bar) {
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// Hero: cursor spotlight + parallax tilt on the framed shots + HUD.
const hero = document.getElementById("hero");
const heroArt = document.getElementById("heroArt");
if (hero && heroArt && !reduceMotion) {
  const layers = heroArt.querySelectorAll("[data-parallax]");
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

// Live fitness HUD — gently drifting numbers so it feels "on".
const hudEls = {
  cal: document.querySelector('[data-hud="cal"]'),
  bpm: document.querySelector('[data-hud="bpm"]'),
  steps: document.querySelector('[data-hud="steps"]'),
};
if (hudEls.cal && !reduceMotion) {
  let cal = 128, bpm = 142, steps = 2140;
  const render = () => {
    hudEls.cal.textContent = cal;
    hudEls.bpm.textContent = bpm;
    hudEls.steps.textContent = steps.toLocaleString();
  };
  render();
  setInterval(() => {
    cal += Math.floor(Math.random() * 3);
    steps += 3 + Math.floor(Math.random() * 5);
    bpm = 138 + Math.floor(Math.random() * 12);
    render();
  }, 1400);
}

// Subtle 3D tilt on game cards.
if (!reduceMotion) {
  document.querySelectorAll(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        `translateY(-6px) perspective(800px) rotateX(${-py * 6}deg) rotateY(${px * 6}deg)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
}
