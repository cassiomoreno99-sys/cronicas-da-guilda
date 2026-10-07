import { CLASSIC_CLASS_IDS, V130_BASE_STATS, WORLD_REGIONS, HQ_BUILDINGS, HERO_SCARS, LEVEL_ABILITIES, V130_ITEMS, ITEM_SETS, CRAFT_RECIPES, uniqueAdventurerName } from "./v130-content";
export type HeroClass = "warrior" | "mage" | "healer" | "rogue" | "ranger" | "paladin" | "monk" | "necromancer" | "druid" | "bard";
export type HeroRace = "human" | "elf" | "dwarf" | "orc" | "beastkin" | "umbral";
export type Tactic = "balanced" | "aggressive" | "defensive";
export type TalentPath = "offense" | "healing" | "defense";
export type EvolutionBranch = "a" | "b";
export type FormationLine = "front" | "back";
export type LeagueTier = 1 | 2 | 3;
export type HeroTalent = { path: TalentPath; rank: number; branch?: EvolutionBranch };
export type RacialPath = "heritage" | "spirit" | "war";
export type HeroRacialTalent = { path: RacialPath; rank: number };
export type StoryStage = 0 | 1 | 2 | 3;
export type JourneyDuration = 3 | 5 | 7;
export type JourneyChoice = "camp" | "explore" | "shortcut";
export type HeroJourney = { id: string; heroId: string; startedDay: number; duration: JourneyDuration; remaining: number; choice: JourneyChoice; xpEarned: number; loot: string[] };
export type Hero = { id: string; name: string; class: HeroClass; race?: HeroRace; level: number; attack: number; defense: number; magic: number; energy: number; xp: number; salary: number; value: number; trait: string; injuredUntil: number; talent?: HeroTalent; racial?: HeroRacialTalent; storyStage?: StoryStage; storyAbilityUnlocked?: boolean; scars?: string[] };
export type Ledger = { id: number; day: number; label: string; amount: number };
export type ItemSlot = "weapon" | "offhand" | "helmet" | "armor" | "gloves" | "boots" | "accessory" | "consumable" | "material" | "quest" | "treasure";
export type ItemDef = { name: string; slot: ItemSlot; race?: HeroRace; rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"; value: number; description: string; attack?: number; defense?: number; magic?: number; hp?: number; speed?: number; critical?: number; luck?: number; set?: string; classes?: HeroClass[]; levelReq?: number; material?: string };
export type ChestItem = { id: string; key: string; equippedTo?: string };
export type EventChoice = { id: string; label: string; effect: string; cost?: number };
export type GuildEvent = { id: string; kind: "village" | "offer" | "map" | "caravan" | "retaliation"; title: string; text: string; heroId?: string; rivalId?: string; choices: EventChoice[] };
export type RivalHero = Hero & { loyalty: number };
export type RivalGuild = { id: string; name: string; points: number; victories: number; strength: number; heroes: RivalHero[]; recruitSequence: number };
export type NegotiationMode = "transfer" | "offer" | "covert";
export type NegotiationResult = { id: number; day: number; guildId: string; guildName: string; heroId: string; heroName: string; mode: NegotiationMode; success: boolean; cost: number; chance: number; fameChange: number; salary: number; message: string };
export type StatusKind = "bleed" | "poison" | "stun" | "shield" | "regen" | "taunt" | "inspired" | "vulnerable";
export type CombatStatus = { kind: StatusKind; rounds: number; amount?: number; sourceId?: string };
export type BattleLog = { round: number; text: string; kind: "hit" | "heal" | "critical" | "fall" | "order" | "ability" | "status"; actorId?: string; targetId?: string; targetHp?: number; amount?: number; objectiveHp?: number };
export type BattleFighter = { id: string; name: string; side: "hero" | "enemy"; class?: HeroClass; hp: number; maxHp: number; position?: FormationLine; statuses?: CombatStatus[] };
type Combatant = BattleFighter & { attack: number; defense: number; magic: number; speed: number; critical: number; energy: number; healing: number; guarding: number; statuses: CombatStatus[] };
export type AbilityTarget = "self" | "ally" | "enemy" | "all-allies" | "all-enemies";
export type AbilityEffect = "challenge" | "fireball" | "restore" | "venom" | "pinning" | "aegis" | "chi" | "drain" | "renew" | "anthem" | "execution" | "storm" | "lifebloom" | "sanctuary" | "fortress" | "control";
export type AbilitySpec = { id: string; name: string; description: string; target: AbilityTarget; cooldown: number; effect: AbilityEffect; evolved?: boolean };
export type PendingAbility = { heroId: string; abilityId: string; targetId?: string };
export type MissionKind = "escort" | "defense" | "dungeon" | "hunt" | "boss";
export type Mission = { id: string; title: string; location: string; description: string; rank: number; force: number; reward: number; enemy: string; count: number; specialty: string; flavor: string; kind: MissionKind; requiredFame: number; requiredItem?: string; boss?: number };
type Combat = { mission: Mission; fighters: Combatant[]; tactic: Tactic; lastTactic: Tactic; fatigueTotal: number; potionsUsed: number; pendingPotion?: { targetId: string }; pendingAbilities: PendingAbility[]; abilityCooldowns: Record<string, number>; autoAbilities?: boolean; formation: Record<string, FormationLine>; objectiveHp: number; objectiveMax: number; targetRounds: number };
export type Battle = { title: string; day: number; won: boolean; reward: number; xp: number; rounds: number; log: BattleLog[]; levelUps: string[]; wounded: string[]; remaining: number; fighters?: BattleFighter[]; status?: "active" | "won" | "lost" | "retreated"; combat?: Combat; loot?: string[]; fameChange?: number; regionUnlocked?: number; objective?: { name: string; hp: number; maxHp: number; targetRounds: number } };
export type ExpeditionSlot = 1 | 2 | 3;
export type SavedSquad = { id: string; name: string; specialty: MissionKind; team: string[]; formation: Record<string, FormationLine>; tactic: Tactic; level: number; xp: number; wins: number };
export type HQBuilding = keyof typeof HQ_BUILDINGS;
export type AcademyState = { trainees: string[]; mentorId?: string };
export type GuildRaidResult = { id: string; day: number; rivalId?: string; title: string; teams: string[][]; fronts: { name: string; won: boolean; playerPower: number; enemyPower: number }[]; won: boolean; reward: number; loot: string[] };
export type RivalBattleResult = { id: string; day: number; rivalId: string; rivalName: string; playerPower: number; rivalPower: number; won: boolean; reward: number; fameChange: number };
export type Expedition = { id: string; slot: ExpeditionSlot; team: string[]; formation: Record<string, FormationLine>; tactic: Tactic; battle: Battle; startedDay: number; nextRoundAt: number };
export type LeagueResult = "win" | "draw" | "loss";
export type LeagueMatch = { season: number; day: number; opponentId: string; opponentName: string; playerScore: number; opponentScore: number; result: LeagueResult; playerPower: number; opponentPower: number; rivalry: boolean; cup?: boolean; stage?: string };
export type Rivalry = { guildId: string; heat: number; sinceSeason: number; lastReason: string };
export type CupStage = "oitavas" | "quartas" | "semifinal" | "final" | "champion" | "eliminated";
export type CupState = { season: number; stage: CupStage; wins: number; history: LeagueMatch[] };
export type Campaign = { schema: 1; name: string; day: number; season: number; gold: number; fame: number; points: number; wins: number; losses: number; arsenal: number; heroes: Hero[]; team: string[]; formation: Record<string, FormationLine>; tactic: Tactic; hired: string[]; rivals: RivalGuild[]; ledger: Ledger[]; journal: { day: number; text: string }[]; lastBattle: Battle | null; rng: number; transaction: number; chest: ChestItem[]; itemSequence: number; event: GuildEvent | null; nextEventDay: number; eventSequence: number; region: number; activeRegion: number; bossSeasons: number[]; shopPurchases: string[]; rivalAttempts: string[]; lastNegotiation: NegotiationResult | null; leagueTier: LeagueTier; leagueWins: number; leagueDraws: number; leagueLosses: number; leagueHistory: LeagueMatch[]; rivalries: Rivalry[]; cup: CupState; journeys: HeroJourney[]; journeySequence: number; expeditions: Expedition[]; expeditionSequence: number; hqActionDay: Record<string, number>; squads: SavedSquad[]; balanceVersion: number; hq: Record<HQBuilding, number>; academy: AcademyState; raidHistory: GuildRaidResult[]; rivalBattleHistory: RivalBattleResult[] };
export type Action =
  | { type: "mission"; missionId: string; team: string[]; tactic: Tactic; formation?: Record<string, FormationLine>; startedAt?: number; expeditionSlot?: ExpeditionSlot }
  | { type: "save-squad"; specialty: MissionKind; name: string; team: string[]; tactic: Tactic; formation?: Record<string, FormationLine> }
  | { type: "rename-squad"; specialty: MissionKind; name: string }
  | { type: "upgrade-hq"; building: HQBuilding }
  | { type: "academy-trainees"; heroIds: string[] }
  | { type: "academy-mentor"; heroId?: string }
  | { type: "travel-region"; region: number }
  | { type: "craft"; recipeId: string }
  | { type: "guild-raid"; rivalId?: string; teams: string[][] }
  | { type: "rival-battle"; guildId: string; team: string[] }
  | { type: "expedition-tick"; now: number }
  | { type: "battle-round"; expeditionId?: string } | { type: "battle-auto"; expeditionId?: string } | { type: "battle-retreat"; expeditionId?: string }
  | { type: "battle-tactic"; tactic: Tactic; expeditionId?: string } | { type: "battle-potion"; heroId: string; expeditionId?: string }
  | { type: "battle-ability"; heroId: string; abilityId: string; targetId?: string; expeditionId?: string }
  | { type: "event"; eventId: string; choiceId: string }
  | { type: "equip"; itemId: string; heroId: string } | { type: "unequip"; itemId: string }
  | { type: "sell"; itemId: string } | { type: "buy"; key: string }
  | { type: "specialize"; heroId: string; path: TalentPath; branch?: EvolutionBranch }
  | { type: "racial-specialize"; heroId: string; path: RacialPath }
  | { type: "story-step"; heroId: string }
  | { type: "start-journey"; heroId: string; duration: JourneyDuration }
  | { type: "journey-choice"; journeyId: string; choice: JourneyChoice }
  | { type: "rest" } | { type: "train"; team: string[]; tactic: Tactic }
  | { type: "train-hero"; heroId: string }
  | { type: "hire"; heroId: string } | { type: "release"; heroId: string }
  | { type: "negotiate-rival"; guildId: string; heroId: string; mode: NegotiationMode }
  | { type: "upgrade" } | { type: "rename"; name: string } | { type: "reset" };
export class GameRuleError extends Error {}
function requireRule(condition: unknown, message: string): asserts condition { if (!condition) throw new GameRuleError(message); }
export const RACES: Record<HeroRace, { name: string; short: string; description: string }> = {
  human: { name: "Humano", short: "HU", description: "Versátil e adaptável. Usa equipamentos da tradição dos reinos." },
  elf: { name: "Elfo", short: "EL", description: "Ágil e afinado com magia. Usa armas lunares e armaduras leves." },
  dwarf: { name: "Anão", short: "AN", description: "Resistente e forjado para a linha de frente. Usa metal e runas." },
  orc: { name: "Orc", short: "OR", description: "Brutal e resistente. Prefere armas pesadas e proteção tribal." },
  beastkin: { name: "Bestial", short: "BE", description: "Instintivo e veloz. Usa garras, couro e totens de caça." },
  umbral: { name: "Sombrio", short: "SO", description: "Ligado às sombras e à magia obscura. Usa lâminas e mantos umbrais." },
};
const CLASS_RACE_POOLS: Record<HeroClass, HeroRace[]> = {
  warrior: ["human", "dwarf", "orc"], mage: ["elf", "umbral", "human"], healer: ["elf", "human"], rogue: ["umbral", "beastkin", "human"], ranger: ["elf", "beastkin"],
  paladin: ["human", "dwarf"], monk: ["beastkin", "human"], necromancer: ["umbral", "human"], druid: ["beastkin", "elf"], bard: ["human", "elf"],
};
export function heroRace(hero: Pick<Hero, "class" | "race" | "id" | "name">): HeroRace {
  if (hero.race) return hero.race;
  const pool = CLASS_RACE_POOLS[hero.class];
  let n = 0; for (const c of (hero.id || hero.name)) n = (n * 33 + c.charCodeAt(0)) >>> 0;
  return pool[n % pool.length];
}
export const RACE_GEAR: Record<HeroRace, { weapon: string; armor: string }> = {
  human: { weapon: "human_vanguard_blade", armor: "human_royal_guard" },
  elf: { weapon: "elf_moonbow", armor: "elf_leafmail" },
  dwarf: { weapon: "dwarf_runic_hammer", armor: "dwarf_stoneplate" },
  orc: { weapon: "orc_warcleaver", armor: "orc_boneguard" },
  beastkin: { weapon: "beast_hunter_claws", armor: "beast_hideguard" },
  umbral: { weapon: "umbral_soul_scythe", armor: "umbral_nightshroud" },
};
export const CLASSES: Record<HeroClass, { name: string; role: string; short: string; color: string; description: string }> = {
  warrior: { name: "Guerreiro", role: "Linha de frente", short: "GR", color: "#d49779", description: "Força física, defesa e controle da linha de frente." },
  mage: { name: "Mago", role: "Magia", short: "MG", color: "#b6a1e5", description: "Dano arcano, controle e ataques em área." },
  healer: { name: "Sacerdote", role: "Cura e suporte", short: "SC", color: "#8fc7ad", description: "Cura, bênçãos e proteção da equipe." },
  rogue: { name: "Assassino", role: "Crítico e velocidade", short: "AS", color: "#d1b476", description: "Ataques rápidos, veneno e execução de alvos." },
  ranger: { name: "Arqueiro", role: "Dano à distância", short: "AR", color: "#9bc2d3", description: "Precisão, caça e controle à distância." },
  paladin: { name: "Cavaleiro", role: "Defesa e fé", short: "CV", color: "#bfc7d8", description: "Armadura pesada, proteção e golpes sagrados." },
  bard: { name: "Pierrô", role: "Sorte e saque", short: "PI", color: "#dec394", description: "Manipula a sorte, aumenta chances de drop e cria efeitos imprevisíveis." },
  monk: { name: "Monge (legado)", role: "Classe aposentada", short: "MN", color: "#e1b181", description: "Convertido para Guerreiro nos saves da v1.3." },
  necromancer: { name: "Necromante (legado)", role: "Classe aposentada", short: "NC", color: "#c4a3d9", description: "Convertido para Mago nos saves da v1.3." },
  druid: { name: "Druida (legado)", role: "Classe aposentada", short: "DR", color: "#a1cda0", description: "Convertido para Sacerdote nos saves da v1.3." },
};
export const CLASSIC_CLASSES = CLASSIC_CLASS_IDS as readonly HeroClass[];
export const TACTICS: Record<Tactic, { name: string; description: string; damage: number; incoming: number; fatigue: number }> = {
  balanced: { name: "Equilibrada", description: "Ataque e proteção na medida. Gasta 22 de energia.", damage: 1, incoming: 1, fatigue: 22 },
  aggressive: { name: "Ofensiva", description: "+25% de dano, +20% de dano recebido. Gasta 30 de energia.", damage: 1.25, incoming: 1.2, fatigue: 30 },
  defensive: { name: "Defensiva", description: "−25% de dano, −20% de dano recebido. Gasta 16 de energia.", damage: .75, incoming: .8, fatigue: 16 },
};
export const ITEMS: Record<string, ItemDef> = {
  iron_sword: { name: "Espada de ferro", slot: "weapon", rarity: "common", value: 24, attack: 5, description: "+5 ataque." },
  oak_staff: { name: "Cajado de carvalho", slot: "weapon", rarity: "common", value: 24, magic: 6, description: "+6 magia." },
  leather_armor: { name: "Armadura de couro", slot: "armor", rarity: "common", value: 22, defense: 5, description: "+5 defesa." },
  hunter_bow: { name: "Arco do caçador", slot: "weapon", rarity: "uncommon", value: 58, attack: 10, critical: .05, description: "+10 ataque e +5% de chance de crítico." },
  runic_staff: { name: "Cajado rúnico", slot: "weapon", rarity: "uncommon", value: 62, magic: 12, description: "+12 magia." },
  sentinel_armor: { name: "Armadura da sentinela", slot: "armor", rarity: "uncommon", value: 58, defense: 10, hp: 15, description: "+10 defesa e +15 vida." },
  swift_boots: { name: "Botas do explorador", slot: "accessory", rarity: "uncommon", value: 48, speed: 7, defense: 3, description: "+7 velocidade e +3 defesa." },
  amber_ring: { name: "Anel de âmbar", slot: "accessory", rarity: "rare", value: 82, magic: 9, defense: 5, description: "+9 magia e +5 defesa." },
  dawn_blade: { name: "Lâmina da aurora", slot: "weapon", rarity: "epic", value: 145, attack: 19, magic: 7, description: "+19 ataque e +7 magia." },
  ash_staff: { name: "Cajado de Ashen", slot: "weapon", rarity: "epic", value: 145, magic: 23, description: "+23 magia." },
  ancient_armor: { name: "Couraça ancestral", slot: "armor", rarity: "epic", value: 140, defense: 17, hp: 40, description: "+17 defesa e +40 vida." },
  dragon_fang: { name: "Presa do dragão", slot: "weapon", rarity: "legendary", value: 240, attack: 29, critical: .08, description: "+29 ataque e +8% de chance de crítico." },
  star_pendant: { name: "Pingente estelar", slot: "accessory", rarity: "legendary", value: 230, magic: 19, hp: 45, description: "+19 magia e +45 vida." },
  human_vanguard_blade: { name: "Espada da Vanguarda", slot: "weapon", race: "human", rarity: "rare", value: 105, attack: 14, critical: .03, description: "Humano · +14 ataque e +3% crítico." },
  human_royal_guard: { name: "Couraça Real", slot: "armor", race: "human", rarity: "rare", value: 105, defense: 12, hp: 24, description: "Humano · +12 defesa e +24 vida." },
  elf_moonbow: { name: "Arco Lunar Élfico", slot: "weapon", race: "elf", rarity: "rare", value: 108, attack: 10, magic: 8, critical: .04, description: "Elfo · +10 ataque, +8 magia e +4% crítico." },
  elf_leafmail: { name: "Malha de Folhas", slot: "armor", race: "elf", rarity: "rare", value: 104, defense: 9, speed: 8, description: "Elfo · +9 defesa e +8 velocidade." },
  dwarf_runic_hammer: { name: "Martelo Rúnico Anão", slot: "weapon", race: "dwarf", rarity: "rare", value: 110, attack: 16, defense: 2, description: "Anão · +16 ataque e +2 defesa." },
  dwarf_stoneplate: { name: "Placa de Pedra Anã", slot: "armor", race: "dwarf", rarity: "rare", value: 112, defense: 15, hp: 34, description: "Anão · +15 defesa e +34 vida." },
  orc_warcleaver: { name: "Cutelo de Guerra Orc", slot: "weapon", race: "orc", rarity: "rare", value: 112, attack: 18, description: "Orc · +18 ataque." },
  orc_boneguard: { name: "Guarda de Osso Orc", slot: "armor", race: "orc", rarity: "rare", value: 108, defense: 13, hp: 30, description: "Orc · +13 defesa e +30 vida." },
  beast_hunter_claws: { name: "Garras do Caçador Bestial", slot: "weapon", race: "beastkin", rarity: "rare", value: 108, attack: 13, speed: 8, critical: .03, description: "Bestial · +13 ataque, +8 velocidade e +3% crítico." },
  beast_hideguard: { name: "Couro Totêmico Bestial", slot: "armor", race: "beastkin", rarity: "rare", value: 104, defense: 10, speed: 6, hp: 15, description: "Bestial · +10 defesa, +6 velocidade e +15 vida." },
  umbral_soul_scythe: { name: "Foice da Alma Sombria", slot: "weapon", race: "umbral", rarity: "rare", value: 112, attack: 7, magic: 17, critical: .03, description: "Sombrio · +7 ataque, +17 magia e +3% crítico." },
  umbral_nightshroud: { name: "Manto da Noite Sombria", slot: "armor", race: "umbral", rarity: "rare", value: 108, defense: 10, magic: 10, hp: 18, description: "Sombrio · +10 defesa, +10 magia e +18 vida." },
  healing_potion: { name: "Poção de cura", slot: "consumable", rarity: "common", value: 12, description: "Recupera 70 PV de um herói vivo no próximo turno. Máximo de duas por combate." },
  secret_map: { name: "Mapa Secreto", slot: "quest", rarity: "rare", value: 60, description: "Com 120 de renome, libera a quarta missão. Permanece no baú após a expedição." },
  ancient_key: { name: "Chave Antiga", slot: "quest", rarity: "epic", value: 95, description: "Com 260 de renome, libera a quinta missão. Obtida em chefes e expedições secretas." },
  gemstone: { name: "Pedra preciosa", slot: "treasure", rarity: "common", value: 25, description: "Tesouro para vender ao mercador." },
  ancient_idol: { name: "Ídolo antigo", slot: "treasure", rarity: "rare", value: 55, description: "Relíquia de coleção. Pode ser vendida por ouro." },
  royal_relic: { name: "Relíquia real", slot: "treasure", rarity: "epic", value: 120, description: "Tesouro valioso encontrado nas expedições mais perigosas." },
  ...(V130_ITEMS as unknown as Record<string, ItemDef>),
};
export const SLOT_NAMES: Record<ItemSlot, string> = { weapon: "Arma", offhand: "Mão secundária", helmet: "Elmo", armor: "Armadura", gloves: "Luvas", boots: "Botas", accessory: "Acessório", consumable: "Consumível", material: "Material", quest: "Acesso", treasure: "Tesouro" };
export const RARITY_NAMES = { common: "Comum", uncommon: "Incomum", rare: "Raro", epic: "Épico", legendary: "Lendário" };
export const REGIONS = WORLD_REGIONS.map(region => region.name);
type TalentSpec = { name: string; description: string; stages: [string, string, string]; bonus: { attack?: number; defense?: number; magic?: number; hp?: number; speed?: number; critical?: number; healing?: number } };
const talent = (name: string, description: string, stages: [string, string, string], bonus: TalentSpec["bonus"]): TalentSpec => ({ name, description, stages, bonus });
export const PATH_NAMES: Record<TalentPath, string> = { offense: "Poder", healing: "Cura", defense: "Defesa" };
export const SPECIALIZATIONS: Record<HeroClass, Record<TalentPath, TalentSpec>> = {
  warrior: {
    offense: talent("Berserker", "Por grau: +6 ataque e +4% crítico.", ["Ímpeto", "Ruptura", "Fúria ancestral"], { attack: 6, critical: .04 }),
    healing: talent("Médico de guerra", "Por grau: +4 magia e +20% cura. Cura aliados abaixo de 45% de vida.", ["Primeiros socorros", "Resgate", "Vida no campo"], { magic: 4, healing: .2 }),
    defense: talent("Guardião", "Por grau: +7 defesa e +20 vida. Protege estruturas.", ["Postura firme", "Muralha", "Bastião"], { defense: 7, hp: 20 }),
  },
  mage: {
    offense: talent("Piromante", "Por grau: +7 magia e +4% crítico.", ["Faísca", "Chama viva", "Inferno arcano"], { magic: 7, critical: .04 }),
    healing: talent("Tecelão vital", "Por grau: +4 magia e +20% cura. Cura aliados abaixo de 45% de vida.", ["Fio vital", "Remendo arcano", "Elo da vida"], { magic: 4, healing: .2 }),
    defense: talent("Criomante", "Por grau: +4 magia, +5 defesa e −5% de dano inimigo.", ["Geada", "Manto de gelo", "Fortaleza glacial"], { magic: 4, defense: 5 }),
  },
  healer: {
    offense: talent("Luz ofensiva", "Por grau: +7 magia e +4% crítico.", ["Centelha sagrada", "Julgamento", "Sol nascente"], { magic: 7, critical: .04 }),
    healing: talent("Restauradora", "Por grau: +4 magia e +20% cura. Continua curando abaixo de 70% de vida.", ["Bênção", "Renovação", "Fonte da vida"], { magic: 4, healing: .2 }),
    defense: talent("Sacerdotisa do escudo", "Por grau: +6 defesa e +20 vida.", ["Vigília", "Pele de luz", "Santuário"], { defense: 6, hp: 20 }),
  },
  rogue: {
    offense: talent("Assassino", "Por grau: +6 ataque e +4% crítico.", ["Precisão", "Golpe fatal", "Sombra mortal"], { attack: 6, critical: .04 }),
    healing: talent("Alquimista", "Por grau: +4 magia e +20% cura. Cura aliados abaixo de 45% de vida.", ["Unguentos", "Antídotos", "Elixir vital"], { magic: 4, healing: .2 }),
    defense: talent("Desbravador", "Por grau: +4 velocidade, +3 defesa e menos dano de armadilhas.", ["Passo seguro", "Desarme", "Caminho das sombras"], { speed: 4, defense: 3 }),
  },
  ranger: {
    offense: talent("Atiradora", "Por grau: +6 ataque e +4% crítico.", ["Mira firme", "Tiro preciso", "Flecha estelar"], { attack: 6, critical: .04 }),
    healing: talent("Herbalista", "Por grau: +4 magia e +20% cura. Cura aliados abaixo de 45% de vida.", ["Ervas do vale", "Bálsamo", "Jardim da vida"], { magic: 4, healing: .2 }),
    defense: talent("Batedora", "Por grau: +4 velocidade e +3 defesa. Reduz o trajeto das escoltas.", ["Vigilância", "Rota segura", "Olhos da floresta"], { speed: 4, defense: 3 }),
  },
  paladin: {
    offense: talent("Justiceiro", "Por grau: +6 ataque, +3 magia e +4% crítico.", ["Juramento", "Sentença", "Martelo da aurora"], { attack: 6, magic: 3, critical: .04 }),
    healing: talent("Templário da vida", "Por grau: +5 magia e +20% cura. Cura aliados abaixo de 70% de vida.", ["Mãos sagradas", "Luz renovadora", "Milagre"], { magic: 5, healing: .2 }),
    defense: talent("Protetor", "Por grau: +6 defesa e +3 magia. Protege estruturas e cura aliados abaixo de 45% de vida.", ["Escudo sagrado", "Guarda real", "Égide da aurora"], { defense: 6, magic: 3 }),
  },
  monk: {
    offense: talent("Punho celestial", "Por grau: +6 ataque e +4% crítico.", ["Disciplina", "Punho do vento", "Impacto celestial"], { attack: 6, critical: .04 }),
    healing: talent("Mestre do chi", "Por grau: +4 magia e +20% cura. Cura aliados abaixo de 45% de vida.", ["Respiração vital", "Fluxo do chi", "Equilíbrio interior"], { magic: 4, healing: .2 }),
    defense: talent("Monge de ferro", "Por grau: +7 defesa e +15 vida. Protege estruturas.", ["Base de pedra", "Corpo de ferro", "Montanha imóvel"], { defense: 7, hp: 15 }),
  },
  necromancer: {
    offense: talent("Senhor das sombras", "Por grau: +7 magia e +4% crítico. Mantém a drenagem de vida.", ["Sussurro sombrio", "Pacto espectral", "Domínio das almas"], { magic: 7, critical: .04 }),
    healing: talent("Transfusão vital", "Por grau: +4 magia e +20% cura. Cura aliados abaixo de 45% de vida.", ["Vínculo de sangue", "Transfusão", "Ciclo das almas"], { magic: 4, healing: .2 }),
    defense: talent("Carapaça espectral", "Por grau: +6 defesa e +20 vida.", ["Véu espectral", "Ossos antigos", "Fortaleza das almas"], { defense: 6, hp: 20 }),
  },
  druid: {
    offense: talent("Fúria da natureza", "Por grau: +7 magia e +4% crítico.", ["Espinhos", "Tempestade verde", "Fúria ancestral"], { magic: 7, critical: .04 }),
    healing: talent("Guardião da vida", "Por grau: +4 magia e +20% cura. Passa a curar aliados abaixo de 70% de vida.", ["Broto vital", "Florescimento", "Árvore da vida"], { magic: 4, healing: .2 }),
    defense: talent("Pele de carvalho", "Por grau: +6 defesa e +25 vida.", ["Raízes firmes", "Casca ancestral", "Carvalho eterno"], { defense: 6, hp: 25 }),
  },
  bard: {
    offense: talent("Cantor de guerra", "Por grau: +7 magia e +4% crítico. Mantém a inspiração dos aliados.", ["Ritmo de guerra", "Canto heroico", "Sinfonia da vitória"], { magic: 7, critical: .04 }),
    healing: talent("Canção da vida", "Por grau: +4 magia e +20% cura. Cura aliados abaixo de 45% de vida.", ["Melodia suave", "Harmonia vital", "Hino da renovação"], { magic: 4, healing: .2 }),
    defense: talent("Cantor da fortaleza", "Por grau: +5 defesa e +20 vida.", ["Canto da guarda", "Acordes de aço", "Hino da fortaleza"], { defense: 5, hp: 20 }),
  },
};

type StatBonus = { attack?: number; defense?: number; magic?: number; hp?: number; speed?: number; critical?: number; healing?: number };
export type RaceTalentSpec = { name: string; stage2: string; stage3: string; description: string; bonus: StatBonus; ability: AbilitySpec };
export type ClassTechnique = { name: string; description: string; bonus: StatBonus };
export const RACIAL_PATH_NAMES: Record<RacialPath, string> = { heritage: "Herança", spirit: "Espírito", war: "Guerra" };
export const RACE_TREES: Record<HeroRace, Record<RacialPath, RaceTalentSpec>> = {
  human: {
    heritage: { name: "Comando Humano", stage2: "Voz dos Reinos", stage3: "Comando dos Sete Estandartes", description: "Inspira a equipe e reforça a disciplina do grupo.", bonus: { defense: 2, healing: .04 }, ability: { id: "race-human-heritage", name: "Comando Humano", description: "Inspira todos os aliados e concede escudos leves.", target: "all-allies", cooldown: 4, effect: "anthem", evolved: true } },
    spirit: { name: "Adaptabilidade", stage2: "Sangue Versátil", stage3: "Herói dos Reinos", description: "A tradição humana se adapta a qualquer formação.", bonus: { attack: 2, magic: 2, speed: 1 }, ability: { id: "race-human-spirit", name: "Golpe Adaptável", description: "Concentra técnica e oportunidade em um golpe de execução.", target: "enemy", cooldown: 4, effect: "execution", evolved: true } },
    war: { name: "Guarda dos Reinos", stage2: "Muralha Real", stage3: "Bastião Humano", description: "Transforma disciplina em resistência para a linha de frente.", bonus: { defense: 3, hp: 10 }, ability: { id: "race-human-war", name: "Guarda dos Reinos", description: "Ergue uma grande defesa e provoca a linha inimiga.", target: "self", cooldown: 4, effect: "fortress", evolved: true } },
  },
  elf: {
    heritage: { name: "Seiva Élfica", stage2: "Círculo da Seiva", stage3: "Coração de Lúmen", description: "A magia natural restaura corpo e foco.", bonus: { magic: 3, healing: .08 }, ability: { id: "race-elf-heritage", name: "Seiva Élfica", description: "Restaura um aliado e deixa regeneração ativa.", target: "ally", cooldown: 4, effect: "lifebloom", evolved: true } },
    spirit: { name: "Passo da Floresta", stage2: "Dança das Folhas", stage3: "Véu de Lúmen", description: "Movimento e proteção através da floresta viva.", bonus: { speed: 3, defense: 1 }, ability: { id: "race-elf-spirit", name: "Passo da Floresta", description: "Protege e recupera toda a equipe com magia natural.", target: "all-allies", cooldown: 4, effect: "sanctuary", evolved: true } },
    war: { name: "Flecha Lunar", stage2: "Mira da Lua", stage3: "Lua Perfurante", description: "Precisão ancestral contra alvos prioritários.", bonus: { attack: 2, magic: 2, critical: .02 }, ability: { id: "race-elf-war", name: "Flecha Lunar", description: "Atinge e imobiliza um inimigo com precisão élfica.", target: "enemy", cooldown: 4, effect: "pinning", evolved: true } },
  },
  dwarf: {
    heritage: { name: "Reflexão Rúnica Anã", stage2: "Runas de Retorno", stage3: "Câmara Rúnica", description: "Runas antigas convertem impacto em proteção.", bonus: { defense: 3, hp: 12 }, ability: { id: "race-dwarf-heritage", name: "Reflexão Rúnica Anã", description: "Cria um escudo maciço e atrai os ataques inimigos.", target: "self", cooldown: 4, effect: "fortress", evolved: true } },
    spirit: { name: "Juramento da Forja", stage2: "Fogo da Forja", stage3: "Forja Eterna", description: "A forja fortalece corpo, metal e magia.", bonus: { defense: 2, magic: 2 }, ability: { id: "race-dwarf-spirit", name: "Juramento da Forja", description: "Reforça um aliado com cura e proteção pesada.", target: "ally", cooldown: 4, effect: "aegis", evolved: true } },
    war: { name: "Martelo Ancestral", stage2: "Impacto Rúnico", stage3: "Martelo dos Primeiros", description: "Força concentrada para quebrar o ritmo inimigo.", bonus: { attack: 4 }, ability: { id: "race-dwarf-war", name: "Martelo Ancestral", description: "Golpe rúnico que causa dano e atordoa o alvo.", target: "enemy", cooldown: 4, effect: "control", evolved: true } },
  },
  orc: {
    heritage: { name: "Sangue de Guerra", stage2: "Sangue da Horda", stage3: "Coração Indomável", description: "A dor alimenta a recuperação e a pressão ofensiva.", bonus: { attack: 2, hp: 14 }, ability: { id: "race-orc-heritage", name: "Sangue de Guerra", description: "Drena a força do inimigo para recuperar a própria vida.", target: "enemy", cooldown: 4, effect: "drain", evolved: true } },
    spirit: { name: "Fúria da Horda", stage2: "Clamor da Horda", stage3: "Horda Imparável", description: "A presença orc pressiona toda a linha adversária.", bonus: { attack: 3, speed: 1 }, ability: { id: "race-orc-spirit", name: "Fúria da Horda", description: "Varre todos os inimigos e os deixa vulneráveis.", target: "all-enemies", cooldown: 4, effect: "storm", evolved: true } },
    war: { name: "Sacrifício Orc", stage2: "Dor pela Vitória", stage3: "Sacrifício do Chefe", description: "Converte resistência em um golpe devastador.", bonus: { attack: 4, critical: .02 }, ability: { id: "race-orc-war", name: "Sacrifício Orc", description: "Golpe brutal de alvo único que deixa sangramento.", target: "enemy", cooldown: 4, effect: "execution", evolved: true } },
  },
  beastkin: {
    heritage: { name: "Instinto Predador", stage2: "Olhos da Caça", stage3: "Predador Alfa", description: "Instinto, velocidade e precisão em combate.", bonus: { speed: 3, critical: .02 }, ability: { id: "race-beastkin-heritage", name: "Instinto Predador", description: "Golpe rápido que aplica veneno ao alvo.", target: "enemy", cooldown: 4, effect: "venom", evolved: true } },
    spirit: { name: "Uivo da Matilha", stage2: "Chamado da Matilha", stage3: "Voz do Alfa", description: "Fortalece o grupo através do vínculo da matilha.", bonus: { defense: 1, healing: .05, speed: 1 }, ability: { id: "race-beastkin-spirit", name: "Uivo da Matilha", description: "Inspira a equipe e ergue escudos para todos.", target: "all-allies", cooldown: 4, effect: "anthem", evolved: true } },
    war: { name: "Salto Selvagem", stage2: "Bote do Caçador", stage3: "Queda do Alfa", description: "Mobilidade agressiva para quebrar formações.", bonus: { attack: 3, speed: 2 }, ability: { id: "race-beastkin-war", name: "Salto Selvagem", description: "Avança sobre um inimigo e o deixa atordoado.", target: "enemy", cooldown: 4, effect: "pinning", evolved: true } },
  },
  umbral: {
    heritage: { name: "Véu Sombrio", stage2: "Manto do Vazio", stage3: "Noite Absoluta", description: "A sombra cobre o corpo e confunde os atacantes.", bonus: { defense: 2, magic: 2, hp: 8 }, ability: { id: "race-umbral-heritage", name: "Véu Sombrio", description: "Ergue um escudo sombrio e atrai a agressão inimiga.", target: "self", cooldown: 4, effect: "challenge", evolved: true } },
    spirit: { name: "Marca da Alma", stage2: "Selo dos Ecos", stage3: "Pacto da Alma", description: "Ataques espirituais drenam a essência adversária.", bonus: { magic: 4 }, ability: { id: "race-umbral-spirit", name: "Marca da Alma", description: "Drena a alma de um inimigo e recupera vida.", target: "enemy", cooldown: 4, effect: "drain", evolved: true } },
    war: { name: "Eclipse Umbral", stage2: "Sombra Crescente", stage3: "Eclipse Eterno", description: "Uma onda obscura enfraquece todo o campo inimigo.", bonus: { magic: 3, critical: .02 }, ability: { id: "race-umbral-war", name: "Eclipse Umbral", description: "Atinge todos os inimigos e os deixa vulneráveis.", target: "all-enemies", cooldown: 4, effect: "storm", evolved: true } },
  },
};
export const CLASS_TECHNIQUES: Record<HeroClass, ClassTechnique> = {
  warrior: { name: "Guarda Interceptora", description: "Técnica: mais defesa e vida para segurar a frente.", bonus: { defense: 3, hp: 10 } },
  mage: { name: "Canalização Arcana", description: "Técnica: amplia magia e chance crítica.", bonus: { magic: 4, critical: .01 } },
  healer: { name: "Pulso Restaurador", description: "Técnica: fortalece cura e defesa espiritual.", bonus: { magic: 2, healing: .1 } },
  rogue: { name: "Passo de Execução", description: "Técnica: velocidade e crítico para atacar antes.", bonus: { speed: 3, critical: .025 } },
  ranger: { name: "Leitura do Terreno", description: "Técnica: velocidade, precisão e ataque à distância.", bonus: { speed: 2, attack: 2, critical: .01 } },
  paladin: { name: "Juramento Protetor", description: "Técnica: defesa e magia avançam juntas.", bonus: { defense: 2, magic: 2, hp: 8 } },
  monk: { name: "Fluxo do Corpo", description: "Técnica: ataque, defesa e velocidade equilibrados.", bonus: { attack: 2, defense: 2, speed: 2 } },
  necromancer: { name: "Eco Profano", description: "Técnica: reforça magia e sobrevivência.", bonus: { magic: 3, hp: 8 } },
  druid: { name: "Ciclo Vivo", description: "Técnica: magia, vida e cura da natureza.", bonus: { magic: 2, hp: 10, healing: .06 } },
  bard: { name: "Ritmo de Batalha", description: "Técnica: pequenos bônus em ataque, magia e velocidade.", bonus: { attack: 1, magic: 2, speed: 2, healing: .04 } },
};
export type TalentBranchStyle = "execution" | "storm" | "lifebloom" | "sanctuary" | "fortress" | "control";
export type TalentBranchSpec = { name: string; description: string; stage2: string; stage3: string; bonus: StatBonus; style: TalentBranchStyle };
const BRANCH_NAMES: Record<HeroClass, Record<TalentPath, [string, string]>> = {
  warrior: { offense: ["Carniceiro Rubro", "Senhor da Ruptura"], healing: ["Cirurgião de Campo", "Comandante Vital"], defense: ["Muralha de Ferro", "Sentinela Implacável"] },
  mage: { offense: ["Mestre das Chamas", "Tempestade Arcana"], healing: ["Costureiro de Almas", "Círculo Vital"], defense: ["Fortaleza Glacial", "Carcereiro de Gelo"] },
  healer: { offense: ["Inquisidora Solar", "Arauta da Luz"], healing: ["Fonte Serena", "Santuário Radiante"], defense: ["Muralha Sagrada", "Julgadora da Égide"] },
  rogue: { offense: ["Lâmina Tóxica", "Dança das Sombras"], healing: ["Alquimista Vital", "Mestre dos Antídotos"], defense: ["Fantasma Blindado", "Sabotador"] },
  ranger: { offense: ["Caçadora Carmesim", "Chuva de Flechas"], healing: ["Herbalista-Mor", "Guardião do Bosque"], defense: ["Bastião da Mata", "Armadilheira Real"] },
  paladin: { offense: ["Executor da Aurora", "Tempestade Sagrada"], healing: ["Milagreiro", "Santuário da Alvorada"], defense: ["Bastião Sagrado", "Juiz de Aço"] },
  monk: { offense: ["Punho Sangrento", "Vendaval de Chi"], healing: ["Mestre da Respiração", "Círculo do Equilíbrio"], defense: ["Montanha Viva", "Punho Imobilizador"] },
  necromancer: { offense: ["Ceifador de Almas", "Praga das Sombras"], healing: ["Transfusor", "Círculo dos Mortos"], defense: ["Fortaleza Óssea", "Carcereiro Espectral"] },
  druid: { offense: ["Garra Espinhosa", "Tempestade Verde"], healing: ["Coração da Floresta", "Bosque Sagrado"], defense: ["Carvalho Ancestral", "Raízes Prisioneiras"] },
  bard: { offense: ["Maestro Carmesim", "Sinfonia de Guerra"], healing: ["Voz Restauradora", "Coro da Vida"], defense: ["Hino da Fortaleza", "Acorde Dominante"] },
};
const magicalClass = (c: HeroClass) => ["mage", "healer", "necromancer", "druid", "bard"].includes(c);
function branchDefinition(heroClass: HeroClass, path: TalentPath, branch: EvolutionBranch): TalentBranchSpec {
  const name = BRANCH_NAMES[heroClass][path][branch === "a" ? 0 : 1];
  if (path === "offense" && branch === "a") return { name, description: "Especialização em alvo único. A habilidade evoluída causa grande dano e sangramento ou veneno.", stage2: name, stage3: name + " Supremo", bonus: magicalClass(heroClass) ? { magic: 4, critical: .025 } : { attack: 4, critical: .025 }, style: "execution" };
  if (path === "offense") return { name, description: "Especialização em pressão de grupo. A habilidade evoluída atinge todos os inimigos e os deixa vulneráveis.", stage2: name, stage3: name + " Supremo", bonus: magicalClass(heroClass) ? { magic: 3, speed: 2 } : { attack: 3, speed: 2 }, style: "storm" };
  if (path === "healing" && branch === "a") return { name, description: "Especialização em resgate de um aliado. A habilidade evoluída cura muito e aplica regeneração.", stage2: name, stage3: name + " Supremo", bonus: { magic: 3, healing: .15 }, style: "lifebloom" };
  if (path === "healing") return { name, description: "Especialização em proteção coletiva. A habilidade evoluída cura o grupo e cria escudos.", stage2: name, stage3: name + " Supremo", bonus: { defense: 2, hp: 12, healing: .08 }, style: "sanctuary" };
  if (path === "defense" && branch === "a") return { name, description: "Especialização em absorver pressão. A habilidade evoluída cria um grande escudo e provoca os inimigos.", stage2: name, stage3: name + " Supremo", bonus: { defense: 4, hp: 18 }, style: "fortress" };
  return { name, description: "Especialização em controle. A habilidade evoluída atordoa um inimigo e reforça sua própria defesa.", stage2: name, stage3: name + " Supremo", bonus: { defense: 2, speed: 3, critical: .015 }, style: "control" };
}
export const SPECIALIZATION_BRANCHES: Record<HeroClass, Record<TalentPath, Record<EvolutionBranch, TalentBranchSpec>>> = Object.fromEntries((Object.keys(CLASSES) as HeroClass[]).map(heroClass => [heroClass, Object.fromEntries((["offense", "healing", "defense"] as TalentPath[]).map(path => [path, { a: branchDefinition(heroClass, path, "a"), b: branchDefinition(heroClass, path, "b") }]))])) as Record<HeroClass, Record<TalentPath, Record<EvolutionBranch, TalentBranchSpec>>>;

export const CLASS_ABILITIES: Record<HeroClass, AbilitySpec> = {
  warrior: { id: "warrior-challenge", name: "Desafio do Guardião", description: "Cria um escudo e força a linha inimiga a focar o Guerreiro por 2 turnos.", target: "self", cooldown: 3, effect: "challenge" },
  mage: { id: "mage-fireball", name: "Explosão Arcana", description: "Atinge todos os inimigos e deixa os alvos vulneráveis por 2 turnos.", target: "all-enemies", cooldown: 3, effect: "fireball" },
  healer: { id: "healer-restore", name: "Luz Restauradora", description: "Cura um aliado escolhido e aplica regeneração.", target: "ally", cooldown: 3, effect: "restore" },
  rogue: { id: "rogue-venom", name: "Lâmina Venenosa", description: "Golpe rápido em um inimigo e aplica veneno por 3 turnos.", target: "enemy", cooldown: 3, effect: "venom" },
  ranger: { id: "ranger-pinning", name: "Tiro Imobilizante", description: "Causa dano e atordoa um inimigo, impedindo sua próxima ação.", target: "enemy", cooldown: 3, effect: "pinning" },
  paladin: { id: "paladin-aegis", name: "Égide Sagrada", description: "Cria um escudo forte em um aliado e recupera parte de sua vida.", target: "ally", cooldown: 3, effect: "aegis" },
  monk: { id: "monk-chi", name: "Rajada de Chi", description: "Golpe concentrado que causa dano e cria um escudo no Monge.", target: "enemy", cooldown: 3, effect: "chi" },
  necromancer: { id: "necromancer-drain", name: "Drenar Alma", description: "Drena vida de um inimigo e converte parte do dano em cura.", target: "enemy", cooldown: 3, effect: "drain" },
  druid: { id: "druid-renew", name: "Renovação Selvagem", description: "Cura um aliado e aplica regeneração prolongada.", target: "ally", cooldown: 3, effect: "renew" },
  bard: { id: "bard-anthem", name: "Hino de Guerra", description: "Inspira todos os aliados e concede um pequeno escudo coletivo.", target: "all-allies", cooldown: 3, effect: "anthem" },
};
export type HeroStorySpec = { title: string; synopsis: string; stages: [string, string, string]; ability: AbilitySpec };
export const HERO_STORIES: Record<HeroClass, HeroStorySpec> = {
  warrior: { title: "O Juramento de Ferrabrava", synopsis: "Um guerreiro prova que proteger a guilda exige mais do que força.", stages: ["Treino do escudo", "Prova da muralha", "Desafio do último bastião"], ability: { id: "story-warrior", name: "Último Bastião", description: "Ergue uma defesa extrema e força os inimigos a encará-lo.", target: "self", cooldown: 5, effect: "fortress", evolved: true } },
  mage: { title: "A Biblioteca de Cinzas", synopsis: "Segredos arcanos de Ashen levam a uma magia esquecida.", stages: ["Treino de foco", "Prova dos selos", "Desafio do tomo em chamas"], ability: { id: "story-mage", name: "Cometa de Ashen", description: "Uma explosão arcana atinge todos os inimigos.", target: "all-enemies", cooldown: 5, effect: "storm", evolved: true } },
  healer: { title: "A Luz que Não Cede", synopsis: "Curar sob pressão transforma fé em poder real.", stages: ["Treino de restauração", "Prova dos feridos", "Desafio da vigília"], ability: { id: "story-healer", name: "Milagre Verde", description: "Restaura profundamente um aliado e mantém regeneração.", target: "ally", cooldown: 5, effect: "lifebloom", evolved: true } },
  rogue: { title: "Dívida nas Sombras", synopsis: "Uma antiga dívida força o ladino a encarar seu passado.", stages: ["Treino silencioso", "Prova da infiltração", "Desafio do credor oculto"], ability: { id: "story-rogue", name: "Passo Fantasma", description: "Golpe preciso que quebra o ritmo de um inimigo.", target: "enemy", cooldown: 5, effect: "control", evolved: true } },
  ranger: { title: "O Chamado da Bruma", synopsis: "A floresta testa mira, paciência e decisão.", stages: ["Treino de rastreio", "Prova da trilha", "Desafio da caçada branca"], ability: { id: "story-ranger", name: "Chuva da Bruma", description: "Uma sequência de disparos pressiona todos os inimigos.", target: "all-enemies", cooldown: 5, effect: "storm", evolved: true } },
  paladin: { title: "Julgamento da Aurora", synopsis: "O juramento do paladino é levado ao limite.", stages: ["Treino do juramento", "Prova da alvorada", "Desafio do tribunal sagrado"], ability: { id: "story-paladin", name: "Égide da Aurora", description: "Cura e protege toda a formação aliada.", target: "all-allies", cooldown: 5, effect: "sanctuary", evolved: true } },
  monk: { title: "O Sino sem Som", synopsis: "Disciplina e silêncio revelam uma técnica esquecida.", stages: ["Treino da respiração", "Prova do equilíbrio", "Desafio do sino vazio"], ability: { id: "story-monk", name: "Punho do Vazio", description: "Golpe de controle que atordoa e fortalece o monge.", target: "enemy", cooldown: 5, effect: "control", evolved: true } },
  necromancer: { title: "Nomes dos Mortos", synopsis: "Ouvir os mortos tem um preço e uma recompensa.", stages: ["Treino dos ecos", "Prova do cemitério", "Desafio do pacto antigo"], ability: { id: "story-necromancer", name: "Pacto dos Ecos", description: "Drena a essência inimiga e converte em vida.", target: "enemy", cooldown: 5, effect: "drain", evolved: true } },
  druid: { title: "Raízes do Primeiro Bosque", synopsis: "A natureza exige uma prova antes de compartilhar seu poder.", stages: ["Treino das sementes", "Prova do bosque", "Desafio da árvore ancestral"], ability: { id: "story-druid", name: "Coração Antigo", description: "Renova um aliado com cura e regeneração prolongada.", target: "ally", cooldown: 5, effect: "renew", evolved: true } },
  bard: { title: "A Canção Inacabada", synopsis: "Uma melodia perdida só termina após três provas.", stages: ["Treino do refrão", "Prova da plateia", "Desafio da última nota"], ability: { id: "story-bard", name: "Balada Imortal", description: "Inspira toda a equipe e concede proteção coletiva.", target: "all-allies", cooldown: 5, effect: "anthem", evolved: true } },
};
export function availableAbilities(hero: Hero): AbilitySpec[] {
  const levelSet = LEVEL_ABILITIES[hero.class];
  const abilities: AbilitySpec[] = levelSet
    ? levelSet.filter(a => hero.level >= a.level).map(a => ({ ...a, target: a.target as AbilityTarget, effect: a.effect as AbilityEffect, evolved: a.level >= 22 }))
    : [CLASS_ABILITIES[hero.class]];
  if (hero.talent?.rank && hero.talent.rank >= 2 && hero.talent.branch) {
    const branch = SPECIALIZATION_BRANCHES[hero.class][hero.talent.path][hero.talent.branch];
    const target: AbilityTarget = branch.style === "storm" ? "all-enemies" : branch.style === "sanctuary" ? "all-allies" : branch.style === "fortress" ? "self" : branch.style === "lifebloom" ? "ally" : "enemy";
    abilities.push({ id: hero.class + "-" + hero.talent.path + "-" + hero.talent.branch, name: branch.name, description: branch.description + (hero.talent.rank >= 3 ? " Forma máxima da especialização." : ""), target, cooldown: 4, effect: branch.style, evolved: true });
  }
  if (hero.racial?.rank) {
    const racial = RACE_TREES[heroRace(hero)][hero.racial.path];
    abilities.push({ ...racial.ability, description: racial.ability.description + (hero.racial.rank >= 3 ? " Forma ancestral dominada." : "") });
  }
  if (hero.storyAbilityUnlocked) abilities.push(HERO_STORIES[hero.class].ability);
  return abilities;
}
export function abilityCooldownRemaining(battle: Battle | null | undefined, heroId: string, abilityId: string) {
  if (!battle?.combat) return 0;
  const readyAt = battle.combat.abilityCooldowns?.[heroId + ":" + abilityId] || 1;
  return Math.max(0, readyAt - (battle.rounds + 1));
}
export function defaultFormationLine(heroClass: HeroClass): FormationLine { return ["warrior", "paladin", "monk"].includes(heroClass) ? "front" : "back"; }
export function formationValid(ids: string[], formation: Record<string, FormationLine>) {
  const front = ids.filter(id => formation[id] === "front").length;
  const back = ids.filter(id => formation[id] === "back").length;
  return ids.length >= 3 && ids.length <= 4 && front >= 1 && back >= 1;
}

export const LEAGUE_TIERS: Record<LeagueTier, { name: string; prizeMultiplier: number; rivalBonus: number }> = {
  1: { name: "Liga Ouro", prizeMultiplier: 1.5, rivalBonus: 12 },
  2: { name: "Liga Prata", prizeMultiplier: 1.25, rivalBonus: 6 },
  3: { name: "Liga Bronze", prizeMultiplier: 1, rivalBonus: 0 },
};
export function rivalryHeat(s: Campaign, guildId: string) { return s.rivalries?.find(r => r.guildId === guildId)?.heat || 0; }
export function scheduledLeagueOpponent(s: Campaign, day = seasonDay(s)) { return s.rivals[((s.season - 1) * 29 + (day - 1) * 37) % s.rivals.length]; }
export function leagueCalendar(s: Campaign, count = 7) {
  const today = seasonDay(s), history = new Map((s.leagueHistory || []).filter(m => m.season === s.season && !m.cup).map(m => [m.day, m]));
  return Array.from({ length: Math.min(count, 29 - today) }, (_, i) => { const day = today + i, opponent = scheduledLeagueOpponent(s, day); return { day, opponent, match: history.get(day), rivalry: rivalryHeat(s, opponent.id) >= 30 }; });
}

export const KIND_NAMES: Record<MissionKind, string> = { escort: "Escolta", defense: "Defesa", dungeon: "Masmorra", hunt: "Caça", boss: "Chefe" };
const templates = [
  { title: "Caravana de Valen", location: "Estrada de Valen", description: "Leve os mercadores em segurança. A caravana precisa sobreviver ao trajeto.", enemy: "Bandido", specialty: "warrior", flavor: "Dois heróis ágeis encurtam o trajeto. Guerreiros causam +12% de dano.", kind: "escort" as const },
  { title: "A defesa de Pedra Clara", location: "Aldeia de Pedra Clara", description: "Proteja a barricada até os reforços chegarem ou elimine os saqueadores.", enemy: "Saqueador", specialty: "paladin", flavor: "Guerreiros e paladinos reduzem o dano à barricada.", kind: "defense" as const },
  { title: "O despertar da cripta", location: "Cripta de Ashen", description: "Elimine os guardiões e atravesse as armadilhas para recuperar os tesouros.", enemy: "Esqueleto", specialty: "undead", flavor: "Ladinos reduzem o dano das armadilhas. Magos e paladinos causam +12% de dano.", kind: "dungeon" as const },
  { title: "Caçada nas brumas", location: "Floresta de Brumavale", description: "Derrote os predadores em até 12 turnos, antes que escapem.", enemy: "Lobo sombrio", specialty: "ranger", flavor: "Arqueiras causam +18% de dano e têm +10% de chance de crítico nesta caçada.", kind: "hunt" as const },
];
function random(s: Campaign) { s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0; return s.rng / 4294967296; }
export function seasonDay(s: Campaign) { return ((s.day - 1) % 28) + 1; }
export const MAX_HERO_LEVEL = 50;
export function threshold(h: Hero) { return h.level >= MAX_HERO_LEVEL ? Number.POSITIVE_INFINITY : 55 + h.level * 20 + Math.floor(h.level / 10) * 25; }
export function activeJourney(s: Campaign, heroId: string) { return s.journeys?.find(j => j.heroId === heroId); }
export function activeExpeditions(s: Campaign) { return (s.expeditions || []).filter(e => e.battle.status === "active" && !!e.battle.combat).toSorted((a, b) => a.slot - b.slot); }
export function freeExpeditionSlots(s: Campaign): ExpeditionSlot[] {
  const occupied = new Set(activeExpeditions(s).map(e => e.slot));
  return ([1, 2, 3] as ExpeditionSlot[]).filter(slot => !occupied.has(slot));
}
export function heroOnExpedition(s: Campaign, heroId: string) { return activeExpeditions(s).some(e => e.team.includes(heroId)); }
export function available(h: Hero, s: Campaign) { return h.energy >= 25 && h.injuredUntil <= s.day && !activeJourney(s, h.id) && !heroOnExpedition(s, h.id); }
export function battleActive(s: Campaign, expeditionId?: string) {
  if (expeditionId) return activeExpeditions(s).some(e => e.id === expeditionId);
  return activeExpeditions(s).length > 0 || (s.expeditions?.length ? false : s.lastBattle?.status === "active" && !!s.lastBattle.combat);
}
function expeditionBattle(s: Campaign, expeditionId?: string) {
  const active = activeExpeditions(s);
  const expedition = (expeditionId ? active.find(e => e.id === expeditionId) : undefined) || active[0];
  return expedition ? { expedition, battle: expedition.battle } : s.lastBattle?.status === "active" && s.lastBattle.combat ? { expedition: undefined, battle: s.lastBattle } : null;
}
export function talentPoints(h: Hero) { return Math.max(0, Math.min(3, Math.floor((h.level - 1) / 3)) - (h.talent?.rank || 0)); }
export function racialPoints(h: Hero) { return Math.max(0, Math.min(3, Math.floor(h.level / 3)) - (h.racial?.rank || 0)); }
export function storyProgress(h: Hero) {
  const stage = (h.storyStage || 0) as StoryStage;
  if (stage === 0) return { stage, label: "Treino", requirement: "Disponível agora", cost: 60, energy: 10 };
  if (stage === 1) return { stage, label: "Prova", requirement: "Nível 4+", cost: 0, energy: 15 };
  if (stage === 2) return { stage, label: "Desafio final", requirement: "Nível 7+", cost: 120, energy: 20 };
  return { stage, label: "Concluída", requirement: "Habilidade desbloqueada", cost: 0, energy: 0 };
}
export function heroStats(h: Hero, s?: Campaign) {
  const base = V130_BASE_STATS[h.class] || { speed: h.class === "monk" ? 14 : 10, critical: .05 };
  const n = { attack: h.attack + (s?.arsenal || 0), defense: h.defense + Math.floor((s?.arsenal || 0) / 2), magic: h.magic, hp: 0, speed: base.speed || 10, critical: base.critical || .04, healing: 1, luck: h.class === "bard" ? Math.min(.18, .06 + h.level * .002) : 0 };
  if (h.racial?.rank) {
    const racial = RACE_TREES[heroRace(h)][h.racial.path].bonus;
    for (const key of ["attack", "defense", "magic", "hp", "speed", "critical", "healing"] as const) n[key] += (racial[key] || 0) * h.racial.rank;
  }
  const equipped = (s?.chest || []).filter(item => item.equippedTo === h.id);
  const sets = new Map<string, number>();
  for (const item of equipped) {
    const d = ITEMS[item.key]; if (!d) continue;
    for (const k of ["attack", "defense", "magic", "hp", "speed", "critical"] as const) n[k] += d[k] || 0;
    n.luck += d.luck || 0;
    if (d.set) sets.set(d.set, (sets.get(d.set) || 0) + 1);
  }
  for (const [set, count] of sets) {
    if (set === "fortress") { if (count >= 2) n.defense += 3; if (count >= 3) { n.defense += 3; n.hp += 10; } }
    if (set === "astral") { if (count >= 2) n.magic += 4; if (count >= 3) { n.magic += 6; n.critical += .02; } }
    if (set === "shadow") { if (count >= 2) n.speed += 3; if (count >= 3) { n.attack += 4; n.critical += .03; } }
    if (set === "fortune") { if (count >= 2) n.luck += .05; if (count >= 3) { n.luck += .10; n.critical += .03; } }
  }
  for (const scarId of h.scars || []) {
    const scar = HERO_SCARS.find(x => x.id === scarId); if (!scar) continue;
    for (const k of ["attack", "defense", "magic", "hp", "speed", "critical"] as const) n[k] += (scar as Record<string, number | string | boolean>)[k] as number || 0;
    n.luck += ("luck" in scar ? scar.luck : 0) || 0;
  }
  if (h.talent) {
    const bonus = SPECIALIZATIONS[h.class][h.talent.path].bonus;
    for (const key of ["attack", "defense", "magic", "hp", "speed", "critical", "healing"] as const) n[key] += (bonus[key] || 0) * h.talent.rank;
    if (h.talent.branch && h.talent.rank >= 2) {
      const branchBonus = SPECIALIZATION_BRANCHES[h.class][h.talent.path][h.talent.branch].bonus;
      for (const key of ["attack", "defense", "magic", "hp", "speed", "critical", "healing"] as const) n[key] += (branchBonus[key] || 0) * (h.talent.rank - 1);
    }
  }
  if (s?.hq?.library) n.magic += Math.floor(s.hq.library / 2);
  return n;
}
export function heroLuck(h: Hero, s?: Campaign) { return Math.max(0, Math.min(.45, heroStats(h, s).luck)); }
export function rating(h: Hero, arsenal = 0, s?: Campaign) {
  const n = heroStats(h, s);
  return Math.round((n.attack * .45 + n.defense * .3 + n.magic * .35 + h.level * 3 + (s ? 0 : arsenal * 2)) * (.55 + .45 * h.energy / 100));
}
export function teamPower(s: Campaign, ids = s.team) { return s.heroes.filter(h => ids.includes(h.id)).reduce((n, h) => n + rating(h, s.arsenal, s), 0); }
export function payroll(s: Campaign) { return s.heroes.reduce((n, h) => n + h.salary, 0); }
export function rank(s: Campaign) { return s.fame >= 600 ? "Ouro" : s.fame >= 220 ? "Prata" : "Bronze"; }
export function standings(s: Campaign) { return [{ id: "player", name: s.name, points: s.points, victories: s.leagueWins || 0 }, ...s.rivals].sort((a, b) => b.points - a.points || b.victories - a.victories || a.name.localeCompare(b.name, "pt-BR")); }
export const LEAGUE_SIZE = 100;
export const LEAGUE_PRIZES = [{ through: 1, gold: 800 }, { through: 2, gold: 550 }, { through: 3, gold: 380 }, { through: 10, gold: 300 }, { through: 25, gold: 240 }, { through: 50, gold: 180 }, { through: 75, gold: 140 }, { through: 100, gold: 100 }];
export function leaguePrize(place: number, tier: LeagueTier = 3) { return Math.round((LEAGUE_PRIZES.find(p => place >= 1 && place <= p.through)?.gold || 0) * LEAGUE_TIERS[tier].prizeMultiplier); }
export function hasItem(s: Campaign, key: string) { return s.chest.some(i => i.key === key); }
export function missionLocks(s: Campaign, m: Mission) {
  const locks: string[] = [];
  if (s.fame < m.requiredFame) locks.push(m.requiredFame + " de renome (atual: " + s.fame + ")");
  if (m.requiredItem && !hasItem(s, m.requiredItem)) locks.push(ITEMS[m.requiredItem].name + " no baú");
  if (activeExpeditions(s).some(e => e.battle.combat?.mission.id === m.id)) locks.push("essa expedição já está em andamento");
  if (activeExpeditions(s).length >= 3) locks.push("limite de 3 expedições simultâneas");
  return locks;
}
export function missionReadiness(s: Campaign, m: Mission, ids = s.team) {
  const team = s.heroes.filter(h => ids.includes(h.id));
  const recommended = (m.kind === "boss" ? 5 : [2, 3, 5, 7, 9][m.rank - 1]) + Math.floor((s.season - 1) / 2);
  const reference = "Referência: nível " + recommended + ", energia 60%+" + (m.rank >= 2 ? " e equipamentos." : ".");
  if (team.length < 3 || team.length > 4 || team.some(h => !available(h, s))) return { level: "risk", label: "Equipe incompleta ou indisponível", hint: "Escale 3 ou 4 heróis disponíveis, com pelo menos 25% de energia e sem ferimentos." };
  const average = team.reduce((n, h) => n + h.level, 0) / team.length;
  const geared = team.filter(h => s.chest.some(i => i.equippedTo === h.id)).length;
  const ready = average >= recommended && team.every(h => h.energy >= 60) && (m.rank === 1 || geared >= 3);
  const highRisk = average < recommended - .75 || team.some(h => h.energy < 40);
  return { level: ready ? "ready" : highRisk ? "risk" : "prepare", label: ready ? "Boa preparação" : highRisk ? "Alto risco para esta equipe" : "Reforce sua preparação", hint: reference + " O objetivo e a composição também influenciam o resultado." };
}
export const SQUAD_SPECIALTIES: Record<MissionKind, { label: string; description: string }> = {
  escort: { label: "Escolta", description: "Mobilidade, proteção da caravana e resposta rápida." },
  defense: { label: "Defesa", description: "Linha de frente, resistência e cura para segurar posições." },
  dungeon: { label: "Masmorra", description: "Armadilhas, magia e sobrevivência em exploração." },
  hunt: { label: "Caçada", description: "Velocidade, dano e precisão para eliminar alvos antes que escapem." },
  boss: { label: "Chefes", description: "Equipe equilibrada para combates longos e inimigos especiais." },
};
function specialistScore(h: Hero, kind: MissionKind, s: Campaign) {
  const byKind: Record<MissionKind, Partial<Record<HeroClass, number>>> = {
    escort: { ranger: 42, rogue: 30, monk: 27, warrior: 18, paladin: 18, healer: 14, bard: 12 },
    defense: { paladin: 45, warrior: 40, healer: 32, monk: 24, druid: 20, bard: 12 },
    dungeon: { rogue: 45, mage: 34, paladin: 28, healer: 24, necromancer: 22, druid: 16 },
    hunt: { ranger: 48, rogue: 34, monk: 30, bard: 18, druid: 16, healer: 12 },
    boss: { paladin: 38, warrior: 36, healer: 36, druid: 28, mage: 24, necromancer: 23, ranger: 22, monk: 20, bard: 18 },
  };
  let score = rating(h, s.arsenal, s) + (byKind[kind][h.class] || 0);
  if (h.talent?.path === "defense" && ["escort", "defense", "boss"].includes(kind)) score += 15 * h.talent.rank;
  if (h.talent?.path === "healing" && ["defense", "boss"].includes(kind)) score += 18 * h.talent.rank;
  if (h.energy >= 70) score += 12; else if (h.energy < 45) score -= 18;
  return score;
}
export function suggestSpecialistTeam(s: Campaign, kind: MissionKind, size = 4) {
  const candidates = s.heroes.filter(h => available(h, s)).toSorted((a, b) => specialistScore(b, kind, s) - specialistScore(a, kind, s));
  const picked: Hero[] = [];
  const take = (predicate: (h: Hero) => boolean) => {
    const h = candidates.find(hero => !picked.includes(hero) && predicate(hero));
    if (h) picked.push(h);
  };
  if (["defense", "boss"].includes(kind)) { take(h => ["paladin", "warrior", "monk"].includes(h.class)); take(h => ["healer", "druid"].includes(h.class) || h.talent?.path === "healing"); }
  if (kind === "dungeon") take(h => h.class === "rogue");
  if (kind === "hunt") take(h => h.class === "ranger");
  if (kind === "escort") take(h => ["ranger", "rogue", "monk"].includes(h.class));
  for (const h of candidates) if (picked.length < size && !picked.includes(h)) picked.push(h);
  return picked.slice(0, Math.min(size, 4)).map(h => h.id);
}

function entry(s: Campaign, label: string, amount: number) { s.transaction++; s.ledger.unshift({ id: s.transaction, day: s.day, label, amount }); s.ledger = s.ledger.slice(0, 80); s.gold += amount; }
function note(s: Campaign, text: string) { s.journal.unshift({ day: s.day, text }); s.journal = s.journal.slice(0, 40); }
function addItem(s: Campaign, key: string) { const item = { id: "item-" + (++s.itemSequence), key }; s.chest.push(item); return item; }
const initialHeroes: Hero[] = [
  { id: "aric", name: "Aric Ferrabrava", class: "warrior", level: 3, attack: 29, defense: 26, magic: 4, energy: 100, xp: 35, salary: 24, value: 420, trait: "Protetor", injuredUntil: 0 },
  { id: "lyra", name: "Lyra de Ashen", class: "mage", level: 3, attack: 10, defense: 12, magic: 35, energy: 100, xp: 70, salary: 26, value: 460, trait: "Arcana", injuredUntil: 0 },
  { id: "elen", name: "Elen Luzverde", class: "healer", level: 2, attack: 9, defense: 14, magic: 31, energy: 100, xp: 40, salary: 20, value: 380, trait: "Restauradora", injuredUntil: 0 },
  { id: "kael", name: "Kael Sombral", class: "rogue", level: 3, attack: 35, defense: 15, magic: 5, energy: 100, xp: 20, salary: 24, value: 430, trait: "Veloz", injuredUntil: 0 },
  { id: "sora", name: "Sora Ventoleste", class: "ranger", level: 2, attack: 31, defense: 17, magic: 6, energy: 100, xp: 60, salary: 18, value: 350, trait: "Precisa", injuredUntil: 0 },
  { id: "doran", name: "Doran Pedraluz", class: "paladin", level: 2, attack: 26, defense: 30, magic: 16, energy: 100, xp: 20, salary: 22, value: 400, trait: "Resiliente", injuredUntil: 0 },
];
function createEvent(s: Campaign): GuildEvent {
  const n = s.eventSequence++, id = "event-" + s.day + "-" + n, kind = n % 4;
  if (kind === 1 && s.heroes.length > 4) {
    const h = s.heroes[Math.floor(random(s) * s.heroes.length)], fee = 50 + h.level * 15, sale = Math.round(h.value * .55);
    const rival = s.rivals[Math.floor(random(s) * s.rivals.length)];
    return { id, kind: "offer", heroId: h.id, rivalId: rival.id, title: "Uma proposta rival", text: h.name + " recebeu uma oferta de " + rival.name + ". Sua decisão muda o contrato.", choices: [
      { id: "negotiate", label: "Negociar permanência", effect: "−" + fee + " ouro agora · salário +3 · energia +15", cost: fee },
      { id: "leave", label: "Aceitar a transferência", effect: "+" + sale + " ouro · herói deixa a guilda" },
      { id: "refuse", label: "Recusar sem negociar", effect: "Herói fica · −15 energia · −5 renome" },
    ] };
  }
  if (kind === 2) return { id, kind: "map", title: "O cartógrafo viajante", text: "Um cartógrafo encontrou uma passagem esquecida. Seu mapa permite explorar contratos secretos.", choices: [
    { id: "buy", label: "Comprar o Mapa Secreto", effect: "−120 ouro · mapa adicionado ao baú", cost: 120 },
    { id: "guide", label: "Ajudar a levantar as rotas", effect: "−10 energia de todos · +8 renome · recebe o mapa" },
    { id: "decline", label: "Dispensar a oferta", effect: "Sem custo ou recompensa" },
  ] };
  if (kind === 3 || kind === 1) return { id, kind: "caravan", title: "Carga encontrada na estrada", text: "Uma caravana abandonou uma caixa de suprimentos. O dono procura quem a encontrou.", choices: [
    { id: "return", label: "Devolver a carga", effect: "+12 renome · recebe uma poção de cura" },
    { id: "sell", label: "Vender os suprimentos", effect: "+70 ouro · −10 renome" },
    { id: "share", label: "Dividir com os povoados", effect: "+18 renome · +10 energia de todos" },
  ] };
  return { id, kind: "village", title: "Aldeia pede ajuda", text: "Pedra Clara precisa reconstruir sua barricada. A aldeia pode pagar, mas o inverno está chegando.", choices: [
    { id: "charge", label: "Cobrar pelo serviço", effect: "+85 ouro · +2 renome" },
    { id: "free", label: "Ajudar gratuitamente", effect: "+20 renome · +8 energia de todos" },
    { id: "ignore", label: "Recusar o pedido", effect: "−8 renome" },
  ] };
}
type AddedFields = "chest" | "itemSequence" | "event" | "nextEventDay" | "eventSequence" | "region" | "bossSeasons" | "shopPurchases" | "rivalAttempts" | "lastNegotiation" | "formation" | "leagueTier" | "leagueWins" | "leagueDraws" | "leagueLosses" | "leagueHistory" | "rivalries" | "cup" | "journeys" | "journeySequence" | "expeditions" | "expeditionSequence" | "hqActionDay" | "squads";
type StoredRival = Pick<RivalGuild, "id" | "name" | "points" | "victories"> & Partial<RivalGuild>;
type StoredCampaign = Omit<Campaign, AddedFields | "rivals"> & Partial<Pick<Campaign, AddedFields>> & { rivals: StoredRival[] };
function normalizedFormation(s: Pick<Campaign, "heroes" | "team"> & Partial<Pick<Campaign, "formation">>) {
  const map: Record<string, FormationLine> = {};
  for (const id of s.team) {
    const h = s.heroes.find(hero => hero.id === id);
    if (h) map[id] = s.formation?.[id] || defaultFormationLine(h.class);
  }
  if (!formationValid(s.team, map) && s.team.length >= 3) {
    map[s.team[0]] = "front";
    for (let i = 1; i < s.team.length; i++) map[s.team[i]] = i === 1 && s.team.length === 4 ? "front" : "back";
  }
  return map;
}
export function normalizeCampaign(previous: StoredCampaign): Campaign {
  const s = structuredClone(previous) as Campaign;
  s.leagueTier ??= 3; s.leagueWins ??= 0; s.leagueDraws ??= 0; s.leagueLosses ??= 0; s.leagueHistory ??= []; s.rivalries ??= [];
  if (!s.cup) {
    const d = seasonDay(s), stage: CupStage = d <= 7 ? "oitavas" : d <= 14 ? "quartas" : d <= 21 ? "semifinal" : "final";
    s.cup = { season: s.season, stage, wins: stage === "oitavas" ? 0 : stage === "quartas" ? 1 : stage === "semifinal" ? 2 : 3, history: [] };
  }
  if (s.cup.season !== s.season) s.cup = { season: s.season, stage: "oitavas", wins: 0, history: [] };
  for (const h of s.heroes) {
    h.race ??= heroRace(h);
    if ((h.talent as { path: string } | undefined)?.path === "support") h.talent!.path = h.class === "healer" ? "healing" : "defense";
    if (h.talent && h.talent.rank >= 2 && !h.talent.branch) h.talent.branch = "a";
    if (h.racial && !["heritage", "spirit", "war"].includes(h.racial.path)) delete h.racial;
    if (h.racial) h.racial.rank = Math.max(1, Math.min(3, h.racial.rank || 1));
  }
  s.journeys ??= []; s.journeySequence ??= 0;
  s.journeys = s.journeys.filter(j => s.heroes.some(h => h.id === j.heroId) && j.remaining > 0).map(j => ({ ...j, choice: ["camp", "explore", "shortcut"].includes(j.choice) ? j.choice : "camp", xpEarned: j.xpEarned || 0, loot: j.loot || [] }));
  s.expeditions ??= []; s.expeditionSequence ??= 0; s.hqActionDay ??= {};
  s.squads ??= ([
    ["escort", "Vanguarda da Estrada"], ["defense", "Muralha da Guilda"], ["dungeon", "Lâminas da Cripta"], ["hunt", "Caçadores da Bruma"], ["boss", "Companhia de Elite"],
  ] as [MissionKind, string][]).map(([specialty, name]) => ({ id: "squad-" + specialty, name, specialty, team: [], formation: {}, tactic: specialty === "defense" || specialty === "boss" ? "defensive" : specialty === "hunt" ? "aggressive" : "balanced" }));
  s.squads = s.squads.filter(q => q && SQUAD_SPECIALTIES[q.specialty]).map(q => ({ ...q, id: q.id || "squad-" + q.specialty, name: (q.name || SQUAD_SPECIALTIES[q.specialty].label).slice(0, 32), team: (q.team || []).filter(id => s.heroes.some(h => h.id === id)).slice(0, 4), formation: q.formation || {}, tactic: Object.hasOwn(TACTICS, q.tactic) ? q.tactic : "balanced" }));
  if (!s.expeditions.length && s.lastBattle?.status === "active" && s.lastBattle.combat) {
    const legacyTeam = s.lastBattle.combat.fighters.filter(f => f.side === "hero").map(f => f.id);
    s.expeditions.push({ id: "expedition-" + (++s.expeditionSequence), slot: 1, team: legacyTeam, formation: { ...s.lastBattle.combat.formation }, tactic: s.lastBattle.combat.tactic, battle: s.lastBattle, startedDay: s.lastBattle.day, nextRoundAt: Date.now() + 2500 });
  }
  const claimedSlots = new Set<ExpeditionSlot>();
  for (const expedition of s.expeditions) {
    expedition.team = expedition.team.filter(id => s.heroes.some(h => h.id === id)).slice(0, 4);
    expedition.nextRoundAt = Number.isFinite(expedition.nextRoundAt) ? expedition.nextRoundAt : Date.now() + 2500;
    expedition.formation ??= {};
    expedition.tactic = Object.hasOwn(TACTICS, expedition.tactic) ? expedition.tactic : "balanced";
    if (expedition.battle.status === "active" && expedition.battle.combat) {
      const desired = ([1, 2, 3] as ExpeditionSlot[]).includes(expedition.slot as ExpeditionSlot) ? expedition.slot as ExpeditionSlot : undefined;
      if (desired && !claimedSlots.has(desired)) { expedition.slot = desired; claimedSlots.add(desired); }
      else {
        const fallback = ([1, 2, 3] as ExpeditionSlot[]).find(slot => !claimedSlots.has(slot)) || 3;
        expedition.slot = fallback; claimedSlots.add(fallback);
      }
    } else if (!([1, 2, 3] as ExpeditionSlot[]).includes(expedition.slot as ExpeditionSlot)) expedition.slot = 1;
    if (expedition.battle?.combat) {
      const c = expedition.battle.combat;
      c.pendingAbilities ??= []; c.abilityCooldowns ??= {}; c.formation ??= { ...expedition.formation };
      for (const f of c.fighters) { f.statuses ??= []; if (f.side === "hero") f.position ??= c.formation[f.id] || "back"; }
      if (expedition.battle.fighters) for (const f of expedition.battle.fighters) if (f.side === "hero") f.position ??= c.formation[f.id] || "back";
    }
  }
  s.expeditions = s.expeditions.filter(e => e.team.length >= 3 || e.battle.status !== "active").slice(-9);
  const deployed = new Set(activeExpeditions(s).flatMap(e => e.team));
  s.team = (s.team || []).filter(id => !deployed.has(id) && s.heroes.some(h => h.id === id)).slice(0, 4);
  for (const h of s.heroes) if (s.team.length < 4 && !deployed.has(h.id) && !s.team.includes(h.id) && h.energy >= 25 && h.injuredUntil <= s.day && !activeJourney(s, h.id)) s.team.push(h.id);
  s.formation = normalizedFormation(s);
  if (!s.chest) { s.chest = []; s.itemSequence = 0; addItem(s, "healing_potion"); addItem(s, "healing_potion"); }
  s.itemSequence ??= s.chest.length; s.region ??= 1; s.bossSeasons ??= []; s.shopPurchases ??= [];
  s.rivalAttempts ??= []; s.lastNegotiation ??= null;
  s.rivals = s.rivals.slice(0, LEAGUE_SIZE - 1).map((r, i) => r.heroes?.length && r.strength && r.recruitSequence !== undefined ? r : { ...createRival(i, s), ...r });
  const ids = new Set(s.rivals.map(r => r.id));
  for (let i = 0; s.rivals.length < LEAGUE_SIZE - 1; i++) if (!ids.has("rival-" + i)) { const r = createRival(i, s); s.rivals.push(r); ids.add(r.id); }
  for (const rival of s.rivals) for (const h of rival.heroes) { h.race ??= heroRace(h); if (h.talent && h.talent.rank >= 2 && !h.talent.branch) h.talent.branch = (stableNumber(h.id + ":branch") % 2 ? "b" : "a"); }
  s.nextEventDay ??= s.day + 4; s.eventSequence ??= 0;
  if (s.event === undefined) s.event = createEvent(s);
  if (s.lastBattle?.combat) {
    const c = s.lastBattle.combat;
    c.pendingAbilities ??= []; c.abilityCooldowns ??= {}; c.formation ??= normalizedFormation(s);
    for (const f of c.fighters) { f.statuses ??= []; if (f.side === "hero") f.position ??= c.formation[f.id] || "back"; }
    if (s.lastBattle.fighters) for (const f of s.lastBattle.fighters) if (f.side === "hero") f.position ??= c.formation[f.id] || "back";
  }
  return s;
}
export function newCampaign(seed = 381077): Campaign {
  return normalizeCampaign({ schema: 1, name: "Guilda do Alvorecer", day: 1, season: 1, gold: 1500, fame: 0, points: 0, wins: 0, losses: 0, arsenal: 0, heroes: structuredClone(initialHeroes), team: ["aric", "lyra", "elen", "kael"], tactic: "balanced", hired: [], rivals: ["Lobos de Ferro", "Ordem da Aurora", "Corvos de Ashen", "Sentinelas do Norte", "Chama Eterna"].map((name, i) => ({ id: "rival-" + i, name, points: 0, victories: 0 })), ledger: [{ id: 0, day: 1, label: "Fundo inicial da guilda", amount: 1500 }], journal: [{ day: 1, text: "Sua guilda foi fundada. Resolva o pedido da aldeia e prepare sua primeira expedição." }], lastBattle: null, rng: seed >>> 0, transaction: 0 });
}
export function missions(s: Campaign): Mission[] {
  const scaling = 1 + (s.season - 1) * .22 + ((s.region || 1) - 1) * .08 + Math.floor((seasonDay(s) - 1) / 7) * .03;
  return [1, 2, 3, 4, 5].map((difficulty, i) => {
    const index = (s.day + i + 2) % templates.length, region = Math.min(4, s.region || 1), t = { ...templates[index] };
    const titles = [
      ["Caravana de Valen", "A defesa de Pedra Clara", "O despertar da cripta", "Caçada nas brumas"],
      ["Escolta de Brumavale", "O posto da floresta", "As cavernas das raízes", "Predadores de Brumavale"],
      ["Relíquias para Ashen", "O cerco à torre de Ashen", "Masmorra de Cinzabranca", "Caçada aos espectros"],
      ["Caravana da Fronteira", "A muralha dos dragões", "O templo do dragão", "Caçada aos dracos"],
    ];
    t.title = titles[region - 1][index];
    if (region > 1) { t.location = REGIONS[region - 1]; t.enemy = [["Bandido", "Saqueador", "Esqueleto", "Lobo sombrio"], ["Emboscador", "Troll", "Aranha ancestral", "Pantera das brumas"], ["Cultista", "Cavaleiro espectral", "Guardião antigo", "Espectro"], ["Salteador dracônico", "Guerreiro draco", "Guardião de obsidiana", "Draco selvagem"]][region - 1][index]; }
    return { ...t, id: "mission-" + s.day + "-" + i, title: i === 3 ? "Passagem secreta de " + REGIONS[((s.region || 1) - 1) % 4] : i === 4 ? "O cofre dos antigos" : t.title, rank: difficulty, force: Math.round([100, 172, 205, 285, 380][i] * scaling), reward: Math.round([55, 90, 145, 230, 350][i] * (1 + (s.season - 1) * .07)), count: i === 0 ? 3 : 4, requiredFame: i === 3 ? 120 : i === 4 ? 260 : 0, requiredItem: i === 3 ? "secret_map" : i === 4 ? "ancient_key" : undefined };
  });
}
export function seasonBoss(s: Campaign): Mission | null {
  if (seasonDay(s) < 21 || s.bossSeasons?.includes(s.season)) return null;
  const idx = (s.season - 1) % 3;
  return { id: "boss-" + s.season, title: ["O Vigia de Ashen", "A Matriarca das Brumas", "O Senhor da Fronteira"][idx], location: REGIONS[((s.region || 1) - 1) % 4], description: ["A cada três turnos, ataca todos os heróis.", "Recupera vida a cada três turnos. A ofensiva exige proteção.", "Seus golpes ficam mais fortes a cada turno. Prepare cura e defesa."][idx], rank: 3, force: Math.round(280 * (1 + (s.season - 1) * .24 + ((s.region || 1) - 1) * .06)), reward: Math.round(230 * (1 + (s.season - 1) * .07)), enemy: ["Vigia", "Matriarca", "Senhor da Fronteira"][idx], count: 3, specialty: idx === 0 ? "undead" : "ranger", flavor: "Vitória: +45 renome, equipamento épico e Chave Antiga." + (s.region < 4 ? " Libera uma nova região." : ""), kind: "boss", requiredFame: 0, boss: idx };
}
export function trainingPlan(s: Campaign, h: Hero) {
  const gap = Math.max(0, Math.max(...s.heroes.map(hero => hero.level)) - h.level);
  return { cost: 90, xp: 90 + Math.min(4, gap) * 35, energy: 15, catchup: Math.min(4, gap) * 35 };
}
const extraHeroes: Hero[] = [
  { id: "monk-base", name: "Finn do Norte", class: "monk", level: 2, attack: 31, defense: 22, magic: 10, energy: 100, xp: 0, salary: 22, value: 400, trait: "Disciplinado", injuredUntil: 0 },
  { id: "necro-base", name: "Iris Fogoluz", class: "necromancer", level: 2, attack: 12, defense: 12, magic: 34, energy: 100, xp: 0, salary: 24, value: 420, trait: "Sombria", injuredUntil: 0 },
  { id: "druid-base", name: "Vera da Bruma", class: "druid", level: 2, attack: 17, defense: 18, magic: 28, energy: 100, xp: 0, salary: 20, value: 400, trait: "Naturalista", injuredUntil: 0 },
  { id: "bard-base", name: "Bryn Ventoazul", class: "bard", level: 2, attack: 20, defense: 16, magic: 24, energy: 100, xp: 0, salary: 21, value: 380, trait: "Inspirador", injuredUntil: 0 },
];
export function market(s: Campaign): Hero[] {
  const week = Math.floor((s.day - 1) / 7), names = ["Mira da Lua", "Thane Martelo", "Neris de Valen", "Vera da Bruma", "Orin Runapálida", "Finn do Norte", "Iris Fogoluz", "Bryn Ventoazul"], classes: HeroClass[] = ["monk", "necromancer", "druid", "bard", "ranger", "warrior", "mage", "healer", "paladin", "rogue"];
  return [0, 1, 2, 3].map(i => {
    const c = classes[(week * 4 + i) % classes.length], lvl = 2 + ((week + i) % 4) + Math.floor((s.season - 1) / 2), b = [...initialHeroes, ...extraHeroes].find(h => h.class === c)!;
    const hero: Hero = { ...b, class: c, id: "hire-" + week + "-" + i, name: week === 0 ? b.name : names[(week * 3 + i) % names.length], level: lvl, attack: b.attack + (lvl - b.level) * 3, defense: b.defense + (lvl - b.level) * 2, magic: b.magic + (lvl - b.level) * 3, energy: 100, xp: 0, salary: 12 + lvl * 5, value: 140 + lvl * 115 + i * 25, injuredUntil: 0 };
    hero.race = heroRace(hero); return hero;
  }).filter(h => !s.hired.includes(h.id));
}
function stableNumber(text: string) { let n = 2166136261; for (const c of text) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; }
const guildNames = ["Lobos de Ferro", "Ordem da Aurora", "Corvos de Ashen", "Sentinelas do Norte", "Chama Eterna"];
const guildOrders = ["Guardiões", "Cavaleiros", "Vigias", "Filhos", "Dragões", "Escudos", "Andarilhos", "Arautos", "Caçadores", "Juramentados"];
const guildPlaces = ["da Lua", "do Sol", "da Montanha", "do Abismo", "da Tempestade", "do Crepúsculo", "da Floresta", "da Fronteira", "da Torre", "do Vale"];
const adventurerNames = ["Aerin", "Borin", "Celia", "Darius", "Eira", "Faelan", "Galen", "Helia", "Isen", "Jora", "Korin", "Liora", "Mael", "Nyra", "Oren", "Petra", "Quinn", "Riven", "Selene", "Tarin"];
const adventurerTitles = ["da Alvorada", "Pedrafria", "da Lua", "Ventonegro", "de Valen", "Solbravo", "da Bruma", "Ferroazul", "Runaclara", "do Norte", "Coração de Aço", "das Cinzas", "Luzalta", "da Fronteira", "Tempestade", "do Vale", "Flecha de Prata", "da Torre", "Folha Dourada", "do Abismo", "da Floresta", "Maré Alta", "Lâmina Branca", "do Ocaso", "da Fortaleza", "Chama Viva", "da Colina", "Sombra Longa", "do Horizonte", "do Lago"];
function developRival(h: RivalHero, index: number) {
  let points = talentPoints(h);
  while (points-- > 0) {
    if (!h.talent) h.talent = { path: (["healer", "druid"].includes(h.class) ? "healing" : index % 3 === 0 ? "defense" : "offense"), rank: 1 };
    else if (h.talent.rank === 1) { h.talent.branch = (stableNumber(h.id + ":branch") % 2 ? "b" : "a"); h.talent.rank = 2; }
    else h.talent.rank = Math.min(3, h.talent.rank + 1);
  }
}
function rivalAdventurer(guild: Pick<RivalGuild, "id" | "strength">, sequence: number, season: number, rookie = false): RivalHero {
  const index = Number(guild.id.split("-")[1]) || 0, n = index * 6 + sequence;
  const c = (Object.keys(CLASSES) as HeroClass[])[(index * 3 + sequence) % 10], base = [...initialHeroes, ...extraHeroes].find(h => h.class === c)!;
  const level = (rookie ? 1 : guild.strength + sequence % 2) + Math.floor((season - 1) / 2), magical = ["mage", "healer", "necromancer", "druid", "bard"].includes(c);
  const h: RivalHero = { ...base, id: guild.id + "-hero-" + sequence, name: adventurerNames[n % adventurerNames.length] + " " + adventurerTitles[Math.floor(n / adventurerNames.length) % adventurerTitles.length], class: c, level, attack: Math.max(5, base.attack + (level - base.level) * (magical ? 1 : 3)), defense: Math.max(5, base.defense + (level - base.level) * 2), magic: Math.max(1, base.magic + (level - base.level) * (magical || c === "paladin" ? 3 : 1)), energy: 100, xp: 0, salary: 12 + level * 5, value: 140 + level * 115, injuredUntil: 0, loyalty: 35 + stableNumber(guild.id + ":" + sequence) % 56 };
  h.race = heroRace(h); developRival(h, index + sequence); return h;
}
export function rivalPower(guild: RivalGuild) { return guild.heroes.map(h => rating(h)).sort((a, b) => b - a).slice(0, 4).reduce((n, p) => n + p, 0); }
export function rivalWinChance(guild: RivalGuild, s: Campaign) {
  const reference = 26 + guild.strength * 5 + (s.season - 1) * 1.5;
  return Math.max(.22, Math.min(.84, .34 + guild.strength * .07 + (rivalPower(guild) / 4 - reference) / 150));
}
function createRival(index: number, s: Campaign): RivalGuild {
  const named = index - guildNames.length;
  const guild: RivalGuild = { id: "rival-" + index, name: guildNames[index] || guildOrders[Math.floor(named / guildPlaces.length) % guildOrders.length] + " " + guildPlaces[named % guildPlaces.length], points: 0, victories: 0, strength: index < 5 ? 5 : 1 + index * 7 % 5, heroes: [], recruitSequence: 5 };
  guild.heroes = [0, 1, 2, 3, 4].map(i => rivalAdventurer(guild, i, s.season));
  for (const h of guild.heroes) { gainXp(h, Math.floor((seasonDay(s) - 1) / 7) * 70); developRival(h, index); }
  for (let day = 1; day < seasonDay(s); day++) {
    const roll = stableNumber(guild.id + ":" + s.season + ":" + day) / 4294967296;
    if (roll < rivalWinChance(guild, s)) { guild.points += 3; guild.victories++; } else if (roll < rivalWinChance(guild, s) + .18) guild.points++;
  }
  return guild;
}
export const NEGOTIATION_MODES: Record<NegotiationMode, { title: string; description: string }> = {
  transfer: { title: "Negociar transferência", description: "Pague a liberação e assine o contrato. Acordo garantido se cumprir os requisitos." },
  offer: { title: "Oferecer contrato melhor", description: "Tente convencer o aventureiro com um salário maior. Ele pode recusar." },
  covert: { title: "Aliciar em segredo", description: "Abordagem mais barata, com mais chance de convencer. Custa renome mesmo se ele recusar." },
};
export function rivalAttemptsThisWeek(s: Campaign) { const prefix = Math.floor((s.day - 1) / 7) + ":"; return s.rivalAttempts.filter(a => a.startsWith(prefix)); }
export function negotiationQuote(s: Campaign, guild: RivalGuild, h: RivalHero, mode: NegotiationMode) {
  const base = Math.round(h.value * (1.05 + guild.strength * .08 + h.loyalty / 250));
  const fame = Math.max(0, (h.level - 2) * 30 + (guild.strength - 1) * 20);
  const playerPower = s.heroes.map(hero => rating(hero, s.arsenal, s)).sort((a, b) => b - a).slice(0, 4).reduce((n, p) => n + p, 0);
  const appeal = Math.max(-15, Math.min(15, (playerPower - rivalPower(guild)) / 8));
  const chance = mode === "transfer" ? 100 : Math.round(Math.max(20, Math.min(92, 66 - h.loyalty * .45 + Math.min(25, s.fame / 20) + appeal + (mode === "covert" ? 10 : 0))));
  const price = Math.round(base * (mode === "transfer" ? 1 : mode === "offer" ? .8 : .6));
  const requiredFame = Math.round(fame * (mode === "transfer" ? 1 : mode === "offer" ? .75 : .5));
  const fee = mode === "transfer" ? 0 : mode === "offer" ? 45 : 60;
  const salary = h.salary + (mode === "offer" ? 5 : mode === "covert" ? 3 : 2);
  const attempted = rivalAttemptsThisWeek(s).includes(Math.floor((s.day - 1) / 7) + ":" + h.id);
  const reason = battleActive(s) ? "Conclua o combate para negociar." : s.heroes.length >= 12 ? "A guilda já tem 12 heróis." : attempted ? "Já abordou este herói nesta semana." : rivalAttemptsThisWeek(s).length >= 3 ? "As três propostas desta semana já foram usadas." : s.fame < requiredFame ? "Exige " + requiredFame + " de renome (atual: " + s.fame + ")." : s.gold < price ? "Reserve " + price + " de ouro para o contrato." : "";
  return { price, fee, chance, requiredFame, salary, reason, eligible: !reason };
}
function negotiateRival(s: Campaign, action: Extract<Action, { type: "negotiate-rival" }>) {
  requireRule(Object.hasOwn(NEGOTIATION_MODES, action.mode), "Escolha uma abordagem válida.");
  const guild = s.rivals.find(g => g.id === action.guildId), h = guild?.heroes.find(h => h.id === action.heroId);
  requireRule(guild && h, "Esse aventureiro não está mais nessa guilda.");
  const q = negotiationQuote(s, guild, h, action.mode); requireRule(q.eligible, q.reason);
  const success = action.mode === "transfer" || random(s) * 100 < q.chance, fame = s.fame;
  const cost = success ? q.price : q.fee;
  entry(s, (success ? "Contrato rival · " : "Proposta recusada · ") + h.name, -cost);
  s.rivalAttempts.push(Math.floor((s.day - 1) / 7) + ":" + h.id);
  if (action.mode === "covert") s.fame = Math.max(0, s.fame - (success ? 15 : 8));
  if (success) {
    const { loyalty: _loyalty, ...hero } = h;
    hero.salary = q.salary; s.heroes.push(hero);
    guild.heroes = guild.heroes.filter(x => x.id !== h.id);
    guild.heroes.push(rivalAdventurer(guild, guild.recruitSequence++, s.season, true));
    raiseRivalry(s, guild.id, action.mode === "covert" ? 45 : action.mode === "offer" ? 30 : 20, "Aventureiro recrutado da rival");
  } else if (action.mode === "covert") raiseRivalry(s, guild.id, 12, "Aliciamento secreto descoberto");
  const message = success ? h.name + " deixou " + guild.name + " e entrou para sua guilda. Salário: " + q.salary + " ouro/semana. Rivalidade: " + rivalryHeat(s, guild.id) + "/100." : h.name + " recusou a proposta e permaneceu em " + guild.name + ". Você pagou " + cost + " ouro pela abordagem.";
  s.lastNegotiation = { id: s.transaction, day: s.day, guildId: guild.id, guildName: guild.name, heroId: h.id, heroName: h.name, mode: action.mode, success, cost, chance: q.chance, fameChange: s.fame - fame, salary: q.salary, message };
  note(s, message + (s.fame !== fame ? " Renome: " + fame + " → " + s.fame + "." : ""));
}

function raiseRivalry(s: Campaign, guildId: string, amount: number, reason: string) {
  let rivalry = s.rivalries.find(r => r.guildId === guildId);
  if (!rivalry) { rivalry = { guildId, heat: 0, sinceSeason: s.season, lastReason: reason }; s.rivalries.push(rivalry); }
  rivalry.heat = Math.max(0, Math.min(100, rivalry.heat + amount)); rivalry.lastReason = reason;
}
function formationLeagueBonus(s: Campaign) {
  const ids = s.team, map = normalizedFormation(s), front = ids.filter(id => map[id] === "front").length;
  const backlineSupport = s.heroes.filter(h => ids.includes(h.id) && map[h.id] === "back" && ["mage", "healer", "ranger", "druid", "bard", "necromancer"].includes(h.class)).length;
  return front >= 1 && front <= 3 ? 1 + Math.min(.06, backlineSupport * .015) : .92;
}
function duelOutcome(s: Campaign, playerPower: number, opponentPower: number, allowDraw: boolean): { result: LeagueResult; playerScore: number; opponentScore: number } {
  const diff = playerPower - opponentPower, winChance = Math.max(.18, Math.min(.78, .5 + diff / 420)), drawChance = allowDraw ? .18 : 0;
  const roll = random(s);
  const result: LeagueResult = roll < winChance ? "win" : allowDraw && roll < winChance + drawChance ? "draw" : "loss";
  if (result === "draw") { const score = random(s) < .7 ? 1 : 2; return { result, playerScore: score, opponentScore: score }; }
  const loser = random(s) < .65 ? 0 : 1, winner = loser + (random(s) < .7 ? 1 : 2);
  return result === "win" ? { result, playerScore: winner, opponentScore: loser } : { result, playerScore: loser, opponentScore: winner };
}
function resolveLeagueDay(s: Campaign) {
  const day = seasonDay(s), opponent = scheduledLeagueOpponent(s, day), heat = rivalryHeat(s, opponent.id), rivalry = heat >= 30;
  const playerPower = Math.round(teamPower(s) * formationLeagueBonus(s));
  const opponentPower = rivalPower(opponent) + LEAGUE_TIERS[s.leagueTier].rivalBonus * 4;
  const outcome = duelOutcome(s, playerPower, opponentPower, true);
  if (outcome.result === "win") { s.points += 3; s.leagueWins++; } else if (outcome.result === "draw") { s.points++; s.leagueDraws++; } else s.leagueLosses++;
  if (outcome.result === "loss") { opponent.points += 3; opponent.victories++; } else if (outcome.result === "draw") opponent.points++; else if (outcome.result === "win") { /* rival receives zero */ }
  const match: LeagueMatch = { season: s.season, day, opponentId: opponent.id, opponentName: opponent.name, playerScore: outcome.playerScore, opponentScore: outcome.opponentScore, result: outcome.result, playerPower, opponentPower, rivalry };
  s.leagueHistory.unshift(match); s.leagueHistory = s.leagueHistory.slice(0, 120);
  if (rivalry) { const delta = outcome.result === "win" ? 3 : outcome.result === "loss" ? -2 : 0; s.fame = Math.max(0, s.fame + delta); }
  note(s, (rivalry ? "Clássico da liga" : "Liga") + " · " + s.name + " " + outcome.playerScore + " × " + outcome.opponentScore + " " + opponent.name + ". " + (outcome.result === "win" ? "+3 pontos." : outcome.result === "draw" ? "+1 ponto." : "Sem pontos."));
  for (const r of s.rivals) if (r.id !== opponent.id) { const p = random(s), win = rivalWinChance(r, s); if (p < win) { r.points += 3; r.victories++; } else if (p < win + .18) r.points++; }
}
const CUP_DAYS = [7, 14, 21, 28];
const CUP_STAGE_ORDER: CupStage[] = ["oitavas", "quartas", "semifinal", "final"];
const CUP_LABELS: Record<CupStage, string> = { oitavas: "Oitavas de final", quartas: "Quartas de final", semifinal: "Semifinal", final: "Final", champion: "Campeão", eliminated: "Eliminado" };
export function cupStageLabel(stage: CupStage) { return CUP_LABELS[stage]; }
function resolveCupDay(s: Campaign) {
  const day = seasonDay(s), slot = CUP_DAYS.indexOf(day);
  if (slot < 0 || s.cup.stage === "eliminated" || s.cup.stage === "champion" || s.cup.stage !== CUP_STAGE_ORDER[slot]) return;
  const opponent = s.rivals[((s.season - 1) * 41 + day * 17 + 11) % s.rivals.length];
  const playerPower = Math.round(teamPower(s) * formationLeagueBonus(s) * 1.02), opponentPower = rivalPower(opponent) + LEAGUE_TIERS[s.leagueTier].rivalBonus * 4;
  const outcome = duelOutcome(s, playerPower, opponentPower, false), stage = s.cup.stage;
  const match: LeagueMatch = { season: s.season, day, opponentId: opponent.id, opponentName: opponent.name, playerScore: outcome.playerScore, opponentScore: outcome.opponentScore, result: outcome.result, playerPower, opponentPower, rivalry: rivalryHeat(s, opponent.id) >= 30, cup: true, stage: CUP_LABELS[stage] };
  s.cup.history.unshift(match);
  if (outcome.result === "win") {
    s.cup.wins++; const reward = [80, 120, 180, 350][slot]; entry(s, "Copa das Guildas · " + CUP_LABELS[stage], reward); s.fame += [4, 7, 12, 25][slot];
    s.cup.stage = slot === 3 ? "champion" : CUP_STAGE_ORDER[slot + 1];
    note(s, "Copa das Guildas · " + CUP_LABELS[stage] + ": vitória por " + outcome.playerScore + " × " + outcome.opponentScore + " contra " + opponent.name + ". +" + reward + " ouro.");
  } else { s.cup.stage = "eliminated"; note(s, "Copa das Guildas · " + CUP_LABELS[stage] + ": eliminação por " + outcome.playerScore + " × " + outcome.opponentScore + " contra " + opponent.name + "."); }
}
function createRetaliationEvent(s: Campaign): GuildEvent | null {
  if (s.heroes.length <= 4) return null;
  const rivalry = [...s.rivalries].filter(r => r.heat >= 25).sort((a, b) => b.heat - a.heat)[0]; if (!rivalry) return null;
  const rival = s.rivals.find(r => r.id === rivalry.guildId); if (!rival) return null;
  const candidates = s.heroes.filter(h => !s.event?.heroId || h.id !== s.event.heroId).sort((a, b) => rating(b, s.arsenal, s) - rating(a, s.arsenal, s));
  const hero = candidates[Math.floor(random(s) * Math.min(4, candidates.length))]; if (!hero) return null;
  const fee = 65 + hero.level * 18, sale = Math.round(hero.value * .55), id = "retaliation-" + s.day + "-" + (++s.eventSequence);
  return { id, kind: "retaliation", heroId: hero.id, rivalId: rival.id, title: rival.name + " contra-ataca", text: rival.name + " tentou tirar " + hero.name + " da sua guilda depois da disputa no mercado. A rivalidade está em " + rivalry.heat + "/100.", choices: [
    { id: "counter", label: "Cobrir a proposta", effect: "−" + fee + " ouro · salário +2 · reduz rivalidade", cost: fee },
    { id: "leave", label: "Aceitar a transferência", effect: "+" + sale + " ouro · herói vai para " + rival.name },
    { id: "prestige", label: "Usar o peso da guilda", effect: "−12 renome · herói fica · rivalidade aumenta" },
  ] };
}

export function shop(s: Campaign) {
  const week = Math.floor((s.day - 1) / 7), races = Object.keys(RACES) as HeroRace[];
  const primary = races[week % races.length], secondary = races[(week + 1) % races.length];
  const racialKeys = [RACE_GEAR[primary].weapon, RACE_GEAR[primary].armor, RACE_GEAR[secondary].weapon, RACE_GEAR[secondary].armor];
  return [
    { key: "healing_potion", price: 35, requiredFame: 0, available: true },
    { key: "iron_sword", price: 95, requiredFame: 0, available: !s.shopPurchases.includes(week + ":iron_sword") },
    { key: "leather_armor", price: 90, requiredFame: 0, available: !s.shopPurchases.includes(week + ":leather_armor") },
    ...racialKeys.map((key, i) => ({ key, price: ITEMS[key].value + 55 + i * 4, requiredFame: 25, available: !s.shopPurchases.includes(week + ":" + key) })),
    { key: "secret_map", price: 180, requiredFame: 80, available: !s.shopPurchases.includes(week + ":secret_map") },
  ];
}
function gainXp(h: Hero, value: number) {
  if (h.level >= MAX_HERO_LEVEL) { h.level = MAX_HERO_LEVEL; h.xp = 0; return 0; }
  h.xp += Math.max(0, Math.round(value)); let levels = 0;
  while (h.level < MAX_HERO_LEVEL && h.xp >= threshold(h)) {
    h.xp -= threshold(h); h.level++; levels++;
    if (["warrior", "ranger", "rogue"].includes(h.class)) h.attack += 1;
    if (["paladin", "warrior"].includes(h.class) && h.level % 2 === 0) h.defense += 1;
    if (["mage", "healer", "bard"].includes(h.class)) h.magic += 1;
    if (h.class === "paladin" && h.level % 3 === 0) h.magic += 1;
    if (h.class === "bard" && h.level % 4 === 0) h.attack += 1;
  }
  if (h.level >= MAX_HERO_LEVEL) { h.level = MAX_HERO_LEVEL; h.xp = 0; }
  return levels;
}
export const JOURNEY_OPTIONS: Record<JourneyDuration, { label: string; dailyXp: number; description: string }> = {
  3: { label: "Rota curta · 3 dias", dailyXp: 28, description: "Viagem rápida para desenvolver um herói sem afastá-lo por muito tempo." },
  5: { label: "Rota média · 5 dias", dailyXp: 34, description: "Mais experiência e chance maior de encontrar saque." },
  7: { label: "Rota longa · 7 dias", dailyXp: 40, description: "Maior desenvolvimento, com recompensa extra ao concluir." },
};
export const JOURNEY_CHOICES: Record<JourneyChoice, { name: string; description: string }> = {
  camp: { name: "Acampamento", description: "Segue com segurança e recupera energia durante a viagem." },
  explore: { name: "Exploração", description: "Ganha mais XP e pode encontrar saque, mas consome energia." },
  shortcut: { name: "Atalho", description: "Avança mais rápido, com um pouco menos de XP diário." },
};
function processJourneys(s: Campaign) {
  if (!s.journeys?.length) return;
  const highest = Math.max(...s.heroes.map(h => h.level));
  const completed: HeroJourney[] = [];
  for (const journey of s.journeys) {
    const h = s.heroes.find(hero => hero.id === journey.heroId); if (!h) { completed.push(journey); continue; }
    const catchup = Math.min(30, Math.max(0, highest - h.level) * 6);
    let xp = JOURNEY_OPTIONS[journey.duration].dailyXp + catchup;
    if (journey.choice === "explore") { xp = Math.round(xp * 1.35); h.energy = Math.max(0, h.energy - 4); if (random(s) < .28) { const loot = random(s) < .6 ? "gemstone" : RACE_GEAR[heroRace(h)][random(s) < .5 ? "weapon" : "armor"]; addItem(s, loot); journey.loot.push(loot); } }
    else if (journey.choice === "camp") h.energy = Math.min(100, h.energy + 8);
    else xp = Math.round(xp * .82);
    gainXp(h, xp); journey.xpEarned += xp;
    journey.remaining -= journey.choice === "shortcut" ? 2 : 1;
    if (journey.remaining <= 0) {
      journey.remaining = 0; completed.push(journey); s.fame += 3 + journey.duration;
      if (journey.duration === 7) { const reward = RACE_GEAR[heroRace(h)][random(s) < .5 ? "weapon" : "armor"]; addItem(s, reward); journey.loot.push(reward); }
      note(s, h.name + " voltou de uma viagem de " + journey.duration + " dias com +" + journey.xpEarned + " XP" + (journey.loot.length ? " e " + journey.loot.length + " item(ns)" : "") + ".");
    }
  }
  if (completed.length) s.journeys = s.journeys.filter(j => !completed.includes(j));
}
function advance(s: Campaign, used: string[]) {
  s.heroes.forEach(h => { if (!used.includes(h.id) && !activeJourney(s, h.id)) h.energy = Math.min(100, h.energy + 18); });
  processJourneys(s);
  resolveLeagueDay(s); resolveCupDay(s);
  const upkeep = Math.min(8, s.gold); if (upkeep) entry(s, "Manutenção diária", -upkeep);
  s.rivalries.forEach(r => r.heat = Math.max(0, r.heat - 2)); s.rivalries = s.rivalries.filter(r => r.heat > 0);
  s.day++;
  if ((s.day - 1) % 7 === 0) {
    s.shopPurchases = [];
    s.rivalAttempts = [];
    s.rivals.forEach((r, i) => r.heroes.forEach(h => { gainXp(h, 70); h.energy = Math.min(100, h.energy + 40); developRival(h, i); }));
    const due = payroll(s), paid = Math.min(due, s.gold); if (paid) entry(s, "Salários semanais", -paid);
    if (paid < due) { s.heroes.forEach(h => h.energy = Math.max(0, h.energy - 10)); note(s, "Faltou ouro para os salários. A equipe perdeu 10 de energia."); }
  }
  if ((s.day - 1) % 28 === 0) {
    const place = standings(s).findIndex(r => r.id === "player") + 1, oldTier = s.leagueTier, prize = leaguePrize(place, oldTier);
    entry(s, "Prêmio da temporada " + s.season + " · " + LEAGUE_TIERS[oldTier].name + " · " + place + "º lugar", prize);
    let movement = "Permaneceu na " + LEAGUE_TIERS[oldTier].name + ".";
    if (place <= 10 && oldTier > 1) { s.leagueTier = (oldTier - 1) as LeagueTier; movement = "PROMOÇÃO para a " + LEAGUE_TIERS[s.leagueTier].name + "."; }
    else if (place >= 91 && oldTier < 3) { s.leagueTier = (oldTier + 1) as LeagueTier; movement = "REBAIXAMENTO para a " + LEAGUE_TIERS[s.leagueTier].name + "."; }
    note(s, "Temporada " + s.season + " encerrada em " + place + "º lugar na " + LEAGUE_TIERS[oldTier].name + ". Prêmio: " + prize + " ouro. " + movement);
    s.season++; s.points = 0; s.wins = 0; s.losses = 0; s.leagueWins = 0; s.leagueDraws = 0; s.leagueLosses = 0;
    s.rivals.forEach(r => { r.points = 0; r.victories = 0; });
    s.cup = { season: s.season, stage: "oitavas", wins: 0, history: [] };
  }
  if (!s.event) {
    const hot = [...s.rivalries].sort((a, b) => b.heat - a.heat)[0];
    if (hot && hot.heat >= 25 && random(s) < Math.min(.55, .1 + hot.heat / 180)) s.event = createRetaliationEvent(s);
    if (!s.event && s.day >= s.nextEventDay) { s.event = createEvent(s); s.nextEventDay = s.day + 4; }
  }
}
function selectTeam(s: Campaign, ids: string[], tactic: Tactic, formation?: Record<string, FormationLine>) {
  requireRule(Array.isArray(ids) && ids.length >= 3 && ids.length <= 4 && new Set(ids).size === ids.length, "Escale 3 ou 4 heróis diferentes.");
  requireRule(Object.hasOwn(TACTICS, tactic), "Escolha uma tática válida.");
  const team = ids.map(id => s.heroes.find(h => h.id === id));
  requireRule(team.every(h => !!h), "Um dos heróis não pertence à guilda.");
  requireRule(team.every(h => available(h!, s)), "Há um herói ferido ou com menos de 25 de energia. Troque-o ou descanse.");
  const chosen: Record<string, FormationLine> = {};
  for (const h of team as Hero[]) chosen[h.id] = formation?.[h.id] || s.formation?.[h.id] || defaultFormationLine(h.class);
  if (!formationValid(ids, chosen)) { chosen[ids[0]] = "front"; for (let i = 1; i < ids.length; i++) chosen[ids[i]] = i === 1 && ids.length === 4 ? "front" : "back"; }
  requireRule(formationValid(ids, chosen), "A formação precisa ter pelo menos um herói na frente e um na retaguarda.");
  s.team = [...ids]; s.formation = chosen; s.tactic = tactic; return team as Hero[];
}
function startBattle(s: Campaign, m: Mission, team: Hero[]) {
  const scaling = m.force / [90, 142, 190, 250, 310][m.rank - 1];
  const fighters: Combatant[] = team.map(h => {
    const base = heroStats(h, s), position = s.formation[h.id] || defaultFormationLine(h.class);
    const n = { ...base, defense: base.defense * (position === "front" ? 1.1 : 1), attack: base.attack * (position === "back" ? 1.06 : 1), magic: base.magic * (position === "back" ? 1.06 : 1), speed: base.speed + (position === "back" ? 2 : 0) };
    const hp = Math.round(80 + n.defense * 3 + h.level * 15 + n.hp);
    return { ...n, id: h.id, name: h.name, side: "hero", class: h.class, hp, maxHp: hp, position, statuses: [], energy: h.energy, guarding: h.talent?.path === "defense" && ["warrior", "paladin", "monk"].includes(h.class) ? h.talent.rank : 0 };
  });
  for (let i = 0; i < m.count; i++) {
    const boss = m.kind === "boss" && i === 0, hp = Math.round((65 + m.rank * 48) * scaling * (boss ? 2.1 : 1));
    fighters.push({ id: "enemy-" + i, name: boss ? m.title : m.enemy + " " + (i + 1), side: "enemy", hp, maxHp: hp, attack: (12 + m.rank * 9.5) * scaling * (boss ? 1.16 : 1), defense: 5 + m.rank * 4 + (boss ? 8 : 0), magic: 0, speed: boss ? 22 : 17, critical: .05, energy: 100, healing: 1, guarding: 0, statuses: [] });
  }
  const agile = team.filter(h => ["rogue", "ranger", "monk"].includes(h.class)).length;
  const scout = team.some(h => h.class === "ranger" && h.talent?.path === "defense");
  const objectiveMax = m.kind === "escort" ? 170 + m.rank * 25 : m.kind === "defense" ? 200 + Math.round(fighters.filter(f => f.side === "hero").reduce((n, f) => n + f.defense, 0) * .6) : 0;
  const targetRounds = m.kind === "escort" ? Math.max(3, 6 - (agile >= 2 ? 1 : 0) - (scout ? 1 : 0)) : m.kind === "defense" ? 6 : m.kind === "hunt" ? 12 : 24;
  return { title: m.title, day: s.day, won: false, reward: 0, xp: 0, rounds: 0, log: [], levelUps: [], wounded: [], remaining: team.length, fighters: fighters.map(f => ({ id: f.id, name: f.name, side: f.side, class: f.class, hp: f.hp, maxHp: f.maxHp, position: f.position, statuses: [] })), status: "active", loot: [], combat: { mission: m, fighters, tactic: s.tactic, lastTactic: s.tactic, fatigueTotal: 0, potionsUsed: 0, pendingAbilities: [], abilityCooldowns: {}, formation: { ...s.formation }, objectiveHp: objectiveMax, objectiveMax, targetRounds }, objective: { name: m.kind === "escort" ? "Caravana" : m.kind === "defense" ? "Barricada" : m.kind === "hunt" ? "Limite da caçada" : "Exploração", hp: objectiveMax, maxHp: objectiveMax, targetRounds } } satisfies Battle;
}
function grantLoot(s: Campaign, m: Mission, deployedIds: string[] = s.team) {
  const keys: string[] = [m.rank >= 4 ? "royal_relic" : m.rank >= 2 ? "ancient_idol" : "gemstone"];
  const pools = [["iron_sword", "oak_staff", "leather_armor"], ["hunter_bow", "runic_staff", "sentinel_armor", "swift_boots"], ["hunter_bow", "runic_staff", "sentinel_armor", "amber_ring"], ["dawn_blade", "ash_staff", "ancient_armor"], ["dragon_fang", "star_pendant", "ancient_armor"]];
  if (m.kind === "boss") { keys.push(pools[3][Math.floor(random(s) * 3)], "ancient_key"); }
  else {
    if (m.kind === "dungeon" || random(s) < [.55, .75, .9, 1, 1][m.rank - 1]) { const pool = pools[m.rank - 1]; keys.push(pool[Math.floor(random(s) * pool.length)]); }
    if (!hasItem(s, "secret_map") && m.rank >= 2 && random(s) < .25) keys.push("secret_map");
    if (!hasItem(s, "ancient_key") && m.rank >= 4 && random(s) < .35) keys.push("ancient_key");
  }
  const deployed = s.heroes.filter(h => deployedIds.includes(h.id));
  if (deployed.length && (m.kind === "boss" || random(s) < .48)) {
    const race = heroRace(deployed[Math.floor(random(s) * deployed.length)]), gear = RACE_GEAR[race];
    keys.push(random(s) < .5 ? gear.weapon : gear.armor);
  }
  keys.forEach(k => addItem(s, k)); return keys;
}
function finishBattle(s: Campaign, b: Battle, status: "won" | "lost" | "retreated") {
  const c = b.combat!, m = c.mission, won = status === "won";
  b.status = status; b.won = won; b.reward = won ? m.reward : 0; b.xp = status === "retreated" && !b.rounds ? 0 : (won ? 30 : status === "retreated" ? 8 : 12) + m.rank * (won ? 23 : 12);
  b.remaining = c.fighters.filter(f => f.side === "hero" && f.hp > 0).length;
  for (const f of c.fighters.filter(f => f.side === "hero")) {
    const h = s.heroes.find(h => h.id === f.id)!;
    h.energy = Math.max(0, h.energy - (status === "retreated" ? 12 : Math.round(c.fatigueTotal / Math.max(1, b.rounds))) - (f.hp === 0 ? 12 : 0));
    if (gainXp(h, b.xp)) b.levelUps.push(h.name);
    if (f.hp === 0 && random(s) < .45) { h.injuredUntil = s.day + 3; b.wounded.push(h.name); }
  }
  const before = s.fame;
  if (won) {
    entry(s, "Missão · " + m.title, m.reward); s.wins++; s.fame += m.kind === "boss" ? 45 : 6 + m.rank * 5; b.loot = grantLoot(s, m, c.fighters.filter(f => f.side === "hero").map(f => f.id));
    if (m.kind === "boss") { s.bossSeasons.push(s.season); if (s.region < 4) { s.region++; b.regionUnlocked = s.region; } }
  } else { s.losses++; s.fame = Math.max(0, s.fame - (status === "retreated" ? 3 + m.rank * 2 : 6 + m.rank * 3)); }
  b.fameChange = s.fame - before;
  note(s, (won ? "Vitória" : status === "retreated" ? "Retirada ordenada" : "Missão fracassou") + " em " + m.title + ". " + (won ? "+" + m.reward + " ouro e +" + b.fameChange + " renome. Saque no baú." : b.fameChange + " renome. A equipe ganhou experiência."));
  delete b.combat;
  s.lastBattle = b;
  if (!activeExpeditions(s).length) {
    const batch = s.expeditions.filter(e => e.startedDay === s.day);
    const used = [...new Set((batch.length ? batch.flatMap(e => e.team) : c.fighters.filter(f => f.side === "hero").map(f => f.id)))];
    advance(s, used);
  }
}
function stepBattle(s: Campaign, b: Battle = s.lastBattle!) {
  const c = b.combat!, m = c.mission;
  const round = ++b.rounds, log = b.log, heroes = () => c.fighters.filter(f => f.side === "hero" && f.hp > 0), enemies = () => c.fighters.filter(f => f.side === "enemy" && f.hp > 0);
  const addStatus = (target: Combatant, kind: StatusKind, rounds: number, amount?: number, sourceId?: string) => {
    const existing = target.statuses.find(x => x.kind === kind && kind !== "shield");
    if (existing) { existing.rounds = Math.max(existing.rounds, rounds); if (amount !== undefined) existing.amount = Math.max(existing.amount || 0, amount); existing.sourceId = sourceId || existing.sourceId; }
    else target.statuses.push({ kind, rounds, ...(amount !== undefined ? { amount } : {}), ...(sourceId ? { sourceId } : {}) });
  };
  const hit = (target: Combatant, amount: number, text: string, actorId?: string, critical = false, bypassShield = false, kind: BattleLog["kind"] = "hit") => {
    if (target.statuses.some(x => x.kind === "vulnerable")) amount *= 1.15;
    let blocked = 0;
    if (!bypassShield) for (const shield of target.statuses.filter(x => x.kind === "shield" && (x.amount || 0) > 0)) {
      const absorb = Math.min(amount, shield.amount || 0); shield.amount = Math.max(0, (shield.amount || 0) - absorb); amount -= absorb; blocked += absorb; if (amount <= 0) break;
    }
    target.statuses = target.statuses.filter(x => x.kind !== "shield" || (x.amount || 0) > 0);
    if (blocked > 0) log.push({ round, text: target.name + " absorveu " + Math.round(blocked) + " de dano com o escudo.", kind: "status", targetId: target.id, targetHp: target.hp, amount: Math.round(blocked) });
    if (amount <= .5) return 0;
    amount = Math.max(1, Math.round(amount)); const before = target.hp; target.hp = Math.max(0, target.hp - amount); const dealt = before - target.hp;
    log.push({ round, text: text + dealt + " de dano." + (target.hp === 0 ? " Fora de combate." : ""), kind: target.hp === 0 ? "fall" : critical ? "critical" : kind, actorId, targetId: target.id, targetHp: target.hp, amount: dealt });
    return dealt;
  };
  const heal = (target: Combatant, amount: number, text: string, actorId?: string, kind: BattleLog["kind"] = "heal") => {
    amount = Math.max(0, Math.min(target.maxHp - target.hp, Math.round(amount))); if (!amount) return 0; target.hp += amount;
    log.push({ round, text: text + amount + " PV.", kind, actorId, targetId: target.id, targetHp: target.hp, amount }); return amount;
  };
  if (c.lastTactic !== c.tactic) { log.push({ round, text: "Nova ordem: tática " + TACTICS[c.tactic].name.toLowerCase() + ".", kind: "order" }); c.lastTactic = c.tactic; }
  if (c.pendingPotion) { const f = heroes().find(f => f.id === c.pendingPotion!.targetId); if (f) heal(f, 70, "Poção recupera a vida de " + f.name + ": "); delete c.pendingPotion; }

  for (const f of c.fighters.filter(f => f.hp > 0)) {
    for (const status of [...f.statuses]) {
      if (status.kind === "bleed" || status.kind === "poison") hit(f, status.amount || 6, (status.kind === "bleed" ? "Sangramento" : "Veneno") + " afeta " + f.name + ": ", status.sourceId, false, true, "status");
      if (status.kind === "regen" && f.hp > 0) heal(f, status.amount || 8, "Regeneração recupera " + f.name + ": ", status.sourceId, "status");
      if (["bleed", "poison", "regen"].includes(status.kind)) status.rounds--;
    }
    f.statuses = f.statuses.filter(x => x.rounds > 0 && (x.kind !== "shield" || (x.amount || 0) > 0));
  }

  const t = TACTICS[c.tactic]; c.fatigueTotal += t.fatigue;
  const livingIds = heroes().map(f => f.id);
  const frost = s.heroes.filter(h => livingIds.includes(h.id) && h.class === "mage" && h.talent?.path === "defense").reduce((n, h) => n + .05 * (h.talent?.rank || 0), 0);
  const bardPassive = Math.min(.12, s.heroes.filter(h => livingIds.includes(h.id) && h.class === "bard").length * .04);
  const actors = c.fighters.filter(f => f.hp > 0).map(f => ({ fighter: f, speed: f.speed + random(s) * 12 })).sort((a, b) => b.speed - a.speed);

  const executeAbility = (a: Combatant, h: Hero, order: PendingAbility, ability: AbilitySpec) => {
    const allyTarget = heroes().find(f => f.id === order.targetId) || heroes().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
    const enemyTarget = enemies().find(f => f.id === order.targetId) || enemies().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
    const power = Math.max(a.attack, a.magic) + h.level * 2, ultimate = (h.talent?.rank === 3 && ability.evolved || ability.id.startsWith("race-") && h.racial?.rank === 3 ? 1.25 : 1) * (ability.id.startsWith("story-") ? 1.18 : 1);
    log.push({ round, text: a.name + " usa " + ability.name + ".", kind: "ability", actorId: a.id, targetId: ability.target === "enemy" ? enemyTarget?.id : ability.target === "ally" ? allyTarget?.id : a.id });
    if (ability.effect === "challenge") { addStatus(a, "shield", 2, Math.round(35 + a.defense * .7), a.id); addStatus(a, "taunt", 2, undefined, a.id); }
    else if (ability.effect === "fireball") for (const target of enemies()) { hit(target, (a.magic * .62 + h.level * 4) * ultimate, ability.name + " atinge " + target.name + ": ", a.id, false, false, "ability"); if (target.hp > 0) addStatus(target, "vulnerable", 2, undefined, a.id); }
    else if (ability.effect === "restore" && allyTarget) { heal(allyTarget, (35 + a.magic * 1.05) * ultimate, ability.name + " cura " + allyTarget.name + ": ", a.id, "ability"); addStatus(allyTarget, "regen", 3, Math.round(8 + a.magic * .12), a.id); }
    else if (ability.effect === "venom" && enemyTarget) { hit(enemyTarget, a.attack * .92 * ultimate, ability.name + " corta " + enemyTarget.name + ": ", a.id, false, false, "ability"); if (enemyTarget.hp > 0) addStatus(enemyTarget, "poison", 3, Math.round(8 + a.attack * .1), a.id); }
    else if (ability.effect === "pinning" && enemyTarget) { hit(enemyTarget, a.attack * .82 * ultimate, ability.name + " acerta " + enemyTarget.name + ": ", a.id, false, false, "ability"); if (enemyTarget.hp > 0) addStatus(enemyTarget, "stun", 1, undefined, a.id); }
    else if (ability.effect === "aegis" && allyTarget) { heal(allyTarget, (15 + a.magic * .35) * ultimate, ability.name + " restaura " + allyTarget.name + ": ", a.id, "ability"); addStatus(allyTarget, "shield", 2, Math.round((40 + a.defense * .7 + a.magic * .3) * ultimate), a.id); }
    else if (ability.effect === "chi" && enemyTarget) { hit(enemyTarget, (a.attack + a.magic * .5) * .9 * ultimate, ability.name + " golpeia " + enemyTarget.name + ": ", a.id, false, false, "ability"); addStatus(a, "shield", 2, Math.round(25 + a.defense * .4), a.id); }
    else if (ability.effect === "drain" && enemyTarget) { const dealt = hit(enemyTarget, a.magic * .95 * ultimate, ability.name + " drena " + enemyTarget.name + ": ", a.id, false, false, "ability"); if (dealt) heal(a, dealt * .55, a.name + " recupera ", a.id, "ability"); }
    else if (ability.effect === "renew" && allyTarget) { heal(allyTarget, (25 + a.magic * .72) * ultimate, ability.name + " renova " + allyTarget.name + ": ", a.id, "ability"); addStatus(allyTarget, "regen", 3, Math.round(12 + a.magic * .18), a.id); }
    else if (ability.effect === "anthem") for (const target of heroes()) { addStatus(target, "inspired", 2, undefined, a.id); addStatus(target, "shield", 2, Math.round(18 + a.magic * .28), a.id); }
    else if (ability.effect === "execution" && enemyTarget) { const dealt = hit(enemyTarget, power * 1.18 * ultimate, ability.name + " executa um golpe em " + enemyTarget.name + ": ", a.id, false, false, "ability"); if (dealt && enemyTarget.hp > 0) addStatus(enemyTarget, ["rogue", "necromancer", "druid"].includes(h.class) ? "poison" : "bleed", 3, Math.round(8 + power * .11), a.id); }
    else if (ability.effect === "storm") for (const target of enemies()) { hit(target, power * .62 * ultimate, ability.name + " varre " + target.name + ": ", a.id, false, false, "ability"); if (target.hp > 0) addStatus(target, "vulnerable", 2, undefined, a.id); }
    else if (ability.effect === "lifebloom" && allyTarget) { heal(allyTarget, (50 + a.magic * 1.12) * ultimate, ability.name + " restaura " + allyTarget.name + ": ", a.id, "ability"); addStatus(allyTarget, "regen", 3, Math.round((12 + a.magic * .2) * ultimate), a.id); }
    else if (ability.effect === "sanctuary") for (const target of heroes()) { heal(target, (16 + a.magic * .32) * ultimate, ability.name + " cura " + target.name + ": ", a.id, "ability"); addStatus(target, "shield", 2, Math.round((28 + a.magic * .24 + a.defense * .18) * ultimate), a.id); }
    else if (ability.effect === "fortress") { addStatus(a, "shield", 3, Math.round((62 + a.defense * 1.05) * ultimate), a.id); addStatus(a, "taunt", 2, undefined, a.id); }
    else if (ability.effect === "control" && enemyTarget) { hit(enemyTarget, power * .72 * ultimate, ability.name + " controla " + enemyTarget.name + ": ", a.id, false, false, "ability"); if (enemyTarget.hp > 0) addStatus(enemyTarget, "stun", 1, undefined, a.id); addStatus(a, "shield", 2, Math.round(22 + a.defense * .35), a.id); }
    c.abilityCooldowns[a.id + ":" + ability.id] = round + ability.cooldown;
  };

  for (const actor of actors) {
    if (!heroes().length || !enemies().length) break;
    const a = actor.fighter; if (a.hp <= 0) continue;
    const stun = a.statuses.find(x => x.kind === "stun"); if (stun) { log.push({ round, text: a.name + " está atordoado e perde a ação.", kind: "status", actorId: a.id, targetId: a.id, targetHp: a.hp }); stun.rounds--; a.statuses = a.statuses.filter(x => x.rounds > 0); continue; }
    if (a.side === "hero") {
      const h = s.heroes.find(h => h.id === a.id)!;
      let order = c.pendingAbilities.find(x => x.heroId === a.id);
      if (!order && c.autoAbilities) {
        const abilities = availableAbilities(h).toReversed().filter(ab => (c.abilityCooldowns[a.id + ":" + ab.id] || 1) <= round);
        const chosen = abilities[0]; if (chosen) order = { heroId: a.id, abilityId: chosen.id };
      }
      if (order) {
        const ability = availableAbilities(h).find(ab => ab.id === order!.abilityId), ready = ability && (c.abilityCooldowns[a.id + ":" + ability.id] || 1) <= round;
        if (ability && ready) { executeAbility(a, h, order, ability); c.pendingAbilities = c.pendingAbilities.filter(x => x.heroId !== a.id); continue; }
      }
      const healingLimit = a.class === "healer" || h.talent?.path === "healing" && ["paladin", "druid"].includes(h.class) ? .7 : a.class === "druid" ? .65 : .45;
      const canHeal = a.class === "healer" || a.class === "druid" || h.talent?.path === "healing" || a.class === "paladin" && h.talent?.path === "defense";
      const injured = heroes().filter(f => f.hp < f.maxHp * healingLimit).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp);
      if (injured.length && canHeal) { heal(injured[0], (12 + a.magic * .55) * (.55 + a.energy * .0045) * a.healing, a.name + " cura " + injured[0].name + " em ", a.id); continue; }
      const alive = enemies(), target = alive[Math.floor(random(s) * alive.length)], magical = a.magic > a.attack;
      const bonus = m.kind === "hunt" && a.class === "ranger" ? 1.18 : m.specialty === a.class || m.specialty === "undead" && ["mage", "paladin"].includes(a.class || "") ? 1.12 : 1;
      const critical = random(s) < a.critical + (m.kind === "hunt" && a.class === "ranger" ? .1 : 0);
      const inspired = a.statuses.some(x => x.kind === "inspired") ? .15 : 0;
      const damage = Math.max(3, ((magical ? a.magic : a.attack) + h.level * 2) * (.55 + a.energy * .0045) * (.85 + random(s) * .3) * t.damage * bonus * (1 + bardPassive + inspired) - target.defense * (magical ? .22 : .4));
      const dealt = hit(target, damage * (critical ? 1.65 : 1), a.name + (critical ? " acerta um crítico em " : " ataca ") + target.name + ": ", a.id, critical);
      if (a.class === "necromancer" && a.hp < a.maxHp && dealt) heal(a, dealt * .15, a.name + " drena a vida do inimigo: ", a.id);
    } else {
      const alive = heroes();
      const taunter = alive.filter(f => f.statuses.some(x => x.kind === "taunt"));
      const front = alive.filter(f => f.position === "front"), back = alive.filter(f => f.position === "back");
      const enemyIndex = Number(a.id.split("-")[1]) || 0, flanker = enemyIndex % 3 === 2 || m.kind === "hunt" && random(s) < .3;
      const pool = taunter.length ? taunter : flanker && back.length ? back : front.length && random(s) < .82 ? front : alive;
      const target = pool[Math.floor(random(s) * pool.length)];
      const enrage = m.kind === "boss" && m.boss === 2 && a.id === "enemy-0" ? 1 + (round - 1) * .035 : 1;
      hit(target, Math.max(3, (a.attack * enrage * (.8 + random(s) * .4) - target.defense * .43) * t.incoming * Math.max(.75, 1 - frost)), a.name + (flanker && target.position === "back" ? " invade a retaguarda e ataca " : " ataca ") + target.name + ": ", a.id);
    }
  }

  if (heroes().length && enemies().length) {
    if (m.kind === "dungeon" && round % 3 === 0) {
      const rogues = s.heroes.filter(h => heroes().some(f => f.id === h.id) && h.class === "rogue"), reduction = rogues.length ? .55 / (1 + rogues.reduce((n, h) => n + (h.talent?.path === "defense" ? h.talent.rank * .2 : 0), 0)) : 1;
      const target = heroes()[Math.floor(random(s) * heroes().length)]; hit(target, (18 + m.rank * 7) * reduction, "Armadilha atinge " + target.name + ": ");
    }
    if ((m.kind === "escort" || m.kind === "defense") && enemies().length) {
      const guard = heroes().filter(f => f.position === "front").reduce((n, f) => n + .14 + (["warrior", "paladin", "monk"].includes(f.class || "") ? .08 : 0) + .035 * f.guarding, 0);
      const damage = Math.max(3, Math.round((12 + m.rank * 6) * Math.max(.35, 1 - guard) * t.incoming * (.85 + random(s) * .3)));
      c.objectiveHp = Math.max(0, c.objectiveHp - damage);
      log.push({ round, kind: "hit", text: b.objective!.name + " sofreu " + damage + " de dano.", amount: damage, objectiveHp: c.objectiveHp });
    }
    const boss = enemies().find(f => f.id === "enemy-0");
    if (m.kind === "boss" && boss && round % 3 === 0) {
      if (m.boss === 0) for (const target of heroes()) hit(target, Math.max(5, boss.attack * .45 * t.incoming - target.defense * .1), "O Vigia libera uma onda sombria em " + target.name + ": ", boss.id);
      if (m.boss === 1) heal(boss, boss.maxHp * .1, "A Matriarca drena a névoa e recupera ", boss.id);
    }
  }
  for (const f of c.fighters) {
    for (const status of f.statuses) if (!["bleed", "poison", "regen", "stun"].includes(status.kind)) status.rounds--;
    f.statuses = f.statuses.filter(x => x.rounds > 0 && (x.kind !== "shield" || (x.amount || 0) > 0));
  }
  c.pendingAbilities = c.pendingAbilities.filter(order => c.fighters.some(f => f.id === order.heroId && f.hp > 0));
  if (b.objective) b.objective.hp = c.objectiveHp;
  b.remaining = heroes().length;
  const failed = !heroes().length || c.objectiveMax > 0 && c.objectiveHp <= 0;
  const won = !failed && (!enemies().length || ["escort", "defense"].includes(m.kind) && round >= c.targetRounds);
  if (failed || won || round >= c.targetRounds && !["escort", "defense"].includes(m.kind)) finishBattle(s, b, won ? "won" : "lost");
}
function releaseHero(s: Campaign, h: Hero, amount: number, rivalId?: string) {
  requireRule(!heroOnExpedition(s, h.id), h.name + " está em expedição e não pode ser transferido agora.");
  entry(s, "Transferência · " + h.name, amount); s.heroes = s.heroes.filter(x => x.id !== h.id); s.journeys = s.journeys.filter(j => j.heroId !== h.id); s.chest.forEach(i => { if (i.equippedTo === h.id) delete i.equippedTo; });
  s.team = s.team.filter(id => id !== h.id); for (const x of s.heroes) if (s.team.length < 4 && !s.team.includes(x.id)) s.team.push(x.id);
  s.formation = normalizedFormation(s);
  const target = s.rivals.find(r => r.id === rivalId) || s.rivals[Math.floor(random(s) * s.rivals.length)];
  if (target.heroes.length >= 6) target.heroes = [...target.heroes].sort((a, b) => rating(b) - rating(a)).slice(0, 5);
  target.heroes.push({ ...h, loyalty: 75 });
}
function resolveEvent(s: Campaign, action: Extract<Action, { type: "event" }>) {
  const e = s.event, choice = e?.choices.find(c => c.id === action.choiceId);
  requireRule(e && e.id === action.eventId && choice, "Esse evento já foi resolvido. Confira o conselho.");
  requireRule(s.gold >= (choice.cost || 0), "Não há ouro suficiente para essa escolha.");
  if (choice.cost) entry(s, e.title, -choice.cost);
  const id = choice.id, fame = s.fame;
  if (e.kind === "village") { if (id === "charge") { entry(s, "Serviço à aldeia", 85); s.fame += 2; } else if (id === "free") { s.fame += 20; s.heroes.forEach(h => h.energy = Math.min(100, h.energy + 8)); } else s.fame = Math.max(0, s.fame - 8); }
  if (e.kind === "offer") {
    const h = s.heroes.find(h => h.id === e.heroId); requireRule(h, "O herói dessa proposta não está mais na guilda.");
    if (id === "negotiate") { h.salary += 3; h.energy = Math.min(100, h.energy + 15); }
    if (id === "leave") { requireRule(s.heroes.length > 4, "Mantenha pelo menos quatro heróis na guilda."); releaseHero(s, h, Math.round(h.value * .55), e.rivalId || "rival-0"); }
    if (id === "refuse") { h.energy = Math.max(0, h.energy - 15); s.fame = Math.max(0, s.fame - 5); }
  }
  if (e.kind === "map") { if (id === "buy" || id === "guide") addItem(s, "secret_map"); if (id === "guide") { s.fame += 8; s.heroes.forEach(h => h.energy = Math.max(0, h.energy - 10)); } }
  if (e.kind === "caravan") { if (id === "return") { s.fame += 12; addItem(s, "healing_potion"); } if (id === "sell") { entry(s, "Venda de suprimentos encontrados", 70); s.fame = Math.max(0, s.fame - 10); } if (id === "share") { s.fame += 18; s.heroes.forEach(h => h.energy = Math.min(100, h.energy + 10)); } }
  if (e.kind === "retaliation") {
    const h = s.heroes.find(h => h.id === e.heroId), rival = s.rivals.find(r => r.id === e.rivalId); requireRule(h && rival, "A retaliação não está mais disponível.");
    if (id === "counter") { h.salary += 2; raiseRivalry(s, rival.id, -12, "Proposta rival bloqueada"); }
    if (id === "leave") { requireRule(s.heroes.length > 4, "Mantenha pelo menos quatro heróis na guilda."); releaseHero(s, h, Math.round(h.value * .55), rival.id); raiseRivalry(s, rival.id, -15, "Transferência concluída"); }
    if (id === "prestige") { s.fame = Math.max(0, s.fame - 12); h.energy = Math.max(0, h.energy - 5); raiseRivalry(s, rival.id, 8, "A guilda rival foi afrontada publicamente"); }
  }
  note(s, e.title + " · " + choice.label + ". " + choice.effect + " (renome: " + fame + " → " + s.fame + ")."); s.event = null;
}
export function applyAction(previous: Campaign, action: Action): Campaign {
  const s = normalizeCampaign(previous);
  requireRule(action && typeof action.type === "string", "Ação inválida.");
  if (action.type === "reset") return newCampaign((previous.rng + 7919) >>> 0);
  if (["mission", "rest", "train", "train-hero", "story-step", "start-journey"].includes(action.type)) requireRule(!s.event, "Resolva o evento do conselho antes de avançar ou organizar viagens.");
  if (battleActive(s) && ["rest", "train"].includes(action.type)) requireRule(false, "Há expedições em andamento. Administre a sede ou treine individualmente os heróis que ficaram; descanso e treino de equipe voltam quando as equipes retornarem.");
  switch (action.type) {
    case "mission": {
      const freeSlots = freeExpeditionSlots(s);
      requireRule(freeSlots.length > 0, "A guilda já mantém três expedições simultâneas.");
      const expeditionSlot = action.expeditionSlot ?? freeSlots[0];
      requireRule(freeSlots.includes(expeditionSlot), "Essa vaga de expedição já está ocupada. Escolha uma vaga livre.");
      const mission = [...missions(s), seasonBoss(s)].find(m => m?.id === action.missionId);
      requireRule(mission, "Essa missão não está mais disponível. Escolha uma missão do dia.");
      const locks = missionLocks(s, mission); requireRule(!locks.length, "Missão bloqueada: precisa de " + locks.join(" e ") + ".");
      const selected = selectTeam(s, action.team, action.tactic, action.formation);
      const battle = startBattle(s, mission, selected);
      const expedition: Expedition = { id: "expedition-" + (++s.expeditionSequence), slot: expeditionSlot, team: selected.map(h => h.id), formation: { ...s.formation }, tactic: s.tactic, battle, startedDay: s.day, nextRoundAt: (Number.isFinite(action.startedAt) ? Number(action.startedAt) : Date.now()) + 2500 };
      s.expeditions.push(expedition); s.lastBattle = battle;
      const next = s.heroes.filter(h => available(h, s)).slice(0, 4);
      s.team = next.map(h => h.id); s.formation = normalizedFormation(s);
      note(s, "Expedição enviada: " + mission.title + " com " + expedition.team.length + " heróis. A sede continua disponível.");
      break;
    }
    case "save-squad": {
      requireRule(SQUAD_SPECIALTIES[action.specialty], "Especialidade de equipe inválida.");
      requireRule(Array.isArray(action.team) && action.team.length >= 3 && action.team.length <= 4 && new Set(action.team).size === action.team.length, "Uma equipe pronta precisa de 3 ou 4 heróis.");
      requireRule(action.team.every(id => s.heroes.some(h => h.id === id)), "Um dos heróis dessa equipe não pertence mais à guilda.");
      const name = action.name.trim().slice(0, 32); requireRule(name.length >= 2, "Dê um nome com pelo menos 2 caracteres.");
      const formation: Record<string, FormationLine> = {};
      for (const id of action.team) {
        const hero = s.heroes.find(h => h.id === id)!;
        formation[id] = action.formation?.[id] || defaultFormationLine(hero.class);
      }
      if (!formationValid(action.team, formation)) { formation[action.team[0]] = "front"; formation[action.team[action.team.length - 1]] = "back"; }
      const saved: SavedSquad = { id: "squad-" + action.specialty, name, specialty: action.specialty, team: [...action.team], formation, tactic: action.tactic };
      const index = s.squads.findIndex(q => q.specialty === action.specialty);
      if (index >= 0) s.squads[index] = saved; else s.squads.push(saved);
      note(s, "Equipe pronta salva: " + name + " · especialidade " + SQUAD_SPECIALTIES[action.specialty].label + ".");
      break;
    }
    case "rename-squad": {
      const squad = s.squads.find(q => q.specialty === action.specialty); requireRule(squad, "Equipe pronta não encontrada.");
      const name = action.name.trim().slice(0, 32); requireRule(name.length >= 2, "Dê um nome com pelo menos 2 caracteres.");
      squad.name = name; break;
    }
    case "expedition-tick": {
      const now = Number.isFinite(action.now) ? action.now : Date.now();
      for (const expedition of activeExpeditions(s)) {
        let steps = 0;
        while (expedition.battle.status === "active" && expedition.battle.combat && now >= expedition.nextRoundAt && steps < 30) {
          stepBattle(s, expedition.battle); expedition.nextRoundAt += 5000; steps++;
        }
        if (expedition.battle.status !== "active") s.lastBattle = expedition.battle;
      }
      break;
    }
    case "battle-round": {
      const target = expeditionBattle(s, action.expeditionId); requireRule(target, "Essa expedição não está mais em combate.");
      stepBattle(s, target.battle); s.lastBattle = target.battle; break;
    }
    case "battle-auto": {
      const target = expeditionBattle(s, action.expeditionId); requireRule(target, "Essa expedição não está mais em combate.");
      target.battle.combat!.autoAbilities = true; while (target.battle.status === "active" && target.battle.combat) stepBattle(s, target.battle);
      s.lastBattle = target.battle; break;
    }
    case "battle-retreat": {
      const target = expeditionBattle(s, action.expeditionId); requireRule(target, "Essa expedição não está mais em combate.");
      finishBattle(s, target.battle, "retreated"); s.lastBattle = target.battle; break;
    }
    case "battle-tactic": {
      const target = expeditionBattle(s, action.expeditionId); requireRule(target, "Essa expedição não está mais em combate.");
      requireRule(Object.hasOwn(TACTICS, action.tactic), "Escolha uma tática válida."); target.battle.combat!.tactic = action.tactic;
      if (target.expedition) target.expedition.tactic = action.tactic; s.lastBattle = target.battle; break;
    }
    case "battle-potion": {
      const targetBattle = expeditionBattle(s, action.expeditionId); requireRule(targetBattle, "Essa expedição não está mais em combate.");
      const c = targetBattle.battle.combat!, item = s.chest.find(i => i.key === "healing_potion"), target = c.fighters.find(f => f.id === action.heroId && f.side === "hero");
      requireRule(item, "Não há poção de cura no baú."); requireRule(c.potionsUsed < 2 && !c.pendingPotion, "Use no máximo duas poções por combate e aguarde a cura pendente.");
      requireRule(target && target.hp > 0 && target.hp < target.maxHp, "Escolha um herói vivo e ferido para receber a poção.");
      s.chest = s.chest.filter(i => i.id !== item.id); c.potionsUsed++; c.pendingPotion = { targetId: target.id }; s.lastBattle = targetBattle.battle; break;
    }
    case "battle-ability": {
      const targetBattle = expeditionBattle(s, action.expeditionId); requireRule(targetBattle, "Essa expedição não está mais em combate.");
      const battle = targetBattle.battle, c = battle.combat!, fighter = c.fighters.find(f => f.id === action.heroId && f.side === "hero"), h = s.heroes.find(h => h.id === action.heroId);
      requireRule(fighter && fighter.hp > 0 && h, "Esse herói não pode usar uma habilidade agora.");
      const ability = availableAbilities(h).find(a => a.id === action.abilityId); requireRule(ability, "Habilidade não disponível para esse herói.");
      requireRule(!c.pendingAbilities.some(o => o.heroId === h.id), "Esse herói já recebeu uma ordem de habilidade para o próximo turno.");
      requireRule(abilityCooldownRemaining(battle, h.id, ability.id) === 0, "A habilidade ainda está em recarga.");
      if (ability.target === "enemy") requireRule(c.fighters.some(f => f.id === action.targetId && f.side === "enemy" && f.hp > 0), "Escolha um inimigo vivo como alvo.");
      if (ability.target === "ally") requireRule(c.fighters.some(f => f.id === action.targetId && f.side === "hero" && f.hp > 0), "Escolha um aliado vivo como alvo.");
      c.pendingAbilities.push({ heroId: h.id, abilityId: ability.id, ...(action.targetId ? { targetId: action.targetId } : {}) }); s.lastBattle = battle; break;
    }
    case "event": resolveEvent(s, action); break;
    case "equip": {
      const item = s.chest.find(i => i.id === action.itemId), hero = s.heroes.find(h => h.id === action.heroId);
      requireRule(item && hero, "Item ou herói não encontrado no baú da guilda."); requireRule(!heroOnExpedition(s, hero.id), "Esse herói está em expedição. Troque o equipamento quando ele retornar."); const def = ITEMS[item.key];
      requireRule(["weapon", "armor", "accessory"].includes(def.slot), "Esse item não pode ser equipado.");
      requireRule(!def.race || heroRace(hero) === def.race, def.race ? def.name + " é exclusivo para a raça " + RACES[def.race].name + "." : "Raça incompatível.");
      s.chest.forEach(i => { if (i.equippedTo === hero.id && ITEMS[i.key].slot === def.slot) delete i.equippedTo; }); item.equippedTo = hero.id; break;
    }
    case "unequip": { const item = s.chest.find(i => i.id === action.itemId); requireRule(item, "Item não encontrado no baú."); requireRule(!item.equippedTo || !heroOnExpedition(s, item.equippedTo), "Esse equipamento está com um herói em expedição."); delete item.equippedTo; break; }
    case "sell": {
      const item = s.chest.find(i => i.id === action.itemId); requireRule(item, "Item não encontrado no baú."); requireRule(!item.equippedTo, "Desequipe o item antes de vendê-lo.");
      entry(s, "Venda · " + ITEMS[item.key].name, ITEMS[item.key].value); s.chest = s.chest.filter(i => i.id !== item.id); break;
    }
    case "buy": {
      const offer = shop(s).find(i => i.key === action.key); requireRule(offer && offer.available, "Esse item não está disponível no mercador.");
      requireRule(s.fame >= offer.requiredFame, "O mercador exige " + offer.requiredFame + " de renome para esse item.");
      requireRule(s.gold >= offer.price, "Não há ouro suficiente para esse item."); entry(s, "Compra · " + ITEMS[offer.key].name, -offer.price); addItem(s, offer.key);
      if (offer.key !== "healing_potion") s.shopPurchases.push(Math.floor((s.day - 1) / 7) + ":" + offer.key); break;
    }
    case "specialize": {
      const h = s.heroes.find(h => h.id === action.heroId); requireRule(h && ["offense", "healing", "defense"].includes(action.path), "Escolha uma especialização válida para o herói."); requireRule(!heroOnExpedition(s, h.id), "Esse herói está em expedição.");
      requireRule(talentPoints(h) > 0, "Esse herói precisa alcançar os níveis 4, 7 ou 10 para ganhar um ponto de evolução.");
      if (!h.talent) {
        requireRule(!action.branch, "Escolha primeiro o caminho principal no nível 4."); h.talent = { path: action.path, rank: 1 };
        note(s, h.name + " escolheu " + SPECIALIZATIONS[h.class][action.path].name + ". No nível 7 esse caminho se divide em dois subcaminhos.");
      } else {
        requireRule(h.talent.path === action.path, "O caminho principal já foi escolhido e é permanente.");
        if (h.talent.rank === 1) {
          requireRule(action.branch === "a" || action.branch === "b", "No nível 7 escolha um dos dois subcaminhos.");
          h.talent.branch = action.branch; h.talent.rank = 2; const branch = SPECIALIZATION_BRANCHES[h.class][h.talent.path][action.branch];
          note(s, h.name + " evoluiu para " + branch.name + " e liberou uma segunda habilidade ativa.");
        } else {
          requireRule(h.talent.rank === 2 && !!h.talent.branch, "A evolução final já foi concluída.");
          if (action.branch) requireRule(action.branch === h.talent.branch, "A ramificação escolhida no nível 7 é permanente.");
          h.talent.rank = 3; const branch = SPECIALIZATION_BRANCHES[h.class][h.talent.path][h.talent.branch];
          note(s, h.name + " dominou " + branch.stage3 + " e desbloqueou sua forma Ultimate.");
        }
      }
      break;
    }
    case "racial-specialize": {
      const h = s.heroes.find(h => h.id === action.heroId); requireRule(h && ["heritage", "spirit", "war"].includes(action.path), "Escolha um caminho racial válido."); requireRule(!heroOnExpedition(s, h.id), "Esse herói está em expedição.");
      requireRule(racialPoints(h) > 0, "A evolução racial libera etapas nos níveis 3, 6 e 9.");
      if (!h.racial) { h.racial = { path: action.path, rank: 1 }; note(s, h.name + " iniciou a árvore racial " + RACE_TREES[heroRace(h)][action.path].name + "."); }
      else {
        requireRule(h.racial.path === action.path, "O caminho racial escolhido é permanente.");
        requireRule(h.racial.rank < 3, "A árvore racial já foi dominada."); h.racial.rank++;
        const spec = RACE_TREES[heroRace(h)][h.racial.path]; note(s, h.name + " avançou na evolução racial: " + (h.racial.rank === 2 ? spec.stage2 : spec.stage3) + ".");
      }
      break;
    }
    case "story-step": {
      const h = s.heroes.find(h => h.id === action.heroId); requireRule(h, "Herói não encontrado na guilda.");
      requireRule(available(h, s), "O herói precisa estar disponível para avançar sua história pessoal.");
      if (battleActive(s)) requireRule(s.hqActionDay[h.id] !== s.day, "Esse herói já realizou uma atividade na sede hoje enquanto as expedições estão fora.");
      const stage = (h.storyStage || 0) as StoryStage, spec = HERO_STORIES[h.class];
      requireRule(stage < 3, "A história pessoal desse herói já foi concluída.");
      if (stage === 0) {
        requireRule(s.gold >= 60, "O treino da história custa 60 ouro."); entry(s, "História · " + h.name + " · treino", -60); h.energy = Math.max(0, h.energy - 10); gainXp(h, 70); h.storyStage = 1;
        note(s, h.name + " iniciou " + spec.title + ": " + spec.stages[0] + ".");
      } else if (stage === 1) {
        requireRule(h.level >= 4, "A prova pessoal exige nível 4."); h.energy = Math.max(0, h.energy - 15); gainXp(h, 90); s.fame += 5; h.storyStage = 2;
        note(s, h.name + " concluiu " + spec.stages[1] + " e ganhou +5 renome.");
      } else {
        requireRule(h.level >= 7, "O desafio final exige nível 7."); requireRule(h.energy >= 40, "O desafio final exige pelo menos 40% de energia."); requireRule(s.gold >= 120, "O desafio final custa 120 ouro.");
        entry(s, "História · " + h.name + " · desafio final", -120); h.energy = Math.max(0, h.energy - 20); gainXp(h, 120); s.fame += 10; h.storyStage = 3; h.storyAbilityUnlocked = true;
        note(s, h.name + " concluiu " + spec.title + " e desbloqueou " + spec.ability.name + ".");
      }
      if (battleActive(s)) s.hqActionDay[h.id] = s.day; else advance(s, [h.id]); break;
    }
    case "start-journey": {
      const h = s.heroes.find(h => h.id === action.heroId); requireRule(h, "Herói não encontrado na guilda.");
      requireRule([3, 5, 7].includes(action.duration), "Escolha uma viagem de 3, 5 ou 7 dias."); requireRule(available(h, s), "Esse herói não está disponível para viajar.");
      requireRule(!activeJourney(s, h.id), "Esse herói já está viajando.");
      requireRule(s.heroes.filter(other => other.id !== h.id && !activeJourney(s, other.id) && !heroOnExpedition(s, other.id)).length >= 1, "Mantenha pelo menos um herói na sede.");
      const journey: HeroJourney = { id: "journey-" + (++s.journeySequence), heroId: h.id, startedDay: s.day, duration: action.duration, remaining: action.duration, choice: "camp", xpEarned: 0, loot: [] };
      s.journeys.push(journey); note(s, h.name + " partiu em viagem por " + action.duration + " dias. A sede continua ativa.");
      if (s.team.includes(h.id)) { s.team = s.team.filter(id => id !== h.id); for (const candidate of s.heroes) if (s.team.length < 4 && candidate.id !== h.id && !s.team.includes(candidate.id) && available(candidate, s)) s.team.push(candidate.id); s.formation = normalizedFormation(s); }
      break;
    }
    case "journey-choice": {
      const journey = s.journeys.find(j => j.id === action.journeyId); requireRule(journey, "Essa viagem já foi concluída.");
      requireRule(["camp", "explore", "shortcut"].includes(action.choice), "Escolha acampamento, exploração ou atalho."); journey.choice = action.choice; break;
    }
    case "rest": s.heroes.forEach(h => h.energy = Math.min(100, h.energy + 40)); note(s, "Um dia de descanso: todos recuperaram até 40 de energia."); advance(s, s.heroes.map(h => h.id)); break;
    case "train": {
      const team = selectTeam(s, action.team, action.tactic), cost = 50 * team.length; requireRule(s.gold >= cost, "O treino da equipe custa " + cost + " de ouro.");
      entry(s, "Treino da equipe", -cost); team.forEach(h => { h.energy -= 12; gainXp(h, 65); }); note(s, "A equipe treinou: +65 XP por herói e −12 energia."); advance(s, action.team); break;
    }
    case "train-hero": {
      const h = s.heroes.find(h => h.id === action.heroId); requireRule(h, "Herói não encontrado na guilda.");
      requireRule(available(h, s), "O herói precisa estar na sede, sem ferimentos e ter pelo menos 25% de energia.");
      if (battleActive(s)) requireRule(s.hqActionDay[h.id] !== s.day, "Esse herói já treinou ou avançou sua história hoje enquanto as expedições estão fora.");
      const plan = trainingPlan(s, h); requireRule(s.gold >= plan.cost, "O treino individual custa " + plan.cost + " ouro.");
      entry(s, "Treino individual · " + h.name, -plan.cost); h.energy -= plan.energy; gainXp(h, plan.xp);
      note(s, h.name + " concluiu treino individual: +" + plan.xp + " XP, −" + plan.energy + " energia. Nível " + h.level + ".");
      if (battleActive(s)) s.hqActionDay[h.id] = s.day; else advance(s, [h.id]); break;
    }
    case "hire": {
      requireRule(s.heroes.length < 12, "A guilda comporta até 12 heróis."); const hero = market(s).find(h => h.id === action.heroId); requireRule(hero, "Esse herói não está mais disponível.");
      requireRule(s.gold >= hero.value, "Não há ouro suficiente para esse contrato."); entry(s, "Contrato · " + hero.name, -hero.value); s.heroes.push(hero); s.hired.push(hero.id); note(s, hero.name + " entrou para a guilda."); break;
    }
    case "negotiate-rival": negotiateRival(s, action); break;
    case "release": {
      requireRule(s.heroes.length > 4, "Mantenha pelo menos quatro heróis na guilda."); const h = s.heroes.find(h => h.id === action.heroId); requireRule(h, "Herói não encontrado.");
      requireRule(!heroOnExpedition(s, h.id), "Esse herói está em expedição.");
      requireRule(s.event?.heroId !== h.id, "Resolva primeiro a proposta desse herói no conselho."); releaseHero(s, h, Math.round(h.value * .35)); note(s, h.name + " transferiu seu contrato para outra guilda."); break;
    }
    case "upgrade": {
      requireRule(s.arsenal < 3, "O arsenal já está no nível máximo."); const cost = 350 + s.arsenal * 350; requireRule(s.gold >= cost, "Essa melhoria custa " + cost + " de ouro.");
      entry(s, "Arsenal · nível " + (s.arsenal + 1), -cost); s.arsenal++; note(s, "Arsenal ampliado: +2 ataque e +1 defesa por nível."); break;
    }
    case "rename": requireRule(typeof action.name === "string" && action.name.trim().length >= 3 && action.name.trim().length <= 32, "Use um nome entre 3 e 32 caracteres."); s.name = action.name.trim(); break;
    default: throw new GameRuleError("Ação não reconhecida.");
  }
  return s;
}
