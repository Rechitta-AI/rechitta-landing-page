import subprocess, sys, os

videos = [
    {
        "input": "public/whole/scene-1-3.mp4",
        "output": "public/film/frames/scene1-3/landscape/1920"
    },
    {
        "input": "public/whole/3-tothephone.mp4",
        "output": "public/film/frames/transit-b/landscape/1920"
    },
    {
        "input": "public/whole/broke- to-buyer.mp4",
        "output": "public/film/frames/transit-c/landscape/1920"
    }
]

for v in videos:
    print(f"\n--- Extracting {v['input']} ---")
    os.makedirs(v['output'], exist_ok=True)
    
    # Delete existing frames first to avoid ghost frames if the new count is shorter
    for file in os.listdir(v['output']):
        os.remove(os.path.join(v['output'], file))

    output_pattern = os.path.join(v['output'], "f_%03d.webp")
    cmd = [
        "ffmpeg",
        "-i", v['input'],
        "-vf", "fps=60,hqdn3d=1.5:1.5:6:6,scale=1920:1080:flags=lanczos",
        "-f", "image2",
        "-vcodec", "libwebp",
        "-quality", "85",
        "-compression_level", "6",
        output_pattern,
        "-y"
    ]

    print("Running:", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error on {v['input']}")
        print(result.stderr[-2000:])
    else:
        files = sorted(os.listdir(v['output']))
        print(f"Success! Files written: {len(files)}")
        if files:
            print("First:", files[0], "Last:", files[-1])

