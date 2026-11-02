/**
 * BUILD Film First Manifest V2.0
 * n8n Code, Run Once for All Items.
 * Connect V8 final manifest -> THIS -> SPLIT.
 * Supports approved assets from upstream nodes, item payload and matching IDs.
 * NEVER claims a link has been rendered or a licence has been validated.
 */
const O=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const A=x=>Array.isArray(x)?x:[];
const U=x=>typeof x==='string'&&/^https?:\/\//i.test(x);
const rootItems=$input.all();
if(rootItems.length!==1)throw Error('FILM FIRST: expected one V8 manifest, got '+rootItems.length);
const root=O(rootItems[0].json),m=A(root.manifest?.shots).length?O(root.manifest):root;
if(!A(m.shots).length)throw Error('FILM FIRST: missing V8 shots[]');
const names=['BUILD - Accepted Stock Asset','BUILD - Accepted Stock Asset V7.1','BUILD - Accepted Stock Asset V8.2','BUILD - Accepted Stock Asset V4'];
const found=[],readErrors=[];
const collect=(payload,source)=>{
 const d=O(payload),v=O(d.visualAsset),a=O(d.acceptedStockAsset),stock=O(d.uiMotionPlan?.stock);
 const url=[v.url,a.render?.url,d.stock?.url,stock.url].find(U);
 const approved=d.assetAccepted===true||a.accepted===true||v.accepted===true||stock.accepted===true;
 const shotId=String(d.shotId||v.shotId||a.shotId||'');
 if(approved&&shotId&&url)found.push({shotId,url,source,provider:v.provider||a.provider||stock.provider||'unknown'});
};
collect(root,'input');
for(const item of A(root.acceptedStockAssets))collect(item,'manifest.acceptedStockAssets');
for(const n of names){
 try{const items=$(n).all();for(const item of items)collect(item.json,n);}
 catch(e){readErrors.push({node:n,message:String(e.message||e)});}
}
const byId=new Map();
for(const a of found){
 const prev=byId.get(a.shotId);
 if(prev&&prev.url!==a.url)throw Error('FILM FIRST: conflicting approved URLs for '+a.shotId);
 byId.set(a.shotId,a);
}
const patched=m.shots.map(sh=>{
 if(sh.sceneId==='S0'&&(sh.locked||sh.preserveExistingRenderer||sh.visualAsset?.locked))return sh;
 const prev=O(sh.uiMotionPlan?.stock),asset=O(sh.visualAsset),own=O(sh.stock);
 const approved=byId.get(String(sh.shotId));
 const existing=[prev.available&&prev.url,own.available&&own.url,asset.accepted&&asset.url].find(U);
 const url=approved?.url||existing;
 if(!url)return sh;
 return {...sh,visualAsset:{...asset,type:'stock_video',ready:true,accepted:true,url,src:url,role:'primary',useInternalMotion:false,fallback:false},
   uiMotionPlan:{...O(sh.uiMotionPlan),stock:{...prev,available:true,accepted:true,use:'primary',url}},
   stock:{...own,available:true,accepted:true,use:'primary',url},
   filmFirstAsset:{source:approved?.source||'existing_approved_shot',verifiedRendererAccess:false,licenseVerified:false}};
});
const count=patched.filter(sh=>U(sh.stock?.url)&&sh.stock?.available===true).length;
const qc={version:'v2',totalShots:patched.length,approvedMediaShots:count,coveragePercent:Math.round(count/patched.length*100),matchedStockItems:found.length,readErrors,missingShotIds:patched.filter(sh=>!U(sh.stock?.url)).map(sh=>sh.shotId),ready:count>0};
if(!count)throw Error('FILM FIRST: no approved footage matched. Stock nodes read errors: '+JSON.stringify(readErrors)+'. Ensure accepted stock branch is executed and joined by shotId.');
const output={...m,shots:patched,filmFirstQC:qc};
return [{json:m===root?{...root,...output,filmFirstQC:qc}:{...root,manifest:output,filmFirstQC:qc}}];
