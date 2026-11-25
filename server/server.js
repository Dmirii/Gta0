'use strict';

/*
 * GTA 0 Online — сервер.
 * - HTTP: статические файлы из public/ (клиент).
 * - WS: синхронизация игроков (машины), лута, патронов и миссий.
 *
 * Запуск: npm start (или npm run dev для перезагрузки при правках).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// ---------------- мир ----------------
const TILE = 64;
const ROAD = 14;
const GRID_W = 30;
const GRID_H = 20;
const WORLD_W = GRID_W * TILE; // 1920
const WORLD_H = GRID_H * TILE; // 1280
const DEPOT = { x: WORLD_W / 2, y: WORLD_H / 2 };

const CAR = { maxSpeed: 150, maxAccel: 80, turn: 3.6, friction: 0.45, gunRate: 140 };
const WORLD_STATE = { depot: DEPOT, worldW: WORLD_W, worldH: WORLD_H };

function onRoad(x, y) {
  const mx = ((x % TILE) + TILE) % TILE;
  if (mx > 0 && mx < TILE && Math.abs(mx - TILE / 2) <= ROAD) return true;
  const my = ((y % TILE) + TILE) % TILE;
  if (my > 0 && my < TILE && Math.abs(my - TILE / 2) <= ROAD) return true;
  return false;
}

function randStreetPoint() {
  for (let tries = 0; tries < 100; tries++) {
    const x = Math.random() * WORLD_W, y = Math.random() * WORLD_H;
    if (onRoad(x, y) && x > 12 && x < WORLD_W - 12 && y > 12 && y < WORLD_H - 12) {
      return { x, y };
    }
  }
  return { x: WORLD_W / 2, y: WORLD_H / 2 };
}

const SPAWN_POINTS = [];
for (let i = 0; i < 40; i++) SPAWN_POINTS.push(randStreetPoint());

// ---------------- мир: игроки, лут, боеприпасы, миссии ----------------
let nextId = 1;
const players = new Map(); // id -> player
let loot = []; // {id, x, y, type}
let bullets = new Map(); // id -> bullet
let missions = { active: null }; // {id, goal, count}

function newLoot(type) {
  const p = randStreetPoint();
  return { id: nextId++, x: p.x, y: p.y, type };
}

function spawnInitialLoot() {
  for (let i = 0; i < 9; i++) loot.push(newLoot(i < 6 ? 'ammo' : 'food'));
  for (let i = 0; i < 2; i++) loot.push(newLoot('upgrade'));
}

function makePlayer(id) {
  const sp = SPAWN_POINTS[players.size % SPAWN_POINTS.length];
  return {
    id, nick: 'Игрок ' + id, x: sp.x, y: sp.y, ang: Math.random() * 6.28,
    vx: 0, vy: 0, inputs: { steer: 0, throttle: 0, brake: 0 },
    hp: 3, gunLevel: 0, gunMun: 30, collected: 0, speedUp: 0, lastShoot: 0
  };
}

function playerSnapshot(p) {
  const m = missions.active;
  return {
    id: p.id, nick: p.nick, x: p.x, y: p.y, ang: p.ang, hp: p.hp,
    gunLevel: p.gunLevel, gunMun: p.gunMun, collected: p.collected, speedUp: p.speedUp,
    missionId: m ? m.id : null, missionCount: m ? m.count : 0
  };
}

// ---------------- механики ----------------
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function updatePlayerPhysics(p, dt) {
  p.ang += p.inputs.steer * CAR.turn * dt;
  const th = p.inputs.throttle - p.inputs.brake;
  p.vx += Math.sin(p.ang) * th * CAR.maxAccel * dt;
  p.vy += -Math.cos(p.ang) * th * CAR.maxAccel * dt;
  const sp = Math.hypot(p.vx, p.vy);
  const max = CAR.maxSpeed * (1 + 0.35 * p.speedUp);
  if (sp > max) { p.vx = (p.vx / sp) * max; p.vy = (p.vy / sp) * max; }
  p.vx *= 1 - CAR.friction * dt;
  p.vy *= 1 - CAR.friction * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
}

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function doShoot(p, ang) {
  const now = Date.now();
  if (p.gunMun <= 0 || now - p.lastShoot < CAR.gunRate) return;
  p.gunMun = Math.max(0, p.gunMun - 2);
  p.lastShoot = now;
  bullets.set(nextId++, { id: nextId - 1, owner: p.id, x: p.x, y: p.y, ang: ((ang % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) });
}

function onLoot(p, id) {
  const item = loot.find((l) => l.id === id);
  if (!item) return;
  if (dist(item, p) > 70) return; // слишком далеко
  loot.splice(loot.indexOf(item), 1);
  p.collected++;
  if (missions.active) missions.active.count++;
  if (item.type === 'ammo') p.gunMun += 20;
  if (item.type === 'upgrade' && p.speedUp < 3) p.speedUp++;
  maybeStartMission(p);
}

function maybeStartMission(p) {
  if (missions.active || p.collected < 2) return;
  missions.active = { id: nextId++, goal: 3, count: 0 };
  broadcast({ t: 'mission', mission: { id: missions.active.id, goal: 3 } });
}

function checkDepot(p) {
  if (!missions.active || dist(p, DEPOT) > 60) return;
  if (missions.active.count < missions.active.goal) return;
  const done = missions.active;
  missions.active = null;
  p.gunLevel = Math.min(3, p.gunLevel + 1);
  p.speedUp = Math.min(3, p.speedUp + 1);
  p.collected = 0;
  broadcast({ t: 'missionDone', missionId: done.id, reward: { gunLevel: p.gunLevel, speedUp: p.speedUp } });
}

// ---------------- серверный цикл ----------------
let lastT = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;

  for (const p of players.values()) updatePlayerPhysics(p, dt);
  for (const [id, b] of bullets) {
    b.x += Math.sin(b.ang) * 500 * dt;
    b.y -= Math.cos(b.ang) * 500 * dt;
    for (const q of players.values()) {
      if (q.id === b.owner) continue;
      if (Math.hypot(b.x - q.x, b.y - q.y) < 24) {
        const owner = players.get(b.owner);
        q.hp = Math.max(0, q.hp - (owner ? owner.gunLevel + 2 : 2));
        bullets.delete(id);
        break;
      }
    }
    if (b.x < -100 || b.x > WORLD_W + 100 || b.y < -100 || b.y > WORLD_H + 100) bullets.delete(id);
  }
  for (const p of players.values()) checkDepot(p);
  broadcast({ t: 'players', list: [...players.values()].map(playerSnapshot) });
  if (bullets.size) broadcast({ t: 'bullets', bs: [...bullets.values()].map((b) => ({ id: b.id, owner: b.owner, x: b.x, y: b.y, ang: b.ang })) });
}, 40);

function broadcast(msg) {
  const raw = JSON.stringify(msg);
  for (const ws of wss.clients) ws.send(raw);
}

// ---------------- HTTP (клиент) ----------------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.map': 'application/json' };
const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  fs.readFile(path.join(PUBLIC_DIR, urlPath), (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + urlPath);
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(urlPath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

// ---------------- WebSocket ----------------
const wss = new WebSocketServer({ server });
wss.on('connection', (ws, req) => {
  const id = nextId++;
  const p = makePlayer(id);
  players.set(id, p);
  spawnInitialLoot();
  ws.send(JSON.stringify({ t: 'welcome', id }));
  ws.send(JSON.stringify({ t: 'world', ...WORLD_STATE, players: [...players.values()].map(playerSnapshot), loot: [...loot], missions: missions.active }));
  broadcast({ t: 'players', list: [...players.values()].map(playerSnapshot) });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (msg.t === 'hi') {
      players.delete(p.id);
      const fresh = makePlayer(p.id);
      if (typeof msg.nick === 'string' && msg.nick.trim()) fresh.nick = msg.nick.trim().slice(0, 16);
      players.set(fresh.id, fresh);
      ws.send(JSON.stringify({ t: 'welcome', id: fresh.id }));
      ws.send(JSON.stringify({ t: 'world', ...WORLD_STATE, players: [...players.values()].map(playerSnapshot), loot: [...loot], missions: missions.active }));
      broadcast({ t: 'players', list: [...players.values()].map(playerSnapshot) });
    } else if (msg.t === 'move') {
      p.inputs.steer = clamp(msg.steer || 0, -1, 1);
      p.inputs.throttle = clamp(msg.throttle || 0, 0, 1);
      p.inputs.brake = clamp(msg.brake || 0, 0, 1);
    } else if (msg.t === 'shoot') {
      doShoot(p, msg.ang);
    } else if (msg.t === 'loot') {
      onLoot(p, msg.id);
    } else if (msg.t === 'enterDepot') {
      checkDepot(p);
    }
  });
  ws.on('close', () => { players.delete(p.id); broadcast({ t: 'players', list: [...players.values()].map(playerSnapshot) }); });
});

server.listen(PORT, () => {
  console.log('GTA 0 server: http://localhost:' + PORT + '  (WS /ws)');
});
