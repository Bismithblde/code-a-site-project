"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

/* ── Bottle data — all 15 brands with slugs for linking ── */
const bottles = [
  { name: "Evian", slug: "evian", origin: "France · Still", image: "/images/evian.png" },
  { name: "Fiji", slug: "fiji", origin: "Fiji · Still", image: "/images/fiji.png" },
  { name: "Gerolsteiner", slug: "gerolsteiner", origin: "Germany · Sparkling", image: "/images/gerolsteiner.png" },
  { name: "San Pellegrino", slug: "san-pellegrino", origin: "Italy · Sparkling", image: "/images/san-pellegrino.png" },
  { name: "Perrier", slug: "perrier", origin: "France · Sparkling", image: "/images/perrier.png" },
  { name: "Voss", slug: "voss", origin: "Norway · Still & Sparkling", image: "/images/voss.png" },
  { name: "Essentia", slug: "essentia", origin: "USA · Still", image: "/images/essentia.png" },
  { name: "Smartwater", slug: "smartwater", origin: "USA · Still", image: "/images/smartwater.png" },
  { name: "Topo Chico", slug: "topo-chico", origin: "Mexico · Sparkling", image: "/images/topo-chico.png" },
  { name: "Mountain Valley", slug: "mountain-valley", origin: "USA · Still & Sparkling", image: "/images/mountain-valley.png" },
  { name: "Acqua Panna", slug: "acqua-panna", origin: "Italy · Still", image: "/images/acqua-panna.png" },
  { name: "Waiakea", slug: "waiakea", origin: "Hawaii · Still", image: "/images/waiakea.png" },
  { name: "Icelandic Glacial", slug: "icelandic-glacial", origin: "Iceland · Still", image: "/images/icelandic.png" },
  { name: "Liquid Death", slug: "liquid-death", origin: "USA · Still & Sparkling", image: "/images/liquid-death.png" },
  { name: "Flow", slug: "flow", origin: "Canada · Still", image: "/images/flow.png" },
];

const TOTAL_FRAMES = 120;
const FRAME_W = 960;
const FRAME_H = 540;

/* ── Utility: clamp ── */
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/* ── Utility: map a value from one range to 0–1, clamped ── */
function rangeProgress(value: number, start: number, end: number) {
  return clamp((value - start) / (end - start), 0, 1);
}

/* ── Main Hero ── */
export function OceanHeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<ImageBitmap[]>([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const [progress, setProgress] = useState(0); // 0 to 1 normalized scroll

  // ── Extract video frames ──
  useEffect(() => {
    const video = document.createElement("video");
    video.src = "/videos/ocean-hero.mp4";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";

    const extract = async () => {
      const duration = video.duration;
      if (!duration || !isFinite(duration)) return;

      const offscreen = document.createElement("canvas");
      offscreen.width = FRAME_W;
      offscreen.height = FRAME_H;
      const ctx = offscreen.getContext("2d")!;

      const mainCanvas = canvasRef.current;
      if (mainCanvas) { mainCanvas.width = FRAME_W; mainCanvas.height = FRAME_H; }

      for (let i = 0; i < TOTAL_FRAMES; i++) {
        video.currentTime = (i / TOTAL_FRAMES) * duration;
        await new Promise<void>((r) => video.addEventListener("seeked", () => r(), { once: true }));
        ctx.drawImage(video, 0, 0, FRAME_W, FRAME_H);
        const bitmap = await createImageBitmap(offscreen);
        framesRef.current.push(bitmap);

        if (i === 0 && mainCanvas) {
          mainCanvas.getContext("2d")?.drawImage(bitmap, 0, 0);
        }
        setLoadProgress((i + 1) / TOTAL_FRAMES);
      }
    };

    if (video.readyState >= 1) extract();
    else video.addEventListener("loadeddata", extract, { once: true });

    return () => { video.pause(); video.src = ""; };
  }, []);

  // ── Scroll handler: scrub video + track progress ──
  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const section = sectionRef.current;
        const canvas = canvasRef.current;
        const frames = framesRef.current;
        if (!section || !canvas) return;

        const rect = section.getBoundingClientRect();
        const scrollRange = section.offsetHeight - window.innerHeight;
        const p = clamp(-rect.top / scrollRange, 0, 1);
        setProgress(p);

        if (frames.length === 0) return;
        const frameIndex = Math.min(Math.floor(p * frames.length), frames.length - 1);
        if (frameIndex !== currentFrameRef.current && frames[frameIndex]) {
          currentFrameRef.current = frameIndex;
          canvas.getContext("2d")?.drawImage(frames[frameIndex], 0, 0);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(rafRef.current); };
  }, []);

  // ── Computed scroll-driven values (compressed for 800svh) ──
  // Phase 1: 0-4% — title enters
  const titleOpacity = rangeProgress(progress, 0, 0.03);
  const titleY = (1 - rangeProgress(progress, 0, 0.04)) * 60;

  // Phase 2: 3-8% — "Water" word and subtitle enter
  const waterOpacity = rangeProgress(progress, 0.03, 0.06);
  const subtitleOpacity = rangeProgress(progress, 0.05, 0.08);
  const ctaOpacity = rangeProgress(progress, 0.06, 0.10);

  // Phase 3: 10-15% — text shifts left, bottle zone activates
  const textShift = rangeProgress(progress, 0.10, 0.16);
  const textX = textShift * -15;
  const textScale = 1 - textShift * 0.15;

  // Phase 4: 15-93% — bottles appear one by one
  const BOTTLE_START = 0.15;
  const BOTTLE_END = 0.93;
  const bottleRange = BOTTLE_END - BOTTLE_START;
  const perBottle = bottleRange / bottles.length;

  // Which bottle is active
  const activeBottleIndex = useMemo(() => {
    if (progress < BOTTLE_START) return -1;
    if (progress >= BOTTLE_END) return bottles.length - 1;
    return Math.floor((progress - BOTTLE_START) / perBottle);
  }, [progress, perBottle]);

  // Per-bottle progress (0 to 1 within each bottle's range)
  const bottleProgress = useMemo(() => {
    if (activeBottleIndex < 0) return 0;
    const bottleStart = BOTTLE_START + activeBottleIndex * perBottle;
    return rangeProgress(progress, bottleStart, bottleStart + perBottle);
  }, [progress, activeBottleIndex, perBottle]);

  // Phase 5: 92-100% — fade everything out
  const fadeOut = 1 - rangeProgress(progress, 0.92, 1);

  const loaded = loadProgress >= 1;

  // Scroll hint visibility
  const scrollHintOpacity = 1 - rangeProgress(progress, 0, 0.05);

  return (
    <section ref={sectionRef} className="relative w-full h-[800svh]">
      <div className="sticky top-0 h-[100svh] min-h-[600px] max-h-[1100px] overflow-hidden">

        {/* ── Canvas (video) ── */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 1 }} />

        {/* ── Gradient fallback ── */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, #87CEEB 0%, #5BB8E6 18%, #2E9BD6 35%, #1a8ac4 48%, #0d7ab3 55%, #0a6fa6 62%, #085d8e 72%, #064d78 82%, #043d62 92%, #022d4f 100%)",
          transition: "opacity 0.5s ease", opacity: loaded ? 0 : 1,
        }}>
          {!loaded && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 animate-pulse" style={{ animation: "shimmer 2s ease-in-out infinite" }} />
            </div>
          )}
        </div>

        {/* ── Overlay ── */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 30%, rgba(2,30,50,0.35) 100%)",
          zIndex: 2,
        }} />

        {/* ── Text content — scroll-driven transforms ── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 md:px-12 pointer-events-none"
          style={{
            zIndex: 10,
            opacity: fadeOut,
            transform: `translateX(${textX}vw) scale(${textScale})`,
            transition: "transform 0.1s linear",
          }}
        >
          {/* Title line 1 */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white text-center drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
            }}
          >
            Find Your Perfect
          </h1>

          {/* Title line 2 — "Water" with gradient */}
          <span
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-center drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              opacity: waterOpacity,
              transform: `translateY(${(1 - waterOpacity) * 30}px) scale(${0.9 + waterOpacity * 0.1})`,
              backgroundImage: "linear-gradient(135deg, #7dd3fc, #38bdf8, #0ea5e9, #0284c7)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Water
          </span>

          {/* Subtitle */}
          <p
            className="mt-6 max-w-lg text-base sm:text-lg text-white/85 leading-relaxed text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
            style={{ opacity: subtitleOpacity, transform: `translateY(${(1 - subtitleOpacity) * 20}px)` }}
          >
            Compare mineral water brands by mineral content.
            <br className="hidden sm:block" />
            Track your hydration. Discover what&apos;s in every bottle.
          </p>

          {/* CTA Buttons */}
          <div
            className="mt-8 flex flex-wrap gap-4 justify-center pointer-events-auto"
            style={{ opacity: ctaOpacity, transform: `translateY(${(1 - ctaOpacity) * 15}px)` }}
          >
            <Link href="/brands" className="px-8 py-3.5 bg-white text-[#053d66] font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105">
              Explore Brands
            </Link>
            <Link href="/tracker" className="px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:border-white/50 hover:scale-105">
              Start Tracking
            </Link>
          </div>
        </div>

        {/* ── Bottle showcase — one at a time, scroll-driven, with action buttons ── */}
        <div
          className="absolute inset-0 flex items-center justify-end pr-[3%] md:pr-[8%] pointer-events-none"
          style={{ zIndex: 12, opacity: fadeOut }}
        >
          {bottles.map((bottle, i) => {
            const isActive = i === activeBottleIndex;
            const isPast = i < activeBottleIndex;

            let opacity = 0;
            let translateY = 80;
            let scale = 0.85;

            if (isActive) {
              const entry = rangeProgress(bottleProgress, 0, 0.35);
              const exit = rangeProgress(bottleProgress, 0.7, 1);
              opacity = entry * (1 - exit);
              translateY = (1 - entry) * 80 + exit * -60;
              scale = 0.85 + entry * 0.15 - exit * 0.1;
            } else if (isPast) {
              opacity = 0;
              translateY = -80;
            }

            // Buttons fade in slightly after the bottle
            const buttonOpacity = isActive ? rangeProgress(bottleProgress, 0.2, 0.45) * (1 - rangeProgress(bottleProgress, 0.75, 1)) : 0;

            return (
              <div
                key={bottle.name}
                className="absolute flex flex-col items-center"
                style={{
                  opacity,
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  filter: "drop-shadow(0 20px 50px rgba(0,0,0,0.5))",
                  willChange: "transform, opacity",
                  right: "6%",
                }}
              >
                {/* Bigger bottle image */}
                <Image
                  src={bottle.image}
                  alt={bottle.name}
                  width={180}
                  height={400}
                  className="object-contain max-h-[260px] sm:max-h-[340px] md:max-h-[420px]"
                  unoptimized
                  priority={i === 0}
                />

                {/* Brand name */}
                <div className="mt-5 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                    style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
                    {bottle.name}
                  </p>
                  <p className="text-xs sm:text-sm text-white/50 tracking-wider uppercase mt-1">
                    {bottle.origin}
                  </p>
                </div>

                {/* Glassmorphism action buttons */}
                <div
                  className="mt-5 flex gap-3 pointer-events-auto"
                  style={{ opacity: buttonOpacity }}
                >
                  <Link
                    href={`/brands/${bottle.slug}`}
                    className="px-5 py-2.5 rounded-full text-sm font-medium text-white backdrop-blur-xl border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:scale-105"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    View Details
                  </Link>
                  <a
                    href={`/go/${bottle.slug}`}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="px-5 py-2.5 rounded-full text-sm font-medium text-white backdrop-blur-xl border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:scale-105"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    Buy on Amazon
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bottle progress dots ── */}
        {progress > BOTTLE_START && progress < BOTTLE_END && (
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2"
            style={{ zIndex: 20, opacity: fadeOut }}
          >
            {bottles.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === activeBottleIndex ? 10 : 6,
                  height: i === activeBottleIndex ? 10 : 6,
                  backgroundColor: i === activeBottleIndex ? "white" : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
        )}

        {/* ── Bottom fade ── */}
        <div className="absolute bottom-0 left-0 right-0 h-32" style={{
          background: "linear-gradient(to bottom, transparent, var(--background))", zIndex: 15,
        }} />

        {/* ── Scroll hint ── */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ zIndex: 20, opacity: scrollHintOpacity }}>
          <span className="text-xs text-white/50 tracking-widest uppercase">Scroll to explore</span>
          <div className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
          </div>
        </div>

        {/* ── Loading bar ── */}
        {!loaded && (
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ zIndex: 25 }}>
            <div className="h-full bg-white/40 transition-all duration-300 ease-out"
              style={{ width: `${loadProgress * 100}%` }} />
          </div>
        )}

      </div>
    </section>
  );
}
