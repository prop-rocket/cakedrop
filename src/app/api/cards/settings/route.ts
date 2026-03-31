export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        defaultCardMessage: true,
        defaultCardSignedBy: true,
        cardTemplateId: true,
        logoUrl: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("GET /api/cards/settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const updateCardSettingsSchema = z.object({
  defaultCardMessage: z
    .string()
    .min(1, "Message is required")
    .max(500, "Message must be under 500 characters"),
  defaultCardSignedBy: z
    .string()
    .min(1, "Signed by is required")
    .max(100, "Signed by must be under 100 characters"),
  cardTemplateId: z.enum(["classic", "floral", "modern", "elegant"]),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await request.json();

    const parsed = updateCardSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        defaultCardMessage: parsed.data.defaultCardMessage,
        defaultCardSignedBy: parsed.data.defaultCardSignedBy,
        cardTemplateId: parsed.data.cardTemplateId,
      },
      select: {
        defaultCardMessage: true,
        defaultCardSignedBy: true,
        cardTemplateId: true,
        logoUrl: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/cards/settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
