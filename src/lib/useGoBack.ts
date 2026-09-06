import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'

export function useGoBack(fallback: string = '/') {
  const navigate = useNavigate()

  return useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(fallback)
    }
  }, [navigate, fallback])
}
