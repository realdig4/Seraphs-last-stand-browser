/*
 * world.js - the arena: ground (stepped polygon) and side walls built from the
 * original level geometry (facts.arena), plus the background renderer hook.
 */
'use strict';
(function (SLS, U) {
  const { Vector2, Vector3 } = U;
  const A = SLS.F.arena;

  SLS.World = {
    ground: null,
    groundTop(x) {
      // highest ground surface at x (world), from the polygon slabs
      const col = SLS.World.ground && SLS.World.ground.GetComponent(U.PolygonCollider2D);
      if (!col) return -3.5;
      let best = -Infinity;
      for (const r of col.shape().rects) if (x >= r[0] && x <= r[2]) best = Math.max(best, r[3]);
      return best === -Infinity ? -3.9 : best;
    },
    bounds: { left: -8.4, right: 8.45 },
  };

  SLS.World.build = function () {
    // ground polygon (world coordinates, object at the origin)
    const ground = new U.GameObject('Ground', { layer: SLS.Layer.Ground, tag: SLS.Tag.Ground, active: false });
    const poly = ground.AddComponent(U.PolygonCollider2D);
    poly.paths = [A.groundPolygon.map((p) => new Vector2(p[0], p[1]))];
    const rb = ground.AddComponent(U.Rigidbody2D);
    rb.bodyType = U.RigidbodyType2D.Kinematic;
    rb.constraints = 7;
    ground.SetActive(true);
    SLS.World.ground = ground;
    // side walls (only the active ones in the original scene)
    for (const w of A.walls) {
      if (!w.active) continue;
      const g = new U.GameObject(w.name, { layer: SLS.Layer.Default, active: false });
      g.transform.position = new Vector3(w.cx, w.cy, 0);
      const box = g.AddComponent(U.BoxCollider2D);
      box.size = new Vector2(w.w, w.h);
      g.SetActive(true);
      if (w.cx < 0) SLS.World.bounds.left = w.cx + w.w / 2; else SLS.World.bounds.right = w.cx - w.w / 2;
    }
    U.Render.camera.x = SLS.F.camera.x;
    U.Render.camera.y = SLS.F.camera.y;
    U.Render.camera.size = SLS.F.camera.orthoSize;
    U.Render.backgroundDraw = (ctx) => SLS.Art.drawBackground(ctx, U.Time.unscaledTime);
  };
})(window.SLS, window.U);
