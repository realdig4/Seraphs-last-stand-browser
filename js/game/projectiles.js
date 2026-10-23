/*
 * projectiles.js - the player's projectiles and abilities (docs: 02-abilities-projectiles.md).
 *
 *   Projectile        prefabs Projectile, Projectile_Homing, Projectile_Triple, ExplosiveProjectile,
 *                     Projectile_Piercing, Projectile_Fragment, FrictionProjectile
 *   ThunderBolt       prefab Thunderbolt          CometExplosion   prefab CometExplosion
 *   SoulRay           prefab SoulRay              BlackHole        prefab BlackHole
 *   FragmenterScript  prefab Fragmenter           WilloWsip        prefab WIllowisp
 *   StreamBeam        on the player rig (Staff/Point/StreamerBeam, built by player.js)
 *   ParticleActivator, Core.ThunderAim (empty in the original)
 *   effect prefabs    ProjectileExplode, ExplosiveProjectileExplode, OrbCharge
 *
 * Every damage call goes through EnemyStats.RemoveHP, like the original. Prefab fields come from
 * SLS.F.prefabs[name].scripts; colliders and bodies from SLS.addPhysicsFromFacts. The look is
 * original (SLS.Art and the drawings below).
 */
'use strict';
(function (SLS, U) {
  const { Vector2, Vector3, Quaternion, Color, Mathf } = U;
  const F = SLS.F;
  const R = U.Render;
  const TAU = Math.PI * 2;
  const f32 = Math.fround;
  const fdt = () => f32(U.Time.fixedDeltaTime);
  const sdt = () => f32(U.Time.deltaTime);

  const MASK_ENEMY = 1 << SLS.Layer.Enemy;   // LayerMask.GetMask("Enemy")
  const MASK_DEFAULT = 1;                     // BlackHole passes the raw mask 1 (Default layer), as compiled

  // ------------------------------------------------------------------ helpers
  function applyFields(target, fields) {
    for (const k of Object.keys(fields || {})) {
      const v = fields[k];
      if (v && typeof v === 'object') target[k] = v.prefab !== undefined ? v.prefab : JSON.parse(JSON.stringify(v));
      else target[k] = v;
    }
  }
  const SfxSource = { PlayOneShot(clip) { if (clip) SLS.sfx(clip); } };
  function findPlayerStats() {
    const p = U.GameObject.FindWithTag(SLS.Tag.Player);
    return p ? p.GetComponent('PlayerStats') : null;
  }
  function enemyStatsOf(go) { return go && !go._destroyed ? go.GetComponent('EnemyStats') : null; }
  function removeHP(es, dmg) { if (es && typeof es.RemoveHP === 'function') es.RemoveHP(dmg); }
  function bleed(es, ps) {   // "wound" cards: bleed_amount += wound_lvl * 0.5 per hit
    if (es && ps && ps.wound_lvl > 0) es.bleed_amount = f32((es.bleed_amount || 0) + ps.wound_lvl * 0.5);
  }
  function enemiesAlive(wm) {
    if (wm && typeof wm.enemies_alive === 'number') return wm.enemies_alive;
    return U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy).length;   // stand-in while waves.js is a stub
  }
  // Projectile.FindNearestEnemy / WilloWsip.FindNearestEnemy (one shared body): smallest squared
  // 3D distance, ties keep the first
  function findNearestEnemy(from, ens) {
    let nearest = null, min = Infinity;
    const p = from.position;
    for (const en of ens) {
      const q = en.transform.position;
      const d = (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y) + ((q.z || 0) - (p.z || 0)) * ((q.z || 0) - (p.z || 0));
      if (d < min) { nearest = en; min = d; }
    }
    return nearest;
  }
  const isWhite = (c) => c.r >= 0.999 && c.g >= 0.999 && c.b >= 0.999;
  const css = (c, a = 1) => 'rgba(' + Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255) + ',' + a + ')';
  function hexRGB(hex) {
    if (!hex || hex[0] !== '#') return [1, 1, 1];
    const n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  // Particles2D clamps alpha to 1: a start alpha of 1/(1-k) fading to 0 holds full alpha until k, like
  // the originals' colour-over-lifetime alpha keys
  const HOLD = (k) => 1 / (1 - k);
  function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function addShape(go, draw, order) {
    const r = go.AddComponent(U.ShapeRenderer);
    r.draw = draw;
    r.sortingOrder = order;
    r.state.born = U.Time.time;
    return r;
  }
  function addParticles(go, cfg) {
    const p = go.AddComponent(U.Particles2D);
    Object.assign(p.cfg, cfg);
    p.sortingOrder = cfg.order || 47;
    return p;
  }
  // a prefab child created while its parent is still inactive (activated together with it)
  function prefabChild(parent, name, tf) {
    const go = new U.GameObject(name, { active: false });
    go.transform.SetParent(parent.transform, false);
    if (tf) {
      go.transform.localPosition = new Vector3(tf.pos.x, tf.pos.y, tf.pos.z);
      go.transform.localScale = new Vector3(tf.scale.x, tf.scale.y, tf.scale.z);
      go.transform.localRotation = Quaternion.Euler(0, 0, tf.rotZ || 0);
    }
    return go;
  }

  // ==================================================================== ParticleActivator
  // Honours the "Particles" option (U.Render.particlesEnabled). Always the last component of a
  // leaf object, so the switch-off in Awake never interrupts the rest of its activation.
  class ParticleActivator extends U.MonoBehaviour {
    Awake() { if (!R.particlesEnabled) this.gameObject.SetActive(false); }
    Activate(value) { this.gameObject.SetActive(value); }
  }

  // Core.ThunderAim: empty in the original (thunder aiming lives in PlayerController)
  class ThunderAim extends U.MonoBehaviour {
    static Init() { }
  }

  // the prefabs' "Trail" child, kept as a follower object; like the original child it is
  // destroyed together with the shot (no lingering streak at the impact point)
  class ProjectileTrail extends U.MonoBehaviour {
    LateUpdate() {
      if (this.target && !this.target._destroyed) { this.transform.position = this.target.position; return; }
      U.Destroy(this.gameObject);
    }
  }

  // ==================================================================== Projectile
  const KIND = {
    Projectile: 'basic', Projectile_Homing: 'homing', Projectile_Triple: 'triple', ExplosiveProjectile: 'explosive',
    Projectile_Piercing: 'piercing', Projectile_Fragment: 'fragment', FrictionProjectile: 'friction',
  };

  class Projectile extends U.MonoBehaviour {
    constructor() {
      super();
      this.player_stats = null;
      this.projectile_explode = 'ProjectileExplode';
      this.explosive_explode = 'ExplosiveProjectileExplode';
      this.black_hole = 'BlackHole';
      this.audio_source = SfxSource;
      this.hit_enemy_audio = 'hit';
      this.hit_projectile_audio = 'cancelHit';
      // .ctor defaults (the prefab values follow in the prefab setup)
      this.hit_count = 1;
      this.can_cancel = true;
      this.can_lifesteal = true;      // never read, as in the original
      this.atk_multiplier = 1;
      this.is_homing = false;
      this.target_enemy = null;
      this.is_explosive = false;
      this.is_friction = false;
      this.can_pull = false;
      this.is_piercing = false;
      this.projectile_generation = 0;
      this.explosion_range = 1.2;
      this.kind = 'basic';
    }

    Awake() {
      this.player_stats = findPlayerStats();
    }

    Start() {
      const ps = this.player_stats;
      if (!ps) { U.Destroy(this.gameObject); return; }    // no player (game over): nothing to fire for
      if (this.is_homing) {
        const enemies = U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy);
        if (enemies.length === 0) this.is_homing = false;
        else this.target_enemy = findNearestEnemy(this.transform, enemies).transform;
      }
      // runs after the spawner's edits, so a hoarder hit_count bonus is overwritten here (as in the original)
      this.hit_count = this.is_friction ? 10 : ps.proj_hits;
      U.Destroy(this.gameObject, 5);
    }

    FixedUpdate() {
      if (this.hit_count < 1) U.Destroy(this.gameObject);   // no return: it still moves this step
      const ps = this.player_stats;
      if (!ps) return;
      const t = this.transform;
      if (!this.is_homing) {
        const r = t.right, dt = fdt();
        const k = this.is_friction ? dt * 6 : dt * ps.projectile_acceleration * 5;
        const p = t.position;
        t.position = new Vector3(p.x + r.x * k, p.y + r.y * k, p.z + r.z * k);
        return;
      }
      if (!this.target_enemy || this.target_enemy._destroyed) {
        const enemies = U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy);
        if (enemies.length === 0) this.is_homing = false;
        else this.target_enemy = findNearestEnemy(t, enemies).transform;
      }
      // with no target left the original throws here; the next step flies straight on
      if (!this.target_enemy || this.target_enemy._destroyed) return;
      t.position = Vector3.MoveTowards(t.position, this.target_enemy.position, ps.projectile_acceleration * 5 * fdt());
    }

    _effect(name, opts) {
      try { SLS.spawn(name, this.transform.position, Quaternion.identity, null, opts || {}); } catch (e) { U.reportError(e, this, 'spawn ' + name); }
    }

    OnTriggerEnter2D(collision) {
      const ps = this.player_stats;
      if (!ps || !collision) return;
      const other = collision.gameObject;
      const color = SLS.Art.projColor(this.kind, U.Time.time);
      if (other.CompareTag(SLS.Tag.Ground)) {
        this.audio_source.PlayOneShot(this.hit_projectile_audio, 0.2);   // the same clip as a cancelled enemy shot
        this._effect(this.projectile_explode, { color });
        if (ps.white_dwarf && this.can_pull && ps.black_hole_cooldown <= 0) {
          U.Instantiate(this.black_hole, this.transform.position, Quaternion.identity);
          ps.black_hole_cooldown = 1;
        }
        U.Destroy(this.gameObject);        // no return: the tag tests below simply fail
      }
      if (other.CompareTag(SLS.Tag.ProjectileEnemy) && this.can_cancel) {
        this.hit_count--;
        this.audio_source.PlayOneShot(this.hit_projectile_audio, 0.2);
        if (ps.pacman) this.atk_multiplier = f32(this.atk_multiplier * 1.25);
      }
      if (!other.CompareTag(SLS.Tag.Enemy)) return;
      const es = enemyStatsOf(other);
      if (!es) return;
      // direct hit
      if (!this.is_friction) removeHP(es, (ps.atk_damage + ps.rage_damage) * this.atk_multiplier);
      else removeHP(es, ps.friction_lvl);
      if (this.is_explosive) {
        this._effect(this.explosive_explode, { color, radius: ps.anti_air && ps.staff !== 3 ? 2 : this.explosion_range });
        if (ps.anti_air && ps.staff !== 3) this.explosion_range = 2;
        const pos = this.transform.position;
        for (const hit of U.Physics2D.OverlapCircleAll(new Vector2(pos.x, pos.y), this.explosion_range, MASK_ENEMY)) {
          if (!hit.CompareTag(SLS.Tag.Enemy)) continue;
          U.Debug.Log('Explosive ' + hit.name);
          // no lower bound on the distance, as in the original (next to the pivot the splash soars)
          const d = Vector2.Distance(this.transform.position, hit.transform.position);
          const hes = enemyStatsOf(hit.gameObject);
          if (!hes) return;
          if (!this.is_friction) removeHP(hes, (ps.atk_damage + ps.rage_damage) * this.atk_multiplier * 0.5 / d);
          else removeHP(hes, ps.friction_lvl * this.atk_multiplier * 0.2 / d);
          bleed(hes, ps);
        }
        // no sound of its own: the single hit_enemy_audio below is the explosion's only sound
      }
      bleed(es, ps);
      if (!other._destroyed) {
        // RangedBehavior.BlinkHit, inlined in the original (which throws without a RangedBehavior)
        const rb = other.GetComponent('RangedBehavior');
        if (!rb) return;
        if (typeof rb.BlinkHit === 'function') rb.BlinkHit();
        else {
          const sr = rb.GetComponentInChildren(U.ShapeRenderer);
          if (sr) sr.color = new Color(1, 0, 0, 1);
          if (typeof rb.ReturnColor === 'function') rb.Invoke('ReturnColor', 0.06);
        }
      }
      this.audio_source.PlayOneShot(this.hit_enemy_audio, 0.6);
      es.projectile_generation = this.projectile_generation;
      this._effect(this.projectile_explode, { color });
      if (!this.is_piercing) U.Destroy(this.gameObject);
    }

    FindNearestEnemy(ens) { return findNearestEnemy(this.transform, ens); }
  }

  function drawOrb(ctx, col) {
    R.drawGlow(ctx, 0, 0, 1.4, col, 0.8);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(0, 0, 0.48, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, 0.26, 0, TAU); ctx.fill();
  }
  function drawProjectile(ctx, r) {
    const s = r.state, t = U.Time.time;
    // the Projectile sprite with the prefab tint; a code-set colour (RAM Destroyer fragments (0,1,1)) replaces it
    if (isWhite(r.color)) { if (SLS.Art.projectile(ctx, s.kind, { t })) return; }
    else if (U.Assets.drawTinted(ctx, SLS.Sprites.projectile, css(r.color), { smooth: true })) return;
    else drawOrb(ctx, css(r.color));
    // procedural fallback only: the original marks a charged (hoarder) shot by its scale alone
    const p = s.proj;
    if (p && p.is_explosive && s.kind !== 'explosive' && s.kind !== 'friction') {
      ctx.strokeStyle = 'rgba(255,90,60,0.95)';
      ctx.lineWidth = 0.14;
      ctx.beginPath(); ctx.arc(0, 0, 0.68 + Math.sin(t * 22) * 0.06, 0, TAU); ctx.stroke();
    }
  }

  // the prefabs' "Trail" particles: world space, 100/s, lifetime 0.1-0.5, size 0.02-0.04 (homing
  // 0.005-0.02), cone along +z (no xy drift), start colour x colour over lifetime, alpha held to 65 %
  function makeTrail(go, kind) {
    if (!R.particlesEnabled) return;    // the Trail child is switched off by its ParticleActivator
    const c = SLS.Art.trailColor(kind), a = c.start, b = c.end;
    const trail = new U.GameObject('Trail', { active: false });
    trail.transform.position = go.transform.position;
    const fx = addParticles(trail, {
      rate: 100, lifetime: [0.1, 0.5], speed: [0, 0.05], spread: 360, shape: 'circle', radius: 0.042,
      size: kind === 'homing' ? [0.005, 0.02] : [0.02, 0.04], sizeEnd: 1,
      colorStart: [a[0], a[1], a[2], HOLD(0.65)], colorEnd: [b[0], b[1], b[2], 0], max: 60, order: 29,
    });
    const follow = trail.AddComponent(ProjectileTrail);
    follow.target = go.transform;
    follow.fx = fx;
    trail.SetActive(true);
  }

  for (const name of Object.keys(KIND)) {
    SLS.registerPrefab(name, (go) => {
      const facts = F.prefabs[name];
      const kind = KIND[name];
      go.tag = SLS.Tag.Projectile;
      SLS.addPhysicsFromFacts(go, facts);
      const p = go.AddComponent(Projectile);
      applyFields(p, facts.scripts.Projectile);
      p.kind = kind;
      if (kind === 'homing') p.hit_enemy_audio = 'homingHit';
      const r = addShape(go, drawProjectile, 30);
      r.state.kind = kind;
      r.state.proj = p;
      makeTrail(go, kind);
    });
  }

  // ==================================================================== ThunderBolt
  class ThunderBolt extends U.MonoBehaviour {
    constructor() {
      super();
      this.can_damage = true;
      this.can_pull = false;
      this.black_hole = 'BlackHole';
      this.thunder_damage = 0;
      this.player_stats = null;
    }
    Awake() { this.player_stats = findPlayerStats(); }
    Start() {
      const ps = this.player_stats;
      if (!ps) return;
      this.thunder_damage = f32(this.thunder_damage + ps.thunder_projs);
      if (ps.thundergod) this.GetComponent(U.ShapeRenderer).color = new Color(1, 0, 0, 1);
    }
    FixedUpdate() {   // falls at 20 units/s toward y = -1
      const p = this.transform.position;
      this.transform.position = Vector3.MoveTowards(p, new Vector3(p.x, -1, p.z), fdt() * 20);
    }
    OnCollisionEnter2D() { }
    _vanish() {
      this.GetComponent(U.BoxCollider2D).enabled = false;
      this.GetComponent(U.ShapeRenderer).enabled = false;
    }
    OnTriggerEnter2D(collision) {
      const ps = this.player_stats;
      const other = collision.gameObject;
      if (other.CompareTag(SLS.Tag.Enemy) && this.can_damage) {
        this.can_damage = false;
        this._vanish();
        const es = enemyStatsOf(other);
        if (es && ps) {
          removeHP(es, ps.thundergod ? this.thunder_damage * 3 : this.thunder_damage);
          bleed(es, ps);
        }
        U.Destroy(this.gameObject, 0.5);
      }
      if (other.CompareTag(SLS.Tag.Ground)) {
        this._vanish();
        if (this.can_pull) U.Instantiate(this.black_hole, this.transform.position, Quaternion.identity);
        this.can_pull = false;
        U.Destroy(this.gameObject, 1);
        this.can_damage = false;
      }
      if (other.CompareTag(SLS.Tag.Player)) {
        this._vanish();
        U.Destroy(this.gameObject, 1);
        this.can_damage = false;
      }
    }
  }

  function drawBolt(ctx, r) {
    const s = r.state, red = r.color.g < 0.5 && r.color.r > 0.5;
    if (SLS.Art.thunderboltSprite(ctx, red)) return;
    const len = s.len, cy = s.cy, top = cy + len / 2, bot = cy - len / 2;
    const seed = Math.floor(U.Time.time * 30) * 31 + s.seed;
    const n = 14;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const passes = red
      ? [[0.11, 'rgba(255,60,40,0.35)'], [0.05, '#ff7a5c'], [0.02, '#fff0ec']]
      : [[0.11, 'rgba(255,240,120,0.35)'], [0.05, '#fff6a0'], [0.02, '#ffffff']];
    for (const [w, col] of passes) {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(0, top);
      for (let i = 1; i <= n; i++) ctx.lineTo(i === n ? 0 : (hash(seed + i) - 0.5) * 0.16, top - (i / n) * len);
      ctx.stroke();
    }
    ctx.restore();
    R.drawGlow(ctx, 0, bot, 0.3, red ? 'rgba(255,80,60,1)' : 'rgba(255,240,150,1)', 0.9);
  }

  SLS.registerPrefab('Thunderbolt', (go) => {
    const facts = F.prefabs.Thunderbolt;
    go.tag = SLS.Tag.Projectile;
    SLS.addPhysicsFromFacts(go, facts);
    const tb = go.AddComponent(ThunderBolt);
    applyFields(tb, facts.scripts.ThunderBolt);
    const box = facts.colliders[0];
    const r = addShape(go, drawBolt, 35);
    Object.assign(r.state, { len: box.size.y, cy: box.offset.y, seed: Math.floor(Math.random() * 1000) });
    // "Particle System" child: 20/s for 1 s over a 0.45 x 7.7 world box (scaling mode Local, so the
    // root's (2.266, 1.698) is divided out here), world space, life 1, #affde0 -> white, alpha held to 28 %
    const ps = prefabChild(go, 'Particle System', facts.children['Particle System'].transform);
    const sc = facts.transform.scale;
    addParticles(ps, {
      rate: 20, loop: false, duration: 1, lifetime: 1, speed: 0, spread: 360, shape: 'box', box: [0.45 / sc.x, 7.7 / sc.y],
      size: [0.05, 0.1], sizeEnd: 1, colorStart: [0.686, 0.992, 0.878, HOLD(0.28)], colorEnd: [1, 1, 1, 0], gravity: 0.196,
      max: 40, order: 36,
    });
    ps.AddComponent(ParticleActivator);
    ps.SetActive(true);
  });

  // ==================================================================== CometExplosion
  class CometExplosion extends U.MonoBehaviour {
    constructor() { super(); this.explosion_damage = 0; this.explosion_size = 0; this.player_stats = null; }
    Start() {
      this.player_stats = findPlayerStats();
      this.transform.localScale = this.transform.localScale.mul(this.explosion_size);
      U.Destroy(this.gameObject, 0.3);   // silent: neither the prefab nor PlayerController plays a landing sound
      // the particles use scaling mode Local (a fixed 0.339 x 4 sphere): divide out the root's scale
      const fx = this._fx, k = Math.abs(this.transform.localScale.x) * 4;
      if (fx && k > 1e-6) for (const p of fx) p.cfg.radius = 0.3393 * 4 / k;
    }
    Update() { }
    OnTriggerEnter2D(collision) {
      if (!collision.CompareTag(SLS.Tag.Enemy)) return;
      removeHP(enemyStatsOf(collision.gameObject), this.explosion_damage);
      bleed(enemyStatsOf(collision.gameObject), this.player_stats);   // player_stats is set in Start
    }
  }
  // Animator: colour (0.613,0.101,0.101,0) -> (1,0.524,0,0.212) @0.083 s -> (1,0.843,0,0) @0.5 s
  const COMET_KEYS = [[0, 0.613, 0.101, 0.101, 0], [0.083, 1, 0.524, 0, 0.212], [0.5, 1, 0.843, 0, 0]];
  function cometColor(age) {
    const K = COMET_KEYS;
    let i = 0;
    while (i < K.length - 2 && age > K[i + 1][0]) i++;
    const a = K[i], b = K[i + 1], t = Mathf.Clamp01((age - a[0]) / (b[0] - a[0]));
    return [1, 2, 3, 4].map((c) => a[c] + (b[c] - a[c]) * t);
  }
  function drawComet(ctx, r) {
    const age = U.Time.time - r.state.born;
    // tint quantised to 1/50 s so the tint cache stays small
    const c = cometColor(Math.round(age * 50) / 50), ca = cometColor(age)[3];
    if (SLS.Art.cometSprite(ctx, 'rgb(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ')', ca)) return;
    const k = Mathf.Clamp01(age / 0.3), a = 1 - k;
    const rad = 0.1 * (0.35 + 0.65 * Math.sqrt(k));
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
    g.addColorStop(0, 'rgba(255,250,225,' + 0.6 * a + ')');
    g.addColorStop(0.65, 'rgba(255,175,80,' + 0.35 * a + ')');
    g.addColorStop(1, 'rgba(255,110,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, rad, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,232,170,' + a + ')';
    ctx.lineWidth = 0.008;
    ctx.beginPath(); ctx.arc(0, 0, rad, 0, TAU); ctx.stroke();
  }
  SLS.registerPrefab('CometExplosion', (go) => {
    const facts = F.prefabs.CometExplosion;
    go.tag = SLS.Tag.Projectile;
    SLS.addPhysicsFromFacts(go, facts);
    const ce = go.AddComponent(CometExplosion);
    applyFields(ce, facts.scripts.CometExplosion);
    addShape(go, drawComet, 36);
    // "Particle System": 1000/s for 0.3 s (max 400), life 0.3, speed 2 out of a sphere, size 0.01-0.05 x4,
    // gravity -0.7 (rises); colour random between two gradients: #ff9700 -> #ff1900, and
    // #8c533c -> #ffa900 with alpha held to 28 %
    const ps = prefabChild(go, 'Particle System', facts.children['Particle System'].transform);
    const base = { rate: 500, loop: false, duration: 0.3, lifetime: 0.3, speed: [0.5, 2], spread: 360, shape: 'circle',
      radius: 0.02, size: [0.04, 0.2], sizeEnd: 1, gravity: 6.87, max: 200, order: 37 };
    ce._fx = [
      addParticles(ps, Object.assign({}, base, { colorStart: [1, 0.592, 0, 1], colorEnd: [1, 0.098, 0, 1] })),
      addParticles(ps, Object.assign({}, base, { colorStart: [0.549, 0.325, 0.235, HOLD(0.28)], colorEnd: [1, 0.663, 0, 0] })),
    ];
    ps.AddComponent(ParticleActivator);
    ps.SetActive(true);
  });

  // ==================================================================== SoulRay
  class SoulRay extends U.MonoBehaviour {
    constructor() { super(); this.soul_ray_damage = 0; this.player_stats = null; }
    Start() {
      this.player_stats = findPlayerStats();
      if (this.player_stats) this.soul_ray_damage = (this.player_stats.soul_orb_level + 2) * 5;   // integer maths
      U.Destroy(this.gameObject, 0.5);
    }
    Update() { }
    OnTriggerEnter2D(collision) {
      if (!collision.CompareTag(SLS.Tag.Enemy)) return;
      const es = enemyStatsOf(collision.gameObject);
      removeHP(es, this.soul_ray_damage);
      bleed(es, this.player_stats);
    }
  }
  // Animator: colour alpha 0.639 -> 0.949 @0.167 s -> 0 @0.833 s (destroyed at 0.5 s)
  function soulRayAlpha(age) {
    return age < 0.167 ? 0.639 + (0.949 - 0.639) * Math.max(0, age) / 0.167 : 0.949 * Mathf.Clamp01(1 - (age - 0.167) / 0.666);
  }
  function drawSoulRay(ctx, r) {
    const age = U.Time.time - r.state.born;
    if (SLS.Art.soulRay(ctx, { alpha: soulRayAlpha(age) })) return;
    const a = Mathf.Clamp01(1 - age / 0.5);
    ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
    ctx.fillRect(-0.08, -0.5, 0.16, 1);
  }
  SLS.registerPrefab('SoulRay', (go) => {
    const facts = F.prefabs.SoulRay;
    go.tag = SLS.Tag.Projectile;
    SLS.addPhysicsFromFacts(go, facts);
    go.AddComponent(SoulRay);
    addShape(go, drawSoulRay, 36);
    // "Particle System": 1000/s for 0.5 s (max 400) over a 1 x 25 world box (scaling mode Local: the root's
    // (0.352, 31.8) is divided out), life 0.5, gravity -1 (rises), #518cf3 -> white, alpha held to 28 %
    const ps = prefabChild(go, 'Particle System', facts.children['Particle System'].transform);
    const sc = facts.transform.scale;
    addParticles(ps, {
      rate: 800, loop: false, duration: 0.5, lifetime: 0.5, speed: 0, spread: 360, shape: 'box', box: [1 / sc.x, 25 / sc.y],
      size: [0.05, 0.1], sizeEnd: 1, colorStart: [0.318, 0.549, 0.953, HOLD(0.28)], colorEnd: [1, 1, 1, 0], gravity: 9.81,
      max: 400, order: 37,
    });
    ps.AddComponent(ParticleActivator);
    ps.SetActive(true);
  });

  // ==================================================================== BlackHole
  class BlackHole extends U.MonoBehaviour {
    Start() { U.Destroy(this.gameObject, 3); }
    Update() {   // every rendered frame, like the original
      const pos = this.transform.position;
      for (const hit of U.Physics2D.OverlapCircleAll(new Vector2(pos.x, pos.y), 9, MASK_DEFAULT)) {
        if (!hit.CompareTag(SLS.Tag.Enemy)) continue;
        const rb = hit.GetComponent(U.Rigidbody2D);
        const hp = hit.transform.position;
        const d = Vector2.Distance(pos, hp);
        if (!rb) return;
        rb.AddForce(new Vector2((pos.x - hp.x) * 1.3 / d, (pos.y - hp.y) * 1.3 / d), U.ForceMode2D.Force);
      }
    }
  }
  function drawBlackHole(ctx, r) {
    if (SLS.Art.blackHoleSprite(ctx)) return;
    const age = U.Time.time - r.state.born;
    ctx.globalAlpha *= Mathf.Clamp01(Math.min(age * 6, (3 - age) * 3));
    ctx.scale(2.6, 2.6);
    SLS.Art.blackHole(ctx, { t: U.Time.time });
  }
  SLS.registerPrefab('BlackHole', (go) => {
    const facts = F.prefabs.BlackHole;
    go.tag = SLS.Tag.BlackHole;
    go.AddComponent(BlackHole);
    addShape(go, drawBlackHole, 28);
    // "Particle System" (rotZ -315): 100/s, life 2, speed 0.1, size 0.01-0.07 -> 0, #ff19ce -> black with
    // alpha held to 25 %; a sphere of radius 5.72 squashed by the shape scale (0.0465, 0.44) and scaling
    // mode Local, i.e. a 0.53 x 5 world ellipse at 45 degrees (the root's 0.3 is divided out here)
    const pfx = facts.children['Particle System'].transform;
    const ps = prefabChild(go, 'Particle System', pfx);
    const k = facts.transform.scale.x;
    ps.transform.localScale = new Vector3(5.72 * 0.0465 / k, 5.72 * 0.44 / k, 1);
    addParticles(ps, {
      rate: 100, lifetime: 2, speed: [0, 0.1], spread: 360, shape: 'circle', radius: 1, size: [0.01, 0.07], sizeEnd: 0,
      colorStart: [1, 0.098, 0.806, HOLD(0.25)], colorEnd: [0, 0, 0, 0], max: 220, order: 29,
    });
    ps.AddComponent(ParticleActivator);
    ps.SetActive(true);
  });

  // ==================================================================== FragmenterScript
  class FragmenterScript extends U.MonoBehaviour {
    constructor() { super(); this._player = null; this.projectile_generation = 0; this.fragment_projectile = null; this.player_stats = null; }
    Awake() {
      this._player = U.GameObject.FindWithTag(SLS.Tag.Player);
      this.player_stats = this._player ? this._player.GetComponent('PlayerStats') : null;
    }
    Start() {
      if (!this._player || this._player._destroyed || !this.player_stats) { U.Destroy(this.gameObject); return; }
      this.fragment_projectile = this._player.GetComponent('PlayerController').fragment_projectile;
      this.Fragmentation();
      U.Destroy(this.gameObject);
    }
    Update() { }
    Fragmentation() {
      const ps = this.player_stats;
      // proj_fragments is a float: ceil(proj_fragments) fragments
      for (let i = 0; i < ps.proj_fragments; i++) {
        const frag = U.Instantiate(this.fragment_projectile, this.transform.position, Quaternion.identity);
        const p = frag.GetComponent(Projectile);
        if (!ps.ram_destroyer) p.atk_multiplier = f32(p.atk_multiplier / this.projectile_generation);
        else {
          p.atk_multiplier = f32(p.atk_multiplier - f32(f32(p.atk_multiplier * f32(0.1)) * this.projectile_generation));
          frag.GetComponent(U.ShapeRenderer).color = new Color(0, 1, 1, 1);
        }
        frag.transform.Rotate(0, 0, U.Random.RangeInt(0, 360));   // whole degrees 0..359
      }
    }
  }
  SLS.registerPrefab('Fragmenter', (go) => {
    const fs = go.AddComponent(FragmenterScript);
    applyFields(fs, F.prefabs.Fragmenter.scripts.FragmenterScript);
  });

  // ==================================================================== WilloWsip
  class WilloWsip extends U.MonoBehaviour {
    constructor() {
      super();
      this.player_stats = null; this.player_controller = null; this.wave_manager = null;
      this.willo_number = 1;
      this.attack_cooldown = 0;
      this.audio_source = SfxSource;
      this.shoot_audio = 'enemyShoot';   // the prefab's clip is projectile_launch (the ranged enemies' one), not the player's
      this.target_enemy = null;
      this.position_ = 0; this.rand_offset_x = 0; this.rand_offset_y = 0;
    }
    Awake() { }
    Start() {
      this.player_stats = findPlayerStats();
      this.player_controller = this.player_stats ? this.player_stats.gameObject.GetComponent('PlayerController') : null;
      this.wave_manager = SLS.Game.waveManager;
      this.rand_offset_x = U.Random.Range(-0.2, 0.2);
      this.rand_offset_y = U.Random.Range(-0.2, 0.2);
    }
    FixedUpdate() {
      const ps = this.player_stats, pc = this.player_controller;
      if (!ps || ps._destroyed || !pc) return;
      const t = this.transform;
      if (!ps.enchanter) {
        // beside the player, switching to the left side near the right edge; each wisp 0.7 further out
        this.position_ = t.position.x > 7.3 ? -0.7 : 0.7;
        const pp = ps.gameObject.transform.position;
        t.position = Vector3.Lerp(t.position, new Vector3(pp.x + this.willo_number * this.position_, pp.y + 0.45, 0), fdt() * 0.3);
      } else {
        const sp = pc.staff_point.transform.position;
        t.position = Vector3.Lerp(t.position, new Vector3(sp.x + this.rand_offset_x, sp.y + this.rand_offset_y, 0), fdt() * 10);
      }
      const alive = (go) => go && !go._destroyed;
      if (!alive(this.target_enemy) && enemiesAlive(this.wave_manager || SLS.Game.waveManager) !== 0) {
        this.target_enemy = findNearestEnemy(t, U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy));
      }
      if (!alive(this.target_enemy)) return;
      this.Shoot();
      if (!ps.enchanter) this.RotateTowardsEnemy();
      else this.RotateTowardsMouse();
    }
    Shoot() {
      const ps = this.player_stats;
      if (this.attack_cooldown <= 0) {
        this.audio_source.PlayOneShot(this.shoot_audio, 0.2);
        const p = U.Instantiate(this.player_controller.projectile, this.transform.position, this.transform.rotation);
        p.transform.localScale = p.transform.localScale.mul(ps.proj_size);
        const pr = p.GetComponent(Projectile);
        if (pr) pr.atk_multiplier = f32(pr.atk_multiplier * 0.5);
        this.attack_cooldown = f32(ps.atk_speed + ps.atk_speed);
      } else if (this.attack_cooldown > 0) {
        this.attack_cooldown = f32(this.attack_cooldown - sdt());
      }
    }
    RotateTowardsEnemy() {
      const a = this.target_enemy.transform.position, b = this.transform.position;
      this.transform.right = new Vector3(a.x - b.x, a.y - b.y, 0);
    }
    RotateTowardsMouse() {
      this.transform.rotation = Quaternion.AngleAxis(this.player_controller.staffAngle, Vector3.forward);
    }
    FindNearestEnemy(ens) { return findNearestEnemy(this.transform, ens); }
  }
  function drawWisp(ctx, r) {
    if (SLS.Art.wispSprite(ctx)) return;      // Graphics: sprite Willowisp, turned with the wisp
    const m = r.transform.worldMatrix;
    ctx.rotate(-Math.atan2(m[1], m[0]));     // the flame stays upright while the wisp turns to aim
    const t = U.Time.time + r.state.seed;
    const fl = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.05;
    R.drawGlow(ctx, 0, 0, 0.34 * fl, 'rgba(150,230,255,1)', 0.85);
    ctx.fillStyle = 'rgba(190,245,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(-0.065, 0);
    ctx.quadraticCurveTo(-0.06, 0.12, Math.sin(t * 6) * 0.035, 0.22 * fl);
    ctx.quadraticCurveTo(0.06, 0.12, 0.065, 0);
    ctx.arc(0, 0, 0.065, 0, Math.PI, true);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, -0.004, 0.035, 0, TAU); ctx.fill();
  }
  SLS.registerPrefab('WIllowisp', (go) => {
    const facts = F.prefabs.WIllowisp;
    const w = go.AddComponent(WilloWsip);
    applyFields(w, facts.scripts.WilloWsip);
    const g = prefabChild(go, 'Graphics', facts.children.Graphics.transform);
    const r = addShape(g, drawWisp, 34);
    r.state.seed = Math.random() * 10;
    g.SetActive(true);
  });

  // ==================================================================== StreamBeam (on the player rig)
  class StreamBeam extends U.MonoBehaviour {
    constructor() { super(); this.player_stats = null; this.player_controller = null; this.damage_cooldown = 0; }
    Start() {
      this.player_stats = findPlayerStats();
      this.player_controller = this.player_stats ? this.player_stats.GetComponent('PlayerController') : null;
    }
    Update() {
      if (this.player_controller) this.transform.position = this.player_controller.staff_point.transform.position;
    }
    OnTriggerStay2D(collision) {
      if (!collision.CompareTag(SLS.Tag.Enemy) || !this.player_stats) return;
      const es = enemyStatsOf(collision.gameObject);
      if (!es || es.beam_cd > 0) return;
      removeHP(es, 3);
      es.beam_cd = this.player_stats.atk_speed;   // counted down by EnemyStats while streamer is on
    }
  }

  // ==================================================================== effect prefabs
  // ProjectileExplode / ExplosiveProjectileExplode: one 2000/s burst (50 / 100 particles) out of a 0.161
  // radius cone of 25 degrees facing the camera (xy speed up to speed x sin 25), lifetime = duration,
  // colour random between two constants, alpha held to 58 %. The shot's colour is not used.
  function explodeBurst(go, n, life, speed, size, colA, colB) {
    const base = { rate: 0, loop: false, duration: 0.05, lifetime: life, speed: [0, speed * Math.sin(25 * Mathf.Deg2Rad)],
      spread: 360, shape: 'circle', radius: 0.161, size, sizeEnd: 1, order: 47 };
    for (const c of [colA, colB]) {
      addParticles(go, Object.assign({}, base, { bursts: [{ time: 0, count: n / 2 }],
        colorStart: [c[0], c[1], c[2], HOLD(0.58)], colorEnd: [c[0], c[1], c[2], 0] }));
    }
  }
  SLS.registerPrefab('ProjectileExplode', (go) => {
    explodeBurst(go, 50, 0.5, 3, [0.01, 0.05], hexRGB('#a7ff00'), hexRGB('#ffc300'));
    go.AddComponent(ParticleActivator);
    U.Destroy(go, 0.6);
  });

  SLS.registerPrefab('ExplosiveProjectileExplode', (go) => {
    explodeBurst(go, 100, 0.8, 5, [0.02, 0.08], hexRGB('#ffd000'), hexRGB('#ff4300'));
    go.AddComponent(ParticleActivator);
    U.Destroy(go, 0.9);
  });

  SLS.registerPrefab('OrbCharge', (go) => {
    const facts = F.prefabs.OrbCharge;
    go.tag = SLS.Tag.OrbCharge;
    // Instantiate(orb_charge_effect, player.transform) keeps the prefab's local placement (at the feet)
    const lp = go.transform.localPosition;
    if (go.transform.parent && lp.x === 0 && lp.y === 0) go.transform.localPosition = new Vector3(facts.transform.pos.x, facts.transform.pos.y, 0);
    // 10/s, life 1, no speed, gravity -0.1 (rises), size 0.02-0.07, #eeff00 -> #4cff00 (alpha 0.69 to 70 %),
    // emitted in an upright cone ~0.5 wide (the box is in this object's (0.366, 1) scaled space)
    const sx = facts.transform.scale.x || 1;
    addParticles(go, {
      rate: 10, lifetime: 1, speed: 0, spread: 360, shape: 'box', box: [0.5 / sx, 0.3], gravity: 0.98,
      size: [0.02, 0.07], sizeEnd: 1, colorStart: [0.933, 1, 0, 0.9], colorEnd: [0.298, 1, 0, 0], max: 30, order: 45,
    });
    go.AddComponent(ParticleActivator);
  });

  // ==================================================================== exports
  Object.assign(SLS, { Projectile, ThunderBolt, CometExplosion, SoulRay, BlackHole, FragmenterScript, WilloWsip, StreamBeam, ParticleActivator, ThunderAim });
  SLS.Core = SLS.Core || {};
  SLS.Core.ThunderAim = ThunderAim;
  if (typeof U.registerScript === 'function') {
    for (const C of [Projectile, ThunderBolt, CometExplosion, SoulRay, BlackHole, FragmenterScript, WilloWsip, StreamBeam, ParticleActivator]) U.registerScript(C);
  }
})(window.SLS, window.U);
