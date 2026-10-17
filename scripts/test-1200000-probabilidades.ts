import assert from "node:assert/strict";
import {mkdirSync,writeFileSync} from "node:fs";
import {newCampaign,academyCandidateChance,rivalWinChance,negotiationQuote,rankingRecruitQuote,heroStats,heroLuck,
 seasonalThreat,missionReadiness,missions,heroLeaderboard,leagueLineup,market,
 applyAction,normalizeCampaign,type HeroClass} from "../lib/game.ts";
import {SETS} from "../lib/catalog-test.ts";
import {equipmentSetProgress,equipmentSetCombatEffects,setBonuses} from "../lib/catalog-runtime.ts";

const shard=Number(process.env.QA_SHARD??process.argv[2]??0),ITERATIONS=150000;
assert.ok(Number.isInteger(shard)&&shard>=0&&shard<8);
let rnd=(0x8fa49b8e+shard*13271)>>>0;
const random=()=>{rnd=(Math.imul(1664525,rnd)+1013904223)>>>0;return rnd/4294967296;};
const between=(min:number,max:number)=>min+Math.floor(random()*(max-min+1));
const strategies=["academia","chance dos rivais","persuasão","multa e prestígio","atributos","ameaça sazonal","preparo das missões","conjuntos"];
const classes:Record<string,HeroClass>={"Guerreiro":"warrior","Cavaleiro":"paladin","Arqueiro":"ranger","Assassino":"rogue","Mago":"mage","Sacerdote":"healer","Pierrô":"bard"};
let s=newCampaign(20261017+shard*1049);s.event=null;
let evaluations=0,monteCarlo=0,accepted=0,rejected=0,finiteFailures=0,sampledSaves=0,appliedActions=0;
let expectedSuccess=0;
const counts=Array.from({length:8},()=>0);
const started=Date.now();
function finiteNumbers(label:string,record:Record<string,number>){
 for(const [key,value] of Object.entries(record)){
  assert.ok(Number.isFinite(value),label+" inválido: "+key+" = "+value);
 }
}
for(let i=0;i<ITERATIONS;i++){
 const kind=(i+shard)%8;
 // Varia pelo menos seis dimensões simultaneamente: época, nível, energia,
 // lealdade, prestígio e classe. Nenhum resultado está fixado no teste.
 const hero=s.heroes[i%s.heroes.length];
 hero.level=between(1,50);hero.energy=between(0,100);hero.injuredUntil=0;
 s.season=between(1,3500);s.day=(s.season-1)*60+between(1,60);
 s.fame=between(0,12000);s.gold=between(0,80000);
 const guild=s.rivals[between(0,s.rivals.length-1)];
 const rival=guild.heroes[between(0,guild.heroes.length-1)];
 rival.loyalty=between(15,99);rival.level=between(1,50);
 const dice=random();
 if(kind===0){
  s.hq.academy=between(0,10);
  const c={joinedDay:s.day-between(0,90),aptitude:between(-15,35),practice:between(0,7),genius:random()>.9} as Parameters<typeof academyCandidateChance>[1];
  const p=academyCandidateChance(s,c);
  assert.ok(Number.isInteger(p)&&p>=5&&p<=92,"Chance da Academia fora 5–92%: "+p);
  const got=dice*100<p;got?accepted++:rejected++;expectedSuccess+=p/100;monteCarlo++;
 }else if(kind===1){
  const p=rivalWinChance(guild,s);
  assert.ok(Number.isFinite(p)&&p>=.22&&p<=.84,"Chance da Liga rival fora do limite: "+p);
  const got=dice<p;got?accepted++:rejected++;expectedSuccess+=p;monteCarlo++;
 }else if(kind===2){
  const q=negotiationQuote(s,guild,rival,random()<.35?"covert":"offer");
  finiteNumbers("Negociação",{chance:q.chance,fee:q.fee,price:q.price,salary:q.salary,requiredFame:q.requiredFame});
  assert.ok(q.chance>=20&&q.chance<=92&&q.price>=0&&q.fee>=0);
  assert.equal(q.eligible,!q.reason);
  if(q.eligible){const got=dice*100<q.chance;got?accepted++:rejected++;expectedSuccess+=q.chance/100;monteCarlo++;}
 }else if(kind===3){
  const q=rankingRecruitQuote(s,guild,rival,"buyout");
  finiteNumbers("Multa",{chance:q.chance,fee:q.fee,price:q.price,prestigeCost:q.prestigeCost,salary:q.salary});
  assert.equal(q.chance,100);
  assert.ok(q.prestigeCost>0&&q.requiredFame>=q.prestigeCost&&q.price>=0);
  assert.equal(q.eligible,!q.reason);
  if(q.eligible)assert.ok(s.fame>=q.prestigeCost&&s.gold>=q.price);
 }else if(kind===4){
  const stats=heroStats(hero,s);
  finiteNumbers("Atributos",stats as unknown as Record<string,number>);
  assert.ok(stats.attack>=0&&stats.defense>=0&&stats.magic>=0&&stats.hp>=0&&stats.speed>=0);
  assert.ok(stats.critical>=0&&stats.critical<=1&&heroLuck(hero,s)>=0&&heroLuck(hero,s)<=.45);
 }else if(kind===5){
  const season=between(1,100000),a=seasonalThreat(season,.06),b=seasonalThreat(season+1,.06);
  assert.ok(Number.isFinite(a)&&a>=1&&b>=a&&a<=18.1,"Ameaça sazonal fora do limite: "+a);
  if(season<=249)assert.ok(Math.abs(a-(1+(season-1)*.06))<1e-8,"Curva anterior mudou");
 }else if(kind===6){
  const ms=missions(s),mission=ms[between(0,ms.length-1)];
  const readiness=missionReadiness(s,mission,s.team);
  assert.ok(["ready","prepare","risk"].includes(readiness.level));
  assert.ok(readiness.label.length>0&&readiness.hint.length>0);
  const line=leagueLineup(s);assert.ok(line.ids.length<=4&&line.missing>=0&&line.missing<=3);
 }else{
  const entries=Object.entries(SETS),[name,def]=entries[between(0,entries.length-1)];
  const cl=classes[def.classe],keys=def.items.map(n=>"CG-"+String(n).padStart(3,"0"));
  const equipCount=between(0,3),worn=keys.slice(0,equipCount);
  const p=equipmentSetProgress(cl,worn).find(x=>x.name===name);
  assert.equal(p?.count,equipCount);
  const stat=setBonuses(s,cl,worn);
  finiteNumbers("Conjuntos",stat);
  const fx=equipmentSetCombatEffects(cl,worn);finiteNumbers("Efeitos 3/3",fx);
  assert.ok(Object.values(fx).every(n=>n>=0&&n<=.1));
  if(equipCount<3)assert.ok(Object.values(fx).every(n=>n===0));
 }
 counts[kind]++;evaluations++;
 if((i+1)%30000===0)console.log("PROBABILIDADES shard "+shard+" "+(i+1)+"/"+ITERATIONS);
}
// Ensaios reais complementares do motor, não confundidos com avaliações
// probabilísticas: persistência de recrutamento e de campanhas.
for(let k=0;k<35;k++){
 let c=newCampaign(880001+shard*601+k);c.gold=200000;c.fame=100000;c.event=null;
 const ranked=heroLeaderboard(c).slice(0,10).find(h=>!h.owned);
 if(!ranked)continue;
 const g=c.rivals.find(g=>g.heroes.some(h=>h.id===ranked.id))!;
 const before=c.fame;
 const q=rankingRecruitQuote(c,g,g.heroes.find(h=>h.id===ranked.id)!,"buyout");
 const hired=applyAction(c,{type:"rank-recruit",guildId:g.id,heroId:ranked.id,method:"buyout"});
 assert.equal(hired.fame,before-q.prestigeCost);
 assert.equal(hired.heroes.some(h=>h.id===ranked.id),true);
 const restored=normalizeCampaign(JSON.parse(JSON.stringify(hired)));
 assert.equal(restored.fame,hired.fame);
 appliedActions++;sampledSaves++;
}
assert.equal(evaluations,ITERATIONS);
const report={passed:true,shard,iterations:evaluations,scenarioFamilies:strategies,counts,monteCarlo,accepted,rejected,
 expectedSuccess,observedSuccess:accepted,actualRecruitments:appliedActions,actualSaveRoundTrips:sampledSaves,elapsedMs:Date.now()-started};
mkdirSync("qa-report",{recursive:true});writeFileSync("qa-report/probabilities-"+shard+".json",JSON.stringify(report,null,2));
console.log("AUDITORIA 150000 AVALIAÇÕES PASSOU "+JSON.stringify({...report,scenarioFamilies:strategies.length}));
