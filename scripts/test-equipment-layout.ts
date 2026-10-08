import assert from "node:assert/strict";
import { EQUIPMENT_SLOTS, type EquipmentSlotId } from "../lib/equipment-layout.ts";

assert.equal(EQUIPMENT_SLOTS.length, 12, "A ficha precisa mostrar 12 espaços");
assert.equal(new Set(EQUIPMENT_SLOTS.map(s=>s.id)).size,12,"Não pode haver espaços duplicados");
const expected: EquipmentSlotId[] = [
"weapon","offhand","helmet","shoulders","armor","gloves",
"belt","boots","cloak","ring1","ring2","amulet"
];
assert.deepEqual(EQUIPMENT_SLOTS.map(s=>s.id), expected,"Os espaços não correspondem à configuração aprovada");
for(const slot of EQUIPMENT_SLOTS) {
  assert.ok(slot.label.trim().length > 2 && slot.description.trim().length > 16,slot.id+" não tem descrição");
}
assert.notEqual(EQUIPMENT_SLOTS[9].id,EQUIPMENT_SLOTS[10].id,"Os dois anéis precisam ser independentes");
console.log("EQUIPAMENTOS_12_ESPACOS_OK",EQUIPMENT_SLOTS.length);
