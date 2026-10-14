/** As artes oficiais são adicionadas em public/heroes/ e reconhecidas no build.
 * Enquanto ausentes, usamos apenas identidade neutra da combinação exata,
 * NUNCA outro retrato humano/anão/etc por engano. */
import type {HeroClass,HeroRace} from "./game.ts";
import {HERO_ART_ASSETS} from "./hero-art-manifest.ts";
import {HERO_SEX_LABEL,portraitAssetKey,type HeroSex} from "./hero-identity.ts";
const titles:Record<string,string>={warrior:"GUERREIRO",paladin:"CAVALEIRO",ranger:"ARQUEIRO",rogue:"ASSASSINO",mage:"MAGO",healer:"SACERDOTE",bard:"PIERRÔ"};
const raceTitles:Record<HeroRace,string>={human:"HUMANO",elf:"ELFO",dwarf:"ANÃO",orc:"ORC",beastkin:"BESTIAL / DRACÔNICO",umbral:"UMBRAL"};
const palette:Record<HeroRace,[string,string,string]>={
 human:["#263f65","#5b86b5","#d6b37b"],elf:["#163d3f","#3e8e73","#c4d5a2"],
 dwarf:["#55372d","#aa6940","#d5aa67"],orc:["#263e26","#6d9140","#b5a15c"],
 beastkin:["#58252a","#b9563d","#e1ac71"],umbral:["#2b2446","#6552a3","#bda4e9"]
};
const svgCache=new Map<string,string>();
function svgPlaceholder(race:HeroRace,heroClass:HeroClass,sex:HeroSex,kind:"portrait"|"battle"):string{
 const key=[race,heroClass,sex,kind].join("/");
 const cached=svgCache.get(key);if(cached)return cached;
 const [dark,light,gold]=palette[race];
 const horns=race==="beastkin"?
   '<path d="M287 415 L222 220 Q285 266 330 327 M675 415 L740 220 Q676 266 628 327" fill="#d4ad78" stroke="#413142" stroke-width="9"/>':"";
 const ears=race==="elf"||race==="umbral"?
   '<path d="M320 530L165 442L300 570M640 530L795 442L660 570" fill="#947666" stroke="#38252c" stroke-width="8"/>':"";
 const jaw=race==="dwarf"?'<path d="M345 625 Q475 785 615 625 L579 820L481 873L375 820Z" fill="#543326" stroke="#be8f4e" stroke-width="8"/>':"";
 const fangs=race==="orc"?'<path d="M394 642L408 590L430 650M535 645L548 591L567 636" fill="#ece4d7"/>':"";
 const weapon=heroClass==="ranger"?'<path d="M790 900Q645 735 795 515" fill="none" stroke="#d9b77d" stroke-width="19"/>':
 heroClass==="rogue"?'<path d="M782 895L680 630L714 548L820 895" stroke="#d8c5aa" stroke-width="11" fill="#675369"/>':
 heroClass==="mage"||heroClass==="healer"||heroClass==="bard"?'<path d="M784 1000V500M747 493L783 438L818 495L783 529Z" stroke="#ddc28f" stroke-width="18" fill="#8670b4"/>':
 '<path d="M780 920V480M720 530L839 530L780 430L720 530Z" stroke="#efdaa3" stroke-width="24" fill="#d4bd84"/>';
 const label=kind==="battle"?"SPRITE PENDENTE":"RETRATO PENDENTE";
 const textSex=HERO_SEX_LABEL[sex].toLocaleUpperCase("pt-BR");
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="960" height="1440" viewBox="0 0 960 1440">'+
 '<defs><linearGradient id="bg" x2=".8" y2="1"><stop stop-color="'+dark+'"/><stop offset="1" stop-color="#0c1422"/></linearGradient><linearGradient id="plate" y2="1"><stop stop-color="'+light+'"/><stop offset="1" stop-color="'+dark+'"/></linearGradient></defs>'+
 '<rect width="960" height="1440" fill="url(#bg)"/>'+
 '<path d="M0 1140L250 790L470 835L700 790L960 1150V1440H0Z" fill="url(#plate)" stroke="'+gold+'" stroke-width="15"/>'+
 '<path d="M290 385Q470 120 670 385L660 647Q470 795 307 647Z" fill="#ad8d77" stroke="'+gold+'" stroke-width="16"/>'+
 horns+ears+jaw+fangs+
 '<path d="M298 520Q330 485 390 520M556 520Q603 485 656 520" fill="none" stroke="#1d1929" stroke-width="20"/>'+
 '<path d="M390 635Q481 677 558 635" stroke="#3a2225" stroke-width="15" fill="none"/>'+
 weapon+
 '<rect x="65" y="40" width="830" height="92" rx="18" fill="#050a14b8" stroke="'+gold+'" stroke-width="4"/>'+
 '<text x="480" y="98" text-anchor="middle" fill="#f6e3b7" font-family="Georgia,serif" font-size="36" font-weight="bold">'+label+'</text>'+
 '<rect x="34" y="1225" width="892" height="178" rx="18" fill="#080e1dcf" stroke="'+gold+'" stroke-width="3"/>'+
 '<text x="480" y="1276" text-anchor="middle" fill="#f7e6bd" font-family="Georgia,serif" font-size="30">'+raceTitles[race]+'</text>'+
 '<text x="480" y="1330" text-anchor="middle" fill="#ffffff" font-family="Georgia,serif" font-size="43">'+titles[heroClass]+'</text>'+
 '<text x="480" y="1373" text-anchor="middle" fill="#dbc18e" font-family="Georgia,serif" font-size="27">'+textSex+'</text>'+
 '</svg>';
 const result="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);svgCache.set(key,result);return result;
}
export function officialHeroArt(kind:"portrait"|"battle",race:HeroRace,heroClass:HeroClass,sex:HeroSex):string|undefined{
 return HERO_ART_ASSETS[kind][portraitAssetKey(race,heroClass,sex)];
}
export function heroArtPlaceholder(race:HeroRace,heroClass:HeroClass,sex:HeroSex,kind:"portrait"|"battle"="portrait"){return svgPlaceholder(race,heroClass,sex,kind);}
export function heroArtProgress(){
 return { portraits:Object.keys(HERO_ART_ASSETS.portrait).length,battle:Object.keys(HERO_ART_ASSETS.battle).length,total:84 };
}
