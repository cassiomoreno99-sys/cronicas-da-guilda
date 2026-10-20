import type {CSSProperties} from "react";
import type {SpectaclePlan} from "@/lib/combat-spectacle-plan.ts";
/** VFX exclusivo do evento real; jamais gera golpes nem modifica PV. */
export function SpectacleFX({plan,style,targets}:{plan:SpectaclePlan;style:CSSProperties;targets?:readonly {x:number;y:number}[]}){
 return <div className="guild2d-spectacle" role="presentation" aria-hidden="true" style={style}
  data-kind={plan.kind} data-school={plan.school} data-variant={plan.variant} data-book={plan.book||""}>
  <span className="guild2d-spectacle-origin"><i className="guild2d-spectacle-sigil"/><i className="guild2d-spectacle-charge"/></span>
  <span className="guild2d-spectacle-impact">
   <i className="guild2d-spectacle-sweep"/><i className="guild2d-spectacle-crush"/>
   <i className="guild2d-spectacle-shield"/><i className="guild2d-spectacle-rift"/>
   <i className="guild2d-spectacle-nova"/><i className="guild2d-spectacle-drain"/>
   {Array.from({length:plan.points},(_,i)=><i key={i} className="guild2d-spectacle-shard"
    style={{"--n":i,"--count":plan.points} as CSSProperties}/>)}
  </span>
  {plan.hitsAll&&(targets||[]).slice(0,4).map((p,i)=><span key={i} className="guild2d-spectacle-area"
   style={{left:p.x+"%",top:p.y+"%",animationDelay:i*35+"ms"}}/>)}
 </div>;
}
export function BossPresence({pressure}:{pressure:"stable"|"strained"|"critical"}){
 return <span className="guild2d-boss-presence" data-pressure={pressure} aria-hidden="true">
  <i className="guild2d-boss-halo"/><i className="guild2d-boss-crown"/>
 </span>;
}
