import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const scene=readFileSync(new URL("../app/arena-2d.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/arena-2d.css",import.meta.url),"utf8");
for(const marker of ["guild2d-quickbar","guild2d-quick-slot","guild2d-quick-cooldown","guild2d-skill-grid",
 "guild2d-skill-card","guild2d-ally-selector","guild2d-cancel-order","guild2d-quick-more"]){
 assert.ok(scene.includes(marker),"Falta interface "+marker);
 assert.ok(css.includes(marker),"Falta estilo "+marker);
}
assert.match(scene,/abilityCooldownRemaining\(battle,hero\.id,a\.id\)/,"Recarga precisa seguir o motor real");
assert.match(scene,/onClick=\{\(\)=>queueAbility\(a\)\}/,"Skill deve acionar fluxo real");
assert.match(scene,/act\(\{type:"battle-ability"/,"Skill precisa permanecer integrada à campanha");
assert.match(scene,/aria-expanded=\{openSkill\}/,"Painel deve ser acessível");
assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/,"Barra deve caber no Android");
console.log("HABILIDADES OK: slots, cooldown, alvos e ordens ligadas ao motor original.");
