import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,writeFile} from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],
 ...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
await mkdir("visual-report",{recursive:true});
const report=[];
try{
 for(const [width,height] of [[320,750],[390,844],[1440,900]]){
  const mobile=width<600;
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
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
   assert.ok(await send.isEnabled(),"Equipe inicial não montada");
   await send.click();
   const stage=page.locator('.guild2d-stage[data-cinematic="real-2d"]');
   await stage.waitFor({state:"visible",timeout:16000});
   await page.waitForFunction(()=>[...document.querySelectorAll(".guild2d-unit img")].every(i=>i.complete&&i.naturalWidth>0),
    null,{timeout:20000});
   const selected=page.locator(".guild2d-quality-control");
   await selected.waitFor({state:"visible"});
   const auto=await stage.getAttribute("data-quality");
   const units=await stage.locator(".guild2d-unit").count();
   assert.ok(["full","balanced","economy","static"].includes(auto));
   assert.ok(units>=2&&units<=8);
   const noFPSClaim={notes:"Emulação Chromium, não um telefone Android físico"};
   const initial=await stage.evaluate(el=>({
    scene:getComputedStyle(el.querySelector(".guild2d-scene")).backgroundImage,
    ids:[...el.querySelectorAll(".guild2d-unit")].map(n=>n.dataset.fighterId)
   }));
   assert.ok(initial.scene.includes("arena-aprovada.webp"));
   assert.equal(new Set(initial.ids).size,initial.ids.length);
   // Alternância manual preserva campanha e imagens, não reinicia batalha.
   await selected.click();assert.equal(await stage.getAttribute("data-quality"),"full");
   const fullCounts=await stage.evaluate(el=>({
    rig:el.querySelectorAll(".guild2d-body-rig").length,
    statuses:el.querySelectorAll(".guild2d-status-signal").length,
    shadows:[...el.querySelectorAll(".guild2d-move-shadow")].filter(x=>getComputedStyle(x).display!=="none").length
   }));
   await stage.scrollIntoViewIfNeeded();
   await stage.screenshot({path:"visual-report/bloco15-completo-"+width+".png"});
   await selected.click();assert.equal(await stage.getAttribute("data-quality"),"balanced");
   await selected.click();assert.equal(await stage.getAttribute("data-quality"),"economy");
   const ecoCounts=await stage.evaluate(el=>({
    rig:el.querySelectorAll(".guild2d-body-rig").length,
    statuses:el.querySelectorAll(".guild2d-status-signal").length,
    shadows:[...el.querySelectorAll(".guild2d-move-shadow")].filter(x=>getComputedStyle(x).display!=="none").length,
    spriteAnimations:[...el.querySelectorAll(".guild2d-sprite")].filter(x=>getComputedStyle(x).animationName!=="none").length,
    budget:Number(el.dataset.particleBudget)
   }));
   assert.equal(ecoCounts.rig,0,"Recortes duplicados não devem ser montados no perfil econômico");
   assert.equal(ecoCounts.shadows,0,"Sombra de movimento inativa no econômico");
   assert.equal(ecoCounts.spriteAnimations,0,"Idle contínuo inativo no econômico");
   assert.ok(ecoCounts.budget<=3);
   assert.ok(fullCounts.rig>=ecoCounts.rig);
   await stage.screenshot({path:"visual-report/bloco15-economico-"+width+".png"});
   // Teste visual separado com 8 unidades, sem alterar o motor da campanha:
   // contabiliza CSS animado na apresentação e amostra frame pacing do Chromium.
   await page.evaluate(()=>{
    const fixture=document.createElement("div");fixture.id="guild15-stress";
    fixture.className="guild2d-stage";
    fixture.dataset.quality="full";
    fixture.style.cssText="width:min(96vw,720px);height:500px;min-height:500px;position:relative;margin:20px auto;overflow:hidden;container-type:size;background:linear-gradient(#18314b,#081624)";
    for(let i=0;i<8;i++){
     const u=document.createElement("span");u.className="guild2d-unit "+(i<4?"guild2d-hero":"guild2d-enemy");
     u.dataset.dead="false";u.style.cssText="--x:"+(i<4?14+i%2*20:63+i%2*20)+"%;--y:"+(22+i%4*20)+"%;width:100px!important;height:140px!important";
     const sprite=document.createElement("span");sprite.className="guild2d-sprite";
     const img=document.createElement("img");img.src="/enemies/full/wolf.png";img.alt="";
     sprite.append(img);u.append(sprite);fixture.append(u);
    }
    document.body.append(fixture);
   });
   const fixture=page.locator("#guild15-stress");
   const stressFull=await fixture.evaluate(el=>[...el.querySelectorAll(".guild2d-sprite")].filter(x=>getComputedStyle(x).animationName!=="none").length);
   assert.equal(stressFull,8,"Ensaio de oito personagens não animou na qualidade total");
   await fixture.evaluate(el=>el.dataset.quality="economy");
   const stressEco=await fixture.evaluate(el=>[...el.querySelectorAll(".guild2d-sprite")].filter(x=>getComputedStyle(x).animationName!=="none").length);
   assert.equal(stressEco,0,"Oito sprites deveriam suspender idle no modo econômico");
   const frames=await page.evaluate(()=>new Promise(resolve=>{
    const sample=[];let before=0;
    const tick=(t)=>{
     if(before)sample.push(t-before);before=t;
     if(sample.length>=90){
      sample.sort((a,b)=>a-b);
      resolve({samples:sample.length,medianMs:Number(sample[Math.floor(sample.length*.50)].toFixed(2)),
       p95Ms:Number(sample[Math.floor(sample.length*.95)].toFixed(2))});
     }else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
   }));
   assert.equal(frames.samples,90);
   assert.ok(frames.medianMs>0&&Number.isFinite(frames.p95Ms));
   await fixture.screenshot({path:"visual-report/bloco15-8personagens-"+width+".png"});
   await fixture.evaluate(el=>el.remove());
   // O modo automático é reversível, sem persistir o ajuste no save.
   await selected.click();assert.equal(await selected.getAttribute("data-quality-control"),"auto");
   const store=await page.evaluate(()=>localStorage.getItem("cronicas-da-guilda:standalone:v1")||"");
   assert.ok(!store.includes("combat-visual-budget")&&!store.includes("qualityOverride")&&!store.includes("guild15-stress"));
   const last=await stage.evaluate(el=>[...el.querySelectorAll(".guild2d-unit")].map(x=>x.dataset.fighterId));
   assert.deepEqual(last,initial.ids,"Otimização não modifica a formação");
   await page.emulateMedia({reducedMotion:"reduce"});
   await page.waitForFunction(()=>document.querySelector('.guild2d-stage[data-cinematic="real-2d"]')?.dataset.quality==="static");
   assert.equal(await stage.getAttribute("data-quality"),"static","Preferência de acessibilidade obrigatória");
   await page.emulateMedia({reducedMotion:"no-preference"});
   await page.waitForFunction(()=>document.querySelector('.guild2d-stage[data-cinematic="real-2d"]')?.dataset.quality!=="static");
   assert.deepEqual(errors,[],"Erros de navegador");
   const entry={width,height,auto,units,fullCounts,ecoCounts,stress:{units:8,fullAnimations:stressFull,ecoAnimations:stressEco},chromiumFramePacing:frames,...noFPSClaim};
   report.push(entry);
   console.log("BLOCO_15C_BROWSER_OK",JSON.stringify(entry));
  }finally{await page.close();}
 }
}finally{await browser.close();}
await writeFile("visual-report/bloco15-medidas-chromium.json",JSON.stringify({test:"BLOCO 15, emulação de viewport Chromium, não FPS de Android real",report},null,2));
