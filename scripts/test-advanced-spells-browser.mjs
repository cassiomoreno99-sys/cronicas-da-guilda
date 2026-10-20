import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],
 ...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
await mkdir("visual-report",{recursive:true});
const families=["flame","storm","frost","shadow","radiant","verdant","arcane","ward","resonance"];
try{
 for(const [width,height] of [[390,844],[1440,900]]){
  const mobile=width<600;
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:mobile?2:1,
    isMobile:mobile,hasTouch:mobile});
  const errors=[];
  page.on("pageerror",err=>errors.push(err.message));
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
   assert.ok(await send.isEnabled(),"Equipe não pôde iniciar combate");
   await send.click();
   const stage=page.locator(".guild2d-stage");
   await stage.waitFor({state:"visible",timeout:15000});
   await page.waitForFunction(()=>[...document.querySelectorAll(".guild2d-unit img")].every(i=>i.complete&&i.naturalWidth>0),
     null,{timeout:20000});
   const evidence=await stage.evaluate((el,families)=>{
    const styles=[];
    const artificial=document.createElement("span");
    artificial.className="guild2d-advanced-spell";
    el.append(artificial);
    for(const family of families){
     artificial.dataset.family=family;
     const cs=getComputedStyle(artificial);
     styles.push({family,main:cs.getPropertyValue("--magic").trim(),
      dark:cs.getPropertyValue("--magic-dark").trim()});
    }
    artificial.remove();
    const images=[...el.querySelectorAll(".guild2d-unit img")].map(img=>img.src);
    const source=getComputedStyle(el.querySelector(".guild2d-scene")).backgroundImage;
    return {styles,images,source,units:el.querySelectorAll(".guild2d-unit").length};
   },families);
   assert.ok(evidence.source.includes("arena-aprovada.webp"));
   assert.ok(evidence.units>=2);
   assert.ok(new Set(evidence.styles.map(x=>x.main)).size>=8,"As famílias não se distinguem");
   // Observador captura a identidade de uma MAGIA REAL do log, mesmo se renderizada
   // por apenas 820ms após a atualização da campanha.
   await stage.evaluate(el=>{
    window.__magic10Captured=[];
    const observer=new MutationObserver(()=>{
     const vfx=el.querySelector(".guild2d-advanced-spell");
     if(vfx&&!window.__magic10Captured.some(x=>x.effect===vfx.dataset.effect)){
      window.__magic10Captured.push({
       family:vfx.dataset.family,effect:vfx.dataset.effect,motion:vfx.dataset.motion,
       duration:getComputedStyle(vfx).getPropertyValue("--duration").trim(),
       particleCount:vfx.querySelectorAll(".guild2d-magic-particle").length,
       hasSource:!!vfx.querySelector(".guild2d-magic-origin"),
       hasImpact:!!vfx.querySelector(".guild2d-magic-impact"),
       simultaneousPhysical:!!el.querySelector(".guild2d-physical-strike"),
       simultaneousLegacy:!!el.querySelector(".guild2d-vfx,.guild2d-cinema")
      });
     }
    });
    observer.observe(el,{childList:true,subtree:true});
    window.__magic10Observer=observer;
   });
   // Escolhe conjurador verdadeiro, quando existir; sem fabricar eventos da campanha.
   const caster=stage.locator('.guild2d-unit[data-class="mage"],.guild2d-unit[data-class="healer"],.guild2d-unit[data-class="druid"],.guild2d-unit[data-class="bard"]').first();
   if(await caster.count())await caster.click();
   const firstSkill=page.locator(".guild2d-quickbar .guild2d-quick-slot:not([disabled])").first();
   if(await firstSkill.count())await firstSkill.click();
   let capture;
   for(let attempt=0;attempt<17;attempt++){
    const hit=page.getByRole("button",{name:/^Atacar/}).first();
    if(!(await hit.isVisible())||!(await hit.isEnabled()))break;
    await hit.click();
    const active=stage.locator(".guild2d-advanced-spell");
    if(await active.count()){
      await stage.scrollIntoViewIfNeeded();
      await stage.screenshot({path:"visual-report/magia10-real-"+width+".png"});
    }
    await page.waitForTimeout(175);
    capture=await page.evaluate(()=>window.__magic10Captured?.[0]);
    if(capture)break;
   }
   // A verificação visual de todas as famílias não depende de a missão inicial
   // disponibilizar magos ou um feitiço específico.
   await stage.evaluate(el=>{
    el.querySelector(".guild2d-advanced-spell")?.remove();
    const temp=document.createElement("span");
    temp.className="guild2d-advanced-spell";
    temp.dataset.family="storm";
    temp.dataset.motion="lightning";
    temp.style.cssText="--start-x:19%;--start-y:37%;--flight-x:55cqw;--flight-y:17cqh;--cinema-ms:960ms";
    temp.innerHTML='<span class="guild2d-magic-impact"><i class="guild2d-magic-lightning a"></i></span>';
    el.append(temp);temp.dataset.testFixture="true";
   });
   await stage.scrollIntoViewIfNeeded();
   await page.waitForTimeout(190);
   const lightning=await stage.locator('.guild2d-advanced-spell[data-test-fixture="true"] .guild2d-magic-lightning')
    .evaluate(el=>({animation:getComputedStyle(el).animationName,display:getComputedStyle(el).display}));
   assert.equal(lightning.animation,"magic10-strike");
   assert.notEqual(lightning.display,"none");
   await stage.screenshot({path:"visual-report/magia10-raios-"+width+".png"});
   await page.emulateMedia({reducedMotion:"reduce"});
   assert.equal(await stage.locator('.guild2d-advanced-spell[data-test-fixture="true"]')
     .evaluate(el=>getComputedStyle(el).display),"none");
   const saved=await page.evaluate(()=>localStorage.getItem("cronicas-da-guilda:standalone:v1")||"");
   assert.ok(!saved.includes("guild2d-advanced-spell")&&!saved.includes("magic10-"));
   assert.deepEqual(errors,[],"Erros JS no navegador");
   console.log("BLOCO_10C_BROWSER_OK",JSON.stringify({
    width,families:evidence.styles.length,realCastObserved:!!capture,
    captured:capture||null,animation:lightning.animation,reducedMotion:true,
    stableImages:true,saveUnmodifiedByEffects:true
   }));
   // Se não ocorreu magia REAL na missão de teste, registrar explicitamente
   // a limitação em vez de mascará-la como aprovação funcional.
   if(!capture)console.log("BLOCO_10C_REAL_CAST_NAO_OBSERVADO largura="+width);
   await stage.evaluate(()=>window.__magic10Observer?.disconnect());
  }finally{await page.close();}
 }
}finally{await browser.close();}
