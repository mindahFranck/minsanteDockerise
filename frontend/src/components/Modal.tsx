"use client"

import type React from "react"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "small" | "medium" | "large" | "xlarge"
}

export default function Modal({ isOpen, onClose, title, children, size = "medium" }: ModalProps) {
  if (!isOpen) return null

  const sizeClasses = {
    small: "sm:max-w-md",
    medium: "sm:max-w-lg",
    large: "sm:max-w-4xl",
    xlarge: "sm:max-w-6xl",
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-[1px] transition-opacity" onClick={onClose} />

        <div className={`relative inline-block w-full transform rounded-2xl bg-white text-left align-bottom shadow-lg transition-all sm:my-8 sm:align-middle ${sizeClasses[size]}`}>
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button onClick={onClose} className="btn-icon" aria-label="Fermer">
                <X className="size-5" />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
