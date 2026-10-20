import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const arena=readFileSync(new URL("../app/arena-2d.tsx",import.meta.url),"utf8");
const fx=readFileSync(new URL("../app/combat-status-fx.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/arena-2d.css",import.meta.url),"utf8");
for(const term of ["reactionForEvent(evt,target)","reactionFrames(victimReaction",
 "lastStatusReaction(battle.log,all)","statusVisuals(f.statuses,quality.statusCount)",
 "<StatusAura statuses={aura}/>","<ReactionFlash key={\"reaction-\"+evtKey}",
 "data-reaction={struck?eventReaction?.kind", "data-status-count={aura.length}"]){
 assert.ok(arena.includes(term),"Falta integração: "+term);
}
for(const term of ["data-status={st.kind}","data-reaction={reaction.kind}",
 "data-feedback={variant}","aria-hidden=\"true\""])assert.ok(fx.includes(term),"Componente: "+term);
for(const k of ["poison","bleed","shield","ward","stun","regen","fall","critical","heal","resist","dodge"]){
 assert.ok(css.includes('data-status="'+k+'"')||css.includes('data-reaction="'+k+'"'),"Estilo de estado: "+k);
}
for(const k of ["pulse","float","ward","dizzy","core","wave","symbol","particle"]){
 assert.ok(css.includes("guild2d-"+(k==="pulse"||k==="float"||k==="ward"||k==="dizzy"?"status-":"react-")+k),"Animação "+k);
}
assert.ok(css.includes(".guild-lite-mode .guild2d-status-core"));
assert.ok(css.includes("@media(prefers-reduced-motion:reduce)"));
assert.ok(!fx.includes("localStorage")&&!fx.includes("battle-round"));
console.log("BLOCO_11B_OK: auras reais, recuo independente, escudos/esquivas e acessibilidade.");
