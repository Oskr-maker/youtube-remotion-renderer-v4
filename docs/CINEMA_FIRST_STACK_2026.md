# Cinema-first stack: technical selection (2026-11-02)
Research scope: selected public GitHub repositories, not a census of every GitHub repository.
Project: 8-minute narrated tech/AI documentaries; n8n + Remotion + Hostinger VPS.
No new paid API is required for the initial path.

## PRIORITY A — adopt patterns; avoid replacing existing renderer
1. **OpenMontage**: https://github.com/slm/openmontage
   * Value: documentary montage, archive-first media corpus and semantic retrieval; prioritise actual moving video rather than stills.
   * Adopt *workflow architecture* (retrieve, validate, edit), not install the whole platform or copy its GPL/AGPL-licensed code blindly. Check exact project licence and dependencies first.
   * Archive.org/NASA/Wikimedia assets need item-level licence/attribution checks; 'freely downloadable' != unlimited commercial licence.
2. **Remotion official skills**: https://github.com/remotion-dev/skills
   * Agent guidance for layout, timing, audio, captions and stable rendering. Current renderer already Remotion; no migration.
   * Source-available Remotion framework has its own licensing terms; verify intended commercial use.
3. **PySceneDetect**: https://github.com/Breakthrough/PySceneDetect
   * BSD-3-Clause. Detect cuts / scene boundaries in incoming stock and final film, useful for extracting stronger shot ranges and repetition diagnostics.
   * Optional Python offline microservice, not necessary to run on every request.
4. **WhisperX**: https://github.com/m-bain/whisperX
   * BSD-2-Clause; word-accurate alignment of existing narration. Run offline as a batch task if hardware allows.
5. **FFmpeg**: https://ffmpeg.org/
   * Existing rendering ecosystem. Use ffprobe for technical validation, crop/scale, loudness matching, fades, grading and encode. No per-video API charge.

## PRIORITY B — test selectively, don't install everything
6. **Onda**: https://github.com/degueba/onda
   * Selected transitions / camera moves *only when matched to real footage*. Check license for each copied component.
7. **HyperFrames**: https://github.com/heygen-com/hyperframes
   * Apache-2.0; alternative for HTML + GSAP motion. Do not migrate from working Remotion unless a demonstrable quality/cost win.
8. **Video Pipeline**: https://github.com/tmason10/video-pipeline
   * Interesting schema-first validation and FFmpeg finishing patterns; inspect licence and code maturity before adaptation.
9. **AdForge**: https://github.com/HamzaSbay/AdForge
   * Reference for real stock + Remotion + sound design. AI providers can introduce API charges; do not copy its provider assumptions.

## REJECT FOR NOW
- Running local text-to-video diffusion models on a small VPS (likely heavy RAM/VRAM, long inference).
- Spawning paid Veo/Kling/Runway APIs for every shot.
- Adding dozens of motion templates without actual footage.
- Replacing the current n8n workflow or Remotion service wholesale.
- Automatically labeling frames as 'real footage' without known provenance and rights.

## Mandatory pipeline, with explicit outputs
1. Narration -> segmented story beats and timestamps (approximate if no real-audio alignment).
2. Each beat -> semantic media brief: visible subject, action, setting, positive/negative keywords, target length, licence/attribution.
3. Query **multiple free sources**: existing Pixabay first, then optional Pexels, Wikimedia and freely licensed NASA/Internet Archive collections. Individual metadata and rights must be checked.
4. Download/select assets -> technical and semantic QA: source uniqueness, orientation, min width/height, usable duration, no watermarks, narration relevance.
5. Merge accepted assets into final manifest **before** split; reject graph-only previews and avoid matching by array index.
6. Render mixed-media sequence in Remotion, no generic three-card fallback for a documentary scene.
7. Audio: true narration alignment when available, loudness, music with sidechain/ducking if legally sourced.
8. Final video QC: cut spacing, duplicated clip usage, low detail, black frames, silent regions, captions and rights sheet.
9. Publish only following editorial viewing; then learn from YouTube Studio retention.

## Practical editorial target
- Use real motion footage wherever it communicates an idea, not random decoration.
- Do NOT enforce a 55% media share as a quality guarantee: select based on narrative function.
- 8-minute audio cannot be guaranteed to retain viewers for 8 minutes. Use hook, reveal, demonstration, contrast, evidence, payoff.
- Avoid 3 consecutive nearly identical layouts. Avoid fixed S0 exemption from quality evaluation; only preserve any truly approved hook when requested.
- First acceptance: 30–60 seconds with 3 distinct types of *actual* imagery, visibly relevant to narration, zero gratuitous repeated-card sequences.

## Current state / scope limit
These are recommendations derived from repositories' public documentation, not proof that third-party code has been installed or benchmarked.
An offline technical asset validator is provided in `scripts/probe_media.py`. It cannot judge cinematic quality or licensing.
