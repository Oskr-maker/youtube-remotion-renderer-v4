import React from 'react';

import {
  AbsoluteFill,
  Composition,
  Sequence,
  Video,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';


// ======================================================
// DEFAULT PROPS
// ======================================================

const DEFAULT_PROPS = {
  totalDurationFrames: 300,
  fps: 30,
  timelineShots: [],
  scenes: [],
  scene: null,
  visual: null
};


// ======================================================
// GLOBAL DESIGN TOKENS
// ======================================================

const COLORS = {
  bg0: '#05070d',
  bg1: '#08111f',
  panel: 'rgba(14,20,34,0.94)',
  panelSoft: 'rgba(18,27,46,0.88)',
  border: 'rgba(255,255,255,0.12)',
  text: '#ffffff',
  muted: 'rgba(255,255,255,0.62)',
  blue: '#6d7cff',
  cyan: '#29d3ff',
  green: '#16ddb2',
  red: '#ff6874',
  amber: '#ffbd59'
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


const getHeadline = (shot) =>
  shot?.title ||
  shot?.text?.headline ||
  shot?.textElements?.[0] ||
  shot?.captionPlan
    ?.highlightKeywords?.[0] ||
  '';


const getTextElements = (shot) =>
  safeArray(
    shot?.textElements ||
    shot?.visual?.textElements
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


const getStock = (shot) =>
  shot?.stock ||
  shot?.visual?.stock ||
  shot?.scene?.stock ||
  null;


const getUIComponents = (shot) =>
  safeArray(
    shot?.ui?.components ||
    shot?.visual?.ui?.components ||
    shot?.scene?.ui?.components
  );


const getOverlays = (shot) =>
  safeArray(
    shot?.graphics?.overlays ||
    shot?.visual?.graphics?.overlays ||
    shot?.scene?.graphics?.overlays
  );


const getMotionActions = (shot) =>
  safeArray(
    shot?.motion?.actions ||
    shot?.visual?.motion?.actions ||
    shot?.scene?.motion?.actions
  );


const getStockUrl = (shot) => {

  const stock =
    getStock(shot);

  if (
    stock?.available === true &&
    stock?.url
  ) {
    return stock.url;
  }

  return (
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


// ======================================================
// BACKGROUND COMPONENTS
// ======================================================

const BaseBackground = () => (
  <AbsoluteFill
    style={{
      background:
        'linear-gradient(135deg,#05070d 0%,#0a1322 48%,#05070d 100%)'
    }}
  />
);


const Grid = ({
  opacity = 0.08
}) => (
  <AbsoluteFill
    style={{
      opacity,
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
      backgroundSize:
        '64px 64px'
    }}
  />
);


const AmbientGlow = ({
  left = '50%',
  top = '50%',
  size = 900,
  color = '109,124,255',
  opacity = 0.18
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
      borderRadius: '50%',
      background:
        `radial-gradient(circle, rgba(${color},${opacity}) 0%, rgba(${color},0) 70%)`,
      pointerEvents: 'none'
    }}
  />
);


// ======================================================
// BASIC UI COMPONENTS
// ======================================================

const GlassCard = ({
  children,
  style = {}
}) => (
  <div
    style={{
      background:
        'linear-gradient(145deg,rgba(18,27,46,0.96),rgba(7,11,20,0.96))',
      border:
        `1px solid ${COLORS.border}`,
      boxShadow:
        '0 30px 90px rgba(0,0,0,0.42)',
      borderRadius:
        26,
      ...style
    }}
  >
    {children}
  </div>
);


const BrowserDots = () => (
  <div
    style={{
      display: 'flex',
      gap: 10
    }}
  >
    {[
      '#ff6d73',
      '#ffbd59',
      '#25d39c'
    ].map(
      (color) => (
        <div
          key={color}
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: color
          }}
        />
      )
    )}
  </div>
);


const Badge = ({
  children,
  color = COLORS.blue
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '10px 18px',
      borderRadius: 999,
      background:
        `${color}22`,
      border:
        `1px solid ${color}66`,
      color: '#fff',
      fontFamily: FONT,
      fontSize: 24,
      fontWeight: 700
    }}
  >
    {children}
  </div>
);


const CheckRow = ({
  text,
  active = true
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      marginTop: 20
    }}
  >
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        background:
          active
            ? 'rgba(22,221,178,0.22)'
            : 'rgba(255,104,116,0.20)',
        border:
          active
            ? '1px solid rgba(22,221,178,0.60)'
            : '1px solid rgba(255,104,116,0.60)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        color:
          active
            ? COLORS.green
            : COLORS.red
      }}
    >
      {active ? '✓' : '!'}
    </div>

    <div
      style={{
        fontFamily: FONT,
        fontSize: 30,
        color: '#fff',
        fontWeight: 650
      }}
    >
      {text}
    </div>
  </div>
);


// ======================================================
// STOCK BACKGROUND
// ======================================================

const StockBackground = ({
  shot,
  darken = 0.42,
  blur = 0
}) => {

  const frame =
    useCurrentFrame();

  const duration =
    getDurationFrames(shot);

  const src =
    getStockUrl(shot);

  const zoom =
    interpolate(
      frame,
      [0, duration],
      [1.02, 1.08],
      {
        extrapolateRight: 'clamp'
      }
    );

  if (!src) {
    return null;
  }

  return (
    <>
      <AbsoluteFill
        style={{
          overflow: 'hidden'
        }}
      >
        <Video
          src={src}
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform:
              `scale(${zoom})`,
            filter:
              blur > 0
                ? `blur(${blur}px)`
                : undefined
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            `linear-gradient(90deg,rgba(4,7,13,${darken + 0.18}) 0%,rgba(4,7,13,${darken}) 48%,rgba(4,7,13,${darken + 0.08}) 100%)`
        }}
      />
    </>
  );
};


// ======================================================
// 1. HOOK TRANSFORMATION
// ======================================================

const HookTransformation = ({
  shot
}) => {

  const frame =
    useCurrentFrame();

  const {fps} =
    useVideoConfig();

  const progress =
    spring({
      frame,
      fps,
      config: {
        damping: 14,
        stiffness: 115
      }
    });

  const text =
    getTextElements(shot);

  const leftX =
    interpolate(
      progress,
      [0, 1],
      [-90, 0]
    );

  const rightX =
    interpolate(
      progress,
      [0, 1],
      [90, 0]
    );

  return (
    <AbsoluteFill>
      <BaseBackground />

      <Grid
        opacity={0.11}
      />

      <AmbientGlow
        left="24%"
        top="30%"
        color="255,104,116"
        opacity={0.13}
      />

      <AmbientGlow
        left="78%"
        top="70%"
        color="22,221,178"
        opacity={0.14}
      />

      <AbsoluteFill
        style={{
          padding:
            '86px 100px'
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 34,
            color:
              COLORS.muted,
            fontWeight: 700
          }}
        >
          DE CAOS A SISTEMA
        </div>

        <div
          style={{
            marginTop: 26,
            fontFamily: FONT,
            fontSize: 72,
            lineHeight: 1.03,
            color: '#fff',
            fontWeight: 850,
            maxWidth: 1450,
            letterSpacing: '-1px'
          }}
        >
          {text[0] ||
            getHeadline(shot)}
        </div>

        <div
          style={{
            marginTop: 68,
            display: 'grid',
            gridTemplateColumns:
              '1fr 140px 1fr',
            gap: 28,
            alignItems: 'center'
          }}
        >
          <GlassCard
            style={{
              height: 510,
              padding: 34,
              transform:
                `translateX(${leftX}px)`
            }}
          >
            <Badge
              color={COLORS.red}
            >
              ANTES
            </Badge>

            <div
              style={{
                marginTop: 34,
                display: 'grid',
                gap: 16
              }}
            >
              {[
                'Notas dispersas',
                'Instrucciones repetidas',
                'Tareas manuales',
                'Decisiones sin estructura'
              ].map(
                (
                  label,
                  index
                ) => (
                  <div
                    key={label}
                    style={{
                      padding:
                        '18px 22px',
                      borderRadius: 16,
                      background:
                        index % 2 === 0
                          ? 'rgba(255,104,116,0.11)'
                          : 'rgba(255,255,255,0.055)',
                      border:
                        '1px solid rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontFamily: FONT,
                      fontSize: 30,
                      transform:
                        `rotate(${index % 2 === 0 ? -1.4 : 1.2}deg)`
                    }}
                  >
                    {label}
                  </div>
                )
              )}
            </div>
          </GlassCard>

          <div
            style={{
              textAlign: 'center',
              fontSize: 84,
              color:
                COLORS.cyan,
              transform:
                `scale(${0.88 + progress * 0.12})`
            }}
          >
            →
          </div>

          <GlassCard
            style={{
              height: 510,
              padding: 34,
              transform:
                `translateX(${rightX}px)`
            }}
          >
            <Badge
              color={COLORS.green}
            >
              DESPUÉS
            </Badge>

            <div
              style={{
                marginTop: 34
              }}
            >
              <CheckRow
                text="Entrada clara"
              />

              <CheckRow
                text="Resultado definido"
              />

              <CheckRow
                text="Límites explícitos"
              />

              <CheckRow
                text="Asistente reutilizable"
              />
            </div>
          </GlassCard>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


// ======================================================
// 2. STOCK + UI INTRO
// ======================================================

const StockPlusUI = ({
  shot
}) => {

  const frame =
    useCurrentFrame();

  const {fps} =
    useVideoConfig();

  const enter =
    spring({
      frame,
      fps,
      config: {
        damping: 16,
        stiffness: 100
      }
    });

  const text =
    getTextElements(shot);

  return (
    <AbsoluteFill>
      <BaseBackground />

      <StockBackground
        shot={shot}
        darken={0.46}
      />

      <AbsoluteFill
        style={{
          padding:
            '95px 110px',
          justifyContent:
            'center'
        }}
      >
        <div
          style={{
            maxWidth: 760
          }}
        >
          <Badge>
            WORKFLOW
          </Badge>

          <div
            style={{
              marginTop: 28,
              fontFamily: FONT,
              fontSize: 76,
              lineHeight: 1.02,
              fontWeight: 850,
              color: '#fff',
              textShadow:
                '0 12px 34px rgba(0,0,0,.6)'
            }}
          >
            {getHeadline(shot)}
          </div>

          <div
            style={{
              marginTop: 42,
              display: 'grid',
              gap: 16
            }}
          >
            {[
              text[0] ||
                'Elige la herramienta',
              text[1] ||
                'Dale instrucciones claras'
            ].map(
              (
                label,
                index
              ) => (
                <GlassCard
                  key={index}
                  style={{
                    padding:
                      '22px 26px',
                    transform:
                      `translateX(${(1 - enter) * (70 + index * 30)}px)`,
                    opacity: enter
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 18
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background:
                          index === 0
                            ? COLORS.blue
                            : COLORS.green,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontFamily: FONT,
                        fontWeight: 800
                      }}
                    >
                      {index + 1}
                    </div>

                    <div
                      style={{
                        fontFamily: FONT,
                        fontSize: 34,
                        fontWeight: 750,
                        color: '#fff'
                      }}
                    >
                      {label}
                    </div>
                  </div>
                </GlassCard>
              )
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


// ======================================================
// 3. NOTES TO STRUCTURE
// ======================================================

const NotesToStructure = ({
  shot
}) => {

  const frame =
    useCurrentFrame();

  const {fps} =
    useVideoConfig();

  const reveal =
    spring({
      frame:
        frame - 8,
      fps,
      config: {
        damping: 15,
        stiffness: 105
      }
    });

  return (
    <AbsoluteFill>
      <BaseBackground />

      <StockBackground
        shot={shot}
        darken={0.62}
        blur={1}
      />

      <Grid
        opacity={0.05}
      />

      <AbsoluteFill
        style={{
          padding:
            '78px 92px'
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            color: '#fff',
            fontWeight: 850,
            fontSize: 62
          }}
        >
          {getHeadline(shot)}
        </div>

        <div
          style={{
            marginTop: 52,
            display: 'grid',
            gridTemplateColumns:
              '0.95fr 1.05fr',
            gap: 34,
            height: 760
          }}
        >
          <GlassCard
            style={{
              padding: 32,
              overflow: 'hidden'
            }}
          >
            <BrowserDots />

            <div
              style={{
                marginTop: 30,
                fontFamily: FONT,
                fontSize: 26,
                color:
                  COLORS.muted,
                fontWeight: 700
              }}
            >
              NOTAS DE REUNIÓN
            </div>

            {[
              'Actualizar propuesta del cliente',
              'Ana revisará presupuesto',
              'Falta confirmar fecha',
              'Preparar resumen ejecutivo',
              'Enviar siguiente acción'
            ].map(
              (
                label,
                index
              ) => (
                <div
                  key={label}
                  style={{
                    marginTop: 24,
                    padding:
                      '18px 20px',
                    borderRadius: 14,
                    background:
                      'rgba(255,255,255,0.055)',
                    color: '#fff',
                    fontFamily: FONT,
                    fontSize: 28,
                    opacity:
                      0.72 +
                      index * 0.05
                  }}
                >
                  {label}
                </div>
              )
            )}
          </GlassCard>

          <div
            style={{
              display: 'grid',
              gridTemplateRows:
                'repeat(3,1fr)',
              gap: 22,
              opacity: reveal,
              transform:
                `translateX(${(1 - reveal) * 60}px)`
            }}
          >
            {[
              {
                title: 'ENTRADA',
                text:
                  'Notas, nombres y contexto'
              },
              {
                title: 'RESULTADO',
                text:
                  'Resumen, decisiones y tareas'
              },
              {
                title: 'LÍMITES',
                text:
                  'No inventar datos ausentes'
              }
            ].map(
              (
                item,
                index
              ) => (
                <GlassCard
                  key={item.title}
                  style={{
                    padding: 30,
                    borderLeft:
                      `5px solid ${
                        [
                          COLORS.blue,
                          COLORS.green,
                          COLORS.amber
                        ][index]
                      }`
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT,
                      color:
                        COLORS.muted,
                      fontWeight: 800,
                      fontSize: 23
                    }}
                  >
                    {item.title}
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      fontFamily: FONT,
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 36
                    }}
                  >
                    {item.text}
                  </div>
                </GlassCard>
              )
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


// ======================================================
// 4. GEMINI GEM SETUP
// ======================================================

const GeminiGemSetup = ({
  shot
}) => {

  const frame =
    useCurrentFrame();

  const duration =
    getDurationFrames(shot);

  const step =
    clamp(
      Math.floor(
        (
          frame /
          duration
        ) *
        3
      ),
      0,
      2
    );

  return (
    <AbsoluteFill>
      <BaseBackground />

      <Grid
        opacity={0.07}
      />

      <AmbientGlow
        left="70%"
        top="38%"
        color="109,124,255"
        opacity={0.16}
      />

      <AbsoluteFill
        style={{
          padding:
            '70px 90px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'space-between'
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 58,
              color: '#fff',
              fontWeight: 850
            }}
          >
            Construye una Gem útil
          </div>

          <Badge>
            GEMINI
          </Badge>
        </div>

        <GlassCard
          style={{
            marginTop: 38,
            height: 800,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: 70,
              borderBottom:
                `1px solid ${COLORS.border}`,
              padding:
                '0 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between'
            }}
          >
            <BrowserDots />

            <div
              style={{
                fontFamily: FONT,
                color:
                  COLORS.muted,
                fontSize: 22
              }}
            >
              Gemini · Gems
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                '320px 1fr',
              height: 730
            }}
          >
            <div
              style={{
                borderRight:
                  `1px solid ${COLORS.border}`,
                padding: 28
              }}
            >
              {[
                'Nueva Gem',
                'Mis Gems',
                'Actividad'
              ].map(
                (
                  label,
                  index
                ) => (
                  <div
                    key={label}
                    style={{
                      marginTop:
                        index === 0
                          ? 0
                          : 14,
                      padding:
                        '17px 18px',
                      borderRadius: 14,
                      background:
                        index === 0
                          ? 'rgba(109,124,255,0.20)'
                          : 'transparent',
                      color: '#fff',
                      fontFamily: FONT,
                      fontSize: 25,
                      fontWeight:
                        index === 0
                          ? 800
                          : 600
                    }}
                  >
                    {label}
                  </div>
                )
              )}
            </div>

            <div
              style={{
                padding:
                  '34px 42px'
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  color:
                    COLORS.muted,
                  fontSize: 22
                }}
              >
                NOMBRE
              </div>

              <div
                style={{
                  marginTop: 12,
                  padding:
                    '18px 20px',
                  borderRadius: 14,
                  background:
                    'rgba(255,255,255,0.055)',
                  border:
                    step === 0
                      ? `2px solid ${COLORS.blue}`
                      : `1px solid ${COLORS.border}`,
                  color: '#fff',
                  fontFamily: FONT,
                  fontSize: 30
                }}
              >
                Asistente de reuniones
              </div>

              <div
                style={{
                  marginTop: 34,
                  fontFamily: FONT,
                  color:
                    COLORS.muted,
                  fontSize: 22
                }}
              >
                INSTRUCCIONES
              </div>

              <div
                style={{
                  marginTop: 12,
                  height: 280,
                  padding:
                    '20px 22px',
                  borderRadius: 14,
                  background:
                    'rgba(255,255,255,0.045)',
                  border:
                    step === 1
                      ? `2px solid ${COLORS.green}`
                      : `1px solid ${COLORS.border}`,
                  color: '#fff',
                  fontFamily: FONT,
                  fontSize: 27,
                  lineHeight: 1.45
                }}
              >
                Recibe notas de una reunión.
                Resume las decisiones.
                Extrae responsables y próximas tareas.
                No inventes información que no aparezca.
              </div>

              <div
                style={{
                  marginTop: 28,
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    color:
                      COLORS.muted,
                    fontFamily: FONT,
                    fontSize: 23
                  }}
                >
                  Prueba la Gem antes de usarla
                </div>

                <div
                  style={{
                    padding:
                      '16px 30px',
                    borderRadius: 14,
                    background:
                      step === 2
                        ? COLORS.green
                        : COLORS.blue,
                    color: '#fff',
                    fontFamily: FONT,
                    fontSize: 26,
                    fontWeight: 850,
                    boxShadow:
                      '0 10px 34px rgba(109,124,255,.24)'
                  }}
                >
                  Guardar y probar
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


// ======================================================
// 5. GEMINI VS CLAUDE
// ======================================================

const DualToolComparison = ({
  shot
}) => {

  const frame =
    useCurrentFrame();

  const {fps} =
    useVideoConfig();

  const left =
    spring({
      frame,
      fps,
      config: {
        damping: 15,
        stiffness: 100
      }
    });

  const right =
    spring({
      frame:
        frame - 6,
      fps,
      config: {
        damping: 15,
        stiffness: 100
      }
    });

  return (
    <AbsoluteFill>
      <BaseBackground />

      <Grid
        opacity={0.06}
      />

      <AbsoluteFill
        style={{
          padding:
            '70px 80px'
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            color: '#fff',
            fontSize: 58,
            fontWeight: 850,
            textAlign: 'center'
          }}
        >
          Gemini Gems vs Claude Cowork
        </div>

        <div
          style={{
            marginTop: 44,
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap: 30
          }}
        >
          <GlassCard
            style={{
              height: 790,
              padding: 32,
              transform:
                `translateX(${(1 - left) * -80}px)`,
              opacity: left
            }}
          >
            <Badge
              color={COLORS.blue}
            >
              GEMINI GEMS
            </Badge>

            <div
              style={{
                marginTop: 34,
                fontFamily: FONT,
                color: '#fff',
                fontSize: 42,
                fontWeight: 850
              }}
            >
              Instrucciones reutilizables
            </div>

            <div
              style={{
                marginTop: 36
              }}
            >
              <CheckRow
                text="Configura una vez"
              />

              <CheckRow
                text="Repite el mismo criterio"
              />

              <CheckRow
                text="Ideal para asistentes"
              />

              <CheckRow
                text="Entrada → respuesta"
              />
            </div>

            <div
              style={{
                marginTop: 55,
                height: 190,
                borderRadius: 18,
                background:
                  'linear-gradient(135deg,rgba(109,124,255,.25),rgba(41,211,255,.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  color: '#fff',
                  fontFamily: FONT,
                  fontSize: 30,
                  fontWeight: 800
                }}
              >
                GEM → RESPUESTA
              </div>
            </div>
          </GlassCard>

          <GlassCard
            style={{
              height: 790,
              padding: 32,
              transform:
                `translateX(${(1 - right) * 80}px)`,
              opacity: right
            }}
          >
            <Badge
              color={COLORS.green}
            >
              CLAUDE COWORK
            </Badge>

            <div
              style={{
                marginTop: 34,
                fontFamily: FONT,
                color: '#fff',
                fontSize: 42,
                fontWeight: 850
              }}
            >
              Flujo con archivos
            </div>

            <div
              style={{
                marginTop: 36
              }}
            >
              <CheckRow
                text="Trabaja con documentos"
              />

              <CheckRow
                text="Secuencia varias acciones"
              />

              <CheckRow
                text="Ideal para procesos"
              />

              <CheckRow
                text="Archivo → acción → entrega"
              />
            </div>

            <div
              style={{
                marginTop: 55,
                height: 190,
                borderRadius: 18,
                background:
                  'linear-gradient(135deg,rgba(22,221,178,.22),rgba(255,189,89,.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  color: '#fff',
                  fontFamily: FONT,
                  fontSize: 30,
                  fontWeight: 800
                }}
              >
                ARCHIVOS → FLUJO
              </div>
            </div>
          </GlassCard>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


// ======================================================
// 6. VALIDATION / BEFORE AFTER
// ======================================================

const BeforeAfterValidation = ({
  shot
}) => {

  const frame =
    useCurrentFrame();

  const {fps} =
    useVideoConfig();

  const reveal =
    spring({
      frame:
        frame - 10,
      fps,
      config: {
        damping: 15,
        stiffness: 105
      }
    });

  return (
    <AbsoluteFill>
      <BaseBackground />

      <Grid
        opacity={0.07}
      />

      <AbsoluteFill
        style={{
          padding:
            '78px 88px'
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            color: '#fff',
            fontSize: 58,
            fontWeight: 850
          }}
        >
          Prueba, revisa y mejora
        </div>

        <div
          style={{
            marginTop: 50,
            display: 'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap: 28
          }}
        >
          <GlassCard
            style={{
              height: 730,
              padding: 32
            }}
          >
            <Badge
              color={COLORS.red}
            >
              PRUEBA 1
            </Badge>

            <div
              style={{
                marginTop: 28,
                color: '#fff',
                fontFamily: FONT,
                fontSize: 38,
                fontWeight: 800
              }}
            >
              Instrucción incompleta
            </div>

            <div
              style={{
                marginTop: 28,
                padding:
                  '22px 24px',
                borderRadius: 18,
                background:
                  'rgba(255,104,116,0.08)',
                border:
                  '1px solid rgba(255,104,116,0.32)',
                color: '#fff',
                fontFamily: FONT,
                fontSize: 28,
                lineHeight: 1.4
              }}
            >
              “Hazme un resumen de estas notas.”
            </div>

            <div
              style={{
                marginTop: 38
              }}
            >
              <CheckRow
                text="Formato poco claro"
                active={false}
              />

              <CheckRow
                text="Datos ausentes"
                active={false}
              />

              <CheckRow
                text="Resultado inconsistente"
                active={false}
              />
            </div>
          </GlassCard>

          <GlassCard
            style={{
              height: 730,
              padding: 32,
              opacity: reveal,
              transform:
                `translateX(${(1 - reveal) * 55}px)`
            }}
          >
            <Badge
              color={COLORS.green}
            >
              PRUEBA 2
            </Badge>

            <div
              style={{
                marginTop: 28,
                color: '#fff',
                fontFamily: FONT,
                fontSize: 38,
                fontWeight: 800
              }}
            >
              Instrucción precisa
            </div>

            <div
              style={{
                marginTop: 28,
                padding:
                  '22px 24px',
                borderRadius: 18,
                background:
                  'rgba(22,221,178,0.07)',
                border:
                  '1px solid rgba(22,221,178,0.32)',
                color: '#fff',
                fontFamily: FONT,
                fontSize: 27,
                lineHeight: 1.4
              }}
            >
              “Resume decisiones, responsables y tareas.
              Si falta información, indícalo.”
            </div>

            <div
              style={{
                marginTop: 38
              }}
            >
              <CheckRow
                text="Formato definido"
              />

              <CheckRow
                text="Sin inventar datos"
              />

              <CheckRow
                text="Resultado reutilizable"
              />
            </div>
          </GlassCard>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


// ======================================================
// 7. CTA
// ======================================================

const CTAEndcard = ({
  shot
}) => {

  const frame =
    useCurrentFrame();

  const {fps} =
    useVideoConfig();

  const pop =
    spring({
      frame,
      fps,
      config: {
        damping: 14,
        stiffness: 100
      }
    });

  return (
    <AbsoluteFill>
      <BaseBackground />

      <StockBackground
        shot={shot}
        darken={0.70}
        blur={2}
      />

      <Grid
        opacity={0.05}
      />

      <AmbientGlow
        left="50%"
        top="48%"
        size={1150}
        color="109,124,255"
        opacity={0.18}
      />

      <AbsoluteFill
        style={{
          justifyContent:
            'center',
          alignItems:
            'center',
          padding:
            '110px'
        }}
      >
        <GlassCard
          style={{
            width: 1180,
            padding:
              '54px 70px',
            textAlign: 'center',
            transform:
              `scale(${0.95 + pop * 0.05})`
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              color: '#fff',
              fontSize: 66,
              lineHeight: 1.05,
              fontWeight: 850
            }}
          >
            ¿Qué tarea convertirías primero en una Gem?
          </div>

          <div
            style={{
              margin:
                '44px auto 0',
              width: 760,
              padding:
                '20px 28px',
              borderRadius: 18,
              background:
                'rgba(255,255,255,0.07)',
              border:
                `1px solid ${COLORS.border}`,
              color:
                COLORS.muted,
              fontFamily: FONT,
              fontSize: 30,
              textAlign: 'left'
            }}
          >
            Escribe tu respuesta en comentarios...
            <span
              style={{
                opacity:
                  frame % 20 < 10
                    ? 1
                    : 0
              }}
            >
              |
            </span>
          </div>
        </GlassCard>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


// ======================================================
// GENERIC FALLBACK
// ======================================================

const GenericVisual = ({
  shot
}) => (
  <AbsoluteFill>
    <BaseBackground />

    <StockBackground
      shot={shot}
      darken={0.58}
    />

    <Grid
      opacity={0.07}
    />

    <AbsoluteFill
      style={{
        justifyContent:
          'center',
        alignItems:
          'center',
        padding:
          '110px'
      }}
    >
      <GlassCard
        style={{
          maxWidth:
            1250,
          padding:
            '48px 60px'
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            color: '#fff',
            fontSize: 66,
            fontWeight: 850,
            lineHeight: 1.07,
            textAlign:
              'center'
          }}
        >
          {getHeadline(shot)}
        </div>
      </GlassCard>
    </AbsoluteFill>
  </AbsoluteFill>
);


// ======================================================
// SHOT RENDERER
// ======================================================

const ShotRenderer = ({
  shot
}) => {

  const template =
    getTemplate(shot);

  const layout =
    getLayout(shot);

  switch (template) {

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


  switch (layout) {

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
//
// Compatible con:
// - timelineShots
// - scene
// - scenes
// - visual
// ======================================================

const normalizeShots = ({
  timelineShots = [],
  scenes = [],
  scene = null,
  visual = null
}) => {

  if (
    Array.isArray(timelineShots) &&
    timelineShots.length > 0
  ) {

    return timelineShots.map(
      (shot) => {

        const matchingScene =
          safeArray(scenes).find(
            (item) =>
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
            null
        };
      }
    );
  }


  if (scene) {

    return [
      {
        ...scene,
        visual:
          visual || null,
        startFrame: 0,
        durationFrames:
          scene?.durationFrames ||
          300
      }
    ];
  }


  if (
    Array.isArray(scenes) &&
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
          `${item?.sceneId || index}_SHOT`
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
  visual = null
}) => {

  const shots =
    normalizeShots({
      timelineShots,
      scenes,
      scene,
      visual
    });

  return (
    <AbsoluteFill>
      <BaseBackground />

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
      DEFAULT_PROPS.fps
    }

    width={1920}

    height={1080}

    defaultProps={
      DEFAULT_PROPS
    }

    calculateMetadata={
      async ({
        props
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
          1080
      })
    }
  />
);
