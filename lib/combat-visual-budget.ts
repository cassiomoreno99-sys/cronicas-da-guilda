/** BLOCO 15A — orçamento visual adaptativo, SEM alterar o motor do RPG.
 * Decisão pura e determinística. Não persiste no save, não baixa qualidade
 * das artes originais nem interfere na coreografia de nove keyframes.
 */
export type VisualQuality="full"|"balanced"|"economy"|"static";
export type DeviceHints={
 width:number;height:number;fighters:number;coarsePointer?:boolean;
 memoryGB?:number;cores?:number;saveData?:boolean;reducedMotion?:boolean;
};
export type VisualBudget={
 quality:VisualQuality;particles:number;statusCount:number;areaMarks:number;
 ambient:boolean;rig:boolean;cameraShake:boolean;
};
const finite=(n:number|undefined,fallback:number)=>Number.isFinite(n)?Number(n):fallback;
export function qualityForDevice(h:DeviceHints):VisualQuality{
 if(h.reducedMotion)return "static";
 if(h.saveData)return "economy";
 const width=Math.max(1,finite(h.width,1200));
 const fighters=Math.max(0,Math.min(8,Math.trunc(finite(h.fighters,8))));
 const memory=finite(h.memoryGB,8),cores=finite(h.cores,8);
 if(memory<=2||cores<=2)return "economy";
 if(width<=420&&(fighters>=6||memory<=4||cores<=4))return "economy";
 if(width<=600||h.coarsePointer||fighters>=8&&width<=850)return "balanced";
 return "full";
}
export function visualBudget(quality:VisualQuality):VisualBudget{
 switch(quality){
 case "full":return {quality,particles:12,statusCount:4,areaMarks:4,ambient:true,rig:true,cameraShake:true};
 case "balanced":return {quality,particles:6,statusCount:2,areaMarks:4,ambient:true,rig:true,cameraShake:false};
 case "economy":return {quality,particles:3,statusCount:1,areaMarks:3,ambient:false,rig:false,cameraShake:false};
 case "static":return {quality,particles:0,statusCount:1,areaMarks:0,ambient:false,rig:false,cameraShake:false};
 }
}
/** A configuração manual não substitui preferência de acessibilidade. */
export function resolvedVisualBudget(h:DeviceHints,override:VisualQuality|"auto"="auto"):VisualBudget{
 if(h.reducedMotion)return visualBudget("static");
 return visualBudget(override==="auto"?qualityForDevice(h):override);
}
export function particleBudget(planned:number,budget:VisualBudget):number{
 const count=Math.max(0,Math.floor(finite(planned,0)));
 return Math.min(count,budget.particles);
}
export function areaBudget<T>(targets:readonly T[],budget:VisualBudget):T[]{
 return targets.slice(0,budget.areaMarks);
}
