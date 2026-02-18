"use client"

import {
  IconCircleCheck,
  IconInfoCircle,
  IconLoader2,
  IconCircleX,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

type SonnerTheme = NonNullable<ToasterProps["theme"]>

const SONNER_THEMES: readonly SonnerTheme[] = ["light", "dark", "system"] as const

function toSonnerTheme(theme: string): SonnerTheme {
  return (SONNER_THEMES as readonly string[]).includes(theme)
    ? (theme as SonnerTheme)
    : "system"
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={toSonnerTheme(theme)}
      className="toaster group"
      icons={{
        success: <IconCircleCheck className="size-4" />,
        info: <IconInfoCircle className="size-4" />,
        warning: <IconAlertTriangle className="size-4" />,
        error: <IconCircleX className="size-4" />,
        loading: <IconLoader2 className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
