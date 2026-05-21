import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/serverAuth";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.postgresId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("images")
    .upload(fileName, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("images").getPublicUrl(fileName);

  return NextResponse.json({ url: data.publicUrl });
}