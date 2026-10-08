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
  } else {
    throw new Error("Não foi possível habilitar Enviar para validar a batalha.");
  }
}

if (errors.length) throw new Error(errors.join("\n"));
await browser.close();
console.log("VISUAL_OK");

