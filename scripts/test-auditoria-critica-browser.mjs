import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
try{
 for(const [width,height] of [[320,760],[390,844],[1024,768]]){
  const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];p.on("pageerror",e=>errors.push(e.message));
  try{
   await p.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
   const count=await p.evaluate(()=>{
     const key="cronicas-da-guilda:standalone:v1",v=JSON.parse(localStorage.getItem(key));
     v.state.event=null;v.state.gold=1000;
     v.state.heroes.forEach(h=>{h.energy=24;h.injuredUntil=0;});
     delete v.state.dailyActions.restDay;
     v.revision++;localStorage.setItem(key,JSON.stringify(v));
     return v.state.heroes.length;
   });
   await p.reload({waitUntil:"networkidle"});
   await p.getByRole("button",{name:"Descanso",exact:true}).click();
   const list=p.locator(".recovery-list article");
   await list.first().waitFor();
   if(await list.count()!==count)throw Error("Mostra "+await list.count()+" em vez de "+count+" heróis que precisam recuperar");
   if(await p.locator(".recovery-list article .action-button").first().isEnabled())throw Error("Treino disponível a 24% de energia");
   const rest=p.locator(".rest-all");
   if(!await rest.isEnabled())throw Error("Descanso da sede indevidamente bloqueado");
   await rest.click();
   const current=await p.evaluate(()=>JSON.parse(localStorage.getItem("cronicas-da-guilda:standalone:v1")).state);
   if(current.gold!==992)throw Error("Descanso não custou 8 ouro");
   if(current.heroes.some(h=>h.energy!==64))throw Error("Descanso não restaurou 40 de energia");
   if(await rest.isEnabled())throw Error("Descanso diário ainda habilitado após uso");
   await p.getByRole("button",{name:"Taverna",exact:true}).last().click();
   if(await p.getByRole("button",{name:"Descanso realizado"}).isEnabled())throw Error("Taverna permitiu segundo descanso");
   const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   if(overflow>5)throw Error(width+"px overflow: "+overflow);
   if(errors.length)throw Error(errors.join(" | "));
   console.log("AUDITORIA UI OK "+width+"px: lista "+count+" heróis, treino, custo e bloqueio de descanso.");
  }finally{await p.close();}
 }
}finally{await browser.close();}
