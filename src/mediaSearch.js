/**
 * Multi-source documentary footage discovery for n8n.
 * Free official APIs: Wikimedia Commons, NASA Image Library, optional Pexels.
 * NO auto-approval: each candidate still requires relevance, rights and codec QA.
 * No new npm dependencies. Server-side Node 18+ fetch.
 */
const clean = s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,700);
const timeoutFetch = async(url,headers={})=>{
 const r=await fetch(url,{headers,signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error('HTTP '+r.status);
 return r.json();
};
const U=x=>typeof x==='string'&&/^https?:\/\//i.test(x);
const C=(provider,title,url,page,license,meta={})=>({provider,title,url,sourcePage:page,license:license||'review_required',approved:false,rightsVerified:false,renderVerified:false,...meta});
async function commons(q,limit){
 const params=new URLSearchParams({action:'query',generator:'search',gsrsearch:'filetype:video '+q,gsrnamespace:'6',gsrlimit:String(limit),prop:'imageinfo',iiprop:'url|extmetadata|mime',format:'json',origin:'*'});
 const j=await timeoutFetch('https://commons.wikimedia.org/w/api.php?'+params,{'User-Agent':'YouTubeFilmResearch/1.0 (editorial)'});
 return Object.values(j.query?.pages||{}).flatMap(p=>{
  const v=p.imageinfo?.[0],x=v?.extmetadata||{};
  if(!U(v?.url))return [];
  return [C('wikimedia',clean(x.ImageDescription?.value)||p.title,v.url,v.descriptionurl||'https://commons.wikimedia.org/wiki/'+encodeURIComponent(p.title.replaceAll(' ','_')),clean(x.LicenseShortName?.value)||'review_required',{mime:v.mime,credit:clean(x.Artist?.value),usageTerms:clean(x.UsageTerms?.value),licenseUrl:x.LicenseUrl?.value||null})];
 });
}
async function nasa(q,limit){
 const u='https://images-api.nasa.gov/search?'+new URLSearchParams({q,media_type:'video',page_size:String(limit)});
 const j=await timeoutFetch(u);
 const results=await Promise.allSettled((j.collection?.items||[]).slice(0,limit).map(async x=>{
  const d=x.data?.[0]||{},href=x.href;
  if(!U(href))return null;
  const files=await timeoutFetch(href);
  const video=(Array.isArray(files)?files:[]).find(z=>/\.(mp4|webm)(\?.*)?$/i.test(z));
  if(!U(video))return null;
  return C('nasa',d.title||'',video,'https://images.nasa.gov/details/'+encodeURIComponent(d.nasa_id||''),'review_nasa_guidelines',{description:clean(d.description),nasaId:d.nasa_id,credit:'NASA',rightsNote:'Check item-specific third-party rights and NASA media guidelines.'});
 }));
 return results.filter(x=>x.status==='fulfilled'&&x.value).map(x=>x.value);
}
async function pexels(q,limit){
 if(!process.env.PEXELS_API_KEY)return [];
 const u='https://api.pexels.com/v1/videos/search?'+new URLSearchParams({query:q,per_page:String(limit),orientation:'landscape'});
 const j=await timeoutFetch(u,{Authorization:process.env.PEXELS_API_KEY});
 return (j.videos||[]).flatMap(v=>{
  const files=(v.video_files||[]).filter(f=>U(f.link)&&f.file_type==='video/mp4');
  files.sort((a,b)=>Math.abs((a.width||0)-1920)-Math.abs((b.width||0)-1920));
  const f=files[0];
  if(!f)return [];
  return [C('pexels',v.user?.name||'Pexels stock video',f.link,v.url,'pexels_license_review',{width:f.width,height:f.height,durationSec:v.duration,creator:v.user?.name,creatorUrl:v.user?.url,rightsNote:'Review Pexels API attribution and license requirements'})];
 });
}
export async function searchEditorialMedia(query,{limit=6,providers=['commons','nasa','pexels']}={}){
 const q=String(query||'').trim().slice(0,100);
 if(q.length<3)throw Error('Search query must be at least 3 characters');
 const n=Math.min(12,Math.max(1,Number(limit)||6));
 const supported={commons,nasa,pexels};
 const selected=providers.filter(p=>supported[p]);
 const settled=await Promise.allSettled(selected.map(p=>supported[p](q,n)));
 const errors=[],candidates=[];
 settled.forEach((r,i)=>{if(r.status==='fulfilled')candidates.push(...r.value);else errors.push({provider:selected[i],error:String(r.reason?.message||r.reason)})});
 const unique=[...new Map(candidates.map(c=>[c.url,c])).values()];
 return {query:q,candidates:unique,providerErrors:errors,sourceCount:selected.length,autoApproved:false,
  note:'Candidates only. Check story relevance, rights, attribution, download, codec and Remotion accessibility before approval.'};
}
