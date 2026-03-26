"use client";

import { useEffect, useState } from "react";

const API_MODE = process.env.NEXT_PUBLIC_API_MODE ?? "real";

export default function MockServiceWorker({ children }) {
  const [isReady, setIsReady] = useState(API_MODE !== "mock");

  useEffect(() => {
    let isMounted = true;

    async function enableMocking() {
      if (API_MODE !== "mock") {
        if (isMounted) {
          setIsReady(true);
        }
        return;
      }

      const { worker } = await import("@/mocks/browser");

      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: {
          url: "/mockServiceWorker.js",
        },
      });

      if (isMounted) {
        setIsReady(true);
      }
    }

    enableMocking();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return children;
}
