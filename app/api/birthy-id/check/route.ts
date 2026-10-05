import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ID_PATTERN = /^[a-zA-Z0-9_]{4,20}$/;

export async function GET(request: NextRequest) {
  const rawId = request.nextUrl.searchParams.get("id") ?? "";
  const birthyId = rawId.trim().toLowerCase();

  if (!birthyId) {
    return NextResponse.json(
      {
        available: false,
        valid: false,
        message: "IDを入力してください",
      },
      { status: 400 }
    );
  }

  if (!ID_PATTERN.test(birthyId)) {
    return NextResponse.json({
      available: false,
      valid: false,
      message: "IDは4〜20文字の英数字と_が使用できます",
    });
  }

  const { data, error } = await supabaseAdmin.rpc(
    "is_birthy_id_available",
    {
      p_birthy_id: birthyId,
    }
  );

  if (error) {
    console.error("Birthy ID check failed:", error);

    return NextResponse.json(
      {
        available: false,
        valid: true,
        message: "IDを確認できませんでした",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    available: Boolean(data),
    valid: true,
    normalizedId: birthyId,
    message: data
      ? "このIDは使用できます"
      : "このIDはすでに使用されています",
  });
}