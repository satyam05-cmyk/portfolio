import os
from rembg import remove, new_session
from PIL import Image

SRC_DIR = "frame"
OUT_DIR = "frame_cut"
os.makedirs(OUT_DIR, exist_ok=True)

print("Starting batch cutout...")
# Using the human_seg model for better hair edges
session = new_session('u2net_human_seg')

frames = [f for f in sorted(os.listdir(SRC_DIR)) if f.lower().endswith(".jpg")]
total = len(frames)

for i, fname in enumerate(frames):
    img_path = os.path.join(SRC_DIR, fname)
    img = Image.open(img_path).convert("RGBA")
    out = remove(img, session=session)
    
    out_name = fname.rsplit(".", 1)[0] + ".webp"
    out_path = os.path.join(OUT_DIR, out_name)
    
    out.save(out_path, "WEBP", lossless=False, quality=85)
    print(f"[{i+1}/{total}] Processed {out_name}")

print("Done!")
