import {chromium} from "playwright";
import fs from "node:fs/promises";

const base="http://127.0.0.1:5173";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
await fs.mkdir("visual-report",{recursive:true});
const views=[[360,780],[390,844],[412,915],[768,1024],[1440,900]];
try{
 for(const [width,height] of views){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:width<500?2:1,isMobile:width<500,hasTouch:width<500});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto(base,{waitUntil:"networkidle",timeout:60000});
   await page.getByRole("button",{name:"Guilda",exact:true}).last().click();
   const cards=page.locator(".building-list article.guild-building-card");
   if(await cards.count()!==6)throw Error("As seis instalações precisam manter as artes originais.");
   // Imagens abaixo da dobra são carregadas sob demanda no Android.
   // Percorrer os seis cartões reproduz a rolagem real do jogador.
   for(let i=0;i<6;i++){
    await cards.nth(i).scrollIntoViewIfNeeded();
    await page.waitForFunction(index=>{
      const image=document.querySelectorAll(".building-list article.guild-building-card img.guild-room-art.compact")[index];
      return image?.complete&&image.naturalWidth>100;
    },i,{timeout:12000});
   }
   const sizes=await cards.evaluateAll(elements=>elements.map(card=>{
    const image=card.querySelector("img.guild-room-art.compact");
    const cr=card.getBoundingClientRect(),ir=image?.getBoundingClientRect();
    return {card:cr.width,img:ir?.width||0,height:ir?.height||0,
      visible:!!image&&getComputedStyle(image).display!=="none",
      loaded:!!image?.complete&&image.naturalWidth>100,
      aspect:ir?.width/(ir?.height||1)};
   }));
   if(sizes.some(x=>!x.loaded||!x.visible))throw Error("Arte de instalação não carregada: "+JSON.stringify(sizes));
   if(sizes.some(x=>x.img/x.card<(width<=760?.83:.36)||Math.abs(x.aspect-16/9)>.14))
    throw Error("Arte da Guilda ainda pequena ou distorcida em "+width+"px: "+JSON.stringify(sizes));
   if(width<=412&&sizes.some(x=>x.height<145))
    throw Error("Imagem de prédio não tem altura de destaque no Android "+width+"px.");
   await page.locator(".building-list article.guild-building-card").first().screenshot({
    path:"visual-report/arte-guilda-"+width+".png"
   });
   // Campanha nova exige resolver a decisão do Conselho antes de enviar heróis.
   const council=page.locator(".council-actions button:not([disabled])").first();
   if(await council.count())await council.click();
   await page.getByRole("button",{name:"Missões",exact:true}).last().click();
   await page.locator(".mission-card .action-button:not([disabled])").first().click();
   const send=page.locator(".send-row .action-button").first();
   if(!(await send.isEnabled())){
    const specialist=page.getByRole("button",{name:"Montar especialista"});
    if(await specialist.count())await specialist.click();
   }
   if(!(await send.isEnabled()))throw Error("A formação inicial não está pronta.");
   await send.click();
   await page.locator(".guild2d-stage[data-cinematic='real-2d']").waitFor({state:"visible",timeout:15000});
   await page.waitForFunction(()=>[...document.querySelectorAll(".guild2d-unit img")].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:15000});
   const baseNodes=await page.evaluate(()=>{
    globalThis.__epicSprites=new Map([...document.querySelectorAll(".guild2d-unit")].map(u=>[u.dataset.fighterId,u.querySelector(".guild2d-sprite img")]));
    return [...document.querySelectorAll(".guild2d-unit")].map(u=>u.dataset.fighterId);
   });
   if(baseNodes.length<6)throw Error("Combatentes ausentes da arena "+baseNodes.length);
   let animated=false,motion=false,visual="";
   for(let t=0;t<12;t++){
    const attack=page.getByRole("button",{name:/^Atacar/}).first();
    if(!(await attack.isEnabled()))break;
    await attack.click();
    await page.waitForTimeout(75);
    const result=await page.evaluate(()=>{
     const nodes=[...document.querySelectorAll(".guild2d-unit")];
     return {hasFx:!!document.querySelector(".guild2d-cinema"),hasProjectile:!!document.querySelector(".guild2d-projectile"),
       // "Respirar" parado não conta. Exigir trajetória do Web Animations API.
       spriteMove:nodes.some(u=>[...u.querySelector(".guild2d-sprite")?.getAnimations()||[]].some(a=>a.playState==="running"&&
          a.effect?.getKeyframes?.().some(frame=>/translate\\((-?\\d+)(?:\\.\\d+)?px,/.test(String(frame.transform||""))))),
       targeted:nodes.some(u=>u.querySelector(".guild2d-sprite")?.getAnimations().some(a=>
          a.effect?.getKeyframes?.().some(frame=>String(frame.transform||"").includes("rotate(")))),
       kept:nodes.every(u=>globalThis.__epicSprites.get(u.dataset.fighterId)===u.querySelector(".guild2d-sprite img")),
       school:document.querySelector(".guild2d-cinema")?.getAttribute("data-school")||"",
       fxDisplay:document.querySelector(".guild2d-impact-mark")?getComputedStyle(document.querySelector(".guild2d-impact-mark")).display:"none"};
    });
    if(!result.kept)throw Error("Os sprites foram recarregados durante o combate, causando piscadas.");
    animated ||=result.hasFx&&result.fxDisplay!=="none";
    motion ||=result.spriteMove;
    visual ||=result.school;
    if(animated&&motion)break;
   }
   if(!animated||!motion)throw Error("Combate sem movimento real ou impacto: "+JSON.stringify({animated,motion,visual}));
   const angle=await page.locator(".guild2d-cinema").evaluate(el=>el.style.getPropertyValue("--shot-angle"));
   if(!angle.includes("deg")||Number.isNaN(parseFloat(angle)))
     throw Error("Projétil sem direção baseada na posição real dos combatentes.");
   if(errors.length)throw Error("Erro de navegador: "+errors.join(" | "));
   await page.locator(".guild2d-stage").screenshot({path:"visual-report/combate-epico-"+width+".png"});
   console.log("AUDITORIA_2D_OK",JSON.stringify({width,height,buildings:sizes.length,cardArtRatio:Math.round(sizes[0].img/sizes[0].card*100)+"%",characters:baseNodes.length,animated,motion,visual}));
  }finally{await page.close();}
 }
 console.log("CINCO_RESOLUCOES_IMAGENS_GUILD_COMBATE_EPICO_APROVADAS");
}finally{await browser.close();}
