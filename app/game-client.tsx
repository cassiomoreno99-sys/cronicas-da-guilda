import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import OfflineInstall from "./offline-install";
import Arena2D from "./arena-2d";
import soundtrackLibrary from "@/lib/music-playlist.json";
import {
  Archive, BookOpen, Check, ChevronLeft, ChevronRight, CircleHelp, Coins, Crown, Download,
  Flag, Footprints, Gem, Hammer, Hand, Heart, LockKeyhole, ScrollText, Shield, Shirt, Sparkles, Swords,
  Target, Tent, Trophy, Upload, Users, Volume2, VolumeX, Beer, Settings, X
} from "lucide-react";
import {
  CLASSES, RACES, TACTICS, ITEMS, KIND_NAMES, PATH_NAMES, RACIAL_PATH_NAMES, RARITY_NAMES,
  SPECIALIZATIONS, SPECIALIZATION_BRANCHES, RACE_TREES, HERO_STORIES,
  HQ_DEFINITIONS, WORLD_MAP, NEGOTIATION_MODES, JOURNEY_CHOICES,
  activeExpeditions, freeExpeditionSlots, available, activeJourney, heroOnExpedition,
  heroRace, heroStats, threshold, missions, missionLocks, missionReadiness, missionSuggestedLevel, missionRewardXp, seasonBoss, bossTacticHint, tavernRumorReady, tavernRumorHint,
  teamPower, standings, heroLeaderboard, rivalRecruitCandidates, leaguePrize, leagueLineup, leagueCalendar, CUP_DAYS, cupStageLabel, market, talentPoints, racialPoints,
  trainingPlan, defaultFormationLine, formationValid, suggestSpecialistTeam,
  hqUpgradeCost, academySlots, academyCandidateChance, seasonDay, SEASON_DAYS, MAX_HERO_LEVEL, dailyContractsUsed, DAILY_CONTRACT_LIMIT, payroll,
  ACADEMY_COMMONER_CAPACITY, ACADEMY_ENROLL_COST, ACADEMY_FOCUS_COST, negotiationQuote, rankingRecruitQuote, rank, emergencyContractQuote, treasuryForecast, seasonalChallenges, regionInfluence,
  type Action, type Battle, type Campaign, type ChestItem,
  type EvolutionBranch, type Expedition, type ExpeditionSlot, type FormationLine,
  type Hero, type HQBuilding, type JourneyChoice, type JourneyDuration,
  type Mission, type NegotiationMode, type RacialPath, type TalentPath, type Tactic
} from "@/lib/game";
import {
  exportLocalCampaign, importLocalCampaign, readLocalCampaign, updateLocalCampaign, restoreRecoveryCampaign, recoveryAvailable,
  type LocalSave
} from "@/lib/local-save";
import { portraitSource } from "@/lib/portraits";
import {heroSex,HERO_SEX_LABEL} from "@/lib/hero-identity";
import {heroArtProgress} from "@/lib/hero-art";
import { chestCapacity, storageUsed } from "@/lib/storage";
import { familiarityBonus } from "@/lib/team-familiarity";
import { textoEmPortugues } from "@/lib/texto-portugues";
import { EXCLUSIVE_BY_ID } from "@/lib/exclusive-gear";
import { tavernArtwork } from "@/lib/scene-art/tavern";
import merchantPortrait from "@/lib/portrait-art/merchant";
import { GameSymbol, GAME_SYMBOLS, type GameSymbolKind } from "./game-symbols";
import { EQUIPMENT_SLOTS, type EquipmentSlotId } from "@/lib/equipment-layout";
import { testShop, CATALOG_ITEMS, CATALOG_GALLERY_ITEMS, CATALOG_BY_ID, filterCatalogGallery, type CatalogGalleryGroup, TEST_RECIPES, SETS, equippedPosition } from "@/lib/catalog-test";
import { missionLootPreview, equipmentSetProgress, imperialDropChance } from "@/lib/catalog-runtime";
import { IMPERIAL_WEAPONS, IMPERIAL_SETS, IMPERIAL_BOOKS, IMPERIAL_CLASSES, IMPERIAL_WEAPON_IDS, IMPERIAL_MIN_REGION, imperialSetProgress, imperialArtwork } from "@/lib/imperial-content";

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
  warrior:"Guerreiro", paladin:"Cavaleiro", rogue:"Assassino", ranger:"Arqueiro",
  undead:"Mago / Cavaleiro", boss:"Equipe completa"
};
const specialtyName = (value: string) => specialtyNames[value] || value;
const raceLabel = (hero: Pick<Hero,"id"|"name"|"class"|"race">): string => RACES[heroRace(hero)].name;
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

function HeroPortrait({ hero, large = false }: { hero: Pick<Hero, "id" | "name" | "class" | "race" | "sex">; large?: boolean }) {
  return <span
    className={"hero-portrait" + (large ? " hero-portrait-large" : "")}
    style={{ backgroundImage: `url("${portraitSource(hero.name, hero.id, hero.class, heroRace(hero),hero.sex)}")` }}
    role="img"
    aria-label={"Retrato de " + hero.name}
  />;
}

function ItemArt({ itemKey }: { itemKey: string }) {
 const item=CATALOG_BY_ID[itemKey];
 const imperialArt=imperialArtwork(itemKey);
 const artKey=EXCLUSIVE_BY_ID[itemKey]?.icon||itemKey;
 const index=/^CG-\d{3}$/.test(artKey)?Number(artKey.slice(3))-1:-1;
 if(imperialArt&&item) {
   const x=(imperialArt.index%4)/3*100,y=Math.floor(imperialArt.index/4)/3*100;
   return <span role="img" className="item-art imperial-item-art imperial-catalog-image rarity-legendary" aria-label={item.nome}
     style={{backgroundImage:`url("${imperialArt.src}")`,backgroundSize:"400% 400%",
       backgroundPosition:`${x}% ${y}%`,backgroundRepeat:"no-repeat"}}/>;
 }
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
    <div className="regional-progress parchment" aria-label="Influência regional">
      <strong><GameSymbol kind="scouting"/> Apoio regional: {WORLD_MAP[state.activeRegion-1]?.name}</strong>
      <span>{regionInfluence(state,WORLD_MAP[state.activeRegion-1]?.name||"")}/100 · até +6% ataque/magia e +5% recompensa quando completo</span>
      <small>Vitórias aumentam o apoio. Marcos de 25, 50, 75 e 100 rendem prestígio. No fim da temporada, a influência diminui 5 pontos.</small>
    </div>
    <div className="mission-daily-budget" role="status"><GameSymbol kind="scouting"/> Expedições do dia: <strong>{dailyContractsUsed(state)}/{DAILY_CONTRACT_LIMIT}</strong> · Um contrato pode ser tentado apenas uma vez por dia. Próximo dia libera novos contratos.</div>
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
            <div className="specialist"><GameSymbol kind="experience"/><span><strong>Nível recomendado: {Math.min(MAX_HERO_LEVEL,missionSuggestedLevel(m) + Math.floor((state.season - 1) / 3))}</strong> · {m.kind==="boss"?"Chefe de elite":"Perigo desta região"}</span></div>
            {regionInfluence(state,m.location)>0&&<small className="mission-rumor-ready"><GameSymbol kind="scouting"/> Influência local: {regionInfluence(state,m.location)}/100 · combate e prêmio melhores</small>}
            {m.kind==="boss"&&<small className="mission-boss-warning"><GameSymbol kind="defense"/> Aviso tático: {bossTacticHint(Math.max(0,state.activeRegion-1))}</small>}
            {tavernRumorReady(state,m.id)&&<small className="mission-rumor-ready"><GameSymbol kind="scouting"/> Rumor investigado · +10% ataque/magia e +5% defesa nesta expedição</small>}
            {!!locks.length && <small className="locked-copy"><GameSymbol kind="locked"/> {locks[0]}</small>}
          </div>
          <div className="mission-rewards">
            <span><GameSymbol kind="reward"/> {m.reward} Ouro</span>
            <span><GameSymbol kind="experience"/> Até +{missionRewardXp(m)} EXP</span>
            {!!missionLootPreview(state,m).length&&<small className="mission-special-loot"><GameSymbol kind="objective"/> Item de objetivo: {missionLootPreview(state,m).join(", ")}</small>}
            <small className="mission-material-loot"><GameSymbol kind="treasure"/> Materiais regionais e chance de equipamento</small>
             {m.kind==="boss"&&state.activeRegion>=6&&<small className="mission-special-loot"><Crown aria-hidden="true"/> Chance de obter peça Suprema Imperial: {(imperialDropChance(state,m,state.team)*100).toFixed(1)}% com a equipe atual (20% base + sorte + entrosamento).</small>}
            
            <button
              className={"action-button " + (index % 3 === 0 ? "red" : index % 3 === 1 ? "green" : "blue")}
              disabled={!!locks.length}
              onClick={() => { selectMission(m.id); goTeam(); }}
            >{locks.length ? (state.dailyActions?.missionIds?.includes(m.id) && state.dailyActions?.missionDay===state.day ? "Tentada" : "Bloqueada") : selected ? "Preparar" : "Aceitar"}</button>
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
  const canSaveLeague = team.length >= 3 && team.length <= 4 && new Set(team).size === team.length && !running.length && team.every(id=>{
    const h=state.heroes.find(x=>x.id===id);return !!h&&available(h,state);
  });
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
        {(()=>{const f=familiarityBonus(state.teamFamiliarity,team);return <div className="team-familiarity" aria-label="Entrosamento da equipe"><strong>Entrosamento: nível {f.level}/5</strong><small>{f.expeditions} expedições juntos · {f.next?f.next+" até o próximo bônus":"Entrosamento máximo"}</small>
        <span>Crítico +{(f.critical*100).toFixed(1)}% · Defesa +{(f.defense*100).toFixed(1)}% · Vida +{(f.hp*100).toFixed(1)}% · Dano +{(f.damage*100).toFixed(1)}% · Cura +{(f.healing*100).toFixed(1)}%</span>
         {selectedMission.kind==="boss"&&state.activeRegion>=6&&<small>Chance de peça Suprema Imperial: <strong>{(imperialDropChance(state,selectedMission,team)*100).toFixed(1)}%</strong> (20% base + sorte média + entrosamento da formação).</small>}</div>})()}
        <div className="tactic-row">{(Object.keys(TACTICS) as Tactic[]).map(t => <button key={t} data-active={tactic === t} onClick={() => setTactic(t)}>{TACTICS[t].name}</button>)}</div>
        <div className="team-power"><GameSymbol kind="battle"/><span>Poder da Equipe</span><strong>{fmt(power)}</strong></div>
      </div>
    </div>
    <div className="league-team-save parchment"><div><strong>Equipe oficial da Liga e Copa</strong><small>Monte 3 ou 4 heróis, escolha a formação e a tática e salve. Esta equipe jogará ao encerrar o dia.</small></div>
      <button type="button" className="action-button blue" disabled={!canSaveLeague||busy}
        onClick={()=>act({type:"league-lineup",team,tactic,formation})}>Salvar para Liga e Copa</button>
    </div>
    <div className="send-row">
      <div><strong>{state.event ? "Conselho pendente" : "Pronto para a Expedição?"}</strong><span>{state.event ? "Resolva a decisão do conselho na Guilda antes de partir." : selectedMission.title + " · vaga " + slot}</span></div>
      <button className="action-button green huge" disabled={!canSend || busy} onClick={() => act({
        type:"mission", missionId:selectedMission.id, team, tactic, formation, expeditionSlot:slot, startedAt:Date.now()
      })}><GameSymbol kind="battle"/> Enviar</button>
    </div>
  </section>;
}

function LeaguePage({ state, team, act, busy, openTeam }: { state: Campaign; team: string[]; act: (a: Action) => void; busy: boolean; openTeam:()=>void }) {
  const [rankHeroId,setRankHeroId] = useState<string | null>(null);
  const rankDialogRef=useRef<HTMLElement>(null);
  const ranking=heroLeaderboard(state).slice(0,10);
  const inspected=ranking.find(h=>h.id===rankHeroId);
  const inspectedGuild=inspected&&!inspected.owned?state.rivals.find(g=>g.heroes.some(h=>h.id===inspected.id)):undefined;
  const inspectedRival=inspectedGuild?.heroes.find(h=>h.id===rankHeroId);
  const quotePersuade=inspectedRival&&inspectedGuild?rankingRecruitQuote(state,inspectedGuild,inspectedRival,"persuade"):null;
  const quoteBuyout=inspectedRival&&inspectedGuild?rankingRecruitQuote(state,inspectedGuild,inspectedRival,"buyout"):null;
  useEffect(()=>{
    if(!rankHeroId)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    rankDialogRef.current?.focus();
    const handleKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setRankHeroId(null);};
    document.addEventListener("keydown",handleKey);
    return()=>{document.body.style.overflow=previous;document.removeEventListener("keydown",handleKey);};
  },[rankHeroId]);
  const contract=(method:"persuade"|"buyout")=>{
    if(!inspected||!inspectedGuild)return;
    const q=method==="buyout"?quoteBuyout:quotePersuade;
    if(!q?.eligible||busy)return;
    const prompt=method==="buyout"
      ?"Contratar "+inspected.name+" diretamente? Multa: "+fmt(q.price)+" ouro. Serão DESCONTADOS "+q.prestigeCost+" pontos de prestígio. A contratação é garantida."
      :"Tentar persuadir "+inspected.name+"? Chance: "+q.chance+"%. Se aceitar: "+fmt(q.price)+" ouro. Se recusar: taxa de abordagem de "+fmt(q.fee)+" ouro. Prestígio não é gasto.";
    if(window.confirm(prompt))act({type:"rank-recruit",guildId:inspectedGuild.id,heroId:inspected.id,method});
  };
  const table = standings(state);
  const place = table.findIndex(g => g.id === "player") + 1;
  const rival = table.find(g => g.id !== "player");
  const rivalData = rival ? state.rivals.find(r => r.id === rival.id) : undefined;
  const lineup=leagueLineup(state);
  const fixtures=leagueCalendar(state,7);
  const latest=state.leagueHistory.filter(m=>m.season===state.season).slice(0,5);
  const closeRank=table.slice(Math.max(0,place-4),Math.min(table.length,place+2));
  const nextCup=state.cup.stage==="eliminated"||state.cup.stage==="champion"
    ? undefined : CUP_DAYS.find(day=>day>=seasonDay(state)&&!state.cup.history.some(m=>m.day===day));
  return <section className="screen league-screen">
    <div className="league-summary parchment">
      <div><span>Nossa Posição</span><strong>{place}º</strong></div>
      <div className="big-crest"><img src={LEAGUE_PLAYER_CREST} alt={"Brasão de "+state.name} width={90} height={104}/></div>
      <div><h2>{state.name}</h2><p><img className="league-trophy-art" src={LEAGUE_TROPHY} alt="" width={28} height={28}/> {state.points} Pontos da Liga</p><small><GameSymbol kind="fame"/> Prestígio: {state.fame} · Divisão {rank(state)}</small></div>
    </div>
    <div className="league-fase2-brief parchment" aria-label="Próxima partida da Liga">
      <div><strong>Próximo jogo · Dia {seasonDay(state)}/60</strong>
        <span>{fixtures[0]?.opponent.name||"Adversário ainda não definido"}</span>
        <small>A partida acontece ao encerrar o dia na Guilda.</small></div>
      <div><strong>Escalação oficial {lineup.ids.length}/4</strong><small>{lineup.ids.map(id=>state.heroes.find(h=>h.id===id)?.name).join(" · ")||"Nenhum herói pronto"} · </small><small>{lineup.ready?"Pronta para Liga e Copa · "+TACTICS[state.leagueTactic??state.tactic].name:"ATENÇÃO: menos de 3 heróis prontos. Derrota por W.O. se encerrar o dia."}</small></div>
      <button type="button" className="action-button blue" onClick={openTeam}>Preparar equipe</button>
      <div className="league-reserve-controls">
        <label><input type="checkbox" checked={!!state.leagueAutoSub} disabled={busy}
          onChange={e=>act({type:"league-auto-reserve",enabled:e.target.checked})}/>
          <strong>Reservas automáticos (opcional)</strong></label>
        <small>{state.leagueAutoSub?"Se titulares estiverem indisponíveis, reservas aptos entram automaticamente.":"Apenas titulares escalados podem jogar."}
          {!!lineup.reserves.length&&" Substitutos: "+lineup.reserves.map(id=>state.heroes.find(h=>h.id===id)?.name).join(", ")+"."}</small>
      </div>
    </div>
    <ParchmentTitle icon={<img className="league-trophy-art" src={LEAGUE_TROPHY} alt="" width={31} height={31}/>} title="Classificação da Liga" side={<span>Temporada {state.season}</span>} />
    <div className="league-table parchment">
      <div className="league-head"><b>#</b><b>Guilda</b><b><img className="league-trophy-art" src={LEAGUE_TROPHY} alt="" width={18} height={18}/> Pontos</b><b><GameSymbol kind="reward"/> Recompensa</b></div>
      {table.slice(0,10).map((g,i) => <div key={g.id} className="league-row" data-player={g.id === "player"}>
        <strong>{i+1}</strong><span><img className="league-rival-crest" src={leagueCrest(g)} alt={"Brasão de "+g.name} width={42} height={48}/>{g.name}</span><b><img className="league-trophy-art" src={LEAGUE_TROPHY} alt="" width={25} height={25}/> {g.points}</b><small><GameSymbol kind="reward"/> {leaguePrize(i+1, state.leagueTier)} ouro</small>
      </div>)}
    </div>
    {place>10&&<div className="league-close-ranking parchment" aria-label="Sua posição na classificação"><strong>Sua posição na classificação geral · {place}º/100</strong>
      {closeRank.map(g=><div key={g.id} data-player={g.id==="player"}><span>{table.indexOf(g)+1}º · {g.name}</span><b>{g.points} pontos</b></div>)}
    </div>}
    <div className="league-fase2-grid">
      <section className="league-fase2-calendar parchment" aria-label="Calendário da Liga">
        <h3>Próximos jogos da Liga</h3><small>Um confronto por dia; confira o adversário antes de encerrar a rodada.</small>
        {fixtures.map(f=><div className="league-fixture" key={f.day}><b>Dia {String(f.day).padStart(2,"0")}</b><span>{f.opponent.name}{f.rivalry?" · Rivalidade":""}</span><strong>{f.match?f.match.playerScore+" × "+f.match.opponentScore:"A jogar"}</strong></div>)}
        <h4>Últimos resultados</h4>
        {latest.length?latest.map(m=><div className="league-fixture" key={m.season+"-"+m.day}><b>Dia {m.day}</b><span>{m.opponentName}</span><strong>{m.forfeit?"Derrota por ausência":m.playerScore+" × "+m.opponentScore}</strong></div>):<p>Nenhuma partida disputada nesta temporada.</p>}
      </section>
      <section className="league-fase2-cup parchment" aria-label="Chaveamento da Copa das Guildas">
        <h3>Copa das Guildas</h3><p>Situação: <strong>{cupStageLabel(state.cup.stage)}</strong></p>
        <small>{nextCup?"Próxima fase no dia "+nextCup+"/60. Prepare sua escalação na tela Equipe.":state.cup.stage==="champion"?"Título conquistado!":"Participação encerrada nesta temporada."}</small>
        {CUP_DAYS.map((day,i)=>{
          const match=state.cup.history.find(m=>m.day===day);
          const stage=["Oitavas","Quartas","Semifinal","Final"][i];
          return <div className="cup-stage" key={day} data-result={match?.result||"pending"}><b>{stage} · Dia {day}</b><span>{match?match.opponentName:state.cup.stage==="eliminated"?"Não disputada":"A definir"}</span><strong>{match?(match.forfeit?"Derrota por ausência":match.playerScore+" × "+match.opponentScore)+" · "+(match.result==="win"?"Vitória":"Eliminação"):"—"}</strong></div>;
        })}
      </section>
    </div>
    <ParchmentTitle icon={<GameSymbol kind="squad"/>} title="Classificação dos 10 Melhores Heróis" side={<span>Equipamentos e evolução contam no poder</span>}/>
    <section className="heroes-top10 parchment" aria-label="Classificação dos 10 melhores heróis">
      {ranking.map((h,i)=><article key={h.id} className="hero-ranking-card" data-player={h.owned}>
        <b>{i+1}º</b><HeroPortrait hero={h.hero}/><div className="rank-hero-identity"><strong>{h.name}</strong><small>{h.guild} · {RACES[h.race].name} · Nv. {h.hero.level}</small></div>
        <div className="rank-card-actions"><span>{fmt(h.score)} poder{i<3&&<small>3 primeiros: ouro + relíquia racial</small>}</span>
          <button type="button" className="rank-profile-trigger" onClick={()=>setRankHeroId(h.id)} aria-label={"Ver características de "+h.name}>Ver ficha</button>
        </div>
      </article>)}
    </section>
    {state.seasonAwards?.[0]&&<div className="season-awards-history parchment"><strong>Premiação da temporada {state.seasonAwards[0].season}</strong><small>Guildas: {state.seasonAwards[0].guildWinners.map(g=>g.name).join(" · ")}</small><small>Heróis: {state.seasonAwards[0].heroWinners.map(h=>h.name+" ("+RACES[h.race].name+")").join(" · ")}</small></div>}
    <ParchmentTitle icon={<GameSymbol kind="battle"/>} title="Desafio de Guilda" side={<span>Equipe: {team.length}/4</span>} />
    <div className="guild-challenge parchment">
      <img className="guild-challenge-art" src="/reference/olho-rubro-report-2026.webp" alt="Relatório completo do Olho Rubro: estandarte, reduto inimigo e informações da missão." width={1536} height={1024} />
      <div><h2>{rivalData?.name || "Guilda Rival"}</h2><p>Uma guilda rival disputa influência e prestígio. Derrote-a para fortalecer sua posição.</p>
        <span><GameSymbol kind="league"/> {rivalData?.points || 0} pontos</span><span><GameSymbol kind="attack"/> Força {rivalData?.strength || 0}</span>
      </div>
      <button className="action-button red huge" disabled={busy || !rivalData || team.length < 3 || activeExpeditions(state).length > 0 || state.raidHistory.some(r=>r.day===state.day) || state.rivalBattleHistory.some(r=>r.day===state.day)}
        onClick={() => rivalData && act({ type:"rival-battle", guildId:rivalData.id, team })}>Desafiar</button>
    </div>
    {state.lastNegotiation&&state.lastNegotiation.day===state.day&&<div className="rank-transfer-result parchment" role="status">
      <strong>{state.lastNegotiation.success?"Contratação realizada":"Proposta recusada"}</strong>
      <p>{textoEmPortugues(state.lastNegotiation.message)}</p>
    </div>}
    {rankHeroId&&<div className="rank-hero-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setRankHeroId(null);}}>
      <section ref={rankDialogRef} className="rank-hero-modal" role="dialog" aria-modal="true" aria-label={inspected?"Características de "+inspected.name:"Herói não disponível"} tabIndex={-1}>
        <button type="button" className="rank-hero-close" aria-label="Fechar ficha" onClick={()=>setRankHeroId(null)}><X size={21}/></button>
        {inspected?(()=>{
          const hero=inspected.hero,stats=heroStats(hero,inspected.owned?state:undefined);
          return <>
            <div className="rank-modal-heading">
              <HeroPortrait hero={hero} large/>
              <div><small>{ranking.findIndex(h=>h.id===inspected.id)+1}º na classificação · {fmt(inspected.score)} poder</small>
                <h2>{inspected.name}</h2>
                <p>{CLASSES[hero.class].name} · {RACES[inspected.race].name} · {HERO_SEX_LABEL[heroSex(hero)]}</p>
                <small>{inspected.guild} · Nível {hero.level}</small>
              </div>
            </div>
            <p className="rank-hero-trait">{textoEmPortugues(hero.trait||"Aventureiro experiente da Liga")}</p>
            <div className="rank-modal-stats">
              {[
                ["Ataque",Math.round(stats.attack)],["Defesa",Math.round(stats.defense)],
                ["Magia",Math.round(stats.magic)],["Energia",hero.energy+"%"],
                ["Velocidade",Math.round(stats.speed)],["Crítico",Math.round(stats.critical*100)+"%"],
                ["Experiência",fmt(hero.xp)],["Salário semanal",fmt(hero.salary)+" ouro"]
              ].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}
            </div>
            <div className="rank-modal-extra">
              <span>Especialização: <strong>{hero.talent?PATH_NAMES[hero.talent.path]+" · grau "+hero.talent.rank:"Não definida"}</strong></span>
              <span>Talento racial: <strong>{hero.racial?RACIAL_PATH_NAMES[hero.racial.path]+" · grau "+hero.racial.rank:"Não definido"}</strong></span>
              <span>Condição: <strong>{hero.injuredUntil>state.day?"Ferido até o dia "+hero.injuredUntil:"Disponível conforme energia"}</strong></span>
              {inspectedGuild&&<span>Lealdade à guilda atual: <strong>{inspectedRival?.loyalty}/100</strong></span>}
            </div>
            <div className="rank-modal-contracts">
              <h3>Trazer para sua guilda</h3>
              {inspected.owned?<p>Este herói já pertence à sua guilda. Não há multa nem negociação.</p>:
                inspectedGuild&&quotePersuade&&quoteBuyout?<>
                  <button type="button" className="rank-contract-button persuasion" disabled={busy||!quotePersuade.eligible} onClick={()=>contract("persuade")}>
                    <strong>Persuadir o herói · {quotePersuade.chance}% de chance</strong>
                    <span>Se aceitar: {fmt(quotePersuade.price)} ouro · Se recusar: {fmt(quotePersuade.fee)} ouro</span>
                    <small>Sem gasto de prestígio · Salário: {quotePersuade.salary} ouro/semana</small>
                  </button>
                  {quotePersuade.reason&&<small className="rank-contract-reason">{quotePersuade.reason}</small>}
                  <button type="button" className="rank-contract-button buyout" disabled={busy||!quoteBuyout.eligible} onClick={()=>contract("buyout")}>
                    <strong>Contratar direto · Multa {fmt(quoteBuyout.price)} ouro</strong>
                    <span>Gasta {fmt(quoteBuyout.prestigeCost)} pontos de prestígio · Chance: 100%</span>
                    <small>Requer {fmt(quoteBuyout.requiredFame)} de prestígio disponível · Salário: {quoteBuyout.salary} ouro/semana</small>
                  </button>
                  {quoteBuyout.reason&&<small className="rank-contract-reason">{quoteBuyout.reason}</small>}
                  <p className="rank-contract-budget">Seu tesouro: {fmt(state.gold)} ouro · Seu prestígio: {fmt(state.fame)} pontos. Limite compartilhado: 3 propostas por semana.</p>
                </>:<p>Este herói não está mais disponível na guilda indicada. Atualize a classificação.</p>}
              {state.lastNegotiation?.heroId===inspected.id&&state.lastNegotiation.day===state.day&&<p className="rank-contract-feedback" role="status">{textoEmPortugues(state.lastNegotiation.message)}</p>}
            </div>
          </>;
        })():<div className="rank-modal-unavailable"><h2>Classificação atualizada</h2><p>Esse herói saiu da lista dos 10 melhores. Feche a ficha e escolha outro participante.</p></div>}
      </section>
    </div>}
  </section>;
}

function RestPage({ state, act, busy }: { state: Campaign; act: (a: Action) => void; busy: boolean }) {
  const recover = state.heroes.filter(h => h.energy < 100 || h.injuredUntil > state.day);
  const shown = recover.length ? recover : state.heroes;
  return <section className="screen rest-screen">
    <div className="sanctuary-head parchment">
      <img src="/reference/sanctuary-2026.webp" alt="Santuário da Guilda: acampamento medieval com leitos de recuperação, fogueira, lanternas e o estandarte azul da guilda." width={1360} height={765} />
      <div><h2><GameSymbol kind="sanctuary"/> Santuário da Guilda</h2><p>Recupere 40 de energia dos heróis presentes por 8 ouro. Ferimentos ainda exigem o prazo indicado de dias.</p>
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
        <button className="action-button blue" disabled={busy || !!state.event || !available(h,state) || state.gold < plan.cost || state.hqActionDay[h.id]===state.day} onClick={() => act({ type:"train-hero", heroId:h.id })}>Treinar +{plan.xp} EXP</button>
      </article>;
    })}</div>
        <button className="action-button green rest-all" disabled={busy || !!state.event || activeExpeditions(state).length>0 || state.gold<8 || state.dailyActions?.restDay===state.day} onClick={() => act({ type:"rest" })}><GameSymbol kind="sanctuary"/> Descansar na sede · 8 ouro</button>
        {state.dailyActions?.restDay===state.day&&<small role="status">Descanso de hoje realizado. Disponível novamente no próximo dia.</small>}
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
        <div className="hero-feature"><div className="feature-portrait"><HeroPortrait hero={hero} large /></div><div><h2>{hero.name}</h2><p>{textoEmPortugues(hero.trait)}</p></div></div>
        <div className="hero-level"><strong>Nv. {hero.level}</strong><ProgressBar value={hero.level >= 50 ? 100 : hero.xp / threshold(hero) * 100} tone="gold" /><span>{hero.xp}/{hero.level >= 50 ? "MÁX." : threshold(hero)} EXP</span></div>
        <div className="hero-core"><div><span>Classe</span><strong>{CLASSES[hero.class].name}</strong></div><div><span>Raça</span><strong>{raceLabel(hero)}</strong></div><div><span>Sexo</span><strong>{HERO_SEX_LABEL[heroSex(hero)]}</strong></div><div><span>Força</span><strong>{fmt(teamPower(state,[hero.id]))}</strong></div></div>
        <section className="sheet-section"><label>Atributos</label><div className="stat-grid">
          <b><GameSymbol kind="health"/> Vida <em>{stats.hp}</em></b><b><GameSymbol kind="attack"/> Ataque <em>{stats.attack}</em></b><b><GameSymbol kind="defense"/> Defesa <em>{stats.defense}</em></b><b><GameSymbol kind="magic"/> Magia <em>{stats.magic}</em></b><b><GameSymbol kind="critical"/> Crítico <em>{Math.round(stats.critical*100)}%</em></b><b><GameSymbol kind="speed"/> Velocidade <em>{stats.speed}</em></b>
        </div></section>
        <section className="sheet-section"><label>Especialidade</label>
          {!hero.talent && <div className="choice-grid">{(Object.keys(PATH_NAMES) as TalentPath[]).map(p => <button disabled={busy || !canAct || points < 1} key={p} onClick={() => act({type:"specialize",heroId:hero.id,path:p})}><strong>{PATH_NAMES[p]}</strong><small>{SPECIALIZATIONS[hero.class][p].name}</small></button>)}</div>}
          {hero.talent && <div className="talent-box"><h3>{SPECIALIZATIONS[hero.class][hero.talent.path].name} · Grau {hero.talent.rank}</h3><p>{branchSpec?.description || SPECIALIZATIONS[hero.class][hero.talent.path].description}</p>
            {hero.talent.rank === 1 && points > 0 && <div className="choice-grid">{(["a","b"] as EvolutionBranch[]).map(b => <button key={b} disabled={busy || !canAct} onClick={() => act({type:"specialize",heroId:hero.id,path:hero.talent!.path,branch:b})}><strong>{SPECIALIZATION_BRANCHES[hero.class][hero.talent!.path][b].name}</strong><small>Escolha permanente</small></button>)}</div>}
            {hero.talent.rank === 2 && points > 0 && <button className="small-button gold" disabled={busy || !canAct} onClick={() => act({type:"specialize",heroId:hero.id,path:hero.talent!.path,branch:hero.talent!.branch})}>Desbloquear habilidade suprema</button>}
          </div>}
        </section>
        <section className="sheet-section"><label>Evolução Racial</label>
          {!hero.racial ? <div className="choice-grid">{(Object.keys(RACIAL_PATH_NAMES) as RacialPath[]).map(p => <button key={p} disabled={busy || !canAct || racePts < 1} onClick={() => act({type:"racial-specialize",heroId:hero.id,path:p})}><strong>{RACIAL_PATH_NAMES[p]}</strong><small>{RACE_TREES[heroRace(hero)][p].name}</small></button>)}</div>
          : <div className="talent-box"><h3>{RACE_TREES[heroRace(hero)][hero.racial.path].name} · Grau {hero.racial.rank}</h3><p>{RACE_TREES[heroRace(hero)][hero.racial.path].description}</p>{racePts > 0 && hero.racial.rank < 3 && <button className="small-button gold" disabled={busy || !canAct} onClick={() => act({type:"racial-specialize",heroId:hero.id,path:hero.racial!.path})}>Avançar árvore racial</button>}</div>}
        </section>
        <section className="sheet-section"><label>História Pessoal</label><h3>{story.title}</h3><p>{story.stages[Math.min(2, hero.storyStage || 0)]}</p>
          <button className="small-button" disabled={busy || !canAct || state.hqActionDay[hero.id]===state.day || (hero.storyStage || 0) >= 3} onClick={() => act({type:"story-step",heroId:hero.id})}>{(hero.storyStage || 0) >= 3 ? "História concluída" : "Avançar história"}</button>
        </section>
        <section className="sheet-section"><label>Viagem</label>
          {journey ? <div className="journey-box"><strong>{journey.remaining} dia(s) restantes · +{journey.xpEarned} EXP</strong><div className="choice-grid">{(Object.keys(JOURNEY_CHOICES) as JourneyChoice[]).map(c => <button data-active={journey.choice === c} key={c} onClick={() => act({type:"journey-choice",journeyId:journey.id,choice:c})}>{JOURNEY_CHOICES[c].name}</button>)}</div></div>
          : <div className="choice-grid">{([3,5,7] as JourneyDuration[]).map(d => <button key={d} disabled={busy || !canAct} onClick={() => act({type:"start-journey",heroId:hero.id,duration:d})}><strong>{d} dias</strong><small>Desenvolvimento individual</small></button>)}</div>}
        </section>
        <section className="sheet-section"><label>Equipamentos</label><div className="equipment-row">{equipped.length ? equipped.map(i => <ItemArt key={i.id} itemKey={i.key} />) : <small>Nenhum equipamento.</small>}</div><button type="button" className="hero-equipment-link" onClick={openEquipment}><GameSymbol kind="defense" aria-hidden="true"/> Ver equipamentos · 12 espaços <ChevronRight aria-hidden="true" /></button></section>
        <button className="action-button blue huge" disabled={busy || !canAct || hero.energy < 15 || state.hqActionDay[hero.id]===state.day} onClick={() => act({type:"train-hero",heroId:hero.id})}>Treino Individual · +{trainingPlan(state,hero).xp} EXP</button>
      </article>
    </div>
  </section>;
}


const EQUIPMENT_ICONS = {
  weapon:Swords, offhand:Shield, helmet:Crown, shoulders:Shield,
  armor:Shirt, gloves:Hand, belt:Archive, boots:Footprints,
  cloak:Flag, ring1:Gem, ring2:Gem, amulet:Sparkles,
} satisfies Record<EquipmentSlotId, typeof Swords>;


/** Cada atributo mantém a mesma cor em qualquer conjunto e em qualquer classe.
 * A prévia permanece neutra; apenas efeitos realmente ativos ficam coloridos. */
const SET_ATTRIBUTE_PATTERN=/(redução de dano físico|dano contra alvos sob veneno\/sangramento|dano à distância|dano de habilidade|cura recebida|cura total|p\.p\.\s*crítico|sangramento|crítico|defesa|ataque|magia|velocidade|sorte|veneno|cura|DEF|ATQ|MAG|VEL|PV|SORTE|dano)/gi;
function setAttributeType(word:string):string {
 const value=word.toLowerCase();
 if(/crítico|sangramento/.test(value))return "critical";
 if(/defesa|redução|\bdef\b/.test(value))return "defense";
 if(/magia|\bmag\b|veneno/.test(value))return "magic";
 if(/\bpv\b/.test(value))return "life";
 if(/velocidade|\bvel\b/.test(value))return "speed";
 if(/cura/.test(value))return "healing";
 if(/sorte/.test(value))return "luck";
 return "attack";
}
function SetAttributeText({value,active=false}:{value:string;active?:boolean}){
 const matched=[...value.matchAll(SET_ATTRIBUTE_PATTERN)];
 const nodes:ReactNode[]=[];let cursor=0;
 matched.forEach((match,i)=>{
  const pos=match.index??0;
  if(pos>cursor)nodes.push(value.slice(cursor,pos));
  nodes.push(<span key={i} className="set-attribute" data-stat={setAttributeType(match[0])} data-active={active}>{match[0]}</span>);
  cursor=pos+match[0].length;
 });
 if(cursor<value.length)nodes.push(value.slice(cursor));
 return <>{nodes}</>;
}

function SetItemInfo({itemKey}:{itemKey:string}){
 const name=CATALOG_BY_ID[itemKey]?.conjunto,def=name?SETS[name]:undefined;
 return name&&def?<div className="set-item-info">
   <strong><GameSymbol kind="reward"/> Conjunto: {name}</strong>
   <small>2 peças: <SetAttributeText value={def.bonus2}/></small><small>3 peças: <SetAttributeText value={def.bonus3}/></small>
 </div>:null;
}
function EquipmentSetPanel({state,hero,selectSlot}:{state:Campaign;hero:Hero;selectSlot:(id:EquipmentSlotId)=>void}){
 const keys=state.chest.filter(i=>i.equippedTo===hero.id).map(i=>i.key);
 const sets=equipmentSetProgress(hero.class,keys);
 const imperial=imperialSetProgress(hero.class,keys);
 return <section className="equipment-sets parchment" aria-label="Combinações de conjuntos do personagem">
  <h3><GameSymbol kind="reward"/> Conjuntos e combinações</h3>
  <p>Junte peças do mesmo conjunto <strong>neste herói</strong>. Com 2 peças, ativa o bônus inicial. Com 3 peças, ganha o bônus adicional e o efeito especial em batalha.</p>
  {!sets.length&&<p>Esta classe ainda não tem conjunto de três peças no catálogo. Seus equipamentos continuam com os bônus individuais.</p>}
  <article className="equipment-set-card imperial-set-card" data-tier={imperial.count===12?"complete":imperial.count>=3?"active":"inactive"}>
     <div className="equipment-set-heading"><strong><Crown aria-hidden="true"/> {imperial.name}</strong><b>{imperial.count}/12 peças</b></div>
     <p>Supremo Imperial de classe. Bônus ativos em 3, 6, 9 e 12 peças. A arma Suprema Imperial da classe substitui a arma do conjunto.</p>
     <div className="imperial-milestones">{[3,6,9,12].map(min=><span key={min} data-active={imperial.count>=min}>{imperial.count>=min?"✓":"○"} {min}/12</span>)}</div>
     <div className="equipment-set-pieces">{imperial.pieces.map(piece=>{
       const d=CATALOG_BY_ID[piece.key];
       const chest=state.chest.some(x=>x.key===piece.key&&!x.equippedTo);
       const other=state.chest.some(x=>x.key===piece.key&&x.equippedTo&&x.equippedTo!==hero.id);
       const slot=equippedPosition(piece.key);
       return <div key={piece.key} className="equipment-set-piece" data-equipped={piece.owned}>
         <span className="equipment-set-piece-art"><ItemArt itemKey={piece.key}/></span>
         <div><strong>{piece.name}</strong><small>{piece.substituted?"✓ Substituída por arma Suprema Imperial da classe":piece.owned?"✓ Equipada":chest?"No baú":other?"Com outro herói":"Não adquirida"} · Nv. {d?.nivel}</small></div>
         {!piece.owned&&slot&&<button type="button" className="equipment-set-go" onClick={()=>selectSlot((slot==="ring"?"ring1":slot) as EquipmentSlotId)}>Ver espaço</button>}
       </div>;
     })}</div>
   </article>
  {sets.map(set=><article key={set.name} className="equipment-set-card" data-tier={set.count>=3?"complete":set.count>=2?"active":"inactive"}>
    <div className="equipment-set-heading"><strong>{set.name}</strong><b>{set.count}/3 peças</b></div>
    <div className="equipment-set-meter" role="progressbar" aria-label={set.name} aria-valuemin={0} aria-valuemax={3} aria-valuenow={set.count}>
     {[0,1,2].map(i=><span key={i} data-active={i<set.count}/>)}
    </div>
    <div className="equipment-set-effects">
      <p data-active={set.count>=2}><b>{set.count>=2?"✓":"○"} 2 peças:</b> <SetAttributeText value={set.bonus2} active={set.count>=2}/></p>
      <p data-active={set.count>=3}><b>{set.count>=3?"✓":"○"} 3 peças:</b> <SetAttributeText value={set.bonus3} active={set.count>=3}/></p>
    </div>
    <div className="equipment-set-pieces">{set.pieces.map(piece=>{
      const item=CATALOG_BY_ID[piece.key],inChest=state.chest.some(i=>i.key===piece.key&&!i.equippedTo);
      const inOther=state.chest.some(i=>i.key===piece.key&&!!i.equippedTo&&i.equippedTo!==hero.id);
      const slot=equippedPosition(piece.key),target=(slot==="ring"?"ring1":slot) as EquipmentSlotId;
      return <div key={piece.key} className="equipment-set-piece" data-equipped={piece.owned}>
       <span className="equipment-set-piece-art"><ItemArt itemKey={piece.key}/></span>
       <div><strong>{piece.name}</strong>
        <small>{piece.owned?"✓ Equipada":inChest?"Disponível no baú":inOther?"Vestida por outro herói":"Não adquirida"} · Nv. {item?.nivel}</small>
        {!piece.owned&&!inChest&&!inOther&&<small>Obtenção: {item?.obtencao}</small>}
       </div>
       {!piece.owned&&slot&&<button type="button" className="equipment-set-go" onClick={()=>selectSlot(target)}>Ver espaço</button>}
      </div>;
    })}</div>
   </article>)}
 </section>;
}

function EquipmentPage({ state, selectedId, selectHero, back, act, busy }: {
  state: Campaign; selectedId: string; selectHero: (id: string) => void; back: () => void;
  act:(a:Action)=>void;busy:boolean;
}) {
  const hero = state.heroes.find(h => h.id === selectedId) || state.heroes[0];
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotId>("weapon");
  const [onlySets,setOnlySets]=useState(false);
  const activeSlot = EQUIPMENT_SLOTS.find(s => s.id === selectedSlot) || EQUIPMENT_SLOTS[0];
  const equippedCount = state.chest.filter(i => i.equippedTo === hero.id && ITEMS[i.key]).length;
  const used=state.chest.filter(i=>i.equippedTo===hero.id);
  const current=used.find(i=>(i.equippedSlot||equippedPosition(i.key))===selectedSlot);
  const candidates=state.chest.filter(i=>!i.equippedTo&&(!onlySets||!!ITEMS[i.key]?.set||IMPERIAL_WEAPON_IDS.includes(i.key))&&((equippedPosition(i.key)===selectedSlot)||(equippedPosition(i.key)==="ring"&&["ring1","ring2"].includes(selectedSlot))) &&
    (ITEMS[i.key]?.classes||[]).includes(hero.class)&&(!ITEMS[i.key]?.race||ITEMS[i.key]?.race===heroRace(hero))&&hero.level>=(ITEMS[i.key]?.levelReq||0));

  const comparison=(item:ChestItem)=>{
    const before=heroStats(hero,state);
    const hypothesis={...state,chest:state.chest.map(entry=>entry.id===current?.id?{...entry,equippedTo:undefined,equippedSlot:undefined}:entry.id===item.id?{...entry,equippedTo:hero.id,equippedSlot:selectedSlot}:entry)};
    const after=heroStats(hero,hypothesis);
    const deltas=[["ATQ",Math.round(after.attack-before.attack)],["DEF",Math.round(after.defense-before.defense)],
      ["MAG",Math.round(after.magic-before.magic)],["PV",Math.round(after.hp-before.hp)],
      ["VEL",Math.round(after.speed-before.speed)]].filter(([,n])=>Number(n)!==0);
    return deltas.map(([k,n])=>String(k)+" "+(Number(n)>0?"+":"")+n).join(" · ")||"Sem mudança significativa";
  };
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

    <p className="equipment-intro">Equipamentos vestidos ficam nos espaços abaixo e não ocupam posições do baú. Desequipe para devolver o item ao armazenamento.</p>
    <EquipmentSetPanel state={state} hero={hero} selectSlot={setSelectedSlot}/>
    <div className="equipment-slot-grid" role="group" aria-label="12 espaços de equipamento">
      {EQUIPMENT_SLOTS.map((slot, i) => {
        const Icon = EQUIPMENT_ICONS[slot.id];
        const wearing=used.find(x=>(x.equippedSlot||equippedPosition(x.key))===slot.id);
        return <button type="button" key={slot.id} className="equipment-slot" data-slot={slot.id}
          data-selected={selectedSlot === slot.id} aria-pressed={selectedSlot === slot.id}
          onClick={() => setSelectedSlot(slot.id)}>
          <span className="equipment-slot-icon">{wearing?<ItemArt itemKey={wearing.key}/>:<Icon aria-hidden="true"/>}</span>
          <span className="equipment-slot-copy"><strong>{i + 1}. {slot.label}</strong><small>{wearing ? ITEMS[wearing.key]?.name : "Vazio"}</small></span>
        </button>;
      })}
    </div>
    <label className="equip-only-set"><input type="checkbox" checked={onlySets} onChange={e=>setOnlySets(e.target.checked)}/>
      Mostrar apenas peças de conjuntos</label>
    <section className="equipment-slot-detail parchment" aria-live="polite">
      <span className="equipment-detail-label">{activeSlot.group}</span>
      <h3>{activeSlot.label}</h3><p>{activeSlot.description}</p>
      {current?<div className="equipment-current"><strong>Em uso: {ITEMS[current.key]?.name}</strong><p>{ITEMS[current.key]?.description}</p><SetItemInfo itemKey={current.key}/><button className="action-button blue" disabled={busy} onClick={()=>act({type:"unequip",itemId:current.id})}>Desequipar</button></div>:<p>Sem item equipado neste espaço.</p>}
      <div className="equipment-candidate-area">
        <strong>{current?"Substituir diretamente":"Itens compatíveis no baú"}</strong>
        <small>A comparação considera o equipamento substituído e os bônus de conjunto.</small>
        <div className="catalog-equippable">{candidates.slice(0,8).map(i=><button key={i.id} className="small-button" disabled={busy} onClick={()=>act(current?{type:"swap-equip",itemId:i.id,heroId:hero.id,oldItemId:current.id,slot:selectedSlot}:{type:"equip",itemId:i.id,heroId:hero.id,...(["ring1","ring2"].includes(selectedSlot)?{slot:selectedSlot as "ring1"|"ring2"}:{})})}><ItemArt itemKey={i.key}/><span>{ITEMS[i.key]?.name}{ITEMS[i.key]?.set&&<small className="equipment-candidate-set">Conjunto: {ITEMS[i.key]?.set}</small>}<small className="equipment-comparison">{current?"Trocar · ":"Equipar · "}{comparison(i)}</small></span></button>)}</div>
        {!candidates.length&&<small>Sem itens compatíveis no baú.</small>}
      </div>
    </section>
    <button type="button" className="equipment-bottom-back" onClick={back}><ChevronLeft aria-hidden="true"/> Voltar à ficha do herói</button>
  </section>;
}

function ChestPage({ state, act, busy }: { state: Campaign; act: (a: Action) => void; busy: boolean }) {
  const [filter,setFilter] = useState("all");
  const [itemQuery,setItemQuery]=useState("");
  const [itemPage,setItemPage] = useState(0);
  const [showCatalog,setShowCatalog] = useState(false);
  const [catalogPage,setCatalogPage] = useState(0);
  const [catalogSelection,setCatalogSelection] = useState("CG-001");
  const [catalogGroup,setCatalogGroup] = useState<CatalogGalleryGroup>("all");
  const [catalogClass,setCatalogClass] = useState("");
  const [catalogQuery,setCatalogQuery] = useState("");
  const [selectedId,setSelectedId] = useState(state.chest.find(i=>!i.equippedTo)?.id || "");
  const [recipient,setRecipient] = useState(state.heroes[0]?.id || "");
  const [useHero,setUseHero] = useState(state.heroes[0]?.id || "");
  const filtered = state.chest.filter(i => !i.equippedTo)
    .filter(i=>!itemQuery.trim()||(ITEMS[i.key]?.name||"").toLocaleLowerCase("pt-BR").includes(itemQuery.trim().toLocaleLowerCase("pt-BR"))||i.key.toLowerCase().includes(itemQuery.trim().toLowerCase()))
    .filter(i => {
    const slot = ITEMS[i.key]?.slot;
    if (filter === "all") return true;
    if (filter === "weapons") return slot === "weapon" || slot === "offhand";
    if (filter === "armor") return ["helmet","armor","gloves","boots"].includes(slot);
    if (filter === "accessory") return slot === "accessory";
    if (filter === "consumable") return slot === "consumable";
    if (filter === "other") return slot === "quest" || slot === "treasure";
    return slot === "material";
  });
  const totalPages=Math.max(1,Math.ceil(filtered.length/32));
  const page=Math.min(itemPage,totalPages-1);
  const selected = filtered.find(i => i.id === selectedId) || filtered[page*32] || filtered[0];
  const def = selected ? ITEMS[selected.key] : undefined;
  const owner = selected?.equippedTo ? state.heroes.find(h => h.id === selected.equippedTo) : undefined;
  const compatible = def ? state.heroes.filter(h => itemSlots.has(def.slot) && !heroOnExpedition(state,h.id) && (!def.race || heroRace(h) === def.race) && (!def.classes || def.classes.includes(h.class)) && (!def.levelReq || h.level >= def.levelReq)) : [];
  const target = compatible.some(h => h.id === recipient) ? recipient : compatible[0]?.id || "";
  if(showCatalog) {
    const matches=filterCatalogGallery(catalogGroup,catalogClass,catalogQuery);
    const catalogTotalPages=Math.max(1,Math.ceil(matches.length/30));
    const currentCatalogPage=Math.min(catalogPage,catalogTotalPages-1);
    const visible=matches.slice(currentCatalogPage*30,(currentCatalogPage+1)*30);
    const detail=visible.find(d=>d.id===catalogSelection)||visible[0];
    const changePage=(next:number)=>{const page=Math.max(0,Math.min(next,catalogTotalPages-1));setCatalogPage(page);setCatalogSelection(matches[page*30]?.id||"");};
    const categories:ReadonlyArray<{key:CatalogGalleryGroup;label:string}>=[
      {key:"all",label:"Todos"},{key:"imperial",label:"Supremos Imperiais"},
      {key:"imperial-weapons",label:"Armas Imperiais"},{key:"imperial-sets",label:"Conjuntos Imperiais"},
      {key:"imperial-books",label:"Livros Imperiais"},{key:"original",label:"Originais"},
      {key:"exclusive",label:"Exclusivos"}
    ];
    return <section className="screen chest-screen catalog-gallery">
      <div className="inventory-top"><button onClick={()=>setShowCatalog(false)}><GameSymbol kind="inventory"/> Meu inventário</button><strong><GameSymbol kind="book"/> Catálogo · {CATALOG_GALLERY_ITEMS.length} itens</strong></div>
      <p className="catalog-note">Catálogo completo: 314 itens originais, 18 exclusivos e 98 Supremos Imperiais. Os itens Supremos Imperiais possuem artes próprias para as sete classes. Consultar um item não significa possuí-lo ou ter a região liberada.</p>
      <div className="catalog-category-filters" role="group" aria-label="Filtrar catálogo por categoria">
        {categories.map(category=><button key={category.key} type="button" data-active={catalogGroup===category.key} onClick={()=>{setCatalogGroup(category.key);setCatalogPage(0);setCatalogSelection("");}}>{category.label}</button>)}
      </div>
      <div className="catalog-search-controls">
        <label>Pesquisar item<input type="search" value={catalogQuery} placeholder="Nome, código ou atributo" onChange={e=>{setCatalogQuery(e.target.value);setCatalogPage(0);setCatalogSelection("");}}/></label>
        <label>Classe<select value={catalogClass} onChange={e=>{setCatalogClass(e.target.value);setCatalogPage(0);setCatalogSelection("");}}>
          <option value="">Todas as classes</option>
          {IMPERIAL_CLASSES.map(c=><option key={c.heroClass} value={c.label}>{c.label}</option>)}
        </select></label>
      </div>
      <div className="catalog-pagination">
        <button disabled={currentCatalogPage===0} onClick={()=>changePage(currentCatalogPage-1)}>‹ Anterior</button>
        <strong>{matches.length} itens · Página {currentCatalogPage+1} de {catalogTotalPages}</strong>
        <button disabled={currentCatalogPage===catalogTotalPages-1} onClick={()=>changePage(currentCatalogPage+1)}>Próxima ›</button>
      </div>
      <div className="inventory-layout">
        <div className="item-grid catalog-gallery-grid">
          {visible.map(d=><button key={d.id} data-active={detail?.id===d.id} className={"item-tile rarity-"+ITEMS[d.id].rarity} aria-label={d.id+" — "+d.nome}
           onClick={()=>setCatalogSelection(d.id)}><ItemArt itemKey={d.id}/><span>{d.id}</span></button>)}
          {!visible.length&&<p className="catalog-empty">Nenhum item encontrado com esses filtros.</p>}
        </div>
        {detail&&<article className="item-detail parchment">
          <span className="rarity-label">{detail.id} · {detail.raridade}</span><h2>{detail.nome}</h2>
          <div className="selected-item-art"><ItemArt itemKey={detail.id}/></div>
          <p><b>Categoria:</b> {detail.categoria} · {detail.subcategoria}</p>
          <p><b>Classes:</b> {detail.classes.join(", ")}</p>
          <p><b>Requisito:</b> Nível {detail.nivel}</p>
          <p><b>Atributos:</b> {Object.entries(detail.atributos).filter(([,v])=>v!==0).map(([key,value])=>key+" +"+value).join(" · ")||"Habilidade especial"}</p>
          <p><b>Função:</b> {textoEmPortugues(detail.efeito)}</p>
          <p><b>Como obter:</b> {textoEmPortugues(detail.obtencao)}</p><SetItemInfo itemKey={detail.id}/>
          <p className="catalog-price"><GameSymbol kind="gold"/><b> Valor:</b> {detail.preco_compra!==null?fmt(detail.preco_compra)+" ouro de compra":"Não vendido por mercador"} · {fmt(detail.preco_venda)} de venda</p>
          <small>Esta tela é para consulta. A disponibilidade dos itens e dos livros depende da evolução da campanha; livros Supremos Imperiais custam 500.000 de ouro e exigem a classe correspondente.</small>
        </article>}
      </div>
    </section>;
  }
  return <section className="screen chest-screen">
    <div className="inventory-top"><button data-active><GameSymbol kind="inventory"/> Inventário</button><button onClick={()=>{setCatalogGroup("imperial");setCatalogClass("");setCatalogQuery("");setCatalogPage(0);setCatalogSelection("");setShowCatalog(true);}}><GameSymbol kind="book"/> Ver {CATALOG_GALLERY_ITEMS.length} itens · Imperiais</button><button onClick={() => {setFilter("material");setItemPage(0);setSelectedId("");}} data-active={filter === "material"}><GameSymbol kind="forge"/> Materiais</button><span><GameSymbol kind="inventory"/> {storageUsed(state.chest)}/{chestCapacity(state)}</span></div>
    <p className="inventory-capacity-note">Forja Nv. {state.hq.forge} · {storageUsed(state.chest)} guardados · {state.chest.filter(i=>!!i.equippedTo).length} equipados nos heróis · {Math.max(0,chestCapacity(state)-storageUsed(state.chest))} espaços livres</p>
    <label className="inventory-search">Pesquisar no baú <input type="search" placeholder="Nome ou código do item" value={itemQuery} onChange={e=>{setItemQuery(e.target.value);setItemPage(0);setSelectedId("");}}/></label>
    <div className="inventory-filters">{[["all","Todos"],["weapons","Armas"],["armor","Armaduras"],["accessory","Acessórios"],["consumable","Consumíveis"],["other","Outros"]].map(([id,label]) => <button key={id} data-active={filter === id} onClick={() => {setFilter(id);setItemPage(0);setSelectedId("");}}>{label}</button>)}</div>
    <nav className="inventory-pagination" aria-label="Páginas dos itens no baú">
      <button type="button" disabled={page===0} onClick={()=>{setItemPage(page-1);setSelectedId("");}}>‹ Anterior</button>
      <strong>{filtered.length} itens · Página {page+1} de {totalPages}</strong>
      <button type="button" disabled={page>=totalPages-1} onClick={()=>{setItemPage(page+1);setSelectedId("");}}>Próxima ›</button>
    </nav>
    <div className="inventory-layout">
      <div className="item-grid">{filtered.slice(page*32,(page+1)*32).map(item => <button key={item.id} data-active={selected?.id === item.id} className={"item-tile rarity-" + ITEMS[item.key].rarity} onClick={() => setSelectedId(item.id)}>
        <ItemArt itemKey={item.key} /><span>{ITEMS[item.key].name}</span>{item.equippedTo && <b>✓</b>}
      </button>)}</div>
      {selected && def ? <article className="item-detail parchment">
        <span className="rarity-label">{RARITY_NAMES[def.rarity].toUpperCase()}</span><h2>{def.name}</h2>
        <div className="selected-item-art"><ItemArt itemKey={selected.key} /></div>
        <p>{textoEmPortugues(def.description)}</p><SetItemInfo itemKey={selected.key}/>
        <div className="item-stats">{([["Ataque",def.attack],["Defesa",def.defense],["Magia",def.magic],["Vida",def.hp],["Velocidade",def.speed]] as Array<[string,number|undefined]>).filter(([,v]) => v).map(([k,v]) => <span key={k}><b><GameSymbol kind={ATTRIBUTE_SYMBOLS[k]}/>{k}</b><em>+{v}</em></span>)}</div>
        {def.levelReq && <small>Nível necessário: {def.levelReq}</small>}
        {owner && <small>Equipado por {owner.name}</small>}
        {def.slot==="quest"&&CATALOG_BY_ID[selected.key]?.categoria==="Livro de magia suprema"&&
        <div className="item-book-learn"><strong>Aprender habilidade suprema:</strong>
        {state.heroes.filter(h=>({warrior:"Guerreiro",paladin:"Cavaleiro",ranger:"Arqueiro",rogue:"Assassino",mage:"Mago",healer:"Sacerdote",bard:"Pierrô"} as Record<string,string>)[h.class]===CATALOG_BY_ID[selected.key].classes[0]&&h.level>=CATALOG_BY_ID[selected.key].nivel).map(h=>
         <button key={h.id} className="action-button blue" disabled={busy||!!h.supremeBook||h.storyStage!==3} onClick={()=>act({type:"learn-book",itemId:selected.id,heroId:h.id})}>
         {h.name} · {h.storyStage===3?"Aprender":"História pessoal incompleta"}</button>)}
        </div>}
        {def.slot==="quest"&&CATALOG_BY_ID[selected.key]?.categoria==="Livro Imperial"&&
        <div className="item-book-learn"><strong>Aprender poder imperial de classe · uma ativação suprema por combate:</strong>
         {state.heroes.filter(h=>({warrior:"Guerreiro",paladin:"Cavaleiro",ranger:"Arqueiro",rogue:"Assassino",mage:"Mago",healer:"Sacerdote",bard:"Pierrô"} as Record<string,string>)[h.class]===CATALOG_BY_ID[selected.key].classes[0]&&h.level>=CATALOG_BY_ID[selected.key].nivel).map(h=>
          <button key={h.id} className="action-button gold" disabled={busy||!!h.imperialBook||heroOnExpedition(state,h.id)} onClick={()=>act({type:"learn-book",itemId:selected.id,heroId:h.id})}>{h.name} · {h.imperialBook?"Já aprendeu":"Aprender"}</button>)}
         {!state.heroes.some(h=>({warrior:"Guerreiro",paladin:"Cavaleiro",ranger:"Arqueiro",rogue:"Assassino",mage:"Mago",healer:"Sacerdote",bard:"Pierrô"} as Record<string,string>)[h.class]===CATALOG_BY_ID[selected.key].classes[0]&&h.level>=CATALOG_BY_ID[selected.key].nivel)&&<small>Requer herói da classe no nível {CATALOG_BY_ID[selected.key].nivel}.</small>}
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


function ImperialShopPanel({state,act,busy}:{state:Campaign;act:(a:Action)=>void;busy:boolean}){
 const [heroClass,setHeroClass]=useState<string>(state.heroes[0]?.class||"warrior");
 const [category,setCategory]=useState<"weapons"|"sets"|"books">("weapons");
 const unlocked=state.activeRegion>=IMPERIAL_MIN_REGION;
 const visible=category==="weapons"?IMPERIAL_WEAPONS:category==="sets"?IMPERIAL_SETS.filter(d=>d.classes.includes(IMPERIAL_CLASSES.find(c=>c.heroClass===heroClass)?.label||"")):IMPERIAL_BOOKS.filter(d=>d.classes.includes(IMPERIAL_CLASSES.find(c=>c.heroClass===heroClass)?.label||""));
 return <section className="imperial-market parchment" aria-label="Arsenal Supremo Imperial">
   <h3><Crown aria-hidden="true"/> Arsenal Supremo Imperial</h3>
   <p>7 armas Supremas Imperiais, 7 conjuntos de classe com 12 peças (84 peças) e 7 livros imperiais. Cada livro custa <strong>500.000 ouro</strong>. Para equipar ou aprender, nível 40.</p>
   {!unlocked&&<p className="imperial-locked"><LockKeyhole aria-hidden="true"/> Desbloqueio: visite a região 10, Império de Solkar. Os itens abaixo são uma prévia.</p>}
   <div className="imperial-controls">
     <div className="imperial-tabs" role="group" aria-label="Categoria imperial">
       <button type="button" data-active={category==="weapons"} onClick={()=>setCategory("weapons")}>Armas · 7</button>
       <button type="button" data-active={category==="sets"} onClick={()=>setCategory("sets")}>Conjuntos · 84</button>
       <button type="button" data-active={category==="books"} onClick={()=>setCategory("books")}>Livros · 7</button>
     </div>
     {category!=="weapons"&&<label>Classe <select value={heroClass} onChange={e=>setHeroClass(e.target.value)}>
        {IMPERIAL_CLASSES.map(c=><option value={c.heroClass} key={c.heroClass}>{c.label}</option>)}
     </select></label>}
   </div>
   {category==="sets"&&<p className="imperial-set-tip">Bônus ativos em 3/12, 6/12, 9/12 e 12/12. A arma Suprema Imperial da mesma classe substitui a arma do conjunto. Desde a região 6, os guardiões podem derrubar uma peça com 20% de chance base mais bônus da equipe.</p>}
   <div className="catalog-shop">{visible.map(d=>{
     const sold=state.shopPurchases.includes(Math.floor((state.day-1)/7)+":"+state.activeRegion+":"+d.id);
     return <div key={d.id}><ItemArt itemKey={d.id}/><span><strong>{d.nome}</strong>
       <small>{d.raridade} · Nv. {d.nivel}{d.classes[0]?" · "+d.classes[0]:""} · {d.slot}</small>
       <small>{textoEmPortugues(d.efeito)}</small>
     </span><button type="button" className="small-button gold" disabled={busy||!unlocked||sold||storageUsed(state.chest)>=chestCapacity(state)||state.gold<(d.preco_compra||0)}
       onClick={()=>act({type:"buy",key:d.id})}>{sold?"Esgotado":fmt(d.preco_compra||0)+" ouro"}</button></div>;
   })}</div>
 </section>;
}

function TavernPage({ state, act, busy, openMission }: { state: Campaign; act: (a: Action) => void; busy: boolean; openMission: (id:string) => void }) {
  const recruits = market(state).slice(0,4);
  const rumors = missions(state).slice(0,3);
  const checkedToday=state.tavernRumor?.day===state.day;
  return <section className="screen tavern-screen">
    <div className="tavern-hero"><img src={tavernArtwork} alt="Taverneira sorrindo e erguendo um caneco em brinde na Taverna da Guilda" /></div>
    <ParchmentTitle icon={<GameSymbol kind="squad"/>} title="Heróis para Recrutar" side={<span>Renova semanalmente</span>} />
    <div className="recruit-grid parchment">{recruits.map(h => <article key={h.id}><HeroPortrait hero={h} large /><h3>{h.name}</h3><span>{CLASSES[h.class].name} · {raceLabel(h)} · {HERO_SEX_LABEL[heroSex(h)]}</span><small><GameSymbol kind="gold"/> {h.value} Ouro</small><button className="action-button red" disabled={busy || state.gold < h.value} onClick={() => act({type:"hire",heroId:h.id})}>Recrutar</button></article>)}</div>
    <div className="tavern-lower">
      <section className="tavern-market" aria-label="Mercado Regional">
        <section className="parchment shop"><div className="merchant-head"><img className="merchant-portrait" src={merchantPortrait} alt="Mercador da taverna medieval" /><span><h3><GameSymbol kind="merchant"/> Mercador Regional</h3><small>Estoque regional renovado semanalmente</small></span></div>
  <div className="catalog-shop">
  {testShop(state).map(d=>{
    const sold=state.shopPurchases.includes(Math.floor((state.day-1)/7)+":"+state.activeRegion+":"+d.id);
    return <div key={d.id}><ItemArt itemKey={d.id}/><span><strong>{d.nome}</strong><small>{d.id} · {d.raridade} · Nv. {d.nivel}</small></span><button className="small-button gold" disabled={busy||sold||storageUsed(state.chest)>=chestCapacity(state)||state.gold<(d.preco_compra||0)} onClick={()=>act({type:"buy",key:d.id})}>{!sold&&<GameSymbol kind="gold"/>}{sold?"Esgotado":fmt(d.preco_compra||0)+" ouro"}</button></div>;
  })}
  {!testShop(state).length&&<small>Sem mercadorias nesta região.</small>}
  </div></section>
        <ImperialShopPanel state={state} act={act} busy={busy}/>
      </section>
      <aside className="tavern-side" aria-label="Boatos da Taverna">
        <section className="rumors parchment">
          <ParchmentTitle icon={<GameSymbol kind="objective"/>} title="Informações da Taverna" />
          <p className="tavern-rumors-intro">Escolha um rumor gratuito por dia. Ao investigá-lo, sua equipe ganha <strong>+10% ataque e magia e +5% defesa</strong> somente na missão indicada. Não é uma compra.</p>
          {rumors.map(m=>{
            const prepared=tavernRumorReady(state,m.id);
            const used=checkedToday&&state.tavernRumor?.missionId===m.id&&!prepared;
            const locks=missionLocks(state,m);
            return <article className="tavern-rumor-card" key={m.id} data-ready={prepared}>
              <button type="button" className="tavern-rumor-link" onClick={()=>openMission(m.id)}>
                <strong>{m.title}</strong><small>{m.description}</small>
                <span><GameSymbol kind="gold"/> Recompensa da missão: {fmt(m.reward)} ouro</span>
              </button>
              <p><GameSymbol kind="scouting"/> {tavernRumorHint(m)} Inimigos conhecidos: {m.enemy}.</p>
              <button type="button" className="tavern-rumor-research" disabled={busy||checkedToday||locks.length>0}
                onClick={()=>act({type:"investigate-rumor",missionId:m.id})}>
                {prepared?"Rumor preparado · bônus ativo":used?"Informação utilizada":checkedToday?"Outro rumor escolhido hoje":locks.length?"Missão indisponível":"Investigar gratuitamente"}
              </button>
              {(prepared||used)&&<small className="tavern-rumor-status">{prepared?"Bônus pronto para esta missão, somente hoje.":"Bônus consumido na missão de hoje."}</small>}
            </article>;
          })}
        </section>
        <section className="parchment drinks"><div className="mug"><Beer aria-hidden="true"/></div><h3>Bebidas da Casa</h3><p>Brinde com a guilda para recuperar o moral e a energia.</p><button className="action-button green" disabled={busy || !!state.event || activeExpeditions(state).length>0 || state.gold < 8 || state.dailyActions?.restDay===state.day} onClick={() => act({type:"rest"})}>{state.dailyActions?.restDay===state.day?"Descanso realizado":"Descansar · 8 ouro"}</button></section>
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
  const [pendingDismissId,setPendingDismissId] = useState<string | null>(null);
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
    <p><strong>Treinamento de heróis:</strong> seus heróis já contratados ganham experiência diariamente sem lutar, desde que estejam na sede. A Academia oferece até 4 vagas e um mentor aumenta o EXP recebido.</p>
    {!slots ? <p>Melhore a Academia na Sede (nível 1) para liberar o treinamento dos heróis e a seleção de pessoas comuns.</p> : <>
      <h4>Heróis em treinamento · {draft.length}/{slots}</h4>
      <small>Cada herói matriculado e disponível recebe {dailyXp} EXP por dia. Heróis em expedição ou viagem não treinam.</small>
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
          <small>Temporada {state.season} · Dia {seasonDay(state)}/{SEASON_DAYS} · Você pode dedicar um treino especial de {ACADEMY_FOCUS_COST} ouro por dia, a apenas um candidato.</small>
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
        <small>A Guilda comporta 12 heróis. Você pode admitir um formado gratuitamente ou dispensá-lo da reserva. A dispensa é definitiva, mas não afeta heróis já contratados.</small>
        {state.academy.reserve.map(h=><div className="academy-candidate" key={h.id}>
          <div><strong>{h.name}</strong><small>{CLASSES[h.class].name} · Nv. {h.level} · {textoEmPortugues(h.trait)}</small></div>
          {pendingDismissId===h.id ? (
            <div className="academy-dismiss-confirm" role="group" aria-label={"Confirmar dispensa de "+h.name}>
              <strong>Dispensar {h.name} da reserva?</strong>
              <small>Essa decisão não pode ser desfeita. O formado não entrará para a Guilda.</small>
              <div className="academy-reserve-actions">
                <button type="button" className="small-button academy-dismiss-danger" disabled={busy} onClick={()=>{
                  setPendingDismissId(null);
                  act({type:"academy-dismiss",heroId:h.id});
                }}>Confirmar dispensa</button>
                <button type="button" className="small-button" disabled={busy} onClick={()=>setPendingDismissId(null)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="academy-reserve-actions">
              <button type="button" className="small-button" disabled={busy || state.heroes.length>=12} onClick={()=>act({type:"academy-admit",heroId:h.id})}>Admitir na Guilda</button>
              <button type="button" className="small-button academy-dismiss-danger" disabled={busy} onClick={()=>setPendingDismissId(h.id)}>Dispensar</button>
            </div>
          )}
        </div>)}
      </div>}
    </details>
  </div>;
}
function RivalRecruitPanel({ state, act, busy }: { state: Campaign; act: (a: Action) => void; busy: boolean }) {
  const availableGuilds=rivalRecruitCandidates(state);
  const [guildId,setGuildId] = useState(availableGuilds[0]?.id || "");
  const guild = availableGuilds.find(g => g.id === guildId) || availableGuilds[0];
  const [heroId,setHeroId] = useState(guild?.heroes[0]?.id || "");
  useEffect(() => { if (guild && !guild.heroes.some(h => h.id === heroId)) setHeroId(guild.heroes[0]?.id || ""); }, [guildId, guild?.heroes.length]);
  const hero = guild?.heroes.find(h => h.id === heroId) || guild?.heroes[0];
  return <div className="rival-recruit parchment"><h3>Recrutar de outra Guilda · 10 melhores</h3><select value={guild?.id || ""} onChange={e => setGuildId(e.target.value)}>{availableGuilds.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
    {guild && hero && <><div className="rival-hero"><HeroPortrait hero={hero}/><span><strong>{hero.name}</strong><small>{CLASSES[hero.class].name} · {raceLabel(hero)} · {HERO_SEX_LABEL[heroSex(hero)]} · Nv. {hero.level}</small></span><select value={hero.id} onChange={e => setHeroId(e.target.value)}>{guild.heroes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></div>
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
  {h?.imperialBook&&<p>Livro Imperial de classe: {CATALOG_BY_ID[h.imperialBook]?.nome}. Compartilha o limite de uma ativação suprema por combate.</p>}
  {h?.supremeBook&&h.talent&&!h.supremeRespecced&&<button className="action-button blue" disabled={busy} onClick={()=>act({type:"reset-specialization",heroId:h.id})}>Corrigir especialização (uma vez)</button>}
  <div className="catalog-shop">{books.map(d=>{
    const price=Math.round((d.preco_compra||0)*.7);
    const res=(d.materiais||[]).map(mat=>({...mat,owned:state.chest.filter(i=>i.key===mat.id&&!i.equippedTo).length}));
    const ready=!!h&&h.level>=d.nivel&&h.storyStage===3&&state.hq.library>=3&&state.bossSeasons.length>0&&
      res.every(r=>r.owned>=r.quantidade)&&state.gold>=price&&storageUsed(state.chest)<chestCapacity(state);
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
  state, act, busy, go, onExport, onImport, onRecover, onReset, musicEnabled, toggleMusic, liteMode, setLiteMode, musicIndex, nextTrack
}: { state: Campaign; act: (a: Action) => void; busy: boolean; go:(screen:Screen)=>void; onExport: () => void; onImport: () => void; onRecover: () => void; onReset: () => void; musicEnabled: boolean; toggleMusic: () => void; liteMode: boolean; setLiteMode: (value:boolean) => void; musicIndex: number; nextTrack: () => void }) {
  const buildings = Object.entries(HQ_DEFINITIONS) as Array<[HQBuilding,(typeof HQ_DEFINITIONS)[HQBuilding]]>;
  const wage=payroll(state), daysUntilWage=7-((state.day-1)%7);
  const safeTreasury=state.gold-8-wage;
  const forecast=treasuryForecast(state),relief=emergencyContractQuote(state);
  const challenges=seasonalChallenges(state);
  const currentRegion=WORLD_MAP[state.activeRegion-1];
  const currentContracts=missions(state);
  const regionalGuardian=seasonBoss(state);
  const availableRaidHeroes = state.heroes.filter(h => available(h,state)).slice(0,9);
  const raidTeams = availableRaidHeroes.length >= 9 ? [availableRaidHeroes.slice(0,3).map(h=>h.id),availableRaidHeroes.slice(3,6).map(h=>h.id),availableRaidHeroes.slice(6,9).map(h=>h.id)] : [];
  return <section className="screen guild-screen">
    <div className="guild-identity parchment">
      <div className="guild-banner"><img src={LEAGUE_PLAYER_CREST} alt={"Brasão de "+state.name} width={88} height={102}/></div>
      <div><h2>{state.name}</h2><p>Força na união, glória em cada jornada.</p><span><GameSymbol kind="squad"/> Membros: {state.heroes.length}/12</span><span><GameSymbol kind="defense"/> Nível da Guilda: {Math.max(1,Math.ceil(state.fame/120))}</span></div>
      <aside><strong><GameSymbol kind="gold"/> Tesouro {fmt(state.gold)}</strong><strong><GameSymbol kind="fame"/> Renome {state.fame}</strong><strong><GameSymbol kind="league"/> Liga {rank(state)}</strong></aside>
    </div>

    <div className="guild-calendar parchment" aria-label="Controle de dias da temporada">
      <div><strong>Temporada {state.season} · Dia {String(seasonDay(state)).padStart(2,"0")}/{SEASON_DAYS}</strong>
        <small>O calendário só avança por sua decisão. Batalhas, equipamentos, compras e treinos acontecem dentro do dia atual.</small></div>
      <button type="button" className="action-button green guild-next-day"
        disabled={busy||activeExpeditions(state).length>0||!!state.event}
        title={state.event?"Resolva o conselho para encerrar o dia.":activeExpeditions(state).length?"Conclua as expedições em andamento.":"Encerrar o dia atual"}
        onClick={()=>{const warning=leagueLineup(state).ready?"":" ATENÇÃO: sua escalação da Liga possui menos de 3 heróis disponíveis. Você perderá por W.O. na Liga e, se houver Copa hoje, também será eliminado.";if(window.confirm("Encerrar o dia "+seasonDay(state)+"/"+SEASON_DAYS+"? Salários, liga, viagens e recuperação diária serão processados."+warning))act({type:"next-day"});}}>
        Próximo dia <ChevronRight size={18}/></button>
    </div>
    <section className="guild-quick-actions parchment" aria-label="Acesso rápido e alertas da campanha">
      <strong>Plano do dia · atalhos rápidos</strong>
      <div className="guild-quick-grid">
        <button type="button" onClick={()=>go("mission")}>Missões <ChevronRight size={15}/></button>
        <button type="button" onClick={()=>go("league")}>Liga e reservas <ChevronRight size={15}/></button>
        <button type="button" onClick={()=>go("equipment")}>Equipar heróis <ChevronRight size={15}/></button>
        <button type="button" onClick={()=>go("chest")}>Inventário <ChevronRight size={15}/></button>
      </div>
      {!leagueLineup(state).ready&&<small className="guild-quick-alert">Atenção: menos de três heróis aptos na Liga. Prepare reservas antes de avançar.</small>}
      {forecast.projected<0&&<small className="guild-quick-alert">Tesouro projetado negativo em {forecast.days} dias: {fmt(forecast.projected)} ouro.</small>}
      {!!state.pendingRewards?.length&&<small className="guild-quick-alert">{state.pendingRewards.length} prêmios aguardam espaço no baú.</small>}
    </section>
    <section className="guild-strategy parchment" aria-label="Planejamento financeiro da Guilda">
      <h3><GameSymbol kind="gold"/> Planejamento antes de encerrar o dia</h3>
      <div className="guild-strategy-grid">
        <span>Ouro disponível <strong>{fmt(state.gold)}</strong></span>
        <span>Manutenção diária <strong>−{fmt(Math.min(8,state.gold))}</strong></span>
        <span>Salários semanais <strong>{fmt(wage)} · em {daysUntilWage} dia(s)</strong></span>
        <span>Reserva para despesas <strong>{fmt(safeTreasury)} ouro</strong></span>
        <span>Contratos realizados <strong>{dailyContractsUsed(state)}/{DAILY_CONTRACT_LIMIT}</strong></span>
        <span>Partida da Liga <strong>{leagueLineup(state).ready?"Escalação pronta":"Risco de W.O."}</strong></span>
      </div>
      {safeTreasury<0&&<p className="guild-budget-warning">Atenção: o tesouro não cobre simultaneamente os próximos salários e um dia de manutenção.</p>}
      <small>Projeção para {forecast.days} dia(s): manutenção −{fmt(forecast.maintenance)} e salários −{fmt(forecast.wages)} = saldo estimado {fmt(forecast.projected)} ouro. Não inclui receitas futuras.</small>
      <div className="guild-economy-ledger" aria-label="Balanço real dos últimos sete dias">
        <strong>Livro-caixa · últimos 7 dias</strong>
        <span>Entradas: +{fmt(forecast.recentIncome)} ouro</span>
        <span>Saídas: −{fmt(forecast.recentExpense)} ouro</span>
        <b data-negative={forecast.recentNet<0}>Resultado: {forecast.recentNet>=0?"+":""}{fmt(forecast.recentNet)} ouro</b>
        <small>Somente lançamentos reais; missões futuras não são receita garantida.</small>
      </div>
      <div className="guild-relief"><strong>Trabalho comunitário emergencial</strong>
        <small>Apenas quando o tesouro não cobre a próxima folha e a manutenção. Uma vez por semana, sem EXP.</small>
        <button type="button" className="action-button green" disabled={busy||!relief.available}
          onClick={()=>act({type:"emergency-contract"})}>
           {relief.used?"Já realizado nesta semana":relief.available?"Trabalhar · +"+fmt(relief.reward)+" ouro":"Tesouro ainda cobre as despesas"}
        </button>
      </div>
    </section>
    <section className="guild-season-goals parchment" aria-label="Desafios e títulos da temporada">
      <h3><Crown size={19}/> Desafios da temporada</h3>
      <p>Conclua objetivos reais para conquistar prestígio, sem inflacionar o ouro.</p>
      <div className="guild-goal-list">{challenges.map(goal=><div key={goal.title}>
        <span>{goal.title}</span><strong>{Math.min(goal.current,goal.goal)}/{goal.goal} · +{goal.prestige} prestígio</strong>
      </div>)}</div>
      {!!state.seasonHonors?.length&&<small>Última honraria: temporada {state.seasonHonors[0].season} — {state.seasonHonors[0].title} (+{state.seasonHonors[0].prestige} prestígio).</small>}
    </section>
    {state.event && <div className="council parchment"><img src="/reference/guild-council-2026.jpg" alt="" /><div><h2>Decisão do Conselho</h2><p>{state.event.title}</p><small>{state.event.text}</small><div className="council-actions">{state.event.choices.map(c => <button key={c.id} disabled={busy || (!!c.cost && state.gold < c.cost)} onClick={() => act({type:"event",eventId:state.event!.id,choiceId:c.id})}>{c.label}<small>{c.effect}{c.cost?` · Custo: ${fmt(c.cost)} ouro`:" · Sem custo adicional"}</small></button>)}</div></div></div>}
    <div className="hero-art-library parchment" aria-label="Biblioteca de artes dos heróis">
      <strong>Biblioteca Visual dos Heróis</strong><small>{heroArtProgress().portraits}/84 retratos e {heroArtProgress().battle}/84 imagens de combate completas.
      Novas imagens serão reconhecidas automaticamente pela raça, classe e sexo depois de adicionadas ao projeto e publicadas. Nenhum retrato de outra identidade será utilizado.</small>
    </div>
    <ParchmentTitle icon={<GameSymbol kind="guild"/>} title="Sede da Guilda" />
    <div className="building-list parchment">{buildings.map(([key,spec],index) => {
      const lvl = state.hq[key] || 0, max = spec.max, cost = hqUpgradeCost(state,key);
      const nextLvl=Math.min(max,lvl+1);
      const nextEffects:Record<HQBuilding,string>={
        infirmary:"Recuperação diária +"+(nextLvl*3)+" energia · ferimento reduzido até "+Math.floor(nextLvl/2)+" dias",
        forge:"Baú "+Math.min(300,30+nextLvl*30)+"/300 espaços · desconto até "+Math.min(20,nextLvl*2)+"%",
        academy:"Até "+(nextLvl?Math.min(4,1+nextLvl):0)+" aprendizes · treinamento +"+(nextLvl*7)+" EXP",
        library:"Magia +"+Math.ceil(nextLvl*.8)+" · cura +"+(nextLvl*2)+"%",
        stables:"Recuperação diária +"+(nextLvl*2)+" energia · menor fadiga",
        warroom:"Poder de expedição +"+(nextLvl*1.2).toFixed(1)+"%"
      };
      const effects:Record<HQBuilding,string>={
       infirmary:"Recuperação diária +"+(lvl*3)+" energia · ferimento reduzido até "+Math.floor(lvl/2)+" dias",
       forge:"Baú "+chestCapacity(state)+"/300 espaços · criação com até "+Math.min(20,lvl*2)+"% de desconto · itens reforçados",
       academy:"Até "+academySlots(state)+" aprendizes · treinamento diário +"+(lvl*7)+" EXP",
       library:"Magia +"+Math.ceil(lvl*.8)+" · cura +"+(lvl*2)+"%",
       stables:"Recuperação diária +"+(lvl*2)+" energia · menos fadiga e escoltas mais rápidas",
       warroom:"Poder de expedição +"+(lvl*1.2).toFixed(1)+"% · bônus nas batalhas entre guildas"
      };
      return <article className="guild-building-card" key={key}>
        <GuildRoomArt room={key} compact label={spec.name+": local medieval da Sede da Guilda."}/><div><h3>{spec.name} <small>Nv. {lvl}/10</small></h3><p>{spec.description}</p><small className="guild-building-effect">{effects[key]}</small>{lvl<max&&<small className="guild-building-next">Próximo nível: {nextEffects[key]}</small>}</div><div><span><GameSymbol kind="gold"/> {cost}</span><button className="action-button green" disabled={busy || lvl >= max || state.gold < cost} onClick={() => act({type:"upgrade-hq",building:key})}>{lvl >= max ? "Máximo" : "Melhorar"}</button></div></article>;
    })}</div>
    {!!state.pendingRewards?.length&&<section className="guild-pending-rewards parchment" aria-label="Recompensas da temporada aguardando espaço no baú">
      <h3><GameSymbol kind="reward"/> Recompensas pendentes · {state.pendingRewards.length}</h3>
      <p>Seu baú está sem espaço para todos os prêmios. Eles ficam guardados e não serão perdidos.</p>
      <small>{state.pendingRewards.slice(0,5).map(item=>ITEMS[item.key]?.name||item.key).join(" · ")}
        {state.pendingRewards.length>5?" · e outras "+(state.pendingRewards.length-5):""}</small>
      <button type="button" className="action-button green"
        disabled={busy||storageUsed(state.chest)>=chestCapacity(state)}
        onClick={()=>act({type:"claim-pending-rewards"})}>
        Receber prêmios · {Math.min(state.pendingRewards.length,Math.max(0,chestCapacity(state)-storageUsed(state.chest)))} espaço(s)
      </button>
    </section>}
    <section className="parchment catalog-forge"><h3><GameSymbol kind="forge" size={18}/> Forja · Nv. {state.hq.forge}</h3>
    <p className="forge-capacity">Capacidade do Baú: <strong>{storageUsed(state.chest)}/{chestCapacity(state)}</strong> · Forja Nv. {state.hq.forge}/10</p>
    {state.seasonForgePlans?.filter(plan=>!plan.crafted).map(plan=><div className="seasonal-forge-order parchment" key={plan.season}>
      <strong><GameSymbol kind="reward"/> Relíquia exclusiva · Temporada {plan.season}</strong>
      <p>{CATALOG_BY_ID[plan.itemKey]?.nome} — prêmio por ficar entre as três melhores guildas.</p>
      <small>Materiais exatos para um único item: {Object.entries(plan.materials).map(([key,qty])=>qty+"× "+CATALOG_BY_ID[key]?.nome).join(" · ")}</small>
      <button className="action-button green" disabled={busy||state.hq.forge<2||Object.entries(plan.materials).some(([key,qty])=>state.chest.filter(i=>!i.equippedTo&&i.key===key).length<qty)}
        onClick={()=>act({type:"craft-seasonal",season:plan.season})}>Forjar item único {state.hq.forge<2?"(Forja Nv. 2)":"✓"}</button>
    </div>)}
    <div className="guild-forjador">
      <img src="/guild/forjador.webp" alt="O Forjador, mestre artesão da guilda, trabalhando com martelo e bigorna diante da fornalha." width={720} height={960} loading="lazy"/>
      <div><strong>O Forjador</strong><p>O mestre artesão da guilda transforma recursos raros em armas e equipamentos. Traga seus materiais, pague a taxa e escolha sua encomenda.</p>
       <small>{state.hq.forge>0?"Forja disponível · nível "+state.hq.forge:"Aprimore a Forja na Sede para liberar suas receitas."}</small></div>
    </div>
    <small>Consome materiais e taxa em ouro. Sem itens gratuitos.</small>
    <div className="catalog-shop">{TEST_RECIPES.filter(r=>r.forge>0&&r.forge<=state.hq.forge).slice(0,16).map(r=>{
      const enough=Object.entries(r.materials).every(([k,q])=>state.chest.filter(i=>i.key===k&&!i.equippedTo).length>=q);
      const discounted=Math.max(1,Math.round(r.cost*(1-Math.min(.2,state.hq.forge*.02))));
      return <div key={r.id}><ItemArt itemKey={r.result}/><span><strong>{ITEMS[r.result]?.name}</strong><small>{Object.entries(r.materials).map(([k,q])=>q+"× "+(ITEMS[k]?.name||k)).join(" + ")}</small></span>
      <button className="small-button" disabled={busy||!enough||state.gold<discounted||storageUsed(state.chest)>=chestCapacity(state)} onClick={()=>act({type:"craft",recipeId:r.id})}><GameSymbol kind="gold"/> Forjar · {fmt(discounted)}</button></div>;
    })}{!state.hq.forge&&<p>Melhore a Forja para liberar receitas.</p>}</div></section>
    <SupremeLibraryPanel state={state} act={act} busy={busy}/>
    <div className="guild-grid">
      <section className="guild-mini parchment"><h3>Mapa do Mundo · 12 regiões</h3>
        <div className="world-summary" aria-label="Progresso regional">
          <strong>{state.activeRegion}. {currentRegion.name}</strong>
          <small>{currentRegion.theme} · Nível base recomendado: {currentRegion.minLevel}</small>
          <span>{state.region}/12 territórios liberados · {currentContracts.length} contratos disponíveis</span>
          <small>Guardião: {state.bossSeasons.includes(state.season)?"Já derrotado nesta temporada":regionalGuardian?regionalGuardian.title+" · disponível":seasonDay(state)<45?"Disponível a partir do dia 45":"Aguarda desafio"}</small>
        </div>
        <div className="world-list">{WORLD_MAP.map((r,i) => <button key={r.name} data-active={state.activeRegion === i+1} disabled={i+1 > state.region || busy} onClick={() => act({type:"travel-region",region:i+1})}>
          <strong>{i+1}. {r.name}{i+1>state.region?" · Bloqueada":state.activeRegion===i+1?" · Atual":""}</strong>
          <small>Nível sugerido {r.minLevel} · {r.theme}</small>
        </button>)}</div></section>
      <AcademyPanel state={state} act={act} busy={busy} />
      <section className="guild-mini parchment"><h3>Sala de Guerra · Guerra de Guildas</h3>
        <p>Envie três frentes simultâneas com 3 heróis cada.</p><button className="action-button red" disabled={busy || raidTeams.length !== 3 || activeExpeditions(state).length > 0 || state.raidHistory.some(r=>r.day===state.day) || state.rivalBattleHistory.some(r=>r.day===state.day)} onClick={() => raidTeams.length === 3 && act({type:"guild-raid",teams:raidTeams})}>Iniciar incursão 3×3</button>{state.raidHistory[0] && <small>Última incursão: {state.raidHistory[0].won ? "Vitória" : "Derrota"} · {state.raidHistory[0].fronts.filter(f=>f.won).length}/3 frentes</small>}</section>
    </div>
    <RivalRecruitPanel state={state} act={act} busy={busy} />
    <SymbolGuide />
    <ParchmentTitle icon={<GameSymbol kind="help"/>} title="Salvamento e Configurações" />
    <div id="guild-settings" className="guild-settings-controls parchment">
      <div className="guild-setting-row">
        <div><strong>Trilha de fantasia · {RPG_MUSIC_TRACKS.length} músicas</strong><small>Tocando: {RPG_MUSIC_TRACKS[musicIndex].name} ({RPG_MUSIC_TRACKS[musicIndex].mood}). A sequência avança automaticamente sem repetir faixas até o final; volume pelos botões do celular.</small><button className="music-next-button" onClick={nextTrack} aria-label="Pular para a próxima música">Próxima música →</button></div>
        <button className="small-button" onClick={toggleMusic} aria-pressed={musicEnabled}>{musicEnabled ? <><Volume2 size={16}/> Música ligada</> : <><VolumeX size={16}/> Música desligada</>}</button>
      </div>
      <div className="guild-setting-row">
        <div><strong>Modo leve · melhor desempenho</strong><small>Reduz sombras, efeitos e animações para melhorar a fluidez e poupar bateria. Não altera missões, cálculos ou salvamentos.</small></div>
        <button className="small-button" aria-pressed={liteMode} onClick={() => setLiteMode(!liteMode)}>{liteMode ? "Ativado" : "Desativado"}</button>
      </div>
      <small className="music-credit">Trilhas de Juhani Junkala / SubspaceAudio, HydroGene, RandomMind (CC0) e Kevin MacLeod (CC BY 4.0). <a href="/music/CREDITOS.txt" target="_blank" rel="noreferrer">Ver licenças e créditos completos</a>. Mais de 30 minutos de faixas diferentes, disponíveis sem internet após o primeiro carregamento.</small>
    </div>
    <div className="settings-panel parchment"><button onClick={onExport}><Download /> Baixar cópia de segurança</button><button onClick={onImport}><Upload /> Importar cópia de segurança</button><button onClick={onRecover} disabled={!recoveryAvailable()}><Archive /> Recuperar salvamento anterior</button><button className="danger" onClick={onReset}><X /> Reiniciar campanha</button></div>
  </section>;
}


const CINEMA_STATUS_LABELS: Record<string,string> = {
  bleed:"Sangramento",poison:"Envenenado",stun:"Atordoado",shield:"Escudo",
  regen:"Regeneração",taunt:"Provocação",inspired:"Inspirado",vulnerable:"Vulnerável"
};
/** Única interface de combate da campanha.
 * Preserva o motor, as expedições, recompensas e salvamentos existentes.
 * As antigas telas clássica, cinematográfica e de demonstração não são mais rotas de batalha.
 */
function BattleOverlay({ state, expedition, act, close, returnToTeam, busy }: {
  state: Campaign; expedition: Expedition; act: (a: Action) => void; close: () => void; returnToTeam: () => void; busy: boolean;
}) {
  return <div className="battle-overlay">
    <Arena2D key={expedition.id} state={state} expedition={expedition}
      act={act} close={close} returnToTeam={returnToTeam} busy={busy}/>
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
  const [lastBackupDay,setLastBackupDay] = useState(() => {
    try {const value=Number(window.localStorage.getItem("cronicas-backup-dia"));return Number.isSafeInteger(value)&&value>0?value:0;}catch{return 0;}
  });
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

  const recover=()=>{
    if(!window.confirm("Recuperar o salvamento anterior e substituir o atual?"))return;
    try{const next=restoreRecoveryCampaign();hydrate({state:next.state,revision:next.revision});setError("");}
    catch(e){setError(e instanceof Error?e.message:"Não foi possível recuperar a campanha.");}
  };
  if (!state) return <main className="boot-screen"><GameSymbol kind="guild"/><h1>Crônicas da Guilda</h1><p>{error || "Abrindo sua campanha…"}</p>
    {error&&<div className="boot-recovery"><button onClick={recover} disabled={!recoveryAvailable()}>Recuperar campanha anterior</button>
      <label>Importar arquivo de cópia de segurança<input type="file" accept=".json,application/json" onChange={e=>{const file=e.target.files?.[0];if(file)void restore(file);e.currentTarget.value="";}}/></label>
      <small>O salvamento original não foi apagado. Não iniciaremos uma campanha nova automaticamente.</small></div>}
  </main>;

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
    a.href=url; a.download="cronicas-da-guilda-copia-de-seguranca.json"; a.click(); URL.revokeObjectURL(url);
    const day=saveRef.current?.state.day||0;
    if(day){setLastBackupDay(day);try{localStorage.setItem("cronicas-backup-dia",String(day));}catch{}}
  };
  const restore = async (file: File) => {
    if(!window.confirm("Importar esta cópia de segurança e substituir a campanha atual? A versão anterior será preservada para recuperação."))return;
    try { const next = importLocalCampaign(await file.text()); hydrate({state:next.state,revision:next.revision}); }
    catch(e){ setError(e instanceof Error ? e.message : "Cópia de segurança inválida."); }
  };

  return <div className="app-shell">
    <TopBar state={state} goGuild={() => go("guild")} goSettings={openSettings} />
    <div className="campaign-day-strip" role="status">Temporada {state.season} · Dia {String(seasonDay(state)).padStart(2,"0")}/{SEASON_DAYS} <span>· Próximo dia na Guilda</span></div>
    {state.day>=7&&(lastBackupDay===0||state.day-lastBackupDay>=7)&&<div className="guild-backup-reminder" role="status">
      <span>O progresso fica neste aparelho. Faça uma cópia antes de limpar o navegador ou trocar de celular.</span>
      <button type="button" onClick={downloadBackup}><Download size={16}/> Fazer cópia</button>
    </div>}
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
      {screen === "league" && <LeaguePage state={state} team={team} act={perform} busy={busy} openTeam={()=>go("team")} />}
      {screen === "rest" && <RestPage state={state} act={perform} busy={busy} />}
      {screen === "heroes" && <HeroPage state={state} selectedId={selectedHeroId} selectHero={setSelectedHeroId} openEquipment={() => go("equipment")} act={perform} busy={busy} />}
      {screen === "equipment" && <EquipmentPage state={state} selectedId={selectedHeroId} selectHero={setSelectedHeroId} back={() => go("heroes")} act={perform} busy={busy} />}
      {screen === "chest" && <ChestPage state={state} act={perform} busy={busy} />}
      {screen === "tavern" && <TavernPage state={state} act={perform} busy={busy} openMission={id => { setSelectedMissionId(id); go("mission"); }} />}
      {screen === "guild" && <GuildPage state={state} act={perform} busy={busy} go={go} onExport={downloadBackup} onImport={() => fileRef.current?.click()} onRecover={recover} onReset={() => { if (window.prompt("Para reiniciar toda a campanha, digite REINICIAR. Seu progresso será perdido.")==="REINICIAR") perform({type:"reset"}); }} musicEnabled={musicEnabled} toggleMusic={toggleMusic} liteMode={liteMode} setLiteMode={setLiteMode} musicIndex={musicIndex} nextTrack={nextTrack} />} 
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
