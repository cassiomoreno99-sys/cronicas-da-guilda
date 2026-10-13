import { readFileSync, statSync, existsSync } from "node:fs";
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


// REGRESSÃO MOBILE: compra do mercador em segunda linha, sem sobreposição.
assert(css.includes("Correção exclusiva para telas móveis: o botão do mercador"),"Mercador mobile perdeu ajuste de compra");
assert(css.includes("@media (max-width: 900px)"),"Regra mobile não está isolada em media query");
assert(css.includes(".tavern-screen .tavern-side .shop .catalog-shop > div > button"),"Botão da taverna sem alvo de CSS específico");
assert(css.includes("grid-column: 1 / -1"),"Botão deve usar toda a largura abaixo dos detalhes");
assert(css.includes("grid-row: 2"),"Botão do mercador deve ficar na segunda linha");

// REGRESSÃO CAPAS: a expedição usa a imagem da missão, nunca a da vaga.
assert(ui.includes("missionArtwork(exp.battle.combat?.mission.id"),"Capas da expedição não seguem a missão ativa");
assert(ui.includes("missionArtwork(m.id)"),"Quadro de missões e expedições precisam compartilhar as artes");
assert(!ui.includes("/reference/expedition-1.webp")&&!ui.includes("/reference/expedition-2.webp"),"Capa fixa antiga ainda existe no layout");
for(const name of ["expedition-1.webp","expedition-2.webp"])
 assert(!existsSync(new URL("../public/reference/"+name,import.meta.url)),"Arte antiga ainda ocupa espaço no offline: "+name);
const match=ui.match(/function missionArtwork\(missionId: string\): string \{([\s\S]*?)\n\}/);
assert(!!match,"Resolver de imagens da missão ausente");
const pick=new Function("missionId","missionArt","valenMissionArt",match[1]);
const old=["/reference/mission-1.webp","/reference/mission-2.webp","/reference/mission-3.webp","/reference/mission-4.webp","/reference/mission-5.webp"];
const newArt=Array.from({length:7},(_,i)=>"/reference/valen-mission-"+(i+1)+".jpg");
assert(pick("mission-5-0-0",old,newArt)===newArt[0],"Ritual sombrio deve mostrar cripta vermelha");
assert(pick("mission-5-0-1",old,newArt)===newArt[1],"Aranhas nas ruínas devem mostrar aranhas");
assert(pick("mission-5-0-2",old,newArt)===newArt[2],"Escolta deve mostrar caravana");
assert(pick("boss-2-0",old,newArt)===newArt[6],"Guardião precisa usar sua própria arte");
assert(pick("mission-5-1-2",old,newArt)===old[2],"Outras regiões devem manter a arte de sua missão");
for(const name of ["valen-mission-1.jpg","valen-mission-2.jpg","valen-mission-3.jpg"])
 assert(statSync(new URL("../public/reference/"+name,import.meta.url)).size>10000,"Nova arte ausente: "+name);
console.log("MOBILE E EXPEDIÇÕES OK: botão abaixo das informações; capas de ritual, aranhas e escolta corretas; imagens antigas removidas.");
