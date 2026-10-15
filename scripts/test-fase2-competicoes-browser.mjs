import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
try{
 for(const [width,height] of [[320,780],[390,844],[1024,768]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle",timeout:60000});
   await page.getByRole("button",{name:"Liga",exact:true}).last().click();
   await page.locator(".league-fase2-brief").waitFor();
   if(await page.locator(".league-fixture").count()<7)throw Error(width+": calendário vazio");
   if(await page.locator(".cup-stage").count()!==4)throw Error(width+": falta chave da Copa");
   if(!(await page.locator(".league-fase2-brief").innerText()).includes("Escalação"))throw Error(width+": falta preparação");
   await page.getByRole("button",{name:"Preparar equipe"}).click();
   await page.locator(".league-team-save button").waitFor();
   const button=page.locator(".league-team-save button");
   if(!(await button.isEnabled()))throw Error(width+": escalação inicial não pode ser salva");
   await button.click();
   await page.getByRole("button",{name:"Liga",exact:true}).last().click();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   if(overflow>5)throw Error(width+": overflow horizontal "+overflow);
   if(errors.length)throw Error(width+": "+errors.join(" | "));
   console.log("FASE2 MOBILE OK: "+width+"px, calendário, copa, escalação e layout.");
  } finally {await page.close();}
 }
}finally{await browser.close();}
