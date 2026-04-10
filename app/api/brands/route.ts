import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: brands, error } = await supabase
    .from("brands")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }

  return NextResponse.json(brands);
}
