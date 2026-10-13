import {mkdir,writeFile} from "node:fs/promises";
import {resolve,dirname} from "node:path";
import {createHash} from "node:crypto";

// Modelos GLB com rig/animação embutidos, exclusivamente de artistas CC0.
// Fonte: https://github.com/sion-rgb/tactical-slash/blob/main/THIRD_PARTY_ASSETS.md
// Modelos KayKit recompilados, sem texturas externas nem conexão durante o jogo.
// Os hashes Git Blob impedem que uma alteração silenciosa da origem seja publicada.
const base="https://raw.githubusercontent.com/sion-rgb/tactical-slash/main/";
const files=[
  ["player_swordsman","assets/characters/player/player_swordsman.glb","24492f0e0609708495284bdb8759b98f2bd66f49",549284],
  ["player_archer","assets/characters/player/player_archer.glb","739a7b5d6fdf6acb2127f3009e7efd32ae15a011",701504],
  ["player_priest","assets/characters/player/player_priest.glb","ce30039961ce60585e1da2928c935a42cf17ae5f",536752],
  ["enemy_swordsman","assets/characters/enemy/enemy_swordsman.glb","1f502e9da044af60759cac6eb24f58c916b05c6a",673216],
  ["enemy_archer","assets/characters/enemy/enemy_archer.glb","3850891479b7087df54ab0e3e767e7d5ff46230e",683976],
  ["enemy_priest","assets/characters/enemy/enemy_priest.glb","b54983c9858900bf0f5e515f6a5f5756d107a224",594168],
  ["dungeon_pillar","assets/environment/dungeon_pillar.glb","dfb2d0149b1ff4bcbdd33ba6ad10625031fd50ae",55328],
  ["dungeon_wall","assets/environment/dungeon_wall.glb","a29e908600596824efa007f3ac279e17a933d9c6",53272]
];
const output=resolve("dist/models/arena3d");
await mkdir(output,{recursive:true});
async function one([id,src,hash,size]){
 let lastError;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(base+src,{signal:AbortSignal.timeout(45000)});
   if(!response.ok)throw Error("HTTP "+response.status);
   const data=Buffer.from(await response.arrayBuffer());
   if(data.length!==size||data.toString("ascii",0,4)!=="glTF")throw Error("GLB inválido ou tamanho inesperado");
   const actual=createHash("sha1").update("blob "+data.length+"\0").update(data).digest("hex");
   if(actual!==hash)throw Error("Hash diverge: "+actual);
   // Header GLB: versão 2 e tamanho exato.
   if(data.readUInt32LE(4)!==2||data.readUInt32LE(8)!==data.length)throw Error("Cabeçalho glTF 2.0 inválido");
   const name=output+"/"+id+".glb";
   await writeFile(name,data);
   return {id,bytes:data.length};
  }catch(error){lastError=error;if(attempt<2)await new Promise(ok=>setTimeout(ok,(attempt+1)*750));}
 }
 throw Error("Falha no modelo 3D "+id+": "+lastError);
}
const results=await Promise.all(files.map(one));
const total=results.reduce((n,v)=>n+v.bytes,0);
if(total>5500000)throw Error("Arena 3D excedeu orçamento de 5,5 MB");
console.log("ARENA 3D: "+results.length+" modelos reais GLB CC0, "+(total/1048576).toFixed(2)+" MiB; disponíveis offline.");
