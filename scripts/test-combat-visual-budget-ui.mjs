import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../",import.meta.url);
const arena=readFileSync(new URL("app/arena-2d.tsx",root),"utf8");
const css=readFileSync(new URL("app/arena-2d.css",root),"utf8");
const files=["app/physical-strike-fx.tsx","app/advanced-spell-fx.tsx","app/combat-spectacle-fx.tsx","app/arena-vfx.tsx"];
for(const f of files){
 const x=readFileSync(new URL(f,root),"utf8");
 assert.ok(x.includes("particleCount"),"Budget de partículas ausente: "+f);
 assert.ok(x.includes("Array.from({length:"),"Partículas geradas sem limite: "+f);
}
for(const term of ["resolvedVisualBudget","qualityOverride","quality=resolvedVisualBudget",
 "quality.particles","quality.statusCount","quality.rig","quality.cameraShake",
 "particleBudget(spell.particleCount,quality)","particleBudget(spectacle.points,quality)",
 "particleBudget(physicalAttack.critical?9:6,quality)","areaBudget(areaTargets,quality)",
 'data-quality={quality.quality}',"guild2d-quality-control","window.addEventListener(\"resize\"",
 'reduce.addEventListener("change",refresh)'])assert.ok(arena.includes(term),"15B arena: "+term);
for(const term of ['[data-quality="economy"]','[data-quality="static"]',
 ".guild2d-body-rig{display:none!important}","animation:none!important",
 "will-change:auto!important",".guild2d-quality-control:focus-visible"])
 assert.ok(css.includes(term),"15B CSS: "+term);
assert.ok(!arena.includes("localStorage.setItem"));
console.log("BLOCO_15B_OK: quatro camadas VFX com budget DOM, sombra e rig econômicos sem persistência.");
