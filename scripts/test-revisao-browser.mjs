import {chromium} from "playwright";
import fs from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
await fs.mkdir("visual-report",{recursive:true});
async function audit(width,height,label){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 try{
 await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle",timeout:60000});
 await page.getByRole("button",{name:"Guilda",exact:true}).last().click();
 if(await page.locator(".arena-demo-entry").count())throw Error("Bloco azul continua na Guilda");
 if(await page.locator(".guild-building-card").count()!==6)throw Error("Seis instalações antigas deveriam ser exibidas, sem Armazém");
 if(await page.getByText("Armazém",{exact:true}).count())throw Error("Armazém criado por engano ainda aparece");
 await page.getByRole("button",{name:"Baú",exact:true}).last().click();
 const capacity=await page.locator(".inventory-capacity-note").innerText();
 if(!/Forja Nv\. 0/.test(capacity)||!/30 espaços livres/.test(capacity))throw Error("Baú não depende da Forja: "+capacity);
 await page.getByRole("button",{name:"Taverna",exact:true}).last().click();
 const positions=await page.evaluate(()=>{
  const a=document.querySelector(".tavern-market")?.getBoundingClientRect(),b=document.querySelector(".tavern-side")?.getBoundingClientRect();
  return {market:a?.x||0,rumors:b?.x||0,w:a?.width||0};
 });
 if(positions.market>=positions.rumors)throw Error("Mercado não está à esquerda");
 await page.getByRole("button",{name:"Missões",exact:true}).last().click();
 const mission=page.locator(".mission-card .action-button:not([disabled])").first();
 await mission.click();
 let send=page.locator(".send-row .action-button").first();
 if(!(await send.isEnabled())){
  const specialist=page.getByRole("button",{name:"Montar especialista"});
  if(await specialist.count())await specialist.click();
 }
 if(!(await send.isEnabled()))throw Error("Não foi possível selecionar os quatro heróis");
 await send.click();
 await page.locator(".guild2d-stage").waitFor();
 const spriteAudit=await page.locator(".guild2d-hero").evaluateAll(nodes=>nodes.map(node=>{
   const i=node.querySelector("img"),r=node.getBoundingClientRect(),style=getComputedStyle(i);
   let alpha=0,opaque=0,failed="";
   try{
     const c=document.createElement("canvas");c.width=128;c.height=128;
     const x=c.getContext("2d");x.drawImage(i,0,0,128,128);
     const d=x.getImageData(0,0,128,128).data;
     for(let p=3;p<d.length;p+=4){if(d[p]>20)alpha++;if(d[p]>190)opaque++;}
   }catch(e){failed=String(e);}
   return {name:node.getAttribute("aria-label"),src:i.getAttribute("src"),loaded:i.complete&&i.naturalWidth>0,
     rect:{x:r.x,y:r.y,w:r.width,h:r.height},display:style.display,opacity:style.opacity,alphaFraction:alpha/16384,opaqueFraction:opaque/16384,failed};
 }));
 if(spriteAudit.length!==4)throw Error("ERRO GRAVE: há "+spriteAudit.length+" heróis, não quatro. "+JSON.stringify(spriteAudit));
 if(new Set(spriteAudit.map(x=>x.name)).size!==4)throw Error("Heróis duplicados.");
 if(spriteAudit.some(x=>!x.loaded))throw Error("Sprite não carregada: "+JSON.stringify(spriteAudit));
 if(spriteAudit.some(x=>x.opaqueFraction<.05))throw Error("Sprite com menos de 5% de área visível: "+JSON.stringify(spriteAudit));
 const paths=new Set(spriteAudit.map(x=>x.src));
 if(paths.size!==4)throw Error("Quatro heróis precisam de quatro figuras distintas: "+JSON.stringify(spriteAudit));
 await page.locator(".guild2d-stage").screenshot({path:"visual-report/revisao-4-herois-"+label+".png",type:"png"});
 await page.getByRole("button",{name:"Guilda",exact:true}).last().click().catch(()=>{});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 if(overflow>4)throw Error("Overflow horizontal "+overflow);
 if(errors.length)throw Error("Erros JavaScript "+errors.join(" | "));
 console.log("REVISAO_4_HEROIS_VISUAIS_OK",label,JSON.stringify(spriteAudit));
 }finally{await page.close();}
}
try{await audit(1440,900,"desktop");await audit(390,844,"mobile");}finally{await browser.close();}
