/**
 * RechittaOrb — Fixed scroll-driven Spline orb
 *
 * HOW TO USE IN FRAMER:
 * 1. Add this as a Code Component
 * 2. Place on canvas, set Position → "Fixed" in the right panel
 * 3. Set W = 100vw, H = 100vh, Pin to all 4 edges
 * 4. Set z-index to 2 (sections should be 6–8)
 * 5. Enable "Pointer Events → None" in Framer's layer settings
 */

import { addPropertyControls, ControlType } from "framer"
import { motion, useScroll, useTransform, useMotionTemplate } from "framer-motion"

const BRAND_ICON = (
  <svg viewBox="0 0 25 22" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <path
      d="M14.9762 12.3117H14.9397C18.3385 12.3117 21.0924 9.55618 21.0924 6.15905C21.094 2.76027 18.3385 0.00476074 14.9397 0.00476074H0.0331589L12.1876 12.3117H0L9.24967 21.5232H24.2126L14.9762 12.3117Z"
      fill="white"
    />
  </svg>
)

interface Props {
  splineUrl?: string
  orbSize?: string
  iconSize?: number
  style?: React.CSSProperties
  width?: number
  height?: number
}

export default function RechittaOrb({
  splineUrl = "https://my.spline.design/meeet-K190VICHbClCgQyBKYguhj6F/",
  orbSize = "clamp(280px, 40vw, 520px)",
  iconSize = 7,
}: Props) {
  const { scrollYProgress } = useScroll()

  // ── Colour: greyscale → full colour in first 19% of page ──
  const grayscale  = useTransform(scrollYProgress, [0, 0.19], [1, 0])
  const brightness = useTransform(scrollYProgress, [0, 0.19], [0.78, 1])
  const orbFilter  = useMotionTemplate`grayscale(${grayscale}) brightness(${brightness})`

  // ── X: centre → right (languages/developer) → left (broker) → centre (investor) ──
  const orbX = useTransform(
    scrollYProgress,
    [0,    0.46,   0.54,   0.66,   0.71,   0.77,    0.83,    0.92,  1.0],
    ["0vw","0vw","26vw","26vw","26vw","-26vw","-26vw","0vw","0vw"]
  )

  // ── Y: upper hero → settle lower for investor ──
  const orbY = useTransform(
    scrollYProgress,
    [0,       0.46,    0.50,   0.77,   0.90,  1.0],
    ["-16vh","-16vh", "-4vh", "-4vh",  "6vh", "10vh"]
  )

  // ── Scale: large hero → compact mid → grows for investor ──
  const orbScale = useTransform(
    scrollYProgress,
    [0,   0.46, 0.54, 0.77, 0.90, 1.0],
    [1.0, 0.86, 0.60, 0.60, 0.94, 1.22]
  )

  // ── Opacity: slight fade mid-sections ──
  const orbOpacity = useTransform(
    scrollYProgress,
    [0,   0.46, 0.50, 0.77, 0.95, 1.0],
    [1.0, 1.0,  0.70, 0.70, 0.55, 0.52]
  )

  return (
    <motion.div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      <motion.div style={{ x: orbX, y: orbY, scale: orbScale, opacity: orbOpacity }}>
        <motion.div style={{ filter: orbFilter }}>
          <div
            style={{
              position: "relative",
              width: orbSize,
              height: orbSize,
            }}
          >
            {/* mix-blend-mode:screen dissolves the Spline iframe dark bg */}
            <div style={{ mixBlendMode: "screen", position: "absolute", inset: 0 }}>
              <iframe
                src={splineUrl}
                title="Rechitta orb"
                allow="autoplay"
                style={{
                  position: "absolute",
                  top: "-25%",
                  left: "-25%",
                  width: "150%",
                  height: "150%",
                  border: "none",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Brand R icon centred on orb */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: `${iconSize}vw`,
                minWidth: 44,
                maxWidth: 80,
                height: "auto",
                pointerEvents: "none",
                userSelect: "none",
                opacity: 0.95,
              }}
            >
              {BRAND_ICON}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

RechittaOrb.defaultProps = {
  splineUrl: "https://my.spline.design/meeet-K190VICHbClCgQyBKYguhj6F/",
  orbSize: "clamp(280px, 40vw, 520px)",
  iconSize: 7,
}

addPropertyControls(RechittaOrb, {
  splineUrl: {
    type: ControlType.String,
    title: "Spline URL",
    defaultValue: "https://my.spline.design/meeet-K190VICHbClCgQyBKYguhj6F/",
  },
  orbSize: { type: ControlType.String, title: "Orb Size", defaultValue: "clamp(280px, 40vw, 520px)" },
  iconSize: {
    type: ControlType.Number,
    title: "Icon Size (vw)",
    defaultValue: 7,
    min: 2,
    max: 20,
    step: 0.5,
  },
})
