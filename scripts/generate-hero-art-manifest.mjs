/** Descobre automaticamente as imagens oficiais adicionadas ao projeto.
 * Não cria imagens. Apenas converte os arquivos presentes em um catálogo de URLs.
 * Executado antes de dev/build; nenhuma importação de arquivo ausente é feita. */
import fs from "node:fs";
import path from "node:path";
const races=["human","elf","dwarf","orc","beastkin","umbral"];
const classes=["warrior","paladin","ranger","rogue","mage","healer","bard"];
const sexes=["male","female"];
const extensions=["webp","png","jpg","jpeg","avif"];
const root="public/heroes";
const records={portrait:{},battle:{}};
let unexpected=[];
for(const [kind,folder] of [["portrait","portraits"],["battle","battle"]]){
 const base=path.join(root,folder);
 if(!fs.existsSync(base))continue;
 for(const race of fs.readdirSync(base,{withFileTypes:true})){
  if(!race.isDirectory()||!races.includes(race.name)){unexpected.push(path.join(base,race.name));continue;}
  for(const entry of fs.readdirSync(path.join(base,race.name),{withFileTypes:true})){
   const full=path.join(base,race.name,entry.name);
   if(entry.name===".gitkeep"||entry.name==="README.md")continue;
   const match=/^(warrior|paladin|ranger|rogue|mage|healer|bard)-(male|female)\.(webp|png|jpg|jpeg|avif)$/i.exec(entry.name);
   if(!entry.isFile()||!match){unexpected.push(full);continue;}
   const [,cl,sex,ext]=match;const key=race.name+"/"+cl.toLowerCase()+"-"+sex.toLowerCase();
   if(records[kind][key])throw new Error("Artes repetidas para "+key+": "+full);
   const stat=fs.statSync(full);if(stat.size<5_000)throw new Error("Imagem inválida ou muito pequena: "+full);
   records[kind][key]="/heroes/"+folder+"/"+race.name+"/"+entry.name;
  }
 }
}
if(unexpected.length)throw new Error("Arquivos fora do padrão de raça/classe/sexo:\n"+unexpected.join("\n"));
const content=[
 "/** GERADO AUTOMATICAMENTE. Não editar. Altere apenas os arquivos em public/heroes/. */",
 "export const HERO_ART_ASSETS: { portrait: Record<string,string>; battle: Record<string,string> } = "+JSON.stringify(records,null,2)+";",
 ""].join("\n");
fs.writeFileSync("lib/hero-art-manifest.ts",content);
console.log("Hero art: "+Object.keys(records.portrait).length+"/84 retratos, "+Object.keys(records.battle).length+"/84 sprites encontrados.");
