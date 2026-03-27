"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { logout } from "@/lib/auth-client";
import {
  getUserDisplayName,
  isAdminUser,
  isClientUser,
  isRestaurantUser,
} from "@/lib/auth-user";

const HIDDEN_ROUTES = new Set(["/login", "/signup"]);

export default function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef(null);
  const { user, isAuthLoading, clearCurrentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  if (HIDDEN_ROUTES.has(pathname) || isAuthLoading || !user) {
    return null;
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      toast.error("Unable to log out cleanly.", {
        description: error.message || "Clearing your local session instead.",
      });
    } finally {
      clearCurrentUser();
      router.push("/login");
    }
  }

  const initials = [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();
  const isAdmin = isAdminUser(user);
  const isRestaurant = isRestaurantUser(user);
  const isClient = isClientUser(user);
  const homeHref = isAdmin
    ? "/admin/restaurants"
    : isRestaurant
      ? "/restaurant/listings"
      : "/";

  return (
    <header className="sticky top-0 z-50 border-b border-white/55 bg-[rgba(247,251,248,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-4 px-4 py-3 lg:px-5">
        <Link
          href={homeHref}
          className="inline-flex items-center gap-3 rounded-full border border-white/65 bg-white/80 px-4 py-2 text-sm font-semibold text-foreground shadow-[0_12px_30px_rgba(17,51,34,0.06)]"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-primary/10 bg-white shadow-[0_8px_22px_rgba(17,51,34,0.08)]">
            <Image
              src="/logo.png"
              alt="MunchMun logo"
              width={40}
              height={40}
              className="h-full w-full object-cover"
              priority
            />
          </span>
          <span>MunchMun</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {isAdmin ? (
            <Link
              href="/admin/restaurants"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-primary text-white"
                  : "text-foreground/72 hover:bg-white hover:text-foreground"
              }`}
            >
              Restaurants
            </Link>
          ) : null}
          {isClient ? (
            <Link
              href="/"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-primary text-white"
                  : "text-foreground/72 hover:bg-white hover:text-foreground"
              }`}
            >
              Discover
            </Link>
          ) : null}
          {isClient ? (
            <Link
              href="/reservations"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith("/reservations")
                  ? "bg-primary text-white"
                  : "text-foreground/72 hover:bg-white hover:text-foreground"
              }`}
            >
              Reservations
            </Link>
          ) : null}
          {isRestaurant ? (
            <Link
              href="/restaurant/listings"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith("/restaurant")
                  ? "bg-primary text-white"
                  : "text-foreground/72 hover:bg-white hover:text-foreground"
              }`}
            >
              Listings
            </Link>
          ) : null}
          <Link
            href="/settings"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              pathname === "/settings"
                ? "bg-primary text-white"
                : "text-foreground/72 hover:bg-white hover:text-foreground"
            }`}
          >
            Settings
          </Link>
        </nav>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="flex items-center gap-3 rounded-full border border-white/70 bg-white/85 px-3 py-2 shadow-[0_14px_32px_rgba(17,51,34,0.07)] transition hover:-translate-y-[1px]"
          >
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold text-foreground">
                {getUserDisplayName(user)}
              </span>
              <span className="block text-xs text-foreground/55">{user.email}</span>
            </span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
              {initials || "MM"}
            </span>
          </button>

          {isMenuOpen ? (
            <div className="absolute right-0 mt-3 w-56 rounded-[1.5rem] border border-white/70 bg-white/95 p-2 shadow-[0_24px_55px_rgba(17,51,34,0.14)] backdrop-blur-xl">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-foreground">
                  {getUserDisplayName(user)}
                </p>
                <p className="text-xs text-foreground/58">{user.email}</p>
              </div>
              <Link
                href="/settings"
                className="block rounded-2xl px-3 py-2.5 text-sm font-medium text-foreground/78 transition hover:bg-primary-soft hover:text-foreground"
              >
                Settings
              </Link>
              {isClient ? (
                <Link
                  href="/reservations"
                  className="block rounded-2xl px-3 py-2.5 text-sm font-medium text-foreground/78 transition hover:bg-primary-soft hover:text-foreground"
                >
                  My reservations
                </Link>
              ) : null}
              {isAdmin ? (
                <Link
                  href="/admin/restaurants"
                  className="block rounded-2xl px-3 py-2.5 text-sm font-medium text-foreground/78 transition hover:bg-primary-soft hover:text-foreground"
                >
                  Manage restaurants
                </Link>
              ) : null}
              {isRestaurant ? (
                <Link
                  href="/restaurant/listings"
                  className="block rounded-2xl px-3 py-2.5 text-sm font-medium text-foreground/78 transition hover:bg-primary-soft hover:text-foreground"
                >
                  My listings
                </Link>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50"
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
