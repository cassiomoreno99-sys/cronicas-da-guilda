"use client";
import { useMemo, useState } from "react";
import {
  Archive, Beer, Check, ChevronRight, Coins, Crown, Hammer, Heart, LockKeyhole,
  Package, Shield, ShoppingBag, Sparkles, Swords, Tent, Trophy, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CLASSES, RACES, ITEMS, heroRace, heroStats, rating, standings, leaguePrize,
  market, missions, payroll, rank, hqUpgradeCost, HQ_DEFINITIONS,
  type Action, type Campaign, type ChestItem, type Hero, type HeroClass, type HeroRace
} from "@/lib/game";
import { portraitPosition } from "@/lib/portraits";
import { EventPanel, IndividualTraining, ItemIcon } from "./game-dynamics";
import { ForgePanel } from "./v130-panels";

const fmt = (n: number) => n.toLocaleString("pt-BR");

function FantasyPortrait({ hero, large = false }: { hero: { id?: string; name: string; class?: HeroClass; race?: HeroRace }; large?: boolean }) {
  const race = hero.class ? heroRace({ id: hero.id || hero.name, name: hero.name, class: hero.class, race: hero.race }) : undefined;
  return <span className={"mockup-portrait " + (large ? "is-large" : "")} role="img" aria-label={"Retrato de " + hero.name} style={{ backgroundPosition: portraitPosition(hero.name, hero.id, hero.class, race) }} />;
}

function itemStats(item: ChestItem) {
  const d = ITEMS[item.key];
  const pairs: Array<[string, number | undefined]> = [
    ["Ataque", d.attack], ["Defesa", d.defense], ["Magia", d.magic], ["Vida", d.hp], ["Velocidade", d.speed]
  ];
  return pairs.filter(([, value]) => !!value) as Array<[string, number]>;
}

export function MockupHeroesPage({
  state, team, disabled, onToggleTeam, onManage
}: {
  state: Campaign;
  team: string[];
  disabled: boolean;
  onToggleTeam: (heroId: string) => void;
  onManage: (heroId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(state.heroes[0]?.id || "");
  const selected = state.heroes.find(h => h.id === selectedId) || state.heroes[0];
  const stats = selected ? heroStats(selected, state) : null;
  const equipped = selected ? state.chest.filter(i => i.equippedTo === selected.id).slice(0, 6) : [];

  return <section className="mockup-page mockup-heroes-page">
    <div className="mockup-page-title"><div><span>MEUS HERÓIS</span><h2>{state.heroes.length}/20</h2></div><Users /></div>
    <div className="mockup-heroes-layout">
      <div className="mockup-hero-list">
        {state.heroes.slice(0, 8).map(hero => {
          const active = hero.id === selected?.id;
          return <button type="button" key={hero.id} className="mockup-hero-row" data-active={active} onClick={() => setSelectedId(hero.id)}>
            <span className="mockup-team-check" data-on={team.includes(hero.id)} onClick={e => { e.stopPropagation(); if (!disabled) onToggleTeam(hero.id); }}>{team.includes(hero.id) ? <Check /> : null}</span>
            <FantasyPortrait hero={hero} />
            <span className="mockup-hero-row-copy"><strong>{hero.name}</strong><small>{CLASSES[hero.class].name} · {RACES[heroRace(hero)].name}</small><em>Nv. {hero.level} · Força {rating(hero, state.arsenal, state)}</em><span className="mockup-energy"><i style={{ width: hero.energy + "%" }} /></span></span>
            <ChevronRight />
          </button>;
        })}
      </div>
      {selected && stats && <article className="mockup-hero-sheet">
        <div className="mockup-hero-art"><FantasyPortrait hero={selected} large /><div><h2>{selected.name}</h2><p>{selected.trait}</p></div></div>
        <div className="mockup-hero-level"><strong>Nv. {selected.level}</strong><Progress value={Math.min(100, selected.xp / Math.max(1, selected.level * 100) * 100)} /></div>
        <div className="mockup-hero-core"><div><span>Classe</span><strong>{CLASSES[selected.class].name}</strong></div><div><span>Raça</span><strong>{RACES[heroRace(selected)].name}</strong></div><div><span>Força</span><strong>{rating(selected, state.arsenal, state)}</strong></div></div>
        <div className="mockup-sheet-section"><span>ATRIBUTOS</span><div className="mockup-stat-grid"><b>❤ Vida <em>{100 + selected.level * 10 + stats.hp}</em></b><b>⚔ Ataque <em>{stats.attack}</em></b><b>🛡 Defesa <em>{stats.defense}</em></b><b>✦ Magia <em>{stats.magic}</em></b><b>★ Crítico <em>{Math.round(stats.critical * 100)}%</em></b><b>➤ Velocidade <em>{stats.speed}</em></b></div></div>
        <div className="mockup-sheet-section"><span>FUNÇÃO</span><h3>{selected.class === "paladin" || selected.class === "warrior" ? "Linha de Frente" : selected.class === "healer" ? "Suporte" : "Especialista"}</h3><p>{CLASSES[selected.class].description}</p></div>
        <div className="mockup-sheet-section"><span>EQUIPAMENTOS</span><div className="mockup-equipment-row">{equipped.length ? equipped.map(i => <ItemIcon key={i.id} itemKey={i.key} />) : <small>Nenhum equipamento equipado.</small>}</div></div>
        <Button className="mockup-primary" disabled={disabled} onClick={() => onManage(selected.id)}>Gerenciar</Button>
      </article>}
    </div>
  </section>;
}

export function MockupInventoryPage({ state, disabled, act }: { state: Campaign; disabled: boolean; act: (a: Action) => void }) {
  const [mode, setMode] = useState<"inventory" | "materials">("inventory");
  const [filter, setFilter] = useState("all");
  const source = useMemo(() => state.chest.filter(i => {
    const d = ITEMS[i.key];
    if (mode === "materials") return d.slot === "material";
    if (filter === "all") return d.slot !== "material";
    if (filter === "equipment") return ["weapon","offhand","helmet","armor","gloves","boots","accessory"].includes(d.slot);
    return d.slot === filter;
  }), [state.chest, mode, filter]);
  const [selectedId, setSelectedId] = useState(state.chest[0]?.id || "");
  const selected = source.find(i => i.id === selectedId) || source[0];
  const [recipient, setRecipient] = useState("");
  const def = selected ? ITEMS[selected.key] : null;
  const owner = selected ? state.heroes.find(h => h.id === selected.equippedTo) : undefined;
  const equipSlots = ["weapon","offhand","helmet","armor","gloves","boots","accessory"];
  const equippable = !!def && equipSlots.includes(def.slot);
  const compatible = def ? state.heroes.filter(h => (!def.race || heroRace(h) === def.race) && (!def.classes || def.classes.includes(h.class)) && (!def.levelReq || h.level >= def.levelReq)) : [];
  const target = recipient || compatible[0]?.id || "";

  return <section className="mockup-page mockup-inventory-page">
    <div className="mockup-page-title"><div><span>PATRIMÔNIO DA GUILDA</span><h2>Inventário</h2></div><Archive /></div>
    <div className="mockup-inventory-tabs"><button data-active={mode === "inventory"} onClick={() => setMode("inventory")}><Archive />Inventário</button><button data-active={mode === "materials"} onClick={() => setMode("materials")}><Sparkles />Materiais</button><span><Package />{state.chest.length}/80</span></div>
    {mode === "inventory" && <div className="mockup-inventory-filters">{[["all","Todos"],["equipment","Equipamentos"],["accessory","Acessórios"],["consumable","Consumíveis"],["quest","Outros"]].map(([id,label]) => <button key={id} data-active={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>}
    <div className="mockup-inventory-layout">
      <div className="mockup-item-grid">{source.slice(0, 24).map(item => {
        const d = ITEMS[item.key];
        return <button type="button" key={item.id} className={"mockup-item rarity-" + d.rarity} data-active={item.id === selected?.id} onClick={() => { setSelectedId(item.id); setRecipient(""); }}>
          <ItemIcon itemKey={item.key} /><span>{d.name}</span>{item.equippedTo && <i>✓</i>}
        </button>;
      })}{!source.length && <p className="mockup-empty">Nenhum item nesta categoria.</p>}</div>
      {selected && def && <article className="mockup-item-detail">
        <span className="mockup-item-rarity">{def.rarity.toUpperCase()}</span>
        <h2>{def.name}</h2>
        <div className={"mockup-item-hero rarity-" + def.rarity}><ItemIcon itemKey={selected.key} /></div>
        <p>{def.description}</p>
        <div className="mockup-item-stats">{itemStats(selected).map(([label,value]) => <span key={label}><b>{label}</b><em>+{value}</em></span>)}</div>
        {def.levelReq && <small>Nível necessário: {def.levelReq}</small>}
        {owner && <small>Equipado por {owner.name}</small>}
        {equippable && !owner && compatible.length > 0 && <select value={target} onChange={e => setRecipient(e.target.value)} aria-label="Escolher herói">{compatible.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select>}
        <div className="mockup-item-actions">
          {equippable && (owner ? <Button disabled={disabled} onClick={() => act({ type:"unequip", itemId:selected.id })}>Desequipar</Button> : <Button disabled={disabled || !target} onClick={() => target && act({ type:"equip", itemId:selected.id, heroId:target })}>Equipar</Button>)}
          {!selected.equippedTo && <Button variant="outline" disabled={disabled} onClick={() => act({ type:"sell", itemId:selected.id })}><Coins />Vender · {def.value}</Button>}
          {def.slot === "consumable" && <Button variant="outline" disabled><Heart />Usar em combate</Button>}
        </div>
      </article>}
    </div>
  </section>;
}

export function MockupTavernPage({
  state, disabled, act, onMission, onRivals
}: {
  state: Campaign; disabled: boolean; act: (a: Action) => void;
  onMission: (missionId: string) => void; onRivals: () => void;
}) {
  const recruits = market(state);
  const rumors = missions(state).slice(0,3);
  return <section className="mockup-page mockup-tavern-page">
    <div className="mockup-tavern-scene"><div className="mockup-tavern-quote">Boas histórias<br/>sempre encontram<br/>um lugar aqui.</div></div>
    <div className="mockup-strip-title"><Users /><h2>Heróis para Recrutar</h2><span>Renova em: {7 - ((state.day - 1) % 7)}d</span></div>
    <div className="mockup-recruit-grid">{recruits.map(h => <article key={h.id} className="mockup-recruit-card">
      <FantasyPortrait hero={h} large />
      <h3>{h.name}</h3><span>{CLASSES[h.class].name}</span><small><Coins />{h.value} Ouro</small>
      <Button disabled={disabled || state.gold < h.value} onClick={() => act({ type:"hire", heroId:h.id })}>Recrutar</Button>
    </article>)}</div>
    <div className="mockup-tavern-lower">
      <section className="mockup-rumors"><div className="mockup-strip-title"><Package /><h3>Rumores da Taverna</h3></div>{rumors.map(m => <button key={m.id} onClick={() => onMission(m.id)}><span><strong>{m.title}</strong><small>{m.description}</small></span><em><Coins />{m.reward} · XP +{18 + m.rank * 12}</em></button>)}</section>
      <aside className="mockup-drinks"><Beer /><h3>Bebidas da Casa</h3><p>Brinde com a guilda para recuperar o moral dos heróis.</p><Button disabled={disabled || state.gold < 50} onClick={() => act({ type:"rest" })}>Brindar · 50 ouro</Button><Button variant="outline" onClick={onRivals}>Guildas rivais</Button></aside>
    </div>
  </section>;
}

export function MockupLeaguePage({ state, team, disabled, act, onGuild }: { state: Campaign; team: string[]; disabled: boolean; act: (a: Action) => void; onGuild: () => void }) {
  const table = standings(state);
  const place = Math.max(1, table.findIndex(g => g.id === "player") + 1);
  const rows = table.slice(0,5);
  const rival = table.find(g => g.id !== "player" && state.rivals.some(r => r.id === g.id));
  const rivalData = state.rivals.find(r => r.id === rival?.id);
  return <section className="mockup-page mockup-league-page">
    <div className="mockup-league-summary"><div><span>Nossa Posição</span><strong>{place}º</strong></div><div className="mockup-guild-crest"><Crown /></div><div><h2>{state.name}</h2><span><Trophy />{state.points} Pontos da Liga</span><small>Prestígio: {state.fame}</small></div></div>
    <div className="mockup-strip-title dark"><Trophy /><h2>Classificação da Liga</h2><span>Temporada {state.season}</span></div>
    <div className="mockup-league-table">
      <div className="mockup-league-head"><span>#</span><span>Guilda</span><span>Pontos</span><span>Recompensa</span></div>
      {rows.map((g,idx) => <div key={g.id} className="mockup-league-row" data-player={g.id === "player"}><b>{idx + 1}</b><span><i className={"mockup-banner banner-" + (idx%5)} /><strong>{g.name}</strong></span><em><Trophy />{g.points}</em><small><Coins />{leaguePrize(idx + 1, state.leagueTier || 3)} ouro</small></div>)}
    </div>
    {rival && rivalData && <section className="mockup-guild-challenge"><div className="mockup-challenge-art"><Swords /></div><div><span>DESAFIO DE GUILDA</span><h2>{rival.name}</h2><p>Uma guilda rival disputa influência e posição na liga.</p><small><Trophy />{rival.points} pontos · Força {rivalData.strength}</small></div><Button disabled={disabled || team.length < 3 || team.length > 4} onClick={() => act({ type:"rival-battle", guildId:rivalData.id, team })}>Desafiar</Button></section>}
    <Button variant="outline" className="mockup-secondary-link" onClick={onGuild}>Abrir sede e guerras da guilda</Button>
  </section>;
}

export function MockupRestPage({ state, team, disabled, act }: { state: Campaign; team: string[]; disabled: boolean; act: (a: Action) => void }) {
  const recovering = state.heroes.filter(h => h.injuredUntil > state.day || h.energy < 100).slice(0,4);
  return <section className="mockup-page mockup-rest-page">
    <div className="mockup-sanctuary-head"><div className="mockup-sanctuary-art" /><div><h2>Santuário da Guilda</h2><p>Aqui seus heróis feridos podem repousar e se recuperar para novas aventuras.</p><strong>Capacidade</strong><span>{recovering.length} / {Math.max(5,recovering.length)} leitos ocupados</span></div></div>
    <div className="mockup-strip-title dark"><Heart /><h2>Heróis em Recuperação</h2></div>
    <div className="mockup-recovery-list">{recovering.length ? recovering.map(h => <article key={h.id}><FantasyPortrait hero={h}/><div><h3>{h.name}</h3><span>{CLASSES[h.class].name}</span><Progress value={h.energy}/><small>{h.injuredUntil > state.day ? "Ferido · disponível no dia " + h.injuredUntil : "Energia " + h.energy + "%"}</small></div><Button variant="outline" disabled={disabled || state.gold < 90} onClick={() => act({ type:"train-hero", heroId:h.id })}>Acelerar</Button></article>) : <p className="mockup-empty">Todos os heróis estão descansados.</p>}</div>
    <div className="mockup-strip-title dark"><Package /><h2>Itens de Recuperação</h2></div>
    <div className="mockup-recovery-items">{["healing_potion","antidote","stun_bomb"].map(key => <article key={key}><ItemIcon itemKey={key}/><strong>{ITEMS[key]?.name || key}</strong><span>Possui {state.chest.filter(i=>i.key===key).length}</span></article>)}</div>
    <div className="mockup-rest-actions"><Button disabled={disabled} onClick={() => act({type:"rest"})}><Tent />Descansar a guilda</Button><Button variant="outline" disabled={disabled || team.length < 3 || team.length > 4 || state.gold < 200} onClick={() => act({type:"train", team, tactic:"balanced"})}>Treinar equipe · 200 ouro</Button></div>
    <IndividualTraining state={state} disabled={disabled} act={act}/>
  </section>;
}

export function MockupGuildPage({ state, disabled, act }: { state: Campaign; disabled: boolean; act: (a: Action) => void }) {
  const buildings = Object.entries(HQ_DEFINITIONS) as Array<[keyof typeof HQ_DEFINITIONS, (typeof HQ_DEFINITIONS)[keyof typeof HQ_DEFINITIONS]]>;
  return <section className="mockup-page mockup-guild-page">
    <div className="mockup-guild-identity"><div className="mockup-guild-banner"><Crown /></div><div><h2>{state.name}</h2><p>Força na união, glória em cada jornada.</p><span><Users />Membros: {state.heroes.length}/30</span><span><Shield />Nível da Guilda: {Math.max(1,Math.floor(state.fame/100)+1)}</span></div><aside><strong><Coins />{fmt(state.gold)} Ouro</strong><strong><Sparkles />{state.fame} Renome</strong><strong><Trophy />Liga {rank(state)}</strong></aside></div>
    {state.event && <section className="mockup-council"><div><span>DECISÃO DO CONSELHO</span><h2>{state.event.title}</h2><p>{state.event.text}</p></div><EventPanel state={state} disabled={disabled} act={act}/></section>}
    <div className="mockup-strip-title dark"><Crown /><h2>Construções da Guilda</h2><span>Salários: {payroll(state)}/semana</span></div>
    <div className="mockup-building-list">{buildings.map(([key,b],idx) => {
      const level = state.hq[key] || 0, cost = hqUpgradeCost(state,key);
      return <article key={key}><div className={"mockup-building-art building-" + idx}><Hammer /></div><div><h3>{b.name} <small>Nv. {level}</small></h3><p>{b.description}</p><strong>Bônus atual: nível {level}</strong></div><div><span><Coins />{cost} Ouro</span><Button disabled={disabled || level >= b.max || state.gold < cost} onClick={() => act({type:"upgrade-hq",building:key})}>{level >= b.max ? "Máximo" : "Melhorar"}</Button></div></article>;
    })}</div>
    <ForgePanel state={state} disabled={disabled} act={act}/>
  </section>;
}
