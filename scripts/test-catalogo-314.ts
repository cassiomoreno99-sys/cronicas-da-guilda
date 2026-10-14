import { newCampaign, applyAction, normalizeCampaign, ITEMS, heroStats, missions, type Campaign } from "../lib/game.ts";
import { CATALOG_ITEMS, CATALOG_BY_ID, TEST_RECIPES, testShop, requiredSlot, isTwoHanded } from "../lib/catalog-test.ts";
const ok=(v:unknown,m:string)=>{if(!v)throw Error(m);};
const blocked=(f:()=>unknown,m:string)=>{let failed=false;try{f();}catch{failed=true;}ok(failed,m);};
const fresh=(seed:number)=>{const s=newCampaign(seed);s.event=null;return s;};
{
 const ids=CATALOG_ITEMS.map(x=>x.id), names=new Set(ids);
 ok(ids.length===314&&names.size===314,"O catálogo não contém 314 IDs exclusivos");
 ok(ids.every((x,i)=>x==="CG-"+String(i+1).padStart(3,"0")),"Ordem de IDs inválida");
 ok(Object.keys(ITEMS).filter(id=>/^CG-\d{3}$/.test(id)).length===314,"Faltam registros equipáveis do catálogo original.");
 ok(Object.keys(ITEMS).length===332,"Relíquias exclusivas não foram cadastradas.");
 ok(CATALOG_ITEMS.filter(x=>x.categoria==="Livro de magia suprema").length===14,"Faltam livros.");
 ok(TEST_RECIPES.every(r=>Object.keys(r.materials).length&&Object.entries(r.materials).every(([k,v])=>CATALOG_BY_ID[k]?.categoria==="Materiais"&&v>0)),"Receita usa insumos fantasmas");
 ok(TEST_RECIPES.every(r=>r.cost>=(CATALOG_BY_ID[r.result]?.preco_venda||0)),"Receita gera lucro automático.");
}
{
 let s=fresh(991);
 const items=testShop(s);ok(items.length>0,"Mercador não tem itens");
 const d=items.find(x=>x.preco_compra!==null&&x.preco_compra<=s.gold&&x.preco_venda>0);
 ok(d,"Mercador inicial não oferece nenhum item acessível.");
 const start=s.gold;
 s=applyAction(s,{type:"buy",key:d!.id});
 ok(s.chest.length===1&&s.chest[0].key===d!.id,"Compra não adicionou item");
 ok(s.gold===start-d!.preco_compra!,"Ouro após compra incorreto");
 blocked(()=>applyAction(s,{type:"buy",key:d!.id}),"Duplicação de estoque semanal não bloqueada");
 s=normalizeCampaign(s);ok(s.chest.length===1,"Salvamento limpou o inventário");
 s=applyAction(s,{type:"sell",itemId:s.chest[0].id});
 ok(s.chest.length===0&&s.gold===start-d!.preco_compra!+d!.preco_venda,"Venda ou cálculo de 25% incorreto");
 blocked(()=>applyAction(s,{type:"sell",itemId:"item-inexistente"}),"Venda duplicada foi permitida.");
 blocked(()=>applyAction(s,{type:"buy",key:"CG-313"}),"Livro supremo disponível no vendedor inicial.");
}
{
 let s=fresh(992);
 const h=s.heroes[0];h.level=50;s.gold=300000;
 const d=CATALOG_ITEMS.find(x=>requiredSlot(x)==="weapon"&&x.classes.includes("Cavaleiro"===h.class?"Cavaleiro":"Guerreiro")&&x.nivel<=50);
 const className:Record<string,string>={warrior:"Guerreiro",mage:"Mago",healer:"Sacerdote",rogue:"Assassino",ranger:"Arqueiro",paladin:"Cavaleiro",bard:"Pierrô"};
 const suitable=CATALOG_ITEMS.filter(x=>requiredSlot(x)==="weapon"&&x.classes.includes(className[h.class]));
 ok(suitable.length>0,"Classe inicial não pode portar arma");
 const weapon=suitable[0];s.chest.push({id:"item-1",key:weapon.id});s.itemSequence=1;
 const before=heroStats(h,s);
 s=applyAction(s,{type:"equip",itemId:"item-1",heroId:h.id});
 ok(!!s.chest[0].equippedTo&&s.chest[0].equippedSlot==="weapon","Arma não ocupa slot correto");
 const after=heroStats(s.heroes[0],s);
 ok(after.attack>=before.attack,"Ataque caiu após equipar arma");
 blocked(()=>applyAction(s,{type:"sell",itemId:"item-1"}),"Venda de equipado permitida");
 s=applyAction(s,{type:"unequip",itemId:"item-1"});
 ok(!s.chest[0].equippedTo,"Não foi possível desequipar");
}
{
 let s=fresh(993);s.gold=1000000;s.region=12;s.activeRegion=12;s.hq.forge=5;
 const recipe=TEST_RECIPES.find(r=>r.forge===1);
 ok(recipe,"Nenhuma receita de primeiro nível.");
 let counter=0;for(const [key,count] of Object.entries(recipe!.materials)){
  for(let i=0;i<count;i++)s.chest.push({id:"item-"+(++counter),key});
 }
 s.itemSequence=counter;
 const start=s.gold;
 s=applyAction(s,{type:"craft",recipeId:recipe!.id});
 ok(s.chest.some(x=>x.key===recipe!.result),"Forja não gerou equipamento");
 ok(s.gold===start-Math.max(1,Math.round(recipe!.cost*(1-Math.min(.2,s.hq.forge*.02)))),"Forja não debitou o custo melhorado corretamente");
 ok(Object.entries(recipe!.materials).every(([key])=>!s.chest.some(x=>x.key===key)),"Forja não consumiu ingredientes");
 blocked(()=>applyAction(s,{type:"craft",recipeId:recipe!.id}),"Forja repetida sem materiais foi permitida");
}
{
 let s=fresh(994);
 s.fame=400;
 for(const h of s.heroes.slice(0,4)){h.level=50;h.attack=500;h.defense=450;h.magic=500;h.energy=100;h.injuredUntil=0;}
 const first=missions(s)[0];
 s=applyAction(s,{type:"mission",missionId:first.id,team:s.heroes.slice(0,4).map(h=>h.id),tactic:"aggressive"});
 ok(s.expeditions.length===1,"Expedição não iniciou");
 s=applyAction(s,{type:"battle-auto",expeditionId:s.expeditions[0].id});
 ok(s.lastBattle?.status==="won","Combate com equipe de teste superdesenvolvida não venceu");
 ok((s.lastBattle.loot?.length||0)>=1,"Combate não concedeu material.");
 ok(s.chest.some(x=>x.key===s.lastBattle?.loot?.[0]),"Item de loot não ficou no inventário.");
}
console.log("CATALOGO-314: IDs, preços, loja, estoque, persistência, venda, slots, forja, consumo e combate OK.");
