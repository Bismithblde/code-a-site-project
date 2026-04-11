"use client";

import { useMemo, useState } from "react";

interface WaterSystem {
  pwsid: string;
  name: string;
  status: "good" | "watch" | "alert";
  populationServed: number | null;
  source: string;
  citiesServed: string | null;
  countiesServed: string | null;
  hasHealthViolation: boolean;
  leadViolation: boolean;
  copperViolation: boolean;
  rulesViolated3yr: number;
  contaminantsInCurrentViolation: string[];
  detailUrl: string;
}

interface Props {
  systems: WaterSystem[];
  center: [number, number];
  zoom: number;
}

const statusColors = {
  alert: "#ef4444",
  watch: "#f59e0b",
  good: "#22c55e",
};

// Generate deterministic pseudo-random positions around the state center
// since we don't have exact lat/lng for each system
function getSystemPosition(
  system: WaterSystem,
  center: [number, number],
  index: number,
  total: number,
): [number, number] {
  // Use a hash of the PWSID for consistent positioning
  let hash = 0;
  for (let i = 0; i < system.pwsid.length; i++) {
    hash = (hash << 5) - hash + system.pwsid.charCodeAt(i);
    hash |= 0;
  }

  // Spread markers in a spiral pattern around the center
  const angle = (index / total) * Math.PI * 2 + (hash % 100) / 100;
  const radius = 0.3 + ((hash % 1000) / 1000) * 1.5; // 0.3 to 1.8 degrees spread

  return [
    center[0] + Math.cos(angle) * radius,
    center[1] + Math.sin(angle) * radius * 1.3, // Wider horizontal spread
  ];
}

function getMarkerRadius(populationServed: number | null): number {
  if (!populationServed) return 6;
  if (populationServed > 1_000_000) return 18;
  if (populationServed > 500_000) return 14;
  if (populationServed > 100_000) return 11;
  if (populationServed > 10_000) return 8;
  return 6;
}

export default function WaterQualityMapInner({ systems, center, zoom }: Props) {
  const [selectedPwsid, setSelectedPwsid] = useState<string | null>(null);

  const positionedSystems = useMemo(() => {
    return systems.map((system, index) => {
      const [lat, lng] = getSystemPosition(system, center, index, systems.length);
      // Map pseudo coordinates into a visible 0-100% viewport.
      const x = Math.max(3, Math.min(97, 50 + ((lng - center[1]) * 18) / Math.max(1, zoom)));
      const y = Math.max(6, Math.min(94, 50 - ((lat - center[0]) * 22) / Math.max(1, zoom)));
      return { system, x, y };
    });
  }, [systems, center, zoom]);

  const selected = selectedPwsid
    ? systems.find((system) => system.pwsid === selectedPwsid) ?? null
    : null;

  return (
    <div className="w-full h-[400px] z-0 relative overflow-hidden bg-[#0a1628]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(14,116,144,0.22),transparent_55%),linear-gradient(180deg,#0c1f34_0%,#0a1628_100%)]" />
      <div className="absolute inset-0 opacity-25 [background-size:40px_40px] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]" />

      {positionedSystems.map(({ system, x, y }) => {
        const color = statusColors[system.status];
        const size = getMarkerRadius(system.populationServed) * 2;
        const selectedMarker = selectedPwsid === system.pwsid;

        return (
          <button
            type="button"
            key={system.pwsid}
            className="absolute rounded-full border border-white/30 shadow-[0_0_0_2px_rgba(0,0,0,0.2)] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${size}px`,
              height: `${size}px`,
              transform: "translate(-50%, -50%)",
              backgroundColor: color,
              opacity: selectedMarker ? 1 : 0.85,
              boxShadow: selectedMarker
                ? `0 0 0 3px ${color}66, 0 0 24px ${color}88`
                : `0 0 0 1px ${color}66`,
            }}
            onClick={() => setSelectedPwsid(system.pwsid)}
            title={`${system.name} (${system.pwsid})`}
          >
            <span className="sr-only">View details for {system.name}</span>
          </button>
        );
      })}

      <div className="absolute left-3 top-3 rounded-md border border-white/15 bg-black/30 px-2 py-1 text-[11px] text-white/75 backdrop-blur-sm">
        Interactive coverage map
      </div>

      <div className="absolute right-3 bottom-3 w-[min(92%,340px)] rounded-lg border border-white/15 bg-[#071322]/92 p-3 text-white shadow-xl backdrop-blur-sm">
        {selected ? (
          <div className="space-y-1.5 text-xs">
            <h4 className="text-sm font-semibold text-white">{selected.name}</h4>
            <p className="text-white/70">
              {selected.citiesServed ?? selected.countiesServed ?? "Unknown area"} | {selected.source}
            </p>
            <p className="text-white/70">
              Population: {selected.populationServed?.toLocaleString() ?? "N/A"}
            </p>
            <p className="text-white/70">Violations (3yr): {selected.rulesViolated3yr}</p>
            {selected.leadViolation ? (
              <p className="font-semibold text-red-300">Lead violation detected</p>
            ) : null}
            {selected.copperViolation ? (
              <p className="font-semibold text-red-300">Copper violation detected</p>
            ) : null}
            <a
              href={selected.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block pt-1 text-sky-300 hover:text-sky-200 hover:underline"
            >
              View EPA report
            </a>
          </div>
        ) : (
          <p className="text-xs text-white/75">Select a marker to view system details.</p>
        )}
      </div>
    </div>
  );
}
