import type {AbilitySpec} from "./game.ts";

/** BLOCO 13A — modelo de APRESENTAÇÃO para habilidades já existentes.
 * Não muda recargas, utilização, alvos, pontos de vida ou salvamento.
 */
export type AbilityTone="steel"|"ember"|"storm"|"shadow"|"nature"|"radiant"|"ward"|"tempo"|"supreme";
export type AbilityGlyph="swords"|"flame"|"zap"|"skull"|"leaf"|"heart"|"shield"|"crosshair"|"sparkles"|"star";
export type AbilityFamily="Ataque"|"Controle"|"Proteção"|"Recuperação"|"Suprema";
export type AbilityVisual={tone:AbilityTone;glyph:AbilityGlyph;family:AbilityFamily;targetLabel:string;legend:string};
const visualByEffect:Record<AbilitySpec["effect"],readonly [AbilityTone,AbilityGlyph,AbilityFamily]>={
 challenge:["ward","shield","Proteção"],
 fireball:["ember","flame","Ataque"],
 restore:["radiant","heart","Recuperação"],
 venom:["shadow","skull","Controle"],
 pinning:["steel","crosshair","Controle"],
 aegis:["ward","shield","Proteção"],
 chi:["steel","swords","Ataque"],
 drain:["shadow","skull","Recuperação"],
 renew:["nature","leaf","Recuperação"],
 anthem:["tempo","sparkles","Proteção"],
 execution:["steel","swords","Ataque"],
 storm:["storm","zap","Ataque"],
 lifebloom:["nature","leaf","Recuperação"],
 sanctuary:["radiant","heart","Proteção"],
 fortress:["ward","shield","Proteção"],
 control:["storm","zap","Controle"],
 supreme:["supreme","star","Suprema"]
};
const targets:Record<AbilitySpec["target"],string>={
 self:"Próprio herói",ally:"Aliado selecionado",enemy:"Inimigo selecionado",
 "all-allies":"Todos os aliados","all-enemies":"Todos os inimigos"
};
export function abilityVisual(ability:Pick<AbilitySpec,"effect"|"target"|"evolved">):AbilityVisual{
 const [tone,glyph,family]=visualByEffect[ability.effect];
 return {tone,glyph,family,targetLabel:targets[ability.target],
  legend:ability.effect==="supreme"?"Poder supremo de uso limitado":
   ability.evolved?"Habilidade evoluída":"Habilidade da campanha"};
}
export type AbilityAvailability={cooldown:number;totalCooldown:number;percent:number;
 state:"ready"|"cooldown"|"queued"|"busy"|"no-target";disabled:boolean;
 stateLabel:string;actionLabel:string;};
export function abilityAvailability(ability:Pick<AbilitySpec,"cooldown"|"target"|"effect">,{
 cooldown,queued=false,busy=false,hasAlly=true,hasEnemy=true
}:{cooldown:number;queued?:boolean;busy?:boolean;hasAlly?:boolean;hasEnemy?:boolean}):AbilityAvailability{
 const count=Math.max(0,Math.trunc(Number.isFinite(cooldown)?cooldown:0));
 const total=Math.max(1,Math.trunc(Number.isFinite(ability.cooldown)?ability.cooldown:1));
 const percent=Math.max(0,Math.min(100,100*count/total));
 const targetMissing=(ability.target==="ally"&&!hasAlly)||(ability.target==="enemy"&&!hasEnemy);
 const state=busy?"busy":queued?"queued":count>0?"cooldown":targetMissing?"no-target":"ready";
 const stateLabel=state==="busy"?"Processando ação":
   state==="queued"?"Ordem já preparada":
   state==="no-target"?"Selecione um alvo vivo":
   state==="cooldown"?(ability.effect==="supreme"?"Poder já utilizado nesta expedição":count+" turno"+(count===1?"":"s")+" de recarga"):"Pronta para preparar";
 const actionLabel=state==="ready"?"Preparar habilidade":stateLabel;
 return {cooldown:count,totalCooldown:total,percent,state,disabled:state!=="ready",stateLabel,actionLabel};
}
export function abilityHotkey(index:number){
 return index>=0&&index<5?String(index+1):undefined;
}
