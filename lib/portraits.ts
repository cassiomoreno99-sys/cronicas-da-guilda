import type { HeroClass } from "./game";
const byId: Record<string, number> = { aric: 0, lyra: 1, elen: 2, kael: 3, sora: 4, doran: 5 };
const byName: Record<string, number> = {
  "Mira da Lua": 6, "Thane Martelo": 7, "Neris de Valen": 8, "Vera da Bruma": 9,
  "Orin Runapálida": 10, "Finn do Norte": 11, "Iris Fogoluz": 12, "Bryn Ventoazul": 13,
};
const byClass: Record<HeroClass, number> = { warrior: 0, mage: 1, healer: 2, rogue: 3, ranger: 4, paladin: 5, monk: 11, necromancer: 12, druid: 9, bard: 13 };
export function portraitPosition(name: string, id?: string, heroClass?: HeroClass) {
  const slot = (id ? byId[id] : undefined) ?? byName[name] ?? (heroClass ? byClass[heroClass] : 14);
  return ((slot % 4) / 3 * 100) + "% " + (Math.floor(slot / 4) / 3 * 100) + "%";
}
