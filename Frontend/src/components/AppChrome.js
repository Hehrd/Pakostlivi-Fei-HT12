"use client";

import AppNavbar from "@/components/AppNavbar";

export default function AppChrome({ children }) {
  return (
    <>
      <AppNavbar />
      {children}
    </>
  );
}
