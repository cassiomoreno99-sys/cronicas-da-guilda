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
export function GameSymbol({kind,size=18,className="",label}:{kind:GameSymbolKind;size?:number;className?:string;label?:string}){
  const spec=GAME_SYMBOLS[kind],Icon=spec.icon;
  return <Icon size={size} strokeWidth={2.3} className={"game-symbol game-symbol--"+kind+(className?" "+className:"")}
    role={label?"img":undefined} aria-label={label} aria-hidden={label?undefined:true}/>;
}
