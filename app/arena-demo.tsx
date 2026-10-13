import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, FastForward, Pause, Play, RotateCcw, Shield, SkipForward, Sparkles, Swords, Zap } from "lucide-react";
import { portraitSource } from "@/lib/portraits";
import "./arena-demo.css";

/** DEMO V1: nenhum estado da campanha é lido ou gravado aqui. */
type Unit = { id: string; name: string; role: string; classId?: "warrior"|"mage"|"healer"|"ranger"; side: "hero"|"enemy"; hp: number; maxHp: number; image: string };
type Delta = { id: string; value: number };
type Move = { actor: string; targets: Delta[]; title: string; narrative: string; type: "strike"|"shot"|"spell"|"heal"|"bite"|"guard"|"finisher"; video?: "arcane"|"finisher" };
const INITIAL_UNITS: Unit[] = [
  {id:"kaelith",name:"Kaelith",role:"Espadachim",classId:"warrior",side:"hero",hp:180,maxHp:180,image:portraitSource("Kaelith","kael","rogue")},
  {id:"lyria",name:"Lyria",role:"Maga arcana",classId:"mage",side:"hero",hp:132,maxHp:132,image:portraitSource("Lyria","lyra","mage")},
  {id:"thorgar",name:"Thorgar",role:"Guardião",classId:"healer",side:"hero",hp:195,maxHp:195,image:portraitSource("Thorgar","elen","healer")},
  {id:"eldrin",name:"Eldrin",role:"Arqueiro",classId:"ranger",side:"hero",hp:150,maxHp:150,image:portraitSource("Eldrin","sora","ranger")},
  ...([95,110,150] as const).map((hp,i):Unit=>({id:"lobo-"+(i+1),name:"Lobo Sombrio "+(i+1),role:i===2?"Líder da matilha":"Criatura da cripta",side:"enemy",hp,maxHp:hp,image:"/enemies/wolf.webp"}))
];
// Dano positivo reduz PV. Cura usa dano negativo. Golpes AoE têm alvos explícitos.
// Esta é uma sequência CONTROLADA DE DEMONSTRAÇÃO, não uma missão nem resultado do motor real.
const SCRIPT: Move[] = [
  {actor:"kaelith",targets:[{id:"lobo-1",value:29}],type:"strike",title:"A espada encontra a sombra",narrative:"Kaelith avança e corta o primeiro lobo: 29 de dano."},
  {actor:"lobo-2",targets:[{id:"kaelith",value:17}],type:"bite",title:"O contra-ataque",narrative:"O segundo lobo investe. Kaelith sofre 17 de dano."},
  {actor:"lyria",targets:[{id:"lobo-1",value:45},{id:"lobo-2",value:45},{id:"lobo-3",value:45}],type:"spell",video:"arcane",title:"Tempestade Arcana",narrative:"Lyria convoca uma tempestade azul! Os três lobos sofrem 45 de dano."},
  {actor:"lobo-3",targets:[{id:"eldrin",value:14}],type:"bite",title:"Investida do líder",narrative:"O líder da matilha ataca Eldrin: 14 de dano."},
  {actor:"thorgar",targets:[{id:"kaelith",value:-17}],type:"heal",title:"Luz restauradora",narrative:"Thorgar ergue o símbolo sagrado. Kaelith recupera 17 PV."},
  {actor:"eldrin",targets:[{id:"lobo-1",value:14}],type:"shot",title:"Flecha certeira",narrative:"Eldrin dispara contra o lobo ferido: 14 de dano."},
  {actor:"lobo-1",targets:[{id:"kaelith",value:13}],type:"bite",title:"O último salto",narrative:"O primeiro lobo ainda resiste e fere Kaelith: 13 de dano."},
  {actor:"kaelith",targets:[{id:"lobo-1",value:36}],type:"strike",title:"Primeiro inimigo abatido",narrative:"Kaelith responde com um golpe preciso. O primeiro lobo cai."},
  {actor:"lobo-2",targets:[{id:"thorgar",value:22}],type:"bite",title:"Garras na armadura",narrative:"O segundo lobo rompe a defesa de Thorgar: 22 de dano."},
  {actor:"eldrin",targets:[{id:"lobo-2",value:41}],type:"shot",title:"Disparo da retaguarda",narrative:"Eldrin atravessa as sombras: 41 de dano no segundo lobo."},
  {actor:"lobo-3",targets:[{id:"lyria",value:26}],type:"bite",title:"A maga é atacada",narrative:"O líder da matilha alcança Lyria: 26 de dano."},
  {actor:"thorgar",targets:[{id:"lyria",value:-26}],type:"heal",title:"Prece do guardião",narrative:"Thorgar recupera 26 PV de Lyria."},
  {actor:"kaelith",targets:[{id:"lobo-2",value:25}],type:"strike",title:"O segundo lobo cai",narrative:"A espada de Kaelith encerra o avanço do segundo lobo."},
  {actor:"lyria",targets:[{id:"lobo-3",value:40}],type:"spell",title:"Raio arcano",narrative:"Lyria canaliza uma descarga concentrada: 40 de dano no líder."},
  {actor:"lobo-3",targets:[{id:"kaelith",value:15}],type:"bite",title:"Última resistência",narrative:"O lobo sombrio se recusa a recuar e fere Kaelith: 15 de dano."},
  {actor:"eldrin",targets:[{id:"lobo-3",value:30}],type:"shot",title:"Flecha da alvorada",narrative:"Eldrin acerta o coração da tempestade: 30 de dano."},
  {actor:"kaelith",targets:[{id:"lobo-3",value:40}],type:"finisher",video:"finisher",title:"Golpe Final",narrative:"Kaelith atravessa a escuridão. O líder cai e a cripta é libertada!"}
];

export const ARENA_DEMO_ACTION_COUNT = SCRIPT.length;
type BattlePhase = "waiting" | "windup" | "impact" | "finished";
/** Dois tempos de cada ação: o dano só é aplicado quando o golpe atinge o alvo. */
function actionDuration(move: Move) { return move.video ? 1900 : move.type==="heal" ? 1400 : 1250; }
function actionImpactTime(move: Move) { return Math.round(actionDuration(move)*(move.video ? .52 : .47)); }
export function simulateDemo(index: number): Unit[] {
  const units=INITIAL_UNITS.map(unit=>({...unit}));
  for(const step of SCRIPT.slice(0,index+1)){
    for(const damage of step.targets){
      const unit=units.find(u=>u.id===damage.id);
      if(unit)unit.hp=Math.max(0,Math.min(unit.maxHp,unit.hp-damage.value));
    }
  }
  return units;
}

export default function ArenaDemo({ onExit }: { onExit: () => void }) {
  const [index,setIndex]=useState(-1);
  const [phase,setPhase]=useState<BattlePhase>("waiting");
  const [playing,setPlaying]=useState(false);
  const [paused,setPaused]=useState(false);
  const [speed,setSpeed]=useState<1|2>(1);
  const [lite,setLite]=useState(false);
  const [skipVideo,setSkipVideo]=useState(false);
  const [videoError,setVideoError]=useState(false);
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const sceneRef=useRef<HTMLDivElement|null>(null);
  const fighterRefs=useRef<Record<string,HTMLElement|null>>({});
  const atEnd=phase==="finished";
  const move=index>=0?SCRIPT[index]:null;
  // Até o instante do impacto, a barra de vida NÃO muda.
  const appliedIndex=(phase==="impact"||phase==="finished")?index:index-1;
  const units=useMemo(()=>simulateDemo(appliedIndex),[appliedIndex]);
  const beforeImpact=useMemo(()=>simulateDemo(index-1),[index]);
  const aliveHero=units.filter(u=>u.side==="hero"&&u.hp>0).length;
  const aliveEnemy=units.filter(u=>u.side==="enemy"&&u.hp>0).length;
  const special=Boolean(move?.video&&!lite&&!skipVideo&&!videoError);
  const recentMoves=SCRIPT.slice(Math.max(0,appliedIndex-3),appliedIndex+1).reverse();
  const actingSide=INITIAL_UNITS.find(u=>u.id===move?.actor)?.side;

  // A Arena Demo possui o próprio modo leve. Suspende temporariamente o modo
  // global para que o Android mostre os movimentos; restaura ao voltar à Guilda.
  useEffect(()=>{
    const root=document.documentElement;
    const globalLite=root.classList.contains("guild-lite-mode");
    if(globalLite)root.classList.remove("guild-lite-mode");
    return ()=>{if(globalLite)root.classList.add("guild-lite-mode");};
  },[]);

  // Um cronômetro para preparar o golpe e outro para resolver a consequência.
  // A lógica da missão real nunca é chamada por esta demonstração.
  useEffect(()=>{
    if(!playing||paused||!move||phase==="waiting"||phase==="finished")return;
    const total=actionDuration(move);
    const impactAt=actionImpactTime(move);
    const delay=phase==="windup"?impactAt:
      skipVideo&&move.video?170:total-impactAt;
    const timer=window.setTimeout(()=>{
      if(phase==="windup"){
        setPhase("impact");
      } else if(index===SCRIPT.length-1){
        setPhase("finished");
        setPlaying(false);
      } else {
        setIndex(i=>i+1);
        setPhase("windup");
        setSkipVideo(false);
        setVideoError(false);
      }
    },Math.max(80,delay/speed));
    return ()=>window.clearTimeout(timer);
  },[index,phase,playing,paused,speed,skipVideo,move]);

  // Calcula o caminho em pixels até a vítima conforme o tamanho real da tela.
  // É só apresentação: não altera o cálculo de PV nem o save da campanha.
  useLayoutEffect(()=>{
    if(!move||!sceneRef.current)return;
    const actor=fighterRefs.current[move.actor]?.querySelector(".demo-unit-figure");
    const target=fighterRefs.current[move.targets[0]?.id]?.querySelector(".demo-unit-figure");
    if(!actor||!target)return;
    const a=actor.getBoundingClientRect(), b=target.getBoundingClientRect();
    const scene=sceneRef.current.getBoundingClientRect();
    const dx=b.left+b.width/2-(a.left+a.width/2);
    const dy=b.top+b.height/2-(a.top+a.height/2);
    // Avança até perto do alvo e recua na segunda metade da ação.
    const actorNode=fighterRefs.current[move.actor];
    actorNode?.style.setProperty("--demo-travel-x",Math.round(dx*.72)+"px");
    actorNode?.style.setProperty("--demo-travel-y",Math.round(dy*.66)+"px");
    sceneRef.current.style.setProperty("--demo-source-x",Math.round(a.left+a.width/2-scene.left)+"px");
    sceneRef.current.style.setProperty("--demo-source-y",Math.round(a.top+a.height/2-scene.top)+"px");
    sceneRef.current.style.setProperty("--demo-projectile-x",Math.round(dx)+"px");
    sceneRef.current.style.setProperty("--demo-projectile-y",Math.round(dy)+"px");
  },[index,move]);

  useEffect(()=>{
    const video=videoRef.current;
    if(!video)return;
    video.playbackRate=speed;
    if(paused||!playing)video.pause();
    else if(special)void video.play().catch(()=>setVideoError(true));
  },[paused,playing,special,index,speed,phase]);

  const begin=()=>{setIndex(0);setPhase("windup");setPlaying(true);setPaused(false);setSkipVideo(false);setVideoError(false);};
  const restart=()=>{setPlaying(false);setPaused(false);setIndex(-1);setPhase("waiting");setSkipVideo(false);setVideoError(false);};
  const togglePause=()=>setPaused(old=>!old);
  const showImpact=phase==="impact";
  const activeTargets=new Set(showImpact?(move?.targets.map(t=>t.id)||[]):[]);
  const percent=(u:Unit)=>Math.round(u.hp/u.maxHp*100);
  const damageFor=(u:Unit)=>{
    const delta=move?.targets.find(t=>t.id===u.id);
    const previous=beforeImpact.find(x=>x.id===u.id);
    if(!delta||!previous)return 0;
    return Math.abs(u.hp-previous.hp);
  };

  return <section className="demo-shell screen" aria-label="Arena Cinematográfica — Demonstração independente" data-demo-mode={lite?"lite":"cinema"}>
    <header className="demo-head">
      <button className="demo-back" type="button" onClick={onExit}><ArrowLeft size={17}/> Voltar à Guilda</button>
      <div className="demo-version"><Sparkles size={15}/> DEMO V1 · RITUAL SOMBRIO</div>
      <span className="demo-safety"><Shield size={13}/> Save protegido</span>
    </header>
    <div className="demo-intro">
      <span>CRÔNICAS DA GUILDA · PROTÓTIPO VISUAL</span>
      <h2>Ritual Sombrio na Cripta</h2>
      <p>Uma batalha cinematográfica de teste: movimentos individuais, efeitos de magia e dois vídeos especiais. Nenhum recurso da sua campanha é utilizado.</p>
    </div>
    <div ref={sceneRef} className="demo-scene" data-move={move?.type||"idle"} data-phase={phase} data-paused={paused} data-video={special} style={{["--demo-action-speed" as string]:speed}}>
      <div className="demo-atmosphere" aria-hidden="true"/>
      <div className="demo-sky-symbol" aria-hidden="true">✧</div>
      <div className="demo-cast demo-cast-heroes" data-front={actingSide==="hero"&&phase!=="finished"} aria-label="Heróis da demonstração">
        {units.filter(u=>u.side==="hero").map((u,i)=><article key={u.id} ref={node=>{fighterRefs.current[u.id]=node;}} className="demo-unit demo-unit-hero" style={{["--demo-order" as string]:i}} data-actor={move?.actor===u.id&&phase!=="finished"} data-hit={activeTargets.has(u.id)&&move?.type!=="heal"} data-heal={activeTargets.has(u.id)&&move?.type==="heal"} data-dead={u.hp<=0}>

          <div className="demo-unit-figure"><img src={u.image} alt={"Arte de "+u.name}/><span className="demo-unit-weapon" aria-hidden="true">{u.classId==="mage"?"✦":u.classId==="ranger"?"➶":u.classId==="healer"?"✚":"⚔"}</span></div>
          <div className="demo-unit-status"><strong>{u.name}</strong><span className="demo-hp"><i style={{width:percent(u)+"%"}}/></span><small>{u.hp}/{u.maxHp} PV</small></div>
          {activeTargets.has(u.id)&&!!move?.targets.find(t=>t.id===u.id)&&<b className="demo-damage" key={index}>{move.type==="heal"?"+":"−"}{damageFor(u)}</b>}
        </article>)}
      </div>
      {phase==="windup" && ["shot","spell","heal"].includes(move?.type||"") && <span className="demo-projectile" key={"spell-"+index} aria-hidden="true">{move?.type==="shot"?"➶":move?.type==="heal"?"✚":"✦"}</span>}
      <div className="demo-impact" aria-hidden="true">
        {move?.type==="shot"?"➶":move?.type==="spell"?"✦":move?.type==="heal"?"✚":move?.type==="finisher"?"✶":move?"⚡":"⚔"}
      </div>
      <div className="demo-cast demo-cast-enemies" data-front={actingSide==="enemy"&&phase!=="finished"} aria-label="Lobos sombrios">
        {units.filter(u=>u.side==="enemy").map((u,i)=><article key={u.id} ref={node=>{fighterRefs.current[u.id]=node;}} className="demo-unit demo-unit-enemy" style={{["--demo-order" as string]:i}} data-actor={move?.actor===u.id&&phase!=="finished"} data-hit={activeTargets.has(u.id)} data-dead={u.hp<=0}>
          <div className="demo-unit-figure"><img src={u.image} alt="Lobo sombrio"/></div>
          <div className="demo-unit-status"><strong>{i===2?"Líder sombrio":"Lobo "+(i+1)}</strong><span className="demo-hp"><i style={{width:percent(u)+"%"}}/></span><small>{u.hp}/{u.maxHp} PV</small></div>
          {activeTargets.has(u.id)&&<b className="demo-damage" key={index}>−{damageFor(u)}</b>}
        </article>)}
      </div>
      {special&&<div className="demo-video-overlay" aria-label={"Vídeo especial: "+move?.title}>
        <video ref={videoRef} key={move?.video+"-"+index} autoPlay muted playsInline preload="auto" onError={()=>setVideoError(true)} src={"/demo/arena-"+move?.video+".webm"}/>
        <div className="demo-video-title"><span>CENA ESPECIAL</span><strong>{move?.title}</strong></div>
      </div>}
      {move?.video && !special && phase!=="finished" && <div className="demo-special-fallback" aria-hidden="true">{move.video==="arcane"?"✧":"⚔"}</div>}
      {atEnd&&<div className="demo-victory"><CheckCircle2 size={32}/><strong>CRIPTA LIBERTADA</strong><small>Demo concluída · nenhuma alteração na campanha</small></div>}
    </div>
    <div className="demo-live" role="status" aria-live="polite">
      <span><Zap size={14}/> {atEnd?"VITÓRIA DEMONSTRATIVA":!playing?"PRONTO PARA COMEÇAR":paused?"COMBATE PAUSADO":phase==="windup"?"PREPARANDO O GOLPE":"IMPACTO CONFIRMADO"} <small>{Math.max(0,index+1)}/{SCRIPT.length}</small></span>
      <strong>{move?.title||"Heróis à entrada da cripta"}</strong>
      <p key={index}>{move?(phase==="windup"?"Aguarde a animação de "+(INITIAL_UNITS.find(u=>u.id===move.actor)?.name||"combate")+"…":move.narrative):"Toque em Iniciar batalha para testar as animações e os vídeos especiais."}</p>
    </div>
    <div className="demo-health-summary"><span><Swords size={15}/> {aliveHero} heróis de pé</span><span>{aliveEnemy} lobos restantes</span></div>
    <div className="demo-action-history" aria-label="Últimas ações de combate">
      <strong>Diário do combate</strong>
      <ol>{recentMoves.map((entry,i)=><li key={appliedIndex-i}><span>{Math.max(1,appliedIndex-i+1)}.</span> {entry.narrative}</li>)}
        {!recentMoves.length&&<li>Os combatentes aguardam o início da batalha.</li>}</ol>
    </div>
    <div className="demo-controls">
      {!playing?<button className="demo-primary" type="button" onClick={begin}><Play size={17}/> Iniciar batalha</button>:
        <button type="button" className="demo-primary" disabled={atEnd} onClick={togglePause}>{paused?<><Play size={16}/> Continuar</>:<><Pause size={16}/> Pausar</>}</button>}
      <button type="button" onClick={()=>setSpeed(s=>s===1?2:1)}><FastForward size={16}/> {speed}×</button>
      <button type="button" onClick={()=>setLite(s=>!s)}><Zap size={16}/> {lite?"Modo leve ON":"Modo leve OFF"}</button>
      <button type="button" disabled={!special||atEnd} onClick={()=>{setSkipVideo(true);setPhase("impact");}}><SkipForward size={16}/> Pular vídeo</button>
      <button type="button" disabled={!playing||atEnd} onClick={()=>{setIndex(SCRIPT.length-1);setPhase("finished");setPlaying(false);setPaused(false);}}><SkipForward size={16}/> Ver resultado</button>
      <button type="button" onClick={restart}><RotateCcw size={16}/> Reiniciar</button>
    </div>
    <p className="demo-footnote">Esta simulação usa um roteiro fixo de avaliação visual: a barra de vida só atualiza no impacto. Nenhum ouro, XP, herói ou resultado da campanha é alterado. As duas cenas WebM ficam disponíveis offline; no modo leve, aparecem efeitos simples.</p>
  </section>;
}
