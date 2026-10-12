import { readFileSync } from "node:fs";
const ui=readFileSync(new URL("../app/game-client.tsx",import.meta.url),"utf8");
const symbols=readFileSync(new URL("../app/game-symbols.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/ui.css",import.meta.url),"utf8");
const must=(v,m)=>{if(!v)throw Error(m);};
const keys=[...symbols.matchAll(/^  (\w+):\s*\{ icon: /gm)].map(m=>m[1]);
must(keys.length>=30,"O guia oficial perdeu tipos de símbolos");
must(new Set(keys).size===keys.length,"Símbolos duplicados");
for(const [,kind] of ui.matchAll(/<GameSymbol\s+kind="([\w-]+)"/g))
  must(keys.includes(kind),"Símbolo inexistente: "+kind);
must(ui.includes('<GameSymbol kind="gold" size={22}/>'),"O ouro da barra superior deve ter símbolo visível");
must(ui.includes('<GameSymbol kind="reward"/>'),"Recompensas não usam pilha de moedas");
must(ui.includes('<GameSymbol kind="critical"/>'),"Falta crítico no herói");
must(ui.includes('<GameSymbol kind="objective"/>'),"Falta objetivo nas missões");
must(ui.includes("<SymbolGuide />"),"Falta o guia de símbolos");
for(const p of [".game-symbol--gold",".game-symbol--reward",".symbol-guide-grid","@media(max-width:430px)","@media(min-width:1000px)"])
  must(css.includes(p),"Aparência não adaptada: "+p);
for(const raw of ["⚔","❤","🛡","🎒","📚","⚙","🍺"])
  must(!ui.includes(raw),"Símbolo não padronizado ainda está na interface: "+raw);
must((ui.match(/<GameSymbol\s/g)||[]).length>=90,"Cobertura de símbolos inconsistente");
must((ui.match(/<RealisticTrophy /g)||[]).length>=4,"Troféus medievais ausentes");
console.log("SIMBOLOS-OK: "+keys.length+" significados, menus, telas, economia e responsividade");
