import assert from "node:assert/strict";
import {newCampaign,applyAction,normalizeCampaign,heroStats,missions,type HeroClass} from "../lib/game.ts";
import {SETS,CATALOG_BY_ID} from "../lib/catalog-test.ts";
import {equipmentSetProgress,equipmentSetCombatEffects,setBonuses} from "../lib/catalog-runtime.ts";
const classes:Record<string,HeroClass>={"Guerreiro":"warrior","Cavaleiro":"paladin","Arqueiro":"ranger","Assassino":"rogue","Mago":"mage","Sacerdote":"healer","Pierrô":"bard"};
const empty={physicalReduction:0,incomingHealing:0,rangedDamage:0,bleedPoisonDamage:0,skillDamage:0};
const all=Object.entries(SETS);
let double=0,complete=0,saves=0,battles=0,unequips=0;
for(const [index,[name,def]] of all.entries()){
 const cl=classes[def.classe],keys=def.items.map(n=>"CG-"+String(n).padStart(3,"0"));
 assert.equal(keys.length,3);assert.ok(keys.every(k=>CATALOG_BY_ID[k]?.conjunto===name));
 for(let n=0;n<25;n++){
  let s=newCampaign(80010+index*997+n*43);s.event=null;
  const hero=s.heroes[0];hero.class=cl;hero.level=50;hero.energy=100;hero.injuredUntil=0;
  const hid=hero.id;
  s.chest=keys.map((key,i)=>({id:"test-set-"+i,key}));s.itemSequence=3;
  const measure=()=>equipmentSetProgress(cl,s.chest.filter(i=>i.equippedTo===hid).map(i=>i.key)).find(x=>x.name===name)!;
  assert.equal(measure().count,0);
  assert.deepEqual(equipmentSetCombatEffects(cl,[]),empty);
  s=applyAction(s,{type:"equip",itemId:"test-set-0",heroId:hid});
  assert.equal(measure().count,1);
  assert.deepEqual(equipmentSetCombatEffects(cl,[keys[0]]),empty);
  s=applyAction(s,{type:"equip",itemId:"test-set-1",heroId:hid});
  assert.equal(measure().count,2);
  const stats2=heroStats(s.heroes[0],s);
  const buffs2=setBonuses(s,cl,keys.slice(0,2));
  assert.ok(Object.values(buffs2).some(v=>v>0));
  assert.deepEqual(equipmentSetCombatEffects(cl,keys.slice(0,2)),empty);
  double++;
  s=normalizeCampaign(JSON.parse(JSON.stringify(s)));
  assert.equal(measure().count,2);
  s=applyAction(s,{type:"equip",itemId:"test-set-2",heroId:hid});
  assert.equal(measure().count,3);
  const buffs3=setBonuses(s,cl,keys);
  for(const key of Object.keys(buffs3) as Array<keyof typeof buffs3>)assert.ok(buffs3[key]>=buffs2[key],"Perdeu bônus "+name+" "+key);
  const stats3=heroStats(s.heroes[0],s);
  assert.ok(stats3.hp>=stats2.hp);
  assert.ok(measure().pieces.every(p=>p.owned));
  const fx=equipmentSetCombatEffects(cl,keys);
  const special=["Bastião do Leão","Juramento Solar","Rastro do Falcão","Véu das Sete Lâminas","Fortuna do Espetáculo"].includes(name);
  assert.equal(Object.values(fx).filter(v=>v>0).length,special?1:0);
  assert.ok(Object.values(fx).every(x=>x>=0&&x<=.10));
  assert.equal(equipmentSetProgress(Object.values(classes).find(x=>x!==cl)!,keys).some(set=>set.name===name),false);
  assert.deepEqual(equipmentSetCombatEffects(Object.values(classes).find(x=>x!==cl)!,keys),empty);
  s=normalizeCampaign(JSON.parse(JSON.stringify(s)));
  assert.equal(measure().count,3);saves++;complete++;
  if(n<10){
   s.heroes.slice(0,4).forEach(h=>{h.level=50;h.energy=100;h.injuredUntil=0;h.defense+=80;});
   s=applyAction(s,{type:"mission",missionId:missions(s)[0].id,team:s.team,tactic:"balanced",expeditionSlot:1,startedAt:1700000000000});
   const e=s.expeditions[0];
   const f=e.battle.combat!.fighters.find(f=>f.id===hid)!;
   assert.deepEqual(f.setEffects,fx,"Efeito 3/3 não foi transferido ao combate");
   s=applyAction(s,{type:"battle-auto",expeditionId:e.id});
   assert.notEqual(s.expeditions[0].battle.status,"active");
   battles++;
  }else{
   s=applyAction(s,{type:"unequip",itemId:"test-set-2"});
   assert.equal(measure().count,2);
   assert.deepEqual(equipmentSetCombatEffects(cl,s.chest.filter(i=>i.equippedTo===hid).map(i=>i.key)),empty);
   s=applyAction(s,{type:"unequip",itemId:"test-set-1"});
   assert.equal(measure().count,1);
   assert.ok(Object.values(setBonuses(s,cl,[keys[0]])).every(v=>v===0));
   unequips++;
  }
 }
}
assert.equal(complete,175);assert.equal(double,175);assert.equal(saves,175);assert.equal(battles,70);assert.equal(unequips,105);
console.log("CONJUNTOS OK: "+all.length+" sets; "+double+" ativações 2/3; "+complete+" ativações 3/3; "+saves+" saves; "+battles+" batalhas 2D; "+unequips+" desmontagens.");
