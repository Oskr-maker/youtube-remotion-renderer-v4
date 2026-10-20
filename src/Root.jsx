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
// YOUTUBE V4.4 — CINEMATIC REAL-ASSET EDITION
// ======================================================
//
// OBJETIVO:
// - El vídeo REAL es protagonista.
// - La UI explica, no tapa.
// - Menos tarjetas.
// - Más profundidad.
// - Mejor jerarquía visual.
// - Movimiento continuo.
// - Diseño distinto por escena.
// - Look editorial / tecnológico / cinematográfico.
// - Compatible con el manifest V4.2.10 actual.
//
// COMPOSITION ID:
// YouTubeV4
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
  textSoft: 'rgba(255,255,255,0.72)',
  textMuted: 'rgba(255,255,255,0.48)',

  blue: '#6d7cff',
  cyan: '#29d3ff',
  green: '#19d6a3',
  amber: '#ffbd59',
  red: '#ff6676',

  glass: 'rgba(10,15,25,0.74)',
  glassStrong: 'rgba(8,12,20,0.88)',
  border: 'rgba(255,255,255,0.14)',
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
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
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
      position: 'absolute',
      left,
      top,
      width: size,
      height: size,
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
  opacity = 0.45,
}) => (
  <AbsoluteFill
    style={{
      background:
        `radial-gradient(circle at 50% 45%,transparent 38%,rgba(0,0,0,${opacity}) 100%)`,
      pointerEvents:
        'none',
    }}
  />
);


// ======================================================
// CINEMATIC STOCK VIDEO
// ======================================================

const CinematicVideo = ({
  shot,
  darkness = 0.18,
  saturation = 1.05,
  contrast = 1.05,
  zoomStart = 1.02,
  zoomEnd = 1.09,
  position = 'center center',
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
              `translateX(${panX}px) scale(${scale})`,
            filter:
              `saturate(${saturation}) contrast(${contrast})`,
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
        opacity={0.34}
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
        'linear-gradient(145deg,rgba(14,20,32,.82),rgba(6,10,18,.70))',

      border:
        `1px solid ${COLORS.border}`,

      boxShadow:
        '0 28px 90px rgba(0,0,0,.32)',

      backdropFilter:
        'blur(18px)',

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
// SMALL CHECK ROW
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
        'rgba(255,255,255,.72)',

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
    }}
  >
    {children}
  </div>
);


// ======================================================
// ======================================================
// 1. HOOK — CINEMATIC REAL VIDEO
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
    'Tus notas son ruido';

  const secondText =
    texts[1] ||
    'Convierte el proceso en un asistente';


  const titleSpring =
    spring({
      frame,
      fps,
      config: {
        damping: 15,
        stiffness: 110,
        mass: 0.85,
      },
    });


  const chaosOpacity =
    fadeInOut(
      progress,
      0,
      0.03,
      0.25,
      0.39
    );


  const transformationOpacity =
    fadeInOut(
      progress,
      0.28,
      0.38,
      0.64,
      0.73
    );


  const payoff =
    interpolate(
      progress,
      [
        0.60,
        0.74,
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
            darkness={0.10}
            saturation={1.08}
            contrast={1.07}
            zoomStart={1.01}
            zoomEnd={1.10}
          />
        )
        : (
          <>
            <BaseBackground />

            <AmbientGlow
              left="68%"
              top="42%"
              size={1200}
              color="41,211,255"
              opacity={0.19}
            />

            <Grid
              opacity={0.04}
            />
          </>
        )}


      {/* LEFT READABILITY GRADIENT */}

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg,rgba(3,5,9,.74) 0%,rgba(3,5,9,.30) 40%,rgba(3,5,9,.04) 72%,rgba(3,5,9,.10) 100%)',
        }}
      />


      {/* CINEMATIC TOP/BOTTOM */}

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
            18,

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
            18,

          background:
            '#000',
        }}
      />


      {/* PHASE 1 */}

      <AbsoluteFill
        style={{
          opacity:
            chaosOpacity,
        }}
      >

        <div
          style={{
            position:
              'absolute',

            left:
              92,

            top:
              86,
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
              92,

            bottom:
              118,

            transform:
              `translateY(${(1 - titleSpring) * 44}px)`,

            opacity:
              titleSpring,
          }}
        >
          <HeroTitle
            size={84}
            width={850}
          >
            {firstText}
          </HeroTitle>


          <div
            style={{
              marginTop:
                22,

              maxWidth:
                680,

              fontFamily:
                FONT,

              color:
                'rgba(255,255,255,.72)',

              fontSize:
                30,

              lineHeight:
                1.35,

              fontWeight:
                600,
            }}
          >
            Notas dispersas, tareas sin dueño y
            contexto que se pierde.
          </div>
        </div>


        {/* ONLY TWO CARDS — NOT FIVE */}

        <GlassPanel
          style={{
            position:
              'absolute',

            right:
              100,

            top:
              130,

            width:
              320,

            padding:
              '22px 26px',

            transform:
              `rotate(-3deg) translateY(${Math.sin(frame / 9) * 8}px)`,

            border:
              '1px solid rgba(255,102,118,.40)',
          }}
        >
          <div
            style={{
              fontFamily:
                FONT,

              color:
                COLORS.red,

              fontSize:
                17,

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
                12,

              fontFamily:
                FONT,

              color:
                '#fff',

              fontSize:
                29,

              fontWeight:
                800,
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
              145,

            bottom:
              150,

            width:
              340,

            padding:
              '22px 26px',

            transform:
              `rotate(3deg) translateY(${Math.sin((frame + 15) / 10) * 8}px)`,

            border:
              '1px solid rgba(255,189,89,.38)',
          }}
        >
          <div
            style={{
              fontFamily:
                FONT,

              color:
                COLORS.amber,

              fontSize:
                17,

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
                12,

              fontFamily:
                FONT,

              color:
                '#fff',

              fontSize:
                29,

              fontWeight:
                800,
            }}
          >
            Repetir otra vez
          </div>
        </GlassPanel>

      </AbsoluteFill>


      {/* PHASE 2 — TRANSFORMATION */}

      <AbsoluteFill
        style={{
          opacity:
            transformationOpacity,
        }}
      >

        <AmbientGlow
          left="55%"
          top="50%"
          size={1100}
          color="41,211,255"
          opacity={0.17}
        />


        <div
          style={{
            position:
              'absolute',

            left:
              92,

            top:
              86,
          }}
        >
          <SectionLabel>
            TRANSFORMA
          </SectionLabel>
        </div>


        <div
          style={{
            position:
              'absolute',

            left:
              92,

            top:
              215,

            width:
              700,
          }}
        >
          <HeroTitle
            size={75}
          >
            De información suelta a un sistema claro.
          </HeroTitle>
        </div>


        <div
          style={{
            position:
              'absolute',

            left:
              95,

            right:
              95,

            bottom:
              110,

            display:
              'grid',

            gridTemplateColumns:
              '1fr 100px 1fr 100px 1fr',

            alignItems:
              'center',

            gap:
              14,
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
            ) => (

              <React.Fragment
                key={
                  item.label
                }
              >

                <GlassPanel
                  style={{
                    padding:
                      '26px 28px',

                    minHeight:
                      135,

                    transform:
                      `translateY(${Math.sin((frame + index * 9) / 14) * 4}px)`,
                  }}
                >
                  <div
                    style={{
                      color:
                        item.color,

                      fontFamily:
                        FONT,

                      fontSize:
                        18,

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
                        14,

                      color:
                        '#fff',

                      fontFamily:
                        FONT,

                      fontSize:
                        31,

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
                          46,

                        fontWeight:
                          900,

                        opacity:
                          0.78,
                      }}
                    >
                      →
                    </div>
                  )
                  : null}

              </React.Fragment>
            )
          )}

        </div>

      </AbsoluteFill>


      {/* PHASE 3 — PAYOFF */}

      <AbsoluteFill
        style={{
          opacity:
            payoff,
        }}
      >

        <AbsoluteFill
          style={{
            background:
              'linear-gradient(90deg,rgba(3,5,9,.76) 0%,rgba(3,5,9,.32) 47%,rgba(3,5,9,.06) 100%)',
          }}
        />


        <div
          style={{
            position:
              'absolute',

            left:
              92,

            top:
              88,
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
              92,

            top:
              205,
          }}
        >
          <HeroTitle
            size={82}
            width={900}
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
                14,
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
// ======================================================
// 2. INTRO — STOCK + UI, VIDEO DOMINANT
// ======================================================
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
        damping: 16,
        stiffness: 95,
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
        darkness={0.12}
        saturation={1.06}
        contrast={1.05}
        zoomStart={1.015}
        zoomEnd={1.07}
      />


      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg,rgba(3,5,9,.16) 0%,rgba(3,5,9,.12) 52%,rgba(3,5,9,.82) 100%)',
        }}
      />


      <div
        style={{
          position:
            'absolute',

          left:
            85,

          top:
            80,
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
            85,

          bottom:
            95,

          width:
            780,

          transform:
            `translateY(${(1 - reveal) * 30}px)`,

          opacity:
            reveal,
        }}
      >
        <HeroTitle
          size={70}
        >
          Define el trabajo antes de elegir la herramienta.
        </HeroTitle>
      </div>


      <GlassPanel
        style={{
          position:
            'absolute',

          right:
            72,

          top:
            130,

          width:
            500,

          padding:
            '30px 34px',

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
// ======================================================
// 3. NOTES → STRUCTURE
// ======================================================
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
        darkness={0.22}
        saturation={0.96}
        contrast={1.08}
        zoomStart={1.02}
        zoomEnd={1.065}
      />


      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg,rgba(2,4,8,.15),rgba(2,4,8,.50))',
        }}
      />


      <div
        style={{
          position:
            'absolute',

          left:
            78,

          top:
            68,
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
            78,

          right:
            78,

          top:
            150,

          bottom:
            80,

          display:
            'grid',

          gridTemplateColumns:
            '0.95fr 100px 1.2fr',

          alignItems:
            'center',

          gap:
            20,
        }}
      >

        {/* RAW */}

        <GlassPanel
          style={{
            padding:
              32,

            minHeight:
              650,

            opacity:
              leftReveal,

            transform:
              `translateX(${(1 - leftReveal) * -60}px)`,
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
                30,

              fontFamily:
                FONT,

              color:
                '#fff',

              fontSize:
                32,

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
                    20,

                  padding:
                    '18px 20px',

                  borderRadius:
                    16,

                  background:
                    index % 2 === 0
                      ? 'rgba(255,102,118,.09)'
                      : 'rgba(255,255,255,.055)',

                  border:
                    '1px solid rgba(255,255,255,.08)',

                  color:
                    'rgba(255,255,255,.78)',

                  fontFamily:
                    FONT,

                  fontSize:
                    27,
                }}
              >
                • {text}
              </div>
            )
          )}

        </GlassPanel>


        {/* ARROW */}

        <div
          style={{
            fontFamily:
              FONT,

            color:
              COLORS.cyan,

            fontSize:
              64,

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


        {/* STRUCTURED */}

        <GlassPanel
          style={{
            padding:
              32,

            minHeight:
              650,

            opacity:
              rightReveal,

            transform:
              `translateX(${(1 - rightReveal) * 70}px)`,
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
                30,

              display:
                'grid',

              gridTemplateColumns:
                '1fr 1fr',

              gap:
                16,
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
              (
                item
              ) => (

                <div
                  key={
                    item[0]
                  }
                  style={{
                    padding:
                      '20px 22px',

                    borderRadius:
                      17,

                    background:
                      `${item[2]}16`,

                    border:
                      `1px solid ${item[2]}55`,
                  }}
                >
                  <div
                    style={{
                      color:
                        item[2],

                      fontFamily:
                        FONT,

                      fontSize:
                        17,

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
                        8,

                      color:
                        '#fff',

                      fontFamily:
                        FONT,

                      fontSize:
                        27,

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
                30,

              padding:
                '22px 24px',

              borderRadius:
                18,

              background:
                'rgba(25,214,163,.08)',

              border:
                '1px solid rgba(25,214,163,.28)',
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
// ======================================================
// 4. GEMINI GEM SETUP
// ======================================================
// ======================================================

const GeminiGemSetup = ({
  shot,
}) => {

  const frame =
    useCurrentFrame();

  const {
    fps,
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


  const step =
    Math.min(
      2,
      Math.floor(
        frame / 250
      )
    );


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
        opacity={0.035}
      />


      <div
        style={{
          position:
            'absolute',

          left:
            78,

          top:
            62,
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
            78,

          right:
            78,

          top:
            130,

          bottom:
            70,

          overflow:
            'hidden',

          transform:
            `scale(${0.97 + windowReveal * 0.03})`,

          opacity:
            windowReveal,
        }}
      >

        {/* BROWSER BAR */}

        <div
          style={{
            height:
              74,

            display:
              'flex',

            alignItems:
              'center',

            padding:
              '0 26px',

            borderBottom:
              '1px solid rgba(255,255,255,.10)',

            background:
              'rgba(255,255,255,.035)',
          }}
        >
          <div
            style={{
              display:
                'flex',

              gap:
                10,
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
                      13,

                    height:
                      13,

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
                26,

              color:
                'rgba(255,255,255,.45)',

              fontFamily:
                FONT,

              fontSize:
                19,
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
              '330px 1fr',

            height:
              'calc(100% - 74px)',
          }}
        >

          {/* SIDEBAR */}

          <div
            style={{
              padding:
                28,

              borderRight:
                '1px solid rgba(255,255,255,.08)',

              background:
                'rgba(0,0,0,.18)',
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
                      24,

                    padding:
                      '18px 18px',

                    borderRadius:
                      14,

                    background:
                      index === step
                        ? 'rgba(109,124,255,.16)'
                        : 'rgba(255,255,255,.035)',

                    border:
                      index === step
                        ? '1px solid rgba(109,124,255,.45)'
                        : '1px solid rgba(255,255,255,.07)',

                    color:
                      index === step
                        ? '#fff'
                        : 'rgba(255,255,255,.55)',

                    fontFamily:
                      FONT,

                    fontSize:
                      25,

                    fontWeight:
                      760,
                  }}
                >
                  {index + 1}. {label}
                </div>
              )
            )}
          </div>


          {/* CONTENT */}

          <div
            style={{
              padding:
                '34px 42px',
            }}
          >

            <div
              style={{
                color:
                  '#fff',

                fontFamily:
                  FONT,

                fontSize:
                  42,

                fontWeight:
                  850,
              }}
            >
              Organizador de reuniones
            </div>


            <div
              style={{
                marginTop:
                  28,

                color:
                  COLORS.textSoft,

                fontFamily:
                  FONT,

                fontSize:
                  22,

                fontWeight:
                  700,
              }}
            >
              Instrucciones
            </div>


            <div
              style={{
                marginTop:
                  12,

                padding:
                  '24px 26px',

                minHeight:
                  250,

                borderRadius:
                  17,

                background:
                  'rgba(255,255,255,.045)',

                border:
                  '1px solid rgba(255,255,255,.11)',

                color:
                  'rgba(255,255,255,.80)',

                fontFamily:
                  FONT,

                fontSize:
                  25,

                lineHeight:
                  1.55,
              }}
            >
              Extrae decisiones, convierte compromisos
              en tareas y señala cualquier dato que falte.

              <br />
              <br />

              No inventes responsables ni fechas.
              Si falta información, indícala como
              pendiente.
            </div>


            <div
              style={{
                marginTop:
                  28,

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
                    'rgba(255,255,255,.48)',

                  fontFamily:
                    FONT,

                  fontSize:
                    21,
                }}
              >
                Prueba antes de usarla con información real.
              </div>


              <div
                style={{
                  padding:
                    '17px 28px',

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
                    23,

                  fontWeight:
                    850,

                  boxShadow:
                    '0 10px 35px rgba(109,124,255,.23)',
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
// ======================================================
// 5. CLAUDE / INSTRUCTION BUILDER
// ======================================================
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
        opacity={0.12}
      />

      <AmbientGlow
        left="75%"
        top="38%"
        size={1000}
        color="109,124,255"
        opacity={0.14}
      />

      <Grid
        opacity={0.035}
      />


      <div
        style={{
          position:
            'absolute',

          left:
            78,

          top:
            64,
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
            78,

          top:
            138,

          width:
            750,

          opacity:
            reveal,

          transform:
            `translateY(${(1 - reveal) * 35}px)`,
        }}
      >
        <HeroTitle
          size={62}
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
            78,

          right:
            78,

          top:
            330,

          bottom:
            70,

          padding:
            '32px 34px',

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
              22,
          }}
        >

          {[
            {
              label:
                'OBJETIVO',

              title:
                'Qué resultado buscas',

              body:
                'Mantén el mismo criterio que definiste para la Gem.',

              color:
                COLORS.blue,
            },

            {
              label:
                'CONTEXTO',

              title:
                'Añade notas o archivos',

              body:
                'Incluye solo la información necesaria para ejecutar la tarea.',

              color:
                COLORS.amber,
            },

            {
              label:
                'CONTROL',

              title:
                'Revisa permisos',

              body:
                'Comprueba siempre qué estás compartiendo y qué puede usar la herramienta.',

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
                    '28px 28px',

                  borderRadius:
                    22,

                  background:
                    'rgba(255,255,255,.035)',

                  border:
                    `1px solid ${item.color}44`,

                  transform:
                    `translateY(${Math.sin((frame + index * 10) / 18) * 5}px)`,
                }}
              >
                <div
                  style={{
                    color:
                      item.color,

                    fontFamily:
                      FONT,

                    fontSize:
                      18,

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
                      18,

                    color:
                      '#fff',

                    fontFamily:
                      FONT,

                    fontSize:
                      32,

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
                      20,

                    color:
                      COLORS.textSoft,

                    fontFamily:
                      FONT,

                    fontSize:
                      23,

                    lineHeight:
                      1.45,
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
              30,

            padding:
              '20px 24px',

            borderRadius:
              17,

            background:
              'rgba(255,189,89,.07)',

            border:
              '1px solid rgba(255,189,89,.25)',

            color:
              'rgba(255,255,255,.72)',

            fontFamily:
              FONT,

            fontSize:
              23,

            textAlign:
              'center',
          }}
        >
          Las opciones pueden variar según acceso y versión.
          Mantén constantes el objetivo, las reglas y el criterio de evaluación.
        </div>

      </GlassPanel>

    </AbsoluteFill>
  );
};


// ======================================================
// ======================================================
// 6. GEMINI VS CLAUDE
// ======================================================
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
        opacity={0.14}
      />

      <AmbientGlow
        left="75%"
        top="45%"
        size={950}
        color="25,214,163"
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
            0,

          right:
            0,

          top:
            60,

          textAlign:
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
            75,

          right:
            75,

          top:
            135,

          bottom:
            70,

          display:
            'grid',

          gridTemplateColumns:
            '1fr 1fr',

          gap:
            28,
        }}
      >

        <GlassPanel
          style={{
            padding:
              34,

            transform:
              `translateX(${(1 - left) * -70}px)`,

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
                28,

              color:
                '#fff',

              fontFamily:
                FONT,

              fontSize:
                48,

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
                42,
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
                52,

              height:
                180,

              borderRadius:
                20,

              background:
                'linear-gradient(135deg,rgba(109,124,255,.22),rgba(41,211,255,.06))',

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
                30,

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
              34,

            transform:
              `translateX(${(1 - right) * 70}px)`,

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
                28,

              color:
                '#fff',

              fontFamily:
                FONT,

              fontSize:
                48,

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
                42,
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
                52,

              height:
                180,

              borderRadius:
                20,

              background:
                'linear-gradient(135deg,rgba(25,214,163,.20),rgba(255,189,89,.06))',

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
                30,

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
// ======================================================
// 7. BEFORE / AFTER VALIDATION
// ======================================================
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
        opacity={0.035}
      />


      <AmbientGlow
        left="25%"
        top="52%"
        size={900}
        color="255,102,118"
        opacity={0.10}
      />


      <AmbientGlow
        left="76%"
        top="52%"
        size={900}
        color="25,214,163"
        opacity={0.11}
      />


      <div
        style={{
          position:
            'absolute',

          left:
            80,

          top:
            68,
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
            80,

          right:
            80,

          top:
            145,

          bottom:
            75,

          display:
            'grid',

          gridTemplateColumns:
            '1fr 1fr',

          gap:
            28,
        }}
      >

        <GlassPanel
          style={{
            padding:
              34,
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
                28,

              color:
                '#fff',

              fontFamily:
                FONT,

              fontSize:
                43,

              fontWeight:
                880,
            }}
          >
            Instrucción ambigua
          </div>


          <div
            style={{
              marginTop:
                30,

              padding:
                '24px 25px',

              borderRadius:
                18,

              background:
                'rgba(255,102,118,.07)',

              border:
                '1px solid rgba(255,102,118,.26)',

              color:
                'rgba(255,255,255,.86)',

              fontFamily:
                FONT,

              fontSize:
                28,

              lineHeight:
                1.45,
            }}
          >
            “Hazme un resumen de estas notas.”
          </div>


          <div
            style={{
              marginTop:
                38,
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
              34,

            opacity:
              reveal,

            transform:
              `translateX(${(1 - reveal) * 55}px)`,
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
                28,

              color:
                '#fff',

              fontFamily:
                FONT,

              fontSize:
                43,

              fontWeight:
                880,
            }}
          >
            Instrucción concreta
          </div>


          <div
            style={{
              marginTop:
                30,

              padding:
                '24px 25px',

              borderRadius:
                18,

              background:
                'rgba(25,214,163,.07)',

              border:
                '1px solid rgba(25,214,163,.27)',

              color:
                'rgba(255,255,255,.86)',

              fontFamily:
                FONT,

              fontSize:
                27,

              lineHeight:
                1.45,
            }}
          >
            “Extrae decisiones, responsables y tareas.
            Si falta información, indícalo.”
          </div>


          <div
            style={{
              marginTop:
                38,
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
// ======================================================
// 8. CTA — STOCK VISIBLE
// ======================================================
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
        darkness={0.18}
        saturation={1.02}
        contrast={1.06}
        zoomStart={1.02}
        zoomEnd={1.07}
      />


      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg,rgba(3,5,9,.65),rgba(3,5,9,.25),rgba(3,5,9,.65))',
        }}
      />


      <AbsoluteFill
        style={{
          justifyContent:
            'center',

          alignItems:
            'center',

          padding:
            '100px',
        }}
      >

        <GlassPanel
          style={{
            width:
              1160,

            padding:
              '54px 66px',

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
                30,

              color:
                '#fff',

              fontFamily:
                FONT,

              fontSize:
                62,

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
                '40px auto 0',

              width:
                760,

              padding:
                '20px 25px',

              borderRadius:
                16,

              background:
                'rgba(255,255,255,.055)',

              border:
                '1px solid rgba(255,255,255,.12)',

              color:
                'rgba(255,255,255,.52)',

              fontFamily:
                FONT,

              fontSize:
                27,

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
// ======================================================
// GENERIC VISUAL
// ======================================================
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
            darkness={0.16}
            saturation={1.05}
            contrast={1.06}
          />
        )
        : (
          <>
            <BaseBackground />

            <Grid
              opacity={0.04}
            />

            <AmbientGlow
              left="70%"
              top="45%"
              size={1000}
              color="109,124,255"
              opacity={0.17}
            />
          </>
        )}


      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg,rgba(3,5,9,.73) 0%,rgba(3,5,9,.25) 52%,rgba(3,5,9,.08) 100%)',
        }}
      />


      <div
        style={{
          position:
            'absolute',

          left:
            90,

          top:
            90,
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
            90,

          bottom:
            115,

          transform:
            `translateY(${(1 - reveal) * 35}px)`,

          opacity:
            reveal,
        }}
      >
        <HeroTitle
          size={72}
          width={950}
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
      (
        shot
      ) => {

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
