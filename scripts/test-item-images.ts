import { readFileSync } from "node:fs";
import { CATALOG_ITEMS } from "../lib/catalog-test.ts";
const assert=(condition:boolean,why:string)=>{if(!condition)throw Error(why)};
assert(CATALOG_ITEMS.length===314,"O catálogo deve ter 314 imagens");
const ids=CATALOG_ITEMS.map(x=>x.id);
assert(ids.every((x,i)=>x==="CG-"+String(i+1).padStart(3,"0")),"Ordem das imagens diferente do cadastro");
for(let sheet=1;sheet<=4;sheet++){
 const bytes=readFileSync(new URL("../public/items/atlas-"+sheet+".avif",import.meta.url));
 assert(bytes.length>12000,"Atlas não carregado: "+sheet);
 assert(bytes.subarray(4,12).toString()==="ftypavif","Arquivo não é AVIF válido: "+sheet);
}
for(let id=1;id<=314;id++){
 const index=id-1;
 const sheet=index<300?Math.floor(index/100)+1:4;
 const position=index<300?index%100:index-300;
 const cols=index<300?10:7;const rows=index<300?10:2;
 const c=position%cols,r=Math.floor(position/cols);
 assert(sheet>=1&&sheet<=4&&c>=0&&c<cols&&r>=0&&r<rows,"Posição de imagem inválida: "+id);
}
console.log("ASSETS-314: 314 IDs, 4 atlas, formato e posições conferidos.");
