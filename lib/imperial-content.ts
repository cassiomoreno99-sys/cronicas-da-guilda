/** Arsenal Supremo Imperial: sete armas, sete conjuntos de 12 peças, sete grimórios por classe.
 * A partir da região 6, chefes regionais podem derrubar uma peça do conjunto da equipe.
 * Versões raciais anteriores são migradas para as classes sem perder itens pagos. */
import type {HeroClass} from "./game.ts";
import type {CatalogEntry} from "./catalog-test.ts";
export const IMPERIAL_BOOK_PRICE=500_000;
export const IMPERIAL_MIN_REGION=10;
export const IMPERIAL_DROP_MIN_REGION=6;
export const IMPERIAL_DROP_BASE=.20;
export const IMPERIAL_MIN_LEVEL=40;
export const IMPERIAL_REGION="Império de Solkar";
type Bonuses=Record<string,number>;
type ClassSet={heroClass:HeroClass;label:string;name:string;crest:string;accent:Bonuses};
export const IMPERIAL_CLASSES:readonly ClassSet[]=[
 {heroClass:"warrior",label:"Guerreiro",name:"Regalia do Imperador de Ferro",crest:"do Imperador de Ferro",accent:{ATQ:5,DEF:2}},
 {heroClass:"paladin",label:"Cavaleiro",name:"Regalia do Juramento Eterno",crest:"do Juramento Eterno",accent:{DEF:5,PV:12}},
 {heroClass:"ranger",label:"Arqueiro",name:"Regalia do Horizonte Imperial",crest:"do Horizonte Imperial",accent:{ATQ:4,VEL:2}},
 {heroClass:"rogue",label:"Assassino",name:"Regalia do Eclipse Silencioso",crest:"do Eclipse Silencioso",accent:{ATQ:3,CRIT_PP:1}},
 {heroClass:"mage",label:"Mago",name:"Regalia das Estrelas Eternas",crest:"das Estrelas Eternas",accent:{MAG:6,VEL:1}},
 {heroClass:"healer",label:"Sacerdote",name:"Regalia da Aurora Divina",crest:"da Aurora Divina",accent:{MAG:4,DEF:3}},
 {heroClass:"bard",label:"Pierrô",name:"Regalia do Destino Imperial",crest:"do Destino Imperial",accent:{MAG:3,SORTE:2}}
];
const SLOTS=[
 {slot:"Arma principal",label:"Arma da Dinastia",stats:{ATQ:15,MAG:8}},
 {slot:"Mão secundária",label:"Égide Imperial",stats:{DEF:11,MAG:6}},
 {slot:"Elmo",label:"Coroa de Batalha",stats:{DEF:12,PV:20}},
 {slot:"Ombreiras",label:"Ombreiras do Trono",stats:{DEF:10,PV:16}},
 {slot:"Armadura",label:"Peitoral da Regalia",stats:{DEF:22,PV:55}},
 {slot:"Luvas",label:"Manoplas do Decreto",stats:{ATQ:6,VEL:2}},
 {slot:"Cinto",label:"Cinturão da Soberania",stats:{DEF:7,PV:22}},
 {slot:"Botas",label:"Botas da Conquista",stats:{VEL:5,DEF:5}},
 {slot:"Capa",label:"Manto do Império",stats:{MAG:5,VEL:3}},
 {slot:"Anel 1",label:"Anel do Domínio",stats:{CRIT_PP:1,ATQ:5}},
 {slot:"Anel 2",label:"Anel do Legado",stats:{MAG:7,SORTE:1}},
 {slot:"Amuleto",label:"Amuleto do Eterno",stats:{MAG:8,PV:20}}
] as const;
const WEAPONS=[
 {id:"IMP-W-WARRIOR",name:"Espada Suprema do Imperador",classe:"Guerreiro",stats:{ATQ:52,DEF:12}},
 {id:"IMP-W-PALADIN",name:"Lança Suprema do Juramento",classe:"Cavaleiro",stats:{ATQ:32,DEF:25,PV:45}},
 {id:"IMP-W-RANGER",name:"Arco Supremo do Horizonte",classe:"Arqueiro",stats:{ATQ:48,VEL:6,CRIT_PP:3}},
 {id:"IMP-W-ROGUE",name:"Adaga Suprema do Eclipse",classe:"Assassino",stats:{ATQ:45,VEL:9,CRIT_PP:4}},
 {id:"IMP-W-MAGE",name:"Cajado Supremo das Estrelas",classe:"Mago",stats:{MAG:59,VEL:3}},
 {id:"IMP-W-HEALER",name:"Cetro Supremo da Aurora",classe:"Sacerdote",stats:{MAG:45,DEF:8,PV:50}},
 {id:"IMP-W-BARD",name:"Bastão Supremo do Destino",classe:"Pierrô",stats:{MAG:35,VEL:6,SORTE:7}}
] as const;
const BOOKS=[
 {heroClass:"warrior",name:"Códice Imperial do Imperador de Ferro",effect:"Fúria Soberana: golpe devastador e aumento de ataque."},
 {heroClass:"paladin",name:"Códice Imperial do Juramento Eterno",effect:"Muralha do Juramento: escudos e proteção para toda a equipe."},
 {heroClass:"ranger",name:"Códice Imperial do Horizonte",effect:"Chuva de Flechas: ataque imperial em área e bênção crítica."},
 {heroClass:"rogue",name:"Códice Imperial do Eclipse Silencioso",effect:"Lâmina do Eclipse: ataque letal e esquiva do assassino."},
 {heroClass:"mage",name:"Códice Imperial das Estrelas",effect:"Tempestade Astral: dano mágico em área, lentidão e vulnerabilidade."},
 {heroClass:"healer",name:"Códice Imperial da Aurora Divina",effect:"Milagre Imperial: cura, regeneração e escudos aos aliados."},
 {heroClass:"bard",name:"Códice Imperial do Destino",effect:"Hino Imperial: inspira a equipe, bênção crítica e proteção."}
] as const;
const names:Record<string,HeroClass>=Object.fromEntries(IMPERIAL_CLASSES.map(x=>[x.label,x.heroClass]));
function joinStats(a:Bonuses,b:Bonuses):Bonuses{const n={...a};for(const [k,v] of Object.entries(b))n[k]=(n[k]||0)+v;return n;}
const imperial=(x:Omit<CatalogEntry,"raridade"|"regiao"|"nivel"|"preco_venda"|"obtencao">,price:number,drop=false):CatalogEntry=>({
 ...x,raridade:"SUPREMO",regiao:IMPERIAL_REGION,nivel:IMPERIAL_MIN_LEVEL,preco_compra:price,preco_venda:0,
 obtencao:drop?"Compra no Império de Solkar (região 10) ou drop do chefe regional a partir da região 6; sorte e entrosamento influenciam.":"Mercador Imperial no Império de Solkar (região 10)."
});
export const IMPERIAL_WEAPON_IDS:string[]=WEAPONS.map(w=>w.id);
export const IMPERIAL_WEAPONS:CatalogEntry[]=WEAPONS.map(w=>imperial({
 id:w.id,nome:w.name,categoria:"Arma Suprema Imperial",subcategoria:w.classe,classes:[w.classe],
 slot:"Arma principal",atributos:w.stats,efeito:"Arma Suprema Imperial exclusiva de "+w.classe+". Substitui a arma do conjunto de classe.",conjunto:null,preco_compra:150_000
},150_000));
export const IMPERIAL_SETS:CatalogEntry[]=IMPERIAL_CLASSES.flatMap(config=>SLOTS.map((item,i)=>imperial({
 id:"IMP-S-"+config.heroClass.toUpperCase()+"-"+String(i+1).padStart(2,"0"),
 nome:item.label+" "+config.crest,categoria:"Conjunto Supremo Imperial",subcategoria:config.name,
 classes:[config.label],slot:item.slot,atributos:joinStats(item.stats,config.accent),
 efeito:"Peça "+(i+1)+"/12 de "+config.name+". Bônus em 3, 6, 9 e 12 peças.",
 conjunto:config.name,preco_compra:35_000
},35_000,true)));
export const IMPERIAL_BOOKS:CatalogEntry[]=BOOKS.map(b=>{
 const config=IMPERIAL_CLASSES.find(x=>x.heroClass===b.heroClass)!;
 return imperial({id:"IMP-B-"+b.heroClass.toUpperCase(),nome:b.name,categoria:"Livro Imperial",
 subcategoria:"Grimório Supremo Imperial de "+config.label,classes:[config.label],slot:"Livro",atributos:{},efeito:b.effect,conjunto:null,
 preco_compra:IMPERIAL_BOOK_PRICE},IMPERIAL_BOOK_PRICE);
});
export const IMPERIAL_ITEMS:CatalogEntry[]=[...IMPERIAL_WEAPONS,...IMPERIAL_SETS,...IMPERIAL_BOOKS];
/** Arte individual exibida via sete atlas WebP (14 imagens por classe).
 * Índices: 0=arma suprema, 1..12=peças do conjunto, 13=livro.
 * O atlas é uma grade 4x4; 2 células finais são vazias. */
export function imperialArtwork(key:string):{src:string;index:number}|null{
 const match=/^IMP-(W|S|B)-(WARRIOR|PALADIN|RANGER|ROGUE|MAGE|HEALER|BARD)(?:-(\\d{2}))?$/.exec(key);
 if(!match)return null;
 const kind=match[1],digit=match[3];
 if((kind==="S"&&!digit)||(kind!=="S"&&digit))return null;
 const index=kind==="W"?0:kind==="B"?13:Number(digit);
 if(!Number.isInteger(index)||index<0||index>13||(kind==="S"&&(index<1||index>12)))return null;
 return {src:"/items/imperial/"+match[2].toLowerCase()+".webp",index};
}
export const IMPERIAL_BY_ID:Record<string,CatalogEntry>=Object.fromEntries(IMPERIAL_ITEMS.map(i=>[i.id,i]));
export function imperialMarket(region:number){return region>=IMPERIAL_MIN_REGION?IMPERIAL_ITEMS:[];}
/** Converte IDs raciais da implementação anterior em IDs da classe do proprietário. */
export function migrateLegacyImperialKey(key:string,heroClass:HeroClass):string{
 const current=IMPERIAL_CLASSES.some(x=>x.heroClass===heroClass)?heroClass:"warrior";
 const piece=key.match(/^IMP-S-(HUMAN|ELF|DWARF|ORC|BEASTKIN|UMBRAL)-(\d{2})$/);
 if(piece)return "IMP-S-"+current.toUpperCase()+"-"+piece[2];
 if(/^IMP-B-(HUMAN|ELF|DWARF|ORC|BEASTKIN|UMBRAL)$/.test(key))return "IMP-B-"+current.toUpperCase();
 return key;
}
export type ImperialSetStats={attack:number;defense:number;magic:number;hp:number;speed:number;critical:number;healing:number;luck:number};
const TIERS:Partial<Record<HeroClass,readonly Partial<ImperialSetStats>[]>>={
 warrior:[{attack:9,defense:3},{attack:15,hp:25},{attack:20,defense:14},{attack:38,defense:20,hp:90}],
 paladin:[{defense:10,hp:25},{defense:18,hp:40},{defense:25,healing:.03},{defense:35,hp:120,healing:.06}],
 ranger:[{attack:10,speed:3},{attack:15,critical:.02},{attack:20,speed:5},{attack:34,speed:8,critical:.03}],
 rogue:[{attack:10,critical:.01},{attack:16,speed:4},{attack:22,critical:.02},{attack:35,critical:.04,speed:8}],
 mage:[{magic:12,critical:.01},{magic:18,hp:25},{magic:24,speed:3},{magic:38,critical:.03,hp:60}],
 healer:[{magic:8,healing:.03},{defense:13,hp:35},{magic:18,healing:.05},{magic:30,healing:.08,hp:100}],
 bard:[{magic:7,luck:.01},{speed:5,healing:.03},{magic:18,luck:.02},{magic:30,luck:.04,critical:.02}]
};
export function imperialSetProgress(heroClass:HeroClass,equippedKeys:string[]){
 const set=IMPERIAL_CLASSES.find(x=>x.heroClass===heroClass)||IMPERIAL_CLASSES[0];
 const owned=new Set(equippedKeys);
 const classWeapon=WEAPONS.find(w=>names[w.classe]===set.heroClass);
 const substitution=!!classWeapon&&owned.has(classWeapon.id);
 const pieces=IMPERIAL_SETS.filter(x=>x.classes.includes(set.label)).map((x,i)=>({
 key:x.id,name:x.nome,owned:owned.has(x.id)||(i===0&&substitution),
 substituted:i===0&&!owned.has(x.id)&&substitution
 }));
 return {heroClass:set.heroClass,name:set.name,count:pieces.filter(p=>p.owned).length,pieces,tiers:[3,6,9,12] as const};
}
export function imperialSetBonuses(heroClass:HeroClass,equippedKeys:string[]):ImperialSetStats{
 const n:ImperialSetStats={attack:0,defense:0,magic:0,hp:0,speed:0,critical:0,healing:0,luck:0};
 const count=imperialSetProgress(heroClass,equippedKeys).count,tiers=TIERS[heroClass]||TIERS.warrior!;
 [3,6,9,12].forEach((min,i)=>{if(count>=min)for(const [key,value] of Object.entries(tiers[i]))(n as unknown as Record<string,number>)[key]+=value;});
 return n;
}
