'use strict';

window.GTA0 = window.GTA0 || {};

window.GTA0.World = (function () {
  const TILE = 128;
  const COLS = 21;
  const ROWS = 15;
  const WIDTH = COLS * TILE;   // 2688
  const HEIGHT = ROWS * TILE;  // 1920
  const PAD = 12;              // тротуар вокруг здания внутри квартала

  // Типы тайлов: 0 = дорога, 1 = здание, 2 = площадь Депо, 3 = пустошь/кратер
  const T_ROAD = 0;
  const T_BLDG = 1;
  const T_DEPOT = 2;
  const T_WASTE = 3;

  function hash(x, y) {
    let n = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function createWorld() {
    const grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = new Uint8Array(COLS);
      for (let c = 0; c < COLS; c++) {
        // Чётные строки и столбцы — проспекты, нечётные пересечения — кварталы
        if (r % 2 === 0 || c % 2 === 0) row[c] = T_ROAD;
        else row[c] = T_BLDG;
      }
      grid.push(row);
    }

    // Центральная площадь Бункера-Депо
    const depotCol = 10;
    const depotRow = 7;
    for (let r = depotRow - 1; r <= depotRow + 1; r++) {
      for (let c = depotCol - 1; c <= depotCol + 1; c++) {
        if (grid[r] && grid[r][c] !== undefined) grid[r][c] = T_DEPOT;
      }
    }

    // 4 радиационных пустыря-кратера (проезжаемые опасные зоны с богатым лутом)
    const radCells = [
      { c: 3, r: 3 },
      { c: 17, r: 3 },
      { c: 3, r: 11 },
      { c: 17, r: 11 }
    ];
    const radZones = [];
    for (const rc of radCells) {
      grid[rc.r][rc.c] = T_WASTE;
      radZones.push({
        x: (rc.c + 0.5) * TILE,
        y: (rc.r + 0.5) * TILE,
        radius: 108
      });
    }

    // Несколько разрушенных сквозных проездов для разнообразия сетки города
    const openLots = [
      [7, 3], [13, 3], [7, 11], [13, 11], [5, 7], [15, 7]
    ];
    for (const [c, r] of openLots) {
      if (grid[r] && grid[r][c] === T_BLDG) grid[r][c] = T_WASTE;
    }

    // Точки Матричных Терминалов (для миссий взлома)
    const terminals = [
      { id: 1, name: 'УЗЕЛ АЛЬФА', x: 5.5 * TILE, y: 7.5 * TILE },
      { id: 2, name: 'УЗЕЛ ОМЕГА', x: 15.5 * TILE, y: 7.5 * TILE },
      { id: 3, name: 'УЗЕЛ ЗЕРО', x: 7.5 * TILE, y: 3.5 * TILE },
      { id: 4, name: 'УЗЕЛ НЕО', x: 13.5 * TILE, y: 11.5 * TILE }
    ];

    const depot = {
      x: (depotCol + 0.5) * TILE,
      y: (depotRow + 0.5) * TILE,
      radius: 105
    };

    const roadTiles = [];
    const buildings = [];
    const bldgMap = new Map();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = grid[r][c];
        if (t === T_ROAD || t === T_WASTE) {
          roadTiles.push({ c, r, x: (c + 0.5) * TILE, y: (r + 0.5) * TILE, type: t });
        } else if (t === T_BLDG) {
          const b = {
            c, r,
            x: c * TILE + PAD,
            y: r * TILE + PAD,
            w: TILE - PAD * 2,
            h: TILE - PAD * 2,
            seed: hash(c + 11, r + 29)
          };
          buildings.push(b);
          bldgMap.set(r * COLS + c, b);
        }
      }
    }

    const mapCanvas = bakeMapCanvas(grid, buildings, depot, radZones);
    const minimapBg = bakeMinimapBg(grid, depot, radZones);

    return {
      TILE, COLS, ROWS, WIDTH, HEIGHT,
      T_ROAD, T_BLDG, T_DEPOT, T_WASTE,
      grid, roadTiles, buildings, bldgMap,
      depot, radZones, terminals,
      mapCanvas, minimapBg,

      pickRoadSpawn(minDistFrom, minDist) {
        for (let i = 0; i < 80; i++) {
          const t = roadTiles[Math.floor(Math.random() * roadTiles.length)];
          const x = t.x + (Math.random() - 0.5) * 44;
          const y = t.y + (Math.random() - 0.5) * 44;
          if (minDistFrom && Math.hypot(x - minDistFrom.x, y - minDistFrom.y) < (minDist || 220)) continue;
          return { x, y };
        }
        return { x: depot.x + 150, y: depot.y };
      },

      isPointInBuilding(x, y) {
        if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return true;
        const c = Math.floor(x / TILE);
        const r = Math.floor(y / TILE);
        const b = bldgMap.get(r * COLS + c);
        if (!b) return false;
        return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
      },

      resolveCircle(ent, radius) {
        let hit = false;
        // Внешние границы города
        const m = radius + 6;
        if (ent.x < m) { ent.x = m; ent.vx = Math.abs(ent.vx) * 0.35; hit = true; }
        if (ent.x > WIDTH - m) { ent.x = WIDTH - m; ent.vx = -Math.abs(ent.vx) * 0.35; hit = true; }
        if (ent.y < m) { ent.y = m; ent.vy = Math.abs(ent.vy) * 0.35; hit = true; }
        if (ent.y > HEIGHT - m) { ent.y = HEIGHT - m; ent.vy = -Math.abs(ent.vy) * 0.35; hit = true; }

        const minC = Math.max(0, Math.floor((ent.x - radius) / TILE));
        const maxC = Math.min(COLS - 1, Math.floor((ent.x + radius) / TILE));
        const minR = Math.max(0, Math.floor((ent.y - radius) / TILE));
        const maxR = Math.min(ROWS - 1, Math.floor((ent.y + radius) / TILE));

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const b = bldgMap.get(r * COLS + c);
            if (!b) continue;
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
                // центр внутри прямоугольника — вытолкнуть к ближайшей грани
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
              // Гасим нормальную составляющую скорости (скольжение вдоль стены)
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
        if (Math.hypot(x - depot.x, y - depot.y) < 210) return 'СЕКТОР 00 · БУНКЕР-ДЕПО';
        if (this.getRadIntensity(x, y) > 0.05) return 'ОПАСНОСТЬ · РАД-КРАТЕР';
        const nx = x / WIDTH;
        const ny = y / HEIGHT;
        if (nx < 0.35 && ny < 0.5) return 'СЕКТОР 01 · СТАРАЯ ПРОМЗОНА';
        if (nx >= 0.65 && ny < 0.5) return 'СЕКТОР 02 · УЗЕЛ МАТРИЦЫ';
        if (nx < 0.35 && ny >= 0.5) return 'СЕКТОР 03 · РЖАВЫЙ КВАРТАЛ';
        if (nx >= 0.65 && ny >= 0.5) return 'СЕКТОР 04 · НЕОНОВЫЕ РУИНЫ';
        return 'СЕКТОР 05 · ЦЕНТРАЛЬНЫЙ ПРОСПЕКТ';
      }
    };
  }

  function bakeMapCanvas(grid, buildings, depot, radZones) {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');

    // Базовый слой: постапокалиптический асфальт
    ctx.fillStyle = '#18211b';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Плиточная текстура и разметка дорог
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE;
        const y = r * TILE;
        const t = grid[r][c];

        if (t === T_ROAD) {
          // Текстура потертого асфальта
          ctx.fillStyle = (r + c) % 2 === 0 ? '#1b251f' : '#18211c';
          ctx.fillRect(x, y, TILE, TILE);

          const isHoriz = (r % 2 === 0);
          const isVert = (c % 2 === 0);

          // Разделительная выцветшая жёлтая полоса (стиль GTA / Fallout highway)
          ctx.fillStyle = 'rgba(155, 138, 66, 0.36)';
          if (isHoriz && !isVert) {
            for (let dx = 10; dx < TILE - 10; dx += 28) {
              ctx.fillRect(x + dx, y + TILE / 2 - 2, 16, 4);
            }
            // Бордюрные кромки дороги
            ctx.fillStyle = 'rgba(57, 255, 136, 0.06)';
            ctx.fillRect(x, y + 3, TILE, 2);
            ctx.fillRect(x, y + TILE - 5, TILE, 2);
          } else if (isVert && !isHoriz) {
            for (let dy = 10; dy < TILE - 10; dy += 28) {
              ctx.fillRect(x + TILE / 2 - 2, y + dy, 4, 16);
            }
            ctx.fillStyle = 'rgba(57, 255, 136, 0.06)';
            ctx.fillRect(x + 3, y, 2, TILE);
            ctx.fillRect(x + TILE - 5, y, 2, TILE);
          } else {
            // Перекрёсток — лёгкая «зебра» и стыки плит
            ctx.strokeStyle = 'rgba(120, 145, 125, 0.14)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 6, y + 6, TILE - 12, TILE - 12);
            ctx.fillStyle = 'rgba(180, 185, 150, 0.14)';
            for (let k = 22; k < TILE - 22; k += 18) {
              ctx.fillRect(x + k, y + 5, 8, 12);
              ctx.fillRect(x + k, y + TILE - 17, 8, 12);
              ctx.fillRect(x + 5, y + k, 12, 8);
              ctx.fillRect(x + TILE - 17, y + k, 12, 8);
            }
          }

          // Мелкие трещины/мусор на асфальте
          if (hash(c * 3, r * 5) > 0.55) {
            ctx.strokeStyle = 'rgba(6, 10, 8, 0.55)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const sx = x + 20 + hash(c, r) * 80;
            const sy = y + 20 + hash(r, c) * 80;
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + 16, sy + 9);
            ctx.lineTo(sx + 25, sy + 2);
            ctx.stroke();
          }
        } else if (t === T_WASTE) {
          // Пустырь / развалины (проезжаемая земля)
          ctx.fillStyle = '#1e241b';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = 'rgba(90, 110, 82, 0.22)';
          ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
          for (let i = 0; i < 6; i++) {
            const rx = x + 14 + hash(c * 13 + i, r * 7) * (TILE - 28);
            const ry = y + 14 + hash(r * 17 + i, c * 11) * (TILE - 28);
            ctx.fillStyle = 'rgba(55, 68, 52, 0.55)';
            ctx.fillRect(rx, ry, 6 + (i % 4) * 3, 5 + (i % 3) * 2);
          }
        } else if (t === T_DEPOT) {
          // Площадь Бункера-Депо
          ctx.fillStyle = '#1b2620';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = 'rgba(255, 184, 77, 0.18)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
        } else if (t === T_BLDG) {
          // Тротуар вокруг здания
          ctx.fillStyle = '#253129';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = '#34463a';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
        }
      }
    }

    // Радиационные кратеры (под зданиями, но поверх пустырей)
    for (const z of radZones) {
      const grad = ctx.createRadialGradient(z.x, z.y, 10, z.x, z.y, z.radius);
      grad.addColorStop(0, 'rgba(182, 255, 58, 0.35)');
      grad.addColorStop(0.55, 'rgba(110, 170, 35, 0.18)');
      grad.addColorStop(1, 'rgba(30, 50, 15, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
      ctx.fill();

      // Концентрическое предупредительное кольцо
      ctx.strokeStyle = 'rgba(208, 255, 77, 0.42)';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Значок радиации в центре кратера
      ctx.fillStyle = 'rgba(220, 255, 90, 0.55)';
      ctx.beginPath();
      ctx.arc(z.x, z.y, 7, 0, Math.PI * 2);
      ctx.fill();
      for (let a = 0; a < 3; a++) {
        const ang = a * (Math.PI * 2 / 3) - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(z.x, z.y);
        ctx.arc(z.x, z.y, 24, ang - 0.4, ang + 0.4);
        ctx.closePath();
        ctx.fillStyle = 'rgba(210, 255, 70, 0.25)';
        ctx.fill();
      }
    }

    // Бункер-Депо в центре (в стиле Fallout Vault + GTA Garage)
    ctx.save();
    ctx.translate(depot.x, depot.y);
    // Жёлто-чёрная разметка посадочной/ремонтной площадки
    ctx.strokeStyle = 'rgba(255, 184, 77, 0.65)';
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, depot.radius - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const dGrad = ctx.createRadialGradient(0, 0, 12, 0, 0, depot.radius);
    dGrad.addColorStop(0, 'rgba(255, 184, 77, 0.22)');
    dGrad.addColorStop(0.7, 'rgba(57, 255, 136, 0.08)');
    dGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = dGrad;
    ctx.beginPath();
    ctx.arc(0, 0, depot.radius, 0, Math.PI * 2);
    ctx.fill();

    // Шестерня Убежища (Fallout Vault Gear)
    ctx.strokeStyle = 'rgba(255, 184, 77, 0.58)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = 'rgba(255, 184, 77, 0.55)';
      ctx.fillRect(32, -5, 11, 10);
      ctx.restore();
    }
    ctx.fillStyle = '#ffb84d';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VAULT', 0, -6);
    ctx.fillStyle = '#39ff88';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('ДЕПО', 0, 10);
    ctx.restore();

    // Здания-руины с 3D-тенями и деталями крыш
    const roofPalette = ['#131f17', '#18251c', '#1c2920', '#16231d', '#202920', '#1a241f'];
    for (const b of buildings) {
      const s = b.seed;
      // Падающая тень
      ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
      ctx.fillRect(b.x + 8, b.y + 8, b.w, b.h);

      // Основной корпус
      const roofCol = roofPalette[Math.floor(s * roofPalette.length) % roofPalette.length];
      ctx.fillStyle = roofCol;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      // Парапет крыши (фаска)
      ctx.strokeStyle = '#2d4435';
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);

      // Внутренний уступ крыши
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(b.x + 10, b.y + 10, b.w - 20, b.h - 20);

      // Детали крыши: вентиляция, руины, солнечная панель или «матричный» билборд
      const variant = Math.floor(s * 5);
      if (variant === 0) {
        // Вентиляционные блоки
        ctx.fillStyle = '#28382e';
        ctx.fillRect(b.x + 18, b.y + 18, 28, 22);
        ctx.fillRect(b.x + 56, b.y + 52, 26, 26);
        ctx.strokeStyle = '#101813';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x + 18, b.y + 18, 28, 22);
      } else if (variant === 1) {
        // Разрушенная крыша / завал
        ctx.fillStyle = '#0c130e';
        ctx.beginPath();
        ctx.moveTo(b.x + 22, b.y + 24);
        ctx.lineTo(b.x + 76, b.y + 18);
        ctx.lineTo(b.x + 82, b.y + 72);
        ctx.lineTo(b.x + 30, b.y + 78);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#475749';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (variant === 2) {
        // Неоновая / Матричная крыша-серверная
        ctx.strokeStyle = 'rgba(57, 255, 136, 0.34)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x + 16, b.y + 16, b.w - 32, b.h - 32);
        ctx.fillStyle = 'rgba(57, 255, 136, 0.22)';
        ctx.font = '10px monospace';
        ctx.fillText('01F4', b.x + 24, b.y + 42);
        ctx.fillText('A9//', b.x + 54, b.y + 68);
      } else if (variant === 3) {
        // Водонапорный бак + ржавая площадка
        ctx.fillStyle = '#3c3124';
        ctx.beginPath();
        ctx.arc(b.x + 36, b.y + 36, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6c5537';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#25332a';
        ctx.fillRect(b.x + 56, b.y + 56, 28, 24);
      } else {
        // Световые окна крыши
        ctx.fillStyle = 'rgba(56, 232, 255, 0.11)';
        for (let k = 0; k < 3; k++) {
          ctx.fillRect(b.x + 18, b.y + 20 + k * 24, b.w - 36, 12);
        }
      }
    }

    // Периметр стены пустоши
    ctx.strokeStyle = 'rgba(57, 255, 136, 0.45)';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, WIDTH - 8, HEIGHT - 8);

    return canvas;
  }

  function bakeMinimapBg(grid, depot, radZones) {
    const c = document.createElement('canvas');
    c.width = 280;
    c.height = 190;
    const ctx = c.getContext('2d');
    const sx = c.width / WIDTH;
    const sy = c.height / HEIGHT;

    ctx.fillStyle = '#07110a';
    ctx.fillRect(0, 0, c.width, c.height);

    for (let r = 0; r < ROWS; r++) {
      for (let col = 0; col < COLS; col++) {
        const t = grid[r][col];
        const x = col * TILE * sx;
        const y = r * TILE * sy;
        const w = TILE * sx;
        const h = TILE * sy;
        if (t === T_ROAD) {
          ctx.fillStyle = '#183021';
          ctx.fillRect(x, y, w + 0.5, h + 0.5);
        } else if (t === T_DEPOT) {
          ctx.fillStyle = '#2d3a20';
          ctx.fillRect(x, y, w + 0.5, h + 0.5);
        } else if (t === T_WASTE) {
          ctx.fillStyle = '#1e2c1a';
          ctx.fillRect(x, y, w + 0.5, h + 0.5);
        } else {
          ctx.fillStyle = '#0b1810';
          ctx.fillRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
        }
      }
    }

    for (const z of radZones) {
      ctx.fillStyle = 'rgba(200, 255, 70, 0.25)';
      ctx.beginPath();
      ctx.arc(z.x * sx, z.y * sy, z.radius * sx, 0, Math.PI * 2);
      ctx.fill();
    }

    // Маркер Депо
    ctx.fillStyle = '#ffb84d';
    ctx.fillRect(depot.x * sx - 5, depot.y * sy - 5, 10, 10);

    return c;
  }

  return { createWorld };
})();
