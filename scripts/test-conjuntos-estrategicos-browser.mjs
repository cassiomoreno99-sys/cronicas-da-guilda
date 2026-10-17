import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
try{
 for(const width of [320,390,1024]){
  const page=await browser.newPage({viewport:{width,height:800}});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
   const openEquipment=async()=>{
    await page.getByRole("button",{name:"Heróis",exact:true}).click();
    await page.getByRole("button",{name:/Ver equipamentos/}).click();
    await page.locator(".equipment-sets").waitFor();
   };
   const setup=async(cl,keys,equippedCount)=>{
    await page.evaluate(({cl,keys,equippedCount})=>{
      const key="cronicas-da-guilda:standalone:v1",save=JSON.parse(localStorage.getItem(key));
      const hero=save.state.heroes[0];hero.class=cl;hero.level=50;hero.energy=100;hero.injuredUntil=0;
      save.state.chest=keys.map((item,i)=>({id:"set-ui-"+i,key:item,
        ...(i<equippedCount?{equippedTo:hero.id,equippedSlot:({"CG-004":"armor","CG-006":"offhand","CG-029":"gloves","CG-271":"weapon","CG-277":"boots","CG-286":"cloak"})[item]}:{})}));
      save.state.itemSequence=9000;save.state.event=null;save.revision++;
      localStorage.setItem(key,JSON.stringify(save));
    },{cl,keys,equippedCount});
    await page.reload({waitUntil:"networkidle"});
    await openEquipment();
   };
   await setup("warrior",["CG-004","CG-006","CG-029"],0);
   const panel=page.getByRole("region",{name:"Combinações de conjuntos do personagem"});
   const fortress=panel.locator(".equipment-set-card").filter({hasText:"Bastião do Leão"});
   if(await fortress.locator(".equipment-set-heading").innerText()&&!await fortress.getByText("0/3 peças").count())throw Error("Bônus 0/3 não apareceu");
   if(await fortress.locator('.set-attribute[data-active="true"]').count())throw Error("Coloriu atributos não ativados");
   await setup("warrior",["CG-004","CG-006","CG-029"],2);
   const two=page.locator(".equipment-set-card").filter({hasText:"Bastião do Leão"});
   if(!await two.getByText("2/3 peças").count())throw Error("2/3 não apareceu");
   if(await two.locator('[data-stat="defense"][data-active="true"]').count()!==1)throw Error("Defesa azul 2/3 ausente");
   if(await two.locator('[data-stat="life"][data-active="true"]').count()!==1)throw Error("Vida verde 2/3 ausente");
   if(await two.locator(".equipment-set-effects p:nth-child(2) [data-active='true']").count())throw Error("Bônus 3/3 ativo com 2 peças");
   await setup("warrior",["CG-004","CG-006","CG-029"],3);
   const full=page.locator(".equipment-set-card").filter({hasText:"Bastião do Leão"});
   if(!await full.getByText("3/3 peças").count())throw Error("3/3 ausente");
   if(await full.locator('[data-stat="defense"][data-active="true"]').count()<2)throw Error("Defesa azul completa não foi colorida");
   const defense=full.locator('[data-stat="defense"][data-active="true"]').first();
   const css=await defense.evaluate(e=>({color:getComputedStyle(e).color,border:getComputedStyle(e).borderBottomWidth}));
   if(css.color!=="rgb(25, 85, 162)"||css.border==="0px")throw Error("Cor azul da Defesa incorreta: "+JSON.stringify(css));
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   if(overflow>5)throw Error("Rolagem horizontal em "+width+": "+overflow);
   // Remover uma peça atualiza a contagem e desliga o bônus extra instantaneamente.
   await page.locator('.equipment-slot[data-slot="gloves"]').click();
   await page.getByRole("button",{name:"Desequipar"}).click();
   if(!await full.getByText("2/3 peças").count())throw Error("A retirada não voltou a 2/3");
   if(await full.locator('.equipment-set-effects p:nth-child(2) [data-active="true"]').count())throw Error("Bônus 3/3 permaneceu ativo");
   await setup("ranger",["CG-271","CG-277","CG-286"],2);
   const ranger=page.locator(".equipment-set-card").filter({hasText:"Rastro do Falcão"});
   const crit=ranger.locator('[data-stat="critical"][data-active="true"]');
   if(await crit.count()!==1)throw Error("Crítico não ficou vermelho");
   const critColor=await crit.evaluate(e=>getComputedStyle(e).color);
   if(critColor!=="rgb(180, 31, 54)")throw Error("Crítico vermelho diferente: "+critColor);
   if(await ranger.locator('[data-stat="speed"][data-active="true"]').count()!==1)throw Error("Velocidade sem turquesa");
   if(errors.length)throw Error(errors.join(" | "));
   console.log("SETS MOBILE "+width+"px OK: 0/3, 2/3, 3/3, Defesa azul, Crítico vermelho, desmontagem e sem overflow.");
  }finally{await page.close();}
 }
}finally{await browser.close();}
