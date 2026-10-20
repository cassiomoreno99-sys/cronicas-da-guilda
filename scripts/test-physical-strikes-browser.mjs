import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],
 ...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
await mkdir("visual-report",{recursive:true});
try{
 for(const [width,height] of [[390,844],[1440,900]]){
  const mobile=width<600;
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
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
   assert.ok(await send.isEnabled(),"Não foi possível iniciar a expedição");
   await send.click();
   const stage=page.locator(".guild2d-stage");
   await stage.waitFor({state:"visible",timeout:15000});
   await page.waitForFunction(()=>[...document.querySelectorAll(".guild2d-unit img")].every(img=>img.complete&&img.naturalWidth>0),null,{timeout:18000});
   const original=await stage.evaluate(el=>({
    ids:[...el.querySelectorAll(".guild2d-unit")].map(x=>x.dataset.fighterId),
    scene:getComputedStyle(el.querySelector(".guild2d-scene")).backgroundImage
   }));
   const styles=["sword","axe","spear","hammer","daggers","bow","claws","bite","tail","unarmed"];
   assert.ok(original.scene.includes("arena-aprovada.webp"));
   // Cada estilo precisa produzir parâmetros CSS distintos e elementos próprios.
   const matrix=await page.evaluate(styles=>{
    const sheet=document.createElement("div");
    sheet.className="guild2d-physical-strike";sheet.style.cssText="position:absolute;inset:0;pointer-events:none";
    document.body.append(sheet);
    const records=[];
    for(const style of styles){
      sheet.dataset.style=style;
      const cs=getComputedStyle(sheet);
      records.push([style,cs.getPropertyValue("--hit").trim(),cs.getPropertyValue("--thick").trim()]);
    }
    sheet.remove();return records;
   },styles);
   assert.equal(matrix.length,styles.length);
   assert.ok(new Set(matrix.map(x=>x[1])).size>=6,"Armas sem identidades visuais");
   let strike;
   for(let attempt=0;attempt<13;attempt++){
    const attack=page.getByRole("button",{name:/^Atacar/}).first();
    if(!(await attack.isVisible())||!(await attack.isEnabled()))break;
    await attack.click();
    try{
      await page.waitForFunction(()=>!!document.querySelector(".guild2d-physical-strike"),null,{timeout:1250,polling:20});
      strike=await stage.locator(".guild2d-physical-strike").evaluate(el=>({
        style:el.dataset.style,variant:el.dataset.variant,
        actualFX:!!el.querySelector(".guild2d-physical-contact"),
        windup:!!el.querySelector(".guild2d-physical-windup"),
        particles:el.querySelectorAll(".guild2d-physical-spark").length,
        generic:!!el.parentElement.querySelector(".guild2d-vfx,.guild2d-cinema"),
        rawDuration:getComputedStyle(el).getPropertyValue("--clock").trim()
      }));
      await stage.scrollIntoViewIfNeeded();
      await stage.screenshot({path:"visual-report/rig09-golpe-"+width+".png"});
      break;
    }catch(e){
      if(attempt===12)throw e;
    }
   }
   assert.ok(strike,"O combate real não produziu golpe físico");
   assert.ok(styles.includes(strike.style),JSON.stringify(strike));
   assert.ok(strike.actualFX&&strike.windup&&strike.particles>=6&&!strike.generic,
    "Efeitos físicos duplicados ou incompletos: "+JSON.stringify(strike));
   assert.ok(original.ids.length>=2);
   await page.emulateMedia({reducedMotion:"reduce"});
   await page.evaluate(()=>{
    const stage=document.querySelector(".guild2d-stage");
    const test=document.createElement("div");
    test.className="guild2d-physical-strike";
    test.dataset.style="sword";stage.appendChild(test);
   });
   assert.equal(await stage.locator(".guild2d-physical-strike").last().evaluate(el=>getComputedStyle(el).display),"none",
    "Movimento reduzido deve ocultar as partículas");
   const state=await page.evaluate(()=>localStorage.getItem("cronicas-da-guilda:standalone:v1")||"");
   assert.ok(!state.includes("guild2d-physical-strike")&&!state.includes("physical09-"),
    "VFX não pode ser salvo na campanha");
   assert.deepEqual(errors,[],"Erro JavaScript no Android/PC");
   console.log("BLOCO_09C_BROWSER_OK",JSON.stringify({width,...strike,redMotion:true,saveUntouchedByVfx:true}));
  }finally{await page.close();}
 }
}finally{await browser.close();}
