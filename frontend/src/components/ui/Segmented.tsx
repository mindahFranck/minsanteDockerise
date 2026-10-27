import { cn } from "./cn"

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** Sélecteur à onglets compact (« Catégorie · Statut · Région »). */
export default function Segmented<T extends string>({ options, value, onChange, className }: SegmentedProps<T>) {
  return (
    <div className={cn("inline-flex rounded-xl bg-gray-100 p-1", className)} role="tablist">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
