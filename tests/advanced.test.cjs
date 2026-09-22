const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {cases,evaluate,names}=require('../advanced-data.js');
test('nine genuine photo exercises cover six species without fabricated recordings',()=>{
 assert.equal(cases.length,9);assert.equal(new Set(cases.map(c=>c.answer)).size,6);
 const credits=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/reference/credits.json')));
 for(const c of cases){assert.equal(c.audio,null);assert.ok(c.advanced);assert.equal(c.options.length,6);assert.match(c.behavior,/单张照片/);const m=credits.find(m=>m.file===c.image);assert.ok(m&&m.author&&m.licenseUrl&&m.source);assert.ok(fs.statSync(path.join(__dirname,'..',c.image)).size>10000);assert.match(m.change,/未加模糊/);}
});
test('source label membership does not manufacture an identification score',()=>{
 const c=cases[0];const r=evaluate(c,{candidates:[c.answer,names[1]],confidence:'medium',evidence:['form']});assert.equal(r.referenceIncluded,true);assert.equal(r.correct,null);assert.equal(r.supported,true);assert.equal(r.overconfident,false);
 const wrong=evaluate(c,{candidates:[names[4]],confidence:'high'});assert.equal(wrong.referenceIncluded,false);assert.equal(wrong.confidenceReview,true);
 const lucky=evaluate(c,{candidates:[c.answer],confidence:'high'});assert.equal(lucky.correct,null);assert.equal(lucky.confidenceReview,true);
 const unsure=evaluate(c,{candidates:[],confidence:'low'});assert.equal(unsure.uncertain,true);assert.equal(unsure.correct,null);
});
test('legacy radio-answer scoring remains unchanged',()=>{const c=require('../challenge-data.js').cases[0];assert.equal(evaluate(c,{answer:c.answer}).correct,true);});
test('offline build embeds every advanced photo',()=>{const html=fs.readFileSync(path.join(__dirname,'../芦汀观测站.html'),'utf8');assert.ok(!/w\d\d:'assets\//.test(html));for(const c of cases){const bytes=fs.readFileSync(path.join(__dirname,'..',c.image)).toString('base64');assert.ok(html.includes(bytes),c.id);}});
