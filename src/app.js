const STORAGE_KEY = "geospark3.passport";
const APP_VERSION = "0.6.1";
const PASSPORT_VERSION = 2;

// Pacing is shared by every character so characters can be switched without losing progress.
const QUESTIONS_PER_LEVEL = 10;
const LEVELS_PER_STAGE = 10;
// Pre-0.6 pacing, used only to migrate old saves.
const LEGACY_LEVELS_PER_STAGE = { historian: 7, backpacker: 12, pilot: 20 };

// Economy
const AUTO_CORRECT_COST = 20;
const SKIP_LEVEL_COST = 750;
const ZEN_UNLOCK_COST = 1500;
const GEOSPARK_STREAK_MIN = 3;
const AIRMILES_LEVEL_REWARD = 25;
const AIRMILES_STAGE_REWARD = 150;
const TAILWIND_AIRMILES = 2;
const BADGE_REWARDS = [50, 150, 400];

const MIN_SPLASH_MS = 1400;
const MODE_START_DELAY_MS = 900;
const ANSWER_DELAY_MS = 850;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 18;
const TIMEOUT = "__timeout__";
const RECENT_LIMIT = 12;

const ARCHETYPES = {
  historian: {
    label: "The Historian",
    tagline: "The scholar. Time to think, knowledge to spare.",
    timerMs: 25000,
    challengeMs: 75000,
    lives: 3,
    scoreMult: 1,
    streakMult: 0.5,
    regenEvery: 0,
    tailwindMs: 0,
    mapsFromStart: false,
    mapRate: 0.3,
    typeWeights: { flag: 1, capital: 2, city: 1.6 },
    ability: { id: "recall", name: "Recall", icon: "📜", uses: 2, desc: "Remove two wrong answers" },
    passive: "25-second answer timer",
    tradeoff: "Streak bonus is halved",
    bias: "More capitals and cities",
  },
  backpacker: {
    label: "The Backpacker",
    tagline: "The survivor. Hard to knock down, quick to recover.",
    timerMs: 18000,
    challengeMs: 60000,
    lives: 4,
    scoreMult: 1,
    streakMult: 1,
    regenEvery: 10,
    tailwindMs: 0,
    mapsFromStart: false,
    mapRate: 0.3,
    typeWeights: { flag: 2, capital: 1, city: 1 },
    ability: { id: "local", name: "Ask a Local", icon: "🧭", uses: 3, desc: "Reveal a clue about the answer" },
    passive: "4 hearts, +1 heart every 10 correct",
    tradeoff: "Standard scoring",
    bias: "More flags",
  },
  pilot: {
    label: "The Pilot",
    tagline: "The speedster. High risk, double reward.",
    timerMs: 12000,
    challengeMs: 45000,
    lives: 2,
    scoreMult: 2,
    streakMult: 1,
    regenEvery: 0,
    tailwindMs: 4000,
    mapsFromStart: true,
    mapRate: 0.45,
    typeWeights: { flag: 1, capital: 1, city: 1 },
    ability: { id: "autopilot", name: "Autopilot", icon: "✈️", uses: 1, desc: "Skip a question and keep your streak" },
    passive: "Double points, Tailwind bonus under 4s",
    tradeoff: "12-second timer, 2 hearts",
    bias: "Map questions from level 1",
  },
};
const ARCHETYPE_ORDER = ["historian", "backpacker", "pilot"];
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
  "France", "Germany", "Italy", "Spain", "United Kingdom", "Ireland",
  "Netherlands", "Portugal", "Greece", "Sweden", "Norway", "Poland",
]);
const EUROPE_CORE = new Set([
  ...EUROPE_TOP_HITS,
  "Austria", "Belgium", "Croatia", "Czechia", "Denmark", "Finland",
  "Hungary", "Iceland", "Romania", "Switzerland", "Ukraine",
]);
const ENABLE_MAP_SELECT = false;
const EUROPE_MAP_LEVEL_START = 5; // level number (1-based) in Stage 1 for non-Pilot characters
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

// Region groups used by the mastery stamps.
const REGION_GROUPS = [
  { id: "euro-expert", name: "Euro Expert", icon: "🏰", continents: ["Europe"] },
  { id: "andes-ace", name: "Andes Ace", icon: "🦙", continents: ["South America"] },
  { id: "silk-road", name: "Silk Road Scholar", icon: "🏯", continents: ["Asia"] },
  { id: "stars-stripes", name: "Stars & Stripes", icon: "🦅", continents: ["US States"] },
  { id: "safari-sage", name: "Safari Sage", icon: "🦁", continents: ["Africa"] },
  { id: "island-hopper", name: "Island Hopper", icon: "🏝️", continents: ["North America", "Oceania"] },
];

const BADGES = [
  { id: "flag-bearer", name: "Flag Bearer", icon: "🏳️", category: "Mastery", desc: "Different flags identified", tiers: [25, 100, 195], value: () => countItems((s) => s.f > 0) },
  { id: "capital-gains", name: "Capital Gains", icon: "🏛️", category: "Mastery", desc: "Different capitals named", tiers: [25, 100, 200], value: () => countItems((s) => s.k > 0) },
  ...REGION_GROUPS.map((group) => ({
    id: group.id,
    name: group.name,
    icon: group.icon,
    category: "Mastery",
    desc: `${group.continents.join(" & ")} places answered correctly 3 times`,
    tiersFn: () => {
      const size = regionItems(group.continents).length || 1;
      return [Math.ceil(size * 0.25), Math.ceil(size * 0.6), size];
    },
    value: () => regionItems(group.continents).filter((item) => (itemStats(item).c || 0) >= 3).length,
  })),
  { id: "hot-streak", name: "Hot Streak", icon: "🔥", category: "Skill", desc: "Best answer streak", tiers: [10, 25, 50], value: () => passport.stats.bestStreak },
  { id: "photo-finish", name: "Photo Finish", icon: "⏱️", category: "Skill", desc: "Correct with under 1 second left", tiers: [1, 10, 25], value: () => passport.stats.photoFinish },
  { id: "flawless", name: "Flawless", icon: "💎", category: "Skill", desc: "Journey levels cleared without losing a heart", tiers: [1, 10, 50], value: () => passport.stats.flawless },
  { id: "globetrotter", name: "Globetrotter", icon: "🌍", category: "Longevity", desc: "Correct answers in total", tiers: [100, 1000, 5000], value: () => passport.stats.totalCorrect },
  { id: "daily-traveller", name: "Daily Traveller", icon: "📅", category: "Longevity", desc: "Days played in a row", tiers: [3, 7, 30], value: () => passport.stats.bestDayStreak },
  { id: "comeback-kid", name: "Comeback Kid", icon: "🥊", category: "Resilience", desc: "Levels finished after dropping to 1 heart", tiers: [1, 5, 20], value: () => passport.stats.comebacks },
  { id: "second-wind", name: "Second Wind", icon: "🌬️", category: "Resilience", desc: "Last Chance questions survived", tiers: [1, 5, 15], value: () => passport.stats.lastChanceSaves },
  { id: "scholar", name: "Scholar", icon: "📜", category: "Historian", desc: "Correct answers after using Recall", tiers: [5, 25, 100], value: () => passport.stats.recallWins },
  { id: "survivor", name: "Survivor", icon: "🎒", category: "Backpacker", desc: "Hearts regained on the road", tiers: [3, 15, 50], value: () => passport.stats.heartsRegained },
  { id: "mach-one", name: "Mach One", icon: "✈️", category: "Pilot", desc: "Tailwind answers (under 4 seconds)", tiers: [10, 50, 200], value: () => passport.stats.tailwinds },
];
const TIER_NAMES = ["Bronze", "Silver", "Gold"];

const $ = (id) => document.getElementById(id);
const onPress = (el, fn) => {
  el.addEventListener("pointerup", (event) => {
    if (event.button > 0 || el.disabled) return;
    event.preventDefault();
    fn(event);
  });
  // Keyboard activation (Enter / Space) produces a click with detail 0.
  el.addEventListener("click", (event) => {
    if (event.detail === 0 && !el.disabled) fn(event);
  });
};

let passport = loadPassport();
let geoData = {};
let europeMapData = [];
let europeMapNames = new Set();
let europeMapCache = null;
let worldGlobeData = [];
let globeRaf = 0;
let audioReady = false;
let audioCtx = null;
let splashReadyScreen = "";
let splashStartedAt = performance.now();
let characterSelectMode = "create";

const state = {
  view: "boot",
  mode: null,
  running: false,
  paused: false,
  answered: false,
  question: null,
  score: 0,
  streak: 0,
  lives: 3,
  maxLives: 3,
  timerMs: 0,
  timerMaxMs: 0,
  timerEndsAt: 0,
  timerRaf: 0,
  timerShownSecond: -1,
  questionStartedAt: 0,
  levelProgress: 0,
  recent: [],
  learnRegion: "all",
  learnFocus: [],
  launchTimer: 0,
  stageUnlock: null,
  abilityUses: 0,
  abilityUsedThisQ: false,
  lastChanceUsed: false,
  lastChanceActive: false,
  livesLostThisLevel: 0,
  droppedToOne: false,
  run: null,
  pendingTimer: 0,
};

// All delayed game steps go through here so leaving a run can cancel them.
function schedule(fn, ms) {
  clearTimeout(state.pendingTimer);
  state.pendingTimer = setTimeout(fn, ms);
}

function cancelScheduled() {
  clearTimeout(state.pendingTimer);
}

// ─────────────────────────────────────────────
// Passport
// ─────────────────────────────────────────────
function defaultStats() {
  return {
    items: {},
    totalCorrect: 0,
    totalAnswered: 0,
    bestStreak: 0,
    photoFinish: 0,
    flawless: 0,
    comebacks: 0,
    lastChanceSaves: 0,
    recallWins: 0,
    heartsRegained: 0,
    tailwinds: 0,
    dayStreak: 0,
    bestDayStreak: 0,
    lastDay: "",
  };
}

function defaultPassport() {
  return {
    version: PASSPORT_VERSION,
    name: "",
    archetype: "historian",
    journey: { stage: 1, level: 0, stamps: [] },
    currencies: { geoSparks: 0, airMiles: 0 },
    unlocks: { journey: true, challenge: true, zen: false },
    best: { challenge: 0 },
    activeRun: null,
    stats: defaultStats(),
    badges: {},
  };
}

function migratePassport(old) {
  const fresh = defaultPassport();
  fresh.name = old.name || "";
  fresh.archetype = ARCHETYPES[old.archetype] ? old.archetype : "historian";
  const oldLevels = LEGACY_LEVELS_PER_STAGE[fresh.archetype] || 10;
  const oldLevel = Math.max(0, Number(old.journey?.level) || 0);
  fresh.journey = {
    stage: Math.min(STAGES.length, Math.max(1, Number(old.journey?.stage) || 1)),
    level: Math.min(LEVELS_PER_STAGE, Math.round((oldLevel / oldLevels) * LEVELS_PER_STAGE)),
    stamps: Array.isArray(old.journey?.stamps) ? old.journey.stamps : [],
  };
  fresh.currencies = {
    geoSparks: Math.max(0, Number(old.currencies?.geoSparks) || 0),
    airMiles: Math.max(0, Number(old.currencies?.airMiles) || 0),
  };
  fresh.unlocks = { ...fresh.unlocks, ...(old.unlocks || {}) };
  fresh.best = { challenge: Number(old.best?.challenge) || 0 };
  return fresh;
}

function loadPassport() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed && parsed.version === PASSPORT_VERSION) {
      parsed.stats = { ...defaultStats(), ...(parsed.stats || {}) };
      parsed.badges = parsed.badges || {};
      if (!("activeRun" in parsed)) parsed.activeRun = null;
      return parsed;
    }
    if (parsed && parsed.version === 1) {
      const migrated = migratePassport(parsed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (error) {
    console.error("GeoSpark: could not read passport", error);
  }
  return defaultPassport();
}

function savePassport() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(passport));
  } catch (_) {}
}

function todayKey(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function touchPlayDay() {
  const stats = passport.stats;
  const today = todayKey();
  if (stats.lastDay === today) return;
  stats.dayStreak = stats.lastDay === todayKey(-1) ? stats.dayStreak + 1 : 1;
  stats.bestDayStreak = Math.max(stats.bestDayStreak, stats.dayStreak);
  stats.lastDay = today;
}

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────
async function loadGeoData() {
  const entries = await Promise.all(DATA_FILES.map(async (file) => {
    const response = await fetch(`data/${file}.json`);
    return [file, await response.json()];
  }));
  geoData = Object.fromEntries(entries);
}

// The Europe map (1.9 MB) and globe load in the background so the menu isn't blocked.
function loadBackgroundData() {
  fetch("data/world_globe.json")
    .then((response) => response.json())
    .then((data) => { worldGlobeData = data; })
    .catch(() => {});
  fetch("data/europe_map.json")
    .then((response) => response.json())
    .then((data) => {
      europeMapData = data;
      europeMapNames = new Set(data.map((feature) => feature.name));
      europeMapCache = null;
    })
    .catch(() => {});
}

function allItems() {
  return DATA_FILES.flatMap((file) => geoData[file] || []);
}

function regionItems(continents) {
  return allItems().filter((item) => continents.includes(item.continent));
}

function itemStats(item) {
  return passport.stats.items[item.cc] || {};
}

function countItems(test) {
  return Object.values(passport.stats.items).filter(test).length;
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

function sameKind(a, b) {
  return isUSState(a) === isUSState(b);
}

function stateAbbr(item) {
  return item.cc.replace("us-", "").toUpperCase();
}

function flagUrl(cc) {
  return `assets/flags/${cc}.webp`;
}

function journeyDifficultyBand() {
  if (state.mode !== "journey" || passport.journey.stage !== 1) return 3;
  const level = Math.max(1, passport.journey.level + 1);
  if (level <= Math.ceil(LEVELS_PER_STAGE * 0.3)) return 1;
  if (level <= Math.ceil(LEVELS_PER_STAGE * 0.65)) return 2;
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
  if (!europeMapData.length) return false;
  if (state.mode !== "journey") return true;
  if (getArchetype().mapsFromStart) return true;
  if (passport.journey.stage > 1) return true;
  return passport.journey.level + 1 >= EUROPE_MAP_LEVEL_START;
}

// ─────────────────────────────────────────────
// Screens
// ─────────────────────────────────────────────
function setScreen(id) {
  ["boot-screen", "onboarding-screen", "menu-screen", "launch-screen", "learn-screen", "stamps-screen", "game-screen", "result-screen"].forEach((screenId) => {
    $(screenId).classList.toggle("hidden", screenId !== id);
  });
  state.view = id;
  if (id === "menu-screen") startGlobe();
  else stopGlobe();
}

function continueFromSplash() {
  if (!splashReadyScreen) return;
  unlockAudio();
  Sound.tap();
  const targetScreen = splashReadyScreen;
  splashReadyScreen = "";
  if (targetScreen === "menu-screen") renderMenu();
  setScreen(targetScreen);
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

// ─────────────────────────────────────────────
// Feedback: sound, haptics, toasts
// ─────────────────────────────────────────────
function haptic(kind) {
  if (!navigator.vibrate) return;
  if (kind === "spark") navigator.vibrate(28);
  if (kind === "wrong") navigator.vibrate([35, 45, 35]);
  if (kind === "badge") navigator.vibrate([20, 30, 60]);
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
  ability() {
    playTone(740, 0.12, "triangle", 0.06);
    playTone(988, 0.16, "triangle", 0.05, 0.08);
    playTone(1319, 0.2, "sine", 0.04, 0.16);
  },
  heart() {
    playTone(660, 0.12, "sine", 0.06);
    playTone(880, 0.18, "sine", 0.05, 0.1);
  },
  badge() {
    [784, 988, 1175, 1568].forEach((freq, index) => playTone(freq, 0.18, "sine", 0.06, index * 0.06));
  },
  lastChance() {
    playTone(330, 0.2, "sawtooth", 0.04);
    playTone(440, 0.24, "sawtooth", 0.04, 0.18);
  },
};

function showToast(html, kind = "") {
  const stack = $("toast-stack");
  const toast = document.createElement("div");
  toast.className = `toast ${kind}`;
  toast.innerHTML = html;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

// ─────────────────────────────────────────────
// Menu
// ─────────────────────────────────────────────
function badgeTierTotals() {
  const earned = BADGES.reduce((sum, badge) => sum + (passport.badges[badge.id] || 0), 0);
  const stamped = BADGES.filter((badge) => (passport.badges[badge.id] || 0) > 0).length;
  return { earned, possible: BADGES.length * 3, stamped };
}

function renderMenu() {
  const archetype = getArchetype();
  $("menu-name").textContent = passport.name || "Explorer";
  $("menu-version").textContent = `GeoSpark v${APP_VERSION}`;
  $("result-version").textContent = `GeoSpark v${APP_VERSION}`;
  $("menu-character-art").src = MENU_CHARACTER_ART[passport.archetype] || MENU_CHARACTER_ART.historian;
  $("menu-character-art").alt = `${archetype.label} guide`;
  $("menu-character-name").textContent = `${archetype.ability.icon} ${archetype.label}`;
  $("menu-stage").textContent = currentStage().name;
  $("menu-sparks").textContent = passport.currencies.geoSparks;
  $("menu-airmiles").textContent = passport.currencies.airMiles;

  const run = passport.activeRun;
  const hasJourneyProgress = passport.journey.stage > 1 || passport.journey.level > 0 || passport.journey.stamps.length > 0;
  if (run) {
    $("journey-label").textContent = "Resume Journey";
    $("journey-copy").textContent = `${currentStage().name} · Level ${passport.journey.level + 1} · ${run.levelProgress}/${QUESTIONS_PER_LEVEL} · ${"♥".repeat(Math.max(0, run.lives))}`;
    $("journey-action").textContent = "Resume";
  } else {
    $("journey-label").textContent = hasJourneyProgress ? "Continue the Journey" : "Journey";
    $("journey-copy").textContent = hasJourneyProgress
      ? `Stage ${passport.journey.stage}: ${currentStage().name} · Level ${Math.min(LEVELS_PER_STAGE, passport.journey.level + 1)}`
      : "Campaign progression";
    $("journey-action").textContent = hasJourneyProgress ? "Continue" : "Start";
  }
  $("challenge-copy").textContent = passport.best.challenge ? `Timed arcade run · Best ${passport.best.challenge}` : "Timed arcade run";

  const totals = badgeTierTotals();
  $("stamps-action").textContent = `${totals.stamped}/${BADGES.length}`;
  $("stamps-copy").textContent = `${totals.earned}/${totals.possible} tiers earned`;

  const zenUnlocked = passport.unlocks.zen;
  $("zen-btn").classList.toggle("locked", !zenUnlocked);
  $("zen-label").textContent = zenUnlocked ? "Zen" : "Zen Locked";
  $("zen-copy").textContent = zenUnlocked ? "Stress-free sandbox" : `Complete Asia or buy for ${ZEN_UNLOCK_COST.toLocaleString()} AirMiles`;
  $("zen-action").textContent = zenUnlocked ? "Relax" : (passport.currencies.airMiles >= ZEN_UNLOCK_COST ? "Buy" : "Lock");

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
  $("new-game-dialog").classList.add("hidden");
  stopTimer();
  state.running = false;
  state.paused = false;
  openCharacterSelect("create");
}

// ─────────────────────────────────────────────
// Character select (create passport or switch)
// ─────────────────────────────────────────────
function selectedArchetype() {
  return document.querySelector(".character-option.selected")?.dataset.archetype || "historian";
}

function selectArchetype(archetype) {
  const selected = ARCHETYPES[archetype] ? archetype : "historian";
  const selectedIndex = ARCHETYPE_ORDER.indexOf(selected);
  const left = ARCHETYPE_ORDER[(selectedIndex + ARCHETYPE_ORDER.length - 1) % ARCHETYPE_ORDER.length];
  const right = ARCHETYPE_ORDER[(selectedIndex + 1) % ARCHETYPE_ORDER.length];

  document.querySelectorAll(".character-option").forEach((item) => {
    const id = item.dataset.archetype;
    item.classList.toggle("selected", id === selected);
    item.classList.toggle("is-center", id === selected);
    item.classList.toggle("is-left", id === left);
    item.classList.toggle("is-right", id === right);
    item.setAttribute("aria-pressed", id === selected ? "true" : "false");
  });

  const data = ARCHETYPES[selected];
  $("character-detail").innerHTML = `
    <div class="detail-head"><b>${escapeHtml(data.label)}</b><span>${escapeHtml(data.tagline)}</span></div>
    <div class="detail-row"><small>Passive</small><span>${escapeHtml(data.passive)}</span></div>
    <div class="detail-row ability"><small>Ability</small><span>${data.ability.icon} ${escapeHtml(data.ability.name)} ×${data.ability.uses} · ${escapeHtml(data.ability.desc)}</span></div>
    <div class="detail-row trade"><small>Trade-off</small><span>${escapeHtml(data.tradeoff)}</span></div>
    <div class="detail-row"><small>Style</small><span>${escapeHtml(data.bias)}</span></div>
  `;
  if (characterSelectMode === "switch") {
    const isCurrent = selected === passport.archetype;
    $("create-passport-btn").textContent = isCurrent ? `Keep ${data.label}` : `Travel as ${data.label}`;
  }
}

function openCharacterSelect(mode) {
  characterSelectMode = mode;
  const switching = mode === "switch";
  $("onboarding-title").textContent = switching ? "Switch Character" : "GeoSpark";
  $("onboarding-copy").textContent = switching
    ? (passport.activeRun
      ? "Your passport, stamps and currencies stay the same. Switching ends your saved run; your level is kept."
      : "Your passport, stamps and currencies stay the same. Only your play style changes.")
    : "Create your passport and choose your travelling style. You can switch character later.";
  $("name-field-wrap").classList.toggle("hidden", switching);
  $("cancel-switch-btn").classList.toggle("hidden", !switching);
  $("create-passport-btn").textContent = "Create Passport";
  selectArchetype(switching ? passport.archetype : selectedArchetype());
  setScreen("onboarding-screen");
}

function confirmCharacterSelect() {
  Sound.tap();
  if (characterSelectMode === "switch") {
    const next = selectedArchetype();
    if (next !== passport.archetype) {
      passport.archetype = next;
      passport.activeRun = null;
      savePassport();
      showToast(`${ARCHETYPES[next].ability.icon} Now travelling as <b>${ARCHETYPES[next].label}</b>`);
    }
    renderMenu();
    setScreen("menu-screen");
    return;
  }
  const name = $("player-name").value.trim() || "Explorer";
  passport = defaultPassport();
  passport.name = name;
  passport.archetype = selectedArchetype();
  savePassport();
  renderMenu();
  setScreen("menu-screen");
}

function cancelCharacterSelect() {
  Sound.tap();
  renderMenu();
  setScreen("menu-screen");
}

// ─────────────────────────────────────────────
// Learning
// ─────────────────────────────────────────────
function allLearningItems() {
  return allItems()
    .filter((item, index, list) => list.findIndex((other) => other.cc === item.cc) === index)
    .sort((a, b) => a.continent.localeCompare(b.continent) || a.name.localeCompare(b.name));
}

function startLearning(region = state.learnRegion) {
  Sound.tap();
  state.learnRegion = region;
  renderLearning();
  setScreen("learn-screen");
}

function renderLearning() {
  const focus = new Set(state.learnFocus);
  const tabs = focus.size ? [{ id: "missed", label: `Missed (${focus.size})` }, ...LEARN_REGIONS] : LEARN_REGIONS;
  if (state.learnRegion === "missed" && !focus.size) state.learnRegion = "all";
  const items = allLearningItems().filter((item) => {
    if (state.learnRegion === "missed") return focus.has(item.cc);
    return state.learnRegion === "all" || item.continent === state.learnRegion;
  });
  $("learn-count").textContent = items.length;
  $("learn-tabs").innerHTML = tabs.map((region) =>
    `<button class="learn-tab ${region.id === state.learnRegion ? "active" : ""} ${region.id === "missed" ? "missed-tab" : ""}" type="button" data-region="${escapeHtml(region.id)}">${escapeHtml(region.label)}</button>`
  ).join("");
  document.querySelectorAll(".learn-tab").forEach((button) => onPress(button, () => {
    Sound.tap();
    state.learnRegion = button.dataset.region;
    renderLearning();
  }));
  $("learn-list").innerHTML = items.map((item) => {
    const mastered = (itemStats(item).c || 0) >= 3;
    const cityPart = item.city && item.city !== item.capital ? ` · City: ${escapeHtml(item.city)}` : "";
    return `
    <article class="learn-card ${mastered ? "mastered" : ""}">
      <img src="${flagUrl(item.cc)}" alt="" loading="lazy">
      <div>
        <b>${escapeHtml(item.name)}${mastered ? ' <em class="mastered-tag">Mastered</em>' : ""}</b>
        <span>Capital: ${escapeHtml(item.capital)}${cityPart} · ${escapeHtml(item.continent)}</span>
      </div>
    </article>`;
  }).join("");
}

// ─────────────────────────────────────────────
// Stamp Book
// ─────────────────────────────────────────────
function badgeTiers(badge) {
  return badge.tiersFn ? badge.tiersFn() : badge.tiers;
}

function badgeValue(badge) {
  try {
    return Number(badge.value()) || 0;
  } catch (_) {
    return 0;
  }
}

function openStampBook() {
  Sound.tap();
  renderStampBook();
  setScreen("stamps-screen");
}

function renderStampBook() {
  const totals = badgeTierTotals();
  $("stamps-count").textContent = `${totals.stamped}/${BADGES.length}`;
  $("stamps-summary").innerHTML = `
    <div><b>${totals.stamped}</b><small>Stamps</small></div>
    <div><b>${totals.earned}/${totals.possible}</b><small>Tiers</small></div>
    <div><b>${passport.stats.dayStreak || 0}</b><small>Day streak</small></div>
  `;
  let lastCategory = "";
  $("stamps-grid").innerHTML = BADGES.map((badge) => {
    const tiers = badgeTiers(badge);
    const tier = passport.badges[badge.id] || 0;
    const value = badgeValue(badge);
    const next = tiers[Math.min(tier, tiers.length - 1)];
    const done = tier >= tiers.length;
    const progress = done ? 100 : Math.min(100, Math.round((value / next) * 100));
    const header = badge.category !== lastCategory ? `<div class="stamps-category">${escapeHtml(badge.category)}</div>` : "";
    lastCategory = badge.category;
    const pips = tiers.map((_, index) => `<i class="pip ${index < tier ? `on t${index + 1}` : ""}"></i>`).join("");
    return `${header}
      <article class="stamp-card tier-${tier}">
        <div class="stamp-seal"><span>${badge.icon}</span></div>
        <div class="stamp-body">
          <b>${escapeHtml(badge.name)}</b>
          <small>${escapeHtml(badge.desc)}</small>
          <div class="stamp-progress"><div style="width:${progress}%"></div></div>
          <div class="stamp-meta"><span class="pips">${pips}</span><span>${done ? "Gold complete" : `${Math.min(value, next)}/${next} · ${TIER_NAMES[tier]}`}</span></div>
        </div>
      </article>`;
  }).join("");
}

function checkBadges() {
  const unlocked = [];
  BADGES.forEach((badge) => {
    const tiers = badgeTiers(badge);
    const value = badgeValue(badge);
    const current = passport.badges[badge.id] || 0;
    let reached = 0;
    tiers.forEach((threshold, index) => { if (value >= threshold) reached = index + 1; });
    if (reached > current) {
      let reward = 0;
      for (let tier = current; tier < reached; tier += 1) reward += BADGE_REWARDS[tier];
      passport.badges[badge.id] = reached;
      passport.currencies.airMiles += reward;
      if (state.run) state.run.earnedAM += reward;
      unlocked.push({ badge, tier: reached, reward });
    }
  });
  unlocked.forEach(({ badge, tier, reward }, index) => {
    if (state.run) state.run.badges.push({ id: badge.id, tier });
    setTimeout(() => {
      Sound.badge();
      haptic("badge");
      showToast(`<span class="toast-icon">${badge.icon}</span><span><b>${escapeHtml(badge.name)}</b> ${TIER_NAMES[tier - 1]} stamp · +${reward} AM</span>`, `badge tier-${tier}`);
    }, 350 + index * 700);
  });
  return unlocked.length;
}

// ─────────────────────────────────────────────
// Starting modes and runs
// ─────────────────────────────────────────────
function startMode(mode) {
  if (mode === "zen" && !passport.unlocks.zen) {
    buyZenOrNudge();
    return;
  }
  clearTimeout(state.launchTimer);
  stopTimer();
  Sound.tap();
  const resuming = mode === "journey" && Boolean(passport.activeRun);
  const title = mode === "journey"
    ? (resuming ? "Resume Journey" : passport.journey.stage > 1 || passport.journey.level > 0 ? "Continue the Journey" : "Journey")
    : mode === "challenge" ? "Challenge" : "Zen";
  $("launch-title").textContent = title;
  $("launch-copy").textContent = mode === "journey"
    ? `${currentStage().name} · Level ${Math.min(LEVELS_PER_STAGE, passport.journey.level + 1)} · ${getArchetype().label}`
    : mode === "challenge"
      ? `${Math.round(getArchetype().challengeMs / 1000)} seconds on the clock. Deep breath.`
      : "No timer. No pressure.";
  setScreen("launch-screen");
  state.launchTimer = setTimeout(() => launchMode(mode), MODE_START_DELAY_MS);
}

function newRunStats() {
  return { correct: 0, answered: 0, bestStreak: 0, earnedGS: 0, earnedAM: 0, badges: [], missed: [] };
}

function launchMode(mode) {
  cancelScheduled();
  const archetype = getArchetype();
  const saved = mode === "journey" ? passport.activeRun : null;
  const maxLives = mode === "zen" ? Infinity : archetype.lives;
  Object.assign(state, {
    mode,
    running: true,
    paused: false,
    answered: false,
    question: null,
    score: saved?.score || 0,
    streak: saved?.streak || 0,
    lives: saved ? Math.min(maxLives, Math.max(1, saved.lives)) : maxLives,
    maxLives,
    timerMs: mode === "challenge" ? archetype.challengeMs : mode === "journey" ? archetype.timerMs : 0,
    timerMaxMs: mode === "challenge" ? archetype.challengeMs : mode === "journey" ? archetype.timerMs : 0,
    timerShownSecond: -1,
    levelProgress: saved?.levelProgress || 0,
    recent: [],
    stageUnlock: null,
    abilityUses: saved ? saved.abilityUses : archetype.ability.uses,
    abilityUsedThisQ: false,
    lastChanceUsed: saved?.lastChanceUsed || false,
    lastChanceActive: false,
    livesLostThisLevel: saved?.livesLostThisLevel || 0,
    droppedToOne: saved?.droppedToOne || false,
    run: saved?.run ? { ...newRunStats(), ...saved.run } : newRunStats(),
  });
  touchPlayDay();
  savePassport();
  const gameScreen = $("game-screen");
  gameScreen.classList.toggle("zen-mode", mode === "zen");
  gameScreen.classList.remove("paused", "last-chance");
  $("pause-overlay").classList.add("hidden");
  $("stage-unlock-overlay").classList.add("hidden");
  $("tool-row").classList.toggle("hidden", mode === "zen");
  $("auto-correct-btn").classList.toggle("hidden", mode !== "journey");
  $("skip-level-btn").classList.toggle("hidden", mode !== "journey");
  $("run-progress").classList.toggle("hidden", mode === "zen");
  $("pause-exit-btn").textContent = mode === "journey" ? "Save & exit to menu" : "Quit to menu";
  $("hud-mode").textContent = mode === "journey" ? `Journey · ${currentStage().name}` : mode === "challenge" ? "Challenge" : "Zen";
  $("hud-character").textContent = `${archetype.ability.icon} ${archetype.label}`;
  setScreen("game-screen");
  if (saved) showToast("Run resumed where you left off");
  saveActiveRun();
  nextQuestion();
}

function buyZenOrNudge() {
  if (passport.currencies.airMiles >= ZEN_UNLOCK_COST) {
    passport.currencies.airMiles -= ZEN_UNLOCK_COST;
    passport.unlocks.zen = true;
    savePassport();
    Sound.badge();
    showToast("🧘 Zen mode unlocked");
    renderMenu();
    return;
  }
  Sound.tap();
  $("zen-copy").textContent = `${ZEN_UNLOCK_COST - passport.currencies.airMiles} more AirMiles needed, or complete Asia.`;
}

function saveActiveRun() {
  if (state.mode !== "journey" || !state.running) return;
  passport.activeRun = {
    mode: "journey",
    archetype: passport.archetype,
    stage: passport.journey.stage,
    level: passport.journey.level,
    levelProgress: state.levelProgress,
    lives: Math.max(1, state.lives),
    score: state.score,
    streak: state.streak,
    abilityUses: state.abilityUses,
    lastChanceUsed: state.lastChanceUsed,
    livesLostThisLevel: state.livesLostThisLevel,
    droppedToOne: state.droppedToOne,
    run: state.run,
    updatedAt: Date.now(),
  };
  savePassport();
}

function clearActiveRun() {
  if (!passport.activeRun) return;
  passport.activeRun = null;
  savePassport();
}

// ─────────────────────────────────────────────
// Question generation
// ─────────────────────────────────────────────
function questionPool() {
  const pool = state.mode === "challenge" ? poolForStage(6) : poolForStage(passport.journey.stage);
  return pool.filter(allowedByDifficulty);
}

function weightedPick(entries) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

// Adaptive weighting: missed places come back more often, mastered ones less.
function adaptiveWeight(item) {
  const stats = itemStats(item);
  if (!stats.c && !stats.w) return 1.3;
  const weight = 1 + Math.min(stats.w || 0, 4) * 0.9 - Math.min(stats.c || 0, 5) * 0.15;
  return Math.max(0.3, weight);
}

function chooseQuestionType(pool, mapPool) {
  const archetype = getArchetype();
  if (mapPool.length >= 4 && Math.random() < archetype.mapRate) {
    // Tap-the-map questions are switched off for now (touch accuracy); only "name the highlighted country".
    return ENABLE_MAP_SELECT && Math.random() < 0.5 ? "mapSelect" : "mapIdentify";
  }
  const countries = pool.filter(isCountry);
  const states = pool.filter(isUSState);
  const cityPool = pool.filter((item) => item.city && item.city !== item.capital);
  const weights = [];
  if (countries.length >= 4) weights.push(["flag", archetype.typeWeights.flag]);
  if (pool.length >= 4) weights.push(["capital", archetype.typeWeights.capital]);
  if (cityPool.length >= 1) weights.push(["city", archetype.typeWeights.city]);
  if (states.length >= 4) {
    weights.push(["stateFlag", 0.7]);
    weights.push(["stateAbbr", 0.5]);
  }
  return weights.length ? weightedPick(weights) : "capital";
}

function eligibleAnswers(type, pool, mapPool) {
  if (type === "flag") return pool.filter(isCountry);
  if (type === "city") return pool.filter((item) => item.city && item.city !== item.capital);
  if (type === "stateFlag" || type === "stateAbbr") return pool.filter(isUSState);
  if (type === "mapIdentify" || type === "mapSelect") return mapPool;
  return pool;
}

function pickDistractors(answer, candidates, label, count = 3) {
  const answerLabel = label(answer);
  const seen = new Set([answerLabel]);
  const kindMatches = shuffle(candidates.filter((item) => item.cc !== answer.cc && sameKind(item, answer)));
  kindMatches.sort((a, b) => (b.continent === answer.continent) - (a.continent === answer.continent));
  const picks = [];
  for (const item of kindMatches) {
    const value = label(item);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    picks.push(item);
    if (picks.length === count) break;
  }
  return picks;
}

function pickQuestion() {
  const pool = questionPool();
  const mapPool = mapQuestionsUnlocked() ? pool.filter((item) => isCountry(item) && europeMapNames.has(item.name)) : [];
  const type = chooseQuestionType(pool, mapPool);
  const eligible = eligibleAnswers(type, pool, mapPool);
  const fresh = eligible.filter((item) => !state.recent.includes(item.cc));
  const source = fresh.length ? fresh : eligible;
  const answer = weightedPick(source.map((item) => [item, adaptiveWeight(item)]));
  state.recent.push(answer.cc);
  if (state.recent.length > RECENT_LIMIT) state.recent.shift();

  const distractorSource = type.startsWith("map") ? mapPool : pool;
  const kind = isUSState(answer) ? "state" : "country";

  if (type === "mapIdentify") {
    const wrongs = pickDistractors(answer, distractorSource, (item) => item.name);
    return {
      type, answer, correct: answer.name,
      badge: "Map to Country",
      prompt: "Name the highlighted country",
      subtitle: "Europe map",
      map: { region: "Europe", target: answer.name, mode: "identify" },
      options: shuffle([answer.name, ...wrongs.map((item) => item.name)]),
    };
  }
  if (type === "mapSelect") {
    return {
      type, answer, correct: answer.name,
      badge: "Country to Map",
      prompt: `Tap ${answer.name}`,
      subtitle: EUROPE_MICROSTATES.has(answer.name) ? "Use the enlarged pin" : "Select it on the Europe map",
      map: { region: "Europe", target: answer.name, mode: "select" },
      options: [],
    };
  }
  if (type === "stateFlag") {
    const wrongs = pickDistractors(answer, distractorSource, (item) => item.name);
    return {
      type, answer, correct: answer.name,
      badge: "State Flag to State",
      prompt: "Name this state",
      subtitle: "Which US state flies this flag?",
      flag: answer.cc,
      options: shuffle([answer.name, ...wrongs.map((item) => item.name)]),
    };
  }
  if (type === "stateAbbr") {
    const wrongs = pickDistractors(answer, distractorSource, stateAbbr);
    return {
      type, answer, correct: stateAbbr(answer),
      badge: "State to Postal Code",
      prompt: answer.name,
      subtitle: "Which abbreviation matches this state?",
      flag: answer.cc,
      options: shuffle([stateAbbr(answer), ...wrongs.map(stateAbbr)]),
    };
  }
  if (type === "capital") {
    const wrongs = pickDistractors(answer, distractorSource, (item) => item.capital);
    return {
      type, answer, correct: answer.capital,
      badge: kind === "state" ? "State to Capital" : "Country to Capital",
      prompt: answer.name,
      subtitle: "What is the capital?",
      flag: answer.cc,
      options: shuffle([answer.capital, ...wrongs.map((item) => item.capital)]),
    };
  }
  if (type === "city") {
    const wrongs = pickDistractors(answer, distractorSource, (item) => item.name);
    return {
      type, answer, correct: answer.name,
      badge: kind === "state" ? "City to State" : "City to Country",
      prompt: answer.city,
      subtitle: `Which ${kind === "state" ? "US state" : "country"} is this city in?`,
      options: shuffle([answer.name, ...wrongs.map((item) => item.name)]),
    };
  }
  const wrongs = pickDistractors(answer, distractorSource, (item) => item.name);
  return {
    type, answer, correct: answer.name,
    badge: "Flag to Country",
    prompt: "Name this country",
    subtitle: answer.continent,
    flag: answer.cc,
    options: shuffle([answer.name, ...wrongs.map((item) => item.name)]),
  };
}

function nextQuestion() {
  if (!state.running) return;
  if (state.mode === "journey") {
    state.timerMs = getArchetype().timerMs;
    state.timerMaxMs = state.timerMs;
  }
  state.answered = false;
  state.abilityUsedThisQ = false;
  state.question = pickQuestion();
  state.question.lastChance = state.lastChanceActive;
  $("game-screen").classList.toggle("last-chance", state.lastChanceActive);
  renderQuestion();
  updateHud();
  state.questionStartedAt = performance.now();
  if (state.mode !== "zen") startTimer();
}

function renderQuestion() {
  const q = state.question;
  $("game-screen").classList.toggle("map-question", Boolean(q.map));
  $("question-panel").classList.toggle("map-question", Boolean(q.map));
  $("question-badge").textContent = q.lastChance ? `Last Chance · ${q.badge}` : q.badge;
  $("question-text").textContent = q.prompt;
  $("question-subtitle").textContent = q.subtitle || "";
  $("zen-title").classList.toggle("hidden", state.mode !== "zen");
  $("zen-title").textContent = state.mode === "zen" ? q.answer.name : "";

  const display = $("flag-display");
  display.classList.toggle("map-display", Boolean(q.map));
  display.classList.toggle("empty", !q.flag && !q.map);
  display.innerHTML = q.map ? renderEuropeMap(q.map) : q.flag ? `<img src="${flagUrl(q.flag)}" alt="">` : "";
  if (q.map?.mode === "select") {
    $("answer-grid").innerHTML = "";
    display.querySelectorAll(".map-country, .map-country-hit, .map-country-pad, .map-pin").forEach((el) => onPress(el, () => answerQuestion(el.dataset.answer, el)));
  } else {
    $("answer-grid").innerHTML = q.options.map((option) => `<button class="answer-btn" type="button" data-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join("");
    document.querySelectorAll(".answer-btn").forEach((button) => onPress(button, () => answerQuestion(button.dataset.answer, button)));
  }
  $("feedback-line").textContent = q.lastChance ? "Last Chance! Get this right to revive with 1 heart." : "";
  $("feedback-line").className = `feedback-line ${q.lastChance ? "warn" : ""}`;
  updateToolRow();
}

// ─────────────────────────────────────────────
// Europe map
// ─────────────────────────────────────────────
function buildEuropeMapCache() {
  europeMapCache = europeMapData.map((feature, index) => ({
    name: feature.name,
    color: MAP_COLORS[index % MAP_COLORS.length],
    path: geometryToPath(feature.geometry),
    bounds: geometryProjectedBounds(feature.geometry),
  }));
}

function renderEuropeMap(map) {
  if (!europeMapCache) buildEuropeMapCache();
  const countryPaths = europeMapCache.map((feature) => {
    const isHighlighted = feature.name === map.target && map.mode === "identify";
    const color = isHighlighted ? "#ff4d5e" : feature.color;
    return `<path class="map-country ${isHighlighted ? "target" : ""}" data-answer="${escapeHtml(feature.name)}" d="${feature.path}" style="--map-color:${color}"></path>`;
  }).join("");
  const countryHitAreas = map.mode === "select" ? europeMapCache.map((feature) =>
    `<path class="map-country-hit" data-answer="${escapeHtml(feature.name)}" aria-label="${escapeHtml(feature.name)}" d="${feature.path}"></path>`
  ).join("") : "";
  const pads = map.mode === "select" ? europeMapCache.map((feature) => {
    if (EUROPE_MICROSTATES.has(feature.name)) return "";
    const bounds = feature.bounds;
    if (!bounds || (bounds.width >= 13 && bounds.height >= 9)) return "";
    const size = Math.max(30, Math.min(44, 38 - Math.min(bounds.width, bounds.height)));
    return `<button class="map-country-pad" type="button" data-answer="${escapeHtml(feature.name)}" aria-label="${escapeHtml(feature.name)}" style="left:${bounds.cx}%;top:${bounds.cy}%;width:${size}px;height:${size}px"></button>`;
  }).join("") : "";
  const pins = [...EUROPE_MICROSTATES].map((name) => {
    const [left, top] = EUROPE_PIN_POSITIONS[name];
    const isTarget = map.mode === "identify" && map.target === name;
    return `<button class="map-pin ${isTarget ? "target" : ""}" type="button" data-answer="${escapeHtml(name)}" aria-label="${escapeHtml(name)}" style="left:${left}%;top:${top}%"></button>`;
  }).join("");
  return `
    <div class="europe-map ${map.mode}" role="group" aria-label="Europe map question">
      <div class="map-board">
        <svg class="map-svg" viewBox="0 0 ${EUROPE_MAP_BOUNDS.width} ${EUROPE_MAP_BOUNDS.height}" aria-hidden="true">${countryPaths}${countryHitAreas}</svg>
        ${pads}
        ${pins}
      </div>
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

function geometryProjectedBounds(geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity;
  polygons.forEach((polygon) => {
    polygon.filter(ringInEurope).forEach((ring) => {
      ring.forEach(([lon, lat]) => {
        const [x, y] = projectEuropePoint(lon, lat);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
    });
  });
  if (minX === Infinity) return null;
  return {
    cx: ((minX + maxX) / 2).toFixed(2),
    cy: ((minY + maxY) / 2).toFixed(2),
    width: maxX - minX,
    height: maxY - minY,
  };
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

// ─────────────────────────────────────────────
// Answering
// ─────────────────────────────────────────────
function recordItem(q, correct) {
  const item = q.answer;
  const stats = passport.stats.items[item.cc] || { c: 0, w: 0, f: 0, k: 0 };
  if (correct) {
    stats.c += 1;
    if (q.type === "flag" || q.type === "stateFlag") stats.f += 1;
    if (q.type === "capital") stats.k += 1;
  } else {
    stats.w += 1;
  }
  passport.stats.items[item.cc] = stats;
}

function lockAnswerUi(q) {
  document.querySelectorAll(".answer-btn, .map-country-hit, .map-country-pad, .map-pin").forEach((el) => {
    el.disabled = true;
    el.classList.add("locked");
  });
  document.querySelectorAll(".answer-btn, .map-country, .map-pin").forEach((el) => {
    if (el.dataset.answer === q.correct) el.classList.add("correct");
  });
}

function answerQuestion(value, element) {
  if (!state.running || state.paused || state.answered) return;
  state.answered = true;
  stopTimer();
  const q = state.question;
  const archetype = getArchetype();
  const timedOut = value === TIMEOUT;
  const correct = !timedOut && value === q.correct;
  const run = state.run;
  let unlockedStage = null;

  if (element?.classList && !timedOut) {
    element.classList.add(correct ? "correct" : "wrong");
    if (!correct && element.classList.contains("map-country-hit")) {
      document.querySelector(`.map-country[data-answer="${CSS.escape(value)}"]`)?.classList.add("wrong");
    }
  }
  lockAnswerUi(q);

  run.answered += 1;
  passport.stats.totalAnswered += 1;
  recordItem(q, correct);
  const feedback = $("feedback-line");
  feedback.className = "feedback-line";
  const notes = [];

  if (correct) {
    Sound.correct();
    haptic("spark");
    state.streak += 1;
    run.correct += 1;
    run.bestStreak = Math.max(run.bestStreak, state.streak);
    passport.stats.totalCorrect += 1;
    passport.stats.bestStreak = Math.max(passport.stats.bestStreak, state.streak);

    const elapsed = performance.now() - state.questionStartedAt;
    let points = Math.round((100 + state.streak * 10 * archetype.streakMult) * archetype.scoreMult);
    if (archetype.tailwindMs && state.mode !== "zen" && elapsed < archetype.tailwindMs) {
      points += 50;
      passport.stats.tailwinds += 1;
      notes.push("Tailwind +50");
      if (state.mode === "journey") {
        passport.currencies.airMiles += TAILWIND_AIRMILES;
        run.earnedAM += TAILWIND_AIRMILES;
      }
    }
    if (state.mode === "journey" && state.timerMs < 1000 && !timedOut) passport.stats.photoFinish += 1;
    if (state.abilityUsedThisQ && archetype.ability.id === "recall") passport.stats.recallWins += 1;
    state.score += points;

    if (state.mode === "journey") {
      state.levelProgress += 1;
      if (state.streak >= GEOSPARK_STREAK_MIN) {
        passport.currencies.geoSparks += 1;
        run.earnedGS += 1;
      }
    }
    if (archetype.regenEvery && state.mode !== "zen" && run.correct % archetype.regenEvery === 0 && state.lives < state.maxLives) {
      state.lives += 1;
      passport.stats.heartsRegained += 1;
      Sound.heart();
      notes.push("+1 heart");
    }
    if (q.lastChance) {
      state.lastChanceActive = false;
      state.lives = Math.max(state.lives, 1);
      passport.stats.lastChanceSaves += 1;
      notes.push("Revived!");
    }
    feedback.textContent = `Sparked ${q.answer.name}${notes.length ? ` · ${notes.join(" · ")}` : ""}`;
    feedback.classList.add("good");
    unlockedStage = checkProgression();
  } else {
    if (timedOut) Sound.timeout();
    else Sound.wrong();
    haptic("wrong");
    state.streak = 0;
    if (state.mode !== "zen") {
      state.lives -= 1;
      state.livesLostThisLevel += 1;
      if (state.lives === 1) state.droppedToOne = true;
    }
    if (!run.missed.includes(q.answer.cc)) run.missed.push(q.answer.cc);
    feedback.textContent = `${timedOut ? "Time's up · " : ""}${q.correct}${q.correct !== q.answer.name ? ` (${q.answer.name})` : ""}`;
    feedback.classList.add("bad");
  }

  checkBadges();
  updateHud();
  savePassport();
  saveActiveRun();

  if (unlockedStage) {
    schedule(() => showStageUnlock(unlockedStage), 650);
    return;
  }

  if (state.mode !== "zen" && state.lives <= 0) {
    if (q.lastChance || state.lastChanceUsed) {
      state.lastChanceActive = false;
      schedule(() => finishRun("Out of hearts"), ANSWER_DELAY_MS);
      return;
    }
    state.lastChanceUsed = true;
    state.lastChanceActive = true;
    schedule(() => {
      Sound.lastChance();
      nextQuestion();
    }, ANSWER_DELAY_MS + 250);
    return;
  }
  schedule(nextQuestion, state.mode === "zen" ? 520 : ANSWER_DELAY_MS);
}

function checkProgression() {
  if (state.mode !== "journey") return null;
  if (state.levelProgress < QUESTIONS_PER_LEVEL) return null;
  state.levelProgress = 0;
  passport.journey.level += 1;
  passport.currencies.airMiles += AIRMILES_LEVEL_REWARD;
  state.run.earnedAM += AIRMILES_LEVEL_REWARD;
  if (state.livesLostThisLevel === 0) passport.stats.flawless += 1;
  if (state.droppedToOne) passport.stats.comebacks += 1;
  state.livesLostThisLevel = 0;
  state.droppedToOne = false;
  const heartBack = state.lives < state.maxLives;
  if (heartBack) state.lives += 1;
  Sound.levelUp();
  showToast(`Level complete · +${AIRMILES_LEVEL_REWARD} AM${heartBack ? " · +1 heart" : ""}`, "level");

  if (passport.journey.level >= LEVELS_PER_STAGE) {
    return completeStage();
  }
  return null;
}

function completeStage() {
  const completed = currentStage();
  const firstTime = !passport.journey.stamps.includes(completed.name);
  if (firstTime) {
    passport.journey.stamps.push(completed.name);
    passport.currencies.airMiles += AIRMILES_STAGE_REWARD;
    state.run.earnedAM += AIRMILES_STAGE_REWARD;
  }
  if (completed.id === 3) passport.unlocks.zen = true;
  if (completed.id < STAGES.length) {
    passport.journey.stage = completed.id + 1;
    passport.journey.level = 0;
    const unlockedStage = currentStage();
    Sound.stageUnlock();
    $("hud-mode").textContent = `Journey · ${unlockedStage.name}`;
    return unlockedStage;
  }
  passport.journey.level = LEVELS_PER_STAGE;
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
      : `New region added · +${AIRMILES_STAGE_REWARD} AM`;
  $("stage-unlock-map").className = `stage-map ${details.mapClass}`;
  $("stage-unlock-overlay").classList.remove("hidden");
}

function continueStageUnlock() {
  Sound.tap();
  $("stage-unlock-overlay").classList.add("hidden");
  state.stageUnlock = null;
  state.paused = false;
  state.recent = [];
  updateHud();
  savePassport();
  saveActiveRun();
  nextQuestion();
}

// ─────────────────────────────────────────────
// Tools: character ability, auto-correct, skip level
// ─────────────────────────────────────────────
function abilityAvailable() {
  const q = state.question;
  const ability = getArchetype().ability;
  if (!state.running || state.paused || state.answered || !q) return false;
  if (state.mode === "zen" || state.abilityUses <= 0 || state.abilityUsedThisQ) return false;
  if (ability.id === "recall") {
    return !q.map || q.map.mode !== "select";
  }
  return true;
}

function updateToolRow() {
  const ability = getArchetype().ability;
  const button = $("ability-btn");
  button.innerHTML = `<span>${ability.icon}</span> ${escapeHtml(ability.name)} <b>×${state.abilityUses}</b>`;
  button.disabled = !abilityAvailable();
  const q = state.question;
  const canAutoCorrect = state.mode === "journey" && q && !state.answered;
  $("auto-correct-btn").textContent = `Auto-Correct · ${AUTO_CORRECT_COST} GS`;
  $("auto-correct-btn").disabled = !canAutoCorrect || passport.currencies.geoSparks < AUTO_CORRECT_COST;
  $("skip-level-btn").textContent = `Skip Level · ${SKIP_LEVEL_COST} AM`;
  $("skip-level-btn").disabled = state.answered || passport.currencies.airMiles < SKIP_LEVEL_COST;
}

function clueFor(q) {
  const target = q.correct;
  const letters = target.replace(/[^A-Za-zÀ-ÿ]/g, "").length;
  const first = target.trim().charAt(0).toUpperCase();
  const parts = [`Starts with “${first}”`, `${letters} letters`];
  if (!isUSState(q.answer) && q.type !== "flag" && !q.map) parts.push(q.answer.continent);
  if (isUSState(q.answer) && q.type !== "stateAbbr") parts.push(`${stateAbbr(q.answer)}`);
  return parts.join(" · ");
}

function useAbility() {
  if (!abilityAvailable()) return;
  const ability = getArchetype().ability;
  const q = state.question;
  state.abilityUses -= 1;
  state.abilityUsedThisQ = true;
  Sound.ability();

  if (ability.id === "recall") {
    const wrongButtons = shuffle([...document.querySelectorAll(".answer-btn")].filter((button) => button.dataset.answer !== q.correct && !button.disabled));
    wrongButtons.slice(0, 2).forEach((button) => {
      button.disabled = true;
      button.classList.add("eliminated");
    });
    $("feedback-line").textContent = "📜 Recall: two wrong answers struck out";
    $("feedback-line").className = "feedback-line hint";
  } else if (ability.id === "local") {
    $("feedback-line").textContent = `🧭 A local says: ${clueFor(q)}`;
    $("feedback-line").className = "feedback-line hint";
  } else if (ability.id === "autopilot") {
    state.answered = true;
    stopTimer();
    lockAnswerUi(q);
    $("feedback-line").textContent = `✈️ Autopilot: ${q.correct} · streak kept`;
    $("feedback-line").className = "feedback-line hint";
    saveActiveRun();
    updateToolRow();
    schedule(nextQuestion, 700);
    return;
  }
  saveActiveRun();
  updateToolRow();
}

function autoCorrect() {
  const q = state.question;
  if (state.mode !== "journey" || !q || state.answered || state.paused) return;
  if (passport.currencies.geoSparks < AUTO_CORRECT_COST) return;
  const target = q.map?.mode === "select"
    ? document.querySelector(`.map-country-hit[data-answer="${CSS.escape(q.correct)}"], .map-pin[data-answer="${CSS.escape(q.correct)}"], .map-country-pad[data-answer="${CSS.escape(q.correct)}"]`)
    : [...document.querySelectorAll(".answer-btn")].find((button) => button.dataset.answer === q.correct);
  if (!target) return;
  passport.currencies.geoSparks -= AUTO_CORRECT_COST;
  answerQuestion(q.correct, target);
}

function skipLevel() {
  if (state.mode !== "journey" || state.answered || state.paused) return;
  if (passport.currencies.airMiles < SKIP_LEVEL_COST) return;
  stopTimer();
  passport.currencies.airMiles -= SKIP_LEVEL_COST;
  state.levelProgress = QUESTIONS_PER_LEVEL;
  const unlockedStage = checkProgression();
  savePassport();
  saveActiveRun();
  updateHud();
  if (unlockedStage) {
    showStageUnlock(unlockedStage);
    return;
  }
  nextQuestion();
}

// ─────────────────────────────────────────────
// HUD and timer
// ─────────────────────────────────────────────
function updateHud() {
  const stage = currentStage();
  const levelWithinStage = Math.max(0, Math.min(passport.journey.level, LEVELS_PER_STAGE));
  const questionWithinLevel = Math.min(state.levelProgress, QUESTIONS_PER_LEVEL);
  const answeredInStage = (levelWithinStage * QUESTIONS_PER_LEVEL) + questionWithinLevel;
  const totalInStage = LEVELS_PER_STAGE * QUESTIONS_PER_LEVEL;
  const journey = state.mode === "journey";
  const sectionPercent = journey
    ? Math.round((answeredInStage / totalInStage) * 100)
    : Math.min(100, Math.round((state.score / Math.max(1, passport.best.challenge || 1000)) * 100));
  $("stage-progress-label").textContent = journey ? `Stage ${stage.id}/${STAGES.length} · ${stage.name}` : "Challenge Run";
  $("level-progress-label").textContent = journey ? `Level ${Math.min(LEVELS_PER_STAGE, levelWithinStage + 1)}/${LEVELS_PER_STAGE}` : `Score ${state.score}`;
  $("question-progress-label").textContent = journey ? `Question ${questionWithinLevel}/${QUESTIONS_PER_LEVEL}` : `Streak ${state.streak}`;
  $("section-progress-label").textContent = journey ? `${sectionPercent}% of stage` : `Best ${passport.best.challenge}`;
  $("section-progress-fill").style.width = `${Math.min(100, sectionPercent)}%`;

  if (state.mode === "challenge") {
    $("hud-stats").textContent = `${state.score} pts${state.streak > 1 ? ` · 🔥${state.streak}` : ""}`;
  } else if (journey) {
    $("hud-stats").textContent = `${passport.currencies.geoSparks} GS · ${passport.currencies.airMiles} AM${state.streak > 1 ? ` · 🔥${state.streak}` : ""}`;
  } else {
    $("hud-stats").textContent = "";
  }
  if (state.mode === "zen") {
    $("lives-text").textContent = "";
  } else {
    const full = Math.max(0, Math.min(state.lives, state.maxLives));
    $("lives-text").textContent = "♥".repeat(full) + "♡".repeat(Math.max(0, state.maxLives - full));
  }
  updateTimerUi(true);
  updateToolRow();
}

function updateTimerUi(force = false) {
  const second = Math.ceil(state.timerMs / 1000);
  const ratio = state.timerMaxMs ? Math.max(0, Math.min(1, state.timerMs / state.timerMaxMs)) : 0;
  $("timer-fill").style.strokeDashoffset = `${((1 - ratio) * TIMER_CIRCUMFERENCE).toFixed(1)}`;
  if (force || second !== state.timerShownSecond) {
    state.timerShownSecond = second;
    $("timer-text").textContent = second;
    $("timer-chip").classList.toggle("danger", state.timerMs <= 5000 && state.mode !== "zen");
  }
}

function startTimer() {
  stopTimer();
  state.timerMaxMs = state.timerMaxMs || state.timerMs;
  state.timerEndsAt = performance.now() + state.timerMs;
  const tick = (now) => {
    if (!state.running || state.paused) return;
    state.timerMs = Math.max(0, state.timerEndsAt - now);
    updateTimerUi();
    if (state.timerMs <= 0) {
      if (state.mode === "challenge") {
        Sound.timeout();
        finishRun("Time up");
      } else {
        answerQuestion(TIMEOUT, null);
      }
      return;
    }
    state.timerRaf = requestAnimationFrame(tick);
  };
  state.timerRaf = requestAnimationFrame(tick);
}

function stopTimer() {
  cancelAnimationFrame(state.timerRaf);
}

function pauseGame(silent = false) {
  if (!state.running || state.mode === "zen" || state.paused) return;
  if (!silent) Sound.tap();
  if (!state.answered) state.timerMs = Math.max(0, state.timerEndsAt - performance.now());
  state.paused = true;
  stopTimer();
  $("pause-copy").textContent = state.mode === "journey"
    ? "The timer is frozen. Your run is saved if you leave."
    : "The timer is frozen.";
  $("game-screen").classList.add("paused");
  $("pause-overlay").classList.remove("hidden");
  saveActiveRun();
}

function resumeGame() {
  if (!state.paused || state.stageUnlock) return;
  Sound.tap();
  state.paused = false;
  $("game-screen").classList.remove("paused");
  $("pause-overlay").classList.add("hidden");
  if (!state.answered) startTimer();
}

// ─────────────────────────────────────────────
// Ending runs
// ─────────────────────────────────────────────
function finishRun(reason) {
  stopTimer();
  cancelScheduled();
  const mode = state.mode;
  state.running = false;
  state.paused = false;
  state.lastChanceActive = false;
  const run = state.run || newRunStats();
  const journeyFailed = mode === "journey" && reason === "Out of hearts";
  const lostProgress = journeyFailed ? state.levelProgress : 0;
  if (journeyFailed) state.levelProgress = 0;
  let newBest = false;
  if (mode === "challenge" && state.score > passport.best.challenge) {
    passport.best.challenge = state.score;
    newBest = true;
  }
  checkBadges();
  clearActiveRun();
  savePassport();
  const gameScreen = $("game-screen");
  gameScreen.classList.remove("paused", "last-chance");
  $("pause-overlay").classList.add("hidden");

  $("result-eyebrow").textContent = mode === "challenge" ? "Challenge Summary" : mode === "zen" ? "Zen Summary" : "Journey Summary";
  $("result-title").textContent = journeyFailed ? "Out of hearts" : reason;
  $("result-copy").textContent = journeyFailed
    ? `No penalties. You're still on ${currentStage().name} Level ${Math.min(LEVELS_PER_STAGE, passport.journey.level + 1)}. Only this level's ${lostProgress}/${QUESTIONS_PER_LEVEL} progress resets.`
    : mode === "challenge"
      ? (newBest ? "New personal best!" : `Best challenge score: ${passport.best.challenge}`)
      : `Passport updated for ${passport.name || "Explorer"}.`;
  $("result-score").textContent = state.score;
  renderRunSummary(run);
  $("result-retry-btn").textContent = mode === "journey" ? "Try Level Again" : "Play Again";
  $("result-retry-btn").dataset.mode = mode;
  setScreen("result-screen");
}

function renderRunSummary(run) {
  const accuracy = run.answered ? Math.round((run.correct / run.answered) * 100) : 0;
  $("result-stats").innerHTML = `
    <div><b>${run.correct}/${run.answered}</b><small>Correct · ${accuracy}%</small></div>
    <div><b>${run.bestStreak}</b><small>Best streak</small></div>
    <div><b>+${run.earnedGS}</b><small>GeoSparks</small></div>
    <div><b>+${run.earnedAM}</b><small>AirMiles</small></div>
  `;
  const badges = run.badges || [];
  $("result-badges-block").classList.toggle("hidden", !badges.length);
  $("result-badges").innerHTML = badges.map(({ id, tier }) => {
    const badge = BADGES.find((item) => item.id === id);
    if (!badge) return "";
    return `<div class="result-badge tier-${tier}"><span>${badge.icon}</span><small>${escapeHtml(badge.name)}<br>${TIER_NAMES[tier - 1]}</small></div>`;
  }).join("");
  const byCc = new Map(allItems().map((item) => [item.cc, item]));
  const missed = (run.missed || []).map((cc) => byCc.get(cc)).filter(Boolean);
  $("result-missed-block").classList.toggle("hidden", !missed.length);
  $("result-missed").innerHTML = missed.slice(0, 12).map((item) =>
    `<div class="missed-chip"><img src="${flagUrl(item.cc)}" alt=""><span>${escapeHtml(item.name)}</span></div>`
  ).join("") + (missed.length > 12 ? `<div class="missed-more">+${missed.length - 12} more</div>` : "");
  state.learnFocus = missed.map((item) => item.cc);
  $("result-review-btn").classList.toggle("hidden", !missed.length);
}

function retryFromResult() {
  const mode = $("result-retry-btn").dataset.mode || "journey";
  startMode(mode);
}

function reviewMissed() {
  state.learnRegion = "missed";
  startLearning("missed");
}

function exitRunToMenu() {
  clearTimeout(state.launchTimer);
  cancelScheduled();
  stopTimer();
  if (state.running && state.mode === "journey") {
    saveActiveRun();
    showToast("Run saved · resume any time from Journey");
  } else {
    clearActiveRun();
  }
  state.running = false;
  state.paused = false;
  state.lastChanceActive = false;
  const gameScreen = $("game-screen");
  gameScreen.classList.remove("paused", "last-chance");
  $("pause-overlay").classList.add("hidden");
  $("stage-unlock-overlay").classList.add("hidden");
  renderMenu();
  setScreen("menu-screen");
}

function backToMenu() {
  Sound.tap();
  if (state.view === "game-screen") {
    exitRunToMenu();
    return;
  }
  renderMenu();
  setScreen("menu-screen");
}

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Menu globe (capped resolution, 30 fps, static when reduced motion is on)
// ─────────────────────────────────────────────
const GLOBE_FRAME_MS = 33;
const GLOBE_MAX_PX = 900;
const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
const FALLBACK_GLOBE = [
  [[-168, 58], [-142, 70], [-96, 72], [-54, 54], [-60, 28], [-86, 14], [-104, 20], [-126, 33], [-150, 48]],
  [[-82, 12], [-64, 8], [-48, -10], [-56, -34], [-70, -56], [-80, -38], [-76, -18]],
  [[-12, 36], [2, 54], [28, 60], [46, 48], [32, 36], [12, 38]],
  [[-18, 33], [8, 36], [34, 28], [48, 4], [32, -34], [12, -35], [-6, -12], [-14, 12]],
  [[34, 8], [44, 32], [70, 52], [112, 58], [148, 44], [142, 18], [106, 8], [78, 22], [58, 6]],
  [[112, -12], [154, -18], [150, -38], [116, -43], [108, -28]],
  [[-45, 72], [-24, 78], [-18, 62], [-42, 58]],
].map((shape) => ({ polygons: [shape] }));
const ISLAND_DOTS = [
  [-6, 53, 3.2], [-19, 65, 2.4], [14, 35, 1.8], [35, -20, 2], [47, -19, 2.7],
  [73, 4, 1.5], [103, 1, 1.4], [121, 15, 2], [127, -8, 1.8], [174, -41, 2.3],
  [-61, 15, 1.4], [-157, 21, 1.4], [-170, -14, 1.2], [178, -18, 1.1],
];
const CITY_DOTS = [[2, 48], [-3, 40], [12, 42], [18, 59], [-74, 41], [139, 36], [151, -34]];

function startGlobe() {
  const canvas = $("globe-canvas");
  const ctx = canvas.getContext("2d");
  let lastFrame = 0;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.round(Math.max(320, Math.min(GLOBE_MAX_PX, Math.max(rect.width, rect.height) * dpr)));
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = size;
      canvas.height = size;
    }
  }

  function project(lon, lat, rotation, radius, cx, cy) {
    const lambda = (lon + rotation) * Math.PI / 180;
    const phi = lat * Math.PI / 180;
    return {
      x: cx + radius * Math.cos(phi) * Math.sin(lambda),
      y: cy - radius * Math.sin(phi),
      z: Math.cos(phi) * Math.cos(lambda),
    };
  }

  function strokeVisible(points) {
    ctx.beginPath();
    let started = false;
    points.forEach((point) => {
      if (point.z <= 0.02) {
        started = false;
        return;
      }
      if (!started) {
        ctx.moveTo(point.x, point.y);
        started = true;
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  }

  function draw(now) {
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
    [-60, -30, 0, 30, 60].forEach((lat) => {
      const points = [];
      for (let lon = -180; lon <= 180; lon += 4) points.push(project(lon, lat, rotation, radius, cx, cy));
      strokeVisible(points);
    });
    [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].forEach((lon) => {
      const points = [];
      for (let lat = -82; lat <= 82; lat += 4) points.push(project(lon, lat, rotation, radius, cx, cy));
      strokeVisible(points);
    });

    // Project each land shape once per frame and reuse it for fill and coast glow.
    const features = worldGlobeData.length ? worldGlobeData : FALLBACK_GLOBE;
    const visible = [];
    features.forEach((feature) => {
      feature.polygons.forEach((shape) => {
        const points = shape.map(([lon, lat]) => project(lon, lat, rotation, radius, cx, cy));
        let zTotal = 0;
        for (const point of points) zTotal += point.z;
        if (zTotal / points.length > -0.04) visible.push(points);
      });
    });
    ctx.fillStyle = "#35e0b2";
    ctx.strokeStyle = "rgba(244, 247, 251, 0.28)";
    ctx.lineWidth = Math.max(1.15, width / 1320);
    visible.forEach((points) => {
      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    ctx.strokeStyle = "rgba(53, 224, 178, 0.34)";
    ctx.lineWidth = Math.max(1, width / 1800);
    visible.forEach(strokeVisible);

    ctx.fillStyle = "#35e0b2";
    ISLAND_DOTS.forEach(([lon, lat, size]) => {
      const point = project(lon, lat, rotation, radius, cx, cy);
      if (point.z <= 0) return;
      ctx.globalAlpha = 0.42 + point.z * 0.58;
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(1.6, size * width / 960), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "rgba(255, 209, 102, 0.86)";
    CITY_DOTS.forEach(([lon, lat]) => {
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
  }

  const loop = (now) => {
    if (now - lastFrame >= GLOBE_FRAME_MS) {
      lastFrame = now;
      draw(now);
    }
    globeRaf = requestAnimationFrame(loop);
  };
  stopGlobe();
  if (reducedMotion?.matches) {
    draw(0);
    // Redraw once more when the full globe data arrives.
    setTimeout(() => { if (state.view === "menu-screen") draw(0); }, 1500);
    return;
  }
  globeRaf = requestAnimationFrame(loop);
}

function stopGlobe() {
  cancelAnimationFrame(globeRaf);
}

// ─────────────────────────────────────────────
// Wiring
// ─────────────────────────────────────────────
function wireEvents() {
  document.querySelectorAll(".character-option").forEach((button) => onPress(button, () => {
    unlockAudio();
    Sound.tap();
    selectArchetype(button.dataset.archetype);
  }));
  onPress($("create-passport-btn"), confirmCharacterSelect);
  onPress($("cancel-switch-btn"), cancelCharacterSelect);
  onPress($("splash-continue-btn"), continueFromSplash);
  onPress($("journey-btn"), () => startMode("journey"));
  onPress($("switch-char-btn"), () => { Sound.tap(); openCharacterSelect("switch"); });
  onPress($("new-game-btn"), openNewGameDialog);
  onPress($("new-game-cancel-btn"), closeNewGameDialog);
  onPress($("new-game-confirm-btn"), confirmNewGame);
  onPress($("challenge-btn"), () => startMode("challenge"));
  onPress($("stamps-btn"), openStampBook);
  onPress($("learning-btn"), () => { state.learnFocus = []; startLearning("all"); });
  onPress($("zen-btn"), () => startMode("zen"));
  onPress($("back-menu-btn"), backToMenu);
  onPress($("learn-back-btn"), backToMenu);
  onPress($("stamps-back-btn"), backToMenu);
  onPress($("pause-btn"), () => pauseGame());
  onPress($("resume-btn"), resumeGame);
  onPress($("pause-exit-btn"), backToMenu);
  onPress($("stage-unlock-continue-btn"), continueStageUnlock);
  onPress($("result-menu-btn"), backToMenu);
  onPress($("result-retry-btn"), retryFromResult);
  onPress($("result-review-btn"), reviewMissed);
  onPress($("ability-btn"), useAbility);
  onPress($("auto-correct-btn"), autoCorrect);
  onPress($("skip-level-btn"), skipLevel);
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("pagehide", saveActiveRun);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) return;
    // Leaving the app pauses the run (and saves Journey progress); the pause screen waits on return.
    if (state.running && state.mode !== "zen" && !state.paused) pauseGame(true);
    saveActiveRun();
  });
}

async function init() {
  wireEvents();
  selectArchetype(passport.archetype);
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  await loadGeoData();
  loadBackgroundData();
  if (!passport.name) {
    characterSelectMode = "create";
    readySplash("onboarding-screen");
  } else {
    renderMenu();
    readySplash("menu-screen", passport.activeRun ? "Your run is saved and ready" : "Ready to explore");
  }
}

init().catch(() => {
  $("splash-status").textContent = "Could not load geography data.";
  $("splash-continue-btn").textContent = "Retry";
  $("splash-continue-btn").disabled = false;
  onPress($("splash-continue-btn"), () => window.location.reload());
});

// Test hook (used by automated checks; harmless in production).
window.__geospark = { state, get passport() { return passport; }, ARCHETYPES, BADGES, checkBadges, APP_VERSION };
