import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
try{
 for(const width of [320,390,1024]){
   const page=await browser.newPage({viewport:{width,height:820},deviceScaleFactor:1});
   const errors=[];page.on("pageerror",error=>errors.push(error.message));
   try{
     await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
     await page.getByRole("button",{name:"Guilda",exact:true}).last().click();
     await page.locator(".guild-quick-actions").waitFor();
     if(await page.locator(".guild-quick-grid button").count()!==4)throw Error("Faltaram 4 atalhos da Guilda");
     if(await page.locator(".guild-goal-list>div").count()!==3)throw Error("Faltaram desafios de veteranos");
     await page.locator(".guild-quick-grid button").filter({hasText:"Liga e reservas"}).click();
     await page.locator(".league-reserve-controls input").check();
     await page.waitForFunction(()=>{
       const s=JSON.parse(localStorage.getItem("cronicas-da-guilda:standalone:v1"));
       return s.state.leagueAutoSub===true;
     });
     await page.getByRole("button",{name:"Guilda",exact:true}).last().click();
     await page.evaluate(()=>{
       const k="cronicas-da-guilda:standalone:v1";
       const save=JSON.parse(localStorage.getItem(k));
       save.state.gold=0;save.state.event=null;
       save.state.chest.push({id:"set-equip-audit",key:"CG-004"});
       save.state.heroes[0].level=50;
       save.state.heroes[0].class="warrior";
       save.revision++;
       localStorage.setItem(k,JSON.stringify(save));
     });
     await page.reload({waitUntil:"networkidle"});
     await page.getByRole("button",{name:"Guilda",exact:true}).last().click();
     const contract=page.locator(".guild-relief button");
     if(!await contract.isEnabled())throw Error("Contrato de emergência não está disponível para tesouro vazio");
     await contract.click();
     await page.waitForFunction(()=>{
       const s=JSON.parse(localStorage.getItem("cronicas-da-guilda:standalone:v1"));
       return s.state.gold>=45&&s.state.dailyActions.reliefWeek===0;
     });
     if(await contract.isEnabled())throw Error("Contrato de emergência pode ser executado duas vezes");
     await page.locator(".guild-quick-grid button").filter({hasText:"Inventário"}).click();
     const input=page.getByPlaceholder("Nome ou código do item");
     await input.fill("CG-004");
     await page.locator(".inventory-pagination").waitFor();
     if(await page.locator(".item-grid .item-tile").count()!==1)throw Error("Busca do baú não localizou o item");
     await page.getByRole("button",{name:"Guilda",exact:true}).last().click();
     await page.locator(".guild-quick-grid button").filter({hasText:"Equipar heróis"}).click();
     await page.locator('.equipment-slot[data-slot="armor"]').click();
     await page.getByLabel("Mostrar apenas peças de conjuntos").count();
     await page.locator(".equip-only-set input").check();
     const candidates=page.locator(".catalog-equippable .small-button");
     if(await candidates.count()===0)throw Error("Filtro escondeu peça compatível do conjunto");
     if(!await candidates.first().locator(".equipment-comparison").count())throw Error("Falta o delta dos atributos");
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
     if(overflow>5)throw Error("Rolagem horizontal "+width+"px: "+overflow);
     if(errors.length)throw Error("Erros de JavaScript: "+errors.join(" | "));
     console.log("SETE MELHORIAS MOBILE "+width+"px: 4 atalhos, 3 desafios, Liga, emergência, busca e comparador sem overflow.");
   }finally{await page.close();}
 }
}finally{await browser.close();}
