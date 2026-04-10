import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — MineralWater",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — ocean gradient */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-ocean-deep via-ocean-mid to-ocean-surface items-center justify-center p-12">
        <div className="text-white text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
          <p className="text-white/70 text-lg">
            Track your hydration, compare mineral water brands, and stay healthy.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6">Sign in to your account</h2>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="underline hover:text-foreground">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
