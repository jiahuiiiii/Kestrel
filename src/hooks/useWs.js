import { useEffect, useRef, useCallback } from 'react'
import { getAccessToken } from '../api/client'

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'

export function useWs(onMessage, enabled = true) {
  const ws = useRef(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    if (!enabled) return
    const token = getAccessToken()
    const url = token ? `${WS_BASE}?token=${token}` : WS_BASE
    ws.current = new WebSocket(url)

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        onMessageRef.current?.(data)
      } catch { }
    }

    ws.current.onclose = () => {
      if (enabled) setTimeout(connect, 3000)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      ws.current?.close()
      ws.current = null
      return
    }
    connect()
    return () => { ws.current?.close() }
  }, [connect, enabled])
}
