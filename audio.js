(function(root){
 'use strict';
 class Soundscape {
  constructor(){this.ctx=null;this.muted=false;this.sources=[];this.emitted=0;}
  async start(){
   if(this.ctx){await this.ctx.resume();return;}
   const AC=root.AudioContext||root.webkitAudioContext;if(!AC)throw new Error('浏览器不支持 Web Audio');
   this.ctx=new AC();await this.ctx.resume();const c=this.ctx;
   this.mix=c.createGain();this.mix.gain.value=.42;this.analyser=c.createAnalyser();this.analyser.fftSize=1024;this.analyser.smoothingTimeConstant=.45;
   this.volume=c.createGain();this.mix.connect(this.analyser);this.analyser.connect(this.volume);this.volume.connect(c.destination);
   const buffer=c.createBuffer(1,c.sampleRate*3,c.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+(Math.random()*2-1)*.04)/1.02;data[i]=last;}
   this.ambient=c.createBufferSource();this.ambient.buffer=buffer;this.ambient.loop=true;this.filter=c.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=1000;this.ambientGain=c.createGain();this.ambientGain.gain.value=.14;this.ambient.connect(this.filter);this.filter.connect(this.ambientGain);this.ambientGain.connect(this.mix);this.ambient.start();
   this.bins=new Uint8Array(this.analyser.frequencyBinCount);
  }
  setMute(muted){this.muted=muted;if(this.volume)this.volume.gain.setTargetAtTime(muted?0:1,this.ctx.currentTime,.04);}
  async pause(yes){if(!this.ctx)return;if(yes)await this.ctx.suspend();else await this.ctx.resume();}
  pan(entity,world,yaw){return Math.sin(Avian.wrap(Avian.bearing(world.player,entity)-yaw)*Math.PI/180);}
  play(event,world,yaw,focus=false){
   if(!this.ctx||this.ctx.state!=='running')return;const b=world.entity(event.entityId);if(!b)return;const c=this.ctx,s=Avian.byId[b.species];const t=c.currentTime+.02;
   const pan=c.createStereoPanner();pan.pan.value=this.pan(b,world,yaw);const gain=c.createGain();gain.gain.value=(focus?.36:.19)*Avian.clamp(1-Avian.distance(world.player,b)/240,.12,1);pan.connect(gain);gain.connect(this.mix);
   const pattern=s?s.pattern:b.type==='brake'?[1,1.03,1.05,1.02]:b.type==='wind'||b.type==='bag'?[.8,1,.7,1.1]:[1,1.1,.9];const pitch=s?s.pitch:b.type==='brake'?3800:b.type==='squirrel'?1200:340;
   pattern.forEach((mult,i)=>{const o=c.createOscillator(),g=c.createGain(),start=t+i*.19;const dur=b.type==='brake'?.23:s?.voice==='rough'?.2:.13;o.type=s?.voice==='rough'||b.type==='bag'?'triangle':'sine';o.frequency.setValueAtTime(pitch*mult,start);o.frequency.exponentialRampToValueAtTime(pitch*mult*(s?.voice==='high'?1.3:.82),start+dur);g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(.65,start+.018);g.gain.exponentialRampToValueAtTime(.001,start+dur);o.connect(g);g.connect(pan);o.start(start);o.stop(start+dur+.03);o.onended=()=>{o.disconnect();g.disconnect();};});
   this.sources.push({pan,gain,b,base:gain.gain.value,end:t+pattern.length*.19+.3});this.emitted++;
  }
  update(world,yaw,mode){if(!this.ctx)return;const t=this.ctx.currentTime;for(const source of this.sources){source.pan.pan.setTargetAtTime(this.pan(source.b,world,yaw),t,.06);const angle=Math.abs(Avian.wrap(Avian.bearing(world.player,source.b)-yaw))*Math.PI/180;const beam=mode==='mic'?Math.max(.07,Math.max(0,Math.cos(angle))**8):1;source.gain.gain.setTargetAtTime(source.base*beam,t,.04);if(source.end<t){source.pan.disconnect();source.gain.disconnect();}}this.sources=this.sources.filter(s=>s.end>=t);if(this.ambientGain){this.ambientGain.gain.setTargetAtTime((mode==='mic'?.07:.14)*(1+world.env.wind*.1),t,.2);}}
  frequency(){if(!this.analyser)return null;this.analyser.getByteFrequencyData(this.bins);return this.bins;}
 }
 root.Soundscape=Soundscape;
})(globalThis);
