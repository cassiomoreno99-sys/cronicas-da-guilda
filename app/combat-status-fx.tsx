import type {CSSProperties} from "react";
import type {ReactionVisual,StatusVisual} from "@/lib/combat-reactions.ts";

/** Os estados persistentes são derivados de fighter.statuses.
 * Aria-hidden: o HUD já apresenta os nomes e duração dos estados.
 */
export function StatusAura({statuses}:{statuses:readonly StatusVisual[]}){
 if(!statuses.length)return null;
 return <span className="guild2d-status-aura" aria-hidden="true" data-count={statuses.length}>
  {statuses.map((st,i)=><span className="guild2d-status-signal" key={st.kind}
    data-status={st.kind} data-tone={st.tone}
    style={{"--status-index":i} as CSSProperties}>
    <i className="guild2d-status-loop"/><i className="guild2d-status-core"/>
   </span>)}
 </span>;
}
/** Acerto/reação não substitui a camada do ataque; é um breve feedback no alvo. */
export function ReactionFlash({reaction,variant="impact"}:{
 reaction:ReactionVisual;variant?:"impact"|"status";
}){
 return <span className="guild2d-reaction-flash" aria-hidden="true" data-reaction={reaction.kind}
  data-feedback={variant} data-lethal={reaction.lethal}>
  <i className="guild2d-reaction-center"/>
  <i className="guild2d-reaction-wave"/>
  <i className="guild2d-reaction-symbol"/>
  <i className="guild2d-reaction-particle a"/>
  <i className="guild2d-reaction-particle b"/>
  <i className="guild2d-reaction-particle c"/>
 </span>;
}
