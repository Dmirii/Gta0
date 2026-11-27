'use strict';

window.GTA0 = window.GTA0 || {};

window.GTA0.Audio = (function () {
  let ctx = null;
  let noiseBuf = null;
  let sfxEnabled = true;
  let musicEnabled = true;
  let matrixSlow = false;
  let gameActive = false;

  // Мастер-шины и эффекты
  let masterComp = null;
  let masterGain = null;
  let sfxBus = null;
  let musicBus = null;
  let musicFilter = null;
  let musicBassBus = null;
  let musicArpBus = null;
  let musicLeadBus = null;
  let musicPadBus = null;
  let musicAcidBus = null;
  let musicSnareBus = null;
  let musicHatBus = null;
  let engineBus = null;
  let lastEngUpdate = 0;

  // Непрерывный синтезатор двигателя, дрифта и нитро
  let eng = null;

  // Трекер фоновой музыки (3 разных Keygen / Cracktro чиптюна!)
  let musicTimer = null;
  let musicStep = 0;
  let nextStepTime = 0;
  let musicPlaying = false;
  let currentTrackIdx = 0;

  // MIDI -> Hz
  function mtof(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // ==================== 3 САУНДТРЕКА KEYGEN / CRACKTRO (РАЗНАЯ РИТМИКА И НАСТРОЕНИЕ) ====================
  const TRACKS = [
    // ---------- ТРЕК 0: КЛАССИЧЕСКИЙ AMIGA / CRACKTRO ХУК (D MINOR, 138 BPM, 4/4) ----------
    {
      id: 'razor-neon',
      code: 'FM-01',
      name: 'RAZOR NEON',
      bpm: 138,
      slowBpm: 82,
      style: 'classic',
      chords: [
        [62, 65, 69, 38], [58, 62, 65, 34], [60, 64, 67, 36], [57, 60, 64, 33],
        [62, 65, 69, 38], [58, 62, 65, 34], [55, 58, 62, 31], [57, 61, 64, 33],
        [58, 62, 65, 34], [60, 64, 67, 36], [62, 65, 69, 38], [65, 69, 72, 41],
        [55, 58, 62, 31], [57, 60, 64, 33], [58, 62, 65, 34], [57, 61, 64, 33]
      ],
      lead: [
        74, 0, 77, 0, 81, -1, 79, 0, 77, 0, 76, 0, 74, 0, 72, 0,
        70, 0, 74, 0, 77, -1, 74, 0, 72, 0, 70, 0, 69, 0, 70, 0,
        72, 0, 76, 0, 79, -1, 76, 0, 74, 0, 72, 0, 74, 0, 76, 0,
        76, -1, 74, 0, 72, 0, 69, 0, 72, 0, 74, 0, 76, 0, 79, 0,

        81, 0, 81, 0, 86, -1, 84, 0, 81, 0, 79, 0, 77, 0, 81, 0,
        82, 0, 82, 0, 81, 0, 79, 0, 77, 0, 74, 0, 77, 0, 82, 0,
        79, 0, 77, 0, 74, 0, 70, 0, 74, 0, 77, 0, 79, 0, 82, 0,
        81, -1, 79, 0, 76, 0, 73, 0, 76, 0, 79, 0, 81, 0, 85, 0,

        74, 0, 70, 74, 77, 0, 74, 0, 82, 0, 81, 0, 77, 0, 74, 0,
        76, 0, 72, 76, 79, 0, 76, 0, 84, 0, 81, 0, 79, 0, 76, 0,
        77, 0, 74, 77, 81, 0, 77, 0, 86, 0, 84, 0, 81, 0, 79, 0,
        81, -1, 77, 0, 81, 0, 84, 0, 86, -1, 84, 0, 81, 0, 77, 0,

        79, 0, 74, 77, 79, 0, 82, 0, 81, 0, 79, 0, 77, 0, 74, 0,
        76, 0, 72, 74, 76, 0, 81, 0, 79, 0, 76, 0, 74, 0, 72, 0,
        74, 77, 82, 0, 81, 0, 77, 0, 74, 77, 82, 0, 84, 0, 82, 0,
        81, 0, 79, 0, 76, 0, 73, 0, 76, 79, 81, 85, 88, 0, 85, 0
      ],
      bass: [0, 12, 0, 12, 0, 12, 7, 12, 0, 12, 0, 12, 7, 10, 12, 7]
    },

    // ---------- ТРЕК 1: НОЧНОЙ OUTRUN / СИНТВЕЙВ 80-Х (C MINOR, 104 BPM) ----------
    {
      id: 'nightcall-1986',
      code: 'FM-02',
      name: 'NIGHTCALL 1986',
      bpm: 104,
      slowBpm: 68,
      style: 'synthwave',
      chords: [
        // A: Cm - Ab - Fm - G (атмосферная ночная тема)
        [48, 55, 63, 36], [44, 51, 60, 32], [41, 48, 56, 29], [43, 50, 59, 31],
        // B: Eb - Bb - Fm - G (широкий мажорный просвет)
        [51, 55, 58, 39], [46, 53, 58, 34], [41, 48, 56, 29], [43, 50, 59, 31],
        // C: Ab - Bb - Cm - Eb (эпический припев на трассе)
        [44, 51, 60, 32], [46, 53, 62, 34], [48, 55, 63, 36], [51, 55, 63, 39],
        // D: Fm - Cm - Ab - G (меланхоличный финал)
        [41, 48, 56, 29], [48, 55, 63, 36], [44, 51, 60, 32], [43, 50, 59, 31]
      ],
      lead: [
        // A: длинные певучие аналоговые ноты с широким дыханием
        79, -1, -1, -1, -1, -1, 75, -1, 74, -1, 72, -1, -1, -1, 0, 0,
        72, -1, -1, -1, 75, -1, 79, -1, 80, -1, -1, -1, 79, -1, 75, -1,
        77, -1, -1, -1, -1, -1, 75, -1, 72, -1, 75, -1, 77, -1, 0, 0,
        74, -1, -1, -1, -1, -1, 0, 0, 71, -1, 74, -1, 79, -1, -1, -1,

        // B: ночной горизонт
        82, -1, -1, -1, 79, -1, 75, -1, 79, -1, -1, -1, 75, -1, 0, 0,
        77, -1, -1, -1, 74, -1, 70, -1, 74, -1, -1, -1, 77, -1, 75, -1,
        72, -1, -1, -1, 75, -1, 77, -1, 80, -1, -1, -1, 77, -1, 75, -1,
        79, -1, -1, -1, -1, -1, 77, -1, 74, -1, -1, -1, 0, 0, 72, 74,

        // C: высокий неоновый припев
        75, -1, -1, -1, -1, -1, 79, -1, 80, -1, -1, -1, 84, -1, -1, -1,
        82, -1, -1, -1, -1, -1, 79, -1, 77, -1, -1, -1, 74, -1, 77, -1,
        79, -1, -1, -1, -1, -1, 75, -1, 72, -1, -1, -1, 75, -1, 79, -1,
        82, -1, -1, -1, 84, -1, 82, -1, 79, -1, -1, -1, 0, 0, 75, -1,

        // D: мягкий спуск и возврат в главную тему
        77, -1, -1, -1, 80, -1, 77, -1, 75, -1, 72, -1, 75, -1, 77, -1,
        79, -1, -1, -1, 75, -1, 72, -1, 67, -1, -1, -1, 72, -1, 75, -1,
        80, -1, -1, -1, -1, -1, 79, -1, 75, -1, -1, -1, 72, -1, -1, -1,
        74, -1, -1, -1, -1, -1, 71, -1, 74, -1, 77, -1, 74, -1, 0, 0
      ],
      // Ровный пульсирующий 8-дольный Outrun-бас (только чётные шаги!)
      bass: [0, -99, 0, -99, 0, -99, 0, -99, 0, -99, 0, -99, 12, -99, 7, -99]
    },

    // ---------- ТРЕК 2: ТЁМНЫЙ КИБЕРПАНК / ACID-ИНДАСТРИАЛ ТЕХНО (F# PHRYGIAN, 128 BPM) ----------
    {
      id: 'matrix-rave',
      code: 'FM-03',
      name: 'MATRIX RAVE',
      bpm: 128,
      slowBpm: 78,
      style: 'industrial',
      chords: [
        // A: F#m - F#m - G - F#m (зловещая фригийская секунда F# -> G)
        [54, 57, 61, 30], [54, 57, 61, 30], [55, 59, 62, 31], [54, 57, 61, 30],
        // B: F#m - D - E - G (тёмный разгон)
        [54, 57, 61, 30], [50, 54, 57, 26], [52, 55, 59, 28], [55, 59, 62, 31],
        // C: F#m - G - Bm - C# (клубный индастриал-дроп)
        [54, 57, 61, 30], [55, 59, 62, 31], [59, 62, 66, 35], [61, 64, 68, 37],
        // D: D - E - G - F#m (гипнотический выход)
        [50, 54, 57, 26], [52, 55, 59, 28], [55, 59, 62, 31], [54, 57, 61, 30]
      ],
      lead: [
        // A: рубленые металлические FM-колокола в духе подземного клуба Матрицы
        66, 0, 0, 66, 0, 0, 67, 0, 66, 0, 0, 73, 0, 0, 67, 0,
        66, 0, 0, 66, 0, 69, 0, 0, 73, 0, 74, 0, 73, 0, 67, 0,
        67, 0, 0, 67, 0, 0, 71, 0, 74, 0, 0, 71, 0, 0, 67, 0,
        66, 0, 0, 73, 0, 0, 67, 0, 66, 0, 61, 0, 66, 0, 0, 0,

        // B: индустриальный рифф на октаву выше
        78, 0, 0, 73, 0, 0, 74, 0, 73, 0, 0, 69, 0, 0, 66, 0,
        74, 0, 0, 69, 0, 0, 74, 0, 78, 0, 0, 74, 0, 69, 0, 0,
        76, 0, 0, 71, 0, 0, 76, 0, 79, 0, 0, 76, 0, 71, 0, 0,
        79, 0, 74, 0, 71, 0, 74, 0, 79, 0, 0, 78, 0, 74, 71, 0,

        // C: главный кислотный рейв-хук
        78, 0, 0, 79, 0, 0, 78, 0, 73, 0, 0, 78, 0, 79, 78, 0,
        79, 0, 0, 83, 0, 0, 79, 0, 74, 0, 0, 79, 0, 83, 79, 0,
        83, 0, 0, 78, 0, 0, 83, 0, 86, 0, 0, 83, 0, 78, 0, 0,
        85, 0, 0, 80, 0, 0, 85, 0, 88, 0, 85, 0, 80, 0, 73, 0,

        // D: трансовый спад обратно в F# Phrygian
        86, 0, 0, 81, 0, 0, 78, 0, 74, 0, 0, 78, 0, 81, 0, 0,
        88, 0, 0, 83, 0, 0, 79, 0, 76, 0, 0, 79, 0, 83, 0, 0,
        79, 0, 0, 74, 0, 79, 0, 0, 83, 0, 0, 79, 0, 74, 0, 0,
        78, 0, 73, 0, 74, 0, 73, 0, 67, 0, 66, 0, 73, 0, 66, 0
      ],
      // Синкопированный кислотный TB-303 бас-паттерн
      bass: [0, -99, 0, 12, -99, 0, 7, -99, 0, 12, -99, 0, 7, -99, 12, 7]
    }
  ];

  // ==================== ИНИЦИАЛИЗАЦИЯ WEB AUDIO ====================
  function createNoiseBuffer(c) {
    const len = Math.floor(c.sampleRate * 1.5);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function initGraph() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      // latencyHint: 'playback' предотвращает audio underrun и заикание Keygen на Android WebView
      ctx = new AC({ latencyHint: 'playback' });
    } catch {
      ctx = new AC();
    }
    noiseBuf = createNoiseBuffer(ctx);

    // Мастер-компрессор защищает от хрипа при одновременных взрывах, стрельбе, моторе и музыке
    masterComp = ctx.createDynamicsCompressor();
    masterComp.threshold.value = -14;
    masterComp.knee.value = 18;
    masterComp.ratio.value = 6;
    masterComp.attack.value = 0.004;
    masterComp.release.value = 0.14;

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.85;
    masterComp.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Шина звуковых эффектов
    sfxBus = ctx.createGain();
    sfxBus.gain.value = sfxEnabled ? 0.92 : 0;
    sfxBus.connect(masterComp);

    // Шина музыки (через фильтр для сочного замедления в Цифровом Фокусе)
    musicFilter = ctx.createBiquadFilter();
    musicFilter.type = 'lowpass';
    musicFilter.frequency.value = 14000;
    musicFilter.Q.value = 0.9;

    musicBus = ctx.createGain();
    musicBus.gain.value = musicEnabled ? 0.34 : 0;
    musicBus.connect(musicFilter);
    musicFilter.connect(masterComp);

    // Предсозданные подшины Keygen-трекера (вместо создания BiquadFilter на каждой 16-й ноте!)
    musicBassBus = ctx.createBiquadFilter();
    musicBassBus.type = 'lowpass';
    musicBassBus.frequency.value = 880;
    musicBassBus.connect(musicBus);

    musicArpBus = ctx.createBiquadFilter();
    musicArpBus.type = 'lowpass';
    musicArpBus.frequency.value = 2350;
    musicArpBus.connect(musicBus);

    musicLeadBus = ctx.createBiquadFilter();
    musicLeadBus.type = 'lowpass';
    musicLeadBus.frequency.value = 3400;
    musicLeadBus.connect(musicBus);

    // Мягкая аналоговая шина для Outrun Synthwave пэдов и певучего лида (без 8-битного скрежета)
    musicPadBus = ctx.createBiquadFilter();
    musicPadBus.type = 'lowpass';
    musicPadBus.frequency.value = 1480;
    musicPadBus.Q.value = 0.85;
    musicPadBus.connect(musicBus);

    // Резонансная кислотная шина для TB-303 Acid-баса в треке MATRIX RAVE
    musicAcidBus = ctx.createBiquadFilter();
    musicAcidBus.type = 'lowpass';
    musicAcidBus.frequency.value = 1180;
    musicAcidBus.Q.value = 5.4;
    musicAcidBus.connect(musicBus);

    musicSnareBus = ctx.createBiquadFilter();
    musicSnareBus.type = 'bandpass';
    musicSnareBus.frequency.value = 2100;
    musicSnareBus.Q.value = 0.9;
    musicSnareBus.connect(musicBus);

    musicHatBus = ctx.createBiquadFilter();
    musicHatBus.type = 'highpass';
    musicHatBus.frequency.value = 7200;
    musicHatBus.connect(musicBus);

    // Шина двигателя и шин
    engineBus = ctx.createGain();
    engineBus.gain.value = sfxEnabled ? 0.85 : 0;
    engineBus.connect(masterComp);

    initEngineNodes();
    return ctx;
  }

  function ensure() {
    const c = initGraph();
    if (!c) return null;
    if (c.state === 'suspended') {
      c.resume().catch(() => {});
    }
    return c;
  }

  // ==================== СИНТЕЗАТОР ДВИГАТЕЛЯ + ДРИФТ + НИТРО ====================
  function initEngineNodes() {
    if (!ctx || eng) return;

    // Основной тон цилиндров (sawtooth) + суб-бас мотора (triangle) + турбина (sine)
    const oscMain = ctx.createOscillator();
    const oscSub = ctx.createOscillator();
    const oscTurbo = ctx.createOscillator();
    oscMain.type = 'sawtooth';
    oscSub.type = 'triangle';
    oscTurbo.type = 'sine';
    oscMain.frequency.value = 48;
    oscSub.frequency.value = 24;
    oscTurbo.frequency.value = 220;

    // Тёплый фильтр выхлопа (убирает резкое жужжание, оставляет бархатный рык V8!)
    const engFilt = ctx.createBiquadFilter();
    engFilt.type = 'lowpass';
    engFilt.frequency.value = 190;
    engFilt.Q.value = 2.1;

    // Лёгкое "бульканье" цилиндров на холостых через LFO
    const chugLfo = ctx.createOscillator();
    const chugDepth = ctx.createGain();
    chugLfo.type = 'sine';
    chugLfo.frequency.value = 9.5;
    chugDepth.gain.value = 0.0;

    const mainMix = ctx.createGain();
    const subMix = ctx.createGain();
    const turboMix = ctx.createGain();
    mainMix.gain.value = 0.55;
    subMix.gain.value = 0.65;
    turboMix.gain.value = 0.0;

    const engGain = ctx.createGain();
    engGain.gain.value = 0.0; // Включается плавно только когда машина на дороге

    oscMain.connect(mainMix);
    oscSub.connect(subMix);
    mainMix.connect(engFilt);
    subMix.connect(engFilt);
    engFilt.connect(engGain);

    oscTurbo.connect(turboMix);
    turboMix.connect(engGain);

    chugLfo.connect(chugDepth);
    chugDepth.connect(engGain.gain);
    engGain.connect(engineBus);

    // Непрерывный зацикленный шум для визга шин (дрифт) и шипения нитро
    const driftSrc = ctx.createBufferSource();
    driftSrc.buffer = noiseBuf;
    driftSrc.loop = true;
    const driftFilt = ctx.createBiquadFilter();
    driftFilt.type = 'bandpass';
    driftFilt.frequency.value = 1750;
    driftFilt.Q.value = 4.5;
    const driftGain = ctx.createGain();
    driftGain.gain.value = 0;
    driftSrc.connect(driftFilt);
    driftFilt.connect(driftGain);
    driftGain.connect(engineBus);

    const nitroSrc = ctx.createBufferSource();
    nitroSrc.buffer = noiseBuf;
    nitroSrc.loop = true;
    const nitroFilt = ctx.createBiquadFilter();
    nitroFilt.type = 'bandpass';
    nitroFilt.frequency.value = 950;
    nitroFilt.Q.value = 1.4;
    const nitroGain = ctx.createGain();
    nitroGain.gain.value = 0;
    nitroSrc.connect(nitroFilt);
    nitroFilt.connect(nitroGain);
    nitroGain.connect(engineBus);

    oscMain.start();
    oscSub.start();
    oscTurbo.start();
    chugLfo.start();
    driftSrc.start();
    nitroSrc.start();

    eng = {
      oscMain, oscSub, oscTurbo, engFilt, chugLfo, chugDepth,
      turboMix, engGain, driftFilt, driftGain, nitroFilt, nitroGain
    };
  }

  // Профили тембра двигателя для 5 классов кузова
  const ENGINE_PROFILES = [
    { base: 54, span: 76, filtLo: 210, filtHi: 520, turbo: 0.03 }, // I: SCOUT BUGGY (бойкий 4-цил)
    { base: 43, span: 68, filtLo: 175, filtHi: 470, turbo: 0.06 }, // II: RUST INTERCEPTOR (V8 рык)
    { base: 37, span: 58, filtLo: 155, filtHi: 410, turbo: 0.08 }, // III: VAULT ENFORCER (тяжёлый дизель)
    { base: 30, span: 48, filtLo: 135, filtHi: 370, turbo: 0.11 }, // IV: WAR RIG MK-IV (6-колёсный монстр)
    { base: 48, span: 82, filtLo: 220, filtHi: 620, turbo: 0.20 }  // V: MATRIX PHANTOM (кибер-турбина)
  ];

  function updateEngine(state) {
    if (!ctx || !eng || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (!sfxEnabled || !state || !state.active) {
      if (lastEngUpdate >= 0) {
        lastEngUpdate = -1;
        eng.engGain.gain.setTargetAtTime(0, now, 0.08);
        eng.chugDepth.gain.setTargetAtTime(0, now, 0.04);
        eng.driftGain.gain.setTargetAtTime(0, now, 0.05);
        eng.nitroGain.gain.setTargetAtTime(0, now, 0.06);
      }
      return;
    }
    // ~24 Гц достаточно для абсолютно плавного звука мотора, снижает нагрузку на Android audio-thread в 3×
    if (lastEngUpdate > 0 && now - lastEngUpdate < 0.042) return;
    lastEngUpdate = now;

    const cls = Math.max(0, Math.min(4, state.carClass || 0));
    const prof = ENGINE_PROFILES[cls];
    const ratio = Math.max(0, Math.min(1.15, state.speedRatio || 0));
    const throttle = Math.max(0, Math.min(1, state.throttle || 0));
    const drift = Math.max(0, Math.min(1, state.drift || 0));
    const nitro = Math.max(0, Math.min(1, state.nitro || 0));
    const slowMult = matrixSlow ? 0.62 : 1.0;

    // Виртуальная 4-ступенчатая коробка передач: обороты растут и мягко сбрасываются при переключении!
    let gearRpm;
    if (ratio < 0.28) gearRpm = ratio / 0.28;
    else if (ratio < 0.56) gearRpm = 0.36 + ((ratio - 0.28) / 0.28) * 0.64;
    else if (ratio < 0.82) gearRpm = 0.42 + ((ratio - 0.56) / 0.26) * 0.58;
    else gearRpm = 0.50 + Math.min(1, (ratio - 0.82) / 0.30) * 0.58;

    const loadBoost = throttle * 0.16 + nitro * 0.15;
    const mainFreq = (prof.base + (gearRpm + loadBoost) * prof.span) * slowMult;
    const subFreq = mainFreq * 0.5;
    const filtFreq = (prof.filtLo + (gearRpm * 0.65 + throttle * 0.35) * (prof.filtHi - prof.filtLo)) * (matrixSlow ? 0.55 : 1.0);

    // Тихий бархатный холостой ход (0.042), уверенный рык под газом (до 0.105)
    const targetGain = 0.042 + throttle * 0.036 + gearRpm * 0.024 + nitro * 0.015;

    eng.oscMain.frequency.setTargetAtTime(Math.max(22, mainFreq), now, 0.045);
    eng.oscSub.frequency.setTargetAtTime(Math.max(16, subFreq), now, 0.045);
    eng.engFilt.frequency.setTargetAtTime(Math.max(95, filtFreq), now, 0.05);
    eng.engGain.gain.setTargetAtTime(targetGain, now, 0.06);

    // На холостых — характерное бульканье V8, на скорости сглаживается
    eng.chugLfo.frequency.setTargetAtTime((8 + gearRpm * 14) * slowMult, now, 0.08);
    eng.chugDepth.gain.setTargetAtTime(0.012 * (1 - gearRpm * 0.65), now, 0.08);

    // Подвывание турбины (сильнее на V8 блоуэре, WAR RIG и MATRIX PHANTOM)
    const turboBoost = prof.turbo + (state.engineLvl >= 3 ? 0.06 : 0);
    eng.oscTurbo.frequency.setTargetAtTime((190 + ratio * 520 + nitro * 240) * slowMult, now, 0.06);
    eng.turboMix.gain.setTargetAtTime(turboBoost * (0.25 + ratio * 0.75), now, 0.07);

    // Визг шин в дрифте
    eng.driftFilt.frequency.setTargetAtTime((1550 + drift * 550) * slowMult, now, 0.04);
    eng.driftGain.gain.setTargetAtTime(drift > 0.08 ? drift * 0.055 : 0, now, 0.04);

    // Реактивное шипение нитро-форсажа (двигатель ур.4)
    eng.nitroFilt.frequency.setTargetAtTime((850 + ratio * 700) * slowMult, now, 0.05);
    eng.nitroGain.gain.setTargetAtTime(nitro * 0.055, now, 0.05);
  }

  // ==================== ТРЕКЕР ФОНОВОЙ KEYGEN-МУЗЫКИ (ОПТИМИЗИРОВАН ПОД ANDROID) ====================
  function playTrackerNote(midi, t, dur, type, vol, detuneCents, targetBus) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(mtof(midi), t);
    if (detuneCents) osc.detune.setValueAtTime(detuneCents, t);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0004, vol * 0.35), t + dur * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(g);
    g.connect(targetBus || musicBassBus || musicBus);
    osc.start(t);
    osc.stop(t + dur + 0.015);
  }

  function playKeygenLead(midi, t, dur, style) {
    const f = mtof(midi);
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const env = ctx.createGain();

    if (style === 'synthwave') {
      // Тёплый певучий аналоговый синт 80-х (мягкая атака + жирный хорус, совсем не чиптюн!)
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(f, t);
      osc2.frequency.setValueAtTime(f, t);
      osc1.detune.setValueAtTime(-11, t);
      osc2.detune.setValueAtTime(11, t);

      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.14, t + Math.min(0.045, dur * 0.2));
      env.gain.exponentialRampToValueAtTime(0.095, t + dur * 0.65);
      env.gain.exponentialRampToValueAtTime(0.0008, t + dur);

      osc1.connect(env);
      osc2.connect(env);
      env.connect(musicPadBus || musicBus);
    } else if (style === 'industrial') {
      // Тёмный металлический FM-колокол / техно-плак (острый удар + стеклянный обертон)
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(f, t);
      osc2.frequency.setValueAtTime(f * 2.0, t);
      osc2.detune.setValueAtTime(6, t);

      const pluckDur = Math.min(0.28, dur * 1.4);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.165, t + 0.003);
      env.gain.exponentialRampToValueAtTime(0.028, t + pluckDur * 0.45);
      env.gain.exponentialRampToValueAtTime(0.0008, t + pluckDur);

      osc1.connect(env);
      osc2.connect(env);
      env.connect(musicLeadBus || musicBus);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + pluckDur + 0.015);
      osc2.stop(t + pluckDur + 0.015);
      return;
    } else {
      // Классический 8-битный Keygen-лид (FM-01 RAZOR NEON)
      osc1.type = 'square';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(f, t);
      osc2.frequency.setValueAtTime(f, t);
      osc1.detune.setValueAtTime(-7, t);
      osc2.detune.setValueAtTime(7, t);

      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.115, t + 0.006);
      env.gain.exponentialRampToValueAtTime(0.062, t + Math.min(0.085, dur * 0.5));
      env.gain.exponentialRampToValueAtTime(0.0008, t + dur);

      osc1.connect(env);
      osc2.connect(env);
      env.connect(musicLeadBus || musicBus);
    }

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + dur + 0.02);
    osc2.stop(t + dur + 0.02);
  }

  function playSynthwavePad(chord, t, dur) {
    // Густой 3-голосный аналоговый Pad 80-х на пол-такта (через тёплую musicPadBus)
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.055, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.038, t + dur * 0.72);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    g.connect(musicPadBus || musicBus);

    const detunes = [-9, 0, 9];
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(mtof(chord[i]), t);
      o.detune.setValueAtTime(detunes[i], t);
      o.connect(g);
      o.start(t);
      o.stop(t + dur + 0.02);
    }
  }

  function playAcidBass(midi, t, dur, accent) {
    // Кислотный TB-303 бас через резонансную musicAcidBus
    const f = mtof(midi);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    if (accent) {
      osc.frequency.setValueAtTime(f * 0.94, t);
      osc.frequency.exponentialRampToValueAtTime(f, t + 0.028);
    } else {
      osc.frequency.setValueAtTime(f, t);
    }
    const peak = accent ? 0.24 : 0.175;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(peak * 0.35, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    osc.connect(g);
    g.connect(musicAcidBus || musicBassBus || musicBus);
    osc.start(t);
    osc.stop(t + dur + 0.015);
  }

  function playKeygenArp(chord, t, stepDur) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    const subStep = stepDur / 3;
    osc.frequency.setValueAtTime(mtof(chord[0]), t);
    osc.frequency.setValueAtTime(mtof(chord[1]), t + subStep);
    osc.frequency.setValueAtTime(mtof(chord[2]), t + subStep * 2);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.072, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + stepDur * 0.96);

    osc.connect(g);
    g.connect(musicArpBus || musicBus);
    osc.start(t);
    osc.stop(t + stepDur + 0.01);
  }

  function playDrumKick(t, accent, punchy) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = punchy ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(punchy ? 185 : (accent ? 160 : 145), t);
    osc.frequency.exponentialRampToValueAtTime(punchy ? 36 : 42, t + (punchy ? 0.11 : 0.095));
    g.gain.setValueAtTime(punchy ? 0.40 : (accent ? 0.34 : 0.27), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (punchy ? 0.16 : 0.125));
    osc.connect(g);
    g.connect(musicBus);
    osc.start(t);
    osc.stop(t + (punchy ? 0.17 : 0.13));
  }

  function playDrumSnare(t, accent, gated) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const g = ctx.createGain();
    const dur = gated ? 0.22 : (accent ? 0.11 : 0.065);
    g.gain.setValueAtTime(gated ? 0.28 : (accent ? 0.24 : 0.14), t);
    if (gated) {
      // Фирменный 80s Gated Reverb Snare (держит хвост, потом резко обрывается)
      g.gain.linearRampToValueAtTime(0.18, t + 0.14);
    }
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(g);
    g.connect(musicSnareBus || musicBus);
    src.start(t);
    src.stop(t + dur + 0.015);

    if (accent) {
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(gated ? 195 : 215, t);
      osc.frequency.exponentialRampToValueAtTime(gated ? 88 : 105, t + 0.06);
      og.gain.setValueAtTime(gated ? 0.18 : 0.14, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
      osc.connect(og);
      og.connect(musicBus);
      osc.start(t);
      osc.stop(t + 0.085);
    }
  }

  function playDrumHat(t, open, loud) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const dur = open ? (loud ? 0.115 : 0.085) : 0.028;
    const g = ctx.createGain();
    g.gain.setValueAtTime(open ? (loud ? 0.125 : 0.085) : 0.055, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(g);
    g.connect(musicHatBus || musicBus);
    src.start(t);
    src.stop(t + dur + 0.01);
  }

  function scheduleMusicStep(step, t, stepDur) {
    const trk = TRACKS[currentTrackIdx] || TRACKS[0];
    const bar = Math.floor(step / 16) % trk.chords.length;
    const beatStep = step % 16;
    const chord = trk.chords[bar];
    const isFillBar = (bar % 4 === 3);
    const style = trk.style;

    // 1) Бас: свой характерный инструмент под каждый жанр
    const bassOff = trk.bass[beatStep];
    if (bassOff !== -99) {
      if (style === 'synthwave') {
        // Жирный 8-дольный аналоговый Outrun-бас (пила + суб-треугольник)
        playTrackerNote(chord[3] + bassOff, t, stepDur * 1.75, 'sawtooth', 0.18, -5, musicBassBus);
        playTrackerNote(chord[3] + bassOff, t, stepDur * 1.65, 'triangle', 0.15, 0, musicBassBus);
      } else if (style === 'industrial') {
        // Кислотный TB-303 Acid-бас с акцентами на октавах!
        playAcidBass(chord[3] + bassOff, t, stepDur * 0.92, bassOff >= 12 || beatStep === 0);
      } else {
        playTrackerNote(chord[3] + bassOff, t, stepDur * 0.92, 'sawtooth', 0.19, 0, musicBassBus);
      }
    }

    // 2) Гармоническая подложка: у Keygen — арпеджио, у Synthwave — тёплый пэд 80-х, у Industrial — тёмный дрон-стаб
    if (style === 'synthwave') {
      if (beatStep === 0 || beatStep === 8) {
        playSynthwavePad(chord, t, stepDur * 7.8);
      }
    } else if (style === 'industrial') {
      // Тёмный низкий индастриал-стаб только в начале каждого 2-го такта
      if (beatStep === 0 && bar % 2 === 0) {
        playTrackerNote(chord[0] - 12, t, stepDur * 5.5, 'sawtooth', 0.085, -8, musicPadBus);
        playTrackerNote(chord[2] - 12, t, stepDur * 5.5, 'sawtooth', 0.065, 8, musicPadBus);
      }
    } else {
      const denseArp = (bar >= 4 && bar < 8) || bar >= 12;
      if (beatStep % 2 === 0 || (denseArp && beatStep % 4 === 3)) {
        playKeygenArp(chord, t, stepDur * 1.05);
      }
    }

    // 3) Ведущая мелодия (с просчётом длительности удерживаемых нот `-1`, до 10 шагов!)
    const seq = trk.lead;
    const note = seq[step % seq.length];
    if (note > 0) {
      let hold = 1;
      for (let k = 1; k < 10; k++) {
        if (seq[(step + k) % seq.length] === -1) hold++;
        else break;
      }
      playKeygenLead(note, t, stepDur * (hold * 0.95 + 0.35), style);
    }

    // 4) Совершенно разная ритмика ударных под каждый из 3 жанров!
    if (style === 'synthwave') {
      // 80-s Outrun / LinnDrum: тяжёлая бочка + огромный Gated-Reverb Snare на 4 и 12
      if (isFillBar && beatStep >= 12) {
        if (beatStep === 12) playDrumSnare(t, true, true);
        else if (beatStep === 13) playTrackerNote(55, t, 0.14, 'triangle', 0.22, 0, musicBassBus);
        else if (beatStep === 14) playTrackerNote(50, t, 0.14, 'triangle', 0.24, 0, musicBassBus);
        else if (beatStep === 15) playTrackerNote(45, t, 0.16, 'triangle', 0.26, 0, musicBassBus);
      } else {
        if (beatStep === 0 || beatStep === 8 || (beatStep === 10 && bar % 2 === 1)) {
          playDrumKick(t, true, true);
        }
        if (beatStep === 4 || beatStep === 12) {
          playDrumSnare(t, true, true);
        }
        if (beatStep % 2 === 0) {
          playDrumHat(t, beatStep === 14, false);
        }
      }
    } else if (style === 'industrial') {
      // Жёсткое клубное техно 4-на-пол (туц-тсс-туц-тсс!)
      if (isFillBar && beatStep >= 13) {
        if (beatStep === 13 || beatStep === 14) playDrumKick(t, true, true);
        else if (beatStep === 15) { playDrumKick(t, true, true); playDrumSnare(t, true, false); }
      } else {
        if (beatStep === 0 || beatStep === 4 || beatStep === 8 || beatStep === 12) {
          playDrumKick(t, true, true);
        }
        if (beatStep === 4 || beatStep === 12) {
          playDrumSnare(t, true, false);
        }
        // Фирменный громкий открытый техно-хэт на слабую долю (2, 6, 10, 14)!
        if (beatStep === 2 || beatStep === 6 || beatStep === 10 || beatStep === 14) {
          playDrumHat(t, true, true);
        } else if (beatStep % 4 === 3) {
          playDrumHat(t, false, false);
        }
      }
    } else {
      // Классический 4/4 Amiga / Cracktro драйв (FM-01 RAZOR NEON — без изменений)
      if (isFillBar && beatStep >= 12) {
        if (beatStep === 12 || beatStep === 14) playDrumSnare(t, true, false);
        else if (beatStep === 13) playTrackerNote(48, t, 0.09, 'triangle', 0.22, 0, musicBassBus);
        else if (beatStep === 15) { playDrumSnare(t, true, false); playDrumKick(t, true, false); }
      } else {
        if (beatStep === 0 || beatStep === 6 || beatStep === 8 || beatStep === 10) {
          playDrumKick(t, beatStep === 0 || beatStep === 8, false);
        }
        if (beatStep === 4 || beatStep === 12) {
          playDrumSnare(t, true, false);
        } else if (beatStep === 15 && bar % 2 === 1) {
          playDrumSnare(t, false, false);
        }
        if (beatStep % 2 === 0) {
          playDrumHat(t, beatStep === 2 || beatStep === 10, false);
        } else if (beatStep === 7 || beatStep === 15) {
          playDrumHat(t, false, false);
        }
      }
    }
  }

  function musicSchedulerTick() {
    if (!ctx || !musicPlaying || !musicEnabled) return;
    if (ctx.state !== 'running') return;

    const trk = TRACKS[currentTrackIdx] || TRACKS[0];
    const bpm = matrixSlow ? trk.slowBpm : trk.bpm;
    const stepDur = 60 / bpm / 4;
    const lookahead = 0.36;

    if (nextStepTime < ctx.currentTime - 0.06) {
      nextStepTime = ctx.currentTime + 0.04;
    }

    let safety = 0;
    while (nextStepTime < ctx.currentTime + lookahead && safety < 8) {
      scheduleMusicStep(musicStep, nextStepTime, stepDur);
      nextStepTime += stepDur;
      musicStep = (musicStep + 1) % trk.lead.length;
      safety++;
    }
  }

  function startMusic() {
    if (!musicEnabled) return;
    const c = ensure();
    if (!c) return;
    if (musicPlaying) return;
    musicPlaying = true;
    nextStepTime = c.currentTime + 0.06;
    if (!musicTimer) {
      musicTimer = setInterval(musicSchedulerTick, 55);
    }
    musicSchedulerTick();
    updateMusicBusLevel();
  }

  function stopMusic() {
    musicPlaying = false;
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function updateMusicBusLevel() {
    if (!ctx || !musicBus || !musicFilter) return;
    const now = ctx.currentTime;
    const targetGain = !musicEnabled ? 0 : (gameActive ? 0.34 : 0.16);
    const targetCutoff = matrixSlow ? 880 : (gameActive ? 14000 : 2600);
    musicBus.gain.setTargetAtTime(targetGain, now, 0.09);
    musicFilter.frequency.setTargetAtTime(targetCutoff, now, 0.10);
  }

  // ==================== БАЗОВЫЕ ХЕЛПЕРЫ ДЛЯ SFX ====================
  function sfxTone(freq, endFreq, dur, type, gainVal, delay, cutoff) {
    if (!sfxEnabled) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (endFreq && endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + dur);
    }
    g.gain.setValueAtTime(Math.max(0.0001, gainVal || 0.08), t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);

    if (cutoff) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = cutoff;
      osc.connect(f);
      f.connect(g);
    } else {
      osc.connect(g);
    }
    g.connect(sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.015);
  }

  function sfxNoise(dur, gainVal, filterFreq, filterType, endFreq, delay) {
    if (!sfxEnabled) return;
    const c = ensure();
    if (!c || !noiseBuf) return;
    const t0 = c.currentTime + (delay || 0);
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    const filt = c.createBiquadFilter();
    filt.type = filterType || 'lowpass';
    filt.frequency.setValueAtTime(filterFreq || 1100, t0);
    if (endFreq && endFreq !== filterFreq) {
      filt.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), t0 + dur);
    }
    const g = c.createGain();
    g.gain.setValueAtTime(Math.max(0.0001, gainVal || 0.12), t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.015);
  }

  // ==================== ПУБЛИЧНЫЙ API ====================
  return {
    unlock() {
      const c = ensure();
      if (c && musicEnabled && !musicPlaying) startMusic();
      return c;
    },

    setEnabled(val) {
      sfxEnabled = !!val;
      if (ctx && sfxBus && engineBus) {
        const now = ctx.currentTime;
        sfxBus.gain.setTargetAtTime(sfxEnabled ? 0.92 : 0, now, 0.04);
        engineBus.gain.setTargetAtTime(sfxEnabled ? 0.85 : 0, now, 0.04);
      }
    },
    isEnabled() { return sfxEnabled; },

    setMusicEnabled(val) {
      musicEnabled = !!val;
      if (musicEnabled) {
        if (ctx) startMusic();
      } else {
        stopMusic();
      }
      updateMusicBusLevel();
    },
    isMusicEnabled() { return musicEnabled; },

    getTrackInfo() {
      const trk = TRACKS[currentTrackIdx] || TRACKS[0];
      return {
        index: currentTrackIdx,
        count: TRACKS.length,
        id: trk.id,
        code: trk.code,
        name: trk.name,
        bpm: trk.bpm,
        style: trk.style
      };
    },

    setTrack(idx, silent) {
      const n = ((Math.floor(Number(idx) || 0) % TRACKS.length) + TRACKS.length) % TRACKS.length;
      currentTrackIdx = n;
      musicStep = 0;
      if (ctx) {
        nextStepTime = ctx.currentTime + 0.08;
        if (!silent) {
          // Короткий радио-клик переключения FM-частоты в кабине
          sfxNoise(0.055, 0.075, 2800, 'bandpass', 900);
          sfxTone(740 + n * 160, 1180 + n * 180, 0.06, 'square', 0.045, 0.02, 3200);
        }
        if (musicEnabled && !musicPlaying) startMusic();
        else if (musicPlaying) musicSchedulerTick();
      }
      return this.getTrackInfo();
    },

    nextTrack() {
      return this.setTrack((currentTrackIdx + 1) % TRACKS.length, false);
    },

    setGameState(isPlaying) {
      gameActive = !!isPlaying;
      if (!gameActive) {
        matrixSlow = false;
        updateEngine({ active: false });
      }
      if (gameActive && musicEnabled && ctx && !musicPlaying) startMusic();
      updateMusicBusLevel();
    },

    suspend() {
      updateEngine({ active: false });
      if (ctx && ctx.state === 'running' && typeof ctx.suspend === 'function') {
        try { ctx.suspend(); } catch { /* ignore */ }
      }
    },

    resume() {
      if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        try {
          ctx.resume();
          nextStepTime = ctx.currentTime + 0.04;
        } catch { /* ignore */ }
      }
      updateMusicBusLevel();
    },

    updateEngine,

    // Многоуровневая стрельба (учитывает уровень турели 1..4!)
    shoot(level) {
      const lvl = typeof level === 'number' ? level : (level ? 3 : 1);
      const jitter = 0.94 + Math.random() * 0.12;
      if (lvl >= 4) {
        // Три-плазменный комплекс: мощный футуристический разряд + суб-панч
        sfxTone(980 * jitter, 170, 0.11, 'sawtooth', 0.10, 0, 3400);
        sfxTone(1420 * jitter, 320, 0.095, 'square', 0.065, 0.012, 4200);
        sfxTone(145, 46, 0.08, 'triangle', 0.13, 0);
        sfxNoise(0.055, 0.075, 2400, 'bandpass', 600);
      } else if (lvl === 3) {
        // Сдвоенная плазма: упругий лазерно-плазменный импульс
        sfxTone(840 * jitter, 195, 0.095, 'sawtooth', 0.095, 0, 3000);
        sfxTone(1240 * jitter, 340, 0.08, 'triangle', 0.06, 0.01);
        sfxNoise(0.045, 0.055, 1900, 'bandpass', 500);
      } else if (lvl === 2) {
        // Сдвоенный тяжёлый пулемёт: двойной металлический панч + порох
        sfxTone(215 * jitter, 58, 0.08, 'sawtooth', 0.10, 0, 1400);
        sfxTone(175 * jitter, 52, 0.075, 'square', 0.07, 0.018, 1200);
        sfxNoise(0.06, 0.12, 1850, 'bandpass', 420);
      } else {
        // Одиночный крупнокалиберный пулемёт: чёткий сухой выстрел
        sfxTone(260 * jitter, 68, 0.065, 'sawtooth', 0.085, 0, 1500);
        sfxNoise(0.05, 0.10, 2100, 'bandpass', 520);
      }
    },

    // Запуск самонаводящейся ракеты (реактивный свист + тяга)
    missile(isEnemy) {
      sfxNoise(0.32, isEnemy ? 0.13 : 0.15, isEnemy ? 1200 : 1600, 'bandpass', 3600);
      sfxTone(isEnemy ? 340 : 210, isEnemy ? 140 : 620, 0.18, 'sawtooth', 0.085, 0, 2200);
      sfxTone(isEnemy ? 640 : 480, 190, 0.22, 'triangle', 0.065, 0.05);
    },

    // Попадание (игрок получил удар или попал по врагу)
    hit(isPlayer) {
      if (isPlayer) {
        sfxTone(125, 46, 0.09, 'sawtooth', 0.11, 0, 520);
        sfxNoise(0.075, 0.11, 750, 'lowpass', 220);
      } else {
        sfxTone(640 + Math.random() * 140, 220, 0.038, 'triangle', 0.065, 0);
        sfxNoise(0.03, 0.055, 2200, 'bandpass', 900);
      }
    },

    // Многослойный кинематографичный взрыв (с цифровым распадом для Матрицы!)
    explode(big, isMatrix) {
      const dur = big ? 0.56 : 0.38;
      // 1) Глубокий суб-удар
      sfxTone(big ? 115 : 105, 22, dur * 0.85, 'sine', big ? 0.24 : 0.18, 0);
      sfxTone(150, 32, dur * 0.65, 'sawtooth', big ? 0.14 : 0.10, 0, 420);
      // 2) Грохот и пламя
      sfxNoise(dur, big ? 0.24 : 0.19, big ? 950 : 750, 'lowpass', 140);
      // 3) Треск разлетающегося металла
      sfxNoise(dur * 0.55, 0.11, 2400, 'bandpass', 600, 0.03);
      // 4) Для Агентов/Карателей — цифровой глитч-распад Матрицы
      if (isMatrix) {
        sfxTone(1280, 320, 0.12, 'square', 0.075, 0.02);
        sfxTone(960, 180, 0.16, 'square', 0.065, 0.09);
      }
    },

    // Подбор лута с уникальным тембром под тип!
    pickup(type) {
      if (type === 'caps') {
        // Звон металлических крышек Fallout
        sfxTone(1180, 1520, 0.06, 'sine', 0.085, 0);
        sfxTone(1560, 2080, 0.085, 'sine', 0.075, 0.05);
      } else if (type === 'ammo') {
        // Металлический щелчок затвора / магазина
        sfxNoise(0.035, 0.09, 2600, 'bandpass', 1200, 0);
        sfxTone(320, 520, 0.05, 'square', 0.07, 0.045, 1600);
      } else if (type === 'focus') {
        // Кристаллический перелив Матрицы
        sfxTone(587, 880, 0.09, 'sine', 0.08, 0);
        sfxTone(880, 1318, 0.13, 'triangle', 0.075, 0.06);
      } else if (type === 'module') {
        // Редкий артефакт-аккорд
        sfxTone(523, 659, 0.08, 'square', 0.07, 0, 2200);
        sfxTone(659, 784, 0.08, 'square', 0.07, 0.06, 2400);
        sfxTone(784, 1046, 0.14, 'triangle', 0.085, 0.12);
      } else {
        sfxTone(520, 780, 0.07, 'sine', 0.08, 0);
        sfxTone(780, 1040, 0.10, 'sine', 0.07, 0.06);
      }
    },

    // Покупка апгрейда или нового класса машины!
    upgrade(isNewCar) {
      // Пневмогайковёрт / установка модуля
      sfxNoise(0.065, 0.10, 2300, 'bandpass', 900, 0);
      if (isNewCar) {
        // Прогазовка нового мотора + триумфальный чиптюн-аккорд!
        sfxTone(62, 168, 0.24, 'sawtooth', 0.12, 0.03, 520);
        sfxTone(168, 86, 0.22, 'sawtooth', 0.10, 0.27, 420);
        sfxTone(440, 440, 0.08, 'square', 0.075, 0.06, 2600);
        sfxTone(554, 554, 0.08, 'square', 0.075, 0.14, 2600);
        sfxTone(659, 659, 0.09, 'square', 0.08, 0.22, 2800);
        sfxTone(880, 880, 0.24, 'square', 0.09, 0.30, 3200);
      } else {
        sfxTone(349, 440, 0.075, 'square', 0.07, 0.03, 2400);
        sfxTone(440, 587, 0.08, 'square', 0.075, 0.10, 2600);
        sfxTone(587, 880, 0.14, 'triangle', 0.085, 0.17);
      }
    },

    // Победный 8-битный джингл за выполнение контракта
    missionDone() {
      const notes = [587, 698, 880, 1046, 1174]; // D5 - F5 - A5 - C6 - D6
      notes.forEach((f, i) => {
        sfxTone(f, f, i === 4 ? 0.26 : 0.085, 'square', 0.075, i * 0.08, 2800);
      });
    },

    // Вход/выход из режима Матрицы (замедляет и фильтрует музыку + киношный бас-свип!)
    matrix(on) {
      matrixSlow = !!on;
      updateMusicBusLevel();
      if (on) {
        sfxTone(440, 48, 0.34, 'sine', 0.15, 0);
        sfxTone(880, 190, 0.24, 'triangle', 0.07, 0.02);
        sfxNoise(0.22, 0.09, 2600, 'bandpass', 280);
      } else {
        sfxTone(62, 420, 0.22, 'sine', 0.11, 0);
        sfxNoise(0.14, 0.06, 400, 'bandpass', 2400);
      }
    },

    // Аутентичные сухие щелчки счётчика Гейгера Fallout
    geiger() {
      const f = 1900 + Math.random() * 1400;
      sfxTone(f, f * 0.55, 0.011, 'square', 0.05, 0);
      sfxNoise(0.012, 0.045, 4200, 'highpass');
    },

    // Металлическое столкновение машин / об стену (зависит от силы удара)
    crash(intensity) {
      const k = Math.max(0.45, Math.min(1.5, intensity || 0.85));
      sfxTone(125, 36, 0.14 * k, 'triangle', 0.14 * k, 0);
      sfxNoise(0.14 * k, 0.16 * k, 980, 'lowpass', 240);
      sfxNoise(0.09 * k, 0.09 * k, 2600, 'bandpass', 800, 0.01);
    },

    // Глоток из фляжки Убежища
    canteen() {
      sfxTone(240, 420, 0.065, 'sine', 0.055, 0);
      sfxTone(290, 480, 0.07, 'sine', 0.05, 0.08);
    },

    // Тактильный клик терминала RobCo
    uiClick() {
      sfxTone(920, 620, 0.025, 'square', 0.04, 0, 2400);
    }
  };
})();
