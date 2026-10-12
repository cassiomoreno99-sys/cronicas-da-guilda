import { readFileSync, statSync } from "node:fs";
const ui=readFileSync(new URL("../app/game-client.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/ui.css",import.meta.url),"utf8");
const paths=[
 "league/crest-player.webp","league/crest-rival-0.webp","league/crest-rival-1.webp",
 "league/crest-rival-2.webp","league/crest-rival-3.webp","league/crest-rival-4.webp",
 "league/trophy.webp","reference/sanctuary-2026.webp","reference/olho-rubro-report-2026.webp"
];
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
for(const rel of paths){
 const file=new URL("../public/"+rel,import.meta.url);
 const buf=readFileSync(file);
 assert(buf.length>400,"Imagem vazia: "+rel);
 assert(buf.toString("ascii",0,4)==="RIFF"&&buf.toString("ascii",8,12)==="WEBP","Formato inválido: "+rel);
}
assert(/leagueCrest\(g\)/.test(ui),"As classificações não usam brasões");
assert(ui.includes('src={LEAGUE_TROPHY}'),"Os troféus não aparecem na liga");
assert(!ui.includes('className={"mini-banner b"'),"Bandeiras antigas continuam aparecendo");
assert(ui.includes('/reference/sanctuary-2026.webp'),"Santuário antigo ainda ativo");
assert(ui.includes('/reference/olho-rubro-report-2026.webp'),"Relatório do Olho Rubro ausente");
assert(ui.includes('state.activeRegion===1&&<details className="enemy-dossier'),"Relatório fora da região definida");
assert(css.includes('.sanctuary-head>img')&&css.includes('object-fit:contain'),"Proporção da arte do santuário não foi preservada");
assert(css.includes('.enemy-dossier-content img')&&css.includes('height:auto'),"Relatório poderá ser cortado");
console.log("ARTES APROVADAS: 9 arquivos WebP; Liga, Descanso e Olho Rubro conectados");
