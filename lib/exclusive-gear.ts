/** Prêmios exclusivos: não entram nas 314 mercadorias compráveis do catálogo.
 * Um troféu de guilda por temporada; seis relíquias com trava de raça. */
import type {HeroRace} from "./game.ts";
export type ExclusiveGear={id:string;nome:string;race?:HeroRace;slot:string;attributes:Record<string,number>;icon:string};
const series=["Alvorecer","Cinzas","Tempestade","Brumavale","Sol Negro","Maré Alta","Forja Antiga","Falcão","Corvo Rubro","Estrela Fria","Crepúsculo","Eterno Retorno"];
export const GUILD_EXCLUSIVE_GEAR:ExclusiveGear[]=series.map((name,index)=>({
 id:"GX-"+String(index+1).padStart(2,"0"),nome:"Relíquia Sazonal · "+name,slot:"Armadura",
 attributes:{ATQ:6+index%3*2,DEF:12+index%4*2,PV:38+index%5*6},icon:"CG-039"
}));
export const RACIAL_EXCLUSIVE_GEAR:ExclusiveGear[]=[
 {id:"RX-HUMAN",nome:"Insígnia dos Herdeiros Humanos",race:"human",slot:"Amuleto",attributes:{ATQ:9,DEF:4,PV:20},icon:"CG-041"},
 {id:"RX-ELF",nome:"Selo Élfico da Lua",race:"elf",slot:"Amuleto",attributes:{MAG:11,VEL:4,PV:12},icon:"CG-045"},
 {id:"RX-DWARF",nome:"Runa Anã de Pedraferro",race:"dwarf",slot:"Amuleto",attributes:{DEF:14,PV:42},icon:"CG-046"},
 {id:"RX-ORC",nome:"Presa Ancestral Orc",race:"orc",slot:"Amuleto",attributes:{ATQ:14,PV:22},icon:"CG-041"},
 {id:"RX-BEASTKIN",nome:"Essência Dracônica Bestial",race:"beastkin",slot:"Amuleto",attributes:{ATQ:10,MAG:6,PV:22},icon:"CG-043"},
 {id:"RX-UMBRAL",nome:"Véu da Herança Umbral",race:"umbral",slot:"Amuleto",attributes:{MAG:10,DEF:7,PV:16},icon:"CG-044"}
];
export const EXCLUSIVE_GEAR=[...GUILD_EXCLUSIVE_GEAR,...RACIAL_EXCLUSIVE_GEAR];
export const EXCLUSIVE_BY_ID=Object.fromEntries(EXCLUSIVE_GEAR.map(x=>[x.id,x]));
/** Três materiais diferentes de catálogo por temporada; o número de unidades
 * concedidas é exatamente o necessário para produzir uma única relíquia. */
export function seasonalMaterialBundle(season:number,availableMaterials:string[]):Record<string,number>{
 const uniq=[...new Set(availableMaterials)].sort();
 if(uniq.length<6)throw new Error("Faltam materiais para premiação sazonal.");
 const start=((Math.max(1,season)-1)*3)%uniq.length;
 const result:Record<string,number>={};
 for(let n=0;n<3;n++)result[uniq[(start+n)%uniq.length]]=1+(n===2?1:0);
 return result;
}
