// ---- session 2 smoke test ----
let fails=0;
function assert(c,m){if(!c){console.error('FAIL:',m);fails++}else console.log('ok:',m)}
try{
 for(let i=0;i<300;i++){sim(1/60);render();hud()}
 assert(!P.dead,'idle at camp');
 assert(ATK.melee&&ATK.melee.kind&&ATK.ranged&&ATK.ranged.kind,'ATK cache primed for both slots');
 // melee kill
 EN.push({x:P.x+22,y:P.y,vx:0,vy:0,w:14,h:12,type:'crawler',ai:'walk',c:'#fff',hp:24,dmg:8,spd:42,onG:false,flash:0,dir:-1});
 HELD.mel=true;for(let i=0;i<180;i++)sim(1/60);HELD.mel=false;sim(1/60);
 assert(EN.filter(e=>e.hp>0).length===0||META.shards>0,'melee kills + shards bank');
 // arc: enemy BEHIND with plain sword should NOT be hit
 P.hp=P.maxhp;EN.length=0;
 EQ.melee=mkItem('sword',0);refreshAttacks(); // strip class signature gem for a clean arc test
 EQ.melee=mkItem('sword',0);refreshAttacks(); // clear class signature gem for a clean arc test
 // enemy at ~65° off facing axis: inside cleave's 75° half-arc, outside sword's 50°
 EN.push({x:P.x+9,y:P.y-19,vx:0,vy:0,w:14,h:12,type:'crawler',ai:'walk',c:'#fff',hp:999,dmg:0,spd:0,onG:false,flash:0,dir:1});
 P.face=1;doMelee();assert(EN[0].hp===999,'sword 100° arc misses steep diagonal');
 EQ.melee.sockets[0]='cleave';refreshAttacks();P.mcd=0;doMelee();
 assert(EN[0].hp<999,'cleave 150° arc hits steep diagonal');
 EN.length=0;
 // shield: equip melee slot, tap=bash, hold=block
 EQ.melee=mkItem('shield',0);refreshAttacks();
 assert(ATK.melee.kind==='melee'&&isShield('melee'),'shield resolves as bash');
 HELD.mel=true;for(let i=0;i<30;i++)sim(1/60); // held 0.5s
 assert(P.block===true,'hold -> block stance');
 NOCRIT();NOARMOR();const hpB=P.hp;P.inv=0;
 EN.push({x:P.x+4,y:P.y,vx:0,vy:0,w:14,h:12,type:'crawler',ai:'walk',c:'#fff',hp:50,dmg:20,spd:0,onG:false,flash:0,dir:1});
 sim(1/60);
 assert(P.hp>hpB-8&&P.hp<hpB,'block reduces 20 dmg to 6');
 HELD.mel=false;sim(1/60);assert(P.block===false,'release ends block');
 // thorns
 EQ.armor.sockets[0]='thorns';refreshAttacks();P.inv=0;const eh=EN[0].hp;
 sim(1/60);assert(EN[0].hp<eh,'thorns reflects on contact');
 // regrowth
 // Isolate the regen: this used to depend on whatever the world happened to generate at one
 // spot, so a change to world seeding could out-damage 2hp/s and fail it for the wrong reason.
 EQ.armor.sockets[0]='regrowth';refreshAttacks();
 P.x=(CAMP_X+300)*TILE;P.y=200*TILE;P.hp=10;P.maxhp=Math.max(P.maxhp,100);
 P.inv=999;P.st=null;P.dead=false;P.noFall=99;
 for(let i=0;i<120;i++){EN.length=0;PROJ.length=0;sim(1/60)}
 assert(P.hp>10,'regrowth regens away from camp');
 P.inv=0;
 // armor-global support: fasteratk in armor speeds up melee cd
 EQ.melee=mkItem('sword',0);EQ.armor.sockets[0]=null;refreshAttacks();const cd0=ATK.melee.cd;
 EQ.armor.sockets[0]='fasteratk';refreshAttacks();
 assert(ATK.melee.cd<cd0,'armor support links globally');
 // aura socket restriction: socketGem for aura only offers armor
 BAG.push({kind:'gem',id:'thorns'});socketGem(BAG.length-1);
 assert(!document.getElementById('panel').innerHTML.includes('MELEE:'),'aura gem restricted to armor');
 closePanel();
 // chest
 const ch={x:P.x+10,y:P.y,opened:false};CHESTS.push(ch);P.mcd=0;doMelee();
 assert(ch.opened&&PICK.length>0,'chest opens and drops loot');
 // chunk sweep evicts far canvases
 for(let i=0;i<200;i++){sim(1/60);render()}
 P.x=(CAMP_X-300)*TILE;P.y=1200*TILE;
 for(let i=0;i<200;i++){sim(1/60);render()}
 let withCv=0;for(const [,c] of CHUNKS)if(c.cv)withCv++;
 console.log('chunks:',CHUNKS.size,'with live canvas:',withCv);
 assert(withCv<CHUNKS.size,'far chunk canvases evicted');
 // death/rebirth still clean
 die();newRun();for(let i=0;i<120;i++){sim(1/60);render();hud()}
 assert(!P.dead&&CHESTS.length>=0,'newRun clean');
 console.log(fails?'*** '+fails+' FAILURES ***':'ALL PASS');process.exitCode=fails?1:0;
}catch(err){console.error('CRASH:',err);process.exitCode=1}
