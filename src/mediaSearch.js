/**
 * Cinema-first discovery V2.2
 * Free sources: Openverse (licensed photos), Wikimedia Commons (photos and clips),
 * NASA (only explicit science/space topics). Pexels intentionally disabled.
 * No auto approval. Lexical rank is a conservative prefilter, NOT semantic verification.
 */
const trim = v => String(v ?? '').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const urlOK = v => typeof v === 'string' && /^https?:\/\//i.test(v);
const stop = new Set('the and for with from this that into some about video image photo photos film footage shot person people working work desk office on at of to in a an by de del la el los las en un una y para con por al que se como es sobre intro hook chapter experiment test example section summary conclusion'.split(' '));
const tokens = s => [...new Set(trim(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[a-z0-9]{3,}/g)||[])].filter(x=>!stop.has(x));
const errorResponse = r => new Error('HTTP '+r.status);
async function readJSON(url,headers={}){
 const r=await fetch(url,{headers,signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw errorResponse(r);
 return r.json();
}
const record=(provider,mediaType,title,url,sourcePage,license,extra={})=>({
 provider,mediaType,title:trim(title).slice(0,320),url,sourcePage,
 license:license||'review_required',approved:false,rightsVerified:false,renderVerified:false,
 semanticVerified:false,...extra
});
const safeLicense=x=>/^(?:CC0|Public domain|CC BY(?: [234]\.0)?|CC BY-SA(?: [234]\.0)?)$/i.test(trim(x));
const mediaScore=(candidate,query)=>{
 const q=tokens(query),text=[candidate.title,candidate.description||'',(candidate.tags||[]).join(' ')].join(' ');
 const t=new Set(tokens(text));
 if(!q.length)return 0;
 const matches=q.filter(x=>t.has(x)||[...t].some(y=>y.startsWith(x)&&x.length>=5)).length;
 return Math.round(100*matches/q.length);
};
async function commons(query,n,type){
 const kind=type==='image'?'filetype:bitmap':'filetype:video';
 const params=new URLSearchParams({action:'query',generator:'search',
  gsrsearch:kind+' '+query,gsrnamespace:'6',gsrlimit:String(Math.min(20,n*3)),
  prop:'imageinfo',iiprop:'url|extmetadata|mime|size',format:'json'});
 const j=await readJSON('https://commons.wikimedia.org/w/api.php?'+params,
   {'User-Agent':'CinemaFirstResearch/2.2 (non-commercial metadata research)'});
 return Object.values(j.query?.pages||{}).flatMap(p=>{
  const info=p.imageinfo?.[0],x=info?.extmetadata||{},mime=String(info?.mime||'');
  if(!urlOK(info?.url))return [];
  if(type==='image'&&!mime.startsWith('image/'))return [];
  if(type==='video'&&!mime.startsWith('video/'))return [];
  const license=trim(x.LicenseShortName?.value),title=trim(p.title.replace(/^File:/,'').replace(/\.[^.]+$/,'').replaceAll('_',' '));
  return [record('wikimedia',type,title,info.url,info.descriptionurl,license,{
   mime,credit:trim(x.Artist?.value).slice(0,200),licenseUrl:x.LicenseUrl?.value||null,
   width:info.width,height:info.height,licenseMetadataPresent:!!license,
   rightsReviewNeeded:true})];
 });
}
async function openverse(query,n){
 const params=new URLSearchParams({q:query,page_size:String(Math.min(20,n*3)),mature:'false'});
 const j=await readJSON('https://api.openverse.org/v1/images/?'+params);
 return (j.results||[]).flatMap(x=>{
  if(!urlOK(x.url)||!urlOK(x.foreign_landing_url))return [];
  const license=String(x.license||'').toLowerCase();
  if(!['cc0','by','by-sa'].includes(license))return [];
  const label=license==='cc0'?'CC0':license==='by'?'CC BY':'CC BY-SA';
  return [record('openverse','image',x.title,x.url,x.foreign_landing_url,label,{
   description:trim(x.title||''),tags:(x.tags||[]).map(t=>String(t.name||t)).slice(0,15),
   credit:x.creator||null,licenseUrl:x.license_url||null,width:x.width,height:x.height,
   attribution:x.attribution||null,rightsReviewNeeded:true})];
 });
}
async function nasa(query,n,type){
 const params=new URLSearchParams({q:query,media_type:type==='image'?'image':'video',page_size:String(Math.min(10,n*2))});
 const j=await readJSON('https://images-api.nasa.gov/search?'+params);
 const settled=await Promise.allSettled((j.collection?.items||[]).slice(0,n*2).map(async x=>{
  const d=x.data?.[0]||{},href=x.href;
  if(!urlOK(href))return null;
  const links=await readJSON(href);
  const ext=type==='image'?/\.(jpe?g|png)(\?.*)?$/i:/\.(mp4|webm)(\?.*)?$/i;
  const media=(Array.isArray(links)?links:[]).find(x=>ext.test(x));
  if(!urlOK(media))return null;
  return record('nasa',type,d.title,media,'https://images.nasa.gov/details/'+encodeURIComponent(d.nasa_id||''),
   'review_nasa_guidelines',{description:trim(d.description).slice(0,300),credit:'NASA',
    nasaId:d.nasa_id,rightsReviewNeeded:true});
 }));
 return settled.filter(x=>x.status==='fulfilled'&&x.value).map(x=>x.value);
}
const forbidden=/^(?:hook|intro|cta|outro|conclusion|section|experiment|experimento|capitulo|introduccion|resumen)(?:\s+\d+)?$/i;
const science=/(?:nasa|astronaut|rocket|space|planet|satellite|galaxy|telescope|mars|orbit|moon|solar|astronomi|espacio|planeta|cohete|misio[nn])/i;
export async function searchEditorialMedia(query,{limit=6,providers=['openverse','commons'],mediaTypes=['image','video'],context='',sceneId=''}={}){
 const q=trim(query).slice(0,130),n=Math.max(1,Math.min(8,Number(limit)||5));
 if(q.length<3||forbidden.test(q))return {query:q,candidates:[],providerErrors:[],
  sourceCount:0,autoApproved:false,blockedReason:'GENERIC_OR_INVALID_QUERY',shotContext:trim(context).slice(0,200)};
 const types=Array.isArray(mediaTypes)?mediaTypes.filter(x=>x==='image'||x==='video'):['image','video'];
 const requested=Array.isArray(providers)?providers:[];
 const tasks=[];
 if(requested.includes('openverse')&&types.includes('image'))tasks.push({name:'openverse',fn:()=>openverse(q,n)});
 if(requested.includes('commons')){
  if(types.includes('image'))tasks.push({name:'commons_images',fn:()=>commons(q,n,'image')});
  if(types.includes('video'))tasks.push({name:'commons_videos',fn:()=>commons(q,n,'video')});
 }
 // NASA is deliberately not searched for office/AI/productivity clips.
 if(requested.includes('nasa')&&science.test(q+' '+context)){
  if(types.includes('video'))tasks.push({name:'nasa_videos',fn:()=>nasa(q,n,'video')});
  if(types.includes('image'))tasks.push({name:'nasa_images',fn:()=>nasa(q,n,'image')});
 }
 const results=await Promise.allSettled(tasks.map(t=>t.fn()));
 const errors=[],all=[];
 results.forEach((r,i)=>r.status==='fulfilled'?all.push(...r.value):errors.push({provider:tasks[i].name,error:String(r.reason?.message||r.reason)}));
 const ranked=[...new Map(all.filter(x=>urlOK(x.url)).map(x=>[x.url,x])).values()].map(c=>({
  ...c,lexicalScore:mediaScore(c,q),licenseMetadataRecognized:safeLicense(c.license)
 })).filter(c=>c.lexicalScore>=35).sort((a,b)=>b.lexicalScore-a.lexicalScore).slice(0,n*2);
 return {query:q,sceneId,candidates:ranked,rawCandidateCount:all.length,
  rejectedByLexicalFilter:Math.max(0,all.length-ranked.length),providerErrors:errors,
  sourceCount:tasks.length,autoApproved:false,
  note:'Unverified candidates. Lexical score is not semantic proof. Preview relevance, source rights, attribution, codecs and URL before accepting.'};
}
