import assert from "node:assert/strict";
import {physicalStyle,isPhysicalStrike,physicalStrikePlan} from "../lib/combat-physical-strikes.ts";
const hero=(heroClass:string)=>({side:"hero" as const,name:"Herói",class:heroClass as "warrior"});
const enemy=(name:string)=>({side:"enemy" as const,name});
const variants:[
 string,string,string
][]=[
 ["Lâmina Solar","Espada","sword"],["Machado de Kharum","Machado","axe"],
 ["Lança do Crepúsculo","Lança","spear"],["Martelo de Ferro","Martelo","hammer"],
 ["Adaga do Vento","Adaga","daggers"],["Arco Lunar","Arco","bow"],
 ["Garras Sombrias","Garras","claws"]
];
for(const [name,subtype,expected] of variants){
 assert.equal(physicalStyle(hero("warrior"),{name,subtype}),expected);
}
assert.equal(physicalStyle(hero("ranger")),"bow");
assert.equal(physicalStyle(hero("rogue")),"daggers");
assert.equal(physicalStyle(enemy("Lobo sombrio 2")),"bite");
assert.equal(physicalStyle(enemy("Draco selvagem")),"tail");
assert.equal(physicalStyle(enemy("Aranha ancestral")),"claws");
assert.equal(physicalStyle(enemy("Legionário Solkar")),"spear");
assert.equal(physicalStyle(enemy("Rebelde das minas")),"axe");
assert.equal(physicalStyle(enemy("Pirata da Baía")),"daggers");
for(const kind of ["hit","critical","fall"] as const){
 assert.equal(isPhysicalStrike({kind,amount:23},hero("warrior"),undefined,false),true);
 assert.equal(isPhysicalStrike({kind,amount:23},hero("mage"),undefined,false),false);
 assert.equal(isPhysicalStrike({kind,amount:23},enemy("Pantera das brumas"),undefined,false),true);
}
assert.equal(isPhysicalStrike({kind:"ability",amount:24},hero("rogue"),"execution",false),true);
assert.equal(isPhysicalStrike({kind:"ability",amount:24},hero("ranger"),"pinning",false),true);
assert.equal(isPhysicalStrike({kind:"ability",amount:24},hero("mage"),"fireball",false),false);
assert.equal(isPhysicalStrike({kind:"heal",amount:24},hero("paladin"),undefined,false),false);
assert.equal(isPhysicalStrike({kind:"hit",amount:0},hero("warrior"),undefined,false),false);
assert.equal(isPhysicalStrike({kind:"hit",amount:24},hero("warrior"),undefined,true),false);
assert.equal(isPhysicalStrike({kind:"hit",amount:24},enemy("Espectro"),undefined,false),false);
for(const style of ["sword","axe","spear","hammer","daggers","bow","claws","bite","tail","unarmed"] as const){
 for(let i=0;i<6;i++){
  const p=physicalStrikePlan(style,i,i%2===0,780);
  assert.equal(p.variant,i%3);assert.equal(p.contactAt,.54);
  assert.equal(p.duration,780);assert.equal(p.ranged,style==="bow"||(style==="spear"&&i%3===2));
  assert.deepEqual(p.phaseOffsets,[0,.24,.54,1]);
 }
}
console.log("BLOCO 09A OK: 10 famílias, equipamentos reais, 3 variações, eventos físicos e magias protegidas.");
