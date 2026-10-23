/*
 * render.js - canvas, camera, sorted world renderers, glow sprites, particles.
 *
 * Logical screen: 1920x1080, letterboxed into the window. World units map to
 * pixels through an orthographic camera (size 5 => 108 px per unit at 1080p).
 * World renderers draw in their object's local space (y up); UI draws in
 * logical pixels (y down) after the world.
 */
'use strict';
(function (U) {
  const { Vector2, Vector3, Color, Mathf } = U;

  const Render = U.Render = {
    canvas: null, ctx: null, dpr: 1, view: { x: 0, y: 0, w: 1920, h: 1080 },
    W: 1920, H: 1080,
    camera: { x: 0, y: 0, size: 5 },
    renderers: new Set(),
    particlesEnabled: true,
    bloom: true,
    shake: { t: 0, mag: 0 },
    flash: { t: 0, dur: 0, color: null },
    backgroundDraw: null,       // (ctx) in world space before renderers
    overlayDraw: null,          // (ctx) in UI space after UI
    glowCache: new Map(),
    // visual quality (set by U.Render.setQuality / the adaptive controller in loop.js; visual only)
    quality: 2,                 // 2 high, 1 medium, 0 low
    particleDensity: 1,         // emission multiplier for decorative particles
    maxParticles: 8000,         // decorative emission pauses above this many live particles
    glowMinPx: 4,               // particles smaller than this (screen px radius) draw as plain squares
    liveParticles: 0,
    pxPerUnit: 108,
  };
  const QUALITY = [
    { particleDensity: 0.35, maxParticles: 2000, glowMinPx: Infinity, bloom: false },
    { particleDensity: 0.6, maxParticles: 4000, glowMinPx: 8, bloom: true },
    { particleDensity: 1, maxParticles: 8000, glowMinPx: 4, bloom: true },
  ];
  Render.setQuality = function (q) {
    q = Math.max(0, Math.min(2, q | 0));
    Render.quality = q;
    Object.assign(Render, QUALITY[q]);
  };
  Object.defineProperty(Render, 'ppu', { get: () => Render.H / (2 * Render.camera.size) });

  Render.init = function (canvas) {
    Render.canvas = canvas;
    Render.ctx = canvas.getContext('2d');
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const ww = window.innerWidth, wh = window.innerHeight;
      canvas.width = Math.round(ww * dpr); canvas.height = Math.round(wh * dpr);
      canvas.style.width = ww + 'px'; canvas.style.height = wh + 'px';
      const s = Math.min(ww / 1920, wh / 1080);
      Render.view = { x: (ww - 1920 * s) / 2, y: (wh - 1080 * s) / 2, w: 1920 * s, h: 1080 * s };
      Render.dpr = dpr;
    };
    window.addEventListener('resize', resize);
    resize();
  };

  // ---------------- coordinate helpers
  Render.worldToScreen = function (p) {   // -> logical px (y down)
    const ppu = Render.ppu, c = Render.camera;
    return new Vector2(Render.W / 2 + (p.x - c.x) * ppu, Render.H / 2 - (p.y - c.y) * ppu);
  };
  Render.screenToWorld = function (p) {   // logical px (y down) -> world
    const ppu = Render.ppu, c = Render.camera;
    return new Vector3((p.x - Render.W / 2) / ppu + c.x, (Render.H / 2 - p.y) / ppu + c.y, 0);
  };
  Render.mouseWorld = () => Render.screenToWorld(new Vector2(U.Input.mouse.x, U.Input.mouse.y));
  Render.worldHalfWidth = () => Render.camera.size * Render.W / Render.H;

  // ---------------- glow sprites (radial gradients, cached)
  Render.glow = function (css, size = 64, hard = 0.0) {
    const key = css + '|' + size + '|' + hard;
    let c = Render.glowCache.get(key);
    if (!c) {
      if (Render.glowCache.size > 512) Render.glowCache.clear();   // bounded (dynamic colours never pile up)
      c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grd.addColorStop(0, css);
      grd.addColorStop(Math.max(0.001, hard), css);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, size, size);
      Render.glowCache.set(key, c);
    }
    return c;
  };
  // draw a glow centred at (x,y) in the current space with radius r
  Render.drawGlow = function (ctx, x, y, r, css, alpha = 1) {
    const img = Render.glow(css);
    const op = ctx.globalCompositeOperation, ga = ctx.globalAlpha;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = ga * alpha;
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
    ctx.globalCompositeOperation = op;
    ctx.globalAlpha = ga;
  };

  // ---------------- renderer components
  class Renderer2D extends U.Behaviour {
    constructor() {
      super();
      this.sortingOrder = 0;
      this.color = Color.white;
      this.visible = true;
      this._seq = 0;
    }
    onAwake() { }
    onEnableNative() { Render.renderers.add(this); this._seq = ++Renderer2D.seq; }
    onDisableNative() { Render.renderers.delete(this); }
    onDestroyNative() { Render.renderers.delete(this); }
    get isVisible() { return this.visible; }
    // override: draw in local space (y up, world units)
    drawLocal(ctx) { }
    // override for renderers that draw in world space directly (particles, lines)
    drawWorld(ctx) {
      const m = this.transform.worldMatrix;
      ctx.save();
      ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      const a = this.color.a;
      if (a < 1) ctx.globalAlpha *= Math.max(a, 0);
      this.drawLocal(ctx);
      ctx.restore();
    }
  }
  Renderer2D.seq = 0;
  U.Renderer2D = Renderer2D;

  // generic procedural renderer: draw(ctx, renderer) in local space
  class ShapeRenderer extends Renderer2D {
    constructor(draw, order = 0) { super(); this.draw = draw || null; this.sortingOrder = order; this.flipX = false; this.state = {}; }
    drawLocal(ctx) {
      if (!this.draw) return;
      if (this.flipX) ctx.scale(-1, 1);
      this.draw(ctx, this);
    }
  }
  U.ShapeRenderer = ShapeRenderer;

  // upright text at the object's position (world units)
  class WorldText extends Renderer2D {
    constructor() { super(); this.text = ''; this.size = 0.4; this.font = 'bold'; this.outline = true; this.sortingOrder = 50; }
    drawWorld(ctx) {
      if (!this.text) return;
      const p = this.transform.position, s = this.transform.lossyScale;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1, -1);
      const px = this.size * Math.abs(s.y);
      ctx.font = this.font + ' ' + px + 'px ' + U.UI.FONT_BODY;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha *= Mathf.Clamp01(this.color.a);
      if (this.outline) { ctx.lineWidth = px * 0.18; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(this.text, 0, 0); }
      ctx.fillStyle = this.color.css(1 / Math.max(this.color.a, 1e-3));
      ctx.fillText(this.text, 0, 0);
      ctx.restore();
    }
  }
  U.WorldText = WorldText;

  // dotted / solid line through world-space points
  class LineRenderer2D extends Renderer2D {
    constructor() { super(); this.positions = []; this.width = 0.05; this.dash = null; this.glowColor = null; this.sortingOrder = 5; }
    SetPosition(i, p) { this.positions[i] = new Vector3(p.x, p.y, p.z || 0); }
    get positionCount() { return this.positions.length; }
    set positionCount(n) { this.positions.length = n; for (let i = 0; i < n; i++) if (!this.positions[i]) this.positions[i] = new Vector3(); }
    drawWorld(ctx) {
      if (this.positions.length < 2) return;
      ctx.save();
      ctx.globalAlpha *= Mathf.Clamp01(this.color.a);
      ctx.strokeStyle = this.color.css(1 / Math.max(this.color.a, 1e-3));
      ctx.lineWidth = this.width;
      ctx.lineCap = 'round';
      if (this.dash) ctx.setLineDash(this.dash);
      ctx.beginPath();
      ctx.moveTo(this.positions[0].x, this.positions[0].y);
      for (let i = 1; i < this.positions.length; i++) ctx.lineTo(this.positions[i].x, this.positions[i].y);
      if (this.glowColor && Render.bloom) { ctx.shadowColor = this.glowColor; ctx.shadowBlur = 12; }
      ctx.stroke();
      ctx.restore();
    }
  }
  U.LineRenderer2D = LineRenderer2D;

  // ---------------- particles
  function rnd(r) { return Array.isArray(r) ? r[0] + Math.random() * (r[1] - r[0]) : r; }
  // Colour over lifetime is sampled in RAMP steps per colour pair: one css string and one glow sprite
  // per step, shared by every system with the same colours. Drawing a particle then needs no
  // per-particle arrays, strings or cache lookups, and the glow cache stays bounded.
  const RAMP = 16, ramps = new Map();
  function colorRamp(a, b) {
    const key = a[0] + ',' + a[1] + ',' + a[2] + '>' + b[0] + ',' + b[1] + ',' + b[2];
    let r = ramps.get(key);
    if (!r) {
      if (ramps.size > 256) ramps.clear();
      r = { css: new Array(RAMP), glow: new Array(RAMP) };
      for (let i = 0; i < RAMP; i++) {
        const t = i / (RAMP - 1), ch = (k) => Math.max(0, Math.min(255, (a[k] + (b[k] - a[k]) * t) * 255 | 0));
        r.css[i] = 'rgb(' + ch(0) + ',' + ch(1) + ',' + ch(2) + ')';
      }
      ramps.set(key, r);
    }
    return r;
  }
  const partPool = [];   // dead particle objects, reused by Emit (no garbage per particle)
  class Particles2D extends Renderer2D {
    constructor(cfg = {}) {
      super();
      this.cfg = Object.assign({
        rate: 10, bursts: [], lifetime: [0.4, 0.8], speed: [1, 2], angle: 90, spread: 360, size: [0.08, 0.14], sizeEnd: 0.2,
        colorStart: [1, 1, 1, 1], colorEnd: [1, 1, 1, 0], gravity: 0, drag: 0, shape: 'point', radius: 0, box: [0, 0],
        additive: true, world: true, max: 300, loop: true, duration: 1, playOnAwake: true, glow: true, square: false,
        spin: 0, stretch: 0, inheritVelocity: 0, decorative: true,
      }, cfg);
      this.parts = [];
      this.isPlaying = false;
      this._acc = 0;
      this._t = 0;
      this.sortingOrder = cfg.order || 10;
      this.emitting = true;
    }
    onEnableNative() { super.onEnableNative(); if (this.cfg.playOnAwake && !this._played) { this._played = true; this.Play(); } }
    Play() { this.isPlaying = true; this._t = 0; this._acc = 0; this._burstDone = new Set(); }
    Stop(clear = false) { this.isPlaying = false; if (clear) this.parts.length = 0; }
    Clear() { this.parts.length = 0; }
    get particleCount() { return this.parts.length; }
    get isAlive() { return this.isPlaying || this.parts.length > 0; }
    Emit(n) {
      const c = this.cfg;
      if (c.decorative && (!Render.particlesEnabled || Render.liveParticles >= Render.maxParticles)) return;
      const m = this.transform.worldMatrix;
      const rot = Math.atan2(m[1], m[0]);
      for (let i = 0; i < n && this.parts.length < c.max; i++) {
        let lx = 0, ly = 0;
        if (c.shape === 'circle') { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * c.radius; lx = Math.cos(a) * r; ly = Math.sin(a) * r; }
        else if (c.shape === 'ring') { const a = Math.random() * Math.PI * 2; lx = Math.cos(a) * c.radius; ly = Math.sin(a) * c.radius; }
        else if (c.shape === 'box') { lx = (Math.random() - 0.5) * c.box[0]; ly = (Math.random() - 0.5) * c.box[1]; }
        const ang = (c.angle + (Math.random() - 0.5) * c.spread) * Mathf.Deg2Rad + (c.world ? rot : 0);
        const sp = rnd(c.speed);
        let x = lx, y = ly;
        if (c.world) { [x, y] = U.applyAffine(m, lx, ly); }
        const p = partPool.pop() || {};
        p.x = x; p.y = y; p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp;
        p.life = rnd(c.lifetime); p.age = 0; p.size = rnd(c.size); p.rot = Math.random() * 6.283; p.spin = rnd(c.spin || 0);
        this.parts.push(p);
      }
    }
    tick(dt) {
      const c = this.cfg;
      if (this.isPlaying && this.emitting) {
        // decorative systems thin out when the adaptive quality lowers the density (visual only)
        const dens = c.decorative ? Render.particleDensity : 1;
        this._t += dt;
        for (const b of c.bursts) {
          if (!this._burstDone.has(b) && this._t >= (b.time || 0)) { this._burstDone.add(b); this.Emit(dens < 1 ? Math.ceil(b.count * dens) : b.count); }
        }
        this._acc += c.rate * dt * dens;
        const n = Math.floor(this._acc);
        if (n > 0) { this._acc -= n; this.Emit(n); }
        if (this._t >= c.duration) {
          if (c.loop) { this._t = 0; this._burstDone.clear(); } else this.isPlaying = false;
        }
      }
      // advance and drop dead particles in place (no new array per frame; dead ones go to the pool)
      const drag = 1 / (1 + c.drag * dt), g = c.gravity * dt, parts = this.parts;
      let w = 0;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.age += dt;
        if (p.age >= p.life) { if (partPool.length < 20000) partPool.push(p); continue; }
        p.vy += g;
        p.vx *= drag; p.vy *= drag;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.spin * dt;
        parts[w++] = p;
      }
      parts.length = w;
      Render.liveParticles += w;
      if (this._autoDestroy && !this.isAlive) U.Destroy(this.gameObject);
    }
    drawWorld(ctx) {
      const parts = this.parts;
      if (!parts.length) return;
      const c = this.cfg, a = c.colorStart, b = c.colorEnd;
      const rv = this._rv;
      if (!rv || rv[0] !== a[0] || rv[1] !== a[1] || rv[2] !== a[2] || rv[3] !== b[0] || rv[4] !== b[1] || rv[5] !== b[2]) {
        this._rv = [a[0], a[1], a[2], b[0], b[1], b[2]];
        this._ramp = colorRamp(a, b);
      }
      const ramp = this._ramp, a0 = a[3], da = b[3] - a[3], se = c.sizeEnd - 1, last = RAMP - 1;
      ctx.save();
      let px = Render.pxPerUnit;   // screen pixels per unit, to pick the cheapest look per particle
      if (!c.world) { const m = this.transform.worldMatrix; ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]); px *= Math.hypot(m[0], m[1]); }
      if (c.additive) ctx.globalCompositeOperation = 'lighter';
      const glowMin = Render.glowMinPx;
      let fillIdx = -1;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i], t = p.age / p.life;
        const s = p.size * (1 + se * t), al = a0 + da * t;
        if (s <= 0 || al <= 0.003) continue;
        ctx.globalAlpha = al > 1 ? 1 : al;
        const idx = (t * last + 0.5) | 0;
        if (c.glow && s * px >= glowMin) {
          const img = ramp.glow[idx] || (ramp.glow[idx] = Render.glow(ramp.css[idx], 32, 0.25));
          ctx.drawImage(img, p.x - s, p.y - s, s * 2, s * 2);
        } else if (c.square) {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = ramp.css[idx]; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore();
          fillIdx = -1;
        } else {
          if (idx !== fillIdx) { ctx.fillStyle = ramp.css[idx]; fillIdx = idx; }
          if (c.glow) ctx.fillRect(p.x - s * 0.55, p.y - s * 0.55, s * 1.1, s * 1.1);   // a few-pixel glow ~ its bright core
          else if (s * px < 4) ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);            // a tiny dot: a square looks the same
          else { ctx.beginPath(); ctx.arc(p.x, p.y, s / 2, 0, Math.PI * 2); ctx.fill(); }
        }
      }
      ctx.restore();
    }
  }
  U.Particles2D = Particles2D;

  // spawn a one-shot effect object that destroys itself when finished
  Render.burst = function (pos, cfg) {
    const go = new U.GameObject('fx');
    go.transform.position = pos;
    const p = go.AddComponent(Particles2D);
    Object.assign(p.cfg, { loop: false, rate: 0 }, cfg);
    if (cfg.order !== undefined) p.sortingOrder = cfg.order;
    p._autoDestroy = true;
    if (!p.isPlaying) p.Play();
    return p;
  };

  // ---------------- effects
  Render.shakeCamera = (mag, dur) => { Render.shake.mag = Math.max(Render.shake.mag, mag); Render.shake.t = Math.max(Render.shake.t, dur); };
  Render.flashScreen = (color, dur) => { Render.flash = { t: dur, dur, color }; };

  // ---------------- frame
  Render.tickParticles = function (dt) {
    Render.liveParticles = 0;
    for (const r of Render.renderers) if (r instanceof Particles2D) r.tick(dt);
  };
  Render.frame = function (dtReal) {
    const ctx = Render.ctx, cv = Render.canvas, v = Render.view, dpr = Render.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cv.width, cv.height);
    const s = v.w / 1920 * dpr;
    Render.pxPerUnit = Render.ppu * s;
    ctx.setTransform(s, 0, 0, s, v.x * dpr, v.y * dpr);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, 1920, 1080); ctx.clip();
    // world
    ctx.save();
    let sx = 0, sy = 0;
    if (Render.shake.t > 0) {
      Render.shake.t -= dtReal;
      sx = (Math.random() - 0.5) * 2 * Render.shake.mag; sy = (Math.random() - 0.5) * 2 * Render.shake.mag;
      if (Render.shake.t <= 0) Render.shake.mag = 0;
    }
    ctx.translate(Render.W / 2, Render.H / 2);
    ctx.scale(Render.ppu, -Render.ppu);
    ctx.translate(-Render.camera.x + sx, -Render.camera.y + sy);
    if (Render.backgroundDraw) { try { Render.backgroundDraw(ctx); } catch (e) { U.reportError(e, null, 'backgroundDraw'); } }
    const list = [...Render.renderers].filter((r) => r.visible && !r._destroyed && r.gameObject.activeInHierarchy);
    list.sort((a, b) => (a.sortingOrder - b.sortingOrder) || (b.transform._worldZ - a.transform._worldZ) || (a._seq - b._seq));
    for (const r of list) {
      try { r.drawWorld(ctx); } catch (e) { U.reportError(e, r, 'draw'); }
    }
    ctx.restore();
    // full-screen flash
    if (Render.flash.t > 0) {
      Render.flash.t -= dtReal;
      ctx.globalAlpha = Mathf.Clamp01(Render.flash.t / Render.flash.dur) * 0.5;
      ctx.fillStyle = Render.flash.color;
      ctx.fillRect(0, 0, 1920, 1080);
      ctx.globalAlpha = 1;
    }
    // UI
    if (U.UI) { try { U.UI.draw(ctx); } catch (e) { U.reportError(e, null, 'UI.draw'); } }
    if (Render.overlayDraw) {
      // with the hardware cursor up, the drawn reticle (main.js, gated on mouse.inside) stays hidden
      const m = U.Input && U.Input.hardwareCursor ? U.Input.mouse : null, inside = m && m.inside;
      if (m) m.inside = false;
      try { Render.overlayDraw(ctx); } catch (e) { U.reportError(e, null, 'overlayDraw'); }
      if (m) m.inside = inside;
    }
    ctx.restore();
  };
})(window.U);
