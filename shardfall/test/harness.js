// ---- SHARDFALL headless harness: stubs DOM + canvas so the game runs under plain node ----
// Date.now is pinned so world seeds and all RNG are DETERMINISTIC across runs.
// Without this, suites are flaky: a different cave layout changes what the assertions see.
const FIXED_NOW=1750000000000;
Date.now=()=>FIXED_NOW;
// ---- headless DOM/canvas stub ----
const elems={};
// Methods whose RETURN VALUE the renderer actually uses. A bare `()=>{}` proxy returns
// undefined for these, and render() then crashes on `.addColorStop` — which is a stub gap,
// not a game bug, but it looks identical in a failing suite.
const gradStub={addColorStop(){}};
const ctxRet={createLinearGradient:()=>gradStub,createRadialGradient:()=>gradStub,
 createPattern:()=>({}),measureText:()=>({width:0}),
 getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(Math.max(4,(w|0)*(h|0)*4)),width:w|0,height:h|0})};
const ctxStub=new Proxy({},{get(t,p){if(p in t)return t[p];if(p in ctxRet)return ctxRet[p];return (...a)=>{}},set(t,p,v){t[p]=v;return true}});
function mkEl(){return {style:{},innerHTML:'',textContent:'',width:0,height:0,
 classList:{add(){},remove(){},toggle(){}},
 // Menu navigation queries the panel for its buttons. Returning [] means "no focusable rows",
 // which is the honest headless answer — the nav logic is exercised in the browser suite.
 querySelectorAll(){return []},querySelector(){return null},
 getBoundingClientRect(){return {left:0,top:0,width:390,height:844}},
 scrollIntoView(){},click(){},
 addEventListener(){},removeEventListener(){},setPointerCapture(){},getContext(){return ctxStub}}}
global.document={getElementById:id=>elems[id]||(elems[id]=mkEl()),createElement:()=>mkEl(),
 body:mkEl()};
global.addEventListener=()=>{};
global.removeEventListener=()=>{};
// No pointer, no gamepads, no audio — the headless player is keyboard-only by construction.
global.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
global.navigator={getGamepads:()=>[]};
global.localStorage={_d:{},getItem(k){return k in this._d?this._d[k]:null},setItem(k,v){this._d[k]=String(v)}};
global.requestAnimationFrame=()=>{};
global.innerWidth=390;global.innerHeight=800;
// ---- helpers for the post-foundation-lock model (crit / armor / focus) ----
// These resolve against the game's top-level scope at CALL time, not load time.
// NOCRIT: crit is a 5% dice roll, so any exact-damage assertion is flaky without this.
global.NOCRIT=()=>{RUNB.crit=-9;RUNB.critMult=0;refreshAttacks()};
global.YESCRIT=()=>{RUNB.crit=9;refreshAttacks()};
// TOPUP: abilities now cost Focus as well as cooldown; tests that fire several in a row
// would otherwise fail on the resource, not on the thing being tested.
global.TOPUP=()=>{P.focus=FOCUS_MAX;P.acd=0};
// NOARMOR: strip flat armor when asserting raw damage numbers.
global.NOARMOR=()=>{RUNB.arm=-999;refreshAttacks();P.armor=0};
// GID: sockets hold {id,tier} now — compare through this, not against a bare string.
global.GID=g=>gemId(g);
