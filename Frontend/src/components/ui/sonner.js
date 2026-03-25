"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster(props) {
  return (
    <Sonner
      closeButton
      expand
      richColors
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "border border-border bg-surface text-foreground shadow-[0_18px_40px_rgba(17,51,34,0.12)]",
          title: "text-sm font-semibold",
          description: "text-sm text-foreground/75",
          actionButton: "bg-primary text-white hover:bg-primary-strong",
          cancelButton: "bg-surface-muted text-foreground",
        },
      }}
      {...props}
    />
  );
}
