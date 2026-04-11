"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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
  const radius = 0.3 + (hash % 1000) / 1000 * 1.5; // 0.3 to 1.8 degrees spread

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
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      className="w-full h-[400px] z-0"
      style={{ background: "#0a1628" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {systems.map((system, index) => {
        const position = getSystemPosition(system, center, index, systems.length);
        const color = statusColors[system.status];
        const radius = getMarkerRadius(system.populationServed);

        return (
          <CircleMarker
            key={system.pwsid}
            center={position}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.6,
              weight: 2,
              opacity: 0.8,
            }}
          >
            <Popup>
              <div className="min-w-[200px] text-sm">
                <h4 className="font-bold text-foreground mb-1">{system.name}</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {system.citiesServed ?? system.countiesServed ?? "Unknown area"} · {system.source}
                </p>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Population:</span>
                    <span className="font-medium">
                      {system.populationServed?.toLocaleString() ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span
                      className="font-semibold"
                      style={{ color }}
                    >
                      {system.status === "alert"
                        ? "Violations"
                        : system.status === "watch"
                          ? "Under Review"
                          : "Compliant"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Violations (3yr):</span>
                    <span className="font-medium">{system.rulesViolated3yr}</span>
                  </div>
                  {system.leadViolation && (
                    <p className="text-red-500 font-semibold mt-1">Lead violation detected</p>
                  )}
                  {system.copperViolation && (
                    <p className="text-red-500 font-semibold">Copper violation detected</p>
                  )}
                </div>

                <a
                  href={system.detailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-blue-500 hover:underline"
                >
                  View EPA Report →
                </a>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
