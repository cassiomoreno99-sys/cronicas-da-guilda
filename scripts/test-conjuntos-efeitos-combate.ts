import assert from "node:assert/strict";
import {newCampaign,applyAction,missions,type HeroClass} from "../lib/game.ts";
import {equipmentSetCombatEffects} from "../lib/catalog-runtime.ts";
import {SETS} from "../lib/catalog-test.ts";
const classes:Record<string,HeroClass>={"Bastião do Leão":"warrior","Juramento Solar":"paladin","Rastro do Falcão":"ranger","Véu das Sete Lâminas":"rogue","Fortuna do Espetáculo":"bard"};
const key=(n:number)=>"CG-"+String(n).padStart(3,"0");
const nil={physicalReduction:0,incomingHealing:0,rangedDamage:0,bleedPoisonDamage:0,skillDamage:0};
const prepare=(name:string,seed:number)=>{
 let s=newCampaign(seed);s.event=null;
 s.heroes[0].class=classes[name];s.heroes[0].level=50;
 s.heroes.forEach(h=>{h.energy=100;h.injuredUntil=0;});
 s=applyAction(s,{type:"mission",missionId:missions(s)[0].id,team:s.team,tactic:"balanced",expeditionSlot:1,startedAt:1700000000000});
 const id=s.expeditions[0].id,c=s.expeditions[0].battle.combat!;
 const hero=c.fighters.find(f=>f.id===s.heroes[0].id)!;
 hero.setEffects=equipmentSetCombatEffects(hero.class!,SETS[name].items.map(key));
 const enemy=c.fighters.find(f=>f.side==="enemy")!;
 enemy.hp=enemy.maxHp=100000;enemy.defense=0;enemy.attack=300;
 for(const fighter of c.fighters.filter(f=>f.side==="enemy"&&f!==enemy))fighter.hp=0;
 hero.attack=400;hero.magic=1;hero.hp=hero.maxHp=5000;hero.defense=0;
 c.autoAbilities=false;
 return {s,id,c,hero,enemy};
};
const compare=(s:ReturnType<typeof prepare>["s"],id:string,actorId:string,modifiedId:string)=>{
 const zero=structuredClone(s),powered=structuredClone(s);
 const a=zero.expeditions[0].battle.combat!,b=powered.expeditions[0].battle.combat!;
 const bf=a.fighters.find(f=>f.id===modifiedId)!;
 bf.setEffects={...nil};
 for(const combat of [a,b]){
  combat.liveOrder=[actorId];combat.liveCursor=0;
 }
 zero.expeditions[0].battle.rounds=1;powered.expeditions[0].battle.rounds=1;
 const plain=applyAction(zero,{type:"battle-round",expeditionId:id});
 const buff=applyAction(powered,{type:"battle-round",expeditionId:id});
 return {
   plain:plain.expeditions[0].battle.log.filter(l=>l.amount&&l.actorId===actorId).at(-1),
   buff:buff.expeditions[0].battle.log.filter(l=>l.amount&&l.actorId===actorId).at(-1),
   p:plain.expeditions[0].battle.combat!,
   b:buff.expeditions[0].battle.combat!
 };
};
let verified=0;
for(let seed=0;seed<15;seed++){
 {
  const {s,id,c,hero,enemy}=prepare("Bastião do Leão",40000+seed);
  for(const f of c.fighters.filter(f=>f.side==="hero"&&f!==hero))f.hp=0;
  const d=compare(s,id,enemy.id,hero.id);
  assert.ok(d.plain?.amount&&d.buff?.amount,"Golpe do inimigo ausente");
  assert.ok(d.buff.amount<d.plain.amount,"Bastião não reduziu dano físico recebido");
  verified++;
 }
 {
  const {s,id,hero}=prepare("Rastro do Falcão",41000+seed);
  const d=compare(s,id,hero.id,hero.id);
  assert.ok(d.plain?.amount&&d.buff?.amount&&d.buff.amount>d.plain.amount,"Arqueiro não causou mais dano à distância");
  verified++;
 }
 {
  const {s,id,c,hero,enemy}=prepare("Véu das Sete Lâminas",42000+seed);
  enemy.statuses.push({kind:"poison",rounds:3,amount:5});
  const d=compare(s,id,hero.id,hero.id);
  assert.ok(d.plain?.amount&&d.buff?.amount&&d.buff.amount>d.plain.amount,"Assassino não causou dano extra em envenenado");
  verified++;
 }
 {
  const {s,id,c,hero,enemy}=prepare("Fortuna do Espetáculo",43000+seed);
  c.pendingAbilities=[{heroId:hero.id,abilityId:"pierrot-loaded-dice",targetId:enemy.id}];
  const d=compare(s,id,hero.id,hero.id);
  assert.ok(d.plain?.amount&&d.buff?.amount&&d.buff.amount>d.plain.amount,"Pierrô não causou bônus com habilidade");
  verified++;
 }
 {
  const {s,id,c,hero}=prepare("Juramento Solar",44000+seed);
  const second=s.heroes[1];second.class="healer";
  const actor=c.fighters.find(f=>f.id===second.id)!;
  actor.class="healer";actor.magic=450;actor.hp=actor.maxHp=1000;
  hero.hp=100;hero.maxHp=5000;
  for(const f of c.fighters.filter(f=>f.side==="hero"&&f!==hero&&f!==actor))f.hp=f.maxHp;
  const zero=structuredClone(s),buff=structuredClone(s);
  zero.expeditions[0].battle.combat!.fighters.find(f=>f.id===hero.id)!.setEffects={...nil};
  for(const campaign of [zero,buff]){
   const combat=campaign.expeditions[0].battle.combat!;
   combat.liveOrder=[actor.id];combat.liveCursor=0;combat.autoAbilities=false;
   campaign.expeditions[0].battle.rounds=1;
  }
  const plain=applyAction(zero,{type:"battle-round",expeditionId:id});
  const enhanced=applyAction(buff,{type:"battle-round",expeditionId:id});
  const baseHp=plain.expeditions[0].battle.combat!.fighters.find(f=>f.id===hero.id)!.hp;
  const goodHp=enhanced.expeditions[0].battle.combat!.fighters.find(f=>f.id===hero.id)!.hp;
  assert.ok(goodHp>baseHp,"Juramento Solar não aumenta cura recebida: "+goodHp+" vs "+baseHp);
  verified++;
 }
}
assert.equal(verified,75);
console.log("EFEITOS ESPECIAIS COMPARADOS: 75 execuções reais do combate 2D; redução física, dano à distância, veneno, habilidade e cura recebida.");
