(()=>{
'use strict';
const D=AvianEncounters,$=id=>document.getElementById(id),view=$('encounter-view'),audio=$('enc-audio');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storeKey='avian-os.encounters.v4';let track='leaf',records=[],idx=0,c,state,motionUntil=0,generation=0,hearGeneration=-1,playLimit=null,ctx=null,analyser=null,bins=null;
try{const data=JSON.parse(localStorage.getItem(storeKey)||'[]');if(Array.isArray(data))records=data.filter(r=>r&&D.scenes.some(s=>s.id===r.id)&&Array.isArray(r.candidates)&&Array.isArray(r.seen)).slice(-100);}catch{}
const confidence=()=>document.querySelector('[name="enc-confidence"]:checked').value;
const selected=()=>[...$('enc-options').querySelectorAll('input:checked')].map(x=>x.value).filter(x=>x!=='暂不定种');
const confName=x=>({low:'偏向',medium:'较确定',high:'很确定'}[x]||'未记录');
function stopSound(message){generation++;hearGeneration=-1;audio.pause();audio.currentTime=0;clearTimeout(playLimit);$('enc-stop').hidden=true;if(message)$('enc-audio-status').textContent=message;}
function tabs(){
 const available=D.pool(track);
 $('enc-cases').innerHTML=available.map((s,i)=>`<button data-enc-case="${D.scenes.indexOf(s)}" aria-current="${D.scenes.indexOf(s)===idx}">${String(i+1).padStart(2,'0')} · ${esc(s.title)}<small>${esc(s.area)}${records.some(r=>r.id===s.id)?' · 已记录':''}</small></button>`).join('');
 document.querySelectorAll('[data-enc-case]').forEach(b=>b.onclick=()=>load(+b.dataset.encCase));$('enc-record-count').textContent=records.length;
 for(const name of ['leaf','mixed'])$('enc-track-'+name).setAttribute('aria-pressed',String(track===name));
 $('enc-track-description').textContent=track==='leaf'?'9 种柳莺 · 先听叫声，再核对冠纹、翼斑与动作。部分遭遇没有照片。':'20 种混合 · 柳莺、蝗莺、树莺与鹨同场候选。先判断活动层次，再细分；有些遭遇只能保留两个候选。';
}
for(const name of ['leaf','mixed'])$('enc-track-'+name).onclick=()=>{if(track===name)return;track=name;load(name==='mixed'?9:c.family==='leaf'?idx:0);};
$('enc-roster-list').innerHTML=Object.entries(D.families).map(([key,label])=>`<section><h3>${label} · ${D.scenes.filter(s=>s.family===key).length} 种</h3>${D.scenes.filter(s=>s.family===key).map(s=>`<p><b>${esc(s.answer)}</b> <small>${esc(s.latin)}</small>${s.aliases?'<br>亦称：'+esc(s.aliases.join('、')):''}<br>${esc(s.status||(s.id==='e06'?'印度冬季参考场景；不冒充北京声型':'北京春秋过境，具体季节见关卡资料'))}</p>`).join('')}</section>`).join('');
function clues(){
 const text={context:`${c.area} · ${c.date} ${c.time}。${c.habitat}。${c.count}。`,sound:c.sound,motion:c.motion,form:c.form,detail:c.detail};
 const locked={sound:'先停下来听，或展开声音文字辅助。',motion:'等它移动，留意高度、速度和换位方式。',form:'举起望远镜；拍不到的部分暂时留空。',detail:'依据活动方式预测位置，等待一次新的观察。'};
 $('enc-clues').innerHTML=Object.entries(D.labels).map(([key,label])=>`<article class="enc-clue ${state.seen.includes(key)?'':'locked'}" data-enc-clue="${key}"><small>${label}${key==='sound'&&state.seen.includes(key)?state.soundMode==='text'?' · 文字辅助':' · 已播放参考录音':''}${key==='motion'||key==='detail'?' · 情境目击':''}</small><p>${esc(state.seen.includes(key)?text[key]:locked[key])}</p></article>`).join('');
 $('enc-evidence-count').textContent=state.seen.length+' / 5 类线索';
 ['listen','watch','optics'].forEach((name,i)=>$('enc-'+name).classList.toggle('seen',state.seen.includes(['sound','motion','form'][i])));
 $('enc-targets').querySelectorAll('button').forEach(b=>b.disabled=state.submitted||!state.seen.includes('motion'));
 controls();
}
function controls(){
 const hasChoice=!!$('enc-options').querySelector('input:checked');
 // One glimpse is allowed as a provisional hypothesis, but cannot end an encounter.
 const distinct=state.seen.includes('sound')?1:0;
 const visible=state.seen.some(k=>['form','detail','motion'].includes(k))?1:0;
 $('enc-submit').disabled=state.submitted||!hasChoice||distinct+visible<2;
 $('enc-checkpoint').disabled=state.submitted||!hasChoice;
 $('enc-submit-help').textContent=state.submitted?'本次遭遇已保存，可以回看资料和重听录音。':!hasChoice?'先保留候选，或明确选择暂不定种。':distinct+visible<2?'至少收集声音与一种目击线索，再结束观察。你仍可先记下当前猜测。':!state.seen.includes('detail')?'现在可以复盘；若想更确定，先预测下一次出现的位置，补一次目击。':'声音与补充目击已到手。回看猜测，也可以继续保留不确定。';
}
function mark(key){if(state.submitted)return;D.addEvidence(state,key);clues();}
function credits(){
 const media=(window.AvianMediaCredits||[]).filter(m=>m.file===c.photo||m.file===c.audio);
 $('enc-credits').innerHTML=media.map(m=>`<p><b>${m.type==='audio'?'真实参考录音':'真实参考照片'}</b> · ${esc(m.author)} · <a href="${m.licenseUrl||m.source}" target="_blank" rel="noopener noreferrer">${esc(m.license)}</a><br><a href="${m.source}" target="_blank" rel="noopener noreferrer">原始档案（含鸟名）</a><br>${esc(m.change)}${m.type==='audio'?'<br>'+esc(m.description):''}</p>`).join('');
}
function load(n){
 stopSound();idx=(n+D.scenes.length)%D.scenes.length;const source=D.scenes[idx];if(source.family!=='leaf')track='mixed';c={...source,options:D.choices(track)};state=D.begin();motionUntil=0;
 $('enc-location').textContent=c.area+' / 虚构情境';$('enc-title').textContent=c.title;$('enc-index').textContent=`${String(D.pool(track).findIndex(s=>s.id===c.id)+1).padStart(2,'0')} / ${D.pool(track).length}`;
 $('enc-date').textContent=c.date+' · '+c.time;$('enc-weather').textContent=c.weather;$('enc-height').textContent='初始动静：'+c.height;
 $('enc-opening').textContent=c.opening;$('enc-photo').hidden=true;$('enc-photo').removeAttribute('src');$('enc-close-photo').hidden=true;
 $('enc-view-label').textContent='环境示意 / 尚未举镜';$('enc-view-caption').textContent='先找声音和动静；画面不预先展示清晰的鸟。';
 $('enc-options').innerHTML='<legend class="sr-only">遭遇候选鸟种</legend>'+[...c.options,'暂不定种'].map(name=>`<label class="enc-choice"><input type="checkbox" name="enc-answer" value="${esc(name)}" aria-label="${esc(name)}"><span>${esc(name)}</span></label>`).join('');
 $('enc-options').onchange=e=>{const inputs=[...$('enc-options').querySelectorAll('input')];if(e.target.checked){if(e.target.value==='暂不定种')inputs.filter(x=>x!==e.target).forEach(x=>x.checked=false);else inputs.find(x=>x.value==='暂不定种').checked=false;if(inputs.filter(x=>x.checked).length>3){e.target.checked=false;$('enc-save-status').textContent='最多保留 3 个候选；还无法缩小范围时可以暂不定种。';}}controls();};
 document.querySelectorAll('[name="enc-confidence"]').forEach(x=>{x.disabled=false;x.checked=x.value==='low';});
 $('enc-note').value='';$('enc-note').disabled=false;$('enc-hypotheses').replaceChildren();$('enc-save-status').textContent='';
 $('enc-review').hidden=true;$('enc-review-path').replaceChildren();$('enc-predict-result').textContent='';$('enc-predict-hint').textContent='先等它移动，再决定把视线放在哪里。';
 $('enc-audio-status').textContent='声音尚未采集。戴耳机，或使用声音文字辅助。';
 tabs();clues();credits();
}
async function listen(){
 stopSound();const token=generation;audio.src=c.audio;audio.volume=.65;$('enc-audio-status').textContent='正在加载真实参考录音…';
 try{
  // The analyser visualizes the media itself; it never predicts a species.
  if(!ctx){const C=window.AudioContext||window.webkitAudioContext;ctx=new C();const source=ctx.createMediaElementSource(audio);analyser=ctx.createAnalyser();analyser.fftSize=512;bins=new Uint8Array(analyser.frequencyBinCount);source.connect(analyser);analyser.connect(ctx.destination);}
  await ctx.resume();if(token!==generation)return;
  hearGeneration=token;await audio.play();if(token!==generation)return;
  $('enc-stop').hidden=false;$('enc-audio-status').textContent='正在听 · 真实素材重组，不是模拟地点的原始录音';
  playLimit=setTimeout(()=>{if(token===generation)stopSound('片段播放结束，可以重听，也可查看声音笔记。');},Math.max(65000,(Number.isFinite(audio.duration)?audio.duration:90)*1000+1000));
 }catch(e){if(token===generation){stopSound('录音未能播放。可重试或使用文字辅助；失败不算听到。');}}
}
audio.addEventListener('timeupdate',()=>{if(hearGeneration===generation&&audio.currentTime>.35&&!state.submitted){state.soundMode='audio';mark('sound');}});
audio.addEventListener('ended',()=>stopSound('录音结束。听到的声音线索已保留，可再次聆听。'));
audio.addEventListener('error',()=>{if(hearGeneration===generation)stopSound('录音加载失败。可重试或使用文字辅助；未播放的声音不记为听到。');});
$('enc-listen').onclick=listen;$('enc-stop').onclick=()=>stopSound('已停止播放。');
$('enc-read-sound').onclick=()=>{if(!state.submitted){if(state.soundMode!=='audio')state.soundMode='text';mark('sound');}$('enc-audio-status').textContent='声音文字辅助：'+c.sound;};
$('enc-watch').onclick=()=>{
 if(!state.submitted)mark('motion');$('enc-close-photo').click();motionUntil=performance.now()+8000;
 $('enc-view-label').textContent='活动位置示意 / 依资料编写的情境';$('enc-view-caption').textContent=c.motion;
 $('enc-predict-hint').textContent='根据刚才活动的高度与换位方式，选一个位置等待。不要只追着最后一次晃动的叶子。';
};
$('enc-optics').onclick=()=>{
 if(!c.photo){$('enc-close-photo').click();mark('form');motionUntil=performance.now()+5000;$('enc-view-label').textContent='目击笔记 / 虚构视角，未拍到照片';$('enc-view-caption').textContent=c.form;return;}
 const photo=$('enc-photo');photo.src=c.photo;photo.hidden=false;$('enc-close-photo').hidden=false;
 $('enc-view-label').textContent='短暂目击 / 真实参考照片';$('enc-view-caption').textContent='只是一段视角；动作与补充目击写在线索本中。';
};
$('enc-photo').onload=()=>{if($('enc-photo').getAttribute('src')===c.photo&&$('enc-photo').naturalWidth>0)mark('form');};
$('enc-photo').onerror=()=>{$('enc-photo').hidden=true;$('enc-close-photo').hidden=true;$('enc-view-caption').textContent='这次图像加载失败，未记入目击。可以重试，或通过观察移动、预测位置继续。';};
$('enc-close-photo').onclick=()=>{$('enc-photo').hidden=true;$('enc-close-photo').hidden=true;$('enc-view-label').textContent='环境示意 / 等待下一次出现';$('enc-view-caption').textContent='把目光留在可能出现的位置，让鸟自己进入视野。';};
document.querySelectorAll('[data-enc-target]').forEach(b=>b.onclick=()=>{
 if(state.submitted||!state.seen.includes('motion'))return;const target=b.dataset.encTarget,matched=target===c.target;state.predictions.push({target,matched});
 $('enc-close-photo').click();motionUntil=performance.now()+8000;
 if(matched){mark('detail');$('enc-predict-result').textContent='你守住了合适的位置。'+c.detail;$('enc-view-caption').textContent='等待后获得补充目击 · 查看线索本';}
 else{$('enc-predict-result').textContent='这一轮没有等到它。回想刚才活动的高度与换位方式，换一个位置再观察。没有出现不证明这里永远没有鸟。';}
});
$('enc-checkpoint').onclick=()=>{
 if(state.submitted||!$('enc-options').querySelector('input:checked'))return;
 const h=D.saveHypothesis(state,selected(),confidence());renderHypotheses();$('enc-save-status').textContent=`已记下第 ${h.step} 次猜测。你可以继续收集线索并改变选择。`;
};
function renderHypotheses(){
 $('enc-hypotheses').innerHTML=state.hypotheses.map(h=>`<div class="enc-hypothesis"><b>${h.step}. ${esc(h.candidates.join(' / ')||'暂不定种')}</b> · ${confName(h.confidence)}<small>当时知道：${h.seen.map(k=>D.labels[k]).join('、')}</small></div>`).join('');
}
$('enc-submit').onclick=()=>{
 if($('enc-submit').disabled)return;
 const result=D.assess(c,state,selected(),confidence());const record={id:c.id,title:c.title,...result,seen:[...state.seen],soundMode:state.soundMode,hypotheses:structuredClone(state.hypotheses),predictions:structuredClone(state.predictions),note:$('enc-note').value.trim(),createdAt:new Date().toISOString()};
 records.push(record);records=records.slice(-100);state.submitted=true;stopSound();let saved=true;try{localStorage.setItem(storeKey,JSON.stringify(records));}catch{saved=false;}
 $('enc-save-status').textContent=saved?'✓ 这次的猜测变化、线索和笔记已保存':'本地保存失败，记录暂存在本页，请导出备份。';
 $('enc-options').querySelectorAll('input').forEach(x=>x.disabled=true);document.querySelectorAll('[name="enc-confidence"]').forEach(x=>x.disabled=true);$('enc-note').disabled=true;clues();tabs();
 const titles={limited:'这次的信息，还不足以排除相近候选。',supported:'这次，多条线索走向了同一个答案。',narrowed:'你保留了它，再缩小一点范围。',incomplete:'方向可以保留，还缺一次关键观察。',open:'你保留了不确定，下一次观察有了方向。',reconsider:'有几条线索，需要重新放在一起看。'};
 $('enc-review-title').textContent=c.resolutionCandidates&&result.correct?'这次，保留两个候选更符合证据。':titles[result.verdict];$('enc-review-summary').textContent=`你的结论：${result.answer}。本次虚构遭遇设定为 ${c.answer}（${c.latin}）。这是场景内的推理复盘，不是真实照片的自动鉴定。`;
 $('enc-review-reason').textContent=c.reason+(result.missing.length?' 你本次还没有取得：'+result.missing.map(k=>D.labels[k]).join('、')+'；猜中名字也不表示证据充分。':'')+(result.overconfident?' 这次把握高于已收集线索能支持的程度，可以先保留候选。':'');
 $('enc-review-path').innerHTML='<h3>你的判断怎样变化</h3>'+state.hypotheses.map(h=>`<p>${h.step}. ${esc(h.candidates.join(' / ')||'暂不定种')} · ${confName(h.confidence)}<br><small>依据：${h.seen.map(k=>D.labels[k]).join('、')}</small></p>`).join('')+`<p>最终：${esc(result.answer)} · ${confName(result.confidence)}<br>实际取得：${state.seen.map(k=>D.labels[k]).join('、')}${state.soundMode==='text'?'（声音采用文字辅助，未记为实际听到）':''}</p>`;
 $('enc-contrasts').innerHTML=c.contrasts.map(([name,why])=>`<div class="enc-provenance-item"><b>${esc(name)}</b><p>${esc(why)}</p></div>`).join('');
 $('enc-provenance').innerHTML=`<div class="enc-provenance-item"><b>资料支持的习性与特征</b><p>${esc(c.facts)}</p></div><div class="enc-provenance-item"><b>这次编写的情境</b><p>${esc(c.area)}的具体位置、日期时刻、天气温度、数量、活动高度与每一次目击经过都是虚构；它们不代表某条真实鸟讯。预测目标是本关的编排，不是生态概率模型。</p></div><div class="enc-provenance-item"><b>真实素材重组</b><p>${c.photo?'照片与录音来自不同个体、地点与时间。':'这次没有照片，镜中视角和补充目击均为编写的文字。'}录音是真实参考素材，环境是示意图；不同地域和种群的声音可能有差异，不能把素材地点当成这次虚构地点。</p></div>`;
 $('enc-sources').innerHTML=c.sources.map(s=>`<p><a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></p>`).join('')+'<p>照片和声音的逐项作者、原始档案与授权见本场景的素材署名。香港的地区出现频率不直接当作北京频率使用。</p>';
 $('enc-review').hidden=false;$('enc-review').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
};
$('enc-retry').onclick=()=>{load(idx);view.scrollIntoView({block:'start'});};$('enc-next').onclick=()=>{const pool=D.pool(track),next=pool[(pool.findIndex(s=>s.id===c.id)+1)%pool.length];load(D.scenes.indexOf(next));view.scrollIntoView({block:'start'});};
$('enc-history-button').onclick=()=>{
 stopSound();$('enc-history-list').innerHTML=records.length?[...records].reverse().map(r=>`<article class="enc-history-entry"><b>${esc(r.title)}</b><p>${esc(r.answer)} · ${confName(r.confidence)} · ${r.correct?'线索支持':'待继续核对'}</p><small>${esc(r.createdAt)} · ${(r.hypotheses||[]).length} 次中途猜测</small>${(r.hypotheses||[]).map(h=>`<p>${esc(h.candidates.join(' / ')||'暂不定种')} → ${esc((h.seen||[]).map(k=>D.labels[k]).join('、'))}</p>`).join('')}${r.note?'<p>'+esc(r.note)+'</p>':''}</article>`).join(''):'<p>还没有结束一场遭遇。中途可以反复记下猜测，结束后一起保存在这里。</p>';$('enc-history').showModal();
};$('enc-history').querySelector('.close-dialog').onclick=()=>$('enc-history').close();
$('enc-export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({format:'AVIAN-OS encounters v5',records},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='AVIAN-OS-遭遇记录.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
document.addEventListener('avian:tab',e=>{if(e.detail!=='encounter')stopSound('已切换页面，声音暂停。');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSound('离开页面，声音暂停。');});
function drawScene(now){
 const canvas=$('enc-scene'),r=canvas.getBoundingClientRect();if(!r.width)return;const d=Math.min(devicePixelRatio||1,2),w=r.width,h=r.height;
 if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);}const g=canvas.getContext('2d');g.setTransform(d,0,0,d,0,0);
 const sky=g.createLinearGradient(0,0,w,h);sky.addColorStop(0,['low','water'].includes(c.kind)?'#8caaa0':'#b1b79a');sky.addColorStop(1,'#3b6655');g.fillStyle=sky;g.fillRect(0,0,w,h);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,t=reduced?0:now/1000;
 // Generic habitat illustration. Shapes do not encode diagnostic bird plumage.
 for(let layer=0;layer<3;layer++)for(let i=0;i<9;i++){const x=(i*139+layer*47)%(w+80)-40,y=h*(.27+layer*.14)+Math.sin(i*4)*24;g.fillStyle=['#7d9882','#5b806c','#416b59'][layer];g.beginPath();g.ellipse(x,y,60+layer*12,90-layer*13,.15,0,Math.PI*2);g.fill();g.strokeStyle='#34584488';g.lineWidth=4+layer;g.beginPath();g.moveTo(x,y);g.lineTo(x-18,h);g.stroke();}
 if(['low','water'].includes(c.kind)){g.fillStyle='#718f80';g.beginPath();g.moveTo(w*.55,h*.65);g.lineTo(w,h*.58);g.lineTo(w,h);g.lineTo(w*.35,h);g.fill();g.strokeStyle='#c7d1b34d';g.lineWidth=1;for(let i=0;i<14;i++){const x=w*.56+(i*39)%(w*.5),y=h*.71+(i*11)%(h*.23);g.beginPath();g.moveTo(x,y);g.lineTo(x+34,y);g.stroke();}}
 else if(c.kind==='ground'){g.fillStyle='#64704a';g.fillRect(0,h*.7,w,h*.3);for(let i=0;i<35;i++){g.fillStyle=i%2?'#91825a':'#4e6341';g.beginPath();g.ellipse((i*59)%w,h*.75+(i*29)%(h*.24),9,3,i,0,Math.PI*2);g.fill();}}
 else{g.strokeStyle='#415844';g.lineWidth=9;g.beginPath();g.moveTo(-30,h*.66);g.quadraticCurveTo(w*.42,h*.5,w*.9,h*.4);g.stroke();g.lineWidth=3;for(let i=0;i<5;i++){g.beginPath();g.moveTo(w*(.15+i*.12),h*(.59-i*.025));g.lineTo(w*(.21+i*.12),h*(.28+i*.014));g.stroke();}}
 for(let i=0;i<36;i++){const x=(i*51)%(w+60)-30,y=h*(['low','water'].includes(c.kind)?.78:.22)+(i*37)%70;g.fillStyle=i%2?'#56754c':'#73885b';g.beginPath();g.ellipse(x+Math.sin(t+i)*2,y,19,7,Math.sin(i)*.8,0,Math.PI*2);g.fill();}
 if(now<motionUntil){const phase=(Math.sin(t*1.4)+1)/2,x=w*(.22+phase*.46),y=h*(c.kind==='ground'?.84:['low','water'].includes(c.kind)?.74:.38)+Math.sin(t*4)*7;g.fillStyle='#293e32';g.beginPath();g.ellipse(x,y,7,4,0,0,Math.PI*2);g.fill();g.beginPath();g.arc(x+6,y-3,3,0,Math.PI*2);g.fill();g.beginPath();g.moveTo(x-5,y);g.lineTo(x-15,y-4);g.lineTo(x-13,y+2);g.fill();g.strokeStyle='#d7dbb577';g.lineWidth=1;g.strokeRect(x-24,y-17,49,33);}
 for(let i=0;i<24;i++){const x=(i*43)%(w+30);g.strokeStyle=i%2?'#526b3d':'#3b634d';g.lineWidth=2;g.beginPath();g.moveTo(x,h);g.quadraticCurveTo(x+5,h-30,x+11+Math.sin(t+i)*2,h-30-(i*17)%70);g.stroke();}
 const v=g.createRadialGradient(w/2,h/2,h*.15,w/2,h/2,w*.7);v.addColorStop(0,'#10271c00');v.addColorStop(1,'#10271c99');g.fillStyle=v;g.fillRect(0,0,w,h);
}
function drawSpectrum(){const canvas=$('enc-spectrum'),w=canvas.clientWidth,h=canvas.clientHeight,d=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(w*d)){canvas.width=w*d;canvas.height=h*d;}const g=canvas.getContext('2d');g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,w,h);g.strokeStyle='#45644a66';g.lineWidth=1;g.beginPath();g.moveTo(0,h-8);g.lineTo(w,h-8);g.stroke();if(!analyser||audio.paused)return;analyser.getByteFrequencyData(bins);g.fillStyle='#b6d293';for(let i=0;i<80;i++){const value=bins[i+4]/255;g.fillRect(i*w/80,h-8-value*(h-10),Math.max(1,w/80-2),value*(h-10));}}
function frame(now){if(!view.hidden&&!document.hidden&&!$('enc-history').open){if($('enc-photo').hidden)drawScene(now);drawSpectrum();}requestAnimationFrame(frame);}
const requested=new URLSearchParams(location.search).get('encounter');load(Math.max(0,D.scenes.findIndex(s=>s.id===requested)));requestAnimationFrame(frame);
})();
