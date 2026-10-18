import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {RACES,CLASSES,SPECIALIZATIONS,RARITY_NAMES} from "../lib/game.ts";
import {WORLD_REGIONS,LEVEL_ABILITIES} from "../lib/v130-content.ts";
import {statusEmPortugues,textoEmPortugues} from "../lib/texto-portugues.ts";
const load=(path:string)=>readFileSync(new URL(path,import.meta.url),"utf8");
assert.equal(CLASSES.bard.name,"Pierrô");
assert.equal(RACES.orc.name,"Orco");
assert.equal(SPECIALIZATIONS.warrior.offense.name,"Guerreiro Frenético");
assert.equal(LEVEL_ABILITIES.bard.find(x=>x.level===12)?.name,"Grande Prêmio");
assert.equal(WORLD_REGIONS[2].name,"Ruínas de Ashen");
assert.ok(WORLD_REGIONS[1].enemies.includes("Trol"));
assert.ok(WORLD_REGIONS[4].enemies.includes("Gênio corrompido"));
assert.ok(WORLD_REGIONS[6].enemies.includes("Guardião arbóreo corrompido"));
assert.ok(WORLD_REGIONS[7].enemies.includes("Iéti"));
assert.equal(RARITY_NAMES.legendary,"Lendário");
for(const id of ["bleed","poison","stun","shield","regen","taunt","inspired","vulnerable","ward","lastStand","dodge","riposte","might","critBlessing","slow","evasion"]){
 assert.ok(!/\b(?:bleed|poison|stun|shield|regen|taunt|inspired|vulnerable|ward|lastStand|dodge|riposte|might|critBlessing|slow|evasion)\b/.test(statusEmPortugues(id)),"Efeito exibido em inglês: "+id);
}
const old="Drop Supremo Imperial. Ranking Top 10. Raid. Desbloquear Ultimate. Berserker e Jackpot. Recebe 10 XP. Joga offline.";
const pt=textoEmPortugues(old);
for(const word of ["Drop","Ranking","Top 10","Raid","Ultimate","Berserker","Jackpot"," XP","offline"])assert.ok(!pt.includes(word),"Tradução pendente: "+word);
const catalog=JSON.parse(load("../lib/catalogo-314.json"));
assert.equal(catalog.itens.length,314);
for(const item of catalog.itens){
 for(const key of ["nome","efeito","obtencao","criacao"]){
  assert.ok(!/\bdrop\b/i.test(item[key]||""),"Termo inglês no item "+item.id+" campo "+key);
 }
}
const ui=load("../app/game-client.tsx");
for(const word of ["Drop Supremo Imperial:","Desbloquear Ultimate","Ranking dos 10 Melhores Heróis","Iniciar Raid 3×3","Save e Configurações","def.rarity.toUpperCase()","Baixar backup"]){
 assert.ok(!ui.includes(word),"Interface com termo em inglês: "+word);
}
assert.ok(ui.includes("RARITY_NAMES[def.rarity].toUpperCase()"));
const arena=load("../app/arena-2d.tsx");
assert.ok(arena.includes("statusEmPortugues(status.kind)"),"Efeitos do combate não foram traduzidos");
console.log("PORTUGUÊS DO JOGO OK: catálogo, raridades, menus, status, monstros, talentos, textos antigos e nomes próprios protegidos.");
