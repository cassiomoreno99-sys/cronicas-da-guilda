import * as THREE from "three";

/** Um lobo sombrio 3D REAL: geometria, armadura, quatro patas articuladas e animação
 * calculada por frame. Não é uma foto, sprite, vídeo ou retrato girado.
 * A animação é apenas visual. Vida/dano/vitória vêm do motor da expedição. */
export type WolfMove="idle"|"run"|"attack"|"hit"|"death";
export type Wolf3D={
  model:THREE.Group;
  animate:(seconds:number,move:WolfMove,progress:number)=>void;
};
export function createWolf3D():Wolf3D {
  const model=new THREE.Group();
  const body=new THREE.Group();model.add(body);
  const coat=new THREE.MeshStandardMaterial({color:0x14171d,roughness:.93,metalness:.03,flatShading:true});
  const fur=new THREE.MeshStandardMaterial({color:0x25252b,roughness:.95,flatShading:true});
  const shadow=new THREE.MeshStandardMaterial({color:0x0a0d13,roughness:.9,flatShading:true});
  const iron=new THREE.MeshStandardMaterial({color:0x505663,roughness:.33,metalness:.82,flatShading:true});
  const edge=new THREE.MeshStandardMaterial({color:0x8c9aab,metalness:.83,roughness:.25,flatShading:true});
  const obsidian=new THREE.MeshStandardMaterial({color:0x291b25,metalness:.45,roughness:.38,emissive:0x4a0a10,emissiveIntensity:.4});
  const ember=new THREE.MeshStandardMaterial({color:0xed2539,emissive:0xe90019,emissiveIntensity:2.5,roughness:.23});
  const fang=new THREE.MeshStandardMaterial({color:0xdccbbe,metalness:.12,roughness:.5});
  function orb(parent:THREE.Object3D,mat:THREE.Material,pos:[number,number,number],size:[number,number,number],detail=1){
    const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(1,detail),mat);
    mesh.position.set(...pos);mesh.scale.set(...size);mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  function armor(parent:THREE.Object3D,pos:[number,number,number],size:[number,number,number],angle=0){
    const shell=orb(parent,iron,pos,size,0);shell.rotation.z=angle;return shell;
  }
  function spike(parent:THREE.Object3D,x:number,y:number,z:number,r=.10,h=.30,color=edge){
    const mesh=new THREE.Mesh(new THREE.ConeGeometry(r,h,5),color);
    mesh.position.set(x,y,z);mesh.rotation.z=(x>0?-.3:.3);mesh.rotation.x=-.15;mesh.castShadow=true;parent.add(mesh);return mesh;
  }
  const torso=orb(body,coat,[0,1.19,-.12],[.66,.63,1.13],2);
  const ribs=orb(body,fur,[0,1.37,.17],[.72,.60,.60],1);
  orb(body,coat,[0,1.22,-.95],[.55,.56,.5],1);
  orb(body,shadow,[0,.98,.43],[.49,.36,.65],1);
  // Peitoral de metal, placas angulares e crista de espinhos.
  const breast=armor(body,[0,1.28,.53],[.59,.39,.40]);breast.rotation.x=-.16;
  for(let z=-.85;z<=.45;z+=.33){
    spike(body,0,1.83+(z<0?-.08:0),z,.11,.34,obsidian);
    for(const sign of [-1,1]){
      armor(body,[sign*.56,1.47,z],[.16,.22,.27],sign*.25);
      spike(body,sign*.62,1.70,z,.07,.21);
    }
  }
  // Correntes, brilho vermelho que atravessa a armadura.
  for(let side of [-1,1]){
    const streak=orb(body,obsidian,[side*.62,1.12,.15],[.045,.055,.48],0);streak.rotation.y=side*.08;
    for(let z=-.48;z<=.37;z+=.34)orb(body,ember,[side*.68,1.22,z],[.045,.07,.10],0);
  }
  const neck=new THREE.Group();neck.position.set(0,1.47,.72);body.add(neck);
  orb(neck,fur,[0,.02,.14],[.50,.48,.52],1);
  const head=new THREE.Group();head.position.set(0,.19,.44);neck.add(head);
  orb(head,coat,[0,.02,.19],[.38,.38,.48],2);
  orb(head,iron,[0,.19,.31],[.34,.18,.42],0);
  for(const side of [-1,1]){
    const ear=spike(head,side*.28,.44,.07,.16,.44,coat);ear.rotation.z=side*-.25;
    const horn=spike(head,side*.26,.39,.26,.085,.26,edge);horn.rotation.z=side*.24;
    const eye=orb(head,ember,[side*.275,.10,.54],[.080,.055,.041],1);
    eye.rotation.y=side*.45;
    armor(head,[side*.31,.18,.34],[.13,.10,.31],side*.18);
  }
  orb(head,shadow,[0,-.11,.59],[.24,.17,.43],1);
  orb(head,iron,[0,.0,.73],[.20,.15,.30],0);
  const nose=orb(head,shadow,[0,-.045,.99],[.19,.10,.14],1);
  const jaw=new THREE.Group();jaw.position.set(0,-.20,.33);head.add(jaw);
  orb(jaw,shadow,[0,-.08,.48],[.29,.14,.44],1);
  for(let sign of [-1,1])for(let i=0;i<3;i++){
    const tooth=spike(jaw,sign*(.08+i*.07),-.12,.42+i*.16,.035,.16,fang);
    tooth.rotation.z=Math.PI;tooth.rotation.x=.12;
  }
  // Quatro pernas, cada uma com articulações reais do ombro/joelho e garras.
  const legs:{hip:THREE.Group;knee:THREE.Group;front:boolean;side:number}[]=[];
  for(const z of [.65,-.80])for(const side of [-1,1]){
    const hip=new THREE.Group();hip.position.set(side*.48,1.02,z);body.add(hip);
    orb(hip,z>0?fur:coat,[0,-.25,0],[.26,.39,.32],1);
    const knee=new THREE.Group();knee.position.y=-.45;hip.add(knee);
    orb(knee,coat,[0,-.22,.055],[.18,.36,.21],1);
    const paw=orb(knee,shadow,[0,-.51,.23],[.24,.15,.34],1);
    for(let j=-1;j<=1;j++){
      const claw=new THREE.Mesh(new THREE.ConeGeometry(.045,.23,5),edge);
      claw.position.set(j*.13,-.55,.49);
      claw.rotation.x=Math.PI/2;claw.castShadow=true;knee.add(claw);
    }
    armor(hip,[side*.06,-.06,.04],[.28,.22,.31],side*.25);
    spike(hip,side*.12,.10,-.12,.08,.22);
    legs.push({hip,knee,front:z>0,side});
  }
  const tailBase=new THREE.Group();tailBase.position.set(0,1.50,-1.02);body.add(tailBase);
  const tail=orb(tailBase,coat,[0,.22,-.33],[.22,.24,.59],1);tail.rotation.x=-.36;
  spike(tailBase,0,.47,-.66,.13,.32,coat);
  model.scale.setScalar(.91);
  const animate=(seconds:number,move:WolfMove,progress:number)=>{
    const t=Math.max(0,Math.min(1,progress));
    const stride=seconds*(move==="run"?12:3.2);
    const gait=move==="run"?.52:move==="idle"?.035:0;
    body.position.y=(move==="run"?Math.abs(Math.sin(stride))*.19:Math.sin(seconds*2.4)*.025);
    body.rotation.z=0;body.rotation.x=0;head.rotation.x=0;neck.rotation.x=0;
    jaw.rotation.x=.05;
    tailBase.rotation.x=Math.sin(seconds*3)*.10;
    tailBase.rotation.y=Math.sin(seconds*3.2)*.19;
    for(let i=0;i<legs.length;i++){
      const leg=legs[i];
      const offset=leg.front?0:Math.PI*.72;
      leg.hip.rotation.x=Math.sin(stride+offset+(leg.side>0?Math.PI:0))*gait;
      leg.knee.rotation.x=(move==="run"?Math.max(0,Math.cos(stride+offset+(leg.side>0?Math.PI:0)))*.50:0);
    }
    if(move==="attack"){
      const rush=Math.sin(Math.PI*t);
      body.position.y-=rush*.18;
      body.rotation.x=-rush*.25;
      neck.rotation.x=-rush*.40;
      head.rotation.x=-rush*.15;
      jaw.rotation.x=-.08-rush*.66;
      legs[0].hip.rotation.x=-rush*.58;legs[1].hip.rotation.x=-rush*.58;
      tailBase.rotation.x=rush*.32;
    }else if(move==="hit"){
      const impact=Math.sin(Math.PI*t);
      body.rotation.z=impact*.20;
      neck.rotation.x=impact*.32;head.rotation.x=impact*.30;
      body.position.y-=impact*.18;
    }else if(move==="death"){
      const down=THREE.MathUtils.smoothstep(t,0,.8);
      body.rotation.z=-down*1.26;
      body.position.y=-down*.65;
      head.rotation.x=.2;tailBase.rotation.x=-.25;
      for(const leg of legs)leg.hip.rotation.x=-down*.42;
    }else if(move==="run"){
      jaw.rotation.x=-.3;
      head.rotation.x=Math.sin(stride)*.06;
    }
    // Brilho real 3D nos olhos.
    ember.emissiveIntensity=2.0+Math.sin(seconds*5)*.4+(move==="attack"?.85:0);
  };
  animate(0,"idle",0);
  return {model,animate};
}
