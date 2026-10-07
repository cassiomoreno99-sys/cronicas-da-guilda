"use client";
import { useMemo, useState } from "react";
import { Castle, Map as MapIcon, Hammer, GraduationCap, Swords, Shield, Coins, LockKeyhole, Users, Trophy, FlaskConical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  HQ_DEFINITIONS, WORLD_MAP, CRAFTING_RECIPES, ITEMS, CLASSES, SQUAD_SPECIALTIES,
  academySlots, available, hqUpgradeCost, rivalPower, squadThreshold,
  type Action, type Campaign, type Hero, type HQBuilding
} from "@/lib/game";

type Props = { state: Campaign; disabled: boolean; act: (action: Action) => void };
const fmt = (n: number) => n.toLocaleString("pt-BR");

export function WorldMapPanel({ state, disabled, act }: Props) {
  return <section className="panel v130-panel world-panel">
    <div className="panel-heading"><div><h2>Mundo conhecido</h2><p>{state.region} de {WORLD_MAP.length} regiões descobertas · operações em {WORLD_MAP[state.activeRegion - 1]?.name}</p></div><MapIcon /></div>
    <div className="world-region-grid">
      {WORLD_MAP.map((region, index) => {
        const number = index + 1, unlocked = number <= state.region, active = number === state.activeRegion;
        return <button key={region.name} className="world-region-card" data-active={active} data-locked={!unlocked} disabled={disabled || !unlocked || active} onClick={() => act({ type: "travel-region", region: number })}>
          <span className="world-region-number">{unlocked ? String(number).padStart(2,"0") : <LockKeyhole />}</span>
          <span><strong>{region.name}</strong><small>Nv. sugerido {region.minLevel}+ · {region.theme}</small></span>
          {active && <em>BASE ATUAL</em>}
        </button>;
      })}
    </div>
  </section>;
}

export function HeadquartersPanel({ state, disabled, act }: Props) {
  const slots = academySlots(state);
  const trainees = new Set(state.academy.trainees);
  const candidates = state.heroes.filter(h => !state.expeditions.some(e => e.battle.status === "active" && e.team.includes(h.id)));
  function toggleTrainee(hero: Hero) {
    const next = new Set(trainees);
    if (next.has(hero.id)) next.delete(hero.id);
    else {
      if (next.size >= slots) return;
      next.add(hero.id);
    }
    act({ type:"academy-trainees", heroIds:[...next] });
  }
  return <div className="v130-stack">
    <section className="panel v130-panel">
      <div className="panel-heading"><div><h2>Quartel-general</h2><p>Invista o ouro da guilda em estruturas permanentes.</p></div><Castle /></div>
      <div className="hq-building-grid">
        {(Object.keys(HQ_DEFINITIONS) as HQBuilding[]).map(key => {
          const spec = HQ_DEFINITIONS[key], level = state.hq[key], cost = hqUpgradeCost(state,key);
          return <article className="hq-building-card" key={key}>
            <div><strong>{spec.name}</strong><span>Nv. {level} / {spec.max}</span></div>
            <p>{spec.description}</p>
            <div className="hq-track">{Array.from({length:spec.max},(_,i)=><i key={i} data-built={i<level} />)}</div>
            <Button size="sm" disabled={disabled || level >= spec.max || state.gold < cost} onClick={() => act({type:"upgrade-hq",building:key})}>
              {level >= spec.max ? "Máximo" : <>Evoluir <span>{fmt(cost)} ouro</span></>}
            </Button>
          </article>;
        })}
      </div>
    </section>

    <section className="panel v130-panel academy-panel">
      <div className="panel-heading"><div><h2>Academia de aventureiros</h2><p>Novatos ganham XP a cada dia enquanto a guilda continua funcionando.</p></div><GraduationCap /></div>
      {slots === 0 ? <div className="v130-empty">Construa a Academia no quartel-general para abrir vagas de aprendizes.</div> :
      <><div className="academy-summary"><strong>{trainees.size} / {slots} aprendizes</strong><span>Mentor: {state.heroes.find(h=>h.id===state.academy.mentorId)?.name || "nenhum"}</span></div>
      <div className="academy-list">{candidates.map(h => <label key={h.id} data-selected={trainees.has(h.id)}>
        <Checkbox checked={trainees.has(h.id)} disabled={disabled || (!trainees.has(h.id) && trainees.size >= slots)} onCheckedChange={() => toggleTrainee(h)} />
        <span><strong>{h.name}</strong><small>{CLASSES[h.class].name} · Nv. {h.level}</small></span>
      </label>)}</div>
      <Select value={state.academy.mentorId || "none"} onValueChange={v => act({type:"academy-mentor",heroId:v==="none"?undefined:v})} disabled={disabled}>
        <SelectTrigger><SelectValue placeholder="Escolher mentor" /></SelectTrigger>
        <SelectContent><SelectItem value="none">Sem mentor</SelectItem>{candidates.filter(h=>h.level>=5).map(h=><SelectItem value={h.id} key={h.id}>{h.name} · Nv. {h.level}</SelectItem>)}</SelectContent>
      </Select></>}
    </section>
  </div>;
}

export function ForgePanel({ state, disabled, act }: Props) {
  const counts = useMemo(() => {
    const map = new Map<string,number>();
    for (const item of state.chest) if (!item.equippedTo) map.set(item.key,(map.get(item.key)||0)+1);
    return map;
  },[state.chest]);
  return <section className="panel v130-panel forge-panel">
    <div className="panel-heading"><div><h2>Forja e criação</h2><p>Transforme materiais de expedição em equipamento. Forja Nv. {state.hq.forge}.</p></div><Hammer /></div>
    {state.hq.forge === 0 ? <div className="v130-empty">Construa a Forja no quartel-general para fabricar equipamentos.</div> :
    <div className="craft-grid">{CRAFTING_RECIPES.map(recipe => {
      const def=ITEMS[recipe.result], enough=Object.entries(recipe.materials).every(([key,qty])=>(counts.get(key)||0)>=qty);
      const unlocked=state.hq.forge>=recipe.forge;
      return <article className="craft-card" key={recipe.id} data-locked={!unlocked}>
        <span className="craft-rarity">{def.rarity.toUpperCase()}</span><h3>{def.name}</h3><p>{def.description}</p>
        <div className="craft-materials">{Object.entries(recipe.materials).map(([key,qty])=><span key={key} data-missing={(counts.get(key)||0)<qty}>{ITEMS[key].name}: {counts.get(key)||0}/{qty}</span>)}</div>
        <Button size="sm" disabled={disabled || !unlocked || !enough || state.gold < recipe.cost} onClick={()=>act({type:"craft",recipeId:recipe.id})}>
          {!unlocked ? "Exige Forja Nv. "+recipe.forge : <><Hammer />Fabricar · {recipe.cost} ouro</>}
        </Button>
      </article>;
    })}</div>}
  </section>;
}

function availableHeroes(state: Campaign) {
  return state.heroes.filter(h=>available(h,state)).sort((a,b)=>b.level-a.level || b.attack+b.defense+b.magic-(a.attack+a.defense+a.magic));
}

export function GuildWarPanel({ state, disabled, act }: Props) {
  const [rivalId,setRivalId]=useState(state.rivals[0]?.id || "");
  const rival=state.rivals.find(r=>r.id===rivalId) || state.rivals[0];
  const ready=availableHeroes(state);
  const direct=ready.slice(0,4).map(h=>h.id);
  const raidHeroes=ready.slice(0,12);
  const raidTeams = raidHeroes.length >= 9 ? [
    raidHeroes.slice(0,3).map(h=>h.id),
    raidHeroes.slice(3,6).map(h=>h.id),
    raidHeroes.slice(6,9).map(h=>h.id),
  ] : [];
  const lastBattle=state.rivalBattleHistory[0], lastRaid=state.raidHistory[0];

  return <div className="v130-stack">
    <section className="panel v130-panel guild-war-panel">
      <div className="panel-heading"><div><h2>Guerra entre guildas</h2><p>Desafie uma das 99 rivais em confronto direto.</p></div><Swords /></div>
      <Select value={rival?.id} onValueChange={setRivalId} disabled={disabled}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{state.rivals.map(g=><SelectItem key={g.id} value={g.id}>{g.name} · Força {rivalPower(g)}</SelectItem>)}</SelectContent></Select>
      {rival && <div className="war-preview"><span><Shield />{rival.name}</span><strong>Força rival {rivalPower(rival)}</strong><small>{rival.heroes.slice(0,5).map(h=>h.name).join(" · ")}</small></div>}
      <Button disabled={disabled || !rival || direct.length<3} onClick={()=>rival && act({type:"rival-battle",guildId:rival.id,team:direct})}><Swords />Batalha direta com os melhores disponíveis</Button>
      {lastBattle && <div className="war-result" data-win={lastBattle.won}><strong>{lastBattle.won?"VITÓRIA":"DERROTA"} contra {lastBattle.rivalName}</strong><span>{lastBattle.playerPower} × {lastBattle.rivalPower} · {lastBattle.reward} ouro</span></div>}
    </section>

    <section className="panel v130-panel raid-panel">
      <div className="panel-heading"><div><h2>Raid de três frentes</h2><p>Portão Principal, Passagem Subterrânea e Torre dos Magos. Uma frente pode facilitar a próxima.</p></div><Trophy /></div>
      <div className="raid-team-preview">{raidTeams.length ? raidTeams.map((team,i)=><div key={i}><strong>Equipe {i+1}</strong><span>{team.map(id=>state.heroes.find(h=>h.id===id)?.name.split(" ")[0]).join(" · ")}</span></div>) : <p>Você precisa de pelo menos 9 heróis disponíveis para atacar em três frentes.</p>}</div>
      <Button disabled={disabled || !rival || raidTeams.length!==3} onClick={()=>rival&&act({type:"guild-raid",rivalId:rival.id,teams:raidTeams})}><Users />Iniciar raid contra {rival?.name}</Button>
      {lastRaid && <div className="raid-result" data-win={lastRaid.won}><strong>{lastRaid.won?"RAID VENCIDA":"RAID PERDIDA"} · {lastRaid.title}</strong>{lastRaid.fronts.map(f=><span key={f.name}>{f.won?"✓":"✕"} {f.name} · {f.playerPower} × {f.enemyPower}</span>)}</div>}
    </section>
  </div>;
}

export function SquadProgressPanel({ state }: { state: Campaign }) {
  return <section className="panel v130-panel squad-progress-panel">
    <div className="panel-heading"><div><h2>Entrosamento das equipes</h2><p>Formações salvas evoluem quando os mesmos heróis lutam juntos.</p></div><Sparkles /></div>
    <div className="squad-progress-grid">{state.squads.map(q=><article key={q.id}><span>{SQUAD_SPECIALTIES[q.specialty].label}</span><strong>{q.name}</strong><small>Nível da equipe {q.level} · {q.wins} vitórias</small><Progress value={q.level>=10?100:q.xp/squadThreshold(q)*100} /><em>{q.level>=10?"Entrosamento máximo":q.xp+" / "+squadThreshold(q)+" XP"}</em></article>)}</div>
  </section>;
}
