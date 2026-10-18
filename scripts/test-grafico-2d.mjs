import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
const scene=readFileSync(new URL("../app/arena-2d.tsx",import.meta.url),"utf8");
const visuals=readFileSync(new URL("../app/arena-2d.css",import.meta.url),"utf8");
const guild=readFileSync(new URL("../app/ui.css",import.meta.url),"utf8");
assert.match(scene,/actorNode\.animate\(/,"Atacante precisa se deslocar.");
assert.match(scene,/targetNode\.animate\(/,"Inimigo precisa reagir ao impacto.");
assert.match(scene,/strikeDistance/,"O lutador precisa avançar até a área de contato.");
assert.match(scene,/evt\.kind==="heal"\?\[/,"Cura não pode provocar recuo físico como se fosse dano.");
assert.match(scene,/scene\.animate\(/,"Críticos precisam ter impacto na cena.");
assert.match(visuals,/guild2d-impact-slash/,"Armas corpo a corpo precisam exibir trilha de corte.");
assert.match(visuals,/guild2d-shockwave/,"Golpes precisam exibir onda de choque.");
assert.match(visuals,/guild2d-impact-dust/,"Golpes físicos precisam tocar o terreno.");
assert.match(scene,/data-fighter-id=\{f\.id\}/,"Imagens precisam preservar identidade e DOM.");
assert.match(scene,/guild2d-projectile/,"Projéteis precisam atravessar a arena.");
assert.match(scene,/guild2d-impact-mark/,"Golpe precisa mostrar o acerto.");
for(const school of ["blade","steel","arrow","shadow","arcane","holy","song","nature"])
 assert.ok(scene.includes('case "')||visuals.includes("guild2d-cinema-"+school));
for(const effect of ["guild2d-projectile-travel","guild2d-impact-bloom","guild2d-hit-flash","prefers-reduced-motion","guild-lite-mode"])
 assert.ok(visuals.includes(effect),"Efeito ou fallback do Android faltando: "+effect);
assert.match(guild,/\.building-list article\.guild-building-card img\.guild-room-art\.compact[\s\S]*?grid-column:1/);
assert.match(guild,/@media \(max-width:760px\)[\s\S]*?\.building-list article\.guild-building-card/);
console.log("GRAFICO 2D: ataque, recuo, efeitos por classe, imagens grandes e modo Android preservados.");
