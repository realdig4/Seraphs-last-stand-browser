/*
 * loop.js - frame loop with Unity's execution order.
 *
 *  input -> [fixed steps: Start, FixedUpdate, physics, WaitForFixedUpdate]
 *        -> Start, Update, Invoke, coroutines, LateUpdate
 *        -> particles, UI, render -> WaitForEndOfFrame -> deferred Destroy
 *
 * Time.timeScale scales deltaTime and the fixed-step clock; at timeScale 0 no
 * fixed steps run (Unity behaviour). UI uses unscaled time.
 */
'use strict';
(function (U) {
  const { Time, Lifecycle, Input } = U;
  const Loop = U.Loop = { running: false, acc: 0, last: 0, onFrame: [], fpsAvg: 60, cpuMs: 0, speed: 1 };

  // ---------------- render interpolation
  // Objects move in fixed 0.02 s steps (FixedUpdate + physics), so on a 120/144/240 Hz screen most
  // rendered frames would show the same poses (50 Hz motion). For drawing only, every root object
  // that moved during the fixed steps is placed between its pose at the start of the last step and
  // its current pose (alpha = time accumulated towards the next step), then put back right after the
  // frame is drawn: game logic never sees the drawn pose. Objects moved outside the fixed steps
  // (Update/LateUpdate, already smooth) and teleports are left alone.
  const Interp = Loop.interp = { enabled: true, step: 0, saved: [] };
  const zAngle = (q) => 2 * Math.atan2(q.z, q.w);   // root rotations are about z only
  Interp.snapshot = function () {                   // start of a fixed step, before FixedUpdate
    const s = ++Interp.step;
    for (const go of U.World.roots) {
      if (!go._activeSelf) continue;
      const t = go.transform;
      t._ipS = s; t._ipX = t._lp.x; t._ipY = t._lp.y; t._ipQ = t._lr;
    }
  };
  Interp.markEnd = function () {                    // after the frame's last fixed step
    const s = Interp.step;
    for (const go of U.World.roots) {
      const t = go.transform;
      if (t._ipS !== s) continue;
      t._ieS = s; t._ieX = t._lp.x; t._ieY = t._lp.y; t._ieQ = t._lr;
    }
  };
  Interp.apply = function (alpha) {
    const saved = Interp.saved;
    saved.length = 0;
    if (!Interp.enabled || alpha >= 1) return;
    const s = Interp.step, k = alpha - 1;
    for (const go of U.World.roots) {
      const t = go.transform;
      if (t._ieS !== s || t._ipS !== s || !go._activeSelf) continue;
      const lp = t._lp, lr = t._lr, pq = t._ipQ;
      if (lp.x !== t._ieX || lp.y !== t._ieY || lr !== t._ieQ) continue;   // moved after the fixed steps
      const dx = lp.x - t._ipX, dy = lp.y - t._ipY;
      let dr = 0;
      if (lr !== pq && !lr.x && !lr.y && !pq.x && !pq.y) {
        dr = zAngle(lr) - zAngle(pq);
        if (dr > Math.PI) dr -= 2 * Math.PI; else if (dr < -Math.PI) dr += 2 * Math.PI;
      }
      if (dx === 0 && dy === 0 && dr === 0) continue;
      if (dx * dx + dy * dy > 9) continue;          // teleport / respawn
      saved.push(t, lp, lr);
      t._lp = new U.Vector3(lp.x + dx * k, lp.y + dy * k, lp.z);
      if (dr !== 0) { const a = (zAngle(lr) + dr * k) / 2; t._lr = new U.Quaternion(0, 0, Math.sin(a), Math.cos(a)); }
      t._forceDirty();
    }
  };
  Interp.restore = function () {
    const saved = Interp.saved;
    for (let i = 0; i < saved.length; i += 3) {
      const t = saved[i];
      t._lp = saved[i + 1]; t._lr = saved[i + 2];
      t._forceDirty();
    }
    saved.length = 0;
  };

  Loop.step = function (realDt) {
    realDt = Math.min(Math.max(realDt, 0), 0.25);
    Time.unscaledDeltaTime = realDt;
    Time.unscaledTime += realDt;
    Time.realtimeSinceStartup += realDt;
    // Loop.speed (1x/2x/3x, a remake-only option) runs more game time per real second: fixed steps,
    // timers and particles all scale together, so gameplay is unchanged, only faster. Pauses still
    // freeze the game (timeScale 0), and UI/audio keep real time.
    const dt = Math.min(realDt, Time.maximumDeltaTime) * Time.timeScale * Loop.speed;
    Input.pollGamepad();
    Input.updateActions();
    // fixed steps
    Loop.acc += dt;
    let steps = 0;
    while (Loop.acc >= Time.fixedDeltaTime && steps < 12) {
      Interp.snapshot();
      Time.inFixedStep = true;
      Time.deltaTime = Time.fixedDeltaTime;
      Time.fixedTime += Time.fixedDeltaTime;
      Lifecycle.runStarts();
      Lifecycle.forEachLive('FixedUpdate', (c) => Lifecycle.call(c, 'FixedUpdate'));
      U.Physics2D.step(Time.fixedDeltaTime);
      Lifecycle.tickCoroutines('fixed');
      U.flushDestroys();
      Loop.acc -= Time.fixedDeltaTime;
      steps++;
    }
    if (steps >= 12) Loop.acc = 0;
    if (steps > 0) Interp.markEnd();
    Time.inFixedStep = false;
    // variable update
    Time.deltaTime = dt;
    Time.time += dt;
    Lifecycle.runStarts();
    Lifecycle.forEachLive('Update', (c) => Lifecycle.call(c, 'Update'));
    Lifecycle.tickInvokes();
    Lifecycle.tickCoroutines('update');
    Lifecycle.forEachLive('LateUpdate', (c) => Lifecycle.call(c, 'LateUpdate'));
    for (const f of Loop.onFrame) { try { f(dt, realDt); } catch (e) { U.reportError(e, null, 'onFrame'); } }
    U.Render.tickParticles(dt);
    U.UI.update(realDt);
    // draw moving bodies between their last two fixed-step poses (smooth at any refresh rate)
    Interp.apply(Time.timeScale > 0 ? Math.min(Loop.acc / Time.fixedDeltaTime, 1) : 1);
    try { U.Render.frame(realDt); } finally { Interp.restore(); }
    Lifecycle.tickCoroutines('eof');
    U.flushDestroys();
    Input.endFrame();
    Time.frameCount++;
  };

  // ---------------- adaptive quality (visual only)
  // The display's frame time is learned from the fastest steady frame intervals (light scenes run at
  // the monitor's rate: 16.7 ms at 60 Hz, 4.2 ms at 240 Hz). Each second: if frames are being missed,
  // drop one quality step (fewer decorative particles, no glow sprites); after a few comfortable
  // seconds, raise it again. ?quality=high|medium|low pins a level.
  const Q = Loop.quality = { auto: true, refreshMs: 1000, win: [], winT: 0, winCpu: 0, winN: 0, good: 0 };
  (function () {
    const m = /[?&]quality=(high|medium|low)\b/.exec(location.search);
    if (m) { Q.auto = false; U.Render.setQuality({ low: 0, medium: 1, high: 2 }[m[1]]); }
  })();
  function adaptQuality(dtMs, cpuMs) {
    if (dtMs <= 0 || dtMs > 250) return;            // hidden tab / hitch: no information
    Q.win.push(dtMs);
    if (Q.win.length >= 30) {                       // median of 30 intervals: robust refresh estimate
      const s = Q.win.slice().sort((a, b) => a - b), med = s[15];
      if (med >= 2.5) Q.refreshMs = Math.min(Q.refreshMs, med);
      Q.win.length = 0;
    }
    Q.winT += dtMs; Q.winCpu += cpuMs; Q.winN++;
    if (Q.winT < 1000 || !Q.auto) return;
    const interval = Q.winT / Q.winN, cpu = Q.winCpu / Q.winN, r = Q.refreshMs;
    Q.winT = Q.winCpu = Q.winN = 0;
    const R = U.Render;
    if (interval > r * 1.25 && R.quality > 0) { R.setQuality(R.quality - 1); Q.good = 0; }
    else if (interval <= r * 1.1 && cpu < r * 0.5) { if (++Q.good >= 3 && R.quality < 2) { R.setQuality(R.quality + 1); Q.good = 0; } }
    else Q.good = 0;
  }

  Loop.start = function () {
    Loop.running = true;
    Loop.last = performance.now();
    const frame = (now) => {
      if (!Loop.running) return;
      const realDt = (now - Loop.last) / 1000;
      Loop.last = now;
      if (realDt > 0) Loop.fpsAvg = Loop.fpsAvg * 0.95 + (1 / realDt) * 0.05;
      // requestAnimationFrame runs at the monitor's refresh rate (60/144/240 Hz): no frame cap here
      requestAnimationFrame(frame);
      const t0 = performance.now();
      try { Loop.step(realDt); } catch (e) { U.reportError(e, null, 'frame'); }
      const cpu = performance.now() - t0;
      Loop.cpuMs = Loop.cpuMs * 0.95 + cpu * 0.05;   // CPU time per frame
      adaptQuality(realDt * 1000, cpu);
    };
    requestAnimationFrame(frame);
  };
})(window.U);
