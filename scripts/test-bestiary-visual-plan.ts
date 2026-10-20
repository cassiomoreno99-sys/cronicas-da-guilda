import assert from "node:assert/strict";
import {LATE_BESTIARY_NAMES,LATE_BESTIARY_FILES,lateEnemyVisual,lateEnemySource} from "../lib/bestiary-visual-plan.ts";
import {WORLD_REGIONS} from "../lib/v130-content.ts";
import {REGIONAL_CHAPTERS} from "../lib/regional-missions.ts";
const regions=["morn","solkar","nhal","crown"];
assert.equal(LATE_BESTIARY_NAMES.length,20);
assert.equal(new Set(LATE_BESTIARY_FILES).size,20);
for(let i=8;i<=11;i++){
 const region=WORLD_REGIONS[i],id=regions[i-8];
 const names=[...region.enemies,REGIONAL_CHAPTERS[i].guardian.title];
 const mapped=names.map(name=>lateEnemyVisual(name));
 assert.equal(mapped.length,5);
 assert.ok(mapped.every(x=>x?.region===id),"Criaturas reais de "+region.name);
 assert.equal(mapped.filter(x=>x?.boss).length,1);
 for(const name of names){
  const s=lateEnemySource(name);
  assert.ok(s?.endsWith(".svg"),name);
  assert.ok(!s?.includes(".."));
  assert.equal(lateEnemySource(name+" 2"),s,"Duplicata numerada: "+name);
 }
}
assert.equal(lateEnemyVisual("Monstro sem catálogo"),undefined);
assert.equal(lateEnemySource("O Cavaleiro das Cinzas"),undefined);
assert.equal(lateEnemyVisual("Rei sem Nome")?.boss,false);
assert.equal(lateEnemyVisual("Rei sem Nome · O Último Juramento")?.boss,true);
console.log("BLOCO_14A_OK: 16 inimigos + 4 chefes tardios, nomenclatura canônica, sem substituição de artes.");
