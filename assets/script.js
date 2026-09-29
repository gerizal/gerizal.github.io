(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  document.documentElement.classList.add("js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Storage (safe) ---------------- */
  const store = {
    get(k, fallback) {
      try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  };
  const session = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  const SAVE_KEY = "gerizal-save-v1";
  const save = Object.assign({ xp: 0, areas: [], ach: [] }, store.get(SAVE_KEY, {}));
  const persist = () => store.set(SAVE_KEY, save);

  /* ---------------- Level = years since 2016 ---------------- */
  const level = new Date().getFullYear() - 2016;
  $$("[data-level]").forEach((el) => (el.textContent = level));
  $("#year").textContent = new Date().getFullYear();

  /* ---------------- Sound (WebAudio blips, off by default) ---------------- */
  let soundOn = store.get("gerizal-sound", false);
  let ctx;
  const soundBtn = $("#soundBtn");
  const renderSound = () => {
    soundBtn.textContent = soundOn ? "🔊" : "🔇";
    soundBtn.setAttribute("aria-pressed", String(soundOn));
  };
  function beep(notes) {
    if (!soundOn) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      let t = ctx.currentTime;
      notes.forEach(([freq, dur]) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(ctx.destination);
        o.start(t);
        o.stop(t + dur);
        t += dur * 0.9;
      });
    } catch { /* audio not available */ }
  }
  const SFX = {
    coin: [[988, 0.08], [1319, 0.25]],
    unlock: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.3]],
    start: [[392, 0.1], [523, 0.1], [659, 0.2]],
    hit: [[180, 0.08], [120, 0.1]],
  };
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    store.set("gerizal-sound", soundOn);
    renderSound();
    beep(SFX.coin);
  });
  renderSound();

  /* ---------------- Toasts ---------------- */
  function toast(icon, label, text, gold = false) {
    const t = document.createElement("div");
    t.className = "toast" + (gold ? " gold" : "");
    t.innerHTML = `<span class="ico">${icon}</span><div><small>${label}</small><b></b></div>`;
    $("b", t).textContent = text;
    $("#toasts").appendChild(t);
    setTimeout(() => t.remove(), 3700);
  }

  /* ---------------- XP ---------------- */
  const MAX_XP = 700;
  $("#xpMax").textContent = MAX_XP;
  function renderXP() {
    const xp = Math.min(save.xp, MAX_XP);
    $("#xpNum").textContent = xp;
    $("#xpFill").style.setProperty("--w", (xp / MAX_XP) * 100 + "%");
  }
  function addXP(n) {
    const before = save.xp;
    save.xp = Math.min(MAX_XP, save.xp + n);
    persist();
    renderXP();
    if (before < MAX_XP && save.xp >= MAX_XP) {
      setTimeout(() => toast("🌟", "MAX LEVEL", "You've seen it all. Time to hire?", true), 900);
    }
  }
  renderXP();

  /* ---------------- Visitor achievements ---------------- */
  const ACH = [
    { id: "start", ico: "🎮", name: "Press Start", desc: "Entered the game." },
    { id: "explorer", ico: "🗺", name: "Explorer", desc: "Discovered every area." },
    { id: "reader", ico: "📜", name: "Lore Reader", desc: "Opened a completed quest." },
    { id: "scout", ico: "🔍", name: "Skill Scout", desc: "Inspected 10 skill nodes." },
    { id: "loot", ico: "🎁", name: "Loot Collected", desc: "Downloaded the CV." },
    { id: "party", ico: "🤝", name: "Party Invite", desc: "Reached out via a contact link." },
    { id: "poke", ico: "👉", name: "Stop Poking Me", desc: "Clicked the avatar 5 times." },
    { id: "konami", ico: "🕹", name: "Old School", desc: "Entered the Konami code." },
  ];
  function renderAch() {
    $("#visitorAch").innerHTML = ACH.map((a) => {
      const got = save.ach.includes(a.id);
      return `<div class="v-ach ${got ? "unlocked" : "locked"}">
        <span class="ico">${got ? a.ico : "🔒"}</span>
        <div><b>${got ? a.name : "???"}</b><small>${a.desc}</small></div></div>`;
    }).join("");
  }
  function unlock(id) {
    if (save.ach.includes(id)) return;
    const a = ACH.find((x) => x.id === id);
    save.ach.push(id);
    persist();
    renderAch();
    toast(a.ico, "ACHIEVEMENT UNLOCKED", a.name, true);
    beep(SFX.unlock);
  }
  renderAch();

  /* ---------------- Pixel avatar ---------------- */
  const PALETTE = {
    h: "#1f2937", s: "#e0a878", S: "#b9794d", e: "#0b0f1a", g: "#38bdf8",
    m: "#9a3412", c: "#38bdf8", C: "#0369a1", w: "#e6edf7", l: "#cbd5e1", L: "#475569",
  };
  const SPRITE = [
    "....hhhhhhhh....",
    "...hhhhhhhhhh...",
    "..hhhhhhhhhhhh..",
    "..hhsssssssshh..",
    "..hssssssssssh..",
    "..sggggssggggs..",
    "..sgeggssggegs..",
    "..ssssssssssss..",
    "...ssssmmssss...",
    "....SSSSSSSS....",
    "...cccccccccc...",
    "..cccccwwccccc..",
    ".ccccccwwcccccc.",
    ".ssLLLLLLLLLLss.",
    ".CCLlllgglllLCC.",
    "..CLLLLLLLLLLC..",
  ];
  let rects = "";
  SPRITE.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (PALETTE[ch]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${PALETTE[ch]}"/>`;
    })
  );
  const avatar = $("#avatar");
  avatar.innerHTML = `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  let pokes = 0;
  avatar.addEventListener("click", () => {
    pokes++;
    beep(SFX.hit);
    avatar.classList.remove("hit");
    void avatar.offsetWidth;
    avatar.classList.add("hit");
    if (pokes >= 5) unlock("poke");
  });

  /* ---------------- Typewriter dialog ---------------- */
  const dialog = $("#dialogText");
  const fullText = dialog.textContent.replace(/\s+/g, " ").trim();
  let typing = null;
  function typeDialog() {
    if (reduceMotion) return;
    let i = 0;
    dialog.textContent = "";
    clearInterval(typing);
    typing = setInterval(() => {
      i += 2;
      dialog.textContent = fullText.slice(0, i);
      if (i >= fullText.length) clearInterval(typing);
    }, 14);
  }
  dialog.closest(".dialog").addEventListener("click", () => {
    clearInterval(typing);
    dialog.textContent = fullText;
  });

  /* ---------------- Start screen ---------------- */
  function startGame() {
    unlock("start");
    typeDialog();
  }
  if (!session.get("gerizal-started")) {
    const screen = document.createElement("div");
    screen.className = "start-screen";
    screen.setAttribute("role", "dialog");
    screen.setAttribute("aria-label", "Start screen");
    screen.innerHTML = `<div>
      <h2>WAGE RIZAL<br>SOLICHIN</h2>
      <p class="sub">Senior Fullstack Engineer · LV ${level}</p>
      <p class="press">PRESS ANY KEY TO START</p>
      <p class="skip">or tap anywhere</p></div>`;
    document.body.appendChild(screen);
    document.body.style.overflow = "hidden";
    const go = () => {
      session.set("gerizal-started", "1");
      screen.classList.add("hide");
      document.body.style.overflow = "";
      beep(SFX.start);
      window.removeEventListener("keydown", go);
      setTimeout(() => screen.remove(), 500);
      startGame();
    };
    screen.addEventListener("click", go);
    window.addEventListener("keydown", go);
  } else {
    startGame();
  }

  /* ---------------- Area discovery + nav highlight ---------------- */
  const areas = $$("section[data-area]");
  const navLinks = $$(".hud-nav a");
  const areaObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        navLinks.forEach((a) => a.classList.toggle("current", a.getAttribute("href") === "#" + id));
        if (!save.areas.includes(id)) {
          save.areas.push(id);
          addXP(100);
          toast("🗺", "AREA DISCOVERED  +100 XP", en.target.dataset.area);
          beep(SFX.coin);
          if (areas.every((s) => save.areas.includes(s.id))) setTimeout(() => unlock("explorer"), 600);
        }
      });
    },
    { rootMargin: "-40% 0px -50% 0px" }
  );
  areas.forEach((s) => areaObs.observe(s));

  /* ---------------- Reveal on scroll, bars, counters ---------------- */
  const revealTargets = $$("section:not(.hero) .panel, .cert, .section-title");
  revealTargets.forEach((el) => el.classList.add("reveal"));
  const revObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        $$(".bar-attr", en.target).forEach((b) => b.classList.add("on"));
        revObs.unobserve(en.target);
      });
    },
    { threshold: 0.12 }
  );
  revealTargets.forEach((el) => revObs.observe(el));

  const countObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const target = +el.dataset.count;
        const fmt = (n) => (el.dataset.prefix || "") + n + (el.dataset.suffix || "");
        if (reduceMotion) { el.textContent = fmt(target); return; }
        let n = 0;
        const step = Math.max(1, Math.ceil(target / 25));
        const iv = setInterval(() => {
          n = Math.min(target, n + step);
          el.textContent = fmt(n);
          if (n >= target) clearInterval(iv);
        }, 40);
        countObs.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  $$("[data-count]").forEach((el) => countObs.observe(el));

  /* ---------------- Skill scouting ---------------- */
  const scouted = new Set();
  $$(".nodes li").forEach((li) => {
    const mark = () => {
      scouted.add(li.textContent);
      if (scouted.size >= 10) unlock("scout");
    };
    li.addEventListener("mouseenter", mark);
    li.addEventListener("click", mark);
  });

  /* ---------------- Quest reading ---------------- */
  $$(".quest details:not([open])").forEach((d) =>
    d.addEventListener("toggle", () => {
      if (d.open) { beep(SFX.coin); unlock("reader"); }
    })
  );

  /* ---------------- Download CV (loot) ---------------- */
  function burst(x, y) {
    if (reduceMotion) return;
    const colors = ["#fbbf24", "#38bdf8", "#4ade80", "#f472b6", "#a78bfa"];
    for (let i = 0; i < 24; i++) {
      const p = document.createElement("span");
      p.className = "px";
      const ang = (Math.PI * 2 * i) / 24;
      const dist = 60 + Math.random() * 80;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.background = colors[i % colors.length];
      p.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      p.style.setProperty("--dy", Math.sin(ang) * dist + "px");
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 950);
    }
  }
  $$("[data-download]").forEach((a) =>
    a.addEventListener("click", () => {
      const r = a.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
      beep(SFX.coin);
      if (!save.ach.includes("loot")) addXP(100);
      toast("📄", "ITEM OBTAINED", "Wage_Rizal_Solichin_CV.pdf");
      setTimeout(() => unlock("loot"), 400);
    })
  );

  /* ---------------- Contact ---------------- */
  $$("[data-contact]").forEach((a) => a.addEventListener("click", () => unlock("party")));

  /* ---------------- Konami code ---------------- */
  const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  let kpos = 0;
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    kpos = k === KONAMI[kpos] ? kpos + 1 : k === KONAMI[0] ? 1 : 0;
    if (kpos === KONAMI.length) {
      kpos = 0;
      if (!save.ach.includes("konami")) addXP(100);
      unlock("konami");
      document.documentElement.style.filter = "hue-rotate(160deg)";
      setTimeout(() => (document.documentElement.style.filter = ""), 3000);
      for (let i = 0; i < 4; i++)
        setTimeout(() => burst(Math.random() * innerWidth, Math.random() * innerHeight * 0.7 + 60), i * 180);
    }
  });

  /* ---------------- Reset ---------------- */
  $("#resetBtn").addEventListener("click", () => {
    save.xp = 0; save.areas = []; save.ach = [];
    persist();
    try { sessionStorage.removeItem("gerizal-started"); } catch { /* ignore */ }
    location.reload();
  });
})();
