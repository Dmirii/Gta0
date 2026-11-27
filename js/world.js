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

  // 4 полноценных сектора-биома со своей планировкой, погодой, палитрой и экономикой
  const SECTORS = [
    {
      index: 0,
      id: 'downtown',
      code: '01',
      name: 'НОЧНОЙ ДАУНТАУН',
      shortName: '01 ДАУНТАУН',
      desc: 'Мокрый асфальт, неоновые кварталы, дождь',
      weather: 'rain',
      capsMult: 1.0,
      threatBonus: 0,
      asphalt: '#15181c',
      wasteBase: '#201e1a',
      wasteGlow: 'rgba(116, 88, 52, 0.28)',
      sidewalk: '#2d3033',
      curb: '#484d52',
      roadLine: 'rgba(218, 165, 58, 0.56)',
      ambient: '#242e3c',
      lightA: '#ffab42',
      lightB: '#38e8ff',
      riftChance: 0.90,
      puddleChance: 0.68,
      signs: ['NEXUS', 'ZERO//0', 'VAULT', 'PULSE', '0xFF42', 'V-CODE', 'CYBER', 'HOTEL', 'SYS.ERR', 'RAD-7', 'APEX', 'ARCADE'],
      layout: [
        'RRRRRRRRRRRRRRRRRRRRRR',
        'RBBWRBBRBBRBBRBBRBBRBR',
        'RBBWRBBRBBRBBRBBRBBRBR',
        'RRRRRRRRRRRRRRRRRRRRRR',
        'RBRWBBRBBRWWWRBBRBBRBR',
        'RBRRRRRRRRRRRRRRRRRRBR',
        'RBRBBRBWRDDDRBBRBBRWBR',
        'RRRRRRRRRDDDRRRRRRRRRR',
        'RBRBBRBWRDDDRBBRWBRBBR',
        'RBRRRRRRRRRRRRRRRRRRBR',
        'RBRWWRBBRWWWRBBRBBRBBR',
        'RBRWWRBBRBBRBBRBBRBBWR',
        'RRRRRRRRRRRRRRRRRRRRRR',
        'RBBBRBBRBBRBBRBBRWWBBR',
        'RBBBRBBRWWRBBRBBRWWBBR',
        'RRRRRRRRRRRRRRRRRRRRRR'
      ],
      radZones: [
        { c: 3.5, r: 1.5, radius: 105 },
        { c: 4.0, r: 11.0, radius: 118 },
        { c: 18.0, r: 14.0, radius: 115 },
        { c: 11.0, r: 4.5, radius: 96 }
      ],
      terminals: [
        { id: 1, name: 'УЗЕЛ АЛЬФА', c: 8.5, r: 6.5 },
        { id: 2, name: 'УЗЕЛ ZERO',  c: 16.5, r: 8.5 },
        { id: 3, name: 'УЗЕЛ СИГМА', c: 10.5, r: 10.5 },
        { id: 4, name: 'УЗЕЛ ОМЕГА', c: 9.0, r: 14.5 }
      ]
    },
    {
      index: 1,
      id: 'wasteland',
      code: '02',
      name: 'РЖАВАЯ ПУСТОШЬ',
      shortName: '02 ПУСТОШЬ',
      desc: 'Широкие трассы, песчаная буря, рад-кратеры, +25% ₵',
      weather: 'dust',
      capsMult: 1.25,
      threatBonus: 0,
      asphalt: '#1e1913',
      wasteBase: '#2a2117',
      wasteGlow: 'rgba(176, 118, 52, 0.36)',
      sidewalk: '#362b20',
      curb: '#5c4935',
      roadLine: 'rgba(235, 162, 66, 0.62)',
      ambient: '#332419',
      lightA: '#ff9838',
      lightB: '#ffd068',
      riftChance: 0.92,
      puddleChance: 0.86,
      signs: ['SCRAP', 'FUEL-9', 'RUST', 'RAD-ZONE', 'OUTPOST', 'DEPOT', 'CANYON', 'DUST//2', 'VAULT', 'RIG-77'],
      layout: [
        'RRRRRRRRRRRRRRRRRRRRRR',
        'RWWBRWWWRBBRWWWRBBRWWR',
        'RWWBRWWWRBBRWWWRBBRWWR',
        'RRRRRRRRRRRRRRRRRRRRRR',
        'RBBRWWRRRRRRRRRRWWRBBR',
        'RWRRRRRRWWWWWWRRRRRRWR',
        'RWRBWRBWRDDDRBWRBWRBWR',
        'RRRRRRRRRDDDRRRRRRRRRR',
        'RWRBWRWWRDDDRWWRBWRBWR',
        'RWRRRRRRWWWWWWRRRRRRWR',
        'RBBRWWRRRRRRRRRRWWRBBR',
        'RWWBRWWRBBRBBRWWRBBWWR',
        'RRRRRRRRRRRRRRRRRRRRRR',
        'RWWBBRWWWRBBRWWWRWWBBR',
        'RWWBBRWWWRBBRWWWRWWBBR',
        'RRRRRRRRRRRRRRRRRRRRRR'
      ],
      radZones: [
        { c: 2.5, r: 1.8, radius: 118 },
        { c: 7.5, r: 1.8, radius: 108 },
        { c: 15.0, r: 1.8, radius: 112 },
        { c: 3.0, r: 13.8, radius: 120 },
        { c: 14.5, r: 13.8, radius: 115 },
        { c: 18.8, r: 8.5, radius: 106 }
      ],
      terminals: [
        { id: 1, name: 'ВЫШКА-01', c: 5.5, r: 4.5 },
        { id: 2, name: 'ВЫШКА-02', c: 16.5, r: 4.5 },
        { id: 3, name: 'ВЫШКА-03', c: 5.5, r: 10.5 },
        { id: 4, name: 'ВЫШКА-04', c: 16.5, r: 10.5 }
      ]
    },
    {
      index: 2,
      id: 'industrial',
      code: '03',
      name: 'ПРОМЗОНА / ДОКИ',
      shortName: '03 ПРОМЗОНА',
      desc: 'Скоростные магистрали, огромные ангары, +50% ₵',
      weather: 'smog',
      capsMult: 1.5,
      threatBonus: 1,
      asphalt: '#13191e',
      wasteBase: '#1b2228',
      wasteGlow: 'rgba(72, 118, 148, 0.28)',
      sidewalk: '#29323a',
      curb: '#4b5b69',
      roadLine: 'rgba(235, 185, 62, 0.52)',
      ambient: '#1c2a35',
      lightA: '#48c8ff',
      lightB: '#ff9642',
      riftChance: 0.87,
      puddleChance: 0.62,
      signs: ['DOCK-09', 'CARGO', 'SECTOR-3', 'REACTOR', 'STEEL', 'CRANE', 'PORT-X', 'HEAVY', 'FORGE', 'FUEL'],
      layout: [
        'RRRRRRRRRRRRRRRRRRRRRR',
        'RBBBRBBBRRRRRRBBBRBBBR',
        'RBBBRBBBRWWRWRBBBRBBBR',
        'RRRRRRRRRRRRRRRRRRRRRR',
        'RBBWRRRRRBBRBBRRRRRBBR',
        'RBBWRBBBRRRRRRBBBRWBBR',
        'RRRRRBBWRDDDRWBBBRRRRR',
        'RRRRRRRRRDDDRRRRRRRRRR',
        'RRRRRBBWRDDDRWBBBRRRRR',
        'RBBWRBBBRRRRRRBBBRWBBR',
        'RBBWRRRRRBBRBBRRRRRBBR',
        'RRRRRRRRRRRRRRRRRRRRRR',
        'RBBBRWWRRRRRRRRWWBBBBR',
        'RBBBRBBBRWWRWRBBBRBBBR',
        'RBBBRBBBRWWRWRBBBRBBBR',
        'RRRRRRRRRRRRRRRRRRRRRR'
      ],
      radZones: [
        { c: 10.5, r: 2.5, radius: 108 },
        { c: 3.5, r: 8.0, radius: 112 },
        { c: 18.5, r: 8.0, radius: 112 },
        { c: 10.5, r: 13.8, radius: 118 },
        { c: 16.5, r: 12.5, radius: 98 }
      ],
      terminals: [
        { id: 1, name: 'ДОК-АЛЬФА', c: 10.5, r: 3.5 },
        { id: 2, name: 'ДОК-БЕТА',  c: 17.5, r: 7.5 },
        { id: 3, name: 'ДОК-ГАММА', c: 4.5, r: 7.5 },
        { id: 4, name: 'ДОК-ДЕЛЬТА',c: 10.5, r: 11.5 }
      ]
    },
    {
      index: 3,
      id: 'core',
      code: '04',
      name: 'ЯДРО СИСТЕМЫ',
      shortName: '04 ЯДРО КОДА',
      desc: 'Кибер-лабиринт, шторм кода, элита Системы, +80% ₵',
      weather: 'code',
      capsMult: 1.8,
      threatBonus: 1,
      asphalt: '#0b1410',
      wasteBase: '#0e1d16',
      wasteGlow: 'rgba(57, 255, 136, 0.24)',
      sidewalk: '#15271f',
      curb: '#2d634a',
      roadLine: 'rgba(57, 255, 136, 0.45)',
      ambient: '#163026',
      lightA: '#39ff88',
      lightB: '#38e8ff',
      riftChance: 0.72,
      puddleChance: 0.74,
      signs: ['0x00FF', 'ROOT//0', 'V-CORE', 'KERNEL', 'DAEMON', 'SYNC-9', 'NODE-X', 'CIPHER', 'OVERDRIVE', 'SYS.OK'],
      layout: [
        'RRRRRRRRRRRRRRRRRRRRRR',
        'RBRBBRBBRWWRBBRBBRBBRR',
        'RBRBBRBBRWWRBBRBBRBBRR',
        'RRRRRRRRRRRRRRRRRRRRRR',
        'RBBWRBRBBRRRRBBBRBRBBR',
        'RRRRRBRRRRRRRRRRRBRRRR',
        'RBRBBRBWRDDDRWBRBBRBBR',
        'RRRRRRRRRDDDRRRRRRRRRR',
        'RBRBBRBWRDDDRWBRBBRBBR',
        'RRRRRBRRRRRRRRRRRBRRRR',
        'RBBWRBRBBRRRRBBBRBRBBR',
        'RRRRRRRRRRRRRRRRRRRRRR',
        'RBRBBRWWRBBRWWRBBRBBRR',
        'RBRBBRBBRWWRBBRBBRBBRR',
        'RBRRRRRRRRRRRRRRRRRRBR',
        'RRRRRRRRRRRRRRRRRRRRRR'
      ],
      radZones: [
        { c: 10.5, r: 1.8, radius: 105 },
        { c: 3.5, r: 4.5, radius: 102 },
        { c: 18.5, r: 10.5, radius: 108 },
        { c: 10.5, r: 13.5, radius: 112 }
      ],
      terminals: [
        { id: 1, name: 'ЯДРО-01', c: 5.5, r: 5.5 },
        { id: 2, name: 'ЯДРО-02', c: 16.5, r: 5.5 },
        { id: 3, name: 'ЯДРО-03', c: 5.5, r: 9.5 },
        { id: 4, name: 'ЯДРО-04', c: 16.5, r: 9.5 }
      ]
    }
  ];

  // Текстурный шум асфальта под конкретный биом (бесшовный паттерн 128x128)
  function makeAsphaltPattern(ctx, sector) {
    const p = document.createElement('canvas');
    p.width = 128;
    p.height = 128;
    const g = p.getContext('2d');
    g.fillStyle = sector.asphalt || '#15181c';
    g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 2) {
      for (let x = 0; x < 128; x += 2) {
        const v = hash(x * 7 + 3 + sector.index * 19, y * 11 + 5);
        if (v > 0.72) {
          g.fillStyle = sector.id === 'wasteland'
            ? 'rgba(225,175,105,0.065)'
            : sector.id === 'core'
              ? 'rgba(57,255,136,0.05)'
              : 'rgba(255,255,255,0.038)';
          g.fillRect(x, y, 2, 2);
        } else if (v < 0.24) {
          g.fillStyle = 'rgba(0,0,0,0.16)';
          g.fillRect(x, y, 2, 2);
        }
      }
    }
    if (sector.id === 'core') {
      // Тонкая цифровая сетка в Ядре Системы
      g.strokeStyle = 'rgba(57, 255, 136, 0.09)';
      g.lineWidth = 1;
      g.strokeRect(0.5, 0.5, 63, 63);
      g.strokeRect(64.5, 64.5, 63, 63);
    } else {
      g.strokeStyle = 'rgba(0,0,0,0.32)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(14, 22); g.lineTo(28, 30); g.lineTo(35, 25);
      g.moveTo(86, 74); g.lineTo(96, 88); g.lineTo(112, 92);
      g.stroke();
    }
    return ctx.createPattern(p, 'repeat');
  }

  function createWorld(sectorIndex, runSeed) {
    const sIdx = ((sectorIndex || 0) % SECTORS.length + SECTORS.length) % SECTORS.length;
    const sector = SECTORS[sIdx];
    const seedSalt = ((runSeed || 1) * 97 + sIdx * 31) | 0;

    // 1. Строим сетку выбранного биома (22 x 16) + лёгкая процедурная вариация кварталов от runSeed
    const layout = sector.layout;
    const grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = new Uint8Array(COLS);
      for (let c = 0; c < COLS; c++) {
        const ch = layout[r][c];
        let val = ch === 'R' ? T_ROAD : ch === 'D' ? T_DEPOT : ch === 'W' ? T_WASTE : T_BLDG;
        // Процедурная вариация для уникальной планировки каждого заезда (не трогая Депо и внешнее кольцо)
        if (runSeed && runSeed > 1 && r >= 1 && r <= ROWS - 2 && c >= 1 && c <= COLS - 2) {
          const nearDepot = c >= 8 && c <= 12 && r >= 5 && r <= 9;
          if (!nearDepot) {
            const rv = hash(c * 41 + seedSalt, r * 53 + seedSalt);
            if (val === T_BLDG && rv > 0.86) val = T_WASTE;
            else if (val === T_WASTE && rv < 0.14 && sector.id !== 'wasteland') val = T_BLDG;
          }
        }
        row[c] = val;
      }
      grid.push(row);
    }

    // Главный Бункер-Депо в центре (cols 9..11, rows 6..8 -> центр 10.5, 7.5)
    const depot = {
      x: 10.5 * TILE,
      y: 7.5 * TILE,
      radius: 112
    };

    // Радиационные кратеры биома (с небольшим смещением на seed)
    const radZones = sector.radZones.map((z, idx) => {
      const jx = (hash(idx * 17 + seedSalt, 11) - 0.5) * 44;
      const jy = (hash(idx * 23 + seedSalt, 29) - 0.5) * 44;
      return {
        x: Math.max(TILE, Math.min(WIDTH - TILE, z.c * TILE + jx)),
        y: Math.max(TILE, Math.min(HEIGHT - TILE, z.r * TILE + jy)),
        radius: z.radius
      };
    });

    // 4 цифровых терминала (узлы взлома)
    const terminals = sector.terminals.map((t) => ({
      id: t.id,
      name: t.name,
      x: t.c * TILE,
      y: t.r * TILE
    }));

    // 2. Объединяем смежные 'B'-клетки в крупные составные 2.5D комплексы
    const visited = Array.from({ length: ROWS }, () => new Uint8Array(COLS));
    const buildings = [];
    const bldgGrid = new Map();
    const NEON_SIGNS = sector.signs;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] !== T_BLDG || visited[r][c]) continue;

        let bw = 1, bh = 1;
        while (c + bw < COLS && bw < 3 && grid[r][c + bw] === T_BLDG && !visited[r][c + bw]) {
          bw++;
        }
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

        const seed = hash(c * 17 + 5 + seedSalt, r * 31 + 9 + seedSalt);
        const pad = 13;
        const distCenter = Math.hypot((c + bw / 2) * TILE - depot.x, (r + bh / 2) * TILE - depot.y);
        const isEastCyber = (c + bw / 2) > COLS * 0.52;
        const isDowntown = distCenter < 760 || (bw * bh >= 2 && isEastCyber);

        let style = 'apt';
        if (sector.id === 'wasteland') {
          style = seed < 0.62 ? 'ruin' : (bw * bh >= 2 && seed > 0.78 ? 'tower' : 'apt');
        } else if (sector.id === 'industrial') {
          style = bw * bh >= 4 ? 'tower' : (seed < 0.25 ? 'ruin' : 'apt');
        } else if (sector.id === 'core') {
          style = seed > 0.35 ? 'cyber' : 'tower';
        } else {
          if (bw * bh >= 4 || (isDowntown && seed > 0.42)) style = 'tower';
          else if (!isEastCyber && seed < 0.34) style = 'ruin';
          else if (isEastCyber && seed > 0.55) style = 'cyber';
        }

        const height =
          style === 'tower' ? 0.26 + seed * 0.12 :
          style === 'cyber' ? 0.22 + seed * 0.11 :
          style === 'apt'   ? 0.15 + seed * 0.08 :
                              0.09 + seed * 0.05;

        const neonPalette =
          sector.id === 'core'       ? ['#39ff88', '#38e8ff'] :
          sector.id === 'wasteland'  ? ['#ffb84d', '#ff6e40', '#ffd068'] :
          sector.id === 'industrial' ? ['#38e8ff', '#ffb84d', '#ff6b4a'] :
          style === 'cyber'          ? ['#39ff88', '#38e8ff'] :
          style === 'tower'          ? ['#38e8ff', '#ffb84d', '#39ff88', '#ff5470'] :
                                       ['#ffb84d', '#ff6e40', '#39ff88'];
        const neonColor = neonPalette[Math.floor(seed * 19) % neonPalette.length];

        const hasSign = (style === 'tower' || style === 'cyber' || sector.id === 'industrial') && seed > 0.28;
        const roofTone =
          style === 'ruin'           ? '#282018' :
          style === 'cyber'          ? '#101d18' :
          sector.id === 'industrial' ? '#1c242b' :
          sector.id === 'wasteland'  ? '#2a2219' : '#171b20';
        const wallBase =
          style === 'ruin'           ? '#32261c' :
          style === 'cyber'          ? '#11201a' :
          sector.id === 'industrial' ? '#1f2931' :
          sector.id === 'wasteland'  ? '#33281d' : '#1b2026';

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
          beacon: (style === 'tower' || sector.id === 'core') && height > 0.28,
          roofTone,
          wallBase
        };
        buildings.push(b);

        for (let yy = r; yy < r + bh; yy++) {
          for (let xx = c; xx < c + bw; xx++) {
            bldgGrid.set(yy * COLS + xx, b);
          }
        }
      }
    }

    // 3. Собираем проходимые тайлы дорог, фонари, костры, светофоры, лужи, остовы, цифровые разломы
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
        const h1 = hash(c * 13 + 1 + seedSalt, r * 23 + 7);
        const h2 = hash(c * 29 + 3, r * 19 + 11 + seedSalt);

        if (t === T_ROAD || t === T_WASTE) {
          roadTiles.push({ c, r, x: cx, y: cy, type: t });
        }

        if (t === T_ROAD) {
          const roadN = r > 0 && grid[r - 1][c] === T_ROAD;
          const roadS = r < ROWS - 1 && grid[r + 1][c] === T_ROAD;
          const roadW = c > 0 && grid[r][c - 1] === T_ROAD;
          const roadE = c < COLS - 1 && grid[r][c + 1] === T_ROAD;
          const isIntersection = (roadN || roadS) && (roadW || roadE);

          if (isIntersection && (c + r) % 2 === 0) {
            const useB = sector.id === 'core' ? h1 > 0.45 : (c > COLS * 0.55 && h1 > 0.45);
            streetlights.push({
              x: c * TILE + 12,
              y: r * TILE + 12,
              color: useB ? sector.lightB : sector.lightA,
              radius: 175,
              flicker: h2 > 0.72,
              phase: h1 * Math.PI * 2
            });
            if (sector.id !== 'wasteland' && (r === 3 || r === 7 || r === 12)) {
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
              color: h2 > 0.65 ? sector.lightB : sector.lightA,
              radius: 145,
              flicker: h2 > 0.8,
              phase: h2 * 10
            });
          }

          if (h1 > sector.puddleChance) {
            puddles.push({
              x: cx + (h2 - 0.5) * 46,
              y: cy + (h1 - 0.8) * 60,
              rx: 18 + h2 * 24,
              ry: 11 + h1 * 14,
              rot: h2 * Math.PI,
              tint: sector.id === 'core' ? (h2 > 0.5 ? '#39ff88' : '#38e8ff') : (h2 > 0.5 ? sector.lightB : sector.lightA)
            });
          }

          if ((sector.id === 'core' || c > COLS * 0.35) && h2 > sector.riftChance) {
            rifts.push({
              x: cx + (h1 - 0.5) * 40,
              y: cy + (h2 - 0.5) * 40,
              ang: (h1 - 0.5) * 1.6,
              len: 36 + h2 * 40,
              seed: h1
            });
          }
        }

        if (t === T_WASTE) {
          const fireThr = sector.id === 'wasteland' ? 0.32 : 0.48;
          if (h1 > fireThr) {
            fires.push({
              x: cx + (h2 - 0.5) * 58,
              y: cy + (h1 - 0.7) * 54,
              phase: h1 * 12
            });
          }
          const wreckThr = sector.id === 'wasteland' ? 0.42 : 0.55;
          if (h2 > wreckThr) {
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

    fires.push({ x: depot.x - 122, y: depot.y - 118, phase: 0.4 });
    fires.push({ x: depot.x + 122, y: depot.y - 118, phase: 2.1 });
    fires.push({ x: depot.x - 122, y: depot.y + 118, phase: 4.3 });
    fires.push({ x: depot.x + 122, y: depot.y + 118, phase: 5.7 });

    const mapCanvas = bakeGroundCanvas(grid, buildings, depot, radZones, wrecks, streetlights, sector);
    const minimapBg = bakeMinimapBg(grid, buildings, depot, radZones, sector);

    return {
      TILE, COLS, ROWS, WIDTH, HEIGHT,
      T_ROAD, T_BLDG, T_DEPOT, T_WASTE,
      sector,
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

      isBlocked(x, y) {
        return this.isPointInBuilding(x, y);
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
        if (Math.hypot(x - depot.x, y - depot.y) < 220) return `S-${sector.code} · БУНКЕР-ДЕПО`;
        if (this.getRadIntensity(x, y) > 0.05) return `S-${sector.code} · РАД-КРАТЕР`;
        return `СЕКТОР ${sector.code} · ${sector.name}`;
      }
    };
  }

  // ==================== ЗАПЕКАНИЕ ЗЕМЛИ, ДОРОГ И ТРОТУАРОВ ====================
  function bakeGroundCanvas(grid, buildings, depot, radZones, wrecks, streetlights, sector) {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');

    // 1. Текстурный асфальт под выбранный биом
    const asphaltPat = makeAsphaltPattern(ctx, sector);
    ctx.fillStyle = asphaltPat || sector.asphalt || '#15181c';
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

          ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
          if (isH && !isV) {
            ctx.fillRect(x, y + 26, TILE, 18);
            ctx.fillRect(x, y + TILE - 44, TILE, 18);
          } else if (isV && !isH) {
            ctx.fillRect(x + 26, y, 18, TILE);
            ctx.fillRect(x + TILE - 44, y, 18, TILE);
          }

          const isMainBlvd = (r === 3 || r === 7 || r === 12 || c === 0 || c === COLS - 1);
          const lineColor = sector.roadLine || 'rgba(218, 165, 58, 0.56)';
          if (isH && !isV) {
            if (isMainBlvd) {
              ctx.fillStyle = lineColor;
              ctx.fillRect(x, y + TILE / 2 - 4, TILE, 2.5);
              ctx.fillRect(x, y + TILE / 2 + 2, TILE, 2.5);
            } else {
              ctx.fillStyle = lineColor;
              for (let dx = 10; dx < TILE - 10; dx += 30) {
                ctx.fillRect(x + dx, y + TILE / 2 - 1.5, 16, 3);
              }
            }
            ctx.fillStyle = sector.id === 'core' ? 'rgba(56, 232, 255, 0.22)' : 'rgba(200, 210, 215, 0.14)';
            ctx.fillRect(x, y + 8, TILE, 2);
            ctx.fillRect(x, y + TILE - 10, TILE, 2);
          } else if (isV && !isH) {
            ctx.fillStyle = lineColor;
            for (let dy = 10; dy < TILE - 10; dy += 30) {
              ctx.fillRect(x + TILE / 2 - 1.5, y + dy, 3, 16);
            }
            ctx.fillStyle = sector.id === 'core' ? 'rgba(56, 232, 255, 0.22)' : 'rgba(200, 210, 215, 0.14)';
            ctx.fillRect(x + 8, y, 2, TILE);
            ctx.fillRect(x + TILE - 10, y, 2, TILE);
          } else if (isH && isV) {
            ctx.fillStyle = sector.id === 'core' ? 'rgba(57, 255, 136, 0.2)' : 'rgba(215, 215, 200, 0.17)';
            for (let k = 20; k < TILE - 20; k += 16) {
              if (roadN) ctx.fillRect(x + k, y + 5, 8, 13);
              if (roadS) ctx.fillRect(x + k, y + TILE - 18, 8, 13);
              if (roadW) ctx.fillRect(x + 5, y + k, 13, 8);
              if (roadE) ctx.fillRect(x + TILE - 18, y + k, 13, 8);
            }
            ctx.fillStyle = '#24292e';
            ctx.beginPath();
            ctx.arc(x + TILE / 2 + 12, y + TILE / 2 + 12, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = sector.id === 'core' ? '#2c7856' : '#3b4248';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          if ((sector.id === 'wasteland' && h1 > 0.32) || (c < COLS * 0.45 && h1 > 0.55)) {
            const g = ctx.createRadialGradient(x + 64, y + 64, 6, x + 64, y + 64, 58);
            g.addColorStop(0, sector.id === 'wasteland' ? 'rgba(176, 122, 60, 0.34)' : 'rgba(122, 92, 54, 0.24)');
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
          ctx.fillStyle = sector.wasteBase || '#201e1a';
          ctx.fillRect(x, y, TILE, TILE);
          const dg = ctx.createRadialGradient(x + 64, y + 64, 10, x + 64, y + 64, 80);
          dg.addColorStop(0, sector.wasteGlow || 'rgba(116, 88, 52, 0.28)');
          dg.addColorStop(1, 'rgba(20, 18, 16, 0.15)');
          ctx.fillStyle = dg;
          ctx.fillRect(x, y, TILE, TILE);

          ctx.strokeStyle = sector.id === 'core' ? 'rgba(57,255,136,0.22)' : 'rgba(0,0,0,0.45)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
          for (let i = 0; i < 9; i++) {
            const rx = x + 10 + hash(c * 17 + i, r * 11) * (TILE - 22);
            const ry = y + 10 + hash(r * 23 + i, c * 19) * (TILE - 22);
            ctx.fillStyle = sector.id === 'core'
              ? (i % 2 === 0 ? '#173828' : '#12281e')
              : (i % 2 === 0 ? '#3a342c' : '#2b2824');
            ctx.fillRect(rx, ry, 5 + (i % 4) * 3, 4 + (i % 3) * 2);
          }
        } else if (t === T_DEPOT) {
          ctx.fillStyle = '#212524';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = 'rgba(255, 184, 77, 0.22)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.fillRect(x + 8, y + 8, TILE - 16, TILE - 16);
        } else if (t === T_BLDG) {
          ctx.fillStyle = sector.sidewalk || '#2d3033';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.lineWidth = 1;
          for (let s = 32; s < TILE; s += 32) {
            ctx.beginPath();
            ctx.moveTo(x + s, y); ctx.lineTo(x + s, y + TILE);
            ctx.moveTo(x, y + s); ctx.lineTo(x + TILE, y + s);
            ctx.stroke();
          }
          ctx.fillStyle = sector.curb || '#484d52';
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

  function bakeMinimapBg(grid, buildings, depot, radZones, sector) {
    const c = document.createElement('canvas');
    c.width = 280;
    c.height = 190;
    const ctx = c.getContext('2d');
    const sx = c.width / WIDTH;
    const sy = c.height / HEIGHT;

    ctx.fillStyle = sector.id === 'wasteland' ? '#0c0906' : sector.id === 'industrial' ? '#060a0e' : '#060c09';
    ctx.fillRect(0, 0, c.width, c.height);

    const roadCol = sector.id === 'wasteland' ? '#2c2317' : sector.id === 'industrial' ? '#172530' : sector.id === 'core' ? '#103022' : '#182b20';
    const wasteCol = sector.id === 'wasteland' ? '#362718' : sector.id === 'core' ? '#0e241b' : '#232419';

    for (let r = 0; r < ROWS; r++) {
      for (let col = 0; col < COLS; col++) {
        const t = grid[r][col];
        const x = col * TILE * sx;
        const y = r * TILE * sy;
        const w = TILE * sx;
        const h = TILE * sy;
        if (t === T_ROAD) {
          ctx.fillStyle = roadCol;
          ctx.fillRect(x, y, w + 0.5, h + 0.5);
        } else if (t === T_DEPOT) {
          ctx.fillStyle = '#333b22';
          ctx.fillRect(x, y, w + 0.5, h + 0.5);
        } else if (t === T_WASTE) {
          ctx.fillStyle = wasteCol;
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

  return { createWorld, SECTORS };
})();
