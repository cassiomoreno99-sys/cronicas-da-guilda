/** Ilustrações 2D do bestiário.
 * Quando o monstro ainda não tem ilustração própria, escolhemos a arte
 * ilustrativa disponível mais próxima da criatura — nunca um bandido genérico
 * para dragões, espectros, espíritos ou os chefes regionais.
 * Retorna somente arquivos existentes em public/enemies/. */
export const ENEMY_ART_KEYS=[
 "ambusher","ancient_guardian","bandit","border_lord","cultist","draconic_raider",
 "drake_warrior","fallback","goblin","matriarch","obsidian_guardian","orc",
 "panther","raider","skeleton","specter","spectral_knight","spider","troll",
 "watcher","wild_drake","wolf"
] as const;
export type EnemyArtKey=(typeof ENEMY_ART_KEYS)[number];
const normalize=(name:string)=>name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();

const named:Record<string,EnemyArtKey>={
 // Vale de Valen
 "bandido":"bandit","saqueador":"raider","lobo sombrio":"wolf","esqueleto":"skeleton",
 // Brumavale
 "emboscador":"ambusher","pantera das brumas":"panther","aranha ancestral":"spider","troll":"troll","trol":"troll",
 // Ashen
 "cultista":"cultist","espectro":"specter","guardiao antigo":"ancient_guardian","cavaleiro espectral":"spectral_knight",
 // Fronteira dos Dragões
 "draco selvagem":"wild_drake","salteador draconico":"draconic_raider",
 "guerreiro draco":"drake_warrior","guardiao de obsidiana":"obsidian_guardian",
 // Sahir (artes similares)
 "escorpiao gigante":"spider","saqueador do deserto":"raider","mumia real":"skeleton","djinn corrompido":"specter","genio corrompido":"specter",
 // Namar
 "pirata":"bandit","serpente marinha":"wild_drake","afogado":"skeleton","corsario espectral":"spectral_knight",
 // Elarin
 "ent corrompido":"ancient_guardian","guardiao arboreo corrompido":"ancient_guardian","cacador feerico":"ambusher","fera lunar":"wolf","espirito selvagem":"specter",
 // Kharum
 "golem de pedra":"ancient_guardian","yeti":"troll","ieti":"troll","rebelde das minas":"raider","dragao de gelo":"wild_drake",
 // Morn
 "bruxa do pantano":"cultist","hidra jovem":"wild_drake","carnical":"skeleton","limo ancestral":"specter",
 // Solkar
 "legionario":"border_lord","mago imperial":"cultist","carrasco":"border_lord","golem de guerra":"obsidian_guardian",
 // Nhal
 "demonio menor":"orc","arauto do vazio":"specter","devorador":"troll","cavaleiro do abismo":"spectral_knight",
 // Coroa
 "dragao anciao":"wild_drake","tita de gelo":"troll","serafim caido":"specter","rei sem nome":"spectral_knight",
 // Chefes regionais – recebem no motor o nome da missão, não o nome do inimigo.
 "chefe regional · vale de valen":"skeleton","o vigia da nevoa":"troll",
 "o cavaleiro das cinzas":"spectral_knight","o coracao da fortaleza obsidiana":"obsidian_guardian",
 "o trono de areia eterna":"specter","o almirante sem porto":"spectral_knight",
 "o ultimo guardiao verde":"ancient_guardian","o trono do gelo partido":"wild_drake",
 "a fome do lodo ancestral":"specter","a maquina do imperador":"obsidian_guardian",
 "o cavaleiro do fim":"spectral_knight","rei sem nome · o ultimo juramento":"spectral_knight"
};
const exactMatches=Object.entries(named).sort((a,b)=>b[0].length-a[0].length);

export function enemyArtKey(name:string):EnemyArtKey{
 const n=normalize(name).replace(/\s+\d+$/,"");
 if(named[n])return named[n];
 // Chefe às vezes vem com o nome do inimigo mais um epíteto.
 for(const [key,art] of exactMatches)if(n.includes(key))return art;
 if(n.includes("drag")||n.includes("hidra")||n.includes("serpente")||n.includes("draco"))return "wild_drake";
 if(n.includes("golem")||n.includes("guardiao"))return "ancient_guardian";
 if(n.includes("lobo")||n.includes("fera"))return "wolf";
 if(n.includes("cavaleiro")||n.includes("corsario"))return "spectral_knight";
 if(n.includes("espectr")||n.includes("espirit")||n.includes("fantasma")||n.includes("serafim"))return "specter";
 if(n.includes("aranha")||n.includes("escorpiao"))return "spider";
 if(n.includes("troll")||n.includes("tita")||n.includes("de vorador"))return "troll";
 if(n.includes("orc")||n.includes("demonio"))return "orc";
 if(n.includes("mumia")||n.includes("esqueleto")||n.includes("carnical"))return "skeleton";
 if(n.includes("cultista")||n.includes("mago")||n.includes("bruxa")||n.includes("djinn"))return "cultist";
 if(n.includes("bandido")||n.includes("pirata")||n.includes("saqueador")||n.includes("rebelde"))return "raider";
 return "fallback";
}
export function enemyArtSource(name:string){return "/enemies/"+enemyArtKey(name)+".webp";}

/** Artes de corpo inteiro, geradas e armazenadas no próprio jogo. Não usar
 * miniaturas 128×128 como substitutos de corpo inteiro. Se não houver arte
 * específica, a função devolve undefined e a arena mantém o bestiário antigo.
 * Os nomes são os nomes REAIS das missões e dos chefes no motor de jogo. */
const FULL_ENEMY_ART:Readonly<Record<string,string>>={
 "bandido":"bandit",
 "saqueador":"raider",
 "lobo sombrio":"wolf",
 "esqueleto":"skeleton",
 "emboscador":"ambusher",
 "pantera das brumas":"panther",
 "aranha ancestral":"spider",
 "trol":"troll",
 "troll":"troll",
 "cultista":"cultist",
 "espectro":"specter",
 "guardiao antigo":"ancient-guardian",
 "cavaleiro espectral":"spectral-knight",
 "draco selvagem":"wild-drake",
 "salteador draconico":"draconic-raider",
 "guerreiro draco":"drake-warrior",
 "guardiao de obsidiana":"obsidian-guardian",
 "escorpiao gigante":"giant-scorpion",
 "saqueador do deserto":"desert-raider",
 "mumia real":"royal-mummy",
 "genio corrompido":"corrupted-djinn",
 "djinn corrompido":"corrupted-djinn",
 "pirata":"pirate",
 "serpente marinha":"sea-serpent",
 "afogado":"drowned",
 "corsario espectral":"spectral-corsair",
 "guardiao arboreo corrompido":"corrupt-tree-guardian",
 "ent corrompido":"corrupted-tree",
 "cacador feerico":"fae-hunter",
 "fera lunar":"lunar-beast",
 "espirito selvagem":"wild-spirit",
 "golem de pedra":"stone-golem",
 "ieti":"yeti",
 "yeti":"yeti",
 "rebelde das minas":"mine-rebel",
 "dragao de gelo":"ice-dragon",
 "chefe regional · vale de valen":"boss-valen",
 "o vigia da nevoa":"boss-brumavale",
 "o cavaleiro das cinzas":"boss-ashen",
 "o coracao da fortaleza obsidiana":"boss-dragon-frontier",
 "o trono de areia eterna":"boss-sahir",
 "o almirante sem porto":"boss-namar",
 "o ultimo guardiao verde":"boss-elarin",
 "o trono do gelo partido":"boss-kharum",
};
export function fullEnemyArtSource(name:string):string|undefined{
 const slug=FULL_ENEMY_ART[normalize(name).replace(/\s+\d+$/,"")];
 return slug?"/enemies/full/"+slug+".png":undefined;
}
export const FULL_ENEMY_NAMES=Object.freeze(Object.keys(FULL_ENEMY_ART));
