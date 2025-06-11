import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const driveLink = formData.get("driveLink") as string;

    if (!driveLink) {
      return NextResponse.json(
        { error: "No Google Drive link provided" },
        { status: 400 }
      );
    }

    // Insert using Prisma
    const dbData = await prisma.installer.create({
      data: {
        name: "Google Drive Link",
        url: driveLink,
        type: "drive_link",
      }
    });

    return NextResponse.json({
      success: true,
      data: dbData,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 