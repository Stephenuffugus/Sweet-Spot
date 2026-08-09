let fails=0;const A=(c,m)=>{if(!c){console.error('FAIL:',m);fails++}else console.log('ok:',m)};
try{
 for(let i=0;i<120;i++){sim(1/60);render();hud()}
 A(!P.dead,'boot clean');
 // ---- new gems resolve ----
 EQ.melee=mkItem('greataxe',0);EQ.melee.sockets[0]='nova';EQ.melee.sockets[1]='heavyimpact';refreshAttacks();
 A(ATK.melee.arc===360,'Nova gives 360 arc');
 A(ATK.melee.kb>300,'Heavy Impact stacks knockback');
 EQ.ranged=mkItem('crossbow',0);EQ.ranged.sockets[0]='lightning';EQ.ranged.sockets[1]='pierce';refreshAttacks();
 A(ATK.ranged.pierce>=4,'Lightning + Pierce stack');
 // nova hits behind
 EN.length=0;EN.push({x:P.x-20,y:P.y,vx:0,vy:0,w:14,h:12,type:'crawler',ai:'walk',c:'#fff',hp:9999,maxhp:9999,dmg:0,spd:0,onG:false,flash:0,dir:1});
 P.face=1;P.mcd=0;doMelee();A(EN[0].hp<9999,'Nova 360 hits directly behind');
 // ---- leech ----
 EQ.melee=mkItem('sword',0);EQ.melee.sockets[0]='lifeleech';refreshAttacks();
 P.x=(CAMP_X+400)*TILE;P.y=300*TILE; // off camp so regen can't mask it
 P.hp=40;EN.length=0;EN.push({x:P.x+14,y:P.y,vx:0,vy:0,w:14,h:12,type:'crawler',ai:'walk',c:'#fff',hp:9999,maxhp:9999,dmg:0,spd:0,onG:false,flash:0,dir:1});
 P.mcd=0;doMelee();A(P.hp>40,'Life Leech heals on melee hit');
 // aftershock explodes on melee
 EQ.melee.sockets[0]='aftershock';refreshAttacks();
 A(ATK.melee.explode>0,'Aftershock adds explosion to melee');
 // ---- ironskin ----
 EQ.armor=mkItem('robe',0);A(EQ.armor.sockets.length===3,'Runed Robe has 3 sockets');
 EQ.armor.sockets[0]='ironskin';refreshAttacks();NOARMOR();
 P.hp=200;P.maxhp=500;P.inv=0;P.block=false;hurtPlayer(100);
 A(P.hp===120,'Ironskin cuts 100 dmg to 80 (armor stripped)');
 // ---- elites ----
 EN.length=0;
 let elites=0,seen=0,volatiles=0;
 for(let d=400;d<3000;d+=70){P.x=(CAMP_X+((d*11)%600)-300)*TILE;P.y=d*TILE;
  P.vy=0;P.noFall=1;P.dead=false;P.hp=P.maxhp; // teleporting = free fall; fall dmg would kill us
  for(let i=0;i<15;i++)sim(1/60);
  for(const e of EN){seen++;if(e.elite){elites++;if(e.elite.boom)volatiles++}}}
 console.log('elite sampling:',elites,'elites in',seen,'enemy-observations');
 A(elites>0,'elites spawn at depth');
 // volatile corpse detonation hurts player in range
 const el=ELITES.find(x=>x.boom);
 P.x=(CAMP_X+400)*TILE;P.y=800*TILE;P.hp=P.maxhp=300;P.inv=0;P.dead=false;paused=false;EN.length=0;
 const ve={x:P.x+10,y:P.y,vx:0,vy:0,w:14,h:12,type:'crawler',ai:'walk',c:'#fff',hp:1,maxhp:1,dmg:20,spd:0,onG:false,flash:0,dir:1,elite:el};
 EN.push(ve);const vh=P.hp;killEnemy(ve);
 A(P.hp<vh,'Volatile corpse detonation damages player');
 // ---- secret tiles exist and break to a plain sword ----
 let secretFound=0;
 for(const [,c] of CHUNKS)for(let i=0;i<c.tiles.length;i++)if(c.tiles[i]===10)secretFound++;
 console.log('secret wall tiles in',CHUNKS.size,'chunks:',secretFound);
 A(secretFound>0,'secret walls generate');
 A(TILES[10].hard===0,'secret walls break to any weapon');
 // ---- anchors ----
 META.anchors={surface:1};META.startBiome='surface';P.dead=false;paused=false;P.hp=P.maxhp;P.noFall=5;
 // BIOMES bands: surface<70, caves<400, fungal<900, ruins<1600, forge<2400, abyss
 P.y=300*TILE;P.x=CAMP_X*TILE;sim(1/60);
 A(META.anchors.caves===1,'reaching caves sets anchor');
 P.y=600*TILE;P.noFall=5;sim(1/60);A(META.anchors.fungal===1,'reaching fungal sets anchor');
 A(biomeTop('fungal')===400&&biomeTop('caves')===70,'biomeTop returns band start');
 META.startBiome='fungal';newRun();
 A(Math.floor(P.y/TILE)>390,'newRun spawns at chosen anchor depth ('+Math.floor(P.y/TILE)+')');
 A(!solidAt(P.x,P.y),'anchor pocket is carved (not spawned in rock)');
 A(ANCHOR&&nearCamp(),'anchor counts as a safe zone (regen + camp menu)');
 const hp0=P.hp=10;for(let i=0;i<60;i++)sim(1/60);
 A(P.hp>hp0,'anchor heals like camp');
 // camp UI paths don't throw
 openCamp();openAnchors();setAnchor('caves');openLoadout();openCamp();closePanel();
 A(META.startBiome==='caves','anchor picker persists selection');
 META.startBiome='surface';newRun();
 A(ANCHOR===null&&Math.floor(P.y/TILE)<SURFACE+6,'surface start returns to camp');
 // ---- minimap ----
 for(let i=0;i<40;i++){sim(1/60);render()}
 A(MM&&MM.width===MMW,'minimap buffer builds');
 MMON=false;render();MMON=true;
 // ---- perf with everything on ----
 P.x=(CAMP_X+200)*TILE;P.y=1400*TILE;
 for(let i=0;i<120;i++){sim(1/60);render()}
 const t0=process.hrtime.bigint();for(let i=0;i<1800;i++){sim(1/60);render()}
 console.log('1800 frames w/ minimap+elites:',Number(process.hrtime.bigint()-t0)/1e6|0,'ms | EN',EN.length,'chunks',CHUNKS.size);
 A(EN.length<=125,'entity caps hold at depth');
 // ---- save round-trip ----
 saveMeta();const raw=localStorage.getItem('shardfall');META={};loadMeta();
 A(META.anchors&&META.anchors.fungal&&META.loadout,'meta save/load round-trips anchors+loadout');
 console.log(fails?'*** '+fails+' FAILURES ***':'ALL PASS');process.exitCode=fails?1:0;
}catch(err){console.error('CRASH:',err);process.exitCode=1}
