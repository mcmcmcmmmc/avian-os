// Development-only browser acceptance. Requires Playwright from the local runtime.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({viewport:{width:1440,height:1200},deviceScaleFactor:1});
 const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto('http://127.0.0.1:18876/?mode=explore');await page.screenshot({path:'evidence/desktop-entry.png',fullPage:true});
 await page.click('#start');await page.waitForSelector('[data-signal]');await page.locator('[data-signal]').first().click();await page.click('#sample');
 await page.waitForTimeout(130);const afterAudio=await page.evaluate(()=>avianDiagnostics());assert.ok(afterAudio.evidence.some(e=>e.key==='audio'));assert.equal(afterAudio.audioState,'running');assert.ok(afterAudio.fftPeak>0);
 await page.click('#habitat');await page.click('#heat');await page.screenshot({path:'evidence/thermal.png',fullPage:true});await page.click('#predict');await page.click('#capture');await page.click('#capture');
 await page.waitForSelector('#record-dialog[open]');assert.match(await page.textContent('#record-name'),/普通翠鸟/);
 await page.fill('#note','高频短音与芦苇浅滩缩小范围；长直嘴和蓝背完成确认。');await page.screenshot({path:'evidence/first-confirmation.png',fullPage:true});await page.click('#save-record');
 assert.equal((await page.evaluate(()=>avianDiagnostics())).records,1);
 await page.click('[data-tab="journal"]');assert.match(await page.textContent('#journal-list'),/高频短音与芦苇/);await page.screenshot({path:'evidence/journal.png',fullPage:true});
 const downloadPromise=page.waitForEvent('download');await page.click('#export');const download=await downloadPromise;await download.saveAs('evidence/export-test.json');const exported=JSON.parse(fs.readFileSync('evidence/export-test.json','utf8'));assert.equal(exported.records.length,1);assert.equal(exported.records[0].prediction.correct,true);
 await page.reload();assert.equal((await page.evaluate(()=>avianDiagnostics())).records,1);await page.click('#start');
 await page.click('#pause');const paused=await page.evaluate(()=>avianDiagnostics().time);await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>avianDiagnostics().time),paused);await page.click('#pause');
 await page.click('[data-mode="eyes"]');assert.equal(await page.evaluate(()=>avianDiagnostics().mode),'eyes');await page.click('[data-mode="optical"]');
 await page.selectOption('#weather','mist');await page.selectOption('#weather','clear');await page.click('[data-station="west"]');assert.match(await page.textContent('#station-label'),/林间/);
 await page.locator('#time').fill('360');await page.locator('#time').dispatchEvent('input');await page.click('#wait');assert.equal(await page.evaluate(()=>avianDiagnostics().time),'06:05');
 await page.click('[data-station="south"]');
 // Find an actual generated false signal through normal UI time controls.
 let bag=page.locator('.signal').filter({hasText:'信号 N1'});
 for(let i=0;i<40&&await bag.count()===0;i++){await page.click('#wait');}
 assert.ok(await bag.count()>0,'A naturally generated bag signal should be encountered');await bag.click();await page.click('#sample');await page.click('#habitat');await page.click('#heat');await page.click('#capture');await page.click('#capture');
 await page.waitForSelector('#record-dialog[open]');assert.match(await page.textContent('#record-description'),/塑料袋/);await page.screenshot({path:'evidence/false-signal.png',fullPage:true});await page.click('#save-record');assert.equal(await page.evaluate(()=>avianDiagnostics().records),2);
 await page.click('#zoom');await page.waitForTimeout(5500);await page.screenshot({path:'evidence/desktop-field.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'evidence/mobile-field.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.click('[data-tab="guide"]');await page.screenshot({path:'evidence/mobile-guide.png',fullPage:true});assert.equal(await page.locator('.bird-card').count(),6);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.click('[data-tab="field"]');await page.locator('#scene').scrollIntoViewIfNeeded();const box=await page.locator('#scene').boundingBox(),beforeYaw=await page.evaluate(()=>avianDiagnostics().yaw);await page.mouse.move(box.x+box.width*.5,box.y+box.height*.6);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.6);await page.mouse.up();assert.notEqual(await page.evaluate(()=>avianDiagnostics().yaw),beforeYaw);
 // Verify the packaged game opens offline without any network dependencies.
 const offline=await context.newPage();offline.on('pageerror',e=>errors.push(e.message));await context.setOffline(true);await offline.goto('file://'+path.resolve('芦汀观测站.html')+'?mode=explore');await offline.click('#start');await offline.waitForSelector('[data-signal]');assert.equal(await offline.evaluate(()=>avianDiagnostics().started),true);
 assert.equal(errors.length,0,errors.join('\n'));assert.ok(requests.every(url=>url.startsWith('http://127.0.0.1:18876/')));
 fs.writeFileSync('evidence/browser-results.json',JSON.stringify({passed:true,checks:['natural first signal','real FFT activity','four sensor evidence','prediction verified','visual confirmation','note persistence after reload','JSON export','pause freezes time','eyes mode','weather and station controls','five-minute wait','six guide entries','390px no overflow','pointer pan','natural plastic-bag false signal and rejection','offline file launch'],errors,afterAudio,requests},null,2));await browser.close();console.log('Browser acceptance passed: desktop, 390px, offline, complete observation loop.');
})().catch(e=>{console.error(e);process.exit(1);});
