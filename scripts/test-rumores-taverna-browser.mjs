import {chromium} from "playwright";
const b=await chromium.launch({headless:true,args:["--no-sandbox"],...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
try{
 for(const width of [320,390,1024]){
  const p=await b.newPage({viewport:{width,height:800}});
  try{
   const errors=[];p.on("pageerror",e=>errors.push(e.message));
   await p.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
   await p.getByRole("button",{name:"Taverna",exact:true}).last().click();
   await p.getByText("Informações da Taverna",{exact:true}).waitFor();
   const gold=await p.evaluate(()=>JSON.parse(localStorage.getItem("cronicas-da-guilda:standalone:v1")).state.gold);
   const buttons=p.getByRole("button",{name:"Investigar gratuitamente"});
   if(await buttons.count()!==3)throw Error("Não há três pistas investigáveis");
   await buttons.first().click();
   const ready=p.getByRole("button",{name:"Rumor preparado · bônus ativo"});
   await ready.waitFor({timeout:10000});
   if(await buttons.count()!==0)throw Error("Rumor pode ser investigado mais de uma vez no dia");
   const after=await p.evaluate(()=>JSON.parse(localStorage.getItem("cronicas-da-guilda:standalone:v1")).state);
   if(gold!==after.gold)throw Error("Taverna debitou ouro para pesquisar rumor");
   if(!after.tavernRumor||after.tavernRumor.used!==false)throw Error("Rumor não persistiu");
   await p.locator(".tavern-rumor-link").first().click();
   await p.getByText("Rumor investigado ·",{exact:false}).waitFor();
   const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   if(overflow>5)throw Error("Rolagem horizontal indevida em "+width+": "+overflow);
   if(errors.length)throw Error(errors.join(" / "));
   console.log("RUMORES UI "+width+"px OK: investigação gratuita, feedback, missão conectada e sem overflow.");
  }finally{await p.close();}
 }
}finally{await b.close();}
