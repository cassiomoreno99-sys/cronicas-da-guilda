import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir} from "node:fs/promises";
const groups=[
 {region:"morn",names:["Bruxa do pântano","Hidra jovem","Carniçal","Limo ancestral","A Fome do Lodo Ancestral"],
  files:["witch-morn","young-hydra","ghoul-morn","ancient-slime","boss-morn"],
  motions:["humanoid","beast","humanoid","amorphous","amorphous"]},
 {region:"solkar",names:["Legionário","Mago imperial","Carrasco","Golem de guerra","A Máquina do Imperador"],
  files:["imperial-legionary","imperial-mage","executioner","war-golem","boss-solkar"],
  motions:["humanoid","humanoid","humanoid","construct","construct"]},
 {region:"nhal",names:["Demônio menor","Arauto do vazio","Devorador","Cavaleiro do abismo","O Cavaleiro do Fim"],
  files:["lesser-demon","void-herald","devourer","abyss-knight","boss-nhal"],
  motions:["beast","floating","beast","humanoid","humanoid"]},
 {region:"crown",names:["Dragão ancião","Titã de gelo","Serafim caído","Rei sem Nome","Rei sem Nome · O Último Juramento"],
  files:["elder-dragon","ice-titan","fallen-seraph","nameless-king","boss-crown"],
  motions:["beast","construct","floating","humanoid","humanoid"]}
];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],
 ...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
await mkdir("visual-report",{recursive:true});
try{
 for(const [width,height] of [[390,844],[1440,900]]){
  const mobile=width<600;
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto("http://127.0.0.1:5173",{waitUntil:"networkidle",timeout:60000});
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
   await send.click();
   const stage=page.locator('.guild2d-stage[data-cinematic="real-2d"]');
   await stage.waitFor({state:"visible",timeout:15000});
   await page.waitForFunction(()=>[...document.querySelectorAll(".guild2d-unit img")].every(x=>x.complete&&x.naturalWidth>0),
     null,{timeout:18000});
   const original=await stage.evaluate(el=>({
     enemies:[...el.querySelectorAll('.guild2d-enemy img')].map(i=>i.getAttribute("src")),
     ids:[...el.querySelectorAll('.guild2d-unit')].map(x=>x.dataset.fighterId),
     scene:getComputedStyle(el.querySelector(".guild2d-scene")).backgroundImage
   }));
   assert.ok(original.scene.includes("arena-aprovada.webp"));
   assert.ok(original.ids.length>=2&&original.ids.length<=8);
   assert.ok(original.enemies.every(src=>src&&!src.endsWith(".svg")),"Arte antiga da missão inicial alterada");
   // Galeria ISOLADA: imagens de regiões bloqueadas não são injetadas no save.
   // Não simula combates de chefes nem altera qualquer dado da campanha.
   for(const group of groups){
    await page.evaluate(group=>{
      document.querySelector("#guild14-gallery")?.remove();
      const gallery=document.createElement("div");
      gallery.id="guild14-gallery";
      gallery.className="guild2d-stage";
      gallery.setAttribute("aria-label","Ensaio visual isolado do bestiário "+group.region);
      gallery.style.cssText="position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:end;gap:5px;width:min(92vw,660px);max-width:660px;height:750px;min-height:750px;margin:25px auto;overflow:hidden;padding:14px;background:linear-gradient(#142132,#172c39 80%,#1b1b29);isolation:isolate;container-type:inline-size";
      for(let index=0;index<5;index++){
       const tile=document.createElement("div");
       tile.style.cssText="min-width:0;height:225px;border:1px solid #668292;border-radius:8px;position:relative;overflow:hidden;background:radial-gradient(circle at 50% 75%,#3b4751,#162536)";
       const unit=document.createElement("div");
       unit.className="guild2d-unit guild2d-enemy";
       unit.dataset.bestiaryMotion=group.motions[index];
       unit.dataset.bestiaryTone=group.region==="morn"?"poison":group.region==="solkar"?"metal":group.region==="nhal"?"abyss":"frost";
       unit.dataset.bestiarySlug=group.files[index];
       unit.dataset.fullArt="true";unit.dataset.dead="false";unit.dataset.enemyBestiary="true";
       unit.style.cssText="position:relative!important;left:auto!important;top:auto!important;transform:none!important;width:100%!important;height:194px!important;max-width:none!important";
       const sprite=document.createElement("span");sprite.className="guild2d-sprite";
       sprite.style.cssText="display:block!important;width:100%!important;height:100%!important";
       const img=document.createElement("img");
       img.src="/enemies/full/"+group.files[index]+".svg";
       img.alt="";img.loading="eager";img.dataset.asset=group.files[index];
       sprite.append(img);unit.append(sprite);tile.append(unit);
       const name=document.createElement("span");name.textContent=group.names[index];
       name.style.cssText="position:absolute;bottom:1px;left:0;right:0;font:700 10px/1.2 system-ui;color:#f9eaca;text-align:center;background:#0e1a27e8;padding:4px";
       tile.append(name);gallery.append(tile);
      }
      document.body.append(gallery);
    },group);
    const images=page.locator("#guild14-gallery img");
    await page.waitForFunction(()=>[...document.querySelectorAll("#guild14-gallery img")].length===5&&
       [...document.querySelectorAll("#guild14-gallery img")].every(x=>x.complete&&x.naturalWidth===300&&x.naturalHeight===420),
       null,{timeout:17000,polling:100});
    const report=await page.locator("#guild14-gallery").evaluate(el=>{
      return [...el.querySelectorAll("img")].map(img=>({
       src:img.getAttribute("src"),w:img.naturalWidth,h:img.naturalHeight,
       animation:getComputedStyle(img).animationName,
       loaded:img.complete,visible:getComputedStyle(img).visibility,
       full:img.closest(".guild2d-unit")?.dataset.fullArt
      }));
    });
    assert.equal(new Set(report.map(x=>x.src)).size,5,"Sprite repetido: "+group.region);
    assert.ok(report.every(x=>x.loaded&&x.w===300&&x.h===420&&x.visible!=="hidden"&&x.full==="true"));
    assert.ok(report.every(x=>x.animation.startsWith("guild14-")),"Movimento ausente: "+JSON.stringify(report));
    await page.locator("#guild14-gallery").scrollIntoViewIfNeeded();
    await page.locator("#guild14-gallery").screenshot({path:"visual-report/bloco14-"+group.region+"-"+width+".png"});
    console.log("BLOCO_14C_GRUPO_OK",JSON.stringify({width,region:group.region,artes:report.length,animation:report.map(x=>x.animation)}));
   }
   const gallery=page.locator("#guild14-gallery");
   await page.emulateMedia({reducedMotion:"reduce"});
   assert.equal(await gallery.locator("img").first().evaluate(el=>getComputedStyle(el).animationName),"none");
   await page.emulateMedia({reducedMotion:"no-preference"});
   await gallery.evaluate(el=>el.classList.add("guild-lite-mode"));
   assert.equal(await gallery.locator("img").first().evaluate(el=>getComputedStyle(el).animationName),"none");
   await gallery.evaluate(el=>el.remove());
   const saved=await page.evaluate(()=>localStorage.getItem("cronicas-da-guilda:standalone:v1")||"");
   assert.ok(!saved.includes("guild14-gallery")&&!saved.includes("bestiary-motion"));
   assert.deepEqual(errors,[],"Erros no navegador "+errors.join(" | "));
   console.log("BLOCO_14C_BROWSER_OK",JSON.stringify({width,regions:4,assets:20,realArenaIntact:true,
    noBrokenImages:true,reducedMotion:true,lightMode:true,saveUnchangedByPresentation:true,
    higherRegionRealFightObserved:false,isolatedGallery:true}));
  }finally{await page.close();}
 }
}finally{await browser.close();}
