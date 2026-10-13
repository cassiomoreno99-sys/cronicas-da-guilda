import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { runInNewContext } from "node:vm";

const component=await readFile("app/arena-demo.tsx","utf8");
const game=await readFile("app/game-client.tsx","utf8");
const build=await readFile("scripts/build-offline.mjs","utf8");
const css=await readFile("app/arena-demo.css","utf8");
const scriptSource=component.split("const SCRIPT: Move[] = [")[1]?.split("\n];")[0];
assert.ok(scriptSource,"Roteiro da batalha não encontrado.");
const acts=runInNewContext("["+scriptSource+"]");
assert.ok(acts.length>=16&&acts.length<=24,"A demo precisa ser curta, mas com vários turnos.");
const hp=new Map([["kaelith",180],["lyria",132],["thorgar",195],["eldrin",150],["lobo-1",95],["lobo-2",110],["lobo-3",150]]);
const maxHp=new Map(hp);
let specials=0;
for(const [i,step] of acts.entries()){
  assert.ok(hp.has(step.actor),"Atacante inexistente no passo "+i);
  assert.ok(hp.get(step.actor)>0,"Um combatente derrotado atacou na ação "+i+": "+step.actor);
  assert.ok(Array.isArray(step.targets)&&step.targets.length>0);
  for(const target of step.targets){
    assert.ok(hp.has(target.id),"Alvo inexistente na ação "+i);
    assert.ok(hp.get(target.id)>0,"Alvo já derrotado foi atingido na ação "+i);
    hp.set(target.id,Math.max(0,Math.min(maxHp.get(target.id),hp.get(target.id)-target.value)));
  }
  if(step.video)specials++;
}
assert.equal(specials,2,"Exatamente dois vídeos especiais.");
assert.ok(["lobo-1","lobo-2","lobo-3"].every(id=>hp.get(id)===0),"A demonstração deve terminar em vitória coerente.");
assert.ok(["kaelith","lyria","thorgar","eldrin"].every(id=>hp.get(id)>0),"A demo precisa manter heróis de pé.");
assert.match(component,/function ArenaDemo/,"A demonstração precisa estar no jogo.");
assert.match(component,/ARENA_DEMO_ACTION_COUNT = SCRIPT.length/);
assert.match(game,/<ArenaDemo onExit=/,"Faltou entrada no jogo.");
assert.match(game,/Jogar demonstração/);
assert.match(game,/function CinematicBattlePage/,"Arena original não pode ser removida.");
assert.match(component,/SIMULAÇÃO|roteiro fixo|roteiro controlado/i,"Aviso sobre roteiro de demonstração é obrigatório.");
assert.doesNotMatch(component,/updateLocalCampaign|applyAction|localStorage|reset-specialization|fetch\(/,"A demo não pode tocar no save nem na campanha.");
assert.match(component,/data-actor/);
assert.match(component,/data-hit/);
assert.match(component,/setPaused/);
assert.match(component,/setSpeed/);
assert.match(component,/setSkipVideo/);
assert.match(component,/setLite/);
assert.match(css,/@keyframes demo-attack/);
assert.match(css,/@keyframes demo-hit/);
assert.match(css, /demo-unit-figure/);
const videos=["arcane","finisher"];
let totalSize=0;
for (const id of videos){
  const path=resolve("dist","demo","arena-"+id+".webm");
  const content=await readFile(path);
  const size=(await stat(path)).size;
  totalSize+=size;
  assert.equal(content.subarray(0,4).toString("hex"),"1a45dfa3","WebM inválido: "+id);
  assert.ok(size>4500&&size<1400000,"Vídeo pesado ou inválido: "+id+" ("+size+")");
  const probe=spawnSync(ffmpegPath,["-hide_banner","-i",path,"-f","null","-"],{encoding:"utf8",timeout:25000});
  assert.equal(probe.status,0,"O vídeo precisa ser reproduzível no Android: "+id+" "+probe.stderr?.slice(-250));
  assert.match(probe.stderr,/Duration: 00:00:02\./,"O vídeo deveria durar aproximadamente 2 segundos: "+id);
  const sw=await readFile(join("dist","sw.js"),"utf8");
  assert.ok(sw.includes(JSON.stringify("/demo/arena-"+id+".webm")),"Vídeo fora do cache offline: "+id);
}
assert.ok(totalSize<2500000,"Vídeos excedem o orçamento offline.");
assert.match(build,/cache\.addAll/);
console.log("ARENA DEMO V1 OK: dois vídeos WebM reais, 2 segundos, movimentos, ações, 100% offline e save isolado ("+Math.round(totalSize/1024)+" KiB).");
