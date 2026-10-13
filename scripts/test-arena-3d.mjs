import {readFile,stat} from "node:fs/promises";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
const dir="dist/models/arena3d/";
const manifest=[
["player_swordsman","24492f0e0609708495284bdb8759b98f2bd66f49"],
["player_archer","739a7b5d6fdf6acb2127f3009e7efd32ae15a011"],
["player_priest","ce30039961ce60585e1da2928c935a42cf17ae5f"],
["enemy_swordsman","1f502e9da044af60759cac6eb24f58c916b05c6a"],
["enemy_archer","3850891479b7087df54ab0e3e767e7d5ff46230e"],
["enemy_priest","b54983c9858900bf0f5e515f6a5f5756d107a224"],
["dungeon_pillar","dfb2d0149b1ff4bcbdd33ba6ad10625031fd50ae"],
["dungeon_wall","a29e908600596824efa007f3ac279e17a933d9c6"]
];
const worker=await readFile("dist/sw.js","utf8");
let total=0;
for(const [id,sha] of manifest){
 const name=dir+id+".glb";
 const data=await readFile(name);
 total+=(await stat(name)).size;
 assert.equal(data.toString("ascii",0,4),"glTF","GLB 3D corrupto: "+id);
 assert.equal(data.readUInt32LE(4),2);
 assert.equal(data.readUInt32LE(8),data.length);
 const actual=createHash("sha1").update("blob "+data.length+"\0").update(data).digest("hex");
 assert.equal(actual,sha,"Origem do modelo modificada: "+id);
 assert.ok(worker.includes("/models/arena3d/"+id+".glb"),"Modelo ausente do modo offline: "+id);
}
assert.ok(total<5500000,"Modelos excedem orçamento para Android");
const js=(await readFile("package.json","utf8"));
assert.match(js,/three/);
console.log("ARENA 3D OFFLINE OK: "+manifest.length+" modelos genuínos GLB versionados e completos, "+(total/1048576).toFixed(2)+" MB.");
