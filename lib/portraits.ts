import type { HeroClass, HeroRace } from "./game";

const coreSlots: Record<string, number> = { aric:0, lyra:1, elen:2, kael:3, sora:4, doran:5 };
const raceSlots: Record<HeroRace, number> = { human:0, elf:4, dwarf:2, orc:5, beastkin:5, umbral:3 };
const classRaceFallback: Record<HeroClass, HeroRace> = {
  warrior:"human", mage:"elf", healer:"dwarf", rogue:"umbral", ranger:"elf",
  paladin:"human", monk:"dwarf", necromancer:"umbral", druid:"elf", bard:"human"
};

export function portraitPosition(name:string,id?:string,heroClass?:HeroClass,race?:HeroRace) {
  const resolvedRace = race || (heroClass ? classRaceFallback[heroClass] : "human");
  const slot = (id ? coreSlots[id] : undefined) ?? raceSlots[resolvedRace];
  const col = slot % 3, row = Math.floor(slot / 3);
  return (col / 2 * 100) + "% " + (row * 100) + "%";
}
