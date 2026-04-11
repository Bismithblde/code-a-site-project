"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";

/* ── Bottle data with local images ──
 *
 *  x / y        : base position as % of hero width/height
 *  rotation     : initial tilt in degrees
 *  scale        : visual size (doubles as perceived depth — smaller = deeper)
 *  bobDuration  : seconds for one full bob cycle (keeps bottles out of sync)
 *  bobDelay     : animation-delay offset in seconds
 *  parallaxRate : how many px the bottle drifts per 100px of scroll progress
 *                 (smaller scale bottles drift less — they're "deeper")
 *  opacity      : base opacity — slight variation sells the depth illusion
 */
const bottles: Array<{
  name: string;
  image: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  bobDuration: number;
  bobDelay: number;
  parallaxRate: number;
  opacity: number;
}> = [
  { name: "Evian",          image: "/images/evian.png",          x: 5,  y: 52, rotation: -14, scale: 0.78, bobDuration: 5.8, bobDelay: 0.0, parallaxRate: 28, opacity: 0.92 },
  { name: "Fiji",           image: "/images/fiji.png",           x: 20, y: 61, rotation:  11, scale: 0.92, bobDuration: 6.4, bobDelay: 1.1, parallaxRate: 38, opacity: 0.96 },
  { name: "Gerolsteiner",   image: "/images/gerolsteiner.png",   x: 38, y: 47, rotation:  -7, scale: 0.72, bobDuration: 7.1, bobDelay: 0.6, parallaxRate: 22, opacity: 0.82 },
  { name: "Topo Chico",     image: "/images/topo-chico.png",     x: 57, y: 59, rotation:  13, scale: 1.00, bobDuration: 5.3, bobDelay: 1.8, parallaxRate: 44, opacity: 1.00 },
  { name: "Liquid Death",   image: "/images/liquid-death.png",   x: 74, y: 48, rotation: -19, scale: 0.80, bobDuration: 6.9, bobDelay: 0.3, parallaxRate: 32, opacity: 0.88 },
  { name: "Mountain Valley",image: "/images/mountain-valley.png",x: 89, y: 57, rotation:   9, scale: 0.86, bobDuration: 6.2, bobDelay: 2.2, parallaxRate: 36, opacity: 0.94 },
];

const TOTAL_FRAMES = 30;
const FRAME_W = 960;
const FRAME_H = 540;

/* ── Single always-visible floating bottle ── */
function FloatingBottle({
  name, image, x, y, rotation, scale, bobDuration, bobDelay, parallaxRate, opacity, scrollY,
}: {
  name: string; image: string;
  x: number; y: number; rotation: number; scale: number;
  bobDuration: number; bobDelay: number; parallaxRate: number;
  opacity: number; scrollY: number;
}) {
  // Parallax: bottles drift upward (negative Y) as user scrolls down.
  // Rate is relative so deeper (smaller) bottles move less.
  const parallaxOffset = -(scrollY * parallaxRate) / 100;

  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        opacity,
        // CSS custom property consumed by the bottleFloat keyframe in globals.css
        ["--bottle-rotate" as string]: `${rotation}deg`,
        // Parallax shift stacked on top of the CSS bob animation via a wrapper
        transform: `translateY(${parallaxOffset}px) scale(${scale})`,
        // Bob animation — still runs via CSS, parallax applied as inline transform wrapper
        animation: `bottleFloat ${bobDuration}s ease-in-out infinite`,
        animationDelay: `${bobDelay}s`,
        filter: "drop-shadow(0 10px 28px rgba(0,0,0,0.45)) drop-shadow(0 2px 8px rgba(0,100,180,0.3))",
        // Nudge transform-origin so rotation pivots from the bottle base
        transformOrigin: "50% 85%",
        willChange: "transform",
      }}
    >
      <Image
        src={image}
        alt={`${name} water bottle`}
        width={80}
        height={200}
        className="object-contain max-h-[140px] sm:max-h-[180px] md:max-h-[210px]"
        unoptimized
      />
    </div>
  );
}

/* ── Main Hero ── */
export function OceanHeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<ImageBitmap[]>([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number>(0);
  // Normalised scroll progress 0→1 for parallax (not the raw pixel value)
  const [scrollProgress, setScrollProgress] = useState(0);

  // Extract frames progressively — show first frame ASAP
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

      // Set canvas size once
      const mainCanvas = canvasRef.current;
      if (mainCanvas) {
        mainCanvas.width = FRAME_W;
        mainCanvas.height = FRAME_H;
      }

      for (let i = 0; i < TOTAL_FRAMES; i++) {
        video.currentTime = (i / TOTAL_FRAMES) * duration;
        await new Promise<void>((r) =>
          video.addEventListener("seeked", () => r(), { once: true })
        );
        ctx.drawImage(video, 0, 0, FRAME_W, FRAME_H);
        const bitmap = await createImageBitmap(offscreen);
        framesRef.current.push(bitmap);

        // Draw first frame immediately so user sees something
        if (i === 0 && mainCanvas) {
          const mainCtx = mainCanvas.getContext("2d");
          mainCtx?.drawImage(bitmap, 0, 0);
        }

        setLoadProgress((i + 1) / TOTAL_FRAMES);
      }
    };

    if (video.readyState >= 1) {
      extract();
    } else {
      video.addEventListener("loadeddata", extract, { once: true });
    }

    return () => { video.pause(); video.src = ""; };
  }, []);

  // Scroll-driven canvas scrubbing + parallax progress
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
        const progress = Math.max(0, Math.min(1, -rect.top / scrollRange));

        // Update parallax state — raw scroll pixels relative to section start
        const rawScrolled = Math.max(0, -rect.top);
        setScrollProgress(rawScrolled);

        if (frames.length === 0) return;
        const frameIndex = Math.min(
          Math.floor(progress * frames.length),
          frames.length - 1
        );

        if (frameIndex !== currentFrameRef.current && frames[frameIndex]) {
          currentFrameRef.current = frameIndex;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(frames[frameIndex], 0, 0);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const loaded = loadProgress >= 1;

  return (
    <>
      {/* Preload the video for faster download */}
      <Head>
        <link rel="preload" href="/videos/ocean-hero.mp4" as="video" type="video/mp4" />
      </Head>

      <section ref={sectionRef} className="relative w-full h-[300svh]">
        <div className="sticky top-0 h-[100svh] min-h-[600px] max-h-[1100px] overflow-hidden">

          {/* ── Canvas ── */}
          <canvas ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 1 }} />

          {/* ── Gradient fallback + loading shimmer ── */}
          <div className="absolute inset-0" style={{
            background: `linear-gradient(180deg, #87CEEB 0%, #5BB8E6 18%, #2E9BD6 35%, #1a8ac4 48%, #0d7ab3 55%, #0a6fa6 62%, #085d8e 72%, #064d78 82%, #043d62 92%, #022d4f 100%)`,
            transition: "opacity 0.5s ease",
            opacity: loaded ? 0 : 1,
          }}>
            {!loaded && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  style={{ animation: "shimmer 2s ease-in-out infinite" }} />
              </div>
            )}
          </div>

          {/* ── Overlay ── */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(2,30,50,0.3) 100%)",
            zIndex: 2,
          }} />

          {/* ── Bottles — all visible simultaneously, scattered & floating ── */}
          <div className="absolute inset-0" style={{ zIndex: 5 }} aria-hidden="true">
            {bottles.map((bottle) => (
              <FloatingBottle
                key={bottle.name}
                name={bottle.name}
                image={bottle.image}
                x={bottle.x}
                y={bottle.y}
                rotation={bottle.rotation}
                scale={bottle.scale}
                bobDuration={bottle.bobDuration}
                bobDelay={bottle.bobDelay}
                parallaxRate={bottle.parallaxRate}
                opacity={bottle.opacity}
                scrollY={scrollProgress}
              />
            ))}
          </div>

          {/* ── Content ── */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4" style={{ zIndex: 10 }}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              Find Your Perfect<br />
              <span className="bg-clip-text text-transparent" style={{
                backgroundImage: "linear-gradient(135deg, #7dd3fc, #38bdf8, #0ea5e9, #0284c7)",
                WebkitBackgroundClip: "text",
              }}>Water</span>
            </h1>
            <p className="mt-6 max-w-xl text-base sm:text-lg text-white/85 leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
              Compare mineral water brands by mineral content.
              <br className="hidden sm:block" />
              Track your hydration. Discover what&apos;s in every bottle.
            </p>
            <div className="mt-4 h-6 overflow-hidden">
              <span className="text-sm font-medium tracking-[0.2em] uppercase text-white/40">
                {bottles.map((b) => b.name).join(" · ")}
              </span>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Link href="/brands" className="px-8 py-3.5 bg-white text-[#053d66] font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105">
                Explore Brands
              </Link>
              <Link href="/tracker" className="px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-full backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:border-white/50 hover:scale-105">
                Start Tracking
              </Link>
            </div>
          </div>

          {/* ── Bottom fade ── */}
          <div className="absolute bottom-0 left-0 right-0 h-32" style={{
            background: "linear-gradient(to bottom, transparent, var(--background))", zIndex: 15,
          }} />

          {/* ── Scroll hint ── */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ zIndex: 20 }}>
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
    </>
  );
}
