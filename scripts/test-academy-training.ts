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
for(let day=0;day<60;day++){
  if(s.event){
    const choice = s.event.choices.find(c=>["charge","refuse","counter"].includes(c.id)) || s.event.choices.find(c=>!c.cost) || s.event.choices[0];
    s = applyAction(s,{type:"event",eventId:s.event.id,choiceId:choice.id});
  }
  s = applyAction(s,{type:"next-day"});
}
assert.equal(s.season, 2, "A formação ocorre no encerramento de 60 dias");
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

// Regressão: formados não admitidos continuam na reserva por várias temporadas,
// mas agora o jogador pode dispensá-los individualmente.
{
  const campaign = newCampaign(449200);
  const rejected = { ...structuredClone(campaign.heroes[0]), id: "academia-1-1", name: "Formado Antigo", trait: "Revelado pela Academia" };
  const retained = { ...structuredClone(campaign.heroes[1]), id: "academia-2-1", name: "Formada Promissora", trait: "Gênio formado na Academia" };
  campaign.academy.reserve = [rejected, retained];
  const levelBefore = campaign.heroes[0].level;
  let loaded = normalizeCampaign(structuredClone(campaign));
  for (let i = 0; i < 4; i++) {
    loaded.day += 60;
    loaded.season += 1;
    loaded = normalizeCampaign(structuredClone(loaded));
  }
  assert.equal(loaded.academy.reserve.length, 2, "Quatro temporadas não devem apagar formados sem autorização.");
  const dismissed = applyAction(loaded, { type:"academy-dismiss",heroId:rejected.id });
  assert.equal(dismissed.academy.reserve.length, 1, "Dispensa deve remover somente um formado da lista.");
  assert.equal(dismissed.academy.reserve[0].id, retained.id, "Dispensa não pode remover outro formado.");
  assert.equal(dismissed.heroes.length, loaded.heroes.length, "Dispensa não pode alterar a Guilda.");
  assert.equal(dismissed.heroes[0].level, levelBefore, "Dispensa não pode rebaixar heróis.");
  assert.ok(dismissed.journal[0].text.includes(rejected.name), "Dispensa deve ficar registrada no diário.");
  assert.throws(() => applyAction(dismissed,{ type:"academy-dismiss",heroId:rejected.id }), /reserva/i,
    "Não pode dispensar a mesma pessoa duas vezes.");
  assert.throws(() => applyAction(dismissed,{ type:"academy-dismiss",heroId:campaign.heroes[0].id }), /reserva/i,
    "Não pode dispensar herói que já pertence à Guilda.");
  assert.throws(() => applyAction(dismissed,{ type:"academy-dismiss",heroId:"desconhecido" }), /reserva/i,
    "Não pode dispensar IDs desconhecidos.");
  const next = applyAction(dismissed,{ type:"academy-admit",heroId:retained.id });
  assert.equal(next.academy.reserve.length, 0, "O outro formado ainda pode ser admitido.");
  assert.equal(next.heroes.length, loaded.heroes.length + 1, "Admissão continua funcionando.");
  const reloaded = normalizeCampaign(structuredClone(next));
  assert.equal(reloaded.academy.reserve.length, 0, "Dispensa e admissão devem persistir no save.");
}

console.log("ACADEMIA: 10 cidadãos, chance %, foco diário, aprovação máxima de 2, temporada, reserva, admissão , saves antigos e dispensa após quatro temporadas OK.");
