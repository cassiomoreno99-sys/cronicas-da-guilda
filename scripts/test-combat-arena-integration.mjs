import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const a=readFileSync(new URL("../app/arena-2d.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/arena-2d.css",import.meta.url),"utf8");
for(const fragment of ["arenaMovement({","movement.actorFrames","movement.shadowFrames",
  "movingShadow.animate","allUnits.filter(node=>node.dataset.fighterId!==actor.id",
  "data-move-kind={acting?","guild2d-move-shadow"]){
 assert.ok(a.includes(fragment),"Integração ausente: "+fragment);
}
assert.match(css,/\.guild2d-unit\[data-cinematic-actor="true"\]:before\{opacity:0\}/);
assert.match(css,/\.guild-lite-mode \.guild2d-move-shadow\{display:none!important/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.ok(a.includes("choreographyPlan({"),"Reação do alvo deve manter motor visual testado");
assert.ok(!a.includes("actorNode.animate(plan.actorFrames"),"Deslocamento antigo deve ser substituído");
console.log("BLOCO 08B OK — sprite, sombra, obstáculos, rig e modo acessível.");
