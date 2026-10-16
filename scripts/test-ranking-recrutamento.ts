import assert from "node:assert/strict";
import {newCampaign,applyAction,heroLeaderboard,rankingRecruitQuote,rivalRecruitCandidates,normalizeCampaign,GameRuleError} from "../lib/game.ts";

let guaranteed=0,persuaded=0,refused=0,saves=0;
for(let seed=0;seed<130;seed++){
 const s=newCampaign(900000+seed*107);s.event=null;s.gold=500000;s.fame=50000;
 const member=heroLeaderboard(s).slice(0,10).find(h=>!h.owned);
 assert.ok(member,"A lista precisa apresentar heróis de outras guildas");
 const guild=s.rivals.find(g=>g.heroes.some(h=>h.id===member.id))!;
 const hero=guild.heroes.find(h=>h.id===member.id)!;
 assert.ok(guild&&hero);
 const q=rankingRecruitQuote(s,guild,hero,"buyout");
 assert.equal(q.chance,100);
 assert.ok(q.prestigeCost>0&&q.price>0&&q.eligible);
 const originalGold=s.gold,originalFame=s.fame,originalLength=s.heroes.length;
 const current=applyAction(s,{type:"rank-recruit",guildId:guild.id,heroId:hero.id,method:"buyout"});
 assert.equal(s.gold,originalGold,"Mutou a campanha original");
 assert.equal(current.gold,originalGold-q.price,"Multa não foi cobrada");
 assert.equal(current.fame,originalFame-q.prestigeCost,"Prestígio não foi debitado");
 assert.equal(current.heroes.length,originalLength+1);
 assert.ok(current.heroes.some(h=>h.id===hero.id),"Contratação não entrou no elenco");
 assert.ok(!current.rivals.find(g=>g.id===guild.id)!.heroes.some(h=>h.id===hero.id));
 assert.equal(current.rivals.find(g=>g.id===guild.id)!.heroes.length,guild.heroes.length,"Adversário não recebeu substituto");
 assert.equal(current.heroes.find(h=>h.id===hero.id)!.salary,q.salary);
 assert.equal(current.lastNegotiation?.fameChange,-q.prestigeCost);
 assert.equal(current.lastNegotiation?.cost,q.price);
 assert.equal(current.lastNegotiation?.success,true);
 assert.match(current.lastNegotiation!.message,/Multa/);
 assert.equal(current.rivalAttempts.length,1);
 assert.throws(()=>applyAction(current,{type:"rank-recruit",guildId:guild.id,heroId:hero.id,method:"buyout"}),GameRuleError);
 const restored=normalizeCampaign(JSON.parse(JSON.stringify(current)));
 assert.equal(restored.fame,current.fame);
 assert.equal(restored.heroes.some(h=>h.id===hero.id),true);
 saves++;guaranteed++;
 // Tentativa probabilística usa preço de sucesso e taxa por recusa; sem gasto de prestígio.
 const p=rankingRecruitQuote(s,guild,hero,"persuade");
 assert.ok(p.eligible&&p.chance<100);
 const attempted=applyAction(s,{type:"rank-recruit",guildId:guild.id,heroId:hero.id,method:"persuade"});
 assert.equal(attempted.fame,originalFame);
 assert.equal(attempted.gold,originalGold-(attempted.lastNegotiation?.success?p.price:p.fee));
 if(attempted.lastNegotiation?.success){persuaded++;assert.ok(attempted.heroes.some(h=>h.id===hero.id));}
 else{refused++;assert.ok(!attempted.heroes.some(h=>h.id===hero.id));}
 assert.throws(()=>applyAction(attempted,{type:"rank-recruit",guildId:guild.id,heroId:hero.id,method:"persuade"}),GameRuleError);
}
assert.ok(persuaded>0&&refused>0,"Persuasão deveria produzir aceites e recusas");
{
 let s=newCampaign(123455);s.event=null;s.gold=999999;s.fame=99999;
 // Um herói da guilda 99 pode liderar o ranking mesmo se ela estiver fora do Top 10 de guildas.
 const guild=s.rivals.at(-1)!;const h=guild.heroes[0];
 h.level=50;h.attack=500;h.defense=500;h.magic=500;
 guild.points=-9999;guild.victories=0;
 assert.ok(!rivalRecruitCandidates(s).some(g=>g.id===guild.id));
 assert.ok(heroLeaderboard(s).slice(0,10).some(x=>x.id===h.id),"Herói forte não apareceu no Top 10");
 const q=rankingRecruitQuote(s,guild,h,"buyout");
 s=applyAction(s,{type:"rank-recruit",guildId:guild.id,heroId:h.id,method:"buyout"});
 assert.equal(s.heroes.some(x=>x.id===h.id),true,"Não recrutou herói de guilda fora do Top 10 de guildas");
 assert.ok(s.fame>=0);
}
{
 const s=newCampaign(123456);s.event=null;s.gold=999999;s.fame=99999;
 const own=s.heroes[0];
 assert.throws(()=>applyAction(s,{type:"rank-recruit",guildId:s.rivals[0].id,heroId:own.id,method:"buyout"}),GameRuleError);
 const outsider=s.rivals.at(-1)!,h=outsider.heroes.at(-1)!;
 if(!heroLeaderboard(s).slice(0,10).some(x=>x.id===h.id)){
  assert.throws(()=>applyAction(s,{type:"rank-recruit",guildId:outsider.id,heroId:h.id,method:"buyout"}),/Top 10/);
 }
 const first=heroLeaderboard(s).slice(0,10).find(x=>!x.owned)!;
 const guild=s.rivals.find(g=>g.heroes.some(h=>h.id===first.id))!,hero=guild.heroes.find(h=>h.id===first.id)!;
 const quote=rankingRecruitQuote(s,guild,hero,"buyout");
 const insufficient={...s,fame:Math.max(0,quote.requiredFame-1)};
 assert.equal(rankingRecruitQuote(insufficient,guild,hero,"buyout").eligible,false);
 assert.throws(()=>applyAction(insufficient,{type:"rank-recruit",guildId:guild.id,heroId:hero.id,method:"buyout"}),GameRuleError);
 const broke={...s,gold:quote.price-1};
 assert.equal(rankingRecruitQuote(broke,guild,hero,"buyout").eligible,false);
 const full=structuredClone(s);
 full.heroes.push(...Array.from({length:12-full.heroes.length},(_,i)=>({...full.heroes[0],id:"extra-rank-"+i})));
 assert.equal(rankingRecruitQuote(full,guild,hero,"buyout").eligible,false);
 const capped=structuredClone(s);
 capped.rivalAttempts=["1:hero1","1:hero2","1:hero3"];
 assert.equal(rankingRecruitQuote(capped,guild,hero,"buyout").eligible,false);
 assert.throws(()=>applyAction(s,{type:"rank-recruit",guildId:guild.id,heroId:hero.id,method:"invalid" as "buyout"}),GameRuleError);
}
console.log("TOP 10 CONTRATOS: "+guaranteed+" multas e prestígios debitados; "+persuaded+" persuasões aceitas; "+refused+" recusadas; "+saves+" saves preservados. Bloqueios, guildas fora do Top10 e duplicação OK.");
