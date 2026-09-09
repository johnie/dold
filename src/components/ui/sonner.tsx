"use client";

import {
  IconCircleCheck,
  IconInfoCircle,
  IconLoader2,
  IconCircleX,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";
import type { ToasterProps } from "sonner";
import { Toaster as Sonner } from "sonner";

type SonnerTheme = NonNullable<ToasterProps["theme"]>;

const isSonnerTheme = (theme: string): theme is SonnerTheme =>
  theme === "light" || theme === "dark" || theme === "system";

const toSonnerTheme = (theme: string): SonnerTheme =>
  isSonnerTheme(theme) ? theme : "system";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={toSonnerTheme(theme)}
      className="toaster group"
      icons={{
        error: <IconCircleX className="size-4" />,
        info: <IconInfoCircle className="size-4" />,
        loading: <IconLoader2 className="size-4 animate-spin" />,
        success: <IconCircleCheck className="size-4" />,
        warning: <IconAlertTriangle className="size-4" />,
      }}
      style={
        // SAFETY: Custom CSS properties for styling Sonner toast container.
        {
          "--border-radius": "var(--radius)",
          "--normal-bg": "var(--popover)",
          "--normal-border": "var(--border)",
          "--normal-text": "var(--popover-foreground)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
