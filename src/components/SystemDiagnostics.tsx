import { useEffect, useState } from 'react'
import './SystemDiagnostics.css'
import { getLatestDiagnostic, runtimeDetails } from '../services/mobileDiagnostics'
import { getScanEngineState, testScanEngine } from '../services/scanner'

declare const __APP_VERSION__: string

type Values = Record<string, string | boolean | number | null>

export function SystemDiagnostics() {
  const [values, setValues] = useState<Values>({})
  const [result, setResult] = useState('')
  const refresh = async () => {
    const serviceWorker = 'serviceWorker' in navigator
      ? (navigator.serviceWorker.controller?.state || (await navigator.serviceWorker.getRegistration())?.active?.state || '未控制')
      : '不支持'
    const cacheState = 'caches' in window ? (await caches.keys()).join(', ') || '可用（暂无缓存）' : '不支持'
    const canvas = document.createElement('canvas')
    const webp = canvas.toDataURL('image/webp').startsWith('data:image/webp')
    const diagnostic = getLatestDiagnostic()
    setValues({
      Version: __APP_VERSION__,
      URL: location.href,
      UserAgent: navigator.userAgent,
      SecureContext: isSecureContext,
      Standalone: runtimeDetails().standalone,
      ServiceWorker: serviceWorker,
      Cache: cacheState,
      IndexedDB: typeof indexedDB !== 'undefined',
      StorageBackend: 'localStorage（Base64 图片）',
      LocalStorage: canUseLocalStorage(),
      Canvas: Boolean(canvas.getContext('2d')),
      CreateImageBitmap: typeof createImageBitmap === 'function',
      WebPEncode: webp,
      OpenCV: getScanEngineState().opencv,
      jscanify: getScanEngineState().jscanify,
      Scanner: getScanEngineState().scanner,
      LastStage: diagnostic.stage,
      LastError: diagnostic.error?.message || null,
    })
  }
  useEffect(() => { void refresh() }, [])
  const test = async () => {
    setResult('正在测试扫描组件…')
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      await testScanEngine()
      setResult('扫描组件可用：OpenCV、jscanify 与最小 Canvas 测试通过。')
    } catch {
      setResult('扫描组件测试失败。请检查网络后重试。详细信息已记录到 Console。')
    } finally { await refresh() }
  }
  return <section className="panel diagnostics">
    <h2>系统诊断</h2>
    <button className="primary" onClick={test}>测试扫描组件</button>
    <button className="diagnostic-refresh" onClick={() => void refresh()}>刷新状态</button>
    {result && <p className="hint">{result}</p>}
    <dl>{Object.entries(values).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value ?? '—')}</dd></div>)}</dl>
  </section>
}

function canUseLocalStorage() {
  try { const key = '__errorloop_probe__'; localStorage.setItem(key, '1'); localStorage.removeItem(key); return true } catch { return false }
}
