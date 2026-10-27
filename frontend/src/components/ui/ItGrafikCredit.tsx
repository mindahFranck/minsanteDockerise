import { cn } from "./cn"

/** Signature de l'application : conçue et développée par IT-GRAFIK. */
export default function ItGrafikCredit({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <p className={cn("text-xs", inverted ? "text-white/60" : "text-gray-500", className)}>
      Conçu et développé par{" "}
      <a
        href="https://www.it-grafik.com"
        target="_blank"
        rel="noopener noreferrer"
        className={cn("font-semibold hover:underline", inverted ? "text-white" : "text-brand-600")}
      >
        IT-GRAFIK
      </a>
    </p>
  )
}
