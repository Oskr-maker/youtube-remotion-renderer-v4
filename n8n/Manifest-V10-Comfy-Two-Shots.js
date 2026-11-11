/**
 * n8n Code | Run Once for All Items
 * TEST - two ComfyUI clips. Paste the two HTTP MP4 URLs returned by
 * POST /media/upload-comfy after testing them in a browser.
 * This is a visual smoke test, NOT the production long-form manifest.
 */
const assets=[
 {shotId:'S1_SHOT_01',sceneId:'S1',sceneTitle:'Introducción',url:'REPLACE_WITH_S1_MP4_URL',caption:'Introducción visual sobre experimentos de IA'},
 {shotId:'S4_SHOT_01',sceneId:'S4',sceneTitle:'Nota de voz',url:'REPLACE_WITH_S4_MP4_URL',caption:'Ejemplo visual de una nota de voz'}
];
for(const a of assets){
 if(!/^https:\/\/[^\s]+\.mp4(?:\?[^\s]*)?$/.test(a.url)){
  throw new Error('Falta URL HTTPS MP4 válida para '+a.shotId+'; sube el archivo primero.');
 }
}
const fps=30;
const perShotFrames=61; // 2.03 s, fits 49 frames at 24 fps from ComfyUI.
let startFrame=0;
const timelineShots=assets.map((a,i)=>{
 const durationFrames=perShotFrames;
 const url=a.url;
 const shot={
  shotId:a.shotId,sceneId:a.sceneId,sceneTitle:a.sceneTitle,sceneType:'documentary',
  shotNumber:1,productionSequence:i+1,startFrame,durationFrames,
  durationSec:durationFrames/fps,
  template:'generic',layout:'metric_story',
  visualCategory:'real_world',visualMode:'stock_plus_motion_overlay',
  editorialVisualBrief:{shotId:a.shotId,sceneId:a.sceneId,concept:'ai_generated_illustration',
    primaryObject:i===0?'laptop':'smartphone',
    visualInstruction:a.caption,voiceoverExcerpt:null},
  stock:{available:true,use:'background_support',url,provider:'comfyui_local',
    asset:{type:'ai_generated_video',provider:'comfyui_local',url,src:url,
      accepted:true,sourceDurationSec:49/24,width:640,height:352}},
  visualAsset:{shotId:a.shotId,sceneId:a.sceneId,provider:'comfyui_local',
    type:'ai_generated_video',renderMethod:'external_video',
    url,src:url,accepted:true,ready:true},
  ui:{components:[]},graphics:{layers:[]},
  motion:{actions:['camera_push_in']},textElements:[a.sceneTitle],ready:true
 };
 startFrame+=durationFrames;
 return shot;
});
const manifest={
 renderTarget:{compositionId:'YouTubeV4'},
 motionGraphicsReady:true,fps,width:1920,height:1080,
 totalDurationSec:startFrame/fps,totalDurationFrames:startFrame,
 timelineShots
};
return [{json:{shotId:'S1_SHOT_01',testMode:true,manifest}}];
