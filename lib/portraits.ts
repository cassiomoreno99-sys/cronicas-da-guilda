import type {HeroClass,HeroRace} from "./game";
import {heroSex,type HeroSex} from "./hero-identity.ts";
import {officialHeroArt,heroArtPlaceholder} from "./hero-art.ts";
import aric from "./portrait-art/aric";
import lyra from "./portrait-art/lyra";
import doran from "./portrait-art/doran";
import kael from "./portrait-art/kael";
import elen from "./portrait-art/elen";
import sora from "./portrait-art/sora";
import pierro from "./portrait-art/pierro";

/** As obras canônicas antigas continuam disponíveis durante a transição.
 * A presença de arte individual na nova pasta SEMPRE tem prioridade. */
const art={aric,lyra,doran,kael,elen,sora,pierro};
type Key=keyof typeof art;
const core:Record<string,Key>={aric:"aric",lyra:"lyra",doran:"sora",kael:"kael",elen:"doran",sora:"elen"};
const coreRaces:Record<string,HeroRace>={aric:"human",lyra:"elf",elen:"dwarf",kael:"umbral",sora:"elf",doran:"beastkin"};
const coreClasses:Record<string,HeroClass>={aric:"warrior",lyra:"mage",elen:"healer",kael:"rogue",sora:"ranger",doran:"warrior"};
const coreSprites:Record<string,string>={aric:"aric",lyra:"lyria",elen:"thorgar",kael:"kaelith",sora:"eldrin",doran:"rhokar"};
const knownSex:Record<string,HeroSex>={aric:"male",lyra:"female",elen:"male",kael:"female",sora:"male",doran:"male"};

export function portraitSource(name:string,id?:string,heroClass?:HeroClass,race?:HeroRace,sex?:HeroSex):string {
 const resolvedRace=race||coreRaces[id||""]||"human";
 const resolvedClass=heroClass||coreClasses[id||""]||"warrior";
 const resolvedSex=heroSex({id:id||"",name,sex});
 const exact=officialHeroArt("portrait",resolvedRace,resolvedClass,resolvedSex);
 if(exact)return exact;
 if(id&&core[id]&&coreRaces[id]===resolvedRace&&coreClasses[id]===resolvedClass&&knownSex[id]===resolvedSex)return art[core[id]];
 return heroArtPlaceholder(resolvedRace,resolvedClass,resolvedSex);
}
export function battleSource(hero:{id:string;name:string;class:HeroClass;race?:HeroRace;sex?:HeroSex},race:HeroRace):string {
 const sex=heroSex(hero);
 const exact=officialHeroArt("battle",race,hero.class,sex);
 if(exact)return exact;
 if(coreSprites[hero.id]&&coreRaces[hero.id]===race&&coreClasses[hero.id]===hero.class&&knownSex[hero.id]===sex)
   return "/battle/sprite-"+coreSprites[hero.id]+".webp";
 // Preserva o sprite 2D aprovado; para os demais heróis usa o retrato correto,
 // evitando o aviso "SPRITE PENDENTE" durante a batalha.
 const portrait=officialHeroArt("portrait",race,hero.class,sex);
 if(portrait)return portrait;
 return heroArtPlaceholder(race,hero.class,sex,"battle");
}
