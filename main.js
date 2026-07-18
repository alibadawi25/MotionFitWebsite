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

// Scroll-triggered reveals (respects reduced-motion via CSS fallback).
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal-up").forEach((el) => io.observe(el));
