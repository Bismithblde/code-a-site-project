import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

// DELETE /api/user/account — permanently delete user account and all data
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 1 request per 60 minutes per user
  const { allowed, retryAfterMs } = rateLimit(`user-delete:${user.id}`, {
    limit: 1,
    windowMs: 60 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const admin = createAdminClient();

  // Delete hydration entries first (in case cascade is not set up)
  const { error: entriesError } = await admin
    .from("hydration_entries")
    .delete()
    .eq("user_id", user.id);

  if (entriesError) {
    return NextResponse.json(
      { error: "Failed to delete hydration data" },
      { status: 500 }
    );
  }

  // Delete profile
  const { error: profileError } = await admin
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 500 }
    );
  }

  // Delete the auth user (this is permanent)
  const { error: authError } = await admin.auth.admin.deleteUser(user.id);

  if (authError) {
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "Account permanently deleted" });
}
