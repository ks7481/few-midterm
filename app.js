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

/* ---------- audio (Web Audio API, works in Safari and Chrome) ---------- */
const AC = window.AudioContext || window.webkitAudioContext,
  ctx = new AC(),
  PEEK = 0.15,
  bufs = {};
let peekSrc;

function load(name) {
  fetch(name)
    .then((r) => r.arrayBuffer())
    .then((d) => new Promise((res, rej) => ctx.decodeAudioData(d, res, rej)))
    .then((buf) => (bufs[name] = buf))
    .catch(() => {});
}
load("paperslide.mp3");
load("bell.mp3");

function play(name, from = 0, dur) {
  const buf = bufs[name];
  if (!on || !buf) return null;
  if (ctx.state !== "running") ctx.resume();
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.connect(ctx.destination);
  s.start(0, from, dur);
  return s;
}

function stopPeek() {
  try {
    if (peekSrc) peekSrc.stop();
  } catch (e) {}
}

const peek = () => {
    stopPeek();
    peekSrc = play("paperslide.mp3", 0, PEEK);
  },
  reveal = () => {
    stopPeek();
    play("paperslide.mp3", PEEK);
  },
  ding = () => play("bell.mp3");

// browsers only allow sound after a click, tap or key press
const unlockEvents = ["pointerdown", "touchstart", "keydown"];
const unlock = () =>
  ctx.resume().then(() => {
    if (ctx.state === "running")
      unlockEvents.forEach((e) => removeEventListener(e, unlock));
  });
unlockEvents.forEach((e) => addEventListener(e, unlock));

/* ---------- state ---------- */
b.dataset.m = timed ? "timed" : "walk";
b.dataset.d = 1;

$("#snd").onclick = (e) => {
  on = !on;
  e.target.textContent = "sound " + (on ? "on" : "off");
};

/* ---------- notes ---------- */
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

/* ---------- palette, call, timer ---------- */
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
