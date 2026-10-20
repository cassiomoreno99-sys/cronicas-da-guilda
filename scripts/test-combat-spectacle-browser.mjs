import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],
 ...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
await mkdir("visual-report",{recursive:true});
try{
 for(const [width,height] of [[390,844],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:width<600?2:1,
   isMobile:width<600,hasTouch:width<600});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
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
   assert.ok(await send.isEnabled(),"Equipe inicial não pronta");
   await send.click();
   const stage=page.locator('.guild2d-stage[data-cinematic="real-2d"]');
   await stage.waitFor({state:"visible",timeout:15000});
   await page.waitForFunction(()=>[...document.querySelectorAll(".guild2d-unit img")].every(i=>i.complete&&i.naturalWidth>0),
    null,{timeout:20000});
   const original=await stage.evaluate(el=>({
    fighters:[...el.querySelectorAll(".guild2d-unit")].map(e=>e.dataset.fighterId),
    scene:getComputedStyle(el.querySelector(".guild2d-scene")).backgroundImage,
    novelFX:el.querySelectorAll(".guild2d-spectacle").length
   }));
   assert.ok(original.scene.includes("arena-aprovada.webp"));
   assert.ok(original.fighters.length>=2&&original.fighters.length<=8);
   assert.equal(new Set(original.fighters).size,original.fighters.length);
   await stage.scrollIntoViewIfNeeded();
   await stage.screenshot({path:"visual-report/bloco12-arena-original-"+width+".png"});
   // A partida inicial comum não contém grimórios de nível alto ou chefes.
   // Fixture SEPARADA não registra ações nem altera PV, somente testa CSS real.
   await page.evaluate(()=>{
    const display=document.createElement("div");
    display.id="guild12-fixture";
    display.className="guild2d-stage";
    display.style.cssText="position:relative;width:min(92vw,760px);height:490px;min-height:490px;margin:26px auto;background:linear-gradient(#12192a,#273649 70%,#111b29);isolation:isolate;overflow:hidden";
    display.innerHTML='<div class="guild2d-boss-presence" data-pressure="strained" aria-hidden="true" style="width:160px;height:260px;left:65%;top:21%"><i class="guild2d-boss-halo"></i><i class="guild2d-boss-crown"></i></div>'
     +'<div class="guild2d-spectacle" data-kind="supreme" data-school="astral" data-variant="sweep" data-book="IMP-B-MAGE" aria-hidden="true"'
     +' style="--start-x:20%;--start-y:42%;--flight-x:55cqw;--flight-y:15cqh;--cinema-ms:920ms">'
     +'<span class="guild2d-spectacle-origin"><i class="guild2d-spectacle-sigil"></i><i class="guild2d-spectacle-charge"></i></span>'
     +'<span class="guild2d-spectacle-impact"><i class="guild2d-spectacle-sweep"></i><i class="guild2d-spectacle-nova"></i>'
     +'<i class="guild2d-spectacle-shard" style="--n:1;--count:8"></i></span>'
     +'<span class="guild2d-spectacle-area" style="left:72%;top:65%"></span></div>';
    document.body.append(display);
   });
   const fixture=page.locator("#guild12-fixture");
   await fixture.scrollIntoViewIfNeeded();
   const palette=await fixture.locator(".guild2d-spectacle").evaluate(el=>{
    const colors=[];
    for(const school of ["blade","storm","light","shadow","nature","iron","astral","harmony"]){
     el.dataset.school=school;
     colors.push(getComputedStyle(el).getPropertyValue("--glow").trim());
    }
    el.dataset.school="astral";
    return colors;
   });
   assert.ok(new Set(palette).size>=7,"Escolas visualmente indistintas");
   const effects=await fixture.evaluate(el=>({
    sigil:getComputedStyle(el.querySelector(".guild2d-spectacle-sigil")).animationName,
    nova:getComputedStyle(el.querySelector(".guild2d-spectacle-nova")).animationName,
    area:getComputedStyle(el.querySelector(".guild2d-spectacle-area")).animationName,
    boss:getComputedStyle(el.querySelector(".guild2d-boss-halo")).animationName,
    pressure:getComputedStyle(el.querySelector(".guild2d-boss-presence")).getPropertyValue("--boss").trim()
   }));
   assert.equal(effects.sigil,"guild12-sigil");
   assert.equal(effects.nova,"guild12-nova");
   assert.equal(effects.area,"guild12-area");
   assert.equal(effects.boss,"guild12-boss-aura");
   await page.waitForTimeout(220);
   await fixture.screenshot({path:"visual-report/bloco12-supremo-demo-"+width+".png"});
   // Segundo efeito: ataque do chefe, derivado de texto real nos testes unitários.
   await fixture.locator(".guild2d-spectacle").evaluate(el=>{
    el.dataset.kind="boss-wave";el.dataset.school="shadow";el.dataset.variant="sweep";el.dataset.book="";
   });
   await page.waitForTimeout(180);
   await fixture.screenshot({path:"visual-report/bloco12-chefe-demo-"+width+".png"});
   await page.emulateMedia({reducedMotion:"reduce"});
   assert.equal(await fixture.locator(".guild2d-spectacle").evaluate(el=>getComputedStyle(el).display),"none");
   assert.equal(await fixture.locator(".guild2d-boss-halo").evaluate(el=>getComputedStyle(el).animationName),"none");
   await page.emulateMedia({reducedMotion:"no-preference"});
   await fixture.evaluate(el=>el.classList.add("guild-lite-mode"));
   assert.equal(await fixture.locator(".guild2d-boss-halo").evaluate(el=>getComputedStyle(el).animationName),"none");
   const save=await page.evaluate(()=>localStorage.getItem("cronicas-da-guilda:standalone:v1")||"");
   assert.ok(!save.includes("guild2d-spectacle")&&!save.includes("guild12-"),"Elementos gráficos não podem persistir");
   assert.deepEqual(errors,[],"Erros do navegador");
   console.log("BLOCO_12C_BROWSER_OK",JSON.stringify({width,realArenaPreserved:true,fighters:original.fighters.length,
    schools:palette.length,animations:effects,accessible:true,lightMode:true,purePresentation:true,
    specialCastObserved:false,bossFightObserved:false,fixtureClearlyIdentified:true}));
  }finally{await page.close();}
 }
}finally{await browser.close();}
