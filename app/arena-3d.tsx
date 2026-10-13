import {useEffect,useRef,useState} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {clone as cloneSkinned} from "three/addons/utils/SkeletonUtils.js";
import {createWolf3D,type Wolf3D,type WolfMove} from "./arena-wolf";
import {ArrowLeft, Box, Camera, ChevronRight, FastForward, Shield, Swords, Zap} from "lucide-react";
import type {Action,BattleFighter,BattleLog,Expedition} from "@/lib/game";
import "./arena-3d.css";

type RenderActor={
  id:string;side:"hero"|"enemy";root:THREE.Group;figure:THREE.Object3D;
  mixer:THREE.AnimationMixer;clips:THREE.AnimationClip[];animation?:THREE.AnimationAction;
  pose:THREE.Vector3; hp:number; actionStart:number;actionDuration:number;
  attackTarget?:THREE.Vector3;kind?:string;
  wolf?:Wolf3D;reactionStart?:number;wolfDeathStart?:number;
};
type GraphicsController={sync:(fighters:BattleFighter[],log:BattleLog[])=>void;setCamera:(v:number)=>void;setLite:(v:boolean)=>void;setPreview:(v:boolean)=>void};
const MODELS="/models/arena3d/";
const NAMES=["player_swordsman","player_archer","player_priest","enemy_swordsman","enemy_archer","enemy_priest","dungeon_pillar","dungeon_wall"] as const;
const isWolf=(f:BattleFighter)=>f.side==="enemy"&&/(lobo|lobisomem|wolf|warg|cão sombrio)/i.test(f.name);
const CLIPS={idle:/idle|rest|breathing/i,melee:/melee|sword|attack|slash/i,ranged:/ranged|archer|bow|shoot|shooting/i,cast:/spell|cast|magic|priest/i,hit:/hit|hurt|damage/i,death:/death|dying|die/i,walk:/walk|run|move/i};
const chooseModel=(f:BattleFighter)=>{
  const klass=f.class||"warrior";
  const type=klass==="mage"||klass==="healer"||klass==="necromancer"||klass==="druid"||klass==="bard"?"priest":
    klass==="ranger"||klass==="rogue"?"archer":"swordsman";
  return (f.side==="hero"?"player_":"enemy_")+type;
};
export function actionFromRealLog(previous:BattleLog[],now:BattleLog[]):BattleLog|undefined{
  const added=now.slice(Math.min(previous.length,now.length));
  // Log do motor é fonte única: nenhuma vida ou vencedor é fabricado aqui.
  return [...added].reverse().find(x=>x.actorId && (x.targetId||x.kind==="ability") &&
    ["hit","heal","critical","fall","ability"].includes(x.kind) && (x.amount === undefined || x.amount > 0));
}
function actorSpacing(i:number,n:number){return (i-(n-1)/2)*1.72;}
function modelBox(group:THREE.Object3D,targetHeight:number){
  const bounds=new THREE.Box3().setFromObject(group);
  const height=bounds.getSize(new THREE.Vector3()).y;
  if(height>0.02)group.scale.multiplyScalar(targetHeight/height);
  const updated=new THREE.Box3().setFromObject(group);
  group.position.y-=updated.min.y;
}
function playClip(actor:RenderActor,type:keyof typeof CLIPS){
  let clip=actor.clips.find(c=>CLIPS[type].test(c.name));
  if(!clip)clip=actor.clips.find(c=>CLIPS.idle.test(c.name))||actor.clips[0];
  if(!clip)return;
  const next=actor.mixer.clipAction(clip,actor.figure);
  if(actor.animation===next&&next.isRunning())return;
  actor.animation?.fadeOut(.1);
  next.reset().fadeIn(.12).play();
  next.setLoop(type==="idle"||type==="walk"?THREE.LoopRepeat:THREE.LoopOnce,type==="idle"||type==="walk"?Infinity:1);
  next.clampWhenFinished=!(type==="idle"||type==="walk");
  actor.animation=next;
}
function createTorch(scene:THREE.Scene,point:THREE.Vector3,lights:THREE.PointLight[]){
  const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.12,.23,.7,7),new THREE.MeshStandardMaterial({color:0x352d2b,metalness:.5,roughness:.6}));
  pedestal.position.copy(point);pedestal.position.y=.42;scene.add(pedestal);
  const flame=new THREE.Mesh(new THREE.ConeGeometry(.15,.45,9),new THREE.MeshBasicMaterial({color:0xffb25c}));
  flame.position.set(point.x,1.01,point.z);scene.add(flame);
  const light=new THREE.PointLight(0xff9944,10,7,2);light.position.set(point.x,1.1,point.z);scene.add(light);lights.push(light);
}
export default function Arena3D({expedition,act,close,returnToTeam,busy}:{
  expedition:Expedition;act:(a:Action)=>void;close:()=>void;returnToTeam:()=>void;busy:boolean;
}){
  const containerRef=useRef<HTMLDivElement|null>(null);
  const ctrlRef=useRef<GraphicsController|null>(null);
  const latestRef=useRef({fighters:[] as BattleFighter[],log:[] as BattleLog[]});
  const [renderStatus,setRenderStatus]=useState<"loading"|"ready"|"unsupported"|"error">("loading");
  const [errorDetail,setErrorDetail]=useState("");
  const [lite,setLite]=useState(()=>/Android|iPhone|Mobile/i.test(navigator.userAgent));
  const [cameraMode,setCameraMode]=useState(0);
  const [wolfPreview,setWolfPreview]=useState(false);
  const [lastStrike,setLastStrike]=useState<{text:string;amount?:number;kind:string;count:number}|null>(null);
  const onActionRef=useRef((event:BattleLog)=>{setLastStrike({text:event.text,amount:event.amount,kind:event.kind,count:Date.now()});});
  const battle=expedition.battle;
  const fighters=battle.combat?.fighters||battle.fighters||[];
  const live=battle.status==="active"&&!!battle.combat;
  const logs=battle.log;
  latestRef.current={fighters,log:logs};
  useEffect(()=>{ctrlRef.current?.sync(fighters,logs);},[fighters,logs,logs.length]);
  useEffect(()=>{ctrlRef.current?.setLite(lite);},[lite]);
  useEffect(()=>{ctrlRef.current?.setCamera(cameraMode);},[cameraMode]);
  useEffect(()=>{ctrlRef.current?.setPreview(wolfPreview);},[wolfPreview]);

  useEffect(()=>{
    const host=containerRef.current;
    if(!host)return;
    const canvasHost:HTMLDivElement=host;
    let renderer:THREE.WebGLRenderer;
    try{
      renderer=new THREE.WebGLRenderer({antialias:!lite,alpha:false,powerPreference:"low-power",stencil:false});
    }catch(err){
      setRenderStatus("unsupported");setErrorDetail(err instanceof Error?err.message:"Este aparelho não disponibilizou WebGL.");
      return;
    }
    let disposed=false,raf=0,lastFrame=0,mode=0,low=lite;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x070d17);scene.fog=new THREE.FogExp2(0x0d1422,.047);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,low?1.2:1.5));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
    renderer.shadowMap.enabled=!low;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("aria-label","Cena tridimensional real da batalha atual. Arraste para girar a câmera.");
    host.appendChild(renderer.domElement);
    const camera=new THREE.PerspectiveCamera(42,1,.1,90);
    camera.position.set(6.4,6.4,10.7);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.target.set(0,1.25,0);controls.enableDamping=true;controls.dampingFactor=.075;
    controls.enablePan=false;controls.minDistance=7.3;controls.maxDistance=16;
    controls.minPolarAngle=.47;controls.maxPolarAngle=1.44;
    const hemi=new THREE.HemisphereLight(0xc5dcff,0x31200f,2.1);scene.add(hemi);
    const moon=new THREE.DirectionalLight(0x9cbfff,3.3);
    moon.position.set(-5,11,2);moon.castShadow=!low;
    moon.shadow.mapSize.set(512,512);moon.shadow.camera.left=-11;moon.shadow.camera.right=11;
    moon.shadow.camera.top=11;moon.shadow.camera.bottom=-11;moon.shadow.bias=-.0003;scene.add(moon);
    const rim=new THREE.DirectionalLight(0xf4a25a,2.0);rim.position.set(5,6,-6);scene.add(rim);
    const floorMaterial=new THREE.MeshStandardMaterial({color:0x3f444a,metalness:.04,roughness:.93});
    const mainFloor=new THREE.Mesh(new THREE.CylinderGeometry(6.9,7.25,.38,24),floorMaterial);
    mainFloor.position.y=-.24;mainFloor.receiveShadow=true;scene.add(mainFloor);
    const tileGeo=new THREE.BoxGeometry(.9,.055,.85),tileMat=new THREE.MeshStandardMaterial({color:0x5c6064,roughness:1});
    const tiles=new THREE.InstancedMesh(tileGeo,tileMat,90);
    const instance=new THREE.Object3D();let count=0;
    for(let x=-4;x<=4;x++)for(let z=-4;z<=5;z++){
      const px=x*.98,pz=z*.84;if(px*px+pz*pz>35)continue;
      instance.position.set(px,.012+(x+z)%3*.004,pz);
      instance.rotation.y=((x*11+z*7)%5)*.013;
      instance.updateMatrix();tiles.setMatrixAt(count++,instance.matrix);
    }
    tiles.count=count;tiles.receiveShadow=true;scene.add(tiles);
    const lines=new THREE.Group();const edgeMat=new THREE.MeshStandardMaterial({color:0x96724f,metalness:.34,roughness:.67});
    for(let i=0;i<12;i++){
      const angle=i*Math.PI/6;
      const stone=new THREE.Mesh(new THREE.BoxGeometry(.4,.18,.95),edgeMat);
      stone.position.set(Math.sin(angle)*6.1,.04,Math.cos(angle)*6.1);
      stone.rotation.y=angle;lines.add(stone);
    }
    scene.add(lines);
    const lights:THREE.PointLight[]=[];
    for(const x of [-5.4,5.4])for(const z of [-3.9,2.2])createTorch(scene,new THREE.Vector3(x,0,z),lights);

    let active=true;
    const actors=new Map<string,RenderActor>();
    // Exibição independente para verificar o modelo, sem modificar a missão.
    const wolfViewer=createWolf3D();
    wolfViewer.model.position.set(0,.04,-.15);
    wolfViewer.model.scale.multiplyScalar(1.55);
    wolfViewer.model.visible=false;
    scene.add(wolfViewer.model);
    let showingPreview=false;
    const setPreview=(value:boolean)=>{
      showingPreview=value;
      wolfViewer.model.visible=value;
      for(const actor of actors.values())actor.root.visible=!value;
    };
    let lastLog:BattleLog[]=[];
    let moment=0;
    let effectTime=0;
    const effectGroup=new THREE.Group();scene.add(effectGroup);
    let focus:THREE.Vector3|null=null;
    const clock=new THREE.Clock();
    const loader=new GLTFLoader();
    const models=new Map<string,Awaited<ReturnType<GLTFLoader["loadAsync"]>>>();
    const load=(name:string)=>loader.loadAsync(MODELS+name+".glb").then(glb=>{models.set(name,glb);});
    const home=(type:number)=>type===1?new THREE.Vector3(11.4,5.1,1.7):type===2?new THREE.Vector3(-5.2,8.5,8.3):new THREE.Vector3(6.4,6.4,10.7);
    const setCamera=(v:number)=>{mode=v;camera.position.copy(home(v));controls.target.set(0,1.25,0);controls.update();};
    const setLite=(value:boolean)=>{low=value;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,value?1:1.5));renderer.shadowMap.enabled=!value;moon.castShadow=!value;resize();};
    function resize(){
      const w=Math.max(240,canvasHost.clientWidth),h=Math.max(240,canvasHost.clientHeight);
      renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<480?54:42;camera.updateProjectionMatrix();
    }
    const observer=new ResizeObserver(resize);observer.observe(host);resize();
    function visibleEffect(start:THREE.Vector3,end:THREE.Vector3,healing:boolean,critical:boolean){
      effectGroup.clear();
      const color=healing?0x53ffa4:critical?0xffc05b:0x70c6ff;
      const dir=end.clone().sub(start),length=dir.length();
      if(length<.1)return;
      const shot=new THREE.Mesh(new THREE.CylinderGeometry(.055,.085,length,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85}));
      shot.position.copy(start).addScaledVector(dir,.5);shot.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
      effectGroup.add(shot);effectTime=.20;
      const spark=new THREE.Mesh(new THREE.SphereGeometry(.19,10,7),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8}));
      spark.position.copy(end);effectGroup.add(spark);
    }
    function animateEntry(log:BattleLog){
      const actor=log.actorId?actors.get(log.actorId):undefined;
      const target=log.targetId?actors.get(log.targetId):undefined;
      if(!actor)return;
      const healing=log.kind==="heal";
      const ranged=healing || ["mage","healer","ranger","necromancer","druid","bard"].includes(
        latestRef.current.fighters.find(f=>f.id===actor.id)?.class||"");
      const style=healing?"cast":ranged?(log.kind==="ability"?"cast":"ranged"):"melee";
      playClip(actor,style);
      actor.kind=style;actor.actionStart=moment;actor.actionDuration=.86;
      if(target&&target!==actor){
        actor.attackTarget=target.pose.clone();
        actor.root.lookAt(target.pose.x,actor.root.position.y,target.pose.z);
      }
      if(target){
        if(log.amount!==undefined&&log.amount>0){
          if(log.kind==="fall"||log.targetHp===0)playClip(target,"death");
          else playClip(target,healing?"cast":"hit");
        }
        if(healing||ranged||log.kind==="ability")visibleEffect(
          actor.pose.clone().add(new THREE.Vector3(0,1.5,0)),
          target.pose.clone().add(new THREE.Vector3(0,1.2,0)),healing,log.kind==="critical");
      }
      if(log.kind==="critical"&&target)focus=target.pose.clone();
    }
    function sync(next:BattleFighter[],log:BattleLog[]){
      for(const f of next){
        const actor=actors.get(f.id);
        if(!actor)continue;
        if(actor.hp>0&&f.hp<=0)playClip(actor,"death");
        actor.hp=f.hp;
      }
      if(log.length<lastLog.length)lastLog=[];
      const latest=actionFromRealLog(lastLog,log);
      lastLog=log.slice();
      if(latest)animateEntry(latest);
    }
    ctrlRef.current={sync,setCamera,setLite,setPreview};
    setPreview(wolfPreview);
    // GLTF animados realmente executam seus próprios clips de esqueleto.
    void (async()=>{
      try{
        await Promise.all(NAMES.map(load));
        if(disposed)return;
        const all=latestRef.current.fighters;
        const groups:[BattleFighter[],number][]=[
          [all.filter(x=>x.side==="hero"),2.1],
          [all.filter(x=>x.side==="enemy"),-2.1]
        ];
        for(const [members,z] of groups){
          for(let i=0;i<members.length;i++){
            const f=members[i],glb=models.get(chooseModel(f));
            if(!glb&&!isWolf(f))continue;
            const root=new THREE.Group();
            const wolf=isWolf(f)?createWolf3D():undefined;
            const figure=wolf?wolf.model:cloneSkinned(glb!.scene);
            if(!wolf)modelBox(figure,1.9);
            figure.traverse(node=>{
              if((node as THREE.Mesh).isMesh){
                (node as THREE.Mesh).castShadow=!low;
                (node as THREE.Mesh).receiveShadow=false;
                (node as THREE.Mesh).frustumCulled=false;
              }
            });
            root.position.set(actorSpacing(i,members.length),.07,z);
            root.rotation.y=f.side==="hero"?Math.PI:0;
            root.visible=!showingPreview;
            root.add(figure);scene.add(root);
            const mixer=new THREE.AnimationMixer(figure);
            const actor:RenderActor={id:f.id,side:f.side,root,figure,mixer,clips:glb?.animations||[],wolf,pose:root.position.clone(),hp:f.hp,actionStart:-100,actionDuration:1.05,wolfDeathStart:f.hp<=0?-2:undefined};
            actors.set(f.id,actor);playClip(actor,f.hp>0?"idle":"death");
            // Aura rasteira: separa visualmente as facções sem fotos/HTML.
            const ring=new THREE.Mesh(new THREE.TorusGeometry(.58,.024,5,22),
              new THREE.MeshBasicMaterial({color:f.side==="hero"?0x5ebfff:0xc85d47,transparent:true,opacity:.65}));
            ring.rotation.x=-Math.PI/2;ring.position.y=.055;root.add(ring);
          }
        }
        for(const name of ["dungeon_pillar","dungeon_wall"]){
          const glb=models.get(name);if(!glb)continue;
          const count=name==="dungeon_pillar"?4:2;
          for(let i=0;i<count;i++){
            const obj=glb.scene.clone(true);
            modelBox(obj,name==="dungeon_pillar"?4:3);
            obj.position.set(name==="dungeon_pillar"?(i%2?5.5:-5.5):(i===0?-4:4),0,
              name==="dungeon_pillar"?(i<2?-3.3:3.3):-5);
            obj.rotation.y=i*Math.PI/2;scene.add(obj);
          }
        }
        sync(latestRef.current.fighters,latestRef.current.log);
        if(!disposed)setRenderStatus("ready");
      }catch(error){
        if(!disposed){setErrorDetail(error instanceof Error?error.message:"Falha na carga dos modelos GLB.");setRenderStatus("error");}
      }
    })();
    const render=(stamp:number)=>{
      if(disposed)return;
      raf=requestAnimationFrame(render);
      if(!active||document.hidden)return;
      const elapsed=stamp-lastFrame,targetMs=low?1000/28:1000/45;
      if(elapsed<targetMs)return;
      lastFrame=stamp;
      const dt=Math.min(.05,clock.getDelta());moment+=dt;
      for(const actor of actors.values()){
        actor.mixer.update(dt);
        const u=(moment-actor.actionStart)/actor.actionDuration;
        if(u>=0&&u<1&&actor.attackTarget&&actor.kind==="melee"){
          const distance=Math.min(1.5,actor.pose.distanceTo(actor.attackTarget)*.52);
          const offset=actor.attackTarget.clone().sub(actor.pose).setY(0).normalize().multiplyScalar(distance*Math.sin(Math.PI*u));
          actor.root.position.copy(actor.pose).add(offset);
        }else{
          actor.root.position.copy(actor.pose);
          if(u>=1&&u<2&&actor.hp>0){playClip(actor,"idle");actor.actionStart=-100;}
        }
      }
      for(const light of lights)light.intensity=7+Math.sin(moment*7+light.position.x)*1.5;
      if(effectTime>0){effectTime-=dt;effectGroup.scale.setScalar(1+Math.max(0,.2-effectTime)*1.6);if(effectTime<=0){effectGroup.clear();effectGroup.scale.setScalar(1);}}
      if(focus){controls.target.lerp(new THREE.Vector3(focus.x*.14,1.15,focus.z*.10),dt*4);if(moment>0)focus=null;}
      controls.update();
      renderer.render(scene,camera);
    };
    raf=requestAnimationFrame(render);
    const visibility=()=>{active=!document.hidden;if(active)clock.getDelta();};
    document.addEventListener("visibilitychange",visibility);
    return ()=>{
      disposed=true;cancelAnimationFrame(raf);observer.disconnect();
      document.removeEventListener("visibilitychange",visibility);ctrlRef.current=null;
      controls.dispose();
      for(const actor of actors.values())actor.mixer.stopAllAction();
      scene.traverse(o=>{
        const mesh=o as THREE.Mesh;
        if(mesh.isMesh){
          mesh.geometry.dispose();
          const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
          for(const m of mats)if(m)m.dispose();
        }
      });
      renderer.dispose();renderer.domElement.remove();
    };
  // A cena é única enquanto o jogador acompanha a mesma expedição.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[expedition.id]);
  const human=fighters.filter(f=>f.side==="hero"),enemies=fighters.filter(f=>f.side==="enemy");
  const recent=logs.slice(-3).reverse();
  return <section className="arena-3d-shell battle-sheet" aria-label="Arena Tridimensional de combate real">
    <header className="arena-3d-head">
      <button onClick={close} type="button"><ArrowLeft size={16}/> Tela clássica</button>
      <strong><Box size={18}/> ARENA 3D <small>BETA</small></strong>
      <button onClick={returnToTeam} type="button"><ChevronRight size={16}/> Equipe</button>
    </header>
    <div className="arena-3d-title"><span>MISSÃO REAL · RODADA {battle.rounds}</span><h2>{battle.title}</h2></div>
    <div className="arena-3d-stage" ref={containerRef} aria-label="Gráficos 3D interativos: arraste na tela para girar a câmera">
      {renderStatus!=="ready"&&<div className="arena-3d-loading" role="status">
        <Box size={26}/>
        <strong>{renderStatus==="loading"?"Carregando modelos 3D e animações…":renderStatus==="unsupported"?"WebGL indisponível neste aparelho":"Erro na arena 3D"}</strong>
        {renderStatus!=="loading"&&<p>{errorDetail}</p>}
        {renderStatus!=="loading"&&<button onClick={close}>Voltar à batalha clássica</button>}
      </div>}
      <div className="arena-3d-stage-caption">ARRASTE PARA GIRAR · PINÇA PARA ZOOM</div>
    </div>
    <div className="arena-3d-toolbar">
      <button onClick={()=>setCameraMode(v=>(v+1)%3)}><Camera size={16}/> Mudar câmera</button>
      <button onClick={()=>setLite(v=>!v)}><Zap size={16}/> {lite?"Modo leve ligado":"Gráficos completos"}</button>
    </div>
    <div className="arena-3d-units" aria-label="Vida real dos combatentes">
      {[human,enemies].map((side,i)=><div className="arena-3d-side" key={i}>
        <strong>{i===0?"SUA GUILDA":"INIMIGOS"}</strong>
        {side.map(f=><div key={f.id} className="arena-3d-unit" data-dead={f.hp<=0}>
          <span>{f.name}</span><div className="arena-3d-life"><i style={{width:(f.maxHp?Math.max(0,f.hp/f.maxHp*100):0)+"%"}}/></div>
          <small>{Math.max(0,f.hp)}/{f.maxHp}</small>
        </div>)}
      </div>)}
    </div>
    <div className="arena-3d-story" aria-live="polite">
      <strong><Swords size={15}/> {live?"BATALHA REAL AO VIVO":battle.won?"VITÓRIA":"BATALHA ENCERRADA"}</strong>
      {recent.map((l,i)=><p key={logs.length-i}>{l.text}</p>)}
      {!recent.length&&<p>Os combatentes assumem suas posições.</p>}
    </div>
    <div className="arena-3d-actions">
      <button className="action-button battle-return-team" onClick={returnToTeam}><ArrowLeft size={16}/> Voltar à seleção de heróis</button>
      {live&&<><button className="action-button blue" disabled={busy} onClick={()=>act({type:"battle-auto",expeditionId:expedition.id})}><FastForward size={16}/> Pular para resultado</button>
      <button className="action-button red" disabled={busy} onClick={()=>act({type:"battle-retreat",expeditionId:expedition.id})}><Shield size={16}/> Retirar equipe</button></>}
      {!live&&<button className="action-button green" onClick={returnToTeam}>Voltar à equipe</button>}
    </div>
    <p className="arena-3d-note">Modelos 3D animados e iluminação WebGL. Os números vêm exclusivamente do motor real da expedição. Visual estilizado em evolução, ainda não fotorrealista. Arquivos armazenados offline após a atualização.</p>
  </section>;
}
