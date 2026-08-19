/**
 * RechittaInvestor — Investor Finale section
 *
 * HOW TO USE IN FRAMER:
 * 1. Add as Code Component, W = 100%, H = fit content
 * 2. Place after RechittaBroker (last content section before Footer)
 * 3. The orb returns to centre here and scales up
 *
 * NOTE: Add Playfair Display + Inter via Framer Project Settings → Fonts
 */

import { addPropertyControls, ControlType } from "framer"
import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"

const ease = [0.16, 1, 0.3, 1] as const

// Brand R icon — inline so no external asset needed
const BRAND_ICON = (
  <svg viewBox="0 0 25 22" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <path
      d="M14.9762 12.3117H14.9397C18.3385 12.3117 21.0924 9.55618 21.0924 6.15905C21.094 2.76027 18.3385 0.00476074 14.9397 0.00476074H0.0331589L12.1876 12.3117H0L9.24967 21.5232H24.2126L14.9762 12.3117Z"
      fill="white"
    />
  </svg>
)

// Waveform bars — CSS animation defined inline via <style>
function WaveformBars() {
  const heights = [8, 14, 10, 16, 12, 6, 14]
  const delays  = [0, 80, 160, 240, 320, 400, 480]
  return (
    <>
      <style>{`
        @keyframes rechittaWaveBar {
          0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
          50%       { transform: scaleY(1.0); opacity: 1.0; }
        }
        .rechitta-wave-bar {
          width: 3px;
          border-radius: 2px;
          background: #FAFAF9;
          animation: rechittaWaveBar 1s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
      {heights.map((h, i) => (
        <div
          key={i}
          className="rechitta-wave-bar"
          style={{ height: h, animationDelay: `${delays[i]}ms` }}
        />
      ))}
    </>
  )
}

interface Props {
  headline?: string
  body?: string
  ctaLabel?: string
  ctaHref?: string
  learnMoreHref?: string
  propertyLocation?: string
  propertyPrice?: string
  propertyService?: string
  propertyDeveloper?: string
  propertyHandover?: string
  curatorQuote?: string
  chip1?: string
  chip2?: string
  width?: number
  height?: number
  style?: React.CSSProperties
}

export default function RechittaInvestor({
  headline = "Your private property curator.\nAvailable now.",
  body = "Ask Rechitta about any Dubai property. Compare, understand, decide — in your language, on your schedule.",
  ctaLabel = "Experience it yourself →",
  ctaHref = "#",
  learnMoreHref = "#",
  propertyLocation = "Dubai Hills",
  propertyPrice = "AED 2,100,000",
  propertyService = "AED 14/sqft",
  propertyDeveloper = "Emaar",
  propertyHandover = "Q2 2026",
  curatorQuote = "I've curated the most exclusive availability in this district.",
  chip1 = "What's the payment plan?",
  chip2 = "How does this compare?",
}: Props) {
  const ref = useRef<HTMLElement>(null!)
  const inView = useInView(ref, { amount: 0.15, once: true })
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
      <div style={{
        paddingLeft:  "clamp(24px, 6vw, 96px)",
        paddingRight: "clamp(24px, 6vw, 96px)",
        paddingTop:   "clamp(80px, 12vw, 160px)",
        paddingBottom:"clamp(80px, 12vw, 160px)",
        position: "relative", zIndex: 6,
      }}>

        {/* ── Headline block — centred ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <p style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 11, fontWeight: 500, letterSpacing: "0.10em",
            textTransform: "uppercase", color: "#535350", marginBottom: 16,
          }}>FOR INVESTORS</p>

          <div style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: "clamp(30px, 4.5vw, 64px)",
            fontWeight: 400, letterSpacing: "-0.025em",
            color: "#FAFAF9", lineHeight: 1.1, marginBottom: 20,
          }}>
            {headlineParts[0] ? (
              <>
                {/* Italicise "private" mid-sentence */}
                {headlineParts[0].includes("private") ? (
                  <>
                    Your <em>private</em> property curator.
                  </>
                ) : headlineParts[0]}
              </>
            ) : null}
            {headlineParts[1] ? <><br />{headlineParts[1]}</> : null}
          </div>

          <p style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 17, color: "#A8A8A1",
            maxWidth: 440, margin: "0 auto",
            lineHeight: "1.6",
          }}>{body}</p>
        </motion.div>

        {/* ── Glass phone frame ── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease }}
          style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            marginBottom: 52,
          }}
        >
          {/* Phone shell */}
          <div style={{
            width: "clamp(260px, 90%, 340px)",
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 24,
            overflow: "hidden",
            position: "relative", zIndex: 7,
          }}>

            {/* Status bar */}
            <div style={{
              padding: "12px 16px 8px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "rgba(255,255,255,0.04)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
              {/* Brand R icon */}
              <div style={{ width: 16, height: 14 }}>{BRAND_ICON}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 12, color: "#FAFAF9", fontWeight: 600,
                }}>EN</span>
                <span style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 12, color: "#7A7A72",
                }}>▾</span>
              </div>
            </div>

            {/* Property image placeholder */}
            <div style={{
              background: "linear-gradient(135deg, #1A1A18 0%, #252520 100%)",
              height: 140, position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, rgba(10,10,9,0) 40%, rgba(10,10,9,0.8) 100%)",
              }} />
              {/* Live badge */}
              <div style={{
                position: "absolute", top: 10, left: 12,
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(61,111,245,0.15)",
                border: "1px solid rgba(61,111,245,0.3)",
                borderRadius: 9999, padding: "3px 10px",
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: "50%", background: "#3D6FF5",
                  animation: "rechittaLivePulse 2s ease-in-out infinite",
                }} />
                <span style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 10, fontWeight: 600, color: "#3D6FF5",
                  letterSpacing: "0.06em",
                }}>Live</span>
              </div>
              {/* Location + tag */}
              <div style={{
                position: "absolute", bottom: 10, left: 12, right: 12,
                display: "flex", justifyContent: "space-between", alignItems: "flex-end",
              }}>
                <span style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 11, color: "#D2D2CD",
                }}>📍 {propertyLocation}</span>
                <span style={{
                  background: "#C5A572", color: "#0A0A09",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 10, fontWeight: 600,
                  padding: "2px 8px", borderRadius: 9999,
                }}>{propertyHandover}</span>
              </div>
            </div>

            {/* Curator quote */}
            <div style={{ padding: "14px 16px 0" }}>
              <div style={{ height: 1, background: "rgba(197,165,114,0.25)", marginBottom: 10 }} />
              <p style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: "italic", fontSize: 14, lineHeight: "22px",
                color: "#F4F4F2",
              }}>
                ❝ {curatorQuote} ❞
              </p>
              <div style={{ height: 1, background: "rgba(197,165,114,0.25)", marginTop: 10 }} />
            </div>

            {/* Voice / waveform pill */}
            <div style={{ padding: "10px 16px" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                height: 44, padding: "0 20px",
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 9999, width: "100%", justifyContent: "center",
              }}>
                {/* Animated waveform bars */}
                <div style={{ display: "flex", alignItems: "center", gap: 3, height: 20 }}>
                  {inView ? <WaveformBars /> : (
                    <span style={{
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontSize: 14, color: "#FAFAF9",
                    }}>▶</span>
                  )}
                </div>
                <span style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 14, color: "#FAFAF9", fontWeight: 500,
                }}>Hear Rechitta</span>
              </div>
            </div>

            {/* Property details grid */}
            <div style={{
              padding: "10px 16px",
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}>
              {[
                { label: "From",      value: propertyPrice },
                { label: "Svc",       value: propertyService },
                { label: "Developer", value: propertyDeveloper },
                { label: "Handover",  value: propertyHandover },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 10, color: "#535350", marginBottom: 2,
                  }}>{label}</p>
                  <p style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 12, fontWeight: 600, color: "#FAFAF9",
                  }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Question chips */}
            <div style={{ padding: "6px 16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
              {[chip1, chip2].map((q, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.5 + i * 0.12, ease }}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 9999, padding: "8px 14px",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 13, color: "#D2D2CD",
                  }}
                >{q}</motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3, ease }}
          style={{ textAlign: "center" }}
        >
          <motion.a
            href={ctaHref}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              height: 56, padding: "0 48px",
              background: ctaHovered ? "#FFFFFF" : "#FAFAF9",
              color: "#0A0A09",
              border: "none", borderRadius: 9999,
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 16, fontWeight: 600, textDecoration: "none",
              transition: "background 150ms",
            }}
          >{ctaLabel}</motion.a>

          <p style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 13, color: "#3A3A38",
            marginTop: 16,
          }}>
            Live now for investors ·{" "}
            <a href={learnMoreHref} style={{
              color: "#535350", textDecoration: "underline",
              textUnderlineOffset: 3,
            }}>Read more about the investor experience →</a>
          </p>
        </motion.div>
      </div>

      {/* Live dot pulse keyframe */}
      <style>{`
        @keyframes rechittaLivePulse {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50%       { opacity: 1.0; transform: scale(1.1); }
        }
      `}</style>
    </section>
  )
}

RechittaInvestor.defaultProps = {
  headline: "Your private property curator.\nAvailable now.",
  body: "Ask Rechitta about any Dubai property. Compare, understand, decide — in your language, on your schedule.",
  ctaLabel: "Experience it yourself →",
  ctaHref: "#",
  learnMoreHref: "#",
  propertyLocation: "Dubai Hills",
  propertyPrice: "AED 2,100,000",
  propertyService: "AED 14/sqft",
  propertyDeveloper: "Emaar",
  propertyHandover: "Q2 2026",
  curatorQuote: "I've curated the most exclusive availability in this district.",
  chip1: "What's the payment plan?",
  chip2: "How does this compare?",
}

addPropertyControls(RechittaInvestor, {
  headline:         { type: ControlType.String, title: "Headline",        defaultValue: "Your private property curator.\nAvailable now." },
  body:             { type: ControlType.String, title: "Body",            defaultValue: "Ask Rechitta about any Dubai property. Compare, understand, decide — in your language, on your schedule." },
  ctaLabel:         { type: ControlType.String, title: "CTA Label",       defaultValue: "Experience it yourself →" },
  ctaHref:          { type: ControlType.String, title: "CTA Link",        defaultValue: "#" },
  learnMoreHref:    { type: ControlType.String, title: "Learn More Link", defaultValue: "#" },
  propertyLocation: { type: ControlType.String, title: "Location",        defaultValue: "Dubai Hills" },
  propertyPrice:    { type: ControlType.String, title: "Price",           defaultValue: "AED 2,100,000" },
  propertyService:  { type: ControlType.String, title: "Service Charge",  defaultValue: "AED 14/sqft" },
  propertyDeveloper:{ type: ControlType.String, title: "Developer",       defaultValue: "Emaar" },
  propertyHandover: { type: ControlType.String, title: "Handover",        defaultValue: "Q2 2026" },
  curatorQuote:     { type: ControlType.String, title: "Curator Quote",   defaultValue: "I've curated the most exclusive availability in this district." },
  chip1:            { type: ControlType.String, title: "Chip 1",          defaultValue: "What's the payment plan?" },
  chip2:            { type: ControlType.String, title: "Chip 2",          defaultValue: "How does this compare?" },
})
