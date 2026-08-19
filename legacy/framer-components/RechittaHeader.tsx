/**
 * RechittaHeader — Fixed navigation bar
 *
 * HOW TO USE IN FRAMER:
 * 1. Add as Code Component
 * 2. Set Position → "Fixed", pin to top
 * 3. W = 100%, H = 72px, z-index = 50
 */

import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

const RECHITTA_WORDMARK = (
  <svg
    viewBox="0 0 114 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ height: 18, width: "auto" }}
  >
    <path d="M11.6321 11.8322L12.1643 11.7559C14.4689 11.1789 15.7737 9.20763 15.7737 6.02272C15.7737 1.29094 12.68 0.138672 7.64478 0.138672H0V21.5245H2.24486V12.9032H9.98414C11.9389 12.9032 13.5288 14.7021 13.5288 16.6551V21.5245H15.7969V16.6551C15.7969 13.825 14.2102 12.2433 11.6321 11.8338V11.8322ZM2.24652 2.07847H7.64644C11.2856 2.07847 13.5305 2.41171 13.5305 6.47699C13.5305 10.5423 11.2856 10.9054 7.64644 10.9054H2.24652V2.07847Z" fill="white"/>
    <path d="M25.3867 5.87036C21.1407 5.87036 18.3188 8.63084 18.3188 13.4836C18.3188 17.8822 20.6847 21.5214 25.569 21.5214C30.1798 21.5214 32.0002 18.6399 32.6369 15.9706H30.4218C29.8764 18.2154 28.2682 19.6711 25.5077 19.6711C22.1703 19.6711 20.5637 17.2439 20.4725 14.0905H32.7828V13.1802C32.7828 8.5695 29.694 5.87036 25.3867 5.87036ZM20.5024 12.3314C20.7444 9.42002 22.7174 7.72063 25.3552 7.72063C28.177 7.72063 30.3555 9.38852 30.5677 12.3314H20.5024Z" fill="white"/>
    <path d="M43.4946 7.78197C45.7096 7.78197 47.6809 8.78337 48.1352 11.8158H50.4099C50.0153 7.44707 46.2849 5.87036 43.4946 5.87036C38.6103 5.87036 35.8813 9.42002 35.8813 13.6959C35.8813 17.9717 38.612 21.5214 43.4946 21.5214C46.2849 21.5214 50.017 19.9447 50.4099 15.576H48.1352C47.6809 18.61 45.708 19.6097 43.4946 19.6097C39.8239 19.6097 38.1262 16.8791 38.1262 13.6942C38.1262 10.5093 39.8256 7.77866 43.4946 7.77866V7.78197Z" fill="white"/>
    <path d="M61.5395 6.17427C58.2336 6.17427 56.1098 7.87201 55.2908 10.664V0.157593H53.0459V21.5219H55.2908V14.9697C55.2908 10.9359 57.3831 8.08423 60.7819 8.08423C63.4512 8.08423 64.6648 9.35753 64.6648 12.4828V21.5219H66.9395V12.3004C66.9395 8.35779 64.9383 6.17262 61.5395 6.17262V6.17427Z" fill="white"/>
    <path d="M72.9386 0C71.846 0 70.9673 0.880369 70.9673 1.94145C70.9673 3.00254 71.8477 3.91275 72.9386 3.91275C74.0295 3.91275 74.9397 3.03404 74.9397 1.94145C74.9397 0.848868 74.0295 0 72.9386 0Z" fill="white"/>
    <path d="M72.7257 6.47729H69.5093V8.3889H72.2101V21.5231H74.2725V8.11534C74.2725 6.96307 73.7569 6.47729 72.7257 6.47729Z" fill="white"/>
    <path d="M82.6176 0.183716H80.3728V6.47064H77.0967V8.38225H80.3728V18.0962C80.3728 19.9928 81.913 21.5298 83.8097 21.5248L85.8341 21.5181V19.6065L84.0833 19.6264C83.2758 19.6331 82.6176 18.9798 82.6176 18.1724V8.38391H85.8341V6.4723H82.6176V0.183716Z" fill="white"/>
    <path d="M92.9858 0.183716H90.7409V6.47064H87.4648V8.38225H90.7409V18.0962C90.7409 19.9928 92.2812 21.5298 94.1779 21.5248L96.2022 21.5181V19.6065L94.4514 19.6264C93.644 19.6331 92.9858 18.9798 92.9858 18.1724V8.38391H96.2022V6.4723H92.9858V0.183716Z" fill="white"/>
    <path d="M111.574 19.308V12.6348C111.574 8.75187 109.481 5.87036 105.051 5.87036C101.168 5.87036 99.0759 8.17656 98.6813 11.4825H100.956C101.259 8.75187 102.897 7.75047 105.051 7.75047C107.903 7.75047 109.146 9.1763 109.329 12.1192L103.201 12.6961C99.7739 12.9995 98.3779 14.6674 98.3779 17.0333C98.3779 18.61 99.0146 21.523 103.353 21.523C106.963 21.523 108.753 19.6114 109.45 17.4892V19.4904C109.45 20.583 110.056 21.2196 111.179 21.2196H113.787V19.308H111.572H111.574ZM103.627 19.6413C101.747 19.6413 100.624 18.6399 100.624 16.7896C100.624 15.2427 101.594 14.6359 103.567 14.4535L109.33 13.8766C109.33 17.1527 107.085 19.6396 103.627 19.6396V19.6413Z" fill="white"/>
  </svg>
)

const NAV_LINKS = ["How it works", "Investors", "Insights"]

interface Props {
  ctaLabel?: string
  ctaHref?: string
  talkToHerHref?: string
  width?: number
  height?: number
  style?: React.CSSProperties
}

export default function RechittaHeader({ ctaLabel = "Book a demo", ctaHref = "#", talkToHerHref = "#" }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [talkHovered, setTalkHovered] = useState(false)
  const [bookHovered, setBookHovered] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: 72,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft:  "clamp(24px, 6vw, 96px)",
        paddingRight: "clamp(24px, 6vw, 96px)",
        background: scrolled ? "rgba(10,10,9,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(56,56,54,0.4)" : "none",
        transition: "background 400ms, border-color 400ms",
      }}
    >
      {/* Wordmark */}
      <a href="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
        {RECHITTA_WORDMARK}
      </a>

      {/* Desktop nav */}
      <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {NAV_LINKS.map(link => (
          <a
            key={link}
            href="#"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 14,
              color: "#A8A8A1",
              textDecoration: "none",
              transition: "color 120ms",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#F4F4F2")}
            onMouseLeave={e => (e.currentTarget.style.color = "#A8A8A1")}
          >
            {link}
          </a>
        ))}
      </nav>

      {/* CTAs */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <motion.a
          href={talkToHerHref}
          onMouseEnter={() => setTalkHovered(true)}
          onMouseLeave={() => setTalkHovered(false)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            height: 40, padding: "0 20px",
            background: "transparent",
            color: talkHovered ? "#F4F4F2" : "#A8A8A1",
            border: talkHovered ? "1px solid #6B6B68" : "1px solid #383836",
            borderRadius: 9999,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 13, fontWeight: 500, textDecoration: "none",
            transition: "color 150ms, border-color 150ms",
          }}
        >
          Talk to her
        </motion.a>
        <motion.a
          href={ctaHref}
          onMouseEnter={() => setBookHovered(true)}
          onMouseLeave={() => setBookHovered(false)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            height: 40, padding: "0 24px",
            background: bookHovered ? "#FFFFFF" : "#FAFAF9",
            color: "#0A0A09",
            border: "none", borderRadius: 9999,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
            transition: "background 150ms",
          }}
        >
          {ctaLabel}
        </motion.a>
      </div>
    </header>
  )
}

RechittaHeader.defaultProps = { ctaLabel: "Book a demo", ctaHref: "#", talkToHerHref: "#" }

addPropertyControls(RechittaHeader, {
  ctaLabel: {
    type: ControlType.String,
    title: "CTA Label",
    defaultValue: "Book a demo",
  },
  ctaHref: {
    type: ControlType.String,
    title: "CTA Link",
    defaultValue: "#",
  },
  talkToHerHref: {
    type: ControlType.String,
    title: "Talk Href",
    defaultValue: "#",
  },
})
