import assert from "node:assert/strict";
import {reactionForEvent,statusVisuals,reactionFrames,lastStatusReaction} from "../lib/combat-reactions.ts";
import type {BattleLog,BattleFighter} from "../lib/game.ts";
const target={id:"e1",hp:24,maxHp:100};
const react=(kind:BattleLog["kind"],text:string,amount=12,targetHp=24)=>
 reactionForEvent({kind,text,amount,targetId:"e1",targetHp},target);
assert.equal(react("hit","Golpe de espada").kind,"hurt");
assert.equal(react("critical","Acerto crítico").kind,"critical");
assert.equal(react("fall","Fora de combate",24,0).kind,"fall");
assert.equal(react("heal","Recupera PV").kind,"heal");
assert.equal(react("ability","Santuário cura o alvo").kind,"heal");
assert.equal(react("status","Veneno afeta o alvo").kind,"poison");
assert.equal(react("status","Sangramento afeta o alvo").kind,"bleed");
assert.equal(react("status","Regeneração recupera PV").kind,"regen");
assert.equal(react("status","Lobo absorveu 9 de dano com o escudo").kind,"shield");
assert.equal(react("status","Lobo se esquivou").kind,"dodge");
assert.equal(react("status","Lobo está atordoado").kind,"stun");
assert.equal(react("status","Lobo resiste graças ao juramento").kind,"resist");
assert.equal(react("status","Outro status"),undefined);
assert.equal(react("hit","Dano zero",0),undefined);
assert.equal(reactionForEvent({kind:"hit",amount:20,targetId:"x",text:"Outro"},target),undefined);
const status=statusVisuals([
 {kind:"shield",rounds:2,amount:22},{kind:"poison",rounds:3,amount:6},
 {kind:"stun",rounds:1},{kind:"regen",rounds:3,amount:12},
 {kind:"shield",rounds:0,amount:0},{kind:"inspired",rounds:2}
]);
assert.deepEqual(status.map(x=>x.kind),["poison","stun","shield","regen"]);
assert.equal(statusVisuals([{kind:"shield",rounds:2,amount:0}]).length,0);
const fighters=[{id:"e1",name:"Lobo",side:"enemy",hp:24,maxHp:100}] as BattleFighter[];
const log:BattleLog[]=[{round:1,text:"Ataque",kind:"hit",actorId:"h1",targetId:"e1",amount:11},
 {round:1,text:"Lobo absorveu 9 de dano com o escudo.",kind:"status",targetId:"e1",amount:9}];
assert.equal(lastStatusReaction(log,fighters)?.reaction.kind,"shield");
for(const k of ["hurt","critical","fall","heal","shield","dodge","stun","poison","bleed","regen","resist"] as const){
 const frames=reactionFrames({kind:k,targetId:"e1",amount:26,critical:k==="critical",lethal:k==="fall"},1,{width:145,height:230});
 assert.ok(frames.length>=4);
 assert.equal(frames[0].offset,0);assert.equal(frames.at(-1)?.offset,1);
 assert.ok(frames.every(x=>!String(x.transform).includes("NaN")));
}
assert.equal(reactionFrames({kind:"hurt",targetId:"e1",amount:30,critical:false,lethal:false},1,{width:80,height:100})[0].transform,
 reactionFrames({kind:"hurt",targetId:"e1",amount:30,critical:false,lethal:false},-1,{width:80,height:100})[0].transform);
console.log("BLOCO_11A_OK: dano, crítico, queda, cura, status, escudo, esquiva e poses reais.");
