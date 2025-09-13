"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { Toast, ToastContainer, ToastProps } from "@/components/ui/toast"

interface ToastContextType {
  showToast: (options: Omit<ToastProps, "id">) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((options: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(7)
    const duration = options.duration || 3000 // Default 3 seconds
    
    const newToast: ToastProps = {
      ...options,
      id,
      onClose: () => removeToast(id),
    }

    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  )
}
