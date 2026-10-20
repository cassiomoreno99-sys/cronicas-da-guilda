import type {CSSProperties} from "react";
import type {SpellPlan} from "@/lib/combat-spell-plan.ts";

/** Efeitos puramente visuais. Não altera ações, dano, escudos ou status.
 * Conjuração → movimento → contato 54% → dissipação.
 */
export function AdvancedSpellFX({plan,style,targets}:{plan:SpellPlan;style:CSSProperties;targets?:ReadonlyArray<{x:number;y:number}>}){
 const bursts=targets&&targets.length>1?targets:[];
 const projectile=["projectile","drain","lightning"].includes(plan.motion);
 const particleCount=plan.particleCount;
 return <div className="guild2d-advanced-spell" style={style} aria-hidden="true" role="presentation"
  data-family={plan.family} data-motion={plan.motion} data-effect={plan.effect}
  data-heal={plan.healing} data-protect={plan.protecting} data-multi={plan.multiTarget}>
   <span className="guild2d-magic-origin">
    <i className="guild2d-magic-outer-circle"/>
    <i className="guild2d-magic-inner-circle"/>
    <i className="guild2d-magic-glyph">
     <b/><b/><b/><b/>
    </i>
    <i className="guild2d-magic-charging"/>
   </span>
   {projectile&&<span className="guild2d-magic-projectile">
    <i className="guild2d-magic-bolt"/>
    <i className="guild2d-magic-bolt-ring"/>
    <i className="guild2d-magic-bolt-tail"/>
   </span>}
   <span className="guild2d-magic-impact">
    <i className="guild2d-magic-core"/>
    <i className="guild2d-magic-ripple first"/>
    <i className="guild2d-magic-ripple second"/>
    <i className="guild2d-magic-barrier"/>
    <i className="guild2d-magic-burst"/>
    <i className="guild2d-magic-lightning a"/>
    <i className="guild2d-magic-lightning b"/>
    <i className="guild2d-magic-lightning c"/>
    <i className="guild2d-magic-helix a"/>
    <i className="guild2d-magic-helix b"/>
    {Array.from({length:particleCount},(_,n)=><i key={n} className="guild2d-magic-particle"
     style={{"--magic-ray":n,"--magic-count":particleCount} as CSSProperties}/>)}
   </span>
   {bursts.map((p,i)=><span className="guild2d-magic-area" key={i} style={{
    left:p.x+"%",top:p.y+"%",animationDelay:i*30+"ms"
   }}/>)}
 </div>;
}
