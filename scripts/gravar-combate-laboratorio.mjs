import {chromium} from "playwright";
import fs from "node:fs/promises";

const output="visual-report";
await fs.mkdir(output,{recursive:true});
await fs.mkdir(output+"/video-temp",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],
 ...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
const errors=[];
try{
 for(const [width,height] of [[390,844],[1440,900]]){
  const mobile=width<600;
  const context=await browser.newContext({
   viewport:{width,height},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,
   recordVideo:{dir:output+"/video-temp",size:{width,height}}
  });
  const page=await context.newPage();
  page.on("pageerror",e=>errors.push(width+": "+e.message));
  const video=page.video();
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
   if(!(await send.isEnabled()))throw Error("Não foi possível montar equipe do laboratório");
   await send.click();
   const stage=page.locator(".guild2d-stage");
   await stage.waitFor({state:"visible",timeout:15000});
   await page.waitForFunction(()=>[...document.querySelectorAll(".guild2d-unit img")].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:18000});
   await stage.scrollIntoViewIfNeeded();
   await page.waitForTimeout(350);
   await stage.screenshot({path:output+"/lab-inicio-"+width+".png"});
   // Preparar uma habilidade REAL: o vídeo mostrará conjuração quando chegar a vez do herói.
   const firstAbility=page.locator(".guild2d-quickbar .guild2d-quick-slot:not([disabled])").first();
   if(await firstAbility.count()){
    await firstAbility.scrollIntoViewIfNeeded();
    await firstAbility.click();
    await page.waitForTimeout(220);
    await stage.scrollIntoViewIfNeeded();
   }
   for(let i=0;i<9;i++){
    const attack=page.getByRole("button",{name:/^Atacar/}).first();
    if(!(await attack.isVisible())||!(await attack.isEnabled()))break;
    await attack.click();
    await stage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1050);
   }
   const bar=page.locator(".guild2d-quickbar");
   if(await bar.count()){
    await bar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.screenshot({path:output+"/lab-habilidades-"+width+".png"});
    await page.waitForTimeout(450);
   }
   await stage.scrollIntoViewIfNeeded();
   await page.waitForTimeout(800);
  }finally{
   await page.close();
   await context.close();
   if(video){
    const path=await video.path();
    await fs.copyFile(path,output+"/lab-combate-"+width+".webm");
   }
  }
 }
 if(errors.length)throw Error("Navegador: "+errors.join(" | "));
 console.log("LAB_VIDEO_OK: gravações Android 390px e desktop 1440px sem publicação.");
}finally{await browser.close();}
