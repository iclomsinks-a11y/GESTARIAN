import React from 'react'

interface SevenSegmentClockProps {
  date: Date
}

// Mapa de segmentos activos para cada dígito del 0 al 9 (a, b, c, d, e, f, g)
const DIGIT_SEGMENTS: Record<string, string[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'e', 'd', 'c', 'g'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
}

// Coordenadas exactas para segmentos clásicos de calculadora (rayitas biseladas verticales sin inclinación)
const SEGMENT_PATHS: Record<string, string> = {
  a: 'M 10 5 L 44 5 L 38 12 L 16 12 Z',
  b: 'M 45 7 L 49 11 L 49 43 L 44 47 L 39 42 L 39 13 Z',
  c: 'M 44 49 L 49 53 L 49 85 L 45 89 L 39 83 L 39 54 Z',
  d: 'M 16 84 L 38 84 L 44 91 L 10 91 Z',
  e: 'M 9 49 L 15 54 L 15 83 L 9 89 L 5 85 L 5 53 Z',
  f: 'M 9 7 L 15 13 L 15 42 L 9 47 L 5 43 L 5 11 Z',
  g: 'M 10 48 L 15 44 L 39 44 L 44 48 L 39 52 L 15 52 Z',
}

const SegmentDigit: React.FC<{ char: string; sizeClass?: string }> = ({ char, sizeClass = 'w-7 sm:w-10 md:w-12 lg:w-14' }) => {
  const activeSegments = DIGIT_SEGMENTS[char] || []

  return (
    <svg
      viewBox="0 0 54 96"
      className={`${sizeClass} h-auto select-none pointer-events-none`}
      style={{
        filter: 'drop-shadow(0 0 10px rgba(254, 240, 138, 0.85)) drop-shadow(0 0 24px rgba(234, 179, 8, 0.45))',
      }}
      aria-label={char}
    >
      {Object.entries(SEGMENT_PATHS).map(([seg, pathData]) => {
        const isLit = activeSegments.includes(seg)
        return (
          <path
            key={seg}
            d={pathData}
            fill={isLit ? '#fffde7' : 'rgba(255, 253, 231, 0.07)'}
            style={{
              transition: 'fill 80ms ease-out',
            }}
          />
        )
      })}
    </svg>
  )
}

const SegmentColon: React.FC<{ sizeClass?: string }> = ({ sizeClass = 'w-2.5 sm:w-3.5 md:w-4.5 lg:w-5' }) => {
  return (
    <svg
      viewBox="0 0 18 96"
      className={`${sizeClass} h-auto select-none pointer-events-none mx-0.5 sm:mx-1`}
      style={{
        filter: 'drop-shadow(0 0 10px rgba(254, 240, 138, 0.85)) drop-shadow(0 0 24px rgba(234, 179, 8, 0.45))',
      }}
      aria-hidden="true"
    >
      <rect x="5" y="27" width="8" height="8" rx="1.5" fill="#fffde7" />
      <rect x="5" y="61" width="8" height="8" rx="1.5" fill="#fffde7" />
    </svg>
  )
}

export const SevenSegmentClock: React.FC<SevenSegmentClockProps> = ({ date }) => {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const hStr = pad(date.getHours())
  const mStr = pad(date.getMinutes())
  const sStr = pad(date.getSeconds())

  return (
    <div
      className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 select-none pointer-events-none"
      aria-label={`${hStr}:${mStr}:${sStr}`}
    >
      {/* Horas */}
      <SegmentDigit char={hStr[0]} />
      <SegmentDigit char={hStr[1]} />

      {/* Separador : */}
      <SegmentColon />

      {/* Minutos */}
      <SegmentDigit char={mStr[0]} />
      <SegmentDigit char={mStr[1]} />

      {/* Separador : */}
      <SegmentColon />

      {/* Segundos */}
      <SegmentDigit char={sStr[0]} />
      <SegmentDigit char={sStr[1]} />
    </div>
  )
}
