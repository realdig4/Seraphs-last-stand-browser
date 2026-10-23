/*
 * physics.js - a small 2D physics engine with Unity Physics2D semantics.
 *
 * Bodies: Rigidbody2D (Dynamic / Kinematic / Static). Colliders without a
 * Rigidbody2D in their parents are static. Shapes: oriented boxes, circles and
 * polygons (decomposed into merged vertical slabs, so step tops and flat floors
 * have no internal edges to snag on).
 *
 * Per fixed step: integrate dynamic (gravity, forces, drag, constraints) and
 * kinematic (velocity) bodies, resolve dynamic contacts (positional correction +
 * inelastic/bouncy impulse with friction), then dispatch OnCollision* and
 * OnTrigger* Enter/Stay/Exit messages. Triggers need at least one Rigidbody2D;
 * collisions need at least one Dynamic body (Unity's rules).
 */
'use strict';
(function (U) {
  const { Vector2, Vector3, Mathf } = U;
  const ForceMode2D = U.ForceMode2D = { Force: 0, Impulse: 1 };
  const BodyType = U.RigidbodyType2D = { Dynamic: 0, Kinematic: 1, Static: 2 };
  const Constraints = U.RigidbodyConstraints2D = { None: 0, FreezePositionX: 1, FreezePositionY: 2, FreezePosition: 3, FreezeRotation: 4, FreezeAll: 7 };

  const Physics2D = U.Physics2D = {
    gravity: new Vector2(0, -9.81),
    colliders: new Set(),
    bodies: new Set(),
    matrix: null,          // 32 masks
    queriesHitTriggers: true,
    queriesStartInColliders: true,
    pairs: new Map(),      // key -> {a, b, trigger, frame}
    ignored: new Set(),
    stepIndex: 0,
    AllLayers: -1,
    DefaultRaycastLayers: -5,
  };

  // ================================================================== Rigidbody2D
  class Rigidbody2D extends U.Component {
    constructor() {
      super();
      this.bodyType = BodyType.Dynamic;
      this.simulated = true;
      this.mass = 1;
      this.drag = 0;
      this.angularDrag = 0.05;
      this.gravityScale = 1;
      this.constraints = 0;
      this.sharedMaterial = null;
      this.interpolation = 0;
      this.collisionDetectionMode = 0;
      this._v = new Vector2(0, 0);
      this.angularVelocity = 0;
      this._force = new Vector2(0, 0);
      this._movePos = null;
      this._moveRot = null;
    }
    fromRecord(r) {
      this.bodyType = r.m_BodyType;
      this.simulated = r.m_Simulated;
      this.mass = r.m_Mass;
      this.drag = r.m_LinearDrag;
      this.angularDrag = r.m_AngularDrag;
      this.gravityScale = r.m_GravityScale;
      this.constraints = r.m_Constraints;
      this.interpolation = r.m_Interpolate;
      this.collisionDetectionMode = r.m_CollisionDetection;
      
    }
    cloneInto(c) {
      for (const k of ['bodyType', 'simulated', 'mass', 'drag', 'angularDrag', 'gravityScale', 'constraints', 'interpolation', 'collisionDetectionMode', 'sharedMaterial']) c[k] = this[k];
    }
    onAwake() { Physics2D.bodies.add(this); }
    onDestroyNative() { Physics2D.bodies.delete(this); }
    get isActive() { return this.simulated && this.gameObject.activeInHierarchy; }
    get velocity() { return Vector2.from(this._v); }
    set velocity(v) { this._v = new Vector2(v.x, v.y); }
    get isKinematic() { return this.bodyType === BodyType.Kinematic; }
    set isKinematic(v) { this.bodyType = v ? BodyType.Kinematic : BodyType.Dynamic; }
    get position() { const p = this.transform.position; return new Vector2(p.x, p.y); }
    set position(p) { const z = this.transform.position.z; this.transform.position = new Vector3(p.x, p.y, z); }
    get rotation() { return this.transform.eulerAngles.z; }
    set rotation(a) { this.transform.rotation = U.Quaternion.Euler(0, 0, a); }
    MovePosition(p) { this._movePos = new Vector2(p.x, p.y); }
    MoveRotation(a) { this._moveRot = a; }
    AddForce(f, mode = ForceMode2D.Force) {
      if (this.bodyType !== BodyType.Dynamic) return;
      if (mode === ForceMode2D.Impulse) { this._v = new Vector2(this._v.x + f.x / this.mass, this._v.y + f.y / this.mass); }
      else this._force = new Vector2(this._force.x + f.x, this._force.y + f.y);
      this._applyConstraintsToVelocity();
    }
    AddTorque() { }
    Sleep() { } WakeUp() { }
    IsSleeping() { return false; }
    IsAwake() { return true; }
    _applyConstraintsToVelocity() {
      if (this.constraints & Constraints.FreezePositionX) this._v.x = 0;
      if (this.constraints & Constraints.FreezePositionY) this._v.y = 0;
    }
    get attachedColliderCount() { return this.GetAttachedColliders().length; }
    GetAttachedColliders() { return [...Physics2D.colliders].filter((c) => c.attachedRigidbody === this); }
  }
  U.Rigidbody2D = Rigidbody2D;
  U.NativeTypes.Rigidbody2D = Rigidbody2D;

  // ================================================================== Colliders
  class Collider2D extends U.Behaviour {
    constructor() {
      super();
      this.isTrigger = false;
      this.offset = new Vector2(0, 0);
      this.sharedMaterial = null;
      this.usedByEffector = false;
      this._shapeCache = null;
      this._shapeVersion = -1;
    }
    baseFromRecord(r) {
      this.isTrigger = !!r.m_IsTrigger;
      this.offset = Vector2.from(r.m_Offset || { x: 0, y: 0 });
      
    }
    baseClone(c) { c.isTrigger = this.isTrigger; c.offset = Vector2.from(this.offset); c.sharedMaterial = this.sharedMaterial; }
    onAwake() { Physics2D.colliders.add(this); }
    onDestroyNative() { Physics2D.colliders.delete(this); }
    get attachedRigidbody() {
      for (let t = this.transform; t; t = t._parent) {
        const rb = U.getComponent(t.gameObject, Rigidbody2D);
        if (rb) return rb;
      }
      return null;
    }
    get isLive() { return this._enabled && !this._destroyed && this.gameObject.activeInHierarchy && (!this.attachedRigidbody || this.attachedRigidbody.simulated); }
    get bounds() {
      const s = this.shape();
      const b = shapeAABB(s);
      return { center: new Vector3((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, 0), size: new Vector3(b[2] - b[0], b[3] - b[1], 0),
        extents: new Vector3((b[2] - b[0]) / 2, (b[3] - b[1]) / 2, 0), min: new Vector3(b[0], b[1], 0), max: new Vector3(b[2], b[3], 0) };
    }
    IsTouching(other) { const k = pairKey(this, other); return Physics2D.pairs.has(k); }
    IsTouchingLayers(mask = -1) {
      for (const p of Physics2D.pairs.values()) {
        const o = p.a === this ? p.b : p.b === this ? p.a : null;
        if (o && (mask & (1 << o.gameObject.layer))) return true;
      }
      return false;
    }
    OverlapPoint(p) { return shapeContains(this.shape(), p.x, p.y); }
    ClosestPoint(p) { const s = this.shape(); const c = shapeCenter(s); return new Vector2(Mathf.Clamp(p.x, s.aabb ? s.aabb[0] : c.x, s.aabb ? s.aabb[2] : c.x), Mathf.Clamp(p.y, s.aabb ? s.aabb[1] : c.y, s.aabb ? s.aabb[3] : c.y)); }
  }
  U.Collider2D = Collider2D;

  class BoxCollider2D extends Collider2D {
    constructor() { super(); this.size = new Vector2(1, 1); this.edgeRadius = 0; }
    fromRecord(r) { this.baseFromRecord(r); this.size = Vector2.from(r.m_Size); this.edgeRadius = r.m_EdgeRadius || 0; }
    cloneInto(c) { this.baseClone(c); c.size = Vector2.from(this.size); c.edgeRadius = this.edgeRadius; }
    shape() {
      const m = this.transform.worldMatrix;
      const cx = m[0] * this.offset.x + m[2] * this.offset.y + m[4], cy = m[1] * this.offset.x + m[3] * this.offset.y + m[5];
      const ux = [m[0], m[1]], uy = [m[2], m[3]];
      const lx = Math.hypot(ux[0], ux[1]) || 1e-9, ly = Math.hypot(uy[0], uy[1]) || 1e-9;
      const hx = Math.abs(this.size.x * lx) / 2 + this.edgeRadius, hy = Math.abs(this.size.y * ly) / 2 + this.edgeRadius;
      const ax = [ux[0] / lx, ux[1] / lx];
      // orthonormal axes (handle mirrored transforms)
      const ay = [-ax[1], ax[0]];
      return { kind: 'box', cx, cy, hx, hy, ax, ay, aabb: obbAABB(cx, cy, hx, hy, ax, ay) };
    }
  }
  class CircleCollider2D extends Collider2D {
    constructor() { super(); this.radius = 0.5; }
    fromRecord(r) { this.baseFromRecord(r); this.radius = r.m_Radius; }
    cloneInto(c) { this.baseClone(c); c.radius = this.radius; }
    shape() {
      const m = this.transform.worldMatrix;
      const cx = m[0] * this.offset.x + m[2] * this.offset.y + m[4], cy = m[1] * this.offset.x + m[3] * this.offset.y + m[5];
      const s = Math.max(Math.hypot(m[0], m[1]), Math.hypot(m[2], m[3]));
      const r = this.radius * s;
      return { kind: 'circle', cx, cy, r, aabb: [cx - r, cy - r, cx + r, cy + r] };
    }
  }
  class PolygonCollider2D extends Collider2D {
    constructor() { super(); this.paths = []; this._slabs = null; this._slabKey = null; }
    fromRecord(r) {
      this.baseFromRecord(r);
      this.paths = ((r.m_Points && r.m_Points.m_Paths) || []).map((p) => p.map((v) => new Vector2(v.x, v.y)));
    }
    cloneInto(c) { this.baseClone(c); c.paths = this.paths.map((p) => p.map((v) => Vector2.from(v))); }
    get pathCount() { return this.paths.length; }
    GetPath(i) { return this.paths[i].map((v) => Vector2.from(v)); }
    shape() {
      const m = this.transform.worldMatrix;
      const key = m.join(',') + this.offset.x + ',' + this.offset.y;
      if (this._slabKey !== key) {
        const world = this.paths.map((p) => p.map((v) => U.applyAffine(m, v.x + this.offset.x, v.y + this.offset.y)));
        this._slabs = slabDecompose(world);
        this._slabKey = key;
        let a = [Infinity, Infinity, -Infinity, -Infinity];
        for (const s of this._slabs) a = [Math.min(a[0], s[0]), Math.min(a[1], s[1]), Math.max(a[2], s[2]), Math.max(a[3], s[3])];
        this._aabb = a;
      }
      return { kind: 'rects', rects: this._slabs, aabb: this._aabb };
    }
  }
  Object.assign(U, { BoxCollider2D, CircleCollider2D, PolygonCollider2D });
  U.NativeTypes.BoxCollider2D = BoxCollider2D;
  U.NativeTypes.CircleCollider2D = CircleCollider2D;
  U.NativeTypes.PolygonCollider2D = PolygonCollider2D;

  // ---------------- polygon -> merged vertical slabs (axis-aligned rects [x0,y0,x1,y1])
  function slabDecompose(paths) {
    const edges = [];
    const xs = new Set();
    for (const p of paths) {
      for (let i = 0; i < p.length; i++) {
        const a = p[i], b = p[(i + 1) % p.length];
        edges.push([a[0], a[1], b[0], b[1]]);
        xs.add(+a[0].toFixed(5));
      }
    }
    const sx = [...xs].sort((a, b) => a - b);
    const rects = [];
    for (let i = 0; i + 1 < sx.length; i++) {
      const x0 = sx[i], x1 = sx[i + 1];
      if (x1 - x0 < 1e-4) continue;
      const xm = (x0 + x1) / 2;
      const ys = [];
      for (const e of edges) {
        const [ax, ay, bx, by] = e;
        if ((ax <= xm && bx > xm) || (bx <= xm && ax > xm)) ys.push(ay + (by - ay) * (xm - ax) / (bx - ax));
      }
      ys.sort((a, b) => a - b);
      for (let k = 0; k + 1 < ys.length; k += 2) rects.push([x0, ys[k], x1, ys[k + 1]]);
    }
    // merge horizontally adjacent rects with equal vertical extent
    rects.sort((a, b) => a[1] - b[1] || a[3] - b[3] || a[0] - b[0]);
    const merged = [];
    for (const r of rects) {
      const last = merged[merged.length - 1];
      if (last && Math.abs(last[1] - r[1]) < 0.02 && Math.abs(last[3] - r[3]) < 0.02 && Math.abs(last[2] - r[0]) < 1e-4) last[2] = r[2];
      else merged.push(r.slice());
    }
    return merged;
  }

  // ================================================================== geometry
  function obbAABB(cx, cy, hx, hy, ax, ay) {
    const ex = Math.abs(ax[0]) * hx + Math.abs(ay[0]) * hy, ey = Math.abs(ax[1]) * hx + Math.abs(ay[1]) * hy;
    return [cx - ex, cy - ey, cx + ex, cy + ey];
  }
  function rectToBox(r) {
    return { kind: 'box', cx: (r[0] + r[2]) / 2, cy: (r[1] + r[3]) / 2, hx: (r[2] - r[0]) / 2, hy: (r[3] - r[1]) / 2, ax: [1, 0], ay: [0, 1], aabb: r };
  }
  function shapeAABB(s) { return s.aabb; }
  function shapeCenter(s) { return s.kind === 'rects' ? new Vector2((s.aabb[0] + s.aabb[2]) / 2, (s.aabb[1] + s.aabb[3]) / 2) : new Vector2(s.cx, s.cy); }
  function aabbOverlap(a, b) { return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3]; }
  function boxCorners(b) {
    const { cx, cy, hx, hy, ax, ay } = b;
    return [[cx + ax[0] * hx + ay[0] * hy, cy + ax[1] * hx + ay[1] * hy], [cx - ax[0] * hx + ay[0] * hy, cy - ax[1] * hx + ay[1] * hy],
      [cx - ax[0] * hx - ay[0] * hy, cy - ax[1] * hx - ay[1] * hy], [cx + ax[0] * hx - ay[0] * hy, cy + ax[1] * hx - ay[1] * hy]];
  }
  function project(corners, axis) {
    let lo = Infinity, hi = -Infinity;
    for (const c of corners) { const d = c[0] * axis[0] + c[1] * axis[1]; if (d < lo) lo = d; if (d > hi) hi = d; }
    return [lo, hi];
  }
  // returns {depth, nx, ny} with normal pointing from a to b, or null
  function boxBox(a, b) {
    const ca = boxCorners(a), cb = boxCorners(b);
    let best = null;
    for (const axis of [a.ax, a.ay, b.ax, b.ay]) {
      const [a0, a1] = project(ca, axis), [b0, b1] = project(cb, axis);
      const o = Math.min(a1, b1) - Math.max(a0, b0);
      if (o < 0) return null;
      if (!best || o < best.depth) {
        const dir = (b0 + b1) / 2 - (a0 + a1) / 2 >= 0 ? 1 : -1;
        best = { depth: o, nx: axis[0] * dir, ny: axis[1] * dir };
      }
    }
    return best;
  }
  function circleBox(c, b) { // normal from circle to box
    const dx = c.cx - b.cx, dy = c.cy - b.cy;
    const lx = dx * b.ax[0] + dy * b.ax[1], ly = dx * b.ay[0] + dy * b.ay[1];
    const qx = Mathf.Clamp(lx, -b.hx, b.hx), qy = Mathf.Clamp(ly, -b.hy, b.hy);
    let inside = Math.abs(lx) <= b.hx && Math.abs(ly) <= b.hy;
    if (!inside) {
      const ex = lx - qx, ey = ly - qy, d2 = ex * ex + ey * ey;
      if (d2 > c.r * c.r) return null;
      const d = Math.sqrt(d2) || 1e-9;
      const nlx = -ex / d, nly = -ey / d; // from circle towards box (local)
      return { depth: c.r - d, nx: nlx * b.ax[0] + nly * b.ay[0], ny: nlx * b.ax[1] + nly * b.ay[1] };
    }
    // centre inside: push out along the nearest face
    const px = b.hx - Math.abs(lx), py = b.hy - Math.abs(ly);
    if (px < py) { const s = lx > 0 ? -1 : 1; return { depth: px + c.r, nx: s * b.ax[0], ny: s * b.ax[1] }; }
    const s = ly > 0 ? -1 : 1;
    return { depth: py + c.r, nx: s * b.ay[0], ny: s * b.ay[1] };
  }
  function circleCircle(a, b) {
    const dx = b.cx - a.cx, dy = b.cy - a.cy, d = Math.hypot(dx, dy), rr = a.r + b.r;
    if (d > rr) return null;
    return d < 1e-9 ? { depth: rr, nx: 0, ny: 1 } : { depth: rr - d, nx: dx / d, ny: dy / d };
  }
  // generic shape test: returns contact {depth, nx, ny} (normal a->b) or null
  function collide(sa, sb) {
    if (!aabbOverlap(sa.aabb, sb.aabb)) return null;
    if (sa.kind === 'rects') { const r = collide(sb, sa); return r ? { depth: r.depth, nx: -r.nx, ny: -r.ny } : null; }
    if (sb.kind === 'rects') {
      let best = null;
      for (const rc of sb.rects) {
        const bx = rectToBox(rc);
        const c = collide(sa, bx);
        if (c && (!best || c.depth > best.depth)) best = c;
      }
      return best;
    }
    if (sa.kind === 'box' && sb.kind === 'box') return boxBox(sa, sb);
    if (sa.kind === 'circle' && sb.kind === 'box') return circleBox(sa, sb);
    if (sa.kind === 'box' && sb.kind === 'circle') { const r = circleBox(sb, sa); return r ? { depth: r.depth, nx: -r.nx, ny: -r.ny } : null; }
    if (sa.kind === 'circle' && sb.kind === 'circle') return circleCircle(sa, sb);
    return null;
  }
  function shapeContains(s, x, y) {
    if (s.kind === 'circle') return (x - s.cx) ** 2 + (y - s.cy) ** 2 <= s.r * s.r;
    if (s.kind === 'box') { const dx = x - s.cx, dy = y - s.cy; return Math.abs(dx * s.ax[0] + dy * s.ax[1]) <= s.hx && Math.abs(dx * s.ay[0] + dy * s.ay[1]) <= s.hy; }
    return s.rects.some((r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]);
  }
  U.physicsCollide = collide;

  // ================================================================== layer matrix
  function layersCollide(la, lb) {
    const m = Physics2D.matrix;
    if (!m) return true;
    return ((m[la] >>> 0) & (1 << lb)) !== 0;
  }
  Physics2D.IgnoreLayerCollision = function (a, b, ignore = true) {
    if (!Physics2D.matrix) return;
    if (ignore) { Physics2D.matrix[a] &= ~(1 << b); Physics2D.matrix[b] &= ~(1 << a); }
    else { Physics2D.matrix[a] |= 1 << b; Physics2D.matrix[b] |= 1 << a; }
  };
  Physics2D.GetIgnoreLayerCollision = (a, b) => !layersCollide(a, b);
  Physics2D.IgnoreCollision = function (a, b, ignore = true) {
    const k = pairKey(a, b);
    if (ignore) Physics2D.ignored.add(k); else Physics2D.ignored.delete(k);
  };
  function pairKey(a, b) { return a._id < b._id ? a._id + ':' + b._id : b._id + ':' + a._id; }

  // ================================================================== Collision2D / contacts
  class Collision2D {
    constructor(self, other, normal, depth, relVel) {
      this.collider = other;
      this.otherCollider = self;
      this.rigidbody = other.attachedRigidbody;
      this.otherRigidbody = self.attachedRigidbody;
      this.gameObject = other.gameObject;
      this.transform = other.transform;
      this.relativeVelocity = relVel;
      const pc = shapeCenter(self.shape());
      this.contacts = [{ normal: new Vector2(-normal.x, -normal.y), point: new Vector2(pc.x + normal.x * 0.5, pc.y + normal.y * 0.5), separation: -depth, collider: other, otherCollider: self }];
      this.contactCount = 1;
    }
    GetContact(i) { return this.contacts[i]; }
  }
  U.Collision2D = Collision2D;

  function sendMessage(go, name, arg) {
    if (!go || go._destroyed) return;
    for (const c of [...go.components]) {
      if (!(c instanceof U.MonoBehaviour) || c._destroyed || !c._enabled && false) continue;
      const f = c[name];
      if (typeof f === 'function' && go.activeInHierarchy) {
        try { f.call(c, arg); } catch (e) { U.reportError(e, c, name); }
      }
    }
  }
  function dispatch(col, other, kind, phase, info) {
    const name = kind === 'trigger' ? 'OnTrigger' + phase + '2D' : 'OnCollision' + phase + '2D';
    const arg = kind === 'trigger' ? other : info;
    sendMessage(col.gameObject, name, arg);
    const rb = col.attachedRigidbody;
    if (rb && rb.gameObject !== col.gameObject) sendMessage(rb.gameObject, name, arg);
  }

  // ================================================================== step
  Physics2D.step = function (dt) {
    Physics2D.stepIndex++;
    // integrate
    for (const rb of Physics2D.bodies) {
      if (rb._destroyed || !rb.isActive) continue;
      const t = rb.transform;
      if (rb._movePos) { const z = t.position.z; t.position = new Vector3(rb._movePos.x, rb._movePos.y, z); rb._movePos = null; }
      if (rb._moveRot !== null) { t.rotation = U.Quaternion.Euler(0, 0, rb._moveRot); rb._moveRot = null; }
      if (rb.bodyType === BodyType.Static) continue;
      if (rb.bodyType === BodyType.Dynamic) {
        const g = Physics2D.gravity;
        let vx = rb._v.x + (g.x * rb.gravityScale + rb._force.x / rb.mass) * dt;
        let vy = rb._v.y + (g.y * rb.gravityScale + rb._force.y / rb.mass) * dt;
        const damp = 1 / (1 + dt * rb.drag);
        vx *= damp; vy *= damp;
        rb._v = new Vector2(vx, vy);
        rb._force = new Vector2(0, 0);
        rb._applyConstraintsToVelocity();
        if (!(rb.constraints & Constraints.FreezeRotation) && rb.angularVelocity) {
          rb.angularVelocity *= 1 / (1 + dt * rb.angularDrag);
        }
      }
      if (rb._v.x !== 0 || rb._v.y !== 0) {
        const p = t.position;
        t.position = new Vector3(p.x + rb._v.x * dt, p.y + rb._v.y * dt, p.z);
      }
      if (rb.angularVelocity && !(rb.constraints & Constraints.FreezeRotation)) {
        t.rotation = U.Quaternion.Euler(0, 0, t.eulerAngles.z + rb.angularVelocity * dt);
      }
    }
    // gather live colliders
    const cols = [];
    for (const c of Physics2D.colliders) if (c.isLive) { c._s = c.shape(); c._rb = c.attachedRigidbody; cols.push(c); }
    // broad phase: sort by aabb min x
    cols.sort((a, b) => a._s.aabb[0] - b._s.aabb[0]);
    const touching = new Map();
    for (let iter = 0; iter < 4; iter++) {
      let any = false;
      for (let i = 0; i < cols.length; i++) {
        const a = cols[i];
        for (let j = i + 1; j < cols.length; j++) {
          const b = cols[j];
          if (b._s.aabb[0] > a._s.aabb[2]) break;
          if (a._rb && a._rb === b._rb) continue;
          const ra = a._rb, rb = b._rb;
          if (!ra && !rb) continue;
          if (!layersCollide(a.gameObject.layer, b.gameObject.layer)) continue;
          const key = pairKey(a, b);
          if (Physics2D.ignored.has(key)) continue;
          const trig = a.isTrigger || b.isTrigger;
          const dynA = ra && ra.bodyType === BodyType.Dynamic, dynB = rb && rb.bodyType === BodyType.Dynamic;
          if (!trig && !dynA && !dynB) continue;
          const c = collide(a._s, b._s);
          if (!c) continue;
          if (trig) { if (iter === 0) touching.set(key, { a, b, trigger: true, c }); continue; }
          // resolve
          if (iter === 0 || !touching.has(key)) touching.set(key, { a, b, trigger: false, c, rv: relVel(ra, rb) });
          if (c.depth <= 1e-5) continue;
          any = true;
          resolve(a, b, ra, rb, dynA, dynB, c);
          a._s = a.shape(); b._s = b.shape();
        }
      }
      if (!any) break;
    }
    // resting contacts: bodies pushed exactly onto a surface still count as touching
    for (const [k, p] of Physics2D.pairs) {
      if (touching.has(k) || p.trigger) continue;
      if (!p.a.isLive || !p.b.isLive) continue;
      const sa = inflate(p.a.shape(), 0.01), sb = p.b.shape();
      const c = collide(sa, sb);
      if (c) touching.set(k, { a: p.a, b: p.b, trigger: false, c, rv: relVel(p.a.attachedRigidbody, p.b.attachedRigidbody) });
    }
    // events
    const prev = Physics2D.pairs;
    const events = [];
    for (const [k, p] of touching) events.push([prev.has(k) ? 'Stay' : 'Enter', p]);
    for (const [k, p] of prev) if (!touching.has(k)) events.push(['Exit', p]);
    Physics2D.pairs = touching;
    for (const [phase, p] of events) {
      const { a, b } = p;
      if (phase === 'Exit' && (a._destroyed || b._destroyed) && !Physics2D.callbacksOnDisable) continue;
      if (p.trigger) {
        dispatch(a, b, 'trigger', phase);
        dispatch(b, a, 'trigger', phase);
      } else {
        const n = p.c ? { x: p.c.nx, y: p.c.ny } : { x: 0, y: 1 };
        const rv = p.rv || new Vector2(0, 0);
        dispatch(a, b, 'collision', phase, new Collision2D(a, b, n, p.c ? p.c.depth : 0, rv));
        dispatch(b, a, 'collision', phase, new Collision2D(b, a, { x: -n.x, y: -n.y }, p.c ? p.c.depth : 0, rv.neg()));
      }
    }
  };
  function inflate(s, d) {
    if (s.kind === 'box') return Object.assign({}, s, { hx: s.hx + d, hy: s.hy + d, aabb: [s.aabb[0] - d, s.aabb[1] - d, s.aabb[2] + d, s.aabb[3] + d] });
    if (s.kind === 'circle') return Object.assign({}, s, { r: s.r + d, aabb: [s.aabb[0] - d, s.aabb[1] - d, s.aabb[2] + d, s.aabb[3] + d] });
    return s;
  }
  function relVel(ra, rb) {
    const va = ra ? ra._v : new Vector2(0, 0), vb = rb ? rb._v : new Vector2(0, 0);
    return new Vector2(vb.x - va.x, vb.y - va.y);
  }
  function material(c) {
    const m = c.sharedMaterial || (c._rb && c._rb.sharedMaterial);
    return m ? { f: m.friction, b: m.bounciness } : { f: 0.4, b: 0 };
  }
  function resolve(a, b, ra, rb, dynA, dynB, c) {
    const ima = dynA ? 1 / Math.max(ra.mass, 1e-6) : 0, imb = dynB ? 1 / Math.max(rb.mass, 1e-6) : 0;
    const sum = ima + imb;
    if (sum === 0) return;
    const nx = c.nx, ny = c.ny; // a -> b
    const slop = 0.005, corr = Math.max(c.depth - slop, 0);
    if (corr > 0) {
      if (dynA) movePos(ra, -nx * corr * ima / sum, -ny * corr * ima / sum);
      if (dynB) movePos(rb, nx * corr * imb / sum, ny * corr * imb / sum);
    }
    const va = dynA ? ra._v : (ra ? ra._v : new Vector2()), vb = dynB ? rb._v : (rb ? rb._v : new Vector2());
    const rvx = vb.x - va.x, rvy = vb.y - va.y;
    const vn = rvx * nx + rvy * ny;
    if (vn >= 0) return; // separating
    const ma = material(a), mb = material(b);
    const e = Math.max(ma.b, mb.b);
    const j = -(1 + e) * vn / sum;
    const ix = j * nx, iy = j * ny;
    // friction (Coulomb, mixed as sqrt like Box2D)
    const mu = Math.sqrt(Math.max(ma.f, 0) * Math.max(mb.f, 0));
    let tx = rvx - vn * nx, ty = rvy - vn * ny;
    const tl = Math.hypot(tx, ty);
    let fx = 0, fy = 0;
    if (tl > 1e-6 && mu > 0) {
      tx /= tl; ty /= tl;
      const jt = Mathf.Clamp(-(rvx * tx + rvy * ty) / sum, -j * mu, j * mu);
      fx = jt * tx; fy = jt * ty;
    }
    if (dynA) { ra._v = new Vector2(ra._v.x - (ix + fx) * ima, ra._v.y - (iy + fy) * ima); ra._applyConstraintsToVelocity(); }
    if (dynB) { rb._v = new Vector2(rb._v.x + (ix + fx) * imb, rb._v.y + (iy + fy) * imb); rb._applyConstraintsToVelocity(); }
  }
  function movePos(rb, dx, dy) {
    if (rb.constraints & Constraints.FreezePositionX) dx = 0;
    if (rb.constraints & Constraints.FreezePositionY) dy = 0;
    const p = rb.transform.position;
    rb.transform.position = new Vector3(p.x + dx, p.y + dy, p.z);
  }

  // ================================================================== queries
  function queryColliders(mask, filter) {
    const out = [];
    for (const c of Physics2D.colliders) {
      if (!c.isLive) continue;
      if (mask !== undefined && mask !== null && mask !== -1 && !(mask & (1 << c.gameObject.layer))) continue;
      if (!Physics2D.queriesHitTriggers && c.isTrigger) continue;
      if (filter && !filter(c)) continue;
      out.push(c);
    }
    return out;
  }
  Physics2D.OverlapCircleAll = function (point, radius, mask) {
    const probe = { kind: 'circle', cx: point.x, cy: point.y, r: radius, aabb: [point.x - radius, point.y - radius, point.x + radius, point.y + radius] };
    return queryColliders(mask).filter((c) => collide(probe, c.shape()));
  };
  Physics2D.OverlapCircle = (point, radius, mask) => Physics2D.OverlapCircleAll(point, radius, mask)[0] || null;
  Physics2D.OverlapBoxAll = function (point, size, angle, mask) {
    const a = (angle || 0) * Mathf.Deg2Rad, ax = [Math.cos(a), Math.sin(a)], ay = [-ax[1], ax[0]];
    const probe = { kind: 'box', cx: point.x, cy: point.y, hx: size.x / 2, hy: size.y / 2, ax, ay };
    probe.aabb = obbAABB(probe.cx, probe.cy, probe.hx, probe.hy, ax, ay);
    return queryColliders(mask).filter((c) => collide(probe, c.shape()));
  };
  Physics2D.OverlapBox = (p, s, a, m) => Physics2D.OverlapBoxAll(p, s, a, m)[0] || null;
  Physics2D.OverlapPointAll = (p, mask) => queryColliders(mask).filter((c) => shapeContains(c.shape(), p.x, p.y));
  Physics2D.OverlapPoint = (p, mask) => Physics2D.OverlapPointAll(p, mask)[0] || null;

  class RaycastHit2D {
    constructor(collider, point, normal, distance, fraction) {
      this.collider = collider; this.point = point; this.normal = normal; this.distance = distance; this.fraction = fraction;
    }
    get rigidbody() { return this.collider ? this.collider.attachedRigidbody : null; }
    get transform() { return this.collider ? this.collider.transform : null; }
    // C# implicit bool: hit.collider != null
    valueOf() { return !!this.collider; }
    get hit() { return !!this.collider; }
  }
  U.RaycastHit2D = RaycastHit2D;

  function rayShape(ox, oy, dx, dy, s) {
    // returns [t, nx, ny] or null for t >= 0
    if (s.kind === 'circle') {
      const fx = ox - s.cx, fy = oy - s.cy;
      const b = fx * dx + fy * dy, c = fx * fx + fy * fy - s.r * s.r;
      if (c <= 0) return [0, -dx, -dy];
      const disc = b * b - c;
      if (disc < 0) return null;
      const t = -b - Math.sqrt(disc);
      if (t < 0) return null;
      const px = ox + dx * t - s.cx, py = oy + dy * t - s.cy, l = Math.hypot(px, py) || 1;
      return [t, px / l, py / l];
    }
    if (s.kind === 'box') {
      const rx = ox - s.cx, ry = oy - s.cy;
      const lox = rx * s.ax[0] + ry * s.ax[1], loy = rx * s.ay[0] + ry * s.ay[1];
      const ldx = dx * s.ax[0] + dy * s.ax[1], ldy = dx * s.ay[0] + dy * s.ay[1];
      if (Math.abs(lox) <= s.hx && Math.abs(loy) <= s.hy) return [0, -dx, -dy];
      let tmin = -Infinity, tmax = Infinity, nax = 0, nay = 0;
      for (const [o, d, h, axis] of [[lox, ldx, s.hx, 0], [loy, ldy, s.hy, 1]]) {
        if (Math.abs(d) < 1e-12) { if (Math.abs(o) > h) return null; continue; }
        let t1 = (-h - o) / d, t2 = (h - o) / d, sgn = -1;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; sgn = 1; }
        if (t1 > tmin) { tmin = t1; nax = axis === 0 ? sgn : 0; nay = axis === 1 ? sgn : 0; }
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return null;
      }
      if (tmin < 0) return null;
      return [tmin, nax * s.ax[0] + nay * s.ay[0], nax * s.ax[1] + nay * s.ay[1]];
    }
    let best = null;
    for (const r of s.rects) {
      const h = rayShape(ox, oy, dx, dy, rectToBox(r));
      if (h && (!best || h[0] < best[0])) best = h;
    }
    return best;
  }
  Physics2D.RaycastAll = function (origin, direction, distance = Infinity, mask) {
    const l = Math.hypot(direction.x, direction.y) || 1, dx = direction.x / l, dy = direction.y / l;
    const hits = [];
    for (const c of queryColliders(mask)) {
      const h = rayShape(origin.x, origin.y, dx, dy, c.shape());
      if (!h || h[0] > distance) continue;
      if (h[0] === 0 && !Physics2D.queriesStartInColliders) continue;
      hits.push(new RaycastHit2D(c, new Vector2(origin.x + dx * h[0], origin.y + dy * h[0]), new Vector2(h[1], h[2]), h[0], distance === Infinity ? 0 : h[0] / distance));
    }
    hits.sort((a, b) => a.distance - b.distance);
    return hits;
  };
  Physics2D.Raycast = function (origin, direction, distance, mask) {
    return Physics2D.RaycastAll(origin, direction, distance, mask)[0] || new RaycastHit2D(null, new Vector2(), new Vector2(), 0, 0);
  };
  Physics2D.Linecast = function (a, b, mask) {
    const d = new Vector2(b.x - a.x, b.y - a.y);
    return Physics2D.Raycast(a, d, d.magnitude, mask);
  };

  Physics2D.init = function (settings) {
    if (!settings) return;
    Physics2D.gravity = new Vector2(settings.gravity.x, settings.gravity.y);
    Physics2D.matrix = settings.matrix.slice();
    Physics2D.queriesHitTriggers = settings.queriesHitTriggers !== false;
    Physics2D.queriesStartInColliders = settings.queriesStartInColliders !== false;
    Physics2D.callbacksOnDisable = settings.callbacksOnDisable !== false;
  };
})(window.U);
