#!/usr/bin/env node
/*
  Reproducible acquisition for e21–e100.
  - Commons supplies a 960px JPEG reference photo and attribution metadata.
  - Xeno-canto's public search page supplies a real recording, its author and
    its Creative Commons license. Only licenses without an ND restriction pass.
  - The downloaded references are not asserted to be from the fictional scene.
*/
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const references=path.join(root,'assets/reference');
const dry=process.argv.includes('--dry-run');
const bankScenes=require(path.join(root,'encounter-bank.js')).scenes;
const requested=Number(process.argv.find(a=>a.startsWith('--limit='))?.slice(8)||bankScenes.length);
const offset=Number(process.argv.find(a=>a.startsWith('--offset='))?.slice(9)||0);
const concurrency=Number(process.argv.find(a=>a.startsWith('--concurrency='))?.slice(14)||1);
const scenes=bankScenes.slice(offset,offset+requested);
const aliases={e52:['Eastern Marsh Harrier'],e72:['Azure-winged Magpie'],e76:['Carduelis sinica','Oriental Greenfinch'],e79:['Agropsar sturninus','Daurian Starling'],e80:['Garrulax sannio','White-browed Laughingthrush'],e95:['Caprimulgus indicus','Large-tailed Nightjar'],e97:['Indian Cuckoo'],e101:['Great Reed Warbler'],e103:['Speckled Reed Warbler'],e104:['Blunt-winged Warbler'],e105:['Manchurian Reed Warbler'],e106:['Thick-billed Warbler'],e107:['Paddyfield Warbler'],e108:['Locustella ochotensis','Northern Grasshopper Warbler'],e109:['Locustella fasciolata',"Gray's Grasshopper Warbler"],e110:['Locustella pryeri','Marsh Grassbird']};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function decode(s=''){return s.replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
function text(s=''){return decode(String(s).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim());}
function twoWords(latin){return latin.split(/\s+/).slice(0,2).join(' ');}
function licenseName(url){
 const match=url.match(/licenses\/([^/]+)\/([^/]+)\//i);
 if(!match)return '';
 return `CC ${match[1].split('-').map((part,i)=>i===0?part.toUpperCase():part.toUpperCase()).join('-')} ${match[2]}`;
}
function allowedLicense(name,url){return /creativecommons\.org\/licenses\/by(?:-nc)?(?:-sa)?\/\d/i.test(url)&&!/\bnd\b/i.test(url)&&/^CC BY/i.test(name);}
function filePage(title){return 'https://commons.wikimedia.org/wiki/'+encodeURIComponent(title.replace(/ /g,'_'));}
async function request(url,timeout=6500){
 let last;
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await fetch(url,{headers:{'user-agent':'AVIAN-OS media attribution collector/0.7 (public educational browser game)'},signal:AbortSignal.timeout(timeout)});
   if(response.ok)return response;
   last=new Error(`${response.status} ${url}`);
   if(![429,500,502,503,504].includes(response.status))throw last;
   const retry=Number(response.headers.get('retry-after'));
   await wait(Number.isFinite(retry)&&retry>0?Math.min(retry*1000,4000):900*(attempt+1));
  }catch(error){
   last=error;
   if(attempt===1)break;
   await wait(900*(attempt+1));
  }
 }
 throw last;
}
async function json(url){return (await request(url)).json();}
async function queryCommons(latin){
 const query=new URLSearchParams({action:'query',generator:'search',gsrsearch:latin,gsrnamespace:'6',gsrlimit:'20',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'960',format:'json',origin:'*'});
 const payload=await json('https://commons.wikimedia.org/w/api.php?'+query);
 const pages=Object.values(payload.query?.pages||{});
 for(const page of pages){
  const info=page.imageinfo?.[0];
  if(!info)continue;
  const download=info.thumburl||info.url||'';
  const license=text(info.extmetadata?.LicenseShortName?.value);
  const licenseUrl=text(info.extmetadata?.LicenseUrl?.value);
  const author=text(info.extmetadata?.Artist?.value||info.extmetadata?.Credit?.value);
  if(!/\.(?:jpe?g)(?:[?#]|$)/i.test(download)||!author||!allowedLicense(license,licenseUrl))continue;
  return {
   file:`assets/reference/${latin}`,title:page.title,author,license,licenseUrl,source:filePage(page.title),download,
   description:text(info.extmetadata?.ImageDescription?.value)||page.title,
   change:'Commons 960px reference image re-encoded as JPEG for local and offline display; no identification feature was generated or painted.'
  };
 }
 return null;
}
async function queryCommonsAudio(latin){
 const query=new URLSearchParams({action:'query',generator:'search',gsrsearch:`${latin} filetype:audio`,gsrnamespace:'6',gsrlimit:'20',prop:'imageinfo',iiprop:'url|extmetadata',format:'json',origin:'*'});
 const payload=await json('https://commons.wikimedia.org/w/api.php?'+query);
 const pages=Object.values(payload.query?.pages||{});
 for(const page of pages){
  const info=page.imageinfo?.[0];
  if(!info)continue;
  const download=info.url||'';
  const license=text(info.extmetadata?.LicenseShortName?.value);
  const licenseUrl=text(info.extmetadata?.LicenseUrl?.value);
  const author=text(info.extmetadata?.Artist?.value||info.extmetadata?.Credit?.value);
  if(!/\.(?:mp3|ogg|wav|flac)(?:[?#]|$)/i.test(download)||!author||!allowedLicense(license,licenseUrl))continue;
  return {
   file:`assets/reference/${latin}`,title:page.title,author,license,licenseUrl,source:filePage(page.title),download,
   description:text(info.extmetadata?.ImageDescription?.value)||page.title,
   change:'Commons reference recording, trimmed to at most 18 seconds and converted to 96 kbps MP3 without changing pitch or tempo; the fictional encounter is not the source recording location.'
  };
 }
 return null;
}
function xenoRows(html,latin){
 const species=twoWords(latin).toLowerCase();
 return [...html.matchAll(/<tr\b[\s\S]*?<\/tr>/g)].map(m=>m[0]).map(row=>{
  const scientific=text(row.match(/sci-name'>([^<]+)/)?.[1]);
  const audio=decode(row.match(/<audio[^>]+\ssrc='([^']+)'/)?.[1]||'');
  const sourceId=row.match(/href=['"]https:\/\/xeno-canto\.org\/(\d+)(?:['"/])/i)?.[1];
  const author=text(row.match(/xeno-canto\.org\/contributor\/[^']+'>([^<]+)/)?.[1]);
  const licenseUrl=decode(row.match(/href=["'](https:\/\/creativecommons\.org\/licenses\/[^"']+)["']/i)?.[1]||'');
  const license=licenseName(licenseUrl);
  const title=text(row.match(/title='Download file &#039;([^']+)/)?.[1])||`XC${sourceId||''} ${scientific}`;
  const type=text(row.match(/<td>([^<]{0,80}(?:call|song)[^<]{0,80})<\/td>/i)?.[1]);
  return {scientific,audio,sourceId,author,license,licenseUrl,title,type};
 }).filter(row=>row.scientific.toLowerCase()===species&&row.audio&&row.sourceId&&row.author&&allowedLicense(row.license,row.licenseUrl));
}
async function queryXeno(latin){
 const response=await request('https://xeno-canto.org/explore?query='+encodeURIComponent(latin));
 const rows=xenoRows(await response.text(),latin);
 const row=rows.find(x=>/\.mp3(?:[?#]|$)/i.test(x.audio))||rows[0];
 if(!row)return null;
 return {
  file:`assets/reference/${latin}`,title:row.title,author:row.author,license:row.license,licenseUrl:row.licenseUrl,
  source:`https://xeno-canto.org/${row.sourceId}`,download:row.audio,
  description:`${row.scientific}; ${row.type||'recording type supplied on source page'}.`,
  change:'Xeno-canto reference recording, trimmed to at most 18 seconds and converted to 96 kbps MP3 without changing pitch or tempo; the fictional encounter is not the source recording location.'
 };
}
async function lookup(scene){
 const terms=[scene.latin,...(twoWords(scene.latin)!==scene.latin?[twoWords(scene.latin)]:[]),...(aliases[scene.id]||[])];
 let photo=null,audio=null;
 const errors=[];
 for(const term of terms){
  const checks=await Promise.allSettled([photo?Promise.resolve(photo):queryCommons(term),audio?Promise.resolve(audio):queryXeno(term)]);
  if(!photo&&checks[0].status==='fulfilled')photo=checks[0].value;
  if(!audio&&checks[1].status==='fulfilled')audio=checks[1].value;
  for(const check of checks)if(check.status==='rejected')errors.push(check.reason.message);
  if(!audio){try{audio=await queryCommonsAudio(term);}catch(error){errors.push(error.message);}}
  if(photo&&audio)break;
 }
 return {scene,photo,audio,error:errors.join(' | ')};
}
async function mapLimit(items,limit,fn){
 const result=[];let index=0;
 async function worker(){while(index<items.length){const at=index++;try{result[at]=await fn(items[at]);}catch(error){result[at]={scene:items[at],error:error.message};}await wait(120);}}
 await Promise.all(Array.from({length:Math.min(limit,items.length)},worker));return result;
}
async function download(url,file){const response=await request(url,60000);fs.writeFileSync(file,Buffer.from(await response.arrayBuffer()));}
function transcode(input,output,args){execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',input,...args,output],{stdio:'pipe'});}
function credit(caseId,type,asset){return {...asset,case:caseId,type,file:`assets/reference/${caseId}-${type==='bitmap'?'photo.jpg':'audio.mp3'}`};}
function repairCreditPaths(){
 const mediaFile=path.join(root,'encounter-media.js');
 if(!fs.existsSync(mediaFile))throw new Error('No generated encounter-media.js to repair.');
 delete require.cache[mediaFile];const mapping=require(mediaFile);
 const creditsFile=path.join(references,'credits.json');
 const credits=JSON.parse(fs.readFileSync(creditsFile,'utf8')).map(item=>{
  const entry=mapping[item.case];if(!entry)return item;
  return {...item,file:item.type==='bitmap'?entry.photo:item.type==='audio'?entry.audio:item.file};
 });
 fs.writeFileSync(creditsFile,JSON.stringify(credits,null,2)+'\n');
 fs.writeFileSync(path.join(root,'media-credits.js'),`window.AvianMediaCredits = ${JSON.stringify(credits,null,2)};\n`);
 console.log('Rebound generated attribution records to their local media paths.');
}
function writeGenerated(rows){
 const mediaFile=path.join(root,'encounter-media.js');
 delete require.cache[mediaFile];
 const mapping=fs.existsSync(mediaFile)?require(mediaFile):{};const additions=[];const updated=new Set(rows.map(row=>row.scene.id));
 for(const {scene,photo,audio} of rows){
  mapping[scene.id]={photo:`assets/reference/${scene.id}-photo.jpg`,audio:`assets/reference/${scene.id}-audio.mp3`,soundEvidence:'audio'};
  additions.push(credit(scene.id,'bitmap',photo),credit(scene.id,'audio',audio));
 }
 fs.writeFileSync(mediaFile,`(function(root){\n'use strict';\n// Generated from Commons and Xeno-canto on ${new Date().toISOString().slice(0,10)}.\nconst media=${JSON.stringify(mapping,null,2)};\nif(typeof module==='object'&&module.exports)module.exports=media;else root.AvianEncounterMedia=media;\n})(globalThis);\n`);
 const creditsFile=path.join(references,'credits.json');
 const existing=JSON.parse(fs.readFileSync(creditsFile,'utf8')).filter(item=>!updated.has(String(item.case)));
 const credits=[...existing,...additions];
 fs.writeFileSync(creditsFile,JSON.stringify(credits,null,2)+'\n');
 fs.writeFileSync(path.join(root,'media-credits.js'),`window.AvianMediaCredits = ${JSON.stringify(credits,null,2)};\n`);
}
async function main(){
 if(process.argv.includes('--repair-credits')){repairCreditPaths();return;}
 console.log(`Looking up ${scenes.length} added encounters (Commons image + Xeno-canto recording)…`);
 const rows=await mapLimit(scenes,Math.max(1,concurrency),lookup);
 const failures=rows.filter(r=>!r.photo||!r.audio);
 console.table(rows.map(r=>({id:r.scene.id,latin:r.scene.latin,image:r.photo?'ok':'missing',audio:r.audio?'ok':'missing',error:r.error||''})));
 if(failures.length){console.error(`Missing a usable, attributed asset for ${failures.length} encounter(s):`,failures.map(r=>r.scene.id).join(', '));process.exitCode=2;return;}
 if(dry){console.log('Dry run passed: every selected encounter has a usable image and recording.');return;}
 for(const row of rows){
  const photoTemp=path.join(references,`.${row.scene.id}-photo.source`),audioTemp=path.join(references,`.${row.scene.id}-audio.source`);
  const photoOut=path.join(references,`${row.scene.id}-photo.jpg`),audioOut=path.join(references,`${row.scene.id}-audio.mp3`);
  console.log(`Downloading ${row.scene.id} ${row.scene.latin}`);
  try{
   await download(row.photo.download,photoTemp);transcode(photoTemp,photoOut,['-vf','scale=min(960\\,iw):-2','-frames:v','1','-q:v','3']);
   await download(row.audio.download,audioTemp);transcode(audioTemp,audioOut,['-t','18','-vn','-ac','1','-ar','44100','-b:a','96k']);
  }finally{for(const temp of [photoTemp,audioTemp])if(fs.existsSync(temp))fs.unlinkSync(temp);}
 }
 writeGenerated(rows);
 console.log(`Downloaded and attributed ${rows.length} images and ${rows.length} recordings.`);
}
main().catch(error=>{console.error(error);process.exit(1)});
