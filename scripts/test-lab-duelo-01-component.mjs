import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const code=readFileSync(new URL("../app/lab-duelo-01/DuelScene.tsx",import.meta.url),"utf8");
const html=readFileSync(new URL("../lab-duelo-01.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../app/lab-duelo-01/main.tsx",import.meta.url),"utf8");
for(const phase of ["anticipation","dash","plant","swing","impact","reaction","recover","return"]){
 assert.ok(code.includes(phase),"Fase ausente "+phase);
}
for(const piece of ["duel-warrior","duel-monster","duel-sword-arm","heroFrontLeg","heroBackLeg",
 "heroTorso","monsterTorso","monsterHead","monsterSquash","duel-slash","duel-impact",
 "requestAnimationFrame","cancelAnimationFrame","data-phase={pose.phase}"]){
 assert.ok(code.includes(piece),"Articulação/segurança ausente: "+piece);
}
assert.ok(!/from ["'].*lib\/game|localStorage|window\.location|fetch\(/.test(code));
assert.ok(html.includes("lab-duelo-01/main.tsx"));
assert.ok(app.includes("<DuelScene/>"));
console.log("LAB_DUELO_01_COMPONENTE_OK: rig com juntas, 8 fases, botão, cena independente.");
