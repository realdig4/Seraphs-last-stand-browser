/*
 * hud.js - the in-run HUD (startup order 50): HP bar + HP text, wave counter, soul counter,
 * auto-attack indicator, boss name + HP bar. Implements SLS.UIHooks.showBoss / hideBoss /
 * setAutoAttackIcon.
 *
 * What the original showed, and who wrote it (see docs/ARCHITECTURE.md and the analysis chapters):
 *  - PlayerStats.CheckHP: HP slider + "RoundToInt(hp)/RoundToInt(max_hp)" every frame while
 *    isAlive (so the values freeze at death).
 *  - WaveManager.wave_number_text: the wave counter shows what WaveManager last wrote there, not the
 *    live wave_number. StartGame writes the new wave_number, CheckWaveEnd the pre-increment one and
 *    StartWave nothing, so the counter reads N in the shop after wave N and N-1 during wave N >= 2.
 *  - ProgresisonManager.soul_counter: soul_orbs, every frame.
 *  - PlayerController.ToggleAutoAttack: shows/hides autoattack_icon (visible only while on).
 *  - WaveManager.InvokeBoss shows the boss name + slider; WaveManager.FixedUpdate keeps the slider
 *    on EnemyStats.hp/max_hp and hides the boss UI as soon as the boss object is gone.
 *  - WaveManager.enemy_count exists but the original code never writes it, so the enemies-alive
 *    count is not part of the HUD (it only appears with ?fps, as a debug readout).
 * The HUD is drawn only during a run (wave_number > 0). All drawing is original.
 */
'use strict';
(function (SLS, U) {
  const UI = U.UI;
  const { Mathf } = U;
  const GOLD = '#ffd36b', GOLD_DIM = '#c9a24a', INK = '#f4ead2', SOUL = '#9fd8ff';

  SLS.addStrings('en', { 'hud.autoattack.pad': 'Auto-attack (Y)', 'hud.speed.key': 'F', 'hud.speed.pad': 'Select' });
  SLS.addStrings('pt', { 'hud.autoattack.pad': 'Ataque automático (Y)', 'hud.speed.key': 'F', 'hud.speed.pad': 'Select' });

  // ---------------------------------------------------------------- game speed (remake-only extra)
  // 1x / 2x / 3x runs more game time per real second (U.Loop.speed): fixed steps, timers and spawns
  // all scale together, so the game plays the same, only faster. F, the gamepad's Select button or a
  // click on the HUD badge cycles it during a run; the choice is saved (key "game_speed").
  const SPEEDS = [1, 2, 3];
  const Speed = SLS.GameSpeed = {
    get value() { return U.Loop.speed; },
    set(v) {
      v = SPEEDS.includes(+v) ? +v : 1;
      U.Loop.speed = v;
      SLS.Save.SetValue('game_speed', v);
      HUD.speedPulse = 1;
    },
    cycle() { Speed.set(SPEEDS[(SPEEDS.indexOf(U.Loop.speed) + 1) % SPEEDS.length]); },
  };
  const SPD = { x: 1796, y: 80, w: 96, h: 42 };   // HUD badge, top-right corner (logical px)

  // ---------------------------------------------------------------- state
  const HUD = SLS.HUD = {
    bossStats: null,        // EnemyStats of the boss (WaveManager.boss_obj)
    bossName: '',
    bossAlpha: 0,
    bossFrac: 1,
    autoAttack: null,       // null until setAutoAttackIcon is first called
    hp: 0, hpMax: 1,        // last values written (frozen while the player is dead, like CheckHP)
    hpTrail: 0,             // delayed "damage" bar
    hit: 0,                 // flash after losing HP
    souls: 0, soulPulse: 0,
    wave: '', wavePulse: 0,  // wave: the wave_number_text string
    speedPulse: 0,
    visible: false,
  };

  // ---------------------------------------------------------------- hooks
  function resolveStats(s) {
    if (!s) return null;
    if (typeof s.hp !== 'number' && typeof s.GetComponent === 'function') return s.GetComponent('EnemyStats');
    return s;
  }
  function gone(s) {
    return !s || s._destroyed || (s.gameObject && s.gameObject._destroyed);
  }
  const HOOKS = {
    // WaveManager.InvokeBoss(boss_name): name + slider (max_hp / hp of the boss' EnemyStats)
    showBoss(name, enemyStats) {
      HUD.bossStats = resolveStats(enemyStats);
      HUD.bossName = name === undefined || name === null ? '' : String(name);
      HUD.bossFrac = 1;
      if (HUD.bossAlpha > 0.99) HUD.bossAlpha = 0.99;
    },
    hideBoss() { HUD.bossStats = null; },
    // PlayerController.ToggleAutoAttack: autoattack_icon.SetActive(toggle_auto_attack)
    setAutoAttackIcon(on) { HUD.autoAttack = !!on; },
  };
  // Never overwrite a hook another module defined: wrap it and call both.
  function installHooks() {
    const H = SLS.UIHooks = SLS.UIHooks || {};
    for (const name of Object.keys(HOOKS)) {
      const cur = H[name], mine = HOOKS[name];
      if (cur && cur._slsOwner === 'hud') continue;
      let fn;
      if (typeof cur === 'function') {
        fn = function (...args) {
          let r;
          try { r = cur.apply(this, args); } catch (e) { U.reportError(e, null, 'UIHooks.' + name); }
          mine.apply(this, args);
          return r;
        };
      } else fn = function (...args) { return mine.apply(this, args); };
      fn._slsOwner = 'hud';
      H[name] = fn;
    }
  }
  installHooks();

  // ---------------------------------------------------------------- helpers
  function waveManager() { return SLS.Game.waveManager; }
  function waveNumber() { const w = waveManager(); return w && typeof w.wave_number === 'number' ? w.wave_number : 0; }
  // the WaveCounter text: WaveManager.wave_number_text (the live number only if the field is missing)
  function waveLabel() {
    const w = waveManager(), t = w && w.wave_number_text;
    if (t && t.text !== undefined && t.text !== null && t.text !== '') return String(t.text);
    return String(waveNumber());
  }

  function diamond(ctx, x, y, r, fill) {
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }
  function orbGlyph(ctx, x, y, r) {
    U.Render.drawGlow(ctx, x, y, r * 2.4, SOUL, 0.55);
    ctx.save();
    ctx.fillStyle = '#eef9ff';
    ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = SOUL; ctx.lineWidth = Math.max(1.5, r * 0.22);
    ctx.beginPath(); ctx.arc(x, y, r * 0.88, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  // rounded bar with a delayed trail and a gloss strip
  function bar(ctx, x, y, w, h, frac, trail, colTop, colBot, flash) {
    frac = Mathf.Clamp01(frac); trail = Mathf.Clamp01(trail);
    ctx.save();
    UI.roundRect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = 'rgba(10,6,22,0.82)';
    ctx.fill();
    ctx.clip();
    if (trail > frac) { ctx.fillStyle = 'rgba(255,226,170,0.85)'; ctx.fillRect(x, y, w * trail, h); }
    if (frac > 0) {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, colTop); g.addColorStop(1, colBot);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w * frac, h);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x, y + h * 0.12, w * frac, h * 0.3);
    }
    if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (0.45 * flash) + ')'; ctx.fillRect(x, y, w, h); }
    ctx.restore();
    ctx.save();
    UI.roundRect(ctx, x, y, w, h, h / 2);
    ctx.lineWidth = 2.5; ctx.strokeStyle = GOLD_DIM; ctx.stroke();
    ctx.restore();
  }
  // small "two arrows chasing each other" glyph for the auto-attack indicator
  function autoGlyph(ctx, x, y, r, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 2.2);
    ctx.strokeStyle = GOLD; ctx.fillStyle = GOLD; ctx.lineWidth = r * 0.24; ctx.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
      ctx.rotate(Math.PI);
      ctx.beginPath(); ctx.arc(0, 0, r, 0.25, Math.PI - 0.55); ctx.stroke();
      const a = Math.PI - 0.55, px = Math.cos(a) * r, py = Math.sin(a) * r;
      ctx.beginPath();
      ctx.moveTo(px - r * 0.42, py - r * 0.05); ctx.lineTo(px + r * 0.12, py - r * 0.42); ctx.lineTo(px + r * 0.18, py + r * 0.22);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- per-frame state (real time)
  function tick(dt) {
    const wave = waveNumber();
    HUD.visible = wave > 0;
    // HP: like PlayerStats.CheckHP, clamp to max_hp and only refresh while the player is alive
    const ps = SLS.Game.playerStats;
    if (ps && !ps._destroyed && typeof ps.hp === 'number' && typeof ps.max_hp === 'number' && ps.isAlive !== false) {
      const max = Math.max(ps.max_hp, 0), hp = Mathf.Clamp(ps.hp, 0, max);
      if (hp < HUD.hp - 1e-4 && HUD.visible) HUD.hit = 1;
      if (hp > HUD.hpTrail) HUD.hpTrail = hp;
      HUD.hp = hp; HUD.hpMax = max;
    } else if (ps && ps.isAlive === false && typeof ps.hp === 'number' && HUD.hp > 0 && ps.hp <= 0) {
      // death frame: CheckHP still writes the final 0 before the game-over sequence
      HUD.hp = 0; HUD.hit = 1;
    }
    HUD.hpTrail = Mathf.MoveTowards(HUD.hpTrail, HUD.hp, Math.max(HUD.hpMax, 1) * 0.6 * dt);
    if (HUD.hpTrail < HUD.hp) HUD.hpTrail = HUD.hp;
    HUD.hit = Math.max(0, HUD.hit - dt * 3);
    // souls (ProgresisonManager.soul_counter)
    const pm = SLS.Game.progression;
    const souls = pm && typeof pm.soul_orbs === 'number' ? pm.soul_orbs : 0;
    if (souls > HUD.souls && HUD.visible) HUD.soulPulse = 1;
    HUD.souls = souls;
    HUD.soulPulse = Math.max(0, HUD.soulPulse - dt * 2.5);
    // wave counter (pulses whenever the text changes)
    const label = HUD.visible ? waveLabel() : '';
    if (label !== HUD.wave) { if (label) HUD.wavePulse = 1; HUD.wave = label; }
    HUD.wavePulse = Math.max(0, HUD.wavePulse - dt * 1.4);
    // boss: WaveManager.FixedUpdate hides the boss UI once boss_obj is gone
    if (HUD.bossStats && gone(HUD.bossStats)) HUD.bossStats = null;
    const st = HUD.bossStats;
    if (st) {
      const max = typeof st.max_hp === 'number' && st.max_hp > 0 ? st.max_hp : 1;
      const f = Mathf.Clamp01((typeof st.hp === 'number' ? st.hp : 0) / max);
      HUD.bossFrac = f;
    }
    HUD.bossAlpha = Mathf.MoveTowards(HUD.bossAlpha, st && HUD.visible ? 1 : 0, dt * 3);
    // game speed: during a run, with no window open
    if (HUD.visible && !UI.stack.length) {
      const I = U.Input, m = I.mouse;
      const pad = I.padValue('select') > 0.5 && !(I.padValue('select', true) > 0.5);
      const click = I.GetMouseButtonDown(0) && m.x >= SPD.x && m.x <= SPD.x + SPD.w && m.y >= SPD.y && m.y <= SPD.y + SPD.h;
      if (I.GetKeyDown('f') || pad || click) Speed.cycle();
    }
    HUD.speedPulse = Math.max(0, HUD.speedPulse - dt * 3);
  }

  // ---------------------------------------------------------------- drawing
  function drawHP(ctx, t) {
    const x = 34, y = 26;
    // heart emblem
    const beat = 1 + 0.06 * Math.max(0, Math.sin(t * (HUD.hp < HUD.hpMax * 0.3 ? 9 : 3)));
    U.Render.drawGlow(ctx, x + 26, y + 24, 42, '#ff4d6d', 0.35 + 0.4 * HUD.hit);
    SLS.Art.icon(ctx, 'heart', x + 26, y + 28, 58 * beat, '#ff5d73');
    SLS.Art.icon(ctx, 'heart', x + 22, y + 22, 18 * beat, 'rgba(255,255,255,0.55)');
    const bx = x + 64, by = y + 9, bw = 430, bh = 32;
    const max = Math.max(HUD.hpMax, 1e-6);
    bar(ctx, bx, by, bw, bh, HUD.hp / max, HUD.hpTrail / max, '#ff7a8a', '#b81d42', HUD.hit);
    const txt = Mathf.RoundToInt(HUD.hp) + '/' + Mathf.RoundToInt(HUD.hpMax);
    UI.text(ctx, txt, bx + bw / 2, by + bh / 2 + 1, { size: 23, align: 'center', baseline: 'middle', bold: true,
      color: '#fff6ec', outline: 'rgba(40,0,12,0.85)', outlineWidth: 4 });
  }
  function drawSouls(ctx, t) {
    const x = 60, y = 98;
    const s = 1 + 0.25 * HUD.soulPulse;
    // the original's 'Souls' sprite when it is loaded, else the drawn orb
    if (!SLS.Art.soulIcon || !SLS.Art.soulIcon(ctx, x, y, 40 * s)) orbGlyph(ctx, x, y, 15 * s);
    UI.text(ctx, String(HUD.souls), x + 30, y + 1, { size: 30 * (1 + 0.12 * HUD.soulPulse), baseline: 'middle', bold: true,
      color: HUD.soulPulse > 0 ? '#e8f7ff' : '#cfeaff', outline: 'rgba(0,10,30,0.85)', outlineWidth: 4 });
  }
  function drawAutoAttack(ctx, t) {
    const pc = SLS.Game.playerController;
    const on = HUD.autoAttack !== null ? HUD.autoAttack : !!(pc && pc.toggle_auto_attack);
    if (!on) return;
    const x = 60, y = 146;
    ctx.save();
    ctx.globalAlpha *= 0.82 + 0.18 * Math.sin(t * 4);
    autoGlyph(ctx, x, y, 13, t);
    const key = U.Input.lastDevice === 'gamepad' ? 'hud.autoattack.pad' : 'hud.autoattack';
    UI.text(ctx, SLS.T(key), x + 28, y + 1, { size: 22, baseline: 'middle', bold: true, color: GOLD,
      outline: 'rgba(0,0,0,0.75)', outlineWidth: 4 });
    ctx.restore();
  }
  function drawWave(ctx, t) {
    const cx = 960, y = 46;
    const p = HUD.wavePulse, s = 1 + 0.35 * p * p;
    const txt = SLS.T('hud.wave', HUD.wave);
    ctx.save();
    ctx.font = UI.font(46, { bold: true, font: UI.FONT_TITLE });
    const w = ctx.measureText(txt).width;
    ctx.restore();
    // flourishes
    ctx.save();
    ctx.strokeStyle = 'rgba(255,211,107,0.75)'; ctx.lineWidth = 2;
    for (const sd of [-1, 1]) {
      const x0 = cx + sd * (w / 2 + 20), x1 = x0 + sd * 70;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      diamond(ctx, x1 + sd * 7, y, 6, GOLD);
      diamond(ctx, x0 + sd * 2, y, 3, GOLD);
    }
    ctx.restore();
    ctx.save();
    ctx.translate(cx, y); ctx.scale(s, s); ctx.translate(-cx, -y);
    UI.text(ctx, txt, cx, y, { size: 46, align: 'center', baseline: 'middle', bold: true, font: UI.FONT_TITLE,
      color: p > 0.05 ? '#fff1c4' : GOLD, outline: 'rgba(20,8,30,0.85)', outlineWidth: 6,
      shadow: 'rgba(255,190,80,' + (0.3 + 0.5 * p) + ')', shadowBlur: 14 + 20 * p });
    ctx.restore();
  }
  function drawBoss(ctx, t) {
    const a = HUD.bossAlpha;
    if (a <= 0.001) return;
    const cx = 960, ny = 104, bw = 780, bh = 22, bx = cx - bw / 2, by = 128;
    ctx.save();
    ctx.globalAlpha *= a;
    const name = HUD.bossName ? SLS.T(HUD.bossName) : '';
    if (name) {
      UI.text(ctx, name, cx, ny, { size: 34, align: 'center', baseline: 'middle', bold: true, font: UI.FONT_TITLE,
        color: '#ffd9b0', outline: 'rgba(30,0,10,0.9)', outlineWidth: 6, shadow: 'rgba(255,80,60,0.55)', shadowBlur: 16 });
    }
    U.Render.drawGlow(ctx, bx - 14, by + bh / 2, 26, '#ff6a3d', 0.5 + 0.2 * Math.sin(t * 5));
    U.Render.drawGlow(ctx, bx + bw + 14, by + bh / 2, 26, '#ff6a3d', 0.5 + 0.2 * Math.sin(t * 5 + 1));
    diamond(ctx, bx - 14, by + bh / 2, 9, '#ffb38a');
    diamond(ctx, bx + bw + 14, by + bh / 2, 9, '#ffb38a');
    bar(ctx, bx, by, bw, bh, HUD.bossFrac, HUD.bossFrac, '#d85cff', '#7a1238', 0);
    ctx.restore();
  }
  function drawSpeed(ctx) {
    const v = U.Loop.speed, fast = v > 1, p = HUD.speedPulse, { x, y, w, h } = SPD;
    ctx.save();
    ctx.fillStyle = fast ? 'rgba(70,46,8,0.8)' : 'rgba(12,8,24,0.6)';
    ctx.strokeStyle = fast ? GOLD : 'rgba(201,162,74,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 10); else ctx.rect(x, y, w, h);
    ctx.fill(); ctx.stroke();
    // fast-forward glyph: one triangle per speed step
    ctx.fillStyle = fast ? GOLD : GOLD_DIM;
    const gy = y + h / 2, gx = x + 14;
    for (let i = 0; i < v; i++) {
      const tx = gx + i * 9;
      ctx.beginPath(); ctx.moveTo(tx, gy - 8); ctx.lineTo(tx + 10, gy); ctx.lineTo(tx, gy + 8); ctx.closePath(); ctx.fill();
    }
    UI.text(ctx, v + 'x', x + w - 24, gy + 1, { size: 26 * (1 + 0.25 * p), align: 'center', baseline: 'middle', bold: true,
      color: fast ? '#fff1c4' : INK, outline: 'rgba(0,0,0,0.8)', outlineWidth: 4 });
    const hint = SLS.T(U.Input.lastDevice === 'gamepad' ? 'hud.speed.pad' : 'hud.speed.key');
    UI.text(ctx, hint, x + w / 2, y + h + 14, { size: 17, align: 'center', baseline: 'middle', bold: true,
      color: GOLD_DIM, outline: 'rgba(0,0,0,0.75)', outlineWidth: 3 });
    ctx.restore();
  }
  function drawDebug(ctx) {
    if (!SLS.Debug.fps) return;
    const w = waveManager();
    if (!w || typeof w.enemies_alive !== 'number') return;
    UI.text(ctx, SLS.T('hud.enemies', w.enemies_alive), 1900, 40, { size: 20, align: 'right', color: '#7dff9a' });
  }

  function draw(ctx) {
    if (!HUD.visible) return;
    const t = UI.time;
    drawHP(ctx, t);
    drawSouls(ctx, t);
    drawAutoAttack(ctx, t);
    drawWave(ctx, t);
    drawBoss(ctx, t);
    drawSpeed(ctx);
    drawDebug(ctx);
  }

  // SLS.addStartup is created by main.js, which loads after the modules: register once every
  // classic script has run (DOMContentLoaded fires before main.js boots on "load").
  function addStartup(order, fn) {
    if (typeof SLS.addStartup === 'function') { SLS.addStartup(order, fn); return; }
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof SLS.addStartup === 'function') SLS.addStartup(order, fn);
      else console.error('[hud] SLS.addStartup is missing');
    }, { once: true });
  }

  addStartup(50, () => {
    installHooks();
    const saved = +SLS.Save.GetValue('game_speed', 1);
    U.Loop.speed = SPEEDS.includes(saved) ? saved : 1;
    const prev = UI.hud;   // keep anything another module installed and draw it first
    UI.hud = {
      draw(ctx) {
        if (prev && prev.draw) { try { prev.draw(ctx); } catch (e) { U.reportError(e, null, 'hud (other)'); } }
        try { draw(ctx); } catch (e) { U.reportError(e, null, 'hud.draw'); }
      },
      tick(dt) {
        if (prev && prev.tick) { try { prev.tick(dt); } catch (e) { U.reportError(e, null, 'hud (other) tick'); } }
        try { tick(dt); } catch (e) { U.reportError(e, null, 'hud.tick'); }
      },
    };
  });
})(window.SLS, window.U);
