/** Arsenal Imperial: sete armas por classe, seis conjuntos raciais de 12 peças
 * e seis grimórios de 500.000 ouro. IDs estáveis para saves antigos.
 * A arma imperial da classe substitui a peça "arma" do conjunto racial,
 * preservando os 12 espaços físicos e permitindo completar 12/12. */
import type { HeroRace } from "./game.ts";
import type { CatalogEntry } from "./catalog-test.ts";

export const IMPERIAL_BOOK_PRICE=500_000;
export const IMPERIAL_MIN_REGION=10;
export const IMPERIAL_MIN_LEVEL=40;
export const IMPERIAL_REGION="Império de Solkar";
type Bonuses=Record<string,number>;
type RacialSet={race:HeroRace;name:string;crest:string;accent:Bonuses};
export const IMPERIAL_RACES:readonly RacialSet[]=[
 {race:"human",name:"Regalia dos Sete Estandartes",crest:"da Coroa dos Reinos",accent:{ATQ:2,DEF:3}},
 {race:"elf",name:"Regalia da Lua Eterna",crest:"de Lúmen",accent:{MAG:4,VEL:1}},
 {race:"dwarf",name:"Regalia da Montanha Primordial",crest:"de Pedraferro",accent:{DEF:5,PV:10}},
 {race:"orc",name:"Regalia do Trono de Sangue",crest:"da Horda Imperial",accent:{ATQ:5,PV:8}},
 {race:"beastkin",name:"Regalia da Chama Dracônica",crest:"da Escama Ancestral",accent:{ATQ:3,VEL:2}},
 {race:"umbral",name:"Regalia do Eclipse Absoluto",crest:"do Véu de Nhal",accent:{MAG:4,CRIT_PP:1}}
];
const ALL_CLASSES=["Guerreiro","Cavaleiro","Arqueiro","Assassino","Mago","Sacerdote","Pierrô"];
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
 {race:"human",name:"Codex Imperial dos Sete Estandartes",effect:"Comando Soberano: protege e inspira toda a equipe por 2 turnos."},
 {race:"elf",name:"Codex Imperial da Lua Eterna",effect:"Lua de Lúmen: atinge todos os inimigos e concede regeneração aos aliados."},
 {race:"dwarf",name:"Codex Imperial da Montanha",effect:"Muralha Primordial: concede escudos e proteção à equipe por 2 turnos."},
 {race:"orc",name:"Codex Imperial do Trono de Sangue",effect:"Fúria do Trono: golpe devastador e aumento de ataque do conjurador."},
 {race:"beastkin",name:"Codex Imperial da Chama Dracônica",effect:"Sopro Ancestral: atinge todos os inimigos e concede esquiva ao herói."},
 {race:"umbral",name:"Codex Imperial do Eclipse",effect:"Eclipse Absoluto: dano mágico em área, lentidão e vulnerabilidade."}
] as const;
function joinStats(a:Bonuses,b:Bonuses):Bonuses{
 const n={...a};for(const [k,v] of Object.entries(b))n[k]=(n[k]||0)+v;return n;
}
const imperial=(x:Omit<CatalogEntry,"raridade"|"regiao"|"nivel"|"preco_venda"|"obtencao">,price:number):CatalogEntry=>({
 ...x,raridade:"SUPREMO",regiao:IMPERIAL_REGION,nivel:IMPERIAL_MIN_LEVEL,
 preco_compra:price,preco_venda:0,obtencao:"Mercador Imperial — liberado no Império de Solkar (região 10)."
});
export const IMPERIAL_WEAPON_IDS:string[]=WEAPONS.map(w=>w.id);
export const IMPERIAL_WEAPONS:CatalogEntry[]=WEAPONS.map(w=>imperial({
 id:w.id,nome:w.name,categoria:"Arma Suprema Imperial",subcategoria:w.classe,classes:[w.classe],
 slot:"Arma principal",atributos:w.stats,efeito:"Arma suprema exclusiva da classe "+w.classe+". Substitui a arma do conjunto racial imperial.",conjunto:null,preco_compra:150_000
},150_000));
export const IMPERIAL_SETS:CatalogEntry[]=IMPERIAL_RACES.flatMap(config=>SLOTS.map((item,i)=>imperial({
 id:"IMP-S-"+config.race.toUpperCase()+"-"+String(i+1).padStart(2,"0"),
 nome:item.label+" "+config.crest,categoria:"Conjunto Supremo Imperial",subcategoria:config.name,
 classes:ALL_CLASSES,race:config.race,slot:item.slot,atributos:joinStats(item.stats,config.accent),
 efeito:"Peça "+(i+1)+"/12 de "+config.name+". Bônus raciais progressivos em 3, 6, 9 e 12 peças.",
 conjunto:config.name,preco_compra:35_000
},35_000)));
export const IMPERIAL_BOOKS:CatalogEntry[]=BOOKS.map(b=>imperial({
 id:"IMP-B-"+b.race.toUpperCase(),nome:b.name,categoria:"Livro Imperial",subcategoria:"Grimório racial",
 classes:ALL_CLASSES,race:b.race,slot:"Livro",atributos:{},efeito:b.effect,conjunto:null,
 preco_compra:IMPERIAL_BOOK_PRICE
},IMPERIAL_BOOK_PRICE));
export const IMPERIAL_ITEMS:CatalogEntry[]=[...IMPERIAL_WEAPONS,...IMPERIAL_SETS,...IMPERIAL_BOOKS];
export const IMPERIAL_BY_ID:Record<string,CatalogEntry>=Object.fromEntries(IMPERIAL_ITEMS.map(i=>[i.id,i]));
export function imperialMarket(region:number){return region>=IMPERIAL_MIN_REGION?IMPERIAL_ITEMS:[];}

export type ImperialSetStats={attack:number;defense:number;magic:number;hp:number;speed:number;critical:number;healing:number;luck:number};
const TIERS:Record<HeroRace,readonly Partial<ImperialSetStats>[]>={
 human:[{attack:5,defense:5},{magic:10,hp:35},{attack:12,defense:12},{attack:20,defense:20,magic:20,hp:80}],
 elf:[{magic:9,speed:2},{magic:14,critical:.01},{magic:18,speed:4},{magic:28,critical:.03,hp:50}],
 dwarf:[{defense:10,hp:25},{defense:18,hp:40},{defense:25,healing:.03},{defense:35,hp:120,healing:.06}],
 orc:[{attack:10,hp:20},{attack:18,critical:.01},{attack:25,hp:50},{attack:38,hp:90,critical:.03}],
 beastkin:[{speed:4,attack:8},{attack:16,critical:.02},{speed:6,hp:35},{attack:30,speed:9,critical:.03}],
 umbral:[{magic:12,critical:.01},{magic:18,luck:.02},{magic:25,speed:3},{magic:32,critical:.03,luck:.03}]
};
export function imperialSetProgress(race:HeroRace,equippedKeys:string[]){
 const set=IMPERIAL_RACES.find(x=>x.race===race)!;
 const owned=new Set(equippedKeys);
 const substitution=equippedKeys.some(k=>IMPERIAL_WEAPON_IDS.includes(k));
 const pieces=IMPERIAL_SETS.filter(x=>x.race===race).map((x,i)=>({
 key:x.id,name:x.nome,owned:owned.has(x.id)||(i===0&&substitution),
 substituted:i===0&&!owned.has(x.id)&&substitution
 }));
 return {race,name:set.name,count:pieces.filter(p=>p.owned).length,pieces,tiers:[3,6,9,12] as const};
}
export function imperialSetBonuses(race:HeroRace,equippedKeys:string[]):ImperialSetStats{
 const n:ImperialSetStats={attack:0,defense:0,magic:0,hp:0,speed:0,critical:0,healing:0,luck:0};
 const count=imperialSetProgress(race,equippedKeys).count;
 [3,6,9,12].forEach((min,i)=>{if(count>=min)for(const [key,value] of Object.entries(TIERS[race][i]))(n as unknown as Record<string,number>)[key]+=value;});
 return n;
}
