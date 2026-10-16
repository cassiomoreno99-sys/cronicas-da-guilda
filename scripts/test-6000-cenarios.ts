import assert from "node:assert/strict";
import {mkdirSync,writeFileSync} from "node:fs";
import {newCampaign,applyAction,missions,market,availableAbilities,GameRuleError,normalizeCampaign,type Campaign,type Action} from "../lib/game.ts";
type Scenario={name:string;expect:"pass"|"reject";setup?:(s:Campaign)=>Campaign;action:(s:Campaign)=>Action};
const unchanged=(s:Campaign)=>s;
const readyBattle=(s:Campaign)=>applyAction(s,{type:"mission",missionId:missions(s)[0].id,team:s.team,tactic:"balanced",startedAt:1700000000000,expeditionSlot:1});
const readyClass=(s:Campaign)=>{s.hq.academy=1;return s};
const trained=(s:Campaign)=>applyAction(s,{type:"train-hero",heroId:s.heroes[0].id});
const rested=(s:Campaign)=>applyAction(s,{type:"rest"});
const opened=(s:Campaign)=>applyAction(readyClass(s),{type:"academy-open-class"});
const journey=(s:Campaign)=>applyAction(s,{type:"start-journey",heroId:s.heroes[0].id,duration:3});
const equipped=(s:Campaign)=>{s.chest.push({id:"audit-rx",key:"RX-HUMAN"});return applyAction(s,{type:"equip",itemId:"audit-rx",heroId:s.heroes[0].id});};
const expanded=(s:Campaign)=>{for(let i=0;i<3;i++){const h=structuredClone(s.heroes[i]);h.id="audit-recruit-"+i;h.name="Reforço QA "+i;s.heroes.push(h);}return s};
const stagedAbility=(s:Campaign)=>{
 s=readyBattle(s);
 const hero=s.expeditions[0].team.map(id=>s.heroes.find(h=>h.id===id)!).find(h=>availableAbilities(h).length>0)!;
 const ability=availableAbilities(hero)[0];
 const action:Action={type:"battle-ability",heroId:hero.id,abilityId:ability.id,expeditionId:s.expeditions[0].id,
   ...(ability.target==="enemy"?{targetId:s.expeditions[0].battle.combat!.fighters.find(f=>f.side==="enemy")!.id}:ability.target==="ally"?{targetId:hero.id}:{})};
 return applyAction(s,action);
};
const specs:Scenario[]=[
 {name:"nome válido",expect:"pass",action:s=>({type:"rename",name:"Guilda de teste "+s.rng%1000})},
 {name:"nome curto rejeitado",expect:"reject",action:()=>({type:"rename",name:"x"})},
 {name:"construir Forja",expect:"pass",action:()=>({type:"upgrade-hq",building:"forge"})},
 {name:"Forja máxima",expect:"reject",setup:s=>(s.hq.forge=10,s),action:()=>({type:"upgrade-hq",building:"forge"})},
 {name:"descanso pago",expect:"pass",action:()=>({type:"rest"})},
 {name:"descanso sem ouro",expect:"reject",setup:s=>(s.gold=7,s),action:()=>({type:"rest"})},
 {name:"descanso repetido",expect:"reject",setup:rested,action:()=>({type:"rest"})},
 {name:"treino individual",expect:"pass",action:s=>({type:"train-hero",heroId:s.heroes[0].id})},
 {name:"treino sem energia",expect:"reject",setup:s=>(s.heroes[0].energy=24,s),action:s=>({type:"train-hero",heroId:s.heroes[0].id})},
 {name:"treino repetido",expect:"reject",setup:trained,action:s=>({type:"train-hero",heroId:s.heroes[0].id})},
 {name:"treino de equipe",expect:"pass",action:s=>({type:"train",team:s.team,tactic:"balanced"})},
 {name:"abrir Academia",expect:"pass",setup:readyClass,action:()=>({type:"academy-open-class"})},
 {name:"abrir sem Academia",expect:"reject",action:()=>({type:"academy-open-class"})},
 {name:"foco Academia",expect:"pass",setup:opened,action:s=>({type:"academy-focus",candidateId:s.academy.candidates[0].id})},
 {name:"foco candidato inválido",expect:"reject",setup:opened,action:()=>({type:"academy-focus",candidateId:"ausente"})},
 {name:"matricular aprendiz",expect:"pass",setup:readyClass,action:s=>({type:"academy-trainees",heroIds:[s.heroes[0].id]})},
 {name:"aprender além vagas",expect:"reject",setup:readyClass,action:s=>({type:"academy-trainees",heroIds:s.heroes.slice(0,3).map(h=>h.id)})},
 {name:"mentor apto",expect:"pass",setup:s=>(s.heroes[0].level=5,s),action:s=>({type:"academy-mentor",heroId:s.heroes[0].id})},
 {name:"mentor iniciante",expect:"reject",action:s=>({type:"academy-mentor",heroId:s.heroes[0].id})},
 {name:"admitir formado",expect:"pass",setup:s=>{const h=structuredClone(s.heroes[0]);h.id="formado-audit";h.name="Formado QA";s.academy.reserve.push(h);return s},action:()=>({type:"academy-admit",heroId:"formado-audit"})},
 {name:"admitir ausente",expect:"reject",action:()=>({type:"academy-admit",heroId:"ausente"})},
 {name:"dispensar formado",expect:"pass",setup:s=>{const h=structuredClone(s.heroes[0]);h.id="formado-audit";s.academy.reserve.push(h);return s},action:()=>({type:"academy-dismiss",heroId:"formado-audit"})},
 {name:"dispensar ausente",expect:"reject",action:()=>({type:"academy-dismiss",heroId:"ausente"})},
 {name:"escalação Liga",expect:"pass",action:s=>({type:"league-lineup",team:s.team,tactic:"balanced"})},
 {name:"Liga menos de três",expect:"reject",action:s=>({type:"league-lineup",team:s.team.slice(0,2),tactic:"balanced"})},
 {name:"viajar região 1",expect:"pass",action:()=>({type:"travel-region",region:1})},
 {name:"viajar região bloqueada",expect:"reject",action:()=>({type:"travel-region",region:2})},
 {name:"missão iniciada",expect:"pass",action:s=>({type:"mission",missionId:missions(s)[0].id,team:s.team,tactic:"balanced"})},
 {name:"missão inexistente",expect:"reject",action:s=>({type:"mission",missionId:"fantasma",team:s.team,tactic:"balanced"})},
 {name:"contratar mercado",expect:"pass",action:s=>({type:"hire",heroId:market(s)[0].id})},
 {name:"contratar sem vagas",expect:"reject",setup:s=>{while(s.heroes.length<12){const h=structuredClone(s.heroes[0]);h.id="cheio-"+s.heroes.length;s.heroes.push(h);}return s},action:s=>({type:"hire",heroId:market(s)[0].id})},
 {name:"demitir herói",expect:"pass",action:s=>({type:"release",heroId:s.heroes[5].id})},
 {name:"demitir último quarteto",expect:"reject",setup:s=>(s.heroes=s.heroes.slice(0,4),s),action:s=>({type:"release",heroId:s.heroes[0].id})},
 {name:"confronto rival",expect:"pass",action:s=>({type:"rival-battle",guildId:s.rivals[0].id,team:s.heroes.slice(0,3).map(h=>h.id)})},
 {name:"rival sem equipe",expect:"reject",action:s=>({type:"rival-battle",guildId:s.rivals[0].id,team:["fake"]})},
 {name:"raid 3x3",expect:"pass",setup:expanded,action:s=>({type:"guild-raid",teams:[s.heroes.slice(0,3).map(h=>h.id),s.heroes.slice(3,6).map(h=>h.id),s.heroes.slice(6,9).map(h=>h.id)]})},
 {name:"raid sem 9 heróis",expect:"reject",action:s=>({type:"guild-raid",teams:[s.heroes.slice(0,3).map(h=>h.id)]})},
 {name:"resolver evento Conselho",expect:"pass",setup:s=>(s.event=newCampaign(1000).event,s),action:s=>({type:"event",eventId:s.event!.id,choiceId:"charge"})},
 {name:"Conselho evento falso",expect:"reject",action:()=>({type:"event",eventId:"naoexiste",choiceId:"charge"})},
 {name:"história de herói",expect:"pass",action:s=>({type:"story-step",heroId:s.heroes[0].id})},
 {name:"história herói ausente",expect:"reject",action:()=>({type:"story-step",heroId:"fake"})},
 {name:"viagem três dias",expect:"pass",action:s=>({type:"start-journey",heroId:s.heroes[0].id,duration:3})},
 {name:"viagem duração inválida",expect:"reject",action:s=>({type:"start-journey",heroId:s.heroes[0].id,duration:2 as 3})},
 {name:"opção acampar em viagem",expect:"pass",setup:journey,action:s=>({type:"journey-choice",journeyId:s.journeys[0].id,choice:"camp"})},
 {name:"opção viagem ausente",expect:"reject",action:()=>({type:"journey-choice",journeyId:"ausente",choice:"camp"})},
 {name:"evolução classe",expect:"pass",setup:s=>(s.heroes[0].level=8,s),action:s=>({type:"specialize",heroId:s.heroes[0].id,path:"offense"})},
 {name:"evolução sem nível",expect:"reject",action:s=>({type:"specialize",heroId:s.heroes[0].id,path:"offense"})},
 {name:"evolução racial",expect:"pass",setup:s=>(s.heroes[0].level=6,s),action:s=>({type:"racial-specialize",heroId:s.heroes[0].id,path:"heritage"})},
 {name:"racial sem nível",expect:"reject",action:s=>({type:"racial-specialize",heroId:s.heroes[0].id,path:"heritage"})},
 {name:"salvar esquadrão",expect:"pass",action:s=>({type:"save-squad",specialty:"hunt",name:"Equipe Verde",team:s.team,tactic:"balanced"})},
 {name:"esquadrão curto",expect:"reject",action:s=>({type:"save-squad",specialty:"hunt",name:"Equipe",team:s.team.slice(0,2),tactic:"balanced"})},
 {name:"renomear esquadrão",expect:"pass",action:()=>({type:"rename-squad",specialty:"hunt",name:"Caçadores Novos"})},
 {name:"renomear vazio",expect:"reject",action:()=>({type:"rename-squad",specialty:"hunt",name:"a"})},
 {name:"equipar relíquia",expect:"pass",setup:s=>(s.chest.push({id:"audit-rx",key:"RX-HUMAN"}),s),action:s=>({type:"equip",itemId:"audit-rx",heroId:s.heroes[0].id})},
 {name:"equipar item ausente",expect:"reject",action:s=>({type:"equip",itemId:"sem-item",heroId:s.heroes[0].id})},
 {name:"desequipar relíquia",expect:"pass",setup:equipped,action:()=>({type:"unequip",itemId:"audit-rx"})},
 {name:"desequipar ausente",expect:"reject",action:()=>({type:"unequip",itemId:"ausente"})},
 {name:"arsenal aprimorar",expect:"pass",action:()=>({type:"upgrade"})},
 {name:"arsenal nível máximo",expect:"reject",setup:s=>(s.arsenal=3,s),action:()=>({type:"upgrade"})},
 {name:"foco em batalha",expect:"pass",setup:readyBattle,action:s=>({type:"battle-focus",expeditionId:s.expeditions[0].id,targetId:s.expeditions[0].battle.combat!.fighters.find(f=>f.side==="enemy")!.id})},
 {name:"foco em inimigo falso",expect:"reject",setup:readyBattle,action:s=>({type:"battle-focus",expeditionId:s.expeditions[0].id,targetId:"fantasma"})},
 {name:"habilidade manual",expect:"pass",setup:readyBattle,action:s=>({type:"battle-auto-abilities",expeditionId:s.expeditions[0].id,enabled:false})},
 {name:"habilidade modo inválido",expect:"reject",setup:readyBattle,action:s=>({type:"battle-auto-abilities",expeditionId:s.expeditions[0].id,enabled:1 as unknown as boolean})},
 {name:"cancelar habilidade",expect:"pass",setup:stagedAbility,action:s=>({type:"battle-cancel-ability",expeditionId:s.expeditions[0].id,heroId:s.expeditions[0].battle.combat!.pendingAbilities[0].heroId})},
 {name:"cancelar sem ordem",expect:"reject",setup:readyBattle,action:s=>({type:"battle-cancel-ability",expeditionId:s.expeditions[0].id,heroId:s.expeditions[0].team[0]})},
 {name:"atacar uma ação",expect:"pass",setup:readyBattle,action:s=>({type:"battle-round",expeditionId:s.expeditions[0].id})},
 {name:"abandonar expedição",expect:"pass",setup:readyBattle,action:s=>({type:"battle-retreat",expeditionId:s.expeditions[0].id})},
 {name:"pular resultado",expect:"pass",setup:readyBattle,action:s=>({type:"battle-auto",expeditionId:s.expeditions[0].id})},
 {name:"pular sem batalha",expect:"reject",action:()=>({type:"battle-auto"})},
 {name:"vender item inexistente",expect:"reject",action:()=>({type:"sell",itemId:"ausente"})},
 {name:"receita inexistente",expect:"reject",action:()=>({type:"craft",recipeId:"fantasma"})},
 {name:"usar consumível ausente",expect:"reject",action:s=>({type:"use-item",itemId:"ausente",heroId:s.heroes[0].id})},
 {name:"potência sem batalha",expect:"reject",action:()=>({type:"battle-tactic",tactic:"defensive"})},
 {name:"passar dia",expect:"pass",action:()=>({type:"next-day"})},
 {name:"acessar zona sem região",expect:"reject",action:()=>({type:"travel-region",region:13})},
];
const seedCount=100;
let ok=0,blocked=0,otherFailures=0;
const tally:Record<string,{ok:number;blocked:number}>={};
const started=Date.now();
const failSamples:Array<{seed:number;scenario:string;message:string}>=[];
for(let seed=0;seed<seedCount;seed++){
 const base=newCampaign(88100+seed*173);base.gold=1000000;base.event=null;
 for(const spec of specs){
   let s=structuredClone(base);
   try{
     s=spec.setup?spec.setup(s):unchanged(s);
     const action=spec.action(s);
     const old=JSON.stringify(s);
     let result:Campaign|undefined,error:unknown;
     try{result=applyAction(s,action);}catch(e){error=e;}
     if(spec.expect==="pass"){
       if(error)throw new Error("Ação válida falhou: "+(error instanceof Error?error.message:String(error)));
       assert.ok(result,"Ação não retornou campanha");
       assert.equal(result.schema,1);
       assert.ok(Number.isFinite(result.gold)&&result.gold>=0,"Ouro negativo");
       assert.ok(Number.isFinite(result.fame)&&result.fame>=0,"Renome negativo");
       assert.ok(result.heroes.length>=4&&result.heroes.length<=12,"Elenco inválido");
       assert.equal(new Set(result.heroes.map(h=>h.id)).size,result.heroes.length,"IDs de heróis duplicados");
       assert.equal(result.rivals.length,99,"Rivais desapareceram");
       assert.equal(JSON.stringify(s),old,"Mutação no objeto da campanha original");
       ok++;
     }else{
       if(!error)throw new Error("Ação inválida foi aceita e alterou a campanha");
       if(!(error instanceof GameRuleError))throw new Error("Erro técnico em vez de regra: "+(error instanceof Error?error.stack:String(error)));
       assert.equal(JSON.stringify(s),old,"Uma ação rejeitada alterou dados da campanha");
       blocked++;
     }
     (tally[spec.name]??={ok:0,blocked:0})[spec.expect==="pass"?"ok":"blocked"]++;
   }catch(e){
     otherFailures++;failSamples.push({seed,scenario:spec.name,message:e instanceof Error?(e.stack||e.message):String(e)});
     if(failSamples.length<=15)console.error("ERRO seed="+seed+" cenário="+spec.name+": "+failSamples.at(-1)!.message);
     if(otherFailures>=15)break;
   }
 }
 if(otherFailures>=15)break;
 if((seed+1)%20===0)console.log("CENÁRIOS "+(seed+1)+"/"+seedCount+": "+(ok+blocked)+" executados, falhas="+otherFailures);
}
const report={passed:otherFailures===0,seedCount,specifications:specs.length,scenarioExecutions:ok+blocked+otherFailures,validActions:ok,rejectedInvalidActions:blocked,failures:otherFailures,failSamples,tally,elapsedMs:Date.now()-started};
mkdirSync("qa-report",{recursive:true});writeFileSync("qa-report/acoes-combinatorias.json",JSON.stringify(report,null,2));
console.log("RELATÓRIO COMBINATÓRIO:",JSON.stringify({...report,tally:Object.keys(tally).length,failSamples:failSamples.length}));
assert.ok(specs.length*seedCount>5000,"Menos de cinco mil cenários programados");
assert.equal(otherFailures,0,"Foram encontrados erros; veja qa-report/acoes-combinatorias.json");
assert.equal(ok+blocked,specs.length*seedCount);
