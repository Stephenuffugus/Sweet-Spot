let fails=0;const A=(c,m)=>{if(!c){console.error('FAIL:',m);fails++}else console.log('ok:',m)};
try{
 for(let i=0;i<180;i++){sim(1/60);render();hud()}
 A(!P.dead,'idle at camp');
 // --- boons ---
 const cd0=ATK.melee.cd;
 const sh={x:P.x,y:P.y,used:false};SHRINES.push(sh);sim(1/60);
 A(sh.used&&paused,'shrine triggers on touch + pauses');
 A(SHRINE_PICK.length===3,'shrine offers 3 distinct boons');
 // force a known boon
 SHRINE_PICK=[BOONS.find(b=>b.id==='haste')];takeBoon(0);
 A(ATK.melee.cd<cd0,'Haste boon applies to attack speed');
 const hpPre=P.maxhp;SHRINE_PICK=[BOONS.find(b=>b.id==='vigor')];takeBoon(0);
 A(P.maxhp>hpPre,'Vigor boon raises maxHP');
 // --- boss ---
 SHRINES.length=0;closePanel();
 // off camp (camp regen masks damage assertions); carve a floor so nobody takes fall damage
 P.x=(CAMP_X+400)*TILE;P.y=700*TILE;ANCHOR=null;P.vx=0;P.vy=0;P.dead=false;paused=false;
 P.maxhp=Math.max(P.maxhp,500);P.hp=P.maxhp;P.noFall=99;P.st=null;
 for(let y=-6;y<=1;y++)for(let x=-14;x<=14;x++)setTile(Math.floor(P.x/TILE)+x,Math.floor(P.y/TILE)+y,0);
 for(let x=-14;x<=14;x++)setTile(Math.floor(P.x/TILE)+x,Math.floor(P.y/TILE)+2,2);
 const E=ENEMIES.sentinel;
 EN.length=0;
 EN.push({x:P.x+120,y:P.y,vx:0,vy:0,w:E.w,h:E.h,type:'sentinel',ai:'walk',c:E.c,
  hp:E.hp,maxhp:E.hp,dmg:E.dmg,spd:E.spd,onG:false,flash:0,dir:-1,boss:true,shoot:E.shoot,scd:0});
 const b=EN[EN.length-1];const php=P.hp;P.inv=0;
 for(let i=0;i<240;i++){sim(1/60);render()}
 A(PROJ.some(p=>!p.friendly)||P.hp<php,'boss shoots hostile projectiles');
 // hostile projectile damages player
 P.inv=0;PROJ.length=0;
 PROJ.push({x:P.x-6,y:P.y,vx:200,vy:0,dmg:25,pierce:0,explode:0,col:'#f00',t:3,friendly:0});
 const h2=P.hp;sim(1/60);sim(1/60);
 A(P.hp<h2,'hostile projectile hurts player');
 // block stops projectile
 EQ.melee=mkItem('shield',0);refreshAttacks();HELD.mel=true;
 for(let i=0;i<20;i++)sim(1/60);
 A(P.block,'blocking');
 P.inv=0;PROJ.length=0;P.face=1;EN.length=0;
 P.x=(CAMP_X+400)*TILE;P.y=300*TILE;EQ.armor.sockets[0]=null; // off camp (camp regen would mask the check)
 PROJ.push({x:P.x+8,y:P.y,vx:-300,vy:0,dmg:30,pierce:0,explode:0,col:'#f00',t:3,friendly:0});
 const h3=P.hp;for(let i=0;i<4;i++)sim(1/60);
 A(P.hp===h3&&PROJ.length===0,'block deflects projectile from faced side');
 HELD.mel=false;sim(1/60);
 // boss loot on death
 PICK.length=0;const picks0=PICK.length;EN.push(b);b.elite=null;killEnemy(b);b.hp=0;
 A(PICK.length>picks0+2,'boss drops guaranteed gems+gear+shards');
 // --- loadout ---
 META.unlocks.wand=1;META.unlocks.shield=1;META.useClassKit=false; // testing the custom-loadout path
 META.loadout={melee:'shield',ranged:'wand',armor:'vest'};
 newRun();
 A(EQ.melee&&EQ.melee.base==='shield'&&EQ.ranged.base==='wand','loadout picker respected on newRun');
 A(RUNB.dmg===0&&RUNB.hp===0,'boons reset each run');
 META.loadout={melee:'sword',ranged:null,armor:'vest'};META.useClassKit=false;newRun();
 A(EQ.ranged===null&&ATK.ranged===null,'empty slot allowed, no crash');
 for(let i=0;i<120;i++){sim(1/60);render();hud()}
 HELD.rng=true;for(let i=0;i<60;i++)sim(1/60);HELD.rng=false; // fire empty slot
 A(!P.dead,'firing empty slot is safe');
 // --- world gen POIs exist at depth ---
 P.x=(CAMP_X+80)*TILE;P.y=1000*TILE;
 const seenBoss=new Set();
 for(let d=200;d<2600;d+=90){P.x=(CAMP_X+((d*7)%400)-200)*TILE;P.y=d*TILE;
  for(let i=0;i<20;i++)sim(1/60);
  for(const e of EN)if(e.boss)seenBoss.add(Math.round(e.x)+':'+e.type)}
 const bosses=seenBoss.size;
 console.log('POI census over',CHUNKS.size,'chunks — chests',CHESTS.length,'shrines',SHRINES.length,'unique bosses',bosses);
 console.log('  density: 1 boss per',(CHUNKS.size/Math.max(1,bosses)).toFixed(1),'chunks | 1 chest per',(CHUNKS.size/Math.max(1,CHESTS.length)).toFixed(1));
 A(CHESTS.length>0,'chests generate');
 A(SHRINES.length>0,'shrines generate');
 A(bosses>0,'minibosses generate at depth');
 // vault walls are hard (uncrackable by plain sword)
 A(TILES[5].hard>0,'vault brick is hard-gated');
 // perf under load
 const t0=process.hrtime.bigint();for(let i=0;i<1800;i++){sim(1/60);render()}
 console.log('1800 frames:',Number(process.hrtime.bigint()-t0)/1e6|0,'ms | EN',EN.length,'PROJ',PROJ.length,'PART',PART.length);
 A(EN.length<=125&&PROJ.length<=230&&PART.length<=360,'entity caps hold');
 console.log(fails?'*** '+fails+' FAILURES ***':'ALL PASS');process.exitCode=fails?1:0;
}catch(err){console.error('CRASH:',err);process.exitCode=1}
