import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const s=readFileSync(new URL("../app/arena-2d.tsx",import.meta.url),"utf8");
const fx=readFileSync(new URL("../app/physical-strike-fx.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/arena-2d.css",import.meta.url),"utf8");
for(const fragment of [
 "state.chest.find(item=>item.equippedTo===actor.id","CATALOG_BY_ID[equipped.key]",
 "isPhysicalStrike(evt,actor,cueSkill?.ability.effect",
 "physicalStrikePlan(physicalStyle(actor,",
 "data-physical-style={acting?physicalAttack?.style",
 '<PhysicalStrikeFX',
 "key={\"physical-\"+evtKey}",
 "visualPath&&!physicalAttack&&<ArenaVfx",
 "visualPath&&!physicalAttack&&<div key={\"cinema-\"+evtKey}"
 ]) assert.ok(s.includes(fragment),"Não integrado: "+fragment);
for(const fragment of ["data-style={attack.style}","data-ranged={attack.ranged}","data-variant={attack.variant}",
 "guild2d-physical-contact","guild2d-physical-windup","guild2d-physical-arrow",
 "guild2d-physical-spark","aria-hidden=\"true\""])assert.ok(fx.includes(fragment),"Visual ausente: "+fragment);
for(const style of ["sword","axe","spear","hammer","daggers","bow","claws","bite","tail"]){
 assert.ok(css.includes('data-style="'+style+'"')||style==="sword","CSS da arma ausente: "+style);
}
for(const name of ["prepare","cleave","stab","rend","shock","arrow","arm-axe","arm-hammer","arm-dagger","arm-bow"]){
 assert.ok(css.includes("physical09-"+name),"Animação não implementada: "+name);
}
assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.guild2d-physical-strike\{display:none!important\}\}/);
assert.ok(!fx.includes("localStorage")&&!fx.includes("battle-ability"),"Componente visual não pode alterar estado");
console.log("BLOCO 09B OK: equipamento real, efeitos físicos isolados, 10 golpes, rig e acessibilidade.");
