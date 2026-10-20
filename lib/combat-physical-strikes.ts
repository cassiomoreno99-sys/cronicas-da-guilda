import type {BattleFighter,BattleLog,HeroClass,AbilityEffect} from "./game.ts";

/** BLOCO 09 — direção de ataque visual, sem conceder armas ou mudar dano.
 * O item vestido tem prioridade; raça/classe só definem o gesto sem arma explícita.
 */
export type AttackStyle="sword"|"axe"|"spear"|"hammer"|"daggers"|"bow"|"claws"|"bite"|"tail"|"unarmed";
export type StrikePhase="windup"|"travel"|"contact"|"recovery";
export type PhysicalStrike={style:AttackStyle;variant:0|1|2;critical:boolean;
 duration:number;contactAt:number;phaseOffsets:readonly [number,number,number,number];ranged:boolean};
type WeaponDescription={name:string;subtype?:string}|null|undefined;
const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export function physicalStyle(fighter:Pick<BattleFighter,"side"|"name"|"class">,weapon?:WeaponDescription):AttackStyle{
 if(fighter.side==="enemy"){
  const n=normalize(fighter.name);
  if(/(lobo|pantera|fera lunar|yeti|ieti|troll|trol|devorador|urso)/.test(n))return "bite";
  if(/(drag|draco|hidra|serpente|drake|escorpiao)/.test(n))return "tail";
  if(/(aranha|carnical|goblin|demonio|orc|espectro|espirito)/.test(n))return "claws";
  if(/(mumia|golem|tita|guardiao antigo)/.test(n))return "hammer";
  if(/(cacador|emboscador|arqueiro)/.test(n))return "bow";
  if(/(cavaleiro|legionario|guarda|sentinela)/.test(n))return "spear";
  if(/(carrasco|rebelde|saqueador|salteador)/.test(n))return "axe";
  if(/(pirata|corsario)/.test(n))return "daggers";
  return "sword";
 }
 const name=normalize([weapon?.subtype||"",weapon?.name||""].join(" "));
 if(/(arco|besta|flecha|bow|crossbow)/.test(name))return "bow";
 if(/(lanca|alabarda|tridente|pique|spear|glaive)/.test(name))return "spear";
 if(/(machado|cleaver|warcleaver|axe)/.test(name))return "axe";
 if(/(martelo|marreta|ma[cç]a|hammer)/.test(name))return "hammer";
 if(/(adaga|punhal|rapieira|foice|scythe|dagger)/.test(name))return "daggers";
 if(/(garra|presas|claws)/.test(name))return "claws";
 if(/(espada|lamina|sabre|blade|katana|longsword)/.test(name))return "sword";
 const fallback:Partial<Record<HeroClass,AttackStyle>>={
  warrior:"sword",paladin:"sword",ranger:"bow",rogue:"daggers",monk:"unarmed",
  druid:"unarmed",healer:"unarmed",mage:"unarmed",necromancer:"unarmed",bard:"unarmed"
 };
 return fallback[fighter.class||"warrior"]||"unarmed";
}
const physicalAbilities=new Set<AbilityEffect>(["execution","pinning","chi"]);
const spellcasters=new Set<HeroClass>(["mage","healer","necromancer","druid","bard"]);
/** Nunca representar lançamento/cura/magia como ataque físico; um golpe de flecha
 * ou de assassino, inclusive habilidades físicas reais, é permitido. */
export function isPhysicalStrike(event:Pick<BattleLog,"kind"|"amount">|undefined,
 fighter:Pick<BattleFighter,"side"|"name"|"class">|undefined,
 effect:AbilityEffect|undefined,castOnly:boolean){
 if(!event||!fighter||castOnly||!(typeof event.amount==="number"&&event.amount>0))return false;
 if(event.kind==="heal")return false;
 if(event.kind==="ability")return !!effect&&physicalAbilities.has(effect);
 if(!["hit","critical","fall"].includes(event.kind))return false;
 if(effect&&!physicalAbilities.has(effect))return false;
 if(fighter.side==="enemy")return !/(espectro|espirito|djinn|bruxa|mago imperial|limo|serafim)/i.test(normalize(fighter.name));
 return !fighter.class||!spellcasters.has(fighter.class);
}
export function physicalStrikePlan(style:AttackStyle,sequence:number,critical:boolean,duration:number):PhysicalStrike{
 const variant=((Math.max(0,Math.floor(sequence))%3) as 0|1|2);
 const ranged=style==="bow"||style==="spear"&&variant===2;
 return {style,variant,critical,duration:Math.max(400,duration),contactAt:.54,
  phaseOffsets:[0,.24,.54,1],ranged};
}
