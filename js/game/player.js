/*
 * player.js - the player: PlayerController and PlayerStats (docs: 01-player.md) and the player
 * rig, built from SLS.F.player at boot (startup order 20).
 *
 * Mechanics follow the original scripts: same fields, formulas, thresholds and call graph.
 * Timers use float32 arithmetic (Math.fround) like Unity, so shot intervals, the comet's 0.7 s
 * threshold and the other cooldowns end on the same physics steps as in the original.
 * Prefab references are stored as prefab-name strings ('Projectile', 'Thunderbolt', ...), which
 * U.Instantiate / SLS.spawn accept. The rig draws the original sprites (U.Assets) when they are
 * loaded and falls back to the procedural art (SLS.Art plus the drawings below) otherwise.
 */
'use strict';
(function (SLS, U) {
  const { Vector2, Vector3, Quaternion, Color, Mathf } = U;
  const F = SLS.F;
  const PF = F.player;
  const R = U.Render;
  const As = U.Assets;
  const TAU = Math.PI * 2;
  const f32 = Math.fround;
  const fdt = () => f32(U.Time.fixedDeltaTime);
  const sdt = () => f32(U.Time.deltaTime);

  const MASK_AIM = (1 << SLS.Layer.Enemy) | (1 << SLS.Layer.Ground); // LayerMask.GetMask("Enemy", "Ground")
  const MASK_BURNING = 1;            // BurningMan passes the raw mask 1 (Default layer), as compiled
  const THUNDER_Y = 9.75;            // spawn height of every thunder bolt
  // Move() spawns friction shots with the literal Quaternion(90, 90, 0, 0); normalised it turns
  // transform.right straight up.
  const FRICTION_ROTATION = new Quaternion(Math.SQRT1_2, Math.SQRT1_2, 0, 0);
  const C_0_7 = f32(0.7), C_0_05 = f32(0.05), C_0_0085 = f32(0.0085), C_2_2 = f32(2.2);

  // ------------------------------------------------------------------ text (original wording)
  SLS.addStrings('en', {
    'player.staff.300.desc': 'Fires one bolt every 0.9 s at full damage.',
    'player.staff.301.desc': 'Every 0.63 s, launches a shard that slides straight toward the nearest enemy, dealing 50% damage.',
    'player.staff.302.desc': 'Every 1.38 s, fires three bolts in a 44° fan, each dealing 50% damage.',
    'player.staff.303.desc': 'Every 1.7 s, fires a shell dealing 42% damage that bursts on impact and also hurts enemies within 1.2 units (more the closer they are).',
    'player.staff.304.desc': 'Every 2.9 s, calls lightning down onto the aimed spot. It strikes the first enemy for 10 + your damage.',
    'player.staff.305.desc': 'Every 0.55 s, throws an ice needle that passes through enemies, dealing 25% damage to each.',
    'player.staff.306.desc': 'Fires every 1 s. Each shot is a random kind: plain, explosive, seeking, triple or piercing.',
    'player.hat.200.desc': 'A classic. No special effect.',
    'player.hat.201.desc': 'Blocks 6% of incoming damage, but you move at half speed.',
    'player.hat.202.desc': 'Grants one extra jump in mid-air, and every jump reaches full height.',
    'player.hat.203.desc': 'Every card offered in the shop comes from the rare pool.',
    'player.hat.204.desc': 'Waves bring twice as many foes, but each card you take has a 20% chance to count twice.',
    'player.hat.205.desc': 'Shop rerolls are free, but runs with this hat stay off the scoreboard.',
  });
  SLS.addStrings('pt', {
    'player.staff.300.desc': 'Dispara um projétil a cada 0,9 s com dano total.',
    'player.staff.301.desc': 'A cada 0,63 s, lança um fragmento que desliza direto até o inimigo mais próximo, causando 50% de dano.',
    'player.staff.302.desc': 'A cada 1,38 s, dispara três projéteis em leque de 44°, cada um com 50% de dano.',
    'player.staff.303.desc': 'A cada 1,7 s, dispara uma carga com 42% de dano que explode no impacto e também fere inimigos a até 1,2 de distância (mais quanto mais perto).',
    'player.staff.304.desc': 'A cada 2,9 s, invoca um raio sobre o ponto mirado. Ele atinge o primeiro inimigo com 10 + o seu dano.',
    'player.staff.305.desc': 'A cada 0,55 s, arremessa uma agulha de gelo que atravessa os inimigos, causando 25% de dano em cada um.',
    'player.staff.306.desc': 'Dispara a cada 1 s. Cada tiro é de um tipo aleatório: comum, explosivo, teleguiado, triplo ou perfurante.',
    'player.hat.200.desc': 'Um clássico. Sem efeito especial.',
    'player.hat.201.desc': 'Bloqueia 6% do dano recebido, mas você anda na metade da velocidade.',
    'player.hat.202.desc': 'Concede um pulo extra no ar, e todo pulo alcança a altura máxima.',
    'player.hat.203.desc': 'Toda carta oferecida na loja vem do grupo das raras.',
    'player.hat.204.desc': 'As ondas trazem o dobro de inimigos, mas cada carta escolhida tem 20% de chance de valer em dobro.',
    'player.hat.205.desc': 'Trocar as cartas da loja é grátis, mas partidas com este chapéu ficam fora do placar.',
  });

  // ------------------------------------------------------------------ helpers
  // SLS.addStartup lives in main.js, which loads after this file: register once all scripts ran.
  function onBoot(order, fn) {
    if (typeof SLS.addStartup === 'function') SLS.addStartup(order, fn);
    else document.addEventListener('DOMContentLoaded', () => SLS.addStartup(order, fn));
  }
  // copy serialized script fields from the facts; {prefab: 'X'} references become 'X'
  function applyFields(target, fields) {
    for (const k of Object.keys(fields || {})) {
      const v = fields[k];
      if (v && typeof v === 'object') target[k] = v.prefab !== undefined ? v.prefab : JSON.parse(JSON.stringify(v));
      else target[k] = v;
    }
  }
  // AudioSource stand-in: clips are SLS.sfx names
  const SfxSource = { PlayOneShot(clip) { if (clip) SLS.sfx(clip); } };
  // stand-ins for the original's menu widgets (Text / GameObject); the menus module reads them
  const uiText = () => ({ text: '' });
  const uiObject = () => ({ activeSelf: false, SetActive(v) { this.activeSelf = !!v; } });
  const descText = () => ({
    key: null, raw: '',
    get text() { return this.key ? SLS.T(this.key) : this.raw; },
    set text(v) { this.key = null; this.raw = v; },
  });
  const isGamepad = () => U.Input.lastDevice === 'gamepad';
  const isJumpPressed = () => { const a = U.Input.action('Jump'); return !!(a && a.IsPressed()); };

  // a class published by another module (SLS.X, the live instance's class, or a global declaration)
  function moduleClass(name) {
    if (typeof SLS[name] === 'function') return SLS[name];
    const inst = name === 'ShopManager' ? SLS.Game.shopManager : name === 'WaveManager' ? SLS.Game.waveManager : null;
    if (inst && inst.constructor && inst.constructor !== Object) return inst.constructor;
    try { return Function('return typeof ' + name + ' === "function" ? ' + name + ' : null')(); } catch (e) { return null; }
  }
  function shopOnScreen() {
    const C = moduleClass('ShopManager');
    if (C && C.OnScreen !== undefined) return !!C.OnScreen;
    const sm = SLS.Game.shopManager;
    return !!(sm && sm.OnScreen);
  }
  function transcendenceOnScreen() {
    const C = moduleClass('Transcendence');
    return !!(C && C.OnScreen);
  }
  // ShopManager.OnOpen += handler (array, Set-like, or a plain delegate field like the original)
  function subscribeShopOpen(handler) {
    const C = moduleClass('ShopManager');
    if (!C) return false;
    const cur = C.OnOpen;
    if (Array.isArray(cur)) { if (!cur.includes(handler)) cur.push(handler); return true; }
    if (cur && typeof cur.add === 'function') { cur.add(handler); return true; }
    if (cur && cur._handlers) { if (!cur._handlers.includes(handler)) cur._handlers.push(handler); return true; }
    const handlers = typeof cur === 'function' ? [cur, handler] : [handler];
    const combined = function (value) { for (const h of [...combined._handlers]) h(value); };
    combined._handlers = handlers;
    C.OnOpen = combined;
    return true;
  }
  function unsubscribeShopOpen(handler) {
    const C = moduleClass('ShopManager');
    const cur = C && C.OnOpen;
    if (!cur) return;
    if (Array.isArray(cur)) { const i = cur.indexOf(handler); if (i >= 0) cur.splice(i, 1); }
    else if (typeof cur.delete === 'function') cur.delete(handler);
    else if (cur._handlers) { const i = cur._handlers.indexOf(handler); if (i >= 0) cur._handlers.splice(i, 1); }
  }
  function enemyStatsOf(go) { return go && !go._destroyed ? go.GetComponent('EnemyStats') : null; }
  function removeHP(es, dmg) { if (es && typeof es.RemoveHP === 'function') es.RemoveHP(dmg); }
  function enemiesAlive(wm) {
    if (wm && typeof wm.enemies_alive === 'number') return wm.enemies_alive;
    return U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy).length;   // stand-in while waves.js is a stub
  }
  const scaled = (go, k) => { go.transform.localScale = go.transform.localScale.mul(k); };

  // the staffs / hats ItemGroups (their order defines the staff and hat indices)
  const STAFFS = F.itemGroups.staffs.map((id) => SLS.item(id));
  const HATS = F.itemGroups.hats.map((id) => SLS.item(id));
  const unlockKey = (id) => U.Str.Format('i{0}_Unlocked', id);

  // shot sounds of the remake's palette, per projectile prefab
  const SHOT_SFX = { Projectile: 'shoot', Projectile_Homing: 'shootHoming', Projectile_Triple: 'shootTriple', ExplosiveProjectile: 'shootHeavy', Projectile_Piercing: 'shootIce' };

  // stands in for the Animator: parameter "isWalking" and state "Base Layer.Jump"
  class AnimatorState {
    constructor() { this.params = {}; this.state = ''; this.stateTime = -1; }
    SetBool(name, v) { this.params[name] = !!v; }
    GetBool(name) { return !!this.params[name]; }
    Play(state) { this.state = state; this.stateTime = U.Time.time; }
  }

  // ==================================================================== PlayerController
  class PlayerController extends U.MonoBehaviour {
    constructor() {
      super();
      this.aim_renderer = null;
      this.thunder_aim_renderer = null;
      this.rigid_body = null;
      this.player_stats = null;
      this.jumps_made = 0;
      this.jump_key_held = false;
      this.is_jumping = false;
      this.counterJumpForce = new Vector2(0, 0);   // never used, as in the original
      this.toggle_auto_attack = false;
      this.attack_cooldown = 0;
      this.focus_cooldown = 0;
      this.can_get_atk_speed = false;
      this.can_invoke_comet = false;
      this.player_animator = null;
      this._isShoot = false;
      this._isJumping = false;
      this._wandDir = new Vector2(0, 0);
      this._moveVec = new Vector2(0, 0);
      this.thunder_cooldown = 8;                    // .ctor value; the serialized prefab value follows
      applyFields(this, PF.scripts.PlayerController);
      this.thunder_cooldown = f32(this.thunder_cooldown);
      // scene references (wired by the rig builder)
      this.staff_obj = null; this.staff_aim = null; this.staff_aim_point = null; this.staff_point = null;
      this.thunder_aim = null; this.thunder_point = null;
      this.isGroundedChecker = null; this.isGroundedChecker2 = null;
      this.autoattack_icon = null; this.walk_audio = null;
      this.audio_source = SfxSource; this.shoot_audio = 'shoot'; this.thunder_audio = 'thunder';
      this._wave_manager = null;
      // InputManager.Jump subscription state (ShopEnabled drops it while the shop is open)
      this._jumpSubscribed = true;
      this._shopOpenState = false;
      this._shopHooked = false;
      this._onAutoAttack = () => this.ToggleAutoAttack();
      this._onDevice = (d) => this.EnableVisualAim(d === 'gamepad');
      this._onShopOpen = (v) => this.ShopEnabled(!!v);
    }
    get wave_manager() { return this._wave_manager || SLS.Game.waveManager || null; }
    set wave_manager(v) { this._wave_manager = v; }

    Awake() {
      SLS.Game.playerController = this;
      this.player_stats = this.gameObject.GetComponent(PlayerStats);
      this.player_animator = new AnimatorState();
    }

    Start() {
      this.aim_renderer = this.staff_aim.GetComponent(U.LineRenderer2D);
      this.thunder_aim_renderer = this.thunder_aim.GetComponent(U.LineRenderer2D);
      this.rigid_body = this.GetComponent(U.Rigidbody2D);
      this.player_stats = this.gameObject.GetComponent(PlayerStats);
      this.EnableVisualAim(isGamepad());        // inlined in the original Start
      this.thunder_aim.transform.position = new Vector3(0, 6, 0);
      if (!this._shopHooked) this._shopHooked = subscribeShopOpen(this._onShopOpen);
    }

    OnEnable() {
      const auto = U.Input.action('AutoAttack');
      if (auto && !auto.performed.includes(this._onAutoAttack)) auto.performed.push(this._onAutoAttack);
      if (!U.Input.onDeviceChange.includes(this._onDevice)) U.Input.onDeviceChange.push(this._onDevice);
      this._shopHooked = subscribeShopOpen(this._onShopOpen);
    }

    OnDisable() {
      const auto = U.Input.action('AutoAttack');
      if (auto) { const i = auto.performed.indexOf(this._onAutoAttack); if (i >= 0) auto.performed.splice(i, 1); }
      const j = U.Input.onDeviceChange.indexOf(this._onDevice);
      if (j >= 0) U.Input.onDeviceChange.splice(j, 1);
      unsubscribeShopOpen(this._onShopOpen);
      this._shopHooked = false;
    }

    OnDestroy() {
      if (SLS.Game.playerController === this) SLS.Game.playerController = null;
      // WalkAudio and ThunderAim are scene objects of their own and are left as they are, as in the
      // original: a footstep loop running at game over keeps playing, and the gamepad thunder reticle
      // stays up, until the scene reloads
    }

    // ShopManager.OnOpen handler: while the shop is open the jump input is dropped; once it closes,
    // wait (in 100 ms real-time steps) until the jump button is released, then listen again.
    ShopEnabled(value) {
      if (value === this._shopOpenState) return;
      this._shopOpenState = value;
      if (value) {
        this._isJumping = false;
        this._jumpSubscribed = false;
      } else {
        this.StartCoroutine(this._resubscribeJump());
      }
    }
    *_resubscribeJump() {
      while (isJumpPressed()) yield new U.WaitForSecondsRealtime(0.1);
      if (!this._shopOpenState) this._jumpSubscribed = true;
    }

    EnableJump(value) { this._isJumping = value; }
    EnableShoot(value) { this._isShoot = value; }
    UpdateMoveVector(vec) { this._moveVec = vec; }
    UpdateWandDir(vec) {
      if (vec.x * vec.x + vec.y * vec.y >= 9.9999994e-11) this._wandDir = vec;   // vec != Vector2.zero
    }
    ToggleAutoAttack() {
      this.toggle_auto_attack = !this.toggle_auto_attack;
      if (this.autoattack_icon) this.autoattack_icon.SetActive(this.toggle_auto_attack);
    }

    EnableVisualAim(isPad) {
      // Cursor.visible = !isPad: main.js already hides the reticle cursor on a gamepad
      this.staff_aim.SetActive(isPad);
      this.thunder_aim.SetActive(false);
      if (!this.player_stats || this.player_stats.staff !== 4) return;
      this.staff_aim.SetActive(false);
      this.thunder_aim.SetActive(isPad);
    }

    // what InputManager.Update raised every frame: Jump, Shoot, WandDirection, Movement
    _pollInput() {
      const I = U.Input;
      if (!this._shopHooked && SLS.Game.shopManager) this._shopHooked = subscribeShopOpen(this._onShopOpen);
      const shopOpen = shopOnScreen();
      if (shopOpen !== this._shopOpenState) this.ShopEnabled(shopOpen);   // also covers a shop without OnOpen
      if (this._jumpSubscribed) this.EnableJump(isJumpPressed());
      const shoot = I.action('Shoot');
      this.EnableShoot(!!(shoot && shoot.IsPressed()));
      const wand = I.action('WandDirection');
      const wv = wand ? wand.ReadValue() : new Vector2(0, 0);
      this.UpdateWandDir(wv);
      this.ThunderAimPosition(wv);
      const move = I.action('Movement');
      this.UpdateMoveVector(move ? move.ReadValue() : new Vector2(0, 0));
    }

    Update() {
      this._pollInput();
      this.Aim();
      this.Jump();
    }

    FixedUpdate() {
      const ps = this.player_stats;
      this.Move();
      this.CheckIfGrounded();
      this.Shoot();
      this.PlayerDebugger();
      this.SpawnThunder();
      // short hop: while rising with the button released, push down (hat 2 is exempt)
      if (this.is_jumping && !this.jump_key_held) {
        const rb = this.GetComponent(U.Rigidbody2D);
        if (Vector2.Dot(rb.velocity, Vector2.up) > 0 && ps.hat !== 2) {
          const f = PlayerController.CalculateJumpForce(U.Physics2D.gravity.magnitude, ps.jump_force * 20) * rb.mass;
          rb.AddForce(Vector2.down.mul(f));   // ForceMode2D.Force
        }
      }
      if (ps.focus_lvl > 0) {
        if (this._moveVec.x === 0) this.AttackSpeedWithoutMoving();
        else {
          this.can_get_atk_speed = true;
          ps.atk_speed = this.atk_speed_before;
        }
      }
      if (ps.comet && !this.is_grounded) this.time_to_fall = f32(this.time_to_fall + fdt());
    }

    Move() {
      const ps = this.player_stats, x = this._moveVec.x;
      this.player_animator.SetBool('isWalking', x !== 0);
      const v = this.rigid_body.velocity;
      this.rigid_body.velocity = new Vector2(x * C_2_2 * ps.speed, v.y);
      if (x === 0 || !this.is_grounded) { this.walk_audio.SetActive(false); return; }
      if (ps.friction_lvl > 0) {
        if (this.walked_distance > 1) {
          U.Instantiate(this.friction_projectile, this.transform.position, FRICTION_ROTATION);
          this.walked_distance = 0;
        } else {
          this.walked_distance = f32(f32(f32(ps.speed * C_0_0085) * ps.friction_lvl) + this.walked_distance);
        }
      }
      this.walk_audio.SetActive(true);
    }

    Jump() {
      if (!this.jump_key_held && U.Time.timeScale !== 0) {
        if (!this._isJumping) { this.jump_key_held = false; return; }
        if (!shopOnScreen() && !transcendenceOnScreen()) {
          const ps = this.player_stats;
          this.jump_key_held = true;
          const g = U.Physics2D.gravity.magnitude;
          if (this.is_grounded || this.jumps_made > 0) {
            this.is_jumping = true;
            this.player_animator.Play('Base Layer.Jump', 0, 1);
            const rb = this.GetComponent(U.Rigidbody2D);
            rb.AddForce(Vector2.up.mul(PlayerController.CalculateJumpForce(g, ps.jump_force) * rb.mass), U.ForceMode2D.Impulse);
          }
          if (!this.is_grounded && this.jumps_made > 0) {
            // air jump: the velocity is cleared, then the same impulse again
            const rb = this.GetComponent(U.Rigidbody2D);
            rb.velocity = Vector2.zero;
            rb.AddForce(Vector2.up.mul(PlayerController.CalculateJumpForce(g, ps.jump_force) * rb.mass), U.ForceMode2D.Impulse);
          }
          // every accepted press, even one that did not jump
          this.jumps_made--;
          this.time_to_fall = 0;
          this.can_invoke_comet = true;
          return;
        }
      }
      if (this._isJumping) return;
      this.jump_key_held = false;
    }

    static CalculateJumpForce(gravity_strength, jump_height) {
      return Math.sqrt((gravity_strength + gravity_strength) * jump_height);
    }

    CheckIfGrounded() {
      const ground1 = U.Physics2D.OverlapCircle(this.isGroundedChecker.position, this.checkGroundRadius, this.groundLayer);
      const ground2 = U.Physics2D.OverlapCircle(this.isGroundedChecker2.position, this.checkGroundRadius, this.groundLayer);
      if (!ground1 && !ground2) { this.is_grounded = false; return; }
      const ps = this.player_stats;
      this.is_grounded = true;
      this.jumps_made = ps.jump_number;
      if (!ps.comet || !this.can_invoke_comet || this.time_to_fall <= C_0_7) return;
      this.can_invoke_comet = false;
      const comet = U.Instantiate(this.comet_object, this.transform.position, Quaternion.identity);
      comet.transform.SetParent(null);
      U.Debug.Log('comet position x: ' + U.Str.num(comet.transform.position.x) + ' player position x: ' + U.Str.num(this.transform.position.x));
      const ce = comet.GetComponent('CometExplosion');
      if (!ce) return;
      const t1 = f32(this.time_to_fall + 1);
      ce.explosion_damage = f32(f32(f32(t1 * 6) * t1) * t1);
      ce.explosion_size = this.time_to_fall;
    }

    Aim() {
      const ps = this.player_stats;
      const sp = this.staff_obj.transform.position;
      let dx, dy;
      if (!isGamepad()) {
        const m = R.mouseWorld();
        dx = m.x - sp.x; dy = m.y - sp.y;
      } else if (ps.staff === 4) {
        dx = this.thunder_aim.transform.position.x - sp.x; dy = 4 - sp.y;
      } else {
        const n = this._wandDir.normalized;
        dx = n.x; dy = n.y;
      }
      const angle = Math.atan2(dy, dx);
      this.staffAngle = angle * 57.29578;
      const rotation = Quaternion.AngleAxis(angle * 57.29578, Vector3.forward);
      const rad = this.staffAngle * 0.017453292;
      const aimDir = new Vector2(Math.cos(rad), Math.sin(rad));
      const hit = U.Physics2D.Raycast(new Vector2(sp.x, sp.y), aimDir, Infinity, MASK_AIM);
      let aimPoint;
      if (hit.collider) aimPoint = hit.point;
      else {
        const p = this.transform.position, n = aimDir.normalized;     // from the player, not the staff
        aimPoint = new Vector2(p.x + n.x * 15, p.y + n.y * 15);
      }
      this.staff_aim_point.transform.position = new Vector3(aimPoint.x, aimPoint.y, 0);
      this.aim_renderer.SetPosition(0, this.staff_obj.transform.position);
      this.aim_renderer.SetPosition(1, new Vector3(aimPoint.x, aimPoint.y, 0));
      this.staff_obj.transform.rotation = rotation;
    }

    Shoot() {
      const ps = this.player_stats;
      if ((!this._isShoot && !this.toggle_auto_attack) || this.attack_cooldown > 0) {
        if (this.attack_cooldown > 0) this.attack_cooldown = f32(this.attack_cooldown - sdt());
        return;
      }
      this.audio_source.PlayOneShot(ps.staff === 6 ? 'shootRainbow' : (SHOT_SFX[this.projectile] || this.shoot_audio), 0.2);
      if (ps.staff === 6) {   // random staff: a new projectile kind every shot
        switch (U.Random.RangeInt(0, 5)) {
          case 0: this.projectile = ps.projetctile_normal; break;
          case 1: this.projectile = ps.projectile_explosive; break;
          case 2: this.projectile = ps.projetctile_homing; break;
          case 3: this.projectile = ps.projetctile_triple; break;
          case 4: this.projectile = ps.projectile_pierce; break;
        }
      }
      const hoard = () => ps.hoarder && ps.orb_charge > 0;
      const charge = (p) => {      // hoarder: the stored orb charges empower the shot
        const pr = p.GetComponent('Projectile');
        pr.atk_multiplier = ps.orb_charge * 2;
        pr.hit_count += ps.orb_charge;
        scaled(p, f32(ps.orb_charge * 0.5 + 1));
        pr.is_explosive = true;
      };
      const clearCharges = () => {
        ps.orb_charge = 0;
        for (const o of U.GameObject.FindGameObjectsWithTag(SLS.Tag.OrbCharge)) U.Destroy(o);
      };
      if (this.projectile === ps.projetctile_triple) {
        for (let angle = -22; angle < 44; angle += 22) {
          const p = U.Instantiate(this.projectile, this.staff_point.transform.position, this.staff_obj.transform.rotation);
          if (hoard()) charge(p);
          p.transform.Rotate(0, 0, angle);
          scaled(p, ps.proj_size);
        }
        if (hoard()) clearCharges();
      } else if (ps.staff === 4) {    // thunder staff: the bolt falls from the top at the aimed x
        const target = this.thunder_aim.activeSelf ? this.thunder_aim.transform.position : R.mouseWorld();
        const bolt = U.Instantiate(this.thunder_projectile, new Vector3(target.x, THUNDER_Y, 0), Quaternion.identity);
        const tb = bolt.GetComponent('ThunderBolt');
        tb.thunder_damage = f32(ps.atk_damage + tb.thunder_damage);
        scaled(bolt, f32(ps.proj_size * f32(0.2) + 1));
        SLS.sfx(this.thunder_audio);
        if (ps.white_dwarf) tb.can_pull = true;
      } else {
        const p = U.Instantiate(this.projectile, this.staff_point.transform.position, this.staff_obj.transform.rotation);
        scaled(p, ps.proj_size);
        if (hoard()) { charge(p); clearCharges(); }
      }
      this.attack_cooldown = f32(ps.atk_speed);   // atk_speed is the delay between shots, in seconds
    }

    OnCollisionEnter2D(collision) {
      if (!collision || !collision.collider || collision.collider.tag !== SLS.Tag.Enemy) return;
      const ps = this.player_stats;
      if (!ps.shield_up) {
        const es = enemyStatsOf(collision.collider.gameObject);
        if (!es) return;
        const m = es.melee_atk_damage;
        const dmg = m - m * 0.01 * ps.armor >= 0 ? m - m * 0.01 * ps.armor : 0;
        if (ps.sadistic) removeHP(es, ps.armor);
        ps.TakeDamage(dmg);
        if (ps.body_damage > 0) removeHP(es, ps.rage_body_damage + ps.body_damage);
      } else {
        // the shield takes the hit; the timer is set to the window itself (no fresh i-frames)
        ps.shield_up = false;
        ps.i_window_timer = ps.i_window;
        ps.shield_cooldown = f32(16 / ps.shield_lvl);
        ps.shield_sprite.color = new Color(1, 1, 1, 0);
        ps.audio_source.PlayOneShot(ps.shield_break_audio, 0.4);
        if (ps.protector) {
          for (let angle = -180; angle < 180; angle += 12) {
            const p = U.Instantiate(ps.GetComponent(PlayerController).projectile, ps.transform.position, ps.transform.rotation);
            p.transform.Rotate(0, 0, angle);
            scaled(p, ps.proj_size);
          }
        }
      }
      this.time_to_fall = 0;
    }

    // inlined into FixedUpdate in the original
    PlayerDebugger() {
      const p = this.transform.position;
      if (p.x > 8.5 || p.x < -8.5 || p.y > 8 || p.y < -4.26) this.transform.position = new Vector3(0, -3.54, 0);
    }

    // thunder rain (inlined into FixedUpdate in the original)
    SpawnThunder() {
      const wm = this.wave_manager;
      if (!wm || wm.state !== 'wave') return;
      const ps = this.player_stats;
      if (ps.thunder_projs === 0) return;
      if (this.thunder_cooldown <= 0) {
        SLS.sfx(this.thunder_audio);
        U.Instantiate(this.thunder_projectile, new Vector3(U.Random.Range(-8, 8), THUNDER_Y, 0), Quaternion.identity);
        this.thunder_cooldown = f32(8 / ps.thunder_projs);
      } else {
        this.thunder_cooldown = f32(this.thunder_cooldown - fdt());
      }
    }

    // focus (inlined into FixedUpdate in the original)
    AttackSpeedWithoutMoving() {
      const ps = this.player_stats;
      if (this.can_get_atk_speed) {
        this.atk_speed_before = ps.atk_speed;
        this.can_get_atk_speed = false;
      }
      if (this.focus_cooldown >= 0) { this.focus_cooldown = f32(this.focus_cooldown - fdt()); return; }
      ps.atk_speed = f32(ps.atk_speed - f32(f32(ps.focus_lvl * ps.atk_speed) * C_0_05));
      if (ps.bunker && ps.armor < 95) ps.armor += 4;    // never removed when you move again
      this.focus_cooldown = 1;
    }

    ThunderAimPosition(moveVec) {
      const ta = this.thunder_aim.transform;
      const x = Mathf.Clamp(ta.position.x + this.thunder_aim_speed * U.Time.deltaTime * moveVec.x, -8, 8);
      ta.position = new Vector3(x, THUNDER_Y, 0);
      if (this.thunder_aim_renderer) this.thunder_aim_renderer.SetPosition(0, ta.position);
      const hit = U.Physics2D.Raycast(new Vector2(x, THUNDER_Y), new Vector2(0, -1), Infinity, MASK_AIM);
      const p = new Vector3(hit.point.x, hit.point.y, 0);
      if (this.thunder_aim_renderer) this.thunder_aim_renderer.SetPosition(1, p);
      this.thunder_point.transform.position = p;
    }
  }

  // ==================================================================== PlayerStats
  class PlayerStats extends U.MonoBehaviour {
    constructor() {
      super();
      this.black_hole_cooldown = 1;   // .ctor (the serialized value follows)
      applyFields(this, PF.scripts.PlayerStats);
      this.burning_cd = 0;
      this.regen_ticker = 1;          // private: the .ctor value is used
      this.i_window = f32(this.i_window);
      this.black_hole_cooldown = f32(this.black_hole_cooldown);
      // renderers / effect objects of the rig (wired by the rig builder)
      this.shield_sprite = null; this.player_graph = null; this.staff_graphic = null; this.hat_graphic = null; this.player_hat = null;
      this.overheat = null; this.burning_effect = null; this.godofthunder_effect = null;
      this.vampire_effect = null; this.bloody_effect = null; this.streamer_beam = null;
      this.audio_source = SfxSource;
      this.hurt_audio = 'playerHit'; this.shield_begin_audio = 'shieldUp'; this.shield_break_audio = 'shieldBreak'; this.game_over_sound = 'gameOver';
      // HP widgets and the menu picker widgets, as plain data for the HUD / menus modules
      this.hp_bar = { maxValue: 0, value: 0 };
      this.hp_count = uiText();
      this.highscore_text = uiText();
      this.staffs = STAFFS;
      this.staff_ui_graphic = { itemId: null };
      this.staff_name = uiText();
      this.staff_description = descText();
      this.buy_staff_button = uiObject();
      this.buy_staff_text = uiText();
      this.hats = HATS;
      this.hat_ui_graphic = { itemId: null };
      this.hat_name = uiText();
      this.hat_description = descText();
      this.buy_hat_button = uiObject();
      this.buy_hat_text = uiText();
      this._wave_manager = null; this._progression_manager = null; this._shop_manager = null;
    }
    get wave_manager() { return this._wave_manager || SLS.Game.waveManager || null; }
    set wave_manager(v) { this._wave_manager = v; }
    get progression_manager() { return this._progression_manager || SLS.Game.progression || null; }
    set progression_manager(v) { this._progression_manager = v; }
    get shop_manager() { return this._shop_manager || SLS.Game.shopManager || null; }
    set shop_manager(v) { this._shop_manager = v; }

    Awake() {
      SLS.Game.playerStats = this;
      SLS.Game.player = this.gameObject;
    }

    OnDestroy() {
      if (SLS.Game.playerStats === this) { SLS.Game.playerStats = null; SLS.Game.player = null; }
    }

    Start() {
      U.Debug.Log(U.Str.Format('Hat = {0}; Staff {1}', 'False', 'False'));
      this.hp = this.max_hp;
      this.isAlive = true;
      this.buy_hat_button.SetActive(false);
      this.buy_staff_button.SetActive(false);
      // (the legacy Slot_0.sav migration has no counterpart in the remake)
      for (const item of this.staffs) if (item.price === 0) SLS.Save.SetValue(unlockKey(item.id), true);
      for (const item of this.hats) if (item.price === 0) SLS.Save.SetValue(unlockKey(item.id), true);
      // (Steam achievements achiev_06 / achiev_07 are not part of the remake)
      this.SelectStaffWithIndex(0);
      this.SelectHatWithIndex(0);
    }

    Update() { this.CheckHP(); }

    FixedUpdate() {
      // i-window
      if (this.i_window_timer > this.i_window) this.player_graph.color = new Color(1, 1, 1, 1);
      else this.i_window_timer = f32(this.i_window_timer + sdt());
      // regen: once per second, scaled by the enemies alive
      if (this.regen_ticker >= 1 && this.hp < this.max_hp) {
        const alive = enemiesAlive(this.wave_manager);
        this.regen_ticker = 0;
        this.hp = f32(this.hp_regen / 30 * alive * this.max_hp / 100 + this.hp);
      } else {
        this.regen_ticker = f32(this.regen_ticker + sdt());
      }
      // shield
      if (this.shield_lvl > 0) {
        if (this.shield_cooldown <= 0 && !this.shield_up) {
          this.shield_up = true;
          this.shield_sprite.color = new Color(0.5, 0.95, 1, 0.12);
          this.audio_source.PlayOneShot(this.shield_begin_audio, 0.5);
        } else {
          this.shield_cooldown = f32(this.shield_cooldown - fdt());
        }
      }
      // rage (rage_body_damage keeps its last value when HP climbs back, as compiled)
      let raging = false;
      if (this.rage_lvl > 0) {
        const half = this.max_hp * 0.5;
        if (this.hp < half) {
          const f = (half - this.hp) / half;
          this.rage_body_damage = f32(f * this.body_damage * this.rage_lvl * 0.5);
          this.rage_damage = f32(f * this.atk_damage * this.rage_lvl * 0.5);
          raging = true;
        }
      }
      if (!raging) this.rage_damage = 0;
      if (this.armor >= 90) this.armor = 90;
      if (this.atk_speed < 0.1) this.atk_speed = f32(0.1);
      if (this.white_dwarf && this.black_hole_cooldown >= 0) this.black_hole_cooldown = f32(this.black_hole_cooldown - fdt());
      if (this.burning_man) this.BurningMan();
    }

    CheckHP() {
      if (this.hp > this.max_hp) this.hp = this.max_hp;
      if (!this.isAlive) return;
      this.hp_bar.maxValue = this.max_hp;
      this.hp_bar.value = this.hp;
      this.hp_count.text = Mathf.RoundToInt(this.hp) + '/' + Mathf.RoundToInt(this.max_hp);
      if (this.hp > 0) return;
      if (this.revive_count < 1) {
        // game over
        U.Debug.Log('Game Over');
        const pm = this.progression_manager;
        if (pm) SLS.Save.SetValue('soul_orbs', pm.soul_orbs);
        this.isAlive = false;
        const wm = this.wave_manager;
        if (wm && wm.music_source && typeof wm.music_source === 'object') wm.music_source.volume = 0;
        if (U.Audio && U.Audio.stopMusic) U.Audio.stopMusic();
        this.audio_source.PlayOneShot(this.game_over_sound, 0.8);
        // (the anti-tamper check and the Steam leaderboard upload are not part of the remake)
        const wave = wm ? wm.wave_number : 0;
        this.highscore_text.text = String(wave);
        if (wm && typeof wm.PauseGame === 'function') wm.PauseGame(); else U.Time.timeScale = 0;
        if (wm && wm.pause_screen && typeof wm.pause_screen.SetActive === 'function') wm.pause_screen.SetActive(false);
        else if (SLS.UIHooks && SLS.UIHooks.setPaused) SLS.UIHooks.setPaused(false);
        if (SLS.UIHooks && SLS.UIHooks.gameOver) SLS.UIHooks.gameOver(wave);
        U.Destroy(this.gameObject);
        return;
      }
      // revive: half HP back, and every enemy has a 50% chance to be struck down
      this.revive_count--;
      this.hp = f32(this.max_hp * 0.5);
      for (const e of U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy)) {
        if (U.Random.RangeInt(0, 2) !== 1) continue;
        const es = enemyStatsOf(e);
        if (!es) break;
        removeHP(es, es.hp + 1);
      }
    }

    TakeDamage(dmg) {
      if (this.i_window_timer < this.i_window) return;     // still invulnerable
      if (SLS.Debug.god) return;                            // ?god debug parameter
      if (this.gnome && U.Random.RangeInt(0, 100) < 33) dmg = 0;
      this.audio_source.PlayOneShot(this.hurt_audio, 0.2);
      this.player_graph.color = new Color(1, 0, 0, 1);
      this.hp = Mathf.Clamp(f32(this.hp - dmg), 0, this.max_hp);
      this.i_window_timer = 0;
      this.player_graph.color = new Color(1, 1, 1, 0.5);    // overrides the red straight away
      this._hurtFlash = 1;
    }

    HasSelectedStaff() {
      const item = this.staffs[this.staff];
      if (item.price === 0) return true;
      return !!SLS.Save.GetValue(unlockKey(item.id), false);
    }
    HasSelectedHat() {
      const item = this.hats[this.hat];
      if (item.price === 0) return true;
      return !!SLS.Save.GetValue(unlockKey(item.id), false);
    }
    AllStaffsUnlocked() { return this.staffs.every((it) => !!SLS.Save.GetValue(unlockKey(it.id), false)); }
    AllHatsUnlocked() { return this.hats.every((it) => !!SLS.Save.GetValue(unlockKey(it.id), false)); }

    SelectStaffWithIndex(index) {
      index = Mathf.Clamp(index, 0, this.staffs.length - 1);
      this.staff = index;
      const item = this.staffs[index];
      this.staff_ui_graphic.itemId = item.id;
      this.staff_name.text = item.name;
      this.staff_description.text = '';
      if (!this.HasSelectedStaff()) {          // locked: show the price, keep the current staff's stats
        this.buy_staff_text.text = U.Str.Format('{0}', item.price);
        this.buy_staff_button.SetActive(true);
        return;
      }
      this.buy_staff_button.SetActive(false);
      if (this.staff_graphic) this.staff_graphic.state.itemId = item.id;
      this.staff_description.key = 'player.staff.' + item.id + '.desc';
      this.gameObject.GetComponent(PlayerController).projectile = item.projectile;
      this.atk_speed = f32(item.attackSpeed);
    }
    SelectStaff(add) { this.SelectStaffWithIndex(add + this.staff); }
    ReselectStaff() { this.SelectStaffWithIndex(this.staff); }

    SelectHatWithIndex(index) {
      index = Mathf.Clamp(index, 0, this.hats.length - 1);
      this.hat = index;
      const item = this.hats[index];
      this.hat_ui_graphic.itemId = item.id;
      this.hat_name.text = item.name;
      this.hat_description.text = '';
      if (!this.HasSelectedHat()) {
        this.buy_hat_text.text = U.Str.Format('{0}', item.price);
        this.buy_hat_button.SetActive(true);
        return;
      }
      this.buy_hat_button.SetActive(false);
      if (this.hat_graphic) this.hat_graphic.state.itemId = item.id;
      this.hat_description.key = 'player.hat.' + item.id + '.desc';
      this.jump_number = item.jumpNumber;   // assigned, not added
      this.armor = item.armor;
      this.speed = item.speed;
    }
    SelectHat(add) { this.SelectHatWithIndex(add + this.hat); }
    ReselectHat() { this.SelectHatWithIndex(this.hat); }

    UnlockSelectedStaff() {
      const pm = this.progression_manager, item = this.staffs[this.staff];
      if (!pm || pm.soul_orbs < item.price) return;
      if (SLS.Save.GetValue(unlockKey(item.id), false)) return;
      pm.soul_orbs -= item.price;
      SLS.Save.SetValue('soul_orbs', pm.soul_orbs);
      this.buy_staff_button.SetActive(false);
      SLS.Save.SetValue(unlockKey(item.id), true);
      this.SelectStaffWithIndex(this.staff);
    }
    UnlockSelectedHat() {
      const pm = this.progression_manager, item = this.hats[this.hat];
      if (!pm || pm.soul_orbs < item.price) return;
      if (SLS.Save.GetValue(unlockKey(item.id), false)) return;
      pm.soul_orbs -= item.price;
      SLS.Save.SetValue('soul_orbs', pm.soul_orbs);
      this.buy_hat_button.SetActive(false);
      SLS.Save.SetValue(unlockKey(item.id), true);
      this.SelectHatWithIndex(this.hat);
    }
    EnableAllStafs() { for (const item of this.staffs) SLS.Save.SetValue(unlockKey(item.id), true); }
    EnableAllHats() { for (const item of this.hats) SLS.Save.SetValue(unlockKey(item.id), true); }

    BurningMan() {
      if (this.burning_cd > 0) { this.burning_cd = f32(this.burning_cd - fdt()); return; }
      const p = this.transform.position;
      for (const hit of U.Physics2D.OverlapCircleAll(new Vector2(p.x, p.y), 2.2, MASK_BURNING)) {
        if (hit.tag !== SLS.Tag.Enemy) continue;
        const es = enemyStatsOf(hit.gameObject);
        if (!es) return;
        removeHP(es, this.body_damage);
      }
      const fx = this.burning_effect && this.burning_effect.GetComponent(U.Particles2D);
      if (!fx) return;
      fx.Play();
      this.burning_cd = 2;
    }

    KillSelf() { this.revive_count = 0; this.hp = 0; }
    SetMaxHP(val) { this.max_hp = val; this.hp = val; }
    SetFragmentation(val) { this.proj_fragments = val; }
    SetAtkSpeed(val) { this.atk_speed = val; }
    SetDamage(val) { this.atk_damage = val; }
  }

  // footstep loop (the original's WalkAudio object): plays while active
  // the original WalkAudio source loops the Walk clip while active (volume = SFX slider)
  class WalkAudio extends U.MonoBehaviour {
    OnEnable() { this.t = 0; if (U.Audio.setLoop) U.Audio.setLoop('walk', 'Walk', true, 1, 'sfx'); }
    OnDisable() { if (U.Audio.setLoop) U.Audio.setLoop('walk', 'Walk', false); }
    OnDestroy() { this.OnDisable(); }
    Update() {
      if (U.Audio.setLoop) return;
      this.t -= U.Time.deltaTime;
      if (this.t <= 0) { SLS.sfx('step'); this.t = 0.28; }
    }
  }

  // ==================================================================== drawings
  // Sprites are drawn in their child's own space, like the SpriteRenderers (Graphics: MainChar,
  // Helmet: the hat, Staff, Shield: Projectile, VampireCloak). The procedural fallback art is
  // authored in player-local units: undo the child's offset, rotation and scale first (this also
  // drops the Animator pose, as the fallback has its own bob).
  function toPlayerSpace(ctx, r) {
    const lp = r.transform.localPosition, ls = r.transform.localScale;
    ctx.scale(1 / ls.x, 1 / ls.y);
    ctx.rotate(-r.transform.localEulerAngles.z * Mathf.Deg2Rad);
    ctx.translate(-lp.x, -lp.y);
  }
  const isWhite = (c) => c.r >= 0.999 && c.g >= 0.999 && c.b >= 0.999;
  const css = (c, a) => 'rgba(' + Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255) + ',' + a + ')';

  // tinted copy of a drawing (offscreen, so the tint never touches the scene behind)
  const tintCanvas = document.createElement('canvas');
  tintCanvas.width = tintCanvas.height = 128;
  function drawTinted(ctx, box, color, draw) {
    const g = tintCanvas.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.clearRect(0, 0, 128, 128);
    const sx = 128 / box.w, sy = 128 / box.h;
    g.setTransform(sx, 0, 0, -sy, -box.x * sx, (box.y + box.h) * sy);
    draw(g);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.globalAlpha = 0.65;
    g.fillStyle = css(color, 1);
    g.fillRect(0, 0, 128, 128);
    ctx.save();
    ctx.translate(box.x, box.y + box.h);
    ctx.scale(box.w / 128, -box.h / 128);
    ctx.drawImage(tintCanvas, 0, 0);
    ctx.restore();
  }

  const bob = (s) => (s.air ? 0 : Math.sin((s.walk || 0) * TAU) * 0.025);

  // the i-window shows as the renderer's alpha 0.5 (PlayerStats.TakeDamage); the red tint is
  // overwritten in the same call in the original, so the sprite gets no red flash
  function drawBody(ctx, r) {
    if (As.drawSprite(ctx, SLS.Sprites.player)) return;
    toPlayerSpace(ctx, r);
    const s = r.state;
    if (s.flash > 0) R.drawGlow(ctx, 0, 0.05, 0.75, 'rgba(255,70,70,1)', s.flash * 0.7);
    SLS.Art.player(ctx, { t: s.t || 0, walk: s.walk || 0, air: !!s.air, hurt: 0 });
  }
  const HAT_BOX = { x: -0.4, y: 0.15, w: 0.8, h: 0.8 };
  function drawHat(ctx, r) {
    const s = r.state;
    if (s.itemId == null) return;
    // sprite tinted by the renderer colour (Gnome: Color.red, ItemScript.cs:492)
    const name = SLS.Sprites.hats[s.itemId] || SLS.Sprites.hats[200];
    if (isWhite(r.color) ? As.drawSprite(ctx, name) : As.drawTinted(ctx, name, css(r.color, 1))) return;
    toPlayerSpace(ctx, r);
    ctx.translate(0, bob(s));
    const draw = (g) => SLS.Art.hat(g, s.itemId, { t: s.t || 0 });
    if (isWhite(r.color)) draw(ctx);
    else drawTinted(ctx, HAT_BOX, r.color, draw);
  }
  function drawStaff(ctx, r) {
    const s = r.state;
    if (s.itemId == null) return;
    if (SLS.Art.staffSprite(ctx, s.itemId)) return;
    ctx.scale(0.8, 0.8);   // Art.staff puts its gem near x = 0.55; the spawn point (Staff/Point) is at 0.44
    SLS.Art.staff(ctx, s.itemId, { t: s.t || 0 });
  }
  function drawShield(ctx, r) {
    const c = r.color;
    if (c.a <= 0.003) return;
    // the Projectile sprite tinted by the renderer colour (up: 0.5, 0.95, 1, 0.12); alpha is applied by the renderer
    if (As.drawTinted(ctx, SLS.Sprites.projectile, css(c, 1), { smooth: true })) return;
    const t = U.Time.unscaledTime;
    const g = ctx.createRadialGradient(0, 0, 0.05, 0, 0, 0.5);
    g.addColorStop(0, css(c, 0.1)); g.addColorStop(0.75, css(c, 0.45)); g.addColorStop(1, css(c, 1));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 0.5, 0, TAU); ctx.fill();
    // the rim reads better than the faint fill
    ctx.globalAlpha = Math.min(1, c.a * 5);
    ctx.strokeStyle = css(c, 0.9); ctx.lineWidth = 0.03;
    ctx.beginPath(); ctx.arc(0, 0, 0.5, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 0.045;
    ctx.beginPath(); ctx.arc(0, 0, 0.45, t * 2.2, t * 2.2 + 0.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 0.45, t * 2.2 + Math.PI, t * 2.2 + Math.PI + 0.5); ctx.stroke();
  }
  function drawCloak(ctx, r) {
    if (U.Assets.drawSprite(ctx, SLS.Sprites.cloak)) return;   // drawn in the cloak child's own space
    toPlayerSpace(ctx, r);
    const t = U.Time.unscaledTime, s = r.state;
    ctx.translate(0, -0.05 + bob(s));
    const wave = (k) => Math.sin(t * 5 + k) * 0.02;
    const g = ctx.createLinearGradient(0, 0.22, 0, -0.45);
    g.addColorStop(0, '#7a1430'); g.addColorStop(1, '#2b0612');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-0.13, 0.21); ctx.lineTo(0.13, 0.21);
    ctx.quadraticCurveTo(0.3, -0.05, 0.31 + wave(0), -0.44);
    ctx.lineTo(0.15, -0.4 + wave(1)); ctx.lineTo(0, -0.46 + wave(2)); ctx.lineTo(-0.15, -0.4 + wave(3));
    ctx.lineTo(-0.31 + wave(4), -0.44);
    ctx.quadraticCurveTo(-0.3, -0.05, -0.13, 0.21);
    ctx.fill();
    ctx.strokeStyle = '#d63a5e'; ctx.lineWidth = 0.025;
    ctx.beginPath(); ctx.moveTo(-0.15, 0.2); ctx.quadraticCurveTo(0, 0.12, 0.15, 0.2); ctx.stroke();
  }
  // gamepad aim end / thunder reticle: the CursorSprite sprite (both objects have scale 0.5)
  function drawAimMarker(ctx) {
    if (As.drawSprite(ctx, SLS.Sprites.cursor)) return;
    const t = U.Time.unscaledTime;
    ctx.strokeStyle = 'rgba(235,240,255,0.9)'; ctx.lineWidth = 0.03;
    ctx.beginPath(); ctx.arc(0, 0, 0.12, 0, TAU); ctx.stroke();
    ctx.save(); ctx.rotate(t * 1.5);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.moveTo(Math.cos(a) * 0.16, Math.sin(a) * 0.16); ctx.lineTo(Math.cos(a) * 0.24, Math.sin(a) * 0.24); }
    ctx.stroke(); ctx.restore();
  }
  function drawThunderMarker(ctx) {
    if (As.drawSprite(ctx, SLS.Sprites.cursor)) return;
    const t = U.Time.unscaledTime, pulse = 0.85 + Math.sin(t * 8) * 0.15;
    R.drawGlow(ctx, 0, 0, 0.5, 'rgba(255,240,140,1)', 0.5);
    ctx.strokeStyle = 'rgba(255,246,170,0.95)'; ctx.lineWidth = 0.05;
    ctx.beginPath(); ctx.ellipse(0, 0, 0.3 * pulse, 0.1 * pulse, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#fff6a0';
    ctx.beginPath(); ctx.moveTo(0.04, 0.42); ctx.lineTo(-0.08, 0.18); ctx.lineTo(0, 0.18); ctx.lineTo(-0.05, 0.02); ctx.lineTo(0.09, 0.26); ctx.lineTo(0.01, 0.26); ctx.closePath(); ctx.fill();
  }
  // StreamerBeam/Graphics: the color_white sprite tinted (0.74, 0, 1, 0.427), a flat bar (its
  // Animator only fades the root's disabled renderer); the glowing beam below is the fallback
  function drawStreamBeam(ctx) {   // in the beam's Graphics space: x = width, y = length
    if (SLS.Art.streamerBeam(ctx)) return;
    const t = U.Time.unscaledTime, w = 1 + Math.sin(t * 30) * 0.15;
    const g = ctx.createLinearGradient(-2.5, 0, 2.5, 0);
    g.addColorStop(0, 'rgba(190,60,255,0)'); g.addColorStop(0.5, 'rgba(200,90,255,0.5)'); g.addColorStop(1, 'rgba(190,60,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-2.5 * w, -0.5, 5 * w, 1);
    ctx.fillStyle = 'rgba(245,215,255,0.95)'; ctx.fillRect(-0.45 * w, -0.5, 0.9 * w, 1);
  }

  // ------------------------------------------------------------------ the rig's particle systems
  // U.Particles2D drawn like the originals' renderers. Presets with colors use the Default-Line
  // material (solid unrotated squares; soft: Default-Particle's soft dots), coloured colorStart (the
  // start colour) x the Colour over Lifetime keys (colors [t, r, g, b], alphas [t, a]) and sized x the
  // Size over Lifetime keys (sizes [t, k]); ribbon: Trails in Ribbon mode, one strip through the live
  // particles. spawn() places each new particle in world units along the emitter's axes ([x, y] or
  // [x, y, vx, vy]): the systems use scaling mode Local, so the player's scale never applies.
  // perUnit: Emission rate over distance.
  const rand = (a, b) => a + Math.random() * (b - a);
  function keyAt(keys, t, i) {        // Unity gradient / curve keys: linear between keys, flat outside
    let a = keys[0];
    if (t <= a[0]) return a[i];
    for (const b of keys) {
      if (t <= b[0]) return a[i] + (b[i] - a[i]) * (t - a[0]) / (b[0] - a[0]);
      a = b;
    }
    return a[i];
  }
  const rgbCss = (o) => 'rgb(' + (o.r * 255 | 0) + ',' + (o.g * 255 | 0) + ',' + (o.b * 255 | 0) + ')';
  class RigParticles extends U.Particles2D {
    Emit(n) {
      const c = this.cfg, k = this.parts.length;
      super.Emit(n);
      if (!c.spawn) return;
      const m = this.transform.worldMatrix, sx = Math.hypot(m[0], m[1]) || 1, sy = Math.hypot(m[2], m[3]) || 1;
      for (let i = k; i < this.parts.length; i++) {
        const p = this.parts[i], o = c.spawn();
        p.x = m[4] + m[0] / sx * o[0] + m[2] / sy * o[1];
        p.y = m[5] + m[1] / sx * o[0] + m[3] / sy * o[1];
        if (o.length > 2) { p.vx = m[0] / sx * o[2] + m[2] / sy * o[3]; p.vy = m[1] / sx * o[2] + m[3] / sy * o[3]; }
      }
    }
    tick(dt) {
      const c = this.cfg;
      if (c.perUnit && this.isPlaying && this.emitting) {
        const m = this.transform.worldMatrix, last = this._last;
        const d = last ? Math.hypot(m[4] - last[0], m[5] - last[1]) : 0;
        if (!last) this._dist = 0;
        else if (d < 2) this._dist += d * rand(c.perUnit[0], c.perUnit[1]);   // a respawn jump emits nothing
        this._last = [m[4], m[5]];
        const n = Math.floor(this._dist);
        if (n > 0) { this._dist -= n; this.Emit(n); }
      }
      super.tick(dt);
    }
    onDisableNative() { super.onDisableNative(); this._last = null; }
    drawWorld(ctx) {
      const c = this.cfg, ps = this.parts;
      if (!c.colors) { super.drawWorld(ctx); return; }
      if (!ps.length) return;
      const s0 = c.colorStart, look = ps.map((p) => {
        const t = p.age / p.life;
        return { r: s0[0] * keyAt(c.colors, t, 1), g: s0[1] * keyAt(c.colors, t, 2), b: s0[2] * keyAt(c.colors, t, 3),
          a: s0[3] * keyAt(c.alphas, t, 1), s: p.size * (c.sizes ? keyAt(c.sizes, t, 1) : 1) };
      });
      ctx.save();
      if (c.ribbon) {
        for (let i = 1; i < ps.length; i++) {
          const a = look[i - 1], b = look[i];
          ctx.globalAlpha = Mathf.Clamp01((a.a + b.a) / 2);
          ctx.strokeStyle = rgbCss({ r: (a.r + b.r) / 2, g: (a.g + b.g) / 2, b: (a.b + b.b) / 2 });
          ctx.lineWidth = (a.s + b.s) / 2;
          ctx.beginPath(); ctx.moveTo(ps[i - 1].x, ps[i - 1].y); ctx.lineTo(ps[i].x, ps[i].y); ctx.stroke();
        }
      }
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i], o = look[i];
        if (o.s <= 0 || o.a <= 0.003) continue;
        ctx.globalAlpha = Mathf.Clamp01(o.a);
        if (c.soft) ctx.drawImage(R.glow(rgbCss(o), 32, 0), p.x - o.s / 2, p.y - o.s / 2, o.s, o.s);
        else { ctx.fillStyle = rgbCss(o); ctx.fillRect(p.x - o.s / 2, p.y - o.s / 2, o.s, o.s); }
      }
      ctx.restore();
    }
  }

  // presets from the original Particle Systems (world space); gravity = -9.81 x the gravity modifier,
  // the noise modules become a small random drift
  const hexKey = (t, h) => [t, parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  const TAN25 = Math.tan(25 * Mathf.Deg2Rad);
  const HOLD = (k) => 1 / (1 - k);    // engine colours: a start alpha of 1/(1-k) fading to 0 holds until k
  const FX = {
    // GroundDust (Default-Particle): rate over distance 3-6, life 0.1-5, size 0.1-0.5 x (0 -> 1 @24 % -> 0),
    // white alpha 0.031 x (0.016 -> 1 @14 % -> 0), gravity -0.02, noise 0.1 @0.5, 0.15-wide rectangle
    groundDust: { rate: 0, perUnit: [3, 6], lifetime: [0.1, 5], speed: [0, 0.05], size: [0.1, 0.5], gravity: 0.196,
      colorStart: [1, 1, 1, 0.031], colors: [hexKey(0, '#ffffff')], alphas: [[0, 0.016], [0.138, 1], [1, 0]],
      sizes: [[0, 0], [0.244, 1], [1, 0]], soft: true, spawn: () => [rand(-0.075, 0.075), 0], max: 1000, order: 39 },
    // Overheat: 20/s, life 1, size 0.02-0.07, gravity -0.1 (rises), noise 0.3, cone volume (radius 0.122,
    // 25 deg, length 0.61) standing on the feet, own scale x 0.975 / height 1.45; #ff2e00 -> #ffee00,
    // alpha 0.69 to 70 %
    overheat: { rate: 20, lifetime: 1, speed: [0, 0.3], size: [0.02, 0.07], gravity: 0.981,
      colorStart: [1, 1, 1, 1], colors: [hexKey(0, '#ff2e00'), hexKey(1, '#ffee00')], alphas: [[0.697, 0.69], [1, 0]],
      spawn: () => {
        const h = Math.random() * 0.61, d = (0.122 + h * TAN25) * Math.sqrt(Math.random());
        return [Math.cos(Math.random() * TAU) * d * 0.975, h * 1.45];
      }, max: 1000, order: 42 },
    // BurningMan: each Play() (every 2 s) runs 2 s at 10000/s capped at 200; life 2, size 0.02-0.07,
    // gravity -0.05, noise 0.1, ring of radius 1.8-2 (x 0.975); #ff2e00 @6 % -> #ffb700 @17 % ->
    // #595959 @25 %, alpha 0.965 @1 % -> 0 @56 %
    burningMan: { rate: 10000, loop: false, duration: 2, lifetime: 2, speed: [0, 0.1], size: [0.02, 0.07], gravity: 0.49,
      colorStart: [1, 1, 1, 1], colors: [hexKey(0.062, '#ff2e00'), hexKey(0.174, '#ffb700'), hexKey(0.247, '#595959')],
      alphas: [[0.012, 0.965], [0.562, 0]],
      spawn: () => {
        const a = Math.random() * TAU, d = 2 * Math.sqrt(0.81 + 0.19 * Math.random());
        return [Math.cos(a) * d * 0.975, Math.sin(a) * d];
      }, max: 200, order: 42 },
    // GodOfThunderEyes/Eyes: 10/s, life 0.5, no speed, size 0.05, circle radius 0.0135; #77d9ff -> white,
    // alpha held to 52 %; the ribbon trails the eyes as the player moves
    eyes: { rate: 10, lifetime: 0.5, speed: 0, size: 0.05, colorStart: [1, 1, 1, 1],
      colors: [hexKey(0, '#77d9ff'), hexKey(1, '#ffffff')], alphas: [[0.515, 1], [1, 0]], ribbon: true,
      spawn: () => { const a = Math.random() * TAU, d = 0.0135 * Math.sqrt(Math.random()); return [Math.cos(a) * d, Math.sin(a) * d]; },
      max: 1000, order: 45 },
    // BloodyMage: 20/s, life 2, speed 2 out of a sphere (radius 0.3, seen flat), size 0.04-0.1, gravity
    // 1.2; red x (#e20000 -> #7d0000), alpha held to 58 %. Its 3D collision (the scene's hidden cubes,
    // which most drops miss) is left out: the drops fall through.
    bloody: { rate: 20, lifetime: 2, size: [0.04, 0.1], gravity: -11.772, colorStart: [1, 0, 0, 1],
      colors: [hexKey(0, '#e20000'), hexKey(1, '#7d0000')], alphas: [[0.576, 1], [1, 0]],
      spawn: () => {
        const z = rand(-1, 1), a = Math.random() * TAU, q = Math.sqrt(1 - z * z), d = 0.3 * Math.cbrt(Math.random());
        const ux = Math.cos(a) * q, uy = Math.sin(a) * q;
        return [ux * d, uy * d, ux * 2, uy * 2];
      }, max: 1000, order: 41 },
    // StreamerBeam/Particle System (FireMat, like SoulRay's): on activation 1000/s for 0.5 s (max 400) over
    // a 1 x 25 box along the beam, life 0.5, size 0.05-0.1, gravity -1 (rises); #518cf3 -> white, alpha
    // held to 28 %
    beamSparks: { rate: 1000, loop: false, duration: 0.5, lifetime: 0.5, speed: 0, size: [0.05, 0.1], sizeEnd: 1, gravity: 9.81,
      colorStart: [0.318, 0.549, 0.953, HOLD(0.276)], colorEnd: [1, 1, 1, 0], spawn: () => [rand(-0.5, 0.5), rand(-12.5, 12.5)],
      max: 400, order: 38 },
  };
  function addParticles(go, preset) {
    const p = go.AddComponent(RigParticles);
    Object.assign(p.cfg, preset);
    p.sortingOrder = preset.order || 40;
    // the original toggled these objects with ParticleActivator (the "Particles" option); added last
    if (SLS.ParticleActivator) go.AddComponent(SLS.ParticleActivator);
    return p;
  }
  function addShape(go, draw, order) {
    const r = go.AddComponent(U.ShapeRenderer);
    r.draw = draw;
    r.sortingOrder = order;
    return r;
  }

  // ------------------------------------------------------------------ Animator (controller "Player")
  // Only Graphics and Helmet are animated. Idle (2 s loop): flat keys at 0 / 1 / 2 s. Walk (0.65 s
  // loop): the clip's baked 60 Hz samples (Graphics y, Helmet y, Graphics rotation z in degrees).
  // Idle <-> Walk on isWalking with a fixed 0.1 s crossfade; Jump is played at normalizedTime 1 and
  // leaves at once (duration 0) for Idle / Walk, which restart.
  const IDLE = { bodyY: [0.21, 0.1875], hatY: [0.21, 0.158], bodySY: [3.3, 3.2102] };
  const WALK = {
    bodyY: [0.21, 0.2426, 0.2674, 0.2867, 0.302, 0.3139, 0.3229, 0.3295, 0.3338, 0.336, 0.3361, 0.3343, 0.3304,
      0.3246, 0.3166, 0.3064, 0.2937, 0.2783, 0.2597, 0.2372, 0.21, 0.2409, 0.2645, 0.2832, 0.298, 0.3098, 0.3189,
      0.3257, 0.3304, 0.333, 0.3335, 0.3321, 0.3287, 0.323, 0.3148, 0.3039, 0.2896, 0.2708, 0.2458],
    hatY: [0.21, 0.2326, 0.2528, 0.2706, 0.2864, 0.3002, 0.3121, 0.3222, 0.3304, 0.3368, 0.3412, 0.3436, 0.3438,
      0.3417, 0.3369, 0.3291, 0.3177, 0.302, 0.2806, 0.2515, 0.21, 0.2249, 0.2396, 0.2539, 0.2678, 0.2812, 0.2938,
      0.3055, 0.3159, 0.3249, 0.3318, 0.3363, 0.3378, 0.3356, 0.3289, 0.3171, 0.2995, 0.2758, 0.2458],
    rotZ: [0, 0.46, 0.9, 1.31, 1.7, 2.06, 2.37, 2.65, 2.87, 3.03, 3.13, 3.15, 3.08, 2.91, 2.65, 2.3, 1.88, 1.41,
      0.93, 0.45, 0, -0.61, -1.15, -1.64, -2.07, -2.43, -2.73, -2.96, -3.12, -3.2, -3.22, -3.16, -3.03, -2.82,
      -2.54, -2.18, -1.74, -1.24, -0.65],
  };
  const ANIM_FADE = 0.1;
  function idleKey(k, t) {             // smooth (flat-tangent) keys at 0 / 1 / 2 s
    const x = t % 2, u = x % 1, h = u * u * (3 - 2 * u);
    return x < 1 ? k[0] + (k[1] - k[0]) * h : k[1] + (k[0] - k[1]) * h;
  }
  function walkKey(k, t) {             // 39 samples over 0.65 s, looped
    const x = (t * 60) % k.length, i = Math.floor(x), u = x - i;
    return k[i] + (k[(i + 1) % k.length] - k[i]) * u;
  }
  function animPose(walking, t) {
    return walking
      ? { bodyY: walkKey(WALK.bodyY, t), hatY: walkKey(WALK.hatY, t), sy: IDLE.bodySY[0], rot: walkKey(WALK.rotZ, t) }
      : { bodyY: idleKey(IDLE.bodyY, t), hatY: idleKey(IDLE.hatY, t), sy: idleKey(IDLE.bodySY, t), rot: 0 };
  }

  // ------------------------------------------------------------------ cosmetic driver
  // The Animator pose of Graphics / Helmet, plus the fallback art's state (walk cycle, facing,
  // flashes). GroundDust emits by itself (rate over distance).
  class PlayerGraphics extends U.MonoBehaviour {
    Awake() {
      this.pc = this.GetComponent(PlayerController);
      this.ps = this.GetComponent(PlayerStats);
      this.walk = 0;
      this.anim = { cur: false, t: 0, next: null, nextT: 0, w: 0, jumpStamp: -1 };
    }
    // Animator update (scaled time): state machine Idle <-> Walk, then write the blended pose
    _animate(dt) {
      const A = this.anim, an = this.pc.player_animator;
      const want = an.GetBool('isWalking');
      if (an.stateTime !== A.jumpStamp) {      // Jump: straight back into a restarted Idle / Walk
        A.jumpStamp = an.stateTime;
        if (A.jumpStamp >= 0) { A.cur = want; A.t = 0; A.next = null; }
      }
      if (A.next === null && want !== A.cur) { A.next = want; A.nextT = 0; A.w = 0; }
      A.t += dt;
      if (A.next !== null) {
        A.nextT += dt;
        A.w = Math.min(1, A.w + dt / ANIM_FADE);
        if (A.w >= 1) { A.cur = A.next; A.t = A.nextT; A.next = null; }
      }
      let p = animPose(A.cur, A.t);
      if (A.next !== null) {
        const q = animPose(A.next, A.nextT), w = A.w;
        p = { bodyY: p.bodyY + (q.bodyY - p.bodyY) * w, hatY: p.hatY + (q.hatY - p.hatY) * w, sy: p.sy + (q.sy - p.sy) * w, rot: p.rot + (q.rot - p.rot) * w };
      }
      const G = PF.children.Graphics.transform, H = PF.children.Helmet.transform;
      const gt = this.body.transform, ht = this.hat.transform;
      gt.localPosition = new Vector3(G.pos.x, p.bodyY, 0);
      gt.localScale = new Vector3(G.scale.x, p.sy, 1);
      gt.localRotation = Quaternion.Euler(0, 0, p.rot);
      ht.localPosition = new Vector3(H.pos.x, p.hatY, 0);
    }
    LateUpdate() {
      const pc = this.pc, ps = this.ps;
      if (!pc || !ps || !this.body) return;
      const dt = U.Time.deltaTime, ut = U.Time.unscaledTime;
      if (pc.player_animator) this._animate(dt);
      const walking = pc._moveVec.x !== 0 && pc.is_grounded && dt > 0;
      if (walking) this.walk = (this.walk + dt * 1.9 * Math.max(0.3, ps.speed)) % 1;
      const facing = Math.cos(pc.staffAngle * Mathf.Deg2Rad) >= 0 ? 1 : -1;
      ps._hurtFlash = Math.max(0, (ps._hurtFlash || 0) - dt * 4);
      // the original never flips the player (only the staff turns); the fallback art faces the aim
      const flip = facing < 0 && !As.has(SLS.Sprites.player);
      for (const r of [this.body, this.hat, this.cloak]) {
        r.flipX = flip;
        r.state.t = ut; r.state.walk = this.walk; r.state.air = !pc.is_grounded;
      }
      this.body.state.flash = ps._hurtFlash;
      this.staff.state.t = ut;
    }
  }

  // ==================================================================== rig
  const SCENE_INACTIVE = new Set(['Staff/Point/StreamerBeam', 'Effects/Overheat', 'Effects/BurningMan',
    'Effects/GodOfThunderEyes', 'Effects/VampireCloak', 'Effects/BloodyMage']);
  // StreamerBeam's collider and body (scene data that facts.js does not list)
  const STREAMER = { offset: { x: 0, y: 0.331605 }, size: { x: 1, y: 0.714824 }, mass: 0.2 };

  function child(parent, name, tf) {
    const go = new U.GameObject(name, { active: false });
    go.transform.SetParent(parent.transform, false);
    if (tf) {
      go.transform.localPosition = new Vector3(tf.pos.x, tf.pos.y, tf.pos.z);
      go.transform.localScale = new Vector3(tf.scale.x, tf.scale.y, tf.scale.z);
      go.transform.localRotation = Quaternion.Euler(0, 0, tf.rotZ || 0);
    }
    return go;
  }

  function buildPlayer() {
    const tf = PF.transform;
    const go = new U.GameObject('Player', { layer: SLS.Layer.Player, tag: SLS.Tag.Player, active: false });
    go.transform.position = new Vector3(tf.pos.x, tf.pos.y, tf.pos.z);
    go.transform.localScale = new Vector3(tf.scale.x, tf.scale.y, tf.scale.z);
    SLS.addPhysicsFromFacts(go, PF);
    const pc = go.AddComponent(PlayerController);
    const ps = go.AddComponent(PlayerStats);
    const gfx = go.AddComponent(PlayerGraphics);

    // child rig, with the original local transforms
    const kids = {};
    for (const path of Object.keys(PF.children)) {
      const parts = path.split('/'), name = parts.pop();
      const parent = parts.length ? kids[parts.join('/')] : go;
      kids[path] = child(parent, name, PF.children[path].transform);
    }

    const body = addShape(kids.Graphics, drawBody, 41);
    const hat = addShape(kids.Helmet, drawHat, 42);
    const staff = addShape(kids.Staff, drawStaff, 43);
    const shield = addShape(kids.Shield, drawShield, 42);   // order 2 like the Helmet: under the staff
    shield.color = new Color(0.47, 0.9, 1, 0);
    const cloak = addShape(kids['Effects/VampireCloak'], drawCloak, 40);

    // gamepad aim laser + its end marker
    const aim = kids['Staff/Aim'];
    const line = aim.AddComponent(U.LineRenderer2D);
    line.positionCount = 2;
    line.width = 0.028;
    line.dash = [0.14, 0.09];
    line.color = new Color(0.88, 0.9, 1, 0.6);
    line.glowColor = 'rgba(190,210,255,0.7)';
    line.sortingOrder = 50;
    addShape(kids['Staff/Aim/AimFinal'], drawAimMarker, 51);

    // Streamer beam (activated by the transcendence)
    const beam = kids['Staff/Point/StreamerBeam'];
    const box = beam.AddComponent(U.BoxCollider2D);
    box.isTrigger = true;
    box.offset = new Vector2(STREAMER.offset.x, STREAMER.offset.y);
    box.size = new Vector2(STREAMER.size.x, STREAMER.size.y);
    const brb = beam.AddComponent(U.Rigidbody2D);
    brb.bodyType = U.RigidbodyType2D.Dynamic; brb.mass = STREAMER.mass; brb.gravityScale = 0;
    if (SLS.StreamBeam) beam.AddComponent(SLS.StreamBeam);
    addShape(kids['Staff/Point/StreamerBeam/Graphics'], drawStreamBeam, 38);
    addParticles(kids['Staff/Point/StreamerBeam/Particle System'], FX.beamSparks);

    // effects
    addParticles(kids['Effects/Overheat'], FX.overheat);
    addParticles(kids['Effects/BurningMan'], FX.burningMan);
    addParticles(kids['Effects/GodOfThunderEyes/Eyes'], FX.eyes);
    addParticles(kids['Effects/GodOfThunderEyes/Eyes (1)'], FX.eyes);
    addParticles(kids['Effects/BloodyMage'], FX.bloody);
    addParticles(kids.GroundDust, FX.groundDust);

    for (const path of Object.keys(kids)) if (!SCENE_INACTIVE.has(path)) kids[path].SetActive(true);

    // the thunder-staff reticle (a scene object of its own) and its impact marker
    const thunderAim = new U.GameObject('ThunderAim', { active: false });
    thunderAim.transform.position = new Vector3(0, 6, 0);
    const tline = thunderAim.AddComponent(U.LineRenderer2D);
    tline.positionCount = 2;
    tline.width = 0.035;
    tline.dash = [0.18, 0.1];
    tline.color = new Color(1, 0.95, 0.6, 0.55);
    tline.glowColor = 'rgba(255,230,120,0.7)';
    tline.sortingOrder = 50;
    const thunderPoint = child(thunderAim, 'AimFinal', null);
    thunderPoint.transform.localScale = new Vector3(0.5, 0.5, 1);
    addShape(thunderPoint, drawThunderMarker, 51);
    thunderPoint.SetActive(true);

    const walkAudio = new U.GameObject('WalkAudio', { active: false });
    walkAudio.AddComponent(WalkAudio);

    // wiring (the original's serialized references)
    Object.assign(pc, {
      staff_obj: kids.Staff, staff_aim: aim, staff_aim_point: kids['Staff/Aim/AimFinal'], staff_point: kids['Staff/Point'],
      thunder_aim: thunderAim, thunder_point: thunderPoint,
      isGroundedChecker: kids.GroundChecker1.transform, isGroundedChecker2: kids.GroundChecker2.transform,
      walk_audio: walkAudio,
      autoattack_icon: {
        activeSelf: false,
        SetActive(v) { this.activeSelf = !!v; if (SLS.UIHooks && SLS.UIHooks.setAutoAttackIcon) SLS.UIHooks.setAutoAttackIcon(!!v); },
      },
    });
    Object.assign(ps, {
      shield_sprite: shield, player_graph: body, staff_graphic: staff, hat_graphic: hat, player_hat: hat,
      overheat: kids['Effects/Overheat'], burning_effect: kids['Effects/BurningMan'],
      godofthunder_effect: kids['Effects/GodOfThunderEyes'], vampire_effect: kids['Effects/VampireCloak'],
      bloody_effect: kids['Effects/BloodyMage'], streamer_beam: beam,
    });
    Object.assign(gfx, { body, hat, staff, cloak });
    // the staff/hat drawings start with item 0 until Start selects it
    staff.state.itemId = STAFFS[0].id;
    hat.state.itemId = HATS[0].id;

    thunderAim.SetActive(true);
    go.SetActive(true);           // Awake / OnEnable for the whole rig
    return go;
  }

  SLS.PlayerController = PlayerController;
  SLS.PlayerStats = PlayerStats;
  if (typeof U.registerScript === 'function') { U.registerScript(PlayerController); U.registerScript(PlayerStats); }
  onBoot(20, buildPlayer);

  // ==================================================================== ?test=player
  // Test scenario. With the whole game loaded it starts a run like the title's Begin button
  // (WaveManager.StartGame + UnpauseGame). Without a WaveManager, or with &dummies, the arena stays
  // idle and a few static target dummies (an EnemyStats-like stub defined here) stand in for the
  // enemies. Digits 1-7 pick a staff. SLS_TEST.player() / .setStaff(i) / .setHat(i) / .shots help
  // the harness.
  if (SLS.Debug.test === 'player') {
    onBoot(90, function setupPlayerTest() {
      const wantDummies = !SLS.Game.waveManager || SLS.Debug.params.has('dummies');
      const dummies = wantDummies ? spawnTestDummies() : [];
      let frames = 0, started = false;
      U.Loop.onFrame.push(() => {       // after WaveManager.Start (first frame), which pauses the title
        if (started || ++frames < 2) return;
        started = true;
        const wm = SLS.Game.waveManager;
        if (wm && !wantDummies) {
          if (!(wm.wave_number > 0)) { if (wm.StartGame) wm.StartGame(); if (wm.UnpauseGame) wm.UnpauseGame(); }
          return;
        }
        if (wm) { wm.wave_number = Math.max(1, wm.wave_number | 0); wm.state = 'test'; wm.paused = false; }
        U.Time.timeScale = 1;
      });
      const ps = () => SLS.Game.playerStats, pc = () => SLS.Game.playerController;
      const applyStaff = (i) => {      // equip without the unlock check
        const p = ps(); if (!p) return;
        p.staff = Mathf.Clamp(i, 0, STAFFS.length - 1);
        const item = STAFFS[p.staff];
        p.staff_graphic.state.itemId = item.id;
        pc().projectile = item.projectile;
        p.atk_speed = f32(item.attackSpeed);
        pc().atk_speed_before = p.atk_speed;
        pc().EnableVisualAim(isGamepad());
      };
      const applyHat = (i) => {
        const p = ps(); if (!p) return;
        p.hat = Mathf.Clamp(i, 0, HATS.length - 1);
        const item = HATS[p.hat];
        p.hat_graphic.state.itemId = item.id;
        p.jump_number = item.jumpNumber; p.armor = item.armor; p.speed = item.speed;
      };
      window.addEventListener('keydown', (e) => {
        const m = /^Digit([1-7])$/.exec(e.code);
        if (m) applyStaff(+m[1] - 1);
      });
      // shot log: the fixed time of every shot (wraps this instance's Shoot)
      const shots = [];
      const hookShots = () => {
        const c = pc();
        if (!c || c._testWrapped) return;
        c._testWrapped = true;
        const orig = c.Shoot.bind(c);
        c.Shoot = () => { const before = c.attack_cooldown; orig(); if (c.attack_cooldown > before) shots.push(+U.Time.fixedTime.toFixed(2)); };
      };
      const snapshot = () => {
        hookShots();
        const p = ps(), c = pc();
        if (!p || !c) return { alive: false };
        const pos = p.transform.position, v = c.rigid_body ? c.rigid_body.velocity : { x: 0, y: 0 };
        return {
          x: +pos.x.toFixed(3), y: +pos.y.toFixed(3), vx: +v.x.toFixed(2), vy: +v.y.toFixed(2),
          grounded: c.is_grounded, jumps_made: c.jumps_made, staff: p.staff, hat: p.hat, staffAngle: +c.staffAngle.toFixed(1),
          projectile: c.projectile, atk_speed: p.atk_speed, hp: p.hp, max_hp: p.max_hp, shield_up: p.shield_up,
          projectiles: U.GameObject.FindGameObjectsWithTag(SLS.Tag.Projectile).length,
          dummyDamage: dummies.map((d) => Math.round(d.damage_taken * 100) / 100),
          dummyHits: dummies.map((d) => d.hits),
        };
      };
      U.Loop.onFrame.push(hookShots);
      const T = window.SLS_TEST;
      if (T) {
        const base = T.state;
        T.state = () => Object.assign(base(), { player: snapshot() });
        T.player = snapshot;
        T.setStaff = applyStaff;
        T.setHat = applyHat;
        T.shots = shots;
        T.dummies = dummies;
      }
    });
  }

  function spawnTestDummies() {
    const wr = F.prefabs.Weak_Ranged;
    class EnemyStats extends U.MonoBehaviour {
      constructor() { super(); applyFields(this, wr.scripts.EnemyStats); this.damage_taken = 0; this.hits = 0; this.log = []; }
      Awake() { this.hp = this.max_hp; }
      RemoveHP(d) {
        this.hp -= d; this.damage_taken += d; this.hits++;
        this.log.push(+d.toFixed(4));
        if (this.log.length > 40) this.log.shift();
        if (this.hp <= 0) this.hp = this.max_hp;      // dummies never die
      }
    }
    class RangedBehavior extends U.MonoBehaviour {
      BlinkHit() { this.flash = 1; }
      ReturnColor() { }
      Update() { this.flash = Math.max(0, (this.flash || 0) - U.Time.unscaledDeltaTime * 6); }
    }
    class DummyLabel extends U.MonoBehaviour {
      LateUpdate() { this.text.text = this.es.damage_taken ? String(Math.round(this.es.damage_taken * 10) / 10) : ''; }
    }
    const out = [];
    for (const [x, y] of [[0.5, -1.0], [-3.2, -0.6], [3.6, -0.4], [-6.2, 0.4], [6.5, 0.6]]) {
      const d = new U.GameObject('TestDummy', { layer: SLS.Layer.Enemy, tag: SLS.Tag.Enemy, active: false });
      d.transform.position = new Vector3(x, y, 0);
      d.transform.localScale = new Vector3(wr.transform.scale.x, wr.transform.scale.y, 1);
      SLS.addPhysicsFromFacts(d, wr);
      d.GetComponent(U.Rigidbody2D).constraints = U.RigidbodyConstraints2D.FreezeAll;
      const es = d.AddComponent(EnemyStats);
      const rbh = d.AddComponent(RangedBehavior);
      const r = d.AddComponent(U.ShapeRenderer);
      r.sortingOrder = 20;
      r.draw = (ctx) => SLS.Art.enemy(ctx, { kind: 'ranged', size: 0, tier: 0, t: U.Time.unscaledTime, hurt: rbh.flash || 0, w: 0.8, h: 1.2, seed: x });
      const label = new U.GameObject('label', { active: false });
      label.transform.SetParent(d.transform, false);
      label.transform.localPosition = new Vector3(0, 1.0, 0);
      const wt = label.AddComponent(U.WorldText);
      wt.size = 0.6;
      const dl = label.AddComponent(DummyLabel);
      dl.text = wt; dl.es = es;
      label.SetActive(true);
      d.SetActive(true);
      out.push(es);
    }
    return out;
  }
})(window.SLS, window.U);
