export type MobileStage =
  | 'idle' | 'image-selected' | 'image-decoding' | 'image-ready'
  | 'scanner-loading' | 'opencv-loading' | 'opencv-ready'
  | 'jscanify-loading' | 'scanner-ready' | 'document-detecting'
  | 'perspective-processing' | 'saving' | 'done' | 'failed'

export type DiagnosticEvent = {
  stage: MobileStage
  at: string
  details?: Record<string, unknown>
  error?: { name: string; message: string; stack?: string }
}

let latest: DiagnosticEvent = { stage: 'idle', at: new Date().toISOString() }

export function recordDiagnostic(stage: MobileStage, details?: Record<string, unknown>) {
  latest = { stage, at: new Date().toISOString(), details }
}

export function recordDiagnosticFailure(stage: MobileStage, error: unknown, details?: Record<string, unknown>) {
  const reason = error instanceof Error ? error : new Error(String(error))
  latest = {
    stage,
    at: new Date().toISOString(),
    details,
    error: { name: reason.name, message: reason.message, stack: reason.stack },
  }
  console.error('[ErrorLoop mobile diagnostic]', latest)
}

export function getLatestDiagnostic() { return latest }

export function runtimeDetails() {
  return {
    userAgent: navigator.userAgent,
    standalone: window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
    secureContext: window.isSecureContext,
  }
}
