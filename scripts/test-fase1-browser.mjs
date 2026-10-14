import { chromium } from "playwright";
import fs from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
await fs.mkdir("visual-report",{recursive:true});
const issues=[];
const base="http://127.0.0.1:4173";
async function check(width,height,label){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 page.on("pageerror",e=>issues.push(label+" "+e.message));
 try{
  await page.goto(base,{waitUntil:"networkidle",timeout:60000});
  await page.getByRole("button",{name:"Guilda",exact:true}).last().click();
  if(await page.locator(".arena-demo-entry").count())throw Error(label+": destaque azul continua na Guilda");
  const council=page.locator(".council-actions button:not([disabled])").first();
  if(await council.count())await council.click();
  await page.getByRole("button",{name:"Taverna",exact:true}).last().click();
  await page.locator(".tavern-lower .tavern-market").waitFor();
  const bounds=await page.evaluate(()=>{
   const a=document.querySelector(".tavern-market").getBoundingClientRect();
   const b=document.querySelector(".tavern-side").getBoundingClientRect();
   const market=document.querySelector(".tavern-market .catalog-shop").getBoundingClientRect();
   const rumor=document.querySelector(".tavern-side .rumors").getBoundingClientRect();
   const first=document.querySelector(".tavern-market .catalog-shop>div");
   const description=first?.querySelector("span:not(.item-art)")?.getBoundingClientRect();
   const button=first?.querySelector("button")?.getBoundingClientRect();
   return {marketLeft:a.left,rumorsLeft:b.left,marketW:a.width,rumorsW:b.width,
    catalogW:market.width,rumorW:rumor.width,
    hasOverlap:!!(description&&button&&Math.min(description.right,button.right)-Math.max(description.left,button.left)>5
      &&Math.min(description.bottom,button.bottom)-Math.max(description.top,button.top)>4),
    horizontalOverflow:document.documentElement.scrollWidth-innerWidth};
  });
  if(bounds.marketLeft>=bounds.rumorsLeft)throw Error(label+": Mercado não ficou à esquerda: "+JSON.stringify(bounds));
  if(bounds.marketW<=bounds.rumorsW)throw Error(label+": Mercado não ganhou espaço: "+JSON.stringify(bounds));
  if(bounds.hasOverlap)throw Error(label+": botão cobriu informação do item: "+JSON.stringify(bounds));
  if(bounds.horizontalOverflow>3)throw Error(label+": barra horizontal indevida na Taverna: "+JSON.stringify(bounds));
  await page.locator(".tavern-lower").screenshot({path:"visual-report/fase1-taverna-"+label+".jpg",type:"jpeg",quality:77});
  await page.getByRole("button",{name:"Missões",exact:true}).last().click();
  const mission=page.locator(".mission-card .action-button:not([disabled])").first();
  await mission.waitFor({state:"visible"});
  await mission.click();
  const names=await page.locator(".formation-list .formation-row strong").allTextContents();
  let send=page.locator(".send-row .action-button").first();
  if(!(await send.isEnabled())){
    const specialist=page.getByRole("button",{name:"Montar especialista",exact:true});
    if(await specialist.count())await specialist.click();
  }
  if(!(await send.isEnabled()))throw Error(label+": não foi possível iniciar a missão");
  await send.click();
  await page.locator(".guild2d-stage").waitFor();
  const party=await page.locator(".guild2d-hero").evaluateAll(nodes=>nodes.map(x=>x.getAttribute("aria-label")?.split(" — ")[0]));
  if(party.length>4||party.length<2)throw Error(label+": número de heróis inválido "+party.length);
  if(new Set(party).size!==party.length)throw Error(label+": boneco duplicado no combate");
  if(names.length&&party.some(name=>!names.includes(name)))throw Error(label+": herói extra não enviado: "+JSON.stringify({names,party}));
  const heroImages=await page.locator(".guild2d-hero img").evaluateAll(nodes=>nodes.map(x=>({src:x.getAttribute("src"),loaded:x.complete&&x.naturalWidth>0})));
  if(heroImages.some(x=>!x.loaded))throw Error(label+": sprite não carregou: "+JSON.stringify(heroImages));
  if(heroImages.filter(x=>x.src?.includes("sprite-thorgar.webp")).length>1)throw Error(label+": dwarf art renderizada mais de uma vez");
  if(heroImages.some(x=>!x.src?.includes("/battle/sprite-")))throw Error(label+": retrato substituiu boneco");
  const hud=await page.locator(".guild2d-hud-hero").count();
  if(hud!==party.length)throw Error(label+": número de etiquetas diferente dos heróis");
  const stageOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  if(stageOverflow>3)throw Error(label+": overflow na batalha: "+stageOverflow);
  await page.locator(".guild2d-stage").screenshot({path:"visual-report/fase1-batalha-"+label+".jpg",type:"jpeg",quality:77});
  console.log("FASE1_BROWSER_OK "+label+" "+JSON.stringify({bounds,party,heroImages}));
 }finally{await page.close();}
}
try{
 await check(1440,900,"desktop");
 await check(390,844,"mobile");
 if(issues.length)throw Error("Erros JavaScript: "+issues.join(" | "));
 console.log("FASE_1_BROWSER_PASSOU");
}finally{await browser.close();}
