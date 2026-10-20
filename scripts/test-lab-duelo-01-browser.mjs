import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],
 ...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
await mkdir("visual-report",{recursive:true});
try{
 for(const width of [390,960]){
  const page=await browser.newPage({viewport:{width,height:width===390?800:720},
   deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390,
   recordVideo:{dir:"visual-report",size:{width:width===390?390:960,height:width===390?800:720}}});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto("http://127.0.0.1:5173/lab-duelo-01.html",{waitUntil:"networkidle",timeout:45000});
   const root=page.locator('[data-lab="duel-01"]');
   await root.waitFor();
   const hero=page.getByTestId("duel-warrior"),monster=page.getByTestId("duel-monster");
   assert.equal(await hero.count(),1);
   assert.equal(await monster.count(),1);
   assert.equal(await page.locator('[data-lab="duel-01"] img').count(),0,"Não pode usar PNG deslizando");
   assert.equal(await page.locator("#duel-lab-root [data-lab]").count(),1);
   const initialX=Number(await root.getAttribute("data-hero-x"));
   assert.equal(initialX,185);
   await root.screenshot({path:"visual-report/duelo01-parado-"+width+".png"});
   // O teste anterior fotografava 8 fases em apenas 1,7 s.
   // Screenshots síncronas atrasavam a captura e o Chrome perdia fases curtas.
   // Aqui MutationObserver acompanha TODOS os renders sem bloquear o vídeo.
   await page.evaluate(()=>{
    const root=document.querySelector('[data-lab="duel-01"]');
    if(!root)throw new Error("sem cena do duelo");
    const frames=[];
    const snapshot=()=>{
     const phase=root.getAttribute("data-phase");
     const previous=frames[frames.length-1];
     if(!phase||previous?.phase===phase)return;
     const attr=id=>root.querySelector('[data-testid="'+id+'"]')?.getAttribute("transform")||"";
     frames.push({
      phase,
      heroX:Number(root.getAttribute("data-hero-x")),
      monsterX:Number(root.getAttribute("data-monster-x")),
      sword:attr("duel-sword-arm"),leg:attr("duel-front-leg"),
      torso:attr("duel-torso"),enemy:attr("duel-monster-torso"),
      head:attr("duel-monster-head")
     });
    };
    const observer=new MutationObserver(snapshot);
    observer.observe(root,{attributes:true,attributeFilter:["data-phase","data-hero-x","data-monster-x"]});
    window.__duelEvidence=frames;
    window.__duelStop=()=>observer.disconnect();
    snapshot();
   });
   await page.getByRole("button",{name:/Atacar o monstro/}).click();
   await page.waitForFunction(()=>{
    const root=document.querySelector('[data-lab="duel-01"]');
    const frames=window.__duelEvidence||[];
    return root?.dataset.phase==="idle"&&frames.some(x=>x.phase==="return");
   },null,{timeout:6500,polling:25});
   const observations=await page.evaluate(()=>{
    window.__duelStop?.();
    return window.__duelEvidence||[];
   });
   const allPhases=["anticipation","dash","plant","swing","impact","reaction","recover","return"];
   for(const phase of allPhases){
    assert.ok(observations.some(x=>x.phase===phase),
     "Ausência de pose REAL na gravação: "+phase+". Sequência "+observations.map(x=>x.phase).join(","));
   }
   const observed=Object.fromEntries(allPhases.map(phase=>[phase,observations.find(x=>x.phase===phase)]));
   assert.ok(observed.plant.heroX>initialX+340,"Avanço insuficiente até o inimigo");
   assert.ok(observed.impact.heroX>=observed.plant.heroX-1,"Guerreiro perdeu distância no contato");
   assert.notEqual(observed.anticipation.sword,observed.swing.sword,"Espada não gira no ombro");
   assert.notEqual(observed.dash.leg,observed.plant.leg,"Pernas paradas");
   assert.notEqual(observed.plant.torso,observed.reaction.torso,"Torso não gira");
   assert.notEqual(observed.plant.enemy,observed.reaction.enemy,"Monstro não recua");
   assert.notEqual(observed.plant.head,observed.reaction.head,"Cabeça não reage");
   assert.ok(await hero.locator("path").count()>30,"Armadura perdeu detalhes");
   assert.ok(await monster.locator("path").count()>30,"Monstro perdeu detalhes");
   assert.equal(Number(await root.getAttribute("data-hero-x")),185,"Guerreiro não voltou à formação");
   await root.getByRole("button",{name:/Atacar o monstro/}).waitFor({state:"visible"});
   await page.waitForFunction(()=>!document.querySelector('[data-lab="duel-01"] button')?.disabled,
    null,{timeout:3000});
   await root.screenshot({path:"visual-report/duelo01-final-"+width+".png"});
   console.log("LAB_DUELO_02_ARTICULACAO_OK",JSON.stringify({
    width,phases:observations.map(x=>x.phase),startX:initialX,
    contactX:observed.impact.heroX,returnX:Number(await root.getAttribute("data-hero-x")),
    articulatedArm:true,independentLegs:true,torsoTwist:true,
    monsterHeadAndTorsoReaction:true,videoRecorded:true
   }));
   // Segundo duelo na MESMA gravação: adversário reage ao golpe pesado.
   await page.locator('[data-style-option="heavy"]').click();
   assert.equal(await root.getAttribute("data-style"),"heavy");
   await root.screenshot({path:"visual-report/duelo03-heavy-pronto-"+width+".png"});
   await page.evaluate(()=>{
    const root=document.querySelector('[data-lab="duel-01"]');
    const trace=[],phases=[];
    const part=id=>root.querySelector('[data-testid="'+id+'"]')?.getAttribute("transform")||"";
    const snap=()=>{
     const f={phase:root.dataset.phase,x:Number(root.dataset.heroX),m:Number(root.dataset.monsterX),
      elbow:part("duel-forearm"),wrist:part("duel-wrist"),
      knee:part("duel-front-leg"),foeKnee:part("duel-monster-front-leg"),
      sword:part("duel-sword-arm"),head:part("duel-monster-head")};
     trace.push(f);
     if(phases[phases.length-1]?.phase!==f.phase)phases.push(f);
    };
    const obs=new MutationObserver(snap);
    obs.observe(root,{attributes:true,subtree:true,attributeFilter:["transform","data-phase","data-hero-x","data-monster-x"]});
    window.__heavyTrace=trace;window.__heavyPhases=phases;window.__stopHeavy=()=>obs.disconnect();
    snap();
   });
   await root.getByRole("button",{name:/Atacar o monstro/}).click();
   await page.waitForFunction(()=>{
    const root=document.querySelector('[data-lab="duel-01"]');
    return root?.dataset.phase==="idle"&&(window.__heavyPhases||[]).some(x=>x.phase==="return");
   },null,{timeout:8500,polling:25});
   const heavy=await page.evaluate(()=>{
    window.__stopHeavy?.();
    return {trace:window.__heavyTrace||[],phases:window.__heavyPhases||[]};
   });
   for(const phase of ["anticipation","dash","plant","swing","impact","reaction","recover","return"])
    assert.ok(heavy.phases.some(x=>x.phase===phase),"Golpe pesado perdeu "+phase);
   assert.ok(Math.max(...heavy.trace.map(x=>x.m))>43,"Monstro não recua mais no golpe pesado");
   assert.ok(new Set(heavy.trace.map(x=>x.elbow)).size>10,"Cotovelo sem articulação");
   assert.ok(new Set(heavy.trace.map(x=>x.wrist)).size>6,"Punho sem articulação");
   assert.ok(new Set(heavy.trace.map(x=>x.foeKnee)).size>6,"Joelho do monstro parado");
   assert.ok(new Set(heavy.trace.map(x=>x.knee)).size>6,"Perna do guerreiro parada");
   assert.ok(Math.max(...heavy.trace.map(x=>x.x))>560,"Golpe pesado não alcança inimigo");
   assert.equal(Number(await root.getAttribute("data-hero-x")),185,"Guerreiro pesado não retornou");
   await root.screenshot({path:"visual-report/duelo03-heavy-final-"+width+".png"});
   console.log("LAB_DUELO_03_HEAVY_OK",JSON.stringify({width,recoil:Math.max(...heavy.trace.map(x=>x.m)),
    elbowFrames:new Set(heavy.trace.map(x=>x.elbow)).size,
    wristFrames:new Set(heavy.trace.map(x=>x.wrist)).size,styles:["slash","heavy"]}));
   assert.deepEqual(errors,[],"Erros JS: "+errors.join(" | "));

  }finally{
   await page.close();
   const video=await page.video()?.path();
   if(video){
    const {copyFile}=await import("node:fs/promises");
    await copyFile(video,"visual-report/duelo03-movimento-"+width+".webm");
   }
  }
 }
}finally{await browser.close();}
