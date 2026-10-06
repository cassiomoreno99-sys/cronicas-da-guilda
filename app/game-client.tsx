"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Coins, Swords, Shield, Sparkles, Heart, Target, Sword, Trophy, Users, Tent, BookOpen, CircleHelp, LoaderCircle, HardDrive, Hammer, Crown, Check, X, Pencil, ScrollText, Flag, Skull, Trees, Pause, Play, Clock3, Archive, LockKeyhole, ChevronLeft, ChevronRight, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Toaster, toast } from "sonner";
import { CLASSES, RACES, heroRace, TACTICS, ITEMS, REGIONS, SPECIALIZATIONS, KIND_NAMES, missions, missionLocks, seasonBoss, battleActive, activeExpeditions, heroOnExpedition, heroStats, talentPoints, market, teamPower, rating, threshold, available, standings, payroll, rank, seasonDay, missionReadiness, trainingPlan, defaultFormationLine, formationValid, type Action, type BattleFighter, type Campaign, type Hero, type HeroClass, type HeroRace, type Tactic, type FormationLine } from "@/lib/game";
import { battleFrame, battleTimeline, advanceBattleClock, formatBattleClock, type PlaybackSpeed, type BattleEvent } from "@/lib/battle-playback";
import { portraitPosition } from "@/lib/portraits";
import { EventPanel, SeasonJourney, ChestAndShop, SpecializationPanel, RaceEvolutionPanel, HeroStoryPanel, JourneyPanel, HeroEquipment, BattleOrders, ItemIcon, IndividualTraining, ClassesGuide } from "./game-dynamics";
import { LeagueTable, RivalRecruitment } from "./guild-market";
import { exportLocalCampaign, importLocalCampaign, readLocalCampaign, updateLocalCampaign, type LocalSave } from "@/lib/local-save";

const fmt = (n: number) => n.toLocaleString("pt-BR");
function Energy({ hero }: { hero: Hero }) {
  return <div className={"energy " + (hero.energy < 40 ? "energy-low" : "")}><span>{hero.energy}%</span><Progress value={hero.energy} aria-label={"Energia de " + hero.name} /></div>;
}
function Portrait({ hero, large = false }: { hero: { id?: string; name: string; class?: HeroClass; race?: HeroRace }; large?: boolean }) {
  const race = hero.class ? heroRace({ id: hero.id || hero.name, name: hero.name, class: hero.class, race: hero.race }) : undefined;
  return <span role="img" aria-label={"Retrato de " + hero.name} className={"hero-portrait " + (large ? "portrait-large" : "")} style={{ backgroundPosition: portraitPosition(hero.name, hero.id, hero.class, race) }} />;
}
function enemyPortraitKey(name: string) {
  const n = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (n.includes("matriarca")) return "matriarch";
  if (n.includes("senhor da fronteira")) return "border_lord";
  if (n.includes("vigia")) return "watcher";
  if (n.includes("cavaleiro espectral")) return "spectral_knight";
  if (n.includes("guardiao de obsidiana")) return "obsidian_guardian";
  if (n.includes("guardiao antigo")) return "ancient_guardian";
  if (n.includes("guerreiro draco")) return "drake_warrior";
  if (n.includes("salteador draconico")) return "draconic_raider";
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
function EnemyPortrait({ name }: { name: string }) {
  const key = enemyPortraitKey(name);
  return <span className="enemy-portrait" role="img" aria-label={"Retrato de " + name}><img src={"/enemies/" + key + ".webp"} alt="" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/enemies/fallback.webp"; }} /></span>;
}
function FighterCard({ fighter, impact, elapsed }: { fighter: BattleFighter; impact?: BattleEvent; elapsed: number }) {
  const hit = impact?.log.targetId === fighter.id && elapsed - impact.at < 1.2;
  const healing = hit && impact?.log.kind === "heal";
  return <div className={"combatant " + (fighter.hp === 0 ? "combatant-fallen " : "") + (hit ? healing ? "combatant-healing" : "combatant-hit" : "")} data-side={fighter.side}>
    <div className="combatant-top">{fighter.side === "hero" ? <Portrait hero={fighter} /> : <EnemyPortrait name={fighter.name} />}<div><strong title={fighter.name}>{fighter.name}</strong><span>{fighter.hp === 0 ? fighter.side === "hero" ? "Fora de combate" : "Derrotado" : fighter.class ? CLASSES[fighter.class].name + (fighter.position ? " · " + (fighter.position === "front" ? "Frente" : "Retaguarda") : "") : "Inimigo"}</span></div>{hit && typeof impact?.log.amount === "number" && <span className={"combatant-impact " + (healing ? "impact-heal" : "")}>{healing ? "+" : "−"}{impact.log.amount}</span>}</div>
    <div className="combatant-life"><span>{fighter.hp} / {fighter.maxHp} PV</span><Progress value={fighter.hp / fighter.maxHp * 100} aria-label={"Vida de " + fighter.name} aria-valuetext={fighter.hp + " de " + fighter.maxHp + " pontos de vida"} /></div>
  </div>;
}
type Save = Pick<LocalSave, "state" | "revision">;
type Confirm = { type: "release"; hero: Hero } | { type: "reset" } | null;

export default function Game() {
  const [save, setSave] = useState<Save | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("expeditions");
  const [mobileView, setMobileView] = useState("mission");
  const [guildView, setGuildView] = useState("summary");
  const [heroFilter, setHeroFilter] = useState("all");
  const [marketView, setMarketView] = useState("free");
  const [rivalGuildId, setRivalGuildId] = useState<string | null>(null);
  const [ledgerPage, setLedgerPage] = useState(0);
  const [battleView, setBattleView] = useState("combat");
  const [detailView, setDetailView] = useState("stats");
  const [team, setTeam] = useState<string[]>([]);
  const [formation, setFormation] = useState<Record<string, FormationLine>>({});
  const [tactic, setTactic] = useState<Tactic>("balanced");
  const [missionId, setMissionId] = useState("");
  const [heroId, setHeroId] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [battleOpen, setBattleOpen] = useState(false);
  const [activeExpeditionId, setActiveExpeditionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState<PlaybackSpeed>(1);
  const [watchingBattle, setWatchingBattle] = useState(false);
  const [guildName, setGuildName] = useState("");
  const saveRef = useRef(save);
  const lock = useRef(false);
  const battleScroll = useRef<HTMLDivElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  saveRef.current = save;

  const hydrateSave = useCallback((body: Save) => {
    setSave(body); saveRef.current = body; setTeam(body.state.team); setFormation(body.state.formation || {}); setTactic(body.state.tactic); setGuildName(body.state.name);
    const firstActive = activeExpeditions(body.state)[0];
    if (firstActive) { setActiveExpeditionId(firstActive.id); setElapsed(battleTimeline(firstActive.battle).availableUntil); setWatchingBattle(true); }
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      hydrateSave(readLocalCampaign());
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível abrir o save local."); }
    finally { setLoading(false); }
  }, [hydrateSave]);
  useEffect(() => { void load(); }, [load]);
  const state = save?.state;
  const runningExpeditions = state ? activeExpeditions(state) : [];
  const expeditionBatch = state ? state.expeditions.filter(e => e.battle.status === "active" || e.startedDay === state.day).slice(-3) : [];
  const selectedExpedition = state ? state.expeditions.find(e => e.id === activeExpeditionId) || runningExpeditions[0] || state.expeditions[state.expeditions.length - 1] : undefined;
  const active = selectedExpedition?.battle.status === "active" && !!selectedExpedition.battle.combat;
  const blocked = busy;
  const board = state ? missions(state) : [];
  const boss = state ? seasonBoss(state) : null;
  const selectedMission = [...board, ...(boss ? [boss] : [])].find(m => m.id === missionId) || board[0];
  const selectedLocks = state && selectedMission ? missionLocks(state, selectedMission) : [];
  const detail = state?.heroes.find(h => h.id === heroId);
  const detailStats = detail && state ? heroStats(detail, state) : null;
  const battle = selectedExpedition?.battle || state?.lastBattle;
  const frame = useMemo(() => battleFrame(battle, elapsed), [battle, elapsed]);
  const resultReady = frame.ready;
  const shown = frame.shown;
  useEffect(() => { if (resultReady) setBattleView("result"); }, [resultReady]);
  useEffect(() => {
    if (state) setMissionId(old => [...missions(state), seasonBoss(state)].some(m => m?.id === old && !missionLocks(state, m).length) ? old : missions(state)[0].id);
  }, [state?.day, state?.season, state?.fame, state?.chest.length]);

  const perform = useCallback(async (action: Action): Promise<Save> => {
    const current = saveRef.current;
    if (!current || lock.current) throw new Error("Aguarde a ação em andamento.");
    lock.current = true; setBusy(true); setError("");
    try {
      const result = updateLocalCampaign(current.revision, action);
      const body: Save = { state: result.state, revision: result.revision };
      if (result.conflict) {
        setSave(body); saveRef.current = body; setTeam(body.state.team); setFormation(body.state.formation || {}); setTactic(body.state.tactic); setWatchingBattle(false); setBattleOpen(false); setElapsed(0); setPaused(false);
        throw new Error("A campanha foi atualizada em outra aba. Confira a equipe e tente novamente.");
      }
      setSave(body); saveRef.current = body;
      if (["mission", "train", "release", "reset", "event"].includes(action.type)) { setTeam(body.state.team); setFormation(body.state.formation || {}); setTactic(body.state.tactic); }
      if (action.type === "mission") {
        const newest = body.state.expeditions[body.state.expeditions.length - 1];
        if (newest) setActiveExpeditionId(newest.id);
        setElapsed(0); setPaused(false); setBattleSpeed(1); setWatchingBattle(true); setBattleOpen(false); setBattleView("combat");
        toast.success("Expedição enviada. Ela continuará em segundo plano enquanto você usa a guilda.");
      }
      else if (action.type === "rest") toast.success("Equipe descansada. Um novo dia começou.");
      else if (action.type === "train-hero") { const h = current.state.heroes.find(h => h.id === action.heroId)!; toast.success(h.name + " treinou: +" + trainingPlan(current.state, h).xp + " XP."); }
      else if (action.type === "train") toast.success("Treino concluído: +65 XP para cada herói escalado.");
      else if (action.type === "hire") toast.success("Herói recrutado para a guilda.");
      else if (action.type === "negotiate-rival") { const report = body.state.lastNegotiation!; if (report.success) toast.success(report.heroName + " entrou para sua guilda."); else toast(report.heroName + " recusou a proposta."); }
      else if (action.type === "upgrade") toast.success("Arsenal ampliado. Toda a guilda ficou mais forte.");
      else if (action.type === "rename") toast.success("Nome da guilda atualizado.");
      else if (action.type === "reset") { setWatchingBattle(false); setBattleOpen(false); setElapsed(0); setPaused(false); setGuildName(body.state.name); setView("expeditions"); toast.success("Sua nova campanha começou."); }
      else if (action.type === "battle-auto") {
        const exp = body.state.expeditions.find(e => e.id === action.expeditionId);
        setElapsed(battleTimeline(exp?.battle || body.state.lastBattle).duration); setPaused(false);
      }
      else if (action.type === "battle-retreat") {
        const exp = body.state.expeditions.find(e => e.id === action.expeditionId);
        setElapsed(battleTimeline(exp?.battle || body.state.lastBattle).duration); setPaused(false); toast("A equipe foi retirada. Confira o relatório.");
      }
      else if (action.type === "battle-tactic") toast.success("A nova tática será usada no próximo turno.");
      else if (action.type === "battle-potion") toast.success("Poção reservada para o próximo turno.");
      else if (action.type === "event") toast.success("Decisão registrada no conselho.");
      else if (action.type === "equip") toast.success("Equipamento entregue ao herói.");
      else if (action.type === "unequip") toast.success("Item guardado no baú.");
      else if (action.type === "sell") toast.success("Item vendido. Ouro adicionado ao tesouro.");
      else if (action.type === "buy") toast.success("Item comprado e guardado no baú.");
      else if (action.type === "specialize") toast.success("Especialização desenvolvida.");
      else if (action.type === "release") toast.success("Contrato transferido.");
      return body;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Não foi possível salvar. Tente novamente.";
      setError(message); toast.error(message); throw e;
    } finally { lock.current = false; setBusy(false); }
  }, []);
  const act = (action: Action) => { void perform(action).catch(() => {}); };
  const performRef = useRef(perform); performRef.current = perform;

  useEffect(() => {
    if (!battleOpen || !battle || paused || resultReady) return;
    let previous = performance.now();
    const duration = frame.clockLimit;
    const timer = window.setInterval(() => {
      const now = performance.now(), delta = (now - previous) / 1000;
      previous = now;
      setElapsed(seconds => advanceBattleClock(seconds, delta, battleSpeed, duration));
    }, 200);
    return () => clearInterval(timer);
  }, [battleOpen, battle, paused, battleSpeed, resultReady, frame.clockLimit]);

  useEffect(() => {
    if (!state || !runningExpeditions.length || busy || lock.current) return;
    const nextAt = Math.min(...runningExpeditions.map(e => e.nextRoundAt));
    const wait = Math.max(100, Math.min(5000, nextAt - Date.now() + 40));
    const timer = window.setTimeout(() => {
      if (!lock.current) void perform({ type: "expedition-tick", now: Date.now() }).catch(() => {});
    }, wait);
    return () => window.clearTimeout(timer);
  }, [save?.revision, busy, perform, runningExpeditions.length, runningExpeditions.map(e => e.nextRoundAt).join(",")]);

  useEffect(() => {
    if (!battleOpen || !battle) return;
    const limit = battleTimeline(battle).availableUntil;
    if (limit > elapsed && !paused) setElapsed(limit);
  }, [battle?.rounds, battle?.status, battleOpen]);

  useEffect(() => { if (battleScroll.current) battleScroll.current.scrollTop = battleScroll.current.scrollHeight; }, [shown]);
  useEffect(() => {
    type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown };
    const context = (document as Document & { modelContext?: { registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools: Tool[] = [
      { name: "read_guild_campaign", title: "Ler a campanha da guilda", description: "Retorna a guilda, heróis disponíveis e missões do dia. Não altera a campanha.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: () => {
        const s = saveRef.current?.state; if (!s) throw new Error("A campanha ainda não carregou.");
        return { name: s.name, day: s.day, gold: s.gold, fame: s.fame, team: s.team, tactic: s.tactic, event: s.event, chest: s.chest, activeBattle: battleActive(s), battle: s.lastBattle ? { status: s.lastBattle.status, rounds: s.lastBattle.rounds, fighters: s.lastBattle.combat?.fighters, potionsUsed: s.lastBattle.combat?.potionsUsed } : null, heroes: s.heroes.map(h => ({ id: h.id, name: h.name, class: h.class, energy: h.energy, available: available(h, s) })), missions: missions(s).map(m => ({ ...m, locks: missionLocks(s, m) })), boss: seasonBoss(s) };
      } },
      { name: "resolve_guild_event", title: "Resolver evento da guilda", description: "Aplica uma escolha do conselho, salva seus efeitos e libera o avanço do dia. Use os IDs retornados pela leitura da campanha.", inputSchema: { type: "object", properties: { eventId: { type: "string" }, choiceId: { type: "string" } }, required: ["eventId", "choiceId"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: async input => {
        const a = input as { eventId: string; choiceId: string };
        if (!a || typeof a.eventId !== "string" || typeof a.choiceId !== "string") throw new Error("Informe o evento e a escolha.");
        const result = await performRef.current({ type: "event", eventId: a.eventId, choiceId: a.choiceId });
        return { gold: result.state.gold, fame: result.state.fame, heroes: result.state.heroes.map(h => ({ id: h.id, salary: h.salary, energy: h.energy })), chest: result.state.chest };
      } },
      { name: "command_guild_battle", title: "Dar uma ordem na batalha", description: "Muda a tática do próximo turno, reserva uma poção ou ordena retirada e salva a decisão na batalha em andamento.", inputSchema: { type: "object", properties: { order: { type: "string", enum: ["tactic", "potion", "retreat"] }, tactic: { type: "string", enum: ["balanced", "aggressive", "defensive"] }, heroId: { type: "string" } }, required: ["order"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: async input => {
        const a = input as { order: string; tactic?: Tactic; heroId?: string };
        let command: Action;
        if (a?.order === "tactic" && a.tactic && Object.hasOwn(TACTICS, a.tactic)) command = { type: "battle-tactic", tactic: a.tactic };
        else if (a?.order === "potion" && typeof a.heroId === "string") command = { type: "battle-potion", heroId: a.heroId };
        else if (a?.order === "retreat") command = { type: "battle-retreat" };
        else throw new Error("Informe uma ordem e seus dados.");
        const result = await performRef.current(command);
        return { status: result.state.lastBattle?.status, tactic: result.state.tactic, gold: result.state.gold, fame: result.state.fame };
      } },
      { name: "simulate_guild_expedition", title: "Simular expedição", description: "Envia 3 ou 4 heróis a uma missão disponível. A guilda pode manter até três expedições simultâneas.", inputSchema: { type: "object", properties: { missionId: { type: "string" }, team: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 4, uniqueItems: true }, tactic: { type: "string", enum: ["balanced", "aggressive", "defensive"] } }, required: ["missionId", "team", "tactic"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: async input => {
        const a = input as { missionId: string; team: string[]; tactic: Tactic };
        if (!a || typeof a.missionId !== "string" || !Array.isArray(a.team) || a.team.length < 3 || a.team.length > 4 || new Set(a.team).size !== a.team.length || !Object.hasOwn(TACTICS, a.tactic)) throw new Error("Informe uma missão, 3 ou 4 heróis e uma tática válida.");
        const launched = await performRef.current({ type: "mission", missionId: a.missionId, team: a.team, tactic: a.tactic, startedAt: Date.now() });
        const expeditionId = launched.state.expeditions[launched.state.expeditions.length - 1]?.id;
        const result = await performRef.current({ type: "battle-auto", expeditionId });
        return { day: result.state.day, gold: result.state.gold, battle: { title: result.state.lastBattle?.title, won: result.state.lastBattle?.won, reward: result.state.lastBattle?.reward } };
      } },
    ];
    for (const tool of tools) {
      try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch {}
    }
    return () => lifecycle.abort();
  }, []);

  function toggleTeamHero(h: Hero) {
    if (!state) return;
    if (team.includes(h.id)) { setTeam(team.filter(id => id !== h.id)); setFormation(old => { const next = { ...old }; delete next[h.id]; return next; }); return; }
    if (team.length >= 4 || !available(h, state)) return;
    const nextTeam = [...team, h.id], nextFormation: Record<string, FormationLine> = { ...formation, [h.id]: state.formation?.[h.id] || defaultFormationLine(h.class) };
    for (const id of nextTeam) { const hero = state.heroes.find(x => x.id === id); if (hero && !nextFormation[id]) nextFormation[id] = state.formation?.[id] || defaultFormationLine(hero.class); }
    if (nextTeam.length >= 3 && !formationValid(nextTeam, nextFormation)) { nextFormation[nextTeam[0]] = "front"; nextFormation[nextTeam[nextTeam.length - 1]] = "back"; }
    setTeam(nextTeam); setFormation(nextFormation);
  }
  function changeFormation(heroId: string, line: FormationLine) {
    const next = { ...formation, [heroId]: line };
    if (team.length >= 3 && !formationValid(team, next)) { toast("Mantenha pelo menos um herói na frente e um na retaguarda."); return; }
    setFormation(next);
  }

  function roster(full = false) {
    if (!state) return null;
    const mobileHeroes = state.heroes.filter(h => !full || heroFilter === "all" || (heroFilter === "team" ? team.includes(h.id) : !team.includes(h.id)));
    return <><div className="desktop-roster"><Table className="hero-table">
      <TableHeader><TableRow><TableHead className="select-col"><span className="sr-only">Escalar</span></TableHead><TableHead>Aventureiro</TableHead><TableHead className="number-col">Nível</TableHead><TableHead className="number-col">Força</TableHead><TableHead>Energia</TableHead>{full && <TableHead className="mobile-hide">Salário / semana</TableHead>}<TableHead><span className="sr-only">Detalhes</span></TableHead></TableRow></TableHeader>
      <TableBody>{state.heroes.map(h => {
        const selected = team.includes(h.id), ready = available(h, state), deployed = heroOnExpedition(state, h.id);
        return <TableRow key={h.id} data-selected={selected} data-deployed={deployed}>
          <TableCell className="select-col"><Checkbox id={"hero-" + h.id} checked={selected} disabled={blocked || (!selected && (!ready || team.length >= 4))} aria-label={(selected ? "Retirar " : "Escalar ") + h.name} onCheckedChange={() => toggleTeamHero(h)} /></TableCell>
          <TableCell><div className="hero-name"><Portrait hero={h} /><div><label htmlFor={"hero-" + h.id}>{h.name}</label><span>{CLASSES[h.class].name} · {RACES[heroRace(h)].name}{deployed ? " · Em expedição" : h.injuredUntil > state.day ? " · Ferido por " + (h.injuredUntil - state.day) + " dia(s)" : selected ? " · Escalado" : " · Reserva"}</span></div></div></TableCell>
          <TableCell className="number-col">{h.level}{talentPoints(h) > 0 && <span className="talent-available" title="Ponto de especialização disponível">✦</span>}</TableCell><TableCell className="number-col rating">{rating(h, state.arsenal, state)}</TableCell><TableCell><Energy hero={h} /></TableCell>
          {full && <TableCell className="mobile-hide">{h.salary} <span className="muted">ouro</span></TableCell>}
          <TableCell><Button variant="ghost" size="sm" className="details-button" onClick={() => { setHeroId(h.id); setDetailView("stats"); }} aria-label={"Ver detalhes de " + h.name}>Ver</Button></TableCell>
        </TableRow>;
      })}</TableBody>
    </Table></div><div className="mobile-roster">{full && <ToggleGroup className="compact-nav" type="single" value={heroFilter} onValueChange={v => { if (v) setHeroFilter(v); }} aria-label="Filtrar heróis"><ToggleGroupItem value="all">Todos</ToggleGroupItem><ToggleGroupItem value="team">Equipe</ToggleGroupItem><ToggleGroupItem value="reserves">Reservas</ToggleGroupItem></ToggleGroup>}{mobileHeroes.map(h => {
      const selected = team.includes(h.id), ready = available(h, state), deployed = heroOnExpedition(state, h.id);
      return <div className="mobile-hero" data-selected={selected} data-deployed={deployed} key={h.id}><label className="mobile-hero-select"><Checkbox checked={selected} disabled={blocked || (!selected && (!ready || team.length >= 4))} aria-label={(selected ? "Retirar " : "Escalar ") + h.name} onCheckedChange={() => toggleTeamHero(h)} /><Portrait hero={h} /></label><div className="mobile-hero-info"><strong>{h.name}{talentPoints(h) > 0 && <span className="talent-available"> ✦</span>}</strong><span>{CLASSES[h.class].name} · {RACES[heroRace(h)].name} · Nv. {h.level} · Força {rating(h, state.arsenal, state)}</span><Energy hero={h} />{deployed ? <small className="expedition-status">⚔ Em expedição</small> : h.injuredUntil > state.day && <small className="negative">Ferido: {h.injuredUntil - state.day} dia(s)</small>}</div><Button variant="ghost" aria-label={"Detalhes de " + h.name} onClick={() => { setHeroId(h.id); setDetailView("stats"); }}><ChevronRight /></Button></div>;
    })}{!mobileHeroes.length && <p className="roster-empty">Nenhum herói nesta categoria.</p>}</div></>;
  }
  const teamReady = !!state && team.length >= 3 && team.length <= 4 && team.every(id => state.heroes.some(h => h.id === id && available(h, state)));
  const formationReady = teamReady && formationValid(team, formation);
  const frontCount = team.filter(id => formation[id] === "front").length, backCount = team.filter(id => formation[id] === "back").length;
  const power = state ? teamPower(state, team) : 0;
  const lackHealer = state && !state.heroes.some(h => team.includes(h.id) && (["healer", "druid"].includes(h.class) || h.talent?.path === "healing" || h.class === "paladin" && h.talent?.path === "defense"));
  const ranking = state ? standings(state) : [];
  const leaguePlace = ranking.findIndex(r => r.id === "player") + 1;
  const readiness = state && selectedMission ? missionReadiness(state, selectedMission, team) : null;
  const ledgerPages = Math.max(1, Math.ceil((state?.ledger.length || 0) / 10));
  const currentLedgerPage = Math.min(ledgerPage, ledgerPages - 1);

  function downloadBackup() {
    const current = saveRef.current;
    if (!current) return;
    const payload = exportLocalCampaign({ ...current, updatedAt: new Date().toISOString(), format: 1 });
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cronicas-da-guilda-backup-dia-${current.state.day}.json`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    toast.success("Backup baixado. Guarde esse arquivo fora do navegador.");
  }

  async function restoreBackup(file: File) {
    try {
      if (file.size > 2_000_000) throw new Error("O arquivo é grande demais para ser um save do jogo.");
      const restored = importLocalCampaign(await file.text());
      hydrateSave(restored);
      setWatchingBattle(false); setBattleOpen(false); setElapsed(0); setPaused(false); setView("guild");
      toast.success("Backup importado. Sua campanha foi restaurada neste aparelho.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível importar o backup."); }
    finally { if (backupInput.current) backupInput.current.value = ""; }
  }

  function navigate(value: string) {
    setView(value);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches) window.scrollTo({ top: 0, behavior: "instant" });
  }
  function openBattle(expeditionId?: string) {
    const expedition = expeditionId && state ? state.expeditions.find(e => e.id === expeditionId) : selectedExpedition;
    const targetBattle = expedition?.battle || battle;
    if (!targetBattle) return;
    if (expedition) setActiveExpeditionId(expedition.id);
    setElapsed(targetBattle.status === "active" ? battleTimeline(targetBattle).availableUntil : battleTimeline(targetBattle).duration);
    setWatchingBattle(true); setPaused(false); setBattleOpen(true); setBattleView(targetBattle.status === "active" ? "combat" : "result");
  }
  function battleAct(action: Action) {
    if (selectedExpedition && action.type.startsWith("battle-")) act({ ...action, expeditionId: selectedExpedition.id } as Action);
    else act(action);
  }

  return <div className="game">
    <Toaster theme="dark" position="bottom-right" richColors />
    <header className="topbar"><div className="topbar-inner">
      <div className="brand"><div className="brand-mark"><Shield strokeWidth={1.5} /><Sword strokeWidth={1.5} /></div><div><span className="eyebrow">SIMULADOR DE GUILDA</span><span className="brand-title">Crônicas da Guilda</span></div></div>
      <div className="header-tools"><span className="version">v1.2.4 · EXPEDIÇÕES PARALELAS</span><Button variant="ghost" size="sm" className="help-button" aria-label="Como jogar" onClick={() => setHelp(true)}><CircleHelp /> <span>Como jogar</span></Button></div>
    </div></header>
    {!state ? <main className="loading-screen"><Shield size={42} /><h1>{loading ? "Abrindo o salão da guilda…" : "Não foi possível abrir o save"}</h1><p role="status">{loading ? "Carregando sua campanha deste aparelho." : error}</p>{!loading && <Button onClick={() => void load()}>Tentar novamente</Button>}</main> : <main className="workspace">
      <div className="guild-heading"><div><span className="eyebrow">SALÃO DO COMANDANTE</span><h1>{state.name}</h1></div><span className="save-status" role="status">{busy ? <><LoaderCircle className="spin" /> Salvando…</> : <><HardDrive /> Salvo neste aparelho</>}</span></div>
      <div className="resources">
        <div className="resource"><Coins /><div><span>Tesouro</span><strong>{fmt(state.gold)} <small>ouro</small></strong></div></div>
        <div className="resource"><Flag /><div><span>Renome</span><strong>{state.fame} <small>renome</small></strong></div></div>
        <div className="resource"><Trophy /><div><span>Liga</span><strong>{leaguePlace}º <small>de {ranking.length} guildas</small></strong></div></div>
        <div className="resource"><Tent /><div><span><span className="desktop-label">Temporada {state.season}</span><span className="mobile-label">T{state.season}</span></span><strong>Dia {seasonDay(state)} <small>/ 28</small></strong></div></div>
      </div>
      {error && <div className="error-banner" role="alert"><span>{error}</span><Button variant="ghost" size="icon" onClick={() => setError("")} aria-label="Fechar aviso"><X /></Button></div>}
      <EventPanel state={state} disabled={blocked} act={act} />
      {expeditionBatch.length > 0 && <section className="expedition-dock" aria-label="Expedições da guilda"><div className="expedition-dock-heading"><div><span className="eyebrow">CENTRAL DE EXPEDIÇÕES</span><strong>{runningExpeditions.length} / 3 equipes em campo</strong></div><span>A guilda continua funcionando</span></div><div className="expedition-dock-grid">{expeditionBatch.map(exp => <button key={exp.id} className="expedition-mini-card" data-status={exp.battle.status || "active"} onClick={() => openBattle(exp.id)}><span className="expedition-mini-icon">{exp.battle.status === "active" ? <Swords /> : exp.battle.won ? <Trophy /> : <Shield />}</span><span className="expedition-mini-copy"><strong>{exp.battle.title}</strong><small>{exp.battle.status === "active" ? "Turno " + exp.battle.rounds + " · em andamento" : exp.battle.won ? "Vitória · ver relatório" : exp.battle.status === "retreated" ? "Retirada · ver relatório" : "Encerrada · ver relatório"}</small></span><span className="expedition-mini-team">{exp.team.map(id => { const h = state.heroes.find(hero => hero.id === id); return h ? <Portrait key={id} hero={h} /> : null; })}</span><ChevronRight /></button>)}</div><p className="expedition-dock-note">Você pode abrir Heróis, Baú, Taverna e Guilda enquanto as equipes lutam. Heróis em campo ficam indisponíveis para outra expedição.</p></section>}
      <Tabs value={view} onValueChange={navigate} className="game-tabs">
        <TabsList variant="line" className="main-tabs" aria-label="Navegação da guilda"><TabsTrigger value="expeditions"><Swords /><span className="desktop-label">Expedições</span><span className="mobile-label">Missões</span></TabsTrigger><TabsTrigger value="heroes"><Users />Heróis <span className="tab-count">{state.heroes.length}</span></TabsTrigger><TabsTrigger value="inventory"><Archive /><span className="desktop-label">Baú e mercador</span><span className="mobile-label">Baú</span></TabsTrigger><TabsTrigger value="market"><ScrollText /><span className="desktop-label">Recrutamento</span><span className="mobile-label">Taverna</span></TabsTrigger><TabsTrigger value="guild"><Crown />Guilda</TabsTrigger></TabsList>
        <TabsContent value="expeditions">
          <ToggleGroup className="compact-nav mobile-subnav" type="single" value={mobileView} onValueChange={v => { if (v) { setMobileView(v); window.scrollTo({ top: 0, behavior: "instant" }); } }} aria-label="Painéis da expedição"><ToggleGroupItem value="mission"><Swords />Missão</ToggleGroupItem><ToggleGroupItem value="team"><Users />Equipe</ToggleGroupItem><ToggleGroupItem value="league"><Trophy />Liga</ToggleGroupItem><ToggleGroupItem value="camp"><Tent />Descanso</ToggleGroupItem></ToggleGroup>
          <div className="command-grid" data-mobile-view={mobileView}><div className="main-column">
            <section className="mission-section"><div className="section-heading"><div><span className="eyebrow">QUADRO DE CONTRATOS · {REGIONS[state.region - 1]}</span><h2>Escolha sua expedição</h2></div><span className="subtle-chip">{board.filter(m => !missionLocks(state, m).length).length} liberadas / 5</span></div>
              <div className="mobile-mission-picker"><RadioGroup value={selectedMission?.id} onValueChange={setMissionId} className="mission-levels" aria-label="Dificuldade da missão" disabled={blocked}>{board.map(m => <label key={m.id} data-chosen={selectedMission?.id === m.id} htmlFor={"mobile-" + m.id}><RadioGroupItem value={m.id} id={"mobile-" + m.id} className="sr-only" /><span>{missionLocks(state, m).length ? <LockKeyhole size={14} /> : "0" + m.rank}</span><strong>{["", "Rotina", "Desafio", "Épica", "Secreta", "Lendária"][m.rank]}</strong></label>)}</RadioGroup>{selectedMission && <section className="mobile-mission-detail"><span className="location">{KIND_NAMES[selectedMission.kind]} · {selectedMission.location}</span><h3>{selectedMission.title}</h3><p>{selectedMission.description}</p><div className="mission-footer"><span><Swords />{selectedMission.force} <small>força</small></span><strong><Coins />{fmt(selectedMission.reward)} ouro</strong></div>{selectedLocks.length > 0 ? <p className="mission-lock-note"><LockKeyhole size={16} />Exige {selectedLocks.join(" + ")}</p> : readiness && <p className={"readiness readiness-" + readiness.level}><Shield size={16} />{readiness.label}<span>{readiness.hint}</span></p>}</section>}<button className="team-preview" onClick={() => setMobileView("team")}><span className="team-portraits">{state.heroes.filter(h => team.includes(h.id)).map(h => <Portrait key={h.id} hero={h} />)}</span><span><strong>Equipe {team.length}/3–4 · Força {power}</strong><small>{runningExpeditions.length}/3 expedições ativas · trocar equipe</small></span><ChevronRight /></button></div>
              <RadioGroup value={selectedMission?.id} onValueChange={setMissionId} className="mission-grid desktop-mission-grid" aria-label="Missão da expedição" disabled={blocked}>
                {board.map(m => { const Icon = m.enemy === "Esqueleto" ? Skull : m.enemy === "Lobo sombrio" ? Trees : m.kind === "defense" ? Shield : Swords, locks = missionLocks(state, m); return <label key={m.id} htmlFor={m.id} className="mission-card" data-chosen={selectedMission?.id === m.id} data-locked={locks.length > 0}>
                  <div className="mission-top"><span className={"difficulty difficulty-" + m.rank}>{["", "ROTINA", "DESAFIO", "ÉPICA", "SECRETA", "LENDÁRIA"][m.rank]}</span>{locks.length > 0 && <LockKeyhole size={16} />}<RadioGroupItem value={m.id} id={m.id} aria-label={m.title} disabled={blocked || locks.length > 0} /></div>
                  <div className="mission-emblem"><Icon strokeWidth={1.2} /><span>{"0" + m.rank}</span></div><span className="location">{KIND_NAMES[m.kind]} · {m.location}</span><h3>{m.title}</h3><p>{m.description}</p>
                  <div className="mission-footer"><span><Swords />{m.force} <small>força</small></span><strong><Coins />{fmt(m.reward)}</strong></div>
                  {m.requiredItem && <div className="mission-requirements"><span><Flag />{m.requiredFame} renome</span><span><ItemIcon itemKey={m.requiredItem} />{ITEMS[m.requiredItem].name}</span><small>{locks.length ? "Bloqueada: " + locks.join(" + ") : "Requisitos cumpridos · item permanece no baú"}</small></div>}
                </label>; })}
              </RadioGroup>
              {readiness && <p className={"desktop-readiness readiness readiness-" + readiness.level}><Shield size={16} />{readiness.label}<span>{readiness.hint}</span></p>}
            </section>
            <section className="panel roster-panel"><div className="panel-heading"><div><h2>Equipe da expedição</h2><p>Escolha quatro heróis. As reservas recuperam energia.</p></div><span className={"team-count " + (team.length === 4 ? "complete" : "")}>{team.length} / 4</span></div>{roster()}
              <div className="roster-footer"><span><Shield />Força da equipe <strong>{power}</strong></span><span className="muted">Energia mínima: 25%</span></div>
            </section>
            <section className="panel strategy-panel"><div className="panel-heading"><div><h2>Plano de batalha</h2><p>{selectedMission?.flavor}</p></div><span className="subtle-chip">Combate 2.0</span></div>
              <div className="formation-editor"><div className="formation-heading"><div><h3>Formação</h3><p>A frente recebe +10% de defesa e segura a maior parte dos ataques. A retaguarda recebe +6% de ataque/magia, mas flanqueadores podem alcançá-la.</p></div><span>{frontCount} frente · {backCount} retaguarda</span></div><div className="formation-list">{state.heroes.filter(h => team.includes(h.id)).map(h => <div className="formation-hero" key={h.id}><div className="formation-hero-name"><Portrait hero={h} /><span><strong>{h.name}</strong><small>{CLASSES[h.class].name} · {RACES[heroRace(h)].name}</small></span></div><ToggleGroup type="single" value={formation[h.id] || defaultFormationLine(h.class)} onValueChange={v => { if (v) changeFormation(h.id, v as FormationLine); }} variant="outline" disabled={blocked} aria-label={"Posição de " + h.name}><ToggleGroupItem value="front"><Shield />Frente</ToggleGroupItem><ToggleGroupItem value="back"><Target />Retaguarda</ToggleGroupItem></ToggleGroup></div>)}</div>{team.length < 3 && <p className="formation-note">Escale pelo menos três heróis para formar uma equipe.</p>}{team.length >= 3 && !formationReady && <p className="team-warning">A formação precisa ter ao menos um herói em cada linha.</p>}</div>
              <RadioGroup value={tactic} onValueChange={v => setTactic(v as Tactic)} className="tactic-grid" aria-label="Tática da equipe" disabled={blocked}>
                {(Object.keys(TACTICS) as Tactic[]).map(t => <label key={t} htmlFor={"tactic-" + t} className="tactic-card" data-chosen={tactic === t}><RadioGroupItem value={t} id={"tactic-" + t} /><div><strong>{TACTICS[t].name}</strong><span>{TACTICS[t].description}</span></div></label>)}
              </RadioGroup>
              {(!teamReady || lackHealer) && <p className="team-warning">{!teamReady ? "Escale 3 ou 4 heróis disponíveis para partir." : "Sem cura: inclua uma curandeira, druida ou herói com caminho de cura."}</p>}
              <p className="mobile-tactic-description">{TACTICS[tactic].description}</p>
              {state.event && <p className="team-warning">Resolva a decisão do conselho para partir.</p>}
              <div className="launch-row"><div><span className="eyebrow">DESTINO SELECIONADO</span><strong>{selectedMission?.title}</strong><span className="muted">{selectedLocks.length ? "Contrato bloqueado" : state.event ? "Conselho pendente" : !formationReady ? "Complete a equipe e a formação" : "Derrota: −" + (selectedMission ? 6 + selectedMission.rank * 3 : 0) + " renome"}</span></div><Button className="primary-launch" size="lg" disabled={blocked || !formationReady || !!state.event || selectedLocks.length > 0} onClick={() => selectedMission && act({ type: "mission", missionId: selectedMission.id, team, tactic, formation, startedAt: Date.now() })}>{busy ? <LoaderCircle className="spin" /> : <Swords />}<span className="desktop-label">Iniciar expedição</span><span className="mobile-label">Partir</span></Button></div>
            </section>
          </div>
          <aside className="side-column">
            <SeasonJourney state={state} disabled={blocked} selectBoss={id => { setMissionId(id); setMobileView("mission"); if (window.matchMedia("(max-width: 760px)").matches) window.scrollTo({ top: 0 }); else document.querySelector(".strategy-panel")?.scrollIntoView({ block: "start" }); }} selected={selectedMission?.id || ""} />
            <JourneyPanel state={state} disabled={blocked} act={act} />
            <LeagueTable state={state} openGuild={id => { setMarketView("rivals"); setRivalGuildId(id); navigate("market"); }} />
            <section className="panel camp-panel"><div className="panel-heading"><h2>Acampamento</h2><Tent /></div><p>Uma equipe exausta perde força. Prepare seus heróis antes da próxima missão.</p>
              <Button variant="outline" disabled={blocked || !!state.event} onClick={() => act({ type: "rest" })}><Tent />Descansar a guilda<span>+40 energia</span></Button><Button variant="outline" disabled={blocked || !!state.event || !teamReady || state.gold < 200} onClick={() => act({ type: "train", team, tactic })}><Target />Treinar equipe<span>200 ouro</span></Button><IndividualTraining state={state} disabled={blocked} act={act} /><p className="camp-note">Cada ação avança 1 dia. Treino em equipe: +65 XP por herói. Treino individual: 90 XP mais bônus para heróis de nível baixo.</p>
            </section>
            <section className="council-note"><BookOpen /><div><span className="eyebrow">ÚLTIMA NOTÍCIA</span><p>{state.journal[0]?.text}</p>{battle && <Button variant="link" onClick={openBattle}>{active || watchingBattle && !resultReady ? "Continuar batalha" : "Ver última batalha"}</Button>}</div></section>
          </aside></div>
        </TabsContent>
        <TabsContent value="inventory"><ChestAndShop state={state} disabled={blocked} act={act} /></TabsContent>
        <TabsContent value="heroes"><div className="section-heading"><div><span className="eyebrow">ELENCO DA GUILDA</span><h2>Seus aventureiros</h2><p>Consulte atributos, acompanhe a evolução e ajuste sua equipe.</p></div><span className="subtle-chip">{state.heroes.length} / 12 contratos</span></div>
          <section className="panel roster-panel">{roster(true)}<div className="roster-footer"><span><Users />{team.length} heróis escalados · Força {power}</span><Button variant="outline" onClick={() => navigate("expeditions")}>Preparar expedição</Button></div></section>
          <div className="hero-guidance"><Heart /><p>A cura acontece durante a batalha. Fora dela, vida é restaurada automaticamente; energia e ferimentos exigem descanso ou rotação da equipe.</p></div>
        </TabsContent>
        <TabsContent value="market"><div className="section-heading"><div><span className="eyebrow">TAVERNA DE VALEN</span><h2>Recrute novos talentos</h2><p>{marketView === "free" ? "Novos contratos a cada sete dias. Cada herói recebe um salário semanal." : "Dispute aventureiros com as outras 99 guildas."}</p></div><span className="subtle-chip">Renovação em {7 - ((state.day - 1) % 7)} dias</span></div>
          <ToggleGroup className="compact-nav market-switch" type="single" value={marketView} onValueChange={v => { if (v) setMarketView(v); }} aria-label="Mercado de aventureiros"><ToggleGroupItem value="free"><ScrollText />Sem contrato</ToggleGroupItem><ToggleGroupItem value="rivals"><Flag />Guildas rivais</ToggleGroupItem></ToggleGroup>
          {marketView === "rivals" ? <RivalRecruitment state={state} disabled={blocked} act={act} selectedGuildId={rivalGuildId} selectGuild={setRivalGuildId} /> : <><ClassesGuide /><div className="recruit-grid">{market(state).map(h => <section key={h.id} className="panel recruit-card"><div className="recruit-top"><Portrait hero={h} large /><span className="subtle-chip">NÍVEL {h.level}</span></div><span className="location">{CLASSES[h.class].name} · {RACES[heroRace(h)].name} · {h.trait}</span><h3>{h.name}</h3><p>{CLASSES[h.class].description}</p><div className="recruit-stats"><span><Sword />{h.attack}<small>Ataque</small></span><span><Shield />{h.defense}<small>Defesa</small></span><span><Sparkles />{h.magic}<small>Magia</small></span></div><div className="recruit-salary"><span>Salário semanal</span><strong>{h.salary} ouro</strong></div><Button disabled={blocked || state.gold < h.value || state.heroes.length >= 12} onClick={() => act({ type: "hire", heroId: h.id })}><Check />Recrutar<span>{fmt(h.value)} ouro</span></Button>{state.gold < h.value && <small className="muted">Ouro insuficiente para o contrato.</small>}</section>)}</div>
          {market(state).length === 0 && <div className="empty-state"><Users /><h3>Todos os contratos desta semana foram assinados.</h3><p>Avance os dias em expedições, descanso ou treino para encontrar novos heróis.</p><Button variant="outline" onClick={() => navigate("expeditions")}>Voltar às expedições</Button></div>}</>}
        </TabsContent>
        <TabsContent value="guild"><div className="section-heading"><div><span className="eyebrow">CONSELHO DA GUILDA</span><h2>Construa seu legado</h2></div><span className="rank-badge"><Shield />Patente {rank(state)}</span></div><ToggleGroup className="compact-nav mobile-subnav" type="single" value={guildView} onValueChange={v => { if (v) setGuildView(v); }} aria-label="Painéis da guilda"><ToggleGroupItem value="summary">Resumo</ToggleGroupItem><ToggleGroupItem value="treasury">Tesouro</ToggleGroupItem><ToggleGroupItem value="arsenal">Arsenal</ToggleGroupItem><ToggleGroupItem value="chronicles">Crônicas</ToggleGroupItem></ToggleGroup><div className="guild-grid" data-mobile-view={guildView}>
          <div className="main-column"><section className="panel guild-identity"><div className="panel-heading"><h2>Identidade da guilda</h2><Crown /></div><form onSubmit={e => { e.preventDefault(); act({ type: "rename", name: guildName }); }}><label htmlFor="guild-name">Nome da guilda</label><div className="name-form"><Input id="guild-name" value={guildName} onChange={e => setGuildName(e.target.value)} minLength={3} maxLength={32} required disabled={blocked} /><Button variant="outline" disabled={blocked || guildName.trim() === state.name || guildName.trim().length < 3}><Pencil />Salvar</Button></div></form><div className="guild-record"><div><strong>{state.wins}</strong><span>Vitórias na temporada</span></div><div><strong>{state.losses}</strong><span>Retiradas na temporada</span></div><div><strong>{state.fame}</strong><span>Renome acumulado</span></div></div></section>
          <section className="panel treasury-panel"><div className="panel-heading"><div><h2>Livro do tesouro</h2><p>Manutenção: 8 ouro/dia · Salários: {payroll(state)} ouro/semana</p></div><Coins /></div><div className="payroll-note">Próximo pagamento de salários em {7 - ((state.day - 1) % 7)} dias.</div><Table><TableHeader><TableRow><TableHead>Dia</TableHead><TableHead>Movimentação</TableHead><TableHead className="number-col">Ouro</TableHead></TableRow></TableHeader><TableBody>{state.ledger.slice(currentLedgerPage * 10, currentLedgerPage * 10 + 10).map(e => <TableRow key={e.id}><TableCell className="muted">{e.day}</TableCell><TableCell>{e.label}</TableCell><TableCell className={"number-col " + (e.amount > 0 ? "positive" : "negative")}>{e.amount > 0 ? "+" : "−"}{fmt(Math.abs(e.amount))}</TableCell></TableRow>)}</TableBody></Table><nav className="list-pagination" aria-label="Páginas do tesouro"><Button variant="outline" aria-label="Página anterior do tesouro" disabled={currentLedgerPage === 0} onClick={() => setLedgerPage(currentLedgerPage - 1)}><ChevronLeft /></Button><span>{currentLedgerPage + 1} / {ledgerPages}</span><Button variant="outline" aria-label="Próxima página do tesouro" disabled={currentLedgerPage >= ledgerPages - 1} onClick={() => setLedgerPage(currentLedgerPage + 1)}><ChevronRight /></Button></nav></section></div>
          <div className="side-column"><section className="panel arsenal-panel"><div className="panel-heading"><h2>Arsenal da guilda</h2><Hammer /></div><span className="arsenal-level">Nível {state.arsenal}<small> / 3</small></span><p>Cada nível adiciona +2 de ataque e +1 de defesa a todos os heróis em batalha.</p><div className="arsenal-track">{[1, 2, 3].map(n => <span key={n} data-built={state.arsenal >= n} />)}</div><Button disabled={blocked || state.arsenal >= 3 || state.gold < 350 + state.arsenal * 350} onClick={() => act({ type: "upgrade" })}><Hammer />{state.arsenal >= 3 ? "Arsenal completo" : "Ampliar arsenal"}{state.arsenal < 3 && <span>{fmt(350 + state.arsenal * 350)} ouro</span>}</Button></section>
          <section className="panel backup-panel"><div className="panel-heading"><div><h2>Save e backup</h2><p>Esta edição salva a campanha no navegador, sem login e sem ChatGPT.</p></div><HardDrive /></div><div className="backup-actions"><Button variant="outline" disabled={busy} onClick={downloadBackup}><Download />Baixar backup</Button><Button variant="outline" disabled={busy} onClick={() => backupInput.current?.click()}><Upload />Importar backup</Button><input ref={backupInput} className="backup-file-input" type="file" accept="application/json,.json" onChange={e => { const file = e.target.files?.[0]; if (file) void restoreBackup(file); }} /><p>Faça backup antes de limpar dados do navegador, formatar o aparelho ou trocar de celular/computador.</p></div></section>
          <section className="panel chronicles-panel"><div className="panel-heading"><h2>Crônicas</h2><BookOpen /></div><ol>{state.journal.slice(0, 8).map((j, i) => <li key={i}><span>DIA {j.day}</span><p>{j.text}</p></li>)}</ol></section><Button variant="ghost" className="reset-button" disabled={blocked} onClick={() => setConfirm({ type: "reset" })}>Iniciar uma nova campanha</Button></div>
        </div></TabsContent>
      </Tabs>
      <footer className="game-footer"><span>Crônicas da Guilda</span><span>Uma missão. Uma decisão. Um novo capítulo.</span></footer>
    </main>}
    <Dialog open={help} onOpenChange={setHelp}><DialogContent className="help-dialog"><DialogHeader><DialogTitle>Comande sua guilda</DialogTitle><DialogDescription>Escolhas, equipe e recursos definem sua campanha.</DialogDescription></DialogHeader><ol className="help-steps"><li><strong>Resolva o conselho.</strong><p>A cada quatro dias surge um evento. Ganhe ouro, construa renome ou negocie a permanência de um herói.</p></li><li><strong>Escolha entre cinco contratos.</strong><p>Escolta protege uma caravana; defesa mantém a barricada por seis turnos; masmorra tem armadilhas; caça exige vitória em até 12 turnos.</p></li><li><strong>Abra os contratos secretos.</strong><p>Quarta missão: 120 renome e Mapa Secreto. Quinta: 260 renome e Chave Antiga. Os itens permanecem no baú; perder renome pode bloquear o acesso novamente.</p></li><li><strong>Escale e acompanhe.</strong><p>Quatro heróis com pelo menos 25% de energia. Organize frente e retaguarda, pause, mude a tática, use as habilidades próprias de cada classe, reserve até duas poções ou ordene retirada. As ordens valem no próximo turno. O combate é salvo a cada turno.</p></li><li><strong>Cuide do baú.</strong><p>Vitórias dão tesouros e chances de equipamento. Equipe uma arma, uma armadura e um acessório por herói. Venda itens ao mercador para pagar salários ou comprar suprimentos.</p></li><li><strong>Evolua as 10 classes.</strong><p>Guerreiro, Mago, Curandeira, Ladino, Arqueira, Paladino, Monge, Necromante, Druida e Bardo. No nível 4 escolhem poder, cura ou defesa; no nível 7 cada caminho se divide em dois subcaminhos; no nível 10 a ramificação vira Ultimate. As escolhas são permanentes.</p></li><li><strong>Treine um herói.</strong><p>Em Descanso ou nos atributos do herói, faça um treino individual por 90 ouro: +90 XP e até +140 XP de bônus para quem está abaixo do nível dos companheiros. Gasta 15 de energia e avança um dia.</p></li><li><strong>Desenvolva raça e história.</strong><p>Cada uma das seis raças tem uma árvore própria com três caminhos. Nos atributos do herói também há uma história pessoal em três etapas; concluir o desafio final libera uma habilidade especial.</p></li><li><strong>Envie heróis em viagem.</strong><p>Viagens de 3, 5 ou 7 dias rendem XP enquanto a sede segue funcionando. Acampamento recupera energia, Exploração aumenta XP e saque, e Atalho encurta a rota com menos experiência.</p></li><li><strong>Prepare o chefe.</strong><p>Disponível nos dias 21 a 28, uma vitória por temporada. Garante equipamento épico, Chave Antiga e libera uma região, até a quarta. As temporadas seguintes ficam mais difíceis.</p></li></ol><p className="help-costs">Liga: um confronto direto por dia concede 3 pontos por vitória e 1 por empate. Missão derrotada: perda de renome. Descanso: até +40 energia. Reservas: +18 por dia. Manutenção: até 8 ouro/dia; salários a cada sete dias. A campanha é salva após cada ação neste aparelho. Use o backup na aba Guilda para proteger seu progresso.</p><DialogClose asChild><Button>Voltar à campanha</Button></DialogClose></DialogContent></Dialog>
    <Dialog open={!!detail} onOpenChange={open => { if (!open) setHeroId(null); }}><DialogContent className="hero-dialog" data-mobile-view={detailView}>{detail && state && detailStats && <><DialogHeader><div className="hero-detail-heading"><Portrait hero={detail} large /><div><span className="location">{CLASSES[detail.class].name} · {RACES[heroRace(detail)].name} · {detail.talent ? SPECIALIZATIONS[detail.class][detail.talent.path].name : detail.trait}</span><DialogTitle>{detail.name}</DialogTitle></div></div><DialogDescription>{CLASSES[detail.class].description}</DialogDescription></DialogHeader><ToggleGroup className="compact-nav mobile-subnav" type="single" value={detailView} onValueChange={v => { if (v) setDetailView(v); }} aria-label="Detalhes do herói"><ToggleGroupItem value="stats">Atributos</ToggleGroupItem><ToggleGroupItem value="talents">Talentos</ToggleGroupItem><ToggleGroupItem value="equipment">Equipamento</ToggleGroupItem></ToggleGroup><div className="hero-overview"><div className="detail-stats"><div><strong>{detail.level}</strong><span>Nível</span></div><div><strong>{detailStats.attack}</strong><span>Ataque</span></div><div><strong>{detailStats.defense}</strong><span>Defesa</span></div><div><strong>{detailStats.magic}</strong><span>Magia</span></div></div><div className="detail-progress"><label>Experiência <span>{detail.xp} / {threshold(detail)} XP</span></label><Progress value={detail.xp / threshold(detail) * 100} aria-label="Experiência do herói" /><label>Energia <span>{detail.energy}%</span></label><Progress value={detail.energy} aria-label="Energia do herói" /></div>{detail.injuredUntil > state.day && <p className="team-warning">Ferido. Disponível no dia {detail.injuredUntil}.</p>}<IndividualTraining state={state} hero={detail} disabled={blocked} act={act} /></div><SpecializationPanel hero={detail} disabled={blocked} act={act} /><RaceEvolutionPanel hero={detail} disabled={blocked} act={act} /><HeroStoryPanel state={state} hero={detail} disabled={blocked || heroOnExpedition(state, detail.id)} act={act} /><HeroEquipment state={state} hero={detail} disabled={blocked || heroOnExpedition(state, detail.id)} act={act} /><Button className="hero-chest-link" variant="outline" onClick={() => { setHeroId(null); navigate("inventory"); }}><Archive />Abrir baú para equipar</Button><p className="muted">Salário: {detail.salary} ouro/semana. Transferência de contrato: {Math.round(detail.value * .35)} ouro.</p><Button className="hero-transfer" variant="outline" disabled={blocked || heroOnExpedition(state, detail.id) || state.heroes.length <= 4 || state.event?.heroId === detail.id} onClick={() => { setHeroId(null); setConfirm({ type: "release", hero: detail }); }}>Transferir contrato para outra guilda</Button></>}</DialogContent></Dialog>
    <Dialog open={battleOpen} onOpenChange={open => { setBattleOpen(open); if (!open) setPaused(false); }}>
      <DialogContent className="battle-dialog live-battle-dialog" showCloseButton={false} onInteractOutside={event => { if (!resultReady) event.preventDefault(); }}>
        {battle && <><div className="battle-fixed-header"><DialogHeader><div className="battle-title"><div><span className="eyebrow">{resultReady ? "RELATÓRIO DA EXPEDIÇÃO" : paused ? "ANIMAÇÃO PAUSADA · COMBATE CONTINUA" : "ACOMPANHANDO A BATALHA"}</span><DialogTitle>{battle?.title || "Expedição"}</DialogTitle></div><DialogClose asChild><Button variant="ghost" size="icon" aria-label={resultReady ? "Fechar relatório" : "Minimizar batalha e voltar à guilda"}><X /></Button></DialogClose></div><DialogDescription>{battle ? "Expedição do dia " + battle.day + " · " + (resultReady ? battle.rounds + " turnos de combate" : "Acompanhe os heróis, os golpes e as curas") : ""}</DialogDescription></DialogHeader>
          <div className="battle-clock-bar"><div className="battle-clock"><Clock3 /><div><span>TEMPO DE COMBATE</span><output role="timer" aria-live="off">{formatBattleClock(elapsed)}</output></div></div><div className="battle-clock-status"><strong>{resultReady ? "Confronto encerrado" : paused ? "Pausado" : frame.preparing ? "Preparando formação" : active && frame.needsRound ? busy ? "Calculando próximo turno" : "Aguardando próximo turno" : shown === frame.events.length && !active ? "Preparando relatório" : "Turno " + frame.currentRound}</strong><span>{resultReady ? battle.won ? "Missão cumprida" : battle.status === "retreated" ? "Retirada ordenada" : "Missão fracassou" : frame.preparing ? "Os heróis estão se posicionando" : active ? "Você pode dar ordens para o próximo turno" : "Confronto encerrado · preparando relatório"}</span></div><Progress className="battle-time-progress" value={active ? Math.min(95, battle.rounds / (battle.objective?.targetRounds || 24) * 100) : frame.duration ? elapsed / frame.duration * 100 : 0} aria-label="Progresso do combate" /></div>
          <div className="playback-controls"><Button variant="outline" disabled={resultReady} onClick={() => setPaused(p => !p)}>{paused ? <Play /> : <Pause />}{paused ? "Retomar animação" : "Pausar animação"}</Button><div className="speed-picker"><span>Velocidade</span><ToggleGroup type="single" value={String(battleSpeed)} onValueChange={value => { if (value) setBattleSpeed(Number(value) as PlaybackSpeed); }} variant="outline" aria-label="Velocidade da simulação" disabled={resultReady}>{[1, 2, 4].map(speed => <ToggleGroupItem key={speed} value={String(speed)} aria-label={"Velocidade " + speed + " vezes"}>{speed}×</ToggleGroupItem>)}</ToggleGroup></div>{!resultReady && <Button variant="ghost" className="skip-battle" disabled={busy} onClick={() => { if (active) battleAct({ type: "battle-auto" }); else { setElapsed(frame.duration); setPaused(false); } }}>{active ? "Concluir automaticamente" : "Pular para resultado"}</Button>}</div><ToggleGroup className="compact-nav mobile-subnav battle-subnav" type="single" value={battleView} onValueChange={v => { if (v) setBattleView(v); }} aria-label="Painéis da batalha"><ToggleGroupItem value="combat">Combate</ToggleGroupItem>{active && <ToggleGroupItem value="orders">Ordens</ToggleGroupItem>}<ToggleGroupItem value="log">Narração</ToggleGroupItem>{resultReady && <ToggleGroupItem value="result">Resultado</ToggleGroupItem>}</ToggleGroup></div><div className="battle-scroll-area" data-mobile-view={battleView}>
          {active && state && <div className="battle-command-pane"><BattleOrders battle={battle} state={state} visibleFighters={frame.fighters} disabled={busy} act={battleAct} /><Button variant="outline" className="mobile-auto-battle" disabled={busy} onClick={() => battleAct({ type: "battle-auto" })}>Concluir automaticamente</Button></div>}<div className="battle-combat-pane">
          {battle.objective && battle.objective.maxHp > 0 && <section className="battle-objective"><div><strong>{battle.objective.name}</strong><span>{frame.objectiveHp} / {battle.objective.maxHp} PV · objetivo: resistir até o turno {battle.objective.targetRounds}</span></div><Progress value={frame.objectiveHp / battle.objective.maxHp * 100} aria-label={"Vida da " + battle.objective.name} /></section>}
          {battle.objective && battle.objective.name === "Limite da caçada" && <p className="battle-live-note">Derrote os monstros até o turno {battle.objective.targetRounds}.</p>}
          {frame.fighters.length > 0 && <div className="battle-arena"><section className="battle-side heroes-side"><div className="battle-side-heading"><Shield /><h3>Seus heróis</h3><span>{frame.fighters.filter(f => f.side === "hero" && f.hp > 0).length} / {frame.fighters.filter(f => f.side === "hero").length}</span></div><div className="combatants-grid">{frame.fighters.filter(f => f.side === "hero").map(f => <FighterCard key={f.id} fighter={f} impact={frame.last} elapsed={elapsed} />)}</div></section><section className="battle-side enemies-side"><div className="battle-side-heading"><Swords /><h3>Inimigos</h3><span>{frame.fighters.filter(f => f.side === "enemy" && f.hp > 0).length} / {frame.fighters.filter(f => f.side === "enemy").length}</span></div><div className="combatants-grid">{frame.fighters.filter(f => f.side === "enemy").map(f => <FighterCard key={f.id} fighter={f} impact={frame.last} elapsed={elapsed} />)}</div></section></div>}
          </div><div className="battle-log-pane"><div className="live-log-heading"><ScrollText /><h3>Acontecimentos da batalha</h3><span>{paused && !resultReady ? "PAUSADO" : resultReady ? "ENCERRADO" : "EM ANDAMENTO"}</span></div>
          <div className="battle-log live-battle-log" ref={battleScroll} aria-label="Registro da batalha">
            {frame.visible.length === 0 && <p className="battle-waiting">Sua equipe avança para o confronto. A narração começará em instantes.</p>}
            {frame.visible.map((event, i) => <div key={i} className={"log-line log-" + event.log.kind}><time>{formatBattleClock(event.at)}</time><p>{event.log.text}</p></div>)}
          </div></div>
          {resultReady && <div className="battle-result-pane"><div className={"battle-outcome " + (battle.won ? "victory" : "defeat")} role="status">{battle.won ? <Trophy /> : <Shield />}<div><h3>{battle.won ? "Vitória da guilda" : battle.status === "retreated" ? "Retirada ordenada" : "A missão fracassou"}</h3><p>{battle.won ? "+" + battle.reward + " ouro · +" + battle.xp + " XP por herói" : "+" + battle.xp + " XP por herói · Descanse e ajuste a equipe"}{typeof battle.fameChange === "number" && " · " + (battle.fameChange >= 0 ? "+" : "") + battle.fameChange + " renome"}</p></div></div><div className="battle-summary">{battle.levelUps.length > 0 && <p><Sparkles />Subiram de nível: {battle.levelUps.join(", ")}. Consulte as especializações nos detalhes do herói.</p>}{battle.wounded.length > 0 && <p className="negative"><Heart />Feridos: {battle.wounded.join(", ")}. Precisam de dois dias para recuperação.</p>}{battle.regionUnlocked && <p className="positive"><Crown />Nova região: {REGIONS[battle.regionUnlocked - 1]}.</p>}{!!battle.loot?.length && <div className="battle-loot"><h3>Saque enviado ao baú</h3>{battle.loot.map((key, i) => <span key={key + i}><ItemIcon itemKey={key} />{ITEMS[key].name}</span>)}<Button variant="outline" onClick={() => { setBattleOpen(false); navigate("inventory"); }}>Abrir baú</Button></div>}<p className="muted">{battle.remaining} de {battle.fighters?.filter(f => f.side === "hero").length || 0} heróis encerraram o combate em pé. O dia só avança quando todas as expedições em andamento forem resolvidas.</p></div></div>}
          </div><div className="battle-actions">{resultReady ? <><Button variant="outline" onClick={() => { setElapsed(0); setPaused(false); setWatchingBattle(true); setBattleView("combat"); }}>Rever batalha</Button><Button onClick={() => setBattleOpen(false)}>Continuar campanha</Button></> : <p className="battle-live-note">{paused ? "Só a animação está pausada. A expedição continua em segundo plano." : "Você pode fechar esta tela: a expedição continuará enquanto usa a guilda."}</p>}</div>
        </>}
      </DialogContent>
    </Dialog>
    <AlertDialog open={!!confirm} onOpenChange={open => { if (!open) setConfirm(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirm?.type === "reset" ? "Começar uma nova campanha?" : "Transferir este contrato?"}</AlertDialogTitle><AlertDialogDescription>{confirm?.type === "reset" ? "Sua campanha atual será substituída. Ouro, heróis, reputação e histórico serão reiniciados." : confirm?.type === "release" ? confirm.hero.name + " deixará a guilda. Você receberá " + Math.round(confirm.hero.value * 0.35) + " de ouro e deixará de pagar seu salário." : ""}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (confirm?.type === "reset") act({ type: "reset" }); else if (confirm?.type === "release") act({ type: "release", heroId: confirm.hero.id }); }}>{confirm?.type === "reset" ? "Reiniciar campanha" : "Transferir contrato"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
