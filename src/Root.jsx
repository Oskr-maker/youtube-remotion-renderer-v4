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
// - Endpoint /render-v4
// - Composition ID YouTubeV4
//
// Añade soporte para:
// - logic_hook
// - boxes_fruit
// - logic_reasoning
// - ui_explainer
// - comparison
// - cta
//
// Mantiene fallback genérico.
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
// LOGIC HOOK
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


  const entrance =
    spring({
      frame,

      fps,

      config: {
        damping:
          14,

        stiffness:
          115,

        mass:
          0.8,
      },
    });


  const cameraScale =
    interpolate(
      progress,
      [0, 1],
      [1, 1.075]
    );


  const labelsProgress =
    interpolate(
      progress,
      [0.15, 0.32],
      [0, 1],
      {
        extrapolateLeft:
          'clamp',

        extrapolateRight:
          'clamp',
      }
    );


  const mysteryProgress =
    interpolate(
      progress,
      [0.30, 0.58],
      [0, 1],
      {
        extrapolateLeft:
          'clamp',

        extrapolateRight:
          'clamp',
      }
    );


  const questionProgress =
    interpolate(
      progress,
      [0.65, 0.83],
      [0, 1],
      {
        extrapolateLeft:
          'clamp',

        extrapolateRight:
          'clamp',
      }
    );


  const boxes = [
    {
      label:
        'MANZANAS',

      icon:
        '🍎',
    },

    {
      label:
        'NARANJAS',

      icon:
        '🍊',
    },

    {
      label:
        'MEZCLA',

      icon:
        '🍎 🍊',
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
        opacity={0.045}
      />

      <AmbientGlow
        left="50%"
        top="48%"
        size={1300}
        color="41,211,255"
        opacity={0.20}
      />

      <AmbientGlow
        left="30%"
        top="58%"
        size={850}
        color="168,121,255"
        opacity={0.09}
      />


      <AbsoluteFill
        style={{
          transform:
            `scale(${cameraScale})`,
        }}
      >

        <div
          style={{
            position:
              'absolute',

            top:
              58,

            left:
              0,

            right:
              0,

            display:
              'flex',

            justifyContent:
              'center',
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


        <div
          style={{
            position:
              'absolute',

            top:
              115,

            left:
              0,

            right:
              0,

            display:
              'flex',

            justifyContent:
              'center',

            opacity:
              interpolate(
                progress,
                [0, 0.08],
                [0, 1],
                {
                  extrapolateLeft:
                    'clamp',

                  extrapolateRight:
                    'clamp',
                }
              ),
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


        <div
          style={{
            position:
              'absolute',

            left:
              0,

            right:
              0,

            top:
              305,

            display:
              'flex',

            justifyContent:
              'center',

            gap:
              65,

            transform:
              `translateY(${(1 - entrance) * 70}px)`,

            opacity:
              entrance,
          }}
        >

          {boxes.map(
            (
              box,
              index
            ) => {

              const localEntrance =
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
                      14,

                    stiffness:
                      120,
                  },
                });


              const pulse =
                1 +
                Math.sin(
                  (
                    frame +
                    index * 9
                  ) /
                  5
                ) *
                0.012 *
                mysteryProgress;


              return (

                <div
                  key={
                    box.label
                  }

                  style={{
                    width:
                      390,

                    height:
                      315,

                    position:
                      'relative',

                    overflow:
                      'hidden',

                    borderRadius:
                      30,

                    background:
                      'linear-gradient(145deg,#1c2636,#0d131e)',

                    border:
                      `2px solid rgba(255,255,255,${0.14 + mysteryProgress * 0.1})`,

                    boxShadow:
                      `0 35px 90px rgba(0,0,0,.45),
                       0 0 ${50 * mysteryProgress}px rgba(41,211,255,.18)`,

                    opacity:
                      localEntrance,

                    transform:
                      `scale(${localEntrance * pulse}) translateY(${(1 - localEntrance) * 45}px)`,
                  }}
                >

                  <div
                    style={{
                      position:
                        'absolute',

                      left:
                        20,

                      right:
                        20,

                      top:
                        20,

                      height:
                        74,

                      borderRadius:
                        18,

                      background:
                        'linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.025))',

                      border:
                        '1px solid rgba(255,255,255,.10)',
                    }}
                  />


                  <div
                    style={{
                      position:
                        'absolute',

                      left:
                        0,

                      right:
                        0,

                      top:
                        105,

                      textAlign:
                        'center',

                      fontSize:
                        72,

                      filter:
                        'drop-shadow(0 14px 30px rgba(0,0,0,.35))',
                    }}
                  >

                    {box.icon}

                  </div>


                  <div
                    style={{
                      position:
                        'absolute',

                      left:
                        30,

                      right:
                        30,

                      bottom:
                        32,

                      padding:
                        '17px 15px',

                      borderRadius:
                        14,

                      textAlign:
                        'center',

                      fontFamily:
                        FONT,

                      fontSize:
                        27,

                      fontWeight:
                        900,

                      letterSpacing:
                        1.1,

                      color:
                        '#fff',

                      background:
                        'rgba(255,189,89,.14)',

                      border:
                        '1px solid rgba(255,189,89,.50)',

                      transform:
                        `scaleY(${labelsProgress})`,

                      opacity:
                        labelsProgress,

                      transformOrigin:
                        'center',
                    }}
                  >

                    {box.label}

                  </div>


                  <div
                    style={{
                      position:
                        'absolute',

                      right:
                        18,

                      top:
                        18,

                      width:
                        48,

                      height:
                        48,

                      borderRadius:
                        '50%',

                      display:
                        'flex',

                      alignItems:
                        'center',

                      justifyContent:
                        'center',

                      background:
                        'rgba(255,102,118,.15)',

                      border:
                        '1px solid rgba(255,102,118,.65)',

                      color:
                        COLORS.red,

                      fontSize:
                        31,

                      fontWeight:
                        900,

                      opacity:
                        mysteryProgress,

                      transform:
                        `scale(${0.7 + mysteryProgress * 0.3})`,
                    }}
                  >
                    ×
                  </div>

                </div>

              );
            }
          )}

        </div>


        <div
          style={{
            position:
              'absolute',

            left:
              0,

            right:
              0,

            bottom:
              105,

            textAlign:
              'center',

            opacity:
              mysteryProgress *
              (
                1 -
                questionProgress *
                0.9
              ),

            transform:
              `translateY(${(1 - mysteryProgress) * 25}px)`,
          }}
        >

          <div
            style={{
              fontFamily:
                FONT,

              fontSize:
                42,

              fontWeight:
                900,

              color:
                COLORS.red,

              letterSpacing:
                -0.8,

              textShadow:
                '0 10px 35px rgba(0,0,0,.45)',
            }}
          >
            {title2}
          </div>

        </div>

      </AbsoluteFill>


      <AbsoluteFill
        style={{
          justifyContent:
            'center',

          alignItems:
            'center',

          opacity:
            questionProgress,

          background:
            `rgba(4,7,12,${questionProgress * 0.74})`,
        }}
      >

        <GlassPanel
          style={{
            padding:
              '42px 74px',

            transform:
              `scale(${0.88 + questionProgress * 0.12})`,

            textAlign:
              'center',
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
                26,

              fontFamily:
                FONT,

              fontSize:
                70,

              fontWeight:
                950,

              color:
                '#fff',

              letterSpacing:
                -2,
            }}
          >
            {title3}
          </div>

        </GlassPanel>

      </AbsoluteFill>


      <Vignette
        opacity={0.30}
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


  const reveal =
    spring({
      frame,
      fps,

      config: {
        damping:
          15,

        stiffness:
          105,
      },
    });


  const focusIndex =
    Math.min(
      2,
      Math.floor(
        progress *
        3
      )
    );


  const boxes = [
    {
      title:
        'MANZANAS',

      icon:
        '🍎',

      accent:
        COLORS.red,
    },

    {
      title:
        'NARANJAS',

      icon:
        '🍊',

      accent:
        COLORS.amber,
    },

    {
      title:
        'MEZCLA',

      icon:
        '🍎 🍊',

      accent:
        COLORS.cyan,
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
        opacity={0.04}
      />

      <AmbientGlow
        left="52%"
        top="52%"
        size={1250}
        color="109,124,255"
        opacity={0.15}
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
          size={59}
          width={1300}
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

          left:
            90,

          right:
            90,

          top:
            345,

          display:
            'flex',

          gap:
            52,

          justifyContent:
            'center',
        }}
      >

        {boxes.map(
          (
            box,
            index
          ) => {

            const active =
              index ===
              focusIndex;


            const local =
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
                    110,
                },
              });


            return (

              <GlassPanel
                key={
                  box.title
                }

                style={{
                  width:
                    430,

                  height:
                    390,

                  padding:
                    32,

                  opacity:
                    local,

                  transform:
                    `translateY(${(1 - local) * 40}px) scale(${active ? 1.055 : 1})`,

                  border:
                    active
                      ? `2px solid ${box.accent}`
                      : `1px solid ${COLORS.border}`,

                  boxShadow:
                    active
                      ? `0 25px 100px ${box.accent}30`
                      : '0 28px 90px rgba(0,0,0,.30)',
                }}
              >

                <div
                  style={{
                    textAlign:
                      'center',

                    fontSize:
                      95,

                    marginTop:
                      15,
                  }}
                >
                  {box.icon}
                </div>


                <div
                  style={{
                    marginTop:
                      38,

                    padding:
                      '18px 16px',

                    borderRadius:
                      14,

                    textAlign:
                      'center',

                    color:
                      '#fff',

                    fontFamily:
                      FONT,

                    fontSize:
                      27,

                    fontWeight:
                      900,

                    background:
                      `${box.accent}16`,

                    border:
                      `1px solid ${box.accent}55`,
                  }}
                >

                  {box.title}

                </div>


                <div
                  style={{
                    marginTop:
                      23,

                    textAlign:
                      'center',

                    color:
                      COLORS.red,

                    fontFamily:
                      FONT,

                    fontWeight:
                      900,

                    fontSize:
                      24,

                    opacity:
                      reveal,
                  }}
                >
                  ETIQUETA INCORRECTA
                </div>

              </GlassPanel>

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
        'Una sola extracción revela información suficiente.',
    },

    {
      number:
        '03',

      title:
        'Resultado',

      text:
        'El resto se deduce eliminando posibilidades.',
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
            'La clave es reducir las posibilidades'
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
            45,
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
                      index === 2
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
            Puede acertar la respuesta,
            pero no explicar con claridad
            cómo llegó hasta ella.
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
  // V5 TEMPLATE ROUTER
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


    // --------------------------------------------------
    // ALIASES LEGACY
    // --------------------------------------------------

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
  // V5 LAYOUT ROUTER
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


    // --------------------------------------------------
    // LEGACY LAYOUT ALIASES
    // --------------------------------------------------

    case 'dynamic_problem_solution':

      return (
        <LogicHookStage
          shot={shot}
        />
      );


    case 'stock_background_with_ui_overlay':

      return (
        <UIExplainer
          shot={shot}
        />
      );


    case 'split_context_and_output':

      return (
        <LogicReasoning
          shot={shot}
        />
      );


    case 'full_ui_with_detail_zoom':

      return (
        <UIExplainer
          shot={shot}
        />
      );


    case 'split_screen_50_50':

      return (
        <ComparisonBoard
          shot={shot}
        />
      );


    case 'test_review_improve':

      return (
        <ComparisonBoard
          shot={shot}
        />
      );


    case 'centered_cta_with_background':

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
