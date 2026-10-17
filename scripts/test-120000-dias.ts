import assert from "node:assert/strict";
import {mkdirSync,writeFileSync} from "node:fs";
import {newCampaign,applyAction,normalizeCampaign,missions,missionLocks,seasonDay,SEASON_DAYS,leagueLineup,payroll,heroLeaderboard,standings,available,type Campaign,type Tactic} from "../lib/game.ts";
import {chestCapacity,storageUsed} from "../lib/storage.ts";

const shard=Number(process.env.QA_SHARD??process.argv[2]??0);
assert.ok(Number.isInteger(shard)&&shard>=0&&shard<5);
const DAYS=24000,START_SEASON=1,started=Date.now();
let s=newCampaign(20261017+shard*10391);
let rng=(0xfedbca98+(shard+1)*9617)>>>0;
const roll=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
let decisions=0,missionsDone=0,missionWins=0,missionLosses=0,trainings=0,journeys=0,upgrades=0,reloads=0,forfeits=0,cupGames=0;
let highestSave=0,lowestGold=Infinity,highestGold=-Infinity,zeroGoldDays=0;
const firstIssues:Array<{day:number;season:number;type:string;message:string}>=[];
const profiles=["sobrevivência sem missões","treinamento e viagens","economia com quartel","contratos frequentes","jornada mista com recrutamento"];
function invariant(phase:string){
 assert.ok(Number.isSafeInteger(s.day)&&s.day>=1,"Dia inválido "+phase);
 assert.ok(Number.isSafeInteger(s.season)&&s.season>=1,"Temporada inválida "+phase);
 assert.equal(s.season,Math.floor((s.day-1)/SEASON_DAYS)+1,"Temporada desalinhada em "+phase);
 assert.ok(Number.isFinite(s.gold)&&s.gold>=0,"Saldo inválido "+phase);
 assert.ok(Number.isFinite(s.fame)&&s.fame>=0,"Prestígio inválido "+phase);
 assert.ok(s.heroes.length>=4&&s.heroes.length<=12,"Elenco fora dos limites "+phase);
 assert.equal(new Set(s.heroes.map(h=>h.id)).size,s.heroes.length,"ID de herói duplicado "+phase);
 assert.equal(s.rivals.length,99,"Rivais alterados "+phase);
 assert.ok(s.heroes.every(h=>Number.isFinite(h.energy)&&h.energy>=0&&h.energy<=100&&h.level>=1&&h.level<=50),"Energia/nível inválidos "+phase);
 assert.ok(Number.isFinite(payroll(s))&&payroll(s)>=0,"Folha de pagamento inválida");
 assert.ok(s.leagueHistory.length<=120&&s.journal.length<=40&&s.ledger.length<=80,"Histórico cresceu sem limite");
 assert.ok(s.seasonAwards.length<=12,"Histórico de premiações sem limite");
 assert.equal(s.cup.season,s.season,"Copa está na temporada errada");
 assert.ok(s.points>=0&&Number.isFinite(s.points),"Pontos da Liga inválidos");
 assert.ok(storageUsed(s.chest)<=chestCapacity(s),"Inventário acima da capacidade");
 assert.ok(s.chest.every(i=>typeof i.key==="string"&&!!i.id),"Baú inválido");
 const ids=new Set(s.chest.map(i=>i.id));
 assert.equal(ids.size,s.chest.length,"ID duplicado no baú");
 assert.ok((s.pendingRewards||[]).every(i=>!ids.has(i.id)),"Prêmio pendente duplicado no baú");
}
function attempt(label:string,action:Parameters<typeof applyAction>[1]){
 try{s=applyAction(s,action);return true;}
 catch(e){const msg=e instanceof Error?e.message:String(e);
   if(e instanceof TypeError||e instanceof RangeError||/undefined|Cannot read|not a function|NaN/i.test(msg))
      throw new Error("ERRO TÉCNICO "+label+" dia "+s.day+": "+msg);
   firstIssues.length<20&&firstIssues.push({day:s.day,season:s.season,type:label,message:msg});
   return false;
 }
}
invariant("início");
for(let i=0;i<DAYS;i++){
 const d=s.day,season=s.season;
 if(s.event){
   const e=s.event;
   const viable=e.choices.filter(c=>(c.cost||0)<=s.gold);
   assert.ok(viable.length,"Evento sem nenhuma escolha possível: "+e.id);
   const choice=viable[Math.floor(roll()*viable.length)];
   assert.ok(attempt("decisão do Conselho",{type:"event",eventId:e.id,choiceId:choice.id}),"Evento não foi resolvido");
   decisions++;
 }
 if(shard===1||shard===4){
   if(i%9===0){const h=s.heroes.filter(h=>available(h,s)&&s.gold>=90).sort((a,b)=>a.level-b.level)[0];
     if(h&&attempt("treino",{type:"train-hero",heroId:h.id}))trainings++;
   }
   if(i%31===0){const h=s.heroes.find(h=>available(h,s));
     if(h&&attempt("viagem",{type:"start-journey",heroId:h.id,duration:([3,5,7] as const)[Math.floor(roll()*3)]}))journeys++;
   }
 }
 if(shard===2||shard===4){
   if(i%72===0){const buildings=(["infirmary","forge","academy","library","stables","warroom"] as const);
     const target=buildings[Math.floor(roll()*buildings.length)];
     if(s.hq[target]<10&&attempt("sede",{type:"upgrade-hq",building:target}))upgrades++;
   }
 }
 if(shard===3||shard===4){
   if(i%19===0){
    const team=s.heroes.filter(h=>available(h,s)).slice(0,4).map(h=>h.id);
    const m=missions(s).find(m=>missionLocks(s,m).length===0);
    if(m&&team.length>=3&&attempt("contrato",{type:"mission",missionId:m.id,team,tactic:(["balanced","defensive","aggressive"] as Tactic[])[Math.floor(roll()*3)],expeditionSlot:1,startedAt:1700000000000+i*4000})){
      const exp=s.expeditions.find(e=>e.battle.status==="active"&&e.missionId===m.id);
      assert.ok(exp,"Missão não criou batalha ativa");
      assert.ok(attempt("terminar combate",{type:"battle-auto",expeditionId:exp.id}),"Falha para concluir missão");
      const battle=s.expeditions.find(e=>e.id===exp.id)!.battle;
      assert.ok(["won","lost"].includes(battle.status||""),"Batalha não encerrou");
      missionsDone++;battle.won?missionWins++:missionLosses++;
    }
   }
 }
 if(i%20===0){
   const l=leagueLineup(s);
   if(l.ready)attempt("salvar escalação",{type:"league-lineup",team:l.ids,tactic:(["balanced","aggressive","defensive"] as Tactic[])[Math.floor(roll()*3)]});
 }
 assert.ok(attempt("próximo dia",{type:"next-day"}),"Falha ao avançar dia "+d);
 assert.equal(s.day,d+1,"Dia não avançou uma única vez");
 assert.equal(s.season,Math.floor((s.day-1)/60)+1,"Temporada não atualizada");
 const match=s.leagueHistory[0];
 assert.ok(match&&match.day===seasonDay({day:d})&&match.season===season,"Partida diária ausente");
 assert.ok(Number.isFinite(match.playerScore)&&Number.isFinite(match.opponentScore)&&Number.isFinite(match.playerPower),"Placar inválido");
 if(match.forfeit){forfeits++;assert.equal(match.playerScore,0);assert.equal(match.opponentScore,2);}
 if([15,30,45,60].includes(seasonDay({day:d})))cupGames+=s.cup.history.length?1:0;
 if(s.gold===0)zeroGoldDays++;
 lowestGold=Math.min(lowestGold,s.gold);highestGold=Math.max(highestGold,s.gold);
 if(s.day%60===1){
   invariant("virada "+s.season);
   assert.equal(s.cup.stage,"oitavas");
   assert.equal(s.cup.history.length,0);
   assert.equal(s.points,0);
   assert.ok(s.seasonAwards[0]?.season===season,"Premiação sazonal perdida");
   assert.equal(standings(s).length,100);
   const json=JSON.stringify(s);
   highestSave=Math.max(highestSave,Buffer.byteLength(json));
   assert.ok(Buffer.byteLength(json)<5*1024*1024,"Save ultrapassou 5 MiB");
   const restored=normalizeCampaign(JSON.parse(json));
   assert.equal(restored.day,s.day);assert.equal(restored.gold,s.gold);assert.equal(restored.cup.season,s.season);
   assert.equal(restored.leagueHistory[0].day,60);
   s=restored;reloads++;
 }
 if(i%200===0)invariant("checkpoint "+i);
 if((i+1)%6000===0)console.log("DIAS shard "+shard+" "+(i+1)+"/"+DAYS+" temporada="+s.season+" combate="+missionsDone+" saves="+reloads);
}
invariant("final");
assert.equal(s.day,DAYS+1);
assert.equal(s.season,401);
assert.equal(reloads,400);
const report={passed:true,shard,profile:profiles[shard],days:DAYS,seasons:400,leagueMatches:DAYS,events:decisions,
 missions:missionsDone,missionWins,missionLosses,trainings,journeys,upgrades,forfeits,cupCheckpoints:cupGames,reloads,
 highestSaveBytes:highestSave,lowestGold,highestGold,zeroGoldDays,expectedRuleRejections:firstIssues,elapsedMs:Date.now()-started};
mkdirSync("qa-report",{recursive:true});writeFileSync("qa-report/longrun-"+shard+".json",JSON.stringify(report,null,2));
console.log("AUDITORIA 24000 DIAS PASSOU "+JSON.stringify({...report,expectedRuleRejections:firstIssues.length}));
