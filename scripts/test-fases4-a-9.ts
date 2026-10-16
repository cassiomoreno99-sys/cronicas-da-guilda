import assert from "node:assert/strict";
import {applyAction,newCampaign,missions,seasonBoss,hqUpgradeCost,academySlots,heroStats,payroll,normalizeCampaign,SEASON_DAYS} from "../lib/game.ts";
import {WORLD_REGIONS} from "../lib/v130-content.ts";
import {REGIONAL_CHAPTERS} from "../lib/regional-missions.ts";
import {chestCapacity} from "../lib/storage.ts";
import {LOCAL_SAVE_KEY,LOCAL_RECOVERY_KEY,readLocalCampaign,updateLocalCampaign,restoreRecoveryCampaign,recoveryAvailable,exportLocalCampaign,importLocalCampaign} from "../lib/local-save.ts";

const data=new Map<string,string>();
(globalThis as unknown as {localStorage:Storage}).localStorage={
 getItem:(key:string)=>data.get(key)??null,
 setItem:(key:string,value:string)=>{data.set(key,String(value));},
 removeItem:(key:string)=>{data.delete(key);},
 clear:()=>data.clear(),
 key:(index:number)=>[...data.keys()][index]??null,
 get length(){return data.size;}
} as Storage;
let current=readLocalCampaign();
assert.equal(current.revision,0);
assert.equal(current.state.schema,1);
const initialName=current.state.name;
let updated=updateLocalCampaign(current.revision,{type:"rename",name:"Guilda da Auditoria"});
assert.equal(updated.conflict,false);
assert.notEqual(updated.name,undefined); // validate local save wrapper
assert.equal(updated.state.name,"Guilda da Auditoria");
assert.equal(recoveryAvailable(),true);
const snapshot=JSON.parse(data.get(LOCAL_RECOVERY_KEY)!);
assert.equal(snapshot.state.name,initialName);
assert.equal(updateLocalCampaign(0,{type:"rename",name:"CONFLITO"}).conflict,true);
const exported=exportLocalCampaign();
assert.ok(exported.includes("cronicas-da-guilda-save-v1"));
assert.throws(()=>importLocalCampaign('{"format":"nope","state":{}}'),/Formato/);
assert.throws(()=>importLocalCampaign('{"format":"cronicas-da-guilda-save-v1","state":{"schema":1}}'),/dados obrigatórios/);
assert.equal(readLocalCampaign().state.name,"Guilda da Auditoria");
const previousRaw=data.get(LOCAL_SAVE_KEY)!;
data.set(LOCAL_SAVE_KEY,"{conteudo incompleto");
assert.throws(()=>readLocalCampaign(),/Salvamento inválido/);
assert.equal(data.get(LOCAL_SAVE_KEY),"{conteudo incompleto","Não sobrescrever save inválido");
assert.ok(recoveryAvailable());
const recovered=restoreRecoveryCampaign();
assert.equal(recovered.state.name,initialName);
assert.ok(recovered.revision>snapshot.revision);
assert.equal(readLocalCampaign().state.name,initialName);
const imported=importLocalCampaign(exported);
assert.equal(imported.state.name,"Guilda da Auditoria");
assert.ok(imported.revision>recovered.revision,"Backup não deve retroceder revisão");
assert.ok(previousRaw.includes("Guilda da Auditoria"));
console.log("FASE 8: salvamento corrompido preservado, recuperação, importação, revisão e conflito OK.");

assert.equal(WORLD_REGIONS.length,12);
assert.equal(Object.keys(REGIONAL_CHAPTERS).length,11);
const allNames=new Set<string>();
for(let i=0;i<12;i++){
 const s=newCampaign(85000+i);s.day=46;s.event=null;s.region=i+1;s.activeRegion=i+1;s.fame=10000;
 const entries=missions(s),boss=seasonBoss(s);
 assert.equal(entries.length,6);
 assert.equal(entries.every(m=>m.location===WORLD_REGIONS[i].name),true);
 assert.ok(boss?.title);
 for(const m of [...entries,boss!]){assert.ok(!allNames.has(m.title),"Missão duplicada: "+m.title);allNames.add(m.title);}
 const legacy=normalizeCampaign(JSON.parse(JSON.stringify(s)));
 assert.equal(legacy.activeRegion,i+1,"Mudou região no save");
}
assert.equal(allNames.size,84);
console.log("FASE 5: 72 contratos únicos + 12 guardiões preservados em saves das 12 regiões.");

for(const key of ["infirmary","forge","academy","library","stables","warroom"] as const){
 const s=newCampaign(1999);s.event=null;
 const cost=hqUpgradeCost(s,key);
 const old=s.hq[key];
 const changed=applyAction(s,{type:"upgrade-hq",building:key});
 assert.equal(changed.hq[key],old+1);
 assert.equal(changed.gold,s.gold-cost);
 assert.ok(hqUpgradeCost(changed,key)>cost);
 if(key==="forge")assert.equal(chestCapacity(changed)-chestCapacity(s),30);
 if(key==="academy")assert.ok(academySlots(changed)>academySlots(s));
 if(key==="library")assert.ok(heroStats(changed.heroes[1],changed).magic>heroStats(s.heroes[1],s).magic);
 if(key==="infirmary"||key==="stables"){
  s.heroes[0].energy=0;changed.heroes[0].energy=0;
  const a=applyAction(s,{type:"next-day"}).heroes[0].energy;
  const b=applyAction(changed,{type:"next-day"}).heroes[0].energy;
  assert.ok(b>a,key+" não melhora recuperação");
 }
}
console.log("FASE 4: 6 prédios e benefícios reais testados.");
const money=newCampaign(222);money.event=null;
assert.equal(typeof payroll(money),"number");
assert.equal(SEASON_DAYS,60);
assert.ok(payroll(money)>0&&money.gold>0);
console.log("FASE 7: folha semanal e planejamento financeiro consistentes.");
