import type {CSSProperties} from "react";
import type {MotionSchool} from "@/lib/combat-choreography";

/** Iluminação e partículas visuais — nenhum evento altera pontos de vida ou turno. */
export function ArenaVfx({school,kind,critical,style}:{
 school:MotionSchool;kind:string;critical:boolean;style:CSSProperties;
}){
 const healing=kind==="heal";
 const ranged=["arcane","holy","song","nature","arrow"].includes(school);
 const particleCount=critical?9:6;
 return <div className="guild2d-vfx" style={style}
  data-school={school} data-critical={critical} data-heal={healing} data-ranged={ranged}
  role="presentation" aria-hidden="true">
   <span className="guild2d-vfx-origin">
    <i className="guild2d-vfx-sigil"/>
    <i className="guild2d-vfx-wind"/>
    <i className="guild2d-vfx-focus"/>
   </span>
   {ranged&&<span className="guild2d-vfx-flight">
     <i className="guild2d-vfx-comet"/>
     <i className="guild2d-vfx-tail"/>
   </span>}
   <span className="guild2d-vfx-impact">
    <i className="guild2d-vfx-core"/>
    <i className="guild2d-vfx-wave"/>
    <i className="guild2d-vfx-slash"/>
    {Array.from({length:particleCount},(_,n)=>
      <i key={n} className="guild2d-vfx-particle" style={{"--ray":n,"--particle-count":particleCount} as CSSProperties}/>)}
   </span>
 </div>;
}
