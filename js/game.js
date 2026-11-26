'use strict';

/*
 * GTA 0 Online — клиент на Phaser 3.
 * Вид сверху (2D), управление: WASD, стрельба — Пробел / ПКМ.
 * WebSocket-синхронизация с сервером (server/server.js).
 */

const GAME_W = 1920, GAME_H = 1280; // мир
const VIEW_W = 1280, VIEW_H = 720; // окно
const CAR_L = 30, CAR_W = 16;
const TILE = 64, ROAD = 14, GRID_W = 30, GRID_H = 20;
const DEPOT_X = GAME_W / 2, DEPOT_Y = GAME_H / 2;

// элемент ника (если есть на странице — можно предзаполнить)
const nickEl = (typeof document !== 'undefined' && document.getElementById('nick')) || { value: '' };

const STYLE = {
  road: '#5a6f50',
  building: ['#162516', '#1d2e1d', '#273a26', '#2f4630', '#233a2c', '#2a3a2f'],
  car: [
    { name: 'Light Auto', fill: '#3fc1cf', accent: '#f7ffa0' },
    { name: 'Medium Auto', fill: '#7fd0a0', accent: '#fff59c' },
    { name: 'Heavy Auto', fill: '#c2786a', accent: '#ffd8a0' }
  ],
  LOOT_COLORS: { ammo: '#ff5a5a', food: '#6fd06f', medkit: '#ffa066', gun: '#ffcf33', speed: '#00e5ff', car: '#b0ff9e' },
  LOOT_NAMES: { ammo: 'патроны', food: 'еда', medkit: 'аптечка', gun: 'оружие', speed: 'скорость', car: 'автомобиль' }
};

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function hex(c) { return parseInt(String(c).slice(1), 16); }
function hashNum(x, y) { let h = (x * 73856093) ^ (y * 19349663); return (h & 0x7fffffff) % STYLE.building.length; }
function onRoad(x, y) {
  const mx = ((x % TILE) + TILE) % TILE;
  if (mx > 0 && mx < TILE && Math.abs(mx - TILE / 2) <= ROAD) return true;
  const my = ((y % TILE) + TILE) % TILE;
  if (my > 0 && my < TILE && Math.abs(my - TILE / 2) <= ROAD) return true;
  return false;
}
function wsUrl() {
  const override = new URLSearchParams(location.search).get('ws');
  if (override) return override;
  const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
  const path = location.pathname.replace(/\/+$/, ''); // сайт может быть в подпапке
  return proto + location.host + path + '/ws';
}
function getNick() {
  return (nickEl.value.trim() || ('Игрок' + Math.floor(Math.random() * 900) + 1)).slice(0, 16);
}
function missionText(m) {
  if (!m) return '';
  if (m.type === 'survive') {
    const s = Math.max(0, Math.floor((Date.now() - (m.startedAt || Date.now())) / 1000));
    return 'выжить ' + m.goal + 'с (' + s + 'с)';
  }
  return 'доставить ' + m.count + '/' + m.goal + ' в Депо';
}
function missionSummary(m) {
  if (!m || m.type !== 'deliver') return '';
  return ' · Миссия ' + m.count + '/' + m.goal;
}

class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'main' }); }

  preload() {}

  create() {
    this.meId = null;
    this.online = false;
    this.players = new Map(); // id -> снимок сервера (или локальный в соло)
    this.loot = new Map();    // id -> снимок
    this.bullets = new Map(); // id -> рект
    this.carRects = new Map();
    this.lootRects = new Map();
    this.mission = null;
    this.ai = []; // два ИИ-водителя (только в соло)
    this.fireOn = false;
    this.aimX = 0; this.aimY = 0;
    this.lastShoot = 0; this.lastDepotSend = 0;

    this.cameras.main.setBounds(0, 0, GAME_W, GAME_H);

    if (SOLO) this.setupLocalWorld();
    this.drawMap();

    this.hudText = this.add.text(12, 6, '', { fontSize: '13px', fill: '#e7f3e2', stroke: '#000', strokeThickness: 3 });
    this.logText = this.add.text(12, 26, '', { fontSize: '11px', fill: '#9abd96', stroke: '#000', strokeThickness: 3 });
    this.deathText = null;

    this.socket = new WebSocket(wsUrl());
    this.socket.onopen = () => this.send({ t: 'hi', nick: getNick() });
    this.socket.onerror = () => this.log('Нет соединения с сервером');
    this.socket.onclose = () => {
      this.online = false;
      if (!this.meId) this.log('Сервер недоступен — игра без мультиплеера');
    };
    this.socket.onmessage = (ev) => { try { this.onMessage(JSON.parse(ev.data)); } catch { /* ignore */ } };

    this.keys = this.input.keyboard.addKeys({ w: 'KeyW', a: 'KeyA', s: 'KeyS', d: 'KeyD', space: 'Space' });
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', () => this.onEnterKey());
    const c = (this.sys && this.sys.canvas) || this.game.canvas || this.canvas;
    c.addEventListener('mousemove', (e) => {
      const r = c.getBoundingClientRect();
      this.aimX = e.clientX - r.left - VIEW_W / 2;
      this.aimY = e.clientY - r.top - VIEW_H / 2;
    });
    c.addEventListener('mousedown', (e) => { if (e.button === 2) this.fireOn = true; });
    c.addEventListener('mouseup', () => { this.fireOn = false; });

    this.time.addEvent({ delay: 40, callback: this.sendMove, scope: this, loop: true });
  }

  send(msg) { if (this.socket && this.socket.readyState === 1) this.socket.send(JSON.stringify(msg)); }
  log(text) { this.logLines = this.logLines || []; this.logLines.push(text); this.logText.setText(this.logLines.slice(-4).join('\n')); }

  sendMove() {
    const k = this.keys;
    this.send({ t: 'move', steer: (k.d.isDown ? 1 : 0) - (k.a.isDown ? 1 : 0), throttle: k.w.isDown ? 1 : 0, brake: k.s.isDown ? 1 : 0 });
  }

  shoot() {
    this.send({ t: 'shoot', ang: Math.atan2(this.aimX, -this.aimY) });
  }

  drawMap() {
    const g = this.add.graphics().setDepth(0);
    // фон
    g.fillStyle(0x0b140b).fillRect(0, 0, GAME_W, GAME_H);
    // дороги
    for (let i = 0; i <= GRID_W; i++) g.fillStyle(hex(STYLE.road)).fillRect(i * TILE - ROAD / 2, 0, ROAD, GAME_H);
    for (let j = 0; j <= GRID_H; j++) g.fillStyle(hex(STYLE.road)).fillRect(0, j * TILE - ROAD / 2, GAME_W, ROAD);
    // здания (псевдо-руины — разные выцветшие цвета)
    for (let tx = 0; tx < GRID_W; tx++) {
      for (let ty = 0; ty < GRID_H; ty++) {
        const cx = (tx + 0.5) * TILE, cy = (ty + 0.5) * TILE;
        if (!onRoad(cx, cy)) {
          g.fillStyle(hex(STYLE.building[hashNum(cx, cy)])).fillRect(cx - TILE / 2, cy - TILE / 2, TILE, TILE);
        }
      }
    }
  }

  onMessage(msg) {
    if (msg.t === 'welcome') {
      this.meId = msg.id;
      this.online = true;
    } else if (msg.t === 'world') {
      for (const p of msg.players) this.players.set(p.id, p);
      for (const it of msg.loot) this.loot.set(it.id, it);
    } else if (msg.t === 'players') {
      this.players.clear();
      for (const p of msg.list) this.players.set(p.id, p);
      const me = this.players.get(this.meId);
      if (me) this.cameras.main.startFollow(me, true);
    } else if (msg.t === 'mission') {
      this.mission = { id: msg.mission.id, type: msg.mission.type || 'deliver', goal: msg.mission.goal, count: 0, startedAt: Date.now() };
      this.log('Миссия: ' + missionText(this.mission));
    } else if (msg.t === 'missionDone') {
      this.mission = null;
      this.log('Миссия выполнена! Апгрейд авто получен.');
    }
  }

  getCar(p) {
    let r = this.carRects.get(p.id);
    if (!r) {
      r = this.add.rectangle(p.x, p.y, CAR_L, CAR_W, hex('#3fc1cf')).setOrigin(0.5);
      r.setStrokeStyle(2, 0x000000).setAlpha(0.6);
      this.carRects.set(p.id, r);
    }
    return r;
  }

  getLootRect(l) {
    let r = this.lootRects.get(l.id);
    if (!r) {
      r = this.add.circle(l.x, l.y, 6, hex(STYLE.LOOT_COLORS[l.type] || '#888')).setOrigin(0.5);
      this.lootRects.set(l.id, r);
    }
    return r;
  }

  update() {
    const me = this.players.get(this.meId);

    if (!this.online) {
      if (me) this.updateLocalPlayer();
      this.updateAI();
      if (me) this.cameras.main.startFollow(me, true);
    }

    // стрельба
    if (this.fireOn && me) {
      const now = this.time.now;
      if (now - this.lastShoot > 140) { this.lastShoot = now; this.shoot(); }
    }
    // подбор лута + депо
    if (me) {
      for (const [id, l] of [...this.loot]) {
        if (dist(l, me) < 60) {
          this.send({ t: 'loot', id });
          this.loot.delete(id);
          me.collected++;
          if (this.mission) this.mission.count++;
          this.log('Подобрал: ' + (STYLE.LOOT_NAMES[l.type] || l.type));
          if (!this.online) this.applyLoot(me, l.type);
        }
      }
      const now = this.time.now;
      if (this.online) {
        if (this.mission && dist(me, { x: DEPOT_X, y: DEPOT_Y }) < 80 && now - this.lastDepotSend > 600) {
          this.lastDepotSend = now;
          this.send({ t: 'enterDepot' });
        }
      } else {
        this.checkDepot(me);
      }
    }

    // синхронизация объектов с сервером
    for (const p of this.players.values()) {
      const r = this.getCar(p);
      r.setPosition(p.x, p.y).setAngle(Phaser.Math.RadToDeg(p.ang));
      const st = STYLE.car[p.carId] || STYLE.car[0];
      r.setFillStyle(hex(st.fill));
    }
    for (const [id, l] of this.loot) this.getLootRect(l).setPosition(l.x, l.y);

    // депо-маркер + депо
    if (this.depotRect) this.depotRect.setPosition(DEPOT_X, DEPOT_Y);
    else this.depotRect = this.add.rectangle(DEPOT_X, DEPOT_Y, 22, 22, 0xff4d4d).setOrigin(0.5);

    // записи смерти
    if (me && me.hp <= 0 && !this.deathText) {
      this.deathText = this.add.text(VIEW_W / 2, VIEW_H / 2, 'ПОГИБЛИ — Enter, чтобы выздесть', {
        fontSize: '22px', fill: '#ff4444', originX: 0.5, originY: 0.5
      });
    } else if (me && me.hp > 0 && this.deathText) {
      this.deathText.destroy(); this.deathText = null;
    }

    // HUD
    const lines = [];
    if (me) {
      lines.push((STYLE.car[me.carId] ? STYLE.car[me.carId].name : '') +
        ' · HP ' + me.hp + '/3   Патроны ' + me.gunMun + '   Собрано ' + me.collected + missionSummary(this.mission));
    }
    lines.push('WASD — единич, Пробел / ПКМ — стрелять, Enter — выздесть');
    lines.push(this.online ? 'Онлайн — ' + this.players.size + ' игрок(ов)' : 'Соло (WASD — единич)');
    this.hudText.setText(lines.join('\n'));
  }

  // ---- соло: локальный игрок, ИИ, миссии, выживание ----

  pickSpawn() {
    for (let t = 0; t < 100; t++) {
      const x = Math.random() * GAME_W, y = Math.random() * GAME_H;
      if (onRoad(x, y) && x > 12 && x < GAME_W - 12 && y > 12 && y < GAME_H - 12) return { x, y };
    }
    return { x: GAME_W / 2, y: GAME_H / 2 };
  }

  setupLocalWorld() {
    const sp = this.pickSpawn();
    const me = { id: 0, nick: 'Вы', x: sp.x, y: sp.y, ang: Math.random() * Math.PI * 2, vx: 0, vy: 0,
      hp: 3, gunLevel: 0, gunMun: 40, collected: 0, speedUp: 0, carId: 0 };
    this.players.set(0, me);
    this.ai = [1, 2].map((i) => {
      const p = this.pickSpawn();
      return { id: -i, x: p.x, y: p.y, ang: Math.random() * Math.PI * 2 };
    });
    const types = ['ammo', 'ammo', 'ammo', 'food', 'food', 'medkit', 'gun', 'speed', 'car'];
    for (let i = 0; i < 10; i++) {
      const p = this.pickSpawn();
      this.loot.set(i + 100, { id: i + 100, x: p.x, y: p.y, type: types[i % types.length] });
    }
  }

  updateLocalPlayer() {
    const me = this.players.get(0);
    if (!me) return;
    const k = this.keys;
    const speed = 4.5 + (STYLE.car[me.carId] ? 2 : 0) + me.speedUp * 1.5;
    me.ang += (k.d.isDown ? 1 : 0) * 0.07 - (k.a.isDown ? 1 : 0) * 0.07;
    me.vx = Math.sin(me.ang) * speed;
    me.vy = -Math.cos(me.ang) * speed;
    me.x += me.vx; me.y += me.vy;
  }

  updateAI() {
    const speed = 3.2 + Math.random() * 1.5;
    for (const ai of this.ai) {
      ai.ang += (Math.random() - 0.5) * 0.2;
      ai.x += Math.sin(ai.ang) * speed * 0.05;
      ai.y -= Math.cos(ai.ang) * speed * 0.05;
      this.getCar(ai).setPosition(ai.x, ai.y).setAngle(Phaser.Math.RadToDeg(ai.ang));
    }
  }

  applyLoot(me, type) {
    if (type === 'ammo') me.gunMun += 20;
    if (type === 'food') me.hp = Math.min(3, me.hp + 1);
    if (type === 'medkit') me.hp = Math.min(3, me.hp + 2);
    if (type === 'gun' && me.gunLevel < 3) me.gunLevel++;
    if (type === 'speed' && me.speedUp < 3) me.speedUp++;
    if (type === 'car' && me.carId < 2) me.carId++;
    if (me.collected >= 2 && !this.mission) {
      this.mission = { id: 1, type: 'deliver', goal: 3, count: 0 };
      this.log('Миссия: доставить 3 предмета в Депо');
    }
  }

  checkDepot(me) {
    const now = Date.now();
    if (!this.mission || this.mission.type !== 'deliver') return;
    if (dist(me, { x: DEPOT_X, y: DEPOT_Y }) > 60) return;
    if (this.mission.count < this.mission.goal) return;
    const done = this.mission;
    this.mission = null;
    const st = STYLE.car[me.carId] || STYLE.car[0];
    me.gunLevel = Math.min(3, me.gunLevel + 1);
    me.speedUp = Math.min(3, me.speedUp + 1);
    me.collected = 0;
    this.log('Миссия выполнена! Апгрейд: ' + st.name);
  }

  onEnterKey() {
    if (this.online) { this.send({ t: 'hi', nick: getNick() }); return; }
    const me = this.players.get(0);
    if (me && me.hp <= 0) {
      const sp = this.pickSpawn();
      Object.assign(me, { hp: 3, collected: 0, gunMun: 40, gunLevel: 0, speedUp: 0, carId: 0, x: sp.x, y: sp.y, ang: 0, vx: 0, vy: 0 });
      if (this.deathText) { this.deathText.destroy(); this.deathText = null; }
      this.log('Выздесть.');
    }
  }
}

const SOLO = true; // соло режим: локальный игрок + мир + ИИ

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: VIEW_W,
  height: VIEW_H,
  backgroundColor: '#0b140b',
  audio: { noAudio: true },
  scene: GameScene
});
