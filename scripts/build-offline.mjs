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

// Biblioteca musical de RPG licenciada CC0, empacotada para jogo OFFLINE.
// A compilação confirma a identidade de cada arquivo e a duração REAL das faixas,
// impedindo publicar "30 minutos" contando loops artificiais da mesma música.
const catalog=JSON.parse(await readFile(resolve("lib/music-playlist.json"),"utf8"));
const tracks=catalog.tracks;
const musicDir=join(out,"music");
await mkdir(musicDir,{recursive:true});
if(!Array.isArray(tracks)||tracks.length<8)throw new Error("Playlist de RPG incompleta.");
function verifyOggDuration(file){
  if(file.toString("ascii",0,4)!=="OggS")throw new Error("Trilha não é OGG.");
  const id=file.indexOf("vorbis",0,"ascii");
  if(id<0||id+15>file.length)throw new Error("Trilha não é Ogg Vorbis.");
  const sampleRate=file.readUInt32LE(id+11);
  if(sampleRate<22050||sampleRate>192000)throw new Error("Taxa de amostragem de áudio inesperada: "+sampleRate);
  let offset=0,lastGranule=0n,pages=0;
  while(offset<file.length){
    if(offset+27>file.length||file.toString("ascii",offset,offset+4)!=="OggS")
      throw new Error("Página OGG truncada ou inválida.");
    const pageSegments=file[offset+26];
    if(offset+27+pageSegments>file.length)throw new Error("Índice de pacotes OGG inválido.");
    let packetSize=0;
    for(let i=0;i<pageSegments;i++)packetSize+=file[offset+27+i];
    const end=offset+27+pageSegments+packetSize;
    if(end>file.length)throw new Error("Arquivo de música OGG truncado.");
    const granule=file.readBigUInt64LE(offset+6);
    if(granule!==0xffffffffffffffffn)lastGranule=granule;
    offset=end;pages++;
  }
  if(pages<3)throw new Error("Poucas páginas para uma música.");
  const duration=Number(lastGranule)/sampleRate;
  if(!Number.isFinite(duration)||duration<15||duration>1800)
    throw new Error("Duração de música inválida ("+duration+").");
  return duration;
}
async function downloadTrack(track){
  let lastError;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const response=await fetch(track.source,{signal:AbortSignal.timeout(35000)});
      if(!response.ok)throw new Error("Download HTTP "+response.status);
      const data=Buffer.from(await response.arrayBuffer());
      if(data.length<30000||data.length>10000000)throw new Error("Tamanho de áudio inesperado.");
      const sha=createHash("sha1").update("blob "+data.length+"\0").update(data).digest("hex");
      if(sha!==track.githubBlob)throw new Error("Arquivo de áudio diferente da fonte verificada.");
      const seconds=verifyOggDuration(data);
      await writeFile(join(musicDir,track.file),data);
      return {seconds,bytes:data.length};
    } catch(error) {
      lastError=error;
      if(attempt<3)await new Promise(resolve=>setTimeout(resolve,attempt*900));
    }
  }
  throw new Error("Não foi possível incluir "+track.file+": "+String(lastError));
}
const musicResults=new Array(tracks.length);
const workers=Array.from({length:4},(_,worker)=> (async()=>{
  for(let index=worker;index<tracks.length;index+=4){
    musicResults[index]=await downloadTrack(tracks[index]);
  }
})());
await Promise.all(workers);
const durationSeconds=musicResults.reduce((sum,x)=>sum+x.seconds,0);
if(durationSeconds<catalog.minimumUniqueMinutes*60)
  throw new Error("Playlist tem somente "+Math.floor(durationSeconds/60)+" minutos de músicas diferentes; mínimo "+catalog.minimumUniqueMinutes+".");
const sizeBytes=musicResults.reduce((sum,x)=>sum+x.bytes,0);
console.log("TRILHA RPG: "+tracks.length+" músicas diferentes · "+(durationSeconds/60).toFixed(1)+" minutos reais · "+(sizeBytes/1048576).toFixed(1)+" MiB para offline.");

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
