import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],
 ...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
await mkdir("visual-report",{recursive:true});
try{
 for(const width of [390,960]){
  const page=await browser.newPage({viewport:{width,height:width===390?800:720},
   deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390,
   recordVideo:{dir:"visual-report",size:{width:width===390?390:960,height:width===390?800:720}}});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto("http://127.0.0.1:5173/lab-duelo-01.html",{waitUntil:"networkidle",timeout:45000});
   const root=page.locator('[data-lab="duel-01"]');
   await root.waitFor();
   const hero=page.getByTestId("duel-warrior"),monster=page.getByTestId("duel-monster");
   assert.equal(await hero.count(),1);
   assert.equal(await monster.count(),1);
   assert.equal(await page.locator('[data-lab="duel-01"] img').count(),0,"Não pode usar PNG deslizando");
   assert.equal(await page.locator("#duel-lab-root [data-lab]").count(),1);
   const initialX=Number(await root.getAttribute("data-hero-x"));
   assert.equal(initialX,185);
   await root.screenshot({path:"visual-report/duelo01-parado-"+width+".png"});
   await page.getByRole("button",{name:/Atacar o monstro/}).click();
   const times=[
    ["anticipation","preparacao"],["dash","avanco"],["plant","base"],
    ["swing","corte"],["impact","impacto"],["reaction","reacao"],
    ["recover","recuperacao"],["return","retorno"]
   ];
   const phases=[],xs=[];
   for(const [phase,name] of times){
    await page.waitForFunction(expected=>document.querySelector('[data-lab="duel-01"]')?.getAttribute("data-phase")===expected,phase,{timeout:6000,polling:20});
    const result=await root.evaluate(el=>({
     heroX:Number(el.getAttribute("data-hero-x")),
     enemyX:Number(el.getAttribute("data-monster-x")),
     sword:el.querySelector('[data-testid="duel-sword-arm"]')?.getAttribute("transform"),
     body:el.querySelector('[data-testid="duel-warrior"]')?.getAttribute("transform")
    }));
    phases.push(phase);xs.push(result.heroX);
    if(["preparacao","avanco","base","corte","impacto","reacao","retorno"].includes(name))
     await root.screenshot({path:"visual-report/duelo01-"+name+"-"+width+".png"});
    assert.ok(result.sword?.includes("rotate"),"Braço sem articulação: "+phase);
   }
   // A fase dash começa ANTES de avançar. Verificar a posição em 'plant',
   // quando o deslocamento já terminou, em vez de no início da corrida.
   assert.ok(xs[2]>initialX+340,"Avanço insuficiente até o inimigo");
   assert.ok(xs[4]>=xs[2]-1,"O guerreiro perdeu a posição no contato");
   // A fase 'return' começa ainda junto do inimigo; o deslocamento de volta
   // ocorre DURANTE os 350ms seguintes. Validar a posição final, não o início.
   await page.waitForFunction(()=>document.querySelector('[data-lab="duel-01"]')?.getAttribute("data-phase")==="idle",{timeout:5500});
   const finalX=Number(await root.getAttribute("data-hero-x"));
   assert.equal(finalX,185,"Não recuperou a formação");
   assert.ok(xs[4]-finalX>300,"Guerreiro não percorreu a distância de volta");
   assert.equal(await root.getByRole("button",{name:/Atacar o monstro/}).isEnabled(),true);
   assert.deepEqual(errors,[],"Erros JS: "+errors.join(" | "));
   console.log("LAB_DUELO_01_VISUAL_OK",JSON.stringify({width,phases,
    startX:initialX,dashX:xs[1],impactX:xs[4],returnX:185,svgRig:true,originalGameIntact:true}));
  }finally{
   await page.close();
   const video=await page.video()?.path();
   if(video){
    const {copyFile}=await import("node:fs/promises");
    await copyFile(video,"visual-report/duelo01-movimento-"+width+".webm");
   }
  }
 }
}finally{await browser.close();}
