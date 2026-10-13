import assert from "node:assert/strict";
import fs from "node:fs";
import {applyAction, missions, newCampaign} from "../lib/game.ts";

const initial=newCampaign(20261013);
initial.event=null;
const mission=missions(initial)[0];
const startedAt=1_700_000_000_000;
let state=applyAction(initial,{type:"mission",missionId:mission.id,team:initial.team,tactic:"balanced",startedAt,expeditionSlot:1});
const id=state.expeditions[0].id;
const snap=()=>state.expeditions.find(e=>e.id===id)!;
const initialNext=snap().nextRoundAt;
assert.equal(initialNext,startedAt+1350,"Primeira ação ao vivo deveria ocorrer em 1,35 s.");
assert.equal(snap().battle.rounds,0);
const living=snap().battle.combat!.fighters.filter(f=>f.hp>0).length;
assert.ok(living>=5);

state=applyAction(state,{type:"expedition-tick",now:initialNext});
const first=snap();
assert.equal(first.battle.rounds,1,"A primeira ação inicia exatamente uma rodada.");
assert.equal(first.battle.combat?.liveCursor,1,"Motor resolveu mais de um combatente de uma vez.");
assert.equal(first.battle.combat?.liveOrder?.length,living);
assert.equal(first.nextRoundAt,initialNext+1350,"O intervalo entre ações foi alterado.");
assert.ok(first.battle.log.length>=1,"O primeiro golpe não foi registrado.");

// Retornar do segundo plano não pode simular dezenas de rodadas instantâneas.
const frozen={round:first.battle.rounds,cursor:first.battle.combat!.liveCursor,logs:first.battle.log.length};
state=applyAction(state,{type:"expedition-tick",now:initialNext+300});
assert.equal(snap().battle.rounds,frozen.round);
assert.equal(snap().battle.combat?.liveCursor,frozen.cursor);
assert.equal(snap().battle.log.length,frozen.logs);

// Ao reabrir um save no meio da rodada, não reembaralha a iniciativa nem reinicia a rodada.
const saved=JSON.parse(JSON.stringify(state));
const plannedOrder=[...snap().battle.combat!.liveOrder!];
state=applyAction(saved,{type:"expedition-tick",now:initialNext+2_000_000});
const second=snap();
assert.equal(second.battle.rounds,1,"O próximo personagem deveria agir NA MESMA rodada.");
assert.equal(second.battle.combat?.liveCursor,2);
assert.deepEqual(second.battle.combat?.liveOrder,plannedOrder);
assert.equal(second.nextRoundAt,initialNext+2_000_000+1350);

// Um único turno é calculado por atualização, sem perda de status/cooldown/saves.
let count=0;
while(snap().battle.status==="active" && count++ < 240){
 const before=snap(),cursor=before.battle.combat?.liveCursor;
 state=applyAction(state,{type:"expedition-tick",now:before.nextRoundAt});
 const after=snap();
 if(after.battle.status==="active" && before.battle.rounds===after.battle.rounds && after.battle.combat?.liveOrder?.length && cursor && cursor<after.battle.combat.liveCursor!){
   assert.ok(after.battle.combat.liveCursor!>=cursor+1);
 }
}
assert.ok(count<240,"Combate não finalizou.");
assert.ok(["won","lost"].includes(snap().battle.status||""));
assert.equal(snap().battle.combat,undefined,"O estado final não foi preservado.");
assert.ok(snap().battle.fighters?.every(f=>f.hp>=0 && f.hp<=f.maxHp));

// O botão de pular continua mostrando o resultado imediatamente para quem quiser.
const again=applyAction(initial,{type:"mission",missionId:mission.id,team:initial.team,tactic:"balanced",startedAt,expeditionSlot:1});
const instant=applyAction(again,{type:"battle-auto",expeditionId:again.expeditions[0].id});
assert.notEqual(instant.expeditions[0].battle.status,"active");
const ui=fs.readFileSync("app/game-client.tsx","utf8");
assert.ok(ui.includes("AÇÃO AO VIVO") && ui.includes("data-targeted={latest?.targetId===f.id}"));
assert.ok(ui.includes("Pular para o resultado"));
console.log("COMBATE AO VIVO OK: 1 ator/tick, cronômetro, retomar no save, iniciativa, PV e pular resultado.");
