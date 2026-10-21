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
// YOUTUBE V4.7 — PREMIUM TRANSFORMATION EDITION
// ======================================================
//
// MANTIENE:
// - Stock del hook a 0.72x
// - Trim inicial
// - Tres fases separadas
// - Arquitectura actual
// - Composition ID YouTubeV4
//
// AÑADE:
// - Barrido luminoso premium
// - Transformación visual más marcada
// - Entrada escalonada:
//      ENTRADA -> REGLAS -> SALIDA
// - Payoff final con impulso de escala
// - Mejor profundidad y contraste
//
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

  white: '#ffffff',

  textSoft:
    'rgba(255,255,255,0.72)',

  textMuted:
    'rgba(255,255,255,0.48)',

  blue: '#6d7cff',
  cyan: '#29d3ff',
  green: '#19d6a3',
  amber: '#ffbd59',
  red: '#ff6676',

  border:
    'rgba(255,255,255,0.14)',
};


const FONT =
  'Arial, Helvetica, sans-serif';


// ======================================================
// HELPERS
// ======================================================

const safeArray = (value) =>
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


const getTemplate = (shot) =>
  shot?.template ||
  shot?.visual?.template ||
  shot?.scene?.template ||
  'generic';


const getLayout = (shot) =>
  shot?.layout ||
  shot?.visual?.layout ||
  shot?.scene?.layout ||
  'generic';


const getHeadline = (shot) =>
  shot?.title ||
  shot?.textElements?.[0] ||
  shot?.visual?.textElements?.[0] ||
  '';


const getTextElements = (shot) =>
  safeArray(
    shot?.textElements ||
    shot?.visual?.textElements
  );


const getStock = (shot) =>
  shot?.stock ||
  shot?.visual?.stock ||
  shot?.scene?.stock ||
  null;


const getStockUrl = (shot) => {

  const stock =
    getStock(shot);


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
        layer?.type === 'video' &&
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


const getDurationFrames = (shot) =>
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
// PREMIUM LIGHT SWEEP
// ======================================================

const LightSweep = ({
  progress,
  opacity = 0.75,
}) => {

  const x =
    interpolate(
      progress,
      [0, 1],
      [-35, 135],
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
        pointerEvents:
          'none',

        overflow:
          'hidden',
      }}
    >

      <div
        style={{
          position:
            'absolute',

          top:
            '-15%',

          bottom:
            '-15%',

          left:
            `${x}%`,

          width:
            '16%',

          transform:
            'skewX(-14deg)',

          background:
            `linear-gradient(
              90deg,
              rgba(41,211,255,0),
              rgba(41,211,255,${opacity * 0.28}),
              rgba(255,255,255,${opacity}),
              rgba(25,214,163,${opacity * 0.30}),
              rgba(25,214,163,0)
            )`,

          filter:
            'blur(12px)',

          boxShadow:
            '0 0 80px rgba(41,211,255,.40)',

          mixBlendMode:
            'screen',
        }}
      />

    </AbsoluteFill>
  );
};


// ======================================================
// CINEMATIC VIDEO
// ======================================================

const CinematicVideo = ({
  shot,

  darkness = 0.14,

  saturation = 1.05,

  contrast = 1.05,

  brightness = 1,

  zoomStart = 1.02,

  zoomEnd = 1.08,

  position = 'center center',

  playbackRate = 1,

  trimStartSec = 0,
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


  const startFrom =
    Math.max(
      0,
      Math.round(
        trimStartSec *
        fps
      )
    );


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

          startFrom={
            startFrom
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
// GLASS PANEL
// ======================================================

const GlassPanel = ({
  children,
  style = {},
}) => (

  <div
    style={{
      background:
        'linear-gradient(145deg,rgba(14,20,32,.78),rgba(6,10,18,.65))',

      border:
        `1px solid ${COLORS.border}`,

      boxShadow:
        '0 28px 90px rgba(0,0,0,.30)',

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
// CHECK ROW
// ======================================================

const CheckRow = ({
  text,
  active = true,
}) => (

  <div
    style={{
      display:
        'flex',

      alignItems:
        'center',

      gap:
        14,

      marginTop:
        18,
    }}
  >

    <div
      style={{
        width:
          28,

        height:
          28,

        borderRadius:
          9,

        display:
          'flex',

        alignItems:
          'center',

        justifyContent:
          'center',

        background:
          active
            ? 'rgba(25,214,163,.18)'
            : 'rgba(255,102,118,.18)',

        border:
          active
            ? '1px solid rgba(25,214,163,.52)'
            : '1px solid rgba(255,102,118,.52)',

        color:
          active
            ? COLORS.green
            : COLORS.red,

        fontSize:
          18,

        fontWeight:
          900,
      }}
    >

      {active
        ? '✓'
        : '×'}

    </div>


    <div
      style={{
        color:
          '#fff',

        fontFamily:
          FONT,

        fontSize:
          27,

        fontWeight:
          650,
      }}
    >

      {text}

    </div>

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
// ======================================================
// 1. HOOK V4.7
// ======================================================
// ======================================================

const HookTransformation = ({
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


  const stockUrl =
    getStockUrl(
      shot
    );


  const texts =
    getTextElements(
      shot
    );


  const firstText =
    texts[0] ||
    'El caos no es un sistema';


  const secondText =
    texts[1] ||
    'Convierte el proceso en un asistente';


  const entrance =
    spring({
      frame,

      fps,

      config: {
        damping:
          15,

        stiffness:
          115,

        mass:
          0.85,
      },
    });


  // ====================================================
  // PHASES
  // ====================================================

  const phase1 =
    fadeInOut(
      progress,
      0.00,
      0.025,
      0.255,
      0.305
    );


  const phase2 =
    fadeInOut(
      progress,
      0.345,
      0.39,
      0.605,
      0.655
    );


  const phase3 =
    interpolate(
      progress,

      [
        0.705,
        0.765,
        1,
      ],

      [
        0,
        1,
        1,
      ],

      {
        extrapolateLeft:
          'clamp',

        extrapolateRight:
          'clamp',
      }
    );


  // ====================================================
  // TRANSITIONS
  // ====================================================

  const flash1 =
    interpolate(
      progress,

      [
        0.295,
        0.325,
        0.355,
      ],

      [
        0,
        0.30,
        0,
      ],

      {
        extrapolateLeft:
          'clamp',

        extrapolateRight:
          'clamp',
      }
    );


  const flash2 =
    interpolate(
      progress,

      [
        0.645,
        0.68,
        0.715,
      ],

      [
        0,
        0.24,
        0,
      ],

      {
        extrapolateLeft:
          'clamp',

        extrapolateRight:
          'clamp',
      }
    );


  // ====================================================
  // PREMIUM SWEEP
  // ====================================================

  const sweepProgress =
    interpolate(
      progress,

      [
        0.32,
        0.40,
        0.58,
        0.69,
      ],

      [
        0,
        0.10,
        0.88,
        1,
      ],

      {
        extrapolateLeft:
          'clamp',

        extrapolateRight:
          'clamp',
      }
    );


  const sweepOpacity =
    fadeInOut(
      progress,
      0.31,
      0.36,
      0.62,
      0.69
    );


  // ====================================================
  // STAGGERED CARDS
  // ====================================================

  const card1 =
    interpolate(
      progress,
      [0.37, 0.42],
      [0, 1],
      {
        extrapolateLeft:
          'clamp',
        extrapolateRight:
          'clamp',
      }
    );


  const card2 =
    interpolate(
      progress,
      [0.43, 0.48],
      [0, 1],
      {
        extrapolateLeft:
          'clamp',
        extrapolateRight:
          'clamp',
      }
    );


  const card3 =
    interpolate(
      progress,
      [0.49, 0.54],
      [0, 1],
      {
        extrapolateLeft:
          'clamp',
        extrapolateRight:
          'clamp',
      }
    );


  const cardReveals =
    [
      card1,
      card2,
      card3,
    ];


  // ====================================================
  // FINAL PAYOFF PUNCH
  // ====================================================

  const payoffPunch =
    spring({
      frame:
        Math.max(
          0,
          frame -
          Math.round(
            duration *
            0.71
          )
        ),

      fps,

      config: {
        damping:
          13,

        stiffness:
          125,

        mass:
          0.78,
      },
    });


  const payoffScale =
    interpolate(
      payoffPunch,
      [0, 1],
      [0.94, 1]
    );


  const payoffX =
    interpolate(
      payoffPunch,
      [0, 1],
      [-28, 0]
    );


  return (
    <AbsoluteFill
      style={{
        background:
          COLORS.bg,

        overflow:
          'hidden',
      }}
    >

      {stockUrl
        ? (

          <CinematicVideo
            shot={shot}

            darkness={0.045}

            saturation={1.11}

            contrast={1.07}

            brightness={1.04}

            zoomStart={1.015}

            zoomEnd={1.085}

            position="center center"

            playbackRate={0.72}

            trimStartSec={0.20}
          />

        )
        : (

          <>
            <BaseBackground />

            <AmbientGlow
              left="67%"
              top="43%"
              size={1200}
              color="41,211,255"
              opacity={0.18}
            />

            <Grid
              opacity={0.035}
            />
          </>

        )}


      {/* READABILITY */}

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg,rgba(3,5,9,.64) 0%,rgba(3,5,9,.22) 39%,rgba(3,5,9,.025) 72%,rgba(3,5,9,.02) 100%)',
        }}
      />


      {/* CINEMA BARS */}

      <div
        style={{
          position:
            'absolute',

          left:
            0,

          right:
            0,

          top:
            0,

          height:
            14,

          background:
            '#000',
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

          bottom:
            0,

          height:
            14,

          background:
            '#000',
        }}
      />


      {/* =================================================
          PHASE 1 — PROBLEM
      ================================================= */}

      <AbsoluteFill
        style={{
          opacity:
            phase1,
        }}
      >

        <div
          style={{
            position:
              'absolute',

            left:
              86,

            top:
              74,
          }}
        >

          <SectionLabel
            color={COLORS.red}
          >
            EL PROBLEMA
          </SectionLabel>

        </div>


        <div
          style={{
            position:
              'absolute',

            left:
              86,

            bottom:
              105,

            transform:
              `translateY(${(1 - entrance) * 42}px)`,

            opacity:
              entrance,
          }}
        >

          <HeroTitle
            size={82}
            width={820}
          >
            {firstText}
          </HeroTitle>


          <div
            style={{
              marginTop:
                20,

              maxWidth:
                665,

              fontFamily:
                FONT,

              color:
                'rgba(255,255,255,.72)',

              fontSize:
                29,

              lineHeight:
                1.35,

              fontWeight:
                620,
            }}
          >
            Información dispersa, tareas sin dueño
            y contexto que se pierde.
          </div>

        </div>


        <GlassPanel
          style={{
            position:
              'absolute',

            right:
              92,

            top:
              130,

            width:
              306,

            padding:
              '20px 24px',

            transform:
              `rotate(-2deg) translateY(${Math.sin(frame / 9) * 6}px)`,

            border:
              '1px solid rgba(255,102,118,.38)',
          }}
        >

          <div
            style={{
              fontFamily:
                FONT,

              color:
                COLORS.red,

              fontSize:
                16,

              fontWeight:
                900,

              letterSpacing:
                1.5,
            }}
          >
            PENDIENTE
          </div>


          <div
            style={{
              marginTop:
                10,

              fontFamily:
                FONT,

              color:
                '#fff',

              fontSize:
                27,

              fontWeight:
                820,
            }}
          >
            ¿Quién hace qué?
          </div>

        </GlassPanel>


        <GlassPanel
          style={{
            position:
              'absolute',

            right:
              130,

            bottom:
              135,

            width:
              326,

            padding:
              '20px 24px',

            transform:
              `rotate(2deg) translateY(${Math.sin((frame + 17) / 10) * 6}px)`,

            border:
              '1px solid rgba(255,189,89,.36)',
          }}
        >

          <div
            style={{
              fontFamily:
                FONT,

              color:
                COLORS.amber,

              fontSize:
                16,

              fontWeight:
                900,

              letterSpacing:
                1.5,
            }}
          >
            SIN ESTRUCTURA
          </div>


          <div
            style={{
              marginTop:
                10,

              fontFamily:
                FONT,

              color:
                '#fff',

              fontSize:
                27,

              fontWeight:
                820,
            }}
          >
            Repetir otra vez
          </div>

        </GlassPanel>

      </AbsoluteFill>


      {/* TRANSITION FLASH 1 */}

      <AbsoluteFill
        style={{
          opacity:
            flash1,

          background:
            'linear-gradient(110deg,rgba(255,255,255,.55),rgba(41,211,255,.28),transparent)',

          mixBlendMode:
            'screen',
        }}
      />


      {/* =================================================
          PHASE 2 — TRANSFORMATION
      ================================================= */}

      <AbsoluteFill
        style={{
          opacity:
            phase2,
        }}
      >

        <AmbientGlow
          left="54%"
          top="55%"
          size={1100}
          color="41,211,255"
          opacity={0.15}
        />


        <div
          style={{
            position:
              'absolute',

            left:
              86,

            top:
              74,
          }}
        >

          <SectionLabel
            color={COLORS.cyan}
          >
            TRANSFORMA
          </SectionLabel>

        </div>


        <div
          style={{
            position:
              'absolute',

            left:
              86,

            top:
              175,

            maxWidth:
              860,
          }}
        >

          <HeroTitle
            size={69}
            width={860}
          >
            De información suelta
            a un sistema claro.
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

            bottom:
              100,

            display:
              'grid',

            gridTemplateColumns:
              '1fr 74px 1fr 74px 1fr',

            alignItems:
              'center',

            gap:
              10,
          }}
        >

          {[
            {
              label:
                'ENTRADA',

              value:
                'Notas + contexto',

              color:
                COLORS.blue,
            },

            {
              label:
                'REGLAS',

              value:
                'Criterios claros',

              color:
                COLORS.cyan,
            },

            {
              label:
                'SALIDA',

              value:
                'Tareas concretas',

              color:
                COLORS.green,
            },
          ].map(
            (
              item,
              index
            ) => {

              const reveal =
                cardReveals[index];


              const translateY =
                interpolate(
                  reveal,
                  [0, 1],
                  [34, 0]
                );


              const scale =
                interpolate(
                  reveal,
                  [0, 1],
                  [0.94, 1]
                );


              return (

                <React.Fragment
                  key={
                    item.label
                  }
                >

                  <GlassPanel
                    style={{
                      padding:
                        '23px 25px',

                      minHeight:
                        124,

                      opacity:
                        reveal,

                      transform:
                        `translateY(${translateY}px) scale(${scale})`,

                      border:
                        `1px solid ${item.color}55`,

                      boxShadow:
                        reveal > 0.8
                          ? `0 18px 55px ${item.color}20`
                          : 'none',
                    }}
                  >

                    <div
                      style={{
                        color:
                          item.color,

                        fontFamily:
                          FONT,

                        fontSize:
                          16,

                        fontWeight:
                          900,

                        letterSpacing:
                          1.7,
                      }}
                    >
                      {item.label}
                    </div>


                    <div
                      style={{
                        marginTop:
                          12,

                        color:
                          '#fff',

                        fontFamily:
                          FONT,

                        fontSize:
                          27,

                        fontWeight:
                          800,
                      }}
                    >
                      {item.value}
                    </div>

                  </GlassPanel>


                  {index < 2
                    ? (

                      <div
                        style={{
                          textAlign:
                            'center',

                          fontFamily:
                            FONT,

                          color:
                            COLORS.cyan,

                          fontSize:
                            40,

                          fontWeight:
                            900,

                          opacity:
                            Math.min(
                              cardReveals[
                                index + 1
                              ],
                              0.78
                            ),

                          transform:
                            `scale(${0.8 + cardReveals[index + 1] * 0.2})`,
                        }}
                      >
                        →
                      </div>

                    )
                    : null}

                </React.Fragment>

              );
            }
          )}

        </div>

      </AbsoluteFill>


      {/* PREMIUM LIGHT SWEEP */}

      <AbsoluteFill
        style={{
          opacity:
            sweepOpacity,
        }}
      >

        <LightSweep
          progress={
            sweepProgress
          }

          opacity={
            0.78
          }
        />

      </AbsoluteFill>


      {/* TRANSITION FLASH 2 */}

      <AbsoluteFill
        style={{
          opacity:
            flash2,

          background:
            'linear-gradient(110deg,transparent,rgba(25,214,163,.34),rgba(255,255,255,.30))',

          mixBlendMode:
            'screen',
        }}
      />


      {/* =================================================
          PHASE 3 — PAYOFF
      ================================================= */}

      <AbsoluteFill
        style={{
          opacity:
            phase3,
        }}
      >

        <AbsoluteFill
          style={{
            background:
              'linear-gradient(90deg,rgba(3,5,9,.61) 0%,rgba(3,5,9,.19) 46%,rgba(3,5,9,.01) 76%,rgba(3,5,9,.005) 100%)',
          }}
        />


        <AmbientGlow
          left="30%"
          top="42%"
          size={900}
          color="25,214,163"
          opacity={0.09}
        />


        <div
          style={{
            position:
              'absolute',

            left:
              86,

            top:
              76,
          }}
        >

          <SectionLabel
            color={COLORS.green}
          >
            RESULTADO
          </SectionLabel>

        </div>


        <div
          style={{
            position:
              'absolute',

            left:
              86,

            top:
              205,

            maxWidth:
              880,

            transform:
              `translateX(${payoffX}px) scale(${payoffScale})`,

            transformOrigin:
              'left center',
          }}
        >

          <HeroTitle
            size={78}
            width={880}

            style={{
              textShadow:
                '0 18px 60px rgba(0,0,0,.58),0 0 36px rgba(25,214,163,.10)',
            }}
          >
            {secondText}
          </HeroTitle>


          <div
            style={{
              marginTop:
                28,

              display:
                'flex',

              gap:
                13,
            }}
          >

            <Badge
              color={COLORS.green}
            >
              CLARO
            </Badge>


            <Badge
              color={COLORS.cyan}
            >
              REUTILIZABLE
            </Badge>


            <Badge
              color={COLORS.blue}
            >
              MEDIBLE
            </Badge>

          </div>

        </div>

      </AbsoluteFill>

    </AbsoluteFill>
  );
};


// ======================================================
// 2. INTRO
// ======================================================

const StockPlusUI = ({
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
          95,
      },
    });


  return (
    <AbsoluteFill
      style={{
        background:
          COLORS.bg,
      }}
    >

      <CinematicVideo
        shot={shot}

        darkness={0.09}

        saturation={1.07}

        contrast={1.05}

        brightness={1.02}

        zoomStart={1.01}

        zoomEnd={1.06}
      />


      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg,rgba(3,5,9,.13) 0%,rgba(3,5,9,.08) 50%,rgba(3,5,9,.77) 100%)',
        }}
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
          DE RESPUESTA A ASISTENTE
        </SectionLabel>

      </div>


      <div
        style={{
          position:
            'absolute',

          left:
            80,

          bottom:
            90,

          width:
            760,

          transform:
            `translateY(${(1 - reveal) * 30}px)`,

          opacity:
            reveal,
        }}
      >

        <HeroTitle
          size={67}
        >
          Define el trabajo antes
          de elegir la herramienta.
        </HeroTitle>

      </div>


      <GlassPanel
        style={{
          position:
            'absolute',

          right:
            68,

          top:
            130,

          width:
            480,

          padding:
            '28px 32px',

          transform:
            `translateX(${(1 - reveal) * 70}px)`,

          opacity:
            reveal,
        }}
      >

        <Badge
          color={COLORS.blue}
        >
          3 CLAVES
        </Badge>


        <CheckRow
          text="Objetivo claro"
        />


        <CheckRow
          text="Contexto suficiente"
        />


        <CheckRow
          text="Formato de salida"
        />

      </GlassPanel>

    </AbsoluteFill>
  );
};


// ======================================================
// 3. NOTES TO STRUCTURE
// ======================================================

const NotesToStructure = ({
  shot,
}) => {

  const frame =
    useCurrentFrame();


  const {
    fps,
  } =
    useVideoConfig();


  const leftReveal =
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


  const rightReveal =
    spring({
      frame:
        frame - 12,

      fps,

      config: {
        damping:
          15,

        stiffness:
          105,
      },
    });


  return (
    <AbsoluteFill
      style={{
        background:
          COLORS.bg,
      }}
    >

      <CinematicVideo
        shot={shot}

        darkness={0.16}

        saturation={0.99}

        contrast={1.07}

        brightness={1.01}

        zoomStart={1.015}

        zoomEnd={1.055}
      />


      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg,rgba(2,4,8,.10),rgba(2,4,8,.43))',
        }}
      />


      <div
        style={{
          position:
            'absolute',

          left:
            72,

          top:
            60,
        }}
      >

        <SectionLabel
          color={COLORS.amber}
        >
          DEL CAOS A LA ESTRUCTURA
        </SectionLabel>

      </div>


      <div
        style={{
          position:
            'absolute',

          left:
            72,

          right:
            72,

          top:
            140,

          bottom:
            70,

          display:
            'grid',

          gridTemplateColumns:
            '0.92fr 82px 1.15fr',

          alignItems:
            'center',

          gap:
            18,
        }}
      >

        <GlassPanel
          style={{
            padding:
              30,

            minHeight:
              635,

            opacity:
              leftReveal,

            transform:
              `translateX(${(1 - leftReveal) * -55}px)`,
          }}
        >

          <Badge
            color={COLORS.red}
          >
            NOTAS ORIGINALES
          </Badge>


          <div
            style={{
              marginTop:
                28,

              fontFamily:
                FONT,

              color:
                '#fff',

              fontSize:
                31,

              fontWeight:
                820,
            }}
          >
            Reunión de proyecto
          </div>


          {[
            'Revisar presupuesto',
            'Confirmar responsable',
            'Enviar propuesta',
            'Pendiente fecha límite',
            'Validar cambios',
          ].map(
            (
              text,
              index
            ) => (

              <div
                key={
                  text
                }

                style={{
                  marginTop:
                    18,

                  padding:
                    '16px 18px',

                  borderRadius:
                    15,

                  background:
                    index % 2 === 0
                      ? 'rgba(255,102,118,.08)'
                      : 'rgba(255,255,255,.045)',

                  border:
                    '1px solid rgba(255,255,255,.075)',

                  color:
                    'rgba(255,255,255,.78)',

                  fontFamily:
                    FONT,

                  fontSize:
                    25,
                }}
              >
                • {text}
              </div>

            )
          )}

        </GlassPanel>


        <div
          style={{
            fontFamily:
              FONT,

            color:
              COLORS.cyan,

            fontSize:
              58,

            fontWeight:
              900,

            textAlign:
              'center',

            textShadow:
              '0 0 35px rgba(41,211,255,.40)',
          }}
        >
          →
        </div>


        <GlassPanel
          style={{
            padding:
              30,

            minHeight:
              635,

            opacity:
              rightReveal,

            transform:
              `translateX(${(1 - rightReveal) * 60}px)`,
          }}
        >

          <Badge
            color={COLORS.green}
          >
            SALIDA ESTRUCTURADA
          </Badge>


          <div
            style={{
              marginTop:
                28,

              display:
                'grid',

              gridTemplateColumns:
                '1fr 1fr',

              gap:
                14,
            }}
          >

            {[
              [
                'FUNCIÓN',
                'Organizar',
                COLORS.blue,
              ],

              [
                'CONTEXTO',
                'Notas',
                COLORS.cyan,
              ],

              [
                'REGLAS',
                'No inventar',
                COLORS.amber,
              ],

              [
                'FORMATO',
                'Tabla',
                COLORS.green,
              ],
            ].map(
              item => (

                <div
                  key={
                    item[0]
                  }

                  style={{
                    padding:
                      '18px 20px',

                    borderRadius:
                      16,

                    background:
                      `${item[2]}15`,

                    border:
                      `1px solid ${item[2]}50`,
                  }}
                >

                  <div
                    style={{
                      color:
                        item[2],

                      fontFamily:
                        FONT,

                      fontSize:
                        16,

                      fontWeight:
                        900,

                      letterSpacing:
                        1.4,
                    }}
                  >
                    {item[0]}
                  </div>


                  <div
                    style={{
                      marginTop:
                        7,

                      color:
                        '#fff',

                      fontFamily:
                        FONT,

                      fontSize:
                        25,

                      fontWeight:
                        780,
                    }}
                  >
                    {item[1]}
                  </div>

                </div>

              )
            )}

          </div>


          <div
            style={{
              marginTop:
                27,

              padding:
                '18px 22px',

              borderRadius:
                18,

              background:
                'rgba(25,214,163,.065)',

              border:
                '1px solid rgba(25,214,163,.25)',
            }}
          >

            <CheckRow
              text="Decisiones"
            />

            <CheckRow
              text="Tareas"
            />

            <CheckRow
              text="Responsable"
            />

            <CheckRow
              text="Fecha límite"
            />

          </div>

        </GlassPanel>

      </div>

    </AbsoluteFill>
  );
};


// ======================================================
// 4. GEMINI
// ======================================================

const GeminiGemSetup = ({
  shot,
}) => {

  const frame =
    useCurrentFrame();


  const {
    fps,
    durationInFrames,
  } =
    useVideoConfig();


  const windowReveal =
    spring({
      frame,

      fps,

      config: {
        damping:
          16,

        stiffness:
          95,
      },
    });


  const sceneDuration =
    Math.max(
      1,
      durationInFrames
    );


  const progress =
    clamp(
      frame /
      sceneDuration,
      0,
      1
    );


  const step =
    progress < 0.34
      ? 0
      : progress < 0.68
      ? 1
      : 2;


  return (
    <AbsoluteFill
      style={{
        background:
          COLORS.bg,
      }}
    >

      <BaseBackground />


      <AmbientGlow
        left="70%"
        top="40%"
        size={1100}
        color="109,124,255"
        opacity={0.20}
      />


      <Grid
        opacity={0.03}
      />


      <div
        style={{
          position:
            'absolute',

          left:
            72,

          top:
            58,
        }}
      >

        <SectionLabel
          color={COLORS.blue}
        >
          GEMINI GEMS
        </SectionLabel>

      </div>


      <GlassPanel
        style={{
          position:
            'absolute',

          left:
            72,

          right:
            72,

          top:
            122,

          bottom:
            62,

          overflow:
            'hidden',

          transform:
            `scale(${0.97 + windowReveal * 0.03})`,

          opacity:
            windowReveal,
        }}
      >

        <div
          style={{
            height:
              70,

            display:
              'flex',

            alignItems:
              'center',

            padding:
              '0 24px',

            borderBottom:
              '1px solid rgba(255,255,255,.09)',

            background:
              'rgba(255,255,255,.03)',
          }}
        >

          <div
            style={{
              display:
                'flex',

              gap:
                9,
            }}
          >

            {[
              '#ff6676',
              '#ffbd59',
              '#19d6a3',
            ].map(
              color => (

                <div
                  key={
                    color
                  }

                  style={{
                    width:
                      12,

                    height:
                      12,

                    borderRadius:
                      999,

                    background:
                      color,
                  }}
                />

              )
            )}

          </div>


          <div
            style={{
              marginLeft:
                24,

              color:
                'rgba(255,255,255,.45)',

              fontFamily:
                FONT,

              fontSize:
                18,
            }}
          >
            Gemini · Crear Gem
          </div>

        </div>


        <div
          style={{
            display:
              'grid',

            gridTemplateColumns:
              '310px 1fr',

            height:
              'calc(100% - 70px)',
          }}
        >

          <div
            style={{
              padding:
                26,

              borderRight:
                '1px solid rgba(255,255,255,.075)',

              background:
                'rgba(0,0,0,.15)',
            }}
          >

            <Badge
              color={COLORS.blue}
            >
              NUEVA GEM
            </Badge>


            {[
              'Nombre',
              'Instrucciones',
              'Prueba',
            ].map(
              (
                label,
                index
              ) => (

                <div
                  key={
                    label
                  }

                  style={{
                    marginTop:
                      22,

                    padding:
                      '16px 17px',

                    borderRadius:
                      14,

                    background:
                      index === step
                        ? 'rgba(109,124,255,.15)'
                        : 'rgba(255,255,255,.03)',

                    border:
                      index === step
                        ? '1px solid rgba(109,124,255,.42)'
                        : '1px solid rgba(255,255,255,.06)',

                    color:
                      index === step
                        ? '#fff'
                        : 'rgba(255,255,255,.50)',

                    fontFamily:
                      FONT,

                    fontSize:
                      23,

                    fontWeight:
                      760,
                  }}
                >
                  {index + 1}. {label}
                </div>

              )
            )}

          </div>


          <div
            style={{
              padding:
                '31px 38px',
            }}
          >

            <div
              style={{
                color:
                  '#fff',

                fontFamily:
                  FONT,

                fontSize:
                  40,

                fontWeight:
                  850,
              }}
            >
              Organizador de reuniones
            </div>


            <div
              style={{
                marginTop:
                  24,

                color:
                  COLORS.textSoft,

                fontFamily:
                  FONT,

                fontSize:
                  20,

                fontWeight:
                  700,
              }}
            >
              Instrucciones
            </div>


            <div
              style={{
                marginTop:
                  11,

                padding:
                  '22px 24px',

                minHeight:
                  235,

                borderRadius:
                  17,

                background:
                  'rgba(255,255,255,.04)',

                border:
                  '1px solid rgba(255,255,255,.10)',

                color:
                  'rgba(255,255,255,.80)',

                fontFamily:
                  FONT,

                fontSize:
                  24,

                lineHeight:
                  1.50,
              }}
            >

              Extrae decisiones, convierte compromisos
              en tareas y señala cualquier dato que falte.

              <br />
              <br />

              No inventes responsables ni fechas.
              Si falta información, indícala como pendiente.

            </div>


            <div
              style={{
                marginTop:
                  24,

                display:
                  'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'center',
              }}
            >

              <div
                style={{
                  color:
                    'rgba(255,255,255,.46)',

                  fontFamily:
                    FONT,

                  fontSize:
                    20,
                }}
              >
                Prueba antes de usarla con información real.
              </div>


              <div
                style={{
                  padding:
                    '16px 26px',

                  borderRadius:
                    14,

                  background:
                    step === 2
                      ? COLORS.green
                      : COLORS.blue,

                  color:
                    '#fff',

                  fontFamily:
                    FONT,

                  fontSize:
                    22,

                  fontWeight:
                    850,

                  boxShadow:
                    '0 10px 35px rgba(109,124,255,.22)',
                }}
              >
                Guardar y probar
              </div>

            </div>

          </div>

        </div>

      </GlassPanel>

    </AbsoluteFill>
  );
};


// ======================================================
// 5. CLAUDE
// ======================================================

const InstructionBuilder = ({
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
          95,
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


      <AmbientGlow
        left="28%"
        top="55%"
        size={1100}
        color="255,189,89"
        opacity={0.11}
      />


      <AmbientGlow
        left="75%"
        top="38%"
        size={1000}
        color="109,124,255"
        opacity={0.13}
      />


      <Grid
        opacity={0.03}
      />


      <div
        style={{
          position:
            'absolute',

          left:
            72,

          top:
            58,
        }}
      >

        <SectionLabel
          color={COLORS.amber}
        >
          CLAUDE COWORK
        </SectionLabel>

      </div>


      <div
        style={{
          position:
            'absolute',

          left:
            72,

          top:
            130,

          width:
            730,

          opacity:
            reveal,

          transform:
            `translateY(${(1 - reveal) * 32}px)`,
        }}
      >

        <HeroTitle
          size={60}
        >
          Conserva el objetivo.
          Cambia el flujo.
        </HeroTitle>

      </div>


      <GlassPanel
        style={{
          position:
            'absolute',

          left:
            72,

          right:
            72,

          top:
            320,

          bottom:
            62,

          padding:
            '29px 31px',

          opacity:
            reveal,
        }}
      >

        <div
          style={{
            display:
              'grid',

            gridTemplateColumns:
              '1fr 1fr 1fr',

            gap:
              20,
          }}
        >

          {[
            {
              label:
                'OBJETIVO',

              title:
                'Qué resultado buscas',

              body:
                'Mantén el mismo criterio definido para el asistente.',

              color:
                COLORS.blue,
            },

            {
              label:
                'CONTEXTO',

              title:
                'Añade notas o archivos',

              body:
                'Incluye únicamente la información necesaria para ejecutar la tarea.',

              color:
                COLORS.amber,
            },

            {
              label:
                'CONTROL',

              title:
                'Revisa permisos',

              body:
                'Comprueba qué compartes y qué puede utilizar la herramienta.',

              color:
                COLORS.green,
            },
          ].map(
            (
              item,
              index
            ) => (

              <div
                key={
                  item.label
                }

                style={{
                  padding:
                    '25px 25px',

                  borderRadius:
                    21,

                  background:
                    'rgba(255,255,255,.03)',

                  border:
                    `1px solid ${item.color}40`,

                  transform:
                    `translateY(${Math.sin((frame + index * 10) / 18) * 4}px)`,
                }}
              >

                <div
                  style={{
                    color:
                      item.color,

                    fontFamily:
                      FONT,

                    fontSize:
                      17,

                    fontWeight:
                      900,

                    letterSpacing:
                      1.7,
                  }}
                >
                  {item.label}
                </div>


                <div
                  style={{
                    marginTop:
                      16,

                    color:
                      '#fff',

                    fontFamily:
                      FONT,

                    fontSize:
                      30,

                    lineHeight:
                      1.10,

                    fontWeight:
                      850,
                  }}
                >
                  {item.title}
                </div>


                <div
                  style={{
                    marginTop:
                      18,

                    color:
                      COLORS.textSoft,

                    fontFamily:
                      FONT,

                    fontSize:
                      22,

                    lineHeight:
                      1.43,
                  }}
                >
                  {item.body}
                </div>

              </div>

            )
          )}

        </div>


        <div
          style={{
            marginTop:
              27,

            padding:
              '18px 22px',

            borderRadius:
              17,

            background:
              'rgba(255,189,89,.06)',

            border:
              '1px solid rgba(255,189,89,.23)',

            color:
              'rgba(255,255,255,.70)',

            fontFamily:
              FONT,

            fontSize:
              21,

            textAlign:
              'center',
          }}
        >
          Las opciones pueden variar según acceso y versión.
          Mantén constantes el objetivo, las reglas
          y el criterio de evaluación.
        </div>

      </GlassPanel>

    </AbsoluteFill>
  );
};


// ======================================================
// 6. DUAL COMPARISON
// ======================================================

const DualToolComparison = ({
  shot,
}) => {

  const frame =
    useCurrentFrame();


  const {
    fps,
  } =
    useVideoConfig();


  const left =
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


  const right =
    spring({
      frame:
        frame - 8,

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


      <AmbientGlow
        left="25%"
        top="45%"
        size={950}
        color="109,124,255"
        opacity={0.13}
      />


      <AmbientGlow
        left="75%"
        top="45%"
        size={950}
        color="25,214,163"
        opacity={0.12}
      />


      <Grid
        opacity={0.025}
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
            52,

          display:
            'flex',

          justifyContent:
            'center',
        }}
      >

        <SectionLabel
          color={COLORS.cyan}
        >
          MISMO OBJETIVO · DOS FLUJOS
        </SectionLabel>

      </div>


      <div
        style={{
          position:
            'absolute',

          left:
            70,

          right:
            70,

          top:
            125,

          bottom:
            62,

          display:
            'grid',

          gridTemplateColumns:
            '1fr 1fr',

          gap:
            26,
        }}
      >

        <GlassPanel
          style={{
            padding:
              31,

            transform:
              `translateX(${(1 - left) * -65}px)`,

            opacity:
              left,
          }}
        >

          <Badge
            color={COLORS.blue}
          >
            GEMINI GEMS
          </Badge>


          <div
            style={{
              marginTop:
                25,

              color:
                '#fff',

              fontFamily:
                FONT,

              fontSize:
                44,

              lineHeight:
                1.04,

              fontWeight:
                900,
            }}
          >
            Asistente reutilizable
          </div>


          <div
            style={{
              marginTop:
                35,
            }}
          >

            <CheckRow
              text="Instrucciones definidas"
            />

            <CheckRow
              text="Conversación repetible"
            />

            <CheckRow
              text="Mismo criterio"
            />

            <CheckRow
              text="Configuración sencilla"
            />

          </div>


          <div
            style={{
              marginTop:
                45,

              height:
                165,

              borderRadius:
                19,

              background:
                'linear-gradient(135deg,rgba(109,124,255,.20),rgba(41,211,255,.055))',

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              color:
                '#fff',

              fontFamily:
                FONT,

              fontSize:
                27,

              fontWeight:
                900,
            }}
          >
            INSTRUCCIONES → RESPUESTA
          </div>

        </GlassPanel>


        <GlassPanel
          style={{
            padding:
              31,

            transform:
              `translateX(${(1 - right) * 65}px)`,

            opacity:
              right,
          }}
        >

          <Badge
            color={COLORS.green}
          >
            CLAUDE COWORK
          </Badge>


          <div
            style={{
              marginTop:
                25,

              color:
                '#fff',

              fontFamily:
                FONT,

              fontSize:
                44,

              lineHeight:
                1.04,

              fontWeight:
                900,
            }}
          >
            Flujo de trabajo
          </div>


          <div
            style={{
              marginTop:
                35,
            }}
          >

            <CheckRow
              text="Contexto y archivos"
            />

            <CheckRow
              text="Proceso más amplio"
            />

            <CheckRow
              text="Permisos a revisar"
            />

            <CheckRow
              text="Resultado orientado a tarea"
            />

          </div>


          <div
            style={{
              marginTop:
                45,

              height:
                165,

              borderRadius:
                19,

              background:
                'linear-gradient(135deg,rgba(25,214,163,.18),rgba(255,189,89,.055))',

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              color:
                '#fff',

              fontFamily:
                FONT,

              fontSize:
                27,

              fontWeight:
                900,
            }}
          >
            CONTEXTO → ACCIÓN → ENTREGA
          </div>

        </GlassPanel>

      </div>

    </AbsoluteFill>
  );
};


// ======================================================
// 7. VALIDATION
// ======================================================

const BeforeAfterValidation = ({
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
      frame:
        frame - 10,

      fps,

      config: {
        damping:
          15,

        stiffness:
          105,
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
        opacity={0.03}
      />


      <AmbientGlow
        left="25%"
        top="52%"
        size={900}
        color="255,102,118"
        opacity={0.09}
      />


      <AmbientGlow
        left="76%"
        top="52%"
        size={900}
        color="25,214,163"
        opacity={0.10}
      />


      <div
        style={{
          position:
            'absolute',

          left:
            74,

          top:
            60,
        }}
      >

        <SectionLabel
          color={COLORS.green}
        >
          PRUEBA · REVISA · MEJORA
        </SectionLabel>

      </div>


      <div
        style={{
          position:
            'absolute',

          left:
            74,

          right:
            74,

          top:
            135,

          bottom:
            66,

          display:
            'grid',

          gridTemplateColumns:
            '1fr 1fr',

          gap:
            26,
        }}
      >

        <GlassPanel
          style={{
            padding:
              31,
          }}
        >

          <Badge
            color={COLORS.red}
          >
            ANTES
          </Badge>


          <div
            style={{
              marginTop:
                25,

              color:
                '#fff',

              fontFamily:
                FONT,

              fontSize:
                40,

              fontWeight:
                880,
            }}
          >
            Instrucción ambigua
          </div>


          <div
            style={{
              marginTop:
                27,

              padding:
                '22px 23px',

              borderRadius:
                18,

              background:
                'rgba(255,102,118,.065)',

              border:
                '1px solid rgba(255,102,118,.24)',

              color:
                'rgba(255,255,255,.86)',

              fontFamily:
                FONT,

              fontSize:
                26,

              lineHeight:
                1.43,
            }}
          >
            “Hazme un resumen de estas notas.”
          </div>


          <div
            style={{
              marginTop:
                32,
            }}
          >

            <CheckRow
              text="Formato poco claro"
              active={false}
            />

            <CheckRow
              text="Puede inventar huecos"
              active={false}
            />

            <CheckRow
              text="Resultado inconsistente"
              active={false}
            />

          </div>

        </GlassPanel>


        <GlassPanel
          style={{
            padding:
              31,

            opacity:
              reveal,

            transform:
              `translateX(${(1 - reveal) * 50}px)`,
          }}
        >

          <Badge
            color={COLORS.green}
          >
            DESPUÉS
          </Badge>


          <div
            style={{
              marginTop:
                25,

              color:
                '#fff',

              fontFamily:
                FONT,

              fontSize:
                40,

              fontWeight:
                880,
            }}
          >
            Instrucción concreta
          </div>


          <div
            style={{
              marginTop:
                27,

              padding:
                '22px 23px',

              borderRadius:
                18,

              background:
                'rgba(25,214,163,.065)',

              border:
                '1px solid rgba(25,214,163,.25)',

              color:
                'rgba(255,255,255,.86)',

              fontFamily:
                FONT,

              fontSize:
                25,

              lineHeight:
                1.43,
            }}
          >
            “Extrae decisiones, responsables y tareas.
            Si falta información, indícalo.”
          </div>


          <div
            style={{
              marginTop:
                32,
            }}
          >

            <CheckRow
              text="Formato definido"
            />

            <CheckRow
              text="No inventa datos"
            />

            <CheckRow
              text="Resultado comparable"
            />

          </div>

        </GlassPanel>

      </div>

    </AbsoluteFill>
  );
};


// ======================================================
// 8. CTA
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


  return (
    <AbsoluteFill
      style={{
        background:
          COLORS.bg,
      }}
    >

      <CinematicVideo
        shot={shot}

        darkness={0.13}

        saturation={1.04}

        contrast={1.06}

        brightness={1.02}

        zoomStart={1.015}

        zoomEnd={1.055}
      />


      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg,rgba(3,5,9,.57),rgba(3,5,9,.19),rgba(3,5,9,.57))',
        }}
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
              1120,

            padding:
              '50px 62px',

            textAlign:
              'center',

            transform:
              `scale(${0.95 + pop * 0.05})`,
          }}
        >

          <Badge
            color={COLORS.cyan}
          >
            TU TURNO
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
                58,

              lineHeight:
                1.04,

              fontWeight:
                900,

              letterSpacing:
                -1.8,
            }}
          >
            ¿Qué tarea convertirías primero
            en un asistente?
          </div>


          <div
            style={{
              margin:
                '36px auto 0',

              width:
                730,

              padding:
                '18px 23px',

              borderRadius:
                16,

              background:
                'rgba(255,255,255,.05)',

              border:
                '1px solid rgba(255,255,255,.11)',

              color:
                'rgba(255,255,255,.50)',

              fontFamily:
                FONT,

              fontSize:
                25,

              textAlign:
                'left',
            }}
          >

            Escríbela en comentarios...

            <span
              style={{
                opacity:
                  frame % 20 < 10
                    ? 1
                    : 0,
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
          {getHeadline(
            shot
          )}
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


  switch (
    template
  ) {

    case 'hook_transformation':

      return (
        <HookTransformation
          shot={shot}
        />
      );


    case 'intro_problem_solution':

      return (
        <StockPlusUI
          shot={shot}
        />
      );


    case 'notes_to_structure':

      return (
        <NotesToStructure
          shot={shot}
        />
      );


    case 'gemini_gem_setup':

      return (
        <GeminiGemSetup
          shot={shot}
        />
      );


    case 'instruction_builder':

      return (
        <InstructionBuilder
          shot={shot}
        />
      );


    case 'dual_tool_comparison':

      return (
        <DualToolComparison
          shot={shot}
        />
      );


    case 'before_after_validation':

      return (
        <BeforeAfterValidation
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


  switch (
    layout
  ) {

    case 'dynamic_problem_solution':

      return (
        <HookTransformation
          shot={shot}
        />
      );


    case 'stock_background_with_ui_overlay':

      return (
        <StockPlusUI
          shot={shot}
        />
      );


    case 'split_context_and_output':

      return (
        <NotesToStructure
          shot={shot}
        />
      );


    case 'full_ui_with_detail_zoom':

      return (
        <GeminiGemSetup
          shot={shot}
        />
      );


    case 'split_screen_50_50':

      return (
        <DualToolComparison
          shot={shot}
        />
      );


    case 'test_review_improve':

      return (
        <BeforeAfterValidation
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
    timelineShots.length > 0
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
          scene?.durationFrames ||
          300,
      },
    ];
  }


  if (
    Array.isArray(
      scenes
    ) &&
    scenes.length > 0
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
          item?.durationFrames ||
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
                  shot?.durationFrames ||
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
