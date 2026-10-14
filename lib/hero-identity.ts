/** Identidade visual e geração de personagens.
 * As 6 raças x 7 classes ativas x 2 sexos = 84 retratos oficiais.
 * O slot 'beastkin' representa a linhagem bestial/dracônica já existente.
 * IDs canônicos e nomes do jogador nunca são reescritos por esta camada.
 */
import type {HeroClass,HeroRace} from "./game.ts";
export type HeroSex="male"|"female";
export const HERO_SEX_LABEL:Record<HeroSex,string>={male:"Masculino",female:"Feminino"};
export const HERO_VISUAL_RACES:readonly HeroRace[]=["human","elf","dwarf","orc","beastkin","umbral"];
export const HERO_VISUAL_CLASSES:readonly HeroClass[]=["warrior","paladin","ranger","rogue","mage","healer","bard"];
export const HERO_SEXES:readonly HeroSex[]=["male","female"];
export const HERO_ART_COMBINATIONS=HERO_VISUAL_RACES.length*HERO_VISUAL_CLASSES.length*HERO_SEXES.length;
const given:Record<HeroRace,Record<HeroSex,readonly string[]>>={
 human:{male:["Aric","Darian","Cedric","Kael","Rowan","Aldren","Cassian","Garrik","Marek","Joren","Rovan","Orlan"],female:["Lyria","Elira","Serah","Maelis","Ysolda","Talia","Ilara","Nalia","Liora","Mara","Vessa","Eira"]},
 elf:{male:["Eldrin","Faelar","Theron","Aelar","Elyon","Lorwyn","Vaelor","Daelin","Sylas","Galren","Aelric","Caelen"],female:["Sylwen","Aelira","Naivara","Lyraeth","Lyria","Elowen","Saela","Ilyra","Mirael","Neris","Eira","Arwenna"]},
 dwarf:{male:["Thorgar","Brom","Durgan","Kazrik","Rurik","Orik","Dain","Torin","Brann","Thoren","Ulric","Hadrik"],female:["Brynna","Hilda","Dagna","Morna","Braska","Belmira","Kora","Tessa","Kaora","Veyra","Runa","Druska"]},
 orc:{male:["Gorath","Urgan","Rhok","Drog","Grom","Barek","Thrak","Krug","Vorg","Bral","Sarn","Grash"],female:["Grasha","Urka","Mogra","Varka","Druska","Braska","Zaira","Korva","Raga","Ygra","Shara","Vorga"]},
 beastkin:{male:["Rhokar","Draven","Varyx","Tharox","Voran","Rhazek","Krax","Ravorn","Zarok","Rhygar","Vexar","Khalor"],female:["Rhyra","Vyra","Zyra","Kaora","Thalira","Zaira","Shaera","Veyra","Rhezia","Khyra","Mirax","Ravena"]},
 umbral:{male:["Kaelor","Nox","Varis","Zevran","Odran","Nareth","Keldric","Sylas","Edrik","Nivor","Draven","Vaelor"],female:["Kaelith","Nyx","Nera","Ysra","Melys","Selyne","Veyra","Nivara","Iria","Mireth","Myrith","Vessa"]}
};
const family:Record<HeroRace,readonly string[]>={
 human:["Valen","Alvorada","Luzbranca","Torreferro","Riomanso","Escudorubro","Coraçãoferro","Soldebruma","Ventoaurora","Ventolume","Rosaferro","Coroaquebrada"],
 elf:["Cael","Silvestre","Luarverde","Folhacinza","Luaescura","Bosquenegro","Seivalume","Raizforte","Brumaclara","Véudourado","Alvorduna","Elarin"],
 dwarf:["Pedraferro","Runafria","Ferroverde","Marteloazul","Cinzaferro","Pedralua","Almaferro","Montenegro","Pedrassol","Runaalta","Geloazul","Ferrobrasa"],
 orc:["Garrasangue","Brasaferro","Trovãorubro","Denteferro","Hordacinza","Pedrabrava","Sangueverde","Machador","Garranegra","Quebraescudo","Fúriasul","Trollferro"],
 beastkin:["Brasavil","Escamaforte","Chamarubra","Garraantiga","Olhoâmbar","Pedraescama","Ventoferoz","Caudaouro","Asaescura","Espinhofogo","Brasaazul","Sangueprata"],
 umbral:["Sombria","Véunegro","Noitelume","Corvoalto","Névoaroxa","Sombravéu","Abismoazul","Ecofundo","Ruinalva","Luaferro","Ocasonegro","Estrelafria"]
};
const origins=["de Valen","das Ruínas","do Ocaso","da Fronteira","do Norte","da Coroa","do Abismo","do Sol","das Cinzas","da Lua","de Brumavale","do Horizonte"];
export const HERO_CANONICAL_SEX:Record<string,HeroSex>={aric:"male",lyra:"female",elen:"male",kael:"female",sora:"male",doran:"male"};
export function stableHeroHash(s:string):number{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function heroSex(hero:{id:string;name:string;sex?:HeroSex}):HeroSex{
 if(hero.sex==="male"||hero.sex==="female")return hero.sex;
 if(hero.id in HERO_CANONICAL_SEX)return HERO_CANONICAL_SEX[hero.id];
 const first=hero.name.trim().split(/\s+/)[0].toLocaleLowerCase("pt-BR");
 for(const race of HERO_VISUAL_RACES)for(const sex of HERO_SEXES)if(given[race][sex].some(n=>n.toLocaleLowerCase("pt-BR")===first))return sex;
 // Nomes de saves legados são preservados, sem mudar identidade ou progresso.
 return /(?:a|ia|yne|wen|eth|ys)$/.test(first)?"female":"male";
}
export function generatedHeroSex(id:string):HeroSex{return HERO_SEXES[stableHeroHash(id+":sexo")%2];}
export function generatedHeroRace(id:string):HeroRace{return HERO_VISUAL_RACES[stableHeroHash(id+":raca")%HERO_VISUAL_RACES.length];}
export function identityName(index:number,race:HeroRace,sex:HeroSex):string{
 if(!Number.isSafeInteger(index)||index<0)throw new RangeError("Índice de personagem inválido.");
 const a=given[race][sex],b=family[race],span=a.length*b.length;
 const pos=((index%span)*65537+7919)%span;
 const tier=Math.floor(index/span);
 const origin=tier>0?" "+origins[(tier-1)%origins.length]:"";
 const cycle=tier>origins.length?" "+Math.ceil(tier/origins.length):"";
 return a[pos%a.length]+" "+b[Math.floor(pos/a.length)]+origin+cycle;
}
export function portraitAssetKey(race:HeroRace,heroClass:HeroClass,sex:HeroSex){return race+"/"+heroClass+"-"+sex;}
export function isActiveHeroClass(cl:HeroClass){return HERO_VISUAL_CLASSES.includes(cl);}
