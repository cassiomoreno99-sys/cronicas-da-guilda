import assert from "node:assert/strict";
import fs from "node:fs";

const names = ["aric", "lyra", "doran", "kael", "elen", "sora", "pierro"];
for(const name of names){
  const module = fs.readFileSync("lib/portrait-art/" + name + ".ts", "utf8");
  const found = module.match(/data:image\/avif;base64,([A-Za-z0-9+/=]+)/);
  assert.ok(found, "Imagem não encontrada para " + name);
  const bytes = Buffer.from(found[1], "base64");
  assert.ok(bytes.length > 3000, "Imagem incompleta: " + name);
  assert.equal(bytes.subarray(4,12).toString("ascii"), "ftypavif", "AVIF inválido: " + name);
}
const portraits = fs.readFileSync("lib/portraits.ts", "utf8");
for(const name of names)assert.ok(portraits.includes("portrait-art/"+name), "Retrato ausente: "+name);
assert.ok(portraits.includes('bard:"pierro"'));
const heroPage = fs.readFileSync("app/game-client.tsx", "utf8");
assert.ok(heroPage.includes("portraitSource(hero.name"));
assert.ok(!heroPage.includes("portraitPosition("));
const styles = fs.readFileSync("app/ui.css", "utf8");
assert.ok(styles.includes("background-size:cover"));
assert.ok(!styles.includes("hero-portraits-v6.webp"));
assert.ok(!fs.existsSync("public/hero-portraits-v6.webp"));
assert.ok(!fs.existsSync("public/hero-portraits-v121.webp"));
console.log("7 retratos novos presentes, íntegros e conectados. Imagens antigas removidas.");
