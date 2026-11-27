'use strict';

(function () {
  const AudioFX = window.GTA0.Audio;
  const WorldMod = window.GTA0.World;

  // ==================== КОНСТАНТЫ ====================
  const SAVE_KEY = 'vault_runner_save_v1';

  const CAR_CLASSES = [
    {
      name: 'SCOUT BUGGY',
      rank: 'КЛАСС I',
      style: 'buggy',
      len: 34, wid: 19,
      wheels: 4,
      maxHp: 100,
      maxSpeed: 290,
      accel: 465,
      turn: 3.45,
      ramMult: 0.08,
      ammoStart: 70,
      fill: '#4c5c56',
      trim: '#e4c94b',
      stripe: '#2e6f9e',
      accent: '#ffb84d',
      img: 'assets/cars/car-0.jpg?v=15',
      cost: 0
    },
    {
      name: 'RUST INTERCEPTOR',
      rank: 'КЛАСС II',
      style: 'muscle',
      len: 40, wid: 21,
      wheels: 4,
      maxHp: 145,
      maxSpeed: 332,
      accel: 525,
      turn: 3.12,
      ramMult: 0.11,
      ammoStart: 95,
      fill: '#465359',
      trim: '#ffd05c',
      stripe: '#26619c',
      accent: '#ff9e42',
      img: 'assets/cars/car-1.jpg?v=15',
      cost: 90
    },
    {
      name: 'VAULT ENFORCER',
      rank: 'КЛАСС III',
      style: 'enforcer',
      len: 44, wid: 23,
      wheels: 4,
      maxHp: 205,
      maxSpeed: 315,
      accel: 495,
      turn: 2.82,
      ramMult: 0.15,
      ammoStart: 120,
      fill: '#2e5d84',
      trim: '#f5c842',
      stripe: '#1b3854',
      accent: '#38e8ff',
      img: 'assets/cars/car-2.jpg?v=15',
      cost: 190
    },
    {
      name: 'WAR RIG MK-IV',
      rank: 'КЛАСС IV',
      style: 'warrig',
      len: 52, wid: 26,
      wheels: 6,
      maxHp: 285,
      maxSpeed: 300,
      accel: 470,
      turn: 2.48,
      ramMult: 0.24,
      ammoStart: 150,
      fill: '#4d443d',
      trim: '#ffb03b',
      stripe: '#2f2924',
      accent: '#ff7034',
      img: 'assets/cars/car-3.jpg?v=15',
      cost: 340
    },
    {
      name: 'CYBER PHANTOM',
      rank: 'КЛАСС V',
      style: 'phantom',
      len: 44, wid: 22,
      wheels: 4,
      maxHp: 325,
      maxSpeed: 368,
      accel: 595,
      turn: 3.35,
      ramMult: 0.17,
      ammoStart: 180,
      fill: '#141f1c',
      trim: '#39ff88',
      stripe: '#0c3022',
      accent: '#39ff88',
      img: 'assets/cars/car-4.jpg?v=15',
      cost: 540
    }
  ];

  const UPGRADE_ICONS = {
    car: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="13" width="24" height="8" rx="2" fill="#2c4438" stroke="#ffb84d" stroke-width="1.6"/>
      <path d="M9 13L12 8H21L24 13H9Z" fill="#182a21" stroke="#39ff88" stroke-width="1.5"/>
      <path d="M26 15H30L28 19H26V15Z" fill="#ffb84d"/>
      <circle cx="9.5" cy="22" r="3.4" fill="#0b120e" stroke="#9ce6b8" stroke-width="1.6"/>
      <circle cx="22.5" cy="22" r="3.4" fill="#0b120e" stroke="#9ce6b8" stroke-width="1.6"/>
      <path d="M16 3L17.6 5.6H14.4L16 3Z" fill="#39ff88"/>
    </svg>`,
    weapon: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="11" height="12" rx="2" fill="#243a2e" stroke="#9ce6b8" stroke-width="1.5"/>
      <rect x="15" y="11" width="13" height="3.6" rx="1" fill="#ffb84d" stroke="#18261d" stroke-width="0.9"/>
      <rect x="15" y="17.4" width="13" height="3.6" rx="1" fill="#ffb84d" stroke="#18261d" stroke-width="0.9"/>
      <path d="M28 12.8L31 11.2M28 19.2L31 20.8M28 16H31.5" stroke="#39ff88" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="9.5" cy="16" r="2.4" fill="#39ff88"/>
    </svg>`,
    missile: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="8" r="5" stroke="#ff4d5a" stroke-width="1.3" stroke-dasharray="2 1.5"/>
      <path d="M24 5V11M21 8H27" stroke="#ff4d5a" stroke-width="1.2"/>
      <path d="M8 21L19 10L23 9L22 13L11 24L8 21Z" fill="#d8e8dc" stroke="#ffb84d" stroke-width="1.4"/>
      <path d="M18.5 10.5L23 9L21.5 13.5Z" fill="#ff4d5a"/>
      <path d="M8 21L4 23L7 26L9 22Z" fill="#ff7a2f"/>
      <path d="M5 27L8.5 23.5" stroke="#ffe169" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    armor: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 4L26 8V15.5C26 21.5 21.7 26.2 16 28C10.3 26.2 6 21.5 6 15.5V8L16 4Z" fill="#1e3848" stroke="#38e8ff" stroke-width="1.6"/>
      <path d="M16 7.5L22.5 10.2V15.5C22.5 19.7 19.6 23 16 24.4C12.4 23 9.5 19.7 9.5 15.5V10.2L16 7.5Z" fill="#132632" stroke="#ffb84d" stroke-width="1.2"/>
      <path d="M12 15.5H20M16 11.5V19.5" stroke="#39ff88" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
    engine: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="12" width="16" height="12" rx="2" fill="#2a3532" stroke="#9ce6b8" stroke-width="1.5"/>
      <path d="M10 12V8H20V12" fill="#1c2724" stroke="#ffb84d" stroke-width="1.5"/>
      <path d="M12 8V5M15 8V5M18 8V5" stroke="#ffb84d" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M23 15H27L29 18L27 21H23" fill="#ff7a2f" stroke="#ffe169" stroke-width="1.2"/>
      <path d="M3 16H7M3 20H7" stroke="#38e8ff" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="15" cy="18" r="2.8" stroke="#39ff88" stroke-width="1.5"/>
    </svg>`,
    matrix: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="9" width="14" height="14" rx="2.5" fill="#0b2416" stroke="#39ff88" stroke-width="1.6"/>
      <rect x="13" y="13" width="6" height="6" rx="1" fill="#39ff88"/>
      <path d="M12 5V9M16 5V9M20 5V9M12 23V27M16 23V27M20 23V27M5 12H9M5 16H9M5 20H9M23 12H27M23 16H27M23 20H27" stroke="#38e8ff" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`,
    kit: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="9" width="22" height="17" rx="3" fill="#26382c" stroke="#ffb84d" stroke-width="1.6"/>
      <path d="M12 9V6.5C12 5.7 12.7 5 13.5 5H18.5C19.3 5 20 5.7 20 6.5V9" stroke="#ffb84d" stroke-width="1.6"/>
      <path d="M16 12.5V22.5M11 17.5H21" stroke="#39ff88" stroke-width="2.8" stroke-linecap="round"/>
    </svg>`
  };

  const LOOT_DEFS = {
    ammo:   { color: '#ff5e5e', label: 'Патроны +28',  short: 'A' },
    medkit: { color: '#55e87b', label: 'Аптечка +24 HP', short: '+' },
    caps:   { color: '#ffb84d', label: 'Крышки +25 ₵', short: '₵' },
    focus:  { color: '#38e8ff', label: 'Ядро Фокуса',  short: 'F' },
    radaway:{ color: '#d0ff5e', label: 'Антирад',      short: 'R' },
    module: { color: '#c77dff', label: 'Модуль +35 ₵', short: '★' }
  };

  const LOOT_POOL = ['ammo', 'ammo', 'caps', 'caps', 'medkit', 'focus', 'radaway', 'module'];
  const MATRIX_CHARS = '0123456789ABCDEFアイウエオカキクケコサシスセソタチツテト';
  const SECTORS = WorldMod.SECTORS || [{ index: 0, id: 'downtown', code: '01', name: 'НОЧНОЙ ДАУНТАУН', shortName: '01 ДАУНТАУН', weather: 'rain', capsMult: 1.0, threatBonus: 0, ambient: '#26303d' }];

  // ==================== СОСТОЯНИЕ ИГРЫ ====================
  let currentSector = 0;
  let maxSector = 0;
  let sectorContracts = 0;
  let sectorReadyNext = false;
  let runSeed = Math.floor(Math.random() * 10000);
  let world = WorldMod.createWorld(currentSector, runSeed);

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const lightCanvas = document.createElement('canvas');
  const lightCtx = lightCanvas.getContext('2d');
  const stageScreen = document.getElementById('stage-screen');
  const minimapCanvas = document.getElementById('minimap');
  const minimapCtx = minimapCanvas.getContext('2d');
  const mobileMinimapCanvas = document.getElementById('mobile-minimap');
  const mobileMinimapCtx = mobileMinimapCanvas.getContext('2d');

  // Настройки (сохраняются в localStorage)
  const prefs = loadPrefs();
  let bestScore = Number(localStorage.getItem('gta0_best_score') || 0);

  let viewW = 800;
  let viewH = 600;
  let dpr = 1;

  // Состояние сессии: 'menu' | 'playing' | 'paused' | 'dead'
  let gameState = 'menu';
  let elapsed = 0;
  let uiTimer = 0;
  let geigerTimer = 0;
  let shakeAmt = 0;
  let matrixActive = false;
  let touchMatrixToggle = false;
  let matrixBreach = 0; // 0..1 — насколько «прорывается» скрытый код Матрицы
  let glitchTimer = 0;

  const cam = { x: world.depot.x, y: world.depot.y };
  const keys = Object.create(null);
  const mouse = { x: 0, y: 0, down: false, rightDown: false, active: false };
  const joy = { active: false, pointerId: null, dx: 0, dy: 0, mag: 0, ang: 0 };
  let touchFire = false;

  let player = null;
  let enemies = [];
  let bullets = [];
  let loot = [];
  let particles = [];
  let skidmarks = [];
  let ghosts = [];
  let floatTexts = [];
  let lightFlashes = [];
  let weatherDrops = [];
  let rainCols = [];
  let mission = null;
  let logs = [];
  let nextEntId = 1;
  let enemySpawnTimer = 0;
  let traceDecayTimer = 0;
  let lastAutoTarget = null;

  // ==================== DOM ССЫЛКИ ====================
  const el = {
    app: document.getElementById('app'),
    sidebar: document.getElementById('sidebar'),
    backdrop: document.getElementById('sidebar-backdrop'),
    overlay: document.getElementById('overlay-screen'),
    modalLogoWrap: document.getElementById('modal-logo-wrap'),
    modalTitle: document.getElementById('modal-title'),
    modalSub: document.getElementById('modal-subtitle'),
    btnPlay: document.getElementById('btn-play'),
    btnRestartModal: document.getElementById('btn-restart-modal'),
    btnCreditsModal: document.getElementById('btn-credits-modal'),
    btnCreditsMenu: document.getElementById('btn-credits-menu'),
    btnCreditsBezel: document.getElementById('btn-credits-bezel'),
    creditsOverlay: document.getElementById('credits-overlay'),
    btnCreditsClose: document.getElementById('btn-credits-close'),
    btnCreditsCloseX: document.getElementById('btn-credits-close-x'),
    btnPauseResume: document.getElementById('btn-pause-resume'),
    btnRestart: document.getElementById('btn-restart'),
    btnResetSave: document.getElementById('btn-reset-save'),
    btnMobileMenu: document.getElementById('btn-mobile-menu'),
    btnCloseMenu: document.getElementById('btn-close-menu'),
    btnMobileRadar: document.getElementById('btn-mobile-radar'),
    mobileRadarFloat: document.getElementById('mobile-radar-float'),
    mobileCabinWrap: document.getElementById('mobile-cabin-wrap'),
    mobileDriverCam: document.getElementById('mobile-driver-cam'),
    mobileCabinDot: document.getElementById('mobile-cabin-dot'),
    mobileCabinFm: document.getElementById('mobile-cabin-fm'),
    btnNextSector: document.getElementById('btn-next-sector'),
    modalRunConfig: document.getElementById('modal-run-config'),
    sectorPicker: document.getElementById('sector-picker'),
    btnDiffStd: document.getElementById('btn-diff-std'),
    btnDiffHard: document.getElementById('btn-diff-hard'),
    matrixVignette: document.getElementById('matrix-vignette'),

    hudSector: document.getElementById('hud-sector'),
    hudMission: document.getElementById('hud-mission'),
    hudTrace: document.getElementById('hud-trace'),

    mHpFill: document.getElementById('m-hp-fill'),
    mFocusFill: document.getElementById('m-focus-fill'),
    mAmmo: document.getElementById('m-ammo'),
    mCaps: document.getElementById('m-caps'),

    uiCarName: document.getElementById('ui-car-name'),
    uiBrandTitle: document.getElementById('ui-brand-title'),
    uiSignalBadge: document.getElementById('ui-signal-badge'),
    ledRad: document.getElementById('led-rad'),
    ledMatrix: document.getElementById('led-matrix'),
    uiCoords: document.getElementById('ui-coords'),
    uiHpVal: document.getElementById('ui-hp-val'),
    uiHpFill: document.getElementById('ui-hp-fill'),
    uiFocusVal: document.getElementById('ui-focus-val'),
    uiFocusFill: document.getElementById('ui-focus-fill'),
    uiRadVal: document.getElementById('ui-rad-val'),
    uiRadFill: document.getElementById('ui-rad-fill'),
    uiAmmo: document.getElementById('ui-ammo'),
    uiCaps: document.getElementById('ui-caps'),
    uiScore: document.getElementById('ui-score'),
    uiKills: document.getElementById('ui-kills'),
    uiSpeed: document.getElementById('ui-speed'),
    uiLog: document.getElementById('ui-log'),
    uiDepotBanner: document.getElementById('ui-depot-banner'),
    uiDepotHint: document.getElementById('ui-depot-hint'),
    btnDepotService: document.getElementById('btn-depot-service'),

    uiGarageCaps: document.getElementById('ui-garage-caps'),
    uiSaveBadge: document.getElementById('ui-save-badge'),
    garageCarImg: document.getElementById('garage-car-img'),
    garageCarRank: document.getElementById('garage-car-rank'),
    garageCarName: document.getElementById('garage-car-name'),
    garageCarStats: document.getElementById('garage-car-stats'),
    garageCarMods: document.getElementById('garage-car-mods'),
    garageList: document.getElementById('garage-list'),

    uiMissionType: document.getElementById('ui-mission-type'),
    uiMissionTitle: document.getElementById('ui-mission-title'),
    uiMissionDesc: document.getElementById('ui-mission-desc'),
    uiMissionFill: document.getElementById('ui-mission-fill'),
    uiMissionProg: document.getElementById('ui-mission-prog'),
    uiMissionReward: document.getElementById('ui-mission-reward'),
    uiMissionsDone: document.getElementById('ui-missions-done'),
    uiBestScore: document.getElementById('ui-best-score'),

    optSound: document.getElementById('opt-sound'),
    optMusic: document.getElementById('opt-music'),
    optHardcore: document.getElementById('opt-hardcore'),
    optMobileCam: document.getElementById('opt-mobile-cam'),
    optCrt: document.getElementById('opt-crt'),
    optNoir: document.getElementById('opt-noir'),
    optRain: document.getElementById('opt-rain'),
    optSidebarLeft: document.getElementById('opt-sidebar-left'),
    optZoom: document.getElementById('opt-zoom'),
    optZoomVal: document.getElementById('opt-zoom-val'),

    joyZone: document.getElementById('joy-zone'),
    joyBase: document.getElementById('joy-base'),
    joyStick: document.getElementById('joy-stick'),
    btnTouchFire: document.getElementById('btn-touch-fire'),
    btnTouchMatrix: document.getElementById('btn-touch-matrix'),
    btnTouchDepot: document.getElementById('btn-touch-depot'),

    cabinPanel: document.getElementById('cabin-panel'),
    cabinScreenFrame: document.getElementById('cabin-screen-frame'),
    driverCam: document.getElementById('driver-cam'),
    driverEcg: document.getElementById('driver-ecg'),
    driverRecDot: document.getElementById('driver-rec-dot'),
    driverPersonaBadge: document.getElementById('driver-persona-badge'),
    driverMoodLabel: document.getElementById('driver-mood-label'),
    driverBpm: document.getElementById('driver-bpm'),
    driverQuote: document.getElementById('driver-quote')
  };

  // ==================== УТИЛИТЫ ====================
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function normAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }
  function haptic(pattern) {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch { /* ignore */ }
  }

  function loadPrefs() {
    try {
      const saved = JSON.parse(localStorage.getItem('gta0_prefs') || '{}');
      return {
        sound: saved.sound !== false,
        music: saved.music !== false,
        musicTrack: clamp(Math.floor(Number(saved.musicTrack || 0)), 0, 2),
        hardcore: !!saved.hardcore,
        mobileCam: saved.mobileCam !== false,
        crt: saved.crt !== false,
        noir: saved.noir !== false,
        rain: saved.rain !== false,
        sidebarLeft: !!saved.sidebarLeft,
        zoom: clamp(Number(saved.zoom || 1), 0.7, 1.4)
      };
    } catch {
      return { sound: true, music: true, musicTrack: 0, hardcore: false, mobileCam: true, crt: true, noir: true, rain: true, sidebarLeft: false, zoom: 1.0 };
    }
  }

  function savePrefs() {
    try { localStorage.setItem('gta0_prefs', JSON.stringify(prefs)); } catch { /* ignore */ }
  }

  function defaultProgress() {
    return {
      version: 1,
      caps: 25,
      carClass: 0,
      engineLvl: 1,
      weaponLvl: 1,
      missileLvl: 0,
      armorLvl: 1,
      matrixLvl: 1,
      maxSector: 0,
      currentSector: 0,
      bestScore: Number(localStorage.getItem('gta0_best_score') || 0) || 0,
      totalKills: 0,
      totalMissions: 0
    };
  }

  function loadSavedProgress() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultProgress();
      const s = JSON.parse(raw);
      return {
        version: 1,
        caps: Math.max(0, Math.floor(Number(s.caps ?? 25))),
        carClass: clamp(Math.floor(Number(s.carClass ?? 0)), 0, CAR_CLASSES.length - 1),
        engineLvl: clamp(Math.floor(Number(s.engineLvl ?? 1)), 1, 4),
        weaponLvl: clamp(Math.floor(Number(s.weaponLvl ?? 1)), 1, 4),
        missileLvl: clamp(Math.floor(Number(s.missileLvl ?? 0)), 0, 3),
        armorLvl: clamp(Math.floor(Number(s.armorLvl ?? 1)), 1, 4),
        matrixLvl: clamp(Math.floor(Number(s.matrixLvl ?? 1)), 1, 4),
        maxSector: clamp(Math.floor(Number(s.maxSector ?? 0)), 0, SECTORS.length - 1),
        currentSector: clamp(Math.floor(Number(s.currentSector ?? 0)), 0, SECTORS.length - 1),
        bestScore: Math.max(0, Math.floor(Number(s.bestScore ?? 0)), Number(localStorage.getItem('gta0_best_score') || 0) || 0),
        totalKills: Math.max(0, Math.floor(Number(s.totalKills ?? 0))),
        totalMissions: Math.max(0, Math.floor(Number(s.totalMissions ?? 0)))
      };
    } catch {
      return defaultProgress();
    }
  }

  let savePulseTimer = null;
  function saveProgress() {
    if (!player) return;
    try {
      const payload = {
        version: 1,
        caps: Math.max(0, Math.floor(player.caps)),
        carClass: player.carClass,
        engineLvl: player.engineLvl,
        weaponLvl: player.weaponLvl,
        missileLvl: player.missileLvl,
        armorLvl: player.armorLvl,
        matrixLvl: player.matrixLvl,
        maxSector: clamp(maxSector, 0, SECTORS.length - 1),
        currentSector: clamp(currentSector, 0, SECTORS.length - 1),
        bestScore: Math.max(bestScore, Math.floor(player.score)),
        totalKills: Math.max(0, Math.floor(player.totalKills || 0)),
        totalMissions: Math.max(0, Math.floor(player.totalMissions || 0))
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      localStorage.setItem('gta0_best_score', String(payload.bestScore));
      if (el.uiSaveBadge) {
        el.uiSaveBadge.textContent = '● СОХРАНЕНО';
        el.uiSaveBadge.classList.add('saved-pulse');
        if (savePulseTimer) clearTimeout(savePulseTimer);
        savePulseTimer = setTimeout(() => {
          if (el.uiSaveBadge) {
            el.uiSaveBadge.classList.remove('saved-pulse');
            el.uiSaveBadge.textContent = '● АВТОСОХР';
          }
        }, 900);
      }
    } catch { /* ignore */ }
  }

  function resetSavedProgress() {
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem('gta0_best_score');
    } catch { /* ignore */ }
    bestScore = 0;
    resetRun(true);
    addLog('Сохранённый прогресс сброшен до базового SCOUT BUGGY.', 'warn');
  }

  function effectiveZoom() {
    // На узких экранах телефонов чуть отдаляем камеру для лучшего обзора улиц
    const minSide = Math.min(viewW, viewH);
    const mobileScale = minSide < 520 ? clamp(minSide / 520, 0.66, 0.92) : 1.0;
    return prefs.zoom * mobileScale;
  }

  function addLog(text, kind) {
    logs.unshift({ text, kind: kind || '' });
    if (logs.length > 6) logs.length = 6;
    renderLogs();
  }

  function renderLogs() {
    el.uiLog.innerHTML = logs.map((item) =>
      `<div class="log-entry ${item.kind}">${escapeHtml(item.text)}</div>`
    ).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function addFloatText(x, y, text, color) {
    floatTexts.push({ x, y, text, color: color || '#39ff88', life: 1.15, maxLife: 1.15 });
  }

  // ==================== КАМЕРА В КАБИНЕ ВОДИТЕЛЯ (ПК + МОБИЛЬНАЯ) ====================
  const driverCtx = el.driverCam ? el.driverCam.getContext('2d') : null;
  const mobileDriverCtx = el.mobileDriverCam ? el.mobileDriverCam.getContext('2d') : null;
  const ecgCtx = el.driverEcg ? el.driverEcg.getContext('2d') : null;

  const DRV = {
    IDLE: 0,
    HALF_BLINK: 1,
    BLINK: 2,
    HALF_LEFT: 3,
    LEFT: 4,
    HALF_RIGHT: 5,
    RIGHT: 6,
    SMIRK: 7,
    GRIN: 8,
    HURT: 9,
    CANTEEN_RAISE: 10,
    CANTEEN: 11,
    NEO: 12
  };

  let driverSheet = null;
  let driverSheetReady = false;
  if (typeof Image !== 'undefined') {
    driverSheet = new Image();
    driverSheet.onload = () => { driverSheetReady = true; };
    driverSheet.src = 'assets/driver-sheet.jpg?v=15';
  }

  const DRIVER_QUOTES = {
    menu: [
      'Двигатель прогрет. Готов к выезду.',
      'Сектор-0 шумит. Выходим на трассу.',
      'Резина в пыли, турель заряжена.'
    ],
    kill: [
      'На металлолом!',
      'Жги резину! Следующий!',
      'Чистая работа, железяка!',
      'Ещё один рейдер в пыль!',
      'Капот выдержит и не такое.'
    ],
    agentKill: [
      'Агент отключён. Код рассыпался.',
      'Слишком предсказуемый алгоритм.',
      'Минус один страж Системы.'
    ],
    hurt: [
      'Броня трещит, держим руль!',
      'Чёртов бампер! Ответим свинцом.',
      'Всего лишь царапина на стали.',
      'Неплохой удар… теперь моя очередь.'
    ],
    crash: [
      'Бетон крепкий, но мы крепче.',
      'Выруливаем! Кочки в Пустоши злые.'
    ],
    canteen: [
      'Фляжка Убежища-0. Почти без фона.',
      'Глоток из старых запасов Убежища.',
      'Война никогда не меняется… но пить хочется.',
      'Чистая вода — дороже крышек.'
    ],
    depot: [
      'Бункер-Депо. Как дома, в Убежище-0.',
      'Антирадин и свежий металл. Живём дальше.',
      'Фляжка полная, корпус залатан.'
    ],
    rad: [
      'Счётчик трещит… пора в Депо.',
      'Фон зашкаливает. Убежище учило не тянуть.',
      'Чувствую этот привкус радиации.'
    ],
    upgrade: [
      'Хорошая сборка. За это можно и глотнуть.',
      'Крышки звенят — тачка становится злее.'
    ],
    mission: [
      'Контракт закрыт. Крышки в кармане.',
      'Надёжная работа выходца из Убежища.'
    ],
    neo: [
      'Я вижу код за этим бетоном.',
      'Пули слишком медленные.',
      'Время встало. Есть только газ.',
      'Реальность трещит… я в потоке.',
      'Очки поймали скрытый код Системы.'
    ],
    hack: [
      'Взламываю узел… код пошёл в линзы.',
      'Подключился к терминалу. Держим точку.',
      'Взлом узла Системы. Очки ловят поток.',
      'Расшифровка идёт — не сходим с позиции.'
    ],
    pause: [
      'Перекур в кабине…',
      'Осматриваю горизонт.'
    ],
    dead: [
      'НЕТ СИГНАЛА // КАБИНА ОТКЛЮЧЕНА'
    ]
  };

  function pickQuote(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  const CABIN_GLYPHS = '01アイウエオカキクケコ7A9FΞΨ';
  const goggleCodeCols = [];
  for (let i = 0; i < 16; i++) {
    goggleCodeCols.push({
      y: Math.random() * 60,
      speed: 36 + Math.random() * 58,
      seed: Math.floor(Math.random() * 999)
    });
  }

  const ECG_SAMPLES = 76;
  const driverCam = {
    curFrame: DRV.IDLE,
    prevFrame: DRV.IDLE,
    blend: 1,
    persona: 'driver',
    mood: 'ОЖИДАНИЕ',
    quote: DRIVER_QUOTES.menu[0],
    quoteTimer: 0,

    steerSmooth: 0,
    headYaw: 0,
    grinTimer: 0,
    grinDur: 1.9,
    hurtTimer: 0,
    canteenTimer: 0,
    canteenDur: 2.9,
    neoTimer: 0,
    codeFlashTimer: 0,
    missionCodeGlow: 0,
    wasHacking: false,
    glitchSliceTimer: 0,
    vaultAuraTimer: 0,

    blinkTimer: 1.8,
    blinkDur: 0,
    blinkTotal: 0.19,
    doubleBlink: false,

    glanceTimer: 3.4,
    glanceDir: 0,
    glanceDur: 0,

    autoSipCooldown: 22,
    calmDriveTimer: 0,
    clickCycle: 0,

    muzzleFlash: 0,
    muzzleSide: 0,
    muzzleColor: '#ffb24a',
    explosionFlash: 0,
    explosionColor: '#ff9638',
    damageFlash: 0,
    joltX: 0,
    joltY: 0,

    bpm: 78,
    targetBpm: 78,
    ecgPhase: 0,
    ecgStepAcc: 0,
    ecgBuf: new Float32Array(ECG_SAMPLES),

    lastUiPersona: '',
    lastUiMood: '',
    lastUiQuote: '',
    lastUiBpm: -1
  };

  function driverSetQuote(text, holdSec) {
    driverCam.quote = text;
    driverCam.quoteTimer = holdSec || 4.0;
  }

  function driverReset() {
    driverCam.curFrame = DRV.IDLE;
    driverCam.prevFrame = DRV.IDLE;
    driverCam.blend = 1;
    driverCam.persona = 'driver';
    driverCam.mood = gameState === 'menu' ? 'ОЖИДАНИЕ' : 'ДОРОГА';
    driverCam.grinTimer = 0;
    driverCam.hurtTimer = 0;
    driverCam.canteenTimer = 0;
    driverCam.neoTimer = 0;
    driverCam.codeFlashTimer = 0;
    driverCam.missionCodeGlow = 0;
    driverCam.wasHacking = false;
    driverCam.glitchSliceTimer = 0;
    driverCam.vaultAuraTimer = 0;
    driverCam.muzzleFlash = 0;
    driverCam.explosionFlash = 0;
    driverCam.damageFlash = 0;
    driverCam.joltX = 0;
    driverCam.joltY = 0;
    driverCam.steerSmooth = 0;
    driverCam.headYaw = 0;
    driverCam.autoSipCooldown = 20 + Math.random() * 12;
    driverCam.calmDriveTimer = 0;
    driverCam.bpm = 78;
    driverCam.targetBpm = 78;
    driverCam.ecgBuf.fill(0);
    driverSetQuote(pickQuote(DRIVER_QUOTES.menu), 5.0);
  }

  function driverOnGunfire(isPlasma, turretAng) {
    if (!player) return;
    const rel = normAngle(turretAng - player.ang);
    driverCam.muzzleSide = clamp(Math.sin(rel) * 1.15, -1, 1);
    driverCam.muzzleFlash = Math.min(1, Math.max(driverCam.muzzleFlash, 0.85));
    driverCam.muzzleColor = isPlasma ? '#4cff9c' : '#ffb44c';
    driverCam.joltY = Math.min(2.2, driverCam.joltY + 0.9);
    driverCam.calmDriveTimer = 0;
  }

  function driverOnExplosion(wx, wy, isAgent) {
    if (!player) return;
    const d = Math.hypot(wx - player.x, wy - player.y);
    if (d > 680) return;
    const intensity = clamp(1 - d / 680, 0.25, 1.0);
    driverCam.explosionFlash = Math.max(driverCam.explosionFlash, intensity);
    driverCam.explosionColor = isAgent ? '#39ff88' : '#ff9436';
    driverCam.joltX += (Math.random() - 0.5) * 6 * intensity;
    driverCam.joltY += (Math.random() - 0.5) * 6 * intensity;
    if (isAgent) {
      driverCam.codeFlashTimer = Math.max(driverCam.codeFlashTimer, 1.4);
      driverCam.glitchSliceTimer = Math.max(driverCam.glitchSliceTimer, 0.24);
    }
  }

  function driverOnHit(dmg, isCrash) {
    driverCam.canteenTimer = 0;
    driverCam.hurtTimer = Math.max(driverCam.hurtTimer, isCrash ? 0.52 : 0.68);
    driverCam.damageFlash = Math.min(1, Math.max(driverCam.damageFlash, isCrash ? 0.55 : 0.85));
    driverCam.joltX += (Math.random() - 0.5) * 9;
    driverCam.joltY += (Math.random() - 0.5) * 7;
    driverCam.calmDriveTimer = 0;
    if (dmg >= 10) {
      driverCam.glitchSliceTimer = Math.max(driverCam.glitchSliceTimer, 0.16);
    }
    if (driverCam.quoteTimer <= 1.2) {
      driverSetQuote(pickQuote(isCrash ? DRIVER_QUOTES.crash : DRIVER_QUOTES.hurt), 3.2);
    }
  }

  function driverOnKill(isAgent) {
    driverCam.canteenTimer = 0;
    driverCam.calmDriveTimer = 0;
    if (isAgent) {
      driverCam.neoTimer = Math.max(driverCam.neoTimer, 2.5);
      driverCam.codeFlashTimer = Math.max(driverCam.codeFlashTimer, 2.5);
      driverCam.glitchSliceTimer = Math.max(driverCam.glitchSliceTimer, 0.26);
      driverSetQuote(pickQuote(DRIVER_QUOTES.agentKill), 4.0);
    } else {
      driverCam.grinDur = 1.9;
      driverCam.grinTimer = Math.max(driverCam.grinTimer, driverCam.grinDur);
      driverCam.joltY -= 1.8;
      driverSetQuote(pickQuote(DRIVER_QUOTES.kill), 3.4);
    }
  }

  function driverDrinkCanteen(customQuote) {
    if (gameState === 'dead') return;
    driverCam.canteenDur = 2.9;
    driverCam.canteenTimer = driverCam.canteenDur;
    driverCam.vaultAuraTimer = Math.max(driverCam.vaultAuraTimer, 3.4);
    driverCam.autoSipCooldown = 28 + Math.random() * 16;
    driverSetQuote(customQuote || pickQuote(DRIVER_QUOTES.canteen), 3.8);
    if (AudioFX.canteen) AudioFX.canteen();
  }

  function driverAwakenNeo(duration, customQuote) {
    if (gameState === 'dead') return;
    driverCam.canteenTimer = 0;
    driverCam.neoTimer = Math.max(driverCam.neoTimer, duration || 2.4);
    driverCam.codeFlashTimer = Math.max(driverCam.codeFlashTimer, (duration || 2.4) + 0.5);
    driverCam.glitchSliceTimer = Math.max(driverCam.glitchSliceTimer, 0.24);
    if (customQuote) driverSetQuote(customQuote, 3.8);
  }

  function driverVaultMoment(customQuote) {
    if (gameState === 'dead') return;
    driverCam.vaultAuraTimer = Math.max(driverCam.vaultAuraTimer, 3.5);
    if (customQuote) driverSetQuote(customQuote, 3.8);
  }

  function syncTrackBadge() {
    const info = AudioFX.getTrackInfo ? AudioFX.getTrackInfo() : { index: prefs.musicTrack || 0, code: 'FM-01', name: 'RAZOR NEON', bpm: 138 };
    if (el.mobileCabinFm) {
      el.mobileCabinFm.textContent = `♪${info.index + 1}`;
    }
    if (el.cabinScreenFrame) {
      el.cabinScreenFrame.title = `Клик — сменить Keygen-трек (${info.code}: ${info.name}, ${info.bpm} BPM)`;
    }
  }

  function driverInteractiveClick() {
    if (gameState === 'dead') return;
    const info = AudioFX.nextTrack ? AudioFX.nextTrack() : { index: (driverCam.clickCycle + 1) % 3, code: 'FM-01', name: 'RAZOR NEON', bpm: 138 };
    prefs.musicTrack = info.index;
    savePrefs();
    syncTrackBadge();

    const trackLine = `♪ ${info.code} · ${info.name} (${info.bpm} BPM)`;
    if (info.index === 1) {
      driverAwakenNeo(2.4, trackLine);
    } else if (info.index === 2) {
      driverDrinkCanteen(trackLine);
    } else {
      driverCam.canteenTimer = 0;
      driverCam.neoTimer = 0;
      driverCam.grinDur = 2.0;
      driverCam.grinTimer = 2.0;
      driverCam.joltY -= 1.5;
      driverSetQuote(trackLine, 3.8);
    }

    const mutedNote = prefs.music ? '' : ' [музыка выкл]';
    if (player) {
      addFloatText(player.x, player.y - 34, `♪ ${info.code} · ${info.name}`, info.index === 1 ? '#39ff88' : (info.index === 2 ? '#ffb84d' : '#38e8ff'));
    }
    addLog(`Радио кабины: ${trackLine}${mutedNote}`, 'matrix');
  }

  function sampleEcgWave(phase) {
    // Классический комплекс P-QRS-T (phase в 0..1)
    if (phase > 0.12 && phase < 0.20) {
      return Math.sin(((phase - 0.12) / 0.08) * Math.PI) * 0.24;
    }
    if (phase >= 0.24 && phase < 0.27) {
      return -Math.sin(((phase - 0.24) / 0.03) * Math.PI) * 0.28;
    }
    if (phase >= 0.27 && phase < 0.32) {
      return Math.sin(((phase - 0.27) / 0.05) * Math.PI) * 1.0;
    }
    if (phase >= 0.32 && phase < 0.36) {
      return -Math.sin(((phase - 0.32) / 0.04) * Math.PI) * 0.42;
    }
    if (phase > 0.44 && phase < 0.58) {
      return Math.sin(((phase - 0.44) / 0.14) * Math.PI) * 0.34;
    }
    return 0;
  }

  function updateDriverCam(dt) {
    // Затухание таймеров и вспышек
    if (driverCam.quoteTimer > 0) driverCam.quoteTimer = Math.max(0, driverCam.quoteTimer - dt);
    if (driverCam.grinTimer > 0) driverCam.grinTimer = Math.max(0, driverCam.grinTimer - dt);
    if (driverCam.hurtTimer > 0) driverCam.hurtTimer = Math.max(0, driverCam.hurtTimer - dt);
    if (driverCam.canteenTimer > 0) driverCam.canteenTimer = Math.max(0, driverCam.canteenTimer - dt);
    if (driverCam.neoTimer > 0) driverCam.neoTimer = Math.max(0, driverCam.neoTimer - dt);
    if (driverCam.codeFlashTimer > 0) driverCam.codeFlashTimer = Math.max(0, driverCam.codeFlashTimer - dt);
    if (driverCam.glitchSliceTimer > 0) driverCam.glitchSliceTimer = Math.max(0, driverCam.glitchSliceTimer - dt);
    if (driverCam.vaultAuraTimer > 0) driverCam.vaultAuraTimer = Math.max(0, driverCam.vaultAuraTimer - dt);

    driverCam.muzzleFlash = Math.max(0, driverCam.muzzleFlash - dt * 7.8);
    driverCam.explosionFlash = Math.max(0, driverCam.explosionFlash - dt * 2.9);
    driverCam.damageFlash = Math.max(0, driverCam.damageFlash - dt * 3.4);
    driverCam.joltX *= Math.exp(-14 * dt);
    driverCam.joltY *= Math.exp(-14 * dt);

    // Анимация падающих цифр Матрицы в линзах очков
    for (const c of goggleCodeCols) {
      c.y += c.speed * dt;
      if (c.y > 54) {
        c.y = -12;
        c.seed = (c.seed + 17) % 997;
      }
    }

    // Определяем текущее состояние игры, руление и контекст
    const isDead = gameState === 'dead';
    const isPlaying = gameState === 'playing' && !!player;
    const speed = player ? Math.hypot(player.vx, player.vy) : 0;

    let rawSteer = 0;
    if (isPlaying) {
      const left = keys.KeyA || keys.ArrowLeft ? 1 : 0;
      const right = keys.KeyD || keys.ArrowRight ? 1 : 0;
      rawSteer = right - left;
      if (joy.active && joy.mag > 0.15) {
        rawSteer = clamp(normAngle(joy.ang - player.ang) * 1.4, -1, 1);
      }
    }
    driverCam.steerSmooth += (rawSteer - driverCam.steerSmooth) * Math.min(1, 10 * dt);

    // Матрица на очках — только при реальном действии в миссии (взлом узла / уход от Следа с Агентом) или в Фокусе Матрицы!
    const hackDist = (isPlaying && mission && mission.type === 'hack' && mission.target)
      ? dist(player, mission.target)
      : Infinity;
    const isHacking = isPlaying && mission && mission.type === 'hack' && mission.target && hackDist <= mission.target.radius;
    const radHigh = isPlaying && (player.rad >= 45 || world.getRadIntensity(player.x, player.y) > 0.12);

    let targetMissionGlow = 0;
    if (isHacking) {
      targetMissionGlow = 1.0;
      if (!driverCam.wasHacking) {
        driverCam.glitchSliceTimer = Math.max(driverCam.glitchSliceTimer, 0.22);
        driverSetQuote(pickQuote(DRIVER_QUOTES.hack), 4.2);
      }
    } else if (isPlaying && mission && mission.type === 'hack' && hackDist < 185) {
      // На подъезде к целевому узлу взлома очки начинают ловить цифровой сигнал
      targetMissionGlow = clamp((1 - hackDist / 185) * 0.85, 0, 0.78);
    } else if (isPlaying && mission && mission.type === 'survive') {
      // Во время миссии «Уход от Следа Матрицы» при сближении Агента на очках пробегает сигнал Системы
      for (const e of enemies) {
        if (e.kind === 'agent') {
          const ad = dist(player, e);
          if (ad < 260) targetMissionGlow = Math.max(targetMissionGlow, (1 - ad / 260) * 0.88);
        }
      }
    }
    driverCam.wasHacking = isHacking;
    driverCam.missionCodeGlow += (targetMissionGlow - driverCam.missionCodeGlow) * Math.min(1, 7 * dt);

    // Спонтанное питьё из фляжки Убежища на спокойной дороге (или изредка в паузе)
    if (!isDead) {
      const calmNow = (!isPlaying && gameState === 'paused') ||
        (isPlaying && !matrixActive && driverCam.hurtTimer <= 0 && driverCam.muzzleFlash <= 0.05 && player.trace <= 2);
      if (calmNow) {
        driverCam.calmDriveTimer += dt;
        driverCam.autoSipCooldown -= dt;
        if (driverCam.autoSipCooldown <= 0 && driverCam.calmDriveTimer > 6) {
          driverDrinkCanteen(pickQuote(DRIVER_QUOTES.canteen));
        }
      } else {
        driverCam.calmDriveTimer = Math.max(0, driverCam.calmDriveTimer - dt * 2);
      }
    }

    // Предупреждение о радиации от Выходца из Убежища
    if (radHigh && driverCam.quoteTimer <= 0 && !matrixActive) {
      driverSetQuote(pickQuote(DRIVER_QUOTES.rad), 4.2);
    }

    // Автономные повороты головы (осматривается по сторонам и в зеркала)
    if (driverCam.glanceDur > 0) {
      driverCam.glanceDur -= dt;
      if (driverCam.glanceDur <= 0) driverCam.glanceDir = 0;
    } else {
      driverCam.glanceTimer -= dt;
      if (driverCam.glanceTimer <= 0) {
        driverCam.glanceTimer = 2.3 + Math.random() * 2.6;
        if (Math.abs(driverCam.steerSmooth) < 0.16) {
          const sign = Math.random() < 0.5 ? -1 : 1;
          // Иногда лёгкий взгляд вбок (0.55), иногда полный поворот головы (1.0)
          driverCam.glanceDir = sign * (Math.random() < 0.45 ? 0.55 : 1.0);
          driverCam.glanceDur = 0.75 + Math.random() * 0.75;
        }
      }
    }

    // Плавный угол поворота головы (-1..+1) для 5-ступенчатой покадровой анимации (LEFT ↔ HALF_LEFT ↔ IDLE ↔ HALF_RIGHT ↔ RIGHT)
    let targetYaw = 0;
    if (Math.abs(driverCam.steerSmooth) > 0.12) {
      targetYaw = clamp(driverCam.steerSmooth * 1.15, -1, 1);
    } else if (driverCam.glanceDir !== 0) {
      targetYaw = driverCam.glanceDir;
    }
    driverCam.headYaw += (targetYaw - driverCam.headYaw) * Math.min(1, 6.2 * dt);

    // Естественное 3-фазное моргание глазами (IDLE → HALF_BLINK → BLINK → HALF_BLINK → IDLE)
    if (driverCam.blinkDur > 0) {
      driverCam.blinkDur = Math.max(0, driverCam.blinkDur - dt);
    } else {
      driverCam.blinkTimer -= dt;
      if (driverCam.blinkTimer <= 0) {
        if (Math.abs(driverCam.headYaw) >= 0.22) {
          driverCam.blinkTimer = 0.2;
        } else {
          driverCam.blinkTotal = 0.19;
          driverCam.blinkDur = driverCam.blinkTotal;
          if (!driverCam.doubleBlink && Math.random() < 0.22) {
            driverCam.doubleBlink = true;
            driverCam.blinkTimer = 0.28;
          } else {
            driverCam.doubleBlink = false;
            driverCam.blinkTimer = 2.6 + Math.random() * 2.8;
          }
        }
      }
    }

    // Выбор кадра, личности (Гонщик / Выходец из Убежища / Нео) и статуса
    let nextFrame = DRV.IDLE;
    let nextPersona = 'driver';
    let nextMood = isPlaying ? 'ДОРОГА' : (gameState === 'paused' ? 'ПАУЗА' : 'ОЖИДАНИЕ');
    let hardCut = false;

    const neoAwake = !isDead && (matrixActive || isHacking || driverCam.neoTimer > 0);

    if (isDead) {
      nextPersona = 'dead';
      nextMood = 'NO SIGNAL';
      nextFrame = DRV.HURT;
    } else if (neoAwake) {
      nextFrame = DRV.NEO;
      nextPersona = 'neo';
      nextMood = isHacking ? 'ВЗЛОМ УЗЛА' : (matrixActive ? 'ПЕРЕГРУЗКА' : 'СИГНАЛ');
      hardCut = driverCam.curFrame !== DRV.NEO;
    } else if (driverCam.hurtTimer > 0) {
      nextFrame = DRV.HURT;
      nextPersona = radHigh ? 'vault' : 'driver';
      nextMood = 'УДАР';
      hardCut = true;
    } else if (driverCam.canteenTimer > 0) {
      // 3-этапная анимация фляжки Убежища: поднимает (0.36с) → пьёт → опускает (0.36с)
      const cElapsed = driverCam.canteenDur - driverCam.canteenTimer;
      const inTransition = cElapsed < 0.36 || driverCam.canteenTimer < 0.36;
      nextFrame = inTransition ? DRV.CANTEEN_RAISE : DRV.CANTEEN;
      nextPersona = 'vault';
      nextMood = 'ФЛЯЖКА';
    } else if (driverCam.grinTimer > 0) {
      // 3-этапная ухмылка Carmageddon: полуухмылка → полный оскал → полуухмылка
      const gElapsed = Math.max(0, driverCam.grinDur - driverCam.grinTimer);
      const isPeak = gElapsed >= 0.13 && driverCam.grinTimer >= 0.34;
      nextFrame = isPeak ? DRV.GRIN : DRV.SMIRK;
      nextPersona = 'driver';
      nextMood = 'АЗАРТ';
    } else {
      // 5-ступенчатый поворот головы + 3-фазное моргание + хитрая полуухмылка на высокой скорости/стрельбе
      if (driverCam.headYaw <= -0.66) {
        nextFrame = DRV.LEFT;
        if (Math.abs(driverCam.steerSmooth) > 0.22) nextMood = speed > 140 ? 'ДРИФТ ◀' : 'ПОВОРОТ ◀';
      } else if (driverCam.headYaw <= -0.22) {
        nextFrame = DRV.HALF_LEFT;
        if (Math.abs(driverCam.steerSmooth) > 0.22) nextMood = speed > 140 ? 'ДРИФТ ◀' : 'ПОВОРОТ ◀';
      } else if (driverCam.headYaw >= 0.66) {
        nextFrame = DRV.RIGHT;
        if (Math.abs(driverCam.steerSmooth) > 0.22) nextMood = speed > 140 ? 'ДРИФТ ▶' : 'ПОВОРОТ ▶';
      } else if (driverCam.headYaw >= 0.22) {
        nextFrame = DRV.HALF_RIGHT;
        if (Math.abs(driverCam.steerSmooth) > 0.22) nextMood = speed > 140 ? 'ДРИФТ ▶' : 'ПОВОРОТ ▶';
      } else if (driverCam.blinkDur > 0) {
        const bp = 1 - driverCam.blinkDur / Math.max(0.05, driverCam.blinkTotal);
        nextFrame = (bp < 0.25 || bp > 0.74) ? DRV.HALF_BLINK : DRV.BLINK;
      } else if (driverCam.muzzleFlash > 0.08 || (isPlaying && speed > 215 && !radHigh)) {
        nextFrame = DRV.SMIRK;
      } else if (radHigh && Math.sin(elapsed * 1.4) > 0.55) {
        nextFrame = DRV.HALF_BLINK;
      } else {
        nextFrame = DRV.IDLE;
      }

      if (radHigh) {
        nextPersona = 'vault';
        nextMood = 'РАДИАЦИЯ';
      } else if (driverCam.muzzleFlash > 0.12) {
        nextMood = 'ОГОНЬ!';
      } else if ((isPlaying && player.inDepot) || driverCam.vaultAuraTimer > 0) {
        nextPersona = 'vault';
        if (Math.abs(driverCam.steerSmooth) <= 0.22) {
          nextMood = (isPlaying && player.inDepot) ? 'ДЕПО-0' : 'УБЕЖИЩЕ';
        }
      }
    }

    if (nextFrame !== driverCam.curFrame) {
      driverCam.prevFrame = driverCam.curFrame;
      driverCam.curFrame = nextFrame;
      driverCam.blend = hardCut ? 1 : 0;
      if (hardCut && nextFrame === DRV.NEO) {
        driverCam.glitchSliceTimer = Math.max(driverCam.glitchSliceTimer, 0.22);
      }
    } else if (driverCam.blend < 1) {
      // С реальными переходными кадрами достаточно короткой (~55мс) стыковки без двоения
      driverCam.blend = Math.min(1, driverCam.blend + dt * 18);
    }

    driverCam.persona = nextPersona;
    driverCam.mood = nextMood;

    // Пульс и бегущая ЭКГ (Нео = ледяные 54 BPM, бой = до 148 BPM, смерть = 0)
    if (isDead) {
      driverCam.targetBpm = 0;
    } else if (nextPersona === 'neo') {
      driverCam.targetBpm = 54;
    } else if (driverCam.canteenTimer > 0 || (isPlaying && player.inDepot)) {
      driverCam.targetBpm = 66;
    } else if (!isPlaying) {
      driverCam.targetBpm = 74;
    } else {
      let tBpm = 78 + (speed / 280) * 18 + player.trace * 8;
      if (driverCam.muzzleFlash > 0.1 || driverCam.grinTimer > 0) tBpm += 18;
      if (driverCam.hurtTimer > 0) tBpm += 28;
      if (player.hp < player.maxHp * 0.35) tBpm += 24;
      if (radHigh) tBpm += 14;
      driverCam.targetBpm = clamp(tBpm, 64, 154);
    }

    driverCam.bpm += (driverCam.targetBpm - driverCam.bpm) * Math.min(1, 3.2 * dt);
    const stepRate = 55; // сэмплов/сек по осциллографу
    driverCam.ecgStepAcc += dt * stepRate;
    while (driverCam.ecgStepAcc >= 1) {
      driverCam.ecgStepAcc -= 1;
      for (let i = 0; i < ECG_SAMPLES - 1; i++) {
        driverCam.ecgBuf[i] = driverCam.ecgBuf[i + 1];
      }
      if (isDead || driverCam.bpm < 5) {
        driverCam.ecgBuf[ECG_SAMPLES - 1] = 0;
      } else {
        driverCam.ecgPhase = (driverCam.ecgPhase + (driverCam.bpm / 60) / stepRate) % 1;
        driverCam.ecgBuf[ECG_SAMPLES - 1] = sampleEcgWave(driverCam.ecgPhase);
      }
    }

    // Синхронизация лёгких текстовых меток в DOM только при изменении
    if (driverCam.lastUiPersona !== driverCam.persona) {
      driverCam.lastUiPersona = driverCam.persona;
      const pCls = `persona-${driverCam.persona}`;
      const pLabel = driverCam.persona === 'neo'
        ? 'КОД // ZERO'
        : driverCam.persona === 'vault'
          ? 'УБЕЖИЩЕ-0'
          : driverCam.persona === 'dead'
            ? 'OFFLINE'
            : 'ГОНЩИК';
      if (el.driverPersonaBadge) {
        el.driverPersonaBadge.textContent = pLabel;
        el.driverPersonaBadge.className = `driver-persona-badge ${pCls}`;
      }
      if (el.cabinScreenFrame) {
        el.cabinScreenFrame.className = `cabin-screen-frame ${pCls}`;
      }
      if (el.driverQuote) {
        el.driverQuote.className = `driver-quote ${pCls}`;
      }
      if (el.driverRecDot) {
        el.driverRecDot.classList.toggle('off', driverCam.persona === 'dead');
      }
    }
    if (driverCam.lastUiMood !== driverCam.mood && el.driverMoodLabel) {
      driverCam.lastUiMood = driverCam.mood;
      el.driverMoodLabel.textContent = driverCam.mood;
    }
    const uiQuoteText = isDead ? DRIVER_QUOTES.dead[0] : driverCam.quote;
    if (driverCam.lastUiQuote !== uiQuoteText && el.driverQuote) {
      driverCam.lastUiQuote = uiQuoteText;
      el.driverQuote.textContent = uiQuoteText;
    }
    const dispBpm = isDead ? 0 : Math.round(driverCam.bpm);
    if (driverCam.lastUiBpm !== dispBpm && el.driverBpm) {
      driverCam.lastUiBpm = dispBpm;
      el.driverBpm.textContent = isDead ? '00' : String(dispBpm);
    }
  }

  function drawDriverFrame(dCtx, frameIdx, size, alpha) {
    if (!driverSheetReady || !driverSheet) return;
    dCtx.save();
    dCtx.globalAlpha = alpha;
    // Лёгкий запас масштаба (1.07x), чтобы при тряске/наклоне не вылезали чёрные края
    const pad = size * 0.04;
    dCtx.drawImage(driverSheet, frameIdx * 256, 0, 256, 256, -pad, -pad, size + pad * 2, size + pad * 2);
    dCtx.restore();
  }

  function renderGoggleMatrixCode(dCtx, size, intensity, headShiftX) {
    // Живые бегущие зелёные цифры Матрицы прямо ВНУТРИ обеих стеклянных линз очков на лбу!
    if (intensity <= 0.02) return;
    const lenses = [
      { cx: size * (0.405 + headShiftX), cy: size * 0.258, rx: size * 0.082, ry: size * 0.062, rot: -0.07 },
      { cx: size * (0.595 + headShiftX), cy: size * 0.258, rx: size * 0.082, ry: size * 0.062, rot: 0.07 }
    ];

    dCtx.save();
    for (let li = 0; li < lenses.length; li++) {
      const ln = lenses[li];
      dCtx.save();
      dCtx.beginPath();
      dCtx.ellipse(ln.cx, ln.cy, ln.rx, ln.ry, ln.rot, 0, Math.PI * 2);
      dCtx.clip();

      // Изумрудная подсветка стекла очков
      dCtx.fillStyle = `rgba(8, 38, 18, ${0.42 * intensity})`;
      dCtx.fillRect(ln.cx - ln.rx - 2, ln.cy - ln.ry - 2, ln.rx * 2 + 4, ln.ry * 2 + 4);

      dCtx.font = 'bold 7.5px monospace';
      dCtx.textAlign = 'center';
      const cols = 5;
      for (let c = 0; c < cols; c++) {
        const col = goggleCodeCols[(li * 6 + c) % goggleCodeCols.length];
        const x = ln.cx - ln.rx * 0.72 + (c / (cols - 1)) * (ln.rx * 1.44);
        const headY = (ln.cy - ln.ry) + ((col.y * 0.7) % (ln.ry * 2.5));
        for (let r = 0; r < 4; r++) {
          const gy = headY - r * 6.5;
          const ch = CABIN_GLYPHS[(col.seed + c * 3 + r + Math.floor(elapsed * 12)) % CABIN_GLYPHS.length];
          dCtx.fillStyle = r === 0
            ? `rgba(210, 255, 226, ${0.95 * intensity})`
            : `rgba(57, 255, 136, ${(0.82 - r * 0.18) * intensity})`;
          dCtx.fillText(ch, x, gy);
        }
      }
      dCtx.restore();

      // Лёгкое внешнее изумрудное свечение вокруг линз
      const glow = dCtx.createRadialGradient(ln.cx, ln.cy, 2, ln.cx, ln.cy, ln.rx * 1.9);
      glow.addColorStop(0, `rgba(57, 255, 136, ${0.28 * intensity})`);
      glow.addColorStop(1, 'rgba(57, 255, 136, 0)');
      dCtx.fillStyle = glow;
      dCtx.beginPath();
      dCtx.arc(ln.cx, ln.cy, ln.rx * 1.9, 0, Math.PI * 2);
      dCtx.fill();
    }
    dCtx.restore();
  }

  function renderDriverPortraitTo(dCtx, canvasEl) {
    const w = canvasEl.width;
    const h = canvasEl.height;
    dCtx.clearRect(0, 0, w, h);

    if (gameState === 'dead') {
      dCtx.fillStyle = '#070c09';
      dCtx.fillRect(0, 0, w, h);
      for (let i = 0; i < 200; i++) {
        const nx = Math.random() * w;
        const ny = Math.random() * h;
        const v = 30 + Math.floor(Math.random() * 140);
        dCtx.fillStyle = `rgb(${v},${v + 12},${v})`;
        dCtx.fillRect(nx, ny, 2 + Math.random() * 4, 1.5);
      }
      const barY = (elapsed * 70) % h;
      dCtx.fillStyle = 'rgba(255, 77, 90, 0.22)';
      dCtx.fillRect(0, barY, w, 16);

      dCtx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      dCtx.fillRect(10, h * 0.36, w - 20, 32);
      dCtx.strokeStyle = 'rgba(255, 77, 90, 0.75)';
      dCtx.strokeRect(10, h * 0.36, w - 20, 32);
      dCtx.fillStyle = '#ff6b76';
      dCtx.font = `bold ${Math.round(w * 0.1)}px monospace`;
      dCtx.textAlign = 'center';
      dCtx.fillText('NO SIGNAL', w / 2, h * 0.36 + 20);
      return;
    }

    const speed = player ? Math.hypot(player.vx, player.vy) : 0;
    const speedRatio = clamp(speed / 260, 0, 1);

    const idleBreathY = Math.sin(elapsed * 2.2) * 1.0;
    const engineVibX = Math.sin(elapsed * 31) * (0.35 + speedRatio * 1.15);
    const engineVibY = Math.cos(elapsed * 27) * (0.3 + speedRatio * 1.05);
    const steerRoll = driverCam.steerSmooth * 0.042;
    const steerShiftX = driverCam.steerSmooth * 3.0;

    let sipTilt = 0;
    let sipBobY = 0;
    if (driverCam.canteenTimer > 0 && driverCam.curFrame === DRV.CANTEEN) {
      const p = clamp((driverCam.canteenDur - driverCam.canteenTimer - 0.36) / Math.max(0.2, driverCam.canteenDur - 0.72), 0, 1);
      const wave = Math.sin(p * Math.PI);
      sipTilt = -0.042 * wave;
      sipBobY = -1.6 * wave + Math.sin(p * Math.PI * 4) * 0.7;
    }

    dCtx.save();
    dCtx.translate(w / 2 + engineVibX + steerShiftX + driverCam.joltX, h / 2 + idleBreathY + engineVibY + sipBobY + driverCam.joltY);
    dCtx.rotate(steerRoll + sipTilt);
    dCtx.translate(-w / 2, -h / 2);

    if (driverSheetReady) {
      if (driverCam.blend < 1) {
        drawDriverFrame(dCtx, driverCam.prevFrame, w, 1);
        drawDriverFrame(dCtx, driverCam.curFrame, w, driverCam.blend);
      } else {
        drawDriverFrame(dCtx, driverCam.curFrame, w, 1);
      }
    } else {
      dCtx.fillStyle = '#0a140d';
      dCtx.fillRect(0, 0, w, h);
    }

    const isNeoFrame = driverCam.curFrame === DRV.NEO;
    const goggleCodeIntensity = isNeoFrame
      ? 1.0
      : Math.max(
          driverCam.missionCodeGlow,
          driverCam.codeFlashTimer > 0 ? clamp(driverCam.codeFlashTimer, 0, 0.95) : 0
        );
    const headShiftX = driverCam.curFrame === DRV.LEFT
      ? -0.065
      : driverCam.curFrame === DRV.HALF_LEFT
        ? -0.018
        : driverCam.curFrame === DRV.HALF_RIGHT
          ? 0.032
          : driverCam.curFrame === DRV.RIGHT
            ? 0.065
            : 0;
    if (goggleCodeIntensity > 0.03) {
      renderGoggleMatrixCode(dCtx, w, goggleCodeIntensity, headShiftX);
    }

    if (driverCam.canteenTimer > 0 || driverCam.persona === 'vault') {
      const pulse = 0.2 + Math.sin(elapsed * 5) * 0.06;
      const gVault = dCtx.createRadialGradient(w * 0.5, h * 0.95, 8, w * 0.5, h * 0.72, w * 0.78);
      gVault.addColorStop(0, `rgba(255, 184, 77, ${driverCam.canteenTimer > 0 ? pulse + 0.16 : pulse})`);
      gVault.addColorStop(1, 'rgba(255, 184, 77, 0)');
      dCtx.save();
      dCtx.globalCompositeOperation = 'screen';
      dCtx.fillStyle = gVault;
      dCtx.fillRect(0, 0, w, h);
      dCtx.restore();
    }

    const flashStr = Math.max(driverCam.muzzleFlash, driverCam.explosionFlash);
    if (flashStr > 0.03) {
      const useExpl = driverCam.explosionFlash >= driverCam.muzzleFlash;
      const fx = w * (0.5 + (useExpl ? 0 : driverCam.muzzleSide * 0.34));
      const fy = h * (useExpl ? 0.35 : 0.42);
      const isGreen = (useExpl ? driverCam.explosionColor : driverCam.muzzleColor).startsWith('#39') ||
                      (useExpl ? driverCam.explosionColor : driverCam.muzzleColor).startsWith('#4c');
      const rgb = isGreen ? '76, 255, 156' : '255, 178, 72';

      dCtx.save();
      dCtx.globalCompositeOperation = 'screen';
      const mg = dCtx.createRadialGradient(fx, fy, 4, fx, fy, w * 0.95);
      mg.addColorStop(0, `rgba(255, 244, 210, ${flashStr * 0.58})`);
      mg.addColorStop(0.32, `rgba(${rgb}, ${flashStr * 0.48})`);
      mg.addColorStop(1, `rgba(${rgb}, 0)`);
      dCtx.fillStyle = mg;
      dCtx.fillRect(0, 0, w, h);
      dCtx.restore();
    }

    if (isNeoFrame || driverCam.codeFlashTimer > 0.35) {
      const edgeAlpha = isNeoFrame ? 0.42 : Math.min(0.28, (driverCam.codeFlashTimer - 0.35) * 0.35);
      dCtx.save();
      dCtx.font = 'bold 9px monospace';
      for (let i = 0; i < 6; i++) {
        const col = goggleCodeCols[i * 2];
        const x = i < 3 ? 6 + i * 9 : w - 8 - (i - 3) * 9;
        const y = (col.y * 3.1) % (h + 24);
        const ch = CABIN_GLYPHS[(col.seed + Math.floor(elapsed * 10)) % CABIN_GLYPHS.length];
        dCtx.fillStyle = `rgba(57, 255, 136, ${edgeAlpha})`;
        dCtx.fillText(ch, x, y);
      }
      dCtx.restore();
    }

    dCtx.restore();

    if (driverCam.glitchSliceTimer > 0) {
      const slices = 3;
      for (let s = 0; s < slices; s++) {
        const sy = Math.floor(Math.random() * (h - 14));
        const sh = 4 + Math.floor(Math.random() * 10);
        const dx = (Math.random() - 0.5) * 14;
        dCtx.drawImage(canvasEl, 0, sy, w, sh, dx, sy, w, sh);
        dCtx.fillStyle = driverCam.persona === 'neo'
          ? 'rgba(57, 255, 136, 0.18)'
          : 'rgba(255, 184, 77, 0.14)';
        dCtx.fillRect(0, sy, w, 2);
      }
    }

    if (player && player.rad >= 35) {
      const radNoise = Math.floor(((player.rad - 30) / 70) * 34);
      dCtx.fillStyle = 'rgba(255, 198, 92, 0.55)';
      for (let n = 0; n < radNoise; n++) {
        dCtx.fillRect(Math.random() * w, Math.random() * h, 2, 1.5);
      }
    }

    if (driverCam.damageFlash > 0.03) {
      dCtx.strokeStyle = `rgba(255, 65, 82, ${driverCam.damageFlash * 0.85})`;
      dCtx.lineWidth = 7;
      dCtx.strokeRect(2, 2, w - 4, h - 4);
    }

    dCtx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    for (let y = 0; y < h; y += 3) {
      dCtx.fillRect(0, y, w, 1);
    }
    const vig = dCtx.createRadialGradient(w / 2, h / 2, w * 0.36, w / 2, h / 2, w * 0.72);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(2, 6, 4, 0.58)');
    dCtx.fillStyle = vig;
    dCtx.fillRect(0, 0, w, h);

    dCtx.strokeStyle = driverCam.persona === 'neo'
      ? 'rgba(57, 255, 136, 0.65)'
      : driverCam.persona === 'vault'
        ? 'rgba(255, 184, 77, 0.65)'
        : 'rgba(156, 230, 184, 0.35)';
    dCtx.lineWidth = 1.2;
    const cLen = 8;
    dCtx.beginPath();
    dCtx.moveTo(5, 5 + cLen); dCtx.lineTo(5, 5); dCtx.lineTo(5 + cLen, 5);
    dCtx.moveTo(w - 5 - cLen, 5); dCtx.lineTo(w - 5, 5); dCtx.lineTo(w - 5, 5 + cLen);
    dCtx.moveTo(5, h - 5 - cLen); dCtx.lineTo(5, h - 5); dCtx.lineTo(5 + cLen, h - 5);
    dCtx.moveTo(w - 5 - cLen, h - 5); dCtx.lineTo(w - 5, h - 5); dCtx.lineTo(w - 5, h - 5 - cLen);
    dCtx.stroke();
  }

  function renderDriverCam() {
    if (driverCtx && el.cabinPanel && el.cabinPanel.offsetParent !== null) {
      renderDriverPortraitTo(driverCtx, el.driverCam);
      renderDriverEcg();
    }
    if (mobileDriverCtx && el.mobileCabinWrap && prefs.mobileCam && el.mobileCabinWrap.offsetParent !== null) {
      renderDriverPortraitTo(mobileDriverCtx, el.mobileDriverCam);
      el.mobileCabinWrap.classList.toggle('hurt', driverCam.damageFlash > 0.08 || driverCam.hurtTimer > 0.1);
      el.mobileCabinWrap.classList.toggle('matrix', matrixActive || driverCam.persona === 'neo');
      if (el.mobileCabinDot) {
        el.mobileCabinDot.style.background = driverCam.hurtTimer > 0.1
          ? '#ff4d5a'
          : (matrixActive || driverCam.persona === 'neo' ? '#38e8ff' : '#39ff88');
      }
    }
  }

  function renderDriverEcg() {
    if (!ecgCtx || !el.driverEcg) return;
    const ew = el.driverEcg.width;
    const eh = el.driverEcg.height;
    ecgCtx.clearRect(0, 0, ew, eh);

    // Сетка осциллографа
    ecgCtx.strokeStyle = 'rgba(57, 255, 136, 0.1)';
    ecgCtx.lineWidth = 1;
    ecgCtx.beginPath();
    ecgCtx.moveTo(0, eh * 0.5);
    ecgCtx.lineTo(ew, eh * 0.5);
    for (let x = 24; x < ew; x += 24) {
      ecgCtx.moveTo(x, 0);
      ecgCtx.lineTo(x, eh);
    }
    ecgCtx.stroke();

    // Цвет линии пульса зависит от личности и состояния
    const strokeCol = driverCam.persona === 'dead'
      ? '#ff4d5a'
      : driverCam.persona === 'neo'
        ? '#39ff88'
        : driverCam.persona === 'vault'
          ? '#ffb84d'
          : (driverCam.bpm > 118 ? '#ff7654' : '#4eff9b');

    ecgCtx.strokeStyle = strokeCol;
    ecgCtx.lineWidth = 1.6;
    ecgCtx.beginPath();
    const baseY = eh * 0.58;
    const amp = eh * 0.44;
    for (let i = 0; i < ECG_SAMPLES; i++) {
      const x = (i / (ECG_SAMPLES - 1)) * (ew - 4) + 2;
      const y = baseY - driverCam.ecgBuf[i] * amp;
      if (i === 0) ecgCtx.moveTo(x, y);
      else ecgCtx.lineTo(x, y);
    }
    ecgCtx.stroke();

    // Светящаяся ведущая точка пульса
    const lastY = baseY - driverCam.ecgBuf[ECG_SAMPLES - 1] * amp;
    ecgCtx.fillStyle = '#eafff2';
    ecgCtx.beginPath();
    ecgCtx.arc(ew - 2, lastY, 2.1, 0, Math.PI * 2);
    ecgCtx.fill();
  }

  // ==================== ИНИЦИАЛИЗАЦИЯ МИРА И ИГРОКА ====================
  function capsMultiplier() {
    const secMult = (world && world.sector && world.sector.capsMult) ? world.sector.capsMult : 1.0;
    return secMult * (prefs.hardcore ? 1.35 : 1.0);
  }

  function renderSectorPicker() {
    if (!el.sectorPicker) return;
    el.sectorPicker.innerHTML = SECTORS.map((s) => {
      const unlocked = s.index <= maxSector;
      const active = s.index === currentSector;
      const lockTxt = unlocked ? '' : '🔒 ';
      const multTxt = s.capsMult > 1 ? ` ×${s.capsMult}` : '';
      return `<button class="cfg-pill ${active ? 'active' : ''}" type="button" data-sector="${s.index}" ${unlocked ? '' : 'disabled'} title="${escapeHtml(s.desc)}">${lockTxt}${escapeHtml(s.shortName)}${multTxt}</button>`;
    }).join('');
    el.sectorPicker.querySelectorAll('button[data-sector]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.sector);
        if (Number.isNaN(idx) || idx > maxSector) return;
        AudioFX.unlock();
        if (AudioFX.uiClick) AudioFX.uiClick();
        currentSector = idx;
        runSeed = (runSeed + 17 + Math.floor(Math.random() * 97)) % 10000;
        world = WorldMod.createWorld(currentSector, runSeed);
        resetRun(false, currentSector);
        renderSectorPicker();
      });
    });
  }

  function updateNextSectorButton() {
    if (!el.btnNextSector) return;
    if (gameState !== 'playing' || !sectorReadyNext) {
      el.btnNextSector.classList.add('hidden');
      return;
    }
    const nextIdx = (currentSector + 1) % SECTORS.length;
    const nextSec = SECTORS[nextIdx];
    el.btnNextSector.textContent = currentSector < SECTORS.length - 1
      ? `▶ В СЕКТОР ${nextSec.code} · ${nextSec.shortName} [N]`
      : `▶ НОВЫЙ ВИТОК · СЕКТОР ${nextSec.code} [N]`;
    el.btnNextSector.classList.remove('hidden');
  }

  function advanceToNextSector() {
    if (!player || !sectorReadyNext) return;
    const nextIdx = (currentSector + 1) % SECTORS.length;
    currentSector = nextIdx;
    maxSector = Math.max(maxSector, currentSector);
    sectorContracts = 0;
    sectorReadyNext = false;
    runSeed = (runSeed + 31 + Math.floor(Math.random() * 113)) % 10000;
    world = WorldMod.createWorld(currentSector, runSeed);

    // Переносим игрока в Бункер-Депо нового сектора с сохранением всего прогресса заезда
    player.x = world.depot.x;
    player.y = world.depot.y + 82;
    player.vx = 0;
    player.vy = 0;
    player.ang = -Math.PI / 2;
    player.turretAng = -Math.PI / 2;
    player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.35));
    player.rad = Math.max(0, player.rad - 45);
    player.inDepot = true;
    cam.x = player.x;
    cam.y = player.y;

    enemies = [];
    bullets = [];
    loot = [];
    particles = [];
    skidmarks = [];
    ghosts = [];
    lightFlashes = [];
    enemySpawnTimer = 1.2;
    glitchTimer = 0.35;

    for (let i = 0; i < 18; i++) spawnLoot();
    const initCount = prefs.hardcore ? 7 : 6;
    for (let i = 0; i < initCount; i++) {
      if (i === 0 && currentSector >= 2) spawnEnemy('agent');
      else if (i === 1 && currentSector >= 1) spawnEnemy('heavy');
      else spawnEnemy('raider');
    }

    const secBonus = Math.round(45 * capsMultiplier());
    player.caps += secBonus;
    player.score += secBonus * 5;
    AudioFX.missionDone();
    driverAwakenNeo(2.2, `Сектор ${world.sector.code}: ${world.sector.name}. Поехали!`);
    addFloatText(player.x, player.y - 30, `СЕКТОР ${world.sector.code} +${secBonus} ₵`, '#38e8ff');
    addLog(`ПРОРЫВ В СЕКТОР ${world.sector.code} · ${world.sector.name} (лут ×${world.sector.capsMult})!`, 'matrix');
    pickNextMission(false);
    saveProgress();
    renderSectorPicker();
    updateNextSectorButton();
    renderGarage();
    syncUI(true);
  }

  function spawnAmbushWave(count, reason) {
    if (!player) return;
    const n = Math.max(1, count + (prefs.hardcore ? 1 : 0));
    const threat = getThreatLevel();
    for (let i = 0; i < n; i++) {
      let kind = 'raider';
      if (i === 0 && (threat >= 2 || currentSector >= 1)) kind = 'agent';
      else if (i === 1 && threat >= 2) kind = 'heavy';
      spawnEnemy(kind, threat);
    }
    if (reason) {
      addLog(`⚠ ЗАСАДА! ${reason}`, 'danger');
      addFloatText(player.x, player.y - 34, '⚠ ЗАСАДА СИСТЕМЫ!', '#ff4d5a');
      haptic([24, 30, 24]);
    }
  }

  function resetRun(forceFresh, forcedSectorIdx) {
    const saved = forceFresh ? defaultProgress() : loadSavedProgress();
    bestScore = Math.max(bestScore, saved.bestScore || 0);
    maxSector = clamp(saved.maxSector || 0, 0, SECTORS.length - 1);
    if (typeof forcedSectorIdx === 'number') {
      currentSector = clamp(forcedSectorIdx, 0, maxSector);
    } else if (forceFresh) {
      currentSector = 0;
    } else {
      currentSector = clamp(saved.currentSector || 0, 0, maxSector);
    }
    sectorContracts = 0;
    sectorReadyNext = false;
    runSeed = (runSeed + 19 + Math.floor(Math.random() * 89)) % 10000;
    world = WorldMod.createWorld(currentSector, runSeed);

    player = {
      x: world.depot.x,
      y: world.depot.y + 82,
      vx: 0,
      vy: 0,
      ang: -Math.PI / 2,
      turretAng: -Math.PI / 2,
      hp: 100,
      maxHp: 100,
      focus: 100,
      maxFocus: 100,
      rad: 0,
      ammo: 70,
      caps: saved.caps,
      score: 0,
      kills: 0,
      missionsDone: 0,
      totalKills: saved.totalKills || 0,
      totalMissions: saved.totalMissions || 0,
      trace: 0, // 0..5
      carClass: saved.carClass,
      engineLvl: saved.engineLvl,
      weaponLvl: saved.weaponLvl,
      missileLvl: saved.missileLvl,
      armorLvl: saved.armorLvl,
      matrixLvl: saved.matrixLvl,
      shootCd: 0,
      missileCd: 0,
      inDepot: true
    };

    const spec = getCarSpec();
    player.maxHp = spec.maxHp;
    player.hp = spec.maxHp;
    player.maxFocus = spec.maxFocus;
    player.focus = spec.maxFocus;
    player.ammo = spec.ammoStart;

    enemies = [];
    bullets = [];
    loot = [];
    particles = [];
    skidmarks = [];
    ghosts = [];
    floatTexts = [];
    lightFlashes = [];
    logs = [];
    enemySpawnTimer = 1.2;
    traceDecayTimer = 0;
    touchMatrixToggle = false;
    if (matrixActive) AudioFX.matrix(false);
    matrixActive = false;
    matrixBreach = 0;
    glitchTimer = 0;
    shakeAmt = 0;

    cam.x = player.x;
    cam.y = player.y;

    for (let i = 0; i < 18; i++) spawnLoot();
    const pwr = getPlayerPower();
    const initEnemies = prefs.hardcore ? 7 : 6;
    for (let i = 0; i < initEnemies; i++) {
      if (i === 4 && (pwr >= 3 || currentSector >= 1)) spawnEnemy('heavy');
      else if (i === 3 && (pwr >= 5 || currentSector >= 2)) spawnEnemy('agent');
      else spawnEnemy('raider');
    }

    pickNextMission(true);
    driverReset();
    const hasSavedUpgrades = saved.carClass > 0 || saved.engineLvl > 1 || saved.weaponLvl > 1 ||
      saved.missileLvl > 0 || saved.armorLvl > 1 || saved.matrixLvl > 1 || saved.caps !== 25;
    addLog(
      hasSavedUpgrades && !forceFresh
        ? `Профиль загружен: ${spec.name} (${spec.rank}) · ${player.caps} ₵.`
        : 'Терминал Vault-OS синхронизирован.',
      'matrix'
    );
    const modeTag = prefs.hardcore ? ' [ХАРДКОР +35% ₵]' : '';
    addLog(`Сектор ${world.sector.code} · ${world.sector.name}${modeTag}.`, '');
    saveProgress();
    renderSectorPicker();
    updateNextSectorButton();
    renderGarage();
    syncUI(true);
  }

  const ROMAN_TIERS = ['I', 'II', 'III', 'IV', 'V'];

  function getPlayerPower() {
    if (!player) return 0;
    return (
      player.carClass * 2.2 +
      (player.engineLvl - 1) * 0.6 +
      (player.weaponLvl - 1) * 1.1 +
      (player.missileLvl || 0) * 1.25 +
      (player.armorLvl - 1) * 0.9 +
      (player.matrixLvl - 1) * 0.55
    );
  }

  // Уровень угрозы мира (1..5): растёт с апгрейдами, сектором и режимом Хардкор
  function getThreatLevel() {
    if (!player) return 1;
    const pwr = getPlayerPower();
    const byPower = 1 + Math.floor(pwr / 4.6);
    const byClass = player.carClass + 1;
    const secBonus = (world && world.sector && world.sector.threatBonus) ? world.sector.threatBonus : 0;
    const hcBonus = prefs.hardcore ? 1 : 0;
    return clamp(Math.max(byClass, byPower) + secBonus + hcBonus, 1, 5);
  }

  function getCarSpec() {
    const base = CAR_CLASSES[player.carClass] || CAR_CLASSES[0];
    const mLvl = player.missileLvl || 0;
    const armorBonusRam = player.armorLvl >= 3 ? 0.075 : (player.armorLvl >= 2 ? 0.025 : 0);
    return {
      ...base,
      maxHp: base.maxHp + (player.armorLvl - 1) * 40,
      maxSpeed: base.maxSpeed + (player.engineLvl - 1) * 32,
      accel: base.accel + (player.engineLvl - 1) * 65,
      turn: base.turn + (player.engineLvl - 1) * 0.15,
      fireDelay: Math.max(0.095, 0.22 - (player.weaponLvl - 1) * 0.032),
      damage: 18 + (player.weaponLvl - 1) * 7 + player.carClass * 2,
      missileCd: mLvl === 0 ? 99 : Math.max(1.65, 3.6 - mLvl * 0.65),
      missileDmg: 54 + mLvl * 16 + player.carClass * 8,
      missileSalvo: mLvl >= 3 ? 2 : (mLvl >= 1 ? 1 : 0),
      ramMult: base.ramMult + armorBonusRam,
      ramSelfMult: Math.max(0.025, 0.068 - player.carClass * 0.008 - (player.armorLvl - 1) * 0.007),
      maxFocus: 100 + (player.matrixLvl - 1) * 30,
      focusDrain: Math.max(13, 28 - (player.matrixLvl - 1) * 4),
      focusRegen: 14 + (player.matrixLvl - 1) * 3.5
    };
  }

  // ==================== МИССИИ ====================
  function pickNextMission(isFirst) {
    const types = isFirst ? ['collect'] : ['collect', 'hunt', 'hack', 'survive'];
    const type = types[Math.floor(Math.random() * types.length)];
    const tier = 1 + Math.floor(player.missionsDone / 2);
    const classBonus = player.carClass * 16;
    const mult = capsMultiplier();

    if (type === 'collect') {
      const goal = Math.min(5, 2 + tier);
      mission = {
        type: 'collect',
        stage: 'gather', // gather -> return
        title: 'Сбор припасов пустоши',
        desc: `Соберите ${goal} контейнера лута и доставьте данные в Бункер-Депо.`,
        progress: 0,
        goal,
        reward: Math.round((50 + tier * 20 + classBonus) * mult)
      };
    } else if (type === 'hunt') {
      const goal = Math.min(7, 3 + Math.floor((tier + player.carClass) / 2));
      mission = {
        type: 'hunt',
        title: 'Зачистка сектора',
        desc: `Уничтожьте ${goal} вражеских машин (рейдеров, броневики или Агентов).`,
        progress: 0,
        goal,
        reward: Math.round((65 + tier * 25 + classBonus) * mult)
      };
    } else if (type === 'hack') {
      const term = world.terminals[Math.floor(Math.random() * world.terminals.length)];
      mission = {
        type: 'hack',
        title: `Взлом: ${term.name}`,
        desc: `Прибудьте к зелёному терминалу (${term.name}) и удерживайте позицию 5.5 сек.`,
        target: { x: term.x, y: term.y, name: term.name, radius: 74 },
        ambushTriggered: false,
        progress: 0,
        goal: 5.5,
        reward: Math.round((80 + tier * 25 + classBonus) * mult)
      };
    } else {
      const goal = 18 + tier * 3;
      mission = {
        type: 'survive',
        title: 'Уход от Следа Системы',
        desc: `Выживите под преследованием Системы в течение ${goal} сек.`,
        progress: 0,
        goal,
        reward: Math.round((75 + tier * 25 + classBonus) * mult)
      };
      player.trace = Math.max(player.trace, 3);
      spawnAmbushWave(2, 'Перехватчики Системы вышли на след!');
    }
    addLog(`Контракт: ${mission.title}`, 'warn');
  }

  function completeMission() {
    if (!mission) return;
    const prevType = mission.type;
    const reward = mission.reward;
    player.caps += reward;
    player.score += reward * 4;
    player.missionsDone++;
    player.totalMissions = (player.totalMissions || 0) + 1;
    player.hp = Math.min(player.maxHp, player.hp + 20);
    player.focus = player.maxFocus;
    player.trace = Math.max(0, player.trace - 1);
    AudioFX.missionDone();
    if (prevType === 'hack' || prevType === 'survive') {
      driverAwakenNeo(2.6, pickQuote(DRIVER_QUOTES.neo));
    } else {
      driverDrinkCanteen(pickQuote(DRIVER_QUOTES.mission));
    }
    addFloatText(player.x, player.y - 26, `КОНТРАКТ +${reward} ₵`, '#ffb84d');
    addLog(`Контракт выполнен! Получено +${reward} ₵ и +20 HP.`, 'matrix');

    // Прогресс переходов между секторами-биомами (каждые 2 контракта!)
    sectorContracts++;
    if (sectorContracts >= 2 && !sectorReadyNext) {
      sectorReadyNext = true;
      const nextIdx = Math.min(SECTORS.length - 1, currentSector + 1);
      if (nextIdx > maxSector) {
        maxSector = nextIdx;
        addLog(`ОТКРЫТ НОВЫЙ БИОМ: СЕКТОР ${SECTORS[nextIdx].code} · ${SECTORS[nextIdx].name}! Нажмите [N] или кнопку сверху.`, 'matrix');
      } else {
        addLog('Контур сектора пройден! Можно перейти в следующий сектор кнопкой сверху или [N].', 'matrix');
      }
      renderSectorPicker();
      updateNextSectorButton();
    }

    updateBestScore();
    saveProgress();
    renderGarage();
    pickNextMission(false);
  }

  function updateBestScore() {
    if (player.score > bestScore) {
      bestScore = Math.floor(player.score);
      try { localStorage.setItem('gta0_best_score', String(bestScore)); } catch { /* ignore */ }
    }
  }

  // ==================== СПАВН ЛУТА И ВРАГОВ ====================
  function spawnLoot(pos, forcedType) {
    let p = pos;
    let type = forcedType;
    if (!p) {
      // 25% шанс заспавнить ценный лут в радиационном кратере
      if (Math.random() < 0.25) {
        const z = world.radZones[Math.floor(Math.random() * world.radZones.length)];
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * (z.radius * 0.65);
        p = { x: z.x + Math.cos(a) * r, y: z.y + Math.sin(a) * r };
        type = type || (Math.random() < 0.5 ? 'module' : 'focus');
      } else {
        p = world.pickRoadSpawn(player, 180);
      }
    }
    if (!type) type = LOOT_POOL[Math.floor(Math.random() * LOOT_POOL.length)];
    loot.push({ id: nextEntId++, x: p.x, y: p.y, type, pulse: Math.random() * Math.PI * 2 });
  }

  function spawnEnemy(kind, forcedTier) {
    const p = world.pickRoadSpawn(player, 410);
    const pwr = getPlayerPower();
    const threat = getThreatLevel();
    const m = player.missionsDone;
    const k = kind || 'raider';
    const hc = prefs.hardcore;
    const hpMult = hc ? 1.24 : 1.08;
    const dmgMult = hc ? 1.28 : 1.12;
    const cdMult = hc ? 0.78 : 0.88;
    const spdMult = hc ? 1.12 : 1.04;
    const bountyMult = capsMultiplier();

    // Тир врага (1..5): следует за уровнем угрозы игрока и сектора
    let tier = forcedTier
      ? clamp(forcedTier, 1, 5)
      : (threat >= 3 && Math.random() < 0.22 ? threat - 1 : threat);
    const t = tier - 1; // 0..4

    let cfg;
    if (k === 'boss') {
      const hpTable = [300, 390, 520, 690, 890];
      cfg = {
        hp: Math.round((hpTable[t] + pwr * 8.0 + m * 8) * hpMult),
        len: 52 + t * 1.5, wid: 26 + t * 0.6,
        speed: (182 + t * 14 + Math.min(20, pwr)) * spdMult,
        dmg: Math.round((15 + t * 3.2 + pwr * 0.22) * dmgMult),
        fireCd: Math.max(0.72, (1.28 - t * 0.08) * cdMult),
        aggro: 820,
        range: 460,
        bounty: Math.round((78 + t * 24 + Math.round(pwr * 1.2)) * bountyMult),
        score: Math.round((440 + t * 115) * (hc ? 1.35 : 1.0))
      };
    } else if (k === 'agent') {
      const hpTable = [118, 180, 255, 340, 435];
      cfg = {
        hp: Math.round((hpTable[t] + pwr * 4.8 + m * 4.5) * hpMult),
        len: 39 + t * 0.8, wid: 20 + t * 0.4,
        speed: (234 + t * 15 + Math.min(22, pwr * 1.15)) * spdMult,
        dmg: Math.round((12 + t * 2.6 + pwr * 0.2) * dmgMult),
        fireCd: Math.max(0.48, (0.94 - t * 0.08) * cdMult),
        aggro: 840,
        range: 435,
        bounty: Math.round((36 + t * 12 + Math.round(pwr * 0.8)) * bountyMult),
        score: Math.round((220 + t * 58) * (hc ? 1.35 : 1.0))
      };
    } else if (k === 'heavy') {
      const hpTable = [132, 208, 290, 390, 495];
      cfg = {
        hp: Math.round((hpTable[t] + pwr * 5.2 + m * 4.5) * hpMult),
        len: 44 + t * 1.1, wid: 23 + t * 0.5,
        speed: (164 + t * 11 + Math.min(18, pwr * 0.95)) * spdMult,
        dmg: Math.round((11 + t * 2.4 + pwr * 0.2) * dmgMult),
        fireCd: Math.max(0.74, (1.24 - t * 0.08) * cdMult),
        aggro: 620,
        range: 390,
        bounty: Math.round((32 + t * 11 + Math.round(pwr * 0.7)) * bountyMult),
        score: Math.round((175 + t * 48) * (hc ? 1.35 : 1.0))
      };
    } else {
      const hpTable = [68, 118, 170, 230, 295];
      cfg = {
        hp: Math.round((hpTable[t] + pwr * 3.2 + m * 3.2) * hpMult),
        len: 34 + t * 0.9, wid: 19 + t * 0.4,
        speed: (184 + t * 14 + Math.min(20, pwr)) * spdMult,
        dmg: Math.round((9.5 + t * 2.1 + pwr * 0.17) * dmgMult),
        fireCd: Math.max(0.72, (1.32 - t * 0.1) * cdMult),
        aggro: 560 + t * 30,
        range: 345 + t * 20,
        bounty: Math.round((19 + t * 7 + Math.round(pwr * 0.4)) * bountyMult),
        score: Math.round((110 + t * 32) * (hc ? 1.35 : 1.0))
      };
    }

    enemies.push({
      id: nextEntId++,
      kind: k,
      tier,
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
      ang: Math.random() * Math.PI * 2,
      hp: cfg.hp,
      maxHp: cfg.hp,
      len: cfg.len,
      wid: cfg.wid,
      speed: cfg.speed,
      dmg: cfg.dmg,
      fireCd: cfg.fireCd,
      aggro: cfg.aggro,
      range: cfg.range,
      bounty: cfg.bounty,
      score: cfg.score,
      shootCd: 0.45 + Math.random() * 0.65,
      missileCd: 3.0 + Math.random() * 1.5,
      ramCd: 0,
      flankSide: Math.random() < 0.5 ? -1 : 1,
      flankTimer: 2.5 + Math.random() * 3.5,
      wanderAng: Math.random() * Math.PI * 2,
      wanderTimer: 1 + Math.random() * 2
    });
  }

  function refreshFarEnemies(announce) {
    if (!player) return;
    const threat = getThreatLevel();
    // Заменяем устаревших дальних врагов на новые отряды под текущий уровень угрозы игрока
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if ((e.tier || 1) < threat && dist(e, player) > 520) {
        enemies.splice(i, 1);
      }
    }
    if (announce && threat >= 2) {
      addLog(`⚠ СИСТЕМА АДАПТИРУЕТСЯ: усиленные отряды MK-${ROMAN_TIERS[threat - 1]} вошли в сектор!`, 'danger');
    }
  }

  function findNearestEnemy(x, y, maxRange, preferAng) {
    let best = null;
    let bestScore = Infinity;
    for (const e of enemies) {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d > maxRange) continue;
      let sc = d;
      if (typeof preferAng === 'number') {
        const angDiff = Math.abs(normAngle(Math.atan2(e.y - y, e.x - x) - preferAng));
        sc *= (0.72 + angDiff * 0.55);
      }
      if (sc < bestScore) { bestScore = sc; best = e; }
    }
    return best;
  }

  function fireHomingMissile(x, y, ang, dmg, target, owner) {
    const isEnemy = owner === 'enemy';
    const speed = isEnemy ? 275 : 380;
    bullets.push({
      owner: isEnemy ? 'enemy' : 'player',
      homing: true,
      targetId: (!isEnemy && target) ? target.id : null,
      x, y,
      ang,
      speed,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      dmg,
      splashRadius: isEnemy ? 46 : 64,
      color: isEnemy ? '#ff384c' : '#ff7a2f',
      radius: isEnemy ? 4.6 : 5.0,
      life: isEnemy ? 2.8 : 2.55,
      smokeCd: 0
    });
    addLightFlash(x, y, 165, isEnemy ? '#ff384c' : '#ff8e3c', 0.14);
  }

  function detonateMissile(b) {
    AudioFX.explode(true, b.owner === 'enemy');
    shakeAmt = Math.min(11, shakeAmt + 4.5);
    addLightFlash(b.x, b.y, 210, b.owner === 'enemy' ? '#ff384c' : '#ff8a36', 0.28);
    spawnBurst(b.x, b.y, '#ffbe4f', 14, 190);
    spawnBurst(b.x, b.y, '#ff4d36', 10, 145);
    spawnBurst(b.x, b.y, '#8fa396', 6, 85);

    const rad = b.splashRadius || 64;
    if (b.owner === 'enemy') {
      if (player && Math.hypot(b.x - player.x, b.y - player.y) < rad + 18) {
        damagePlayer(b.dmg, false);
      }
      return;
    }
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const d = Math.hypot(b.x - e.x, b.y - e.y);
      if (d < rad + e.len * 0.45) {
        const falloff = d < 28 ? 1 : clamp(1 - (d - 28) / (rad + 20), 0.35, 1);
        e.hp -= b.dmg * falloff;
        if (e.hp <= 0) destroyEnemy(j);
      }
    }
  }

  // ==================== СТРЕЛЬБА И ЭФФЕКТЫ ====================
  function addLightFlash(x, y, radius, color, life) {
    lightFlashes.push({ x, y, radius, color, life, maxLife: life });
    if (lightFlashes.length > 24) lightFlashes.shift();
  }

  function fireBullet(owner, x, y, ang, speed, dmg, color, radius) {
    bullets.push({
      owner,
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      dmg,
      color,
      radius: radius || 3.5,
      life: 1.35
    });
    addLightFlash(x, y, 125, color, 0.08);
  }

  function spawnBurst(x, y, color, count, speedMax) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 25 + Math.random() * (speedMax || 150);
      particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        size: 2 + Math.random() * 4,
        color,
        life: 0.25 + Math.random() * 0.4,
        maxLife: 0.65
      });
    }
  }

  function explodeVehicle(x, y, isAgent, isBig) {
    AudioFX.explode(!!isBig, !!isAgent);
    haptic(isBig ? [35, 25, 45] : 22);
    shakeAmt = Math.min(14, shakeAmt + (isBig ? 10 : 8));
    driverOnExplosion(x, y, isAgent);
    addLightFlash(x, y, 280, isAgent ? '#39ff88' : '#ff9436', 0.42);
    spawnBurst(x, y, '#ffb84d', 18, 220);
    spawnBurst(x, y, isAgent ? '#39ff88' : '#ff4d5a', 14, 170);
    spawnBurst(x, y, '#8aa090', 8, 90);
  }

  // ==================== ГАРАЖ И ДЕПО ====================
  const DEPOT_SERVICE_COST = 25;

  function depotService() {
    if (!player || gameState !== 'playing') return;
    if (!player.inDepot) {
      addLog('Подъедьте к центру Бункера-Депо для сервиса.', 'warn');
      return;
    }
    const emergencyFree = player.caps < DEPOT_SERVICE_COST && player.hp < player.maxHp * 0.55;
    const cost = emergencyFree ? 0 : DEPOT_SERVICE_COST;
    if (player.caps < cost) {
      addLog(`Недостаточно крышек (нужно ${DEPOT_SERVICE_COST} ₵).`, 'warn');
      return;
    }
    const spec = getCarSpec();
    player.caps -= cost;
    player.hp = emergencyFree
      ? Math.max(player.hp, Math.round(player.maxHp * 0.55))
      : player.maxHp;
    player.rad = 0;
    player.ammo = Math.max(player.ammo + (emergencyFree ? 22 : 35), spec.ammoStart);
    player.trace = Math.max(0, player.trace - 1);
    AudioFX.upgrade();
    driverDrinkCanteen(pickQuote(DRIVER_QUOTES.depot));
    addFloatText(player.x, player.y - 24, emergencyFree ? 'ЛАТКА КОРПУСА (55% HP)' : 'РЕМОНТ + АНТИРАД', '#39ff88');
    addLog(
      emergencyFree
        ? 'Бункер-Депо: аварийная латка до 55% HP и снятие радиации (бесплатно).'
        : 'Бункер-Депо: корпус полностью восстановлен, радиация снята, боезапас пополнен.',
      'matrix'
    );
    saveProgress();
    renderGarage();
    syncUI(true);
  }

  function renderLevelPips(cur, max, amber) {
    let html = '<span class="upg-pips">';
    for (let i = 1; i <= max; i++) {
      html += `<i class="upg-pip ${i <= cur ? (amber ? 'on amber' : 'on') : ''}"></i>`;
    }
    html += '</span>';
    return html;
  }

  function getUpgradesDef() {
    const curClass = CAR_CLASSES[player.carClass];
    const nextClass = CAR_CLASSES[player.carClass + 1];
    const mLvl = player.missileLvl || 0;

    const weaponHints = [
      'Ур.2: Сдвоенный тяжёлый пулемёт на крыше (2 ствола).',
      'Ур.3: Сдвоенная плазменная автопушка (изумрудные залпы).',
      'Ур.4: Три-плазменный комплекс — макс. урон и темп огня.',
      'Установлен топовый три-плазменный комплекс.'
    ];
    const missileHints = [
      'Монтирует ракетный блок на крышу: самонаводящиеся ракеты!',
      'Ур.2: Двойные пусковые блоки по бокам, быстрая перезарядка.',
      'Ур.3: Двойной залп — сразу 2 самонаводящиеся ракеты + сплеш!',
      'Установлены двойные блоки самонаводящихся ракет.'
    ];
    const armorHints = [
      'Ур.2: Бронеюбки по бортам (+40 HP, меньше урон тарана).',
      'Ур.3: Шипастый таранный отвал спереди (+40 HP и мощный таран!).',
      'Ур.4: Каркас стекла + реактивный контур (+40 HP, топ-защита).',
      'Установлена полная пустошная броня и шипастый таран.'
    ];
    const engineHints = [
      'Ур.2: Боковые выхлопные трубы (+32 км/ч и быстрый разгон).',
      'Ур.3: Хромированный нагнетатель V8 на капоте (+32 км/ч).',
      'Ур.4: Нитро-сопла с плазменным форсажем сзади (+32 км/ч).',
      'Установлен максимальный турбо-нитро блок V8.'
    ];
    const matrixHints = [
      'Ур.2: Изумрудные решётки охлаждения, больше Фокуса.',
      'Ур.3: Светящийся реактор Перегрузки + неон под днищем.',
      'Ур.4: Полный нейроконтур — быстрая регенерация слоу-мо.',
      'Ядро Перегрузки работает на пиковой синхронизации.'
    ];

    return [
      {
        id: 'car',
        featured: true,
        name: nextClass ? `Кузов: ${nextClass.name}` : `Топ: ${curClass.name}`,
        cur: player.carClass + 1,
        max: CAR_CLASSES.length,
        amberPips: true,
        lvl: `${player.carClass + 1}/${CAR_CLASSES.length}`,
        maxed: !nextClass,
        cost: nextClass ? nextClass.cost : 0,
        desc: nextClass
          ? `${nextClass.rank}: ${nextClass.maxHp} HP, ${nextClass.maxSpeed} скр., новый корпус и фото.`
          : 'Открыт финальный класс V — CYBER PHANTOM!',
        apply() {
          player.carClass++;
          const sp = getCarSpec();
          player.maxHp = sp.maxHp;
          player.hp = sp.maxHp;
          player.ammo = Math.max(player.ammo, sp.ammoStart);
        }
      },
      {
        id: 'weapon',
        name: 'Вооружение турели',
        cur: player.weaponLvl,
        max: 4,
        lvl: `${player.weaponLvl}/4`,
        maxed: player.weaponLvl >= 4,
        cost: 45 + (player.weaponLvl - 1) * 55,
        desc: weaponHints[Math.min(player.weaponLvl - 1, 3)],
        apply() { player.weaponLvl++; }
      },
      {
        id: 'missile',
        name: 'Ракеты самонавед.',
        cur: mLvl,
        max: 3,
        amberPips: true,
        lvl: mLvl === 0 ? '0/3' : `${mLvl}/3`,
        maxed: mLvl >= 3,
        cost: mLvl === 0 ? 75 : (mLvl === 1 ? 130 : 210),
        desc: missileHints[Math.min(mLvl, 3)],
        apply() {
          player.missileLvl = (player.missileLvl || 0) + 1;
          player.missileCd = 0;
        }
      },
      {
        id: 'armor',
        name: 'Броня и таран',
        cur: player.armorLvl,
        max: 4,
        lvl: `${player.armorLvl}/4`,
        maxed: player.armorLvl >= 4,
        cost: 40 + (player.armorLvl - 1) * 48,
        desc: armorHints[Math.min(player.armorLvl - 1, 3)],
        apply() {
          player.armorLvl++;
          player.maxHp = getCarSpec().maxHp;
          player.hp = Math.min(player.maxHp, player.hp + 40);
        }
      },
      {
        id: 'engine',
        name: 'Турбодвигатель',
        cur: player.engineLvl,
        max: 4,
        lvl: `${player.engineLvl}/4`,
        maxed: player.engineLvl >= 4,
        cost: 38 + (player.engineLvl - 1) * 45,
        desc: engineHints[Math.min(player.engineLvl - 1, 3)],
        apply() { player.engineLvl++; }
      },
      {
        id: 'matrix',
        name: 'Ядро Перегрузки',
        cur: player.matrixLvl,
        max: 4,
        lvl: `${player.matrixLvl}/4`,
        maxed: player.matrixLvl >= 4,
        cost: 45 + (player.matrixLvl - 1) * 50,
        desc: matrixHints[Math.min(player.matrixLvl - 1, 3)],
        apply() {
          player.matrixLvl++;
          player.maxFocus = getCarSpec().maxFocus;
          player.focus = player.maxFocus;
        }
      },
      {
        id: 'kit',
        name: 'Полевой ремкомплект',
        cur: 0,
        max: 0,
        lvl: 'РАСХОД',
        maxed: false,
        cost: 25,
        desc: 'Срочно: +50 HP, -50% радиации и +35 патронов в бою.',
        apply() {
          player.hp = Math.min(player.maxHp, player.hp + 50);
          player.rad = Math.max(0, player.rad - 50);
          player.ammo += 35;
        }
      }
    ];
  }

  function updateGarageShowcase() {
    if (!player) return;
    const cls = CAR_CLASSES[player.carClass] || CAR_CLASSES[0];
    const spec = getCarSpec();
    if (el.garageCarImg && el.garageCarImg.getAttribute('src') !== cls.img) {
      el.garageCarImg.setAttribute('src', cls.img);
      el.garageCarImg.setAttribute('alt', `${cls.name} (${cls.rank})`);
    }
    if (el.garageCarRank) el.garageCarRank.textContent = `${cls.rank} / V`;
    if (el.garageCarName) el.garageCarName.textContent = cls.name;
    if (el.garageCarStats) {
      const mText = player.missileLvl > 0 ? ` · РК ${spec.missileDmg}` : '';
      el.garageCarStats.textContent = `HP ${spec.maxHp} · СКР ${spec.maxSpeed} · УРН ${spec.damage}${mText}`;
    }
    if (el.garageCarMods) {
      const pills = [];
      if (player.weaponLvl === 2) pills.push('<span class="mod-pill amber">2× ПУЛЕМЁТ</span>');
      else if (player.weaponLvl === 3) pills.push('<span class="mod-pill">2× ПЛАЗМА</span>');
      else if (player.weaponLvl >= 4) pills.push('<span class="mod-pill">3× ПЛАЗМА</span>');
      if (player.missileLvl === 1) pills.push('<span class="mod-pill amber">РАКЕТЫ</span>');
      else if (player.missileLvl === 2) pills.push('<span class="mod-pill amber">2× БЛОК РК</span>');
      else if (player.missileLvl >= 3) pills.push('<span class="mod-pill amber">ЗАЛП 2× РК</span>');
      if (player.armorLvl === 2) pills.push('<span class="mod-pill cyan">БРОНЕБОРТА</span>');
      else if (player.armorLvl === 3) pills.push('<span class="mod-pill cyan">ТАРАН</span>');
      else if (player.armorLvl >= 4) pills.push('<span class="mod-pill cyan">ТАРАН + ЩИТ</span>');
      if (player.engineLvl === 2) pills.push('<span class="mod-pill">ВЫХЛОП</span>');
      else if (player.engineLvl === 3) pills.push('<span class="mod-pill">V8 БЛОУЭР</span>');
      else if (player.engineLvl >= 4) pills.push('<span class="mod-pill cyan">НИТРО V8</span>');
      if (player.matrixLvl >= 3) pills.push('<span class="mod-pill">ЯДРО CODE</span>');
      if (pills.length === 0) {
        pills.push('<span class="mod-pill muted">БАЗОВАЯ КОМПЛЕКТАЦИЯ</span>');
      }
      el.garageCarMods.innerHTML = pills.join('');
    }
  }

  function renderGarage() {
    if (!player) return;
    el.uiGarageCaps.textContent = `${player.caps} ₵`;
    updateGarageShowcase();
    const list = getUpgradesDef();
    el.garageList.innerHTML = '';
    for (const u of list) {
      const card = document.createElement('div');
      card.className = `upg-card${u.featured ? ' featured' : ''}`;
      const canBuy = !u.maxed && player.caps >= u.cost;
      const iconSvg = UPGRADE_ICONS[u.id] || '';
      const pips = u.max > 0 ? renderLevelPips(u.cur, u.max, !!u.amberPips) : '';
      card.innerHTML = `
        <div class="upg-icon" aria-hidden="true">${iconSvg}</div>
        <div class="upg-main">
          <div class="upg-head">
            <span class="upg-name">${escapeHtml(u.name)}</span>
            <span class="upg-lvl">${escapeHtml(u.lvl)}${pips}</span>
          </div>
          <div class="upg-desc">${escapeHtml(u.desc)}</div>
        </div>
        <button class="btn-small upg-buy-btn" type="button" ${canBuy ? '' : 'disabled'}>
          ${u.maxed ? 'MAX' : `${u.cost} ₵`}
        </button>
      `;
      const btn = card.querySelector('button');
      btn.addEventListener('click', () => {
        AudioFX.unlock();
        if (u.maxed || player.caps < u.cost) return;
        const prevThreat = getThreatLevel();
        player.caps -= u.cost;
        u.apply();
        AudioFX.upgrade(u.id === 'car');
        if (u.id === 'matrix' || (u.id === 'car' && player.carClass === CAR_CLASSES.length - 1)) {
          driverAwakenNeo(2.2, pickQuote(DRIVER_QUOTES.neo));
        } else {
          driverDrinkCanteen(pickQuote(DRIVER_QUOTES.upgrade));
        }
        addLog(`Установлено: ${u.name}`, 'matrix');
        addFloatText(player.x, player.y - 24, `АПГРЕЙД: ${u.name}`, '#38e8ff');
        if (getThreatLevel() > prevThreat || u.id === 'car') {
          refreshFarEnemies(getThreatLevel() > prevThreat);
        }
        saveProgress();
        renderGarage();
        syncUI(true);
      });
      el.garageList.appendChild(card);
    }
  }

  // ==================== ОБНОВЛЕНИЕ СИМУЛЯЦИИ ====================
  function update(dt) {
    elapsed += dt;
    updateDigitalRain(dt);

    if (gameState !== 'playing') {
      if (AudioFX.updateEngine) AudioFX.updateEngine({ active: false });
      // Мягкий обзор города на стартовом экране
      if (gameState === 'menu') {
        cam.x = world.depot.x + Math.cos(elapsed * 0.25) * 180;
        cam.y = world.depot.y + Math.sin(elapsed * 0.2) * 120;
      }
      updateDriverCam(dt);
      return;
    }

    const spec = getCarSpec();
    player.maxHp = spec.maxHp;
    player.maxFocus = spec.maxFocus;

    // Режим Матрицы (Bullet-Time)
    const wantMatrix = !!(keys.ShiftLeft || keys.ShiftRight || mouse.rightDown || touchMatrixToggle);
    if (wantMatrix && player.focus > (matrixActive ? 1 : 12)) {
      if (!matrixActive) {
        matrixActive = true;
        glitchTimer = Math.max(glitchTimer, 0.22);
        AudioFX.matrix(true);
        driverAwakenNeo(0.8, pickQuote(DRIVER_QUOTES.neo));
      }
      player.focus = Math.max(0, player.focus - spec.focusDrain * dt);
      if (player.focus <= 1) {
        matrixActive = false;
        touchMatrixToggle = false;
        AudioFX.matrix(false);
      }
    } else {
      if (matrixActive) {
        matrixActive = false;
        AudioFX.matrix(false);
      }
      player.focus = Math.min(player.maxFocus, player.focus + spec.focusRegen * dt);
    }

    // «Скрытый код под ржавчиной»: Матрица прорывается в Фокусе, у терминалов/разломов, рядом с Агентами и при повреждениях
    if (glitchTimer > 0) glitchTimer = Math.max(0, glitchTimer - dt);
    let targetBreach = matrixActive ? 1.0 : 0.0;
    if (glitchTimer > 0) targetBreach = Math.max(targetBreach, 0.65);
    if (targetBreach < 0.8) {
      for (const term of world.terminals) {
        const td = dist(player, term);
        if (td < 210) targetBreach = Math.max(targetBreach, (1 - td / 210) * 0.65);
      }
      for (const rf of world.rifts) {
        const rd = dist(player, rf);
        if (rd < 150) targetBreach = Math.max(targetBreach, (1 - rd / 150) * 0.55);
      }
      for (const e of enemies) {
        if (e.kind === 'agent' || e.kind === 'boss') {
          const ad = dist(player, e);
          if (ad < 340) targetBreach = Math.max(targetBreach, (1 - ad / 340) * 0.72);
        }
      }
    }
    matrixBreach += (targetBreach - matrixBreach) * Math.min(1, 5.5 * dt);

    el.matrixVignette.classList.toggle('active', matrixActive || matrixBreach > 0.58);
    el.btnTouchMatrix.classList.toggle('active', matrixActive);

    const worldDt = matrixActive ? dt * 0.30 : dt;
    const playerDt = matrixActive ? dt * 0.80 : dt;

    updatePlayer(playerDt, spec);
    updateEnemies(worldDt);
    updateBullets(worldDt);
    updateLoot(dt);
    updateMission(dt);
    updateParticles(worldDt);

    // Плавное следование камеры с упреждением
    const targetCamX = player.x + player.vx * 0.22;
    const targetCamY = player.y + player.vy * 0.22;
    const camLerp = 1 - Math.exp(-7.5 * dt);
    cam.x += (targetCamX - cam.x) * camLerp;
    cam.y += (targetCamY - cam.y) * camLerp;

    // Зажатие камеры в пределах мира (с учётом масштаба)
    const z = effectiveZoom();
    const halfW = (viewW / 2) / z;
    const halfH = (viewH / 2) / z;
    if (world.WIDTH > halfW * 2) cam.x = clamp(cam.x, halfW, world.WIDTH - halfW);
    else cam.x = world.WIDTH / 2;
    if (world.HEIGHT > halfH * 2) cam.y = clamp(cam.y, halfH, world.HEIGHT - halfH);
    else cam.y = world.HEIGHT / 2;

    if (shakeAmt > 0) shakeAmt = Math.max(0, shakeAmt - 24 * dt);

    // Спад уровня следа при спокойной езде
    if (player.trace > 0) {
      traceDecayTimer += dt;
      if (traceDecayTimer > 28) {
        traceDecayTimer = 0;
        player.trace = Math.max(0, player.trace - 1);
      }
    }

    // Периодическое обновление DOM-интерфейса (12 раз/сек)
    uiTimer += dt;
    if (uiTimer >= 0.08) {
      uiTimer = 0;
      syncUI(false);
    }

    updateDriverCam(dt);
  }

  function updatePlayer(dt, spec) {
    // 1) Управление с клавиатуры (WASD + Стрелки) или сенсорного джойстика
    const fwdX = Math.cos(player.ang);
    const fwdY = Math.sin(player.ang);
    const curFwdSpeed = player.vx * fwdX + player.vy * fwdY;
    let throttleAmt = 0;

    if (joy.active && joy.mag > 0.12) {
      // Интуитивное управление для телефона: рулим в сторону стика, газ = отклонение
      throttleAmt = joy.mag;
      const diff = normAngle(joy.ang - player.ang);
      const maxTurn = spec.turn * 1.45 * dt;
      player.ang = normAngle(player.ang + clamp(diff, -maxTurn, maxTurn));
      const align = Math.max(0.25, Math.cos(diff));
      const desired = spec.maxSpeed * joy.mag * align;
      const fx = Math.cos(player.ang);
      const fy = Math.sin(player.ang);
      player.vx += (fx * desired - player.vx) * Math.min(1, 5.2 * dt);
      player.vy += (fy * desired - player.vy) * Math.min(1, 5.2 * dt);
    } else {
      const up = keys.KeyW || keys.ArrowUp ? 1 : 0;
      const down = keys.KeyS || keys.ArrowDown ? 1 : 0;
      const left = keys.KeyA || keys.ArrowLeft ? 1 : 0;
      const right = keys.KeyD || keys.ArrowRight ? 1 : 0;

      const throttle = up - down;
      const steer = right - left;
      throttleAmt = throttle !== 0 ? 1 : 0;

      // Руление (зависит от скорости, на заднем ходу инвертируется)
      const speedFactor = clamp(Math.abs(curFwdSpeed) / 90, 0.35, 1.1);
      const dirSign = curFwdSpeed >= -12 ? 1 : -1;
      player.ang = normAngle(player.ang + steer * spec.turn * speedFactor * dirSign * dt);

      const nfx = Math.cos(player.ang);
      const nfy = Math.sin(player.ang);

      if (throttle > 0) {
        player.vx += nfx * spec.accel * dt;
        player.vy += nfy * spec.accel * dt;
      } else if (throttle < 0) {
        player.vx -= nfx * spec.accel * 0.72 * dt;
        player.vy -= nfy * spec.accel * 0.72 * dt;
      }

      // Боковое сцепление шин (лёгкий контролируемый дрифт GTA)
      const rightX = -nfy;
      const rightY = nfx;
      const fwdSp = player.vx * nfx + player.vy * nfy;
      const latSp = player.vx * rightX + player.vy * rightY;
      const grip = Math.exp(-7.2 * dt);
      const drag = throttle === 0 ? Math.exp(-3.1 * dt) : Math.exp(-0.7 * dt);
      const newFwd = clamp(fwdSp * drag, -spec.maxSpeed * 0.45, spec.maxSpeed);
      const newLat = latSp * grip;
      player.vx = nfx * newFwd + rightX * newLat;
      player.vy = nfy * newFwd + rightY * newLat;

      // Следы шин при дрифте
      if (Math.abs(newLat) > 55 && Math.hypot(player.vx, player.vy) > 120) {
        skidmarks.push({
          x: player.x - nfx * (spec.len * 0.35),
          y: player.y - nfy * (spec.len * 0.35),
          ang: player.ang,
          life: 4.5
        });
        if (skidmarks.length > 90) skidmarks.shift();
      }
    }

    // Движение + коллизии со зданиями
    const prevSpeed = Math.hypot(player.vx, player.vy);
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    const hitWall = world.resolveCircle(player, spec.wid * 0.65);
    if (hitWall && prevSpeed > 140) {
      AudioFX.crash(clamp(prevSpeed / 260, 0.5, 1.3));
      spawnBurst(player.x, player.y, '#ffb84d', 5, 110);
      shakeAmt = Math.min(8, shakeAmt + 2.5);
      driverOnHit(4, true);
    }

    // Живой синтез двигателя (обороты, передачи, турбина, визг шин, шипение нитро)
    const curSpd = Math.hypot(player.vx, player.vy);
    if (AudioFX.updateEngine) {
      const latAbs = Math.abs(player.vx * (-Math.sin(player.ang)) + player.vy * Math.cos(player.ang));
      const driftAmt = curSpd > 95 ? clamp((latAbs - 38) / 110, 0, 1) : 0;
      const nitroAmt = (player.engineLvl >= 4 && curSpd > 140 && throttleAmt > 0.2)
        ? clamp((curSpd - 120) / 220, 0.25, 1)
        : 0;
      AudioFX.updateEngine({
        active: true,
        carClass: player.carClass,
        engineLvl: player.engineLvl,
        speedRatio: clamp(curSpd / Math.max(1, spec.maxSpeed), 0, 1.15),
        throttle: throttleAmt,
        drift: driftAmt,
        nitro: nitroAmt
      });
    }

    // Зелёные цифровые следы при активной Матрице
    if (matrixActive && curSpd > 40 && Math.random() < 0.45) {
      ghosts.push({
        x: player.x, y: player.y, ang: player.ang,
        len: spec.len, wid: spec.wid, life: 0.28, maxLife: 0.28
      });
    }

    // Выхлопные искры (двигатель ур. 2+) и нитро-форсаж (ур. 4)
    if (player.engineLvl >= 4 && curSpd > 140 && Math.random() < 0.65) {
      const bx = player.x - Math.cos(player.ang) * (spec.len * 0.56);
      const by = player.y - Math.sin(player.ang) * (spec.len * 0.56);
      const side = (Math.random() < 0.5 ? -1 : 1) * (spec.wid * 0.25);
      const px = bx - Math.sin(player.ang) * side;
      const py = by + Math.cos(player.ang) * side;
      particles.push({
        x: px, y: py,
        vx: -Math.cos(player.ang) * (70 + Math.random() * 55) + (Math.random() - 0.5) * 18,
        vy: -Math.sin(player.ang) * (70 + Math.random() * 55) + (Math.random() - 0.5) * 18,
        size: 2.6 + Math.random() * 2.4,
        color: Math.random() < 0.55 ? '#38e8ff' : '#39ff88',
        life: 0.16,
        maxLife: 0.16
      });
    } else if ((player.engineLvl >= 2 || player.carClass === 3) && curSpd > 160 && Math.random() < 0.28) {
      const side = (Math.random() < 0.5 ? -1 : 1) * (spec.wid * 0.55);
      particles.push({
        x: player.x - Math.cos(player.ang) * (spec.len * 0.28) - Math.sin(player.ang) * side,
        y: player.y - Math.sin(player.ang) * (spec.len * 0.28) + Math.cos(player.ang) * side,
        vx: -Math.cos(player.ang) * 45 + (Math.random() - 0.5) * 22,
        vy: -Math.sin(player.ang) * 45 + (Math.random() - 0.5) * 22,
        size: 2.0 + Math.random() * 1.8,
        color: '#ff9436',
        life: 0.2,
        maxLife: 0.2
      });
    }

    // Дым при сильном повреждении корпуса
    if (player.hp < player.maxHp * 0.4 && Math.random() < 0.32) {
      particles.push({
        x: player.x + (Math.random() - 0.5) * 10,
        y: player.y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 20,
        vy: -12 - Math.random() * 18,
        size: 3 + Math.random() * 4,
        color: '#6b7a6f',
        life: 0.5,
        maxLife: 0.5
      });
    }

    // Зона Бункера-Депо
    const inDepot = dist(player, world.depot) <= world.depot.radius;
    if (inDepot && !player.inDepot) {
      addLog('Вы в зоне Бункера-Депо. Нажмите E для ремонта.', 'warn');
      driverVaultMoment(pickQuote(DRIVER_QUOTES.depot));
    }
    player.inDepot = inDepot;
    if (inDepot && player.rad > 0) {
      player.rad = Math.max(0, player.rad - 18 * dt);
    }

    // Радиация в кратерах Fallout
    const radInt = world.getRadIntensity(player.x, player.y);
    if (radInt > 0.05) {
      player.rad = Math.min(100, player.rad + (9 + radInt * 14) * dt);
      geigerTimer -= dt;
      if (geigerTimer <= 0) {
        geigerTimer = 0.14 + (1 - radInt) * 0.35;
        AudioFX.geiger();
      }
    } else if (player.rad > 0) {
      player.rad = Math.max(0, player.rad - 1.5 * dt);
    }
    if (player.rad >= 65) {
      damagePlayer(((player.rad - 55) * 0.12) * dt, true);
    }

    // Наведение турели: мышью (ПК) или автонаводкой/по курсу (телефон)
    lastAutoTarget = null;
    if (touchFire || (joy.active && !mouse.active)) {
      let best = null;
      let bestD = 430;
      for (const e of enemies) {
        const d = dist(player, e);
        if (d < bestD) { bestD = d; best = e; }
      }
      if (best) {
        lastAutoTarget = best;
        player.turretAng = Math.atan2(best.y - player.y, best.x - player.x);
      } else {
        player.turretAng = player.ang;
      }
    } else if (mouse.active) {
      const z = effectiveZoom();
      const wx = cam.x + (mouse.x - viewW / 2) / z;
      const wy = cam.y + (mouse.y - viewH / 2) / z;
      player.turretAng = Math.atan2(wy - player.y, wx - player.x);
    } else {
      player.turretAng = player.ang;
    }

    // Стрельба из турели + автозалп самонаводящихся ракет (missileLvl 1..3)
    if (player.shootCd > 0) player.shootCd -= dt;
    if (player.missileCd > 0) player.missileCd -= dt;
    const wantFire = !!(mouse.down || keys.Space || touchFire);

    if (wantFire && player.shootCd <= 0) {
      if (player.ammo > 0) {
        player.shootCd = spec.fireDelay;
        player.ammo--;
        const a = player.turretAng;
        const muzzleDist = spec.len * 0.48;
        const perpX = -Math.sin(a) * 4.5;
        const perpY = Math.cos(a) * 4.5;
        const mx = player.x + Math.cos(a) * muzzleDist;
        const my = player.y + Math.sin(a) * muzzleDist;

        if (player.weaponLvl >= 4) {
          // Ур.4: Три-плазменный комплекс (2 тяжёлых луча + центр-овердрайв)
          fireBullet('player', mx + perpX, my + perpY, a - 0.032, 790, spec.damage * 0.62, '#39ff88', 3.6);
          fireBullet('player', mx - perpX, my - perpY, a + 0.032, 790, spec.damage * 0.62, '#39ff88', 3.6);
          fireBullet('player', mx, my, a, 840, spec.damage * 0.72, '#38e8ff', 4.1);
        } else if (player.weaponLvl === 3) {
          // Ур.3: Сдвоенная плазменная автопушка
          fireBullet('player', mx + perpX, my + perpY, a - 0.022, 770, spec.damage * 0.76, '#39ff88', 3.7);
          fireBullet('player', mx - perpX, my - perpY, a + 0.022, 770, spec.damage * 0.76, '#39ff88', 3.7);
        } else if (player.weaponLvl === 2) {
          // Ур.2: Сдвоенный тяжёлый пулемёт (2 параллельных ствола)
          fireBullet('player', mx + perpX * 0.85, my + perpY * 0.85, a - 0.018, 740, spec.damage * 0.70, '#ffd86b', 3.4);
          fireBullet('player', mx - perpX * 0.85, my - perpY * 0.85, a + 0.018, 740, spec.damage * 0.70, '#ffd86b', 3.4);
        } else {
          // Ур.1: Одиночный крупнокалиберный пулемёт
          fireBullet('player', mx, my, a, 720, spec.damage, '#ffd86b', 3.4);
        }
        const flashCol = player.weaponLvl >= 3 ? '#39ff88' : '#ffd86b';
        AudioFX.shoot(player.weaponLvl);
        driverOnGunfire(player.weaponLvl >= 3, a);
        spawnBurst(mx, my, flashCol, 3, 95);
      } else {
        player.shootCd = 0.45;
        addLog('Нет патронов! Подберите красные ящики или заедьте в Депо.', 'warn');
      }
    }

    // Запуск самонаводящихся ракет при стрельбе (бонусный залп, не тратит патроны!)
    if (wantFire && (player.missileLvl || 0) > 0 && player.missileCd <= 0) {
      const lock = findNearestEnemy(player.x, player.y, 680, player.turretAng);
      player.missileCd = spec.missileCd;
      const a = player.turretAng;
      const salvo = spec.missileSalvo;
      if (salvo >= 2) {
        const px = -Math.sin(a) * 9;
        const py = Math.cos(a) * 9;
        fireHomingMissile(player.x + px, player.y + py, a - 0.24, spec.missileDmg, lock);
        fireHomingMissile(player.x - px, player.y - py, a + 0.24, spec.missileDmg, lock);
      } else {
        const px = -Math.sin(a) * 8;
        const py = Math.cos(a) * 8;
        fireHomingMissile(player.x + px, player.y + py, a - 0.14, spec.missileDmg, lock);
      }
      if (AudioFX.missile) AudioFX.missile(false);
      driverOnGunfire(true, a);
    }
  }

  function damagePlayer(dmg, isRad) {
    if (!player || gameState !== 'playing') return;
    player.hp -= dmg;
    if (!isRad) {
      AudioFX.hit(true);
      shakeAmt = Math.min(10, shakeAmt + 3.2);
      driverOnHit(dmg, false);
      if (dmg >= 6) glitchTimer = Math.max(glitchTimer, 0.2);
    }
    if (player.hp <= 0) {
      player.hp = 0;
      if (matrixActive) {
        matrixActive = false;
        AudioFX.matrix(false);
      }
      explodeVehicle(player.x, player.y, false, true);
      updateBestScore();
      saveProgress();
      setOverlayState('dead');
      syncUI(true);
    }
  }

  function updateEnemies(dt) {
    const pwr = getPlayerPower();
    const threat = getThreatLevel();
    const hc = prefs.hardcore;
    const targetCount = Math.min(14, 6 + player.trace + Math.floor((player.missionsDone + player.carClass) / 2) + (hc ? 2 : 0));
    enemySpawnTimer -= dt;
    if (enemySpawnTimer <= 0 && enemies.length < targetCount) {
      enemySpawnTimer = Math.max(1.35, (2.6 - threat * 0.18) * (hc ? 0.78 : 1.0));
      const bossCount = enemies.filter((e) => e.kind === 'boss').length;
      const maxBosses = threat >= 4 || hc ? 2 : 1;
      const roll = Math.random();

      let kind = 'raider';
      if ((threat >= 3 || player.trace >= 4) && bossCount < maxBosses && roll < (0.09 + threat * 0.036)) {
        kind = 'boss';
      } else if ((threat >= 2 || player.trace >= 2 || currentSector >= 2) && roll < (0.24 + threat * 0.075 + player.trace * 0.06)) {
        kind = 'agent';
      } else if ((threat >= 2 || player.trace >= 1 || currentSector >= 1) && roll < (0.52 + threat * 0.09)) {
        kind = 'heavy';
      }
      spawnEnemy(kind);
    }

    const spec = getCarSpec();
    const bSpdBoost = hc ? 1.36 : 1.24;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.ramCd > 0) e.ramCd = Math.max(0, e.ramCd - dt);
      e.flankTimer = (e.flankTimer || 2.5) - dt;
      if (e.flankTimer <= 0) {
        e.flankTimer = 2.6 + Math.random() * 3.2;
        if (Math.random() < 0.45) e.flankSide = -(e.flankSide || 1);
      }
      const d = dist(e, player);

      if ((e.tier || 1) < threat && d > 1350) {
        enemies.splice(i, 1);
        continue;
      }

      const isAgent = e.kind === 'agent';
      const isBoss = e.kind === 'boss';
      const isHeavy = e.kind === 'heavy';
      const eTier = e.tier || 1;
      const aggroDist = e.aggro || (isAgent ? 820 : 540);

      if (d < aggroDist && !player.inDepot) {
        // Преследование с фланговым манёвром и 2-лучевым объездом углов зданий!
        const directAng = Math.atan2(player.y - e.y, player.x - e.x);
        const flankOffset = (d > 130 && d < 420 && !isHeavy) ? (e.flankSide || 1) * (isAgent ? 0.42 : 0.28) : 0;
        let desiredAng = normAngle(directAng + flankOffset);

        // Проверка препятствия впереди (lookahead) — враг объезжает углы, а не буксует в стене
        const probeD = 58;
        const aheadBlocked = world.isPointInBuilding(e.x + Math.cos(desiredAng) * probeD, e.y + Math.sin(desiredAng) * probeD);
        if (aheadBlocked) {
          const leftAng = normAngle(desiredAng - 0.85);
          const rightAng = normAngle(desiredAng + 0.85);
          const leftFree = !world.isPointInBuilding(e.x + Math.cos(leftAng) * probeD, e.y + Math.sin(leftAng) * probeD);
          const rightFree = !world.isPointInBuilding(e.x + Math.cos(rightAng) * probeD, e.y + Math.sin(rightAng) * probeD);
          if (leftFree && !rightFree) desiredAng = leftAng;
          else if (rightFree && !leftFree) desiredAng = rightAng;
          else desiredAng = normAngle(desiredAng + (e.flankSide || 1) * 1.1);
        }

        const diff = normAngle(desiredAng - e.ang);
        const turnRate = isBoss ? 2.35 : (isHeavy ? 2.65 : (isAgent ? 3.65 : 3.25));
        e.ang = normAngle(e.ang + clamp(diff, -turnRate * dt, turnRate * dt));
        const holdDist = isBoss ? 185 : (isAgent ? 155 : 130);
        const desiredSpeed = d > holdDist ? e.speed : e.speed * (isAgent ? 0.58 : 0.42);
        e.vx += (Math.cos(e.ang) * desiredSpeed - e.vx) * Math.min(1, 4.2 * dt);
        e.vy += (Math.sin(e.ang) * desiredSpeed - e.vy) * Math.min(1, 4.2 * dt);

        // Стрельба по игроку с УПРЕЖДЕНИЕМ (lead-aiming для MK-II+, Агентов, Карателей и Хардкора!)
        e.shootCd -= dt;
        const shootRange = e.range || (isAgent ? 425 : 340);
        if (e.shootCd <= 0 && d < shootRange) {
          e.shootCd = e.fireCd || (isAgent ? 0.88 : 1.32);
          const baseBulletSpd = (isBoss ? 485 : isAgent ? 490 : isHeavy ? 430 : 410) * bSpdBoost;
          const leadFactor = (isAgent || isBoss)
            ? (hc ? 0.88 : 0.72)
            : (eTier >= 2 || hc ? (hc ? 0.68 : 0.48) : 0.18);
          const leadT = clamp(d / baseBulletSpd, 0, 0.72) * leadFactor;
          const tx = player.x + player.vx * leadT;
          const ty = player.y + player.vy * leadT;
          const spreadBase = isAgent ? 0.055 : Math.max(0.065, 0.16 - (eTier - 1) * 0.022);
          const spread = hc ? spreadBase * 0.7 : spreadBase;
          const aim = Math.atan2(ty - e.y, tx - e.x) + (Math.random() - 0.5) * spread;
          const mx = e.x + Math.cos(aim) * (e.len * 0.52);
          const my = e.y + Math.sin(aim) * (e.len * 0.52);
          const px = -Math.sin(aim) * 4.2;
          const py = Math.cos(aim) * 4.2;

          if (isBoss) {
            fireBullet('enemy', mx, my, aim - 0.13, 470 * bSpdBoost, e.dmg * 0.8, '#ff4d5a', 4.1);
            fireBullet('enemy', mx, my, aim, 505 * bSpdBoost, e.dmg, '#39ff88', 4.4);
            fireBullet('enemy', mx, my, aim + 0.13, 470 * bSpdBoost, e.dmg * 0.8, '#ff4d5a', 4.1);
          } else if (isHeavy) {
            if (eTier >= 4 || hc) {
              fireBullet('enemy', mx, my, aim - 0.10, 435 * bSpdBoost, e.dmg * 0.68, '#ff8e47', 3.6);
              fireBullet('enemy', mx, my, aim, 458 * bSpdBoost, e.dmg * 0.8, '#ffb84d', 3.9);
              fireBullet('enemy', mx, my, aim + 0.10, 435 * bSpdBoost, e.dmg * 0.68, '#ff8e47', 3.6);
            } else {
              fireBullet('enemy', mx + px, my + py, aim - 0.035, 425 * bSpdBoost, e.dmg * 0.74, '#ff8e47', 3.6);
              fireBullet('enemy', mx - px, my - py, aim + 0.035, 425 * bSpdBoost, e.dmg * 0.74, '#ff8e47', 3.6);
            }
          } else if (isAgent && (eTier >= 2 || hc)) {
            fireBullet('enemy', mx + px * 0.8, my + py * 0.8, aim - 0.022, 500 * bSpdBoost, e.dmg * 0.74, '#39ff88', 3.6);
            fireBullet('enemy', mx - px * 0.8, my - py * 0.8, aim + 0.022, 500 * bSpdBoost, e.dmg * 0.74, '#39ff88', 3.6);
          } else if (!isAgent && eTier >= 3) {
            fireBullet('enemy', mx + px * 0.7, my + py * 0.7, aim - 0.03, 430 * bSpdBoost, e.dmg * 0.70, '#ff7d57', 3.4);
            fireBullet('enemy', mx - px * 0.7, my - py * 0.7, aim + 0.03, 430 * bSpdBoost, e.dmg * 0.70, '#ff7d57', 3.4);
          } else {
            fireBullet(
              'enemy',
              mx, my,
              aim,
              (isAgent ? 485 : 410) * bSpdBoost,
              e.dmg || (isAgent ? 14 : 10),
              isAgent ? '#39ff88' : '#ff6b57',
              3.5
            );
          }
        }

        // Каратель MK-III+ (или любой в Хардкоре) запускает наводящуюся ракету Системы
        if (isBoss && (eTier >= 3 || hc) && d < 500 && d > 110) {
          e.missileCd = (e.missileCd || 4) - dt;
          if (e.missileCd <= 0) {
            e.missileCd = (eTier >= 5 || hc) ? 3.2 : 4.2;
            const aim = Math.atan2(player.y - e.y, player.x - e.x);
            fireHomingMissile(e.x + Math.cos(aim) * 24, e.y + Math.sin(aim) * 24, aim, Math.round((25 + eTier * 3) * (hc ? 1.2 : 1.0)), null, 'enemy');
            if (AudioFX.missile) AudioFX.missile(true);
          }
        }
      } else {
        // Патрулирование улиц
        e.wanderTimer -= dt;
        if (e.wanderTimer <= 0) {
          e.wanderTimer = 1.6 + Math.random() * 2.2;
          e.wanderAng = Math.floor(Math.random() * 4) * (Math.PI / 2);
        }
        const diff = normAngle(e.wanderAng - e.ang);
        e.ang = normAngle(e.ang + clamp(diff, -2.5 * dt, 2.5 * dt));
        const sp = e.speed * 0.62;
        e.vx += (Math.cos(e.ang) * sp - e.vx) * Math.min(1, 3.2 * dt);
        e.vy += (Math.sin(e.ang) * sp - e.vy) * Math.min(1, 3.2 * dt);
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;
      const hitWall = world.resolveCircle(e, e.wid * 0.65);
      if (hitWall) {
        e.wanderAng = normAngle(e.ang + Math.PI * 0.6);
        e.wanderTimer = 1.0;
      }

      // Столкновение машина-в-машину с игроком (честная импульсная физика + кулдаун удара, БЕЗ ваншота от касания!)
      const minSep = (spec.wid + e.wid) * 0.56;
      const pd = dist(e, player);
      if (pd < minSep && pd > 0.01) {
        const nx = (player.x - e.x) / pd;
        const ny = (player.y - e.y) / pd;
        const overlap = minSep - pd;
        // Полное разделение кузовов с учётом массы (WAR RIG тяжелее, Каратель тяжелее всех)
        const playerMass = 1.0 + player.carClass * 0.35 + (player.armorLvl - 1) * 0.12;
        const enemyMass = isBoss ? 2.6 : (isHeavy ? 1.75 : (isAgent ? 1.15 : 1.0));
        const totalMass = playerMass + enemyMass;
        player.x += nx * overlap * (enemyMass / totalMass + 0.15);
        player.y += ny * overlap * (enemyMass / totalMass + 0.15);
        e.x -= nx * overlap * (playerMass / totalMass + 0.15);
        e.y -= ny * overlap * (playerMass / totalMass + 0.15);

        // Скорость сближения именно вдоль нормали удара (боковое касание не даёт урон лобового тарана!)
        const closing = (e.vx - player.vx) * nx + (e.vy - player.vy) * ny;
        if (closing > 0) {
          // Упругий отскок + гашение скорости сближения, чтобы машины не «пилили» друг друга каждый кадр
          const restitution = 0.38;
          const jImp = (1 + restitution) * closing / (1 / playerMass + 1 / enemyMass);
          player.vx += (jImp / playerMass) * nx;
          player.vy += (jImp / playerMass) * ny;
          e.vx -= (jImp / enemyMass) * nx;
          e.vy -= (jImp / enemyMass) * ny;
        }

        if (closing > 105 && e.ramCd <= 0) {
          e.ramCd = 0.46; // 1 удар за столкновение, без пофреймового «распиливания»!
          const armorResist = isBoss ? 0.52 : (isHeavy ? 0.72 : (eTier >= 3 ? 0.85 : 1.0));
          const ramDmg = Math.min(closing * spec.ramMult * armorResist, 145);
          e.hp -= ramDmg;
          const bossFactor = isBoss ? 1.55 : (isHeavy ? 1.25 : 1.0);
          damagePlayer(Math.max(4, closing * spec.ramSelfMult * bossFactor), false);
          AudioFX.crash(clamp(closing / 240, 0.55, 1.45));
          haptic(18);
          spawnBurst((player.x + e.x) / 2, (player.y + e.y) / 2, '#ffb84d', 8, 150);
          if (e.hp <= 0) destroyEnemy(i);
        } else if (closing > 45 && e.ramCd <= 0) {
          // Лёгкое касание: только скрежет и искры
          e.ramCd = 0.25;
          spawnBurst((player.x + e.x) / 2, (player.y + e.y) / 2, '#ffd485', 3, 75);
        }
      }
    }
  }

  function destroyEnemy(index) {
    const e = enemies[index];
    if (!e) return;
    const isAgent = e.kind === 'agent';
    const isBoss = e.kind === 'boss';
    const isHeavy = e.kind === 'heavy';
    const tierTag = (e.tier || 1) >= 2 ? ` MK-${ROMAN_TIERS[(e.tier || 1) - 1]}` : '';
    explodeVehicle(e.x, e.y, isAgent || isBoss, isBoss || isHeavy);
    enemies.splice(index, 1);

    const capsGain = e.bounty || (isBoss ? 75 : isAgent ? 35 : isHeavy ? 30 : 18);
    const scoreGain = e.score || (isBoss ? 420 : isAgent ? 200 : isHeavy ? 160 : 100);
    player.caps += capsGain;
    player.score += scoreGain;
    player.kills++;
    player.totalKills = (player.totalKills || 0) + 1;
    player.focus = Math.min(player.maxFocus, player.focus + (isBoss ? 45 : 22));
    player.trace = Math.min(5, player.trace + (isAgent || isBoss ? 1 : (player.kills % 2 === 0 ? 1 : 0)));
    traceDecayTimer = 0;

    const label = isBoss
      ? `КАРАТЕЛЬ${tierTag} УНИЧТОЖЕН! +${capsGain} ₵`
      : isAgent
        ? `Агент${tierTag} нейтрализован! +${capsGain} ₵`
        : isHeavy
          ? `Броневик${tierTag} подорван! +${capsGain} ₵`
          : `Рейдер${tierTag} уничтожен! +${capsGain} ₵`;

    addFloatText(e.x, e.y - 16, `+${capsGain} ₵`, isBoss ? '#39ff88' : '#ffb84d');
    addLog(label, (isAgent || isBoss) ? 'matrix' : '');
    driverOnKill(isAgent || isBoss);

    // Дроп лута на месте взрыва (аптечки реже — каждая реально важна!)
    if (isBoss) {
      spawnLoot({ x: e.x - 10, y: e.y }, 'module');
      spawnLoot({ x: e.x + 10, y: e.y }, 'focus');
    } else if (Math.random() < (isHeavy ? 0.72 : 0.60)) {
      const r = Math.random();
      const dropType = isAgent
        ? (r < 0.65 ? 'focus' : 'module')
        : (r < 0.32 ? 'medkit' : (r < 0.70 ? 'ammo' : 'caps'));
      spawnLoot({ x: e.x, y: e.y }, dropType);
    }

    if (mission && mission.type === 'hunt') {
      mission.progress++;
      if (mission.progress >= mission.goal) completeMission();
    }
    updateBestScore();
    saveProgress();
    renderGarage();
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];

      // Самонаводящаяся ракета (игрока или Карателя MK-IV/V): доворот к цели + шлейф дыма
      if (b.homing) {
        if (b.owner === 'enemy') {
          if (player && player.hp > 0) {
            const desiredAng = Math.atan2(player.y - b.y, player.x - b.x);
            const diff = normAngle(desiredAng - b.ang);
            b.ang = normAngle(b.ang + clamp(diff, -3.1 * dt, 3.1 * dt));
          }
          b.speed = Math.min(410, b.speed + 120 * dt);
        } else {
          let target = enemies.find((e) => e.id === b.targetId);
          if (!target) {
            target = findNearestEnemy(b.x, b.y, 460, b.ang);
            b.targetId = target ? target.id : null;
          }
          if (target) {
            const desiredAng = Math.atan2(target.y - b.y, target.x - b.x);
            const diff = normAngle(desiredAng - b.ang);
            b.ang = normAngle(b.ang + clamp(diff, -5.6 * dt, 5.6 * dt));
          }
          b.speed = Math.min(590, b.speed + 260 * dt);
        }
        b.vx = Math.cos(b.ang) * b.speed;
        b.vy = Math.sin(b.ang) * b.speed;

        b.smokeCd = (b.smokeCd || 0) - dt;
        if (b.smokeCd <= 0) {
          b.smokeCd = 0.028;
          particles.push({
            x: b.x - Math.cos(b.ang) * 7,
            y: b.y - Math.sin(b.ang) * 7,
            vx: -Math.cos(b.ang) * 28 + (Math.random() - 0.5) * 24,
            vy: -Math.sin(b.ang) * 28 + (Math.random() - 0.5) * 24,
            size: 2.5 + Math.random() * 2.5,
            color: b.owner === 'enemy'
              ? (Math.random() < 0.5 ? '#ff4d5a' : '#806469')
              : (Math.random() < 0.45 ? '#ffb84d' : '#8ea095'),
            life: 0.28,
            maxLife: 0.28
          });
        }
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.life <= 0 || world.isPointInBuilding(b.x, b.y)) {
        if (b.homing) detonateMissile(b);
        else spawnBurst(b.x, b.y, b.color, 3, 75);
        bullets.splice(i, 1);
        continue;
      }

      if (b.owner === 'player') {
        let hit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          if (Math.hypot(b.x - e.x, b.y - e.y) < e.len * 0.52 + (b.homing ? 6 : 0)) {
            if (b.homing) {
              detonateMissile(b);
            } else {
              e.hp -= b.dmg;
              AudioFX.hit(false);
              spawnBurst(b.x, b.y, b.color, 5, 110);
              if (e.hp <= 0) destroyEnemy(j);
            }
            hit = true;
            break;
          }
        }
        if (hit) bullets.splice(i, 1);
      } else {
        if (Math.hypot(b.x - player.x, b.y - player.y) < (b.homing ? 24 : 20)) {
          if (b.homing) {
            detonateMissile(b);
          } else {
            spawnBurst(b.x, b.y, '#ff4d5a', 5, 100);
            damagePlayer(b.dmg, false);
          }
          bullets.splice(i, 1);
        }
      }
    }
  }

  function updateLoot(dt) {
    for (let i = loot.length - 1; i >= 0; i--) {
      const it = loot[i];
      it.pulse += dt * 3.5;
      if (dist(player, it) < 34) {
        const def = LOOT_DEFS[it.type];
        const mult = capsMultiplier();
        let capsChanged = false;
        let popLabel = def.label;
        if (it.type === 'ammo') player.ammo += 28;
        else if (it.type === 'medkit') {
          player.hp = Math.min(player.maxHp, player.hp + 24);
          driverDrinkCanteen(pickQuote(DRIVER_QUOTES.canteen));
        } else if (it.type === 'caps') {
          const gain = Math.round(25 * mult);
          player.caps += gain;
          popLabel = `Крышки +${gain} ₵`;
          capsChanged = true;
        } else if (it.type === 'focus') {
          player.focus = Math.min(player.maxFocus, player.focus + 52);
          driverAwakenNeo(1.8, pickQuote(DRIVER_QUOTES.neo));
        } else if (it.type === 'radaway') {
          player.rad = Math.max(0, player.rad - 55);
          driverDrinkCanteen('Антирадин пошёл. Фляжка снова выручает.');
        } else if (it.type === 'module') {
          const gain = Math.round(35 * mult);
          player.caps += gain;
          player.score += Math.round(60 * mult);
          popLabel = `Модуль +${gain} ₵`;
          capsChanged = true;
        }

        player.score += 25;
        AudioFX.pickup(it.type);
        addFloatText(it.x, it.y - 12, popLabel, def.color);
        addLog(`Подобрано: ${popLabel}`);
        loot.splice(i, 1);

        if (capsChanged) saveProgress();

        if (mission && mission.type === 'collect' && mission.stage === 'gather') {
          mission.progress++;
          if (mission.progress >= mission.goal) {
            mission.stage = 'return';
            mission.desc = 'Все припасы собраны! Прорвитесь с грузом к центральному Бункеру-Депо.';
            addLog('Груз собран! Возвращайтесь в Бункер-Депо.', 'warn');
            spawnAmbushWave(2, 'Перехват груза на пути к Депо!');
          }
        }
        renderGarage();
      }
    }

    while (loot.length < 18) spawnLoot();
  }

  function updateMission(dt) {
    if (!mission) return;
    if (mission.type === 'collect' && mission.stage === 'return') {
      if (player.inDepot) completeMission();
    } else if (mission.type === 'hack' && mission.target) {
      if (dist(player, mission.target) <= mission.target.radius) {
        mission.progress = Math.min(mission.goal, mission.progress + dt);
        if (!mission.ambushTriggered && mission.progress >= 0.45) {
          mission.ambushTriggered = true;
          spawnAmbushWave(2, 'Сигнал взлома перехвачен — отряды идут на терминал!');
        }
        if (mission.progress >= mission.goal) completeMission();
      }
    } else if (mission.type === 'survive') {
      mission.progress = Math.min(mission.goal, mission.progress + dt);
      if (mission.progress >= mission.goal) completeMission();
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-3.5 * dt);
      p.vy *= Math.exp(-3.5 * dt);
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = skidmarks.length - 1; i >= 0; i--) {
      skidmarks[i].life -= dt;
      if (skidmarks[i].life <= 0) skidmarks.splice(i, 1);
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].life -= dt;
      if (ghosts[i].life <= 0) ghosts.splice(i, 1);
    }
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const f = floatTexts[i];
      f.y -= 28 * dt;
      f.life -= dt;
      if (f.life <= 0) floatTexts.splice(i, 1);
    }
    for (let i = lightFlashes.length - 1; i >= 0; i--) {
      lightFlashes[i].life -= dt;
      if (lightFlashes[i].life <= 0) lightFlashes.splice(i, 1);
    }
    // Редкие искры, поднимающиеся из ближайших горящих бочек
    if (player && Math.random() < 0.25) {
      for (const f of world.fires) {
        if (Math.abs(f.x - cam.x) < viewW && Math.abs(f.y - cam.y) < viewH && Math.random() < 0.14) {
          particles.push({
            x: f.x + (Math.random() - 0.5) * 8,
            y: f.y + (Math.random() - 0.5) * 8,
            vx: -14 + Math.random() * 28,
            vy: -24 - Math.random() * 24,
            size: 1.8 + Math.random() * 2,
            color: Math.random() < 0.5 ? '#ffb84d' : '#ff6828',
            life: 0.45 + Math.random() * 0.35,
            maxLife: 0.8
          });
        }
      }
    }
  }

  // ==================== ПОГОДА И ЦИФРОВОЙ ДОЖДЬ МАТРИЦЫ ====================
  function initDigitalRain() {
    const colCount = Math.max(10, Math.floor(viewW / 54));
    rainCols = [];
    for (let i = 0; i < colCount; i++) {
      rainCols.push({
        x: (i + 0.5) * (viewW / colCount),
        y: Math.random() * viewH,
        speed: 55 + Math.random() * 95,
        len: 4 + Math.floor(Math.random() * 5),
        chIdx: Math.floor(Math.random() * MATRIX_CHARS.length)
      });
    }
    // Ночной косой дождь + тлеющий пепел пустоши
    const dropCount = Math.min(85, Math.max(28, Math.floor((viewW * viewH) / 14000)));
    weatherDrops = [];
    for (let i = 0; i < dropCount; i++) {
      const isEmber = i % 5 === 0;
      weatherDrops.push({
        x: Math.random() * viewW,
        y: Math.random() * viewH,
        isEmber,
        speed: isEmber ? (24 + Math.random() * 32) : (320 + Math.random() * 240),
        len: isEmber ? (2 + Math.random() * 2) : (10 + Math.random() * 14),
        alpha: isEmber ? (0.35 + Math.random() * 0.4) : (0.09 + Math.random() * 0.14)
      });
    }
  }

  function updateDigitalRain(dt) {
    if (!prefs.rain) return;
    const mult = matrixActive ? 2.1 : 0.7;
    for (const c of rainCols) {
      c.y += c.speed * mult * dt;
      if (Math.random() < 0.14) c.chIdx = (c.chIdx + 1) % MATRIX_CHARS.length;
      if (c.y - c.len * 18 > viewH) c.y = -20 - Math.random() * 140;
    }
    const wMult = matrixActive ? 0.25 : 1.0;
    for (const d of weatherDrops) {
      if (d.isEmber) {
        d.x += (18 + Math.sin(elapsed * 2 + d.y * 0.02) * 14) * dt * wMult;
        d.y -= d.speed * dt * wMult;
        if (d.y < -10) { d.y = viewH + 10; d.x = Math.random() * viewW; }
        if (d.x > viewW + 10) d.x = -10;
      } else {
        d.x -= d.speed * 0.22 * dt * wMult;
        d.y += d.speed * dt * wMult;
        if (d.y > viewH + 20) { d.y = -20; d.x = Math.random() * (viewW + 120); }
        if (d.x < -20) d.x = viewW + 20;
      }
    }
  }

  // ==================== РЕНДЕР ИГРОВОГО ПОЛЯ (2.5D + КИБЕР-НУАР СВЕТ) ====================
  function render() {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#070a0d';
    ctx.fillRect(0, 0, viewW, viewH);

    const z = effectiveZoom();
    const sx = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;
    const sy = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;

    // Видимые мировые границы (для отсечения невидимых объектов)
    const halfW = (viewW / 2) / z + 260;
    const halfH = (viewH / 2) / z + 260;
    const visMinX = cam.x - halfW;
    const visMaxX = cam.x + halfW;
    const visMinY = cam.y - halfH;
    const visMaxY = cam.y + halfH;

    // --- СЛОЙ 1: УЛИЧНЫЙ УРОВЕНЬ (до освещения) ---
    ctx.save();
    ctx.translate(viewW / 2 + sx, viewH / 2 + sy);
    ctx.scale(z, z);
    ctx.translate(-cam.x, -cam.y);

    // 1. Запечённый текстурный асфальт — рисуем ТОЛЬКО видимую область карты (ускоряет Android GPU!)
    const mapSx = Math.max(0, Math.floor(visMinX));
    const mapSy = Math.max(0, Math.floor(visMinY));
    const mapEx = Math.min(world.WIDTH, Math.ceil(visMaxX));
    const mapEy = Math.min(world.HEIGHT, Math.ceil(visMaxY));
    const mapSw = mapEx - mapSx;
    const mapSh = mapEy - mapSy;
    if (mapSw > 0 && mapSh > 0) {
      ctx.drawImage(world.mapCanvas, mapSx, mapSy, mapSw, mapSh, mapSx, mapSy, mapSw, mapSh);
    }

    // 2. Мокрые лужи с отражением неона и кругами дождя
    drawPuddles(visMinX, visMaxX, visMinY, visMaxY);

    // 3. Разломы кода Матрицы на асфальте + терминалы
    drawMatrixRifts(visMinX, visMaxX, visMinY, visMaxY);
    drawTerminals();

    // 4. Следы шин
    for (const sk of skidmarks) {
      ctx.save();
      ctx.translate(sk.x, sk.y);
      ctx.rotate(sk.ang);
      ctx.fillStyle = `rgba(6, 8, 10, ${Math.min(0.55, sk.life * 0.14)})`;
      ctx.fillRect(-5, -6, 10, 3);
      ctx.fillRect(-5, 3, 10, 3);
      ctx.restore();
    }

    // 5. Лут, цифровые фантомы, враги и машина игрока
    for (const it of loot) {
      if (it.x > visMinX && it.x < visMaxX && it.y > visMinY && it.y < visMaxY) drawLootItem(it);
    }
    for (const g of ghosts) {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.ang);
      const a = (g.life / g.maxLife) * 0.42;
      ctx.strokeStyle = `rgba(57, 255, 136, ${a})`;
      ctx.fillStyle = `rgba(57, 255, 136, ${a * 0.35})`;
      ctx.lineWidth = 1.5;
      ctx.fillRect(-g.len / 2, -g.wid / 2, g.len, g.wid);
      ctx.strokeRect(-g.len / 2, -g.wid / 2, g.len, g.wid);
      ctx.restore();
    }
    for (const e of enemies) {
      if (e.x > visMinX && e.x < visMaxX && e.y > visMinY && e.y < visMaxY) drawEnemyCar(e);
    }
    if (player && player.hp > 0) drawPlayerCar();

    ctx.restore(); // выход из мировых координат для наложения карты света

    // --- СЛОЙ 2: ДИНАМИЧЕСКАЯ КАРТА НОЧНОГО ОСВЕЩЕНИЯ (multiply) ---
    if (prefs.noir) {
      renderNoirLightmap(z, sx, sy, visMinX, visMaxX, visMinY, visMaxY);
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(lightCanvas, 0, 0, viewW, viewH);
      ctx.restore();
    }

    // --- СЛОЙ 3: 2.5D ПЕРСПЕКТИВНЫЕ ЗДАНИЯ + СВЕТЯЩИЕСЯ ЭФФЕКТЫ (поверх тьмы!) ---
    ctx.save();
    ctx.translate(viewW / 2 + sx, viewH / 2 + sy);
    ctx.scale(z, z);
    ctx.translate(-cam.x, -cam.y);

    // 2.5D здания GTA 2 (фасады со светящимися окнами, крыши, неоновые вывески и маячки)
    drawBuildings25D(visMinX, visMaxX, visMinY, visMaxY);

    // Пламя в бочках, светящиеся плафоны фонарей и светофоры
    drawStreetEmissives(visMinX, visMaxX, visMinY, visMaxY);

    // Автонаводка (маркер цели на мобильном)
    if (lastAutoTarget) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 77, 90, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lastAutoTarget.x, lastAutoTarget.y, 26 + Math.sin(elapsed * 10) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Пули, трассеры и самонаводящиеся ракеты (светятся в темноте!)
    for (const b of bullets) {
      if (b.homing) {
        // Красный маркер захвата на цели ракеты
        if (b.targetId) {
          const tgt = enemies.find((e) => e.id === b.targetId);
          if (tgt) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 92, 66, 0.78)';
            ctx.lineWidth = 1.6;
            const r = tgt.len * 0.56 + Math.sin(elapsed * 16) * 2.5;
            ctx.beginPath();
            ctx.arc(tgt.x, tgt.y, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
        // Корпус ракеты + оперение + яркое реактивное пламя
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.ang);
        ctx.fillStyle = 'rgba(255, 130, 38, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-9, 0, 7 + Math.random() * 3, 3.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff0a6';
        ctx.beginPath();
        ctx.moveTo(-5, -1.8);
        ctx.lineTo(-12 - Math.random() * 4, 0);
        ctx.lineTo(-5, 1.8);
        ctx.closePath();
        ctx.fill();
        // Стабилизаторы
        ctx.fillStyle = b.owner === 'enemy' ? '#ff384c' : '#ffb84d';
        ctx.fillRect(-5.5, -4, 3, 8);
        // Корпус и боеголовка
        ctx.fillStyle = b.owner === 'enemy' ? '#2c1418' : '#e8f0ec';
        ctx.fillRect(-5, -2.1, 9, 4.2);
        ctx.fillStyle = b.owner === 'enemy' ? '#ff2a42' : '#ff384c';
        ctx.beginPath();
        ctx.moveTo(4, -2.2);
        ctx.lineTo(8.5, 0);
        ctx.lineTo(4, 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        continue;
      }

      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.radius * 0.95;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Огонь, искры и частицы взрывов
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Всплывающий текст
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    for (const f of floatTexts) {
      ctx.globalAlpha = clamp(f.life / f.maxLife, 0, 1);
      ctx.fillStyle = '#000';
      ctx.fillText(f.text, f.x + 1, f.y + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    ctx.restore(); // выход из мировых координат

    // --- СЛОЙ 4: ПОГОДА, ЦИФРОВОЙ ДОЖДЬ МАТРИЦЫ И КОМПАС ---
    if (prefs.rain) drawWeatherAndMatrixRain();
    if (player && gameState === 'playing') drawMissionCompass();

    ctx.restore();

    // Тактический радар (~15 Гц, без перерисовки скрытого ПК-радара на телефоне) и камера в кабине (~20 Гц)
    renderFrameCount++;
    if (renderFrameCount % 4 === 0) {
      if (minimapCanvas && minimapCanvas.offsetParent !== null) {
        renderMinimap(minimapCtx, minimapCanvas.width, minimapCanvas.height);
      }
      if (!el.mobileRadarFloat.classList.contains('hidden')) {
        renderMinimap(mobileMinimapCtx, mobileMinimapCanvas.width, mobileMinimapCanvas.height);
      }
    }
    if (renderFrameCount % 3 === 0) {
      renderDriverCam();
    }
  }

  let renderFrameCount = 0;

  // ==================== КАРТА ДИНАМИЧЕСКОГО СВЕТА (CYBER-NOIR, КЭШ СПРАЙТОВ ДЛЯ 60 FPS) ====================
  const glowSpriteCache = Object.create(null);
  function getGlowSprite(rCol, gCol, bCol) {
    const key = `${rCol},${gCol},${bCol}`;
    let spr = glowSpriteCache[key];
    if (spr) return spr;
    spr = document.createElement('canvas');
    spr.width = 64;
    spr.height = 64;
    const gCtx = spr.getContext('2d');
    const g = gCtx.createRadialGradient(32, 32, 1, 32, 32, 32);
    g.addColorStop(0, `rgba(${rCol},${gCol},${bCol},1)`);
    g.addColorStop(0.45, `rgba(${rCol},${gCol},${bCol},0.42)`);
    g.addColorStop(1, `rgba(${rCol},${gCol},${bCol},0)`);
    gCtx.fillStyle = g;
    gCtx.fillRect(0, 0, 64, 64);
    glowSpriteCache[key] = spr;
    return spr;
  }

  function addRadialLight(wx, wy, r, rCol, gCol, bCol, alpha) {
    if (alpha <= 0.01) return;
    const spr = getGlowSprite(rCol, gCol, bCol);
    const prevAlpha = lightCtx.globalAlpha;
    lightCtx.globalAlpha = Math.min(1, alpha);
    lightCtx.drawImage(spr, wx - r, wy - r, r * 2, r * 2);
    lightCtx.globalAlpha = prevAlpha;
  }

  function addHeadlightCone(wx, wy, ang, len, spread, rgbStr, alpha) {
    lightCtx.save();
    lightCtx.translate(wx, wy);
    lightCtx.rotate(ang);
    const g = lightCtx.createRadialGradient(12, 0, 8, len * 0.48, 0, len);
    g.addColorStop(0, `rgba(${rgbStr},${alpha})`);
    g.addColorStop(0.55, `rgba(${rgbStr},${alpha * 0.45})`);
    g.addColorStop(1, `rgba(${rgbStr},0)`);
    lightCtx.fillStyle = g;
    lightCtx.beginPath();
    lightCtx.moveTo(10, -8);
    lightCtx.lineTo(len, -spread);
    lightCtx.lineTo(len, spread);
    lightCtx.lineTo(10, 8);
    lightCtx.closePath();
    lightCtx.fill();
    lightCtx.restore();
  }

  function renderNoirLightmap(z, sx, sy, minX, maxX, minY, maxY) {
    const lw = lightCanvas.width;
    const lh = lightCanvas.height;
    const scale = lw / Math.max(1, viewW);

    lightCtx.save();
    lightCtx.setTransform(1, 0, 0, 1, 0, 0);
    lightCtx.globalCompositeOperation = 'source-over';
    // Ночной эмбиент под текущий сектор-биом (в Фокусе — фосфорно-зелёный)
    const secAmbient = (world && world.sector && world.sector.ambient) ? world.sector.ambient : '#26303d';
    lightCtx.fillStyle = matrixActive ? '#224433' : secAmbient;
    lightCtx.fillRect(0, 0, lw, lh);

    lightCtx.translate((viewW / 2 + sx) * scale, (viewH / 2 + sy) * scale);
    lightCtx.scale(z * scale, z * scale);
    lightCtx.translate(-cam.x, -cam.y);
    lightCtx.globalCompositeOperation = 'lighter';

    // Прожекторы Бункера-Депо
    if (world.depot.x > minX - 240 && world.depot.x < maxX + 240 && world.depot.y > minY - 240 && world.depot.y < maxY + 240) {
      addRadialLight(world.depot.x, world.depot.y, 260, 255, 196, 110, 0.85);
    }

    // Уличные фонари (тёплый натрий и холодный кибер-циан, с лёгким мерцанием)
    for (const sl of world.streetlights) {
      if (sl.x < minX - 180 || sl.x > maxX + 180 || sl.y < minY - 180 || sl.y > maxY + 180) continue;
      let mult = 1;
      if (sl.flicker) {
        const wave = Math.sin(elapsed * 19 + sl.phase) * Math.sin(elapsed * 7.3 + sl.phase * 2);
        if (wave > 0.72) mult = 0.22;
      }
      if (sl.color === '#38e8ff' || sl.color === '#48e8ff') {
        addRadialLight(sl.x, sl.y, sl.radius, 64, 224, 255, 0.65 * mult);
      } else {
        addRadialLight(sl.x, sl.y, sl.radius, 255, 175, 76, 0.74 * mult);
      }
    }

    // Горящие бочки — живой танцующий оранжевый свет
    for (const f of world.fires) {
      if (f.x < minX - 160 || f.x > maxX + 160 || f.y < minY - 160 || f.y > maxY + 160) continue;
      const flick = 0.82 + Math.sin(elapsed * 15 + f.phase) * 0.14 + Math.cos(elapsed * 27 + f.phase) * 0.08;
      addRadialLight(f.x, f.y, 130 * flick, 255, 118, 36, 0.82);
    }

    // Свечение радиационных кратеров
    for (const rz of world.radZones) {
      if (rz.x < minX - 140 || rz.x > maxX + 140 || rz.y < minY - 140 || rz.y > maxY + 140) continue;
      const p = 0.75 + 0.25 * Math.sin(elapsed * 2.8 + rz.x * 0.01);
      addRadialLight(rz.x, rz.y, rz.radius * 1.35, 155, 255, 58, 0.58 * p);
    }

    // Терминалы и разломы Матрицы
    for (const term of world.terminals) {
      if (term.x < minX - 140 || term.x > maxX + 140 || term.y < minY - 140 || term.y > maxY + 140) continue;
      addRadialLight(term.x, term.y, 125, 57, 255, 136, 0.72);
    }
    for (const rf of world.rifts) {
      if (rf.x < minX - 100 || rf.x > maxX + 100 || rf.y < minY - 100 || rf.y > maxY + 100) continue;
      addRadialLight(rf.x, rf.y, 82, 48, 255, 132, 0.52);
    }

    // Слабое свечение лута (виден в ночных переулках)
    for (const it of loot) {
      if (it.x < minX || it.x > maxX || it.y < minY || it.y > maxY) continue;
      addRadialLight(it.x, it.y, 44, 180, 235, 255, 0.36);
    }

    // Фары врагов (рейдеры — оранжевый, броневики — янтарный, Агенты — изумруд, Каратель — алый + изумруд!)
    for (const e of enemies) {
      if (e.x < minX - 180 || e.x > maxX + 180 || e.y < minY - 180 || e.y > maxY + 180) continue;
      if (e.kind === 'boss') {
        addHeadlightCone(e.x, e.y, e.ang, 250, 86, '255,68,88', 0.9);
        addRadialLight(e.x, e.y, 72, 255, 62, 82, 0.52);
      } else if (e.kind === 'agent') {
        addHeadlightCone(e.x, e.y, e.ang, 220, 68, '57,255,136', 0.82);
        addRadialLight(e.x, e.y, 52, 57, 255, 136, 0.45);
      } else if (e.kind === 'heavy') {
        addHeadlightCone(e.x, e.y, e.ang, 195, 66, '255,168,72', 0.76);
      } else {
        addHeadlightCone(e.x, e.y, e.ang, 175, 54, '255,135,72', 0.68);
      }
    }

    // Фары, ореол, неон Ядра Матрицы и стоп-сигналы игрока
    if (player && player.hp > 0) {
      const isPhantom = player.carClass === 4;
      const headRgb = (matrixActive || isPhantom) ? '90,255,175' : '255,244,205';
      addHeadlightCone(player.x, player.y, player.ang, 330, 112, headRgb, 0.98);
      if (player.matrixLvl >= 3 || isPhantom) {
        addRadialLight(player.x, player.y, 82, 57, 255, 136, isPhantom ? 0.56 : 0.42);
      }
      addRadialLight(player.x, player.y, 122, 225, 240, 230, 0.58);
      const bx = player.x - Math.cos(player.ang) * 20;
      const by = player.y - Math.sin(player.ang) * 20;
      addRadialLight(bx, by, 44, 255, 52, 68, 0.52);
    }

    // Вспышки от выстрелов и взрывов
    for (const fl of lightFlashes) {
      const k = clamp(fl.life / fl.maxLife, 0, 1);
      if (fl.color === '#39ff88') addRadialLight(fl.x, fl.y, fl.radius * (0.7 + 0.3 * k), 72, 255, 150, 0.95 * k);
      else addRadialLight(fl.x, fl.y, fl.radius * (0.7 + 0.3 * k), 255, 185, 92, 0.95 * k);
    }

    lightCtx.restore();
  }

  // ==================== 2.5D ПЕРСПЕКТИВНЫЕ ЗДАНИЯ (GTA 2 STYLE) ====================
  function drawWallWithWindows(b, bx1, by1, bx2, by2, rx1, ry1, rx2, ry2, shadeColor, faceIdx) {
    // 1. Основной полигон стены
    ctx.fillStyle = shadeColor;
    ctx.beginPath();
    ctx.moveTo(bx1, by1);
    ctx.lineTo(bx2, by2);
    ctx.lineTo(rx2, ry2);
    ctx.lineTo(rx1, ry1);
    ctx.closePath();
    ctx.fill();

    // 2. Карнизы и светящиеся окна (билинейная интерполяция по грани)
    const wallLen = Math.hypot(bx2 - bx1, by2 - by1);
    const floors = b.style === 'tower' ? 5 : b.style === 'cyber' ? 4 : b.style === 'apt' ? 3 : 2;
    const cols = Math.max(2, Math.floor(wallLen / 22));

    for (let f = 0; f < floors; f++) {
      const t0 = 0.14 + (f / floors) * 0.74;
      const t1 = t0 + (0.44 / floors);

      // Тонкая межэтажная линия
      const lx1 = bx1 + (rx1 - bx1) * (t0 - 0.03);
      const ly1 = by1 + (ry1 - by1) * (t0 - 0.03);
      const lx2 = bx2 + (rx2 - bx2) * (t0 - 0.03);
      const ly2 = by2 + (ry2 - by2) * (t0 - 0.03);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lx1, ly1);
      ctx.lineTo(lx2, ly2);
      ctx.stroke();

      for (let c = 0; c < cols; c++) {
        const u0 = (c + 0.22) / cols;
        const u1 = (c + 0.78) / cols;

        // Детерминированный хэш окна (часть светится, часть разбита/тёмная)
        const wh = Math.abs(Math.sin((b.seed * 913 + faceIdx * 37 + f * 17 + c * 11.7) * 12.9898) * 43758.5453) % 1;
        if (b.style === 'ruin' && wh > 0.24) continue;

        let winColor = 'rgba(7, 10, 14, 0.78)'; // тёмное/выбитое окно
        if (wh < 0.22) {
          winColor = b.style === 'cyber' ? 'rgba(57, 255, 136, 0.82)' : 'rgba(255, 186, 86, 0.85)';
        } else if (wh < 0.34 && (b.style === 'tower' || b.style === 'cyber')) {
          winColor = 'rgba(66, 230, 255, 0.78)';
        } else if (wh < 0.38) {
          // Мерцающее окно
          const flick = Math.sin(elapsed * 9 + c * 3 + f) > 0.2 ? 0.72 : 0.18;
          winColor = `rgba(255, 206, 120, ${flick})`;
        }

        const p = (u, t) => {
          const gx = bx1 + (bx2 - bx1) * u;
          const gy = by1 + (by2 - by1) * u;
          const tx = rx1 + (rx2 - rx1) * u;
          const ty = ry1 + (ry2 - ry1) * u;
          return [gx + (tx - gx) * t, gy + (ty - gy) * t];
        };
        const [x0, y0] = p(u0, t0);
        const [x1, y1] = p(u1, t0);
        const [x2, y2] = p(u1, t1);
        const [x3, y3] = p(u0, t1);

        ctx.fillStyle = winColor;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Неоновая полоса под карнизом на башнях и кибер-зданиях
    if (b.style === 'tower' || b.style === 'cyber') {
      ctx.strokeStyle = b.neonColor;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx1, ry1);
      ctx.lineTo(rx2, ry2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Тёмный контур ребра стены
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx1, by1);
    ctx.lineTo(rx1, ry1);
    ctx.moveTo(bx2, by2);
    ctx.lineTo(rx2, ry2);
    ctx.stroke();
  }

  function drawBuildings25D(minX, maxX, minY, maxY) {
    // 1. Отбираем видимые здания и сортируем от дальних к ближним (корректное перекрытие крыш)
    const vis = [];
    for (const b of world.buildings) {
      if (b.x + b.w < minX || b.x > maxX || b.y + b.h < minY || b.y > maxY) continue;
      const cx = b.x + b.w * 0.5;
      const cy = b.y + b.h * 0.5;
      const d2 = (cx - cam.x) * (cx - cam.x) + (cy - cam.y) * (cy - cam.y);
      vis.push({ b, d2 });
    }
    vis.sort((a, c) => c.d2 - a.d2);

    for (const item of vis) {
      const b = item.b;
      const k = b.height * 0.64; // перспектива вытягивания крыши вверх к камере
      const scale = 1 + k;

      const bx1 = b.x, by1 = b.y;
      const bx2 = b.x + b.w, by2 = b.y + b.h;

      const rx1 = cam.x + (bx1 - cam.x) * scale;
      const ry1 = cam.y + (by1 - cam.y) * scale;
      const rx2 = cam.x + (bx2 - cam.x) * scale;
      const ry2 = cam.y + (by2 - cam.y) * scale;
      const rw = rx2 - rx1;
      const rh = ry2 - ry1;

      // Рисуем только те грани (фасады), которые обращены к камере
      const darkWall = b.style === 'ruin' ? '#1c1713' : b.style === 'cyber' ? '#0d1714' : '#12171e';
      const litWall  = b.style === 'ruin' ? '#27201a' : b.style === 'cyber' ? '#14231e' : '#1a212b';

      if (ry1 > by1) drawWallWithWindows(b, bx1, by1, bx2, by1, rx1, ry1, rx2, ry1, litWall, 0);   // Северная стена
      if (ry2 < by2) drawWallWithWindows(b, bx1, by2, bx2, by2, rx1, ry2, rx2, ry2, darkWall, 1);  // Южная стена
      if (rx1 > bx1) drawWallWithWindows(b, bx1, by1, bx1, by2, rx1, ry1, rx1, ry2, litWall, 2);   // Западная стена
      if (rx2 < bx2) drawWallWithWindows(b, bx2, by1, bx2, by2, rx2, ry1, rx2, ry2, darkWall, 3);  // Восточная стена

      // Крыша здания в 2.5D координатах
      ctx.fillStyle = b.roofTone;
      ctx.fillRect(rx1, ry1, rw, rh);

      // Парапет крыши (фаска + тень)
      ctx.strokeStyle = b.style === 'cyber' ? '#264437' : '#2e3640';
      ctx.lineWidth = 3;
      ctx.strokeRect(rx1 + 1.5, ry1 + 1.5, rw - 3, rh - 3);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.fillRect(rx1 + 9, ry1 + 9, rw - 18, rh - 18);

      // Архитектурные детали на крыше
      if (b.style === 'tower') {
        // Вертолётная площадка (для крупных башен) или стеклянный купол
        if (b.bw >= 2 && b.bh >= 2) {
          const hx = rx1 + rw * 0.5;
          const hy = ry1 + rh * 0.5;
          const hr = Math.min(rw, rh) * 0.28;
          ctx.strokeStyle = 'rgba(255, 184, 77, 0.45)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(hx, hy, hr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255, 184, 77, 0.5)';
          ctx.font = `bold ${Math.round(hr * 0.9)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('H', hx, hy + 1);
        } else {
          // Вентиляция и технические блоки
          ctx.fillStyle = '#202832';
          ctx.fillRect(rx1 + 16, ry1 + 16, rw * 0.3, rh * 0.22);
          ctx.strokeStyle = '#33404f';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(rx1 + 16, ry1 + 16, rw * 0.3, rh * 0.22);
        }
        // Мигающие красные авиационные маячки по углам небоскрёба
        if (b.beacon) {
          const blink = Math.sin(elapsed * 4.2 + b.seed * 12) > 0.15;
          if (blink) {
            ctx.fillStyle = '#ff384c';
            ctx.beginPath();
            ctx.arc(rx1 + 6, ry1 + 6, 3.2, 0, Math.PI * 2);
            ctx.arc(rx2 - 6, ry2 - 6, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 56, 76, 0.28)';
            ctx.beginPath();
            ctx.arc(rx1 + 6, ry1 + 6, 10, 0, Math.PI * 2);
            ctx.arc(rx2 - 6, ry2 - 6, 10, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (b.style === 'cyber') {
        // Серверная решётка Матрицы на крыше
        ctx.strokeStyle = 'rgba(57, 255, 136, 0.32)';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(rx1 + 14, ry1 + 14, rw - 28, rh - 28);
        ctx.fillStyle = 'rgba(57, 255, 136, 0.14)';
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(rx1 + 20, ry1 + 22 + i * ((rh - 44) / 3), rw - 40, 6);
        }
      } else if (b.style === 'ruin') {
        // Провал обрушенной крыши + ржавые балки Fallout
        ctx.fillStyle = '#0a0b0c';
        ctx.beginPath();
        ctx.moveTo(rx1 + 18, ry1 + 20);
        ctx.lineTo(rx2 - 22, ry1 + 16);
        ctx.lineTo(rx2 - 16, ry2 - 24);
        ctx.lineTo(rx1 + 26, ry2 - 18);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#5a4331';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rx1 + 18, ry1 + 26); ctx.lineTo(rx2 - 18, ry2 - 30);
        ctx.moveTo(rx2 - 26, ry1 + 18); ctx.lineTo(rx1 + 28, ry2 - 20);
        ctx.stroke();
      } else {
        // Водонапорный бак + вентшахты на жилых крышах
        ctx.fillStyle = '#362d26';
        ctx.beginPath();
        ctx.arc(rx1 + rw * 0.3, ry1 + rh * 0.32, Math.min(15, rw * 0.14), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#604e3b';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.fillStyle = '#1e252c';
        ctx.fillRect(rx1 + rw * 0.56, ry1 + rh * 0.54, rw * 0.25, rh * 0.22);
      }

      // Неоновая вывеска на крыше (с мягким свечением)
      if (b.signText) {
        const signFlick = b.seed > 0.78 && Math.sin(elapsed * 22 + b.seed * 40) > 0.85 ? 0.25 : 1;
        ctx.save();
        ctx.globalAlpha = 0.92 * signFlick;
        const sx = rx1 + rw * 0.5;
        const sy = ry1 + rh - 18;
        ctx.fillStyle = 'rgba(5, 10, 12, 0.82)';
        const bw = b.signText.length * 8 + 14;
        ctx.fillRect(sx - bw / 2, sy - 9, bw, 17);
        ctx.strokeStyle = b.neonColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx - bw / 2, sy - 9, bw, 17);
        ctx.fillStyle = b.neonColor;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.signText, sx, sy);
        ctx.restore();
      }
    }
  }

  // ==================== ЖИВЫЕ ДЕТАЛИ УЛИЦ ====================
  function drawPuddles(minX, maxX, minY, maxY) {
    for (const p of world.puddles) {
      if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // Глянцевое зеркало лужи
      ctx.fillStyle = 'rgba(8, 14, 20, 0.65)';
      ctx.beginPath();
      ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      // Блик отражённого неона / фонаря
      ctx.fillStyle = p.tint;
      ctx.globalAlpha = 0.16 + 0.05 * Math.sin(elapsed * 3 + p.x);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.rx * 0.68, p.ry * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      // Круги на воде от капель дождя
      if (prefs.rain) {
        const rip = ((elapsed * 1.4 + p.x * 0.03) % 1);
        ctx.strokeStyle = p.tint;
        ctx.globalAlpha = (1 - rip) * 0.35;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc((p.rot - 1.5) * 3, 0, rip * Math.min(p.rx, p.ry) * 0.85, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawMatrixRifts(minX, maxX, minY, maxY) {
    for (const rf of world.rifts) {
      if (rf.x < minX || rf.x > maxX || rf.y < minY || rf.y > maxY) continue;
      ctx.save();
      ctx.translate(rf.x, rf.y);
      ctx.rotate(rf.ang);
      const pulse = 0.65 + 0.35 * Math.sin(elapsed * 5 + rf.seed * 20);
      // Проступающая сквозь трещину асфальта скрытая сетка кода Матрицы
      ctx.strokeStyle = `rgba(57, 255, 136, ${0.22 * pulse})`;
      ctx.lineWidth = 1;
      for (let gx = -rf.len * 0.45; gx <= rf.len * 0.45; gx += 12) {
        ctx.beginPath();
        ctx.moveTo(gx, -8);
        ctx.lineTo(gx, 8);
        ctx.stroke();
      }
      ctx.strokeStyle = `rgba(57, 255, 136, ${0.82 * pulse})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-rf.len / 2, 0);
      ctx.lineTo(-rf.len * 0.15, -5);
      ctx.lineTo(rf.len * 0.18, 4);
      ctx.lineTo(rf.len / 2, -2);
      ctx.stroke();
      // Светящиеся символы кода из разлома
      ctx.fillStyle = `rgba(145, 255, 185, ${0.72 * pulse})`;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      const idx = Math.floor(elapsed * 8 + rf.seed * 30) % MATRIX_CHARS.length;
      ctx.fillText(MATRIX_CHARS[idx] + MATRIX_CHARS[(idx + 5) % MATRIX_CHARS.length], 0, -9);
      ctx.restore();
    }
  }

  function drawStreetEmissives(minX, maxX, minY, maxY) {
    // Горящие бочки (огонь всегда яркий поверх ночной тьмы)
    for (const f of world.fires) {
      if (f.x < minX || f.x > maxX || f.y < minY || f.y > maxY) continue;
      // Железная бочка
      ctx.fillStyle = '#2c221d';
      ctx.strokeStyle = '#5c4230';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Живое пламя
      const s = 0.8 + 0.3 * Math.sin(elapsed * 18 + f.phase);
      ctx.fillStyle = 'rgba(255, 102, 24, 0.85)';
      ctx.beginPath();
      ctx.arc(f.x, f.y, 6.2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe27a';
      ctx.beginPath();
      ctx.arc(f.x + Math.sin(elapsed * 24 + f.phase) * 1.4, f.y - 1, 3.2 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Светящиеся лампы на столбах фонарей
    for (const sl of world.streetlights) {
      if (sl.x < minX || sl.x > maxX || sl.y < minY || sl.y > maxY) continue;
      if (sl.flicker && Math.sin(elapsed * 19 + sl.phase) * Math.sin(elapsed * 7.3 + sl.phase * 2) > 0.72) continue;
      ctx.fillStyle = sl.color;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Светофоры на перекрёстках
    for (const tl of world.trafficLights) {
      if (tl.x < minX || tl.x > maxX || tl.y < minY || tl.y > maxY) continue;
      const cycle = (elapsed + tl.phase) % 8;
      const col = cycle < 3.4 ? '#ff3c4c' : cycle < 4.2 ? '#ffb84d' : '#39ff88';
      ctx.fillStyle = '#11161a';
      ctx.fillRect(tl.x - 4, tl.y - 4, 8, 8);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(tl.x, tl.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.arc(tl.x, tl.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawWeatherAndMatrixRain() {
    ctx.save();
    const wMode = (world && world.sector && world.sector.weather) ? world.sector.weather : 'rain';
    // 1. Осадки по биому: дождь / песчаная буря / промышленный смог / цифровой шторм
    ctx.lineWidth = wMode === 'dust' ? 1.5 : 1.1;
    for (const d of weatherDrops) {
      if (d.isEmber || wMode === 'dust') {
        if (wMode === 'dust') {
          ctx.strokeStyle = `rgba(225, 162, 92, ${d.alpha * 0.85})`;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.len * 1.45, d.y + d.len * 0.42);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(255, 168, 72, ${d.alpha})`;
          ctx.fillRect(d.x, d.y, d.len, d.len);
        }
      } else if (wMode === 'smog') {
        ctx.fillStyle = `rgba(155, 178, 192, ${d.alpha * 0.55})`;
        ctx.fillRect(d.x, d.y, d.len * 0.55, 1.8);
      } else {
        ctx.strokeStyle = (matrixBreach > 0.4 || wMode === 'code')
          ? `rgba(110, 255, 175, ${d.alpha * (1 + matrixBreach * 0.5)})`
          : `rgba(170, 205, 225, ${d.alpha})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * 0.24, d.y + d.len);
        ctx.stroke();
      }
    }

    // Тёплый пыльный фильтр в Ржавой Пустоши / холодный туман в Промзоне
    if (wMode === 'dust' && !matrixActive) {
      ctx.fillStyle = 'rgba(148, 86, 36, 0.09)';
      ctx.fillRect(0, 0, viewW, viewH);
    } else if (wMode === 'smog' && !matrixActive) {
      ctx.fillStyle = 'rgba(38, 62, 78, 0.08)';
      ctx.fillRect(0, 0, viewW, viewH);
    }

    // 2. Скрытый код Системы: в секторе 04 (Ядро Системы) слегка виден всегда!
    const codeVisual = wMode === 'code' ? Math.max(matrixBreach, 0.34) : matrixBreach;
    if (codeVisual > 0.04) {
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      const baseAlpha = clamp(codeVisual * 0.30, 0, 0.30);
      for (const c of rainCols) {
        for (let k = 0; k < c.len; k++) {
          const y = c.y - k * 15;
          if (y < -15 || y > viewH + 15) continue;
          const ch = MATRIX_CHARS[(c.chIdx + k * 3) % MATRIX_CHARS.length];
          ctx.fillStyle = k === 0
            ? `rgba(195, 255, 218, ${baseAlpha * 1.65})`
            : `rgba(57, 255, 136, ${baseAlpha * (1 - k / c.len)})`;
          ctx.fillText(ch, c.x, y);
        }
      }
    }

    // 3. Короткий ЭЛТ-глитч при уроне или входе в Фокус Матрицы
    if (glitchTimer > 0) {
      const slices = 3;
      for (let i = 0; i < slices; i++) {
        const gy = Math.random() * viewH;
        const gh = 2 + Math.random() * 6;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(57, 255, 136, 0.18)' : 'rgba(56, 232, 255, 0.14)';
        ctx.fillRect(0, gy, viewW, gh);
      }
    }
    ctx.restore();
  }

  function drawTerminals() {
    for (const term of world.terminals) {
      const isTarget = mission && mission.type === 'hack' && mission.target && mission.target.name === term.name;
      ctx.save();
      ctx.translate(term.x, term.y);

      const pulse = 0.5 + 0.5 * Math.sin(elapsed * (isTarget ? 6 : 2.5));
      const r = isTarget ? mission.target.radius : 28;
      ctx.strokeStyle = isTarget ? `rgba(57, 255, 136, ${0.5 + pulse * 0.45})` : 'rgba(57, 255, 136, 0.25)';
      ctx.lineWidth = isTarget ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      if (isTarget) {
        // Прогресс-дуга взлома
        const frac = clamp(mission.progress / mission.goal, 0, 1);
        ctx.strokeStyle = '#38e8ff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, r - 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
        ctx.stroke();
      }

      // Сам серверный столбик
      ctx.fillStyle = '#0c2416';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.strokeStyle = '#39ff88';
      ctx.lineWidth = 2;
      ctx.strokeRect(-10, -10, 20, 20);
      ctx.fillStyle = '#39ff88';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(term.name, 0, -16);
      ctx.restore();
    }
  }

  function drawLootItem(it) {
    const def = LOOT_DEFS[it.type];
    const r = 9 + Math.sin(it.pulse) * 1.8;
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.fillStyle = def.color + '33';
    ctx.beginPath();
    ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#08130b';
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = def.color;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.short, 0, 0.5);
    ctx.restore();
  }

  function drawPlayerCar() {
    const spec = getCarSpec();
    const hl = spec.len / 2;
    const hw = spec.wid / 2;
    const spd = Math.hypot(player.vx, player.vy);
    const pulse = 0.65 + 0.35 * Math.sin(elapsed * 7);

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.ang);

    // Неоновая подсветка днища при Ядре Матрицы ур.3+ или на MATRIX PHANTOM
    if (player.matrixLvl >= 3 || spec.style === 'phantom' || matrixActive) {
      const aura = ctx.createRadialGradient(0, 0, hw * 0.4, 0, 0, hl * 1.45);
      aura.addColorStop(0, `rgba(57, 255, 136, ${spec.style === 'phantom' ? 0.34 : 0.24})`);
      aura.addColorStop(1, 'rgba(57, 255, 136, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.ellipse(0, 0, hl * 1.38, hw * 1.65, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Конусы фар (вперёд по +X)
    const beamLen = spec.style === 'warrig' ? 112 : 98;
    const beam = ctx.createLinearGradient(hl, 0, hl + beamLen, 0);
    beam.addColorStop(0, (matrixActive || spec.style === 'phantom')
      ? 'rgba(57, 255, 136, 0.36)'
      : 'rgba(255, 244, 190, 0.29)');
    beam.addColorStop(1, 'rgba(255, 244, 190, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(hl, -hw + 2);
    ctx.lineTo(hl + beamLen, -hw - 28);
    ctx.lineTo(hl + beamLen, hw + 28);
    ctx.lineTo(hl, hw - 2);
    ctx.closePath();
    ctx.fill();

    // Тень под машиной
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.fillRect(-hl + 3, -hw + 4, spec.len + (player.armorLvl >= 3 ? 5 : 0), spec.wid);

    // Колёса (4 или 6 колёс на WAR RIG MK-IV!)
    const wheelOut = spec.style === 'buggy' ? 3.5 : 2.4;
    ctx.fillStyle = '#0a0f0c';
    ctx.strokeStyle = '#2a352f';
    ctx.lineWidth = 1;
    const wheelPositions = spec.wheels === 6
      ? [hl - 10, -4, -hl + 7]
      : [hl - 9.5, -hl + 7.5];
    for (const wx of wheelPositions) {
      const ww = spec.wheels === 6 ? 9.5 : (spec.style === 'buggy' ? 9.5 : 8.5);
      const wh = spec.style === 'buggy' ? 4.8 : 4.2;
      ctx.fillRect(wx - ww / 2, -hw - wheelOut, ww, wh);
      ctx.fillRect(wx - ww / 2, hw + wheelOut - wh, ww, wh);
      ctx.strokeRect(wx - ww / 2, -hw - wheelOut, ww, wh);
      ctx.strokeRect(wx - ww / 2, hw + wheelOut - wh, ww, wh);
    }

    // ДВИГАТЕЛЬ ур.2+: боковые выхлопные трубы вдоль бортов
    if (player.engineLvl >= 2) {
      ctx.fillStyle = '#8b9992';
      ctx.fillRect(-hl + 5, -hw - 2.3, spec.len * 0.48, 2.2);
      ctx.fillRect(-hl + 5, hw + 0.1, spec.len * 0.48, 2.2);
      ctx.fillStyle = '#ff8a36';
      ctx.fillRect(-hl + 3, -hw - 2.2, 2.4, 2.0);
      ctx.fillRect(-hl + 3, hw + 0.2, 2.4, 2.0);
    }

    // ДВИГАТЕЛЬ ур.4: задние нитро-сопла + живой форсаж на скорости
    if (player.engineLvl >= 4) {
      ctx.fillStyle = '#364a4f';
      ctx.fillRect(-hl - 4, -hw * 0.55, 4.5, 4);
      ctx.fillRect(-hl - 4, hw * 0.55 - 4, 4.5, 4);
      if (spd > 95) {
        const fl = 6 + clamp(spd / 45, 0, 9) + Math.random() * 4;
        ctx.fillStyle = 'rgba(56, 232, 255, 0.85)';
        ctx.beginPath();
        ctx.moveTo(-hl - 4, -hw * 0.55);
        ctx.lineTo(-hl - 4 - fl, -hw * 0.55 + 2);
        ctx.lineTo(-hl - 4, -hw * 0.55 + 4);
        ctx.moveTo(-hl - 4, hw * 0.55 - 4);
        ctx.lineTo(-hl - 4 - fl, hw * 0.55 - 2);
        ctx.lineTo(-hl - 4, hw * 0.55);
        ctx.closePath();
        ctx.fill();
      }
    }

    // БРОНЯ ур.2+: навесные бронеюбки по бортам
    if (player.armorLvl >= 2) {
      ctx.fillStyle = '#2d3733';
      ctx.strokeStyle = player.armorLvl >= 4 ? '#38e8ff' : '#73857b';
      ctx.lineWidth = 1.1;
      ctx.fillRect(-hl + 6, -hw - 2.8, spec.len - 12, 3.2);
      ctx.strokeRect(-hl + 6, -hw - 2.8, spec.len - 12, 3.2);
      ctx.fillRect(-hl + 6, hw - 0.4, spec.len - 12, 3.2);
      ctx.strokeRect(-hl + 6, hw - 0.4, spec.len - 12, 3.2);
    }

    // ОСНОВНОЙ КУЗОВ (уникальная геометрия для каждого из 5 классов!)
    ctx.fillStyle = spec.fill;
    ctx.strokeStyle = matrixActive
      ? '#39ff88'
      : (player.armorLvl >= 4 ? '#5cebff' : (spec.style === 'phantom' ? '#39ff88' : '#0a120d'));
    ctx.lineWidth = player.armorLvl >= 4 ? 2.2 : 1.9;

    if (spec.style === 'buggy') {
      // Класс I: сужающийся нос багги + открытая рама
      ctx.beginPath();
      ctx.moveTo(hl, -hw * 0.65);
      ctx.lineTo(hl - 6, -hw);
      ctx.lineTo(-hl, -hw);
      ctx.lineTo(-hl, hw);
      ctx.lineTo(hl - 6, hw);
      ctx.lineTo(hl, hw * 0.65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Полоса Vault по центру капота
      ctx.fillStyle = spec.stripe;
      ctx.fillRect(-hl + 3, -3.5, spec.len - 7, 7);
      ctx.fillStyle = spec.trim;
      ctx.fillRect(-hl + 3, -1.2, spec.len - 7, 2.4);

      // Трубчатый каркас безопасности
      ctx.strokeStyle = '#9aa8a0';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(-hl + 6, -hw + 2.5, spec.len * 0.46, spec.wid - 5);
    } else if (spec.style === 'muscle') {
      // Класс II: широкий мускул-кар с фастбэк-решёткой сзади
      ctx.fillRect(-hl, -hw, spec.len, spec.wid);
      ctx.strokeRect(-hl, -hw, spec.len, spec.wid);
      // Сине-жёлтая гоночная полоса Vault-0
      ctx.fillStyle = spec.stripe;
      ctx.fillRect(-hl + 2, -4.5, spec.len - 4, 9);
      ctx.fillStyle = spec.trim;
      ctx.fillRect(-hl + 2, -1.4, spec.len - 4, 2.8);
      // Жалюзи на заднем стекле
      ctx.fillStyle = '#182124';
      ctx.fillRect(-hl + 3, -hw + 3.5, 8, spec.wid - 7);
      ctx.strokeStyle = '#38464c';
      ctx.lineWidth = 1;
      for (let lx = -hl + 5; lx <= -hl + 9; lx += 2.2) {
        ctx.beginPath();
        ctx.moveTo(lx, -hw + 4);
        ctx.lineTo(lx, hw - 4);
        ctx.stroke();
      }
    } else if (spec.style === 'enforcer') {
      // Класс III: тяжёлый бронированный пикап Vault-Blue с кузовом сзади
      ctx.fillRect(-hl, -hw, spec.len, spec.wid);
      ctx.strokeRect(-hl, -hw, spec.len, spec.wid);
      // Утопленный кузов пикапа сзади
      ctx.fillStyle = '#132433';
      ctx.fillRect(-hl + 2.5, -hw + 3, spec.len * 0.34, spec.wid - 6);
      ctx.strokeStyle = '#5c8cb5';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-hl + 2.5, -hw + 3, spec.len * 0.34, spec.wid - 6);
      // Жёлтые предупредительные полосы по бортам
      ctx.fillStyle = spec.trim;
      ctx.fillRect(0, -hw + 1.5, hl - 4, 2.2);
      ctx.fillRect(0, hw - 3.7, hl - 4, 2.2);
    } else if (spec.style === 'warrig') {
      // Класс IV: массивный 6-колёсный боевой грузовик Mad Max
      ctx.fillRect(-hl, -hw, spec.len, spec.wid);
      ctx.strokeRect(-hl, -hw, spec.len, spec.wid);
      // Задняя грузовая бронеплатформа
      ctx.fillStyle = '#2a241f';
      ctx.fillRect(-hl + 2.5, -hw + 2.5, spec.len * 0.44, spec.wid - 5);
      // Усиленная кабина и длинный капот
      ctx.fillStyle = '#62564b';
      ctx.fillRect(2, -hw + 2, hl - 4, spec.wid - 4);
      // Жёлто-оранжевая полоса опасности по капоту
      ctx.fillStyle = spec.trim;
      ctx.fillRect(4, -2.5, hl - 7, 5);
      // Вертикальные хромированные выхлопные трубы за кабиной
      ctx.fillStyle = '#cfd8d3';
      ctx.beginPath();
      ctx.arc(-2, -hw + 2, 2.8, 0, Math.PI * 2);
      ctx.arc(-2, hw - 2, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Класс V: MATRIX PHANTOM — стелс-обводы + светящиеся изумрудные контуры + спойлер
      ctx.beginPath();
      ctx.moveTo(hl + 2, -hw * 0.55);
      ctx.lineTo(hl - 7, -hw);
      ctx.lineTo(-hl, -hw);
      ctx.lineTo(-hl - 2, -hw * 0.85);
      ctx.lineTo(-hl - 2, hw * 0.85);
      ctx.lineTo(-hl, hw);
      ctx.lineTo(hl - 7, hw);
      ctx.lineTo(hl + 2, hw * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Светящиеся изумрудные линии кода по капоту и крыльям
      ctx.strokeStyle = `rgba(57, 255, 136, ${0.65 + pulse * 0.35})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(hl - 4, -hw * 0.35);
      ctx.lineTo(2, -hw * 0.55);
      ctx.lineTo(-hl + 5, -hw * 0.55);
      ctx.moveTo(hl - 4, hw * 0.35);
      ctx.lineTo(2, hw * 0.55);
      ctx.lineTo(-hl + 5, hw * 0.55);
      ctx.stroke();

      // Задний кибер-спойлер
      ctx.fillStyle = '#09120e';
      ctx.strokeStyle = '#39ff88';
      ctx.lineWidth = 1.3;
      ctx.fillRect(-hl - 2.5, -hw - 1.5, 4, spec.wid + 3);
      ctx.strokeRect(-hl - 2.5, -hw - 1.5, 4, spec.wid + 3);
    }

    // Лобовое стекло (спереди кабины)
    const wsX = spec.style === 'warrig' ? 4 : hl - 14;
    ctx.fillStyle = spec.style === 'phantom' ? 'rgba(57, 255, 136, 0.35)' : '#102429';
    ctx.fillRect(wsX, -hw + 3.2, 6.5, spec.wid - 6.4);

    // БРОНЯ ур.4: бронерешётка на лобовом стекле + шипы сзади
    if (player.armorLvl >= 4) {
      ctx.strokeStyle = '#9db5ad';
      ctx.lineWidth = 1.2;
      for (let wy = -hw + 5; wy < hw - 4; wy += 3.5) {
        ctx.beginPath();
        ctx.moveTo(wsX, wy);
        ctx.lineTo(wsX + 6.5, wy);
        ctx.stroke();
      }
      ctx.fillStyle = '#cfd9d4';
      ctx.fillRect(-hl - 2.5, -hw + 2, 2.5, 3);
      ctx.fillRect(-hl - 2.5, hw - 5, 2.5, 3);
    }

    // ДВИГАТЕЛЬ ур.3+: хромированный V8 нагнетатель-блоуэр прямо на капоте!
    if (player.engineLvl >= 3) {
      const bx = hl - 8.5;
      ctx.fillStyle = '#c8d6d0';
      ctx.strokeStyle = '#1b2421';
      ctx.lineWidth = 1;
      ctx.fillRect(bx, -3.6, 6.5, 7.2);
      ctx.strokeRect(bx, -3.6, 6.5, 7.2);
      ctx.fillStyle = '#ff5938';
      ctx.fillRect(bx + 4.4, -2.5, 1.8, 5);
    }

    // ЯДРО МАТРИЦЫ ур.2+: светящиеся изумрудные решётки / реактор сзади!
    if (player.matrixLvl >= 2) {
      ctx.fillStyle = `rgba(57, 255, 136, ${0.55 + pulse * 0.45})`;
      ctx.fillRect(-hl + 4, -hw + 4.5, 3.2, spec.wid - 9);
      if (player.matrixLvl >= 3) {
        ctx.beginPath();
        ctx.arc(-hl + 10.5, 0, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38e8ff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // БРОНЯ ур.3+ (или WAR RIG): мощный шипастый таранный отвал Mad Max спереди!
    if (player.armorLvl >= 3 || spec.style === 'warrig') {
      ctx.fillStyle = '#4c5752';
      ctx.strokeStyle = '#c2d1c9';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hl - 1, -hw - 2.5);
      ctx.lineTo(hl + 5.5, -hw + 1.5);
      ctx.lineTo(hl + 7.5, 0);
      ctx.lineTo(hl + 5.5, hw - 1.5);
      ctx.lineTo(hl - 1, hw + 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Стальные шипы на отвале
      ctx.fillStyle = '#e2ede7';
      const spikes = [-hw * 0.72, -hw * 0.35, 0, hw * 0.35, hw * 0.72];
      for (const sy of spikes) {
        const tipX = Math.abs(sy) < 2 ? hl + 11 : hl + 8.8;
        ctx.beginPath();
        ctx.moveTo(hl + 4.5, sy - 1.4);
        ctx.lineTo(tipX, sy);
        ctx.lineTo(hl + 4.5, sy + 1.4);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Фары и стоп-огни
    ctx.fillStyle = spec.style === 'phantom' ? '#9cffc3' : '#fff7be';
    ctx.fillRect(hl - 2, -hw + 2, 3, 4);
    ctx.fillRect(hl - 2, hw - 6, 3, 4);
    if (spec.style === 'muscle' || spec.style === 'warrig') {
      ctx.fillRect(hl - 2, -hw + 7, 2.5, 2.8);
      ctx.fillRect(hl - 2, hw - 9.8, 2.5, 2.8);
    }
    ctx.fillStyle = '#ff4252';
    ctx.fillRect(-hl - 1, -hw + 2, 2.2, 4);
    ctx.fillRect(-hl - 1, hw - 6, 2.2, 4);

    ctx.restore();

    // ВРАЩАЮЩАЯСЯ ТУРЕЛЬ НА КРЫШЕ + ПУСКОВЫЕ БЛОКИ САМОНАВОДЯЩИХСЯ РАКЕТ!
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.turretAng);

    // Пусковые блоки самонаводящихся ракет (missileLvl 1..3)
    const mLvl = player.missileLvl || 0;
    if (mLvl > 0) {
      const armed = player.missileCd <= 0.15;
      const drawPod = (py) => {
        ctx.fillStyle = '#2b3430';
        ctx.strokeStyle = '#ffb84d';
        ctx.lineWidth = 1.1;
        ctx.fillRect(-7.5, py - 2.6, 11, 5.2);
        ctx.strokeRect(-7.5, py - 2.6, 11, 5.2);
        // Красные/янтарные боеголовки, когда ракеты готовы к пуску
        ctx.fillStyle = armed ? '#ff4252' : '#525c56';
        ctx.fillRect(3.2, py - 1.8, 2.4, 1.5);
        ctx.fillRect(3.2, py + 0.3, 2.4, 1.5);
      };
      drawPod(-9.2);
      if (mLvl >= 2) drawPod(9.2);
    }

    // Бронированная башня турели
    ctx.fillStyle = '#17281e';
    ctx.strokeStyle = player.weaponLvl >= 3 ? '#39ff88' : '#ffb84d';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, player.weaponLvl >= 2 ? 7.2 : 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Стволы (визуальная эволюция от 1 пулемёта -> сдвоенный -> 2× плазма -> 3× плазма!)
    if (player.weaponLvl >= 4) {
      // Ур.4: Три-плазменный комплекс
      ctx.fillStyle = '#254a35';
      ctx.fillRect(2, -5.2, 13.5, 10.4);
      ctx.fillStyle = '#39ff88';
      ctx.fillRect(4, -4.3, 14.5, 2.4);
      ctx.fillRect(4, 1.9, 14.5, 2.4);
      ctx.fillStyle = '#38e8ff';
      ctx.fillRect(5, -1.2, 16.5, 2.4);
    } else if (player.weaponLvl === 3) {
      // Ур.3: Сдвоенная плазменная автопушка
      ctx.fillStyle = '#1c3b2a';
      ctx.fillRect(3, -4.5, 9, 9);
      ctx.fillStyle = '#39ff88';
      ctx.fillRect(4, -3.8, 14.5, 2.5);
      ctx.fillRect(4, 1.3, 14.5, 2.5);
      ctx.fillStyle = '#b6ffd3';
      ctx.fillRect(15.5, -3.5, 3, 1.9);
      ctx.fillRect(15.5, 1.6, 3, 1.9);
    } else if (player.weaponLvl === 2) {
      // Ур.2: Сдвоенный тяжёлый пулемёт + боковые барабаны патронов
      ctx.fillStyle = '#4a3d28';
      ctx.fillRect(-3.5, -7.2, 5.5, 2.2);
      ctx.fillRect(-3.5, 5.0, 5.5, 2.2);
      ctx.fillStyle = '#d4a652';
      ctx.fillRect(4, -3.6, 13.8, 2.3);
      ctx.fillRect(4, 1.3, 13.8, 2.3);
      ctx.fillStyle = '#fff0b3';
      ctx.fillRect(16, -3.5, 2, 2.1);
      ctx.fillRect(16, 1.4, 2, 2.1);
    } else {
      // Ур.1: Одиночный крупнокалиберный пулемёт
      ctx.fillStyle = '#ffb84d';
      ctx.fillRect(4, -1.7, 13, 3.4);
      ctx.fillStyle = '#6b5328';
      ctx.fillRect(4, -1.7, 5, 3.4);
    }

    ctx.restore();
  }

  function drawEnemyCar(e) {
    const isAgent = e.kind === 'agent';
    const isBoss = e.kind === 'boss';
    const isHeavy = e.kind === 'heavy';
    const eTier = e.tier || 1;
    const hl = e.len / 2;
    const hw = e.wid / 2;

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.ang);

    // Фары врага
    const beamLen = isBoss ? 86 : (isAgent ? 70 : 58);
    const beam = ctx.createLinearGradient(hl, 0, hl + beamLen, 0);
    beam.addColorStop(0, isBoss
      ? 'rgba(255, 62, 82, 0.38)'
      : isAgent
        ? 'rgba(57, 255, 136, 0.36)'
        : isHeavy
          ? 'rgba(255, 168, 72, 0.30)'
          : 'rgba(255, 110, 80, 0.24)');
    beam.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(hl, -hw + 2);
    ctx.lineTo(hl + beamLen, -hw - 16);
    ctx.lineTo(hl + beamLen, hw + 16);
    ctx.lineTo(hl, hw - 2);
    ctx.closePath();
    ctx.fill();

    // Колёса (6 колёс на Карателе!)
    ctx.fillStyle = '#090c0b';
    const wxs = isBoss ? [hl - 10, -2, -hl + 7] : [hl - 9, -hl + 7];
    for (const wx of wxs) {
      ctx.fillRect(wx - 4.5, -hw - 2.2, 9, 3.8);
      ctx.fillRect(wx - 4.5, hw - 1.6, 9, 3.8);
    }

    // Бортовая броня на усиленных врагах (MK-II+)
    if (eTier >= 2 && !isBoss) {
      ctx.fillStyle = '#2b312f';
      ctx.strokeStyle = isAgent ? '#39ff88' : '#ffb84d';
      ctx.lineWidth = 0.9;
      ctx.fillRect(-hl + 5, -hw - 2.2, e.len - 10, 2.5);
      ctx.fillRect(-hl + 5, hw - 0.3, e.len - 10, 2.5);
      if (eTier >= 3) {
        ctx.strokeRect(-hl + 5, -hw - 2.2, e.len - 10, 2.5);
        ctx.strokeRect(-hl + 5, hw - 0.3, e.len - 10, 2.5);
      }
    }

    // Кузов
    ctx.fillStyle = isBoss ? '#1c1014' : (isAgent ? '#0f1a14' : (isHeavy ? '#54463d' : (eTier >= 3 ? '#7c2b22' : '#9c3a2b')));
    ctx.strokeStyle = isBoss ? '#ff3d52' : (isAgent ? '#39ff88' : (isHeavy ? '#ffb84d' : (eTier >= 2 ? '#ffaa52' : '#ff8c52')));
    ctx.lineWidth = isBoss ? 2.4 : (eTier >= 3 ? 2.1 : 1.8);
    ctx.fillRect(-hl, -hw, e.len, e.wid);
    ctx.strokeRect(-hl, -hw, e.len, e.wid);

    // Отличительные детали класса врага
    if (isBoss) {
      // Каратель Системы: шипастый таран + багровая броня + реактор Матрицы
      ctx.fillStyle = '#3d151d';
      ctx.fillRect(-hl + 4, -hw + 3, e.len - 8, e.wid - 6);
      ctx.fillStyle = '#39ff88';
      ctx.fillRect(-hl + 5, -3, 6, 6);
      ctx.fillStyle = '#ff4d5a';
      ctx.beginPath();
      ctx.moveTo(hl, -hw - 2);
      ctx.lineTo(hl + 8, 0);
      ctx.lineTo(hl, hw + 2);
      ctx.closePath();
      ctx.fill();
    } else if (isHeavy) {
      // Броневик рейдеров: передний кенгурятник + полоса брони (+ клин-таран на MK-III+)
      ctx.fillStyle = '#302925';
      ctx.fillRect(-hl + 3, -hw + 3, e.len * 0.4, e.wid - 6);
      ctx.fillStyle = '#ffb84d';
      if (eTier >= 3) {
        ctx.beginPath();
        ctx.moveTo(hl, -hw - 1);
        ctx.lineTo(hl + 6, 0);
        ctx.lineTo(hl, hw + 1);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(hl, -hw + 1, 4, e.wid - 2);
      }
    } else if (isAgent) {
      ctx.fillStyle = '#39ff88';
      ctx.fillRect(-hl + 3, -1.2, e.len - 6, 2.4);
      if (eTier >= 3) {
        ctx.fillStyle = 'rgba(56, 232, 255, 0.85)';
        ctx.fillRect(-hl + 4, -hw + 2, e.len - 10, 1.5);
        ctx.fillRect(-hl + 4, hw - 3.5, e.len - 10, 1.5);
      }
    } else {
      ctx.fillStyle = '#ffbe76';
      ctx.fillRect(hl, -hw + 2, 2.6, 3);
      ctx.fillRect(hl, hw - 5, 2.6, 3);
      if (eTier >= 3) {
        ctx.fillStyle = '#d4ded8';
        ctx.fillRect(hl, -hw + 0.5, 3.8, e.wid - 1);
      }
    }

    // Стекло
    ctx.fillStyle = isBoss
      ? 'rgba(255, 65, 86, 0.5)'
      : (isAgent ? 'rgba(57, 255, 136, 0.38)' : '#251410');
    ctx.fillRect(hl - 13, -hw + 3, 6, e.wid - 6);
    ctx.restore();

    // Турель на Броневике, Карателе и Боевых Рейдерах/Агентах MK-III+
    if (isHeavy || isBoss || eTier >= 3) {
      const aimAng = player ? Math.atan2(player.y - e.y, player.x - e.x) : e.ang;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(aimAng);
      ctx.fillStyle = isBoss ? '#2c0f15' : (isAgent ? '#0d261a' : '#332c28');
      ctx.strokeStyle = (isBoss || isAgent) ? '#39ff88' : '#ffb84d';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(0, 0, isBoss ? 7.5 : (isHeavy ? 5.6 : 4.6), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isBoss ? '#ff4d5a' : (isAgent ? '#39ff88' : '#ffb84d');
      const blen = isBoss ? 14 : (isHeavy ? 11 : 9);
      ctx.fillRect(3.5, -3.0, blen, 2.0);
      ctx.fillRect(3.5, 1.0, blen, 2.0);
      ctx.restore();
    }

    // Полоска HP и ранг MK-II..V над врагом
    if (isBoss || e.hp < e.maxHp) {
      const bw = isBoss ? 50 : (isHeavy ? 38 : 32);
      const by = e.y - (isBoss ? 31 : 25);
      ctx.fillStyle = 'rgba(0,0,0,0.74)';
      ctx.fillRect(e.x - bw / 2, by, bw, isBoss ? 5 : 4);
      ctx.fillStyle = isBoss ? '#ff384c' : (isAgent ? '#39ff88' : (isHeavy ? '#ffb84d' : '#ff4d5a'));
      ctx.fillRect(e.x - bw / 2, by, bw * clamp(e.hp / e.maxHp, 0, 1), isBoss ? 5 : 4);

      const mk = ROMAN_TIERS[eTier - 1] || 'I';
      if (isBoss) {
        ctx.fillStyle = '#ffb84d';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`КАРАТЕЛЬ MK-${mk}`, e.x, by - 3);
      } else if (eTier >= 2) {
        ctx.fillStyle = isAgent ? '#39ff88' : '#ffd07a';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`MK-${mk}`, e.x, by - 3);
      }
    }
  }

  function drawMissionCompass() {
    let target = null;
    let color = '#ffb84d';
    let label = 'ЦЕЛЬ';

    if (mission) {
      if (mission.type === 'collect' && mission.stage === 'return') {
        target = world.depot;
        color = '#ffb84d';
        label = 'ДЕПО';
      } else if (mission.type === 'collect' && mission.stage === 'gather' && loot.length > 0) {
        let near = loot[0];
        let nd = dist(player, near);
        for (const it of loot) {
          const d = dist(player, it);
          if (d < nd) { nd = d; near = it; }
        }
        target = near;
        color = '#38e8ff';
        label = 'ЛУТ';
      } else if (mission.type === 'hack' && mission.target) {
        target = mission.target;
        color = '#39ff88';
        label = 'ТЕРМИНАЛ';
      } else if (mission.type === 'hunt' && enemies.length > 0) {
        let near = enemies[0];
        let nd = dist(player, near);
        for (const e of enemies) {
          const d = dist(player, e);
          if (d < nd) { nd = d; near = e; }
        }
        target = near;
        color = '#ff4d5a';
        label = 'ВРАГ';
      }
    }
    if (!target) return;

    const z = effectiveZoom();
    const sx = viewW / 2 + (target.x - cam.x) * z;
    const sy = viewH / 2 + (target.y - cam.y) * z;
    if (sx > 36 && sx < viewW - 36 && sy > 52 && sy < viewH - 36) return;

    const ang = Math.atan2(target.y - player.y, target.x - player.x);
    const pad = 42;
    const cx = clamp(sx, pad, viewW - pad);
    const cy = clamp(sy, 60, viewH - pad);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -7);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const meters = Math.round(dist(player, target) / 10);
    ctx.fillStyle = color;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${label} ${meters}м`, cx, cy + 18);
  }

  function renderMinimap(mCtx, mw, mh) {
    mCtx.clearRect(0, 0, mw, mh);
    mCtx.drawImage(world.minimapBg, 0, 0, mw, mh);

    const sx = mw / world.WIDTH;
    const sy = mh / world.HEIGHT;

    // Лут (цветные квадратики 1-в-1 с легендой типов лута под радаром)
    for (const it of loot) {
      const def = LOOT_DEFS[it.type];
      mCtx.fillStyle = def ? def.color : '#38e8ff';
      mCtx.fillRect(it.x * sx - 1.8, it.y * sy - 1.8, 3.6, 3.6);
    }

    // Враги (Каратель — крупный ромб, Броневик — янтарный, Агент — изумруд, Рейдер — красный)
    for (const e of enemies) {
      const ex = e.x * sx;
      const ey = e.y * sy;
      if (e.kind === 'boss') {
        mCtx.fillStyle = '#ff384c';
        mCtx.strokeStyle = '#ffb84d';
        mCtx.lineWidth = 1.2;
        mCtx.beginPath();
        mCtx.moveTo(ex, ey - 4.4);
        mCtx.lineTo(ex + 4.4, ey);
        mCtx.lineTo(ex, ey + 4.4);
        mCtx.lineTo(ex - 4.4, ey);
        mCtx.closePath();
        mCtx.fill();
        mCtx.stroke();
      } else {
        mCtx.fillStyle = e.kind === 'agent' ? '#39ff88' : (e.kind === 'heavy' ? '#ffb84d' : '#ff4d5a');
        mCtx.beginPath();
        mCtx.arc(ex, ey, e.kind === 'heavy' ? 3.2 : 2.6, 0, Math.PI * 2);
        mCtx.fill();
      }
    }

    // Пульсирующий маркер миссии
    if (mission) {
      let mt = null;
      if (mission.type === 'collect' && mission.stage === 'return') mt = world.depot;
      else if (mission.type === 'hack' && mission.target) mt = mission.target;
      if (mt) {
        mCtx.strokeStyle = '#ffb84d';
        mCtx.lineWidth = 1.6;
        mCtx.beginPath();
        mCtx.arc(mt.x * sx, mt.y * sy, 5 + Math.sin(elapsed * 6) * 2.5, 0, Math.PI * 2);
        mCtx.stroke();
      }
    }

    // Игрок + классическая Pip-Boy сетка и вращающийся луч радара
    if (player) {
      const px = player.x * sx;
      const py = player.y * sy;

      // Тонкие кольца дальности и вращающийся луч сканера
      mCtx.save();
      mCtx.strokeStyle = 'rgba(57, 255, 136, 0.16)';
      mCtx.lineWidth = 0.8;
      mCtx.beginPath();
      mCtx.arc(px, py, 22, 0, Math.PI * 2);
      mCtx.arc(px, py, 44, 0, Math.PI * 2);
      mCtx.stroke();

      const sweepAng = elapsed * 2.1;
      mCtx.beginPath();
      mCtx.moveTo(px, py);
      mCtx.arc(px, py, 44, sweepAng - 0.55, sweepAng);
      mCtx.closePath();
      mCtx.fillStyle = 'rgba(57, 255, 136, 0.14)';
      mCtx.fill();
      mCtx.restore();

      mCtx.save();
      mCtx.translate(px, py);
      mCtx.rotate(player.ang);
      mCtx.fillStyle = '#ffffff';
      mCtx.beginPath();
      mCtx.moveTo(5.5, 0);
      mCtx.lineTo(-3.5, -3.5);
      mCtx.lineTo(-2, 0);
      mCtx.lineTo(-3.5, 3.5);
      mCtx.closePath();
      mCtx.fill();
      mCtx.restore();
    }
  }

  // ==================== СИНХРОНИЗАЦИЯ HUD / МЕНЮ ====================
  function syncUI(force) {
    if (!player) return;
    const cls = CAR_CLASSES[player.carClass];
    const hpPct = clamp((player.hp / player.maxHp) * 100, 0, 100);
    const focusPct = clamp((player.focus / player.maxFocus) * 100, 0, 100);
    const radPct = clamp(player.rad, 0, 100);

    el.uiCarName.textContent = `${cls.name} · ${cls.rank}`;
    el.uiCoords.textContent = `X:${String(Math.round(player.x)).padStart(4, '0')} Y:${String(Math.round(player.y)).padStart(4, '0')}`;

    // Живые диоды на рамке корпуса монитора и статусный бейдж Pip-Terminal
    const radDanger = radPct >= 18 || world.getRadIntensity(player.x, player.y) > 0.05;
    const mtxAlert = matrixActive || matrixBreach > 0.32;
    if (el.ledRad) el.ledRad.classList.toggle('on', radDanger);
    if (el.ledMatrix) el.ledMatrix.classList.toggle('on', mtxAlert);
    if (el.uiBrandTitle) el.uiBrandTitle.classList.toggle('glitch', glitchTimer > 0 || matrixBreach > 0.65);
    if (el.uiSignalBadge) {
      el.uiSignalBadge.classList.remove('warn', 'matrix');
      if (matrixActive) {
        el.uiSignalBadge.textContent = 'CODE SYNC';
        el.uiSignalBadge.classList.add('matrix');
      } else if (matrixBreach > 0.32) {
        el.uiSignalBadge.textContent = 'SYS BREACH';
        el.uiSignalBadge.classList.add('matrix');
      } else if (radDanger) {
        el.uiSignalBadge.textContent = 'RAD WARN';
        el.uiSignalBadge.classList.add('warn');
      } else {
        el.uiSignalBadge.textContent = 'VAULT OK';
      }
    }

    el.uiHpVal.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    el.uiHpFill.style.width = `${hpPct}%`;
    el.uiHpFill.classList.toggle('low', hpPct < 35);

    el.uiFocusVal.textContent = `${Math.round(focusPct)}%`;
    el.uiFocusFill.style.width = `${focusPct}%`;

    el.uiRadVal.textContent = `${Math.round(radPct)}%`;
    el.uiRadFill.style.width = `${radPct}%`;

    el.uiAmmo.textContent = player.ammo;
    el.uiCaps.textContent = `${player.caps} ₵`;
    el.uiScore.textContent = Math.floor(player.score);
    el.uiKills.textContent = player.kills;

    const kmh = Math.round(Math.hypot(player.vx, player.vy) * 0.42);
    el.uiSpeed.textContent = `${kmh} КМ/Ч`;

    // Мобильный топ-бар
    el.mHpFill.style.width = `${hpPct}%`;
    el.mHpFill.classList.toggle('low', hpPct < 35);
    el.mFocusFill.style.width = `${focusPct}%`;
    el.mAmmo.textContent = `▪${player.ammo}`;
    el.mCaps.textContent = `${player.caps} ₵`;

    // Верхние плашки поверх поля
    const threatMk = ROMAN_TIERS[getThreatLevel() - 1] || 'I';
    const hcTag = prefs.hardcore ? ' · ☠HC' : '';
    el.hudSector.textContent = `${world.sectorName(player.x, player.y)} · MK-${threatMk}${hcTag}`;
    const stars = '★'.repeat(player.trace) + '☆'.repeat(5 - player.trace);
    el.hudTrace.textContent = `СЛЕД: ${stars}`;

    // Депо-статус
    el.uiDepotBanner.classList.toggle('in-zone', player.inDepot);
    el.btnTouchDepot.classList.toggle('hidden', !player.inDepot);
    const emergencyFree = player.caps < DEPOT_SERVICE_COST && player.hp < player.maxHp * 0.55;
    el.btnDepotService.disabled = !player.inDepot || (!emergencyFree && player.caps < DEPOT_SERVICE_COST);
    el.btnDepotService.textContent = emergencyFree
      ? 'ЛАТКА 55% (0 ₵)'
      : `СЕРВИС (${DEPOT_SERVICE_COST} ₵)`;
    el.uiDepotHint.textContent = player.inDepot
      ? 'В зоне Депо! Нажмите [E] или кнопку выше для ремонта.'
      : 'Заедьте в Бункер-Депо для ремонта и снятия RAD.';

    // Миссия
    if (mission) {
      const progText = mission.type === 'collect'
        ? (mission.stage === 'return' ? 'В ДЕПО!' : `${mission.progress} / ${mission.goal}`)
        : (mission.type === 'hack' || mission.type === 'survive'
          ? `${mission.progress.toFixed(1)}с / ${mission.goal}с`
          : `${mission.progress} / ${mission.goal}`);

      const fillPct = mission.type === 'collect' && mission.stage === 'return'
        ? 100
        : clamp((mission.progress / mission.goal) * 100, 0, 100);

      el.hudMission.textContent = `ЦЕЛЬ: ${mission.title} (${progText})`;
      el.uiMissionTitle.textContent = mission.title;
      el.uiMissionDesc.textContent = mission.desc;
      el.uiMissionFill.style.width = `${fillPct}%`;
      el.uiMissionProg.textContent = progText;
      el.uiMissionReward.textContent = `НАГРАДА: +${mission.reward} ₵`;
      el.uiMissionsDone.textContent = player.missionsDone;
      el.uiBestScore.textContent = Math.max(bestScore, Math.floor(player.score));
    }

    if (force) el.uiGarageCaps.textContent = `${player.caps} ₵`;
  }

  // ==================== МОДАЛКИ, ПАУЗА, МОБИЛЬНОЕ МЕНЮ ====================
  function setOverlayState(state) {
    gameState = state;
    if (AudioFX.setGameState) AudioFX.setGameState(state === 'playing');
    updateNextSectorButton();
    if (state === 'playing') {
      el.overlay.classList.add('hidden');
      el.btnPauseResume.textContent = '❚❚ ПАУЗА';
      return;
    }

    el.overlay.classList.remove('hidden');
    if (el.modalRunConfig) {
      el.modalRunConfig.classList.toggle('hidden', state === 'paused');
    }
    renderSectorPicker();
    if (state === 'menu') {
      if (el.modalLogoWrap) el.modalLogoWrap.classList.remove('hidden');
      el.modalTitle.classList.add('hidden');
      el.modalTitle.textContent = 'VAULT RUNNER';
      el.modalSub.innerHTML = 'Постапокалиптический мегаполис под скрытым кодом Системы. Гоняй по 4 секторам-биомам, собирай крышки, улучшай машину в Бункере-Депо и замедляй время в режиме <strong>Цифрового Фокуса</strong>.';
      el.btnPlay.textContent = '▶ ВЪЕХАТЬ В ПУСТОШЬ';
      el.btnRestartModal.classList.add('hidden');
    } else if (state === 'paused') {
      if (el.modalLogoWrap) el.modalLogoWrap.classList.add('hidden');
      el.modalTitle.classList.remove('hidden');
      el.modalTitle.textContent = 'VAULT RUNNER // ПАУЗА';
      el.modalSub.textContent = 'Симуляция приостановлена. Вы можете изучить карту или улучшить авто в Гараже.';
      el.btnPlay.textContent = '▶ ПРОДОЛЖИТЬ';
      el.btnRestartModal.classList.remove('hidden');
      el.btnPauseResume.textContent = '▶ ПРОДОЛЖИТЬ';
      driverSetQuote(pickQuote(DRIVER_QUOTES.pause), 5.0);
    } else if (state === 'dead') {
      if (el.modalLogoWrap) el.modalLogoWrap.classList.add('hidden');
      el.modalTitle.classList.remove('hidden');
      el.modalTitle.textContent = 'СИГНАЛ ПОТЕРЯН // МАШИНА УНИЧТОЖЕНА';
      el.modalSub.textContent = `Итог заезда: Счёт ${Math.floor(player.score)} · Фраги ${player.kills} · Контракты ${player.missionsDone} · Рекорд ${bestScore}.`;
      el.btnPlay.textContent = '↻ НОВЫЙ ЗАЕЗД (ENTER)';
      el.btnRestartModal.classList.add('hidden');
    }
  }

  let pausedByDrawer = false;
  function openMobileMenu() {
    el.sidebar.classList.add('open');
    el.backdrop.classList.add('open');
    if (gameState === 'playing') {
      pausedByDrawer = true;
      gameState = 'paused';
      if (AudioFX.setGameState) AudioFX.setGameState(false);
      el.btnPauseResume.textContent = '▶ ПРОДОЛЖИТЬ';
    }
    renderGarage();
    syncUI(true);
  }

  function closeMobileMenu() {
    el.sidebar.classList.remove('open');
    el.backdrop.classList.remove('open');
    if (pausedByDrawer && gameState === 'paused') {
      pausedByDrawer = false;
      gameState = 'playing';
      if (AudioFX.setGameState) AudioFX.setGameState(true);
      el.btnPauseResume.textContent = '❚❚ ПАУЗА';
    }
  }

  let pausedByCredits = false;
  function isCreditsOpen() {
    return !!(el.creditsOverlay && !el.creditsOverlay.classList.contains('hidden'));
  }

  function openCredits() {
    if (!el.creditsOverlay) return;
    AudioFX.unlock();
    if (AudioFX.uiClick) AudioFX.uiClick();
    if (gameState === 'playing') {
      pausedByCredits = true;
      gameState = 'paused';
      if (AudioFX.setGameState) AudioFX.setGameState(false);
      el.btnPauseResume.textContent = '▶ ПРОДОЛЖИТЬ';
    }
    el.creditsOverlay.classList.remove('hidden');
  }

  function closeCredits() {
    if (!el.creditsOverlay || el.creditsOverlay.classList.contains('hidden')) return;
    el.creditsOverlay.classList.add('hidden');
    if (AudioFX.uiClick) AudioFX.uiClick();
    if (pausedByCredits && gameState === 'paused') {
      pausedByCredits = false;
      gameState = 'playing';
      if (AudioFX.setGameState) AudioFX.setGameState(true);
      el.btnPauseResume.textContent = '❚❚ ПАУЗА';
    }
  }

  // ==================== РЕСАЙЗ КАНВАСА (МОНИТОР + ТЕЛЕФОН) ====================
  function resizeCanvas() {
    const rect = stageScreen.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    const isMobileLike = w < 900 || h < 540 || (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches);
    dpr = Math.min(window.devicePixelRatio || 1, isMobileLike ? 1.35 : 2);
    viewW = w;
    viewH = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    // Облегчённая карта освещения (0.35× на телефоне, 0.5× на ПК — мягкий свет + огромный буст FPS!)
    const lightScale = isMobileLike ? 0.35 : 0.5;
    lightCanvas.width = Math.max(1, Math.round(w * lightScale));
    lightCanvas.height = Math.max(1, Math.round(h * lightScale));
    initDigitalRain();
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resizeCanvas).observe(stageScreen);
  }
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 120));

  // ==================== СОБЫТИЯ КЛАВИАТУРЫ, МЫШИ И ТАЧА ====================
  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
    keys[e.code] = true;

    if (isCreditsOpen()) {
      if (e.code === 'Escape') closeCredits();
      return;
    }

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'playing') setOverlayState('paused');
      else if (gameState === 'paused') setOverlayState('playing');
    } else if (e.code === 'Enter') {
      AudioFX.unlock();
      if (gameState === 'menu' || gameState === 'paused') setOverlayState('playing');
      else if (gameState === 'dead') { resetRun(); setOverlayState('playing'); }
    } else if (e.code === 'KeyE') {
      depotService();
    } else if (e.code === 'KeyN') {
      if (gameState === 'playing' && sectorReadyNext) {
        AudioFX.unlock();
        advanceToNextSector();
      }
    } else if (e.code === 'KeyM') {
      AudioFX.unlock();
      prefs.music = !prefs.music;
      applyPrefs();
      savePrefs();
      if (AudioFX.uiClick) AudioFX.uiClick();
      addLog(`Музыка (Keygen-чиптюн): ${prefs.music ? 'ВКЛ' : 'ВЫКЛ'}`, 'matrix');
    } else if (e.code === 'Digit1') switchTab('status');
    else if (e.code === 'Digit2') switchTab('garage');
    else if (e.code === 'Digit3') switchTab('missions');
    else if (e.code === 'Digit4') switchTab('menu');
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  window.addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
    mouse.down = false;
    mouse.rightDown = false;
    touchFire = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.active = true;
  });

  canvas.addEventListener('mousedown', (e) => {
    AudioFX.unlock();
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.active = true;
    if (e.button === 0) mouse.down = true;
    if (e.button === 2) mouse.rightDown = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rightDown = false;
  });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Сенсорный джойстик (Pointer Events с поддержкой мультитача)
  function updateJoyFromPoint(clientX, clientY) {
    const r = el.joyBase.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const maxR = r.width * 0.42;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > maxR) {
      dx = (dx / d) * maxR;
      dy = (dy / d) * maxR;
    }
    el.joyStick.style.transform = `translate(${dx}px, ${dy}px)`;
    joy.dx = dx / maxR;
    joy.dy = dy / maxR;
    joy.mag = clamp(d / maxR, 0, 1);
    joy.ang = Math.atan2(dy, dx);
  }

  el.joyZone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    AudioFX.unlock();
    joy.active = true;
    joy.pointerId = e.pointerId;
    el.joyZone.setPointerCapture(e.pointerId);
    updateJoyFromPoint(e.clientX, e.clientY);
  });

  el.joyZone.addEventListener('pointermove', (e) => {
    if (!joy.active || e.pointerId !== joy.pointerId) return;
    e.preventDefault();
    updateJoyFromPoint(e.clientX, e.clientY);
  });

  function releaseJoy(e) {
    if (!joy.active || (e && e.pointerId !== joy.pointerId)) return;
    joy.active = false;
    joy.pointerId = null;
    joy.mag = 0;
    el.joyStick.style.transform = 'translate(0px, 0px)';
  }
  el.joyZone.addEventListener('pointerup', releaseJoy);
  el.joyZone.addEventListener('pointercancel', releaseJoy);

  // Сенсорные кнопки справа
  el.btnTouchFire.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    AudioFX.unlock();
    touchFire = true;
    el.btnTouchFire.classList.add('active');
    el.btnTouchFire.setPointerCapture(e.pointerId);
  });
  const stopTouchFire = () => {
    touchFire = false;
    el.btnTouchFire.classList.remove('active');
  };
  el.btnTouchFire.addEventListener('pointerup', stopTouchFire);
  el.btnTouchFire.addEventListener('pointercancel', stopTouchFire);

  el.btnTouchMatrix.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    AudioFX.unlock();
    touchMatrixToggle = !touchMatrixToggle;
  });

  el.btnTouchDepot.addEventListener('click', () => {
    AudioFX.unlock();
    depotService();
  });

  // ==================== КНОПКИ МЕНЮ И ВКЛАДКИ ====================
  const tabBtns = [...document.querySelectorAll('.tab-btn')];
  const tabPanels = [...document.querySelectorAll('.tab-panel')];

  function switchTab(name) {
    tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    tabPanels.forEach((p) => p.classList.toggle('active', p.id === `panel-${name}`));
    if (name === 'garage') renderGarage();
    if (AudioFX.uiClick) AudioFX.uiClick();
  }
  tabBtns.forEach((b) => b.addEventListener('click', () => {
    AudioFX.unlock();
    switchTab(b.dataset.tab);
  }));

  el.btnPlay.addEventListener('click', () => {
    AudioFX.unlock();
    if (gameState === 'dead') resetRun();
    setOverlayState('playing');
  });

  el.btnRestartModal.addEventListener('click', () => {
    AudioFX.unlock();
    resetRun();
    setOverlayState('playing');
  });

  el.btnPauseResume.addEventListener('click', () => {
    AudioFX.unlock();
    if (gameState === 'playing') setOverlayState('paused');
    else if (gameState === 'paused') {
      closeMobileMenu();
      setOverlayState('playing');
    } else if (gameState === 'dead') {
      resetRun();
      closeMobileMenu();
      setOverlayState('playing');
    }
  });

  el.btnRestart.addEventListener('click', () => {
    AudioFX.unlock();
    resetRun();
    closeMobileMenu();
    setOverlayState('playing');
  });

  if (el.btnCreditsModal) el.btnCreditsModal.addEventListener('click', openCredits);
  if (el.btnCreditsMenu) el.btnCreditsMenu.addEventListener('click', openCredits);
  if (el.btnCreditsBezel) el.btnCreditsBezel.addEventListener('click', openCredits);
  if (el.btnCreditsClose) el.btnCreditsClose.addEventListener('click', closeCredits);
  if (el.btnCreditsCloseX) el.btnCreditsCloseX.addEventListener('click', closeCredits);
  if (el.creditsOverlay) {
    el.creditsOverlay.addEventListener('click', (e) => {
      if (e.target === el.creditsOverlay) closeCredits();
    });
  }

  if (el.btnResetSave) {
    let resetConfirmTimer = null;
    el.btnResetSave.addEventListener('click', () => {
      AudioFX.unlock();
      if (el.btnResetSave.dataset.confirm === '1') {
        clearTimeout(resetConfirmTimer);
        el.btnResetSave.dataset.confirm = '0';
        el.btnResetSave.classList.remove('confirming');
        el.btnResetSave.textContent = '✕ СБРОС';
        resetSavedProgress();
        closeMobileMenu();
        setOverlayState('playing');
      } else {
        el.btnResetSave.dataset.confirm = '1';
        el.btnResetSave.classList.add('confirming');
        el.btnResetSave.textContent = 'ТОЧНО?';
        addLog('Нажмите «ТОЧНО?» ещё раз за 3.5 сек, чтобы удалить сейв.', 'danger');
        if (resetConfirmTimer) clearTimeout(resetConfirmTimer);
        resetConfirmTimer = setTimeout(() => {
          el.btnResetSave.dataset.confirm = '0';
          el.btnResetSave.classList.remove('confirming');
          el.btnResetSave.textContent = '✕ СБРОС';
        }, 3500);
      }
    });
  }

  function handleAppBackground() {
    saveProgress();
    for (const k in keys) keys[k] = false;
    mouse.down = false;
    mouse.rightDown = false;
    touchFire = false;
    if (gameState === 'playing') {
      setOverlayState('paused');
    }
    if (AudioFX.suspend) AudioFX.suspend();
  }

  function handleAppForeground() {
    if (AudioFX.resume) AudioFX.resume();
  }

  window.addEventListener('beforeunload', () => saveProgress());
  window.addEventListener('pagehide', handleAppBackground);
  window.addEventListener('pageshow', handleAppForeground);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') handleAppBackground();
    else handleAppForeground();
  });

  // Мост для Android-оболочки (системная кнопка «Назад» и сворачивание приложения)
  window.VAULT_RUNNER_NATIVE = {
    onBackPressed() {
      if (isCreditsOpen()) {
        closeCredits();
        return true;
      }
      if (el.sidebar && el.sidebar.classList.contains('open')) {
        closeMobileMenu();
        return true;
      }
      if (gameState === 'playing') {
        setOverlayState('paused');
        return true;
      }
      return false;
    },
    onAppPause: handleAppBackground,
    onAppResume: handleAppForeground
  };

  el.btnDepotService.addEventListener('click', () => {
    AudioFX.unlock();
    depotService();
  });

  if (el.cabinScreenFrame) {
    el.cabinScreenFrame.addEventListener('click', () => {
      AudioFX.unlock();
      driverInteractiveClick();
    });
  }

  if (el.mobileCabinWrap) {
    el.mobileCabinWrap.addEventListener('click', () => {
      AudioFX.unlock();
      haptic(12);
      driverInteractiveClick();
    });
  }

  if (el.btnNextSector) {
    el.btnNextSector.addEventListener('click', () => {
      AudioFX.unlock();
      advanceToNextSector();
    });
  }

  function setHardcoreMode(on) {
    prefs.hardcore = !!on;
    applyPrefs();
    savePrefs();
    if (AudioFX.uiClick) AudioFX.uiClick();
    if (player) {
      addLog(`Режим сложности: ${prefs.hardcore ? '☠ ХАРДКОР (+35% ₵, злые враги)' : 'СТАНДАРТ'}`, prefs.hardcore ? 'danger' : 'matrix');
      syncUI(true);
    }
  }

  if (el.btnDiffStd) el.btnDiffStd.addEventListener('click', () => { AudioFX.unlock(); setHardcoreMode(false); });
  if (el.btnDiffHard) el.btnDiffHard.addEventListener('click', () => { AudioFX.unlock(); setHardcoreMode(true); });

  el.btnMobileMenu.addEventListener('click', openMobileMenu);
  el.btnCloseMenu.addEventListener('click', closeMobileMenu);
  el.backdrop.addEventListener('click', closeMobileMenu);
  el.btnMobileRadar.addEventListener('click', () => {
    el.mobileRadarFloat.classList.toggle('hidden');
  });

  // Привязка настроек
  function applyPrefs() {
    AudioFX.setEnabled(prefs.sound);
    if (AudioFX.setTrack && AudioFX.getTrackInfo && AudioFX.getTrackInfo().index !== (prefs.musicTrack || 0)) {
      AudioFX.setTrack(prefs.musicTrack || 0, true);
    }
    if (AudioFX.setMusicEnabled) AudioFX.setMusicEnabled(prefs.music);
    syncTrackBadge();
    document.body.classList.toggle('crt-on', prefs.crt);
    el.app.classList.toggle('sidebar-left', prefs.sidebarLeft);
    if (el.mobileCabinWrap) {
      el.mobileCabinWrap.classList.toggle('hidden-cam', !prefs.mobileCam);
    }
    if (el.btnDiffStd) el.btnDiffStd.classList.toggle('active', !prefs.hardcore);
    if (el.btnDiffHard) el.btnDiffHard.classList.toggle('active', prefs.hardcore);
    el.optSound.checked = prefs.sound;
    if (el.optMusic) el.optMusic.checked = prefs.music;
    if (el.optHardcore) el.optHardcore.checked = prefs.hardcore;
    if (el.optMobileCam) el.optMobileCam.checked = prefs.mobileCam;
    el.optCrt.checked = prefs.crt;
    el.optNoir.checked = prefs.noir;
    el.optRain.checked = prefs.rain;
    el.optSidebarLeft.checked = prefs.sidebarLeft;
    el.optZoom.value = String(prefs.zoom);
    el.optZoomVal.textContent = `${prefs.zoom.toFixed(2)}×`;
  }

  el.optSound.addEventListener('change', () => {
    prefs.sound = el.optSound.checked;
    if (prefs.sound) AudioFX.unlock();
    applyPrefs();
    savePrefs();
  });
  if (el.optMusic) {
    el.optMusic.addEventListener('change', () => {
      prefs.music = el.optMusic.checked;
      if (prefs.music) AudioFX.unlock();
      applyPrefs();
      savePrefs();
      if (AudioFX.uiClick) AudioFX.uiClick();
    });
  }
  if (el.optHardcore) {
    el.optHardcore.addEventListener('change', () => {
      AudioFX.unlock();
      setHardcoreMode(el.optHardcore.checked);
    });
  }
  if (el.optMobileCam) {
    el.optMobileCam.addEventListener('change', () => {
      prefs.mobileCam = el.optMobileCam.checked;
      applyPrefs();
      savePrefs();
      if (AudioFX.uiClick) AudioFX.uiClick();
    });
  }
  el.optCrt.addEventListener('change', () => { prefs.crt = el.optCrt.checked; applyPrefs(); savePrefs(); });
  el.optNoir.addEventListener('change', () => { prefs.noir = el.optNoir.checked; applyPrefs(); savePrefs(); });
  el.optRain.addEventListener('change', () => { prefs.rain = el.optRain.checked; applyPrefs(); savePrefs(); });
  el.optSidebarLeft.addEventListener('change', () => { prefs.sidebarLeft = el.optSidebarLeft.checked; applyPrefs(); savePrefs(); });
  el.optZoom.addEventListener('input', () => { prefs.zoom = Number(el.optZoom.value); applyPrefs(); savePrefs(); });

  // ==================== ГЛАВНЫЙ ЦИКЛ ====================
  let lastTs = performance.now();
  function frame(ts) {
    const dt = Math.min(0.05, Math.max(0.001, (ts - lastTs) / 1000));
    lastTs = ts;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  // Старт
  applyPrefs();
  resizeCanvas();
  resetRun();
  setOverlayState('menu');
  requestAnimationFrame(frame);
})();
