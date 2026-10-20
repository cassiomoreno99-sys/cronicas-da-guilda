import type {AbilitySpec,BattleLog} from "./game.ts";

/** Interpreta o registro real, sem executar ações ou alterar o estado da campanha.
 * Uma ação com defesa/escudo também produz um evento visual, mesmo com dano zero.
 * A identidade do evento é o índice persistido no log — não o número da rodada.
 */
export type VisualCue={entry:BattleLog;index:number;castOnly:boolean};
const damaging=new Set<BattleLog["kind"]>(["hit","critical","heal","fall","ability"]);
export function lastVisualCue(log:readonly BattleLog[]):VisualCue|undefined{
 for(let index=log.length-1;index>=0;index--){
  const entry=log[index];
  if(!entry.actorId)continue;
  if(damaging.has(entry.kind)&&entry.targetId&&typeof entry.amount==="number"&&entry.amount>0){
   return {entry,index,castOnly:false};
  }
  if(entry.kind==="ability"&&/ usa .+\.$/.test(entry.text)){
   return {entry,index,castOnly:true};
  }
 }
 return undefined;
}
const normalize=(name:string)=>name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
export type VisualSkill={ability:AbilitySpec;targets:string[];castIndex:number};
/** Identifica o feitiço efetivamente usado, não a habilidade apenas selecionada na barra. */
export function skillForCue(log:readonly BattleLog[],cue:VisualCue|undefined,abilities:readonly AbilitySpec[]):VisualSkill|undefined{
 if(!cue||!abilities.length||!cue.entry.actorId||cue.index>=log.length||log[cue.index]!==cue.entry)return undefined;
 const hit=cue.entry;
 // Acerto letal tem kind="fall", mas ainda foi uma magia real se o log
 // começa com o nome da habilidade executada neste turno.
 if(!cue.castOnly&&hit.kind!=="ability"&&hit.kind!=="heal"&&
   !(hit.kind==="fall"&&abilities.some(a=>normalize(hit.text).startsWith(normalize(a.name)+" "))))return undefined;
 let castIndex=-1;
 let ability:AbilitySpec|undefined;
 // Dano real registra o nome da habilidade no começo da frase.
 for(const candidate of abilities){
  if(normalize(hit.text).startsWith(normalize(candidate.name)+" ")){
   ability=candidate;break;
  }
 }
 // Para cura por drenagem ou encantamentos sem dano, localizar o lançamento
 // imediatamente anterior do MESMO combatente e na MESMA rodada.
 for(let i=cue.index;i>=Math.max(0,cue.index-18);i--){
  const item=log[i];
  if(item.round!==hit.round)break;
  if(item.actorId!==hit.actorId){
   if(i!==cue.index&&damaging.has(item.kind)&&item.amount)return undefined;
   continue;
  }
  const found=abilities.find(a=>normalize(item.text)===normalize(hit.actorId||"")+" usa "+normalize(a.name)+"."
    ||normalize(item.text).endsWith(" usa "+normalize(a.name)+"."));
  if(item.kind==="ability"&&!item.amount&&found){castIndex=i;ability??=found;break;}
  if(i!==cue.index&&item.amount&&damaging.has(item.kind)){
   // Uma magia de área produz vários acertos consecutivos no mesmo turno:
   // atravessá-los até a linha original "usa habilidade".
   const sameSkill=!!ability&&normalize(item.text).startsWith(normalize(ability.name)+" ");
   if(!sameSkill)break;
  }
 }
 if(!ability)return undefined;
 if(castIndex<0)castIndex=cue.index;
 const targets:string[]=[];
 for(let i=castIndex;i<=cue.index;i++){
  const entry=log[i];
  if(entry.actorId===hit.actorId&&entry.targetId&&entry.amount&&entry.amount>0&&!targets.includes(entry.targetId))targets.push(entry.targetId);
 }
 if(!targets.length&&hit.targetId)targets.push(hit.targetId);
 return {ability,targets,castIndex};
}
