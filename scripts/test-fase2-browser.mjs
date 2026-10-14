import { chromium } from "playwright";
import fs from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
await fs.mkdir("visual-report",{recursive:true});
try {
 for(const [width,height,device] of [[1440,900,"desktop"],[390,844,"mobile"]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  const title=page.locator(".campaign-day-strip");
  await title.waitFor({state:"visible"});
  if(!/Temporada 1.*Dia 01\/60/.test(await title.innerText()))throw Error(device+": calendário inicial ausente");
  await page.getByRole("button",{name:"Guilda",exact:true}).last().click();
  const button=page.getByRole("button",{name:/Próximo dia/});
  if(await button.count()!==1)throw Error("Próximo dia não existe");
  if(await button.isEnabled()){
    page.once("dialog",dialog=>dialog.accept());
    await button.click();
  }else{
    const council=page.locator(".council-actions button:not([disabled])").first();
    if(await council.count())await council.click();
    page.once("dialog",dialog=>dialog.accept());
    await button.click();
  }
  await page.waitForTimeout(350);
  if(!/Dia 02\/60/.test(await title.innerText()))throw Error("O botão não avançou um dia");
  await page.locator(".guild-calendar").screenshot({path:"visual-report/fase2-calendar-"+device+".jpg",type:"jpeg",quality:80});
  await page.getByRole("button",{name:"Baú",exact:true}).last().click();
  const cap=await page.locator(".inventory-capacity-note").innerText();
  if(!/30 espaços livres/.test(cap))throw Error("Baú não inicia com 30: "+cap);
  await page.locator(".chest-screen").screenshot({path:"visual-report/fase2-chest-"+device+".jpg",type:"jpeg",quality:80});
  await page.getByRole("button",{name:"Heróis",exact:true}).last().click();
  await page.getByRole("button",{name:/Ver equipamentos · 12 espaços/}).click();
  if(await page.locator(".equipment-slot").count()!==12)throw Error("Faltam slots dos personagens");
  await page.locator(".equipment-slot-grid").screenshot({path:"visual-report/fase2-12slots-"+device+".jpg",type:"jpeg",quality:80});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  if(overflow>3)throw Error(device+": overflow horizontal "+overflow);
  if(errors.length)throw Error("Erros JS "+errors.join(" | "));
  console.log("FASE_2_VISUAL_OK",device,{cap,overflow});
  await page.close();
 }
}finally{await browser.close();}
