import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const s=readFileSync(new URL("../app/arena-2d.tsx",import.meta.url),"utf8");
const fx=readFileSync(new URL("../app/combat-spectacle-fx.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/arena-2d.css",import.meta.url),"utf8");
for(const t of ["bossSpectacle(battle.combat?.mission,actor,evt",
"supremeSpectacle(cueSkill?.ability,actor,evt","const spectacle=bossEvent||supremeEvent",
"physicalAttack=!spectacle&&actor","spell=spectacle||physicalAttack?undefined:spellPlan",
"!physicalAttack&&!spell&&!spectacle&&<ArenaVfx",
"!physicalAttack&&!spell&&!spectacle&&<div key=",
"<SpectacleFX","<BossPresence pressure={pressure}/>"]){assert.ok(s.includes(t),"Integração: "+t)}
for(const t of ["data-kind={plan.kind}","data-school={plan.school}","data-book={plan.book||\"\"}",
"guild2d-spectacle-area","guild2d-spectacle-shard","data-pressure={pressure}"]){assert.ok(fx.includes(t),"Componente: "+t)}
for(const t of ["sigil","charge","sweep","crush","shield","rift","nova","drain","shard","area","boss-aura","boss-crown"])
 assert.ok(css.includes("@keyframes guild12-"+t),"CSS "+t);
assert.ok(css.includes("@media(prefers-reduced-motion:reduce)"));
assert.ok(css.includes(".guild-lite-mode .guild2d-spectacle-shard"));
assert.ok(!fx.includes("localStorage"));
console.log("BLOCO_12B_OK: cenas exclusivas e halo de chefe com acessibilidade.");
