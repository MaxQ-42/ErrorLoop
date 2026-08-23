type OpenCv = {
  Mat?: unknown
  imread?: unknown
  onRuntimeInitialized?: () => void
}

type JscanifyConstructor = new () => unknown

let openCvPromise: Promise<OpenCv> | null = null
let jscanifyPromise: Promise<JscanifyConstructor> | null = null

export async function loadOpenCV(): Promise<OpenCv> {
  if (isOpenCvReady(window.cv)) return window.cv
  if (!openCvPromise) {
    openCvPromise = loadScript('errorloop-opencv-runtime', assetUrl('vendor/opencv/opencv.js'))
      .then(waitForOpenCv)
      .catch((error) => {
        openCvPromise = null
        reportLoadError('OpenCV runtime', error)
        throw new Error('扫描组件加载失败，请检查网络后重试。')
      })
  }
  return openCvPromise
}

export async function loadJscanify(): Promise<JscanifyConstructor> {
  if (typeof window.jscanify === 'function') return window.jscanify as JscanifyConstructor
  if (!jscanifyPromise) {
    jscanifyPromise = loadScript('errorloop-jscanify-runtime', assetUrl('vendor/jscanify/jscanify.js'))
      .then(() => {
        if (typeof window.jscanify !== 'function') throw new Error('jscanify 初始化失败')
        return window.jscanify as JscanifyConstructor
      })
      .catch((error) => {
        jscanifyPromise = null
        reportLoadError('jscanify runtime', error)
        throw new Error('扫描组件加载失败，请检查网络后重试。')
      })
  }
  return jscanifyPromise
}

export function resetScanEngineLoader() {
  openCvPromise = null
  jscanifyPromise = null
  document.getElementById('errorloop-opencv-runtime')?.remove()
  document.getElementById('errorloop-jscanify-runtime')?.remove()
  window.cv = undefined
  window.jscanify = undefined
}

function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path}`
}

function loadScript(id: string, source: string) {
  return new Promise<void>((resolve, reject) => {
    let script = document.getElementById(id) as HTMLScriptElement | null
    if (script?.dataset.loaded === 'true') return resolve()
    if (!script) {
      script = document.createElement('script')
      script.id = id
      script.async = true
      script.src = source
    }
    script.addEventListener('load', () => {
      script!.dataset.loaded = 'true'
      resolve()
    }, { once: true })
    script.addEventListener('error', () => reject(new Error(`无法下载 ${source}`)), { once: true })
    if (!script.isConnected) document.head.append(script)
  })
}

async function waitForOpenCv() {
  const candidate = window.cv
  // Some OpenCV distributions expose an async factory when loaded as a classic
  // script. Resolve it once, then replace window.cv with the actual runtime.
  if (typeof candidate === 'function' && !isOpenCvReady(candidate)) {
    window.cv = await candidate()
  }
  return new Promise<OpenCv>((resolve, reject) => {
    const deadline = Date.now() + 30_000
    const check = () => {
      if (isOpenCvReady(window.cv)) return resolve(window.cv)
      if (Date.now() >= deadline) return reject(new Error('OpenCV runtime 初始化超时'))
      window.setTimeout(check, 50)
    }
    check()
  })
}

function isOpenCvReady(value: OpenCv | undefined): value is OpenCv {
  return Boolean(value && typeof value.Mat === 'function' && typeof value.imread === 'function')
}

function reportLoadError(stage: string, error: unknown) {
  if (import.meta.env.DEV) console.error(`[ErrorLoop] ${stage} failed`, error)
}
