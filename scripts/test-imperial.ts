import assert from "node:assert/strict";
import {newCampaign,applyAction,normalizeCampaign,heroStats,heroRace} from "../lib/game.ts";
import {CATALOG_BY_ID,requiredSlot,TEST_ITEMS} from "../lib/catalog-test.ts";
import {imperialSetProgress,imperialSetBonuses,IMPERIAL_BOOKS,IMPERIAL_WEAPONS,IMPERIAL_SETS,IMPERIAL_ITEMS,IMPERIAL_RACES,IMPERIAL_BOOK_PRICE,IMPERIAL_WEAPON_IDS} from "../lib/imperial-content.ts";
import {performSupreme,type SupremeUnit} from "../lib/supreme-abilities.ts";

assert.equal(IMPERIAL_WEAPONS.length,7);
assert.equal(IMPERIAL_SETS.length,72);
assert.equal(IMPERIAL_BOOKS.length,6);
assert.equal(IMPERIAL_ITEMS.length,85);
assert.equal(new Set(IMPERIAL_ITEMS.map(x=>x.id)).size,85);
assert.ok(IMPERIAL_ITEMS.every(x=>CATALOG_BY_ID[x.id]&&TEST_ITEMS[x.id]));
assert.ok(IMPERIAL_BOOKS.every(b=>b.preco_compra===IMPERIAL_BOOK_PRICE&&b.preco_venda===0));
assert.ok(IMPERIAL_RACES.every(r=>IMPERIAL_SETS.filter(x=>x.race===r.race).length===12));

for(const [index,set] of IMPERIAL_RACES.entries()){
 let s=newCampaign(90001+index*11);
 s.event=null;
 const h=s.heroes[0];h.race=set.race;h.class="warrior";h.level=50;
 const keyset=IMPERIAL_SETS.filter(x=>x.race===set.race);
 s.chest=keyset.map((d,i)=>({id:"imperial-"+i,key:d.id}));
 s.itemSequence=12;
 assert.deepEqual([...new Set(keyset.map(x=>requiredSlot(x)))].sort(),
 ["weapon","offhand","helmet","shoulders","armor","gloves","belt","boots","cloak","ring","amulet"].sort());
 const baseline=heroStats(h,s);
 for(let n=0;n<12;n++){
  s=applyAction(s,{type:"equip",itemId:"imperial-"+n,heroId:h.id});
  const equipped=s.chest.filter(x=>x.equippedTo===h.id).map(x=>x.key);
  assert.equal(imperialSetProgress(set.race,equipped).count,n+1);
  if([3,6,9,12].includes(n+1)){
   const bonus=imperialSetBonuses(set.race,equipped);
   assert.ok(Object.values(bonus).some(x=>x>0));
  }
 }
 const full=heroStats(s.heroes[0],s);
 assert.ok(full.attack>baseline.attack||full.magic>baseline.magic||full.defense>baseline.defense);
 const equipped=s.chest.filter(x=>x.equippedTo===h.id).map(x=>x.key);
 assert.equal(imperialSetProgress(set.race,equipped).count,12);
 assert.equal(s.chest.filter(x=>x.equippedTo===h.id).length,12);
 s=normalizeCampaign(JSON.parse(JSON.stringify(s)));
 assert.equal(imperialSetProgress(set.race,s.chest.filter(x=>x.equippedTo===h.id).map(x=>x.key)).count,12);
 s=applyAction(s,{type:"unequip",itemId:"imperial-0"});
 assert.equal(imperialSetProgress(set.race,s.chest.filter(x=>x.equippedTo===h.id).map(x=>x.key)).count,11);
 s.chest.push({id:"imperial-class-weapon",key:IMPERIAL_WEAPON_IDS[0]});
 s=applyAction(s,{type:"equip",itemId:"imperial-class-weapon",heroId:h.id});
 assert.equal(imperialSetProgress(set.race,s.chest.filter(x=>x.equippedTo===h.id).map(x=>x.key)).count,12,"A arma suprema precisa substituir a peça racial sem criar slot extra.");
 assert.equal(s.chest.filter(x=>x.equippedTo===h.id).length,12,"O herói precisa seguir com apenas doze slots");
 const stranger=newCampaign(7000+index);
 stranger.event=null;
 stranger.heroes[0].level=50;
 stranger.heroes[0].race=IMPERIAL_RACES[(index+1)%6].race;
 stranger.chest=[{id:"wrong-race",key:keyset[0].id}];
 assert.throws(()=>applyAction(stranger,{type:"equip",itemId:"wrong-race",heroId:stranger.heroes[0].id}),/raça/);
}

for(const [index,book] of IMPERIAL_BOOKS.entries()){
 let s=newCampaign(60000+index);
 s.event=null;s.region=10;s.activeRegion=10;s.gold=IMPERIAL_BOOK_PRICE+250000;
 const h=s.heroes[0];h.race=book.race;h.level=50;
 const initial=s.gold;
 s=applyAction(s,{type:"buy",key:book.id});
 assert.equal(s.gold,initial-500000,"Preço do livro deve ser exatamente 500.000.");
 assert.throws(()=>applyAction(s,{type:"buy",key:book.id}),/esgotado/i,"Sem compras duplicadas na semana");
 const item=s.chest.find(x=>x.key===book.id)!;
 s=applyAction(s,{type:"learn-book",itemId:item.id,heroId:h.id});
 assert.equal(s.heroes[0].imperialBook,book.id);
 assert.ok(!s.chest.some(x=>x.id===item.id));
 assert.equal(normalizeCampaign(JSON.parse(JSON.stringify(s))).heroes[0].imperialBook,book.id);
 assert.equal(heroRace(s.heroes[0]),book.race);
 const actor:SupremeUnit={id:"actor",name:"Imperial",side:"hero",hp:300,maxHp:300,attack:150,defense:100,magic:155,statuses:[]};
 const ally:SupremeUnit={id:"ally",name:"Aliado",side:"hero",hp:220,maxHp:300,attack:80,defense:90,magic:40,statuses:[]};
 const enemy:SupremeUnit={id:"enemy",name:"Inimigo",side:"enemy",hp:450,maxHp:450,attack:80,defense:35,magic:40,statuses:[]};
 const marks:string[]=[];
 performSupreme({actor,heroBook:book.id,units:()=>[actor,ally,enemy],allies:()=>[actor,ally],enemies:()=>[enemy],missionBoss:true,missionUndead:false,
  hit:(u,n)=>{const x=Math.min(u.hp,Math.max(1,Math.round(n)));u.hp-=x;return x;},
  heal:(u,n)=>{const x=Math.min(u.maxHp-u.hp,Math.round(n));u.hp+=x;return x;},
  status:(u,kind,rounds,amount)=>u.statuses.push({kind,rounds,amount}),previousDamage:{},cooldowns:{},round:1,revived:[],mark:t=>marks.push(t)});
 assert.ok(marks.some(x=>x.includes(book.id)),"Habilidade racial não executou");
 assert.ok(actor.statuses.length+ally.statuses.length+enemy.statuses.length>0||enemy.hp<450);
}
{
 let s=newCampaign(23);s.region=1;s.activeRegion=1;s.gold=9999999;
 assert.throws(()=>applyAction(s,{type:"buy",key:IMPERIAL_BOOKS[0].id}),/mercador/);
 s=newCampaign(24);s.region=10;s.activeRegion=10;s.gold=499999;s.event=null;
 assert.throws(()=>applyAction(s,{type:"buy",key:IMPERIAL_BOOKS[0].id}),/ouro/i);
}
console.log("ARSENAL IMPERIAL OK: 7 armas, 72 peças (6x12), 6 livros a 500.000 ouro, compra, raça, atributos, 12 slots, save e 6 poderes.");
