import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"],...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
try{
 for(const width of [320,390,1024]){
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto("http://127.0.0.1:4173",{waitUntil:"networkidle"});
   await page.evaluate(()=>{
    const key="cronicas-da-guilda:standalone:v1";
    const data=JSON.parse(localStorage.getItem(key));
    data.state.gold=300000;
    data.state.fame=30000;
    data.state.event=null;
    data.revision=(data.revision||0)+1;
    localStorage.setItem(key,JSON.stringify(data));
   });
   await page.reload({waitUntil:"networkidle"});
   await page.getByRole("button",{name:"Liga",exact:true}).click();
   const cards=page.locator(".hero-ranking-card");
   await cards.first().waitFor();
   if(await cards.count()!==10)throw Error("Top 10 não mostrou 10 heróis");
   if(await page.locator(".rank-profile-trigger").count()!==10)throw Error("Faltou botão Ver ficha em algum herói");
   const rival=cards.filter({has:page.locator('[data-player="false"]')});
   const rivalCard=page.locator('.hero-ranking-card[data-player="false"]').first();
   await rivalCard.getByRole("button",{name:/Ver características/}).click();
   const dialog=page.getByRole("dialog");
   await dialog.waitFor();
   for(const label of ["Ataque","Defesa","Magia","Energia","Velocidade","Crítico","Experiência","Salário semanal"]){
     if(!await dialog.getByText(label,{exact:true}).count())throw Error("Ficha sem atributo "+label);
   }
   const persuade=dialog.locator(".rank-contract-button.persuasion");
   const buyout=dialog.locator(".rank-contract-button.buyout");
   if(!await persuade.isEnabled()||!await buyout.isEnabled())throw Error("Ações sem saldo e fama foram bloqueadas");
   const old=await page.evaluate(()=>JSON.parse(localStorage.getItem("cronicas-da-guilda:standalone:v1")).state);
   page.once("dialog",d=>d.accept());
   await buyout.click();
   await page.waitForFunction(({gold,fame,heroCount})=>{
      const d=JSON.parse(localStorage.getItem("cronicas-da-guilda:standalone:v1")).state;
      return d.heroes.length===heroCount+1&&d.gold<gold&&d.fame<fame;
   },{gold:old.gold,fame:old.fame,heroCount:old.heroes.length},{timeout:10000});
   const current=await page.evaluate(()=>JSON.parse(localStorage.getItem("cronicas-da-guilda:standalone:v1")).state);
   if(current.lastNegotiation?.success!==true)throw Error("A contratação não foi garantida");
   if(current.lastNegotiation?.fameChange>=0)throw Error("Prestígio não foi gasto");
   if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+5))throw Error("Layout horizontal estourou em "+width);
   await page.getByRole("button",{name:"Fechar ficha"}).click();
   if(await page.getByRole("dialog").count())throw Error("Sobreposição não fechou");
   const ownCard=page.locator('.hero-ranking-card[data-player="true"]').first();
   if(await ownCard.count()){
    await ownCard.getByRole("button",{name:/Ver características/}).click();
    if(await page.getByRole("dialog").getByText(/já pertence à sua guilda/).count()!==1)throw Error("Ficha de herói próprio permite recrutamento");
    if(await page.getByRole("dialog").locator(".rank-contract-button").count())throw Error("Herói próprio possui botão de compra");
    await page.keyboard.press("Escape");
    if(await page.getByRole("dialog").count())throw Error("Escape não fechou");
   }
   if(errors.length)throw Error("Erros JS: "+errors.join(", "));
   console.log("TOP 10 UI "+width+"px: 10 fichas, atributos, duas propostas, desconto persistido, acesso mobile OK.");
  }finally{await page.close();}
 }
}finally{await browser.close();}
