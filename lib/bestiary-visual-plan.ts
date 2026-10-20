/** BLOCO 14A — identidades canônicas do bestiário tardio.
 * Somente os nomes de WORLD_REGIONS e REGIONAL_CHAPTERS; não altera campanhas.
 * Sprites vetoriais de laboratório: /enemies/full/<slug>.svg.
 */
export type LateRegion="morn"|"solkar"|"nhal"|"crown";
export type EnemyMotion="humanoid"|"beast"|"amorphous"|"construct"|"floating";
export type EnemyAura="poison"|"undead"|"metal"|"arcane"|"abyss"|"frost"|"radiant";
export type EnemyVisualProfile={slug:string;region:LateRegion;motion:EnemyMotion;tone:EnemyAura;boss:boolean};
const ENTRIES={
 "bruxa do pantano":{slug:"witch-morn",region:"morn",motion:"humanoid",tone:"poison"},
 "hidra jovem":{slug:"young-hydra",region:"morn",motion:"beast",tone:"poison"},
 "carnical":{slug:"ghoul-morn",region:"morn",motion:"humanoid",tone:"undead"},
 "limo ancestral":{slug:"ancient-slime",region:"morn",motion:"amorphous",tone:"poison"},
 "a fome do lodo ancestral":{slug:"boss-morn",region:"morn",motion:"amorphous",tone:"poison"},
 "legionario":{slug:"imperial-legionary",region:"solkar",motion:"humanoid",tone:"metal"},
 "mago imperial":{slug:"imperial-mage",region:"solkar",motion:"humanoid",tone:"arcane"},
 "carrasco":{slug:"executioner",region:"solkar",motion:"humanoid",tone:"metal"},
 "golem de guerra":{slug:"war-golem",region:"solkar",motion:"construct",tone:"metal"},
 "a maquina do imperador":{slug:"boss-solkar",region:"solkar",motion:"construct",tone:"metal"},
 "demonio menor":{slug:"lesser-demon",region:"nhal",motion:"beast",tone:"abyss"},
 "arauto do vazio":{slug:"void-herald",region:"nhal",motion:"floating",tone:"abyss"},
 "devorador":{slug:"devourer",region:"nhal",motion:"beast",tone:"abyss"},
 "cavaleiro do abismo":{slug:"abyss-knight",region:"nhal",motion:"humanoid",tone:"abyss"},
 "o cavaleiro do fim":{slug:"boss-nhal",region:"nhal",motion:"humanoid",tone:"abyss"},
 "dragao anciao":{slug:"elder-dragon",region:"crown",motion:"beast",tone:"frost"},
 "tita de gelo":{slug:"ice-titan",region:"crown",motion:"construct",tone:"frost"},
 "serafim caido":{slug:"fallen-seraph",region:"crown",motion:"floating",tone:"radiant"},
 "rei sem nome":{slug:"nameless-king",region:"crown",motion:"humanoid",tone:"radiant"},
 "rei sem nome · o ultimo juramento":{slug:"boss-crown",region:"crown",motion:"humanoid",tone:"radiant"},
} as const;
export const LATE_BESTIARY_NAMES=Object.freeze(Object.keys(ENTRIES));
export const LATE_BESTIARY_FILES=Object.freeze(Object.values(ENTRIES).map(e=>"/enemies/full/"+e.slug+".svg"));
const normal=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s+\d+$/,"");
export function lateEnemyVisual(name:string):EnemyVisualProfile|undefined{
 const entry=(ENTRIES as Record<string,(typeof ENTRIES)[keyof typeof ENTRIES]>)[normal(name)];
 return entry?{...entry,boss:entry.slug.startsWith("boss-")}:undefined;
}
/** Não confundir nome aproximado com identidade: fallback antigo em nomes desconhecidos. */
export function lateEnemySource(name:string):string|undefined{
 const e=lateEnemyVisual(name);
 return e?"/enemies/full/"+e.slug+".svg":undefined;
}
