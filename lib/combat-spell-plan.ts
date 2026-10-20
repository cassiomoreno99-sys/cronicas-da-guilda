import type {AbilityEffect,AbilitySpec,BattleFighter,BattleLog} from "./game.ts";

/** Bloco 10A — identidade mágica a partir da habilidade REAL utilizada.
 * Nenhum feitiço novo entra no catálogo, dano ou salvamento.
 * "Gelo" só aparece se o nome de uma habilidade existente indicar frio.
 */
export type SpellFamily="flame"|"storm"|"frost"|"shadow"|"radiant"|"verdant"|"arcane"|"ward"|"resonance";
export type SpellMotion="projectile"|"lightning"|"nova"|"aura"|"barrier"|"drain";
export type SpellPlan={
 family:SpellFamily;motion:SpellMotion;effect:AbilityEffect|"basic";
 duration:number;impactOffset:number;windupOffset:number;
 particleCount:number;multiTarget:boolean;healing:boolean;protecting:boolean;
};
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const physical=new Set<AbilityEffect>(["pinning","execution","chi"]);
const families:Partial<Record<AbilityEffect,[SpellFamily,SpellMotion]>>={
 fireball:["flame","nova"],storm:["storm","lightning"],
 restore:["radiant","aura"],aegis:["ward","barrier"],
 renew:["verdant","aura"],lifebloom:["verdant","aura"],
 sanctuary:["radiant","nova"],fortress:["ward","barrier"],
 challenge:["ward","barrier"],anthem:["resonance","aura"],
 drain:["shadow","drain"],venom:["shadow","projectile"],
 control:["arcane","lightning"]
};
const themeFromName=(name:string):[SpellFamily,SpellMotion]|undefined=>{
 const t=normalize(name);
 if(/(gelo|gelid|glacial|geada|neve|frio|inverno|congel|frost|ice)/.test(t))return ["frost","nova"];
 if(/(tempest|raio|trovao|relamp|lightning|storm)/.test(t))return ["storm","lightning"];
 if(/(fogo|chama|flama|brasa|incend|infer|fire)/.test(t))return ["flame","nova"];
 if(/(sombra|escur|necro|morte|treva|vazio|abismo|shadow)/.test(t))return ["shadow","drain"];
 if(/(cura|vida|renov|flor|raiz|bosque|nature)/.test(t))return ["verdant","aura"];
 if(/(sol|luz|aurora|sagrad|divin|holy)/.test(t))return ["radiant","aura"];
 return undefined;
};
const healEffects=new Set<AbilityEffect>(["restore","renew","lifebloom","sanctuary","aegis"]);
const shields=new Set<AbilityEffect>(["challenge","aegis","anthem","sanctuary","fortress"]);
export function spellPlan(input:{
 fighter:Pick<BattleFighter,"side"|"class">|undefined;
 event:Pick<BattleLog,"kind"|"amount">|undefined;
 ability?:Pick<AbilitySpec,"effect"|"name"|"target">;
 castOnly:boolean;targetCount:number;lightMode?:boolean;
}):SpellPlan|undefined{
 const {fighter,event,ability,castOnly,targetCount,lightMode}=input;
 if(!fighter||!event)return undefined;
 const effect=ability?.effect;
 if(effect&&physical.has(effect))return undefined;
 if(!castOnly&&event.kind!=="ability"&&event.kind!=="heal")return undefined;
 // Nunca criar magia para um acerto físico sem habilidade conhecida.
 if(event.kind==="ability"&&!effect)return undefined;
 if(event.kind==="heal"&&!effect&&fighter.side!=="hero")return undefined;
 const theme=effect==="supreme"&&ability?.name?themeFromName(ability.name):undefined;
 const selected: [SpellFamily,SpellMotion]=theme|| (effect&&families[effect])
  ||(effect==="supreme"?["arcane","nova"]:event.kind==="heal"?["radiant","aura"]:["arcane","projectile"]);
 const healing=!!effect&&healEffects.has(effect)||event.kind==="heal"&&(!effect||effect==="supreme");
 const protecting=!!effect&&shields.has(effect);
 const multiTarget=(ability?.target==="all-allies"||ability?.target==="all-enemies")&&targetCount>1;
 const duration=lightMode?520: selected[1]==="lightning"?930:selected[1]==="nova"?940:840;
 return {family:selected[0],motion:selected[1],effect:effect||"basic",
  duration,impactOffset:.54,windupOffset:.22,particleCount:lightMode?4:multiTarget?10:7,
  multiTarget,healing,protecting};
}
/** Posições de impactos derivadas do registro de batalha, nunca geradas aleatoriamente. */
export function spellImpactPoints(points:ReadonlyArray<{x:number;y:number}>,limit=4){
 return points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))
  .slice(0,Math.max(0,Math.min(4,limit)))
  .map(p=>({x:Math.max(0,Math.min(100,p.x)),y:Math.max(0,Math.min(100,p.y))}));
}
