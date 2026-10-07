import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Archive, BookOpen, Check, ChevronRight, CircleHelp, Coins, Crown, Download,
  Flag, Hammer, Heart, LockKeyhole, ScrollText, Shield, Sparkles, Swords,
  Target, Tent, Trophy, Upload, Users, Volume2, VolumeX, X
} from "lucide-react";
import {
  CLASSES, RACES, TACTICS, ITEMS, KIND_NAMES, PATH_NAMES, RACIAL_PATH_NAMES,
  SPECIALIZATIONS, SPECIALIZATION_BRANCHES, RACE_TREES, HERO_STORIES,
  HQ_DEFINITIONS, WORLD_MAP, CRAFTING_RECIPES, NEGOTIATION_MODES, JOURNEY_CHOICES,
  activeExpeditions, freeExpeditionSlots, available, activeJourney, heroOnExpedition,
  heroRace, heroStats, threshold, missions, missionLocks, missionReadiness, seasonBoss,
  teamPower, standings, leaguePrize, market, shop, talentPoints, racialPoints,
  trainingPlan, defaultFormationLine, formationValid, suggestSpecialistTeam,
  hqUpgradeCost, academySlots, negotiationQuote, rank,
  type Action, type Battle, type BattleConsumableKey, type Campaign, type ChestItem,
  type EvolutionBranch, type Expedition, type ExpeditionSlot, type FormationLine,
  type Hero, type HQBuilding, type JourneyChoice, type JourneyDuration,
  type Mission, type NegotiationMode, type RacialPath, type TalentPath, type Tactic
} from "@/lib/game";
import {
  exportLocalCampaign, importLocalCampaign, readLocalCampaign, updateLocalCampaign,
  type LocalSave
} from "@/lib/local-save";
import { portraitPosition } from "@/lib/portraits";

type Save = Pick<LocalSave, "state" | "revision">;
type Screen = "mission" | "team" | "league" | "rest" | "heroes" | "chest" | "tavern" | "guild";

const fmt = (n: number) => n.toLocaleString("pt-BR");
const missionArt = ["/reference/mission-1.webp", "/reference/mission-2.webp", "/reference/mission-3.webp", "/reference/mission-4.webp", "/reference/mission-5.webp"];
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
const itemArtFile = (key: string) => {
  const k = key.toLowerCase();
  if (k === "antidote") return "antidote";
  if (/bomb/.test(k)) return "stun_bomb";
  if (/healing|potion|tonic|repair/.test(k)) return "healing_potion";
  if (/bow/.test(k)) return "hunter_bow";
  if (/staff|wand|cane|orb|book|cards/.test(k)) return "runic_staff";
  if (/ring/.test(k)) return "amber_ring";
  if (/pendant|charm|symbol|medallion|emblem|bell|coin/.test(k)) return "star_pendant";
  if (/armor|mail|plate|guard|coat|vest|shroud|hood|gloves|boots|robe|costume|bracers/.test(k)) return "ancient_armor";
  if (/map|scroll/.test(k)) return "secret_map";
  if (/key/.test(k)) return "ancient_key";
  if (/sword|blade|dagger|cleaver|scythe|spear|hammer|mace|axe/.test(k)) return /dragon|king|dawn/.test(k) ? "dragon_fang" : "iron_sword";
  if (/idol|relic|scarab|crown|die/.test(k)) return "ancient_idol";
  return "gemstone";
};


type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };

function useAmbientRpgMusic() {
  const [musicEnabled,setMusicEnabled] = useState(true);
  const enabledRef = useRef(true);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef(0);

  const roots = useMemo(() => [
    45,48,52,50, 43,47,50,45, 48,52,55,50, 45,50,53,48,
    43,48,52,47, 45,49,52,50, 41,45,48,43, 46,50,53,48
  ], []);

  const hz = (midi:number) => 440 * Math.pow(2,(midi - 69) / 12);

  const playStep = useCallback((ctx:AudioContext, master:GainNode, step:number) => {
    const now = ctx.currentTime;
    const root = roots[step % roots.length];
    const third = step % 6 === 2 || step % 6 === 5 ? 3 : 4;
    const notes = [root - 12, root, root + third, root + 7, root + 12];

    notes.forEach((note,index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = index === 0 ? "triangle" : "sine";
      osc.frequency.value = hz(note);
      filter.type = "lowpass";
      filter.frequency.value = index === 0 ? 520 : 1050;
      filter.Q.value = .45;
      const peak = index === 0 ? .014 : .0085;
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(peak,now + 1.5 + index * .08);
      gain.gain.setValueAtTime(peak,now + 4.6);
      gain.gain.exponentialRampToValueAtTime(.0001,now + 8.2);
      osc.connect(filter); filter.connect(gain); gain.connect(master);
      osc.start(now + index * .035);
      osc.stop(now + 8.35);
    });

    if (step % 2 === 0) {
      [root + 12,root + 19,root + 24].forEach((note,index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = hz(note);
        const when = now + .8 + index * .62;
        gain.gain.setValueAtTime(.0001,when);
        gain.gain.exponentialRampToValueAtTime(.0045,when + .04);
        gain.gain.exponentialRampToValueAtTime(.0001,when + 2.2);
        osc.connect(gain); gain.connect(master);
        osc.start(when); osc.stop(when + 2.25);
      });
    }
  },[roots]);

  const stopMusic = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    const ctx = ctxRef.current;
    ctxRef.current = null; masterRef.current = null; stepRef.current = 0;
    if (ctx && ctx.state !== "closed") void ctx.close();
  },[]);

  const startMusic = useCallback(async () => {
    if (!enabledRef.current) return;
    if (ctxRef.current) {
      if (ctxRef.current.state === "suspended") await ctxRef.current.resume();
      return;
    }
    const AudioCtor = window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    const master = ctx.createGain();
    master.gain.value = .52;
    master.connect(ctx.destination);
    ctxRef.current = ctx; masterRef.current = master;
    const tick = () => {
      if (!enabledRef.current || !ctxRef.current || !masterRef.current) return;
      playStep(ctxRef.current,masterRef.current,stepRef.current++);
    };
    tick();
    timerRef.current = window.setInterval(tick,7000);
    if (ctx.state === "suspended") await ctx.resume();
  },[playStep]);

  useEffect(() => {
    const saved = window.localStorage.getItem("cronicas-musica");
    const enabled = saved === null ? true : saved === "on";
    enabledRef.current = enabled; setMusicEnabled(enabled);
    const unlock = () => { if (enabledRef.current) void startMusic(); };
    window.addEventListener("pointerdown",unlock,{once:true,passive:true});
    window.addEventListener("keydown",unlock,{once:true});
    return () => {
      window.removeEventListener("pointerdown",unlock);
      window.removeEventListener("keydown",unlock);
      stopMusic();
    };
  },[startMusic,stopMusic]);

  const toggleMusic = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next; setMusicEnabled(next);
    window.localStorage.setItem("cronicas-musica",next ? "on" : "off");
    if (next) void startMusic(); else stopMusic();
  },[startMusic,stopMusic]);

  return { musicEnabled, toggleMusic };
}

function HeroPortrait({ hero, large = false }: { hero: Pick<Hero, "id" | "name" | "class" | "race">; large?: boolean }) {
  return <span
    className={"hero-portrait" + (large ? " hero-portrait-large" : "")}
    style={{ backgroundPosition: portraitPosition(hero.name, hero.id, hero.class, heroRace(hero)) }}
    role="img"
    aria-label={"Retrato de " + hero.name}
  />;
}

function ItemArt({ itemKey }: { itemKey: string }) {
  const def = ITEMS[itemKey];
  return <span className={"item-art rarity-" + (def?.rarity || "common")}>
    <Archive className="item-fallback" />
    <img
      src={"/items/" + itemArtFile(itemKey) + ".svg"}
      alt={def?.name || itemKey}
      onError={e => { e.currentTarget.style.display = "none"; }}
    />
  </span>;
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

function TopBar({ state, goGuild, musicEnabled, toggleMusic }: { state: Campaign; goGuild: () => void; musicEnabled: boolean; toggleMusic: () => void }) {
  return <header className="game-header">
    <div className="header-banner"><Crown /></div>
    <div className="header-title">CRÔNICAS DA GUILDA</div>
    <div className="header-resources">
      <button onClick={goGuild}><Coins /><strong>{fmt(state.gold)}</strong><b>+</b></button>
      <button onClick={goGuild}><Sparkles /><strong>{fmt(state.fame)}</strong><b>+</b></button>
    </div>
    <button className="header-music" onClick={toggleMusic} aria-label={musicEnabled ? "Desligar música" : "Ligar música"} title={musicEnabled ? "Música ambiente ligada" : "Música ambiente desligada"}>{musicEnabled ? <Volume2 /> : <VolumeX />}</button>
    <button className="header-settings" onClick={goGuild} aria-label="Configurações">⚙</button>
  </header>;
}

function TopNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  const tabs: Array<[Screen,string,ReactNode]> = [
    ["mission","Missão",<Swords key="m" />],
    ["team","Equipe",<Users key="e" />],
    ["league","Liga",<Trophy key="l" />],
    ["rest","Descanso",<Tent key="d" />],
  ];
  return <nav className="top-nav">{tabs.map(([id,label,icon]) =>
    <button key={id} data-active={screen === id} onClick={() => go(id)}>{icon}<span>{label}</span></button>
  )}</nav>;
}

function BottomNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  const missionActive = ["mission","team","league","rest"].includes(screen);
  const tabs: Array<[Screen,string,ReactNode,boolean]> = [
    ["mission","Missões",<Target key="m" />,missionActive],
    ["heroes","Heróis",<Shield key="h" />,screen === "heroes"],
    ["chest","Baú",<Archive key="b" />,screen === "chest"],
    ["tavern","Taverna",<span className="beer-icon" key="t">🍺</span>,screen === "tavern"],
    ["guild","Guilda",<Crown key="g" />,screen === "guild"],
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
  const cards = [...board, ...(boss ? [boss] : [])].slice(0,5);
  return <section className="screen mission-screen">
    <div className="mission-list">
      {cards.map((m, index) => {
        const locks = missionLocks(state, m);
        const selected = m.id === selectedId;
        return <article className="mission-card" data-selected={selected} data-locked={!!locks.length} key={m.id}>
          <div className="mission-art"><img src={missionArt[index % missionArt.length]} alt="" /><span>{KIND_NAMES[m.kind]}</span></div>
          <div className="mission-copy">
            <h2>{m.title}</h2>
            <p>{m.description}</p>
            <div className="difficulty"><b>Dificuldade:</b>{[0,1,2,3,4].map(i => <i key={i} data-on={i < m.rank}>◆</i>)}</div>
            <div className="specialist"><Target /><span>Especialistas: {specialtyName(m.specialty)}</span></div>
            {!!locks.length && <small className="locked-copy"><LockKeyhole /> {locks[0]}</small>}
          </div>
          <div className="mission-rewards">
            <span><Coins /> {m.reward} Ouro</span>
            <span><Sparkles /> +{20 + m.rank * 15} XP</span>
            <span><Archive /> Saque Nv. {m.rank}</span>
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
  const canSend = free.includes(slot) && !missionLocks(state, selectedMission).length && team.length >= 3 && team.length <= 4 && team.every(id => {
    const h = state.heroes.find(x => x.id === id); return !!h && available(h, state);
  });
  return <section className="screen team-screen">
    <ParchmentTitle icon={<Target />} title="Expedições da Guilda" side={<small>Organize suas equipes e envie heróis.</small>} />
    <div className="expedition-grid">
      {([1,2,3] as ExpeditionSlot[]).map(s => {
        const exp = running.find(e => e.slot === s);
        return <article key={s} className={"expedition-card " + (exp ? "active" : "")}>
          <b>Expedição {s}</b>
          {exp ? <>
            <img src={s === 1 ? "/reference/expedition-1.webp" : "/reference/expedition-2.webp"} alt="" />
            <h3>{exp.battle.title}</h3><span><Target /> Em andamento · rodada {exp.battle.rounds}</span>
            <button className="action-button blue" onClick={() => openBattle(exp.id)}>Detalhes</button>
          </> : <>
            <div className="empty-expedition"><Target /></div>
            <h3>Espaço Disponível</h3><span>Monte uma equipe para uma nova expedição.</span>
            <button className={"action-button " + (slot === s ? "green" : "dark")} onClick={() => setSlot(s)}>Preparar</button>
          </>}
        </article>;
      })}
    </div>
    <ParchmentTitle icon={<Users />} title="Formação da Equipe" side={
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
        <div className="team-power"><Swords /><span>Poder da Equipe</span><strong>{fmt(power)}</strong></div>
      </div>
    </div>
    <div className="send-row">
      <div><strong>Pronto para a Expedição?</strong><span>{selectedMission.title} · vaga {slot}</span></div>
      <button className="action-button green huge" disabled={!canSend || busy} onClick={() => act({
        type:"mission", missionId:selectedMission.id, team, tactic, formation, expeditionSlot:slot, startedAt:Date.now()
      })}><Swords /> Enviar</button>
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
      <div className="big-crest"><Crown /></div>
      <div><h2>{state.name}</h2><p><Trophy /> {state.points} Pontos da Liga</p><small>Prestígio: {state.fame} · Divisão {rank(state)}</small></div>
    </div>
    <ParchmentTitle icon={<Trophy />} title="Classificação da Liga" side={<span>Temporada {state.season}</span>} />
    <div className="league-table parchment">
      <div className="league-head"><b>#</b><b>Guilda</b><b>Pontos</b><b>Recompensa</b></div>
      {table.slice(0,5).map((g,i) => <div key={g.id} className="league-row" data-player={g.id === "player"}>
        <strong>{i+1}</strong><span><i className={"mini-banner b" + (i%5)} />{g.name}</span><b><Trophy /> {g.points}</b><small><Coins /> {leaguePrize(i+1, state.leagueTier)} ouro</small>
      </div>)}
    </div>
    <ParchmentTitle icon={<Swords />} title="Desafio de Guilda" side={<span>Equipe: {team.length}/4</span>} />
    <div className="guild-challenge parchment">
      <img src="/reference/league-challenge.webp" alt="" />
      <div><h2>{rivalData?.name || "Guilda Rival"}</h2><p>Uma guilda rival disputa influência e prestígio. Derrote-a para fortalecer sua posição.</p>
        <span><Trophy /> {rivalData?.points || 0} pontos</span><span><Flag /> Força {rivalData?.strength || 0}</span>
      </div>
      <button className="action-button red huge" disabled={busy || !rivalData || team.length < 3 || activeExpeditions(state).length > 0}
        onClick={() => rivalData && act({ type:"rival-battle", guildId:rivalData.id, team })}>Desafiar</button>
    </div>
  </section>;
}

function RestPage({ state, act, busy }: { state: Campaign; act: (a: Action) => void; busy: boolean }) {
  const recover = state.heroes.filter(h => h.energy < 100 || h.injuredUntil > state.day);
  const shown = (recover.length ? recover : state.heroes).slice(0,4);
  const counts = (key: string) => state.chest.filter(i => i.key === key && !i.equippedTo).length;
  return <section className="screen rest-screen">
    <div className="sanctuary-head parchment">
      <img src="/reference/sanctuary.webp" alt="" />
      <div><h2>Santuário da Guilda</h2><p>Aqui seus heróis feridos podem repousar e se recuperar para novas aventuras.</p>
        <strong>Capacidade</strong><div className="beds">▰ ▰ ▰ ▱ ▱</div><span>{recover.length} heróis precisam de recuperação</span>
      </div>
    </div>
    <ParchmentTitle icon={<Shield />} title="Heróis em Recuperação" />
    <div className="recovery-list parchment">{shown.map(h => {
      const injured = h.injuredUntil > state.day;
      const plan = trainingPlan(state,h);
      return <article key={h.id}><HeroPortrait hero={h} />
        <div><h3>{h.name}</h3><span className={injured ? "danger-text" : "ok-text"}>{injured ? "Ferido" : h.energy < 100 ? "Recuperando" : "Pronto"}</span>
          <ProgressBar value={h.energy} tone={injured ? "red" : "green"} /><small>Energia {h.energy}% · Nv. {h.level}</small>
        </div>
        <button className="action-button blue" disabled={busy || injured || h.energy < 15} onClick={() => act({ type:"train-hero", heroId:h.id })}>Treinar +{plan.xp} XP</button>
      </article>;
    })}</div>
    <ParchmentTitle icon={<Archive />} title="Itens de Recuperação" />
    <div className="recovery-items parchment">
      {[["healing_potion","Poção de Cura"],["antidote","Antídoto"],["stun_bomb","Bomba Atordoante"]].map(([key,label]) => <article key={key}>
        <ItemArt itemKey={key} /><strong>{label}</strong><span>Possui: {counts(key)}</span><small>Usado diretamente durante o combate.</small>
      </article>)}
    </div>
    <button className="action-button green rest-all" disabled={busy} onClick={() => act({ type:"rest" })}><Tent /> Descansar toda a guilda</button>
  </section>;
}

function HeroPage({ state, selectedId, selectHero, act, busy }: {
  state: Campaign; selectedId: string; selectHero: (id: string) => void; act: (a: Action) => void; busy: boolean;
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
        <ParchmentTitle icon={<Users />} title="Meus Heróis" side={<span>{state.heroes.length}/12</span>} />
        {state.heroes.map(h => <button key={h.id} data-active={h.id === hero.id} onClick={() => selectHero(h.id)}>
          <HeroPortrait hero={h} /><span><strong>{h.name}</strong><small>{CLASSES[h.class].name} · {raceLabel(h)}</small><em>⚔ {fmt(teamPower(state,[h.id]))}</em><ProgressBar value={h.energy} tone={h.energy < 40 ? "red" : "blue"} /></span><b>Nv. {h.level}</b>
        </button>)}
      </aside>
      <article className="hero-sheet parchment">
        <div className="hero-feature"><div className="feature-portrait"><HeroPortrait hero={hero} large /></div><div><h2>{hero.name}</h2><p>{hero.trait}</p></div></div>
        <div className="hero-level"><strong>Nv. {hero.level}</strong><ProgressBar value={hero.level >= 50 ? 100 : hero.xp / threshold(hero) * 100} tone="gold" /><span>{hero.xp}/{hero.level >= 50 ? "MAX" : threshold(hero)} XP</span></div>
        <div className="hero-core"><div><span>Classe</span><strong>{CLASSES[hero.class].name}</strong></div><div><span>Raça</span><strong>{raceLabel(hero)}</strong></div><div><span>Força</span><strong>{fmt(teamPower(state,[hero.id]))}</strong></div></div>
        <section className="sheet-section"><label>Atributos</label><div className="stat-grid">
          <b>❤ Vida <em>{stats.hp}</em></b><b>⚔ Ataque <em>{stats.attack}</em></b><b>🛡 Defesa <em>{stats.defense}</em></b><b>✦ Magia <em>{stats.magic}</em></b><b>★ Crítico <em>{Math.round(stats.critical*100)}%</em></b><b>➤ Velocidade <em>{stats.speed}</em></b>
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
        <section className="sheet-section"><label>Equipamentos</label><div className="equipment-row">{equipped.length ? equipped.map(i => <ItemArt key={i.id} itemKey={i.key} />) : <small>Nenhum equipamento.</small>}</div></section>
        <button className="action-button blue huge" disabled={busy || !canAct || hero.energy < 15} onClick={() => act({type:"train-hero",heroId:hero.id})}>Treino Individual · +{trainingPlan(state,hero).xp} XP</button>
      </article>
    </div>
  </section>;
}

function ChestPage({ state, act, busy }: { state: Campaign; act: (a: Action) => void; busy: boolean }) {
  const [filter,setFilter] = useState("all");
  const [selectedId,setSelectedId] = useState(state.chest[0]?.id || "");
  const [recipient,setRecipient] = useState(state.heroes[0]?.id || "");
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
  return <section className="screen chest-screen">
    <div className="inventory-top"><button data-active>▣ Inventário</button><button onClick={() => setFilter("material")} data-active={filter === "material"}>◆ Materiais</button><span>🎒 {state.chest.length}/80</span></div>
    <div className="inventory-filters">{[["all","Todos"],["weapons","Armas"],["armor","Armaduras"],["accessory","Acessórios"],["consumable","Consumíveis"],["other","Outros"]].map(([id,label]) => <button key={id} data-active={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>
    <div className="inventory-layout">
      <div className="item-grid">{filtered.slice(0,40).map(item => <button key={item.id} data-active={selected?.id === item.id} className={"item-tile rarity-" + ITEMS[item.key].rarity} onClick={() => setSelectedId(item.id)}>
        <ItemArt itemKey={item.key} /><span>{ITEMS[item.key].name}</span>{item.equippedTo && <b>✓</b>}
      </button>)}</div>
      {selected && def ? <article className="item-detail parchment">
        <span className="rarity-label">{def.rarity.toUpperCase()}</span><h2>{def.name}</h2>
        <div className="selected-item-art"><ItemArt itemKey={selected.key} /></div>
        <p>{def.description}</p>
        <div className="item-stats">{([["Ataque",def.attack],["Defesa",def.defense],["Magia",def.magic],["Vida",def.hp],["Velocidade",def.speed]] as Array<[string,number|undefined]>).filter(([,v]) => v).map(([k,v]) => <span key={k}><b>{k}</b><em>+{v}</em></span>)}</div>
        {def.levelReq && <small>Nível necessário: {def.levelReq}</small>}
        {owner && <small>Equipado por {owner.name}</small>}
        {!owner && compatible.length > 0 && <select value={target} onChange={e => setRecipient(e.target.value)}>{compatible.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select>}
        <div className="item-actions">
          {itemSlots.has(def.slot) && (owner ? <button className="action-button blue" disabled={busy} onClick={() => act({type:"unequip",itemId:selected.id})}>Desequipar</button> : <button className="action-button green" disabled={busy || !target} onClick={() => target && act({type:"equip",itemId:selected.id,heroId:target})}>Equipar</button>)}
          {!owner && <button className="action-button blue" disabled={busy} onClick={() => act({type:"sell",itemId:selected.id})}><Coins /> Vender · {def.value}</button>}
          {def.slot === "consumable" && <div className="combat-only-note">Consumível de combate</div>}
        </div>
      </article> : <div className="item-detail parchment empty-detail">Nenhum item nesta categoria.</div>}
    </div>
  </section>;
}

function TavernPage({ state, act, busy, openMission }: { state: Campaign; act: (a: Action) => void; busy: boolean; openMission: (id:string) => void }) {
  const recruits = market(state).slice(0,4);
  const rumors = missions(state).slice(0,3);
  const offers = shop(state).slice(0,6);
  return <section className="screen tavern-screen">
    <div className="tavern-hero"><img src="/reference/tavern-hero.webp" alt="" /><div>Boas histórias<br/>sempre encontram<br/>um lugar aqui.</div></div>
    <ParchmentTitle icon={<Users />} title="Heróis para Recrutar" side={<span>Renova semanalmente</span>} />
    <div className="recruit-grid parchment">{recruits.map(h => <article key={h.id}><HeroPortrait hero={h} large /><h3>{h.name}</h3><span>{CLASSES[h.class].name}</span><small><Coins /> {h.value} Ouro</small><button className="action-button red" disabled={busy || state.gold < h.value} onClick={() => act({type:"hire",heroId:h.id})}>Recrutar</button></article>)}</div>
    <div className="tavern-lower">
      <section className="rumors parchment"><ParchmentTitle icon={<ScrollText />} title="Rumores da Taverna" />{rumors.map(m => <button key={m.id} onClick={() => openMission(m.id)}><span><strong>{m.title}</strong><small>{m.description}</small></span><em><Coins /> {m.reward}</em></button>)}</section>
      <aside className="tavern-side">
        <section className="parchment drinks"><div className="mug">🍺</div><h3>Bebidas da Casa</h3><p>Brinde com a guilda para recuperar o moral e a energia.</p><button className="action-button green" disabled={busy || state.gold < 8} onClick={() => act({type:"rest"})}>Descansar</button></section>
        <section className="parchment shop"><div className="merchant-head"><div className="merchant-portrait" role="img" aria-label="Mercador da taverna" /><span><h3>Mercador</h3><small>Suprimentos e achados da estrada</small></span></div>{offers.map(o => <button key={o.key} disabled={busy || !o.available || state.gold < o.price || state.fame < o.requiredFame} onClick={() => act({type:"buy",key:o.key})}><ItemArt itemKey={o.key} /><span>{ITEMS[o.key].name}<small>{o.price} ouro</small></span></button>)}</section>
      </aside>
    </div>
  </section>;
}

function AcademyPanel({ state, act, busy }: { state: Campaign; act: (a: Action) => void; busy: boolean }) {
  const slots = academySlots(state);
  const [draft,setDraft] = useState<string[]>(state.academy.trainees);
  useEffect(() => setDraft(state.academy.trainees), [state.academy.trainees.join(",")]);
  if (!slots) return <div className="guild-mini parchment"><h3>Academia</h3><p>Melhore a Academia para liberar aprendizes.</p></div>;
  const toggle = (id:string) => setDraft(old => old.includes(id) ? old.filter(x => x !== id) : old.length < slots ? [...old,id] : old);
  return <div className="guild-mini parchment"><h3>Academia · {draft.length}/{slots}</h3><div className="academy-heroes">{state.heroes.slice(0,8).map(h => <button key={h.id} data-active={draft.includes(h.id)} onClick={() => toggle(h.id)}><HeroPortrait hero={h}/><span>{h.name.split(" ")[0]}</span></button>)}</div><button className="small-button" disabled={busy} onClick={() => act({type:"academy-trainees",heroIds:draft})}>Salvar aprendizes</button>
    <select value={state.academy.mentorId || ""} onChange={e => act({type:"academy-mentor",heroId:e.target.value || undefined})}><option value="">Sem mentor</option>{state.heroes.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
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
        return <button key={mode} disabled={busy || !q.eligible} onClick={() => act({type:"negotiate-rival",guildId:guild.id,heroId:hero.id,mode})}><strong>{NEGOTIATION_MODES[mode].title}</strong><small>{q.price} ouro · {q.chance}%</small>{q.reason && <em>{q.reason}</em>}</button>;
      })}</div>
    </>}
  </div>;
}

function GuildPage({
  state, act, busy, onExport, onImport, onReset
}: { state: Campaign; act: (a: Action) => void; busy: boolean; onExport: () => void; onImport: () => void; onReset: () => void }) {
  const buildings = Object.entries(HQ_DEFINITIONS) as Array<[HQBuilding,(typeof HQ_DEFINITIONS)[HQBuilding]]>;
  const availableRaidHeroes = state.heroes.filter(h => available(h,state)).slice(0,9);
  const raidTeams = availableRaidHeroes.length >= 9 ? [availableRaidHeroes.slice(0,3).map(h=>h.id),availableRaidHeroes.slice(3,6).map(h=>h.id),availableRaidHeroes.slice(6,9).map(h=>h.id)] : [];
  return <section className="screen guild-screen">
    <div className="guild-identity parchment">
      <div className="guild-banner"><Crown /></div>
      <div><h2>{state.name}</h2><p>Força na união, glória em cada jornada.</p><span><Users /> Membros: {state.heroes.length}/12</span><span><Shield /> Nível da Guilda: {Math.max(1,Math.ceil(state.fame/120))}</span></div>
      <aside><strong><Coins /> Tesouro {fmt(state.gold)}</strong><strong><Flag /> Renome {state.fame}</strong><strong><Trophy /> Liga {rank(state)}</strong></aside>
    </div>
    {state.event && <div className="council parchment"><img src="/reference/guild-council.webp" alt="" /><div><h2>Decisão do Conselho</h2><p>{state.event.title}</p><small>{state.event.text}</small><div className="council-actions">{state.event.choices.map(c => <button key={c.id} disabled={busy || (!!c.cost && state.gold < c.cost)} onClick={() => act({type:"event",eventId:state.event!.id,choiceId:c.id})}>{c.label}<small>{c.effect}</small></button>)}</div></div></div>}
    <ParchmentTitle icon={<Crown />} title="Sede da Guilda" />
    <div className="building-list parchment">{buildings.map(([key,spec],index) => {
      const lvl = state.hq[key] || 0, max = spec.max, cost = hqUpgradeCost(state,key);
      const arts = ["/reference/guild-training.webp","/reference/guild-market.webp","/reference/guild-sanctuary.webp","/reference/guild-workshop.webp"];
      return <article key={key}><img src={arts[index%arts.length]} alt="" /><div><h3>{spec.name} <small>Nv. {lvl}</small></h3><p>{spec.description}</p></div><div><span><Coins /> {cost}</span><button className="action-button green" disabled={busy || lvl >= max || state.gold < cost} onClick={() => act({type:"upgrade-hq",building:key})}>{lvl >= max ? "Máximo" : "Melhorar"}</button></div></article>;
    })}</div>
    <div className="guild-grid">
      <section className="guild-mini parchment"><h3>Mapa do Mundo</h3><div className="world-list">{WORLD_MAP.map((r,i) => <button key={r.name} data-active={state.activeRegion === i+1} disabled={i+1 > state.region || busy} onClick={() => act({type:"travel-region",region:i+1})}><strong>{i+1}. {r.name}</strong><small>{r.theme}</small></button>)}</div></section>
      <section className="guild-mini parchment"><h3>Forja</h3><div className="forge-list">{CRAFTING_RECIPES.slice(0,6).map(r => <button key={r.id} disabled={busy || state.hq.forge < r.forge || state.gold < r.cost} onClick={() => act({type:"craft",recipeId:r.id})}><ItemArt itemKey={r.result}/><span><strong>{ITEMS[r.result].name}</strong><small>{r.cost} ouro · Forja {r.forge}</small></span></button>)}</div></section>
      <AcademyPanel state={state} act={act} busy={busy} />
      <section className="guild-mini parchment"><h3>Guerra de Guildas</h3><p>Envie três frentes simultâneas com 3 heróis cada.</p><button className="action-button red" disabled={busy || raidTeams.length !== 3 || activeExpeditions(state).length > 0} onClick={() => raidTeams.length === 3 && act({type:"guild-raid",teams:raidTeams})}>Iniciar Raid 3×3</button>{state.raidHistory[0] && <small>Última raid: {state.raidHistory[0].won ? "Vitória" : "Derrota"} · {state.raidHistory[0].fronts.filter(f=>f.won).length}/3 frentes</small>}</section>
    </div>
    <RivalRecruitPanel state={state} act={act} busy={busy} />
    <ParchmentTitle icon={<CircleHelp />} title="Save e Configurações" />
    <div className="settings-panel parchment"><button onClick={onExport}><Download /> Baixar backup</button><button onClick={onImport}><Upload /> Importar backup</button><button className="danger" onClick={onReset}><X /> Reiniciar campanha</button></div>
  </section>;
}

function BattleOverlay({ state, expedition, act, close, busy }: {
  state: Campaign; expedition: Expedition; act: (a: Action) => void; close: () => void; busy: boolean;
}) {
  const battle = expedition.battle;
  const fighters = battle.combat?.fighters || battle.fighters || [];
  const heroes = fighters.filter(f => f.side === "hero");
  const enemies = fighters.filter(f => f.side === "enemy");
  const active = battle.status === "active" && !!battle.combat;
  const count = (key: BattleConsumableKey) => state.chest.filter(i => i.key === key && !i.equippedTo).length;
  const lowestHero = heroes.filter(f => f.hp > 0 && f.hp < f.maxHp).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
  const debuffedHero = heroes.find(f => f.hp > 0 && f.statuses?.some(s => ["poison","bleed","vulnerable"].includes(s.kind))) || lowestHero || heroes.find(f=>f.hp>0);
  const enemyTarget = enemies.filter(f=>f.hp>0).sort((a,b)=>b.hp-a.hp)[0];
  const useConsumable = (key: BattleConsumableKey) => {
    const targetId = key === "healing_potion" ? lowestHero?.id : key === "antidote" ? debuffedHero?.id : enemyTarget?.id;
    if (targetId) act({type:"battle-consumable",key,targetId,expeditionId:expedition.id});
  };
  return <div className="battle-overlay">
    <section className="battle-sheet">
      <div className="battle-top"><div><strong>{battle.title}</strong><span>Rodada {battle.rounds}{battle.objective?.targetRounds ? "/" + battle.objective.targetRounds : ""}</span></div><button onClick={close}><X /></button></div>
      <div className="battle-objective"><span>{battle.objective?.name || "Objetivo"}</span><strong>{battle.status === "active" ? "Combate automático" : battle.won ? "Vitória" : "Confronto encerrado"}</strong></div>
      <div className="battle-stage">
        <div className="fighters allies">{heroes.map(f => <article key={f.id}><HeroPortrait hero={{id:f.id,name:f.name,class:f.class || "warrior"}}/><div><strong>{f.name}</strong><small>{f.class ? CLASSES[f.class].name : "Herói"}</small><ProgressBar value={f.maxHp ? f.hp/f.maxHp*100 : 0} tone="red"/><span>{f.hp}/{f.maxHp}</span></div></article>)}</div>
        <div className="battle-center-mark"><Swords /></div>
        <div className="fighters enemies">{enemies.map(f => <article key={f.id}><img src={"/enemies/" + enemyArtKey(f.name) + ".webp"} alt="" /><div><strong>{f.name}</strong><small>{f.statuses?.map(s=>s.kind).join(" · ") || "Inimigo"}</small><ProgressBar value={f.maxHp ? f.hp/f.maxHp*100 : 0} tone="red"/><span>{f.hp}/{f.maxHp}</span></div></article>)}</div>
      </div>
      <div className="battle-log parchment">{battle.log.slice(-5).map((l,i) => <p key={i} data-kind={l.kind}>{l.text}</p>)}{!battle.log.length && <p>Os combatentes tomam posição.</p>}</div>
      <div className="consumable-title"><Archive /> Consumíveis</div>
      <div className="battle-consumables">
        {([
          ["healing_potion","Poção de Cura","Restaura vida do aliado mais ferido."],
          ["antidote","Antídoto","Remove veneno e efeitos negativos."],
          ["stun_bomb","Bomba Atordoante","Atordoa um inimigo por 1 rodada."]
        ] as Array<[BattleConsumableKey,string,string]>).map(([key,label,desc]) => <button key={key} disabled={!active || busy || count(key) < 1 || (key==="healing_potion" && !lowestHero)} onClick={() => useConsumable(key)}>
          <ItemArt itemKey={key}/><b>x{count(key)}</b><strong>{label}</strong><small>{desc}</small>
        </button>)}
      </div>
      <div className="battle-actions">
        {active ? <><button className="action-button blue" disabled={busy} onClick={() => act({type:"battle-auto",expeditionId:expedition.id})}>Concluir combate</button><button className="action-button red" disabled={busy} onClick={() => act({type:"battle-retreat",expeditionId:expedition.id})}>Retirar equipe</button></> : <button className="action-button green huge" onClick={close}>Voltar à guilda</button>}
      </div>
    </section>
  </div>;
}

export default function Game() {
  const [save,setSave] = useState<Save | null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [flash,setFlash] = useState("");
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
  const { musicEnabled, toggleMusic } = useAmbientRpgMusic();

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
      if (result.conflict) setFlash("A campanha mudou em outra aba. Estado atualizado.");
      else {
        const names: Partial<Record<Action["type"],string>> = {
          mission:"Expedição enviada.", rest:"Guilda descansada.", "train-hero":"Treino concluído.",
          hire:"Novo herói recrutado.", buy:"Item comprado.", sell:"Item vendido.", equip:"Item equipado.",
          unequip:"Item guardado.", "upgrade-hq":"Construção melhorada.", craft:"Item fabricado.",
          "rival-battle":"Desafio resolvido.", "guild-raid":"Raid resolvida.", "negotiate-rival":"Negociação concluída.",
          specialize:"Evolução aplicada.", "racial-specialize":"Evolução racial aplicada.", "story-step":"História avançou."
        };
        setFlash(names[action.type] || "Ação concluída.");
      }
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
    if (!state || !running.length || busy) return;
    const nextAt = Math.min(...running.map(e=>e.nextRoundAt));
    const wait = Math.max(100,Math.min(5000,nextAt-Date.now()+50));
    const timer = window.setTimeout(() => perform({type:"expedition-tick",now:Date.now()}),wait);
    return () => window.clearTimeout(timer);
  },[save?.revision,busy,running.map(e=>e.nextRoundAt).join(","),perform]);

  if (!state) return <main className="boot-screen"><Crown /><h1>Crônicas da Guilda</h1><p>{error || "Abrindo sua campanha…"}</p></main>;

  const allMissions = [...missions(state), seasonBoss(state)].filter(Boolean) as Mission[];
  const selectedMission = allMissions.find(m=>m.id===selectedMissionId) || allMissions[0];
  const battleExpedition = battleExpeditionId ? state.expeditions.find(e=>e.id===battleExpeditionId) : undefined;

  const go = (s: Screen) => { setScreen(s); window.scrollTo({top:0,behavior:"smooth"}); };
  const downloadBackup = () => {
    const blob = new Blob([exportLocalCampaign()],{type:"application/json"});
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href=url; a.download="cronicas-da-guilda-backup.json"; a.click(); URL.revokeObjectURL(url);
  };
  const restore = async (file: File) => {
    try { const next = importLocalCampaign(await file.text()); hydrate({state:next.state,revision:next.revision}); setFlash("Backup restaurado."); }
    catch(e){ setError(e instanceof Error ? e.message : "Backup inválido."); }
  };

  return <div className="app-shell">
    <TopBar state={state} goGuild={() => go("guild")} musicEnabled={musicEnabled} toggleMusic={toggleMusic} />
    {screen !== "guild" && <TopNav screen={screen} go={go} />}
    {flash && <button className="flash" onClick={() => setFlash("")}><Check /> {flash}</button>}
    {error && <button className="error" onClick={() => setError("")}><X /> {error}</button>}
    <main className="game-content">
      {screen === "mission" && <MissionPage state={state} selectedId={selectedMission.id} selectMission={setSelectedMissionId} goTeam={() => go("team")} />}
      {screen === "team" && <TeamPage state={state} selectedMission={selectedMission} team={team} formation={formation} tactic={tactic} slot={slot} busy={busy} setTeam={setTeam} setFormation={setFormation} setTactic={setTactic} setSlot={setSlot} act={perform} openBattle={setBattleExpeditionId} />}
      {screen === "league" && <LeaguePage state={state} team={team} act={perform} busy={busy} />}
      {screen === "rest" && <RestPage state={state} act={perform} busy={busy} />}
      {screen === "heroes" && <HeroPage state={state} selectedId={selectedHeroId} selectHero={setSelectedHeroId} act={perform} busy={busy} />}
      {screen === "chest" && <ChestPage state={state} act={perform} busy={busy} />}
      {screen === "tavern" && <TavernPage state={state} act={perform} busy={busy} openMission={id => { setSelectedMissionId(id); go("mission"); }} />}
      {screen === "guild" && <GuildPage state={state} act={perform} busy={busy} onExport={downloadBackup} onImport={() => fileRef.current?.click()} onReset={() => { if (window.confirm("Reiniciar toda a campanha?")) perform({type:"reset"}); }} />}
    </main>
    <BottomNav screen={screen} go={go} />
    <input ref={fileRef} className="hidden-file" type="file" accept=".json,application/json" onChange={e => { const f=e.target.files?.[0]; if(f) void restore(f); e.currentTarget.value=""; }} />
    {battleExpedition && <BattleOverlay state={state} expedition={battleExpedition} act={perform} close={() => setBattleExpeditionId(null)} busy={busy} />}
  </div>;
}
