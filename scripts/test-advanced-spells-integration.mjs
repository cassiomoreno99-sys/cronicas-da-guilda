import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const arena=readFileSync(new URL("../app/arena-2d.tsx",import.meta.url),"utf8");
const fx=readFileSync(new URL("../app/advanced-spell-fx.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/arena-2d.css",import.meta.url),"utf8");
for(const fragment of [
 "spellPlan({","fighter:actor,event:evt,ability:cueSkill?.ability",
 "spellImpactPoints(areaTargets)","physicalAttack?undefined:spellPlan",
 'visualPath&&!physicalAttack&&!spell&&!spectacle&&<div key={"cinema-"+evtKey}',
 'visualPath&&!physicalAttack&&!spell&&!spectacle&&<ArenaVfx',
 'visualPath&&spell&&<AdvancedSpellFX',
 'key={"magic10-"+evtKey}'
 ])assert.ok(arena.includes(fragment),"Integração não encontrada: "+fragment);
for(const fragment of ["data-family={plan.family}","data-motion={plan.motion}",
 "guild2d-magic-origin","guild2d-magic-impact","guild2d-magic-projectile",
 "guild2d-magic-area","guild2d-magic-barrier","guild2d-magic-lightning",
 "guild2d-magic-helix","guild2d-magic-particle",
 "plan.particleCount","aria-hidden=\"true\""]){
 assert.ok(fx.includes(fragment),"Camada mágica faltando: "+fragment);
}
for(const family of ["flame","storm","frost","shadow","radiant","verdant","ward","resonance"]){
 assert.ok(css.includes('data-family="'+family+'"'),"Escola mágica faltando: "+family);
}
for(const name of ["sigil","inner","glyph","charge","flight","impact","ring","shield","burst","strike","helix","particle","multi"]){
 assert.ok(css.includes("@keyframes magic10-"+name),"Quadro de conjuração ausente: "+name);
}
assert.ok(css.includes(".guild-lite-mode .guild2d-magic"),"Falta otimização Android");
assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.guild2d-advanced-spell\{display:none!important\}\}/);
assert.ok(!fx.includes("localStorage")&&!fx.includes("battle-ability"),"FX não pode alterar o motor");
console.log("BLOCO_10B_OK: escolas e gestos independentes, integração exclusiva e modo leve.");
