import type { HeroClass, HeroRace } from "./game";
import aric from "./portrait-art/aric";
import lyra from "./portrait-art/lyra";
import doran from "./portrait-art/doran";
import kael from "./portrait-art/kael";
import elen from "./portrait-art/elen";
import sora from "./portrait-art/sora";
import pierro from "./portrait-art/pierro";

const art = {aric,lyra,doran,kael,elen,sora,pierro};
type Key = keyof typeof art;
const core:Record<string,Key> = {aric:"aric",lyra:"lyra",doran:"sora",kael:"kael",elen:"doran",sora:"elen"};
const classes:Record<HeroClass,Key> = {warrior:"aric",mage:"lyra",healer:"doran",rogue:"kael",ranger:"elen",paladin:"aric",bard:"pierro",monk:"aric",necromancer:"lyra",druid:"doran"};
const races:Record<HeroRace,Key> = {
  human:"aric",elf:"elen",dwarf:"doran",orc:"sora",beastkin:"sora",umbral:"kael"
};
/** A raça tem prioridade sobre a classe para personagens criados ou recrutados.
 * Os retratos de heróis canônicos preservam sua arte própria enquanto a raça
 * for a mesma do personagem. Não modifica raça/classe salva nem atributos. */
const coreRaces:Record<string,HeroRace>={
  aric:"human",lyra:"elf",elen:"dwarf",kael:"umbral",sora:"elf",doran:"beastkin"
};
export function portraitSource(_name:string,id?:string,heroClass?:HeroClass,race?:HeroRace):string {
  const known = id && core[id];
  if(known && (!race || coreRaces[id!]===race))return art[known];
  const key = (race && races[race]) || (heroClass && classes[heroClass]) || "aric";
  return art[key];
}
