import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
const base="http://127.0.0.1:5173";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],
 ...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
await mkdir("visual-report",{recursive:true});
try{
 for(const [width,height] of [[390,844],[1440,900]]){
  const mobile=width<600;
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto(base,{waitUntil:"networkidle",timeout:60000});
   await page.getByRole("button",{name:"Guilda",exact:true}).last().click();
   const council=page.locator(".council-actions button:not([disabled])").first();
   if(await council.count())await council.click();
   await page.getByRole("button",{name:"Missões",exact:true}).last().click();
   await page.locator(".mission-card .action-button:not([disabled])").first().click();
   const send=page.locator(".send-row .action-button").first();
   await send.waitFor({state:"visible",timeout:15000});
   if(!(await send.isEnabled())){
    const specialist=page.getByRole("button",{name:"Montar especialista",exact:true});
    if(await specialist.count())await specialist.click();
   }
   assert.ok(await send.isEnabled(),"Equipe do laboratório não ficou pronta");
   await send.click();
   const stage=page.locator(".guild2d-stage");
   await stage.waitFor({state:"visible",timeout:15000});
   await page.waitForFunction(()=>[...document.querySelectorAll(".guild2d-unit img")].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:20000});
   await stage.scrollIntoViewIfNeeded();
   await page.waitForTimeout(150);
   const before=await stage.evaluate(el=>{
    const units=[...el.querySelectorAll(".guild2d-unit")];
    return {ids:units.map(u=>u.dataset.fighterId),images:units.map(u=>u.querySelector("img")),
      bars:el.querySelectorAll('.guild2d-hud [role="progressbar"]').length};
   });
   assert.ok(before.bars>=2);
   const initial=await stage.evaluate(el=>{
    const scene=el.getBoundingClientRect();
    window.__guildMotionImages=new Map([...el.querySelectorAll(".guild2d-unit")].map(u=>[u.dataset.fighterId,u.querySelector("img")]));
    return [...el.querySelectorAll(".guild2d-hud")].map(h=>{
     const r=h.getBoundingClientRect();
     return {id:h.dataset.fighterId,x:r.x-scene.x,y:r.y-scene.y};
    });
   });
   const attack=page.getByRole("button",{name:/^Atacar/}).first();
   await attack.waitFor({state:"visible",timeout:15000});
   assert.ok(await attack.isEnabled(),"Botão atacar bloqueado");
   await attack.click();
   await page.waitForFunction(()=>{
    return [...document.querySelectorAll(".guild2d-unit .guild2d-sprite")].some(node=>
     node.getAnimations().some(a=>a.effect?.getKeyframes().length===9&&a.playState==="running"));
   },null,{timeout:15000,polling:25});
   const moving=stage.locator('.guild2d-unit[data-cinematic-actor="true"]').first();
   await moving.waitFor({state:"attached"});
   const actorInfo=await moving.evaluate(node=>{
    const sprite=node.querySelector(".guild2d-sprite");
    const anim=sprite.getAnimations().find(a=>a.effect?.getKeyframes().length===9&&a.playState==="running");
    const shadow=node.querySelector(".guild2d-move-shadow");
    const shadowAnim=shadow.getAnimations().find(a=>a.effect?.getKeyframes().length===9);
    const frames=anim?.effect?.getKeyframes()||[];
    return {fighter:node.dataset.fighterId,moveKind:node.dataset.moveKind,
     hasMovement:!!anim,hasShadow:!!shadowAnim,frames:frames.length,
     impact:frames[4]?.transform,hitStop:frames[5]?.transform,
     returnPos:frames[8]?.transform,starting:frames[0]?.transform,
     sprite:sprite.getBoundingClientRect().toJSON()};
   });
   assert.ok(actorInfo.hasMovement&&actorInfo.hasShadow,"Sprite e sombra devem mover-se juntos: "+JSON.stringify(actorInfo));
   assert.ok(actorInfo.impact===actorInfo.hitStop,"Impacto deve ter pausa real");
   assert.equal(actorInfo.returnPos,actorInfo.starting,"Combatente deve voltar à formação");
   assert.ok(["charge","pounce","sidestep","cast"].includes(actorInfo.moveKind));
   await stage.screenshot({path:"visual-report/rig08-movimento-"+width+".png"});
   await page.waitForTimeout(1200);
   const stable=await stage.evaluate((el,refs)=>{
    const units=[...el.querySelectorAll(".guild2d-unit")];
    const stableImages=units.every(u=>{
     const img=u.querySelector("img");
     return img?.complete&&img?.naturalWidth>0&&window.__guildMotionImages?.get(u.dataset.fighterId)===img;
    });
    const noDuplicate=new Set(units.map(u=>u.dataset.fighterId)).size===units.length;
    const scene=el.getBoundingClientRect();
    const hud=refs.every(ref=>{
     const node=[...el.querySelectorAll(".guild2d-hud")].find(h=>h.dataset.fighterId===ref.id);
     if(!node)return false;
     const rect=node.getBoundingClientRect();
     return Math.abs((rect.x-scene.x)-ref.x)<2&&Math.abs((rect.y-scene.y)-ref.y)<2;
    });
    return {stableImages,noDuplicate,hud};
   },initial);
   assert.deepEqual(stable,{stableImages:true,noDuplicate:true,hud:true},"HUD ou imagem alterados");
   await page.emulateMedia({reducedMotion:"reduce"});
   assert.equal(await moving.locator(".guild2d-move-shadow").evaluate(el=>getComputedStyle(el).display),"none");
   await page.emulateMedia({reducedMotion:"no-preference"});
   await stage.evaluate(el=>el.classList.add("guild-lite-mode"));
   assert.equal(await moving.locator(".guild2d-move-shadow").evaluate(el=>getComputedStyle(el).display),"none");
   const save=await page.evaluate(()=>localStorage.getItem("cronicas-da-guilda:standalone:v1")||"");
   assert.ok(!save.includes("movement.actorFrames")&&!save.includes("rig08-"),"Persistência não pode guardar coreografia");
   assert.equal(errors.length,0,"Erro no navegador: "+errors.join(" | "));
   console.log("BLOCO_08C_MOVIMENTO_OK",JSON.stringify({width,hero:actorInfo.fighter,mode:actorInfo.moveKind,
    keyframes:actorInfo.frames,shadow:true,hitStop:true,returnToFormation:true,uiStable:true}));
  }finally{await page.close();}
 }
}finally{await browser.close();}
