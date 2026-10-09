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
await top("Descanso","04-descanso");
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
await sanity("05b-herois-volta-equipamentos");

await bottom("Baú","06-bau");
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

if (errors.length) throw new Error(errors.join("\n"));
await browser.close();
console.log("VISUAL_OK");

