import assert from "node:assert/strict";
import fs from "node:fs";
const client=fs.readFileSync("app/game-client.tsx","utf8");
const arena=fs.readFileSync("app/arena-2d.tsx","utf8");
const portraits=fs.readFileSync("lib/portraits.ts","utf8");
const css=fs.readFileSync("app/ui.css","utf8");
assert.ok(!client.includes('className="arena-demo-entry"'),"O bloco azul de confrontos ainda existe.");
assert.ok(!client.includes('Confrontos da Guilda'),"Texto de destaque do combate ainda existe na Guilda.");
const pub=client.indexOf('className="tavern-lower"');
const shop=client.indexOf('className="tavern-market"',pub);
const rumor=client.indexOf('className="rumors parchment"',pub);
assert.ok(pub>=0&&shop>pub&&rumor>shop,"Mercado não está à esquerda dos rumores.");
assert.ok(css.includes(".tavern-market .catalog-shop"),"Mercado não possui espaço ampliado.");
assert.ok(!css.includes(".tavern-screen .tavern-side .shop .catalog-shop"),"Layout antigo do Mercado ainda está ativo.");
assert.ok(arena.includes("const sent=new Set(expedition.team.slice(0,4))"),"Combate não está preso aos heróis enviados.");
assert.ok(arena.includes("rendered.has(f.id)"),"Heróis repetidos não são eliminados.");
assert.ok(arena.includes('const image=combatArt(f,f.side==="hero"?state.heroes.find(h=>h.id===f.id):undefined);'),"Arte não considera a raça do herói.");
assert.ok(portraits.indexOf('if(race==="orc")')>=0&&portraits.indexOf('if(race==="beastkin")')>=0,"Retratos de orc/bestial não foram corrigidos.");
assert.ok(portraits.indexOf("(race && races[race])")<portraits.indexOf("(heroClass && classes[heroClass])"),"Classe ainda tem prioridade sobre raça no retrato.");
for(const name of ["sprite-thorgar.webp","sprite-eldrin.webp","sprite-rhokar.webp","sprite-orc.webp"]){
 const path="public/battle/"+name;
 assert.ok(fs.existsSync(path),"Sprite racial ausente: "+name);
 assert.ok(fs.statSync(path).size>15000,"Sprite racial ilegível: "+name);
}
console.log("FASE_1_STATIC_OK: sem bloco azul, mercado à esquerda, somente equipe enviada e retratos raciais.");
