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
        manifest = JSON.parse(
          req.body.manifest
        );
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
