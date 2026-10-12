import React from 'react';

import {
  AbsoluteFill,
  Composition,
  Sequence,
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
  scenes: []
};

// ======================================================
// BACKGROUND
// ======================================================

const Background = () => {
  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(135deg, #0a0f1f 0%, #111827 50%, #080b12 100%)'
      }}
    />
  );
};

// ======================================================
// SOFT GRID
// ======================================================

const SoftGrid = ({
  opacity = 0.12
}) => {
  return (
    <AbsoluteFill
      style={{
        opacity,

        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',

        backgroundSize:
          '70px 70px'
      }}
    />
  );
};

// ======================================================
// HERO / HOOK
// ======================================================

const HeroLayout = ({
  shot
}) => {
  const frame =
    useCurrentFrame();

  const {
    fps
  } =
    useVideoConfig();

  const intro =
    spring({
      frame,
      fps,

      config: {
        damping: 14,
        stiffness: 120,
        mass: 0.8
      }
    });

  const opacity =
    interpolate(
      frame,
      [0, 10],
      [0, 1],
      {
        extrapolateRight:
          'clamp'
      }
    );

  const scale =
    0.94 +
    intro * 0.06;

  const hookKeyword =
    shot.graphicElements?.find(
      element =>
        element.type ===
        'hook_keyword'
    )?.text || '';

  return (
    <AbsoluteFill>
      <SoftGrid
        opacity={0.10}
      />

      <AbsoluteFill
        style={{
          justifyContent:
            'center',

          alignItems:
            'center',

          padding:
            '120px'
        }}
      >
        <div
          style={{
            opacity,

            transform:
              `scale(${scale})`,

            maxWidth:
              1450,

            textAlign:
              'center'
          }}
        >
          <div
            style={{
              fontFamily:
                'Arial, Helvetica, sans-serif',

              fontSize:
                92,

              fontWeight:
                800,

              lineHeight:
                1.06,

              color:
                '#ffffff',

              letterSpacing:
                '-2px',

              textShadow:
                '0 8px 40px rgba(0,0,0,0.4)'
            }}
          >
            {
              shot.text
                ?.headline || ''
            }
          </div>

          {
            hookKeyword
              ? (
                <div
                  style={{
                    marginTop:
                      42,

                    display:
                      'inline-block',

                    padding:
                      '14px 28px',

                    borderRadius:
                      18,

                    background:
                      'rgba(255,255,255,0.10)',

                    border:
                      '1px solid rgba(255,255,255,0.20)',

                    fontFamily:
                      'Arial, Helvetica, sans-serif',

                    fontSize:
                      42,

                    fontWeight:
                      700,

                    color:
                      '#ffffff',

                    textTransform:
                      'uppercase',

                    letterSpacing:
                      '3px'
                  }}
                >
                  {
                    hookKeyword
                  }
                </div>
              )
              : null
          }
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ======================================================
// SCREEN FOCUS
// ======================================================

const ScreenFocusLayout = ({
  shot
}) => {
  const frame =
    useCurrentFrame();

  const duration =
    Math.max(
      1,
      shot.durationFrames ||
      1
    );

  const x =
    interpolate(
      frame,
      [0, duration],
      [
        0,
        shot.motion
          ?.panDistancePx ||
        0
      ],
      {
        extrapolateRight:
          'clamp'
      }
    );

  const scale =
    interpolate(
      frame,
      [0, duration],
      [
        shot.motion
          ?.zoomScaleFrom ||
        1,

        shot.motion
          ?.zoomScaleTo ||
        1
      ],
      {
        extrapolateRight:
          'clamp'
      }
    );

  const keyword =
    shot.text?.keyword ||
    shot.captionPlan
      ?.highlightKeywords?.[0] ||
    'Proceso visual';

  return (
    <AbsoluteFill>
      <SoftGrid
        opacity={0.08}
      />

      <AbsoluteFill
        style={{
          padding:
            '110px 140px',

          justifyContent:
            'center'
        }}
      >
        <div
          style={{
            width:
              '100%',

            height:
              '76%',

            borderRadius:
              28,

            border:
              '2px solid rgba(255,255,255,0.16)',

            background:
              'linear-gradient(145deg, rgba(20,25,40,0.95), rgba(10,15,25,0.95))',

            boxShadow:
              '0 30px 90px rgba(0,0,0,0.45)',

            overflow:
              'hidden',

            transform:
              `translateX(${x}px) scale(${scale})`,

            padding:
              40
          }}
        >
          <div
            style={{
              display:
                'flex',

              gap:
                12,

              marginBottom:
                38
            }}
          >
            {
              [0, 1, 2]
                .map(
                  index => (
                    <div
                      key={index}
                      style={{
                        width:
                          16,

                        height:
                          16,

                        borderRadius:
                          999,

                        background:
                          'rgba(255,255,255,0.24)'
                      }}
                    />
                  )
                )
            }
          </div>

          <div
            style={{
              fontFamily:
                'Arial, Helvetica, sans-serif',

              fontSize:
                54,

              fontWeight:
                700,

              color:
                '#ffffff'
            }}
          >
            {
              keyword
            }
          </div>

          <div
            style={{
              marginTop:
                30,

              height:
                3,

              width:
                '55%',

              background:
                'rgba(255,255,255,0.30)'
            }}
          />

          <div
            style={{
              marginTop:
                24,

              height:
                3,

              width:
                '78%',

              background:
                'rgba(255,255,255,0.18)'
            }}
          />

          <div
            style={{
              marginTop:
                24,

              height:
                3,

              width:
                '67%',

              background:
                'rgba(255,255,255,0.18)'
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ======================================================
// SPLIT GRAPHIC
// ======================================================

const SplitGraphicLayout = ({
  shot
}) => {
  const frame =
    useCurrentFrame();

  const opacity =
    interpolate(
      frame,
      [0, 12],
      [0, 1],
      {
        extrapolateRight:
          'clamp'
      }
    );

  const keyword =
    shot.text?.keyword ||
    shot.captionPlan
      ?.highlightKeywords?.[0] ||
    '';

  return (
    <AbsoluteFill>
      <SoftGrid
        opacity={0.12}
      />

      <AbsoluteFill
        style={{
          padding:
            '110px 130px',

          display:
            'flex',

          flexDirection:
            'row',

          alignItems:
            'center',

          gap:
            80
        }}
      >
        <div
          style={{
            flex:
              1,

            opacity,

            fontFamily:
              'Arial, Helvetica, sans-serif',

            fontSize:
              88,

            lineHeight:
              1,

            fontWeight:
              800,

            color:
              '#ffffff',

            textTransform:
              'uppercase',

            letterSpacing:
              '-1px'
          }}
        >
          {
            keyword
          }
        </div>

        <div
          style={{
            flex:
              1,

            display:
              'grid',

            gridTemplateColumns:
              'repeat(2, 1fr)',

            gap:
              24
          }}
        >
          {
            [0, 1, 2, 3]
              .map(
                index => (
                  <div
                    key={index}
                    style={{
                      height:
                        180,

                      borderRadius:
                        24,

                      background:
                        'rgba(255,255,255,0.07)',

                      border:
                        '1px solid rgba(255,255,255,0.13)',

                      transform:
                        `translateY(${Math.sin(
                          (
                            frame +
                            index * 7
                          ) /
                          15
                        ) * 10}px)`
                    }}
                  />
                )
              )
          }
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ======================================================
// FULL BLEED / B-ROLL
// ======================================================

const FullBleedMediaLayout = ({
  shot
}) => {
  const frame =
    useCurrentFrame();

  const duration =
    Math.max(
      1,
      shot.durationFrames ||
      1
    );

  const scale =
    interpolate(
      frame,
      [0, duration],
      [
        shot.motion
          ?.zoomScaleFrom ||
        1,

        shot.motion
          ?.zoomScaleTo ||
        1.04
      ],
      {
        extrapolateRight:
          'clamp'
      }
    );

  const keyword =
    shot.captionPlan
      ?.highlightKeywords?.[0] ||
    '';

  return (
    <AbsoluteFill
      style={{
        transform:
          `scale(${scale})`
      }}
    >
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(90,110,255,0.30), transparent 40%), radial-gradient(circle at 70% 70%, rgba(0,220,180,0.22), transparent 45%), linear-gradient(135deg,#0b1020,#060912)'
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent:
            'center',

          alignItems:
            'center'
        }}
      >
        <div
          style={{
            fontFamily:
              'Arial, Helvetica, sans-serif',

            fontSize:
              48,

            fontWeight:
              700,

            color:
              'rgba(255,255,255,0.65)'
          }}
        >
          {
            keyword
          }
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ======================================================
// KINETIC TYPOGRAPHY
// ======================================================

const KineticTypographyLayout = ({
  shot
}) => {
  const frame =
    useCurrentFrame();

  const {
    fps
  } =
    useVideoConfig();

  const kinetic =
    shot.graphicElements?.find(
      element =>
        element.type ===
        'kinetic_words'
    );

  const words =
    kinetic?.words ||
    shot.captionPlan
      ?.highlightKeywords ||
    [];

  return (
    <AbsoluteFill>
      <SoftGrid
        opacity={0.10}
      />

      <AbsoluteFill
        style={{
          justifyContent:
            'center',

          alignItems:
            'center',

          flexDirection:
            'row',

          flexWrap:
            'wrap',

          gap:
            28,

          padding:
            150
        }}
      >
        {
          words.map(
            (
              word,
              index
            ) => {
              const start =
                index * 6;

              const animation =
                spring({
                  frame:
                    frame -
                    start,

                  fps,

                  config: {
                    damping:
                      13,

                    stiffness:
                      150
                  }
                });

              const visible =
                frame >=
                start;

              return (
                <div
                  key={
                    `${word}-${index}`
                  }
                  style={{
                    opacity:
                      visible
                        ? 1
                        : 0,

                    transform:
                      `scale(${0.75 + animation * 0.25})`,

                    fontFamily:
                      'Arial, Helvetica, sans-serif',

                    fontSize:
                      84,

                    fontWeight:
                      800,

                    color:
                      '#ffffff',

                    textTransform:
                      'uppercase',

                    padding:
                      '12px 22px',

                    borderRadius:
                      18,

                    background:
                      index %
                      2 ===
                      0
                        ? 'rgba(255,255,255,0.08)'
                        : 'transparent'
                  }}
                >
                  {
                    word
                  }
                </div>
              );
            }
          )
        }
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ======================================================
// GENERIC FALLBACK
// ======================================================

const GenericLayout = ({
  shot
}) => {
  const text =
    shot.text?.headline ||
    shot.text?.keyword ||
    shot.captionPlan
      ?.highlightKeywords?.[0] ||
    '';

  return (
    <AbsoluteFill>
      <SoftGrid
        opacity={0.08}
      />

      <AbsoluteFill
        style={{
          justifyContent:
            'center',

          alignItems:
            'center',

          padding:
            120
        }}
      >
        <div
          style={{
            fontFamily:
              'Arial, Helvetica, sans-serif',

            fontSize:
              72,

            fontWeight:
              700,

            color:
              '#ffffff',

            textAlign:
              'center'
          }}
        >
          {
            text
          }
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ======================================================
// SHOT SWITCHER
// ======================================================

const ShotRenderer = ({
  shot
}) => {
  switch (
    shot.layout
  ) {
    case 'hero_fullscreen':
      return (
        <HeroLayout
          shot={shot}
        />
      );

    case 'screen_focus':
      return (
        <ScreenFocusLayout
          shot={shot}
        />
      );

    case 'split_graphic':
      return (
        <SplitGraphicLayout
          shot={shot}
        />
      );

    case 'full_bleed_media':
      return (
        <FullBleedMediaLayout
          shot={shot}
        />
      );

    case 'kinetic_typography':
      return (
        <KineticTypographyLayout
          shot={shot}
        />
      );

    default:
      return (
        <GenericLayout
          shot={shot}
        />
      );
  }
};

// ======================================================
// MAIN VIDEO
// ======================================================

const YouTubeV4 = ({
  timelineShots = []
}) => {
  return (
    <AbsoluteFill>
      <Background />

      {
        timelineShots
          .map(
            shot => (
              <Sequence
                key={
                  shot.shotId
                }

                from={
                  shot.startFrame
                }

                durationInFrames={
                  shot.durationFrames
                }
              >
                <ShotRenderer
                  shot={shot}
                />
              </Sequence>
            )
          )
      }
    </AbsoluteFill>
  );
};

// ======================================================
// ROOT
// ======================================================

export const RemotionRoot = () => {
  return (
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
          props
        }) => {
          return {
            durationInFrames:
              Number(
                props
                  .totalDurationFrames ||
                300
              ),

            fps:
              Number(
                props.fps ||
                30
              ),

            width:
              1920,

            height:
              1080
          };
        }
      }
    />
  );
};
