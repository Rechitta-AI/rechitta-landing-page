/**
 * RechittaLanguages — Multilingual by Design section
 *
 * HOW TO USE IN FRAMER:
 * 1. Add as Code Component
 * 2. Set W = 100%, H = "fit content"
 * 3. Place after RechittaHero in page flow
 */

import { addPropertyControls, ControlType } from "framer"
import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"

const DEFAULT_LANGS = ["العربية", "Русский", "हिंदी", "中文", "Français", "Deutsch", "English"]

const ease = [0.16, 1, 0.3, 1] as const

interface Props {
  headline?: string
  subheadline?: string
  body?: string
  ctaLabel?: string
  ctaHref?: string
  languages?: string[]
  width?: number
  height?: number
  style?: React.CSSProperties
}

export default function RechittaLanguages({
  headline = "She speaks\nyour language.",
  subheadline = "MULTILINGUAL BY DESIGN",
  body = "Russian, Arabic, Hindi, Mandarin, English — and counting. Rechitta answers in the language your investor thinks in. Mid-conversation. No switching. No delay.",
  ctaLabel = "How it works →",
  ctaHref = "#",
  languages = DEFAULT_LANGS,
}: Props) {
  const ref = useRef<HTMLElement>(null!)
  const inView = useInView(ref, { amount: 0.2, once: true })
  const [ctaHovered, setCtaHovered] = useState(false)

  return (
    <section
      ref={ref}
      style={{
        background: "transparent",
        borderTop: "1px solid #222220",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          paddingLeft:  "clamp(24px, 6vw, 96px)",
          paddingRight: "clamp(24px, 6vw, 96px)",
          paddingTop:   "clamp(80px, 12vw, 160px)",
          paddingBottom:"clamp(80px, 12vw, 160px)",
          display: "flex",
          alignItems: "center",
          gap: "clamp(48px, 8vw, 120px)",
          flexWrap: "wrap",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          style={{ flex: "1 1 360px", minWidth: 260, position: "relative", zIndex: 6 }}
        >
          {/* Eyebrow */}
          <p style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 11, fontWeight: 500, letterSpacing: "0.10em",
            textTransform: "uppercase", color: "#535350",
            marginBottom: 20,
          }}>{subheadline}</p>

          {/* Headline */}
          <div style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: "clamp(30px, 4.5vw, 64px)",
            fontWeight: 400, letterSpacing: "-0.025em",
            color: "#FAFAF9", lineHeight: 1.1,
            marginBottom: 24,
            whiteSpace: "pre-line",
          }}>{headline}</div>

          {/* Body */}
          <p style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 16, lineHeight: "26px",
            color: "#A8A8A1",
            maxWidth: 400, marginBottom: 32,
          }}>{body}</p>

          {/* Language chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 40 }}>
            {languages.map((lang, i) => (
              <motion.span
                key={lang}
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.07, ease }}
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 17, color: "#D2D2CD",
                  padding: "6px 16px",
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                }}
              >{lang}</motion.span>
            ))}
          </div>

          {/* CTA */}
          <motion.a
            href={ctaHref}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              height: 40, padding: "0 20px",
              background: "transparent",
              color: ctaHovered ? "#F4F4F2" : "#A8A8A1",
              border: ctaHovered ? "1px solid #6B6B68" : "1px solid #383836",
              borderRadius: 9999,
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 14, fontWeight: 500, textDecoration: "none",
              transition: "color 150ms, border-color 150ms",
            }}
          >{ctaLabel}</motion.a>
        </motion.div>
      </div>
    </section>
  )
}

RechittaLanguages.defaultProps = {
  headline: "She speaks\nyour language.",
  subheadline: "MULTILINGUAL BY DESIGN",
  body: "Russian, Arabic, Hindi, Mandarin, English — and counting. Rechitta answers in the language your investor thinks in. Mid-conversation. No switching. No delay.",
  ctaLabel: "How it works →",
  ctaHref: "#",
  languages: DEFAULT_LANGS,
}

addPropertyControls(RechittaLanguages, {
  headline: { type: ControlType.String, title: "Headline", defaultValue: "She speaks\nyour language." },
  subheadline: { type: ControlType.String, title: "Eyebrow", defaultValue: "MULTILINGUAL BY DESIGN" },
  body: { type: ControlType.String, title: "Body", defaultValue: "Russian, Arabic, Hindi, Mandarin, English — and counting. Rechitta answers in the language your investor thinks in. Mid-conversation. No switching. No delay." },
  ctaLabel: { type: ControlType.String, title: "CTA Label", defaultValue: "How it works →" },
  ctaHref:  { type: ControlType.String, title: "CTA Link",  defaultValue: "#" },
})
