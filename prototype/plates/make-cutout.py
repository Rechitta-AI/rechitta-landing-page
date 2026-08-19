#!/usr/bin/env python3
"""
Montage foreground cutout, attempt 3 — classical, controllable:
ML matting kept eating the hand (dark hand on dusk sky). Instead:
  matte = generous hand+phone polygon  ∩  darkness key (blue channel low)
The dusk sky/bokeh is blue-bright; the hand/phone are blue-dark. Feather the
result. Screen painted before matting so they can't disagree.
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageOps
W = os.path.dirname(os.path.abspath(__file__))

src = Image.open(os.path.join(W, 'hand-c-hires.jpeg')).convert('RGB')

# ── paint the screen (same as before) ────────────────────────────────────────
sq = [(556,110),(1006,105),(1015,1075),(543,1082)]
m = Image.new('L', src.size, 0)
ImageDraw.Draw(m).polygon(sq, fill=255)
m = m.filter(ImageFilter.GaussianBlur(3))
dark = Image.new('RGB', src.size, (13,17,23))
glow = Image.new('L', src.size, 0)
gd = ImageDraw.Draw(glow)
cx, cy = sum(p[0] for p in sq)//4, sum(p[1] for p in sq)//4
for i in range(50, 0, -1):
    r = 300*i/50
    gd.ellipse([cx-r, cy-r*1.5, cx+r, cy+r*1.5], fill=int(60*(1-i/50)))
src = Image.composite(Image.composite(Image.new('RGB',src.size,(66,132,160)), dark, glow), src, m)

# ── containment polygon: generous outline around phone + hand + wrist ────────
poly = [(538,92),(1020,88),(1026,680),(1090,705),(1155,785),(1180,890),
        (1200,995),(1330,1095),(1480,1185),(1495,1200),(1060,1200),
        (1000,1130),(920,1090),(556,1090),(548,1000),(470,955),
        (452,830),(500,695),(538,665)]
contain = Image.new('L', src.size, 0)
ImageDraw.Draw(contain).polygon(poly, fill=255)

# ── darkness key: keep pixels whose blue channel is low (hand/phone), drop sky ──
b = src.split()[2]
key = b.point(lambda v: 255 if v < 96 else (0 if v > 150 else int(255*(150-v)/54)))
key = key.filter(ImageFilter.MaxFilter(5))          # close pinholes (bokeh speckle)
key = key.filter(ImageFilter.MinFilter(5))
# the painted screen + phone body are dark already; force-include the screen quad
key = Image.composite(Image.new('L', src.size, 255), key, m)

matte = Image.composite(key, Image.new('L', src.size, 0), contain)
matte = matte.filter(ImageFilter.MaxFilter(7))       # solidify interior
matte = matte.filter(ImageFilter.GaussianBlur(2.5))  # feather edge

cut = src.convert('RGBA')
cut.putalpha(matte)
bbox = matte.getbbox(); pad = 16
bbox = (max(0,bbox[0]-pad), max(0,bbox[1]-pad), min(cut.width,bbox[2]+pad), min(cut.height,bbox[3]+pad))
cut = cut.crop(bbox)
cut.save(os.path.join(W, 'hand-cutout.webp'), 'WEBP', quality=92)
print('bounds:', bbox, '->', cut.size)
nq = [((x-bbox[0])/cut.width, (y-bbox[1])/cut.height) for x,y in sq]
print('screen quad (normalized):', [(round(x,4),round(y,4)) for x,y in nq])

# quick check composite over a bright test plate
test = Image.new('RGB', (1600,900), (200,150,90))
sc = 820/cut.height
small = cut.resize((int(cut.width*sc), int(cut.height*sc)), Image.LANCZOS)
test.paste(small, (int(800-small.width*0.45), 900-small.height), small)
test.save(os.path.join(W, 'cutout-test.webp'), 'WEBP', quality=85)
print('wrote cutout-test.webp (composite check)')
