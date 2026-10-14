import { chromium } from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const base='http://127.0.0.1:8123/laboratorio-combate-2d/index.html';
const errors=[];
async function checkViewport(width,height,label){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(label+': '+e.message));
 await page.goto(base,{waitUntil:'load',timeout:60000});
 await page.waitForTimeout(2700);
 const images=await page.locator('#figures .body-art img').evaluateAll(els=>els.map(x=>({src:x.src,loaded:x.complete&&x.naturalWidth>0,width:x.naturalWidth})));
 if(images.length!==8)throw new Error(label+' figuras '+images.length);
 const bg=await page.locator('.arena .backdrop').evaluate(el=>getComputedStyle(el).backgroundImage);
 if(!bg.includes('arena-aprovada.webp'))throw new Error(label+' fundo aprovado ausente: '+bg.slice(0,180));
 const count=await page.locator('#stageHud .stage-hud').count();
 if(count!==8)throw new Error(label+' HUD separado incorreto: '+count);
 if(images.some(x=>!x.loaded))throw new Error(label+' sprite não carregou: '+JSON.stringify(images));
 const metrics=await page.evaluate(()=>{
  const stage=document.querySelector('.arena').getBoundingClientRect();
  const units=Array.from(document.querySelectorAll('#figures .unit'));
  return {stage:{w:stage.width,h:stage.height},units:units.map(el=>{const r=el.getBoundingClientRect();return {id:el.id,top:Math.round(r.top-stage.top),bottom:Math.round(r.bottom-stage.top),left:Math.round(r.left-stage.left),right:Math.round(r.right-stage.left),paint:el.dataset.paint}}),horizontalOverflow:document.documentElement.scrollWidth>innerWidth+3};
 });
 if(metrics.units.some(x=>x.top < -15||x.bottom>metrics.stage.h+15))throw new Error(label+' personagem cortado: '+JSON.stringify(metrics.units));
 if(metrics.horizontalOverflow)throw new Error(label+' rolagem horizontal indevida');
 await page.locator('#arena').screenshot({path:'visual-report/lab-v5-'+label+'.jpg',type:'jpeg',quality:72});
 if(label==='desktop'){
  await page.locator('#auto').click();
  await page.waitForFunction(()=>{const b=document.querySelector('#basic');return b&&!b.disabled;},{timeout:10000});
  const before=await page.locator('#enemyRoster .member:first-child small').innerText();
  await page.locator('#basic').click();
  await page.waitForTimeout(1200);
  const after=await page.locator('#enemyRoster .member:first-child small').innerText();
  if(before===after)throw new Error('Ataque manual não alterou PV: '+before+' / '+after);
  const chosen=page.locator('#arena .unit[data-side="enemy"]').first();
  await chosen.click({force:true});
  if((await chosen.getAttribute('data-select'))!=='true')throw new Error('Seleção alvo falhou');
  console.log('ATAQUE MANUAL REAL',before,'=>',after);
 }
 console.log('VERIFICADO '+label,JSON.stringify(metrics));
 await page.close();
}
fs.mkdirSync('visual-report',{recursive:true});
try{
 await checkViewport(1440,950,'desktop');
 await checkViewport(390,844,'mobile');
 if(errors.length)throw new Error('Erros no browser: '+JSON.stringify(errors));
 for(const label of ['desktop','mobile']){
  const f=fs.readFileSync('visual-report/lab-v5-'+label+'.jpg');
  fs.writeFileSync('visual-report/lab-v5-'+label+'.b64.txt',f.toString('base64'));
 }
 console.log('PASSOU: cenário, 8 sprites, 2 viewports, comando manual, PV, seleção alvo');
}finally{await browser.close();}
