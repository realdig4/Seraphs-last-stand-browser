/*
 * transform.js - Transform and RectTransform.
 *
 * World matrices are 2D affine projections of Unity's 3D TRS (a rotation of
 * 180 degrees around Y mirrors X, as in Unity); world z is tracked separately
 * for sorting. RectTransform implements Unity's anchor model:
 *   size        = parentSize * (anchorMax - anchorMin) + sizeDelta
 *   localPos.xy = parentRectMin + parentSize * lerp(anchorMin, anchorMax, pivot) + anchoredPosition
 *   rect        = (-pivot * size, size)       in local space
 */
'use strict';
(function (U) {
  const { Vector2, Vector3, Quaternion, Mathf } = U;

  // 2D affine: [a c e; b d f]
  function mulAffine(p, l) {
    return [p[0] * l[0] + p[2] * l[1], p[1] * l[0] + p[3] * l[1],
      p[0] * l[2] + p[2] * l[3], p[1] * l[2] + p[3] * l[3],
      p[0] * l[4] + p[2] * l[5] + p[4], p[1] * l[4] + p[3] * l[5] + p[5]];
  }
  function invAffine(m) {
    const det = m[0] * m[3] - m[1] * m[2];
    if (Math.abs(det) < 1e-12) return [1, 0, 0, 1, -m[4], -m[5]];
    const ia = m[3] / det, ib = -m[1] / det, ic = -m[2] / det, id = m[0] / det;
    return [ia, ib, ic, id, -(ia * m[4] + ic * m[5]), -(ib * m[4] + id * m[5])];
  }
  U.mulAffine = mulAffine;
  U.invAffine = invAffine;
  U.applyAffine = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

  class Transform extends U.Component {
    constructor() {
      super();
      this._lp = new Vector3(0, 0, 0);
      this._lr = new Quaternion(0, 0, 0, 1);
      this._ls = new Vector3(1, 1, 1);
      this._parent = null;
      this._children = [];
      this._dirty = true;
      this._world = null;
      this._worldZ = 0;
    }
    // ---------------- dirty tracking
    _markDirty() {
      if (this._dirty) return;
      this._dirty = true;
      for (const c of this._children) c._markDirty();
    }
    _forceDirty() { this._dirty = false; this._markDirty(); }
    // local 2D matrix (projection of rotation * scale)
    _localMatrix() {
      const q = this._lr, s = this._ls, lp = this.localPosition;
      const x = q.x, y = q.y, z = q.z, w = q.w;
      const r00 = 1 - 2 * (y * y + z * z), r10 = 2 * (x * y + w * z);
      const r01 = 2 * (x * y - w * z), r11 = 1 - 2 * (x * x + z * z);
      return [r00 * s.x, r10 * s.x, r01 * s.y, r11 * s.y, lp.x, lp.y];
    }
    get worldMatrix() {
      if (this._dirty || !this._world) {
        const l = this._localMatrix();
        if (this._parent) {
          this._world = mulAffine(this._parent.worldMatrix, l);
          this._worldZ = this._parent._worldZ + this.localPosition.z * this._parent._ls.z;
        } else {
          this._world = l;
          this._worldZ = this.localPosition.z;
        }
        this._dirty = false;
      }
      return this._world;
    }
    // ---------------- local TRS
    get localPosition() { return new Vector3(this._lp.x, this._lp.y, this._lp.z); }
    set localPosition(v) { this._lp = new Vector3(v.x, v.y, v.z || 0); this._forceDirty(); }
    get localRotation() { return Quaternion.from(this._lr); }
    set localRotation(q) { this._lr = Quaternion.from(q); this._forceDirty(); }
    get localScale() { return Vector3.from(this._ls); }
    set localScale(v) { this._ls = new Vector3(v.x, v.y, v.z === undefined ? 1 : v.z); this._forceDirty(); }
    get localEulerAngles() { return this._lr.eulerAngles; }
    set localEulerAngles(e) { this.localRotation = Quaternion.Euler(e.x, e.y, e.z); }
    // ---------------- world TRS
    get position() { const m = this.worldMatrix; return new Vector3(m[4], m[5], this._worldZ); }
    set position(p) {
      if (this._parent) {
        const inv = invAffine(this._parent.worldMatrix);
        const pz = this._parent._worldZ;
        const [x, y] = U.applyAffine(inv, p.x, p.y);
        this.localPosition = new Vector3(x, y, ((p.z || 0) - pz) / (this._parent._ls.z || 1));
      } else this.localPosition = new Vector3(p.x, p.y, p.z || 0);
    }
    get rotation() { return this._parent ? this._parent.rotation.mul(this._lr) : Quaternion.from(this._lr); }
    set rotation(q) { this.localRotation = this._parent ? Quaternion.Inverse(this._parent.rotation).mul(q) : q; }
    get eulerAngles() { return this.rotation.eulerAngles; }
    set eulerAngles(e) { this.rotation = Quaternion.Euler(e.x, e.y, e.z); }
    get lossyScale() {
      let s = Vector3.from(this._ls);
      for (let p = this._parent; p; p = p._parent) s = new Vector3(s.x * p._ls.x, s.y * p._ls.y, s.z * p._ls.z);
      return s;
    }
    get right() { return this.rotation.rotate(new Vector3(1, 0, 0)); }
    set right(v) { this.rotation = Quaternion.FromToRotation(new Vector3(1, 0, 0), v); }
    get up() { return this.rotation.rotate(new Vector3(0, 1, 0)); }
    set up(v) { this.rotation = Quaternion.FromToRotation(new Vector3(0, 1, 0), v); }
    get forward() { return this.rotation.rotate(new Vector3(0, 0, 1)); }
    TransformPoint(v) { const m = this.worldMatrix; const [x, y] = U.applyAffine(m, v.x, v.y); return new Vector3(x, y, this._worldZ + (v.z || 0)); }
    InverseTransformPoint(v) { const [x, y] = U.applyAffine(invAffine(this.worldMatrix), v.x, v.y); return new Vector3(x, y, (v.z || 0) - this._worldZ); }
    TransformDirection(v) { return this.rotation.rotate(v); }
    InverseTransformDirection(v) { return Quaternion.Inverse(this.rotation).rotate(v); }
    TransformVector(v) { const m = this.worldMatrix; return new Vector3(m[0] * v.x + m[2] * v.y, m[1] * v.x + m[3] * v.y, v.z || 0); }
    Translate(v, relativeTo) {
      if (relativeTo === 'World' || relativeTo === U.Space.World) this.position = this.position.add(v);
      else this.position = this.position.add(this.TransformDirection(v));
    }
    Rotate(x, y, z, space) {
      let e;
      if (typeof x === 'object') { space = y; e = Quaternion.Euler(x.x, x.y, x.z || 0); } else e = Quaternion.Euler(x, y, z);
      if (space === U.Space.World) this.rotation = e.mul(this.rotation);
      else this.localRotation = this._lr.mul(e);
    }
    LookAt(target) {
      const p = target.position || target, me = this.position;
      const ang = Math.atan2(p.y - me.y, p.x - me.x) * Mathf.Rad2Deg;
      this.rotation = Quaternion.Euler(0, 0, ang);
    }
    // ---------------- hierarchy
    get parent() { return this._parent; }
    set parent(p) { this.SetParent(p, true); }
    get root() { let t = this; while (t._parent) t = t._parent; return t; }
    get childCount() { return this._children.length; }
    GetChild(i) {
      if (i < 0 || i >= this._children.length) throw new Error('Transform child out of bounds: ' + i + ' of ' + this.gameObject.name);
      return this._children[i];
    }
    GetSiblingIndex() { return this._parent ? this._parent._children.indexOf(this) : U.World.roots.indexOf(this.gameObject); }
    SetSiblingIndex(i) {
      const list = this._parent ? this._parent._children : null;
      if (!list) return;
      const cur = list.indexOf(this);
      list.splice(cur, 1);
      list.splice(Mathf.Clamp(i, 0, list.length), 0, this);
      U.UI && U.UI.markLayoutDirty();
    }
    SetAsLastSibling() { this.SetSiblingIndex(1 << 30); }
    SetAsFirstSibling() { this.SetSiblingIndex(0); }
    IsChildOf(p) { for (let t = this; t; t = t._parent) if (t === p) return true; return false; }
    SetParent(p, worldPositionStays = true) {
      if (p && !(p instanceof Transform)) p = p.transform;
      if (p === this._parent) return;
      const wp = worldPositionStays ? this.position : null;
      const wr = worldPositionStays ? this.rotation : null;
      const ws = worldPositionStays ? this.lossyScale : null;
      const go = this.gameObject;
      const wasActive = go && !go._isTemplate ? go.activeInHierarchy : false;
      if (this._parent) { const i = this._parent._children.indexOf(this); if (i >= 0) this._parent._children.splice(i, 1); }
      else if (go) { const ri = U.World.roots.indexOf(go); if (ri >= 0) U.World.roots.splice(ri, 1); }
      this._parent = p || null;
      if (p) p._children.push(this);
      else if (go && !go._isTemplate && !go._destroyed) U.World.roots.push(go);
      this._forceDirty();
      if (worldPositionStays) {
        if (!(this instanceof U.RectTransform) || !(p instanceof U.RectTransform)) {
          this.position = wp; this.rotation = wr;
          const ps = p ? p.lossyScale : new Vector3(1, 1, 1);
          this.localScale = new Vector3(ws.x / (ps.x || 1), ws.y / (ps.y || 1), ws.z / (ps.z || 1));
        } else {
          this.position = wp;
          const ps = p.lossyScale;
          this.localScale = new Vector3(ws.x / (ps.x || 1), ws.y / (ps.y || 1), ws.z / (ps.z || 1));
        }
      }
      if (go && !go._isTemplate) {
        const nowActive = go.activeInHierarchy;
        if (wasActive !== nowActive) U.Lifecycle.hierarchyActiveChanged(go, nowActive);
      }
      U.UI && U.UI.markLayoutDirty();
    }
    DetachChildren() { for (const c of [...this._children]) c.SetParent(null, true); }
    // Transform.Find: direct path from this transform, includes inactive objects
    Find(path) {
      const parts = path.split('/');
      let cur = this;
      for (const part of parts) {
        if (part === '') continue;
        if (part === '..') { cur = cur._parent; if (!cur) return null; continue; }
        const next = cur._children.find((c) => c.gameObject.name === part);
        if (!next) return null;
        cur = next;
      }
      return cur;
    }
    _findByName(name, activeOnly) {
      const g = this.gameObject;
      if (activeOnly && !g._activeSelf) return null;
      if (g.name === name) return g;
      for (const c of this._children) { const r = c._findByName(name, activeOnly); if (r) return r; }
      return null;
    }
    _findInChildren(type, includeInactive, self) {
      const g = this.gameObject;
      if (!includeInactive && !g._activeSelf) return null;
      const c = U.getComponent(g, type);
      if (c && (includeInactive || !(c instanceof U.Behaviour) || c.enabled || true)) return c;
      for (const ch of this._children) { const r = ch._findInChildren(type, includeInactive, false); if (r) return r; }
      return null;
    }
    _collectInChildren(type, includeInactive, out) {
      const g = this.gameObject;
      if (!includeInactive && !g._activeSelf) return;
      for (const c of g.components) if (U.isType(c, type)) out.push(c);
      for (const ch of this._children) ch._collectInChildren(type, includeInactive, out);
    }
    // iterate children like C# foreach (Transform t in transform)
    [Symbol.iterator]() { return [...this._children][Symbol.iterator](); }
    // the path used by animation bindings
    pathFrom(ancestor) {
      const parts = [];
      for (let t = this; t && t !== ancestor; t = t._parent) parts.unshift(t.gameObject.name);
      return parts.join('/');
    }
  }
  U.Transform = Transform;
  U.Space = { World: 0, Self: 1 };

  class RectTransform extends Transform {
    constructor() {
      super();
      this._anchorMin = new Vector2(0.5, 0.5);
      this._anchorMax = new Vector2(0.5, 0.5);
      this._anchoredPosition = new Vector2(0, 0);
      this._sizeDelta = new Vector2(100, 100);
      this._pivot = new Vector2(0.5, 0.5);
      this._rootSize = null; // set on a root canvas: size in canvas units
    }
    _changed() { this._forceDirty(); U.UI && U.UI.markLayoutDirty(); }
    get anchorMin() { return Vector2.from(this._anchorMin); }
    set anchorMin(v) { this._anchorMin = Vector2.from(v); this._changed(); }
    get anchorMax() { return Vector2.from(this._anchorMax); }
    set anchorMax(v) { this._anchorMax = Vector2.from(v); this._changed(); }
    get anchoredPosition() { return Vector2.from(this._anchoredPosition); }
    set anchoredPosition(v) { this._anchoredPosition = Vector2.from(v); this._changed(); }
    get sizeDelta() { return Vector2.from(this._sizeDelta); }
    set sizeDelta(v) { this._sizeDelta = Vector2.from(v); this._changed(); }
    get pivot() { return Vector2.from(this._pivot); }
    set pivot(v) { this._pivot = Vector2.from(v); this._changed(); }
    get offsetMin() { const s = this._size(), p = this._pivot; return new Vector2(this._anchoredPosition.x - s.x * p.x, this._anchoredPosition.y - s.y * p.y); }
    get offsetMax() { const s = this._size(), p = this._pivot; return new Vector2(this._anchoredPosition.x + s.x * (1 - p.x), this._anchoredPosition.y + s.y * (1 - p.y)); }
    _parentSize() {
      const p = this._parent;
      if (p instanceof RectTransform) return p._size();
      return new Vector2(0, 0);
    }
    _size() {
      if (this._rootSize) return Vector2.from(this._rootSize);
      const ps = this._parentSize();
      return new Vector2(ps.x * (this._anchorMax.x - this._anchorMin.x) + this._sizeDelta.x,
        ps.y * (this._anchorMax.y - this._anchorMin.y) + this._sizeDelta.y);
    }
    get rect() {
      const s = this._size();
      return new U.Rect(-this._pivot.x * s.x, -this._pivot.y * s.y, s.x, s.y);
    }
    get localPosition() {
      if (this._rootSize || !(this._parent instanceof RectTransform)) return Vector3.from(this._lp);
      const p = this._parent, ps = p._size(), pp = p._pivot;
      const minX = -pp.x * ps.x, minY = -pp.y * ps.y;
      const ax = this._anchorMin.x + (this._anchorMax.x - this._anchorMin.x) * this._pivot.x;
      const ay = this._anchorMin.y + (this._anchorMax.y - this._anchorMin.y) * this._pivot.y;
      return new Vector3(minX + ps.x * ax + this._anchoredPosition.x, minY + ps.y * ay + this._anchoredPosition.y, this._lp.z);
    }
    set localPosition(v) {
      if (this._rootSize || !(this._parent instanceof RectTransform)) { this._lp = new Vector3(v.x, v.y, v.z || 0); this._changed(); return; }
      const cur = this.localPosition;
      this._anchoredPosition = new Vector2(this._anchoredPosition.x + (v.x - cur.x), this._anchoredPosition.y + (v.y - cur.y));
      this._lp = new Vector3(this._lp.x, this._lp.y, v.z || 0);
      this._changed();
    }
    SetSizeWithCurrentAnchors(axis, size) {
      const ps = this._parentSize();
      if (axis === 0) this._sizeDelta.x = size - ps.x * (this._anchorMax.x - this._anchorMin.x);
      else this._sizeDelta.y = size - ps.y * (this._anchorMax.y - this._anchorMin.y);
      this._changed();
    }
    SetInsetAndSizeFromParentEdge(edge, inset, size) {
      // edge: 0 Left, 1 Right, 2 Top, 3 Bottom
      const axis = edge === 2 || edge === 3 ? 1 : 0;
      const end = edge === 2 || edge === 1;
      const am = this.anchorMin, aM = this.anchorMax, ap = this.anchoredPosition, sd = this.sizeDelta;
      if (axis === 0) { am.x = aM.x = end ? 1 : 0; } else { am.y = aM.y = end ? 1 : 0; }
      const p = this._pivot;
      if (axis === 0) { sd.x = size; ap.x = end ? -inset - size * (1 - p.x) : inset + size * p.x; }
      else { sd.y = size; ap.y = end ? -inset - size * (1 - p.y) : inset + size * p.y; }
      this._anchorMin = am; this._anchorMax = aM; this._anchoredPosition = ap; this._sizeDelta = sd;
      this._changed();
    }
    // world corners: bottom-left, top-left, top-right, bottom-right
    GetWorldCorners(out) {
      const r = this.rect, m = this.worldMatrix;
      const pts = [[r.x, r.y], [r.x, r.yMax], [r.xMax, r.yMax], [r.xMax, r.y]].map(([x, y]) => { const [a, b] = U.applyAffine(m, x, y); return new Vector3(a, b, 0); });
      if (out) for (let i = 0; i < 4; i++) out[i] = pts[i];
      return pts;
    }
  }
  U.RectTransform = RectTransform;
  U.RectTransform.Axis = { Horizontal: 0, Vertical: 1 };
  U.RectTransform.Edge = { Left: 0, Right: 1, Top: 2, Bottom: 3 };
})(window.U);
