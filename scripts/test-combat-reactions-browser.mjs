import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";

const browser=await chromium.launch({headless:true,args:["--no-sandbox"],
 ...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
await mkdir("visual-report",{recursive:true});
try{
 for(const [width,height] of [[390,844],[1440,900]]){
  const mobile=width<600;
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:mobile?2:1,
    isMobile:mobile,hasTouch:mobile});
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
   assert.ok(await send.isEnabled(),"Equipe não montada");
   await send.click();
   const stage=page.locator('.guild2d-stage[data-cinematic="real-2d"]');
   await stage.waitFor({state:"visible",timeout:15000});
   await page.waitForFunction(()=>[...document.querySelectorAll(".guild2d-unit img")].every(i=>i.complete&&i.naturalWidth>0),
    null,{timeout:18000});
   await stage.scrollIntoViewIfNeeded();
   const original=await stage.evaluate(el=>({
    fighters:[...el.querySelectorAll(".guild2d-unit")].map(x=>x.dataset.fighterId),
    bg:getComputedStyle(el.querySelector(".guild2d-scene")).backgroundImage
   }));
   assert.ok(original.bg.includes("arena-aprovada.webp"));
   assert.ok(original.fighters.length>=2&&new Set(original.fighters).size===original.fighters.length);
   // Observar reações e estados da partida de VERDADE: apenas leitura, sem
   // alterar vida, eventos, cooldown ou itens da campanha.
   await stage.evaluate(el=>{
    window.__block11Events=[];
    const watch=()=>{
     for(const reaction of el.querySelectorAll(".guild2d-reaction-flash")){
      const key=reaction.closest(".guild2d-unit")?.dataset.fighterId+":"+reaction.dataset.reaction;
      if(key&&!window.__block11Events.includes(key))window.__block11Events.push(key);
     }
     for(const status of el.querySelectorAll(".guild2d-status-signal")){
      const key="status:"+status.dataset.status;
      if(!window.__block11Events.includes(key))window.__block11Events.push(key);
     }
    };
    const mo=new MutationObserver(watch);
    mo.observe(el,{subtree:true,childList:true,attributes:true,attributeFilter:["data-reaction","data-status"]});
    window.__block11Observer=mo;watch();
   });
   for(let i=0;i<7;i++){
    const attack=page.getByRole("button",{name:/^Atacar/}).first();
    if(!(await attack.isVisible())||!(await attack.isEnabled()))break;
    await attack.click();
    await page.waitForTimeout(220);
    if(i===1)await stage.screenshot({path:"visual-report/bloco11-combate-"+width+".png"});
    if((await page.evaluate(()=>window.__block11Events?.length||0))>=3)break;
   }
   const real=await page.evaluate(()=>window.__block11Events||[]);
   console.log("BLOCO_11C_EVENTOS_REAIS",JSON.stringify({width,reactions:real}));
   await page.evaluate(()=>window.__block11Observer?.disconnect());

   // Um palco visual de ensaio NÃO altera a campanha e não depende de que
   // a missão inicial sorteie exatamente veneno, escudo ou atordoamento.
   await page.evaluate(()=>{
    const box=document.createElement("div");
    box.id="guild-block11-fixture";
    box.className="guild-lite-test";
    box.style.cssText="position:relative;width:min(92vw,700px);height:360px;margin:30px auto;background:#0d1725;border-radius:8px;overflow:hidden;isolation:isolate";
    box.innerHTML='<span class="guild2d-sprite" style="width:170px;height:285px;margin:auto;position:relative;display:block;">'
     +'<span class="guild2d-status-aura" aria-hidden="true">'
     +'<span class="guild2d-status-signal" data-status="shield" data-tone="guard"><i class="guild2d-status-loop"></i><i class="guild2d-status-core"></i></span>'
     +'<span class="guild2d-status-signal" data-status="poison" data-tone="danger"><i class="guild2d-status-loop"></i><i class="guild2d-status-core"></i></span>'
     +'<span class="guild2d-status-signal" data-status="stun" data-tone="control"><i class="guild2d-status-loop"></i><i class="guild2d-status-core"></i></span>'
     +'</span><span class="guild2d-reaction-flash" data-reaction="critical" aria-hidden="true">'
     +'<i class="guild2d-reaction-center"></i><i class="guild2d-reaction-wave"></i><i class="guild2d-reaction-symbol"></i></span></span>';
    document.body.append(box);
   });
   const fixture=page.locator("#guild-block11-fixture");
   await fixture.scrollIntoViewIfNeeded();
   const computed=await fixture.evaluate(el=>({
    pulse:getComputedStyle(el.querySelector('.guild2d-status-signal[data-status="poison"] .guild2d-status-loop')).animationName,
    stun:getComputedStyle(el.querySelector('.guild2d-status-signal[data-status="stun"] .guild2d-status-loop')).animationName,
    reaction:getComputedStyle(el.querySelector(".guild2d-reaction-center")).animationName,
    hasAll:el.querySelectorAll(".guild2d-status-signal").length
   }));
   assert.equal(computed.pulse,"guild2d-status-pulse");
   assert.equal(computed.stun,"guild2d-status-dizzy");
   assert.equal(computed.reaction,"guild2d-react-core");
   assert.equal(computed.hasAll,3);
   await fixture.screenshot({path:"visual-report/bloco11-status-"+width+".png"});
   await page.emulateMedia({reducedMotion:"reduce"});
   assert.equal(await fixture.locator(".guild2d-reaction-flash").evaluate(el=>getComputedStyle(el).display),"none");
   assert.equal(await fixture.locator(".guild2d-status-loop").first()
     .evaluate(el=>getComputedStyle(el).animationName),"none");
   await page.emulateMedia({reducedMotion:"no-preference"});
   await fixture.evaluate(el=>el.classList.add("guild-lite-mode"));
   assert.equal(await fixture.locator(".guild2d-status-core").first()
     .evaluate(el=>getComputedStyle(el).display),"none");
   const saved=await page.evaluate(()=>localStorage.getItem("cronicas-da-guilda:standalone:v1")||"");
   assert.ok(!saved.includes("guild2d-status-signal")&&!saved.includes("guild2d-reaction-flash"),
    "Animações não podem entrar no save");
   assert.deepEqual(errors,[],"Erros no navegador");
   console.log("BLOCO_11C_BROWSER_OK",JSON.stringify({
    width,realEvents:real.length,...computed,accessible:true,lightMode:true,saveSafe:true
   }));
  }finally{await page.close();}
 }
}finally{await browser.close();}
