import { CATALOG_BY_ID, CATALOG_ITEMS, RECIPE_BY_ID, testShop, equippedPosition, isTwoHanded, SETS } from "./catalog-test.ts";
import { heroRace, type Campaign,type Action,type HeroClass,type Mission } from "./game.ts";
import { chestCapacity, storageUsed } from "./storage.ts";
type AddEntry=(s:Campaign,title:string,delta:number)=>void;
function ensure(v:unknown,message:string):asserts v {if(!v)throw Error(message);}
function own(s:Campaign,key:string){return s.chest.filter(i=>i.key===key&&!i.equippedTo).length;}
const NAMES:Record<string,HeroClass>={"Guerreiro":"warrior","Cavaleiro":"paladin","Arqueiro":"ranger","Assassino":"rogue","Mago":"mage","Sacerdote":"healer","Pierrô":"bard"};
export function addCatalogItem(s:Campaign,key:string){ensure(CATALOG_BY_ID[key],"Item não cadastrado.");ensure(storageUsed(s.chest)<chestCapacity(s),"Baú cheio. Melhore o Forja da Guilda.");s.chest.push({id:"item-"+(++s.itemSequence),key});}
const add=addCatalogItem;
const REGIONS=["Vale de Valen","Terras de Brumavale","Ruínas de Ashen","Fronteira dos Dragões","Deserto de Sahir","Costa de Namar","Bosque de Elarin","Picos de Kharum","Pântano de Morn","Império de Solkar","Abismo de Nhal","Coroa do Mundo"] as const;
function roll(s:Campaign){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
export function questMissionIndex(key:string, region:string):number{
 if(region==="Vale de Valen"){
  const special:Record<string,number>={"CG-027":0,"CG-251":2,"CG-254":5,"CG-262":3};
  if(special[key]!==undefined)return special[key];
 }
 const candidates=CATALOG_ITEMS.filter(x=>x.categoria==="Outros"&&x.preco_compra===null&&x.regiao===region).sort((a,b)=>a.id.localeCompare(b.id));
 const idx=candidates.findIndex(x=>x.id===key);
 return idx<0?-1:idx%6;
}
export function missionLootPreview(s:Campaign,m:Mission):string[]{
 const index=m.kind==="boss"?6:Number(m.id.split("-").at(-1));
 return CATALOG_ITEMS.filter(x=>x.categoria==="Outros"&&x.preco_compra===null&&x.regiao===m.location&&questMissionIndex(x.id,m.location)===index&&!(s.claimedQuestItems||[]).includes(x.id)).map(x=>x.nome);
}
export function handleCatalogAction(s:Campaign,action:Action,entry:AddEntry):void{
 switch(action.type){
 case "buy":{
  const d=CATALOG_BY_ID[action.key];ensure(d&&d.preco_compra!==null,"Item indisponível.");
  ensure(testShop(s).some(x=>x.id===d.id),"O mercador não oferece esse item.");
  const stock=Math.floor((s.day-1)/7)+":"+s.activeRegion+":"+d.id;
  ensure(!s.shopPurchases.includes(stock),"Estoque esgotado nesta semana.");
  ensure(s.gold>=d.preco_compra,"Ouro insuficiente.");
  ensure(storageUsed(s.chest)<chestCapacity(s),"Baú cheio. Melhore o Forja da Guilda.");
  entry(s,"Compra · "+d.nome,-d.preco_compra);add(s,d.id);s.shopPurchases.push(stock);break;
 }
 case "sell":{
  const item=s.chest.find(x=>x.id===action.itemId);ensure(item&&!item.equippedTo,"Item inexistente ou equipado.");
  const def=CATALOG_BY_ID[item.key];ensure(def&&def.preco_venda>0,"Item não vendável.");
  s.chest=s.chest.filter(i=>i.id!==item.id);entry(s,"Venda · "+def.nome,def.preco_venda);break;
 }
 case "equip":{
  const item=s.chest.find(x=>x.id===action.itemId),hero=s.heroes.find(x=>x.id===action.heroId);
  ensure(item&&!item.equippedTo&&hero,"Item ou herói indisponível.");
  ensure(!s.expeditions.some(e=>e.battle.status==="active"&&e.team.includes(hero.id)),"Herói está em expedição.");
  ensure(!s.journeys.some(j=>j.heroId===hero.id&&j.remaining>0),"Herói em viagem.");
  const def=CATALOG_BY_ID[item.key],slot=equippedPosition(item.key);
  ensure(def&&slot,"Objeto não equipável.");ensure(def.classes.some(c=>NAMES[c]===hero.class),"Classe incompatível.");
  ensure(!def.race || heroRace(hero)===def.race,"Esta relíquia é exclusiva de outra raça.");
  ensure(hero.level>=def.nivel,"Nível "+def.nivel+" necessário.");
  const owned=s.chest.filter(x=>x.equippedTo===hero.id);
  const used=owned.map(x=>x.equippedSlot||equippedPosition(x.key));
  const target=slot==="ring"?(used.includes("ring1")?(used.includes("ring2")?"":"ring2"):"ring1"):slot;
  ensure(target,"Anéis ocupados.");ensure(!used.includes(target),"Espaço ocupado.");
  if(target==="offhand")ensure(!owned.some(x=>isTwoHanded(x.key)),"Arma de duas mãos bloqueia escudo.");
  if(isTwoHanded(item.key))ensure(!used.includes("offhand"),"Remova a mão secundária.");
  item.equippedTo=hero.id;item.equippedSlot=target;break;
 }
 case "unequip":{
  const item=s.chest.find(x=>x.id===action.itemId);ensure(item&&item.equippedTo,"Item não equipado.");
  ensure(!s.expeditions.some(e=>e.battle.status==="active"&&e.team.includes(item.equippedTo!)),"Não é possível desequipar durante combate.");
  ensure(storageUsed(s.chest)<chestCapacity(s),"Não há espaço no baú para guardar o equipamento. Melhore o Forja.");
  delete item.equippedTo;delete item.equippedSlot;break;
 }
 case "craft":{
  const recipe=RECIPE_BY_ID[action.recipeId];ensure(recipe&&recipe.forge>0,"Receita inexistente ou indisponível.");
  const d=CATALOG_BY_ID[recipe.result];ensure(d,"Item não cadastrado.");
  ensure(s.hq.forge>=recipe.forge,"Forja nível "+recipe.forge+" necessária.");
  ensure(REGIONS.includes(d.regiao as typeof REGIONS[number])&&s.region>=REGIONS.indexOf(d.regiao as typeof REGIONS[number])+1,"Região do projeto não liberada.");
  const cost=Math.max(1,Math.round(recipe.cost*(1-Math.min(.2,s.hq.forge*.02))));
  ensure(s.gold>=cost,"Ouro insuficiente.");
  ensure(storageUsed(s.chest)<chestCapacity(s),"Baú cheio. Melhore o Forja da Guilda.");
  for(const [key,qty] of Object.entries(recipe.materials))ensure(own(s,key)>=qty,"Material insuficiente: "+key);
  for(const [key,qty] of Object.entries(recipe.materials)){
   let remaining=qty;
   s.chest=s.chest.filter(i=>{if(i.key===key&&!i.equippedTo&&remaining>0){remaining--;return false;}return true;});
  }
  entry(s,"Forja · "+d.nome,-cost);add(s,d.id);
  s.chest[s.chest.length-1].forgedPower=Math.min(10,Math.floor(s.hq.forge*.8));break;
 }
 case "scribe-book":{
  const d=CATALOG_BY_ID[action.bookId],hero=s.heroes.find(h=>h.id===action.heroId);
  ensure(d?.categoria==="Livro de magia suprema"&&hero,"Livro ou herói inexistente.");
  ensure(hero.level>=d.nivel&&hero.storyStage===3,"A prova exige o nível indicado e história pessoal concluída.");
  ensure(d.classes.some(c=>NAMES[c]===hero.class),"Este livro pertence a outra classe.");
  ensure(!s.expeditions.some(e=>e.battle.status==="active"&&e.team.includes(hero.id)),"Herói ocupado em combate.");
  ensure(s.hq.library>=3,"A biblioteca da sede precisa alcançar nível 3.");
  ensure(s.bossSeasons.length>=1,"Derrote um chefe regional para desbloquear provas supremas.");
  ensure(storageUsed(s.chest)<chestCapacity(s),"Baú cheio. Melhore o Forja da Guilda.");
  const cost=Math.round((d.preco_compra||0)*.7);
  ensure(cost>0&&s.gold>=cost,"Ouro insuficiente para a transcrição.");
  for(const mat of d.materiais||[])ensure(own(s,mat.id)>=mat.quantidade,"Material insuficiente: "+CATALOG_BY_ID[mat.id]?.nome);
  for(const mat of d.materiais||[]){let n=mat.quantidade;s.chest=s.chest.filter(i=>{if(i.key===mat.id&&!i.equippedTo&&n){n--;return false;}return true;});}
  entry(s,"Prova de classe · "+d.nome,-cost);add(s,d.id);break;
 }
 case "learn-book":{
  const owned=s.chest.find(i=>i.id===action.itemId),hero=s.heroes.find(h=>h.id===action.heroId);
  ensure(owned&&!owned.equippedTo&&hero,"Herói ou livro indisponível.");
  const d=CATALOG_BY_ID[owned.key];ensure(d?.categoria==="Livro de magia suprema","Selecione um livro supremo.");
  ensure(d.classes.some(c=>NAMES[c]===hero.class)&&hero.level>=d.nivel,"Classe ou nível incompatível.");
  ensure(hero.storyStage===3,"Conclua a história pessoal do herói antes de aprender este livro.");
  ensure(!hero.supremeBook,"O herói já aprendeu um livro supremo.");
  ensure(!s.expeditions.some(e=>e.battle.status==="active"&&e.team.includes(hero.id)),"Herói está em expedição.");
  hero.supremeBook=d.id;s.chest=s.chest.filter(i=>i.id!==owned.id);break;
 }
 case "reset-specialization":{
  const hero=s.heroes.find(h=>h.id===action.heroId);
  ensure(hero&&hero.supremeBook&&!hero.supremeRespecced&&hero.talent,"A revisão suprema não está disponível.");
  ensure(!s.expeditions.some(e=>e.battle.status==="active"&&e.team.includes(hero.id)),"Herói está em expedição.");
  delete hero.talent;hero.supremeRespecced=true;break;
 }
 default:throw Error("Ação de catálogo desconhecida.");
 }
}
/** Recompensas: o objeto de missão tem posição fixa no quadro de seis missões;
 * recursos são recolhidos regionalmente, e itens combatíveis dependem de rolagens de raridade.
 * Loot só é concedido pelo chamador após uma vitória.
 */
export function awardCatalogLoot(s:Campaign,m:Mission):string[]{
 if(storageUsed(s.chest)>=chestCapacity(s))return [];
 const won:string[]=[];
 const pick=(candidates:typeof CATALOG_ITEMS)=>candidates[Math.floor(roll(s)*candidates.length)];
 const material=CATALOG_ITEMS.filter(d=>d.categoria==="Materiais"&&d.regiao===m.location);
 if(material.length&&storageUsed(s.chest)<chestCapacity(s)){const d=pick(material);add(s,d.id);won.push(d.id);}
 const index=m.kind==="boss"?6:Number(m.id.split("-").at(-1));
 const quest=CATALOG_ITEMS.filter(d=>d.categoria==="Outros"&&d.preco_compra===null&&d.regiao===m.location&&questMissionIndex(d.id,m.location)===index);
 for(const d of quest){
  if(storageUsed(s.chest)>=chestCapacity(s))break;
  if(s.claimedQuestItems.includes(d.id))continue;
  add(s,d.id);won.push(d.id);s.claimedQuestItems.push(d.id);
 }
 // Uma segunda recompensa de equipamento é possível, mas não garantida.
 const eligible=CATALOG_ITEMS.filter(d=>d.regiao===m.location&&d.categoria!=="Materiais"&&d.categoria!=="Livro de magia suprema"&&d.preco_compra!==null&&d.raridade!=="SUPREMO");
 const probability:Record<string,number>={"COMUM":.30,"INCOMUM":.20,"RARO":.10,"ÉPICO":.04,"LENDÁRIO":.01};
 const candidates=eligible.filter(d=>m.kind==="boss"||d.raridade!=="LENDÁRIO");
 // No máximo um item extra, com probabilidade de raridade condicionada à missão.
 const gated=candidates.filter(d=>roll(s)<(probability[d.raridade]||0)*(m.kind==="boss"?1.5:1));
 if(gated.length&&storageUsed(s.chest)<chestCapacity(s)){const d=pick(gated);add(s,d.id);won.push(d.id);}
 return won;
}
export function setBonuses(s:Campaign,heroClass:HeroClass,equippedKeys:string[]){
 const n={attack:0,defense:0,magic:0,hp:0,speed:0,critical:0,healing:0,luck:0};
 for(const [name,def] of Object.entries(SETS)){
  if(NAMES[def.classe]!==heroClass)continue;
  const count=equippedKeys.filter(key=>def.items.includes(Number(key.slice(3)))).length;
  if(count>=2){
   if(name==="Bastião do Leão"){n.defense+=5;n.hp+=20;}
   if(name==="Juramento Solar"){n.defense+=6;n.magic+=12;}
   if(name==="Rastro do Falcão"||name==="Véu das Sete Lâminas"){n.speed+=5;n.critical+=.02;}
   if(name==="Constelação Arcana"){n.magic+=8;n.hp+=12;}
   if(name==="Aurora Guardiã"){n.magic+=8;n.healing+=.05;}
   if(name==="Fortuna do Espetáculo"){n.luck+=.05;n.magic+=6;}
  }
  if(count>=3){
   if(name==="Bastião do Leão"){n.defense+=7;n.hp+=40;}
   if(name==="Juramento Solar"){n.hp+=40;n.magic+=10;n.healing+=.06;}
   if(name==="Rastro do Falcão"){n.attack+=9;}
   if(name==="Véu das Sete Lâminas"){n.attack+=10;}
   if(name==="Constelação Arcana"){n.magic+=12;n.critical+=.02;}
   if(name==="Aurora Guardiã"){n.hp+=42;n.healing+=.04;}
   if(name==="Fortuna do Espetáculo"){n.magic+=9;n.critical+=.02;}
  }
 }
 return n;
}
