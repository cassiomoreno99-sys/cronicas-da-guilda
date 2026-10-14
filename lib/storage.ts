/** Baú da Guilda: começa com 30 espaços e cresce ao melhorar a Forja.
 * Cada melhoria instala dois módulos independentes de 15 espaços.
 * A capacidade chega a 300 antes de atingir o limite máximo da Forja.
 * Itens vestindo heróis continuam na coleção persistida para não perder atributos,
 * porém NÃO ocupam uma posição no baú. */
export const STORAGE_BASE = 30;
export const STORAGE_MODULE = 15;
export const STORAGE_MAX_LEVEL = 10;
export type StoredItem = { equippedTo?: string };
export function storageCapacity(level: number): number {
  const n=Math.max(1,Math.min(STORAGE_MAX_LEVEL,Math.floor(Number.isFinite(level)?level:1)));
  return STORAGE_BASE+(n-1)*(STORAGE_MODULE*2);
}
export function storageUsed<T extends StoredItem>(items: readonly T[]): number {
  return items.filter(item=>!item.equippedTo).length;
}
export function chestCapacity(s: {hq?: {forge?:number}}):number {
  // A cada melhoria da Forja, dois módulos de 15 espaços; máximo 300.
  return Math.min(300,STORAGE_BASE+Math.max(0,Math.min(10,s.hq?.forge||0))*STORAGE_MODULE*2);
}
export function chestFree(s: {hq?: {forge?:number};chest:readonly StoredItem[]}):number {
  return Math.max(0,chestCapacity(s)-storageUsed(s.chest));
}
