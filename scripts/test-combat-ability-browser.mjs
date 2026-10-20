import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],
 ...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
await mkdir("visual-report",{recursive:true});
try{
 for(const [width,height] of [[320,750],[390,844],[1440,900]]){
  const mobile=width<600;
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
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
   assert.ok(await send.isEnabled(),"Equipe não disponível");
   await send.click();
   const stage=page.locator('.guild2d-stage[data-cinematic="real-2d"]');
   await stage.waitFor({state:"visible",timeout:15000});
   await page.waitForFunction(()=>[...document.querySelectorAll(".guild2d-unit img")].every(x=>x.complete&&x.naturalWidth>0),null,{timeout:18000});
   const bar=page.locator(".guild2d-quickbar");
   await bar.waitFor({state:"visible",timeout:10000});
   const slots=bar.locator(".guild2d-quick-slot");
   const slotCount=await slots.count();
   assert.ok(slotCount>=1&&slotCount<=5,"Quantia de habilidades rápida incorreta");
   const quick=await bar.evaluate(el=>{
    const buttons=[...el.querySelectorAll(".guild2d-quick-slot")];
    const shell=el.closest(".guild2d-shell");
    return {slots:buttons.map(b=>({
      id:b.dataset.abilityId,kind:b.dataset.tone,state:b.dataset.state,
      svg:!!b.querySelector(".guild2d-quick-icon svg"),label:b.getAttribute("aria-label"),
      shortcut:b.getAttribute("aria-keyshortcuts"),radial:!!b.querySelector(".guild2d-quick-radial"),
      disabled:b.disabled,
      minTouch:b.getBoundingClientRect().height
     })),
     overflow:el.scrollWidth-el.clientWidth,
     aria:shell?.getAttribute("aria-label")};
   });
   assert.ok(quick.slots.every((s,i)=>s.id&&s.kind&&s.svg&&s.radial&&s.label&&s.shortcut===String(i+1)));
   assert.ok(quick.slots.every(s=>s.minTouch>=44));
   assert.ok(quick.overflow<=2,"Barra rápida ultrapassou largura do celular: "+quick.overflow);
   await bar.scrollIntoViewIfNeeded();
   await bar.screenshot({path:"visual-report/bloco13-barra-"+width+".png"});
   // Primeiro selecionar e examinar detalhes. Seleção não deve enviar ordem.
   const more=bar.locator(".guild2d-quick-more");
   await more.click();
   const panel=page.locator(".guild2d-skills");
   await panel.waitFor({state:"visible",timeout:8000});
   assert.equal(await more.getAttribute("aria-expanded"),"true");
   const cards=panel.locator(".guild2d-skill-card");
   assert.ok(await cards.count()>=slotCount);
   const inspectIndex=Math.min(1,(await cards.count())-1);
   const toInspect=cards.nth(inspectIndex);
   const selectedId=await toInspect.getAttribute("data-ability-id");
   await toInspect.click();
   const inspector=panel.locator(".guild2d-skill-inspector");
   assert.equal(await inspector.getAttribute("data-ability-id"),selectedId);
   assert.equal(await toInspect.getAttribute("aria-pressed"),"true");
   assert.equal(await bar.locator(".guild2d-quick-pending").count(),0,"Visualizar habilidade não pode preparar ordem");
   const inspectInfo=await inspector.evaluate(el=>({
     desc:(el.querySelector("p")?.textContent||"").trim(),
     target:(el.querySelector(".guild2d-skill-inspector-info")?.textContent||"").trim(),
     icon:!!el.querySelector("svg")
   }));
   assert.ok(inspectInfo.desc.length>=5&&inspectInfo.target.includes("Alvo:")&&inspectInfo.icon);
   const ready=cards.locator('[data-state="ready"]');
   // Selecionar cartão PRONTO com query na coleção, sem alterar código do motor.
   const readyCard=panel.locator('.guild2d-skill-card[data-state="ready"]').first();
   assert.ok(await readyCard.count(),"Não há habilidade pronta na missão inicial");
   const readyId=await readyCard.getAttribute("data-ability-id");
   await readyCard.click();
   const confirm=panel.locator(".guild2d-skill-confirm");
   assert.ok(await confirm.isEnabled(),"Botão deve habilitar poder pronto");
   await panel.screenshot({path:"visual-report/bloco13-grimorio-"+width+".png"});
   await confirm.click();
   await bar.locator(".guild2d-quick-pending").waitFor({state:"visible",timeout:8000});
   assert.equal(await panel.count(),0,"Após preparar a ordem, painel deve fechar");
   assert.ok(await bar.locator('.guild2d-quick-slot[data-ability-id="'+readyId+'"]').isDisabled(),
    "Ordem preparada bloqueia múltiplos envios");
   await more.click();
   await panel.waitFor({state:"visible"});
   const cancel=panel.locator(".guild2d-cancel-order");
   assert.ok(await cancel.count(),"Cancelar ordem deve permanecer disponível");
   await cancel.click();
   await bar.locator(".guild2d-quick-pending").waitFor({state:"hidden",timeout:8000});
   await more.click();
   // Atalho de teclado usa a mesma função de comando do botão; o foco fica dentro da arena.
   if(!mobile){
     await bar.locator(".guild2d-quick-more").focus();
     await page.keyboard.press("1");
     await bar.locator(".guild2d-quick-pending").waitFor({state:"visible",timeout:8000});
   }
   const storage=await page.evaluate(()=>localStorage.getItem("cronicas-da-guilda:standalone:v1")||"");
   assert.ok(!storage.includes("cooldown-percent")&&!storage.includes("guild2d-skill-inspector"),"Visual não é dado persistente");
   assert.deepEqual(errors,[],"Erros JS no navegador: "+errors.join(" | "));
   console.log("BLOCO_13C_BROWSER_OK",JSON.stringify({
    width,slots:slotCount,allSVGIcons:true,hotkey:mobile?"mobile-sem-teclado":true,
    selectionAndInspect:true,queueAndCancel:true,originalArena:true,
    noHorizontalOverflow:true,saveVisualFree:true
   }));
  }finally{await page.close();}
 }
}finally{await browser.close();}
