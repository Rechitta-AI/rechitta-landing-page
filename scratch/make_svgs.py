import os

projects = [
    ('the-archive.svg', 'THE ARCHIVE', None),
    ('doubletree.svg', 'DOUBLETREE', 'BY HILTON'),
    ('w-residences.svg', 'W RESIDENCES', None),
    ('wadi-villas.svg', 'WADI VILLAS', None),
    ('jw-marriott.svg', 'JW MARRIOTT', 'AL MARJAN ISLAND'),
    ('241waterside.svg', '241 WATERSIDE', None),
    ('il-vento.svg', 'IL VENTO', None),
    ('ryze.svg', 'RYZE', None),
    ('marafid.svg', 'MARAFID', 'RESIDENCES'),
    ('livia.svg', 'LIVIA', 'RESIDENCES'),
    ('la-vue.svg', 'LA VUE', None),
    ('v-suites.svg', 'V SUITES', None),
    ('rivo.svg', 'RIVO', None),
    ('vedaresidences.svg', 'VEDA', 'RESIDENCES'),
]

out_dir = r'public/developers/projects'
os.makedirs(out_dir, exist_ok=True)

for filename, line1, line2 in projects:
    path = os.path.join(out_dir, filename)
    if line2:
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 90" fill="none">
  <text x="160" y="38" text-anchor="middle" fill="#FFFFFF" font-family="Inter, -apple-system, sans-serif" font-size="24" font-weight="700" letter-spacing="0.16em">{line1}</text>
  <text x="160" y="65" text-anchor="middle" fill="#FFFFFF" opacity="0.8" font-family="Inter, -apple-system, sans-serif" font-size="13" font-weight="500" letter-spacing="0.26em">{line2}</text>
</svg>'''
    else:
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 90" fill="none">
  <text x="160" y="49" text-anchor="middle" dominant-baseline="central" fill="#FFFFFF" font-family="Inter, -apple-system, sans-serif" font-size="24" font-weight="700" letter-spacing="0.18em">{line1}</text>
</svg>'''
    with open(path, 'w', encoding='utf-8') as f:
        f.write(svg.strip())

print('Created all 14 project SVG placeholders successfully!')
