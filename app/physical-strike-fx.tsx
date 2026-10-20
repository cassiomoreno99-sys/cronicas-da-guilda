import type {CSSProperties} from "react";
import type {PhysicalStrike} from "@/lib/combat-physical-strikes";
/** Efeitos no palco, disparados pelo evento real; não altera batalha/salvamentos. */
export function PhysicalStrikeFX({attack,style,side}:{attack:PhysicalStrike;style:CSSProperties;side:"hero"|"enemy"}){
 return <div className="guild2d-physical-strike" style={style} data-style={attack.style}
  data-variant={attack.variant} data-critical={attack.critical} data-facing={side}
  data-ranged={attack.ranged} aria-hidden="true" role="presentation">
   <span className="guild2d-physical-windup"><i/><i/></span>
   {attack.ranged&&<span className="guild2d-physical-arrow">
     <i className="shaft"/><i className="tip"/><i className="feather"/><i className="tail"/>
   </span>}
   <span className="guild2d-physical-contact">
     <i className="guild2d-physical-swing main"/><i className="guild2d-physical-swing echo"/>
     <i className="guild2d-physical-stab"/>
     <i className="guild2d-physical-rend a"/><i className="guild2d-physical-rend b"/><i className="guild2d-physical-rend c"/>
     <i className="guild2d-physical-shock"/><i className="guild2d-physical-core"/>
     {Array.from({length:attack.critical?9:6},(_,n)=><i key={n} className="guild2d-physical-spark"
      style={{"--ray":n,"--count":attack.critical?9:6} as CSSProperties}/>)}
   </span>
 </div>;
}
