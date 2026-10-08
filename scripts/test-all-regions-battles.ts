import {
  ITEMS, CRAFTING_RECIPES, WORLD_MAP, applyAction, newCampaign, normalizeCampaign,
  missions, seasonBoss, shop, type Campaign, type Mission, type Tactic
} from "../lib/game.ts";

const seasons = [1, 4, 10] as const;
const outcomes = ["powered-win", "forced-loss", "retreat", "natural"] as const;
const tactics: Tactic[] = ["balanced", "aggressive", "defensive"];
const casesPerMission = seasons.length * outcomes.length;
const types = new Set<string>();
const byRegion: Record<string, { battles: number; wins: number; losses: number; retreats: number; natural: number; bosses: number }> = {};
const counter = { battles: 0, wins: 0, losses: 0, retreats: 0, natural: 0, bosses: 0,
  offers: 0, migrations: 0, rejected: 0, raids: 0, simultaneous: 0, journeys: 0,
  textFailures: 0 };
const forbidden = /poção|pocao|\bmapa\b|\bitens?\b|\bequipamentos?\b|\bsaque\b|\bconsum[ií]ve(?:l|is)\b/i;
function assert(value: unknown, reason: string): asserts value { if (!value) throw new Error("AUDITORIA_MULTI_REGIAO: " + reason); }
function empty(s: Campaign, label: string) {
  assert(s.chest.length === 0, label + " inventário voltou a ter itens");
  assert(shop(s).length === 0, label + " loja voltou a vender itens");
  assert(s.expeditions.every(e => (e.battle.loot || []).length === 0), label + " expedições com saque");
  assert(s.journeys.every(e => e.loot.length === 0), label + " viagens com saque");
  assert(s.raidHistory.every(e => e.loot.length === 0), label + " raids com saque");
  assert((s.lastBattle?.loot || []).length === 0, label + " última batalha com saque");
}
function reject(action: Parameters<typeof applyAction>[1], label: string, src: Campaign) {
  let rejected=false;
  try { applyAction(src,action); } catch { rejected=true; }
  assert(rejected, label + " foi aceita");
  counter.rejected++;
}
function scenario(regionIndex: number, season: number, missionIndex: number, outcome: typeof outcomes[number]) {
  const region = WORLD_MAP[regionIndex];
  // Desbloqueio injetado somente na simulação: o combate usa o motor real.
  let s = newCampaign(456000 + regionIndex * 101 + season * 11 + missionIndex * 7 + outcomes.indexOf(outcome));
  s.region = WORLD_MAP.length;
  s.activeRegion = regionIndex + 1;
  s.season = season;
  s.day = 1 + 28 * (season-1) + 20; // dia 21: chefe regional elegível
  s.bossSeasons = [];
  s.event = null;
  s.fame = 50_000;
  s.gold = 500_000;
  for (const h of s.heroes) {
    h.energy=100;
    h.injuredUntil=0;
    if (outcome === "powered-win") {
      h.level=50; h.attack=150_000; h.magic=150_000; h.defense=80_000;
    }
  }
  const board = missions(s);
  const boss = seasonBoss(s);
  assert(board.length===5 && boss, "não gerou 5 missões + chefe em " + region.name);
  const m: Mission = missionIndex === 5 ? boss : board[missionIndex];
  assert(m.location===region.name, "missão apontou para outra região");
  assert(!m.requiredItem, "missão exige um item removido " + m.title);
  assert(!forbidden.test([m.title,m.description,m.flavor].join(" ")), "texto promete item: " + m.title);
  types.add(m.kind);
  counter.offers++;
  const label = region.name + "/temporada " + season + "/" + m.title + "/" + outcome;
  const teamSize = ((regionIndex+season+missionIndex) % 2) ? 3 : 4;
  const team = s.heroes.slice(0,teamSize).map(h=>h.id);
  const tactic = tactics[(regionIndex+season+missionIndex)%tactics.length];
  s=applyAction(s,{type:"mission",missionId:m.id,team,tactic,expeditionSlot:1,startedAt:1700000000000});
  empty(s, label + " início");
  const id=s.expeditions.at(-1)!.id;
  const e=s.expeditions.find(e=>e.id===id)!;
  if (outcome==="forced-loss") {
    for (const f of e.battle.combat!.fighters.filter(f=>f.side==="hero")) f.hp=0;
  }
  if (outcome==="retreat") s=applyAction(s,{type:"battle-retreat",expeditionId:id});
  else s=applyAction(s,{type:"battle-auto",expeditionId:id});
  const done=s.expeditions.find(e=>e.id===id)!.battle;
  assert(done.status !== "active", label+" batalha não terminou");
  assert((done.loot||[]).length === 0,label+" recebeu itens");
  if (outcome==="powered-win") assert(done.status==="won",label+" heróis fortalecidos não venceram");
  if (outcome==="forced-loss") assert(done.status==="lost",label+" derrota injetada não ocorreu");
  if (outcome==="retreat") assert(done.status==="retreated",label+" retirada não ocorreu");
  if (done.status==="won") {
    assert(done.reward===m.reward,label+" ouro não condiz com recompensa");
    counter.wins++;
  } else if (done.status==="lost") {
    assert(done.reward===0,label+" derrota pagou recompensa");
    counter.losses++;
  } else if (done.status==="retreated") {
    assert(done.reward===0,label+" retirada pagou recompensa");
    counter.retreats++;
  }
  const stats=byRegion[region.name];
  stats.battles++; if(done.status==="won")stats.wins++; if(done.status==="lost")stats.losses++;
  if(done.status==="retreated")stats.retreats++;
  if(outcome==="natural") {stats.natural++;counter.natural++;}
  if(m.kind==="boss"){stats.bosses++;counter.bosses++;}
  empty(s,label+" conclusão");
  // Cópia JSON reproduz o formato exportado e importado pelo jogo.
  const save=normalizeCampaign(JSON.parse(JSON.stringify(s)));
  empty(save,label+" save JSON");
  counter.battles++;
}
function migrated() {
  for (const kind of ["map","caravan"] as const) {
    for (const regionIndex of [0,5,11]) {
      const s=newCampaign(80000+regionIndex);
      s.region=12;s.activeRegion=regionIndex+1;
      s.chest=[{id:"old-1",key:"healing_potion"},{id:"old-2",key:"iron_sword",equippedTo:s.heroes[0].id}];
      s.event={id:"council-legacy",kind,title:"Antigo",text:"Receber poção",choices:[{id:"return",label:"Poção",effect:"Recebe uma poção"}]};
      s.journeys=[{id:"journey-old",heroId:s.heroes[4].id,startedDay:1,duration:3,remaining:2,choice:"camp",xpEarned:0,loot:["ancient_key"]}];
      const a=normalizeCampaign(JSON.parse(JSON.stringify(s)));
      empty(a,"importação legada");
      assert(a.event?.kind==="village","evento antigo não foi convertido: "+kind);
      assert(!forbidden.test(JSON.stringify(a.event)),"evento migrado ainda fala de poção");
      assert(a.chest.length===0 && a.journeys[0].loot.length===0,"save legado mantém itens");
      counter.migrations++;
    }
  }
}
function retiredCommands() {
  const s=newCampaign(87005);
  const tests: Array<[Parameters<typeof applyAction>[1],string]> = [
    [{type:"buy",key:"healing_potion"},"compra"],
    [{type:"craft",recipeId:"craft-iron-sword"},"forja"],
    [{type:"equip",itemId:"old",heroId:s.heroes[0].id},"equipar"],
    [{type:"unequip",itemId:"old"},"desequipar"],
    [{type:"sell",itemId:"old"},"venda"],
    [{type:"battle-potion",heroId:s.heroes[0].id},"poção em batalha"],
    [{type:"battle-consumable",key:"antidote",targetId:s.heroes[0].id},"consumível"],
    [{type:"upgrade-hq",building:"forge"},"melhoria forja"]
  ];
  for(const [action,label] of tests) reject(action,label,s);
}
function journeys() {
  for(const duration of [3,5,7] as const) for(const choice of ["camp","explore","shortcut"] as const) {
    let s=newCampaign(89000+duration);
    s.event=null; s.gold=50000;
    const heroId=s.heroes[5].id;
    s=applyAction(s,{type:"start-journey",heroId,duration});
    assert(s.journeys.length===1,"viagem não iniciou");
    s=applyAction(s,{type:"journey-choice",journeyId:s.journeys[0].id,choice});
    for(let k=0;k<duration+1 && s.journeys.length;k++) {
      s.event=null; s=applyAction(s,{type:"rest"});
      empty(s,"viagem "+duration+"/"+choice+"/dia "+k);
    }
    assert(s.journeys.length===0,"viagem não terminou "+duration+"/"+choice);
    counter.journeys++;
  }
}
function raids() {
  for(let regionIndex=0;regionIndex<WORLD_MAP.length;regionIndex++){
    let s=newCampaign(90000+regionIndex);s.event=null;
    s.region=WORLD_MAP.length;s.activeRegion=regionIndex+1;s.gold=50000;
    while(s.heroes.length<10){const h=structuredClone(s.heroes[s.heroes.length%6]);h.id="audit-extra-"+s.heroes.length;h.name="Auditoria "+s.heroes.length;s.heroes.push(h);}
    const teams=[0,3,6].map(x=>s.heroes.slice(x,x+3).map(h=>h.id));
    s=applyAction(s,{type:"guild-raid",teams});
    assert(s.raidHistory.length===1 && s.raidHistory[0].loot.length===0,"raid gerou itens na região "+regionIndex);
    empty(s,"raid "+WORLD_MAP[regionIndex].name);counter.raids++;
  }
}
function simultaneous() {
  for (let regionIndex=0;regionIndex<WORLD_MAP.length;regionIndex++) {
    let s=newCampaign(91000+regionIndex);s.region=12;s.activeRegion=regionIndex+1;s.gold=50000;s.fame=10000;s.event=null;
    while(s.heroes.length<10){const h=structuredClone(s.heroes[s.heroes.length%6]);h.id="exp-extra-"+s.heroes.length;h.name="Hero Extra "+s.heroes.length;s.heroes.push(h);}
    const list=missions(s);
    for(let slot=1;slot<=3;slot++) {
      const team=s.heroes.slice((slot-1)*3,slot*3).map(h=>h.id);
      s=applyAction(s,{type:"mission",missionId:list[slot-1].id,team,tactic:"balanced",expeditionSlot:slot as 1|2|3,startedAt:1700000000000});
    }
    assert(s.expeditions.filter(e=>e.battle.status==="active").length===3,"não abriu 3 expedições na região");
    for(const e of s.expeditions.filter(e=>e.battle.status==="active")) {
      s=applyAction(s,{type:"battle-auto",expeditionId:e.id});
      empty(s,"expedições simultâneas "+regionIndex);
    }
    counter.simultaneous++;
  }
}

assert(WORLD_MAP.length===12,"quantidade de regiões mudou");
assert(Object.keys(ITEMS).length===0 && CRAFTING_RECIPES.length===0,"catálogo antigo não está vazio");
for(const region of WORLD_MAP) byRegion[region.name]={battles:0,wins:0,losses:0,retreats:0,natural:0,bosses:0};
for(let regionIndex=0;regionIndex<WORLD_MAP.length;regionIndex++)
  for(const season of seasons)
    for(let missionIndex=0;missionIndex<=5;missionIndex++)
      for(const outcome of outcomes) scenario(regionIndex,season,missionIndex,outcome);
migrated();retiredCommands();journeys();raids();simultaneous();
assert(counter.battles===WORLD_MAP.length*6*casesPerMission,"não houve cobertura total de região/missão/temporada/desfecho");
assert(counter.bosses===WORLD_MAP.length*seasons.length*outcomes.length,"faltou chefe na matriz");
assert(["escort","defense","dungeon","hunt","boss"].every(x=>types.has(x)),"tipo de missão sem teste");
assert(Object.values(byRegion).every(x=>x.wins>0&&x.losses>0&&x.retreats>0&&x.natural>0&&x.bosses>0),"região ficou sem desfecho");
console.log("AUDITORIA_REGIOES_COMBATES "+JSON.stringify({
  regioes:WORLD_MAP.length,temporadasTestadas:seasons,batalhas:counter.battles,
  chefes:counter.bosses,vitorias:counter.wins,derrotas:counter.losses,retiradas:counter.retreats,
  batalhasNaturais:counter.natural,migracoesDeSaves:counter.migrations,
  comandosAntigosRejeitados:counter.rejected,viagens:counter.journeys,raids:counter.raids,
  testesTresExpedicoes:counter.simultaneous,tiposDeMissao:[...types].sort(),
  itensOuPocoesEncontrados:0,porRegiao:byRegion
}));
