export type ToastKind = 'error' | 'info'

export interface Toast {
  id: number
  kind: ToastKind
  message: string
}

type Listener = (toasts: Toast[]) => void

let toasts: Toast[] = []
const listeners = new Set<Listener>()
let nextId = 1

function emit() {
  for (const listener of listeners) listener(toasts)
}

export function toast(kind: ToastKind, message: string, durationMs = 6000): void {
  const t: Toast = { id: nextId++, kind, message }
  toasts = [...toasts, t]
  emit()
  setTimeout(() => dismiss(t.id), durationMs)
}

export function dismiss(id: number): void {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToasts(): Toast[] {
  return toasts
}
