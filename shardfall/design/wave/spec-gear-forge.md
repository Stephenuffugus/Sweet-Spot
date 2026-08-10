# SPEC — GEAR, UNIQUES, AFFIXES, THE FORGE

Designer spec, ready to land against `index.html` @ 3c446e9. Every entry below is written in
the file's own style and respects: rule 4 (tables), rule 5 (`a.more` only), rule 17 (ilvl is
the law), the one id namespace (GEMS ∪ GEAR ∪ UNLOCKS), and the ref-items registration
checklists. Verified against the live code: armor uniques' `mod()` NEVER runs (refreshAttacks
computes melee/ranged/abil only) — every armor unique below is flat-field only, and flat keys
ride `gearSum(key)` → `inc(key)` generically (fractions for pct-type keys, the `ms:.15`
precedent).

## ID MANIFEST (collision-checked against GEMS 77, GEAR 12, UNLOCKS 83, MODA 12)

- GEAR: `dagger` `spear` `brig` `staff` `shroud`
- UNLOCKS: same five ids (gear rides its base id)
- MODAFF keys: `achill` `agore` `alunge` `astun` `abounce` (`a`-prefix convention)
- AFFIX keys: `ailment` `aildur` `reach` `area`
- New conditional field on `a`: `vsBleed` (one field, two consumers: Fever + `agore`)
- New table: `UNIQ3` (third alternates); new helpers: `wornUniq(base,alt)`, `affTierCap(ilvl)`,
  `forgeItem(uid)`; new UI fns: `openForge` `openForgeItem` `openForgeAff` `doForgeOp`
- New META field: `forge:{n:0,owk:0}`; new optional item fields: `it.cut`, `it.owk`
- No new input actions, no new statuses, no new HAZ kinds, no new sounds (reuse `gem`/`deny`).

---

## 1. GEAR BASES (5 new; 12 → 17, target 16–18)

Paste into `GEAR` (after `crossbow`, before `shield`):

```js
 dagger:{slot:'melee', n:'Dagger', dmg:6,  range:20, arc:70,  cd:.22, kb:60,  dig:0, sockets:2, sc:'gg', tend:'ggr', ilvl:150},
 spear:{slot:'melee',  n:'Spear',  dmg:14, range:44, arc:50,  cd:.48, kb:200, dig:0, sockets:2, sc:'rg', tend:'rgg', ilvl:300},
 brig: {slot:'armor',  n:'Brigandine', hp:34, arm:5, sockets:2, sc:'rg', tend:'rgg', ilvl:600},
 staff:{slot:'ranged', n:'Staff',  dmg:24, speed:380, cd:.95, kb:140, pierce:1, sockets:3, col:'#bfe8ff', sc:'bbg', tend:'bbg', ilvl:1500},
 shroud:{slot:'armor', n:'Abyssal Shroud', hp:55, arm:7, sockets:3, sc:'rgb', tend:'rgb', ilvl:1600},
```

DPS-in-family check (weapon dps = dmg/cd):

| base | ilvl | dps | neighbours at its band |
|---|---|---|---|
| dagger | 150 | 27.3 | sword 26.3 (0m), axe 29.1 (80m) — within 7% |
| spear | 300 | 29.2 | axe 29.1 — differentiated on reach 44/arc 50 vs dig 1 |
| staff | 1500 | 25.3 | crossbow 22.2 (900m) — +14% for +600m; ranged stays below melee everywhere |
| brig | 600 | — | chain 45hp/6arm/1sock vs brig 34/5/2sock rg — offense armor, a real choice |
| shroud | 1600 | — | plate 80/12/1r vs shroud 55/7/3×rgb — defense vs sockets, both live |

Identities (why each is the best answer for SOME build):
- **dagger** — fastest base in the game (cd .22). The on-hit machine: bleed appliers, leech,
  Tempo, class `foc:'crit'`. Short reach 20 + kb 60 = you stand in it. Blood-class home base.
- **spear** — reach melee. Hits from outside most grunt `atkReach`, narrow arc punishes
  circling. `rg` = bracing/heavyimpact + lunge/momentum/punish. The punish-window weapon.
- **brig** — the aggression armor gap: first `rg` armor. Bloodscent/Reaper (r) + Tempo/Undertow
  (g) finally have a home that isn't a robe.
- **staff** — first 3-socket weapon, gated 1500 (sockets are the strongest drop, so the third
  weapon socket is a forge-band event). `bbg` anchors the storm archetype (lightning +
  chainbolt + conduit in ONE weapon) and big-hit casting (slow cd = ailment cap friendly).
- **shroud** — deep flex armor: one socket of each color, real hp/arm. The abyss generalist;
  keeps plate (pure defense) and robe (fuel + bbb) honest instead of obsolete.

Every band now gains a base: caves→dagger, fungal→spear, ruins→brig, forge→staff, abyss→shroud.

---

## 2. UNIQUES (18 new; 24 → 42, target 40–48)

### 2.1 The UNIQ3 mechanism (extra alternates — required by the storm/blood/minion brief)

Minimal diff, save-compatible. Add after `UNIQ2`:

```js
// A third alternate for bases whose archetypes outgrew two. Only legal where UNIQ2 exists.
const UNIQ3={ ... };
function uniqueDef(id,alt){return alt===2&&UNIQ3[id]?UNIQ3[id]:(alt&&UNIQ2[id])?UNIQ2[id]:UNIQUES[id]}
```

In `mkItem`, replace the alt coin-flip with a uniform draw:

```js
 const nAlt=(UNIQ2[baseId]?1:0)+(UNIQ3[baseId]?1:0);
 const alt=(rarity===3&&nAlt)?ri(0,nAlt):0;
```

Identical odds for 2-variant bases (50/50), thirds at 1/3. Old saves carry `alt` 0/1 —
`uniqueDef` degrades gracefully. Discovery: change the pickup call to key
`base+(it.alt?'#'+(it.alt+1):'')` — alt 1 still lands in the existing `#2` bucket, alt 2 opens
`#3`; `seen.item` is not in the codex headline count, so no codex arithmetic changes.
Primaries exist for all five new bases below, so no `mkItem` downgrade path is ever hit.

### 2.2 Resonance pairs — mechanism verdict: KEEP (cheap)

`mod()` runs inside `computeAttack`, which only runs from `refreshAttacks()`, which is already
called on every equip/unequip/socket/class/boon change — so a weapon unique's `mod` may read
live `EQ` and stay coherent for free. One helper, next to `uniqueDef`:

```js
// Resonance: a unique may answer to another worn unique. Weapon-side mods only — an armor
// unique's mod() never runs, so the WEAPON half always carries the bonus.
function wornUniq(base,alt){for(const s of ['melee','ranged','armor']){const it=EQ[s];
 if(it&&it.unique===base&&(it.alt||0)===alt)return true}return false}
```

Three pairs ship (below): blood (Fever + Lifelode), storm (Fulgurite + Static), patience
(Patience + The Quiet). The pair bonus lives in the weapon's `mod`; both halves name their
partner in `d`. No extra cost on the bonus — each half already paid its own.

### 2.3 UNIQUES (primaries) — paste block

```js
 dagger:  {n:'Fever',          d:'hits bleed and feed you · resonates: Lifelode',
   mod:a=>{a.stR=a.stR||{};a.stR.bleed=Math.max(a.stR.bleed||0,0.4);a.vsBleed=(a.vsBleed||0)+0.25;a.leech=(a.leech||0)+0.05;a.more*=0.85;
    if(wornUniq('chain',2)){a.stR.bleed=Math.max(a.stR.bleed,0.55);a.leech+=0.03}}},
 spear:   {n:'Plumbline',      d:'twice the reach, half the arc',
   mod:a=>{a.range*=1.6;a.arc=Math.max(24,a.arc*0.5);a.kb*=1.3;a.more*=1.2}},
 staff:   {n:'Stormspine',     d:'every bolt is a storm',
   mod:a=>{a.chain=(a.chain||0)+2;a.st=a.st||{};a.st.shock=Math.max(a.st.shock||1,1.3);a.more*=0.8;a.cd*=1.1;a.col='#e6d34a'}},
 brig:    {n:"Butcher's Apron",d:'+6% crit, +4% leech, no padding', crit:.06, leech:.04, hp:-10},
 shroud:  {n:'The Quiet',      d:'+1 socket, +40% focus, it keeps some of you · resonates: Patience', sockets:1, focus:.4, hp:-15},
```

### 2.4 UNIQ2 (alternates) — paste block

```js
 dagger:  {n:'Quill',          d:'huge crit, hesitates',
   mod:a=>{a.critAdd=(a.critAdd||0)+0.20;a.critMultAdd=(a.critMultAdd||0)+0.6;a.cd*=1.15;a.more*=0.95}},
 spear:   {n:'Patience',       d:'cruel to the spent · resonates: The Quiet',
   mod:a=>{a.vsSpent=(a.vsSpent||0)+0.6;a.stagger=(a.stagger||0)+0.3;a.more*=0.9;
    if(wornUniq('shroud',0)){a.vsSpent+=0.25;a.interrupt=1}}},
 staff:   {n:'Lodestar',       d:'bolts seek, slowly',
   mod:a=>{a.homing=2.4;a.life=3;a.speed*=0.7;a.more*=0.9}},
 brig:    {n:'Restless',       d:'+12% attack speed, +6% move, thinner plate', cdr:.12, ms:.06, arm:-3},
 shroud:  {n:'Tithe',          d:'+50% shard yield, it collects too', greed:.5, sres:-.15},
```

### 2.5 UNIQ3 (extra alternates on existing bases) — paste block

```js
const UNIQ3={
 sword:   {n:'Mercy',          d:'hits bleed, the wounded are finished',
   mod:a=>{a.stR=a.stR||{};a.stR.bleed=Math.max(a.stR.bleed||0,0.35);a.cull=Math.max(a.cull||0,0.10);a.more*=0.9}},
 wand:    {n:'Fulgurite',      d:'one bolt, it shocks and arcs · resonates: Static',
   mod:a=>{a.st=a.st||{};a.st.shock=Math.max(a.st.shock||1,1.35);a.chain=(a.chain||0)+1;a.count=1;a.more*=0.9;a.col='#e6d34a';
    if(wornUniq('robe',2)){a.chain+=1;a.st.shock=Math.max(a.st.shock,1.5)}}},
 bow:     {n:'Dowser',         d:'arrows find their own way',
   mod:a=>{a.homing=2.8;a.life=3;a.more*=0.85}},
 crossbow:{n:'Thunderhead',    d:'shells burst and shock, slow',
   mod:a=>{a.st=a.st||{};a.st.shock=Math.max(a.st.shock||1,1.4);a.explode=Math.max(a.explode||0,40);a.count=1;a.more*=1.15;a.cd*=1.35;a.col='#e6d34a'}},
 chain:   {n:'Lifelode',       d:'+5% leech, +25 HP, lets everything in · resonates: Fever', leech:.05, hp:25, arm:-6},
 robe:    {n:'Static',         d:'+15% attack speed, +30% focus, restless · resonates: Fulgurite', cdr:.15, focus:.3, hp:-10},
 vest:    {n:'Bellows',        d:'+50% focus gain, +10% attack speed, thin', focus:.5, cdr:.1, arm:-2},
 harness: {n:'Slipstream',     d:'+20% move, +60 fuel, nothing spare', ms:.2, fuel:60, hp:-12},
};
```

### 2.6 Break-one-rule-pay-one-cost audit (every entry)

| unique | rule broken | cost paid |
|---|---|---|
| Fever | self-sufficient bleed+leech engine on the fastest base | 15% less |
| Quill | dagger becomes a crit cannon | slower — pays in the base's own currency |
| Plumbline | melee that outranges grunt tells | needle arc, whiffs off-axis |
| Patience | the punish window becomes the whole game | 10% less outside it |
| Stormspine | chain+2 and shock baseline | 20% less, slower |
| Lodestar | fire-and-forget | bolts crawl (speed×0.7), 10% less |
| Butcher's Apron | armor slot buys offense | −10 HP on thin plate |
| Restless | attack speed from armor | −3 armor |
| The Quiet | +1 socket AND a focus engine | −15 HP |
| Tithe | +50% greed (near the greed cap's whole budget) | −15% status resist |
| Mercy | bleed + execute in one blade | 10% less |
| Fulgurite | wand chains and shocks | **count forced 1 — locks out multishot/Volley** |
| Dowser | arrows aim themselves | 15% less |
| Thunderhead | exploding shock artillery | ×1.35 cd, count forced 1 |
| Lifelode | +5% leech from armor | −6 armor (a net-zero-armor chainmail) |
| Static | tempo armor | −10 HP |
| Bellows | ability spam engine | armor 2→0 |
| Slipstream | speed is damage (Momentum) | −12 HP |

Depth distribution follows the bases (rule 17 does the gating): dagger/sword uniques shallow,
spear/brig mid, staff/shroud/crossbow-third deep — the D2 "targeting improves as you descend"
shape without any new mechanism.

---

## 3. AFFIXES (4 new; 12 → 16, target 15–16)

Paste rows into `AFFIXES`:

```js
 ['ailment','% ailment damage',10,30,'pct',1.28], ['aildur','% ailment duration',8,20,'pct',1.22],
 ['reach','% melee reach',6,16,'pct',1.22],       ['area','% blast radius',10,25,'pct',1.24],
```

What each archetype was starving for, and its consumer:

| key | starving archetype | consumer (exact seam) |
|---|---|---|
| `ailment` | blood/rot/pyro — the ONLY gear path to `ailmentMul()` today is zero | **already consumed** by `ailmentMul()=1+inc('ailment')` — zero new code |
| `aildur` | bleed/burn DoT — more ticks per stack under the 3-stack cap | one line in `applyStatus`: `if(!isPlayer)dur*=1+inc('aildur');` (only enemies receive player-applied statuses, so the guard is exact) |
| `reach` | spear/reach melee — an axis no gear could roll | in `computeAttack` beside the cdr/kb folds: `if(a.range)a.range*=1+inc('reach');` |
| `area` | grenadier/aftershock/nova — only shrinkers existed (conc) | beside it: `if(a.explode)a.explode*=1+inc('area');` |

Tier ranges (via `affTierRange`, strictly ascending — suite-12 auto-covers):

| affix | T1 | T2 | T3 | T4 | T5 |
|---|---|---|---|---|---|
| ailment | 10–30 | 13–38 | 17–49 | 22–63 | 28–81 |
| aildur | 8–20 | 10–24 | 12–29 | 15–35 | 18–43 |
| reach | 6–16 | 7–20 | 9–24 | 11–29 | 13–35 |
| area | 10–25 | 12–31 | 15–38 | 19–47 | 24–58 |

`reach`/`aildur` are deliberately compressed (grow 1.22, the ms/leech idiom) — reach interacts
with telegraph literacy and duration with stack saturation; neither may quadruple. The affix
pool stays global (inc() is global across slots, so a `reach` roll on armor legitimately serves
the melee hand, exactly like `fuel` on a sword serves flight — no slot-tagging needed).

---

## 4. MODIFIER AFFIXES (5 new; 12 → 17, target 16–18)

Paste into `MODAFF`:

```js
 {k:'achill',n:'hits chill',                 ilvl:500, mod:a=>{a.st=a.st||{};a.st.chill=Math.min(a.st.chill||9,0.62)}},
 {k:'abounce',n:'projectiles bounce',        slot:'ranged',ilvl:500, mod:a=>{a.bounce=(a.bounce||0)+2}},
 {k:'alunge',n:'swings lunge you forward',   slot:'melee', ilvl:800, mod:a=>{a.lunge=Math.max(a.lunge||0,150)}},
 {k:'agore', n:'+30% vs bleeding',           ilvl:900, mod:a=>{a.vsBleed=(a.vsBleed||0)+0.30}},
 {k:'astun', n:'hits stagger the spent',     ilvl:900, mod:a=>{a.stagger=(a.stagger||0)+0.25}},
```

- `achill` fills the missing hitX modaff (bleed/burn/shock existed, chill didn't); min-combine
  pattern matches `hitChill`. `abounce` gives lightning/arrows the hail contract. `alunge` is
  the movement-attack (Momentum synergy; `lunge` already grants 0.12s i-frames in `doMelee`).
  `astun` extends punish windows only (stagger never creates one, cap 1.2s holds — honest `d`).
- **`agore` introduces `vsBleed`** — full §3.3 conditional checklist, one field shared with
  Fever:
  1. `condMul`: `if(a.vsBleed&&hasSt(e,'bleed'))m*=1+a.vsBleed;`
  2. `doRanged` ride-along list: `vsBleed:a.vsBleed||0,`
  3. `upSentry` copy-list: add `vsBleed` (it already carries vsBurn/vsChill/vsSpent/vsLow)
  4. suite-13 edits — see §7. No RUNM writer yet, so `KNOWN` is untouched.

---

## 5. THE FORGE (playtest finding #5)

The Smith's crafting panel at camp. Shard-fed, table-driven, ilvl-respecting, no new currency.
Story spec owns the Smith's dialogue; this spec provides the panel, the ops, and the META hooks
his dialogue gates on (`META.forge.n`, `META.forge.owk`).

### 5.1 The ops table

```js
// THE FORGE — the Smith works on magic and rare gear. Uniques are finished work; modifier
// affixes are found, not made. Costs scale with item level so deep work costs deep money,
// and RECAST is the uncapped variance sink that keeps shards worth carrying after the
// unlock pool is bought out.
const FORGE_OPS=[
 {id:'fup',  n:'TEMPER',   d:'raise one affix a tier, value rerolled',      cost:it=>Math.round(90+it.ilvl*0.10)},
 {id:'frr',  n:'RECAST',   d:'one affix becomes another, tier redrawn',     cost:it=>Math.round(45+it.ilvl*0.05)},
 {id:'fsock',n:'CUT',      d:'one more socket. once per item.',             cost:it=>Math.round(150+it.ilvl*0.15)},
 {id:'frisk',n:'OVERWORK', d:'he stops being careful. once. it remembers.', cost:it=>Math.round(200+it.ilvl*0.20)},
];
```

### 5.2 Rules — exact semantics

Expose the tier ceiling `affTierFor` already computes internally (refactor, zero behavior
change — suite-12's gate assertions prove it):

```js
function affTierCap(ilvl){let m=1;for(let t=0;t<AFF_TIER_ILVL.length;t++)if(ilvl>=AFF_TIER_ILVL[t])m=t+1;return m}
function affTierFor(ilvl){let t=affTierCap(ilvl);while(t>1&&chance(0.42))t--;return t}
```

- **Eligible**: rarity 1 or 2 only, `!it.owk`. Rarity 0 has nothing to work; rarity 3 refused
  ("Finished work. He will not put a chisel to it."). All four ops leave `it.mods` alone
  except OVERWORK's one grant.
- **TEMPER** (`fup`): pick an affix `k`; `t=it.tiers[k]`; disabled when `t>=affTierCap(it.ilvl)`;
  else `it.tiers[k]=t+1; it.affixes[k]=ri(...affTierRange(AFF[k],t+1))`. The Forge can never
  exceed what depth allows — ilvl stays the only law (rule 17). A T5 exists only on a 2400m+
  item, forged or found.
- **RECAST** (`frr`): pick an affix `k`; delete `it.affixes[k]`/`it.tiers[k]`; roll a NEW key
  from `AFFIXES` not already on the item; `t=affTierFor(it.ilvl)` (the weighted draw — variance,
  not a slider); value `ri(lo,hi)`. Repeatable forever. This is the uncapped variance sink the
  economy needs (ref-research §4: "currency survives only with an uncapped variance sink").
- **CUT** (`fsock`): cap `=GEAR[it.base].sockets+(it.rarity>=2?1:0)+1`, once per item
  (`it.cut=1`). Items already drop at `base+rarityBonus`, so the Forge's one extra socket is the
  marquee purchase — never beyond the Ghostweave precedent (max 5 on a robe). Color rolled from
  the base's `tend`, pushed onto `sockets`/`sc` together (suite-12's `sockets.length===sc.length`
  integrity must survive). Never touches `chroma`.
- **OVERWORK** (`frisk`): once per item, sets `it.owk=1` and closes the Forge to it forever.
  Roll: 40% raise a random un-capped affix a tier (all capped → falls to "holds"); 25% add a
  modifier affix if `!Object.keys(it.mods).length`, candidates filtered exactly like `mkItem`
  (`ilvl>=m.ilvl && (!m.slot||m.slot===slot||slot==='armor')`, none eligible → "holds"); 20%
  nothing; 15% strip one random affix. Toasts: `THE METAL GIVES` / `THE METAL SINGS` /
  `the metal holds` / `THE METAL TAKES`. This is the only way a modaff is ever made rather than
  found, it is once-per-item, and it respects every ilvl/slot gate.
- **Forbidden, complete list**: uniques (all ops), normals (all ops), modaff edit/removal/reroll
  (all ops), tier past `affTierCap(ilvl)`, second CUT, anything after OVERWORK, sockets past cap,
  chroma changes, ilvl changes, rarity changes.

### 5.3 Costs vs the economy

| ilvl | TEMPER | RECAST | CUT | OVERWORK |
|---|---|---|---|---|
| 400 | 130 | 65 | 210 | 280 |
| 1500 | 240 | 120 | 375 | 500 |
| 2900 | 380 | 190 | 585 | 780 |

One mid-depth op ≈ one mid unlock (85–135◆) — the Forge competes with the unlock pool without
dominating it; the 6.7k pool stays the spine. Post-buyout, RECAST at depth is the repeatable
sink (65–190◆ per pull) and CUT/OVERWORK are the premium sinks. Vault deposit (60–650) + Forge
= the persistent-item loop: store a keeper, work it between runs.

### 5.4 Panel flow (openPanel machinery, buttons only, non-modal)

- `openCamp()` gains one row after THE VAULT, gated on the first Knot (act structure — progress
  FELT at the surface): rendered only when `Object.keys(META.bosses).length>=1`:
  `<button onclick="openForge()">THE FORGE — ${META.forge.n?META.forge.n+' worked':'cold iron'}</button>`
- `openForge()` → `openPanel(h,false,openForge)`. Header `<h2>THE FORGE</h2>`, sub in the
  fragment voice: `He looks at your gear, not at you.` Then sections WORN (EQ), PACK (BAG
  gear), THE VAULT (META.vault) — one `<button onclick="openForgeItem(uid)">` per eligible
  item (`itemName — affixStr`), ineligible rows `<button disabled>` with the reason
  (`finished work` / `nothing to work` / `overworked`). BACK → `openCamp()`.
- `openForgeItem(uid)` → `openPanel(h,false,()=>openForgeItem(uid))`. Item card (name, ilvl,
  affixStr, sockStr), then one button per `FORGE_OPS` row showing `n — d — cost◆`, disabled
  when unaffordable or inapplicable (TEMPER: every tier at cap; RECAST: no affixes; CUT:
  `it.cut` or at cap; OVERWORK: `it.owk`). TEMPER/RECAST → `openForgeAff(uid,op)`; CUT →
  `doForgeOp(uid,'fsock')`; OVERWORK → inline confirm rows (two buttons: `LET HIM` →
  `doForgeOp(uid,'frisk')`, `NOT YET` → back). BACK → `openForge()`.
- `openForgeAff(uid,op)`: one button per affix line — TEMPER shows `label: T2 → Greater T3`,
  RECAST shows `label → ?`. Disabled rows carry the reason (`at what this depth allows`).
- `doForgeOp(uid,op,key)`: find via `forgeItem(uid)` (searches EQ slots, BAG, META.vault);
  check shards (`sfx('deny')`+toast on fail); mutate; `META.shards-=cost; META.forge.n++`
  (`.owk++` for OVERWORK); `saveMeta()`; **`refreshAttacks()` if the item sits in EQ** (the
  most-forgotten call — TEMPER on a worn item must move `ATK` immediately); `sfx('gem')`;
  reopen `openForgeItem(uid)`.
- Every element is a `<button>` (dpad law); every panel passes its builder as `fn` so device
  switches redraw; nothing here is modal, so `closePanel` never leaves the game paused. Works
  identically from title-camp and pause-camp (`nearCamp()`), including mid-run on run items —
  that is intended tempo play.

### 5.5 META / save — SAVE_VER bump spec

- `SAVE_VER` 2 → 3.
- `META` literal gains `forge:{n:0,owk:0}` (n = ops ever done, owk = overworks — the Smith's
  dialogue gates and nothing else read them).
- `migrate(m)`: append (keep the v1→v2 block):
  `if(m.ver<3){m.forge={n:0,owk:0};m.ver=3}`
- `loadMeta()` belt-and-braces: `if(!META.forge)META.forge={n:0,owk:0};`
- Item fields `it.cut`/`it.owk` are optional-absent (falsy on old items, survive JSON in the
  vault) — no item migration needed. No new `seen` bucket.
- `node test/pwa.js` must stay green: it plants a v1 blob and asserts `ver` lands at the
  current value — if it hard-codes `2`, update to read `SAVE_VER`/expect 3, and assert
  `META.forge` exists after migration.

---

## 6. UNLOCKS + registration

Paste into `UNLOCKS` (new banner, after the wave-3 block):

```js
 // ---- gear wave: the knife, the reach, the deep caster, and armor for the new blood ----
 {id:'dagger',n:'Dagger (gear)',        cost:40},
 {id:'spear', n:'Spear (gear)',         cost:55},
 {id:'brig',  n:'Brigandine (gear)',    cost:60},
 {id:'staff', n:'Staff (gear)',         cost:85},
 {id:'shroud',n:'Abyssal Shroud (gear)',cost:85},
```

Costs sit in the established first-tier band (30–85), scaled by depth gate. Pool total rises
6735 → 7060 — regenerate CURRENT-STATE via `design/audit.sh` after landing.

Registration checklist per ref-items §12, confirmed complete for this spec:
- New bases: GEAR entry ✓, UNLOCKS ✓, UNIQUES primary ✓ (so UNIQ2 is reachable), `sc` chars
  valid ✓, `tend` set ✓, `ilvl` gates ✓. Drops/shop/bag/codex need zero wiring (pools iterate).
- New uniques: primaries exist for every base with alternates ✓; UNIQ3 only where UNIQ2
  exists ✓ (sword, wand, bow, crossbow, chain, robe, vest, harness all have UNIQ2). No UNLOCKS
  entries (uniques ride the base's unlock).
- New affixes: rows + the two one-line consumers (§3) + `ailment`/`aildur` need nothing else.
- New modaffs: table rows only, except `vsBleed` (§4 checklist).
- Class kits: none of the new bases enter kits in this spec — the storm/blood class spec may
  claim dagger/staff (coordinate, see risks).

---

## 7. TEST-SUITE EDITS (exact, per suite)

1. **suite-13 `FIELDS`** (~line 127–130): add `vsBleed` — without it the no-dead-gems snapshot
   reports `agore`-adjacent content dead and can't see Fever's field.
2. **suite-13 `CONDS`** (~line 168–175): add `{f:'vsBleed', set:e=>applyStatus(e,{bleed:5},false)}`
   — melee/ranged parity at 0.5 must both gain >1.05× and match within 0.08.
3. **suite-13 `effDps` credit table**: `vsBleed` credited FULL when the build self-applies
   bleed (the vsBurn/vsChill rule), else ×0.5.
4. **suite-12, new block "the forge"** (or a new `suite-16.js` + `SUITES` in `run.sh`):
   TEMPER refuses past `affTierCap` (a 700m item can never reach T4/T5, a 2900m item can);
   RECAST never touches `it.mods`, never duplicates an affix key, keeps affix count constant;
   CUT respects cap and once-only, `sockets.length===sc.length` after, colors ∈ SOCK;
   OVERWORK once-only and closes all ops; unique/normal/overworked items refused; every op
   charges exactly `cost(it)` and refuses when broke; a vaulted item survives
   `saveMeta()`→`loadMeta()` with its forged state; `affTierFor(ilvl) <= affTierCap(ilvl)`
   for all ilvls (refactor guard).
5. **suite-12 base gating**: extend the pool assertions — `gearPool(100)` excludes
   spear/brig/staff/shroud, includes dagger at 200; `gearPool(2800)` includes all five.
6. **suite-7, new block "uniq3 + resonance"**: every UNIQ3 key has UNIQUES and UNIQ2;
   `uniqueDef(k,2)` returns the third; forced-alt `mkItem` never yields `alt>0` without a
   primary; equip Fever dagger + Lifelode chain → `ATK.melee.stR.bleed>=0.55`, unequip the
   chain → 0.4 (cache coherence through `refreshAttacks`); Fulgurite + Static → `chain` 2 and
   `st.shock` 1.5 on the wand.
7. **suite-7 or suite-12, new affix consumers**: `RUNB.reach=0.2` (or a rolled reach affix) moves
   `ATK.melee.range` ×1.2 and leaves `ATK.ranged` untouched; `area` scales `explode` only when
   present; `aildur` extends the duration of a bleed applied to an ENEMY and never scales
   statuses landing ON the player.
8. **pwa.js**: v1 blob migrates to `ver===3` with `META.forge` present (§5.5).
9. Existing assertions that auto-cover with zero edits (verified against the refs): suite-12
   per-affix strict tier ascent, modaff slot/ilvl/one-per-item over the widened tables,
   drop-volume band, suite-13 shop honesty over the five new unlock ids, suite-7 §13d
   namespace collision, suite-7 sc-char validity.
10. After landing: `./test/run.sh && node test/pwa.js && design/audit.sh` (CURRENT-STATE counts:
    bases 17, uniques 42, affixes 16, modaffs 17, unlocks 88).

---

## 8. RISKS / COORDINATION

- **Parallel-spec id collisions**: the storm/blood class spec and the gems spec are being
  written concurrently — `dagger`/`staff`/`spear` are natural kit picks (good, coordinate) and
  `vsBleed` may be independently invented by the blood-class spec; if so the definitions must
  be char-identical (condMul clause, ride-along, sentry list). The unique NAMES `Static`,
  `Patience`, `Mercy` are display strings, not ids — no namespace risk.
- **Fulgurite/Thunderhead force `count=1` after gems** — intentional lockout (runs after
  Multishot, killing it). suite-13's no-dead-gems probe sockets gems into plain bases, so no
  false "dead multishot" report, but a player-facing surprise; the `d` text carries the rule.
- **Ranged dps family**: staff 25.3 makes crossbow the lowest-dps deep ranged base — it keeps
  speed 560 + `gg`; if suite-13's spread drifts past 4.5× after the class spec lands, trim
  staff to dmg 23.
- **`reach` affix + Plumbline** stack to ~95px melee reach at T5 — still inside enemy
  `atkReach` bands (no telegraph dishonesty; markers are enemy-side), but watch feel in
  shots.js.
- **Forge on run items mid-run** is deliberately allowed (camp reachable via anchor); it makes
  shards a live tempo resource. If playtest shows it trivializing the Vault, gate the Forge to
  vault items only — one filter line.
- **`affTierCap` refactor** must be behavior-identical to the old inline max (suite-12's
  4000-roll leak test is the guard).
- **`aildur` consumer placement**: `applyStatus` is shared by hostile sources targeting the
  player (`isPlayer=true`) — the `!isPlayer` guard is the entire correctness argument; a test
  in §7.7 pins it.
- **Art**: five new bases want gear-in-hand sprites eventually (ART EXTENSION dimension);
  nothing here blocks on it — `drawEntity` falls back to rects by design.
