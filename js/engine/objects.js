/*
 * objects.js - UnityEngine.Object, GameObject, Component, Behaviour, MonoBehaviour.
 *
 * Lifecycle follows Unity:
 *  - Awake runs once, when a component's GameObject is first active in the
 *    hierarchy (immediately on Instantiate/scene load, or later on SetActive(true));
 *    OnEnable follows Awake and runs every time the behaviour becomes enabled
 *    and active; Start runs once, before the component's first Update.
 *  - Update/LateUpdate/FixedUpdate only run while enabled && activeInHierarchy.
 *  - Deactivating a GameObject stops the coroutines of its behaviours.
 *  - Destroy() is deferred to the end of the frame, like Unity.
 */
'use strict';
(function (U) {
  let nextId = 1;

  class UObject {
    constructor() { this._id = nextId++; this._destroyed = false; this.name = ''; }
    GetInstanceID() { return this._id; }
    get destroyed() { return this._destroyed; }
    toString() { return this.name; }
  }
  // Unity's overloaded == null: destroyed objects compare equal to null.
  U.alive = (o) => !!o && !o._destroyed;
  U.UObject = UObject;

  // ------------------------------------------------------------------ registry of live objects
  const World = U.World = {
    roots: [],            // root GameObjects of the scene, in order
    behaviours: new Set(), // all MonoBehaviours that may need ticking
    startQueue: [],
    destroyQueue: [],
    coroutines: [],
    invokes: [],
    tagIndex: new Map(),
    allGameObjects: new Set(),
  };

  // ------------------------------------------------------------------ GameObject
  class GameObject extends UObject {
    constructor(name = 'GameObject', opts = {}) {
      super();
      this.name = name;
      this._activeSelf = opts.active !== undefined ? !!opts.active : true;
      this.layer = opts.layer || 0;
      this._tag = opts.tag || 'Untagged';
      this.components = [];
      this._isTemplate = !!opts.template;  // prefab assets: never "live"
      const T = opts.rect ? U.RectTransform : U.Transform;
      this.transform = new T();
      this._attach(this.transform);
      if (!this._isTemplate) { World.allGameObjects.add(this); World.roots.push(this); }
      this._indexTag();
    }
    get gameObject() { return this; }
    get tag() { return this._tag; }
    set tag(t) { this._unindexTag(); this._tag = t; this._indexTag(); }
    _indexTag() {
      if (this._isTemplate) return;
      let s = World.tagIndex.get(this._tag);
      if (!s) World.tagIndex.set(this._tag, s = new Set());
      s.add(this);
    }
    _unindexTag() { const s = World.tagIndex.get(this._tag); if (s) s.delete(this); }
    CompareTag(t) { return this._tag === t; }
    get activeSelf() { return this._activeSelf; }
    get activeInHierarchy() {
      let t = this.transform;
      while (t) { if (!t.gameObject._activeSelf) return false; t = t._parent; }
      return true;
    }
    get scene() { return { name: 'SampleScene', buildIndex: 0 }; }

    _attach(c) {
      c.gameObject = this;
      c.transform = this.transform;
      this.components.push(c);
    }
    AddComponent(type) {
      const c = new type();
      this._attach(c);
      if (c instanceof U.Transform && c !== this.transform) throw new Error('second Transform');
      if (!this._isTemplate && this.activeInHierarchy) U.Lifecycle.awakeComponent(c);
      return c;
    }
    GetComponent(type) { return U.getComponent(this, type); }
    GetComponents(type) { return this.components.filter((c) => U.isType(c, type)); }
    GetComponentInChildren(type, includeInactive = false) { return this.transform._findInChildren(type, includeInactive, true); }
    GetComponentsInChildren(type, includeInactive = false) { const out = []; this.transform._collectInChildren(type, includeInactive, out, true); return out; }
    GetComponentInParent(type) {
      for (let t = this.transform; t; t = t._parent) { const c = U.getComponent(t.gameObject, type); if (c) return c; }
      return null;
    }
    TryGetComponent(type) { return this.GetComponent(type); }

    SetActive(v) {
      v = !!v;
      if (this._activeSelf === v) return;
      const wasActive = this.activeInHierarchy;
      this._activeSelf = v;
      if (this._isTemplate) return;
      const nowActive = this.activeInHierarchy;
      if (wasActive !== nowActive) U.Lifecycle.hierarchyActiveChanged(this, nowActive);
    }

    // ---- static finders
    static Find(path) {
      // Unity: searches active objects only; "a/b" paths are relative to roots
      if (path.includes('/')) {
        const parts = path.split('/').filter(Boolean);
        for (const r of World.roots) {
          if (r._destroyed || !r.activeInHierarchy || r.name !== parts[0]) continue;
          const t = parts.length === 1 ? r.transform : r.transform.Find(parts.slice(1).join('/'));
          if (t && t.gameObject.activeInHierarchy) return t.gameObject;
        }
        return null;
      }
      for (const r of World.roots) {
        if (r._destroyed) continue;
        const g = r.transform._findByName(path, true);
        if (g) return g;
      }
      return null;
    }
    static FindWithTag(tag) {
      const s = World.tagIndex.get(tag);
      if (!s) return null;
      for (const g of s) if (!g._destroyed && g.activeInHierarchy) return g;
      return null;
    }
    static FindGameObjectWithTag(tag) { return GameObject.FindWithTag(tag); }
    static FindGameObjectsWithTag(tag) {
      const s = World.tagIndex.get(tag);
      return s ? [...s].filter((g) => !g._destroyed && g.activeInHierarchy) : [];
    }
    static FindObjectOfType(type, includeInactive = false) {
      for (const g of World.allGameObjects) {
        if (g._destroyed || (!includeInactive && !g.activeInHierarchy)) continue;
        const c = U.getComponent(g, type);
        if (c && (includeInactive || !(c instanceof Behaviour) || c.enabled)) return c;
      }
      return null;
    }
    static FindObjectsOfType(type, includeInactive = false) {
      const out = [];
      for (const g of World.allGameObjects) {
        if (g._destroyed || (!includeInactive && !g.activeInHierarchy)) continue;
        for (const c of g.components) if (U.isType(c, type)) out.push(c);
      }
      return out;
    }
  }
  U.GameObject = GameObject;

  // ------------------------------------------------------------------ Component / Behaviour / MonoBehaviour
  class Component extends UObject {
    constructor() { super(); this.gameObject = null; this.transform = null; }
    get name() { return this.gameObject ? this.gameObject.name : ''; }
    set name(v) { if (this.gameObject) this.gameObject.name = v; }
    get tag() { return this.gameObject.tag; }
    set tag(v) { this.gameObject.tag = v; }
    CompareTag(t) { return this.gameObject.CompareTag(t); }
    GetComponent(type) { return this.gameObject.GetComponent(type); }
    GetComponents(type) { return this.gameObject.GetComponents(type); }
    GetComponentInChildren(type, inc) { return this.gameObject.GetComponentInChildren(type, inc); }
    GetComponentsInChildren(type, inc) { return this.gameObject.GetComponentsInChildren(type, inc); }
    GetComponentInParent(type) { return this.gameObject.GetComponentInParent(type); }
    TryGetComponent(type) { return this.gameObject.GetComponent(type); }
  }
  U.Component = Component;

  class Behaviour extends Component {
    constructor() { super(); this._enabled = true; }
    get enabled() { return this._enabled; }
    set enabled(v) {
      v = !!v;
      if (v === this._enabled) return;
      this._enabled = v;
      if (this.gameObject && !this.gameObject._isTemplate && this._awoken && this.gameObject.activeInHierarchy) {
        if (v) U.Lifecycle.enableBehaviour(this); else U.Lifecycle.disableBehaviour(this);
      }
    }
    get isActiveAndEnabled() { return this._enabled && this.gameObject && this.gameObject.activeInHierarchy; }
  }
  U.Behaviour = Behaviour;

  class MonoBehaviour extends Behaviour {
    constructor() {
      super();
      this._awoken = false;
      this._started = false;
      this._isEnabledLive = false;  // OnEnable delivered, OnDisable not yet
    }
    // ---- coroutines (generator functions)
    StartCoroutine(gen) {
      if (typeof gen === 'string') gen = this[gen]();
      if (typeof gen === 'function') gen = gen.call(this);
      const co = { owner: this, gen, wait: null, done: false };
      World.coroutines.push(co);
      U.Lifecycle.stepCoroutine(co, true);
      return co;
    }
    StopCoroutine(co) {
      if (!co) return;
      if (typeof co === 'string') { for (const c of World.coroutines) if (c.owner === this && c.name === co) c.done = true; return; }
      co.done = true;
    }
    StopAllCoroutines() { for (const c of World.coroutines) if (c.owner === this) c.done = true; }
    // ---- Invoke
    Invoke(method, time) { World.invokes.push({ owner: this, method, at: U.Time.time + time, repeat: -1 }); }
    InvokeRepeating(method, time, rate) { World.invokes.push({ owner: this, method, at: U.Time.time + time, repeat: rate }); }
    CancelInvoke(method) {
      for (const i of World.invokes) if (i.owner === this && (method === undefined || i.method === method)) i.cancelled = true;
    }
    IsInvoking(method) { return World.invokes.some((i) => !i.cancelled && i.owner === this && (method === undefined || i.method === method)); }
    print(...a) { U.Debug.Log(...a); }
  }
  U.MonoBehaviour = MonoBehaviour;

  // ------------------------------------------------------------------ yield instructions
  class WaitForSeconds { constructor(s) { this.seconds = s; } }
  class WaitForSecondsRealtime { constructor(s) { this.seconds = s; } }
  class WaitForFixedUpdate { }
  class WaitForEndOfFrame { }
  class WaitUntil { constructor(f) { this.pred = f; } }
  class WaitWhile { constructor(f) { this.pred = f; } }
  Object.assign(U, { WaitForSeconds, WaitForSecondsRealtime, WaitForFixedUpdate, WaitForEndOfFrame, WaitUntil, WaitWhile });

  // ------------------------------------------------------------------ component type matching
  // `type` may be a class or a class-name string (for scripts referenced by name).
  U.isType = function (c, type) {
    if (!c || c._destroyed) return false;
    if (typeof type === 'string') {
      for (let p = c.constructor; p && p !== Object; p = Object.getPrototypeOf(p)) if (p.name === type || p.csName === type) return true;
      return false;
    }
    return c instanceof type;
  };
  U.getComponent = function (go, type) {
    if (!go) return null;
    if (type === U.Transform || type === 'Transform') return go.transform;
    for (const c of go.components) if (U.isType(c, type)) return c;
    return null;
  };

  // ------------------------------------------------------------------ Lifecycle
  const Lifecycle = U.Lifecycle = {
    call(obj, name, ...args) {
      const f = obj[name];
      if (typeof f !== 'function') return undefined;
      try { return f.apply(obj, args); } catch (e) { U.reportError(e, obj, name); return undefined; }
    },
    awakeComponent(c) {
      // native components get onAwake; scripts get Awake/OnEnable/Start
      if (c._awoken) return;
      c._awoken = true;
      if (typeof c.onAwake === 'function') c.onAwake();
      if (!(c instanceof MonoBehaviour) && !(c instanceof Behaviour)) return;
      if (c instanceof MonoBehaviour) {
        World.behaviours.add(c);
        Lifecycle.call(c, 'Awake');
      }
      if (c._enabled && !c._destroyed) Lifecycle.enableBehaviour(c);
    },
    enableBehaviour(c) {
      if (c._isEnabledLive) return;
      c._isEnabledLive = true;
      if (typeof c.onEnableNative === 'function') c.onEnableNative();
      if (c instanceof MonoBehaviour) {
        Lifecycle.call(c, 'OnEnable');
        if (!c._started && !c._startQueued) { c._startQueued = true; World.startQueue.push(c); }
      }
    },
    disableBehaviour(c) {
      if (!c._isEnabledLive) return;
      c._isEnabledLive = false;
      if (typeof c.onDisableNative === 'function') c.onDisableNative();
      if (c instanceof MonoBehaviour) Lifecycle.call(c, 'OnDisable');
    },
    // called when a GameObject's activeInHierarchy flips; walks the subtree
    hierarchyActiveChanged(go, active) {
      const visit = (g) => {
        if (!g._activeSelf && g !== go) return; // subtree stays inactive
        if (active) {
          for (const c of [...g.components]) {
            if (!c._awoken) Lifecycle.awakeComponent(c);
            else if ((c instanceof Behaviour) && c._enabled) Lifecycle.enableBehaviour(c);
            else if (typeof c.onActivate === 'function') c.onActivate();
          }
        } else {
          for (const c of [...g.components]) {
            if (c instanceof Behaviour) Lifecycle.disableBehaviour(c);
            else if (typeof c.onDeactivate === 'function') c.onDeactivate();
            if (c instanceof MonoBehaviour) for (const co of World.coroutines) if (co.owner === c) co.done = true;
          }
        }
        for (const ch of [...g.transform._children]) visit(ch.gameObject);
      };
      visit(go);
    },
    // first activation of a freshly built hierarchy (scene load / Instantiate)
    activateTree(go) {
      if (!go.activeInHierarchy) return;
      const visit = (g) => {
        if (!g._activeSelf) return;
        for (const c of [...g.components]) if (!c._awoken) Lifecycle.awakeComponent(c);
        for (const ch of [...g.transform._children]) visit(ch.gameObject);
      };
      visit(go);
    },
    runStarts() {
      while (World.startQueue.length) {
        const q = World.startQueue.splice(0);
        for (const c of q) {
          c._startQueued = false;
          if (c._started || c._destroyed) continue;
          if (!c.isActiveAndEnabled) { continue; } // re-queued by the next OnEnable
          c._started = true;
          Lifecycle.call(c, 'Start');
        }
      }
    },
    forEachLive(method, fn) {
      for (const c of World.behaviours) {
        if (c._destroyed || !c._started || !c._isEnabledLive || typeof c[method] !== 'function') continue;
        fn(c);
      }
    },
    // ---- coroutines
    stepCoroutine(co, first) {
      if (co.done) return;
      for (;;) {
        let r;
        try { r = co.gen.next(); } catch (e) { co.done = true; U.reportError(e, co.owner, 'coroutine'); return; }
        if (r.done) { co.done = true; return; }
        const v = r.value;
        if (v === null || v === undefined || v === 0) { co.wait = { kind: 'frame' }; return; }
        if (v instanceof WaitForSeconds) { co.wait = { kind: 'scaled', until: U.Time.time + v.seconds }; return; }
        if (v instanceof WaitForSecondsRealtime) { co.wait = { kind: 'real', until: U.Time.realtimeSinceStartup + v.seconds }; return; }
        if (v instanceof WaitForFixedUpdate) { co.wait = { kind: 'fixed' }; return; }
        if (v instanceof WaitForEndOfFrame) { co.wait = { kind: 'eof' }; return; }
        if (v instanceof WaitUntil) { if (v.pred()) continue; co.wait = { kind: 'until', pred: v.pred }; return; }
        if (v instanceof WaitWhile) { if (!v.pred()) continue; co.wait = { kind: 'until', pred: () => !v.pred() }; return; }
        if (v && v.gen) { co.wait = { kind: 'co', other: v }; return; }          // yield StartCoroutine(...)
        if (v && typeof v.next === 'function') { co.wait = { kind: 'co', other: co.owner.StartCoroutine(v) }; return; }
        co.wait = { kind: 'frame' };
        return;
      }
    },
    tickCoroutines(phase) {
      const list = World.coroutines;
      for (let i = 0; i < list.length; i++) {
        const co = list[i];
        if (co.done) continue;
        if (co.owner._destroyed) { co.done = true; continue; }
        const w = co.wait;
        if (!w) continue;
        let ready = false;
        switch (w.kind) {
          case 'frame': ready = phase === 'update'; break;
          case 'scaled': ready = phase === 'update' && U.Time.time >= w.until; break;
          case 'real': ready = phase === 'update' && U.Time.realtimeSinceStartup >= w.until; break;
          case 'fixed': ready = phase === 'fixed'; break;
          case 'eof': ready = phase === 'eof'; break;
          case 'until': ready = phase === 'update' && !!w.pred(); break;
          case 'co': ready = phase === 'update' && w.other.done; break;
        }
        if (ready) { co.wait = null; Lifecycle.stepCoroutine(co); }
      }
      if (list.length > 256 && phase === 'update') World.coroutines = list.filter((c) => !c.done);
    },
    tickInvokes() {
      const now = U.Time.time;
      const list = World.invokes;
      for (let i = 0; i < list.length; i++) {
        const inv = list[i];
        if (inv.cancelled || inv.owner._destroyed) { inv.cancelled = true; continue; }
        if (now < inv.at) continue;
        if (inv.repeat > 0) inv.at += inv.repeat; else inv.cancelled = true;
        // Unity skips Invoke on disabled behaviours only for InvokeRepeating? It calls both while enabled.
        if (!inv.owner.gameObject || !inv.owner.isActiveAndEnabled) { if (inv.repeat <= 0) continue; }
        Lifecycle.call(inv.owner, inv.method);
      }
      if (list.length > 128) World.invokes = list.filter((i) => !i.cancelled);
    },
  };

  // ------------------------------------------------------------------ Destroy
  U.Destroy = function (obj, t) {
    if (!obj || obj._destroyed) return;
    if (t && t > 0) { U.World.destroyQueue.push({ obj, at: U.Time.time + t }); return; }
    U.World.destroyQueue.push({ obj, at: -1 });
  };
  U.DestroyImmediate = function (obj) { destroyNow(obj); };
  U.flushDestroys = function () {
    const q = U.World.destroyQueue;
    if (!q.length) return;
    const keep = [];
    for (const d of q) {
      if (d.at < 0 || U.Time.time >= d.at) destroyNow(d.obj); else keep.push(d);
    }
    U.World.destroyQueue = keep;
  };
  function destroyNow(obj) {
    if (!obj || obj._destroyed) return;
    if (obj instanceof GameObject) {
      for (const ch of [...obj.transform._children]) destroyNow(ch.gameObject);
      if (obj.activeInHierarchy) {
        for (const c of [...obj.components]) {
          if (c instanceof Behaviour) Lifecycle.disableBehaviour(c);
          else if (typeof c.onDeactivate === 'function') c.onDeactivate();
        }
      }
      for (const c of [...obj.components]) destroyComponent(c, true);
      obj.transform.SetParent(null, false);
      const ri = World.roots.indexOf(obj);
      if (ri >= 0) World.roots.splice(ri, 1);
      obj._unindexTag();
      World.allGameObjects.delete(obj);
      obj._destroyed = true;
      return;
    }
    if (obj instanceof Component) {
      if (obj instanceof U.Transform) { destroyNow(obj.gameObject); return; }
      if (obj instanceof Behaviour && obj.gameObject && obj.gameObject.activeInHierarchy) Lifecycle.disableBehaviour(obj);
      destroyComponent(obj, false);
      const i = obj.gameObject.components.indexOf(obj);
      if (i >= 0) obj.gameObject.components.splice(i, 1);
    }
  }
  function destroyComponent(c, wholeObject) {
    if (c._destroyed) return;
    if (c instanceof MonoBehaviour && c._awoken) Lifecycle.call(c, 'OnDestroy');
    if (typeof c.onDestroyNative === 'function') c.onDestroyNative();
    c._destroyed = true;
    World.behaviours.delete(c);
  }

  // ------------------------------------------------------------------ errors
  const reported = new Set();
  U.errorCount = 0;
  U.reportError = function (e, obj, where) {
    U.errorCount++;
    const key = (e && e.stack ? e.stack.split('\n')[1] : String(e)) + where;
    if (reported.has(key)) return;
    reported.add(key);
    const who = obj ? (obj.constructor.name + (obj.gameObject ? ' on "' + obj.gameObject.name + '"' : '')) : '';
    console.error('[engine] exception in ' + who + '.' + where + ':', e);
  };
})(window.U);

// Instantiate(name | factory, position, rotation, parent): the remake builds
// prefabs from code (SLS.spawn); this alias keeps call sites Unity-shaped.
(function (U) {
  U.Instantiate = function (prefab, position, rotation, parent) {
    if (typeof prefab === 'string') return window.SLS.spawn(prefab, position, rotation, parent);
    if (prefab && prefab.prefabName) return window.SLS.spawn(prefab.prefabName, position, rotation, parent);
    throw new Error('Instantiate: unknown prefab ' + prefab);
  };
})(window.U);
