/** Planejamento visual dos equipamentos. Não altera o inventário nem o combate. */
export type EquipmentSlotId =
  | "weapon" | "offhand" | "helmet" | "shoulders"
  | "armor" | "gloves" | "belt" | "boots"
  | "cloak" | "ring1" | "ring2" | "amulet";

export type EquipmentSlot = Readonly<{
  id: EquipmentSlotId;
  label: string;
  description: string;
  group: "Armamento" | "Proteção" | "Acessórios";
}>;

export const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = [
  { id:"weapon", label:"Arma principal", group:"Armamento", description:"Espada, arco, cajado ou outra arma principal apropriada à classe." },
  { id:"offhand", label:"Mão secundária", group:"Armamento", description:"Escudo, foco ou arma secundária. Armas de duas mãos ocuparão os dois espaços." },
  { id:"helmet", label:"Elmo", group:"Proteção", description:"Protege a cabeça e poderá fornecer atributos defensivos." },
  { id:"shoulders", label:"Ombreiras", group:"Proteção", description:"Proteção separada para os ombros; não ocupa o espaço do peitoral." },
  { id:"armor", label:"Armadura", group:"Proteção", description:"Peitoral, túnica ou vestimenta principal do personagem." },
  { id:"gloves", label:"Luvas", group:"Proteção", description:"Manoplas ou luvas para defesa, destreza e efeitos de classe." },
  { id:"belt", label:"Cinto", group:"Proteção", description:"Cinto equipado independentemente da armadura principal." },
  { id:"boots", label:"Botas", group:"Proteção", description:"Calçado de combate e exploração, com bônus de mobilidade." },
  { id:"cloak", label:"Capa / Manto", group:"Proteção", description:"Capa ou manto independente da armadura; poderá conceder resistência e evasão." },
  { id:"ring1", label:"Anel 1", group:"Acessórios", description:"Primeiro anel com atributos, afinidades ou efeitos passivos." },
  { id:"ring2", label:"Anel 2", group:"Acessórios", description:"Segundo anel independente; os efeitos deverão respeitar regras de equilíbrio." },
  { id:"amulet", label:"Amuleto", group:"Acessórios", description:"Amuleto ou pingente destinado a efeitos mágicos e passivos." },
] as const;
