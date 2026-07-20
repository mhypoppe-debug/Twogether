import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";

function slugify(name) {
  return (name || "household")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export async function POST(request) {
  try {
    const { household, password } = await request.json();

    if (!household || !password || password.length < 4) {
      return NextResponse.json(
        { error: "A household and a password (4+ characters) are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const passwordHash = await bcrypt.hash(password, 10);

    // Try a few times in case of a rare id collision
    for (let attempt = 0; attempt < 5; attempt++) {
      const id = `${slugify(household.name)}-${Math.random().toString(36).slice(2, 8)}`;
      const { error } = await supabase
        .from("households")
        .insert({ id, password_hash: passwordHash, data: { ...household, code: id } });

      if (!error) {
        return NextResponse.json({ id });
      }
      // 23505 = unique_violation in Postgres; retry with a new id. Any other error, bail out.
      if (error.code !== "23505") {
        console.error("Create household failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Could not generate a unique household id, please try again." }, { status: 500 });
  } catch (e) {
    console.error("Create household error:", e);
    return NextResponse.json({ error: e.message || "Unexpected server error." }, { status: 500 });
  }
}
