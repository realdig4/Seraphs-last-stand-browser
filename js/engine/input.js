/*
 * input.js - keyboard, mouse and gamepad, plus named actions.
 *
 * Actions mirror the original control scheme (facts.input): Movement, Jump,
 * Shoot, AutoAttack, WandDirection, Pause, Back. Each action offers
 * IsPressed(), WasPressedThisFrame(), WasReleasedThisFrame(), ReadValue() and
 * started/performed/canceled listeners, like the Unity Input System.
 * Sticks use the Input System default deadzone (0.125 .. 0.925); WandDirection adds the
 * original action map's StickDeadzone(min=0.8) on top.
 */
'use strict';
(function (U) {
  const { Vector2 } = U;

  // KeyboardEvent.code -> Input System key name
  const CODE_TO_KEY = {
    Space: 'space', Escape: 'escape', Enter: 'enter', NumpadEnter: 'numpadEnter', Tab: 'tab', Backspace: 'backspace',
    ArrowUp: 'upArrow', ArrowDown: 'downArrow', ArrowLeft: 'leftArrow', ArrowRight: 'rightArrow',
    ShiftLeft: 'leftShift', ShiftRight: 'rightShift', ControlLeft: 'leftCtrl', ControlRight: 'rightCtrl', AltLeft: 'leftAlt', AltRight: 'rightAlt',
  };
  function keyName(e) {
    if (CODE_TO_KEY[e.code]) return CODE_TO_KEY[e.code];
    if (/^Key[A-Z]$/.test(e.code)) return e.code.slice(3).toLowerCase();
    if (/^Digit\d$/.test(e.code)) return e.code.slice(5);
    if (/^F\d+$/.test(e.code)) return e.code.toLowerCase();
    return e.code;
  }

  const DEAD_MIN = 0.125, DEAD_MAX = 0.925;
  function deadzone(x, y, min = DEAD_MIN, max = DEAD_MAX) {
    const m = Math.hypot(x, y);
    if (m < min) return new Vector2(0, 0);
    const n = Math.min((m - min) / (max - min), 1);
    return new Vector2(x / m * n, y / m * n);
  }
  // action-level StickDeadzone processors of the original action map, applied on top of the
  // stick's own default deadzone (as the Input System stacks them): WandDirection uses min 0.8
  const ACTION_DEADZONE = { WandDirection: [0.8, DEAD_MAX] };
  const PAD_BUTTONS = { buttonSouth: 0, buttonEast: 1, buttonWest: 2, buttonNorth: 3, leftShoulder: 4, rightShoulder: 5,
    leftTrigger: 6, rightTrigger: 7, select: 8, start: 9, leftStickPress: 10, rightStickPress: 11,
    'dpad/up': 12, 'dpad/down': 13, 'dpad/left': 14, 'dpad/right': 15 };

  const Input = U.Input = {
    keys: new Set(), keysDown: new Set(), keysUp: new Set(),
    mouse: { x: 0, y: 0, dx: 0, dy: 0, buttons: new Set(), down: new Set(), up: new Set(), wheel: 0, moved: false, inside: false },
    pad: null, padPrev: { buttons: [], axes: [] }, padButtons: [], padAxes: [0, 0, 0, 0],
    lastDevice: 'keyboard',            // 'keyboard' | 'gamepad'
    onDeviceChange: [],
    actions: {},
    anyKeyDown: false,
    canvas: null,
    typedText: '',
  };

  // ---------------- DOM listeners
  Input.attach = function (canvas) {
    Input.canvas = canvas;
    applyCursor();
    window.addEventListener('keydown', (e) => {
      const k = keyName(e);
      if (!Input.keys.has(k)) Input.keysDown.add(k);
      Input.keys.add(k);
      if (e.key && e.key.length === 1) Input.typedText += e.key;
      Input.anyKeyDown = true;
      setDevice('keyboard');
      if (['space', 'upArrow', 'downArrow', 'leftArrow', 'rightArrow', 'tab'].includes(k)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { const k = keyName(e); Input.keys.delete(k); Input.keysUp.add(k); });
    window.addEventListener('blur', () => { for (const k of Input.keys) Input.keysUp.add(k); Input.keys.clear(); Input.mouse.buttons.clear(); });
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      const view = U.Render ? U.Render.view : { x: 0, y: 0, w: r.width, h: r.height };
      const x = (e.clientX - r.left - view.x) / view.w * 1920;
      const y = (e.clientY - r.top - view.y) / view.h * 1080;
      return [x, y];
    };
    canvas.addEventListener('mousemove', (e) => {
      const [x, y] = pos(e);
      Input.mouse.dx += x - Input.mouse.x; Input.mouse.dy += y - Input.mouse.y;
      Input.mouse.x = x; Input.mouse.y = y; Input.mouse.moved = true; Input.mouse.inside = true;
      if (Math.abs(e.movementX) + Math.abs(e.movementY) > 2) setDevice('keyboard');
    });
    canvas.addEventListener('mouseleave', () => { Input.mouse.inside = false; });
    canvas.addEventListener('mousedown', (e) => {
      const [x, y] = pos(e); Input.mouse.x = x; Input.mouse.y = y;
      if (!Input.mouse.buttons.has(e.button)) Input.mouse.down.add(e.button);
      Input.mouse.buttons.add(e.button); Input.anyKeyDown = true; setDevice('keyboard');
      U.Audio && U.Audio.unlock();
      e.preventDefault();
    });
    window.addEventListener('mouseup', (e) => { Input.mouse.buttons.delete(e.button); Input.mouse.up.add(e.button); });
    canvas.addEventListener('wheel', (e) => { Input.mouse.wheel += -Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', () => U.Audio && U.Audio.unlock(), { once: false });
  };

  function setDevice(d) {
    if (Input.lastDevice === d) return;
    Input.lastDevice = d;
    for (const f of Input.onDeviceChange) { try { f(d); } catch (e) { U.reportError(e, null, 'onDeviceChange'); } }
  }

  // ---------------- per-frame
  Input.pollGamepad = function () {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let pad = null;
    for (const p of pads) if (p && p.connected) { pad = p; break; }
    Input.padPrev = { buttons: Input.padButtons.slice(), axes: Input.padAxes.slice() };
    Input.pad = pad;
    if (!pad) { Input.padButtons = []; Input.padAxes = [0, 0, 0, 0]; return; }
    Input.padButtons = pad.buttons.map((b) => (typeof b === 'object' ? b.value : b));
    Input.padAxes = [pad.axes[0] || 0, pad.axes[1] || 0, pad.axes[2] || 0, pad.axes[3] || 0];
    const active = Input.padButtons.some((v, i) => v > 0.5 && !(Input.padPrev.buttons[i] > 0.5)) ||
      Math.hypot(Input.padAxes[0], Input.padAxes[1]) > 0.5 || Math.hypot(Input.padAxes[2], Input.padAxes[3]) > 0.5;
    if (active) { setDevice('gamepad'); Input.anyKeyDown = Input.anyKeyDown || Input.padButtons.some((v, i) => v > 0.5 && !(Input.padPrev.buttons[i] > 0.5)); }
  };
  Input.endFrame = function () {
    Input.keysDown.clear(); Input.keysUp.clear();
    Input.mouse.down.clear(); Input.mouse.up.clear();
    Input.mouse.dx = 0; Input.mouse.dy = 0; Input.mouse.wheel = 0; Input.mouse.moved = false;
    Input.anyKeyDown = false;
    Input.typedText = '';
  };

  // ---------------- raw queries
  Input.GetKey = (k) => Input.keys.has(k);
  Input.GetKeyDown = (k) => Input.keysDown.has(k);
  Input.GetKeyUp = (k) => Input.keysUp.has(k);
  Input.GetMouseButton = (b) => Input.mouse.buttons.has(b);
  Input.GetMouseButtonDown = (b) => Input.mouse.down.has(b);
  Input.GetMouseButtonUp = (b) => Input.mouse.up.has(b);
  Input.padValue = (name, prev) => {
    const arr = prev ? Input.padPrev.buttons : Input.padButtons;
    const i = PAD_BUTTONS[name];
    return i === undefined ? 0 : arr[i] || 0;
  };
  Input.leftStick = () => deadzone(Input.padAxes[0], -Input.padAxes[1]);
  Input.rightStick = () => deadzone(Input.padAxes[2], -Input.padAxes[3]);
  // UI space (1920x1080 logical pixels), y up like Unity screen coordinates
  Object.defineProperty(Input, 'mousePosition', { get: () => new Vector2(Input.mouse.x, 1080 - Input.mouse.y) });

  // ---------------- actions
  function bindingValue(path, prev) {
    // returns number (buttons) or Vector2 (sticks / delta)
    let m;
    if ((m = /^<Keyboard>\/(.+)$/.exec(path))) return prev ? 0 : (Input.keys.has(m[1]) ? 1 : 0);
    if ((m = /^<Mouse>\/(leftButton|rightButton|middleButton)$/.exec(path))) {
      const b = { leftButton: 0, middleButton: 1, rightButton: 2 }[m[1]];
      return prev ? 0 : (Input.mouse.buttons.has(b) ? 1 : 0);
    }
    if (path === '<Mouse>/delta') return new Vector2(Input.mouse.dx, -Input.mouse.dy);
    if (path === '<Gamepad>/leftStick') return Input.leftStick();
    if (path === '<Gamepad>/rightStick') return Input.rightStick();
    if ((m = /^<Gamepad>\/(.+)$/.exec(path))) { const v = Input.padValue(m[1], prev); return v > 0.5 ? 1 : 0; }
    return 0;
  }

  class InputAction {
    constructor(name, type, bindings) {
      this.name = name;
      this.type = type;          // 'Button' | 'Value'
      this.bindings = bindings;  // [{path, part, composite}]
      this.started = []; this.performed = []; this.canceled = [];
      this.enabled = true;
      this._pressed = false; this._wasPressed = false; this._value = type === 'Value' ? new Vector2() : 0;
      this._prevValueNonZero = false;
    }
    Enable() { this.enabled = true; }
    Disable() { this.enabled = false; this._pressed = false; }
    // evaluate current state from devices
    _eval() {
      if (this.type === 'Value') {
        let best = new Vector2(0, 0);
        let compX = 0, compY = 0, hasComp = false;
        for (const b of this.bindings) {
          if (b.composite) { hasComp = true; continue; }
          if (b.part) {
            const v = bindingValue(b.path) ? 1 : 0;
            if (b.part === 'up') compY += v; else if (b.part === 'down') compY -= v;
            else if (b.part === 'left') compX -= v; else if (b.part === 'right') compX += v;
            continue;
          }
          let v = bindingValue(b.path);
          const dz = ACTION_DEADZONE[this.name];
          if (dz && v instanceof Vector2 && b.path.startsWith('<Gamepad>/')) v = deadzone(v.x, v.y, dz[0], dz[1]);
          if (v instanceof Vector2 && v.sqrMagnitude > best.sqrMagnitude) best = v;
        }
        if (hasComp) {
          const c = new Vector2(Math.max(-1, Math.min(1, compX)), Math.max(-1, Math.min(1, compY)));
          const n = c.sqrMagnitude > 1 ? c.normalized : c;
          if (n.sqrMagnitude > best.sqrMagnitude) best = n;
        }
        return best;
      }
      let v = 0;
      for (const b of this.bindings) v = Math.max(v, +bindingValue(b.path) || 0);
      return v;
    }
    _update() {
      if (!this.enabled) return;
      const v = this._eval();
      this._wasPressed = this._pressed;
      if (this.type === 'Value') {
        const nz = v.sqrMagnitude > 0;
        const changed = !this._value || v.x !== this._value.x || v.y !== this._value.y;
        this._value = v;
        if (nz && !this._prevValueNonZero) fire(this.started, this);
        if (nz && changed) fire(this.performed, this);
        if (!nz && this._prevValueNonZero) fire(this.canceled, this);
        this._prevValueNonZero = nz;
        this._pressed = nz;
        return;
      }
      this._value = v;
      this._pressed = v > 0.5;
      if (this._pressed && !this._wasPressed) { fire(this.started, this); fire(this.performed, this); }
      if (!this._pressed && this._wasPressed) fire(this.canceled, this);
    }
    IsPressed() { return this._pressed; }
    WasPressedThisFrame() { return this._pressed && !this._wasPressed; }
    WasReleasedThisFrame() { return !this._pressed && this._wasPressed; }
    ReadValue() { return this.type === 'Value' ? Vector2.from(this._value) : this._value; }
    get triggered() { return this.WasPressedThisFrame(); }
  }
  function fire(list, action) {
    for (const f of [...list]) { try { f({ action, ReadValue: () => action.ReadValue() }); } catch (e) { U.reportError(e, null, 'input ' + action.name); } }
  }
  U.InputAction = InputAction;

  Input.defineActions = function (bindings) {
    const types = { Movement: 'Value', WandDirection: 'Value' };
    const by = {};
    for (const b of bindings) (by[b.action] = by[b.action] || []).push(b);
    for (const [name, list] of Object.entries(by)) Input.actions[name] = new InputAction(name, types[name] || 'Button', list);
  };
  Input.updateActions = function () { for (const a of Object.values(Input.actions)) a._update(); };
  Input.action = (n) => Input.actions[n];

  // UI navigation helpers (keyboard arrows/WASD, gamepad d-pad/left stick, A/B)
  const navRepeat = { dir: null, t: 0 };
  Input.uiNavigate = function (dt) {
    let x = 0, y = 0;
    if (Input.keysDown.has('leftArrow') || Input.keysDown.has('a')) x = -1;
    if (Input.keysDown.has('rightArrow') || Input.keysDown.has('d')) x = 1;
    if (Input.keysDown.has('upArrow') || Input.keysDown.has('w')) y = 1;
    if (Input.keysDown.has('downArrow') || Input.keysDown.has('s')) y = -1;
    if (x || y) return new Vector2(x, y);
    // gamepad with repeat
    const s = Input.leftStick();
    let dir = null;
    if (Input.padValue('dpad/left') > 0.5 || s.x < -0.5) dir = 'L';
    else if (Input.padValue('dpad/right') > 0.5 || s.x > 0.5) dir = 'R';
    else if (Input.padValue('dpad/up') > 0.5 || s.y > 0.5) dir = 'U';
    else if (Input.padValue('dpad/down') > 0.5 || s.y < -0.5) dir = 'D';
    if (!dir) { navRepeat.dir = null; return null; }
    if (dir !== navRepeat.dir) { navRepeat.dir = dir; navRepeat.t = 0.4; }
    else { navRepeat.t -= dt; if (navRepeat.t > 0) return null; navRepeat.t = 0.1; }
    return new Vector2(dir === 'L' ? -1 : dir === 'R' ? 1 : 0, dir === 'U' ? 1 : dir === 'D' ? -1 : 0);
  };
  Input.uiSubmit = () => Input.keysDown.has('enter') || Input.keysDown.has('numpadEnter') || Input.keysDown.has('space') ||
    (Input.padValue('buttonSouth') > 0.5 && !(Input.padValue('buttonSouth', true) > 0.5));
  Input.uiCancel = () => Input.keysDown.has('escape') || (Input.padValue('buttonEast') > 0.5 && !(Input.padValue('buttonEast', true) > 0.5));

  // ---------------- hardware cursor (Cursor.SetCursor(texture, hotspot, CursorMode.Auto))
  // The image becomes the canvas' CSS cursor once it has loaded; until then, or when the
  // file is missing, hardwareCursor stays false and the game draws its own reticle.
  // Hidden while a gamepad is in use (Cursor.visible = !isPad).
  Input.hardwareCursor = false;
  const cur = { url: null, css: null, req: 0 };
  function applyCursor() {
    const c = Input.canvas;
    if (!c) return;
    c.style.cursor = cur.css && Input.lastDevice !== 'gamepad' ? cur.css : 'none';
  }
  Input.setCursor = function (url, hx, hy) {
    if (url === cur.url) return;
    cur.url = url;
    const req = ++cur.req;
    if (!url) { cur.css = null; Input.hardwareCursor = false; applyCursor(); return; }
    const img = new Image();
    img.onload = () => {
      if (req !== cur.req) return;
      cur.css = 'url("' + url + '") ' + (hx | 0) + ' ' + (hy | 0) + ', default';
      Input.hardwareCursor = true;
      applyCursor();
    };
    img.onerror = () => {
      if (req !== cur.req) return;
      cur.css = null; Input.hardwareCursor = false; applyCursor();
    };
    img.src = url;
  };
  Input.onDeviceChange.push(applyCursor);
})(window.U);
