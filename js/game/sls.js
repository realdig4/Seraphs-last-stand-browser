/*
 * sls.js - shared game namespace: constants, facts, prefabs, save, text, debug.
 *
 * Every gameplay module registers into window.SLS. Classes keep the original
 * script names (PlayerStats, WaveManager, ...) and field names so that the
 * modules can call each other exactly like the original scripts did.
 */
'use strict';
window.SLS = window.SLS || {};
(function (SLS, U) {
  const F = SLS.F = window.SLS_FACTS;

  // ---------------------------------------------------------------- constants
  SLS.Layer = { Default: 0, TransparentFX: 1, IgnoreRaycast: 2, Ground: 3, Water: 4, UI: 5, Enemy: 6, Player: 7 };
  SLS.Tag = {
    Ground: 'Ground', ShopPanel: 'ShopPanel', ShopManager: 'ShopManager', WaveManager: 'WaveManager', Projectile: 'Projectile',
    ShopCard: 'ShopCard', Enemy: 'Enemy', ProjectileEnemy: 'ProjectileEnemy', OrbCharge: 'OrbCharge', LvlMark: 'LvlMark',
    BlackHole: 'BlackHole', Player: 'Player',
  };

  // ---------------------------------------------------------------- facts helpers
  SLS.prefab = (name) => {
    const p = F.prefabs[name];
    if (!p) throw new Error('unknown prefab facts: ' + name);
    return p;
  };
  SLS.script = (prefabName, cls) => (SLS.prefab(prefabName).scripts || {})[cls] || {};
  SLS.itemsById = {};
  for (const group of Object.keys(F.items)) for (const it of F.items[group]) SLS.itemsById[it.id] = Object.assign({ group }, it);
  SLS.item = (id) => SLS.itemsById[id];

  // ---------------------------------------------------------------- prefab factories
  // SLS.Prefabs[name] = (go, opts) => void : adds/configures components on an inactive GameObject.
  SLS.Prefabs = {};
  SLS.registerPrefab = (name, setup) => { SLS.Prefabs[name] = setup; };
  // Instantiate a prefab by its original name. Components are configured while the
  // object is inactive, then it is activated, so Awake sees configured fields (Unity order).
  SLS.spawn = function (name, position, rotation, parent, opts = {}) {
    const setup = SLS.Prefabs[name];
    if (!setup) throw new Error('no prefab factory: ' + name);
    const facts = F.prefabs[name] || {};
    const go = new U.GameObject(name, { active: false, layer: facts.layer || 0 });
    if (parent) go.transform.SetParent(parent, false);
    const tf = facts.transform;
    if (tf) {
      go.transform.localScale = new U.Vector3(tf.scale.x, tf.scale.y, tf.scale.z);
      if (tf.rotZ) go.transform.localRotation = U.Quaternion.Euler(0, 0, tf.rotZ);
    }
    if (position) go.transform.position = position;
    if (rotation) go.transform.rotation = rotation;
    setup(go, opts);
    if (opts.active !== false) go.SetActive(true);
    return go;
  };
  // helper to add collider/body from facts to a GameObject
  SLS.addPhysicsFromFacts = function (go, facts) {
    for (const c of facts.colliders || []) {
      let col;
      if (c.kind === 'box') { col = go.AddComponent(U.BoxCollider2D); col.size = new U.Vector2(c.size.x, c.size.y); }
      else { col = go.AddComponent(U.CircleCollider2D); col.radius = c.radius; }
      col.offset = new U.Vector2(c.offset.x, c.offset.y);
      col.isTrigger = c.trigger;
      col.enabled = c.enabled;
    }
    if (facts.body) {
      const b = facts.body, rb = go.AddComponent(U.Rigidbody2D);
      rb.bodyType = { dynamic: 0, kinematic: 1, static: 2 }[b.type];
      rb.mass = b.mass; rb.gravityScale = b.gravityScale; rb.drag = b.drag; rb.constraints = b.constraints;
      if (b.material) rb.sharedMaterial = { friction: b.material.friction, bounciness: b.material.bounciness };
    }
  };

  // ---------------------------------------------------------------- save (SaveManager-compatible API)
  // The original wrote an encrypted XML key/value file; the remake keeps the same
  // key names in localStorage.
  const SAVE_KEY = 'sls_remake_save_v1';
  const Save = SLS.Save = {
    data: {},
    load() {
      try { Save.data = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') || {}; } catch (e) { Save.data = {}; }
    },
    flush() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(Save.data)); } catch (e) { /* storage unavailable */ } },
    SetValue(key, value) { Save.data[key] = value; Save.flush(); },
    GetValue(key, def) { return Object.prototype.hasOwnProperty.call(Save.data, key) ? Save.data[key] : def; },
    HasKey(key) { return Object.prototype.hasOwnProperty.call(Save.data, key); },
    DeleteKey(key) { delete Save.data[key]; Save.flush(); },
    DeleteSave() { Save.data = {}; Save.flush(); },
  };
  Save.load();

  // ---------------------------------------------------------------- text / localization (original wording, not the game's texts)
  SLS.Lang = { current: 'en', tables: {}, listeners: [] };
  SLS.T = function (key, ...args) {
    const t = SLS.Lang.tables[SLS.Lang.current] || {};
    let s = t[key];
    if (s === undefined) s = (SLS.Lang.tables.en || {})[key];
    if (s === undefined) return key;
    if (typeof s === 'function') return s(...args);
    return args.length ? U.Str.Format(s, ...args) : s;
  };
  SLS.setLanguage = function (code) {
    if (!SLS.Lang.tables[code]) code = 'en';
    SLS.Lang.current = code;
    for (const f of SLS.Lang.listeners) { try { f(code); } catch (e) { U.reportError(e, null, 'language listener'); } }
  };
  SLS.languages = [{ code: 'en', name: 'English' }, { code: 'pt', name: 'Português' }];

  // ---------------------------------------------------------------- sound helper
  SLS.sfx = (name, ...args) => U.Audio.play(name, ...args);

  // ---------------------------------------------------------------- debug / test parameters
  const q = new URLSearchParams(location.search);
  SLS.Debug = {
    params: q,
    god: q.has('god'),
    startWave: q.has('wave') ? +q.get('wave') : 0,
    souls: q.has('souls') ? +q.get('souls') : null,
    test: q.get('test') || null,
    autostart: q.has('autostart'),
    showColliders: q.has('colliders'),
    fps: q.has('fps'),
  };

  // shared runtime references, filled by the modules
  SLS.Game = { player: null, playerStats: null, playerController: null, waveManager: null, shopManager: null, progression: null };
})(window.SLS, window.U);

// modules register their own strings: SLS.addStrings('en', {...}) / ('pt', {...})
(function (SLS) {
  SLS.addStrings = function (code, table) {
    SLS.Lang.tables[code] = Object.assign(SLS.Lang.tables[code] || {}, table);
  };
})(window.SLS);
