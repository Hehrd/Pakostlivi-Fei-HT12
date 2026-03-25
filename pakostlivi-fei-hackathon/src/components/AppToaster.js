"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const REDIRECT_TOAST_KEY = "redirect-toast";

export function queueRedirectToast(payload) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(REDIRECT_TOAST_KEY, JSON.stringify(payload));
}

export default function AppToaster() {
  const pathname = usePathname();

  useEffect(() => {
    const storedToast = window.sessionStorage.getItem(REDIRECT_TOAST_KEY);

    if (!storedToast) {
      return;
    }

    window.sessionStorage.removeItem(REDIRECT_TOAST_KEY);

    try {
      const payload = JSON.parse(storedToast);
      const method = payload.type === "error" ? toast.error : toast.success;

      method(payload.title, {
        description: payload.description,
      });
    } catch {
      toast.success("Logged in successfully.");
    }
  }, [pathname]);

  return <Toaster />;
}
