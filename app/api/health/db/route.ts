import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await supabaseAdmin
    .from("users")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Birthy DB health check failed:", error);

    return NextResponse.json(
      {
        ok: false,
        database: "disconnected",
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    database: "connected",
  });
}