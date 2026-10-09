import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";

const source = [1,2,3].map(i => fs.readFileSync("lib/scene-art/tavern-part-"+i+".ts","utf8"));
const chunks = source.map((s,i) => {
  const match = s.match(/export default "([A-Za-z0-9+/=]+)";/);
  assert.ok(match,"Parte inválida "+i);
  return match[1];
});
const raw = Buffer.from(chunks.join(""),"base64");
assert.ok(raw.length > 75000,"Banner comprimido excessivamente");
assert.equal(createHash("sha1").update(raw).digest("hex"),"7182a1a6a8f52ac16c065c9554a584855a751d01");
assert.equal(raw.subarray(4,12).toString("ascii"),"ftypavif");
const ispe = raw.indexOf(Buffer.from("ispe"));
assert.ok(ispe > -1,"Dimensões AVIF ausentes");
assert.equal(raw.readUInt32BE(ispe+8),1024);
assert.equal(raw.readUInt32BE(ispe+12),576);
const client = fs.readFileSync("app/game-client.tsx","utf8");
assert.ok(client.includes('import { tavernArtwork } from "@/lib/scene-art/tavern";'));
assert.ok(client.includes('src={tavernArtwork}'));
assert.ok(!client.includes('/reference/tavern-hero.webp'));
const css = fs.readFileSync("app/ui.css","utf8");
assert.ok(css.includes(".tavern-hero{height:auto;aspect-ratio:16 / 9}"));
assert.ok(!fs.existsSync("public/reference/tavern-hero.webp"));
console.log("Nova Taverna: arte original 1024x576 conferida, antiga removida e layout correto.");
