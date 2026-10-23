/*
 * sprites.js - which original sprite each game object uses (see engine/assets.js).
 *
 * Every SLS.Art drawing first tries its sprite and falls back to the procedural
 * art in art.js when the image is missing or still loading.
 */
'use strict';
(function (SLS, U) {
  const As = U.Assets;
  const Art = SLS.Art;

  const S = SLS.Sprites = {
    player: 'MainChar',
    cloak: 'VampireCloak',
    hats: { 200: 'Hat_wizard', 201: 'Hat_Helmet', 202: 'Hat_Propeller', 203: 'Hat_Uncommon', 204: 'Hat_Challenger', 205: 'Hat_Fedora' },
    staffs: { 300: 'normal_staff', 301: 'homing_staff', 302: 'triple_staff', 303: 'boom_staff', 304: 'thunder_staff', 305: 'frozen_staff', 306: 'rainbow_staff' },
    bosses: { 1: 'Boss1', 2: 'Boss2' },
    projectile: 'Projectile',
    soul: 'Souls',           // UI / card icon only
    wisp: 'Willowisp_wisp',  // the friendly wisp's Graphics (the 512 px 'Willowisp' is the card icon)
    thunderbolt: 'Thunderbol',
    white: 'color_white',    // SoulRay, StreamerBeam
    knob: 'Knob',            // CometExplosion
    arena: 'spr_cenario_tiles',
    cursor: 'CursorSprite',
  };

  // enemy prefab name -> sprite ('Weak_Ranged+' -> 'Weak_ranged_lvl2', '_END' -> lvl4)
  const ENEMY_BASE = { Weak_Ranged: 'Weak_ranged', Medium_Ranged: 'Medium_ranged', Strong_Ranged: 'Strong_Ranged',
    Weak_Melee: 'Weak_melee', Medium_Melee: 'Strong_Melee', Strong_Melee: 'Strong_Melee', Cannon: 'Cannon' };
  S.enemy = function (prefab) {
    if (prefab === 'Boss1' || prefab === 'Boss2') return prefab;
    if (prefab === 'Weak_Ranged_END') return 'Weak_ranged_lvl4';
    const tier = prefab.endsWith('++') ? 3 : prefab.endsWith('+') ? 2 : 1;
    const base = ENEMY_BASE[prefab.replace(/\+/g, '')];
    if (!base) return null;
    return tier === 1 ? base : base + '_lvl' + tier;
  };

  // card name -> icon sprite: the icon files are named after the card without '+'
  // and spaces; a few differ.
  const CARD_ICON = { 'Will-O-Wisp': 'Willowisp', 'God of Thunder': 'ThunderGod', 'RAM Destroyer': 'RAMdestroyer',
    'Bloody Mage': 'BloodyMage', 'Anti-Aircraft': 'AntiAir', 'Pac-Man': 'Packman', 'Tryhard': 'Tryhard',
    6: 'SoulOrb', 90: 'Freezer' };   // Item.item_icon: card 6 "Souls" uses SoulOrb
  const SPR = window.SLS_SPRITES || {};
  const norm = (s) => s.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  const lower = new Map(Object.keys(SPR).map((k) => [norm(k), k]));   // 'Burning Man' -> 'burningman'
  S.card = function (item) {
    if (!item) return null;
    if (CARD_ICON[item.id]) return CARD_ICON[item.id];
    const n = item.name || '';
    if (CARD_ICON[n]) return CARD_ICON[n];
    return lower.get(norm(n)) || null;
  };

  // ---------------------------------------------------------------- Art: sprite first
  // player-local space: Graphics/Helmet children sit at y 0.21 with scale 3.3
  const RIG = SLS.F.player.children;
  const GFX = RIG.Graphics.transform;
  function inChild(ctx, tf, draw) {
    ctx.save();
    ctx.translate(tf.pos.x, tf.pos.y);
    ctx.scale(tf.scale.x, tf.scale.y);
    const ok = draw();
    ctx.restore();
    return ok;
  }

  const baseArt = { player: Art.player, hat: Art.hat, staff: Art.staff, boss: Art.boss, projectile: Art.projectile,
    orb: Art.orb, thunderbolt: Art.thunderbolt, soulRay: Art.soulRay, drawBackground: Art.drawBackground, drawArena: Art.drawArena };

  Art.player = function (ctx, s) {
    if (inChild(ctx, GFX, () => As.drawSprite(ctx, S.player))) {
      if (s && s.hurt > 0) inChild(ctx, GFX, () => As.drawTinted(ctx, S.player, 'rgb(255,60,60)', { alpha: 0.6 * s.hurt }));
      return;
    }
    baseArt.player(ctx, s);
  };
  Art.hat = function (ctx, id, s) {
    const name = S.hats[id] || S.hats[200];
    if (inChild(ctx, RIG.Helmet.transform, () => As.drawSprite(ctx, name))) return;
    baseArt.hat(ctx, id, s);
  };
  // staff space (the Staff child): the sprite's pivot is the hand
  Art.staffSprite = (ctx, id) => As.drawSprite(ctx, S.staffs[id] || S.staffs[300]);
  Art.cloak = (ctx) => inChild(ctx, GFX, () => As.drawSprite(ctx, S.cloak));

  Art.enemySprite = function (ctx, prefab, opts) {
    const name = S.enemy(prefab);
    return !!name && As.drawSprite(ctx, name, opts);
  };

  // projectiles: the white Projectile sprite (1x1 unit) tinted like the prefab's SpriteRenderer;
  // the prefab scale (0.13, needle 0.338x0.019, ...) comes from the transform. true = sprite drawn.
  Art.projectile = function (ctx, kind, s = {}) {
    const col = s.color || Art.projColor(kind, s.t || 0);
    if (As.drawTinted(ctx, S.projectile, col, { smooth: true })) return true;
    baseArt.projectile(ctx, kind, s);
    return false;
  };
  // SoulOrb / HealingOrb pickups: Projectile sprite tinted (0,0.714,1) / (0.302,1,0); the hoarder's
  // red healing orb (HealingOrb.cs:25, (1,0,0)) arrives as kind 'enemy4' from enemies.js.
  // enemies.js pre-scales by 2.6 for the procedural orb, undone here (the prefab scale 0.2 is the size).
  const ORB_TINT = { soulOrb: Art.projColor('soulOrb'), healingOrb: Art.projColor('healingOrb'), enemy4: '#ff0000' };
  Art.orb = function (ctx, kind, s = {}) {
    if (ORB_TINT[kind]) {
      ctx.save(); ctx.scale(1 / 2.6, 1 / 2.6);
      const ok = As.drawTinted(ctx, S.projectile, ORB_TINT[kind], { smooth: true });
      ctx.restore();
      if (ok) return true;
    }
    baseArt.orb(ctx, kind, s);
    return false;
  };
  // ThunderBolt: Thunderbol (20x449 px) coloured (0.91,1,0.984,0.475); Thundergod (1,0,0,1)
  Art.thunderboltSprite = (ctx, red) => As.drawTinted(ctx, S.thunderbolt, red ? '#ff0000' : 'rgb(232,255,251)',
    { alpha: red ? 1 : 0.475, smooth: true });
  // BlackHole: the Projectile sprite, black
  Art.blackHoleSprite = (ctx) => As.drawTinted(ctx, S.projectile, '#000000', { smooth: true });
  // SoulRay: color_white coloured (0.283,0.297,0.311); s.alpha comes from its animation
  Art.soulRay = function (ctx, s = {}) {
    if (As.drawTinted(ctx, S.white, 'rgb(72,76,79)', { alpha: s.alpha === undefined ? 0.737 : s.alpha })) return true;
    baseArt.soulRay(ctx, s);
    return false;
  };
  // StreamerBeam/Graphics: color_white tinted (0.74,0,1,0.427), in the Graphics child's space
  Art.streamerBeam = (ctx) => As.drawTinted(ctx, S.white, 'rgb(189,0,255)', { alpha: 0.427 });
  // CometExplosion: Knob (0.2 units) with the animated colour (css rgb + alpha)
  Art.cometSprite = (ctx, css, alpha) => As.drawTinted(ctx, S.knob, css, { alpha, smooth: true });
  // friendly Willowisp: its Graphics child sprite, turned with the wisp (transform.right)
  Art.wispSprite = (ctx) => As.drawSprite(ctx, S.wisp);

  // ---------------------------------------------------------------- background + arena
  // The scene (=== WORLD ===): black camera clear, "Background" (1920x1080, order -10, alpha 0.533,
  // bilinear) and "Ground" (scale 5.23, point filtered). GroundRemake (spr_cenario_tiles, scale 3.55)
  // exists in the scene with its renderer disabled; ?ground=tiles shows it instead.
  const VA = SLS.F.arena.visualAnchors || {};
  const WORLD = { x: 0.154, y: -0.176 };
  const useTiles = /[?&]ground=tiles\b/.test(location.search);
  function drawAt(ctx, a, name, opts) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.scale(a.sx, a.sy);
    const ok = As.drawSprite(ctx, name, opts);
    ctx.restore();
    return ok;
  }
  Art.drawBackground = function (ctx, t) {
    if (!As.image('Background_scene') || !As.image(useTiles ? S.arena : 'Ground')) return baseArt.drawBackground(ctx, t);
    const hw = U.Render.worldHalfWidth() + 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(-hw, -6, hw * 2, 12);
    drawAt(ctx, { x: WORLD.x, y: WORLD.y, sx: 1, sy: 1 }, 'Background_scene', { alpha: 0.533, smooth: true });
    Art.drawArena(ctx, t);
  };
  Art.drawArena = function (ctx, t) {
    const g = useTiles ? VA.GroundRemake : VA.Ground;
    if (g && drawAt(ctx, g, useTiles ? S.arena : 'Ground')) {
      // Wall1 / Wall2: thin grey bars (the 1x1 Projectile sprite, scale x 0.07)
      ctx.fillStyle = 'rgb(120,119,119)';
      for (const x of [-8.45, 8.49]) ctx.fillRect(x - 0.035, -6, 0.07, 12);
      return;
    }
    baseArt.drawArena(ctx, t);
  };

  // ---------------------------------------------------------------- UI icons
  // card icons: Art.icon(ctx, symbol, ...) is called with the item's symbol; items.js
  // passes the item through Art.itemIcon when it has one.
  Art.itemIcon = function (ctx, item, x, y, size) {
    if (!item) return false;
    let name = null;
    if (item.group === 'cards') name = S.card(item);
    else if (item.group === 'hats') name = S.hats[item.id];
    else if (item.group === 'staffs') name = S.staffs[item.id];
    if (!name || !As.image(name)) return false;
    if (item.group === 'cards') return As.drawSpriteUI(ctx, name, x, y, size * 1.15, { smooth: true });
    // hats / staffs: pixel art, crop to the visible pixels
    return drawCropped(ctx, name, x, y, size);
  };
  const cropCache = new Map();
  function bbox(name) {
    let b = cropCache.get(name);
    if (b) return b;
    const img = As.image(name);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      if (d[(y * c.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    b = x1 < 0 ? { x: 0, y: 0, w: c.width, h: c.height } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    cropCache.set(name, b);
    return b;
  }
  function drawCropped(ctx, name, x, y, size) {
    const img = As.image(name), b = bbox(name), k = size / Math.max(b.w, b.h);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, b.x, b.y, b.w, b.h, x - b.w * k / 2, y - b.h * k / 2, b.w * k, b.h * k);
    ctx.restore();
    return true;
  }
  Art.drawCropped = drawCropped;

  As.preload();
})(window.SLS, window.U);
