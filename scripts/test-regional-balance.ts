import assert from "node:assert/strict";
import {applyAction,missions,missionReadiness,missionRewardXp,missionSuggestedLevel,newCampaign,normalizeCampaign,regionThreat,seasonBoss,threshold,type Campaign} from "../lib/game.ts";
import {WORLD_REGIONS} from "../lib/v130-content.ts";

function forRegion(index:number,seed=11):Campaign{
 const s=newCampaign(seed);s.region=index+1;s.activeRegion=index+1;s.day=1;s.season=1;s.fame=10000;s.event=null;
 s.heroes.forEach(h=>{h.energy=100;h.injuredUntil=0;});
 return s;
}
assert.equal(threshold(newCampaign(100).heroes[0]),111,"Primeiro nível deve precisar mais XP");
const a=forRegion(0),b=forRegion(1),c=forRegion(2),d=forRegion(3);
for(const [i,s] of [[0,a],[1,b],[2,c],[3,d]] as const){
 const m=missions(s);
 assert.equal(m[0].location,WORLD_REGIONS[i].name);
 assert.equal(missionSuggestedLevel(m[0]),WORLD_REGIONS[i].minLevel);
 assert.ok(missionSuggestedLevel(m[4])>missionSuggestedLevel(m[0]),"Contratos da mesma região não possuem gradação de nível");
 assert.equal(missionRewardXp(m[0]),41+i*18,"O XP de região não escalou");
}
const regional=[a,b,c,d,forRegion(11)].map(s=>{
 const m=missions(s)[0];
 const start=applyAction(s,{type:"mission",missionId:m.id,team:s.team,tactic:"balanced",expeditionSlot:1,startedAt:1700000000000});
 const enemies=start.expeditions[0].battle.combat?.fighters.filter(f=>f.side==="enemy")||[];
 assert.ok(enemies.length>=3);
 return {region:m.location,force:m.force,hp:enemies[0].maxHp,attack:enemies[0].attack,recommended:missionSuggestedLevel(m)};
});
for(let i=1;i<regional.length;i++){
 assert.ok(regional[i].hp>regional[i-1].hp*1.08,"Região nova não ganhou resistência visível");
 assert.ok(regional[i].attack>regional[i-1].attack*1.05,"Região nova não ganhou ofensiva visível");
 assert.ok(regional[i].recommended>regional[i-1].recommended,"Região nova manteve a recomendação antiga");
}
const one=forRegion(0),five=missions(one)[4];
assert.ok(five.force>missions(one)[0].force,"Missões de elite devem escalar dentro da região");
const bossCampaign=forRegion(0);bossCampaign.day=21;
const boss=seasonBoss(bossCampaign)!;
assert.ok(boss && boss.kind==="boss" && boss.force>missions(bossCampaign)[4].force,"O chefe regional não é mais forte que a missão de elite");
assert.ok(missionSuggestedLevel(boss)>missionSuggestedLevel(missions(bossCampaign)[4]),"Chefe sem nível de elite");
assert.ok(regionThreat(1)>regionThreat(0)&&regionThreat(11)>regionThreat(5),"Risco regional não aumenta com as regiões");
// Salvamentos anteriores mantêm nível, XP e atributos: a nova curva vale daqui para frente.
const save=forRegion(1,394);save.balanceVersion=5;save.heroes[0].level=21;save.heroes[0].xp=333;save.heroes[0].attack+=22;save.heroes[0].defense+=18;
const before={level:save.heroes[0].level,xp:save.heroes[0].xp,attack:save.heroes[0].attack,defense:save.heroes[0].defense};
const loaded=normalizeCampaign(structuredClone(save));
assert.deepEqual({level:loaded.heroes[0].level,xp:loaded.heroes[0].xp,attack:loaded.heroes[0].attack,defense:loaded.heroes[0].defense},before,"Campanha antiga foi rebaixada");
// Heróis sobrequalificados recebem menos XP por fazendas de missões fáceis.
const high=forRegion(0,409);
for(const h of high.heroes){h.level=20;h.attack+=45;h.defense+=35;h.magic+=35;}
const m=missions(high)[0];
const begun=applyAction(high,{type:"mission",missionId:m.id,team:high.team,tactic:"balanced",expeditionSlot:1,startedAt:1700000000000});
const exp=begun.expeditions[0];
const done=applyAction(begun,{type:"battle-auto",expeditionId:exp.id});
const fight=done.expeditions[0].battle;
assert.equal(fight.status,"won");
assert.ok(done.heroes.find(h=>h.id===high.team[0])!.xp<fight.xp,"Repetir desafio muito fraco precisa render menos");
console.log("BALANCEAMENTO REGIONAL APROVADO:",regional);
