import { motion } from 'framer-motion'
import React from 'react'

interface CautionTapeProps {
  text: string
  position?: 'top' | 'bottom'
  offset?: number    // px offset from top or bottom
  height?: string    // CSS height value, e.g. '4rem' or '64px'
}

const DEFAULT_REPEAT = 30
const DEFAULT_DURATION = 40

const CautionTape: React.FC<CautionTapeProps> = ({
  text,
  position = 'top',
  offset = 0,          // default to zero so tape sits flush
  height = '4rem',     // 4rem = 64px
}) => {
  // Build a long repeated string of “text” with small spaces in between
  const spacer = '\u00A0\u00A0\u00A0\u00A0\u00A0'
  const content = Array(DEFAULT_REPEAT).fill(text).join(spacer)
  const duplicatedContent = content + content

  // Outer container stripe (fixed, full width, striped background)
  const stripeStyle: React.CSSProperties = {
    pointerEvents: 'none',
    height,
    [position]: offset,   // if offset = 0, this sits flush
    left: 0,
    width: '100%',
    zIndex: 50,
    backgroundColor: '#FFD600',
    backgroundImage:
      'repeating-linear-gradient(45deg, ' +
        '#000 0px, ' +
        '#000 24px, ' +
        'transparent 24px, ' +
        'transparent 48px' +
      ')',
    boxSizing: 'border-box',
  }

  // A solid-yellow “window” behind the text so it doesn’t look cut off by the stripes
  const windowStyle: React.CSSProperties = {
    position: 'absolute',
    top: `calc((${height} - 2rem) / 2)`, // center a 2rem-high window inside a height of "height"
    left: 0,
    width: '100%',
    height: '2rem',
    backgroundColor: '#FFD600',
    pointerEvents: 'none',
    zIndex: 1,           // below the text but above the stripes
  }

  // The actual scrolling text
  const textStyle: React.CSSProperties = {
    zIndex: 2,
    textShadow: '2px 2px 4px #FFD600, 2px 2px 0 #000',
    lineHeight: height,
  }

  return (
    <div className="fixed overflow-hidden font-impact" style={stripeStyle}>
      <div className="relative w-full h-full">
        <div style={windowStyle} />

        <motion.div
          className="absolute whitespace-nowrap leading-[4rem] text-2xl md:text-3xl text-black"
          initial={{ x: 0 }}
          animate={{ x: '-50%' }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: DEFAULT_DURATION,
              ease: 'linear',
            },
          }}
          style={textStyle}
        >
          {duplicatedContent}
        </motion.div>
      </div>
    </div>
  )
}

export default CautionTape
