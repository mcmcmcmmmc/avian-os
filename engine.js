(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const wrap = a => ((a + 180) % 360 + 360) % 360 - 180;
  function random(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const habitats = [
    {id:'water', name:'开阔水面', x:570,y:360, color:'#83b1aa'},
    {id:'reeds', name:'芦苇浅滩', x:390,y:440, color:'#b4b88c'},
    {id:'edge', name:'林缘灌丛', x:710,y:290, color:'#7f9b78'},
    {id:'canopy', name:'深林树冠', x:270,y:230, color:'#496f60'}
  ];
  const stations = [{id:'south',name:'01 芦苇栈道',x:450,y:650,yaw:0}, {id:'west',name:'02 林间隐蔽棚',x:160,y:390,yaw:70},{id:'east',name:'03 东岸观测台',x:830,y:540,yaw:-50}];
  const species = [
    {id:'kingfisher',name:'普通翠鸟',latin:'Alcedo atthis',color:'#56c5c5',accent:'#d98b51',size:0.7,voice:'high',pitch:3600,pattern:[1,1.25],shape:'蓝背 · 长直嘴',habits:'常在临水低枝停栖，俯冲捕食后可能回到旧枝。',weights:[0.9,1,.18,.06],night:false,height:2},
    {id:'egret',name:'白鹭',latin:'Egretta garzetta',color:'#f0f0d8',accent:'#364d47',size:1.5,voice:'rough',pitch:680,pattern:[1,.8],shape:'白色 · 细长黑嘴 · 长颈',habits:'偏好浅水觅食。保持距离，等待它走出芦苇。',weights:[1,.9,.04,.02],night:false,height:.3},
    {id:'night',name:'夜鹭',latin:'Nycticorax nycticorax',color:'#a0b6b4',accent:'#344f54',size:1.3,voice:'rough',pitch:520,pattern:[1],shape:'灰翼黑背 · 颈短 · 体态敦实',habits:'暮色与黎明更活跃；白天常在遮蔽处休息。',weights:[.7,1,.3,.5],night:true,height:3},
    {id:'moorhen',name:'黑水鸡',latin:'Gallinula chloropus',color:'#32494e',accent:'#e89868',size:1,voice:'pulse',pitch:1350,pattern:[1,1.13,.95],shape:'深色身体 · 红额甲 · 白色侧线',habits:'沿水生植被边缘觅食，受扰后很快藏进芦苇。',weights:[.75,1,.05,.01],night:false,height:0},
    {id:'bulbul',name:'白头鹎',latin:'Pycnonotus sinensis',color:'#c1c1a1',accent:'#eef0d5',size:.65,voice:'melody',pitch:2400,pattern:[1,1.35,1.12],shape:'白色枕部 · 橄榄灰背',habits:'林缘与灌丛中的活跃鸣鸟，会在枝间短距离移动。',weights:[.03,.28,1,.8],night:false,height:8},
    {id:'robin',name:'鹊鸲',latin:'Copsychus saularis',color:'#3a5058',accent:'#f5f0d5',size:.8,voice:'melody',pitch:2000,pattern:[1,1.4,1.15,.88],shape:'黑白配色 · 长尾上翘',habits:'在林缘枝头鸣唱，也会下到地面寻找昆虫。',weights:[.04,.2,1,.55],night:false,height:5}
  ];
  const byId = Object.fromEntries(species.map(s=>[s.id,s]));
  const noiseNames = {wind:'风吹叶片',bag:'悬挂的塑料袋',squirrel:'树上的松鼠',brake:'远处自行车刹车'};
  const weatherProfiles = {clear:{name:'晴间薄云',wind:1.8,visibility:1,temp:22}, mist:{name:'湿地薄雾',wind:.7,visibility:.65,temp:19}, rain:{name:'细雨',wind:3.5,visibility:.72,temp:18}, windy:{name:'阵风',wind:7.2,visibility:.9,temp:21}};
  function activity(s, minute) { const h=minute/60; const dawn=Math.exp(-(((h-6.2)/1.9)**2)), dusk=Math.exp(-(((h-18)/2.1)**2)); return s.night ? clamp(.15+.75*(1-Math.exp(-(((h-12)/4.4)**2))),.12,1) : clamp(.08+.82*dawn+.48*dusk+.16*Math.max(0,Math.sin((h-6)*Math.PI/12)),.05,1); }
  function bearing(player, p) {return Math.atan2(p.x-player.x,player.y-p.y)*180/Math.PI;}
  function distance(a,b) {return Math.hypot(a.x-b.x,a.y-b.y)/4;}
  function choose(items, weights, rng) {let n=rng()*weights.reduce((a,b)=>a+b,0); for(let i=0;i<items.length;i++){n-=weights[i];if(n<=0)return items[i];}return items.at(-1);}
  class World {
    constructor(seed=20260920) {
      this.rng=random(seed);this.minute=365;this.day=1;this.elapsed=0;this.weather='clear';this.food=.75;this.breeding=.6;this.player={...stations[0]};this.disturbance=0;this.events=[];this.sequence=0;
      const starts=[[480,450,'reeds'],[590,370,'water'],[280,240,'canopy'],[365,460,'reeds'],[698,287,'edge'],[685,325,'edge']];
      this.birds=species.map((s,i)=>({id:'b'+i,species:s.id,x:starts[i][0],y:starts[i][1],habitat:starts[i][2],tx:starts[i][0],ty:starts[i][1],state:i===2?'rest':'perch',timer:i===0?42:20+this.rng()*28,call:i===0?1.5:5+i*2,exposure:i===2?.16:.62,phase:this.rng()*TAU,height:s.height}));
      this.noises=[{id:'n0',type:'wind',x:370,y:415,habitat:'reeds',height:2},{id:'n1',type:'bag',x:665,y:330,habitat:'edge',height:4},{id:'n2',type:'squirrel',x:295,y:230,habitat:'canopy',height:7},{id:'n3',type:'brake',x:190,y:475,habitat:'edge',height:0}];this.noiseTimer=9;
    }
    get env(){const w=weatherProfiles[this.weather];return {...w,temp:w.temp+4*Math.sin((this.minute/60-8)*Math.PI/12),humidity:this.weather==='mist'?93:this.weather==='rain'?88:71};}
    entity(id){return [...this.birds,...this.noises].find(b=>b.id===id);}
    signal(b){const s=byId[b.species];const error=(this.rng()-.5)*(this.env.wind*2+7);const event={id:++this.sequence,entityId:b.id,bearing:wrap(bearing(this.player,b)+error),created:this.elapsed,strength:clamp(1-distance(this.player,b)/240,.15,1),label:s?'短促声纹':b.type==='wind'?'叶片扰动':b.type==='brake'?'尖锐长音':b.type==='bag'?'不规则沙沙声':'枝间动静'}; this.events.unshift(event);this.events=this.events.slice(0,16);return event;}
    moveStation(id){const p=stations.find(p=>p.id===id);if(!p)return;this.player={...p};this.disturbance=1;this.events=[];for(const b of this.birds) if(distance(this.player,b)<85){b.state='hide';b.exposure=.1;b.timer=8+this.rng()*6;}}
    tick(dt,rate=1) {
      this.elapsed+=dt;this.minute+=dt*.5*rate;while(this.minute>=1440){this.minute-=1440;this.day++;}this.disturbance=Math.max(0,this.disturbance-dt*.025);
      for(const b of this.birds){const s=byId[b.species];const act=activity(s,this.minute);b.timer-=dt;b.call-=dt;
        if(b.state==='fly'){const dx=b.tx-b.x,dy=b.ty-b.y,len=Math.hypot(dx,dy),step=Math.min(len,dt*17);if(len>0){b.x+=dx/len*step;b.y+=dy/len*step;}if(len<4){b.habitat=b.targetHabitat||b.habitat;b.state='forage';b.timer=12+this.rng()*20;}}
        if(b.timer<=0){const crowd=h=>this.birds.filter(o=>o!==b&&o.habitat===h.id).length;
          const resources=[.25+.75*this.food,.4+.6*this.food*clamp(this.env.temp/22,.5,1.3),.15+.85*this.food*(this.weather==='rain'?.6:1),.4+.4*this.food];
          const weights=habitats.map((h,i)=>Math.max(.005,s.weights[i]*resources[i]*(h.id==='canopy'&&this.env.wind>5?2:1)/(1+crowd(h)*.23)));
          const h=choose(habitats,weights,this.rng);const stressed=this.disturbance>0.3&&distance(this.player,b)<95;
          if(stressed){b.state='hide';b.timer=10;}
          else if(this.rng()<act*(1-this.env.wind*.055)*(.8+this.breeding*.2)*clamp(1-Math.abs(this.env.temp-22)*.025,.4,1)){b.targetHabitat=h.id;b.tx=h.x+(this.rng()-.5)*95;b.ty=h.y+(this.rng()-.5)*60;b.state='fly';b.timer=20;}
          else {b.state=act<.25?'rest':'perch';b.timer=14+this.rng()*25;}
        }
        const target=b.state==='hide'?.08:b.state==='rest'?.2:b.state==='fly'?.95:(b.habitat==='canopy'?.38:.76)*(1-this.disturbance*.55);
        b.exposure+=(target-b.exposure)*Math.min(1,dt*.3);
        if(b.call<=0){if(this.rng()<act*.85+.1)this.signal(b);b.call=(5+this.rng()*10)/(act+.2)*(1+this.env.wind*.045)/(1+this.breeding*.3);}
      }
      this.noiseTimer-=dt;if(this.noiseTimer<0){this.signal(this.noises[Math.floor(this.rng()*4)]);this.noiseTimer=8+this.rng()*13;}
      this.events=this.events.filter(e=>this.elapsed-e.created<32);
    }
    observe(id, modality, yaw) {
      const b=this.entity(id);if(!b)return {ok:false,reason:'信号已经失去关联，请重新选择。'};
      const angle=Math.abs(wrap(bearing(this.player,b)-yaw)),dist=distance(this.player,b),s=byId[b.species];
      if(modality==='audio'){
        if(angle>29)return {ok:false,reason:'声源在麦克风指向之外。转动视角，让方位落在中心 ±29°。'};
        if(dist>190)return {ok:false,reason:'声源太远，尝试换一个观察点。'};
        const family=s?s.voice:b.type==='brake'?'high':b.type==='squirrel'?'pulse':'rustle';
        const heard=this.rng()<this.env.wind*.018?'rustle':family;
        return {ok:true,evidence:{key:'audio',value:heard,label:'声纹 / '+({high:'高频短音',rough:'低频粗音',pulse:'节律脉冲',melody:'起伏旋律',rustle:'宽带沙沙声'}[heard]),pitch:Math.round((s?s.pitch:b.type==='brake'?3800:b.type==='squirrel'?1200:340)*(1+(this.rng()-.5)*.18))}};
      }
      if(angle>18)return {ok:false,reason:'目标没有进入扫描区域，先对准方位。'};
      if(modality==='habitat')return {ok:true,evidence:{key:'habitat',value:b.habitat,label:'环境 / '+habitats.find(h=>h.id===b.habitat).name}};
      if(modality==='thermal'){
        if(dist>140||this.env.visibility<.7&&dist>85)return {ok:false,reason:'热源太远或雾中衰减过大，请靠近。'};
        if(s&&b.exposure<.22)return {ok:false,reason:'密集植被挡住了热源；热成像也不能穿透树冠。'};
        return {ok:true,evidence:{key:'thermal',value:s||b.type==='squirrel'?'warm':'cold',label:'热像 / '+(s||b.type==='squirrel'?'温暖目标，仍可能是其他动物':'未检测到稳定温暖目标')}};
      }
      if(modality==='visual'){
        if(angle>6)return {ok:false,reason:'偏离望远镜中心。微调到中心 ±6° 后再次拍摄。'};
        if(dist>125*this.env.visibility)return {ok:false,reason:'细节分辨率不足，换一个更近的观察点。'};
        if(s&&b.exposure<.44)return {ok:false,reason:'目标被植被遮住。安静等待，或换个角度。'};
        if(s&&b.state==='fly')return {ok:false,reason:'只拍到了移动剪影，等它落枝后再试。',silhouette:true};
        return {ok:true,evidence:{key:'visual',value:s?s.id:'nonbird',label:'目视 / '+(s?s.shape:noiseNames[b.type])},confirmed:s?s.id:'nonbird'};
      }
      return {ok:false,reason:'未知传感器'};
    }
  }
  // This inference boundary accepts observations only, never world entities or species truth.
  function infer(evidence,minute=365) {
    const unique=Object.values(Object.fromEntries(evidence.map(e=>[e.key,e])));
    const candidates=[...species.map(s=>({id:s.id,name:s.name,score:(.45+.55*activity(s,minute))/6})),{id:'nonbird',name:'非鸟类 / 未知',score:.24}];
    for(const c of candidates) for(const e of unique){const s=byId[c.id];let l=1;
      if(e.key==='audio')l=s?(s.voice===e.value?.72:e.value==='rustle'?.09:.13):e.value==='rustle'?.75:e.value==='high'?.28:.2;
      if(e.key==='habitat')l=s?.weights[habitats.findIndex(h=>h.id===e.value)]??.5;
      if(e.key==='thermal')l=e.value==='warm'?(s?.85:.28):(s?.12:.8);
      if(e.key==='visual')l=e.value===c.id?.99:.008;
      c.score*=Math.max(.001,l);
    }
    const total=candidates.reduce((a,c)=>a+c.score,0);return candidates.map(c=>({...c,prob:c.score/total})).sort((a,b)=>b.prob-a.prob);
  }
  function putEvidence(list,e){return [...list.filter(x=>x.key!==e.key),e];}
  function formatTime(minute){return String(Math.floor(minute/60)%24).padStart(2,'0')+':'+String(Math.floor(minute%60)).padStart(2,'0');}
  const api={World,species,byId,habitats,stations,noiseNames,weatherProfiles,activity,bearing,distance,infer,putEvidence,wrap,clamp,random,formatTime};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Avian=api;
})(typeof globalThis!=='undefined'?globalThis:this);
