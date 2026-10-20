import type {CSSProperties} from "react";
import type {MotionSchool} from "@/lib/combat-choreography";
import type {AbilityEffect} from "@/lib/game";

/** Iluminação e partículas visuais — nenhum evento altera pontos de vida ou turno. */
export function ArenaVfx({school,kind,effect,targets,critical,style,particleCount:budgetCount}:{
 school:MotionSchool;kind:string;effect:AbilityEffect|"basic";targets?:Array<{x:number;y:number}>;
 critical:boolean;style:CSSProperties;particleCount?:number;
}){
 const healing=kind==="heal"||["restore","renew","lifebloom","sanctuary","aegis"].includes(effect);
 const protecting=["fortress","challenge","aegis","sanctuary","anthem"].includes(effect);
 const burst=["storm","fireball","supreme"].includes(effect);
 const ranged=["arcane","holy","song","nature","arrow"].includes(school);
 const particleCount=Math.max(0,Math.min(critical?9:6,Math.floor(budgetCount??(critical?9:6))));
 return <div className="guild2d-vfx" style={style}
  data-school={school} data-critical={critical} data-heal={healing} data-ranged={ranged} data-effect={effect} data-protect={protecting} data-burst={burst}
  role="presentation" aria-hidden="true">
   <span className="guild2d-vfx-origin">
    <i className="guild2d-vfx-sigil"/>
    <i className="guild2d-vfx-wind"/>
    <i className="guild2d-vfx-focus"/>
    {protecting&&<i className="guild2d-vfx-ward"/>}
   </span>
   {ranged&&<span className="guild2d-vfx-flight">
     <i className="guild2d-vfx-comet"/>
     <i className="guild2d-vfx-tail"/>
   </span>}
   {burst&&<span className="guild2d-vfx-arc" aria-hidden="true"><i/><i/><i/></span>}
   <span className="guild2d-vfx-impact">
    <i className="guild2d-vfx-core"/>
    <i className="guild2d-vfx-wave"/>
    <i className="guild2d-vfx-slash"/>
    {Array.from({length:particleCount},(_,n)=>
      <i key={n} className="guild2d-vfx-particle" style={{"--ray":n,"--particle-count":Math.max(1,particleCount)} as CSSProperties}/>)}
   </span>
   {targets&&targets.length>1&&targets.map((point,i)=><span key={i} className="guild2d-vfx-aoe" style={{left:point.x+"%",top:point.y+"%",animationDelay:i*30+"ms"}}/>)}
 </div>;
}
