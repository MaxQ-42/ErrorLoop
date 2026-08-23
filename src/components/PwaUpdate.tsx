import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

export function PwaUpdate() {
  const [update, setUpdate] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null)
  useEffect(() => {
    const updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() { setUpdate(() => updateServiceWorker) },
      onRegisterError(error) { console.error('[ErrorLoop] Service Worker registration failed', error) },
    })
  }, [])
  if (!update) return null
  return <button className="pwa-update" onClick={() => void update(true)}>发现新版本，立即更新</button>
}
