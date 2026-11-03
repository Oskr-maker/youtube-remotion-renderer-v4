/**
 * PREP - Cinematic Search Queries V3.1
 * n8n Code: Run Once for All Items
 * INPUT: V6.8 - ENRICH - Semantic Assets
 * OUTPUT: 1 documentary asset-search brief per eligible scene.
 *
 * Align search to actual narration, not to a hardcoded chapter number.
 * Prevents visually irrelevant B-roll from being approved.
 * NO new API cost, NO automatic asset approval.
 */

const asObject = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
const text = x => String(x ?? '').trim();
const normalize = s => text(s).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const items = $input.all().map(x => asObject(x.json));
const byScene = new Map();

for(const d of items) {
  const id=text(d.sceneId || d.narrationContext?.sceneId);
  if(!id || id === 'S0' || id === 'S11')continue;
  if(!byScene.has(id))byScene.set(id,[]);
  byScene.get(id).push(d);
}

// Editorially grounded in the actual voiceover contexts of this video.
// The matching rules take priority over scene numbering.
const stories=[
 {id:'voice_note',pattern:/nota de voz|audio de una reunion|idea grabada|transcri/,
  query:'voice recording smartphone microphone memo',visible:'Hands recording a voice memo on a phone; demonstrate a real transcript if available'},
 {id:'spreadsheet',pattern:/hoja de calculo|formula|celdas|excel/,
  query:'spreadsheet data cells laptop screen',visible:'Actual spreadsheet showing a formula and its result, not generic office B-roll'},
 {id:'photo_analysis',pattern:/analisis visual|foto de un escritorio|fotografia|analizar una imagen/,
  query:'desk photograph documents everyday objects',visible:'Real photo of a desk and the objects the AI must identify'},
 {id:'document',pattern:/documento extenso|resumir un documento|resumen de un documento|decisiones fechas/,
  query:'paper document with handwritten notes desk',visible:'Original marked-up document, highlighting real dates and decisions'},
 {id:'workflow',pattern:/flujo|formulario|solicitud de trabajo|encadenar/,
  query:'computer workflow automation form',visible:'Real form submission followed by visible steps in a workflow'},
 {id:'fact_check',pattern:/fuentes|dato inventado|respuesta correcta|verificar|comprobar informacion|seguridad del tono/,
  query:'fact checking source documents references',visible:'Side-by-side verified claim and its source; no invented evidence'},
 {id:'privacy',pattern:/datos de clientes|informacion real|nombres|permisos|privacidad|datos personales/,
  query:'data privacy document redaction laptop',visible:'Realistic redaction of private data before sending it to AI'},
 {id:'compare',pattern:/comparar|comparacion|tarea manual|experimentos|resultados/,
  query:'hands comparing handwritten checklist on desk',visible:'Actual before-after result comparison, including the manual baseline'}
];

function matchedPlan(context) {
 const norm=normalize(context);
 for(const p of stories)if(p.pattern.test(norm))return p;
 return null;
}

const out=[];
for(const [sceneId,shots] of byScene){
 const ordered=[...shots].sort((a,b)=>(Number(a.productionSequence)||0)-(Number(b.productionSequence)||0));
 const full=ordered.map(s=>text(s.narrationContext?.fullSceneNarration)).find(Boolean);
 const first=ordered[0];
 const context=full || [
   ...ordered.map(s=>s.narrationContext?.visualContextText).filter(Boolean),
   ...ordered.map(s=>s.voiceoverExcerpt).filter(Boolean)
 ].join(' ').slice(0,2200);
 // Specific opening intent wins over incidental keywords later in narration.
 const lead=normalize(context.slice(0,330));
 let plan=null;
 if(/misma peticion|primero vaga|luego especifica|redactar un correo/.test(lead)){
   plan={id:'prompt_comparison',query:'email writing computer keyboard',visible:'Two real email drafts from vague versus specific prompts, with annotated differences'};
 } else if(/solicitud de trabajo en un formulario|ahora junto varias piezas|un flujo podria/.test(lead)){
   plan={id:'workflow_demo',query:'online form computer screen automation',visible:'Real form with synthetic data -> workflow steps -> review notification'};
 } else if(/despues de estas pruebas|me quedo con una regla/.test(lead)){
   plan={id:'conclusion',query:'checklist notebook computer desk',visible:'Real before-after evidence and practical decision checklist summarizing verified experiments'};
 } else {
   plan=matchedPlan(context);
 }
 if(!plan){
   out.push({json:{
     shotId:first.shotId,sceneId,searchQuery:null,
     skipped:true,reason:'NO_GROUNDED_VISUAL_QUERY',
     context:context.slice(0,450),autoApproved:false
   }});
   continue;
 }
 out.push({json:{
   shotId:first.shotId,sceneId,
   searchQuery:plan.query,semanticConcept:plan.id,
   desiredVisualEvidence:plan.visible,
   context:context.slice(0,450),
   providers:['openverse','commons'],
   mediaTypes:['image','video'],
   limit:4,productionVisualPriority:['real_demonstration','relevant_documentary_asset','original_screenshot'],queryPlanVersion:'v3.1_narration_grounded',
   skipped:false,autoApproved:false,
   mergeRequiresHumanOrVerifiedSemanticQC:true
 }});
}
if(!out.length)throw Error('CINEMA V3: no eligible scenes');
return out;
