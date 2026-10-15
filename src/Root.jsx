import React from 'react';

import {
  AbsoluteFill,
  Composition,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Video,
  Img
} from 'remotion';

const DEFAULT_PROPS = {
  totalDurationFrames: 300,
  fps: 30,
  timelineShots: [],
  scenes: []
};

const getHeadline = (shot) =>
  shot?.text?.headline ||
  shot?.title ||
  shot?.text?.keyword ||
  shot?.captionPlan?.highlightKeywords?.[0] ||
  '';

const getKeyword = (shot) =>
  shot?.text?.keyword ||
  shot?.captionPlan?.highlightKeywords?.[0] ||
  getHeadline(shot);

const getLayout = (shot) =>
  shot?.layout ||
  shot?.visualAsset?.layout ||
  shot?.fallback?.layout ||
  shot?.template ||
  'generic';

const getVisualAssetUrl = (shot) =>
  shot?.asset?.url ||
  shot?.asset?.downloadUrl ||
  shot?.asset?.videoUrl ||
  shot?.visualAsset?.url ||
  shot?.visualAsset?.downloadUrl ||
  shot?.visualAsset?.videoUrl ||
  shot?.stock?.url ||
  shot?.stock?.videoUrl ||
  shot?.mediaUrl ||
  shot?.videoUrl ||
  null;

const getImageUrl = (shot) =>
  shot?.asset?.imageUrl ||
  shot?.visualAsset?.imageUrl ||
  shot?.imageUrl ||
  null;

const Background = () => (
  <AbsoluteFill
    style={{
      background:
        'linear-gradient(135deg,#08101f 0%,#101827 48%,#070a11 100%)'
    }}
  />
);

const SoftGrid = ({opacity = 0.1}) => (
  <AbsoluteFill
    style={{
      opacity,
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)',
      backgroundSize: '70px 70px'
    }}
  />
);

const Glow = ({
  x = '20%',
  y = '20%',
  size = 700,
  opacity = 0.18
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      transform: 'translate(-50%,-50%)',
      borderRadius: '50%',
      background:
        `radial-gradient(circle, rgba(90,110,255,${opacity}) 0%, rgba(90,110,255,0) 70%)`,
      pointerEvents: 'none'
    }}
  />
);

const Card = ({
  children,
  style = {}
}) => (
  <div
    style={{
      background:
        'linear-gradient(145deg, rgba(22,29,46,0.96), rgba(10,15,27,0.96))',
      border:
        '1px solid rgba(255,255,255,0.14)',
      boxShadow:
        '0 28px 80px rgba(0,0,0,0.42)',
      borderRadius:
        26,
      ...style
    }}
  >
    {children}
  </div>
);

const BrowserChrome = () => (
  <div
    style={{
      display: 'flex',
      gap: 12,
      marginBottom: 34
    }}
  >
    {[0, 1, 2].map(
      (index) => (
        <div
          key={index}
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            background:
              'rgba(255,255,255,0.24)'
          }}
        />
      )
    )}
  </div>
);

const FakeLines = () => (
  <div
    style={{
      marginTop: 34
    }}
  >
    {['55%', '78%', '67%', '85%'].map(
      (
        width,
        index
      ) => (
        <div
          key={index}
          style={{
            marginTop:
              index === 0
                ? 0
                : 22,
            height:
              index === 0
                ? 4
                : 3,
            width,
            background:
              index === 0
                ? 'rgba(255,255,255,0.30)'
                : 'rgba(255,255,255,0.15)',
            borderRadius:
              10
          }}
        />
      )
    )}
  </div>
);

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
    shot?.graphicElements?.find(
      (
        element
      ) =>
        element.type ===
        'hook_keyword'
    )?.text ||
    getKeyword(shot);

  return (
    <AbsoluteFill>
      <SoftGrid
        opacity={0.1}
      />

      <Glow
        x="25%"
        y="30%"
        size={850}
        opacity={0.2}
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
            {getHeadline(shot)}
          </div>

          {hookKeyword
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
                    38,
                  fontWeight:
                    700,
                  color:
                    '#ffffff',
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '2px'
                }}
              >
                {hookKeyword}
              </div>
            )
            : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ScreenFocusLayout = ({
  shot
}) => {
  const frame =
    useCurrentFrame();

  const duration =
    Math.max(
      1,
      shot?.durationFrames || 1
    );

  const x =
    interpolate(
      frame,
      [0, duration],
      [
        0,
        shot?.motion
          ?.panDistancePx || 0
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
        shot?.motion
          ?.zoomScaleFrom || 1,
        shot?.motion
          ?.zoomScaleTo || 1.03
      ],
      {
        extrapolateRight:
          'clamp'
      }
    );

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
        <Card
          style={{
            width:
              '100%',
            height:
              '76%',
            overflow:
              'hidden',
            transform:
              `translateX(${x}px) scale(${scale})`,
            padding:
              40
          }}
        >
          <BrowserChrome />

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
            {getKeyword(shot)}
          </div>

          <FakeLines />
        </Card>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

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
          {getKeyword(shot)}
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
          {[0, 1, 2, 3].map(
            (
              index
            ) => (
              <Card
                key={index}
                style={{
                  height:
                    180,
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
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const FullBleedMediaLayout = ({
  shot
}) => {
  const frame =
    useCurrentFrame();

  const duration =
    Math.max(
      1,
      shot?.durationFrames || 1
    );

  const scale =
    interpolate(
      frame,
      [0, duration],
      [
        shot?.motion
          ?.zoomScaleFrom || 1,
        shot?.motion
          ?.zoomScaleTo || 1.05
      ],
      {
        extrapolateRight:
          'clamp'
      }
    );

  const mediaUrl =
    getVisualAssetUrl(shot);

  const imageUrl =
    getImageUrl(shot);

  return (
    <AbsoluteFill
      style={{
        transform:
          `scale(${scale})`
      }}
    >
      {mediaUrl
        ? (
          <Video
            src={mediaUrl}
            muted
            style={{
              width:
                '100%',
              height:
                '100%',
              objectFit:
                'cover'
            }}
          />
        )
        : imageUrl
          ? (
            <Img
              src={imageUrl}
              style={{
                width:
                  '100%',
                height:
                  '100%',
                objectFit:
                  'cover'
              }}
            />
          )
          : (
            <AbsoluteFill
              style={{
                background:
                  'radial-gradient(circle at 30% 20%, rgba(90,110,255,0.30), transparent 40%), radial-gradient(circle at 70% 70%, rgba(0,220,180,0.22), transparent 45%), linear-gradient(135deg,#0b1020,#060912)'
              }}
            />
          )}

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(90deg, rgba(5,8,15,0.78) 0%, rgba(5,8,15,0.25) 50%, rgba(5,8,15,0.55) 100%)'
        }}
      />

      <div
        style={{
          position:
            'absolute',
          left:
            110,
          bottom:
            105,
          maxWidth:
            1000,
          fontFamily:
            'Arial, Helvetica, sans-serif',
          fontSize:
            58,
          fontWeight:
            800,
          color:
            '#ffffff',
          lineHeight:
            1.05,
          textShadow:
            '0 8px 32px rgba(0,0,0,0.6)'
        }}
      >
        {getKeyword(shot)}
      </div>
    </AbsoluteFill>
  );
};

const TimelineTransformLayout = ({
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
        stiffness: 120
      }
    });

  return (
    <AbsoluteFill>
      <SoftGrid
        opacity={0.08}
      />

      <Glow
        x="30%"
        y="65%"
        size={900}
        opacity={0.16}
      />

      <AbsoluteFill
        style={{
          padding:
            '90px 120px'
        }}
      >
        <div
          style={{
            fontFamily:
              'Arial, Helvetica, sans-serif',
            fontSize:
              64,
            fontWeight:
              800,
            color:
              '#fff',
            maxWidth:
              1200
          }}
        >
          {getHeadline(shot)}
        </div>

        <div
          style={{
            marginTop:
              80,
            position:
              'relative',
            height:
              520
          }}
        >
          <Card
            style={{
              position:
                'absolute',
              left:
                0,
              top:
                130,
              width:
                580,
              height:
                300,
              padding:
                30,
              transform:
                `scale(${0.92 + intro * 0.08})`
            }}
          >
            <BrowserChrome />

            <div
              style={{
                height:
                  130,
                borderRadius:
                  16,
                background:
                  'linear-gradient(135deg,rgba(90,110,255,0.28),rgba(0,220,180,0.16))'
              }}
            />

            <div
              style={{
                display:
                  'flex',
                gap:
                  10,
                marginTop:
                  18
              }}
            >
              {[0, 1, 2, 3, 4, 5].map(
                (
                  index
                ) => (
                  <div
                    key={index}
                    style={{
                      flex:
                        1,
                      height:
                        42,
                      borderRadius:
                        8,
                      background:
                        index % 2 === 0
                          ? 'rgba(90,110,255,0.45)'
                          : 'rgba(255,255,255,0.12)'
                    }}
                  />
                )
              )}
            </div>
          </Card>

          <div
            style={{
              position:
                'absolute',
              left:
                650,
              top:
                245,
              fontSize:
                72,
              color:
                'rgba(255,255,255,0.75)',
              transform:
                `translateX(${Math.sin(
                  frame / 8
                ) * 8}px)`
            }}
          >
            →
          </div>

          <div
            style={{
              position:
                'absolute',
              right:
                0,
              top:
                40,
              width:
                760,
              display:
                'grid',
              gridTemplateColumns:
                'repeat(2,1fr)',
              gap:
                22
            }}
          >
            {[
              'CLIP 01',
              'CLIP 02',
              'POST',
              'SHORT'
            ].map(
              (
                label,
                index
              ) => (
                <Card
                  key={label}
                  style={{
                    height:
                      205,
                    padding:
                      24,
                    transform:
                      `translateY(${Math.sin(
                        (
                          frame +
                          index * 10
                        ) /
                        13
                      ) * 8}px)`
                  }}
                >
                  <div
                    style={{
                      height:
                        102,
                      borderRadius:
                        14,
                      background:
                        'linear-gradient(135deg,rgba(255,255,255,0.12),rgba(90,110,255,0.14))'
                    }}
                  />

                  <div
                    style={{
                      marginTop:
                        18,
                      color:
                        '#fff',
                      fontSize:
                        26,
                      fontWeight:
                        700,
                      fontFamily:
                        'Arial'
                    }}
                  >
                    {label}
                  </div>
                </Card>
              )
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const EditorWorkspaceLayout = ({
  shot
}) => {
  const frame =
    useCurrentFrame();

  const mediaUrl =
    getVisualAssetUrl(shot);

  return (
    <AbsoluteFill>
      {mediaUrl
        ? (
          <Video
            src={mediaUrl}
            muted
            style={{
              width:
                '100%',
              height:
                '100%',
              objectFit:
                'cover'
            }}
          />
        )
        : (
          <>
            <SoftGrid
              opacity={0.08}
            />

            <AbsoluteFill
              style={{
                padding:
                  '85px 105px'
              }}
            >
              <Card
                style={{
                  width:
                    '100%',
                  height:
                    '100%',
                  padding:
                    34
                }}
              >
                <BrowserChrome />

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr 360px',
                    gap:
                      24,
                    height:
                      '68%'
                  }}
                >
                  <div
                    style={{
                      borderRadius:
                        18,
                      background:
                        'linear-gradient(135deg,rgba(90,110,255,0.18),rgba(0,0,0,0.45))',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center'
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          46,
                        fontWeight:
                          800,
                        color:
                          '#fff',
                        fontFamily:
                          'Arial'
                      }}
                    >
                      VIDEO PREVIEW
                    </div>
                  </div>

                  <div
                    style={{
                      display:
                        'grid',
                      gridTemplateRows:
                        'repeat(4,1fr)',
                      gap:
                        14
                    }}
                  >
                    {[0, 1, 2, 3].map(
                      (
                        index
                      ) => (
                        <div
                          key={index}
                          style={{
                            borderRadius:
                              14,
                            background:
                              'rgba(255,255,255,0.06)',
                            border:
                              '1px solid rgba(255,255,255,0.10)'
                          }}
                        />
                      )
                    )}
                  </div>
                </div>

                <div
                  style={{
                    marginTop:
                      28,
                    display:
                      'flex',
                    gap:
                      10,
                    height:
                      110,
                    alignItems:
                      'center'
                  }}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
                    (
                      index
                    ) => (
                      <div
                        key={index}
                        style={{
                          flex:
                            1,
                          height:
                            44 +
                            (
                              index % 3
                            ) * 15,
                          borderRadius:
                            7,
                          background:
                            index % 2 === 0
                              ? 'rgba(90,110,255,0.55)'
                              : 'rgba(255,255,255,0.13)',
                          transform:
                            `translateY(${Math.sin(
                              (
                                frame +
                                index * 4
                              ) /
                              10
                            ) * 3}px)`
                        }}
                      />
                    )
                  )}
                </div>
              </Card>
            </AbsoluteFill>
          </>
        )}

      <AbsoluteFill
        style={{
          background:
            mediaUrl
              ? 'linear-gradient(90deg,rgba(6,9,16,0.70),rgba(6,9,16,0.10))'
              : 'transparent'
        }}
      />

      <div
        style={{
          position:
            'absolute',
          left:
            110,
          bottom:
            75,
          maxWidth:
            1000,
          fontSize:
            58,
          fontWeight:
            800,
          color:
            '#fff',
          fontFamily:
            'Arial',
          textShadow:
            '0 8px 30px rgba(0,0,0,.6)'
        }}
      >
        {getHeadline(shot)}
      </div>
    </AbsoluteFill>
  );
};

const OfferCardsLayout = ({
  shot
}) => {
  const frame =
    useCurrentFrame();

  const cards =
    shot?.graphicElements
      ?.filter(
        (
          element
        ) =>
          element.type ===
          'card'
      )
      ?.map(
        (
          element
        ) =>
          element.text
      )
      ?.filter(Boolean) ||
    [];

  const displayCards =
    cards.length > 0
      ? cards.slice(
          0,
          3
        )
      : [
          '5 CLIPS',
          'TÍTULOS',
          'SUBTÍTULOS'
        ];

  return (
    <AbsoluteFill>
      <SoftGrid
        opacity={0.1}
      />

      <Glow
        x="78%"
        y="20%"
        size={700}
        opacity={0.14}
      />

      <AbsoluteFill
        style={{
          padding:
            '100px 120px'
        }}
      >
        <div
          style={{
            fontSize:
              66,
            fontWeight:
              800,
            color:
              '#fff',
            fontFamily:
              'Arial',
            maxWidth:
              1300
          }}
        >
          {getHeadline(shot)}
        </div>

        <div
          style={{
            marginTop:
              90,
            display:
              'grid',
            gridTemplateColumns:
              `repeat(${Math.min(
                displayCards.length,
                3
              )},1fr)`,
            gap:
              30
          }}
        >
          {displayCards.map(
            (
              card,
              index
            ) => (
              <Card
                key={`${card}-${index}`}
                style={{
                  padding:
                    38,
                  height:
                    320,
                  transform:
                    `translateY(${interpolate(
                      frame,
                      [
                        index * 5,
                        index * 5 + 12
                      ],
                      [
                        45,
                        0
                      ],
                      {
                        extrapolateLeft:
                          'clamp',
                        extrapolateRight:
                          'clamp'
                      }
                    )}px)`
                }}
              >
                <div
                  style={{
                    fontSize:
                      26,
                    color:
                      'rgba(255,255,255,0.55)',
                    fontFamily:
                      'Arial'
                  }}
                >
                  ENTREGABLE
                </div>

                <div
                  style={{
                    marginTop:
                      28,
                    fontSize:
                      54,
                    fontWeight:
                      800,
                    color:
                      '#fff',
                    fontFamily:
                      'Arial'
                  }}
                >
                  {card}
                </div>

                <div
                  style={{
                    marginTop:
                      36,
                    height:
                      6,
                    width:
                      '60%',
                    borderRadius:
                      10,
                    background:
                      'rgba(90,110,255,0.65)'
                  }}
                />
              </Card>
            )
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const AIProcessingUILayout = ({
  shot
}) => {
  const frame =
    useCurrentFrame();

  const progress =
    interpolate(
      frame,
      [
        0,
        Math.max(
          1,
          shot?.durationFrames || 1
        )
      ],
      [
        0.08,
        0.92
      ],
      {
        extrapolateRight:
          'clamp'
      }
    );

  return (
    <AbsoluteFill>
      <SoftGrid
        opacity={0.07}
      />

      <AbsoluteFill
        style={{
          padding:
            '85px 105px'
        }}
      >
        <Card
          style={{
            width:
              '100%',
            height:
              '100%',
            padding:
              34
          }}
        >
          <BrowserChrome />

          <div
            style={{
              display:
                'grid',
              gridTemplateColumns:
                '1.2fr .8fr',
              gap:
                30,
              height:
                '76%'
            }}
          >
            <div
              style={{
                padding:
                  28,
                borderRadius:
                  18,
                background:
                  'rgba(255,255,255,0.035)'
              }}
            >
              <div
                style={{
                  color:
                    'rgba(255,255,255,0.55)',
                  fontFamily:
                    'Arial',
                  fontSize:
                    22
                }}
              >
                TRANSCRIPCIÓN
              </div>

              {[
                82,
                68,
                92,
                73,
                88,
                62,
                78
              ].map(
                (
                  width,
                  index
                ) => {
                  const active =
                    index ===
                    Math.floor(
                      (
                        frame /
                        16
                      ) %
                      7
                    );

                  return (
                    <div
                      key={index}
                      style={{
                        marginTop:
                          20,
                        width:
                          `${width}%`,
                        height:
                          18,
                        borderRadius:
                          8,
                        background:
                          active
                            ? 'rgba(90,110,255,0.75)'
                            : 'rgba(255,255,255,0.13)',
                        boxShadow:
                          active
                            ? '0 0 26px rgba(90,110,255,.32)'
                            : 'none'
                      }}
                    />
                  );
                }
              )}
            </div>

            <div
              style={{
                display:
                  'flex',
                flexDirection:
                  'column',
                gap:
                  22
              }}
            >
              <Card
                style={{
                  flex:
                    1,
                  padding:
                    28
                }}
              >
                <div
                  style={{
                    fontFamily:
                      'Arial',
                    color:
                      'rgba(255,255,255,.55)',
                    fontSize:
                      22
                  }}
                >
                  IA
                </div>

                <div
                  style={{
                    marginTop:
                      18,
                    fontFamily:
                      'Arial',
                    color:
                      '#fff',
                    fontSize:
                      44,
                    fontWeight:
                      800
                  }}
                >
                  Analizando momentos
                </div>

                <div
                  style={{
                    marginTop:
                      34,
                    height:
                      10,
                    borderRadius:
                      10,
                    background:
                      'rgba(255,255,255,.08)',
                    overflow:
                      'hidden'
                  }}
                >
                  <div
                    style={{
                      width:
                        `${progress * 100}%`,
                      height:
                        '100%',
                      background:
                        'linear-gradient(90deg,rgba(90,110,255,.95),rgba(0,220,180,.85))'
                    }}
                  />
                </div>
              </Card>

              <Card
                style={{
                  height:
                    165,
                  padding:
                    28
                }}
              >
                <div
                  style={{
                    color:
                      '#fff',
                    fontFamily:
                      'Arial',
                    fontSize:
                      28,
                    fontWeight:
                      700
                  }}
                >
                  3 clips sugeridos
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const BeforeAfterReviewLayout = ({
  shot
}) => {
  const frame =
    useCurrentFrame();

  const reveal =
    interpolate(
      frame,
      [0, 22],
      [0, 1],
      {
        extrapolateRight:
          'clamp'
      }
    );

  return (
    <AbsoluteFill>
      <SoftGrid
        opacity={0.08}
      />

      <AbsoluteFill
        style={{
          padding:
            '95px 115px'
        }}
      >
        <div
          style={{
            fontSize:
              60,
            fontWeight:
              800,
            color:
              '#fff',
            fontFamily:
              'Arial'
          }}
        >
          {getHeadline(shot)}
        </div>

        <div
          style={{
            marginTop:
              70,
            display:
              'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap:
              38
          }}
        >
          <Card
            style={{
              padding:
                34,
              height:
                570
            }}
          >
            <div
              style={{
                fontSize:
                  26,
                color:
                  'rgba(255,255,255,.55)',
                fontFamily:
                  'Arial'
              }}
            >
              ANTES
            </div>

            <div
              style={{
                marginTop:
                  38,
                fontSize:
                  46,
                lineHeight:
                  1.3,
                fontWeight:
                  700,
                color:
                  '#fff',
                fontFamily:
                  'Arial'
              }}
            >
              Texto con errores, saltos y subtítulos poco naturales.
            </div>

            {[0, 1, 2].map(
              (
                index
              ) => (
                <div
                  key={index}
                  style={{
                    marginTop:
                      30,
                    height:
                      4,
                    width:
                      `${75 - index * 9}%`,
                    background:
                      'rgba(255,110,110,.65)'
                  }}
                />
              )
            )}
          </Card>

          <Card
            style={{
              padding:
                34,
              height:
                570,
              opacity:
                reveal,
              transform:
                `translateX(${(1 - reveal) * 45}px)`
            }}
          >
            <div
              style={{
                fontSize:
                  26,
                color:
                  'rgba(255,255,255,.55)',
                fontFamily:
                  'Arial'
              }}
            >
              DESPUÉS
            </div>

            <div
              style={{
                marginTop:
                  38,
                fontSize:
                  46,
                lineHeight:
                  1.3,
                fontWeight:
                  700,
                color:
                  '#fff',
                fontFamily:
                  'Arial'
              }}
            >
              Texto limpio, revisado y preparado para publicar.
            </div>

            {[0, 1, 2].map(
              (
                index
              ) => (
                <div
                  key={index}
                  style={{
                    marginTop:
                      30,
                    height:
                      4,
                    width:
                      `${82 - index * 7}%`,
                    background:
                      'rgba(0,220,180,.70)'
                  }}
                />
              )
            )}
          </Card>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const OutreachWorkspaceLayout = ({
  shot
}) => {
  const frame =
    useCurrentFrame();

  const mediaUrl =
    getVisualAssetUrl(shot);

  return (
    <AbsoluteFill>
      {mediaUrl
        ? (
          <Video
            src={mediaUrl}
            muted
            style={{
              width:
                '100%',
              height:
                '100%',
              objectFit:
                'cover'
            }}
          />
        )
        : (
          <AbsoluteFill>
            <SoftGrid
              opacity={0.08}
            />

            <AbsoluteFill
              style={{
                padding:
                  '100px 120px',
                display:
                  'grid',
                gridTemplateColumns:
                  '1.1fr .9fr',
                gap:
                  38
              }}
            >
              <Card
                style={{
                  padding:
                    34
                }}
              >
                <BrowserChrome />

                <div
                  style={{
                    fontSize:
                      28,
                    color:
                      'rgba(255,255,255,.55)',
                    fontFamily:
                      'Arial'
                  }}
                >
                  MENSAJE PERSONALIZADO
                </div>

                <div
                  style={{
                    marginTop:
                      32,
                    fontSize:
                      42,
                    lineHeight:
                      1.35,
                    color:
                      '#fff',
                    fontFamily:
                      'Arial',
                    fontWeight:
                      700
                  }}
                >
                  “He preparado una muestra de cómo podría quedar uno de tus clips.”
                </div>

                <div
                  style={{
                    marginTop:
                      50,
                    width:
                      180,
                    padding:
                      '16px 22px',
                    borderRadius:
                      14,
                    background:
                      'rgba(90,110,255,.65)',
                    color:
                      '#fff',
                    fontFamily:
                      'Arial',
                    fontSize:
                      26,
                    fontWeight:
                      700,
                    transform:
                      `scale(${1 + Math.sin(
                        frame / 10
                      ) * 0.025})`
                  }}
                >
                  ENVIAR
                </div>
              </Card>

              <Card
                style={{
                  padding:
                    28
                }}
              >
                <div
                  style={{
                    height:
                      330,
                    borderRadius:
                      18,
                    background:
                      'linear-gradient(135deg,rgba(90,110,255,.22),rgba(0,220,180,.10))'
                  }}
                />

                <div
                  style={{
                    marginTop:
                      26,
                    fontSize:
                      30,
                    color:
                      '#fff',
                    fontFamily:
                      'Arial',
                    fontWeight:
                      700
                  }}
                >
                  Vista previa del clip
                </div>
              </Card>
            </AbsoluteFill>
          </AbsoluteFill>
        )}

      {mediaUrl
        ? (
          <AbsoluteFill
            style={{
              background:
                'linear-gradient(90deg,rgba(5,8,15,.78),rgba(5,8,15,.10))'
            }}
          />
        )
        : null}

      {mediaUrl
        ? (
          <div
            style={{
              position:
                'absolute',
              left:
                110,
              bottom:
                90,
              maxWidth:
                1000,
              color:
                '#fff',
              fontSize:
                56,
              fontWeight:
                800,
              fontFamily:
                'Arial'
            }}
          >
            {getHeadline(shot)}
          </div>
        )
        : null}
    </AbsoluteFill>
  );
};

const WorkflowMapLayout = ({
  shot
}) => {
  const frame =
    useCurrentFrame();

  const steps = [
    'FORMULARIO',
    'TRANSCRIPCIÓN',
    'IA',
    'REVISIÓN',
    'ENTREGA'
  ];

  return (
    <AbsoluteFill>
      <SoftGrid
        opacity={0.1}
      />

      <Glow
        x="55%"
        y="55%"
        size={950}
        opacity={0.12}
      />

      <AbsoluteFill
        style={{
          padding:
            '105px 110px'
        }}
      >
        <div
          style={{
            fontSize:
              64,
            fontWeight:
              800,
            color:
              '#fff',
            fontFamily:
              'Arial'
          }}
        >
          {getHeadline(shot)}
        </div>

        <div
          style={{
            marginTop:
              145,
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'space-between'
          }}
        >
          {steps.map(
            (
              step,
              index
            ) => {
              const active =
                frame >
                index * 10;

              return (
                <React.Fragment
                  key={step}
                >
                  <Card
                    style={{
                      width:
                        250,
                      height:
                        180,
                      display:
                        'flex',
                      flexDirection:
                        'column',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      background:
                        active
                          ? 'linear-gradient(145deg,rgba(90,110,255,.32),rgba(10,15,27,.95))'
                          : undefined,
                      boxShadow:
                        active
                          ? '0 0 42px rgba(90,110,255,.20)'
                          : undefined
                    }}
                  >
                    <div
                      style={{
                        width:
                          42,
                        height:
                          42,
                        borderRadius:
                          12,
                        background:
                          active
                            ? 'rgba(0,220,180,.75)'
                            : 'rgba(255,255,255,.12)'
                      }}
                    />

                    <div
                      style={{
                        marginTop:
                          22,
                        color:
                          '#fff',
                        fontFamily:
                          'Arial',
                        fontSize:
                          24,
                        fontWeight:
                          800,
                        textAlign:
                          'center'
                      }}
                    >
                      {step}
                    </div>
                  </Card>

                  {index <
                  steps.length - 1
                    ? (
                      <div
                        style={{
                          color:
                            'rgba(255,255,255,.45)',
                          fontSize:
                            48
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
    </AbsoluteFill>
  );
};

const CTAEndcardLayout = ({
  shot
}) => {
  const frame =
    useCurrentFrame();

  const {
    fps
  } =
    useVideoConfig();

  const pulse =
    spring({
      frame,
      fps,
      config: {
        damping:
          12,
        stiffness:
          95
      }
    });

  return (
    <AbsoluteFill>
      <SoftGrid
        opacity={0.09}
      />

      <Glow
        x="50%"
        y="50%"
        size={1100}
        opacity={0.16}
      />

      <AbsoluteFill
        style={{
          justifyContent:
            'center',
          alignItems:
            'center',
          padding:
            '140px'
        }}
      >
        <div
          style={{
            textAlign:
              'center',
            maxWidth:
              1350
          }}
        >
          <div
            style={{
              fontSize:
                82,
              fontWeight:
                800,
              lineHeight:
                1.08,
              color:
                '#fff',
              fontFamily:
                'Arial',
              transform:
                `scale(${0.96 + pulse * 0.04})`
            }}
          >
            {getHeadline(shot)}
          </div>

          <Card
            style={{
              margin:
                '70px auto 0',
              width:
                760,
              padding:
                '28px 34px',
              fontSize:
                34,
              fontWeight:
                700,
              color:
                '#fff',
              fontFamily:
                'Arial'
            }}
          >
            ¿Qué tarea repetitiva automatizarías primero?
          </Card>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

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
    shot?.graphicElements?.find(
      (
        element
      ) =>
        element.type ===
        'kinetic_words'
    );

  const words =
    kinetic?.words ||
    shot?.captionPlan
      ?.highlightKeywords ||
    [];

  return (
    <AbsoluteFill>
      <SoftGrid
        opacity={0.1}
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
        {words.map(
          (
            word,
            index
          ) => {
            const start =
              index * 6;

            const animation =
              spring({
                frame:
                  frame - start,
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
                key={`${word}-${index}`}
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
                    index % 2 === 0
                      ? 'rgba(255,255,255,0.08)'
                      : 'transparent'
                }}
              >
                {word}
              </div>
            );
          }
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const GenericLayout = ({
  shot
}) => (
  <AbsoluteFill>
    <SoftGrid
      opacity={0.08}
    />

    <Glow
      x="50%"
      y="50%"
      size={900}
      opacity={0.1}
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
      <Card
        style={{
          maxWidth:
            1250,
          padding:
            '56px 68px'
        }}
      >
        <div
          style={{
            fontFamily:
              'Arial, Helvetica, sans-serif',
            fontSize:
              70,
            fontWeight:
              800,
            color:
              '#ffffff',
            textAlign:
              'center',
            lineHeight:
              1.08
          }}
        >
          {getHeadline(shot)}
        </div>
      </Card>
    </AbsoluteFill>
  </AbsoluteFill>
);

const ShotRenderer = ({
  shot
}) => {
  const layout =
    getLayout(shot);

  switch (
    layout
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

    case 'timeline_transform':
      return (
        <TimelineTransformLayout
          shot={shot}
        />
      );

    case 'editor_workspace':
      return (
        <EditorWorkspaceLayout
          shot={shot}
        />
      );

    case 'offer_cards':
      return (
        <OfferCardsLayout
          shot={shot}
        />
      );

    case 'ai_processing_ui':
      return (
        <AIProcessingUILayout
          shot={shot}
        />
      );

    case 'before_after_review':
      return (
        <BeforeAfterReviewLayout
          shot={shot}
        />
      );

    case 'outreach_workspace':
      return (
        <OutreachWorkspaceLayout
          shot={shot}
        />
      );

    case 'workflow_map':
      return (
        <WorkflowMapLayout
          shot={shot}
        />
      );

    case 'cta_endcard':
      return (
        <CTAEndcardLayout
          shot={shot}
        />
      );

    case 'hybrid_context':
      return (
        <SplitGraphicLayout
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

const YouTubeV4 = ({
  timelineShots = []
}) => (
  <AbsoluteFill>
    <Background />

    {timelineShots.map(
      (
        shot
      ) => (
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
    )}
  </AbsoluteFill>
);

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
      }) => ({
        durationInFrames:
          Number(
            props
              ?.totalDurationFrames ||
            300
          ),

        fps:
          Number(
            props
              ?.fps ||
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
