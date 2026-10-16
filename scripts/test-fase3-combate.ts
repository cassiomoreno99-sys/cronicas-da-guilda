import assert from "node:assert/strict";
import {newCampaign,missions,applyAction,normalizeCampaign,availableAbilities} from "../lib/game.ts";
function start(seed:number){const st=newCampaign(seed);st.event=null;let s=applyAction(st,{type:"mission",missionId:missions(st)[0].id,team:st.team,tactic:"balanced",expeditionSlot:1,startedAt:1700000000000});return {s,id:s.expeditions[0].id};}
const get=(s:ReturnType<typeof newCampaign>,id:string)=>s.expeditions.find(e=>e.id===id)!.battle;
let {s,id}=start(34384);
const enemy=get(s,id).combat!.fighters.filter(f=>f.side==="enemy")[1];assert.ok(enemy);enemy.hp=3000;enemy.maxHp=3000;
assert.throws(()=>applyAction(s,{type:"battle-focus",expeditionId:id,targetId:"fake"}),/inimigo vivo/);
s=applyAction(s,{type:"battle-focus",expeditionId:id,targetId:enemy.id});
s=applyAction(s,{type:"battle-auto-abilities",expeditionId:id,enabled:false});
assert.equal(normalizeCampaign(s).expeditions[0].battle.combat?.autoAbilities,false);
s=JSON.parse(JSON.stringify(s));
assert.equal(normalizeCampaign(s).expeditions[0].battle.combat?.focusTargetId,enemy.id);
let hits=0;
for(let n=0;n<36&&get(s,id).status==="active";n++){
 const old=get(s,id).log.length;s=applyAction(s,{type:"battle-round",expeditionId:id});
 for(const l of get(s,id).log.slice(old))if(l.kind==="hit"&&l.actorId&&s.heroes.some(h=>h.id===l.actorId)&&l.amount&&l.amount>0){assert.equal(l.targetId,enemy.id,"Foco não influenciou golpe comum");hits++;}
}
assert.ok(hits>=2,"Foco sem golpes suficientes");
assert.ok(!get(s,id).log.some(l=>l.kind==="ability"&&l.actorId&&s.heroes.some(h=>h.id===l.actorId)),"Habilidade automática executada quando desativada");
s=applyAction(s,{type:"battle-focus",expeditionId:id});
assert.equal(get(s,id).combat?.focusTargetId,undefined);
s=applyAction(s,{type:"battle-auto-abilities",expeditionId:id,enabled:true});
assert.equal(get(s,id).combat?.autoAbilities,true);
let b=start(34385),t=b.s,exp=b.id;const mage=t.heroes.find(h=>t.expeditions[0].team.includes(h.id)&&h.class==="mage")!;const skill=availableAbilities(mage)[0];assert.ok(skill);
const foe=t.expeditions[0].battle.combat!.fighters.find(f=>f.side==="enemy")!;
const target=skill.target==="enemy"?{targetId:foe.id}:skill.target==="ally"?{targetId:t.expeditions[0].team[0]}:{};
t=applyAction(t,{type:"battle-ability",expeditionId:exp,heroId:mage.id,abilityId:skill.id,...target});
assert.equal(get(t,exp).combat?.pendingAbilities.length,1);
t=applyAction(t,{type:"battle-cancel-ability",expeditionId:exp,heroId:mage.id});
assert.equal(get(t,exp).combat?.pendingAbilities.length,0);
assert.throws(()=>applyAction(t,{type:"battle-cancel-ability",expeditionId:exp,heroId:mage.id}),/ordem pendente/);
t=applyAction(t,{type:"battle-focus",expeditionId:exp,targetId:foe.id});
t.expeditions[0].battle.combat!.fighters.find(f=>f.id===foe.id)!.hp=0;
assert.equal(normalizeCampaign(t).expeditions[0].battle.combat?.focusTargetId,undefined);
for(let seed=0;seed<12;seed++){
 const run=start(55000+seed*17);let c=run.s;
 if(seed%2===0){const f=c.expeditions[0].battle.combat!.fighters.find(x=>x.side==="enemy")!;c=applyAction(c,{type:"battle-focus",expeditionId:run.id,targetId:f.id});}
 if(seed%3===0)c=applyAction(c,{type:"battle-auto-abilities",expeditionId:run.id,enabled:false});
 let n=0;while(get(c,run.id).status==="active"&&n++<260){c=applyAction(c,{type:"battle-round",expeditionId:run.id});if(n%5===0)c=JSON.parse(JSON.stringify(c));}
 assert.ok(n<260,"Combate travou "+seed);assert.ok(["won","lost"].includes(get(c,run.id).status||""));
 assert.equal(get(c,run.id).combat,undefined);
}
console.log("FASE3 ENGINE OK: foco, 12 batalhas, auto habilidades, ordens e reabertura de salvamentos.");
