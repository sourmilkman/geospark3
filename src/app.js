const STORAGE_KEY = "geospark3.passport";
const APP_VERSION = "0.5.6";
const AUTO_CORRECT_COST = 50;
const SKIP_LEVEL_COST = 750;
const ZEN_UNLOCK_COST = 5000;
const GEOSPARK_STREAK_INTERVAL = 5;
const GEOSPARK_STREAK_REWARD = 3;
const AIRMILES_LEVEL_REWARD = 25;
const AIRMILES_STAGE_REWARD = 150;
const MIN_SPLASH_MS = 1400;
const FOREGROUND_SPLASH_AFTER_MS = 1200;
const JOURNEY_FAILURE_KEEP_RATIO = 0.25;
const ARCHETYPES = {
  historian: { label: "The Historian", questionsPerLevel: 15, levelsPerStage: 7 },
  backpacker: { label: "The Backpacker", questionsPerLevel: 10, levelsPerStage: 12 },
  pilot: { label: "The Pilot", questionsPerLevel: 5, levelsPerStage: 20 },
};
const MENU_CHARACTER_ART = {
  historian: "assets/menu/main_historian.png",
  backpacker: "assets/menu/main_backpacker.png",
  pilot: "assets/menu/main_pilot.png",
};
const STAGE_UNLOCK_DETAILS = {
  2: { region: "South America", copy: "The Atlantic routes are open. South America has joined your question pool.", mapLabel: "South America", mapClass: "south-america" },
  3: { region: "Asia", copy: "Asia is unlocked. Complete this stage to open Zen Mode.", mapLabel: "Asia", mapClass: "asia" },
  4: { region: "US States", copy: "The United States stage is live, with state flags and abbreviation drills.", mapLabel: "US States", mapClass: "us-states" },
  5: { region: "Africa", copy: "Africa is now part of your journey. The map is getting wider.", mapLabel: "Africa", mapClass: "africa" },
  6: { region: "Global Master", copy: "The final global pool is unlocked. North America and Oceania now enter the game.", mapLabel: "Global", mapClass: "global" },
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
const EUROPE_MAP_TYPES = ["mapIdentify", "mapSelect"];
const QUESTION_TIME_MS = 18000;
const CHALLENGE_TIME_MS = 60000;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 18;
const MODE_START_DELAY_MS = 900;
const STUDY_SUGGESTION_WINDOW_MS = 30000;
const STUDY_SUGGESTION_WRONGS = 3;
const LEARN_REGIONS = [
  { id: "all", label: "All" },
  { id: "Europe", label: "Europe" },
  { id: "South America", label: "S. America" },
  { id: "Asia", label: "Asia" },
  { id: "US States", label: "US States" },
  { id: "Africa", label: "Africa" },
  { id: "North America", label: "N. America" },
  { id: "Oceania", label: "Oceania" },
];
const EUROPE_TOP_HITS = new Set([
  "France",
  "Germany",
  "Italy",
  "Spain",
  "United Kingdom",
  "Ireland",
  "Netherlands",
  "Portugal",
  "Greece",
  "Sweden",
  "Norway",
  "Poland",
]);
const EUROPE_CORE = new Set([
  ...EUROPE_TOP_HITS,
  "Austria",
  "Belgium",
  "Croatia",
  "Czechia",
  "Denmark",
  "Finland",
  "Hungary",
  "Iceland",
  "Romania",
  "Switzerland",
  "Ukraine",
]);
const EUROPE_MAP_LEVEL_START_RATIO = 0.5;
const EUROPE_MICROSTATES = new Set(["Andorra", "Liechtenstein", "Luxembourg", "Malta", "Monaco", "San Marino", "Vatican City"]);
const EUROPE_PIN_POSITIONS = {
  Andorra: [26.3, 54.4],
  Liechtenstein: [49.6, 43.7],
  Luxembourg: [40.2, 39.3],
  Malta: [55.2, 66.4],
  Monaco: [43.4, 51.2],
  "San Marino": [50.9, 51.7],
  "Vatican City": [48.9, 56.6],
};
const MAP_COLORS = ["#7fd8d8", "#e4869b", "#b8e27f", "#c49be8", "#e5b07e", "#93bdea", "#80d99a", "#d783c8", "#d7d577"];
const EUROPE_MAP_BOUNDS = { minLon: -25, maxLon: 45, minLat: 34, maxLat: 72, width: 100, height: 72 };

const $ = (id) => document.getElementById(id);
const onPress = (el, fn) => el.addEventListener("pointerup", (event) => {
  event.preventDefault();
  fn(event);
});

let passport = loadPassport();
let geoData = {};
let europeMapData = [];
let globeRaf = 0;
let audioReady = false;
let audioCtx = null;
let splashReadyScreen = "";
let splashStartedAt = performance.now();
let hiddenAt = 0;
let lastVisibleScreen = "";
let splashPausedRun = false;

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
  learnRegion: "all",
  wrongTimes: [],
  studySuggested: false,
  launchTimer: 0,
  stageUnlock: null,
};

function defaultPassport() {
  return {
    version: 1,
    name: "",
    archetype: "historian",
    journey: { stage: 1, level: 0, stamps: [] },
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
  const mapResponse = await fetch("data/europe_map.json", { cache: "no-cache" });
  europeMapData = await mapResponse.json();
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

function isCountry(item) {
  return item.continent !== "US States" && !item.cc.includes("-");
}

function isUSState(item) {
  return item.continent === "US States" && item.cc.startsWith("us-");
}

function stateAbbr(item) {
  return item.cc.replace("us-", "").toUpperCase();
}

function journeyDifficultyBand() {
  if (state.mode !== "journey" || passport.journey.stage !== 1) return 3;
  const levels = getArchetype().levelsPerStage;
  const level = Math.max(1, passport.journey.level + 1);
  if (level <= Math.max(2, Math.ceil(levels * 0.3))) return 1;
  if (level <= Math.max(4, Math.ceil(levels * 0.65))) return 2;
  return 3;
}

function allowedByDifficulty(item) {
  if (state.mode !== "journey" || passport.journey.stage !== 1 || item.continent !== "Europe") return true;
  const band = journeyDifficultyBand();
  if (band === 1) return EUROPE_TOP_HITS.has(item.name);
  if (band === 2) return EUROPE_CORE.has(item.name);
  return true;
}

function mapQuestionsUnlocked() {
  if (state.mode !== "journey" || passport.journey.stage !== 1) return false;
  const levels = getArchetype().levelsPerStage;
  return passport.journey.level >= Math.max(1, Math.floor(levels * EUROPE_MAP_LEVEL_START_RATIO));
}

function questionTypeForPool(usStatePool) {
  if (usStatePool.length >= 4 && Math.random() < 0.32) return Math.random() < 0.5 ? "stateCode" : "stateAbbr";
  if (mapQuestionsUnlocked() && Math.random() < 0.55) {
    return EUROPE_MAP_TYPES[Math.floor(Math.random() * EUROPE_MAP_TYPES.length)];
  }
  return QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];
}

function setScreen(id) {
  ["boot-screen", "onboarding-screen", "menu-screen", "launch-screen", "learn-screen", "game-screen", "result-screen"].forEach((screenId) => {
    $(screenId).classList.toggle("hidden", screenId !== id);
  });
  state.view = id;
  if (id === "menu-screen") startGlobe();
  else stopGlobe();
}

function continueFromSplash() {
  if (!splashReadyScreen) return;
  Sound.tap();
  const targetScreen = splashReadyScreen;
  splashReadyScreen = "";
  if (targetScreen === "menu-screen") renderMenu();
  setScreen(targetScreen);
  if (targetScreen === "game-screen" && splashPausedRun && state.running && state.mode !== "zen") {
    state.paused = false;
    $("game-screen").classList.remove("paused");
    startTimer();
  }
  splashPausedRun = false;
}

function readySplash(targetScreen, status = "Ready to explore") {
  splashReadyScreen = "";
  $("splash-status").textContent = status;
  $("splash-continue-btn").textContent = "Loading";
  $("splash-continue-btn").disabled = true;
  const elapsed = performance.now() - splashStartedAt;
  window.setTimeout(() => {
    splashReadyScreen = targetScreen;
    $("splash-status").textContent = status;
    $("splash-continue-btn").textContent = "Continue";
    $("splash-continue-btn").disabled = false;
  }, Math.max(0, MIN_SPLASH_MS - elapsed));
}

function showSplashGate(targetScreen, status = "Ready to explore") {
  splashStartedAt = performance.now();
  readySplash(targetScreen, status);
  setScreen("boot-screen");
}

function flagUrl(cc) {
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
  stageUnlock() {
    [392, 523, 659, 784, 1047].forEach((freq, index) => playTone(freq, 0.22, "sine", 0.075, index * 0.075));
    playTone(1318, 0.28, "triangle", 0.04, 0.38);
  },
};

function renderMenu() {
  $("menu-name").textContent = passport.name || "Explorer";
  $("menu-version").textContent = `GeoSpark v${APP_VERSION}`;
  $("result-version").textContent = `GeoSpark v${APP_VERSION}`;
  $("menu-character-art").src = MENU_CHARACTER_ART[passport.archetype] || MENU_CHARACTER_ART.historian;
  $("menu-character-art").alt = `${getArchetype().label} guide`;
  $("menu-stage").textContent = currentStage().name;
  $("menu-sparks").textContent = passport.currencies.geoSparks;
  $("menu-airmiles").textContent = passport.currencies.airMiles;
  const hasJourneyProgress = passport.journey.stage > 1 || passport.journey.level > 0 || passport.journey.stamps.length > 0;
  $("journey-label").textContent = hasJourneyProgress ? "Continue the Journey" : "Journey";
  $("journey-copy").textContent = hasJourneyProgress
    ? `Stage ${passport.journey.stage}: ${currentStage().name}`
    : "Campaign progression";
  $("journey-action").textContent = hasJourneyProgress ? "Continue" : "Start";

  const zenUnlocked = passport.unlocks.zen;
  $("zen-btn").classList.toggle("locked", !zenUnlocked);
  $("zen-label").textContent = zenUnlocked ? "Zen" : "Zen Locked";
  $("zen-copy").textContent = zenUnlocked ? "Stress-free sandbox" : `Complete Asia or buy for ${ZEN_UNLOCK_COST.toLocaleString()} AirMiles`;
  $("zen-action").textContent = zenUnlocked ? "Relax" : "Lock";

  $("stage-track").innerHTML = STAGES.map((stage) => {
    const isComplete = passport.journey.stamps.includes(stage.name);
    const isCurrent = passport.journey.stage === stage.id;
    const status = isComplete ? "complete" : isCurrent ? "current" : "";
    return `<div class="stage-pill ${status}"><strong>${stage.id}. ${stage.name}</strong><small>${isComplete ? "Stamped" : isCurrent ? "In progress" : "Locked ahead"}</small></div>`;
  }).join("");
}

function openNewGameDialog() {
  Sound.tap();
  $("new-game-dialog").classList.remove("hidden");
}

function closeNewGameDialog() {
  Sound.tap();
  $("new-game-dialog").classList.add("hidden");
}

function confirmNewGame() {
  Sound.tap();
  localStorage.removeItem(STORAGE_KEY);
  passport = defaultPassport();
  $("player-name").value = "";
  document.querySelectorAll(".choice-card").forEach((item) => item.classList.toggle("selected", item.dataset.archetype === "historian"));
  $("new-game-dialog").classList.add("hidden");
  stopTimer();
  state.running = false;
  state.paused = false;
  setScreen("onboarding-screen");
}

function allLearningItems() {
  return DATA_FILES
    .flatMap((file) => geoData[file] || [])
    .filter((item, index, list) => list.findIndex((other) => other.name === item.name && other.continent === item.continent) === index)
    .sort((a, b) => a.continent.localeCompare(b.continent) || a.name.localeCompare(b.name));
}

function startLearning(region = state.learnRegion) {
  Sound.tap();
  state.learnRegion = region;
  renderLearning();
  setScreen("learn-screen");
}

function renderLearning() {
  const items = allLearningItems().filter((item) => state.learnRegion === "all" || item.continent === state.learnRegion);
  $("learn-count").textContent = items.length;
  $("learn-tabs").innerHTML = LEARN_REGIONS.map((region) =>
    `<button class="learn-tab ${region.id === state.learnRegion ? "active" : ""}" type="button" data-region="${escapeHtml(region.id)}">${escapeHtml(region.label)}</button>`
  ).join("");
  document.querySelectorAll(".learn-tab").forEach((button) => onPress(button, () => {
    Sound.tap();
    state.learnRegion = button.dataset.region;
    renderLearning();
  }));
  $("learn-list").innerHTML = items.map((item) => `
    <article class="learn-card">
      <img src="${flagUrl(item.cc)}" alt="">
      <div>
        <b>${escapeHtml(item.name)}</b>
        <span>${escapeHtml(item.capital)} · ${escapeHtml(item.city)} · ${escapeHtml(item.continent)}</span>
      </div>
    </article>
  `).join("");
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
  clearTimeout(state.launchTimer);
  stopTimer();
  Sound.tap();
  const title = mode === "journey" ? (passport.journey.stage > 1 || passport.journey.level > 0 ? "Continue the Journey" : "Journey") : mode === "challenge" ? "Challenge" : "Zen";
  $("launch-title").textContent = title;
  $("launch-copy").textContent = mode === "journey"
    ? `${currentStage().name} · Level ${passport.journey.level}`
    : mode === "challenge"
      ? "Timer armed. Deep breath."
      : "No timer. No pressure.";
  setScreen("launch-screen");
  state.launchTimer = setTimeout(() => launchMode(mode), MODE_START_DELAY_MS);
}

function launchMode(mode) {
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
    wrongTimes: [],
    studySuggested: false,
    stageUnlock: null,
  });
  $("game-screen").classList.toggle("zen-mode", mode === "zen");
  $("game-screen").classList.remove("paused");
  $("pause-overlay").classList.add("hidden");
  $("stage-unlock-overlay").classList.add("hidden");
  $("journey-progress-track").classList.toggle("hidden", mode !== "journey");
  $("tool-row").classList.toggle("hidden", mode !== "journey");
  $("run-progress").classList.toggle("hidden", mode === "zen");
  $("hud-mode").textContent = mode === "journey" ? `Journey · ${currentStage().name}` : mode === "challenge" ? "Challenge" : "Zen";
  setScreen("game-screen");
  nextQuestion();
}

function buyZenOrNudge() {
  if (passport.currencies.airMiles >= ZEN_UNLOCK_COST) {
    passport.currencies.airMiles -= ZEN_UNLOCK_COST;
    passport.unlocks.zen = true;
    savePassport();
    renderMenu();
    return;
  }
  $("zen-copy").textContent = `${ZEN_UNLOCK_COST - passport.currencies.airMiles} more AirMiles needed, or complete Asia.`;
}

function questionPool() {
  const pool = state.mode === "challenge" ? poolForStage(6) : poolForStage(passport.journey.stage);
  return pool.filter(allowedByDifficulty);
}

function pickQuestion() {
  const pool = questionPool();
  const countryPool = pool.filter(isCountry);
  const usStatePool = pool.filter(isUSState);
  const eligible = pool.filter((item) => !state.recent.includes(item.name));
  const source = eligible.length >= 4 ? eligible : pool;
  const type = questionTypeForPool(usStatePool);
  const answerSource = type === "flag" ? source.filter(isCountry) : source;
  const fallbackSource = type === "flag" ? countryPool : pool;
  const answerPool = answerSource.length >= 4 ? answerSource : fallbackSource;
  const stateAnswerSource = usStatePool.filter((item) => !state.recent.includes(item.name));
  const isStateDrill = type === "stateCode" || type === "stateAbbr";
  const finalAnswerPool = isStateDrill
    ? (stateAnswerSource.length >= 4 ? stateAnswerSource : usStatePool)
    : answerPool;
  const answer = finalAnswerPool[Math.floor(Math.random() * finalAnswerPool.length)];
  state.recent.push(answer.name);
  if (state.recent.length > 8) state.recent.shift();
  const distractorPool = isStateDrill ? usStatePool : type === "flag" ? countryPool : pool;
  const wrongs = shuffle(distractorPool.filter((item) => item.name !== answer.name)).slice(0, 3);

  if (type === "mapIdentify") {
    return {
      type,
      answer,
      correct: answer.name,
      badge: "Map to Territory",
      prompt: "Name the highlighted country",
      subtitle: "Europe map stage",
      map: { region: "Europe", target: answer.name, mode: "identify" },
      options: shuffle([answer.name, ...wrongs.map((item) => item.name)]),
    };
  }

  if (type === "mapSelect") {
    return {
      type,
      answer,
      correct: answer.name,
      badge: "Territory to Map",
      prompt: `Tap ${answer.name}`,
      subtitle: EUROPE_MICROSTATES.has(answer.name) ? "Use the enlarged pin/inset target" : "Select it on the Europe map",
      map: { region: "Europe", target: answer.name, mode: "select" },
      options: [],
    };
  }

  if (type === "stateCode") {
    return {
      type,
      answer,
      correct: answer.name,
      badge: "State Flag to State",
      prompt: stateAbbr(answer),
      subtitle: "Which US state uses this flag?",
      flag: answer.cc,
      options: shuffle([answer.name, ...wrongs.map((item) => item.name)]),
    };
  }

  if (type === "stateAbbr") {
    return {
      type,
      answer,
      correct: stateAbbr(answer),
      badge: "State Flag to Code",
      prompt: answer.name,
      subtitle: "Which abbreviation matches this state?",
      flag: answer.cc,
      options: shuffle([stateAbbr(answer), ...wrongs.map((item) => stateAbbr(item))]),
    };
  }

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
      flag: answer.cc,
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
  $("game-screen").classList.toggle("map-question", Boolean(q.map));
  $("question-panel").classList.toggle("map-question", Boolean(q.map));
  $("question-badge").textContent = q.badge;
  $("question-text").textContent = q.prompt;
  $("question-subtitle").textContent = q.subtitle || "";
  $("zen-title").classList.toggle("hidden", state.mode !== "zen");
  $("zen-title").textContent = state.mode === "zen" ? q.answer.name : "";

  $("flag-display").classList.toggle("map-display", Boolean(q.map));
  $("flag-display").classList.toggle("empty", !q.flag && !q.map);
  $("flag-display").innerHTML = q.map ? renderEuropeMap(q.map) : q.flag ? `<img src="${flagUrl(q.flag)}" alt="">` : "";
  if (q.map?.mode === "select") {
    $("answer-grid").innerHTML = "";
    document.querySelectorAll(".map-country").forEach((button) => onPress(button, () => answerQuestion(button.dataset.answer, button)));
  } else {
    $("answer-grid").innerHTML = q.options.map((option) => `<button class="answer-btn" type="button" data-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join("");
  }
  document.querySelectorAll(".answer-btn").forEach((button) => onPress(button, () => answerQuestion(button.dataset.answer, button)));
  $("feedback-line").textContent = "";
}

function renderEuropeMap(map) {
  const countries = europeMapData.map((feature, index) => {
    const name = feature.name;
    const isTarget = name === map.target;
    const isHighlighted = isTarget && map.mode === "identify";
    const color = isHighlighted ? "#ff4d5e" : MAP_COLORS[index % MAP_COLORS.length];
    return `<path class="map-country ${isHighlighted ? "target" : ""}" data-answer="${escapeHtml(name)}" aria-label="${escapeHtml(name)}" d="${geometryToPath(feature.geometry)}" style="--map-color:${color}"></path>`;
  }).join("");
  const pins = [...EUROPE_MICROSTATES].map((name) => {
    const [left, top] = EUROPE_PIN_POSITIONS[name];
    const isTarget = name === map.target;
    const isHighlighted = isTarget && map.mode === "identify";
    return `<button class="map-pin ${isHighlighted ? "target" : ""}" type="button" data-answer="${escapeHtml(name)}" aria-label="${escapeHtml(name)}" style="left:${left}%;top:${top}%">${escapeHtml(name.slice(0, 2).toUpperCase())}</button>`;
  }).join("");
  return `
    <div class="europe-map ${map.mode}" role="group" aria-label="Europe map question">
      <div class="map-board">
        <svg class="map-svg" viewBox="0 0 ${EUROPE_MAP_BOUNDS.width} ${EUROPE_MAP_BOUNDS.height}" aria-hidden="true">${countries}</svg>
        ${pins}
      </div>
      <div class="map-inset"><b>Small countries</b><span>Tap enlarged pins for microstates</span></div>
    </div>
  `;
}

function geometryToPath(geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.map((polygon) => polygon
    .filter(ringInEurope)
    .map((ring) => ring.map(([lon, lat], index) => {
      const [x, y] = projectEuropePoint(lon, lat);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join("") + "Z")
    .join("")).join("");
}

function ringInEurope(ring) {
  const bounds = ring.reduce((acc, [lon, lat]) => ({
    minLon: Math.min(acc.minLon, lon),
    maxLon: Math.max(acc.maxLon, lon),
    minLat: Math.min(acc.minLat, lat),
    maxLat: Math.max(acc.maxLat, lat),
  }), { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity });
  return bounds.maxLon >= EUROPE_MAP_BOUNDS.minLon - 8
    && bounds.minLon <= EUROPE_MAP_BOUNDS.maxLon + 8
    && bounds.maxLat >= EUROPE_MAP_BOUNDS.minLat - 4
    && bounds.minLat <= EUROPE_MAP_BOUNDS.maxLat + 4;
}

function projectEuropePoint(lon, lat) {
  const clampedLon = Math.max(EUROPE_MAP_BOUNDS.minLon - 7, Math.min(EUROPE_MAP_BOUNDS.maxLon + 7, lon));
  const clampedLat = Math.max(EUROPE_MAP_BOUNDS.minLat - 4, Math.min(EUROPE_MAP_BOUNDS.maxLat + 4, lat));
  const x = ((clampedLon - EUROPE_MAP_BOUNDS.minLon) / (EUROPE_MAP_BOUNDS.maxLon - EUROPE_MAP_BOUNDS.minLon)) * EUROPE_MAP_BOUNDS.width;
  const y = ((EUROPE_MAP_BOUNDS.maxLat - clampedLat) / (EUROPE_MAP_BOUNDS.maxLat - EUROPE_MAP_BOUNDS.minLat)) * EUROPE_MAP_BOUNDS.height;
  return [x, y];
}

function answerQuestion(value, button) {
  if (!state.running || state.paused) return;
  stopTimer();
  const q = state.question;
  const correct = value === q.correct;
  let unlockedStage = null;
  if (button.classList) button.classList.add(correct ? "correct" : "wrong");
  document.querySelectorAll(".answer-btn, .map-country, .map-pin").forEach((btn) => {
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
      if (state.streak > 1 && state.streak % GEOSPARK_STREAK_INTERVAL === 0) {
        passport.currencies.geoSparks += GEOSPARK_STREAK_REWARD;
      }
    }
    $("feedback-line").textContent = `Sparked ${q.answer.name}`;
    unlockedStage = checkProgression();
  } else {
    Sound.wrong();
    haptic("wrong");
    state.streak = 0;
    state.lives -= 1;
    recordWrongBurst();
    $("feedback-line").textContent = state.studySuggested
      ? `${q.correct} · Learning mode may help before another run.`
      : q.correct;
  }

  updateHud();
  savePassport();

  if (unlockedStage) {
    setTimeout(() => showStageUnlock(unlockedStage), 650);
    return;
  }

  if (state.mode !== "zen" && state.lives <= 0) {
    setTimeout(() => finishRun("Out of lives"), 850);
    return;
  }
  setTimeout(nextQuestion, state.mode === "zen" ? 520 : 850);
}

function checkProgression() {
  if (state.mode !== "journey") return null;
  const archetype = getArchetype();
  if (state.levelProgress < archetype.questionsPerLevel) return null;
  state.levelProgress = 0;
  passport.journey.level += 1;
  passport.currencies.airMiles += AIRMILES_LEVEL_REWARD;

  if (passport.journey.level >= archetype.levelsPerStage) {
    return completeStage();
  }
  return null;
}

function completeStage() {
  const completed = currentStage();
  if (!passport.journey.stamps.includes(completed.name)) passport.journey.stamps.push(completed.name);
  passport.currencies.airMiles += AIRMILES_STAGE_REWARD;
  if (completed.id === 3) passport.unlocks.zen = true;
  if (completed.id < STAGES.length) {
    passport.journey.stage = completed.id + 1;
    passport.journey.level = 0;
    const unlockedStage = currentStage();
    Sound.stageUnlock();
    $("hud-mode").textContent = `Journey · ${unlockedStage.name}`;
    return unlockedStage;
  } else {
    passport.journey.level = getArchetype().levelsPerStage;
  }
  Sound.levelUp();
  $("hud-mode").textContent = `Journey · ${currentStage().name}`;
  return null;
}

function showStageUnlock(stage) {
  const details = STAGE_UNLOCK_DETAILS[stage.id] || {
    region: stage.name,
    copy: `${stage.name} has joined your journey.`,
    mapLabel: stage.name,
    mapClass: "global",
  };
  state.stageUnlock = stage.id;
  state.paused = true;
  $("stage-unlock-title").textContent = `${details.region} Unlocked`;
  $("stage-unlock-copy").textContent = details.copy;
  $("stage-unlock-label").textContent = details.mapLabel;
  $("stage-unlock-bonus").textContent = stage.id === 4
    ? "New drills added"
    : stage.id === 6
      ? "Final region pool opened"
      : "New region added";
  const map = $("stage-unlock-map");
  map.className = `stage-map ${details.mapClass}`;
  $("stage-unlock-overlay").classList.remove("hidden");
}

function continueStageUnlock() {
  Sound.tap();
  $("stage-unlock-overlay").classList.add("hidden");
  state.stageUnlock = null;
  state.paused = false;
  updateHud();
  savePassport();
  nextQuestion();
}

function autoCorrect() {
  if (state.mode !== "journey" || passport.currencies.geoSparks < AUTO_CORRECT_COST || !state.question) return;
  passport.currencies.geoSparks -= AUTO_CORRECT_COST;
  const target = [...document.querySelectorAll(".answer-btn")].find((btn) => btn.dataset.answer === state.question.correct);
  if (target) answerQuestion(target.dataset.answer, target);
}

function skipLevel() {
  if (state.mode !== "journey" || passport.currencies.airMiles < SKIP_LEVEL_COST) return;
  passport.currencies.airMiles -= SKIP_LEVEL_COST;
  state.levelProgress = getArchetype().questionsPerLevel;
  const unlockedStage = checkProgression();
  savePassport();
  updateHud();
  if (unlockedStage) {
    showStageUnlock(unlockedStage);
    return;
  }
  nextQuestion();
}

function updateHud() {
  const archetype = getArchetype();
  const progress = state.mode === "journey" ? (state.levelProgress / archetype.questionsPerLevel) * 100 : 0;
  $("journey-progress-fill").style.width = `${Math.min(100, progress)}%`;
  const stage = currentStage();
  const levelWithinStage = Math.max(0, Math.min(passport.journey.level, archetype.levelsPerStage));
  const questionWithinLevel = Math.min(state.levelProgress, archetype.questionsPerLevel);
  const answeredInStage = (levelWithinStage * archetype.questionsPerLevel) + questionWithinLevel;
  const totalInStage = archetype.levelsPerStage * archetype.questionsPerLevel;
  const sectionPercent = state.mode === "journey"
    ? Math.round((answeredInStage / totalInStage) * 100)
    : Math.min(100, Math.round((state.score / Math.max(1, passport.best.challenge || state.score || 1000)) * 100));
  $("stage-progress-label").textContent = state.mode === "journey" ? `Stage ${stage.id}/${STAGES.length} · ${stage.name}` : "Challenge Run";
  $("level-progress-label").textContent = state.mode === "journey" ? `Level ${levelWithinStage}/${archetype.levelsPerStage}` : `Score ${state.score}`;
  $("question-progress-label").textContent = state.mode === "journey" ? `Question ${questionWithinLevel}/${archetype.questionsPerLevel}` : `${Math.ceil(state.timerMs / 1000)} seconds left`;
  $("section-progress-label").textContent = state.mode === "journey" ? `${sectionPercent}% section` : `Best ${passport.best.challenge}`;
  $("section-progress-fill").style.width = `${Math.min(100, sectionPercent)}%`;

  if (state.mode === "challenge") {
    $("hud-stats").textContent = `${Math.ceil(state.timerMs / 1000)}s · ${state.score} · Best ${passport.best.challenge}`;
  } else if (state.mode === "journey") {
    $("hud-stats").textContent = `${passport.currencies.geoSparks} GS · ${passport.currencies.airMiles} AM`;
  } else {
    $("hud-stats").textContent = "";
  }
  $("auto-correct-btn").disabled = passport.currencies.geoSparks < AUTO_CORRECT_COST;
  $("skip-level-btn").disabled = passport.currencies.airMiles < SKIP_LEVEL_COST;
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

function applyJourneyFailurePenalty() {
  const oldGeoSparks = passport.currencies.geoSparks;
  const oldAirMiles = passport.currencies.airMiles;
  passport.currencies.geoSparks = Math.floor(oldGeoSparks * JOURNEY_FAILURE_KEEP_RATIO);
  passport.currencies.airMiles = Math.floor(oldAirMiles * JOURNEY_FAILURE_KEEP_RATIO);
  passport.journey.level = 0;
  state.levelProgress = 0;
  return {
    geoSparks: oldGeoSparks - passport.currencies.geoSparks,
    airMiles: oldAirMiles - passport.currencies.airMiles,
    questionsPerLevel: getArchetype().questionsPerLevel,
    levelsPerStage: getArchetype().levelsPerStage,
  };
}

function finishRun(reason) {
  stopTimer();
  state.running = false;
  const journeyFailed = state.mode === "journey" && reason === "Out of lives";
  const penalty = journeyFailed ? applyJourneyFailurePenalty() : null;
  if (state.mode === "challenge" && state.score > passport.best.challenge) {
    passport.best.challenge = state.score;
  }
  savePassport();
  $("result-title").textContent = reason;
  $("result-copy").textContent = journeyFailed
    ? `Stage ${passport.journey.stage} stays unlocked. Level reset to 0/${penalty.levelsPerStage} and questions reset to 0/${penalty.questionsPerLevel}. Penalty: -${penalty.geoSparks} GeoSparks and -${penalty.airMiles} AirMiles.`
    : state.studySuggested
      ? "A few misses came close together. Spend a little time in Learning mode, then come back sharper."
      : state.mode === "challenge" ? `Best challenge score: ${passport.best.challenge}` : `Passport updated for ${passport.name}.`;
  $("result-score").textContent = state.score;
  $("result-learning-btn").classList.toggle("hidden", !state.studySuggested);
  setScreen("result-screen");
}

function backToMenu() {
  clearTimeout(state.launchTimer);
  stopTimer();
  state.running = false;
  state.paused = false;
  $("game-screen").classList.remove("paused");
  $("pause-overlay").classList.add("hidden");
  $("stage-unlock-overlay").classList.add("hidden");
  renderMenu();
  setScreen("menu-screen");
}

function recordWrongBurst() {
  const now = Date.now();
  state.wrongTimes = state.wrongTimes
    .filter((time) => now - time <= STUDY_SUGGESTION_WINDOW_MS)
    .concat(now);
  if (state.wrongTimes.length >= STUDY_SUGGESTION_WRONGS) {
    state.studySuggested = true;
  }
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
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 4);
    const width = Math.max(1280, Math.round(rect.width * dpr));
    const height = Math.max(1280, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }
  const landmasses = [
    [[-168, 58], [-142, 70], [-96, 72], [-54, 54], [-60, 28], [-86, 14], [-104, 20], [-126, 33], [-150, 48]],
    [[-82, 12], [-64, 8], [-48, -10], [-56, -34], [-70, -56], [-80, -38], [-76, -18]],
    [[-12, 36], [2, 54], [28, 60], [46, 48], [32, 36], [12, 38]],
    [[-18, 33], [8, 36], [34, 28], [48, 4], [32, -34], [12, -35], [-6, -12], [-14, 12]],
    [[34, 8], [44, 32], [70, 52], [112, 58], [148, 44], [142, 18], [106, 8], [78, 22], [58, 6]],
    [[112, -12], [154, -18], [150, -38], [116, -43], [108, -28]],
    [[-45, 72], [-24, 78], [-18, 62], [-42, 58]],
  ];
  const islandDots = [
    [-6, 53, 3.2], [-19, 65, 2.4], [14, 35, 1.8], [35, -20, 2], [47, -19, 2.7],
    [73, 4, 1.5], [103, 1, 1.4], [121, 15, 2], [127, -8, 1.8], [174, -41, 2.3],
    [-61, 15, 1.4], [-157, 21, 1.4], [-170, -14, 1.2], [178, -18, 1.1],
  ];

  function project(lon, lat, rotation, radius, cx, cy) {
    const lambda = (lon + rotation) * Math.PI / 180;
    const phi = lat * Math.PI / 180;
    const x = radius * Math.cos(phi) * Math.sin(lambda);
    const y = -radius * Math.sin(phi);
    const z = Math.cos(phi) * Math.cos(lambda);
    return { x: cx + x, y: cy + y, z };
  }

  function drawLongitude(rotation, lon, radius, cx, cy) {
    ctx.beginPath();
    let started = false;
    for (let lat = -82; lat <= 82; lat += 2) {
      const point = project(lon, lat, rotation, radius, cx, cy);
      if (point.z <= 0) {
        started = false;
        continue;
      }
      if (!started) {
        ctx.moveTo(point.x, point.y);
        started = true;
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.stroke();
  }

  function drawLatitude(rotation, lat, radius, cx, cy) {
    ctx.beginPath();
    let started = false;
    for (let lon = -180; lon <= 180; lon += 2) {
      const point = project(lon, lat, rotation, radius, cx, cy);
      if (point.z <= 0) {
        started = false;
        continue;
      }
      if (!started) {
        ctx.moveTo(point.x, point.y);
        started = true;
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.stroke();
  }

  function drawLand(rotation, radius, cx, cy) {
    landmasses.forEach((shape) => {
      ctx.beginPath();
      let visiblePoints = 0;
      shape.forEach(([lon, lat]) => {
        const point = project(lon, lat, rotation, radius, cx, cy);
        if (point.z <= -0.08) return;
        if (visiblePoints === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
        visiblePoints += 1;
      });
      if (visiblePoints >= 3) {
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    });
  }

  const render = (now) => {
    resizeCanvas();
    const width = canvas.width;
    const height = canvas.height;
    const radius = width * 0.38;
    const cx = width / 2;
    const cy = height / 2;
    const rotation = now * 0.012;
    ctx.clearRect(0, 0, width, height);

    const ocean = ctx.createRadialGradient(cx - radius * 0.32, cy - radius * 0.36, radius * 0.1, cx, cy, radius);
    ocean.addColorStop(0, "#2c6f9f");
    ocean.addColorStop(0.6, "#123f6d");
    ocean.addColorStop(1, "#06101f");
    ctx.fillStyle = ocean;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = "rgba(179, 191, 208, 0.16)";
    ctx.lineWidth = Math.max(1, width / 1280);
    [-60, -30, 0, 30, 60].forEach((lat) => drawLatitude(rotation, lat, radius, cx, cy));
    [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].forEach((lon) => drawLongitude(rotation, lon, radius, cx, cy));

    ctx.fillStyle = "#35e0b2";
    ctx.strokeStyle = "rgba(244, 247, 251, 0.24)";
    ctx.lineWidth = Math.max(1.4, width / 980);
    drawLand(rotation, radius, cx, cy);

    ctx.fillStyle = "#35e0b2";
    islandDots.forEach(([lon, lat, size]) => {
      const point = project(lon, lat, rotation, radius, cx, cy);
      if (point.z <= 0) return;
      ctx.globalAlpha = 0.42 + point.z * 0.58;
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(1.6, size * width / 960), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(255, 209, 102, 0.86)";
    [[2, 48], [-3, 40], [12, 42], [18, 59], [-74, 41], [139, 36], [151, -34]].forEach(([lon, lat]) => {
      const point = project(lon, lat, rotation, radius, cx, cy);
      if (point.z <= 0) return;
      ctx.globalAlpha = 0.35 + point.z * 0.65;
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(2.1, width / 430), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.restore();

    const rim = ctx.createRadialGradient(cx - radius * 0.25, cy - radius * 0.35, radius * 0.3, cx, cy, radius * 1.05);
    rim.addColorStop(0, "rgba(255,255,255,0.16)");
    rim.addColorStop(0.58, "rgba(255,255,255,0)");
    rim.addColorStop(1, "rgba(0,0,0,0.46)");
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(82, 183, 255, 0.44)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

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
  onPress($("splash-continue-btn"), continueFromSplash);
  onPress($("journey-btn"), () => startMode("journey"));
  onPress($("new-game-btn"), openNewGameDialog);
  onPress($("new-game-cancel-btn"), closeNewGameDialog);
  onPress($("new-game-confirm-btn"), confirmNewGame);
  onPress($("challenge-btn"), () => startMode("challenge"));
  onPress($("learning-btn"), () => startLearning("all"));
  onPress($("zen-btn"), () => startMode("zen"));
  onPress($("back-menu-btn"), backToMenu);
  onPress($("learn-back-btn"), backToMenu);
  onPress($("pause-btn"), pauseGame);
  onPress($("resume-btn"), resumeGame);
  onPress($("stage-unlock-continue-btn"), continueStageUnlock);
  onPress($("result-menu-btn"), backToMenu);
  onPress($("result-learning-btn"), () => startLearning("all"));
  onPress($("auto-correct-btn"), autoCorrect);
  onPress($("skip-level-btn"), skipLevel);
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      lastVisibleScreen = state.view === "boot-screen" ? splashReadyScreen : state.view;
      if (state.running && state.mode !== "zen") {
        stopTimer();
        state.paused = true;
        splashPausedRun = true;
      }
      return;
    }
    if (lastVisibleScreen && Date.now() - hiddenAt >= FOREGROUND_SPLASH_AFTER_MS) {
      showSplashGate(lastVisibleScreen, "Welcome back");
      return;
    }
    if (state.running && state.mode !== "zen" && !state.paused) startTimer();
  });
}

async function init() {
  wireEvents();
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  await loadGeoData();
  if (!passport.name) {
    readySplash("onboarding-screen");
  } else {
    renderMenu();
    readySplash("menu-screen");
  }
}

init().catch(() => {
  $("splash-status").textContent = "Could not load geography data.";
  $("splash-continue-btn").textContent = "Retry";
  $("splash-continue-btn").disabled = false;
  onPress($("splash-continue-btn"), () => window.location.reload());
});
