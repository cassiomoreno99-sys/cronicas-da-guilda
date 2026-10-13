import assert from "node:assert/strict";
import { newCampaign, normalizeCampaign, applyAction, academyCandidateChance, type Campaign } from "../lib/game.ts";

let original = newCampaign(381077);
const oldSave = structuredClone(original) as Campaign;
delete (oldSave.academy as unknown as {candidates?: unknown}).candidates;
delete (oldSave.academy as unknown as {reserve?: unknown}).reserve;
const migrated = normalizeCampaign(oldSave);
assert.deepEqual(migrated.academy.candidates, [], "Save antigo mantém turma vazia");
assert.deepEqual(migrated.academy.reserve, [], "Save antigo mantém reserva vazia");
let s = applyAction(original, {type:"upgrade-hq", building:"academy"});
s.gold = 100000; // Verifica a mecânica de formação independentemente do orçamento inicial
s = applyAction(s, {type:"academy-open-class"});
assert.equal(s.academy.candidates.length, 10, "Turma deve ter exatamente dez cidadãos");
assert.equal(new Set(s.academy.candidates.map(c=>c.id)).size, 10);
assert.equal(new Set(s.academy.candidates.map(c=>c.name)).size, 10);
assert.throws(()=>applyAction(s,{type:"academy-open-class"}), /turma.*já foi aberta/i);
const first = s.academy.candidates[0].id;
const before = academyCandidateChance(s,s.academy.candidates[0]);
s = applyAction(s,{type:"academy-focus",candidateId:first});
assert.ok(academyCandidateChance(s,s.academy.candidates[0]) > before, "Treino dedicado aumenta a chance");
assert.throws(()=>applyAction(s,{type:"academy-focus",candidateId:first}), /hoje/i);
for(let day=0;day<28;day++){
  if(s.event){
    const choice = s.event.choices.find(c=>["charge","refuse","counter"].includes(c.id)) || s.event.choices.find(c=>!c.cost) || s.event.choices[0];
    s = applyAction(s,{type:"event",eventId:s.event.id,choiceId:choice.id});
  }
  s = applyAction(s,{type:"rest"});
}
assert.equal(s.season, 2, "A formação ocorre no encerramento de 28 dias");
assert.equal(s.academy.lastGraduation?.season, 1);
assert.equal(s.academy.lastGraduation?.evaluated, 10);
assert.ok((s.academy.lastGraduation?.approved.length||0)<=2,"Nunca formar mais que dois");
assert.equal(s.academy.candidates.length, 0, "Turma não reaparece na temporada seguinte");
assert.equal(s.academy.reserve.length, s.academy.lastGraduation?.approved.length,"Graduados aguardam na reserva");
assert.ok(s.academy.reserve.every(h=>h.trait.includes("Academia")));
if(s.academy.reserve.length){
  const graduate=s.academy.reserve[0];
  const count=s.heroes.length;
  s=applyAction(s,{type:"academy-admit",heroId:graduate.id});
  assert.equal(s.heroes.length,count+1);
  assert.ok(s.heroes.some(h=>h.id===graduate.id));
}
const reserveCount=s.academy.reserve.length;
s=applyAction(s,{type:"academy-open-class"});
assert.equal(s.academy.candidates.length,10,"Turma nova desbloqueada após fim da temporada");
assert.equal(s.academy.reserve.length,reserveCount,"Reserva preservada ao abrir nova turma");
console.log("ACADEMIA: 10 cidadãos, chance %, foco diário, aprovação máxima de 2, temporada, reserva, admissão e saves antigos OK.");
