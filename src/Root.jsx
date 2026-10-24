import React from 'react';
import {
  AbsoluteFill,
  Composition,
  Sequence,
  Video,
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
// UI EXPLAINER — 4 VARIANTES INTERNAS
// ======================================================

const UIExplainer = ({shot}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const duration = getDurationFrames(shot);
  const p = clamp(frame / duration, 0, 1);
  const title = shortText(getHeadline(shot), 64);
  const texts = getSupportingText(shot);
  const variant = hashString(shot?.shotId || title) % 4;
  const enter = spring({frame, fps, config: {damping: 16, stiffness: 105}});
  const active = Math.min(3, Math.floor(p * 4));
  const items = [
    shortText(texts[0] || 'Entrada o instrucción principal', 58),
    shortText(texts[1] || 'La IA procesa el contexto', 58),
    shortText(texts[2] || 'Se valida la respuesta', 58),
    shortText(texts[3] || 'Resultado listo para usar', 58),
  ];

  return (
    <AbsoluteFill style={{background: COLORS.bg, overflow: 'hidden'}}>
      <BaseBackground />
      <Grid opacity={.03} />
      <AmbientGlow left={variant % 2 ? '25%' : '75%'} top="45%" size={1100} color={variant > 1 ? '168,121,255' : '41,211,255'} opacity={.14} />

      <div style={{position: 'absolute', left: 80, top: 62}}><SectionLabel>EXPLICACIÓN</SectionLabel></div>
      <div style={{position: 'absolute', left: 80, top: 125}}><HeroTitle size={54} width={1500}>{title}</HeroTitle></div>

      {variant === 0 && (
        <>
          <GlassPanel style={{position: 'absolute', left: 90, top: 330, width: 740, height: 520, padding: 32, opacity: enter, transform: `translateX(${(1 - enter) * -55}px)`}}>
            <Badge color={COLORS.purple}>WORKFLOW</Badge>
            {items.map((t, i) => (
              <div key={i} style={{marginTop: 24, display: 'flex', alignItems: 'center', gap: 18, opacity: interpolate(p, [i * .16, i * .16 + .12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
                <div style={{width: 42, height: 42, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i <= active ? `${COLORS.cyan}22` : 'rgba(255,255,255,.05)', border: `1px solid ${i <= active ? COLORS.cyan : COLORS.border}`, color: '#fff', fontWeight: 900}}>{i + 1}</div>
                <div style={{fontFamily: FONT, color: i === active ? '#fff' : COLORS.soft, fontSize: 25, fontWeight: i === active ? 800 : 600}}>{t}</div>
              </div>
            ))}
          </GlassPanel>
          <GlassPanel style={{position: 'absolute', right: 95, top: 310, width: 800, height: 555, padding: 34, opacity: enter, transform: `translateX(${(1 - enter) * 55}px)`}}>
            <Badge color={COLORS.green}>RESULTADO EN VIVO</Badge>
            <div style={{marginTop: 34, height: 315, borderRadius: 18, background: 'linear-gradient(145deg,rgba(25,214,163,.08),rgba(41,211,255,.04))', border: '1px solid rgba(41,211,255,.2)', padding: 28}}>
              <div style={{height: 14, width: `${35 + p * 55}%`, borderRadius: 99, background: COLORS.cyan, opacity: .8}} />
              <div style={{height: 14, width: `${55 + p * 25}%`, borderRadius: 99, background: 'rgba(255,255,255,.16)', marginTop: 24}} />
              <div style={{height: 14, width: `${45 + p * 35}%`, borderRadius: 99, background: 'rgba(255,255,255,.12)', marginTop: 18}} />
              <div style={{marginTop: 52, fontFamily: FONT, color: '#fff', fontSize: 34, fontWeight: 900}}>{items[active]}</div>
            </div>
            <div style={{marginTop: 30}}><ProgressBar progress={p} color={COLORS.green} width={680} /></div>
          </GlassPanel>
        </>
      )}

      {variant === 1 && (
        <>
          <GlassPanel style={{position: 'absolute', left: 105, top: 325, width: 790, height: 520, overflow: 'hidden', opacity: enter}}>
            <div style={{height: 55, background: 'rgba(255,255,255,.05)', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px'}}>
              {[0,1,2].map((x) => <div key={x} style={{width: 13, height: 13, borderRadius: '50%', background: x===0 ? COLORS.red : x===1 ? COLORS.amber : COLORS.green}} />)}
            </div>
            <div style={{padding: 30}}>
              <Badge>ENTRADA</Badge>
              <div style={{marginTop: 28, fontFamily: FONT, color: '#fff', fontSize: 31, fontWeight: 850}}>{items[0]}</div>
              <div style={{marginTop: 26, color: COLORS.soft, fontFamily: FONT, fontSize: 24, lineHeight: 1.45}}>{items[1]}</div>
              <div style={{marginTop: 36, padding: 20, borderRadius: 16, background: 'rgba(109,124,255,.10)', border: '1px solid rgba(109,124,255,.28)', transform: `scale(${.96 + .04 * Math.sin(frame / 11)})`}}>
                <div style={{fontFamily: FONT, color: COLORS.cyan, fontSize: 21, fontWeight: 900}}>PROCESANDO</div>
                <div style={{marginTop: 14}}><ProgressBar progress={p} /></div>
              </div>
            </div>
          </GlassPanel>
          <div style={{position: 'absolute', left: 930, top: 555, color: COLORS.cyan, fontSize: 65, fontWeight: 900, transform: `translateX(${Math.sin(frame / 8) * 8}px)`}}>→</div>
          <GlassPanel style={{position: 'absolute', right: 105, top: 325, width: 720, height: 520, padding: 36, opacity: interpolate(p, [.25, .42], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
            <Badge color={COLORS.green}>SALIDA</Badge>
            <div style={{marginTop: 34, fontFamily: FONT, color: '#fff', fontSize: 39, fontWeight: 900}}>{items[2]}</div>
            <div style={{marginTop: 26, color: COLORS.soft, fontFamily: FONT, fontSize: 25, lineHeight: 1.45}}>{items[3]}</div>
            <div style={{marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
              {['CLARO','VERIFICADO','ÚTIL','LISTO'].map((x, i) => <div key={x} style={{padding: 18, borderRadius: 14, textAlign: 'center', background: i <= active ? 'rgba(25,214,163,.10)' : 'rgba(255,255,255,.04)', border: `1px solid ${i <= active ? 'rgba(25,214,163,.38)' : 'rgba(255,255,255,.08)'}`, color: i <= active ? COLORS.green : COLORS.muted, fontFamily: FONT, fontWeight: 900}}>{x}</div>)}
            </div>
          </GlassPanel>
        </>
      )}

      {variant === 2 && (
        <>
          <div style={{position: 'absolute', left: 120, right: 120, top: 455, height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 99}}>
            <div style={{height: '100%', width: `${p * 100}%`, background: `linear-gradient(90deg,${COLORS.purple},${COLORS.cyan})`, borderRadius: 99, boxShadow: '0 0 28px rgba(41,211,255,.35)'}} />
          </div>
          {items.map((t, i) => {
            const x = 160 + i * 420;
            const reveal = interpolate(p, [i * .16, i * .16 + .12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return <div key={i} style={{position: 'absolute', left: x, top: 395, width: 300, opacity: reveal, transform: `translateY(${(1 - reveal) * 30}px)`}}>
              <div style={{width: 66, height: 66, margin: '0 auto', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i === active ? `${COLORS.cyan}22` : 'rgba(255,255,255,.06)', border: `2px solid ${i === active ? COLORS.cyan : COLORS.border}`, color: '#fff', fontFamily: FONT, fontWeight: 950, fontSize: 26}}>{i + 1}</div>
              <GlassPanel style={{marginTop: 38, padding: 24, minHeight: 180, textAlign: 'center', border: i === active ? '1px solid rgba(41,211,255,.38)' : COLORS.border}}>
                <div style={{fontFamily: FONT, color: '#fff', fontSize: 25, fontWeight: 850, lineHeight: 1.25}}>{t}</div>
              </GlassPanel>
            </div>;
          })}
        </>
      )}

      {variant === 3 && (
        <>
          <div style={{position: 'absolute', left: 90, right: 90, top: 315, display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 38}}>
            <GlassPanel style={{height: 540, padding: 34, opacity: enter}}>
              <Badge color={COLORS.blue}>PANEL DE CONTROL</Badge>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 30}}>
                {items.map((t, i) => {
                  const q = interpolate(p, [i * .14, i * .14 + .14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
                  return <div key={i} style={{padding: 24, borderRadius: 18, minHeight: 180, background: i === active ? 'linear-gradient(145deg,rgba(109,124,255,.15),rgba(41,211,255,.08))' : 'rgba(255,255,255,.035)', border: `1px solid ${i === active ? 'rgba(41,211,255,.40)' : 'rgba(255,255,255,.08)'}`, opacity: q}}>
                    <div style={{fontFamily: FONT, color: i === active ? COLORS.cyan : COLORS.muted, fontSize: 18, fontWeight: 900}}>0{i + 1}</div>
                    <div style={{marginTop: 18, fontFamily: FONT, color: '#fff', fontSize: 25, fontWeight: 800, lineHeight: 1.3}}>{t}</div>
                  </div>;
                })}
              </div>
            </GlassPanel>
            <GlassPanel style={{height: 540, padding: 38, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: enter}}>
              <div><Badge color={COLORS.green}>ESTADO</Badge><div style={{marginTop: 28, fontFamily: FONT, color: '#fff', fontSize: 42, fontWeight: 950}}>Procesando correctamente</div></div>
              <div>
                <div style={{fontFamily: FONT, color: COLORS.soft, fontSize: 23}}>Progreso del paso actual</div>
                <div style={{marginTop: 16}}><ProgressBar progress={(p * 4) % 1} color={COLORS.green} width={600} /></div>
              </div>
              <div style={{display: 'flex', gap: 14}}>{['INPUT','IA','QC','OUTPUT'].map((x, i) => <div key={x} style={{flex: 1, padding: '14px 10px', borderRadius: 12, textAlign: 'center', background: i <= active ? 'rgba(25,214,163,.12)' : 'rgba(255,255,255,.04)', border: `1px solid ${i <= active ? 'rgba(25,214,163,.40)' : 'rgba(255,255,255,.08)'}`, color: i <= active ? COLORS.green : COLORS.muted, fontFamily: FONT, fontWeight: 900}}>{x}</div>)}</div>
            </GlassPanel>
          </div>
        </>
      )}
      <Vignette opacity={.25} />
    </AbsoluteFill>
  );
};

// ======================================================
// LOGIC REASONING — PROGRESIÓN VISUAL REAL
// ======================================================

const LogicReasoning = ({shot}) => {
  const frame = useCurrentFrame();
  const duration = getDurationFrames(shot);
  const p = clamp(frame / duration, 0, 1);
  const title = shortText(getHeadline(shot), 70);
  const raw = getSupportingText(shot);
  const steps = [
    shortText(raw[0] || 'Identifica la condición que sí conocemos.', 66),
    shortText(raw[1] || 'Descarta las opciones incompatibles.', 66),
    shortText(raw[2] || 'Comprueba la única alternativa consistente.', 66),
  ];
  const active = Math.min(2, Math.floor(p * 3));

  return (
    <AbsoluteFill style={{background: COLORS.bg}}>
      <BaseBackground /><Grid opacity={.03} /><AmbientGlow left="68%" top="46%" size={1100} color="41,211,255" opacity={.14} />
      <div style={{position: 'absolute', left: 80, top: 64}}><SectionLabel color={COLORS.green}>RAZONAMIENTO</SectionLabel></div>
      <div style={{position: 'absolute', left: 80, top: 128}}><HeroTitle size={55} width={1500}>{title}</HeroTitle></div>

      <div style={{position: 'absolute', left: 120, right: 120, top: 385, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        {steps.map((step, i) => {
          const reveal = interpolate(p, [i * .18, i * .18 + .12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const pulse = i === active ? 1 + Math.sin(frame / 8) * .025 : 1;
          return <React.Fragment key={i}>
            <GlassPanel style={{width: 430, height: 360, padding: 34, opacity: reveal, transform: `translateY(${(1 - reveal) * 36}px) scale(${pulse})`, border: i === active ? '1px solid rgba(41,211,255,.42)' : COLORS.border}}>
              <Badge color={i === 2 ? COLORS.green : COLORS.cyan}>0{i + 1}</Badge>
              <div style={{marginTop: 30, width: 90, height: 90, borderRadius: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i === active ? 'rgba(41,211,255,.12)' : 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)', color: i === 2 ? COLORS.green : COLORS.cyan, fontSize: 48, fontWeight: 950}}>{i === 0 ? '?' : i === 1 ? '−' : '✓'}</div>
              <div style={{marginTop: 28, fontFamily: FONT, color: '#fff', fontSize: 28, fontWeight: 900, lineHeight: 1.3}}>{step}</div>
            </GlassPanel>
            {i < 2 && <div style={{width: 120, height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 99, overflow: 'hidden'}}><div style={{height: '100%', width: `${interpolate(p, [i * .28 + .18, i * .28 + .42], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%`, background: COLORS.cyan}} /></div>}
          </React.Fragment>;
        })}
      </div>
      <Vignette opacity={.25} />
    </AbsoluteFill>
  );
};

// ======================================================
// COMPARISON — DATOS, BARRAS Y FOCO ALTERNANTE
// ======================================================

const ComparisonBoard = ({shot}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const duration = getDurationFrames(shot);
  const p = clamp(frame / duration, 0, 1);
  const title = shortText(getHeadline(shot), 72);
  const raw = getSupportingText(shot);
  const leftText = shortText(raw[0] || 'Respuesta rápida, pero con menos explicación.', 100);
  const rightText = shortText(raw[1] || 'Respuesta verificable con razonamiento paso a paso.', 100);
  const reveal = spring({frame, fps, config: {damping: 15, stiffness: 100}});
  const focusRight = p > .48;

  return (
    <AbsoluteFill style={{background: COLORS.bg}}>
      <BaseBackground /><Grid opacity={.03} /><AmbientGlow left={focusRight ? '72%' : '28%'} top="52%" size={1100} color={focusRight ? '25,214,163' : '255,102,118'} opacity={.11} />
      <div style={{position: 'absolute', left: 80, top: 64}}><SectionLabel>COMPARACIÓN</SectionLabel></div>
      <div style={{position: 'absolute', left: 80, top: 128}}><HeroTitle size={55} width={1500}>{title}</HeroTitle></div>
      <div style={{position: 'absolute', left: 100, right: 100, top: 335, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 46}}>
        {[
          {name: 'OPCIÓN A', color: COLORS.red, text: leftText, score: .58},
          {name: 'OPCIÓN B', color: COLORS.green, text: rightText, score: .91},
        ].map((card, i) => {
          const active = i === (focusRight ? 1 : 0);
          return <GlassPanel key={card.name} style={{height: 500, padding: 40, opacity: reveal, transform: `translateX(${(1 - reveal) * (i ? 45 : -45)}px) scale(${active ? 1.025 : .985})`, border: `1px solid ${active ? `${card.color}88` : 'rgba(255,255,255,.10)'}`}}>
            <Badge color={card.color}>{card.name}</Badge>
            <div style={{marginTop: 34, fontFamily: FONT, color: '#fff', fontSize: 35, fontWeight: 900}}>{i ? 'Más verificable' : 'Más superficial'}</div>
            <div style={{marginTop: 24, fontFamily: FONT, color: COLORS.soft, fontSize: 25, lineHeight: 1.45}}>{card.text}</div>
            <div style={{marginTop: 42, display: 'grid', gap: 18}}>
              {[['Claridad', card.score], ['Justificación', i ? .94 : .46], ['Utilidad', i ? .90 : .68]].map(([label, score]) => <div key={label}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT, color: COLORS.soft, fontSize: 20}}><span>{label}</span><span>{Math.round(score * 100)}%</span></div>
                <div style={{marginTop: 8}}><ProgressBar progress={score * interpolate(p, [.12, .72], [.25, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} color={card.color} width={650} /></div>
              </div>)}
            </div>
          </GlassPanel>;
        })}
      </div>
      <Vignette opacity={.24} />
    </AbsoluteFill>
  );
};

// ======================================================
// PRIVACY / RISK — RENDERER NUEVO
// ======================================================

const PrivacyRiskBoard = ({shot}) => {
  const frame = useCurrentFrame();
  const duration = getDurationFrames(shot);
  const p = clamp(frame / duration, 0, 1);
  const title = shortText(getHeadline(shot), 68);
  const raw = getSupportingText(shot);
  const risks = [
    shortText(raw[0] || 'Permisos y acceso a datos', 54),
    shortText(raw[1] || 'Acciones automáticas sin revisión', 54),
    shortText(raw[2] || 'Información sensible compartida', 54),
    shortText(raw[3] || 'Falta de trazabilidad', 54),
  ];
  const active = Math.min(3, Math.floor(p * 4));

  return (
    <AbsoluteFill style={{background: COLORS.bg}}>
      <BaseBackground /><Grid opacity={.028} /><AmbientGlow left="72%" top="45%" size={1100} color="255,102,118" opacity={.13} />
      <div style={{position: 'absolute', left: 80, top: 64}}><SectionLabel color={COLORS.red}>PRIVACIDAD Y RIESGO</SectionLabel></div>
      <div style={{position: 'absolute', left: 80, top: 128}}><HeroTitle size={55} width={1450}>{title}</HeroTitle></div>

      <GlassPanel style={{position: 'absolute', left: 95, top: 340, width: 790, height: 520, padding: 36}}>
        <Badge color={COLORS.red}>CHECKLIST</Badge>
        {risks.map((r, i) => {
          const reveal = interpolate(p, [i * .15, i * .15 + .12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return <div key={i} style={{marginTop: 24, display: 'flex', gap: 18, alignItems: 'center', opacity: reveal}}>
            <div style={{width: 46, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i <= active ? 'rgba(255,102,118,.12)' : 'rgba(255,255,255,.04)', border: `1px solid ${i <= active ? 'rgba(255,102,118,.5)' : 'rgba(255,255,255,.08)'}`, color: i <= active ? COLORS.red : COLORS.muted, fontWeight: 950}}>{i <= active ? '!' : '·'}</div>
            <div style={{fontFamily: FONT, color: '#fff', fontSize: 25, fontWeight: 750}}>{r}</div>
          </div>;
        })}
      </GlassPanel>

      <GlassPanel style={{position: 'absolute', right: 95, top: 340, width: 780, height: 520, padding: 38, overflow: 'hidden'}}>
        <Badge color={COLORS.amber}>NIVEL DE EXPOSICIÓN</Badge>
        <div style={{marginTop: 34, height: 210, display: 'flex', alignItems: 'end', gap: 26}}>
          {[.35,.58,.76,.92].map((v, i) => <div key={i} style={{flex: 1, height: `${v * interpolate(p, [.1 + i*.08, .55 + i*.08], [.2, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * 100}%`, minHeight: 20, borderRadius: '14px 14px 4px 4px', background: i === active ? COLORS.red : 'rgba(255,102,118,.28)', boxShadow: i === active ? '0 0 32px rgba(255,102,118,.35)' : 'none'}} />)}
        </div>
        <div style={{marginTop: 32, fontFamily: FONT, color: '#fff', fontSize: 34, fontWeight: 900}}>Revisar antes de conceder acceso</div>
        <div style={{marginTop: 18, fontFamily: FONT, color: COLORS.soft, fontSize: 24, lineHeight: 1.4}}>La automatización útil no debería exigir permisos innecesarios ni ocultar qué acciones puede ejecutar.</div>
      </GlassPanel>
      <Vignette opacity={.25} />
    </AbsoluteFill>
  );
};

// ======================================================
// GENERIC — FALLBACK EDITORIAL, NO PANTALLA ESTÁTICA
// ======================================================

const GenericVisual = ({shot}) => {
  const frame = useCurrentFrame();
  const duration = getDurationFrames(shot);
  const p = clamp(frame / duration, 0, 1);
  const src = getStockUrl(shot);
  const title = shortText(getHeadline(shot), 66);
  const raw = getSupportingText(shot);
  const variant = hashString(shot?.shotId || title) % 3;
  const chips = [shortText(raw[0] || 'Contexto', 30), shortText(raw[1] || 'Dato clave', 30), shortText(raw[2] || 'Conclusión', 30)];

  return (
    <AbsoluteFill style={{background: COLORS.bg, overflow: 'hidden'}}>
      {src ? <CinematicVideo shot={shot} darkness={.34} /> : <><BaseBackground /><Grid opacity={.03} /></>}
      <AmbientGlow left={variant === 0 ? '70%' : '30%'} top="48%" size={1050} color={variant === 2 ? '168,121,255' : '41,211,255'} opacity={.13} />
      <div style={{position: 'absolute', left: 82, top: 72}}><SectionLabel>{src ? 'CONTEXTO REAL' : 'CONTEXTO'}</SectionLabel></div>
      <div style={{position: 'absolute', left: 82, top: 140}}><HeroTitle size={62} width={1080}>{title}</HeroTitle></div>

      {variant === 0 && <div style={{position: 'absolute', left: 86, bottom: 110, display: 'flex', gap: 18}}>{chips.map((c, i) => {
        const q = interpolate(p, [i * .15, i * .15 + .12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return <div key={i} style={{padding: '18px 24px', borderRadius: 16, background: 'rgba(5,10,18,.76)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', fontFamily: FONT, fontSize: 22, fontWeight: 800, opacity: q, transform: `translateY(${(1 - q) * 24}px)`}}>{c}</div>;
      })}</div>}

      {variant === 1 && <GlassPanel style={{position: 'absolute', right: 100, top: 345, width: 610, height: 430, padding: 32}}>
        <Badge color={COLORS.purple}>SEÑALES</Badge>
        {chips.map((c, i) => <div key={i} style={{marginTop: 28}}><div style={{fontFamily: FONT, color: '#fff', fontSize: 24, fontWeight: 800}}>{c}</div><div style={{marginTop: 10}}><ProgressBar progress={clamp(p * 1.25 - i * .12, 0, 1)} color={i === 2 ? COLORS.green : COLORS.cyan} width={500} /></div></div>)}
      </GlassPanel>}

      {variant === 2 && <div style={{position: 'absolute', left: 95, right: 95, bottom: 100, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24}}>{chips.map((c, i) => {
        const q = interpolate(p, [i * .14, i * .14 + .15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return <GlassPanel key={i} style={{padding: 28, minHeight: 210, opacity: q, transform: `scale(${.94 + .06 * q})`}}><div style={{fontFamily: FONT, color: COLORS.cyan, fontSize: 18, fontWeight: 900}}>0{i + 1}</div><div style={{marginTop: 22, fontFamily: FONT, color: '#fff', fontSize: 27, fontWeight: 850}}>{c}</div></GlassPanel>;
      })}</div>}
      <Vignette opacity={.28} />
    </AbsoluteFill>
  );
};

// ======================================================
// CTA — CIERRE CON PROGRESIÓN
// ======================================================

const CTAEndcard = ({shot}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const duration = getDurationFrames(shot);
  const p = clamp(frame / duration, 0, 1);
  const texts = getTextElements(shot);
  const question = shortText(texts[0] || getHeadline(shot) || '¿Qué probarías tú?', 70);
  const action = shortText(texts[1] || 'Cuéntamelo en comentarios', 70);
  const pop = spring({frame, fps, config: {damping: 14, stiffness: 105}});
  const commentIn = interpolate(p, [.28, .48], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: COLORS.bg}}>
      <BaseBackground /><Grid opacity={.025} /><AmbientGlow left="50%" top="50%" size={1250} color="41,211,255" opacity={.17} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <GlassPanel style={{width: 1240, padding: '58px 78px', textAlign: 'center', transform: `scale(${.92 + pop * .08})`, border: '1px solid rgba(41,211,255,.28)'}}>
          <Badge color={COLORS.cyan}>TU TURNO</Badge>
          <div style={{marginTop: 30, fontFamily: FONT, color: '#fff', fontSize: 70, fontWeight: 950, letterSpacing: -2}}>{question}</div>
          <div style={{margin: '38px auto 0', width: 800, padding: '22px 28px', borderRadius: 18, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', opacity: commentIn, transform: `translateY(${(1 - commentIn) * 24}px)`}}>
            <div style={{fontFamily: FONT, color: COLORS.soft, fontSize: 27, fontWeight: 750}}>{action}</div>
          </div>
          <div style={{margin: '30px auto 0'}}><ProgressBar progress={p} color={COLORS.cyan} width={420} /></div>
        </GlassPanel>
      </AbsoluteFill>
      <Vignette opacity={.30} />
    </AbsoluteFill>
  );
};

const ShotRenderer = ({shot}) => {
  const template = getTemplate(shot);
  const layout = getLayout(shot);

  if (template === 'logic_hook' || layout === 'logic_hook_stage' || template === 'hook_transformation') return <LogicHookStage shot={shot} />;
  if (template === 'ui_explainer' || layout === 'ui_explainer' || template === 'intro_problem_solution' || template === 'gemini_gem_setup' || template === 'instruction_builder') return <UIExplainer shot={shot} />;
  if (template === 'logic_reasoning' || layout === 'logic_reasoning_flow' || template === 'notes_to_structure') return <LogicReasoning shot={shot} />;
  if (template === 'comparison' || layout === 'comparison_board' || template === 'dual_tool_comparison' || template === 'before_after_validation') return <ComparisonBoard shot={shot} />;
  if (template === 'privacy_risk' || layout === 'risk_checklist' || template.includes('privacy') || layout.includes('risk')) return <PrivacyRiskBoard shot={shot} />;
  if (template === 'cta' || template === 'cta_endcard' || layout === 'cta_endcard') return <CTAEndcard shot={shot} />;
  return <GenericVisual shot={shot} />;
};

const normalizeShots = ({timelineShots = [], scenes = [], scene = null, visual = null}) => {
  if (Array.isArray(timelineShots) && timelineShots.length) {
    return timelineShots.map((shot) => {
      const matchingScene = safeArray(scenes).find((item) => item?.sceneId === shot?.sceneId);
      return {...(matchingScene || {}), ...(scene || {}), ...shot, visual: visual || shot?.visual || null};
    });
  }
  if (scene) return [{...scene, visual: visual || null, startFrame: 0, durationFrames: scene?.durationFrames || 300}];
  if (Array.isArray(scenes) && scenes.length) {
    return scenes.map((item, index) => ({...item, startFrame: item?.startFrame || 0, durationFrames: item?.durationFrames || 300, shotId: item?.shotId || `${item?.sceneId || index}_SHOT`}));
  }
  return [];
};

const YouTubeV4 = ({timelineShots = [], scenes = [], scene = null, visual = null}) => {
  const shots = normalizeShots({timelineShots, scenes, scene, visual});
  return (
    <AbsoluteFill style={{background: COLORS.bg}}>
      {shots.map((shot, index) => (
        <Sequence
          key={shot?.shotId || shot?.sceneId || index}
          from={Number(shot?.startFrame || 0)}
          durationInFrames={Math.max(1, Number(shot?.durationFrames || 1))}
        >
          <ShotRenderer shot={shot} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const RemotionRoot = () => (
  <Composition
    id="YouTubeV4"
    component={YouTubeV4}
    durationInFrames={DEFAULT_PROPS.totalDurationFrames}
    fps={DEFAULT_PROPS.fps}
    width={1920}
    height={1080}
    defaultProps={DEFAULT_PROPS}
    calculateMetadata={async ({props}) => ({
      durationInFrames: Math.max(1, Number(props?.totalDurationFrames || props?.scene?.durationFrames || props?.timelineShots?.[0]?.durationFrames || 300)),
      fps: Number(props?.fps || 30),
      width: 1920,
      height: 1080,
    })}
  />
);
