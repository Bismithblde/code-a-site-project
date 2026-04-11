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
  const waterTextRef = useRef<HTMLSpanElement>(null);
  const waterMaskRef = useRef<HTMLDivElement>(null);

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

  // ── Generate pixel-perfect text mask for glass effect ──
  useEffect(() => {
    const generateMask = () => {
      const textEl = waterTextRef.current;
      const maskEl = waterMaskRef.current;
      if (!textEl || !maskEl) return;

      const { width, height } = textEl.getBoundingClientRect();
      if (width === 0 || height === 0) return;

      const dpr = window.devicePixelRatio || 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width * dpr);
      canvas.height = Math.ceil(height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      const cs = getComputedStyle(textEl);
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#fff";
      // Position at center-x, baseline ~82% down (matches Impact cap-height)
      ctx.fillText("Water", width / 2, height * 0.82);

      const url = canvas.toDataURL();
      maskEl.style.maskImage = `url(${url})`;
      maskEl.style.setProperty("-webkit-mask-image", `url(${url})`);
    };

    document.fonts.ready.then(generateMask);
    const ro = new ResizeObserver(generateMask);
    if (waterTextRef.current) ro.observe(waterTextRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Computed scroll-driven values ──
  // "Water" is visible FIRST on load, then rest appears on scroll

  // Phase 0: "Water" is always visible from the start, fades slightly as other text enters
  const waterOpacity = 1; // always visible
  const waterScale = 1 - rangeProgress(progress, 0.04, 0.10) * 0.15; // shrinks slightly as title enters

  // Phase 1: "Find Your Perfect" visible from the start
  const titleOpacity = 1;
  const titleY = 0;

  // Phase 2: 5-9% — subtitle and CTAs
  const subtitleOpacity = rangeProgress(progress, 0.05, 0.09);
  const ctaOpacity = rangeProgress(progress, 0.07, 0.11);

  // Phase 3: 10-16% — text shifts left, bottle zone activates
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
          {/* Title line 1 — "Water" (liquid glass with SVG specular lighting) */}
          <div
            className="relative flex justify-center"
            style={{ transform: `scale(${waterScale})` }}
          >
            {/* SVG filter definitions for chrome/glass specular effect */}
            <svg width="0" height="0" className="absolute">
              <defs>
                <filter id="glass-specular" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                  <feSpecularLighting
                    in="blur"
                    surfaceScale="8"
                    specularConstant="2.5"
                    specularExponent="35"
                    lightingColor="white"
                    result="specular"
                  >
                    <feDistantLight azimuth="225" elevation="35" />
                  </feSpecularLighting>
                  <feComposite in="specular" in2="SourceAlpha" operator="in" result="specClipped" />
                </filter>
                <filter id="glass-shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
                  <feDiffuseLighting
                    in="blur"
                    surfaceScale="6"
                    diffuseConstant="1.2"
                    result="diffuse"
                  >
                    <feDistantLight azimuth="225" elevation="35" />
                  </feDiffuseLighting>
                  <feComposite in="diffuse" in2="SourceAlpha" operator="in" result="diffClipped" />
                </filter>
              </defs>
            </svg>

            {/* Layer 1: Clear glass refraction — background visible through text */}
            <div
              ref={waterMaskRef}
              className="absolute inset-0 pointer-events-none"
              style={{
                backdropFilter: "brightness(1.08) contrast(1.05) saturate(1.1)",
                WebkitBackdropFilter: "brightness(1.08) contrast(1.05) saturate(1.1)",
                maskSize: "100% 100%",
                WebkitMaskSize: "100% 100%",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
                zIndex: 1,
              }}
            />

            {/* Layer 2: Sizing text — transparent, thin dark edge */}
            <span
              ref={waterTextRef}
              className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] tracking-tight text-center block relative"
              style={{
                fontFamily: "var(--font-nunito), Nunito, sans-serif",
                fontWeight: 900,
                lineHeight: 1,
                color: "transparent",
                WebkitTextStroke: "0.5px rgba(100,100,100,0.35)",
                zIndex: 2,
              }}
              aria-label="Water"
            >
              Water
            </span>

            {/* Layer 3: Diffuse lighting — dark glass edges/shadows */}
            <span
              className="absolute inset-0 text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] tracking-tight text-center block pointer-events-none select-none"
              style={{
                fontFamily: "var(--font-nunito), Nunito, sans-serif",
                fontWeight: 900,
                lineHeight: 1,
                color: "black",
                filter: "url(#glass-shadow)",
                mixBlendMode: "multiply",
                opacity: 0.5,
                zIndex: 3,
              }}
              aria-hidden="true"
            >
              Water
            </span>

            {/* Layer 4: Specular highlights — chrome edge reflections */}
            <span
              className="absolute inset-0 text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] tracking-tight text-center block pointer-events-none select-none"
              style={{
                fontFamily: "var(--font-nunito), Nunito, sans-serif",
                fontWeight: 900,
                lineHeight: 1,
                color: "black",
                filter: "url(#glass-specular)",
                mixBlendMode: "screen",
                zIndex: 4,
              }}
              aria-hidden="true"
            >
              Water
            </span>
          </div>

          {/* Title line 2 — "Find Your Perfect" */}
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
                  className="object-contain w-auto max-h-[260px] sm:max-h-[340px] md:max-h-[420px]"
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
