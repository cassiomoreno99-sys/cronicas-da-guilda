import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {newCampaign,normalizeCampaign,market,applyAction,RACES,CLASSES,type HeroRace} from "../lib/game.ts";
import {heroSex,generatedHeroRace,generatedHeroSex,identityName,HERO_VISUAL_CLASSES,HERO_VISUAL_RACES,HERO_ART_COMBINATIONS,HERO_SEXES,portraitAssetKey} from "../lib/hero-identity.ts";
import {heroArtPlaceholder,officialHeroArt,heroArtProgress} from "../lib/hero-art.ts";

assert.equal(HERO_ART_COMBINATIONS,84);
assert.equal(HERO_VISUAL_RACES.length,6);assert.equal(HERO_VISUAL_CLASSES.length,7);
assert.equal(HERO_SEXES.length,2);
assert.equal(new Set(HERO_VISUAL_RACES).size,6);assert.equal(new Set(HERO_VISUAL_CLASSES).size,7);
for(const race of HERO_VISUAL_RACES)assert.ok(RACES[race]);
for(const cl of HERO_VISUAL_CLASSES)assert.ok(CLASSES[cl]);
const all=new Set();
for(const race of HERO_VISUAL_RACES)for(const cl of HERO_VISUAL_CLASSES)for(const sex of HERO_SEXES){
 const key=portraitAssetKey(race,cl,sex);
 assert.ok(!all.has(key),"Combinação visual repetida: "+key);all.add(key);
 assert.ok(heroArtPlaceholder(race,cl,sex).startsWith("data:image/svg+xml"));
 assert.ok(heroArtPlaceholder(race,cl,sex,"battle").startsWith("data:image/svg+xml"));
 const decoded=decodeURIComponent(heroArtPlaceholder(race,cl,sex));
 assert.ok(decoded.includes("RETRATO PENDENTE")&&decoded.includes("svg"));
}
assert.equal(all.size,84);
const first=newCampaign(20261014);
for(const h of first.heroes){assert.ok(h.sex);assert.equal(h.sex,heroSex(h));assert.ok(h.race);}
assert.equal(first.heroes.find(h=>h.id==="aric")?.sex,"male");
assert.equal(first.heroes.find(h=>h.id==="lyra")?.sex,"female");
assert.equal(first.heroes.find(h=>h.id==="elen")?.sex,"male");
assert.equal(first.heroes.find(h=>h.id==="kael")?.sex,"female");
assert.equal(first.heroes.find(h=>h.id==="doran")?.race,"beastkin");
for(const h of first.rivals.flatMap(g=>g.heroes)){
 assert.ok(h.sex&&h.race);
 assert.equal(h.sex,generatedHeroSex(h.id),"Rival deve ter sexo consistente com o gerador");
 assert.equal(h.race,generatedHeroRace(h.id),"Rival deve ter raça consistente com o gerador");
}
const rivals=first.rivals.flatMap(g=>g.heroes);
assert.equal(new Set(rivals.map(h=>h.name)).size,rivals.length);
for(let wk=0;wk<160;wk++){
 const s=structuredClone(first);s.day=wk*7+1;
 const available=market(s);assert.equal(available.length,4);
 for(const h of available){
  assert.equal(h.sex,generatedHeroSex(h.id));
  assert.equal(h.race,generatedHeroRace(h.id));
  assert.ok(h.name.split(" ").length>=2);
 }
}
const old=structuredClone(first);
old.balanceVersion=5;
delete old.heroes[0].sex;
old.heroes[0].name="Aric Valen customizado";
old.heroes[0].level=19;old.heroes[0].xp=87;
old.heroes[0].race="human";
old.chest.push({id:"item-999",key:"CG-001",equippedTo:"aric",equippedSlot:"weapon"});
const saved=normalizeCampaign(old);
assert.equal(saved.balanceVersion,6);
assert.equal(saved.heroes[0].name,"Aric Valen customizado");
assert.equal(saved.heroes[0].level,19);
assert.equal(saved.heroes[0].xp,87);
assert.equal(saved.heroes[0].sex,"male");
assert.equal(saved.heroes[0].race,"human");
assert.equal(saved.chest.find(i=>i.id==="item-999")?.equippedTo,"aric");
assert.deepEqual(normalizeCampaign(saved).rivals.map(g=>g.heroes.map(h=>h.name)),saved.rivals.map(g=>g.heroes.map(h=>h.name)));
let academy=newCampaign(1789);
academy.event=null;academy.gold=100000;
academy=applyAction(academy,{type:"upgrade-hq",building:"academy"});
academy=applyAction(academy,{type:"academy-open-class"});
assert.equal(academy.academy.candidates.length,10);
for(const c of academy.academy.candidates){
 assert.ok(c.race && c.sex);
 assert.equal(c.race,generatedHeroRace(c.id));assert.equal(c.sex,generatedHeroSex(c.id));
 assert.ok(c.name.length>5);
}
const source=fs.readFileSync("app/arena-2d.tsx","utf8");
assert.ok(source.includes("battleSource(hero,race)"),"Arena ainda recicla sprites genéricos");
assert.ok(!source.includes("const byRace:Record<string,string>"),"Sprite indevido por raça continua na arena");
const portraitCode=fs.readFileSync("lib/portraits.ts","utf8");
assert.ok(portraitCode.includes('officialHeroArt("portrait"'));
assert.ok(portraitCode.includes('officialHeroArt("battle"'));
const ui=fs.readFileSync("app/game-client.tsx","utf8");
assert.ok(ui.includes('HERO_SEX_LABEL[heroSex(hero)]'),"Ficha não mostra sexo");
assert.ok(!ui.includes("CORE_RACE_NAMES"),"Nome de raça em tela contradiz o cadastro");
const mkdir="public/heroes/portraits/dwarf",file=mkdir+"/mage-female.webp",original="public/battle/sprite-thorgar.webp";
const generated="lib/hero-art-manifest.ts";
const previous=fs.readFileSync(generated,"utf8");
try{
 fs.mkdirSync(mkdir,{recursive:true});fs.copyFileSync(original,file);
 execFileSync(process.execPath,["scripts/generate-hero-art-manifest.mjs"],{stdio:"pipe"});
 const manifest=fs.readFileSync(generated,"utf8");
 assert.ok(manifest.includes('dwarf/mage-female'));
 assert.ok(manifest.includes('/heroes/portraits/dwarf/mage-female.webp'));
}finally{
 if(fs.existsSync(file))fs.unlinkSync(file);
 fs.writeFileSync(generated,previous);
 execFileSync(process.execPath,["scripts/generate-hero-art-manifest.mjs"],{stdio:"pipe"});
}
assert.equal(heroArtProgress().total,84);
const hasPortrait=fs.existsSync("public/heroes/portraits/dwarf/mage-female.webp");
assert.equal(officialHeroArt("portrait","dwarf" as HeroRace,"mage","female"),hasPortrait?"/heroes/portraits/dwarf/mage-female.webp":undefined);
if(hasPortrait)assert.equal(heroArtProgress().portraits,84,"O kit completo deve registrar 84 retratos.");
console.log("BIBLIOTECA DE HERÓIS: 84 identidades únicas, nomes/raças/sexo, saves preservados e inclusão automática de arquivos OK.");
