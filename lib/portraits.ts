import type { HeroClass, HeroRace } from "./game";

const coreSlots: Record<string, number> = { aric: 0, lyra: 1, elen: 2, kael: 3, sora: 4, doran: 5 };
const raceSlots: Record<HeroRace, number> = { human: 6, elf: 7, dwarf: 8, orc: 9, beastkin: 10, umbral: 11 };
const classRaceFallback: Record<HeroClass, HeroRace> = {
  warrior: "human", mage: "umbral", healer: "elf", rogue: "umbral", ranger: "elf",
  paladin: "human", monk: "human", necromancer: "umbral", druid: "elf", bard: "human",
};

export function portraitPosition(name: string, id?: string, heroClass?: HeroClass, race?: HeroRace) {
  const resolvedRace = race || (heroClass ? classRaceFallback[heroClass] : "human");
  const slot = (id ? coreSlots[id] : undefined) ?? raceSlots[resolvedRace];
  const col = slot % 4, row = Math.floor(slot / 4);
  return (col / 3 * 100) + "% " + (row / 2 * 100) + "%";
}
