'use strict';

(function () {
  const AudioFX = window.GTA0.Audio;
  const WorldMod = window.GTA0.World;

  // ==================== КОНСТАНТЫ ====================
  const CAR_CLASSES = [
    {
      name: 'SCOUT BUGGY',
      rank: 'КЛАСС I',
      len: 34, wid: 19,
      maxHp: 100,
      maxSpeed: 295,
      accel: 460,
      turn: 3.4,
      fill: '#2ca9ba',
      trim: '#e4ff7a',
      cost: 0
    },
    {
      name: 'INTERCEPTOR V8',
      rank: 'КЛАСС II',
      len: 40, wid: 22,
      maxHp: 145,
      maxSpeed: 335,
      accel: 520,
      turn: 3.05,
      fill: '#5ba868',
      trim: '#ffb84d',
      cost: 90
    },
    {
      name: 'WAR RIG MK-III',
      rank: 'КЛАСС III',
      len: 46, wid: 26,
      maxHp: 210,
      maxSpeed: 310,
      accel: 470,
      turn: 2.65,
      fill: '#b5634d',
      trim: '#ffd27d',
      cost: 170
    }
  ];

  const LOOT_DEFS = {
    ammo:   { color: '#ff5e5e', label: 'Патроны +28',  short: 'A' },
    medkit: { color: '#55e87b', label: 'Аптечка +35 HP', short: '+' },
    caps:   { color: '#ffb84d', label: 'Крышки +25 ₵', short: '₵' },
    focus:  { color: '#38e8ff', label: 'Ядро Матрицы', short: 'M' },
    radaway:{ color: '#d0ff5e', label: 'Антирад',      short: 'R' },
    module: { color: '#c77dff', label: 'Модуль +35 ₵', short: '★' }
  };

  const LOOT_POOL = ['ammo', 'ammo', 'caps', 'caps', 'medkit', 'focus', 'radaway', 'module'];
  const MATRIX_CHARS = '0123456789ABCDEFアイウエオカキクケコサシスセソタチツテト';

  // ==================== СОСТОЯНИЕ ИГРЫ ====================
  const world = WorldMod.createWorld();

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
    btnPauseResume: document.getElementById('btn-pause-resume'),
    btnRestart: document.getElementById('btn-restart'),
    btnMobileMenu: document.getElementById('btn-mobile-menu'),
    btnCloseMenu: document.getElementById('btn-close-menu'),
    btnMobileRadar: document.getElementById('btn-mobile-radar'),
    mobileRadarFloat: document.getElementById('mobile-radar-float'),
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

  function loadPrefs() {
    try {
      const saved = JSON.parse(localStorage.getItem('gta0_prefs') || '{}');
      return {
        sound: saved.sound !== false,
        crt: saved.crt !== false,
        noir: saved.noir !== false,
        rain: saved.rain !== false,
        sidebarLeft: !!saved.sidebarLeft,
        zoom: clamp(Number(saved.zoom || 1), 0.7, 1.4)
      };
    } catch {
      return { sound: true, crt: true, noir: true, rain: true, sidebarLeft: false, zoom: 1.0 };
    }
  }

  function savePrefs() {
    try { localStorage.setItem('gta0_prefs', JSON.stringify(prefs)); } catch { /* ignore */ }
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

  // ==================== КАМЕРА В КАБИНЕ ВОДИТЕЛЯ (ПК: CARMAGEDDON / FALLOUT / МАТРИЦА) ====================
  const driverCtx = el.driverCam ? el.driverCam.getContext('2d') : null;
  const ecgCtx = el.driverEcg ? el.driverEcg.getContext('2d') : null;

  const DRV = {
    IDLE: 0,
    BLINK: 1,
    LEFT: 2,
    RIGHT: 3,
    GRIN: 4,
    HURT: 5,
    CANTEEN: 6,
    NEO: 7
  };

  let driverSheet = null;
  let driverSheetReady = false;
  if (typeof Image !== 'undefined') {
    driverSheet = new Image();
    driverSheet.onload = () => { driverSheetReady = true; };
    driverSheet.src = 'assets/driver-sheet.jpg?v=6';
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
      'Ложки нет. Есть только газ.',
      'Реальность трещит… я в потоке.',
      'Очки поймали сигнал Матрицы.'
    ],
    neoBleed: [
      'Снова этот зелёный код в линзах…',
      'Показалось? Стены мерцают цифрами.',
      'Система пытается пробиться сквозь шум.'
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
    grinTimer: 0,
    hurtTimer: 0,
    canteenTimer: 0,
    canteenDur: 2.6,
    neoTimer: 0,
    subliminalNeoTimer: 0,
    codeFlashTimer: 0,
    glitchSliceTimer: 0,
    vaultAuraTimer: 0,

    blinkTimer: 2.8,
    blinkDur: 0,
    doubleBlink: false,

    glanceTimer: 2.6,
    glanceDir: 0,
    glanceDur: 0,

    autoSipCooldown: 22,
    autoCodeCooldown: 12,
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
    driverCam.subliminalNeoTimer = 0;
    driverCam.codeFlashTimer = 0.7;
    driverCam.glitchSliceTimer = 0.16;
    driverCam.vaultAuraTimer = 0;
    driverCam.muzzleFlash = 0;
    driverCam.explosionFlash = 0;
    driverCam.damageFlash = 0;
    driverCam.joltX = 0;
    driverCam.joltY = 0;
    driverCam.steerSmooth = 0;
    driverCam.autoSipCooldown = 20 + Math.random() * 12;
    driverCam.autoCodeCooldown = 10 + Math.random() * 8;
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
    if (isPlasma) {
      driverCam.codeFlashTimer = Math.max(driverCam.codeFlashTimer, 0.35);
    }
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
    if (dmg >= 8) {
      driverCam.glitchSliceTimer = Math.max(driverCam.glitchSliceTimer, 0.2);
      driverCam.codeFlashTimer = Math.max(driverCam.codeFlashTimer, 0.45);
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
      driverCam.grinTimer = Math.max(driverCam.grinTimer, 1.75);
      driverCam.joltY -= 1.8;
      driverSetQuote(pickQuote(DRIVER_QUOTES.kill), 3.4);
    }
  }

  function driverDrinkCanteen(customQuote) {
    if (gameState === 'dead') return;
    driverCam.canteenDur = 2.7;
    driverCam.canteenTimer = driverCam.canteenDur;
    driverCam.vaultAuraTimer = Math.max(driverCam.vaultAuraTimer, 3.2);
    driverCam.autoSipCooldown = 28 + Math.random() * 16;
    driverSetQuote(customQuote || pickQuote(DRIVER_QUOTES.canteen), 3.8);
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

  function driverInteractiveClick() {
    if (gameState === 'dead') return;
    driverCam.clickCycle = (driverCam.clickCycle + 1) % 3;
    if (driverCam.clickCycle === 1) {
      driverDrinkCanteen(pickQuote(DRIVER_QUOTES.canteen));
    } else if (driverCam.clickCycle === 2) {
      driverAwakenNeo(2.6, pickQuote(DRIVER_QUOTES.neo));
    } else {
      driverCam.canteenTimer = 0;
      driverCam.neoTimer = 0;
      driverCam.grinTimer = 1.9;
      driverCam.joltY -= 1.5;
      driverSetQuote(pickQuote(DRIVER_QUOTES.kill), 3.4);
    }
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
    if (driverCam.subliminalNeoTimer > 0) driverCam.subliminalNeoTimer = Math.max(0, driverCam.subliminalNeoTimer - dt);
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

    // Проверка на взлом терминала Матрицы или близость Агента
    const isHacking = isPlaying && mission && mission.type === 'hack' && mission.target && dist(player, mission.target) <= mission.target.radius;
    const radHigh = isPlaying && (player.rad >= 45 || world.getRadIntensity(player.x, player.y) > 0.12);

    // Спонтанные «проблески цифр в очках» и короткий проблеск Нео
    if (!isDead) {
      driverCam.autoCodeCooldown -= dt;
      if (driverCam.autoCodeCooldown <= 0) {
        driverCam.autoCodeCooldown = 11 + Math.random() * 11;
        driverCam.codeFlashTimer = Math.max(driverCam.codeFlashTimer, 0.9 + Math.random() * 0.7);
        if (isPlaying && (matrixBreach > 0.22 || Math.random() < 0.32)) {
          driverCam.subliminalNeoTimer = 0.42;
          driverCam.glitchSliceTimer = Math.max(driverCam.glitchSliceTimer, 0.16);
          if (driverCam.quoteTimer <= 0.5 && Math.random() < 0.55) {
            driverSetQuote(pickQuote(DRIVER_QUOTES.neoBleed), 3.4);
          }
        }
      }
      if (matrixBreach > 0.35) {
        driverCam.codeFlashTimer = Math.max(driverCam.codeFlashTimer, 0.35);
      }
    }

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
          driverCam.glanceDir = Math.random() < 0.5 ? -1 : 1;
          driverCam.glanceDur = 0.65 + Math.random() * 0.75;
        }
      }
    }

    // Естественное моргание глазами
    if (driverCam.blinkDur > 0) {
      driverCam.blinkDur -= dt;
    } else {
      driverCam.blinkTimer -= dt;
      if (driverCam.blinkTimer <= 0) {
        driverCam.blinkDur = 0.13;
        if (!driverCam.doubleBlink && Math.random() < 0.22) {
          driverCam.doubleBlink = true;
          driverCam.blinkTimer = 0.24;
        } else {
          driverCam.doubleBlink = false;
          driverCam.blinkTimer = 2.6 + Math.random() * 2.8;
        }
      }
    }

    // Выбор кадра, личности (Гонщик / Выходец из Убежища / Нео) и статуса
    let nextFrame = DRV.IDLE;
    let nextPersona = 'driver';
    let nextMood = isPlaying ? 'ДОРОГА' : (gameState === 'paused' ? 'ПАУЗА' : 'ОЖИДАНИЕ');
    let hardCut = false;

    const neoAwake = !isDead && (matrixActive || isHacking || driverCam.neoTimer > 0 || driverCam.subliminalNeoTimer > 0);

    if (isDead) {
      nextPersona = 'dead';
      nextMood = 'NO SIGNAL';
      nextFrame = DRV.HURT;
    } else if (neoAwake) {
      nextFrame = DRV.NEO;
      nextPersona = 'neo';
      nextMood = matrixActive ? 'МАТРИЦА' : (isHacking ? 'ВЗЛОМ' : 'СИГНАЛ');
      hardCut = driverCam.curFrame !== DRV.NEO;
    } else if (driverCam.hurtTimer > 0) {
      nextFrame = DRV.HURT;
      nextPersona = radHigh ? 'vault' : 'driver';
      nextMood = 'УДАР';
      hardCut = true;
    } else if (driverCam.canteenTimer > 0) {
      nextFrame = DRV.CANTEEN;
      nextPersona = 'vault';
      nextMood = 'ФЛЯЖКА';
    } else if (driverCam.grinTimer > 0) {
      nextFrame = DRV.GRIN;
      nextPersona = 'driver';
      nextMood = 'АЗАРТ';
    } else {
      // Повороты головы от руля или свободный обзор + моргание
      if (driverCam.steerSmooth < -0.22) {
        nextFrame = DRV.LEFT;
        nextMood = speed > 140 ? 'ДРИФТ ◀' : 'ПОВОРОТ ◀';
      } else if (driverCam.steerSmooth > 0.22) {
        nextFrame = DRV.RIGHT;
        nextMood = speed > 140 ? 'ДРИФТ ▶' : 'ПОВОРОТ ▶';
      } else if (driverCam.glanceDir < 0) {
        nextFrame = DRV.LEFT;
      } else if (driverCam.glanceDir > 0) {
        nextFrame = DRV.RIGHT;
      } else if (driverCam.blinkDur > 0) {
        nextFrame = DRV.BLINK;
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
      driverCam.blend = Math.min(1, driverCam.blend + dt * 9.5);
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
        ? 'НЕО // КОД'
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

  function renderDriverCam() {
    if (!driverCtx || !el.cabinPanel || el.cabinPanel.offsetParent === null) return;

    const w = el.driverCam.width;
    const h = el.driverCam.height;
    driverCtx.clearRect(0, 0, w, h);

    if (gameState === 'dead') {
      // Аналоговый белый шум + NO SIGNAL при уничтожении машины
      driverCtx.fillStyle = '#070c09';
      driverCtx.fillRect(0, 0, w, h);
      for (let i = 0; i < 240; i++) {
        const nx = Math.random() * w;
        const ny = Math.random() * h;
        const v = 30 + Math.floor(Math.random() * 140);
        driverCtx.fillStyle = `rgb(${v},${v + 12},${v})`;
        driverCtx.fillRect(nx, ny, 2 + Math.random() * 4, 1.5);
      }
      const barY = (elapsed * 70) % h;
      driverCtx.fillStyle = 'rgba(255, 77, 90, 0.22)';
      driverCtx.fillRect(0, barY, w, 16);

      driverCtx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      driverCtx.fillRect(14, h * 0.38, w - 28, 34);
      driverCtx.strokeStyle = 'rgba(255, 77, 90, 0.75)';
      driverCtx.strokeRect(14, h * 0.38, w - 28, 34);
      driverCtx.fillStyle = '#ff6b76';
      driverCtx.font = 'bold 12px monospace';
      driverCtx.textAlign = 'center';
      driverCtx.fillText('NO SIGNAL', w / 2, h * 0.38 + 21);
      renderDriverEcg();
      return;
    }

    const speed = player ? Math.hypot(player.vx, player.vy) : 0;
    const speedRatio = clamp(speed / 260, 0, 1);

    // Живая физика кабины: вибрация мотора, кочки, наклон в повороте, лёгкое запрокидывание при питье из фляжки
    const idleBreathY = Math.sin(elapsed * 2.2) * 1.0;
    const engineVibX = Math.sin(elapsed * 31) * (0.35 + speedRatio * 1.15);
    const engineVibY = Math.cos(elapsed * 27) * (0.3 + speedRatio * 1.05);
    const steerRoll = driverCam.steerSmooth * 0.042;
    const steerShiftX = driverCam.steerSmooth * 3.0;

    let sipTilt = 0;
    let sipBobY = 0;
    if (driverCam.canteenTimer > 0) {
      const p = 1 - driverCam.canteenTimer / Math.max(0.1, driverCam.canteenDur);
      const wave = Math.sin(p * Math.PI);
      sipTilt = -0.042 * wave;
      sipBobY = -1.6 * wave + Math.sin(p * Math.PI * 4) * 0.7;
    }

    driverCtx.save();
    driverCtx.translate(w / 2 + engineVibX + steerShiftX + driverCam.joltX, h / 2 + idleBreathY + engineVibY + sipBobY + driverCam.joltY);
    driverCtx.rotate(steerRoll + sipTilt);
    driverCtx.translate(-w / 2, -h / 2);

    if (driverSheetReady) {
      if (driverCam.blend < 1) {
        drawDriverFrame(driverCtx, driverCam.prevFrame, w, 1);
        drawDriverFrame(driverCtx, driverCam.curFrame, w, driverCam.blend);
      } else {
        drawDriverFrame(driverCtx, driverCam.curFrame, w, 1);
      }
    } else {
      driverCtx.fillStyle = '#0a140d';
      driverCtx.fillRect(0, 0, w, h);
    }

    // 1) Живые цифры Матрицы в стёклах очков на лбу (работают и при пробуждении Нео, и при проблесках кода!)
    const isNeoFrame = driverCam.curFrame === DRV.NEO;
    const goggleCodeIntensity = isNeoFrame
      ? 1.0
      : Math.max(
          driverCam.codeFlashTimer > 0 ? clamp(driverCam.codeFlashTimer, 0, 0.95) : 0,
          matrixBreach > 0.25 ? (matrixBreach - 0.25) * 0.95 : 0
        );
    const headShiftX = driverCam.curFrame === DRV.LEFT ? -0.065 : (driverCam.curFrame === DRV.RIGHT ? 0.065 : 0);
    if (goggleCodeIntensity > 0.03) {
      renderGoggleMatrixCode(driverCtx, w, goggleCodeIntensity, headShiftX);
    }

    // 2) Тёплое янтарное свечение Pip-Boy / фляжки Убежища-0
    if (driverCam.canteenTimer > 0 || driverCam.persona === 'vault') {
      const pulse = 0.2 + Math.sin(elapsed * 5) * 0.06;
      const gVault = driverCtx.createRadialGradient(w * 0.5, h * 0.95, 8, w * 0.5, h * 0.72, w * 0.78);
      gVault.addColorStop(0, `rgba(255, 184, 77, ${driverCam.canteenTimer > 0 ? pulse + 0.16 : pulse})`);
      gVault.addColorStop(1, 'rgba(255, 184, 77, 0)');
      driverCtx.save();
      driverCtx.globalCompositeOperation = 'screen';
      driverCtx.fillStyle = gVault;
      driverCtx.fillRect(0, 0, w, h);
      driverCtx.restore();
    }

    // 3) Отблески стрельбы из турели и взрывов по лицу и кожанке водителя!
    const flashStr = Math.max(driverCam.muzzleFlash, driverCam.explosionFlash);
    if (flashStr > 0.03) {
      const useExpl = driverCam.explosionFlash >= driverCam.muzzleFlash;
      const fx = w * (0.5 + (useExpl ? 0 : driverCam.muzzleSide * 0.34));
      const fy = h * (useExpl ? 0.35 : 0.42);
      const isGreen = (useExpl ? driverCam.explosionColor : driverCam.muzzleColor).startsWith('#39') ||
                      (useExpl ? driverCam.explosionColor : driverCam.muzzleColor).startsWith('#4c');
      const rgb = isGreen ? '76, 255, 156' : '255, 178, 72';

      driverCtx.save();
      driverCtx.globalCompositeOperation = 'screen';
      const mg = driverCtx.createRadialGradient(fx, fy, 4, fx, fy, w * 0.95);
      mg.addColorStop(0, `rgba(255, 244, 210, ${flashStr * 0.58})`);
      mg.addColorStop(0.32, `rgba(${rgb}, ${flashStr * 0.48})`);
      mg.addColorStop(1, `rgba(${rgb}, 0)`);
      driverCtx.fillStyle = mg;
      driverCtx.fillRect(0, 0, w, h);
      driverCtx.restore();
    }

    // 4) Лёгкие боковые нити цифр Матрицы по краям монитора при активном Нео / сильном глитче
    if (isNeoFrame || driverCam.codeFlashTimer > 0.35) {
      const edgeAlpha = isNeoFrame ? 0.42 : Math.min(0.28, (driverCam.codeFlashTimer - 0.35) * 0.35);
      driverCtx.save();
      driverCtx.font = 'bold 9px monospace';
      for (let i = 0; i < 6; i++) {
        const col = goggleCodeCols[i * 2];
        const x = i < 3 ? 6 + i * 9 : w - 8 - (i - 3) * 9;
        const y = (col.y * 3.1) % (h + 24);
        const ch = CABIN_GLYPHS[(col.seed + Math.floor(elapsed * 10)) % CABIN_GLYPHS.length];
        driverCtx.fillStyle = `rgba(57, 255, 136, ${edgeAlpha})`;
        driverCtx.fillText(ch, x, y);
      }
      driverCtx.restore();
    }

    driverCtx.restore();

    // 5) Горизонтальный цифровой срез-глитч при пробуждении Нео или сильном попадании
    if (driverCam.glitchSliceTimer > 0) {
      const slices = 3;
      for (let s = 0; s < slices; s++) {
        const sy = Math.floor(Math.random() * (h - 14));
        const sh = 4 + Math.floor(Math.random() * 10);
        const dx = (Math.random() - 0.5) * 14;
        driverCtx.drawImage(el.driverCam, 0, sy, w, sh, dx, sy, w, sh);
        driverCtx.fillStyle = driverCam.persona === 'neo'
          ? 'rgba(57, 255, 136, 0.18)'
          : 'rgba(255, 184, 77, 0.14)';
        driverCtx.fillRect(0, sy, w, 2);
      }
    }

    // 6) Радиационная рябь Гейгера
    if (player && player.rad >= 35) {
      const radNoise = Math.floor(((player.rad - 30) / 70) * 34);
      driverCtx.fillStyle = 'rgba(255, 198, 92, 0.55)';
      for (let n = 0; n < radNoise; n++) {
        driverCtx.fillRect(Math.random() * w, Math.random() * h, 2, 1.5);
      }
    }

    // 7) Красная вспышка по краям при получении урона
    if (driverCam.damageFlash > 0.03) {
      driverCtx.strokeStyle = `rgba(255, 65, 82, ${driverCam.damageFlash * 0.85})`;
      driverCtx.lineWidth = 7;
      driverCtx.strokeRect(2, 2, w - 4, h - 4);
    }

    // 8) Тонкие CRT-сканлайны + ретро-виньетка монитора кабины
    driverCtx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    for (let y = 0; y < h; y += 3) {
      driverCtx.fillRect(0, y, w, 1);
    }
    const vig = driverCtx.createRadialGradient(w / 2, h / 2, w * 0.36, w / 2, h / 2, w * 0.72);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(2, 6, 4, 0.58)');
    driverCtx.fillStyle = vig;
    driverCtx.fillRect(0, 0, w, h);

    // Уголки видоискателя камеры
    driverCtx.strokeStyle = driverCam.persona === 'neo'
      ? 'rgba(57, 255, 136, 0.65)'
      : driverCam.persona === 'vault'
        ? 'rgba(255, 184, 77, 0.65)'
        : 'rgba(156, 230, 184, 0.35)';
    driverCtx.lineWidth = 1.2;
    const cLen = 8;
    driverCtx.beginPath();
    driverCtx.moveTo(5, 5 + cLen); driverCtx.lineTo(5, 5); driverCtx.lineTo(5 + cLen, 5);
    driverCtx.moveTo(w - 5 - cLen, 5); driverCtx.lineTo(w - 5, 5); driverCtx.lineTo(w - 5, 5 + cLen);
    driverCtx.moveTo(5, h - 5 - cLen); driverCtx.lineTo(5, h - 5); driverCtx.lineTo(5 + cLen, h - 5);
    driverCtx.moveTo(w - 5 - cLen, h - 5); driverCtx.lineTo(w - 5, h - 5); driverCtx.lineTo(w - 5, h - 5 - cLen);
    driverCtx.stroke();

    renderDriverEcg();
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
  function resetRun() {
    const cls = CAR_CLASSES[0];
    player = {
      x: world.depot.x,
      y: world.depot.y + 82,
      vx: 0,
      vy: 0,
      ang: -Math.PI / 2,
      turretAng: -Math.PI / 2,
      hp: cls.maxHp,
      maxHp: cls.maxHp,
      focus: 100,
      maxFocus: 100,
      rad: 0,
      ammo: 65,
      caps: 25,
      score: 0,
      kills: 0,
      missionsDone: 0,
      trace: 0, // 0..5
      carClass: 0,
      engineLvl: 1,
      weaponLvl: 1,
      armorLvl: 1,
      matrixLvl: 1,
      shootCd: 0,
      inDepot: true
    };

    enemies = [];
    bullets = [];
    loot = [];
    particles = [];
    skidmarks = [];
    ghosts = [];
    floatTexts = [];
    lightFlashes = [];
    logs = [];
    enemySpawnTimer = 1.5;
    traceDecayTimer = 0;
    touchMatrixToggle = false;
    matrixActive = false;
    matrixBreach = 0;
    glitchTimer = 0;
    shakeAmt = 0;

    cam.x = player.x;
    cam.y = player.y;

    for (let i = 0; i < 18; i++) spawnLoot();
    for (let i = 0; i < 5; i++) spawnEnemy('raider');

    pickNextMission(true);
    driverReset();
    addLog('Терминал Vault-OS синхронизирован.', 'matrix');
    addLog('VAULT RUNNER // Сектор активен. Собирай крышки и выживай.', '');
    renderGarage();
    syncUI(true);
  }

  function getCarSpec() {
    const base = CAR_CLASSES[player.carClass];
    return {
      ...base,
      maxHp: base.maxHp + (player.armorLvl - 1) * 35,
      maxSpeed: base.maxSpeed + (player.engineLvl - 1) * 36,
      accel: base.accel + (player.engineLvl - 1) * 65,
      turn: base.turn + (player.engineLvl - 1) * 0.16,
      fireDelay: Math.max(0.085, 0.21 - (player.weaponLvl - 1) * 0.032),
      damage: 18 + (player.weaponLvl - 1) * 9,
      maxFocus: 100 + (player.matrixLvl - 1) * 28,
      focusDrain: Math.max(14, 28 - (player.matrixLvl - 1) * 4)
    };
  }

  // ==================== МИССИИ ====================
  function pickNextMission(isFirst) {
    const types = isFirst ? ['collect'] : ['collect', 'hunt', 'hack', 'survive'];
    const type = types[Math.floor(Math.random() * types.length)];
    const tier = 1 + Math.floor(player.missionsDone / 2);

    if (type === 'collect') {
      const goal = Math.min(5, 2 + tier);
      mission = {
        type: 'collect',
        stage: 'gather', // gather -> return
        title: 'Сбор припасов пустоши',
        desc: `Соберите ${goal} контейнера лута и доставьте данные в Бункер-Депо.`,
        progress: 0,
        goal,
        reward: 50 + tier * 20
      };
    } else if (type === 'hunt') {
      const goal = Math.min(5, 2 + Math.floor(tier / 2));
      mission = {
        type: 'hunt',
        title: 'Зачистка сектора',
        desc: `Уничтожьте ${goal} вражеских машин (рейдеров или Агентов).`,
        progress: 0,
        goal,
        reward: 65 + tier * 25
      };
    } else if (type === 'hack') {
      const term = world.terminals[Math.floor(Math.random() * world.terminals.length)];
      mission = {
        type: 'hack',
        title: `Взлом: ${term.name}`,
        desc: `Прибудьте к зелёному терминалу (${term.name}) и удерживайте позицию 5 сек.`,
        target: { x: term.x, y: term.y, name: term.name, radius: 74 },
        progress: 0,
        goal: 5,
        reward: 80 + tier * 25
      };
    } else {
      const goal = 16 + tier * 3;
      mission = {
        type: 'survive',
        title: 'Уход от Следа Матрицы',
        desc: `Выживите под преследованием Системы в течение ${goal} сек.`,
        progress: 0,
        goal,
        reward: 75 + tier * 25
      };
      player.trace = Math.max(player.trace, 2);
      spawnEnemy('agent');
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
    player.hp = Math.min(player.maxHp, player.hp + 25);
    player.focus = player.maxFocus;
    player.trace = Math.max(0, player.trace - 1);
    AudioFX.missionDone();
    if (prevType === 'hack' || prevType === 'survive') {
      driverAwakenNeo(2.6, pickQuote(DRIVER_QUOTES.neo));
    } else {
      driverDrinkCanteen(pickQuote(DRIVER_QUOTES.mission));
    }
    addFloatText(player.x, player.y - 26, `КОНТРАКТ +${reward} ₵`, '#ffb84d');
    addLog(`Контракт выполнен! Получено +${reward} ₵ и +25 HP.`, 'matrix');
    updateBestScore();
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

  function spawnEnemy(kind) {
    const p = world.pickRoadSpawn(player, 420);
    const isAgent = kind === 'agent';
    const hp = isAgent ? 80 + player.missionsDone * 10 : 48 + player.missionsDone * 6;
    enemies.push({
      id: nextEntId++,
      kind: isAgent ? 'agent' : 'raider',
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
      ang: Math.random() * Math.PI * 2,
      hp,
      maxHp: hp,
      len: isAgent ? 38 : 34,
      wid: isAgent ? 20 : 19,
      speed: isAgent ? 225 : 175,
      shootCd: 0.7 + Math.random() * 0.9,
      wanderAng: Math.random() * Math.PI * 2,
      wanderTimer: 1 + Math.random() * 2
    });
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

  function explodeVehicle(x, y, isAgent) {
    AudioFX.explode();
    shakeAmt = Math.min(14, shakeAmt + 8);
    driverOnExplosion(x, y, isAgent);
    addLightFlash(x, y, 280, isAgent ? '#39ff88' : '#ff9436', 0.42);
    spawnBurst(x, y, '#ffb84d', 18, 220);
    spawnBurst(x, y, isAgent ? '#39ff88' : '#ff4d5a', 14, 170);
    spawnBurst(x, y, '#8aa090', 8, 90);
  }

  // ==================== ГАРАЖ И ДЕПО ====================
  function depotService() {
    if (!player || gameState !== 'playing') return;
    if (!player.inDepot) {
      addLog('Подъедьте к центру Бункера-Депо для сервиса.', 'warn');
      return;
    }
    const emergencyFree = player.caps < 15 && player.hp < player.maxHp * 0.45;
    const cost = emergencyFree ? 0 : 15;
    if (player.caps < cost) {
      addLog('Недостаточно крышек (нужно 15 ₵).', 'warn');
      return;
    }
    player.caps -= cost;
    player.hp = player.maxHp;
    player.rad = 0;
    player.ammo += 30;
    player.trace = Math.max(0, player.trace - 1);
    AudioFX.upgrade();
    driverDrinkCanteen(pickQuote(DRIVER_QUOTES.depot));
    addFloatText(player.x, player.y - 24, emergencyFree ? 'АВАРИЙНЫЙ РЕМОНТ!' : 'РЕМОНТ + АНТИРАД', '#39ff88');
    addLog('Бункер-Депо: корпус восстановлен, радиация снята, +30 патр.', 'matrix');
    renderGarage();
    syncUI(true);
  }

  function getUpgradesDef() {
    const nextClass = CAR_CLASSES[player.carClass + 1];
    return [
      {
        id: 'engine',
        name: 'Турбодвигатель',
        lvl: `${player.engineLvl} / 4`,
        maxed: player.engineLvl >= 4,
        cost: 35 + (player.engineLvl - 1) * 35,
        desc: '+36 макс. скорости, улучшенный разгон и управляемость.',
        apply() { player.engineLvl++; }
      },
      {
        id: 'weapon',
        name: 'Турель / Плазма',
        lvl: `${player.weaponLvl} / 4`,
        maxed: player.weaponLvl >= 4,
        cost: 40 + (player.weaponLvl - 1) * 40,
        desc: '+9 урона, быстрее скорострельность. На 3+ ур. — двойной залп!',
        apply() { player.weaponLvl++; }
      },
      {
        id: 'armor',
        name: 'Бронелисты пустоши',
        lvl: `${player.armorLvl} / 4`,
        maxed: player.armorLvl >= 4,
        cost: 35 + (player.armorLvl - 1) * 35,
        desc: '+35 макс. HP и мгновенный ремонт +35 HP.',
        apply() {
          player.armorLvl++;
          player.maxHp = getCarSpec().maxHp;
          player.hp = Math.min(player.maxHp, player.hp + 35);
        }
      },
      {
        id: 'matrix',
        name: 'Ядро Матрицы',
        lvl: `${player.matrixLvl} / 4`,
        maxed: player.matrixLvl >= 4,
        cost: 45 + (player.matrixLvl - 1) * 40,
        desc: 'Увеличивает запас Фокуса и замедляет его расход в bullet-time.',
        apply() {
          player.matrixLvl++;
          player.maxFocus = getCarSpec().maxFocus;
          player.focus = player.maxFocus;
        }
      },
      {
        id: 'car',
        name: nextClass ? `Новый класс: ${nextClass.name}` : 'Максимальный класс авто',
        lvl: CAR_CLASSES[player.carClass].rank,
        maxed: !nextClass,
        cost: nextClass ? nextClass.cost : 0,
        desc: nextClass
          ? `Переход на ${nextClass.name} (${nextClass.rank}): больше брони и мощи.`
          : 'Вы уже управляете топовым WAR RIG MK-III.',
        apply() {
          player.carClass++;
          player.maxHp = getCarSpec().maxHp;
          player.hp = player.maxHp;
        }
      },
      {
        id: 'kit',
        name: 'Полевой ремкомплект',
        lvl: 'РАСХОДНИК',
        maxed: false,
        cost: 25,
        desc: 'Мгновенно +45 HP, -45% радиации и +30 патронов в любой точке города.',
        apply() {
          player.hp = Math.min(player.maxHp, player.hp + 45);
          player.rad = Math.max(0, player.rad - 45);
          player.ammo += 30;
        }
      }
    ];
  }

  function renderGarage() {
    if (!player) return;
    el.uiGarageCaps.textContent = `${player.caps} ₵`;
    const list = getUpgradesDef();
    el.garageList.innerHTML = '';
    for (const u of list) {
      const card = document.createElement('div');
      card.className = 'upg-card';
      const canBuy = !u.maxed && player.caps >= u.cost;
      card.innerHTML = `
        <div class="upg-head">
          <span class="upg-name">${escapeHtml(u.name)}</span>
          <span class="upg-lvl">${escapeHtml(u.lvl)}</span>
        </div>
        <div class="upg-desc">${escapeHtml(u.desc)}</div>
        <button class="btn-small" type="button" ${canBuy ? '' : 'disabled'}>
          ${u.maxed ? 'МАКСИМУМ' : `УСТАНОВИТЬ · ${u.cost} ₵`}
        </button>
      `;
      const btn = card.querySelector('button');
      btn.addEventListener('click', () => {
        AudioFX.unlock();
        if (u.maxed || player.caps < u.cost) return;
        player.caps -= u.cost;
        u.apply();
        AudioFX.upgrade();
        if (u.id === 'matrix') {
          driverAwakenNeo(2.2, pickQuote(DRIVER_QUOTES.neo));
        } else {
          driverDrinkCanteen(pickQuote(DRIVER_QUOTES.upgrade));
        }
        addLog(`Установлено: ${u.name}`, 'matrix');
        addFloatText(player.x, player.y - 24, `АПГРЕЙД: ${u.name}`, '#38e8ff');
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
      player.focus = Math.min(player.maxFocus, player.focus + 14 * dt);
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
        if (e.kind === 'agent') {
          const ad = dist(player, e);
          if (ad < 320) targetBreach = Math.max(targetBreach, (1 - ad / 320) * 0.72);
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

    if (joy.active && joy.mag > 0.12) {
      // Интуитивное управление для телефона: рулим в сторону стика, газ = отклонение
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
      AudioFX.crash();
      spawnBurst(player.x, player.y, '#ffb84d', 5, 110);
      shakeAmt = Math.min(8, shakeAmt + 2.5);
      driverOnHit(4, true);
    }

    // Зелёные цифровые следы при активной Матрице
    if (matrixActive && Math.hypot(player.vx, player.vy) > 40 && Math.random() < 0.45) {
      ghosts.push({
        x: player.x, y: player.y, ang: player.ang,
        len: spec.len, wid: spec.wid, life: 0.28, maxLife: 0.28
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

    // Стрельба
    if (player.shootCd > 0) player.shootCd -= dt;
    const wantFire = !!(mouse.down || keys.Space || touchFire);
    if (wantFire && player.shootCd <= 0) {
      if (player.ammo > 0) {
        player.shootCd = spec.fireDelay;
        player.ammo--;
        const a = player.turretAng;
        const muzzleDist = spec.len * 0.48;
        const bulletCol = player.weaponLvl >= 3 ? '#39ff88' : '#ffd86b';

        if (player.weaponLvl >= 3) {
          // Двойной залп на 3+ уровне оружия
          const perpX = -Math.sin(a) * 5;
          const perpY = Math.cos(a) * 5;
          fireBullet('player', player.x + Math.cos(a) * muzzleDist + perpX, player.y + Math.sin(a) * muzzleDist + perpY, a - 0.025, 760, spec.damage * 0.72, bulletCol, 3.6);
          fireBullet('player', player.x + Math.cos(a) * muzzleDist - perpX, player.y + Math.sin(a) * muzzleDist - perpY, a + 0.025, 760, spec.damage * 0.72, bulletCol, 3.6);
        } else {
          fireBullet('player', player.x + Math.cos(a) * muzzleDist, player.y + Math.sin(a) * muzzleDist, a, 720, spec.damage, bulletCol, 3.5);
        }
        AudioFX.shoot(player.weaponLvl >= 3);
        driverOnGunfire(player.weaponLvl >= 3, a);
        spawnBurst(player.x + Math.cos(a) * muzzleDist, player.y + Math.sin(a) * muzzleDist, bulletCol, 3, 95);
      } else {
        player.shootCd = 0.45;
        addLog('Нет патронов! Подберите красные ящики или заедьте в Депо.', 'warn');
      }
    }
  }

  function damagePlayer(dmg, isRad) {
    if (!player || gameState !== 'playing') return;
    player.hp -= dmg;
    if (!isRad) {
      AudioFX.hit();
      shakeAmt = Math.min(10, shakeAmt + 3.2);
      driverOnHit(dmg, false);
      if (dmg >= 6) glitchTimer = Math.max(glitchTimer, 0.2);
    }
    if (player.hp <= 0) {
      player.hp = 0;
      explodeVehicle(player.x, player.y, false);
      updateBestScore();
      setOverlayState('dead');
      syncUI(true);
    }
  }

  function updateEnemies(dt) {
    const targetCount = Math.min(11, 5 + player.trace + Math.floor(player.missionsDone / 2));
    enemySpawnTimer -= dt;
    if (enemySpawnTimer <= 0 && enemies.length < targetCount) {
      enemySpawnTimer = 3.2;
      const spawnAgent = player.trace >= 2 && Math.random() < (0.25 + player.trace * 0.12);
      spawnEnemy(spawnAgent ? 'agent' : 'raider');
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const d = dist(e, player);
      const isAgent = e.kind === 'agent';
      const aggroDist = isAgent ? 780 : 480;

      if (d < aggroDist && !player.inDepot) {
        // Преследование игрока с объездом зданий
        const desiredAng = Math.atan2(player.y - e.y, player.x - e.x);
        const diff = normAngle(desiredAng - e.ang);
        e.ang = normAngle(e.ang + clamp(diff, -2.9 * dt, 2.9 * dt));
        const desiredSpeed = d > 135 ? e.speed : e.speed * 0.35;
        e.vx += (Math.cos(e.ang) * desiredSpeed - e.vx) * Math.min(1, 3.8 * dt);
        e.vy += (Math.sin(e.ang) * desiredSpeed - e.vy) * Math.min(1, 3.8 * dt);

        // Стрельба по игроку
        e.shootCd -= dt;
        if (e.shootCd <= 0 && d < (isAgent ? 390 : 300)) {
          e.shootCd = isAgent ? 0.95 : 1.45;
          const aim = Math.atan2(player.y - e.y, player.x - e.x) + (Math.random() - 0.5) * (isAgent ? 0.1 : 0.22);
          fireBullet(
            'enemy',
            e.x + Math.cos(aim) * 20,
            e.y + Math.sin(aim) * 20,
            aim,
            isAgent ? 470 : 390,
            isAgent ? 13 : 9,
            isAgent ? '#39ff88' : '#ff6b57',
            3.4
          );
        }
      } else {
        // Патрулирование улиц
        e.wanderTimer -= dt;
        if (e.wanderTimer <= 0) {
          e.wanderTimer = 1.6 + Math.random() * 2.2;
          // Выбираем одно из 4 кардинальных направлений вдоль сетки дорог
          e.wanderAng = Math.floor(Math.random() * 4) * (Math.PI / 2);
        }
        const diff = normAngle(e.wanderAng - e.ang);
        e.ang = normAngle(e.ang + clamp(diff, -2.5 * dt, 2.5 * dt));
        const sp = e.speed * 0.6;
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

      // Столкновение машина-в-машину с игроком
      const minSep = 24;
      const pd = dist(e, player);
      if (pd < minSep && pd > 0.01) {
        const nx = (player.x - e.x) / pd;
        const ny = (player.y - e.y) / pd;
        const push = (minSep - pd) * 0.55;
        player.x += nx * push;
        player.y += ny * push;
        e.x -= nx * push;
        e.y -= ny * push;
        const relSp = Math.hypot(player.vx - e.vx, player.vy - e.vy);
        if (relSp > 120) {
          // Таран: WAR RIG наносит сильный урон при таране
          const ramMult = player.carClass === 2 ? 0.34 : 0.16;
          e.hp -= relSp * ramMult;
          damagePlayer(relSp * (player.carClass === 2 ? 0.03 : 0.06), false);
          spawnBurst((player.x + e.x) / 2, (player.y + e.y) / 2, '#ffb84d', 6, 130);
          if (e.hp <= 0) destroyEnemy(i);
        }
      }
    }
  }

  function destroyEnemy(index) {
    const e = enemies[index];
    if (!e) return;
    const isAgent = e.kind === 'agent';
    explodeVehicle(e.x, e.y, isAgent);
    enemies.splice(index, 1);

    const capsGain = isAgent ? 30 : 18;
    const scoreGain = isAgent ? 180 : 100;
    player.caps += capsGain;
    player.score += scoreGain;
    player.kills++;
    player.focus = Math.min(player.maxFocus, player.focus + 22);
    player.trace = Math.min(5, player.trace + (isAgent ? 1 : (player.kills % 2 === 0 ? 1 : 0)));
    traceDecayTimer = 0;

    addFloatText(e.x, e.y - 16, `+${capsGain} ₵`, '#ffb84d');
    addLog(isAgent ? `Агент Матрицы нейтрализован! +${capsGain} ₵` : `Рейдер уничтожен! +${capsGain} ₵`, isAgent ? 'matrix' : '');
    driverOnKill(isAgent);

    // Дроп лута на месте взрыва
    if (Math.random() < 0.72) {
      spawnLoot({ x: e.x, y: e.y }, isAgent ? 'focus' : (Math.random() < 0.5 ? 'ammo' : 'medkit'));
    }

    if (mission && mission.type === 'hunt') {
      mission.progress++;
      if (mission.progress >= mission.goal) completeMission();
    }
    updateBestScore();
    renderGarage();
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if (b.life <= 0 || world.isPointInBuilding(b.x, b.y)) {
        spawnBurst(b.x, b.y, b.color, 3, 75);
        bullets.splice(i, 1);
        continue;
      }

      if (b.owner === 'player') {
        let hit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
          const e = enemies[j];
          if (Math.hypot(b.x - e.x, b.y - e.y) < e.len * 0.52) {
            e.hp -= b.dmg;
            AudioFX.hit();
            spawnBurst(b.x, b.y, b.color, 5, 110);
            if (e.hp <= 0) destroyEnemy(j);
            hit = true;
            break;
          }
        }
        if (hit) bullets.splice(i, 1);
      } else {
        if (Math.hypot(b.x - player.x, b.y - player.y) < 20) {
          spawnBurst(b.x, b.y, '#ff4d5a', 5, 100);
          damagePlayer(b.dmg, false);
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
        if (it.type === 'ammo') player.ammo += 28;
        else if (it.type === 'medkit') {
          player.hp = Math.min(player.maxHp, player.hp + 35);
          driverDrinkCanteen(pickQuote(DRIVER_QUOTES.canteen));
        } else if (it.type === 'caps') player.caps += 25;
        else if (it.type === 'focus') {
          player.focus = Math.min(player.maxFocus, player.focus + 55);
          driverAwakenNeo(1.8, pickQuote(DRIVER_QUOTES.neo));
        } else if (it.type === 'radaway') {
          player.rad = Math.max(0, player.rad - 55);
          driverDrinkCanteen('Антирадин пошёл. Фляжка снова выручает.');
        } else if (it.type === 'module') { player.caps += 35; player.score += 60; }

        player.score += 25;
        AudioFX.pickup();
        addFloatText(it.x, it.y - 12, def.label, def.color);
        addLog(`Подобрано: ${def.label}`);
        loot.splice(i, 1);

        if (mission && mission.type === 'collect' && mission.stage === 'gather') {
          mission.progress++;
          if (mission.progress >= mission.goal) {
            mission.stage = 'return';
            mission.desc = 'Все припасы собраны! Доставьте груз в центральный Бункер-Депо.';
            addLog('Груз собран! Возвращайтесь в Бункер-Депо.', 'warn');
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

    // 1. Запечённый текстурный асфальт, тротуары, Депо, кратеры и остовы авто
    ctx.drawImage(world.mapCanvas, 0, 0);

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

    // Пули и трассеры (светятся в темноте!)
    for (const b of bullets) {
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

    // Тактический радар и камера в кабине (ПК)
    renderMinimap(minimapCtx, minimapCanvas.width, minimapCanvas.height);
    if (!el.mobileRadarFloat.classList.contains('hidden')) {
      renderMinimap(mobileMinimapCtx, mobileMinimapCanvas.width, mobileMinimapCanvas.height);
    }
    renderDriverCam();
  }

  // ==================== КАРТА ДИНАМИЧЕСКОГО СВЕТА (CYBER-NOIR) ====================
  function addRadialLight(wx, wy, r, rCol, gCol, bCol, alpha) {
    const g = lightCtx.createRadialGradient(wx, wy, 2, wx, wy, r);
    g.addColorStop(0, `rgba(${rCol},${gCol},${bCol},${alpha})`);
    g.addColorStop(0.45, `rgba(${rCol},${gCol},${bCol},${alpha * 0.42})`);
    g.addColorStop(1, `rgba(${rCol},${gCol},${bCol},0)`);
    lightCtx.fillStyle = g;
    lightCtx.beginPath();
    lightCtx.arc(wx, wy, r, 0, Math.PI * 2);
    lightCtx.fill();
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
    // Глубокий ночной нуар-эмбиент (в режиме Матрицы — фосфорно-зелёный)
    lightCtx.fillStyle = matrixActive ? '#224433' : '#26303d';
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

    // Фары врагов (рейдеры — оранжевый свет, Агенты Матрицы — пугающий изумрудный!)
    for (const e of enemies) {
      if (e.x < minX - 180 || e.x > maxX + 180 || e.y < minY - 180 || e.y > maxY + 180) continue;
      if (e.kind === 'agent') {
        addHeadlightCone(e.x, e.y, e.ang, 220, 68, '57,255,136', 0.82);
        addRadialLight(e.x, e.y, 52, 57, 255, 136, 0.45);
      } else {
        addHeadlightCone(e.x, e.y, e.ang, 175, 54, '255,135,72', 0.68);
      }
    }

    // Фары, ореол и стоп-сигналы игрока
    if (player && player.hp > 0) {
      const headRgb = matrixActive ? '90,255,175' : '255,244,205';
      addHeadlightCone(player.x, player.y, player.ang, 320, 108, headRgb, 0.98);
      addRadialLight(player.x, player.y, 120, 225, 240, 230, 0.58);
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
    // 1. Ночной косой дождь + тлеющие угли/пепел пустоши
    ctx.lineWidth = 1.1;
    for (const d of weatherDrops) {
      if (d.isEmber) {
        ctx.fillStyle = `rgba(255, 168, 72, ${d.alpha})`;
        ctx.fillRect(d.x, d.y, d.len, d.len);
      } else {
        ctx.strokeStyle = matrixBreach > 0.4
          ? `rgba(110, 255, 175, ${d.alpha * (1 + matrixBreach * 0.5)})`
          : `rgba(170, 205, 225, ${d.alpha})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.len * 0.24, d.y + d.len);
        ctx.stroke();
      }
    }

    // 2. «Скрытый код под ржавчиной»: цифровой дождь Матрицы прорывается в ключевых зонах и в Фокусе
    if (matrixBreach > 0.04) {
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      const baseAlpha = clamp(matrixBreach * 0.30, 0, 0.30);
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

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.ang);

    // Конусы фар (вперёд по +X)
    const beam = ctx.createLinearGradient(hl, 0, hl + 95, 0);
    beam.addColorStop(0, matrixActive ? 'rgba(57, 255, 136, 0.34)' : 'rgba(255, 244, 190, 0.28)');
    beam.addColorStop(1, 'rgba(255, 244, 190, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(hl, -hw + 2);
    ctx.lineTo(hl + 95, -hw - 26);
    ctx.lineTo(hl + 95, hw + 26);
    ctx.lineTo(hl, hw - 2);
    ctx.closePath();
    ctx.fill();

    // Тень под машиной
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(-hl + 3, -hw + 4, spec.len, spec.wid);

    // Колёса
    ctx.fillStyle = '#0c100e';
    ctx.fillRect(hl - 11, -hw - 2, 9, 4);
    ctx.fillRect(hl - 11, hw - 2, 9, 4);
    ctx.fillRect(-hl + 3, -hw - 2, 9, 4);
    ctx.fillRect(-hl + 3, hw - 2, 9, 4);

    // Кузов
    ctx.fillStyle = spec.fill;
    ctx.strokeStyle = matrixActive ? '#39ff88' : '#0b140d';
    ctx.lineWidth = 2;
    ctx.fillRect(-hl, -hw, spec.len, spec.wid);
    ctx.strokeRect(-hl, -hw, spec.len, spec.wid);

    // Полоса и кабина
    ctx.fillStyle = spec.trim;
    ctx.fillRect(-hl + 3, -2, spec.len - 6, 4);

    // Лобовое стекло (спереди)
    ctx.fillStyle = '#112529';
    ctx.fillRect(hl - 13, -hw + 3, 7, spec.wid - 6);

    // Фары и стоп-огни
    ctx.fillStyle = '#fff9c4';
    ctx.fillRect(hl - 2, -hw + 2, 3, 4);
    ctx.fillRect(hl - 2, hw - 6, 3, 4);
    ctx.fillStyle = '#ff4d5a';
    ctx.fillRect(-hl - 1, -hw + 2, 2, 4);
    ctx.fillRect(-hl - 1, hw - 6, 2, 4);

    ctx.restore();

    // Вращающаяся турель на крыше
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.turretAng);
    ctx.fillStyle = '#1a2b20';
    ctx.strokeStyle = '#39ff88';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = player.weaponLvl >= 3 ? '#39ff88' : '#ffb84d';
    if (player.weaponLvl >= 3) {
      ctx.fillRect(4, -3.5, 13, 2.4);
      ctx.fillRect(4, 1.1, 13, 2.4);
    } else {
      ctx.fillRect(4, -1.6, 13, 3.2);
    }
    ctx.restore();
  }

  function drawEnemyCar(e) {
    const isAgent = e.kind === 'agent';
    const hl = e.len / 2;
    const hw = e.wid / 2;

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.ang);

    // Фары врага
    const beam = ctx.createLinearGradient(hl, 0, hl + 58, 0);
    beam.addColorStop(0, isAgent ? 'rgba(57, 255, 136, 0.35)' : 'rgba(255, 110, 80, 0.24)');
    beam.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(hl, -hw + 2);
    ctx.lineTo(hl + 58, -hw - 14);
    ctx.lineTo(hl + 58, hw + 14);
    ctx.lineTo(hl, hw - 2);
    ctx.closePath();
    ctx.fill();

    // Кузов
    ctx.fillStyle = isAgent ? '#101914' : '#9c3a2b';
    ctx.strokeStyle = isAgent ? '#39ff88' : '#ff8c52';
    ctx.lineWidth = 1.8;
    ctx.fillRect(-hl, -hw, e.len, e.wid);
    ctx.strokeRect(-hl, -hw, e.len, e.wid);

    // Стекло
    ctx.fillStyle = isAgent ? 'rgba(57, 255, 136, 0.35)' : '#251410';
    ctx.fillRect(hl - 12, -hw + 3, 6, e.wid - 6);
    ctx.restore();

    // Полоска HP над врагом (если ранен)
    if (e.hp < e.maxHp) {
      const bw = 30;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(e.x - bw / 2, e.y - 24, bw, 4);
      ctx.fillStyle = isAgent ? '#39ff88' : '#ff4d5a';
      ctx.fillRect(e.x - bw / 2, e.y - 24, bw * clamp(e.hp / e.maxHp, 0, 1), 4);
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

    // Лут
    mCtx.fillStyle = '#38e8ff';
    for (const it of loot) {
      mCtx.fillRect(it.x * sx - 1.5, it.y * sy - 1.5, 3, 3);
    }

    // Враги
    for (const e of enemies) {
      mCtx.fillStyle = e.kind === 'agent' ? '#39ff88' : '#ff4d5a';
      mCtx.beginPath();
      mCtx.arc(e.x * sx, e.y * sy, 2.8, 0, Math.PI * 2);
      mCtx.fill();
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
        el.uiSignalBadge.textContent = 'MATRIX SYNC';
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
    el.hudSector.textContent = world.sectorName(player.x, player.y);
    const stars = '★'.repeat(player.trace) + '☆'.repeat(5 - player.trace);
    el.hudTrace.textContent = `СЛЕД: ${stars}`;

    // Депо-статус
    el.uiDepotBanner.classList.toggle('in-zone', player.inDepot);
    el.btnTouchDepot.classList.toggle('hidden', !player.inDepot);
    const emergencyFree = player.caps < 15 && player.hp < player.maxHp * 0.45;
    el.btnDepotService.disabled = !player.inDepot || (!emergencyFree && player.caps < 15);
    el.btnDepotService.textContent = emergencyFree
      ? 'АВАРИЙНЫЙ РЕМОНТ (БЕСПЛАТНО)'
      : 'РЕМОНТ + АНТИРАД (15 ₵)';
    el.uiDepotHint.textContent = player.inDepot
      ? 'Вы в зоне Депо! Нажмите [E] или кнопку ниже для ремонта.'
      : 'Заедьте в центр карты (Бункер-Депо) для ремонта и снятия RAD.';

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
    if (state === 'playing') {
      el.overlay.classList.add('hidden');
      el.btnPauseResume.textContent = '❚❚ ПАУЗА';
      return;
    }

    el.overlay.classList.remove('hidden');
    if (state === 'menu') {
      if (el.modalLogoWrap) el.modalLogoWrap.classList.remove('hidden');
      el.modalTitle.classList.add('hidden');
      el.modalTitle.textContent = 'VAULT RUNNER';
      el.modalSub.innerHTML = 'Постапокалиптический мегаполис под скрытым кодом Системы. Гоняй по руинам, собирай крышки и лут, улучшай машину в Бункере-Депо и прорывай время в режиме <strong>Матрицы</strong>.';
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
      el.btnPauseResume.textContent = '❚❚ ПАУЗА';
    }
  }

  // ==================== РЕСАЙЗ КАНВАСА (МОНИТОР + ТЕЛЕФОН) ====================
  function resizeCanvas() {
    const rect = stageScreen.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewW = w;
    viewH = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    // Полуразмерная карта освещения (мягкий свет + x4 меньше нагрузка на GPU)
    lightCanvas.width = Math.max(1, Math.round(w * 0.5));
    lightCanvas.height = Math.max(1, Math.round(h * 0.5));
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

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (gameState === 'playing') setOverlayState('paused');
      else if (gameState === 'paused') setOverlayState('playing');
    } else if (e.code === 'Enter') {
      AudioFX.unlock();
      if (gameState === 'menu' || gameState === 'paused') setOverlayState('playing');
      else if (gameState === 'dead') { resetRun(); setOverlayState('playing'); }
    } else if (e.code === 'KeyE') {
      depotService();
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
  }
  tabBtns.forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));

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

  el.btnMobileMenu.addEventListener('click', openMobileMenu);
  el.btnCloseMenu.addEventListener('click', closeMobileMenu);
  el.backdrop.addEventListener('click', closeMobileMenu);
  el.btnMobileRadar.addEventListener('click', () => {
    el.mobileRadarFloat.classList.toggle('hidden');
  });

  // Привязка настроек
  function applyPrefs() {
    AudioFX.setEnabled(prefs.sound);
    document.body.classList.toggle('crt-on', prefs.crt);
    el.app.classList.toggle('sidebar-left', prefs.sidebarLeft);
    el.optSound.checked = prefs.sound;
    el.optCrt.checked = prefs.crt;
    el.optNoir.checked = prefs.noir;
    el.optRain.checked = prefs.rain;
    el.optSidebarLeft.checked = prefs.sidebarLeft;
    el.optZoom.value = String(prefs.zoom);
    el.optZoomVal.textContent = `${prefs.zoom.toFixed(2)}×`;
  }

  el.optSound.addEventListener('change', () => { prefs.sound = el.optSound.checked; applyPrefs(); savePrefs(); });
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
