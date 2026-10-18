import {chromium} from "playwright";
import fs from "node:fs/promises";

const base="http://127.0.0.1:5173";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
const runs=[[320,740],[360,800],[390,844],[412,915],[768,1024],[1440,900]];
await fs.mkdir("visual-report",{recursive:true});
const violations=[];
try{
 for(const [width,height] of runs){
  const mobile=width<=412;
  const page=await browser.newPage({
   viewport:{width,height},deviceScaleFactor:mobile?2:1,
   isMobile:mobile,hasTouch:mobile,
   userAgent:mobile?"Mozilla/5.0 (Linux; Android 16; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36":undefined
  });
  page.on("pageerror",e=>violations.push(width+": "+e.message));
  try{
   await page.goto(base,{waitUntil:"networkidle",timeout:60000});
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
   if(!(await send.isEnabled()))throw Error("Equipe inicial indisponível");
   await send.click();
   await page.locator(".guild2d-stage").waitFor({state:"visible",timeout:15000});
   await page.waitForFunction(()=>[...document.querySelectorAll(".guild2d-unit img")].every(i=>i.complete&&i.naturalWidth>0),{timeout:15000});
   const imgState=await page.locator(".guild2d-unit img").evaluateAll(nodes=>nodes.map(i=>({src:i.getAttribute("src"),natural:i.naturalWidth,decoding:i.decoding})));
   if(imgState.some(x=>!x.natural||x.decoding!=="async"))throw Error("Arte não carregada/decodificação incorreta: "+JSON.stringify(imgState));
   // A montagem gráfica usa os MESMOS nós de imagem entre golpes, sem piscar.
   await page.evaluate(()=>{globalThis.__battleStableImages=new Map([...document.querySelectorAll(".guild2d-unit")].map(unit=>[unit.getAttribute("aria-label")?.replace(/\s+—.*/,""),unit.querySelector("img")]));});
   const attack=page.getByRole("button",{name:/^Atacar/}).first();
   if(await attack.isEnabled())await attack.click();
   const imageStability=await page.evaluate(()=>{
    const refs=globalThis.__battleStableImages;
    return [...document.querySelectorAll(".guild2d-unit")].every(unit=>refs.get(unit.getAttribute("aria-label")?.replace(/\s+—.*/,""))===unit.querySelector("img"));
   });
   if(!imageStability)throw Error("Imagem foi recriada durante o combate 2D");
   // Somente para QA visual: força 4x4 sem alterar regras nem salvar no jogo público.
   await page.evaluate(()=>{
    const key="cronicas-da-guilda:standalone:v1",save=JSON.parse(localStorage.getItem(key));
    const s=save.state,exp=s.expeditions.find(e=>e.battle.status==="active");
    if(!exp?.battle?.combat)throw Error("Expedição indisponível para teste visual 4x4");
    const fighters=exp.battle.combat.fighters;
    const heroes=fighters.filter(f=>f.side==="hero");
    const enemies=fighters.filter(f=>f.side==="enemy");
    if(heroes.length<4){
      const reserve=s.heroes.find(h=>!exp.team.includes(h.id));
      if(reserve){
        const clone=structuredClone(heroes[0]);clone.id=reserve.id;clone.name=reserve.name;clone.class=reserve.class;
        fighters.push(clone);exp.team.push(reserve.id);exp.formation[reserve.id]="back";
      }
    }
    while(enemies.length<4){
      const clone=structuredClone(enemies[0]);clone.id="enemy-qa-"+enemies.length;
      clone.name="Criatura "+(enemies.length+1);
      fighters.push(clone);enemies.push(clone);
    }
    exp.nextRoundAt=Date.now()+60000;
    save.revision++;localStorage.setItem(key,JSON.stringify(save));
   });
   await page.reload({waitUntil:"networkidle"});
   // Abrir a expedição que continuou ativa, sem modificações no motor.
   if(!(await page.locator(".guild2d-stage").count())){
    await page.getByRole("button",{name:"Equipe",exact:true}).first().click();
    await page.locator(".expedition-card.active").getByRole("button",{name:"Detalhes"}).first().click();
   }
   await page.locator(".guild2d-stage").waitFor({state:"visible",timeout:15000});
   // O log persistido não pode recriar uma animação ao restaurar a partida.
   if(await page.locator(".guild2d-cinema").count())
     throw new Error("Um golpe antigo foi reproduzido novamente ao abrir o salvamento.");
   await page.waitForFunction(()=>[...document.querySelectorAll(".guild2d-unit img")].every(img=>img.complete&&img.naturalWidth>0),null,{timeout:20000});
   const info=await page.evaluate(()=>{
    const stage=document.querySelector(".guild2d-stage");
    const rect=stage.getBoundingClientRect();
    const arr=[...stage.querySelectorAll(".guild2d-unit")].map(el=>{
      const r=el.getBoundingClientRect();
      return {side:el.classList.contains("guild2d-hero")?"hero":"enemy",
        x:r.x+r.width/2,y:r.y+r.height/2,left:r.left,right:r.right,width:r.width};
    });
    const hud=[...stage.querySelectorAll(".guild2d-hud")].map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};});
    const ready=[...stage.querySelectorAll(".guild2d-unit img")].every(img=>img.complete&&img.naturalWidth>0);
    const bars=stage.querySelectorAll('.guild2d-hud [role="progressbar"]');
    const scene=stage.querySelector(".guild2d-scene");
    return {hero:arr.filter(x=>x.side==="hero").length,enemy:arr.filter(x=>x.side==="enemy").length,units:arr,hud,ready,bars:bars.length,
      background:getComputedStyle(scene).backgroundImage,cover:getComputedStyle(scene).backgroundSize,
      overflow:document.documentElement.scrollWidth-innerWidth,
      stage:{left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom}};
   });
   if(info.hero!==4||info.enemy!==4||info.bars!==8)throw Error("4x4/HUD inválido: "+JSON.stringify({hero:info.hero,enemy:info.enemy,bars:info.bars}));
   if(!info.ready||!info.background.includes("arena-aprovada.webp")||!info.cover.includes("cover"))throw Error("Arte oficial indisponível ou distorcida: "+JSON.stringify({loaded:info.ready,bg:info.background,cover:info.cover}));
   if(info.overflow>5)throw Error("Rolagem horizontal: "+info.overflow);
   if(info.units.some(u=>u.left<info.stage.left-3||u.right>info.stage.right+3))throw Error("Sprite cortado lateralmente no Android");
   if(info.hud.some(h=>h.left<info.stage.left-3||h.right>info.stage.right+3||h.bottom>info.stage.bottom+4))throw Error("HUD cortado nos limites do cenário "+width+": "+JSON.stringify({stage:info.stage,hud:info.hud}));
   for(const side of ["hero","enemy"]){
    const members=info.units.filter(u=>u.side===side);
    for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++){
      const dx=members[i].x-members[j].x,dy=members[i].y-members[j].y;
      if(Math.hypot(dx,dy)<46)throw Error("Silhuetas coladas: "+side+" "+i+"/"+j);
    }
   }
   await page.locator(".guild2d-stage").screenshot({path:"visual-report/excelencia-2d-"+width+".jpg",type:"jpeg",quality:78});
   console.log("EXCELENCIA_2D_OK",JSON.stringify({width,height,heroes:info.hero,enemies:info.enemy,hud:info.bars,loaded:info.ready,stable:true,background:"approved",overflow:info.overflow}));
  }finally{await page.close();}
 }
 if(violations.length)throw Error("Erros de navegador: "+violations.join(" | "));
 console.log("EXCELENCIA_2D_6_VIEWPORTS_APROVADOS");
}finally{await browser.close();}
