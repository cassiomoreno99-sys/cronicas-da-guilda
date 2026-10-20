import assert from "node:assert/strict";
import type {AbilitySpec,BattleLog} from "../lib/game.ts";
import {lastVisualCue,skillForCue} from "../lib/combat-visual-cues.ts";
const ability=(name:string,effect:AbilitySpec["effect"],target:AbilitySpec["target"]="enemy"):AbilitySpec=>({
 id:name,name,description:"Teste",effect,target,cooldown:3
});
const fire=ability("Explosão Arcana","fireball","all-enemies");
const shield=ability("Muralha","fortress","self");
const ring:BattleLog[]=[
 {round:1,kind:"hit",actorId:"hero-1",targetId:"enemy-1",amount:12,text:"Espada causa 12 de dano."},
 {round:2,kind:"ability",actorId:"hero-1",targetId:"hero-1",text:"Aric usa Explosão Arcana."},
 {round:2,kind:"ability",actorId:"hero-1",targetId:"enemy-1",amount:22,text:"Explosão Arcana atinge Lobo: 22 de dano."},
 {round:2,kind:"ability",actorId:"hero-1",targetId:"enemy-2",amount:26,text:"Explosão Arcana atinge Troll: 26 de dano."},
 {round:2,kind:"status",actorId:"hero-1",text:"Aplicou vulnerável."}
];
let cue=lastVisualCue(ring);
assert.equal(cue?.index,3);
assert.equal(cue?.castOnly,false);
assert.equal(skillForCue(ring,cue,[fire])?.ability.effect,"fireball");
assert.deepEqual(skillForCue(ring,cue,[fire])?.targets,["enemy-1","enemy-2"]);
const defensive:BattleLog[]=[
 ...ring,
 {round:3,kind:"ability",actorId:"hero-1",targetId:"hero-1",text:"Aric usa Muralha."},
 {round:3,kind:"status",actorId:"hero-1",text:"Escudo formado."}
];
cue=lastVisualCue(defensive);
assert.equal(cue?.index,5,"Feitiço sem dano não deve reproduzir golpe anterior");
assert.equal(cue?.castOnly,true);
assert.equal(skillForCue(defensive,cue,[shield])?.ability.effect,"fortress");
const restored:BattleLog[]=[
 {round:10,kind:"ability",actorId:"hero-1",targetId:"hero-2",text:"Aric usa Muralha."}
];
assert.equal(lastVisualCue(restored)?.index,0);
assert.equal(lastVisualCue([{round:10,kind:"status",text:"sem ação"}]),undefined);
assert.equal(skillForCue(ring,cue,[fire]),undefined);
assert.equal(lastVisualCue([]),undefined);
console.log("EVENTOS VISUAIS OK: combo multi-alvo, defesa sem dano, identidade estável e ação real.");
