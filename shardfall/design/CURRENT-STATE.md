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
| caves | 400 | 10–340 | 2 | 0.055 | crawler, bat, rockling, delvemite, burrower, spitter, blackdamp |
| fungal | 900 | 340–840 | 4 | 0.06 | spitter, sporeling, stalker, bat, bloomback, delvemite, felter, hypha |
| ruins | 1600 | 840–1540 | 5 | 0.05 | brute, archer, shieldman, chanter, warder, mortar, burrower, drudge, lurcher, pavise |
| forge | 2400 | 1540–2340 | 6 | 0.055 | ember, smith, spitter, mortar, warder, burrower, cinder, clinker |
| abyss | 3200 | 2340–3140 | 7 | 0.045 | wraith, voidspawn, stalker, hollowed, chanter, seep, voidmote, cleft, gazer |

## Enemies

| enemy | hp | dmg | spd | armor | size | ai | windup | active | atk cd | lunge | shoot | shards |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| crawler | 24 | 13 | 42 | 0 | 14x12 | walk | 0.34 | 0.16 | 1.5 | 190 | — | 2 |
| bat | 14 | 10 | 78 | 0 | 12x10 | fly | 0.28 | 0.14 | 1.7 | 260 | — | 2 |
| brute | 85 | 20 | 34 | 3 | 20x22 | walk | 0.48 | 0.2 | 2.1 | 150 | — | 6 |
| spitter | 30 | 11 | 30 | 0 | 14x14 | walk | 0.34 | 0.14 | 2 | 120 | cd 1.9 dmg 12 x1 r300 | 4 |
| rockling | 70 | 18 | 52 | 4 | 14x14 | walk | 0.3 | 0.16 | 1.6 | 260 | — | 3 |
| sporeling | 22 | 12 | 44 | 0 | 13x13 | walk | 0.3 | 0.14 | 1.6 | 170 | — | 3 |
| stalker | 18 | 19 | 118 | 0 | 11x15 | walk | 0.26 | 0.12 | 1.2 | 300 | — | 4 |
| archer | 34 | 12 | 28 | 0 | 13x16 | walk | 0.36 | 0.14 | 2.2 | 100 | cd 2.3 dmg 20 x1 r520 | 5 |
| shieldman | 70 | 18 | 26 | 12 | 18x20 | walk | 0.44 | 0.2 | 2.3 | 150 | — | 6 |
| ember | 26 | 15 | 66 | 0 | 13x13 | walk | 0.26 | 0.14 | 1.5 | 240 | — | 4 |
| smith | 150 | 24 | 22 | 11 | 24x26 | walk | 0.58 | 0.24 | 2.6 | 130 | cd 3 dmg 14 x2 r280 | 9 |
| wraith | 48 | 20 | 70 | 0 | 14x18 | fly | 0.3 | 0.16 | 1.7 | 260 | cd 2.8 dmg 15 x1 r420 | 8 |
| voidspawn | 60 | 17 | 54 | 0 | 16x16 | walk | 0.32 | 0.16 | 1.8 | 220 | — | 7 |
| voidling | 20 | 12 | 82 | 0 | 10x10 | walk | 0.26 | 0.12 | 1.4 | 240 | — | 2 |
| delvemite | 10 | 8 | 96 | 0 | 9x8 | walk | 0.26 | 0.1 | 1.1 | 200 | — | 1 |
| burrower | 55 | 20 | 58 | 0 | 15x14 | fly | 0.34 | 0.16 | 1.9 | 240 | — | 6 |
| bloomback | 120 | 16 | 24 | 3 | 19x18 | walk | 0.5 | 0.2 | 2.4 | 140 | — | 8 |
| chanter | 42 | 10 | 34 | 0 | 13x18 | walk | 0.38 | 0.14 | 2.4 | 110 | — | 8 |
| warder | 60 | 12 | 22 | 4 | 14x16 | walk | 0.44 | 0.18 | 2.6 | 120 | — | 8 |
| mortar | 50 | 12 | 16 | 0 | 14x15 | walk | 0.4 | 0.14 | 2.6 | 100 | cd 3.2 dmg 22 x1 r560 | 7 |
| hollowed | 140 | 24 | 30 | 7 | 15x22 | walk | 0.54 | 0.22 | 2.5 | 150 | — | 9 |
| blackdamp | 28 | 12 | 36 | 0 | 14x12 | fly | 0.3 | 0.14 | 2 | 140 | — | 3 |
| felter | 44 | 9 | 40 | 0 | 13x14 | fly | 0.34 | 0.12 | 2.6 | 100 | — | 7 |
| hypha | 60 | 16 | 52 | 0 | 15x13 | fly | 0.34 | 0.16 | 1.9 | 230 | — | 7 |
| drudge | 16 | 9 | 60 | 3 | 10x11 | walk | 0.26 | 0.1 | 1.3 | 180 | — | 1 |
| lurcher | 30 | 16 | 104 | 0 | 15x12 | walk | 0.28 | 0.14 | 1.4 | 320 | — | 4 |
| pavise | 60 | 14 | 18 | 14 | 16x18 | walk | 0.44 | 0.16 | 2.5 | 110 | cd 2.8 dmg 18 x1 r440 | 8 |
| cinder | 12 | 9 | 80 | 0 | 9x9 | fly | 0.26 | 0.1 | 1.3 | 220 | — | 1 |
| clinker | 110 | 18 | 24 | 9 | 19x19 | walk | 0.48 | 0.2 | 2.4 | 160 | — | 8 |
| seep | 66 | 15 | 30 | 0 | 16x14 | walk | 0.4 | 0.16 | 2.2 | 170 | — | 8 |
| voidmote | 14 | 10 | 82 | 0 | 10x9 | fly | 0.26 | 0.12 | 1.5 | 240 | — | 2 |
| cleft | 130 | 20 | 40 | 0 | 20x20 | walk | 0.44 | 0.18 | 2.2 | 200 | — | 12 |
| gazer | 55 | 14 | 44 | 0 | 14x16 | fly | 0.34 | 0.14 | 2.4 | 140 | cd 3 dmg 26 x1 r560 | 9 |
| warden **(boss)** | 420 | 22 | 46 | 4 | 28x30 | walk | 0.5 | 0.22 | 2.2 | 260 | cd 2.4 dmg 12 x3 r380 | 40 |
| sporemother **(boss)** | 520 | 23 | 58 | 0 | 30x26 | fly | 0.42 | 0.18 | 2.4 | 280 | cd 1.7 dmg 10 x5 r420 | 55 |
| sentinel **(boss)** | 700 | 25 | 40 | 10 | 26x32 | walk | 0.44 | 0.2 | 2 | 240 | cd 1.4 dmg 14 x2 r460 | 75 |
| forgelord **(boss)** | 900 | 30 | 44 | 8 | 32x34 | walk | 0.46 | 0.22 | 2 | 250 | cd 2 dmg 16 x3 r420 | 100 |
| voidmaw **(boss)** | 1200 | 26 | 76 | 6 | 34x30 | fly | 0.36 | 0.18 | 1.8 | 300 | cd 1.2 dmg 16 x4 r480 | 140 |
| weft **(boss)** | 2000 | 34 | 52 | 12 | 38x36 | fly | 0.52 | 0.2 | 2.2 | 300 | cd 2.2 dmg 15 x3 r500 | 220 |
| witness **(boss)** | 1500 | 28 | 60 | 6 | 26x34 | fly | 0.46 | 0.18 | 2 | 280 | cd 1.6 dmg 15 x2 r520 | 170 |

### Depth scaling

| depth (m) | depthMul | crawler hp | crawler dmg | brute hp | voidmaw hp |
|---|---|---|---|---|---|
| 0 | 1.00x | 24 | 13 | 85 | 1200 |
| 200 | 1.22x | 29 | 16 | 104 | 1467 |
| 400 | 1.44x | 35 | 19 | 123 | 1733 |
| 900 | 2.00x | 48 | 26 | 170 | 2400 |
| 1600 | 2.78x | 67 | 36 | 236 | 3333 |
| 2400 | 3.67x | 88 | 48 | 312 | 4400 |
| 3140 | 4.49x | 108 | 58 | 382 | 5387 |

## Gear bases

| base | slot | dmg | cd | dps | range/speed | sockets | colors | armor | hp | fuel | dig |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Sword | melee | 10 | 0.38 | 26.3 | 34 | 1 | r | 0 | 0 | 0 | 0 |
| Axe | melee | 16 | 0.55 | 29.1 | 32 | 1 | r | 0 | 0 | 0 | 1 |
| Bow | ranged | 8 | 0.5 | 16.0 | 420 | 1 | g | 0 | 0 | 0 | — |
| Wand | ranged | 7 | 0.34 | 20.6 | 340 | 2 | bb | 0 | 0 | 0 | — |
| Leather Vest | armor | — | — | — | — | 1 | g | 2 | 20 | 0 | — |
| Chainmail | armor | — | — | — | — | 1 | r | 6 | 45 | 0 | — |
| Runed Robe | armor | — | — | — | — | 3 | bbb | 0 | 12 | 25 | — |
| Delver Harness | armor | — | — | — | — | 2 | gb | 3 | 22 | 70 | — |
| Plate | armor | — | — | — | — | 1 | r | 12 | 80 | 0 | — |
| Greataxe | melee | 30 | 0.85 | 35.3 | 42 | 2 | rr | 0 | 0 | 0 | 2 |
| Crossbow | ranged | 20 | 0.9 | 22.2 | 560 | 2 | gg | 0 | 0 | 0 | — |
| Dagger | melee | 6 | 0.22 | 27.3 | 20 | 2 | gg | 0 | 0 | 0 | 0 |
| Spear | melee | 14 | 0.48 | 29.2 | 44 | 2 | rg | 0 | 0 | 0 | 0 |
| Brigandine | armor | — | — | — | — | 2 | rg | 5 | 34 | 0 | — |
| Staff | ranged | 24 | 0.95 | 25.3 | 380 | 3 | bbg | 0 | 0 | 0 | — |
| Abyssal Shroud | armor | — | — | — | — | 3 | rgb | 7 | 55 | 0 | — |
| Shield | any (shield) | 6 | 0.5 | 12.0 | 26 | 1 | r | 4 | 0 | 0 | 0 |

## Gems by type

### skill (29)

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
| hail | Hail | g | ranged | three arcing shots, they bounce and burst |
| rend | Rend | r | melee | slow, huge, always interrupts |
| impale | Impale | r | melee | long thrust, narrow, staggers |
| dragline | Dragline | g | melee | long reach, hauls them to you |
| whipsaw | Whipsaw | r | ranged | heavy blade, comes back |
| cairn | Cairn | g | ranged | kills raise a turret from the corpse |
| mine | Shard Mine | r | ranged | plant it, walk away |
| stormlash | Stormlash | b | ranged | fast bolt, shocks and chains |
| bloodlet | Bloodlet | r | melee | costs blood, bleeds hard, feeds you |
| deadweight | Deadweight | r | melee | hits harder the faster you fall |
| longshot | Longshot | g | ranged | flies far, hurts far |
| flurry | Flurry | g | melee | many small cuts, very fast |
| arcblade | Arcblade | b | melee | hits shock, and jump once |

### sup (39)

| id | name | color | for | effect |
|---|---|---|---|---|
| multishot | Multishot | g | ranged | 3 projectiles, 30% less damage |
| addedfire | Added Fire | b | any | hits burn, +30% more vs burning |
| fasteratk | Faster Attacks | g | any | 25% faster, 10% less damage |
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
| overload | Overload | r | any | +80% more damage, +60% cooldown, keeps them down |
| precision | Precision | g | any | +18% crit chance, −15% damage |
| twin | Twin Strike | g | melee | strike twice at 60% each |
| deepcut | Deep Cut | b | any | +60% ailment damage, −25% hit damage |
| bracing | Bracing Blow | r | any | hits interrupt an enemy mid-windup |
| punish | Punish | g | any | +65% more damage to a spent enemy |
| kindling | Kindling | b | any | +35% more damage to burning enemies |
| rimebound | Rimebound | b | any | +35% more damage to chilled enemies |
| hunger | Hunger | r | any | +40% more damage below half health |
| splinter | Splinter | g | any | kills scatter shards |
| contagion | Contagion | b | any | ailments spread on kill |
| sterile | Sterile | b | any | +35% more damage, hits carry nothing |
| firstblow | First Blow | g | any | +70% more to an unhurt enemy |
| bloodtithe | Blood Tithe | r | any | +45% more damage, each attack costs blood |
| overdraw | Overdraw | b | any | +50% more damage, attacks cost focus |
| seeker | Seeker | g | ranged | projectiles steer toward prey |
| stormcall | Stormcall | b | any | three kills charge a thunderbolt |
| longhaft | Long Haft | r | melee | half again the reach, narrower swing |
| ricochet | Ricochet | g | ranged | projectiles bounce off the rock |
| vantage | Vantage | g | any | +40% more while airborne |
| rasp | Rasp | r | any | hits file away armor |

### aura (19)

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
| vigil | Vigil | b | armor | +25% damage while untouched for 3s |
| reaper | Reaper's Eye | r | armor | +20% vs enemies below half health |
| tempo | Tempo | g | armor | kills stack attack speed, up to 5 |
| galvanic | Galvanic | b | armor | shocks last longer and arc further |
| surfeit | Surfeit | r | armor | leech past full becomes an overshield |
| foreman | Foreman | g | armor | your constructs work harder and last longer |
| slipstream | Slipstream | g | armor | dodging reloads both weapons |
| plumbline | Plumbline | r | armor | a hard landing is a weapon |

### abil (21)

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
| crucible | Crucible | b | armor | lay a burning field · 13s / 50 focus |
| wardbreak | Sunder Ward | r | armor | strip armor and stagger everything near · 12s / 45 focus |
| tether | Tether | b | armor | link enemies — damage one, damage all · 15s / 55 focus |
| bastion | Bastion | r | armor | stand and be stone — 3s of heavy armor · 12s / 40 focus |
| effigy | Effigy | g | armor | a decoy with thorns — it bites back · 14s / 45 focus |
| lodestone | Lodestone | b | armor | plant it; strike again to snap back · 9s / 15 focus |
| tempest | Tempest | b | armor | a standing storm — everything under it arcs · 15s / 55 focus |
| transfuse | Transfuse | r | armor | rip the bleeds out of the room and drink them · 14s / 45 focus |

## Affixes

| key | label | min | max | scale |
|---|---|---|---|---|
| dmg | % increased damage | 8 | 25 | pct |
| hp | max HP | 8 | 30 | flat |
| cdr | % attack speed | 6 | 18 | pct |
| ms | % move speed | 5 | 15 | pct |
| crit | % crit chance | 3 | 9 | pct |
| critMult | % crit damage | 12 | 35 | pct |
| arm | armor | 2 | 9 | flat |
| sres | % status resist | 8 | 22 | pct |
| greed | % shard drops | 10 | 28 | pct |
| fuel | fuel | 12 | 40 | flat |
| focus | % focus gain | 10 | 30 | pct |
| leech | % life leech | 2 | 5 | pct |
| ailment | % ailment damage | 10 | 30 | pct |
| aildur | % ailment duration | 8 | 20 | pct |
| reach | % melee reach | 6 | 16 | pct |
| area | % blast radius | 10 | 25 | pct |

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
| dagger | **Fever** — hits bleed and feed you · resonates: Lifelode | **Quill** — huge crit, hesitates |
| spear | **Fathom** — twice the reach, half the arc | **Patience** — cruel to the spent · resonates: The Quiet |
| staff | **Stormspine** — every bolt is a storm | **Lodestar** — bolts seek, slowly |
| brig | **Butcher's Apron** — +6% crit, +4% leech, no padding | **Restless** — +12% attack speed, +6% move, thinner plate |
| shroud | **The Quiet** — +1 socket, +40% focus, it keeps some of you · resonates: Patience | **Tithe** — +50% shard yield, it collects too |

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
| vengeful | Vengeful | +30% damage to a spent enemy | mechanic |
| kindled | Kindled | your hits burn | mechanic |
| rimed | Rimed | your hits chill | mechanic |
| sunderer | Sunderer | your hits strip 3 armour | mechanic |
| linked | Linked | your hits chain to one more enemy | mechanic |
| finisher | Finisher | +30% damage below half health | mechanic |
| lastlight | Last Light | below a third health, take 25% less | mechanic |

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
| 3 — III — Swift | 3 bosses | 190% | 135% | Enemies move faster and recover sooner. |
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
| unlock pool (119 entries) | 10355 |
| meta tree (15 nodes) | 810 |
| classes | 460 |
| **total one-time** | **11625** |
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
| Emberheart | your hits burn, and burning hurts more |
| Rimeheart | your hits chill, and chilled hurts more |
| Stormheart | your hits shock |
| Quarry | +35% damage to a spent enemy |
| Volley | +1 projectile |
| Arcing | your hits chain to one more enemy |
| Whetstone | your hits strip 3 armour |
| Harvest | kills heal you for 3% |
| Unbroken | survive one fatal hit |

## The descent arc

| band | air target | character | identity |
|---|---|---|---|
| surface | — | the rim | — |
| caves | 0.42 | tight, winding | grit vents |
| fungal | 0.58 | open caverns and vertical shafts | room templates, spore vents, darkness x0.85 |
| ruins | 0.48 | built geometry | room templates, volt vents |
| forge | 0.28 | narrow and hot | room templates, flame vents, heat 30/s |
| abyss | 0.62 | vast, dark, sparse | room templates, heat 12/s, darkness x1.28 |

## Affix tiers

Tier gates by item level: 1 / 300 / 800 / 1500 / 2400

| affix | T1 | T2 | T3 | T4 | T5 |
|---|---|---|---|---|---|
| % increased damage | 8–25 | 10–33 | 13–43 | 17–56 | 22–73 |
| max HP | 8–30 | 11–40 | 15–54 | 20–72 | 27–96 |
| % attack speed | 6–18 | 7–22 | 9–27 | 11–33 | 14–41 |
| % move speed | 5–15 | 6–18 | 7–22 | 8–26 | 10–31 |
| % crit chance | 3–9 | 4–11 | 5–14 | 6–18 | 8–23 |
| % crit damage | 12–35 | 16–46 | 21–60 | 27–78 | 35–101 |
| armor | 2–9 | 3–12 | 4–16 | 5–21 | 7–28 |
| % status resist | 8–22 | 10–27 | 12–33 | 15–40 | 18–49 |
| % shard drops | 10–28 | 13–36 | 17–47 | 22–61 | 29–79 |
| fuel | 12–40 | 16–52 | 21–68 | 27–88 | 35–114 |
| % focus gain | 10–30 | 13–38 | 16–48 | 20–60 | 25–76 |
| % life leech | 2–5 | 3–7 | 4–9 | 5–11 | 6–13 |
| % ailment damage | 10–30 | 13–38 | 17–49 | 22–63 | 28–81 |
| % ailment duration | 8–20 | 10–24 | 12–29 | 15–35 | 18–43 |
| % melee reach | 6–16 | 7–20 | 9–24 | 11–29 | 13–35 |
| % blast radius | 10–25 | 12–31 | 15–38 | 19–47 | 24–58 |

## Modifier affixes

| affix | slot | min item level |
|---|---|---|
| +1 projectile | ranged | 600 |
| +2 pierce | ranged | 400 |
| projectiles fork on first hit | ranged | 1100 |
| strikes twice at 60% | melee | 900 |
| +40% attack arc | melee | 400 |
| hits chain to 1 more enemy | any | 800 |
| +30% blast radius | any | 600 |
| executes below 6% health | any | 1200 |
| hits bleed | any | 200 |
| hits burn | any | 200 |
| hits shock | any | 700 |
| damage scales with your speed | any | 1000 |
| hits chill | any | 500 |
| projectiles bounce | ranged | 500 |
| swings lunge you forward | melee | 800 |
| +30% vs bleeding | any | 900 |
| hits stagger the spent | any | 900 |

## Echoes (the ladder past Threat V)

| # | name | rule |
|---|---|---|
| 1 | Hungry | The Weight arrives sooner. |
| 2 | Thick | Everything down here is tougher. |
| 3 | Crowded | There is more of it. |
| 4 | Keen | Everything hits harder. |
| 5 | Warded | Everything carries armour. |
| 6 | Brittle | You are made of less. |
| 7 | Swift | The dark moves faster. |
| 8 | Hollow | What dies here leaves a wound behind. |
| 9 | Silent | No ground markers. Read the creature. |
| 10 | Rich | And it is worth far more. |

## Bounties

| objective | pays |
|---|---|
| Reach 900m | 90◆ |
| Reach 1,800m | 180◆ |
| Kill 4 elites | 120◆ |
| Fell a warden | 200◆ |
| Open 6 sealed places | 100◆ |
| Kill 25 while they burn | 110◆ |
| Land 20 hits on spent foes | 130◆ |
| Reach 600m without a hit | 220◆ |
| Kill 60 of anything | 90◆ |
| Rewrite a strand | 150◆ |
| Find 3 rare items | 120◆ |
| Reach 1,200m without a shrine | 170◆ |

## Counts

| | |
|---|---|
| gems | 108 |
| gear bases | 17 |
| uniques | 34 |
| enemies | 40 |
| affixes | 16 |
| unlocks | 119 |
| tree nodes | 15 |
| boons | 21 |
| attunements | 29 |
| threat tiers | 6 |
| lore fragments | 19 |
| modifier affixes | 17 |
| elite modifiers | 11 |
| room templates | 15 |
| echo rules | 10 (unbounded ladder) |
| bounties | 12 |
