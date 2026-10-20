import assert from "node:assert/strict";
import {abilityVisual,abilityAvailability,abilityHotkey} from "../lib/combat-ability-presentation.ts";
import type {AbilityEffect,AbilityTarget} from "../lib/game.ts";
const effects:AbilityEffect[]=["challenge","fireball","restore","venom","pinning","aegis","chi","drain","renew","anthem","execution","storm","lifebloom","sanctuary","fortress","control","supreme"];
const targets:AbilityTarget[]=["self","ally","enemy","all-allies","all-enemies"];
for(const effect of effects)for(const target of targets){
 const v=abilityVisual({effect,target,evolved:effect==="supreme"});
 assert.ok(v.tone&&v.glyph&&v.family&&v.targetLabel&&v.legend);
}
const ab={effect:"fireball" as const,cooldown:3,target:"all-enemies" as const};
assert.deepEqual(abilityAvailability(ab,{cooldown:0}).state,"ready");
assert.equal(abilityAvailability(ab,{cooldown:0}).disabled,false);
assert.equal(abilityAvailability(ab,{cooldown:2}).state,"cooldown");
assert.equal(abilityAvailability(ab,{cooldown:2}).percent,200/3);
assert.equal(abilityAvailability(ab,{cooldown:8}).percent,100);
assert.equal(abilityAvailability(ab,{cooldown:-9}).cooldown,0);
assert.equal(abilityAvailability(ab,{cooldown:NaN}).percent,0);
assert.equal(abilityAvailability(ab,{cooldown:2,queued:true}).state,"queued");
assert.equal(abilityAvailability(ab,{cooldown:2,busy:true}).state,"busy");
assert.equal(abilityAvailability({effect:"restore",cooldown:3,target:"ally"},{cooldown:0,hasAlly:false}).state,"no-target");
assert.equal(abilityAvailability({effect:"pinning",cooldown:3,target:"enemy"},{cooldown:0,hasEnemy:false}).state,"no-target");
assert.equal(abilityAvailability({effect:"restore",cooldown:3,target:"ally"},{cooldown:0,hasAlly:true}).state,"ready");
assert.equal(abilityAvailability({effect:"supreme",cooldown:9999,target:"self"},{cooldown:9999}).stateLabel,"Poder já utilizado nesta expedição");
assert.deepEqual([0,1,2,3,4,5].map(abilityHotkey),["1","2","3","4","5",undefined]);
console.log("BLOCO_13A_OK: 17 efeitos, cinco alvos, recargas reais, estados de ordem e atalhos.");
