/*
 * core.js - math types and utilities with Unity semantics.
 *
 * Value types (Vector2/3, Quaternion, Color, Rect) behave like C# structs only
 * by convention: engine getters always return copies and setters copy values in,
 * so ported code may mutate what it reads without side effects.
 */
'use strict';
window.U = window.U || {};
window.U.NativeTypes = window.U.NativeTypes || {};
(function (U) {

  // ------------------------------------------------------------------ Mathf
  // C# Math.Round / Mathf.Round round half to even.
  function roundHalfEven(v) {
    const r = Math.round(v);
    if (Math.abs(v % 1) === 0.5) return 2 * Math.round(v / 2);
    return r;
  }
  const Mathf = {
    PI: Math.PI,
    Deg2Rad: Math.PI / 180,
    Rad2Deg: 180 / Math.PI,
    Infinity: Infinity,
    NegativeInfinity: -Infinity,
    Epsilon: 1.401298e-45,
    Abs: Math.abs,
    Sign: (f) => (f >= 0 ? 1 : -1),
    Min: (...a) => (a.length === 1 && Array.isArray(a[0]) ? Math.min(...a[0]) : Math.min(...a)),
    Max: (...a) => (a.length === 1 && Array.isArray(a[0]) ? Math.max(...a[0]) : Math.max(...a)),
    Clamp: (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v),
    Clamp01: (v) => (v < 0 ? 0 : v > 1 ? 1 : v),
    Lerp: (a, b, t) => a + (b - a) * (t < 0 ? 0 : t > 1 ? 1 : t),
    LerpUnclamped: (a, b, t) => a + (b - a) * t,
    InverseLerp: (a, b, v) => (a !== b ? Mathf.Clamp01((v - a) / (b - a)) : 0),
    Sqrt: Math.sqrt, Pow: Math.pow, Exp: Math.exp, Log: (f, p) => (p === undefined ? Math.log(f) : Math.log(f) / Math.log(p)),
    Log10: Math.log10,
    Sin: Math.sin, Cos: Math.cos, Tan: Math.tan, Asin: Math.asin, Acos: Math.acos, Atan: Math.atan, Atan2: Math.atan2,
    Floor: Math.floor, Ceil: Math.ceil,
    Round: roundHalfEven,
    RoundToInt: (f) => roundHalfEven(f) | 0,
    FloorToInt: (f) => Math.floor(f) | 0,
    CeilToInt: (f) => Math.ceil(f) | 0,
    Repeat: (t, len) => Mathf.Clamp(t - Math.floor(t / len) * len, 0, len),
    PingPong: (t, len) => { t = Mathf.Repeat(t, len * 2); return len - Math.abs(t - len); },
    MoveTowards: (cur, target, maxDelta) => (Math.abs(target - cur) <= maxDelta ? target : cur + Mathf.Sign(target - cur) * maxDelta),
    Approximately: (a, b) => Math.abs(b - a) < Math.max(1e-6 * Math.max(Math.abs(a), Math.abs(b)), 1.1754944e-38 * 8),
    DeltaAngle: (cur, target) => { let d = Mathf.Repeat(target - cur, 360); if (d > 180) d -= 360; return d; },
    LerpAngle: (a, b, t) => { let d = Mathf.Repeat(b - a, 360); if (d > 180) d -= 360; return a + d * Mathf.Clamp01(t); },
    SmoothStep: (from, to, t) => { t = Mathf.Clamp01(t); t = -2 * t * t * t + 3 * t * t; return to * t + from * (1 - t); },
    // C# integer helpers
    IntDiv: (a, b) => Math.trunc(a / b),
  };
  U.Mathf = Mathf;

  // ------------------------------------------------------------------ Random
  // Unity: Range(float, float) is inclusive; Range(int, int) excludes max.
  const Random = {
    Range: (min, max) => min + Math.random() * (max - min),
    RangeInt: (min, max) => (max <= min ? min : min + Math.floor(Math.random() * (max - min))),
    get value() { return Math.random(); },
    get insideUnitCircle() {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random());
      return new Vector2(Math.cos(a) * r, Math.sin(a) * r);
    },
    get onUnitSphere() {
      const z = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - z * z);
      return new Vector3(Math.cos(a) * r, Math.sin(a) * r, z);
    },
  };
  U.Random = Random;

  // ------------------------------------------------------------------ Vector2
  class Vector2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    static get zero() { return new Vector2(0, 0); }
    static get one() { return new Vector2(1, 1); }
    static get up() { return new Vector2(0, 1); }
    static get down() { return new Vector2(0, -1); }
    static get left() { return new Vector2(-1, 0); }
    static get right() { return new Vector2(1, 0); }
    static from(v) { return new Vector2(v.x, v.y); }
    clone() { return new Vector2(this.x, this.y); }
    set(x, y) { this.x = x; this.y = y; return this; }
    Set(x, y) { this.x = x; this.y = y; }
    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
    mul(s) { return new Vector2(this.x * s, this.y * s); }
    div(s) { return new Vector2(this.x / s, this.y / s); }
    neg() { return new Vector2(-this.x, -this.y); }
    scale(v) { return new Vector2(this.x * v.x, this.y * v.y); }
    get magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    get sqrMagnitude() { return this.x * this.x + this.y * this.y; }
    get normalized() { const m = this.magnitude; return m > 1e-5 ? new Vector2(this.x / m, this.y / m) : new Vector2(0, 0); }
    Normalize() { const m = this.magnitude; if (m > 1e-5) { this.x /= m; this.y /= m; } else { this.x = 0; this.y = 0; } }
    equals(v) { return (this.x - v.x) ** 2 + (this.y - v.y) ** 2 < 1e-10; }
    toV3(z = 0) { return new Vector3(this.x, this.y, z); }
    toString() { return '(' + this.x.toFixed(2) + ', ' + this.y.toFixed(2) + ')'; }
    static Distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    static Dot(a, b) { return a.x * b.x + a.y * b.y; }
    static Lerp(a, b, t) { t = Mathf.Clamp01(t); return new Vector2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t); }
    static LerpUnclamped(a, b, t) { return new Vector2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t); }
    static MoveTowards(cur, target, maxDelta) {
      const dx = target.x - cur.x, dy = target.y - cur.y, d2 = dx * dx + dy * dy;
      if (d2 === 0 || (maxDelta >= 0 && d2 <= maxDelta * maxDelta)) return new Vector2(target.x, target.y);
      const d = Math.sqrt(d2);
      return new Vector2(cur.x + dx / d * maxDelta, cur.y + dy / d * maxDelta);
    }
    static Angle(a, b) {
      const den = Math.sqrt((a.x * a.x + a.y * a.y) * (b.x * b.x + b.y * b.y));
      if (den < 1e-15) return 0;
      return Math.acos(Mathf.Clamp(Vector2.Dot(a, b) / den, -1, 1)) * Mathf.Rad2Deg;
    }
    static SignedAngle(a, b) { const ang = Vector2.Angle(a, b); return a.x * b.y - a.y * b.x >= 0 ? ang : -ang; }
    static ClampMagnitude(v, max) { const m2 = v.x * v.x + v.y * v.y; if (m2 > max * max) { const m = Math.sqrt(m2); return new Vector2(v.x / m * max, v.y / m * max); } return new Vector2(v.x, v.y); }
    static Perpendicular(v) { return new Vector2(-v.y, v.x); }
    static Reflect(dir, n) { const f = -2 * Vector2.Dot(n, dir); return new Vector2(f * n.x + dir.x, f * n.y + dir.y); }
    static Min(a, b) { return new Vector2(Math.min(a.x, b.x), Math.min(a.y, b.y)); }
    static Max(a, b) { return new Vector2(Math.max(a.x, b.x), Math.max(a.y, b.y)); }
  }
  U.Vector2 = Vector2;

  // ------------------------------------------------------------------ Vector3
  class Vector3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    static get zero() { return new Vector3(0, 0, 0); }
    static get one() { return new Vector3(1, 1, 1); }
    static get up() { return new Vector3(0, 1, 0); }
    static get down() { return new Vector3(0, -1, 0); }
    static get left() { return new Vector3(-1, 0, 0); }
    static get right() { return new Vector3(1, 0, 0); }
    static get forward() { return new Vector3(0, 0, 1); }
    static get back() { return new Vector3(0, 0, -1); }
    static from(v) { return new Vector3(v.x, v.y, v.z || 0); }
    clone() { return new Vector3(this.x, this.y, this.z); }
    Set(x, y, z) { this.x = x; this.y = y; this.z = z; }
    add(v) { return new Vector3(this.x + v.x, this.y + v.y, this.z + (v.z || 0)); }
    sub(v) { return new Vector3(this.x - v.x, this.y - v.y, this.z - (v.z || 0)); }
    mul(s) { return new Vector3(this.x * s, this.y * s, this.z * s); }
    div(s) { return new Vector3(this.x / s, this.y / s, this.z / s); }
    neg() { return new Vector3(-this.x, -this.y, -this.z); }
    scale(v) { return new Vector3(this.x * v.x, this.y * v.y, this.z * (v.z === undefined ? 1 : v.z)); }
    get magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
    get sqrMagnitude() { return this.x * this.x + this.y * this.y + this.z * this.z; }
    get normalized() { const m = this.magnitude; return m > 1e-5 ? new Vector3(this.x / m, this.y / m, this.z / m) : new Vector3(); }
    Normalize() { const n = this.normalized; this.x = n.x; this.y = n.y; this.z = n.z; }
    toV2() { return new Vector2(this.x, this.y); }
    toString() { return '(' + this.x.toFixed(2) + ', ' + this.y.toFixed(2) + ', ' + this.z.toFixed(2) + ')'; }
    static Distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)); }
    static Dot(a, b) { return a.x * b.x + a.y * b.y + (a.z || 0) * (b.z || 0); }
    static Cross(a, b) { return new Vector3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x); }
    static Lerp(a, b, t) { t = Mathf.Clamp01(t); return new Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, (a.z || 0) + ((b.z || 0) - (a.z || 0)) * t); }
    static MoveTowards(cur, target, maxDelta) {
      const dx = target.x - cur.x, dy = target.y - cur.y, dz = (target.z || 0) - (cur.z || 0);
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 === 0 || (maxDelta >= 0 && d2 <= maxDelta * maxDelta)) return new Vector3(target.x, target.y, target.z || 0);
      const d = Math.sqrt(d2);
      return new Vector3(cur.x + dx / d * maxDelta, cur.y + dy / d * maxDelta, (cur.z || 0) + dz / d * maxDelta);
    }
    static Scale(a, b) { return new Vector3(a.x * b.x, a.y * b.y, a.z * b.z); }
    static Angle(a, b) {
      const den = Math.sqrt(new Vector3(a.x, a.y, a.z || 0).sqrMagnitude * new Vector3(b.x, b.y, b.z || 0).sqrMagnitude);
      if (den < 1e-15) return 0;
      return Math.acos(Mathf.Clamp(Vector3.Dot(a, b) / den, -1, 1)) * Mathf.Rad2Deg;
    }
  }
  U.Vector3 = Vector3;

  // ------------------------------------------------------------------ Quaternion
  class Quaternion {
    constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; }
    static get identity() { return new Quaternion(0, 0, 0, 1); }
    static from(q) { return new Quaternion(q.x, q.y, q.z, q.w); }
    clone() { return new Quaternion(this.x, this.y, this.z, this.w); }
    // Unity Euler order: Z, then X, then Y (applied in that order => q = qy * qx * qz)
    static Euler(x, y, z) {
      if (typeof x === 'object') { z = x.z; y = x.y; x = x.x; }
      const hx = x * Mathf.Deg2Rad / 2, hy = y * Mathf.Deg2Rad / 2, hz = z * Mathf.Deg2Rad / 2;
      const qx = new Quaternion(Math.sin(hx), 0, 0, Math.cos(hx));
      const qy = new Quaternion(0, Math.sin(hy), 0, Math.cos(hy));
      const qz = new Quaternion(0, 0, Math.sin(hz), Math.cos(hz));
      return qy.mul(qx).mul(qz);
    }
    static AngleAxis(angle, axis) {
      const a = new Vector3(axis.x, axis.y, axis.z || 0).normalized, h = angle * Mathf.Deg2Rad / 2, s = Math.sin(h);
      return new Quaternion(a.x * s, a.y * s, a.z * s, Math.cos(h));
    }
    mul(q) {
      return new Quaternion(
        this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
        this.w * q.y + this.y * q.w + this.z * q.x - this.x * q.z,
        this.w * q.z + this.z * q.w + this.x * q.y - this.y * q.x,
        this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z);
    }
    rotate(v) {
      const x = this.x * 2, y = this.y * 2, z = this.z * 2;
      const xx = this.x * x, yy = this.y * y, zz = this.z * z, xy = this.x * y, xz = this.x * z, yz = this.y * z;
      const wx = this.w * x, wy = this.w * y, wz = this.w * z, vz = v.z || 0;
      return new Vector3(
        (1 - (yy + zz)) * v.x + (xy - wz) * v.y + (xz + wy) * vz,
        (xy + wz) * v.x + (1 - (xx + zz)) * v.y + (yz - wx) * vz,
        (xz - wy) * v.x + (yz + wx) * v.y + (1 - (xx + yy)) * vz);
    }
    static Inverse(q) { return new Quaternion(-q.x, -q.y, -q.z, q.w); }
    get eulerAngles() {
      // inverse of Euler(): ZXY
      const x = this.x, y = this.y, z = this.z, w = this.w;
      const sinX = 2 * (w * x - y * z);
      let ex, ey, ez;
      if (Math.abs(sinX) >= 0.99999) {
        ex = Math.sign(sinX) * Math.PI / 2;
        ey = Math.atan2(-2 * (x * z - w * y), 1 - 2 * (y * y + z * z));
        ez = 0;
      } else {
        ex = Math.asin(Mathf.Clamp(sinX, -1, 1));
        ey = Math.atan2(2 * (x * z + w * y), 1 - 2 * (x * x + y * y));
        ez = Math.atan2(2 * (x * y + w * z), 1 - 2 * (x * x + z * z));
      }
      const n = (r) => Mathf.Repeat(r * Mathf.Rad2Deg, 360);
      return new Vector3(n(ex), n(ey), n(ez));
    }
    static Dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w; }
    static Angle(a, b) { const d = Math.min(Math.abs(Quaternion.Dot(a, b)), 1); return d > 1 - 1e-6 ? 0 : Math.acos(d) * 2 * Mathf.Rad2Deg; }
    static Slerp(a, b, t) {
      t = Mathf.Clamp01(t);
      let d = Quaternion.Dot(a, b), bx = b.x, by = b.y, bz = b.z, bw = b.w;
      if (d < 0) { d = -d; bx = -bx; by = -by; bz = -bz; bw = -bw; }
      if (d > 0.9995) return Quaternion.Lerp(a, new Quaternion(bx, by, bz, bw), t);
      const th = Math.acos(d), s = Math.sin(th), wa = Math.sin((1 - t) * th) / s, wb = Math.sin(t * th) / s;
      return new Quaternion(a.x * wa + bx * wb, a.y * wa + by * wb, a.z * wa + bz * wb, a.w * wa + bw * wb);
    }
    static Lerp(a, b, t) {
      t = Mathf.Clamp01(t);
      const s = Quaternion.Dot(a, b) < 0 ? -1 : 1;
      const q = new Quaternion(a.x + (b.x * s - a.x) * t, a.y + (b.y * s - a.y) * t, a.z + (b.z * s - a.z) * t, a.w + (b.w * s - a.w) * t);
      const m = Math.hypot(q.x, q.y, q.z, q.w) || 1;
      q.x /= m; q.y /= m; q.z /= m; q.w /= m;
      return q;
    }
    static RotateTowards(from, to, maxDeg) {
      const ang = Quaternion.Angle(from, to);
      return ang === 0 ? Quaternion.from(to) : Quaternion.Slerp(from, to, Math.min(1, maxDeg / ang));
    }
    static FromToRotation(a, b) {
      const ang = Math.atan2(b.y, b.x) - Math.atan2(a.y, a.x);
      return Quaternion.Euler(0, 0, ang * Mathf.Rad2Deg);
    }
  }
  U.Quaternion = Quaternion;

  // ------------------------------------------------------------------ Color
  class Color {
    constructor(r = 0, g = 0, b = 0, a = 1) { this.r = r; this.g = g; this.b = b; this.a = a; }
    static get white() { return new Color(1, 1, 1, 1); }
    static get black() { return new Color(0, 0, 0, 1); }
    static get red() { return new Color(1, 0, 0, 1); }
    static get green() { return new Color(0, 1, 0, 1); }
    static get blue() { return new Color(0, 0, 1, 1); }
    static get yellow() { return new Color(1, 0.92156863, 0.015686275, 1); }
    static get cyan() { return new Color(0, 1, 1, 1); }
    static get magenta() { return new Color(1, 0, 1, 1); }
    static get gray() { return new Color(0.5, 0.5, 0.5, 1); }
    static get grey() { return new Color(0.5, 0.5, 0.5, 1); }
    static get clear() { return new Color(0, 0, 0, 0); }
    static from(c) { return c ? new Color(c.r, c.g, c.b, c.a === undefined ? 1 : c.a) : new Color(1, 1, 1, 1); }
    static from32(c) { return new Color(c.r / 255, c.g / 255, c.b / 255, c.a / 255); }
    clone() { return new Color(this.r, this.g, this.b, this.a); }
    mul(c) { return typeof c === 'number' ? new Color(this.r * c, this.g * c, this.b * c, this.a * c) : new Color(this.r * c.r, this.g * c.g, this.b * c.b, this.a * c.a); }
    static Lerp(a, b, t) { t = Mathf.Clamp01(t); return new Color(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t, a.a + (b.a - a.a) * t); }
    static HSVToRGB(h, s, v) {
      const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
      const m = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][((i % 6) + 6) % 6];
      return new Color(m[0], m[1], m[2], 1);
    }
    css(alphaMul = 1) {
      const c = (v) => Math.round(Mathf.Clamp01(v) * 255);
      return 'rgba(' + c(this.r) + ',' + c(this.g) + ',' + c(this.b) + ',' + Mathf.Clamp01(this.a * alphaMul) + ')';
    }
    isWhite() { return this.r >= 0.999 && this.g >= 0.999 && this.b >= 0.999; }
  }
  U.Color = Color;

  // ------------------------------------------------------------------ Rect
  class Rect {
    constructor(x = 0, y = 0, w = 0, h = 0) { this.x = x; this.y = y; this.width = w; this.height = h; }
    get xMin() { return this.x; } get yMin() { return this.y; }
    get xMax() { return this.x + this.width; } get yMax() { return this.y + this.height; }
    get center() { return new Vector2(this.x + this.width / 2, this.y + this.height / 2); }
    get size() { return new Vector2(this.width, this.height); }
    Contains(p) { return p.x >= this.x && p.x < this.x + this.width && p.y >= this.y && p.y < this.y + this.height; }
  }
  U.Rect = Rect;

  // ------------------------------------------------------------------ CRC32 (Unity animation path hashes)
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  U.crc32 = function (str) {
    const bytes = new TextEncoder().encode(str);
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  };

  // ------------------------------------------------------------------ Time
  U.Time = {
    time: 0, unscaledTime: 0, deltaTime: 0, unscaledDeltaTime: 0, fixedDeltaTime: 0.02,
    fixedTime: 0, timeScale: 1, frameCount: 0, realtimeSinceStartup: 0, maximumDeltaTime: 1 / 3,
    inFixedStep: false,
  };

  // ------------------------------------------------------------------ Debug
  U.Debug = {
    enabled: true,
    Log: (...a) => { if (U.Debug.enabled) console.log('[game]', ...a.map(String)); },
    LogWarning: (...a) => console.warn('[game]', ...a.map(String)),
    LogError: (...a) => console.error('[game]', ...a.map(String)),
    DrawLine: () => {}, DrawRay: () => {},
  };

  // ------------------------------------------------------------------ C#-style string helpers
  U.Str = {
    // string.Format("{0} x {1:0.0}", a, b)
    Format(fmt, ...args) {
      return String(fmt).replace(/\{(\d+)(?::([^}]+))?\}/g, (m, i, f) => U.Str.formatValue(args[+i], f));
    },
    formatValue(v, f) {
      if (v === undefined || v === null) return '';
      if (!f) return typeof v === 'number' ? U.Str.num(v) : String(v);
      if (/^[Ff]\d*$/.test(f)) return Number(v).toFixed(f.length > 1 ? +f.slice(1) : 2);
      if (/^[Nn]\d*$/.test(f)) return Number(v).toLocaleString('en-US', { minimumFractionDigits: f.length > 1 ? +f.slice(1) : 2, maximumFractionDigits: f.length > 1 ? +f.slice(1) : 2 });
      if (/^0(\.0+)?$/.test(f)) return Number(v).toFixed(f.includes('.') ? f.split('.')[1].length : 0);
      if (/^0(\.#+)?$/.test(f)) { const d = f.includes('.') ? f.split('.')[1].length : 0; return String(+Number(v).toFixed(d)); }
      if (/^[Pp]\d*$/.test(f)) return (Number(v) * 100).toFixed(f.length > 1 ? +f.slice(1) : 2) + ' %';
      return String(v);
    },
    // default C# float.ToString(): up to 7 significant digits, no trailing zeros
    num(v) {
      if (Number.isInteger(v)) return String(v);
      let s = String(+v.toPrecision(7));
      if (s.includes('e')) s = String(+v.toFixed(7));
      return s;
    },
  };

  // ------------------------------------------------------------------ misc
  U.noop = () => {};
  U.assert = (cond, msg) => { if (!cond) throw new Error('assert: ' + msg); };
})(window.U);
