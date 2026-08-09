# SHARDFALL — current-state audit

_Generated from the live tables in `index.html`. Do not hand-edit; regenerate._

## Scale

| | |
|---|---|
| world | 1600 x 3200 tiles (25.6k x 51.2k px) |
| tile | 16px, chunk 48x48 |
| surface | y=60 |
| gravity / move / jump | 1500 / 170 / 430 |
| flight | thrust 2100, drain 42/s, regen 58/s, cap -190 |
| fall | safe below 520px/s, 0.11 hp per px/s over, capped 55% maxHP |
| crit | 5% base, 1.8x, status at 1.5x on crit |
| focus | max 100, 8/hit, 25/kill, 2/s idle |
| weight | grace 90s, +1 per 18s, max 10 |

## Biomes

| biome | ends at (tiles) | depth (m) | ground | cave density | roster |
|---|---|---|---|---|---|
| surface | 70 | 0–10 | 1 | 0 | crawler |
| caves | 400 | 10–340 | 2 | 0.055 | crawler, bat, rockling |
| fungal | 900 | 340–840 | 4 | 0.06 | spitter, sporeling, stalker, bat |
| ruins | 1600 | 840–1540 | 5 | 0.05 | brute, archer, shieldman |
| forge | 2400 | 1540–2340 | 6 | 0.055 | ember, smith, spitter |
| abyss | 3200 | 2340–3140 | 7 | 0.045 | wraith, voidspawn, stalker |

## Enemies

| enemy | hp | dmg | spd | armor | size | ai | windup | active | atk cd | lunge | shoot | shards |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| crawler | 24 | 8 | 42 | 0 | 14x12 | walk | 0.34 | 0.16 | 1.5 | 190 | — | 2 |
| bat | 14 | 6 | 78 | 0 | 12x10 | fly | 0.28 | 0.14 | 1.7 | 300 | — | 2 |
| brute | 85 | 16 | 34 | 3 | 20x22 | walk | 0.48 | 0.2 | 2.1 | 150 | — | 6 |
| spitter | 30 | 6 | 30 | 0 | 14x14 | walk | 0.34 | 0.14 | 2 | 120 | cd 1.9 dmg 7 x1 r300 | 4 |
| rockling | 40 | 11 | 52 | 4 | 14x14 | walk | 0.3 | 0.16 | 1.6 | 420 | — | 3 |
| sporeling | 22 | 7 | 44 | 0 | 13x13 | walk | 0.3 | 0.14 | 1.6 | 170 | — | 3 |
| stalker | 18 | 13 | 118 | 0 | 11x15 | walk | 0.22 | 0.12 | 1.2 | 460 | — | 4 |
| archer | 34 | 8 | 28 | 0 | 13x16 | walk | 0.36 | 0.14 | 2.2 | 100 | cd 2.3 dmg 17 x1 r520 | 5 |
| shieldman | 70 | 14 | 26 | 12 | 18x20 | walk | 0.44 | 0.2 | 2.3 | 150 | — | 6 |
| ember | 26 | 10 | 66 | 0 | 13x13 | walk | 0.26 | 0.14 | 1.5 | 300 | — | 4 |
| smith | 150 | 24 | 22 | 16 | 24x26 | walk | 0.58 | 0.24 | 2.6 | 130 | cd 3 dmg 14 x2 r280 | 9 |
| wraith | 48 | 18 | 70 | 0 | 14x18 | fly | 0.3 | 0.16 | 1.7 | 340 | — | 8 |
| voidspawn | 60 | 15 | 54 | 0 | 16x16 | walk | 0.32 | 0.16 | 1.8 | 220 | — | 7 |
| voidling | 20 | 9 | 82 | 0 | 10x10 | walk | 0.24 | 0.12 | 1.4 | 240 | — | 2 |
| warden **(boss)** | 420 | 22 | 46 | 4 | 28x30 | walk | 0.5 | 0.22 | 2.2 | 260 | cd 2.4 dmg 12 x3 r380 | 40 |
| sporemother **(boss)** | 520 | 18 | 58 | 0 | 30x26 | fly | 0.42 | 0.18 | 2.4 | 280 | cd 1.7 dmg 10 x5 r420 | 55 |
| sentinel **(boss)** | 700 | 26 | 40 | 10 | 26x32 | walk | 0.44 | 0.2 | 2 | 240 | cd 1.4 dmg 14 x2 r460 | 75 |
| forgelord **(boss)** | 900 | 32 | 44 | 8 | 32x34 | walk | 0.46 | 0.22 | 2 | 250 | cd 2 dmg 18 x3 r420 | 100 |
| voidmaw **(boss)** | 1200 | 38 | 76 | 6 | 34x30 | fly | 0.36 | 0.18 | 1.8 | 380 | cd 1.2 dmg 20 x4 r480 | 140 |

### Depth scaling

| depth (m) | depthMul | crawler hp | crawler dmg | brute hp | voidmaw hp |
|---|---|---|---|---|---|
| 0 | 1.00x | 24 | 8 | 85 | 1200 |
| 200 | 1.22x | 29 | 10 | 104 | 1467 |
| 400 | 1.44x | 35 | 12 | 123 | 1733 |
| 900 | 2.00x | 48 | 16 | 170 | 2400 |
| 1600 | 2.78x | 67 | 22 | 236 | 3333 |
| 2400 | 3.67x | 88 | 29 | 312 | 4400 |
| 3140 | 4.49x | 108 | 36 | 382 | 5387 |

## Gear bases

| base | slot | dmg | cd | dps | range/speed | sockets | colors | armor | hp | fuel | dig |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Sword | melee | 10 | 0.38 | 26.3 | 26 | 1 | r | 0 | 0 | 0 | 0 |
| Axe | melee | 16 | 0.55 | 29.1 | 24 | 1 | r | 0 | 0 | 0 | 1 |
| Bow | ranged | 8 | 0.5 | 16.0 | 420 | 1 | g | 0 | 0 | 0 | — |
| Wand | ranged | 7 | 0.34 | 20.6 | 340 | 2 | bb | 0 | 0 | 0 | — |
| Leather Vest | armor | — | — | — | — | 1 | g | 2 | 20 | 0 | — |
| Chainmail | armor | — | — | — | — | 1 | r | 6 | 45 | 0 | — |
| Runed Robe | armor | — | — | — | — | 3 | bbb | 0 | 12 | 25 | — |
| Delver Harness | armor | — | — | — | — | 2 | gb | 3 | 22 | 70 | — |
| Plate | armor | — | — | — | — | 1 | r | 12 | 80 | 0 | — |
| Greataxe | melee | 30 | 0.85 | 35.3 | 32 | 2 | rr | 0 | 0 | 0 | 2 |
| Crossbow | ranged | 20 | 0.9 | 22.2 | 560 | 2 | gg | 0 | 0 | 0 | — |
| Shield | any (shield) | 6 | 0.5 | 12.0 | 20 | 1 | r | 8 | 0 | 0 | 0 |

## Gems by type

### skill (16)

| id | name | color | for | effect |
|---|---|---|---|---|
| cleave | Cleave | r | melee | wide arc, slower |
| nova | Nova | r | melee | 360°, hits everything, slow |
| shieldbash | Shield Bash | r | melee | huge knockback |
| fireball | Fireball | b | ranged | slow, explodes |
| lightning | Lightning | b | ranged | fast, pierces, spammy |
| bore | Bore | r | ranged | tunnels through rock |
| whirlwind | Whirlwind | r | melee | channel while held, drains focus |
| lunge | Lunge | g | melee | dash forward on every swing |
| riposte | Riposte | r | melee | huge, but only just after a block |
| sunder | Sunder | r | melee | low damage, shreds armor |
| reap | Reap | g | melee | scales with missing enemy health |
| grenade | Grenade | r | ranged | lobbed, bounces, explodes |
| wisp | Homing Wisp | b | ranged | slow seeker, fire and forget |
| frostlance | Frost Lance | b | ranged | pierces, chills, ramps per hit |
| sporeburst | Spore Burst | g | ranged | short cone, brutal up close |
| siphon | Siphon Beam | b | ranged | continuous beam, leeches, drains focus |

### sup (22)

| id | name | color | for | effect |
|---|---|---|---|---|
| multishot | Multishot | g | ranged | 3 projectiles, 30% less damage |
| addedfire | Added Fire | b | any | +30% more damage |
| fasteratk | Faster Attacks | g | any | 25% faster |
| pierce | Pierce | g | ranged | +2 pierce |
| lifeleech | Life Leech | r | any | heal 12% of damage dealt |
| heavyimpact | Heavy Impact | r | melee | +45% more damage, slower |
| aftershock | Aftershock | r | any | hits explode |
| ignite | Ignite | b | any | hits burn |
| frostbite | Frostbite | b | any | hits chill |
| conduit | Conduit | b | any | hits shock (+35% damage taken) |
| serration | Serration | g | melee | hits bleed |
| excavate | Excavate | r | any | any attack digs |
| chainbolt | Chain | b | any | hits jump to 2 more enemies |
| fork | Fork | g | ranged | projectiles split on first hit |
| ret | Return | g | ranged | projectiles boomerang back |
| conc | Concentrated | r | any | +55% more damage, −40% area |
| culling | Culling | r | any | executes enemies under 12% HP |
| momentum | Momentum | g | any | damage scales with move speed |
| overload | Overload | r | any | +80% more damage, +60% cooldown |
| precision | Precision | g | any | +18% crit chance, −15% damage |
| twin | Twin Strike | g | melee | strike twice at 60% each |
| deepcut | Deep Cut | b | any | +60% ailment damage, −25% hit damage |

### aura (11)

| id | name | color | for | effect |
|---|---|---|---|---|
| thorns | Thorns | r | armor | reflect damage on contact |
| regrowth | Regrowth | b | armor | +2 HP/s |
| swiftness | Swiftness | g | armor | +15% move speed |
| ironskin | Ironskin | r | armor | 20% damage reduction |
| featherfall | Featherfall | g | armor | no fall damage |
| updraft | Updraft | b | armor | +70 fuel |
| bloodscent | Bloodscent | r | armor | +30% vs bleeding or burning |
| staticfield | Static Field | b | armor | pulses shock around you |
| warding | Warding | b | armor | +50% status resist, −10% damage |
| prospector | Prospector | g | armor | reveals ore and secrets on the map |
| undertow | Undertow | g | armor | below 40% HP: +25% move and attack speed |

### abil (13)

| id | name | color | for | effect |
|---|---|---|---|---|
| blink | Blink | g | armor | dash through, brief i-frames · 4s / 25 focus |
| warcry | War Cry | r | armor | +25% damage 8s, shocks nearby · 12s / 45 focus |
| meteor | Meteor | b | armor | lobbed fireball, big burn · 9s / 50 focus |
| mend | Mend | b | armor | heal 35% and cleanse · 16s / 55 focus |
| quake | Quake | r | armor | AoE slam, digs a crater · 11s / 50 focus |
| levitate | Levitate | b | armor | 6s of free flight · 14s / 40 focus |
| grapple | Grapple | g | armor | yank yourself, or an enemy · 5s / 20 focus |
| burrow | Burrow | r | armor | phase through solid rock · 10s / 35 focus |
| shaft | Shaft | r | armor | drill 26 tiles straight down · 8s / 30 focus |
| bulwark | Bulwark | r | armor | overshield, scales with armor · 14s / 45 focus |
| sentry | Shard Sentry | g | armor | turret fires your ranged attack · 16s / 60 focus |
| decoy | Decoy | g | armor | taunt dummy pulls aggro · 12s / 35 focus |
| rupture | Rupture | b | armor | detonate all nearby ailments · 10s / 50 focus |

## Affixes

| key | label | min | max | scale |
|---|---|---|---|---|
| dmg | % increased damage | 8 | 25 | pct |
| hp | + max HP | 8 | 30 | flat |
| cdr | % attack speed | 6 | 18 | pct |
| ms | % move speed | 5 | 15 | pct |
| crit | % crit chance | 3 | 9 | pct |
| critMult | % crit damage | 12 | 35 | pct |
| arm | + armor | 2 | 9 | flat |
| sres | % status resist | 8 | 22 | pct |
| greed | % shard drops | 10 | 28 | pct |
| fuel | + fuel | 12 | 40 | flat |
| focus | % focus gain | 10 | 30 | pct |
| leech | % life leech | 2 | 5 | pct |

## Uniques

| base | primary | alternate |
|---|---|---|
| sword | **Widow's Kiss** — all hits bleed, very fast | **Splitfang** — every hit chains to a second enemy |
| axe | **Gravedigger** — digs stone, heals on hit | **Rimebite** — chills, and shatters what it chills |
| greataxe | **Worldbreaker** — digs anything, huge impact | **The Long Hunger** — executes the wounded, heals you |
| bow | **Hornet's Call** — +2 arrows, weaker each | **Windwake** — arrows return, damage scales with speed |
| crossbow | **Judgment** — devastating, slow, pierces | **Deadeye** — huge crit, single bolt |
| wand | **Ashfall** — every bolt ignites | **Hollow Star** — bolts fork and pierce |
| shield | **Bulwark** — bash shocks and shatters | **Last Word** — bash executes, blocks harder |
| vest | **Second Skin** — +2 sockets | **Ghostweave** — +3 sockets, no armor |
| robe | **Threadbare Crown** — +2 sockets, fragile | **Emberweave** — +45 fuel, burns brighter |
| chain | **Scalemail of the Deep** — +35 HP, +8 armor | **Ironbound** — +16 armor, slower |
| plate | **Anchor** — +90 HP, +15 armor, heavy | **The Mountain** — +140 HP, +22 armor, very heavy |
| harness | **Skyrigger** — huge fuel, immune to fall damage | **Stormrigger** — +110 fuel, +15% move |

## Attunements (in-run levels)

| id | name | effect | kind |
|---|---|---|---|
| edge | Whetted | +15% damage | stat |
| quick | Quickened | +12% attack speed | stat |
| stride | Long Stride | +12% move speed | stat |
| hide | Thick Hide | +30 max HP | stat |
| plate | Plated | +5 armor | stat |
| keen | Keen | +6% crit chance | stat |
| cruel | Cruel | +35% crit damage | stat |
| venom | Envenomed | +30% ailment damage | stat |
| ward | Warded | +25% status resist | stat |
| zeal | Zealous | +35% focus gain | stat |
| greed | Covetous | +30% shard drops | stat |
| punch | Punch-Through | +1 pierce | stat |
| feast | Feast | kills heal you for 4% of max HP | mechanic |
| burst | Backdraft | dodging detonates where you were | mechanic |
| cornered | Cornered | +30% damage below half health | mechanic |
| momentum | Momentum | +25% damage while moving fast | mechanic |
| overflow | Overflow | full focus adds +20% damage | mechanic |
| echo | Echo | kills cut 0.6s from your ability | mechanic |
| thorn | Bramble | attackers take damage back | mechanic |
| scav | Scavenger | chests and elites drop more | mechanic |
| second | Second Wind | once per run, survive a fatal hit | mechanic |
| siphon | Siphon | +4% life leech on everything | stat |

### Level curve

| level | xp to next | cumulative |
|---|---|---|
| 1 | 30 | 30 |
| 2 | 39 | 69 |
| 3 | 51 | 120 |
| 4 | 66 | 186 |
| 5 | 86 | 272 |
| 6 | 111 | 383 |
| 7 | 145 | 528 |
| 8 | 188 | 716 |
| 9 | 245 | 961 |
| 10 | 318 | 1279 |
| 11 | 414 | 1693 |
| 12 | 538 | 2231 |
| 13 | 699 | 2930 |
| 14 | 909 | 3839 |

## Threat tiers

| tier | requires | shards | rarity | effect |
|---|---|---|---|---|
| 0 — None | 0 bosses | 100% | 100% | The deep as it is. |
| 1 — I — Watched | 1 bosses | 125% | 110% | The Weight arrives twice as fast. |
| 2 — II — Armed | 2 bosses | 155% | 120% | Everything down here has armor. |
| 3 — III — Swift | 3 bosses | 190% | 135% | Enemies move and strike noticeably faster. |
| 4 — IV — Teeming | 4 bosses | 235% | 155% | Elites are common. Grunts come in numbers. |
| 5 — V — Buried | 5 bosses | 290% | 180% | Your light is smaller. The dark reaches further. |

## Meta tree

| id | branch | effect | cost | requires |
|---|---|---|---|---|
| m1 | Might | +10% melee dmg | 20 | — |
| m2 | Might | +15 max HP | 35 | m1 |
| m3 | Might | +20% knockback | 50 | m2 |
| m4 | Might | +6 armor | 70 | m3 |
| m5 | Might | +25% crit damage | 95 | m4 |
| c1 | Cunning | +10% move speed | 20 | — |
| c2 | Cunning | +15% attack speed | 35 | c1 |
| c3 | Cunning | Longer dodge i-frames | 50 | c2 |
| c4 | Cunning | +5% crit chance | 70 | c3 |
| c5 | Cunning | +30% focus gain | 95 | c4 |
| s1 | Sorcery | +10% ranged dmg | 20 | — |
| s2 | Sorcery | +1 projectile pierce | 35 | s1 |
| s3 | Sorcery | +15% shard drops | 50 | s2 |
| s4 | Sorcery | +25% status resist | 70 | s3 |
| s5 | Sorcery | +30% ailment damage | 95 | s4 |

## Economy

| sink | total shards |
|---|---|
| unlock pool (68 entries) | 5060 |
| meta tree (15 nodes) | 810 |
| classes | 225 |
| **total one-time** | **6095** |
| gem fusion | 150 (T1→T2) / 500 (T2→T3), unbounded |
| vault deposit | 60 / 140 / 300 / 650 by rarity |

## Boons

| name | effect |
|---|---|
| Wrath | +25% damage |
| Haste | +20% attack speed |
| Fleetfoot | +18% move speed |
| Vigor | +40 max HP, heal |
| Ruin | +35% dmg, -15 HP |
| Avarice | +40% shard drops |
| Puncture | +1 pierce, +10% dmg |
| Keen Edge | +8% crit, +40% crit dmg |
| Bulwark | +10 armor, -8% move |
| Zeal | +50% focus gain |
| Venom | +45% ailment damage |
| Ward | +35% status resist |

## Counts

| | |
|---|---|
| gems | 62 |
| gear bases | 12 |
| uniques | 24 |
| enemies | 19 |
| affixes | 12 |
| unlocks | 68 |
| tree nodes | 15 |
| boons | 12 |
| attunements | 22 |
| threat tiers | 6 |
| lore fragments | 13 |
