import { activeExpeditions, applyAction, available, missions, newCampaign } from "../lib/game.ts";

function check(condition, message) {
  if (!condition) throw new Error(message);
}

let state = newCampaign(424242);
state.event = null;
state.gold = 99999;
state.fame = 99999;

const seeds = [...state.heroes];
let seq = 0;
while (state.heroes.length < 10) {
  const base = seeds[seq % seeds.length];
  state.heroes.push({
    ...structuredClone(base),
    id: "smoke-hero-" + seq,
    name: base.name + " Teste " + seq,
    energy: 100,
    injuredUntil: 0,
    xp: 0,
  });
  seq++;
}

const ids = state.heroes.map(h => h.id);
const missionIds = missions(state).slice(0, 3).map(m => m.id);
const startedAt = 1_800_000_000_000;

for (let i = 0; i < 3; i++) {
  const team = ids.slice(i * 3, i * 3 + 3);
  state = applyAction(state, {
    type: "mission",
    missionId: missionIds[i],
    team,
    tactic: "balanced",
    startedAt,
  });
  check(activeExpeditions(state).length === i + 1, "Falha ao iniciar expedição " + (i + 1));
}

check(activeExpeditions(state).length === 3, "O jogo não manteve três expedições simultâneas.");
const deployed = new Set(activeExpeditions(state).flatMap(e => e.team));
check(deployed.size === 9, "Heróis foram reutilizados entre expedições.");

for (const heroId of deployed) {
  const hero = state.heroes.find(h => h.id === heroId);
  check(hero && !available(hero, state), "Herói em expedição apareceu como disponível: " + heroId);
}

const reserve = state.heroes.find(h => !deployed.has(h.id));
check(!!reserve, "Não sobrou herói na sede para o teste.");
check(available(reserve, state), "Herói da sede deveria continuar disponível.");

const beforeDay = state.day;
state = applyAction(state, { type: "train-hero", heroId: reserve.id });
check(state.day === beforeDay, "Treino do herói da sede avançou o dia durante expedições ativas.");
check(activeExpeditions(state).length === 3, "Treino da sede interrompeu expedições.");

let blockedSecondTraining = false;
try {
  applyAction(state, { type: "train-hero", heroId: reserve.id });
} catch {
  blockedSecondTraining = true;
}
check(blockedSecondTraining, "O mesmo herói treinou duas vezes no mesmo dia durante expedições.");

state = applyAction(state, { type: "expedition-tick", now: startedAt + 2_000_000 });
check(activeExpeditions(state).length === 0, "As expedições não concluíram após o avanço em segundo plano.");
check(state.day === beforeDay + 1, "O dia deveria avançar uma única vez após o lote de expedições terminar.");

console.log("Smoke multi-expedições: OK");
