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
assert(ui.includes("className=\"league-trophy-art\" src={LEAGUE_TROPHY}"),"Troféu aprovado ausente da Liga");
assert(!ui.includes('className={"mini-banner b"'),"Bandeiras antigas continuam aparecendo");
assert(ui.includes('/reference/sanctuary-2026.webp'),"Santuário antigo ainda ativo");
assert(ui.includes('className="guild-challenge-art" src="/reference/olho-rubro-report-2026.webp"'),"A imagem do desafio não foi posicionada na Liga");
assert(!ui.includes('<details className="enemy-dossier'),"O relatório ainda aparece na frente das missões");
assert(css.includes('.sanctuary-head>img')&&css.includes('object-fit:contain'),"Proporção da arte do santuário não foi preservada");
assert(css.includes('.guild-challenge img.guild-challenge-art')&&css.includes('object-fit:contain'),"Imagem do desafio pode ser cortada");
assert(!ui.includes("league-crest-frame"),"Moldura antiga ainda está cortando os brasões");
console.log("ARTES REVISADAS: desafio no único local correto, emblemas, troféus e proporções");

const artNames=["crest-alvorecer","crest-fronteira","crest-vigias","crest-dragoes","crest-guardioes","crest-cacadores"];
for(const name of artNames){const file=new URL("../public/league/"+name+".webp",import.meta.url);const d=readFileSync(file);assert(d.length>10000&&d.toString("ascii",0,4)==="RIFF","Brasão ausente: "+name)}
for(const file of ["../public/league/trophy-real.webp","../public/economy/gold-real.webp","../public/guild/forjador.webp"]){const x=readFileSync(new URL(file,import.meta.url));assert(x.length>10000&&x.toString("ascii",0,4)==="RIFF","Arte aprovada não encontrada: "+file)}
for(const name of ["Escudos da Fronteira","Vigias da Montanha","Dragões do Vale","Guardiões da Montanha","Caçadores da Torre"])assert(ui.includes(name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()),"Nome de guilda não mapeado: "+name);
assert(ui.includes('src="/guild/forjador.webp"'),"Forjador não aparece na Sede");
assert(ui.includes('LEAGUE_PLAYER_CREST = "/league/crest-alvorecer.webp"'),"Brasão da guilda sem identidade correta");
