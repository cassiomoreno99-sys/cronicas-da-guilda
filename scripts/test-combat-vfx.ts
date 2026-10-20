import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL(path,import.meta.url),"utf8");
const arena=read("../app/arena-2d.tsx"),vfx=read("../app/arena-vfx.tsx"),css=read("../app/arena-2d.css");
assert.match(arena,/ArenaVfx key=\{"vfx-"/,"Visual deve respeitar a identidade de cada ação");
assert.match(arena,/data-vfx="enhanced"/,"Camada visual não sinalizada");
for(const school of ["arcane","holy","nature","song","shadow","claw","steel","arrow","blade"]){
 assert.ok(css.includes(`data-school="${school}"`),"Falta cor da magia/arma "+school);
}
for(const phase of ["origin","flight","impact","particle","wave"]){
 assert.ok(vfx.includes("guild2d-vfx-"+phase),"Efeito sem camada "+phase);
}
assert.match(vfx,/aria-hidden="true"/,"Efeitos não devem interromper leitor de tela");
assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.guild2d-vfx/,"Respeitar movimento reduzido");
assert.ok(css.includes(".guild-lite-mode .guild2d-vfx-flight"),"Falta otimização para Android");
console.log("VFX MULTICAMADAS OK: conjuração, trajetória, impacto, 9 escolas, Android leve e acessibilidade.");
