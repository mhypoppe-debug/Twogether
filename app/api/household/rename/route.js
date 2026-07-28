import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

function slugify(name) {
  return (name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export async function POST(request) {
  try {
    const { id, password, newId } = await request.json();
    if (!id || !password || !newId) {
      return NextResponse.json({ error: "Household id, password, and a new id are required." }, { status: 400 });
    }

    const cleanNewId = slugify(newId);
    if (cleanNewId.length < 3) {
      return NextResponse.json({ error: "Choose an id with at least 3 letters or numbers." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("households")
      .select("password_hash, data")
      .eq("id", id.trim())
      .maybeSingle();

    if (error) {
      console.error("Rename lookup failed:", error);
      return NextResponse.json({ error: "Server error looking up that household." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "No household found with that id." }, { status: 404 });
    }

    const ok = await bcrypt.compare(password, data.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    if (cleanNewId === id.trim()) {
      return NextResponse.json({ id: cleanNewId });
    }

    const { error: updateError } = await supabase
      .from("households")
      .update({ id: cleanNewId, data: { ...data.data, code: cleanNewId } })
      .eq("id", id.trim());

    if (updateError) {
      if (updateError.code === "23505") {
        return NextResponse.json({ error: "That id is already taken — try another." }, { status: 409 });
      }
      console.error("Rename update failed:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ id: cleanNewId });
  } catch (e) {
    console.error("Rename error:", e);
    return NextResponse.json({ error: e.message || "Unexpected server error." }, { status: 500 });
  }
}
