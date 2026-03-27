"use client";

import { motion } from "framer-motion";

export default function AuthSubmitButton({
  children,
  disabled = false,
  loadingLabel,
  isLoading = false,
  type = "submit",
}) {
  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { y: -3 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="group relative w-full overflow-hidden rounded-2xl border border-white/20 bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(31,143,87,0.22)] transition-[background-color,box-shadow] duration-300 ease-out hover:bg-primary-strong hover:shadow-[0_18px_40px_rgba(31,143,87,0.28)] focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-80"
    >
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <span className="absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:translate-x-[180%] group-hover:opacity-100" />
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_72%)] opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" />
      </span>

      <span className="relative z-10">
        {isLoading && loadingLabel ? loadingLabel : children}
      </span>
    </motion.button>
  );
}
