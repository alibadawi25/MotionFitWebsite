# MotionFit — Website

Landing page for **MotionFit**, a webcam-powered fitness gaming launcher for Windows. Your body is the controller: move to play a collection of full-body mini-games.

## About

MotionFit turns your webcam into a motion controller. The launcher bundles full-body fitness mini-games — run from zombies, sprint the hurdles, roam an open world — for real calories and real sweat.

## Structure

```
index.html    # Landing page markup
styles.css    # Styles
main.js       # Interactions & animation choreography
assets/       # Images and icons
vendor/       # Vendored libraries: GSAP + ScrollTrigger (scroll animation), Lenis (smooth scroll)
```

Motion degrades gracefully: without the vendor scripts the site falls back to
IntersectionObserver reveals, and `prefers-reduced-motion` gets a fully static page.

## Running locally

It's a static site — open `index.html` directly in a browser, or serve the folder:

```bash
# Python
python -m http.server 8000

# Node
npx serve
```

Then visit http://localhost:8000.
