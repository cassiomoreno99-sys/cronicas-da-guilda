import { CATALOG_BY_ID, CATALOG_ITEMS, RECIPE_BY_ID, testShop, equippedPosition, isTwoHanded, SETS } from "./catalog-test.ts";
import type {Campaign,Action,HeroClass} from "./game.ts";
type AddEntry=(s:Campaign,title:string,delta:number)=>void;
function ensure(v:unknown,message:string):asserts v {if(!v)throw Error(message);}
function own(s:Campaign,key:string){return s.chest.filter(i=>i.key===key&&!i.equippedTo).length;}
const NAMES:Record<string,HeroClass>={"Guerreiro":"warrior","Cavaleiro":"paladin","Arqueiro":"ranger","Assassino":"rogue","Mago":"mage","Sacerdote":"healer","Pierrô":"bard"};
function add(s:Campaign,key:string){ensure(s.chest.length<120,"Inventário cheio.");s.chest.push({id:"item-"+(++s.itemSequence),key});}
export function handleCatalogAction(s:Campaign,action:Action,entry:AddEntry):void{
 switch(action.type){
 case "buy":{
  const d=CATALOG_BY_ID[action.key];ensure(d&&d.preco_compra!==null,"Item indisponível.");
  ensure(testShop(s).some(x=>x.id===d.id),"O mercador não oferece esse item.");
  const stock=Math.floor((s.day-1)/7)+":"+s.activeRegion+":"+d.id;
  ensure(!s.shopPurchases.includes(stock),"Estoque esgotado nesta semana.");
  ensure(s.gold>=d.preco_compra,"Ouro insuficiente.");
  ensure(s.chest.length<120,"Inventário cheio.");
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
  delete item.equippedTo;delete item.equippedSlot;break;
 }
 case "craft":{
  const recipe=RECIPE_BY_ID[action.recipeId];ensure(recipe&&recipe.forge>0,"Receita inexistente ou indisponível.");
  const d=CATALOG_BY_ID[recipe.result];ensure(d,"Item não cadastrado.");
  ensure(s.hq.forge>=recipe.forge,"Forja nível "+recipe.forge+" necessária.");
  const regions=["Vale de Valen","Terras de Brumavale","Ruínas de Ashen","Fronteira dos Dragões","Deserto de Sahir","Costa de Namar","Bosque de Elarin","Picos de Kharum","Pântano de Morn","Império de Solkar","Abismo de Nhal","Coroa do Mundo"];
  ensure(regions.includes(d.regiao)&&s.region>=regions.indexOf(d.regiao)+1,"Região do projeto não liberada.");
  ensure(s.gold>=recipe.cost,"Ouro insuficiente.");
  ensure(s.chest.length<120,"Inventário cheio.");
  for(const [key,qty] of Object.entries(recipe.materials))ensure(own(s,key)>=qty,"Material insuficiente: "+key);
  for(const [key,qty] of Object.entries(recipe.materials)){
   let remaining=qty;
   s.chest=s.chest.filter(i=>{if(i.key===key&&!i.equippedTo&&remaining>0){remaining--;return false;}return true;});
  }
  entry(s,"Forja · "+d.nome,-recipe.cost);add(s,d.id);break;
 }
 default:throw Error("Ação de catálogo desconhecida.");
 }
}
export function awardCatalogLoot(s:Campaign):string[]{
 if(s.chest.length>=120)return [];
 const regions=["Vale de Valen","Terras de Brumavale","Ruínas de Ashen","Fronteira dos Dragões","Deserto de Sahir","Costa de Namar","Bosque de Elarin","Picos de Kharum","Pântano de Morn","Império de Solkar","Abismo de Nhal","Coroa do Mundo"];
 const mats=CATALOG_ITEMS.filter(x=>x.categoria==="Materiais"&&regions.indexOf(x.regiao)>=0&&regions.indexOf(x.regiao)<s.activeRegion);
 if(!mats.length)return [];
 // A função de loot é chamada apenas depois de uma vitória: um material por missão.
 const ix=(s.day+s.wins+s.rng)%mats.length;
 const chosen=mats[ix];add(s,chosen.id);return [chosen.id];
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
