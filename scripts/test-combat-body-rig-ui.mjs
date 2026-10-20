import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const arena=readFileSync(new URL("../app/arena-2d.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/arena-2d.css",import.meta.url),"utf8");
const rig=readFileSync(new URL("../app/body-rig.tsx",import.meta.url),"utf8");
for(const marker of ["rigEligible(f.side,f.name,image.src,image.full)","rigImageSafe(e.currentTarget)","data-rig-pose={rigPose}","<BodyRig src={image.src}"]){
 assert.ok(arena.includes(marker),"Falta integração: "+marker);
}
assert.match(arena,/data-rig-ready","false"/,"Falha precisa desligar rig");
assert.match(rig,/hasClearEdges\(ctx.getImageData/);
assert.match(rig,/RIG_PARTS\.map/);
for(const p of ["melee","cast","hit","idle","fall"])assert.ok(css.includes('data-rig-pose="'+p+'"'),"Pose faltante: "+p);
for(const part of ["head","torso","arm-front","arm-back","leg-front","leg-back"])assert.ok(css.includes("guild2d-rig-"+part));
assert.ok(css.includes("rig07-swing")&&css.includes("rig07-cast-front"));
assert.ok(css.includes(".guild-lite-mode .guild2d-unit .guild2d-body-rig{display:none!important}"));
assert.ok(!rig.includes("localStorage")&&!rig.includes("battle-round"),"Animação não pode alterar o jogo");
console.log("BLOCO 07B OK: seis partes, membros/poses/fallback, sem tocar nos saves.");
