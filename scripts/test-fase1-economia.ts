import assert from "node:assert/strict";
import {newCampaign,normalizeCampaign,applyAction,missions,missionLocks,DAILY_CONTRACT_LIMIT,dailyContractsUsed,dailyContractsLeft,SEASON_DAYS,activeExpeditions,heroLeaderboard} from "../lib/game.ts";

function fresh(seed=404){
 const s=newCampaign(seed);s.event=null;return s;
}
function blocked(fn:()=>unknown,word:RegExp,label:string){
 assert.throws(fn,word,label);
}
function ready(state:ReturnType<typeof fresh>){
 // Equipe recuperada para um ensaio de estresse que isola as regras econômicas.
 state.heroes.forEach(h=>{h.energy=100;h.injuredUntil=0;});
 state.event=null;
 state.team=state.heroes.slice(0,4).map(h=>h.id);
 return state;
}
function start(s:ReturnType<typeof fresh>,index:number,slot:1|2|3=1){
 const m=missions(s)[index];
 const next=applyAction(s,{type:"mission",missionId:m.id,team:s.team,tactic:"balanced",expeditionSlot:slot,startedAt:1000});
 assert.equal(next.day,s.day,"A partida não pode avançar o dia.");
 assert.equal(next.expeditions.at(-1)?.missionId,m.id,"ID de missão não foi salvo.");
 return {s:next,m,exp:next.expeditions.at(-1)!};
}

{
 let s=fresh(101);assert.equal(dailyContractsLeft(s),3);
 const first=start(s,0);s=first.s;
 blocked(()=>applyAction(s,{type:"mission",missionId:first.m.id,team:s.team,tactic:"balanced"}),/tentado hoje|andamento/i,"Contrato duplicado enquanto está ativo.");
 blocked(()=>applyAction(s,{type:"next-day"}),/Conclua/i,"Avançou o dia com combate ativo.");
 s=applyAction(s,{type:"battle-auto",expeditionId:first.exp.id});
 assert.equal(dailyContractsUsed(s),1);
 const rewardGold=s.gold,won=s.expeditions.at(-1)!.battle.won;
 blocked(()=>applyAction(s,{type:"mission",missionId:first.m.id,team:s.team,tactic:"balanced"}),/tentado hoje/i,"Contrato duplicado depois da batalha.");
 assert.equal(s.gold,rewardGold,"Novo ouro foi obtido sem uma ação válida.");
 for(const index of [1,2]){
   s=ready(s);
   const r=start(s,index);s=applyAction(r.s,{type:"battle-auto",expeditionId:r.exp.id});
 }
 assert.equal(dailyContractsUsed(s),DAILY_CONTRACT_LIMIT);
 assert.equal(dailyContractsLeft(s),0);
 blocked(()=>applyAction(s,{type:"mission",missionId:missions(s)[3].id,team:s.team,tactic:"balanced"}),/Limite de 3/i,"Quarta missão indevida.");
 assert.ok(missionLocks(s,missions(s)[3]).some(t=>/Limite de 3/i.test(t)));
 assert.equal(new Set(s.dailyActions!.missionIds).size,3);
 const previousDay=s.day;s.event=null;s=applyAction(s,{type:"next-day"});
 assert.equal(s.day,previousDay+1);
 assert.equal(dailyContractsUsed(s),0);
 assert.ok(!missionLocks(s,missions(s)[0]).some(t=>/tentado hoje|Limite de 3/i.test(t)),"Expedições não renovaram.");
 console.log("CONTRATOS: duplicações bloqueadas antes/depois do combate, teto 3, dia manual, renovação OK (vencedor? "+won+").");
}
{
 let s=fresh(111);
 s=applyAction(s,{type:"train-hero",heroId:s.heroes[0].id});
 blocked(()=>applyAction(s,{type:"train-hero",heroId:s.heroes[0].id}),/já treinou/i,"Treino individual repetido no mesmo dia.");
 blocked(()=>applyAction(s,{type:"story-step",heroId:s.heroes[0].id}),/atividade/i,"História + treino no mesmo dia.");
 s=ready(s);s.gold=10000;
 blocked(()=>applyAction(s,{type:"train",team:s.team,tactic:"balanced"}),/já treinou/i,"Treino em equipe ignorou treinamento individual.");
 const first=s.heroes[0].id;
 s.event=null;s=applyAction(s,{type:"next-day"});s=ready(s);
 const earlier=s.heroes.find(h=>h.id===first)!.xp;
 s=applyAction(s,{type:"train-hero",heroId:first});
 assert.ok(s.heroes.find(h=>h.id===first)!.xp>earlier,"Treino não foi renovado no novo dia.");
 console.log("TREINAMENTO: anti-exploração, atividade por herói e liberação no dia seguinte OK.");
}
{
 let s=fresh(121);
 s.gold=100000;
 const h=s.heroes.slice(0,3).map(x=>x.id);
 s=applyAction(s,{type:"rival-battle",guildId:s.rivals[0].id,team:h});
 assert.equal(s.rivalBattleHistory.length,1);
 const gold=s.gold,history=s.rivalBattleHistory.length;
 blocked(()=>applyAction(s,{type:"rival-battle",guildId:s.rivals[1].id,team:h}),/confronto.*hoje/i,"Vitória rival repetida no mesmo dia.");
 assert.equal(s.gold,gold);assert.equal(s.rivalBattleHistory.length,history);
 const expanded=ready(s);
 for(let i=0;i<3;i++)expanded.heroes.push({...expanded.heroes[i],id:"extra-"+i,name:"Reforço "+i});
 const teams=[expanded.heroes.slice(0,3).map(h=>h.id),expanded.heroes.slice(3,6).map(h=>h.id),expanded.heroes.slice(6,9).map(h=>h.id)];
 blocked(()=>applyAction(expanded,{type:"guild-raid",teams}),/confronto.*hoje/i,"Raid depois da batalha rival ignorou limite.");
 let r=fresh(122);r.gold=100000;for(let i=0;i<3;i++)r.heroes.push({...r.heroes[i],id:"extra-"+i,name:"Reforço "+i});
 r=applyAction(r,{type:"guild-raid",teams:[r.heroes.slice(0,3).map(h=>h.id),r.heroes.slice(3,6).map(h=>h.id),r.heroes.slice(6,9).map(h=>h.id)]});
 blocked(()=>applyAction(r,{type:"rival-battle",guildId:r.rivals[0].id,team:r.heroes.slice(0,3).map(h=>h.id)}),/confronto.*hoje/i,"Desafio rival após raid ignorou limite.");
 console.log("GUILDAS: apenas um confronto diário, seja raid ou duelo; repetição sem recompensa OK.");
}
{
 let s=fresh(131);
 let z=start(s,0);s=applyAction(z.s,{type:"battle-auto",expeditionId:z.exp.id});
 const old=structuredClone(s);
 delete old.dailyActions!.missionDay;delete old.dailyActions!.missionIds;
 for(const e of old.expeditions)delete e.missionId;
 const restored=normalizeCampaign(old);
 assert.ok(dailyContractsUsed(restored)>=1,"Saves antigos perderam o histórico de hoje.");
 assert.ok(missionLocks(restored,missions(restored)[0]).length>0,"Save antigo liberou missão já concluída.");
 assert.equal(restored.heroes[0].level,s.heroes[0].level);
 assert.equal(restored.heroes[0].xp,s.heroes[0].xp);
 assert.equal(restored.gold,s.gold);
 assert.equal(restored.day,s.day);
 console.log("SAVE ANTIGO: missões do dia reconstruídas sem alterar ouro, nível, XP, ou dia.");
}
{
 // 12 campanhas x 60 dias; 720 dias, com progresso, renda, folha de pagamento
 // e 720 partidas completas. Mais de 2.000 ações/checagens de exploração.
 let fights=0,attemptsBlocked=0,endSeasons=0,netGold=0;
 for(let seed=0;seed<12;seed++){
   let s=fresh(400+seed*31);
   for(let day=1;day<=SEASON_DAYS;day++){
     s=ready(s);
     const board=missions(s),idx=(seed+day)%3;
     const base=s.gold,match=start(s,idx);
     const active=match.s;
     assert.equal(dailyContractsUsed(active),1);
     blocked(()=>applyAction(active,{type:"mission",missionId:match.m.id,team:active.team,tactic:"balanced"}),/tentado hoje/i,"Repetição ativa passou.");
     s=applyAction(active,{type:"battle-auto",expeditionId:match.exp.id});
     fights++;
     blocked(()=>applyAction(s,{type:"mission",missionId:match.m.id,team:s.team,tactic:"balanced"}),/tentado hoje/i,"Repetição concluída passou.");
     attemptsBlocked+=2;
     assert.equal(s.day,day);
     assert.ok(s.gold<=base+match.m.reward,"Recompensa indevida da missão.");
     assert.ok(s.gold>=0,"Economia negativa.");
     if(day<SEASON_DAYS){s.event=null;s=applyAction(s,{type:"next-day"});assert.equal(s.day,day+1);}
   }
   s.event=null;s=applyAction(s,{type:"next-day"});
   assert.equal(s.season,2);
   endSeasons++;
   netGold+=s.gold-1500;
 }
 assert.ok(fights>=720&&attemptsBlocked>=1440&&endSeasons===12);
 console.log("ESTRESSE 60 DIAS: "+endSeasons+" temporadas, "+fights+" batalhas completas e "+attemptsBlocked+" tentativas de repetição barradas. Saldo médio extra: "+Math.round(netGold/endSeasons)+" ouro.");
}
console.log("FASE 1 — PROGRESSÃO, ECONOMIA E SAVE: TODOS OS TESTES PASSARAM.");
