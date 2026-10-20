const $ = (s) => document.querySelector(s),
  b = document.body,
  T = 120e3,
  AWARE = 7,
  LIFT = 6,
  found = new Set();

let nt,
  on = true,
  called = false;

const timed = location.hash == "#timed";

const au = new Audio("paperslide.mp3"),
  PEEK = 0.15;
let pt;
au.preload = "auto";

function snd(from, stop) {
  if (!on) return;
  clearTimeout(pt);
  au.currentTime = from;
  au.play()
    .then(() => {
      if (stop) pt = setTimeout(() => au.pause(), stop * 1000);
    })
    .catch(() => {});
}

const peek = () => snd(0, PEEK),
  reveal = () => snd(PEEK, 0);
  const bell = new Audio("bell.mp3");
bell.preload = "auto";

function ding() {
  if (!on) return;
  bell.currentTime = 0;
  bell.play().catch(() => {});
}

addEventListener(
  "pointerdown",
  () => {
    bell.muted = true;
    bell
      .play()
      .then(() => {
        bell.pause();
        bell.currentTime = 0;
        bell.muted = false;
      })
      .catch(() => {});
  },
  { once: true },
);
b.dataset.m = timed ? "timed" : "walk";
b.dataset.d = 1;
$("#snd").onclick = (e) => {
  on = !on;
  e.target.textContent = "sound " + (on ? "on" : "off");
};

document.querySelectorAll(".has").forEach((n) => {
  const k = n.querySelector(".k");
  const peekIfNew = () => {
    if (!found.has(k.id)) peek();
  };
  n.addEventListener("mouseenter", peekIfNew);
  n.addEventListener("focusin", peekIfNew);
});

document.querySelectorAll(".k").forEach((k) =>
  k.addEventListener("change", () => {
    if (!k.checked) return;
    reveal();
    if (!found.size) {
      const x = k.closest(".has").querySelector(".note").textContent;
      sessionStorage.first = x;
    }
    found.add(k.id);
    const n = found.size;
    b.classList.toggle("aware", n >= AWARE);
    b.classList.toggle("lift", n >= LIFT);
    if (!timed) {
      b.classList.toggle("s2", n >= 1);
      b.classList.toggle("s3", n >= 3);
      b.classList.toggle("s4", n >= 5);
    }
    if (!timed && !called) b.dataset.d = n >= 2 ? 2 : 1;
  }),
);

const pal = (p) => {
  b.classList.toggle("s2", p >= 0.33);
  b.classList.toggle("s3", p >= 0.5);
  b.classList.toggle("s4", p >= 0.75);
};

function call() {
  called = true;
  b.classList.add("called");
  b.dataset.d = 3;
  ding();
  nt = setTimeout(() => (location.href = "noshow.html"), 30e3);
}

if (timed) {
  const t0 = Date.now(),
    iv = setInterval(() => {
      const p = (Date.now() - t0) / T;
      if (p >= 1) {
        clearInterval(iv);
        call();
      } else {
        if (p >= 0.5) b.dataset.d = 2;
        pal(p);
      }
    }, 500);
} else
  $(".go").onclick = (e) => {
    e.preventDefault();
    call();
  };

addEventListener("hashchange", () => {
  if (location.hash == "#pin") clearTimeout(nt);
});