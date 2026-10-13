import {newCampaign,applyAction,missions,normalizeCampaign,heroStats,type Campaign} from "../lib/game.ts";
import {CATALOG_ITEMS,CATALOG_BY_ID,testShop} from "../lib/catalog-test.ts";
import {awardCatalogLoot,questMissionIndex,missionLootPreview} from "../lib/catalog-runtime.ts";
const ok=(v:unknown,msg:string)=>{if(!v)throw Error(msg)};
const blocked=(fn:()=>unknown,msg:string)=>{let failed=false;try{fn()}catch{failed=true}ok(failed,msg)};
const quest=CATALOG_ITEMS.filter(d=>d.categoria==="Outros"&&d.preco_compra===null);
ok(quest.length===20,"Catalogo precisa conter os 20 itens de missao/evento");
for(const d of quest){
 const ix=questMissionIndex(d.id,d.regiao);
 ok(ix>=0&&ix<6,"A missao exclusiva nao foi associada: "+d.id);
 const s=newCampaign(31201);s.activeRegion=1;s.claimedQuestItems=[];
 const m={...missions(s)[0],id:"mission-111-0-"+ix,location:d.regiao,kind:"dungeon" as const};
 ok(missionLootPreview(s,m).includes(d.nome),"Missao nao anuncia o item: "+d.id);
 const found=awardCatalogLoot(s,m);
 ok(found.includes(d.id)&&s.chest.some(i=>i.key===d.id),"Item de missao nao foi entregue: "+d.id);
 ok(!awardCatalogLoot(s,m).includes(d.id),"Item de missao duplicado: "+d.id);
 ok(!testShop(s).some(v=>v.id===d.id),"Objeto exclusivo foi para o mercador: "+d.id);
 blocked(()=>applyAction(s,{type:"sell",itemId:s.chest.find(i=>i.key===d.id)!.id}),"Item vinculado pode ser vendido: "+d.id);
 const reloaded=normalizeCampaign(s);
 ok(!awardCatalogLoot(reloaded,m).includes(d.id),"Item repetido depois de salvar: "+d.id);
}
const bookItems=CATALOG_ITEMS.filter(d=>d.categoria==="Livro de magia suprema");
ok(bookItems.length===14,"Sao necessarios catorze livros");
const names:Record<string,string>={"warrior":"Guerreiro","paladin":"Cavaleiro","ranger":"Arqueiro","rogue":"Assassino","mage":"Mago","healer":"Sacerdote","bard":"Pierrô"};
for(const b of bookItems){
 ok(b.materiais?.length===2,"Receita do livro incompleta "+b.id);
 ok(b.materiais?.every(m=>CATALOG_BY_ID[m.id]?.categoria==="Materiais"),"Ingrediente inexistente para "+b.id);
 ok(!newCampaign(11).chest.some(x=>x.key===b.id),"Livro supremo entregue no inicio");
 let s=newCampaign(30281);
 let h=s.heroes.find(x=>names[x.class]===b.classes[0]);
 if(!h){h=s.heroes[0];h.class=Object.keys(names).find(c=>names[c]===b.classes[0]) as typeof h.class;}
 h.level=50;h.storyStage=3;h.talent={path:"offense",rank:1};
 s.hq.library=3;s.gold=1000000;s.bossSeasons=[s.season];
 let id=0;for(const m of b.materiais||[])for(let n=0;n<m.quantidade;n++)s.chest.push({id:"item-"+(++id),key:m.id});s.itemSequence=id;
 const initial=s.gold;
 s=applyAction(s,{type:"scribe-book",bookId:b.id,heroId:h.id});
 ok(s.chest.filter(x=>x.key===b.id).length===1,"Transcricao nao adicionou o livro "+b.id);
 ok(s.gold<initial,"Transcricao gratuita "+b.id);
 blocked(()=>applyAction(s,{type:"scribe-book",bookId:b.id,heroId:h.id}),"Transcricao duplicada sem materiais: "+b.id);
 const owned=s.chest.find(x=>x.key===b.id)!;
 s=applyAction(s,{type:"learn-book",itemId:owned.id,heroId:h.id});
 ok(s.heroes.find(x=>x.id===h.id)?.supremeBook===b.id,"Livro nao aprendido por classe: "+b.id);
 ok(!s.chest.some(x=>x.id===owned.id),"Livro aprendido nao consumido: "+b.id);
 s=applyAction(s,{type:"reset-specialization",heroId:h.id});
 ok(s.heroes.find(x=>x.id===h.id)?.supremeRespecced,"Correcao de especializacao falhou "+b.id);
 blocked(()=>applyAction(s,{type:"reset-specialization",heroId:h.id}),"Correcao repetida: "+b.id);
 s=normalizeCampaign(s);
 ok(s.heroes.find(x=>x.id===h.id)?.supremeBook===b.id,"Aprendizado desapareceu apos salvar");
}
{
 let s=newCampaign(30301);s.event=null;
 const heroes=s.heroes.slice(0,4);
 heroes.forEach(h=>{h.level=50;h.attack=300;h.magic=300;h.defense=300;h.energy=100;});
 heroes[0].supremeBook="CG-302";
 const active=missions(s)[0];
 s=applyAction(s,{type:"mission",missionId:active.id,team:heroes.map(h=>h.id),tactic:"balanced"});
 const exp=s.expeditions.at(-1)!;
 s=applyAction(s,{type:"battle-ability",heroId:heroes[0].id,abilityId:"supreme-CG-302",expeditionId:exp.id});
 let activated=false;
 for(let tick=0;tick<20;tick++){
  const current=s.expeditions.find(e=>e.id===exp.id)!.battle;
  if(current.status!=="active")break;
  s=applyAction(s,{type:"battle-round",expeditionId:exp.id});
  if(s.expeditions.find(e=>e.id===exp.id)!.battle.log.some(x=>x.text.includes("Livro supremo ativado: CG-302"))){activated=true;break;}
 }
 ok(activated,"Livro nao executado quando chegou o turno do heroi.");
 blocked(()=>applyAction(s,{type:"battle-ability",heroId:heroes[0].id,abilityId:"supreme-CG-302",expeditionId:exp.id}),"Livro ativado mais de uma vez");
}
console.log("INTEGRACAO-314: itens unicos, missoes, receitas, aprendizado, respec, backup e habilidades OK");

{
 let s=newCampaign(9041);s.event=null;s.heroes[0].level=50;s.heroes[0].energy=40;
 s.chest=[{id:"item-1",key:"CG-010"},{id:"item-2",key:"CG-011"}];s.itemSequence=2;
 s=applyAction(s,{type:"use-item",itemId:"item-1",heroId:s.heroes[0].id});
 ok(s.heroes[0].energy===50,"Poção de energia não recuperou 10 pontos");
 s=applyAction(s,{type:"use-item",itemId:"item-2",heroId:s.heroes[0].id});
 ok((s.heroes[0].nextMissionBoost||0)>.04,"Elixir de apoio não concede bônus da próxima missão");
 blocked(()=>applyAction(s,{type:"use-item",itemId:"item-2",heroId:s.heroes[0].id}),"Consumo de item inexistente autorizado");
}
{
 let s=newCampaign(9042);s.event=null;
 const team=s.heroes.slice(0,4);for(const h of team){h.level=50;h.energy=100;h.attack=15;h.defense=200;h.magic=18;}
 s.chest=[{id:"item-1",key:"CG-009"},{id:"item-2",key:"CG-009"},{id:"item-3",key:"CG-009"},{id:"item-4",key:"CG-095"}];s.itemSequence=4;
 s=applyAction(s,{type:"mission",missionId:missions(s)[0].id,team:team.map(h=>h.id),tactic:"balanced"});
 const expedition=s.expeditions.at(-1)!;
 const fid=expedition.battle.combat!.fighters.find(x=>x.side==="hero")!;
 fid.hp=Math.max(1,Math.floor(fid.maxHp*.20));
 s=applyAction(s,{type:"battle-item",itemId:"item-1",expeditionId:expedition.id});
 ok(s.expeditions.at(-1)?.battle.combat?.healingItemsUsed===1,"Curativo não foi contado");
 s=applyAction(s,{type:"battle-item",itemId:"item-2",expeditionId:expedition.id});
 blocked(()=>applyAction(s,{type:"battle-item",itemId:"item-3",expeditionId:expedition.id}),"Mais de dois curativos permitidos");
 s=applyAction(s,{type:"battle-item",itemId:"item-4",expeditionId:expedition.id});
 ok(s.expeditions.at(-1)?.battle.combat?.consumablesUsed===3,"Três usos não foram registrados");
}
{
 const titles:Record<string,string>={warrior:"Guerreiro",paladin:"Cavaleiro",ranger:"Arqueiro",rogue:"Assassino",mage:"Mago",healer:"Sacerdote",bard:"Pierrô"};
 for(const book of bookItems){
  let s=newCampaign(9088);s.event=null;
  let main=s.heroes.find(h=>titles[h.class]===book.classes[0])!;
  if(!main){main=s.heroes[0];main.class=Object.keys(titles).find(k=>titles[k]===book.classes[0]) as typeof main.class;}
  const party=[main,...s.heroes.filter(h=>h.id!==main.id).slice(0,3)];
  for(const h of party){h.level=50;h.energy=100;h.defense=280;h.attack=20;h.magic=22;}
  main.supremeBook=book.id;
  s=applyAction(s,{type:"mission",missionId:missions(s)[0].id,team:party.map(x=>x.id),tactic:"defensive"});
  const id=s.expeditions.at(-1)!.id;
  s=applyAction(s,{type:"battle-ability",heroId:main.id,abilityId:"supreme-"+book.id,expeditionId:id});
  s=applyAction(s,{type:"battle-round",expeditionId:id});
  ok(s.expeditions.at(-1)?.battle.log.some(x=>x.text.includes("Livro supremo ativado: "+book.id)),"Livro não executou efeito: "+book.id);
  blocked(()=>applyAction(s,{type:"battle-ability",heroId:main.id,abilityId:"supreme-"+book.id,expeditionId:id}),"Livro usado duas vezes: "+book.id);
 }
}
console.log("INTEGRACAO-CONSUMIVEIS-LIVROS: 14 efeitos de combate e poções validados.");
