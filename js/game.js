'use strict';

/* GTA 0 Online — клиент.
 * Вид сверху (2D). Управление: WASD, стрельба — Пробел / ПКМ.
 * Связь с сервером через WebSocket (см. /ws в server/server.js).
 */

const TILE = 64, ROAD = 14, GRID_W = 30, GRID_H = 20;
const WORLD_W = GRID_W * TILE, WORLD_H = GRID_H * TILE;
const DEPOT = { x: WORLD_W / 2, y: WORLD_H / 2 };
const VIEW_W = 1280, VIEW_H = 720;
const CAR_L = 30, CAR_W = 16;
const CARS = ['Light Auto', 'Medium Auto', 'Heavy Auto'];
const COLORS = {
  road: '#5a6f50',
  building: ['#162516', '#1d2e1d', '#273a26', '#2f4630', '#233a2c', '#2a3a2f'],
  car: [
    { fill: '#3fc1cf', accent: '#f7ffa0' },
    { fill: '#7fd0a0', accent: '#fff59c' },
    { fill: '#c2786a', accent: '#ffd8a0' }
  ],
  loot: { ammo: '#ff5a5a', food: '#6fd06f', medkit: '#ffa066', gun: '#ffcf33', speed: '#00e5ff', car: '#b0ff9e' },
  hud: 'rgba(12,32,12,0.72)'
};
const LOOT_NAMES = { ammo: 'патроны', food: 'еда', medkit: 'аптечка', gun: 'оружие', speed: 'скорость', car: 'автомобиль' };

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const nickInput = document.getElementById('nick');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// ---------- состояние ----------
let meId = null;
const players = new Map();
const loot = new Map();
const bullets = new Map();
let mission = null; // {id, goal, count}
let started = false;
let logLines = [];
let aimX = 0, aimY = 0, fireOn = false;
const held = new Set();
let lastDepotSend = 0;

function log(text) { logLines.push(text); while (logLines.length > 3) logLines.shift(); }
function getNick() {
  const v = nickInput.value.trim() || ('Игрок' + Math.floor(Math.random() * 900) + 1);
  return v.slice(0, 16);
}
function setFire(on) { fireOn = on; document.body.style.cursor = on ? 'none' : ''; }

// ---------- сеть ----------
function wsUrl() {
  // ?ws=wss://host/ws — абсолютный адрес сервера (полезно на GitHub Pages,
  // где статику нельзя хостить сам WS-сервер)
  const override = new URLSearchParams(location.search).get('ws');
  if (override) return override;
  const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
  return proto + location.host + '/ws';
}
const socket = new WebSocket(wsUrl());

socket.onopen = () => { menu.style.display = 'flex'; nickInput.focus(); };
socket.onerror = () => { log('Нет соединения с сервером'); };
socket.onclose = () => { if (!started) log('Сервер недоступен'); };

socket.onmessage = (ev) => {
  let msg;
  try { msg = JSON.parse(ev.data); } catch { return; }
  if (msg.t === 'welcome') {
    meId = msg.id;
  } else if (msg.t === 'world') {
    for (const p of msg.players) players.set(p.id, p);
    for (const it of msg.loot) loot.set(it.id, it);
  } else if (msg.t === 'players') {
    players.clear();
    for (const p of msg.list) players.set(p.id, p);
  } else if (msg.t === 'bullets') {
    for (const b of msg.bs) {
      bullets.set(b.id, b);
      setTimeout(() => bullets.delete(b.id), 1600);
    }
  } else if (msg.t === 'mission') {
    mission = { id: msg.mission.id, type: msg.mission.type || 'deliver', goal: msg.mission.goal, count: 0, startedAt: Date.now() };
    log('Миссия: ' + missionText(mission));
  } else if (msg.t === 'missionDone') {
    mission = null;
    log('Миссия выполнена! Апгрейд авто получен.');
  }
};

function missionText(m) {
  if (!m) return '';
  if (m.type === 'survive') {
    const s = Math.max(0, Math.floor((Date.now() - (m.startedAt || Date.now())) / 1000));
    return 'выжить ' + m.goal + 'с (' + s + 'с)';
  }
  return 'доставить ' + m.count + '/' + m.goal + ' в Депо';
}

function missionSummary() {
  if (!mission) return '';
  return mission.type === 'survive' ? '' : (' · Миссия ' + mission.count + '/' + mission.goal);
}

// ---------- ввод ----------
nickInput.addEventListener('keydown', (e) => {
  if (e.code !== 'Enter') return;
  const nick = getNick();
  menu.style.display = 'none';
  started = true;
  socket.send(JSON.stringify({ t: 'hi', nick }));
});

window.addEventListener('keydown', (e) => {
  if (e.code && !held.has(e.code)) held.add(e.code);
  if (e.code === 'Space' && started) setFire(true);
  if (e.code === 'Enter' && !started && menu.style.display === 'flex') menu.style.display = 'none';
});
window.addEventListener('keyup', (e) => {
  if (e.code) held.delete(e.code);
  if (e.code === 'Space') setFire(false);
});
canvas.addEventListener('mousedown', (e) => { if (e.button === 2 && started) setFire(true); });
canvas.addEventListener('mouseup', () => setFire(false));
canvas.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect();
  aimX = e.clientX - r.left - VIEW_W / 2;
  aimY = e.clientY - r.top - VIEW_H / 2;
});

function aimAng() { return Math.atan2(aimX, -aimY); }

// отправка управления машиной
setInterval(() => {
  if (!started) return;
  const steer = (held.has('KeyD') ? 1 : 0) - (held.has('KeyA') ? 1 : 0);
  socket.send(JSON.stringify({
    t: 'move',
    steer,
    throttle: held.has('KeyW') ? 1 : 0,
    brake: held.has('KeyS') ? 1 : 0
  }));
}, 40);

// стрельба (Пробел / ПКМ)
setInterval(() => {
  if (!started || !fireOn) return;
  socket.send(JSON.stringify({ t: 'shoot', ang: aimAng() }));
}, 140);

// подбор лута + депо-маркер
setInterval(() => {
  if (!started) return;
  const m = players.get(meId);
  if (!m) return;
  for (const [id, l] of [...loot]) {
    if (dist(l, m) < 60) {
      socket.send(JSON.stringify({ t: 'loot', id }));
      loot.delete(id);
      m.collected++;
      if (mission) mission.count++;
      log('Подобрал: ' + (LOOT_NAMES[l.type] || l.type));
    }
  }
  const now = Date.now();
  if (mission && dist(m, DEPOT) < 80 && now - lastDepotSend > 600) {
    lastDepotSend = now;
    socket.send(JSON.stringify({ t: 'enterDepot' }));
  }
}, 100);

function doRespawn() {
  if (!started) return;
  socket.send(JSON.stringify({ t: 'hi', nick: getNick() }));
  log('Выздесть...');
}

// ---------- рендер ----------
function onRoad(x, y) {
  const mx = ((x % TILE) + TILE) % TILE;
  if (mx > 0 && mx < TILE && Math.abs(mx - TILE / 2) <= ROAD) return true;
  const my = ((y % TILE) + TILE) % TILE;
  if (my > 0 && my < TILE && Math.abs(my - TILE / 2) <= ROAD) return true;
  return false;
}

function drawRoads(cx, cy) {
  // Фон уже закрашен в loop(); порядок: фон -> дороги -> здания
  for (let i = 0; i <= GRID_W; i++) {
    ctx.fillStyle = COLORS.road;
    ctx.fillRect(i * TILE - ROAD / 2 - cx, -cy, ROAD, WORLD_H);
  }
  for (let j = 0; j <= GRID_H; j++) {
    ctx.fillRect(-cx, j * TILE - ROAD / 2 - cy, WORLD_W, ROAD);
  }
}

function hashNum(x, y) {
  let h = (x * 73856093) ^ (y * 19349663);
  return (h & 0x7fffffff) % COLORS.building.length;
}

function drawBuildings(cx, cy) {
  for (let tx = 0; tx < GRID_W; tx++) {
    for (let ty = 0; ty < GRID_H; ty++) {
      const x = (tx + 0.5) * TILE - cx, y = (ty + 0.5) * TILE - cy;
      if (!onRoad(x + cx, y + cy)) {
        ctx.fillStyle = COLORS.building[hashNum(x + cx, y + cy)];
        ctx.fillRect(x, y, TILE, TILE);
      }
    }
  }
}

function carStyle(p) {
  return (COLORS.car[p.carId] || COLORS.car[0]);
}

function drawCars(cx, cy) {
  for (const p of players.values()) {
    const isMe = p.id === meId;
    const st = carStyle(p);
    ctx.save();
    ctx.translate(p.x - cx, p.y - cy);
    ctx.rotate(p.ang);
    ctx.fillStyle = st.fill;
    ctx.fillRect(-CAR_L / 2, -CAR_W / 2, CAR_L, CAR_W);
    ctx.fillStyle = st.accent;
    ctx.fillRect(-CAR_L * 0.4, -1.5, CAR_L * 0.35, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(-CAR_L * 0.48, CAR_W / 2 - 3, CAR_L * 0.3, 3);
    ctx.fillStyle = st.accent;
    ctx.fillRect(-CAR_L / 2, -CAR_W / 2 - 5, CAR_L, 2);
    ctx.restore();
    const x = p.x - cx, y = p.y - cy;
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(x - CAR_L / 2 + 2, y - CAR_W / 2 - 9, 30, 4);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(x - CAR_L / 2 + 2, y - CAR_W / 2 - 9, (p.hp / 3) * 30, 4);
    for (let i = 0; i < Math.min(3, p.gunLevel || 0); i++) {
      ctx.fillStyle = '#ffcf33';
      ctx.fillRect(x - 10 + i * 6, y - CAR_W / 2 - 18, 4, 4);
    }
    if (isMe) {
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(x + CAR_L / 2 - 8, y - 2, 7, 7);
    }
  }
}

function drawLoot(cx, cy) {
  for (const l of loot.values()) {
    ctx.fillStyle = COLORS.loot[l.type] || '#888';
    ctx.beginPath();
    ctx.arc(l.x - cx, l.y - cy, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBullets(cx, cy) {
  ctx.fillStyle = '#fff9b0';
  for (const b of bullets.values()) {
    ctx.beginPath();
    ctx.arc(b.x - cx, b.y - cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCenteredText(text) {
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillStyle = '#ff4444';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, VIEW_W / 2, VIEW_H / 2);
  ctx.textAlign = 'left';
}

function drawHud() {
  const m = players.get(meId);
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(10, 10, 560, 80);
  ctx.fillStyle = '#e7f3e2';
  const lines = [];
  if (m) {
    lines.push((CARS[m.carId] || '') + ' · HP ' + m.hp + '/3   Патроны ' + m.gunMun +
      '   Собрано ' + m.collected + missionSummary());
  }
  lines.push('WASD — единич, Пробел / ПКМ — стрелять, Enter — выздесть');
  let y = 30;
  for (const line of lines) { ctx.fillText(line, 18, y); y += 20; }
  for (let i = 0; i < logLines.length; i++) ctx.fillText(logLines[i], 18, 50 + i * 20);
  if (m && m.hp <= 0) drawCenteredText('ПОГИБЛИ — Enter, чтобы выздесть');
}

function loop() {
  const m = players.get(meId);
  const cx = m ? m.x - VIEW_W / 2 : 0, cy = m ? m.y - VIEW_H / 2 : 0;
  ctx.fillStyle = '#0b140b';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawRoads(cx, cy);
  drawBuildings(cx, cy);
  drawLoot(cx, cy);
  drawBullets(cx, cy);
  drawCars(cx, cy);
  drawHud();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
