import { useEffect, useMemo, useRef, useState } from "react";
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
  {actor:"thorgar",targets:[{id:"kaelith",value:-21}],type:"heal",title:"Luz restauradora",narrative:"Thorgar ergue o símbolo sagrado. Kaelith recupera 21 PV."},
  {actor:"eldrin",targets:[{id:"lobo-1",value:36}],type:"shot",title:"Flecha certeira",narrative:"Eldrin dispara contra o lobo ferido: 36 de dano."},
  {actor:"lobo-1",targets:[{id:"kaelith",value:13}],type:"bite",title:"O último salto",narrative:"O primeiro lobo ainda resiste e fere Kaelith: 13 de dano."},
  {actor:"kaelith",targets:[{id:"lobo-1",value:36}],type:"strike",title:"Primeiro inimigo abatido",narrative:"Kaelith responde com um golpe preciso. O primeiro lobo cai."},
  {actor:"lobo-2",targets:[{id:"thorgar",value:22}],type:"bite",title:"Garras na armadura",narrative:"O segundo lobo rompe a defesa de Thorgar: 22 de dano."},
  {actor:"eldrin",targets:[{id:"lobo-2",value:41}],type:"shot",title:"Disparo da retaguarda",narrative:"Eldrin atravessa as sombras: 41 de dano no segundo lobo."},
  {actor:"lobo-3",targets:[{id:"lyria",value:26}],type:"bite",title:"A maga é atacada",narrative:"O líder da matilha alcança Lyria: 26 de dano."},
  {actor:"thorgar",targets:[{id:"lyria",value:-33}],type:"heal",title:"Prece do guardião",narrative:"Thorgar recupera 26 PV de Lyria (cura limitada ao máximo)."},
  {actor:"kaelith",targets:[{id:"lobo-2",value:25}],type:"strike",title:"O segundo lobo cai",narrative:"A espada de Kaelith encerra o avanço do segundo lobo."},
  {actor:"lyria",targets:[{id:"lobo-3",value:40}],type:"spell",title:"Raio arcano",narrative:"Lyria canaliza uma descarga concentrada: 40 de dano no líder."},
  {actor:"lobo-3",targets:[{id:"kaelith",value:15}],type:"bite",title:"Última resistência",narrative:"O lobo sombrio se recusa a recuar e fere Kaelith: 15 de dano."},
  {actor:"eldrin",targets:[{id:"lobo-3",value:30}],type:"shot",title:"Flecha da alvorada",narrative:"Eldrin acerta o coração da tempestade: 30 de dano."},
  {actor:"kaelith",targets:[{id:"lobo-3",value:40}],type:"finisher",video:"finisher",title:"Golpe Final",narrative:"Kaelith atravessa a escuridão. O líder cai e a cripta é libertada!"}
];

export const ARENA_DEMO_ACTION_COUNT = SCRIPT.length;
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
  const [playing,setPlaying]=useState(false);
  const [paused,setPaused]=useState(false);
  const [speed,setSpeed]=useState<1|2>(1);
  const [lite,setLite]=useState(false);
  const [skipVideo,setSkipVideo]=useState(false);
  const [videoError,setVideoError]=useState(false);
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const atEnd=index>=SCRIPT.length-1;
  const move=index>=0?SCRIPT[index]:null;
  const units=useMemo(()=>simulateDemo(index),[index]);
  const aliveHero=units.filter(u=>u.side==="hero"&&u.hp>0).length;
  const aliveEnemy=units.filter(u=>u.side==="enemy"&&u.hp>0).length;
  const special=Boolean(move?.video&&!lite&&!skipVideo&&!videoError);

  useEffect(()=>{
    if(!playing||paused||atEnd)return;
    const duration=index<0?0:move?.video&&!lite&&!skipVideo?1950:move?.type==="heal"?1400:1250;
    const timer=window.setTimeout(()=>{
      setIndex(i=>Math.min(SCRIPT.length-1,i+1));
      setSkipVideo(false);setVideoError(false);
    },duration/speed);
    return ()=>window.clearTimeout(timer);
  },[index,playing,paused,atEnd,speed,move?.video,move?.type,lite,skipVideo]);
  useEffect(()=>{
    if(paused){videoRef.current?.pause();}
    else if(playing && special){void videoRef.current?.play().catch(()=>setVideoError(true));}
  },[paused,playing,special,index]);
  const begin=()=>{setIndex(0);setPlaying(true);setPaused(false);setSkipVideo(false);setVideoError(false);};
  const restart=()=>{setPlaying(false);setPaused(false);setIndex(-1);setSkipVideo(false);setVideoError(false);};
  const togglePause=()=>{setPaused(old=>!old);};
  const activeTargets=new Set(move?.targets.map(t=>t.id)||[]);
  const percent=(u:Unit)=>Math.round(u.hp/u.maxHp*100);

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
    <div className="demo-scene" data-move={move?.type||"idle"} data-video={special}>
      <div className="demo-atmosphere" aria-hidden="true"/>
      <div className="demo-sky-symbol" aria-hidden="true">✧</div>
      <div className="demo-cast demo-cast-heroes" aria-label="Heróis da demonstração">
        {units.filter(u=>u.side==="hero").map((u,i)=><article key={u.id} className="demo-unit demo-unit-hero" style={{["--demo-order" as string]:i}} data-actor={move?.actor===u.id} data-hit={activeTargets.has(u.id)&&move?.type!=="heal"} data-heal={activeTargets.has(u.id)&&move?.type==="heal"} data-dead={u.hp<=0}>
          <div className="demo-unit-figure"><img src={u.image} alt={"Arte de "+u.name}/><span className="demo-unit-weapon" aria-hidden="true">{u.classId==="mage"?"✦":u.classId==="ranger"?"➶":u.classId==="healer"?"✚":"⚔"}</span></div>
          <div className="demo-unit-status"><strong>{u.name}</strong><span className="demo-hp"><i style={{width:percent(u)+"%"}}/></span><small>{u.hp}/{u.maxHp} PV</small></div>
          {activeTargets.has(u.id)&&!!move?.targets.find(t=>t.id===u.id)&&<b className="demo-damage" key={index}>{move.type==="heal"?"+":"−"}{Math.min(Math.abs(move.targets.find(t=>t.id===u.id)!.value),move.type==="heal"?u.maxHp-(simulateDemo(index-1).find(x=>x.id===u.id)?.hp||0):simulateDemo(index-1).find(x=>x.id===u.id)?.hp||0)}</b>}
        </article>)}
      </div>
      <div className="demo-impact" aria-hidden="true">
        {move?.type==="shot"?"➶":move?.type==="spell"?"✦":move?.type==="heal"?"✚":move?.type==="finisher"?"✶":move?"⚡":"⚔"}
      </div>
      <div className="demo-cast demo-cast-enemies" aria-label="Lobos sombrios">
        {units.filter(u=>u.side==="enemy").map((u,i)=><article key={u.id} className="demo-unit demo-unit-enemy" style={{["--demo-order" as string]:i}} data-actor={move?.actor===u.id} data-hit={activeTargets.has(u.id)} data-dead={u.hp<=0}>
          <div className="demo-unit-figure"><img src={u.image} alt="Lobo sombrio"/></div>
          <div className="demo-unit-status"><strong>{i===2?"Líder sombrio":"Lobo "+(i+1)}</strong><span className="demo-hp"><i style={{width:percent(u)+"%"}}/></span><small>{u.hp}/{u.maxHp} PV</small></div>
          {activeTargets.has(u.id)&&<b className="demo-damage" key={index}>−{Math.min(move?.targets.find(t=>t.id===u.id)?.value||0,simulateDemo(index-1).find(x=>x.id===u.id)?.hp||0)}</b>}
        </article>)}
      </div>
      {special&&<div className="demo-video-overlay" aria-label={"Vídeo especial: "+move?.title}>
        <video ref={videoRef} key={move?.video+"-"+index} autoPlay muted playsInline preload="auto" onError={()=>setVideoError(true)} src={"/demo/arena-"+move?.video+".webm"}/>
        <div className="demo-video-title"><span>CENA ESPECIAL</span><strong>{move?.title}</strong></div>
      </div>}
      {move?.video && !special && <div className="demo-special-fallback" aria-hidden="true">{move.video==="arcane"?"✧":"⚔"}</div>}
      {atEnd&&<div className="demo-victory"><CheckCircle2 size={32}/><strong>CRIPTA LIBERTADA</strong><small>Demo concluída · nenhuma alteração na campanha</small></div>}
    </div>
    <div className="demo-live" role="status" aria-live="polite">
      <span><Zap size={14}/> {atEnd?"VITÓRIA DEMONSTRATIVA":!playing?"PRONTO PARA COMEÇAR":paused?"COMBATE PAUSADO":"AÇÃO AO VIVO"} <small>{Math.max(0,index+1)}/{SCRIPT.length}</small></span>
      <strong>{move?.title||"Heróis à entrada da cripta"}</strong>
      <p key={index}>{move?.narrative||"Toque em Iniciar batalha para testar as animações e os vídeos especiais."}</p>
    </div>
    <div className="demo-health-summary"><span><Swords size={15}/> {aliveHero} heróis de pé</span><span>{aliveEnemy} lobos restantes</span></div>
    <div className="demo-controls">
      {!playing?<button className="demo-primary" type="button" onClick={begin}><Play size={17}/> Iniciar batalha</button>:
        <button type="button" className="demo-primary" disabled={atEnd} onClick={togglePause}>{paused?<><Play size={16}/> Continuar</>:<><Pause size={16}/> Pausar</>}</button>}
      <button type="button" onClick={()=>setSpeed(s=>s===1?2:1)}><FastForward size={16}/> {speed}×</button>
      <button type="button" onClick={()=>setLite(s=>!s)}><Zap size={16}/> {lite?"Modo leve ON":"Modo leve OFF"}</button>
      <button type="button" disabled={!special} onClick={()=>setSkipVideo(true)}><SkipForward size={16}/> Pular vídeo</button>
      <button type="button" onClick={restart}><RotateCcw size={16}/> Reiniciar</button>
    </div>
    <p className="demo-footnote">A simulação é um roteiro fixo exclusivo para avaliação visual. A arena original e os resultados reais do combate não foram modificados. Os dois vídeos WebM são carregados do pacote offline; no modo leve são substituídos por efeitos simples.</p>
  </section>;
}
