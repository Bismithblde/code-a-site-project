"use client";

import { useState, useCallback } from "react";
import { Search, AlertTriangle, CheckCircle, Eye, ExternalLink, Droplets, Users, MapPin, Shield } from "lucide-react";
import { WaterQualityMap } from "@/components/WaterQualityMap";

interface WaterSystem {
  pwsid: string;
  name: string;
  type: string;
  source: string;
  populationServed: number | null;
  state: string;
  citiesServed: string | null;
  countiesServed: string | null;
  owner: string;
  serviceArea: string | null;
  status: "good" | "watch" | "alert";
  isSeriousViolator: boolean;
  hasHealthViolation: boolean;
  hasCurrentViolation: boolean;
  leadViolation: boolean;
  copperViolation: boolean;
  quartersWithViolations: number;
  rulesViolated3yr: number;
  contaminantsInCurrentViolation: string[];
  contaminantsInViolation3yr: string[];
  violationCategories: string[];
  complianceHistory: string;
  detailUrl: string;
}

interface SearchResult {
  systems: WaterSystem[];
  query: { state?: string; county?: string; city?: string };
  totalSystems: number;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

function StatusBadge({ status }: { status: WaterSystem["status"] }) {
  if (status === "alert") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        <AlertTriangle className="size-3" />
        Violations Found
      </span>
    );
  }
  if (status === "watch") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <Eye className="size-3" />
        Under Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
      <CheckCircle className="size-3" />
      Compliant
    </span>
  );
}

function SystemCard({ system }: { system: WaterSystem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card p-5 transition-all duration-200 hover:shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold truncate">{system.name}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {system.citiesServed ?? system.countiesServed ?? system.state} · {system.source}
          </p>
        </div>
        <StatusBadge status={system.status} />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
            <Users className="size-3" /> Population
          </div>
          <p className="text-sm font-semibold">
            {system.populationServed ? system.populationServed.toLocaleString() : "N/A"}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
            <Droplets className="size-3" /> Source
          </div>
          <p className="text-sm font-semibold">{system.source}</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
            <Shield className="size-3" /> Violations (3yr)
          </div>
          <p className={`text-sm font-semibold ${system.rulesViolated3yr > 0 ? "text-red-500" : "text-green-600"}`}>
            {system.rulesViolated3yr}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
            <MapPin className="size-3" /> Owner
          </div>
          <p className="text-sm font-semibold truncate">{system.owner}</p>
        </div>
      </div>

      {/* Warnings */}
      {(system.leadViolation || system.copperViolation || system.contaminantsInCurrentViolation.length > 0) && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Active Concerns:</p>
          <ul className="text-xs text-red-600/80 dark:text-red-400/80 space-y-0.5">
            {system.leadViolation && <li>· Lead violation detected</li>}
            {system.copperViolation && <li>· Copper violation detected</li>}
            {system.contaminantsInCurrentViolation.map((c) => (
              <li key={c}>· {c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable detail */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-primary hover:underline mb-2"
      >
        {expanded ? "Hide details" : "Show more details"}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-muted-foreground">System ID:</span> {system.pwsid}</div>
            <div><span className="text-muted-foreground">Type:</span> {system.type}</div>
            <div><span className="text-muted-foreground">Counties:</span> {system.countiesServed ?? "N/A"}</div>
            <div><span className="text-muted-foreground">Service Area:</span> {system.serviceArea ?? "N/A"}</div>
            <div><span className="text-muted-foreground">Serious Violator:</span> {system.isSeriousViolator ? "Yes" : "No"}</div>
            <div><span className="text-muted-foreground">Qtrs w/ Violations:</span> {system.quartersWithViolations}</div>
          </div>

          {system.contaminantsInViolation3yr.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Contaminants in violation (3yr):</p>
              <div className="flex flex-wrap gap-1">
                {system.contaminantsInViolation3yr.map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">{c}</span>
                ))}
              </div>
            </div>
          )}

          {system.complianceHistory && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">3-Year Compliance History (quarters):</p>
              <div className="flex gap-0.5">
                {system.complianceHistory.split("").slice(0, 12).map((char, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-sm text-[9px] flex items-center justify-center font-mono ${
                      char === "V" || char === "S"
                        ? "bg-red-500/20 text-red-600"
                        : char === " " || char === "_"
                          ? "bg-muted text-muted-foreground"
                          : "bg-green-500/20 text-green-600"
                    }`}
                    title={`Quarter ${i + 1}: ${char === "V" ? "Violation" : char === "S" ? "Serious" : "Compliant"}`}
                  >
                    {char === " " || char === "_" ? "·" : char}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">V = violation, S = serious, green = compliant</p>
            </div>
          )}

          <a
            href={system.detailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="size-3" />
            View full EPA report
          </a>
        </div>
      )}
    </div>
  );
}

export function EpaSearchClient() {
  const [selectedState, setSelectedState] = useState("");
  const [county, setCounty] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = useCallback(async () => {
    if (!selectedState) { setError("Please select a state."); return; }
    setError("");
    setLoading(true);
    setResults(null);

    try {
      const params = new URLSearchParams({ state: selectedState });
      if (county.trim()) params.set("county", county.trim().toUpperCase());

      const res = await fetch(`/api/water-quality?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Search failed");
      }
      const data: SearchResult = await res.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedState, county]);

  return (
    <div>
      {/* Search form */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-lg font-bold mb-1">Search Your Water System</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Find your local water utility&apos;s compliance record from the EPA&apos;s enforcement database.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="h-11 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary flex-1 sm:max-w-[200px]"
          >
            <option value="">Select state...</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <input
            type="text"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            placeholder="County (optional, e.g. Los Angeles)"
            className="h-11 px-4 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />

          <button
            onClick={handleSearch}
            disabled={loading || !selectedState}
            className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Searching EPA...
              </>
            ) : (
              <>
                <Search className="size-4" />
                Search
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}
      </div>

      {/* Results */}
      {results && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">
              {results.totalSystems} Water System{results.totalSystems !== 1 ? "s" : ""} Found
            </h3>
            <p className="text-xs text-muted-foreground">
              Source: EPA ECHO · SDWA Compliance Data
            </p>
          </div>

          {/* Map visualization */}
          {results.systems.length > 0 && results.query.state && (
            <WaterQualityMap systems={results.systems} stateCode={results.query.state} />
          )}

          {results.systems.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground">No water systems found. Try a different county or leave county blank to see all systems in the state.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.systems.map((system) => (
                <SystemCard key={system.pwsid} system={system} />
              ))}
            </div>
          )}

          <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground">
              Data from the EPA Enforcement & Compliance History Online (ECHO) database, Safe Drinking Water Act (SDWA) program.
              For personalized contaminant reports, visit{" "}
              <a href="https://www.ewg.org/tapwater/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                EWG Tap Water Database
              </a>.
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!results && !loading && (
        <div className="text-center py-12">
          <Droplets className="size-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">Check Your Water Quality</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Select your state and optionally narrow by county to find water systems serving your area.
            We pull real compliance data from the EPA&apos;s enforcement database.
          </p>
        </div>
      )}
    </div>
  );
}
