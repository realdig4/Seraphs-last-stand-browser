/*
 * assets.js - the original game's sprites, sounds and fonts (game/assets).
 *
 * Sprites come from assets/sprites/manifest.js (name -> file, size, pixels-per-unit,
 * pivot), so nothing needs fetch() and the game still runs from file://. Images load
 * in the background; until one is ready, callers fall back to the procedural art.
 * Sounds use <audio> elements for the same reason (decodeAudioData needs fetch).
 */
'use strict';
(function (U) {
  const SPR = window.SLS_SPRITES || {};
  const A = U.Assets = { images: new Map(), clips: new Map(), base: 'assets/' };

  // ---------------------------------------------------------------- sprites
  A.image = function (name) {
    let img = A.images.get(name);
    if (img === undefined) {
      const m = SPR[name];
      img = null;
      if (m) {
        img = new Image();
        img.src = A.base + 'sprites/' + m.file;
        img.decoding = 'async';
      }
      A.images.set(name, img);
    }
    return img && img.complete && img.naturalWidth ? img : null;
  };
  A.meta = (name) => SPR[name] || null;
  A.has = (name) => !!A.image(name);
  A.preload = function (names) { for (const n of names || Object.keys(SPR)) A.image(n); };

  // Draw a sprite in world space (y up) like a Unity SpriteRenderer: the pivot at the
  // origin, 1 unit = ppu pixels. opts: scale, flipX, flipY, alpha, smooth.
  // Returns false when the sprite is not loaded (caller draws its fallback).
  A.drawSprite = function (ctx, name, opts) {
    const img = A.image(name);
    if (!img) return false;
    const m = SPR[name], o = opts || {};
    const k = (o.scale || 1) / m.ppu, w = m.w * k, h = m.h * k;
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.imageSmoothingEnabled = !!o.smooth;
    ctx.scale(o.flipX ? -1 : 1, o.flipY ? 1 : -1);   // canvas images are y-down
    ctx.drawImage(img, -m.px * w, -(1 - m.py) * h, w, h);
    ctx.restore();
    return true;
  };

  // Same, but fitted into a UI box (pixels, y down), keeping the aspect ratio.
  A.drawSpriteUI = function (ctx, name, cx, cy, size, opts) {
    const img = A.image(name);
    if (!img) return false;
    const o = opts || {}, m = SPR[name], k = size / Math.max(m.w, m.h);
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.imageSmoothingEnabled = o.smooth !== undefined ? o.smooth : Math.max(m.w, m.h) > 128;
    ctx.drawImage(img, cx - m.w * k / 2, cy - m.h * k / 2, m.w * k, m.h * k);
    ctx.restore();
    return true;
  };

  // Tinted copy of a sprite (white sprites coloured like SpriteRenderer.color), cached per colour.
  const tintCache = new Map();
  A.tinted = function (name, css) {
    const img = A.image(name);
    if (!img) return null;
    const key = name + '|' + css;
    let c = tintCache.get(key);
    if (!c) {
      c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = css; g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'destination-in';
      g.drawImage(img, 0, 0);
      tintCache.set(key, c);
    }
    return c;
  };
  A.drawTinted = function (ctx, name, css, opts) {
    const c = A.tinted(name, css);
    if (!c) return false;
    const m = SPR[name], o = opts || {};
    const k = (o.scale || 1) / m.ppu, w = m.w * k, h = m.h * k;
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.imageSmoothingEnabled = !!o.smooth;
    ctx.scale(o.flipX ? -1 : 1, -1);
    ctx.drawImage(c, -m.px * w, -(1 - m.py) * h, w, h);
    ctx.restore();
    return true;
  };

  // ---------------------------------------------------------------- audio clips
  // A small pool of <audio> elements per clip so rapid one-shots can overlap.
  const POOL = 5, MAX_VOICES = 24, REPEAT_MS = 30;
  A.clipUrl = (name) => A.base + 'audio/' + encodeURIComponent(name) + '.ogg';
  A.clip = function (name) {
    let c = A.clips.get(name);
    if (!c) {
      c = { pool: [], next: 0, ok: true, last: 0 };
      for (let i = 0; i < POOL; i++) {
        const el = new Audio();
        el.preload = 'auto';
        el.src = A.clipUrl(name);
        el.addEventListener('error', () => { c.ok = false; });
        c.pool.push(el);
      }
      A.clips.set(name, c);
    }
    return c.ok ? c : null;
  };
  A.stopClips = function () {
    for (const c of A.clips.values()) {
      for (const el of c.pool) if (!el.paused) { el.pause(); try { el.currentTime = 0; } catch (e) { /* ignore */ } }
    }
  };
  function voices() {
    let n = 0;
    for (const c of A.clips.values()) for (const el of c.pool) if (!el.paused) n++;
    return n;
  }
  // Seeking a playing <audio> element is the slow, latency-adding part of clip playback, so a play
  // takes an idle element first (an ended element restarts from 0 on play() by itself) and only
  // rewinds a busy one when the whole pool is in use. A repeat of the same clip within REPEAT_MS is
  // skipped (inaudible), and at most MAX_VOICES clip elements sound at once. Returns true when the
  // sound was handled (played or deliberately skipped), false when the clip is unavailable.
  A.playClip = function (name, volume, pitch) {
    const c = A.clip(name);
    if (!c) return false;
    const now = performance.now();
    if (now - c.last < REPEAT_MS) return true;
    let el = null;
    for (const e of c.pool) if (e.paused) { el = e; break; }
    if (!el) {
      if (voices() >= MAX_VOICES) return true;
      el = c.pool[c.next];
      c.next = (c.next + 1) % c.pool.length;
    } else if (voices() >= MAX_VOICES) return true;
    c.last = now;
    try {
      if (!el.paused) el.currentTime = 0;                  // busy element: rewind
      el.volume = Math.max(0, Math.min(1, volume));
      const rate = pitch || 1;
      if (el.playbackRate !== rate) { el.preservesPitch = false; el.playbackRate = rate; }
      const p = el.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) { return false; }
    return true;
  };
})(window.U);
