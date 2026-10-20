import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {LATE_BESTIARY_FILES,lateEnemySource} from "../lib/bestiary-visual-plan.ts";
import {fullEnemyArtSource} from "../lib/enemy-art.ts";
import {WORLD_REGIONS} from "../lib/v130-content.ts";
import {REGIONAL_CHAPTERS} from "../lib/regional-missions.ts";
assert.equal(LATE_BESTIARY_FILES.length,20);
for(const src of LATE_BESTIARY_FILES){
 const url=new URL("../public"+src,import.meta.url);
 assert.ok(existsSync(url),"SVG ausente: "+src);
 const c=readFileSync(url,"utf8");
 assert.ok(c.includes('xmlns="http://www.w3.org/2000/svg"'));
 assert.ok(c.includes('viewBox="0 0 300 420"'));
 assert.ok(c.includes("<title")&&c.includes("<path"));
 assert.ok(!/<script|<foreignObject|href="https?:|url\(https?:/i.test(c),"SVG perigoso: "+src);
 assert.ok(c.length>=1300,"Silhueta incompleta: "+src);
}
for(let i=8;i<=11;i++)
 for(const name of [...WORLD_REGIONS[i].enemies,REGIONAL_CHAPTERS[i].guardian.title]){
  assert.equal(fullEnemyArtSource(name),lateEnemySource(name),"Nome não mapeado: "+name);
  assert.equal(fullEnemyArtSource(name+" 3"),lateEnemySource(name));
 }
for(const name of ["Bandido","Pantera das brumas","Dragão de gelo","O Trono do Gelo Partido"])
 assert.ok(fullEnemyArtSource(name)?.endsWith(".png"),"PNG alterado: "+name);
assert.equal(fullEnemyArtSource("Monstro fictício"),undefined);
console.log("BLOCO_14B_ARTES_OK: 20 SVGs individuais, nomes exatos e PNGs antigos intactos.");
