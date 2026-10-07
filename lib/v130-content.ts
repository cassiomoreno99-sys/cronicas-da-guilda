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
  forge: { name: "Forja", max: 5, baseCost: 260, description: "Libera receitas melhores e reduz custo de fabricação." },
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
  { id: "lucky_scar", name: "Cicatriz da Sorte", description: "+4% de sorte para saque.", luck: 0.04, positive: true },
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
export function uniqueAdventurerName(index: number) {
  const a = Math.abs(index) % firstNames.length;
  const b = Math.floor(Math.abs(index) / firstNames.length) % familyNames.length;
  const c = Math.floor(Math.abs(index) / (firstNames.length * familyNames.length)) % epithets.length;
  return firstNames[a] + " " + familyNames[b] + " " + epithets[c];
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

export const V130_ITEMS: Record<string, RawItem> = {
  rusty_sword: item("Espada enferrujada", "weapon", "common", 10, "Arma simples para iniciantes.", { attack: 1 }),
  militia_spear: item("Lança da milícia", "weapon", "common", 14, "Alcance seguro e pouco peso.", { attack: 2, defense: 1 }),
  wood_axe: item("Machado de lenhador", "weapon", "common", 13, "Pesado, mas eficiente.", { attack: 3, speed: -1 }),
  novice_bow: item("Arco de aprendiz", "weapon", "common", 14, "Arco leve para treino.", { attack: 2, critical: .01, classes: ["ranger"] }),
  worn_dagger: item("Adaga gasta", "weapon", "common", 13, "Lâmina curta e rápida.", { attack: 2, speed: 1, classes: ["rogue"] }),
  novice_wand: item("Varinha de aprendiz", "weapon", "common", 14, "Canaliza magia básica.", { magic: 2, classes: ["mage","healer"] }),
  chapel_mace: item("Maça da capela", "weapon", "common", 15, "Arma simples de sacerdotes e cavaleiros.", { attack: 2, magic: 1, classes: ["healer","paladin"] }),
  fool_cane: item("Bengala do Pierrô", "weapon", "common", 16, "Parece brinquedo. Não é.", { attack: 1, magic: 1, luck: .02, classes: ["bard"] }),
  buckler: item("Broquel de madeira", "offhand", "common", 12, "Pequeno escudo de treino.", { defense: 2 }),
  iron_shield: item("Escudo de ferro", "offhand", "uncommon", 36, "Defesa confiável.", { defense: 4, hp: 4 }),
  prayer_book: item("Livro de orações", "offhand", "uncommon", 38, "Aumenta a força da fé.", { magic: 4, classes: ["healer","paladin"] }),
  arcane_orb: item("Orbe arcano", "offhand", "rare", 72, "Foco mágico lapidado.", { magic: 7, classes: ["mage"] }),
  lucky_cards: item("Baralho Marcado", "offhand", "rare", 70, "Ninguém sabe como sempre sai a carta certa.", { luck: .06, critical: .03, classes: ["bard"] }),
  cloth_hood: item("Capuz de pano", "helmet", "common", 10, "Proteção leve.", { defense: 1 }),
  scout_hood: item("Capuz do batedor", "helmet", "uncommon", 34, "Melhora percepção e mobilidade.", { defense: 2, speed: 2 }),
  iron_helm: item("Elmo de ferro", "helmet", "uncommon", 38, "Proteção de infantaria.", { defense: 4 }),
  mage_circlet: item("Diadema rúnica", "helmet", "rare", 74, "Amplifica magia.", { magic: 6 }),
  jester_mask: item("Máscara da Fortuna", "helmet", "epic", 132, "O sorriso nunca muda.", { luck: .08, critical: .04, classes: ["bard"], set: "fortune" }),
  padded_coat: item("Gibão acolchoado", "armor", "common", 14, "Armadura barata.", { defense: 2, hp: 3 }),
  chain_shirt: item("Cota de malha", "armor", "uncommon", 42, "Boa defesa sem perder mobilidade.", { defense: 5, hp: 6 }),
  plate_armor: item("Armadura de placas", "armor", "rare", 82, "Proteção pesada.", { defense: 9, hp: 14, speed: -2, classes: ["warrior","paladin"] }),
  shadow_leather: item("Couro das sombras", "armor", "rare", 80, "Feita para movimentos silenciosos.", { defense: 5, speed: 5, critical: .02, classes: ["rogue"] }),
  ranger_coat: item("Casaco do rastreador", "armor", "rare", 80, "Proteção para longas caçadas.", { defense: 5, speed: 3, classes: ["ranger"] }),
  priest_robe: item("Veste do templo", "armor", "rare", 78, "Tecida com fios consagrados.", { defense: 4, magic: 6, classes: ["healer"] }),
  star_robe: item("Manto das estrelas", "armor", "epic", 145, "Manto de um antigo observatório.", { defense: 5, magic: 11, hp: 10, classes: ["mage"], set: "astral" }),
  fool_costume: item("Traje do Pierrô Dourado", "armor", "epic", 142, "Costurado com moedas falsas e sorte verdadeira.", { defense: 5, magic: 5, luck: .07, classes: ["bard"], set: "fortune" }),
  leather_gloves: item("Luvas de couro", "gloves", "common", 9, "Protegem as mãos.", { defense: 1 }),
  duelist_gloves: item("Luvas do duelista", "gloves", "uncommon", 32, "Ajudam a manter a arma firme.", { attack: 2, critical: .01 }),
  archer_bracers: item("Braçadeiras do arqueiro", "gloves", "rare", 66, "Melhoram a estabilidade do disparo.", { attack: 4, critical: .03, classes: ["ranger"] }),
  killer_gloves: item("Luvas sem pegadas", "gloves", "rare", 68, "Não deixam vestígios.", { attack: 3, speed: 3, classes: ["rogue"] }),
  apprentice_boots: item("Botas de viagem", "boots", "common", 10, "Feitas para estrada.", { speed: 1 }),
  scout_boots: item("Botas do explorador", "boots", "uncommon", 36, "Passos rápidos.", { speed: 4, defense: 1 }),
  shadow_boots: item("Passos da Noite", "boots", "epic", 126, "Quase não tocam o chão.", { speed: 8, critical: .03, classes: ["rogue"], set: "shadow" }),
  lucky_shoes: item("Sapatos de Sete Pontas", "boots", "epic", 128, "Sempre caem de pé.", { speed: 5, luck: .06, classes: ["bard"], set: "fortune" }),
  copper_ring: item("Anel de cobre", "accessory", "common", 12, "Pequeno amuleto.", { hp: 2 }),
  hunter_charm: item("Amuleto do caçador", "accessory", "uncommon", 38, "Dá confiança na caça.", { critical: .02, attack: 2 }),
  holy_symbol: item("Símbolo sagrado", "accessory", "rare", 70, "Relíquia de fé.", { magic: 6, hp: 6, classes: ["healer","paladin"] }),
  assassin_coin: item("Moeda do Assassino", "accessory", "rare", 72, "Uma moeda usada para decidir destinos.", { critical: .04, speed: 2, classes: ["rogue"] }),
  rabbit_foot: item("Pé de Coelho", "accessory", "rare", 76, "Pode ser superstição. Os drops discordam.", { luck: .08, classes: ["bard"] }),
  astral_pendant: item("Pingente Astral", "accessory", "epic", 138, "Fragmento de céu cristalizado.", { magic: 10, hp: 10, set: "astral" }),
  fortress_emblem: item("Emblema da Fortaleza", "accessory", "epic", 140, "Símbolo de uma muralha que nunca caiu.", { defense: 8, hp: 18, set: "fortress" }),
  shadow_medallion: item("Medalhão do Eclipse", "accessory", "epic", 138, "Uma sombra presa em prata.", { attack: 5, critical: .05, set: "shadow" }),
  fortune_bell: item("Sino da Fortuna", "accessory", "legendary", 245, "Toca sozinho quando existe tesouro perto.", { luck: .14, critical: .04, classes: ["bard"], set: "fortune", levelReq: 30 }),
  kings_blade: item("Lâmina do Rei Sem Nome", "weapon", "legendary", 260, "Relíquia de uma era perdida.", { attack: 16, defense: 4, set: "fortress", levelReq: 40 }),
  void_staff: item("Cajado do Abismo", "weapon", "legendary", 260, "Magia do vazio comprimida.", { magic: 18, critical: .05, set: "astral", levelReq: 40 }),
  eclipse_bow: item("Arco do Eclipse", "weapon", "legendary", 255, "Dispara sem som.", { attack: 14, speed: 6, critical: .07, classes: ["ranger"], levelReq: 40 }),
  whisper_dagger: item("Adaga Sussurro", "weapon", "legendary", 255, "A vítima ouve o golpe tarde demais.", { attack: 13, speed: 7, critical: .08, classes: ["rogue"], set: "shadow", levelReq: 40 }),
  saint_mace: item("Maça do Santo Errante", "weapon", "legendary", 250, "Fé transformada em metal.", { attack: 9, magic: 14, classes: ["healer","paladin"], levelReq: 40 }),
  seven_sided_die: item("Dado de Sete Lados", "accessory", "legendary", 300, "Fisicamente impossível e estranhamente útil.", { luck: .18, critical: .07, classes: ["bard"], set: "fortune", levelReq: 45 }),
  iron_ore: item("Minério de ferro", "material", "common", 6, "Material de fabricação.", { material: "metal" }),
  steel_ingot: item("Lingote de aço", "material", "uncommon", 16, "Material de fabricação refinado.", { material: "metal" }),
  moon_silver: item("Prata lunar", "material", "rare", 38, "Metal encantado.", { material: "arcane" }),
  dragon_scale: item("Escama de dragão", "material", "epic", 65, "Material resistente e raro.", { material: "beast" }),
  shadow_silk: item("Seda das sombras", "material", "rare", 36, "Tecido quase invisível.", { material: "shadow" }),
  sacred_thread: item("Fio sagrado", "material", "rare", 36, "Usado em equipamentos religiosos.", { material: "holy" }),
  lucky_clover: item("Trevo de quatro folhas", "material", "uncommon", 18, "Material de receitas do Pierrô.", { material: "luck" }),
  arcane_dust: item("Pó arcano", "material", "uncommon", 18, "Resíduo de magia condensada.", { material: "arcane" }),
  beast_fang: item("Presa de fera", "material", "common", 8, "Material de caça.", { material: "beast" }),
  ancient_wood: item("Madeira ancestral", "material", "uncommon", 17, "Madeira de árvores muito antigas.", { material: "nature" }),
  minor_healing: item("Poção menor de cura", "consumable", "common", 10, "Recupera um pouco de vida."),
  greater_healing: item("Poção maior de cura", "consumable", "rare", 45, "Recupera bastante vida."),
  antidote: item("Antídoto", "consumable", "common", 12, "Remove veneno em eventos futuros."),
  smoke_bomb: item("Bomba de fumaça", "consumable", "uncommon", 20, "Ajuda uma equipe a escapar de uma situação ruim."),
  luck_tonic: item("Tônico da Sorte", "consumable", "rare", 42, "Aumenta temporariamente chance de saque."),
  repair_kit: item("Kit de reparo", "consumable", "uncommon", 22, "Material portátil para expedições longas."),
  old_coin: item("Moeda antiga", "treasure", "common", 18, "Tesouro colecionável."),
  pearl: item("Pérola azul", "treasure", "uncommon", 34, "Tesouro da costa."),
  sun_scarab: item("Escaravelho solar", "treasure", "rare", 64, "Relíquia do deserto."),
  frozen_crown: item("Fragmento da Coroa de Gelo", "treasure", "epic", 120, "Tesouro dos picos."),
  abyss_crystal: item("Cristal do Abismo", "treasure", "legendary", 220, "Um fragmento impossível de matéria."),
};

export const ITEM_SETS = {
  fortress: { name: "Bastião Antigo", two: "+3 defesa", three: "+10 PV e +3 defesa" },
  astral: { name: "Observatório Astral", two: "+4 magia", three: "+6 magia e +2% crítico" },
  shadow: { name: "Eclipse Silencioso", two: "+3 velocidade", three: "+4 ataque e +3% crítico" },
  fortune: { name: "Fortuna do Pierrô", two: "+5% sorte de saque", three: "+10% sorte e +3% crítico" },
} as const;

export const CRAFT_RECIPES = [
  { id: "craft-iron-shield", result: "iron_shield", cost: 30, forge: 1, materials: { iron_ore: 3 } },
  { id: "craft-chain", result: "chain_shirt", cost: 45, forge: 1, materials: { iron_ore: 2, steel_ingot: 1 } },
  { id: "craft-ranger", result: "ranger_coat", cost: 80, forge: 2, materials: { ancient_wood: 2, beast_fang: 2 } },
  { id: "craft-shadow", result: "shadow_leather", cost: 85, forge: 2, materials: { shadow_silk: 3, steel_ingot: 1 } },
  { id: "craft-priest", result: "priest_robe", cost: 85, forge: 2, materials: { sacred_thread: 3, arcane_dust: 1 } },
  { id: "craft-astral", result: "star_robe", cost: 140, forge: 3, materials: { moon_silver: 2, arcane_dust: 4 } },
  { id: "craft-fortress", result: "fortress_emblem", cost: 150, forge: 3, materials: { steel_ingot: 3, dragon_scale: 1 } },
  { id: "craft-fortune", result: "jester_mask", cost: 145, forge: 3, materials: { lucky_clover: 4, moon_silver: 1 } },
  { id: "craft-seven-die", result: "seven_sided_die", cost: 300, forge: 5, materials: { lucky_clover: 7, abyss_crystal: 1, moon_silver: 2 } },
] as const;
