import {useEffect,useMemo,useRef,useState,type CSSProperties} from "react";
import {ArrowLeft,Swords,Shield,Sparkles,ChevronsRight,X,Zap,Check} from "lucide-react";
import { statusEmPortugues, textoEmPortugues } from "../lib/texto-portugues";
import {availableAbilities,abilityCooldownRemaining,heroRace,TACTICS,ITEMS,combatReport,type Campaign,type Expedition,type Action,type BattleFighter,type BattleLog,type Hero} from "@/lib/game";
import {CATALOG_BY_ID} from "@/lib/catalog-test";
import {battleSource,portraitSource} from "@/lib/portraits";
import {enemyArtSource,fullEnemyArtSource} from "@/lib/enemy-art";
import {choreographyPlan,type MotionSchool} from "@/lib/combat-choreography";
import {arenaMovement} from "@/lib/combat-arena-movement";
import {lastVisualCue,skillForCue} from "@/lib/combat-visual-cues";
import {ArenaVfx} from "./arena-vfx";
import {rigEligible,chooseRigPose} from "@/lib/combat-body-rig";
import {BodyRig,rigImageSafe} from "./body-rig";
import {isPhysicalStrike,physicalStyle,physicalStrikePlan} from "@/lib/combat-physical-strikes";
import {PhysicalStrikeFX} from "./physical-strike-fx";
import "./arena-2d.css";

/** 2D da campanha real: HP, ações e vitória são exclusivamente do motor da expedição. */
/** Posições aprovadas: quatro heróis à esquerda, quatro inimigos à direita. */
/** Profundidade para quatro personagens de cada lado, sem cortes nas laterais.
 * Coordenadas espelhadas preservam a identidade do cenário aprovado. */
const HERO_POSITIONS=[[19,36],[35,51],[14,63],[34,69]] as const;
// Inimigos com arte de busto não podem usar o mesmo espaço alto dos heróis.
const ENEMY_POSITIONS=[[85,29],[62,44],[85,59],[62,74]] as const;
const pos=(side:"hero"|"enemy",i:number)=>{
 const [x,y]=(side==="hero"?HERO_POSITIONS:ENEMY_POSITIONS)[Math.max(0,Math.min(i,3))];
 return {x,y};
};
/** Ilustrações de corpo inteiro; para criaturas sem sprite completo,
 * conserva-se a identidade da espécie pelo bestiário existente. */
function combatArt(f:BattleFighter,hero?:Hero):{src:string;full:boolean}{
 if(f.side==="enemy"){
  // Arte de corpo inteiro associada ao nome REAL da missão.
  // O bestiário antigo fica como fallback para as criaturas ainda pendentes.
  const whole=fullEnemyArtSource(f.name);
  return whole?{src:whole,full:true}:{src:enemyArtSource(f.name),full:false};
 }
 const race=hero?heroRace(hero):"human";
 if(!hero)return {src:portraitSource(f.name,f.id,f.class||"warrior",race),full:false};
 const src=battleSource(hero,race);
 // Retratos não são bonecos recortados: aplicar moldura em vez de esticá-los.
 return {src,full:!src.includes("/heroes/portraits/")&&!src.startsWith("data:image/svg+")};
}
const recentHit=(logs:BattleLog[])=>{
 for(let i=logs.length-1;i>=0;i--){
  const x=logs[i];
  if(x.actorId&&x.targetId&&["hit","critical","heal","fall","ability"].includes(x.kind)&&x.amount!==0)return x;
 }
 return undefined;
};
/** Coreografia visual: o motor continua sendo a fonte real de dano e PV.
 * Cada evento tem um movimento próprio, não depende do texto do registro. */
type VisualSchool=MotionSchool;
export function visualSchool(actor:Pick<BattleFighter,"class">|undefined,kind:BattleLog["kind"]):VisualSchool{
 if(kind==="heal")return "holy";
 if(!actor?.class)return "claw";
 switch(actor.class){
 case "warrior":case "monk":return "blade";
 case "paladin":return "steel";
 case "ranger":return "arrow";
 case "rogue":return "shadow";
 case "mage":case "necromancer":return "arcane";
 case "healer":return "holy";
 case "bard":return "song";
 case "druid":return "nature";
 default:return "blade";
 }
}
const isRangedVisual=(school:VisualSchool)=>["arrow","arcane","holy","song","nature"].includes(school);
/** Coreografia uniforme sem alterar o motor da batalha. */
const cinemaDuration=(school:VisualSchool)=>school==="shadow"?650:school==="arcane"?960:school==="steel"?920:school==="arrow"?780:820;
const hpWidth=(hp:number,max:number)=>(max?Math.max(0,Math.min(100,100*hp/max)):0)+"%";
type PosStyle=CSSProperties&{"--x":string;"--y":string;"--dash-x":string;"--dash-y":string};
type VisualPath=CSSProperties&{"--start-x":string;"--start-y":string;"--flight-x":string;"--flight-y":string;"--shot-angle":string;"--flight-distance":string;"--cinema-ms":string};


export default function Arena2D({state,expedition,act,close,returnToTeam,busy}:{
 state:Campaign;expedition:Expedition;act:(action:Action)=>void;close:()=>void;
 returnToTeam:()=>void;busy:boolean;
}){
 const battle=expedition.battle;
 const all=battle.combat?.fighters||battle.fighters||[];
 // A formação salva na expedição é a única fonte de participantes visuais.
 // Rejeita herói extra ou duplicado em registros de combate antigos.
 const sent=new Set(expedition.team.slice(0,4));
 const rendered=new Set<string>();
 const heroes=all.filter(f=>{
   if(f.side!=="hero"||!sent.has(f.id)||rendered.has(f.id))return false;
   rendered.add(f.id);return true;
 });
 const seenEnemies=new Set<string>();
 const enemies=all.filter(f=>{
   if(f.side!=="enemy"||seenEnemies.has(f.id))return false;
   seenEnemies.add(f.id);return true;
 }).slice(0,4);
 const stageRef=useRef<HTMLDivElement>(null);
 const [heroId,setHeroId]=useState("");
 const [enemyId,setEnemyId]=useState("");
 const [allyTargetId,setAllyTargetId]=useState("");
 const [openSkill,setOpenSkill]=useState(false);
 const [tip,setTip]=useState("");
 const [playingEvent,setPlayingEvent]=useState<string|null>(null);
 const active=battle.status==="active"&&!!battle.combat;
 const hero=heroes.find(f=>f.id===heroId&&f.hp>0)||heroes.find(f=>f.hp>0);
 const enemy=enemies.find(f=>f.id===enemyId&&f.hp>0)||enemies.find(f=>f.hp>0);
 const allyTarget=heroes.find(f=>f.id===allyTargetId&&f.hp>0)||[...heroes].filter(f=>f.hp>0).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
 const heroData=state.heroes.find(h=>h.id===hero?.id);
 const abilities=heroData?availableAbilities(heroData):[];
 const queued=battle.combat?.pendingAbilities?.some(p=>p.heroId===hero?.id);
 const focus=active?enemies.find(f=>f.id===battle.combat?.focusTargetId&&f.hp>0):undefined;
 const autoSkills=battle.combat?.autoAbilities!==false;
 const upcoming=battle.combat?.liveOrder?.slice(battle.combat.liveCursor||0).map(id=>all.find(f=>f.id===id)).filter((f):f is BattleFighter=>!!f&&f.hp>0)||[];
 const log=battle.log.slice(-3).reverse();
 const cue=lastVisualCue(battle.log);
 const evt=cue?.entry;
 const performance=useMemo(()=>active?[]:combatReport(battle,state.heroes),[battle,state.heroes,active]);
 const evtIndex=cue?.index??-1;
 const actor=all.find(f=>f.id===evt?.actorId);
 const target=all.find(f=>f.id===(evt?.targetId||evt?.actorId));
 const actorIndex=actor?all.filter(f=>f.side===actor.side).findIndex(f=>f.id===actor.id):0;
 const targetIndex=target?all.filter(f=>f.side===target.side).findIndex(f=>f.id===target.id):0;
 // Rodadas e atualizações de HUD sem ação não repetem um golpe já reproduzido.
 const evtKey=expedition.id+"-"+evtIndex+"-"+(evt?.actorId||"")+"-"+(evt?.targetId||"");
 const lastAnimated=useRef(evtKey);
 const actorHero=state.heroes.find(h=>h.id===actor?.id);
 const cueSkill=skillForCue(battle.log,cue,actorHero?availableAbilities(actorHero):[]);
 const skillEffect=cueSkill?.ability.effect||"basic";
 const school=skillEffect==="venom"?"shadow":skillEffect==="renew"||skillEffect==="lifebloom"?"nature":visualSchool(actor,evt?.kind||"hit");
 const areaTargets:{x:number;y:number}[]=cueSkill&&["all-enemies","all-allies"].includes(cueSkill.ability.target)
  ?cueSkill.targets.flatMap(id=>{const f=all.find(x=>x.id===id);return f?[pos(f.side,all.filter(x=>x.side===f.side).findIndex(x=>x.id===id))]:[];})
  :[];
 // A arma da campanha prevalece sobre o estilo genérico da classe.
 const equipped=actor?.side==="hero"?state.chest.find(item=>item.equippedTo===actor.id&&
  (item.equippedSlot==="weapon"||ITEMS[item.key]?.slot==="weapon")):undefined;
 const catalogueWeapon=equipped?CATALOG_BY_ID[equipped.key]:undefined;
 const physicalAttack=actor&&isPhysicalStrike(evt,actor,cueSkill?.ability.effect,cue?.castOnly||false)
  ?physicalStrikePlan(physicalStyle(actor,catalogueWeapon
    ?{name:catalogueWeapon.nome,subtype:catalogueWeapon.subcategoria}:undefined),
    evtIndex,evt?.kind==="critical",cinemaDuration(school)):undefined;
 const projectile=!!evt&&!!actor&&!!target&&isRangedVisual(school);
 const visualStart=actor?pos(actor.side,actorIndex):undefined;
 const targetPos=target?pos(target.side,targetIndex):undefined;
 const visualPath:VisualPath|undefined=visualStart&&targetPos?{
  "--start-x":visualStart.x+"%","--start-y":visualStart.y+"%",
  "--flight-x":(targetPos.x-visualStart.x)+"cqw",
  "--flight-y":(targetPos.y-visualStart.y)+"cqh",
  "--shot-angle":Math.atan2((targetPos.y-visualStart.y)*(stageRef.current?.clientHeight||590),
                (targetPos.x-visualStart.x)*(stageRef.current?.clientWidth||800))*180/Math.PI+"deg",
   "--flight-distance":Math.hypot((targetPos.x-visualStart.x)*(stageRef.current?.clientWidth||800)/100,(targetPos.y-visualStart.y)*(stageRef.current?.clientHeight||590)/100)+"px",
   "--cinema-ms":(stageRef.current?.closest(".guild-lite-mode")?"520":cinemaDuration(school))+"ms"
 }:undefined;
 // Animações nativas no mesmo nó do sprite: não recarregam as imagens.
 // Ataque, pausa de impacto e reação estão sincronizados com o log real.
 useEffect(()=>{
  const previous=lastAnimated.current;
  lastAnimated.current=evtKey;
  if(previous===evtKey||!actor||!target||!evt||!stageRef.current)return;
  // Só novas ações criam coreografia; carregar um save não repete o golpe antigo.
  setPlayingEvent(evtKey);
  const stage=stageRef.current;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduced){setPlayingEvent(null);return;}
  const light=!!stage.closest(".guild-lite-mode")||document.documentElement.classList.contains("guild-lite-mode");
  const duration=light?520:cinemaDuration(school);
  const allUnits=[...stage.querySelectorAll<HTMLElement>(".guild2d-unit")];
  const actorNode=allUnits.find(node=>node.dataset.fighterId===actor.id)?.querySelector<HTMLElement>(".guild2d-sprite");
  const targetNode=allUnits.find(node=>node.dataset.fighterId===target.id)?.querySelector<HTMLElement>(".guild2d-sprite");
  if(!actorNode||!targetNode){setPlayingEvent(null);return;}
  const from=pos(actor.side,actorIndex),to=pos(target.side,targetIndex);
  const plan=choreographyPlan({
   school,kind:cue?.castOnly?"cast":evt.kind,from,to,width:stage.clientWidth,height:stage.clientHeight,
   duration,critical:evt.kind==="critical"
  });
  const stageSize={width:stage.clientWidth,height:stage.clientHeight};
  const actorSize={width:actorNode.getBoundingClientRect().width,height:actorNode.getBoundingClientRect().height};
  const targetSize={width:targetNode.getBoundingClientRect().width,height:targetNode.getBoundingClientRect().height};
  const movement=arenaMovement({
   from:{x:from.x*stageSize.width/100,y:from.y*stageSize.height/100},
   to:{x:to.x*stageSize.width/100,y:to.y*stageSize.height/100},
   stage:stageSize,actor:actorSize,target:targetSize,
   school,kind:cue?.castOnly?"cast":evt.kind,critical:evt.kind==="critical",
   obstacles:allUnits.filter(node=>node.dataset.fighterId!==actor.id&&node.dataset.fighterId!==target.id&&node.dataset.dead!=="true")
    .map(node=>{
     const rect=node.getBoundingClientRect();
     const box=stage.getBoundingClientRect();
     return {x:rect.left-box.left+rect.width/2,y:rect.top-box.top+rect.height/2,width:rect.width,height:rect.height};
    })
  });
  // O sprite e sua sombra atravessam o MESMO caminho visual.
  // Alvo, vida, formação, turno e salvamento continuam sob controle de lib/game.ts.
  const actorMotion=actorNode.animate(movement.actorFrames,{duration,easing:"linear",fill:"none"});
  const motions:Animation[]=[actorMotion];
  const movingShadow=allUnits.find(node=>node.dataset.fighterId===actor.id)?.querySelector<HTMLElement>(".guild2d-move-shadow");
  if(movingShadow)motions.push(movingShadow.animate(movement.shadowFrames,{duration,easing:"linear",fill:"none"}));
  if(actor.id!==target.id){
   motions.push(targetNode.animate(evt.kind==="heal"?plan.healFrames:plan.targetFrames,{
    delay:plan.impactDelay,duration:plan.recoveryDuration,easing:"cubic-bezier(.2,.7,.18,1)",fill:"none"
   }));
  }
  if(!light&&!cue?.castOnly&&evt.amount!==0){
    const scene=stage.querySelector<HTMLElement>(".guild2d-scene");
    if(scene){
      const critical=evt.kind==="critical";
      const direction=actor.side==="hero"?1:-1;
      motions.push(scene.animate([
        {offset:0,transform:"translate(0,0) scale(1)"},
        {offset:.28,transform:`translate(${direction*(critical?5:2)}px,-1px) scale(${critical?1.013:1.005})`},
        {offset:.55,transform:`translate(${critical?-3:-direction}px,${critical?2:0}px) scale(1.006)`},
        {offset:1,transform:"translate(0,0) scale(1)"}
      ],{delay:duration*.53,duration:critical?220:150,easing:"ease-out"}));
    }
  }
  const cleanup=window.setTimeout(()=>setPlayingEvent(current=>current===evtKey?null:current),duration+180);
   return ()=>{window.clearTimeout(cleanup);motions.forEach(animation=>animation.cancel());};
 },[evtKey]);

 const queuedUnit=(id:string)=>battle.combat?.pendingAbilities?.some(p=>p.heroId===id);
 function unit(f:BattleFighter,i:number){
  const p=pos(f.side,i),acting=playingEvent===evtKey&&actor?.id===f.id&&!!targetPos&&f.hp>0;
  const struck=playingEvent===evtKey&&target?.id===f.id&&!!evt;
  const style:PosStyle={"--x":p.x+"%","--y":p.y+"%","--dash-x":acting&&targetPos?((targetPos.x-p.x)*.7)+"cqw":"0cqw","--dash-y":acting&&targetPos?((targetPos.y-p.y)*.7)+"cqh":"0cqh"};
  const image=combatArt(f,f.side==="hero"?state.heroes.find(h=>h.id===f.id):undefined);
  const rigCandidate=rigEligible(f.side,f.name,image.src,image.full);
  const rigPose=chooseRigPose(acting,struck,f.hp<=0,isRangedVisual(school));
  const selected=f.side==="hero"?hero?.id===f.id:enemy?.id===f.id;
  return <button key={f.id} type="button" className={"guild2d-unit "+(f.side==="hero"?"guild2d-hero":"guild2d-enemy")}
    style={{...style,"--rig-duration":(stageRef.current?.closest(".guild-lite-mode")?520:cinemaDuration(school))+"ms"} as PosStyle} data-dead={f.hp<=0} data-selected={selected} data-focused={focus?.id===f.id} data-full-art={image.full}
    data-class={f.side==="hero"?f.class:"enemy"} data-enemy-bestiary={f.side==="enemy"} data-line={f.position||"back"} data-fighter-id={f.id} data-cinematic-actor={acting} data-move-kind={acting?(projectile?"cast":school==="claw"?"pounce":school==="shadow"?"sidestep":"charge"):"idle"} data-rig-candidate={rigCandidate} data-rig-pose={rigPose}
    data-physical-style={acting?physicalAttack?.style||"none":"none"}
    data-physical-variant={acting?physicalAttack?.variant:-1}
    aria-label={f.name+" — "+f.hp+" de "+f.maxHp+" pontos de vida"}
    onClick={()=>{if(f.hp<=0)return;if(f.side==="hero")setHeroId(f.id);else setEnemyId(f.id);setTip("");}}>
    <span className="guild2d-move-shadow" aria-hidden="true"/>
    <span className="guild2d-sprite" data-school={acting?school:""} data-cinematic-actor={acting} data-cinematic-target={struck}>
      {acting&&!physicalAttack&&<i className={"guild2d-weapon-sweep guild2d-weapon-"+school} aria-hidden="true"/>}
     <img src={image.src} alt="" draggable={false} decoding="async" loading="eager" fetchPriority={f.side==="hero"?"high":"auto"} onLoad={e=>{
      // Um fallback pode carregar normalmente após a falha da arte de corpo inteiro;
      // jamais aplicar o rig da imagem antiga sobre o retrato de recuperação.
      if(rigCandidate&&!e.currentTarget.dataset.fallback)e.currentTarget.closest(".guild2d-unit")?.setAttribute("data-rig-ready",String(rigImageSafe(e.currentTarget)));
     }} onError={e=>{
      const node=e.currentTarget;
      const attempt=Number(node.dataset.fallback||"0");
      if(attempt>=3){node.style.visibility="hidden";return;}
      node.dataset.fallback=String(attempt+1);
      node.src=f.side==="enemy"
       ?(attempt===0?enemyArtSource(f.name):attempt===1?"/enemies/fallback.webp":"/battle/sprite-cultista.webp")
       :(attempt===0?portraitSource(f.name,f.id,f.class||"warrior",state.heroes.find(h=>h.id===f.id)?.race,state.heroes.find(h=>h.id===f.id)?.sex):"/battle/sprite-aric.webp");
      node.closest(".guild2d-unit")?.setAttribute("data-full-art","false");
      node.closest(".guild2d-unit")?.setAttribute("data-rig-ready","false");
      stageRef.current?.querySelectorAll<HTMLElement>(".guild2d-hud").forEach(hud=>{
       if(hud.dataset.fighterId===f.id)hud.dataset.fullArt="false";
      });
     }}/>
     {rigCandidate&&<BodyRig src={image.src}/>}
    </span>
    {acting&&!physicalAttack&&<span key={"trail-"+evtKey} className={"guild2d-action-trail "+((evt?.kind==="ability"||evt?.kind==="heal")?"guild2d-action-magic":"")} aria-hidden="true"/>}
    {struck&&evt?.kind==="critical"&&<span key={"critical-"+evtKey} className="guild2d-critical" aria-hidden="true">CRÍTICO!</span>}
    {struck&&evt?.amount!=null&&evt.amount>0&&<span key={evtKey} className={"guild2d-number "+(evt.kind==="heal"?"guild2d-healed":"")}>{evt.kind==="heal"?"+":"−"}{evt.amount}</span>}
    {struck&&evt?.amount!=null&&evt.amount>0&&<span key={"spark-"+evtKey} className="guild2d-spark" aria-hidden="true"/>}
  </button>;
 }
 function hud(f:BattleFighter,i:number){
  const p=pos(f.side,i);
  const selected=f.side==="hero"?hero?.id===f.id:enemy?.id===f.id;
  return <div key={f.id} className={"guild2d-hud "+(f.side==="hero"?"guild2d-hud-hero":"guild2d-hud-enemy")}
    style={{"--x":p.x+"%","--y":p.y+"%"} as CSSProperties} data-dead={f.hp<=0} data-selected={selected}
    data-class={f.side==="hero"?f.class:"enemy"} data-fighter-id={f.id} data-full-art={combatArt(f).full} data-line={f.position||"back"}>
     <strong>{f.name.split(" ").slice(0,2).join(" ")}</strong>
     <div className="guild2d-meter" role="progressbar" aria-label={"Pontos de vida de "+f.name} aria-valuemin={0} aria-valuemax={f.maxHp} aria-valuenow={Math.max(0,f.hp)}><span style={{width:hpWidth(f.hp,f.maxHp)}}/></div>
     <small>{Math.max(0,f.hp)} / {f.maxHp} PV</small>
     {queuedUnit(f.id)&&f.side==="hero"&&<em>HABILIDADE</em>}
      {focus?.id===f.id&&<em>FOCO</em>}
      {!!f.statuses?.length&&<span className="guild2d-effects">{f.statuses.slice(0,3).map((status,i)=>
        <abbr key={status.kind+"-"+i} title={statusEmPortugues(status.kind)+" · "+status.rounds+" turno(s)"}>{status.kind==="shield"?"🛡️":status.kind==="poison"?"☠️":status.kind==="regen"?"✚":status.kind==="stun"?"✦":"●"}{status.rounds}</abbr>)}</span>}
  </div>;
 }
 function queueAbility(ability:ReturnType<typeof availableAbilities>[number]){
  if(!active||busy||!hero||queued)return;
  const targetId=ability.target==="enemy"?enemy?.id:ability.target==="ally"?allyTarget?.id:undefined;
  if((ability.target==="enemy"||ability.target==="ally")&&!targetId){setTip("Selecione um alvo vivo.");return;}
  act({type:"battle-ability",expeditionId:expedition.id,heroId:hero.id,abilityId:ability.id,...(targetId?{targetId}:{})});
  setTip("Ordem enviada: "+ability.name+" no próximo turno de "+hero.name+".");
  setOpenSkill(false);
 }
 // O alvo e o cooldown são os do motor da campanha, não estados paralelos.
 const slotSymbol=(targetKind:string)=>targetKind==="ally"?"✚":targetKind==="all-allies"?"✦":targetKind==="self"?"◆":targetKind==="all-enemies"?"✺":"⚔";
 const slotTarget=(targetKind:string)=>targetKind==="ally"?"Aliado":targetKind==="all-allies"?"Equipe":targetKind==="self"?"Próprio":targetKind==="all-enemies"?"Área":"Inimigo";
 const label=active?"AO VIVO":battle.won?"VITÓRIA":battle.status==="retreated"?"RETIRADA":"FIM DE BATALHA";
 return <section className="guild2d-shell battle-sheet" aria-label="Combate 2D real de até quatro contra quatro">
  <header className="guild2d-header"><strong>⚔️ Crônicas da Guilda <small>COMBATE 2D · ARENA REALISTA</small></strong><button type="button" onClick={close} aria-label="Fechar arena"><X size={19}/></button></header>
  <div className="guild2d-mission"><h2>{battle.title}</h2><span>Rodada {battle.rounds}{battle.objective?.targetRounds?"/"+battle.objective.targetRounds:""}</span><small>{battle.combat?.mission.location||battle.objective?.name||"Terras da Guilda"}</small></div>
  <div ref={stageRef} className="guild2d-stage" data-cinematic="real-2d" data-vfx="enhanced" role="group" aria-label={heroes.length+" heróis contra "+enemies.length+" inimigos"}>
   <div className="guild2d-scene" aria-hidden="true"/>
   <div className="guild2d-label"><span>HERÓIS · {heroes.length}</span><b>{label}</b><span>{enemies.length} · INIMIGOS</span></div>
   {heroes.map(unit)}{enemies.map(unit)}
   {playingEvent===evtKey&&evt&&visualPath&&!physicalAttack&&<div key={"cinema-"+evtKey} className={"guild2d-cinema guild2d-cinema-"+school} data-school={school} data-direction={actor?.side} data-ranged={projectile} data-cast-only={cue?.castOnly||false} data-ability-effect={skillEffect} aria-hidden="true" style={visualPath}>
       <span className="guild2d-windup"/>
       {!projectile&&!cue?.castOnly&&<span className="guild2d-step-dust"/>}
      {!projectile&&!cue?.castOnly&&school!=="claw"&&evt.kind!=="heal"&&<span className="guild2d-sword-strike"><i className="guild2d-sword-blade"/><i className="guild2d-sword-guard"/></span>}
       {!projectile&&!cue?.castOnly&&evt.kind!=="heal"&&<span className="guild2d-motion-trail"/>}
      {projectile&&<span className="guild2d-projectile"><i/></span>}
      {projectile&&<span className="guild2d-cast-ring"/>}
      {!cue?.castOnly&&school==="claw"&&<span className="guild2d-claw-mark"><i/><i/><i/></span>}
      <span className="guild2d-impact-mark" data-critical={evt.kind==="critical"} data-heal={evt.kind==="heal"}>
        <i className="guild2d-impact-core"/>
        <i className="guild2d-shockwave"/>
        <i className="guild2d-impact-slash"/>
        <i className="guild2d-impact-dust"/>
        <i className="guild2d-impact-streak a"/>
        <i className="guild2d-impact-streak b"/>
        <i className="guild2d-impact-streak c"/>
      </span>
      {evt.kind==="critical"&&<span className="guild2d-cinema-flash"/>}
   </div>}
   {playingEvent===evtKey&&evt&&visualPath&&physicalAttack&&actor&&<PhysicalStrikeFX
      key={"physical-"+evtKey} attack={physicalAttack} side={actor.side} style={visualPath}/>}
   {playingEvent===evtKey&&evt&&visualPath&&!physicalAttack&&<ArenaVfx key={"vfx-"+evtKey} school={school} kind={cue?.castOnly?"cast":evt.kind} effect={skillEffect} targets={areaTargets} critical={evt.kind==="critical"} style={visualPath}/>}
   <div className="guild2d-hud-layer">{heroes.map(hud)}{enemies.map(hud)}</div>
   <div className="guild2d-ground"/>
   {!active&&<div className="guild2d-result"><strong>{battle.won?"🏆 VITÓRIA":battle.status==="retreated"?"EQUIPE RETIRADA":"☠️ DERROTA"}</strong></div>}
   <div className="guild2d-help">Toque num inimigo para selecionar. Concentre ataques para fixar o alvo.</div>
  </div>
  <div className="guild2d-chosen"><span>🛡️ {hero?.name||"Sem heróis vivos"}</span><span>⚔️</span><span>🐺 {enemy?.name||"Sem inimigos vivos"}</span></div>
  {!active&&<section className="guild2d-rewards" aria-label="Resultado e recompensas">
    <strong>{battle.won?"Vitória e recompensas":battle.status==="retreated"?"Equipe retirada":"Resultado do confronto"}</strong>
    <span>Ouro: {battle.reward||0} · Experiência: {battle.xp||0}</span>
    {!!battle.loot?.length&&<p>Itens encontrados: {battle.loot.map(id=>CATALOG_BY_ID[id]?.nome||id).join(" · ")}</p>}
  </section>}
  {!active&&<section className="guild2d-performance" aria-label="Desempenho dos heróis na batalha">
    <h3>Relatório tático da equipe</h3>
    <p>Valores calculados do registro real de ações nesta expedição.</p>
    <div className="guild2d-performance-grid">
      {performance.slice(0,8).map(person=><div key={person.id}>
        <strong>{person.name}</strong>
        <span>⚔️ Dano: {person.damage}</span>
        <span>💚 Cura: {person.healing}</span>
        <span>🛡️ Sofreu: {person.received}</span>
        <small>Críticos: {person.criticalHits}</small>
      </div>)}
      {!performance.length&&<small>Sem ações de combate registradas para os heróis.</small>}
    </div>
  </section>}
  <div className="guild2d-command-center" aria-label="Comandos táticos do combate">
    <div className="guild2d-turn-info"><strong>{active?"Próxima ação: "+(upcoming[0]?.name||"nova rodada"):"Batalha encerrada"}</strong>
      <small>{active?"Iniciativa: "+(upcoming.length?upcoming.slice(0,4).map(f=>f.name.split(" ")[0]).join(" → "):"recalculando"):"Resultado salvo."}</small></div>
    <div className="guild2d-focus-controls"><span>Alvo prioritário: <strong>{focus?.name||"Livre"}</strong></span>
      <button type="button" disabled={!active||busy||!enemy||focus?.id===enemy.id} onClick={()=>enemy&&act({type:"battle-focus",expeditionId:expedition.id,targetId:enemy.id})}>Concentrar ataques</button>
      <button type="button" disabled={!active||busy||!focus} onClick={()=>act({type:"battle-focus",expeditionId:expedition.id})}>Liberar foco</button></div>
    <div className="guild2d-auto-controls"><button type="button" disabled={!active||busy} data-active={autoSkills}
      onClick={()=>act({type:"battle-auto-abilities",expeditionId:expedition.id,enabled:!autoSkills})}>Habilidades automáticas: {autoSkills?"Ligadas":"Desligadas"}</button>
      <small>{autoSkills?"Heróis usam habilidades disponíveis sem ordem manual.":"Heróis só usam habilidades quando você preparar uma ordem."}</small></div>
   </div>
   <p className="guild2d-target-tip">O foco direciona golpes comuns e habilidades automáticas contra um inimigo vivo; curas e habilidades manuais respeitam seus alvos.</p>
  <div className="guild2d-log" aria-live="polite"><b>CRÔNICA · {active?"COMBATE REAL":"RESULTADO"}</b>
   {log.length?log.map((l,i)=><p key={battle.log.length-i} data-kind={l.kind}>{textoEmPortugues(l.text)}</p>):<p>Os combatentes tomam suas posições.</p>}
  </div>
  <div className="guild2d-actions">
   <button type="button" className="guild2d-attack" disabled={!active||busy} onClick={()=>{setTip("Avançou a próxima ação da ordem de iniciativa.");act({type:"battle-round",expeditionId:expedition.id});}}><Swords size={19}/> Atacar <small>{focus?"Alvo focado":"Ator e alvo automáticos"}</small></button>
   <button type="button" className="guild2d-skill" disabled={!active||busy||!hero} onClick={()=>{setOpenSkill(v=>!v);setTip("");}}><Sparkles size={19}/> Habilidade <small>{queued?"Preparada":"Escolher"}</small></button>
   <button type="button" className="guild2d-defend" disabled={!active||busy} onClick={()=>{setTip("Tática defensiva ativada para a equipe.");act({type:"battle-tactic",tactic:"defensive",expeditionId:expedition.id});}}><Shield size={19}/> Defender <small>{TACTICS[battle.combat?.tactic||expedition.tactic].name}</small></button>
   <button type="button" className="guild2d-retreat" disabled={!active||busy} onClick={()=>act({type:"battle-retreat",expeditionId:expedition.id})}><ArrowLeft size={19}/> Retirar equipe <small>Encerrar missão</small></button>
  </div>
  {active&&hero&&<nav className="guild2d-quickbar" aria-label={"Habilidades rápidas de "+hero.name}>
   <span className="guild2d-quickbar-label"><Sparkles size={14}/> Habilidades <b>{hero.name.split(" ")[0]}</b></span>
   <div className="guild2d-quickbar-slots">
    {abilities.slice(0,5).map(a=>{const cd=abilityCooldownRemaining(battle,hero.id,a.id);return <button
     key={a.id} type="button" className="guild2d-quick-slot" data-target={a.target}
     disabled={busy||!!queued||cd>0} title={a.name+" — "+a.description}
     aria-label={a.name+(cd>0?" — recarga "+cd+" turnos":queued?" — existe ordem preparada":" — pronta")}
     onClick={()=>queueAbility(a)}>
      <span aria-hidden="true" className="guild2d-quick-icon">{slotSymbol(a.target)}</span>
      <small>{a.name}</small>
      {cd>0&&<b className="guild2d-quick-cooldown" aria-hidden="true">{cd}</b>}
    </button>;})}
    <button type="button" className="guild2d-quick-more" aria-expanded={openSkill} onClick={()=>setOpenSkill(v=>!v)}>
     <Sparkles size={17}/><small>{openSkill?"Fechar":"Ver todas"}</small>
    </button>
   </div>
   {queued&&<span className="guild2d-quick-pending">Ordem preparada para {hero.name}</span>}
  </nav>}
  {openSkill&&active&&<section className="guild2d-skills" aria-label={"Painel de habilidades de "+(hero?.name||"herói")}>
    <header className="guild2d-skill-heading">
      <div><span>GRIMÓRIO DE COMBATE</span><h3>{hero?.name||"Escolha um herói"}</h3></div>
      <button type="button" onClick={()=>setOpenSkill(false)} aria-label="Fechar painel de habilidades"><X size={19}/></button>
    </header>
    <p className="guild2d-skill-hint">Escolha o combatente tocando nele na arena. As habilidades usam os turnos e as recargas reais.</p>
    {queued&&hero&&<button type="button" className="guild2d-cancel-order" disabled={busy}
      onClick={()=>{act({type:"battle-cancel-ability",expeditionId:expedition.id,heroId:hero.id});setTip("");}}>Cancelar ordem preparada</button>}
    <div className="guild2d-skill-targets">
      <span><Swords size={13}/> Inimigo selecionado: <strong>{enemy?.name||"Nenhum"}</strong></span>
      {abilities.some(a=>a.target==="ally")&&<label className="guild2d-ally-selector">Alvo aliado de cura/proteção
       <select value={allyTarget?.id||""} onChange={event=>setAllyTargetId(event.target.value)} disabled={busy}>
        {heroes.filter(f=>f.hp>0).map(f=><option key={f.id} value={f.id}>{f.name} · {f.hp}/{f.maxHp} PV</option>)}
       </select>
      </label>}
    </div>
    <div className="guild2d-skill-grid">
      {abilities.map(a=>{const cd=hero?abilityCooldownRemaining(battle,hero.id,a.id):0;return <button
        type="button" key={a.id} className="guild2d-skill-card" data-target={a.target} data-cooldown={cd>0}
        disabled={busy||!!queued||cd>0||!hero}
        aria-label={a.name+". "+a.description+(cd>0?" Em recarga por "+cd+" turnos.":" Pronta.")}
        onClick={()=>queueAbility(a)}>
         <span className="guild2d-skill-glyph" aria-hidden="true">{slotSymbol(a.target)}</span>
         <span className="guild2d-skill-text"><strong>{a.name}</strong><small>{a.description}</small></span>
         <span className="guild2d-skill-tag" aria-hidden="true">{cd>0?cd+" t":queued?"Fila":slotTarget(a.target)}</span>
       </button>})}
      {!abilities.length&&<p className="guild2d-no-skills">Este herói não possui habilidades disponíveis.</p>}
    </div>
   </section>}
  {tip&&<div className="guild2d-tip" role="status"><Check size={15}/>{tip}</div>}
  {active&&<div className="guild2d-consumables">
    <strong>Itens de combate</strong>
    {state.chest.filter(item=>ITEMS[item.key]?.slot==="consumable"&&!/energia|após uma expedição|entre expedições/i.test(CATALOG_BY_ID[item.key]?.efeito||"")).slice(0,5).map(item=>
      <button type="button" key={item.id} disabled={busy||(battle.combat?.consumablesUsed||0)>=3}
        onClick={()=>act({type:"battle-item",itemId:item.id,expeditionId:expedition.id})}>{ITEMS[item.key]?.name}</button>
    )}
  </div>}
  <div className="guild2d-options">
   <button type="button" disabled={!active||busy} onClick={()=>{setTip("Tática agressiva ativada.");act({type:"battle-tactic",tactic:"aggressive",expeditionId:expedition.id});}}><Zap size={15}/> Agressivo</button>
   <button type="button" disabled={!active||busy} onClick={()=>{setTip("Tática equilibrada ativada.");act({type:"battle-tactic",tactic:"balanced",expeditionId:expedition.id});}}>Equilibrada {battle.combat?.tactic==="balanced"?"✓":""}</button>
   <button type="button" disabled={!active||busy} onClick={()=>act({type:"battle-auto",expeditionId:expedition.id})}><ChevronsRight size={15}/> Pular resultado</button>
  </div>
  <div className="guild2d-nav"><button type="button" onClick={returnToTeam}>← Seleção de heróis</button>{!active&&<button type="button" onClick={close}>Voltar à guilda</button>}</div>
  <p className="guild2d-footnote">Arena visual oficial. Os PV, dano, habilidades, missões e recompensas são registrados pelo motor real da campanha.</p>
 </section>;
}
