/*
 * ui.js - screen stack, buttons with mouse + keyboard/gamepad navigation, text.
 *
 * Coordinates are logical pixels (1920x1080, y down). Screens are pushed on a
 * stack; the top screen receives input, and screens marked `overlay` draw over
 * the ones below them. Navigation picks the nearest selectable in the pressed
 * direction, like Unity's automatic navigation.
 */
'use strict';
(function (U) {
  const { Mathf } = U;
  const UI = U.UI = {
    FONT_TITLE: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
    FONT_BODY: 'Georgia, "Times New Roman", serif',
    stack: [],
    hud: null,             // drawn under all screens while set
    layoutDirty: false,
    markLayoutDirty() { UI.layoutDirty = true; },
    pointerMode: true,     // true when the mouse was used last
    time: 0,
    theme: {
      panel: 'rgba(18,14,32,0.92)', panelBorder: '#c9a24a', text: '#f4ead2', dim: 'rgba(0,0,0,0.55)',
      button: 'rgba(40,28,64,0.95)', buttonHover: 'rgba(78,54,120,0.98)', buttonBorder: '#c9a24a', buttonDisabled: 'rgba(40,40,48,0.9)',
      accent: '#ffd36b', danger: '#ff6b6b', good: '#7dff9a',
    },
  };

  // ---------------------------------------------------------------- text
  const measureCache = new Map();
  UI.font = (size, opts = {}) => (opts.italic ? 'italic ' : '') + (opts.bold ? 'bold ' : '') + Math.round(size) + 'px ' + (opts.font || UI.FONT_BODY);
  UI.wrap = function (ctx, text, maxWidth) {
    const lines = [];
    for (const para of String(text).split('\n')) {
      if (!maxWidth) { lines.push(para); continue; }
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
      }
      lines.push(line);
    }
    return lines;
  };
  // draw text; returns the height used. opts: size, font, bold, italic, color, align, baseline,
  // maxWidth, lineHeight, outline, outlineWidth, fitHeight (shrink to fit), shadow, alpha
  UI.text = function (ctx, text, x, y, opts = {}) {
    if (text === undefined || text === null || text === '') return 0;
    let size = opts.size || 32;
    const lh = opts.lineHeight || 1.18;
    ctx.save();
    ctx.font = UI.font(size, opts);
    let lines = UI.wrap(ctx, text, opts.maxWidth);
    if (opts.fitHeight || opts.fitWidth) {
      let guard = 0;
      while (guard++ < 40 && size > 8) {
        const tooTall = opts.fitHeight && lines.length * size * lh > opts.fitHeight;
        const tooWide = opts.fitWidth && Math.max(...lines.map((l) => ctx.measureText(l).width)) > opts.fitWidth;
        if (!tooTall && !tooWide) break;
        size *= 0.92;
        ctx.font = UI.font(size, opts);
        lines = UI.wrap(ctx, text, opts.maxWidth);
      }
    }
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = 'middle';
    const total = lines.length * size * lh;
    let y0 = y;
    const vb = opts.baseline || 'top';
    if (vb === 'middle') y0 = y - total / 2;
    else if (vb === 'bottom') y0 = y - total;
    if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
    if (opts.shadow) { ctx.shadowColor = opts.shadow; ctx.shadowBlur = opts.shadowBlur || 12; }
    for (let i = 0; i < lines.length; i++) {
      const ly = y0 + (i + 0.5) * size * lh;
      if (opts.outline) {
        ctx.lineJoin = 'round';
        ctx.lineWidth = opts.outlineWidth || Math.max(2, size * 0.12);
        ctx.strokeStyle = opts.outline;
        ctx.strokeText(lines[i], x, ly);
      }
      ctx.fillStyle = opts.color || UI.theme.text;
      ctx.fillText(lines[i], x, ly);
    }
    ctx.restore();
    return total;
  };
  UI.roundRect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  UI.panel = function (ctx, x, y, w, h, opts = {}) {
    ctx.save();
    UI.roundRect(ctx, x, y, w, h, opts.radius || 18);
    ctx.fillStyle = opts.fill || UI.theme.panel;
    if (opts.glow) { ctx.shadowColor = opts.glow; ctx.shadowBlur = 24; }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = opts.border || 3;
    ctx.strokeStyle = opts.stroke || UI.theme.panelBorder;
    ctx.stroke();
    ctx.restore();
  };

  // ---------------------------------------------------------------- elements
  class Element {
    constructor(props = {}) {
      this.x = 0; this.y = 0; this.w = 100; this.h = 40; this.visible = true; this.selectable = false;
      Object.assign(this, props);
    }
    contains(px, py) { return this.visible && px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h; }
    get cx() { return this.x + this.w / 2; }
    get cy() { return this.y + this.h / 2; }
    update() { }
    draw() { }
  }
  UI.Element = Element;

  class Button extends Element {
    constructor(props = {}) {
      super(Object.assign({ selectable: true, enabled: true, label: '', size: 34, hoverT: 0 }, props));
    }
    click() {
      if (!this.enabled) { U.Audio.play('denied'); if (this.onDenied) this.onDenied(); return; }
      U.Audio.play(this.sound || 'uiClick');
      if (this.onClick) { try { this.onClick(this); } catch (e) { U.reportError(e, null, 'button ' + this.label); } }
    }
    update(dt, selected) {
      this.hoverT = Mathf.MoveTowards(this.hoverT, selected ? 1 : 0, dt * 8);
    }
    draw(ctx, selected) {
      if (this.drawCustom) { this.drawCustom(ctx, this, selected); return; }
      const t = this.hoverT;
      ctx.save();
      const scale = 1 + 0.06 * t;
      ctx.translate(this.cx, this.cy);
      ctx.scale(scale, scale);
      ctx.translate(-this.cx, -this.cy);
      UI.roundRect(ctx, this.x, this.y, this.w, this.h, this.radius || 14);
      ctx.fillStyle = !this.enabled ? UI.theme.buttonDisabled : (t > 0.01 ? UI.theme.buttonHover : (this.fill || UI.theme.button));
      if (t > 0.01) { ctx.shadowColor = this.glow || 'rgba(255,211,107,0.8)'; ctx.shadowBlur = 22 * t; }
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.enabled ? (this.stroke || UI.theme.buttonBorder) : '#555';
      ctx.stroke();
      if (this.icon) this.icon(ctx, this);
      if (this.label) UI.text(ctx, this.label, this.cx + (this.labelDx || 0), this.cy, { size: this.size, align: 'center', baseline: 'middle',
        font: this.font || UI.FONT_TITLE, bold: this.bold !== false, color: this.enabled ? (this.color || UI.theme.text) : '#888', fitWidth: this.w - 24 });
      ctx.restore();
    }
  }
  UI.Button = Button;

  class Label extends Element {
    draw(ctx) { if (this.text !== undefined) UI.text(ctx, typeof this.text === 'function' ? this.text() : this.text, this.x, this.y, this.style || {}); }
  }
  UI.Label = Label;

  // ---------------------------------------------------------------- screens
  class Screen {
    constructor() {
      this.elements = [];
      this.selected = null;
      this.overlay = false;    // draw screens below too
      this.dim = 0;            // dim alpha over screens below
      this.age = 0;
      this.blockCancel = false;
    }
    add(el) { this.elements.push(el); return el; }
    get selectables() { return this.elements.filter((e) => e.selectable && e.visible); }
    enter() { }
    exit() { }
    onCancel() { UI.pop(); U.Audio.play('uiBack'); }
    tick(dt) {
      this.age += dt;
      for (const e of this.elements) e.update(dt, e === this.selected);
      this.update(dt);
    }
    update() { }
    drawScreen(ctx) {
      if (this.dim) { ctx.fillStyle = 'rgba(0,0,0,' + this.dim + ')'; ctx.fillRect(0, 0, 1920, 1080); }
      this.drawBack(ctx);
      for (const e of this.elements) if (e.visible) e.draw(ctx, e === this.selected && (!UI.pointerMode || e._hovered || e === this.selected));
      this.drawFront(ctx);
    }
    drawBack() { }
    drawFront() { }
    select(el, silent) {
      if (el === this.selected) return;
      this.selected = el;
      if (el && !silent) U.Audio.play('uiMove');
      if (el && el.onSelect) el.onSelect(el);
    }
  }
  UI.Screen = Screen;

  UI.top = () => UI.stack[UI.stack.length - 1] || null;
  UI.push = function (s) {
    UI.stack.push(s);
    s.age = 0;
    s.enter();
    if (!s.selected && !UI.pointerMode) s.select(s.defaultSelected || s.selectables[0] || null, true);
    if (!s.selected && UI.pointerMode && s.defaultSelected) s.selected = null;
    return s;
  };
  UI.pop = function () {
    const s = UI.stack.pop();
    if (s) s.exit();
    return s;
  };
  UI.replace = function (s) { UI.pop(); return UI.push(s); };
  UI.clear = function () { while (UI.stack.length) UI.pop(); };
  UI.isOpen = (cls) => UI.stack.some((s) => s instanceof cls);

  // pick the best selectable in a direction from the current one
  function navigate(screen, dir) {
    const list = screen.selectables;
    if (!list.length) return;
    const cur = screen.selected && list.includes(screen.selected) ? screen.selected : null;
    if (!cur) { screen.select(screen.defaultSelected && list.includes(screen.defaultSelected) ? screen.defaultSelected : list[0]); return; }
    if (cur.nav) {
      const k = dir.x < 0 ? 'left' : dir.x > 0 ? 'right' : dir.y > 0 ? 'up' : 'down';
      if (cur.nav[k] !== undefined) { const t = typeof cur.nav[k] === 'function' ? cur.nav[k]() : cur.nav[k]; if (t && t.visible) screen.select(t); return; }
    }
    let best = null, bestScore = Infinity;
    const dx0 = dir.x, dy0 = -dir.y; // screen y is down
    for (const e of list) {
      if (e === cur) continue;
      const vx = e.cx - cur.cx, vy = e.cy - cur.cy;
      const along = vx * dx0 + vy * dy0;
      if (along <= 1) continue;
      const perp = Math.abs(vx * dy0 - vy * dx0);
      const score = along + perp * 2.2;
      if (score < bestScore) { bestScore = score; best = e; }
    }
    if (best) screen.select(best);
  }

  UI.update = function (dt) {
    UI.time += dt;
    const s = UI.top();
    if (UI.hud && UI.hud.tick) UI.hud.tick(dt);
    if (!s) return;
    const In = U.Input;
    // pointer
    const mx = In.mouse.x, my = In.mouse.y;
    if (In.mouse.moved || In.mouse.down.size) UI.pointerMode = true;
    let hovered = null;
    for (const e of s.selectables) { e._hovered = e.contains(mx, my); if (e._hovered) hovered = e; }
    if (UI.pointerMode && In.mouse.moved) { if (hovered) s.select(hovered); else if (s.selected && !s.keepSelection) s.selected = null; }
    if (In.mouse.down.has(0)) {
      if (hovered) { s.select(hovered, true); hovered.click(); }
      else if (s.onClickOutside) s.onClickOutside(mx, my);
    }
    if (In.mouse.wheel && s.onScroll) s.onScroll(In.mouse.wheel);
    // keyboard / gamepad
    const nav = In.uiNavigate(dt);
    if (nav && !s.captureKeys) {
      UI.pointerMode = false;
      if (s.onNavigate && s.onNavigate(nav)) { /* handled */ } else navigate(s, nav);
    }
    if (!s.captureKeys && In.uiSubmit()) {
      UI.pointerMode = false;
      if (s.selected) s.selected.click();
      else { const d = s.defaultSelected || s.selectables[0]; if (d) s.select(d); }
    }
    if (In.uiCancel() && !s.blockCancel) s.onCancel();
    if (UI.stack.includes(s)) s.tick(dt);
  };

  UI.draw = function (ctx) {
    if (UI.hud && UI.hud.visible !== false) UI.hud.draw(ctx);
    // draw from the lowest screen that is not covered by an opaque one
    let first = UI.stack.length - 1;
    while (first > 0 && UI.stack[first].overlay) first--;
    for (let i = Math.max(first, 0); i < UI.stack.length; i++) UI.stack[i].drawScreen(ctx);
  };
})(window.U);
