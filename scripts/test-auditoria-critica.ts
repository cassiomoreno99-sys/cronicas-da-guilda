import assert from "node:assert/strict";
import {applyAction,missions,newCampaign,normalizeCampaign} from "../lib/game.ts";

function fresh(seed:number){const s=newCampaign(seed);s.event=null;return s;}
{
 let s=fresh(3200),traveler=s.heroes.at(-1)!;
 s=applyAction(s,{type:"start-journey",heroId:traveler.id,duration:3});
 s.heroes.find(h=>h.id===traveler.id)!.energy=20;
 s.heroes[0].energy=24;
 const before=s.gold,day=s.day,journeyEnergy=20;
 const healed=applyAction(s,{type:"rest"});
 assert.equal(healed.gold,before-8,"Descanso não debitou o valor anunciado na Taverna");
 assert.equal(healed.day,day,"Descanso passou o dia indevidamente");
 assert.equal(healed.heroes[0].energy,64,"Descanso não recuperou 40 de energia");
 assert.equal(healed.heroes.find(h=>h.id===traveler.id)!.energy,journeyEnergy,"Viajante se recuperou na sede à distância");
 assert.equal(healed.dailyActions.restDay,day);
 assert.throws(()=>applyAction(healed,{type:"rest"}),/já descansou/);
 const broke=fresh(3210);broke.gold=7;
 assert.throws(()=>applyAction(broke,{type:"rest"}),/8 ouro/);
 const freshHero=fresh(3250);freshHero.heroes[0].energy=24;
 assert.throws(()=>applyAction(freshHero,{type:"train-hero",heroId:freshHero.heroes[0].id}),/25% de energia/);
 const can=fresh(3251);can.heroes[0].energy=25;
 const trained=applyAction(can,{type:"train-hero",heroId:can.heroes[0].id});
 assert.equal(trained.heroes[0].energy,8,"Treino com 25 de energia deveria gastar 17");
 console.log("DESCANSO/TREINO OK: 8 ouro; uma vez por dia; viajantes; 24 vs 25 de energia.");
}
for(let seed=0;seed<18;seed++){
 let s=fresh(43000+seed*43);
 s=applyAction(s,{type:"mission",missionId:missions(s)[0].id,team:s.team,tactic:"balanced",expeditionSlot:1,startedAt:1700000000000});
 const id=s.expeditions[0].id;
 const heroIds=new Set(s.heroes.map(h=>h.id));
 if(seed%2===0){
  s=applyAction(s,{type:"battle-auto-abilities",expeditionId:id,enabled:false});
  const revived=normalizeCampaign(JSON.parse(JSON.stringify(s)));
  assert.equal(revived.expeditions[0].battle.combat?.autoAbilities,false);
  s=revived;
 }
 s=applyAction(s,{type:"battle-auto",expeditionId:id});
 const battle=s.expeditions.find(e=>e.id===id)!.battle;
 assert.notEqual(battle.status,"active");
 if(seed%2===0){
  const automaticallyCast=battle.log.filter(e=>e.kind==="ability"&&e.actorId&&heroIds.has(e.actorId));
  assert.equal(automaticallyCast.length,0,"Pular resultado reativou a IA de habilidades após desligamento.");
 }
}
console.log("COMBATE OK: 18 confrontos automáticos com e sem habilidades manuais, sem reativar a IA.");
