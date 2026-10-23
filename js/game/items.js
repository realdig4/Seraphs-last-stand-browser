/*
 * items.js - item data for every shop card, transcendence card, staff and hat (SLS.ItemDB).
 *
 * Names and numbers come from facts (SLS.F.items). Every description is original wording
 * (EN + PT) that states the real effect with the real numbers of the original game
 * (ItemScript.BuyCard / GetTranscendents, PlayerController, EnemyStats, ...).
 * The glyphs are original procedural drawings: this file extends SLS.Art.icon with the
 * extra symbols it needs (staff and hat icons reuse SLS.Art.staff / SLS.Art.hat).
 *
 * Entry shape (contract, docs/ARCHITECTURE.md):
 *   {id, name, group, rarity, symbol, color, desc(), fullDesc(), howToGet()}
 * plus the original Item fields the shop code uses (item_id, price, rarity,
 * item_equivalence {display, has_equivalence, item, quantity}, attackSpeed, ...).
 */
'use strict';
(function (SLS, U) {
  const F = SLS.F;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- rarity palette
  // ItemScript.ItemRarity: 0 white frame + name, 1 green frame + name, 2 magenta frame with a
  // yellow name. Rarity 3 (transcendences) only appears in the encyclopedia; gold is our choice.
  const RARITY = [
    { frame: '#f3f0ff', name: '#f3f0ff', glow: 'rgba(255,255,255,0.55)', dark: '#2a2638' },
    { frame: '#45f57a', name: '#45f57a', glow: 'rgba(69,245,122,0.55)', dark: '#123222' },
    { frame: '#ff4fe6', name: '#ffeb3b', glow: 'rgba(255,79,230,0.6)', dark: '#341236' },
    { frame: '#ffd36b', name: '#ffd36b', glow: 'rgba(255,211,107,0.7)', dark: '#3a2c10' },
  ];

  // Unity named colours used as transcendence title colours (ItemScript.GetTranscendents).
  const UNITY = {
    yellow: [1, 0.9215686, 0.01568628], red: [1, 0, 0], green: [0, 1, 0], white: [1, 1, 1],
    magenta: [1, 0, 1], cyan: [0, 1, 1], blue: [0, 0, 1], gray: [0.5, 0.5, 0.5],
  };
  // readable icon tints for the same colours on a dark background
  const READABLE = {
    yellow: '#ffeb3b', red: '#ff4a4a', green: '#4dff6a', white: '#f4f4ff',
    magenta: '#ff5cf2', cyan: '#5cf6ff', blue: '#6b8cff', gray: '#b9b9c8',
  };

  // ---------------------------------------------------------------- per-item visuals
  // s: glyph symbol, c: icon colour, t: transcendence title colour name
  const META = {
    0: { s: 'boot', c: '#7fe3ff' }, 1: { s: 'sword', c: '#ff8a6b' }, 2: { s: 'leap', c: '#b4ff8a' },
    3: { s: 'resonance', c: '#ffe066' }, 4: { s: 'heart', c: '#ff5c7a' }, 5: { s: 'heartPlus', c: '#ff8fb1' },
    6: { s: 'soul', c: '#9fd8ff' }, 7: { s: 'shield', c: '#c9d3e8' }, 8: { s: 'eye', c: '#ffd36b' },
    9: { s: 'stability', c: '#b9a6ff' },
    20: { s: 'moon', c: '#c3b5ff' }, 21: { s: 'wing', c: '#e8f4ff' }, 22: { s: 'boot', c: '#7fe3ff' },
    23: { s: 'resonance', c: '#ffe066' }, 24: { s: 'heart', c: '#ff5c7a' }, 25: { s: 'orb', c: '#ffcf6b' },
    26: { s: 'sprout', c: '#7dff9a' }, 27: { s: 'fang', c: '#ff4d6d' }, 28: { s: 'burst', c: '#ffd9a0' },
    29: { s: 'sword', c: '#ff8a6b' }, 30: { s: 'clover', c: '#4dff88' }, 31: { s: 'bolt', c: '#fff36b' },
    32: { s: 'healOrb', c: '#6dff8a' }, 33: { s: 'crosshair', c: '#ff6b6b' }, 34: { s: 'shrink', c: '#a8f0ff' },
    35: { s: 'spark', c: '#ffb347' }, 36: { s: 'fist', c: '#ff5a3d' },
    40: { s: 'heart', c: '#ff5c7a' }, 41: { s: 'wisp', c: '#b0f0ff' }, 42: { s: 'spark', c: '#ffb347' },
    43: { s: 'snow', c: '#a8f0ff' }, 44: { s: 'burst', c: '#ffd9a0' }, 45: { s: 'flame', c: '#ff7a3d' },
    46: { s: 'fang', c: '#ff4d6d' }, 47: { s: 'bolt', c: '#fff36b' }, 48: { s: 'cards', c: '#ffd36b' },
    49: { s: 'bubble', c: '#7fdcff' }, 50: { s: 'focus', c: '#d9b8ff' }, 51: { s: 'book', c: '#e0c27a' },
    52: { s: 'drop', c: '#e0304a' },
    60: { s: 'crown', t: 'yellow' }, 61: { s: 'fang', t: 'red' }, 62: { s: 'chip', t: 'green' },
    63: { s: 'drop', t: 'red' }, 64: { s: 'antiAir', t: 'white' }, 65: { s: 'wing', t: 'green' },
    66: { s: 'giant', t: 'yellow' }, 67: { s: 'gnomeHat', t: 'magenta' }, 68: { s: 'coin', t: 'white' },
    69: { s: 'ring', t: 'yellow' }, 70: { s: 'skull', t: 'red' }, 71: { s: 'crosshair', t: 'white' },
    72: { s: 'cards', t: 'white' }, 73: { s: 'star', t: 'green' }, 74: { s: 'spiral', t: 'white' },
    75: { s: 'flame', t: 'red' }, 76: { s: 'soul', t: 'cyan' }, 77: { s: 'comet', t: 'yellow' },
    78: { s: 'beam', t: 'blue' }, 79: { s: 'chomp', t: 'yellow' }, 80: { s: 'absorb', t: 'white' },
    81: { s: 'plague', t: 'green' }, 82: { s: 'dice', t: 'yellow' }, 83: { s: 'bunker', t: 'gray' },
    84: { s: 'hourglass', t: 'red' }, 85: { s: 'wisp', t: 'cyan' }, 86: { s: 'feather', t: 'yellow' },
    87: { s: 'book', t: 'gray' }, 88: { s: 'medal', t: 'red' }, 89: { s: 'plow', t: 'yellow' },
    90: { s: 'snow', t: 'cyan' },
  };
  // card 90 has no name in the data; its flag/asset identifier is "freezer"
  const NAME_FALLBACK = { 90: 'Freezer' };

  // ---------------------------------------------------------------- texts (original wording)
  // [id, short description (shop card / tooltip), full description (encyclopedia), how to get (transcendences)]
  const EN = [
    [0, 'Move 20% faster.', 'Raises your movement speed by 20% of its current value, so every copy compounds. Tome makes the bonus bigger. Each Swift adds 1 swift stack.'],
    [1, '+2 damage.', 'Adds 2 damage to every shot (+0.7 more per Tome card). Each Catalyst adds 1 strength stack.'],
    [2, 'Jump 30% higher.', 'Raises your jump force by 30% of its current value. Tome makes the bonus bigger. Each Impulse adds 1 impulse stack.'],
    [3, 'Shoot 12% faster.', 'Cuts the time between your shots by 12% of its current value (the limit is one shot every 0.1 s). Tome makes the cut bigger. Each Resonance adds 1 resonance stack.'],
    [4, '+10 max HP and heal 10 HP.', 'Raises your maximum HP by 10 and restores the same amount. Tome raises both numbers. Each Growth adds 1 growth stack.'],
    [5, 'Fully restore your HP.', 'Instantly refills your HP to the maximum. Each Renew adds 1 renewal stack.'],
    [6, '+1% soul orb drop chance.', 'Slain enemies drop a soul orb with a chance of (soul level + 1)%. This card raises your soul level by 1. Soul orbs pay for permanent upgrades, staffs and hats.'],
    [7, '+4 armor (take 4% less damage).', 'Each point of armor removes 1% of the damage you take, up to a cap of 90. Tome raises the bonus. Each Resist adds 1 armor stack.'],
    [8, '+5% critical hit chance.', 'Raises the chance that a hit is critical by 5 points. Critical hits multiply damage by your critical multiplier (1.5x at the start). Tome raises the bonus.'],
    [9, 'Shots can block 1 more enemy bullet.', 'Your projectiles destroy the enemy bullets they touch. This raises by 1 how many they can stop before they break (you start with 2).'],
    [20, 'Invulnerability after a hit lasts 10% longer.', 'After taking damage you are untouchable for a moment (0.3 s at the start). This stretches that window by 10% of its current length. Each Cloak adds 1 cloak stack.'],
    [21, '+1 mid-air jump.', 'Lets you jump one more time while airborne. Your jumps refill whenever you land.'],
    [22, 'Move 40% faster.', 'Raises your movement speed by 40% of its current value. Counts as 2 Swift cards and adds 2 swift stacks. Tome does not affect it.'],
    [23, 'Shoot 24% faster.', 'Cuts the time between your shots by 24% of its current value. Counts as 2 Resonance cards and adds 2 resonance stacks. Tome does not affect it.'],
    [24, '+20 max HP and heal 20 HP.', 'Raises your maximum HP by 20 and restores the same amount. Counts as 2 Growth cards and adds 2 growth stacks.'],
    [25, 'Projectiles grow 20% larger.', 'Makes your projectiles 20% bigger than they are now, so they are easier to land. Each Charge adds 1 charge stack.'],
    [26, '+1 regeneration while enemies are alive.', 'Every second you heal (regeneration / 30)% of your max HP for each enemy alive. With no enemies on the field you do not regenerate.'],
    [27, 'Heal 3% of the damage you deal.', 'Adds 3% life steal: while you are hurt, hits heal you for that share of their base damage (critical bonuses not included).'],
    [28, 'Slain enemies burst into 2 more fragments.', 'A dying enemy shatters into fragments that fly in random directions and hurt other enemies (40% damage, less for fragments of fragments). Adds 2 fragments per kill.'],
    [29, '+4 damage.', 'Adds 4 damage to every shot. Counts as 2 Catalyst cards and adds 2 strength stacks.'],
    [30, 'Rare cards show up more often.', 'Moves 5 points of the shop odds from common cards to rare cards.'],
    [31, 'Lightning strikes the arena: storm level +2.', 'During waves a bolt falls on a random spot every (8 / storm level) seconds and deals 20 + 2 per storm level damage to the first enemy it hits. Buying it also makes the next bolt fall right away.'],
    [32, '+5% healing orb drops; orbs heal 5 more.', 'Slain enemies may drop a healing orb (chance equal to your orb level, in %). An orb heals 10 HP plus your orb level. Each Orb card adds 5 orb levels. Orbs can only be picked up near the ground.'],
    [33, 'Critical hits deal +50% damage.', 'Raises your critical multiplier by 0.5 (it starts at 1.5x).'],
    [34, 'You become 10% smaller.', 'Shrinks you by 10% of your current size, making you a smaller target. Each Shrink adds 1 shrink stack.'],
    [35, 'Running fires explosive sparks upward.', 'Running on the ground builds friction; each time it fills, an explosive spark flies straight up. Every Friction level makes sparks come faster and hit harder (2 direct damage per level).'],
    [36, 'Below half HP, deal bonus damage.', 'Under 50% HP your shots and your touch gain bonus damage that grows as your HP falls: up to +50% of your attack and touch damage per Rage level, reached at 0 HP.'],
    [40, '+40 max HP and heal 40 HP.', 'Raises your maximum HP by 40 and restores the same amount. Counts as 4 Growth cards and adds 4 growth stacks.'],
    [41, 'A wisp ally fires at enemies for half damage.', 'Summons a wisp that floats beside you and shoots your staff\'s projectile at the nearest enemy, at half your fire rate and half damage. Every copy adds another wisp.'],
    [42, 'Friction level +3.', 'Adds 3 Friction levels at once: many more and stronger sparks while you run. Counts as 3 Friction cards.'],
    [43, 'Each hit slows enemies by 1% more.', 'Every hit chills the enemy, cutting 1% of its speed per Cold level, down to 20% of its normal speed.'],
    [44, 'Slain enemies burst into 6 more fragments.', 'Adds 6 fragments per kill at once. Counts as 3 Fragmentation cards.'],
    [45, 'Touching enemies burns them for 40.', 'Your body runs hot: every enemy you touch takes 40 more touch damage. Stacks with every copy.'],
    [46, 'Heal 9% of the damage you deal.', 'Adds 9% life steal at once. Counts as 3 Leech cards.'],
    [47, 'Lightning strikes the arena: storm level +6.', 'Adds 6 storm levels at once: bolts fall far more often and hit harder. Counts as 3 Thunderbolt cards.'],
    [48, 'The shop offers 1 more card (max 9).', 'Every shop after this one deals one extra card to choose from. You start with 4 cards per shop; the hand tops out at 9.'],
    [49, 'A shield blocks one hit, then recharges.', 'Grants a shield that completely absorbs one hit. After it breaks it returns in 16 / shield level seconds.'],
    [50, 'Standing still speeds up your shots.', 'While you stand still, every second your shots get 5% faster per Focus level. Moving resets the bonus.'],
    [51, 'Common stat cards get 35% stronger.', 'Adds 0.35 Tome. The bonuses of Swift, Catalyst, Impulse, Resonance, Growth, Resist and Eyesight picked afterwards are multiplied by (1 + Tome).'],
    [52, 'Hits make enemies bleed (+0.5 per hit).', 'Every hit adds 0.5 bleed per Wound level to the enemy. A bleeding enemy loses its bleed amount in HP every second, and bleed keeps stacking.'],
    [60, 'Your lightning deals triple damage.', 'The storm answers to you: every lightning bolt, from the Thunder Staff or from the storm cards, deals three times its damage and glows red.', 'Raise the storm level to 20 (Thunderbolt cards).'],
    [61, 'Life steal becomes 50%.', 'Your thirst is complete: life steal is set to 50% of the damage you deal.', 'Reach 36% life steal (Leech cards).'],
    [62, 'Fragments lose only 10% per generation.', 'Fragments stop dividing their damage by their generation; instead each generation loses only 10% of it. Fragments turn cyan.', 'Reach 20 fragments per kill (Fragmentation cards).'],
    [63, 'Bleeding ticks twice as fast.', 'Bleeding enemies lose HP every half second instead of every second.', 'Take 3 Wound cards.'],
    [64, 'Explosions reach a 2-unit radius.', 'Explosive shots and friction sparks blast in a 2-unit radius. Does not apply while you wield the Boomstaff.', 'Reach Friction level 10.'],
    [65, 'Unlimited mid-air jumps.', 'You can jump again and again in mid-air without ever landing.', 'Have 5 mid-air jumps.'],
    [66, 'Double max HP, full heal, double size.', 'Your maximum HP doubles, you heal completely and you grow to twice your size.', 'Collect 15 growth stacks (Growth cards).'],
    [67, '33% chance to dodge damage.', 'Every hit you take has a 33% chance to deal no damage. Your hat turns red.', 'Take 5 Shrink cards.'],
    [68, 'Healing orbs charge your next shot.', 'Each healing orb you collect also stores a charge. Your next shot spends them all: 2x damage per charge, bigger and explosive.', 'Reach orb level 25 (Orb cards).'],
    [69, 'A broken shield bursts into 30 shots.', 'Whenever your shield breaks it releases a ring of 30 of your projectiles in every direction.', 'Take 3 Barrier cards.'],
    [70, 'Attackers take twice your armor in damage.', 'Enemies whose bullets, bombs or bodies strike you take damage equal to twice your armor.', 'Collect 6 armor stacks (Resist cards).'],
    [71, 'Your first hit on each enemy is critical.', 'Every enemy that enters the arena is marked: your first hit on it is always a critical hit.', 'Reach 30% critical chance.'],
    [72, 'Rerolls are free.', 'The shopkeeper owes you one: rerolling the shop no longer costs soul orbs.', 'Have 8 cards per shop (4 Appraisal cards).'],
    [73, 'Epic cards can show up in any shop.', 'Moves 5 points of the shop odds from common cards to epic cards.', 'Raise the rare odds to 60 (Luck cards).'],
    [74, 'Smaller shots; ground hits open black holes.', 'Your projectiles shrink by 35%, but shots that hit the ground open a black hole (at most one per second) that pulls nearby enemies in for 3 seconds.', 'Collect 5 charge stacks (Charge cards).'],
    [75, 'Every 2 s, burn nearby enemies.', 'Every 2 seconds you scorch every enemy within 2.2 units for your touch damage.', 'Reach 120 touch damage (Overheat cards).'],
    [76, 'Soul orbs call down a ray of light.', 'Collecting a soul orb calls down a pillar of light that deals (soul level + 2) x 10 damage to every enemy it touches.', 'Reach soul level 6 (Souls cards and upgrades).'],
    [77, 'Long falls end in an explosion.', 'Landing after more than 0.7 s in the air sets off a blast that deals 12 x (air time + 1)^3 damage.', 'Collect 5 impulse stacks (Impulse cards).'],
    [78, 'A beam from your staff burns enemies.', 'A steady beam shoots from your staff and deals 6 damage to each enemy it touches, once per attack interval.', 'Collect 8 resonance stacks (Resonance cards).'],
    [79, 'Shots grow 25% stronger per bullet eaten.', 'Each enemy bullet your projectile destroys makes that projectile deal 25% more damage.', 'Have shots that block 8 bullets (Stability cards and upgrades).'],
    [80, 'Enemy bullets that hit you heal 1 HP.', 'Every enemy bullet that strikes you restores 1 HP right after, even during invulnerability.', 'Collect 4 cloak stacks (Cloak cards).'],
    [81, 'Enemies lose 1% max HP every second.', 'A plague follows you: every enemy loses 1% of its maximum HP each second.', 'Reach regeneration 5 (Regrowth cards).'],
    [82, 'Critical hits can roll twice.', 'Every hit gets a second, separate critical roll; when it succeeds the damage is multiplied by your critical multiplier again.', 'Raise your critical multiplier to 4 (Precision cards).'],
    [83, 'Focusing also builds armor.', 'While you stand still, every second you also gain 4 armor (armor stays capped at 90).', 'Take 3 Focus cards.'],
    [84, 'Full heal at the start of every wave.', 'Every new wave begins with your HP fully restored.', 'Collect 5 renewal stacks (Renew cards).'],
    [85, 'Wisps gather at your staff and aim with you.', 'Your wisps cluster at the tip of your staff and fire wherever you aim.', 'Summon 4 wisps.'],
    [86, 'One revive that recharges after 5 waves.', 'When you would die you rise again with half your HP, and every enemy has a 50% chance to be destroyed. Once used, it recharges over 5 waves.', 'Take 5 Rage cards.'],
    [87, 'Every pick also grants a random common card.', 'Each time you take a card from the shop you also receive a random common card for free.', 'Reach 1.3 Tome (Tome cards).'],
    [88, 'No extra power, just bragging rights.', 'A badge for sheer stubbornness. It grants nothing beyond the strength it took to earn it.', 'Collect 20 strength stacks (Catalyst cards).'],
    [89, 'Enemies become 10x lighter.', 'Enemies that appear from now on weigh a tenth of their usual mass, so you can shove them around.', 'Collect 8 swift stacks (Swift cards).'],
    [90, 'Cold can freeze enemies solid.', 'Chilled enemies can be slowed to a full stop, and every hit on a frozen enemy has a 1% chance to shatter it.', 'Take 3 Cold cards.'],
    [300, 'A steady bolt every 0.9 s at full damage.', 'The staff every seraph starts with. Fires one projectile every 0.9 seconds that deals your full attack damage.'],
    [301, 'Homing shots every 0.63 s at 50% damage.', 'Its shots slide toward the nearest enemy. Fires every 0.63 seconds; each shot deals 50% of your attack damage.'],
    [302, 'A fan of 3 shots every 1.38 s, 50% damage each.', 'Fires three projectiles at once, 22 degrees apart, every 1.38 seconds. Each one deals 50% of your attack damage.'],
    [303, 'Explosive shots every 1.7 s.', 'Every 1.7 seconds fires a shot that deals 42% of your attack damage and explodes, hurting every enemy nearby (more the closer it is).'],
    [304, 'Calls lightning where you aim every 2.9 s.', 'Instead of shooting, calls a lightning bolt from the sky above your aim every 2.9 seconds. Each bolt deals 20 + your damage + 2 per storm level.'],
    [305, 'Piercing shards every 0.55 s at 25% damage.', 'Fires fast shards that pass through enemies, every 0.55 seconds. Each shard deals 25% of your attack damage to everything it pierces.'],
    [306, 'Every shot is a random type, every 1 s.', 'Each shot, fired every second, randomly becomes a normal, explosive, homing, triple or piercing projectile.'],
    [200, 'Classic and balanced: no bonus, no drawback.', 'A trusty pointed hat. Normal speed, no armor and no extra jumps.'],
    [201, '+6 armor, but half movement speed.', 'Heavy steel: you take 6% less damage, but you walk at half speed.'],
    [202, '+1 mid-air jump; every jump is full height.', 'Its little propeller grants one extra jump in the air, and your jumps always reach full height even if you let go early.'],
    [203, 'Every shop card is rare.', 'The shop\'s rarity roll is always 80, so every card offered is rare, even in the shops that would guarantee epic cards.'],
    [204, 'Twice the enemies; 20% chance of double cards.', 'Every wave sends twice as many enemies, but each card you pick has a 20% chance to be applied twice.'],
    [205, 'Rerolls are always free; runs are unranked.', 'A gambler\'s hat: rerolling the shop never costs soul orbs, but scores made while wearing it are not submitted.'],
  ];
  const PT = [
    [0, 'Mova-se 20% mais rápido.', 'Aumenta sua velocidade de movimento em 20% do valor atual, então cada cópia se acumula. O Tomo amplia o bônus. Cada Swift soma 1 acúmulo de velocidade.'],
    [1, '+2 de dano.', 'Soma 2 de dano a cada disparo (+0,7 a mais por carta Tome). Cada Catalyst soma 1 acúmulo de força.'],
    [2, 'Pule 30% mais alto.', 'Aumenta a força do seu pulo em 30% do valor atual. O Tomo amplia o bônus. Cada Impulse soma 1 acúmulo de impulso.'],
    [3, 'Atire 12% mais rápido.', 'Reduz o intervalo entre seus disparos em 12% do valor atual (o limite é um disparo a cada 0,1 s). O Tomo amplia a redução. Cada Resonance soma 1 acúmulo de ressonância.'],
    [4, '+10 de HP máximo e cura 10 HP.', 'Aumenta seu HP máximo em 10 e recupera a mesma quantidade. O Tomo aumenta os dois valores. Cada Growth soma 1 acúmulo de crescimento.'],
    [5, 'Recupera todo o seu HP.', 'Enche o seu HP até o máximo na hora. Cada Renew soma 1 acúmulo de renovação.'],
    [6, '+1% de chance de orbes de alma.', 'Inimigos abatidos deixam um orbe de alma com chance de (nível de alma + 1)%. Esta carta aumenta seu nível de alma em 1. Orbes de alma pagam melhorias permanentes, cajados e chapéus.'],
    [7, '+4 de armadura (4% menos dano).', 'Cada ponto de armadura reduz em 1% o dano recebido, até o limite de 90. O Tomo amplia o bônus. Cada Resist soma 1 acúmulo de armadura.'],
    [8, '+5% de chance de crítico.', 'Aumenta em 5 pontos a chance de um golpe ser crítico. Críticos multiplicam o dano pelo seu multiplicador crítico (1,5x no início). O Tomo amplia o bônus.'],
    [9, 'Disparos bloqueiam +1 projétil inimigo.', 'Seus projéteis destroem os projéteis inimigos que tocam. Esta carta aumenta em 1 quantos eles aguentam antes de se partir (você começa com 2).'],
    [20, 'Invulnerabilidade após dano dura 10% mais.', 'Depois de sofrer dano você fica intocável por um instante (0,3 s no início). Esta carta prolonga essa janela em 10% da duração atual. Cada Cloak soma 1 acúmulo de manto.'],
    [21, '+1 pulo no ar.', 'Permite pular mais uma vez enquanto está no ar. Seus pulos se renovam sempre que você pousa.'],
    [22, 'Mova-se 40% mais rápido.', 'Aumenta sua velocidade de movimento em 40% do valor atual. Conta como 2 cartas Swift e soma 2 acúmulos de velocidade. O Tomo não a afeta.'],
    [23, 'Atire 24% mais rápido.', 'Reduz o intervalo entre seus disparos em 24% do valor atual. Conta como 2 cartas Resonance e soma 2 acúmulos de ressonância. O Tomo não a afeta.'],
    [24, '+20 de HP máximo e cura 20 HP.', 'Aumenta seu HP máximo em 20 e recupera a mesma quantidade. Conta como 2 cartas Growth e soma 2 acúmulos de crescimento.'],
    [25, 'Projéteis 20% maiores.', 'Deixa seus projéteis 20% maiores do que são agora, o que facilita acertar. Cada Charge soma 1 acúmulo de carga.'],
    [26, '+1 de regeneração enquanto houver inimigos.', 'A cada segundo você recupera (regeneração / 30)% do HP máximo para cada inimigo vivo. Sem inimigos em campo não há regeneração.'],
    [27, 'Cure 3% do dano que causar.', 'Soma 3% de roubo de vida: enquanto você estiver ferido, seus golpes curam essa parte do dano base (sem os bônus de crítico).'],
    [28, 'Inimigos abatidos soltam +2 fragmentos.', 'Ao morrer, o inimigo se estilhaça em fragmentos que voam em direções aleatórias e ferem outros inimigos (40% do dano, menos para fragmentos de fragmentos). Soma 2 fragmentos por abate.'],
    [29, '+4 de dano.', 'Soma 4 de dano a cada disparo. Conta como 2 cartas Catalyst e soma 2 acúmulos de força.'],
    [30, 'Cartas raras aparecem mais.', 'Move 5 pontos das chances da loja das cartas comuns para as cartas raras.'],
    [31, 'Raios caem na arena: tempestade +2.', 'Durante as ondas um raio cai num ponto aleatório a cada (8 / nível da tempestade) segundos e causa 20 + 2 por nível da tempestade de dano ao primeiro inimigo atingido. Ao comprá-la, o próximo raio cai na hora.'],
    [32, '+5% de orbes de cura; curam 5 a mais.', 'Inimigos abatidos podem deixar um orbe de cura (chance igual ao seu nível de orbe, em %). Cada orbe cura 10 HP mais o seu nível de orbe. Cada carta Orb soma 5 níveis. Os orbes só podem ser pegos perto do chão.'],
    [33, 'Críticos causam +50% de dano.', 'Aumenta seu multiplicador crítico em 0,5 (ele começa em 1,5x).'],
    [34, 'Você fica 10% menor.', 'Encolhe você em 10% do tamanho atual, tornando você um alvo menor. Cada Shrink soma 1 acúmulo de encolhimento.'],
    [35, 'Correr lança faíscas explosivas para cima.', 'Correr no chão acumula atrito; cada vez que ele enche, uma faísca explosiva sobe em linha reta. Cada nível de Friction faz as faíscas surgirem mais rápido e baterem mais forte (2 de dano direto por nível).'],
    [36, 'Abaixo de metade do HP, cause dano extra.', 'Com menos de 50% de HP seus disparos e seu toque ganham dano extra que cresce conforme o HP cai: até +50% do dano de ataque e de toque por nível de Rage, com 0 HP.'],
    [40, '+40 de HP máximo e cura 40 HP.', 'Aumenta seu HP máximo em 40 e recupera a mesma quantidade. Conta como 4 cartas Growth e soma 4 acúmulos de crescimento.'],
    [41, 'Um fogo-fátuo aliado ataca com metade do dano.', 'Invoca um fogo-fátuo que flutua ao seu lado e dispara o projétil do seu cajado no inimigo mais próximo, na metade da sua cadência e com metade do dano. Cada cópia traz mais um.'],
    [42, 'Nível de Friction +3.', 'Soma 3 níveis de Friction de uma vez: muito mais faíscas, e mais fortes, enquanto você corre. Conta como 3 cartas Friction.'],
    [43, 'Cada golpe desacelera mais 1%.', 'Cada golpe gela o inimigo e corta 1% da velocidade dele por nível de Cold, até 20% da velocidade normal.'],
    [44, 'Inimigos abatidos soltam +6 fragmentos.', 'Soma 6 fragmentos por abate de uma vez. Conta como 3 cartas Fragmentation.'],
    [45, 'Tocar inimigos os queima em 40.', 'Seu corpo arde: todo inimigo que você tocar sofre 40 de dano de toque a mais. Acumula a cada cópia.'],
    [46, 'Cure 9% do dano que causar.', 'Soma 9% de roubo de vida de uma vez. Conta como 3 cartas Leech.'],
    [47, 'Raios caem na arena: tempestade +6.', 'Soma 6 níveis de tempestade de uma vez: os raios caem com muito mais frequência e batem mais forte. Conta como 3 cartas Thunderbolt.'],
    [48, 'A loja oferece +1 carta (máx. 9).', 'Toda loja depois desta traz uma carta a mais para escolher. Você começa com 4 cartas por loja; o limite é 9.'],
    [49, 'Um escudo bloqueia um golpe e se recarrega.', 'Concede um escudo que absorve um golpe inteiro. Depois de quebrar, ele volta em 16 / nível do escudo segundos.'],
    [50, 'Ficar parado acelera seus disparos.', 'Enquanto você fica parado, a cada segundo seus disparos ficam 5% mais rápidos por nível de Focus. Ao se mover, o bônus some.'],
    [51, 'Cartas comuns de atributo ficam 35% mais fortes.', 'Soma 0,35 de Tomo. Os bônus de Swift, Catalyst, Impulse, Resonance, Growth, Resist e Eyesight escolhidos depois são multiplicados por (1 + Tomo).'],
    [52, 'Golpes fazem sangrar (+0,5 por golpe).', 'Cada golpe soma 0,5 de sangramento por nível de Wound ao inimigo. Um inimigo sangrando perde esse valor em HP a cada segundo, e o sangramento continua acumulando.'],
    [60, 'Seus raios causam o triplo de dano.', 'A tempestade obedece a você: todo raio, do Cajado do Trovão ou das cartas de tempestade, causa o triplo de dano e brilha em vermelho.', 'Leve a tempestade ao nível 20 (cartas Thunderbolt).'],
    [61, 'O roubo de vida passa a ser 50%.', 'Sua sede está completa: o roubo de vida passa a ser 50% do dano que você causa.', 'Alcance 36% de roubo de vida (cartas Leech).'],
    [62, 'Fragmentos perdem só 10% por geração.', 'Os fragmentos deixam de dividir o dano pela geração; em vez disso, cada geração perde apenas 10% dele. Os fragmentos ficam ciano.', 'Alcance 20 fragmentos por abate (cartas Fragmentation).'],
    [63, 'O sangramento age duas vezes mais rápido.', 'Inimigos sangrando perdem HP a cada meio segundo em vez de a cada segundo.', 'Pegue 3 cartas Wound.'],
    [64, 'Explosões alcançam raio de 2 unidades.', 'Disparos explosivos e faíscas de atrito explodem num raio de 2 unidades. Não vale enquanto você usa o Boomstaff.', 'Alcance o nível 10 de Friction.'],
    [65, 'Pulos ilimitados no ar.', 'Você pode pular de novo e de novo no ar sem nunca precisar pousar.', 'Tenha 5 pulos no ar.'],
    [66, 'HP máximo em dobro, cura total e tamanho em dobro.', 'Seu HP máximo dobra, você se cura por completo e cresce até o dobro do tamanho.', 'Junte 15 acúmulos de crescimento (cartas Growth).'],
    [67, '33% de chance de esquivar do dano.', 'Cada golpe que você sofre tem 33% de chance de não causar dano. Seu chapéu fica vermelho.', 'Pegue 5 cartas Shrink.'],
    [68, 'Orbes de cura carregam seu próximo disparo.', 'Cada orbe de cura coletado também guarda uma carga. Seu próximo disparo gasta todas: 2x de dano por carga, maior e explosivo.', 'Alcance o nível de orbe 25 (cartas Orb).'],
    [69, 'Escudo quebrado vira 30 disparos.', 'Sempre que seu escudo quebra, ele solta um anel de 30 dos seus projéteis em todas as direções.', 'Pegue 3 cartas Barrier.'],
    [70, 'Agressores sofrem o dobro da sua armadura em dano.', 'Inimigos cujos projéteis, bombas ou corpos atingem você sofrem dano igual ao dobro da sua armadura.', 'Junte 6 acúmulos de armadura (cartas Resist).'],
    [71, 'Seu primeiro golpe em cada inimigo é crítico.', 'Todo inimigo que entra na arena fica marcado: seu primeiro golpe nele é sempre crítico.', 'Alcance 30% de chance de crítico.'],
    [72, 'Trocar a mão é grátis.', 'O lojista lhe deve uma: trocar as cartas da loja não custa mais orbes de alma.', 'Tenha 8 cartas por loja (4 cartas Appraisal).'],
    [73, 'Cartas épicas podem surgir em qualquer loja.', 'Move 5 pontos das chances da loja das cartas comuns para as cartas épicas.', 'Leve as chances raras a 60 (cartas Luck).'],
    [74, 'Disparos menores; acertos no chão abrem buracos negros.', 'Seus projéteis encolhem 35%, mas disparos que atingem o chão abrem um buraco negro (no máximo um por segundo) que puxa os inimigos próximos por 3 segundos.', 'Junte 5 acúmulos de carga (cartas Charge).'],
    [75, 'A cada 2 s, queima inimigos próximos.', 'A cada 2 segundos você queima todos os inimigos a até 2,2 unidades com o seu dano de toque.', 'Alcance 120 de dano de toque (cartas Overheat).'],
    [76, 'Orbes de alma invocam um raio de luz.', 'Pegar um orbe de alma invoca um pilar de luz que causa (nível de alma + 2) x 10 de dano a todo inimigo que ele tocar.', 'Alcance o nível de alma 6 (cartas Souls e melhorias).'],
    [77, 'Quedas longas terminam em explosão.', 'Pousar depois de mais de 0,7 s no ar provoca uma explosão de 12 x (tempo no ar + 1)^3 de dano.', 'Junte 5 acúmulos de impulso (cartas Impulse).'],
    [78, 'Um feixe do seu cajado queima inimigos.', 'Um feixe contínuo sai do seu cajado e causa 6 de dano a cada inimigo que toca, uma vez por intervalo de ataque.', 'Junte 8 acúmulos de ressonância (cartas Resonance).'],
    [79, 'Disparos ficam 25% mais fortes por projétil devorado.', 'Cada projétil inimigo que o seu disparo destrói deixa esse disparo 25% mais forte.', 'Tenha disparos que bloqueiam 8 projéteis (cartas Stability e melhorias).'],
    [80, 'Projéteis inimigos que acertam você curam 1 HP.', 'Todo projétil inimigo que atinge você recupera 1 HP logo depois, mesmo durante a invulnerabilidade.', 'Junte 4 acúmulos de manto (cartas Cloak).'],
    [81, 'Inimigos perdem 1% do HP máximo por segundo.', 'Uma praga segue você: todo inimigo perde 1% do HP máximo a cada segundo.', 'Alcance regeneração 5 (cartas Regrowth).'],
    [82, 'Críticos podem rolar duas vezes.', 'Cada golpe ganha uma segunda rolagem de crítico, independente; quando ela acerta, o dano é multiplicado de novo pelo seu multiplicador crítico.', 'Leve seu multiplicador crítico a 4 (cartas Precision).'],
    [83, 'Concentrar-se também gera armadura.', 'Enquanto você fica parado, a cada segundo também ganha 4 de armadura (a armadura continua limitada a 90).', 'Pegue 3 cartas Focus.'],
    [84, 'Cura total no início de cada onda.', 'Cada nova onda começa com o seu HP totalmente recuperado.', 'Junte 5 acúmulos de renovação (cartas Renew).'],
    [85, 'Fogos-fátuos se reúnem no cajado e miram com você.', 'Seus fogos-fátuos se agrupam na ponta do cajado e disparam para onde você mirar.', 'Invoque 4 fogos-fátuos.'],
    [86, 'Uma ressurreição que recarrega em 5 ondas.', 'Quando você morreria, volta com metade do HP e cada inimigo tem 50% de chance de ser destruído. Depois de usada, ela recarrega ao longo de 5 ondas.', 'Pegue 5 cartas Rage.'],
    [87, 'Cada escolha também dá uma carta comum aleatória.', 'Toda vez que você pega uma carta na loja, também recebe de graça uma carta comum aleatória.', 'Alcance 1,3 de Tomo (cartas Tome).'],
    [88, 'Nenhum poder extra, só o orgulho.', 'Uma medalha de pura teimosia. Não concede nada além da força que foi preciso juntar para ganhá-la.', 'Junte 20 acúmulos de força (cartas Catalyst).'],
    [89, 'Inimigos ficam 10x mais leves.', 'Os inimigos que surgirem daqui em diante pesam um décimo da massa normal, então você pode empurrá-los.', 'Junte 8 acúmulos de velocidade (cartas Swift).'],
    [90, 'O frio pode congelar inimigos por completo.', 'Inimigos gelados podem parar por completo, e cada golpe num inimigo congelado tem 1% de chance de estilhaçá-lo.', 'Pegue 3 cartas Cold.'],
    [300, 'Um disparo firme a cada 0,9 s com dano total.', 'O cajado com que todo serafim começa. Dispara um projétil a cada 0,9 segundo com todo o seu dano de ataque.'],
    [301, 'Disparos teleguiados a cada 0,63 s com 50% do dano.', 'Seus disparos deslizam até o inimigo mais próximo. Dispara a cada 0,63 segundo; cada disparo causa 50% do seu dano de ataque.'],
    [302, 'Leque de 3 disparos a cada 1,38 s, 50% do dano cada.', 'Dispara três projéteis de uma vez, separados por 22 graus, a cada 1,38 segundo. Cada um causa 50% do seu dano de ataque.'],
    [303, 'Disparos explosivos a cada 1,7 s.', 'A cada 1,7 segundo dispara um projétil que causa 42% do seu dano de ataque e explode, ferindo todos os inimigos por perto (mais quanto mais perto).'],
    [304, 'Chama um raio onde você mira a cada 2,9 s.', 'Em vez de atirar, chama um raio do céu acima da sua mira a cada 2,9 segundos. Cada raio causa 20 + seu dano + 2 por nível de tempestade.'],
    [305, 'Estilhaços perfurantes a cada 0,55 s com 25% do dano.', 'Dispara estilhaços rápidos que atravessam inimigos, a cada 0,55 segundo. Cada estilhaço causa 25% do seu dano de ataque a tudo que perfura.'],
    [306, 'Cada disparo tem um tipo aleatório, a cada 1 s.', 'Cada disparo, feito a cada segundo, vira aleatoriamente um projétil normal, explosivo, teleguiado, triplo ou perfurante.'],
    [200, 'Clássico e equilibrado: sem bônus, sem desvantagem.', 'Um chapéu pontudo de confiança. Velocidade normal, sem armadura e sem pulos extras.'],
    [201, '+6 de armadura, mas metade da velocidade.', 'Aço pesado: você sofre 6% menos dano, mas anda na metade da velocidade.'],
    [202, '+1 pulo no ar; todo pulo tem altura máxima.', 'A pequena hélice concede um pulo extra no ar, e seus pulos sempre atingem a altura máxima, mesmo se você soltar o botão antes.'],
    [203, 'Toda carta da loja é rara.', 'A rolagem de raridade da loja é sempre 80, então toda carta oferecida é rara, mesmo nas lojas que garantiriam cartas épicas.'],
    [204, 'Inimigos em dobro; 20% de chance de carta dupla.', 'Cada onda envia o dobro de inimigos, mas cada carta escolhida tem 20% de chance de valer duas vezes.'],
    [205, 'Trocas sempre grátis; partidas fora do ranking.', 'Chapéu de apostador: trocar as cartas da loja nunca custa orbes de alma, mas pontuações feitas com ele não são enviadas.'],
  ];
  function register(code, rows, extra) {
    const t = {};
    for (const [id, d, f, h] of rows) {
      t['item.' + id + '.desc'] = d;
      t['item.' + id + '.full'] = f;
      if (h) t['item.' + id + '.how'] = h;
    }
    SLS.addStrings(code, Object.assign(t, extra));
  }
  register('en', EN, {
    'rarity.0': 'Common', 'rarity.1': 'Rare', 'rarity.2': 'Epic', 'rarity.3': 'Transcendence',
    'item.how.shop': 'Offered in the shop between waves ({0}).',
    'item.how.free': 'Available from the very first run.',
    'item.how.price': 'Unlock it in the main menu for {0} soul orbs.',
    'item.group.cards': 'Cards', 'item.group.staffs': 'Staffs', 'item.group.hats': 'Hats',
  });
  register('pt', PT, {
    'rarity.0': 'Comum', 'rarity.1': 'Rara', 'rarity.2': 'Épica', 'rarity.3': 'Transcendência',
    'item.how.shop': 'Oferecida na loja entre as ondas ({0}).',
    'item.how.free': 'Disponível desde a primeira partida.',
    'item.how.price': 'Desbloqueie no menu principal por {0} orbes de alma.',
    'item.group.cards': 'Cartas', 'item.group.staffs': 'Cajados', 'item.group.hats': 'Chapéus',
  });

  // ---------------------------------------------------------------- Item (one entry per facts item)
  class Item {
    constructor(fact, group) {
      const m = META[fact.id] || {};
      this.id = fact.id;
      this.item_id = fact.id;                  // original field name (save key "i{item_id}_Unlocked")
      this.name = fact.name || NAME_FALLBACK[fact.id] || ('#' + fact.id);
      this.group = group;                      // 'cards' | 'staffs' | 'hats'
      this.rarity = fact.rarity;
      this.price = fact.price;                 // soul-orb unlock price (staffs/hats; 0 = owned from the start)
      this.attackSpeed = fact.attackSpeed;     // staff: seconds between shots
      this.projectile = fact.projectile;       // staff: projectile prefab name
      this.jumpNumber = fact.jumpNumber;       // hat: air jumps
      this.armor = fact.armor;                 // hat: armor
      this.speed = fact.speed;                 // hat: speed factor
      this.glyph = group === 'staffs' ? 'staff' + fact.id : group === 'hats' ? 'hat' + fact.id : (m.s || 'orb');
      this.symbol = 'item' + fact.id;          // Art.icon draws the original sprite, else the glyph
      this.item_icon = this.symbol;
      const pal = RARITY[Math.min(this.rarity, 3)] || RARITY[0];
      this.color = pal.frame;                  // rarity colour (frame)
      this.nameColor = pal.name;               // name colour (epic names are yellow)
      if (m.t) {
        this.titleColorName = m.t;
        this.titleColor = new U.Color(UNITY[m.t][0], UNITY[m.t][1], UNITY[m.t][2], 1);
        this.iconColor = READABLE[m.t];
      } else {
        this.iconColor = m.c || pal.frame;
      }
      const eq = fact.equivalence || {};
      this.item_equivalence = { display: !!eq.display, has_equivalence: !!eq.has, item: null, quantity: eq.quantity | 0, _itemId: eq.item };
    }
    get isTranscendence() { return this.group === 'cards' && this.rarity > 2; }
    // shop tier from the id range (ShopManager.RandomPicker): 0 common, 1 rare, 2 epic, 3 transcendence
    get tier() {
      const n = this.id;
      if (this.group !== 'cards') return 0;
      return n <= 9 ? 0 : n <= 36 ? 1 : n <= 52 ? 2 : 3;
    }
    desc() { return SLS.T('item.' + this.id + '.desc'); }
    fullDesc() { return SLS.T('item.' + this.id + '.full'); }
    howToGet() {
      if (this.isTranscendence) return SLS.T('item.' + this.id + '.how');
      if (this.group === 'cards') return SLS.T('item.how.shop', SLS.T('rarity.' + this.rarity));
      return this.price > 0 ? SLS.T('item.how.price', this.price) : SLS.T('item.how.free');
    }
    unlockKey() { return 'i' + this.id + '_Unlocked'; }
    toString() { return this.name; }
  }

  const byId = new Map();
  const list = [];
  const groups = { cards: [], staffs: [], hats: [] };
  for (const group of ['cards', 'staffs', 'hats']) {
    for (const fact of F.items[group] || []) {
      const it = new Item(fact, group);
      byId.set(it.id, it);
      list.push(it);
      groups[group].push(it);
    }
  }
  // resolve equivalences (Swift+ counts as 2x Swift in the inventory, ...)
  for (const it of list) {
    const e = it.item_equivalence;
    if (e._itemId !== null && e._itemId !== undefined) e.item = byId.get(e._itemId) || null;
  }

  SLS.Item = Item;
  SLS.ItemDB = {
    RARITY,
    UNITY_COLORS: UNITY,
    all: () => list.slice(),
    get: (id) => byId.get(typeof id === 'object' && id ? id.id : +id) || null,
    group: (g) => (groups[g] || []).slice(),
    cards: () => groups.cards.slice(),
    staffs: () => groups.staffs.slice(),
    hats: () => groups.hats.slice(),
    // encyclopedia order: the cards ItemGroup, sorted by rarity (titles on each rarity increase)
    encyclopedia: () => (F.itemGroups && F.itemGroups.cards ? F.itemGroups.cards.map((id) => byId.get(id)).filter(Boolean) : groups.cards.slice()),
    unlockKey: (id) => 'i' + (typeof id === 'object' ? id.id : id) + '_Unlocked',
    isUnlocked: (id) => !!SLS.Save.GetValue(SLS.ItemDB.unlockKey(id), false),
    // EncCard.Setup: rarity <= 2 is always shown; higher rarities need "i{id}_Unlocked"
    isRevealed(id) {
      const it = SLS.ItemDB.get(id);
      if (!it) return false;
      return it.rarity <= 2 || SLS.ItemDB.isUnlocked(it.id);
    },
    rarityName: (r) => SLS.T('rarity.' + r),
    rarityColor: (r) => (RARITY[r] || RARITY[0]).frame,
    rarityNameColor: (r) => (RARITY[r] || RARITY[0]).name,
    // draw an item's glyph (falls back to the rarity colour)
    drawIcon(ctx, item, x, y, size, color) {
      const it = SLS.ItemDB.get(item);
      if (!it) return;
      SLS.Art.icon(ctx, it.symbol, x, y, size, color || it.iconColor || it.color);
    },
  };

  // ---------------------------------------------------------------- extra glyphs for SLS.Art.icon
  // Each glyph draws in a 100 x 100 box centred on the origin (y down), like art.js.
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function heartPath(ctx) {
    ctx.beginPath(); ctx.moveTo(0, 30); ctx.bezierCurveTo(-60, -10, -30, -55, 0, -22); ctx.bezierCurveTo(30, -55, 60, -10, 0, 30); ctx.closePath();
  }
  function arrowHead(ctx, a, r, dir) {
    const px = Math.cos(a) * r, py = Math.sin(a) * r, tx = -Math.sin(a) * dir, ty = Math.cos(a) * dir, nx = Math.cos(a), ny = Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(px + tx * 14, py + ty * 14);
    ctx.lineTo(px - tx * 6 + nx * 13, py - ty * 6 + ny * 13);
    ctx.lineTo(px - tx * 6 - nx * 13, py - ty * 6 - ny * 13);
    ctx.closePath(); ctx.fill();
  }
  const DARK = '#160f24';
  const EXTRA = {
    soul(ctx) {
      ctx.beginPath(); ctx.arc(0, 12, 28, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-26, 4); ctx.quadraticCurveTo(-22, -34, 8, -48); ctx.quadraticCurveTo(-4, -22, 26, 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(-10, 10, 6, 0, TAU); ctx.arc(10, 10, 6, 0, TAU); ctx.fill();
    },
    reroll(ctx) {
      ctx.lineWidth = 9;
      ctx.beginPath(); ctx.arc(0, 0, 32, Math.PI * 1.08, Math.PI * 1.85); ctx.stroke();
      arrowHead(ctx, Math.PI * 1.85, 32, 1);
      ctx.beginPath(); ctx.arc(0, 0, 32, Math.PI * 0.08, Math.PI * 0.85); ctx.stroke();
      arrowHead(ctx, Math.PI * 0.85, 32, 1);
    },
    leap(ctx) {
      for (const [dy, w] of [[26, 6], [2, 8], [-22, 10]]) {
        ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-30, dy + 14); ctx.lineTo(0, dy - 14); ctx.lineTo(30, dy + 14); ctx.stroke();
      }
    },
    resonance(ctx) {
      ctx.beginPath(); ctx.arc(-28, 0, 11, 0, TAU); ctx.fill();
      ctx.lineWidth = 7;
      for (const r of [24, 40, 56]) { ctx.beginPath(); ctx.arc(-28, 0, r, -0.75, 0.75); ctx.stroke(); }
    },
    heartPlus(ctx) {
      heartPath(ctx); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-4.5, -20, 9, 30); ctx.fillRect(-15, -9.5, 30, 9);
    },
    stability(ctx) {
      ctx.beginPath(); ctx.arc(0, 0, 21, 0, TAU); ctx.fill();
      ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 0, 45, 16, -0.45, 0, TAU); ctx.stroke();
    },
    sprout(ctx) {
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 46); ctx.quadraticCurveTo(-5, 12, 0, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -4); ctx.quadraticCurveTo(-42, -4, -38, -40); ctx.quadraticCurveTo(-6, -36, 0, -4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(1, 10); ctx.quadraticCurveTo(38, 10, 40, -22); ctx.quadraticCurveTo(10, -24, 1, 10); ctx.fill();
    },
    clover(ctx) {
      for (const [x, y] of [[-15, -15], [15, -15], [-15, 15], [15, 15]]) { ctx.beginPath(); ctx.arc(x, y, 17, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(28, 0); ctx.moveTo(0, -28); ctx.lineTo(0, 28); ctx.stroke();
    },
    healOrb(ctx) {
      ctx.beginPath(); ctx.arc(0, 0, 37, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, -22, 12, 44); ctx.fillRect(-22, -6, 44, 12);
    },
    crosshair(ctx) {
      ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -47); ctx.lineTo(0, -16); ctx.moveTo(0, 16); ctx.lineTo(0, 47);
      ctx.moveTo(-47, 0); ctx.lineTo(-16, 0); ctx.moveTo(16, 0); ctx.lineTo(47, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill();
    },
    shrink(ctx) {
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 2 + Math.PI / 4);
        ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(0, -24); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-11, -26); ctx.lineTo(11, -26); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    },
    spark(ctx) {
      ctx.beginPath(); ctx.moveTo(0, -46); ctx.quadraticCurveTo(5, -16, 28, -12); ctx.quadraticCurveTo(5, -8, 0, 22);
      ctx.quadraticCurveTo(-5, -8, -28, -12); ctx.quadraticCurveTo(-5, -16, 0, -46); ctx.fill();
      ctx.lineWidth = 5; ctx.beginPath();
      ctx.moveTo(-18, 30); ctx.lineTo(-18, 46); ctx.moveTo(0, 34); ctx.lineTo(0, 48); ctx.moveTo(18, 30); ctx.lineTo(18, 46); ctx.stroke();
    },
    wisp(ctx) {
      ctx.beginPath(); ctx.moveTo(-6, 6); ctx.bezierCurveTo(-24, 14, -30, 32, -46, 38); ctx.bezierCurveTo(-26, 42, -10, 34, 4, 18); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(10, -8, 23, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(4, -14, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(16, -8, 4, 0, TAU); ctx.fill();
    },
    cards(ctx) {
      ctx.lineWidth = 6;
      ctx.save(); ctx.rotate(-0.28); rr(ctx, -36, -36, 44, 64, 8); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.rotate(0.14); rr(ctx, -10, -32, 46, 66, 8); ctx.fill(); ctx.restore();
      ctx.fillStyle = DARK; ctx.save(); ctx.rotate(0.14); ctx.fillRect(9, -12, 8, 26); ctx.fillRect(0, -3, 26, 8); ctx.restore();
    },
    bubble(ctx) {
      ctx.save(); ctx.globalAlpha *= 0.3; ctx.beginPath(); ctx.arc(0, 0, 36, 0, TAU); ctx.fill(); ctx.restore();
      ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, 38, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 24, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
    },
    chip(ctx) {
      rr(ctx, -27, -27, 54, 54, 6); ctx.fill();
      for (let i = 0; i < 4; i++) {
        const o = -21 + i * 14;
        ctx.fillRect(o - 3, -42, 6, 13); ctx.fillRect(o - 3, 29, 6, 13); ctx.fillRect(-42, o - 3, 13, 6); ctx.fillRect(29, o - 3, 13, 6);
      }
      ctx.fillStyle = DARK; rr(ctx, -15, -15, 30, 30, 4); ctx.fill();
    },
    antiAir(ctx) {
      ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 46); ctx.lineTo(0, -6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(-16, -6); ctx.lineTo(16, -6); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 6; ctx.beginPath();
      for (const a of [-2.4, -1.57, -0.74]) { ctx.moveTo(Math.cos(a) * 34, -26 + Math.sin(a) * 18); ctx.lineTo(Math.cos(a) * 46, -26 + Math.sin(a) * 26); }
      ctx.stroke();
    },
    giant(ctx) {
      ctx.beginPath(); ctx.arc(0, -32, 13, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-38, -14); ctx.lineTo(38, -14); ctx.lineTo(24, 46); ctx.lineTo(-24, 46); ctx.closePath(); ctx.fill();
      ctx.fillStyle = DARK; ctx.fillRect(-3, 8, 6, 38);
    },
    gnomeHat(ctx) {
      ctx.beginPath(); ctx.moveTo(-34, 28); ctx.quadraticCurveTo(-6, -10, 10, -48); ctx.quadraticCurveTo(12, 0, 34, 28); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 30, 44, 9, 0, 0, TAU); ctx.fill();
    },
    ring(ctx) {
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * 36, Math.sin(a) * 36, 6.5, 0, TAU); ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill();
    },
    comet(ctx) {
      ctx.lineWidth = 7; ctx.beginPath();
      ctx.moveTo(6, -6); ctx.lineTo(-42, 42); ctx.moveTo(16, 4); ctx.lineTo(-22, 46); ctx.moveTo(-4, -16); ctx.lineTo(-46, 22); ctx.stroke();
      ctx.beginPath(); ctx.arc(18, -18, 19, 0, TAU); ctx.fill();
    },
    beam(ctx) {
      ctx.save(); ctx.globalAlpha *= 0.35; ctx.fillRect(-30, -16, 78, 32); ctx.restore();
      ctx.fillRect(-30, -7, 78, 14);
      ctx.beginPath(); ctx.arc(-34, 0, 14, 0, TAU); ctx.fill();
    },
    chomp(ctx) {
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.arc(-8, 0, 36, 0.62, TAU - 0.62); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(28, 0, 5.5, 0, TAU); ctx.arc(44, 0, 5.5, 0, TAU); ctx.fill();
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(-6, -18, 5, 0, TAU); ctx.fill();
    },
    absorb(ctx) {
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill();
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 2);
        ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(0, -30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(-10, -32); ctx.lineTo(10, -32); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    },
    plague(ctx) {
      for (const [x, y, r] of [[-16, -14, 17], [17, -10, 14], [0, 18, 19]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
      ctx.fillStyle = DARK;
      for (const [x, y, r] of [[-18, -16, 4], [18, -11, 3.5], [3, 20, 5], [-8, 24, 3]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
    },
    dice(ctx) {
      rr(ctx, -36, -36, 72, 72, 12); ctx.fill();
      ctx.fillStyle = DARK;
      for (const [x, y] of [[-18, -18], [18, -18], [0, 0], [-18, 18], [18, 18]]) { ctx.beginPath(); ctx.arc(x, y, 6.5, 0, TAU); ctx.fill(); }
    },
    bunker(ctx) {
      ctx.beginPath(); ctx.arc(0, 22, 40, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillRect(-48, 22, 96, 10);
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(0, 22, 12, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillRect(-26, -2, 14, 6); ctx.fillRect(12, -2, 14, 6);
    },
    medal(ctx) {
      ctx.beginPath(); ctx.moveTo(-24, -48); ctx.lineTo(-8, -48); ctx.lineTo(6, -8); ctx.lineTo(-10, -8); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(24, -48); ctx.lineTo(8, -48); ctx.lineTo(-6, -8); ctx.lineTo(10, -8); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 16, 26, 0, TAU); ctx.fill();
      ctx.fillStyle = DARK; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 15; ctx.lineTo(Math.cos(a) * r, 16 + Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
    },
    plow(ctx) {
      ctx.fillRect(-38, -8, 44, 28); ctx.fillRect(-30, -34, 24, 26);
      ctx.beginPath(); ctx.moveTo(14, -28); ctx.quadraticCurveTo(34, 0, 14, 32); ctx.lineTo(28, 32); ctx.quadraticCurveTo(48, 0, 28, -28); ctx.closePath(); ctx.fill();
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(-26, 26, 9, 0, TAU); ctx.arc(-4, 26, 9, 0, TAU); ctx.fill();
    },
    focus(ctx) {
      ctx.beginPath(); ctx.arc(0, -26, 11, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-32, 28); ctx.quadraticCurveTo(0, -30, 32, 28); ctx.closePath(); ctx.fill();
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, 46, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 38, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
    },
  };
  // staff and hat icons reuse the world-space drawings of art.js (y up, world units)
  function staffIcon(ctx, id, size) {
    ctx.save();
    ctx.rotate(-Math.PI / 4);
    const k = size / 0.78;
    ctx.scale(k, -k);
    ctx.translate(-0.29, 0);
    SLS.Art.staff(ctx, id, { t: U.Time.unscaledTime });
    ctx.restore();
  }
  function hatIcon(ctx, id, size) {
    ctx.save();
    const k = size / 0.46;
    ctx.scale(k, -k);
    ctx.translate(0, -0.47);
    SLS.Art.hat(ctx, id, { t: U.Time.unscaledTime });
    ctx.restore();
  }
  // the souls currency icon: the original's 'Souls' sprite (35x47 pixel art, aspect kept)
  SLS.Art.soulIcon = (ctx, x, y, size) => !!U.Assets && U.Assets.drawSpriteUI(ctx, 'Souls', x, y, size, { smooth: false });
  const baseIcon = SLS.Art.icon;
  SLS.Art.icon = function (ctx, symbol, x, y, size, color = '#ffd36b') {
    if (typeof symbol === 'string') {
      let m;
      if ((m = /^item(\d+)$/.exec(symbol))) {
        const it = SLS.ItemDB.get(+m[1]);
        if (!it) return;
        if (SLS.Art.itemIcon(ctx, it, x, y, size)) return;
        symbol = it.glyph;
      }
      if (symbol === 'soul' && SLS.Art.soulIcon(ctx, x, y, size)) return;
      if ((m = /^staff(\d+)$/.exec(symbol))) { ctx.save(); ctx.translate(x, y); staffIcon(ctx, +m[1], size); ctx.restore(); return; }
      if ((m = /^hat(\d+)$/.exec(symbol))) { ctx.save(); ctx.translate(x, y); hatIcon(ctx, +m[1], size); ctx.restore(); return; }
      const f = EXTRA[symbol];
      if (f) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size / 100, size / 100);
        ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        f(ctx, color);
        ctx.restore();
        return;
      }
    }
    return baseIcon.call(this, ctx, symbol, x, y, size, color);
  };
  SLS.Art.iconSymbols = Object.keys(EXTRA).concat(['staff300..306', 'hat200..205']);
})(window.SLS, window.U);
