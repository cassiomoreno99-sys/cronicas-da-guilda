import type { Battle, BattleLog } from "./game";

export type PlaybackSpeed = 1 | 2 | 4;
export const INTRO_SECONDS = 4;
export const TURN_SECONDS = 12;
export const OUTRO_SECONDS = 4;
export type BattleEvent = { at: number; log: BattleLog };

export function battleTimeline(battle?: Battle | null) {
  if (!battle) return { duration: 0, availableUntil: 0, events: [] as BattleEvent[] };
  const totals = new Map<number, number>(), used = new Map<number, number>();
  battle.log.forEach(log => totals.set(log.round, (totals.get(log.round) || 0) + 1));
  const events = battle.log.map(log => {
    const index = (used.get(log.round) || 0) + 1;
    used.set(log.round, index);
    const at = INTRO_SECONDS + (log.round - 1) * TURN_SECONDS + index / ((totals.get(log.round) || 0) + 1) * TURN_SECONDS;
    return { at, log };
  });
  const availableUntil = INTRO_SECONDS + battle.rounds * TURN_SECONDS;
  return { duration: INTRO_SECONDS + Math.max(1, battle.rounds) * TURN_SECONDS + OUTRO_SECONDS, availableUntil, events };
}

export function battleFrame(battle: Battle | null | undefined, elapsed: number) {
  const timeline = battleTimeline(battle);
  const seconds = Number.isFinite(elapsed) ? Math.max(0, Math.min(timeline.duration, elapsed)) : 0;
  const visible = timeline.events.filter(event => event.at <= seconds);
  const fighters = (battle?.fighters || []).map(fighter => ({ ...fighter }));
  for (const event of visible) {
    const fighter = fighters.find(f => f.id === event.log.targetId);
    if (fighter && typeof event.log.targetHp === "number") fighter.hp = Math.max(0, Math.min(fighter.maxHp, event.log.targetHp));
  }
  const last = visible[visible.length - 1];
  const active = battle?.status === "active";
  let objectiveHp = battle?.objective?.maxHp || 0;
  for (const event of visible) if (typeof event.log.objectiveHp === "number") objectiveHp = event.log.objectiveHp;
  return {
    ...timeline, fighters, visible, shown: visible.length, last, objectiveHp,
    needsRound: !!active && seconds >= timeline.availableUntil,
    clockLimit: active ? timeline.availableUntil : timeline.duration,
    ready: !!battle && !active && seconds >= timeline.duration,
    preparing: seconds < INTRO_SECONDS,
    currentRound: battle ? Math.min(battle.rounds, Math.max(1, Math.floor((seconds - INTRO_SECONDS) / TURN_SECONDS) + 1)) : 0,
  };
}

export function advanceBattleClock(elapsed: number, deltaSeconds: number, speed: PlaybackSpeed, duration: number, paused = false) {
  if (paused) return elapsed;
  return Math.min(duration, Math.max(0, elapsed) + Math.max(0, Math.min(1, deltaSeconds)) * speed);
}

export function formatBattleClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
}
