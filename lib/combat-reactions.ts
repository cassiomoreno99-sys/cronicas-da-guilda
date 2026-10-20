import type {BattleFighter,BattleLog,CombatStatus,StatusKind} from "./game.ts";

/** BLOCO 11 — reações visuais derivadas EXCLUSIVAMENTE do combate real.
 * Nunca altera dano, duração dos status, formação, itens ou salvamentos.
 */
export type ReactionKind="hurt"|"critical"|"fall"|"heal"|"poison"|"bleed"|"shield"|"dodge"|"stun"|"resist"|"regen";
export type ReactionVisual={kind:ReactionKind;targetId:string;amount:number;critical:boolean;lethal:boolean};
export type StatusVisual={kind:StatusKind;label:string;tone:"danger"|"heal"|"guard"|"control"|"buff";rounds:number;strength:number};
const normalize=(x:string)=>x.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const names:Record<StatusKind,[string,StatusVisual["tone"]]>={
 bleed:["Sangramento","danger"],poison:["Envenenado","danger"],stun:["Atordoado","control"],
 shield:["Escudo","guard"],regen:["Regeneração","heal"],taunt:["Provocação","control"],
 inspired:["Inspirado","buff"],vulnerable:["Vulnerável","danger"],ward:["Proteção mágica","guard"],
 lastStand:["Última resistência","guard"],dodge:["Esquiva","guard"],riposte:["Contra-ataque","buff"],
 might:["Força","buff"],critBlessing:["Bênção crítica","buff"],slow:["Lentidão","control"],evasion:["Evasão","guard"]
};
const order:Record<StatusVisual["tone"],number>={danger:0,control:1,guard:2,heal:3,buff:4};
export function statusVisuals(statuses:readonly CombatStatus[]|undefined,max=4):StatusVisual[]{
 const unique=new Set<StatusKind>();
 return (statuses||[]).filter(x=>x.rounds>0&&!(x.kind==="shield"&&(x.amount||0)<=0))
 .filter(x=>{if(unique.has(x.kind))return false;unique.add(x.kind);return true;})
 .map(s=>({kind:s.kind,label:names[s.kind][0],tone:names[s.kind][1],rounds:s.rounds,strength:Math.max(0,s.amount||0)}))
 .sort((a,b)=>order[a.tone]-order[b.tone]||a.kind.localeCompare(b.kind))
 .slice(0,Math.max(0,Math.min(4,Math.trunc(max))));
}
/** Reações a dano, cura e ticks de veneno/sangramento.
 * Um tick tem kind="status" e texto próprio; nunca rotular veneno como golpe comum.
 */
export function reactionForEvent(event:Pick<BattleLog,"kind"|"text"|"amount"|"targetId"|"targetHp">|undefined,
 target:Pick<BattleFighter,"id"|"hp"|"maxHp">|undefined):ReactionVisual|undefined{
 if(!event?.targetId||!target||event.targetId!==target.id)return undefined;
 const amount=Math.max(0,Number(event.amount)||0);
 const t=normalize(event.text||"");
 let kind:ReactionKind|undefined;
 if(event.kind==="fall"||event.targetHp===0&&event.kind!=="status")kind="fall";
 else if(event.kind==="critical"&&amount>0)kind="critical";
 else if(event.kind==="heal"||event.kind==="ability"&&/ (cura|restaura|renova|recupera) /.test(t))kind="heal";
 else if(event.kind==="status"){
  if(/(veneno|envenen)/.test(t))kind="poison";
  else if(/sangramento/.test(t))kind="bleed";
  else if(/(regenerac|recupera)/.test(t))kind="regen";
  else if(/(absorveu|escudo|protecao|barreira)/.test(t))kind="shield";
  else if(/(esquiv|evitou)/.test(t))kind="dodge";
  else if(/(atordoado|atordoamento)/.test(t))kind="stun";
  else if(/(resiste|juramento)/.test(t))kind="resist";
 }else if(amount>0&&["hit","ability"].includes(event.kind))kind="hurt";
 if(!kind)return undefined;
 if(kind!=="fall"&&kind!=="stun"&&kind!=="dodge"&&kind!=="resist"&&amount<=0)return undefined;
 return {kind,targetId:target.id,amount,critical:kind==="critical",lethal:kind==="fall"};
}
export function reactionFrames(reaction:ReactionVisual,direction:1|-1,size:{width:number;height:number}):Keyframe[]{
 const width=Math.max(1,size.width),height=Math.max(1,size.height);
 const power=Math.min(1.6,Math.max(.6,reaction.amount/Math.max(width,70)*2));
 const dx=Math.min(width*.13,22)*power*direction;
 const dy=Math.min(height*.09,18)*power;
 const frame=(offset:number,x:number,y:number,rot:number,scale:number,light=1):Keyframe=>({
  offset,transform:`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`,
  filter:`brightness(${light.toFixed(2)})`
 });
 switch(reaction.kind){
  case "heal":case "regen":return [frame(0,0,0,0,1),frame(.4,0,-Math.min(11,dy),-1,1.045,1.36),
    frame(.7,0,-Math.min(7,dy),1,1.035,1.26),frame(1,0,0,0,1)];
  case "shield":case "resist":return [frame(0,0,0,0,1),frame(.22,-dx*.15,0,-3,1.01,1.2),
    frame(.52,-dx*.25,0,3,.99,1.28),frame(1,0,0,0,1)];
  case "dodge":return [frame(0,0,0,0,1),frame(.25,-dx*1.3,-dy*.35,-7,.98),
    frame(.58,-dx*1.5,-dy*.4,-9,.98),frame(1,0,0,0,1)];
  case "stun":return [frame(0,0,0,0,1),frame(.3,-3,0,-4,.99,1.16),frame(.55,4,0,4,.99,1.16),frame(1,0,0,0,1)];
  case "poison":case "bleed":return [frame(0,0,0,0,1),frame(.35,dx*.2,dy*.2,3,.97,1.12),
    frame(.65,-dx*.2,0,-3,1,1.10),frame(1,0,0,0,1)];
  case "fall":return [frame(0,0,0,0,1),frame(.22,dx*.2,-dy*.1,8,1.02,1.23),
    frame(.55,dx*.5,dy*.34,22,.95,1.06),frame(.88,dx*.65,dy,37,.83,.8),frame(1,dx*.65,dy,39,.82,.75)];
  case "critical":return [frame(0,0,0,0,1),frame(.24,dx*1.15,-dy*.3,9,.96,1.65),
    frame(.5,dx*1.34,dy*.1,13,.93,1.3),frame(.7,-dx*.24,0,-4,1.01,1.2),frame(1,0,0,0,1)];
  default:return [frame(0,0,0,0,1),frame(.3,dx*.75,-dy*.14,6,.97,1.36),
    frame(.53,dx,dy*.1,7,.95,1.2),frame(.78,-dx*.17,0,-2,1.01,1.08),frame(1,0,0,0,1)];
 }
}
/** Textos de status sem ator (absorção e esquiva) precisam de uma reação
 * breve mesmo quando o último golpe principal pertence a outro evento.
 */
export function lastStatusReaction(log:readonly BattleLog[],fighters:readonly BattleFighter[]){
 for(let i=log.length-1;i>=Math.max(0,log.length-4);i--){
  const entry=log[i];
  if(entry.kind!=="status")continue;
  const target=fighters.find(f=>f.id===entry.targetId);
  const reaction=reactionForEvent(entry,target);
  if(reaction)return {index:i,reaction};
 }
 return undefined;
}
