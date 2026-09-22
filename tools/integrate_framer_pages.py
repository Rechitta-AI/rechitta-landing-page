import os
import re
import html
from bs4 import BeautifulSoup

PAGES = [
    {
        'src': 'brokers/index.html',
        'route': '/brokers',
        'out_dir': 'src/app/brokers',
        'css_name': 'brokers.css',
        'title': 'Brokers — Rechitta | AI Real Estate Platform in Dubai',
        'desc': 'Rechitta for Real Estate Brokers. 24/7 AI-powered client briefings, multilingual communications, and always-accurate verified property intelligence.',
    },
    {
        'src': 'developers/index.html',
        'route': '/developers',
        'out_dir': 'src/app/developers',
        'css_name': 'developers.css',
        'title': 'Developers — Rechitta | AI Real Estate Platform in Dubai',
        'desc': 'Rechitta for Real Estate Developers. Upload once, sync everywhere. Unify your project inventory and empower brokers worldwide with instant AI briefings.',
    },
    {
        'src': 'blog/index.html',
        'route': '/blog',
        'out_dir': 'src/app/blog',
        'css_name': 'blog.css',
        'title': 'Blog — Rechitta | Insights into AI Real Estate',
        'desc': 'Insights, analysis, and deep dives into the AI transformation of Dubai real estate.',
    },
    {
        'src': 'blog/founders/index.html',
        'route': '/blog/founders',
        'out_dir': 'src/app/blog/founders',
        'css_name': 'blog-founders.css',
        'title': 'Founders — Rechitta',
        'desc': 'Meet the team behind Rechitta and our vision for AI in Dubai real estate.',
    },
    {
        'src': 'blog/dubai-s-ai-real-estate-revolution-bringing-clarity-to-a-complex-market/index.html',
        'route': '/blog/dubai-s-ai-real-estate-revolution-bringing-clarity-to-a-complex-market',
        'out_dir': 'src/app/blog/dubai-s-ai-real-estate-revolution-bringing-clarity-to-a-complex-market',
        'css_name': 'blog-dubai-ai.css',
        'title': "Dubai's AI Real Estate Revolution: Bringing Clarity to a Complex Market — Rechitta",
        'desc': 'How AI is cutting through market noise to bring verifiable data and instant briefings to Dubai property investors.',
    },
    {
        'src': 'blog/upload-once-sync-everywhere-how-dubai-developers-save-aed-85-000-in-hidden-costs/index.html',
        'route': '/blog/upload-once-sync-everywhere-how-dubai-developers-save-aed-85-000-in-hidden-costs',
        'out_dir': 'src/app/blog/upload-once-sync-everywhere-how-dubai-developers-save-aed-85-000-in-hidden-costs',
        'css_name': 'blog-upload-once.css',
        'title': 'Upload Once, Sync Everywhere: How Dubai Developers Save AED 85,000 in Hidden Costs — Rechitta',
        'desc': 'The financial cost of fragmented real estate distribution and how a single source of truth cuts developer overhead.',
    },
    {
        'src': 'blog/multilingual-ai-how-dubai-s-property-sector-is-serving-global-buyers-across-200-nationalities/index.html',
        'route': '/blog/multilingual-ai-how-dubai-s-property-sector-is-serving-global-buyers-across-200-nationalities',
        'out_dir': 'src/app/blog/multilingual-ai-how-dubai-s-property-sector-is-serving-global-buyers-across-200-nationalities',
        'css_name': 'blog-multilingual.css',
        'title': "Multilingual AI: How Dubai's Property Sector Is Serving Global Buyers Across 200+ Nationalities — Rechitta",
        'desc': "Breaking language barriers in the world's most cosmopolitan property hub with real-time multilingual AI agents.",
    },
    {
        'src': 'privacy/index.html',
        'route': '/privacy',
        'out_dir': 'src/app/privacy',
        'css_name': 'privacy.css',
        'title': 'Privacy Policy — Rechitta',
        'desc': 'Rechitta Privacy Policy. Understand how we collect, protect, and handle your data.',
    },
    {
        'src': 'terms/index.html',
        'route': '/terms',
        'out_dir': 'src/app/terms',
        'css_name': 'terms.css',
        'title': 'Terms & Conditions — Rechitta',
        'desc': 'Rechitta Terms & Conditions governing the use of our website and AI platform.',
    },
    {
        'src': '404/index.html',
        'route': '/not-found',
        'out_dir': 'src/app',
        'is_not_found': True,
        'css_name': 'not-found.css',
        'title': 'Page Not Found — Rechitta',
        'desc': 'The page you requested could not be found.',
    },
]

BASE_EXPORT_DIR = 'super-quicker-277911.framer.app-framer-full-20260922064256'
STYLE_DIR = 'src/styles/framer'

os.makedirs(STYLE_DIR, exist_ok=True)

def clean_html_links_and_assets(html_str, current_route):
    # Fix links
    replacements = [
        (r'href=[\'\"]\.\./\.\./index\.html[\'\"]', 'href="/"'),
        (r'href=[\'\"]\.\./index\.html[\'\"]', 'href="/"'),
        (r'href=[\'\"]\./index\.html[\'\"]', f'href="{current_route}"'),
        (r'href=[\'\"]index\.html[\'\"]', 'href="/"'),
        (r'href=[\'\"](?:\.\./|\.\./\.\./)?brokers(?:/index\.html)?[\'\"]', 'href="/brokers"'),
        (r'href=[\'\"](?:\.\./|\.\./\.\./)?developers(?:/index\.html)?[\'\"]', 'href="/developers"'),
        (r'href=[\'\"](?:\.\./|\.\./\.\./)?blog(?:/index\.html)?[\'\"]', 'href="/blog"'),
        (r'href=[\'\"](?:\.\./|\.\./\.\./|\./)?(?:blog/)?founders(?:/index\.html)?[\'\"]', 'href="/blog/founders"'),
        (r'href=[\'\"](?:\.\./|\.\./\.\./|\./)?(?:blog/)?dubai-s-ai-real-estate-revolution-bringing-clarity-to-a-complex-market(?:/index\.html)?[\'\"]', 'href="/blog/dubai-s-ai-real-estate-revolution-bringing-clarity-to-a-complex-market"'),
        (r'href=[\'\"](?:\.\./|\.\./\.\./|\./)?(?:blog/)?upload-once-sync-everywhere-how-dubai-developers-save-aed-85-000-in-hidden-costs(?:/index\.html)?[\'\"]', 'href="/blog/upload-once-sync-everywhere-how-dubai-developers-save-aed-85-000-in-hidden-costs"'),
        (r'href=[\'\"](?:\.\./|\.\./\.\./|\./)?(?:blog/)?multilingual-ai-how-dubai-s-property-sector-is-serving-global-buyers-across-200-nationalities(?:/index\.html)?[\'\"]', 'href="/blog/multilingual-ai-how-dubai-s-property-sector-is-serving-global-buyers-across-200-nationalities"'),
        (r'href=[\'\"](?:\.\./|\.\./\.\./)?privacy(?:/index\.html)?[\'\"]', 'href="/privacy"'),
        (r'href=[\'\"](?:\.\./|\.\./\.\./)?terms(?:/index\.html)?[\'\"]', 'href="/terms"'),
    ]
    for pattern, repl in replacements:
        html_str = re.sub(pattern, repl, html_str)

    # Fix image URLs
    html_str = re.sub(r'https://framerusercontent\.com/images/([a-zA-Z0-9_\-\.]+)(?:\?[^\"\'\s\)]*)?', r'/framer/images/\1', html_str)

    # Fix inline opacity:0 and blur on text containers
    html_str = re.sub(r'opacity:\s*0\.001;', 'opacity: 1;', html_str)
    html_str = re.sub(r'opacity:\s*0;', 'opacity: 1;', html_str)
    html_str = re.sub(r'filter:\s*blur\(4px\);', 'filter: none;', html_str)
    html_str = re.sub(r'-webkit-filter:\s*blur\(4px\);', '-webkit-filter: none;', html_str)

    return html_str

for item in PAGES:
    src_file = os.path.join(BASE_EXPORT_DIR, item['src'])
    with open(src_file) as f:
        content = f.read()

    soup = BeautifulSoup(content, 'html.parser')

    # Remove unwanted scripts and editorbar
    for s in soup.find_all('script'):
        s.decompose()
    for bar in soup.find_all('div', id=['__framer-editorbar-container', '__framer-badge-container']):
        bar.decompose()
    for overlay in soup.find_all('div', id='template-overlay'):
        overlay.decompose()

    # Collect page CSS
    styles = []
    for s in soup.find_all('style'):
        if s.get('data-framer-font-css') is not None:
            s.decompose()
            continue
        stext = s.text
        # Clean CSS
        stext = re.sub(r'https://framerusercontent\.com/images/([a-zA-Z0-9_\-\.]+)(?:\?[^\"\'\)]*)?', r'/framer/images/\1', stext)
        stext = stext.replace('https://fonts.gstatic.com/s/fragmentmono/v6/', '/framer/fonts/')
        styles.append(stext)
        s.decompose()

    css_content = '\n'.join(styles)
    css_file_path = os.path.join(STYLE_DIR, item['css_name'])
    with open(css_file_path, 'w') as f:
        f.write(css_content)

    # Get main container
    main = soup.find('div', id='main')
    framer_root = main.find('div', class_='framer-R7l59') if main else main

    html_markup = str(framer_root) if framer_root else str(main)
    cleaned_markup = clean_html_links_and_assets(html_markup, item['route'])

    # Escape markup for JS string template
    escaped_markup = cleaned_markup.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

    os.makedirs(item['out_dir'], exist_ok=True)
    target_file = os.path.join(item['out_dir'], 'not-found.tsx' if item.get('is_not_found') else 'page.tsx')

    page_code = f"""import type {{ Metadata }} from 'next';
import '@/styles/framer/framer-base.css';
import '@/styles/framer/{item['css_name']}';
import FramerSvgTemplates from '@/components/rechitta/FramerSvgTemplates';
import FramerNavbarController from '@/components/rechitta/FramerNavbarController';

export const metadata: Metadata = {{
  title: {repr(item['title'])},
  description: {repr(item['desc'])},
  alternates: {{
    canonical: 'https://www.rechitta.com{item['route'] if not item.get('is_not_found') else '/404'}',
  }},
  openGraph: {{
    title: {repr(item['title'])},
    description: {repr(item['desc'])},
    url: 'https://www.rechitta.com{item['route'] if not item.get('is_not_found') else '/404'}',
    siteName: 'Rechitta',
    images: [
      {{
        url: '/framer/images/aXEmZNMCnQNebGviyBUtJ2X90.webp',
        width: 1200,
        height: 630,
        alt: 'Rechitta',
      }},
    ],
    type: 'website',
  }},
  twitter: {{
    card: 'summary_large_image',
    title: {repr(item['title'])},
    description: {repr(item['desc'])},
    images: ['/framer/images/aXEmZNMCnQNebGviyBUtJ2X90.webp'],
  }},
}};

const CONTENT_HTML = `{escaped_markup}`;

export default function {('NotFoundPage' if item.get('is_not_found') else item['css_name'].split('.')[0].replace('-', '_').title().replace('_', '') + 'Page')}() {{
  return (
    <div className="framer-page-root">
      <FramerNavbarController />
      <div dangerouslySetInnerHTML={{{{ __html: CONTENT_HTML }}}} />
      <FramerSvgTemplates />
    </div>
  );
}}
"""

    with open(target_file, 'w') as f:
        f.write(page_code)
    print(f"Generated {target_file} and {css_file_path}")

print("All pages successfully integrated!")
