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

console.log("Combate narrativo: iniciando testes de consumíveis...");

// Poção: clique manual escolhe alvo, o item é consumido e a cura acontece no turno narrado.
{
  let { state, expeditionId } = prepare(31001);
  let expedition = state.expeditions.find(e => e.id === expeditionId)!;
  const hero = expedition.battle.combat!.fighters.find(f => f.side === "hero")!;
  hero.hp = Math.max(1, hero.maxHp - 80);
  const beforeItems = state.chest.filter(i => i.key === "healing_potion").length;
  const beforeHp = hero.hp;
  state = applyAction(state, { type: "battle-consumable", key: "healing_potion", targetId: hero.id, expeditionId });
  ok(state.chest.filter(i => i.key === "healing_potion").length === beforeItems - 1, "Poção de Cura não foi consumida.");
  ok(state.expeditions.find(e => e.id === expeditionId)!.battle.combat!.pendingConsumable?.key === "healing_potion", "Poção não foi preparada.");
  state = applyAction(state, { type: "battle-round", expeditionId });
  expedition = state.expeditions.find(e => e.id === expeditionId)!;
  const after = expedition.battle.combat?.fighters.find(f => f.id === hero.id);
  ok(!after || after.hp > beforeHp, "Poção de Cura não recuperou PV.");
  ok(expedition.battle.log.some(l => l.text.includes("Intervenção da guilda: Poção de Cura")), "Narração não registrou uso da poção.");
}

// Antídoto: remove status nocivos antes do dano periódico.
{
  let { state, expeditionId } = prepare(31002);
  let expedition = state.expeditions.find(e => e.id === expeditionId)!;
  const hero = expedition.battle.combat!.fighters.find(f => f.side === "hero")!;
  hero.statuses.push({ kind: "poison", rounds: 3, amount: 12, sourceId: "teste" });
  const beforeItems = state.chest.filter(i => i.key === "antidote").length;
  state = applyAction(state, { type: "battle-consumable", key: "antidote", targetId: hero.id, expeditionId });
  ok(state.chest.filter(i => i.key === "antidote").length === beforeItems - 1, "Antídoto não foi consumido.");
  state = applyAction(state, { type: "battle-round", expeditionId });
  expedition = state.expeditions.find(e => e.id === expeditionId)!;
  const after = expedition.battle.combat?.fighters.find(f => f.id === hero.id);
  ok(!after || !after.statuses.some(st => st.kind === "poison"), "Antídoto não removeu veneno.");
  ok(expedition.battle.log.some(l => l.text.includes("Intervenção da guilda: Antídoto")), "Narração não registrou antídoto.");
}

// Bomba: inimigo perde a próxima ação.
{
  let { state, expeditionId } = prepare(31003);
  let expedition = state.expeditions.find(e => e.id === expeditionId)!;
  const enemy = expedition.battle.combat!.fighters.find(f => f.side === "enemy")!;
  const beforeItems = state.chest.filter(i => i.key === "stun_bomb").length;
  state = applyAction(state, { type: "battle-consumable", key: "stun_bomb", targetId: enemy.id, expeditionId });
  ok(state.chest.filter(i => i.key === "stun_bomb").length === beforeItems - 1, "Bomba Atordoante não foi consumida.");
  state = applyAction(state, { type: "battle-round", expeditionId });
  expedition = state.expeditions.find(e => e.id === expeditionId)!;
  ok(expedition.battle.log.some(l => l.text.includes("Bomba Atordoante") && l.text.includes(enemy.name)), "Narração não registrou a bomba.");
  ok(expedition.battle.log.some(l => l.text.includes(enemy.name + " está atordoado e perde a ação")), "Inimigo atingido não perdeu a ação.");
}

// Habilidades seguem automáticas e narradas, sem comando manual.
{
  let { state, expeditionId } = prepare(31004);
  state = applyAction(state, { type: "battle-round", expeditionId });
  const battle = state.expeditions.find(e => e.id === expeditionId)!.battle;
  ok(battle.log.some(l => l.kind === "ability" && l.text.includes(" usa ")), "Nenhuma habilidade automática foi narrada.");
}

console.log("Combate narrativo: consumíveis e habilidades automáticas OK.");
