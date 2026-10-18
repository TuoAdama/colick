const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.resolve(__dirname, '../..');
const dist = root + '/front-office/dist/front-office/browser';
const out = root + '/docs/mobile-messages';
fs.mkdirSync(out, {recursive:true});
const server = http.createServer((req,res)=> {
 const url = new URL(req.url,'http://localhost');
 const file = path.join(dist, url.pathname === '/messages' || url.pathname === '/' ? 'index.csr.html' : url.pathname);
 try { res.setHeader('Content-Type', file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream'); res.end(fs.readFileSync(file)); } catch {res.statusCode=404;res.end();}
});
(async()=> {
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser = await chromium.launch({channel:'chrome',headless:true});
 try {
 const page = await browser.newPage();

 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let long=false, many=false;
 const messages=()=> (many ? Array.from({length:40},(_,i)=>({id:i+1,senderId:i%2?1:2,senderName:'Demsi',content:'Message '+i+' '+ 'texte long '.repeat(12),sentAt:new Date(2026,9,18,6,i).toISOString(),read:true})) : [{id:1,senderId:2,content:'Bonjour, pouvez-vous répondre à ma demande ?',sentAt:new Date().toISOString(),read:true},{id:2,senderId:1,content:'Je n’ai plus de place désolé :)',sentAt:new Date().toISOString(),read:true}]);
 await page.route('**/api/**', async route=> {
  const url=new URL(route.request().url());let body={};
  if(url.pathname==='/api/auth/session')body={id:1,firstName:'Adama',lastName:'Tuo',email:'demo@example.test',role:'USER'};
  else if(url.pathname==='/api/public/app-config')body={commercialMode:'FREE',contentVariant:'free',platformFeeRate:0,features:{platformPayment:false,platformFee:false}};
  else if(url.pathname==='/api/messaging/conversations')body=[{id:10,otherParticipantId:2,otherParticipantName:'Demsi Demsi',contextRoute:long?'Saint-Sébastien-sur-Loire, France → Abidjan, Côte d’Ivoire':'Nantes, France → Abidjan, Côte d’Ivoire',lastMessage:'Bonjour',unreadCount:0,createdAt:new Date().toISOString()}];
  else if(url.pathname.endsWith('/messages'))body=messages();
  await route.fulfill({json:body});
 });
 const url='http://127.0.0.1:'+server.address().port+'/messages?conversationId=10';
 for(const width of [320,390,767,768,1280]) {
  await page.setViewportSize({width,height:844});await page.goto(url);await page.locator('.message-input').waitFor();await page.evaluate(()=>document.fonts.ready);
  const metrics=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,composer:document.querySelector('.message-composer').getBoundingClientRect().bottom,footer:getComputedStyle(document.querySelector('footer')).display,history:document.querySelector('.message-history').clientHeight}));
  assert(metrics.page<=width,JSON.stringify(metrics));
  if(width<768){assert(metrics.composer<=845,JSON.stringify(metrics));assert(metrics.footer==='none');assert(metrics.history>100);}
  await page.screenshot({path:out+'/messages-'+width+'.png',fullPage:true});
  console.log(width,metrics);
 }
 long=true;many=true;
 await page.setViewportSize({width:320,height:844});await page.goto(url);await page.locator('.message-item').nth(39).waitFor();
 await page.waitForTimeout(300); assert(await page.locator('.message-history').evaluate(el=>el.scrollTop>el.scrollHeight-el.clientHeight-2), 'initial history must scroll to latest');
 await page.screenshot({path:out+'/messages-long-320.png',fullPage:true});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
 await page.locator('.message-history').evaluate(el=>el.scrollTop=0);
 await page.waitForTimeout(5200);
 assert(await page.locator('.message-history').evaluate(el=>el.scrollTop===0));
 await page.locator('.message-input').focus();await page.setViewportSize({width:320,height:480});await page.waitForTimeout(150);
 assert(await page.locator('.message-composer').evaluate(el=>el.getBoundingClientRect().bottom<=481));
 await page.screenshot({path:out+'/messages-reduced-viewport-320.png',fullPage:true});
 await page.getByRole('button',{name:'Retour',exact:true}).click();
 await page.getByRole('searchbox', {name:'Rechercher une conversation'}).waitFor();
 assert(errors.length===0,errors.join('\n'));
 console.log('PASS: long route/history, polling scroll retention, reduced viewport, back navigation, no browser errors.');
 } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
