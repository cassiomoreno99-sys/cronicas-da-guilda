import assert from "node:assert/strict";
import {newCampaign,applyAction,missions,seasonBoss,normalizeCampaign,activeExpeditions} from "../lib/game.ts";
import {awardCatalogLoot,imperialDropChance} from "../lib/catalog-runtime.ts";
import {testShop} from "../lib/catalog-test.ts";
import {chestCapacity,storageUsed} from "../lib/storage.ts";
import {LOCAL_SAVE_KEY,LOCAL_RECOVERY_KEY,readLocalCampaign,updateLocalCampaign,restoreRecoveryCampaign} from "../lib/local-save.ts";

const fresh=(seed:number)=>{const s=newCampaign(seed);s.event=null;return s;};
function goldInvariant(before:ReturnType<typeof fresh>,after:ReturnType<typeof fresh>){
 const entries=after.ledger.filter(x=>x.id>before.transaction);
 assert.equal(after.gold-before.gold,entries.reduce((sum,x)=>sum+x.amount,0),"Saldo não fecha com o livro-caixa");
 assert.ok(Number.isSafeInteger(after.gold)&&after.gold>=0,"Saldo inválido ou negativo");
 assert.equal(after.transaction-before.transaction,entries.length,"Numeração de transação incorreta");
}
// Auditoria de lançamentos, compra, venda, melhorias, despesas e virada semanal.
for(let seed=0;seed<30;seed++){
 let s=fresh(17000+seed);s.gold=50000;
 const stock=testShop(s).find(x=>x.preco_compra!==null&&x.preco_venda>0);
 assert.ok(stock,"Loja inicial sem produto vendável");
 let prev=s;s=applyAction(s,{type:"buy",key:stock.id});goldInvariant(prev,s);
 const purchased=s.chest.find(i=>i.key===stock.id)!;
 prev=s;s=applyAction(s,{type:"sell",itemId:purchased.id});goldInvariant(prev,s);
 prev=s;s=applyAction(s,{type:"upgrade-hq",building:"forge"});goldInvariant(prev,s);
 for(let step=0;step<10;step++){
  s.event=null;prev=s;
  if(step%3===0) s=applyAction(s,{type:"rest"});
  else if(step%3===1)s=applyAction(s,{type:"next-day"});
  else s=applyAction(s,{type:"train-hero",heroId:s.heroes[0].id});
  goldInvariant(prev,s);
  if(step%3===0){
   const prior=s;assert.throws(()=>applyAction(s,{type:"rest"}),/descansou/);
   assert.equal(s.gold,prior.gold,"Descanso repetido alterou saldo");
  }
 }
}
console.log("OURO: 390 movimentos reconciliados contra lançamentos do livro-caixa e bloqueios de duplicação.");
// Não deve resolver outra batalha se um comando antigo chegar atrasado no Android.
{
 let s=fresh(67843);s.heroes.forEach(h=>{h.energy=100;h.injuredUntil=0;});
 const missionsToday=missions(s);
 const firstTeam=s.heroes.slice(0,3).map(h=>h.id);
 s=applyAction(s,{type:"mission",missionId:missionsToday[0].id,team:firstTeam,tactic:"balanced",startedAt:100});
 const first=s.expeditions.at(-1)!.id;
 s.heroes.push(...s.heroes.slice(0,3).map((h,i)=>({...h,id:"test-extra-"+i,name:"Herói reserva "+i,energy:100})));
 const secondTeam=s.heroes.slice(-3).map(h=>h.id);
 s=applyAction(s,{type:"mission",missionId:missionsToday[1].id,team:secondTeam,tactic:"balanced",expeditionSlot:2,startedAt:100});
 const second=s.expeditions.at(-1)!.id;
 assert.notEqual(first,second);
 const oldGold=s.gold;
 for(const type of ["battle-auto","battle-round","battle-retreat"] as const)
  assert.throws(()=>applyAction(s,{type,expeditionId:"expedition-inexistente"}),/expedição|combate/i);
 assert.equal(s.gold,oldGold);
 assert.equal(activeExpeditions(s).length,2);
 s=applyAction(s,{type:"battle-auto",expeditionId:first});
 assert.ok(activeExpeditions(s).some(e=>e.id===second));
 const singleGold=s.gold;
 assert.throws(()=>applyAction(s,{type:"battle-auto",expeditionId:first}),/expedição|combate/i);
 assert.equal(s.gold,singleGold);
 s=applyAction(s,{type:"battle-auto",expeditionId:second});
 const finalGold=s.gold;
 assert.throws(()=>applyAction(s,{type:"battle-auto",expeditionId:second}),/expedição|combate/i);
 assert.equal(s.gold,finalGold,"Recompensa duplicada em batalha encerrada");
}
console.log("BATALHA 2D: duas expedições simultâneas, IDs expirados bloqueados e prêmios pagos no máximo uma vez.");
// 250 rolagens de chefe em baú cheio: nenhuma peça imperial ou de missão desaparece.
{
 let s=fresh(65423);s.activeRegion=6;s.region=6;s.day=45;s.season=1;
 const cap=chestCapacity(s);
 s.chest=Array.from({length:cap},(_,i)=>({id:"item-"+(i+1),key:"CG-001"}));
 s.itemSequence=cap;
 const boss=seasonBoss(s)!;assert.ok(boss);
 const team=s.heroes.slice(0,4).map(h=>h.id);
 assert.ok(imperialDropChance(s,boss,team)>=.20);
 let supreme=0;
 for(let i=0;i<250;i++){
  const before=s.pendingRewards?.length||0;
  const loot=awardCatalogLoot(s,boss,team);
  const retained=loot.filter(key=>key.startsWith("IMP-")||s.claimedQuestItems.includes(key)).length;
  assert.equal(s.pendingRewards?.length||0,before+retained,"Recompensa obrigatória perdida");
  assert.equal(storageUsed(s.chest),cap,"Recompensa ultrapassou capacidade do baú");
  supreme+=loot.filter(key=>key.startsWith("IMP-S-")).length;
 }
 assert.ok(supreme>20&&supreme<100,"Probabilidade de recompensa imperial fora da faixa: "+supreme);
 const all=[...s.chest,...(s.pendingRewards||[])];
 assert.equal(new Set(all.map(i=>i.id)).size,all.length,"ID de recompensa duplicado");
 const queued=s.pendingRewards!.length;
 s.chest.splice(0,5);
 s=normalizeCampaign(s);
 s=applyAction(s,{type:"claim-pending-rewards"});
 assert.equal(s.pendingRewards!.length,queued-5);
 assert.equal(storageUsed(s.chest),cap);
 console.log("BAÚ CHEIO: "+supreme+" peças Supremas Imperiais preservadas em 250 chefes; resgate sem duplicações.");
}
// Em Android, leitura e conflito não devem causar gravações; resgate continua íntegro.
{
 const storage=new Map<string,string>();let writes=0;
 const old=Object.getOwnPropertyDescriptor(globalThis,"localStorage");
 Object.defineProperty(globalThis,"localStorage",{configurable:true,value:{
  getItem:(k:string)=>storage.get(k)||null,
  setItem:(k:string,v:string)=>{writes++;storage.set(k,v);},
  removeItem:(k:string)=>{storage.delete(k);}
 }});
 try{
  const init=readLocalCampaign();assert.equal(writes,1);
  const loaded=readLocalCampaign();assert.equal(writes,1,"Leitura redundante escreveu no Android");
  const conflict=updateLocalCampaign(999,{type:"league-auto-reserve",enabled:true});
  assert.equal(conflict.conflict,true);assert.equal(writes,1,"Conflito de revisão gravou sem necessidade");
  const next=updateLocalCampaign(loaded.revision,{type:"league-auto-reserve",enabled:true});
  assert.equal(next.conflict,false);assert.equal(writes,3);
  assert.ok(storage.has(LOCAL_SAVE_KEY)&&storage.has(LOCAL_RECOVERY_KEY));
  assert.equal(next.state.gold,init.state.gold);
  const prior=restoreRecoveryCampaign();
  assert.equal(prior.state.gold,init.state.gold);
  assert.ok(prior.revision>next.revision);
 }finally{
  if(old)Object.defineProperty(globalThis,"localStorage",old);
  else delete (globalThis as {localStorage?:unknown}).localStorage;
 }
}
console.log("ANDROID: leitura sem escrita, conflito seguro, exatamente duas gravações por ação e recuperação íntegra.");
console.log("AUDITORIA RIGOROSA — OURO, BATALHA 2D E ANDROID: APROVADA.");
