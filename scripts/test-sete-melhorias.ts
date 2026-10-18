import assert from "node:assert/strict";
import {
 newCampaign,applyAction,normalizeCampaign,emergencyContractQuote,treasuryForecast,leagueLineup,
 regionInfluence,missions,combatReport,seasonalChallenges,seasonalGoldScale,seasonDay,
 GameRuleError,type Battle
} from "../lib/game.ts";
let emergency=0,autoSubs=0,regions=0,reports=0,seasons=0,roundtrips=0;
for(let n=0;n<160;n++){
 let s=newCampaign(68110+n*71);s.event=null;
 // Economia: apenas crise, exatamente uma vez por semana, sem dinheiro infinito.
 const normalQuote=emergencyContractQuote(s);
 assert.equal(normalQuote.available,false);
 assert.throws(()=>applyAction(s,{type:"emergency-contract"}),GameRuleError);
 s.gold=n%2===0?0:1;
 const quote=emergencyContractQuote(s);
 assert.ok(quote.available&&quote.reward>=45&&quote.reward<=140);
 const prev=s.gold;
 s=applyAction(s,{type:"emergency-contract"});
 assert.equal(s.gold,prev+quote.reward);
 assert.equal(s.dailyActions?.reliefWeek,0);
 assert.throws(()=>applyAction(s,{type:"emergency-contract"}),GameRuleError);
 const budget=treasuryForecast(s);
 assert.equal(budget.projected,s.gold-budget.wages-budget.maintenance);
 assert.ok(budget.days>=1&&budget.days<=7);
 emergency++;
 // Liga: auto-substituição só com opção ligada e reserva realmente disponível.
 s.event=null;
 const oldIds=s.leagueTeam!;
 for(let k=0;k<2;k++)s.heroes.find(h=>h.id===oldIds[k])!.energy=0;
 assert.equal(leagueLineup(s).ready,false);
 const disabled=leagueLineup(s);
 assert.equal(disabled.reserves.length,0);
 s=applyAction(s,{type:"league-auto-reserve",enabled:true});
 const lineup=leagueLineup(s);
 assert.ok(lineup.ready,"Reserva não evitou W.O.");
 assert.equal(lineup.reserves.length,2);
 assert.ok(lineup.reserves.every(id=>!oldIds.includes(id)));
 assert.equal(new Set(lineup.ids).size,lineup.ids.length);
 const saved=normalizeCampaign(JSON.parse(JSON.stringify(s)));
 assert.equal(saved.leagueAutoSub,true);
 assert.deepEqual(leagueLineup(saved).ids,lineup.ids);
 s=applyAction(s,{type:"league-auto-reserve",enabled:false});
 assert.equal(leagueLineup(s).ready,false);
 autoSubs++;roundtrips++;
 // Setor regional: bônus determinístico, dados entre 0 e 100.
 const region=missions(s)[0].location;
 s.regionalInfluence={[region]:100};
 assert.equal(regionInfluence(s,region),100);
 const m=missions(s)[0];
 assert.ok(m.reward>0);
 const season100=seasonalGoldScale(100),season250=seasonalGoldScale(250),season500=seasonalGoldScale(500);
 assert.ok(Math.abs(season100-4.96)<1e-9);
 assert.ok(Math.abs(season250-10.96)<1e-9);
 assert.ok(season500>=season250&&season500<=season250+1.5);
 assert.ok(seasonalGoldScale(1000000)<=season250+1.50000001);
 regions++;
 // Objetivos sazonais sem criar ouro adicional.
 s.day=60;s.season=1;s.gold=0;s.fame=100;
 s.leagueWins=25;s.seasonMissionVictories=5;s.bossSeasons=[1];
 s.regionalInfluence={[region]:50};
 s.event=null;
 assert.ok(seasonalChallenges(s).every(goal=>goal.current>=goal.goal));
 const s2=applyAction(s,{type:"next-day"});
 assert.equal(s2.season,2);
 assert.equal(seasonDay(s2),1);
 assert.equal(s2.seasonHonors?.length,3);
 assert.deepEqual(s2.seasonHonors?.map(h=>h.prestige).sort((a,b)=>a-b),[15,20,25]);
 assert.equal(s2.seasonMissionVictories,0);
 assert.equal(regionInfluence(s2,region),45);
 assert.ok(s2.fame>=100+60);
 seasons++;roundtrips++;
}
{
 const battle={
  title:"teste",day:1,won:true,reward:10,xp:5,rounds:2,levelUps:[],wounded:[],remaining:2,
  log:[
   {round:1,text:"Alicia causa 25 de dano.",kind:"hit",actorId:"one",targetId:"enemy-0",amount:25},
   {round:1,text:"Inimigo causa 10 de dano.",kind:"hit",actorId:"enemy-0",targetId:"one",amount:10},
   {round:2,text:"Bela recupera 12 PV.",kind:"heal",actorId:"two",targetId:"one",amount:12},
   {round:2,text:"Alicia causa 31 de dano.",kind:"critical",actorId:"one",targetId:"enemy-0",amount:31}
  ]
 } satisfies Battle;
 const stats=combatReport(battle,[{id:"one",name:"Alicia"},{id:"two",name:"Bela"}]);
 assert.equal(stats[0].damage,56);
 assert.equal(stats[0].received,10);
 assert.equal(stats[0].criticalHits,1);
 assert.equal(stats[1].healing,12);
 reports++;
}
console.log("SETE MELHORIAS: "+emergency+" crises sem duplicação; "+autoSubs+" reservas opcionais; "+
 regions+" verificações regionais/inflação; "+seasons+" honrarias; "+roundtrips+" compatibilidades save; "+
 reports+" relatório de batalha correto.");
