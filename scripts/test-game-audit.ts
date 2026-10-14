import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {WORLD_REGIONS} from "../lib/v130-content.ts";
import {enemyArtKey,enemyArtSource,ENEMY_ART_KEYS} from "../lib/enemy-art.ts";
import {applyAction,newCampaign,missions,seasonBoss} from "../lib/game.ts";

const files=(name:string)=>readFileSync(name,"utf8");
const packageJson=JSON.parse(files("package.json"));
const gameUI=files("app/game-client.tsx"),arenaUI=files("app/arena-2d.tsx");
assert.ok(!("three" in packageJson.dependencies),"Three.js 3D continua dependência do jogo.");
assert.ok(!("@types/three" in packageJson.devDependencies),"Tipos 3D ainda são instalados.");
assert.ok(!/build-arena-3d|test-arena-3d/.test(packageJson.scripts.build+" "+packageJson.scripts.smoke));
assert.ok(!/Arena3D|show3d|setShow3d|Arena 3D|Arena Tridimensional|WEBGL/.test(gameUI+arenaUI),"Ainda existe botão ou referência da Arena 3D no jogo.");
for(const removed of ["app/arena-3d.tsx","app/arena-3d.css","app/arena-wolf.ts","scripts/build-arena-3d.mjs","scripts/test-arena-3d.mjs","scripts/test-arena-3d-engine.ts"]){
 assert.ok(!existsSync(removed),"Arquivo 3D antigo não foi removido: "+removed);
}
assert.ok(arenaUI.includes('ability.target==="ally"?allyTarget?.id'),"Habilidades de cura ainda são forçadas ao próprio conjurador.");
assert.ok(arenaUI.includes("guild2d-ally-selector"),"Seleção de alvo aliado não aparece na tela.");
assert.ok(arenaUI.includes("Ator e alvo automáticos"),"Botão básico engana sobre seleção de alvo.");

// TODAS as criaturas regionais e chefes devem selecionar uma arte do acervo.
// Uma arte ilustrativa aproximada é aceita quando não existe retrato específico.
assert.equal(WORLD_REGIONS.length,12);
for(const key of ENEMY_ART_KEYS){assert.ok(existsSync("public/enemies/"+key+".webp"),"Arte ausente: "+key);}
for(let i=0;i<12;i++){
 const s=newCampaign(3000+i);s.day=45;s.activeRegion=i+1;s.region=i+1;s.season=1;s.event=null;
 const region=WORLD_REGIONS[i];
 for(const enemy of region.enemies){
  const key=enemyArtKey(enemy+" 1");
  assert.notEqual(key,"fallback","Monstro da região "+region.name+" sem arte: "+enemy);
  assert.ok(existsSync("public"+enemyArtSource(enemy+" 1")));
 }
 for(const mission of [...missions(s),seasonBoss(s)!]){
  const key=enemyArtKey(mission.kind==="boss"?mission.title:mission.enemy+" 1");
  assert.notEqual(key,"fallback","Missão da região "+region.name+" mostra genérico: "+mission.title);
 }
}

// O motor realmente respeita cura direcionada para um herói DIFERENTE do conjurador.
let state=newCampaign(7618);state.event=null;
for(const h of state.heroes)h.energy=100;
const quest=missions(state)[0];
state=applyAction(state,{type:"mission",missionId:quest.id,team:state.team,tactic:"balanced",expeditionSlot:1,startedAt:1700000000000});
const expId=state.expeditions[0].id;
const heroes=state.expeditions[0].battle.combat!.fighters.filter(f=>f.side==="hero");
const healer=heroes.find(h=>h.class==="healer")!;
const target=heroes.find(h=>h.id!==healer.id)!;
assert.ok(target.id!==healer.id,"É necessário testar o alvo aliado diferente do próprio healer");
target.hp=Math.max(1,target.maxHp-70);
for(const enemy of state.expeditions[0].battle.combat!.fighters.filter(f=>f.side==="enemy"))enemy.attack=0;
const hpBefore=target.hp,healerHp=healer.hp;
state=applyAction(state,{type:"battle-ability",expeditionId:expId,heroId:healer.id,abilityId:"healer-restore",targetId:target.id});
assert.equal(state.expeditions[0].battle.combat!.pendingAbilities?.find(a=>a.heroId===healer.id)?.targetId,target.id);
let healed=false;
for(let i=0;i<18;i++){
 state=applyAction(state,{type:"battle-round",expeditionId:expId});
 const battle=state.expeditions[0].battle;
 if(battle.log.some(l=>l.actorId===healer.id && l.targetId===target.id && /cura|restaur/i.test(l.text))) {
  const targetAfter=(battle.combat?.fighters||battle.fighters)!.find(f=>f.id===target.id)!;
  const healerAfter=(battle.combat?.fighters||battle.fighters)!.find(f=>f.id===healer.id)!;
  assert.ok(targetAfter.hp>hpBefore,"Cura não beneficiou o herói selecionado.");
  assert.ok(healerAfter.hp<=healerHp,"A cura direcionada não deve beneficiar o conjurador (ele ainda pode levar dano do inimigo).");
  healed=true;break;
 }
}
assert.ok(healed,"Healer não curou o aliado selecionado no combate real.");
console.log("AUDITORIA 2D OK: sem 3D, monstros regionais ilustrados e habilidade cura aliado correto.");
