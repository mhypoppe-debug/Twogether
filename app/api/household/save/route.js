import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(request) {
  try {
    const { id, password, household } = await request.json();
    if (!id || !password || !household) {
      return NextResponse.json({ error: "id, password, and household data are required." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Re-check the password on every save. Simple and stateless — no session/token
    // infrastructure needed — at the cost of one extra password check per save.
    const { data: existing, error: fetchErr } = await supabase
      .from("households")
      .select("password_hash")
      .eq("id", id.trim())
      .maybeSingle();

    if (fetchErr) {
      console.error("Save lookup failed:", fetchErr);
      return NextResponse.json({ error: "Server error looking up that household." }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "No household found with that id." }, { status: 404 });
    }

    const ok = await bcrypt.compare(password, existing.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    const { error: updateErr } = await supabase
      .from("households")
      .update({ data: household })
      .eq("id", id.trim());

    if (updateErr) {
      console.error("Save update failed:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Save error:", e);
    return NextResponse.json({ error: e.message || "Unexpected server error." }, { status: 500 });
  }
}
