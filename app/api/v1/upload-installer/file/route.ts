import { createAdminClient } from "@utils/supabase/admin";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Upload file to storage
    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("installers")
      .upload(file.name, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data } = supabase.storage
      .from("installers")
      .getPublicUrl(file.name);

    if (!data?.publicUrl) {
      console.error("Error getting public URL: No public URL returned");
      return NextResponse.json(
        { error: "Failed to generate public URL" },
        { status: 500 }
      );
    }

    const publicUrl = data.publicUrl;

    // Save to database
    const { data: dbData, error: dbError } = await supabase
      .from("installers")
      .insert({
        name: file.name,
        url: publicUrl,
        type: "file",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: dbData });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 