# SPEC — THE FULL NARRATIVE: history, fragments, the camp, the endings

Designed against: creative-brief.md, CURRENT-STATE.md @3c446e9, ref-story.md (the contract),
ref-research.md, and the four sibling specs (spec-final-boss, spec-classes-skills,
spec-enemies, spec-gear-forge). All text obeys loreHTML's contract: no backticks, no dollar-brace,
no angle brackets or ampersands in lore strings; single newlines are source wrapping; blank
lines are paragraph breaks; no exclamation marks anywhere in the corpus.

## ID MANIFEST (collision-checked against GEMS 77+31, GEAR 12+5, UNLOCKS 83+36, ENEMIES 26+14,
## ELITES 8+3, ATTUNE 29, BOONS 21, TREE 15, BOUNTIES 12, SIGILS 5, CLASSES 4+2, and every id
## minted by the four sibling specs)

- LORE.frag buried: `g1 g2 g3 g4 g5 g6 g7 g8 g9 g10 g11 g12 g13 g14 g15 g16 g17 g18`
- LORE.frag event (depth −1): `knot1 knot2 knot3 knot4 knot5 rites annealed`
- CAST character ids: `anvil carto verse`
- DIALOG node ids: `anvil1..anvil14 carto1..carto14 verse1..verse13`
- New consts/fns: `CAST DIALOG CAMP_LINES campLine() openTalk(who) talkNew(who)`
- New META fields (SAVE_VER 2→3, merged with the sibling specs' bump): `dlg:{}` `firsts:{}`
- New ENEMIES field: `frag` (boss rows only — grants a depth<0 fragment on first kill)
- New hint ids: `dig camp socket shrine vaultdig movetier`
  (adopted, not minted: `fight dodge punish` from spec-combat-feel, `wayout` from spec-final-boss)
- Adopted, not minted (ratified verbatim below): `f14 mended usurped weft witness`
  and `META.endings` from spec-final-boss; `LORE.class.conductor/.bloodletter` from
  spec-classes-skills; `META.forge` from spec-gear-forge.

**SAVE_VER coordination (one block, three specs):** spec-final-boss adds `endings`,
spec-gear-forge adds `forge`, this spec adds `dlg` and `firsts`. They must land as ONE v3
migrate block:

```js
 if(m.ver<3){m.endings=m.endings||{};m.forge=m.forge||{n:0,owk:0};m.dlg=m.dlg||{};
  m.firsts=m.firsts||{};m.ver=3}
```

plus belt-and-braces in `loadMeta()`: `if(!META.dlg)META.dlg={}; if(!META.firsts)META.firsts={};`

---

## 1. THE HISTORY, FINALLY TOLD (writers-room truth — never shown to the player)

**The sky was cloth.** The vault of heaven was the upper face of the Lattice: six strands,
woven, and the whole weave hung taut from one anchor — the master glyph, six symbols, set at
the world's floor. Heaven was anchored below. That is why the glyph is at the bottom of the
shaft and why "down" has always felt like the direction that matters.

**Who wove it:** the builders under the ruins — the people of the maker's stamp (f5), older
than the fall. They did not merely weave it; they staffed it. Three orders kept the loom: the
**sentinels**, who guarded the working and counted the rooms (their doors face inward because
their halls were built AROUND the working, not against the deep — g8); the **choir** — the
chanters — grown, not born, to sing thinning threads back to the figure (g9); and the **Weft**,
the shuttle itself, the one instrument that runs the whole loom (spec-final-boss). The builders
are gone. Nobody knows where. Their works never stopped clocking in.

**What broke the sky:** nothing broke it. Something *entered* it (f12). Nine hundred years ago
the seed arrived from outside, passed through the weave, and went in. Its entry cut the master
knot's tension; the sky, being fabric, unraveled and fell — the shardfall. The world closed
over the seed "the way water closes over a stone." The seed is not deep, it is LONG (f12b): it
lies along the strands, and every repair the orphaned loom performs weaves the world tighter
around it, which is to say INTO it. The shards are fallen sky, and fallen sky is now the
thing's flesh — that is why they are warm, why they hold charge, why they are "still connected"
(f13). Nine hundred years of mining wired the surface world to the seed. The delvers are its
bloom. "We were the part that got planted."

**What the five Knots were:** places where the falling weave snagged on something that refused
to die, and knotted instead of tearing. Each Knot holds tension the master glyph lost. The
**warden** is a keeper-construct that closed itself around the door the caves became. The
**sporemother** is a colony that grew over a snarl like a tree around wire — the scar, not the
wound. The **sentinel** is the last guard-rotation, knotted into its own patrol of rooms that
no longer exist. The **forgelord** is recent — a guild delver who dug into a hot working strand
and had the weave close over him mid-swing; the heat kept him, the work kept him moving, and
the smith at the rim set the rivets on his name plate. The **voidmaw** is not a survivor at
all: it is a pressure sore, a mouth the dark opens where it is pressed hardest against the
seed's skin. Cutting all five slackens the weave enough that the sky could, in principle, be
re-hung — which is exactly the MEND gate.

**Why the camp remains:** three honest reasons and a true one. The shards fund the world —
every lamp, every road east runs on them; the guild is a company town. The Weight never climbs
past the rim — the Weft does not mend what is outside the wound, so the lip of the shaft is
the one place its attention never falls. And delving pays. The true reason: the seed wants
the camp there. Carrying pieces up is how it spreads. It has been very patient.

**What the final boss is:** the Weft — the shuttle, still running the loom, the source of the
Weight, the thing that heals the walls behind you and re-forms rerolled strands. Killing it is
the only way to hold the pen at the bare glyph (spec-final-boss, adopted whole). The optional
**Witness** is the loom's auditor — the reader that arrives in worlds rewritten often enough to
need checking. The **endings**: ESCAPE rewrites the glyph and leaves the seed growing — you
escape "exactly as far as the inside of a thing that is still growing." MEND re-hangs the sky
from the glyph — possible only with all five Knots cut and the weave slack. USURP signs your
name over the seed's signature — the rock agrees, the Weight reports to you, and the world
re-forms harder each time, which is the Echo ladder wearing its true face. Every fragment,
blurb and dialogue line below is consistent with this page; none of it states this page.

---

## 2. TWENTY-FIVE NEW LORE FRAGMENTS

18 buried + 7 event-granted. With the shipped 16 and spec-final-boss's 3, the codex lands at
**44** (target 40+). Every buried entry's position keeps suite-8's non-decreasing-depth law.
Full merged order (new entries bold):

f1 0 · **g1 60** · f2 120 · **g2 200** · f3 300 · **g3 340** · **g4 430** · f4 520 ·
**g5 600** · **g6 700** · f5 760 · **g7 840** · **g8 950** · f6 1000 · **g9 1100** ·
**g10 1200** · f7 1300 · **g11 1400** · **g12 1500** · f8 1650 · **g13 1750** · f9 1900 ·
**g14 2000** · **g15 2100** · f10 2200 · **g16 2300** · f11 2500 · **g17 2600** · f12 2800 ·
f11b 2900 · **g18 2950** · f12b 3000 · f13 3050 · f14 3100 (spec-final-boss) · then the
depth −1 block: escape, mended, usurped (spec-final-boss), **knot1 knot2 knot3 knot4 knot5
rites annealed**.

### 2.1 Buried — paste-ready, each at the stated array position

```js
  {id:'g1',depth:60,  n:'Price board at the rim, chalked',d:`Guild rates, posted daily. Rope:
two shards the fathom. Lamp-oil: one. Maps: free.

(Beneath, chalked and rubbed out and chalked again: maps are free because they are wrong.)`},
  {id:'g2',depth:200, n:'Forge receipt, unsigned',d:`One axe, reworked. The metal took the new
edge without argument, which the smith says is rare, and did not charge for, which is rarer.

(A second line, added later, in the smith's hand: it took the edge because it wanted one.)`},
  {id:'g3',depth:340, n:'Guild circular, singed',d:`Wire-runners are reminded that shard-charge
follows attention. Do not think about the wire while holding the wire.

Three of last month's four incidents were men who had just been told this.`},
  {id:'g4',depth:430, n:'Page from an old rank-book',d:`Bloodletter: retired rank. Duties:
opening what the deep closes, closing what the deep opens.

The rank was retired when the guild acquired physicians. It was revived when the physicians
declined to go down.`},
  {id:'g5',depth:600, n:"Delver's report, filed under noise",d:`There is singing under the
Bloom. Not words. More like counting.

The guild's position is that fungus does not sing. The guild's position on most things is
fine from the rim.`},
  {id:'g6',depth:700, n:'Lift-rig licence, torn corner',d:`Rig privileges are earned by deed
and revoked by widow. Depth attested, knots attested, no exceptions and no purchase.

The guild has sold many things. It has never sold air.`},
  {id:'g7',depth:840, n:'Rubbing of a door-lintel',d:`The stamp again, and under it a line of
the old marks. The scholar we paid rendered it three ways and would only stand behind one of
them.

KEEP IT WEAVING.`},
  {id:'g8',depth:950, n:'Survey annotation, initialled twice',d:`Every door faces inward. We
wrote that in the first report and meant it as description.

We repeat it in this one as a finding. The builders were not keeping the deep out of their
halls. They built their halls around something, and the doors were for staying with it.`},
  {id:'g9',depth:1100,n:'Old marks, translated on commission',d:`The choir does not fight. The
choir mends. Where the weave thins, a mender is sent, and it sings the thread back to the
figure.

The scholar notes the tense. Not sang. Sings.`},
  {id:'g10',depth:1200,n:'Margin of a returned map',d:`Third descent on this sheet. The long
gallery is forty paces shorter and the stair I inked is not there, and I have stopped assuming
I am the one who is wrong.

Somebody is redrawing faster than I am.`},
  {id:'g11',depth:1400,n:'Survey abstract, unpublished',d:`Five sites where the readings
snarl. Not peaks — knots. The instrument does not spike at them, it catches, the way thread
catches.

The guild declined to fund site six. The abstract does not say there is a site six. The
refusal of funding does.`},
  {id:'g12',depth:1500,n:'Watch report, the rim, night',d:`One of the menders came up. It
stood at the rope-head until morning and did not sing and did not mend anything.

It is still here. Nobody remembers deciding to let it stay, which is the part I was asked not
to write down.`},
  {id:'g13',depth:1750,n:'Letter, kept folded small',d:`You asked after the plate. I stamped
it myself, the year he made journeyman, before he took the deep contract.

If you get as far as the hot country and a thing there wears it, do not read me the name. I
stamped it. I know the name.`},
  {id:'g14',depth:2000,n:'Note pinned to the heat survey',d:`Seven hundred degrees, steady, no
source. Add this to the file: a loom-shed is warm in winter. Not from a fire.

From the work.`},
  {id:'g15',depth:2100,n:'Guild memo, restricted',d:`The pressure delvers report is not
pressure. Instruments read nothing. Men read attention.

Recommended phrasing for the notice board: keep moving. Rejected phrasing: it checks whatever
stands still long enough to be a fact.`},
  {id:'g16',depth:2300,n:'Field note, edge of the compacted dark',d:`The dark here is not the
absence of the lamp. It is a material, and it is load-bearing.

We are not under the world anymore. We are inside the wall of something.`},
  {id:'g17',depth:2600,n:'Testimony, taken at the rim',d:`Left to right across the gallery,
once, level, unhurried. Where it passed, the breach we had cut that morning was not there
anymore.

It did not look at me. I have never been anywhere it needed to fix.`},
  {id:'g18',depth:2950,n:'Old marks, the deepest set found',d:`The last line of the choir's
figure, rendered as well as anyone can render it: WHEN THE SONG STOPS, HOLD THE NOTE.

They are still holding it. That is what the singing is. Nine hundred years of one note.`},
```

### 2.2 Event fragments — depth −1, granted by `discover()`

**Mechanism (one table field, rule-4 clean):** boss rows gain `frag:'knotN'`. In `killEnemy`'s
boss branch (beside the `META.bosses` bookkeeping, ~2803):

```js
 if(D.frag&&discover('frag',D.frag,true))UNLOCK_MSG.push('The knot comes loose. A fragment is written.');
```

Quiet grant — no modal mid-boss-kill (death outranks everything; the death/escape screen line
via `UNLOCK_MSG` is the sanctioned channel). Rows to edit: `warden` gains `frag:'knot1'`,
`sporemother` `frag:'knot2'`, `sentinel` `frag:'knot3'`, `forgelord` `frag:'knot4'`,
`voidmaw` `frag:'knot5'`. The `weft`/`witness` rows get none (their story lives in the endings
and bestiary).

`rites` is granted in `die()`, immediately after the runs/bestDepth bookkeeping:
`discover('frag','rites',true);` — quiet; first death only (discover self-gates).
`annealed` is granted in spec-gear-forge's `doForgeOp` when `op==='frisk'`:
`discover('frag','annealed',true);` (coordination: one added line in their function).

Paste block (append after `usurped` in the depth −1 region; array order among depth −1
entries is free — suite-8 only orders buried ones):

```js
  {id:'knot1',depth:-1,n:'What the warden held',d:`It stood in one room for nine hundred years
because the room is a knot, and the knot needed holding, and everything else that could hold
it was busy falling.

You have cut it loose. The caves feel wider. That is not a feeling.`},
  {id:'knot2',depth:-1,n:'What the mother grew around',d:`The colony did not choose the noise.
Something snarled under the Bloom the day the sky came down, and the Bloom grew around the
snarl the way a tree grows around wire.

She was never the knot. She was the scar over it. The singing is quieter now, and further
down.`},
  {id:'knot3',depth:-1,n:'What the rotation guarded',d:`ROTATION 4,113. BREACH.

(That is the whole entry. Eleven pages of holding, and then you. Somewhere a corridor that no
longer exists has finally been entered, and the thing that walked it is finally off its
round.)`},
  {id:'knot4',depth:-1,n:'What the plate was riveted to',d:`The name is yours now, to read or
not.

He dug too close to a working strand and the weave closed over him the way water closes, and
the heat kept him, and the work kept him moving. The smith at the rim stopped asking years
ago. You get to decide whether that was mercy.`},
  {id:'knot5',depth:-1,n:'What the maw was a symptom of',d:`Not a guardian. A pressure sore.

The dark presses against the thing itself, and where it presses hardest, the dark opens a
mouth. You have closed the mouth. The pressure is still there. You have felt it choosing a
new place to open.`},
  {id:'rites',depth:-1,n:'What the camp does with the dead',d:`There is no graveyard at the
rim. There is a board, and a knife, and the name goes into the wood, and the rope-fee is
struck through.

Nobody says lost. The word is kept. The deep keeps them the way a ledger keeps a figure, and
the camp goes on being owed.`},
  {id:'annealed',depth:-1,n:'What the smith stopped saying',d:`Careful is a covenant between
the metal and the hand. He sets it aside the way you set aside a rule you have kept long
enough to know its price, and the metal notices. Everything down here notices.

The work that comes back is better or worse and never neither. He says the deep does the same
thing with delvers.`},
```

---

## 3. THE CAMP CHARACTERS + THE DIALOGUE SYSTEM

Three characters, each the face of a live system. Names are roles, not proper nouns — the
corpus never names a person and the camp should not start.

- **THE SMITH** (`anvil`) — face of the Forge (spec-gear-forge). She stamped the forgelord's
  name plate; what she wants from the deep is the name back, and to know whether metal — or
  anything — can be forgiven for what the deep makes of it. Warm hands, short sentences.
- **THE CARTOGRAPHER** (`carto`) — face of bounties and the map. Wants one sheet that stays
  true, which the Lattice makes impossible; their arc bends toward the Sigil of Binding, the
  one piece of the deep they endorse. Voice: guild bureaucracy under strain — precise, wounded
  pride, dry as f1.
- **THE CHANTER** (`verse`) — face of the Lattice itself (sigils, dissonance, echoes,
  endings). One of the choir — a mender that came up and stopped singing (g12 is its arrival
  report; the bestiary chanter is what its kin still are). Not quite person-shaped in speech.
  What it wants from the deep is to hear how the song ends. It appears at camp only after
  your first death — the camp does not remember it arriving, and neither do you.

### 3.1 The system — a THIN table on existing panel machinery

No new UI paradigm. Two tables, three small functions, one META dict:

```js
// ============ THE CAMP: WHO IS AT THE RIM ============
// Dialogue is a table. A node is one short exchange; gates read META and nothing else.
// Seen-state lives in META.dlg (one save-scoped dict). Text renders through loreHTML.
const CAST=[
 {id:'anvil',n:'THE SMITH',       sub:'the forge',            show:m=>true},
 {id:'carto',n:'THE CARTOGRAPHER',sub:'bounties and the map', show:m=>true},
 {id:'verse',n:'THE CHANTER',     sub:'it does not sing',     show:m=>(m.runs|0)>=1},
];
const DIALOG=[ /* nodes, §3.2 — array order is speaking order per character */ ];
function talkNew(who){let n=0;for(const d of DIALOG)if(d.who===who&&d.gate(META)&&!META.dlg[d.id])n++;return n}
function openTalk(who){const c=CAST.find(c=>c.id===who);
 const un=DIALOG.filter(d=>d.who===who&&d.gate(META));
 let d=un.find(d=>!META.dlg[d.id])||un[un.length-1];if(!d)return;
 if(!META.dlg[d.id]){META.dlg[d.id]=1;saveMeta()}
 let h='<h2>'+c.n+'</h2><div class="lore">'+loreHTML(d.t)+'</div>';
 if(un.some(x=>!META.dlg[x.id]))h+='<button onclick="openTalk(\''+who+'\')">. . .</button>';
 h+='<button onclick="openCamp()">BACK</button>';
 openPanel(h,false,()=>openTalk(who))}
```

- **Camp rows** — in `openCamp()`, after the CODEX row, one button per `CAST` entry where
  `show(META)`: label `c.n + (talkNew(c.id)?' — '+talkNew(c.id)+' new':'')`, sub `c.sub`,
  onclick `openTalk(id)`. All plain buttons — dpad law holds.
- **Serving order**: earliest unseen unlocked node in array order (sequences play in order);
  when none remain, the latest unlocked node is the resting line — talk is talk, not a codex;
  there is no re-read archive and no new seen-bucket, so the codex checklist is untouched.
- **Non-modal** throughout; `closePanel` never leaves the game paused; the builder is passed
  as `fn` so device switches redraw prompts.
- **Gates are defensive** — every gate uses `(m.x||{})` / `|0` so a fresh or migrated META
  never throws (the suite asserts this on both a virgin and a maxed META).
- **`META.firsts.uniq`** — one write site: the rarity-3 branch of the gear-pickup discovery
  site (~3336): `if(it.rarity===3&&!META.firsts.uniq){META.firsts.uniq=1;saveMeta()}`.
  (`seen.item` cannot serve — primary uniques record a plain base key there.)

### 3.2 The DIALOG table — all 41 nodes, paste-ready

The five-Knot check appears in several gates; hoist it:
`const KNOTS=['warden','sporemother','sentinel','forgelord','voidmaw'];`
`const allKnots=m=>KNOTS.every(b=>(m.bosses||{})[b]);`

```js
const DIALOG=[
 // ---- THE SMITH — the forge, the plate, the name ----
 {id:'anvil1',who:'anvil',gate:m=>true,t:`You are the new rope, then. Bring me metal that has
been down and I will tell you what it learned. Cold iron for now — the forge is not lit for
strangers.`},
 {id:'anvil2',who:'anvil',gate:m=>(m.runs|0)>=1,t:`Back. Good. The board takes names faster
than I can stamp them, and I am tired of striking through rope-fees.

Keep being back.`},
 {id:'anvil3',who:'anvil',gate:m=>Object.keys(m.bosses||{}).length>=1,t:`So one of the deep
things is dead. The draught from the shaft changed direction — even up here. The forge is lit.

Bring me your gear. Careful work, fair rates.`},
 {id:'anvil4',who:'anvil',gate:m=>((m.forge||{}).n|0)>=1,t:`See how it takes the work? Metal
that has been down wants to be more than it was.

That should worry you more than it does.`},
 {id:'anvil5',who:'anvil',gate:m=>!!(m.firsts||{}).uniq,t:`Where did you — no. Do not tell me.

That is finished work, that piece. Nobody living finishes work like that. I will not put a
chisel to it, and neither will anyone honest.`},
 {id:'anvil6',who:'anvil',gate:m=>!!(m.bosses||{}).warden,t:`The caves one first, was it. It
held a door for nine hundred years. When a door has been held that long, opening it is not a
victory. It is a decision.

I hope it was yours to make.`},
 {id:'anvil7',who:'anvil',gate:m=>!!(m.bosses||{}).forgelord,t:`The hot country. You felled
the thing in the hot country.

Was there a plate on it. Do not read it to me. Just tell me whether the rivets held. I set
those rivets.`},
 {id:'anvil8',who:'anvil',gate:m=>((m.forge||{}).owk|0)>=1,t:`You let me stop being careful.
Remember that it was you who asked.

The metal remembers. It is the only thing down here with a clean ledger.`},
 {id:'anvil9',who:'anvil',gate:m=>Object.keys(m.bosses||{}).length>=3,t:`Three knots cut. The
rope-men say the shaft hangs straighter now.

My hammer says the opposite. Everything I work wants to be a blade lately. Something below is
choosing sides.`},
 {id:'anvil10',who:'anvil',gate:m=>allKnots(m),t:`All five. Then there is nothing holding the
weave taut but the thing at the bottom, and its patience.

Whatever you write down there — write it like you mean to be read for nine hundred years.`},
 {id:'anvil11',who:'anvil',gate:m=>!!(m.endings||{}).escape,t:`The shaft is the wrong depth.
Forty fathoms of rope say so, and rope does not lie.

You did something at the bottom and did not finish it. I know unfinished work when I am
standing inside it.`},
 {id:'anvil12',who:'anvil',gate:m=>!!(m.endings||{}).mend,t:`There is a colour up there. My
grandmother had a word for it, and her grandmother had the thing itself.

I left the forge cold this morning. It lit anyway. The metal is glad. I did not know it could
be.`},
 {id:'anvil13',who:'anvil',gate:m=>!!(m.endings||{}).usurp,t:`Rates are on the board. I will
work your metal the same as anyone's.

I would rather you did not watch, is all. The hammer keeps agreeing with you before I swing
it.`},
 {id:'anvil14',who:'anvil',gate:m=>!!(m.bosses||{}).weft,t:`Something at the bottom put down
its work. I know because mine got heavier.

Whatever kept the world mended has stopped, and the mending has to live somewhere. It moved
into every anvil on the rim. Fine. I have the arms.`},
 // ---- THE CARTOGRAPHER — bounties, the map, the axis called you ----
 {id:'carto1',who:'carto',gate:m=>true,t:`Bounties are posted, rates are fair, and the map is
free. The map is free because it is provisional.

Everything down there is provisional except the direction. Down holds.`},
 {id:'carto2',who:'carto',gate:m=>(m.runs|0)>=1,t:`Your route died with you. The ink did not.
Every descent improves the sheet, whatever else it does.

That is the kindest sentence in guild cartography, and I have just spent it on you.`},
 {id:'carto3',who:'carto',gate:m=>(m.bestDepth|0)>=340,t:`Past the picked-clean and into the
Bloom. Note the chambers — it fills them evenly.

Something down there is measuring the room. My professional objection is that measuring is my
job.`},
 {id:'carto4',who:'carto',gate:m=>(m.bestDepth|0)>=840,t:`Brickwork. You have seen it now.
Older than the fall, which is not possible, which is confirmed.

I keep two maps of the ruins: what is there, and what was built. They disagree about the
number of rooms.`},
 {id:'carto5',who:'carto',gate:m=>Object.keys((m.seen||{}).sigil||{}).length>0,t:`So you have
held one. A piece of the thing that decides what is under the rock.

You are carrying the reason my maps are wrong, and I would be grateful if you would stop
breaking them.`},
 {id:'carto6',who:'carto',gate:m=>!!((m.seen||{}).sigil||{}).lock,t:`Binding. Now that one I
endorse. Bind a strand and my ink stops lying about it.

If you are taking requests: the terrain. It is always the terrain.`},
 {id:'carto7',who:'carto',gate:m=>!!(m.bosses||{}).sporemother,t:`The Bloom holds still since
you cut the mother out of it. My sheet of the fungal country has now been accurate for nine
days.

Nine. I framed it.`},
 {id:'carto8',who:'carto',gate:m=>!!(m.bosses||{}).sentinel,t:`The rotation has stopped. All
those years of a thing walking a corridor that is not there, and now my ruins sheet has one
less moving part.

I have recorded the service. The guild will misfile it.`},
 {id:'carto9',who:'carto',gate:m=>(m.maxEcho|0)>=1,t:`The depth is wrong. Do not argue — I
have measured the shaft against itself, and it is out by some hundreds of metres in a
direction I have no axis for.

I have started a new sheet. I have labelled the axis you.`},
 {id:'carto10',who:'carto',gate:m=>(m.echoLv|0)>=6,t:`You descend into worlds you have
deliberately made worse, and then you ask me for maps of them.

I make the maps. I want it noted somewhere that is not my own ledger: I make them under
protest.`},
 {id:'carto11',who:'carto',gate:m=>!!(m.bosses||{}).voidmaw,t:`You felled the thing at the
bottom of my blankest sheet. I chart the abyss as an inset, at reduced scale, because at full
scale the paper takes the dark badly.

There is no guild language for the paper flinching. I have looked.`},
 {id:'carto12',who:'carto',gate:m=>!!(m.endings||{}).mend,t:`There is sky on my charts again.
Do you understand what that does to a projection. Every map since the fall assumes a ceiling
of nothing.

Now I must draw a lid on the world. I have never been happier to redraft.`},
 {id:'carto13',who:'carto',gate:m=>!!(m.endings||{}).usurp,t:`I redrew the master sheet last
night. My hand did it well. Better than I draw.

I am filing that observation as a survey finding and not thinking about it further, and I
advise you to extend me the same courtesy.`},
 {id:'carto14',who:'carto',gate:m=>!!(m.bosses||{}).witness,t:`There was a sixth site. Never
funded, never filed, never drawn.

You felled something at a place that is on no sheet of mine. Either my maps are incomplete or
the world produced a place out of process. Both keep me up.`},
 // ---- THE CHANTER — the one that stopped singing ----
 {id:'verse1',who:'verse',gate:m=>true,t:`You went down and came up. That is a rhythm. I kept
a rhythm once.

(It does not say more. The camp does not remember it arriving.)`},
 {id:'verse2',who:'verse',gate:m=>Object.keys((m.seen||{}).sigil||{}).length>0,t:`You hold a
torn note. When you break it, somewhere a measure is sung again, differently.

We were not allowed. You are not not allowed. That is the entire difference between us.`},
 {id:'verse3',who:'verse',gate:m=>Object.keys((m.seen||{}).diss||{}).length>=2,t:`The world is
off its pitch where you have been. I can hear it from here.

Do not apologise. Some of us waited nine hundred years for anyone to sing a wrong note on
purpose.`},
 {id:'verse4',who:'verse',gate:m=>!!(m.bosses||{}).warden,t:`The door in the caves is open.
I came up through it, before, when it was still a thing that could be persuaded.

It could not be persuaded. I came up anyway. It let me. Think about that.`},
 {id:'verse5',who:'verse',gate:m=>!!(m.bosses||{}).sentinel,t:`The walker is off its round. I
sang beside it once. It was not guarding the rooms.

It was guarding the number of rooms. Ask your mapmaker whether the number has changed. Do not
tell them why.`},
 {id:'verse6',who:'verse',gate:m=>allKnots(m),t:`Five knots, cut. The weave hangs slack from
the one glyph now.

Slack cloth can be smoothed, or pulled to a new shape, or worn. You are going to choose one,
and I am going to listen very hard.`},
 {id:'verse7',who:'verse',gate:m=>(m.escapes|0)>=1,t:`You wrote a way out and you are still
inside. Yes. That is what writing does. Every singer learns it — the song does not leave the
throat.

Descend again. I will be here, not singing.`},
 {id:'verse8',who:'verse',gate:m=>!!(m.endings||{}).mend,t:`(For the first time, it is
singing. Very quietly. One note, and then a second note.)

The held note has resolved. Eight hundred years of my choir holding, and it took a digger
with borrowed glyphs. I do not mind. Resolution never comes from inside the chord.`},
 {id:'verse9',who:'verse',gate:m=>!!(m.endings||{}).usurp,t:`I can hear your name now. It is
in everything — the rock, the rope, the rain that is not falling.

A signature is a note held forever. I held one. Ask me sometime what it costs.`},
 {id:'verse10',who:'verse',gate:m=>!!(m.bosses||{}).weft,t:`The shuttle is still. I felt it
stop the way you feel a heartbeat stop. Mine, I mean.

It was my whole purpose once, and its purpose was the figure. The figure is bare now, and
everything below is listening to you.`},
 {id:'verse11',who:'verse',gate:m=>(m.maxThreat|0)>=5,t:`Buried, they call the fifth watch.
The dark reaching further. It is not reaching.

It is leaning in. Attention is the only thing down there that was never rationed.`},
 {id:'verse12',who:'verse',gate:m=>(m.echoLv|0)>=8,t:`In the worlds you remake, what dies
leaves a wound in the air. You ask if that is new. It is not new.

In this world the wounds were mended before you saw them. You have met the mender.`},
 {id:'verse13',who:'verse',gate:m=>!!(m.bosses||{}).witness,t:`So it still checks. Even now,
even slack. The one that reads.

We sang to the figure. It read against the figure. Of everything below, it is the only thing
I was instructed to avoid, and I am a thing they built to be brave.`},
];
```

Node counts: anvil 14, carto 14, verse 13 — all inside the 10–16 band. Longest node is 55
words; most are under 40.

---

## 4. THE THREE ENDINGS

Gates and flow are spec-final-boss's, adopted exactly: all three require the Weft felled this
run (`MGS===2`); **ESCAPE** always offered; **MEND** requires all five `BIOME_BOSS` values in
`META.bosses`; **USURP** requires `(META.echoLv|0)>=6`. Each ending renders in the modal
epilogue panel opened by `doEnding(kind)` — the escape flow, never the death flow (`die()`
empties `PANEL_Q`; endings can only be reached alive, at the glyph). Panel = title + the
ending's fragment text through `loreHTML` + the shipped stats table + one button
DESCEND AGAIN. Titles: ESCAPE `THE WORLD RE-FORMS` (shipped) · MEND `THE SKY REMEMBERS` ·
USURP `THE ROCK AGREES`. Each sets `META.endings[kind]=1` and grants its fragment
(`escape` / `mended` / `usurped`).

**The epilogue texts are the fragments** — one body of text serving panel and codex, exactly
as the shipped escape already works. This spec ratifies all three verbatim (ESCAPE is the
shipped `escape` fragment, 190 words; `mended`, 135 words, and `usurped`, 140 words, are
spec-final-boss §8.2 — they must land char-identical to that spec; two drifting copies is the
one merge hazard here). Quoted for the record:

- **ESCAPE** — `escape`, shipped, verbatim: "You reached the bottom, which does not exist,
  and found it was not a floor but a surface … Descend again."
- **MEND** — `mended`: "You stood on the outside of the thing, which is the bottom of the
  world, and you did not write a way out. You wrote the sky. …" through "Descend while you
  still can."
- **USURP** — `usurped`: "The glyph was never a lock. It was a signature. … The world
  re-forms harder. You would not have it any other way. Descend again."

**Permanent camp acknowledgment** — the flag is `META.endings[kind]`; the surface change is
one header line in `openCamp()` via `campLine()` (§5), first match wins, adopted from
spec-final-boss §5.7 and absorbed into the table below (their inline ternary becomes rows 1–3
of `CAMP_LINES` — one mechanism, not two). Additionally each ending unlocks a dialogue node
per character (anvil11–13, carto12–13, verse7–9) — the camp does not just change a line, it
has opinions.

---

## 5. ACT BEATS — the surface feels every first Knot

One helper, one table, riding the existing camp header:

```js
// The camp notices. First match wins; endings outrank knots; silence is the default.
const CAMP_LINES=[
 {gate:m=>!!(m.endings||{}).usurp, t:'The camp is quiet around you. Everything here knows who it agrees with now.'},
 {gate:m=>!!(m.endings||{}).mend,  t:'There is a colour in the sky over the camp. Nobody talks about it. Everybody looks.'},
 {gate:m=>!!(m.endings||{}).escape,t:'The shaft is the wrong depth, and the camp pretends not to measure it.'},
 {gate:m=>allKnots(m),                              t:'The camp is quiet in a listening way. Everything hangs from one thread now, and everything here knows it.'},
 {gate:m=>Object.keys(m.bosses||{}).length>=3,      t:'Rope-men say the shaft hangs straighter. Nobody has lowered a lamp to check.'},
 {gate:m=>Object.keys(m.bosses||{}).length>=1,      t:'The draught from the shaft has changed direction. The smith lit the forge without being asked.'},
];
function campLine(){for(const c of CAMP_LINES)if(c.gate(META))return c.t;return ''}
```

`openCamp()` renders `campLine()` as a `.sub` line under the header when non-empty.

Per-Knot, the first fell delivers three cheap, felt things — a fragment, a voice, and (twice)
an offer:

| Knot | fragment (auto, §2.2) | dialogue unlocked | offer / change |
|---|---|---|---|
| any first | — | anvil3 | **THE FORGE row appears** (spec-gear-forge's `bosses>=1` gate — adopted as this act's beat) + camp line |
| warden | knot1 | anvil6, verse4 | — |
| sporemother | knot2 | carto7 | the Bloom "holds still" — pure voice, deliberately |
| sentinel | knot3 | carto8, verse5 | — |
| forgelord | knot4 | anvil7 | **OVERWORK unlocks at the Forge** — gate the `frisk` op row on `META.bosses.forgelord` (coordination: one added `disabled` condition in spec-gear-forge's `openForgeItem`; the Smith stops being careful only after she knows) |
| voidmaw | knot5 | carto11 | — |
| 3 knots | — | anvil9 | camp line changes |
| 5 knots | — | anvil10, verse6 | camp line changes; MEND becomes reachable |

Death-screen echo: the `UNLOCK_MSG` line from the `frag` grant (§2.2) means a run that felled
a first Knot SAYS so at its end, even if you never made it home.

---

## 6. CODEX BLURBS — new classes, final boss, coverage audit

**The two new classes** — `LORE.class.conductor` and `LORE.class.bloodletter` exist in
spec-classes-skills §1 and are ratified verbatim ("They do not carry a lamp. They are one." /
"They count what they lose and charge it to the deep."). No second draft; land theirs.
Fragments g3 (wire-runners) and g4 (the retired rank) are this spec's world-side echoes of
those two classes — the classes were in the world before they were playable.

**The final boss** — `LORE.enemy.weft` is ratified verbatim from spec-final-boss §8.1 ("It has
never once been interrupted at its work. Be the first."), as is `witness` from §9 and fragment
`f14` from §8.2.

**Coverage audit — LORE.enemy lines the enemy spec doesn't cover:** none remain. The 12 new
roster entries ship with bestiary text in spec-enemies §4; `weft`/`witness` ship in
spec-final-boss; all 26 existing entries are live. Suite-8's completeness assert
(`Object.keys(ENEMIES).filter(k=>!LORE.enemy[k])` empty) is the tripwire if any spec lands
rows without its blurbs — nothing for this spec to add, and that is itself the finding.

---

## 7. ONBOARDING TIP COPY (playtest finding #1)

All tips ride the existing `hint(id,text)` funnel — once per save via `META.hints`, toast
delivery, never modal, gated on `SET.hints`. Control references go through `pr()` only; no
copy below names a physical key. The catalogue (this spec owns it; spec-combat-feel's three
combat tips and spec-final-boss's `wayout` are adopted members, quoted here for one-place
reference):

| id | trigger site (exact) | copy (exact) |
|---|---|---|
| `fight` | adopted — spec-combat-feel §3.4 | `Strike ${pr('mel')} · shoot ${pr('rng')} · dodge ${pr('dodge')}` |
| `dodge` | adopted — spec-combat-feel §3.4 | `${pr('dodge')} dodges THROUGH an attack — you are untouchable for a beat` |
| `punish` | adopted — spec-combat-feel §3.4 | `It is SPENT — the amber bar is your window. Strike now for extra damage` |
| `dig` | in `carve()`: a call that removes zero tiles while a tile in radius has hardness above `maxHardness` (and is not bedrock and not a vault seal) | `That stone is past this tool. Dig power opens it — it is printed on every gear card.` |
| `vaultdig` | same site, when the blocking tile is the vault-seal tile | `A vault seal shrugs off blades. It wants dig power — an Axe, a Greataxe, or the Bore gem.` |
| `camp` | first `openCamp()` | `Runs end. This place does not — shards, unlocks, the tree and the Vault are forever.` |
| `socket` | first gem pickup (the `kind==='gem'` pickup site) | `A gem does nothing loose in your pack. Open the bag and press it into a socket of its colour.` |
| `shrine` | first `takeBoon()` | `The boon is yours for the run. Each new stratum you reach offers another — deeper is stronger.` |
| `movetier` | the movement-progression spec's tier-grant site (whichever lands; the id is reserved here) | `THE RIG IMPROVES — something new moves under your hands. CONTROLS names it.` |
| `wayout` | adopted — spec-final-boss §3.3 | `The world is thin. The master glyph waits at the floor of the shaft, straight below the camp.` |

Notes: `dig` fires at the moment of the silent failure (finding #2's spark lands at the same
site — feedback and words together); `socket` deliberately says colour, not slot, because the
colour rule is the one a first-timer cannot infer; `movetier` is device-safe by pointing at
the CONTROLS screen (a menu name, not a binding) — if the movement spec wants per-tier lines,
it mints `movetier2..N` and keeps this copy as tier 1's frame. None of these use a hard-coded
key; only the three adopted combat tips interpolate `pr()` at all, which is correct — the
rest teach systems, not buttons.

---

## 8. TEST-SUITE EDITS (every one this content requires)

1. **`test/suite-17.js` — NEW, "THE CAMP"** (suite-16 is claimed by spec-combat-feel; add
   `17` to `SUITES` in `test/run.sh`). Blocks:
   - **Dialogue integrity**: every `DIALOG` id unique and absent from GEMS/GEAR/UNLOCKS;
     every `who` exists in `CAST`; per-character node count in [10,16]; every `t` contains no
     backtick, no dollar-brace, no angle bracket, no ampersand, no exclamation mark.
   - **Gate safety + reachability**: every `gate` and `CAST.show` returns a boolean without
     throwing on (a) a fresh `META` post-migrate and (b) a maxed fixture (all bosses incl.
     weft+witness, all endings, escapes 3, echoLv 8, maxThreat 5, all sigils seen, 2 diss
     stages, forge {n:5,owk:1}, firsts {uniq:1}, runs 9, bestDepth 3000). Under the maxed
     fixture EVERY node's gate is true — no unreachable dialogue.
   - **Seen tracking**: `openTalk('anvil')` marks exactly one node; repeat opens march
     through array order; `talkNew` counts unlocked-unseen only; `META.dlg` survives
     `saveMeta()`/`loadMeta()`. Reset `META.dlg` after the block (harness trap).
   - **campLine**: first-match order — usurp fixture beats mend beats escape beats knot
     counts; virgin META returns `''`.
   - **Event fragments**: every `ENEMIES[k].frag` value exists in `LORE.frag` with
     `depth<0`; first `killEnemy` of a warden writes `META.seen.frag.knot1` and pushes one
     `UNLOCK_MSG` line, a second warden does neither; first `die()` writes
     `META.seen.frag.rites` (then reset `P.dead`, `DYING`, `META` — traps); the
     forge-overwork grant writes `annealed` (call `doForgeOp` with the frisk op on a fixture
     item).
   - **Hints**: `META.hints={}`; a carve blocked by hard rock sets `META.hints.dig`; blocked
     by a vault seal sets `vaultdig` and NOT `dig`; first `openCamp()` sets `camp`; first gem
     pickup sets `socket`; first `takeBoon()` sets `shrine`; each fires once. Restore
     `META.hints`.
2. **suite-8** — zero source edits: fragment order/uniqueness/depth<0 asserts are dynamic;
   the 18 buried entries land at §2's stated positions and the assert is the proof.
   `LORE.class`/`LORE.enemy` coverage is satisfied by the ratified sibling entries.
3. **suite-9** — no edits beyond spec-final-boss's (endings machinery is theirs; the
   fragment-grant asserts for `escape/mended/usurped` live there).
4. **test/pwa.js** — extend the v1-blob migration assert (merged with the sibling specs'):
   `ver===3`, `META.dlg` is `{}`, `META.firsts` is `{}` (alongside their `endings`/`forge`).
5. **test/browser.js** — one assert: camp panel contains a button whose text starts with
   `THE SMITH`, and after `discover`-style progress (set `META.bosses.warden=1`, rebuild) the
   row shows a `new` count; dpad focus reaches it (buttons-only law).
6. After landing: `./design/audit.sh` (fragment count 44 is published in CURRENT-STATE),
   `./test/run.sh` full, `node test/pwa.js`.

---

## 9. RISKS / COORDINATION

- **SAVE_VER collision by design**: three specs bump 2→3. The merged block in §0 is the
  contract; whoever lands second must extend, not append a v4. pwa.js is the tripwire.
- **Epilogue double-authorship**: `mended`/`usurped` texts exist in spec-final-boss and are
  ratified here verbatim. Land ONE copy. Any wording change happens in both documents or in
  neither.
- **OVERWORK gate** (§5) tightens spec-gear-forge (their spec ships `frisk` ungated). This is
  a deliberate act-beat proposal — one `disabled` condition + the Smith's anvil7/anvil8
  sequencing depends on it. If rejected, the beat degrades gracefully (annealed still grants;
  anvil8 still gates on `owk`).
- **`hint()` id namespace**: the live file may already carry hint ids this audit cannot see
  from the refs (only `META.hints` mechanics are documented). Grep `hint('` before landing
  `dig/camp/socket/shrine/vaultdig/movetier`.
- **`verse` show-gate** hides a character behind first death. A player who never dies never
  meets the Chanter — accepted: death is the beat that summons it, and `runs` also increments
  on ABANDON, so the gate is really "first run that ended".
- **Dialogue tone drift**: verse1 and verse8 use the corpus's parenthetical second-hand
  device inside spoken dialogue — a deliberate extension (the narrator watches the camp the
  way fragments watch the deep). If it reads wrong in situ, cut the parentheticals; the nodes
  stand without them.
- **`movetier` trigger site does not exist yet** — the movement-progression spec is not in
  the scratchpad. The id and copy are reserved here so the catalogue is complete; that spec
  owns the call site.
- **carve() tip trigger** assumes carve can see "removed zero, wanted more" — if the current
  signature cannot distinguish the vault-seal tile, split the trigger: `dig` in carve,
  `vaultdig` at the vault-interaction site instead. Copy is unchanged either way.
- **41 nodes is the floor of felt density**: every gate fires at most once per save and only
  at camp. If playtesting wants barks mid-run, resist — the corpus's power is that the deep
  never speaks; only the rim does.
