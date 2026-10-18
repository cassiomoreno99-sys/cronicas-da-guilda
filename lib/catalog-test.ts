/** Catálogo experimental CG-001…CG-314. NUNCA importar na versão principal antes da validação. */
import raw from "./catalogo-314.json" with { type: "json" };
import type { HeroClass, ItemDef, ItemSlot, Campaign, HeroRace } from "./game.ts";
import { EXCLUSIVE_GEAR } from "./exclusive-gear.ts";
import { IMPERIAL_ITEMS } from "./imperial-content.ts";
export type CatalogEntry = {
 id:string; nome:string; raridade:string; categoria:string; subcategoria:string; classes:string[]; race?:HeroRace;
 nivel:number; regiao:string; slot:string; atributos:Record<string,number>;
 efeito:string; preco_compra:number|null; preco_venda:number;
 criacao?:string|null; obtencao:string; conjunto?:string|null;
 materiais?:Array<{id:string;quantidade:number}>;
};
export const CATALOG_ITEMS = (raw.itens as CatalogEntry[]);
const EXCLUSIVE_ITEMS:CatalogEntry[]=EXCLUSIVE_GEAR.map(x=>({
 id:x.id,nome:x.nome,raridade:"SUPREMO",categoria:"Equipamentos exclusivos",
 subcategoria:x.race?"Relíquia racial":"Relíquia de temporada",classes:["Guerreiro","Cavaleiro","Arqueiro","Assassino","Mago","Sacerdote","Pierrô"],
 nivel:1,regiao:"Todas as regiões",slot:x.slot,atributos:x.attributes,
 efeito:x.race?"Equipamento exclusivo da raça "+x.race:"Prêmio exclusivo de liga, forjado com materiais sazonais",
 preco_compra:null,preco_venda:0,obtencao:x.race?"Ranking dos melhores heróis":"Forja após prêmio das três melhores guildas",
 race:x.race
}));
export const CATALOG_BY_ID:Record<string,CatalogEntry> = Object.fromEntries([...CATALOG_ITEMS,...EXCLUSIVE_ITEMS,...IMPERIAL_ITEMS].map(i=>[i.id,i]));
export const CATALOG_RULES=raw.regras;
const CLASS_NAMES:Record<string,HeroClass> = {
 "Guerreiro":"warrior","Cavaleiro":"paladin","Arqueiro":"ranger","Assassino":"rogue",
 "Mago":"mage","Sacerdote":"healer","Pierrô":"bard"
};
export function requiredSlot(d:CatalogEntry):string|null {
 const slot=d.slot;
 if(slot.includes("duas mãos")||slot.includes("Arma principal"))return "weapon";
 if(slot==="Mão secundária")return "offhand";
 if(slot==="Elmo")return "helmet";
 if(slot==="Ombreiras")return "shoulders";
 if(slot==="Armadura")return "armor";
 if(slot==="Luvas")return "gloves";
 if(slot==="Cinto")return "belt";
 if(slot==="Botas")return "boots";
 if(slot==="Capa")return "cloak";
 if(slot.includes("Anel"))return "ring";
 if(slot==="Amuleto")return "amulet";
 return null;
}
function legacySlot(d:CatalogEntry):ItemSlot {
 const slot=requiredSlot(d);
 if(slot==="weapon")return "weapon";
 if(slot==="offhand")return "offhand";
 if(slot==="helmet")return "helmet";
 if(["shoulders","armor","belt","cloak"].includes(slot||""))return "armor";
 if(slot==="gloves")return "gloves";
 if(slot==="boots")return "boots";
 if(["ring","amulet"].includes(slot||""))return "accessory";
 if(d.categoria==="Materiais")return "material";
 if(d.categoria==="Consumíveis")return "consumable";
 if(d.categoria==="Livro de magia suprema"||d.categoria==="Livro Imperial")return "quest";
 return "treasure";
}
function rarity(r:string):ItemDef["rarity"] {
 return ({COMUM:"common",INCOMUM:"uncommon",RARO:"rare", "ÉPICO":"epic","LENDÁRIO":"legendary",SUPREMO:"legendary"} as const)[r as "COMUM"]||"common";
}
export const TEST_ITEMS:Record<string,ItemDef>=Object.fromEntries(Object.values(CATALOG_BY_ID).map(d=>[d.id,{
 name:d.nome,slot:legacySlot(d),rarity:rarity(d.raridade),race:d.race,
 value:d.preco_venda??0,description:d.efeito+" | "+d.obtencao,
 attack:d.atributos.ATQ||0,defense:d.atributos.DEF||0,
 magic:d.atributos.MAG||0,hp:d.atributos.PV||0,
 speed:d.atributos.VEL||0,critical:(d.atributos.CRIT_PP||0)/100,
 luck:(d.atributos.SORTE||0)/100,
 classes:d.classes.map(c=>CLASS_NAMES[c]).filter(Boolean),
 levelReq:d.nivel,
 set:d.conjunto||undefined
}]));
export const SETS = raw.conjuntos as Record<string,{classe:string;items:number[];bonus2:string;bonus3:string}>;
export type TestRecipe={id:string;result:string;cost:number;forge:number;materials:Record<string,number>};
function unaccent(s:string){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}
const MATERIAL_BY_NAME=new Map(CATALOG_ITEMS.filter(x=>x.categoria==="Materiais").map(x=>[unaccent(x.nome),x.id]));
function makeRecipe(d:CatalogEntry):TestRecipe|null{
 const text=d.criacao||"";
 const forgeMatch=text.match(/Forja\s+(\d+)/i);
 const isPrep=text.startsWith("Preparo:");
 if(!forgeMatch && !isPrep)return null;
 const mat:Record<string,number>={};
 for(const m of text.matchAll(/(\d+)×\s+(.+?)(?=\s+\+\s+\d+×|;\s*taxa)/g)){
  const qty=Number(m[1]);const name=m[2].trim();
  const id=/^CG-\d{3}$/i.test(name)?name:MATERIAL_BY_NAME.get(unaccent(name));
  if(!id)return null;
  mat[id]=(mat[id]||0)+qty;
 }
 if(Object.keys(mat).length===0)return null;
 const tax=Number(text.match(/taxa\s+([\d.]+)\s+ouro/i)?.[1]?.replace(/\./g,"")||0);
 if(!tax||tax<d.preco_venda)return null;
 return {id:"forge-"+d.id,result:d.id,cost:tax,forge:forgeMatch?Number(forgeMatch[1]):0,materials:mat};
}
export const TEST_RECIPES=CATALOG_ITEMS.map(makeRecipe).filter((x):x is TestRecipe=>!!x);
export const RECIPE_BY_ID:Record<string,TestRecipe>=Object.fromEntries(TEST_RECIPES.map(r=>[r.id,r]));
const RARITY_WEIGHT:Record<string,number>={COMUM:1,INCOMUM:2,RARO:3,"ÉPICO":4,"LENDÁRIO":5,SUPREMO:6};
export function testShop(s:Campaign):CatalogEntry[]{
 const region = s.activeRegion||1;
 const regionNames=["Vale de Valen","Terras de Brumavale","Ruínas de Ashen","Fronteira dos Dragões","Deserto de Sahir","Costa de Namar","Bosque de Elarin","Picos de Kharum","Pântano de Morn","Império de Solkar","Abismo de Nhal","Coroa do Mundo"];
 const current=regionNames[region-1];
 const eligible=CATALOG_ITEMS.filter(d=>d.preco_compra!=null&&d.nivel<=Math.max(1,region*4+3) &&
   (d.regiao===current || (d.categoria==="Materiais"&&regionNames.indexOf(d.regiao)>=0&&regionNames.indexOf(d.regiao)<region)) &&
   d.categoria!=="Livro de magia suprema" && RARITY_WEIGHT[d.raridade] <=Math.min(5,Math.floor(region/2)+2));
 const rotation=Math.floor((s.day-1)/7);
 return eligible.filter((d,i)=>((i+rotation*7)%3===0)).slice(0,12);
}
export function equippedPosition(itemKey:string):string|null {const d=CATALOG_BY_ID[itemKey];return d?requiredSlot(d):null;}
export function isTwoHanded(key:string){return CATALOG_BY_ID[key]?.slot.includes("duas mãos")||false;}
export function minimumLevelForBuy(s:Campaign,d:CatalogEntry){return d.nivel<=Math.max(...s.heroes.map(h=>h.level));}
