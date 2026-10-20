import {useCallback,useEffect,useRef,useState} from "react";
import type {CSSProperties} from "react";

/**
 * LAB DUEL 01 — One visual proof, not a game update.
 * Self-contained articulated SVG duel: no game imports, no save, no production route.
 * Controls: ATTACK / ENTER / SPACE; client-side animation only.
 */
type Phase="idle"|"anticipation"|"dash"|"plant"|"swing"|"impact"|"reaction"|"recover"|"return"|"enemyApproach"|"enemyWindup"|"block"|"counterWindup"|"counterSwing"|"counterImpact"|"stagger"|"disengage";
export type AttackStyle="slash"|"heavy"|"exchange";
const HEAVY_LENGTH=2280;
const EXCHANGE_LENGTH=3000;
type Pose={
 phase:Phase;heroX:number;heroY:number;heroTorso:number;heroBackLeg:number;heroFrontLeg:number;
 swordArm:number;heroElbow:number;heroWrist:number;shieldArm:number;cape:number;monsterX:number;monsterTorso:number;monsterY:number;monsterFrontLeg:number;monsterBackLeg:number;
 monsterHead:number;monsterArm:number;monsterSquash:number;slash:number;dust:number;hit:number;blockFx:number;clawFx:number;
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
 // Fases controladas em milissegundos, não em porcentagens arbitrárias.
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
  swordArm,
  heroElbow:phase==="swing"?lerp(-24,23,swing):phase==="impact"?23:
   phase==="reaction"?lerp(23,5,ease((t-840)/270)):phase==="recover"?lerp(5,-10,calm):-10,
  heroWrist:phase==="swing"?lerp(-12,14,swing):phase==="impact"?14:0,
  shieldArm:phase==="dash"?-40:phase==="plant"?-16:isStrike?-8:8,
  cape:phase==="dash"?-20:phase==="swing"?14:phase==="return"?-14:0,
  monsterX,
  monsterY:isRecoil?9*recoil:t>=1320?lerp(9,0,ease((t-1320)/350)):0,
  monsterFrontLeg:isRecoil?19*recoil:t>=1320?lerp(19,0,ease((t-1320)/350)):0,
  monsterBackLeg:isRecoil?-17*recoil:t>=1320?lerp(-17,0,ease((t-1320)/350)):0,
  monsterTorso:isRecoil?lerp(0,24,recoil)*(1-calm*.25):t>=1320?lerp(24,0,ease((t-1320)/350)):0,
  monsterHead:isRecoil?22*recoil:t>=1320?lerp(22,0,ease((t-1320)/350)):0,
  monsterArm:isRecoil?-24*recoil:0,
  monsterSquash:isRecoil?lerp(1,.87,recoil):t>=1320?lerp(.87,1,ease((t-1320)/350)):1,
  slash:phase==="swing"?pulse(swing,.84,.44):phase==="impact"?1:0,
  dust:phase==="dash"?pulse((t-170)/260,.66,.5):phase==="plant"?1-plant:0,
  hit:phase==="impact"?1:phase==="reaction"?1-ease((t-840)/260):0,blockFx:0,clawFx:0
 };
}


/** Duelo 03: the original approved slash remains unchanged. Heavy attack uses
 * a slower contact and a wider actual articulated recoil, not extra fake damage.
 * Time map preserves the eight named phases for honest browser verification. */
export function duelHeavyPose(ms:number):Pose{
 const t=Math.max(0,Math.min(HEAVY_LENGTH,ms));
 const scaled=t*LENGTH/HEAVY_LENGTH;
 const base=duelPose(scaled);
 const pre=ease(t/(170*HEAVY_LENGTH/LENGTH));
 const dash=(scaled>=170&&scaled<430)?Math.sin((scaled-170)/260*Math.PI*3.1):0;
 const swing=ease((scaled-550)/235);
 const after=easeOut((scaled-785)/185);
 const reset=ease((scaled-1330)/350);
 const recoiling=scaled>=785&&scaled<1320;
 return {...base,
  heroY:base.heroY-(base.phase==="plant"?8:0),
  heroTorso:base.phase==="anticipation"?-26*pre:base.phase==="plant"?-33:
   base.phase==="swing"?lerp(-33,39,swing):base.phase==="impact"||base.phase==="reaction"?39:base.heroTorso,
  heroFrontLeg:base.phase==="dash"?-dash*36:base.phase==="plant"?35:
   base.phase==="swing"||base.phase==="impact"?34:base.heroFrontLeg,
  heroBackLeg:base.phase==="dash"?dash*32:base.phase==="plant"?-33:
   base.phase==="swing"||base.phase==="impact"?-31:base.heroBackLeg,
  swordArm:base.phase==="anticipation"?lerp(-30,-137,pre):
   base.phase==="dash"?-137:base.phase==="plant"?-145:
   base.phase==="swing"?lerp(-145,73,swing):
   base.phase==="impact"||base.phase==="reaction"?73:base.swordArm,
  heroElbow:base.phase==="anticipation"?lerp(-10,-52,pre):
   base.phase==="dash"||base.phase==="plant"?-52:
   base.phase==="swing"?lerp(-52,44,swing):
   base.phase==="impact"||base.phase==="reaction"?44:base.heroElbow,
  heroWrist:base.phase==="anticipation"?lerp(0,-16,pre):
   base.phase==="dash"||base.phase==="plant"?-16:
   base.phase==="swing"?lerp(-16,23,swing):
   base.phase==="impact"||base.phase==="reaction"?23:base.heroWrist,
  shieldArm:base.phase==="plant"?-48:base.phase==="swing"?lerp(-48,19,swing):base.shieldArm,
  cape:base.phase==="dash"?-30:base.phase==="swing"?22:base.cape,
  monsterX:recoiling?52*after:scaled>=1320?lerp(52,0,reset):0,
  monsterY:recoiling?20*after:scaled>=1320?lerp(20,0,reset):0,
  monsterTorso:recoiling?43*after:scaled>=1320?lerp(43,0,reset):0,
  monsterHead:recoiling?38*after:scaled>=1320?lerp(38,0,reset):0,
  monsterArm:recoiling?-47*after:scaled>=1320?lerp(-47,0,reset):0,
  monsterFrontLeg:recoiling?31*after:scaled>=1320?lerp(31,0,reset):0,
  monsterBackLeg:recoiling?-32*after:scaled>=1320?lerp(-32,0,reset):0,
  monsterSquash:recoiling?lerp(1,.74,after):scaled>=1320?lerp(.74,1,reset):1,
  slash:base.phase==="swing"?pulse(swing,.79,.52):base.slash,
  hit:base.hit
 };
}


/** Duelo 04: an honest reciprocal exchange, not two characters doing idle poses.
 * Monster crosses arena on articulated legs, telegraphs a claw strike,
 * warrior moves shield into the attack path, absorbs hit, counterattacks,
 * monster staggers with staggered legs, both disengage.
 * No game engine events or fake damage are created.
 */
export function duelExchangePose(ms:number):Pose{
 const t=Math.max(0,Math.min(EXCHANGE_LENGTH,ms));
 const base=duelPose(LENGTH);
 const phase:Phase=t<500?"enemyApproach":t<780?"enemyWindup":t<1020?"block":
  t<1260?"counterWindup":t<1670?"counterSwing":t<1780?"counterImpact":
  t<2300?"stagger":t<2990?"disengage":"idle";
 const arrival=easeOut(t/500);
 const brace=ease((t-500)/280);
 const claw=ease((t-780)/240);
 const counterReady=ease((t-1020)/240);
 const sword=ease((t-1260)/410);
 const recoil=easeOut((t-1780)/350);
 const retreat=ease((t-2300)/690);
 const monsterAt=730-310*arrival;
 const monsterX=t<1020?monsterAt-730:
  t<1780?-310+20*ease((t-1020)/760):
  t<2300?-290+125*recoil:
  -165+165*retreat;
 const heroX=t<500?185+60*arrival:
  t<1020?245+60*brace:
  t<1260?305:
  t<1780?305+43*sword:
  t<2300?348:348-163*retreat;
 const attackArm=t<500?14:
  t<780?lerp(14,-132,brace):
  t<1020?lerp(-132,62,claw):
  t<1260?lerp(62,20,counterReady):
  t<1780?20:
  t<2300?lerp(20,-31,recoil):lerp(-31,0,retreat);
 const blockGrip=t<500?8:
  t<780?lerp(8,-171,brace):
  t<1020?-171:
  t<1260?lerp(-171,-9,counterReady):
  t<2300?-9:lerp(-9,8,retreat);
 const swordArm=t<1020?-27:
  t<1260?lerp(-27,-124,counterReady):
  t<1670?lerp(-124,69,sword):
  t<2300?69:lerp(69,-28,retreat);
 const braceStrike=t>=780&&t<1020;
 const contact=t>=1670&&t<1780;
 return {...base,phase,
  heroX,heroY:t>=780&&t<1020?3*claw:t>=1260&&t<1670?-3*Math.sin(sword*Math.PI):0,
  heroTorso:t<500?0:t<1020?lerp(0,-15,brace):
   t<1260?lerp(-15,-29,counterReady):
   t<1670?lerp(-29,32,sword):
   t<2300?32:lerp(32,0,retreat),
  heroBackLeg:t<500?-6*Math.sin(t/70):
   t<1260?-22:t<2300?-35:lerp(-35,0,retreat),
  heroFrontLeg:t<500?6*Math.sin(t/70):
   t<1260?26:t<2300?33:lerp(33,0,retreat),
  shieldArm:blockGrip,swordArm,
  heroElbow:t<1020?-10:t<1260?lerp(-10,-45,counterReady):
   t<1670?lerp(-45,43,sword):t<2300?43:lerp(43,-10,retreat),
  heroWrist:t<1260?0:t<1670?lerp(-13,22,sword):t<2300?22:lerp(22,0,retreat),
  cape:t<500?-11:t<1020?-8:t<1780?18:t<2300?-5:lerp(-5,0,retreat),
  monsterX,
  monsterY:t>=1780&&t<2300?10*recoil:t>=2300?lerp(10,0,retreat):0,
  monsterFrontLeg:t<500?31*Math.sin(t/83):
   t<1780?24:t<2300?lerp(24,37,recoil):lerp(37,0,retreat),
  monsterBackLeg:t<500?-31*Math.sin(t/83):
   t<1780?-22:t<2300?lerp(-22,-34,recoil):lerp(-34,0,retreat),
  monsterTorso:t<500?-9:t<780?lerp(-9,-27,brace):
   t<1020?lerp(-27,22,claw):
   t<1780?lerp(22,4,ease((t-1020)/650)):
   t<2300?lerp(4,46,recoil):lerp(46,0,retreat),
  monsterHead:t<1780?-6:t<2300?33*recoil:lerp(33,0,retreat),
  monsterArm:attackArm,
  monsterSquash:t<1780?1:t<2300?lerp(1,.75,recoil):lerp(.75,1,retreat),
  slash:t>=1260&&t<1780?(contact?1:pulse(sword,.85,.45)):0,
  dust:t<500?pulse(t/500,.5,.55):t>=2300?pulse(retreat,.4,.45):0,
  hit:contact?1:t>=1780&&t<2020?1-ease((t-1780)/240):0,
  blockFx:braceStrike?pulse(claw,.8,.38):0,
  clawFx:t>=780&&t<1020?pulse(claw,.65,.55):0
 };
}

function IdlePose(now:number):Pose{
 const base=duelPose(LENGTH);
 const breath=Math.sin(now/420);
 return {...base,heroY:breath*1.5,heroTorso:breath*.65,
  swordArm:-28+breath*1.6,monsterSquash:1+breath*.008,
  monsterHead:breath*.8,phase:"idle"};
}

/* V2 art: detailed jointed 2D characters, still driven by EXACT SAME duelPose timeline. */
function Warrior({pose}:{pose:Pose}){
 return <g data-testid="duel-warrior" transform={"translate("+pose.heroX+" "+(418+pose.heroY)+") scale(1.13)"}>
  <ellipse cx="2" cy="4" rx="50" ry="9" fill="#020712" opacity=".67"/>
  {/* Back boot and leg: separate pivot at hip */}
  <g data-testid="duel-back-leg" transform={"translate(-10 -101) rotate("+pose.heroBackLeg+")"}>
   <path d="M-13 0 L13 -4 21 38 10 67 14 87 26 97 16 104 -19 103 -20 87 -15 64 -18 34Z" fill="url(#duel-trouser)" stroke="#111827" strokeWidth="5"/>
   <path d="M-17 37 L17 32 14 47 -13 55Z" fill="url(#duel-steel)" stroke="#0c1927" strokeWidth="3"/>
   <path d="M-14 53 L12 50 14 86 -17 90Z" fill="#53657b" stroke="#1f3148" strokeWidth="3"/>
   <path d="M-16 58 L11 54 M-16 67 L10 64 M-16 75 L12 73" stroke="#b7c3c5" strokeWidth="2.5" opacity=".55"/>
   <path d="M-18 85 L14 84 30 98 25 105 -22 105Z" fill="#292f3c" stroke="#b6a16e" strokeWidth="3"/>
   <path d="M-10 92 L17 93 M-14 98 L23 99" stroke="#bdc9c1" strokeWidth="2" opacity=".65"/>
  </g>
  {/* Front boot and leg, different stride to prove independent joints */}
  <g data-testid="duel-front-leg" transform={"translate(13 -101) rotate("+pose.heroFrontLeg+")"}>
   <path d="M-13 -1 L16 -5 19 34 10 61 15 89 29 98 19 106 -19 104 -22 87 -18 64 -21 33Z" fill="url(#duel-trouser)" stroke="#0a1727" strokeWidth="5"/>
   <path d="M-19 38 L16 35 12 56 -17 56Z" fill="url(#duel-steel)" stroke="#1a2a3c" strokeWidth="3"/>
   <path d="M-19 56 L13 55 16 87 -20 90Z" fill="#657991" stroke="#283c52" strokeWidth="3"/>
   <path d="M-18 66 L12 64 M-20 77 L14 74" stroke="#deeadf" strokeWidth="2.5" opacity=".5"/>
   <path d="M-20 87 L17 86 30 101 20 107 -23 105Z" fill="#303a4a" stroke="#ddc487" strokeWidth="3"/>
   <path d="M-18 100 L26 101" stroke="#dce5e2" strokeWidth="2" opacity=".6"/>
  </g>
  <g data-testid="duel-torso" transform={"translate(0 -146) rotate("+pose.heroTorso+")"}>
   {/* Cape follows run direction independently */}
   <path d={"M-25 -4 Q-47 10 "+(-59+pose.cape)+" 62 L"+(-55+pose.cape)+" 101 -18 79 24 3Z"} fill="url(#duel-cape)" stroke="#3c1723" strokeWidth="4"/>
   <path d={"M-31 7 Q-51 61 "+(-52+pose.cape)+" 89 L-24 74"} fill="none" stroke="#ed8663" strokeWidth="2" opacity=".65"/>
   <path d="M-27 61 L-26 75 -12 83" fill="none" stroke="#e8aa7c" strokeWidth="2" opacity=".45"/>
   {/* Rigid plated torso: three distinct metal layers and a belt */}
   <path d="M-32 -15 Q0 -32 33 -16 L43 37 29 64 -31 64 -46 36Z" fill="url(#duel-steel)" stroke="#071522" strokeWidth="6"/>
   <path d="M-34 -7 L-6 -23 17 -14 19 18 -2 34 -30 22Z" fill="url(#duel-armor-blue)" stroke="#afc7d1" strokeWidth="3"/>
   <path d="M5 -19 L30 -10 34 28 5 45 -2 31 18 15Z" fill="#425d77" stroke="#1e334a" strokeWidth="4"/>
   <path d="M-22 25 L3 43 27 28 22 52 0 61 -23 47Z" fill="url(#duel-steel)" stroke="#283d52" strokeWidth="3"/>
   <path d="M-26 36 L-7 48 6 45 25 35" fill="none" stroke="#edf5ed" strokeWidth="2" opacity=".56"/>
   <path d="M-36 45 L37 45 32 58 -32 58Z" fill="#62432e" stroke="#d6a762" strokeWidth="3"/>
   <path d="M-24 57 L-34 83 -10 91 8 75 24 88 37 77 26 57Z" fill="#23394e" stroke="#c59e5b" strokeWidth="3"/>
   <path d="M-10 67 L2 80 14 67" fill="none" stroke="#dce3d2" strokeWidth="3" opacity=".8"/>
   <circle cx="2" cy="50" r="9" fill="url(#duel-gold)" stroke="#3c291a" strokeWidth="3"/>
   <circle cx="2" cy="50" r="3" fill="#fff4b7"/>
   {/* Left shoulder, arm and shield are separately rotated */}
   <g data-testid="duel-shield-arm" transform={"translate(-30 -12) rotate("+pose.shieldArm+")"}>
    <path d="M0 -7 L-27 4 -41 44 -27 64 -12 49 5 10Z" fill="url(#duel-steel)" stroke="#132337" strokeWidth="5"/>
    <path d="M-25 25 L-48 20 -63 41 -60 59 -30 64Z" fill="#758695" stroke="#1f2c3c" strokeWidth="3"/>
    <path d="M-24 15 L-55 -2 -80 15 -82 56 -55 87 -21 65Z" fill="url(#duel-shield)" stroke="url(#duel-gold)" strokeWidth="6" strokeLinejoin="round"/>
    <path d="M-51 3 L-55 81 M-74 37 L-27 38" stroke="#cfc3a0" strokeWidth="3" opacity=".7"/>
    <path d="M-54 14 L-37 38 -55 68 -71 38Z" fill="#8eafc0" stroke="url(#duel-gold)" strokeWidth="3"/>
    <path d="M-55 28 L-46 39 -55 57 -64 39Z" fill="#f6d58a"/>
    <circle cx="-55" cy="39" r="4.5" fill="#fbf6d3"/>
    <circle cx="-56" cy="6" r="3" fill="#d5dfe4"/><circle cx="-74" cy="34" r="3" fill="#d5dfe4"/>
    <circle cx="-35" cy="36" r="3" fill="#d5dfe4"/><circle cx="-55" cy="72" r="3" fill="#d5dfe4"/>
   </g>
   {/* Helm is separate art, centered over chest */}
   <path d="M-15 -30 L-19 -58 Q-15 -85 10 -92 36 -79 29 -46 L18 -25Z" fill="#465a6f" stroke="#152334" strokeWidth="5"/>
   <path d="M-18 -56 Q-22 -87 6 -94 30 -89 38 -66 L30 -52 16 -60 12 -45 -8 -50Z" fill="url(#duel-steel)" stroke="#c9aa68" strokeWidth="4"/>
   <path d="M-10 -86 Q5 -101 22 -92 L8 -107 -6 -101Z" fill="#b34d43" stroke="#582f38" strokeWidth="3"/>
   <path d="M-6 -90 Q5 -103 14 -99" fill="none" stroke="#f3a16e" strokeWidth="2"/>
   <path d="M-15 -54 L29 -52 18 -35 -8 -36Z" fill="#dda98b" stroke="#75483d" strokeWidth="3"/>
   <path d="M-14 -53 L-10 -46 23 -46 29 -56" fill="none" stroke="#14283c" strokeWidth="4"/>
   <path d="M-8 -48 L-2 -46 M13 -48 L20 -46" stroke="#263039" strokeWidth="3"/>
   <path d="M-2 -33 L17 -33 11 -27Z" fill="#6b4d45"/>
   {/* Sword: shoulder rotation, elbow metal, articulated blade */}
   <g data-testid="duel-sword-arm" transform={"translate(27 -12) rotate("+pose.swordArm+")"}>
    <path d="M-6 -11 L18 -7 43 17 43 34 17 27 -4 18Z" fill="url(#duel-steel)" stroke="#102234" strokeWidth="5"/>
    <circle cx="43" cy="23" r="12" fill="#647b8c" stroke="#d3c8ad" strokeWidth="3"/>
    <g data-testid="duel-forearm" transform={"translate(43 23) rotate("+pose.heroElbow+") translate(-43 -23)"}>
    <path d="M12 1 L35 20 22 33 -1 13Z" fill="url(#duel-armor-blue)" stroke="#bdccd2" strokeWidth="3"/>
    <path d="M35 16 L58 12 70 26 52 38 37 33Z" fill="#8e9ea4" stroke="#213047" strokeWidth="3"/>
    <path d="M53 19 L72 21 76 34 55 35Z" fill="#e5b998" stroke="#604b3e" strokeWidth="3"/>
    <path d="M60 27 L88 23" fill="none" stroke="#4c3028" strokeWidth="11" strokeLinecap="round"/>
    <path d="M63 28 L81 26" fill="none" stroke="#e1b166" strokeWidth="2.5"/>
    <path d="M80 11 L86 38" stroke="#e5b66e" strokeWidth="9" strokeLinecap="round"/>
    <circle cx="82" cy="25" r="6" fill="url(#duel-gold)" stroke="#402c26" strokeWidth="2"/>
    <g data-testid="duel-wrist" transform={"translate(83 25) rotate("+pose.heroWrist+") translate(-83 -25)"}>
    <path d="M84 21 L174 10 208 18 179 32 84 31Z" fill="url(#duel-blade)" stroke="#496c86" strokeWidth="4" strokeLinejoin="round"/>
    <path d="M93 23 L199 19" fill="none" stroke="#ffffff" strokeWidth="3" opacity=".85"/>
    <path d="M119 28 L183 28" fill="none" stroke="#5587a9" strokeWidth="2" opacity=".65"/>
    </g>
    </g>
   </g>
  </g>
 </g>;
}

function Monster({pose}:{pose:Pose}){
 return <g data-testid="duel-monster" transform={"translate("+(730+pose.monsterX)+" "+(420+pose.monsterY)+") scale(-1.11 "+(1.11*pose.monsterSquash)+")"}>
  <ellipse cx="0" cy="4" rx="70" ry="11" fill="#020a14" opacity=".68"/>
  <g data-testid="duel-monster-back-leg" transform={"translate(-19 -82) rotate("+(-9+pose.monsterBackLeg)+")"}>
   <path d="M-26 -4 L16 -3 25 37 22 57 39 71 30 82 -27 79 -28 62 -18 31Z" fill="url(#duel-goblin)" stroke="#15251d" strokeWidth="6"/>
   <path d="M-22 49 L23 48 27 64 -26 67Z" fill="#44483e" stroke="#9ea176" strokeWidth="3"/>
   <path d="M-24 70 L35 73 29 83 -28 82Z" fill="#1f3027" stroke="#73805a" strokeWidth="3"/>
  </g>
  <g data-testid="duel-monster-front-leg" transform={"translate(19 -84) rotate("+(10+pose.monsterFrontLeg)+")"}>
   <path d="M-20 -2 L20 0 29 38 22 60 44 72 36 84 -21 82 -29 57 -15 30Z" fill="url(#duel-goblin)" stroke="#18291f" strokeWidth="6"/>
   <path d="M-25 48 L27 46 30 64 -27 65Z" fill="#424e39" stroke="#aaa47a" strokeWidth="3"/>
   <path d="M-26 73 L42 75 35 86 -28 84Z" fill="#203729" stroke="#758766" strokeWidth="3"/>
  </g>
  <g data-testid="duel-monster-torso" transform={"translate(0 -129) rotate("+pose.monsterTorso+")"}>
   {/* Spiked hide and leather armor */}
   <path d="M-65 -13 L-72 -47 -46 -39 -25 -58 -6 -35 22 -55 47 -38 72 -46 65 -11 66 45 39 81 -39 82 -69 41Z" fill="url(#duel-goblin)" stroke="#182c20" strokeWidth="7"/>
   <path d="M-46 -25 L-18 -39 22 -38 45 -22 51 47 19 68 -27 64 -53 40Z" fill="url(#duel-goblin-armor)" stroke="#32462b" strokeWidth="4"/>
   <path d="M-46 14 L51 20 M-36 47 L36 54" stroke="#adb581" strokeWidth="3" opacity=".4"/>
   <path d="M-40 -25 L-14 -32 -12 -13 -34 -9Z" fill="#d6d2a3" stroke="#525f40" strokeWidth="3"/>
   <path d="M24 -30 L47 -23 45 -8 17 -15Z" fill="#d6d2a3" stroke="#525f40" strokeWidth="3"/>
   <path d="M-14 -31 L22 9 -11 52" fill="none" stroke="#493c2b" strokeWidth="9" strokeLinecap="round"/>
   <path d="M-16 -30 L21 10 -13 54" fill="none" stroke="#b49964" strokeWidth="2.5"/>
   <path d="M-30 52 L35 53" stroke="#3a3029" strokeWidth="10"/>
   <path d="M-31 52 L35 53" stroke="#ae9462" strokeWidth="3"/>
   <circle cx="3" cy="53" r="6" fill="#b79f64" stroke="#463628" strokeWidth="3"/>
   {/* Left claw */}
   <g data-testid="duel-monster-back-arm" transform="translate(-38 -8) rotate(6)">
    <path d="M-9 1 L-34 5 -55 40 -74 50 -72 67 -44 61 -15 29 0 22Z" fill="url(#duel-goblin)" stroke="#1a2d23" strokeWidth="6"/>
    <path d="M-66 48 L-87 41 -91 55 -71 57 M-65 57 L-82 74 -67 69" fill="#d2d0a3" stroke="#35402b" strokeWidth="3"/>
   </g>
   {/* Front arm rotates independently to sell hit recoil */}
   <g data-testid="duel-monster-front-arm" transform={"translate(43 -13) rotate("+pose.monsterArm+")"}>
    <path d="M-8 -11 L25 -6 45 26 65 36 58 56 22 49 5 25 -12 19Z" fill="url(#duel-goblin)" stroke="#1b2b22" strokeWidth="6"/>
    <path d="M26 22 L51 32 45 44 19 35Z" fill="#594a38" stroke="#aa9064" strokeWidth="3"/>
    <path d="M47 45 L72 34 88 47 69 49 80 61 62 54 54 68 41 55Z" fill="#d4d1a2" stroke="#38432e" strokeWidth="3"/>
   </g>
   <g data-testid="duel-monster-head" transform={"translate(2 -51) rotate("+pose.monsterHead+")"}>
    <path d="M-42 -6 L-68 -50 -37 -40 -25 -57 0 -45 26 -57 40 -41 69 -54 46 -3 43 19 14 38 -30 29Z" fill="url(#duel-goblin)" stroke="#243a29" strokeWidth="6"/>
    <path d="M-44 -22 L-64 -47 -32 -32Z" fill="#b1a877" stroke="#3a5033" strokeWidth="3"/>
    <path d="M39 -27 L65 -49 45 -8Z" fill="#abb785" stroke="#3a5033" strokeWidth="3"/>
    <path d="M-29 -24 L-35 -51 -9 -42Z" fill="#d2d4ae" stroke="#455b3d" strokeWidth="3"/>
    <path d="M30 -22 L35 -51 11 -41Z" fill="#dbd8ad" stroke="#455b3d" strokeWidth="3"/>
    <path d="M-35 -12 L-8 -17 -1 -3 -27 4Z" fill="#29382c" stroke="#161f1d" strokeWidth="3"/>
    <path d="M5 -2 L17 -18 38 -12 35 4Z" fill="#26382d" stroke="#1a251f" strokeWidth="3"/>
    <path d="M-28 -7 L-7 -5 M15 -5 L34 -9" stroke="#fae49a" strokeWidth="6" strokeLinecap="round"/>
    <circle cx="-14" cy="-4" r="2.5" fill="#ffffff"/><circle cx="27" cy="-7" r="2.5" fill="#ffffff"/>
    <path d="M-11 7 L12 8 3 20Z" fill="#42533a" stroke="#1b2b24" strokeWidth="3"/>
    <path d="M-35 14 Q2 4 34 13 L24 36 -19 36Z" fill="#251d22" stroke="#16171b" strokeWidth="4"/>
    <path d="M-23 15 L-16 28 -8 16 M10 16 L19 28 26 15" fill="#f3e4c8" stroke="#b8ae9b" strokeWidth="2"/>
    <path d="M-7 32 L10 33" stroke="#bb6664" strokeWidth="3"/>
    <path d="M-29 -18 Q-11 -29 1 -14 M7 -14 Q26 -30 40 -17" fill="none" stroke="#213025" strokeWidth="5" strokeLinecap="round"/>
    <path d="M-40 15 L-57 23" stroke="#b9a170" strokeWidth="3" opacity=".6"/>
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
 '.duel-lab__controls{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:10px}',
 '.duel-lab__selector{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0 3px}',
 '.duel-lab__selector button{background:#233952;color:#d3e3ee;border:1px solid #6b859b;min-width:0;padding:9px 5px;font-size:12px}',
 '.duel-lab__selector button[aria-pressed=true]{border:2px solid #f2cb8b;background:#4d3b2d;color:#ffedcb;box-shadow:inset 0 0 0 1px #b3905b}',
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
 const [selectedStyle,setSelectedStyle]=useState<AttackStyle>("slash");
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
   setMs(selectedStyle==="exchange"?1720:selectedStyle==="heavy"?Math.round(805*HEAVY_LENGTH/LENGTH):805);
   window.setTimeout(()=>setMs(null),450);
   return;
  }
  clock.current=performance.now();
  const length=selectedStyle==="exchange"?EXCHANGE_LENGTH:selectedStyle==="heavy"?HEAVY_LENGTH:LENGTH;
  const tick=(now:number)=>{
   const elapsed=Math.min(length,now-clock.current);
   setMs(elapsed);
   if(elapsed>=length){raf.current=null;setMs(null);return;}
   raf.current=requestAnimationFrame(tick);
  };
  raf.current=requestAnimationFrame(tick);
 },[prefersReduced,selectedStyle]);
 useEffect(()=>()=>{if(raf.current!==null)cancelAnimationFrame(raf.current);},[]);
 const pose=ms===null?IdlePose(idleMs):(selectedStyle==="exchange"?duelExchangePose(ms):selectedStyle==="heavy"?duelHeavyPose(ms):duelPose(ms));
 const label=ms===null?"PRONTO":({
  anticipation:"PREPARANDO","dash":"AVANÇANDO","plant":"FIRMANDO A BASE",
  swing:"GOLPE DE ESPADA","impact":"IMPACTO","reaction":"INIMIGO RECUANDO",
  recover:"RECUPERANDO","return":"RETORNANDO","idle":"PRONTO",
  enemyApproach:"MONSTRO AVANÇA",enemyWindup:"MONSTRO ARMA A GARRA",
  block:"ESCUDO BLOQUEIA",counterWindup:"PREPARANDO CONTRAGOLPE",
  counterSwing:"CONTRA-ATAQUE",counterImpact:"GOLPE CONECTADO",
  stagger:"MONSTRO TROPEÇA",disengage:"RECUANDO À FORMAÇÃO"
 } as Record<Phase,string>)[pose.phase];
 const camera=ms!==null&&pose.hit>0?"translate("+(Math.sin(ms*.22)*pose.hit*(selectedStyle==="heavy"?4:2.5)).toFixed(1)+" 0)":"";
 const slashPath="M0 -80 Q104 -132 184 -4";
 return <section className="duel-lab" aria-label="Laboratório isolado: guerreiro contra monstro" data-lab="duel-01" data-style={selectedStyle} data-phase={pose.phase} data-hero-x={pose.heroX.toFixed(1)} data-monster-x={pose.monsterX.toFixed(1)}>
  <style>{STYLES}</style>
  <div className="duel-lab__header"><h2>Duelo 04 — defesa e contra-ataque</h2>
   <span className="duel-lab__note">GOLPE ARTICULADO · ENSAIO ISOLADO</span></div>
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
     <linearGradient id="duel-steel" x1="0" y1="0" x2="1" y2=".9"><stop stopColor="#f4f4e5"/><stop offset=".24" stopColor="#b4c4c9"/><stop offset=".58" stopColor="#4a657e"/><stop offset="1" stopColor="#293649"/></linearGradient>
     <linearGradient id="duel-armor-blue" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#648eaa"/><stop offset=".32" stopColor="#345a80"/><stop offset="1" stopColor="#142d4a"/></linearGradient>
     <linearGradient id="duel-trouser" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#455b71"/><stop offset="1" stopColor="#152437"/></linearGradient>
     <linearGradient id="duel-gold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff2bd"/><stop offset=".47" stopColor="#cf9852"/><stop offset="1" stopColor="#785030"/></linearGradient>
     <linearGradient id="duel-shield" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#456e90"/><stop offset=".53" stopColor="#294768"/><stop offset="1" stopColor="#132942"/></linearGradient>
     <linearGradient id="duel-cape" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b8584d"/><stop offset=".58" stopColor="#84332f"/><stop offset="1" stopColor="#452029"/></linearGradient>
     <linearGradient id="duel-blade" x1="0" y1="0" x2="1" y2=".5"><stop stopColor="#bce8ff"/><stop offset=".45" stopColor="#fcffff"/><stop offset="1" stopColor="#5f8dab"/></linearGradient>
     <linearGradient id="duel-goblin" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#92a874"/><stop offset=".27" stopColor="#697b51"/><stop offset="1" stopColor="#334c39"/></linearGradient>
     <linearGradient id="duel-goblin-armor" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#969e6c"/><stop offset=".45" stopColor="#69704d"/><stop offset="1" stopColor="#3b5136"/></linearGradient>
     <radialGradient id="duel-moon"><stop stopColor="#dbecff" stopOpacity=".5"/><stop offset="1" stopColor="#a8c7e1" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="900" height="500" fill="url(#duel-sky)"/>
    <circle cx="580" cy="115" r="138" fill="url(#duel-moon)"/>
    <circle cx="580" cy="115" r="30" fill="#d4dfeb" opacity=".62"/>
    <path d="M0 275 L90 172 170 238 295 139 393 237 510 170 605 255 720 134 820 210 900 170 900 360 0 360Z" fill="#162739"/>
    <path d="M0 322 L101 244 202 317 313 250 431 310 532 236 660 307 777 244 900 325 900 420 0 420Z" fill="#243347"/>
    {/* Ruins in depth, not a new battlefield or gameplay component */}
    <g opacity=".67" stroke="#121e2a" strokeWidth="4">
      <path d="M49 389 L49 261 92 261 96 326 115 332 118 392Z" fill="#465466"/>
      <path d="M52 278 L106 283 M55 312 L101 312 M72 267 L73 379" stroke="#718194" strokeWidth="2" opacity=".45"/>
      <path d="M758 389 L766 240 809 239 816 386Z" fill="#45556a"/>
      <path d="M753 267 L815 267 M761 309 L813 308 M788 242 L790 385" stroke="#93a0a6" strokeWidth="2" opacity=".35"/>
      <path d="M789 241 L843 216 847 236 813 260Z" fill="#303f50"/>
    </g>
    <path d="M0 398 L900 394" stroke="#6c8293" strokeWidth="3" opacity=".23"/>
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
      {Array.from({length:5},(_,i)=><g key={i} transform={"translate("+(pose.heroX-52+i*19)+" "+(412-(i%3)*9)+")"}>
       <path d="M-5 2 L0 -7 8 1Z" fill="#c1b7a1" opacity=".55"/>
      </g>)}
     </g>}
     {pose.slash>0&&<g data-testid="duel-slash" transform={selectedStyle==="exchange"?"translate(340 265)":"translate(589 280)"} opacity={pose.slash}>
      <path d={slashPath} fill="none" stroke="#72d7ff" strokeWidth="26" opacity=".17" strokeLinecap="round"/>
      <path d={slashPath} fill="none" stroke="#d8f3ff" strokeWidth="14" opacity=".45" strokeLinecap="round"/>
      <path d={slashPath} fill="none" stroke="#fcffff" strokeWidth="4" strokeLinecap="round"/>
      <path d="M26 -66 Q104 -104 166 -10" fill="none" stroke="#99daff" strokeWidth="2" opacity=".58"/>
     </g>}
     {pose.clawFx>0&&<g data-testid="duel-claw" opacity={pose.clawFx}>
       <path d="M420 250 Q365 265 341 331 M429 268 Q370 286 351 343 M437 287 Q383 301 365 355"
        fill="none" stroke="#b9ff9d" strokeWidth="7" strokeLinecap="round"/>
     </g>}
     {pose.blockFx>0&&<g data-testid="duel-shield-block" opacity={pose.blockFx}>
       <circle cx="350" cy="320" r={23+15*pose.blockFx} fill="none" stroke="#e8eeff" strokeWidth="6"/>
       <path d="M350 281 V265 M350 360 V376 M314 320 H295 M388 320 H404 M326 296 L309 279 M376 296 L391 279"
        stroke="#f9e5a1" strokeWidth="6" strokeLinecap="round"/>
     </g>}
     {pose.hit>0&&<g data-testid="duel-impact" opacity={pose.hit}>
      <circle cx={selectedStyle==="exchange"?460:689} cy="293" r={39+pose.hit*26} fill="none" stroke="#ffeaa8" strokeWidth="6"/>
      <circle cx={selectedStyle==="exchange"?460:689} cy="293" r={26+pose.hit*14} fill="none" stroke="#ffffff" strokeWidth="3" opacity=".7"/>
      <path d={selectedStyle==="exchange"?"M460 223 V195 M460 364 V394 M392 292 H359 M526 292 H561 M413 246 l-28 -28 M512 246 l28 -28":"M689 223 V195 M689 364 V394 M620 292 H587 M755 292 H790 M642 246 l-28 -28 M741 246 l28 -28"} stroke="#fff2b5" strokeWidth="7" strokeLinecap="round"/>
      {Array.from({length:8},(_,i)=>{
       const a=i*Math.PI/4;
       const x=(selectedStyle==="exchange"?460:689)+Math.cos(a)*67,y=293+Math.sin(a)*67;
       return <path key={i} d={"M"+x.toFixed(1)+" "+y.toFixed(1)+" l"+(Math.cos(a)*13).toFixed(1)+" "+(Math.sin(a)*13).toFixed(1)} stroke={i%2?"#fff2b5":"#b8eeff"} strokeWidth={3+i%3} strokeLinecap="round"/>;
      })}
      <g transform={"translate("+(selectedStyle==="exchange"?730+pose.monsterX:744+pose.monsterX)+" 416)"}>
       <ellipse cx="0" cy="0" rx={36+pose.hit*18} ry={10+pose.hit*4} fill="#b0ae9b" opacity=".35"/>
       <path d="M-18 -9 l-8 -11 -8 13 M19 -8 l12 -17 10 13 M0 -6 l3 -21 8 8" fill="none" stroke="#ded3b8" strokeWidth="3"/>
      </g>
     </g>}
    </g>
    <rect x="15" y="16" width="292" height="39" rx="8" fill="#0c1c31" opacity=".88"/>
    <text x="30" y="43" fill="#ffdfac" fontSize="19" fontWeight="bold">GUERREIRO vs MONSTRO</text>
    <text x="24" y="483" fill="#d5e5eb" fontSize="16">Armadura, arma e criatura com articulações independentes</text>
   </svg>
  </div>
  <div className="duel-lab__selector" role="group" aria-label="Estilo de ataque">
   <button type="button" aria-label="Selecionar corte rápido" aria-pressed={selectedStyle==="slash"}
    disabled={ms!==null} data-style-option="slash" onClick={()=>setSelectedStyle("slash")}>Corte rápido</button>
   <button type="button" aria-label="Selecionar golpe pesado" aria-pressed={selectedStyle==="heavy"}
    disabled={ms!==null} data-style-option="heavy" onClick={()=>setSelectedStyle("heavy")}>Golpe pesado</button>
   <button type="button" aria-label="Selecionar defesa e contra-ataque" aria-pressed={selectedStyle==="exchange"}
    disabled={ms!==null} data-style-option="exchange" onClick={()=>setSelectedStyle("exchange")}>Defesa + contra-ataque</button>
  </div>
  <div className="duel-lab__controls">
   <button type="button" onClick={attack} disabled={ms!==null} aria-label="Atacar o monstro e ver a animação completa">
    {ms===null?"⚔ ATACAR / REPETIR":"GOLPE EM ANDAMENTO"}
   </button>
   <span role="status" className="duel-lab__status"><strong>{selectedStyle==="exchange"?"Defesa + contra-ataque":selectedStyle==="heavy"?"Golpe pesado":"Corte rápido"}</strong> · {label}</span>
  </div>
  <p className="duel-lab__footer">Protótipo visual independente. Nenhum ponto de vida, inventário ou progresso do jogo é alterado.
   {prefersReduced?" Movimento reduzido: exibição de impacto sem sequência acelerada.":""}</p>
 </section>;
}
