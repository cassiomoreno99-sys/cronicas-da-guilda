import {
  ITEMS, CRAFTING_RECIPES, WORLD_MAP, applyAction, available, missions, newCampaign,
  seasonBoss, shop, type Campaign, type Mission
} from "../lib/game.ts";

const campaignSeeds = [81201, 81202, 81203, 81204];
const seasonsPerCampaign = 10;
const forbidden = /poção|pocao|\bmapa\b|\bitens?\b|\bequipamentos?\b|\bsaque\b|\bconsum[ií]ve(?:l|is)\b/i;
let checkedMissionOffers = 0;
let crossRegionMissionOffers = 0;
let crossRegionBossOffers = 0;
let checkedBossOffers = 0;
let checkedCouncilEvents = 0;
let battles = 0;
let finishedSeasons = 0;
let victories = 0;
let defeats = 0;
let daysAdvanced = 0;
const missionKinds = new Set<string>();

function check(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
function emptyInventory(s: Campaign, stage: string): void {
  check(s.chest.length === 0, "Inventário foi preenchido: " + stage);
  check(shop(s).length === 0, "Mercador ofereceu item: " + stage);
  check((s.lastBattle?.loot || []).length === 0, "Batalha entregou itens: " + stage);
  check(s.journeys.every(j => j.loot.length === 0), "Viagem trouxe itens: " + stage);
  check(s.raidHistory.every(j => j.loot.length === 0), "Raid trouxe itens: " + stage);
  check(s.expeditions.every(e => e.battle.loot.length === 0), "Expedição trouxe itens: " + stage);
}
function checkMission(m: Mission, stage: string): void {
  const claim = m.title + " " + m.description + " " + m.flavor;
  // "Saqueador" é nome de inimigo, não uma recompensa de saque.
  check(!forbidden.test(claim), "Missão anuncia item/poção: " + stage + " | " + claim);
  check(m.requiredItem === undefined, "Missão exige item antigo: " + stage);
  check(Number.isFinite(m.reward) && m.reward >= 0, "Recompensa monetária inválida: " + stage);
  missionKinds.add(m.kind);
}

check(Object.keys(ITEMS).length === 0, "Catálogo antigo voltou.");
check(CRAFTING_RECIPES.length === 0, "Receitas antigas voltaram.");

for (const seed of campaignSeeds) {
  let s = newCampaign(seed);
  let steps = 0;
  let previousSeason = s.season;
  while (s.season <= seasonsPerCampaign) {
    steps++;
    check(steps <= seasonsPerCampaign * 32, "Campanha não avançou pelas temporadas: " + seed);
    const loc = "campanha " + seed + ", dia " + s.day + ", temporada " + s.season;
    emptyInventory(s, "início " + loc);
    const board = missions(s);
    check(board.length === 5, "Quantidade inesperada de missões: " + loc);
    for (const mission of board) {
      checkMission(mission, loc);
      checkedMissionOffers++;
    }
    const boss = seasonBoss(s);
    if (boss) { checkMission(boss, loc + " chefe"); checkedBossOffers++; }

    // Confere também as tabelas de missões de TODAS as regiões, inclusive as
    // ainda não desbloqueadas nestes saves, sem alterar a campanha simulada.
    for (let regionIndex = 0; regionIndex < WORLD_MAP.length; regionIndex++) {
      const regionView = { ...s, activeRegion: regionIndex + 1, region: WORLD_MAP.length, bossSeasons: [] };
      for (const mission of missions(regionView)) {
        checkMission(mission, loc + " / regiao " + WORLD_MAP[regionIndex].name);
        crossRegionMissionOffers++;
      }
      const regionalBoss = seasonBoss(regionView);
      if (regionalBoss) {
        checkMission(regionalBoss, loc + " / chefe " + WORLD_MAP[regionIndex].name);
        crossRegionBossOffers++;
      }
    }

    // Resolve cada evento realmente produzido pelo Conselho, sem ignorá-lo.
    if (s.event) {
      checkedCouncilEvents++;
      const ev = s.event;
      const evText = ev.title + " " + ev.text + " " + ev.choices.map(c => c.label + " " + c.effect).join(" ");
      check(!forbidden.test(evText), "Conselho oferece item/poção: " + loc + " | " + evText);
      const choice = ev.choices.find(c => c.id === "charge" || c.id === "refuse" || c.id === "prestige")
        || ev.choices.find(c => !c.cost) || ev.choices[0];
      s = applyAction(s, { type: "event", eventId: ev.id, choiceId: choice.id });
      emptyInventory(s, "conselho " + loc);
    }

    // Facilita a duração do teste, mas usa o motor real de missão, combate e prêmios.
    s.gold = Math.max(s.gold, 50000);
    s.fame = Math.max(s.fame, 5000);
    for (const h of s.heroes) { h.energy = 100; h.injuredUntil = 0; }
    const team = s.heroes.filter(h => available(h, s)).slice(0, 4).map(h => h.id);
    if (team.length >= 3 && (s.day % 6 === 0 || (boss && s.day % 28 === 21))) {
      const pick = boss && s.day % 28 === 21 ? boss : board[(Math.floor(s.day / 6) + seed) % board.length];
      s = applyAction(s, {
        type: "mission", missionId: pick.id, team, tactic: "balanced",
        expeditionSlot: 1, startedAt: 1700000000000 + s.day * 6000
      });
      const expeditionId = s.expeditions[s.expeditions.length - 1].id;
      emptyInventory(s, "início da batalha " + loc);
      s = applyAction(s, { type: "battle-auto", expeditionId });
      battles++;
      const ended = s.expeditions.find(e => e.id === expeditionId)?.battle;
      check(ended && ended.status !== "active", "Batalha não terminou: " + loc);
      check(ended.loot.length === 0, "Batalha concedeu um item/poção: " + loc);
      if (ended.won) victories++; else defeats++;
    } else {
      s = applyAction(s, { type: "rest" });
    }
    emptyInventory(s, "após avanço " + loc);
    if (s.season > previousSeason) {
      finishedSeasons += s.season - previousSeason;
      previousSeason = s.season;
    }
    daysAdvanced++;
  }
  check(s.season === seasonsPerCampaign + 1, "Campanha terminou em temporada inesperada: " + seed);
}

check(finishedSeasons === campaignSeeds.length * seasonsPerCampaign, "Nem todas as temporadas foram concluídas.");
check(battles > 100 && checkedCouncilEvents > 100 && checkedBossOffers > 100, "Cobertura insuficiente.");
check(["escort", "defense", "dungeon", "hunt", "boss"].every(k => missionKinds.has(k)), "Tipos de missão não cobertos.");

console.log("AUDITORIA_DE_TEMPORADAS_RESULTADO " + JSON.stringify({
  campanhas: campaignSeeds.length, temporadasConcluidas: finishedSeasons,
  diasAvancados: daysAdvanced, ofertasDeMissoesConferidas: checkedMissionOffers,
  regioesDoMapaConferidas: WORLD_MAP.length, ofertasRegionaisConferidas: crossRegionMissionOffers,
  chefesRegionaisConferidos: crossRegionBossOffers,
  ofertasDeChefesConferidas: checkedBossOffers, eventosConselho: checkedCouncilEvents,
  batalhasExecutadas: battles, vitorias: victories, derrotas: defeats,
  tiposDeMissao: [...missionKinds].sort(), itensOuPocoesEncontrados: 0
}));
