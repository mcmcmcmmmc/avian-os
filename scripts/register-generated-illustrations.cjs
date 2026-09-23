#!/usr/bin/env node
/*
  Registers AI-generated educational reconstructions for encounters where no
  attributable reference photograph is presently available. These images are
  deliberately distinct from Commons/Xeno-canto source media: they are not
  photos, sightings, or standalone identification evidence.
*/
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const refs=path.join(root,'assets/reference');
const ids=['e57','e58','e59','e76','e79','e80','e94','e95','e97','e101','e102','e103','e104','e105','e106','e107','e108','e109','e110'];
const bank=require(path.join(root,'encounter-bank.js')).scenes;
const mediaPath=path.join(root,'encounter-media.js');
const creditsPath=path.join(refs,'credits.json');

delete require.cache[mediaPath];
const media=require(mediaPath);
const cases=ids.map(id=>{
 const scene=bank.find(item=>item.id===id);if(!scene)throw new Error(`Unknown encounter ${id}`);
 const file=`assets/reference/${id}-photo.jpg`;if(!fs.existsSync(path.join(root,file)))throw new Error(`Missing generated image ${file}`);
 return {id,scene,file};
});
for(const {id,file} of cases)media[id]={...(media[id]||{}),photo:file,soundEvidence:media[id]?.audio?'audio':'field-note'};
const credits=JSON.parse(fs.readFileSync(creditsPath,'utf8')).filter(item=>!cases.some(entry=>entry.id===item.case&&item.type==='bitmap'));
for(const {id,scene,file} of cases)credits.push({
 case:id,type:'bitmap',file,title:`AI-generated educational reconstruction — ${scene.answer} (${scene.latin})`,
 author:'AVIAN-OS / OpenAI Image Generation',license:'AI-generated educational reconstruction (not a source photograph)',licenseUrl:'',
 source:scene.sources[0]?.url||'https://wildbeijing.org/status-of-the-birds-of-beijing-interactive/',
 description:'A research-informed fictional field-observation visual. It is not a real bird photograph, recording, sighting, or independent identification source.',
 change:'Generated as a non-photographic teaching reconstruction from the encounter’s documented species and habitat constraints; no particular published image was copied.',generated:true
});
fs.writeFileSync(mediaPath,`(function(root){\n'use strict';\n// Generated media mapping: attributed Commons/Xeno-canto assets plus clearly labelled AI teaching illustrations.\nconst media=${JSON.stringify(media,null,2)};\nif(typeof module==='object'&&module.exports)module.exports=media;else root.AvianEncounterMedia=media;\n})(globalThis);\n`);
fs.writeFileSync(creditsPath,JSON.stringify(credits,null,2)+'\n');
fs.writeFileSync(path.join(root,'media-credits.js'),`window.AvianMediaCredits = ${JSON.stringify(credits,null,2)};\n`);
console.log(`Registered ${cases.length} AI-generated teaching illustrations.`);
