import { applyAction, missions, newCampaign, type Campaign } from "../lib/game.ts";

function ok(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function prepare(seed: number) {
  let state = newCampaign(seed);
  state.event = null;
  state.gold = 999999;
  for (const hero of state.heroes) { hero.energy = 100; hero.injuredUntil = 0; }
  const team = state.heroes.slice(0, 4).map(h => h.id);
  const mission = missions(state)[0];
  state = applyAction(state, {
    type: "mission",
    missionId: mission.id,
    team,
    tactic: "balanced",
    expeditionSlot: 1,
    startedAt: 1_700_000_000_000,
  });
  const expedition = state.expeditions.find(e => e.slot === 1)!;
  ok(expedition?.battle.combat, "Combate não foi iniciado.");
  ok(expedition.battle.combat.autoAbilities === true, "Habilidades dos heróis devem ser automáticas.");
  ok(expedition.battle.combat.pendingAbilities.length === 0, "Combate narrativo não deve exigir habilidade manual preparada.");
  return { state, expeditionId: expedition.id };
}

console.log("Combate narrativo: verificando remoção de todos os consumíveis...");
{
  const {state,expeditionId}=prepare(31001);
  ok(state.chest.length===0,"O catálogo excluído deixou consumíveis no save.");
  const hero=state.expeditions.find(e=>e.id===expeditionId)!.battle.combat!.fighters.find(f=>f.side==="hero")!;
  let rejected=false;
  try { applyAction(state,{type:"battle-consumable",key:"healing_potion",targetId:hero.id,expeditionId}); } catch { rejected=true; }
  ok(rejected,"Um item removido ainda foi aceito em combate.");
}

// Habilidades seguem automáticas e narradas, sem comando manual.
{
  let { state, expeditionId } = prepare(31004);
  state = applyAction(state, { type: "battle-round", expeditionId });
  const battle = state.expeditions.find(e => e.id === expeditionId)!.battle;
  ok(battle.log.some(l => l.kind === "ability" && l.text.includes(" usa ")), "Nenhuma habilidade automática foi narrada.");
}

console.log("Combate narrativo: catálogo vazio e habilidades automáticas OK.");
