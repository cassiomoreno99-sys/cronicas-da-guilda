import assert from "node:assert/strict";
import {arenaMovement} from "../lib/combat-arena-movement.ts";
import type {MotionSchool} from "../lib/combat-choreography.ts";
const schools:MotionSchool[]=["blade","steel","shadow","claw","arrow","arcane","holy","song","nature"];
for(const width of [320,360,390,412,768,1440]){
 for(const school of schools){
  for(const reverse of [false,true]){
   const stage={width,height:570};
   const from={x:width*(reverse?.85:.19),y:205};
   const to={x:width*(reverse?.19:.85),y:330};
   const a=arenaMovement({from,to,stage,actor:{width:Math.min(125,width*.22),height:145},
    target:{width:Math.min(135,width*.22),height:155},school,kind:"hit",critical:false});
   assert.equal(a.actorFrames.length,9);assert.equal(a.shadowFrames.length,9);
   assert.deepEqual(a.actorFrames.map(f=>f.offset),[0,.1,.22,.45,.54,.61,.77,.92,1]);
   assert.deepEqual(a.actorFrames[4].transform,a.actorFrames[5].transform,"Hit-stop precisa ficar parado");
   assert.ok(a.advance<=width*.48+1);
   assert.ok(a.advance>=0);
   assert.ok(a.actorFrames.every(f=>!String(f.transform).includes("NaN")));
   if(["arrow","arcane","holy","song","nature"].includes(school))assert.equal(a.advance,0,"À distância não deve correr até o inimigo");
   else assert.ok(a.advance>0,"Corpo a corpo precisa se aproximar no corredor livre");
   assert.equal(a.actorFrames[0].transform,a.actorFrames.at(-1).transform,"Tem de retornar à formação");
   assert.equal(a.shadowFrames[0].transform,a.shadowFrames.at(-1).transform,"Sombra precisa retornar");
  }
 }
}
// Manter distância real entre as bordas; alvos adjacentes não podem se sobrepor.
const adjacent=arenaMovement({from:{x:105,y:220},to:{x:170,y:230},stage:{width:320,height:500},
 actor:{width:74,height:145},target:{width:70,height:145},school:"blade",kind:"hit",critical:false});
assert.equal(adjacent.advance,0,"Unidades adjacentes devem atacar sem invadir");
// Corredor bloqueado diminui a investida em vez de atravessar uma unidade.
const blocked=arenaMovement({from:{x:100,y:250},to:{x:330,y:250},
 stage:{width:440,height:500},actor:{width:90,height:160},target:{width:90,height:160},
 school:"steel",kind:"hit",critical:true,obstacles:[{x:204,y:250,width:100,height:150}]});
assert.ok(blocked.advance<130,"Rota deve evitar aliada entre atacante e alvo");
// Pulo animal, aproximação lateral do ladino e conjuração não repetem o mesmo movimento.
const b={from:{x:85,y:220},to:{x:300,y:270},stage:{width:400,height:500},
 actor:{width:90,height:150},target:{width:85,height:150},kind:"hit",critical:false};
assert.equal(arenaMovement({...b,school:"claw"}).kind,"pounce");
assert.equal(arenaMovement({...b,school:"shadow"}).kind,"sidestep");
assert.equal(arenaMovement({...b,school:"arcane"}).kind,"cast");
assert.ok(arenaMovement({...b,school:"claw"}).lift>arenaMovement({...b,school:"blade"}).lift);
console.log("BLOCO 08A OK: 6 telas, 9 escolas, ida/volta, salto, desvio e colisões.");
