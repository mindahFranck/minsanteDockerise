import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react"
import { cn } from "./cn"

export type ToastKind = "success" | "error" | "warning" | "info"

export interface ToastItem {
  id: number
  kind: ToastKind
  title: string
  message?: string
}

type Listener = (items: ToastItem[]) => void

let items: ToastItem[] = []
let nextId = 1
const listeners = new Set<Listener>()
const recent = new Map<string, number>()

const DURATION: Record<ToastKind, number> = { success: 3500, info: 4500, warning: 6000, error: 8000 }

function emit() {
  listeners.forEach((listener) => listener(items))
}

export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id)
  emit()
}

function push(kind: ToastKind, title: string, message?: string) {
  // Même message répété en rafale (plusieurs requêtes en échec) : un seul toast.
  const key = `${kind}|${title}|${message ?? ""}`
  const now = Date.now()
  if ((recent.get(key) ?? 0) > now - 4000) return
  recent.set(key, now)

  const id = nextId++
  items = [...items.slice(-4), { id, kind, title, message }]
  emit()
  window.setTimeout(() => dismissToast(id), DURATION[kind])
}

/** Notifications utilisables partout, y compris hors composants (intercepteurs axios). */
export const toast = {
  success: (title: string, message?: string) => push("success", title, message),
  error: (title: string, message?: string) => push("error", title, message),
  warning: (title: string, message?: string) => push("warning", title, message),
  info: (title: string, message?: string) => push("info", title, message),
}

const STYLES: Record<ToastKind, { box: string; icon: string; Icon: typeof Info }> = {
  success: { box: "border-success/30", icon: "text-success bg-success-soft", Icon: CheckCircle2 },
  error: { box: "border-danger/30", icon: "text-danger bg-danger-soft", Icon: XCircle },
  warning: { box: "border-warning/30", icon: "text-warning bg-warning-soft", Icon: AlertTriangle },
  info: { box: "border-brand-200", icon: "text-brand-500 bg-brand-50", Icon: Info },
}

/** À monter une seule fois, à la racine de l'application. */
export function Toaster() {
  const [list, setList] = useState<ToastItem[]>(items)

  useEffect(() => {
    listeners.add(setList)
    return () => {
      listeners.delete(setList)
    }
  }, [])

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:w-[24rem]"
    >
      {list.map((item) => {
        const style = STYLES[item.kind]
        return (
          <div
            key={item.id}
            role={item.kind === "error" ? "alert" : "status"}
            className={cn("pointer-events-auto flex w-full items-start gap-3 rounded-2xl border bg-white p-4 shadow-lg", style.box)}
          >
            <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl", style.icon)}>
              <style.Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              {item.message && <p className="mt-0.5 whitespace-pre-line text-sm text-gray-600">{item.message}</p>}
            </div>
            <button type="button" onClick={() => dismissToast(item.id)} className="btn-icon -mr-1 -mt-1" aria-label="Fermer">
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
