"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const comparisonCards = [
  {
    name: "Smartwater",
    image: "/images/smartwater.png",
    value: "0",
    label: "mg/L magnesium",
  },
  {
    name: "Gerolsteiner",
    image: "/images/gerolsteiner.png",
    value: "108",
    label: "mg/L magnesium",
  },
] as const;

type MineralCard = {
  href: string;
  icon: string;
  eyebrow: string;
  eyebrowClass: string;
  title: string;
  description: string;
  rangeValue: string;
  trailingText?: string;
};

const mineralCards: MineralCard[] = [
  {
    href: "/minerals/calcium",
    icon: "\u{1F9B4}",
    eyebrow: "Weak bones?",
    eyebrowClass: "text-amber-500",
    title: "Calcium",
    description: "Builds bone density and supports muscle contraction.",
    rangeValue: "0 \u2013 348 mg/L",
  },
  {
    href: "/minerals/magnesium",
    icon: "\u{1F634}",
    eyebrow: "Poor sleep?",
    eyebrowClass: "text-violet-500",
    title: "Magnesium",
    description: "Improves sleep, reduces cramps, powers 300+ enzymes.",
    rangeValue: "0 \u2013 108 mg/L",
    trailingText: "Low energy?",
  },
  {
    href: "/minerals/sodium",
    icon: "\u2764\uFE0F\u200D\u{1FA79}",
    eyebrow: "High blood pressure?",
    eyebrowClass: "text-rose-500",
    title: "Sodium",
    description: "Essential for nerves, but some waters have 20x more than others.",
    rangeValue: "0 \u2013 118 mg/L",
  },
  {
    href: "/minerals/bicarbonate",
    icon: "\u{1F3C3}\u200D\u2642\uFE0F",
    eyebrow: "Post-workout",
    eyebrowClass: "text-orange-500",
    title: "Bicarbonate",
    description: "Neutralizes lactic acid. Athletes use it for faster recovery.",
    rangeValue: "0 \u2013 1,816 mg/L",
    trailingText: "fatigue?",
  },
  {
    href: "/minerals/silica",
    icon: "\u2728",
    eyebrow: "Dull skin?",
    eyebrowClass: "text-pink-500",
    title: "Silica",
    description: "Boosts skin elasticity, hair thickness, and nail strength.",
    rangeValue: "0 \u2013 93 mg/L",
    trailingText: "Brittle nails?",
  },
  {
    href: "/minerals/potassium",
    icon: "\u{1F4AA}",
    eyebrow: "Muscle cramps?",
    eyebrowClass: "text-emerald-500",
    title: "Potassium",
    description: "Balances sodium and regulates heart rhythm.",
    rangeValue: "0.3 \u2013 11 mg/L",
    trailingText: "Irregular heartbeat?",
  },
];

export function HomePinnedStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current || !pinRef.current) {
        return;
      }

      const q = gsap.utils.selector(sectionRef.current);
      const introPanel = q("[data-panel='intro']")[0] as HTMLDivElement | undefined;
      const introHeading = q("[data-intro-heading]")[0] as HTMLDivElement | undefined;
      const introCards = q("[data-compare-card]") as HTMLDivElement[];
      const introMeta = q("[data-intro-meta]")[0] as HTMLDivElement | undefined;
      const mineralsPanel = q("[data-panel='minerals']")[0] as HTMLDivElement | undefined;
      const mineralHeader = q("[data-mineral-header]")[0] as HTMLDivElement | undefined;
      const mineralPairs = [0, 1, 2].map((index) =>
        q(`[data-mineral-pair='${index}']`) as HTMLAnchorElement[],
      );
      const mineralCta = q("[data-mineral-cta]")[0] as HTMLDivElement | undefined;

      if (
        !introPanel ||
        !introHeading ||
        !introMeta ||
        !mineralsPanel ||
        !mineralHeader ||
        !mineralCta
      ) {
        return;
      }

      gsap.set(pinRef.current, { minHeight: "100svh" });
      gsap.set([introPanel, mineralsPanel], {
        position: "absolute",
        inset: 0,
        width: "100%",
      });
      gsap.set(introHeading, { autoAlpha: 0.45, y: 36 });
      gsap.set(introCards, { autoAlpha: 0, y: 56 });
      gsap.set(introMeta, { autoAlpha: 0, y: 28 });
      gsap.set(mineralsPanel, { autoAlpha: 0 });
      gsap.set(mineralHeader, { autoAlpha: 0, y: 52 });
      gsap.set(mineralPairs.flat(), { autoAlpha: 0, y: 46 });
      gsap.set(mineralCta, { autoAlpha: 0, y: 28 });

      const timeline = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: pinRef.current,
          start: "top top",
          end: () =>
            `+=${Math.round(
              window.innerHeight * (window.innerWidth < 768 ? 4.4 : 3.6),
            )}`,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .to(introHeading, {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
        })
        .to(
          introCards,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.18,
          },
          ">-0.15",
        )
        .to(
          introMeta,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
          },
          ">-0.1",
        )
        .to(
          introPanel,
          {
            autoAlpha: 0,
            yPercent: -10,
            duration: 0.8,
          },
          ">0.45",
        )
        .set(mineralsPanel, { autoAlpha: 1 }, "<0.05")
        .to(
          mineralHeader,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
          },
          "<0.12",
        )
        .to(
          mineralPairs[0],
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.1,
          },
          ">-0.08",
        )
        .to(
          mineralPairs[1],
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.1,
          },
          ">0.1",
        )
        .to(
          mineralPairs[2],
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.1,
          },
          ">0.1",
        )
        .to(
          mineralCta,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.4,
          },
          ">0.12",
        );

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-x-hidden bg-background"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/85 via-white/45 to-transparent"
        aria-hidden="true"
      />
      <div ref={pinRef} className="relative">
        <div
          data-panel="intro"
          className="relative py-20 md:flex md:min-h-[100svh] md:items-center"
        >
          <div className="mx-auto w-full max-w-5xl px-4">
            <div className="flex min-h-[48rem] flex-col justify-center gap-10 md:min-h-[72svh] md:gap-14">
              <div data-intro-heading>
                <h2 className="text-center text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                  You drink 2 liters a day.
                  <br />
                  <span>Do you know what&apos;s in it?</span>
                </h2>
              </div>

              <div className="pt-2 md:pt-0">
                <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-around">
                  {comparisonCards.map((card) => (
                    <div
                      key={card.name}
                      data-compare-card
                      className="w-48 rounded-2xl border border-border/70 bg-background/60 p-5 text-center"
                    >
                      <div className="relative mb-4 h-36 w-full">
                        <Image
                          src={card.image}
                          alt={`${card.name} bottle`}
                          fill
                          className="object-contain"
                          sizes="192px"
                        />
                      </div>
                      <p className="text-sm font-medium">{card.name}</p>
                      <p className="mt-2 text-3xl font-bold text-ocean-surface">
                        {card.value}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {card.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div data-intro-meta>
                  <p className="mt-6 text-center text-xs text-muted-foreground">
                    That&apos;s 26% of your daily magnesium from something
                    you&apos;re already drinking.
                  </p>

                  <div className="mt-8 text-center">
                    <Link
                      href="/compare"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Compare any two brands &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          data-panel="minerals"
          className="relative py-20 md:flex md:min-h-[100svh] md:items-center"
        >
          <div className="mx-auto w-full max-w-7xl px-4">
            <div className="flex min-h-[48rem] flex-col justify-center gap-8 md:min-h-[72svh] md:translate-y-[5vh] md:gap-10">
            <div data-mineral-header>
              <h2 className="mb-5 text-center text-3xl font-bold md:text-4xl">
                Every Sip Can Do More
              </h2>
              <p className="mx-auto max-w-xl text-center text-muted-foreground">
                The right minerals work for you all day if you know what to look
                for.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mineralCards.map((card, index) => (
                <Link
                  key={card.title}
                  href={card.href}
                  data-mineral-pair={Math.floor(index / 2)}
                  className="group"
                >
                  <div className="glass-card h-full p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:p-4">
                    <span className="mb-2 block text-2xl">{card.icon}</span>
                    <p className="mb-2 text-base font-semibold sm:text-lg">
                      <span className={card.eyebrowClass}>{card.eyebrow}</span>{" "}
                      {card.trailingText}
                    </p>
                    <h3 className="mb-2 text-xl font-bold text-ocean-surface transition-colors group-hover:text-ocean-mid md:text-[1.35rem]">
                      {card.title}
                    </h3>
                    <p className="mb-3 text-sm text-muted-foreground">
                      {card.description}
                    </p>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <span className="text-xs text-muted-foreground">
                        Brand range
                      </span>
                      <span className="text-sm font-bold text-ocean-surface">
                        {card.rangeValue}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div data-mineral-cta className="mt-12 text-center">
              <Link
                href="/minerals"
                className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
              >
                See the full mineral guide &rarr;
              </Link>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
