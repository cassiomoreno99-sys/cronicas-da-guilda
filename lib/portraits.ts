import type { HeroClass, HeroRace } from "./game";

const coreSlots: Record<string, number> = {
  aric: 0,
  lyra: 1,
  elen: 8,
  kael: 4,
  sora: 11,
  doran: 9,
};

const raceSlots: Record<HeroRace, number> = {
  human: 5,
  elf: 2,
  dwarf: 8,
  orc: 9,
  beastkin: 4,
  umbral: 11,
};

const classRaceFallback: Record<HeroClass, HeroRace> = {
  warrior:"human", mage:"elf", healer:"dwarf", rogue:"umbral", ranger:"elf",
  paladin:"human", monk:"dwarf", necromancer:"umbral", druid:"elf", bard:"human",
};

export function portraitPosition(name:string,id?:string,heroClass?:HeroClass,race?:HeroRace) {
  const resolvedRace = race || (heroClass ? classRaceFallback[heroClass] : "human");
  const slot = (id ? coreSlots[id] : undefined) ?? raceSlots[resolvedRace];
  const col = slot % 4;
  const row = Math.floor(slot / 4);
  return (col / 3 * 100) + "% " + (row / 2 * 100) + "%";
}
