const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await(process.env.TEST_WEBKIT?webkit:chromium).launch({headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true});
 const p=await context.newPage(),errors=[],bad=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().includes('/assets/')&&r.status()>=400)bad.push(r.url());});
 const base=process.env.BASE_URL||'http://127.0.0.1:18876/';fs.mkdirSync('evidence',{recursive:true});
 await p.goto(base+(base.includes('?')?'&':'?')+'mode=challenge');await p.waitForFunction(()=>document.getElementById('case-photo').naturalWidth>0);
 assert.equal(await p.locator('#track-advanced').getAttribute('aria-pressed'),'true');assert.equal(await p.locator('#case-tabs button').count(),9);
 assert.equal(await p.locator('#photo-review img').count(),0);assert.equal(await p.locator('#answer-reveal').isVisible(),false);
 assert.equal(await p.locator('#case-photo').evaluate(i=>getComputedStyle(i).filter),'none');
 await p.screenshot({path:'evidence/v3-desktop.png',fullPage:true});
 await p.click('#observe-form');await p.click('[data-clue="form"]');
 await p.locator('#challenge-view').getByLabel('黄眉柳莺',{exact:true}).check();await p.locator('#challenge-view').getByLabel('淡眉柳莺',{exact:true}).check();await p.locator('#challenge-view').getByLabel('黄腰柳莺',{exact:true}).check();
 await p.locator('#challenge-view').getByLabel('褐柳莺',{exact:true}).click();assert.equal(await p.locator('[name="bird-answer"]:checked').count(),3);
 await p.locator('#challenge-view').getByLabel('暂不定种',{exact:true}).check();assert.equal(await p.locator('[name="bird-answer"]:checked').count(),1);
 await p.locator('#challenge-view').getByLabel('黄眉柳莺',{exact:true}).check();assert.equal(await p.locator('#challenge-view').getByLabel('暂不定种',{exact:true}).isChecked(),false);await p.locator('#challenge-view').getByLabel('淡眉柳莺',{exact:true}).check();
 await p.fill('#guess-reason','翼和腰看不完整，先保留两种；想听叫声。');await p.click('#submit-guess');
 assert.match(await p.textContent('#result-title'),/候选包含/);assert.match(await p.textContent('#result-summary'),/档案标注/);assert.equal(await p.locator('#photo-review img').count(),6);
 await p.locator('#photo-review').scrollIntoViewIfNeeded();await p.waitForFunction(()=>[...document.querySelectorAll('#photo-review img')].every(i=>i.complete&&i.naturalWidth>0));
 await p.screenshot({path:'evidence/v3-review.png',fullPage:true});
 assert.equal(await p.locator('[name="bird-answer"]:checked').count(),2);assert.equal(await p.locator('#submit-guess').isDisabled(),true);
 const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('avian-os.identification.v2')));assert.deepEqual(saved[0].candidates,['黄眉柳莺','淡眉柳莺']);assert.equal(saved[0].correct,null);
 await p.reload();assert.equal(await p.textContent('#quiz-record-count'),'1');
 for(let i=1;i<9;i++){await p.click(`[data-case="${i}"]`);await p.waitForFunction(()=>{const i=document.getElementById('case-photo');return i.complete&&i.naturalWidth>0;});assert.equal(await p.locator('#photo-review img').count(),0);await p.click('#observe-behavior');assert.match(await p.textContent('#recording-status'),/没有动作/);assert.equal(await p.locator('#case-photo').isVisible(),true);await p.click('#observe-sound');assert.match(await p.textContent('#recording-status'),/没有/);assert.equal(await p.locator('#reference-recording').evaluate(a=>a.paused),true);}
 await p.locator('#challenge-view').getByLabel('巨嘴柳莺',{exact:true}).check();await p.locator('#challenge-view').getByLabel('很确定',{exact:true}).check();await p.click('#submit-guess');assert.match(await p.textContent('#result-title'),/标注不同/);assert.match(await p.textContent('#reason-feedback'),/很确定/);
 await p.click('#next-case');assert.match(await p.textContent('#case-number'),/01 \/ 9/);
 await p.click('#observe-form');await p.locator('#challenge-view').getByLabel('暂不定种',{exact:true}).check();await p.click('#submit-guess');assert.match(await p.textContent('#result-stamp'),/尚未缩小/);
 await p.click('#track-basic');assert.equal(await p.locator('#case-tabs button').count(),6);assert.equal(await p.locator('#photo-limit').isVisible(),false);assert.equal(await p.locator('#case-photo').isVisible(),false);
 await p.click('#observe-sound');await p.waitForFunction(()=>document.getElementById('reference-recording').currentTime>.1);await p.click('#track-advanced');assert.equal(await p.locator('#reference-recording').evaluate(a=>a.paused),true);
 await p.setViewportSize({width:390,height:844});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.screenshot({path:'evidence/v3-mobile.png',fullPage:true});
 await p.goto(base+(base.includes('?')?'&':'?')+'case=w08');assert.match(await p.textContent('#case-title'),/松针/);
 if(!process.env.BASE_URL){const off=await context.newPage();off.on('pageerror',e=>errors.push(e.message));if(!process.env.TEST_WEBKIT)await context.setOffline(true);await off.goto('file://'+path.resolve('芦汀观测站.html')+'?mode=challenge');if(process.env.TEST_WEBKIT)await context.setOffline(true);await off.waitForFunction(()=>document.getElementById('case-photo').naturalWidth>0);assert.match(await off.locator('#case-photo').getAttribute('src'),/^data:image/);await off.click('#observe-form');await off.locator('#challenge-view').getByLabel('黄眉柳莺',{exact:true}).check();await off.click('#submit-guess');await off.locator('#photo-review').scrollIntoViewIfNeeded();await off.waitForFunction(()=>[...document.querySelectorAll('#photo-review img')].every(i=>i.complete&&i.naturalWidth>0));}
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 const label=process.env.TEST_WEBKIT?'webkit':process.env.BASE_URL?'online':'chromium';fs.writeFileSync(`evidence/v3-${label}.json`,JSON.stringify({passed:true,engine:label,base,photoCases:9,checks:['original photo without artificial blur','six species / nine photos','no review images before submission','up to three candidates','uncertainty exclusive','source label not correctness','candidate persistence','no invented sound or movement','track boundaries and wrap','basic audio stops on track change','390px layout','case deep link','embedded photos offline'],errors,bad},null,2));await browser.close();console.log('Advanced browser passed:',label);
})().catch(e=>{console.error(e);process.exit(1)});
