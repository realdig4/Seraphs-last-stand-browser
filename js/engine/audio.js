/*
 * audio.js - original synthesized sound effects and procedural music (WebAudio).
 *
 * No audio files: every effect is built from oscillators/noise with envelopes,
 * and music is generated from chord progressions by a small look-ahead
 * sequencer. Works from file:// (no fetch). The context starts on the first
 * user gesture (browser autoplay rules).
 */
'use strict';
(function (U) {
  const A = U.Audio = {
    ctx: null, master: null, sfxBus: null, musicBus: null, noiseBuf: null,
    sfxVolume: 1, musicVolume: 0.6, unlocked: false,
    music: { track: null, nextTime: 0, step: 0, timer: null, intensity: 1 },
    loops: new Map(),
    lastPlay: new Map(),
  };

  A.unlock = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = A.ctx = new AC();
    A.master = ctx.createGain(); A.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    A.master.connect(comp).connect(ctx.destination);
    A.sfxBus = ctx.createGain(); A.sfxBus.connect(A.master);
    A.musicBus = ctx.createGain(); A.musicBus.connect(A.master);
    // shared reverb for music/pads
    A.reverb = ctx.createConvolver(); A.reverb.buffer = makeImpulse(ctx, 2.4, 2.5);
    A.reverbGain = ctx.createGain(); A.reverbGain.gain.value = 0.35;
    A.reverb.connect(A.reverbGain).connect(A.master);
    const len = ctx.sampleRate * 1.5;
    A.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = A.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    A.unlocked = true;
    // Ambient: Sandstorm loops from boot (Options.ChangeVolume sets it to the SFX slider; Start sets 0.5)
    A.setLoop('ambient', 'Sandstorm', true, A.ambientVolume !== undefined ? A.ambientVolume : 1, 'sfx');
    A.applyVolumes();
    if (A.music.track) A.playMusic(A.music.track, true);
  };
  function makeImpulse(ctx, seconds, decay) {
    const n = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return buf;
  }
  A.applyVolumes = function () {
    if (A.musicEl && A.musicEl.el) A.musicEl.el.volume = A.musicVolume * A.musicEl.gain * (A.musicEl.muffled ? 0.25 : 1);
    if (A.refreshLoops) A.refreshLoops();
    if (!A.ctx) return;
    A.sfxBus.gain.setTargetAtTime(A.sfxVolume, A.ctx.currentTime, 0.02);
    A.musicBus.gain.setTargetAtTime(A.musicVolume * 0.55, A.ctx.currentTime, 0.05);
  };
  A.setVolumes = function (sfx, music) { A.sfxVolume = sfx; A.musicVolume = music; A.applyVolumes(); };

  // ---------------------------------------------------------------- building blocks
  function env(g, t, a, peak, d, sustain = 0, r = 0) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
    if (r) g.gain.exponentialRampToValueAtTime(0.0001, t + a + d + r);
  }
  function tone(type, f0, f1, dur, vol, opts = {}) {
    const ctx = A.ctx, t = (opts.at || ctx.currentTime);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    if (opts.detune) o.detune.value = opts.detune;
    env(g, t, opts.attack || 0.004, vol, dur);
    let node = o.connect(g);
    if (opts.filter) {
      const f = ctx.createBiquadFilter(); f.type = opts.filter.type || 'lowpass'; f.frequency.value = opts.filter.freq; f.Q.value = opts.filter.q || 0.7;
      node = node.connect(f);
    }
    node.connect(opts.bus || A.sfxBus);
    if (opts.reverb) node.connect(A.reverb);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function noise(dur, vol, filterType, freq, opts = {}) {
    const ctx = A.ctx, t = opts.at || ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = A.noiseBuf;
    s.playbackRate.value = opts.rate || 1;
    const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.setValueAtTime(freq, t); f.Q.value = opts.q || 1;
    if (opts.freqEnd) f.frequency.exponentialRampToValueAtTime(opts.freqEnd, t + dur);
    const g = ctx.createGain(); env(g, t, opts.attack || 0.002, vol, dur);
    s.connect(f).connect(g).connect(opts.bus || A.sfxBus);
    if (opts.reverb) g.connect(A.reverb);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  // ---------------------------------------------------------------- effects
  const R = () => 0.94 + Math.random() * 0.12;   // slight pitch variation
  const SFX = A.SFX = {
    shoot() { const p = R(); tone('triangle', 520 * p, 980 * p, 0.07, 0.16); noise(0.03, 0.05, 'highpass', 3000); },
    shootHoming() { const p = R(); tone('sine', 880 * p, 1320 * p, 0.09, 0.14); tone('sine', 1320 * p, 1760 * p, 0.06, 0.06, { at: A.ctx.currentTime + 0.03 }); },
    shootTriple() { const p = R(); for (let i = 0; i < 3; i++) tone('triangle', (480 + i * 90) * p, (900 + i * 120) * p, 0.06, 0.08, { at: A.ctx.currentTime + i * 0.012 }); },
    shootHeavy() { const p = R(); tone('sawtooth', 260 * p, 120 * p, 0.14, 0.13, { filter: { freq: 1400 } }); noise(0.08, 0.08, 'lowpass', 900); },
    shootIce() { const p = R(); tone('sine', 1400 * p, 2200 * p, 0.08, 0.1); noise(0.06, 0.05, 'highpass', 5000); },
    shootRainbow() { const p = R(); const base = [523, 659, 784][Math.floor(Math.random() * 3)]; tone('triangle', base * p, base * 1.5 * p, 0.08, 0.13); },
    hit() { noise(0.05, 0.14, 'bandpass', 1500 * R(), { q: 2 }); tone('square', 220 * R(), 140, 0.04, 0.04); },
    homingHit() { tone('sine', 1760 * R(), 1760, 0.18, 0.08, { reverb: true }); },
    explode() { noise(0.28, 0.32, 'lowpass', 1800, { freqEnd: 120 }); tone('sine', 110, 40, 0.3, 0.3); },
    projExplode() { SFX.explode(); },
    cancelHit() { noise(0.04, 0.07, 'bandpass', 2600 * R(), { q: 3 }); tone('triangle', 900 * R(), 600, 0.05, 0.04); },
    enemyShoot() { const p = R(); tone('sawtooth', 210 * p, 120 * p, 0.1, 0.08, { filter: { freq: 900 } }); noise(0.05, 0.04, 'bandpass', 700); },
    enemyDeath(v = 0) {
      const p = R(), base = [330, 262, 196][v % 3];
      tone('square', base * p, base / 3, 0.22, 0.09, { filter: { freq: 2400 } });
      noise(0.16, 0.12, 'bandpass', 900, { freqEnd: 300, q: 1.5 });
    },
    playerHit() { tone('sawtooth', 160, 60, 0.22, 0.2, { filter: { freq: 700 } }); noise(0.15, 0.16, 'lowpass', 1200, { freqEnd: 200 }); },
    jump() { tone('sine', 320 * R(), 640, 0.09, 0.08); },
    thunder() {
      noise(0.5, 0.35, 'lowpass', 3000, { freqEnd: 150 });
      for (let i = 0; i < 4; i++) noise(0.04, 0.18, 'highpass', 2500, { at: A.ctx.currentTime + Math.random() * 0.12 });
      tone('sine', 70, 35, 0.5, 0.25);
    },
    beam() { tone('sawtooth', 110, 110, 0.3, 0.06, { filter: { freq: 1600, q: 6 } }); tone('sawtooth', 111.5, 111.5, 0.3, 0.05, { filter: { freq: 1600, q: 6 } }); },
    shieldUp() { for (let i = 0; i < 4; i++) tone('sine', 600 * Math.pow(1.26, i), 600 * Math.pow(1.26, i), 0.12, 0.06, { at: A.ctx.currentTime + i * 0.04, reverb: true }); },
    shieldBreak() { noise(0.25, 0.2, 'highpass', 2500, { freqEnd: 6000 }); tone('triangle', 1400, 400, 0.2, 0.08); },
    pickup() { const t = A.ctx.currentTime; [988, 1319, 1976].forEach((f, i) => tone('sine', f, f, 0.09, 0.07, { at: t + i * 0.045, reverb: true })); },
    heal() { const t = A.ctx.currentTime; [523, 659, 784].forEach((f, i) => tone('triangle', f, f, 0.25, 0.06, { at: t + i * 0.06, reverb: true })); },
    buy() { const t = A.ctx.currentTime; tone('triangle', 1047, 1047, 0.1, 0.12, { at: t }); tone('triangle', 1568, 1568, 0.22, 0.12, { at: t + 0.07, reverb: true }); },
    uiMove() { tone('sine', 1200, 1250, 0.03, 0.035); },
    uiClick() { tone('triangle', 700, 520, 0.05, 0.08); noise(0.02, 0.04, 'highpass', 4000); },
    uiBack() { tone('triangle', 520, 380, 0.06, 0.07); },
    denied() { tone('square', 180, 150, 0.12, 0.06, { filter: { freq: 900 } }); },
    waveEnd() { const t = A.ctx.currentTime; [392, 494, 587, 784].forEach((f, i) => tone('triangle', f, f, 0.5, 0.06, { at: t + i * 0.08, reverb: true })); },
    bossAppear() { tone('sawtooth', 55, 52, 1.6, 0.2, { filter: { freq: 500 }, attack: 0.3 }); noise(1.2, 0.12, 'lowpass', 400, { attack: 0.4 }); },
    transcend() { const t = A.ctx.currentTime; [262, 330, 392, 523, 659, 784].forEach((f, i) => tone('sine', f, f, 1.4, 0.05, { at: t + i * 0.05, attack: 0.2, reverb: true })); },
    gameOver() { const t = A.ctx.currentTime; [392, 349, 311, 262].forEach((f, i) => tone('triangle', f, f * 0.98, 0.45, 0.09, { at: t + i * 0.22, reverb: true })); },
    step() { noise(0.035, 0.035, 'lowpass', 600 * R()); },
    bombBounce() { tone('sine', 180, 120, 0.08, 0.1); },
    freeze() { noise(0.2, 0.08, 'highpass', 6000); tone('sine', 2400, 1800, 0.15, 0.04); },
    revive() { const t = A.ctx.currentTime; [392, 523, 659, 784, 1047].forEach((f, i) => tone('sine', f, f, 0.6, 0.06, { at: t + i * 0.07, reverb: true })); },
  };
  // original clips (game/assets/audio) per effect name: [clip, volume]; a function picks by args.
  // Effects without a clip keep their synthesized sound.
  // volumes are the original PlayOneShot scales (SFX source volume = the SFX slider)
  const SHOT = ['projectile_launch_player', 0.2];
  const CLIPS = A.CLIPS = {
    shoot: SHOT, shootHoming: SHOT, shootTriple: SHOT, shootHeavy: SHOT, shootIce: SHOT, shootRainbow: SHOT,
    hit: ['projectile_explode', 0.6], homingHit: ['projectile_homing_hit', 0.6], cancelHit: ['projectile_hit_monster', 0.2],
    explode: ['ShieldBreak', 0.8], projExplode: ['projectile_explode', 0.6], enemyShoot: ['projectile_launch', 0.2], cannonShoot: ['SpitFireBall', 0.2],
    // EnemyStats.enemy_death: Weak_Ranged monster1, Cannon mosnter2, Weak_Melee mosnter3
    enemyDeath: (v = 0) => [['monster1_death', 'mosnter2_death', 'mosnter3_death'][v % 3], 0.5],
    playerHit: ['PlayerHit', 0.2], thunder: ['Thunderbolt', 0.25], beam: ['Beam', 0.7],
    shieldUp: ['ShieldAppear', 0.5], shieldBreak: ['ShieldBreak', 0.4], pickup: ['PickUpRelic', 0.6], heal: ['PickUpRelic', 0.6],
    uiMove: ['ButtonSelectSfx', 1], uiClick: ['ButtonClickSfx', 1], buy: ['PickUpRelic', 0.5],
    waveEnd: ['EndRound', 0.3], gameOver: ['EndRound', 0.8], transcend: ['Transcend', 0.55],
  };
  // throttled play: avoids walls of identical sounds when many things happen in one frame
  A.play = function (name, ...args) {
    if (!A.ctx || A.ctx.state !== 'running' || A.sfxVolume <= 0) return;
    const now = A.ctx.currentTime, last = A.lastPlay.get(name) || 0;
    if (now - last < 0.025) return;
    A.lastPlay.set(name, now);
    let c = CLIPS[name];
    if (typeof c === 'function') c = c(...args);
    if (c && U.Assets && U.Assets.playClip(c[0], c[1] * A.sfxVolume, 1)) return;   // clips play at pitch 1, like the original
    const f = SFX[name];
    if (f) { try { f(...args); } catch (e) { /* ignore audio errors */ } }
  };

  // ---------------------------------------------------------------- music (procedural, original)
  // Each track: tempo, scale root, chord progression (scale degrees), voices.
  const NOTE = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const MINOR = [0, 2, 3, 5, 7, 8, 10];
  const TRACKS = {
    menu: { bpm: 72, root: 50, prog: [0, 5, 3, 4], steps: 8, lead: 'bell', bass: true, drums: false, pad: 0.05 },
    shop: { bpm: 84, root: 55, prog: [0, 3, 5, 4], steps: 8, lead: 'pluck', bass: true, drums: false, pad: 0.035 },
    battle: { bpm: 126, root: 45, prog: [0, 5, 6, 4], steps: 16, lead: 'arp', bass: true, drums: true, pad: 0.03 },
    battleHard: { bpm: 142, root: 43, prog: [0, 6, 5, 4, 0, 3, 6, 4], steps: 16, lead: 'arpFast', bass: true, drums: true, pad: 0.03 },
    boss: { bpm: 150, root: 40, prog: [0, 1, 0, 6], steps: 16, lead: 'arpFast', bass: true, drums: true, pad: 0.04 },
  };
  function chordNotes(tr, degree) {
    const deg = (d) => tr.root + MINOR[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
    return [deg(degree), deg(degree + 2), deg(degree + 4)];
  }
  function schedule() {
    const m = A.music, tr = TRACKS[m.track];
    if (!tr || !A.ctx) return;
    const stepDur = 60 / tr.bpm / (tr.steps / 4);
    while (m.nextTime < A.ctx.currentTime + 0.25) {
      const t = m.nextTime, s = m.step;
      const bar = Math.floor(s / tr.steps), inBar = s % tr.steps;
      const chord = chordNotes(tr, tr.prog[bar % tr.prog.length]);
      const opt = { at: t, bus: A.musicBus };
      if (inBar === 0) {
        // pad
        for (const n of chord) tone('triangle', NOTE(n + 12), NOTE(n + 12), stepDur * tr.steps * 0.95, tr.pad, Object.assign({ attack: 0.4, reverb: true, filter: { freq: 1200 } }, opt));
      }
      if (tr.bass && (inBar % (tr.steps / 4) === 0 || (tr.drums && inBar % (tr.steps / 4) === tr.steps / 8))) {
        tone('sawtooth', NOTE(chord[0] - 12), NOTE(chord[0] - 12), stepDur * 1.6, 0.07, Object.assign({ filter: { freq: 420 } }, opt));
      }
      if (tr.lead === 'bell' && inBar % 2 === 0) {
        const n = chord[(inBar / 2) % 3] + 24;
        tone('sine', NOTE(n), NOTE(n), stepDur * 3, 0.03, Object.assign({ reverb: true }, opt));
      } else if (tr.lead === 'pluck' && inBar % 2 === 1) {
        const n = chord[(s * 7) % 3] + 24;
        tone('triangle', NOTE(n), NOTE(n), stepDur * 1.5, 0.03, Object.assign({ reverb: true }, opt));
      } else if (tr.lead === 'arp' || tr.lead === 'arpFast') {
        const pattern = tr.lead === 'arp' ? [0, 1, 2, 1] : [0, 1, 2, 3, 2, 1];
        const k = pattern[inBar % pattern.length];
        const n = (k === 3 ? chord[0] + 12 : chord[k]) + 12;
        if (tr.lead === 'arpFast' || inBar % 2 === 0) tone('square', NOTE(n), NOTE(n), stepDur * 0.9, 0.022, Object.assign({ filter: { freq: 2600 } }, opt));
      }
      if (tr.drums) {
        const q = tr.steps / 4;
        if (inBar % q === 0) { tone('sine', 120, 40, 0.18, 0.18, opt); }
        if (inBar % q === q / 2) noise(0.12, 0.07, 'bandpass', 1800, Object.assign({ q: 0.8 }, opt));
        if (inBar % 2 === 1) noise(0.03, 0.025, 'highpass', 7000, opt);
      }
      m.nextTime += stepDur;
      m.step++;
    }
  }
  // ---------------------------------------------------------------- music (original clips)
  // track -> [intro, loop]: the intro plays once, then the loop repeats (a single clip just loops).
  const MUSIC = A.MUSIC = {};
  const mus = A.musicEl = { el: null, track: null, parts: null, idx: 0, gain: 1 };
  function musicVolume() { return A.musicVolume * mus.gain * (mus.muffled ? 0.25 : 1); }
  function startPart(i) {
    if (!mus.el) {
      mus.el = new Audio();
      mus.el.addEventListener('ended', () => { if (mus.parts && mus.idx < mus.parts.length - 1) startPart(mus.idx + 1); });
      mus.el.addEventListener('error', () => { const t = mus.track; mus.track = null; mus.parts = null; if (t) { delete MUSIC[t]; A.playMusic(t, true); } });
    }
    mus.idx = i;
    mus.el.src = U.Assets.clipUrl(mus.parts[i]);
    mus.el.loop = i === mus.parts.length - 1;
    mus.el.volume = musicVolume();
    const p = mus.el.play();
    if (p && p.catch) p.catch(() => {});
  }
  function playClipMusic(track, force) {
    const def = MUSIC[track];
    if (!def || !U.Assets) return false;
    if (mus.track === track && !force && mus.el && !mus.el.paused) return true;
    A.music.track = track;           // stop the synth sequencer for this track
    mus.track = track; mus.parts = def.parts; mus.gain = def.volume || 1;
    if (A.unlocked) startPart(0);
    return true;
  }
  A.playMusic = function (track, force) {
    const m = A.music;
    if (MUSIC[track]) { if (m.timer) { clearInterval(m.timer); m.timer = null; } playClipMusic(track, force); return; }
    if (mus.el) { mus.el.pause(); mus.track = null; }
    if (m.track === track && !force && m.timer) return;
    m.track = track;
    if (!A.ctx) return;
    m.step = 0;
    m.nextTime = A.ctx.currentTime + 0.1;
    if (!m.timer) m.timer = setInterval(schedule, 50);
  };
  // every original music clip loops on its own (the Music source has loop on); 'menu' = The Last Tower
  for (const name of ['The Last Tower', 'This is the end - part 1', 'This is the end - part 2', 'Wraiths - part 1', 'Wraiths - part 2',
    'Lunar Loop - part 1', 'Lunar Loop - part 2', 'Divine Retribution - part 1', 'Divine Retribution - part 2']) MUSIC[name] = { parts: [name] };
  MUSIC.menu = MUSIC['The Last Tower'];

  // named looping sources (the original's ShopAudio, WalkAudio and Ambient AudioSources).
  // bus: 'sfx' or 'music' (which Options slider scales it).
  const loopEls = new Map();
  A.setLoop = function (key, clip, playing, volume, bus) {
    let L = loopEls.get(key);
    if (!L) {
      if (!playing) return;
      L = { el: new Audio(U.Assets.clipUrl(clip)), volume: 1, bus: 'sfx', playing: false };
      L.el.loop = true;
      loopEls.set(key, L);
    }
    if (volume !== undefined) L.volume = volume;
    if (bus) L.bus = bus;
    // these sources are Play On Awake: switching one back on restarts its clip from the start
    if (playing && !L.playing) L.restart = true;
    L.playing = !!playing;
    applyLoop(L);
  };
  function applyLoop(L) {
    L.el.volume = Math.max(0, Math.min(1, L.volume * (L.bus === 'music' ? A.musicVolume : A.sfxVolume)));
    if (L.playing && A.unlocked) {
      if (L.restart) { L.restart = false; try { L.el.currentTime = 0; } catch (e) { /* not seekable yet */ } }
      if (L.el.paused) { const p = L.el.play(); if (p && p.catch) p.catch(() => {}); }
    } else if (!L.el.paused) L.el.pause();
  }
  // AudioSource.Stop() on the SFX source: cuts every one-shot clip still playing
  A.stopSfx = function () { if (U.Assets && U.Assets.stopClips) U.Assets.stopClips(); };
  A.refreshLoops = () => { for (const L of loopEls.values()) applyLoop(L); };

  A.stopMusic = function () { A.music.track = null; if (mus.el) mus.el.pause(); mus.track = null; };
  A.setMusicMuffled = function (muffled) {
    mus.muffled = muffled;
    if (mus.el) mus.el.volume = musicVolume();
    if (!A.ctx) return;
    A.musicBus.gain.setTargetAtTime(A.musicVolume * 0.55 * (muffled ? 0.25 : 1), A.ctx.currentTime, 0.1);
  };
})(window.U);
