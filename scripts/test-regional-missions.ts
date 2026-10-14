import assert from "node:assert/strict";
import {applyAction,missions,newCampaign,seasonBoss,type Campaign,type MissionKind} from "../lib/game.ts";
import {WORLD_REGIONS} from "../lib/v130-content.ts";
import {REGIONAL_CHAPTERS} from "../lib/regional-missions.ts";

function at(index:number,day=45):Campaign{
 const s=newCampaign(3841+index*17+day);
 s.activeRegion=index+1;s.region=Math.max(index+1,s.region);s.day=day;s.season=1;
 s.fame=9999;s.event=null;
 for(const h of s.heroes){h.injuredUntil=0;h.energy=100;}
 return s;
}

assert.equal(WORLD_REGIONS.length,12);
assert.equal(Object.keys(REGIONAL_CHAPTERS).length,11);
assert.ok(!REGIONAL_CHAPTERS[0],"Vale de Valen não pode receber narrativa substituta");
const first=missions(at(0));
assert.deepEqual(first.map(m=>m.title),[
 "Ritual sombrio na cripta","Aranhas nas ruínas","Escolta da caravana",
 "Exploração de masmorra","O cofre do tesouro perdido","Caçada no vale nebuloso"
],"As seis missões aprovadas do Vale de Valen devem permanecer idênticas");
assert.deepEqual(first.map(m=>m.kind),["dungeon","hunt","escort","dungeon","dungeon","hunt"]);
assert.equal(seasonBoss(at(0))?.title,"Chefe regional · Vale de Valen");
const allTitles=new Set<string>(),allDescription=new Set<string>();
const kinds=new Set<MissionKind>();
const report:{region:string;titles:string[];types:string;boss:string}[]=[];
let count=0;
for(let index=0;index<WORLD_REGIONS.length;index++){
 const region=WORLD_REGIONS[index],state=at(index),contract=missions(state),boss=seasonBoss(state);
 assert.equal(contract.length,6,region.name+" deve ter seis missões após o dia 30");
 assert.ok(boss,region.name+" deve ter guardião a partir do dia 45");
 assert.equal(boss?.kind,"boss");assert.equal(boss?.location,region.name);
 const seenKinds=new Set<MissionKind>();
 const localNames=new Set<string>();
 for(let i=0;i<contract.length;i++){
  const m=contract[i];count++;kinds.add(m.kind);seenKinds.add(m.kind);
  assert.equal(m.location,region.name);
  assert.ok(m.title.trim().length>=10,region.name+": missão sem nome próprio");
  assert.ok(m.description.trim().length>=35,region.name+": missão sem história");
  assert.ok(region.enemies.includes(m.enemy as any),region.name+": inimigo estranho à região "+m.enemy);
  assert.ok(m.count>=3&&m.count<=4,region.name+": escala 2D fora da faixa 3–4 inimigos");
  assert.ok(m.flavor.trim().length>25,region.name+": dica tática genérica");
  assert.ok(!localNames.has(m.title),region.name+": missão duplicada");localNames.add(m.title);
  assert.ok(!allTitles.has(m.title),"O nome da missão se repete em outra região: "+m.title);allTitles.add(m.title);
  assert.ok(!allDescription.has(m.description),"O objetivo se repete: "+m.description);allDescription.add(m.description);
  if(index>0){
   assert.equal(m.title,REGIONAL_CHAPTERS[index].contracts[i].title);
   assert.equal(m.description,REGIONAL_CHAPTERS[index].contracts[i].description);
   assert.equal(m.kind,REGIONAL_CHAPTERS[index].contracts[i].kind);
   assert.equal(m.enemy,REGIONAL_CHAPTERS[index].contracts[i].enemy);
  }
 }
 if(index>0){
  assert.equal(REGIONAL_CHAPTERS[index].contracts.length,6);
  assert.ok(seenKinds.size>=3,region.name+": contratos variam pouco de objetivo");
  assert.ok(seenKinds.has("defense")&&seenKinds.has("escort")&&seenKinds.has("dungeon")&&seenKinds.has("hunt"),
    region.name+": precisa de escolta, defesa, masmorra e caça");
  assert.equal(boss?.title,REGIONAL_CHAPTERS[index].guardian.title);
  assert.equal(boss?.description,REGIONAL_CHAPTERS[index].guardian.description);
 }
 assert.ok(!allTitles.has(boss!.title),"Chefe repetiu título de missão");allTitles.add(boss!.title);
 assert.ok(!allDescription.has(boss!.description),"Chefe repetiu missão");allDescription.add(boss!.description);
 assert.ok(region.enemies.includes(boss!.enemy as any),"Chefe fora do elenco regional");
 // Compatibilidade com o cronograma original de liberação: 5 contratos no início.
 assert.equal(missions(at(index,1)).length,5);
 assert.equal(seasonBoss(at(index,14)),null);
 // A missão de cada região usa o motor real, sem gerar um minijogo isolado.
 for(const chosen of [contract[0],contract[2],contract[3],boss!]){
  const s=at(index),start=applyAction(s,{type:"mission",missionId:chosen.id,team:s.team,
   tactic:"balanced",expeditionSlot:1,startedAt:1700000000000});
  const e=start.expeditions.at(-1)!;
  assert.equal(e.battle.combat?.mission.title,chosen.title);
  assert.equal(e.battle.combat?.mission.kind,chosen.kind);
  assert.equal(e.battle.combat?.fighters.filter(f=>f.side==="enemy").length,chosen.count);
  assert.equal(e.battle.combat?.mission.enemy,chosen.enemy);
 }
 report.push({region:region.name,titles:contract.map(m=>m.title),types:[...seenKinds].join(","),boss:boss!.title});
}
assert.equal(count,72);
assert.equal(allTitles.size,84,"Esperadas 72 missões e 12 chefes com títulos exclusivos");
assert.equal(allDescription.size,84);
assert.ok(kinds.has("defense"),"Faltam defesas reais na campanha");
console.log("MISSÕES REGIONAIS ÚNICAS APROVADAS — "+count+" contratos + "+WORLD_REGIONS.length+" chefes:",report);
