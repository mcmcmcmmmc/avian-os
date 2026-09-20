const test=require('node:test');
const assert=require('node:assert/strict');
const A=require('../engine.js');
const aligned=(w,b)=>A.bearing(w.player,b);
test('posterior normalization, nonzero unknown and independent numeric fixture',()=>{
 const p=A.infer([{key:'audio',value:'high'},{key:'habitat',value:'reeds'}],365);
 assert.ok(Math.abs(p.reduce((a,b)=>a+b.prob,0)-1)<1e-12);
 assert.equal(p[0].id,'kingfisher');assert.ok(Math.abs(p[0].prob-.5281103782819117)<1e-12);
 assert.ok(p.find(c=>c.id==='nonbird').prob>.15);assert.ok(p.every(c=>c.prob>0));
});
test('repeating one sensor does not manufacture confidence',()=>{
 const e={key:'audio',value:'melody'};assert.deepEqual(A.infer([e]),A.infer(Array(100).fill(e)));
 const es=A.putEvidence([e],{key:'audio',value:'high'});assert.equal(es.length,1);assert.equal(es[0].value,'high');
});
test('inference ignores hidden identity and labels; only observed features count',()=>{
 assert.deepEqual(A.infer([{key:'audio',value:'high',species:'egret',label:'白鹭'}]),A.infer([{key:'audio',value:'high',species:'kingfisher',label:'翠鸟'}]));
});
test('a brake resembles a bird call but cold/visual evidence overturns it',()=>{
 const first=A.infer([{key:'audio',value:'high'}]);assert.equal(first[0].id,'kingfisher');
 const last=A.infer([{key:'audio',value:'high'},{key:'thermal',value:'cold'},{key:'visual',value:'nonbird'}]);assert.equal(last[0].id,'nonbird');assert.ok(last[0].prob>.95);
});
test('warm does not imply bird; squirrel cannot produce a confirmed species',()=>{
 const w=new A.World(),b=w.noises.find(n=>n.type==='squirrel');w.player={x:b.x,y:b.y+100};
 const heat=w.observe(b.id,'thermal',aligned(w,b));assert.equal(heat.evidence.value,'warm');assert.equal(heat.confirmed,undefined);
 assert.equal(w.observe(b.id,'visual',aligned(w,b)).confirmed,'nonbird');
});
test('off-axis, range, foliage and flight prevent visual confirmation',()=>{
 const w=new A.World(),b=w.birds[0];assert.equal(w.observe(b.id,'visual',90).ok,false);
 b.exposure=.1;assert.equal(w.observe(b.id,'visual',aligned(w,b)).ok,false);
 b.exposure=.9;b.state='fly';assert.equal(w.observe(b.id,'visual',aligned(w,b)).ok,false);
 b.state='perch';w.player={x:1000,y:1000};assert.equal(w.observe(b.id,'visual',aligned(w,b)).ok,false);
});
test('dense foliage blocks thermal too',()=>{const w=new A.World(),b=w.birds[0];b.exposure=.1;assert.equal(w.observe(b.id,'thermal',aligned(w,b)).ok,false);});
test('all six visual morphology outcomes are reachable at appropriate range and exposure',()=>{
 const w=new A.World();for(const b of w.birds){w.player={x:b.x,y:b.y+100};b.exposure=.9;b.state='perch';const r=w.observe(b.id,'visual',0);assert.equal(r.confirmed,b.species);assert.ok(r.evidence.label.includes(A.byId[b.species].shape));}
});
test('day/night activity is species-dependent',()=>{
 assert.ok(A.activity(A.byId.bulbul,370)>A.activity(A.byId.bulbul,750)*2);
 assert.ok(A.activity(A.byId.night,30)>A.activity(A.byId.night,720)*3);
});
test('movement disturbs nearby individuals, then quiet lets them recover',()=>{
 const w=new A.World();w.birds[0].x=700;w.birds[0].y=480;w.moveStation('east');assert.equal(w.disturbance,1);assert.equal(w.birds[0].state,'hide');
 for(let i=0;i<500;i++)w.tick(.1);assert.equal(w.disturbance,0);assert.ok(w.birds[0].exposure>.1);
});
test('deterministic replay, persistent populations, bounds and clock rollover',()=>{
 const x=new A.World(11),y=new A.World(11);const ids=x.birds.map(b=>b.id);x.minute=y.minute=1439;
 for(let i=0;i<15000;i++){x.tick(.1);y.tick(.1);}
 assert.deepEqual(x.birds,y.birds);assert.deepEqual(x.birds.map(b=>b.id),ids);assert.equal(x.day,2);
 assert.ok(x.birds.every(b=>Number.isFinite(b.x)&&b.x>0&&b.x<1000&&b.y>0&&b.y<800));
 assert.ok(x.birds.some((b,i)=>Math.abs(b.x-[480,590,280,365,698,685][i])>20));
 assert.ok(x.events.length<=16);
});
test('five-minute waiting advances exactly five minutes',()=>{const w=new A.World();for(let i=0;i<100;i++)w.tick(.1);assert.ok(Math.abs(w.minute-370)<1e-8);});
test('weather changes both measurement limits and noise conditions',()=>{
 const w=new A.World(),b=w.birds[0];w.player={x:b.x,y:b.y+400};b.exposure=.9;b.state='perch';assert.equal(w.observe(b.id,'visual',0).ok,true);w.weather='mist';assert.equal(w.observe(b.id,'visual',0).ok,false);w.weather='windy';assert.ok(w.env.wind>7);
});
