import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";

const out = resolve("dist");
const iconDir = join(out, "icons");
await mkdir(iconDir, { recursive: true });

// Brasão azul e dourado para a instalação na tela inicial do Android.
function colorImage(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const inside = (x, y, vertices) => {
    let hit = false;
    for (let i=0,j=vertices.length-1;i<vertices.length;j=i++) {
      const xi=vertices[i][0],yi=vertices[i][1],xj=vertices[j][0],yj=vertices[j][1];
      if ((yi>y)!==(yj>y) && x < (xj-xi)*(y-yi)/(yj-yi)+xi) hit=!hit;
    }
    return hit;
  };
  const shield=[[.19,.13],[.50,.07],[.81,.13],[.81,.59],[.70,.77],[.5,.92],[.30,.77],[.19,.59]];
  const inner=[[.23,.17],[.5,.12],[.77,.17],[.77,.58],[.66,.74],[.5,.86],[.34,.74],[.23,.58]];
  const crown=[[.32,.32],[.37,.46],[.63,.46],[.68,.32],[.59,.38],[.50,.26],[.41,.38]];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=(x+.5)/size,v=(y+.5)/size; let rgb=[9,18,30];
    const gold=inside(u,v,shield);
    const blue=inside(u,v,inner);
    if(gold)rgb=[212,160,64];
    if(blue)rgb=[10+Math.round(v*11),38+Math.round(v*7),70+Math.round(v*23)];
    const d=Math.hypot(u-.5,v-.43);
    if(blue&&d<.155)rgb=[240,192,89];
    if(blue&&d<.115)rgb=[255,225,136];
    if(blue&&inside(u,v,crown))rgb=[244,198,91];
    if(blue&&v>.57&&v<.70&&Math.abs(u-.5)<.20&&v>.64-Math.abs(u-.5)*.55)rgb=[176,204,222];
    const idx=(y*size+x)*4;
    pixels[idx]=rgb[0];pixels[idx+1]=rgb[1];pixels[idx+2]=rgb[2];pixels[idx+3]=255;
  }
  return pixels;
}
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);return c>>>0;});
function chunk(name,data) {
 const label=Buffer.from(name),size=Buffer.alloc(4),hash=Buffer.alloc(4);
 size.writeUInt32BE(data.length);
 let crc=0xffffffff;
 for(const b of Buffer.concat([label,data]))crc=crcTable[(crc^b)&255]^(crc>>>8);
 hash.writeUInt32BE((crc^0xffffffff)>>>0);
 return Buffer.concat([size,label,data,hash]);
}
function pngIcon(size) {
 const img=colorImage(size),lineLength=size*4,raw=Buffer.alloc(size*(lineLength+1));
 for(let row=0;row<size;row++)img.copy(raw,row*(lineLength+1)+1,row*lineLength,(row+1)*lineLength);
 const ihdr=Buffer.alloc(13);
 ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ihdr),chunk("IDAT",deflateSync(raw,{level:9})),chunk("IEND",Buffer.alloc(0))]);
}
for(const size of [192,512])await writeFile(join(iconDir,"guild-"+size+".png"),pngIcon(size));

// Tema orquestral CC0 de Juhani Junkala (SubspaceAudio), armazenado no pacote offline.
// Fonte: https://opengameart.org/content/boss-battle-music
// Arquivo OGG otimizado, hospedado publicamente no projeto dungeon-haskell.
const musicSource = "https://raw.githubusercontent.com/jarlah/dungeon-haskell/master/assets/music/boss.ogg";
const musicPath = join(out, "music", "cronicas-tema-epico.ogg");
await mkdir(join(out, "music"), {recursive:true});
const musicResponse = await fetch(musicSource, {signal:AbortSignal.timeout(20000)});
if (!musicResponse.ok) throw new Error("Não foi possível preparar a trilha do jogo (" + musicResponse.status + ").");
const music = Buffer.from(await musicResponse.arrayBuffer());
if(music.length < 500000 || music.length > 6000000 || music.toString("ascii",0,4) !== "OggS")
  throw new Error("A trilha de RPG não é um arquivo OGG válido.");
const musicBlobHash = createHash("sha1").update("blob "+music.length+"\0").update(music).digest("hex");
if(musicBlobHash !== "301eed6f6a65d966247b4cd978cff945175a558b")
  throw new Error("A trilha mudou na origem. Verifique a licença antes de distribuir.");
await writeFile(musicPath,music);

const manifest={
 name:"Crônicas da Guilda",
 short_name:"Crônicas da Guilda",
 description:"Gerencie heróis e sua guilda medieval mesmo sem internet.",
 lang:"pt-BR",
 id:"/",
 start_url:"/",
 scope:"/",
 display:"standalone",
 orientation:"any",
 background_color:"#071018",
 theme_color:"#071018",
 icons:[
  {src:"/icons/guild-192.png",sizes:"192x192",type:"image/png",purpose:"any maskable"},
  {src:"/icons/guild-512.png",sizes:"512x512",type:"image/png",purpose:"any maskable"}
 ]
};
await writeFile(join(out,"manifest.webmanifest"),JSON.stringify(manifest,null,2));

async function walk(dir) {
 const result=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const full=join(dir,entry.name);
  if(entry.isDirectory())result.push(...await walk(full));
  else if(entry.isFile()&&entry.name!=="sw.js")result.push(full);
 }
 return result;
}
const distFiles=(await walk(out)).sort();
const publicUrls=["/",...distFiles.map(p=>"/"+relative(out,p).split(sep).map(encodeURIComponent).join("/"))];
const digest=createHash("sha256");
for(const file of distFiles){digest.update(relative(out,file));digest.update(await readFile(file));}
const version=digest.digest("hex").slice(0,16);
const worker=String.raw`// Gerado pelo build: arquivos completos para jogar sem rede.
const CACHE_NAME = "cronicas-offline-${version}";
const CACHE_PREFIX = "cronicas-offline-";
const PRECACHE = ${JSON.stringify(publicUrls)};
self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE.map(url=>new Request(url,{cache:"reload"})));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>
      (name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME) ||
      name.startsWith("cronicas-da-guilda")
    ).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=="GET"||url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    if(request.mode==="navigate"){
      return await cache.match("/") || await cache.match("/index.html") || fetch(request);
    }
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached)return cached;
    return fetch(request);
  })());
});
`;
await writeFile(join(out,"sw.js"),worker);
console.log(`PWA OFFLINE: ${publicUrls.length} arquivos guardados para uso sem internet. Versão ${version}.`);
