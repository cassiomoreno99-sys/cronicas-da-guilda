import { chromium } from "playwright";
import fs from "node:fs/promises";

const base = process.env.UI_URL || "http://127.0.0.1:5173";
await fs.mkdir("visual-report", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", msg => { if (msg.type() === "error") errors.push("console: " + msg.text()); });
page.on("pageerror", err => errors.push("pageerror: " + err.message));

async function sanity(name) {
  await page.waitForTimeout(250);
  const report = await page.evaluate(() => {
    const broken = [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute("src"));
    const overflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
    const tiny = [...document.querySelectorAll("button,small,p,strong,span")].filter(el => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      const px = parseFloat(getComputedStyle(el).fontSize);
      return px > 0 && px < 7;
    }).length;
    return { broken, overflow, tiny };
  });
  if (report.broken.length) throw new Error(name + " broken images: " + report.broken.join(","));
  if (report.overflow > 2) throw new Error(name + " horizontal overflow: " + report.overflow);
  if (report.tiny > 12) throw new Error(name + " too many tiny text nodes: " + report.tiny);
  await page.screenshot({ path: "visual-report/" + name + ".png", fullPage: true });
}

await page.goto(base, { waitUntil: "networkidle" });
await sanity("01-missoes");
if(await page.locator(".enemy-dossier").count()!==0)
 throw new Error("A imagem indevida continua no início das missões.");
if(await page.locator(".header-resources svg.game-symbol--gold").count()!==1)
 throw new Error("Símbolo de ouro não aparece no cabeçalho");
if(await page.locator(".mission-rewards svg.game-symbol--reward").count()<1)
 throw new Error("Recompensa sem símbolo dourado");
const coin=await page.locator(".header-resources svg.game-symbol--gold").evaluate(el=>{
 const box=el.getBoundingClientRect(),style=getComputedStyle(el);
 return {w:box.width,h:box.height,color:style.color,visible:style.visibility};
});
if(coin.w<18||coin.h<18||coin.visible!=="visible")
 throw new Error("Moeda do cabeçalho está invisível ou pequena: "+JSON.stringify(coin));


async function bottom(label, name) {
  await page.getByRole("button", { name: label, exact: true }).last().click();
  await sanity(name);
}
async function top(label, name) {
  await page.getByRole("button", { name: label, exact: true }).first().click();
  await sanity(name);
}

await top("Equipe","02-equipe");
await top("Liga","03-liga");
const rivalCrests=page.locator(".league-row .league-rival-crest");
if(await rivalCrests.count()!==5)throw new Error("A Liga não mostra os cinco brasões.");
await page.waitForFunction(()=>[...document.querySelectorAll(".league-row .league-rival-crest")].every(im=>im.complete));
for(const img of await rivalCrests.all()){
 if(!(await img.evaluate(el=>el.naturalWidth>=100&&el.naturalHeight>=100)))throw new Error("Brasão da Liga não carregou.");
}
if(await page.locator(".realistic-trophy").count()<7)throw new Error("Faltam troféus metálicos na Liga.");
if(await page.locator(".league-summary .big-crest img").count()!==1)throw new Error("Brasão do jogador ausente.");
const fullChallenge=await page.locator(".guild-challenge-art").evaluate(async el=>{
 if(!el.complete)await new Promise((resolve,reject)=>{el.addEventListener("load",resolve,{once:true});el.addEventListener("error",reject,{once:true});});
 const r=el.getBoundingClientRect();return {src:el.getAttribute("src"),nw:el.naturalWidth,nh:el.naturalHeight,w:r.width,h:r.height,style:getComputedStyle(el).objectFit};
});
if(fullChallenge.src!=="/reference/olho-rubro-report-2026.webp"||fullChallenge.nw<1000||fullChallenge.nh<900
 ||Math.abs(fullChallenge.w/fullChallenge.h-fullChallenge.nw/fullChallenge.nh)>.025
 ||fullChallenge.style!=="contain")
 throw new Error("A imagem do desafio foi cortada: "+JSON.stringify(fullChallenge));
await sanity("03a-liga-brasoes");
await top("Descanso","04-descanso");
const sanctuaryImage=page.locator(".sanctuary-head>img");
const saint=await sanctuaryImage.evaluate(async el=>{
 if(!el.complete)await new Promise((resolve,reject)=>{el.addEventListener("load",resolve,{once:true});el.addEventListener("error",reject,{once:true});});
 const box=el.getBoundingClientRect();return {nw:el.naturalWidth,nh:el.naturalHeight,w:box.width,h:box.height};
});
if(saint.nw!==1360||saint.nh!==765||Math.abs(saint.w/saint.h-1360/765)>.03)
 throw new Error("Santuário cortado ou fora de proporção: "+JSON.stringify(saint));
await sanity("04a-santuario-inteiro");
await bottom("Heróis","05-herois");
const equipmentLink = page.getByRole("button",{name:/Ver equipamentos · 12 espaços/});
if (await equipmentLink.count() !== 1) throw new Error("Botão da nova tela de equipamentos ausente.");
await equipmentLink.click();
if (await page.locator(".equipment-screen").count() !== 1) throw new Error("Tela de equipamentos não abriu.");
if (await page.locator(".equipment-slot").count() !== 12) throw new Error("A tela não exibe os 12 espaços.");
await sanity("05a-equipamentos-12-espacos");
await page.locator('[data-slot="shoulders"]').click();
if (!(await page.locator(".equipment-slot-detail").innerText()).includes("Ombreiras")) throw new Error("Detalhes das ombreiras não abriram.");
await page.locator('[data-slot="ring2"]').click();
if (!(await page.locator(".equipment-slot-detail").innerText()).includes("Anel 2")) throw new Error("Segundo anel não é independente.");
const selectedBefore = await page.locator(".equipment-hero-name strong").innerText();
const heroes = await page.locator(".equipment-hero-chooser select option").count();
if(heroes > 1) {
  await page.locator(".equipment-hero-chooser select").selectOption({index:1});
  if ((await page.locator(".equipment-hero-name strong").innerText()) === selectedBefore) throw new Error("Não é possível trocar o herói.");
}
await page.getByRole("button",{name:"Voltar aos Heróis",exact:true}).click();
if(await page.locator(".heroes-screen").count() !== 1) throw new Error("Voltar não restaurou a ficha do herói.");
if(await page.locator(".stat-grid svg.game-emblem").count()!==6)
 throw new Error("Atributos dos heróis continuam com ícones digitais.");
await sanity("05b-herois-volta-equipamentos");

await bottom("Baú","06-bau");
await page.getByRole("button",{name:/Ver 314 itens/}).click();
if(await page.locator(".catalog-gallery-grid .item-art.catalog-image").count()!==30)
  throw new Error("O catálogo não exibiu 30 miniaturas na primeira página.");
for(const p of [1,4,7,11]){
 const pageNum=await page.locator(".catalog-pagination strong").innerText();
 if(!pageNum.includes("Página "+p+" de 11")) throw new Error("Paginação do catálogo incorreta: "+pageNum);
 const probe=await page.locator(".catalog-gallery-grid .item-art").first().evaluate(async el=>{
  const image=getComputedStyle(el).backgroundImage;
  const url=image.startsWith("url(")?image.slice(4,-1).replaceAll('"',"").replaceAll("'",""):undefined;
  const response=url?await fetch(url):null;
  return {image,url,status:response?.status,type:response?.headers.get("content-type")};
 });
 if(probe.status!==200||!probe.type?.includes("image/avif"))
   throw new Error("Miniatura do catálogo não carregada: "+JSON.stringify(probe));
 if(p===1||p===11) await sanity(p===1?"06a-catalogo-itens":"06b-catalogo-livros");
 if(p<11){
  const next= p===1?4:p===4?7:11;
  for(let i=p;i<next;i++)await page.locator(".catalog-pagination button").last().click();
 }
}
await page.getByRole("button",{name:/Meu inventário/}).click();
await bottom("Taverna","07-taverna");
const tavernImage = page.locator(".tavern-hero img");
if (await tavernImage.count() !== 1) throw new Error("Nova arte da Taverna não foi renderizada.");
const banner = await tavernImage.evaluate(async el => {
  if (!el.complete) await new Promise((resolve,reject) => { el.addEventListener("load",resolve,{once:true});el.addEventListener("error",reject,{once:true}); });
  const wrapper = el.parentElement.getBoundingClientRect();
  const img = el.getBoundingClientRect();
  return {src:el.getAttribute("src")?.slice(0,30),naturalWidth:el.naturalWidth,naturalHeight:el.naturalHeight, width:img.width,height:img.height,containerWidth:wrapper.width,containerHeight:wrapper.height};
});
if(!banner.src?.startsWith("data:image/avif;base64,") || banner.naturalWidth !== 1024 || banner.naturalHeight !== 576)
  throw new Error("Banner da Taverna não carregou a nova imagem inteira: "+JSON.stringify(banner));
if(Math.abs(banner.containerWidth / banner.containerHeight - 16/9) > 0.025)
  throw new Error("Imagem da Taverna está sendo cortada na tela: "+JSON.stringify(banner));
const merchantImage = page.locator(".merchant-head img.merchant-portrait");
if (await merchantImage.count() !== 1) throw new Error("Retrato novo do mercador não aparece na Taverna.");
await merchantImage.evaluate(async el => { if (!el.complete) await new Promise((resolve,reject) => { el.addEventListener("load",resolve,{once:true}); el.addEventListener("error",reject,{once:true}); }); });
const merchantInfo = await merchantImage.evaluate(el => ({ width:el.naturalWidth, height:el.naturalHeight, rendered:el.getBoundingClientRect().width }));
if (merchantInfo.width < 600 || merchantInfo.height < 600 || merchantInfo.rendered < 90) throw new Error("Retrato do mercador pequeno ou sem imagem: "+JSON.stringify(merchantInfo));
await bottom("Guilda","08-guilda");
const guide=page.locator(".symbol-guide");
if(await guide.count()!==1)throw new Error("Guia oficial de símbolos ausente");
await guide.locator("summary").click();
if(await page.locator(".symbol-guide-grid svg.game-symbol").count()<25)
 throw new Error("Guia de símbolos incompleto");
await sanity("08a-guia-simbolos-celular");
await guide.locator("summary").click();

const councilChoice = page.locator(".council-actions button:not([disabled])").first();
if (await councilChoice.count()) {
  await councilChoice.click();
  await page.waitForTimeout(250);
}

await bottom("Missões","09-missoes-volta");
const missionAction = page.locator(".mission-card .action-button:not([disabled])").first();
if (await missionAction.count()) {
  await missionAction.click();
  await page.waitForTimeout(200);
  let send = page.locator(".send-row .action-button").first();
  if (await send.count() && !(await send.isEnabled())) {
    const specialist = page.getByRole("button",{name:"Montar especialista",exact:true});
    if (await specialist.count()) {
      await specialist.click();
      await page.waitForTimeout(150);
    }
  }
  send = page.locator(".send-row .action-button").first();
  if (await send.count() && await send.isEnabled()) {
    await send.click();
    await page.locator(".battle-overlay").waitFor({state:"visible",timeout:5000});
    await sanity("10-batalha");
    const originalTitle = await page.locator(".battle-top strong").innerText();
    const enterCinema = page.getByRole("button",{name:/Abrir Arena Cinematográfica/});
    if(await enterCinema.count() !== 1) throw new Error("Botão para a página cinematográfica ausente.");
    await enterCinema.click();
    await page.locator(".cinema-screen").waitFor({state:"visible"});
    if(await page.locator(".battle-stage").count() !== 0) throw new Error("A arena não é uma página independente.");
    if(await page.locator(".cinema-ally").count() !== 4) throw new Error("A arena não mostrou os 4 heróis da batalha real.");
    if(await page.locator(".cinema-foe").count() < 1) throw new Error("Inimigos reais não carregaram na arena.");
    if((await page.locator(".cinema-mission-head h2").innerText()) !== originalTitle) throw new Error("Arena perdeu o título real da missão.");
    const cinemaPortraits = page.locator(".cinema-fighter-art img");
    if(await cinemaPortraits.count() < 5) throw new Error("Faltam imagens dos combatentes na Arena.");
    for(const img of await cinemaPortraits.all()){
      const ok = await img.evaluate(el => el.complete && el.naturalWidth > 100 && el.naturalHeight > 100);
      if(!ok) throw new Error("Retrato cinematográfico não carregou.");
    }
    await sanity("10a-arena-cinematografica");
    await page.getByRole("button",{name:/Tela clássica/}).click();
    if(await page.locator(".battle-stage").count() !== 1) throw new Error("Voltar para o combate clássico falhou.");
    if((await page.locator(".battle-top strong").innerText()) !== originalTitle) throw new Error("Batalha mudou ao trocar de tela.");
    await page.getByRole("button",{name:/Abrir Arena Cinematográfica/}).click();
    if(await page.getByRole("button",{name:"Concluir combate"}).count() !== 1) throw new Error("Ação automática não foi preservada.");
    await page.getByRole("button",{name:"Concluir combate"}).click();
    await page.waitForTimeout(400);
    if(await page.getByRole("button",{name:"Voltar à guilda"}).count() !== 1) throw new Error("Resultado do combate automático não apareceu na Arena.");
    await sanity("10b-arena-resultado");
    await page.getByRole("button",{name:"Voltar à guilda"}).click();
    if(await page.locator(".battle-overlay").count() !== 0) throw new Error("A página Arena não fechou após o combate.");
  } else {
    throw new Error("Não foi possível habilitar Enviar para validar a batalha.");
  }
}


const desktop=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
await desktop.goto(base,{waitUntil:"networkidle"});
if(await desktop.locator(".nav-sidebar .bottom-nav svg.game-symbol").count()<4)
 throw new Error("Menu PC não mostra ícones padronizados");
if(await desktop.locator(".header-resources svg.game-symbol--gold").count()!==1)
 throw new Error("Ouro sem símbolo no PC");
const overflow=await desktop.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth);
if(overflow>2)throw new Error("Layout de PC excede a largura: "+overflow);
await desktop.screenshot({path:"visual-report/11a-simbolos-pc.png",fullPage:true});
await desktop.getByRole("button",{name:"Liga",exact:true}).first().click();
await desktop.locator(".league-summary .big-crest img").waitFor({state:"visible"});
await desktop.screenshot({path:"visual-report/11c-liga-brasoes-pc.png",fullPage:true});
await desktop.locator(".guild-challenge-art").screenshot({path:"visual-report/11f-desafio-inteiro-pc.png"});
await desktop.getByRole("button",{name:"Descanso",exact:true}).first().click();
await desktop.locator(".sanctuary-head>img").waitFor({state:"visible"});
await desktop.screenshot({path:"visual-report/11d-santuario-pc.png",fullPage:true});
await desktop.getByRole("button",{name:"Missão",exact:true}).first().click();
if(await desktop.locator(".enemy-dossier").count()!==0)throw new Error("Atalho indevido no desktop.");
await desktop.screenshot({path:"visual-report/11e-missoes-sem-atalho-pc.png",fullPage:true});

await desktop.getByRole("button",{name:"Guilda",exact:true}).last().click();
await desktop.locator(".symbol-guide summary").click();
await desktop.screenshot({path:"visual-report/11b-guia-simbolos-pc.png",fullPage:true});
await desktop.close();
if (errors.length) throw new Error(errors.join("\n"));
await browser.close();
console.log("VISUAL_OK");

