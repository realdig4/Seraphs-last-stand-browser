/*
 * art.js - original procedural art for the remake (no images from the original game).
 *
 * All draw functions work in the caller's current canvas space. World-object
 * functions draw in the object's local space (y up, world units *before* the
 * object's transform scale), roughly filling the object's collider. UI icon
 * functions draw in UI pixels (y down).
 */
'use strict';
(function (SLS, U) {
  const R = U.Render;
  const TAU = Math.PI * 2;
  const Art = SLS.Art = {};

  // deterministic noise for background details
  function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  // ---------------------------------------------------------------- palette
  Art.pal = {
    skyTop: '#140c2c', skyMid: '#3b1d58', skyLow: '#b0546a', horizon: '#f2a65a',
    stone: '#4a3a5c', stoneLight: '#7b6894', stoneDark: '#2a2036', trim: '#e0c27a',
    holy: '#fff3c4', gold: '#ffd36b', robe: '#f6f1ff', robeShade: '#c9bce6',
  };

  // ---------------------------------------------------------------- background (world space)
  const ruins = [];
  for (let i = 0; i < 7; i++) ruins.push({ x: -8 + i * 2.7 + hash(i) * 1.2, y: 1.2 + hash(i + 9) * 2.2, w: 0.8 + hash(i + 3) * 1.4, h: 0.5 + hash(i + 5) * 0.9, k: i });
  Art.drawBackground = function (ctx, t) {
    const hw = R.worldHalfWidth() + 0.2, top = 5.2, bot = -5.2;
    // sky
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, Art.pal.skyTop); g.addColorStop(0.45, Art.pal.skyMid); g.addColorStop(0.72, Art.pal.skyLow); g.addColorStop(0.86, Art.pal.horizon); g.addColorStop(1, '#2a1830');
    ctx.fillStyle = g;
    ctx.fillRect(-hw, bot, hw * 2, top - bot);
    // stars
    for (let i = 0; i < 90; i++) {
      const x = -hw + hash(i * 3.1) * hw * 2, y = 0.5 + hash(i * 7.7) * 4.6;
      const tw = 0.5 + 0.5 * Math.sin(t * (0.8 + hash(i) * 2) + i);
      ctx.globalAlpha = 0.25 + 0.6 * tw * (y / 5);
      ctx.fillStyle = '#fff';
      const s = 0.015 + hash(i * 1.7) * 0.025;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    // moon with halo
    R.drawGlow(ctx, 4.8, 3.3, 2.6, 'rgba(255,214,170,1)', 0.35);
    ctx.fillStyle = '#ffe9c9';
    ctx.beginPath(); ctx.arc(4.8, 3.3, 0.78, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(200,150,140,0.25)';
    ctx.beginPath(); ctx.arc(4.55, 3.45, 0.18, 0, TAU); ctx.arc(5.05, 3.05, 0.12, 0, TAU); ctx.fill();
    // far mountains
    ctx.fillStyle = '#24163a';
    ctx.beginPath(); ctx.moveTo(-hw, -1.2);
    for (let x = -hw; x <= hw + 0.5; x += 0.5) ctx.lineTo(x, -0.6 + Math.sin(x * 0.7) * 0.5 + hash(Math.floor(x * 2)) * 0.6);
    ctx.lineTo(hw, -5.2); ctx.lineTo(-hw, -5.2); ctx.closePath(); ctx.fill();
    // floating ruins (slow bob)
    for (const r of ruins) {
      const y = r.y + Math.sin(t * 0.4 + r.k) * 0.08;
      ctx.fillStyle = 'rgba(30,18,52,0.85)';
      ctx.beginPath();
      ctx.moveTo(r.x - r.w / 2, y); ctx.lineTo(r.x + r.w / 2, y); ctx.lineTo(r.x + r.w * 0.3, y - r.h); ctx.lineTo(r.x - r.w * 0.25, y - r.h * 0.8);
      ctx.closePath(); ctx.fill();
      // broken columns
      ctx.fillRect(r.x - r.w * 0.35, y, r.w * 0.12, r.h * 0.6);
      ctx.fillRect(r.x + r.w * 0.15, y, r.w * 0.12, r.h * 0.35);
    }
    // near mountains
    ctx.fillStyle = '#1a1028';
    ctx.beginPath(); ctx.moveTo(-hw, -2.2);
    for (let x = -hw; x <= hw + 0.4; x += 0.4) ctx.lineTo(x, -1.6 + Math.cos(x * 0.9 + 1) * 0.45 + hash(Math.floor(x * 3) + 40) * 0.35);
    ctx.lineTo(hw, -5.2); ctx.lineTo(-hw, -5.2); ctx.closePath(); ctx.fill();
    Art.drawArena(ctx, t);
  };

  // stepped stone arena from the ground polygon
  Art.drawArena = function (ctx) {
    const pts = SLS.F.arena.groundPolygon;
    const g = ctx.createLinearGradient(0, -1.2, 0, -5);
    g.addColorStop(0, Art.pal.stoneLight); g.addColorStop(0.3, Art.pal.stone); g.addColorStop(1, Art.pal.stoneDark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.closePath();
    ctx.fill();
    // carved block lines
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(20,12,30,0.45)';
    ctx.lineWidth = 0.025;
    for (let y = -1.2; y > -5.5; y -= 0.26) {
      ctx.beginPath(); ctx.moveTo(-9, y); ctx.lineTo(9, y); ctx.stroke();
      const row = Math.round(y * 10);
      for (let x = -9 + (row % 2 ? 0.3 : 0); x < 9; x += 0.62) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 0.26); ctx.stroke(); }
    }
    ctx.restore();
    // gold trim on walkable tops
    ctx.strokeStyle = Art.pal.trim;
    ctx.lineWidth = 0.035;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if (Math.abs(a[1] - b[1]) < 0.06 && Math.abs(a[0] - b[0]) > 0.2 && a[1] > -4.2) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    }
    ctx.stroke();
  };

  // ---------------------------------------------------------------- player
  // s: { t, walk (0..1 phase), air, hurt (0..1), alive, facing (1|-1) }
  Art.player = function (ctx, s) {
    const t = s.t || 0, bob = s.air ? 0 : Math.sin((s.walk || 0) * TAU) * 0.025;
    ctx.save();
    ctx.translate(0, -0.05 + bob);
    // wings
    const flap = Math.sin(t * (s.air ? 14 : 4)) * (s.air ? 0.25 : 0.08);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(-0.08 * side, 0.12);
      ctx.rotate(side * (0.35 + flap));
      const wg = ctx.createLinearGradient(0, 0, -0.45 * side, 0.15);
      wg.addColorStop(0, 'rgba(255,255,255,0.95)'); wg.addColorStop(1, 'rgba(200,215,255,0.55)');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-0.3 * side, 0.32, -0.46 * side, 0.18);
      ctx.quadraticCurveTo(-0.36 * side, 0.08, -0.4 * side, -0.02);
      ctx.quadraticCurveTo(-0.24 * side, -0.02, 0, -0.1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // robe
    const rg = ctx.createLinearGradient(0, 0.25, 0, -0.45);
    rg.addColorStop(0, Art.pal.robe); rg.addColorStop(1, Art.pal.robeShade);
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(-0.11, 0.2); ctx.lineTo(0.11, 0.2);
    ctx.lineTo(0.2, -0.38 + Math.sin(t * 6) * 0.01); ctx.quadraticCurveTo(0, -0.44, -0.2, -0.38);
    ctx.closePath(); ctx.fill();
    // gold belt + hem
    ctx.fillStyle = Art.pal.gold;
    ctx.fillRect(-0.13, -0.02, 0.26, 0.035);
    ctx.fillRect(-0.19, -0.39, 0.38, 0.03);
    // head
    ctx.fillStyle = '#ffe2c8';
    ctx.beginPath(); ctx.arc(0, 0.31, 0.12, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a2a4a';
    ctx.beginPath(); ctx.arc(0.045, 0.32, 0.018, 0, TAU); ctx.arc(-0.035, 0.32, 0.018, 0, TAU); ctx.fill();
    // hair
    ctx.fillStyle = '#f0d9a0';
    ctx.beginPath(); ctx.arc(0, 0.35, 0.125, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    // halo
    R.drawGlow(ctx, 0, 0.55, 0.22, 'rgba(255,230,150,1)', 0.6);
    ctx.strokeStyle = Art.pal.gold; ctx.lineWidth = 0.025;
    ctx.beginPath(); ctx.ellipse(0, 0.55 + Math.sin(t * 2) * 0.012, 0.12, 0.035, 0, 0, TAU); ctx.stroke();
    if (s.hurt > 0) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255,60,60,' + (0.6 * s.hurt) + ')';
      ctx.fillRect(-0.6, -0.6, 1.2, 1.4);
    }
    ctx.restore();
  };

  // hats (ids 200..205): drawn relative to the head top (y ~ 0.45)
  Art.hat = function (ctx, id, s = {}) {
    ctx.save();
    ctx.translate(0, 0.36 - 0.05);
    switch (id) {
      case 201: { // helmet
        ctx.fillStyle = '#9aa3b5';
        ctx.beginPath(); ctx.arc(0, 0.02, 0.15, Math.PI, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#6c7487'; ctx.fillRect(-0.16, -0.02, 0.32, 0.05);
        ctx.fillStyle = '#c94b4b'; ctx.fillRect(-0.02, 0.1, 0.04, 0.12);
        break;
      }
      case 202: { // propeller beanie
        const spin = (s.t || 0) * 20;
        ctx.fillStyle = '#e35d5d'; ctx.beginPath(); ctx.arc(0, 0.03, 0.14, Math.PI, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#4c8fe0'; ctx.beginPath(); ctx.arc(0, 0.03, 0.14, Math.PI, Math.PI * 1.33); ctx.lineTo(0, 0.03); ctx.fill();
        ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(0, 0.03, 0.14, Math.PI * 1.66, 0); ctx.lineTo(0, 0.03); ctx.fill();
        ctx.fillStyle = '#555'; ctx.fillRect(-0.008, 0.16, 0.016, 0.06);
        ctx.fillStyle = '#ddd';
        const w = Math.abs(Math.cos(spin)) * 0.16;
        ctx.fillRect(-w, 0.215, w * 2, 0.02);
        break;
      }
      case 203: { // top hat with a feather
        ctx.fillStyle = '#2b2b3a'; ctx.fillRect(-0.17, 0.0, 0.34, 0.035); ctx.fillRect(-0.1, 0.035, 0.2, 0.2);
        ctx.fillStyle = '#7d3cff'; ctx.fillRect(-0.1, 0.05, 0.2, 0.03);
        ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = 0.02;
        ctx.beginPath(); ctx.moveTo(0.08, 0.06); ctx.quadraticCurveTo(0.22, 0.2, 0.16, 0.32); ctx.stroke();
        break;
      }
      case 204: { // horned challenger crown
        ctx.fillStyle = '#c94b4b'; ctx.fillRect(-0.13, 0.0, 0.26, 0.07);
        ctx.fillStyle = '#ffd36b';
        for (const x of [-0.1, 0, 0.1]) { ctx.beginPath(); ctx.moveTo(x - 0.035, 0.07); ctx.lineTo(x, 0.16); ctx.lineTo(x + 0.035, 0.07); ctx.fill(); }
        ctx.fillStyle = '#eee';
        for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0.12 * sd, 0.04); ctx.quadraticCurveTo(0.25 * sd, 0.1, 0.22 * sd, 0.24); ctx.quadraticCurveTo(0.18 * sd, 0.12, 0.1 * sd, 0.07); ctx.fill(); }
        break;
      }
      case 205: { // fedora
        ctx.fillStyle = '#6b4a2e';
        ctx.beginPath(); ctx.ellipse(0, 0.01, 0.2, 0.035, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-0.11, 0.02); ctx.lineTo(-0.09, 0.15); ctx.quadraticCurveTo(0, 0.11, 0.09, 0.15); ctx.lineTo(0.11, 0.02); ctx.fill();
        ctx.fillStyle = '#2a1a10'; ctx.fillRect(-0.105, 0.03, 0.21, 0.03);
        break;
      }
      default: { // 200: pointed mage hat
        ctx.fillStyle = '#4b3a8f';
        ctx.beginPath(); ctx.ellipse(0, 0.0, 0.19, 0.04, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-0.11, 0.01); ctx.quadraticCurveTo(-0.02, 0.2, 0.09, 0.34); ctx.quadraticCurveTo(0.06, 0.15, 0.11, 0.01); ctx.fill();
        ctx.fillStyle = '#ffd36b';
        ctx.beginPath(); ctx.arc(-0.02, 0.1, 0.022, 0, TAU); ctx.arc(0.04, 0.18, 0.016, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  };

  // staffs (ids 300..306) drawn along +x from the hand, length ~0.6
  const STAFF_GEM = { 300: '#ffb347', 301: '#4dff88', 302: '#6ec8ff', 303: '#ff4d3d', 304: '#ffe94d', 305: '#a8f0ff', 306: null };
  Art.staffGemColor = (id, t = 0) => STAFF_GEM[id] || 'hsl(' + ((t * 120) % 360) + ',100%,65%)';
  Art.staff = function (ctx, id, s = {}) {
    const t = s.t || 0, gem = Art.staffGemColor(id, t);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 0.05;
    ctx.beginPath(); ctx.moveTo(-0.08, 0); ctx.lineTo(0.48, 0); ctx.stroke();
    ctx.strokeStyle = Art.pal.gold; ctx.lineWidth = 0.03;
    if (id === 302) { // trident prongs
      ctx.beginPath(); ctx.moveTo(0.48, 0); ctx.lineTo(0.62, 0); ctx.moveTo(0.48, -0.08); ctx.lineTo(0.48, 0.08);
      ctx.moveTo(0.48, 0.08); ctx.lineTo(0.6, 0.08); ctx.moveTo(0.48, -0.08); ctx.lineTo(0.6, -0.08); ctx.stroke();
    } else if (id === 305) { // ice tip
      ctx.fillStyle = gem; ctx.beginPath(); ctx.moveTo(0.48, 0.05); ctx.lineTo(0.66, 0); ctx.lineTo(0.48, -0.05); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(0.53, 0, 0.06, -Math.PI * 0.8, Math.PI * 0.8); ctx.stroke();
      ctx.fillStyle = gem;
      ctx.beginPath();
      if (id === 304) { ctx.moveTo(0.5, 0.06); ctx.lineTo(0.56, 0.0); ctx.lineTo(0.52, 0.0); ctx.lineTo(0.57, -0.07); ctx.lineTo(0.5, -0.005); ctx.lineTo(0.54, -0.005); }
      else ctx.arc(0.55, 0, id === 303 ? 0.055 : 0.045, 0, TAU);
      ctx.fill();
    }
    R.drawGlow(ctx, 0.56, 0, 0.16, gem.startsWith('hsl') ? 'rgba(255,255,255,1)' : gem, 0.7);
    ctx.restore();
  };

  // ---------------------------------------------------------------- enemies
  // kind: 'ranged' | 'melee' | 'cannon' | 'end'; size: 0 weak, 1 medium, 2 strong; tier: 0 base, 1 '+', 2 '++'
  const TIER_COL = [['#9b6cff', '#5a2ea6'], ['#ff5470', '#8a1630'], ['#4ff0ff', '#106a8a']];
  Art.enemy = function (ctx, e) {
    const t = e.t || 0, [glow, body] = e.kind === 'end' ? ['#ffffff', '#c8c8e8'] : TIER_COL[e.tier || 0];
    const hover = Math.sin(t * 3 + (e.seed || 0)) * 0.04;
    ctx.save();
    ctx.translate(0, hover);
    const w = e.w || 0.8, h = e.h || 1.2;
    // aura
    R.drawGlow(ctx, 0, 0, Math.max(w, h) * 0.75, glow, 0.25);
    ctx.fillStyle = body;
    if (e.kind === 'cannon') {
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.55, h * 0.42, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2a2236';
      ctx.fillRect(-w * 0.55, -h * 0.08, w * 0.4, h * 0.22); // maw facing the player side (flip handles direction)
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(-w * 0.55, h * 0.03, h * 0.07, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#d8d0e8'; ctx.lineWidth = 0.05;
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.55, h * 0.42, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    } else if (e.kind === 'melee') {
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      const spikes = 5 + (e.size || 0) * 2;
      for (let i = 0; i <= spikes; i++) {
        const a = Math.PI / 2 + (i / spikes) * TAU;
        const r = (i % 2 ? 0.32 : 0.5) * Math.min(w, h) * 1.1;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 1.2);
      }
      ctx.closePath(); ctx.fill();
      // horns
      ctx.fillStyle = '#e8dcc8';
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0.15 * sd * w, 0.3 * h); ctx.lineTo(0.42 * sd * w, 0.62 * h); ctx.lineTo(0.28 * sd * w, 0.28 * h); ctx.fill(); }
    } else {
      // wraith teardrop with tail wisps
      ctx.beginPath();
      ctx.moveTo(0, h * 0.48);
      ctx.bezierCurveTo(w * 0.62, h * 0.4, w * 0.5, -h * 0.15, w * 0.2 * Math.sin(t * 4), -h * 0.5);
      ctx.bezierCurveTo(-w * 0.5, -h * 0.15, -w * 0.62, h * 0.4, 0, h * 0.48);
      ctx.fill();
      if (e.size >= 2) { // crown spikes
        ctx.fillStyle = glow;
        for (const x of [-0.18, 0, 0.18]) { ctx.beginPath(); ctx.moveTo((x - 0.06) * w, 0.36 * h); ctx.lineTo(x * w, 0.62 * h); ctx.lineTo((x + 0.06) * w, 0.36 * h); ctx.fill(); }
      }
    }
    // eyes
    const eyes = e.kind === 'ranged' || e.kind === 'end' ? (e.size || 0) + 1 : 2;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < eyes; i++) {
      const ex = (i - (eyes - 1) / 2) * w * 0.26, ey = h * 0.12;
      R.drawGlow(ctx, ex, ey, h * 0.16, glow, 0.9);
      ctx.beginPath(); ctx.arc(ex, ey, h * 0.045, 0, TAU); ctx.fill();
    }
    if (e.hurt > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = e.hurt;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.55, h * 0.5, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    if (e.frozen) {
      ctx.globalAlpha = 0.45; ctx.fillStyle = '#a8f0ff';
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.6, h * 0.55, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  Art.boss = function (ctx, which, e) {
    const t = e.t || 0, w = e.w || 0.8, h = e.h || 0.45;
    ctx.save();
    ctx.translate(0, Math.sin(t * 1.5) * 0.03);
    if (which === 2) {
      // splitting maw: gelatinous body with many eyes
      R.drawGlow(ctx, 0, 0, w * 0.9, '#5affc8', 0.35);
      const g = ctx.createRadialGradient(0, h * 0.1, 0, 0, 0, w * 0.6);
      g.addColorStop(0, '#2fd9a0'); g.addColorStop(1, '#0d5040');
      ctx.fillStyle = g;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * TAU, r = 1 + Math.sin(a * 5 + t * 3) * 0.06;
        ctx.lineTo(Math.cos(a) * w * 0.55 * r, Math.sin(a) * h * 0.7 * r);
      }
      ctx.fill();
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) { const ex = (i - 2) * w * 0.17, ey = h * (0.15 + 0.1 * Math.sin(i * 2)); ctx.beginPath(); ctx.arc(ex, ey, h * 0.07, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#081a14';
      for (let i = 0; i < 5; i++) { const ex = (i - 2) * w * 0.17, ey = h * (0.15 + 0.1 * Math.sin(i * 2)); ctx.beginPath(); ctx.arc(ex, ey, h * 0.035, 0, TAU); ctx.fill(); }
    } else {
      // winged warden with a molten core
      for (const sd of [-1, 1]) {
        ctx.fillStyle = '#2a1640';
        ctx.beginPath(); ctx.moveTo(0.1 * sd * w, 0.1 * h);
        ctx.quadraticCurveTo(0.9 * sd * w, (0.9 + Math.sin(t * 3) * 0.2) * h, 1.0 * sd * w, -0.1 * h);
        ctx.quadraticCurveTo(0.6 * sd * w, 0.0, 0.15 * sd * w, -0.3 * h); ctx.fill();
      }
      R.drawGlow(ctx, 0, 0, w * 0.8, '#ff7a3d', 0.4);
      ctx.fillStyle = '#3a1f52';
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.42, h * 0.8, 0, 0, TAU); ctx.fill();
      const cg = ctx.createRadialGradient(0, -h * 0.1, 0, 0, -h * 0.1, h * 0.4);
      cg.addColorStop(0, '#fff2a8'); cg.addColorStop(0.5, '#ff7a3d'); cg.addColorStop(1, 'rgba(255,60,30,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, -h * 0.1, h * 0.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffe9a0';
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * w * 0.12, h * 0.35, h * 0.08, 0, TAU); ctx.fill(); }
    }
    if (e.hurt > 0) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = e.hurt * 0.8; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.6, h * 0.8, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  };

  // ---------------------------------------------------------------- projectiles & effects (local space, radius ~0.5)
  // the prefabs' SpriteRenderer.color (Projectile sprite tint), as #rrggbb
  const PROJ_COL = {
    basic: '#00f7ff',      // Projectile (0, 0.97, 1)
    homing: '#00ff4c',     // Projectile_Homing (0, 1, 0.297)
    triple: '#eaff00',     // Projectile_Triple (0.916, 1, 0)
    explosive: '#f02a03',  // ExplosiveProjectile (0.943, 0.164, 0.013)
    piercing: '#a0fcff',   // Projectile_Piercing (0.627, 0.988, 1)
    fragment: '#96ff00',   // Projectile_Fragment (0.589, 1, 0)
    friction: '#ff7500',   // FrictionProjectile (1, 0.458, 0)
    rainbow: null,
    enemy1: '#ff00df',     // EnemyProj_1 (1, 0, 0.876)
    enemy2: '#bc0b5a',     // EnemyProj_2 (0.736, 0.045, 0.352)
    enemy3: '#ec1c30',     // EnemyProj_3 (0.925, 0.109, 0.189)
    enemy4: '#a90cbc',     // EnemyProj_4 (0.663, 0.047, 0.737)
    soulOrb: '#00b6ff',    // SoulOrb (0, 0.714, 1)
    healingOrb: '#4dff00', // HealingOrb (0.302, 1, 0)
    wisp: '#b0f0ff',
  };
  Art.projColor = (kind, t) => PROJ_COL[kind] || 'hsl(' + ((t * 300) % 360) + ',100%,65%)';
  // the prefabs' "Trail" particles: [start colour, colour over lifetime at 0, at 0.66] (multiplied)
  const TRAIL_COL = {
    basic: ['#3fe6fd', '#00d8ff', '#b3e7ff'], homing: ['#6dff00', '#01ff00', '#b5ff00'], triple: ['#fdf63f', '#ccff00', '#ff8d00'],
    explosive: ['#fd873f', '#ff4600', '#ffee00'], piercing: ['#3fe6fd', '#00d8ff', '#b3e7ff'], fragment: ['#6dff00', '#70ff00', '#d3ff00'],
    friction: ['#ff6900', '#ff4200', '#fff7b3'], enemy1: ['#ffffff', '#ff00e9', '#ff005b'], enemy2: ['#ffffff', '#ff2400', '#ff2400'],
    enemy3: ['#ffffff', '#ff6f00', '#ff2400'], enemy4: ['#ffffff', '#ff2400', '#ff2400'],
  };
  const rgb01 = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  // -> { start: [r,g,b], end: [r,g,b] } in 0..1
  Art.trailColor = function (kind) {
    const t = TRAIL_COL[kind] || TRAIL_COL.basic, s = rgb01(t[0]), a = rgb01(t[1]), b = rgb01(t[2]);
    return { start: [s[0] * a[0], s[1] * a[1], s[2] * a[2]], end: [s[0] * b[0], s[1] * b[1], s[2] * b[2]] };
  };
  Art.projectile = function (ctx, kind, s = {}) {
    const col = Art.projColor(kind, s.t || 0);
    const glowCss = col.startsWith('hsl') ? col : col;
    R.drawGlow(ctx, 0, 0, 1.4, glowCss, 0.8);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, 0.32, 0, TAU); ctx.fill();
    ctx.fillStyle = col;
    ctx.globalAlpha *= 0.85;
    ctx.beginPath(); ctx.arc(0, 0, 0.48, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, 0.26, 0, TAU); ctx.fill();
  };
  Art.orb = function (ctx, kind, s = {}) {
    const col = PROJ_COL[kind] || '#fff', t = s.t || 0;
    R.drawGlow(ctx, 0, 0, 0.9 + Math.sin(t * 6) * 0.1, col, 0.9);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, 0.18, 0, TAU); ctx.fill();
    if (kind === 'healingOrb') { ctx.fillStyle = col; ctx.fillRect(-0.05, -0.16, 0.1, 0.32); ctx.fillRect(-0.16, -0.05, 0.32, 0.1); }
  };
  Art.thunderbolt = function (ctx, s = {}) {
    const len = s.len || 6, seed = Math.floor((s.t || 0) * 30);
    ctx.save();
    ctx.lineJoin = 'round';
    for (const [wd, col] of [[0.22, 'rgba(255,240,120,0.35)'], [0.09, '#fff6a0'], [0.035, '#ffffff']]) {
      ctx.strokeStyle = col; ctx.lineWidth = wd;
      ctx.beginPath(); ctx.moveTo(0, len / 2);
      for (let i = 1; i <= 10; i++) ctx.lineTo((hash(seed + i) - 0.5) * 0.35, len / 2 - (i / 10) * len);
      ctx.stroke();
    }
    ctx.restore();
  };
  Art.blackHole = function (ctx, s = {}) {
    const t = s.t || 0;
    R.drawGlow(ctx, 0, 0, 1.3, '#b04dff', 0.7);
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = 'rgba(210,140,255,' + (0.5 - i * 0.12) + ')'; ctx.lineWidth = 0.08;
      ctx.beginPath(); ctx.arc(0, 0, 0.55 + i * 0.12, t * (3 + i) + i, t * (3 + i) + i + 4); ctx.stroke();
    }
    ctx.fillStyle = '#05000a'; ctx.beginPath(); ctx.arc(0, 0, 0.42, 0, TAU); ctx.fill();
  };
  Art.bomb = function (ctx, s = {}) {
    ctx.fillStyle = '#1c1424'; ctx.beginPath(); ctx.arc(0, 0, 0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3d2c52'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 0.45, Math.sin(a) * 0.45); ctx.lineTo(Math.cos(a + 0.2) * 0.68, Math.sin(a + 0.2) * 0.68); ctx.lineTo(Math.cos(a + 0.4) * 0.45, Math.sin(a + 0.4) * 0.45); ctx.fill(); }
    const blink = (Math.sin((s.t || 0) * (s.urgency || 6)) + 1) / 2;
    R.drawGlow(ctx, 0, 0, 0.9, '#ff3d1d', 0.4 + blink * 0.6);
  };
  Art.beam = function (ctx, s = {}) { // along +x, length s.len, half-width s.w
    const len = s.len || 6, w = s.w || 0.12;
    const g = ctx.createLinearGradient(0, -w, 0, w);
    g.addColorStop(0, 'rgba(160,240,255,0)'); g.addColorStop(0.5, 'rgba(230,255,255,1)'); g.addColorStop(1, 'rgba(160,240,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, -w, len, w * 2);
  };
  Art.soulRay = function (ctx, s = {}) { // vertical pillar of light, local units
    const a = s.alpha === undefined ? 1 : s.alpha;
    const g = ctx.createLinearGradient(-0.5, 0, 0.5, 0);
    g.addColorStop(0, 'rgba(150,200,255,0)'); g.addColorStop(0.5, 'rgba(235,245,255,' + a + ')'); g.addColorStop(1, 'rgba(150,200,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-0.5, -0.5, 1, 1);
  };

  // ---------------------------------------------------------------- UI icons (pixels, y down)
  // symbol names used by items.js; each is an original glyph
  Art.icon = function (ctx, symbol, x, y, size, color = '#ffd36b') {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 100, size / 100);
    ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const star = (r1, r2, n) => { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? r2 : r1; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); };
    switch (symbol) {
      case 'heart': ctx.beginPath(); ctx.moveTo(0, 30); ctx.bezierCurveTo(-60, -10, -30, -55, 0, -22); ctx.bezierCurveTo(30, -55, 60, -10, 0, 30); ctx.fill(); break;
      case 'boot': ctx.beginPath(); ctx.moveTo(-20, -40); ctx.lineTo(10, -40); ctx.lineTo(10, 10); ctx.lineTo(40, 20); ctx.lineTo(40, 38); ctx.lineTo(-25, 38); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-35, -20); ctx.lineTo(-50, -20); ctx.moveTo(-35, 0); ctx.lineTo(-55, 0); ctx.stroke(); break;
      case 'sword': ctx.beginPath(); ctx.moveTo(-35, 35); ctx.lineTo(30, -30); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-40, 15); ctx.lineTo(-15, 40); ctx.stroke(); ctx.beginPath(); ctx.moveTo(30, -30); ctx.lineTo(42, -42); ctx.lineTo(36, -24); ctx.fill(); break;
      case 'clock': ctx.beginPath(); ctx.arc(0, 0, 40, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.moveTo(0, 0); ctx.lineTo(18, 10); ctx.stroke(); break;
      case 'shield': ctx.beginPath(); ctx.moveTo(0, -45); ctx.lineTo(38, -30); ctx.quadraticCurveTo(35, 25, 0, 45); ctx.quadraticCurveTo(-35, 25, -38, -30); ctx.closePath(); ctx.fill(); break;
      case 'bolt': ctx.beginPath(); ctx.moveTo(10, -48); ctx.lineTo(-25, 5); ctx.lineTo(0, 5); ctx.lineTo(-10, 48); ctx.lineTo(28, -8); ctx.lineTo(4, -8); ctx.closePath(); ctx.fill(); break;
      case 'orb': ctx.beginPath(); ctx.arc(0, 0, 32, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(-11, -11, 10, 0, TAU); ctx.fill(); break;
      case 'eye': ctx.beginPath(); ctx.moveTo(-48, 0); ctx.quadraticCurveTo(0, -42, 48, 0); ctx.quadraticCurveTo(0, 42, -48, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill(); break;
      case 'skull': ctx.beginPath(); ctx.arc(0, -8, 34, Math.PI * 0.85, Math.PI * 2.15); ctx.lineTo(18, 30); ctx.lineTo(-18, 30); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1a1028'; ctx.beginPath(); ctx.arc(-13, -6, 9, 0, TAU); ctx.arc(13, -6, 9, 0, TAU); ctx.fill(); break;
      case 'flame': ctx.beginPath(); ctx.moveTo(0, -48); ctx.quadraticCurveTo(38, 0, 22, 32); ctx.quadraticCurveTo(0, 50, -22, 32); ctx.quadraticCurveTo(-38, 0, 0, -48); ctx.fill(); ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(15, 15, 0, 32); ctx.quadraticCurveTo(-15, 15, 0, -10); ctx.fill(); break;
      case 'snow': for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(0, 44); ctx.moveTo(-12, -32); ctx.lineTo(0, -20); ctx.lineTo(12, -32); ctx.moveTo(-12, 32); ctx.lineTo(0, 20); ctx.lineTo(12, 32); ctx.stroke(); ctx.restore(); } break;
      case 'coin': ctx.beginPath(); ctx.arc(0, 0, 38, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1028'; ctx.font = 'bold 44px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, 3); break;
      case 'star': star(46, 20, 5); break;
      case 'crown': ctx.beginPath(); ctx.moveTo(-42, 30); ctx.lineTo(-42, -25); ctx.lineTo(-20, 0); ctx.lineTo(0, -38); ctx.lineTo(20, 0); ctx.lineTo(42, -25); ctx.lineTo(42, 30); ctx.closePath(); ctx.fill(); break;
      case 'wing': ctx.beginPath(); ctx.moveTo(-40, 30); ctx.quadraticCurveTo(-30, -40, 45, -40); ctx.quadraticCurveTo(10, -20, 20, -5); ctx.quadraticCurveTo(-5, 0, 5, 15); ctx.quadraticCurveTo(-15, 15, -40, 30); ctx.fill(); break;
      case 'moon': ctx.beginPath(); ctx.arc(0, 0, 40, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(18, -12, 34, 0, TAU); ctx.fill(); break;
      case 'drop': ctx.beginPath(); ctx.moveTo(0, -46); ctx.quadraticCurveTo(36, 10, 0, 42); ctx.quadraticCurveTo(-36, 10, 0, -46); ctx.fill(); break;
      case 'arrows': for (const dy of [-18, 18]) { ctx.beginPath(); ctx.moveTo(-40, dy); ctx.lineTo(30, dy); ctx.stroke(); ctx.beginPath(); ctx.moveTo(42, dy); ctx.lineTo(24, dy - 12); ctx.lineTo(24, dy + 12); ctx.fill(); } break;
      case 'burst': star(46, 16, 8); break;
      case 'book': ctx.fillRect(-36, -40, 72, 80); ctx.fillStyle = '#1a1028'; ctx.fillRect(-28, -32, 56, 4); ctx.fillRect(-28, -20, 56, 4); ctx.fillRect(-28, -8, 40, 4); break;
      case 'spiral': ctx.beginPath(); for (let a = 0; a < 14; a += 0.2) ctx.lineTo(Math.cos(a) * a * 3.2, Math.sin(a) * a * 3.2); ctx.stroke(); break;
      case 'fang': ctx.beginPath(); ctx.moveTo(-30, -30); ctx.lineTo(-10, 40); ctx.lineTo(0, -20); ctx.lineTo(10, 40); ctx.lineTo(30, -30); ctx.closePath(); ctx.fill(); break;
      case 'feather': ctx.beginPath(); ctx.moveTo(-35, 40); ctx.quadraticCurveTo(-30, -20, 38, -42); ctx.quadraticCurveTo(15, 10, -35, 40); ctx.fill(); break;
      case 'hourglass': ctx.beginPath(); ctx.moveTo(-30, -42); ctx.lineTo(30, -42); ctx.lineTo(0, 0); ctx.lineTo(30, 42); ctx.lineTo(-30, 42); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); break;
      case 'fist': ctx.fillRect(-30, -20, 60, 50); ctx.fillStyle = '#1a1028'; for (const xx of [-15, 0, 15]) ctx.fillRect(xx - 1, -20, 2, 22); break;
      default: ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill();
    }
    ctx.restore();
  };
})(window.SLS, window.U);
