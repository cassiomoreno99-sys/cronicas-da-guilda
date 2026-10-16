import assert from "node:assert/strict";
import {mkdirSync,writeFileSync} from "node:fs";
import {newCampaign,applyAction,normalizeCampaign,seasonDay,SEASON_DAYS,standings,leagueLineup,payroll,missions,missionLocks} from "../lib/game.ts";

const TOTAL_SEASONS=500;
const started=Date.now();
let s=newCampaign(20261016);
let matches=0,forfeits=0,missionFights=0,missionVictories=0,missionDefeats=0,decisions=0,eventsByKind:Record<string,number>={},
    emptyGoldDays=0,seasonRollovers=0,seasonProbes=0,reloads=0,wins=0,losses=0,draws=0,
    maxSaveBytes=0,minGold=Infinity,maxGold=-Infinity;
const checkpoints:Array<{season:number;gold:number;fame:number;rank:number;cup:string;saveBytes:number;heroLevels:number[]}>=[];
const failures:string[]=[];
function checkState(label:string){
  assert.ok(Number.isSafeInteger(s.day)&&s.day>=1,label+": dia inválido");
  assert.ok(Number.isSafeInteger(s.season)&&s.season>=1,label+": temporada inválida");
  assert.ok(Number.isFinite(s.gold)&&s.gold>=0,label+": saldo negativo ou não finito");
  assert.ok(Number.isFinite(s.fame)&&s.fame>=0,label+": renome inválido");
  assert.ok(s.heroes.length>=4&&s.heroes.length<=12,label+": número de heróis inválido");
  assert.equal(new Set(s.heroes.map(h=>h.id)).size,s.heroes.length,label+": heróis duplicados");
  assert.equal(s.rivals.length,99,label+": lista de 99 rivais foi corrompida");
  assert.ok(s.heroes.every(h=>h.level>=1&&h.level<=50&&Number.isFinite(h.energy)&&h.energy>=0&&h.energy<=100),label+": níveis ou energia inválidos");
  assert.ok(s.leagueHistory.length<=120&&s.ledger.length<=80&&s.journal.length<=40,label+": históricos ilimitados");
  assert.ok((s.seasonAwards?.length||0)<=12,label+": histórico de premiações ultrapassou limite");
  assert.equal(s.cup.season,s.season,label+": Copa está na temporada errada");
  assert.ok(s.points>=0&&Number.isFinite(s.points),label+": pontos inválidos");
  assert.ok(Number.isFinite(payroll(s))&&payroll(s)>=0,label+": folha inválida");
}
checkState("início");
for(let season=1;season<=TOTAL_SEASONS;season++){
  assert.equal(s.season,season,"Temporada esperada "+season);
  for(let day=1;day<=SEASON_DAYS;day++){
    assert.equal(seasonDay(s),day,"Dia da temporada "+season+" divergiu");
    // Sempre resolve as escolhas oficiais do Conselho pelo motor real,
    // alternando serviços pagos, gratuitos e diplomacia ao longo das 500 temporadas.
    if(s.event){
      const e=s.event,affordable=e.choices.filter(c=>(c.cost||0)<=s.gold&&c.id!=="leave");
      assert.ok(affordable.length>0, "Conselho sem decisão acessível: "+e.id);
      const choice=affordable[(season+day)%affordable.length];
      s=applyAction(s,{type:"event",eventId:e.id,choiceId:choice.id});
      assert.equal(s.event,null,"Conselho não encerrou evento "+e.id);
      decisions++;eventsByKind[e.kind]=(eventsByKind[e.kind]||0)+1;
    }
    // Também exercita combates reais durante toda a campanha secular.
    // Pelo menos 100 missões espaçadas cobrem temporadas iniciais e tardias.
    if(day===7&&season%5===0){
      const mission=missions(s).find(m=>missionLocks(s,m).length===0);
      assert.ok(mission,"Não existe nenhum contrato acessível na temporada "+season);
      assert.ok(s.team.length>=3,"Equipe ausente na temporada "+season);
      s=applyAction(s,{type:"mission",missionId:mission.id,team:s.team.slice(0,4),tactic:(season%2===0?"aggressive":"defensive"),expeditionSlot:1,startedAt:1700000000000});
      const expId=s.expeditions.at(-1)!.id;
      s=applyAction(s,{type:"battle-auto",expeditionId:expId});
      const result=s.expeditions.find(e=>e.id===expId)!.battle;
      assert.notEqual(result.status,"active","Missão não terminou na temporada "+season);
      assert.ok(Number.isFinite(result.reward)&&result.reward>=0,"Recompensa inválida");
      missionFights++;
      if(result.won)missionVictories++;else missionDefeats++;
    }
    const ready=leagueLineup(s);
    if(day%11===0&&ready.ready){
      const tactic=(["balanced","aggressive","defensive"] as const)[(season+day)%3];
      s=applyAction(s,{type:"league-lineup",team:ready.ids,tactic});
    }
    const before=s.day,prevMatches=s.leagueHistory.length,seasonBefore=s.season,pointsBefore=s.points;
    s=applyAction(s,{type:"next-day"});
    assert.equal(s.day,before+1,"Avanço perdeu ou duplicou um dia "+before);
    assert.equal(s.season,Math.floor((s.day-1)/60)+1,"Virada de temporada incorreta");
    const match=s.leagueHistory[0];
    assert.ok(match,"Partida de Liga não foi registrada");
    assert.equal(match.day,day,"Liga jogou na data errada");
    assert.equal(match.season,seasonBefore,"Liga jogou na temporada errada");
    assert.ok(match.playerScore>=0&&match.opponentScore>=0&&Number.isFinite(match.playerPower),"Placar/poder inválidos");
    if(match.forfeit){
      forfeits++;
      assert.equal(match.result,"loss");
      assert.equal(match.playerScore,0);
      assert.equal(match.opponentScore,2);
    }
    if(match.result==="win")wins++;
    else if(match.result==="draw")draws++;
    else losses++;
    if(day<60)assert.equal(s.leagueHistory.length,Math.min(120,prevMatches+1),"Histórico perdeu partida");
    if(day<60)assert.ok(s.points>=pointsBefore&&s.points<=pointsBefore+3,"Pontuação da liga inválida");
    if(s.gold===0)emptyGoldDays++;
    minGold=Math.min(minGold,s.gold);maxGold=Math.max(maxGold,s.gold);
    matches++;
    if(day===15||day===30||day===45||day===60)seasonProbes++;
    if(day===60){
      assert.equal(s.season,season+1,"Não virou a temporada no dia 60");
      assert.equal(seasonDay(s),1);
      assert.equal(s.cup.stage,"oitavas");
      assert.equal(s.cup.history.length,0);
      assert.equal(s.cup.season,season+1);
      assert.equal(s.leagueWins+s.leagueDraws+s.leagueLosses,0);
      assert.equal(s.points,0,"Pontos de liga não zeraram");
      assert.equal(s.seasonAwards?.[0]?.season,season,"Premiação da temporada ausente");
      assert.equal(standings(s).length,100);
      seasonRollovers++;
      const raw=JSON.stringify(s),bytes=Buffer.byteLength(raw);
      assert.ok(bytes<5*1024*1024,"Save excedeu 5MiB após "+season+" temporadas: "+bytes+" bytes");
      maxSaveBytes=Math.max(maxSaveBytes,bytes);
      const restored=normalizeCampaign(JSON.parse(raw));
      assert.equal(restored.gold,s.gold);
      assert.equal(restored.day,s.day);
      assert.equal(restored.season,s.season);
      assert.equal(restored.cup.stage,s.cup.stage);
      assert.equal(restored.leagueHistory[0].day,60);
      s=restored;reloads++;
      if(season===1||season%25===0||season===TOTAL_SEASONS){
        checkpoints.push({season,gold:s.gold,fame:s.fame,rank:standings(s).findIndex(r=>r.id==="player")+1,cup:s.cup.stage,saveBytes:bytes,heroLevels:s.heroes.map(h=>h.level)});
      }
    }
  }
  if(season%50===0)console.log("MARCO "+season+"/500 temporadas; "+matches+" dias; ouro="+s.gold+"; save="+maxSaveBytes+"B; decisões="+decisions);
}
assert.equal(matches,30000);
assert.equal(missionFights,100,"Faltaram os 100 combates escalonados.");
assert.equal(seasonRollovers,500);
assert.equal(reloads,500);
assert.equal(s.season,501);
checkState("após 500 temporadas");
const report={passed:true,seed:20261016,requestedSeasons:TOTAL_SEASONS,completedSeasons:seasonRollovers,daysAndLeagueMatches:matches,missionFights,missionVictories,missionDefeats,forfeits,league:{wins,draws,losses},cupCheckpoints:seasonProbes,councilDecisions:decisions,eventsByKind,zeroGoldDays:emptyGoldDays,minGold,maxGold,maxSaveBytes,reloads,checkpoints,elapsedMs:Date.now()-started};
mkdirSync("qa-report",{recursive:true});writeFileSync("qa-report/500-temporadas.json",JSON.stringify(report,null,2));
console.log("QA 500 TEMPORADAS APROVADO:",JSON.stringify({...report,checkpoints:checkpoints.length}));
