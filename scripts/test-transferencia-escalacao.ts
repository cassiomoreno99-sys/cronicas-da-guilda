import assert from "node:assert/strict";
import {newCampaign,applyAction,normalizeCampaign,leagueLineup,formationValid,GameRuleError,type Campaign} from "../lib/game.ts";
const simulateLeave=(s:Campaign,heroId:string)=>{
 s.event={id:"qa-offer-"+s.day,kind:"offer",heroId,title:"Proposta de transferência",text:"Rival fez proposta",choices:[{id:"leave",label:"Aceitar proposta",effect:"Herói sai"}]};
 return applyAction(s,{type:"event",eventId:s.event.id,choiceId:"leave"});
};
let departures=0,saves=0,games=0,unchanged=0;
for(let seed=0;seed<150;seed++){
 let s=newCampaign(100512+seed*37);
 s.gold=100000;s.fame=2000;s.event=null;
 const team=s.team.slice(0,4),tactic=(["balanced","defensive","aggressive"] as const)[seed%3];
 s=applyAction(s,{type:"league-lineup",team,tactic});
 const oldRoster=[...s.leagueTeam!],first=oldRoster[seed%oldRoster.length],beforeCount=s.heroes.length;
 s=simulateLeave(s,first);
 assert.equal(s.heroes.length,beforeCount-1,"A transferência não retirou o herói");
 assert.ok(!s.leagueTeam?.includes(first),"Liga/Copa ainda inclui herói transferido");
 assert.equal(s.leagueTeam?.length,4,"Reserva não repôs a vaga na Liga");
 assert.equal(new Set(s.leagueTeam).size,4,"Escalação oficial tem heróis repetidos");
 assert.ok(s.leagueTeam!.every(id=>s.heroes.some(h=>h.id===id)),"Escalação contém atleta que não está na guilda");
 assert.equal(s.leagueTactic,tactic,"Tática oficial mudou após transferência");
 assert.ok(formationValid(s.leagueTeam!,s.leagueFormation!),"Formação oficial inválida após transferência");
 assert.equal(leagueLineup(s).ready,true,"Liga declarou W.O. mesmo existindo quatro heróis aptos");
 s=normalizeCampaign(JSON.parse(JSON.stringify(s)));
 assert.equal(leagueLineup(s).ready,true,"Salvamento apagou reserva da escalação");
 saves++;
 const formerSeason=s.season;
 s=applyAction(s,{type:"next-day"});
 assert.equal(s.leagueHistory[0].season,formerSeason);
 assert.equal(s.leagueHistory[0].forfeit,false,"Houve W.O. indevido após transferência");
 assert.equal(s.leagueHistory[0].tactic,tactic);
 departures++;games++;
}
for(let seed=0;seed<50;seed++){
 let s=newCampaign(200151+seed);s.event=null;s.gold=5000;
 const t=s.team.slice(0,4);
 s=applyAction(s,{type:"league-lineup",team:t,tactic:"defensive"});
 const other=s.heroes.find(h=>!t.includes(h.id))!;
 const before=JSON.stringify({team:s.leagueTeam,formation:s.leagueFormation,tactic:s.leagueTactic});
 s=simulateLeave(s,other.id);
 assert.equal(JSON.stringify({team:s.leagueTeam,formation:s.leagueFormation,tactic:s.leagueTactic}),before,"Saída de reserva mudou escalação titular");
 unchanged++;
}
console.log("TRANSFERÊNCIAS E W.O.: "+departures+" transferências de titulares, "+saves+" backups, "+games+" jogos sem W.O. indevido; "+unchanged+" transferências de reservas preservaram escalação.");
