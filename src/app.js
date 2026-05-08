const STORAGE_KEY = "geospark3.passport";
const APP_VERSION = "0.3.1";
const ARCHETYPES = {
  historian: { label: "The Historian", questionsPerLevel: 15, levelsPerStage: 7 },
  pilot: { label: "The Pilot", questionsPerLevel: 5, levelsPerStage: 20 },
};

const STAGES = [
  { id: 1, name: "Europe", files: ["europe"] },
  { id: 2, name: "South America", files: ["europe", "south_america"] },
  { id: 3, name: "Asia", files: ["europe", "south_america", "asia"] },
  { id: 4, name: "US States", files: ["europe", "south_america", "asia", "us_states"] },
  { id: 5, name: "Africa", files: ["europe", "south_america", "asia", "us_states", "africa"] },
  { id: 6, name: "Global Master", files: ["europe", "south_america", "asia", "us_states", "africa", "global"] },
];

const DATA_FILES = ["europe", "south_america", "asia", "us_states", "africa", "global"];
const QUESTION_TYPES = ["flag", "capital", "city"];
const QUESTION_TIME_MS = 18000;
const CHALLENGE_TIME_MS = 60000;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 18;

const $ = (id) => document.getElementById(id);
const onPress = (el, fn) => el.addEventListener("pointerup", (event) => {
  event.preventDefault();
  fn(event);
});

let passport = loadPassport();
let geoData = {};
let globeRaf = 0;
let audioReady = false;
let audioCtx = null;

const state = {
  view: "boot",
  mode: null,
  running: false,
  paused: false,
  question: null,
  score: 0,
  streak: 0,
  lives: 3,
  timerMs: 0,
  timerMaxMs: 0,
  timerEndsAt: 0,
  timerRaf: 0,
  levelProgress: 0,
  recent: [],
};

function defaultPassport() {
  return {
    version: 1,
    name: "",
    archetype: "historian",
    journey: { stage: 1, level: 1, stamps: [] },
    currencies: { geoSparks: 0, airMiles: 0 },
    unlocks: { journey: true, challenge: true, zen: false },
    best: { challenge: 0 },
  };
}

function loadPassport() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed && parsed.version === 1) return parsed;
  } catch (_) {}
  return defaultPassport();
}

function savePassport() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(passport));
}

async function loadGeoData() {
  const entries = await Promise.all(DATA_FILES.map(async (file) => {
    const response = await fetch(`data/${file}.json`, { cache: "no-cache" });
    return [file, await response.json()];
  }));
  geoData = Object.fromEntries(entries);
}

function getArchetype() {
  return ARCHETYPES[passport.archetype] || ARCHETYPES.historian;
}

function currentStage() {
  return STAGES.find((stage) => stage.id === passport.journey.stage) || STAGES[0];
}

function poolForStage(stageId = passport.journey.stage) {
  const stage = STAGES.find((item) => item.id === stageId) || STAGES[0];
  return stage.files.flatMap((file) => geoData[file] || []);
}

function setScreen(id) {
  ["boot-screen", "onboarding-screen", "menu-screen", "game-screen", "result-screen"].forEach((screenId) => {
    $(screenId).classList.toggle("hidden", screenId !== id);
  });
  state.view = id;
  if (id === "menu-screen") startGlobe();
  else stopGlobe();
}

function flagUrl(cc) {
  if (cc.startsWith("us-")) return "https://flagcdn.com/w160/us.png";
  return `https://flagcdn.com/w160/${cc}.png`;
}

function haptic(kind) {
  if (!navigator.vibrate) return;
  if (kind === "spark") navigator.vibrate(28);
  if (kind === "wrong") navigator.vibrate([35, 45, 35]);
}

function unlockAudio() {
  if (audioReady) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioReady = true;
  } catch (_) {
    audioReady = false;
  }
}

function playTone(frequency, duration, type = "sine", gain = 0.08, delay = 0) {
  if (!audioReady || !audioCtx) return;
  if (audioCtx.state === "suspended") audioCtx.resume();
  const start = audioCtx.currentTime + delay;
  const oscillator = audioCtx.createOscillator();
  const volume = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(gain, start);
  volume.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(volume);
  volume.connect(audioCtx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

const Sound = {
  tap() {
    playTone(620, 0.08, "sine", 0.07);
    playTone(880, 0.08, "sine", 0.04, 0.025);
  },
  correct() {
    [523, 659, 784].forEach((freq, index) => playTone(freq, 0.18, "sine", 0.08, index * 0.07));
  },
  wrong() {
    playTone(300, 0.14, "square", 0.06);
    playTone(240, 0.18, "square", 0.05, 0.11);
  },
  timeout() {
    playTone(420, 0.22, "triangle", 0.07);
    playTone(220, 0.24, "triangle", 0.05, 0.17);
  },
  levelUp() {
    [523, 659, 784, 1047].forEach((freq, index) => playTone(freq, 0.2, "sine", 0.07, index * 0.08));
  },
};

function renderMenu() {
  $("menu-name").textContent = passport.name || "Explorer";
  $("menu-version").textContent = `GeoSpark v${APP_VERSION}`;
  $("result-version").textContent = `GeoSpark v${APP_VERSION}`;
  $("menu-stage").textContent = currentStage().name;
  $("menu-sparks").textContent = passport.currencies.geoSparks;
  $("menu-airmiles").textContent = passport.currencies.airMiles;

  const zenUnlocked = passport.unlocks.zen;
  $("zen-btn").classList.toggle("locked", !zenUnlocked);
  $("zen-label").textContent = zenUnlocked ? "Zen" : "Zen Locked";
  $("zen-copy").textContent = zenUnlocked ? "Stress-free sandbox" : "Complete Asia or buy for 5,000 AirMiles";

  $("stage-track").innerHTML = STAGES.map((stage) => {
    const isComplete = passport.journey.stamps.includes(stage.name);
    const isCurrent = passport.journey.stage === stage.id;
    const status = isComplete ? "complete" : isCurrent ? "current" : "";
    return `<div class="stage-pill ${status}"><strong>${stage.id}. ${stage.name}</strong><small>${isComplete ? "Stamped" : isCurrent ? "In progress" : "Locked ahead"}</small></div>`;
  }).join("");
}

function selectedArchetype() {
  const selected = document.querySelector(".choice-card.selected");
  return selected?.dataset.archetype || "historian";
}

function createPassport() {
  const name = $("player-name").value.trim() || "Explorer";
  passport = defaultPassport();
  passport.name = name;
  passport.archetype = selectedArchetype();
  savePassport();
  renderMenu();
  setScreen("menu-screen");
}

function startMode(mode) {
  if (mode === "zen" && !passport.unlocks.zen) {
    buyZenOrNudge();
    return;
  }
  stopTimer();
  Sound.tap();
  Object.assign(state, {
    mode,
    running: true,
    paused: false,
    question: null,
    score: 0,
    streak: 0,
    lives: mode === "journey" ? 3 : mode === "challenge" ? 3 : Infinity,
    timerMs: mode === "challenge" ? CHALLENGE_TIME_MS : mode === "journey" ? QUESTION_TIME_MS : 0,
    timerMaxMs: mode === "challenge" ? CHALLENGE_TIME_MS : mode === "journey" ? QUESTION_TIME_MS : 0,
    levelProgress: 0,
    recent: [],
  });
  $("game-screen").classList.toggle("zen-mode", mode === "zen");
  $("game-screen").classList.remove("paused");
  $("pause-overlay").classList.add("hidden");
  $("journey-progress-track").classList.toggle("hidden", mode !== "journey");
  $("tool-row").classList.toggle("hidden", mode !== "journey");
  $("hud-mode").textContent = mode === "journey" ? `Journey · ${currentStage().name}` : mode === "challenge" ? "Challenge" : "Zen";
  setScreen("game-screen");
  nextQuestion();
}

function buyZenOrNudge() {
  if (passport.currencies.airMiles >= 5000) {
    passport.currencies.airMiles -= 5000;
    passport.unlocks.zen = true;
    savePassport();
    renderMenu();
    return;
  }
  $("zen-copy").textContent = `${5000 - passport.currencies.airMiles} more AirMiles needed, or complete Asia.`;
}

function questionPool() {
  if (state.mode === "challenge") return poolForStage(6);
  return poolForStage(passport.journey.stage);
}

function pickQuestion() {
  const pool = questionPool();
  const eligible = pool.filter((item) => !state.recent.includes(item.name));
  const source = eligible.length >= 4 ? eligible : pool;
  const answer = source[Math.floor(Math.random() * source.length)];
  state.recent.push(answer.name);
  if (state.recent.length > 8) state.recent.shift();
  const wrongs = shuffle(pool.filter((item) => item.name !== answer.name)).slice(0, 3);
  const type = QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];

  if (type === "capital") {
    return {
      type,
      answer,
      correct: answer.capital,
      badge: "Country to Capital",
      prompt: answer.name,
      subtitle: answer.continent,
      flag: answer.cc,
      options: shuffle([answer.capital, ...wrongs.map((item) => item.capital)]),
    };
  }

  if (type === "city") {
    return {
      type,
      answer,
      correct: answer.name,
      badge: "City to Territory",
      prompt: answer.city,
      subtitle: "Where would you find this city?",
      flag: null,
      options: shuffle([answer.name, ...wrongs.map((item) => item.name)]),
    };
  }

  return {
    type,
    answer,
    correct: answer.name,
    badge: "Flag to Territory",
    prompt: "Name this place",
    subtitle: answer.continent,
    flag: answer.cc,
    options: shuffle([answer.name, ...wrongs.map((item) => item.name)]),
  };
}

function nextQuestion() {
  if (!state.running) return;
  if (state.mode === "journey") {
    state.timerMs = QUESTION_TIME_MS;
    state.timerMaxMs = QUESTION_TIME_MS;
  }
  state.question = pickQuestion();
  renderQuestion();
  updateHud();
  if (state.mode !== "zen") startTimer();
}

function renderQuestion() {
  const q = state.question;
  $("question-badge").textContent = q.badge;
  $("question-text").textContent = q.prompt;
  $("question-subtitle").textContent = q.subtitle || "";
  $("zen-title").classList.toggle("hidden", state.mode !== "zen");
  $("zen-title").textContent = state.mode === "zen" ? q.answer.name : "";

  $("flag-display").classList.toggle("empty", !q.flag);
  $("flag-display").innerHTML = q.flag ? `<img src="${flagUrl(q.flag)}" alt="">` : "";
  $("answer-grid").innerHTML = q.options.map((option) => `<button class="answer-btn" type="button" data-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join("");
  document.querySelectorAll(".answer-btn").forEach((button) => onPress(button, () => answerQuestion(button.dataset.answer, button)));
  $("feedback-line").textContent = "";
}

function answerQuestion(value, button) {
  if (!state.running || state.paused) return;
  stopTimer();
  const q = state.question;
  const correct = value === q.correct;
  if (button.classList) button.classList.add(correct ? "correct" : "wrong");
  document.querySelectorAll(".answer-btn").forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.answer === q.correct) btn.classList.add("correct");
  });

  if (correct) {
    Sound.correct();
    haptic("spark");
    state.streak += 1;
    state.score += 100 + (state.streak * 10);
    if (state.mode === "journey") {
      state.levelProgress += 1;
      if (state.streak > 1 && state.streak % 3 === 0) passport.currencies.geoSparks += 10;
    }
    $("feedback-line").textContent = `Sparked ${q.answer.name}`;
    checkProgression();
  } else {
    Sound.wrong();
    haptic("wrong");
    state.streak = 0;
    state.lives -= 1;
    $("feedback-line").textContent = q.correct;
  }

  updateHud();
  savePassport();

  if (state.mode !== "zen" && state.lives <= 0) {
    setTimeout(() => finishRun("Out of lives"), 850);
    return;
  }
  setTimeout(nextQuestion, state.mode === "zen" ? 520 : 850);
}

function checkProgression() {
  if (state.mode !== "journey") return;
  const archetype = getArchetype();
  if (state.levelProgress < archetype.questionsPerLevel) return;
  state.levelProgress = 0;
  passport.journey.level += 1;
  passport.currencies.airMiles += 100;

  if (passport.journey.level > archetype.levelsPerStage) {
    completeStage();
  }
}

function completeStage() {
  const completed = currentStage();
  if (!passport.journey.stamps.includes(completed.name)) passport.journey.stamps.push(completed.name);
  passport.currencies.airMiles += 400;
  if (completed.id === 3) passport.unlocks.zen = true;
  if (completed.id < STAGES.length) {
    passport.journey.stage = completed.id + 1;
    passport.journey.level = 1;
  } else {
    passport.journey.level = getArchetype().levelsPerStage;
  }
  Sound.levelUp();
  $("hud-mode").textContent = `Journey · ${currentStage().name}`;
}

function autoCorrect() {
  if (state.mode !== "journey" || passport.currencies.geoSparks < 25 || !state.question) return;
  passport.currencies.geoSparks -= 25;
  const target = [...document.querySelectorAll(".answer-btn")].find((btn) => btn.dataset.answer === state.question.correct);
  if (target) answerQuestion(target.dataset.answer, target);
}

function skipLevel() {
  if (state.mode !== "journey" || passport.currencies.airMiles < 250) return;
  passport.currencies.airMiles -= 250;
  state.levelProgress = getArchetype().questionsPerLevel;
  checkProgression();
  savePassport();
  updateHud();
  nextQuestion();
}

function updateHud() {
  const archetype = getArchetype();
  const progress = state.mode === "journey" ? (state.levelProgress / archetype.questionsPerLevel) * 100 : 0;
  $("journey-progress-fill").style.width = `${Math.min(100, progress)}%`;

  if (state.mode === "challenge") {
    $("hud-stats").textContent = `${Math.ceil(state.timerMs / 1000)}s · ${state.score} · Best ${passport.best.challenge}`;
  } else if (state.mode === "journey") {
    $("hud-stats").textContent = `${passport.currencies.geoSparks} GS · ${passport.currencies.airMiles} AM`;
  } else {
    $("hud-stats").textContent = "";
  }
  $("auto-correct-btn").disabled = passport.currencies.geoSparks < 25;
  $("skip-level-btn").disabled = passport.currencies.airMiles < 250;
  $("timer-text").textContent = Math.ceil(state.timerMs / 1000);
  const ratio = state.timerMaxMs ? Math.max(0, Math.min(1, state.timerMs / state.timerMaxMs)) : 0;
  $("timer-fill").style.strokeDashoffset = `${((1 - ratio) * TIMER_CIRCUMFERENCE).toFixed(1)}`;
  $("timer-chip").classList.toggle("danger", state.timerMs <= 5000 && state.mode !== "zen");
  $("lives-text").textContent = state.mode === "challenge" || state.mode === "journey"
    ? "♥".repeat(Math.max(0, state.lives))
    : "";
}

function startTimer() {
  stopTimer();
  state.timerMaxMs = state.timerMaxMs || state.timerMs;
  state.timerEndsAt = performance.now() + state.timerMs;
  const tick = (now) => {
    if (!state.running || state.paused) return;
    state.timerMs = Math.max(0, state.timerEndsAt - now);
    updateHud();
    if (state.timerMs <= 0) {
      Sound.timeout();
      if (state.mode === "challenge") finishRun("Time up");
      else answerQuestion("__timeout__", document.createElement("button"));
      return;
    }
    state.timerRaf = requestAnimationFrame(tick);
  };
  state.timerRaf = requestAnimationFrame(tick);
}

function stopTimer() {
  cancelAnimationFrame(state.timerRaf);
}

function pauseGame() {
  if (!state.running || state.mode === "zen" || state.paused) return;
  Sound.tap();
  state.timerMs = Math.max(0, state.timerEndsAt - performance.now());
  state.paused = true;
  stopTimer();
  $("game-screen").classList.add("paused");
  $("pause-overlay").classList.remove("hidden");
}

function resumeGame() {
  if (!state.paused) return;
  Sound.tap();
  state.paused = false;
  $("game-screen").classList.remove("paused");
  $("pause-overlay").classList.add("hidden");
  startTimer();
}

function finishRun(reason) {
  stopTimer();
  state.running = false;
  if (state.mode === "challenge" && state.score > passport.best.challenge) {
    passport.best.challenge = state.score;
  }
  savePassport();
  $("result-title").textContent = reason;
  $("result-copy").textContent = state.mode === "challenge" ? `Best challenge score: ${passport.best.challenge}` : `Passport updated for ${passport.name}.`;
  $("result-score").textContent = state.score;
  setScreen("result-screen");
}

function backToMenu() {
  stopTimer();
  state.running = false;
  state.paused = false;
  $("game-screen").classList.remove("paused");
  $("pause-overlay").classList.add("hidden");
  renderMenu();
  setScreen("menu-screen");
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[char]));
}

function startGlobe() {
  const canvas = $("globe-canvas");
  const ctx = canvas.getContext("2d");
  const dots = Array.from({ length: 130 }, (_, index) => ({
    lat: -70 + Math.random() * 140,
    lon: (index * 47) % 360,
    size: 1 + Math.random() * 1.8,
  }));
  const render = (now) => {
    const width = canvas.width;
    const height = canvas.height;
    const radius = width * 0.38;
    const cx = width / 2;
    const cy = height / 2;
    ctx.clearRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
    glow.addColorStop(0, "#203f63");
    glow.addColorStop(0.72, "#0d2740");
    glow.addColorStop(1, "#07111e");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(77,171,247,0.26)";
    ctx.lineWidth = 1;
    for (let line = -60; line <= 60; line += 30) {
      const y = cy + Math.sin(line * Math.PI / 180) * radius;
      ctx.beginPath();
      ctx.ellipse(cx, y, radius * Math.cos(line * Math.PI / 180), radius * 0.12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    dots.forEach((dot) => {
      const lon = (dot.lon + now * 0.015) * Math.PI / 180;
      const lat = dot.lat * Math.PI / 180;
      const z = Math.cos(lat) * Math.cos(lon);
      if (z < -0.12) return;
      const x = cx + radius * Math.cos(lat) * Math.sin(lon);
      const y = cy + radius * Math.sin(lat);
      ctx.globalAlpha = 0.35 + Math.max(0, z) * 0.65;
      ctx.fillStyle = dot.lat > 15 ? "#38d9a9" : dot.lat < -15 ? "#ffd166" : "#4dabf7";
      ctx.beginPath();
      ctx.arc(x, y, dot.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    globeRaf = requestAnimationFrame(render);
  };
  stopGlobe();
  globeRaf = requestAnimationFrame(render);
}

function stopGlobe() {
  cancelAnimationFrame(globeRaf);
}

function wireEvents() {
  document.querySelectorAll(".choice-card").forEach((button) => onPress(button, () => {
    unlockAudio();
    Sound.tap();
    document.querySelectorAll(".choice-card").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
  }));
  onPress($("create-passport-btn"), createPassport);
  onPress($("journey-btn"), () => startMode("journey"));
  onPress($("challenge-btn"), () => startMode("challenge"));
  onPress($("zen-btn"), () => startMode("zen"));
  onPress($("back-menu-btn"), backToMenu);
  onPress($("pause-btn"), pauseGame);
  onPress($("resume-btn"), resumeGame);
  onPress($("result-menu-btn"), backToMenu);
  onPress($("auto-correct-btn"), autoCorrect);
  onPress($("skip-level-btn"), skipLevel);
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopTimer();
    else if (state.running && state.mode !== "zen") startTimer();
  });
}

async function init() {
  wireEvents();
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  await loadGeoData();
  if (!passport.name) {
    setScreen("onboarding-screen");
  } else {
    renderMenu();
    setScreen("menu-screen");
  }
}

init().catch(() => {
  $("boot-screen").querySelector(".muted").textContent = "Could not load geography data.";
});
