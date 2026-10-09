export const CLASSIC_CLASS_IDS = ["ranger", "mage", "healer", "paladin", "warrior", "rogue", "bard"] as const;

export const V130_BASE_STATS: Record<string, { attack: number; defense: number; magic: number; speed: number; critical: number }> = {
  warrior: { attack: 6, defense: 7, magic: 1, speed: 10, critical: 0.04 },
  paladin: { attack: 5, defense: 8, magic: 3, speed: 9, critical: 0.03 },
  ranger: { attack: 7, defense: 4, magic: 1, speed: 15, critical: 0.08 },
  rogue: { attack: 7, defense: 3, magic: 1, speed: 17, critical: 0.12 },
  mage: { attack: 2, defense: 3, magic: 8, speed: 11, critical: 0.05 },
  healer: { attack: 2, defense: 4, magic: 7, speed: 10, critical: 0.03 },
  bard: { attack: 3, defense: 3, magic: 4, speed: 14, critical: 0.07 },
};

export const WORLD_REGIONS = [
  { name: "Vale de Valen", minLevel: 1, theme: "Campos, estradas e ruínas antigas", enemies: ["Bandido", "Saqueador", "Lobo sombrio", "Esqueleto"] },
  { name: "Terras de Brumavale", minLevel: 4, theme: "Florestas cobertas por névoa", enemies: ["Emboscador", "Pantera das brumas", "Aranha ancestral", "Troll"] },
  { name: "Ruínas de Ashen", minLevel: 8, theme: "Torres queimadas e criptas arcanas", enemies: ["Cultista", "Espectro", "Guardião antigo", "Cavaleiro espectral"] },
  { name: "Fronteira dos Dragões", minLevel: 12, theme: "Montanhas vulcânicas e fortalezas dracônicas", enemies: ["Draco selvagem", "Salteador dracônico", "Guerreiro draco", "Guardião de obsidiana"] },
  { name: "Deserto de Sahir", minLevel: 16, theme: "Dunas, tumbas e caravanas perdidas", enemies: ["Escorpião gigante", "Saqueador do deserto", "Múmia real", "Djinn corrompido"] },
  { name: "Costa de Namar", minLevel: 20, theme: "Portos, ilhas e cavernas inundadas", enemies: ["Pirata", "Serpente marinha", "Afogado", "Corsário espectral"] },
  { name: "Bosque de Elarin", minLevel: 24, theme: "Bosques antigos e círculos élficos", enemies: ["Ent corrompido", "Caçador feérico", "Fera lunar", "Espírito selvagem"] },
  { name: "Picos de Kharum", minLevel: 28, theme: "Minas, fortalezas anãs e gelo eterno", enemies: ["Golem de pedra", "Yeti", "Rebelde das minas", "Dragão de gelo"] },
  { name: "Pântano de Morn", minLevel: 32, theme: "Águas negras, veneno e magia proibida", enemies: ["Bruxa do pântano", "Hidra jovem", "Carniçal", "Limo ancestral"] },
  { name: "Império de Solkar", minLevel: 36, theme: "Cidades fortificadas e exércitos imperiais", enemies: ["Legionário", "Mago imperial", "Carrasco", "Golem de guerra"] },
  { name: "Abismo de Nhal", minLevel: 42, theme: "Fendas sombrias e criaturas impossíveis", enemies: ["Demônio menor", "Arauto do vazio", "Devorador", "Cavaleiro do abismo"] },
  { name: "Coroa do Mundo", minLevel: 48, theme: "A última cordilheira e os chefes lendários", enemies: ["Dragão ancião", "Titã de gelo", "Serafim caído", "Rei sem Nome"] },
] as const;

export const HQ_BUILDINGS = {
  infirmary: { name: "Enfermaria", max: 5, baseCost: 220, description: "Reduz duração de ferimentos e melhora recuperação de energia." },
  forge: { name: "Forja", max: 5, baseCost: 260, description: "Indisponível enquanto não houver itens." },
  academy: { name: "Academia", max: 5, baseCost: 240, description: "Aumenta XP diário dos aprendizes e número de vagas." },
  library: { name: "Biblioteca Arcana", max: 5, baseCost: 250, description: "Aumenta magia, cura e evolução de habilidades." },
  stables: { name: "Estábulos", max: 5, baseCost: 200, description: "Melhora escoltas, viagens e recuperação entre expedições." },
  warroom: { name: "Sala de Guerra", max: 5, baseCost: 300, description: "Melhora equipes prontas, raids e batalhas contra guildas." },
} as const;

export const HERO_SCARS = [
  { id: "dragon_burn", name: "Marca do Dragão", description: "+2 ataque contra chefes, −1 defesa.", attack: 2, defense: -1, positive: true },
  { id: "broken_rib", name: "Costela Mal Curada", description: "−1 defesa até transformar a fraqueza em experiência.", defense: -1, positive: false },
  { id: "survivor", name: "Sobrevivente", description: "+8 PV e +2% crítico após escapar de uma derrota.", hp: 8, critical: 0.02, positive: true },
  { id: "shadow_cut", name: "Corte das Sombras", description: "+2 velocidade, −4 PV.", speed: 2, hp: -4, positive: true },
  { id: "silver_eye", name: "Olho de Prata", description: "+3% crítico em caçadas.", critical: 0.03, positive: true },
  { id: "old_wound", name: "Ferida Antiga", description: "−5 PV, mas +1 defesa.", hp: -5, defense: 1, positive: false },
  { id: "faith_mark", name: "Marca da Fé", description: "+2 magia e +5 PV.", magic: 2, hp: 5, positive: true },
  { id: "lucky_scar", name: "Cicatriz da Sorte", description: "+4% de sorte.", luck: 0.04, positive: true },
] as const;

const firstNames = [
  "Aldren","Seris","Maev","Torin","Kaora","Luth","Nym","Edrik","Vaela","Corin","Ysra","Fen","Marek","Ilara","Dain","Selyne",
  "Orren","Talia","Brann","Nyx","Elyon","Kora","Varis","Mirael","Garrik","Asha","Ren","Zaira","Barek","Liora","Cassian","Nera",
  "Thoren","Ilyra","Rurik","Saela","Orik","Veyra","Joren","Melys","Tarek","Nalia","Draven","Eira","Kel","Arwenna","Rovan","Sylas",
  "Iria","Bram","Nox","Lena","Hadrik","Vessa","Orlan","Mara","Korin","Tessa","Ulric","Neris","Fael","Rhea","Doran","Cyria"
];
const familyNames = [
  "Ferronegro","Ventolume","Pedraclara","Runafria","Solpartido","Sombralta","Folhacinza","Brumafina","Ferroverde","Luzbranca","Luaescura","Marteloazul",
  "Cinzaferro","Corvoalto","Valeouro","Riomanso","Tempestaforte","Noiteclara","Pedrabrava","Chamasul","Torrelume","Estrelafria","Bosquenegro","Flechaalta",
  "Maréprata","Areiafunda","Geloazul","Sangueverde","Escudorubro","Cantoalto","Olhoâmbar","Céucinza","Lâminanova","Trilhafria","Raizforte","Véudourado",
  "Abismoazul","Monteferro","Névoaroxa","Solvelho","Runaalta","Falcãobranco","Lobocinza","Aurorafria","Pedralua","Ecofundo","Brasaazul","Rosaferro"
];
const epithets = [
  "de Valen","de Brumavale","de Ashen","do Norte","da Costa","do Deserto","dos Picos","do Bosque","da Fronteira","do Ocaso","da Aurora","das Ruínas",
  "do Abismo","da Torre","do Vale","das Marés","da Lua","do Sol","das Cinzas","do Horizonte","da Coroa","da Estrada","do Pântano","do Império"
];
// 100 prenomes e 100 sobrenomes: 10.000 combinações curtas sem repetição.
// Outras 240.000 combinações com origem permitem progressão de longas campanhas.
const extraFirstNames = ["Aelric","Veylin","Ormira","Kaelen","Thalira","Brynden","Zephira","Nivara","Odran","Sylwen","Caldor","Belmira","Teryn","Ivaran","Elowen","Vorian","Myrith","Daelin","Arvessa","Sarn","Keldric","Mavira","Zevran","Ferys","Lorwyn","Braska","Avelis","Theron","Ylvara","Galren","Isolde","Roneth","Vaelor","Druska","Mireth","Zalric"];
const extraFamilyNames = ["Alvorduna","Brasalume","Corvoprata","Pedrassol","Ventobravo","Cinzardente","Sombravéu","Auroraforte","Runaespinho","Luaferro","Geloespora","Brumaclara","Estelarubro","Falcãoalto","Lobodourado","Tempestanoite","Ferromaré","Soldebruma","Chamaeterna","Raizdeouro","Valeespinho","Vidrorruna","Pedraestrela","Espadacinza","Trovejanoite","Florabismo","Véunegro","Corvossol","Ecoferro","Noitelume","Riosombrio","Arcovento","Brasalva","Serraflor","Falcatrua","Coraçãoferro","Sangueprata","Nevoeiroalto","Coroaquebrada","Pódeestrela","Trilhassol","Montebruma","Ruinalva","Alvorpedra","Marluar","Soldeferro","Ventoaurora","Fogoazul","Espinhofrio","Luarverde","Almaferro","Brumaviva"];
const nameFirstPool = [...firstNames,...extraFirstNames];
const nameFamilyPool = [...familyNames,...extraFamilyNames];
export const ADVENTURER_SHORT_NAME_COUNT = nameFirstPool.length * nameFamilyPool.length;
export const ADVENTURER_NAME_CAPACITY = ADVENTURER_SHORT_NAME_COUNT * (epithets.length + 1);

export function uniqueAdventurerName(index:number):string {
  if (!Number.isSafeInteger(index) || index < 0) throw new RangeError("Índice de aventureiro inválido.");
  const tier = Math.floor(index / ADVENTURER_SHORT_NAME_COUNT);
  // Permutação bijetiva: índices diferentes produzem pares diferentes.
  // O primo 65537 é coprimo com 10.000, evitando famílias consecutivas iguais.
  const pair = ((index % ADVENTURER_SHORT_NAME_COUNT) * 65537 + 7919) % ADVENTURER_SHORT_NAME_COUNT;
  const first = nameFirstPool[pair % nameFirstPool.length];
  const family = nameFamilyPool[Math.floor(pair / nameFirstPool.length)];
  const origin = tier > 0 ? " " + epithets[(tier - 1) % epithets.length] : "";
  const cycle = tier > 0 ? Math.floor((tier - 1) / epithets.length) : 0;
  return first + " " + family + origin + (cycle ? " " + (cycle + 1) : "");
}

export const LEVEL_ABILITIES: Record<string, Array<{ level: number; id: string; name: string; description: string; target: string; cooldown: number; effect: string }>> = {
  warrior: [
    { level: 1, id: "warrior-challenge", name: "Desafio", description: "Atrai ataques e ergue um pequeno escudo.", target: "self", cooldown: 3, effect: "challenge" },
    { level: 5, id: "warrior-cleave", name: "Golpe de Ruptura", description: "Golpe pesado que deixa o alvo vulnerável.", target: "enemy", cooldown: 3, effect: "execution" },
    { level: 12, id: "warrior-wall", name: "Muralha de Aço", description: "Proteção extrema para segurar a linha.", target: "self", cooldown: 4, effect: "fortress" },
    { level: 22, id: "warrior-warcry", name: "Grito de Guerra", description: "Inspira toda a equipe.", target: "all-allies", cooldown: 4, effect: "anthem" },
    { level: 35, id: "warrior-breaker", name: "Quebra-Escudos", description: "Execução brutal em um inimigo.", target: "enemy", cooldown: 4, effect: "execution" },
    { level: 50, id: "warrior-legend", name: "Último Exército", description: "Postura lendária de defesa total.", target: "self", cooldown: 6, effect: "fortress" },
  ],
  paladin: [
    { level: 1, id: "paladin-aegis", name: "Égide", description: "Protege e cura um aliado.", target: "ally", cooldown: 3, effect: "aegis" },
    { level: 5, id: "paladin-smite", name: "Golpe Sagrado", description: "Golpe de luz contra um inimigo.", target: "enemy", cooldown: 3, effect: "execution" },
    { level: 12, id: "paladin-sanctuary", name: "Santuário", description: "Protege todos os aliados.", target: "all-allies", cooldown: 4, effect: "sanctuary" },
    { level: 22, id: "paladin-judgment", name: "Julgamento", description: "Explosão sagrada em todos os inimigos.", target: "all-enemies", cooldown: 4, effect: "storm" },
    { level: 35, id: "paladin-vow", name: "Juramento Eterno", description: "Fortalece a própria defesa.", target: "self", cooldown: 4, effect: "fortress" },
    { level: 50, id: "paladin-dawn", name: "Aurora Final", description: "Milagre coletivo de proteção.", target: "all-allies", cooldown: 6, effect: "sanctuary" },
  ],
  ranger: [
    { level: 1, id: "ranger-pinning", name: "Tiro Imobilizante", description: "Flecha precisa que interrompe o alvo.", target: "enemy", cooldown: 3, effect: "pinning" },
    { level: 5, id: "ranger-double", name: "Disparo Duplo", description: "Execução rápida contra um inimigo.", target: "enemy", cooldown: 3, effect: "execution" },
    { level: 12, id: "ranger-rain", name: "Chuva de Flechas", description: "Atinge todos os inimigos.", target: "all-enemies", cooldown: 4, effect: "storm" },
    { level: 22, id: "ranger-mark", name: "Marca do Caçador", description: "Deixa o alvo vulnerável e sob pressão.", target: "enemy", cooldown: 4, effect: "control" },
    { level: 35, id: "ranger-ghost", name: "Flecha Fantasma", description: "Ataque de alta precisão.", target: "enemy", cooldown: 4, effect: "execution" },
    { level: 50, id: "ranger-eclipse", name: "Eclipse de Flechas", description: "Tempestade lendária de projéteis.", target: "all-enemies", cooldown: 6, effect: "storm" },
  ],
  rogue: [
    { level: 1, id: "rogue-venom", name: "Lâmina Venenosa", description: "Aplica veneno ao alvo.", target: "enemy", cooldown: 3, effect: "venom" },
    { level: 5, id: "rogue-shadow", name: "Passo Sombrio", description: "Golpe de controle e reposicionamento.", target: "enemy", cooldown: 3, effect: "control" },
    { level: 12, id: "rogue-execute", name: "Execução", description: "Golpe concentrado em um único alvo.", target: "enemy", cooldown: 4, effect: "execution" },
    { level: 22, id: "rogue-poisonrain", name: "Névoa Tóxica", description: "Pressiona vários inimigos.", target: "all-enemies", cooldown: 4, effect: "storm" },
    { level: 35, id: "rogue-silence", name: "Silêncio Mortal", description: "Interrompe a ação inimiga.", target: "enemy", cooldown: 4, effect: "control" },
    { level: 50, id: "rogue-night", name: "Noite Sem Testemunhas", description: "Execução lendária.", target: "enemy", cooldown: 6, effect: "execution" },
  ],
  mage: [
    { level: 1, id: "mage-fireball", name: "Explosão Arcana", description: "Dano mágico em todos os inimigos.", target: "all-enemies", cooldown: 3, effect: "fireball" },
    { level: 5, id: "mage-frost", name: "Prisão de Gelo", description: "Controla um inimigo.", target: "enemy", cooldown: 3, effect: "control" },
    { level: 12, id: "mage-storm", name: "Tempestade Arcana", description: "Tempestade contra todos os inimigos.", target: "all-enemies", cooldown: 4, effect: "storm" },
    { level: 22, id: "mage-barrier", name: "Barreira Rúnica", description: "Proteção para a formação.", target: "all-allies", cooldown: 4, effect: "sanctuary" },
    { level: 35, id: "mage-collapse", name: "Colapso Astral", description: "Magia concentrada em um alvo.", target: "enemy", cooldown: 4, effect: "execution" },
    { level: 50, id: "mage-comet", name: "Cometa Celestial", description: "Magia lendária de área.", target: "all-enemies", cooldown: 6, effect: "storm" },
  ],
  healer: [
    { level: 1, id: "healer-restore", name: "Luz Restauradora", description: "Cura e regenera um aliado.", target: "ally", cooldown: 3, effect: "restore" },
    { level: 5, id: "healer-shield", name: "Bênção do Escudo", description: "Protege um aliado.", target: "ally", cooldown: 3, effect: "aegis" },
    { level: 12, id: "healer-sanctuary", name: "Círculo Sagrado", description: "Protege toda a equipe.", target: "all-allies", cooldown: 4, effect: "sanctuary" },
    { level: 22, id: "healer-life", name: "Fonte da Vida", description: "Cura profunda e regeneração.", target: "ally", cooldown: 4, effect: "lifebloom" },
    { level: 35, id: "healer-judgment", name: "Luz Punitiva", description: "Dano sagrado em área.", target: "all-enemies", cooldown: 4, effect: "storm" },
    { level: 50, id: "healer-miracle", name: "Grande Milagre", description: "Proteção lendária para todos.", target: "all-allies", cooldown: 6, effect: "sanctuary" },
  ],
  bard: [
    { level: 1, id: "pierrot-loaded-dice", name: "Dado Viciado", description: "A sorte escolhe um golpe certeiro.", target: "enemy", cooldown: 3, effect: "execution" },
    { level: 5, id: "pierrot-rabbit-foot", name: "Pé de Coelho", description: "Aumenta a proteção dos aliados pela sorte.", target: "all-allies", cooldown: 3, effect: "anthem" },
    { level: 12, id: "pierrot-jackpot", name: "Jackpot", description: "Uma explosão caótica atinge os inimigos.", target: "all-enemies", cooldown: 4, effect: "storm" },
    { level: 22, id: "pierrot-trick", name: "Truque Impossível", description: "Confunde e interrompe um inimigo.", target: "enemy", cooldown: 4, effect: "control" },
    { level: 35, id: "pierrot-fortune", name: "Fortuna do Tolo", description: "Inspira e protege a equipe.", target: "all-allies", cooldown: 4, effect: "sanctuary" },
    { level: 50, id: "pierrot-seventh", name: "Sétima Sorte", description: "O impossível acontece a favor da equipe.", target: "all-allies", cooldown: 6, effect: "anthem" },
  ],
};

type RawItem = {
  name: string; slot: string; rarity: string; value: number; description: string;
  attack?: number; defense?: number; magic?: number; hp?: number; speed?: number; critical?: number;
  luck?: number; set?: string; classes?: string[]; levelReq?: number; material?: string;
};
const item = (name: string, slot: string, rarity: string, value: number, description: string, extra: Partial<RawItem> = {}): RawItem => ({ name, slot, rarity, value, description, ...extra });

export const V130_ITEMS: Record<string, RawItem> = {};

export const ITEM_SETS: Record<string, { name: string; two: string; three: string }> = {};

export const CRAFT_RECIPES: { id: string; result: string; cost: number; forge: number; materials: Record<string, number> }[] = [];
