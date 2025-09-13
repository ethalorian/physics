"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "success" | "error" | "warning" | "info"
  duration?: number
  onClose?: () => void
}

const toastVariants = {
  default: "bg-white border-gray-200",
  success: "bg-green-50 border-green-200",
  error: "bg-red-50 border-red-200",
  warning: "bg-yellow-50 border-yellow-200",
  info: "bg-blue-50 border-blue-200",
}

const iconVariants = {
  default: null,
  success: <CheckCircle className="h-5 w-5 text-green-600" />,
  error: <AlertCircle className="h-5 w-5 text-red-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
  info: <Info className="h-5 w-5 text-blue-600" />,
}

export function Toast({
  title,
  description,
  variant = "default",
  onClose,
}: ToastProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full items-center space-x-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all",
        "animate-in slide-in-from-top-full duration-300",
        toastVariants[variant]
      )}
    >
      {iconVariants[variant] && (
        <div className="flex-shrink-0">{iconVariants[variant]}</div>
      )}
      <div className="flex-1">
        {title && (
          <div className={cn(
            "text-sm font-semibold",
            variant === "success" && "text-green-900",
            variant === "error" && "text-red-900",
            variant === "warning" && "text-yellow-900",
            variant === "info" && "text-blue-900",
            variant === "default" && "text-gray-900"
          )}>
            {title}
          </div>
        )}
        {description && (
          <div className={cn(
            "mt-1 text-sm",
            variant === "success" && "text-green-700",
            variant === "error" && "text-red-700",
            variant === "warning" && "text-yellow-700",
            variant === "info" && "text-blue-700",
            variant === "default" && "text-gray-600"
          )}>
            {description}
          </div>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            "flex-shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors",
            variant === "success" && "hover:bg-green-900/10",
            variant === "error" && "hover:bg-red-900/10",
            variant === "warning" && "hover:bg-yellow-900/10",
            variant === "info" && "hover:bg-blue-900/10"
          )}
        >
          <X className={cn(
            "h-4 w-4",
            variant === "success" && "text-green-600",
            variant === "error" && "text-red-600",
            variant === "warning" && "text-yellow-600",
            variant === "info" && "text-blue-600",
            variant === "default" && "text-gray-500"
          )} />
        </button>
      )}
    </div>
  )
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full">
      {children}
    </div>
  )
}
