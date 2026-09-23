const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const D=require('../encounter-data.js');
test('one hundred and ten unique source-backed fictional encounters are split into bounded practice tracks',()=>{
 assert.equal(D.scenes.length,110);assert.equal(new Set(D.scenes.map(c=>c.latin)).size,110);
 assert.deepEqual(Object.fromEntries(Object.keys(D.tracks).map(k=>[k,D.pool(k).length])),{leaf:9,mixed:20,wateredge:10,openwater:10,shore:10,raptor:10,forest:10,city:10,grass:10,reed:10,sky:10});
 for(const c of D.scenes){for(const k of ['area','date','time','weather','habitat','height','count','opening','sound','form','motion','prediction','detail','reason','facts'])assert.ok(c[k],c.id+' '+k);const added=Number(c.id.slice(1))>=21;if(added)assert.ok(c.status,c.id+' status');assert.equal(c.options.length,D.pool(c.track).length);assert.ok(c.options.includes(c.answer));assert.ok(c.sources.length>=(added?2:1));assert.ok(['canopy','low','ground','water','sky'].includes(c.target));}
 assert.equal(D.scenes.filter(c=>c.latin==='Anthus richardi').length,1);
});
test('every expanded encounter has attributable local reference media',()=>{
 const credits=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/reference/credits.json')));
 for(const c of D.scenes){for(const f of [c.audio,c.photo].filter(Boolean)){assert.ok(fs.existsSync(path.join(__dirname,'..',f)));const m=credits.find(x=>x.file===f);assert.ok(m&&m.author&&m.license&&m.source);if(m.license.includes('ND'))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..',f))).digest('hex'),m.originalSha256);}}
 const added=D.scenes.filter(c=>Number(c.id.slice(1))>=21);assert.equal(added.length,90);
 assert.equal(added.filter(c=>c.audio).length,71);assert.equal(added.filter(c=>!c.audio).length,19);
 for(const c of added){
  assert.ok(c.photo,c.id+' must have a reference photo or an explicitly-labelled teaching illustration');
  const photo=credits.find(x=>x.file===c.photo);assert.ok(photo,c.id+' bitmap attribution');assert.equal(photo.case,c.id);assert.equal(photo.type,'bitmap');assert.match(photo.source,/^https:\/\//);assert.ok(fs.statSync(path.join(__dirname,'..',c.photo)).size>1024,c.photo);
  if(photo.generated){assert.equal(photo.license,'AI-generated educational reconstruction (not a source photograph)');assert.match(photo.change,/non-photographic teaching reconstruction/);}else{assert.match(photo.license,/^CC BY/i);assert.doesNotMatch(photo.license,/\bND\b/i);}
  if(c.audio){assert.equal(c.soundEvidence,'audio',c.id+' must mark a real reference recording as audio');const audio=credits.find(x=>x.file===c.audio);assert.ok(audio,c.id+' audio attribution');assert.equal(audio.case,c.id);assert.equal(audio.type,'audio');assert.match(audio.source,/^https:\/\//);assert.match(audio.license,/^CC BY/i);assert.doesNotMatch(audio.license,/\bND\b/i);assert.ok(fs.statSync(path.join(__dirname,'..',c.audio)).size>1024,c.audio);}else{assert.equal(c.soundEvidence,'field-note',c.id+' must never present a written sound clue as a recording');assert.equal(photo.generated,true,c.id+' may omit audio only when its image is visibly labelled as an AI teaching illustration');}
 }
});
test('repeated observation does not invent independent evidence',()=>{const s=D.begin();assert.equal(D.addEvidence(s,'sound'),true);assert.equal(D.addEvidence(s,'sound'),false);assert.equal(D.addEvidence(s,'unknown'),false);assert.deepEqual(s.seen,['context','sound']);});
test('a correct name still needs complementary evidence',()=>{const c=D.scenes[0],s=D.begin();D.addEvidence(s,'form');let r=D.assess(c,s,[c.answer],'high');assert.equal(r.correct,false);assert.equal(r.verdict,'incomplete');D.addEvidence(s,'sound');D.addEvidence(s,'detail');assert.equal(D.assess(c,s,[c.answer],'high').correct,true);});
test('candidate sets, uncertainty and the deliberately unresolved pair stay distinct',()=>{const c=D.scenes.find(c=>c.id==='e11'),s=D.begin();s.seen.push('sound','detail');assert.equal(D.assess(c,s,[c.answer],'medium').correct,false);assert.equal(D.assess(c,s,c.resolutionCandidates,'medium').correct,true);assert.equal(D.assess(c,s,[],'low').verdict,'open');});
test('all embedded assets survive the offline build',()=>{const html=fs.readFileSync(path.join(__dirname,'../芦汀观测站.html'),'utf8');for(const c of D.scenes)for(const file of [c.audio,c.photo].filter(Boolean))assert.ok(html.includes(fs.readFileSync(path.join(__dirname,'..',file)).toString('base64')),file);});
