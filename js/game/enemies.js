/*
 * enemies.js - enemies, enemy bullets, the two bosses, drops and hit effects.
 *
 * Original classes kept with their names, fields and call graph:
 *   EnemyStats      HP, wave scaling, the single damage entry point RemoveHP (crit, speculator,
 *                   cold/freeze, life steal, damage numbers), bleed/plague ticks, death + drops.
 *   RangedBehavior  hover/follow movement, aiming, shooting, melee drop-in, out-of-bounds failsafe,
 *                   BlinkHit/ReturnColor (called by the player's Projectile).
 *   ProjectileEnemy enemy bullets (EnemyProj_1..4): damage, shield break, sadistic, absorbent.
 *   IceController   frost overlay driven by EnemyStats.cold_multiplier.
 *   Boss1           bomb volleys (BossBomb + Bomb script). Boss2: split on death (Multiply).
 *   SoulsOrb, HealingOrb  pickups dropped by EnemyStats.CheckHP.
 * Prefabs registered (original names): the 21 enemies, EnemyProj_1..4, BossBomb, BossBombEffect,
 * SoulOrb, HealingOrb, DamageText, Blood, ProjectileExplodeEnemy.
 *
 * Every number comes from SLS.F.prefabs (facts.js) or from the original code. Enemies, bullets and
 * the bomb draw the original sprites (U.Assets) with their SpriteRenderer tints, falling back to the
 * procedural art (SLS.Art) when game/assets is missing.
 *
 * Unity timing detail kept on purpose: setting Rigidbody2D.position/rotation does not move the
 * Transform until the next physics step, so inside RangedBehavior.FixedUpdate every read of
 * transform.position/rotation still sees the start-of-step pose. The engine applies body moves
 * immediately, so the start-of-step pose is cached (see RangedBehavior.FixedUpdate).
 *
 * C# floats are float32: timers (Time.fixedDeltaTime is the float 0.0199999995), HP, damage, the
 * cold multiplier and the armor reduction use Math.fround, so shot periods, bleed/plague ticks,
 * cold floors and hits-to-kill come out step-exact.
 */
'use strict';
(function (SLS, U) {
  const { Vector2, Vector3, Quaternion, Color, Mathf } = U;
  const F = SLS.F;
  const f32 = Math.fround;
  const fdt = () => f32(U.Time.fixedDeltaTime);
  const sdt = () => f32(U.Time.deltaTime);   // inside FixedUpdate this is fixedDeltaTime too
  const F001 = f32(0.01), F02 = f32(0.2);
  // armor = % reduction: atk - atk * 0.01f * armor (ProjectileEnemy and Bomb)
  const armorReduced = (atk, armor) => f32(f32(atk) - f32(f32(f32(atk) * F001) * f32(armor)));

  // ---------------------------------------------------------------- text (original wording)
  SLS.addStrings('en', {
    'enemies.boss1': 'The Hollow Warden',
    'enemies.boss2': 'The Splitting Maw',
  });
  SLS.addStrings('pt', {
    'enemies.boss1': 'O Guardião Oco',
    'enemies.boss2': 'A Bocarra Divisora',
  });

  // ---------------------------------------------------------------- shared helpers
  const ENEMY_PREFABS = [
    'Weak_Ranged', 'Medium_Ranged', 'Strong_Ranged', 'Weak_Melee', 'Strong_Melee', 'Cannon',
    'Weak_Ranged+', 'Medium_Ranged+', 'Strong_Ranged+', 'Weak_Melee+', 'Strong_Melee+', 'Cannon+',
    'Weak_Ranged++', 'Medium_Ranged++', 'Strong_Ranged++', 'Weak_Melee++', 'Strong_Melee++', 'Cannon++',
    'Weak_Ranged_END', 'Boss1', 'Boss2',
  ];
  const PROJ_KIND = { EnemyProj_1: 'enemy1', EnemyProj_2: 'enemy2', EnemyProj_3: 'enemy3', EnemyProj_4: 'enemy4' };

  // C# "player_stats" lookups (GameObject.Find("Player") / FindWithTag("Player")).
  function findPlayerStats() {
    const g = SLS.Game.playerStats;
    if (U.alive(g)) return g;
    const go = U.GameObject.FindWithTag(SLS.Tag.Player) || U.GameObject.Find('Player');
    const c = go ? go.GetComponent('PlayerStats') : null;
    return U.alive(c) ? c : null;
  }
  function playerControllerOf(ps) {
    const pc = SLS.Game.playerController;
    if (U.alive(pc)) return pc;
    return ps && ps.gameObject ? ps.gameObject.GetComponent('PlayerController') : null;
  }
  // Read-only stand-in used only while no PlayerStats exists (player module still a stub).
  const NO_PLAYER = Object.freeze({
    cold_lvl: 0, freezer: false, critical_chance: 0, critical_multiplier: 1, speculator: false, marksman: false,
    hp: 0, max_hp: 0, life_steal: 0, streamer: false, plague_spreader: false, bloody_mage: false,
    proj_fragments: 0, healing_orb_lvl: 0, soul_orb_level: 0, bulldozer: false, hoarder: false, exorcist: false,
  });
  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
  const prefabName = (ref) => (typeof ref === 'string' ? ref : ref && (ref.prefab || ref.prefabName)) || null;
  const hasPrefab = (ref) => { const n = prefabName(ref); return !!(n && SLS.Prefabs[n]); };
  // Instantiate a prefab owned by another module only if that module registered it.
  function spawnOptional(ref, pos, rot, parent, opts) {
    const n = prefabName(ref);
    return n && SLS.Prefabs[n] ? SLS.spawn(n, pos, rot, parent, opts) : null;
  }
  // The scene object "SFX" (an AudioSource) the original scripts played one-shots on.
  const SFX = { PlayOneShot(clip) { if (clip) SLS.sfx(clip); } };
  SLS.SfxSource = SLS.SfxSource || SFX;

  // facts -> component fields ({prefab} refs become prefab names, colours/vectors become U types)
  function factValue(v) {
    if (v === null || typeof v !== 'object') return typeof v === 'number' && !Number.isInteger(v) ? f32(v) : v;
    if (typeof v.prefab === 'string') return v.prefab;
    if ('r' in v && 'g' in v && 'b' in v) return new Color(v.r, v.g, v.b, v.a === undefined ? 1 : v.a);
    if ('x' in v && 'y' in v && 'z' in v) return new Vector3(v.x, v.y, v.z);
    if ('x' in v && 'y' in v) return new Vector2(v.x, v.y);
    return JSON.parse(JSON.stringify(v));
  }
  function applyFacts(c, f) { for (const k of Object.keys(f || {})) c[k] = factValue(f[k]); }

  function hexToRgb(css) {
    const m = /^#([0-9a-f]{6})$/i.exec(css || '');
    if (!m) return [1, 1, 1];
    const n = parseInt(m[1], 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  function makeChild(parent, name, tf, withScale) {
    const g = new U.GameObject(name, { layer: 0 });
    g.transform.SetParent(parent.transform, false);
    if (tf) {
      g.transform.localPosition = new Vector3(tf.pos.x, tf.pos.y, tf.pos.z);
      if (tf.rotZ) g.transform.localRotation = Quaternion.Euler(0, 0, tf.rotZ);
      if (withScale) g.transform.localScale = new Vector3(tf.scale.x, tf.scale.y, tf.scale.z);
    }
    return g;
  }
  function addParticles(go, cfg, order) {
    const p = go.AddComponent(U.Particles2D);
    Object.assign(p.cfg, cfg);
    p.sortingOrder = order;
    return p;
  }
  const isRed = (c) => c && c.r > 0.9 && c.g < 0.1 && c.b < 0.1;
  const colorCss = (c) => 'rgb(' + Math.round(Mathf.Clamp01(c.r) * 255) + ',' + Math.round(Mathf.Clamp01(c.g) * 255) + ',' + Math.round(Mathf.Clamp01(c.b) * 255) + ')';
  const hexCol = (hex, a) => { const c = hexToRgb(hex); c.push(a === undefined ? 1 : a); return c; };
  function safeHook(name, ...args) {
    const H = SLS.UIHooks;
    if (!H || typeof H[name] !== 'function') return;
    try { H[name](...args); } catch (e) { U.reportError(e, null, 'SLS.UIHooks.' + name); }
  }
  // SLS.addStartup is created by main.js, which loads after the modules: register once every
  // classic script has run (DOMContentLoaded comes before main.js boots on "load").
  function addStartup(order, fn) {
    if (typeof SLS.addStartup === 'function') { SLS.addStartup(order, fn); return; }
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof SLS.addStartup === 'function') SLS.addStartup(order, fn);
      else console.error('[enemies] SLS.addStartup is missing');
    }, { once: true });
  }
  SLS.EnemyUtil = { findPlayerStats, playerControllerOf, safeHook, NO_PLAYER, spawnOptional, addStartup };

  // Shield break shared by ProjectileEnemy and Bomb (the original duplicated this block).
  // bullet: i_window_timer = 0 (full i-frames) + player sprite at half alpha; bomb: i_window_timer = i_window.
  function breakShield(ps, iWindowTimer, fadePlayer) {
    ps.shield_up = false;
    ps.i_window_timer = iWindowTimer;
    if (fadePlayer && ps.player_graph && 'color' in ps.player_graph) ps.player_graph.color = new Color(1, 1, 1, 0.5);
    ps.shield_cooldown = f32(16 / num(ps.shield_lvl));
    if (ps.shield_sprite && 'color' in ps.shield_sprite) ps.shield_sprite.color = new Color(1, 1, 1, 0);
    if (ps.audio_source && typeof ps.audio_source.PlayOneShot === 'function') ps.audio_source.PlayOneShot(ps.shield_break_audio || 'shieldBreak', 0.4);
    else SLS.sfx('shieldBreak');
    if (ps.protector) protectorRing(ps);
  }
  // "Protector": 30 copies of the current staff projectile, -180..168 degrees in steps of 12.
  function protectorRing(ps) {
    const pc = playerControllerOf(ps);
    const name = prefabName(pc && pc.projectile);
    if (!hasPrefab(name) || !ps.transform) return;
    const pos = ps.transform.position, rot = ps.transform.rotation;
    for (let a = -180; a < 180; a += 12) {
      const shot = SLS.spawn(name, pos, rot);
      shot.transform.Rotate(0, 0, a);
      shot.transform.localScale = shot.transform.localScale.mul(num(ps.proj_size));
    }
  }

  // ================================================================ IceController
  // Frost particles on the enemy's "Ice" child. The original evaluated an AnimationCurve (asset
  // data, not in the facts); the remake uses a linear curve. Disabled particles => no update.
  class IceController extends U.MonoBehaviour {
    constructor() {
      super();
      this._particle = null;
      this._opacityCurve = (x) => x;
      this.alpha = 0;
    }
    Awake() { this._particle = this.GetComponent(U.Particles2D); }
    SetOpacity(opacity) {
      if (!U.Render.particlesEnabled) return;
      this.alpha = Mathf.Clamp01(this._opacityCurve(opacity));
      if (this._particle) {
        this._particle.cfg.colorStart[3] = this.alpha;
        this._particle.cfg.rate = 1 + 14 * this.alpha;   // emission 1..15 /s
        this._particle.emitting = this.alpha > 0.02;
      }
    }
  }

  // ================================================================ EnemyStats
  class EnemyStats extends U.MonoBehaviour {
    constructor() {
      super();
      this._initialSize = new Vector3(0, 0, 0);
      this._iceController = null;
      this.max_hp = 0; this.hp = 0;
      this.atk_speed = 0; this.atk_damage = 0; this.melee_atk_damage = 0;
      this.projectile_speed = 0; this.projectile_resistance = 0;
      this.enemy_death = 'enemyDeath'; this.projectile_audio = 'enemyShoot';   // per prefab, see setupEnemy
      this.fragmenter = 'Fragmenter'; this.healing_orb = 'HealingOrb'; this.souls_orb = 'SoulOrb';
      this.damage_text = 'DamageText'; this.blood_particles = 'Blood';
      this.wave_manager = null;
      this.player_stats = null;
      this.starting_color = Color.white;
      this.now_color = new Color(0, 0, 0, 0);
      this.can_run_hp_check = true;
      this.projectile_generation = 0;
      this.marked = false;
      this.bleed_cooldown = 1; this.bleed_amount = 0;
      this.beam_cd = 0; this.plague_cd = 0;
      this._cold_multiplier = 1;
      this.deathVariant = 0;   // remake: pitch variant of the death sound (weak/medium/strong)
    }
    get cold_multiplier() { return this._cold_multiplier; }
    set cold_multiplier(value) {
      this._cold_multiplier = value;
      this._iceController.SetOpacity(1 - value);   // inlined IceController.SetOpacity in the original
    }
    get _ps() { return this.player_stats || NO_PLAYER; }

    Awake() {
      this._initialSize = this.transform.localScale;
      this._iceController = this.GetComponentInChildren(IceController);
      this.wave_manager = WaveManagerInstance();
      this.player_stats = findPlayerStats();
    }
    Start() {
      if (!this.GetComponent('Boss2')) this.AddLevelFactor();
      this.hp = this.max_hp;
      const sr = this.GetComponentInChildren(U.ShapeRenderer);
      this.starting_color = sr ? sr.color.clone() : Color.white;
      if (this._ps.marksman) this.marked = true;
      this.cold_multiplier = this._cold_multiplier;
    }

    // Wave scaling. C# integer divisions: HP/damage scale from wave 10, bullet HP from wave 50 and
    // the fire interval from wave 100. float32 arithmetic like the original.
    AddLevelFactor() {
      const wm = this.wave_manager;
      const w = wm ? wm.wave_number | 0 : 0;
      const F02 = f32(0.02);
      const factor = w <= 60 ? F02 : f32(f32(f32(w - 60) * f32(0.0025)) + F02);
      const baseResistance = this.projectile_resistance | 0;
      const k10 = f32(Math.trunc(w / 10) * w), k100 = f32(Math.trunc(w / 100) * w), k50 = f32(Math.trunc(w / 50) * w);
      const grow = (x) => f32(f32(f32(k10 * factor) * x) + x);
      this.max_hp = grow(this.max_hp);
      this.atk_speed = f32(this.atk_speed - f32(f32(k100 * f32(factor / 50)) * this.atk_speed));
      this.atk_damage = grow(this.atk_damage);
      this.melee_atk_damage = grow(this.melee_atk_damage);
      this.projectile_resistance = Math.floor(f32(f32(k50 * factor) * baseResistance)) + baseResistance;
    }

    // The single entry point for all damage (projectiles, thunder, comet, soul ray, stream beam,
    // contact, burning man, sadistic, anti-stall sweep, bleed, plague, shatter).
    RemoveHP(damage) {
      damage = f32(damage);                                             // C# float parameter
      this.transform.localScale = this._initialSize.mul(1.1);          // hit "pop", eased back by LerpScale
      const ps = this._ps;
      if (ps.cold_lvl > 0) {
        // float32 steps: lvl 10 stops at 0.2 (f32(1 - 8 * 0.1) < 0.2f), lvl 1 at 0.19, lvl 16 at 0.04
        const cm = this._cold_multiplier;
        if ((cm > F02 && !ps.freezer) || (cm > 0 && ps.freezer)) this.cold_multiplier = f32(cm - f32(ps.cold_lvl * F001));
        if (this._cold_multiplier <= 0 && U.Random.RangeInt(0, 100) === 0) this.RemoveHP(this.hp + 1);   // 1% shatter
      }
      const critMul = f32(ps.critical_multiplier);
      let isCrit = Mathf.RoundToInt(U.Random.RangeInt(0, 100)) < ps.critical_chance;
      let finalDamage;
      if (this.marked) { isCrit = true; this.marked = false; finalDamage = f32(damage * critMul); }
      else finalDamage = isCrit ? f32(damage * critMul) : damage;
      let isSpeculator = false;
      if (ps.speculator && Mathf.RoundToInt(U.Random.RangeInt(0, 100)) < ps.critical_chance) {
        finalDamage = f32(finalDamage * critMul);
        isSpeculator = true;
      }
      this.hp = f32(this.hp - finalDamage);
      if (this.player_stats && ps.hp < ps.max_hp && ps.life_steal > 0) ps.hp = f32(f32(damage * f32(ps.life_steal)) + ps.hp);   // pre-crit damage
      const shown = Mathf.RoundToInt(finalDamage * 2);   // the number shown is twice the HP removed (original)
      if (shown > 0) this._spawnDamageText(shown, isCrit, isSpeculator);
      this.HPIndicator();
      this.CheckHP();
    }
    _spawnDamageText(value, isCrit, isSpeculator) {
      const go = U.Instantiate(this.damage_text, this.transform.position, Quaternion.identity);
      const text = go.GetComponent(U.WorldText);
      if (isCrit) text.color = Color.cyan;
      if (isSpeculator) text.color = Color.magenta;
      if (isCrit) go.transform.localScale = new Vector3(1.2, 1.2, 1.2);
      text.text = String(value);
      const rb = go.GetComponent(U.Rigidbody2D);
      rb.AddForce(this.transform.right.mul(U.Random.Range(-1, 1)), U.ForceMode2D.Impulse);
      rb.AddForce(this.transform.up.mul(-3), U.ForceMode2D.Impulse);
      U.Destroy(go, 0.5);
    }
    HPIndicator() {
      const c = this.starting_color;
      this.now_color = new Color(c.r, c.g, c.b, this.hp / this.max_hp + 0.5);
    }

    // Death (only reached through RemoveHP: setting hp directly does not kill).
    CheckHP() {
      if (this.hp > 0 || !this.can_run_hp_check) return;
      this.can_run_hp_check = false;
      SLS.sfx(this.enemy_death, this.deathVariant);
      const ps = this._ps;
      const pos = this.transform.position;
      if (ps.proj_fragments > 0) {
        const frag = spawnOptional(this.fragmenter, pos, Quaternion.identity);
        const fs = frag && frag.GetComponent('FragmenterScript');
        if (fs) fs.projectile_generation = this.projectile_generation + 1;
      }
      U.Instantiate(this.blood_particles, pos, Quaternion.identity);
      if (ps.healing_orb_lvl > 0 && U.Random.RangeInt(0, 100) < ps.healing_orb_lvl) U.Instantiate(this.healing_orb, pos, Quaternion.identity);
      if (U.Random.RangeInt(0, 100) < ps.soul_orb_level + 1) U.Instantiate(this.souls_orb, pos, Quaternion.identity);
      const boss2 = this.GetComponent('Boss2');
      if (boss2) boss2.Multiply();
      if (this.wave_manager) this.wave_manager.enemies_alive--;
      U.Destroy(this.gameObject);
    }

    FixedUpdate() {
      const ps = this._ps;
      // Bleed (inlined in the original): bleed_amount every 52 steps (1.04 s), 26 with bloody_mage
      if (this.bleed_amount > 0) {
        if (this.bleed_cooldown < 0) {
          this.RemoveHP(this.bleed_amount);
          this.bleed_cooldown = ps.bloody_mage ? 0.5 : 1;
        } else this.bleed_cooldown = f32(this.bleed_cooldown - fdt());
      }
      // Plague (inlined): 1% of max HP every 52 steps (1.04 s)
      if (ps.plague_spreader) {
        if (this.plague_cd >= 1) { this.RemoveHP(f32(this.max_hp * F001)); this.plague_cd = 0; } else this.plague_cd = f32(fdt() + this.plague_cd);
      }
      if (this.atk_speed < F02) this.atk_speed = F02;
      if (ps.streamer) this.BeamCooldown();
      this.LerpScale();
    }
    BeamCooldown() { if (this.beam_cd > 0) this.beam_cd = f32(this.beam_cd - fdt()); }
    LerpScale() {
      const s = this.transform.localScale, target = this._initialSize;
      if (s.sub(target).sqrMagnitude < 9.99999944e-11) return;   // Unity's Vector3 ==
      let next = Vector3.Lerp(s, target, U.Time.fixedDeltaTime * 5);
      if (Vector3.Distance(next, target) <= 0.01) next = target;
      this.transform.localScale = next;
    }
  }

  // ================================================================ RangedBehavior
  class RangedBehavior extends U.MonoBehaviour {
    constructor() {
      super();
      this._rigidbody = null;
      this.player_stats = null;
      this.move_speed = 0; this.initial_move_speed = 0; this.vertical_move_speed = 0;
      this.follow_distance = 0;
      this.enemy_height = 0; this.enemy_height_max = 0; this.enemy_height_min = 0;
      this.advancing = false; this.advancing_timer = 0;
      this.projectile = null;
      this.attack_cooldown = 0;
      this.natural_color = Color.white;
      this.color_blink = 0;
      this.audio_source = null;
      this.pos_debug_countdown = 7;
      this.is_melee = false; this.is_cannon = false;
      this.enemy_stats = null;
      this._p0 = null; this._r0 = null;   // start-of-step pose (see file header)
    }
    Start() {
      this._rigidbody = this.GetComponent(U.Rigidbody2D);
      this.initial_move_speed = this.move_speed;
      const sr = this.GetComponentInChildren(U.ShapeRenderer);
      this.natural_color = sr ? sr.color.clone() : Color.white;
      this.audio_source = SFX;
      this.follow_distance = U.Random.Range(this.follow_distance + 2, this.follow_distance - 2);
      this.player_stats = findPlayerStats();
      this.enemy_height = U.Random.Range(this.enemy_height_min, this.enemy_height_max);
      this.enemy_stats = this.GetComponent(EnemyStats);
      if (this.is_melee) this.advancing = true;
      if (this.player_stats && this.player_stats.bulldozer) this.GetComponent(U.Rigidbody2D).mass /= 10;
    }
    FixedUpdate() {
      this._p0 = this.transform.position;
      this._r0 = this.transform.rotation;
      this.Rover();
      this.Angle();
      this.Shoot();
      this.EnemyDebugger();
      const es = this.enemy_stats;
      if (!es) return;
      this.move_speed = es.cold_multiplier * this.initial_move_speed;
      if (this.is_melee && this.advancing) {
        // melee drop-in: no collider while above y = -0.25
        const box = this.GetComponent(U.BoxCollider2D);
        if (this._p0.y > -0.25) box.enabled = false;
        else { box.enabled = true; this.advancing = false; }
      }
      if (this.advancing_timer >= 5) this.advancing = false;
      else this.advancing_timer = f32(this.advancing_timer + fdt());
    }
    // Movement: horizontal lerp toward the player's x (cannons: the mirrored x) unless close enough,
    // then a vertical lerp toward the hover height.
    Rover() {
      const ps = this.player_stats;
      if (!U.alive(ps)) return;
      const p0 = this._p0, pp = ps.transform.position;
      const dist = Math.hypot(p0.x - pp.x, p0.y - pp.y, (p0.z || 0) - (pp.z || 0));
      const rb = this._rigidbody, dt = U.Time.fixedDeltaTime;
      if (!this.is_cannon) {
        if (dist <= this.follow_distance) return;   // close enough: no movement at all this step
        rb.position = Vector2.Lerp(rb.position, new Vector2(pp.x, p0.y), dt * this.move_speed);
      } else {
        rb.position = Vector2.Lerp(rb.position, new Vector2(pp.x * -1, p0.y), dt * this.move_speed);
      }
      rb.position = Vector2.Lerp(rb.position, new Vector2(p0.x, this.enemy_height), dt * this.vertical_move_speed);
    }
    // transform.up faces the player
    Angle() {
      const ps = this.player_stats;
      if (!U.alive(ps)) return;
      const pp = ps.transform.position, p0 = this._p0;
      const dir = new Vector3(pp.x - p0.x, pp.y - p0.y, (pp.z || 0) - (p0.z || 0)).normalized;
      this._rigidbody.rotation = Math.atan2(dir.y, dir.x) * Mathf.Rad2Deg - 90;
    }
    // float32 countdown: a shot every 77 steps (1.54 s) at atk_speed 1.5, 152 (3.04 s) at 3
    Shoot() {
      const p0 = this._p0;
      if (this.attack_cooldown > 0 || p0.y - this.enemy_height >= 1.5) {
        if (this.attack_cooldown > 0) this.attack_cooldown = f32(this.attack_cooldown - sdt());
        return;
      }
      const es = this.enemy_stats;
      if (!es) return;
      this.audio_source.PlayOneShot(es.projectile_audio, 0.2);   // null (silent) for the melee prefabs
      const shot = U.Instantiate(this.projectile, p0, this._r0);
      const pe = shot.GetComponent(ProjectileEnemy);
      pe.transform.Rotate(0, 0, 90);   // bullets fly along transform.right
      pe.proj_resistance = es.projectile_resistance;
      pe.enemy_stats = es;
      this.attack_cooldown = f32(es.atk_speed);
    }
    // Out-of-bounds failsafe: 7 s cumulative outside x in [-8.4, 8.4], y in [-3.98, 5.2], then hp = 0
    // (the enemy dies on its next RemoveHP).
    EnemyDebugger() {
      const p = this._p0 || this.transform.position;
      if (p.x > 8.4 || p.x < -8.4 || p.y > 5.2 || p.y < -3.98) {
        if (this.pos_debug_countdown < 0) { if (this.enemy_stats) this.enemy_stats.hp = 0; }
        else this.pos_debug_countdown = f32(this.pos_debug_countdown - sdt());
      }
    }
    // Called by the player's Projectile on a hit (inlined there in the original).
    BlinkHit() {
      const sr = this.GetComponentInChildren(U.ShapeRenderer);
      if (!sr) return;
      sr.color = new Color(1, 0, 0, 1);
      this.Invoke('ReturnColor', 0.06);
    }
    ReturnColor() {
      const sr = this.GetComponentInChildren(U.ShapeRenderer);
      if (sr && this.enemy_stats) sr.color = this.enemy_stats.now_color.clone();
    }
  }

  // ================================================================ ProjectileEnemy
  class ProjectileEnemy extends U.MonoBehaviour {
    constructor() {
      super();
      this.player_stats = null;
      this.projectile_duration = 0;
      this.enemy_stats = null;
      this.projectile_explode = 'ProjectileExplodeEnemy';
      this.proj_resistance = 0;
      this.kind = 'enemy1';
    }
    Start() {
      this.player_stats = findPlayerStats();
      U.Destroy(this.gameObject, this.projectile_duration);
    }
    FixedUpdate() {
      const es = this.enemy_stats;   // a dead shooter's stats are still readable, like the C# object
      if (!es) return;
      const step = U.Time.deltaTime * es.projectile_speed * 5;
      this.transform.position = this.transform.position.add(this.transform.right.mul(step));
    }
    _explode() {
      SLS.spawn(this.projectile_explode, this.transform.position, Quaternion.identity, null, { kind: this.kind });
    }
    OnTriggerEnter2D(collision) {
      const tag = collision.gameObject.tag;
      if (tag === SLS.Tag.Ground) { this._explode(); U.Destroy(this.gameObject); }
      if (tag === SLS.Tag.Projectile) {
        this.proj_resistance--;
        if (this.proj_resistance < 1) { this._explode(); U.Destroy(this.gameObject); }
      }
      if (tag !== SLS.Tag.Player) return;
      const ps = this.player_stats || collision.gameObject.GetComponent('PlayerStats');
      if (!ps) return;
      if (!ps.shield_up) {
        const reduced = armorReduced(this.enemy_stats ? this.enemy_stats.atk_damage : 0, num(ps.armor));
        let damage = 0;
        if (reduced >= 0) damage = reduced;
        const target = collision.gameObject.GetComponent('PlayerStats');
        if (target && typeof target.TakeDamage === 'function') target.TakeDamage(damage);
      } else {
        breakShield(ps, 0, true);
      }
      if (ps.sadistic) {
        // the original throws (MissingReferenceException) when the shooter is already gone:
        // the rest of the handler is skipped and the bullet keeps flying
        if (!U.alive(this.enemy_stats)) return;
        this.enemy_stats.gameObject.GetComponent(EnemyStats).RemoveHP(ps.armor);
      }
      if (ps.absorbent && ps.i_window_timer < ps.i_window && ps.hp < ps.max_hp) ps.hp = f32(ps.hp + 1);
      this._explode();
      U.Destroy(this.gameObject);
    }
  }

  // ================================================================ Boss1 (bomb volleys)
  class Boss1 extends U.MonoBehaviour {
    constructor() { super(); this.bomb = 'BossBomb'; this.attack_speed = 0; this.attack_cooldown = 0; }
    Start() { this.attack_cooldown = this.attack_speed; }
    // a volley every 102 steps (2.04 s) at attack_speed 2 (float32 countdown)
    FixedUpdate() {
      if (this.attack_cooldown >= 0) { this.attack_cooldown = f32(this.attack_cooldown - fdt()); return; }
      this.SpawnBomb();
      const es = this.GetComponent(EnemyStats);
      if (es.hp < f32(es.max_hp * f32(0.66))) this.SpawnBomb();
      if (es.hp < f32(es.max_hp * f32(0.33))) this.SpawnBomb();
      this.attack_cooldown = f32(this.attack_speed);
    }
    SpawnBomb() {
      const b = U.Instantiate(this.bomb, this.transform.position, Quaternion.identity);
      b.GetComponent(U.Rigidbody2D).AddForce(this.transform.right.mul(U.Random.Range(-5, 5)), U.ForceMode2D.Impulse);
    }
  }

  // ================================================================ Boss2 (splits on death)
  class Boss2 extends U.MonoBehaviour {
    constructor() { super(); this.generation = 0; this.multiplier = 0; this.enemy_stats = null; }
    Start() {
      this.multiplier = f32(Math.pow(2, this.generation));
      this.enemy_stats = this.GetComponent(EnemyStats);
    }
    Update() { }
    // Called by EnemyStats.CheckHP while dying: 2^generation clones while generation < 3.
    Multiply() {
      if (this.generation >= 3) return;
      const es = this.enemy_stats || this.GetComponent(EnemyStats);
      for (let i = 0; i < this.multiplier; i++) {
        const wm = WaveManagerInstance();
        if (wm) wm.enemies_alive++;
        // Instantiate(gameObject): a copy of this boss (serialized fields carry the current values)
        const clone = SLS.spawn(this.gameObject._prefabName || 'Boss2', this.transform.position, Quaternion.identity, null, { cloneOf: this.gameObject });
        if (U.Random.RangeInt(0, 2) === 0) clone.GetComponent(RangedBehavior).is_cannon = true;
        const cs = clone.GetComponent(EnemyStats);
        cs._initialSize = clone.transform.localScale.mul(f32(1 - this.generation * 0.25));
        cs.max_hp = f32(f32(es.max_hp / this.multiplier) + f32(cs.max_hp * f32(0.4)));
        cs.hp = cs.max_hp;
        cs.bleed_amount = 0;
        cs.atk_damage = f32(f32(es.atk_damage / this.generation) + f32(cs.atk_damage * 0.25));
        cs.atk_speed = f32(f32(this.generation * es.atk_speed) - f32(cs.atk_speed * f32(0.2)));
        clone.GetComponent(Boss2).generation = this.generation + 1;
      }
    }
  }

  // Unity's Instantiate(gameObject) copies serialized fields (public / [SerializeField]); private
  // runtime fields start from their initialisers. Applied before Awake, like a real clone.
  const CLONE_FIELDS = {
    EnemyStats: ['_initialSize', 'max_hp', 'hp', 'atk_speed', 'atk_damage', 'melee_atk_damage', 'projectile_speed',
      'projectile_resistance', 'enemy_death', 'projectile_audio', 'fragmenter', 'healing_orb', 'wave_manager', 'now_color',
      'damage_text', 'blood_particles', 'projectile_generation', 'bleed_cooldown', 'bleed_amount', 'souls_orb', 'beam_cd'],
    RangedBehavior: ['move_speed', 'initial_move_speed', 'vertical_move_speed', 'follow_distance', 'enemy_height_max',
      'enemy_height_min', 'projectile', 'audio_source', 'is_melee', 'is_cannon'],
    Boss1: ['bomb', 'attack_speed'],
    Boss2: ['generation'],
  };
  function copyInstanceState(go, src) {
    go.transform.localScale = src.transform.localScale;
    for (const [cls, fields] of Object.entries(CLONE_FIELDS)) {
      const a = go.GetComponent(cls), b = src.GetComponent(cls);
      if (!a || !b) continue;
      for (const f of fields) {
        const v = b[f];
        a[f] = v && typeof v.clone === 'function' ? v.clone() : v;
      }
    }
    const rbA = go.GetComponent(U.Rigidbody2D), rbB = src.GetComponent(U.Rigidbody2D);
    if (rbA && rbB) rbA.mass = rbB.mass;
    const boxA = go.GetComponent(U.BoxCollider2D), boxB = src.GetComponent(U.BoxCollider2D);
    if (boxA && boxB) boxA.enabled = boxB.enabled;
    const srA = go.GetComponentInChildren(U.ShapeRenderer), srB = src.GetComponentInChildren(U.ShapeRenderer);
    if (srA && srB) srA.color = srB.color.clone();
  }

  // ================================================================ Bomb (Boss1's bomb, prefab BossBomb)
  class Bomb extends U.MonoBehaviour {
    constructor() {
      super();
      this.cooldown_explosion = 5;
      this.blink_cooldown = 0.5;
      this.sprite = null;
      this.natural_color = Color.white;
      this.is_red = false;
      this.explosion_effect = 'BossBombEffect';
      this.explosion_sfx = 'explode';
      this.audio_source = null;
    }
    Start() {
      this.sprite = this.GetComponent(U.ShapeRenderer);
      this.natural_color = this.sprite.color.clone();
      this.audio_source = SFX;
    }
    FixedUpdate() {
      this.Explode();
      this.GetComponent(U.CircleCollider2D).enabled = !(this.transform.position.y > 0);
    }
    Explode() {
      if (this.cooldown_explosion < 0) {
        // layerMask 1 = Default only, exactly like the original (the Player sits on layer 7 there)
        const hits = U.Physics2D.OverlapCircleAll(this.transform.position, 1.5, 1);
        for (const hit of hits) {
          if (hit.gameObject.tag !== SLS.Tag.Player) continue;
          const ps = hit.GetComponent('PlayerStats');
          const first = U.GameObject.FindWithTag(SLS.Tag.Enemy);   // damage source: the first "Enemy"
          const enemy = first ? first.GetComponent(EnemyStats) : null;
          if (!ps) continue;
          if (!ps.shield_up) {
            let damage = armorReduced(enemy ? enemy.atk_damage : 0, num(ps.armor));
            if (damage < 0) damage = 0;
            if (typeof ps.TakeDamage === 'function') ps.TakeDamage(damage);
          } else {
            breakShield(ps, ps.i_window, false);
          }
          if (ps.sadistic && enemy) enemy.RemoveHP(ps.armor);
        }
        U.Instantiate(this.explosion_effect, this.transform.position, Quaternion.identity);
        this.audio_source.PlayOneShot(this.explosion_sfx, 0.8);
        U.Destroy(this.gameObject);
      } else {
        this.cooldown_explosion = f32(this.cooldown_explosion - fdt());
      }
      // Blink (inlined): faster as the fuse runs down
      if (this.blink_cooldown < 0) {
        this.is_red = !this.is_red;
        this.sprite.color = this.is_red ? new Color(1, 0, 0, 1) : this.natural_color.clone();
        this.blink_cooldown = f32(0.5 - f32(0.5 / this.cooldown_explosion));
      } else {
        this.blink_cooldown = f32(this.blink_cooldown - fdt());
      }
    }
    // No collision callback: the original bomb lands and bounces silently (its only sound is the blast).
  }

  // ================================================================ pickups
  class HealingOrb extends U.MonoBehaviour {
    constructor() { super(); this.healing_power = 5; this.healing_audio = 'heal'; this.player_stats = null; this.orb_charge_effect = 'OrbCharge'; }
    Start() {
      this.player_stats = findPlayerStats();
      const ps = this.player_stats || NO_PLAYER;
      this.healing_power += num(ps.healing_orb_lvl);
      if (ps.hoarder) this.GetComponent(U.ShapeRenderer).color = new Color(1, 0, 0, 1);
    }
    Update() {   // collectable only near the floor
      this.GetComponent(U.BoxCollider2D).enabled = this.transform.position.y < -0.9;
    }
    OnCollisionEnter2D(collision) {
      if (collision.gameObject.tag !== SLS.Tag.Player) return;
      const ps = this.player_stats || collision.gameObject.GetComponent('PlayerStats');
      if (!ps) return;
      const healed = f32(this.healing_power + ps.hp);   // int + float -> float
      ps.hp = healed <= ps.max_hp ? healed : ps.max_hp;
      if (ps.hoarder) {
        ps.orb_charge = num(ps.orb_charge) + 1;
        spawnOptional(this.orb_charge_effect, null, null, ps.transform);
      }
      SFX.PlayOneShot(this.healing_audio, 0.6);
      U.Destroy(this.gameObject);
    }
  }

  class SoulsOrb extends U.MonoBehaviour {
    constructor() { super(); this.healing_audio = 'pickup'; this.beam_audio = 'beam'; this.soul_beam = 'SoulRay'; this.progression_manager = null; this.player_stats = null; }
    Start() {
      this.player_stats = findPlayerStats();
      this.progression_manager = findProgression();
    }
    Update() {
      this.GetComponent(U.BoxCollider2D).enabled = this.transform.position.y < -0.9;
    }
    OnCollisionEnter2D(collision) {
      if (collision.gameObject.tag !== SLS.Tag.Player) return;
      const pm = this.progression_manager || findProgression();
      if (pm) pm.soul_orbs = num(pm.soul_orbs) + 1;
      SFX.PlayOneShot(this.healing_audio, 0.6);
      const ps = this.player_stats || NO_PLAYER;
      if (ps.exorcist) SFX.PlayOneShot(this.beam_audio, 0.7);
      if (ps.exorcist) {
        const p = this.transform.position;
        spawnOptional(this.soul_beam, new Vector3(p.x, 0, p.z), Quaternion.identity);
      }
      U.Destroy(this.gameObject);
    }
  }
  function findProgression() {
    const p = SLS.Game.progression;
    if (U.alive(p)) return p;
    const go = U.GameObject.Find('ProgressionManager');
    return go ? go.GetComponent('ProgresisonManager') : null;
  }

  function WaveManagerInstance() {
    const wm = (SLS.WaveManager && SLS.WaveManager.Instance) || SLS.Game.waveManager;
    return U.alive(wm) ? wm : null;
  }

  // ================================================================ visuals
  // kind/size/tier for SLS.Art.enemy from the prefab name
  function enemyLook(name) {
    if (name === 'Boss1') return { boss: 1 };
    if (name === 'Boss2') return { boss: 2 };
    const tier = name.endsWith('++') ? 2 : name.endsWith('+') ? 1 : 0;
    const base = name.replace(/\+/g, '');
    if (base === 'Weak_Ranged_END') return { kind: 'end', size: 0, tier: 2 };
    const parts = base.split('_');
    const size = { Weak: 0, Medium: 1, Strong: 2 }[parts[0]];
    const kind = base === 'Cannon' ? 'cannon' : parts[1] === 'Melee' ? 'melee' : 'ranged';
    return { kind, size: size === undefined ? 1 : size, tier };
  }
  // Draw on the "Graphics" child, which is turned ~180 degrees like the original rig, so the
  // creature stands upright while its body's +y aims at the player below.
  function makeEnemyDraw(look, col, gfxRotZ, es, sprite, gTf) {
    const w = col.size.x, h = col.size.y;
    const a = -gfxRotZ * Mathf.Deg2Rad;
    const cx = col.offset.x * Math.cos(a) - col.offset.y * Math.sin(a);
    const cy = col.offset.x * Math.sin(a) + col.offset.y * Math.cos(a);
    // the prefab's Graphics localPosition/scale, expressed in this (rotated) Graphics space
    const gp = gTf ? gTf.pos : { x: 0, y: 0 }, gScale = gTf ? gTf.scale.x : 1;
    const gx = gp.x * Math.cos(a) - gp.y * Math.sin(a), gy = gp.x * Math.sin(a) + gp.y * Math.cos(a);
    const seed = Math.random() * 6.283;
    return (ctx, r) => {
      const t = U.Time.time;
      if (sprite && U.Assets.image(sprite)) {
        // original sprite on the original rig (Graphics turned 180 on a body whose +y aims at the
        // player, so the sprite tilts with it; bosses: their root scale already applies), multiplied
        // by SpriteRenderer.color: BlinkHit red (1,0,0) for 0.06 s, then now_color (start colour,
        // alpha hp/max_hp + 0.5; the renderer applies the alpha). Frost = the Ice particles only.
        ctx.translate(gx, gy);
        const c = r.color;
        if (c.r >= 1 && c.g >= 1 && c.b >= 1) U.Assets.drawSprite(ctx, sprite, { scale: gScale });
        else U.Assets.drawTinted(ctx, sprite, colorCss(c), { scale: gScale });
        return;
      }
      ctx.translate(cx, cy);
      if (look.kind === 'cannon') {
        // cannons stay upright and turn their maw (drawn on the art's -x side) toward the player,
        // whose direction is the body's +y
        const m = r.transform.worldMatrix, body = r.transform.parent;
        ctx.rotate(-Math.atan2(m[1], m[0]));
        if (body && body.up.x > 0) ctx.scale(-1, 1);
      }
      let hover, rx, ry;
      if (look.boss) {
        // backlight so the Warden's dark silhouette reads against the night sky
        if (look.boss === 1) U.Render.drawGlow(ctx, 0, 0, w * 1.15, 'rgba(190,130,255,1)', 0.3);
        SLS.Art.boss(ctx, look.boss, { t, w, h, hurt: 0 });
        hover = Math.sin(t * 1.5) * 0.03; rx = w * 0.6; ry = h * 0.8;
      } else {
        SLS.Art.enemy(ctx, { kind: look.kind, size: look.size, tier: look.tier, w, h, t, hurt: 0, frozen: false, seed });
        hover = Math.sin(t * 3 + seed) * 0.04; rx = w * 0.55; ry = h * 0.5;
      }
      const ice = es._iceController ? es._iceController.alpha : 0;
      if (ice > 0.01) {
        ctx.fillStyle = 'rgba(168,240,255,' + (0.45 * ice).toFixed(3) + ')';
        ctx.beginPath(); ctx.ellipse(0, hover, rx * 1.08, ry * 1.08, 0, 0, Math.PI * 2); ctx.fill();
      }
      if (isRed(r.color)) {   // RangedBehavior.BlinkHit
        ctx.fillStyle = 'rgba(255,36,48,0.62)';
        ctx.beginPath(); ctx.ellipse(0, hover, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      }
    };
  }

  // "Ice": rect 0.15 x 0.43 (Ice child scale 0.63), #b1d7ff, alpha set by IceController (1 - cold)
  function frostConfig() {
    return {
      rate: 1, lifetime: [0.1, 5], speed: [0, 0.05], angle: 90, spread: 360, size: [0.06, 0.3], sizeEnd: 0.3,
      colorStart: hexCol('#b1d7ff', 0), colorEnd: hexCol('#b1d7ff', 0), shape: 'box', box: [0.15, 0.43],
      additive: false, glow: true, decorative: true, loop: true, duration: 1,
    };
  }

  // ================================================================ prefab factories
  const ENEMY_SCRIPTS = { EnemyStats, RangedBehavior, Boss1, Boss2 };

  function setupEnemy(name, go, opts) {
    const facts = F.prefabs[name];
    const look = enemyLook(name);
    go._prefabName = name;
    go.tag = SLS.Tag.Enemy;
    go.layer = SLS.Layer.Enemy;
    let es = null;
    for (const cls of Object.keys(facts.scripts || {})) {
      const C = ENEMY_SCRIPTS[cls];
      if (!C) continue;
      const c = go.AddComponent(C);
      applyFacts(c, facts.scripts[cls]);
      if (c instanceof EnemyStats) {
        es = c;
        // prefab clips: cannons SpitFireBall, melee none (their one shot is silent), the rest projectile_launch
        if (look.kind === 'cannon') c.projectile_audio = 'cannonShoot';
        else if (look.kind === 'melee') c.projectile_audio = null;
      }
    }
    es.deathVariant = look.kind === 'cannon' ? 1 : look.kind === 'melee' ? 2 : 0;
    SLS.addPhysicsFromFacts(go, facts);
    const ch = facts.children || {};
    const gTf = ch.Graphics ? ch.Graphics.transform : null;
    const gfxRot = gTf ? gTf.rotZ : 180;
    const gfx = makeChild(go, 'Graphics', { pos: { x: 0, y: 0, z: 0 }, rotZ: gfxRot, scale: { x: 1, y: 1, z: 1 } }, false);
    const sr = gfx.AddComponent(U.ShapeRenderer);
    sr.sortingOrder = look.boss ? 18 : 20;
    if (name === 'Weak_Ranged_END') sr.color = new Color(1, 0.559, 0, 1);   // Weak_ranged_lvl4 tinted orange (prefab)
    sr.draw = makeEnemyDraw(look, facts.colliders[0], gfxRot, es, SLS.Sprites.enemy(name), gTf);
    const ice = makeChild(go, 'Ice', ch.Ice ? ch.Ice.transform : null, true);
    addParticles(ice, frostConfig(), 22).emitting = false;
    ice.AddComponent(IceController);
    if (opts && opts.cloneOf) copyInstanceState(go, opts.cloneOf);
  }
  for (const name of ENEMY_PREFABS) SLS.registerPrefab(name, (go, opts) => setupEnemy(name, go, opts));

  // enemy bullets (EnemyProj_N trail colour over lifetime, from the prefabs)
  const ENEMY_TRAIL = {
    EnemyProj_1: ['#ff00e9', '#ff005b'], EnemyProj_2: ['#ff2400', '#ff2400'],
    EnemyProj_3: ['#ff6f00', '#ff2400'], EnemyProj_4: ['#ff2400', '#ff2400'],
  };
  // ... and the Projectile sprite's SpriteRenderer tint
  const ENEMY_TINT = {
    EnemyProj_1: colorCss(new Color(1, 0, 0.876)), EnemyProj_2: colorCss(new Color(0.736, 0.045, 0.352)),
    EnemyProj_3: colorCss(new Color(0.925, 0.109, 0.189)), EnemyProj_4: colorCss(new Color(0.663, 0.047, 0.737)),
  };
  for (const name of Object.keys(PROJ_KIND)) {
    SLS.registerPrefab(name, (go) => {
      const facts = F.prefabs[name], kind = PROJ_KIND[name];
      go.tag = SLS.Tag.ProjectileEnemy;
      const pe = go.AddComponent(ProjectileEnemy);
      applyFacts(pe, facts.scripts.ProjectileEnemy);
      pe.kind = kind;
      SLS.addPhysicsFromFacts(go, facts);
      const r = go.AddComponent(U.ShapeRenderer);
      r.sortingOrder = 26;
      const tint = ENEMY_TINT[name];
      r.draw = (ctx) => {
        if (!U.Assets.drawTinted(ctx, 'Projectile', tint, { smooth: true })) SLS.Art.projectile(ctx, kind, { t: U.Time.time });
      };
      // "Trail": the same particles as the player shots' trail (world space, 100/s, lifetime 0.1-0.5 s,
      // size 0.02-0.04 with no size over lifetime, full alpha until 65 % of life), coloured per prefab.
      // Particles2D clamps alpha, so a start alpha of 1/(1-0.65) holds it until 65 %.
      const [c0, c1] = ENEMY_TRAIL[name];
      const trail = makeChild(go, 'Trail', facts.children && facts.children.Trail ? facts.children.Trail.transform : null, true);
      addParticles(trail, {
        rate: 100, lifetime: [0.1, 0.5], speed: [0, 0.05], spread: 360, shape: 'circle', radius: 0.042,
        size: [0.02, 0.04], sizeEnd: 1,
        colorStart: hexCol(c0, 1 / (1 - 0.65)), colorEnd: hexCol(c1, 0), additive: true, glow: true,
        decorative: true, loop: true, duration: 1, max: 60,
      }, 25);
    });
  }

  // Boss1's bomb (tagged "Projectile" in the original, so wave-end cleanup removes it)
  SLS.registerPrefab('BossBomb', (go) => {
    const facts = F.prefabs.BossBomb;
    go.tag = SLS.Tag.Projectile;
    const r = go.AddComponent(U.ShapeRenderer);
    r.sortingOrder = 24;
    r.color = new Color(0.36, 0.251, 0.538, 1);   // Projectile sprite tint; Bomb blinks it red (1,0,0)
    const b = go.AddComponent(Bomb);
    applyFacts(b, facts.scripts.Bomb);
    SLS.addPhysicsFromFacts(go, facts);
    r.draw = (ctx, rr) => {
      if (U.Assets.drawTinted(ctx, 'Projectile', colorCss(rr.color), { smooth: true })) return;
      SLS.Art.bomb(ctx, { t: U.Time.time, urgency: 6 + Math.max(0, 5 - b.cooldown_explosion) * 5 });
      if (isRed(rr.color)) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255,40,30,0.75)';
        ctx.beginPath(); ctx.arc(0, 0, 0.52, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    };
    // three spark emitters (top, left, right), 10/s each, #ff5000 -> #ffd500
    for (const n of ['Particle System', 'Particle System (1)', 'Particle System (2)']) {
      const ch = facts.children && facts.children[n];
      const spark = makeChild(go, n, ch ? ch.transform : null, true);
      const p = ch ? ch.transform.pos : { x: 0, y: 1 };
      addParticles(spark, {
        rate: 10, lifetime: [0.2, 0.45], speed: [0.3, 0.9], angle: Math.atan2(p.y, p.x) * Mathf.Rad2Deg, spread: 70,
        size: [0.03, 0.06], sizeEnd: 0.1, colorStart: hexCol('#ff5000'), colorEnd: hexCol('#ffd500', 0), gravity: -1.5,
        additive: true, glow: true, decorative: true,
      }, 25);
    }
  });

  // pickups
  const ORB_PARTICLES = { SoulOrb: ['#7400ff', '#00d0ff'], HealingOrb: ['#bcff00', '#2f8220'] };
  function setupOrb(name, Cls, kind) {
    SLS.registerPrefab(name, (go) => {
      const facts = F.prefabs[name];
      const r = go.AddComponent(U.ShapeRenderer);
      r.sortingOrder = 23;
      const seed = Math.random() * 6;
      r.draw = (ctx, rr) => {
        ctx.scale(2.6, 2.6);   // Art.orb's core (r 0.18) roughly fills the 1x1 collider
        if (isRed(rr.color)) {   // hoarder: red healing orb
          if (SLS.Art.orb(ctx, 'enemy4', { t: U.Time.time + seed })) return;   // sprite tinted red
          ctx.fillStyle = '#ff3d3d'; ctx.fillRect(-0.05, -0.16, 0.1, 0.32); ctx.fillRect(-0.16, -0.05, 0.32, 0.1);
        } else SLS.Art.orb(ctx, kind, { t: U.Time.time + seed });
      };
      SLS.addPhysicsFromFacts(go, facts);
      const c = go.AddComponent(Cls);
      applyFacts(c, facts.scripts[Cls.name]);
      const [c0, c1] = ORB_PARTICLES[name];   // prefab colour over lifetime
      const ps = makeChild(go, 'Particle System', facts.children ? facts.children['Particle System'].transform : null, true);
      addParticles(ps, {
        rate: 9, lifetime: [0.4, 0.8], speed: [0.1, 0.35], angle: 90, spread: 60, size: [0.03, 0.06], sizeEnd: 0.2,
        colorStart: hexCol(c0, 0.9), colorEnd: hexCol(c1, 0), additive: true, glow: true, decorative: true,
      }, 22);
    });
  }
  setupOrb('HealingOrb', HealingOrb, 'healingOrb');
  setupOrb('SoulOrb', SoulsOrb, 'soulOrb');

  // floating damage number (TextMeshPro + Rigidbody2D in the original)
  SLS.registerPrefab('DamageText', (go) => {
    const facts = F.prefabs.DamageText;
    const tmp = (facts.scripts && facts.scripts['TMPro.TextMeshPro']) || {};
    const t = go.AddComponent(U.WorldText);
    const c = tmp.m_fontColor || { r: 0.924528, g: 0.100303, b: 0.100303, a: 1 };
    t.color = new Color(c.r, c.g, c.b, c.a);
    t.size = (tmp.m_fontSize || 4) * 0.1;   // TMP world text: font size 10 = 1 world unit
    t.font = 'bold';
    t.sortingOrder = 60;
    SLS.addPhysicsFromFacts(go, facts);   // dynamic body, gravity scale 0.65, no collider
  });

  // Particle System "Collision" module (world planes = the ground): particles stop on the ground
  // surface. groundTop is cached per 0.05-unit column.
  const groundCache = { ground: null, map: new Map() };
  function groundAt(x) {
    const W = SLS.World;
    if (!W || !W.groundTop) return -Infinity;
    if (groundCache.ground !== W.ground) { groundCache.ground = W.ground; groundCache.map.clear(); }
    const k = Math.round(x * 20);
    let y = groundCache.map.get(k);
    if (y === undefined) { y = W.groundTop(k / 20); groundCache.map.set(k, y); }
    return y;
  }
  class ParticleGroundCollision extends U.MonoBehaviour {
    LateUpdate() {
      for (const ps of this.GetComponents(U.Particles2D)) {
        for (const p of ps.parts) {
          const top = groundAt(p.x) + p.size / 2;
          if (p.y >= top) continue;
          p.y = top;
          p.vy = Math.abs(p.vy) > 0.6 ? -p.vy * 0.2 : 0;   // small bounce, then rest
          p.vx *= 0.5;
        }
      }
    }
  }

  // one-shot particle effects (original look)
  function burstPrefab(name, emitters) {
    SLS.registerPrefab(name, (go, opts) => {
      let longest = null, life = -1;
      for (const e of emitters(opts || {})) {
        const p = addParticles(go, Object.assign({ loop: false, rate: 0, playOnAwake: true, decorative: true }, e.cfg), e.order || 30);
        const l = (e.cfg.duration || 0.1) + (Array.isArray(e.cfg.lifetime) ? e.cfg.lifetime[1] : e.cfg.lifetime);
        if (l > life) { life = l; longest = p; }
        if (e.ground) go.AddComponent(ParticleGroundCollision);
      }
      if (longest) longest._autoDestroy = true;
      U.Destroy(go, life + 0.5);   // safety net when particles are switched off
    });
  }
  // Blood (enemy death): 50/s for 0.2 s, lifetime 20 s, speed 2, size 0.04-0.1, gravity modifier 1.2,
  // collides with the ground, #e20000 -> #7d0000.
  burstPrefab('Blood', () => [
    { ground: true, cfg: { rate: 50, duration: 0.2, lifetime: 20, speed: 2, angle: 90, spread: 180, size: [0.04, 0.1], sizeEnd: 1,
      colorStart: hexCol('#e20000'), colorEnd: hexCol('#7d0000'), gravity: -9.81 * 1.2, additive: false, glow: false } },
  ]);
  // ProjectileExplode-style burst: 50 particles, speed 3, size 0.01-0.05, colour random between two,
  // fading after 58 % of the lifetime (alpha 1/0.42 -> 0, clamped to 1). The 3D sphere emitter seen
  // flat makes the apparent speed ~0.3..1 x the start speed.
  const sparkBurst = (count, speed, size, life, cols, extra) => cols.map((c) => ({ cfg: Object.assign({
    bursts: [{ time: 0, count: Math.round(count / cols.length) }], duration: 0.05, lifetime: life, speed, spread: 360,
    size, sizeEnd: 1, colorStart: hexCol(c, 1 / 0.42), colorEnd: hexCol(c, 0), additive: true, glow: true, max: 500 }, extra) }));
  burstPrefab('ProjectileExplodeEnemy', () => sparkBurst(50, [0.9, 3], [0.01, 0.05], [0.25, 0.5], ['#2100ff', '#d900ff']));
  // BossBombEffect: 0.8 s, up to 500 particles, speed 5, size 0.02-0.08, #ffd000 / #ff4300, scale 1.2
  burstPrefab('BossBombEffect', () => sparkBurst(300, [1.8, 6], [0.024, 0.096], [0.3, 0.8], ['#ffd000', '#ff4300'],
    { shape: 'circle', radius: 0.2 }));

  // ================================================================ exports
  Object.assign(SLS, { EnemyStats, RangedBehavior, ProjectileEnemy, IceController, Boss1, Boss2, Bomb, SoulsOrb, HealingOrb });
  for (const C of [EnemyStats, RangedBehavior, ProjectileEnemy, IceController, Boss1, Boss2, Bomb, SoulsOrb, HealingOrb]) {
    if (!(C.name in window)) window[C.name] = C;
    if (typeof U.registerScript === 'function') U.registerScript(C);
  }
  SLS.Enemies = {
    prefabs: ENEMY_PREFABS.slice(),
    look: enemyLook,
    bossNameKey: { 1: 'enemies.boss1', 2: 'enemies.boss2' },
  };

  // ================================================================ test mode (?test=enemies)
  // A static training dummy stands in for the player when the player module is not there yet,
  // with a minimal PlayerStats-like component (found through GetComponent('PlayerStats')).
  class DummyPlayerStats extends U.MonoBehaviour {
    constructor() {
      super();
      applyFacts(this, (F.player.scripts || {}).PlayerStats || {});
      this.isAlive = true;
      this.hp = this.max_hp;
      this.damageTaken = 0;
      this.hurt = 0;
    }
    TakeDamage(dmg) {
      if (this.i_window_timer < this.i_window) return;
      this.i_window_timer = 0;
      this.hurt = 1;
      this.damageTaken += dmg;
      SLS.sfx('playerHit');
      if (!SLS.Debug.god) this.hp = Math.max(1, this.hp - dmg);   // a dummy never falls
    }
    FixedUpdate() { this.i_window_timer += U.Time.fixedDeltaTime; this.hurt = Math.max(0, this.hurt - U.Time.fixedDeltaTime * 4); }
  }
  DummyPlayerStats.csName = 'PlayerStats';
  SLS.DummyPlayerStats = DummyPlayerStats;

  function drawDummy(ctx, s) {
    ctx.save();
    ctx.translate(0, -0.05);
    ctx.fillStyle = '#6b4a2e';
    ctx.fillRect(-0.035, -0.45, 0.07, 0.75);                 // post
    ctx.fillRect(-0.3, 0.12, 0.6, 0.06);                     // arms
    ctx.fillStyle = '#d9b46a';
    ctx.beginPath(); ctx.ellipse(0, -0.02, 0.17, 0.24, 0, 0, Math.PI * 2); ctx.fill();   // straw body
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 0.02;
    for (const y of [-0.15, -0.02, 0.11]) { ctx.beginPath(); ctx.moveTo(-0.15, y); ctx.lineTo(0.15, y); ctx.stroke(); }
    ctx.fillStyle = '#c94b4b';
    ctx.beginPath(); ctx.arc(0, -0.02, 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4ead2';
    ctx.beginPath(); ctx.arc(0, -0.02, 0.05, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c94b4b';
    ctx.beginPath(); ctx.arc(0, -0.02, 0.022, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e6c88a';
    ctx.beginPath(); ctx.arc(0, 0.33, 0.1, 0, Math.PI * 2); ctx.fill();   // head
    if (s.hurt > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,60,60,' + (0.6 * s.hurt).toFixed(3) + ')';
      ctx.beginPath(); ctx.ellipse(0, 0.05, 0.3, 0.45, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function createDummyTarget() {
    const P = F.player;
    const go = new U.GameObject('Player', { layer: SLS.Layer.Player, tag: SLS.Tag.Player, active: false });
    const sc = P.transform.scale;
    go.transform.localScale = new Vector3(sc.x, sc.y, sc.z);
    const col = P.colliders[0];
    const box = go.AddComponent(U.BoxCollider2D);
    box.size = new Vector2(col.size.x, col.size.y);
    box.offset = new Vector2(col.offset.x, col.offset.y);
    const rb = go.AddComponent(U.Rigidbody2D);
    rb.bodyType = U.RigidbodyType2D.Kinematic;
    rb.constraints = 7;
    // stand on the floor of the arena's middle section
    const floor = SLS.World.groundTop ? SLS.World.groundTop(0) : -4.04;
    go.transform.position = new Vector3(0, floor + (col.size.y / 2 - col.offset.y) * sc.y + 0.005, 0);
    const stats = go.AddComponent(DummyPlayerStats);
    const r = go.AddComponent(U.ShapeRenderer);
    r.sortingOrder = 30;
    r.draw = (ctx) => drawDummy(ctx, { hurt: stats.hurt });
    go.SetActive(true);
    return go;
  }

  // Test driver: idles the WaveManager and drops one of each regular enemy into the arena.
  class EnemiesTest extends U.MonoBehaviour {
    Start() {
      const wm = WaveManagerInstance();
      if (wm) {
        wm.wave_number = Math.max(1, SLS.Debug.startWave || 1);
        wm.state = 'test';
        wm.paused = false;
      }
      U.Time.timeScale = 1;
      const list = ENEMY_PREFABS.filter((n) => !n.startsWith('Boss'));
      list.forEach((n, i) => {
        const x = -7.4 + 14.8 * i / (list.length - 1);
        U.Instantiate(n, new Vector3(x, 5.6 + (i % 2) * 0.4, 0), Quaternion.identity);
        if (wm) wm.enemies_alive++;
      });
    }
  }

  addStartup(90, () => {
    if (SLS.Debug.test !== 'enemies') return;
    if (!SLS.Game.player) createDummyTarget();
    if (!SLS.Debug.autostart) new U.GameObject('EnemiesTest').AddComponent(EnemiesTest);
  });

  // Debug helpers for the harness (eval SLS.EnemiesDebug.summary())
  SLS.EnemiesDebug = {
    summary() {
      const wm = WaveManagerInstance();
      const counts = {};
      for (const g of U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy)) counts[g._prefabName || g.name] = (counts[g._prefabName || g.name] || 0) + 1;
      const boss = U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy).filter((g) => /^Boss/.test(g._prefabName || ''))
        .map((g) => { const s = g.GetComponent(EnemyStats); return { name: g._prefabName, gen: (g.GetComponent(Boss2) || {}).generation, hp: Math.round(s.hp), max_hp: Math.round(s.max_hp), dmg: +s.atk_damage.toFixed(2), as: +s.atk_speed.toFixed(3), scale: +g.transform.localScale.x.toFixed(3) }; });
      return {
        wave: wm && wm.wave_number, state: wm && wm.state, wave_points: wm && wm.wave_points, enemies_alive: wm && wm.enemies_alive,
        tagged: U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy).length, bullets: U.GameObject.FindGameObjectsWithTag(SLS.Tag.ProjectileEnemy).length,
        counts, boss, timeScale: U.Time.timeScale, music: U.Audio.music.track,
      };
    },
    stats(name) {
      const g = U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy).find((x) => (x._prefabName || x.name) === name);
      const s = g && g.GetComponent(EnemyStats);
      return s ? { max_hp: s.max_hp, hp: s.hp, atk_damage: s.atk_damage, melee: s.melee_atk_damage, atk_speed: s.atk_speed, res: s.projectile_resistance } : null;
    },
    damageAll(dmg) {
      let n = 0;
      for (const g of U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy)) { const s = g.GetComponent(EnemyStats); if (s) { s.RemoveHP(dmg); n++; } }
      return n;
    },
    hit(index, dmg) {   // RemoveHP + BlinkHit on one enemy, like a projectile hit
      const g = U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy)[index | 0];
      const s = g && g.GetComponent(EnemyStats);
      if (!s) return null;
      s.RemoveHP(dmg);
      const rb = g.GetComponent(RangedBehavior);
      if (rb) rb.BlinkHit();
      return { name: g._prefabName, hp: s.hp, cold: s.cold_multiplier, alpha: s.now_color.a, scale: g.transform.localScale.x };
    },
    enemies() {
      return U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy).map((g) => {
        const s = g.GetComponent(EnemyStats), p = g.transform.position;
        return { name: g._prefabName, x: +p.x.toFixed(2), y: +p.y.toFixed(2), hp: +s.hp.toFixed(1), cold: +s.cold_multiplier.toFixed(2) };
      });
    },
    spawn(name, x = 0, y = 2) {
      const wm = WaveManagerInstance();
      U.Instantiate(name, new Vector3(x, y, 0), Quaternion.identity);
      if (wm) wm.enemies_alive++;
      return name;
    },
  };
})(window.SLS, window.U);
