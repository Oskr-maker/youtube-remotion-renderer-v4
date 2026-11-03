/**
 * PREP - Cinematic Search Queries V2
 * n8n Code | Run Once for All Items
 * INPUT: V6.8 - ENRICH - Semantic Assets (75 shot items)
 * OUTPUT: <= 2 focused research queries per eligible scene
 * NOT a final shot-to-asset assignment; no invented footage or auto approval.
 */
const A=x=>Array.isArray(x)?x:[];
const O=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const T=x=>String(x??'').trim();
const plans={
 S1:['professional computer workstation documentary','laptop computer close up workflow'],
 S2:['checking document facts research','person verifying information sources'],
 S3:['handwritten notes on desk','sorting paper notes notebook'],
 S4:['spreadsheet rows on computer monitor','data table laptop screen'],
 S5:['source citations research documents','fact checking books documents'],
 S6:['digital image editing monitor','photo editing creative workspace'],
 S7:['automation workflow diagram computer','software developer connecting workflow'],
 S8:['computer error warning screen','person troubleshooting laptop'],
 S9:['computer data privacy security','password protection laptop screen'],
 S10:['task comparison decision making','reviewing results notes checklist']
};
const items=$input.all().map(x=>O(x.json));
const byScene=new Map();
for(const d of items){
 const scene=T(d.sceneId||d.narrationContext?.sceneId),shot=T(d.shotId);
 if(!scene||!shot||scene==='S0'||scene==='S11')continue;
 if(!byScene.has(scene))byScene.set(scene,[]);
 byScene.get(scene).push(d);
}
const output=[],seen=new Set();
for(const [scene,shots] of byScene){
 const queries=plans[scene]||[];
 const sorted=[...shots].sort((a,b)=>(Number(a.productionSequence)||0)-(Number(b.productionSequence)||0));
 for(let i=0;i<Math.min(queries.length,2);i++){
  const sh=sorted[Math.min(i,sorted.length-1)];
  const query=T(queries[i]);
  if(!query||seen.has(query))continue;
  seen.add(query);
  output.push({json:{
   shotId:sh.shotId,sceneId:scene,searchQuery:query,
   context:T(sh.narrationContext?.visualContextText||sh.narrationContext?.fullSceneNarration||sh.voiceoverExcerpt).slice(0,450),
   providers:['openverse','commons'],
   mediaTypes:['image','video'],limit:6,
   queryPlanVersion:'v2',autoApproved:false,
   mergeRequiresHumanOrVerifiedSemanticQC:true
  }});
 }
}
if(!output.length)throw Error('CINEMA V2: no eligible scene searches generated');
return output;
