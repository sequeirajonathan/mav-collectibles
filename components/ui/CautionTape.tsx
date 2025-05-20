// components/Conveyor.tsx
import { motion } from 'framer-motion'
import React from 'react'

interface CautionTapeProps {
  text: string
  position?: 'top' | 'bottom'
  offset?: number // px offset from top or bottom
  height?: string // CSS height value, e.g., '4rem' or '64px'
}

const DEFAULT_REPEAT = 30
const DEFAULT_DURATION = 40

const CautionTape: React.FC<CautionTapeProps> = ({
  text,
  position = 'top',
  offset = 48,
  height = '4rem',
}) => {
  // Build our repeated text
  const spacer = '\u00A0\u00A0\u00A0\u00A0\u00A0'
  const content = Array(DEFAULT_REPEAT).fill(text).join(spacer)
  const duplicatedContent = content + content

  // Outer container gets the stripes
  const stripeStyle: React.CSSProperties = {
    pointerEvents: 'none',
    height,
    [position]: offset,
    left: 0,
    width: '100%',
    zIndex: 50,
    backgroundColor: '#FFD600', // yellow base
    backgroundImage:
      'repeating-linear-gradient(45deg, ' +
        '#000 0px, ' +        // black from 0
        '#000 24px, ' +       // to 24px
        'transparent 24px, ' +// then transparent
        'transparent 48px' +  // gap to 48px
      ')',
    boxSizing: 'border-box',
  }

  // The solid "window" behind the text:
  const windowStyle: React.CSSProperties = {
    position: 'absolute',
    top: `calc((${height} - 2rem) / 2)`, // center a 2rem-high window
    left: 0,
    width: '100%',
    height: '2rem',
    backgroundColor: '#FFD600',
    pointerEvents: 'none',
    zIndex: 1,          // above stripes, below text
  }

  // Text itself:
  const textStyle: React.CSSProperties = {
    zIndex: 2,          // above the solid window
    textShadow: '2px 2px 4px #FFD600, 2px 2px 0 #000',
    lineHeight: height,
  }

  return (
    <div className="fixed overflow-hidden font-impact" style={stripeStyle}>
      {/* Relative wrapper so our absolute children are scoped here */}
      <div className="relative w-full h-full">
        {/* Solid middle window */}
        <div style={windowStyle} />

        {/* Scrolling text */}
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
