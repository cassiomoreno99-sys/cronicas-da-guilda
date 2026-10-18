import assert from "node:assert/strict";
import {newCampaign,applyAction,normalizeCampaign,heroStats,heroLuck,seasonBoss} from "../lib/game.ts";
import {CATALOG_BY_ID,requiredSlot,TEST_ITEMS} from "../lib/catalog-test.ts";
import {imperialSetProgress,imperialSetBonuses,IMPERIAL_BOOKS,IMPERIAL_WEAPONS,IMPERIAL_SETS,IMPERIAL_ITEMS,IMPERIAL_CLASSES,IMPERIAL_BOOK_PRICE,IMPERIAL_WEAPON_IDS} from "../lib/imperial-content.ts";
import {imperialDropChance,awardCatalogLoot} from "../lib/catalog-runtime.ts";
import {teamKey} from "../lib/team-familiarity.ts";
import {performSupreme,type SupremeUnit} from "../lib/supreme-abilities.ts";
assert.equal(IMPERIAL_WEAPONS.length,7);
assert.equal(IMPERIAL_SETS.length,84);
assert.equal(IMPERIAL_BOOKS.length,7);
assert.equal(IMPERIAL_ITEMS.length,98);
assert.equal(new Set(IMPERIAL_ITEMS.map(x=>x.id)).size,98);
assert.ok(IMPERIAL_ITEMS.every(x=>CATALOG_BY_ID[x.id]&&TEST_ITEMS[x.id]));
assert.ok(IMPERIAL_WEAPONS.every(x=>x.categoria==="Arma Suprema Imperial"));
assert.ok(IMPERIAL_BOOKS.every(b=>b.preco_compra===IMPERIAL_BOOK_PRICE&&b.preco_venda===0));
assert.ok(IMPERIAL_CLASSES.every(c=>IMPERIAL_SETS.filter(x=>x.classes.includes(c.label)).length===12));
for(const [index,config] of IMPERIAL_CLASSES.entries()){
 let s=newCampaign(90001+index*11);s.event=null;
 const h=s.heroes[0];h.race=index%2?"elf":"orc";h.class=config.heroClass;h.level=50;
 const pieces=IMPERIAL_SETS.filter(x=>x.classes.includes(config.label));
 s.chest=pieces.map((d,i)=>({id:"imperial-"+i,key:d.id}));s.itemSequence=12;
 assert.deepEqual([...new Set(pieces.map(x=>requiredSlot(x)))].sort(),["weapon","offhand","helmet","shoulders","armor","gloves","belt","boots","cloak","ring","amulet"].sort());
 const baseline=heroStats(h,s);
 for(let n=0;n<12;n++){
  s=applyAction(s,{type:"equip",itemId:"imperial-"+n,heroId:h.id});
  const keys=s.chest.filter(x=>x.equippedTo===h.id).map(x=>x.key);
  assert.equal(imperialSetProgress(config.heroClass,keys).count,n+1);
  if([3,6,9,12].includes(n+1))assert.ok(Object.values(imperialSetBonuses(config.heroClass,keys)).some(x=>x>0));
 }
 const full=heroStats(s.heroes[0],s);
 assert.ok(full.attack>baseline.attack||full.magic>baseline.magic||full.defense>baseline.defense);
 assert.equal(s.chest.filter(x=>x.equippedTo===h.id).length,12);
 s=normalizeCampaign(JSON.parse(JSON.stringify(s)));
 assert.equal(imperialSetProgress(config.heroClass,s.chest.filter(x=>x.equippedTo===h.id).map(x=>x.key)).count,12);
 s=applyAction(s,{type:"unequip",itemId:"imperial-0"});
 const weapon=IMPERIAL_WEAPONS.find(x=>x.classes.includes(config.label))!;
 s.chest.push({id:"weapon-class",key:weapon.id});
 s=applyAction(s,{type:"equip",itemId:"weapon-class",heroId:h.id});
 assert.equal(imperialSetProgress(config.heroClass,s.chest.filter(x=>x.equippedTo===h.id).map(x=>x.key)).count,12);
 assert.equal(s.chest.filter(x=>x.equippedTo===h.id).length,12);
 const stranger=newCampaign(7000+index);stranger.event=null;stranger.heroes[0].level=50;
 stranger.heroes[0].class=IMPERIAL_CLASSES[(index+1)%7].heroClass;
 stranger.chest=[{id:"other-class",key:pieces[0].id}];
 assert.throws(()=>applyAction(stranger,{type:"equip",itemId:"other-class",heroId:stranger.heroes[0].id}),/Classe/);
}
for(const [index,book] of IMPERIAL_BOOKS.entries()){
 let s=newCampaign(60000+index);s.event=null;s.region=10;s.activeRegion=10;s.gold=IMPERIAL_BOOK_PRICE+250000;
 const h=s.heroes[0];h.class=IMPERIAL_CLASSES[index].heroClass;h.race="orc";h.level=50;
 const start=s.gold;
 s=applyAction(s,{type:"buy",key:book.id});
 assert.equal(s.gold,start-500000);
 assert.throws(()=>applyAction(s,{type:"buy",key:book.id}),/esgotado/i);
 const item=s.chest.find(x=>x.key===book.id)!;
 s=applyAction(s,{type:"learn-book",itemId:item.id,heroId:h.id});
 assert.equal(s.heroes[0].imperialBook,book.id);
 assert.equal(normalizeCampaign(JSON.parse(JSON.stringify(s))).heroes[0].imperialBook,book.id);
 const actor:SupremeUnit={id:"actor",name:"Imperial",side:"hero",hp:240,maxHp:300,attack:150,defense:100,magic:155,statuses:[]};
 const ally:SupremeUnit={id:"ally",name:"Aliado",side:"hero",hp:220,maxHp:300,attack:80,defense:90,magic:40,statuses:[]};
 const enemy:SupremeUnit={id:"enemy",name:"Inimigo",side:"enemy",hp:450,maxHp:450,attack:80,defense:35,magic:40,statuses:[]};
 const marks:string[]=[];
 performSupreme({actor,heroBook:book.id,units:()=>[actor,ally,enemy],allies:()=>[actor,ally],enemies:()=>[enemy],missionBoss:true,missionUndead:false,
  hit:(u,n)=>{const x=Math.min(u.hp,Math.max(1,Math.round(n)));u.hp-=x;return x;},
  heal:(u,n)=>{const x=Math.min(u.maxHp-u.hp,Math.round(n));u.hp+=x;return x;},
  status:(u,kind,rounds,amount)=>u.statuses.push({kind,rounds,amount}),previousDamage:{},cooldowns:{},round:1,revived:[],mark:t=>marks.push(t)});
 assert.ok(marks.some(x=>x.includes(book.id)));
 assert.ok(actor.statuses.length+ally.statuses.length+enemy.statuses.length>0||enemy.hp<450||actor.hp>240);
}
// Save racial antigo: preserva livro e 2 equipamentos previamente comprados.
{
 let s=newCampaign(88);s.event=null;s.heroes[0].class="mage";s.heroes[0].imperialBook="IMP-B-HUMAN";
 s.chest=[{id:"old-equipped",key:"IMP-S-HUMAN-02",equippedTo:s.heroes[0].id,equippedSlot:"offhand"},{id:"old-spare",key:"IMP-S-ELF-04"}];
 s=normalizeCampaign(JSON.parse(JSON.stringify(s)));
 assert.equal(s.heroes[0].imperialBook,"IMP-B-MAGE");
 assert.equal(s.chest.find(x=>x.id==="old-equipped")?.key,"IMP-S-MAGE-02");
 assert.equal(s.chest.find(x=>x.id==="old-spare")?.key,"IMP-S-MAGE-04");
}
{
 let s=newCampaign(23);s.region=1;s.activeRegion=1;s.gold=9999999;
 assert.throws(()=>applyAction(s,{type:"buy",key:IMPERIAL_BOOKS[0].id}),/mercador/);
 s=newCampaign(24);s.region=10;s.activeRegion=10;s.gold=499999;s.event=null;
 assert.throws(()=>applyAction(s,{type:"buy",key:IMPERIAL_BOOKS[0].id}),/ouro/i);
}
{
 let s=newCampaign(800);s.activeRegion=6;s.region=6;s.day=45;s.season=1;s.event=null;
 const mission=seasonBoss(s)!;const squad=s.heroes.slice(0,4).map(h=>h.id);
 assert.equal(imperialDropChance(s,{...mission,kind:"hunt"},squad),0);
 assert.equal(imperialDropChance(s,{...mission,location:"Deserto de Sahir"},squad),0);
 assert.equal(imperialDropChance(s,mission,[]),.20);
 const base=imperialDropChance(s,mission,squad);assert.ok(base>=.20&&base<=.30);
 s.teamFamiliarity={[teamKey(squad)]:15};
 const withFamiliarity=imperialDropChance(s,mission,squad);
 assert.ok(withFamiliarity>=base+.07&&withFamiliarity<=.40);
 s.teamFamiliarity={};
 assert.ok(squad.every(id=>heroLuck(s.heroes.find(h=>h.id===id)!,s)>=0));
 let drops=0; const sample=seasonBoss(s)!;
 for(let i=0;i<20000;i++){
  s.chest=[];s.claimedQuestItems=[];s.rng=(1234567+i*7919)>>>0;
  const loot=awardCatalogLoot(s,sample,squad);
  if(loot.some(k=>k.startsWith("IMP-S-")))drops++;
 }
 const expected=imperialDropChance(s,sample,squad)*20000;
 assert.ok(Math.abs(drops-expected)<1200,"Desvio de drop inesperado: "+drops+" de "+expected);
 console.log("SORTE SUPREMA: "+drops+"/20000 resultados com chance teórica de "+(expected/200).toFixed(2)+"%.");
}
console.log("ARSENAL IMPERIAL OK: 7 armas Supremas Imperiais, 84 peças (7x12), 7 livros de 500 mil, bônus, migração e drops por sorte/entrosamento.");
