import { imageConfig } from '../config/imageConfig'
import type { CropPoint, ImageAsset, ImageMode } from '../types'
import { generateId } from '../utils/id'

const id = () => generateId('image')

export const fullPoints = (): CropPoint[] => [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
]

/** Store an unmodified compressed original. A scan is created only in ScanEditor. */
export async function makeAsset(file: File, _legacyMode?: ImageMode | number): Promise<ImageAsset> {
  void _legacyMode
  if (!imageConfig.accepted.includes(file.type)) throw new Error('仅支持 JPG、PNG 或 WebP 图片')
  if (file.size > imageConfig.maxFileSize) throw new Error('图片超过 20MB，请先压缩后上传')

  const original = await compressOriginal(file)
  return {
    id: id(), order: 0, original, scanned: original, mode: 'original', name: file.name,
    cropPoints: fullPoints(), rotation: 0,
  }
}

type ScanPoint = { x: number; y: number }
type ScanCorners = {
  topLeftCorner: ScanPoint; topRightCorner: ScanPoint
  bottomRightCorner: ScanPoint; bottomLeftCorner: ScanPoint
}
type ScannerInstance = {
  findPaperContour: (mat: unknown) => { delete?: () => void } | null
  getCornerPoints: (contour: unknown) => ScanCorners
  extractPaper: (image: HTMLImageElement, width: number, height: number, points: ScanCorners) => HTMLCanvasElement | null
}

/** Load OpenCV and jscanify only once a user opens the scanner. */
async function engine(): Promise<{ cv: any; scanner: ScannerInstance }> {
  const cvModule: any = await import('@techstark/opencv-js')
  const cv = await (cvModule.default ?? cvModule.cv ?? window.cv)
  // jscanify/client is a UMD module that resolves OpenCV through the browser
  // global name `cv`, so it must be assigned before importing jscanify.
  window.cv = cv
  const scannerModule: any = await import('jscanify/client')
  const Scanner = scannerModule.default ?? window.jscanify
  if (!cv?.Mat || typeof Scanner !== 'function') throw new Error('扫描组件加载失败')
  return { cv, scanner: new Scanner() }
}

export async function detectDocument(original: string): Promise<CropPoint[] | null> {
  const image = await loadImage(original)
  const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)

  const { cv, scanner } = await engine()
  let mat: any
  let contour: { delete?: () => void } | null = null
  try {
    mat = cv.imread(canvas)
    contour = scanner.findPaperContour(mat)
    if (!contour) return null
    const corners = scanner.getCornerPoints(contour)
    if (!hasCorners(corners)) return null
    return orderPoints([
      { x: corners.topLeftCorner.x / canvas.width, y: corners.topLeftCorner.y / canvas.height },
      { x: corners.topRightCorner.x / canvas.width, y: corners.topRightCorner.y / canvas.height },
      { x: corners.bottomRightCorner.x / canvas.width, y: corners.bottomRightCorner.y / canvas.height },
      { x: corners.bottomLeftCorner.x / canvas.width, y: corners.bottomLeftCorner.y / canvas.height },
    ])
  } finally {
    mat?.delete?.()
    contour?.delete?.()
    canvas.width = 1
    canvas.height = 1
  }
}

/** Four source points -> jscanify perspective correction -> ErrorLoop enhancement. */
export async function renderPerspectiveScan(original: string, normalizedPoints: CropPoint[], mode: ImageMode): Promise<string> {
  if (normalizedPoints.length !== 4) throw new Error('需要四个有效的裁切角点')
  const image = await loadImage(original)
  const points = orderPoints(normalizedPoints).map((point) => ({
    x: point.x * image.naturalWidth,
    y: point.y * image.naturalHeight,
  }))
  const outputWidth = averageDistance(points[0], points[1], points[2], points[3])
  const outputHeight = averageDistance(points[0], points[3], points[1], points[2])
  const scale = Math.min(1, imageConfig.scannedMaxEdge / Math.max(outputWidth, outputHeight))
  const canvas = await applyPerspectiveCorrection(
    image, points, Math.max(1, Math.round(outputWidth * scale)), Math.max(1, Math.round(outputHeight * scale)),
  )
  try {
    applyEnhancement(canvas, mode)
    return canvas.toDataURL('image/webp', imageConfig.scannedQuality)
  } finally {
    canvas.width = 1
    canvas.height = 1
  }
}

async function applyPerspectiveCorrection(image: HTMLImageElement, points: ScanPoint[], width: number, height: number) {
  const { scanner } = await engine()
  const canvas = scanner.extractPaper(image, width, height, {
    topLeftCorner: points[0], topRightCorner: points[1], bottomRightCorner: points[2], bottomLeftCorner: points[3],
  })
  if (!canvas) throw new Error('透视扫描失败')
  return canvas
}

/** ErrorLoop treatment, deliberately run after the perspective output is ready. */
function applyEnhancement(canvas: HTMLCanvasElement, mode: ImageMode) {
  if (mode === 'original') return
  const context = canvas.getContext('2d')!
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
  for (let index = 0; index < pixels.data.length; index += 4) {
    let red = pixels.data[index]
    let green = pixels.data[index + 1]
    let blue = pixels.data[index + 2]
    if (mode === 'gray') {
      const lightness = 0.299 * red + 0.587 * green + 0.114 * blue
      red = green = blue = clamp((lightness - 128) * 1.25 + 150, 0, 255)
    } else {
      red = clamp(red * 1.12 + 8, 0, 255)
      green = clamp(green * 1.12 + 8, 0, 255)
      blue = clamp(blue * 1.12 + 8, 0, 255)
    }
    pixels.data[index] = red
    pixels.data[index + 1] = green
    pixels.data[index + 2] = blue
  }
  context.putImageData(pixels, 0, 0)
}

function orderPoints(points: ScanPoint[]): ScanPoint[] {
  const bounded = points.map((point) => ({ x: clamp(point.x, 0, 1), y: clamp(point.y, 0, 1) }))
  const topLeft = bounded.reduce((best, point) => point.x + point.y < best.x + best.y ? point : best)
  const bottomRight = bounded.reduce((best, point) => point.x + point.y > best.x + best.y ? point : best)
  const topRight = bounded.reduce((best, point) => point.y - point.x < best.y - best.x ? point : best)
  const bottomLeft = bounded.reduce((best, point) => point.y - point.x > best.y - best.x ? point : best)
  return [topLeft, topRight, bottomRight, bottomLeft]
}

function hasCorners(corners: Partial<ScanCorners> | null | undefined): corners is ScanCorners {
  return Boolean(corners?.topLeftCorner && corners.topRightCorner && corners.bottomRightCorner && corners.bottomLeftCorner)
}
function averageDistance(a: ScanPoint, b: ScanPoint, c: ScanPoint, d: ScanPoint) { return (distance(a, b) + distance(c, d)) / 2 }
function distance(a: ScanPoint, b: ScanPoint) { return Math.hypot(a.x - b.x, a.y - b.y) }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)) }
function loadImage(source: string) { return new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('图片解码失败')); image.src = source }) }

async function compressOriginal(file: File) {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, imageConfig.originalMaxEdge / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const result = canvas.toDataURL('image/webp', imageConfig.originalQuality)
    canvas.width = 1
    canvas.height = 1
    return result
  } finally {
    bitmap.close()
  }
}
