import assert from "node:assert/strict";
import {readFileSync,readdirSync,statSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,join} from "node:path";
import {WORLD_REGIONS} from "../lib/v130-content.ts";
import {REGIONAL_CHAPTERS} from "../lib/regional-missions.ts";
import {FULL_ENEMY_NAMES,fullEnemyArtSource,enemyArtSource} from "../lib/enemy-art.ts";

const base=dirname(fileURLToPath(import.meta.url));
const publicRoot=join(base,"..","public");
const artDir=join(publicRoot,"enemies","full");
const pngs=readdirSync(artDir).filter(name=>name.endsWith(".png"));
assert.ok(pngs.length>=42,"O pacote original de 42 artes foi reduzido.");

function validate(name:string){
 const src=fullEnemyArtSource(name);
 assert.ok(src,"Ilustração corporal ausente: "+name);
 const path=join(publicRoot,src.slice(1));
 const buf=readFileSync(path);
 assert.ok(buf.length>10000,"Imagem inválida: "+name);
 assert.equal(buf.subarray(0,8).toString("hex"),"89504e470d0a1a0a","PNG inválido: "+name);
 return src;
}
for(const region of WORLD_REGIONS.slice(0,8)){
 for(const enemy of region.enemies){
  validate(enemy);
  assert.equal(fullEnemyArtSource(enemy+" 2"),fullEnemyArtSource(enemy),"Sufixo alterou criatura: "+enemy);
 }
}
const bosses=["Chefe regional · Vale de Valen",...Array.from({length:7},(_,i)=>REGIONAL_CHAPTERS[i+1].guardian.title)];
for(const title of bosses)validate(title);
for(const name of FULL_ENEMY_NAMES)validate(name);
assert.ok(new Set(FULL_ENEMY_NAMES.map(validate)).size>=40,"Artes completas deixaram de ser associadas aos inimigos.");
for(const region of WORLD_REGIONS.slice(8)){
 for(const enemy of region.enemies){
  const miniature=join(publicRoot,enemyArtSource(enemy).slice(1));
  assert.ok(statSync(miniature).size>500,"Fallback regional ausente: "+enemy);
 }
}
const arena=readFileSync(join(base,"..","app","arena-2d.tsx"),"utf8");
const css=readFileSync(join(base,"..","app","arena-2d.css"),"utf8");
assert.match(arena,/attempt===0\?enemyArtSource\(f\.name\)/,"Falha de imagem deve preservar a espécie.");
assert.match(arena,/data-fighter-id=\{f\.id\} data-full-art/,"HUD deve seguir a arte real.");
assert.match(css,/width:clamp\(69px,22\.4cqw,135px\)/,"Inimigos completos ilegíveis no celular.");
console.log("BESTIÁRIO OK: 42 imagens disponíveis; 8 regiões cobertas por arte completa; 4 com fallback; HUD e Android protegidos.");
