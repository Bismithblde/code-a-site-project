import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/user/export — download all user data as JSON
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 1 request per 10 minutes per user
  const { allowed, retryAfterMs } = rateLimit(`user-export:${user.id}`, {
    limit: 1,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before exporting again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const admin = createAdminClient();

  // Fetch profile and hydration entries in parallel
  const [profileResult, entriesResult] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).single(),
    admin
      .from("hydration_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false }),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    },
    profile: profileResult.data ?? null,
    hydration_entries: entriesResult.data ?? [],
    stats: {
      total_entries: (entriesResult.data ?? []).length,
    },
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="mineralwater-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
