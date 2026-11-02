/**
 * n8n Code: Film First Manifest Media Bridge V1
 * Mode: Run Once for All Items
 * Position: directly after V8 Final Semantic Visual Manifest,
 * before SPLIT V4 Render Sections.
 *
 * Uses confirmed accepted media from 'BUILD - Accepted Stock Asset V7.1'
 * or 'BUILD - Accepted Stock Asset V8.2'. Does not fabricate footage.
 */
const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const A=v=>Array.isArray(v)?v:[];
const valid=v=>typeof v==='string'&&/^https?:\/\//i.test(v);
const inputs=$input.all();
if(inputs.length!==1)throw new Error('FILM FIRST: expected exactly one final visual manifest.');
const root=O(inputs[0].json);
const m=A(root.manifest?.shots).length?O(root.manifest):A(root.shots).length?root:null;
if(!m)throw new Error('FILM FIRST: missing V8 shots.');
const accepted=[];
for(const nodeName of ['BUILD - Accepted Stock Asset V8.2','BUILD - Accepted Stock Asset V7.1','BUILD - Accepted Stock Asset V4']){
 try {
  for(const item of $(nodeName).all()){
   const d=O(item.json),asset=O(d.acceptedStockAsset),visual=O(d.visualAsset);
   const url=String(visual.url||asset.render?.url||'');
   if((d.accepted===true||asset.accepted===true)&&d.shotId&&valid(url))
    accepted.push({shotId:String(d.shotId),url,provider:visual.provider||asset.provider||'unknown',sourceNode:nodeName});
  }
 }catch(e){ /* optional upstream name not in this workflow */ }
}
const media=new Map();
for(const x of accepted){
 const previous=media.get(x.shotId);
 if(previous&&previous.url!==x.url)throw new Error('FILM FIRST: conflicting media for '+x.shotId);
 media.set(x.shotId,x);
}
const shots=m.shots.map(sh=>{
 const x=media.get(String(sh.shotId));
 if(!x)return sh;
 if(sh.sceneId==='S0'&&sh.preserveExistingRenderer===true)return sh;
 return {...sh,
  visualAsset:{...O(sh.visualAsset),type:'stock_video',provider:x.provider,accepted:true,ready:true,role:'primary',url:x.url,src:x.url,useInternalMotion:false,fallback:false},
  uiMotionPlan:{...O(sh.uiMotionPlan),stock:{...O(sh.uiMotionPlan?.stock),available:true,use:'primary',accepted:true,url:x.url,provider:x.provider}},
  stock:{...O(sh.stock),available:true,use:'primary',accepted:true,url:x.url,provider:x.provider},
  acceptedStockBridge:{version:'v1',source:x.sourceNode,assetVerifiedByPipeline:true,rendererAccessVerified:false}
 };
});
const withVideo=shots.filter(sh=>sh.uiMotionPlan?.stock?.available===true&&valid(sh.uiMotionPlan.stock.url)).length;
const filmFirstQC={version:'v1',totalShots:shots.length,shotsWithApprovedVideo:withVideo,missingVideo:shots.length-withVideo,coveragePercent:Math.round(100*withVideo/shots.length),readyForFilmFirstRender:withVideo>0};
if(!withVideo)throw new Error('FILM FIRST: 0 approved real videos reached manifest. Check accepted stock upstream and merge. No render requested.');
const patched={...m,shots,filmFirstQC};
return [{json:{...root,...(m===root?patched:{manifest:patched}),filmFirstQC}}];
