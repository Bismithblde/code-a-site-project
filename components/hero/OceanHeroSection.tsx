"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

/* ── Bottle data with real product images from Amazon ── */
const bottles = [
  {
    name: "Evian",
    slug: "evian",
    image: "https://m.media-amazon.com/images/I/61rSQRSCIhL._AC_SL1500_.jpg",
    x: 6, y: 48, rotation: -15, scale: 0.85,
  },
  {
    name: "Fiji",
    slug: "fiji",
    image: "https://m.media-amazon.com/images/I/61l2q0W3a5L._AC_SL1500_.jpg",
    x: 22, y: 60, rotation: 10, scale: 0.9,
  },
  {
    name: "Gerolsteiner",
    slug: "gerolsteiner",
    image: "https://m.media-amazon.com/images/I/61CkN1RqcrL._AC_SL1500_.jpg",
    x: 40, y: 45, rotation: -8, scale: 0.8,
  },
  {
    name: "Perrier",
    slug: "perrier",
    image: "https://m.media-amazon.com/images/I/71AW4q2E9cL._AC_SL1500_.jpg",
    x: 58, y: 58, rotation: 12, scale: 0.88,
  },
  {
    name: "Voss",
    slug: "voss",
    image: "https://m.media-amazon.com/images/I/51A4s+NZBGL._AC_SL1500_.jpg",
    x: 74, y: 46, rotation: -20, scale: 0.82,
  },
  {
    name: "S.Pellegrino",
    slug: "san-pellegrino",
    image: "https://m.media-amazon.com/images/I/71QBEbpuiNL._AC_SL1500_.jpg",
    x: 88, y: 55, rotation: 8, scale: 0.85,
  },
];

const CYCLE_MS = 3200;
const FADE_MS = 900;

/* ── Floating Bottle with real image ── */
function FloatingBottle({
  name,
  image,
  style,
  opacity,
}: {
  name: string;
  image: string;
  style: React.CSSProperties;
  opacity: number;
}) {
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        ...style,
        opacity,
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        filter: "drop-shadow(0 8px 25px rgba(0,0,0,0.4))",
      }}
    >
      <Image
        src={image}
        alt={`${name} water bottle`}
        width={80}
        height={200}
        className="object-contain max-h-[160px] sm:max-h-[200px]"
        unoptimized
      />
    </div>
  );
}

/* ── Main Hero ── */
export function OceanHeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [opacities, setOpacities] = useState(() =>
    bottles.map((_, i) => (i === 0 ? 1 : 0))
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  // Force video play — handles autoplay policy in all browsers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      video.play().catch(() => {
        // Autoplay blocked — retry on first user interaction
        const handleInteraction = () => {
          video.play().catch(() => {});
          document.removeEventListener("click", handleInteraction);
          document.removeEventListener("touchstart", handleInteraction);
          document.removeEventListener("scroll", handleInteraction);
        };
        document.addEventListener("click", handleInteraction, { once: true });
        document.addEventListener("touchstart", handleInteraction, { once: true });
        document.addEventListener("scroll", handleInteraction, { once: true });
      });
    };

    if (video.readyState >= 3) {
      tryPlay();
    } else {
      video.addEventListener("canplay", tryPlay, { once: true });
    }
  }, []);

  // Sequential bottle phase-in / phase-out
  useEffect(() => {
    let current = 0;

    const interval = setInterval(() => {
      // Fade out current
      setOpacities((prev) => {
        const next = [...prev];
        next[current] = 0;
        return next;
      });

      // After fade-out completes, advance and fade in next
      setTimeout(() => {
        current = (current + 1) % bottles.length;
        setActiveIndex(current);
        setOpacities((prev) => {
          const next = [...prev];
          next[current] = 1;
          return next;
        });
      }, FADE_MS);
    }, CYCLE_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full h-[100svh] min-h-[600px] max-h-[1100px] overflow-hidden">
      {/* ── Video background ── */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 1 }}
      >
        <source src="/videos/ocean-hero.mp4" type="video/mp4" />
      </video>

      {/* ── Gradient fallback (always visible behind video) ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg,
            #87CEEB 0%,
            #5BB8E6 18%,
            #2E9BD6 35%,
            #1a8ac4 48%,
            #0d7ab3 55%,
            #0a6fa6 62%,
            #085d8e 72%,
            #064d78 82%,
            #043d62 92%,
            #022d4f 100%)`,
        }}
      />

      {/* ── Overlays for text readability ── */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(2,30,50,0.3) 100%)",
          zIndex: 2,
        }}
      />

      {/* ── Floating bottles ── */}
      <div className="absolute inset-0" style={{ zIndex: 5 }} aria-hidden="true">
        {bottles.map((bottle, i) => (
          <FloatingBottle
            key={bottle.name}
            name={bottle.name}
            image={bottle.image}
            opacity={opacities[i]}
            style={{
              left: `${bottle.x}%`,
              top: `${bottle.y}%`,
              transform: `rotate(${bottle.rotation}deg) scale(${bottle.scale})`,
              animation: `bottleFloat ${4 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* ── Content ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
        style={{ zIndex: 10 }}
      >
        <h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Find Your Perfect
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #7dd3fc, #38bdf8, #0ea5e9, #0284c7)",
              WebkitBackgroundClip: "text",
            }}
          >
            Water
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base sm:text-lg text-white/85 leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
          Compare mineral water brands by mineral content.
          <br className="hidden sm:block" />
          Track your hydration. Discover what&apos;s in every bottle.
        </p>

        {/* Active bottle name */}
        <div className="mt-4 h-6 overflow-hidden">
          <span
            className="text-sm font-medium tracking-[0.2em] uppercase text-white/50"
            style={{
              opacity: opacities[activeIndex],
              transition: `opacity ${FADE_MS}ms ease`,
            }}
          >
            {bottles[activeIndex].name}
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            href="/brands"
            className="px-8 py-3.5 bg-white text-[#053d66] font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105"
          >
            Explore Brands
          </Link>
          <Link
            href="/tracker"
            className="px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:border-white/50 hover:scale-105"
          >
            Start Tracking
          </Link>
        </div>
      </div>

      {/* ── Bottom fade ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--background))",
          zIndex: 15,
        }}
      />
    </section>
  );
}
