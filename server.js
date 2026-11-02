import express from 'express';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {fileURLToPath} from 'url';
import {spawnSync} from 'child_process';

import {bundle} from '@remotion/bundler';
import {
  renderMedia,
  selectComposition
} from '@remotion/renderer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const upload = multer({
  dest: os.tmpdir()
});

app.use(
  express.json({
    limit: '50mb'
  })
);

let serveUrlPromise = null;

// ======================================================
// REMOTION BUNDLE CACHE
// ======================================================

const getServeUrl = async () => {
  if (!serveUrlPromise) {
    serveUrlPromise = bundle({
      entryPoint: path.join(
        __dirname,
        'src',
        'index.jsx'
      ),
      webpackOverride: config => config
    });
  }

  return serveUrlPromise;
};

// ======================================================
// HEALTH
// ======================================================

app.get('/health', async (req, res) => {
  try {
    const serveUrl = await getServeUrl();

    return res.json({
      status: 'ok',
      service: 'youtube-remotion-renderer-v4',
      renderer: 'remotion',
      bundleReady: Boolean(serveUrl)
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
});

// ======================================================
// RENDER
// ======================================================


// V8 manifest contract adapter: legacy timeline and n8n semantic shots.
const adaptManifestV8 = (outer) => {
  const m=outer?.manifest && Array.isArray(outer.manifest.shots)?outer.manifest:outer;
  if (Array.isArray(m?.timelineShots) && m.timelineShots.length && m.motionGraphicsReady) return m;
  if (!Array.isArray(m?.shots) || !m.shots.length) throw new Error('Missing shots or timelineShots');
  if(m.manifestQC?.structuralQC===false || m.manifestQC?.timelineConsistent===false) throw new Error('Structural QC failed');
  const fps=Number(m.fps)||30;
  if(!Number.isFinite(fps)||fps<1||fps>120)throw new Error('Invalid fps');
  const ids=new Set(); let previousEnd=-1;
  const timelineShots=[...m.shots].sort((a,b)=>Number(a.productionSequence)-Number(b.productionSequence)).map(sh=>{
    if(!sh?.shotId||ids.has(sh.shotId))throw new Error('Duplicate or missing shotId');
    ids.add(sh.shotId);
    const start=Number(sh.globalStartSec),duration=Number(sh.durationSec);
    if(!Number.isFinite(start)||!Number.isFinite(duration)||start<0||duration<=0)throw new Error('Invalid timing: '+sh.shotId);
    const startFrame=Math.round(start*fps),endFrame=Math.round((start+duration)*fps);
    if(startFrame<previousEnd-1)throw new Error('Overlapping shot: '+sh.shotId);
    previousEnd=endFrame;
    const asset=sh.visualAsset||{},plan=sh.uiMotionPlan||{};
    const locked=sh.sceneId==='S0'||asset.locked===true||sh.visualStrategy?.locked===true;
    return {...sh,startFrame,durationFrames:Math.max(1,endFrame-startFrame),visual:asset,
      template:locked?(asset.template||sh.template):(plan.template||sh.template||asset.template||'generic'),
      layout:locked?(asset.layout||sh.layout):(plan.layout||sh.layout||asset.layout||'object_explainer'),
      locked,preserveExistingRenderer:locked,semanticPlan:plan,
      editorialTreatment:(!locked&&plan.editorialDesign?.visualDesignReady===true)?'contextual_cut_v12':sh.editorialTreatment
    };
  });
  const totalDurationFrames=Math.max(...timelineShots.map(sh=>sh.startFrame+sh.durationFrames));
  return {...m,timelineShots,totalDurationFrames,fps,motionGraphicsReady:true,
    renderTarget:{...m.renderTarget,compositionId:m.renderTarget?.compositionId||'YouTubeV4'}};
};

app.post(
  '/render-v4',
  upload.single('audio'),
  async (req, res) => {
    let outputPath = null;

    try {
      if (!req.body.manifest) {
        return res.status(400).json({
          status: 'error',
          message: 'manifest field is required'
        });
      }

      let manifest;

      try {
        manifest = adaptManifestV8(JSON.parse(
          req.body.manifest
        ));
      } catch (error) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid manifest JSON: ${error.message}`
        });
      }

      if (!manifest.motionGraphicsReady) {
        return res.status(400).json({
          status: 'error',
          message:
            'Manifest is not ready for Remotion'
        });
      }

      if (
        !Array.isArray(
          manifest.timelineShots
        ) ||
        !manifest.timelineShots.length
      ) {
        return res.status(400).json({
          status: 'error',
          message: 'timelineShots is empty'
        });
      }

      const serveUrl =
        await getServeUrl();

      const inputProps = {
        totalDurationFrames:
          manifest.totalDurationFrames,

        fps:
          manifest.fps || 30,

        timelineShots:
          manifest.timelineShots,

        scenes:
          manifest.scenes || []
      };

      const composition =
        await selectComposition({
          serveUrl,

          id:
            manifest.renderTarget
              ?.compositionId ||
            'YouTubeV4',

          inputProps
        });

      const videoOnlyPath =
        path.join(
          os.tmpdir(),
          `youtube_v4_video_${Date.now()}.mp4`
        );

      await renderMedia({
        composition,
        serveUrl,
        codec: 'h264',
        outputLocation:
          videoOnlyPath,
        inputProps,
        crf: 20,
        concurrency: 1,
        chromiumOptions: {
          disableWebSecurity: true
        }
      });

      // ==================================================
      // SI HAY AUDIO, HACEMOS MUX CON FFMPEG
      // ==================================================

      if (
        req.file &&
        fs.existsSync(req.file.path)
      ) {
        outputPath =
          path.join(
            os.tmpdir(),
            `youtube_v4_final_${Date.now()}.mp4`
          );

        const ffmpeg =
          spawnSync(
            'ffmpeg',
            [
              '-y',

              '-i',
              videoOnlyPath,

              '-i',
              req.file.path,

              '-map',
              '0:v:0',

              '-map',
              '1:a:0',

              '-c:v',
              'copy',

              '-c:a',
              'aac',

              '-b:a',
              '192k',

              '-shortest',

              outputPath
            ],
            {
              encoding: 'utf8'
            }
          );

        if (ffmpeg.status !== 0) {
          throw new Error(
            `FFmpeg mux failed: ${ffmpeg.stderr}`
          );
        }
      } else {
        outputPath = videoOnlyPath;
      }

      res.setHeader(
        'Content-Type',
        'video/mp4'
      );

      res.setHeader(
        'Content-Disposition',
        'attachment; filename="youtube_v4.mp4"'
      );

      const stream =
        fs.createReadStream(
          outputPath
        );

      stream.pipe(res);

      stream.on('close', () => {
        try {
          if (
            req.file?.path &&
            fs.existsSync(req.file.path)
          ) {
            fs.unlinkSync(
              req.file.path
            );
          }

          if (
            videoOnlyPath &&
            fs.existsSync(videoOnlyPath)
          ) {
            fs.unlinkSync(
              videoOnlyPath
            );
          }

          if (
            outputPath &&
            outputPath !== videoOnlyPath &&
            fs.existsSync(outputPath)
          ) {
            fs.unlinkSync(
              outputPath
            );
          }
        } catch {
          // Cleanup best effort
        }
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        status: 'error',
        message: error.message,
        stack: error.stack
      });
    }
  }
);

// ======================================================
// START
// ======================================================

const PORT = Number(
  process.env.PORT || 8000
);

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `Remotion V4 renderer running on port ${PORT}`
    );
  }
);
