/*
 * shop.js - the between-wave card shop, the run inventory and the transcendence popup.
 *
 * Original classes, names and call graph:
 *   WaveManager.CheckWaveEnd -> ShopManager.StartShop -> CreateCard x(3 + cards_plus, max 9)
 *        -> RandomPicker/Roll -> ItemScript.SetCard ; Instantiate RerollCard
 *   click -> ItemScript.Buy -> BuyCard(id) -> stat effect -> ShopManager.AddItem -> CardManager.CreateCard -> Card
 *                          -> GetTranscendents -> CallTranscendence -> Transcendence popup (timeScale 0)
 *                          -> CloseShop (inlined): OnScreen=false, OnOpen(false), WaveManager.StartWave(), hide panel
 *   RerollCard.RefreshShop -> pay 5 souls (unless dealer / hat 5) -> ShopManager.StartShop
 *
 * Unity UI objects become U.UI screens drawn with original procedural art: ShopScreen (the panel),
 * TranscendenceScreen (the popup). The inventory bar (CardManager) draws itself in screen space.
 * C# float maths is emulated with Math.fround so thresholds (e.g. Vampire at 0.36) behave like the original.
 */
'use strict';
(function (SLS, U) {
  const F = SLS.F;
  const UI = U.UI;
  const TAU = Math.PI * 2;
  const f32 = Math.fround;
  const SHOP = F.managers.ShopManager.ShopManager;
  const PS0 = (F.player && F.player.scripts && F.player.scripts.PlayerStats) || {};
  const CARD_IDS = (F.itemGroups && F.itemGroups.cards) || [];
  const REROLL_COST = 5;   // RerollCard: ADD [soul_orbs], -5 ; enabled while soul_orbs >= 5

  // C# float literals used by BuyCard / GetTranscendents
  const K = {
    p1: f32(0.1), p2: f32(0.2), p3: f32(0.3), p4: f32(0.4), p12: f32(0.12), p24: f32(0.24), p03: f32(0.03),
    p09: f32(0.09), p35: f32(0.35), p36: f32(0.36), p5: f32(0.5), t13: f32(1.3),
  };

  // ---------------------------------------------------------------- strings (original wording)
  SLS.addStrings('en', {
    'shop.title': 'Choose a Card',
    'shop.subtitle': 'Wave {0} cleared. Pick one card to continue.',
    'shop.subtitle0': 'Pick one card to continue.',
    'shop.reroll': 'Reroll',
    'shop.rerollDesc': 'Sweep this hand away and deal a fresh one.',
    'shop.rerollFree': 'Free reroll',
    'shop.souls': 'Souls',
    'trans.header': 'Transcendence',
    'trans.sub': 'A new power awakens',
    'trans.continue': 'Continue',
  });
  SLS.addStrings('pt', {
    'shop.title': 'Escolha uma Carta',
    'shop.subtitle': 'Onda {0} concluída. Escolha uma carta para continuar.',
    'shop.subtitle0': 'Escolha uma carta para continuar.',
    'shop.reroll': 'Trocar',
    'shop.rerollDesc': 'Descarte esta mão e receba uma nova.',
    'shop.rerollFree': 'Troca grátis',
    'shop.souls': 'Almas',
    'trans.header': 'Transcendência',
    'trans.sub': 'Um novo poder desperta',
    'trans.continue': 'Continuar',
  });

  // ---------------------------------------------------------------- helpers
  const alive = (o) => !!o && !o._destroyed;
  function setActive(obj, v) {
    if (!obj) return;
    if (typeof obj.SetActive === 'function') obj.SetActive(v);
    else if (obj.gameObject && typeof obj.gameObject.SetActive === 'function') obj.gameObject.SetActive(v);
  }
  const comp = (go, type) => (go && !go._destroyed ? go.GetComponent(type) : null);
  function findPlayerStats() {
    if (alive(SLS.Game.playerStats)) return SLS.Game.playerStats;
    return comp(U.GameObject.FindWithTag('Player'), 'PlayerStats') || comp(U.GameObject.Find('Player'), 'PlayerStats');
  }
  function findPlayerController(ps) {
    const pc = ps && ps.gameObject ? comp(ps.gameObject, 'PlayerController') : null;
    if (pc) return pc;
    if (alive(SLS.Game.playerController)) return SLS.Game.playerController;
    return comp(U.GameObject.Find('Player'), 'PlayerController');
  }
  function findWaveManager() {
    if (alive(SLS.Game.waveManager)) return SLS.Game.waveManager;
    return comp(U.GameObject.FindWithTag('WaveManager'), 'WaveManager');
  }
  function findProgression() {
    if (alive(SLS.Game.progression)) return SLS.Game.progression;
    return comp(U.GameObject.Find('ProgressionManager'), 'ProgresisonManager');
  }
  function findShopManager() {
    if (alive(SLS.Game.shopManager)) return SLS.Game.shopManager;
    return comp(U.GameObject.FindWithTag('ShopManager'), 'ShopManager');
  }
  function removeScreen(s) {
    if (!s) return;
    const i = UI.stack.indexOf(s);
    if (i >= 0) { UI.stack.splice(i, 1); try { s.exit(); } catch (e) { U.reportError(e, null, 'screen.exit'); } }
  }
  const cssColor = (c) => (c && typeof c.css === 'function' ? c.css() : (typeof c === 'string' ? c : '#ffffff'));
  // SLS.addStartup is created by main.js, which loads after the modules: register once every
  // classic script has run (DOMContentLoaded fires before main.js boots on "load").
  function onBoot(order, fn) {
    if (typeof SLS.addStartup === 'function') { SLS.addStartup(order, fn); return; }
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof SLS.addStartup === 'function') SLS.addStartup(order, fn);
      else console.error('[shop] SLS.addStartup is missing');
    }, { once: true });
  }
  // Transcendence.Update mutes WaveManager.Instance.music_source every frame; ContinueGame restores
  // the Options music volume. Without a wave module, the engine's music bus is used directly.
  function muteMusic() {
    const wm = findWaveManager();
    if (wm && wm.music_source) { wm.music_source.volume = 0; return; }
    const A = U.Audio;
    if (A && A.ctx && A.musicBus && A.musicBus.gain.value > 0.0005) {
      try { A.musicBus.gain.setTargetAtTime(0, A.ctx.currentTime, 0.03); } catch (e) { /* audio not ready */ }
    }
  }
  function restoreMusic() {
    const wm = findWaveManager();
    if (wm && wm.music_source) {
      const opt = wm.options_ && wm.options_.music_volume;
      wm.music_source.volume = opt && typeof opt.value === 'number' ? opt.value : 1;
      return;
    }
    if (U.Audio && typeof U.Audio.setMusicMuffled === 'function') U.Audio.setMusicMuffled(false);
  }
  // guaranteed-epic shops: the bit tests of ShopManager.<RandomPicker>g__Roll (wave_number already incremented)
  const MASK_LO = 0x1084210844n, MASK_HI = 0x1084210842108421n;
  function isGuaranteedEpicShop(wave) {
    const n = wave | 0;
    if (n >= 0 && n < 37 && ((MASK_LO >> BigInt(n)) & 1n) === 1n) return true;
    const k = (n - 41) >>> 0;   // unsigned compare, like the original
    return k < 61 && ((MASK_HI >> BigInt(k)) & 1n) === 1n;
  }

  // ---------------------------------------------------------------- ShopManager statics
  let shopOnScreen = false;
  const onOpenListeners = [];   // static Action<bool> OnOpen
  onOpenListeners.add = (fn) => { if (typeof fn === 'function') onOpenListeners.push(fn); return onOpenListeners; };
  onOpenListeners.remove = (fn) => { const i = onOpenListeners.lastIndexOf(fn); if (i >= 0) onOpenListeners.splice(i, 1); return onOpenListeners; };
  function invokeOnOpen(value) {
    for (const fn of onOpenListeners.slice()) {
      try { fn(value); } catch (e) { U.reportError(e, null, 'ShopManager.OnOpen listener'); }
    }
  }

  // ================================================================ ShopManager
  class ShopManager extends U.MonoBehaviour {
    // true while the shop is open (WaveManager.OnPause / PlayerController.Jump check it)
    static get OnScreen() { return shopOnScreen; }
    static set OnScreen(v) { shopOnScreen = !!v; }
    // listeners called with true when the shop opens and false when it closes.
    // Subscribe with ShopManager.OnOpen.push(fn) (or .add(fn), or ShopManager.OnOpen = fn); unsubscribe with .remove(fn).
    static get OnOpen() { return onOpenListeners; }
    static set OnOpen(v) {
      if (v === onOpenListeners) return;
      if (typeof v === 'function') { onOpenListeners.push(v); return; }
      onOpenListeners.length = 0;
      if (Array.isArray(v)) for (const fn of v) if (typeof fn === 'function') onOpenListeners.push(fn);
    }
    static InvokeOnOpen(value) { invokeOnOpen(value); }

    constructor() {
      super();
      this.player_stats = null;
      this.itens = new Map();             // run inventory: item id -> quantity (Dictionary<Item,int> in the original)
      this.shop_card = 'ShopCard';        // prefab names (Instantiate by name)
      this.shop_panel = null;             // GameObject tagged "ShopPanel"
      this.reroll_card = 'RefreshCards';
      this.normal_chance = f32(SHOP.normal_chance);   // roll <= normal_chance -> common
      this.rare_chance = f32(SHOP.rare_chance);       // not used by the roll (card 30 / Blessed)
      this.epic_chance = f32(SHOP.epic_chance);       // roll > 100 - epic_chance -> epic
      this.last_picked = 0;
      this.card_manager = null;
      for (const id of CARD_IDS) this['card' + id] = null;
      this.hand = [];        // remake: ItemScripts of the current hand, in deal order
      this.reroll = null;    // remake: the current RerollCard
      this.screen = null;    // remake: ShopScreen
    }
    get OnScreen() { return ShopManager.OnScreen; }
    get inventory() { return this.itens; }           // Map item id -> count, in acquisition order

    Awake() {
      SLS.Game.shopManager = this;
      for (const id of CARD_IDS) this['card' + id] = SLS.ItemDB.get(id);
    }
    Start() {
      if (!this.itens) this.itens = new Map();
      this.player_stats = findPlayerStats();
    }
    ResolvePlayerStats() {
      if (!alive(this.player_stats)) this.player_stats = findPlayerStats();
      return this.player_stats;
    }

    // Called by WaveManager.CheckWaveEnd and by RerollCard.RefreshShop.
    StartShop() {
      ShopManager.OnScreen = true;
      invokeOnOpen(true);
      setActive(this.shop_panel, true);
      this.ClearShop();                           // inlined in the original
      const ps = this.ResolvePlayerStats();
      const cardsPlus = ps ? ps.cards_plus | 0 : (PS0.cards_plus | 0);
      const usingCards = [];
      const cards = [];
      let card = null;
      let i;
      // 3 cards always, one more per PlayerStats.cards_plus, at most 9 (two rows of 5 for pad navigation)
      for (i = 0; i < 9; i++) {
        if (i > 2 && cardsPlus <= i - 3) break;
        card = this.CreateCard(usingCards, card);
        cards.push(card);
        if (i >= 5) {
          setNav(card.button, 'up', cards[i - 5].button);
          setNav(cards[i - 5].button, 'down', card.button);
        }
      }
      const rerollGo = U.Instantiate(this.reroll_card, null, null, this.shop_panel ? this.shop_panel.transform : null);
      const reroll = rerollGo.GetComponent(RerollCard);
      card.SetNavigation(null, null, null, reroll.Btn);
      setNav(reroll.Btn, 'left', card.button);
      if (i > 5) setNav(reroll.Btn, 'up', cards[i - 5].button);
      this.hand = cards;
      this.reroll = reroll;
      this.ShowScreen();
    }

    // Instantiates a shop card, rolls its id and fills it (CardPicker is inlined here in the original).
    CreateCard(usingCards, antecessor) {
      const go = U.Instantiate(this.shop_card, null, null, this.shop_panel ? this.shop_panel.transform : null);
      const card = go.GetComponent(ItemScript);
      const n = this.RandomPicker(usingCards);
      usingCards.push(n);
      card.SetCard(this.CardPicker(n));
      if (alive(antecessor)) {
        antecessor.SetNavigation(null, null, null, card);
        card.SetNavigation(null, null, antecessor, null);
      }
      return card;
    }

    CardPicker(n) {
      n |= 0;
      if ((n >= 0 && n <= 9) || (n >= 20 && n <= 36) || (n >= 40 && n <= 52)) return this['card' + n] || null;
      return null;
    }

    RandomPicker(pickedCards) {
      const common_card_max = 9, rare_card_max = 36, epic_card_max = 52;
      const Roll = () => {
        const wm = findWaveManager();
        const wave = wm ? wm.wave_number | 0 : 0;
        let roll = isGuaranteedEpicShop(wave) ? 101 : U.Random.RangeInt(0, 101);   // int 0..100 as a float
        const ps = this.ResolvePlayerStats();
        if (ps && ps.hat === 3) roll = 80;
        let id = 0;   // stays 0 when roll == 100 - epic_chance exactly (no tier matches)
        const epicLine = f32(100 - this.epic_chance);
        if (roll <= this.normal_chance) {
          id = U.Random.RangeInt(0, common_card_max + 1);
          if (id === this.last_picked) id = U.Random.RangeInt(0, common_card_max + 1);
        }
        if (roll > this.normal_chance && roll < epicLine) {
          id = U.Random.RangeInt(20, rare_card_max + 1);
          if (id === this.last_picked) id = U.Random.RangeInt(20, rare_card_max + 1);
        }
        if (roll > epicLine) {
          id = U.Random.RangeInt(40, epic_card_max + 1);
          if (id === this.last_picked) id = U.Random.RangeInt(40, epic_card_max + 1);
        }
        return id;
      };
      let num = Roll();
      if (pickedCards) {
        let guard = 0;   // safety net only; a vanilla hand (<= 9 cards) always finds a free id
        while (pickedCards.includes(num) && guard++ < 100000) num = Roll();
      }
      this.last_picked = num;
      return num;
    }

    ClearShop() {
      for (const go of U.GameObject.FindGameObjectsWithTag(SLS.Tag.ShopCard)) U.Destroy(go);
    }

    // Adds to the run inventory; items with item_equivalence.display get a Card in the inventory bar.
    AddItem(item, quantity) {
      if (!item) return;   // the original would throw here
      const id = item.item_id;
      if (!this.itens.has(id)) {
        if (item.item_equivalence.display && this.card_manager) this.card_manager.CreateCard(item, quantity);
        this.itens.set(id, quantity);
      } else {
        this.itens.set(id, this.itens.get(id) + quantity);
        if (item.item_equivalence.display && this.card_manager) this.card_manager.CreateCard(item, this.itens.get(id));
      }
    }
    // RemoveItem(item, quantity = 1) or RemoveItem(predicate({Key: item, Value: count})) - no callers in the original
    RemoveItem(item, quantity = 1) {
      if (typeof item === 'function') {
        for (const [id, n] of [...this.itens]) if (item({ Key: SLS.ItemDB.get(id), Value: n })) this.itens.delete(id);
        return;
      }
      const id = item && item.item_id !== undefined ? item.item_id : item;
      if (!this.itens.has(id)) return;
      if (quantity < this.itens.get(id)) this.itens.set(id, this.itens.get(id) - quantity);
      else this.itens.delete(id);
    }
    GetItens() { return [...this.itens].map(([id, n]) => ({ Key: SLS.ItemDB.get(id), Value: n })); }
    HasItem(item) { return this.itens.has(item && item.item_id !== undefined ? item.item_id : item); }
    HasItemInQuantity(item, quantity) { const id = item && item.item_id !== undefined ? item.item_id : item; return this.itens.has(id) && this.itens.get(id) >= quantity; }
    GetItemQuantity(item) { const id = item && item.item_id !== undefined ? item.item_id : item; return this.itens.get(id) || 0; }

    // ---- remake UI glue: the shop panel is a U.UI screen
    ShowScreen() {
      if (!this.screen) this.screen = new ShopScreen(this);
      if (!UI.stack.includes(this.screen)) UI.push(this.screen);
      this.screen.rebuild(this.hand, this.reroll);
    }
    HideScreen() { removeScreen(this.screen); }
  }

  // explicit navigation link on a UI button (Unity Navigation.Explicit)
  function setNav(btn, dir, target) {
    if (!btn) return;
    if (!btn.nav) btn.nav = { up: null, down: null, left: null, right: null };
    btn.nav[dir] = target || null;
  }

  // shop panel: hiding it closes the shop screen (CloseShop sets it inactive)
  class ShopPanel extends U.MonoBehaviour {
    OnDisable() { const sm = findShopManager(); if (sm) sm.HideScreen(); }
  }

  // ================================================================ ItemScript (one shop card)
  // title fonts of the transcendence popups (original choices of web-safe families)
  const TITLE_FONTS = {
    godthunder_font: 'Impact, "Arial Black", sans-serif', vampire_font: '"Palatino Linotype", "Book Antiqua", serif',
    ram_font: '"Courier New", monospace', bloody_font: 'Georgia, serif', antiair_font: '"Arial Black", Impact, sans-serif',
    flying_font: '"Trebuchet MS", sans-serif', colossus_font: 'Impact, sans-serif', gnome_font: '"Comic Sans MS", "Trebuchet MS", sans-serif',
    hoarder_font: 'Georgia, serif', protector_font: '"Palatino Linotype", serif', sadistic_font: '"Times New Roman", serif',
    marksman_font: '"Lucida Console", monospace', dealer_font: '"Palatino Linotype", serif', blessed_font: '"Book Antiqua", serif',
    dwarf_font: '"Century Gothic", "Trebuchet MS", sans-serif', burning_font: 'Impact, sans-serif', exorcist_font: '"Book Antiqua", serif',
    comet_font: '"Trebuchet MS", sans-serif', streamer_font: '"Segoe UI", sans-serif', pacman_font: '"Courier New", monospace',
    absorbent_font: 'Verdana, sans-serif', plague_font: '"Times New Roman", serif', speculator_font: 'Georgia, serif',
    bunker_font: '"Arial Black", sans-serif', desperate_font: '"Palatino Linotype", serif', enchanter_font: '"Book Antiqua", serif',
    avenger_font: 'Impact, sans-serif', nerd_font: '"Courier New", monospace', tryhard_font: '"Arial Black", sans-serif',
    bulldozer_font: 'Impact, sans-serif', freezer_font: '"Segoe UI", sans-serif',
  };
  const RARITY_UI = () => SLS.ItemDB.RARITY;

  // GetTranscendents: 31 independent checks in this fixed order (flag, card, font, title colour, condition, effects).
  // pre = before AddItem (Vampire), fx = after CallTranscendence, post = after the achievement (Streamer, Avenger).
  const TRANSCENDENCES = [
    { flag: 'thundergod', card: 60, font: 'godthunder_font', color: 'yellow', test: (p) => p.thunder_projs > 19, fx: (p) => setActive(p.godofthunder_effect, true) },
    { flag: 'vampire', card: 61, font: 'vampire_font', color: 'red', test: (p) => p.life_steal >= K.p36, pre: (p) => { p.life_steal = K.p5; }, fx: (p) => setActive(p.vampire_effect, true) },
    { flag: 'ram_destroyer', card: 62, font: 'ram_font', color: 'green', test: (p) => p.proj_fragments >= 20 },
    { flag: 'bloody_mage', card: 63, font: 'bloody_font', color: 'red', test: (p) => p.wound_lvl > 2, fx: (p) => setActive(p.bloody_effect, true) },
    { flag: 'anti_air', card: 64, font: 'antiair_font', color: 'white', test: (p) => p.friction_lvl > 9 },
    { flag: 'flying', card: 65, font: 'flying_font', color: 'green', test: (p) => p.jump_number > 4, fx: (p) => { p.jump_number = 99999; } },
    { flag: 'colossus', card: 66, font: 'colossus_font', color: 'yellow', test: (p) => p.hp_stacks > 14,
      fx: (p) => { p.max_hp = f32(p.max_hp + p.max_hp); p.hp = p.max_hp; if (p.transform) p.transform.localScale = p.transform.localScale.mul(2); } },
    { flag: 'gnome', card: 67, font: 'gnome_font', color: 'magenta', test: (p) => p.shrink_lvl > 4, fx: (p) => { if (p.player_hat && typeof p.player_hat === 'object') p.player_hat.color = U.Color.red; } },
    { flag: 'hoarder', card: 68, font: 'hoarder_font', color: 'white', test: (p) => p.healing_orb_lvl > 24 },
    { flag: 'protector', card: 69, font: 'protector_font', color: 'yellow', test: (p) => p.shield_lvl > 2 },
    { flag: 'sadistic', card: 70, font: 'sadistic_font', color: 'red', test: (p) => p.armor_stacks > 5 },
    { flag: 'marksman', card: 71, font: 'marksman_font', color: 'white', test: (p) => p.critical_chance >= 30 },
    { flag: 'dealer', card: 72, font: 'dealer_font', color: 'white', test: (p) => p.cards_plus > 4 },
    { flag: 'blessed', card: 73, font: 'blessed_font', color: 'green', test: (p, sm) => sm.rare_chance >= 60,
      fx: (p, sm) => { sm.normal_chance = f32(sm.normal_chance - 5); sm.epic_chance = f32(sm.epic_chance + 5); } },
    { flag: 'white_dwarf', card: 74, font: 'dwarf_font', color: 'white', test: (p) => p.charge_stacks > 4, fx: (p) => { p.proj_size = f32(p.proj_size - f32(p.proj_size * K.p35)); } },
    { flag: 'burning_man', card: 75, font: 'burning_font', color: 'red', test: (p) => p.body_damage >= 60, fx: (p) => setActive(p.burning_effect, true) },
    { flag: 'exorcist', card: 76, font: 'exorcist_font', color: 'cyan', test: (p) => p.soul_orb_level > 5 },
    { flag: 'comet', card: 77, font: 'comet_font', color: 'yellow', test: (p) => p.impulse_stacks > 4 },
    { flag: 'streamer', card: 78, font: 'streamer_font', color: 'blue', test: (p) => p.atk_speed_stacks > 7, post: (p) => setActive(p.streamer_beam, true) },
    { flag: 'pacman', card: 79, font: 'pacman_font', color: 'yellow', test: (p) => p.proj_hits > 7 },
    { flag: 'absorbent', card: 80, font: 'absorbent_font', color: 'white', test: (p) => p.cloak_count > 3 },
    { flag: 'plague_spreader', card: 81, font: 'plague_font', color: 'green', test: (p) => p.hp_regen >= 5 },
    { flag: 'speculator', card: 82, font: 'speculator_font', color: 'yellow', test: (p) => p.critical_multiplier >= 4 },
    { flag: 'bunker', card: 83, font: 'bunker_font', color: 'gray', test: (p) => p.focus_lvl > 2 },
    { flag: 'desperate', card: 84, font: 'desperate_font', color: 'red', test: (p) => p.renew_stacks >= 5 },
    { flag: 'enchanter', card: 85, font: 'enchanter_font', color: 'cyan', test: (p) => p.willo_lvl > 3 },
    { flag: 'avenger', card: 86, font: 'avenger_font', color: 'yellow', test: (p) => p.rage_lvl > 4, post: (p) => { p.revive_count = 1; p.revive_cd = 5; } },
    { flag: 'nerd', card: 87, font: 'nerd_font', color: 'gray', test: (p) => p.tome_lvl >= K.t13 },
    { flag: 'tryhard', card: 88, font: 'tryhard_font', color: 'red', test: (p) => p.atk_stacks > 19 },
    { flag: 'bulldozer', card: 89, font: 'bulldozer_font', color: 'yellow', test: (p) => p.speed_stacks > 7 },
    { flag: 'freezer', card: 90, font: 'freezer_font', color: 'cyan', test: (p) => p.cold_lvl >= 3 },
  ];
  const NAMED = {
    yellow: () => U.Color.yellow, red: () => U.Color.red, green: () => U.Color.green, white: () => U.Color.white,
    magenta: () => U.Color.magenta, cyan: () => U.Color.cyan, blue: () => U.Color.blue, gray: () => U.Color.gray,
  };

  class ItemScript extends U.MonoBehaviour {
    constructor() {
      super();
      this.item_ = null;
      this.item_name_ui = { text: '', color: '#ffffff' };   // stand-ins for the prefab's Text/Image fields
      this.item_desc_ui = { text: '' };
      this.item_icon_ui = { sprite: null };
      this.item_rarity_ui = { color: '#ffffff' };
      this.button = null;
      this.shop_panel = null;
      this.shop_manager = null;
      this.player_stats = null;
      this.wave_manager = null;
      this.transcendence_panel = 'Transcendence';
      this.main_canvas = null;
      Object.assign(this, TITLE_FONTS);
    }
    Awake() {
      this.button = new CardButton(this, 'card');
    }
    Start() {
      if (this.item_) this.SetCard(this.item_);
      this.ItemRarity();
      this.button.onClick = () => this.Buy();
      this.shop_panel = U.GameObject.FindWithTag(SLS.Tag.ShopPanel);
      this.shop_manager = findShopManager();
      this.player_stats = findPlayerStats();
      this.main_canvas = U.GameObject.FindWithTag('MainCanvas');
    }
    SetCard(item) {
      this.item_ = item;
      if (!item) return;
      this.item_name_ui.text = item.name;
      this.item_desc_ui.text = item.desc();
      this.item_icon_ui.sprite = item.item_icon;
    }
    Update() {
      // every offered card removes itself once the shop panel is hidden
      if (this.shop_panel && !this.shop_panel.activeSelf) U.Destroy(this.gameObject);
    }

    // the card's click handler
    Buy() {
      if (!this.item_) return;
      this.BuyCard(this.item_.item_id);
      const ps = this.player_stats;
      if (!ps) return;
      // hat index 4: 20% chance to apply the same card a second time
      if (ps.hat === 4 && U.Random.RangeInt(0, 100) < 20) this.BuyCard(this.item_.item_id);
      // Nerd: every purchase also grants a random common card (0..9)
      if (ps.nerd) this.BuyCard(U.Random.RangeInt(0, 10));
    }

    BuyCard(value) {
      // the unlock key always uses the displayed card's id (also for the Nerd bonus)
      SLS.Save.SetValue('i' + this.item_.item_id + '_Unlocked', true);
      if (!this.player_stats) this.player_stats = findPlayerStats();
      if (!this.shop_manager) this.shop_manager = findShopManager();
      const p = this.player_stats;
      const sm = this.shop_manager;
      if (p) this.ApplyCardEffect(value, p, sm);
      else if (value === 30 && sm) { sm.normal_chance = f32(sm.normal_chance - 5); sm.rare_chance = f32(sm.rare_chance + 5); }

      // inventory: the card itself, or its equivalence (Swift+ = 2x Swift, ...)
      const card = sm ? sm.CardPicker(value) : null;
      if (!card) return;   // the original throws a NullReferenceException here and the shop stays open
      if (!card.item_equivalence.has_equivalence) sm.AddItem(card, 1);
      else sm.AddItem(card.item_equivalence.item, card.item_equivalence.quantity);
      this.GetTranscendents();
      this.CloseShop();    // inlined at the end of BuyCard in the original
    }

    // the stat changes of ItemScript.BuyCard (if/else chain on the id; ids without a case change nothing)
    ApplyCardEffect(value, p, sm) {
      const tome = p.tome_lvl || 0;
      switch (value) {
        case 0: // Swift: speed += speed*0.2*tome + speed*0.2
          p.speed = f32(p.speed + f32(f32(f32(p.speed * K.p2) * tome) + f32(p.speed * K.p2)));
          p.speed_stacks++;
          break;
        case 1: // Catalyst: atk_damage += tome + 1
          p.atk_damage = f32(p.atk_damage + f32(tome + 1));
          p.atk_stacks++;
          break;
        case 2: // Impulse: jump_force += jump_force*0.3*tome + jump_force*0.3
          p.jump_force = f32(p.jump_force + f32(f32(f32(p.jump_force * K.p3) * tome) + f32(p.jump_force * K.p3)));
          p.impulse_stacks++;
          break;
        case 3: { // Resonance: from atk_speed_before, interval -= interval*0.12*tome + interval*0.12
          const pc = findPlayerController(p);
          p.atk_speed = pc ? pc.atk_speed_before : p.atk_speed;
          p.atk_speed = f32(p.atk_speed - f32(f32(f32(p.atk_speed * K.p12) * tome) + f32(p.atk_speed * K.p12)));
          if (pc) pc.atk_speed_before = p.atk_speed;
          p.atk_speed_stacks++;
          break;
        }
        case 4: { // Growth: max_hp += tome*10 + 10, heal the same (capped)
          const add = f32(f32(tome * 10) + 10);
          p.max_hp = f32(p.max_hp + add);
          if (f32(f32(tome * 10) + p.hp) + 10 < p.max_hp) p.hp = f32(p.hp + add);
          else p.hp = p.max_hp;
          p.hp_stacks++;
          break;
        }
        case 5: // Renew
          p.hp = p.max_hp;
          p.renew_stacks = f32(p.renew_stacks + 1);
          break;
        case 6: p.soul_orb_level++; break;                                   // Souls
        case 7: // Resist: armor += tome*4 + 4
          p.armor = f32(p.armor + f32(f32(tome * 4) + 4));
          p.armor_stacks++;
          break;
        case 8: p.critical_chance = f32(p.critical_chance + f32(f32(tome * 5) + 5)); break;   // Eyesight
        case 9: p.proj_hits++; break;                                        // Stability
        case 20: // Cloak
          p.i_window = f32(p.i_window + f32(p.i_window * K.p1));
          p.cloak_count++;
          break;
        case 21: p.jump_number++; break;                                     // Gush
        case 22: // Swift+
          p.speed = f32(p.speed + f32(p.speed * K.p4));
          p.speed_stacks += 2;
          break;
        case 23: { // Resonance+
          const pc = findPlayerController(p);
          p.atk_speed = pc ? pc.atk_speed_before : p.atk_speed;
          p.atk_speed = f32(p.atk_speed - f32(p.atk_speed * K.p24));
          if (pc) pc.atk_speed_before = p.atk_speed;
          p.atk_speed_stacks += 2;
          break;
        }
        case 24: // Growth+
          p.max_hp = f32(p.max_hp + 20);
          if (f32(p.hp + 20) < p.max_hp) p.hp = f32(p.hp + 20); else p.hp = p.max_hp;
          p.hp_stacks += 2;
          break;
        case 25: // Charge
          p.proj_size = f32(p.proj_size + f32(p.proj_size * K.p2));
          p.charge_stacks++;
          break;
        case 26: p.hp_regen = f32(p.hp_regen + 1); break;                    // Regrowth
        case 27: p.life_steal = f32(p.life_steal + K.p03); break;            // Leech
        case 28: p.proj_fragments = f32(p.proj_fragments + 2); break;        // Fragmentation
        case 29: // Catalyst+
          p.atk_damage = f32(p.atk_damage + 2);
          p.atk_stacks += 2;
          break;
        case 30: // Luck: 5 points of shop odds from common to rare
          if (sm) { sm.normal_chance = f32(sm.normal_chance - 5); sm.rare_chance = f32(sm.rare_chance + 5); }
          break;
        case 31: { // Thunderbolt
          p.thunder_projs += 2;
          const pc = comp(U.GameObject.Find('Player'), 'PlayerController') || findPlayerController(p);
          if (pc) pc.thunder_cooldown = 0;
          break;
        }
        case 32: p.healing_orb_lvl += 5; break;                              // Orb
        case 33: p.critical_multiplier = f32(p.critical_multiplier + K.p5); break;   // Precision
        case 34: { // Shrink: localScale -= localScale*0.1
          const t = p.transform;
          if (t) {
            const s = t.localScale;
            t.localScale = new U.Vector3(f32(s.x - f32(s.x * K.p1)), f32(s.y - f32(s.y * K.p1)), f32(s.z - f32(s.z * K.p1)));
          }
          p.shrink_lvl++;
          break;
        }
        case 35: p.friction_lvl++; break;                                    // Friction
        case 36: p.rage_lvl++; break;                                        // Rage
        case 40: // Growth++
          p.max_hp = f32(p.max_hp + 40);
          if (f32(p.hp + 40) < p.max_hp) p.hp = f32(p.hp + 40); else p.hp = p.max_hp;
          p.hp_stacks += 4;
          break;
        case 41: { // Will-O-Wisp: spawn a wisp at the player, then willo_lvl++ and number the wisp
          const wisp = spawnWisp(p);
          p.willo_lvl++;
          const w = wisp ? comp(wisp, 'WilloWsip') : null;
          if (w) w.willo_number = p.willo_lvl;
          break;
        }
        case 42: p.friction_lvl += 3; break;                                 // Friction+
        case 43: p.cold_lvl++; break;                                        // Cold
        case 44: p.proj_fragments = f32(p.proj_fragments + 6); break;        // Fragmentation+
        case 45: // Overheat
          p.body_damage = f32(p.body_damage + 20);
          setActive(p.overheat, true);
          break;
        case 46: p.life_steal = f32(p.life_steal + K.p09); break;            // Leech+
        case 47: { // Thunderbolt+
          p.thunder_projs += 6;
          const pc = comp(U.GameObject.Find('Player'), 'PlayerController') || findPlayerController(p);
          if (pc) pc.thunder_cooldown = 0;
          break;
        }
        case 48: p.cards_plus++; break;                                      // Appraisal
        case 49: p.shield_lvl++; break;                                      // Barrier
        case 50: p.focus_lvl++; break;                                       // Focus
        case 51: p.tome_lvl = f32(p.tome_lvl + K.p35); break;                // Tome
        case 52: p.wound_lvl++; break;                                       // Wound
        default: break;   // 10-19, 37-39, >= 53: no effect
      }
    }

    CloseShop() {
      ShopManager.OnScreen = false;
      invokeOnOpen(false);
      const wm = findWaveManager();
      this.wave_manager = wm;
      if (wm) setActive(wm.shop_audio, false);
      // buy_card_audio at 0.5 through the WaveManager's audio source
      if (wm && wm.audio_source && typeof wm.audio_source.PlayOneShot === 'function') wm.audio_source.PlayOneShot(wm.buy_card_audio || 'buy', 0.5);
      else SLS.sfx('buy');
      if (wm && typeof wm.StartWave === 'function') wm.StartWave();
      else U.Time.timeScale = 1;   // no wave module yet: StartWave would restore the time scale
      setActive(this.shop_panel || (this.shop_manager && this.shop_manager.shop_panel), false);
    }

    ItemRarity() {
      if (!this.item_) return;
      const R = RARITY_UI();
      const r = this.item_.rarity;
      if (r === 0 || r === 1 || r === 2) {
        this.item_rarity_ui.color = R[r].frame;
        this.item_name_ui.color = R[r].name;   // rarity 2: magenta frame, yellow name
      }
    }

    GetTranscendents() {
      const p = this.player_stats;
      const sm = this.shop_manager;
      if (!p || !sm) return;
      for (const t of TRANSCENDENCES) {
        if (!t.test(p, sm) || p[t.flag]) continue;
        p[t.flag] = true;
        if (t.pre) t.pre(p, sm);
        const card = sm['card' + t.card];
        sm.AddItem(card, 1);
        this.CallTranscendence(this[t.font], NAMED[t.color](), card);
        if (t.fx) t.fx(p, sm);
        this.AscencionAchievment();
        if (t.post) t.post(p, sm);
      }
    }

    CallTranscendence(fnt, cor, card) {
      const go = U.Instantiate(this.transcendence_panel, null, null, this.main_canvas ? this.main_canvas.transform : null);
      const t = go.GetComponent(Transcendence);
      SLS.Save.SetValue('i' + card.item_id + '_Unlocked', true);   // unlocks the encyclopedia entry
      t.item_card = card;
      t.title_color = cor;
      t.title_font = fnt;
    }

    AscencionAchievment() { /* Steam achievement "achiev_02" in the original; no platform achievements in the remake */ }

    // sets only the non-null sides (accepts ItemScripts or UI buttons)
    SetNavigation(up, down, left, right) {
      const b = (x) => (x instanceof ItemScript ? x.button : x);
      if (up) setNav(this.button, 'up', b(up));
      if (down) setNav(this.button, 'down', b(down));
      if (left) setNav(this.button, 'left', b(left));
      if (right) setNav(this.button, 'right', b(right));
    }
  }

  function spawnWisp(p) {
    const w = p.willowisp;
    const name = typeof w === 'string' ? w : (w && (w.prefab || w.prefabName)) || 'WIllowisp';
    if (!SLS.Prefabs[name] || !p.transform) return null;
    try { return SLS.spawn(name, p.transform.position, U.Quaternion.identity); } catch (e) { U.reportError(e, null, 'spawn ' + name); return null; }
  }

  // ================================================================ RerollCard
  class RerollCard extends U.MonoBehaviour {
    constructor() {
      super();
      this.shop_manager = null;
      this.progression_manager = null;
      this.player_stats = null;
      this.card_desc = { text: null };        // null: default text; set to the free label when rerolls are free
      this.soul_img = { color: U.Color.white };
      this.Btn = null;
    }
    get IsInteractable() {
      const p = this.player_stats;
      if (p && (p.dealer || p.hat === 5)) return true;
      return !!this.progression_manager && this.progression_manager.soul_orbs >= REROLL_COST;
    }
    get isFree() { const p = this.player_stats; return !!p && (!!p.dealer || p.hat === 5); }
    Awake() {
      this.shop_manager = findShopManager();
      this.progression_manager = findProgression();
      this.player_stats = findPlayerStats();
      this.Btn = new CardButton(this, 'reroll');
      this.Btn.onClick = () => this.RefreshShop();   // wired in the prefab
      if (!this.isFree) {
        this.Btn.enabled = !!this.progression_manager && this.progression_manager.soul_orbs >= REROLL_COST;
      } else {
        this.card_desc.text = 'shop.rerollFree';
        this.soul_img.color = new U.Color(0, 0, 0, 0);
      }
    }
    RefreshShop() {
      if (!this.isFree) {
        const pm = this.progression_manager;
        if (!pm) return;
        pm.soul_orbs -= REROLL_COST;
        SLS.Save.SetValue('soul_orbs', pm.soul_orbs);
        if (pm.soul_orbs < REROLL_COST) {
          this.Btn.enabled = false;
          const nav = this.Btn.nav || {};
          if (nav.left) {
            const screen = findShopManager() && findShopManager().screen;
            if (screen && screen.selected === this.Btn) screen.select(nav.left, true);
            // The original patches the neighbours through nav.selectOnUp for all four sides. With 5 or fewer
            // cards there is no "up" neighbour and that patch throws a NullReferenceException, so the hand is
            // NOT redrawn: the last affordable reroll only spends the souls (reproduced; see REPRODUCE_*).
            const up = nav.up;
            if (!up) { if (RerollCard.REPRODUCE_LAST_REROLL_QUIRK) return; }
            else {
              if (nav.up) setNav(up, 'down', null);
              if (nav.down) setNav(up, 'up', null);
              if (nav.left) setNav(up, 'right', null);
              if (nav.right) setNav(up, 'left', null);
            }
            this.Btn.nav = { up: null, down: null, left: null, right: null };
          }
        } else {
          this.Btn.enabled = true;
        }
      }
      if (this.shop_manager) this.shop_manager.StartShop();
    }
  }
  RerollCard.REPRODUCE_LAST_REROLL_QUIRK = true;

  // ================================================================ inventory bar: CardManager + Card
  const BAR = { x: 22, bottom: 1058, size: 56, gap: 8, perRow: 16 };
  const OUTLINE_IDLE = () => new U.Color(0.4, 0.4, 0.4, 0.6);
  let popupInstance = null;   // fallback ItemPopup (used when the HUD module does not provide showItemPopup)

  class CardManager extends U.MonoBehaviour {
    constructor() {
      super();
      this.cards = new Map();     // Item -> Card, in creation order
      this.cardPrefab = 'Card';
      this.popup = null;
    }
    Awake() { this.popup = popupInstance; }
    CreateCard(item, quantity) {
      if (!this.cards.has(item)) {
        const go = U.Instantiate(this.cardPrefab, null, null, this.transform);
        const card = go.GetComponent(Card);
        card.Set(item, quantity, this);
        this.cards.set(item, card);
      } else {
        this.EditCard(item, quantity);
      }
    }
    EditCard(item, quantity) {
      const c = this.cards.get(item);
      if (c) c.SetText(quantity);
    }
    // shows / hides the item tooltip (ItemPopup.SetItem + SetActive in the original) through SLS.UIHooks.showItemPopup;
    // the optional second argument is the hovered slot (UI pixels) so the hook can hide itself when the mouse leaves
    EnablePopup(value, item, rect) {
      const hooks = SLS.UIHooks;
      const fn = hooks && typeof hooks.showItemPopup === 'function' ? hooks.showItemPopup : fallbackShowItemPopup;
      try { fn(value && item ? item.item_id : null, value && rect ? { x: rect.x, y: rect.y, w: rect.w, h: rect.h } : undefined); }
      catch (e) { U.reportError(e, this, 'UIHooks.showItemPopup'); }
    }
    GetCards() { return [...this.cards.values()]; }
    SlotRect(i) {
      const row = Math.floor(i / BAR.perRow), col = i % BAR.perRow;
      return { x: BAR.x + col * (BAR.size + BAR.gap), y: BAR.bottom - BAR.size - row * (BAR.size + BAR.gap), w: BAR.size, h: BAR.size };
    }
    // pointer enter/exit on the slots (Card.OnPointerEnter / OnPointerExit), during play and in the shop
    Update() {
      const m = U.Input.mouse;
      const top = UI.top();
      const allow = CardManager.drawBar && m.inside && U.Input.lastDevice !== 'gamepad' && (!top || top instanceof ShopScreen);
      let i = 0;
      for (const card of this.cards.values()) {
        const r = this.SlotRect(i++);
        card.rect = r;
        const over = allow && m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
        if (over && !card.hovered) { card.hovered = true; card.OnPointerEnter(); }
        else if (!over && card.hovered) { card.hovered = false; card.OnPointerExit(); }
      }
    }
    DrawBar(ctx) {
      let i = 0;
      for (const card of this.cards.values()) drawSlot(ctx, card, this.SlotRect(i++));
      const p = popupInstance;
      if (p && p.gameObject.activeSelf && p.item) drawTooltip(ctx, p);
    }
  }
  CardManager.drawBar = true;   // set false if the HUD module draws the inventory itself
  CardManager.BAR = BAR;

  class Card extends U.MonoBehaviour {
    constructor() {
      super();
      this.card_manager = null;
      this.outlineImage = { color: OUTLINE_IDLE() };
      this.item = null;
      this.icon = { sprite: null };
      this.quantity = { text: '' };
      this.hovered = false;
      this.rect = null;
    }
    Awake() { this.outlineImage.color = OUTLINE_IDLE(); }
    Set(item, quantity, card_manager) {
      this.item = item;
      this.icon.sprite = item.item_icon;
      this.quantity.text = U.Str.Format('{0}', quantity);
      this.card_manager = card_manager;
    }
    SetText(quantity) { this.quantity.text = U.Str.Format('{0}', quantity); }
    OnPointerEnter() {
      this.outlineImage.color = U.Color.white;
      if (this.card_manager) this.card_manager.EnablePopup(true, this.item, this.rect);
    }
    OnPointerExit() {
      this.outlineImage.color = OUTLINE_IDLE();
      if (this.card_manager) this.card_manager.EnablePopup(false, this.item, this.rect);
    }
  }

  // draws the bar in screen space after the world (under the HUD and the UI screens)
  class InventoryBarRenderer extends U.Renderer2D {
    constructor() { super(); this.sortingOrder = 100000; }
    drawWorld(ctx) {
      const cm = this.gameObject.GetComponent(CardManager);
      if (!cm || !CardManager.drawBar || (!cm.cards.size && !(popupInstance && popupInstance.gameObject.activeSelf))) return;
      const sm = findShopManager();
      if (sm && sm.screen && UI.stack.includes(sm.screen)) return;   // the shop screen draws the bar above its dim
      const R = U.Render, v = R.view, dpr = R.dpr || 1, s = v.w / 1920 * dpr;
      ctx.save();
      ctx.setTransform(s, 0, 0, s, v.x * dpr, v.y * dpr);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      cm.DrawBar(ctx);
      ctx.restore();
    }
  }

  // ================================================================ ItemPopup (inventory tooltip fallback)
  class ItemPopup extends U.MonoBehaviour {
    constructor() {
      super();
      this._mainCam = null;
      this._parentCanvas = null;
      this.title_text = { text: '' };
      this.description_text = { text: '' };
      this.item = null;
      this.x = 0;
      this.y = 0;
    }
    Awake() { popupInstance = this; }
    Update() { this.x = U.Input.mouse.x; this.y = U.Input.mouse.y; }   // follows the mouse
    SetItem(item) {
      if (!item) return;
      this.item = item;
      this.title_text.text = item.name;
      this.description_text.text = item.desc();
    }
  }
  function fallbackShowItemPopup(itemId) {
    const p = popupInstance;
    if (!p) return;
    const it = itemId === null || itemId === undefined ? null : SLS.ItemDB.get(itemId);
    if (it) p.SetItem(it);
    p.x = U.Input.mouse.x; p.y = U.Input.mouse.y;
    p.gameObject.SetActive(!!it);
  }
  fallbackShowItemPopup.isItemsFallback = true;

  // ================================================================ Transcendence (popup)
  let transOnScreen = false;
  class Transcendence extends U.MonoBehaviour {
    static get OnScreen() { return transOnScreen; }
    static set OnScreen(v) { transOnScreen = !!v; }
    constructor() {
      super();
      this.item_card = null;
      this.button = null;
      this.title_name = { text: '' };
      this.title_color = U.Color.white;
      this.title_font = U.UI.FONT_TITLE;
      this.card_name = { text: '' };
      this.card_description = { text: '' };
      this.card_icon = { sprite: null };
      this.transcend_audio = 'transcend';
      this.button_audio = 'uiClick';
      this.audio_source = null;
      this.screen = null;
    }
    Awake() { Transcendence.OnScreen = true; }
    OnDestroy() { Transcendence.OnScreen = false; removeScreen(this.screen); }
    Start() {
      U.Time.timeScale = 0;
      const it = this.item_card;
      this.title_name.text = it ? it.name : '';
      this.card_name.text = it ? it.name : '';
      this.card_description.text = it ? it.desc() : '';
      this.card_icon.sprite = it ? it.item_icon : null;
      SLS.sfx(this.transcend_audio);   // transcend_audio at 0.55
      this.screen = new TranscendenceScreen(this);
      UI.push(this.screen);
      this.button = this.screen.button;
      this.screen.select(this.button, true);
    }
    Update() { muteMusic(); }
    ContinueGame() {
      U.Time.timeScale = 1;
      if (U.Audio && U.Audio.stopSfx) U.Audio.stopSfx();   // audio_source.Stop(): cuts the Transcend jingle
      SLS.sfx(this.button_audio);
      restoreMusic();
      removeScreen(this.screen);
      U.Destroy(this.gameObject);
    }
  }

  // ================================================================ drawing (original card design)
  function cardColors(owner, kind) {
    if (kind === 'reroll') {
      const off = !owner.Btn || !owner.Btn.enabled;
      return { frame: off ? '#59627d' : '#8fd3ff', name: off ? '#9aa3bb' : '#d8f1ff', glow: 'rgba(143,211,255,0.6)', icon: off ? '#6f7a96' : '#9fd8ff', top: '#1b2443', bottom: '#0b1022' };
    }
    const it = owner.item_ || owner.item_card;
    const R = RARITY_UI();
    const r = it ? Math.min(it.rarity, 3) : 0;
    const pal = R[r] || R[0];
    return {
      frame: kind === 'trans' ? pal.frame : (owner.item_rarity_ui ? owner.item_rarity_ui.color : pal.frame),
      name: kind === 'trans' ? cssColor(owner.title_color) : (owner.item_name_ui ? owner.item_name_ui.color : pal.name),
      glow: pal.glow, icon: it ? it.iconColor : '#fff', top: '#2b1e48', bottom: '#110b20',
    };
  }

  function drawDiamond(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill(); }

  // full card: frame, medallion + glyph, name, description, footer
  function drawCard(ctx, x, y, w, h, o) {
    const hover = o.hover || 0;
    const t = U.Time.unscaledTime;
    const cx = x + w / 2;
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    // lift and grow when selected
    const lift = 12 * hover, sc = 1 + 0.045 * hover;
    ctx.translate(cx, y + h / 2 - lift);
    ctx.scale(sc, sc);
    ctx.translate(-cx, -(y + h / 2));
    // body
    ctx.save();
    if (hover > 0.01) { ctx.shadowColor = o.glow; ctx.shadowBlur = 34 * hover; }
    UI.roundRect(ctx, x, y, w, h, 22);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, o.top); g.addColorStop(1, o.bottom);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    UI.roundRect(ctx, x, y, w, h, 22); ctx.stroke();
    // inner frame
    ctx.save();
    ctx.strokeStyle = o.frame;
    ctx.lineWidth = 3 + 1.5 * hover;
    if (o.dashed) ctx.setLineDash([16, 10]);
    UI.roundRect(ctx, x + 10, y + 10, w - 20, h - 20, 15); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = o.frame;
    for (const [dx, dy] of [[14, 14], [w - 14, 14], [14, h - 14], [w - 14, h - 14]]) drawDiamond(ctx, x + dx, y + dy, 6);
    // medallion
    const my = y + h * 0.29, mr = Math.min(w, h) * 0.235;
    const rg = ctx.createRadialGradient(cx, my, mr * 0.2, cx, my, mr * 1.5);
    rg.addColorStop(0, hexA(o.frame, 0.32)); rg.addColorStop(1, hexA(o.frame, 0));
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, my, mr * 1.5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(12,8,24,0.92)'; ctx.beginPath(); ctx.arc(cx, my, mr, 0, TAU); ctx.fill();
    ctx.strokeStyle = o.frame; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, my, mr, 0, TAU); ctx.stroke();
    ctx.save();
    ctx.translate(cx, my); ctx.rotate(t * 0.25 * (o.spin || 1));
    ctx.strokeStyle = hexA(o.frame, 0.55); ctx.lineWidth = 2;
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (mr + 6), Math.sin(a) * (mr + 6)); ctx.lineTo(Math.cos(a) * (mr + (k % 2 ? 11 : 15)), Math.sin(a) * (mr + (k % 2 ? 11 : 15))); ctx.stroke(); }
    ctx.restore();
    if (o.symbol) SLS.Art.icon(ctx, o.symbol, cx, my, mr * 1.25, o.icon);
    // name
    UI.text(ctx, o.name || '', cx, y + h * 0.555, { size: Math.round(w * 0.112), align: 'center', baseline: 'middle', bold: true,
      font: o.nameFont || UI.FONT_TITLE, color: o.nameColor, fitWidth: w - 40, outline: 'rgba(0,0,0,0.85)', outlineWidth: 5 });
    // divider
    ctx.strokeStyle = hexA(o.frame, 0.6); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - w * 0.3, y + h * 0.615); ctx.lineTo(cx - 10, y + h * 0.615); ctx.moveTo(cx + 10, y + h * 0.615); ctx.lineTo(cx + w * 0.3, y + h * 0.615); ctx.stroke();
    ctx.fillStyle = o.frame; drawDiamond(ctx, cx, y + h * 0.615, 5);
    // description
    UI.text(ctx, o.desc || '', cx, y + h * 0.645, { size: Math.round(w * 0.076), align: 'center', color: '#ebe4f8',
      maxWidth: w - 46, fitHeight: h * 0.235, lineHeight: 1.16 });
    // unavailable: an opaque dark veil (the cost stays readable on top)
    if (o.disabled) { UI.roundRect(ctx, x, y, w, h, 22); ctx.fillStyle = 'rgba(6,4,14,0.55)'; ctx.fill(); }
    // footer
    if (o.footer) o.footer(ctx, cx, y + h - 36);
    ctx.restore();
  }
  // '#rrggbb' -> rgba string
  function hexA(hex, a) {
    if (typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) return 'rgba(255,255,255,' + a + ')';
    const n = parseInt(hex.slice(1, 7), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function rarityFooter(it, frame) {
    return (ctx, cx, fy) => {
      ctx.fillStyle = frame;
      const n = Math.min(it.rarity, 3) + 1;
      for (let k = 0; k < n; k++) drawDiamond(ctx, cx - (n - 1) * 8 + k * 16, fy - 16, 4.5);
      UI.text(ctx, SLS.ItemDB.rarityName(it.rarity).toUpperCase(), cx, fy + 4, { size: 18, align: 'center', baseline: 'middle', bold: true, color: hexA(frame, 0.9) });
    };
  }
  function drawShopCard(ctx, btn, selected) {
    const owner = btn.owner;
    const hover = btn.hoverT || 0;
    if (btn.kind === 'reroll') {
      const c = cardColors(owner, 'reroll');
      const free = owner.card_desc && owner.card_desc.text;
      const pm = owner.progression_manager;
      drawCard(ctx, btn.x, btn.y, btn.w, btn.h, {
        hover, glow: c.glow, frame: c.frame, top: c.top, bottom: c.bottom, icon: c.icon, symbol: 'reroll', spin: -1,
        dashed: true, disabled: !btn.enabled, name: SLS.T('shop.reroll'), nameColor: c.name, desc: SLS.T('shop.rerollDesc'),
        footer: (ctx2, cx, fy) => {
          if (free) {
            UI.text(ctx2, SLS.T(free), cx, fy - 4, { size: 24, align: 'center', baseline: 'middle', bold: true, color: '#ffd36b', outline: 'rgba(0,0,0,0.8)' });
          } else {
            const ok = pm && pm.soul_orbs >= REROLL_COST;
            SLS.Art.icon(ctx2, 'soul', cx - 22, fy - 6, 34, '#9fd8ff');
            UI.text(ctx2, String(REROLL_COST), cx + 4, fy - 6, { size: 30, baseline: 'middle', bold: true, color: ok ? '#ffffff' : '#ff6b6b', outline: 'rgba(0,0,0,0.8)' });
          }
        },
      });
      return;
    }
    const it = owner.item_;
    if (!it) return;
    const c = cardColors(owner, 'card');
    drawCard(ctx, btn.x, btn.y, btn.w, btn.h, {
      hover, glow: c.glow, frame: c.frame, top: c.top, bottom: c.bottom, icon: c.icon, symbol: it.symbol,
      name: it.name, nameColor: c.name, desc: it.desc(), footer: rarityFooter(it, c.frame),
    });
  }

  class CardButton extends UI.Button {
    constructor(owner, kind) {
      super({ x: 0, y: 0, w: 300, h: 430, label: '', sound: kind === 'reroll' ? 'uiClick' : 'none' });
      this.owner = owner;
      this.kind = kind;
      this.nav = { up: null, down: null, left: null, right: null };   // explicit navigation, like the prefabs
      this.drawCustom = drawShopCard;
    }
    get visible() { return !this.owner || !this.owner.gameObject || !this.owner.gameObject._destroyed; }
    set visible(v) { /* driven by the owner */ }
  }

  function drawSoulCounter(ctx, x, y, souls) {
    const w = 210, h = 58;
    UI.panel(ctx, x - w, y, w, h, { radius: 29, fill: 'rgba(14,10,30,0.88)', stroke: '#8fd3ff', border: 2 });
    SLS.Art.icon(ctx, 'soul', x - w + 36, y + h / 2, 38, '#9fd8ff');
    UI.text(ctx, String(souls), x - 22, y + h / 2 + 1, { size: 32, align: 'right', baseline: 'middle', bold: true, color: '#ffffff', outline: 'rgba(0,0,0,0.8)' });
  }

  function drawSlot(ctx, card, r) {
    const it = card.item;
    if (!it) return;
    ctx.save();
    UI.roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fillStyle = 'rgba(14,10,26,0.82)'; ctx.fill();
    ctx.lineWidth = card.hovered ? 3 : 2.5;
    ctx.strokeStyle = cssColor(card.outlineImage.color); ctx.stroke();
    ctx.fillStyle = hexA(it.color, 0.85);
    ctx.fillRect(r.x + 10, r.y + r.h - 6, r.w - 20, 3);
    SLS.Art.icon(ctx, it.symbol, r.x + r.w / 2, r.y + r.h / 2 - 2, r.w * 0.6, it.iconColor);
    UI.text(ctx, card.quantity.text, r.x + r.w - 4, r.y + r.h - 1, { size: 20, align: 'right', baseline: 'bottom', bold: true, color: '#ffffff', outline: 'rgba(0,0,0,0.95)', outlineWidth: 4 });
    ctx.restore();
  }

  function drawTooltip(ctx, p) {
    const it = p.item;
    const w = 400, pad = 18;
    ctx.save();
    ctx.font = UI.font(22);
    const lines = UI.wrap(ctx, p.description_text.text || it.desc(), w - pad * 2);
    const h = 64 + lines.length * 22 * 1.18 + pad;
    let x = p.x + 22, y = p.y - h - 18;
    if (x + w > 1910) x = p.x - w - 22;
    if (y < 10) y = p.y + 24;
    UI.panel(ctx, x, y, w, h, { radius: 14, fill: 'rgba(16,11,30,0.95)', stroke: it.color, border: 2 });
    SLS.Art.icon(ctx, it.symbol, x + pad + 18, y + pad + 18, 34, it.iconColor);
    UI.text(ctx, p.title_text.text || it.name, x + pad + 46, y + pad + 18, { size: 28, baseline: 'middle', bold: true, font: UI.FONT_TITLE, color: it.nameColor, fitWidth: w - pad * 2 - 50 });
    UI.text(ctx, p.description_text.text || it.desc(), x + pad, y + 58, { size: 22, color: '#ebe4f8', maxWidth: w - pad * 2 });
    ctx.restore();
  }

  // ================================================================ ShopScreen (the shop panel)
  class ShopScreen extends UI.Screen {
    constructor(manager) {
      super();
      this.manager = manager;
      this.overlay = true;
      this.dim = 0.68;
      this.blockCancel = true;     // the shop cannot be dismissed: one card must be taken
      this.keepSelection = true;   // like Unity's EventSystem, moving the mouse away keeps the selection
    }
    rebuild(cards, reroll) {
      this.elements = [];
      const buttons = cards.filter(alive).map((c) => c.button);
      if (reroll && reroll.Btn) buttons.push(reroll.Btn);
      const n = buttons.length, rows = Math.ceil(n / 5);
      const w = rows > 1 ? 284 : 300, h = rows > 1 ? 404 : 430, gx = rows > 1 ? 30 : 36, gy = 26;
      const top = rows > 1 ? 162 : Math.round(560 - h / 2 + 18);
      for (let r = 0; r < rows; r++) {
        const row = buttons.slice(r * 5, r * 5 + 5);
        const rowW = row.length * w + (row.length - 1) * gx;
        let x = Math.round(960 - rowW / 2);
        for (const b of row) { b.x = x; b.y = top + r * (h + gy); b.w = w; b.h = h; b.hoverT = 0; this.add(b); x += w + gx; }
      }
      this.defaultSelected = buttons[0] || null;
      // the original selects the first card in the EventSystem when the shop opens
      if (buttons[0]) { this.selected = null; this.select(buttons[0], true); }
    }
    drawBack(ctx) {
      const t = U.Time.unscaledTime;
      // header band
      const g = ctx.createLinearGradient(0, 0, 0, 150);
      g.addColorStop(0, 'rgba(10,6,22,0.85)'); g.addColorStop(1, 'rgba(10,6,22,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 150);
      UI.text(ctx, SLS.T('shop.title'), 960, 62, { size: 64, align: 'center', baseline: 'middle', bold: true, font: UI.FONT_TITLE,
        color: '#ffd36b', outline: 'rgba(30,12,40,0.95)', outlineWidth: 8, shadow: 'rgba(255,190,90,0.55)', shadowBlur: 18 });
      const wm = findWaveManager();
      const cleared = wm ? (wm.wave_number | 0) - 1 : 0;
      UI.text(ctx, cleared > 0 ? SLS.T('shop.subtitle', cleared) : SLS.T('shop.subtitle0'), 960, 114, { size: 26, align: 'center', baseline: 'middle', color: '#d9cff2' });
      ctx.strokeStyle = 'rgba(255,211,107,0.55)'; ctx.lineWidth = 2;
      const sw = 300 + Math.sin(t * 1.5) * 6;
      ctx.beginPath(); ctx.moveTo(960 - sw, 92); ctx.lineTo(960 - 18, 92); ctx.moveTo(960 + 18, 92); ctx.lineTo(960 + sw, 92); ctx.stroke();
      ctx.fillStyle = '#ffd36b'; drawDiamond(ctx, 960, 92, 6);
      const pm = findProgression();
      if (pm) drawSoulCounter(ctx, 1890, 32, pm.soul_orbs);
    }
    // the inventory bar stays readable (and hoverable) while choosing
    drawFront(ctx) {
      const cm = this.manager && this.manager.card_manager;
      if (cm && CardManager.drawBar && cm.cards.size) cm.DrawBar(ctx);
    }
  }

  // ================================================================ TranscendenceScreen (the popup)
  class TranscendenceScreen extends UI.Screen {
    constructor(trans) {
      super();
      this.trans = trans;
      this.overlay = true;
      this.dim = 0.74;
      this.blockCancel = true;
      this.button = this.add(new UI.Button({ x: 960 - 170, y: 962, w: 340, h: 78, label: SLS.T('trans.continue'), size: 36, sound: 'none',
        onClick: () => this.trans.ContinueGame() }));
      this.defaultSelected = this.button;
    }
    update() { this.button.label = SLS.T('trans.continue'); }
    drawBack(ctx) {
      const tr = this.trans, it = tr.item_card;
      const t = U.Time.unscaledTime;
      const col = cssColor(tr.title_color);
      const a = Math.min(1, this.age * 2.5);
      ctx.save();
      ctx.globalAlpha = a;
      // rotating rays of light
      ctx.save();
      ctx.translate(960, 470);
      ctx.rotate(t * 0.15);
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 18; k++) {
        ctx.rotate(TAU / 18);
        const gr = ctx.createLinearGradient(0, 0, 0, -760);
        gr.addColorStop(0, hexA(it ? it.iconColor : '#ffffff', 0.16)); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-48, -760); ctx.lineTo(48, -760); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      U.Render.drawGlow(ctx, 960, 470, 360, it ? it.iconColor : '#ffffff', 0.35);
      // header + title in the transcendence colour and font
      UI.text(ctx, SLS.T('trans.header').toUpperCase(), 960, 64, { size: 34, align: 'center', baseline: 'middle', bold: true, color: '#ffd36b', outline: 'rgba(0,0,0,0.85)' });
      UI.text(ctx, SLS.T('trans.sub'), 960, 104, { size: 24, align: 'center', baseline: 'middle', italic: true, color: '#d9cff2' });
      const pulse = 1 + 0.03 * Math.sin(t * 3);
      ctx.save();
      ctx.translate(960, 172); ctx.scale(pulse, pulse);
      UI.text(ctx, it ? it.name : '', 0, 0, { size: 76, align: 'center', baseline: 'middle', bold: true, font: tr.title_font || UI.FONT_TITLE,
        color: col, outline: 'rgba(10,6,20,0.95)', outlineWidth: 10, shadow: col, shadowBlur: 24, fitWidth: 1500 });
      ctx.restore();
      if (it) {
        const pal = SLS.ItemDB.RARITY[3];
        drawCard(ctx, 960 - 170, 238, 340, 480, {
          hover: 0.6 + 0.2 * Math.sin(t * 2), glow: pal.glow, frame: pal.frame, top: '#2e2040', bottom: '#120a1e', icon: it.iconColor,
          symbol: it.symbol, name: it.name, nameColor: col, nameFont: tr.title_font, desc: it.desc(), footer: rarityFooter(it, pal.frame),
        });
        UI.panel(ctx, 960 - 470, 776, 940, 156, { radius: 18, fill: 'rgba(14,9,28,0.88)', stroke: 'rgba(255,211,107,0.7)', border: 2 });
        UI.text(ctx, it.fullDesc(), 960, 854, { size: 26, align: 'center', baseline: 'middle', color: '#ece6fa', maxWidth: 880, fitHeight: 134 });
      }
      ctx.restore();
    }
  }

  // ================================================================ prefabs (Instantiate by original name)
  SLS.registerPrefab('ShopCard', (go) => { go.tag = SLS.Tag.ShopCard; go.layer = SLS.Layer.UI; go.AddComponent(ItemScript); });
  SLS.registerPrefab('RefreshCards', (go) => { go.tag = SLS.Tag.ShopCard; go.layer = SLS.Layer.UI; go.AddComponent(RerollCard); });
  SLS.registerPrefab('Transcendence', (go) => { go.layer = SLS.Layer.UI; go.AddComponent(Transcendence); });
  SLS.registerPrefab('Card', (go) => { go.layer = SLS.Layer.UI; go.AddComponent(Card); });

  // ================================================================ exports
  Object.assign(SLS, { ShopManager, ItemScript, RerollCard, CardManager, Card, ItemPopup, Transcendence, ShopScreen, TranscendenceScreen });
  SLS.ShopArt = { drawCard, drawSlot, hexA };
  SLS.UIHooks = SLS.UIHooks || {};

  // ---------------------------------------------------------------- boot (order 40: shop/items)
  onBoot(40, () => {
    const popupGo = new U.GameObject('ItemPopup', { layer: SLS.Layer.UI, active: false });
    popupGo.AddComponent(ItemPopup);
    popupGo.SetActive(true);    // runs Awake (registers the instance), then hide it
    popupGo.SetActive(false);

    const panel = new U.GameObject('ShopPanel', { tag: SLS.Tag.ShopPanel, layer: SLS.Layer.UI, active: false });
    panel.AddComponent(ShopPanel);

    const cmGo = new U.GameObject('CardManager', { layer: SLS.Layer.UI });
    const cm = cmGo.AddComponent(CardManager);
    cmGo.AddComponent(InventoryBarRenderer);
    cm.popup = popupInstance;

    const smGo = new U.GameObject('ShopManager', { tag: SLS.Tag.ShopManager });
    const sm = smGo.AddComponent(ShopManager);
    sm.shop_panel = panel;
    sm.card_manager = cm;
  });
  // the inventory tooltip: our ItemPopup unless the HUD/menus module already provides the hook
  onBoot(89, () => {
    SLS.UIHooks = SLS.UIHooks || {};
    if (typeof SLS.UIHooks.showItemPopup !== 'function') SLS.UIHooks.showItemPopup = fallbackShowItemPopup;
  });

  // ---------------------------------------------------------------- test support (?test=shop)
  // A stub player is created only when the player module did not provide PlayerStats.
  class PlayerStatsStub extends U.MonoBehaviour {
    constructor() {
      super();
      for (const [k, v] of Object.entries(PS0)) if (v === null || typeof v !== 'object') this[k] = v;
      const staff = SLS.ItemDB.get(300), hat = SLS.ItemDB.get(200);
      if (staff) this.atk_speed = staff.attackSpeed;
      if (hat) { this.speed = hat.speed; this.armor = hat.armor; this.jump_number = hat.jumpNumber; }
      this.hp = this.max_hp;
      this.isAlive = true;
      this.willowisp = 'WIllowisp';
    }
  }
  PlayerStatsStub.csName = 'PlayerStats';
  class PlayerControllerStub extends U.MonoBehaviour {
    constructor() { super(); this.atk_speed_before = 0; this.thunder_cooldown = 8; }
  }
  PlayerControllerStub.csName = 'PlayerController';

  function buildStubPlayer() {
    const P = F.player || {};
    const go = new U.GameObject('Player', { tag: SLS.Tag.Player, layer: SLS.Layer.Player, active: false });
    const tf = P.transform;
    if (tf) { go.transform.position = new U.Vector3(tf.pos.x, tf.pos.y, 0); go.transform.localScale = new U.Vector3(tf.scale.x, tf.scale.y, 1); }
    const ps = go.AddComponent(PlayerStatsStub);
    const pc = go.AddComponent(PlayerControllerStub);
    const r = go.AddComponent(U.ShapeRenderer);
    r.sortingOrder = 20;
    r.draw = (ctx) => {
      const tt = U.Time.unscaledTime;
      ctx.save(); ctx.scale(1.6, 1.6);
      SLS.Art.player(ctx, { t: tt, walk: 0, air: false, hurt: 0, alive: true });
      SLS.Art.hat(ctx, 200 + (ps.hat | 0), { t: tt });
      ctx.translate(0.05, 0.02); SLS.Art.staff(ctx, 300 + (ps.staff | 0), { t: tt });
      ctx.restore();
    };
    go.SetActive(true);
    pc.atk_speed_before = ps.atk_speed;
    SLS.Game.player = go;
    SLS.Game.playerStats = ps;
    SLS.Game.playerController = pc;
    return ps;
  }

  onBoot(90, () => {
    if (SLS.Debug.test !== 'shop') return;
    if (!alive(SLS.Game.playerStats)) buildStubPlayer();
    const ps = findPlayerStats();
    // ?stats=key:value,key:value (test only)
    const q = SLS.Debug.params;
    if (ps && q.get('stats')) {
      for (const kv of q.get('stats').split(',')) {
        const [k, v] = kv.split(':');
        if (k) ps[k] = v === 'true' ? true : v === 'false' ? false : +v;
      }
    }
    const pc = findPlayerController(ps);
    if (pc && ps && !(pc.atk_speed_before > 0)) pc.atk_speed_before = ps.atk_speed;
    const sm = findShopManager();
    if (!sm) return;
    U.Time.timeScale = 0;   // like WaveManager.CheckWaveEnd
    sm.StartShop();
    // ?cards=31,47,0 forces the offered ids (test only)
    const forced = SLS.Debug.params.get('cards');
    if (forced) {
      const ids = forced.split(',').map((s) => +s);
      sm.hand.forEach((c, i) => { if (i < ids.length && SLS.ItemDB.get(ids[i])) { c.SetCard(SLS.ItemDB.get(ids[i])); c.ItemRarity(); } });
    }
  });

  SLS.Debug.shopState = function () {
    const sm = findShopManager();
    const ps = sm ? sm.ResolvePlayerStats() : findPlayerStats();
    const pm = findProgression();
    const pick = (o, keys) => { const r = {}; for (const k of keys) if (o && o[k] !== undefined) r[k] = o[k]; return r; };
    return {
      open: ShopManager.OnScreen,
      transcendence: Transcendence.OnScreen,
      hand: sm ? sm.hand.filter(alive).map((c) => (c.item_ ? c.item_.item_id : null)) : [],
      reroll: sm && sm.reroll && alive(sm.reroll) ? { enabled: sm.reroll.Btn.enabled, free: sm.reroll.isFree } : null,
      inventory: sm ? [...sm.itens] : [],
      bar: sm && sm.card_manager ? sm.card_manager.GetCards().map((c) => [c.item.item_id, c.quantity.text]) : [],
      chances: sm ? [sm.normal_chance, sm.rare_chance, sm.epic_chance] : null,
      last_picked: sm ? sm.last_picked : null,
      souls: pm ? pm.soul_orbs : null,
      timeScale: U.Time.timeScale,
      screens: UI.stack.map((s) => s.constructor.name),
      selected: (() => { const s = UI.top(); const b = s && s.selected; return b && b.owner ? (b.kind === 'reroll' ? 'reroll' : b.owner.item_ && b.owner.item_.item_id) : (b ? b.label : null); })(),
      stats: pick(ps, ['speed', 'speed_stacks', 'atk_speed', 'atk_speed_stacks', 'atk_damage', 'atk_stacks', 'max_hp', 'hp', 'hp_stacks',
        'armor', 'critical_chance', 'critical_multiplier', 'life_steal', 'thunder_projs', 'cards_plus', 'tome_lvl', 'jump_number',
        'proj_hits', 'proj_size', 'proj_fragments', 'hat', 'dealer', 'nerd', 'thundergod', 'vampire', 'flying', 'colossus']),
    };
  };
})(window.SLS, window.U);
