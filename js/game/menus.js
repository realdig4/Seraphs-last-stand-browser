/*
 * menus.js - every menu of the remake (startup order 60):
 *   title menu with the hat/staff loadout picker, Upgrades (UI over ProgresisonManager), Options,
 *   How to Play, Credits, Encyclopedia, a "thanks for playing" panel for Quit, Pause, Game Over
 *   (local records instead of the Steam leaderboards) and the item tooltip.
 * Implements SLS.UIHooks.gameOver / setPaused / showItemPopup (+ hideItemPopup).
 *
 * Original behaviour this follows (analysis chapters 01, 04, 05, 07, 08, 10):
 *  - WaveManager.Start pauses the game (timeScale 0) and shows pause_screen, which is the start menu.
 *    The start button runs WaveManager.StartGame() then WaveManager.UnpauseGame(), hides the menu
 *    and deactivates the CheatManager, so the cheat codes only work on the title.
 *  - ExitGame: J "clicks" the title's Quit button while the title is up.
 *  - The hat/staff picker calls PlayerStats.SelectHat(add) / SelectStaff(add) (indices clamp, no
 *    wrap), UnlockSelectedHat() / UnlockSelectedStaff() (pay `price` souls) and HasSelectedHat() /
 *    HasSelectedStaff(). A locked item shows its price; its stats are not applied. The arrows are
 *    Core.ComplementaryButtons: with a gamepad, moving onto one clicks it and the focus goes back
 *    to the hat / staff button on the next frame.
 *  - Upgrades: SelectUpgrade(i), BuyUpgrade(). The buy button mirrors ProgresisonManager (price =
 *    upgrade_price, interactable and white only while soul_orbs >= upgrade_price). With a gamepad,
 *    focusing an entry selects it and submitting on it also presses buy (Core.SelectButton). The
 *    scene's ResetStats button is inactive, so there is no reset.
 *  - Options (a Core.Window): 7 keys saved through SaveManager: language, sfx_volume, music_volume,
 *    screen_resolution, fullscreen (default true), mouse_color, particles_enabled; loaded at boot.
 *  - Core.Window: Back (Esc / gamepad B) "presses" the close button, starting 100 ms after opening.
 *    Core.HowToPlay swaps the keyboard/gamepad panel live when the input device changes.
 *  - Sounds (Core.BetterButton / BetterSlider / BetterToggle / BetterDropdown): every focus change
 *    with a gamepad plays the select sound; a button click or submit plays the click sound (also on
 *    a non-interactable button); toggles, dropdowns, sliders and Back make no sound of their own.
 *  - Credits: two AccessLink buttons open the original authors' itch.io pages.
 *  - WaveManager.OnPause (Esc / P / Start) toggles PauseGame + options screen / UnpauseGame. During a
 *    run the options screen has a "give up" button (PlayerStats.KillSelf). The pause screen is not a
 *    Core.Window and WaveManager.OnBack is never subscribed, so Back does not resume.
 *  - PlayerStats.CheckHP at death: EndGame panel with the wave reached, leaderboard upload skipped
 *    when hat == 5, restart = reload the scene (here: location.reload()).
 *  - EncyclopediaManager / EncCard: the card ItemGroup in order, a title row whenever the rarity
 *    goes up, entries with rarity > 2 hidden ("???" + how to get) until i{id}_Unlocked is saved.
 *  - ItemPopup: name + description of the hovered inventory item, following the mouse.
 * All drawings and texts are original.
 */
'use strict';
(function (SLS, U) {
  const UI = U.UI;
  const { Mathf } = U;
  const T = (key, ...args) => SLS.T(key, ...args);
  const TAU = Math.PI * 2;
  const GOLD = '#ffd36b', GOLD_DIM = '#c9a24a', INK = '#f4ead2', INK_DIM = 'rgba(244,234,210,0.72)';
  const SOUL = '#9fd8ff', RED = '#ff6b6b';
  const RARITY_COLORS = ['#e9e4f4', '#6dff8a', '#ff6bf0', '#ffd36b'];
  const RARITY_SYMBOL = ['orb', 'star', 'burst', 'crown'];
  const CURSOR_COLORS = ['#ffffff', '#6dff8a', '#ffe14a', '#4de8ff'];   // Options cursor presets 0..3
  // Options.cursor_textures: the hardware cursors (hotspot 25,22), from game/assets/cursors
  const CURSOR_FILES = ['Cursor', 'Cursor_green', 'Cursor_yellow', 'Cursor_cyan'];
  function setCursor(i) {
    SLS.cursorColor = CURSOR_COLORS[i];   // drawn reticle (fallback when the textures are missing)
    U.Input.setCursor((U.Assets ? U.Assets.base : 'assets/') + 'cursors/' + CURSOR_FILES[i] + '.png', 25, 22);
  }
  const FEDORA_HAT = 5;                    // PlayerStats.CheckHP skips the leaderboard upload when hat == 5
  const RECORDS_KEY = 'local_records';     // remake-only save key (replaces the Steam leaderboards)
  const MAX_RECORDS = 10;
  const NO_UPGRADE = 8;                    // ProgresisonManager.selected_upgrade: 8 = none selected

  // ---------------------------------------------------------------- strings (original wording)
  SLS.addStrings('en', {
    'menus.loadout': 'Loadout',
    'menus.hat': 'Hat',
    'menus.staff': 'Staff',
    'menus.unlock': 'Unlock',
    'menus.lockedHint': 'Locked: spend souls to unlock it.',
    'menus.hatStats': 'Extra jumps {0}  ·  Armor {1}  ·  Speed ×{2}',
    'menus.staffStats': 'One shot every {0} s',
    'options.cursor0': 'White', 'options.cursor1': 'Green', 'options.cursor2': 'Yellow', 'options.cursor3': 'Cyan',
    'options.unavailable': 'Not available',
    'pause.hint': 'Esc, P or Start resumes the battle',
    'howto.kbm': 'Keyboard & Mouse', 'howto.pad': 'Gamepad',
    'howto.move': 'Move', 'howto.jump': 'Jump', 'howto.aim': 'Aim', 'howto.shoot': 'Shoot',
    'howto.auto': 'Auto-attack on / off', 'howto.pause': 'Pause', 'howto.back': 'Close a window',
    'howto.kbm.move': '[A]  [D]', 'howto.kbm.jump': '[Space]  or  [W]', 'howto.kbm.aim': 'Move the mouse',
    'howto.kbm.shoot': 'Hold  [Left mouse button]', 'howto.kbm.auto': '[Q]', 'howto.kbm.pause': '[Esc]  or  [P]',
    'howto.kbm.back': '[Esc]',
    'howto.pad.move': 'Left stick', 'howto.pad.jump': '[A]  or  [LT]', 'howto.pad.aim': 'Right stick, pushed firmly',
    'howto.pad.shoot': '[RT]', 'howto.pad.auto': '[Y]', 'howto.pad.pause': '[Start]', 'howto.pad.back': '[B]',
    'howto.padNote': 'Button names follow the Xbox layout: A is the bottom button, B the right one and Y the top one.',
    'howto.goalTitle': 'Your task',
    'howto.goal': 'Hold the arena against endless waves of wraiths. Every cleared wave raises your maximum health by 2 and opens a shop where you take one free card for this run. Stack enough cards of one kind and you may awaken a transcendence. A mighty foe waits at wave 60.',
    'howto.tipsTitle': 'Tips',
    'howto.tip1': 'Fallen enemies sometimes leave souls behind. Souls are kept between runs: spend them on upgrades, hats and staffs.',
    'howto.tip2': 'Your hat sets your extra jumps, armor and speed. Your staff decides how you shoot.',
    'howto.tip3': 'Turn auto-attack on to keep firing while you concentrate on dodging.',
    'howto.tip4': 'In the shop, a fresh hand of cards costs 5 souls.',
    'credits.line1': "Original game: Seraph's Last Stand by André Young (Odd Giant / Socket Lab), with additional programming by Gustavo Lazzarini.",
    'credits.line2': 'Web remake: fan re-creation with original code, art and sound, made for the remake challenge.',
    'credits.thanks': 'Thank you for playing!',
    'credits.link1': 'André Young on itch.io',
    'credits.link2': 'Gustavo Lazzarini on itch.io',
    'quit.title': 'Thanks for playing!',
    'quit.body': "A web page can't close its own tab, so close it whenever you like. Your souls, upgrades and options stay saved in this browser.",
    'ency.r0': 'Common cards', 'ency.r1': 'Rare cards', 'ency.r2': 'Epic cards', 'ency.r3': 'Transcendences',
    'ency.k0': 'Common card', 'ency.k1': 'Rare card', 'ency.k2': 'Epic card', 'ency.k3': 'Transcendence',
    'ency.hidden': '???',
    'ency.found': 'Discovered: {0} / {1}',
    'ency.hiddenHint': 'Awaken this transcendence during a run to reveal it.',
    'ency.pick': 'Choose an entry to read about it.',
    'ency.noText': 'No description yet.',
    'upg.subtitle': 'Permanent blessings bought with souls. They apply at the start of every run.',
    'upg.name0': 'Damage', 'upg.name1': 'Attack Speed', 'upg.name2': 'Move Speed', 'upg.name3': 'Defense',
    'upg.name4': 'Stability', 'upg.name5': 'Vitality', 'upg.name6': 'Critical Chance', 'upg.name7': 'Soul Harvest',
    'upg.desc0': 'Every second level adds +1 damage to your shots.',
    'upg.desc1': 'Each level shortens the time between your shots by 5%.',
    'upg.desc2': 'Each level makes you run 10% faster.',
    'upg.desc3': 'Each level adds 1 armor: every hit you take deals 1% less damage.',
    'upg.desc4': 'Each level lets every one of your shots cancel one more enemy bullet.',
    'upg.desc5': 'Each level adds 5 maximum health.',
    'upg.desc6': 'Each level adds 2% critical hit chance.',
    'upg.desc7': 'Each level adds 1% chance that a fallen enemy leaves a soul behind.',
    'upg.level': 'Level {0} / {1}',
    'upg.max': 'Maxed',
    'upg.pick': 'Choose an upgrade to see what it does and what it costs.',
    'upg.unavailable': 'Upgrades are not available yet.',
    'over.notRanked': 'The Fedora was worn, so this run is not ranked.',
    'over.empty': 'No records yet.',
  });
  SLS.addStrings('pt', {
    'menus.loadout': 'Equipamento',
    'menus.hat': 'Chapéu',
    'menus.staff': 'Cajado',
    'menus.unlock': 'Desbloquear',
    'menus.lockedHint': 'Bloqueado: gaste almas para desbloquear.',
    'menus.hatStats': 'Pulos extras {0}  ·  Armadura {1}  ·  Velocidade ×{2}',
    'menus.staffStats': 'Um disparo a cada {0} s',
    'options.cursor0': 'Branco', 'options.cursor1': 'Verde', 'options.cursor2': 'Amarelo', 'options.cursor3': 'Ciano',
    'options.unavailable': 'Indisponível',
    'pause.hint': 'Esc, P ou Start retoma a batalha',
    'howto.kbm': 'Teclado e Mouse', 'howto.pad': 'Controle',
    'howto.move': 'Mover', 'howto.jump': 'Pular', 'howto.aim': 'Mirar', 'howto.shoot': 'Atirar',
    'howto.auto': 'Ataque automático', 'howto.pause': 'Pausar', 'howto.back': 'Fechar uma janela',
    'howto.kbm.move': '[A]  [D]', 'howto.kbm.jump': '[Espaço]  ou  [W]', 'howto.kbm.aim': 'Mova o mouse',
    'howto.kbm.shoot': 'Segure o  [Botão esquerdo]', 'howto.kbm.auto': '[Q]', 'howto.kbm.pause': '[Esc]  ou  [P]',
    'howto.kbm.back': '[Esc]',
    'howto.pad.move': 'Analógico esquerdo', 'howto.pad.jump': '[A]  ou  [LT]', 'howto.pad.aim': 'Analógico direito, bem inclinado',
    'howto.pad.shoot': '[RT]', 'howto.pad.auto': '[Y]', 'howto.pad.pause': '[Start]', 'howto.pad.back': '[B]',
    'howto.padNote': 'Os nomes seguem o padrão Xbox: A é o botão de baixo, B o da direita e Y o de cima.',
    'howto.goalTitle': 'Sua missão',
    'howto.goal': 'Defenda a arena contra ondas intermináveis de espectros. Cada onda vencida aumenta sua vida máxima em 2 e abre uma loja onde você leva uma carta grátis para esta partida. Junte cartas suficientes de um mesmo tipo e você pode despertar uma transcendência. Um inimigo poderoso espera na onda 60.',
    'howto.tipsTitle': 'Dicas',
    'howto.tip1': 'Inimigos derrotados às vezes deixam almas. As almas ficam guardadas entre as partidas: gaste-as em melhorias, chapéus e cajados.',
    'howto.tip2': 'Seu chapéu define seus pulos extras, sua armadura e sua velocidade. Seu cajado define como você atira.',
    'howto.tip3': 'Ligue o ataque automático para continuar atirando enquanto se concentra em desviar.',
    'howto.tip4': 'Na loja, uma nova mão de cartas custa 5 almas.',
    'credits.line1': "Jogo original: Seraph's Last Stand, de André Young (Odd Giant / Socket Lab), com programação adicional de Gustavo Lazzarini.",
    'credits.line2': 'Remake para navegador: recriação feita por fãs, com código, arte e som originais, criada para o desafio de remakes.',
    'credits.thanks': 'Obrigado por jogar!',
    'credits.link1': 'André Young no itch.io',
    'credits.link2': 'Gustavo Lazzarini no itch.io',
    'quit.title': 'Obrigado por jogar!',
    'quit.body': 'Uma página da web não pode fechar a própria aba; feche-a quando quiser. Suas almas, melhorias e opções continuam salvas neste navegador.',
    'ency.r0': 'Cartas comuns', 'ency.r1': 'Cartas raras', 'ency.r2': 'Cartas épicas', 'ency.r3': 'Transcendências',
    'ency.k0': 'Carta comum', 'ency.k1': 'Carta rara', 'ency.k2': 'Carta épica', 'ency.k3': 'Transcendência',
    'ency.hidden': '???',
    'ency.found': 'Descobertas: {0} / {1}',
    'ency.hiddenHint': 'Desperte esta transcendência durante uma partida para revelá-la.',
    'ency.pick': 'Escolha um item para ler sobre ele.',
    'ency.noText': 'Ainda sem descrição.',
    'upg.subtitle': 'Bênçãos permanentes compradas com almas. Valem no início de cada partida.',
    'upg.name0': 'Dano', 'upg.name1': 'Velocidade de Ataque', 'upg.name2': 'Velocidade', 'upg.name3': 'Defesa',
    'upg.name4': 'Estabilidade', 'upg.name5': 'Vitalidade', 'upg.name6': 'Chance Crítica', 'upg.name7': 'Colheita de Almas',
    'upg.desc0': 'A cada dois níveis, seus disparos causam +1 de dano.',
    'upg.desc1': 'Cada nível reduz em 5% o tempo entre os seus disparos.',
    'upg.desc2': 'Cada nível faz você correr 10% mais rápido.',
    'upg.desc3': 'Cada nível adiciona 1 de armadura: cada golpe recebido causa 1% menos dano.',
    'upg.desc4': 'Cada nível permite que cada disparo seu anule mais um projétil inimigo.',
    'upg.desc5': 'Cada nível adiciona 5 de vida máxima.',
    'upg.desc6': 'Cada nível adiciona 2% de chance de acerto crítico.',
    'upg.desc7': 'Cada nível adiciona 1% de chance de um inimigo derrotado deixar uma alma.',
    'upg.level': 'Nível {0} / {1}',
    'upg.max': 'Máximo',
    'upg.pick': 'Escolha uma melhoria para ver o que ela faz e quanto custa.',
    'upg.unavailable': 'As melhorias ainda não estão disponíveis.',
    'over.notRanked': 'O Fedora foi usado, então esta partida não entra no ranking.',
    'over.empty': 'Nenhum recorde ainda.',
  });

  // ---------------------------------------------------------------- small helpers
  const has = (o, m) => !!o && !o._destroyed && typeof o[m] === 'function';
  function safeCall(where, fn) {
    try { return fn(); } catch (e) { U.reportError(e, null, where); return undefined; }
  }
  function waveNumber() {
    const w = SLS.Game.waveManager;
    return w && typeof w.wave_number === 'number' ? w.wave_number : 0;
  }
  function souls() {
    const p = SLS.Game.progression;
    return p && typeof p.soul_orbs === 'number' ? p.soul_orbs : 0;
  }
  const isGamepad = () => U.Input.lastDevice === 'gamepad';
  function playerDead() {
    const ps = SLS.Game.playerStats;
    return waveNumber() > 0 && !!ps && (ps._destroyed || ps.isAlive === false);
  }
  function removeScreen(s) {
    const i = UI.stack.indexOf(s);
    if (i < 0) return false;
    if (i === UI.stack.length - 1) UI.pop();
    else { UI.stack.splice(i, 1); s.exit(); }
    return true;
  }
  function removeScreenAndAbove(s) {
    const i = UI.stack.indexOf(s);
    if (i < 0) return;
    while (UI.stack.length > i) UI.pop();
  }

  // ---------------------------------------------------------------- item data (SLS.ItemDB with fallbacks)
  // SLS.T returns the key itself for a missing string: never show such a key as text
  const looksLikeKey = (s) => /^[\w-]+(\.[\w-]+)+$/.test(s);
  function optT(key, ...args) { const s = SLS.T(key, ...args); return s === key ? '' : s; }
  function textOf(db, fn) {
    if (!db) return '';
    const f = db[fn];
    let r = '';
    if (typeof f === 'function') {
      try { const v = f.call(db); r = v === undefined || v === null ? '' : String(v); } catch (e) { U.reportError(e, null, 'ItemDB.' + fn); return ''; }
    } else if (typeof f === 'string') r = f;
    return looksLikeKey(r) ? '' : r;
  }
  function itemInfo(id) {
    const base = SLS.item(id);
    let db = null;
    if (SLS.ItemDB && typeof SLS.ItemDB.get === 'function') {
      try { db = SLS.ItemDB.get(id) || null; } catch (e) { U.reportError(e, null, 'ItemDB.get'); }
    }
    if (!base && !db) return null;
    const rarity = db && typeof db.rarity === 'number' ? db.rarity : (base && typeof base.rarity === 'number' ? base.rarity : 0);
    const name = (db && db.name) || (base && base.name) || ('#' + id);
    const color = (db && typeof db.color === 'string' && db.color) || RARITY_COLORS[Mathf.Clamp(rarity, 0, 3)] || INK;
    return {
      id, rarity, name, color,
      group: (db && db.group) || (base && base.group) || 'cards',
      symbol: (db && db.symbol) || RARITY_SYMBOL[rarity] || 'star',
      iconColor: (db && typeof db.iconColor === 'string' && db.iconColor) || color,
      nameColor: (db && typeof db.nameColor === 'string' && db.nameColor) || color,
      desc: () => textOf(db, 'desc'),
      fullDesc: () => textOf(db, 'fullDesc') || textOf(db, 'desc'),
      howToGet: () => textOf(db, 'howToGet'),
    };
  }

  // ---------------------------------------------------------------- drawing helpers
  function diamond(ctx, x, y, r, fill) {
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }
  function orbGlyph(ctx, x, y, r) {
    U.Render.drawGlow(ctx, x, y, r * 2.4, SOUL, 0.55);
    ctx.save();
    ctx.fillStyle = '#eef9ff';
    ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, TAU); ctx.fill();
    ctx.strokeStyle = SOUL; ctx.lineWidth = Math.max(1.5, r * 0.22);
    ctx.beginPath(); ctx.arc(x, y, r * 0.88, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  // souls currency icon: the original's 'Souls' sprite (SLS.Art.soulIcon, items.js) like the HUD and
  // the shop, at the HUD's size (40 px for a 15 px orb); the drawn orb while it is not loaded
  function soulGlyph(ctx, x, y, r) {
    if (!SLS.Art.soulIcon || !SLS.Art.soulIcon(ctx, x, y, r * 8 / 3)) orbGlyph(ctx, x, y, r);
  }
  function soulBadge(ctx, x, y, n, align, size, color) {
    size = size || 30;
    const s = String(n);
    ctx.save(); ctx.font = UI.font(size, { bold: true }); const tw = ctx.measureText(s).width; ctx.restore();
    const total = size + 10 + tw;
    const x0 = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
    soulGlyph(ctx, x0 + size / 2, y, size * 0.48);
    UI.text(ctx, s, x0 + size + 10, y + 1, { size, baseline: 'middle', bold: true, color: color || '#d8efff', outline: 'rgba(0,10,30,0.8)', outlineWidth: 4 });
  }
  function lockGlyph(ctx, x, y, s, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = s * 0.16;
    ctx.beginPath(); ctx.arc(x, y - s * 0.12, s * 0.28, Math.PI, 0); ctx.stroke();
    UI.roundRect(ctx, x - s * 0.42, y - s * 0.12, s * 0.84, s * 0.62, s * 0.1); ctx.fill();
    ctx.fillStyle = 'rgba(20,10,30,0.85)';
    ctx.beginPath(); ctx.arc(x, y + s * 0.14, s * 0.09, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function twinkle(ctx, x, y, r, a) {
    if (a <= 0.01) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = '#fff6dc';
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
    ctx.restore();
  }
  // ornamented panel used by every window
  function frame(ctx, x, y, w, h) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
    UI.roundRect(ctx, x, y, w, h, 22);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(36,24,60,0.96)'); g.addColorStop(1, 'rgba(14,10,28,0.97)');
    ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.lineWidth = 3; ctx.strokeStyle = GOLD_DIM; ctx.stroke();
    UI.roundRect(ctx, x + 9, y + 9, w - 18, h - 18, 15);
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,220,150,0.22)'; ctx.stroke();
    for (const [cx, cy] of [[x + 9, y + 9], [x + w - 9, y + 9], [x + 9, y + h - 9], [x + w - 9, y + h - 9]]) diamond(ctx, cx, cy, 7, GOLD);
    ctx.restore();
  }
  // window title with small winged rules on both sides
  function heading(ctx, text, cx, y, size) {
    size = size || 50;
    ctx.save(); ctx.font = UI.font(size, { bold: true, font: UI.FONT_TITLE }); const w = Math.min(ctx.measureText(text).width, 1100); ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(255,211,107,0.7)'; ctx.lineWidth = 2;
    for (const s of [-1, 1]) {
      const x0 = cx + s * (w / 2 + 20), x1 = x0 + s * 86;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0 + s * 14, y - 7); ctx.lineTo(x0 + s * 52, y - 7); ctx.stroke();
      diamond(ctx, x1 + s * 8, y, 6, GOLD);
      diamond(ctx, x0, y, 3.5, GOLD);
    }
    ctx.restore();
    UI.text(ctx, text, cx, y, { size, align: 'center', baseline: 'middle', font: UI.FONT_TITLE, bold: true, color: GOLD,
      outline: 'rgba(20,8,30,0.85)', outlineWidth: 5, shadow: 'rgba(255,190,80,0.4)', shadowBlur: 16, fitWidth: 1100 });
  }
  // a text line where [tokens] are drawn as key caps
  function drawKeys(ctx, str, x, y, size) {
    size = size || 24;
    const parts = [];
    const re = /\[([^\]]+)\]/g;
    let m, last = 0;
    while ((m = re.exec(str))) {
      if (m.index > last) parts.push({ text: str.slice(last, m.index) });
      parts.push({ text: m[1], cap: true });
      last = re.lastIndex;
    }
    if (last < str.length) parts.push({ text: str.slice(last) });
    ctx.save();
    ctx.font = UI.font(size, { bold: true });
    ctx.textBaseline = 'middle';
    let cx = x;
    for (const p of parts) {
      const tw = ctx.measureText(p.text).width;
      if (p.cap) {
        const w = tw + 26, h = size + 16;
        UI.roundRect(ctx, cx, y - h / 2, w, h, 8);
        ctx.fillStyle = 'rgba(255,236,190,0.1)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = GOLD_DIM; ctx.stroke();
        ctx.fillStyle = 'rgba(255,211,107,0.35)'; ctx.fillRect(cx + 6, y + h / 2 - 4, w - 12, 2);
        ctx.fillStyle = GOLD; ctx.textAlign = 'center';
        ctx.fillText(p.text, cx + w / 2, y + 1);
        cx += w;
      } else {
        ctx.fillStyle = INK; ctx.textAlign = 'left';
        ctx.fillText(p.text, cx, y + 1);
        cx += tw;
      }
    }
    ctx.restore();
  }
  // the seraph with a hat and a staff, drawn with SLS.Art (world units, y up) at UI scale
  function drawSeraph(ctx, x, y, scale, hatId, staffId, t, hatAlpha, staffAlpha) {
    const A = SLS.Art;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, -scale);
    A.player(ctx, { t, walk: 0, air: false, hurt: 0, alive: true, facing: 1 });
    if (hatId !== null && hatId !== undefined) {
      ctx.save(); ctx.globalAlpha *= hatAlpha === undefined ? 1 : hatAlpha; A.hat(ctx, hatId, { t }); ctx.restore();
    }
    if (staffId !== null && staffId !== undefined) {
      ctx.save(); ctx.globalAlpha *= staffAlpha === undefined ? 1 : staffAlpha;
      ctx.translate(0.15, 0.0); ctx.rotate(0.95); A.staff(ctx, staffId, { t });
      ctx.restore();
    }
    ctx.restore();
  }
  function unknownIcon(ctx, x, y, size) {
    ctx.save();
    ctx.strokeStyle = '#7c7490'; ctx.lineWidth = Math.max(2, size * 0.06); ctx.setLineDash([size * 0.12, size * 0.08]);
    ctx.beginPath(); ctx.arc(x, y, size * 0.42, 0, TAU); ctx.stroke();
    ctx.restore();
    UI.text(ctx, '?', x, y + 2, { size: size * 0.6, align: 'center', baseline: 'middle', bold: true, font: UI.FONT_TITLE, color: '#9a92b0' });
  }

  // ---------------------------------------------------------------- widgets
  // Core.BetterButton: Button.OnPointerClick / OnSubmit run onClick only while the button is
  // interactable, then the click sound plays either way. Widgets that were Core.BetterToggle or
  // BetterDropdown in the original pass sound: null (they only have the gamepad select sound).
  class BetterButton extends UI.Button {
    click() {
      if (this.enabled && this.onClick) {
        try { this.onClick(this); } catch (e) { U.reportError(e, null, 'button ' + this.label); }
      }
      if (this.sound !== null) U.Audio.play(this.sound || 'uiClick');
    }
  }
  // Core.ComplementaryButton (the hat / staff picker arrows). With a gamepad, gaining the focus
  // invokes onClick at once (no click sound), and on the next frame the focus goes back to the main
  // button (the arrow's "Select On Up": the hat or staff button). The arrows stay interactable,
  // since SelectHatWithIndex / SelectStaffWithIndex clamp. With the mouse or the keyboard they act
  // as plain buttons (remake: the original's bounce would leave the keyboard no way to press them).
  class ComplementaryButton extends BetterButton {
    constructor(props) {
      super(props);
      this.isSelected = false;
      this.selectedFrame = -1;
    }
    onSelect() {
      if (UI.pointerMode || !isGamepad()) return;
      this.isSelected = true;
      this.selectedFrame = U.Time.frameCount;
      if (this.onClick) { try { this.onClick(this); } catch (e) { U.reportError(e, null, 'ComplementaryButton.OnSelect'); } }
    }
    update(dt, selected) {
      super.update(dt, selected);
      if (!this.isSelected || U.Time.frameCount === this.selectedFrame) return;
      this.isSelected = false;
      const scr = this.screen, main = this.mainButton;
      if (scr && main && main.visible) scr.select(main, true);
    }
  }
  // Button whose label/enabled/visible can be live (follow the language and the game state)
  function makeButton(props, Cls) {
    const b = new (Cls || BetterButton)(Object.assign({ size: 30, drawCustom: drawFancyButton }, props));
    if (props.labelKey) Object.defineProperty(b, 'label', { get: () => T(props.labelKey), configurable: true });
    if (props.labelFn) Object.defineProperty(b, 'label', { get: props.labelFn, configurable: true });
    if (props.enabledFn) Object.defineProperty(b, 'enabled', { get: props.enabledFn, set() {}, configurable: true });
    if (props.visibleFn) Object.defineProperty(b, 'visible', { get: props.visibleFn, set() {}, configurable: true });
    return b;
  }
  function drawFancyButton(ctx, b) {
    const t = b.hoverT, en = b.enabled;
    ctx.save();
    const s = 1 + 0.04 * t;
    ctx.translate(b.cx, b.cy); ctx.scale(s, s); ctx.translate(-b.cx, -b.cy);
    const r = Math.min(16, b.h / 2);
    UI.roundRect(ctx, b.x, b.y, b.w, b.h, r);
    const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
    if (!en) { g.addColorStop(0, 'rgba(50,46,60,0.92)'); g.addColorStop(1, 'rgba(30,28,38,0.92)'); }
    else if (b.primary) { g.addColorStop(0, t > 0.01 ? '#7a5618' : '#5a3e12'); g.addColorStop(1, t > 0.01 ? '#47300a' : '#2e1f08'); }
    else if (b.danger) { g.addColorStop(0, t > 0.01 ? 'rgba(130,40,48,0.97)' : 'rgba(84,26,36,0.95)'); g.addColorStop(1, t > 0.01 ? 'rgba(80,20,30,0.97)' : 'rgba(44,14,22,0.95)'); }
    else { g.addColorStop(0, t > 0.01 ? 'rgba(88,62,134,0.97)' : 'rgba(48,34,76,0.95)'); g.addColorStop(1, t > 0.01 ? 'rgba(52,34,86,0.97)' : 'rgba(26,18,44,0.95)'); }
    ctx.fillStyle = g;
    if (t > 0.01 && en) { ctx.shadowColor = b.danger ? 'rgba(255,110,90,0.8)' : 'rgba(255,211,107,0.85)'; ctx.shadowBlur = 24 * t; }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = !en ? '#5a5566' : b.danger ? '#ff9a88' : (b.primary || t > 0.01 ? GOLD : GOLD_DIM);
    ctx.stroke();
    UI.roundRect(ctx, b.x + 5, b.y + 5, b.w - 10, b.h - 10, Math.max(4, r - 5));
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,230,170,' + (0.1 + 0.25 * t) + ')'; ctx.stroke();
    if (t > 0.01 && en) { diamond(ctx, b.x + 20, b.cy, 6 * t, GOLD); diamond(ctx, b.x + b.w - 20, b.cy, 6 * t, GOLD); }
    const price = b.priceFn ? b.priceFn() : null;
    const color = !en ? '#8a8494' : b.primary ? '#ffe8a8' : b.danger ? '#ffd6ce' : INK;
    if (price !== null && price !== undefined) {
      const lx = b.x + (b.w - 120) / 2 + 12;
      UI.text(ctx, b.label, lx, b.cy + 1, { size: b.size || 30, align: 'center', baseline: 'middle', font: UI.FONT_TITLE, bold: true,
        color, fitWidth: b.w - 170, outline: 'rgba(0,0,0,0.5)', outlineWidth: 3 });
      soulGlyph(ctx, b.x + b.w - 112, b.cy, 13);
      const priceOk = b.priceOkFn ? b.priceOkFn() : souls() >= price;
      UI.text(ctx, String(price), b.x + b.w - 92, b.cy + 1, { size: 28, baseline: 'middle', bold: true,
        color: priceOk ? '#d8efff' : RED, outline: 'rgba(0,0,0,0.6)', outlineWidth: 4 });
    } else if (b.label) {
      UI.text(ctx, b.label, b.cx, b.cy + 1, { size: b.size || 30, align: 'center', baseline: 'middle', font: UI.FONT_TITLE, bold: true,
        color, fitWidth: b.w - 64, outline: 'rgba(0,0,0,0.5)', outlineWidth: 3 });
    }
    ctx.restore();
  }
  function drawChoice(ctx, b) {
    const on = b.isActive ? !!b.isActive() : false, t = b.hoverT;
    ctx.save();
    UI.roundRect(ctx, b.x, b.y, b.w, b.h, 14);
    ctx.fillStyle = on ? 'rgba(112,80,22,0.95)' : (t > 0.01 ? 'rgba(72,52,112,0.95)' : 'rgba(32,24,52,0.92)');
    if (t > 0.01) { ctx.shadowColor = 'rgba(255,211,107,0.8)'; ctx.shadowBlur = 18 * t; }
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = on ? 3 : 2; ctx.strokeStyle = on || t > 0.01 ? GOLD : GOLD_DIM; ctx.stroke();
    if (on) diamond(ctx, b.x + 20, b.cy, 6, GOLD);
    UI.text(ctx, b.label, b.cx + (on ? 8 : 0), b.cy + 1, { size: b.size || 26, align: 'center', baseline: 'middle', bold: true,
      font: UI.FONT_TITLE, color: on ? '#ffe8a8' : INK, fitWidth: b.w - 50 });
    ctx.restore();
  }
  function drawToggle(ctx, b) {
    const en = b.enabled, on = en && !!b.isOn(), t = b.hoverT;
    const pw = 92, ph = 40, px = b.x, py = b.y + (b.h - ph) / 2;
    ctx.save();
    if (t > 0.01 && en) { ctx.shadowColor = 'rgba(255,211,107,0.8)'; ctx.shadowBlur = 18 * t; }
    UI.roundRect(ctx, px, py, pw, ph, ph / 2);
    ctx.fillStyle = !en ? 'rgba(50,46,60,0.9)' : on ? 'rgba(124,90,22,0.96)' : 'rgba(30,22,48,0.95)';
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = 2.5; ctx.strokeStyle = !en ? '#5a5566' : (t > 0.01 ? GOLD : GOLD_DIM); ctx.stroke();
    const kx = px + (on ? pw - ph / 2 : ph / 2);
    ctx.beginPath(); ctx.arc(kx, py + ph / 2, ph / 2 - 6, 0, TAU);
    ctx.fillStyle = !en ? '#5a5566' : on ? GOLD : '#9a90b0'; ctx.fill();
    ctx.restore();
    UI.text(ctx, !en ? T('options.unavailable') : T(on ? 'options.on' : 'options.off'), px + pw + 18, b.cy + 1,
      { size: 24, baseline: 'middle', bold: true, color: on ? GOLD : INK_DIM });
  }
  function drawSwatch(ctx, b) {
    const on = !!b.isActive(), t = b.hoverT;
    ctx.save();
    UI.roundRect(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.fillStyle = 'rgba(20,14,36,0.95)';
    if (t > 0.01 || on) { ctx.shadowColor = b.swatch; ctx.shadowBlur = on ? 16 : 14 * t; }
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = on ? 3.5 : 2; ctx.strokeStyle = on || t > 0.01 ? GOLD : GOLD_DIM; ctx.stroke();
    ctx.translate(b.cx, b.cy);
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, TAU);
    ctx.moveTo(-18, 0); ctx.lineTo(-6, 0); ctx.moveTo(18, 0); ctx.lineTo(6, 0);
    ctx.moveTo(0, -18); ctx.lineTo(0, -6); ctx.moveTo(0, 18); ctx.lineTo(0, 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = b.swatch; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }
  function drawArrow(ctx, b) {
    const t = b.hoverT, en = b.enabled;
    ctx.save();
    ctx.beginPath(); ctx.arc(b.cx, b.cy, b.w / 2 - 2, 0, TAU);
    ctx.fillStyle = t > 0.01 && en ? 'rgba(84,60,124,0.96)' : 'rgba(34,24,56,0.94)';
    if (t > 0.01 && en) { ctx.shadowColor = 'rgba(255,211,107,0.8)'; ctx.shadowBlur = 18 * t; }
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = 2.5; ctx.strokeStyle = en ? (t > 0.01 ? GOLD : GOLD_DIM) : '#4a4458'; ctx.stroke();
    const d = b.dir, s = b.w * 0.2;
    ctx.beginPath();
    ctx.moveTo(b.cx + d * s * 0.9, b.cy); ctx.lineTo(b.cx - d * s * 0.6, b.cy - s); ctx.lineTo(b.cx - d * s * 0.6, b.cy + s);
    ctx.closePath();
    ctx.fillStyle = en ? GOLD : '#5a5468'; ctx.fill();
    ctx.restore();
  }
  // the hat / staff button of the picker (the arrows' main button): the name is drawn by the title
  // screen; this only outlines it while it has the keyboard / gamepad focus
  function drawPlate(ctx, b) {
    const t = b.hoverT;
    if (t <= 0.01 || UI.pointerMode) return;
    ctx.save();
    ctx.globalAlpha *= t;
    UI.roundRect(ctx, b.x, b.y, b.w, b.h, 14);
    ctx.shadowColor = 'rgba(255,211,107,0.8)'; ctx.shadowBlur = 18;
    ctx.lineWidth = 2.5; ctx.strokeStyle = GOLD; ctx.stroke();
    ctx.restore();
  }

  // volume slider (UnityEngine.UI.Slider + Core.BetterSlider): dragging sets the value continuously;
  // left/right with keyboard or gamepad move it by Slider.stepSize = (max - min) * 0.1, in float32
  // like Unity. No sound of its own: BetterSlider only plays the select sound on gamepad focus.
  class Slider extends UI.Element {
    constructor(props) {
      super(Object.assign({ selectable: true, min: 0, max: 1, hoverT: 0, dragging: false }, props));
    }
    get value() { return this.read(); }
    get stepSize() { return Math.fround((this.max - this.min) * Math.fround(0.1)); }
    get trackX() { return this.x + 14; }
    get trackW() { return this.w - 120; }
    setValue(v) {
      v = Math.fround(Mathf.Clamp(v, this.min, this.max));
      if (v !== this.read()) this.write(v);
    }
    click() { this.dragging = true; this.fromMouse(); }
    fromMouse() {
      const t = Mathf.Clamp01((U.Input.mouse.x - this.trackX) / this.trackW);
      this.setValue(this.min + t * (this.max - this.min));
    }
    // Slider.OnMove: Set(value -/+ stepSize)
    nudge(dir) {
      this.setValue(Math.fround(Math.fround(this.read()) + (dir > 0 ? this.stepSize : -this.stepSize)));
      if (this.onRelease) this.onRelease();
    }
    update(dt, selected) {
      this.hoverT = Mathf.MoveTowards(this.hoverT, selected ? 1 : 0, dt * 8);
      if (this.dragging) {
        if (U.Input.mouse.buttons.has(0)) this.fromMouse();
        else { this.dragging = false; if (this.onRelease) this.onRelease(); }
      }
    }
    draw(ctx) {
      const f = Mathf.Clamp01((this.read() - this.min) / (this.max - this.min)), t = this.hoverT;
      const x = this.trackX, w = this.trackW, cy = this.cy;
      ctx.save();
      UI.roundRect(ctx, x, cy - 6, w, 12, 6);
      ctx.fillStyle = 'rgba(10,6,22,0.9)'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = GOLD_DIM; ctx.stroke();
      if (f > 0) {
        UI.roundRect(ctx, x, cy - 6, Math.max(12, w * f), 12, 6);
        const g = ctx.createLinearGradient(x, 0, x + w, 0);
        g.addColorStop(0, '#a8792a'); g.addColorStop(1, GOLD);
        ctx.fillStyle = g; ctx.fill();
      }
      const kx = x + w * f;
      if (t > 0.01) { ctx.shadowColor = 'rgba(255,211,107,0.9)'; ctx.shadowBlur = 22 * t; }
      ctx.beginPath(); ctx.arc(kx, cy, 14 + 3 * t, 0, TAU);
      ctx.fillStyle = '#fff1c8'; ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 3; ctx.strokeStyle = t > 0.01 ? GOLD : '#a8792a'; ctx.stroke();
      ctx.restore();
      UI.text(ctx, Math.round(f * 100) + '%', this.x + this.w - 4, cy + 1, { size: 24, align: 'right', baseline: 'middle', bold: true,
        color: t > 0.01 ? GOLD : INK });
    }
  }

  // ---------------------------------------------------------------- Options (Options : Core.Window semantics)
  // Saved keys and defaults as in Options.SaveOptions / LoadOptions: language (index into the
  // available languages; default = the browser language, like Unity Localization's startup locale),
  // sfx_volume and music_volume (0..1, default 1), screen_resolution (kept for parity; the browser
  // sizes the canvas), fullscreen (default true, as in LoadResolution: browsers need a user gesture,
  // so a saved or first-launch fullscreen is requested on the first click / key press), mouse_color
  // (0..3: white, green, yellow, cyan) and particles_enabled (default true).
  let unloading = false;
  window.addEventListener('pagehide', () => { unloading = true; });
  window.addEventListener('beforeunload', () => { unloading = true; });
  function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function fsSupported() {
    const el = document.documentElement;
    return !!(el.requestFullscreen || el.webkitRequestFullscreen) && document.fullscreenEnabled !== false;
  }
  function requestFs() {
    const el = document.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!f) return;
    try { const p = f.call(el); if (p && typeof p.catch === 'function') p.catch(() => { /* refused: no user gesture */ }); } catch (e) { /* refused */ }
  }
  function exitFs() {
    const f = document.exitFullscreen || document.webkitExitFullscreen;
    if (!f || !fsElement()) return;
    try { const p = f.call(document); if (p && typeof p.catch === 'function') p.catch(() => {}); } catch (e) { /* ignore */ }
  }
  function defaultLanguageIndex() {
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    const i = SLS.languages.findIndex((l) => l.code === String(nav).toLowerCase().slice(0, 2));
    return i >= 0 ? i : 0;
  }
  const vol = (v) => { const n = Number(v); return Number.isFinite(n) ? Mathf.Clamp01(n) : 1; };

  const Options = SLS.Options = {
    sfx_volume: 1, music_volume: 1, screen_resolution: 0, fullscreen: true, mouse_color: 0, particles_enabled: true,
    // Options.GetLanguage also calls PlayerStats.ReselectHat()/ReselectStaff() (to refresh the
    // localized hat/staff texts). In the original that also re-applies the hat/staff stats, even
    // mid-run. Set to false to skip the call.
    reselectOnLanguageChange: true,
    get ParticlesActivated() { return U.Render.particlesEnabled; },     // Options.ParticlesActivated
    set ParticlesActivated(v) { U.Render.particlesEnabled = !!v; },
    languageIndex() { return Math.max(0, SLS.languages.findIndex((l) => l.code === SLS.Lang.current)); },
    LoadOptions() {
      // LoadLanguage
      const def = defaultLanguageIndex();
      let li = SLS.Save.GetValue('language', def);
      if (!Number.isInteger(li) || li < 0 || li >= SLS.languages.length) li = def;
      SLS.setLanguage(SLS.languages[li].code);
      // LoadVolumes + ChangeVolume
      this.sfx_volume = vol(SLS.Save.GetValue('sfx_volume', 1));
      this.music_volume = vol(SLS.Save.GetValue('music_volume', 1));
      this.ChangeVolume();
      // LoadResolution
      this.screen_resolution = Mathf.Clamp(SLS.Save.GetValue('screen_resolution', 0) | 0, 0, 3);
      this.fullscreen = SLS.Save.GetValue('fullscreen', true) !== false;
      // LoadCursor
      const mc = SLS.Save.GetValue('mouse_color', 0) | 0;
      this.mouse_color = mc >= 0 && mc < CURSOR_COLORS.length ? mc : 0;
      setCursor(this.mouse_color);
      // LoadParticles
      this.particles_enabled = SLS.Save.GetValue('particles_enabled', true) !== false;
      U.Render.particlesEnabled = this.particles_enabled;
    },
    SaveOptions() {
      const S = SLS.Save;
      S.SetValue('language', this.languageIndex());
      S.SetValue('sfx_volume', this.sfx_volume);
      S.SetValue('music_volume', this.music_volume);
      S.SetValue('screen_resolution', this.screen_resolution);
      S.SetValue('fullscreen', this.fullscreen);
      S.SetValue('mouse_color', this.mouse_color);
      S.SetValue('particles_enabled', this.particles_enabled);
    },
    // Options.ChangeVolume routed the sliders to the AudioSources every frame; here they go to the mixer
    ChangeVolume() { U.Audio.setVolumes(this.sfx_volume, this.music_volume); },
    SetVolumes(sfx, music) { this.sfx_volume = vol(sfx); this.music_volume = vol(music); this.ChangeVolume(); },
    // flips the real state like Screen.fullScreen = !Screen.fullScreen; the change event saves it
    ToggleFullScreen() {
      if (!fsSupported()) return;
      if (fsElement()) exitFs(); else requestFs();
    },
    GetLanguage(value) {
      const lang = SLS.languages[value];
      if (!lang) return;
      SLS.setLanguage(lang.code);
      const ps = SLS.Game.playerStats;
      if (this.reselectOnLanguageChange && ps && !ps._destroyed) {
        if (has(ps, 'ReselectHat')) safeCall('PlayerStats.ReselectHat', () => ps.ReselectHat());
        if (has(ps, 'ReselectStaff')) safeCall('PlayerStats.ReselectStaff', () => ps.ReselectStaff());
      }
      this.SaveOptions();
    },
    ChangeCursorColor(value) {
      value |= 0;
      if (value < 0 || value >= CURSOR_COLORS.length) return;   // any other index does nothing
      this.mouse_color = value;
      setCursor(value);
      this.SaveOptions();
    },
    SetParticles(value) {
      this.particles_enabled = !!value;
      U.Render.particlesEnabled = !!value;
      SLS.Save.SetValue('particles_enabled', !!value);
      this.SaveOptions();
    },
  };
  // In the original, Esc is only Pause / Back and fullscreen changes through the Options toggle. A
  // browser uses Esc to leave fullscreen, so while fullscreen is on the Keyboard Lock API (where it
  // exists) keeps Esc for the game; holding Esc still leaves fullscreen.
  function lockEscape(on) {
    const kb = navigator.keyboard;
    if (!kb || typeof kb.lock !== 'function') return;
    try {
      if (on) { const p = kb.lock(['Escape']); if (p && typeof p.catch === 'function') p.catch(() => {}); } else kb.unlock();
    } catch (e) { /* not available here */ }
  }
  document.addEventListener('fullscreenchange', () => {
    lockEscape(!!fsElement());
    if (unloading) return;
    Options.fullscreen = !!fsElement();
    Options.SaveOptions();
  });
  // browsers only allow fullscreen after a user gesture: restore a saved "fullscreen" on the first one
  function armFullscreenRestore() {
    if (!Options.fullscreen || !fsSupported()) return;
    const go = (e) => {
      if (e.type === 'keydown' && e.key === 'Escape') return;
      window.removeEventListener('pointerdown', go, true);
      window.removeEventListener('keydown', go, true);
      if (!fsElement()) requestFs();
    };
    window.addEventListener('pointerdown', go, true);
    window.addEventListener('keydown', go, true);
  }
  // apply the language as early as Options.Awake did, so every module starts with it
  (function earlyLanguage() {
    const li = SLS.Save.GetValue('language', defaultLanguageIndex());
    const lang = SLS.languages[Number.isInteger(li) ? li : 0] || SLS.languages[0];
    SLS.setLanguage(lang.code);
  })();

  // ---------------------------------------------------------------- loadout (hat / staff picker over PlayerStats)
  const localSel = { hat: 0, staff: 0 };   // placeholder selection while PlayerStats is missing
  const Loadout = {
    field: (kind) => (kind === 'hats' ? 'hat' : 'staff'),
    items(kind) {
      const ids = (SLS.F.itemGroups && SLS.F.itemGroups[kind]) || SLS.F.items[kind].map((i) => i.id);
      return ids.map((id) => SLS.item(id)).filter(Boolean);
    },
    stats() { const ps = SLS.Game.playerStats; return ps && !ps._destroyed ? ps : null; },
    index(kind) {
      const ps = this.stats(), f = this.field(kind), n = this.items(kind).length;
      const v = ps && Number.isInteger(ps[f]) ? ps[f] : localSel[f];
      return Mathf.Clamp(v | 0, 0, Math.max(0, n - 1));
    },
    current(kind) { return this.items(kind)[this.index(kind)] || null; },
    unlocked(kind) {
      const ps = this.stats(), m = kind === 'hats' ? 'HasSelectedHat' : 'HasSelectedStaff';
      if (has(ps, m) && Number.isInteger(ps[this.field(kind)])) {
        const r = safeCall('PlayerStats.' + m, () => ps[m]());
        if (typeof r === 'boolean') return r;
      }
      const it = this.current(kind);
      return !!it && (it.price === 0 || !!SLS.Save.GetValue('i' + it.id + '_Unlocked', false));
    },
    step(kind, add) {
      const ps = this.stats(), m = kind === 'hats' ? 'SelectHat' : 'SelectStaff';
      if (has(ps, m)) safeCall('PlayerStats.' + m, () => ps[m](add));
      else { const f = this.field(kind); localSel[f] = Mathf.Clamp(this.index(kind) + add, 0, this.items(kind).length - 1); }
    },
    canUnlock(kind) {
      const it = this.current(kind), m = kind === 'hats' ? 'UnlockSelectedHat' : 'UnlockSelectedStaff';
      return !!it && has(this.stats(), m) && souls() >= it.price;
    },
    unlock(kind) {
      const ps = this.stats(), m = kind === 'hats' ? 'UnlockSelectedHat' : 'UnlockSelectedStaff';
      if (has(ps, m)) safeCall('PlayerStats.' + m, () => ps[m]());
    },
  };
  // the picker shows what SelectHatWithIndex / SelectStaffWithIndex write into hat_description /
  // staff_description (the player module's strings), falling back to the item database
  function loadoutDescription(kind, id) {
    const own = optT('player.' + (kind === 'hats' ? 'hat' : 'staff') + '.' + id + '.desc');
    if (own) return own;
    if (!SLS.ItemDB || typeof SLS.ItemDB.get !== 'function') return '';
    let db = null;
    try { db = SLS.ItemDB.get(id); } catch (e) { U.reportError(e, null, 'ItemDB.get'); }
    return textOf(db, 'desc');
  }

  // ---------------------------------------------------------------- Window: base of every menu screen
  class Window extends UI.Screen {
    constructor() {
      super();
      this.overlay = true;
      this.dim = 0.62;
      this.closable = true;
    }
    // Core.BetterButton.OnSelect: the select sound only plays in gamepad mode
    select(el, silent) {
      const changed = el !== this.selected;
      super.select(el, true);
      if (el && changed && !silent && isGamepad()) U.Audio.play('uiMove');
    }
    // Core.Window.CloseWindow: Back invokes the close button's onClick (no click sound), but only
    // 100 ms after the window opened. The title windows' close buttons also select the title button
    // again (EventSystem.SetSelectedGameObject), and its OnSelect plays the select sound with a gamepad.
    onCancel() {
      if (!this.closable || this.age < 0.1) return;
      this.close();
      if (isGamepad() && M.title && UI.top() === M.title && M.title.selected) U.Audio.play('uiMove');
    }
    close() { removeScreen(this); }
  }

  // ---------------------------------------------------------------- title menu
  class TitleScreen extends Window {
    constructor() {
      super();
      this.dim = 0;
      this.closable = false;
      const x = 170, w = 440, h = 70, gap = 86, y0 = 352;
      const entries = [
        ['menu.start', () => beginRun(), true],
        ['menu.howto', () => UI.push(new HowToPlayScreen())],
        ['menu.credits', () => UI.push(new CreditsScreen())],
        ['menu.encyclopedia', () => UI.push(new EncyclopediaScreen())],
        ['menu.upgrades', () => UI.push(new UpgradesScreen())],
        ['menu.options', () => UI.push(new OptionsScreen(false))],
        ['menu.exit', () => UI.push(new QuitScreen())],
      ];
      this.menu = entries.map(([key, fn, primary], i) => this.add(makeButton({
        x, y: y0 + i * gap, w, h, labelKey: key, onClick: fn, primary: !!primary, size: primary ? 36 : 30,
      })));
      this.defaultSelected = this.menu[0];
      this.exitBtn = this.menu[entries.length - 1];   // Title/ExitGame (the ExitGame component's button)
      // loadout picker
      const L = this.L = { x: 1090, y: 330, w: 700, h: 650 };
      this.blocks = { hats: L.y + 96, staffs: L.y + 380 };
      const sx = L.x + 330, sw = L.w - 360;
      const rows = this.rows = {};
      for (const kind of ['hats', 'staffs']) {
        const y0b = this.blocks[kind];
        // the hat / staff button ("Upgrades (2)" / "Upgrades (1)" in the scene): onClick unlocks the
        // selected item. It only takes the keyboard / gamepad focus; the mouse uses the Unlock button.
        const plate = this.add(makeButton({ x: sx + 62, y: y0b + 30, w: sw - 124, h: 56, label: '', drawCustom: drawPlate,
          onClick: () => Loadout.unlock(kind) }));
        plate.contains = () => false;
        const arrow = (dir) => this.add(makeButton({ x: dir < 0 ? sx : sx + sw - 56, y: y0b + 30, w: 56, h: 56, dir,
          drawCustom: drawArrow, label: '', screen: this, mainButton: plate, onClick: () => Loadout.step(kind, dir) }, ComplementaryButton));
        const prev = arrow(-1), next = arrow(1);
        const unlock = this.add(makeButton({ x: sx + sw / 2 - 135, y: y0b + 146, w: 270, h: 58, labelKey: 'menus.unlock', size: 26,
          priceFn: () => { const it = Loadout.current(kind); return it ? it.price : null; },
          visibleFn: () => !Loadout.unlocked(kind),
          enabledFn: () => Loadout.canUnlock(kind),
          onClick: () => Loadout.unlock(kind) }));
        rows[kind] = { plate, prev, next, unlock };
      }
      this.setNavigation();
    }
    // explicit navigation, as in the scene: left / right on the hat or staff button reach its arrows,
    // up / down go hat -> staff -> Begin; the menu reaches the picker with right
    setNavigation() {
      const { hats, staffs } = this.rows, menu = this.menu;
      const shown = (b) => (b.visible ? b : null);
      const menuNear = (b) => menu.reduce((best, m) => (Math.abs(m.cy - b.cy) < Math.abs(best.cy - b.cy) ? m : best), menu[0]);
      const split = (hats.plate.cy + staffs.plate.cy) / 2;
      for (const m of menu) m.nav = { right: m.cy < split ? hats.plate : staffs.plate };
      hats.plate.nav = { left: hats.prev, right: hats.next, up: null, down: () => shown(hats.unlock) || staffs.plate };
      staffs.plate.nav = { left: staffs.prev, right: staffs.next, up: () => shown(hats.unlock) || hats.plate,
        down: () => shown(staffs.unlock) || menu[0] };
      hats.unlock.nav = { up: hats.plate, down: staffs.plate, left: () => menuNear(hats.unlock), right: null };
      staffs.unlock.nav = { up: staffs.plate, down: menu[0], left: () => menuNear(staffs.unlock), right: null };
      hats.prev.nav = { left: () => menuNear(hats.prev), right: hats.plate, up: null, down: staffs.prev };
      hats.next.nav = { left: hats.plate, right: null, up: null, down: staffs.next };
      staffs.prev.nav = { left: () => menuNear(staffs.prev), right: staffs.plate, up: hats.prev, down: null };
      staffs.next.nav = { left: staffs.plate, right: null, up: hats.next, down: null };
    }
    // ExitGame.Update: J invokes the Quit button's onClick (no click sound)
    ExitGame() {
      const b = this.exitBtn;
      if (b && b.onClick) safeCall('ExitGame', () => b.onClick(b));
    }
    // ProgresisonManager.Start: with a gamepad, the button tagged "StartGame" gets the focus
    enter() { if (isGamepad()) this.select(this.menu[0], true); }
    onCancel() { /* the start menu is not a window: Back does nothing here */ }
    drawBack(ctx) {
      const t = UI.time;
      drawTitleArt(ctx, t);
      this.drawLoadout(ctx, t);
    }
    drawLoadout(ctx, t) {
      const L = this.L;
      frame(ctx, L.x, L.y, L.w, L.h);
      UI.text(ctx, T('menus.loadout'), L.x + 40, L.y + 48, { size: 34, baseline: 'middle', font: UI.FONT_TITLE, bold: true, color: GOLD,
        outline: 'rgba(0,0,0,0.5)', outlineWidth: 4 });
      soulBadge(ctx, L.x + L.w - 40, L.y + 48, souls(), 'right', 30);
      ctx.save(); ctx.strokeStyle = 'rgba(255,211,107,0.3)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(L.x + 30, L.y + 84); ctx.lineTo(L.x + L.w - 30, L.y + 84); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(L.x + 315, L.y + 104); ctx.lineTo(L.x + 315, L.y + L.h - 30); ctx.stroke();
      ctx.restore();
      // preview: the seraph wearing the selected hat and staff (faded while locked)
      const hat = Loadout.current('hats'), staff = Loadout.current('staffs');
      const hatOk = Loadout.unlocked('hats'), staffOk = Loadout.unlocked('staffs');
      const px = L.x + 160, py = L.y + 390;
      U.Render.drawGlow(ctx, px, py + 108, 150, 'rgba(255,214,150,1)', 0.25);
      ctx.save();
      ctx.fillStyle = 'rgba(255,220,160,0.12)'; ctx.strokeStyle = 'rgba(255,211,107,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(px, py + 112, 120, 22, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
      drawSeraph(ctx, px, py, 240, hat ? hat.id : null, staff ? staff.id : null, t, hatOk ? 1 : 0.32, staffOk ? 1 : 0.32);
      for (let i = 0; i < 6; i++) {
        const a = t * 0.5 + i * 1.7;
        twinkle(ctx, px + Math.cos(a) * 130, py - 40 + Math.sin(a * 1.3) * 120, 5, 0.3 + 0.3 * Math.sin(t * 2 + i));
      }
      this.drawSelector(ctx, 'hats', hat, hatOk, 'menus.hat');
      this.drawSelector(ctx, 'staffs', staff, staffOk, 'menus.staff');
    }
    drawSelector(ctx, kind, item, ok, labelKey) {
      const L = this.L, y0 = this.blocks[kind], sx = L.x + 330, sw = L.w - 360, cx = sx + sw / 2;
      UI.text(ctx, T(labelKey).toUpperCase(), cx, y0 + 8, { size: 19, align: 'center', baseline: 'middle', bold: true, color: GOLD_DIM });
      if (!item) return;
      if (!ok) lockGlyph(ctx, sx + 82, y0 + 58, 26, '#c9b9e0');
      UI.text(ctx, item.name, cx + (ok ? 0 : 12), y0 + 58, { size: 28, align: 'center', baseline: 'middle', bold: true, font: UI.FONT_TITLE,
        color: ok ? INK : '#c9b9e0', fitWidth: sw - 150 });
      const stats = kind === 'hats'
        ? T('menus.hatStats', item.jumpNumber, item.armor, item.speed)
        : T('menus.staffStats', item.attackSpeed);
      UI.text(ctx, stats, cx, y0 + 110, { size: 19, align: 'center', baseline: 'middle', color: INK_DIM, fitWidth: sw });
      if (ok) {
        // like SelectHatWithIndex: the description only shows for an unlocked item
        const d = loadoutDescription(kind, item.id);
        if (d) UI.text(ctx, d, cx, y0 + 136, { size: 19, align: 'center', color: INK, maxWidth: sw, fitHeight: 120, lineHeight: 1.22 });
      } else {
        UI.text(ctx, T('menus.lockedHint'), cx, y0 + 226, { size: 17, align: 'center', baseline: 'middle', color: INK_DIM, fitWidth: sw });
      }
    }
  }
  // a raised wing made of two layers of feathers fanning out from the root (side: 1 right, -1 left)
  function drawWing(ctx, x, y, size, side, t) {
    const flap = Math.sin(t * 1.6) * 0.05;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(side * size, size);
    for (let layer = 0; layer < 2; layer++) {
      const n = layer ? 5 : 7;
      for (let i = n - 1; i >= 0; i--) {
        const k = i / (n - 1);
        const a = -0.18 - k * 1.2 - flap * (1 - k);
        const len = (layer ? 0.46 : 0.78 + 0.26 * Math.sin(k * Math.PI)) * (1 - layer * 0.1 * k);
        const w = layer ? 0.12 : 0.1;
        ctx.save();
        ctx.rotate(a);
        const g = ctx.createLinearGradient(0, 0, len, 0);
        g.addColorStop(0, layer ? '#fffaf0' : '#fff3dc');
        g.addColorStop(1, layer ? 'rgba(255,246,226,0.95)' : 'rgba(240,226,196,0.9)');
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * 0.45, -w, len, -w * 0.15);
        ctx.quadraticCurveTo(len * 0.55, w * 0.55, 0, 0);
        ctx.closePath();
        ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 0.008; ctx.strokeStyle = 'rgba(201,162,74,0.9)'; ctx.stroke();
        // shaft
        ctx.beginPath(); ctx.moveTo(0.02, 0); ctx.quadraticCurveTo(len * 0.5, -w * 0.25, len * 0.92, -w * 0.15);
        ctx.lineWidth = 0.006; ctx.strokeStyle = 'rgba(201,162,74,0.55)'; ctx.stroke();
        ctx.restore();
      }
    }
    ctx.beginPath(); ctx.arc(0, 0, 0.05, 0, TAU); ctx.fillStyle = GOLD; ctx.fill();
    ctx.restore();
  }
  function drawTitleArt(ctx, t) {
    const cx = 960;
    const g = ctx.createLinearGradient(0, 0, 0, 1080);
    g.addColorStop(0, 'rgba(6,3,16,0.8)'); g.addColorStop(0.34, 'rgba(6,3,16,0.4)');
    g.addColorStop(0.7, 'rgba(6,3,16,0.25)'); g.addColorStop(1, 'rgba(6,3,16,0.62)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
    // halo
    const hy = 66 + Math.sin(t * 1.3) * 4;
    U.Render.drawGlow(ctx, cx, hy, 200, 'rgba(255,214,140,1)', 0.32);
    ctx.save();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 5; ctx.shadowColor = 'rgba(255,200,90,0.9)'; ctx.shadowBlur = 22;
    ctx.beginPath(); ctx.ellipse(cx, hy, 150, 20, 0, 0, TAU); ctx.stroke();
    ctx.restore();
    // feathered wings flanking the title
    for (const s of [-1, 1]) {
      const wx = cx + s * 540, wy = 196 + Math.sin(t * 1.6) * 4;
      U.Render.drawGlow(ctx, wx + s * 70, wy - 60, 170, 'rgba(255,240,205,1)', 0.15);
      drawWing(ctx, wx, wy, 190, s, t);
    }
    // title (set in text) + subtitle
    const ty = 164;
    const tg = ctx.createLinearGradient(0, ty - 55, 0, ty + 55);
    tg.addColorStop(0, '#fff7dc'); tg.addColorStop(0.5, '#ffd36b'); tg.addColorStop(1, '#c98a2a');
    UI.text(ctx, "Seraph's Last Stand", cx, ty, { size: 108, align: 'center', baseline: 'middle', font: UI.FONT_TITLE, bold: true,
      color: tg, outline: 'rgba(30,12,40,0.92)', outlineWidth: 9, shadow: 'rgba(255,190,90,0.55)', shadowBlur: 26, fitWidth: 1000 });
    ctx.save();
    ctx.strokeStyle = 'rgba(255,211,107,0.75)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 300, 240); ctx.lineTo(cx - 26, 240); ctx.moveTo(cx + 26, 240); ctx.lineTo(cx + 300, 240); ctx.stroke();
    ctx.restore();
    diamond(ctx, cx - 306, 240, 5, GOLD); diamond(ctx, cx + 306, 240, 5, GOLD);
    SLS.Art.icon(ctx, 'star', cx, 240, 30, GOLD);
    UI.text(ctx, T('title.subtitle'), cx, 280, { size: 34, align: 'center', baseline: 'middle', italic: true, font: UI.FONT_TITLE,
      color: '#efe2c4', outline: 'rgba(0,0,0,0.6)', outlineWidth: 4 });
    // twinkles around the title
    for (let i = 0; i < 12; i++) {
      const h1 = Math.sin(i * 91.7) * 43758.5453, h2 = Math.sin(i * 47.3) * 12543.123;
      const px = cx + ((h1 - Math.floor(h1)) - 0.5) * 1400, py = 40 + (h2 - Math.floor(h2)) * 260;
      twinkle(ctx, px, py, 4 + (i % 3) * 2, 0.5 + 0.5 * Math.sin(t * (1.2 + (i % 4) * 0.4) + i));
    }
  }

  // ---------------------------------------------------------------- Options window
  const OPTION_ROWS = ['options.sfx', 'options.music', 'options.particles', 'options.fullscreen', 'options.language', 'options.cursor'];
  class OptionsScreen extends Window {
    constructor(inRun) {
      super();
      this.inRun = !!inRun;
      const P = this.P = { x: 500, y: 130, w: 920, h: 820 };
      const cx = P.x + 360, cw = P.w - 360 - 60;
      const rowY = (i) => P.y + 170 + i * 92;
      this.sfx = this.add(new Slider({ x: cx, y: rowY(0) - 28, w: cw, h: 56,
        read: () => Options.sfx_volume, write: (v) => Options.SetVolumes(v, Options.music_volume), onRelease: () => Options.SaveOptions() }));
      this.music = this.add(new Slider({ x: cx, y: rowY(1) - 28, w: cw, h: 56,
        read: () => Options.music_volume, write: (v) => Options.SetVolumes(Options.sfx_volume, v), onRelease: () => Options.SaveOptions() }));
      // Particles / Fullscreen are Core.BetterToggles and Language / CursorColor Core.BetterDropdowns
      // in the scene: no click sound (sound: null)
      this.add(makeButton({ x: cx, y: rowY(2) - 28, w: 260, h: 56, drawCustom: drawToggle, label: '', sound: null,
        isOn: () => Options.particles_enabled, onClick: () => Options.SetParticles(!Options.particles_enabled) }));
      this.add(makeButton({ x: cx, y: rowY(3) - 28, w: 260, h: 56, drawCustom: drawToggle, label: '', sound: null,
        isOn: () => !!fsElement(), enabledFn: () => fsSupported(), onClick: () => Options.ToggleFullScreen() }));
      SLS.languages.forEach((l, i) => this.add(makeButton({ x: cx + i * 246, y: rowY(4) - 28, w: 232, h: 56, label: l.name, size: 25,
        sound: null, drawCustom: drawChoice, isActive: () => Options.languageIndex() === i, onClick: () => Options.GetLanguage(i) })));
      CURSOR_COLORS.forEach((c, i) => this.add(makeButton({ x: cx + i * 76, y: rowY(5) - 32, w: 64, h: 64, label: '', swatch: c,
        sound: null, drawCustom: drawSwatch, isActive: () => Options.mouse_color === i, onClick: () => Options.ChangeCursorColor(i) })));
      this.closeBtn = this.add(makeButton({ x: P.x + P.w / 2 - 170, y: P.y + P.h - 104, w: 340, h: 68,
        labelKey: this.inRun ? 'menu.back' : 'menu.close', onClick: () => this.close() }));
      this.defaultSelected = this.sfx;
    }
    onNavigate(nav) {
      if (nav.x && this.selected instanceof Slider) { this.selected.nudge(nav.x > 0 ? 1 : -1); return true; }
      return false;
    }
    exit() { Options.SaveOptions(); }
    drawBack(ctx) {
      const P = this.P;
      frame(ctx, P.x, P.y, P.w, P.h);
      heading(ctx, T('options.title'), P.x + P.w / 2, P.y + 66, 50);
      OPTION_ROWS.forEach((k, i) => UI.text(ctx, T(k), P.x + 70, P.y + 170 + i * 92, { size: 28, baseline: 'middle', bold: true,
        font: UI.FONT_TITLE, color: INK, fitWidth: 270 }));
      const mc = Options.mouse_color;
      UI.text(ctx, T('options.cursor' + mc), P.x + 360 + 4 * 76 + 14, P.y + 170 + 5 * 92, { size: 24, baseline: 'middle', bold: true,
        color: CURSOR_COLORS[mc] });
    }
  }

  // ---------------------------------------------------------------- How to Play (Core.HowToPlay)
  const HOWTO_ROWS = ['move', 'jump', 'aim', 'shoot', 'auto', 'pause', 'back'];
  class HowToPlayScreen extends Window {
    constructor() {
      super();
      const P = this.P = { x: 130, y: 80, w: 1660, h: 920 };
      this.mode = isGamepad() ? 'pad' : 'kbm';
      // ControllerChanged: swap the instructions live when the input device changes
      this.onDevice = (d) => { this.mode = d === 'gamepad' ? 'pad' : 'kbm'; };
      this.add(makeButton({ x: P.x + 80, y: P.y + 120, w: 340, h: 58, labelKey: 'howto.kbm', size: 25, drawCustom: drawChoice,
        isActive: () => this.mode === 'kbm', onClick: () => { this.mode = 'kbm'; } }));
      this.add(makeButton({ x: P.x + 440, y: P.y + 120, w: 340, h: 58, labelKey: 'howto.pad', size: 25, drawCustom: drawChoice,
        isActive: () => this.mode === 'pad', onClick: () => { this.mode = 'pad'; } }));
      this.back = this.add(makeButton({ x: P.x + 80, y: P.y + P.h - 100, w: 300, h: 66, labelKey: 'menu.back', onClick: () => this.close() }));
      this.defaultSelected = this.back;
    }
    enter() { U.Input.onDeviceChange.push(this.onDevice); }
    exit() { const a = U.Input.onDeviceChange, i = a.indexOf(this.onDevice); if (i >= 0) a.splice(i, 1); }
    drawBack(ctx) {
      const P = this.P;
      frame(ctx, P.x, P.y, P.w, P.h);
      heading(ctx, T('howto.title'), P.x + P.w / 2, P.y + 62, 50);
      let y = P.y + 246;
      for (const r of HOWTO_ROWS) {
        UI.text(ctx, T('howto.' + r), P.x + 90, y, { size: 25, baseline: 'middle', bold: true, color: INK_DIM, fitWidth: 300 });
        drawKeys(ctx, T('howto.' + this.mode + '.' + r), P.x + 410, y, 24);
        y += 64;
      }
      if (this.mode === 'pad') UI.text(ctx, T('howto.padNote'), P.x + 90, y - 8, { size: 19, color: INK_DIM, maxWidth: 720 });
      ctx.save(); ctx.strokeStyle = 'rgba(255,211,107,0.25)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(P.x + 860, P.y + 120); ctx.lineTo(P.x + 860, P.y + P.h - 50); ctx.stroke(); ctx.restore();
      const rx = P.x + 910, rw = P.w - 910 - 70;
      UI.text(ctx, T('howto.goalTitle'), rx, P.y + 124, { size: 32, font: UI.FONT_TITLE, bold: true, color: GOLD });
      let ty = P.y + 172;
      ty += UI.text(ctx, T('howto.goal'), rx, ty, { size: 23, color: INK, maxWidth: rw, lineHeight: 1.34 }) + 34;
      UI.text(ctx, T('howto.tipsTitle'), rx, ty, { size: 32, font: UI.FONT_TITLE, bold: true, color: GOLD });
      ty += 50;
      for (let i = 1; i <= 4; i++) {
        diamond(ctx, rx + 8, ty + 14, 6, GOLD);
        ty += UI.text(ctx, T('howto.tip' + i), rx + 28, ty, { size: 21, color: INK, maxWidth: rw - 28, lineHeight: 1.3 }) + 16;
      }
    }
  }

  // ---------------------------------------------------------------- Credits / Quit
  // AccessLink: EnterLink opens url_to_go (Application.OpenURL; here a new browser tab)
  class AccessLink {
    constructor(url_to_go) { this.url_to_go = url_to_go; }
    EnterLink() {
      try { window.open(this.url_to_go, '_blank', 'noopener'); } catch (e) { /* blocked by the browser */ }
    }
  }
  // the scene's two credit links (Credits/Holder/Text (1)/Games and Text (2)/Games)
  const CREDIT_LINKS = [['credits.link1', 'https://oddgiant.itch.io/'], ['credits.link2', 'https://galactspace.itch.io/']];
  class CreditsScreen extends Window {
    constructor() {
      super();
      const P = this.P = { x: 430, y: 110, w: 1060, h: 860 };
      const lw = 440, gap = 30, lx = P.x + (P.w - 2 * lw - gap) / 2;
      this.links = CREDIT_LINKS.map(([key, url], i) => {
        const link = new AccessLink(url);
        return this.add(makeButton({ x: lx + i * (lw + gap), y: P.y + P.h - 196, w: lw, h: 60, labelKey: key, size: 24,
          onClick: () => link.EnterLink() }));
      });
      this.back = this.add(makeButton({ x: P.x + P.w / 2 - 160, y: P.y + P.h - 104, w: 320, h: 66, labelKey: 'menu.back', onClick: () => this.close() }));
      this.defaultSelected = this.back;
    }
    drawBack(ctx) {
      const P = this.P, t = UI.time, cx = P.x + P.w / 2;
      frame(ctx, P.x, P.y, P.w, P.h);
      heading(ctx, T('credits.title'), cx, P.y + 66, 50);
      U.Render.drawGlow(ctx, cx, P.y + 230, 130, 'rgba(255,214,150,1)', 0.25);
      drawSeraph(ctx, cx, P.y + 250, 170, 200, 300, t);
      let y = P.y + 380;
      for (const k of ['credits.line1', 'credits.line2']) {
        y += UI.text(ctx, T(k), cx, y, { size: 27, align: 'center', color: INK, maxWidth: P.w - 140, lineHeight: 1.32 }) + 26;
      }
      UI.text(ctx, T('credits.thanks'), cx, y + 24, { size: 30, align: 'center', baseline: 'middle', italic: true, font: UI.FONT_TITLE, color: GOLD });
    }
  }
  class QuitScreen extends Window {
    constructor() {
      super();
      const P = this.P = { x: 510, y: 230, w: 900, h: 620 };
      this.back = this.add(makeButton({ x: P.x + P.w / 2 - 160, y: P.y + P.h - 104, w: 320, h: 66, labelKey: 'menu.back', onClick: () => this.close() }));
      this.defaultSelected = this.back;
    }
    drawBack(ctx) {
      const P = this.P, t = UI.time, cx = P.x + P.w / 2;
      frame(ctx, P.x, P.y, P.w, P.h);
      heading(ctx, T('quit.title'), cx, P.y + 66, 48);
      U.Render.drawGlow(ctx, cx, P.y + 200, 110, 'rgba(255,214,150,1)', 0.22);
      drawSeraph(ctx, cx, P.y + 215, 140, 200, 300, t);
      UI.text(ctx, T('quit.body'), cx, P.y + 330, { size: 26, align: 'center', color: INK, maxWidth: P.w - 140, lineHeight: 1.34 });
    }
  }

  // ---------------------------------------------------------------- Encyclopedia (EncyclopediaManager + EncCard)
  function encyclopediaEntries() {
    const ids = (SLS.F.itemGroups && SLS.F.itemGroups.cards) || SLS.F.items.cards.map((c) => c.id);
    const out = [];
    for (const id of ids) {
      const info = itemInfo(id);
      if (!info) continue;
      // EncCard.Setup: rarity 0..2 always revealed; above that only once i{id}_Unlocked is saved
      info.hidden = info.rarity > 2 && !SLS.Save.GetValue('i' + id + '_Unlocked', false);
      out.push(info);
    }
    return out;
  }
  class EncTile extends UI.Button {
    constructor(screen, entry, cx0, cy0, w, h) {
      super({ x: 0, y: 0, w, h, label: '' });
      this.screen = screen; this.entry = entry; this.cx0 = cx0; this.cy0 = cy0;
    }
    contains(px, py) {
      const v = this.screen.view;
      return super.contains(px, py) && px >= v.x && px <= v.x + v.w && py >= v.y && py <= v.y + v.h;
    }
    draw(ctx) {
      const v = this.screen.view;
      if (this.y + this.h < v.y || this.y > v.y + v.h) return;
      const e = this.entry, t = this.hoverT, col = e.hidden ? '#6f6880' : e.color;
      ctx.save();
      ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
      UI.roundRect(ctx, this.x, this.y, this.w, this.h, 14);
      ctx.fillStyle = t > 0.01 ? 'rgba(70,50,112,0.96)' : 'rgba(30,22,50,0.92)';
      if (t > 0.01) { ctx.shadowColor = col; ctx.shadowBlur = 18 * t; }
      ctx.fill(); ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.55 + 0.45 * t;
      ctx.lineWidth = 2 + t; ctx.strokeStyle = col; ctx.stroke();
      ctx.globalAlpha = 1;
      const ix = this.x + this.w / 2, iy = this.y + 50;
      if (e.hidden) unknownIcon(ctx, ix, iy, 66);
      else { U.Render.drawGlow(ctx, ix, iy, 46, col, 0.3); SLS.Art.icon(ctx, e.symbol, ix, iy, 62, e.iconColor); }
      UI.text(ctx, e.hidden ? T('ency.hidden') : e.name, ix, this.y + this.h - 22, { size: 17, align: 'center', baseline: 'middle',
        bold: true, color: e.hidden ? '#8d86a0' : INK, fitWidth: this.w - 12 });
      ctx.restore();
    }
  }
  class EncyclopediaScreen extends Window {
    constructor() {
      super();
      this.dim = 0.7;
      const P = this.P = { x: 100, y: 64, w: 1720, h: 952 };
      const cols = 8, tw = 122, th = 128, gx = 12, gy = 14;
      this.view = { x: P.x + 40, y: P.y + 118, w: cols * (tw + gx) + 16, h: P.h - 118 - 112 };
      this.entries = encyclopediaEntries();
      this.tiles = [];
      this.headings = [];
      let y = 0, col = 0, last = -1;
      for (const e of this.entries) {
        // EncyclopediaManager.Awake: a title row whenever the rarity goes up
        if (last < e.rarity) {
          if (col > 0) { y += th + gy; col = 0; }
          this.headings.push({ y, rarity: e.rarity });
          y += 50; last = e.rarity;
        }
        this.tiles.push(this.add(new EncTile(this, e, col * (tw + gx), y, tw, th)));
        if (++col >= cols) { col = 0; y += th + gy; }
      }
      if (col > 0) y += th + gy;
      this.contentH = y;
      this.scroll = 0; this.scrollTarget = 0;
      this.keepSelection = true;
      this.focus = null;
      this.closeBtn = this.add(makeButton({ x: P.x + P.w - 380, y: P.y + P.h - 92, w: 320, h: 64, labelKey: 'menu.close', onClick: () => this.close() }));
      this.defaultSelected = this.tiles[0] || this.closeBtn;
      this.layout();
    }
    get maxScroll() { return Math.max(0, this.contentH - this.view.h + 10); }
    layout() {
      for (const tile of this.tiles) { tile.x = this.view.x + 8 + tile.cx0; tile.y = this.view.y + 6 + tile.cy0 - this.scroll; }
    }
    ensureVisible(tile) {
      const top = tile.cy0 - 56, bottom = tile.cy0 + tile.h + 16;
      if (top < this.scrollTarget) this.scrollTarget = top;
      else if (bottom > this.scrollTarget + this.view.h) this.scrollTarget = bottom - this.view.h;
      this.scrollTarget = Mathf.Clamp(this.scrollTarget, 0, this.maxScroll);
    }
    onScroll(wheel) { this.scrollTarget = Mathf.Clamp(this.scrollTarget - wheel * 120, 0, this.maxScroll); }
    onNavigate(nav) {
      const cur = this.selected;
      if (!(cur instanceof EncTile)) {
        if (cur === this.closeBtn && nav.y > 0) {
          const back = this.focus || this.tiles[this.tiles.length - 1];
          if (back) { this.select(back); this.ensureVisible(back); }
          return true;
        }
        if (!cur && this.tiles.length) { this.select(this.tiles[0]); this.ensureVisible(this.tiles[0]); return true; }
        return cur === this.closeBtn;
      }
      let best = null;
      if (nav.x) best = this.tiles[this.tiles.indexOf(cur) + (nav.x > 0 ? 1 : -1)] || null;
      else {
        const dir = nav.y > 0 ? -1 : 1;
        let bestScore = Infinity;
        for (const tl of this.tiles) {
          const dy = (tl.cy0 - cur.cy0) * dir;
          if (dy <= 1) continue;
          const score = dy * 4 + Math.abs(tl.cx0 - cur.cx0);
          if (score < bestScore) { bestScore = score; best = tl; }
        }
        if (!best && dir > 0) best = this.closeBtn;
      }
      if (best) { this.select(best); if (best instanceof EncTile) this.ensureVisible(best); }
      return true;
    }
    update(dt) {
      this.scroll += (this.scrollTarget - this.scroll) * Math.min(1, dt * 14);
      if (Math.abs(this.scroll - this.scrollTarget) < 0.5) this.scroll = this.scrollTarget;
      this.layout();
      if (this.selected instanceof EncTile) this.focus = this.selected;
    }
    drawBack(ctx) {
      const P = this.P, v = this.view;
      frame(ctx, P.x, P.y, P.w, P.h);
      heading(ctx, T('menu.encyclopedia'), P.x + P.w / 2, P.y + 60, 48);
      ctx.save();
      UI.roundRect(ctx, v.x - 6, v.y - 6, v.w + 12, v.h + 12, 16);
      ctx.fillStyle = 'rgba(6,4,14,0.45)'; ctx.fill();
      ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
      for (const hd of this.headings) {
        const y = v.y + 6 + hd.y - this.scroll + 22;
        if (y < v.y - 40 || y > v.y + v.h + 40) continue;
        const col = RARITY_COLORS[hd.rarity] || INK;
        diamond(ctx, v.x + 18, y, 7, col);
        UI.text(ctx, T('ency.r' + hd.rarity), v.x + 36, y, { size: 26, baseline: 'middle', bold: true, font: UI.FONT_TITLE, color: col });
        ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(v.x + 300, y); ctx.lineTo(v.x + v.w - 20, y); ctx.stroke(); ctx.restore();
      }
      ctx.restore();
      // scrollbar
      if (this.maxScroll > 0) {
        const sx = v.x + v.w + 14, th = Math.max(60, v.h * v.h / (this.contentH + 10)), ty = v.y + (v.h - th) * (this.scroll / this.maxScroll);
        ctx.save();
        UI.roundRect(ctx, sx, v.y, 8, v.h, 4); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
        UI.roundRect(ctx, sx, ty, 8, th, 4); ctx.fillStyle = GOLD_DIM; ctx.fill();
        ctx.restore();
      }
      const found = this.entries.filter((e) => !e.hidden).length;
      UI.text(ctx, T('ency.found', found, this.entries.length), v.x, P.y + P.h - 60, { size: 24, baseline: 'middle', bold: true, color: INK_DIM });
    }
    drawFront(ctx) {
      // details of the focused entry
      const P = this.P, v = this.view;
      const dx = v.x + v.w + 50, dw = P.x + P.w - 40 - dx, dy = v.y - 6, dh = v.h + 12;
      ctx.save();
      UI.roundRect(ctx, dx, dy, dw, dh, 18);
      ctx.fillStyle = 'rgba(8,6,18,0.6)'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,211,107,0.3)'; ctx.stroke();
      ctx.restore();
      const tile = this.focus, cx = dx + dw / 2;
      if (!tile) {
        UI.text(ctx, T('ency.pick'), cx, dy + dh / 2, { size: 24, align: 'center', baseline: 'middle', color: INK_DIM, maxWidth: dw - 60 });
        return;
      }
      const e = tile.entry, col = e.hidden ? '#8d86a0' : e.color;
      U.Render.drawGlow(ctx, cx, dy + 120, 110, e.hidden ? '#6f6880' : col, 0.35);
      if (e.hidden) unknownIcon(ctx, cx, dy + 120, 140);
      else SLS.Art.icon(ctx, e.symbol, cx, dy + 120, 132, e.iconColor);
      UI.text(ctx, e.hidden ? T('ency.hidden') : e.name, cx, dy + 230, { size: 38, align: 'center', baseline: 'middle', bold: true,
        font: UI.FONT_TITLE, color: e.hidden ? col : e.nameColor, fitWidth: dw - 40, outline: 'rgba(0,0,0,0.5)', outlineWidth: 4 });
      UI.text(ctx, T('ency.k' + Mathf.Clamp(e.rarity, 0, 3)), cx, dy + 274, { size: 21, align: 'center', baseline: 'middle', italic: true, color: INK_DIM });
      ctx.save(); ctx.strokeStyle = 'rgba(255,211,107,0.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(dx + 40, dy + 304); ctx.lineTo(dx + dw - 40, dy + 304); ctx.stroke(); ctx.restore();
      const text = e.hidden ? (e.howToGet() || T('ency.hiddenHint')) : (e.fullDesc() || T('ency.noText'));
      UI.text(ctx, text, dx + 34, dy + 326, { size: 24, color: INK, maxWidth: dw - 68, fitHeight: dh - 350, lineHeight: 1.32 });
    }
  }

  // ---------------------------------------------------------------- Upgrades (UI over ProgresisonManager)
  const UPGRADES = [   // index = ProgresisonManager.selected_upgrade; caps from RefreshUpgrade
    { field: 'atk_lvl', cap: 2, icon: 'sword', color: '#ffa27a' },
    { field: 'atk_speed_lvl', cap: 4, icon: 'hourglass', color: '#ffd36b' },
    { field: 'speed_lvl', cap: 3, icon: 'boot', color: '#86dcff' },
    { field: 'armor_lvl', cap: 4, icon: 'shield', color: '#c3cde0' },
    { field: 'stability_lvl', cap: 2, icon: 'arrows', color: '#c9a2ff' },
    { field: 'hp_lvl', cap: 5, icon: 'heart', color: '#ff6b81' },
    { field: 'crit_lvl', cap: 5, icon: 'eye', color: '#ffe680' },
    { field: 'soul_orb_lvl', cap: 2, icon: 'orb', color: SOUL },
  ];
  function basePrice() {
    const pm = SLS.Game.progression;
    if (pm && typeof pm.base_price === 'number') return pm.base_price;
    const f = SLS.F.managers && SLS.F.managers.ProgressionManager && SLS.F.managers.ProgressionManager.ProgresisonManager;
    return f && typeof f.base_price === 'number' ? f.base_price : 25;
  }
  function upgLevel(i) { const pm = SLS.Game.progression, v = pm ? pm[UPGRADES[i].field] : 0; return typeof v === 'number' ? v : 0; }
  function upgPrice(i) { return (upgLevel(i) + 1) * basePrice(); }   // RefreshUpgrade: (level + 1) * base_price
  // RefreshUpgrade disables an upgrade's button at its cap (and nothing re-enables it before a reload)
  function upgInteractable(i) {
    const pm = SLS.Game.progression;
    if (has(pm, 'IsButtonInteractable')) return !!safeCall('ProgresisonManager.IsButtonInteractable', () => pm.IsButtonInteractable(i));
    return upgLevel(i) < UPGRADES[i].cap;
  }
  // names and descriptions come from the manager (its upgrade_name strings) when it has them
  function upgText(i, method, fallbackKey) {
    const pm = SLS.Game.progression;
    if (has(pm, method)) {
      const s = safeCall('ProgresisonManager.' + method, () => pm[method](i));
      if (typeof s === 'string' && s && !looksLikeKey(s)) return s;
    }
    return T(fallbackKey + i);
  }
  const upgName = (i) => upgText(i, 'GetUpgradeName', 'upg.name');
  const upgDesc = (i) => upgText(i, 'GetUpgradeDescription', 'upg.desc');
  // ProgresisonManager.buy_upgrade_button: active (RefreshUpgrade shows it once an upgrade is
  // selected), interactable with white text only while soul_orbs >= upgrade_price (Update)
  const NO_BUY_BUTTON = { active: false, interactable: false };
  function buyButtonState() {
    const pm = SLS.Game.progression, b = pm && !pm._destroyed ? pm.buy_upgrade_button : null;
    return b && typeof b === 'object' ? b : NO_BUY_BUTTON;
  }
  // upgrade_price_text: the price RefreshUpgrade last wrote (it is not recomputed otherwise)
  function buyPrice() {
    const pm = SLS.Game.progression;
    return pm && typeof pm.upgrade_price === 'number' ? pm.upgrade_price : null;
  }
  class UpgradesScreen extends Window {
    constructor() {
      super();
      const P = this.P = { x: 180, y: 70, w: 1560, h: 940 };
      this.localSel = NO_UPGRADE;
      this.flash = UPGRADES.map(() => 0);
      const cw = 342, ch = 200, gx = 26, gy = 24;
      const x0 = P.x + (P.w - (4 * cw + 3 * gx)) / 2, y0 = P.y + 196;
      this.cards = UPGRADES.map((u, i) => this.add(makeButton({
        x: x0 + (i % 4) * (cw + gx), y: y0 + Math.floor(i / 4) * (ch + gy), w: cw, h: ch, label: '', upg: i,
        drawCustom: (ctx, b) => this.drawCard(ctx, b), enabledFn: () => upgInteractable(i),
        // Core.SelectButton: with a gamepad, focusing an entry selects it, and submitting on it also
        // submits the buy button
        onSelect: () => { if (!UI.pointerMode && isGamepad()) this.selectUpg(i); },
        onClick: () => { this.selectUpg(i); if (!UI.pointerMode && isGamepad()) this.submitBuy(); },
      })));
      this.detailY = y0 + 2 * (ch + gy) + 6;
      // the buy button mirrors ProgresisonManager: shown once an upgrade is selected, price =
      // upgrade_price, interactable (and white) only while soul_orbs >= upgrade_price. At a capped
      // level it stays priced; BuyUpgrade's CanBuy is what refuses the purchase.
      this.buyBtn = this.add(makeButton({ x: P.x + P.w - 70 - 420, y: this.detailY + 26, w: 420, h: 82, labelKey: 'common.buy', primary: true,
        size: 32, visibleFn: () => !!buyButtonState().active, enabledFn: () => !!buyButtonState().interactable,
        priceFn: buyPrice, priceOkFn: () => !!buyButtonState().interactable, onClick: () => this.buy() }));
      this.backBtn = this.add(makeButton({ x: P.x + P.w - 70 - 300, y: P.y + P.h - 100, w: 300, h: 64, labelKey: 'menu.back', onClick: () => this.close() }));
      this.defaultSelected = this.cards[0];
    }
    sel() {
      const pm = SLS.Game.progression;
      return has(pm, 'SelectUpgrade') && typeof pm.selected_upgrade === 'number' ? pm.selected_upgrade : this.localSel;
    }
    selectUpg(i) {
      const pm = SLS.Game.progression;
      if (has(pm, 'SelectUpgrade')) safeCall('ProgresisonManager.SelectUpgrade', () => pm.SelectUpgrade(i));
      else this.localSel = i;
    }
    // the buy button's onClick (it only runs while the button is shown and interactable)
    buy() {
      const pm = SLS.Game.progression, i = this.sel();
      if (!has(pm, 'BuyUpgrade')) return;
      const before = i >= 0 && i < UPGRADES.length ? upgLevel(i) : null;
      safeCall('ProgresisonManager.BuyUpgrade', () => pm.BuyUpgrade());
      if (before !== null && upgLevel(i) > before) this.flash[i] = 1;
    }
    // _buyButton.OnSubmit from Core.SelectButton: Button.Press needs the buy button to be active and
    // interactable (its click sound is the entry's own, already playing)
    submitBuy() {
      const b = this.buyBtn;
      if (b.visible && b.enabled) this.buy();
    }
    update(dt) {
      for (let i = 0; i < this.flash.length; i++) this.flash[i] = Math.max(0, this.flash[i] - dt * 2);
      // RefreshUpgrade with nothing selected moves the focus to the first upgrade
      const pm = SLS.Game.progression;
      if (pm && typeof pm.focusRequest === 'number') {
        const card = this.cards[pm.focusRequest];
        pm.focusRequest = null;
        if (card && !UI.pointerMode) this.select(card, true);
      }
    }
    drawCard(ctx, b) {
      const i = b.upg, u = UPGRADES[i], lvl = upgLevel(i), maxed = lvl >= u.cap, sel = this.sel() === i, t = b.hoverT, en = b.enabled;
      ctx.save();
      UI.roundRect(ctx, b.x, b.y, b.w, b.h, 18);
      const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
      g.addColorStop(0, !en ? 'rgba(40,36,52,0.95)' : sel ? 'rgba(96,74,22,0.97)' : (t > 0.01 ? 'rgba(70,50,110,0.96)' : 'rgba(40,28,64,0.95)'));
      g.addColorStop(1, !en ? 'rgba(22,20,30,0.95)' : sel ? 'rgba(52,38,10,0.97)' : 'rgba(20,14,36,0.95)');
      ctx.fillStyle = g;
      if (en && (sel || t > 0.01)) { ctx.shadowColor = sel ? 'rgba(255,236,60,0.8)' : 'rgba(200,160,255,0.6)'; ctx.shadowBlur = sel ? 26 : 18 * t; }
      ctx.fill(); ctx.shadowBlur = 0;
      // the selected upgrade is tinted yellow, like RefreshUpgrade did; a capped one is greyed out
      ctx.lineWidth = sel ? 3.5 : 2.5; ctx.strokeStyle = !en ? '#5a5566' : sel ? '#ffeb3b' : (t > 0.01 ? GOLD : GOLD_DIM); ctx.stroke();
      if (this.flash[i] > 0) { ctx.fillStyle = 'rgba(255,240,180,' + (0.4 * this.flash[i]) + ')'; ctx.fill(); }
      ctx.restore();
      ctx.save();
      if (!en) ctx.globalAlpha *= 0.6;
      U.Render.drawGlow(ctx, b.x + 60, b.y + 64, 58, u.color, 0.3 + 0.2 * t);
      SLS.Art.icon(ctx, u.icon, b.x + 60, b.y + 64, 74, u.color);
      ctx.restore();
      UI.text(ctx, upgName(i), b.x + 112, b.y + 48, { size: 26, baseline: 'middle', bold: true, font: UI.FONT_TITLE,
        color: !en ? '#a49cb4' : sel ? '#fff1b8' : INK, fitWidth: b.w - 126 });
      UI.text(ctx, T('upg.level', lvl, u.cap), b.x + 112, b.y + 86, { size: 20, baseline: 'middle', color: INK_DIM });
      for (let k = 0; k < u.cap; k++) {
        const px = b.x + 34 + k * 36, py = b.y + 142;
        if (k < lvl) { U.Render.drawGlow(ctx, px, py, 18, GOLD, 0.5); diamond(ctx, px, py, 11, GOLD); }
        else { ctx.save(); ctx.translate(px, py); ctx.rotate(Math.PI / 4); ctx.strokeStyle = 'rgba(255,211,107,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(-7, -7, 14, 14); ctx.restore(); }
      }
      if (maxed) {
        UI.text(ctx, T('upg.max'), b.x + b.w - 24, b.y + b.h - 30, { size: 24, align: 'right', baseline: 'middle', bold: true, font: UI.FONT_TITLE, color: GOLD });
      } else {
        const p = upgPrice(i);
        soulBadge(ctx, b.x + b.w - 22, b.y + b.h - 30, p, 'right', 24, souls() >= p ? null : RED);
      }
    }
    drawBack(ctx) {
      const P = this.P;
      frame(ctx, P.x, P.y, P.w, P.h);
      heading(ctx, T('menu.upgrades'), P.x + P.w / 2, P.y + 64, 50);
      UI.text(ctx, T('upg.subtitle'), P.x + P.w / 2, P.y + 128, { size: 23, align: 'center', baseline: 'middle', italic: true, color: INK_DIM, fitWidth: P.w - 520 });
      soulBadge(ctx, P.x + P.w - 60, P.y + 64, souls(), 'right', 34);
      // details of the selected upgrade
      const i = this.sel(), dy = this.detailY;
      ctx.save(); ctx.strokeStyle = 'rgba(255,211,107,0.3)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(P.x + 60, dy); ctx.lineTo(P.x + P.w - 60, dy); ctx.stroke(); ctx.restore();
      const tx = P.x + 80, tw = P.w - 80 - 70 - 420 - 60;
      if (!SLS.Game.progression) {
        UI.text(ctx, T('upg.unavailable'), tx, dy + 66, { size: 26, baseline: 'middle', color: INK_DIM, maxWidth: tw });
      } else if (i >= 0 && i < UPGRADES.length) {
        UI.text(ctx, upgName(i), tx, dy + 46, { size: 34, baseline: 'middle', bold: true, font: UI.FONT_TITLE, color: GOLD });
        UI.text(ctx, upgDesc(i), tx, dy + 76, { size: 24, color: INK, maxWidth: tw, fitHeight: 90, lineHeight: 1.3 });
      } else {
        UI.text(ctx, T('upg.pick'), tx, dy + 66, { size: 26, baseline: 'middle', color: INK_DIM, maxWidth: tw });
      }
    }
  }
  // ---------------------------------------------------------------- Pause (WaveManager.OnPause + options screen)
  class PauseScreen extends Window {
    constructor() {
      super();
      this.dim = 0.55;
      const P = this.P = { x: 660, y: 250, w: 600, h: 560 };
      const w = 440, x = P.x + (P.w - w) / 2;
      this.resume = this.add(makeButton({ x, y: P.y + 140, w, h: 76, labelKey: 'menu.resume', primary: true, size: 34, onClick: () => resumeRun() }));
      this.add(makeButton({ x, y: P.y + 240, w, h: 76, labelKey: 'menu.options', onClick: () => UI.push(new OptionsScreen(true)) }));
      this.add(makeButton({ x, y: P.y + 340, w, h: 76, labelKey: 'menu.giveup', danger: true, onClick: () => giveUp() }));
      this.defaultSelected = this.resume;
    }
    // the pause screen is not a Core.Window and WaveManager.OnBack is never subscribed: Back does
    // nothing here (Esc / P / Start resume through WaveManager.OnPause)
    onCancel() { }
    drawBack(ctx) {
      const P = this.P;
      frame(ctx, P.x, P.y, P.w, P.h);
      heading(ctx, T('pause.title'), P.x + P.w / 2, P.y + 70, 52);
      UI.text(ctx, T('pause.hint'), P.x + P.w / 2, P.y + P.h - 52, { size: 20, align: 'center', baseline: 'middle', italic: true, color: INK_DIM, fitWidth: P.w - 60 });
    }
  }

  // ---------------------------------------------------------------- Game Over (EndGame panel + local records)
  function loadRecords() {
    const r = SLS.Save.GetValue(RECORDS_KEY, []);
    return Array.isArray(r) ? r.filter((e) => e && typeof e.wave === 'number').sort((a, b) => b.wave - a.wave || a.t - b.t) : [];
  }
  function recordRun(wave) {
    const ps = SLS.Game.playerStats;
    const hat = ps && typeof ps.hat === 'number' ? ps.hat : -1;
    const list = loadRecords();
    const prevBest = list.length ? list[0].wave : 0;
    // PlayerStats.CheckHP: no leaderboard upload when hat == 5 (the Fedora)
    if (hat === FEDORA_HAT || !(wave > 0)) return { ranked: hat !== FEDORA_HAT, list, best: prevBest, newBest: false, entry: null };
    const entry = { wave, t: Date.now(), hat, staff: ps && typeof ps.staff === 'number' ? ps.staff : -1 };
    list.push(entry);
    list.sort((a, b) => b.wave - a.wave || a.t - b.t);
    const top = list.slice(0, MAX_RECORDS);
    SLS.Save.SetValue(RECORDS_KEY, top);
    return { ranked: true, list: top, best: Math.max(prevBest, wave), newBest: wave > prevBest, entry };
  }
  class GameOverScreen extends Window {
    constructor(wave, info) {
      super();
      this.dim = 0;
      this.closable = false;
      this.blockCancel = true;
      this.wave = wave; this.info = info;
      const P = this.P = { x: 500, y: 90, w: 920, h: 900 };
      this.retry = this.add(makeButton({ x: P.x + 70, y: P.y + P.h - 112, w: 370, h: 76, labelKey: 'menu.retry', primary: true, size: 32,
        onClick: () => reloadGame(false) }));
      this.add(makeButton({ x: P.x + P.w - 440, y: P.y + P.h - 112, w: 370, h: 76, labelKey: 'menu.mainmenu', onClick: () => reloadGame(true) }));
      this.defaultSelected = this.retry;
    }
    drawBack(ctx) {
      const a = Mathf.Clamp01(this.age / 0.6), P = this.P, cx = P.x + P.w / 2, t = UI.time;
      ctx.fillStyle = 'rgba(8,2,12,' + (0.68 * a) + ')';
      ctx.fillRect(0, 0, 1920, 1080);
      const rg = ctx.createRadialGradient(960, 540, 260, 960, 540, 1150);
      rg.addColorStop(0, 'rgba(110,8,30,0)'); rg.addColorStop(1, 'rgba(110,8,30,' + (0.5 * a) + ')');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, 1920, 1080);
      ctx.save();
      ctx.globalAlpha *= a;
      frame(ctx, P.x, P.y, P.w, P.h);
      // a broken halo
      ctx.save();
      ctx.translate(cx, P.y + 44); ctx.rotate(-0.14);
      ctx.strokeStyle = 'rgba(255,211,107,0.8)'; ctx.lineWidth = 4; ctx.shadowColor = 'rgba(255,190,90,0.7)'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.ellipse(0, 0, 70, 12, 0, Math.PI * 0.98, Math.PI * 1.58); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(4, 3, 70, 12, 0.08, Math.PI * 1.76, Math.PI * 2.72); ctx.stroke();
      ctx.restore();
      UI.text(ctx, T('over.title'), cx, P.y + 100, { size: 52, align: 'center', baseline: 'middle', bold: true, font: UI.FONT_TITLE,
        color: '#ffc29a', outline: 'rgba(30,0,10,0.9)', outlineWidth: 6, shadow: 'rgba(255,90,60,0.5)', shadowBlur: 18, fitWidth: P.w - 80 });
      UI.text(ctx, T('over.wave', this.wave), cx, P.y + 178, { size: 40, align: 'center', baseline: 'middle', bold: true, font: UI.FONT_TITLE,
        color: GOLD, outline: 'rgba(0,0,0,0.6)', outlineWidth: 5, fitWidth: P.w - 80 });
      const info = this.info;
      let y = P.y + 236;
      if (info.newBest) {
        const p = 1 + 0.06 * Math.sin(t * 5);
        ctx.save(); ctx.translate(cx, y); ctx.scale(p, p); ctx.translate(-cx, -y);
        UI.text(ctx, T('over.newbest'), cx, y, { size: 32, align: 'center', baseline: 'middle', bold: true, font: UI.FONT_TITLE, color: '#7dff9a',
          outline: 'rgba(0,0,0,0.6)', outlineWidth: 4, shadow: 'rgba(125,255,154,0.5)', shadowBlur: 14 });
        ctx.restore();
      } else if (info.best > 0) {
        UI.text(ctx, T('over.best', info.best), cx, y, { size: 28, align: 'center', baseline: 'middle', color: INK });
      }
      if (!info.ranked) UI.text(ctx, T('over.notRanked'), cx, y + 38, { size: 21, align: 'center', baseline: 'middle', italic: true, color: INK_DIM, fitWidth: P.w - 80 });
      // local records (replaces the Steam leaderboard panel)
      const ly = P.y + 336;
      heading(ctx, T('over.local'), cx, ly, 32);
      const list = info.list, rx = P.x + 120, rw = P.w - 240;
      if (!list.length) UI.text(ctx, T('over.empty'), cx, ly + 70, { size: 24, align: 'center', baseline: 'middle', color: INK_DIM });
      const loc = SLS.Lang.current === 'pt' ? 'pt-BR' : 'en-US';
      list.forEach((r, k) => {
        const yy = ly + 56 + k * 37, mine = r === info.entry;
        if (mine) {
          ctx.save(); UI.roundRect(ctx, rx - 16, yy - 17, rw + 32, 34, 10);
          ctx.fillStyle = 'rgba(255,211,107,0.16)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,211,107,0.6)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
        }
        const col = mine ? '#fff1c4' : (k === 0 ? GOLD : INK);
        UI.text(ctx, '#' + (k + 1), rx, yy, { size: 23, baseline: 'middle', bold: true, color: col });
        UI.text(ctx, T('hud.wave', r.wave), rx + 90, yy, { size: 23, baseline: 'middle', bold: true, color: col });
        let date = '';
        try { date = new Date(r.t).toLocaleDateString(loc); } catch (e) { date = ''; }
        UI.text(ctx, date, rx + rw, yy, { size: 21, align: 'right', baseline: 'middle', color: mine ? '#fff1c4' : INK_DIM });
      });
      ctx.restore();
    }
  }
  function reloadGame(toMenu) {
    unloading = true;
    if (toMenu && SLS.Debug.autostart) {
      const q = new URLSearchParams(location.search);
      q.delete('autostart');
      const s = q.toString();
      location.href = location.pathname + (s ? '?' + s : '') + location.hash;
    } else location.reload();   // RestartGame.Restart reloaded the scene
  }

  // ---------------------------------------------------------------- item tooltip (ItemPopup)
  const popup = { id: null, rect: null };
  function setPopup(id, rect) {
    if (id === null || id === undefined || id === false || id === -1) { popup.id = null; popup.rect = null; return; }
    popup.id = id;
    popup.rect = rect && typeof rect.x === 'number' && typeof rect.w === 'number' ? rect : null;
  }
  function popupBlocked() {
    return M.gameOverShown || (M.pause && UI.stack.includes(M.pause)) || (M.title && UI.stack.includes(M.title));
  }
  function drawPopup(ctx) {
    if (popup.id === null || popupBlocked()) return;
    const info = itemInfo(popup.id);
    if (!info) return;
    const desc = info.desc();
    const w = 460, pad = 22, size = 22, lh = 1.25;
    ctx.save(); ctx.font = UI.font(size, {}); const lines = desc ? UI.wrap(ctx, desc, w - pad * 2) : []; ctx.restore();
    const h = pad * 2 + 46 + (lines.length ? lines.length * size * lh + 10 : 0);
    const m = U.Input.mouse;
    let x = m.x + 28, y = m.y + 28;   // follows the mouse, like ItemPopup.Update
    if (x + w > 1910) x = m.x - 28 - w;
    if (y + h > 1070) y = Math.max(10, 1070 - h);
    if (x < 10) x = 10;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
    UI.roundRect(ctx, x, y, w, h, 14);
    ctx.fillStyle = 'rgba(16,10,30,0.96)'; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2.5; ctx.strokeStyle = info.color; ctx.stroke();
    ctx.restore();
    SLS.Art.icon(ctx, info.symbol, x + pad + 18, y + pad + 22, 38, info.iconColor);
    UI.text(ctx, info.name, x + pad + 48, y + pad + 22, { size: 28, baseline: 'middle', bold: true, font: UI.FONT_TITLE, color: info.nameColor, fitWidth: w - pad * 2 - 50 });
    if (lines.length) UI.text(ctx, desc, x + pad, y + pad + 56, { size, color: INK, maxWidth: w - pad * 2, lineHeight: lh });
  }
  // draw the tooltip above every screen (and under the cursor) through Render.overlayDraw
  function ensureOverlay() {
    const cur = U.Render.overlayDraw;
    if (cur && cur._slsMenusPopup) return;
    const wrapper = (ctx) => {
      try { drawPopup(ctx); } catch (e) { U.reportError(e, null, 'item popup'); }
      if (cur) cur(ctx);
    };
    wrapper._slsMenusPopup = true;
    U.Render.overlayDraw = wrapper;
  }

  // ---------------------------------------------------------------- run flow
  const M = SLS.Menus = {
    title: null, pause: null, over: null, gameOverShown: false,
    autoPending: false, autoT: 0, giveUp: null, cheatsOff: false,
    Options, Loadout, popup,
    screens: { TitleScreen, OptionsScreen, HowToPlayScreen, CreditsScreen, QuitScreen, EncyclopediaScreen, UpgradesScreen,
      PauseScreen, GameOverScreen },
  };
  function showTitle() {
    if (M.gameOverShown) return;
    if (M.title && UI.stack.includes(M.title)) return;
    M.title = new TitleScreen();
    UI.push(M.title);
    U.Audio.playMusic('menu');
  }
  function closeTitle() {
    if (M.title) { removeScreenAndAbove(M.title); M.title = null; }
  }
  // the start button: WaveManager.StartGame() then WaveManager.UnpauseGame(), then the menu hides and
  // the CheatManager is deactivated (the same OnClick list), so the cheat codes only work on the title
  function beginRun() {
    if (M.gameOverShown) return;
    M.autoPending = false;
    const w = SLS.Game.waveManager;
    if (has(w, 'StartGame')) safeCall('WaveManager.StartGame', () => w.StartGame());
    if (has(w, 'UnpauseGame')) safeCall('WaveManager.UnpauseGame', () => w.UnpauseGame());
    else U.Time.timeScale = 1;
    disableCheatManager();
    closeTitle();
  }
  function disableCheatManager() {
    M.cheatsOff = true;
    const go = U.GameObject.Find('CheatManager');
    if (go) go.SetActive(false);
  }
  function showPause() {
    if (M.pause && UI.stack.includes(M.pause)) return;
    setPopup(null);
    M.pause = new PauseScreen();
    UI.push(M.pause);
  }
  function closePause() {
    if (M.pause) { removeScreenAndAbove(M.pause); M.pause = null; }
  }
  function resumeRun() {
    const w = SLS.Game.waveManager;
    if (has(w, 'UnpauseGame')) safeCall('WaveManager.UnpauseGame', () => w.UnpauseGame());
    else U.Time.timeScale = 1;
    closePause();
  }
  // the give-up button: PlayerStats.KillSelf() and hide the pause/options screens; the next
  // PlayerStats.CheckHP runs the game-over sequence
  function giveUp() {
    const ps = SLS.Game.playerStats;
    closePause();
    if (has(ps, 'KillSelf')) {
      safeCall('PlayerStats.KillSelf', () => ps.KillSelf());
      M.giveUp = { t: 0 };
    } else showGameOver(waveNumber());
  }
  function showGameOver(wave) {
    if (M.gameOverShown) return;
    M.gameOverShown = true;
    M.giveUp = null;
    M.autoPending = false;
    setPopup(null);
    closePause();
    closeTitle();
    for (const s of UI.stack.slice()) if (s instanceof Window) removeScreen(s);
    const w = Number.isFinite(+wave) && +wave > 0 ? Math.floor(+wave) : waveNumber();
    M.over = new GameOverScreen(w, recordRun(w));
    UI.push(M.over);
  }
  function onSetPaused(paused) {
    if (M.gameOverShown || playerDead()) { if (!paused) closePause(); return; }
    if (paused) {
      if (waveNumber() > 0) showPause();
      else if (!SLS.Debug.autostart) showTitle();   // WaveManager.Start: pause_screen is the start menu
    } else {
      closePause();
      if (waveNumber() > 0) closeTitle();
    }
  }

  // per-frame upkeep (U.Loop.onFrame, real time)
  function menusTick(dt, realDt) {
    try {
      ensureOverlay();
      // ?autostart: the waves module normally starts the run; if nobody did, press Begin ourselves
      if (M.autoPending) {
        M.autoT += realDt;
        if (waveNumber() > 0 || M.gameOverShown) M.autoPending = false;
        else if (M.autoT >= 1.5) beginRun();
      }
      // a run started elsewhere (?autostart: WaveManager.Start calls StartGame itself): the start menu
      // goes away and, as with Begin, the CheatManager is deactivated
      if (!M.cheatsOff && waveNumber() > 0) disableCheatManager();
      if (M.title && waveNumber() > 0 && UI.stack.includes(M.title)) closeTitle();
      // ExitGame.Update: J on the title presses the Quit button (Begin hides Title/ExitGame)
      if (M.title && UI.stack.includes(M.title) && U.Input.GetKeyDown('j') && !UI.isOpen(QuitScreen)) M.title.ExitGame();
      // give up: CheckHP runs in Update even while paused; if the death check needs the simulation,
      // let it run, and never leave the player without a screen
      if (M.giveUp && !M.gameOverShown) {
        M.giveUp.t += realDt;
        if (M.giveUp.t > 0.25 && U.Time.timeScale === 0) U.Time.timeScale = 1;
        if (M.giveUp.t > 1.5) showGameOver(waveNumber());
      }
      if (popup.id !== null && popup.rect) {
        const m = U.Input.mouse, r = popup.rect;
        if (m.x < r.x || m.y < r.y || m.x > r.x + r.w || m.y > r.y + r.h) setPopup(null);
      }
    } catch (e) { U.reportError(e, null, 'menus tick'); }
  }

  // ---------------------------------------------------------------- hooks
  const HOOKS = {
    // PlayerStats.CheckHP, after saving the souls: the EndGame panel
    gameOver(wave) { showGameOver(wave); },
    // WaveManager.PauseGame / UnpauseGame / OnPause
    setPaused(paused) { onSetPaused(!!paused); },
    // ItemPopup via CardManager.EnablePopup: an id shows the tooltip; null / -1 hides it. An
    // optional {x, y, w, h} (UI pixels) hides it automatically when the mouse leaves that area.
    showItemPopup(itemId, rect) { setPopup(itemId, rect); },
    hideItemPopup() { setPopup(null); },
  };
  // never overwrite a hook another module defined: wrap it and call both
  function installHooks() {
    const H = SLS.UIHooks = SLS.UIHooks || {};
    for (const name of Object.keys(HOOKS)) {
      const cur = H[name], mine = HOOKS[name];
      if (cur && cur._slsOwner === 'menus') continue;
      let fn;
      if (typeof cur === 'function') {
        fn = function (...args) {
          let r;
          try { r = cur.apply(this, args); } catch (e) { U.reportError(e, null, 'UIHooks.' + name); }
          mine.apply(this, args);
          return r;
        };
      } else fn = function (...args) { return mine.apply(this, args); };
      fn._slsOwner = 'menus';
      H[name] = fn;
    }
  }
  installHooks();

  // SLS.addStartup is created by main.js, which loads after the modules: register once every
  // classic script has run (DOMContentLoaded fires before main.js boots on "load").
  function addStartup(order, fn) {
    if (typeof SLS.addStartup === 'function') { SLS.addStartup(order, fn); return; }
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof SLS.addStartup === 'function') SLS.addStartup(order, fn);
      else console.error('[menus] SLS.addStartup is missing');
    }, { once: true });
  }

  addStartup(60, () => {
    installHooks();
    Options.LoadOptions();   // Options.Awake -> LoadOptions
    armFullscreenRestore();
    if (!U.Loop.onFrame.includes(menusTick)) U.Loop.onFrame.push(menusTick);
    if (waveNumber() > 0 || M.gameOverShown) return;   // a run is already going
    if (SLS.Debug.autostart) { M.autoPending = true; M.autoT = 0; return; }
    U.Time.timeScale = 0;   // like WaveManager.Start: the start menu sits over the paused arena
    showTitle();
  });
})(window.SLS, window.U);
