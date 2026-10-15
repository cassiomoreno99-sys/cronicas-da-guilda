import {chromium} from "playwright";
import fs from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
await fs.mkdir("visual-report",{recursive:true});
try{
 for(const [width,height] of [[320,780],[390,844],[1024,768]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:"reduce"});
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  try{
   await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle",timeout:60000});
   await page.getByRole("button",{name:"Guilda",exact:true}).last().click();
   const council=page.locator(".council-actions button:not([disabled])").first();
   if(await council.count())await council.click();
   await page.getByRole("button",{name:"Missões",exact:true}).last().click();
   const b=page.locator(".mission-daily-budget");await b.waitFor();
   const initial=await b.innerText();
   if(!/0\/3/.test(initial))throw Error(width+": tela não mostra 0/3: "+initial);
   const first=page.locator(".mission-card").first();
   if(!(await first.locator(".action-button").isEnabled()))throw Error(width+": primeira missão bloqueada antes de jogar");
   await b.screenshot({path:"visual-report/fase1-orcamento-"+width+".png"});
   await first.locator(".action-button").click();
   let send=page.locator(".send-row .action-button");
   if(!(await send.isEnabled())){const specialist=page.getByRole("button",{name:"Montar especialista"});if(await specialist.count())await specialist.click();}
   if(!(await send.isEnabled()))throw Error(width+": não foi possível enviar uma expedição.");
   await send.click();
   await page.locator(".guild2d-stage").waitFor({timeout:30000});
   const state=await page.evaluate(()=>{
    const saved=localStorage.getItem("cronicas-da-guilda:standalone:v1");
    return saved?JSON.parse(saved).state:null;
   });
   if(!state)throw Error("Sem save após enviar expedição.");
   if(state.day!==1||state.dailyActions?.missionDay!==1||state.dailyActions?.missionIds?.length!==1)
    throw Error(width+": missão não contabilizada no dia atual: "+JSON.stringify(state.dailyActions));
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   if(overflow>5)throw Error(width+": overflow horizontal de "+overflow+"px");
   if(errs.length)throw Error(width+": falha JS: "+errs.join(" / "));
   console.log("FASE1 VISUAL: "+width+"px — 0/3 em tela, expedição contada 1/3, dia preservado, sem overflow ou JS.");
  }finally{await page.close();}
 }
}finally{await browser.close();}
