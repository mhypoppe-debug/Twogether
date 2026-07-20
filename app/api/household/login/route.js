import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(request) {
  try {
    const { id, password } = await request.json();
    if (!id || !password) {
      return NextResponse.json({ error: "Household id and password are required." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("households")
      .select("password_hash, data")
      .eq("id", id.trim())
      .maybeSingle();

    if (error) {
      console.error("Login lookup failed:", error);
      return NextResponse.json({ error: "Server error looking up that household." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "No household found with that id." }, { status: 404 });
    }

    const ok = await bcrypt.compare(password, data.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    return NextResponse.json({ household: data.data });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: e.message || "Unexpected server error." }, { status: 500 });
  }
}
