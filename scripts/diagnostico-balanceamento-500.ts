import {mkdirSync,writeFileSync} from "node:fs";
import {newCampaign,applyAction,missions,seasonalThreat} from "../lib/game.ts";
const report=[];
for(const season of [1,20,50,100,250,500]){
 let wins=0,losses=0;
 for(let seed=0;seed<20;seed++){
  let s=newCampaign(720000+season*100+seed);s.event=null;s.day=(season-1)*60+7;s.season=season;s.gold=1000000;
  s.hq.warroom=10;s.hq.library=10;s.hq.infirmary=10;s.hq.stables=10;
  for(const h of s.heroes){
   h.level=50;h.attack+=45;h.defense+=28;h.magic+=45;h.energy=100;h.injuredUntil=0;
  }
  const m=missions(s)[0];
  s=applyAction(s,{type:"mission",missionId:m.id,team:s.team,tactic:(seed%2?"aggressive":"balanced"),expeditionSlot:1,startedAt:1700000000000});
  const id=s.expeditions[0].id;
  s=applyAction(s,{type:"battle-auto",expeditionId:id});
  if(s.expeditions[0].battle.won)wins++;else losses++;
 }
 const preview=newCampaign(720001);preview.day=(season-1)*60+7;preview.season=season;
 const m=missions(preview)[0];
 if(season===500&&wins<10)throw new Error("Desequilíbrio extremo: equipe no nível máximo vence menos de 10/20 na missão básica da temporada 500.");
 report.push({season,force:m.force,wins,losses,suggestedByUI:Math.min(50,1+Math.floor((season-1)/3)),multiplier:seasonalThreat(season,.06)});
 console.log("BALANCEAMENTO TEMPORADA "+season+": vitórias="+wins+"/20; força="+m.force);
}
mkdirSync("qa-report",{recursive:true});writeFileSync("qa-report/diagnostico-balanceamento-500.json",JSON.stringify(report,null,2));
