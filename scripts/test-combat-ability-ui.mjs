import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const a=readFileSync(new URL("../app/arena-2d.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/arena-2d.css",import.meta.url),"utf8");
for(const x of ["abilityVisual","abilityAvailability","abilityHotkey",
 "const selectedAbility=abilities.find(a=>a.id===selectedAbilityId)||abilities[0]",
 "const availability=abilityAvailability(ability,{",
 "aria-keyshortcuts={abilityHotkey(i)}","onClick={()=>queueAbility(a)}",
 'data-state={availability.state}',"guild2d-quick-radial",
 "aria-pressed={selectedAbility?.id===a.id}","onClick={()=>setSelectedAbilityId(a.id)}",
 "aria-label=\"Detalhes da habilidade escolhida\"",
 "onClick={()=>queueAbility(selectedAbility)}",
 "act({type:\"battle-ability\"","abilityCooldownRemaining(battle,hero.id,a.id)"
 ]) assert.ok(a.includes(x),"Interface não integrada: "+x);
for(const x of ["guild2d-quick-key","guild2d-quick-caption","guild2d-quick-queued",
 "guild2d-quick-radial","guild2d-skill-inspector","guild2d-skill-confirm",
 'data-tone="ember"','data-tone="nature"','data-tone="supreme"',
 "min-height:48px","@media(prefers-reduced-motion:reduce)"])
 assert.ok(css.includes(x),"CSS ausente: "+x);
assert.ok(!a.includes("slotSymbol("),"Não usar ícones genéricos de alvos");
assert.ok(!a.includes('onClick={()=>queueAbility(a)}\n        '),"Grimório deve selecionar antes de enviar");
console.log("BLOCO_13B_OK: ícones sem placeholders, seleção, confirmação, atalhos, recarga, motor original.");
