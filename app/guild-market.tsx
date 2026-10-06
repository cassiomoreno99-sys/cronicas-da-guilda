"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trophy, Users, Coins, Shield, Sword, Sparkles, Check, X, Search, Handshake, ScrollText, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { CLASSES, RACES, heroRace, SPECIALIZATIONS, SPECIALIZATION_BRANCHES, LEAGUE_PRIZES, LEAGUE_TIERS, NEGOTIATION_MODES, standings, seasonDay, leaguePrize, leagueCalendar, cupStageLabel, rivalryHeat, rivalPower, rivalAttemptsThisWeek, negotiationQuote, heroStats, type Campaign, type Action, type RivalHero, type NegotiationMode } from "@/lib/game";
import { portraitPosition } from "@/lib/portraits";

const fmt = (n: number) => n.toLocaleString("pt-BR");
const searchText = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
function usePageSize() {
  const [size, setSize] = useState(10);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 760px)");
    const update = () => setSize(mobile.matches ? 5 : 10);
    update(); mobile.addEventListener("change", update);
    return () => mobile.removeEventListener("change", update);
  }, []);
  return size;
}
function Pages({ page, count, setPage, label }: { page: number; count: number; setPage: (p: number) => void; label: string }) {
  return <nav className="list-pagination" aria-label={label}>
    <Button variant="outline" aria-label={"Página anterior de " + label} disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft /></Button>
    <span>{page + 1} / {count}</span>
    <Button variant="outline" aria-label={"Próxima página de " + label} disabled={page >= count - 1} onClick={() => setPage(page + 1)}><ChevronRight /></Button>
  </nav>;
}
export function LeagueTable({ state, openGuild }: { state: Campaign; openGuild: (id: string) => void }) {
  const ranking = standings(state), place = ranking.findIndex(g => g.id === "player") + 1;
  const size = usePageSize(), [page, setPage] = useState(0), [prizes, setPrizes] = useState(false);
  const pages = Math.ceil(ranking.length / size), currentPage = Math.min(page, pages - 1), tier = LEAGUE_TIERS[state.leagueTier];
  const calendar = leagueCalendar(state, 5), latest = state.leagueHistory?.find(m => m.season === state.season && !m.cup), cupLatest = state.cup.history?.[0];
  const resultText = (result: "win" | "draw" | "loss") => result === "win" ? "Vitória" : result === "draw" ? "Empate" : "Derrota";
  return <section className="panel league-panel">
    <div className="panel-heading"><div><span className="eyebrow">TEMPORADA {state.season} · DIVISÃO {tier.name.toUpperCase()} · {ranking.length} GUILDAS</span><h2>Liga dos Aventureiros</h2></div><Trophy /></div>
    <div className="league-dashboard"><div className="league-position"><strong>Sua guilda: {place}º</strong><span>{state.points} pontos · {state.leagueWins}V {state.leagueDraws}E {state.leagueLosses}D</span><small>Prêmio atual: {leaguePrize(place, state.leagueTier)} ouro</small></div><div className="cup-card"><span className="eyebrow">COPA DAS GUILDAS</span><strong>{cupStageLabel(state.cup.stage)}</strong><small>{state.cup.stage === "champion" ? "Título conquistado" : state.cup.stage === "eliminated" ? "Campanha encerrada" : "Mata-mata nos dias 7, 14, 21 e 28"}</small></div></div>
    {latest && <div className={"league-latest result-" + latest.result}><span>Último jogo da liga</span><strong>{state.name} {latest.playerScore} × {latest.opponentScore} {latest.opponentName}</strong><small>{resultText(latest.result)}{latest.rivalry ? " · CLÁSSICO" : ""}</small></div>}
    <div className="league-calendar"><div className="league-calendar-heading"><div><span className="eyebrow">CALENDÁRIO</span><h3>Próximos confrontos</h3></div><span>1 jogo de liga por dia</span></div>{calendar.map(item => <button className="league-fixture" key={item.day} onClick={() => openGuild(item.opponent.id)}><span>Dia {item.day}</span><strong>{item.opponent.name}</strong><small>Força {rivalPower(item.opponent)}{item.rivalry ? " · CLÁSSICO" : ""}</small></button>)}</div>
    {cupLatest && <div className="cup-latest"><Trophy /><span><strong>{cupLatest.stage}</strong><small>{state.name} {cupLatest.playerScore} × {cupLatest.opponentScore} {cupLatest.opponentName}</small></span></div>}
    <div className="division-rules"><span><strong>Top 10:</strong> {state.leagueTier === 1 ? "permanecem na elite" : "sobem de divisão"}</span><span><strong>Últimos 10:</strong> {state.leagueTier === 3 ? "permanecem no Bronze" : "caem de divisão"}</span></div>
    <div className="league-shortcuts"><Button variant="outline" onClick={() => setPage(0)}>Líderes</Button><Button variant="outline" onClick={() => setPage(Math.floor((place - 1) / size))}>Minha guilda</Button><Button variant="ghost" onClick={() => setPrizes(true)}>Prêmios</Button></div>
    <Pages page={currentPage} count={pages} setPage={setPage} label="liga" />
    <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Guilda</TableHead><TableHead className="number-col">PTS</TableHead></TableRow></TableHeader><TableBody>
      {ranking.slice(currentPage * size, (currentPage + 1) * size).map((g, i) => { const pos = currentPage * size + i + 1, heat = g.id === "player" ? 0 : rivalryHeat(state, g.id); return <TableRow key={g.id} className={g.id === "player" ? "player-row" : ""}><TableCell>{pos}</TableCell><TableCell>{g.id === "player" ? <>{g.name}<span className="you-label">VOCÊ</span></> : <Button className="league-guild-link" variant="link" aria-label={"Aventureiros de " + g.name} onClick={() => openGuild(g.id)}>{g.name}{heat >= 30 && <span className="rivalry-badge">RIVAL {heat}</span>}</Button>}</TableCell><TableCell className="number-col">{g.points}</TableCell></TableRow>; })}
    </TableBody></Table>
    <p className="league-caption">Toque em uma rival para ver seus aventureiros. Contratar alguém de outra guilda aumenta a rivalidade e pode gerar um contra-ataque no mercado.</p>
    <div className="season-progress"><span>Dia {seasonDay(state)} de 28</span><Progress value={seasonDay(state) / 28 * 100} aria-label="Progresso da temporada" /></div>
    <Dialog open={prizes} onOpenChange={setPrizes}><DialogContent className="league-prizes-dialog"><DialogHeader><DialogTitle>Premiação · Divisão {tier.name}</DialogTitle><DialogDescription>O prêmio é pago ao encerrar os 28 dias. A divisão {tier.name} aplica multiplicador de {tier.prizeMultiplier.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}×.</DialogDescription></DialogHeader><div className="league-prizes">{LEAGUE_PRIZES.map((p, i) => { const start = i ? LEAGUE_PRIZES[i - 1].through + 1 : 1; return <div key={p.through}><span>{start === p.through ? start + "º lugar" : start + "º a " + p.through + "º"}</span><strong>{Math.round(p.gold * tier.prizeMultiplier)} ouro</strong></div>; })}</div></DialogContent></Dialog>
  </section>;
}
function Face({ hero }: { hero: RivalHero }) { return <span role="img" aria-label={"Retrato de " + hero.name} className="hero-portrait" style={{ backgroundPosition: portraitPosition(hero.name, hero.id, hero.class, heroRace(hero)) }} />; }

export function RivalRecruitment({ state, disabled, act, selectedGuildId, selectGuild }: { state: Campaign; disabled: boolean; act: (a: Action) => void; selectedGuildId: string | null; selectGuild: (id: string | null) => void }) {
  const [query, setQuery] = useState(""), [page, setPage] = useState(0), size = usePageSize();
  const [candidate, setCandidate] = useState<RivalHero | null>(null), [mode, setMode] = useState<NegotiationMode>("transfer"), [baseline, setBaseline] = useState<number | null>(null);
  const ranking = standings(state), positions = new Map(ranking.map((g, i) => [g.id, i + 1]));
  const filtered = state.rivals.filter(g => searchText(g.name).includes(searchText(query))).sort((a, b) => positions.get(a.id)! - positions.get(b.id)!);
  const pages = Math.max(1, Math.ceil(filtered.length / size)), currentPage = Math.min(page, pages - 1);
  const guild = state.rivals.find(g => g.id === selectedGuildId);
  const result = state.lastNegotiation && state.lastNegotiation.id !== baseline && state.lastNegotiation.heroId === candidate?.id ? state.lastNegotiation : null;
  const currentHero = guild?.heroes.find(h => h.id === candidate?.id);
  const quote = guild && currentHero ? negotiationQuote(state, guild, currentHero, mode) : null;
  const attempts = rivalAttemptsThisWeek(state).length;
  const openCandidate = (h: RivalHero) => { setCandidate(h); setMode("transfer"); setBaseline(state.lastNegotiation?.id || null); };
  return <div className="rival-market">
    <div className="rival-market-status"><span><Handshake />Propostas: {attempts}/3 nesta semana</span><span>Renovação em {7 - (state.day - 1) % 7} dias</span></div>
    {!guild ? <>
      <div className="rival-search"><Search /><Input value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} aria-label="Buscar guilda rival" placeholder="Buscar guilda rival" /></div>
      <div className="rival-browser-heading"><span>{filtered.length} guildas rivais</span><Pages page={currentPage} count={pages} setPage={setPage} label="guildas rivais" /></div>
      <div className="rival-guild-list">{filtered.slice(currentPage * size, (currentPage + 1) * size).map(g => <section className="panel rival-guild-card" key={g.id}><div><span className="location">{positions.get(g.id)}º na liga · {g.points} pontos</span><h3>{g.name}</h3><p>{g.heroes.length} aventureiros · Força {rivalPower(g)}{rivalryHeat(state, g.id) > 0 ? " · Rivalidade " + rivalryHeat(state, g.id) + "/100" : ""}</p></div><Button variant="outline" aria-label={"Ver aventureiros de " + g.name} onClick={() => selectGuild(g.id)}><Users />Ver aventureiros</Button></section>)}</div>
      {!filtered.length && <p className="empty-state">Nenhuma guilda com esse nome.</p>}
    </> : <>
      <div className="rival-team-heading"><Button variant="outline" onClick={() => selectGuild(null)}><ChevronLeft />Guildas</Button><div><span className="location">{positions.get(guild.id)}º na liga · Força {rivalPower(guild)}</span><h3>{guild.name}</h3>{rivalryHeat(state, guild.id) > 0 && <span className="rivalry-level">Rivalidade {rivalryHeat(state, guild.id)}/100{rivalryHeat(state, guild.id) >= 30 ? " · CLÁSSICO" : ""}</span>}</div></div>
      <p className="rival-guidance">Veja a lealdade e os requisitos antes de propor. Aventureiros mais fortes exigem mais ouro e renome.</p>
      <div className="rival-hero-list">{guild.heroes.map(h => { const n = heroStats(h); const tried = rivalAttemptsThisWeek(state).some(a => a.endsWith(":" + h.id)); return <section className="panel rival-hero-card" key={h.id}>
        <Face hero={h} /><div className="rival-hero-name"><span className="location">{CLASSES[h.class].name} · {RACES[heroRace(h)].name} · Nv. {h.level}</span><h3>{h.name}</h3>{h.talent && <small>{SPECIALIZATIONS[h.class][h.talent.path].name}{h.talent.branch ? " → " + SPECIALIZATION_BRANCHES[h.class][h.talent.path][h.talent.branch] : ""} · grau {h.talent.rank}</small>}</div>
        <div className="rival-hero-stats"><span><Sword />{n.attack}</span><span><Shield />{n.defense}</span><span><Sparkles />{n.magic}</span><span>Lealdade {h.loyalty}%</span></div>
        <Button variant="outline" disabled={disabled || tried} onClick={() => openCandidate(h)}><Handshake />{tried ? "Já abordado nesta semana" : "Fazer proposta"}</Button>
      </section>; })}</div>
    </>}
    <p className="rival-market-note">Até três propostas por semana, uma por aventureiro. Negociar não avança o dia. Uma contratação remove o herói da rival, que repõe a vaga com um recruta de nível baixo. Tirar aventureiros de uma rival aumenta a tensão: clássicos começam em 30/100 e rivalidades altas podem gerar tentativa de roubo contra você.</p>
    {candidate && guild && <Dialog open onOpenChange={open => { if (!open) setCandidate(null); }}><DialogContent className="negotiation-dialog"><DialogHeader><DialogTitle>{result ? result.success ? "Aventureiro contratado" : "Proposta recusada" : "Disputar aventureiro"}</DialogTitle><DialogDescription>{candidate.name} · {CLASSES[candidate.class].name} · {RACES[heroRace(candidate)].name} · Nv. {candidate.level}<br />{guild.name}</DialogDescription></DialogHeader>
      {result ? <><div className={"negotiation-result " + (result.success ? "success" : "refused")}>{result.success ? <Check /> : <X />}<p>{result.message}</p></div><div className="negotiation-summary"><span><Coins />−{fmt(result.cost)} ouro</span><span>{result.fameChange ? result.fameChange + " renome" : "Renome preservado"}</span></div><DialogClose asChild><Button>Voltar ao mercado</Button></DialogClose></> : quote && currentHero ? <>
        <RadioGroup value={mode} onValueChange={v => setMode(v as NegotiationMode)} aria-label="Abordagem da proposta" className="negotiation-options">{(Object.keys(NEGOTIATION_MODES) as NegotiationMode[]).map(m => { const q = negotiationQuote(state, guild, currentHero, m); const Icon = m === "transfer" ? ScrollText : m === "offer" ? Coins : EyeOff; return <label className="negotiation-option" key={m} data-selected={mode === m} htmlFor={"approach-" + m}><RadioGroupItem value={m} id={"approach-" + m} /><Icon /><span><strong>{NEGOTIATION_MODES[m].title}</strong><small>{fmt(q.price)} ouro · {q.chance === 100 ? "Garantido" : q.chance + "% de chance"} · renome {q.requiredFame}+</small></span></label>; })}</RadioGroup>
        <p className="negotiation-guidance">{NEGOTIATION_MODES[mode].description}</p>
        <div className="negotiation-terms"><span>Se aceitar: <strong>{fmt(quote.price)} ouro</strong></span><span>Salário: <strong>{quote.salary} ouro/semana</strong></span>{quote.fee > 0 && <span>Se recusar: <strong>{quote.fee} ouro</strong></span>}{mode === "covert" && <span>Renome: <strong>−15 se aceitar; −8 se recusar</strong> (até zero)</span>}</div>
        {!quote.eligible && <p className="negotiation-blocked">{quote.reason}</p>}
        <Button disabled={disabled || !quote.eligible} onClick={() => act({ type: "negotiate-rival", guildId: guild.id, heroId: candidate.id, mode })}><Handshake />{disabled ? "Negociando…" : "Enviar proposta"}</Button>
      </> : <p>Esse aventureiro já deixou a guilda. Feche a janela e consulte o elenco atualizado.</p>}
    </DialogContent></Dialog>}
  </div>;
}
