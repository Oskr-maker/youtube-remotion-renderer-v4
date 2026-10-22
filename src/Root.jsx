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
//
// Compatible con:
// - Composition ID: YouTubeV4
// - Endpoint actual: /render-v4
//
// Familias soportadas:
// - logic_hook
// - boxes_fruit
// - logic_reasoning
// - ui_explainer
// - comparison
// - cta
//
// V5.2:
// - frutas SVG internas
// - cajas 3D estilizadas
// - etiquetas premium
// - animación secuencial de errores
// - mejor timing cinematográfico
// ======================================================


// ======================================================
// DEFAULT PROPS
// ======================================================

const DEFAULT_PROPS = {
  totalDurationFrames: 300,
  fps: 30,
  timelineShots: [],
  scenes: [],
  scene: null,
  visual: null,
};


// ======================================================
// DESIGN SYSTEM
// ======================================================

const COLORS = {
  bg: '#05070c',
  bgSoft: '#0a0f19',
  panel: '#111827',
  panelSoft: '#151e2d',

  white: '#ffffff',

  textSoft:
    'rgba(255,255,255,0.74)',

  textMuted:
    'rgba(255,255,255,0.48)',

  blue: '#6d7cff',
  cyan: '#29d3ff',
  green: '#19d6a3',
  amber: '#ffbd59',
  red: '#ff6676',
  purple: '#a879ff',

  cardboard:
    '#9a6a3a',

  cardboardDark:
    '#694526',

  cardboardLight:
    '#bf8950',

  border:
    'rgba(255,255,255,0.14)',
};


const FONT =
  'Arial, Helvetica, sans-serif';


// ======================================================
// HELPERS
// ======================================================

const safeArray = value =>
  Array.isArray(value)
    ? value
    : [];


const clamp = (
  value,
  min,
  max
) =>
  Math.max(
    min,
    Math.min(
      max,
      value
    )
  );


const getTemplate = shot =>
  shot?.template ||
  shot?.visual?.template ||
  shot?.scene?.template ||
  'generic';


const getLayout = shot =>
  shot?.layout ||
  shot?.visual?.layout ||
  shot?.scene?.layout ||
  'generic';


const getHeadline = shot =>
  shot?.title ||
  shot?.sceneTitle ||
  shot?.textElements?.[0] ||
  shot?.visual?.textElements?.[0] ||
  '';


const getTextElements = shot =>
  safeArray(
    shot?.textElements ||
    shot?.visual?.textElements
  );


const getStock = shot =>
  shot?.stock ||
  shot?.visual?.stock ||
  shot?.scene?.stock ||
  null;


const getStockUrl = shot => {

  const stock =
    getStock(
      shot
    );


  if (
    stock?.available === true &&
    stock?.url
  ) {

    return stock.url;
  }


  const videoLayer =
    safeArray(
      shot?.layers
    ).find(
      layer =>
        layer?.type ===
          'video' &&
        layer?.sourceURL
    );


  return (
    videoLayer?.sourceURL ||
    shot?.asset?.url ||
    shot?.visualAsset?.url ||
    shot?.videoUrl ||
    null
  );
};


const getDurationFrames = shot =>
  Math.max(
    1,
    Number(
      shot?.durationFrames ||
      1
    )
  );


const fadeInOut = (
  progress,
  start,
  peakStart,
  peakEnd,
  end
) =>
  interpolate(
    progress,
    [
      start,
      peakStart,
      peakEnd,
      end,
    ],
    [
      0,
      1,
      1,
      0,
    ],
    {
      extrapolateLeft:
        'clamp',

      extrapolateRight:
        'clamp',
    }
  );


// ======================================================
// BASE BACKGROUND
// ======================================================

const BaseBackground = () => (

  <AbsoluteFill
    style={{
      background:
        'linear-gradient(135deg,#05070c 0%,#09111c 52%,#05070c 100%)',
    }}
  />

);


// ======================================================
// GRID
// ======================================================

const Grid = ({
  opacity = 0.04,
}) => (

  <AbsoluteFill
    style={{
      opacity,

      backgroundImage:
        'linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)',

      backgroundSize:
        '72px 72px',

      pointerEvents:
        'none',
    }}
  />

);


// ======================================================
// AMBIENT GLOW
// ======================================================

const AmbientGlow = ({
  left = '50%',
  top = '50%',
  size = 800,
  color = '109,124,255',
  opacity = 0.18,
}) => (

  <div
    style={{
      position:
        'absolute',

      left,

      top,

      width:
        size,

      height:
        size,

      transform:
        'translate(-50%,-50%)',

      borderRadius:
        '50%',

      background:
        `radial-gradient(circle,rgba(${color},${opacity}) 0%,rgba(${color},0) 68%)`,

      pointerEvents:
        'none',
    }}
  />

);


// ======================================================
// VIGNETTE
// ======================================================

const Vignette = ({
  opacity = 0.35,
}) => (

  <AbsoluteFill
    style={{
      background:
        `radial-gradient(circle at 50% 45%,transparent 40%,rgba(0,0,0,${opacity}) 100%)`,

      pointerEvents:
        'none',
    }}
  />

);


// ======================================================
// LIGHT SWEEP
// ======================================================

const LightSweep = ({
  progress,
  opacity = 0.65,
}) => {

  const x =
    interpolate(
      progress,
      [0, 1],
      [-30, 130],
      {
        extrapolateLeft:
          'clamp',

        extrapolateRight:
          'clamp',
      }
    );


  return (

    <AbsoluteFill
      style={{
        overflow:
          'hidden',

        pointerEvents:
          'none',
      }}
    >

      <div
        style={{
          position:
            'absolute',

          top:
            '-20%',

          bottom:
            '-20%',

          left:
            `${x}%`,

          width:
            '14%',

          transform:
            'skewX(-15deg)',

          background:
            `linear-gradient(
              90deg,
              rgba(255,255,255,0),
              rgba(255,255,255,${opacity * 0.22}),
              rgba(41,211,255,${opacity}),
              rgba(255,255,255,0)
            )`,

          filter:
            'blur(15px)',

          mixBlendMode:
            'screen',

          boxShadow:
            '0 0 90px rgba(41,211,255,.35)',
        }}
      />

    </AbsoluteFill>
  );
};


// ======================================================
// GLASS PANEL
// ======================================================

const GlassPanel = ({
  children,
  style = {},
}) => (

  <div
    style={{
      background:
        'linear-gradient(145deg,rgba(14,20,32,.88),rgba(6,10,18,.78))',

      border:
        `1px solid ${COLORS.border}`,

      boxShadow:
        '0 28px 90px rgba(0,0,0,.36)',

      backdropFilter:
        'blur(16px)',

      borderRadius:
        26,

      ...style,
    }}
  >

    {children}

  </div>

);


// ======================================================
// BADGE
// ======================================================

const Badge = ({
  children,
  color = COLORS.blue,
}) => (

  <div
    style={{
      display:
        'inline-flex',

      alignItems:
        'center',

      padding:
        '9px 16px',

      borderRadius:
        999,

      background:
        `${color}22`,

      border:
        `1px solid ${color}66`,

      color:
        '#fff',

      fontFamily:
        FONT,

      fontSize:
        20,

      fontWeight:
        800,

      letterSpacing:
        0.6,
    }}
  >

    {children}

  </div>

);


// ======================================================
// SECTION LABEL
// ======================================================

const SectionLabel = ({
  children,
  color = COLORS.cyan,
}) => (

  <div
    style={{
      display:
        'flex',

      alignItems:
        'center',

      gap:
        12,

      fontFamily:
        FONT,

      color:
        'rgba(255,255,255,.74)',

      fontWeight:
        850,

      fontSize:
        20,

      letterSpacing:
        2.4,

      textTransform:
        'uppercase',
    }}
  >

    <div
      style={{
        width:
          36,

        height:
          4,

        borderRadius:
          999,

        background:
          color,

        boxShadow:
          `0 0 22px ${color}88`,
      }}
    />

    {children}

  </div>

);


// ======================================================
// HERO TITLE
// ======================================================

const HeroTitle = ({
  children,

  size = 76,

  width = 900,

  align = 'left',

  style = {},
}) => (

  <div
    style={{
      maxWidth:
        width,

      color:
        '#fff',

      fontFamily:
        FONT,

      fontSize:
        size,

      lineHeight:
        0.98,

      fontWeight:
        900,

      letterSpacing:
        -2.6,

      textAlign:
        align,

      textShadow:
        '0 15px 48px rgba(0,0,0,.55)',

      ...style,
    }}
  >

    {children}

  </div>

);


// ======================================================
// CINEMATIC VIDEO
// ======================================================

const CinematicVideo = ({
  shot,

  darkness = 0.15,

  saturation = 1.05,

  contrast = 1.05,

  brightness = 1,

  zoomStart = 1.02,

  zoomEnd = 1.08,

  position = 'center center',

  playbackRate = 1,
}) => {

  const frame =
    useCurrentFrame();


  const duration =
    getDurationFrames(
      shot
    );


  const src =
    getStockUrl(
      shot
    );


  if (!src) {

    return null;
  }


  const progress =
    clamp(
      frame /
      duration,
      0,
      1
    );


  const scale =
    interpolate(
      progress,
      [0, 1],
      [
        zoomStart,
        zoomEnd,
      ]
    );


  const panX =
    interpolate(
      progress,
      [0, 1],
      [-10, 12]
    );


  const panY =
    Math.sin(
      progress *
      Math.PI
    ) *
    -5;


  return (
    <>

      <AbsoluteFill
        style={{
          overflow:
            'hidden',
        }}
      >

        <Video
          src={src}

          muted

          playbackRate={
            playbackRate
          }

          style={{
            width:
              '100%',

            height:
              '100%',

            objectFit:
              'cover',

            objectPosition:
              position,

            transform:
              `translate(${panX}px,${panY}px) scale(${scale})`,

            filter:
              `saturate(${saturation}) contrast(${contrast}) brightness(${brightness})`,
          }}
        />

      </AbsoluteFill>


      <AbsoluteFill
        style={{
          background:
            `rgba(2,5,10,${darkness})`,
        }}
      />


      <Vignette
        opacity={0.25}
      />

    </>
  );
};


// ======================================================
// SVG FRUIT ICONS
// ======================================================

const AppleIcon = ({
  size = 82,
}) => (

  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
  >

    <defs>

      <radialGradient
        id="appleGradient"
        cx="35%"
        cy="30%"
        r="80%"
      >
        <stop
          offset="0%"
          stopColor="#ff7b82"
        />

        <stop
          offset="55%"
          stopColor="#e94a55"
        />

        <stop
          offset="100%"
          stopColor="#a91f2c"
        />
      </radialGradient>

    </defs>


    <path
      d="
        M60 34
        C45 19 25 26 20 47
        C14 72 30 102 57 105
        C84 108 104 81 101 55
        C98 31 74 22 60 34 Z
      "
      fill="url(#appleGradient)"
    />


    <path
      d="
        M59 33
        C58 21 63 13 72 8
      "
      stroke="#68432c"
      strokeWidth="7"
      strokeLinecap="round"
      fill="none"
    />


    <path
      d="
        M69 15
        C82 11 89 16 92 26
        C80 27 72 23 69 15 Z
      "
      fill="#35b36c"
    />


    <ellipse
      cx="42"
      cy="48"
      rx="11"
      ry="18"
      fill="rgba(255,255,255,.14)"
      transform="rotate(25 42 48)"
    />

  </svg>

);


const OrangeIcon = ({
  size = 82,
}) => (

  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
  >

    <defs>

      <radialGradient
        id="orangeGradient"
        cx="35%"
        cy="30%"
        r="75%"
      >
        <stop
          offset="0%"
          stopColor="#ffc05b"
        />

        <stop
          offset="55%"
          stopColor="#ff951f"
        />

        <stop
          offset="100%"
          stopColor="#cf6210"
        />
      </radialGradient>

    </defs>


    <circle
      cx="60"
      cy="64"
      r="43"
      fill="url(#orangeGradient)"
    />


    <path
      d="
        M59 21
        C65 11 75 8 86 11
        C81 22 72 27 59 21 Z
      "
      fill="#38ad61"
    />


    <path
      d="
        M60 24
        C60 17 60 12 62 8
      "
      stroke="#725034"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />


    <ellipse
      cx="43"
      cy="48"
      rx="9"
      ry="15"
      fill="rgba(255,255,255,.15)"
      transform="rotate(30 43 48)"
    />

  </svg>

);


// ======================================================
// FRUIT DISPLAY
// ======================================================

const FruitDisplay = ({
  type,
  size = 82,
}) => {

  if (
    type ===
    'apple'
  ) {

    return (
      <AppleIcon
        size={size}
      />
    );
  }


  if (
    type ===
    'orange'
  ) {

    return (
      <OrangeIcon
        size={size}
      />
    );
  }


  return (

    <div
      style={{
        display:
          'flex',

        alignItems:
          'center',

        justifyContent:
          'center',

        gap:
          4,
      }}
    >

      <AppleIcon
        size={size * 0.78}
      />

      <OrangeIcon
        size={size * 0.78}
      />

    </div>
  );
};


// ======================================================
// PREMIUM CARDBOARD BOX
// ======================================================

const CardboardBox = ({
  label,

  fruitType,

  active = false,

  errorProgress = 0,

  entrance = 1,

  scale = 1,

  index = 0,
}) => {

  const accent =
    fruitType === 'apple'
      ? COLORS.red

      : fruitType ===
        'orange'
      ? COLORS.amber

      : COLORS.cyan;


  return (

    <div
      style={{
        width:
          390,

        height:
          325,

        position:
          'relative',

        opacity:
          entrance,

        transform:
          `translateY(${(1 - entrance) * 60}px) scale(${entrance * scale}) perspective(900px) rotateX(-2deg)`,

        transformOrigin:
          'center bottom',
      }}
    >

      {/* SHADOW */}

      <div
        style={{
          position:
            'absolute',

          left:
            40,

          right:
            40,

          bottom:
            -22,

          height:
            45,

          borderRadius:
            '50%',

          background:
            'rgba(0,0,0,.48)',

          filter:
            'blur(18px)',

          opacity:
            0.75,
        }}
      />


      {/* BOX BODY */}

      <div
        style={{
          position:
            'absolute',

          left:
            18,

          right:
            18,

          top:
            58,

          bottom:
            0,

          borderRadius:
            '10px 10px 24px 24px',

          background:
            `linear-gradient(
              145deg,
              ${COLORS.cardboardLight} 0%,
              ${COLORS.cardboard} 52%,
              ${COLORS.cardboardDark} 100%
            )`,

          border:
            active
              ? `2px solid ${accent}`
              : '1px solid rgba(255,255,255,.12)',

          boxShadow:
            active
              ? `0 35px 100px rgba(0,0,0,.48),
                 0 0 55px ${accent}35`
              : '0 35px 100px rgba(0,0,0,.48)',

          overflow:
            'hidden',
        }}
      >

        {/* CARDBOARD TEXTURE */}

        <div
          style={{
            position:
              'absolute',

            inset:
              0,

            opacity:
              0.14,

            backgroundImage:
              'repeating-linear-gradient(0deg,rgba(255,255,255,.09) 0px,rgba(255,255,255,.09) 1px,transparent 1px,transparent 5px)',
          }}
        />


        {/* CENTER TAPE */}

        <div
          style={{
            position:
              'absolute',

            left:
              '47%',

            top:
              0,

            bottom:
              0,

            width:
              '6%',

            background:
              'rgba(255,223,170,.14)',
          }}
        />


        {/* FRUIT */}

        <div
          style={{
            position:
              'absolute',

            left:
              0,

            right:
              0,

            top:
              40,

            display:
              'flex',

            justifyContent:
              'center',

            filter:
              'drop-shadow(0 15px 22px rgba(0,0,0,.32))',
          }}
        >

          <FruitDisplay
            type={
              fruitType
            }

            size={
              fruitType ===
                'mixed'
                ? 90
                : 100
            }
          />

        </div>


        {/* LABEL */}

        <div
          style={{
            position:
              'absolute',

            left:
              33,

            right:
              33,

            bottom:
              28,

            padding:
              '17px 16px',

            borderRadius:
              10,

            background:
              '#f4e8cf',

            border:
              '1px solid rgba(76,50,28,.35)',

            boxShadow:
              '0 7px 18px rgba(0,0,0,.24)',

            textAlign:
              'center',

            color:
              '#3d2b1d',

            fontFamily:
              FONT,

            fontSize:
              25,

            fontWeight:
              950,

            letterSpacing:
              1.2,

            transform:
              'rotate(-1deg)',
          }}
        >
          {label}
        </div>


        {/* INCORRECT MARK */}

        <div
          style={{
            position:
              'absolute',

            right:
              18,

            top:
              16,

            width:
              54,

            height:
              54,

            borderRadius:
              '50%',

            display:
              'flex',

            justifyContent:
              'center',

            alignItems:
              'center',

            background:
              'rgba(255,255,255,.92)',

            border:
              `3px solid ${COLORS.red}`,

            color:
              COLORS.red,

            fontFamily:
              FONT,

            fontSize:
              34,

            fontWeight:
              950,

            opacity:
              errorProgress,

            transform:
              `scale(${0.55 + errorProgress * 0.45}) rotate(${(1 - errorProgress) * -25}deg)`,

            boxShadow:
              '0 10px 30px rgba(0,0,0,.30)',
          }}
        >
          ×
        </div>

      </div>


      {/* TOP FLAPS */}

      <div
        style={{
          position:
            'absolute',

          left:
            34,

          top:
            16,

          width:
            155,

          height:
            74,

          background:
            `linear-gradient(
              135deg,
              ${COLORS.cardboardLight},
              ${COLORS.cardboard}
            )`,

          clipPath:
            'polygon(0 20%,100% 0,88% 100%,12% 100%)',

          transform:
            'rotate(-7deg)',

          transformOrigin:
            'bottom center',

          border:
            '1px solid rgba(255,255,255,.10)',

          boxShadow:
            '0 8px 20px rgba(0,0,0,.16)',
        }}
      />


      <div
        style={{
          position:
            'absolute',

          right:
            34,

          top:
            16,

          width:
            155,

          height:
            74,

          background:
            `linear-gradient(
              225deg,
              ${COLORS.cardboardLight},
              ${COLORS.cardboard}
            )`,

          clipPath:
            'polygon(0 0,100% 20%,88% 100%,12% 100%)',

          transform:
            'rotate(7deg)',

          transformOrigin:
            'bottom center',

          border:
            '1px solid rgba(255,255,255,.10)',

          boxShadow:
            '0 8px 20px rgba(0,0,0,.16)',
        }}
      />

    </div>
  );
};


// ======================================================
// LOGIC HOOK - CINEMATIC V5.2
// ======================================================

const LogicHookStage = ({
  shot,
}) => {

  const frame =
    useCurrentFrame();


  const {
    fps,
  } =
    useVideoConfig();


  const duration =
    getDurationFrames(
      shot
    );


  const progress =
    clamp(
      frame /
      duration,
      0,
      1
    );


  const texts =
    getTextElements(
      shot
    );


  const title1 =
    texts[0] ||
    'Tres cajas';


  const title2 =
    texts[1] ||
    'Todas las etiquetas están mal';


  const title3 =
    texts[2] ||
    '¿Puedes resolverlo?';


  // ====================================================
  // INTRO
  // ====================================================

  const headlineOpacity =
    interpolate(
      progress,
      [0, 0.10],
      [0, 1],
      {
        extrapolateLeft:
          'clamp',

        extrapolateRight:
          'clamp',
      }
    );


  const cameraScale =
    interpolate(
      progress,
      [0, 1],
      [1, 1.08]
    );


  // ====================================================
  // BOX ENTRANCE
  // ====================================================

  const box1 =
    spring({
      frame:
        Math.max(
          0,
          frame -
          1
        ),

      fps,

      config: {
        damping:
          14,

        stiffness:
          120,

        mass:
          0.8,
      },
    });


  const box2 =
    spring({
      frame:
        Math.max(
          0,
          frame -
          5
        ),

      fps,

      config: {
        damping:
          14,

        stiffness:
          120,

        mass:
          0.8,
      },
    });


  const box3 =
    spring({
      frame:
        Math.max(
          0,
          frame -
          9
        ),

      fps,

      config: {
        damping:
          14,

        stiffness:
          120,

        mass:
          0.8,
      },
    );


  // ====================================================
  // SEQUENTIAL ERROR MARKS
  // ====================================================

  const error1 =
    interpolate(
      progress,
      [0.34, 0.43],
      [0, 1],
      {
        extrapolateLeft:
          'clamp',

        extrapolateRight:
          'clamp',
      }
    );


  const error2 =
    interpolate(
      progress,
      [0.42, 0.51],
      [0, 1],
      {
        extrapolateLeft:
          'clamp',

        extrapolateRight:
          'clamp',
      }
    );


  const error3 =
    interpolate(
      progress,
      [0.50, 0.59],
      [0, 1],
      {
        extrapolateLeft:
          'clamp',

        extrapolateRight:
          'clamp',
      }
    );


  // ====================================================
  // WRONG MESSAGE
  // ====================================================

  const wrongMessage =
    fadeInOut(
      progress,
      0.48,
      0.58,
      0.68,
      0.76
    );


  // ====================================================
  // QUESTION
  // ====================================================

  const questionProgress =
    interpolate(
      progress,
      [0.71, 0.84],
      [0, 1],
      {
        extrapolateLeft:
          'clamp',

        extrapolateRight:
          'clamp',
      }
    );


  const questionPunch =
    spring({
      frame:
        Math.max(
          0,
          frame -
          Math.round(
            duration *
            0.72
          )
        ),

      fps,

      config: {
        damping:
          12,

        stiffness:
          135,

        mass:
          0.72,
      },
    });


  const boxes =
    [
      {
        label:
          'MANZANAS',

        fruitType:
          'apple',

        entrance:
          box1,

        error:
          error1,
      },

      {
        label:
          'NARANJAS',

        fruitType:
          'orange',

        entrance:
          box2,

        error:
          error2,
      },

      {
        label:
          'MEZCLA',

        fruitType:
          'mixed',

        entrance:
          box3,

        error:
          error3,
      },
    ];


  return (

    <AbsoluteFill
      style={{
        background:
          COLORS.bg,

        overflow:
          'hidden',
      }}
    >

      <BaseBackground />

      <Grid
        opacity={0.04}
      />

      <AmbientGlow
        left="48%"
        top="47%"
        size={1350}
        color="41,211,255"
        opacity={0.18}
      />

      <AmbientGlow
        left="25%"
        top="60%"
        size={850}
        color="168,121,255"
        opacity={0.08}
      />


      <AbsoluteFill
        style={{
          transform:
            `scale(${cameraScale})`,
        }}
      >

        {/* TOP LABEL */}

        <div
          style={{
            position:
              'absolute',

            top:
              54,

            left:
              0,

            right:
              0,

            display:
              'flex',

            justifyContent:
              'center',

            opacity:
              headlineOpacity,
          }}
        >

          <SectionLabel
            color={
              COLORS.amber
            }
          >
            RETO DE LÓGICA
          </SectionLabel>

        </div>


        {/* MAIN TITLE */}

        <div
          style={{
            position:
              'absolute',

            top:
              105,

            left:
              0,

            right:
              0,

            display:
              'flex',

            justifyContent:
              'center',

            opacity:
              headlineOpacity,
          }}
        >

          <HeroTitle
            size={70}
            width={1500}
            align="center"
          >
            {title1}
          </HeroTitle>

        </div>


        {/* BOXES */}

        <div
          style={{
            position:
              'absolute',

            top:
              300,

            left:
              0,

            right:
              0,

            display:
              'flex',

            justifyContent:
              'center',

            gap:
              58,
          }}
        >

          {boxes.map(
            (
              box,
              index
            ) => (

              <CardboardBox
                key={
                  box.label
                }

                label={
                  box.label
                }

                fruitType={
                  box.fruitType
                }

                entrance={
                  box.entrance
                }

                errorProgress={
                  box.error
                }

                scale={
                  1 +
                  (
                    index === 1
                      ? 0.006
                      : 0
                  )
                }

                index={
                  index
                }
              />

            )
          )}

        </div>


        {/* WRONG MESSAGE */}

        <div
          style={{
            position:
              'absolute',

            left:
              0,

            right:
              0,

            bottom:
              100,

            display:
              'flex',

            justifyContent:
              'center',

            opacity:
              wrongMessage,

            transform:
              `translateY(${(1 - wrongMessage) * 25}px) scale(${0.96 + wrongMessage * 0.04})`,
          }}
        >

          <div
            style={{
              padding:
                '18px 32px',

              borderRadius:
                18,

              background:
                'rgba(255,102,118,.10)',

              border:
                '1px solid rgba(255,102,118,.42)',

              color:
                COLORS.red,

              fontFamily:
                FONT,

              fontSize:
                41,

              fontWeight:
                950,

              letterSpacing:
                -0.8,

              boxShadow:
                '0 20px 70px rgba(0,0,0,.34)',
            }}
          >
            {title2}
          </div>

        </div>

      </AbsoluteFill>


      {/* QUESTION PAYOFF */}

      <AbsoluteFill
        style={{
          justifyContent:
            'center',

          alignItems:
            'center',

          opacity:
            questionProgress,

          background:
            `rgba(4,7,12,${questionProgress * 0.76})`,
        }}
      >

        <GlassPanel
          style={{
            padding:
              '42px 75px',

            transform:
              `scale(${0.86 + questionPunch * 0.14})`,

            textAlign:
              'center',

            border:
              '1px solid rgba(41,211,255,.26)',

            boxShadow:
              '0 40px 130px rgba(0,0,0,.62)',
          }}
        >

          <Badge
            color={
              COLORS.cyan
            }
          >
            PIENSA ANTES DE SEGUIR
          </Badge>


          <div
            style={{
              marginTop:
                27,

              fontFamily:
                FONT,

              fontSize:
                72,

              fontWeight:
                950,

              color:
                '#fff',

              letterSpacing:
                -2.2,

              textShadow:
                '0 18px 48px rgba(0,0,0,.5)',
            }}
          >
            {title3}
          </div>

        </GlassPanel>

      </AbsoluteFill>


      <LightSweep
        progress={
          clamp(
            (
              progress -
              0.18
            ) /
            0.55,
            0,
            1
          )
        }

        opacity={
          wrongMessage *
          0.55
        }
      />


      <Vignette
        opacity={0.28}
      />

    </AbsoluteFill>
  );
};


// ======================================================
// BOXES / FRUIT
// ======================================================

const BoxesFruit = ({
  shot,
}) => {

  const frame =
    useCurrentFrame();


  const {
    fps,
  } =
    useVideoConfig();


  const duration =
    getDurationFrames(
      shot
    );


  const progress =
    clamp(
      frame /
      duration,
      0,
      1
    );


  const focusIndex =
    Math.min(
      2,
      Math.floor(
        progress *
        3
      )
    );


  const items = [
    {
      label:
        'MANZANAS',

      fruitType:
        'apple',
    },

    {
      label:
        'NARANJAS',

      fruitType:
        'orange',
    },

    {
      label:
        'MEZCLA',

      fruitType:
        'mixed',
    },
  ];


  return (

    <AbsoluteFill
      style={{
        background:
          COLORS.bg,
      }}
    >

      <BaseBackground />

      <Grid
        opacity={0.035}
      />

      <AmbientGlow
        left="50%"
        top="52%"
        size={1250}
        color="109,124,255"
        opacity={0.14}
      />


      <div
        style={{
          position:
            'absolute',

          top:
            65,

          left:
            80,
        }}
      >

        <SectionLabel>
          EL ACERTIJO
        </SectionLabel>

      </div>


      <div
        style={{
          position:
            'absolute',

          top:
            132,

          left:
            80,
        }}
      >

        <HeroTitle
          size={58}
          width={1400}
        >
          {
            getHeadline(
              shot
            ) ||
            'Tres cajas. Tres etiquetas incorrectas.'
          }
        </HeroTitle>

      </div>


      <div
        style={{
          position:
            'absolute',

          top:
            340,

          left:
            0,

          right:
            0,

          display:
            'flex',

          justifyContent:
            'center',

          gap:
            60,
        }}
      >

        {items.map(
          (
            item,
            index
          ) => {

            const entrance =
              spring({
                frame:
                  Math.max(
                    0,
                    frame -
                    index * 4
                  ),

                fps,

                config: {
                  damping:
                    15,

                  stiffness:
                    105,
                },
              });


            return (

              <CardboardBox
                key={
                  item.label
                }

                label={
                  item.label
                }

                fruitType={
                  item.fruitType
                }

                active={
                  index ===
                  focusIndex
                }

                entrance={
                  entrance
                }

                errorProgress={
                  1
                }

                scale={
                  index ===
                    focusIndex
                    ? 1.045
                    : 1
                }
              />

            );
          }
        )}

      </div>


      <Vignette
        opacity={0.26}
      />

    </AbsoluteFill>
  );
};


// ======================================================
// LOGIC REASONING
// ======================================================

const LogicReasoning = ({
  shot,
}) => {

  const frame =
    useCurrentFrame();


  const duration =
    getDurationFrames(
      shot
    );


  const progress =
    clamp(
      frame /
      duration,
      0,
      1
    );


  const steps = [
    {
      number:
        '01',

      title:
        'Premisa',

      text:
        'Todas las etiquetas son incorrectas.',
    },

    {
      number:
        '02',

      title:
        'Deducción',

      text:
        'Una extracción elimina varias posibilidades.',
    },

    {
      number:
        '03',

      title:
        'Resultado',

      text:
        'El resto se resuelve por descarte lógico.',
    },
  ];


  return (

    <AbsoluteFill
      style={{
        background:
          COLORS.bg,
      }}
    >

      <BaseBackground />

      <Grid
        opacity={0.035}
      />

      <AmbientGlow
        left="70%"
        top="42%"
        size={1000}
        color="41,211,255"
        opacity={0.13}
      />


      <div
        style={{
          position:
            'absolute',

          left:
            82,

          top:
            70,
        }}
      >

        <SectionLabel
          color={
            COLORS.green
          }
        >
          RAZONAMIENTO
        </SectionLabel>

      </div>


      <div
        style={{
          position:
            'absolute',

          left:
            82,

          top:
            135,
        }}
      >

        <HeroTitle
          size={58}
          width={1450}
        >
          {
            getHeadline(
              shot
            ) ||
            'La clave es reducir posibilidades'
          }
        </HeroTitle>

      </div>


      <div
        style={{
          position:
            'absolute',

          left:
            100,

          right:
            100,

          top:
            350,

          display:
            'flex',

          justifyContent:
            'space-between',

          gap:
            42,
        }}
      >

        {steps.map(
          (
            step,
            index
          ) => {

            const start =
              index *
              0.22;


            const reveal =
              interpolate(
                progress,
                [
                  start,
                  start +
                  0.12,
                ],
                [0, 1],
                {
                  extrapolateLeft:
                    'clamp',

                  extrapolateRight:
                    'clamp',
                }
              );


            return (

              <React.Fragment
                key={
                  step.number
                }
              >

                <GlassPanel
                  style={{
                    width:
                      450,

                    height:
                      335,

                    padding:
                      34,

                    opacity:
                      reveal,

                    transform:
                      `translateY(${(1 - reveal) * 35}px)`,
                  }}
                >

                  <Badge
                    color={
                      index ===
                        2
                        ? COLORS.green
                        : COLORS.cyan
                    }
                  >
                    {step.number}
                  </Badge>


                  <div
                    style={{
                      marginTop:
                        27,

                      color:
                        '#fff',

                      fontFamily:
                        FONT,

                      fontSize:
                        36,

                      fontWeight:
                        900,
                    }}
                  >
                    {step.title}
                  </div>


                  <div
                    style={{
                      marginTop:
                        19,

                      color:
                        COLORS.textSoft,

                      fontFamily:
                        FONT,

                      fontSize:
                        25,

                      lineHeight:
                        1.4,
                    }}
                  >
                    {step.text}
                  </div>

                </GlassPanel>


                {index < 2 && (

                  <div
                    style={{
                      alignSelf:
                        'center',

                      color:
                        COLORS.cyan,

                      fontFamily:
                        FONT,

                      fontSize:
                        46,

                      fontWeight:
                        900,

                      opacity:
                        reveal,
                    }}
                  >
                    →
                  </div>

                )}

              </React.Fragment>

            );
          }
        )}

      </div>

    </AbsoluteFill>
  );
};


// ======================================================
// UI EXPLAINER
// ======================================================

const UIExplainer = ({
  shot,
}) => {

  const frame =
    useCurrentFrame();


  const {
    fps,
  } =
    useVideoConfig();


  const enter =
    spring({
      frame,
      fps,

      config: {
        damping:
          16,

        stiffness:
          105,
      },
    });


  const headline =
    getHeadline(
      shot
    );


  const texts =
    getTextElements(
      shot
    );


  return (

    <AbsoluteFill
      style={{
        background:
          COLORS.bg,
      }}
    >

      <BaseBackground />

      <Grid
        opacity={0.035}
      />

      <AmbientGlow
        left="72%"
        top="50%"
        size={1050}
        color="109,124,255"
        opacity={0.15}
      />


      <div
        style={{
          position:
            'absolute',

          left:
            80,

          top:
            70,
        }}
      >

        <SectionLabel>
          EXPLICACIÓN
        </SectionLabel>

      </div>


      <div
        style={{
          position:
            'absolute',

          left:
            80,

          top:
            135,
        }}
      >

        <HeroTitle
          size={56}
          width={900}
        >
          {
            headline ||
            texts[0] ||
            'Vamos paso a paso'
          }
        </HeroTitle>

      </div>


      <GlassPanel
        style={{
          position:
            'absolute',

          left:
            82,

          top:
            345,

          width:
            760,

          height:
            500,

          padding:
            38,

          opacity:
            enter,

          transform:
            `translateX(${(1 - enter) * -45}px)`,
        }}
      >

        <Badge>
          INFORMACIÓN
        </Badge>


        {(
          texts.length
            ? texts
            : [
                'Dato principal',
                'Condición',
                'Conclusión',
              ]
        )
          .slice(
            0,
            4
          )
          .map(
            (
              text,
              index
            ) => (

              <div
                key={
                  `${text}_${index}`
                }

                style={{
                  marginTop:
                    28,

                  padding:
                    '18px 22px',

                  borderRadius:
                    15,

                  background:
                    index === 0
                      ? 'rgba(109,124,255,.15)'
                      : 'rgba(255,255,255,.045)',

                  border:
                    index === 0
                      ? '1px solid rgba(109,124,255,.48)'
                      : '1px solid rgba(255,255,255,.09)',

                  color:
                    '#fff',

                  fontFamily:
                    FONT,

                  fontSize:
                    25,

                  fontWeight:
                    index === 0
                      ? 800
                      : 600,
                }}
              >
                {text}
              </div>

            )
          )}

      </GlassPanel>


      <GlassPanel
        style={{
          position:
            'absolute',

          right:
            90,

          top:
            300,

          width:
            780,

          height:
            560,

          padding:
            40,

          opacity:
            enter,

          transform:
            `translateX(${(1 - enter) * 45}px)`,
        }}
      >

        <Badge
          color={
            COLORS.green
          }
        >
          RESULTADO
        </Badge>


        <div
          style={{
            marginTop:
              50,

            display:
              'flex',

            alignItems:
              'center',

            justifyContent:
              'center',

            height:
              320,

            borderRadius:
              20,

            background:
              'linear-gradient(145deg,rgba(25,214,163,.09),rgba(41,211,255,.06))',

            border:
              '1px solid rgba(41,211,255,.22)',
          }}
        >

          <div
            style={{
              fontFamily:
                FONT,

              color:
                '#fff',

              fontSize:
                38,

              fontWeight:
                900,

              textAlign:
                'center',

              maxWidth:
                580,

              lineHeight:
                1.15,
            }}
          >
            Una decisión clara
            <br />
            basada en lógica
          </div>

        </div>

      </GlassPanel>

    </AbsoluteFill>
  );
};


// ======================================================
// COMPARISON
// ======================================================

const ComparisonBoard = ({
  shot,
}) => {

  const frame =
    useCurrentFrame();


  const {
    fps,
  } =
    useVideoConfig();


  const reveal =
    spring({
      frame,
      fps,

      config: {
        damping:
          15,

        stiffness:
          100,
      },
    });


  return (

    <AbsoluteFill
      style={{
        background:
          COLORS.bg,
      }}
    >

      <BaseBackground />

      <Grid
        opacity={0.035}
      />


      <div
        style={{
          position:
            'absolute',

          left:
            80,

          top:
            70,
        }}
      >

        <SectionLabel>
          COMPARACIÓN
        </SectionLabel>

      </div>


      <div
        style={{
          position:
            'absolute',

          left:
            80,

          top:
            135,
        }}
      >

        <HeroTitle
          size={58}
          width={1500}
        >
          {
            getHeadline(
              shot
            ) ||
            'No todas las respuestas razonan igual'
          }
        </HeroTitle>

      </div>


      <div
        style={{
          position:
            'absolute',

          left:
            100,

          right:
            100,

          top:
            350,

          display:
            'grid',

          gridTemplateColumns:
            '1fr 1fr',

          gap:
            55,
        }}
      >

        <GlassPanel
          style={{
            padding:
              45,

            height:
              430,

            opacity:
              reveal,

            transform:
              `translateX(${(1 - reveal) * -50}px)`,
          }}
        >

          <Badge
            color={
              COLORS.red
            }
          >
            RESPUESTA A
          </Badge>


          <div
            style={{
              marginTop:
                42,

              color:
                '#fff',

              fontFamily:
                FONT,

              fontSize:
                35,

              fontWeight:
                900,
            }}
          >
            Resultado correcto
          </div>


          <div
            style={{
              marginTop:
                25,

              color:
                COLORS.textSoft,

              fontFamily:
                FONT,

              fontSize:
                26,

              lineHeight:
                1.45,
            }}
          >
            Puede acertar,
            pero no siempre explica
            cómo llegó hasta la respuesta.
          </div>

        </GlassPanel>


        <GlassPanel
          style={{
            padding:
              45,

            height:
              430,

            opacity:
              reveal,

            transform:
              `translateX(${(1 - reveal) * 50}px)`,

            border:
              '1px solid rgba(25,214,163,.38)',
          }}
        >

          <Badge
            color={
              COLORS.green
            }
          >
            RESPUESTA B
          </Badge>


          <div
            style={{
              marginTop:
                42,

              color:
                '#fff',

              fontFamily:
                FONT,

              fontSize:
                35,

              fontWeight:
                900,
            }}
          >
            Resultado + razonamiento
          </div>


          <div
            style={{
              marginTop:
                25,

              color:
                COLORS.textSoft,

              fontFamily:
                FONT,

              fontSize:
                26,

              lineHeight:
                1.45,
            }}
          >
            Expone premisas,
            descarta alternativas
            y permite verificar
            cada paso.
          </div>

        </GlassPanel>

      </div>

    </AbsoluteFill>
  );
};


// ======================================================
// CTA
// ======================================================

const CTAEndcard = ({
  shot,
}) => {

  const frame =
    useCurrentFrame();


  const {
    fps,
  } =
    useVideoConfig();


  const pop =
    spring({
      frame,

      fps,

      config: {
        damping:
          14,

        stiffness:
          100,
      },
    });


  const texts =
    getTextElements(
      shot
    );


  const question =
    texts[0] ||
    '¿Lo habías resuelto?';


  const action =
    texts[1] ||
    'Déjalo en comentarios';


  return (

    <AbsoluteFill
      style={{
        background:
          COLORS.bg,
      }}
    >

      <BaseBackground />

      <Grid
        opacity={0.03}
      />

      <AmbientGlow
        left="50%"
        top="50%"
        size={1200}
        color="41,211,255"
        opacity={0.16}
      />


      <AbsoluteFill
        style={{
          justifyContent:
            'center',

          alignItems:
            'center',

          padding:
            '95px',
        }}
      >

        <GlassPanel
          style={{
            width:
              1160,

            padding:
              '55px 70px',

            textAlign:
              'center',

            transform:
              `scale(${0.94 + pop * 0.06})`,
          }}
        >

          <Badge
            color={
              COLORS.cyan
            }
          >
            TU TURNO
          </Badge>


          <div
            style={{
              marginTop:
                30,

              color:
                '#fff',

              fontFamily:
                FONT,

              fontSize:
                68,

              lineHeight:
                1.04,

              fontWeight:
                900,

              letterSpacing:
                -2,
            }}
          >
            {question}
          </div>


          <div
            style={{
              margin:
                '42px auto 0',

              width:
                720,

              padding:
                '20px 25px',

              borderRadius:
                17,

              background:
                'rgba(255,255,255,.055)',

              border:
                '1px solid rgba(255,255,255,.12)',

              color:
                'rgba(255,255,255,.76)',

              fontFamily:
                FONT,

              fontSize:
                28,

              textAlign:
                'center',

              fontWeight:
                700,
            }}
          >
            {action}

            <span
              style={{
                opacity:
                  frame % 20 < 10
                    ? 1
                    : 0,

                marginLeft:
                  4,
              }}
            >
              |
            </span>

          </div>

        </GlassPanel>

      </AbsoluteFill>

    </AbsoluteFill>
  );
};


// ======================================================
// GENERIC
// ======================================================

const GenericVisual = ({
  shot,
}) => {

  const frame =
    useCurrentFrame();


  const {
    fps,
  } =
    useVideoConfig();


  const reveal =
    spring({
      frame,

      fps,

      config: {
        damping:
          16,

        stiffness:
          100,
      },
    });


  const stockUrl =
    getStockUrl(
      shot
    );


  return (

    <AbsoluteFill
      style={{
        background:
          COLORS.bg,
      }}
    >

      {stockUrl
        ? (

          <CinematicVideo
            shot={shot}

            darkness={0.11}

            saturation={1.06}

            contrast={1.06}

            brightness={1.02}
          />

        )
        : (

          <>
            <BaseBackground />

            <Grid
              opacity={0.035}
            />

            <AmbientGlow
              left="70%"
              top="45%"
              size={1000}
              color="109,124,255"
              opacity={0.15}
            />
          </>

        )}


      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg,rgba(3,5,9,.65) 0%,rgba(3,5,9,.21) 51%,rgba(3,5,9,.04) 100%)',
        }}
      />


      <div
        style={{
          position:
            'absolute',

          left:
            84,

          top:
            78,
        }}
      >

        <SectionLabel>
          CONTEXTO
        </SectionLabel>

      </div>


      <div
        style={{
          position:
            'absolute',

          left:
            84,

          bottom:
            105,

          transform:
            `translateY(${(1 - reveal) * 32}px)`,

          opacity:
            reveal,
        }}
      >

        <HeroTitle
          size={68}
          width={920}
        >
          {
            getHeadline(
              shot
            ) ||
            'Información clave'
          }
        </HeroTitle>

      </div>

    </AbsoluteFill>
  );
};


// ======================================================
// SHOT RENDERER
// ======================================================

const ShotRenderer = ({
  shot,
}) => {

  const template =
    getTemplate(
      shot
    );


  const layout =
    getLayout(
      shot
    );


  // ====================================================
  // TEMPLATE ROUTER
  // ====================================================

  switch (
    template
  ) {

    case 'logic_hook':

      return (
        <LogicHookStage
          shot={shot}
        />
      );


    case 'boxes_fruit':

      return (
        <BoxesFruit
          shot={shot}
        />
      );


    case 'logic_reasoning':

      return (
        <LogicReasoning
          shot={shot}
        />
      );


    case 'ui_explainer':

      return (
        <UIExplainer
          shot={shot}
        />
      );


    case 'comparison':

      return (
        <ComparisonBoard
          shot={shot}
        />
      );


    case 'cta':

      return (
        <CTAEndcard
          shot={shot}
        />
      );


    // LEGACY ALIASES

    case 'hook_transformation':

      return (
        <LogicHookStage
          shot={shot}
        />
      );


    case 'intro_problem_solution':

      return (
        <UIExplainer
          shot={shot}
        />
      );


    case 'notes_to_structure':

      return (
        <LogicReasoning
          shot={shot}
        />
      );


    case 'gemini_gem_setup':

      return (
        <UIExplainer
          shot={shot}
        />
      );


    case 'instruction_builder':

      return (
        <UIExplainer
          shot={shot}
        />
      );


    case 'dual_tool_comparison':

      return (
        <ComparisonBoard
          shot={shot}
        />
      );


    case 'before_after_validation':

      return (
        <ComparisonBoard
          shot={shot}
        />
      );


    case 'cta_endcard':

      return (
        <CTAEndcard
          shot={shot}
        />
      );


    default:
      break;
  }


  // ====================================================
  // LAYOUT ROUTER
  // ====================================================

  switch (
    layout
  ) {

    case 'logic_hook_stage':

      return (
        <LogicHookStage
          shot={shot}
        />
      );


    case 'three_box_logic_board':

      return (
        <BoxesFruit
          shot={shot}
        />
      );


    case 'logic_reasoning_flow':

      return (
        <LogicReasoning
          shot={shot}
        />
      );


    case 'ui_explainer':

      return (
        <UIExplainer
          shot={shot}
        />
      );


    case 'comparison_board':

      return (
        <ComparisonBoard
          shot={shot}
        />
      );


    case 'cta_endcard':

      return (
        <CTAEndcard
          shot={shot}
        />
      );


    default:

      return (
        <GenericVisual
          shot={shot}
        />
      );
  }
};


// ======================================================
// NORMALIZE INPUT
// ======================================================

const normalizeShots = ({
  timelineShots = [],
  scenes = [],
  scene = null,
  visual = null,
}) => {

  if (
    Array.isArray(
      timelineShots
    ) &&
    timelineShots.length >
      0
  ) {

    return timelineShots.map(
      shot => {

        const matchingScene =
          safeArray(
            scenes
          ).find(
            item =>
              item?.sceneId ===
              shot?.sceneId
          );


        return {

          ...(matchingScene || {}),

          ...(scene || {}),

          ...shot,

          visual:
            visual ||
            shot?.visual ||
            null,
        };
      }
    );
  }


  if (scene) {

    return [
      {

        ...scene,

        visual:
          visual ||
          null,

        startFrame:
          0,

        durationFrames:
          scene
            ?.durationFrames ||
          300,
      },
    ];
  }


  if (
    Array.isArray(
      scenes
    ) &&
    scenes.length >
      0
  ) {

    return scenes.map(
      (
        item,
        index
      ) => ({

        ...item,

        startFrame:
          item?.startFrame ||
          0,

        durationFrames:
          item
            ?.durationFrames ||
          300,

        shotId:
          item?.shotId ||
          `${item?.sceneId || index}_SHOT`,
      })
    );
  }


  return [];
};


// ======================================================
// MAIN COMPOSITION
// ======================================================

const YouTubeV4 = ({
  timelineShots = [],
  scenes = [],
  scene = null,
  visual = null,
}) => {

  const shots =
    normalizeShots({
      timelineShots,
      scenes,
      scene,
      visual,
    });


  return (

    <AbsoluteFill
      style={{
        background:
          COLORS.bg,
      }}
    >

      {shots.map(
        (
          shot,
          index
        ) => (

          <Sequence
            key={
              shot?.shotId ||
              shot?.sceneId ||
              index
            }

            from={
              Number(
                shot?.startFrame ||
                0
              )
            }

            durationInFrames={
              Math.max(
                1,
                Number(
                  shot
                    ?.durationFrames ||
                  1
                )
              )
            }
          >

            <ShotRenderer
              shot={shot}
            />

          </Sequence>

        )
      )}

    </AbsoluteFill>
  );
};


// ======================================================
// REMOTION ROOT
// ======================================================

export const RemotionRoot = () => (

  <Composition
    id="YouTubeV4"

    component={
      YouTubeV4
    }

    durationInFrames={
      DEFAULT_PROPS
        .totalDurationFrames
    }

    fps={
      DEFAULT_PROPS
        .fps
    }

    width={
      1920
    }

    height={
      1080
    }

    defaultProps={
      DEFAULT_PROPS
    }

    calculateMetadata={
      async ({
        props,
      }) => ({

        durationInFrames:
          Math.max(
            1,
            Number(
              props
                ?.totalDurationFrames ||

              props
                ?.scene
                ?.durationFrames ||

              props
                ?.timelineShots
                ?.[0]
                ?.durationFrames ||

              300
            )
          ),

        fps:
          Number(
            props?.fps ||
            30
          ),

        width:
          1920,

        height:
          1080,
      })
    }
  />

);
