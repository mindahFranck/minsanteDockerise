import React, { useEffect, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

/**
 * Liste déroulante personnalisée (remplace le <select> natif) : contrôle stylé
 * cohérent avec le design, panneau d'options custom, ouverture intelligente
 * (vers le haut si peu de place), fermeture au clic extérieur et navigation clavier.
 */
export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Sélectionner…",
  disabled = false,
  className = "",
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  const toggleOpen = () => {
    if (disabled) return
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setDropUp(spaceBelow < 260 && rect.top > spaceBelow)
    }
    setIsOpen((o) => !o)
  }

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === "Escape") {
      setIsOpen(false)
      return
    }
    if (!isOpen && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault()
      toggleOpen()
      return
    }
    if (isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault()
      const idx = options.findIndex((o) => o.value === value)
      const next = e.key === "ArrowDown"
        ? Math.min(idx + 1, options.length - 1)
        : Math.max(idx - 1, 0)
      if (options[next]) onChange(options[next].value)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`input flex w-full items-center justify-between text-left ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-500"
            : "cursor-pointer hover:border-gray-300"
        }`}
      >
        <span className={selected ? "truncate text-gray-900" : "truncate text-gray-500"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`ml-2 size-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          className={`absolute z-[60] max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg ${
            dropUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">Aucune option</div>
          ) : (
            options.map((option) => {
              const active = option.value === value
              return (
                <button
                  type="button"
                  key={option.value || "__empty"}
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-row-hover ${
                    active ? "bg-brand-50 font-medium text-brand-600" : "text-gray-700"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {active && <Check className="ml-2 size-4 shrink-0 text-brand-600" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default Select
