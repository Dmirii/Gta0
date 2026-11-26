'use strict';

window.GTA0 = window.GTA0 || {};

window.GTA0.Audio = (function () {
  let ctx = null;
  let enabled = true;

  function ensure() {
    if (!enabled) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function tone(freq, endFreq, dur, type, gainVal, delay) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq && endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + dur);
    }
    g.gain.setValueAtTime(gainVal || 0.08, t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.01);
  }

  function noise(dur, gainVal, filterFreq) {
    const c = ensure();
    if (!c) return;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = filterFreq || 1100;
    const g = c.createGain();
    g.gain.setValueAtTime(gainVal || 0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(c.destination);
    src.start();
  }

  return {
    unlock: ensure,
    setEnabled(val) { enabled = !!val; },
    isEnabled() { return enabled; },
    shoot(heavy) {
      tone(heavy ? 180 : 280, 62, 0.075, 'sawtooth', heavy ? 0.09 : 0.06);
      noise(0.045, 0.06, heavy ? 900 : 1600);
    },
    missile() {
      noise(0.22, 0.11, 2200);
      tone(220, 680, 0.14, 'sawtooth', 0.06, 0);
      tone(520, 180, 0.16, 'triangle', 0.05, 0.06);
    },
    hit() {
      tone(150, 75, 0.06, 'triangle', 0.07);
    },
    explode() {
      noise(0.32, 0.16, 480);
      tone(110, 28, 0.28, 'sawtooth', 0.12);
    },
    pickup() {
      tone(520, 780, 0.07, 'sine', 0.07, 0);
      tone(780, 1040, 0.09, 'sine', 0.06, 0.06);
    },
    upgrade() {
      tone(330, 440, 0.08, 'triangle', 0.08, 0);
      tone(440, 660, 0.09, 'triangle', 0.08, 0.07);
      tone(660, 880, 0.13, 'triangle', 0.08, 0.14);
    },
    missionDone() {
      tone(440, 440, 0.08, 'square', 0.06, 0);
      tone(554, 554, 0.08, 'square', 0.06, 0.09);
      tone(659, 880, 0.18, 'square', 0.07, 0.18);
    },
    matrix(on) {
      if (on) tone(420, 120, 0.24, 'sine', 0.09);
      else tone(140, 380, 0.18, 'sine', 0.07);
    },
    geiger() {
      tone(1800 + Math.random() * 600, 900, 0.015, 'square', 0.035);
    },
    crash() {
      noise(0.09, 0.08, 650);
    }
  };
})();
