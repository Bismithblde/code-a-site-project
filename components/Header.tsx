"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Droplets, Menu, X, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { label: "Brands", href: "/brands" },
  { label: "Minerals", href: "/minerals" },
  { label: "Compare", href: "/compare" },
  { label: "Tap Water", href: "/tap-water" },
  { label: "Tracker", href: "/tracker" },
];

const authLinks = [
  { label: "Create Account", href: "/register" },
  { label: "Login", href: "/login" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Check auth state
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Droplets className="size-6 text-primary" />
          <span>MineralWater</span>
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
              {/* CMD+K hint — desktop only */}
              <kbd className="hidden md:inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                <span className="text-xs">Ctrl</span>K
              </kbd>

              <ThemeToggle />

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
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
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
