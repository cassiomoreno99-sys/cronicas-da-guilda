import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
try{for(const [width,height] of [[320,760],[390,844],[1024,768]]){
 const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});const errors=[];p.on("pageerror",e=>errors.push(e.message));
 try{
  await p.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  await p.getByRole("button",{name:"Guilda",exact:true}).last().click();
  const council=p.locator(".council-actions button:not([disabled])").first();
  if(await council.count())await council.click();
  await p.getByRole("button",{name:"Missões",exact:true}).last().click();
  const mission=p.locator(".mission-card .action-button:not([disabled])").first();
  await mission.waitFor({state:"visible",timeout:15000});
  await mission.click();
  const send=p.locator(".send-row button").first();await send.waitFor();
  if(!await send.isEnabled())await p.getByRole("button",{name:"Montar especialista"}).click();
  if(!await send.isEnabled())throw Error("Não foi possível escalar uma missão.");
  await send.click();await p.locator(".guild2d-shell").waitFor();
  await p.locator(".guild2d-enemy[data-dead='false']").nth(1).click();
  await p.getByRole("button",{name:"Concentrar ataques"}).click();
  await p.locator(".guild2d-hud-enemy em").filter({hasText:"FOCO"}).waitFor();
  await p.getByRole("button",{name:/Habilidades automáticas: Ligadas/}).click();
  await p.getByRole("button",{name:/Habilidades automáticas: Desligadas/}).waitFor();
  await p.getByRole("button",{name:"Liberar foco"}).click();
  if(await p.locator(".guild2d-hud-enemy em").filter({hasText:"FOCO"}).count())throw Error("Foco não liberado");
  const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  if(overflow>5)throw Error(width+"px overflow "+overflow);
  if(errors.length)throw Error(errors.join("|"));
  console.log("FASE3 UI OK "+width+"px: foco, auto habilidades, limpar foco.");
 }finally{await p.close();}
}}finally{await browser.close();}
