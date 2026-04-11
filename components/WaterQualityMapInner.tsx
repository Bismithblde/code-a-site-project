"use client";

import { useCallback, useMemo, useState } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import {
  getApproximateCoveragePoint,
  getMarkerRadius,
  getStateCenter,
  type WaterQualityMapSystem,
} from "@/lib/epa/coverage-map";

interface Props {
  systems: WaterQualityMapSystem[];
  stateCode: string;
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

function getSystemPosition(
  system: WaterQualityMapSystem,
  index: number,
  total: number,
): { lat: number; lng: number } {
  if (Number.isFinite(system.latitude) && Number.isFinite(system.longitude)) {
    return { lat: system.latitude, lng: system.longitude };
  }
  const [lat, lng] = getApproximateCoveragePoint(system.pwsid, system.state, index, total);
  return { lat, lng };
}

function SystemMarker({
  system,
  position,
  isSelected,
  onSelect,
}: {
  system: WaterQualityMapSystem;
  position: { lat: number; lng: number };
  isSelected: boolean;
  onSelect: () => void;
}) {
  const color = statusColors[system.status];
  const size = getMarkerRadius(system.populationServed) * 2;

  return (
    <AdvancedMarker position={position} onClick={onSelect}>
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          borderRadius: "50%",
          border: isSelected ? "3px solid white" : `2px solid ${color}`,
          boxShadow: isSelected
            ? `0 0 0 2px ${color}, 0 0 12px ${color}88`
            : `0 0 6px ${color}66`,
          cursor: "pointer",
          transition: "transform 0.15s",
          transform: isSelected ? "scale(1.3)" : "scale(1)",
        }}
      />
    </AdvancedMarker>
  );
}

function MapContent({
  systems,
  stateCode,
}: {
  systems: WaterQualityMapSystem[];
  stateCode: string;
}) {
  const [selectedPwsid, setSelectedPwsid] = useState<string | null>(null);
  const map = useMap();

  const positionedSystems = useMemo(
    () =>
      systems.map((system, index) => ({
        system,
        position: getSystemPosition(system, index, systems.length),
      })),
    [systems],
  );

  const selected = useMemo(() => {
    if (!selectedPwsid) return null;
    return positionedSystems.find((p) => p.system.pwsid === selectedPwsid) ?? null;
  }, [selectedPwsid, positionedSystems]);

  // Fit bounds to all markers
  const fitBounds = useCallback(() => {
    if (!map || positionedSystems.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    for (const { position } of positionedSystems) {
      bounds.extend(position);
    }
    map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
  }, [map, positionedSystems]);

  // Fit on first render
  useMemo(() => {
    if (map && positionedSystems.length > 0) {
      setTimeout(fitBounds, 100);
    }
  }, [map, fitBounds, positionedSystems.length]);

  return (
    <>
      {positionedSystems.map(({ system, position }) => (
        <SystemMarker
          key={system.pwsid}
          system={system}
          position={position}
          isSelected={selectedPwsid === system.pwsid}
          onSelect={() => setSelectedPwsid(system.pwsid)}
        />
      ))}

      {selected && (
        <InfoWindow
          position={selected.position}
          onCloseClick={() => setSelectedPwsid(null)}
        >
          <div className="text-sm space-y-1 min-w-[200px] text-gray-900">
            <h4 className="font-bold text-base">{selected.system.name}</h4>
            <p className="text-gray-600">
              {selected.system.coordinateLabel ??
                selected.system.citiesServed ??
                selected.system.countiesServed ??
                "Unknown area"}{" "}
              &middot; {selected.system.source}
            </p>
            <p className="text-gray-600">
              Population: {selected.system.populationServed?.toLocaleString() ?? "N/A"}
            </p>
            <p>
              Status:{" "}
              <span className="font-semibold" style={{ color: statusColors[selected.system.status] }}>
                {statusLabels[selected.system.status]}
              </span>
            </p>
            {selected.system.rulesViolated3yr > 0 && (
              <p className="text-gray-600">
                Violations (3yr): {selected.system.rulesViolated3yr}
              </p>
            )}
            {selected.system.leadViolation && (
              <p className="font-semibold text-red-600">Lead violation detected</p>
            )}
            {selected.system.copperViolation && (
              <p className="font-semibold text-red-600">Copper violation detected</p>
            )}
            <a
              href={selected.system.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 text-blue-600 hover:underline"
            >
              View EPA report &rarr;
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function WaterQualityMapInner({ systems, stateCode }: Props) {
  const center = getStateCenter(stateCode);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  if (!apiKey) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">Google Maps API key not configured</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={{ lat: center[0], lng: center[1] }}
        defaultZoom={7}
        mapId="water-quality-map"
        style={{ width: "100%", height: "400px" }}
        gestureHandling="cooperative"
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        colorScheme="DARK"
      >
        <MapContent systems={systems} stateCode={stateCode} />
      </Map>
    </APIProvider>
  );
}
