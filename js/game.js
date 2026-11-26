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
  const stageWrap = document.getElementById('stage-wrap');
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
    optRain: document.getElementById('opt-rain'),
    optSidebarLeft: document.getElementById('opt-sidebar-left'),
    optZoom: document.getElementById('opt-zoom'),
    optZoomVal: document.getElementById('opt-zoom-val'),

    joyZone: document.getElementById('joy-zone'),
    joyBase: document.getElementById('joy-base'),
    joyStick: document.getElementById('joy-stick'),
    btnTouchFire: document.getElementById('btn-touch-fire'),
    btnTouchMatrix: document.getElementById('btn-touch-matrix'),
    btnTouchDepot: document.getElementById('btn-touch-depot')
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
        rain: saved.rain !== false,
        sidebarLeft: !!saved.sidebarLeft,
        zoom: clamp(Number(saved.zoom || 1), 0.7, 1.4)
      };
    } catch {
      return { sound: true, crt: true, rain: true, sidebarLeft: false, zoom: 1.0 };
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
    logs = [];
    enemySpawnTimer = 1.5;
    traceDecayTimer = 0;
    touchMatrixToggle = false;
    matrixActive = false;
    shakeAmt = 0;

    cam.x = player.x;
    cam.y = player.y;

    for (let i = 0; i < 18; i++) spawnLoot();
    for (let i = 0; i < 5; i++) spawnEnemy('raider');

    pickNextMission(true);
    addLog('Терминал Vault-OS синхронизирован.', 'matrix');
    addLog('Добро пожаловать в GTA 0. Собирай крышки и выживай.', '');
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
    const reward = mission.reward;
    player.caps += reward;
    player.score += reward * 4;
    player.missionsDone++;
    player.hp = Math.min(player.maxHp, player.hp + 25);
    player.focus = player.maxFocus;
    player.trace = Math.max(0, player.trace - 1);
    AudioFX.missionDone();
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
        AudioFX.matrix(true);
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
    el.matrixVignette.classList.toggle('active', matrixActive);
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
        else if (it.type === 'medkit') player.hp = Math.min(player.maxHp, player.hp + 35);
        else if (it.type === 'caps') player.caps += 25;
        else if (it.type === 'focus') player.focus = Math.min(player.maxFocus, player.focus + 55);
        else if (it.type === 'radaway') player.rad = Math.max(0, player.rad - 55);
        else if (it.type === 'module') { player.caps += 35; player.score += 60; }

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
  }

  // ==================== ЦИФРОВОЙ ДОЖДЬ МАТРИЦЫ ====================
  function initDigitalRain() {
    const colCount = Math.max(12, Math.floor(viewW / 44));
    rainCols = [];
    for (let i = 0; i < colCount; i++) {
      rainCols.push({
        x: (i + 0.5) * (viewW / colCount),
        y: Math.random() * viewH,
        speed: 55 + Math.random() * 95,
        len: 4 + Math.floor(Math.random() * 6),
        chIdx: Math.floor(Math.random() * MATRIX_CHARS.length)
      });
    }
  }

  function updateDigitalRain(dt) {
    if (!prefs.rain) return;
    const mult = matrixActive ? 2.4 : 0.7;
    for (const c of rainCols) {
      c.y += c.speed * mult * dt;
      if (Math.random() < 0.14) c.chIdx = (c.chIdx + 1) % MATRIX_CHARS.length;
      if (c.y - c.len * 18 > viewH) {
        c.y = -20 - Math.random() * 140;
      }
    }
  }

  // ==================== РЕНДЕР ИГРОВОГО ПОЛЯ ====================
  function render() {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#060c08';
    ctx.fillRect(0, 0, viewW, viewH);

    const z = effectiveZoom();
    const sx = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;
    const sy = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;

    // Мировые координаты
    ctx.save();
    ctx.translate(viewW / 2 + sx, viewH / 2 + sy);
    ctx.scale(z, z);
    ctx.translate(-cam.x, -cam.y);

    // 1. Запечённый город (1 drawImage на кадр!)
    ctx.drawImage(world.mapCanvas, 0, 0);

    // 2. Анимация Матричных терминалов и цели взлома
    drawTerminals();

    // 3. Следы шин
    for (const sk of skidmarks) {
      ctx.save();
      ctx.translate(sk.x, sk.y);
      ctx.rotate(sk.ang);
      ctx.fillStyle = `rgba(10, 14, 11, ${Math.min(0.45, sk.life * 0.12)})`;
      ctx.fillRect(-5, -6, 10, 3);
      ctx.fillRect(-5, 3, 10, 3);
      ctx.restore();
    }

    // 4. Лут
    for (const it of loot) drawLootItem(it);

    // 5. Цифровые фантомы машины в режиме Матрицы
    for (const g of ghosts) {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.ang);
      const a = (g.life / g.maxLife) * 0.4;
      ctx.strokeStyle = `rgba(57, 255, 136, ${a})`;
      ctx.fillStyle = `rgba(57, 255, 136, ${a * 0.35})`;
      ctx.lineWidth = 1.5;
      ctx.fillRect(-g.len / 2, -g.wid / 2, g.len, g.wid);
      ctx.strokeRect(-g.len / 2, -g.wid / 2, g.len, g.wid);
      ctx.restore();
    }

    // 6. Враги
    for (const e of enemies) drawEnemyCar(e);

    // 7. Автонаводка (маркер цели на мобильном)
    if (lastAutoTarget) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 77, 90, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lastAutoTarget.x, lastAutoTarget.y, 26 + Math.sin(elapsed * 10) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 8. Машина игрока
    if (player && player.hp > 0) drawPlayerCar();

    // 9. Пули и трассеры
    for (const b of bullets) {
      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.radius * 0.85;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.025, b.y - b.vy * 0.025);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 10. Частицы
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // 11. Всплывающий текст
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

    // 12. Экранный слой: цифровой дождь Матрицы
    if (prefs.rain) drawDigitalRain();

    // 13. Компас-стрелка к цели миссии (если цель за экраном)
    if (player && gameState === 'playing') drawMissionCompass();

    ctx.restore();

    // 14. Тактический радар (десктоп + мобильный)
    renderMinimap(minimapCtx, minimapCanvas.width, minimapCanvas.height);
    if (!el.mobileRadarFloat.classList.contains('hidden')) {
      renderMinimap(mobileMinimapCtx, mobileMinimapCanvas.width, mobileMinimapCanvas.height);
    }
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

  function drawDigitalRain() {
    ctx.save();
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    const baseAlpha = matrixActive ? 0.26 : 0.08;
    for (const c of rainCols) {
      for (let k = 0; k < c.len; k++) {
        const y = c.y - k * 15;
        if (y < -15 || y > viewH + 15) continue;
        const ch = MATRIX_CHARS[(c.chIdx + k * 3) % MATRIX_CHARS.length];
        ctx.fillStyle = k === 0
          ? `rgba(190, 255, 215, ${baseAlpha * 1.7})`
          : `rgba(57, 255, 136, ${baseAlpha * (1 - k / c.len)})`;
        ctx.fillText(ch, c.x, y);
      }
    }
    ctx.restore();
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

    // Игрок
    if (player) {
      mCtx.save();
      mCtx.translate(player.x * sx, player.y * sy);
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
      el.modalTitle.textContent = 'GTA 0: WASTELAND MATRIX';
      el.modalSub.innerHTML = 'Постапокалиптический мегаполис под контролем Системы. Гоняй по руинам, собирай крышки и лут, улучшай машину в Бункере-Депо и взламывай время в режиме <strong>Матрицы</strong>.';
      el.btnPlay.textContent = '▶ ВЪЕХАТЬ В ПУСТОШЬ';
      el.btnRestartModal.classList.add('hidden');
    } else if (state === 'paused') {
      el.modalTitle.textContent = 'ТЕРМИНАЛ НА ПАУЗЕ';
      el.modalSub.textContent = 'Симуляция приостановлена. Вы можете изучить карту или улучшить авто в Гараже.';
      el.btnPlay.textContent = '▶ ПРОДОЛЖИТЬ';
      el.btnRestartModal.classList.remove('hidden');
      el.btnPauseResume.textContent = '▶ ПРОДОЛЖИТЬ';
    } else if (state === 'dead') {
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
    const rect = stageWrap.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewW = w;
    viewH = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    initDigitalRain();
  }

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resizeCanvas).observe(stageWrap);
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
    el.optRain.checked = prefs.rain;
    el.optSidebarLeft.checked = prefs.sidebarLeft;
    el.optZoom.value = String(prefs.zoom);
    el.optZoomVal.textContent = `${prefs.zoom.toFixed(2)}×`;
  }

  el.optSound.addEventListener('change', () => { prefs.sound = el.optSound.checked; applyPrefs(); savePrefs(); });
  el.optCrt.addEventListener('change', () => { prefs.crt = el.optCrt.checked; applyPrefs(); savePrefs(); });
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
