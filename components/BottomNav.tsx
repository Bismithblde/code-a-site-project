"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Droplets, Scale, Activity, LogIn, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { type ComponentType } from "react";

interface NavTab {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

const authenticatedTabs: NavTab[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Brands", href: "/brands", icon: Droplets },
  { label: "Compare", href: "/compare", icon: Scale },
  { label: "Tracker", href: "/tracker", icon: Activity },
];

const guestTabs: NavTab[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Create", href: "/register", icon: UserPlus },
  { label: "Login", href: "/login", icon: LogIn },
];

export function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const tabs = user ? authenticatedTabs : guestTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
