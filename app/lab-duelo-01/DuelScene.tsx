import {useCallback,useEffect,useRef,useState} from "react";
import type {CSSProperties} from "react";

/**
 * LAB DUEL 01 — One visual proof, not a game update.
 * Self-contained articulated SVG duel: no game imports, no save, no production route.
 * Controls: ATTACK / ENTER / SPACE; client-side animation only.
 */
type Phase="idle"|"anticipation"|"dash"|"plant"|"swing"|"impact"|"reaction"|"recover"|"return";
type Pose={
 phase:Phase;heroX:number;heroY:number;heroTorso:number;heroBackLeg:number;heroFrontLeg:number;
 swordArm:number;shieldArm:number;cape:number;monsterX:number;monsterTorso:number;
 monsterHead:number;monsterArm:number;monsterSquash:number;slash:number;dust:number;hit:number;
};
const LENGTH=1700;
const lerp=(a:number,b:number,t:number)=>a+(b-a)*Math.max(0,Math.min(1,t));
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const easeOut=(v:number)=>1-Math.pow(1-clamp(v),3);
const pulse=(p:number,at:number,width:number)=>Math.max(0,1-Math.abs(p-at)/width);

/** A single deterministic timeline, readable by both the animation and tests. */
export function duelPose(ms:number):Pose{
 const t=Math.max(0,Math.min(LENGTH,ms));
 const p=t/LENGTH;
 const phase:Phase=t<170?"anticipation":t<430?"dash":t<550?"plant":
  t<785?"swing":t<840?"impact":t<1110?"reaction":t<1330?"recover":
  t<1680?"return":"idle";
 const anticipation=ease(t/170);
 const dash=easeOut((t-170)/260);
 const plant=ease((t-430)/120);
 const swing=ease((t-550)/235);
 const recoil=easeOut((t-785)/185);
 const calm=ease((t-1100)/230);
 const back=ease((t-1330)/350);
 const advance=t<170?0:t<430?dash:t<1330?1:1-back;
 const stride=t>=170&&t<430?Math.sin((t-170)/260*Math.PI*3.1):0;
 const isStrike=t>=550&&t<1110;
 const isRecoil=t>=785&&t<1320;
 const swordArm=t<170?lerp(-30,-103,anticipation):
   t<550?lerp(-103,-128,plant):t<785?lerp(-128,58,swing):
   t<1110?58:t<1330?lerp(58,-28,calm):-28;
 const heroTorso=t<170?lerp(0,-16,anticipation):
   t<430?lerp(-16,10,dash):t<550?lerp(10,-22,plant):
   t<785?lerp(-22,26,swing):t<1110?26:t<1330?lerp(26,0,calm):0;
 const monsterX=isRecoil?29*recoil:t>=1320?lerp(29,0,ease((t-1320)/350)):0;
 return {
  phase,heroX:185+380*advance,heroY:t>=170&&t<430?Math.abs(stride)*-8:0,
  heroTorso,heroBackLeg:t>=170&&t<430?stride*28:phase==="plant"?-21:
   isStrike?-27:t<170?-8*anticipation:0,
  heroFrontLeg:t>=170&&t<430?-stride*30:phase==="plant"?28:
   isStrike?24:t<170?14*anticipation:0,
  swordArm,shieldArm:phase==="dash"?-40:phase==="plant"?-16:isStrike?-8:8,
  cape:phase==="dash"?-20:phase==="swing"?14:phase==="return"?-14:0,
  monsterX,monsterTorso:isRecoil?lerp(0,24,recoil)*(1-calm*.25):t>=1320?lerp(24,0,ease((t-1320)/350)):0,
  monsterHead:isRecoil?22*recoil:t>=1320?lerp(22,0,ease((t-1320)/350)):0,
  monsterArm:isRecoil?-24*recoil:0,
  monsterSquash:isRecoil?lerp(1,.87,recoil):t>=1320?lerp(.87,1,ease((t-1320)/350)):1,
  slash:phase==="swing"?pulse(swing,.84,.44):phase==="impact"?1:0,
  dust:phase==="dash"?pulse((t-170)/260,.66,.5):phase==="plant"?1-plant:0,
  hit:phase==="impact"?1:phase==="reaction"?1-ease((t-840)/260):0
 };
}

function IdlePose(now:number):Pose{
 const base=duelPose(LENGTH);
 const breath=Math.sin(now/420);
 return {...base,heroY:breath*1.5,heroTorso:breath*.65,
  swordArm:-28+breath*1.6,monsterSquash:1+breath*.008,
  monsterHead:breath*.8,phase:"idle"};
}

function Warrior({pose}: {pose:Pose}){
 return <g data-testid="duel-warrior" transform={"translate("+pose.heroX+" "+(418+pose.heroY)+")"}>
  <ellipse cx="0" cy="5" rx="49" ry="9" fill="#040b13" opacity=".65"/>
  <g transform={"translate(-9 -100) rotate("+pose.heroBackLeg+")"}>
   <path d="M-11 0 L12 -1 17 43 11 75 23 89 19 100 -12 100 -16 83 -11 45Z" fill="#24384b" stroke="#09131e" strokeWidth="5"/>
   <path d="M-10 40 L15 38 15 55 -12 58Z" fill="#84939b"/>
   <path d="M-15 85 L14 83 24 95 17 102 -19 101Z" fill="#b7a897"/>
  </g>
  <g transform={"translate(15 -101) rotate("+pose.heroFrontLeg+")"}>
   <path d="M-12 0 L13 0 18 45 9 78 24 89 20 100 -15 100 -18 83 -11 43Z" fill="#334e65" stroke="#101924" strokeWidth="5"/>
   <path d="M-9 42 L14 40 13 57 -13 58Z" fill="#cad0c5"/>
   <path d="M-16 85 L13 85 28 98 18 103 -19 101Z" fill="#b9a588"/>
  </g>
  <g transform={"translate(0 -146) rotate("+pose.heroTorso+")"}>
   <path d={"M-28 0 Q-50 40 "+(-56+pose.cape)+" 99 L-8 80 19 12Z"} fill="#a33c37" stroke="#46242a" strokeWidth="4"/>
   <path d="M-30 -15 Q0 -32 29 -15 L39 54 18 72 -24 72 -42 41Z" fill="#3b6682" stroke="#0d1c2b" strokeWidth="6"/>
   <path d="M-25 -7 L-4 -23 16 -8 13 46 -7 59 -27 39Z" fill="#bfc9c9" stroke="#8a754b" strokeWidth="4"/>
   <path d="M7 -13 L26 -17 31 41 13 49Z" fill="#6f8696" stroke="#0a1a2a" strokeWidth="4"/>
   <path d="M-34 43 L38 44 29 57 -33 56Z" fill="#52362a" stroke="#bf984e" strokeWidth="3"/>
   <circle cx="4" cy="50" r="7" fill="#f7c771" stroke="#452919" strokeWidth="3"/>
   <g transform={"translate(-29 -10) rotate("+pose.shieldArm+")"}>
    <path d="M-2 -2 L-26 9 -36 52 -20 69 -5 40 3 8Z" fill="#c4b6a0" stroke="#172735" strokeWidth="5"/>
    <path d="M-27 24 L-54 9 -74 18 -76 54 -55 77 -28 60Z" fill="#32577a" stroke="#e8c682" strokeWidth="6"/>
    <path d="M-58 20 L-58 66 M-75 42 L-32 43" stroke="#e8c682" strokeWidth="5"/>
   </g>
   <path d="M-14 -31 L-16 -56 Q-9 -88 16 -84 35 -70 27 -40 L13 -21Z" fill="#b9c3c4" stroke="#1b2630" strokeWidth="5"/>
   <path d="M-16 -62 Q-17 -89 12 -92 38 -79 34 -59 L19 -68 11 -52 -7 -55Z" fill="#253644" stroke="#bdac7d" strokeWidth="4"/>
   <path d="M-11 -51 L25 -49 14 -38 -6 -40Z" fill="#dfbba1" stroke="#573d35" strokeWidth="2"/>
   <path d="M-12 -49 L-8 -44 M14 -47 L20 -44" stroke="#2c3139" strokeWidth="3"/>
   <g data-testid="duel-sword-arm" transform={"translate(26 -10) rotate("+pose.swordArm+")"}>
    <path d="M-2 -3 L21 3 38 22 63 14 69 28 36 39 18 25 1 22Z" fill="#b3bbc2" stroke="#1b2736" strokeWidth="5"/>
    <path d="M57 26 L83 22" stroke="#523b29" strokeWidth="10" strokeLinecap="round"/>
    <path d="M76 9 L83 37" stroke="#d8ab69" strokeWidth="8" strokeLinecap="round"/>
    <path d="M83 22 L179 12 204 18 179 30 83 30Z" fill="#e8f3fc" stroke="#4b6f8e" strokeWidth="4" strokeLinejoin="round"/>
    <path d="M85 22 L190 19" stroke="#ffffff" strokeWidth="3" opacity=".85"/>
   </g>
  </g>
 </g>;
}
function Monster({pose}: {pose:Pose}){
 return <g data-testid="duel-monster" transform={"translate("+(730+pose.monsterX)+" 420) scale(-1 "+pose.monsterSquash+")"}>
  <ellipse cx="0" cy="1" rx="65" ry="12" fill="#020b10" opacity=".7"/>
  <g transform="translate(-16 -79) rotate(-8)">
   <path d="M-21 0 L13 -2 20 53 35 68 26 79 -17 79 -24 54Z" fill="#49533b" stroke="#152123" strokeWidth="6"/>
  </g>
  <g transform="translate(19 -81) rotate(10)">
   <path d="M-17 0 L15 0 27 60 39 72 29 81 -18 80 -26 58Z" fill="#515c40" stroke="#17211f" strokeWidth="6"/>
  </g>
  <g transform={"translate(0 -129) rotate("+pose.monsterTorso+")"}>
   <path d="M-56 -22 Q0 -67 52 -26 L58 46 30 74 -35 74 -63 43Z" fill="#556b46" stroke="#243426" strokeWidth="7"/>
   <path d="M-34 -25 Q0 -37 30 -23 L36 39 -8 58 -42 26Z" fill="#879261" stroke="#2e3d28" strokeWidth="5"/>
   <path d="M-18 -9 L20 5 13 33 -18 30Z" fill="#59634b" stroke="#28372d" strokeWidth="5"/>
   <path d="M-32 -6 L-66 18 -77 57 -59 71 -45 38 -21 20Z" fill="#556247" stroke="#1c2d28" strokeWidth="6"/>
   <g transform={"translate(43 -14) rotate("+pose.monsterArm+")"}>
    <path d="M-4 -9 L29 4 49 33 66 41 60 59 25 47 12 22 -9 20Z" fill="#60734d" stroke="#213023" strokeWidth="6"/>
    <path d="M44 44 L72 41 89 58 70 57 77 70 59 61 48 67Z" fill="#c2c5a2" stroke="#39433b" strokeWidth="4"/>
   </g>
   <g transform={"translate(2 -51) rotate("+pose.monsterHead+")"}>
    <path d="M-44 -4 L-56 -43 -26 -30 Q2 -48 31 -27 L56 -46 46 -2 39 20 10 38 -33 24Z" fill="#647450" stroke="#283a2a" strokeWidth="6"/>
    <path d="M-30 -13 Q-22 -21 -5 -11 M10 -12 Q25 -25 35 -9" stroke="#182521" strokeWidth="7" strokeLinecap="round"/>
    <path d="M-24 -7 L-8 -4 M12 -4 L28 -9" stroke="#f0d57a" strokeWidth="6" strokeLinecap="round"/>
    <path d="M-24 16 L31 13 17 34 -8 35Z" fill="#261e1f" stroke="#111717" strokeWidth="4"/>
    <path d="M-15 15 L-7 25 0 15 M10 16 L17 25 26 15" stroke="#e5dfc2" strokeWidth="3"/>
    <path d="M-23 -38 L-38 -65 -12 -44 M31 -35 L48 -63 43 -25Z" fill="#d8d8bb" stroke="#354030" strokeWidth="5"/>
   </g>
  </g>
 </g>;
}

const STYLES=[
 '.duel-lab{width:100%;max-width:990px;margin:0 auto;padding:14px;color:#edf3ff;font-family:system-ui,sans-serif;background:#0c1727;border:1px solid #526781;border-radius:14px;box-sizing:border-box}',
 '.duel-lab *{box-sizing:border-box}',
 '.duel-lab__header{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:0 4px 10px}',
 '.duel-lab h2{font:700 clamp(18px,3vw,26px) Georgia,serif;margin:0;color:#ffdfa1}',
 '.duel-lab__note{font-size:11px;letter-spacing:.05em;color:#a8c5d4}',
 '.duel-lab__stage{width:100%;background:#101e30;border-radius:10px;overflow:hidden;position:relative;border:1px solid #6a788b}',
 '.duel-lab__stage svg{display:block;width:100%;height:auto;min-height:245px;max-height:550px}',
 '.duel-lab__controls{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:12px}',
 '.duel-lab button{min-height:47px;min-width:140px;background:linear-gradient(#ffda96,#c68f53);color:#13283a;border:2px solid #ffe9bc;border-radius:9px;padding:10px 18px;font-weight:850;font-size:15px;cursor:pointer;touch-action:manipulation}',
 '.duel-lab button:disabled{filter:grayscale(.7);cursor:wait;opacity:.8}',
 '.duel-lab button:focus-visible{outline:3px solid #b6e8ff;outline-offset:3px}',
 '.duel-lab__status{min-width:150px;color:#cfdfec;font-size:13px;text-align:center}',
 '.duel-lab__status strong{color:#ffdfa1}',
 '.duel-lab__footer{font:12px/1.5 system-ui;color:#b0c4d7;margin:12px 3px 0}',
 '@media (max-width:540px){.duel-lab{padding:7px;border-radius:7px}.duel-lab__note{font-size:10px}.duel-lab__stage svg{min-height:230px}.duel-lab__controls{flex-direction:column}.duel-lab button{width:100%}}',
 '@media (prefers-reduced-motion:reduce){.duel-lab__status{transition:none}}'
].join('\n');

export default function DuelScene(){
 const [ms,setMs]=useState<number|null>(null);
 const [idleMs,setIdleMs]=useState(0);
 const clock=useRef(0);
 const raf=useRef<number|null>(null);
 const [prefersReduced,setPrefersReduced]=useState(false);
 useEffect(()=>{
  const mq=window.matchMedia("(prefers-reduced-motion: reduce)");
  const onChange=()=>setPrefersReduced(mq.matches);
  onChange();mq.addEventListener("change",onChange);
  return ()=>mq.removeEventListener("change",onChange);
 },[]);
 useEffect(()=>{
  if(prefersReduced)return;
  let frame=0;
  let last=0;
  const idle=(now:number)=>{
   if(now-last>=42){last=now;setIdleMs(now);}
   frame=requestAnimationFrame(idle);
  };
  frame=requestAnimationFrame(idle);
  return ()=>cancelAnimationFrame(frame);
 },[prefersReduced]);
 const attack=useCallback(()=>{
  if(raf.current!==null)return;
  if(prefersReduced){
   setMs(805);
   window.setTimeout(()=>setMs(null),450);
   return;
  }
  clock.current=performance.now();
  const tick=(now:number)=>{
   const elapsed=Math.min(LENGTH,now-clock.current);
   setMs(elapsed);
   if(elapsed>=LENGTH){raf.current=null;setMs(null);return;}
   raf.current=requestAnimationFrame(tick);
  };
  raf.current=requestAnimationFrame(tick);
 },[prefersReduced]);
 useEffect(()=>()=>{if(raf.current!==null)cancelAnimationFrame(raf.current);},[]);
 const pose=ms===null?IdlePose(idleMs):duelPose(ms);
 const label=ms===null?"PRONTO":({
  anticipation:"PREPARANDO","dash":"AVANÇANDO","plant":"FIRMANDO A BASE",
  swing:"GOLPE DE ESPADA","impact":"IMPACTO","reaction":"INIMIGO RECUANDO",
  recover:"RECUPERANDO","return":"RETORNANDO","idle":"PRONTO"
 } as Record<Phase,string>)[pose.phase];
 const camera=ms!==null&&pose.hit>0?"translate("+(Math.sin(ms*.22)*pose.hit*2.5).toFixed(1)+" 0)":"";
 const slashPath="M0 -80 Q104 -132 184 -4";
 return <section className="duel-lab" aria-label="Laboratório isolado: guerreiro contra monstro" data-lab="duel-01" data-phase={pose.phase} data-hero-x={pose.heroX.toFixed(1)} data-monster-x={pose.monsterX.toFixed(1)}>
  <style>{STYLES}</style>
  <div className="duel-lab__header"><h2>Duelo 01 — prova de movimento</h2>
   <span className="duel-lab__note">CENA ISOLADA · SEM MOTOR DO JOGO</span></div>
  <div className="duel-lab__stage">
   <svg role="img" aria-label="Guerreiro articulado avança, golpeia o monstro e retorna à formação"
     viewBox="0 0 900 500" preserveAspectRatio="xMidYMid meet">
    <defs>
     <linearGradient id="duel-sky" x1="0" y1="0" x2="0" y2="1">
      <stop stopColor="#111d30"/><stop offset=".63" stopColor="#293e57"/><stop offset="1" stopColor="#1a2c3c"/>
     </linearGradient>
     <linearGradient id="duel-floor" x1="0" y1="0" x2="0" y2="1">
      <stop stopColor="#4f5660"/><stop offset="1" stopColor="#151f2b"/>
     </linearGradient>
     <radialGradient id="duel-moon"><stop stopColor="#dbecff" stopOpacity=".5"/><stop offset="1" stopColor="#a8c7e1" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="900" height="500" fill="url(#duel-sky)"/>
    <circle cx="580" cy="115" r="138" fill="url(#duel-moon)"/>
    <circle cx="580" cy="115" r="30" fill="#d4dfeb" opacity=".62"/>
    <path d="M0 275 L90 172 170 238 295 139 393 237 510 170 605 255 720 134 820 210 900 170 900 360 0 360Z" fill="#162739"/>
    <path d="M0 322 L101 244 202 317 313 250 431 310 532 236 660 307 777 244 900 325 900 420 0 420Z" fill="#243347"/>
    <path d="M0 417 L900 417 900 500 0 500Z" fill="url(#duel-floor)"/>
    {Array.from({length:13},(_,i)=><path key={i} d={"M"+(i*92-110)+" 435 l105 -16 50 81"} fill="none" stroke="#79818a" opacity=".21" strokeWidth="2"/>)}
    <path d="M0 453 Q420 429 900 457" stroke="#96a1ad" opacity=".18" strokeWidth="4" fill="none"/>
    <g transform={camera}>
     <Monster pose={pose}/>
     <Warrior pose={pose}/>
     {pose.dust>0&&<g data-testid="duel-dust" opacity={pose.dust}>
      <ellipse cx={pose.heroX-24} cy="424" rx="60" ry="15" fill="#b7b4aa" opacity=".32"/>
      <circle cx={pose.heroX-53} cy="400" r="9" fill="#c0bbc0" opacity=".42"/>
      <circle cx={pose.heroX+12} cy="406" r="6" fill="#c0bbc0" opacity=".32"/>
     </g>}
     {pose.slash>0&&<g data-testid="duel-slash" transform="translate(589 280)" opacity={pose.slash}>
      <path d={slashPath} fill="none" stroke="#d8f3ff" strokeWidth="17" opacity=".3" strokeLinecap="round"/>
      <path d={slashPath} fill="none" stroke="#f5faff" strokeWidth="5" strokeLinecap="round"/>
     </g>}
     {pose.hit>0&&<g data-testid="duel-impact" opacity={pose.hit}>
      <circle cx="689" cy="293" r={40+pose.hit*26} fill="none" stroke="#ffeaa8" strokeWidth="7"/>
      <path d="M689 223 V195 M689 364 V394 M620 292 H587 M755 292 H790 M642 246 l-28 -28 M741 246 l28 -28" stroke="#fff2b5" strokeWidth="8" strokeLinecap="round"/>
     </g>}
    </g>
    <rect x="15" y="16" width="292" height="39" rx="8" fill="#0c1c31" opacity=".88"/>
    <text x="30" y="43" fill="#ffdfac" fontSize="19" fontWeight="bold">GUERREIRO vs MONSTRO</text>
    <text x="24" y="483" fill="#d5e5eb" fontSize="16">Articulação real de braços, pernas, arma e torso</text>
   </svg>
  </div>
  <div className="duel-lab__controls">
   <button type="button" onClick={attack} disabled={ms!==null} aria-label="Atacar o monstro e ver a animação completa">
    {ms===null?"⚔ ATACAR / REPETIR":"GOLPE EM ANDAMENTO"}
   </button>
   <span role="status" className="duel-lab__status">Fase: <strong>{label}</strong></span>
  </div>
  <p className="duel-lab__footer">Protótipo visual independente. Nenhum ponto de vida, inventário ou progresso do jogo é alterado.
   {prefersReduced?" Movimento reduzido: exibição de impacto sem sequência acelerada.":""}</p>
 </section>;
}
