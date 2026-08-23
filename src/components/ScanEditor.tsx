import { ArrowLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import './ScanEditor.css'
import type { CropPoint, ImageAsset, ImageMode } from '../types'
import { detectDocument, fullPoints, preloadScanEngine, renderPerspectiveScan, retryScanEngine } from '../services/scanner'

type Props = { asset: ImageAsset; onSave: (asset: ImageAsset) => void; onClose: () => void }
type EngineState = 'idle' | 'loading' | 'ready' | 'failed'

export function ScanEditor({ asset, onSave, onClose }: Props) {
  const [points, setPoints] = useState<CropPoint[]>(asset.cropPoints?.length === 4 ? asset.cropPoints : fullPoints())
  const [mode, setMode] = useState<ImageMode>(asset.mode)
  const [busy, setBusy] = useState(false)
  const [engineState, setEngineState] = useState<EngineState>('idle')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const image = useRef<HTMLImageElement>(null)
  const dragging = useRef<number | null>(null)

  const autoDetect = async () => {
    setBusy(true); setError(''); setEngineState('loading'); setStatus('正在加载扫描组件…')
    try {
      await nextPaint()
      await preloadScanEngine()
      setEngineState('ready')
      setStatus('正在自动检测纸张边缘…')
      const detected = await detectDocument(asset.original)
      if (detected) setPoints(detected)
      else setError('未检测到可靠边缘，已保留整张图片，可手动调整四角。')
    } catch {
      setEngineState('failed')
      setError('扫描组件加载失败，请检查网络后重试。你仍可保存原图。')
    } finally {
      setBusy(false); setStatus('')
    }
  }

  useEffect(() => { void autoDetect() }, [])

  const movePoint = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragging.current === null || !image.current) return
    const rect = image.current.getBoundingClientRect()
    const x = clamp((event.clientX - rect.left) / rect.width)
    const y = clamp((event.clientY - rect.top) / rect.height)
    setPoints((current) => current.map((point, index) => index === dragging.current ? { x, y } : point))
  }

  const saveScan = async () => {
    setBusy(true); setStatus('正在进行透视扫描…'); setError('')
    try {
      const scanned = await renderPerspectiveScan(asset.original, points, mode)
      onSave({ ...asset, cropPoints: points, mode, scanned })
    } catch (reason) {
      setEngineState('failed')
      setError(reason instanceof Error ? reason.message : '扫描组件加载失败，请检查网络后重试。')
    } finally {
      setBusy(false); setStatus('')
    }
  }

  return <div className="scanner">
    <header>
      <button className="icon-btn" aria-label="返回上一页" onClick={onClose}><ArrowLeft /></button>
      <strong>扫描调整</strong>
      <button onClick={() => setPoints(fullPoints())}>重置</button>
    </header>
    <div className="scan-stage">
      <div className="scan-image-frame">
        <img ref={image} src={asset.original} alt="待扫描的原始图片" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" onPointerMove={movePoint} onPointerUp={() => { dragging.current = null }} onPointerCancel={() => { dragging.current = null }}>
          <polygon points={points.map((point) => `${point.x * 100},${point.y * 100}`).join(' ')} />
          {points.map((point, index) => <circle key={index} cx={point.x * 100} cy={point.y * 100} r="4" onPointerDown={(event) => {
            event.preventDefault(); dragging.current = index; event.currentTarget.setPointerCapture(event.pointerId)
          }} />)}
        </svg>
      </div>
    </div>
    <div className="scan-actions">
      <button disabled={busy} onClick={autoDetect}>自动检测</button>
      <button disabled={busy} onClick={() => setPoints(fullPoints())}>使用整张图片</button>
    </div>
    <div className="scan-actions modes">
      {([['original', '原图'], ['color', '彩色增强'], ['gray', '灰度文档']] as [ImageMode, string][]).map(([value, label]) => <button className={mode === value ? 'active' : ''} onClick={() => setMode(value)} key={value}>{label}</button>)}
    </div>
    {status && <p className="hint">{status}</p>}
    {error && <div className="error">{error}</div>}
    {engineState === 'failed' && <button className="retry-scan" disabled={busy} onClick={() => { retryScanEngine(); void autoDetect() }}>重新加载扫描组件</button>}
    <button className="save" disabled={busy || engineState === 'failed'} onClick={saveScan}>{busy ? '正在处理图片…' : '生成扫描并保存'}</button>
    <button className="scanner-fallback" onClick={() => onSave({ ...asset, cropPoints: fullPoints(), mode: 'original', scanned: asset.original })}>直接使用原图</button>
  </div>
}

function clamp(value: number) { return Math.min(1, Math.max(0, value)) }
function nextPaint() { return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))) }
