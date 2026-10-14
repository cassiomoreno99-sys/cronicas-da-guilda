import { chromium } from "playwright";
import fs from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const base="http://127.0.0.1:4173";
const issues=[];
await fs.mkdir("visual-report",{recursive:true});

async function probe(width,height,name){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 page.on("pageerror",e=>issues.push(name+": "+e.message));
 page.on("console",m=>{if(m.type()==="error")issues.push(name+": "+m.text());});
 try{
  await page.goto(base,{waitUntil:"networkidle",timeout:60000});
  // O início normal da campanha apresenta um conselho pendente que bloqueia
  // o envio de missões. Resolver pela interface, sem manipular o save.
  await page.getByRole("button",{name:"Guilda",exact:true}).last().click();
  const decision=page.locator(".council-actions button:not([disabled])").first();
  if(await decision.count())await decision.click();
  await page.getByRole("button",{name:"Missões",exact:true}).last().click();
  const mission=page.locator(".mission-card .action-button:not([disabled])").first();
  await mission.waitFor({state:"visible",timeout:15000});
  await mission.click();
  let send=page.locator(".send-row .action-button").first();
  await send.waitFor({state:"visible"});
  if(!(await send.isEnabled())){
   const specialist=page.getByRole("button",{name:"Montar especialista",exact:true});
   if(await specialist.count())await specialist.click();
  }
  if(!(await send.isEnabled()))throw Error(name+": 'Enviar' permanece desabilitado");
  await send.click();
  await page.locator(".guild2d-stage").waitFor({state:"visible",timeout:15000});
  if(await page.locator(".battle-stage,.cinema-screen").count())throw Error("Interface antiga ainda visível");
  if(await page.getByRole("button",{name:/Tela clássica|Abrir Arena Cinematográfica|Abrir Arena 2D/i}).count())throw Error("Alternativa antiga ainda disponível");
  if(await page.locator(".guild2d-unit").count()<5)throw Error("Combate não mostrou heróis e inimigos reais");
  const background=await page.locator(".guild2d-scene").evaluate(e=>getComputedStyle(e).backgroundImage);
  if(!background.includes("/battle/arena-aprovada.webp"))throw Error("Imagem aprovada ausente");
  const images=await page.locator(".guild2d-unit img").evaluateAll(nodes=>nodes.map(n=>({name:n.closest(".guild2d-unit")?.getAttribute("aria-label"),src:n.getAttribute("src"),ok:n.complete&&n.naturalWidth>0})));
  if(images.some(i=>!i.ok))throw Error("Imagens com erro: "+JSON.stringify(images));
  if(images.some(i=>!i.src?.includes("/battle/sprite-")))throw Error("Algum personagem continua com retrato em vez de boneco 2D: "+JSON.stringify(images));
  if(await page.locator(".guild2d-hud").count()!==await page.locator(".guild2d-unit").count())throw Error("HUD separado por personagem falhou");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  if(overflow>3)throw Error(name+": overflow horizontal "+overflow);
  const prev=await page.locator(".guild2d-log").innerText();
  const attack=page.getByRole("button",{name:/^Atacar/}).first();
  if(await attack.isEnabled())await attack.click();
  await page.waitForTimeout(1400);
  const next=await page.locator(".guild2d-log").innerText();
  if(prev===next && await attack.isEnabled())throw Error("Ação do motor não atualizou o registro");
  await page.locator(".guild2d-stage").screenshot({path:"visual-report/single-battle-"+name+".jpg",type:"jpeg",quality:79});
  const data={screen:name,units:images.length,sprites:images.filter(i=>i.src?.includes("/battle/sprite-")).length,
    oldModes:0,overflow,bg:"approved",attackAttempted:true};
  console.log("ARENA_2D_OK",JSON.stringify(data));
 }finally{await page.close();}
}
try{
 await probe(1440,900,"desktop");
 await probe(390,844,"mobile");
 if(issues.length)throw Error("Browser JS errors: "+issues.join(" | "));
 console.log("TESTE_UNICA_ARENA_2D_PASSOU");
}finally{await browser.close();}
