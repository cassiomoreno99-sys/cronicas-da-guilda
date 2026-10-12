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
assert(ui.includes("<RealisticTrophy size={25}/>"),"Os troféus realistas não aparecem na Liga");
assert(!ui.includes('className={"mini-banner b"'),"Bandeiras antigas continuam aparecendo");
assert(ui.includes('/reference/sanctuary-2026.webp'),"Santuário antigo ainda ativo");
assert(ui.includes('className="guild-challenge-art" src="/reference/olho-rubro-report-2026.webp"'),"A imagem do desafio não foi posicionada na Liga");
assert(!ui.includes('<details className="enemy-dossier'),"O relatório ainda aparece na frente das missões");
assert(css.includes('.sanctuary-head>img')&&css.includes('object-fit:contain'),"Proporção da arte do santuário não foi preservada");
assert(css.includes('.guild-challenge img.guild-challenge-art')&&css.includes('object-fit:contain'),"Imagem do desafio pode ser cortada");
assert(ui.includes("league-crest-frame"),"Brasões sem moldura");
console.log("ARTES REVISADAS: desafio no único local correto, emblemas, troféus e proporções");
