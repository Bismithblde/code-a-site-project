import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign In — MineralWater",
  description: "Sign in to track your hydration and compare mineral water brands.",
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex">
      {/* ── Left: Image panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Background image */}
        <Image
          src="/images/login-bg.jpg"
          alt="Crystal clear water"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />

        {/* Content over the ocean */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Top: Logo */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(125,211,252,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
              <span className="text-lg font-semibold text-white/90 tracking-tight"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
                MineralWater
              </span>
            </Link>
          </div>

          {/* Center: Welcome message */}
          <div className="max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight leading-[1.1]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              Welcome
              <br />
              <span className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, #7dd3fc, #38bdf8, #0ea5e9)",
                  WebkitBackgroundClip: "text",
                }}>
                back.
              </span>
            </h1>
            <p className="mt-5 text-base text-white/55 leading-relaxed max-w-sm">
              Track your hydration, compare mineral water brands, and discover what&apos;s in every bottle.
            </p>
          </div>

          {/* Bottom: Stats */}
          <div className="flex gap-8">
            <div>
              <p className="text-2xl font-bold text-white/90">15</p>
              <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Brands</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white/90">10</p>
              <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Minerals</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white/90">Free</p>
              <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Tracker</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Sign-in form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-background relative">
        {/* Subtle ocean accent on the form side */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.03] blur-3xl"
          style={{ background: "radial-gradient(circle, #0ea5e9, transparent)" }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-[0.02] blur-3xl"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }} />

        <div className="w-full max-w-[400px] relative">
          {/* Mobile logo (hidden on desktop where left panel shows it) */}
          <div className="lg:hidden mb-10">
            <Link href="/" className="inline-flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
              <span className="text-lg font-semibold tracking-tight">MineralWater</span>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              Sign in
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <LoginForm />

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
