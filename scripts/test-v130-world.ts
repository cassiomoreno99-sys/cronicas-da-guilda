import {
  CLASSIC_CLASSES, CLASSES, ITEMS, SLOT_NAMES, MAX_HERO_LEVEL, WORLD_MAP, HQ_DEFINITIONS,
  CRAFTING_RECIPES, ITEM_SET_DEFINITIONS, SCAR_DEFINITIONS,
  activeExpeditions, applyAction, available, availableAbilities, freeExpeditionSlots,
  heroLuck, heroStats, market, missions, newCampaign, normalizeCampaign, threshold,
  type Campaign, type Hero, type HeroClass,
} from "../lib/game.ts";

function ok(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function expectRule(fn: () => unknown, message: string) {
  let failed = false;
  try { fn(); } catch { failed = true; }
  ok(failed, message);
}
function prep(s: Campaign) {
  s.event = null;
  s.gold = 1_000_000_000;
  for (const h of s.heroes) { h.energy = 100; h.injuredUntil = 0; }
  return s;
}
function cloneHero(h: Hero, id: string, name: string): Hero {
  return { ...structuredClone(h), id, name, energy: 100, injuredUntil: 0, xp: 0, scars: [] };
}

console.log("v1.3.0: iniciando bateria ampla...");

// 1) Elenco canônico aprovado, nível 1 e atributos baixos.
{
  const s = newCampaign(1001);
  const expectedClasses = ["ranger","mage","healer","paladin","warrior","rogue","bard"].sort();
  const expectedNames = ["Aric Valen","Lyria Cael","Thorgar Pedraferro","Kaelith Sombria","Eldrin Silvestre","Rhokar Brasavil"];
  ok(s.heroes.length === 6, "Campanha nova deve começar com exatamente os 6 heróis canônicos.");
  ok([...CLASSIC_CLASSES].sort().join(",") === expectedClasses.join(","), "CLASSIC_CLASSES deve manter as 7 classes jogáveis do sistema.");
  ok(s.heroes.map(h => h.name).join("|") === expectedNames.join("|"), "Elenco inicial não corresponde ao roster canônico aprovado.");
  ok(s.heroes.every(h => h.level === 1 && h.xp === 0), "Todo herói inicial deve começar no nível 1 e XP 0.");
  ok(s.heroes.every(h => Math.max(h.attack,h.defense,h.magic) <= 8), "Atributos iniciais ainda estão altos demais.");
  ok(new Set(s.heroes.map(h => h.name)).size === s.heroes.length, "Há nomes repetidos no elenco inicial.");
  ok(CLASSES.bard.name === "Pierrô", "Classe de sorte deve continuar disponível no sistema como Pierrô.");
}

// 2) Habilidades progressivas até nível 50 e Pierrô focado em sorte.
{
  const s = newCampaign(1002);
  for (const h of s.heroes) {
    const lv1 = availableAbilities(h);
    ok(lv1.length >= 1, "Cada classe precisa ter habilidade no nível 1: " + h.class);
    const maxed = { ...h, level: 50 };
    const lv50 = availableAbilities(maxed);
    ok(lv50.length >= 6, "Cada classe clássica precisa abrir pelo menos 6 habilidades até o nível 50: " + h.class);
  }
  const p = s.rivals.flatMap(r => r.heroes).find(h => h.class === "bard")!;
  ok(!!p, "O mundo deve continuar podendo gerar Pierrôs mesmo sem um no elenco inicial.");
  const names = availableAbilities({ ...p, level: 50 }).map(a => a.name).join(" ");
  ok(/Dado|Coelho|Jackpot|Fortuna|Sorte/.test(names), "Pierrô não está com árvore de habilidades centrada em sorte.");
  ok(heroLuck(p, s) > 0, "Pierrô precisa ter sorte de saque positiva.");
}

// 3) Progressão real não ultrapassa nível 50.
{
  let s = prep(newCampaign(1003));
  const id = s.heroes[0].id;
  let guard = 0;
  while (s.heroes.find(h => h.id === id)!.level < MAX_HERO_LEVEL && guard++ < 700) {
    s.event = null; s.day = 1; s.gold = 1_000_000_000;
    s.heroes.find(h => h.id === id)!.energy = 100;
    s = applyAction(s, { type: "train-hero", heroId: id });
  }
  ok(s.heroes.find(h => h.id === id)!.level === 50, "Herói não alcançou nível 50 no teste de progressão.");
  for (let i=0;i<20;i++) {
    s.event = null; s.day = 1; s.gold = 1_000_000_000; s.heroes.find(h => h.id === id)!.energy = 100;
    s = applyAction(s, { type: "train-hero", heroId: id });
  }
  ok(s.heroes.find(h => h.id === id)!.level === 50, "Nível ultrapassou 50.");
  ok(threshold(s.heroes.find(h => h.id === id)!) === Number.POSITIVE_INFINITY, "Threshold do nível máximo deve bloquear progressão extra.");
}

// 4) Mundo grande e contratos por região.
{
  const s = newCampaign(1004);
  ok(WORLD_MAP.length >= 12, "Mapa deve ter pelo menos 12 regiões.");
  ok(new Set(WORLD_MAP.map(r => r.name)).size === WORLD_MAP.length, "Há regiões com nomes repetidos.");
  for (let i=1;i<WORLD_MAP.length;i++) ok(WORLD_MAP[i].minLevel >= WORLD_MAP[i-1].minLevel, "Progressão regional fora de ordem.");
  const unlocked = structuredClone(s); unlocked.region = WORLD_MAP.length; unlocked.activeRegion = WORLD_MAP.length;
  const board = missions(unlocked);
  ok(board.every(m => m.location === WORLD_MAP[WORLD_MAP.length-1].name), "Missões não acompanham a região ativa.");
  expectRule(() => applyAction(s, { type:"travel-region", region:2 }), "Foi possível viajar para região bloqueada.");
}

// 5) Nomes únicos em escala: mercado + 100 guildas.
{
  const s = newCampaign(1005);
  const names = new Set<string>();
  for (const rival of s.rivals) for (const h of rival.heroes) {
    ok(!names.has(h.name), "Nome rival repetido: " + h.name);
    names.add(h.name);
  }
  ok(s.rivals.length === 99, "Liga de 100 deve manter 99 rivais + a guilda do jogador.");
  ok((s.rivals.length + 1) === 100, "Liga precisa ter exatamente 100 guildas no total.");
  for (let week=0;week<200;week++) {
    const t = structuredClone(s); t.day = week*7 + 1;
    for (const h of market(t)) {
      ok(!names.has(h.name), "Nome de mercado repetido no mundo: " + h.name);
      names.add(h.name);
    }
  }
  ok(names.size >= 1200, "Gerador de nomes não produziu variedade suficiente.");
}

// 6-7) Catálogo removido e saves limpos.
{
  ok(Object.keys(ITEMS).length === 0, "O catálogo antigo não foi removido.");
  ok(CRAFTING_RECIPES.length === 0, "As receitas antigas ainda existem.");
  const s = prep(newCampaign(1006));
  ok(s.chest.length === 0, "O novo jogo não deve entregar itens.");
  const old = structuredClone(s); old.chest = [{id:"old-item",key:"iron_sword",equippedTo:old.heroes[0].id}];
  const cleaned = applyAction(old,{type:"rest"});
  ok(cleaned.chest.length === 0, "O save antigo manteve os itens após a atualização.");
}

// Auditoria das missões, eventos persistidos e sistemas de itens aposentados.
{
  let s = prep(newCampaign(1106));
  ok(missions(s).every(m => !m.requiredItem && !/poção|saque|material|equipamento/i.test(m.description + " " + m.flavor)), "Uma missão ainda promete ou exige itens antigos.");
  ok(!/poção|saque|material|equipamento/i.test(missions(s)[0].description), "Existe recompensa antiga no texto da missão.");
  for (const kind of ["map", "caravan"] as const) {
    const old = structuredClone(s);
    old.event = { id: "evento-antigo-" + kind, kind, title: "Promessa antiga", text: "Recebe poção ou mapa", choices: [{ id:"buy", label:"Comprar item", effect:"recebe poção" }] };
    const migrated = normalizeCampaign(old);
    ok(migrated.event?.kind === "village", "Evento antigo com item não foi substituído: " + kind);
    ok(!JSON.stringify(migrated.event).includes("poção"), "Texto de poção permaneceu no Conselho.");
    s = migrated;
  }
  for (const eventSequence of [1,2,3,4,5,6,7]) {
    const next = structuredClone(s);
    next.eventSequence = eventSequence;
    delete (next as Partial<Campaign>).event;
    const spawned = normalizeCampaign(next);
    ok(spawned.event?.kind !== "map" && spawned.event?.kind !== "caravan", "Evento novo ainda pode oferecer itens.");
  }
  expectRule(() => applyAction(s, {type:"upgrade-hq",building:"forge"}), "O jogador ainda pode gastar ouro na Forja vazia.");
  expectRule(() => applyAction(s, {type:"buy",key:"healing_potion"}), "O mercador ainda aceita compra de poção.");
  expectRule(() => applyAction(s, {type:"battle-potion",heroId:s.heroes[0].id}), "Comando de poção antiga ainda está disponível.");
}

// 8) Sede até nível máximo e bloqueio de upgrade extra.
{
  let s = prep(newCampaign(1007));
  for (let i=0;i<5;i++) s = applyAction(s, { type:"upgrade-hq", building:"infirmary" });
  ok(s.hq.infirmary === HQ_DEFINITIONS.infirmary.max, "Enfermaria não atingiu nível máximo.");
  expectRule(() => applyAction(s, { type:"upgrade-hq", building:"infirmary" }), "Foi possível ultrapassar nível máximo da sede.");
}

// 9) Academia desenvolve personagem da sede.
{
  let s = prep(newCampaign(1008));
  s = applyAction(s, { type:"upgrade-hq", building:"academy" });
  const trainee = s.heroes[5];
  s = applyAction(s, { type:"academy-trainees", heroIds:[trainee.id] });
  const before = s.heroes.find(h => h.id === trainee.id)!.xp;
  s.event = null;
  s = applyAction(s, { type:"rest" });
  const afterHero = s.heroes.find(h => h.id === trainee.id)!;
  ok(afterHero.xp > before || afterHero.level > 1, "Academia não concedeu XP ao aprendiz.");
}

// 10) Nenhuma receita antiga permanece disponível.
{
  const s = prep(newCampaign(1009));
  expectRule(() => applyAction(s, { type:"craft", recipeId:"craft-iron-shield" }), "Uma receita removida ainda foi aceita.");
}

// 11) Equipe salva ganha experiência de entrosamento em missão.
{
  let s = prep(newCampaign(1011));
  const team = s.heroes.slice(0,4).map(h => h.id);
  s = applyAction(s, { type:"save-squad", specialty:"escort", name:"Vanguarda Teste", team, tactic:"balanced" });
  for (const h of s.heroes.filter(h => team.includes(h.id))) { h.attack += 40; h.defense += 30; h.magic += 30; }
  const escort = missions(s).find(m => m.kind === "escort")!;
  s.event = null;
  s = applyAction(s, { type:"mission", missionId:escort.id, team, tactic:"balanced", expeditionSlot:1, startedAt:1_700_000_000_000 });
  const expId = s.expeditions[s.expeditions.length-1].id;
  s = applyAction(s, { type:"battle-auto", expeditionId:expId });
  const q = s.squads.find(q => q.specialty === "escort")!;
  ok(q.xp > 0 || q.level > 1, "Equipe pronta não ganhou experiência/entrosamento.");
}

// 12) Três expedições simultâneas e herói não pode duplicar.
{
  let s = prep(newCampaign(1012));
  while (s.heroes.length < 10) {
    const base = s.heroes[s.heroes.length % 6];
    s.heroes.push(cloneHero(base, "multi-"+s.heroes.length, "Teste Único "+s.heroes.length));
  }
  const ids = s.heroes.map(h=>h.id);
  const board = missions(s).slice(0,3);
  const now = 1_700_000_000_000;
  for (let i=0;i<3;i++) {
    s.event = null;
    const team=ids.slice(i*3,i*3+3);
    s = applyAction(s, { type:"mission", missionId:board[i].id, team, tactic:"balanced", expeditionSlot:(i+1) as 1|2|3, startedAt:now });
  }
  ok(activeExpeditions(s).length === 3, "Não manteve 3 expedições simultâneas.");
  ok(freeExpeditionSlots(s).length === 0, "Ainda existe vaga livre com 3 expedições.");
  const deployed=activeExpeditions(s).flatMap(e=>e.team);
  ok(new Set(deployed).size === deployed.length, "Um herói foi duplicado entre expedições.");
  expectRule(() => applyAction(s, { type:"mission", missionId:missions(s)[0].id, team:[ids[9],ids[0],ids[1]], tactic:"balanced", startedAt:now }), "Permitiu quarta expedição.");
}

// 13) Raid com três frentes e batalha direta contra guilda rival.
{
  let s = prep(newCampaign(1013));
  while (s.heroes.length < 10) {
    const base=s.heroes[s.heroes.length%6];
    const h=cloneHero(base,"raid-"+s.heroes.length,"Raid Único "+s.heroes.length);
    h.attack += 25; h.defense += 20; h.magic += 20; s.heroes.push(h);
  }
  for (const h of s.heroes) { h.attack += 20; h.defense += 15; h.magic += 15; }
  const teams=[s.heroes.slice(0,3).map(h=>h.id),s.heroes.slice(3,6).map(h=>h.id),s.heroes.slice(6,9).map(h=>h.id)];
  s.event=null;
  s=applyAction(s,{ type:"guild-raid", teams, rivalId:s.rivals[0].id });
  ok(s.raidHistory.length===1 && s.raidHistory[0].fronts.length===3, "Raid não registrou as três frentes.");

  let r=prep(newCampaign(1014)); for(const h of r.heroes.slice(0,4)){h.attack+=25;h.defense+=20;h.magic+=20;}
  const direct=r.heroes.slice(0,4).map(h=>h.id); r.event=null;
  r=applyAction(r,{ type:"rival-battle", guildId:r.rivals[0].id, team:direct });
  ok(r.rivalBattleHistory.length===1, "Batalha direta contra guilda rival não foi registrada.");
}

// 14) Migração de save antigo: classe aposentada, nível alto e atributos antigos voltam ao balanceamento novo.
{
  const old = newCampaign(1015);
  old.balanceVersion = 0;
  old.heroes[0].class = "monk";
  old.heroes[0].level = 9; old.heroes[0].attack = 40; old.heroes[0].defense = 35; old.heroes[0].magic = 18;
  const migrated = normalizeCampaign(JSON.parse(JSON.stringify(old)));
  ok(migrated.balanceVersion === 4, "Save antigo não recebeu a versão canônica de dados.");
  ok(migrated.heroes.map(h => h.name).join("|") === ["Aric Valen","Lyria Cael","Thorgar Pedraferro","Kaelith Sombria","Eldrin Silvestre","Rhokar Brasavil"].join("|"), "Save antigo não foi migrado para o elenco canônico.");
  ok(migrated.heroes[0].level === 1 && migrated.heroes[0].attack <= 8, "Save antigo não foi rebalanceado para nível 1/status baixo.");
}

// 15) Round-trip JSON preserva os novos sistemas.
{
  let s=prep(newCampaign(1016)); s.hq.forge=2; s.academy.trainees=[s.heroes[0].id]; s.region=4; s.activeRegion=3;
  const restored=normalizeCampaign(JSON.parse(JSON.stringify(s)));
  ok(restored.hq.forge===2 && restored.activeRegion===3 && restored.balanceVersion===4, "Backup JSON perdeu dados v1.3.");
}

// 16) Stress: várias campanhas, dezenas de dias, batalhas, descanso e mercado.
{
  let battles=0;
  for(let seed=2000;seed<2030;seed++){
    let s=prep(newCampaign(seed));
    for(let cycle=0;cycle<35;cycle++){
      s.event=null; s.gold=1_000_000_000;
      for(const h of s.heroes){ if(h.injuredUntil<=s.day) h.energy=Math.max(h.energy,40); }
      let ready=s.heroes.filter(h=>available(h,s)).slice(0,4);
      if(ready.length<3){ s.event=null; s=applyAction(s,{type:"rest"}); continue; }
      const m=missions(s)[0];
      const team=ready.slice(0,Math.min(4,ready.length)).map(h=>h.id);
      s=applyAction(s,{type:"mission",missionId:m.id,team,tactic:"balanced",expeditionSlot:1,startedAt:1_700_000_000_000+cycle*100000});
      const id=s.expeditions[s.expeditions.length-1].id;
      s=applyAction(s,{type:"battle-auto",expeditionId:id}); battles++;
      ok(Number.isFinite(s.gold)&&Number.isFinite(s.fame)&&s.heroes.every(h=>h.level>=1&&h.level<=50), "Estado inválido no stress seed "+seed);
      ok(market(s).every(h=>h.level>=1&&h.level<=50), "Mercado gerou nível inválido.");
    }
  }
  ok(battles>=800, "Stress executou poucas batalhas: "+battles);
}

console.log("v1.3.0: TODOS OS TESTES DE LÓGICA PASSARAM.");
