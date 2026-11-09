import { cn } from "./cn"

/** Signature de l'application : conçue et développée par GENEX. */
export default function ItGrafikCredit({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <p className={cn("text-xs", inverted ? "text-white/60" : "text-gray-500", className)}>
      Conçu et développé par{" "}
      <span className={cn("font-semibold", inverted ? "text-white" : "text-brand-600")}>GENEX</span>
    </p>
  )
}
