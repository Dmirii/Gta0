'use strict';

window.GTA0 = window.GTA0 || {};

window.GTA0.World = (function () {
  const TILE = 128;
  const COLS = 22;
  const ROWS = 16;
  const WIDTH = COLS * TILE;   // 2816
  const HEIGHT = ROWS * TILE;  // 2048

  // Типы клеток базовой сетки:
  // 0 = дорога, 1 = квартал (здание/тротуар), 2 = площадь Бункера-Депо, 3 = пустошь/кратер/двор
  const T_ROAD = 0;
  const T_BLDG = 1;
  const T_DEPOT = 2;
  const T_WASTE = 3;

  function hash(x, y) {
    let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) ^ 0x5bf03635;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  // Текстурный шум асфальта (генерируется 1 раз как маленький бесшовный паттерн 128x128)
  function makeAsphaltPattern(ctx) {
    const p = document.createElement('canvas');
    p.width = 128;
    p.height = 128;
    const g = p.getContext('2d');
    g.fillStyle = '#15181c';
    g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 2) {
      for (let x = 0; x < 128; x += 2) {
        const v = hash(x * 7 + 3, y * 11 + 5);
        if (v > 0.72) {
          g.fillStyle = 'rgba(255,255,255,0.038)';
          g.fillRect(x, y, 2, 2);
        } else if (v < 0.24) {
          g.fillStyle = 'rgba(0,0,0,0.14)';
          g.fillRect(x, y, 2, 2);
        }
      }
    }
    // Лёгкие трещины и зерно мокрого асфальта
    g.strokeStyle = 'rgba(0,0,0,0.32)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(14, 22); g.lineTo(28, 30); g.lineTo(35, 25);
    g.moveTo(86, 74); g.lineTo(96, 88); g.lineTo(112, 92);
    g.stroke();
    return ctx.createPattern(p, 'repeat');
  }

  function createWorld() {
    // 1. Строим разнообразную нешаблонную планировку города (22 x 16)
    // R = дорога, B = застройка, D = площадь Депо, W = пустырь/руины/двор
    const layout = [
      'RRRRRRRRRRRRRRRRRRRRRR', // 0  Северное кольцо
      'RBBWRBBRBBRBBRBBRBBRBR', // 1
      'RBBWRBBRBBRBBRBBRBBRBR', // 2
      'RRRRRRRRRRRRRRRRRRRRRR', // 3  Северный проспект
      'RBRWBBRBBRWWWRBBRBBRBR', // 4
      'RBRRRRRRRRRRRRRRRRRRBR', // 5  Улица
      'RBRBBRBWRDDDRBBRBBRWBR', // 6  Центральная зона
      'RRRRRRRRRDDDRRRRRRRRRR', // 7  Главный бульвар (З-В)
      'RBRBBRBWRDDDRBBRWBRBBR', // 8  Центральная зона
      'RBRRRRRRRRRRRRRRRRRRBR', // 9  Улица
      'RBRWWRBBRWWWRBBRBBRBBR', // 10
      'RBRWWRBBRBBRBBRBBRBBWR', // 11
      'RRRRRRRRRRRRRRRRRRRRRR', // 12 Южный проспект
      'RBBBRBBRBBRBBRBBRWWBBR', // 13
      'RBBBRBBRWWRBBRBBRWWBBR', // 14
      'RRRRRRRRRRRRRRRRRRRRRR'  // 15 Южное кольцо
    ];

    const grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = new Uint8Array(COLS);
      for (let c = 0; c < COLS; c++) {
        const ch = layout[r][c];
        row[c] = ch === 'R' ? T_ROAD : ch === 'D' ? T_DEPOT : ch === 'W' ? T_WASTE : T_BLDG;
      }
      grid.push(row);
    }

    // Главный Бункер-Депо в центре (cols 9..11, rows 6..8 -> центр 10.5, 7.5)
    const depot = {
      x: 10.5 * TILE,
      y: 7.5 * TILE,
      radius: 112
    };

    // 4 радиационных кратера Fallout на пустырях
    const radZones = [
      { x: 3.5 * TILE,  y: 1.5 * TILE,  radius: 105 },
      { x: 4.0 * TILE,  y: 11.0 * TILE, radius: 118 },
      { x: 18.0 * TILE, y: 14.0 * TILE, radius: 115 },
      { x: 11.0 * TILE, y: 4.5 * TILE,  radius: 96  }
    ];

    // 4 Матричных терминала (узлы взлома)
    const terminals = [
      { id: 1, name: 'УЗЕЛ АЛЬФА', x: 8.5 * TILE,  y: 6.5 * TILE  },
      { id: 2, name: 'УЗЕЛ НЕО',   x: 16.5 * TILE, y: 8.5 * TILE  },
      { id: 3, name: 'УЗЕЛ ЗИОН',  x: 10.5 * TILE, y: 10.5 * TILE },
      { id: 4, name: 'УЗЕЛ ОМЕГА', x: 9.0 * TILE,  y: 14.5 * TILE }
    ];

    // 2. Объединяем смежные 'B'-клетки в крупные составные 2.5D комплексы (2x2, 2x1, 1x2, 1x1)
    const visited = Array.from({ length: ROWS }, () => new Uint8Array(COLS));
    const buildings = [];
    const bldgGrid = new Map(); // cellIdx -> building
    const NEON_SIGNS = [
      'NEXUS', 'ZION//0', 'VAULT', 'NUKA', '0xFF42', 'MATRIX',
      'CYBER', 'HOTEL', 'SYS.ERR', 'RAD-7', 'APEX', 'ARCADE'
    ];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] !== T_BLDG || visited[r][c]) continue;

        // Пробуем собрать прямоугольник 2x2, 3x2, 2x1 или 1x2 для живого силуэта мегаполиса
        let bw = 1, bh = 1;
        while (c + bw < COLS && bw < 3 && grid[r][c + bw] === T_BLDG && !visited[r][c + bw]) {
          bw++;
        }
        // Расширяем вниз только если вся полоса ширины bw свободна
        let canExtendH = (r + 1 < ROWS);
        if (canExtendH) {
          for (let x = c; x < c + bw; x++) {
            if (grid[r + 1][x] !== T_BLDG || visited[r + 1][x]) { canExtendH = false; break; }
          }
          if (canExtendH) bh = 2;
        }

        for (let yy = r; yy < r + bh; yy++) {
          for (let xx = c; xx < c + bw; xx++) visited[yy][xx] = 1;
        }

        const seed = hash(c * 17 + 5, r * 31 + 9);
        const pad = 13; // широкий тротуар для фонарей, обломков и удобной езды
        const distCenter = Math.hypot((c + bw / 2) * TILE - depot.x, (r + bh / 2) * TILE - depot.y);
        const isEastCyber = (c + bw / 2) > COLS * 0.52;
        const isDowntown = distCenter < 760 || (bw * bh >= 2 && isEastCyber);

        let style = 'apt';
        if (bw * bh >= 4 || (isDowntown && seed > 0.42)) style = 'tower';
        else if (!isEastCyber && seed < 0.34) style = 'ruin';
        else if (isEastCyber && seed > 0.55) style = 'cyber';

        const height =
          style === 'tower' ? 0.26 + seed * 0.12 :
          style === 'cyber' ? 0.21 + seed * 0.10 :
          style === 'apt'   ? 0.15 + seed * 0.08 :
                              0.09 + seed * 0.05;

        const neonPalette =
          style === 'cyber' ? ['#39ff88', '#38e8ff'] :
          style === 'tower' ? ['#38e8ff', '#ffb84d', '#39ff88', '#ff5470'] :
                              ['#ffb84d', '#ff6e40', '#39ff88'];
        const neonColor = neonPalette[Math.floor(seed * 19) % neonPalette.length];

        const hasSign = (style === 'tower' || style === 'cyber') && seed > 0.28;
        const b = {
          c, r, bw, bh,
          x: c * TILE + pad,
          y: r * TILE + pad,
          w: bw * TILE - pad * 2,
          h: bh * TILE - pad * 2,
          height,
          style,
          seed,
          neonColor,
          signText: hasSign ? NEON_SIGNS[Math.floor(seed * 97) % NEON_SIGNS.length] : null,
          beacon: style === 'tower' && height > 0.30,
          roofTone: style === 'ruin' ? '#231e19' : style === 'cyber' ? '#121b18' : '#171b20',
          wallBase: style === 'ruin' ? '#2a221c' : style === 'cyber' ? '#131d19' : '#1b2026'
        };
        buildings.push(b);

        for (let yy = r; yy < r + bh; yy++) {
          for (let xx = c; xx < c + bw; xx++) {
            bldgGrid.set(yy * COLS + xx, b);
          }
        }
      }
    }

    // 3. Собираем проходимые тайлы дорог, фонари, костры, светофоры, лужи, сгоревшие авто, разломы Матрицы
    const roadTiles = [];
    const streetlights = [];
    const fires = [];
    const trafficLights = [];
    const puddles = [];
    const wrecks = [];
    const rifts = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = grid[r][c];
        const cx = (c + 0.5) * TILE;
        const cy = (r + 0.5) * TILE;
        const h1 = hash(c * 13 + 1, r * 23 + 7);
        const h2 = hash(c * 29 + 3, r * 19 + 11);

        if (t === T_ROAD || t === T_WASTE) {
          roadTiles.push({ c, r, x: cx, y: cy, type: t });
        }

        if (t === T_ROAD) {
          const roadN = r > 0 && grid[r - 1][c] === T_ROAD;
          const roadS = r < ROWS - 1 && grid[r + 1][c] === T_ROAD;
          const roadW = c > 0 && grid[r][c - 1] === T_ROAD;
          const roadE = c < COLS - 1 && grid[r][c + 1] === T_ROAD;
          const isIntersection = (roadN || roadS) && (roadW || roadE);

          // Фонари на перекрёстках и вдоль проспектов
          if (isIntersection && (c + r) % 2 === 0) {
            const isCyberZone = c > COLS * 0.55;
            streetlights.push({
              x: c * TILE + 12,
              y: r * TILE + 12,
              color: isCyberZone && h1 > 0.45 ? '#38e8ff' : '#ffab42',
              radius: 175,
              flicker: h2 > 0.72,
              phase: h1 * Math.PI * 2
            });
            // Светофор на крупных перекрёстках
            if (r === 3 || r === 7 || r === 12) {
              trafficLights.push({
                x: (c + 1) * TILE - 12,
                y: (r + 1) * TILE - 12,
                phase: (c * 1.7 + r * 0.9) % 8
              });
            }
          } else if (!isIntersection && (c % 3 === 0 || r % 3 === 0) && h1 > 0.58) {
            streetlights.push({
              x: cx + (roadN || roadS ? -52 : 0),
              y: cy + (roadW || roadE ? -52 : 0),
              color: h2 > 0.7 ? '#48e8ff' : '#ffa73b',
              radius: 145,
              flicker: h2 > 0.8,
              phase: h2 * 10
            });
          }

          // Мокрые лужи с отражением неона на дорогах
          if (h1 > 0.68) {
            puddles.push({
              x: cx + (h2 - 0.5) * 46,
              y: cy + (h1 - 0.8) * 60,
              rx: 18 + h2 * 24,
              ry: 11 + h1 * 14,
              rot: h2 * Math.PI,
              tint: c > COLS * 0.52 ? (h2 > 0.5 ? '#39ff88' : '#38e8ff') : '#ffb24a'
            });
          }

          // Разломы кода Матрицы на дорогах восточной/центральной части
          if (c > COLS * 0.4 && h2 > 0.90) {
            rifts.push({
              x: cx + (h1 - 0.5) * 40,
              y: cy + (h2 - 0.5) * 40,
              ang: (h1 - 0.5) * 1.6,
              len: 36 + h2 * 38,
              seed: h1
            });
          }
        }

        // Костры в бочках и ржавые остовы машин на пустырях и у руин
        if (t === T_WASTE) {
          if (h1 > 0.45) {
            fires.push({
              x: cx + (h2 - 0.5) * 58,
              y: cy + (h1 - 0.7) * 54,
              phase: h1 * 12
            });
          }
          if (h2 > 0.52) {
            wrecks.push({
              x: cx + (h1 - 0.5) * 62,
              y: cy + (h2 - 0.5) * 62,
              ang: h1 * Math.PI * 2,
              color: h1 > 0.5 ? '#4a3126' : '#373d39'
            });
          }
        }
      }
    }

    // Несколько горящих бочек на углах площади Бункера-Депо
    fires.push({ x: depot.x - 122, y: depot.y - 118, phase: 0.4 });
    fires.push({ x: depot.x + 122, y: depot.y - 118, phase: 2.1 });
    fires.push({ x: depot.x - 122, y: depot.y + 118, phase: 4.3 });
    fires.push({ x: depot.x + 122, y: depot.y + 118, phase: 5.7 });

    const mapCanvas = bakeGroundCanvas(grid, buildings, depot, radZones, wrecks, streetlights);
    const minimapBg = bakeMinimapBg(grid, buildings, depot, radZones);

    return {
      TILE, COLS, ROWS, WIDTH, HEIGHT,
      T_ROAD, T_BLDG, T_DEPOT, T_WASTE,
      grid, roadTiles, buildings, bldgGrid,
      depot, radZones, terminals,
      streetlights, fires, trafficLights, puddles, wrecks, rifts,
      mapCanvas, minimapBg,

      pickRoadSpawn(minDistFrom, minDist) {
        for (let i = 0; i < 90; i++) {
          const t = roadTiles[Math.floor(Math.random() * roadTiles.length)];
          const x = t.x + (Math.random() - 0.5) * 44;
          const y = t.y + (Math.random() - 0.5) * 44;
          if (minDistFrom && Math.hypot(x - minDistFrom.x, y - minDistFrom.y) < (minDist || 240)) continue;
          return { x, y };
        }
        return { x: depot.x + 140, y: depot.y };
      },

      isPointInBuilding(x, y) {
        if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return true;
        const c = Math.floor(x / TILE);
        const r = Math.floor(y / TILE);
        const b = bldgGrid.get(r * COLS + c);
        if (!b) return false;
        return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
      },

      resolveCircle(ent, radius) {
        let hit = false;
        const m = radius + 8;
        if (ent.x < m) { ent.x = m; ent.vx = Math.abs(ent.vx) * 0.35; hit = true; }
        if (ent.x > WIDTH - m) { ent.x = WIDTH - m; ent.vx = -Math.abs(ent.vx) * 0.35; hit = true; }
        if (ent.y < m) { ent.y = m; ent.vy = Math.abs(ent.vy) * 0.35; hit = true; }
        if (ent.y > HEIGHT - m) { ent.y = HEIGHT - m; ent.vy = -Math.abs(ent.vy) * 0.35; hit = true; }

        const minC = Math.max(0, Math.floor((ent.x - radius) / TILE));
        const maxC = Math.min(COLS - 1, Math.floor((ent.x + radius) / TILE));
        const minR = Math.max(0, Math.floor((ent.y - radius) / TILE));
        const maxR = Math.min(ROWS - 1, Math.floor((ent.y + radius) / TILE));

        const checked = new Set();
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const b = bldgGrid.get(r * COLS + c);
            if (!b || checked.has(b)) continue;
            checked.add(b);

            const closestX = Math.max(b.x, Math.min(ent.x, b.x + b.w));
            const closestY = Math.max(b.y, Math.min(ent.y, b.y + b.h));
            const dx = ent.x - closestX;
            const dy = ent.y - closestY;
            const d2 = dx * dx + dy * dy;
            if (d2 < radius * radius) {
              hit = true;
              const d = Math.sqrt(d2);
              let nx = 0, ny = 0;
              if (d > 0.0001) {
                nx = dx / d;
                ny = dy / d;
                const push = radius - d;
                ent.x += nx * push;
                ent.y += ny * push;
              } else {
                const dl = ent.x - b.x;
                const dr = (b.x + b.w) - ent.x;
                const dt = ent.y - b.y;
                const db = (b.y + b.h) - ent.y;
                const mn = Math.min(dl, dr, dt, db);
                if (mn === dl) { ent.x = b.x - radius; nx = -1; }
                else if (mn === dr) { ent.x = b.x + b.w + radius; nx = 1; }
                else if (mn === dt) { ent.y = b.y - radius; ny = -1; }
                else { ent.y = b.y + b.h + radius; ny = 1; }
              }
              const vn = ent.vx * nx + ent.vy * ny;
              if (vn < 0) {
                ent.vx -= 1.3 * vn * nx;
                ent.vy -= 1.3 * vn * ny;
              }
            }
          }
        }
        return hit;
      },

      getRadIntensity(x, y) {
        let best = 0;
        for (const z of radZones) {
          const d = Math.hypot(x - z.x, y - z.y);
          if (d < z.radius) {
            const val = 1 - d / z.radius;
            if (val > best) best = val;
          }
        }
        return best;
      },

      sectorName(x, y) {
        if (Math.hypot(x - depot.x, y - depot.y) < 220) return 'СЕКТОР 00 · БУНКЕР-ДЕПО';
        if (this.getRadIntensity(x, y) > 0.05) return 'ОПАСНОСТЬ · РАД-КРАТЕР';
        const nx = x / WIDTH;
        const ny = y / HEIGHT;
        if (nx > 0.56 && ny < 0.52) return 'СЕКТОР 02 · НЕОНОВЫЙ ДАУНТАУН';
        if (nx > 0.56 && ny >= 0.52) return 'СЕКТОР 04 · УЗЕЛ МАТРИЦЫ';
        if (nx <= 0.44 && ny < 0.52) return 'СЕКТОР 01 · СТАРАЯ ПРОМЗОНА';
        if (nx <= 0.44 && ny >= 0.52) return 'СЕКТОР 03 · РЖАВЫЕ РУИНЫ';
        return 'СЕКТОР 05 · ГЛАВНЫЙ ПРОСПЕКТ';
      }
    };
  }

  // ==================== ЗАПЕКАНИЕ ЗЕМЛИ, ДОРОГ И ТРОТУАРОВ ====================
  function bakeGroundCanvas(grid, buildings, depot, radZones, wrecks, streetlights) {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');

    // 1. Текстурный мокрый ночной асфальт на всю карту
    const asphaltPat = makeAsphaltPattern(ctx);
    ctx.fillStyle = asphaltPat || '#15181c';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 2. Тайлы дорог, тротуаров, пустырей и площади Депо
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE;
        const y = r * TILE;
        const t = grid[r][c];
        const h1 = hash(c * 7 + 2, r * 13 + 4);

        if (t === T_ROAD) {
          const roadN = r > 0 && (grid[r - 1][c] === T_ROAD || grid[r - 1][c] === T_DEPOT);
          const roadS = r < ROWS - 1 && (grid[r + 1][c] === T_ROAD || grid[r + 1][c] === T_DEPOT);
          const roadW = c > 0 && (grid[r][c - 1] === T_ROAD || grid[r][c - 1] === T_DEPOT);
          const roadE = c < COLS - 1 && (grid[r][c + 1] === T_ROAD || grid[r][c + 1] === T_DEPOT);
          const isH = roadW || roadE;
          const isV = roadN || roadS;

          // Тёмные колеи от шин на проезжей части
          ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
          if (isH && !isV) {
            ctx.fillRect(x, y + 26, TILE, 18);
            ctx.fillRect(x, y + TILE - 44, TILE, 18);
          } else if (isV && !isH) {
            ctx.fillRect(x + 26, y, 18, TILE);
            ctx.fillRect(x + TILE - 44, y, 18, TILE);
          }

          // Разметка: двойная жёлтая на главных бульварах, пунктир на обычных улицах
          const isMainBlvd = (r === 3 || r === 7 || r === 12 || c === 0 || c === COLS - 1);
          if (isH && !isV) {
            if (isMainBlvd) {
              ctx.fillStyle = 'rgba(218, 165, 58, 0.58)';
              ctx.fillRect(x, y + TILE / 2 - 4, TILE, 2.5);
              ctx.fillRect(x, y + TILE / 2 + 2, TILE, 2.5);
            } else {
              ctx.fillStyle = 'rgba(205, 168, 76, 0.45)';
              for (let dx = 10; dx < TILE - 10; dx += 30) {
                ctx.fillRect(x + dx, y + TILE / 2 - 1.5, 16, 3);
              }
            }
            // Белые краевые линии
            ctx.fillStyle = 'rgba(200, 210, 215, 0.14)';
            ctx.fillRect(x, y + 8, TILE, 2);
            ctx.fillRect(x, y + TILE - 10, TILE, 2);
          } else if (isV && !isH) {
            ctx.fillStyle = 'rgba(205, 168, 76, 0.45)';
            for (let dy = 10; dy < TILE - 10; dy += 30) {
              ctx.fillRect(x + TILE / 2 - 1.5, y + dy, 3, 16);
            }
            ctx.fillStyle = 'rgba(200, 210, 215, 0.14)';
            ctx.fillRect(x + 8, y, 2, TILE);
            ctx.fillRect(x + TILE - 10, y, 2, TILE);
          } else if (isH && isV) {
            // Перекрёсток: потёртая зебра и люк канализации
            ctx.fillStyle = 'rgba(215, 215, 200, 0.17)';
            for (let k = 20; k < TILE - 20; k += 16) {
              if (roadN) ctx.fillRect(x + k, y + 5, 8, 13);
              if (roadS) ctx.fillRect(x + k, y + TILE - 18, 8, 13);
              if (roadW) ctx.fillRect(x + 5, y + k, 13, 8);
              if (roadE) ctx.fillRect(x + TILE - 18, y + k, 13, 8);
            }
            // Канализационный люк
            ctx.fillStyle = '#24292e';
            ctx.beginPath();
            ctx.arc(x + TILE / 2 + 12, y + TILE / 2 + 12, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#3b4248';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Пыль пустоши Fallout и масляные пятна на окраинах
          if (c < COLS * 0.45 && h1 > 0.55) {
            const g = ctx.createRadialGradient(x + 64, y + 64, 6, x + 64, y + 64, 54);
            g.addColorStop(0, 'rgba(122, 92, 54, 0.24)');
            g.addColorStop(1, 'rgba(122, 92, 54, 0)');
            ctx.fillStyle = g;
            ctx.fillRect(x, y, TILE, TILE);
          }
          if (h1 < 0.24) {
            ctx.fillStyle = 'rgba(8, 10, 14, 0.45)';
            ctx.beginPath();
            ctx.ellipse(x + 30 + h1 * 220, y + 40 + h1 * 180, 16, 9, h1 * 5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (t === T_WASTE) {
          // Разбитый бетонный пустырь / двор с песком и обломками
          ctx.fillStyle = '#201e1a';
          ctx.fillRect(x, y, TILE, TILE);
          const dg = ctx.createRadialGradient(x + 64, y + 64, 10, x + 64, y + 64, 80);
          dg.addColorStop(0, 'rgba(116, 88, 52, 0.28)');
          dg.addColorStop(1, 'rgba(20, 18, 16, 0.15)');
          ctx.fillStyle = dg;
          ctx.fillRect(x, y, TILE, TILE);

          // Бетонные плиты с трещинами и битым кирпичом
          ctx.strokeStyle = 'rgba(0,0,0,0.45)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
          for (let i = 0; i < 9; i++) {
            const rx = x + 10 + hash(c * 17 + i, r * 11) * (TILE - 22);
            const ry = y + 10 + hash(r * 23 + i, c * 19) * (TILE - 22);
            ctx.fillStyle = i % 2 === 0 ? '#3a342c' : '#2b2824';
            ctx.fillRect(rx, ry, 5 + (i % 4) * 3, 4 + (i % 3) * 2);
          }
        } else if (t === T_DEPOT) {
          // Укреплённая бетонная площадка Бункера-Депо
          ctx.fillStyle = '#212524';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = 'rgba(255, 184, 77, 0.22)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.fillRect(x + 8, y + 8, TILE - 16, TILE - 16);
        } else if (t === T_BLDG) {
          // Бетонный тротуар с бордюрами вокруг зданий
          ctx.fillStyle = '#2d3033';
          ctx.fillRect(x, y, TILE, TILE);
          // Плитка тротуара
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.lineWidth = 1;
          for (let s = 32; s < TILE; s += 32) {
            ctx.beginPath();
            ctx.moveTo(x + s, y); ctx.lineTo(x + s, y + TILE);
            ctx.moveTo(x, y + s); ctx.lineTo(x + TILE, y + s);
            ctx.stroke();
          }
          // Светлая кромка бордюра у дороги
          ctx.fillStyle = '#484d52';
          if (r > 0 && grid[r - 1][c] !== T_BLDG) ctx.fillRect(x, y, TILE, 4);
          if (r < ROWS - 1 && grid[r + 1][c] !== T_BLDG) ctx.fillRect(x, y + TILE - 4, TILE, 4);
          if (c > 0 && grid[r][c - 1] !== T_BLDG) ctx.fillRect(x, y, 4, TILE);
          if (c < COLS - 1 && grid[r][c + 1] !== T_BLDG) ctx.fillRect(x + TILE - 4, y, 4, TILE);
        }
      }
    }

    // 3. Радиационные кратеры (выжженная воронка + бочки с отходами)
    for (const z of radZones) {
      const grad = ctx.createRadialGradient(z.x, z.y, 12, z.x, z.y, z.radius);
      grad.addColorStop(0, 'rgba(130, 235, 30, 0.45)');
      grad.addColorStop(0.45, 'rgba(65, 110, 20, 0.30)');
      grad.addColorStop(0.8, 'rgba(18, 22, 14, 0.45)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
      ctx.fill();

      // Трещины от кратера
      ctx.strokeStyle = 'rgba(8, 12, 6, 0.75)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + 0.2;
        ctx.beginPath();
        ctx.moveTo(z.x + Math.cos(a) * 14, z.y + Math.sin(a) * 14);
        ctx.lineTo(z.x + Math.cos(a + 0.12) * 52, z.y + Math.sin(a + 0.12) * 52);
        ctx.lineTo(z.x + Math.cos(a - 0.08) * 86, z.y + Math.sin(a - 0.08) * 86);
        ctx.stroke();
      }

      // Жёлто-зелёные бочки с радиацией в центре
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1 + 0.5;
        const bx = z.x + Math.cos(a) * 20;
        const by = z.y + Math.sin(a) * 20;
        ctx.fillStyle = '#3c4521';
        ctx.strokeStyle = '#c8ff42';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Выцветший трафарет опасности RAD на краю кратера
      ctx.fillStyle = 'rgba(218, 255, 84, 0.28)';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('☢ RAD ZONE', z.x, z.y + z.radius * 0.62);
    }

    // 3b. Выцветшие дорожные трафареты Fallout на подъездах к Депо
    ctx.save();
    ctx.fillStyle = 'rgba(222, 184, 102, 0.24)';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VAULT-0 ▶', depot.x - 260, depot.y);
    ctx.fillText('◀ VAULT-0', depot.x + 260, depot.y);
    ctx.fillText('▲ DEPOT ▲', depot.x, depot.y + 245);
    ctx.fillText('▼ DEPOT ▼', depot.x, depot.y - 245);
    ctx.restore();

    // 4. Площадь Бункера-Депо (Fallout Vault-Tech)
    ctx.save();
    ctx.translate(depot.x, depot.y);
    // Опасная жёлто-чёрная окантовка по периметру
    ctx.strokeStyle = 'rgba(255, 184, 77, 0.72)';
    ctx.lineWidth = 5;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, depot.radius - 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Тёмный металлический люк Убежища
    ctx.fillStyle = '#191d1e';
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#585e5a';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Шестерня Убежища
    ctx.strokeStyle = '#ffb84d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 4);
      ctx.fillStyle = '#ffb84d';
      ctx.fillRect(34, -5, 11, 10);
      ctx.restore();
    }
    ctx.fillStyle = '#ffb84d';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VAULT-0', 0, -7);
    ctx.fillStyle = '#39ff88';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('ДЕПО', 0, 9);
    ctx.restore();

    // 5. Ржавые сгоревшие остовы машин на пустырях
    for (const w of wrecks) {
      ctx.save();
      ctx.translate(w.x, w.y);
      ctx.rotate(w.ang);
      // Тёмное пятно копоти под остовом
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ржавый кузов
      ctx.fillStyle = w.color;
      ctx.strokeStyle = '#1b1512';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-16, -9, 32, 18);
      ctx.strokeRect(-16, -9, 32, 18);
      // Выбитые стёкла
      ctx.fillStyle = '#121212';
      ctx.fillRect(-6, -6, 14, 12);
      // Пятна ржавчины
      ctx.fillStyle = 'rgba(165, 86, 38, 0.45)';
      ctx.fillRect(-13, -7, 8, 5);
      ctx.fillRect(6, 2, 7, 5);
      ctx.restore();
    }

    // 6. Основания зданий (отбрасываемые на асфальт контактные тени — сам 2.5D объём рисуется в реальном времени!)
    for (const b of buildings) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
      ctx.fillRect(b.x - 5, b.y - 5, b.w + 18, b.h + 18);
      ctx.fillStyle = '#0c0f12';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    // 7. Столбы уличных фонарей
    for (const sl of streetlights) {
      ctx.fillStyle = '#535c63';
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Внешняя стена периметра города
    ctx.strokeStyle = '#39ff88';
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, WIDTH - 8, HEIGHT - 8);
    ctx.globalAlpha = 1;

    return canvas;
  }

  function bakeMinimapBg(grid, buildings, depot, radZones) {
    const c = document.createElement('canvas');
    c.width = 280;
    c.height = 190;
    const ctx = c.getContext('2d');
    const sx = c.width / WIDTH;
    const sy = c.height / HEIGHT;

    ctx.fillStyle = '#060c09';
    ctx.fillRect(0, 0, c.width, c.height);

    for (let r = 0; r < ROWS; r++) {
      for (let col = 0; col < COLS; col++) {
        const t = grid[r][col];
        const x = col * TILE * sx;
        const y = r * TILE * sy;
        const w = TILE * sx;
        const h = TILE * sy;
        if (t === T_ROAD) {
          ctx.fillStyle = '#182b20';
          ctx.fillRect(x, y, w + 0.5, h + 0.5);
        } else if (t === T_DEPOT) {
          ctx.fillStyle = '#333b22';
          ctx.fillRect(x, y, w + 0.5, h + 0.5);
        } else if (t === T_WASTE) {
          ctx.fillStyle = '#232419';
          ctx.fillRect(x, y, w + 0.5, h + 0.5);
        }
      }
    }

    // Многоклеточные здания на радаре
    for (const b of buildings) {
      ctx.fillStyle = b.style === 'tower' ? '#10241c' : b.style === 'cyber' ? '#0e2820' : '#0b1611';
      ctx.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
      ctx.strokeStyle = b.style === 'tower' ? 'rgba(56,232,255,0.28)' : 'rgba(57,255,136,0.16)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
    }

    for (const z of radZones) {
      ctx.fillStyle = 'rgba(200, 255, 70, 0.28)';
      ctx.beginPath();
      ctx.arc(z.x * sx, z.y * sy, z.radius * sx, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffb84d';
    ctx.fillRect(depot.x * sx - 5, depot.y * sy - 5, 10, 10);

    return c;
  }

  return { createWorld };
})();
