import assert from "node:assert/strict";
import {choreographyPlan,type MotionSchool} from "../lib/combat-choreography.ts";
const schools:MotionSchool[]=["blade","steel","shadow","claw","arrow","arcane","holy","song","nature"];
for(const width of [320,360,390,412,768,1440]){
 for(const school of schools){
  const result=choreographyPlan({school,kind:"hit",from:{x:19,y:36},to:{x:85,y:59},width,height:570,duration:820,critical:false});
  assert.equal(result.actorFrames.length,9);
  assert.equal(result.actorFrames[4].offset,.54);
  assert.equal(result.actorFrames[5].offset,.61,"Pausa visual de impacto ausente");
  assert.ok(Math.abs(result.dx)<=width*.64,"Deslocamento maior que a arena");
  assert.ok(result.recoveryDuration>200);
  assert.ok(result.targetFrames.every(frame=>typeof frame.transform==="string"));
  assert.ok(result.ranged===["arrow","arcane","holy","song","nature"].includes(school));
 }
 const heal=choreographyPlan({school:"holy",kind:"heal",from:{x:19,y:36},to:{x:35,y:51},width,height:570,duration:900,critical:false});
 assert.equal(heal.isHeal,true);
 assert.equal(heal.healFrames.length,3);
}
console.log("COREOGRAFIA FLUIDA OK — hit-stop, alcance, contra-ataque, cura e nove escolas em 6 telas.");
