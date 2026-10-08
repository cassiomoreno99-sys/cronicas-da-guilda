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
const races:Record<HeroRace,Key> = {human:"aric",elf:"elen",dwarf:"doran",orc:"sora",beastkin:"elen",umbral:"kael"};

export function portraitSource(_name:string,id?:string,heroClass?:HeroClass,race?:HeroRace):string {
  const key = (id && core[id]) || (heroClass && classes[heroClass]) || (race && races[race]) || "aric";
  return art[key];
}
