#!/usr/bin/env python3
"""Zero-API local media quality inventory. Requires ffprobe (FFmpeg).
Usage: python3 scripts/probe_media.py clip1.mp4 clip2.mp4
Prints JSON. Exit 2 when a clip fails basic technical checks.
No fabricated semantic or copyright verification.
"""
import argparse
import json
import pathlib
import subprocess
import sys

def inspect(path, min_width=1280, min_height=720, min_duration=2.0):
    result={"file":str(path),"valid":False,"issues":[]}
    if not path.is_file():
        result["issues"].append("NOT_FOUND")
        return result
    try:
        p=subprocess.run(
            ["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)],
            capture_output=True,text=True,timeout=25,check=True
        )
        meta=json.loads(p.stdout)
        streams=[s for s in meta.get("streams",[]) if s.get("codec_type")=="video"]
        if not streams:
            result["issues"].append("NO_VIDEO")
            return result
        v=streams[0]
        width=int(v.get("width") or 0)
        height=int(v.get("height") or 0)
        duration=float(v.get("duration") or meta.get("format",{}).get("duration") or 0)
        result.update(width=width,height=height,duration_sec=round(duration,3),
                      codec=v.get("codec_name"),size_bytes=path.stat().st_size)
        if width<min_width or height<min_height: result["issues"].append("LOW_RESOLUTION")
        if duration<min_duration: result["issues"].append("TOO_SHORT")
        if width<height: result["issues"].append("VERTICAL_FOR_16_9")
        if path.stat().st_size==0: result["issues"].append("EMPTY_FILE")
        result["valid"]=not result["issues"]
    except FileNotFoundError:
        result["issues"].append("FFPROBE_NOT_INSTALLED")
    except (subprocess.CalledProcessError,subprocess.TimeoutExpired,ValueError,TypeError) as e:
        result["issues"].append("PROBE_ERROR:"+type(e).__name__)
    return result

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("files",nargs="+",type=pathlib.Path)
    p.add_argument("--min-width",type=int,default=1280)
    p.add_argument("--min-height",type=int,default=720)
    p.add_argument("--min-duration",type=float,default=2)
    args=p.parse_args()
    reports=[inspect(x,args.min_width,args.min_height,args.min_duration) for x in args.files]
    print(json.dumps({"files":reports,"all_technically_valid":all(r["valid"] for r in reports),
      "note":"Technical screening only; relevance, rights, content and cinematic merit require separate checks."},ensure_ascii=False,indent=2))
    return 0 if all(r["valid"] for r in reports) else 2

if __name__=="__main__":
    sys.exit(main())
