"use client";

import { useMemo, useState } from "react";
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

const statusColors: Record<string, string> = {
  alert: "#ef4444",
  watch: "#f59e0b",
  good: "#22c55e",
};

const statusLabels: Record<string, string> = {
  alert: "Alert",
  watch: "Watch",
  good: "Good",
};

/**
 * Generate a deterministic position for a water system around the state center.
 * Since EPA data doesn't include lat/lng, we spread markers based on PWSID hash.
 */
function getSystemPosition(
  system: WaterSystem,
  center: [number, number],
  index: number,
  total: number,
): [number, number] {
  let hash = 0;
  for (let i = 0; i < system.pwsid.length; i++) {
    hash = (hash << 5) - hash + system.pwsid.charCodeAt(i);
    hash |= 0;
  }

  const angle = (index / total) * Math.PI * 2 + (hash % 100) / 100;
  const radius = 0.3 + ((Math.abs(hash) % 1000) / 1000) * 1.5;

  return [
    center[0] + Math.cos(angle) * radius,
    center[1] + Math.sin(angle) * radius * 1.3,
  ];
}

function getMarkerRadius(populationServed: number | null): number {
  if (!populationServed) return 6;
  if (populationServed > 1_000_000) return 14;
  if (populationServed > 500_000) return 11;
  if (populationServed > 100_000) return 9;
  if (populationServed > 10_000) return 7;
  return 5;
}

export default function WaterQualityMapInner({ systems, center, zoom }: Props) {
  const [selectedPwsid, setSelectedPwsid] = useState<string | null>(null);

  const positionedSystems = useMemo(() => {
    return systems.map((system, index) => {
      const position = getSystemPosition(system, center, index, systems.length);
      return { system, position };
    });
  }, [systems, center]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-[400px] z-0"
      scrollWheelZoom={false}
      style={{ background: "#0a1628" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />

      {positionedSystems.map(({ system, position }) => {
        const color = statusColors[system.status];
        const radius = getMarkerRadius(system.populationServed);
        const isSelected = selectedPwsid === system.pwsid;

        return (
          <CircleMarker
            key={system.pwsid}
            center={position}
            radius={isSelected ? radius + 3 : radius}
            pathOptions={{
              color: isSelected ? "#fff" : color,
              fillColor: color,
              fillOpacity: 0.85,
              weight: isSelected ? 2 : 1,
            }}
            eventHandlers={{
              click: () => setSelectedPwsid(system.pwsid),
            }}
          >
            <Popup>
              <div className="text-sm space-y-1 min-w-[200px]">
                <h4 className="font-bold text-base">{system.name}</h4>
                <p className="text-gray-600">
                  {system.citiesServed ?? system.countiesServed ?? "Unknown area"} &middot; {system.source}
                </p>
                <p className="text-gray-600">
                  Population: {system.populationServed?.toLocaleString() ?? "N/A"}
                </p>
                <p>
                  Status:{" "}
                  <span
                    className="font-semibold"
                    style={{ color }}
                  >
                    {statusLabels[system.status]}
                  </span>
                </p>
                {system.rulesViolated3yr > 0 && (
                  <p className="text-gray-600">Violations (3yr): {system.rulesViolated3yr}</p>
                )}
                {system.leadViolation && (
                  <p className="font-semibold text-red-600">Lead violation detected</p>
                )}
                {system.copperViolation && (
                  <p className="font-semibold text-red-600">Copper violation detected</p>
                )}
                <a
                  href={system.detailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 text-blue-600 hover:underline"
                >
                  View EPA report &rarr;
                </a>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
