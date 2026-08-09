let fails=0;const A=(c,m)=>{if(!c){console.error('FAIL:',m);fails++}else console.log('ok:',m)};
const OFF=()=>{P.x=(CAMP_X+400)*TILE;P.y=700*TILE;ANCHOR=null;P.vx=0;P.vy=0;
 P.dead=false;paused=false;P.st=null;P.noFall=0;P.levT=0;P.burrowT=0;
 P.maxhp=Math.max(P.maxhp,400);P.hp=P.maxhp;HELD.jmp=false};
const solidCount=(cx,cy,r)=>{let n=0;for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)
 if(getTile(Math.floor(cx/TILE)+x,Math.floor(cy/TILE)+y)!==0)n++;return n};
try{
 for(let i=0;i<60;i++){sim(1/60);render();hud()}
 A(!P.dead,'boot clean');

 // ===== carve() =====
 OFF();
 // bury the player position in stone to test carving
 for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++)setTile(Math.floor(P.x/TILE)+x,Math.floor(P.y/TILE)+y,2);
 let before=solidCount(P.x,P.y,4);
 let cut=carve(P.x,P.y,TILE*2,0);
 A(cut===0,'carve respects hardness gate (soft dig cannot cut stone)');
 cut=carve(P.x,P.y,TILE*2,1);
 A(cut>0&&solidCount(P.x,P.y,4)<before,'carve removes stone at dig level 1');
 for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)setTile(Math.floor(P.x/TILE)+x,Math.floor(P.y/TILE)+y,3);
 A(carve(P.x,P.y,TILE*2,9)===0,'bedrock is never carvable');

 // ===== melee dig routes through carve =====
 OFF();
 for(let y=-3;y<=3;y++)for(let x=0;x<=5;x++)setTile(Math.floor(P.x/TILE)+x,Math.floor(P.y/TILE)+y,1);
 EQ.melee=mkItem('sword',0);refreshAttacks();P.face=1;P.mcd=0;
 before=solidCount(P.x+40,P.y,2);doMelee();
 A(solidCount(P.x+40,P.y,2)<before,'sword digs dirt');
 // stone resists sword, greataxe chews it
 OFF();for(let y=-3;y<=3;y++)for(let x=0;x<=5;x++)setTile(Math.floor(P.x/TILE)+x,Math.floor(P.y/TILE)+y,2);
 before=solidCount(P.x+40,P.y,2);P.mcd=0;doMelee();
 A(solidCount(P.x+40,P.y,2)===before,'sword cannot dig stone');
 EQ.melee=mkItem('greataxe',0);refreshAttacks();P.mcd=0;doMelee();
 A(solidCount(P.x+40,P.y,2)<before,'greataxe (dig 2) chews stone');

 // ===== Bore: tunneling projectile =====
 OFF();EQ.ranged=mkItem('wand',0);EQ.ranged.sockets[0]='bore';refreshAttacks();
 A(ATK.ranged.digR>0&&ATK.ranged.pierce>50,'Bore sets tunneling params');
 for(let y=-4;y<=4;y++)for(let x=1;x<=14;x++)setTile(Math.floor(P.x/TILE)+x,Math.floor(P.y/TILE)+y,1);
 before=solidCount(P.x+120,P.y,3);
 EN.length=0;P.face=1;P.rcd=0;doRanged();
 A(PROJ.length===1,'Bore fires');
 for(let i=0;i<40;i++)sim(1/60);
 A(solidCount(P.x+120,P.y,3)<before,'Bore tunnels through terrain instead of stopping');
 // Excavate adds dig to a normally non-digging weapon
 EQ.ranged=mkItem('bow',0);EQ.ranged.sockets[0]='excavate';refreshAttacks();
 A(ATK.ranged.dig>=1&&ATK.ranged.digR>0,'Excavate grants dig to a bow');

 // ===== FLIGHT =====
 OFF();PROJ.length=0;EN.length=0;
 P.maxfuel=maxFuel();P.fuel=P.maxfuel;
 // clear a shaft of air so the player can actually fly
 for(let y=-30;y<=6;y++)for(let x=-4;x<=4;x++)setTile(Math.floor(P.x/TILE)+x,Math.floor(P.y/TILE)+y,0);
 setTile(Math.floor(P.x/TILE),Math.floor(P.y/TILE)+7,2);
 for(let i=0;i<40;i++)sim(1/60); // fall to floor
 const groundY=P.y,f0=P.fuel;
 HELD.jmp=true;P.jbuf=0.12;
 for(let i=0;i<90;i++)sim(1/60);
 A(P.y<groundY-40,'holding jump lifts the player (hover works)');
 A(P.fuel<f0,'hovering drains fuel');
 A(P.vy>=FLY_VMAX-1,'rise speed is capped (jetpack, not rocket)');
 // fuel runs out
 for(let i=0;i<300;i++)sim(1/60);
 A(P.fuel<=1||P.onG,'fuel depletes under sustained hover');
 HELD.jmp=false;
 for(let i=0;i<200;i++)sim(1/60);
 A(P.onG&&P.fuel>10,'fuel regenerates on the ground');
 // fuel sources stack
 const base=maxFuel();EQ.armor=mkItem('harness',0);
 A(maxFuel()>base,'Delver Harness adds fuel');
 EQ.armor.sockets[0]='updraft';A(maxFuel()>base+60,'Updraft aura adds fuel');
 const sky=mkItem('harness',3);A(UNIQUES.harness.fuel>100,'Skyrigger unique is the fuel item');

 // ===== FALL DAMAGE =====
 OFF();EQ.armor=mkItem('vest',0);refreshAttacks();
 for(let y=-60;y<=2;y++)for(let x=-3;x<=3;x++)setTile(Math.floor(P.x/TILE)+x,Math.floor(P.y/TILE)+y,0);
 for(let x=-3;x<=3;x++)setTile(Math.floor(P.x/TILE)+x,Math.floor(P.y/TILE)+3,2);
 P.hp=P.maxhp=400;P.noFall=0;P.st=null;HELD.jmp=false;
 P.y-=55*TILE;P.vy=0;
 for(let i=0;i<240;i++){sim(1/60);if(P.onG)break}
 A(P.hp<400,'long fall deals damage');
 A(P.hp>0,'fall damage is capped — a fall never one-shots from full HP');
 // featherfall negates it
 P.hp=400;EQ.armor.sockets[0]='featherfall';P.y-=55*TILE;P.vy=0;P.onG=false;
 for(let i=0;i<240;i++){sim(1/60);if(P.onG)break}
 A(P.hp===400,'Featherfall aura negates fall damage');
 EQ.armor.sockets[0]=null;
 // short hops are free
 P.hp=400;P.y-=4*TILE;P.vy=0;P.onG=false;
 for(let i=0;i<120;i++){sim(1/60);if(P.onG)break}
 A(P.hp===400,'short falls are free');

 A(!P.dead,'player survived the flight/fall suite (no silent death)');
 // ===== TRAVERSAL ABILITIES =====
 EQ.armor=mkItem('robe',0);
 // Shaft
 OFF();for(let y=0;y<40;y++)for(let x=-3;x<=3;x++)setTile(Math.floor(P.x/TILE)+x,Math.floor(P.y/TILE)+y,1);
 EQ.armor.sockets[0]='shaft';refreshAttacks();P.acd=0;
 before=solidCount(P.x,P.y+20*TILE,3);useAbility();
 A(solidCount(P.x,P.y+20*TILE,3)<before,'Shaft drills a vertical tunnel downward');
 // Burrow phases through solid rock
 OFF();for(let y=-6;y<=20;y++)for(let x=-6;x<=6;x++)setTile(Math.floor(P.x/TILE)+x,Math.floor(P.y/TILE)+y,2);
 EQ.armor.sockets[0]='burrow';refreshAttacks();P.acd=0;
 const by=P.y;useAbility();
 A((P.burrowT||0)>perf,'Burrow sets phase timer');
 for(let i=0;i<50;i++)sim(1/60);
 A(P.y>by+8,'Burrow moves the player down through solid rock');
 A(solidCount(P.x,P.y,2)<25,'Burrow leaves a carved tunnel');
 for(let i=0;i<120;i++)sim(1/60);
 A((P.burrowT||0)<=perf,'Burrow expires');
 // Levitate
 OFF();for(let y=-30;y<=6;y++)for(let x=-4;x<=4;x++)setTile(Math.floor(P.x/TILE)+x,Math.floor(P.y/TILE)+y,0);
 EQ.armor.sockets[0]='levitate';refreshAttacks();P.acd=0;P.fuel=0;
 useAbility();A(P.fuel===P.maxfuel,'Levitate refills fuel');
 HELD.jmp=true;const ly=P.y;for(let i=0;i<120;i++)sim(1/60);
 A(P.fuel>P.maxfuel*0.9,'Levitate suspends fuel drain');
 A(P.y<ly,'player rises during Levitate');
 HELD.jmp=false;for(let i=0;i<500;i++)sim(1/60);
 A((P.levT||0)<=perf,'Levitate expires');
 // Grapple to terrain
 OFF();for(let y=-8;y<=8;y++)for(let x=-10;x<=10;x++)setTile(Math.floor(P.x/TILE)+x,Math.floor(P.y/TILE)+y,0);
 for(let y=-8;y<=8;y++)setTile(Math.floor(P.x/TILE)+11,Math.floor(P.y/TILE)+y,2);
 EQ.armor.sockets[0]='grapple';refreshAttacks();TOPUP();EN.length=0;P.face=1;P.vx=0;
 useAbility();
 A(GRAPPLE&&P.vx>200,'Grapple anchors to terrain and yanks the player');
 A(P.noFall>0,'Grapple grants fall protection');
 // Grapple pulls an enemy
 OFF();EN.length=0;TOPUP();P.face=1;
 const tgt={x:P.x+90,y:P.y,vx:0,vy:0,w:14,h:12,type:'crawler',ai:'walk',c:'#fff',hp:500,maxhp:500,dmg:0,spd:0,onG:false,flash:0,dir:1,st:null};
 EN.push(tgt);useAbility();
 A(tgt.vx<0,'Grapple yanks a light enemy toward the player');

 // ===== integration =====
 META.cls='delver';newRun();
 A(P.maxfuel>=60&&P.fuel===P.maxfuel,'run starts with full fuel');
 P.x=(CAMP_X+200)*TILE;P.y=1200*TILE;
 HELD.jmp=true;HELD.mel=true;
 const t0=process.hrtime.bigint();for(let i=0;i<1800;i++){sim(1/60);render()}
 console.log('1800 frames w/ flight+digging:',Number(process.hrtime.bigint()-t0)/1e6|0,'ms | chunks',CHUNKS.size,'EN',EN.length);
 HELD.jmp=false;HELD.mel=false;
 A(!isNaN(P.x)&&!isNaN(P.y)&&!isNaN(P.fuel),'no NaN leaks from traversal math');
 A(EN.length<=125,'caps still hold');
 console.log(fails?'*** '+fails+' FAILURES ***':'ALL PASS');process.exitCode=fails?1:0;
}catch(err){console.error('CRASH:',err);process.exitCode=1}
