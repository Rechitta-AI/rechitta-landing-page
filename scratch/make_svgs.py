"""
The project wordmarks on the closing boardroom's right-hand wall.

These are placeholders standing in for real project artwork. They were
previously emitted into a fixed 320x90 box whatever the name was, which left
"RYZE" floating in a field of nothing and every single-line mark filling barely
a quarter of its own height. Beside the developer logos — which are near-square
and fill their boxes — they rendered about a fifth of the size.

Two things fix that, and both are done here:

  1. The box is fitted to the text rather than fixed, so the ink is the artwork
     and the reel's contain-fit has nothing to letterbox.
  2. Long names are set over two lines, which brings the aspect ratio from
     roughly 10:1 down to 3-4:1 — close enough to the developer set's 1-2:1
     that a column of one reads at the same size as a column of the other.

Advance widths come from a real font file rather than a guess. Each line also
carries an explicit `textLength`, because these are loaded through an <img>
tag: an SVG referenced that way renders in its own isolated context with no
access to the page's webfonts, so Inter is not there and the system fallback
would set the line at its own width and overflow the box the measurement fitted
to it. `textLength` with `lengthAdjust="spacingAndGlyphs"` pins the advance to
exactly what was measured, in whatever font ends up drawing it.

Re-run from the repo root: python3 scratch/make_svgs.py
"""

import os
from PIL import ImageFont

FONT = "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf"
CAP = 0.715          # cap height as a fraction of font size
# Everything in the box that is not the primary line's capitals is space the
# reel's contain-fit has to pay for: the mark is scaled until the *box* fits,
# so padding, leading and an oversized subtitle all come straight off the size
# of the name. These are as tight as the lockup can go and still read as one.
PAD = 1              # breathing room inside the box, in user units
SIZE_1, TRACK_1 = 24, 0.05   # primary line: size and letter-spacing in em
SIZE_2, TRACK_2 = 10, 0.14   # secondary line
GAP = 3              # between the primary's baseline and the secondary's cap

# (file, line one, line two or None)
PROJECTS = [
    ('the-archive.svg', 'THE', 'ARCHIVE'),
    ('doubletree.svg', 'DOUBLETREE', 'BY HILTON'),
    ('w-residences.svg', 'W', 'RESIDENCES'),
    ('wadi-villas.svg', 'WADI', 'VILLAS'),
    ('jw-marriott.svg', 'JW MARRIOTT', 'AL MARJAN ISLAND'),
    ('241waterside.svg', '241', 'WATERSIDE'),
    ('il-vento.svg', 'IL', 'VENTO'),
    ('ryze.svg', 'RYZE', None),
    ('marafid.svg', 'MARAFID', 'RESIDENCES'),
    ('livia.svg', 'LIVIA', 'RESIDENCES'),
    ('la-vue.svg', 'LA', 'VUE'),
    ('v-suites.svg', 'V', 'SUITES'),
    ('rivo.svg', 'RIVO', None),
    ('vedaresidences.svg', 'VEDA', 'RESIDENCES'),
]

OUT = 'public/developers/projects'
font = ImageFont.truetype(FONT, 1000)


def advance(text: str, size: float, track: float) -> float:
    """Painted width, including the letter-space SVG adds after each glyph."""
    return font.getlength(text) / 1000 * size + len(text) * track * size


def build(line1: str, line2: str | None) -> str:
    cap1 = SIZE_1 * CAP
    w1 = advance(line1, SIZE_1, TRACK_1)

    w2 = advance(line2, SIZE_2, TRACK_2) if line2 else 0.0
    if line2:
        cap2 = SIZE_2 * CAP
        w = max(w1, w2)
        h = cap1 + GAP + cap2
        base1 = PAD + cap1
        base2 = base1 + GAP + cap2
    else:
        w, h = w1, cap1
        base1 = PAD + cap1
        base2 = None

    # The trailing letter-space is inside the advance, so a centred line sits
    # half of one to the right of true centre. Nudge it back.
    cx1 = (w + 2 * PAD) / 2 - TRACK_1 * SIZE_1 / 2
    box_w, box_h = round(w + 2 * PAD, 1), round(h + 2 * PAD, 1)

    rows = [
        f'  <text x="{cx1:.1f}" y="{base1:.1f}" text-anchor="middle" fill="#FFFFFF" '
        f'font-family="Inter, -apple-system, sans-serif" font-size="{SIZE_1}" '
        f'font-weight="700" letter-spacing="{TRACK_1}em" '
        f'textLength="{w1:.1f}" lengthAdjust="spacingAndGlyphs">{line1}</text>'
    ]
    if line2:
        cx2 = (w + 2 * PAD) / 2 - TRACK_2 * SIZE_2 / 2
        rows.append(
            f'  <text x="{cx2:.1f}" y="{base2:.1f}" text-anchor="middle" fill="#FFFFFF" '
            f'opacity="0.82" font-family="Inter, -apple-system, sans-serif" '
            f'font-size="{SIZE_2}" font-weight="500" letter-spacing="{TRACK_2}em" '
            f'textLength="{w2:.1f}" lengthAdjust="spacingAndGlyphs">{line2}</text>'
        )

    body = "\n".join(rows)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {box_w} {box_h}" fill="none">\n'
        f'{body}\n</svg>'
    )


os.makedirs(OUT, exist_ok=True)
for filename, l1, l2 in PROJECTS:
    svg = build(l1, l2)
    with open(os.path.join(OUT, filename), 'w', encoding='utf-8') as fh:
        fh.write(svg)
    vb = svg.split('viewBox="0 0 ')[1].split('"')[0]
    w, h = (float(v) for v in vb.split())
    print(f'{filename:22s} {vb:14s} aspect={w/h:.2f}')
