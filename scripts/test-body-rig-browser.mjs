import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
import assert from "node:assert/strict";

/** Experimento isolado: testa a articulação diretamente no DOM sem tocar no motor. */
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],
 ...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
const errors=[];
await mkdir("visual-report",{recursive:true});
try{
 for(const [width,height] of [[390,844],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:width<500?2:1,
   isMobile:width<500,hasTouch:width<500});
  page.on("pageerror",e=>errors.push(width+": "+e.message));
  try{
   await page.goto("http://127.0.0.1:5173",{waitUntil:"networkidle",timeout:60000});
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
   assert.ok(await send.isEnabled(),"Equipe não pronta para iniciar a arena");
   await send.click();
   const qualitySwitch=page.locator(".guild2d-quality-control");
   await qualitySwitch.waitFor({state:"visible"});
   // Este teste verifica RIG COMPLETO; em aparelho fraco, o padrão econômico
   // preserva a imagem original e suprime o rig intencionalmente.
   if(await page.locator('.guild2d-stage[data-quality="economy"]').count())
    await qualitySwitch.click();
   const stage=page.locator(".guild2d-stage");
   await stage.waitFor({state:"visible",timeout:15000});
   await page.waitForFunction(()=>[...document.querySelectorAll(".guild2d-unit img")].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:20000});
   await page.waitForTimeout(200);
   const summary=await stage.evaluate(stage=>{
    const units=[...stage.querySelectorAll(".guild2d-unit")];
    return {candidates:units.filter(el=>el.dataset.rigCandidate==="true").length,
     active:units.filter(el=>el.dataset.rigReady==="true").length,
     candidateWithTransparent:units.filter(el=>el.dataset.rigCandidate==="true"&&el.dataset.rigReady==="true").length,
     untouched:units.filter(el=>el.dataset.rigCandidate!=="true").length,
     parts:[...stage.querySelectorAll(".guild2d-body-rig")].map(x=>x.querySelectorAll(".guild2d-rig-part").length),
     images:[...stage.querySelectorAll(".guild2d-unit img")].map(i=>i.getAttribute("src"))};
   });
   assert.ok(summary.candidates>=1,"Nenhum sprite original compatível foi identificado: "+JSON.stringify(summary));
   assert.ok(summary.parts.every(n=>n===6),"Rig incompleto: "+JSON.stringify(summary));
   const unit=stage.locator('.guild2d-unit[data-rig-candidate="true"]').first();
   const original=unit.locator(".guild2d-sprite>img");
   const rig=unit.locator(".guild2d-body-rig");
   const battleSnapshot=async()=>page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem("cronicas-da-guilda:standalone:v1")).state;
    return {day:s.day,gold:s.gold,
     activeBattles:s.expeditions.map(e=>({id:e.id,rounds:e.battle?.rounds,logCount:e.battle?.log?.length,
      hp:e.battle?.combat?.fighters?.map(f=>[f.id,f.hp])}))};
   });
   const saveBefore=await battleSnapshot();
   await stage.scrollIntoViewIfNeeded();
   await stage.screenshot({path:"visual-report/rig07-original-"+width+".png"});

   // Testa poses mesmo quando uma arte opaca desabilita o rig na versão jogável.
   for(const pose of ["melee","cast","hit","idle"]){
    await unit.evaluate((el,pose)=>el.setAttribute("data-rig-pose",pose),pose);
    const animation=await unit.locator(".guild2d-rig-arm-front").evaluate(el=>getComputedStyle(el).animationName);
    assert.ok(animation.startsWith("rig07-"),pose+": animação da parte não ativada: "+animation);
    await page.waitForTimeout(pose==="melee"?370:pose==="cast"?330:110);
    if(pose==="melee"||pose==="cast"){
     const transform=await unit.locator(".guild2d-rig-arm-front").evaluate(el=>getComputedStyle(el).transform);
     assert.notEqual(transform,"none",pose+": braço dianteiro imóvel");
     await stage.screenshot({path:"visual-report/rig07-"+pose+"-"+width+".png"});
    }
   }
   // O motor avança o combate automaticamente enquanto a página está aberta.
   // Não confundir esse avanço legítimo com alterações produzidas pela pose visual.
   const saveAfter=await battleSnapshot();
   assert.equal(saveAfter.day,saveBefore.day,"Mudar pose não pode avançar o dia");
   assert.equal(saveAfter.gold,saveBefore.gold,"Mudar pose não pode alterar ouro");
   assert.deepEqual(saveAfter.activeBattles.map(e=>e.id),saveBefore.activeBattles.map(e=>e.id),
    "Mudar pose não pode trocar expedições");
   assert.ok(saveAfter.activeBattles.every(b=>b.rounds>=0&&b.hp.every(([id,hp])=>typeof id==="string"&&hp>=0)),
    "Estado de combate ficou inválido");
   const rawSave=await page.evaluate(()=>localStorage.getItem("cronicas-da-guilda:standalone:v1"));
   assert.ok(!rawSave.includes("guild2d-rig-")&&!rawSave.includes("data-rig-pose"),
    "Detalhes visuais não podem ser persistidos no save");

   await page.emulateMedia({reducedMotion:"reduce"});
   assert.equal(await rig.evaluate(el=>getComputedStyle(el).display),"none","Preferência de movimento reduzido ignorada");
   assert.equal(await original.evaluate(el=>getComputedStyle(el).opacity),"1","Imagem original oculta no modo reduzido");
   await page.emulateMedia({reducedMotion:"no-preference"});
   await page.evaluate(()=>document.querySelector(".guild2d-stage")?.classList.add("guild-lite-mode"));
   assert.equal(await rig.evaluate(el=>getComputedStyle(el).display),"none","Modo leve não desligou rig");
   assert.equal(await original.evaluate(el=>getComputedStyle(el).opacity),"1","Fallback invisível no modo leve");
   console.log("RIG_07_BROWSER",JSON.stringify({width,...summary,saveIntact:true,reducedMotion:true,lightMode:true}));
  }finally{await page.close();}
 }
 if(errors.length)throw Error("Erros JS: "+errors.join(" | "));
 console.log("BLOCO_07C_BROWSER_OK");
}finally{await browser.close();}
