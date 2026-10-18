import type {CombatStatus,StatusKind} from "./game.ts";
export type SupremeUnit={id:string;name:string;side:"hero"|"enemy";hp:number;maxHp:number;attack:number;defense:number;magic:number;statuses:CombatStatus[]};
export type SupremeContext={
 actor:SupremeUnit; heroBook:string; units:()=>SupremeUnit[]; allies:()=>SupremeUnit[]; enemies:()=>SupremeUnit[];
 missionBoss:boolean; missionUndead:boolean; targetId?:string;
 hit:(u:SupremeUnit,n:number)=>number;heal:(u:SupremeUnit,n:number)=>number;
 status:(u:SupremeUnit,kind:StatusKind,rounds:number,amount?:number)=>void;
 previousDamage:Record<string,number>; cooldowns:Record<string,number>; round:number;
 revived:string[]; mark:(text:string)=>void;
};
export function performSupreme(c:SupremeContext){
 const {actor:a,heroBook:book,allies,enemies,status,heal,hit}=c;
 const target=()=>enemies().find(x=>x.id===c.targetId)||enemies().sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];
 const harm=(e:SupremeUnit,n:number,cap=.28)=>hit(e,Math.max(1,Math.min(n,c.missionBoss?e.maxHp*cap:Infinity)));
 const clean=(u:SupremeUnit)=>{let n=2;u.statuses=u.statuses.filter(v=>["stun","bleed","poison","slow","vulnerable"].includes(v.kind)&&n-->0?false:true)};
 switch(book){
 case "CG-301":for(const u of allies()){status(u,"ward",2,.60);status(u,"shield",2,u.maxHp*.08)}status(a,"taunt",2);break;
 case "CG-302":{const t=target();if(t)for(let i=0;i<3&&t.hp>0;i++)harm(t,a.attack*1.4-t.defense*.3,.28/3);heal(a,a.maxHp*.3);status(a,"might",2,.20);break}
 case "CG-303":for(const e of enemies())harm(e,a.attack*1.90-e.defense*.35,.20);for(const u of allies())status(u,"shield",2,u.maxHp*.25);break;
 case "CG-304":for(const u of allies())status(u,"lastStand",1);break;
 case "CG-305":{const seen:Record<string,number>={};for(let i=0;i<7;i++){const e=enemies().find(x=>(seen[x.id]||0)<3);if(!e)break;seen[e.id]=(seen[e.id]||0)+1;harm(e,a.attack*.65-e.defense*.75,.24/3)}break}
 case "CG-306":status(a,"dodge",1,1);{const e=target();if(e){harm(e,a.attack*2.9-e.defense*.7,.28);status(e,"slow",2,.15)}}break;
 case "CG-307":{const e=target();if(e){const execute=e.hp<=e.maxHp*.2;for(let i=0;i<5&&e.hp>0;i++)harm(e,(a.attack*1.05-e.defense*.4)*(execute&&i===4?1.35:1),.28/5)}break}
 case "CG-308":clean(a);heal(a,a.maxHp*.35);status(a,"dodge",2,2);status(a,"riposte",2);break;
 case "CG-309":for(const e of enemies()){harm(e,a.magic*2.0-e.defense*.18,.20);status(e,"slow",2,c.missionBoss?.10:.20)}break;
 case "CG-310":for(const u of allies()){heal(u,u.maxHp*.4);clean(u)}for(const [key,v] of Object.entries(c.cooldowns))if(!key.includes(":supreme-"))c.cooldowns[key]=Math.max(c.round,v-1);break;
 case "CG-311":{
   const dead=c.units().filter(u=>u.side==="hero"&&u.hp===0&&!c.revived.includes(u.id));
   if(dead.length){const u=dead[0];c.revived.push(u.id);heal(u,u.maxHp*.45)}
   for(const u of allies()){heal(u,u.maxHp*.25);status(u,"shield",1,u.maxHp*.15)}break;
 }
 case "CG-312":for(const e of enemies())harm(e,a.magic*2.05*(c.missionUndead?1.25:1)-e.defense*.2,.22);for(const u of allies())status(u,"ward",2,.50);break;
 case "CG-313":for(const u of allies())status(u,"critBlessing",1);break;
 case "CG-314":for(const u of allies()){heal(u,Math.min(u.maxHp*.30,(c.previousDamage[u.id]||0)*.6)+u.maxHp*.15);status(u,"might",1,.25)}break;
 // Grimórios raciais Imperiais: um único uso supremo por herói em cada batalha.
 case "IMP-B-HUMAN":for(const u of allies()){status(u,"inspired",2);status(u,"ward",2,.18);status(u,"shield",2,u.maxHp*.16)}break;
 case "IMP-B-ELF":for(const e of enemies())harm(e,a.magic*1.65-e.defense*.15,.19);for(const u of allies())status(u,"regen",2,Math.round(a.magic*.17+12));break;
 case "IMP-B-DWARF":for(const u of allies()){status(u,"shield",2,u.maxHp*.32);status(u,"ward",2,.35);heal(u,u.maxHp*.08)}break;
 case "IMP-B-ORC":{const e=target();if(e)harm(e,a.attack*3-e.defense*.55,.28);status(a,"might",2,.28);break}
 case "IMP-B-BEASTKIN":for(const e of enemies())harm(e,a.attack*1.70-e.defense*.28,.19);status(a,"dodge",2,1);break;
 case "IMP-B-UMBRAL":for(const e of enemies()){harm(e,a.magic*1.75-e.defense*.20,.19);status(e,"slow",2,.16);status(e,"vulnerable",2,.10)}break;
 default:throw Error("Livro supremo não reconhecido");
 }
 c.mark("Livro supremo ativado: "+book+".");
}
