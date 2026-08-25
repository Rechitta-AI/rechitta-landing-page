import os
import subprocess
import glob
import json

VIDEOS = [
    {
        "input": "public/upscaled-ones/upscaled-start-to-screen.mp4",
        "output_dir": "public/film/frames/scene1-3",
        "manifest_key": "scene1-3"
    },
    {
        "input": "public/upscaled-ones/upscaled-screen-to-broker.mp4",
        "output_dir": "public/film/frames/transit-b",
        "manifest_key": "transit-b"
    },
    {
        "input": "public/upscaled-ones/upscaled-broker-to-buyer.mp4",
        "output_dir": "public/film/frames/transit-c",
        "manifest_key": "transit-c"
    }
]

MANIFEST_PATH = "public/film/manifest.json"

def process_video(video_info):
    video_path = video_info["input"]
    output_dir = video_info["output_dir"]
    manifest_key = video_info["manifest_key"]
    
    if not os.path.exists(video_path):
        print(f"Error: {video_path} not found.")
        return None, None

    os.makedirs(output_dir, exist_ok=True)

    print(f"Extracting 60fps WebP for {manifest_key}...")
    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-i", video_path,
        "-vcodec", "libwebp",
        "-lossless", "0",
        "-compression_level", "6",
        "-q:v", "95",
        "-r", "60",
        "-start_number", "0",
        os.path.join(output_dir, "f_%03d.webp")
    ]
    
    subprocess.run(ffmpeg_cmd)

    frames = glob.glob(os.path.join(output_dir, "*.webp"))
    # Sort correctly (f_000.webp, f_001.webp...)
    frames.sort()
    
    web_paths = [f"/film/frames/{manifest_key}/{os.path.basename(f)}" for f in frames]
    print(f"Found {len(web_paths)} frames for {manifest_key}.")
    
    return manifest_key, web_paths

def main():
    manifest_data = {}
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, "r") as f:
            try:
                manifest_data = json.load(f)
            except json.JSONDecodeError:
                manifest_data = {}
                
    for video in VIDEOS:
        key, paths = process_video(video)
        if key and paths:
            manifest_data[key] = paths
        
    print("Updating manifest.json...")
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest_data, f, indent=2)
        
    print("Done! All sequences replaced.")

if __name__ == "__main__":
    main()
