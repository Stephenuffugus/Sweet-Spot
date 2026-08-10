let fails=0;const A=(c,m)=>{if(!c){console.error('FAIL:',m);fails++}else console.log('ok:',m)};
const mkE=(o={})=>Object.assign({x:P.x+20,y:P.y,vx:0,vy:0,w:14,h:12,type:'crawler',ai:'walk',
 c:'#fff',hp:9999,maxhp:9999,dmg:0,spd:0,onG:false,flash:0,dir:1,st:null},o);
const OFFCAMP=()=>{P.x=(CAMP_X+400)*TILE;P.y=300*TILE;ANCHOR=null};
try{
 for(let i=0;i<60;i++){sim(1/60);render();hud()}
 A(!P.dead,'boot clean');

 // ===== STATUS ENGINE =====
 OFFCAMP();EN.length=0;
 EQ.melee=mkItem('sword',0);EQ.melee.sockets[0]='ignite';refreshAttacks();
 A(ATK.melee.st&&ATK.melee.st.burn>0,'Ignite adds burn to attack params');
 let e=mkE();EN.push(e);P.mcd=0;doMelee();
 A(e.st&&e.st.burn,'burn applied on hit');
 const h1=e.hp;for(let i=0;i<60;i++)sim(1/60);
 A(e.hp<h1,'burn ticks damage over time');
 for(let i=0;i<200;i++)sim(1/60);
 A(!e.st||!e.st.burn,'burn expires');
 // chill slows
 EN.length=0;e=mkE({spd:100});EN.push(e);
 EQ.melee.sockets[0]='frostbite';refreshAttacks();P.mcd=0;doMelee();
 A(e.st.chill&&chillMul(e)<1,'Frostbite chills (movement multiplier <1)');
 // shock amplifies
 EN.length=0;e=mkE({hp:1000,maxhp:1000});EN.push(e);
 EQ.melee.sockets[0]=null;refreshAttacks();NOCRIT();
 P.mcd=0;doMelee();const plain=1000-e.hp;
 e.hp=1000;applyStatus(e,{shock:1.5});P.mcd=0;doMelee();const shocked=1000-e.hp;
 A(shocked>plain*1.4,'Shock amplifies incoming damage (~1.5x)');
 // bleed doubles while moving
 EN.length=0;e=mkE({hp:5000,maxhp:5000});EN.push(e);
 applyStatus(e,{bleed:20});e.vx=0;const b0=e.hp;for(let i=0;i<30;i++)tickStatus(e,1/60,false);
 const still=b0-e.hp;e.hp=5000;applyStatus(e,{bleed:20});e.vx=200;
 for(let i=0;i<30;i++)tickStatus(e,1/60,false);const moving=5000-e.hp;
 A(moving>still*1.8,'Bleed doubles on moving targets');
 // player status: burn drains, chill slows player
 EN.length=0;P.hp=P.maxhp=300;applyStatus(P,{burn:20});
 const ph=P.hp;for(let i=0;i<60;i++)sim(1/60);
 A(P.hp<ph,'player burns');
 applyStatus(P,{chill:0.5});A(moveSpd()<MOVE,'player chill slows movement');
 P.st=null;

 // ===== ABILITIES =====
 EQ.armor=mkItem('robe',0);
 EQ.armor.sockets[0]='blink';refreshAttacks();
 A(ATK.abil&&ATK.abil.fx==='blink','armor skill gem resolves as ability');
 P.x=(CAMP_X+400)*TILE;P.y=300*TILE;P.face=1;P.acd=0;
 const bx=P.x;useAbility();
 A(P.x!==bx||solidAt(bx+TILE,P.y),'Blink moves player (or is walled in)');
 A(P.acd>0,'ability goes on cooldown');
 useAbility();A(P.acd>0,'ability blocked while on cooldown');
 // warcry buff expires
 EQ.armor.sockets[0]='warcry';refreshAttacks();P.acd=0;
 TOPUP();const d0=ATK.melee.dmg;useAbility();
 A(ATK.melee.dmg>d0,'War Cry raises damage');
 A(BUFFS.length===1,'buff registered');
 for(let i=0;i<600;i++)sim(1/60);
 A(BUFFS.length===0&&Math.abs(ATK.melee.dmg-d0)<0.01,'War Cry expires and reverts cleanly');
 // mend cleanses
 EQ.armor.sockets[0]='mend';refreshAttacks();TOPUP();
 P.hp=50;applyStatus(P,{burn:30});useAbility();
 A(P.hp>50&&!P.st,'Mend heals and cleanses status');
 // quake digs + damages
 EQ.armor.sockets[0]='quake';refreshAttacks();TOPUP();
 EN.length=0;e=mkE({x:P.x+30});EN.push(e);const qh=e.hp;
 useAbility();A(e.hp<qh,'Quake damages nearby');
 // meteor spawns projectile
 EQ.armor.sockets[0]='meteor';refreshAttacks();TOPUP();PROJ.length=0;useAbility();
 A(PROJ.length===1&&PROJ[0].explode>0,'Meteor fires an exploding projectile');
 // ability gems restricted to armor
 BAG.push({kind:'gem',id:'meteor'});socketGem(BAG.length-1);
 A(!document.getElementById('panel').innerHTML.includes('MELEE:'),'ability gems armor-only');
 closePanel();BAG.length=0;

 // ===== UNIQUES =====
 // Each base now has two possible uniques (UNIQUES / UNIQ2) chosen by coin flip, so pin
 // `alt` before asserting on a specific one.
 const u=mkItem('bow',3);u.alt=0;
 A(u.rarity===3&&u.unique==='bow','unique rolls on rarity 3');
 A(itemName(u)==="Hornet's Call",'unique has its own name');
 EQ.ranged=u;refreshAttacks();
 A(ATK.ranged.count>=3,"Hornet's Call adds arrows");
 EQ.melee=mkItem('greataxe',3);EQ.melee.alt=0;refreshAttacks();
 A(ATK.melee.dig===3,'Worldbreaker digs anything');
 EQ.melee.alt=1;refreshAttacks();
 A(ATK.melee.cull>0,'The Long Hunger (alt unique) executes instead');
 const alts=Object.keys(UNIQ2).filter(k=>!UNIQUES[k]);
 A(alts.length===0,'every alt unique has a base unique to pair with');
 // alternates draw uniformly now (UNIQ2/UNIQ3) — redraw until the PRIMARY lands
 let sk;do{sk=mkItem('vest',3)}while(sk.alt);
 A(sk.sockets.length>=3,'Second Skin grants +2 sockets');
 const noUnique=mkItem('shield',3);A(noUnique.unique==='shield','shield has a unique');
 EQ.armor=mkItem('plate',3);const hpU=maxHP();
 EQ.armor=mkItem('plate',0);A(hpU>maxHP(),'Anchor unique adds HP');

 // ===== CLASSES =====
 META.classes={vanguard:1,marksman:1,pyromancer:1,delver:1};
 META.cls='vanguard';newRun();
 A(EQ.melee.base==='sword'&&EQ.ranged.base==='shield','Vanguard kit = sword + shield');
 A(GID(EQ.melee.sockets[0])==='cleave','signature gem pre-socketed');
 const vhp=P.maxhp;META.cls='marksman';newRun();
 A(P.maxhp<vhp,'Marksman is squishier than Vanguard');
 A(EQ.ranged.base==='bow'&&GID(EQ.ranged.sockets[0])==='multishot','Marksman kit + signature');
 A(ATK.ranged.pierce>=1,'Marksman passive grants pierce');
 META.cls='delver';newRun();
 A(EQ.melee.base==='axe'&&ATK.melee.dig>=2,'Delver digBonus stacks on axe');
 A(moveSpd()>MOVE,'Delver moves faster');
 META.cls='pyromancer';newRun();
 A(GID(EQ.ranged.sockets[0])==='ignite','Pyromancer starts with Ignite');
 EQ.armor.sockets[1]='meteor';refreshAttacks();
 const pcd=ATK.abil.cd;META.cls='vanguard';refreshAttacks();
 A(pcd<ATK.abil.cd,'Pyromancer abilCdr shortens ability cooldown');
 // block DR passive
 META.cls='vanguard';newRun();P.hp=P.maxhp=400;P.inv=0;P.block=true;hurtPlayer(100);
 const vdmg=400-P.hp;META.cls='marksman';P.hp=400;P.inv=0;P.block=true;hurtPlayer(100);
 A(400-P.hp>vdmg,'Vanguard blockDR passive beats other classes');
 P.block=false;
 // class UI paths
 openCamp();openClasses();pickClass('delver');toggleKit();toggleKit();openCamp();closePanel();
 A(META.cls==='delver','class picker persists');
 // custom loadout override still works
 META.useClassKit=false;META.loadout={melee:'sword',ranged:null,armor:'vest'};newRun();
 A(EQ.ranged===null,'custom loadout overrides class kit');
 META.useClassKit=true;

 // ===== integration + perf =====
 META.cls='pyromancer';newRun();
 P.x=(CAMP_X+200)*TILE;P.y=1500*TILE;
 for(let i=0;i<120;i++){sim(1/60);render()}
 HELD.rng=true;HELD.mel=true;
 const t0=process.hrtime.bigint();for(let i=0;i<1800;i++){sim(1/60);render()}
 console.log('1800 frames all systems:',Number(process.hrtime.bigint()-t0)/1e6|0,'ms | EN',EN.length,'PROJ',PROJ.length,'statused',EN.filter(x=>x.st&&Object.keys(x.st).length).length);
 HELD.rng=false;HELD.mel=false;
 A(EN.length<=125&&PROJ.length<=230,'caps hold with status engine live');
 saveMeta();META={};loadMeta();
 A(META.cls&&META.classes,'class selection survives save/load');
 console.log(fails?'*** '+fails+' FAILURES ***':'ALL PASS');process.exitCode=fails?1:0;
}catch(err){console.error('CRASH:',err);process.exitCode=1}
