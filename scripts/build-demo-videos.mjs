import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

// Dois VÍDEOS REAIS WebM (2 s cada), pré-renderizados DURANTE O BUILD.
// Brilhos e partículas sem codecs no Android, apenas um vídeo em cada cena.
// Arte procedural original: nenhum asset comercial ou download em tempo de jogo.
const W=360,H=202,FPS=18,FRAMES=36;
const outDir=resolve("dist/demo");
await mkdir(outDir,{recursive:true});
const temp=await mkdtemp(join(tmpdir(),"cronicas-demo-"));
const clamp=n=>Math.max(0,Math.min(255,Math.round(n)));
const add=(base,r,g,b,k)=>[clamp(base[0]+r*k),clamp(base[1]+g*k),clamp(base[2]+b*k)];
const noise=(x,y,n)=>{let h=(x*374761393+y*668265263+n*2654435761)>>>0;h=Math.imul(h^(h>>>13),1274126177)>>>0;return (h^(h>>>16)) / 4294967295;};

function renderFrame(kind,f){
 const t=f/(FRAMES-1),pixels=Buffer.alloc(W*H*3);
 const cx=kind==="arcane"?W*.53:W*.58,cy=H*.52;
 const ringR=kind==="arcane"?12+t*176:14+t*197;
 const flashes=kind==="arcane"?[[.32,.31],[.68,.62],[.52,.22]]:[[.25,.68],[.75,.35],[.55,.55]];
 const slashAngle=kind==="finisher"?(t*4.4-.3):0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const dx=x-cx,dy=y-cy,r=Math.hypot(dx,dy),ang=Math.atan2(dy,dx);
  const shade=Math.max(0,1-Math.abs(x-W*.5)/(W*.55));
  let rgb=[2+shade*3,4+shade*6,10+shade*12];
  const ring=Math.exp(-Math.pow((r-ringR)/4.1,2))*1.05*(1-t*.25);
  const second=Math.exp(-Math.pow((r-ringR*.72)/2.3,2))*.6;
  const ray=Math.pow(Math.max(0,Math.sin(ang*(kind==="arcane"?12:7)+t*21)),24)*Math.exp(-Math.pow((r-ringR*.66)/Math.max(20,ringR*.46),2))*.62;
  const core=Math.exp(-Math.pow(r/(25+t*55),2))*(kind==="arcane"?.39:.55);
  if(kind==="arcane"){
    rgb=add(rgb,25,130,235,ring+second+ray+core);
    rgb=add(rgb,122,216,255,Math.exp(-Math.pow((r-28)/(6+12*t),2))*.58);
  }else{
    rgb=add(rgb,246,139,40,ring+second+ray+core);
    rgb=add(rgb,255,235,110,ring*.45);
    const line=Math.abs((y-H*.58)-(x-W*.48)*(-1.35+slashAngle*.05));
    const line2=Math.abs((y-H*.35)+(x-W*.6)*(.76+slashAngle*.06));
    const slash= Math.exp(-Math.pow(line/3.7,2))*Math.exp(-Math.pow((x-W*(t*.9+.04))/(W*.33),2));
    const cross=Math.exp(-Math.pow(line2/3,2))*Math.exp(-Math.pow((x-W*(1-t*.85))/(W*.33),2));
    rgb=add(rgb,250,198,64,slash*1.4+cross*.95);
    rgb=add(rgb,255,215,175,(slash+cross)*.52);
  }
  for(let k=0;k<flashes.length;k++){
    const [fx,fy]=flashes[k],px=fx*W+Math.sin(t*15+k)*28,py=fy*H+Math.cos(t*10+k)*23;
    const dist=Math.hypot(x-px,y-py);
    const glow=Math.exp(-Math.pow(dist/(7+t*20),2))*.3;
    rgb=kind==="arcane"?add(rgb,52,118,220,glow):add(rgb,210,101,54,glow);
  }
  const n=noise(Math.floor(x/4),Math.floor(y/4),f);
  if(n>.9990 && x>4 && x<W-4 && y>4 && y<H-4)
    rgb=kind==="arcane"?add(rgb,125,200,255,.85):add(rgb,250,204,102,.85);
  if(t>.36&&t<.68){
    const burst=(1-Math.abs(t-.52)/.16)*Math.exp(-Math.pow(r/(65+(t-.36)*150),2));
    rgb=add(rgb,kind==="arcane"?170:250,kind==="arcane"?120:205,kind==="arcane"?255:160,burst*.55);
  }
  const idx=(y*W+x)*3;pixels[idx]=clamp(rgb[0]);pixels[idx+1]=clamp(rgb[1]);pixels[idx+2]=clamp(rgb[2]);
 }
 return Buffer.concat([Buffer.from("P6\n"+W+" "+H+"\n255\n"),pixels]);
}
try{
 for(const kind of ["arcane","finisher"]){
  const frames=join(temp,kind);
  await mkdir(frames,{recursive:true});
  for(let i=0;i<FRAMES;i++)await writeFile(join(frames,"frame-"+String(i).padStart(3,"0")+".ppm"),renderFrame(kind,i));
  const destination=join(outDir,"arena-"+kind+".webm");
  const args=["-hide_banner","-loglevel","error","-y","-framerate",String(FPS),"-i",join(frames,"frame-%03d.ppm"),"-c:v","libvpx-vp9","-pix_fmt","yuv420p","-deadline","realtime","-cpu-used","6","-b:v","240k","-an","-threads","2",destination];
  const run=spawnSync(ffmpegPath,args,{encoding:"utf8",timeout:90000,maxBuffer:1500000});
  if(run.status!==0)throw new Error("Não foi possível gerar vídeo "+kind+": "+(run.stderr||run.error?.message||run.status));
  const video=await readFile(destination);
  if(video.length<4500||video.length>1400000||video.subarray(0,4).toString("hex")!=="1a45dfa3")
    throw new Error("Vídeo especial inválido ou pesado: "+kind);
  console.log("DEMO CINEMATOGRÁFICA: "+kind+" 2,0 s WebM "+(video.length/1024).toFixed(1)+" KiB.");
 }
} finally {await rm(temp,{recursive:true,force:true});}
