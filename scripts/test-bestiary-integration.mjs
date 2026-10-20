import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const arena=readFileSync(new URL("../app/arena-2d.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/arena-2d.css",import.meta.url),"utf8");
for(const token of ["lateEnemyVisual(f.name)","!lateIdentity&&rigEligible",
 'data-bestiary-motion={lateIdentity?.motion||"classic"}',
 'data-bestiary-tone={lateIdentity?.tone||"classic"}',
 'data-bestiary-slug={lateIdentity?.slug||"classic"}',
 "enemyArtSource(f.name)"])assert.ok(arena.includes(token),"Ausente: "+token);
for(const type of ["humanoid","beast","amorphous","construct","floating"])
 assert.ok(css.includes('data-bestiary-motion="'+type+'"'),"Movimento "+type);
for(const name of ["stance","beast","ooze","construct","float","ambient"])
 assert.ok(css.includes("@keyframes guild14-"+name));
assert.ok(css.includes(".guild-lite-mode .guild2d-stage .guild2d-unit[data-bestiary-motion]"));
assert.ok(css.includes("@media(prefers-reduced-motion:reduce)"));
console.log("BLOCO_14B_INTEGRACAO_OK: cinco movimentos, fallback e acessibilidade.");
