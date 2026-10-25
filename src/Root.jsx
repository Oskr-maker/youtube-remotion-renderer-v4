import React from 'react';
import {
  AbsoluteFill,
  Composition,
  Sequence,
  Video,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ======================================================
// YOUTUBE V5 LONG FORM VISUAL ENGINE
// VERSION: v5.5_full_visual_upgrade
//
// Mantiene S0 / logic_hook con la lógica ya aprobada.
// Rehace de una vez las familias reales del manifest:
// - logic_hook
// - ui_explainer
// - logic_reasoning
// - generic
// - comparison
// - privacy_risk
// - cta
// ======================================================

const DEFAULT_PROPS = {
  totalDurationFrames: 300,
  fps: 30,
  timelineShots: [],
  scenes: [],
  scene: null,
  visual: null,
};

const COLORS = {
  bg: '#05070c',
  bg2: '#09111c',
  panel: '#111827',
  panel2: '#182235',
  white: '#ffffff',
  soft: 'rgba(255,255,255,.74)',
  muted: 'rgba(255,255,255,.46)',
  blue: '#6d7cff',
  cyan: '#29d3ff',
  green: '#19d6a3',
  amber: '#ffbd59',
  red: '#ff6676',
  purple: '#a879ff',
  cardboard: '#9a6a3a',
  cardboardDark: '#694526',
  cardboardLight: '#bf8950',
  border: 'rgba(255,255,255,.14)',
};

const FONT = 'Arial, Helvetica, sans-serif';

const safeArray = (value) => (Array.isArray(value) ? value : []);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const normalize = (value) => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
const hashString = (value) => {
  const s = String(value || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
const shortText = (value, max = 90) => {
  const s = String(value || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  return s.length <= max ? s : `${s.slice(0, max - 1).trim()}…`;
};
const getTemplate = (shot) => normalize(shot?.template || shot?.visual?.template || shot?.scene?.template || 'generic');
const getLayout = (shot) => normalize(shot?.layout || shot?.visual?.layout || shot?.scene?.layout || 'generic');
const getDurationFrames = (shot) => Math.max(1, Number(shot?.durationFrames || 1));
const getTextElements = (shot) => safeArray(shot?.textElements || shot?.visual?.textElements || shot?.scene?.textElements);
const getHeadline = (shot) =>
  shot?.title || shot?.sceneTitle || getTextElements(shot)[0] || shot?.visualIdea || 'Información clave';
const getSupportingText = (shot) => {
  const texts = getTextElements(shot).filter(Boolean);
  const extra = [shot?.visualIdea, shot?.voiceover, shot?.description].filter(Boolean);
  return [...texts.slice(1), ...extra].filter(Boolean);
};
const getStockUrl = (shot) => {
  const stock = shot?.stock || shot?.visual?.stock || shot?.scene?.stock || null;
  if (stock?.available === true && stock?.url) return stock.url;
  const layer = safeArray(shot?.layers).find((x) => x?.type === 'video' && x?.sourceURL);
  return layer?.sourceURL || shot?.asset?.url || shot?.visualAsset?.url || shot?.videoUrl || null;
};

const BaseBackground = () => (
  <AbsoluteFill style={{background: 'linear-gradient(135deg,#05070c 0%,#09111c 52%,#05070c 100%)'}} />
);

const Grid = ({opacity = 0.04}) => (
  <AbsoluteFill
    style={{
      opacity,
      backgroundImage:
        'linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)',
      backgroundSize: '72px 72px',
      pointerEvents: 'none',
    }}
  />
);

const AmbientGlow = ({left = '50%', top = '50%', size = 800, color = '109,124,255', opacity = 0.18}) => (
  <div
    style={{
      position: 'absolute',
      left,
      top,
      width: size,
      height: size,
      transform: 'translate(-50%,-50%)',
      borderRadius: '50%',
      background: `radial-gradient(circle,rgba(${color},${opacity}) 0%,rgba(${color},0) 68%)`,
      pointerEvents: 'none',
    }}
  />
);

const Vignette = ({opacity = 0.34}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(circle at 50% 45%,transparent 38%,rgba(0,0,0,${opacity}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

const GlassPanel = ({children, style = {}}) => (
  <div
    style={{
      background: 'linear-gradient(145deg,rgba(14,20,32,.92),rgba(6,10,18,.84))',
      border: `1px solid ${COLORS.border}`,
      boxShadow: '0 28px 90px rgba(0,0,0,.38)',
      borderRadius: 26,
      ...style,
    }}
  >
    {children}
  </div>
);

const Badge = ({children, color = COLORS.blue}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '9px 16px',
      borderRadius: 999,
      background: `${color}22`,
      border: `1px solid ${color}66`,
      color: '#fff',
      fontFamily: FONT,
      fontSize: 20,
      fontWeight: 800,
      letterSpacing: .6,
    }}
  >
    {children}
  </div>
);

const SectionLabel = ({children, color = COLORS.cyan}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontFamily: FONT,
      color: COLORS.soft,
      fontWeight: 850,
      fontSize: 20,
      letterSpacing: 2.4,
      textTransform: 'uppercase',
    }}
  >
    <div style={{width: 36, height: 4, borderRadius: 999, background: color, boxShadow: `0 0 22px ${color}88`}} />
    {children}
  </div>
);

const HeroTitle = ({children, size = 70, width = 1100, align = 'left', style = {}}) => (
  <div
    style={{
      maxWidth: width,
      color: '#fff',
      fontFamily: FONT,
      fontSize: size,
      lineHeight: 1.02,
      fontWeight: 900,
      letterSpacing: -2.3,
      textAlign: align,
      textShadow: '0 15px 48px rgba(0,0,0,.55)',
      ...style,
    }}
  >
    {children}
  </div>
);

const ProgressBar = ({progress, color = COLORS.cyan, width = 300}) => (
  <div style={{width, height: 8, background: 'rgba(255,255,255,.08)', borderRadius: 99, overflow: 'hidden'}}>
    <div style={{height: '100%', width: `${clamp(progress, 0, 1) * 100}%`, background: color, boxShadow: `0 0 24px ${color}88`}} />
  </div>
);

const CinematicVideo = ({shot, darkness = .2, zoomStart = 1.02, zoomEnd = 1.09}) => {
  const frame = useCurrentFrame();
  const duration = getDurationFrames(shot);
  const src = getStockUrl(shot);
  if (!src) return null;
  const p = clamp(frame / duration, 0, 1);
  const scale = interpolate(p, [0, 1], [zoomStart, zoomEnd]);
  const panX = interpolate(p, [0, 1], [-12, 14]);
  return (
    <>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Video
          src={src}
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `translateX(${panX}px) scale(${scale})`,
            filter: 'saturate(1.08) contrast(1.06) brightness(.98)',
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{background: `rgba(2,5,10,${darkness})`}} />
      <Vignette opacity={.28} />
    </>
  );
};

const AppleIcon = ({size = 82}) => (
  <svg width={size} height={size} viewBox="0 0 120 120">
    <defs>
      <radialGradient id="appleGradient" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#ff7b82" />
        <stop offset="55%" stopColor="#e94a55" />
        <stop offset="100%" stopColor="#a91f2c" />
      </radialGradient>
    </defs>
    <path d="M60 34 C45 19 25 26 20 47 C14 72 30 102 57 105 C84 108 104 81 101 55 C98 31 74 22 60 34 Z" fill="url(#appleGradient)" />
    <path d="M59 33 C58 21 63 13 72 8" stroke="#68432c" strokeWidth="7" strokeLinecap="round" fill="none" />
    <path d="M69 15 C82 11 89 16 92 26 C80 27 72 23 69 15 Z" fill="#35b36c" />
    <ellipse cx="42" cy="48" rx="11" ry="18" fill="rgba(255,255,255,.14)" transform="rotate(25 42 48)" />
  </svg>
);

const OrangeIcon = ({size = 82}) => (
  <svg width={size} height={size} viewBox="0 0 120 120">
    <defs>
      <radialGradient id="orangeGradient" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#ffc05b" />
        <stop offset="55%" stopColor="#ff951f" />
        <stop offset="100%" stopColor="#cf6210" />
      </radialGradient>
    </defs>
    <circle cx="60" cy="64" r="43" fill="url(#orangeGradient)" />
    <path d="M59 21 C65 11 75 8 86 11 C81 22 72 27 59 21 Z" fill="#38ad61" />
    <path d="M60 24 C60 17 60 12 62 8" stroke="#725034" strokeWidth="6" strokeLinecap="round" fill="none" />
    <ellipse cx="43" cy="48" rx="9" ry="15" fill="rgba(255,255,255,.15)" transform="rotate(30 43 48)" />
  </svg>
);

const FruitDisplay = ({type, size = 82}) => {
  if (type === 'apple') return <AppleIcon size={size} />;
  if (type === 'orange') return <OrangeIcon size={size} />;
  return <div style={{display: 'flex', gap: 4}}><AppleIcon size={size * .78} /><OrangeIcon size={size * .78} /></div>;
};

const CardboardBox = ({label, fruitType, errorProgress = 0, entrance = 1}) => (
  <div
    style={{
      width: 390,
      height: 325,
      position: 'relative',
      opacity: entrance,
      transform: `translateY(${(1 - entrance) * 56}px) scale(${entrance}) perspective(900px) rotateX(-2deg)`,
      transformOrigin: 'center bottom',
    }}
  >
    <div style={{position: 'absolute', left: 35, right: 35, bottom: -24, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,.56)', filter: 'blur(19px)'}} />
    <div
      style={{
        position: 'absolute', left: 18, right: 18, top: 58, bottom: 0,
        borderRadius: '10px 10px 24px 24px',
        background: `linear-gradient(145deg,${COLORS.cardboardLight},${COLORS.cardboard} 52%,${COLORS.cardboardDark})`,
        border: '1px solid rgba(255,255,255,.12)',
        boxShadow: '0 38px 105px rgba(0,0,0,.56), inset 0 1px 0 rgba(255,255,255,.10)',
        overflow: 'hidden',
      }}
    >
      <div style={{position: 'absolute', inset: 0, opacity: .21, backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,.09) 0px,rgba(255,255,255,.09) 1px,transparent 1px,transparent 5px)'}} />
      <div style={{position: 'absolute', inset: 0, opacity: .09, backgroundImage: 'repeating-linear-gradient(90deg,rgba(80,40,15,.18) 0px,rgba(80,40,15,.18) 1px,transparent 1px,transparent 9px)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 40, display: 'flex', justifyContent: 'center', filter: 'drop-shadow(0 15px 22px rgba(0,0,0,.32))'}}>
        <FruitDisplay type={fruitType} size={fruitType === 'mixed' ? 90 : 100} />
      </div>
      <div style={{position: 'absolute', left: 33, right: 33, bottom: 28, padding: '17px 16px', borderRadius: 10, background: 'linear-gradient(180deg,#f7edd9,#ead9b8)', border: '1px solid rgba(76,50,28,.40)', textAlign: 'center', color: '#3d2b1d', fontFamily: FONT, fontSize: 25, fontWeight: 950, letterSpacing: 1.2}}>
        {label}
      </div>
      <div style={{position: 'absolute', right: 18, top: 16, width: 54, height: 54, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,.94)', border: `3px solid ${COLORS.red}`, color: COLORS.red, fontFamily: FONT, fontSize: 34, fontWeight: 950, opacity: errorProgress, transform: `scale(${.55 + errorProgress * .45})`}}>×</div>
    </div>
    <div style={{position: 'absolute', left: 34, top: 16, width: 155, height: 74, background: `linear-gradient(135deg,${COLORS.cardboardLight},${COLORS.cardboard})`, clipPath: 'polygon(0 20%,100% 0,88% 100%,12% 100%)', transform: 'rotate(-7deg)', boxShadow: '0 10px 24px rgba(0,0,0,.20)'}} />
    <div style={{position: 'absolute', right: 34, top: 16, width: 155, height: 74, background: `linear-gradient(225deg,${COLORS.cardboardLight},${COLORS.cardboard})`, clipPath: 'polygon(0 0,100% 20%,88% 100%,12% 100%)', transform: 'rotate(7deg)', boxShadow: '0 10px 24px rgba(0,0,0,.20)'}} />
  </div>
);

// ======================================================
// LOGIC HOOK — S0 PRESERVADO
// ======================================================

const LogicHookStage = ({shot}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const duration = getDurationFrames(shot);
  const progress = clamp(frame / duration, 0, 1);
  const texts = getTextElements(shot);
  const title1 = texts[0] || 'Tres cajas';
  const title2 = texts[1] || 'Todas las etiquetas están mal';
  const title3 = texts[2] || '¿Puedes resolverlo?';

  const headlineOpacity = interpolate(progress, [0, .08], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const box1 = spring({frame: Math.max(0, frame - 1), fps, config: {damping: 14, stiffness: 120, mass: .8}});
  const box2 = spring({frame: Math.max(0, frame - 3), fps, config: {damping: 14, stiffness: 120, mass: .8}});
  const box3 = spring({frame: Math.max(0, frame - 5), fps, config: {damping: 14, stiffness: 120, mass: .8}});
  const error1 = interpolate(progress, [.30, .38], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const error2 = interpolate(progress, [.37, .45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const error3 = interpolate(progress, [.44, .52], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wrongMessage = interpolate(progress, [.41, .49, .60, .68], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const questionProgress = interpolate(progress, [.68, .79], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const preQuestionOpacity = interpolate(progress, [.61, .73], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const boxesExitY = interpolate(progress, [.61, .73], [0, 65], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const boxesExitScale = interpolate(progress, [.61, .73], [1, .95], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const questionPunch = spring({frame: Math.max(0, frame - Math.round(duration * .68)), fps, config: {damping: 12, stiffness: 135, mass: .72}});
  const cameraScale = interpolate(progress, [0, .61], [1, 1.065], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const boxes = [
    {label: 'MANZANAS', fruitType: 'apple', entrance: box1, error: error1},
    {label: 'NARANJAS', fruitType: 'orange', entrance: box2, error: error2},
    {label: 'MEZCLA', fruitType: 'mixed', entrance: box3, error: error3},
  ];

  return (
    <AbsoluteFill style={{background: COLORS.bg, overflow: 'hidden'}}>
      <BaseBackground />
      <Grid opacity={.04} />
      <AmbientGlow left="48%" top="47%" size={1350} color="41,211,255" opacity={.18} />
      <AmbientGlow left="25%" top="60%" size={850} color="168,121,255" opacity={.08} />

      <AbsoluteFill style={{opacity: preQuestionOpacity, transform: `scale(${cameraScale})`}}>
        <div style={{position: 'absolute', top: 54, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: headlineOpacity}}>
          <SectionLabel color={COLORS.amber}>RETO DE LÓGICA</SectionLabel>
        </div>
        <div style={{position: 'absolute', top: 105, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: headlineOpacity}}>
          <HeroTitle size={70} width={1500} align="center">{title1}</HeroTitle>
        </div>
        <div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 58, transform: `translateY(${boxesExitY}px) scale(${boxesExitScale})`}}>
          {boxes.map((box) => <CardboardBox key={box.label} label={box.label} fruitType={box.fruitType} entrance={box.entrance} errorProgress={box.error} />)}
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 93, display: 'flex', justifyContent: 'center', opacity: wrongMessage, transform: `translateY(${(1 - wrongMessage) * 22}px)`}}>
          <div style={{padding: '19px 36px', borderRadius: 18, background: 'rgba(255,102,118,.11)', border: '1px solid rgba(255,102,118,.48)', color: COLORS.red, fontFamily: FONT, fontSize: 44, fontWeight: 950, boxShadow: '0 22px 75px rgba(0,0,0,.38)'}}>{title2}</div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{opacity: questionProgress, background: `rgba(3,5,10,${questionProgress * .94})`}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: questionProgress}}>
        <GlassPanel style={{padding: '46px 82px', transform: `translateY(${(1 - questionPunch) * 22}px) scale(${.84 + questionPunch * .16})`, textAlign: 'center', border: '1px solid rgba(41,211,255,.35)', background: 'linear-gradient(145deg,rgba(11,18,30,.96),rgba(5,9,16,.96))', boxShadow: '0 48px 155px rgba(0,0,0,.78),0 0 75px rgba(41,211,255,.10)'}}>
          <Badge color={COLORS.cyan}>PIENSA ANTES DE SEGUIR</Badge>
          <div style={{marginTop: 29, fontFamily: FONT, fontSize: 76, fontWeight: 950, color: '#fff', letterSpacing: -2.4}}>{title3}</div>
          <div style={{margin: '25px auto 0', width: 115, height: 4, borderRadius: 999, background: COLORS.cyan, boxShadow: '0 0 24px rgba(41,211,255,.75)', transform: `scaleX(${questionPunch})`}} />
        </GlassPanel>
      </AbsoluteFill>
      <Vignette opacity={.32} />
    </AbsoluteFill>
  );
};


// ======================================================
// V5.6 VISUAL PRIMITIVES — VISUAL FIRST
// ======================================================

const getImageUrl = (shot) => {
  const candidates = [
    shot?.imageUrl,
    shot?.image?.url,
    shot?.visual?.imageUrl,
    shot?.visualAsset?.imageUrl,
    shot?.visualAsset?.thumbnailUrl,
    shot?.thumbnailUrl,
    shot?.asset?.imageUrl,
  ].filter(Boolean);
  return candidates[0] || null;
};

const VisualIcon = ({type = 'ai', size = 120, color = COLORS.cyan}) => {
  const common = {fill: 'none', stroke: color, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round'};
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="52" fill={`${color}12`} stroke={`${color}55`} strokeWidth="2" />
      {type === 'shield' && <><path {...common} d="M60 20 L91 32 V55 C91 78 76 96 60 103 C44 96 29 78 29 55 V32 Z"/><path {...common} d="M45 60 L56 71 L78 46"/></>}
      {type === 'chart' && <><path {...common} d="M29 88 V35 M29 88 H94"/><path {...common} d="M38 76 L52 62 L65 69 L83 43 L94 49"/><circle cx="52" cy="62" r="4" fill={color}/><circle cx="83" cy="43" r="4" fill={color}/></>}
      {type === 'brain' && <><path {...common} d="M49 31 C34 24 25 37 31 50 C18 58 25 76 39 77 C39 92 55 98 60 85"/><path {...common} d="M71 31 C86 24 95 37 89 50 C102 58 95 76 81 77 C81 92 65 98 60 85"/><path {...common} d="M60 30 V87 M45 49 C52 48 57 53 60 59 M75 49 C68 48 63 53 60 59"/></>}
      {type === 'network' && <><circle cx="60" cy="33" r="10" fill={`${color}22`} stroke={color} strokeWidth="3"/><circle cx="35" cy="78" r="10" fill={`${color}22`} stroke={color} strokeWidth="3"/><circle cx="85" cy="78" r="10" fill={`${color}22`} stroke={color} strokeWidth="3"/><path {...common} d="M55 42 L40 68 M65 42 L80 68 M45 78 H75"/></>}
      {type === 'device' && <><rect x="27" y="23" width="66" height="73" rx="9" fill={`${color}0D`} stroke={color} strokeWidth="4"/><path {...common} d="M39 40 H80 M39 53 H72 M39 66 H84"/><circle cx="60" cy="84" r="4" fill={color}/></>}
      {type === 'ai' && <><rect x="30" y="31" width="60" height="54" rx="15" fill={`${color}0D`} stroke={color} strokeWidth="4"/><circle cx="48" cy="56" r="5" fill={color}/><circle cx="72" cy="56" r="5" fill={color}/><path {...common} d="M47 70 Q60 78 73 70 M60 31 V20 M52 20 H68 M23 48 H30 M90 48 H97"/></>}
    </svg>
  );
};

const Sparkline = ({progress = 1, color = COLORS.cyan, width = 520, height = 180, variant = 0}) => {
  const points = variant % 3 === 0
    ? [[0,.78],[.12,.67],[.24,.72],[.36,.48],[.48,.55],[.61,.32],[.74,.40],[.87,.18],[1,.23]]
    : variant % 3 === 1
    ? [[0,.72],[.14,.55],[.28,.62],[.40,.38],[.52,.44],[.67,.25],[.82,.31],[1,.12]]
    : [[0,.68],[.15,.74],[.28,.50],[.43,.54],[.58,.30],[.72,.36],[.86,.17],[1,.22]];
  const shown = points.map(([x,y], i) => [x, y, clamp(progress * points.length - i, 0, 1)]);
  const path = shown.map(([x,y,v], i) => `${i===0?'M':'L'} ${x*width} ${y*height + (1-v)*25}`).join(' ');
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
    {[.25,.5,.75].map((g)=><line key={g} x1="0" y1={g*height} x2={width} y2={g*height} stroke="rgba(255,255,255,.08)" strokeWidth="1"/>)}
    <path d={path} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 10px rgba(41,211,255,.35))" />
    {shown.map(([x,y,v],i)=><circle key={i} cx={x*width} cy={y*height+(1-v)*25} r={i===shown.length-1?7:4} fill={color} opacity={v}/>) }
  </svg>;
};

const MiniBars = ({progress = 1, color = COLORS.purple, values = [.38,.64,.51,.82,.70,.93], width = 520, height = 240}) => (
  <div style={{width, height, display:'flex', alignItems:'end', gap:18, padding:'0 10px 8px'}}>
    {values.map((v,i)=>{
      const q=clamp(progress*1.35-i*.08,0,1);
      return <div key={i} style={{flex:1,height:`${Math.max(8,v*q*100)}%`,borderRadius:'12px 12px 4px 4px',background:`linear-gradient(180deg,${color},${color}55)`,boxShadow:q>.8?`0 0 28px ${color}44`:'none',position:'relative'}}><div style={{position:'absolute',top:-28,left:0,right:0,textAlign:'center',fontFamily:FONT,fontSize:16,fontWeight:900,color:COLORS.soft,opacity:q}}>{Math.round(v*100)}</div></div>;
    })}
  </div>
);

const DonutGauge = ({progress = 1, value = .82, color = COLORS.green, label = 'CALIDAD', size = 230}) => {
  const r=82,c=2*Math.PI*r,dash=c*value*progress;
  return <div style={{position:'relative',width:size,height:size}}><svg width={size} height={size} viewBox="0 0 230 230" style={{transform:'rotate(-90deg)'}}><circle cx="115" cy="115" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="18"/><circle cx="115" cy="115" r={r} fill="none" stroke={color} strokeWidth="18" strokeLinecap="round" strokeDasharray={`${dash} ${c-dash}`} style={{filter:`drop-shadow(0 0 12px ${color}55)`}}/></svg><div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:FONT,fontSize:42,fontWeight:950,color:'#fff'}}>{Math.round(value*progress*100)}%</div><div style={{fontFamily:FONT,fontSize:16,fontWeight:900,color:COLORS.muted,letterSpacing:1.6}}>{label}</div></div></div>;
};

const FlowDiagram = ({progress = 1, accent = COLORS.cyan, labels = ['INPUT','IA','VALIDACIÓN','OUTPUT']}) => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,width:'100%'}}>
    {labels.map((label,i)=>{
      const q=clamp(progress*1.35-i*.15,0,1);
      return <React.Fragment key={label}><div style={{width:145,height:105,borderRadius:22,background:`linear-gradient(145deg,${accent}18,rgba(255,255,255,.03))`,border:`1px solid ${q>.7?accent:'rgba(255,255,255,.10)'}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:.35+.65*q,transform:`scale(${.92+.08*q})`,boxShadow:q>.75?`0 0 34px ${accent}24`:'none'}}><VisualIcon type={i===0?'device':i===1?'brain':i===2?'shield':'chart'} size={48} color={accent}/><div style={{marginTop:8,fontFamily:FONT,fontSize:15,fontWeight:900,color:'#fff'}}>{label}</div></div>{i<labels.length-1&&<div style={{flex:1,height:3,background:'rgba(255,255,255,.08)',position:'relative',overflow:'hidden',borderRadius:99}}><div style={{position:'absolute',inset:0,width:`${clamp(progress*1.5-i*.18,0,1)*100}%`,background:accent,boxShadow:`0 0 18px ${accent}66`}}/></div>}</React.Fragment>;
    })}
  </div>
);

const BrowserMockup = ({shot, progress = 1, accent = COLORS.cyan}) => {
  const imageUrl = getImageUrl(shot);
  return <div style={{borderRadius:22,overflow:'hidden',background:'#0a101b',border:'1px solid rgba(255,255,255,.12)',boxShadow:'0 30px 90px rgba(0,0,0,.38)'}}><div style={{height:48,display:'flex',alignItems:'center',gap:8,padding:'0 18px',background:'rgba(255,255,255,.045)',borderBottom:'1px solid rgba(255,255,255,.08)'}}>{[COLORS.red,COLORS.amber,COLORS.green].map(c=><div key={c} style={{width:11,height:11,borderRadius:'50%',background:c}}/>)}<div style={{marginLeft:14,height:24,flex:1,borderRadius:8,background:'rgba(255,255,255,.05)'}}/></div><div style={{height:330,position:'relative',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>{imageUrl?<Img src={imageUrl} style={{width:'100%',height:'100%',objectFit:'cover',opacity:.9}}/>:<><div style={{position:'absolute',left:38,top:36,right:38,height:14,borderRadius:99,background:`linear-gradient(90deg,${accent},rgba(255,255,255,.08))`,transform:`scaleX(${.3+.7*progress})`,transformOrigin:'left'}}/><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18,width:'82%'}}>{['A','B','C'].map((x,i)=><div key={x} style={{height:150,borderRadius:18,background:'rgba(255,255,255,.035)',border:`1px solid ${i===Math.min(2,Math.floor(progress*3))?accent:'rgba(255,255,255,.08)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}><VisualIcon type={i===0?'device':i===1?'brain':'chart'} size={78} color={accent}/></div>)}</div></>}</div></div>;
};

// ======================================================
// UI EXPLAINER — 4 VARIANTES INTERNAS
// ======================================================

const UIExplainer = ({shot}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const duration = getDurationFrames(shot);
  const p = clamp(frame / duration, 0, 1);
  const title = shortText(getHeadline(shot), 68);
  const texts = getSupportingText(shot);
  const variant = hashString(shot?.shotId || title) % 4;
  const enter = spring({frame, fps, config:{damping:16,stiffness:105}});
  const items = [shortText(texts[0]||'Entrada',48),shortText(texts[1]||'Procesamiento',48),shortText(texts[2]||'Validación',48),shortText(texts[3]||'Resultado',48)];
  const active=Math.min(3,Math.floor(p*4));
  return <AbsoluteFill style={{background:COLORS.bg,overflow:'hidden'}}>
    <BaseBackground/><Grid opacity={.025}/><AmbientGlow left={variant%2?'28%':'73%'} top="47%" size={1200} color={variant>1?'168,121,255':'41,211,255'} opacity={.15}/>
    <div style={{position:'absolute',left:80,top:62}}><SectionLabel>EXPLICACIÓN</SectionLabel></div>
    <div style={{position:'absolute',left:80,top:125}}><HeroTitle size={54} width={1500}>{title}</HeroTitle></div>

    {variant===0&&<><GlassPanel style={{position:'absolute',left:85,top:310,width:1080,height:555,padding:34,opacity:enter}}><Badge color={COLORS.purple}>FLUJO VISUAL</Badge><div style={{marginTop:42}}><FlowDiagram progress={p} accent={COLORS.cyan} labels={['ENTRADA','IA','QC','SALIDA']}/></div><div style={{marginTop:48,display:'grid',gridTemplateColumns:'1.3fr .7fr',gap:28}}><div><Sparkline progress={p} color={COLORS.cyan} width={620} height={185} variant={variant}/></div><div style={{display:'flex',alignItems:'center',justifyContent:'center'}}><DonutGauge progress={p} value={.88} color={COLORS.green} label="FIABILIDAD" size={200}/></div></div></GlassPanel><GlassPanel style={{position:'absolute',right:85,top:310,width:590,height:555,padding:32,opacity:enter}}><Badge color={COLORS.green}>PASO ACTIVO</Badge><div style={{marginTop:30,display:'flex',justifyContent:'center'}}><VisualIcon type={active===0?'device':active===1?'brain':active===2?'shield':'chart'} size={170} color={active===2?COLORS.amber:COLORS.green}/></div><div style={{marginTop:20,fontFamily:FONT,color:'#fff',fontSize:34,fontWeight:950,textAlign:'center'}}>{items[active]}</div><div style={{marginTop:34}}><ProgressBar progress={(p*4)%1} color={COLORS.green} width={500}/></div></GlassPanel></>}

    {variant===1&&<><div style={{position:'absolute',left:95,top:320,width:940,opacity:enter}}><BrowserMockup shot={shot} progress={p} accent={COLORS.cyan}/></div><GlassPanel style={{position:'absolute',right:100,top:320,width:720,height:520,padding:38,opacity:interpolate(p,[.18,.38],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}><Badge color={COLORS.green}>RESULTADO</Badge><div style={{marginTop:30,display:'flex',justifyContent:'space-between',alignItems:'center'}}><VisualIcon type="chart" size={135} color={COLORS.green}/><DonutGauge progress={p} value={.91} color={COLORS.green} label="ÉXITO" size={185}/></div><div style={{marginTop:28,fontFamily:FONT,color:'#fff',fontSize:34,fontWeight:900}}>{items[2]}</div><div style={{marginTop:16,fontFamily:FONT,color:COLORS.soft,fontSize:24,lineHeight:1.4}}>{items[3]}</div></GlassPanel></>}

    {variant===2&&<><GlassPanel style={{position:'absolute',left:85,right:85,top:320,height:545,padding:36}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:38,height:'100%'}}><div><Badge color={COLORS.purple}>EVOLUCIÓN</Badge><div style={{marginTop:35}}><Sparkline progress={p} color={COLORS.purple} width={760} height={250} variant={2}/></div><div style={{display:'flex',gap:16,marginTop:24}}>{items.slice(0,3).map((x,i)=><div key={i} style={{flex:1,padding:'16px 18px',borderRadius:14,background:'rgba(255,255,255,.035)',border:`1px solid ${i===active?COLORS.purple:'rgba(255,255,255,.08)'}`,fontFamily:FONT,color:'#fff',fontSize:19,fontWeight:800,opacity:clamp(p*4-i,0,1)}}>{x}</div>)}</div></div><div><Badge color={COLORS.cyan}>DISTRIBUCIÓN</Badge><div style={{marginTop:36}}><MiniBars progress={p} color={COLORS.cyan} width={700} height={260}/></div><div style={{marginTop:18,display:'flex',justifyContent:'center'}}><VisualIcon type="network" size={120} color={COLORS.cyan}/></div></div></div></GlassPanel></>}

    {variant===3&&<><GlassPanel style={{position:'absolute',left:85,top:315,width:1040,height:550,padding:34}}><Badge color={COLORS.blue}>PANEL VISUAL</Badge><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:28,marginTop:28}}><div style={{height:220,borderRadius:18,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',padding:20}}><Sparkline progress={p} color={COLORS.cyan} width={450} height={170} variant={1}/></div><div style={{height:220,borderRadius:18,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',display:'flex',alignItems:'center',justifyContent:'space-evenly'}}><DonutGauge progress={p} value={.84} color={COLORS.green} label="CALIDAD" size={170}/><DonutGauge progress={p} value={.72} color={COLORS.amber} label="VELOCIDAD" size={170}/></div><div style={{gridColumn:'1 / span 2',height:190,borderRadius:18,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',padding:'18px 28px'}}><MiniBars progress={p} color={COLORS.purple} width={900} height={150} values={[.42,.63,.51,.78,.68,.91,.84]}/></div></div></GlassPanel><GlassPanel style={{position:'absolute',right:85,top:315,width:600,height:550,padding:34}}><Badge color={COLORS.green}>ESTADO</Badge><div style={{marginTop:30,display:'flex',justifyContent:'center'}}><VisualIcon type={active===1?'brain':active===2?'shield':'chart'} size={180} color={COLORS.green}/></div><div style={{marginTop:18,fontFamily:FONT,color:'#fff',fontSize:34,fontWeight:950,textAlign:'center'}}>{items[active]}</div><div style={{marginTop:34}}><ProgressBar progress={p} color={COLORS.green} width={510}/></div></GlassPanel></>}
    <Vignette opacity={.24}/>
  </AbsoluteFill>;
};

const LogicReasoning = ({shot}) => {
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const duration=getDurationFrames(shot); const p=clamp(frame/duration,0,1);
  const title=shortText(getHeadline(shot),68); const raw=getSupportingText(shot); const enter=spring({frame,fps,config:{damping:16,stiffness:105}});
  const steps=[shortText(raw[0]||'Premisa',42),shortText(raw[1]||'Deducción',42),shortText(raw[2]||'Validación',42),shortText(raw[3]||'Conclusión',42)]; const active=Math.min(3,Math.floor(p*4));
  return <AbsoluteFill style={{background:COLORS.bg,overflow:'hidden'}}><BaseBackground/><Grid opacity={.028}/><AmbientGlow left="68%" top="48%" size={1150} color="41,211,255" opacity={.13}/><div style={{position:'absolute',left:80,top:64}}><SectionLabel color={COLORS.green}>RAZONAMIENTO</SectionLabel></div><div style={{position:'absolute',left:80,top:128}}><HeroTitle size={55} width={1450}>{title}</HeroTitle></div>
  <GlassPanel style={{position:'absolute',left:90,top:320,width:1220,height:545,padding:38,opacity:enter}}><Badge color={COLORS.green}>MAPA DE DECISIÓN</Badge><div style={{marginTop:38}}><FlowDiagram progress={p} accent={COLORS.green} labels={['PREMISA','DESCARTE','PRUEBA','CONCLUSIÓN']}/></div><div style={{position:'relative',height:245,marginTop:45}}><svg width="1140" height="240" viewBox="0 0 1140 240"><path d="M80 190 C220 60 330 60 455 150 S700 225 850 95 S1000 50 1080 78" fill="none" stroke="rgba(25,214,163,.15)" strokeWidth="18"/><path d="M80 190 C220 60 330 60 455 150 S700 225 850 95 S1000 50 1080 78" fill="none" stroke={COLORS.green} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${p*1550} 1550`}/>{[80,455,850,1080].map((x,i)=><circle key={x} cx={x} cy={[190,150,95,78][i]} r={i===active?14:9} fill={i<=active?COLORS.green:'rgba(255,255,255,.18)'} />)}</svg></div></GlassPanel>
  <GlassPanel style={{position:'absolute',right:90,top:320,width:500,height:545,padding:34}}><Badge color={COLORS.cyan}>PASO {active+1}/4</Badge><div style={{marginTop:30,display:'flex',justifyContent:'center'}}><VisualIcon type={active===0?'brain':active===1?'network':active===2?'shield':'chart'} size={175} color={active===2?COLORS.amber:COLORS.cyan}/></div><div style={{marginTop:22,fontFamily:FONT,color:'#fff',fontSize:33,fontWeight:950,textAlign:'center'}}>{steps[active]}</div><div style={{marginTop:30}}><DonutGauge progress={(p*4)%1} value={.92} color={COLORS.cyan} label="CONFIANZA" size={190}/></div></GlassPanel><Vignette opacity={.24}/></AbsoluteFill>;
};

const ComparisonBoard = ({shot}) => {
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const duration=getDurationFrames(shot); const p=clamp(frame/duration,0,1); const title=shortText(getHeadline(shot),68); const raw=getSupportingText(shot); const reveal=spring({frame,fps,config:{damping:15,stiffness:100}}); const focusRight=p>.52;
  const left=shortText(raw[0]||'Opción rápida pero menos verificable',62), right=shortText(raw[1]||'Opción explicada y comprobable',62);
  return <AbsoluteFill style={{background:COLORS.bg}}><BaseBackground/><Grid opacity={.026}/><div style={{position:'absolute',left:80,top:64}}><SectionLabel>COMPARACIÓN</SectionLabel></div><div style={{position:'absolute',left:80,top:128}}><HeroTitle size={55} width={1500}>{title}</HeroTitle></div>
  <div style={{position:'absolute',left:90,right:90,top:315,display:'grid',gridTemplateColumns:'1fr 1fr',gap:42}}>{[{name:'A',color:COLORS.red,text:left,vals:[.58,.42,.68]},{name:'B',color:COLORS.green,text:right,vals:[.91,.94,.90]}].map((c,i)=>{const active=i===(focusRight?1:0);return <GlassPanel key={c.name} style={{height:535,padding:34,opacity:reveal,transform:`scale(${active?1.02:.985})`,border:`1px solid ${active?c.color+'88':'rgba(255,255,255,.10)'}`}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><Badge color={c.color}>OPCIÓN {c.name}</Badge><VisualIcon type={i?'shield':'brain'} size={88} color={c.color}/></div><div style={{marginTop:18,fontFamily:FONT,color:'#fff',fontSize:28,fontWeight:850}}>{c.text}</div><div style={{display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:24,marginTop:24}}><div><MiniBars progress={p} color={c.color} width={430} height={220} values={c.vals}/></div><div style={{display:'flex',alignItems:'center',justifyContent:'center'}}><DonutGauge progress={p} value={c.vals[0]} color={c.color} label="SCORE" size={190}/></div></div><div style={{marginTop:20}}><Sparkline progress={p} color={c.color} width={630} height={115} variant={i}/></div></GlassPanel>})}</div><Vignette opacity={.23}/></AbsoluteFill>;
};

const PrivacyRiskBoard = ({shot}) => {
  const frame=useCurrentFrame(); const duration=getDurationFrames(shot); const p=clamp(frame/duration,0,1); const title=shortText(getHeadline(shot),68); const raw=getSupportingText(shot); const active=Math.min(3,Math.floor(p*4)); const risks=[shortText(raw[0]||'Permisos',44),shortText(raw[1]||'Acciones automáticas',44),shortText(raw[2]||'Datos sensibles',44),shortText(raw[3]||'Trazabilidad',44)];
  return <AbsoluteFill style={{background:COLORS.bg}}><BaseBackground/><Grid opacity={.024}/><AmbientGlow left="70%" top="46%" size={1200} color="255,102,118" opacity={.14}/><div style={{position:'absolute',left:80,top:64}}><SectionLabel color={COLORS.red}>PRIVACIDAD Y RIESGO</SectionLabel></div><div style={{position:'absolute',left:80,top:128}}><HeroTitle size={55} width={1450}>{title}</HeroTitle></div>
  <GlassPanel style={{position:'absolute',left:90,top:320,width:760,height:545,padding:34}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><Badge color={COLORS.red}>SUPERFICIE DE RIESGO</Badge><VisualIcon type="shield" size={95} color={COLORS.red}/></div><div style={{marginTop:24,display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:18}}>{risks.map((r,i)=>{const q=clamp(p*4-i,0,1);return <div key={i} style={{height:155,borderRadius:18,background:i===active?'rgba(255,102,118,.10)':'rgba(255,255,255,.03)',border:`1px solid ${i===active?'rgba(255,102,118,.48)':'rgba(255,255,255,.08)'}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:.35+.65*q}}><VisualIcon type={i===0?'device':i===1?'network':i===2?'shield':'chart'} size={62} color={i===active?COLORS.red:COLORS.muted}/><div style={{marginTop:10,fontFamily:FONT,color:'#fff',fontSize:20,fontWeight:800,textAlign:'center',padding:'0 10px'}}>{r}</div></div>})}</div></GlassPanel>
  <GlassPanel style={{position:'absolute',right:90,top:320,width:830,height:545,padding:36}}><Badge color={COLORS.amber}>EXPOSICIÓN</Badge><div style={{display:'grid',gridTemplateColumns:'1fr .8fr',gap:24,marginTop:30}}><div><MiniBars progress={p} color={COLORS.red} width={470} height={270} values={[.34,.57,.76,.92,.68]}/><div style={{marginTop:24}}><Sparkline progress={p} color={COLORS.amber} width={470} height={120} variant={2}/></div></div><div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}><DonutGauge progress={p} value={.78} color={COLORS.red} label="RIESGO" size={230}/><div style={{marginTop:18,fontFamily:FONT,color:COLORS.soft,fontSize:21,lineHeight:1.35,textAlign:'center'}}>Menos permisos, más control humano.</div></div></div></GlassPanel><Vignette opacity={.25}/></AbsoluteFill>;
};

const GenericVisual = ({shot}) => {
  const frame=useCurrentFrame(); const duration=getDurationFrames(shot); const p=clamp(frame/duration,0,1); const src=getStockUrl(shot); const imageUrl=getImageUrl(shot); const title=shortText(getHeadline(shot),68); const raw=getSupportingText(shot); const variant=hashString(shot?.shotId||title)%3;
  return <AbsoluteFill style={{background:COLORS.bg,overflow:'hidden'}}>{src?<CinematicVideo shot={shot} darkness={.28}/>:imageUrl?<><Img src={imageUrl} style={{width:'100%',height:'100%',objectFit:'cover'}}/><AbsoluteFill style={{background:'linear-gradient(90deg,rgba(3,6,12,.76),rgba(3,6,12,.25),rgba(3,6,12,.72))'}}/></>:<><BaseBackground/><Grid opacity={.026}/></>}<AmbientGlow left={variant===0?'72%':'30%'} top="50%" size={1150} color={variant===2?'168,121,255':'41,211,255'} opacity={.13}/><div style={{position:'absolute',left:80,top:64}}><SectionLabel>{src||imageUrl?'CONTEXTO VISUAL':'VISUALIZACIÓN'}</SectionLabel></div><div style={{position:'absolute',left:80,top:128}}><HeroTitle size={57} width={1100}>{title}</HeroTitle></div>
  {!src&&!imageUrl&&variant===0&&<GlassPanel style={{position:'absolute',right:100,top:300,width:760,height:560,padding:36}}><Badge color={COLORS.cyan}>TENDENCIA</Badge><div style={{marginTop:35}}><Sparkline progress={p} color={COLORS.cyan} width={670} height={250}/></div><div style={{marginTop:25}}><MiniBars progress={p} color={COLORS.purple} width={670} height={170}/></div></GlassPanel>}
  {!src&&!imageUrl&&variant===1&&<GlassPanel style={{position:'absolute',right:100,top:320,width:760,height:520,padding:36}}><Badge color={COLORS.green}>MAPA</Badge><div style={{marginTop:55}}><FlowDiagram progress={p} accent={COLORS.green} labels={['SEÑAL','ANÁLISIS','DECISIÓN','ACCIÓN']}/></div><div style={{display:'flex',justifyContent:'center',marginTop:60}}><VisualIcon type="network" size={180} color={COLORS.green}/></div></GlassPanel>}
  {!src&&!imageUrl&&variant===2&&<GlassPanel style={{position:'absolute',right:105,top:315,width:760,height:530,padding:38}}><Badge color={COLORS.purple}>INDICADORES</Badge><div style={{display:'flex',justifyContent:'space-around',marginTop:38}}><DonutGauge progress={p} value={.87} color={COLORS.cyan} label="SEÑAL" size={210}/><DonutGauge progress={p} value={.73} color={COLORS.purple} label="IMPACTO" size={210}/></div><div style={{marginTop:30}}><Sparkline progress={p} color={COLORS.purple} width={650} height={130} variant={1}/></div></GlassPanel>}
  {(src||imageUrl)&&<div style={{position:'absolute',left:85,bottom:90,display:'flex',gap:16}}>{[shortText(raw[0]||'Contexto',28),shortText(raw[1]||'Dato clave',28),shortText(raw[2]||'Conclusión',28)].map((x,i)=><div key={i} style={{padding:'16px 22px',borderRadius:15,background:'rgba(4,9,16,.78)',border:'1px solid rgba(255,255,255,.12)',fontFamily:FONT,color:'#fff',fontSize:20,fontWeight:800,opacity:clamp(p*4-i,0,1)}}>{x}</div>)}</div>}<Vignette opacity={.28}/></AbsoluteFill>;
};

const CTAEndcard = ({shot}) => {
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const duration=getDurationFrames(shot); const p=clamp(frame/duration,0,1); const texts=getTextElements(shot); const q=shortText(texts[0]||getHeadline(shot)||'¿Qué probarías tú?',70); const a=shortText(texts[1]||'Cuéntamelo en comentarios',70); const pop=spring({frame,fps,config:{damping:14,stiffness:105}});
  return <AbsoluteFill style={{background:COLORS.bg}}><BaseBackground/><Grid opacity={.024}/><AmbientGlow left="50%" top="50%" size={1250} color="41,211,255" opacity={.18}/><div style={{position:'absolute',left:150,top:300,width:700,height:480}}><GlassPanel style={{height:'100%',padding:42,transform:`scale(${.94+.06*pop})`}}><Badge color={COLORS.cyan}>TU TURNO</Badge><div style={{marginTop:28,fontFamily:FONT,color:'#fff',fontSize:58,fontWeight:950,lineHeight:1.05}}>{q}</div><div style={{marginTop:30,fontFamily:FONT,color:COLORS.soft,fontSize:26}}>{a}</div><div style={{marginTop:38}}><ProgressBar progress={p} color={COLORS.cyan} width={600}/></div></GlassPanel></div><div style={{position:'absolute',right:170,top:270,width:720,height:520}}><GlassPanel style={{height:'100%',padding:38,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}><div style={{display:'flex',gap:30,alignItems:'center'}}><VisualIcon type="device" size={150} color={COLORS.cyan}/><VisualIcon type="network" size={150} color={COLORS.purple}/><VisualIcon type="chart" size={150} color={COLORS.green}/></div><div style={{marginTop:38}}><Sparkline progress={p} color={COLORS.cyan} width={580} height={150} variant={2}/></div><div style={{marginTop:20,display:'flex',gap:18}}>{['COMENTA','PRUEBA','COMPARTE'].map((x,i)=><div key={x} style={{padding:'14px 18px',borderRadius:12,background:'rgba(255,255,255,.04)',border:`1px solid ${i===Math.min(2,Math.floor(p*3))?COLORS.cyan:'rgba(255,255,255,.08)'}`,fontFamily:FONT,color:'#fff',fontWeight:900,opacity:.4+.6*clamp(p*3-i,0,1)}}>{x}</div>)}</div></GlassPanel></div><Vignette opacity={.30}/></AbsoluteFill>;
};


// =============================================================
// V6 — EDITORIAL CINEMATIC ENGINE
// Preserva LogicHookStage S0 y Composition id YouTubeV4.
// No convierte cifras inventadas en datos reales.
// =============================================================
const pickMedia = (shot) => {
  const source = getStockUrl(shot);
  const image = getImageUrl(shot);
  return {source: typeof source === 'string' ? source : null, image: typeof image === 'string' ? image : null};
};
const field = (shot, ...keys) => {
  for (const key of keys) {
    const found = key.split('.').reduce((o, k) => o?.[k], shot);
    if (typeof found === 'string' && found.trim()) return found.trim();
  }
  return '';
};
const uniqueCopy = (shot) => {
  const items = [...getTextElements(shot), field(shot,'subtitle'), field(shot,'description'), field(shot,'visualIdea')]
    .filter((x) => typeof x === 'string' && x.trim());
  return [...new Set(items.map(x=>x.trim()))];
};
const cinematicTitle = (shot) => {
  const t = field(shot,'title','sceneTitle','headline') || uniqueCopy(shot)[0] || 'La idea clave';
  return shortText(t, 104);
};
const editorialAccent = (shot) => {
  const kind = `${getTemplate(shot)} ${getLayout(shot)} ${field(shot,'sceneType')}`;
  if (/risk|privacy|error|danger|warning|riesgo|privacidad/.test(kind)) return COLORS.red;
  if (/comparison|before_after|comparaci/.test(kind)) return COLORS.amber;
  if (/cta|ending|endcard/.test(kind)) return COLORS.green;
  if (/logic|reasoning|workflow|diagram|flow/.test(kind)) return COLORS.purple;
  return COLORS.cyan;
};
const v6Ease = (p) => p*p*(3-2*p);
const V6Media = ({shot, shade = .25}) => {
  const frame = useCurrentFrame();
  const p = clamp(frame/getDurationFrames(shot),0,1);
  const {source,image} = pickMedia(shot);
  const mediaStyle = {width:'100%',height:'100%',objectFit:'cover',transform:`scale(${1.035 + p*.055}) translateX(${(p-.5)*1.4}%)`,filter:'contrast(1.07) saturate(1.08)'};
  return <AbsoluteFill style={{overflow:'hidden',background:COLORS.bg}}>
    {source ? <Video src={source} muted style={mediaStyle}/> : image ? <Img src={image} style={mediaStyle}/> : <><BaseBackground/><Grid opacity={.04}/></>}
    <AbsoluteFill style={{background:`linear-gradient(90deg,rgba(3,8,16,${shade+.45}) 0%,rgba(3,8,16,${shade+.11}) 53%,rgba(3,8,16,${shade+.20}) 100%)`}}/>
    <Vignette opacity={.2}/>
  </AbsoluteFill>;
};
const V6Kicker = ({children,color=COLORS.cyan}) => <div style={{display:'flex',alignItems:'center',gap:14,fontFamily:FONT,fontSize:22,letterSpacing:3.5,fontWeight:900,color:'#f5f7ff',textTransform:'uppercase'}}><div style={{height:4,width:48,background:color,borderRadius:5}}/>{children}</div>;
const V6Heading = ({children,size=83}) => <div style={{fontFamily:FONT,fontWeight:950,fontSize:size,lineHeight:1.045,letterSpacing:-2.7,color:'#fff',textShadow:'0 8px 36px rgba(0,0,0,.46)',overflowWrap:'break-word'}}>{children}</div>;
const V6LowerThird = ({text,color}) => text ? <div style={{padding:'19px 28px',borderLeft:`6px solid ${color}`,background:'rgba(4,9,18,.78)',backdropFilter:'blur(16px)',borderRadius:'0 18px 18px 0',color:'#f1f6ff',fontFamily:FONT,fontSize:28,lineHeight:1.28,fontWeight:650,maxWidth:1080}}>{shortText(text,115)}</div> : null;
const V6Progress = ({shot, color}) => {
  const frame=useCurrentFrame(), duration=getDurationFrames(shot),p=clamp((frame+1)/duration,0,1);
  return <div style={{position:'absolute',bottom:0,left:0,right:0,height:6,background:'rgba(255,255,255,.08)'}}><div style={{height:'100%',width:`${p*100}%`,background:color}}/></div>;
};
const V6PhotoStory = ({shot}) => {
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),dur=getDurationFrames(shot),p=clamp(frame/dur,0,1);
  const accent=editorialAccent(shot),copy=uniqueCopy(shot),title=cinematicTitle(shot),sub=copy.find(x=>x!==title);
  const enter=spring({frame,fps,config:{damping:19,stiffness:90}});
  return <AbsoluteFill><V6Media shot={shot}/><AmbientGlow left="78%" top="58%" size={720} color="41,211,255" opacity={.06}/>
   <div style={{position:'absolute',left:110,top:100,right:100,opacity:enter,transform:`translateY(${(1-enter)*38}px)`}}><V6Kicker color={accent}>{field(shot,'sceneType') || 'HISTORIA VISUAL'}</V6Kicker></div>
   <div style={{position:'absolute',left:110,right:205,top:315,opacity:enter,transform:`translateY(${(1-enter)*44}px)`}}><V6Heading size={title.length>83?64:title.length>55?73:89}>{title}</V6Heading></div>
   <div style={{position:'absolute',left:110,bottom:115,opacity:interpolate(p,[.18,.35],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}><V6LowerThird text={sub&&sub!==title?sub:''} color={accent}/></div><V6Progress shot={shot} color={accent}/>
  </AbsoluteFill>;
};
const V6Timeline = ({shot}) => {
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),dur=getDurationFrames(shot),p=clamp(frame/dur,0,1),accent=editorialAccent(shot);
  const copy=uniqueCopy(shot).filter(x=>x!==cinematicTitle(shot)).slice(0,4);
  const parts=copy.length?copy:['Planteamiento','Proceso','Comprobación','Resultado'];
  const active=Math.min(parts.length-1,Math.floor(p*parts.length));
  return <AbsoluteFill><V6Media shot={shot} shade={.43}/><div style={{position:'absolute',top:75,left:90}}><V6Kicker color={accent}>EXPLICACIÓN PASO A PASO</V6Kicker></div><div style={{position:'absolute',left:90,top:145,width:1680}}><V6Heading size={cinematicTitle(shot).length>65?58:71}>{cinematicTitle(shot)}</V6Heading></div>
  <div style={{position:'absolute',left:90,right:90,bottom:150,display:'flex',gap:18,alignItems:'stretch'}}>{parts.map((item,i)=>{
    const entry=clamp((frame-i*fps*.19)/(fps*.35),0,1),on=i===active;
    return <div key={i} style={{flex:1,minWidth:0,opacity:.4+.6*entry,transform:`translateY(${(1-v6Ease(entry))*35}px)`,padding:'25px 21px',background:on?'rgba(16,31,49,.94)':'rgba(9,17,30,.76)',borderTop:`6px solid ${on?accent:'rgba(255,255,255,.22)'}`,borderRadius:12,boxShadow:on?'0 18px 55px rgba(0,0,0,.36)':'none'}}><div style={{fontFamily:FONT,fontSize:22,fontWeight:950,color:accent,marginBottom:12}}>{String(i+1).padStart(2,'0')}</div><div style={{fontFamily:FONT,fontSize:25,lineHeight:1.22,fontWeight:750,color:'#fff',overflowWrap:'break-word'}}>{shortText(item,64)}</div></div>
  })}</div><V6Progress shot={shot} color={accent}/></AbsoluteFill>;
};
const V6Comparison = ({shot}) => {
 const frame=useCurrentFrame(),dur=getDurationFrames(shot),p=clamp(frame/dur,0,1),text=uniqueCopy(shot),title=cinematicTitle(shot);
 const details=text.filter(x=>x!==title);
 const left=field(shot,'leftLabel','comparison.left.title')||details[0]||'Antes';
 const right=field(shot,'rightLabel','comparison.right.title')||details[1]||'Después';
 return <AbsoluteFill><V6Media shot={shot} shade={.62}/><div style={{position:'absolute',left:94,top:72}}><V6Kicker color={COLORS.amber}>DOS ENFOQUES</V6Kicker></div><div style={{position:'absolute',left:94,top:140,width:1680}}><V6Heading size={title.length>65?58:75}>{title}</V6Heading></div>
  <div style={{position:'absolute',left:94,right:94,top:365,bottom:130,display:'grid',gridTemplateColumns:'1fr 1fr',gap:28}}>{[left,right].map((x,i)=>{const q=clamp((p-(i*.23))/.35,0,1),accent=i?COLORS.green:COLORS.amber;return <div key={i} style={{background:'rgba(7,16,29,.88)',border:`1px solid ${accent}99`,borderRadius:28,padding:42,transform:`translateY(${(1-v6Ease(q))*50}px)`,opacity:q,display:'flex',flexDirection:'column',justifyContent:'space-between'}}><div style={{fontFamily:FONT,color:accent,fontWeight:950,fontSize:23,letterSpacing:4}}>{i?'02  /  DESPUÉS':'01  /  ANTES'}</div><div style={{fontFamily:FONT,color:'#fff',fontSize:47,lineHeight:1.13,fontWeight:900}}>{shortText(x,90)}</div><div style={{height:5,width:`${Math.round((.45+.55*q)*100)}%`,background:accent,borderRadius:4}}/></div>})}</div><V6Progress shot={shot} color={COLORS.amber}/></AbsoluteFill>;
};
const V6Editorial = ({shot}) => {
 const {source,image}=pickMedia(shot);
 const frame=useCurrentFrame(),dur=getDurationFrames(shot),p=clamp(frame/dur,0,1),accent=editorialAccent(shot),copy=uniqueCopy(shot),title=cinematicTitle(shot);
 const points=copy.filter(x=>x!==title).slice(0,3);
 return <AbsoluteFill><V6Media shot={shot} shade={source||image?.34:.2}/><div style={{position:'absolute',left:85,top:78}}><V6Kicker color={accent}>IDEA CENTRAL</V6Kicker></div><div style={{position:'absolute',left:85,top:160,width:1510}}><V6Heading size={title.length>65?60:79}>{title}</V6Heading></div>
 <div style={{position:'absolute',bottom:118,left:85,right:85,display:'flex',gap:20}}>{points.length?points.map((x,i)=>{const q=clamp((p-i*.18)/.34,0,1);return <div key={i} style={{flex:1,minWidth:0,background:'rgba(5,12,23,.83)',borderTop:`5px solid ${accent}`,padding:'23px 26px',borderRadius:14,opacity:q,transform:`translateY(${(1-v6Ease(q))*35}px)`,fontFamily:FONT,color:'#fff',fontSize:25,lineHeight:1.23,fontWeight:800}}>{shortText(x,75)}</div>}):<div style={{width:600,height:5,background:accent,transform:`scaleX(${p})`,transformOrigin:'left'}}/>}</div><V6Progress shot={shot} color={accent}/></AbsoluteFill>;
};
const V6CallToAction = ({shot}) => {
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),p=clamp(frame/getDurationFrames(shot),0,1),a=spring({frame,fps,config:{damping:18,stiffness:80}});
 const content=uniqueCopy(shot),title=cinematicTitle(shot);
 return <AbsoluteFill><V6Media shot={shot} shade={.56}/><AmbientGlow left="55%" top="50%" size={1100} color="25,214,163" opacity={.16}/><div style={{position:'absolute',left:130,right:130,top:230,transform:`scale(${.93+.07*a})`,opacity:a,textAlign:'center'}}><V6Kicker color={COLORS.green}>AHORA TE TOCA</V6Kicker><div style={{marginTop:55}}><V6Heading size={title.length>55?70:90}>{title}</V6Heading></div><div style={{fontFamily:FONT,color:COLORS.soft,fontSize:36,marginTop:45}}>{shortText(content.find(x=>x!==title)||'Cuéntanos qué opinas',100)}</div><div style={{height:7,width:Math.round(520*p),background:COLORS.green,borderRadius:8,margin:'65px auto 0'}}/></div></AbsoluteFill>;
};
const ShotRenderer = ({shot}) => {
 const template=getTemplate(shot),layout=getLayout(shot),kind=field(shot,'sceneType'),combined=`${template} ${layout} ${kind}`.toLowerCase();
 // S0 se conserva literalmente como en V5.6.
 if(template==='logic_hook'||layout==='logic_hook_stage'||template==='hook_transformation'||(shot?.sceneId==='S0'&&/hook/.test(combined))) return <LogicHookStage shot={shot}/>;
 if(/cta|endcard|closing/.test(combined)) return <V6CallToAction shot={shot}/>;
 if(/comparison|before_after|versus|contrast/.test(combined)) return <V6Comparison shot={shot}/>;
 if(/reason|explain|flow|step|logic|ui_|diagram|instruction|privacy|risk|process/.test(combined)) return <V6Timeline shot={shot}/>;
 const {source,image}=pickMedia(shot);
 if(source||image) return <V6PhotoStory shot={shot}/>;
 return <V6Editorial shot={shot}/>;
};
const normalizeShots = ({timelineShots=[],scenes=[],scene=null,visual=null}) => {
 if(Array.isArray(timelineShots)&&timelineShots.length){return timelineShots.map((shot,i)=>{
  const matchingScene=safeArray(scenes).find(x=>x?.sceneId===shot?.sceneId);
  const merged={...(matchingScene||{}),...(scene||{}),...shot,visual:shot?.visual||visual||matchingScene?.visual||null};
  const start=Number(shot?.startFrame??shot?.globalStartFrame??0);
  return {...merged,shotId:shot?.shotId||`${shot?.sceneId||'S'}_${i}`,startFrame:Number.isFinite(start)?Math.max(0,start):0,durationFrames:Math.max(1,Number(shot?.durationFrames??shot?.renderTarget?.durationFrames??300)||300)};
 });}
 if(scene)return [{...scene,visual:scene?.visual||visual||null,startFrame:0,durationFrames:Math.max(1,Number(scene?.durationFrames||300))}];
 if(Array.isArray(scenes)&&scenes.length){let cursor=0;return scenes.map((s,i)=>{const duration=Math.max(1,Number(s?.durationFrames||300));const start=Number(s?.startFrame??cursor);cursor=start+duration;return {...s,shotId:s?.shotId||`${s?.sceneId||i}_SHOT`,startFrame:start,durationFrames:duration};});}
 return [];
};
const YouTubeV4 = ({timelineShots=[],scenes=[],scene=null,visual=null}) => {
 const shots=normalizeShots({timelineShots,scenes,scene,visual});
 // Individual render requests use shot local time. Full-film requests use startFrame.
 const localOnly=shots.length===1;
 return <AbsoluteFill style={{background:COLORS.bg}}>{shots.map((shot,i)=><Sequence key={`${shot.shotId||i}_${i}`} from={localOnly?0:shot.startFrame} durationInFrames={shot.durationFrames}><ShotRenderer shot={shot}/></Sequence>)}</AbsoluteFill>;
};
export const RemotionRoot=()=><Composition id="YouTubeV4" component={YouTubeV4} durationInFrames={DEFAULT_PROPS.totalDurationFrames} fps={DEFAULT_PROPS.fps} width={1920} height={1080} defaultProps={DEFAULT_PROPS} calculateMetadata={async({props})=>{
 const shots=normalizeShots(props||{});
 const longest=shots.reduce((m,s)=>Math.max(m,(shots.length===1?0:s.startFrame)+s.durationFrames),0);
 return {durationInFrames:Math.max(1,longest || Number(props?.totalDurationFrames||300)),fps:Number(props?.fps||30),width:1920,height:1080};
 }}/>;
