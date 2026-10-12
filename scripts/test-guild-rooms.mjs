import { readFileSync } from "node:fs";
const check=(valid,desc)=>{if(!valid)throw Error(desc);};
const code=readFileSync(new URL("../app/game-client.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../app/ui.css",import.meta.url),"utf8");
const rooms=["infirmary","forge","academy","library","stables","warroom"];
for(const room of rooms){
 const pathname="/guild/rooms/"+room+".webp";
 const file=readFileSync(new URL("../public"+pathname,import.meta.url));
 check(file.byteLength>50000,"A arte "+room+" está vazia");
 check(file.toString("ascii",0,4)==="RIFF"&&file.toString("ascii",8,12)==="WEBP","Formato incorreto: "+room);
 check(code.includes(room+':"'+pathname+'"'),"Edifício sem imagem dedicada: "+room);
}
check(code.includes("room={key} compact"),"As cartas não associam a imagem ao tipo de edifício");
check(!code.includes("arts[index%arts.length]"),"Imagens genéricas ainda são repetidas por posição");
for(const fragment of ['room="forge"','room="academy"','room="library"','room="warroom"'])check(code.includes(fragment),"Falta ilustração contextual "+fragment);
check(css.includes("building-list article.guild-building-card img.guild-room-art"),"As cartas perderam a proporção de imagem");
check(css.includes("object-fit:contain"),"Imagens poderão ser cortadas");
check(css.includes("@media(max-width:700px)"),"Falta adaptação à versão celular");
console.log("SEDE: seis artes aprovadas, URLs, nomes, proporções e versões PC/celular conferidos.");
