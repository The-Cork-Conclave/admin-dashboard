"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group items-start gap-3 border border-border shadow-lg [&_[data-description]]:opacity-100",
          title: "text-base font-semibold text-foreground",
          description: "text-sm font-normal leading-snug text-foreground/90 opacity-100",
          success:
            "[&_[data-title]]:text-white [&_[data-description]]:text-white/90 [&_[data-icon]]:text-white",
          error:
            "[&_[data-title]]:text-white [&_[data-description]]:text-white/90 [&_[data-icon]]:text-white",
          info:
            "[&_[data-title]]:text-white [&_[data-description]]:text-white/90 [&_[data-icon]]:text-white",
          warning:
            "[&_[data-title]]:text-white [&_[data-description]]:text-white/90 [&_[data-icon]]:text-white",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
