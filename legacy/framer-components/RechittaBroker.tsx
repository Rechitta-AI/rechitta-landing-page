/**
 * RechittaBroker — For Brokers section
 *
 * HOW TO USE IN FRAMER:
 * 1. Add as Code Component, W = 100%, H = fit content
 * 2. Place after RechittaDeveloper
 * 3. The orb moves from right → left through this section
 */

import { addPropertyControls, ControlType } from "framer"
import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"

const ease = [0.16, 1, 0.3, 1] as const

const DEFAULT_POINTS = [
  { label: "Share the link",          sub: "Send Rechitta to any prospect — in any language, before the viewing." },
  { label: "She handles every question", sub: "Payment plans, yields, comparisons — answered in seconds." },
  { label: "You arrive to a decided buyer", sub: "No more repeat briefings. The deal is half-done before you meet." },
]

interface Props {
  headline?: string
  body?: string
  ctaLabel?: string
  ctaHref?: string
  width?: number
  height?: number
  style?: React.CSSProperties
}

export default function RechittaBroker({
  headline = "Send the link.\nClose the deal.",
  body = "Share Rechitta with any prospect. She answers every question in their language before the viewing. You arrive to a client who's already decided.",
  ctaLabel = "See it for brokers →",
  ctaHref = "#",
}: Props) {
  const ref = useRef<HTMLElement>(null!)
  const inView = useInView(ref, { amount: 0.2, once: true })
  const [ctaHovered, setCtaHovered] = useState(false)

  const headlineParts = headline.split("\n")

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
      {/* Subtle blue tint on left side — orb passes through from right to left */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "40%",
        background: "radial-gradient(ellipse at 20% 50%, rgba(61,111,245,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        paddingLeft:  "clamp(24px, 6vw, 96px)",
        paddingRight: "clamp(24px, 6vw, 96px)",
        paddingTop:   "clamp(80px, 12vw, 160px)",
        paddingBottom:"clamp(80px, 12vw, 160px)",
        display: "flex", alignItems: "center",
        gap: "clamp(48px, 6vw, 100px)",
        flexWrap: "wrap",
        position: "relative", zIndex: 6,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          style={{ flex: "1 1 360px" }}
        >
          {/* Eyebrow */}
          <p style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 11, fontWeight: 500, letterSpacing: "0.10em",
            textTransform: "uppercase", color: "#535350", marginBottom: 20,
          }}>FOR BROKERS</p>

          {/* Headline */}
          <div style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: "clamp(28px, 4vw, 56px)",
            fontWeight: 400, letterSpacing: "-0.025em",
            color: "#FAFAF9", lineHeight: 1.1, marginBottom: 24,
          }}>
            {headlineParts[0]}<br />
            {headlineParts[1] ? <em>{headlineParts[1]}</em> : null}
          </div>

          {/* Body */}
          <p style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 16, lineHeight: "26px",
            color: "#A8A8A1", maxWidth: 400, marginBottom: 36,
          }}>{body}</p>

          {/* Bullet points */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
            {DEFAULT_POINTS.map((point, i) => (
              <motion.div
                key={point.label}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease }}
                style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
              >
                {/* Blue dot marker */}
                <div style={{
                  width: 6, height: 6,
                  borderRadius: "50%",
                  background: "#3D6FF5",
                  flexShrink: 0, marginTop: 8,
                }} />
                <div>
                  <div style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 14, fontWeight: 600, color: "#F4F4F2", marginBottom: 3,
                  }}>{point.label}</div>
                  <div style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 13, color: "#7A7A72", lineHeight: "20px",
                  }}>{point.sub}</div>
                </div>
              </motion.div>
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

RechittaBroker.defaultProps = {
  headline: "Send the link.\nClose the deal.",
  body: "Share Rechitta with any prospect. She answers every question in their language before the viewing. You arrive to a client who's already decided.",
  ctaLabel: "See it for brokers →",
  ctaHref: "#",
}

addPropertyControls(RechittaBroker, {
  headline: { type: ControlType.String, title: "Headline", defaultValue: "Send the link.\nClose the deal." },
  body: { type: ControlType.String, title: "Body", defaultValue: "Share Rechitta with any prospect. She answers every question in their language before the viewing. You arrive to a client who's already decided." },
  ctaLabel: { type: ControlType.String, title: "CTA Label", defaultValue: "See it for brokers →" },
  ctaHref:  { type: ControlType.String, title: "CTA Link",  defaultValue: "#" },
})
