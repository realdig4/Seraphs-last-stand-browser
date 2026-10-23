/*
 * main.js - boot: engine setup, arena, then the modules' startup hooks
 * (SLS.addStartup(order, fn)), then the frame loop.
 */
'use strict';
(function (SLS, U) {
  const hooks = [];
  // order: 10 save/progression, 20 player, 30 waves, 40 shop/items, 50 hud, 60 menus, 90 tests
  SLS.addStartup = (order, fn) => hooks.push({ order, fn });

  // default cursor: a small seraph-gold reticle (Options may change SLS.cursorColor)
  SLS.cursorColor = '#ffffff';
  function drawCursor(ctx) {
    const m = U.Input.mouse;
    if (!m.inside || U.Input.lastDevice === 'gamepad') return;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.moveTo(-18, 0); ctx.lineTo(-6, 0); ctx.moveTo(18, 0); ctx.lineTo(6, 0); ctx.moveTo(0, -18); ctx.lineTo(0, -6); ctx.moveTo(0, 18); ctx.lineTo(0, 6); ctx.stroke();
    ctx.strokeStyle = SLS.cursorColor; ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  function boot() {
    const canvas = document.getElementById('game');
    U.Render.init(canvas);
    U.Input.attach(canvas);
    U.Input.defineActions(SLS.F.input);
    U.Physics2D.gravity = new U.Vector2(SLS.F.physics.gravity.x, SLS.F.physics.gravity.y);
    U.Time.fixedDeltaTime = SLS.F.physics.fixedTimestep;
    SLS.World.build();
    hooks.sort((a, b) => a.order - b.order);
    for (const h of hooks) { try { h.fn(); } catch (e) { U.reportError(e, null, 'startup hook ' + h.order); } }
    U.Render.overlayDraw = (ctx) => {
      drawCursor(ctx);
      if (SLS.Debug.fps) U.UI.text(ctx, Math.round(U.Loop.fpsAvg) + ' fps  ' + U.Loop.cpuMs.toFixed(1) + ' ms  q' + U.Render.quality, 1900, 10, { size: 20, align: 'right', color: '#7dff9a' });
    };
    document.getElementById('boot').style.display = 'none';
    canvas.focus();
    U.Loop.start();
  }
  window.addEventListener('load', boot);

  // hooks for the headless test harness (tools/harness.mjs)
  window.SLS_TEST = {
    errors: () => U.errorCount,
    state: () => ({
      wave: SLS.Game.waveManager ? SLS.Game.waveManager.wave_number : null,
      hp: SLS.Game.playerStats ? SLS.Game.playerStats.hp : null,
      enemies: U.GameObject.FindGameObjectsWithTag('Enemy').length,
      screens: U.UI.stack.map((s) => s.constructor.name),
      timeScale: U.Time.timeScale,
      fps: Math.round(U.Loop.fpsAvg),
      frameMs: +U.Loop.cpuMs.toFixed(2),   // CPU time per frame (budget at 240 Hz: 4.2 ms)
      quality: U.Render.quality,
      particles: U.Render.liveParticles,
    }),
  };
})(window.SLS, window.U);
