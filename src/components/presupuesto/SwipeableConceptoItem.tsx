import React, { useState, useRef, useEffect } from 'react'
import { Trash2, ArrowLeft } from 'lucide-react'

interface SwipeableConceptoItemProps {
  id?: string
  index?: number
  onDelete: () => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

export const SwipeableConceptoItem: React.FC<SwipeableConceptoItemProps> = ({
  onDelete,
  disabled = false,
  children,
  className = ''
}) => {
  const [offset, setOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isHorizontalGesture = useRef(false)
  const wheelAccumulator = useRef(0)
  const wheelTimer = useRef<any>(null)
  const pointerStartX = useRef(0)
  const isPointerDown = useRef(false)

  // Trigger smooth delete animation and callback
  const executeDelete = () => {
    if (disabled || isDeleting) return
    setIsDeleting(true)
    setOffset(-500)
    setTimeout(() => {
      onDelete()
    }, 220)
  }

  // Handle trackpad / mouse horizontal wheel scroll (de derecha a izquierda)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (disabled || isDeleting) return

    // Detect if this is a horizontal/lateral scroll
    const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
    if (isHorizontal && Math.abs(e.deltaX) > 10) {
      // Lateral scroll from right to left produces positive deltaX in standard DOM wheel events
      if (e.deltaX > 0) {
        wheelAccumulator.current += e.deltaX
        const currentDisplacement = Math.max(-130, -wheelAccumulator.current)
        setOffset(currentDisplacement)

        if (wheelTimer.current) clearTimeout(wheelTimer.current)

        // Threshold reached for lateral scroll
        if (wheelAccumulator.current > 65) {
          executeDelete()
          wheelAccumulator.current = 0
        } else {
          // Snap back if user stopped scrolling before threshold
          wheelTimer.current = setTimeout(() => {
            wheelAccumulator.current = 0
            setOffset(0)
          }, 350)
        }
      } else if (e.deltaX < -5) {
        // Scrolling back right cancels swipe
        wheelAccumulator.current = 0
        setOffset(0)
      }
    }
  }

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || isDeleting) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isHorizontalGesture.current = false
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwiping || disabled || isDeleting) return
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = currentX - touchStartX.current
    const diffY = currentY - touchStartY.current

    // Decide if it's horizontal or vertical
    if (!isHorizontalGesture.current) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
          isHorizontalGesture.current = true
        } else {
          setIsSwiping(false)
          return
        }
      }
    }

    if (isHorizontalGesture.current) {
      if (diffX < 0) {
        // Swipe from right to left
        const tensionOffset = Math.max(-150, diffX)
        setOffset(tensionOffset)
      } else {
        setOffset(0)
      }
    }
  }

  const handleTouchEnd = () => {
    if (!isSwiping || disabled || isDeleting) return
    setIsSwiping(false)
    if (offset < -65) {
      executeDelete()
    } else {
      setOffset(0)
    }
    isHorizontalGesture.current = false
  }

  // Pointer drag support (for mouse click-drag from right to left)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || isDeleting) return
    // Don't start drag on inputs, buttons, or select
    const target = e.target as HTMLElement
    if (['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(target.tagName)) {
      return
    }
    pointerStartX.current = e.clientX
    isPointerDown.current = true
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown.current || disabled || isDeleting) return
    const diffX = e.clientX - pointerStartX.current
    if (diffX < -15) {
      const tensionOffset = Math.max(-150, diffX)
      setOffset(tensionOffset)
    } else if (diffX >= 0 && offset < 0) {
      setOffset(0)
    }
  }

  const handlePointerUp = () => {
    if (!isPointerDown.current) return
    isPointerDown.current = false
    if (offset < -65) {
      executeDelete()
    } else {
      setOffset(0)
    }
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (wheelTimer.current) clearTimeout(wheelTimer.current)
    }
  }, [])

  const isPastThreshold = offset < -65

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative overflow-hidden rounded-xl group select-none touch-pan-y"
      title="Desliza o haz scroll lateral de derecha a izquierda para eliminar esta línea"
    >
      {/* Background layer revealed on swipe: Red delete indicator */}
      <div
        className={`absolute inset-0 bg-gradient-to-l from-rose-600 via-rose-600 to-rose-700 rounded-xl flex items-center justify-end px-5 gap-2.5 text-white font-bold transition-all duration-150 ${
          offset < -10 ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      >
        <span className="text-xs font-bold tracking-wide flex items-center gap-1.5 uppercase">
          <ArrowLeft className="w-3.5 h-3.5 animate-pulse" />
          {isPastThreshold ? 'Soltar para eliminar' : 'Deslizar para borrar'}
        </span>
        <div className={`p-1.5 rounded-lg bg-rose-800/80 shadow-xs transition-transform ${isPastThreshold ? 'scale-125 ring-2 ring-white/50' : 'scale-100'}`}>
          <Trash2 className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Foreground sliding container */}
      <div
        className={`relative z-10 w-full rounded-xl transition-all ${className}`}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isSwiping || isPointerDown.current
            ? 'none'
            : 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease-out',
          opacity: isDeleting ? 0 : 1
        }}
      >
        {children}
      </div>
    </div>
  )
}
