import assert from "node:assert/strict";
import fs from "node:fs";
import { ADVENTURER_SHORT_NAME_COUNT, ADVENTURER_NAME_CAPACITY, uniqueAdventurerName } from "../lib/v130-content.ts";
import { market, newCampaign, normalizeCampaign } from "../lib/game.ts";

assert.equal(ADVENTURER_SHORT_NAME_COUNT,10_000);
assert.equal(ADVENTURER_NAME_CAPACITY,250_000);
const names = new Set<string>();
for(let i=0;i<ADVENTURER_NAME_CAPACITY;i++){
  const name=uniqueAdventurerName(i);
  assert.ok(!names.has(name),"Nome repetido no catálogo: "+name+" (índice "+i+")");
  names.add(name);
}
assert.equal(names.size,250_000);
assert.notEqual(uniqueAdventurerName(0),uniqueAdventurerName(1));
assert.notEqual(uniqueAdventurerName(64),uniqueAdventurerName(65));

const current = newCampaign(20261009);
const guildNames = current.rivals.flatMap(g=>g.heroes.map(h=>h.name));
assert.equal(current.rivals.length,99);
assert.equal(new Set(guildNames).size,guildNames.length);
assert.ok(guildNames.every(n=>n.split(" ").length===2),"Os nomes rivais iniciais devem caber nos cartões");
const worldwide=new Set([...current.heroes.map(h=>h.name),...guildNames]);
for(let week=0;week<400;week++){
  const campaign=structuredClone(current);
  campaign.day=week*7+1;
  const recruits=market(campaign);
  assert.equal(recruits.length,4);
  const familyOfFour=new Set(recruits.map(h=>h.name.split(" ").slice(1).join(" ")));
  assert.equal(familyOfFour.size,4,"Quatro recrutas da mesma semana compartilham sobrenome");
  for(const h of recruits){
    assert.ok(!worldwide.has(h.name),"Nome repetido entre rivais e mercado: "+h.name);
    worldwide.add(h.name);
  }
}
assert.ok(worldwide.size>2000);

// Migração do save: troca os nomes dos rivais, mas preserva exatamente
// os nomes dos heróis do jogador, inclusive um nome adquirido anteriormente.
const legacy=structuredClone(current);
legacy.balanceVersion=4;
legacy.heroes[0].name="Aric Valen Personalizado";
for(const rival of legacy.rivals)for(const hero of rival.heroes)hero.name="Cinzaferro";
const migrated=normalizeCampaign(legacy);
assert.equal(migrated.heroes[0].name,"Aric Valen Personalizado");
assert.equal(migrated.balanceVersion,5);
const renamed=migrated.rivals.flatMap(g=>g.heroes.map(h=>h.name));
assert.equal(new Set(renamed).size,renamed.length);
assert.ok(!renamed.includes("Cinzaferro"));
const again=normalizeCampaign(migrated);
assert.deepEqual(again.rivals.flatMap(g=>g.heroes.map(h=>h.name)),renamed,"Nomes rivais mudaram após recarregar o save");

// Mesmo se um nome antigo do jogador coincidir com o próximo recruta,
// o mercado oferece um nome alternativo sem prejudicar o personagem salvo.
const collision=structuredClone(current);
collision.heroes[0].name=market(collision)[0].name;
const other=market(collision);
assert.ok(other.every(h=>h.name!==collision.heroes[0].name));
assert.equal(new Set(other.map(h=>h.name)).size,other.length);

const css=fs.readFileSync("app/ui.css","utf8");
assert.ok(css.includes(".recruit-grid h3{margin:4px 2px 0;min-height:24px;"));
assert.ok(css.includes("white-space:normal;overflow-wrap:anywhere"));
console.log("250.000 nomes únicos, mercado, 99 guildas rivais e salvamentos: OK.");
