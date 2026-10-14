/** Armazém da Guilda: começa no nível 1 com 30 espaços.
 * Cada melhoria instala dois módulos independentes de 15 espaços.
 * Portanto 9 melhorias x (15 + 15) = +270, chegando a 300 no nível 10.
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
export function warehouseLevel(s: {hq?: {warehouse?: number}}):number {
  return Math.max(1,Math.min(STORAGE_MAX_LEVEL,s.hq?.warehouse||1));
}
export function chestCapacity(s: {hq?: {warehouse?:number}}):number {
  return storageCapacity(warehouseLevel(s));
}
export function chestFree(s: {hq?: {warehouse?:number};chest:readonly StoredItem[]}):number {
  return Math.max(0,chestCapacity(s)-storageUsed(s.chest));
}
