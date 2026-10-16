import {useState,type CSSProperties} from "react";
import {ArrowLeft,Swords,Shield,Sparkles,ChevronsRight,X,Zap,Check} from "lucide-react";
import {availableAbilities,abilityCooldownRemaining,heroRace,TACTICS,ITEMS,type Campaign,type Expedition,type Action,type BattleFighter,type BattleLog,type Hero} from "@/lib/game";
import {CATALOG_BY_ID} from "@/lib/catalog-test";
import {battleSource,portraitSource} from "@/lib/portraits";
import {enemyArtKey,enemyArtSource} from "@/lib/enemy-art";
import "./arena-2d.css";

/** 2D da campanha real: HP, ações e vitória são exclusivamente do motor da expedição. */
/** Posições aprovadas: quatro heróis à esquerda, quatro inimigos à direita. */
const pos=(side:"hero"|"enemy",i:number)=>{
 const positions=side==="hero"?[[27,37],[44,52],[14,68],[34,70]]:[[89,38],[72,53],[89,70],[76,71]];
 const [x,y]=positions[Math.min(i,3)];return {x,y};
};
/** Ilustrações de corpo inteiro; para criaturas sem sprite completo,
 * conserva-se a identidade da espécie pelo bestiário existente. */
function combatArt(f:BattleFighter,hero?:Hero):{src:string;full:boolean}{
 if(f.side==="enemy"){
  const kind=enemyArtKey(f.name);
  const sprites:Record<ReturnType<typeof enemyArtKey>,string>={
   ambusher:"cultista",ancient_guardian:"esqueleto",bandit:"cultista",
   border_lord:"necromante",cultist:"cultista",draconic_raider:"cultista",
   drake_warrior:"esqueleto",fallback:"cultista",goblin:"cultista",
   matriarch:"necromante",obsidian_guardian:"esqueleto",orc:"esqueleto",
   panther:"espectro",raider:"cultista",skeleton:"esqueleto",
   specter:"espectro",spectral_knight:"esqueleto",spider:"espectro",
   troll:"esqueleto",watcher:"espectro",wild_drake:"espectro",wolf:"espectro"
  };
  return {src:"/battle/sprite-"+sprites[kind]+".webp",full:true};
 }
 const race=hero?heroRace(hero):"human";
 if(!hero)return {src:portraitSource(f.name,f.id,f.class||"warrior",race),full:false};
 return {src:battleSource(hero,race),full:true};
}
const recentHit=(logs:BattleLog[])=>[...logs].reverse().find(x=>x.actorId&&x.targetId&&["hit","critical","heal","fall","ability"].includes(x.kind)&&x.amount!==0);
const hpWidth=(hp:number,max:number)=>(max?Math.max(0,Math.min(100,100*hp/max)):0)+"%";
type PosStyle=CSSProperties&{"--x":string;"--y":string;"--dash-x":string;"--dash-y":string};

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
 const [heroId,setHeroId]=useState("");
 const [enemyId,setEnemyId]=useState("");
 const [allyTargetId,setAllyTargetId]=useState("");
 const [openSkill,setOpenSkill]=useState(false);
 const [tip,setTip]=useState("");
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
 const evt=recentHit(battle.log);
 const evtIndex=evt?battle.log.lastIndexOf(evt):-1;
 const actor=all.find(f=>f.id===evt?.actorId);
 const target=all.find(f=>f.id===evt?.targetId);
 const actorIndex=actor?all.filter(f=>f.side===actor.side).findIndex(f=>f.id===actor.id):0;
 const targetIndex=target?all.filter(f=>f.side===target.side).findIndex(f=>f.id===target.id):0;
 const evtKey=expedition.id+"-"+evtIndex;
 const targetPos=target?pos(target.side,targetIndex):undefined;
 const queuedUnit=(id:string)=>battle.combat?.pendingAbilities?.some(p=>p.heroId===id);
 function unit(f:BattleFighter,i:number){
  const p=pos(f.side,i),acting=actor?.id===f.id&&!!targetPos&&f.hp>0;
  const struck=target?.id===f.id&&!!evt;
  const style:PosStyle={"--x":p.x+"%","--y":p.y+"%","--dash-x":acting&&targetPos?((targetPos.x-p.x)*.7)+"cqw":"0cqw","--dash-y":acting&&targetPos?((targetPos.y-p.y)*.7)+"cqh":"0cqh"};
  const image=combatArt(f,f.side==="hero"?state.heroes.find(h=>h.id===f.id):undefined);
  const selected=f.side==="hero"?hero?.id===f.id:enemy?.id===f.id;
  return <button key={f.id} type="button" className={"guild2d-unit "+(f.side==="hero"?"guild2d-hero":"guild2d-enemy")}
    style={style} data-dead={f.hp<=0} data-selected={selected} data-focused={focus?.id===f.id} data-full-art={image.full}
    aria-label={f.name+" — "+f.hp+" de "+f.maxHp+" pontos de vida"}
    onClick={()=>{if(f.hp<=0)return;if(f.side==="hero")setHeroId(f.id);else setEnemyId(f.id);setTip("");}}>
    <span className="guild2d-sprite" key={acting?evtKey:f.id} data-acting={acting} data-hit={struck} data-magic={evt?.kind==="ability"||evt?.kind==="heal"}>
     <img src={image.src} alt="" draggable={false} decoding="sync" loading="eager" fetchPriority="high" onError={e=>{const node=e.currentTarget;if(node.dataset.fallback==="1")return;node.dataset.fallback="1";node.src=f.side==="hero"?portraitSource(f.name,f.id,f.class||"warrior",state.heroes.find(h=>h.id===f.id)?.race,state.heroes.find(h=>h.id===f.id)?.sex):enemyArtSource(f.name);node.closest(".guild2d-unit")?.setAttribute("data-full-art","false");}}/>

    </span>

    {struck&&evt?.amount!=null&&evt.amount>0&&<span key={evtKey} className={"guild2d-number "+(evt.kind==="heal"?"guild2d-healed":"")}>{evt.kind==="heal"?"+":"−"}{evt.amount}</span>}
    {struck&&evt?.amount!=null&&evt.amount>0&&<span key={"spark-"+evtKey} className="guild2d-spark" aria-hidden="true"/>}
  </button>;
 }
 function hud(f:BattleFighter,i:number){
  const p=pos(f.side,i);
  const selected=f.side==="hero"?hero?.id===f.id:enemy?.id===f.id;
  return <div key={f.id} className={"guild2d-hud "+(f.side==="hero"?"guild2d-hud-hero":"guild2d-hud-enemy")}
    style={{"--x":p.x+"%","--y":p.y+"%"} as CSSProperties} data-dead={f.hp<=0} data-selected={selected}>
     <strong>{f.name.split(" ").slice(0,2).join(" ")}</strong>
     <div className="guild2d-meter"><span style={{width:hpWidth(f.hp,f.maxHp)}}/></div>
     <small>{Math.max(0,f.hp)} / {f.maxHp} PV</small>
     {queuedUnit(f.id)&&f.side==="hero"&&<em>HABILIDADE</em>}
      {focus?.id===f.id&&<em>FOCO</em>}
      {!!f.statuses?.length&&<span className="guild2d-effects">{f.statuses.slice(0,3).map((status,i)=>
        <abbr key={status.kind+"-"+i} title={status.kind+" · "+status.rounds+" turno(s)"}>{status.kind==="shield"?"🛡️":status.kind==="poison"?"☠️":status.kind==="regen"?"✚":status.kind==="stun"?"✦":"●"}{status.rounds}</abbr>)}</span>}
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
 const label=active?"AO VIVO":battle.won?"VITÓRIA":battle.status==="retreated"?"RETIRADA":"FIM DE BATALHA";
 return <section className="guild2d-shell battle-sheet" aria-label="Combate 2D real de até quatro contra quatro">
  <header className="guild2d-header"><strong>⚔️ Crônicas da Guilda <small>COMBATE 2D · ARENA REALISTA</small></strong><button type="button" onClick={close} aria-label="Fechar arena"><X size={19}/></button></header>
  <div className="guild2d-mission"><h2>{battle.title}</h2><span>Rodada {battle.rounds}{battle.objective?.targetRounds?"/"+battle.objective.targetRounds:""}</span><small>{battle.combat?.mission.location||battle.objective?.name||"Terras da Guilda"}</small></div>
  <div className="guild2d-stage" role="group" aria-label={heroes.length+" heróis contra "+enemies.length+" inimigos"}>
   <div className="guild2d-scene"/>
   <div className="guild2d-label"><span>HERÓIS · {heroes.length}</span><b>{label}</b><span>{enemies.length} · INIMIGOS</span></div>
   {heroes.map(unit)}{enemies.map(unit)}
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
   {log.length?log.map((l,i)=><p key={battle.log.length-i} data-kind={l.kind}>{l.text}</p>):<p>Os combatentes tomam suas posições.</p>}
  </div>
  <div className="guild2d-actions">
   <button type="button" className="guild2d-attack" disabled={!active||busy} onClick={()=>{setTip("Avançou a próxima ação da ordem de iniciativa.");act({type:"battle-round",expeditionId:expedition.id});}}><Swords size={19}/> Atacar <small>{focus?"Alvo focado":"Ator e alvo automáticos"}</small></button>
   <button type="button" className="guild2d-skill" disabled={!active||busy||!hero} onClick={()=>{setOpenSkill(v=>!v);setTip("");}}><Sparkles size={19}/> Habilidade <small>{queued?"Preparada":"Escolher"}</small></button>
   <button type="button" className="guild2d-defend" disabled={!active||busy} onClick={()=>{setTip("Tática defensiva ativada para a equipe.");act({type:"battle-tactic",tactic:"defensive",expeditionId:expedition.id});}}><Shield size={19}/> Defender <small>{TACTICS[battle.combat?.tactic||expedition.tactic].name}</small></button>
   <button type="button" className="guild2d-retreat" disabled={!active||busy} onClick={()=>act({type:"battle-retreat",expeditionId:expedition.id})}><ArrowLeft size={19}/> Retirar equipe <small>Encerrar missão</small></button>
  </div>
  {openSkill&&active&&<div className="guild2d-skills"><b>Habilidades de {hero?.name}</b>
    {queued&&hero&&<button type="button" className="guild2d-cancel-order" disabled={busy}
      onClick={()=>{act({type:"battle-cancel-ability",expeditionId:expedition.id,heroId:hero.id});setTip("");}}>Cancelar habilidade preparada</button>}<p>Toque em um personagem para mudar quem usa a habilidade. Selecione abaixo quem recebe curas ou escudos. Inimigos tocados recebem golpes direcionados.</p>
   <label className="guild2d-ally-selector">Alvo aliado para cura ou proteção
    <select value={allyTarget?.id||""} onChange={event=>setAllyTargetId(event.target.value)} disabled={busy}>
     {heroes.filter(f=>f.hp>0).map(f=><option key={f.id} value={f.id}>{f.name} · {f.hp}/{f.maxHp} PV</option>)}
    </select>
   </label>
   <div>{abilities.map(a=>{const cd=abilityCooldownRemaining(battle,hero!.id,a.id);return <button type="button" key={a.id} disabled={busy||!!queued||cd>0} onClick={()=>queueAbility(a)}>{a.name}{cd>0?" · recarga "+cd:""}<small>{a.description}</small></button>;})}</div>
  </div>}
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
