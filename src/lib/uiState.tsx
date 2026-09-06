import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { UIStateContext } from './uiStateContext'

export function UIStateProvider({ children }: { children: ReactNode }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [footerVisible, setFooterVisible] = useState(false)
  const headerHoverRef = useRef(false)
  const footerHoverRef = useRef(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    const sync = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const inApiFullscreen = !!document.fullscreenElement
        const isDesktop = window.matchMedia('(pointer: fine)').matches
        const fillsScreen =
          isDesktop &&
          window.outerWidth <= window.screen.width &&
          window.outerHeight <= window.screen.height &&
          Math.abs(window.screen.width - window.innerWidth) <= 2 &&
          Math.abs(window.screen.height - window.innerHeight) <= 2
        setIsFullscreen(inApiFullscreen || fillsScreen)
      }, 30)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11' || e.key === 'Escape') sync()
    }

    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync as EventListener)
    window.addEventListener('resize', sync)
    window.addEventListener('keydown', onKeyDown)
    sync()
    return () => {
      clearTimeout(timer)
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync as EventListener)
      window.removeEventListener('resize', sync)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (window.innerWidth < 1024) return

    let hideTimer: ReturnType<typeof setTimeout>
    function handleMouseMove(e: MouseEvent) {
      const y = e.clientY
      const h = window.innerHeight
      clearTimeout(hideTimer)
      if (y < 50) {
        setHeaderVisible(true)
      } else if (y > h - 50) {
        setFooterVisible(true)
      } else if (y > 120 && y < h - 120) {
        hideTimer = setTimeout(() => {
          if (!headerHoverRef.current && !footerHoverRef.current) {
            setHeaderVisible(false)
            setFooterVisible(false)
          }
        }, 400)
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(hideTimer)
    }
  }, [])

  const enterFullscreen = useCallback(() => {
    const el = document.documentElement as any
    const req = el.requestFullscreen || el.webkitRequestFullscreen
    if (req) req.call(el).then(() => setIsFullscreen(true)).catch(() => {})
  }, [])

  const exitFullscreen = useCallback(() => {
    const exit = document.exitFullscreen || (document as any).webkitExitFullscreen
    if (exit) {
      exit.call(document).then(() => setIsFullscreen(false)).catch(() => {})
    } else {
      setIsFullscreen(false)
    }
  }, [])

  const setHeaderHover = useCallback((v: boolean) => {
    headerHoverRef.current = v
    if (v) setHeaderVisible(true)
  }, [])

  const setFooterHover = useCallback((v: boolean) => {
    footerHoverRef.current = v
    if (v) setFooterVisible(true)
  }, [])

  return (
    <UIStateContext.Provider value={{
      isFullscreen,
      enterFullscreen,
      exitFullscreen,
      headerVisible,
      footerVisible,
      setHeaderHover,
      setFooterHover,
      avatarState: 'idle',
      setAvatarState: () => {},
    }}>
      {children}
    </UIStateContext.Provider>
  )
}
