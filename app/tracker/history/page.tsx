"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollReveal } from "@/components/animation/ScrollReveal";
import Link from "next/link";
import type { HydrationEntry } from "@/lib/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DailyTotal {
  date: string;
  total: number;
}

type RangeOption = 7 | 14 | 30;

export default function HistoryPage() {
  const [range, setRange] = useState<RangeOption>(7);
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [recentEntries, setRecentEntries] = useState<HydrationEntry[]>([]);
  const [dailyGoal, setDailyGoal] = useState(2500);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, profileRes] = await Promise.all([
        fetch(`/api/tracker/stats?days=${range}`),
        fetch("/api/user/profile"),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        // Build daily totals from stats response
        const totals: DailyTotal[] = data.stats?.daily_totals ?? [];
        // Fill missing days with 0
        const filled = fillMissingDays(totals, range);
        setDailyTotals(filled);
        setRecentEntries(data.today?.entries ?? []);
      }

      if (profileRes.ok) {
        const profile = await profileRes.json();
        setDailyGoal(profile.daily_goal ?? 2500);
      }
    } catch {
      // fail silently, show empty state
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return <HistorySkeleton />;
  }

  const avgTotal =
    dailyTotals.length > 0
      ? Math.round(
          dailyTotals.reduce((sum, d) => sum + d.total, 0) /
            dailyTotals.length
        )
      : 0;

  const bestDay = dailyTotals.reduce(
    (best, d) => (d.total > best.total ? d : best),
    { date: "-", total: 0 }
  );

  const daysOnGoal = dailyTotals.filter((d) => d.total >= dailyGoal).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">History</h1>
          <p className="text-muted-foreground">Your hydration trends</p>
        </div>
        <Link href="/tracker">
          <Button variant="outline" size="sm">
            Back to Tracker
          </Button>
        </Link>
      </div>

      {/* Range Selector */}
      <div className="flex gap-2">
        {([7, 14, 30] as RangeOption[]).map((r) => (
          <Button
            key={r}
            variant={range === r ? "default" : "outline"}
            size="sm"
            onClick={() => setRange(r)}
          >
            {r} days
          </Button>
        ))}
      </div>

      {/* Trend Chart */}
      <ScrollReveal>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Intake</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyTotals.length > 0 ? (
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dailyTotals}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id="hydrationGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--ocean-surface)"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--ocean-surface)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value: string) => {
                        const d = new Date(value + "T00:00:00");
                        return d.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        });
                      }}
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value: number) => `${value}ml`}
                      stroke="var(--muted-foreground)"
                      width={60}
                    />
                    <Tooltip
                      content={<CustomTooltip dailyGoal={dailyGoal} />}
                    />
                    {/* Goal reference line */}
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="var(--ocean-surface)"
                      strokeWidth={2}
                      fill="url(#hydrationGradient)"
                      animationDuration={1200}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available for this period
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollReveal>

      {/* Summary Stats */}
      <ScrollReveal delay={0.15}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Daily Average
              </p>
              <p className="text-2xl font-bold mt-1">{avgTotal}ml</p>
              <p className="text-xs text-muted-foreground">
                {range}-day average
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Best Day
              </p>
              <p className="text-2xl font-bold mt-1">{bestDay.total}ml</p>
              <p className="text-xs text-muted-foreground">
                {bestDay.date !== "-"
                  ? new Date(bestDay.date + "T00:00:00").toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" }
                    )
                  : "-"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Goal Met
              </p>
              <p className="text-2xl font-bold mt-1">
                {daysOnGoal}/{dailyTotals.length}
              </p>
              <p className="text-xs text-muted-foreground">
                days at {dailyGoal}ml+
              </p>
            </CardContent>
          </Card>
        </div>
      </ScrollReveal>

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <ScrollReveal delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today&apos;s Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-ocean-surface/20 flex items-center justify-center text-sm font-semibold text-ocean-surface">
                        {entry.amount}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{entry.amount}ml</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.logged_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {entry.note ? ` -- ${entry.note}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      )}
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
  dailyGoal,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  dailyGoal: number;
}) {
  if (!active || !payload?.length) return null;

  const value = payload[0].value;
  const pct = Math.round((value / dailyGoal) * 100);

  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">
        {label
          ? new Date(label + "T00:00:00").toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          : ""}
      </p>
      <p className="text-sm font-bold">{value}ml</p>
      <p className="text-xs text-muted-foreground">{pct}% of goal</p>
    </div>
  );
}

function fillMissingDays(totals: DailyTotal[], days: number): DailyTotal[] {
  const map = new Map<string, number>();
  for (const t of totals) {
    map.set(t.date, t.total);
  }

  const result: DailyTotal[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      total: map.get(dateStr) ?? 0,
    });
  }
  return result;
}

function HistorySkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}
