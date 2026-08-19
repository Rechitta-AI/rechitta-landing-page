#!/usr/bin/env python3
"""
Rechitta scroll film — keyframe retouch + derivation pipeline (Pillow).
Deterministic: originals preserved in stills/orig/, outputs overwrite stills/.

Does (per PLAN.md Phase 0, 'Claude' rows):
  KF3   retouch: dissolve readable screen charts into soft blocks; soften presenter face
  KF4   retouch: dusk -> golden-hour warm regrade; blur signage patches
  KF5   retouch: repaint phone screen (removes reflected face), brighter cyan glow
  KF2   extract: Transit A final frame (960w working copy until owner's 1280 lands)
  KF-03D derive: blue-hour boardroom, green-cyan screen (Transit D first frame)
  KF-07  derive (draft, from 960w KF2): night facade, one lit window (style ref)
  KF-08  derive: KF1 night regrade — replicates the engine finale() recipe exactly
Untouched: KF1 (approved), KF-06 (already clean; first-person re-roll stays optional).
"""
import os, shutil
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageChops

W = os.path.dirname(os.path.abspath(__file__))
ST = os.path.join(W, 'stills')
ORIG = os.path.join(ST, 'orig')
os.makedirs(ORIG, exist_ok=True)

def load(name):
    p = os.path.join(ST, name)
    b = os.path.join(ORIG, name)
    if not os.path.exists(b):
        shutil.copy2(p, b)          # first run: stash the original
    return Image.open(b).convert('RGB')  # always work from the original

def save(im, name, q=88):
    im.save(os.path.join(ST, name), 'WEBP', quality=q)
    print(f'  wrote stills/{name}  {im.size}')

def feathered_poly_mask(size, poly, blur=10):
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).polygon(poly, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur))

def feathered_ellipse_mask(size, box, blur=8):
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).ellipse(box, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur))

def radial_glow(size, center, radius, color, peak):
    """Radial gradient sprite composited via screen blend."""
    g = Image.new('L', size, 0)
    d = ImageDraw.Draw(g)
    steps = 60
    for i in range(steps, 0, -1):
        r = radius * i / steps
        a = int(peak * 255 * (1 - i / steps) ** 1.6)
        d.ellipse([center[0]-r, center[1]-r, center[0]+r, center[1]+r], fill=a)
    layer = Image.new('RGB', size, color)
    return layer, g

def vgrad(size, top, bottom):
    g = Image.new('RGB', (1, size[1]))
    for y in range(size[1]):
        t = y / max(1, size[1]-1)
        g.putpixel((0, y), tuple(int(top[i]+(bottom[i]-top[i])*t) for i in range(3)))
    return g.resize(size)

# ── KF3: boardroom ───────────────────────────────────────────────────────────
def kf3():
    im = load('KF3.webp'); s = im.size
    # screen: dissolve charts into abstract soft blocks (blur hard, lift toward white)
    poly = [(545,68),(1085,25),(1092,352),(552,368)]
    blurred = im.filter(ImageFilter.GaussianBlur(22))
    blurred = Image.blend(blurred, Image.new('RGB', s, (245,244,240)), 0.18)
    im.paste(blurred, (0,0), feathered_poly_mask(s, poly, 12))
    # presenter's face: soften into silhouette territory
    face = (478, 205, 540, 275)
    soft = im.filter(ImageFilter.GaussianBlur(14))
    soft = ImageEnhance.Brightness(soft).enhance(0.86)
    im.paste(soft, (0,0), feathered_ellipse_mask(s, face, 10))
    save(im, 'KF3.webp')
    return im

# ── KF4: street broker ───────────────────────────────────────────────────────
def kf4():
    im = load('KF4.webp'); s = im.size
    # dusk -> golden hour: warm channel curves + gentle amber haze
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v*1.10 + 6)))
    g = g.point(lambda v: min(255, int(v*1.02 + 2)))
    b = b.point(lambda v: int(v*0.86))
    im = Image.merge('RGB', (r, g, b))
    im = ImageEnhance.Color(im).enhance(1.08)
    im = ImageEnhance.Brightness(im).enhance(1.04)
    haze = vgrad(s, (255,178,96), (60,36,10))
    im = ImageChops.screen(im, ImageEnhance.Brightness(haze).enhance(0.16))
    # signage: blur + desaturate patches (post-regrade so grade stays uniform)
    for box in [(1140,120,1280,215), (75,345,140,390), (200,305,255,395), (148,355,195,385)]:
        blurred = im.filter(ImageFilter.GaussianBlur(16))
        blurred = ImageEnhance.Color(blurred).enhance(0.45)
        x0,y0,x1,y1 = box
        im.paste(blurred, (0,0), feathered_poly_mask(s, [(x0,y0),(x1,y0),(x1,y1),(x0,y1)], 9))
    save(im, 'KF4.webp')
    return im

# ── KF5: phone macro ─────────────────────────────────────────────────────────
def kf5():
    im = load('KF5.webp'); s = im.size
    # repaint the screen: dark gradient + cyan glow (removes the reflected face),
    # brighter glow to match KF4's phone
    poly = [(506,60),(798,58),(803,668),(502,670)]
    fill = vgrad(s, (62,74,84), (22,28,36))
    mask = feathered_poly_mask(s, poly, 5)
    im.paste(fill, (0,0), mask)
    glow_layer, glow_mask = radial_glow(s, (652,340), 210, (120,215,240), 0.62)
    glow_mask = ImageChops.multiply(glow_mask, mask)  # glow stays inside the screen
    im.paste(ImageChops.screen(im, glow_layer), (0,0), glow_mask)
    # notch: restore original pixels (camera bar must stay crisp)
    orig = Image.open(os.path.join(ORIG, 'KF5.webp')).convert('RGB')
    im.paste(orig.crop((560,48,720,92)), (560,48))
    save(im, 'KF5.webp')
    return im

# ── KF2: extract Transit A final frame (working copy) ────────────────────────
def kf2():
    im = Image.open(os.path.join(W, 'ta', 'f_096.webp')).convert('RGB')
    save(im, 'KF2.webp', q=92)
    return im

# ── night grade helper (prompt-pack ImageMagick recipe, Pillow port) ─────────
def night_base(im, bright=0.55, sat=0.70, colorize=(27,42,74), amt=0.28):
    im = ImageEnhance.Brightness(im).enhance(bright)
    im = ImageEnhance.Color(im).enhance(sat)
    return Image.blend(im, Image.new('RGB', im.size, colorize), amt)

# ── KF-03D: dusk boardroom (Transit D first frame) ───────────────────────────
def kf03d(kf3_im):
    im = night_base(kf3_im.copy()); s = im.size
    # window wall goes night: darken + cool the left glass band
    band = feathered_poly_mask(s, [(0,0),(345,0),(345,720),(0,720)], 18)
    cool = ImageEnhance.Brightness(im).enhance(0.62)
    cool = Image.blend(cool, Image.new('RGB', s, (10,18,38)), 0.35)
    im.paste(cool, (0,0), band)
    # screen glow shifts green-cyan (the live world map overlay lands here)
    poly = [(545,68),(1085,25),(1092,352),(552,368)]
    mask = feathered_poly_mask(s, poly, 12)
    tinted = Image.blend(im, Image.new('RGB', s, (58,240,184)), 0.30)
    tinted = ImageEnhance.Brightness(tinted).enhance(1.12)
    im.paste(tinted, (0,0), mask)
    glow_layer, glow_mask = radial_glow(s, (818,190), 420, (58,220,170), 0.28)
    im.paste(ImageChops.screen(im, glow_layer), (0,0), glow_mask)
    save(im, 'KF-03D.webp')

# ── KF-07 draft: night facade, one lit window (from 960w KF2) ───────────────
def kf07(kf2_im):
    im = night_base(kf2_im.copy(), bright=0.5); s = im.size
    # one warm living window — the boardroom stays awake
    glow_layer, glow_mask = radial_glow(s, (500,280), 240, (232,162,75), 0.5)
    im.paste(ImageChops.screen(im, glow_layer), (0,0), glow_mask)
    core, core_m = radial_glow(s, (500,280), 90, (255,214,150), 0.55)
    im.paste(ImageChops.screen(im, core), (0,0), core_m)
    save(im, 'KF-07-draft.webp')

# ── KF-08: finale sky — the engine's live finale() recipe, pre-baked ─────────
def kf08():
    im = load('KF1.webp'); s = im.size
    im = ImageChops.multiply(im, Image.new('RGB', s, (34,52,94)))       # multiply #22345E
    im = Image.blend(im, Image.new('RGB', s, (16,26,52)), 0.55)         # night plunge
    band = vgrad(s, (0,0,0), (120,70,20))                               # warm horizon band
    band = ImageEnhance.Brightness(band).enhance(0.5)
    mask = vgrad(s, (0,0,0), (255,255,255)).convert('L')
    im.paste(ImageChops.screen(im, band), (0,0), mask)
    d = ImageDraw.Draw(im)                                              # stars, deterministic
    seed = 7
    def rng():
        nonlocal seed
        seed = (seed * 16807) % 2147483647
        return seed / 2147483647
    for _ in range(120):
        x, y = rng()*s[0], rng()*s[1]*0.55
        sz = rng()*1.4 + 0.4
        a = 0.25 + 0.5*rng()
        c = tuple(int(v*a) for v in (200,226,240))
        d.rectangle([x, y, x+sz, y+sz], fill=c)
    save(im, 'KF-08.webp')

if __name__ == '__main__':
    print('Retouching…')
    k3 = kf3()
    kf4()
    kf5()
    k2 = kf2()
    kf03d(k3)
    kf07(k2)
    kf08()
    print('Done. Originals in stills/orig/.')
