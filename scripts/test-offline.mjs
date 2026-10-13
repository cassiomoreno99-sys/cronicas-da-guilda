import { readFile, readdir, stat } from "node:fs/promises";
import { join, resolve, relative } from "node:path";
import assert from "node:assert/strict";
const out=resolve("dist");
const worker=await readFile(join(out,"sw.js"),"utf8");
const manifest=JSON.parse(await readFile(join(out,"manifest.webmanifest"),"utf8"));
const index=await readFile(join(out,"index.html"),"utf8");
assert.equal(manifest.display,"standalone");
assert.equal(manifest.start_url,"/");
assert.match(index,/rel="manifest"/);
assert.match(worker,/cache\.addAll\(batch\.map/);
assert.match(worker,/request\.mode==="navigate"/);
assert.match(worker,/cache\.match\(request,\{ignoreSearch:true\}\)/);
const iconNames=["guild-192.png","guild-512.png"];
for(const name of iconNames){
 const path=join(out,"icons",name);
 const body=await readFile(path);
 assert.equal(body.toString("hex",0,8),"89504e470d0a1a0a","Ícone PNG inválido: "+name);
 assert.ok((await stat(path)).size>1500);
}
async function files(dir){
 const result=[];
 for(const item of await readdir(dir,{withFileTypes:true})){
  const path=join(dir,item.name);
  if(item.isDirectory())result.push(...await files(path));
  else if(item.isFile())result.push(path);
 }
 return result;
}
const expected=(await files(out)).filter(f=>!f.endsWith("/sw.js")&&!f.endsWith("\\sw.js"));
for(const path of expected){
 const url="/"+relative(out,path).split(/[\\/]/).map(encodeURIComponent).join("/");
 assert.ok(worker.includes(JSON.stringify(url)), "Fora do cache offline: "+url);
}
assert.ok(expected.length>50,"É necessário guardar todas as imagens e arquivos");
console.log("OFFLINE OK: manifest, ícones, cache completo, navegação sem rede e imagens conferidos ("+expected.length+" arquivos).");
