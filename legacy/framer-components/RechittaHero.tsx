/**
 * RechittaHero — 420vh sticky scroll hero
 *
 * HOW TO USE IN FRAMER:
 * 1. Add as Code Component
 * 2. Set W = 100%, H = 420vh (or set as "fit content")
 * 3. Place first in page flow (below Header and Orb overlays)
 * 4. Pairs with RechittaOrb — the orb sits above this via fixed position
 *
 * NOTE: Add Playfair Display + Inter via Framer Project Settings → Fonts
 */

import { addPropertyControls, ControlType } from "framer"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef, useState } from "react"

// ── Dubai Skyline SVG ────────────────────────────── //
function DubaiSkyline() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax meet"
        style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="dl-tower-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0d1630" stopOpacity="0" />
            <stop offset="15%"  stopColor="#0d1630" stopOpacity="0.7" />
            <stop offset="40%"  stopColor="#0d1630" stopOpacity="1" />
            <stop offset="100%" stopColor="#0d1630" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="dl-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0A0A09" stopOpacity="0" />
            <stop offset="100%" stopColor="#0A0A09" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="dl-win-l" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3D6FF5" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3D6FF5" stopOpacity="0.08" />
          </linearGradient>
          <radialGradient id="dl-vignette" cx="50%" cy="50%" r="60%">
            <stop offset="30%"  stopColor="#0A0A09" stopOpacity="0" />
            <stop offset="100%" stopColor="#0A0A09" stopOpacity="0.85" />
          </radialGradient>
          <clipPath id="dl-left-clip"><rect x="0" y="0" width="420" height="900" /></clipPath>
        </defs>

        {/* Left cluster */}
        <g clipPath="url(#dl-left-clip)">
          <polygon points="158,0 154,55 150,120 146,200 142,290 138,370 133,420 126,465 118,510 106,560 92,630 78,720 65,900 251,900 238,720 224,630 210,560 198,510 190,465 183,420 178,370 174,290 170,200 166,120 162,55" fill="#0d1630" />
          <polygon points="126,465 118,510 190,510 183,465" fill="#0f1d3a" />
          {[220,280,340,400,450,490].map((y,i) => (
            <rect key={i} x={120+i*2} y={y} width={20+i*1.5} height="4" fill="url(#dl-win-l)" opacity="0.6" />
          ))}
          <polygon points="290,160 300,140 320,120 340,140 350,160 360,900 280,900" fill="#0c1528" />
          <rect x="285" y="200" width="80" height="700" fill="#0c1528" />
          {[250,300,360,420,490,560,630,700,760].map((y,i) => (
            <rect key={i} x="285" y={y} width="80" height="1.5" fill="#111f3e" opacity="0.5" />
          ))}
          <rect x="30"  y="350" width="55" height="550" fill="#0b1322" />
          <polygon points="30,350 57,310 85,350" fill="#0d1630" />
          <rect x="0"   y="580" width="35" height="320" fill="#090f1e" />
          <rect x="375" y="500" width="50" height="400" fill="#0b1528" />
          <rect x="0" y="0" width="420" height="900" fill="url(#dl-tower-fade)" style={{ mixBlendMode: "multiply" }} />
        </g>

        {/* Right cluster (mirrored) */}
        <g transform="translate(1440,0) scale(-1,1)" clipPath="url(#dl-left-clip)">
          <polygon points="158,0 154,55 150,120 146,200 142,290 138,370 133,420 126,465 118,510 106,560 92,630 78,720 65,900 251,900 238,720 224,630 210,560 198,510 190,465 183,420 178,370 174,290 170,200 166,120 162,55" fill="#0d1630" />
          <polygon points="126,465 118,510 190,510 183,465" fill="#0f1d3a" />
          {[220,280,340,400,450,490].map((y,i) => (
            <rect key={i} x={120+i*2} y={y} width={20+i*1.5} height="4" fill="url(#dl-win-l)" opacity="0.6" />
          ))}
          <polygon points="290,160 300,140 320,120 340,140 350,160 360,900 280,900" fill="#0c1528" />
          <rect x="285" y="200" width="80" height="700" fill="#0c1528" />
          {[250,300,360,420,490,560].map((y,i) => (
            <rect key={i} x="285" y={y} width="80" height="1.5" fill="#111f3e" opacity="0.5" />
          ))}
          <rect x="30"  y="350" width="55" height="550" fill="#0b1322" />
          <polygon points="30,350 57,310 85,350" fill="#0d1630" />
          <rect x="0"   y="580" width="35" height="320" fill="#090f1e" />
          <rect x="375" y="500" width="50" height="400" fill="#0b1528" />
          <rect x="0" y="0" width="420" height="900" fill="url(#dl-tower-fade)" style={{ mixBlendMode: "multiply" }} />
        </g>

        <rect x="0" y="720" width="1440" height="180" fill="url(#dl-ground)" />
        <rect x="0" y="0"   width="1440" height="900" fill="url(#dl-vignette)" />
      </svg>
    </div>
  )
}

const STAGES = [
  {
    eyebrow: "",
    headline: ["Your", "private", "property curator."],
    italicIdx: 1,
    sub: "Talk to Rechitta about any Dubai property.",
  },
  {
    eyebrow: "IN YOUR LANGUAGE",
    headline: ["Speaks Russian.", "Arabic. Hindi.", "English."],
    italicIdx: -1,
    sub: "Real answers. No agents. No delays.",
  },
  {
    eyebrow: "THE INTELLIGENCE",
    headline: ["One AI.", "Every developer.", "Every launch."],
    italicIdx: -1,
    sub: "Dubai's entire new-build market. Instantly.",
  },
]

function TextStage({ stage, opacity, y }: { stage: typeof STAGES[0]; opacity: any; y: any }) {
  return (
    <motion.div
      style={{
        opacity, y,
        position: "absolute", inset: 0,
        textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
      }}
    >
      {stage.eyebrow ? (
        <p style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 11, fontWeight: 500, letterSpacing: "0.10em",
          textTransform: "uppercase", color: "#535350",
          marginBottom: 14,
        }}>{stage.eyebrow}</p>
      ) : null}
      <div style={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: "clamp(30px, 5vw, 68px)",
        fontWeight: 400, letterSpacing: "-0.025em",
        color: "#FAFAF9", lineHeight: 1.12, marginBottom: 20,
      }}>
        {stage.headline.map((line, i) => (
          <div key={i}>{i === stage.italicIdx ? <em>{line}</em> : line}</div>
        ))}
      </div>
      <p style={{
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: "clamp(15px, 2vw, 18px)",
        color: "#A8A8A1", lineHeight: 1.6,
      }}>{stage.sub}</p>
    </motion.div>
  )
}

interface Props {
  ctaLabel?: string
  ctaHref?: string
  width?: number
  height?: number
  style?: React.CSSProperties
}

export default function RechittaHero({ ctaLabel = "Start a briefing →", ctaHref = "#" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ctaHovered, setCtaHovered] = useState(false)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  // Skyline
  const skylineOpacity = useTransform(scrollYProgress, [0.38, 0.68], [0, 1])
  // Logo
  const logoOpacity = useTransform(scrollYProgress, [0.52, 0.72], [0, 1])
  const logoY       = useTransform(scrollYProgress, [0.52, 0.72], ["18px", "0px"])
  const lineScaleX  = useTransform(scrollYProgress, [0.58, 0.78], [0, 1])
  // CTA
  const ctaOpacity  = useTransform(scrollYProgress, [0.82, 0.92], [0, 1])
  const ctaY        = useTransform(scrollYProgress, [0.82, 0.92], ["16px", "0px"])
  // Scroll hint
  const hintOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])

  // Text stages
  const s0Opacity = useTransform(scrollYProgress, [0, 0.28, 0.38], [1, 1, 0])
  const s0Y       = useTransform(scrollYProgress, [0, 0.28, 0.38], ["0px", "0px", "-20px"])
  const s1Opacity = useTransform(scrollYProgress, [0.32, 0.40, 0.52, 0.60], [0, 1, 1, 0])
  const s1Y       = useTransform(scrollYProgress, [0.32, 0.40, 0.52, 0.60], ["20px", "0px", "0px", "-20px"])
  const s2Opacity = useTransform(scrollYProgress, [0.56, 0.65, 0.76, 0.84], [0, 1, 1, 0])
  const s2Y       = useTransform(scrollYProgress, [0.56, 0.65, 0.76, 0.84], ["20px", "0px", "0px", "-20px"])

  return (
    <div ref={containerRef} style={{ height: "420vh", position: "relative" }}>
      <div
        style={{
          position: "sticky", top: 0, height: "100svh",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "clamp(20px, 3vh, 36px)",
          background: "transparent",
          paddingTop: 80, paddingBottom: 40,
        }}
      >
        {/* Dubai Skyline */}
        <motion.div style={{ opacity: skylineOpacity, position: "absolute", inset: 0, zIndex: 6 }}>
          <DubaiSkyline />
        </motion.div>

        {/* RECHITTA logo between towers */}
        <motion.div
          style={{
            opacity: logoOpacity, y: logoY,
            position: "absolute",
            bottom: "clamp(80px, 12vh, 140px)",
            left: 0, right: 0,
            display: "flex", flexDirection: "column", alignItems: "center",
            zIndex: 7, pointerEvents: "none",
          }}
        >
          <div style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: "clamp(18px, 3vw, 42px)",
            fontWeight: 400, letterSpacing: "0.16em",
            color: "#F4F4F2", textTransform: "uppercase",
          }}>RECHITTA</div>
          <motion.div style={{
            scaleX: lineScaleX,
            height: 1, width: "100%",
            maxWidth: "clamp(120px, 20vw, 260px)",
            background: "#C5A572",
            marginTop: 10, originX: 0.5, opacity: 0.7,
          }} />
        </motion.div>

        {/* Spacer — orb lives above this */}
        <div style={{ height: "clamp(180px, 28vh, 320px)", flexShrink: 0 }} />

        {/* Text stages */}
        <div style={{
          position: "relative", width: "100%", maxWidth: 640,
          height: "clamp(130px, 18vh, 170px)",
          padding: "0 24px", flexShrink: 0, zIndex: 8,
        }}>
          <TextStage stage={STAGES[0]} opacity={s0Opacity} y={s0Y} />
          <TextStage stage={STAGES[1]} opacity={s1Opacity} y={s1Y} />
          <TextStage stage={STAGES[2]} opacity={s2Opacity} y={s2Y} />
        </div>

        {/* CTA */}
        <motion.div style={{
          opacity: ctaOpacity, y: ctaY,
          position: "absolute", bottom: "clamp(32px, 6vh, 64px)",
          zIndex: 8,
        }}>
          <motion.a
            href={ctaHref}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              height: 52, padding: "0 40px",
              background: ctaHovered ? "#FFFFFF" : "#FAFAF9",
              color: "#0A0A09",
              border: "none", borderRadius: 9999,
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 16, fontWeight: 600, textDecoration: "none",
              transition: "background 150ms",
            }}
          >
            {ctaLabel}
          </motion.a>
        </motion.div>

        {/* Scroll hint */}
        <motion.div style={{
          opacity: hintOpacity,
          position: "absolute", bottom: 32,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          zIndex: 8,
        }}>
          <span style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 10, letterSpacing: "0.1em",
            color: "#535350", textTransform: "uppercase",
          }}>Scroll</span>
          <div style={{
            width: 2, height: 48, background: "#535350",
            animation: "rechittaScrollPulse 3s ease-in-out infinite",
          }} />
        </motion.div>
      </div>

      <style>{`
        @keyframes rechittaScrollPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

RechittaHero.defaultProps = { ctaLabel: "Start a briefing →", ctaHref: "#" }

addPropertyControls(RechittaHero, {
  ctaLabel: {
    type: ControlType.String,
    title: "CTA Label",
    defaultValue: "Start a briefing →",
  },
  ctaHref: {
    type: ControlType.String,
    title: "CTA Link",
    defaultValue: "#",
  },
})
