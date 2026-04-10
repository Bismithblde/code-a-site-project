interface WaveDividerProps {
  variant?: "gentle" | "choppy" | "deep";
  flip?: boolean;
  className?: string;
}

const waves = {
  gentle:
    "M0,64 C320,100 640,20 960,64 C1280,108 1600,20 1920,64 L1920,0 L0,0 Z",
  choppy:
    "M0,48 C160,96 320,0 480,48 C640,96 800,0 960,48 C1120,96 1280,0 1440,48 C1600,96 1760,0 1920,48 L1920,0 L0,0 Z",
  deep: "M0,80 C480,160 960,0 1440,80 C1680,120 1800,40 1920,80 L1920,0 L0,0 Z",
};

export function WaveDivider({
  variant = "gentle",
  flip = false,
  className,
}: WaveDividerProps) {
  return (
    <div
      className={`relative w-full overflow-hidden leading-none ${
        flip ? "rotate-180" : ""
      } ${className ?? ""}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1920 120"
        preserveAspectRatio="none"
        className="w-full h-16 md:h-24"
      >
        <path
          d={waves[variant]}
          className="fill-background animate-wave-slow"
        />
        <path
          d={waves[variant]}
          className="fill-background/60 animate-wave-medium"
          style={{ transform: "translateX(-50px)" }}
        />
      </svg>
    </div>
  );
}
