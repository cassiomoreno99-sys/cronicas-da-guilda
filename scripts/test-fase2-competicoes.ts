import assert from "node:assert/strict";
import {newCampaign,normalizeCampaign,applyAction,leagueLineup,leagueCalendar,CUP_DAYS,seasonDay,SEASON_DAYS,standings} from "../lib/game.ts";

function fresh(seed:number){const s=newCampaign(seed);s.event=null;return s;}
let s=fresh(23091);
assert.equal(SEASON_DAYS,60);assert.deepEqual([...CUP_DAYS],[15,30,45,60]);
assert.equal(leagueLineup(s).ids.length,4);
s.heroes.find(h=>h.id===s.team[0])!.energy=0;
s.heroes.find(h=>h.id===s.team[1])!.injuredUntil=10;
assert.equal(leagueLineup(s).ids.length,2);
assert.equal(leagueLineup(s).missing,1);
let t=applyAction(s,{type:"next-day"});
assert.equal(t.leagueHistory[0].result,"loss");
assert.equal(t.leagueHistory[0].forfeit,true);
assert.equal(t.leagueHistory[0].playerPower,0);
assert.equal(t.leagueHistory[0].playerScore,0);
assert.equal(t.leagueHistory[0].opponentScore,2);
assert.equal(t.points,0);
assert.equal(t.rivals.find(r=>r.id===t.leagueHistory[0].opponentId)?.points,3);
const lineup=t.heroes.slice(2,6).map(h=>h.id);
for(const h of t.heroes){h.energy=100;h.injuredUntil=0;}
t.event=null;
t=applyAction(t,{type:"league-lineup",team:lineup,tactic:"defensive"});
assert.deepEqual(t.team,lineup);
assert.equal(t.tactic,"defensive");
assert.equal(leagueLineup(t).ready,true);
assert.equal(leagueCalendar(t,7).length,7);
t=applyAction(t,{type:"next-day"});
assert.equal(t.leagueHistory[0].forfeit,false);
assert.equal(t.leagueHistory[0].tactic,"defensive");
assert.deepEqual(normalizeCampaign(t).team,lineup);
console.log("LIGA: W.O. com equipe incompleta, pontos do rival, escalação persistida e tática OK.");

let totalMatches=0,totalCups=0,forfeits=0;
for(let seed=0;seed<12;seed++){
 let st=fresh(40000+seed*17);
 for(let day=1;day<=60;day++){
  st.event=null;
  for(const h of st.heroes){h.energy=100;h.injuredUntil=0;}
  if(seed===0&&day===15)for(const id of st.team.slice(0,2))st.heroes.find(h=>h.id===id)!.energy=0;
  st=applyAction(st,{type:"next-day"});
  assert.equal(st.leagueHistory[0].day,day);
  assert.equal(st.leagueHistory[0].season,1);
  assert.equal(st.leagueHistory.filter(m=>m.season===1).length,day);
  assert.ok(st.leagueHistory[0].playerScore>=0&&st.leagueHistory[0].opponentScore>=0);
  if(seed===0&&day===15){
   assert.equal(st.cup.stage,"eliminated");
   assert.equal(st.cup.history[0].forfeit,true);
   assert.equal(st.cup.history[0].result,"loss");
  }
  if(day===59){
   totalCups+=st.cup.history.length;
   assert.ok(st.cup.history.length<=3);
   const days=st.cup.history.map(m=>m.day).sort((a,b)=>a-b);
   assert.deepEqual(days,CUP_DAYS.filter(d=>d<=45).slice(0,days.length));
   assert.ok(st.cup.history.every(m=>m.cup===true));
  }
  totalMatches++;
  if(st.leagueHistory[0].forfeit)forfeits++;
 }
 assert.equal(st.season,2);assert.equal(seasonDay(st),1);
 assert.equal(st.cup.season,2);assert.equal(st.cup.history.length,0);
 assert.equal(st.leagueHistory.filter(m=>m.season===1).length,60);
 assert.equal(standings(st).length,100);
 assert.equal(leagueCalendar(st).length,7);
}
assert.equal(totalMatches,720);
assert.ok(totalCups>=12);
assert.ok(forfeits>=1);
console.log("COMPETICOES: "+totalMatches+" jogos de liga, "+totalCups+" jogos de copa, "+forfeits+" W.O.; 12 temporadas de 60 dias com virada e premiação OK.");
