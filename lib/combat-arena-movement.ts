import type {MotionSchool} from "./combat-choreography.ts";

/**
 * BLOCO 08 — trajetória cinematográfica. Coordenadas em pixels do palco.
 * Não altera as posições oficiais: transforma APENAS o sprite em cada ação.
 * Obstáculos representam unidades visíveis. Prefere aproximação conservadora
 * se uma trajetória livre não couber na formação 4×4.
 */
export type ArenaPoint={x:number;y:number};
export type ArenaSize={width:number;height:number};
export type ArenaObstacle=ArenaPoint&ArenaSize;
export type MoveKind="charge"|"pounce"|"sidestep"|"hold"|"cast";
export type MovementInput={
 from:ArenaPoint;to:ArenaPoint;stage:ArenaSize;actor:ArenaSize;target:ArenaSize;
 obstacles?:ArenaObstacle[];school:MotionSchool;kind:string;critical:boolean;
};
export type MovementPlan={
 kind:MoveKind;dx:number;dy:number;clearance:number;advance:number;lift:number;
 actorFrames:Keyframe[];shadowFrames:Keyframe[];
};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const distance=(a:ArenaPoint,b:ArenaPoint)=>Math.hypot(b.x-a.x,b.y-a.y);
const distanceToSegment=(p:ArenaPoint,a:ArenaPoint,b:ArenaPoint)=>{
 const vx=b.x-a.x,vy=b.y-a.y,length=vx*vx+vy*vy;
 if(length<.001)return distance(p,a);
 const t=clamp(((p.x-a.x)*vx+(p.y-a.y)*vy)/length,0,1);
 return distance(p,{x:a.x+t*vx,y:a.y+t*vy});
};
const spriteFrame=(offset:number,x:number,y:number,rotation:number,scale:number):Keyframe=>({
 offset,transform:`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`
});
const shadowFrame=(offset:number,x:number,y:number,scale:number,opacity:number):Keyframe=>({
 offset,transform:`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${scale.toFixed(3)})`,
 opacity:Number(opacity.toFixed(2))
});
export function arenaMovement(input:MovementInput):MovementPlan{
 const {from,to,stage,actor,target,school,critical}=input;
 const w=Math.max(stage.width,1),h=Math.max(stage.height,1);
 const delta={x:to.x-from.x,y:to.y-from.y};
 const dist=distance(from,to);
 const ux=dist>1?delta.x/dist:1,uy=dist>1?delta.y/dist:0;
 const ranged=["arrow","arcane","holy","song","nature"].includes(school);
 const cast=input.kind==="cast"||input.kind==="heal";
 const hold=cast&&distance(from,to)<Math.max(28,actor.width*.65);
 const kind:MoveKind=hold?"hold":ranged?"cast":school==="claw"?"pounce":school==="shadow"?"sidestep":"charge";
 // Margem mínima entre os contornos dos sprites, e não só os centros.
 const clearance=clamp((actor.width+target.width)*.47+8,37,Math.min(w*.31,180));
 const limit=clamp(w*.48,36,235);
 let advance=kind==="charge"||kind==="pounce"||kind==="sidestep"
  ?clamp(dist-clearance,0,limit):0;
 // Recua ligeiramente sem se aproximar de outro combatente.
 const backstep=kind==="cast"?clamp(w*.012,3,11):kind==="hold"?0:0;
 const lateral=kind==="sidestep"?clamp(h*.024,5,14):0;
 const near=(amount:number):ArenaPoint=>({x:from.x+ux*amount,y:from.y+uy*amount});
 const blockers=(input.obstacles||[]).filter(o=>distance(o,from)>Math.min(actor.width,actor.height)*.42);
 // Se o corredor estiver ocupado, diminuir a investida em vez de atravessar aliados.
 // A verificação usa caminho em 3 segmentos, incluindo a esquiva lateral.
 const safe=(amount:number,arc:number)=>{
  const end=near(amount);
  const perpendicular={x:-uy,y:ux};
  const middle={x:from.x+ux*amount*.50+perpendicular.x*arc,y:from.y+uy*amount*.50+perpendicular.y*arc};
  const border=actor.width*.26+5;
  if(end.x<border||end.x>w-border||end.y<h*.07||end.y>h*.93)return false;
  return blockers.every(o=>{
   const radius=clamp((actor.width+o.width)*.285,19,65);
   // Ignorar a colisão já existente no ponto inicial da formação.
   return distanceToSegment(o,from,middle)>=radius||distance(o,from)<radius+10
    ?distanceToSegment(o,middle,end)>=radius||distance(o,from)<radius+10
    :false;
  });
 };
 let dodge=0;
 if(advance>0){
  const original=advance;
  let found=false;
  // Preferir o percurso mais longo livre. Desviar suavemente só se necessário.
  for(const fraction of [1,.85,.7,.55,.4,.25,.10,0]){
   const length=original*fraction;
   for(const bend of [0,-1,1,-2,2]){
    const arc=bend*lateral;
    if(safe(length,arc)){advance=length;dodge=arc;found=true;break;}
   }
   if(found)break;
  }
  if(!found)advance=0;
 }
 const direction=Math.sign(delta.x)||1;
 const dx=kind==="cast"?-ux*backstep:ux*advance;
 const dy=kind==="cast"?-uy*backstep:uy*advance;
 const lift=kind==="pounce"?clamp(advance*.25,7,32)
  :kind==="sidestep"?clamp(advance*.12,3,18)
  :kind==="charge"?clamp(advance*.065,2,10):kind==="cast"?5:0;
 const rotate=kind==="pounce"?9:kind==="sidestep"?-12:kind==="charge"?6:2;
 const scale=critical?1.09:1.045;
 const pre=kind==="cast"?3:clamp(advance*.10,2,13);
 const perpX=-uy,perpY=ux;
 const point=(t:number,arc:number,height:number)=>({
  x:dx*t+perpX*arc-direction*pre*(t===0?1:0),
  y:dy*t+perpY*arc-height
 });
 const wind=point(0,0,0);
 const launch=point(.14,dodge*.17,lift*.24);
 const rush=point(.80,dodge*.82,lift);
 const contact=point(1,0,lift*.28);
 const retreat=point(.38,dodge*.18,lift*.13);
 const settle=point(.06,0,2);
 const actorFrames=[
  spriteFrame(0,0,0,0,1),
  spriteFrame(.10,wind.x,wind.y+2,-direction*3,.99),
  spriteFrame(.22,launch.x,launch.y,-direction*rotate,1.012),
  spriteFrame(.45,rush.x,rush.y,direction*rotate*.3,1.025),
  spriteFrame(.54,contact.x,contact.y,direction*rotate,scale),
  spriteFrame(.61,contact.x,contact.y,direction*rotate,scale),// pausa de impacto
  spriteFrame(.77,retreat.x,retreat.y,-direction*rotate*.22,1.015),
  spriteFrame(.92,settle.x,settle.y,0,1),
  spriteFrame(1,0,0,0,1)
 ];
 const shadowFrames=[
  shadowFrame(0,0,0,1,.27),
  shadowFrame(.10,wind.x,0,.96,.30),
  shadowFrame(.22,launch.x,launch.y+lift*.24,.96,.30),
  shadowFrame(.45,rush.x,rush.y+lift,.81,.22),
  shadowFrame(.54,contact.x,contact.y+lift*.28,1.04,.34),
  shadowFrame(.61,contact.x,contact.y+lift*.28,1.04,.34),
  shadowFrame(.77,retreat.x,retreat.y+lift*.13,.93,.28),
  shadowFrame(.92,settle.x,settle.y+2,1,.28),
  shadowFrame(1,0,0,1,.27)
 ];
 return {kind,dx,dy,clearance,advance,lift,actorFrames,shadowFrames};
}
