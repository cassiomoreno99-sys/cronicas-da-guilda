import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newCampaign,applyAction,treasuryForecast,bossTacticHint,missions,seasonBoss,ITEMS,heroRace} from "../lib/game.ts";
import {equippedPosition} from "../lib/catalog-test.ts";
import {WORLD_REGIONS} from "../lib/v130-content.ts";
import {enemyArtSource,enemyArtKey} from "../lib/enemy-art.ts";

// A arte específica precisa ser usada NA ARENA, não apenas existir no catálogo.
const arena=readFileSync("app/arena-2d.tsx","utf8");
const ui=readFileSync("app/game-client.tsx","utf8");
const css=readFileSync("app/arena-2d.css","utf8");
assert.match(arena,/src:enemyArtSource\(f\.name\)/);
assert.match(arena,/guild2d-weapon-sweep/);
assert.match(arena,/guild2d-step-dust/);
assert.match(css,/guild2d-weapon-arc/);
assert.match(css,/guild-lite-mode .guild2d-weapon-sweep/);
assert.match(ui,/type:"swap-equip"/);
assert.match(ui,/guild-backup-reminder/);
assert.match(ui,/forecast\.recentNet/);
assert.match(ui,/bossTacticHint/);
for(const region of WORLD_REGIONS)for(const enemy of region.enemies){
 assert.notEqual(enemyArtKey(enemy+" 1"),"fallback",enemy);
 assert.match(enemyArtSource(enemy+" 1"),/^\/enemies\/[^/]+\.webp$/);
}

// Substituição atômica conserva equipamento, baú e ouro. 
{
 const s=newCampaign(17555);s.event=null;
 const hero=s.heroes[0];hero.level=50;hero.energy=100;
 const compatible=Object.entries(ITEMS).filter(([key,item])=>item.classes?.includes(hero.class)&&
   (!item.race||item.race===heroRace(hero))&&(item.levelReq||0)<=hero.level&&
   !!equippedPosition(key)&&equippedPosition(key)!=="ring");
 const groups=new Map<string,string[]>();
 for(const [key] of compatible){const slot=equippedPosition(key)!;groups.set(slot,[...(groups.get(slot)||[]),key]);}
 const choice=[...groups.entries()].find(([,keys])=>keys.length>=2);
 assert.ok(choice,"Deve existir um par de equipamentos compatíveis.");
 const [slot,keys]=choice;
 s.chest=[{id:"item-1",key:keys[0],equippedTo:hero.id,equippedSlot:slot},{id:"item-2",key:keys[1]}];
 s.itemSequence=2;
 const gold=s.gold;
 const next=applyAction(s,{type:"swap-equip",heroId:hero.id,oldItemId:"item-1",itemId:"item-2",slot});
 assert.equal(next.gold,gold);
 assert.equal(next.chest.find(x=>x.id==="item-1")?.equippedTo,undefined);
 assert.equal(next.chest.find(x=>x.id==="item-2")?.equippedTo,hero.id);
 assert.equal(next.chest.filter(x=>x.equippedTo===hero.id).length,1);
 assert.equal(s.chest.find(x=>x.id==="item-1")?.equippedTo,hero.id,"A ação não pode modificar o estado original.");
 assert.throws(()=>applyAction(s,{type:"swap-equip",heroId:hero.id,oldItemId:"item-1",itemId:"item-2",slot:"helmet-invalid"}));
}

// O orçamento calcula apenas lançamentos efetivos e preserva projeção semanal.
{
 const s=newCampaign(2026);s.day=8;
 s.ledger=[{id:3,day:7,label:"Missão",amount:90},{id:2,day:7,label:"Manutenção",amount:-8},{id:1,day:1,label:"Antigo",amount:600}];
 const d=treasuryForecast(s);
 assert.equal(d.recentIncome,90);
 assert.equal(d.recentExpense,8);
 assert.equal(d.recentNet,82);
 assert.equal(d.projected,s.gold-d.wages-d.maintenance);
}

// Todas as regiões possuem um chefe coerente e com alerta tático.
const hints=new Set<string>();
for(let region=0;region<12;region++){
 const s=newCampaign(26000+region);s.day=45;s.activeRegion=region+1;s.region=region+1;
 const boss=seasonBoss(s);
 assert.ok(boss);
 assert.equal(boss.kind,"boss");
 assert.ok(missions(s).length===6);
 const hint=bossTacticHint(region);
 assert.ok(hint.length>55,"Dica de chefe muito genérica: "+region);
 hints.add(hint);
}
assert.ok(hints.size>=6,"Chefes de regiões diferentes precisam de estratégias perceptíveis.");
console.log("SEIS MELHORIAS OK: bestiário real, efeitos 2D, troca atômica, ouro, 12 chefes e backup Android.");
