/**
 * TEST - Pick Real Media V16
 * n8n Code | Run Once for All Items
 * Input: V12 - APPLY Editorial Treatments
 * Selects only contiguous real-media shots; never silently falls back to graphics.
 * Will also work for a single approved-media shot.
 */
const A=v=>Array.isArray(v)?v:[];
const O=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const U=v=>typeof v==='string'&&/^https?:\/\//i.test(v);
const entries=[];
for(const item of $input.all()){
 const d=O(item.json),m=O(d.manifest);
 for(const sh of A(m.timelineShots).length?m.timelineShots:A(m.shots)){
  const stock=O(sh.stock),planStock=O(sh.uiMotionPlan?.stock),asset=O(sh.visualAsset);
  const url=[stock.available&&stock.url,planStock.available&&planStock.url,asset.accepted&&asset.url].find(U);
  if(url&&sh.sceneId!=='S0'){
   entries.push({m,shot:{...sh,stock:{...stock,available:true,use:'primary',accepted:true,url}},url});
  }
 }
}
if(!entries.length)throw new Error('TEST V16: no approved real media shots reached this node. The previous film-first node may report global media, but this branch or scene contains none.');
entries.sort((a,b)=>(Number(a.shot.productionSequence)||0)-(Number(b.shot.productionSequence)||0));
const chosen=[entries[0]];
for(let i=1;i<entries.length&&chosen.length<4;i++){
 const prev=chosen[chosen.length-1].shot,cur=entries[i].shot;
 if(cur.sceneId!==prev.sceneId||Number(cur.productionSequence)!==Number(prev.productionSequence)+1)break;
 chosen.push(entries[i]);
}
const fps=Number(chosen[0].m.fps)||30;
let offset=0;
const shots=chosen.map(x=>{
 const frames=Number(x.shot.durationFrames)||Math.round(Number(x.shot.durationSec)*fps);
 if(!Number.isInteger(frames)||frames<=0)throw new Error('TEST V16: invalid duration for '+x.shot.shotId);
 const sh={...x.shot,startFrame:offset,endFrame:offset+frames,startSec:offset/fps,endSec:(offset+frames)/fps,durationFrames:frames,durationSec:frames/fps,previewOnly:true};
 offset+=frames;return sh;
});
const m={...chosen[0].m,manifestVersion:'v16_real_media_preview',shot:shots[0],shotId:shots[0].shotId,sceneId:shots[0].sceneId,shotCount:shots.length,timelineShots:shots,scenes:shots.map(sh=>({sceneId:sh.sceneId,shotId:sh.shotId,durationFrames:sh.durationFrames,durationSec:sh.durationSec})),totalDurationFrames:offset,totalDurationSec:offset/fps,fps,compositionId:'YouTubeV4',motionGraphicsReady:true,productionReady:true,readyForRender:true,previewOnly:true};
return [{json:{manifest:m,testVersion:'v16_real_media_preview',testReady:true,testShotIds:shots.map(sh=>sh.shotId),testRealMediaCount:shots.length,testDurationSec:offset/fps,testMediaUrls:chosen.map(x=>x.url)}}];
