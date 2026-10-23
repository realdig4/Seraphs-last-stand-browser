/*
 * waves.js - WaveManager: the run's state machine (startup order 30).
 *
 * Start (paused until StartGame) -> StartGame (UI "Begin") -> StartWave -> FixedUpdate:
 * GenerateWave / CheckWaveEnd / WaveDebbuger -> CheckWaveEnd opens the shop
 * (ShopManager.StartShop) -> the shop calls StartWave -> ...
 *
 * Kept from the original: wave budget wave^2 + 10 (x2 with hat 4), the per-tick roster with its
 * exact wave windows, costs and melee rolls, 0.6-1.0 s spawn ticks, the wave-60 boss with the 50/50
 * pick, the +2 max HP per cleared wave, the anti-stall sweep, the avenger revive recharge, the
 * speedrunner counter, permanent upgrades (ApplyUpgradeLvl) and the pause toggle (0.1 s debounce).
 * Steam achievements and the GameExtensions anti-tamper hash are not part of the remake.
 *
 * Scene objects the original toggled directly are small stand-ins here:
 *   pause_screen / options_screen -> SLS.UIHooks.setPaused(bool)
 *   boss_ui + boss_name_ui         -> SLS.UIHooks.showBoss(name, enemyStats) / hideBoss()
 *   music_source                   -> the engine's music channel (U.Audio.playMusic; volume 0 mutes it)
 *   shop_audio                     -> the "shop" ShopBG loop (U.Audio.setLoop)
 *   audio_source ("SFX")           -> SLS.sfx
 */
'use strict';
(function (SLS, U) {
  const { Vector3, Quaternion, Mathf } = U;
  const F = SLS.F;
  const Util = () => SLS.EnemyUtil || {};
  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
  const call = (obj, method, ...args) => (obj && typeof obj[method] === 'function' ? obj[method](...args) : undefined);
  function hook(name, ...args) {
    const H = SLS.UIHooks;
    if (!H || typeof H[name] !== 'function') return;
    try { H[name](...args); } catch (e) { U.reportError(e, null, 'SLS.UIHooks.' + name); }
  }
  function findPlayerStats() {
    if (Util().findPlayerStats) return Util().findPlayerStats();
    return U.alive(SLS.Game.playerStats) ? SLS.Game.playerStats : null;
  }
  function playerController(ps) {
    if (Util().playerControllerOf) return Util().playerControllerOf(ps);
    return U.alive(SLS.Game.playerController) ? SLS.Game.playerController : null;
  }
  function findShopManager() {
    if (U.alive(SLS.Game.shopManager)) return SLS.Game.shopManager;
    const go = U.GameObject.FindWithTag(SLS.Tag.ShopManager);
    return go ? go.GetComponent('ShopManager') : null;
  }
  function findProgression() {
    if (U.alive(SLS.Game.progression)) return SLS.Game.progression;
    const go = U.GameObject.Find('ProgressionManager');
    return go ? go.GetComponent('ProgresisonManager') : null;
  }
  // ShopManager.OnScreen is a static property in the original
  function shopOnScreen() {
    const sm = SLS.Game.shopManager;
    const C = SLS.ShopManager || (sm && sm.constructor) || window.ShopManager;
    return !!((C && C.OnScreen) || (sm && sm.OnScreen === true));
  }
  // Remake guard: the enemy prefabs are registered by enemies.js. Without that module there is
  // nothing to spawn (SLS.spawn would throw "no prefab factory" on every tick).
  function hasPrefab(ref) {
    const name = typeof ref === 'string' ? ref : ref && ref.prefabName;
    return !!(name && SLS.Prefabs && SLS.Prefabs[name]);
  }

  // ---------------------------------------------------------------- music stand-ins
  // music_source played the battle clip (volume x0.25 during the shop, 0 while a Transcendence
  // popup is open) and shop_audio was a second looping source switched on for the shop. Both feed
  // _refreshMusic, which maps them onto the engine's music channel and "shop" loop.
  class MusicSource {
    constructor(owner) { this._owner = owner; this.clip = null; this._volume = 1; this.isPlaying = false; }
    get volume() { return this._volume; }
    set volume(v) { this._volume = Math.max(0, num(v)); this._owner._refreshMusic(); }
    Play() { this.isPlaying = true; this._owner._refreshMusic(); }
    Stop() { this.isPlaying = false; }
  }
  class ShopAudio {
    constructor(owner) { this._owner = owner; this.activeSelf = false; }
    SetActive(v) { v = !!v; if (v === this.activeSelf) return; this.activeSelf = v; this._owner._refreshMusic(); }
  }

  // ================================================================ WaveManager
  class WaveManager extends U.MonoBehaviour {
    constructor() {
      super();
      const scene = (F.managers.WaveManager || {}).WaveManager || {};
      const ref = (k, d) => (scene[k] && scene[k].prefab) || d;
      this.wave_number = 0;
      this.finalScore = null;
      this.wave_number_text = { text: '' };
      this.wave_points = 0;
      this.enemies_alive = 0;
      this.state = 'wave';
      this.audio_source = null;
      this.end_wave_audio = 'waveEnd';
      this.shop_audio = new ShopAudio(this);
      this.buy_card_audio = 'buy';
      this.music_source = new MusicSource(this);
      // the four easy/hard track pairs (part 1 until wave 30, part 2 from wave 31)
      ['This is the end', 'Wraiths', 'Lunar Loop', 'Divine Retribution'].forEach((n, i) => {
        this['music_' + (i + 1) + '_easy'] = n + ' - part 1';
        this['music_' + (i + 1) + '_hard'] = n + ' - part 2';
      });
      this.music_easy = null;
      this.music_hard = null;
      this.can_change_music = true;
      this.enemies_to_spawn = null;
      this.generation_cooldown = 0;
      this.weak_ranged = ref('weak_ranged', 'Weak_Ranged');
      this.medium_ranged = ref('medium_ranged', 'Medium_Ranged');
      this.strong_ranged = ref('strong_ranged', 'Strong_Ranged');
      this.weak_melee = ref('weak_melee', 'Weak_Melee');
      this.strong_melee = ref('strong_melee', 'Strong_Melee');
      this.cannon = ref('cannon', 'Cannon');
      this.weak_ranged_plus = ref('weak_ranged_plus', 'Weak_Ranged+');
      this.medium_ranged_plus = ref('medium_ranged_plus', 'Medium_Ranged+');
      this.strong_ranged_plus = ref('strong_ranged_plus', 'Strong_Ranged+');
      this.weak_melee_plus = ref('weak_melee_plus', 'Weak_Melee+');
      this.strong_melee_plus = ref('strong_melee_plus', 'Strong_Melee+');
      this.cannon_plus = ref('cannon_plus', 'Cannon+');
      this.weak_ranged_plus_plus = ref('weak_ranged_plus_plus', 'Weak_Ranged++');
      this.medium_ranged_plus_plus = ref('medium_ranged_plus_plus', 'Medium_Ranged++');
      this.strong_ranged_plus_plus = ref('strong_ranged_plus_plus', 'Strong_Ranged++');
      this.weak_melee_plus_plus = ref('weak_melee_plus_plus', 'Weak_Melee++');
      this.strong_melee_plus_plus = ref('strong_melee_plus_plus', 'Strong_Melee++');
      this.cannon_plus_plus = ref('cannon_plus_plus', 'Cannon++');
      this.weak_ranged_end = ref('weak_ranged_end', 'Weak_Ranged_END');
      this.boss_1 = ref('boss_1', 'Boss1');
      this.boss_2 = ref('boss_2', 'Boss2');
      this.shop_manager = null;
      this.debug_countdown = 10;
      this.debug_countdown2 = typeof scene.debug_countdown2 === 'number' ? scene.debug_countdown2 : 45;
      this.debug_roll_cd = 3;
      this.enemy_count = null;
      this.enemy_total = 0;
      this.pauseTime = 0;
      this.paused = false;
      this.pause_screen = { SetActive: (v) => hook('setPaused', !!v) };
      this.options_screen = { SetActive: () => {} };   // the setPaused hook covers pause + options
      this.options_ = { music_volume: { value: 1 } };  // music volume is relative to the Options volume
      this.players_stats = null;
      this.progression_manager = null;
      this.boss_name_ui = { text: '' };
      this.boss_hp_ui = { maxValue: 1, value: 0 };
      this.boss_ui = { activeSelf: false, SetActive: (v) => this._setBossUi(!!v) };
      this.boss_obj = null;
      this.speedrunner_counter = 1200;
      this._gameStarted = false;
      this._pauseListener = null;
    }

    // Quantum Console command in the original: sets the wave without touching anything else.
    SetWave(wave) { this.wave_number = wave | 0; }

    Awake() {
      if (!U.alive(WaveManager.Instance)) {
        WaveManager.Instance = this;
        SLS.Game.waveManager = this;
      } else if (WaveManager.Instance !== this) {
        U.Destroy(this.gameObject);
      }
    }

    Start() {
      // The original also showed its pause_screen here; in the remake the title screen plays that
      // role, so no UI hook is called until StartGame / UnpauseGame.
      this.paused = true;
      U.Time.timeScale = 0;
      this.enemies_to_spawn = [];
      const self = this;
      this.finalScore = { get value() { return self.wave_number; } };   // int* to wave_number
      this.shop_manager = findShopManager();
      this.audio_source = SLS.SfxSource || { PlayOneShot: (clip) => clip && SLS.sfx(clip) };
      this.players_stats = findPlayerStats();
      this.progression_manager = findProgression();
      this.RandomMusic();
      // ?autostart: begin immediately (at ?wave=N if given, see StartGame), like pressing Begin
      if (SLS.Debug.autostart) {
        this.StartGame();
        this.UnpauseGame();
      }
    }

    FixedUpdate() {
      if (this.state === 'wave') {
        this.GenerateWave();
        this.CheckWaveEnd();
        this.WaveDebbuger();
      }
      if (this.boss_ui.activeSelf && U.alive(this.boss_obj)) {
        const es = this.boss_obj.GetComponent('EnemyStats');
        if (es) { this.boss_hp_ui.maxValue = es.max_hp; this.boss_hp_ui.value = es.hp; }
      } else {
        this.boss_ui.SetActive(false);
      }
      this.RunSpeedRunnerCounter();
    }

    OnEnable() {
      const action = U.Input.action && U.Input.action('Pause');
      if (action && !this._pauseListener) {
        this._pauseListener = () => this.OnPause();
        action.performed.push(this._pauseListener);
      }
    }
    OnDestroy() {
      const action = U.Input.action && U.Input.action('Pause');
      if (action && this._pauseListener) {
        const i = action.performed.indexOf(this._pauseListener);
        if (i >= 0) action.performed.splice(i, 1);
      }
      this._pauseListener = null;
      if (WaveManager.Instance === this) { WaveManager.Instance = null; if (SLS.Game.waveManager === this) SLS.Game.waveManager = null; }
    }

    // InputManager.Pause (Escape / P / gamepad Start), debounced by 0.1 s of unscaled time
    OnPause() {
      if (U.Time.unscaledTime < this.pauseTime) return;
      this.pauseTime = U.Time.unscaledTime + 0.1;
      if (this.wave_number > 0 && !shopOnScreen() && U.alive(this.players_stats)) {
        if (!this.paused) { this.PauseGame(); this.options_screen.SetActive(true); }
        else { this.UnpauseGame(); this.options_screen.SetActive(false); }
      }
    }
    // Present in the original but not subscribed to any input there either.
    OnBack() {
      if (this.wave_number > 0 && !shopOnScreen() && U.alive(this.players_stats) && this.paused) {
        this.UnpauseGame();
        this.options_screen.SetActive(false);
      }
    }

    _ps() {
      if (!this.players_stats) this.players_stats = findPlayerStats();
      return this.players_stats;
    }

    // Called by StartGame and by the shop (ItemScript.BuyCard / CloseShop).
    StartWave() {
      this.state = 'wave';
      this.debug_countdown = 10;
      this.debug_countdown2 = 45;
      for (const go of U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy)) U.Destroy(go);
      this.enemies_alive = 0;
      U.Time.timeScale = 1;
      this.wave_points = Mathf.RoundToInt(this.wave_number * this.wave_number) + 10;
      const ps = this._ps();
      if (ps) {
        if (ps.hat === 4) this.wave_points *= 2;
        this.ReviveCooldown();
        const pc = playerController(ps);
        if (pc && typeof pc.atk_speed_before === 'number') ps.atk_speed = pc.atk_speed_before;
        if (ps.desperate) ps.hp = ps.max_hp;
      }
      // (achiev_03 at wave 89 and the wave-59 speedrunner achievement are Steam-only)
      this.enemy_total = 0;
      if (this.shop_audio.activeSelf) this.shop_audio.SetActive(false);   // remake safety: the shop normally does this
      this.music_source.volume = this.options_.music_volume.value;
      if (this.wave_number > 30 && this.can_change_music) {
        this.music_source.Stop();
        this.music_source.clip = this.music_hard;
        this.music_source.Play();
        this.can_change_music = false;
      }
      call(playerController(ps), 'EnableVisualAim', U.Input.lastDevice === 'gamepad');
    }

    // Every physics step in state "wave": one tick spawns one enemy of every eligible line at once.
    GenerateWave() {
      const w = this.wave_number;
      // enemies_alive / enemy_total count each spawned enemy (EnemyStats.CheckHP decrements the first
      // on death). Remake guard: only what SpawnMonster really spawned is counted, so without
      // enemies.js the wave still spends its points and ends. With the prefabs registered (always,
      // in the full game) this is the original's unconditional count.
      const counted = (go) => { if (go) { this.enemies_alive++; this.enemy_total++; } };
      if (w === 60) {
        if (this.wave_points < 1) return;
        const boss = U.Random.RangeInt(0, 2);
        if (boss === 0) {
          counted(this.SpawnMonster(this.boss_1));
          this.wave_points = 0;
          this.debug_countdown2 = 3000;
          this.InvokeBoss(SLS.T('enemies.boss1'));
        } else if (boss === 1) {
          counted(this.SpawnMonster(this.boss_2));
          this.wave_points = 0;
          this.debug_countdown2 = 3000;
          this.InvokeBoss(SLS.T('enemies.boss2'));
        }
      }
      if (this.wave_points <= 0) return;
      if (this.generation_cooldown > 0) {
        this.generation_cooldown -= U.Time.deltaTime;
        return;
      }
      const spawn = (prefab, cost) => {
        const go = this.SpawnMonster(prefab);
        this.wave_points -= cost;
        counted(go);
      };
      // weak ranged, cost 5
      if (w > 0) {
        if (w < 30) spawn(this.weak_ranged, 5);
        if (w >= 30 && w < 60) spawn(this.weak_ranged_plus, 5);
        if (w >= 60 && w < 90) spawn(this.weak_ranged_plus_plus, 5);
        if (w > 89) spawn(this.weak_ranged_end, 5);
      }
      // medium ranged, cost 19
      if (w > 5) {
        if (w < 35) spawn(this.medium_ranged, 19);
        if (w >= 35 && w < 65) spawn(this.medium_ranged_plus, 19);
        if (w > 64) spawn(this.medium_ranged_plus_plus, 19);
      }
      // weak melee, cost 39, one tick in three
      if (w > 10 && U.Random.RangeInt(0, 3) === 1) {
        if (w >= 11 && w < 40) spawn(this.weak_melee, 39);
        if (w >= 40 && w < 70) spawn(this.weak_melee_plus, 39);
        if (w > 69) spawn(this.weak_melee_plus_plus, 39);
      }
      // cannon, cost 65
      if (w > 15) {
        if (w < 45) spawn(this.cannon, 65);
        if (w >= 45 && w < 75) spawn(this.cannon_plus, 65);
        if (w > 74) spawn(this.cannon_plus_plus, 65);
      }
      // strong ranged, cost 97
      if (w > 20) {
        if (w < 50) spawn(this.strong_ranged, 97);
        if (w >= 50 && w < 80) spawn(this.strong_ranged_plus, 97);
        if (w > 79) spawn(this.strong_ranged_plus_plus, 97);
      }
      // strong melee, cost 195, one tick in four
      if (w > 25 && U.Random.RangeInt(0, 4) === 1) {
        if (w >= 26 && w < 55) spawn(this.strong_melee, 195);
        if (w >= 55 && w < 85) spawn(this.strong_melee_plus, 195);
        if (w > 84) spawn(this.strong_melee_plus_plus, 195);
      }
      this.generation_cooldown = U.Random.Range(-0.2, 0.2) + 0.8;
    }

    // Enemies enter from above the arena (y 5.5..6.3 is above the y = 5.2 bound). Returns the new
    // GameObject, or null when the prefab's module is not loaded (the position is still rolled).
    SpawnMonster(monster) {
      const x = U.Random.Range(-7.5, 7.5);
      const y = U.Random.Range(5.5, 6.3);
      if (!hasPrefab(monster)) return null;
      return U.Instantiate(monster, new Vector3(x, y, 0), Quaternion.identity);
    }

    CheckWaveEnd() {
      if (this.enemies_alive > 0 || this.wave_points > 0 || this.wave_number === 0) return;
      this.wave_number_text.text = String(this.wave_number);   // pre-increment value, as in the original
      // (GetBossAchievment: Steam-only)
      this.wave_number++;
      this.music_source.volume = this.options_.music_volume.value * 0.25;
      this.state = 'shop';
      const ps = this._ps();
      if (ps) { ps.max_hp += 2; ps.hp += 2; }
      U.Time.timeScale = 0;
      this.ClearProjectiles();
      const sm = this.shop_manager && U.alive(this.shop_manager) ? this.shop_manager : (this.shop_manager = findShopManager());
      if (sm && typeof sm.StartShop === 'function') {
        try { sm.StartShop(); } catch (e) { U.reportError(e, sm, 'StartShop'); }
      } else {
        // remake fallback while the shop module is missing: continue with the next wave
        this.StartCoroutine(this._continueWithoutShop());
      }
      this.audio_source.PlayOneShot(this.end_wave_audio, 0.3);
      this.shop_audio.SetActive(true);
      const pc = playerController(ps);
      if (pc && pc.walk_audio && typeof pc.walk_audio.SetActive === 'function') pc.walk_audio.SetActive(false);
    }
    *_continueWithoutShop() {
      yield new U.WaitForSecondsRealtime(1.2);
      if (this.state === 'shop' && !U.alive(findShopManager())) {
        this.shop_audio.SetActive(false);
        this.StartWave();
      }
    }

    // Bound to the title's Begin button (with UnpauseGame).
    StartGame() {
      if (this._gameStarted) return;   // remake guard: one run per page load (restart reloads)
      this._gameStarted = true;
      const ps = this._ps();
      if (ps) {
        if (typeof ps.HasSelectedStaff === 'function' && !ps.HasSelectedStaff()) call(ps, 'SelectStaffWithIndex', 0);
        if (typeof ps.HasSelectedHat === 'function' && !ps.HasSelectedHat()) call(ps, 'SelectHatWithIndex', 0);
      }
      // ?wave=N: the original's SetWave(N - 1) before pressing Start
      if (this.wave_number === 0 && SLS.Debug.startWave > 1) this.SetWave(SLS.Debug.startWave - 1);
      this.wave_number++;
      this.wave_number_text.text = String(this.wave_number);
      const pc = playerController(ps);
      if (pc && ps) pc.atk_speed_before = ps.atk_speed;
      this.ApplyUpgradeLvl();
      this.StartWave();
      U.Audio.ambientVolume = 0.5;   // the Start button sets the Ambient source to 0.5
      if (U.Audio.setLoop) U.Audio.setLoop('ambient', 'Sandstorm', true, 0.5, 'sfx');
      this.music_source.Stop();
      this.music_source.clip = this.music_easy;
      this.music_source.Play();
    }

    ClearProjectiles() {
      for (const tag of [SLS.Tag.ProjectileEnemy, SLS.Tag.Projectile, SLS.Tag.BlackHole]) {
        for (const go of U.GameObject.FindGameObjectsWithTag(tag)) U.Destroy(go);
      }
    }

    // Anti-stall: with few enemies left for 45 s, every "Enemy" is killed through RemoveHP (drops
    // still happen). Both blocks share one timer, so it runs twice as fast past wave 40.
    WaveDebbuger() {
      const sweep = () => {
        for (const go of U.GameObject.FindGameObjectsWithTag(SLS.Tag.Enemy)) {
          const es = go.GetComponent('EnemyStats');
          if (!es) continue;
          es.wave_manager = this;
          es.RemoveHP(es.hp + 1);
        }
        this.debug_countdown2 = 45;
      };
      if (this.enemies_alive < 3) {
        if (this.debug_countdown2 < 0) sweep();
        else this.debug_countdown2 -= U.Time.deltaTime;
      }
      if (this.enemies_alive < 6 && this.wave_number > 40) {
        if (this.debug_countdown2 < 0) sweep();
        else this.debug_countdown2 -= U.Time.deltaTime;
      }
    }

    PauseGame() {
      this.paused = true;
      U.Time.timeScale = 0;
      this.pause_screen.SetActive(true);
    }
    UnpauseGame() {
      this.paused = false;
      U.Time.timeScale = 1;
      this.pause_screen.SetActive(false);
    }

    // Permanent soul upgrades from ProgresisonManager, once per run (StartGame).
    ApplyUpgradeLvl() {
      const ps = this._ps();
      const pm = this.progression_manager || (this.progression_manager = findProgression());
      if (!ps || !pm) return;
      const lvl = (k) => num(pm[k]) | 0;
      ps.atk_damage = num(ps.atk_damage) + Mathf.IntDiv(lvl('atk_lvl'), 2);
      const pc = playerController(ps);
      if (pc && typeof pc.atk_speed_before === 'number') ps.atk_speed = pc.atk_speed_before;
      ps.atk_speed -= num(ps.atk_speed) * 0.05 * lvl('atk_speed_lvl');
      if (pc) pc.atk_speed_before = ps.atk_speed;
      ps.armor = num(ps.armor) + lvl('armor_lvl');
      ps.max_hp = num(ps.max_hp) + lvl('hp_lvl') * 5;
      ps.hp = ps.max_hp;
      ps.speed = num(ps.speed) + num(ps.speed) * 0.1 * lvl('speed_lvl');
      ps.proj_hits = num(ps.proj_hits) + lvl('stability_lvl');
      ps.soul_orb_level = num(ps.soul_orb_level) + lvl('soul_orb_lvl');
      ps.critical_chance = num(ps.critical_chance) + lvl('crit_lvl') * 2;
    }

    // Boss intro: the first "Enemy" is the boss (wave 60 spawns nothing else). It plays no sound.
    InvokeBoss(boss_name) {
      this.boss_obj = U.GameObject.FindWithTag(SLS.Tag.Enemy);
      const es = this.boss_obj ? this.boss_obj.GetComponent('EnemyStats') : null;
      if (!es) return;
      this.boss_hp_ui.maxValue = es.max_hp;
      this.boss_hp_ui.value = es.hp;
      this.boss_name_ui.text = boss_name;
      this.boss_ui.SetActive(true);
    }
    _setBossUi(active) {
      if (active === this.boss_ui.activeSelf) return;
      this.boss_ui.activeSelf = active;
      if (active) hook('showBoss', this.boss_name_ui.text, this.boss_obj ? this.boss_obj.GetComponent('EnemyStats') : null);
      else hook('hideBoss');
      this._refreshMusic();
    }

    RandomMusic() {
      const track = U.Random.RangeInt(0, 4);
      this.music_easy = this['music_' + (track + 1) + '_easy'];
      this.music_hard = this['music_' + (track + 1) + '_hard'];
    }
    // Maps music_source / shop_audio onto the engine: the battle clip on the music channel (the
    // x0.25 shop volume becomes the engine's muffled mode) and the ShopBG loop.
    _refreshMusic() {
      const A = U.Audio;
      if (!A) return;
      // ShopAudio: its own ShopBG loop, scaled by the music slider, over the x0.25 battle music
      if (A.setLoop) A.setLoop('shop', 'ShopBG', this.shop_audio.activeSelf, 1, 'music');
      const src = this.music_source;
      const track = src.isPlaying && src.clip ? src.clip : null;
      if (!track) { if (A.music.track) A.stopMusic(); return; }
      if (src.volume <= 0.001) {
        // AudioSource.volume = 0 only silences the source and the clip keeps running
        // (Transcendence.Update zeroes it every frame, ContinueGame restores it): mute the channel
        // where it is, never stop or (re)start it. Any later engine volume update unmutes it.
        const mus = A.musicEl;
        if (mus && mus.el && mus.track === track) mus.el.volume = 0;
        return;
      }
      A.playMusic(track);   // no-op while this track is playing: it continues where it is
      A.setMusicMuffled(src.volume < 0.999);
    }

    RunSpeedRunnerCounter() {
      if (this.speedrunner_counter > 0) this.speedrunner_counter -= U.Time.fixedDeltaTime;
    }

    // "Avenger": with no revive in hand, each wave start counts revive_cd down; at 0 a revive is
    // granted and the countdown restarts at 5.
    ReviveCooldown() {
      const ps = this._ps();
      if (!ps || !ps.avenger || !(num(ps.revive_count) < 1)) return;
      if (num(ps.revive_cd) > 0) ps.revive_cd--;
      else if (num(ps.revive_cd) === 0) { ps.revive_count = num(ps.revive_count) + 1; ps.revive_cd = 5; }
    }
  }
  WaveManager.Instance = null;
  SLS.WaveManager = WaveManager;
  if (!('WaveManager' in window)) window.WaveManager = WaveManager;
  if (typeof U.registerScript === 'function') U.registerScript(WaveManager);

  // SLS.addStartup comes from main.js (loaded after the modules): see SLS.EnemyUtil.addStartup
  function addStartup(order, fn) {
    if (typeof SLS.addStartup === 'function') { SLS.addStartup(order, fn); return; }
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof SLS.addStartup === 'function') SLS.addStartup(order, fn);
      else console.error('[waves] SLS.addStartup is missing');
    }, { once: true });
  }
  addStartup(30, () => {
    const go = new U.GameObject('WaveManager', { tag: SLS.Tag.WaveManager, layer: SLS.Layer.Default, active: false });
    go.AddComponent(WaveManager);
    go.SetActive(true);
  });
})(window.SLS, window.U);
