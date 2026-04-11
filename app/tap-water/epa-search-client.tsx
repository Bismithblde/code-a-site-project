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

interface DetailData {
  leadAndCopper?: {
    leadSamples: { value: string; units: string; dates: string }[];
    copperSamples: { value: string; units: string; dates: string }[];
    leadActionLevel: string | null;
    copperActionLevel: string | null;
  };
  violations?: {
    violationId: string;
    beginDate: string | null;
    federalRule: string;
    contaminantName: string;
    categoryDesc: string;
    measure: string | null;
    federalMCL: string | null;
    status: string;
    enforcementActions: { date: string; type: string; desc: string; agency: string }[];
  }[];
}

function SystemCard({ system }: { system: WaterSystem }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    if (detail) { setExpanded(true); return; }
    setExpanded(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/water-quality/${system.pwsid}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } catch { /* ignore */ }
    setDetailLoading(false);
  }, [system.pwsid, detail]);

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
        onClick={() => expanded ? setExpanded(false) : loadDetail()}
        className="text-xs text-primary hover:underline mb-2"
      >
        {expanded ? "Hide details" : "View detailed report"}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border space-y-4 text-sm">
          {/* System info grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-muted-foreground">System ID:</span> {system.pwsid}</div>
            <div><span className="text-muted-foreground">Type:</span> {system.type}</div>
            <div><span className="text-muted-foreground">Counties:</span> {system.countiesServed ?? "N/A"}</div>
            <div><span className="text-muted-foreground">Service Area:</span> {system.serviceArea ?? "N/A"}</div>
          </div>

          {detailLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading lead/copper test data and violations from EPA...
            </div>
          )}

          {/* Lead & Copper Test Results */}
          {detail?.leadAndCopper && (detail.leadAndCopper.leadSamples.length > 0 || detail.leadAndCopper.copperSamples.length > 0) && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Lead & Copper Test Results (90th Percentile)
              </h4>

              {detail.leadAndCopper.leadSamples.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Lead (Action Level: {detail.leadAndCopper.leadActionLevel ?? "0.015 mg/L"})
                  </p>
                  <div className="space-y-1">
                    {detail.leadAndCopper.leadSamples.map((sample, i) => {
                      const val = parseFloat(sample.value);
                      const actionLevel = parseFloat(detail.leadAndCopper?.leadActionLevel?.replace(/[^\d.]/g, "") ?? "0.015");
                      const exceeds = val >= actionLevel;
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className={`font-mono font-bold ${exceeds ? "text-red-500" : "text-green-600"}`}>
                            {sample.value} {sample.units}
                          </span>
                          {exceeds && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-semibold">EXCEEDS ACTION LEVEL</span>}
                          <span className="text-muted-foreground">{sample.dates}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {detail.leadAndCopper.copperSamples.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Copper (Action Level: {detail.leadAndCopper.copperActionLevel ?? "1.3 mg/L"})
                  </p>
                  <div className="space-y-1">
                    {detail.leadAndCopper.copperSamples.map((sample, i) => {
                      const val = parseFloat(sample.value);
                      const actionLevel = parseFloat(detail.leadAndCopper?.copperActionLevel?.replace(/[^\d.]/g, "") ?? "1.3");
                      const exceeds = val >= actionLevel;
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className={`font-mono font-bold ${exceeds ? "text-red-500" : "text-green-600"}`}>
                            {sample.value} {sample.units}
                          </span>
                          {exceeds && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-semibold">EXCEEDS</span>}
                          <span className="text-muted-foreground">{sample.dates}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Violation Details */}
          {detail?.violations && detail.violations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Violation History ({detail.violations.length} record{detail.violations.length !== 1 ? "s" : ""})
              </h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {detail.violations.map((v, i) => (
                  <div key={v.violationId || i} className="rounded-lg border border-border p-3 text-xs">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold">{v.contaminantName || v.federalRule}</p>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        v.status === "Addressed" ? "bg-green-500/10 text-green-600"
                          : v.status === "Resolved" ? "bg-green-500/10 text-green-600"
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {v.status || "Open"}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{v.categoryDesc}</p>
                    {v.beginDate && <p className="text-muted-foreground mt-0.5">Date: {v.beginDate}</p>}
                    {v.federalMCL && <p className="text-muted-foreground">Federal MCL: {v.federalMCL}</p>}
                    {v.measure && <p className="text-muted-foreground">Measured: {v.measure}</p>}
                    {v.enforcementActions.length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-border">
                        <p className="text-muted-foreground font-medium">Enforcement:</p>
                        {v.enforcementActions.map((ea, j) => (
                          <p key={j} className="text-muted-foreground">
                            {ea.date} — {ea.desc} ({ea.agency})
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No detail data */}
          {detail && !detail.leadAndCopper && (!detail.violations || detail.violations.length === 0) && (
            <p className="text-xs text-muted-foreground">No detailed contaminant data available for this system.</p>
          )}

          {/* Compliance history */}
          {system.complianceHistory && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">3-Year Compliance History (quarters):</p>
              <div className="flex gap-0.5">
                {system.complianceHistory.split("").slice(0, 12).map((char, i) => (
                  <div key={i} className={`w-4 h-4 rounded-sm text-[9px] flex items-center justify-center font-mono ${
                    char === "V" || char === "S" ? "bg-red-500/20 text-red-600"
                      : char === " " || char === "_" ? "bg-muted text-muted-foreground"
                      : "bg-green-500/20 text-green-600"
                  }`} title={`Quarter ${i + 1}`}>
                    {char === " " || char === "_" ? "·" : char}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <a href={system.detailUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
              <ExternalLink className="size-3" /> Full EPA report
            </a>
            <a href={`https://www.ewg.org/tapwater/system.php?pws=${system.pwsid}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
              <ExternalLink className="size-3" /> EWG report
            </a>
          </div>
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
