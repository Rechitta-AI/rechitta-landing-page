import json
import re

MANIFEST_PATH = "public/film/manifest.json"

def sort_key(filepath):
    # Extract the number from the filename, e.g., f_1000.webp -> 1000
    match = re.search(r'f_(\d+)', filepath)
    if match:
        return int(match.group(1))
    return filepath

def fix_manifest():
    with open(MANIFEST_PATH, "r") as f:
        manifest_data = json.load(f)
        
    for key, value in manifest_data.items():
        if isinstance(value, list):
            # Only sort the flat arrays that we generated
            print(f"Sorting {key} (found {len(value)} frames)")
            value.sort(key=sort_key)
            manifest_data[key] = value
            
    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest_data, f, indent=2)
        
    print("Manifest successfully resorted mathematically!")

if __name__ == "__main__":
    fix_manifest()
