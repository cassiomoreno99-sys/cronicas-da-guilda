import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import OfflineInstall from "./offline-install";
import Arena3D from "./arena-3d";
import Arena2D from "./arena-2d";
import soundtrackLibrary from "@/lib/music-playlist.json";
import {
  Archive, BookOpen, Check, ChevronLeft, ChevronRight, CircleHelp, Coins, Crown, Download,
  Flag, Footprints, Gem, Hammer, Hand, Heart, LockKeyhole, ScrollText, Shield, Shirt, Sparkles, Swords,
  Target, Tent, Trophy, Upload, Users, Volume2, VolumeX, Beer, Settings, X
} from "lucide-react";
import {
  CLASSES, RACES, TACTICS, ITEMS, KIND_NAMES, PATH_NAMES, RACIAL_PATH_NAMES,
  SPECIALIZATIONS, SPECIALIZATION_BRANCHES, RACE_TREES, HERO_STORIES,
  HQ_DEFINITIONS, WORLD_MAP, NEGOTIATION_MODES, JOURNEY_CHOICES,
  activeExpeditions, freeExpeditionSlots, available, activeJourney, heroOnExpedition,
  heroRace, heroStats, threshold, missions, missionLocks, missionReadiness, seasonBoss,
  teamPower, standings, leaguePrize, market, talentPoints, racialPoints,
  trainingPlan, defaultFormationLine, formationValid, suggestSpecialistTeam,
  hqUpgradeCost, academySlots, academyCandidateChance, seasonDay,
  ACADEMY_COMMONER_CAPACITY, ACADEMY_ENROLL_COST, ACADEMY_FOCUS_COST, negotiationQuote, rank,
  type Action, type Battle, type Campaign, type ChestItem,
  type EvolutionBranch, type Expedition, type ExpeditionSlot, type FormationLine,
  type Hero, type HQBuilding, type JourneyChoice, type JourneyDuration,
  type Mission, type NegotiationMode, type RacialPath, type TalentPath, type Tactic
} from "@/lib/game";
import {
  exportLocalCampaign, importLocalCampaign, readLocalCampaign, updateLocalCampaign,
  type LocalSave
} from "@/lib/local-save";
import { portraitSource } from "@/lib/portraits";
import { tavernArtwork } from "@/lib/scene-art/tavern";
import merchantPortrait from "@/lib/portrait-art/merchant";
import { GameSymbol, GAME_SYMBOLS, type GameSymbolKind } from "./game-symbols";
import { EQUIPMENT_SLOTS, type EquipmentSlotId } from "@/lib/equipment-layout";
import { testShop, CATALOG_ITEMS, CATALOG_BY_ID, TEST_RECIPES, equippedPosition } from "@/lib/catalog-test";
import { missionLootPreview } from "@/lib/catalog-runtime";

type Save = Pick<LocalSave, "state" | "revision">;
type Screen = "mission" | "team" | "league" | "rest" | "heroes" | "equipment" | "chest" | "tavern" | "guild";

const fmt = (n: number) => n.toLocaleString("pt-BR");
const ATTRIBUTE_SYMBOLS:Record<string,GameSymbolKind>={Ataque:"attack",Defesa:"defense",Magia:"magic",Vida:"health",Velocidade:"speed",Crítico:"critical",Energia:"energy"};

const missionArt = ["/reference/mission-1.webp", "/reference/mission-2.webp", "/reference/mission-3.webp", "/reference/mission-4.webp", "/reference/mission-5.webp"];
const valenMissionArt = Array.from({ length: 7 }, (_, i) => `/reference/valen-mission-${i + 1}.jpg`);

/** Usa a arte da missão real (e não uma foto fixa da vaga 1, 2 ou 3).
 * O ID carrega região e índice e continua válido nos saves em andamento. */
function missionArtwork(missionId: string): string {
  const normal = /^mission-\d+-(\d+)-(\d+)$/.exec(missionId);
  const boss = /^boss-\d+-(\d+)$/.exec(missionId);
  const region = normal ? Number(normal[1]) : boss ? Number(boss[1]) : -1;
  const index = normal ? Number(normal[2]) : boss ? 6 : 0;
  if (region === 0) return valenMissionArt[Math.min(6,Math.max(0,index))];
  return missionArt[index % missionArt.length];
}
const LEAGUE_PLAYER_CREST = "/league/crest-alvorecer.webp";
const LEAGUE_TROPHY = "/league/trophy-real.webp";
const RIVAL_CREST_NAMES: Record<string,string> = {
  "escudos da fronteira":"fronteira",
  "vigias da montanha":"vigias",
  "dragoes do vale":"dragoes",
  "guardioes da montanha":"guardioes",
  "cacadores da torre":"cacadores",
  // Compatibilidade com campanhas antigas e guildas geradas previamente.
  "cavaleiros da tempestade":"fronteira",
  "arautos da floresta":"vigias",
  "andarilhos da montanha":"guardioes",
  "arautos da torre":"cacadores"
};
const RIVAL_CRESTS=["fronteira","vigias","dragoes","guardioes","cacadores"];
function leagueCrest(guild:{id:string;name:string}){
  if(guild.id==="player")return LEAGUE_PLAYER_CREST;
  const key=guild.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const matching=RIVAL_CREST_NAMES[key];
  if(matching)return "/league/crest-"+matching+".webp";
  const guildIndex=/^rival-(\d+)$/.exec(guild.id);
  const index=guildIndex?Number(guildIndex[1]):[...guild.id].reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,0);
  return "/league/crest-"+RIVAL_CRESTS[index%RIVAL_CRESTS.length]+".webp";
}
const itemSlots = new Set(["weapon","offhand","helmet","armor","gloves","boots","accessory"]);
const specialtyNames: Record<string,string> = {
  warrior:"Guerreiro", paladin:"Paladino", rogue:"Ladino", ranger:"Arqueiro",
  undead:"Mago / Paladino", boss:"Equipe completa"
};
const specialtyName = (value: string) => specialtyNames[value] || value;
const CORE_RACE_NAMES: Record<string,string> = {
  aric:"Humano", lyra:"Elfa", elen:"Anão", kael:"Meio-Elfa", sora:"Elfo", doran:"Draconato"
};
const raceLabel = (hero: Pick<Hero,"id"|"name"|"class"|"race">): string => CORE_RACE_NAMES[hero.id] || RACES[heroRace(hero)].name;
/** Tema orquestral CC0: reprodução nativa com volume controlado pelo Android.
 * Sem dezenas de osciladores WebAudio; reduz CPU/bateria durante o jogo offline. */
const RPG_MUSIC_TRACKS = soundtrackLibrary.tracks;
function useAmbientRpgMusic() {
  const [musicEnabled,setMusicEnabled] = useState(() => {
    try{return window.localStorage.getItem("cronicas-musica") !== "off";}
    catch{return true;}
  });
  const initialIndex = useMemo(() => {
    try {
      const value=Number(window.localStorage.getItem("cronicas-musica-faixa") || 0);
      return Number.isSafeInteger(value) && value>=0 ? value % RPG_MUSIC_TRACKS.length : 0;
    } catch{return 0;}
  },[]);
  const [musicIndex,setMusicIndex] = useState(initialIndex);
  const enabledRef = useRef(musicEnabled);
  const indexRef = useRef(initialIndex);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const errorsRef = useRef(0);

  const playMusic = useCallback(() => {
    const audio=audioRef.current;
    if(!enabledRef.current || document.hidden || !audio)return;
    if(audio.paused)void audio.play().catch(() => {});
  },[]);

  const nextTrack = useCallback(() => {
    const audio=audioRef.current;
    if(!audio)return;
    const next=(indexRef.current+1) % RPG_MUSIC_TRACKS.length;
    indexRef.current=next;
    setMusicIndex(next);
    try{window.localStorage.setItem("cronicas-musica-faixa",String(next));}catch{}
    audio.src="/music/"+RPG_MUSIC_TRACKS[next].file;
    audio.load();
    if(enabledRef.current && !document.hidden)void audio.play().catch(() => {});
  },[]);

  useEffect(() => {
    // Usa somente UM decodificador nativo de áudio: menor CPU e memória no Android.
    // O volume fica em 100% do canal de mídia e respeita os botões físicos do telefone.
    const audio=new Audio("/music/"+RPG_MUSIC_TRACKS[indexRef.current].file);
    audio.preload="none";
    audio.loop=false;
    audio.volume=1;
    audioRef.current=audio;
    const ended=() => {errorsRef.current=0;nextTrack();};
    const error=() => {
      errorsRef.current++;
      if(errorsRef.current<RPG_MUSIC_TRACKS.length)nextTrack();
      else audio.pause();
    };
    const playing=() => {errorsRef.current=0;};
    const unlock=() => {if(enabledRef.current)playMusic();};
    const visibility=() => {
      if(document.hidden)audio.pause();
      else unlock();
    };
    audio.addEventListener("ended",ended);
    audio.addEventListener("error",error);
    audio.addEventListener("playing",playing);
    window.addEventListener("pointerdown",unlock,{passive:true});
    window.addEventListener("keydown",unlock);
    document.addEventListener("visibilitychange",visibility);
    return () => {
      window.removeEventListener("pointerdown",unlock);
      window.removeEventListener("keydown",unlock);
      document.removeEventListener("visibilitychange",visibility);
      audio.removeEventListener("ended",ended);
      audio.removeEventListener("error",error);
      audio.removeEventListener("playing",playing);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      if(audioRef.current===audio)audioRef.current=null;
    };
  },[playMusic,nextTrack]);

  const toggleMusic = useCallback(() => {
    const next=!enabledRef.current;
    enabledRef.current=next;
    setMusicEnabled(next);
    try{window.localStorage.setItem("cronicas-musica",next?"on":"off");}catch{}
    if(next)playMusic();
    else audioRef.current?.pause();
  },[playMusic]);

  return {musicEnabled,toggleMusic,musicIndex,nextTrack,trackCount:RPG_MUSIC_TRACKS.length};
}

function HeroPortrait({ hero, large = false }: { hero: Pick<Hero, "id" | "name" | "class" | "race">; large?: boolean }) {
  return <span
    className={"hero-portrait" + (large ? " hero-portrait-large" : "")}
    style={{ backgroundImage: `url("${portraitSource(hero.name, hero.id, hero.class, heroRace(hero))}")` }}
    role="img"
    aria-label={"Retrato de " + hero.name}
  />;
}

function ItemArt({ itemKey }: { itemKey: string }) {
 const item=CATALOG_BY_ID[itemKey];
 const index=/^CG-\d{3}$/.test(itemKey)?Number(itemKey.slice(3))-1:-1;
 if(item && index>=0 && index<314) {
   const sheet=index<300?Math.floor(index/100)+1:4;
   const position=index<300?index%100:index-300;
   const cols=index<300?10:7;
   const rows=index<300?10:2;
   const x=(position%cols)/(cols-1)*100;
   const y=Math.floor(position/cols)/(rows-1)*100;
   return <span role="img" className={"item-art catalog-image rarity-"+(ITEMS[itemKey]?.rarity||"common")} aria-label={item.nome}
     style={{backgroundImage:`url(/items/atlas-${sheet}.avif)`,backgroundSize:`${cols*100}% ${rows*100}%`,
             backgroundPosition:`${x}% ${y}%`,backgroundRepeat:"no-repeat"}}/>;
 }
 return <span className="item-art" role="img" aria-label="Imagem indisponível"><GameSymbol kind="inventory" aria-hidden="true"/></span>;
}

function ProgressBar({ value, tone = "green" }: { value: number; tone?: "green" | "red" | "blue" | "gold" }) {
  return <span className={"progress progress-" + tone}><i style={{ width: Math.max(0, Math.min(100, value)) + "%" }} /></span>;
}

function ParchmentTitle({ icon, title, side }: { icon?: ReactNode; title: string; side?: ReactNode }) {
  return <div className="parchment-title"><span>{icon}</span><h2>{title}</h2>{side && <div className="title-side">{side}</div>}</div>;
}

function enemyArtKey(name: string) {
  const n = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (n.includes("matriarca")) return "matriarch";
  if (n.includes("senhor")) return "border_lord";
  if (n.includes("vigia")) return "watcher";
  if (n.includes("cavaleiro")) return "spectral_knight";
  if (n.includes("obsidiana")) return "obsidian_guardian";
  if (n.includes("guardiao") || n.includes("guardião")) return "ancient_guardian";
  if (n.includes("guerreiro draco")) return "drake_warrior";
  if (n.includes("salteador dracon")) return "draconic_raider";
  if (n.includes("draco")) return "wild_drake";
  if (n.includes("cultista")) return "cultist";
  if (n.includes("goblin")) return "goblin";
  if (n.includes("orc")) return "orc";
  if (n.includes("espectro")) return "specter";
  if (n.includes("pantera")) return "panther";
  if (n.includes("aranha")) return "spider";
  if (n.includes("troll")) return "troll";
  if (n.includes("emboscador")) return "ambusher";
  if (n.includes("lobo")) return "wolf";
  if (n.includes("esqueleto")) return "skeleton";
  if (n.includes("saqueador")) return "raider";
  return "bandit";
}

function TopBar({ state, goGuild, goSettings }: { state: Campaign; goGuild: () => void; goSettings: () => void }) {
  return <header className="game-header">
    <div className="header-banner"><GameSymbol kind="guild"/></div>
    <div className="header-title">CRÔNICAS DA GUILDA</div>
    <div className="header-resources">
      <button onClick={goGuild} aria-label={"Ouro disponível: "+fmt(state.gold)} title="Ouro da guilda"><GameSymbol kind="gold" size={22}/><strong>{fmt(state.gold)}</strong><b>+</b></button>
      <button onClick={goGuild} aria-label={"Renome: "+fmt(state.fame)} title="Renome da guilda"><GameSymbol kind="fame" size={22}/><strong>{fmt(state.fame)}</strong><b>+</b></button>
    </div>
    <button className="header-settings" onClick={goSettings} aria-label="Abrir configurações de áudio e desempenho"><Settings aria-hidden="true"/></button>
  </header>;
}

function TopNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  const tabs: Array<[Screen,string,ReactNode]> = [
    ["mission","Missão",<GameSymbol kind="battle" key="m"/>],
    ["team","Equipe",<GameSymbol kind="squad" key="e"/>],
    ["league","Liga",<GameSymbol kind="league" key="l"/>],
    ["rest","Descanso",<GameSymbol kind="sanctuary" key="d"/>],
  ];
  return <nav className="top-nav">{tabs.map(([id,label,icon]) =>
    <button key={id} data-active={screen === id} onClick={() => go(id)}>{icon}<span>{label}</span></button>
  )}</nav>;
}

function BottomNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  const missionActive = ["mission","team","league","rest"].includes(screen);
  const tabs: Array<[Screen,string,ReactNode,boolean]> = [
    ["mission","Missões",<GameSymbol kind="mission" key="m"/>,missionActive],
    ["heroes","Heróis",<GameSymbol kind="defense" key="h"/>,screen === "heroes" || screen === "equipment"],
    ["chest","Baú",<GameSymbol kind="inventory" key="b"/>,screen === "chest"],
    ["tavern","Taverna",<Beer key="t" />,screen === "tavern"],
    ["guild","Guilda",<GameSymbol kind="guild" key="g"/>,screen === "guild"],
  ];
  return <nav className="bottom-nav">{tabs.map(([id,label,icon,active]) =>
    <button key={id} data-active={active} onClick={() => go(id)}>{icon}<span>{label}</span></button>
  )}</nav>;
}

function MissionPage({
  state, selectedId, selectMission, goTeam
}: {
  state: Campaign; selectedId: string; selectMission: (id: string) => void; goTeam: () => void;
}) {
  const board = missions(state);
  const boss = seasonBoss(state);
  const cards = [...board, ...(boss ? [boss] : [])];
  return <section className="screen mission-screen">
    <div className="mission-list">
      {cards.map((m, index) => {
        const locks = missionLocks(state, m);
        const selected = m.id === selectedId;
        return <article className="mission-card" data-selected={selected} data-locked={!!locks.length} key={m.id}>
          <div className="mission-art"><img src={missionArtwork(m.id)} alt="" /><span><GameSymbol kind={m.kind==="boss"?"boss":"mission"}/>{KIND_NAMES[m.kind]}</span></div>
          <div className="mission-copy">
            <h2>{m.title}</h2>
            <p><GameSymbol kind="objective"/>{m.description}</p>
            <div className="difficulty"><GameSymbol kind="difficulty"/><b>Dificuldade:</b>{[0,1,2,3,4].map(i => <i key={i} data-on={i < m.rank}>◆</i>)}</div>
            <div className="specialist"><GameSymbol kind="squad"/><span>Especialistas: {specialtyName(m.specialty)}</span></div>
            {!!locks.length && <small className="locked-copy"><GameSymbol kind="locked"/> {locks[0]}</small>}
          </div>
          <div className="mission-rewards">
            <span><GameSymbol kind="reward"/> {m.reward} Ouro</span>
            <span><GameSymbol kind="experience"/> +{20 + m.rank * 15} XP</span>
            {!!missionLootPreview(state,m).length&&<small className="mission-special-loot"><GameSymbol kind="objective"/> Item de objetivo: {missionLootPreview(state,m).join(", ")}</small>}
            <small className="mission-material-loot"><GameSymbol kind="treasure"/> Materiais regionais e chance de equipamento</small>
            
            <button
              className={"action-button " + (index % 3 === 0 ? "red" : index % 3 === 1 ? "green" : "blue")}
              disabled={!!locks.length}
              onClick={() => { selectMission(m.id); goTeam(); }}
            >{locks.length ? "Bloqueada" : selected ? "Preparar" : "Aceitar"}</button>
          </div>
        </article>;
      })}
    </div>
  </section>;
}

function TeamPage({
  state, selectedMission, team, formation, tactic, slot, busy,
  setTeam, setFormation, setTactic, setSlot, act, openBattle
}: {
  state: Campaign; selectedMission: Mission; team: string[]; formation: Record<string, FormationLine>;
  tactic: Tactic; slot: ExpeditionSlot; busy: boolean;
  setTeam: (ids: string[]) => void; setFormation: (map: Record<string, FormationLine>) => void;
  setTactic: (t: Tactic) => void; setSlot: (s: ExpeditionSlot) => void;
  act: (a: Action) => void; openBattle: (id: string) => void;
}) {
  const running = activeExpeditions(state);
  const free = freeExpeditionSlots(state);
  const power = teamPower(state, team);
  const readiness = missionReadiness(state, selectedMission, team);
  const selectedHeroes = state.heroes.filter(h => team.includes(h.id));
  const toggle = (h: Hero) => {
    if (team.includes(h.id)) {
      if (team.length <= 3) return;
      setTeam(team.filter(id => id !== h.id));
      return;
    }
    if (team.length >= 4 || !available(h, state)) return;
    const next = [...team, h.id];
    const map = { ...formation, [h.id]: defaultFormationLine(h.class) };
    if (!formationValid(next, map)) map[next[0]] = "front";
    setTeam(next); setFormation(map);
  };
  const canSend = !state.event && free.includes(slot) && !missionLocks(state, selectedMission).length && team.length >= 3 && team.length <= 4 && team.every(id => {
    const h = state.heroes.find(x => x.id === id); return !!h && available(h, state);
  });
  return <section className="screen team-screen">
    <ParchmentTitle icon={<GameSymbol kind="scouting"/>} title="Expedições da Guilda" side={<small>Organize suas equipes e envie heróis.</small>} />
    <div className="expedition-grid">
      {([1,2,3] as ExpeditionSlot[]).map(s => {
        const exp = running.find(e => e.slot === s);
        return <article key={s} className={"expedition-card " + (exp ? "active" : "")}>
          <b>Expedição {s}</b>
          {exp ? <>
            <img src={missionArtwork(exp.battle.combat?.mission.id || "")} alt={"Arte da missão "+exp.battle.title} />
            <h3>{exp.battle.title}</h3><span><GameSymbol kind="scouting"/> Em andamento · rodada {exp.battle.rounds}</span>
            <button className="action-button blue" onClick={() => openBattle(exp.id)}>Detalhes</button>
          </> : <>
            <div className="empty-expedition"><GameSymbol kind="scouting"/></div>
            <h3>Espaço Disponível</h3><span>Monte uma equipe para uma nova expedição.</span>
            <button className={"action-button " + (slot === s ? "green" : "dark")} onClick={() => setSlot(s)}>Preparar</button>
          </>}
        </article>;
      })}
    </div>
    <ParchmentTitle icon={<GameSymbol kind="squad"/>} title="Formação da Equipe" side={
      <button className="small-button" onClick={() => {
        const ids = suggestSpecialistTeam(state, selectedMission.kind);
        setTeam(ids);
        setFormation(Object.fromEntries(ids.map(id => {
          const h = state.heroes.find(x => x.id === id)!;
          return [id, defaultFormationLine(h.class)];
        })));
      }}>Montar especialista</button>
    } />
    <div className="hero-picker">
      {state.heroes.map(h => {
        const selected = team.includes(h.id);
        const disabled = !selected && (!available(h, state) || team.length >= 4);
        return <button key={h.id} data-selected={selected} disabled={disabled} onClick={() => toggle(h)}>
          <HeroPortrait hero={h} />
          <strong>{h.name.split(" ")[0]}</strong><small>Nv. {h.level}</small>
          <ProgressBar value={h.energy} tone={h.energy < 40 ? "red" : "blue"} />
          {selected && <Check className="picker-check" />}
        </button>;
      })}
    </div>
    <div className="formation-panel">
      <div className="formation-list">{selectedHeroes.map(h => <div key={h.id} className="formation-row">
        <HeroPortrait hero={h} /><span><strong>{h.name}</strong><small>{CLASSES[h.class].name}</small></span>
        <div className="line-toggle">
          <button data-active={(formation[h.id] || defaultFormationLine(h.class)) === "front"} onClick={() => setFormation({ ...formation, [h.id]: "front" })}>Frente</button>
          <button data-active={(formation[h.id] || defaultFormationLine(h.class)) === "back"} onClick={() => setFormation({ ...formation, [h.id]: "back" })}>Retaguarda</button>
        </div>
      </div>)}</div>
      <div className="team-bonus">
        <h3>Bônus de Equipe</h3>
        <p>{readiness.label}</p><small>{readiness.hint}</small>
        <div className="tactic-row">{(Object.keys(TACTICS) as Tactic[]).map(t => <button key={t} data-active={tactic === t} onClick={() => setTactic(t)}>{TACTICS[t].name}</button>)}</div>
        <div className="team-power"><GameSymbol kind="battle"/><span>Poder da Equipe</span><strong>{fmt(power)}</strong></div>
      </div>
    </div>
    <div className="send-row">
      <div><strong>{state.event ? "Conselho pendente" : "Pronto para a Expedição?"}</strong><span>{state.event ? "Resolva a decisão do conselho na Guilda antes de partir." : selectedMission.title + " · vaga " + slot}</span></div>
      <button className="action-button green huge" disabled={!canSend || busy} onClick={() => act({
        type:"mission", missionId:selectedMission.id, team, tactic, formation, expeditionSlot:slot, startedAt:Date.now()
      })}><GameSymbol kind="battle"/> Enviar</button>
    </div>
  </section>;
}

function LeaguePage({ state, team, act, busy }: { state: Campaign; team: string[]; act: (a: Action) => void; busy: boolean }) {
  const table = standings(state);
  const place = table.findIndex(g => g.id === "player") + 1;
  const rival = table.find(g => g.id !== "player");
  const rivalData = rival ? state.rivals.find(r => r.id === rival.id) : undefined;
  return <section className="screen league-screen">
    <div className="league-summary parchment">
      <div><span>Nossa Posição</span><strong>{place}º</strong></div>
      <div className="big-crest"><img src={LEAGUE_PLAYER_CREST} alt={"Brasão de "+state.name} width={90} height={104}/></div>
      <div><h2>{state.name}</h2><p><img className="league-trophy-art" src={LEAGUE_TROPHY} alt="" width={28} height={28}/> {state.points} Pontos da Liga</p><small><GameSymbol kind="fame"/> Prestígio: {state.fame} · Divisão {rank(state)}</small></div>
    </div>
    <ParchmentTitle icon={<img className="league-trophy-art" src={LEAGUE_TROPHY} alt="" width={31} height={31}/>} title="Classificação da Liga" side={<span>Temporada {state.season}</span>} />
    <div className="league-table parchment">
      <div className="league-head"><b>#</b><b>Guilda</b><b><img className="league-trophy-art" src={LEAGUE_TROPHY} alt="" width={18} height={18}/> Pontos</b><b><GameSymbol kind="reward"/> Recompensa</b></div>
      {table.slice(0,5).map((g,i) => <div key={g.id} className="league-row" data-player={g.id === "player"}>
        <strong>{i+1}</strong><span><img className="league-rival-crest" src={leagueCrest(g)} alt={"Brasão de "+g.name} width={42} height={48}/>{g.name}</span><b><img className="league-trophy-art" src={LEAGUE_TROPHY} alt="" width={25} height={25}/> {g.points}</b><small><GameSymbol kind="reward"/> {leaguePrize(i+1, state.leagueTier)} ouro</small>
      </div>)}
    </div>
    <ParchmentTitle icon={<GameSymbol kind="battle"/>} title="Desafio de Guilda" side={<span>Equipe: {team.length}/4</span>} />
    <div className="guild-challenge parchment">
      <img className="guild-challenge-art" src="/reference/olho-rubro-report-2026.webp" alt="Relatório completo do Olho Rubro: estandarte, reduto inimigo e informações da missão." width={1536} height={1024} />
      <div><h2>{rivalData?.name || "Guilda Rival"}</h2><p>Uma guilda rival disputa influência e prestígio. Derrote-a para fortalecer sua posição.</p>
        <span><GameSymbol kind="league"/> {rivalData?.points || 0} pontos</span><span><GameSymbol kind="attack"/> Força {rivalData?.strength || 0}</span>
      </div>
      <button className="action-button red huge" disabled={busy || !rivalData || team.length < 3 || activeExpeditions(state).length > 0}
        onClick={() => rivalData && act({ type:"rival-battle", guildId:rivalData.id, team })}>Desafiar</button>
    </div>
  </section>;
}

function RestPage({ state, act, busy }: { state: Campaign; act: (a: Action) => void; busy: boolean }) {
  const recover = state.heroes.filter(h => h.energy < 100 || h.injuredUntil > state.day);
  const shown = (recover.length ? recover : state.heroes).slice(0,4);
  return <section className="screen rest-screen">
    <div className="sanctuary-head parchment">
      <img src="/reference/sanctuary-2026.webp" alt="Santuário da Guilda: acampamento medieval com leitos de recuperação, fogueira, lanternas e o estandarte azul da guilda." width={1360} height={765} />
      <div><h2><GameSymbol kind="sanctuary"/> Santuário da Guilda</h2><p>Aqui seus heróis feridos podem repousar e se recuperar para novas aventuras.</p>
        <strong><GameSymbol kind="squad"/> Capacidade</strong><div className="beds">▰ ▰ ▰ ▱ ▱</div><span>{recover.length} heróis precisam de recuperação</span>
      </div>
    </div>
    <ParchmentTitle icon={<GameSymbol kind="defense"/>} title="Heróis em Recuperação" />
    <div className="recovery-list parchment">{shown.map(h => {
      const injured = h.injuredUntil > state.day;
      const plan = trainingPlan(state,h);
      return <article key={h.id}><HeroPortrait hero={h} />
        <div><h3>{h.name}</h3><span className={injured ? "danger-text" : "ok-text"}>{injured ? "Ferido" : h.energy < 100 ? "Recuperando" : "Pronto"}</span>
          <ProgressBar value={h.energy} tone={injured ? "red" : "green"} /><small><GameSymbol kind="energy"/> Energia {h.energy}% · Nv. {h.level}</small>
        </div>
        <button className="action-button blue" disabled={busy || injured || h.energy < 15} onClick={() => act({ type:"train-hero", heroId:h.id })}>Treinar +{plan.xp} XP</button>
      </article>;
    })}</div>
        <button className="action-button green rest-all" disabled={busy} onClick={() => act({ type:"rest" })}><GameSymbol kind="sanctuary"/> Descansar toda a guilda</button>
  </section>;
}

function HeroPage({ state, selectedId, selectHero, openEquipment, act, busy }: {
  state: Campaign; selectedId: string; selectHero: (id: string) => void; openEquipment: () => void; act: (a: Action) => void; busy: boolean;
}) {
  const hero = state.heroes.find(h => h.id === selectedId) || state.heroes[0];
  const stats = heroStats(hero,state);
  const equipped = state.chest.filter(i => i.equippedTo === hero.id);
  const points = talentPoints(hero), racePts = racialPoints(hero);
  const journey = activeJourney(state, hero.id);
  const story = HERO_STORIES[hero.class];
  const canAct = !heroOnExpedition(state,hero.id);
  const path = hero.talent?.path;
  const branchSpec = path && hero.talent?.branch ? SPECIALIZATION_BRANCHES[hero.class][path][hero.talent.branch] : undefined;
  return <section className="screen heroes-screen">
    <div className="heroes-layout">
      <aside className="hero-list">
        <ParchmentTitle icon={<GameSymbol kind="squad"/>} title="Meus Heróis" side={<span>{state.heroes.length}/12</span>} />
        {state.heroes.map(h => <button key={h.id} data-active={h.id === hero.id} onClick={() => selectHero(h.id)}>
          <HeroPortrait hero={h} /><span><strong>{h.name}</strong><small>{CLASSES[h.class].name} · {raceLabel(h)}</small><em><GameSymbol kind="attack"/> {fmt(teamPower(state,[h.id]))}</em><ProgressBar value={h.energy} tone={h.energy < 40 ? "red" : "blue"} /></span><b>Nv. {h.level}</b>
        </button>)}
      </aside>
      <article className="hero-sheet parchment">
        <div className="hero-feature"><div className="feature-portrait"><HeroPortrait hero={hero} large /></div><div><h2>{hero.name}</h2><p>{hero.trait}</p></div></div>
        <div className="hero-level"><strong>Nv. {hero.level}</strong><ProgressBar value={hero.level >= 50 ? 100 : hero.xp / threshold(hero) * 100} tone="gold" /><span>{hero.xp}/{hero.level >= 50 ? "MAX" : threshold(hero)} XP</span></div>
        <div className="hero-core"><div><span>Classe</span><strong>{CLASSES[hero.class].name}</strong></div><div><span>Raça</span><strong>{raceLabel(hero)}</strong></div><div><span>Força</span><strong>{fmt(teamPower(state,[hero.id]))}</strong></div></div>
        <section className="sheet-section"><label>Atributos</label><div className="stat-grid">
          <b><GameSymbol kind="health"/> Vida <em>{stats.hp}</em></b><b><GameSymbol kind="attack"/> Ataque <em>{stats.attack}</em></b><b><GameSymbol kind="defense"/> Defesa <em>{stats.defense}</em></b><b><GameSymbol kind="magic"/> Magia <em>{stats.magic}</em></b><b><GameSymbol kind="critical"/> Crítico <em>{Math.round(stats.critical*100)}%</em></b><b><GameSymbol kind="speed"/> Velocidade <em>{stats.speed}</em></b>
        </div></section>
        <section className="sheet-section"><label>Especialidade</label>
          {!hero.talent && <div className="choice-grid">{(Object.keys(PATH_NAMES) as TalentPath[]).map(p => <button disabled={busy || !canAct || points < 1} key={p} onClick={() => act({type:"specialize",heroId:hero.id,path:p})}><strong>{PATH_NAMES[p]}</strong><small>{SPECIALIZATIONS[hero.class][p].name}</small></button>)}</div>}
          {hero.talent && <div className="talent-box"><h3>{SPECIALIZATIONS[hero.class][hero.talent.path].name} · Grau {hero.talent.rank}</h3><p>{branchSpec?.description || SPECIALIZATIONS[hero.class][hero.talent.path].description}</p>
            {hero.talent.rank === 1 && points > 0 && <div className="choice-grid">{(["a","b"] as EvolutionBranch[]).map(b => <button key={b} disabled={busy || !canAct} onClick={() => act({type:"specialize",heroId:hero.id,path:hero.talent!.path,branch:b})}><strong>{SPECIALIZATION_BRANCHES[hero.class][hero.talent!.path][b].name}</strong><small>Escolha permanente</small></button>)}</div>}
            {hero.talent.rank === 2 && points > 0 && <button className="small-button gold" disabled={busy || !canAct} onClick={() => act({type:"specialize",heroId:hero.id,path:hero.talent!.path,branch:hero.talent!.branch})}>Desbloquear Ultimate</button>}
          </div>}
        </section>
        <section className="sheet-section"><label>Evolução Racial</label>
          {!hero.racial ? <div className="choice-grid">{(Object.keys(RACIAL_PATH_NAMES) as RacialPath[]).map(p => <button key={p} disabled={busy || !canAct || racePts < 1} onClick={() => act({type:"racial-specialize",heroId:hero.id,path:p})}><strong>{RACIAL_PATH_NAMES[p]}</strong><small>{RACE_TREES[heroRace(hero)][p].name}</small></button>)}</div>
          : <div className="talent-box"><h3>{RACE_TREES[heroRace(hero)][hero.racial.path].name} · Grau {hero.racial.rank}</h3><p>{RACE_TREES[heroRace(hero)][hero.racial.path].description}</p>{racePts > 0 && hero.racial.rank < 3 && <button className="small-button gold" disabled={busy || !canAct} onClick={() => act({type:"racial-specialize",heroId:hero.id,path:hero.racial!.path})}>Avançar árvore racial</button>}</div>}
        </section>
        <section className="sheet-section"><label>História Pessoal</label><h3>{story.title}</h3><p>{story.stages[Math.min(2, hero.storyStage || 0)]}</p>
          <button className="small-button" disabled={busy || !canAct || (hero.storyStage || 0) >= 3} onClick={() => act({type:"story-step",heroId:hero.id})}>{(hero.storyStage || 0) >= 3 ? "História concluída" : "Avançar história"}</button>
        </section>
        <section className="sheet-section"><label>Viagem</label>
          {journey ? <div className="journey-box"><strong>{journey.remaining} dia(s) restantes · +{journey.xpEarned} XP</strong><div className="choice-grid">{(Object.keys(JOURNEY_CHOICES) as JourneyChoice[]).map(c => <button data-active={journey.choice === c} key={c} onClick={() => act({type:"journey-choice",journeyId:journey.id,choice:c})}>{JOURNEY_CHOICES[c].name}</button>)}</div></div>
          : <div className="choice-grid">{([3,5,7] as JourneyDuration[]).map(d => <button key={d} disabled={busy || !canAct} onClick={() => act({type:"start-journey",heroId:hero.id,duration:d})}><strong>{d} dias</strong><small>Desenvolvimento individual</small></button>)}</div>}
        </section>
        <section className="sheet-section"><label>Equipamentos</label><div className="equipment-row">{equipped.length ? equipped.map(i => <ItemArt key={i.id} itemKey={i.key} />) : <small>Nenhum equipamento.</small>}</div><button type="button" className="hero-equipment-link" onClick={openEquipment}><GameSymbol kind="defense" aria-hidden="true"/> Ver equipamentos · 12 espaços <ChevronRight aria-hidden="true" /></button></section>
        <button className="action-button blue huge" disabled={busy || !canAct || hero.energy < 15} onClick={() => act({type:"train-hero",heroId:hero.id})}>Treino Individual · +{trainingPlan(state,hero).xp} XP</button>
      </article>
    </div>
  </section>;
}


const EQUIPMENT_ICONS = {
  weapon:Swords, offhand:Shield, helmet:Crown, shoulders:Shield,
  armor:Shirt, gloves:Hand, belt:Archive, boots:Footprints,
  cloak:Flag, ring1:Gem, ring2:Gem, amulet:Sparkles,
} satisfies Record<EquipmentSlotId, typeof Swords>;

function EquipmentPage({ state, selectedId, selectHero, back, act, busy }: {
  state: Campaign; selectedId: string; selectHero: (id: string) => void; back: () => void;
  act:(a:Action)=>void;busy:boolean;
}) {
  const hero = state.heroes.find(h => h.id === selectedId) || state.heroes[0];
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotId>("weapon");
  const activeSlot = EQUIPMENT_SLOTS.find(s => s.id === selectedSlot) || EQUIPMENT_SLOTS[0];
  const equippedCount = state.chest.filter(i => i.equippedTo === hero.id && ITEMS[i.key]).length;
  const used=state.chest.filter(i=>i.equippedTo===hero.id);
  const current=used.find(i=>(i.equippedSlot||equippedPosition(i.key))===selectedSlot);
  const candidates=state.chest.filter(i=>!i.equippedTo&&((equippedPosition(i.key)===selectedSlot)||(equippedPosition(i.key)==="ring"&&["ring1","ring2"].includes(selectedSlot))) &&
    (ITEMS[i.key]?.classes||[]).includes(hero.class)&&hero.level>=(ITEMS[i.key]?.levelReq||0));

  return <section className="screen equipment-screen" aria-label="Equipamentos de 12 espaços">
    <header className="equipment-page-header">
      <button type="button" className="equipment-back" onClick={back}>
        <ChevronLeft aria-hidden="true"/> Voltar aos Heróis
      </button>
      <div className="equipment-page-title"><GameSymbol kind="defense" aria-hidden="true"/><div>
        <h2>Equipamentos</h2><p>12 espaços por personagem</p>
      </div></div>
    </header>

    <section className="equipment-hero-card parchment" aria-label="Personagem selecionado">
      <HeroPortrait hero={hero} />
      <div className="equipment-hero-name"><strong>{hero.name}</strong>
        <span>{CLASSES[hero.class].name} · Nv. {hero.level}</span>
        <small>{equippedCount}/12 equipados</small>
      </div>
      <label className="equipment-hero-chooser">Trocar herói
        <select value={hero.id} onChange={e => selectHero(e.target.value)} aria-label="Escolher herói para visualizar equipamentos">
          {state.heroes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </label>
    </section>

    <p className="equipment-intro">Versão de teste: selecione um espaço para equipar ou remover itens. A versão principal permanece inalterada.</p>
    <div className="equipment-slot-grid" role="group" aria-label="12 espaços de equipamento">
      {EQUIPMENT_SLOTS.map((slot, i) => {
        const Icon = EQUIPMENT_ICONS[slot.id];
        return <button type="button" key={slot.id} className="equipment-slot" data-slot={slot.id}
          data-selected={selectedSlot === slot.id} aria-pressed={selectedSlot === slot.id}
          onClick={() => setSelectedSlot(slot.id)}>
          <span className="equipment-slot-icon"><Icon aria-hidden="true"/></span>
          <span className="equipment-slot-copy"><strong>{i + 1}. {slot.label}</strong><small>{used.find(x=>(x.equippedSlot||equippedPosition(x.key))===slot.id)?.key ? ITEMS[used.find(x=>(x.equippedSlot||equippedPosition(x.key))===slot.id)!.key]?.name : "Vazio"}</small></span>
        </button>;
      })}
    </div>
    <section className="equipment-slot-detail parchment" aria-live="polite">
      <span className="equipment-detail-label">{activeSlot.group}</span>
      <h3>{activeSlot.label}</h3><p>{activeSlot.description}</p>
      {current?<div><strong>{ITEMS[current.key]?.name}</strong><p>{ITEMS[current.key]?.description}</p><button className="action-button blue" disabled={busy} onClick={()=>act({type:"unequip",itemId:current.id})}>Desequipar</button></div>:
      <div><p>Sem item equipado neste espaço.</p><div className="catalog-equippable">
        {candidates.slice(0,8).map(i=><button key={i.id} className="small-button" disabled={busy} onClick={()=>act({type:"equip",itemId:i.id,heroId:hero.id})}><ItemArt itemKey={i.key}/>{ITEMS[i.key]?.name}</button>)}
      </div>{!candidates.length&&<small>Sem itens compatíveis no baú.</small>}</div>}
    </section>
    <button type="button" className="equipment-bottom-back" onClick={back}><ChevronLeft aria-hidden="true"/> Voltar à ficha do herói</button>
  </section>;
}

function ChestPage({ state, act, busy }: { state: Campaign; act: (a: Action) => void; busy: boolean }) {
  const [filter,setFilter] = useState("all");
  const [showCatalog,setShowCatalog] = useState(false);
  const [catalogPage,setCatalogPage] = useState(0);
  const [catalogSelection,setCatalogSelection] = useState("CG-001");
  const [selectedId,setSelectedId] = useState(state.chest[0]?.id || "");
  const [recipient,setRecipient] = useState(state.heroes[0]?.id || "");
  const [useHero,setUseHero] = useState(state.heroes[0]?.id || "");
  const filtered = state.chest.filter(i => {
    const slot = ITEMS[i.key]?.slot;
    if (filter === "all") return slot !== "material";
    if (filter === "weapons") return slot === "weapon" || slot === "offhand";
    if (filter === "armor") return ["helmet","armor","gloves","boots"].includes(slot);
    if (filter === "accessory") return slot === "accessory";
    if (filter === "consumable") return slot === "consumable";
    if (filter === "other") return slot === "quest" || slot === "treasure";
    return slot === "material";
  });
  const selected = filtered.find(i => i.id === selectedId) || filtered[0];
  const def = selected ? ITEMS[selected.key] : undefined;
  const owner = selected?.equippedTo ? state.heroes.find(h => h.id === selected.equippedTo) : undefined;
  const compatible = def ? state.heroes.filter(h => itemSlots.has(def.slot) && !heroOnExpedition(state,h.id) && (!def.race || heroRace(h) === def.race) && (!def.classes || def.classes.includes(h.class)) && (!def.levelReq || h.level >= def.levelReq)) : [];
  const target = compatible.some(h => h.id === recipient) ? recipient : compatible[0]?.id || "";
  if(showCatalog) {
    const visible=CATALOG_ITEMS.slice(catalogPage*30,(catalogPage+1)*30);
    const detail=CATALOG_BY_ID[catalogSelection]&&visible.some(d=>d.id===catalogSelection)?CATALOG_BY_ID[catalogSelection]:visible[0];
    const changePage=(next:number)=>{setCatalogPage(next);setCatalogSelection(CATALOG_ITEMS[next*30].id);};
    return <section className="screen chest-screen catalog-gallery">
      <div className="inventory-top"><button onClick={()=>setShowCatalog(false)}><GameSymbol kind="inventory"/> Meu inventário</button><strong><GameSymbol kind="book"/> Catálogo · 314 imagens</strong></div>
      <p className="catalog-note">Acervo visual dos 314 itens. Ver uma imagem não significa que o item esteja disponível na campanha.</p>
      <div className="catalog-pagination">
        <button disabled={catalogPage===0} onClick={()=>changePage(catalogPage-1)}>‹ Anterior</button>
        <strong>Página {catalogPage+1} de {Math.ceil(CATALOG_ITEMS.length/30)}</strong>
        <button disabled={(catalogPage+1)*30>=CATALOG_ITEMS.length} onClick={()=>changePage(catalogPage+1)}>Próxima ›</button>
      </div>
      <div className="inventory-layout">
        <div className="item-grid catalog-gallery-grid">
          {visible.map(d=><button key={d.id} data-active={detail?.id===d.id} className={"item-tile rarity-"+ITEMS[d.id].rarity} aria-label={d.id+" — "+d.nome}
           onClick={()=>setCatalogSelection(d.id)}><ItemArt itemKey={d.id}/><span>{d.id}</span></button>)}
        </div>
        {detail&&<article className="item-detail parchment">
          <span className="rarity-label">{detail.id} · {detail.raridade}</span><h2>{detail.nome}</h2>
          <div className="selected-item-art"><ItemArt itemKey={detail.id}/></div>
          <p><b>Categoria:</b> {detail.categoria} · {detail.subcategoria}</p>
          <p><b>Classes:</b> {detail.classes.join(", ")}</p>
          <p><b>Requisito:</b> Nível {detail.nivel}</p>
          <p><b>Função:</b> {detail.efeito}</p>
          <p><b>Como obter:</b> {detail.obtencao}</p>
          <p className="catalog-price"><GameSymbol kind="gold"/><b> Valor:</b> {detail.preco_compra!==null?fmt(detail.preco_compra)+" ouro de compra":"Não vendido por mercador"} · {fmt(detail.preco_venda)} de venda</p>
          <small>Disponibilidade e receitas dependem da evolução da campanha. Livros supremos exigem história pessoal e uma ativação por batalha.</small>
        </article>}
      </div>
    </section>;
  }
  return <section className="screen chest-screen">
    <div className="inventory-top"><button data-active><GameSymbol kind="inventory"/> Inventário</button><button onClick={()=>setShowCatalog(true)}><GameSymbol kind="book"/> Ver 314 itens</button><button onClick={() => setFilter("material")} data-active={filter === "material"}><GameSymbol kind="forge"/> Materiais</button><span><GameSymbol kind="inventory"/> {state.chest.length}/120</span></div>
    <div className="inventory-filters">{[["all","Todos"],["weapons","Armas"],["armor","Armaduras"],["accessory","Acessórios"],["consumable","Consumíveis"],["other","Outros"]].map(([id,label]) => <button key={id} data-active={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>
    <div className="inventory-layout">
      <div className="item-grid">{filtered.slice(0,40).map(item => <button key={item.id} data-active={selected?.id === item.id} className={"item-tile rarity-" + ITEMS[item.key].rarity} onClick={() => setSelectedId(item.id)}>
        <ItemArt itemKey={item.key} /><span>{ITEMS[item.key].name}</span>{item.equippedTo && <b>✓</b>}
      </button>)}</div>
      {selected && def ? <article className="item-detail parchment">
        <span className="rarity-label">{def.rarity.toUpperCase()}</span><h2>{def.name}</h2>
        <div className="selected-item-art"><ItemArt itemKey={selected.key} /></div>
        <p>{def.description}</p>
        <div className="item-stats">{([["Ataque",def.attack],["Defesa",def.defense],["Magia",def.magic],["Vida",def.hp],["Velocidade",def.speed]] as Array<[string,number|undefined]>).filter(([,v]) => v).map(([k,v]) => <span key={k}><b><GameSymbol kind={ATTRIBUTE_SYMBOLS[k]}/>{k}</b><em>+{v}</em></span>)}</div>
        {def.levelReq && <small>Nível necessário: {def.levelReq}</small>}
        {owner && <small>Equipado por {owner.name}</small>}
        {def.slot==="quest"&&CATALOG_BY_ID[selected.key]?.categoria==="Livro de magia suprema"&&
        <div className="item-book-learn"><strong>Aprender habilidade suprema:</strong>
        {state.heroes.filter(h=>({warrior:"Guerreiro",paladin:"Cavaleiro",ranger:"Arqueiro",rogue:"Assassino",mage:"Mago",healer:"Sacerdote",bard:"Pierrô"} as Record<string,string>)[h.class]===CATALOG_BY_ID[selected.key].classes[0]&&h.level>=CATALOG_BY_ID[selected.key].nivel).map(h=>
         <button key={h.id} className="action-button blue" disabled={busy||!!h.supremeBook||h.storyStage!==3} onClick={()=>act({type:"learn-book",itemId:selected.id,heroId:h.id})}>
         {h.name} · {h.storyStage===3?"Aprender":"História pessoal incompleta"}</button>)}
        </div>}
        {!owner && compatible.length > 0 && <select value={target} onChange={e => setRecipient(e.target.value)}>{compatible.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select>}
        <div className="item-actions">
          {itemSlots.has(def.slot) && (owner ? <button className="action-button blue" disabled={busy} onClick={() => act({type:"unequip",itemId:selected.id})}>Desequipar</button> : <button className="action-button green" disabled={busy || !target} onClick={() => target && act({type:"equip",itemId:selected.id,heroId:target})}>Equipar</button>)}
          {!owner && def.value>0 && <button className="action-button blue" disabled={busy} onClick={() => act({type:"sell",itemId:selected.id})}><GameSymbol kind="gold"/> Vender · {def.value}</button>}
          {def.slot==="consumable"&&(()=>{
            const outside=/energia|após uma expedição|entre expedições|eficiência/i.test(CATALOG_BY_ID[selected.key]?.efeito||"");
            return outside?<div className="catalog-consume">
              <select value={useHero} onChange={e=>setUseHero(e.target.value)}>
                {state.heroes.map(h=><option key={h.id} value={h.id}>{h.name} · Nv. {h.level}</option>)}
              </select>
              <button className="action-button green" disabled={busy} onClick={()=>act({type:"use-item",itemId:selected.id,heroId:useHero})}>Utilizar na sede</button>
             </div>:<div className="combat-only-note">Usar durante uma batalha.</div>;
          })()}
        </div>
      </article> : <div className="item-detail parchment empty-detail">Inventário vazio. Consiga materiais em missões ou visite o mercador.</div>}
    </div>
  </section>;
}

function TavernPage({ state, act, busy, openMission }: { state: Campaign; act: (a: Action) => void; busy: boolean; openMission: (id:string) => void }) {
  const recruits = market(state).slice(0,4);
  const rumors = missions(state).slice(0,3);
  return <section className="screen tavern-screen">
    <div className="tavern-hero"><img src={tavernArtwork} alt="Taverneira sorrindo e erguendo um caneco em brinde na Taverna da Guilda" /></div>
    <ParchmentTitle icon={<GameSymbol kind="squad"/>} title="Heróis para Recrutar" side={<span>Renova semanalmente</span>} />
    <div className="recruit-grid parchment">{recruits.map(h => <article key={h.id}><HeroPortrait hero={h} large /><h3>{h.name}</h3><span>{CLASSES[h.class].name}</span><small><GameSymbol kind="gold"/> {h.value} Ouro</small><button className="action-button red" disabled={busy || state.gold < h.value} onClick={() => act({type:"hire",heroId:h.id})}>Recrutar</button></article>)}</div>
    <div className="tavern-lower">
      <section className="rumors parchment"><ParchmentTitle icon={<GameSymbol kind="objective"/>} title="Rumores da Taverna" />{rumors.map(m => <button key={m.id} onClick={() => openMission(m.id)}><span><strong>{m.title}</strong><small>{m.description}</small></span><em><GameSymbol kind="gold"/> {m.reward}</em></button>)}</section>
      <aside className="tavern-side">
        <section className="parchment drinks"><div className="mug"><Beer aria-hidden="true"/></div><h3>Bebidas da Casa</h3><p>Brinde com a guilda para recuperar o moral e a energia.</p><button className="action-button green" disabled={busy || state.gold < 8} onClick={() => act({type:"rest"})}>Descansar</button></section>
        <section className="parchment shop"><div className="merchant-head"><img className="merchant-portrait" src={merchantPortrait} alt="Mercador da taverna medieval" /><span><h3><GameSymbol kind="merchant"/> Mercador Regional</h3><small>Estoque regional renovado semanalmente</small></span></div>
  <div className="catalog-shop">
  {testShop(state).map(d=>{
    const sold=state.shopPurchases.includes(Math.floor((state.day-1)/7)+":"+state.activeRegion+":"+d.id);
    return <div key={d.id}><ItemArt itemKey={d.id}/><span><strong>{d.nome}</strong><small>{d.id} · {d.raridade} · Nv. {d.nivel}</small></span><button className="small-button gold" disabled={busy||sold||state.chest.length>=120||state.gold<(d.preco_compra||0)} onClick={()=>act({type:"buy",key:d.id})}>{!sold&&<GameSymbol kind="gold"/>}{sold?"Esgotado":fmt(d.preco_compra||0)+" ouro"}</button></div>;
  })}
  {!testShop(state).length&&<small>Sem mercadorias nesta região.</small>}
  </div></section>
      </aside>
    </div>
  </section>;
}

const GUILD_ROOM_IMAGES:Record<HQBuilding,string>={
  infirmary:"/guild/rooms/infirmary.webp",
  forge:"/guild/rooms/forge.webp",
  academy:"/guild/rooms/academy.webp",
  library:"/guild/rooms/library.webp",
  stables:"/guild/rooms/stables.webp",
  warroom:"/guild/rooms/warroom.webp",
};
function GuildRoomArt({room,label,compact=false}:{room:HQBuilding;label:string;compact?:boolean}){
 return <img className={compact?"guild-room-art compact":"guild-room-art"}
  src={GUILD_ROOM_IMAGES[room]} alt={label} width={1280} height={720} loading="lazy"/>;
}
function AcademyPanel({ state, act, busy }: { state: Campaign; act: (a: Action) => void; busy: boolean }) {
  const slots = academySlots(state);
  const [draft,setDraft] = useState<string[]>(state.academy.trainees);
  useEffect(() => setDraft(state.academy.trainees), [state.academy.trainees.join(",")]);
  const mentor = state.heroes.find(h => h.id === state.academy.mentorId && h.level >= 5);
  const dailyXp = slots ? 8 + state.hq.academy * 7 + (mentor ? Math.min(18, mentor.level) : 0) : 0;
  const classOpen = state.academy.candidateSeason === state.season;
  const candidates = classOpen ? state.academy.candidates : [];
  const canFocus = state.academy.lastFocusDay !== state.day && state.gold >= ACADEMY_FOCUS_COST;
  function toggleStudent(id:string) {
    setDraft(old => old.includes(id) ? old.filter(x => x !== id) : old.length < slots ? [...old,id] : old);
  }
  return <div className="guild-mini parchment academy-system">
    <h3>Academia · Treinamento e Formação</h3>
    <p><strong>Treinamento de heróis:</strong> seus heróis já contratados ganham experiência diariamente sem lutar, desde que estejam na sede. A Academia oferece até 4 vagas e um mentor aumenta o XP recebido.</p>
    {!slots ? <p>Melhore a Academia na Sede (nível 1) para liberar o treinamento dos heróis e a seleção de pessoas comuns.</p> : <>
      <h4>Heróis em treinamento · {draft.length}/{slots}</h4>
      <small>Cada herói matriculado e disponível recebe {dailyXp} XP por dia. Heróis em expedição ou viagem não treinam.</small>
      <div className="academy-heroes">{state.heroes.slice(0,12).map(h => <button key={h.id} data-active={draft.includes(h.id)} onClick={() => toggleStudent(h.id)}><HeroPortrait hero={h}/><span>{h.name.split(" ")[0]}</span></button>)}</div>
      <button className="small-button" disabled={busy} onClick={() => act({type:"academy-trainees",heroIds:draft})}>Salvar heróis em treinamento</button>
      <label className="academy-mentor-label">Mentor (herói de nível 5+):
        <select value={state.academy.mentorId || ""} disabled={busy} onChange={e => act({type:"academy-mentor",heroId:e.target.value || undefined})}>
          <option value="">Sem mentor</option>{state.heroes.filter(h=>h.level>=5).map(h=><option key={h.id} value={h.id}>{h.name} · Nv. {h.level}</option>)}
        </select>
      </label>
    </>}
    <details className="academy-civilians" open>
      <summary>Formação de pessoas comuns · {candidates.length}/{ACADEMY_COMMONER_CAPACITY} candidatos</summary>
      <p>Em cada temporada de 28 dias, a Academia pode acolher <strong>10 cidadãos comuns</strong>. Eles treinam conforme os dias passam. A chance de passar na prova depende de seu potencial oculto, do nível da Academia, do mentor e dos treinos dedicados.</p>
      <p><strong>Somente os 2 melhores entre os que passarem na prova final se formam.</strong> Pode haver 0, 1 ou 2 formados. Gênios são raros e só revelam seu talento quando se formam.</p>
      {!slots ? <small>Primeiro construa a Academia para iniciar uma turma.</small> : !classOpen ?
        <button className="action-button green" disabled={busy || state.gold < ACADEMY_ENROLL_COST} onClick={() => act({type:"academy-open-class"})}>Selecionar 10 cidadãos · {ACADEMY_ENROLL_COST} ouro</button> :
        <div className="academy-candidate-list">
          <small>Temporada {state.season} · Dia {seasonDay(state)}/28 · Você pode dedicar um treino especial de {ACADEMY_FOCUS_COST} ouro por dia, a apenas um candidato.</small>
          {candidates.map(candidate => <div key={candidate.id} className="academy-candidate">
            <div><strong>{candidate.name}</strong><small>Vocação: {CLASSES[candidate.class].name} · Treinos dedicados: {candidate.practice}</small></div>
            <div className="academy-candidate-chance"><strong>{academyCandidateChance(state,candidate)}%</strong><small>Chance na prova</small></div>
            <button className="small-button" disabled={busy || !canFocus} onClick={() => act({type:"academy-focus",candidateId:candidate.id})}>Treinar · {ACADEMY_FOCUS_COST} ouro</button>
          </div>)}
        </div>}
      {state.academy.lastGraduation && <div className="academy-results"><strong>Resultado da temporada {state.academy.lastGraduation.season}</strong>
        <p>{state.academy.lastGraduation.approved.length} formados entre {state.academy.lastGraduation.evaluated} candidatos.
        {state.academy.lastGraduation.approved.length ? " " + state.academy.lastGraduation.approved.map(x=>x.name+(x.genius?" — GÊNIO REVELADO!":"")).join(", ") : " Nenhum candidato foi aprovado."}</p>
      </div>}
      {!!state.academy.reserve.length && <div className="academy-reserve"><h4>Formados esperando vaga · {state.academy.reserve.length}</h4>
        <small>A Guilda comporta 12 heróis. Formados aguardam na reserva até você admiti-los, sem pagar nova contratação.</small>
        {state.academy.reserve.map(h=><div className="academy-candidate" key={h.id}>
          <div><strong>{h.name}</strong><small>{CLASSES[h.class].name} · Nv. {h.level} · {h.trait}</small></div>
          <button className="small-button" disabled={busy || state.heroes.length>=12} onClick={()=>act({type:"academy-admit",heroId:h.id})}>Admitir na Guilda</button>
        </div>)}
      </div>}
    </details>
  </div>;
}
function RivalRecruitPanel({ state, act, busy }: { state: Campaign; act: (a: Action) => void; busy: boolean }) {
  const [guildId,setGuildId] = useState(state.rivals[0]?.id || "");
  const guild = state.rivals.find(g => g.id === guildId) || state.rivals[0];
  const [heroId,setHeroId] = useState(guild?.heroes[0]?.id || "");
  useEffect(() => { if (guild && !guild.heroes.some(h => h.id === heroId)) setHeroId(guild.heroes[0]?.id || ""); }, [guildId, guild?.heroes.length]);
  const hero = guild?.heroes.find(h => h.id === heroId) || guild?.heroes[0];
  return <div className="rival-recruit parchment"><h3>Recrutar de outra Guilda</h3><select value={guild?.id || ""} onChange={e => setGuildId(e.target.value)}>{state.rivals.slice(0,12).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
    {guild && hero && <><div className="rival-hero"><HeroPortrait hero={hero}/><span><strong>{hero.name}</strong><small>{CLASSES[hero.class].name} · Nv. {hero.level}</small></span><select value={hero.id} onChange={e => setHeroId(e.target.value)}>{guild.heroes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
      <div className="negotiation-grid">{(Object.keys(NEGOTIATION_MODES) as NegotiationMode[]).map(mode => {
        const q = negotiationQuote(state,guild,hero,mode);
        return <button key={mode} disabled={busy || !q.eligible} onClick={() => act({type:"negotiate-rival",guildId:guild.id,heroId:hero.id,mode})}><strong>{NEGOTIATION_MODES[mode].title}</strong><small><GameSymbol kind="gold"/> {q.price} ouro · {q.chance}%</small>{q.reason && <em>{q.reason}</em>}</button>;
      })}</div>
    </>}
  </div>;
}

function SupremeLibraryPanel({state,act,busy}:{state:Campaign;act:(a:Action)=>void;busy:boolean}){
 const [selectedHero,setSelectedHero]=useState(state.heroes[0]?.id||"");
 const h=state.heroes.find(x=>x.id===selectedHero)||state.heroes[0];
 const map:Record<string,string>={warrior:"Guerreiro",paladin:"Cavaleiro",ranger:"Arqueiro",rogue:"Assassino",mage:"Mago",healer:"Sacerdote",bard:"Pierrô"};
 const books=CATALOG_ITEMS.filter(d=>d.categoria==="Livro de magia suprema"&&d.classes.includes(map[h?.class]||""));
 return <section className="parchment catalog-forge supreme-library" aria-label="Livros supremos">
  <h3><GameSymbol kind="book"/> Biblioteca dos 14 Livros Supremos</h3>
  <p>A prova de classe exige história pessoal concluída, biblioteca nível 3, um chefe regional derrotado, materiais raros e ouro. O herói só aprende um livro.</p>
  <label>Herói da prova <select value={h?.id||""} onChange={e=>setSelectedHero(e.target.value)}>
   {state.heroes.map(x=><option key={x.id} value={x.id}>{x.name} · {CLASSES[x.class].name} · Nv. {x.level}</option>)}
  </select></label>
  {h?.supremeBook&&<p>Livro aprendido: {CATALOG_BY_ID[h.supremeBook]?.nome}</p>}
  {h?.supremeBook&&h.talent&&!h.supremeRespecced&&<button className="action-button blue" disabled={busy} onClick={()=>act({type:"reset-specialization",heroId:h.id})}>Corrigir especialização (uma vez)</button>}
  <div className="catalog-shop">{books.map(d=>{
    const price=Math.round((d.preco_compra||0)*.7);
    const res=(d.materiais||[]).map(mat=>({...mat,owned:state.chest.filter(i=>i.key===mat.id&&!i.equippedTo).length}));
    const ready=!!h&&h.level>=d.nivel&&h.storyStage===3&&state.hq.library>=3&&state.bossSeasons.length>0&&
      res.every(r=>r.owned>=r.quantidade)&&state.gold>=price&&state.chest.length<120;
    return <div key={d.id}><ItemArt itemKey={d.id}/><span><strong>{d.nome}</strong>
       <small>Nível {d.nivel} · {d.efeito}</small><small>{res.map(r=>r.quantidade+"× "+CATALOG_BY_ID[r.id]?.nome+" ("+r.owned+")").join(" + ")}</small></span>
       <button className="small-button gold" disabled={busy||!ready||!h} onClick={()=>h&&act({type:"scribe-book",bookId:d.id,heroId:h.id})}><GameSymbol kind="gold"/> Transcrever · {fmt(price)} ouro</button>
     </div>;
  })}</div>
 </section>;
}


const SYMBOL_GROUPS:Array<{title:string;kinds:GameSymbolKind[]}>= [
 {title:"Economia e progresso",kinds:["gold","reward","treasure","experience","fame","league"]},
 {title:"Missões e regiões",kinds:["objective","difficulty","mission","squad","duration","boss","elite","location","sanctuary"]},
 {title:"Atributos e combate",kinds:["attack","defense","critical","speed","health","magic","healing","energy"]},
 {title:"Itens e atividades",kinds:["forge","merchant","potion","book","rare","legendary","inventory","guild","locked"]},
];
function SymbolGuide(){
 return <details className="symbol-guide parchment">
  <summary><GameSymbol kind="help" size={19}/> Guia oficial de símbolos do jogo</summary>
  <p>O mesmo ícone representa o mesmo recurso, seja no PC ou no celular.</p>
  {SYMBOL_GROUPS.map(group=><section key={group.title}>
   <h4>{group.title}</h4>
   <div className="symbol-guide-grid">{group.kinds.map(kind=><span key={kind}>
    <GameSymbol kind={kind} size={19}/>{GAME_SYMBOLS[kind].label}
   </span>)}</div>
  </section>)}
 </details>;
}

function GuildPage({
  state, act, busy, onExport, onImport, onReset, musicEnabled, toggleMusic, liteMode, setLiteMode, musicIndex, nextTrack, onArenaDemo
}: { state: Campaign; act: (a: Action) => void; busy: boolean; onExport: () => void; onImport: () => void; onReset: () => void; musicEnabled: boolean; toggleMusic: () => void; liteMode: boolean; setLiteMode: (value:boolean) => void; musicIndex: number; nextTrack: () => void; onArenaDemo: () => void }) {
  const buildings = Object.entries(HQ_DEFINITIONS) as Array<[HQBuilding,(typeof HQ_DEFINITIONS)[HQBuilding]]>;
  const availableRaidHeroes = state.heroes.filter(h => available(h,state)).slice(0,9);
  const raidTeams = availableRaidHeroes.length >= 9 ? [availableRaidHeroes.slice(0,3).map(h=>h.id),availableRaidHeroes.slice(3,6).map(h=>h.id),availableRaidHeroes.slice(6,9).map(h=>h.id)] : [];
  return <section className="screen guild-screen">
    <div className="guild-identity parchment">
      <div className="guild-banner"><img src={LEAGUE_PLAYER_CREST} alt={"Brasão de "+state.name} width={88} height={102}/></div>
      <div><h2>{state.name}</h2><p>Força na união, glória em cada jornada.</p><span><GameSymbol kind="squad"/> Membros: {state.heroes.length}/12</span><span><GameSymbol kind="defense"/> Nível da Guilda: {Math.max(1,Math.ceil(state.fame/120))}</span></div>
      <aside><strong><GameSymbol kind="gold"/> Tesouro {fmt(state.gold)}</strong><strong><GameSymbol kind="fame"/> Renome {state.fame}</strong><strong><GameSymbol kind="league"/> Liga {rank(state)}</strong></aside>
    </div>
    <div className="arena-demo-entry">
      <div><span><Sparkles size={15}/> COMBATE REAL · ARENA 3D WEBGL</span><h3>Arena Tridimensional</h3><p>Gráficos 3D com personagens animados e cenários físicos. Usa as batalhas e resultados da sua expedição, sem roteiro de simulação. Abra os detalhes de uma expedição e escolha Arena 3D.</p></div>
      <button className="action-button gold" onClick={onArenaDemo}><Swords size={17}/> Ir às expedições <ChevronRight size={16}/></button>
    </div>
    {state.event && <div className="council parchment"><img src="/reference/guild-council-2026.jpg" alt="" /><div><h2>Decisão do Conselho</h2><p>{state.event.title}</p><small>{state.event.text}</small><div className="council-actions">{state.event.choices.map(c => <button key={c.id} disabled={busy || (!!c.cost && state.gold < c.cost)} onClick={() => act({type:"event",eventId:state.event!.id,choiceId:c.id})}>{c.label}<small>{c.effect}</small></button>)}</div></div></div>}
    <ParchmentTitle icon={<GameSymbol kind="guild"/>} title="Sede da Guilda" />
    <div className="building-list parchment">{buildings.map(([key,spec],index) => {
      const lvl = state.hq[key] || 0, max = spec.max, cost = hqUpgradeCost(state,key);
      return <article className="guild-building-card" key={key}>
        <GuildRoomArt room={key} compact label={spec.name+": local medieval da Sede da Guilda."}/><div><h3>{spec.name} <small>Nv. {lvl}</small></h3><p>{spec.description}</p></div><div><span><GameSymbol kind="gold"/> {cost}</span><button className="action-button green" disabled={busy || lvl >= max || state.gold < cost} onClick={() => act({type:"upgrade-hq",building:key})}>{lvl >= max ? "Máximo" : "Melhorar"}</button></div></article>;
    })}</div>
    <section className="parchment catalog-forge"><h3><GameSymbol kind="forge" size={18}/> Forja · Nv. {state.hq.forge}</h3>
    <div className="guild-forjador">
      <img src="/guild/forjador.webp" alt="O Forjador, mestre artesão da guilda, trabalhando com martelo e bigorna diante da fornalha." width={720} height={960} loading="lazy"/>
      <div><strong>O Forjador</strong><p>O mestre artesão da guilda transforma recursos raros em armas e equipamentos. Traga seus materiais, pague a taxa e escolha sua encomenda.</p>
       <small>{state.hq.forge>0?"Forja disponível · nível "+state.hq.forge:"Aprimore a Forja na Sede para liberar suas receitas."}</small></div>
    </div>
    <small>Consome materiais e taxa em ouro. Sem itens gratuitos.</small>
    <div className="catalog-shop">{TEST_RECIPES.filter(r=>r.forge>0&&r.forge<=state.hq.forge).slice(0,16).map(r=>{
      const enough=Object.entries(r.materials).every(([k,q])=>state.chest.filter(i=>i.key===k&&!i.equippedTo).length>=q);
      return <div key={r.id}><ItemArt itemKey={r.result}/><span><strong>{ITEMS[r.result]?.name}</strong><small>{Object.entries(r.materials).map(([k,q])=>q+"× "+(ITEMS[k]?.name||k)).join(" + ")}</small></span>
      <button className="small-button" disabled={busy||!enough||state.gold<r.cost||state.chest.length>=120} onClick={()=>act({type:"craft",recipeId:r.id})}><GameSymbol kind="gold"/> Forjar · {fmt(r.cost)}</button></div>;
    })}{!state.hq.forge&&<p>Melhore a Forja para liberar receitas.</p>}</div></section>
    <SupremeLibraryPanel state={state} act={act} busy={busy}/>
    <div className="guild-grid">
      <section className="guild-mini parchment"><h3>Mapa do Mundo</h3><div className="world-list">{WORLD_MAP.map((r,i) => <button key={r.name} data-active={state.activeRegion === i+1} disabled={i+1 > state.region || busy} onClick={() => act({type:"travel-region",region:i+1})}><strong>{i+1}. {r.name}</strong><small>{r.theme}</small></button>)}</div></section>
      <AcademyPanel state={state} act={act} busy={busy} />
      <section className="guild-mini parchment"><h3>Sala de Guerra · Guerra de Guildas</h3>
        <p>Envie três frentes simultâneas com 3 heróis cada.</p><button className="action-button red" disabled={busy || raidTeams.length !== 3 || activeExpeditions(state).length > 0} onClick={() => raidTeams.length === 3 && act({type:"guild-raid",teams:raidTeams})}>Iniciar Raid 3×3</button>{state.raidHistory[0] && <small>Última raid: {state.raidHistory[0].won ? "Vitória" : "Derrota"} · {state.raidHistory[0].fronts.filter(f=>f.won).length}/3 frentes</small>}</section>
    </div>
    <RivalRecruitPanel state={state} act={act} busy={busy} />
    <SymbolGuide />
    <ParchmentTitle icon={<GameSymbol kind="help"/>} title="Save e Configurações" />
    <div id="guild-settings" className="guild-settings-controls parchment">
      <div className="guild-setting-row">
        <div><strong>Trilha de fantasia · {RPG_MUSIC_TRACKS.length} músicas</strong><small>Tocando: {RPG_MUSIC_TRACKS[musicIndex].name} ({RPG_MUSIC_TRACKS[musicIndex].mood}). A sequência avança automaticamente sem repetir faixas até o final; volume pelos botões do celular.</small><button className="music-next-button" onClick={nextTrack} aria-label="Pular para a próxima música">Próxima música →</button></div>
        <button className="small-button" onClick={toggleMusic} aria-pressed={musicEnabled}>{musicEnabled ? <><Volume2 size={16}/> Música ligada</> : <><VolumeX size={16}/> Música desligada</>}</button>
      </div>
      <div className="guild-setting-row">
        <div><strong>Modo leve · melhor desempenho</strong><small>Reduz sombras, efeitos e animações para melhorar a fluidez e poupar bateria. Não altera missões, cálculos ou salvamentos.</small></div>
        <button className="small-button" aria-pressed={liteMode} onClick={() => setLiteMode(!liteMode)}>{liteMode ? "Ativado" : "Desativado"}</button>
      </div>
      <small className="music-credit">Trilhas de Juhani Junkala / SubspaceAudio, HydroGene, RandomMind (CC0) e Kevin MacLeod (CC BY 4.0). <a href="/music/CREDITOS.txt" target="_blank" rel="noreferrer">Ver licenças e créditos completos</a>. Mais de 30 minutos de faixas diferentes, disponíveis offline após o primeiro carregamento.</small>
    </div>
    <div className="settings-panel parchment"><button onClick={onExport}><Download /> Baixar backup</button><button onClick={onImport}><Upload /> Importar backup</button><button className="danger" onClick={onReset}><X /> Reiniciar campanha</button></div>
  </section>;
}


const CINEMA_STATUS_LABELS: Record<string,string> = {
  bleed:"Sangramento",poison:"Envenenado",stun:"Atordoado",shield:"Escudo",
  regen:"Regeneração",taunt:"Provocação",inspired:"Inspirado",vulnerable:"Vulnerável"
};
function CinematicBattlePage({ expedition, act, close, back, open3d, returnToTeam, busy }: {
  expedition: Expedition; act:(a:Action)=>void; close:()=>void; back:()=>void; open3d:()=>void; returnToTeam:()=>void; busy:boolean;
}) {
  const battle = expedition.battle;
  const fighters = battle.combat?.fighters || battle.fighters || [];
  const heroes = fighters.filter(f => f.side === "hero");
  const enemies = fighters.filter(f => f.side === "enemy");
  const active = battle.status === "active" && !!battle.combat;
  const recent = battle.log.slice(-4).reverse();
  const latest = recent[0];
  const turnNumber=battle.combat?.liveCursor || 0;
  const turnTotal=battle.combat?.liveOrder?.length || 0;
  const mission = battle.combat?.mission;
  const maxRounds = battle.objective?.targetRounds || battle.combat?.targetRounds;
  const round = battle.rounds;
  const health = (hp:number, max:number) => Math.max(0,Math.min(100,max ? hp/max*100 : 0));
  const status = active ? "Combate automático" : battle.won ? "Vitória da guilda" : battle.status === "retreated" ? "Equipe retirada" : "Combate encerrado";
  const event = latest?.kind === "critical" ? "critical" : latest?.kind === "heal" ? "heal" : latest?.kind === "ability" ? "magic" : "attack";
  return <section className="battle-sheet cinema-screen" aria-label="Arena Cinematográfica" data-combat-state={active ? "active" : "finished"}>
    <header className="cinema-header">
      <button type="button" className="cinema-back" onClick={back}><ChevronLeft aria-hidden="true"/> Tela clássica</button>
      <span className="cinema-header-label"><GameSymbol kind="battle" aria-hidden="true"/> ARENA CINEMATOGRÁFICA</span>
      <button type="button" className="cinema-close" onClick={close} aria-label="Fechar batalha"><X aria-hidden="true"/></button>
    </header>
    <div className="cinema-mission-head">
      <div><span className="cinema-eyebrow">MISSÃO EM ANDAMENTO</span><h2>{battle.title}</h2><p>{mission?.location || battle.objective?.name || "Terras da Guilda"}</p></div>
      <div className="cinema-round"><span>RODADA</span><strong>{round}{maxRounds ? " / "+maxRounds : ""}</strong></div>
    </div>
    <div className="cinema-objective-line"><GameSymbol kind="objective" aria-hidden="true"/><span>{battle.objective?.name || mission?.description || "Derrote os inimigos"}</span><b>{status}</b></div>
    <div className="battle-live-update cinema-live-update" role="status" aria-live="polite">
      <div><GameSymbol kind="battle" size={17}/><strong>{active ? "AÇÃO AO VIVO" : "BATALHA ENCERRADA"}</strong>{active&&turnTotal>0&&<small>Ação {turnNumber}/{turnTotal}</small>}</div>
      <p key={"action-"+battle.log.length}>{latest?.text || "Heróis e inimigos aguardam a primeira ação."}</p>
    </div>
    <div className="cinema-arena" role="region" aria-label="Campo de batalha com personagens e inimigos">
      <div className="cinema-atmosphere" aria-hidden="true"/>
      <div className="cinema-lightning" key={"beam-"+round+"-"+battle.log.length} aria-hidden="true"/>
      <div className="cinema-fronts">
        <div className="cinema-lineup cinema-heroes">
          <div className="cinema-lineup-title"><GameSymbol kind="defense" aria-hidden="true"/> SUA EQUIPE</div>
          {heroes.map((f,i) => <article className="cinema-fighter cinema-ally" key={f.id} data-defeated={f.hp <= 0} data-acting={latest?.actorId===f.id} data-targeted={latest?.targetId===f.id}>
            <div className="cinema-fighter-art">
              <img src={portraitSource(f.name,f.id,f.class || "warrior")} alt="" />
              <span className="cinema-art-index">{i+1}</span>
            </div>
            <div className="cinema-fighter-info">
              <strong>{f.name}</strong>
              <small>{f.class ? CLASSES[f.class].name : "Herói"}</small>
              <div className="cinema-health" role="progressbar" aria-label={"Vida de "+f.name} aria-valuenow={Math.max(0,f.hp)} aria-valuemin={0} aria-valuemax={f.maxHp}><i style={{width:health(f.hp,f.maxHp)+"%"}}/></div>
              <span className="cinema-hp">{fmt(Math.max(0,f.hp))} / {fmt(f.maxHp)} PV</span>
              {f.statuses && f.statuses.length > 0 && <span className="cinema-effects">{f.statuses.slice(0,2).map((s,j)=><em key={j} data-status={s.kind}>{CINEMA_STATUS_LABELS[s.kind] || s.kind}</em>)}</span>}
            </div>
          </article>)}
        </div>
        <div className="cinema-lineup cinema-enemies">
          <div className="cinema-lineup-title"><GameSymbol kind="battle" aria-hidden="true"/> INIMIGOS</div>
          {enemies.map((f,i)=><article className="cinema-fighter cinema-foe" key={f.id} data-defeated={f.hp <= 0} data-acting={latest?.actorId===f.id} data-targeted={latest?.targetId===f.id}>
            <div className="cinema-fighter-art">
              <img src={"/enemies/"+enemyArtKey(f.name)+".webp"} alt="" />
              <span className="cinema-art-index">{i+1}</span>
            </div>
            <div className="cinema-fighter-info">
              <strong>{f.name}</strong>
              <small>{f.hp <= 0 ? "Derrotado" : "Hostil"}</small>
              <div className="cinema-health" role="progressbar" aria-label={"Vida de "+f.name} aria-valuenow={Math.max(0,f.hp)} aria-valuemin={0} aria-valuemax={f.maxHp}><i style={{width:health(f.hp,f.maxHp)+"%"}}/></div>
              <span className="cinema-hp">{fmt(Math.max(0,f.hp))} / {fmt(f.maxHp)} PV</span>
              {f.statuses && f.statuses.length > 0 && <span className="cinema-effects">{f.statuses.slice(0,2).map((s,j)=><em key={j} data-status={s.kind}>{CINEMA_STATUS_LABELS[s.kind] || s.kind}</em>)}</span>}
            </div>
          </article>)}
        </div>
      </div>
      <div className="cinema-clash" aria-hidden="true"><GameSymbol kind="battle"/></div>
      {latest && <div key={"event-"+round+"-"+battle.log.length} className={"cinema-hit cinema-hit-"+event} aria-hidden="true">{latest.amount ? <><b>{event==="heal"?"+":"−"}{Math.abs(latest.amount)}</b><small>{event==="critical"?"CRÍTICO!":event==="heal"?"CURA":event==="magic"?"MAGIA":"DANO"}</small></> : <GameSymbol kind="experience"/>}</div>}
    </div>
    <div className="cinema-turn-bar">
      <div className="cinema-turn-title"><GameSymbol kind="experience" aria-hidden="true"/><span>{active ? "Combate ao vivo · ação por ação" : status}</span></div>
      <span>{TACTICS[expedition.tactic].name} · {heroes.length} heróis × {enemies.length} inimigos</span>
    </div>
    <section className="cinema-chronicle parchment" aria-label="Registro real da batalha">
      <header><GameSymbol kind="objective" aria-hidden="true"/><h3>Crônica do combate</h3><small>Atualização automática</small></header>
      <div className="cinema-chronicle-entries" aria-live="polite" aria-relevant="additions text">
        {recent.length ? recent.map((l,i)=><p key={battle.log.length-i} data-kind={l.kind}><span className="cinema-log-icon"><GameSymbol kind={l.kind==="heal"?"healing":l.kind==="critical"?"critical":l.kind==="ability"?"magic":"battle"} size={16}/></span><span>{l.text}</span></p>) : <p><span className="cinema-log-icon"><GameSymbol kind="battle"/></span><span>Os combatentes tomam posição para a batalha.</span></p>}
      </div>
    </section>
    <div className="cinema-actions">
      <button type="button" className="action-button battle-open-3d" onClick={open3d}><Swords aria-hidden="true"/> Abrir Arena 3D real</button>
      <button type="button" className="action-button battle-return-team" onClick={returnToTeam}><ChevronLeft aria-hidden="true"/> Voltar à seleção de heróis</button>
      {active ? <>
        <button type="button" className="action-button blue" disabled={busy} onClick={()=>act({type:"battle-auto",expeditionId:expedition.id})}><GameSymbol kind="battle" aria-hidden="true"/> Pular para o resultado</button>
        <button type="button" className="action-button red" disabled={busy} onClick={()=>act({type:"battle-retreat",expeditionId:expedition.id})}>Retirar equipe</button>
      </> : <button type="button" className="action-button green huge" onClick={close}>Voltar à guilda</button>}
    </div>
    <p className="cinema-no-items">Cada combatente age uma vez conforme a iniciativa. Os PV mudam na hora do golpe; o botão azul encerra a simulação instantaneamente se você preferir.</p>
  </section>;
}

function BattleOverlay({ state, expedition, act, close, returnToTeam, busy }: {
  state: Campaign; expedition: Expedition; act: (a: Action) => void; close: () => void; returnToTeam: () => void; busy: boolean;
}) {
  const [cinematic,setCinematic] = useState(false);
  const [show3d,setShow3d] = useState(false);
  const [show2d,setShow2d] = useState(true);
  const battle = expedition.battle;
  const fighters = battle.combat?.fighters || battle.fighters || [];
  const heroes = fighters.filter(f => f.side === "hero");
  const enemies = fighters.filter(f => f.side === "enemy");
  const active = battle.status === "active" && !!battle.combat;
  const latest = battle.log.at(-1);
  const turnNumber=battle.combat?.liveCursor || 0;
  const turnTotal=battle.combat?.liveOrder?.length || 0;
  if (show3d) return <div className="battle-overlay"><Arena3D key={expedition.id} expedition={expedition} act={act} close={()=>setShow3d(false)} returnToTeam={returnToTeam} busy={busy}/></div>;
  if (show2d) return <div className="battle-overlay"><Arena2D key={expedition.id} state={state} expedition={expedition} act={act} close={close}
    returnToTeam={returnToTeam} openClassic={()=>setShow2d(false)} open3d={()=>setShow3d(true)} busy={busy}/></div>;
  if (cinematic) return <div className="battle-overlay"><CinematicBattlePage expedition={expedition} act={act} close={close} back={() => setCinematic(false)} open3d={() => setShow3d(true)} returnToTeam={returnToTeam} busy={busy}/></div>;
  return <div className="battle-overlay">
    <section className="battle-sheet">
      <div className="battle-top"><div><strong>{battle.title}</strong><span>Rodada {battle.rounds}{battle.objective?.targetRounds ? "/" + battle.objective.targetRounds : ""}</span></div><button onClick={close}><X /></button></div>
      <div className="battle-objective"><span><GameSymbol kind="objective"/> {battle.objective?.name || "Objetivo"}</span><strong>{battle.status === "active" ? "Combate ao vivo" : battle.won ? "Vitória" : "Confronto encerrado"}</strong></div>
      <div className="battle-live-update" role="status" aria-live="polite">
        <div><GameSymbol kind="battle" size={17}/><strong>{active ? "AÇÃO AO VIVO" : "RESULTADO"}</strong>{active&&turnTotal>0&&<small>Ação {turnNumber}/{turnTotal}</small>}</div>
        <p key={"live-"+battle.log.length}>{latest?.text || "Os combatentes tomam posição e aguardam a iniciativa."}</p>
      </div>
      <div className="battle-stage">
        <div className="fighters allies">{heroes.map(f => <article key={f.id} data-acting={latest?.actorId===f.id} data-targeted={latest?.targetId===f.id}><HeroPortrait hero={{id:f.id,name:f.name,class:f.class || "warrior"}}/><div><strong>{f.name}</strong><small>{f.class ? CLASSES[f.class].name : "Herói"}</small><ProgressBar value={f.maxHp ? f.hp/f.maxHp*100 : 0} tone="red"/><span>{f.hp}/{f.maxHp}</span></div></article>)}</div>
        <div className="battle-center-mark"><GameSymbol kind="battle"/></div>
        <div className="fighters enemies">{enemies.map(f => <article key={f.id} data-acting={latest?.actorId===f.id} data-targeted={latest?.targetId===f.id}><img src={"/enemies/" + enemyArtKey(f.name) + ".webp"} alt="" /><div><strong>{f.name}</strong><small>{f.statuses?.map(s=>s.kind).join(" · ") || "Inimigo"}</small><ProgressBar value={f.maxHp ? f.hp/f.maxHp*100 : 0} tone="red"/><span>{f.hp}/{f.maxHp}</span></div></article>)}</div>
      </div>
      <div className="battle-log parchment">{battle.log.slice(-5).map((l,i) => <p key={i} data-kind={l.kind}>{l.text}</p>)}{!battle.log.length && <p>Os combatentes tomam posição.</p>}</div>
      {!active&&!!battle.loot?.length&&<div className="battle-loot parchment"><strong><GameSymbol kind="treasure"/> Itens encontrados:</strong> {battle.loot.map(id=>CATALOG_BY_ID[id]?.nome||id).join(" · ")}</div>}
       <div className="battle-actions">
        <button type="button" className="action-button green" onClick={() => setShow2d(true)}><Swords aria-hidden="true"/> Abrir Arena 2D 4 × 4</button>
        <button type="button" className="battle-open-3d" onClick={() => setShow3d(true)}><Swords aria-hidden="true"/> Entrar na Arena 3D <ChevronRight aria-hidden="true"/></button>
        <button type="button" className="cinema-open-button" onClick={() => setCinematic(true)}><GameSymbol kind="experience" aria-hidden="true"/> Abrir Arena Cinematográfica <ChevronRight aria-hidden="true"/></button>
        {active&&<div className="battle-item-actions">{state.chest.filter(i=>ITEMS[i.key]?.slot==="consumable"&&!/energia|após uma expedição|entre expedições/i.test(CATALOG_BY_ID[i.key]?.efeito||"")).slice(0,5).map(i=>
          <button key={i.id} className="action-button blue" disabled={busy||(battle.combat?.consumablesUsed||0)>=3}
            onClick={()=>act({type:"battle-item",itemId:i.id,expeditionId:expedition.id})}><ItemArt itemKey={i.key}/>{ITEMS[i.key]?.name}</button>
        )}</div>}
        {active&&<div className="supreme-battle-actions">{heroes.filter(f=>state.heroes.some(h=>h.id===f.id&&h.supremeBook)).map(f=>{
          const h=state.heroes.find(h=>h.id===f.id)!;
          const used=battle.combat?.supremeUsed?.[f.id];
          const pending=battle.combat?.pendingAbilities?.some(o=>o.heroId===f.id);
          return <button key={f.id} className="action-button gold" disabled={busy||!!used||!!pending||f.hp<=0}
            onClick={()=>act({type:"battle-ability",heroId:f.id,abilityId:"supreme-"+h.supremeBook,expeditionId:expedition.id})}>
            <GameSymbol kind="book"/> {h.name} · {used?"Usado":pending?"Aguardando":CATALOG_BY_ID[h.supremeBook!]?.nome}
          </button>;
        })}</div>}
        <button type="button" className="action-button battle-return-team" onClick={returnToTeam}><ChevronLeft aria-hidden="true"/> Voltar à seleção de heróis</button>
        {active ? <><button className="action-button blue" disabled={busy} onClick={() => act({type:"battle-auto",expeditionId:expedition.id})}>Pular para o resultado</button><button className="action-button red" disabled={busy} onClick={() => act({type:"battle-retreat",expeditionId:expedition.id})}>Retirar equipe</button></> : <button className="action-button green huge" onClick={close}>Voltar à guilda</button>}
      </div>
    </section>
  </div>;
}

export default function Game() {
  const [save,setSave] = useState<Save | null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [screen,setScreen] = useState<Screen>("mission");
  const [selectedMissionId,setSelectedMissionId] = useState("");
  const [team,setTeam] = useState<string[]>([]);
  const [formation,setFormation] = useState<Record<string,FormationLine>>({});
  const [tactic,setTactic] = useState<Tactic>("balanced");
  const [slot,setSlot] = useState<ExpeditionSlot>(1);
  const [selectedHeroId,setSelectedHeroId] = useState("");
  const [battleExpeditionId,setBattleExpeditionId] = useState<string | null>(null);
  const saveRef = useRef<Save | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { musicEnabled, toggleMusic, musicIndex, nextTrack } = useAmbientRpgMusic();
  const [liteMode,setLiteMode] = useState(() => {
    try {
      const saved=window.localStorage.getItem("cronicas-modo-leve");
      return saved === null ? /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) : saved === "on";
    } catch {return true;}
  });
  useEffect(() => {
    document.documentElement.classList.toggle("guild-lite-mode",liteMode);
    try {window.localStorage.setItem("cronicas-modo-leve",liteMode ? "on" : "off");} catch {}
    return () => document.documentElement.classList.remove("guild-lite-mode");
  },[liteMode]);

  const hydrate = useCallback((body: Save) => {
    setSave(body); saveRef.current = body;
    setTeam(body.state.team); setFormation(body.state.formation || {}); setTactic(body.state.tactic);
    setSelectedHeroId(old => body.state.heroes.some(h=>h.id===old) ? old : body.state.heroes[0]?.id || "");
    const free = freeExpeditionSlots(body.state); setSlot(old => free.includes(old) ? old : free[0] || 1);
    const all = [...missions(body.state), seasonBoss(body.state)].filter(Boolean) as Mission[];
    setSelectedMissionId(old => all.some(m=>m.id===old && !missionLocks(body.state,m).length) ? old : all.find(m=>!missionLocks(body.state,m).length)?.id || all[0]?.id || "");
  },[]);

  useEffect(() => {
    try { const current = readLocalCampaign(); hydrate({state:current.state,revision:current.revision}); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível abrir a campanha."); }
  },[hydrate]);

  const perform = useCallback((action: Action) => {
    const current = saveRef.current; if (!current || busy) return;
    setBusy(true); setError("");
    try {
      const result = updateLocalCampaign(current.revision,action);
      const next: Save = {state:result.state,revision:result.revision};
      hydrate(next);
      if (result.conflict) setError("A campanha mudou em outra aba. Estado atualizado.");
      if (action.type === "mission") {
        const newest = next.state.expeditions[next.state.expeditions.length-1];
        if (newest) setBattleExpeditionId(newest.id);
      }
    } catch(e) {
      setError(e instanceof Error ? e.message : "A ação não pôde ser concluída.");
    } finally { setBusy(false); }
  },[busy,hydrate]);

  const state = save?.state;
  const running = state ? activeExpeditions(state) : [];
  useEffect(() => {
    // A demonstração visual não executa sequer ticks das expedições reais.
    // Ao voltar para a Guilda, o jogo retoma normalmente.
    if (!state || !running.length || busy) return;
    const nextAt = Math.min(...running.map(e=>e.nextRoundAt));
    const wait = Math.max(100,Math.min(5000,nextAt-Date.now()+50));
    const timer = window.setTimeout(() => perform({type:"expedition-tick",now:Date.now()}),wait);
    return () => window.clearTimeout(timer);
  },[save?.revision,busy,screen,running.map(e=>e.nextRoundAt).join(","),perform]);

  if (!state) return <main className="boot-screen"><GameSymbol kind="guild"/><h1>Crônicas da Guilda</h1><p>{error || "Abrindo sua campanha…"}</p></main>;

  const allMissions = [...missions(state), seasonBoss(state)].filter(Boolean) as Mission[];
  const selectedMission = allMissions.find(m=>m.id===selectedMissionId) || allMissions[0];
  const battleExpedition = battleExpeditionId ? state.expeditions.find(e=>e.id===battleExpeditionId) : undefined;

  const go = (s: Screen) => { setScreen(s); window.scrollTo({top:0,behavior:liteMode?"instant":"smooth"}); };
  const openSettings = () => {
    setScreen("guild");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() =>
      document.getElementById("guild-settings")?.scrollIntoView({behavior:liteMode?"instant":"smooth",block:"start"})
    ));
  };
  const downloadBackup = () => {
    const blob = new Blob([exportLocalCampaign()],{type:"application/json"});
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href=url; a.download="cronicas-da-guilda-backup.json"; a.click(); URL.revokeObjectURL(url);
  };
  const restore = async (file: File) => {
    try { const next = importLocalCampaign(await file.text()); hydrate({state:next.state,revision:next.revision}); }
    catch(e){ setError(e instanceof Error ? e.message : "Backup inválido."); }
  };

  return <div className="app-shell">
    <TopBar state={state} goGuild={() => go("guild")} goSettings={openSettings} />
    <OfflineInstall />
    <div className="layout-frame">
      <aside className="nav-sidebar" aria-label="Navegação do jogo">
        {screen !== "guild" && screen !== "equipment" && <TopNav screen={screen} go={go} />}
        <BottomNav screen={screen} go={go} />
      </aside>
      {error && <button className="error" onClick={() => setError("")}><X /> {error}</button>}
      <main className="game-content">
      {screen === "mission" && <MissionPage state={state} selectedId={selectedMission.id} selectMission={setSelectedMissionId} goTeam={() => go("team")} />}
      {screen === "team" && <TeamPage state={state} selectedMission={selectedMission} team={team} formation={formation} tactic={tactic} slot={slot} busy={busy} setTeam={setTeam} setFormation={setFormation} setTactic={setTactic} setSlot={setSlot} act={perform} openBattle={setBattleExpeditionId} />}
      {screen === "league" && <LeaguePage state={state} team={team} act={perform} busy={busy} />}
      {screen === "rest" && <RestPage state={state} act={perform} busy={busy} />}
      {screen === "heroes" && <HeroPage state={state} selectedId={selectedHeroId} selectHero={setSelectedHeroId} openEquipment={() => go("equipment")} act={perform} busy={busy} />}
      {screen === "equipment" && <EquipmentPage state={state} selectedId={selectedHeroId} selectHero={setSelectedHeroId} back={() => go("heroes")} act={perform} busy={busy} />}
      {screen === "chest" && <ChestPage state={state} act={perform} busy={busy} />}
      {screen === "tavern" && <TavernPage state={state} act={perform} busy={busy} openMission={id => { setSelectedMissionId(id); go("mission"); }} />}
      {screen === "guild" && <GuildPage state={state} act={perform} busy={busy} onExport={downloadBackup} onImport={() => fileRef.current?.click()} onReset={() => { if (window.confirm("Reiniciar toda a campanha?")) perform({type:"reset"}); }} musicEnabled={musicEnabled} toggleMusic={toggleMusic} liteMode={liteMode} setLiteMode={setLiteMode} musicIndex={musicIndex} nextTrack={nextTrack} onArenaDemo={() => go("team")} />} 
      </main>
    </div>
    <input ref={fileRef} className="hidden-file" type="file" accept=".json,application/json" onChange={e => { const f=e.target.files?.[0]; if(f) void restore(f); e.currentTarget.value=""; }} />
    {battleExpedition && <BattleOverlay state={state} expedition={battleExpedition} act={perform} close={() => setBattleExpeditionId(null)} returnToTeam={() => {
      // Fecha apenas a interface do combate: a expedição permanece em andamento.
      setBattleExpeditionId(null);
      const availableSlots = freeExpeditionSlots(state);
      if (availableSlots.length) setSlot(availableSlots[0]);
      go("team");
    }} busy={busy} />}
  </div>;
}
