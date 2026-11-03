#!/usr/bin/env python3
"""Cinematic QC, no paid API. Requires ffmpeg/ffprobe, optional scenedetect.
Checks motion, scene-cut density and black frames of completed MP4.
Does not infer story relevance, licensing, or human retention.
Usage: python3 scripts/cinema_qc.py final.mp4 [--strict]
"""
import argparse,json,shutil,subprocess,sys,re,pathlib
def run(args):
 p=subprocess.run(args,capture_output=True,text=True,timeout=180)
 return p.returncode,p.stdout,p.stderr
def main():
 ap=argparse.ArgumentParser()
 ap.add_argument('video',type=pathlib.Path)
 ap.add_argument('--strict',action='store_true')
 a=ap.parse_args()
 if not a.video.is_file():ap.error('Missing MP4')
 if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):ap.error('ffmpeg/ffprobe required')
 c,out,err=run(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_type,width,height','-of','json',str(a.video)])
 if c:ap.error(err)
 meta=json.loads(out);duration=float(meta.get('format',{}).get('duration') or 0)
 v=next((x for x in meta.get('streams',[]) if x.get('codec_type')=='video'),{})
 c,out,err=run(['ffmpeg','-hide_banner','-i',str(a.video),'-vf','blackdetect=d=0.35:pix_th=0.11','-an','-f','null','-'])
 black=[(float(x),float(y)) for x,y in re.findall(r'black_start:([\d.]+) black_end:([\d.]+)',err)]
 # scene cuts by ffmpeg scene score (no extra package, fast downscaled decode)
 c,out,err=run(['ffmpeg','-hide_banner','-i',str(a.video),'-vf',"scale=320:-2,select='gt(scene,0.34)',showinfo",'-an','-f','null','-'])
 timestamps=[float(x) for x in re.findall(r'pts_time:([\d.]+)',err)]
 issues=[]
 if duration<=0:issues.append('INVALID_DURATION')
 if len(black):issues.append('BLACK_FRAMES')
 if duration>=20 and len(timestamps)==0:issues.append('NO_DETECTED_VISUAL_CUTS')
 if duration>=60 and len(timestamps)/duration<.035:issues.append('LOW_VISUAL_CHANGE_RATE')
 report={'file':str(a.video),'durationSec':round(duration,2),'width':v.get('width'),'height':v.get('height'),
  'blackRanges':black,'sceneChangeCount':len(timestamps),'sceneChangeTimesSec':timestamps[:200],
  'cutsPerMinute':round(len(timestamps)*60/max(duration,1),1),'flags':issues,
  'caution':'Automated heuristic. Camera movement and meaningful visual variation require human review; cut count alone is not quality.'}
 print(json.dumps(report,ensure_ascii=False,indent=2))
 return 2 if a.strict and issues else 0
if __name__=='__main__':sys.exit(main())
