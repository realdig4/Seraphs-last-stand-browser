/*
 * progression.js - meta progression and cheat codes.
 *
 *  - ProgresisonManager (original misspelling; scene object "ProgressionManager"): the persistent soul
 *    orbs and the 8 permanent upgrades. A level costs (level + 1) * base_price souls; caps are
 *    damage 2, attack speed 4, move speed 3, armor 4, stability 2, HP 5, crit 5, soul orb 2.
 *    Saved under the original keys through SLS.Save. The levels do nothing here: WaveManager.ApplyUpgradeLvl
 *    reads atk_lvl, atk_speed_lvl, ... once per run. The menus module draws the Upgrades screen over this
 *    class (SelectUpgrade, BuyUpgrade, the button states below).
 *  - CheatCodes: typing "eraserhead" wipes the save, "buttface" unlocks every hat and staff and maxes the
 *    upgrades; both reload the page where the original reloaded the scene.
 */
'use strict';
(function (SLS, U) {
  const PF = (SLS.F.managers.ProgressionManager || {}).ProgresisonManager || {};

  // selected_upgrade index -> level field, button, cap (RefreshUpgrade caps), glyph
  const UPGRADES = [
    { field: 'atk_lvl', button: 'atk_button', cap: 2, symbol: 'sword' },
    { field: 'atk_speed_lvl', button: 'atk_speed_button', cap: 4, symbol: 'resonance' },
    { field: 'speed_lvl', button: 'speed_button', cap: 3, symbol: 'boot' },
    { field: 'armor_lvl', button: 'armor_button', cap: 4, symbol: 'shield' },
    { field: 'stability_lvl', button: 'stability_button', cap: 2, symbol: 'stability' },
    { field: 'hp_lvl', button: 'hp_button', cap: 5, symbol: 'heart' },
    { field: 'crit_lvl', button: 'crit_button', cap: 5, symbol: 'eye' },
    { field: 'soul_orb_lvl', button: 'soul_button', cap: 2, symbol: 'soul' },
  ];
  // SaveStats writes these keys in this order
  const SAVE_KEYS = ['soul_orbs', 'atk_lvl', 'atk_speed_lvl', 'speed_lvl', 'armor_lvl', 'stability_lvl', 'hp_lvl', 'soul_orb_lvl', 'crit_lvl'];

  SLS.addStrings('en', {
    'upgrade.0.name': 'Power', 'upgrade.0.desc': '+2 damage once both levels are owned (each level counts as half, rounded down).',
    'upgrade.1.name': 'Haste', 'upgrade.1.desc': 'Shoot faster: the time between shots drops by 5% per level.',
    'upgrade.2.name': 'Stride', 'upgrade.2.desc': '+10% movement speed per level.',
    'upgrade.3.name': 'Defense', 'upgrade.3.desc': '+1 armor per level: take 1% less damage.',
    'upgrade.4.name': 'Stability', 'upgrade.4.desc': 'Your shots block 1 more enemy bullet per level.',
    'upgrade.5.name': 'Vitality', 'upgrade.5.desc': '+5 max HP per level.',
    'upgrade.6.name': 'Keen Eye', 'upgrade.6.desc': '+2% critical hit chance per level.',
    'upgrade.7.name': 'Soul Harvest', 'upgrade.7.desc': '+1% soul orb drop chance per level.',
    'upgrade.level': 'Level {0}/{1}', 'upgrade.max': 'Maxed', 'upgrade.price': '{0} souls', 'upgrade.select': 'Choose an upgrade',
  });
  SLS.addStrings('pt', {
    'upgrade.0.name': 'Poder', 'upgrade.0.desc': '+2 de dano ao ter os dois níveis (cada nível vale metade, arredondado para baixo).',
    'upgrade.1.name': 'Ímpeto', 'upgrade.1.desc': 'Atire mais rápido: o intervalo entre disparos cai 5% por nível.',
    'upgrade.2.name': 'Passada', 'upgrade.2.desc': '+10% de velocidade de movimento por nível.',
    'upgrade.3.name': 'Defesa', 'upgrade.3.desc': '+1 de armadura por nível: sofra 1% menos dano.',
    'upgrade.4.name': 'Estabilidade', 'upgrade.4.desc': 'Seus disparos bloqueiam +1 projétil inimigo por nível.',
    'upgrade.5.name': 'Vitalidade', 'upgrade.5.desc': '+5 de HP máximo por nível.',
    'upgrade.6.name': 'Olho Aguçado', 'upgrade.6.desc': '+2% de chance de crítico por nível.',
    'upgrade.7.name': 'Colheita de Almas', 'upgrade.7.desc': '+1% de chance de orbe de alma por nível.',
    'upgrade.level': 'Nível {0}/{1}', 'upgrade.max': 'Máximo', 'upgrade.price': '{0} almas', 'upgrade.select': 'Escolha uma melhoria',
  });

  const toInt = (v) => { const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : 0; };

  // ================================================================ ProgresisonManager
  class ProgresisonManager extends U.MonoBehaviour {
    constructor() {
      super();
      this.soul_orbs = PF.soul_orbs | 0;
      this.atk_lvl = PF.atk_lvl | 0;
      this.atk_speed_lvl = PF.atk_speed_lvl | 0;
      this.speed_lvl = PF.speed_lvl | 0;
      this.armor_lvl = PF.armor_lvl | 0;
      this.stability_lvl = PF.stability_lvl | 0;
      this.hp_lvl = PF.hp_lvl | 0;
      this.soul_orb_lvl = PF.soul_orb_lvl | 0;
      this.crit_lvl = PF.crit_lvl | 0;
      this.selected_upgrade = PF.selected_upgrade === undefined ? 8 : PF.selected_upgrade;   // 8 = none
      this.upgrade_price = PF.upgrade_price | 0;
      this.upgrade_name = '';
      this.base_price = PF.base_price === undefined ? 25 : PF.base_price;
      this.lvl_mark = 'LvlMark';
      // state of the scene's UI objects (the menus module draws them)
      for (const u of UPGRADES) this[u.button] = { interactable: true, highlighted: false };
      this.buy_upgrade_button = { active: false, interactable: false, textColor: '#ffffff' };
      this.upgrade_price_text = { text: '' };
      this.upgrade_desc = { text: '' };
      this.soul_orbs_quant = { text: '' };
      this.soul_counter = { text: '' };
      this.focusRequest = null;      // RefreshUpgrade case 8 moves the focus to the damage button (index 0)
      this.listeners = [];           // remake: callbacks run after RefreshUpgrade / RefreshLvl
      this._debugSoulsDone = false;
    }
    static get UPGRADES() { return UPGRADES; }

    Awake() {
      SLS.Game.progression = this;
      this.Initialize();
      this.ApplyDebugSouls();
    }
    Start() {
      this.Initialize();
      this.ApplyDebugSouls();
      this._debugSoulsDone = true;
    }
    // ?souls=N sets the soul orbs for testing (kept in memory until something saves them)
    ApplyDebugSouls() {
      if (this._debugSoulsDone) return;
      const n = SLS.Debug.souls;
      if (n !== null && n !== undefined && Number.isFinite(n)) this.soul_orbs = Math.trunc(n);
    }

    Initialize() {
      this.soul_orbs = toInt(SLS.Save.GetValue('soul_orbs', 0));
      this.atk_lvl = toInt(SLS.Save.GetValue('atk_lvl', 0));
      this.atk_speed_lvl = toInt(SLS.Save.GetValue('atk_speed_lvl', 0));
      this.speed_lvl = toInt(SLS.Save.GetValue('speed_lvl', 0));
      this.armor_lvl = toInt(SLS.Save.GetValue('armor_lvl', 0));
      this.stability_lvl = toInt(SLS.Save.GetValue('stability_lvl', 0));
      this.hp_lvl = toInt(SLS.Save.GetValue('hp_lvl', 0));
      this.soul_orb_lvl = toInt(SLS.Save.GetValue('soul_orb_lvl', 0));
      this.crit_lvl = toInt(SLS.Save.GetValue('crit_lvl', 0));
      // (the original also migrated a legacy Slot_0.sav here; there is none in the browser)
      if (this.soul_orbs < 0) this.soul_orbs = 100;
      this.RefreshUpgrade();
      this.RefreshLvl();
    }

    // the buy button is interactable (white text) only while soul_orbs >= upgrade_price: the only affordability gate
    Update() {
      this.soul_orbs_quant.text = String(this.soul_orbs);
      this.soul_counter.text = String(this.soul_orbs);
      const ok = this.soul_orbs >= this.upgrade_price;
      this.buy_upgrade_button.interactable = ok;
      this.buy_upgrade_button.textColor = ok ? '#ffffff' : '#ff0000';
    }

    SelectUpgrade(upgrade_number) {
      this.selected_upgrade = upgrade_number | 0;
      this.RefreshUpgrade();
    }

    RefreshUpgrade() {
      const s = this.selected_upgrade;
      if (s >= 0 && s <= 7) {
        const u = UPGRADES[s];
        this.upgrade_name = SLS.T('upgrade.' + s + '.name');
        this.OutlineEraser();
        this[u.button].highlighted = true;       // tinted yellow in the original
        this.buy_upgrade_button.active = true;
        this.upgrade_price = (this[u.field] + 1) * this.base_price;
      } else if (s === 8) {
        this.upgrade_name = '';
        this.OutlineEraser();
        this.focusRequest = 0;
      }
      // an upgrade button stops being interactable once its level reaches the cap (and stays so until reload)
      for (const u of UPGRADES) if (this[u.field] >= u.cap) this[u.button].interactable = false;
      this.RefreshLvl();
      this.upgrade_desc.text = this.upgrade_name;
      this.upgrade_price_text.text = String(this.upgrade_price);
      this.Notify();
    }

    // Buy button handler. Returns true when a level was bought (remake convenience).
    BuyUpgrade() {
      const upgrade_num = this.selected_upgrade;
      // the button only receives clicks while it is shown and Update() keeps it interactable
      if (!this.buy_upgrade_button.active || !(this.soul_orbs >= this.upgrade_price)) return false;
      const CanBuy = () => (upgrade_num >= 0 && upgrade_num <= 7 ? !!this[UPGRADES[upgrade_num].button].interactable : false);
      if (!CanBuy()) return false;
      this.soul_orbs -= this.upgrade_price;
      this[UPGRADES[upgrade_num].field]++;
      this.SaveStats();
      this.RefreshUpgrade();
      this.GetPassivesAchievment();
      this.Initialize();
      return true;
    }

    OutlineEraser() { for (const u of UPGRADES) this[u.button].highlighted = false; }

    // the original rebuilt the level pips (LvlMark objects) here; the menus module draws them from the *_lvl fields
    RefreshLvl() { this.Notify(); }

    SaveStats() {
      for (const k of SAVE_KEYS) SLS.Save.SetValue(k, this[k]);
    }

    // UI button: all levels back to 0, spent souls are not refunded
    ResetStats() {
      for (const u of UPGRADES) this[u.field] = 0;
      this.SaveStats();
    }

    // achievement "all passives maxed" (Steam achiev_05 in the original); returns whether it would unlock
    GetPassivesAchievment() {
      return this.atk_lvl === 2 && this.atk_speed_lvl === 4 && this.speed_lvl === 3 && this.armor_lvl === 4 &&
        this.stability_lvl === 2 && this.hp_lvl === 5 && this.soul_orb_lvl === 2 && this.crit_lvl === 5;
    }

    // ---- helpers for the menus module
    GetLevel(i) { const u = UPGRADES[i]; return u ? this[u.field] : 0; }
    GetCap(i) { const u = UPGRADES[i]; return u ? u.cap : 0; }
    GetPrice(i) { const u = UPGRADES[i]; return u ? (this[u.field] + 1) * this.base_price : 0; }
    IsMaxed(i) { const u = UPGRADES[i]; return !!u && this[u.field] >= u.cap; }
    IsButtonInteractable(i) { const u = UPGRADES[i]; return !!u && !!this[u.button].interactable; }
    CanBuySelected() {
      const s = this.selected_upgrade;
      return this.buy_upgrade_button.active && this.soul_orbs >= this.upgrade_price && s >= 0 && s <= 7 && this.IsButtonInteractable(s);
    }
    GetUpgradeName(i) { return SLS.T('upgrade.' + i + '.name'); }
    GetUpgradeDescription(i) { return SLS.T('upgrade.' + i + '.desc'); }
    GetUpgradeSymbol(i) { const u = UPGRADES[i]; return u ? u.symbol : 'orb'; }
    Notify() { for (const f of this.listeners.slice()) { try { f(this); } catch (e) { U.reportError(e, this, 'progression listener'); } } }
  }

  // ================================================================ CheatCodes
  class Cheat {
    constructor(onComplete, codes) {
      U.Debug.Log(U.Str.Format('Created Cheat code: {0}', codes.length));
      this._onComplete = onComplete;
      this.Index = 0;
      this.Code = codes;
    }
    get Current() { return this.Code[this.Index]; }
    get StrCurrent() { return String(this.Code[this.Index]); }
    // one check per key-down frame: the expected key advances, any other key restarts the code
    Check() {
      if (U.Input.GetKeyDown(this.StrCurrent)) {
        this.Index++;
        if (this.Index >= this.Code.length) {
          this.Index = 0;
          if (this._onComplete) this._onComplete();
        }
      } else {
        this.Index = 0;
      }
    }
  }

  class CheatCodes extends U.MonoBehaviour {
    constructor() {
      super();
      this._pStats = null;      // scene references in the original
      this._pManager = null;
      this._cheats = [];
    }
    CreateCheat(onComplete, code) {
      this._cheats.push(new Cheat(onComplete, code.toLowerCase().split('')));
    }
    Start() {
      this.CreateCheat(() => this.EraseData(), 'EraserHead');
      this.CreateCheat(() => this.CompleteProgress(), 'ButtFace');
    }
    Update() {
      const In = U.Input;
      if (In.anyKeyDown && !In.GetMouseButtonDown(0) && !In.GetMouseButtonDown(1) && !In.GetMouseButtonDown(2)) {
        for (const c of this._cheats) c.Check();
      }
    }
    // deletes the whole save (progress, unlocks, options); reloads only if a save existed
    EraseData() {
      U.Debug.Log('Erased Data');
      const existed = !!SLS.Save.data && Object.keys(SLS.Save.data).length > 0;
      SLS.Save.DeleteSave();
      if (existed) CheatCodes.ReloadScene();
    }
    // unlocks every hat and staff, maxes the 8 upgrades (souls unchanged), saves, reloads
    CompleteProgress() {
      U.Debug.Log('Completed Progress');
      const ps = U.alive(this._pStats) ? this._pStats : (U.alive(SLS.Game.playerStats) ? SLS.Game.playerStats : null);
      if (ps && typeof ps.EnableAllHats === 'function') ps.EnableAllHats(); else unlockGroup('hats');
      if (ps && typeof ps.EnableAllStafs === 'function') ps.EnableAllStafs();
      else if (ps && typeof ps.EnableAllStaffs === 'function') ps.EnableAllStaffs();
      else unlockGroup('staffs');
      const pm = U.alive(this._pManager) ? this._pManager : SLS.Game.progression;
      if (pm) {
        pm.atk_lvl = 2;
        pm.atk_speed_lvl = 4;
        pm.speed_lvl = 3;
        pm.armor_lvl = 4;
        pm.stability_lvl = 2;
        pm.hp_lvl = 5;
        pm.crit_lvl = 5;
        pm.soul_orb_lvl = 2;
        pm.SaveStats();
      }
      CheatCodes.ReloadScene();
    }
    static ReloadScene() {
      try { window.location.reload(); } catch (e) { /* not in a browser */ }
    }
  }
  CheatCodes.Cheat = Cheat;
  // what PlayerStats.EnableAllHats / EnableAllStafs write, used when the player module lacks them
  function unlockGroup(group) {
    for (const it of (SLS.F.items[group] || [])) SLS.Save.SetValue('i' + it.id + '_Unlocked', true);
  }

  Object.assign(SLS, { ProgresisonManager, CheatCodes });

  // ---------------------------------------------------------------- boot (order 10)
  // SLS.addStartup is created by main.js, which loads after the modules: register once every
  // classic script has run (DOMContentLoaded fires before main.js boots on "load").
  function onBoot(order, fn) {
    if (typeof SLS.addStartup === 'function') { SLS.addStartup(order, fn); return; }
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof SLS.addStartup === 'function') SLS.addStartup(order, fn);
      else console.error('[progression] SLS.addStartup is missing');
    }, { once: true });
  }
  onBoot(10, () => {
    const pmGo = new U.GameObject('ProgressionManager');
    const pm = pmGo.AddComponent(ProgresisonManager);
    const cheatGo = new U.GameObject('CheatManager');
    const cheats = cheatGo.AddComponent(CheatCodes);
    cheats._pManager = pm;
  });

  SLS.Debug.progressionState = function () {
    const pm = SLS.Game.progression;
    if (!pm) return null;
    return {
      soul_orbs: pm.soul_orbs, selected_upgrade: pm.selected_upgrade, upgrade_price: pm.upgrade_price, upgrade_name: pm.upgrade_name,
      levels: UPGRADES.map((u) => pm[u.field]), buttons: UPGRADES.map((u) => pm[u.button].interactable),
      buy: Object.assign({}, pm.buy_upgrade_button),
    };
  };
})(window.SLS, window.U);
