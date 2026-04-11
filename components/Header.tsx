"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { label: "Brands", href: "/brands" },
  { label: "Minerals", href: "/minerals" },
  { label: "Compare", href: "/compare" },
  { label: "Tap Water", href: "/tap-water" },
  { label: "Tracker", href: "/tracker" },
  { label: "About", href: "/about" },
];

const authLinks = [
  { label: "About", href: "/about" },
  { label: "Create Account", href: "/register" },
  { label: "Login", href: "/login" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <header
      className="pointer-events-none fixed inset-x-0 top-2 z-50 px-3"
    >
      <nav
        className="pointer-events-auto mx-auto flex h-14 max-w-7xl items-center justify-between rounded-[1.75rem] border border-border/70 bg-background/75 px-4 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 md:px-5"
      >
        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          <span>aqua.io</span>
        </Link>

        {/* Desktop nav */}
        {user ? (
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setUser(null);
                  router.push("/");
                  router.refresh();
                }}
                className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>

              {/* CMD+K hint — desktop only */}
              <kbd className="hidden md:inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground ml-1">
                <span className="text-xs">Ctrl</span>K
              </kbd>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {authLinks.map((link) => (
              <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Mobile hamburger */}
          {user ? (
            <button
              className="md:hidden p-2 -mr-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          ) : null}
        </div>
      </nav>

      {/* Mobile dropdown */}
      {user && mobileOpen && (
        <div className="pointer-events-auto mx-auto mt-2 max-w-7xl rounded-2xl border border-border bg-background/95 shadow-lg backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium py-2 hover:text-primary transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
