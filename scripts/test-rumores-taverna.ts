import assert from "node:assert/strict";
import {applyAction,newCampaign,normalizeCampaign,missions,tavernRumorHint,tavernRumorReady,GameRuleError,type Campaign,type Mission} from "../lib/game.ts";

let investigated=0, compared=0, completed=0, expired=0;
const prep=(seed:number,region=1)=>{
 const s=newCampaign(seed);s.event=null;s.region=region;s.activeRegion=region;s.gold=1500;
 s.heroes.forEach(h=>{h.energy=100;h.injuredUntil=0;});
 return s;
};
function embark(s:Campaign,m:Mission){
 return applyAction(s,{type:"mission",missionId:m.id,team:s.team,tactic:"balanced",expeditionSlot:1,startedAt:1700000000000});
}
for(let seed=0;seed<100;seed++){
 const base=prep(107700+seed*17,1+seed%12);
 const list=missions(base).slice(0,3);
 assert.equal(list.length,3);
 const m=list[seed%3];
 const uninvestigated=embark(base,m);
 const plainFighters=uninvestigated.expeditions[0].battle.combat!.fighters.filter(f=>f.side==="hero");
 const initialGold=base.gold;
 let s=applyAction(base,{type:"investigate-rumor",missionId:m.id});
 assert.equal(s.gold,initialGold,"Investigar rumor cobrou ouro");
 assert.equal(s.day,base.day);
 assert.equal(s.transaction,base.transaction,"Rumor gratuito criou transação de cobrança");
 assert.ok(tavernRumorReady(s,m.id));
 assert.equal(tavernRumorReady(s,list[(seed%3+1)%3].id),false);
 assert.ok(tavernRumorHint(m).length>25);
 assert.throws(()=>applyAction(s,{type:"investigate-rumor",missionId:m.id}),GameRuleError,"Investigou 2 rumores no dia");
 assert.throws(()=>applyAction(s,{type:"investigate-rumor",missionId:list[(seed%3+1)%3].id}),GameRuleError);
 assert.throws(()=>applyAction(base,{type:"investigate-rumor",missionId:"boato-falso"}),GameRuleError);
 assert.deepEqual(s.tavernRumor,{day:base.day,missionId:m.id,used:false});
 investigated++;
 // Relê save antes de entrar em combate. Não pode apagar a investigação.
 s=normalizeCampaign(JSON.parse(JSON.stringify(s)));
 assert.ok(tavernRumorReady(s,m.id));
 s=embark(s,m);
 assert.equal(s.tavernRumor?.used,true);
 assert.ok(s.expeditions[0].battle.log.some(x=>/Informações da Taverna utilizadas/.test(x.text)));
 const fighters=s.expeditions[0].battle.combat!.fighters.filter(f=>f.side==="hero");
 for(let i=0;i<fighters.length;i++){
  assert.ok(Math.abs(fighters[i].attack/plainFighters[i].attack-1.1)<1e-9,"O rumor não aumentou ataque");
  assert.ok(Math.abs(fighters[i].magic/plainFighters[i].magic-1.1)<1e-9,"O rumor não aumentou magia");
  assert.ok(Math.abs(fighters[i].defense/plainFighters[i].defense-1.05)<1e-9,"O rumor não aumentou defesa");
 }
 compared++;
 if(seed%5===0){
  s=applyAction(s,{type:"battle-auto",expeditionId:s.expeditions[0].id});
  assert.notEqual(s.expeditions[0].battle.status,"active");
  assert.equal(s.tavernRumor?.used,true);
  s.event=null;
  s=applyAction(s,{type:"next-day"});
  assert.equal(s.tavernRumor,undefined,"O rumor sobreviveu depois da troca de dia");
  assert.ok(s.gold>=0);
  const next=missions(s)[0];
  s=applyAction(s,{type:"investigate-rumor",missionId:next.id});
  assert.ok(tavernRumorReady(s,next.id),"O informante não voltou no dia seguinte");
  completed++;expired++;
 }
}
{
 let s=prep(309991);
 const [m,second]=missions(s);
 s=applyAction(s,{type:"investigate-rumor",missionId:m.id});
 s=embark(s,second);
 assert.equal(s.tavernRumor?.used,false,"Investigação foi gasta na missão errada");
 assert.equal(s.expeditions[0].battle.log.some(x=>/Informações da Taverna utilizadas/.test(x.text)),false);
 s=applyAction(s,{type:"battle-auto",expeditionId:s.expeditions[0].id});
 s.heroes.forEach(h=>{h.energy=100;h.injuredUntil=0;});s.event=null;
 s.team=s.heroes.slice(0,4).map(h=>h.id); // equipe da segunda missão após a primeira já ter terminado
 s=embark(s,m);
 assert.equal(s.tavernRumor?.used,true,"Investigação não foi usada na missão correta");
}
console.log("RUMORES: "+investigated+" investigações grátis; "+compared+" comparações de dano, magia e defesa; "+completed+" confrontos completos e "+expired+" viradas de dia. Salvamento e bloqueios aprovados.");
