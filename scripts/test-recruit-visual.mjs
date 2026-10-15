/**
 * Teste de regressão VISUAL REAL em Chromium.
 * 1.500 conjuntos aleatórios de 4 heróis, gerados pelo mesmo market() do jogo.
 * A cada conjunto mede preços, botões e cartões em 6 larguras de tela.
 * 9.000 validações de alinhamento ao todo.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium} from "playwright";
import {newCampaign,market,CLASSES,RACES,heroRace} from "../lib/game.ts";
import {heroSex,HERO_SEX_LABEL} from "../lib/hero-identity.ts";

const BASE_URL=process.env.TEST_BASE_URL||"http://127.0.0.1:4173";
const VIEWPORTS=[320,360,390,430,768,1024];
const CASES_PER_VIEWPORT=1500;
const PIXEL_TOLERANCE=0.65;
function prng(seed){let a=seed>>>0;return()=>{a=(Math.imul(1664525,a)+1013904223)>>>0;return a/4294967296;};}
const rand=prng(20261015);
const state=newCampaign(20261015);
const heroes=[];
for(let week=0;week<420;week++){
 state.day=week*7+1;
 const four=market(state);
 assert.equal(four.length,4,"O jogo precisa continuar oferecendo 4 recrutas.");
 for(const h of four){
  assert.ok(h.race&&h.sex,"Cada novo recruta precisa de raça e sexo.");
  heroes.push({name:h.name,meta:CLASSES[h.class].name+" · "+RACES[heroRace(h)].name+" · "+HERO_SEX_LABEL[heroSex(h)],price:String(h.value)});
 }
}
assert.ok(heroes.length>=1500);
const byName=[...heroes].sort((a,b)=>a.name.length-b.name.length);
const cases=Array.from({length:CASES_PER_VIEWPORT},(_,i)=>{
 const four=Array.from({length:4},()=>heroes[Math.floor(rand()*heroes.length)]);
 // Misturar nomes curtíssimos e compridos na mesma fileira testa o pior caso.
 if(i%5===0){four[0]=byName[0];four[1]=byName.at(-1);four[2]=heroes[Math.floor(rand()*heroes.length)];four[3]=byName[Math.floor(byName.length*.8)];}
 // Teste adicional com variantes de comprimento elevado sem ocultar o texto.
 if(i%17===0)four[2]={...four[2],name:four[2].name+" das Montanhas das Cinzas Eternas"};
 return four;
});
const exe=process.env.CHROMIUM_EXECUTABLE_PATH||undefined;
const browser=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{}) ,args:["--no-sandbox"]});
let total=0;const failures=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,reducedMotion:"reduce"});
 await page.goto(BASE_URL,{waitUntil:"domcontentloaded",timeout:45000});
 await page.locator(".bottom-nav button").filter({hasText:"Taverna"}).click({timeout:20000});
 const grid=page.locator(".recruit-grid");
 await grid.locator("article").first().waitFor({timeout:20000});
 assert.equal(await grid.locator("article").count(),4);
 fs.mkdirSync("qa-recrutamento",{recursive:true});
 await grid.screenshot({path:"qa-recrutamento/taverna-390px.png"});
 for(const width of VIEWPORTS){
  await page.setViewportSize({width,height:850});
  const result=await page.evaluate(({cases,tol})=>{
   const grid=document.querySelector(".recruit-grid");
   if(!grid)throw new Error("recruit-grid ausente.");
   const cards=[...grid.querySelectorAll("article")];
   if(cards.length!==4)throw new Error("Esperados 4 cartões.");
   const errors=[];
   let maxMisalignment=0;
   for(let index=0;index<cases.length;index++){
    const four=cases[index];
    for(let j=0;j<4;j++){
     const card=cards[j],h=four[j];
     card.querySelector("h3").textContent=h.name;
     card.querySelector("article>span,span:not(.hero-portrait)")?.textContent;
     const meta=card.querySelector(":scope > span");
     meta.textContent=h.meta;
     const price=card.querySelector(":scope > small");
     const last=[...price.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
     if(last)last.textContent=" "+h.price+" Ouro";
     else price.appendChild(document.createTextNode(" "+h.price+" Ouro"));
    }
    const b=cards.map(c=>c.querySelector("button").getBoundingClientRect());
    const p=cards.map(c=>c.querySelector(":scope > small").getBoundingClientRect());
    const c=cards.map(c=>c.getBoundingClientRect());
    const diff=Math.max(...b.map(r=>r.top))-Math.min(...b.map(r=>r.top));
    const diffPrice=Math.max(...p.map(r=>r.top))-Math.min(...p.map(r=>r.top));
    maxMisalignment=Math.max(maxMisalignment,diff);
    const heightDiff=Math.max(...b.map(r=>r.height))-Math.min(...b.map(r=>r.height));
    const overflow=c.some((rect,j)=>b[j].left<rect.left-1||b[j].right>rect.right+1||b[j].bottom>rect.bottom+1);
    const collisions=cards.some((card,j)=>{
      const span=card.querySelector(":scope > span").getBoundingClientRect();
      return span.bottom>p[j].top+tol || p[j].bottom>b[j].top+tol;
    });
    if(diff>tol||diffPrice>tol||heightDiff>tol||overflow||collisions){
     if(errors.length<12)errors.push({case:index,buttonDelta:diff,priceDelta:diffPrice,heightDelta:heightDiff,overflow,collisions,names:four.map(x=>x.name),tops:b.map(x=>x.top)});
    }
   }
   return {failures:errors,maxMisalignment,viewWidth:innerWidth,gridWidth:grid.getBoundingClientRect().width};
  },{cases,tol:PIXEL_TOLERANCE});
  total+=cases.length;
  if(result.failures.length)failures.push({width,...result});
  console.log("LARGURA "+width+"px — "+cases.length+" fileiras testadas; desvio máximo "+result.maxMisalignment.toFixed(2)+"px; problemas "+result.failures.length);
  if(width===320||width===430){await grid.screenshot({path:"qa-recrutamento/taverna-"+width+"px.png"});}
 }
 assert.equal(failures.length,0,JSON.stringify(failures,null,2));
 assert.ok(total>1000);
 console.log("RECRUTAMENTO OK: "+total+" conjuntos com 4 heróis = "+(total*4)+" cartões medidos; 6 larguras; botões e preços alinhados.");
}finally{await browser.close();}
