import { useId } from "react";
import {
  Archive, BookOpen, CircleHelp, Coins, Crown, Crosshair, Flag, FlaskConical, Footprints,
  Gem, Hammer, Heart, HeartHandshake, Hourglass, LockKeyhole, MapPin, PackageOpen,
  ScrollText, Shield, Skull, Sparkles, Star, Store, Sword, Swords, Target, Tent,
  Trophy, Users, WandSparkles, Zap, type LucideIcon
} from "lucide-react";

/** Símbolos oficiais do jogo: cada significado tem uma única assinatura visual. */
export const GAME_SYMBOLS = {
  gold:       { icon: Coins,         label: "Ouro" },
  reward:     { icon: Coins,         label: "Recompensa em ouro" },
  treasure:   { icon: PackageOpen,   label: "Tesouro" },
  objective:  { icon: ScrollText,    label: "Objetivo" },
  difficulty: { icon: Swords,        label: "Dificuldade" },
  mission:    { icon: Flag,          label: "Missão" },
  squad:      { icon: Users,         label: "Equipe" },
  duration:   { icon: Hourglass,     label: "Duração" },
  boss:       { icon: Skull,         label: "Chefe" },
  elite:      { icon: Shield,        label: "Elite" },
  attack:     { icon: Sword,         label: "Ataque" },
  defense:    { icon: Shield,        label: "Defesa" },
  critical:   { icon: Crosshair,     label: "Crítico" },
  speed:      { icon: Footprints,    label: "Velocidade" },
  health:     { icon: Heart,         label: "Vida" },
  magic:      { icon: WandSparkles,  label: "Magia" },
  healing:    { icon: HeartHandshake,label: "Cura" },
  energy:     { icon: Zap,           label: "Energia" },
  forge:      { icon: Hammer,        label: "Forja" },
  merchant:   { icon: Store,         label: "Mercador" },
  potion:     { icon: FlaskConical,  label: "Consumível" },
  book:       { icon: BookOpen,      label: "Livro supremo" },
  rare:       { icon: Gem,           label: "Raro" },
  legendary:  { icon: Star,          label: "Lendário" },
  location:   { icon: MapPin,        label: "Região" },
  sanctuary:  { icon: Tent,          label: "Santuário" },
  fame:       { icon: Flag,          label: "Renome" },
  league:     { icon: Trophy,        label: "Liga" },
  guild:      { icon: Crown,         label: "Guilda" },
  inventory:  { icon: Archive,       label: "Inventário" },
  experience: { icon: Sparkles,      label: "Experiência" },
  locked:     { icon: LockKeyhole,   label: "Bloqueado" },
  help:       { icon: CircleHelp,    label: "Ajuda" },
  battle:     { icon: Swords,        label: "Combate" },
  scouting:   { icon: Target,        label: "Precisão" },
} as const satisfies Record<string,{icon:LucideIcon;label:string}>;

export type GameSymbolKind = keyof typeof GAME_SYMBOLS;

const MEDIEVAL_EMBLEMS: Partial<Record<GameSymbolKind,{center:string;dark:string}>> = {
  attack:  {center:"#a74d28",dark:"#471b16"},
  defense: {center:"#26718c",dark:"#12314b"},
  health:  {center:"#b73345",dark:"#611b24"},
  magic:   {center:"#6550bd",dark:"#27164f"},
  critical:{center:"#d59c2b",dark:"#5c3510"},
  speed:   {center:"#458f74",dark:"#153b35"},
  energy:  {center:"#2585af",dark:"#163f5b"},
  healing: {center:"#d7d7d4",dark:"#7d534a"},
  battle:  {center:"#a84f29",dark:"#391d16"},
  difficulty:{center:"#9b4535",dark:"#3c1e1b"},
  boss:    {center:"#8e292d",dark:"#250b13"},
  elite:   {center:"#836227",dark:"#332611"}
};

/** Ícones de atributo em medalhões de esmalte e metal com volume, não símbolos de interface plana. */
export function GameSymbol({kind,size=18,className="",label}:{kind:GameSymbolKind;size?:number;className?:string;label?:string}){
 const spec=GAME_SYMBOLS[kind],Icon=spec.icon;
 const id=useId().replace(/:/g,"");
 const ornamental=MEDIEVAL_EMBLEMS[kind];
 // A moeda é uma peça física do mundo, não um desenho digital da interface.
 if(kind==="gold"||kind==="reward"){
   return <img src="/economy/gold-real.webp" width={size} height={size}
      className={"game-symbol game-coin game-symbol--"+kind+(className?" "+className:"")}
      alt={label||""} aria-hidden={label?undefined:true} loading="eager"/>;
 }

 if(ornamental){
   return <svg className={"game-symbol game-emblem game-symbol--"+kind+(className?" "+className:"")}
      width={size} height={size} viewBox="0 0 48 48" role={label?"img":undefined} aria-label={label} aria-hidden={label?undefined:true} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id+"gold"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff4bd"/><stop offset=".15" stopColor="#c98b2e"/><stop offset=".31" stopColor="#61310c"/>
          <stop offset=".48" stopColor="#f8d983"/><stop offset=".65" stopColor="#9f5919"/>
          <stop offset=".84" stopColor="#e0ad51"/><stop offset="1" stopColor="#6d390e"/>
        </linearGradient>
        <radialGradient id={id+"enamel"} cx="34%" cy="22%" r="85%">
          <stop offset="0" stopColor={ornamental.center}/><stop offset=".66" stopColor={ornamental.dark}/><stop offset="1" stopColor="#160c0d"/>
        </radialGradient>
        <linearGradient id={id+"steel"} x1="0" x2=".95" y1="0" y2="1">
          <stop offset="0" stopColor="#fffce6"/><stop offset=".35" stopColor="#f7d079"/>
          <stop offset=".5" stopColor="#986325"/><stop offset=".75" stopColor="#f6e8ac"/><stop offset="1" stopColor="#bb8133"/>
        </linearGradient>
        <filter id={id+"shadow"} x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow dx=".4" dy="1.3" stdDeviation="1.1" floodColor="#130c07" floodOpacity=".75"/>
        </filter>
      </defs>
      <g filter={`url(#${id}shadow)`}>
        <circle cx="24" cy="24" r="22" fill={`url(#${id}gold)`} stroke="#512c10" strokeWidth="1.4"/>
        <circle cx="24" cy="24" r="17.3" fill={`url(#${id}enamel)`} stroke="#fce7a6" strokeWidth="1.3"/>
        <circle cx="24" cy="24" r="15.5" fill="none" stroke="#1b0b0b" strokeWidth=".8" opacity=".65"/>
        <path d="M10 13Q17 5 31 7" stroke="#fffad0" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".64"/>
        <path d="M18 41Q27 45 36 38" stroke="#65350f" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".6"/>
        <circle cx="24" cy="3.6" r="1.25" fill="#fff9cb"/>
        <circle cx="44.4" cy="24" r="1.1" fill="#f8d480"/>
        <circle cx="24" cy="44.4" r="1.1" fill="#a9691a"/>
        <circle cx="3.6" cy="24" r="1.1" fill="#f8d480"/>
        <Icon x={10} y={10} width={28} height={28} stroke={`url(#${id}steel)`} strokeWidth={2.7}
          aria-hidden="true" fill="none"/>
      </g>
     </svg>;
 }
 return <Icon size={size} strokeWidth={2.3} className={"game-symbol game-symbol--"+kind+(className?" "+className:"")}
    role={label?"img":undefined} aria-label={label} aria-hidden={label?undefined:true}/>;
}
