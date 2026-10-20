import type {AbilitySpec,BattleFighter,BattleLog,Mission} from "./game.ts";

/** BLOCO 12A — apenas APRESENTAÇÃO de poderes que existem em game.ts.
 * Não cria ações, fases, dano, itens, cooldowns, escudos ou eventos fictícios.
 */
export type SpectacleKind="supreme"|"boss-wave"|"boss-drain"|"boss-rearguard"|"boss-guard";
export type SpectacleSchool="blade"|"storm"|"light"|"shadow"|"nature"|"iron"|"astral"|"harmony";
export type SpectaclePlan={
 kind:SpectacleKind;school:SpectacleSchool;variant:"sweep"|"barrage"|"sanctuary"|"crush"|"drain"|"ward";
 book?:string;bossIndex?:number;hitsAll:boolean;support:boolean;points:number;duration:number;
};
export const SUPREME_BOOKS={
 "CG-301":["iron","ward"],"CG-302":["shadow","drain"],"CG-303":["blade","sweep"],
 "CG-304":["light","sanctuary"],"CG-305":["blade","barrage"],
 "CG-306":["shadow","crush"],"CG-307":["shadow","barrage"],
 "CG-308":["harmony","ward"],"CG-309":["astral","sweep"],
 "CG-310":["nature","sanctuary"],"CG-311":["light","sanctuary"],
 "CG-312":["light","sweep"],"CG-313":["harmony","ward"],
 "CG-314":["nature","sanctuary"],
 "IMP-B-WARRIOR":["iron","crush"],"IMP-B-PALADIN":["light","ward"],
 "IMP-B-RANGER":["storm","barrage"],"IMP-B-ROGUE":["shadow","crush"],
 "IMP-B-MAGE":["astral","sweep"],"IMP-B-HEALER":["light","sanctuary"],
 "IMP-B-BARD":["harmony","ward"]
} as const satisfies Record<string,readonly [SpectacleSchool,SpectaclePlan["variant"]]>;
export const SUPREME_BOOK_IDS=Object.keys(SUPREME_BOOKS);
const isBook=(book:string):book is keyof typeof SUPREME_BOOKS=>Object.prototype.hasOwnProperty.call(SUPREME_BOOKS,book);
const normalized=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
/** A habilidade precisa ter efeito supremo e id de grimório EXISTENTE.
 * Supremos não aparecem apenas porque o herói está com PV baixo.
 */
export function supremeSpectacle(ability:Pick<AbilitySpec,"effect"|"id">|undefined,
 actor:Pick<BattleFighter,"side">|undefined,
 event:Pick<BattleLog,"kind"|"text"|"actorId">|undefined,light=false):SpectaclePlan|undefined{
 if(!actor||actor.side!=="hero"||!event||!event.actorId||ability?.effect!=="supreme"
  ||!ability.id.startsWith("supreme-"))return undefined;
 const book=ability.id.slice(8);
 if(!isBook(book))return undefined;
 const [school,variant]=SUPREME_BOOKS[book];
 return {kind:"supreme",school,variant,book,hitsAll:["sweep","barrage"].includes(variant),
  support:["ward","sanctuary"].includes(variant),
  points:light?4:variant==="barrage"?11:8,duration:light?520:variant==="barrage"?1030:920};
}
/** Chefes oficiais: enemy-0 da missão boss, NUNCA inimigos comuns.
 * O texto do golpe realmente registrado distingue onda, drenagem, retaguarda.
 * O bloqueio de m.boss>=2 modo3 não gera log; só exibe aura do escudo existente.
 */
export function bossSpectacle(
 mission:Pick<Mission,"kind"|"boss">|undefined,
 actor:Pick<BattleFighter,"side"|"id">|undefined,
 event:Pick<BattleLog,"kind"|"actorId"|"text"|"targetId">|undefined,
 light=false
):SpectaclePlan|undefined{
 if(mission?.kind!=="boss"||actor?.side!=="enemy"||actor.id!=="enemy-0"
  ||!event||event.actorId!==actor.id)return undefined;
 const t=normalized(event.text);
 const wave=/((vigia|guardiao) (libera|atinge)|onda sombria|onda contra)/.test(t);
 const siphon=/(matriarca drena|guardiao recupera forcas)/.test(t);
 const rear=/(guardiao invade a retaguarda)/.test(t);
 if(!wave&&!siphon&&!rear)return undefined;
 if(wave&&event.kind!=="ability"&&event.kind!=="fall")return undefined;
 if(siphon&&event.kind!=="heal")return undefined;
 if(rear&&event.kind!=="ability"&&event.kind!=="fall")return undefined;
 const kind:SpectacleKind=wave?"boss-wave":siphon?"boss-drain":"boss-rearguard";
 const variant:SpectaclePlan["variant"]=wave?"sweep":siphon?"drain":"crush";
 const school:SpectacleSchool=wave?"shadow":siphon?"nature":"iron";
 return {kind,school,variant,bossIndex:mission.boss??0,hitsAll:wave,
  support:siphon,points:light?4:wave?10:8,duration:light?520:wave?1040:920};
}
export function spectacleTargets(points:readonly {x:number;y:number}[],max=4){
 return points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))
  .slice(0,Math.max(0,Math.min(4,Math.floor(max))))
  .map(p=>({x:Math.min(100,Math.max(0,p.x)),y:Math.min(100,Math.max(0,p.y))}));
}
/** Perfil visual baseado em HP real, NÃO representa nova fase de IA. */
export function bossPressure(hp:number,maxHp:number):"stable"|"strained"|"critical"{
 const fraction=maxHp>0?hp/maxHp:0;
 return fraction<=.25?"critical":fraction<=.55?"strained":"stable";
}
