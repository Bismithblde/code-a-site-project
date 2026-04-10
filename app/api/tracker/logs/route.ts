import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hydrationEntrySchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// GET /api/tracker/logs — fetch hydration entries for the current user
// Query params: date (YYYY-MM-DD), limit, offset
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  let query = supabase
    .from("hydration_entries")
    .select("*")
    .order("logged_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (date) {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }
    query = query.eq("date", date);
  }

  const { data: entries, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch hydration entries" },
      { status: 500 }
    );
  }

  return NextResponse.json(entries);
}

// POST /api/tracker/logs — create a new hydration entry
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 60 requests per minute per user
  const { allowed, retryAfterMs } = rateLimit(`tracker-post:${user.id}`, {
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = hydrationEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const now = new Date();
  const entry = {
    user_id: user.id,
    amount: parsed.data.amount,
    brand_slug: parsed.data.brand_slug,
    activity: parsed.data.activity,
    note: parsed.data.note,
    logged_at: now.toISOString(),
    date: now.toISOString().split("T")[0],
  };

  const { data, error } = await supabase
    .from("hydration_entries")
    .insert(entry)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create hydration entry" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/tracker/logs — delete a hydration entry by id
// Query param: id (uuid)
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 60 requests per minute per user
  const { allowed, retryAfterMs } = rateLimit(`tracker-delete:${user.id}`, {
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing entry id" },
      { status: 400 }
    );
  }

  // Validate UUID format
  const uuidResult = z.string().uuid().safeParse(id);
  if (!uuidResult.success) {
    return NextResponse.json(
      { error: "Invalid entry id format" },
      { status: 400 }
    );
  }

  // RLS ensures user can only delete their own entries
  const { error } = await supabase
    .from("hydration_entries")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete hydration entry" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
