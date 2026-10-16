import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
try{
 for(const [width,height] of [[320,760],[390,844],[1024,768]]){
  const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];p.on("pageerror",e=>errors.push(e.message));
  try{
   await p.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
   await p.getByRole("button",{name:"Guilda",exact:true}).last().click();
   await p.locator(".guild-strategy").waitFor();
   if(await p.locator(".guild-building-next").count()!==6)throw Error("Prévias de construção incompletas");
   if(await p.locator(".world-list button").count()!==12)throw Error("Mapa não mostra as 12 regiões");
   if(!await p.locator(".world-summary").isVisible())throw Error("Progresso regional oculto");
   const guildOverflow=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   if(guildOverflow>5)throw Error(width+"px overflow Guilda "+guildOverflow);
   await p.evaluate(()=>{
     const k="cronicas-da-guilda:standalone:v1";
     const raw=localStorage.getItem(k);
     if(!raw)throw Error("Sem save inicial");
     const save=JSON.parse(raw);
     save.state.chest=Array.from({length:67},(_,i)=>({id:"item-"+(i+500),key:"CG-001"}));
     save.state.itemSequence=600;
     save.revision++;
     localStorage.setItem(k,JSON.stringify(save));
   });
   await p.reload({waitUntil:"networkidle"});
   await p.getByRole("button",{name:"Baú",exact:true}).last().click();
   await p.locator(".inventory-pagination").waitFor();
   if(await p.locator(".item-grid .item-tile").count()!==32)throw Error("Inventário página 1 não tem 32 itens");
   await p.locator(".inventory-pagination button").last().click();
   if(await p.locator(".item-grid .item-tile").count()!==32)throw Error("Inventário página 2 não tem 32 itens");
   await p.locator(".inventory-pagination button").last().click();
   if(await p.locator(".item-grid .item-tile").count()!==3)throw Error("Últimos 3 itens não aparecem");
   const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   if(overflow>5)throw Error(width+"px overflow Baú "+overflow);
   if(errors.length)throw Error(errors.join(" | "));
   console.log("FASES 4–9 UI OK "+width+"px: prédios, mapa, inventário 67 itens e responsividade.");
  }finally{await p.close();}
 }
 const p=await browser.newPage();
 try{
  await p.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
  await p.evaluate(()=>{
   const k="cronicas-da-guilda:standalone:v1";
   localStorage.setItem(k+":recovery",localStorage.getItem(k)||"");
   localStorage.setItem(k,"{corrompido");
  });
  p.on("dialog",d=>d.accept());
  await p.reload({waitUntil:"networkidle"});
  if(!await p.getByRole("button",{name:"Recuperar campanha anterior"}).isEnabled())throw Error("Falha na recuperação de um save corrompido");
  await p.getByRole("button",{name:"Recuperar campanha anterior"}).click();
  await p.locator(".app-shell").waitFor({state:"visible",timeout:15000});
  console.log("FASE 8 UI OK: recuperação manual sem reiniciar a campanha.");
 }finally{await p.close();}
}finally{await browser.close();}
