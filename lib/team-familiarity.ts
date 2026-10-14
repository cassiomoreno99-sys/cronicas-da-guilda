/** Entrosamento: apenas equipes idênticas com 3 ou 4 heróis progridem juntas.
 * Uma expedição concluída = um ponto. Sem bônus de graça na primeira missão. */
export type FamiliarityBonus={expeditions:number;level:number;next:number;critical:number;defense:number;hp:number;damage:number;healing:number};
export function teamKey(ids:readonly string[]):string {
 const list=[...new Set(ids)].sort();
 return list.length>=3&&list.length<=4&&list.length===ids.length?list.join("|"):"";
}
export function familiarityBonus(progress:Record<string,number>|undefined,ids:readonly string[]):FamiliarityBonus{
 const key=teamKey(ids),expeditions=key?Math.max(0,Math.floor(progress?.[key]||0)):0;
 const level=Math.min(5,Math.floor(expeditions/3));
 return {expeditions,level,next:level>=5?0:(level+1)*3-expeditions,
  critical:level*.005,defense:level*.012,hp:level*.012,damage:level*.012,healing:level*.015};
}
export function registerTeamExpedition(progress:Record<string,number>,ids:readonly string[]):void{
 const key=teamKey(ids);if(!key)return;
 progress[key]=Math.min(300,Math.max(0,progress[key]||0)+1);
}
