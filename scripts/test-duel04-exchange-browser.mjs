import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,copyFile} from "node:fs/promises";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
await mkdir("visual-report",{recursive:true});
const PHASES=["enemyApproach","enemyWindup","block","counterWindup","counterSwing","counterImpact","stagger","disengage"];

try {
 for(const width of [390,960]) {
  const height=width===390?800:720;
  const page=await browser.newPage({viewport:{width,height},isMobile:width===390,hasTouch:width===390,
   recordVideo:{dir:"visual-report",size:{width,height}}});
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  try {
   await page.goto("http://127.0.0.1:5173/lab-duelo-01.html",{waitUntil:"networkidle",timeout:45000});
   const root=page.locator('[data-lab="duel-01"]');
   await root.waitFor();
   await page.locator('[data-style-option="exchange"]').click();
   assert.equal(await root.getAttribute("data-style"),"exchange");
   assert.equal(Number(await root.getAttribute("data-hero-x")),185);
   assert.equal(Number(await root.getAttribute("data-monster-x")),0);
   await root.screenshot({path:"visual-report/duelo04-inicio-"+width+".png"});
   await page.evaluate(()=>{
    const root=document.querySelector('[data-lab="duel-01"]');
    if(!root)throw Error("Duelo não montado");
    const trace=[],sequence=[];
    const part=(name)=>root.querySelector('[data-testid="'+name+'"]')?.getAttribute("transform")??"";
    const snapshot=()=>{
     const f={
      phase:root.dataset.phase,
      heroX:Number(root.dataset.heroX),
      monsterX:Number(root.dataset.monsterX),
      monsterArm:part("duel-monster-front-arm"),
      monsterLeg:part("duel-monster-front-leg"),
      shield:part("duel-shield-arm"),
      sword:part("duel-sword-arm"),
      enemyBody:part("duel-monster-torso"),
      block:!!root.querySelector('[data-testid="duel-shield-block"]'),
      claw:!!root.querySelector('[data-testid="duel-claw"]')
     };
     trace.push(f);
     if(sequence.at(-1)!==f.phase)sequence.push(f.phase);
    };
    const observer=new MutationObserver(snapshot);
    observer.observe(root,{attributes:true,subtree:true,attributeFilter:["data-phase","data-hero-x","data-monster-x","transform","opacity"]});
    window.__duel04={trace,sequence,stop:()=>observer.disconnect()};
    snapshot();
   });
   await root.getByRole("button",{name:/Atacar o monstro/}).click();
   await page.waitForFunction(()=>{
    const r=document.querySelector('[data-lab="duel-01"]');
    return r?.dataset.phase==="idle"&&window.__duel04?.sequence.includes("disengage")
      &&r.querySelector('.duel-lab__controls button')?.disabled===false;
   },null,{timeout:8500,polling:20});
   const report=await page.evaluate(()=>{
    window.__duel04.stop();
    return {sequence:window.__duel04.sequence,trace:window.__duel04.trace};
   });
   for(const phase of PHASES)
    assert.ok(report.sequence.includes(phase),"Fase ausente "+phase+": "+report.sequence.join(","));
   const range=(field)=>report.trace.map(x=>x[field]);
   const unique=(field)=>new Set(range(field)).size;
   const frame=(phase)=>report.trace.find(x=>x.phase===phase);
   assert.ok(Math.min(...range("monsterX"))<=-300,"Monstro não avançou fisicamente");
   assert.ok(Math.max(...range("heroX"))>=345,"Herói não aproximou do confronto");
   assert.ok(unique("monsterLeg")>10,"Pernas do monstro não correram");
   assert.notEqual(frame("enemyWindup").monsterArm,frame("block").monsterArm,"Garra não atacou");
   assert.notEqual(frame("enemyApproach").shield,frame("block").shield,"Guerreiro não ergueu escudo");
   assert.ok(range("block").some(Boolean),"Sem brilho do contato com o escudo");
   assert.ok(range("claw").some(Boolean),"Sem trajetória da garra");
   assert.notEqual(frame("counterWindup").sword,frame("counterImpact").sword,"Espada não contra-atacou");
   assert.notEqual(frame("counterImpact").enemyBody,frame("stagger").enemyBody,"Monstro não reagiu ao contra-ataque");
   const monsterFromFrame=(f)=>730+f.monsterX;
   assert.ok(Math.max(...report.trace.filter(x=>x.phase==="stagger").map(monsterFromFrame))>530,
     "Monstro não foi deslocado pelo contra-ataque");
   assert.equal(Number(await root.getAttribute("data-hero-x")),185);
   assert.equal(Number(await root.getAttribute("data-monster-x")),0);
   await root.screenshot({path:"visual-report/duelo04-retorno-"+width+".png"});
   assert.deepEqual(errors,[],"Erros do navegador: "+errors.join(" | "));
   console.log("LAB_DUELO_04_TROCA_OK",JSON.stringify({width,phases:report.sequence,
    foeApproach:Math.min(...range("monsterX")),heroLunge:Math.max(...range("heroX")),
    foeLegPoses:unique("monsterLeg"),blockFrames:range("block").filter(Boolean).length,
    clawFrames:range("claw").filter(Boolean).length,heroReturned:true,foeReturned:true}));
  } finally {
   await page.close();
   const movie=await page.video()?.path();
   if(movie)await copyFile(movie,"visual-report/duelo04-troca-"+width+".webm");
  }
 }
} finally {await browser.close();}
