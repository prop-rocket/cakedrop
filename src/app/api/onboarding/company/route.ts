export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  gstNumber: z.string().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
});

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: "No company associated with this account" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateCompanySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, phone, gstNumber, logoUrl } = validation.data;

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        name,
        phone,
        gstNumber: gstNumber || null,
        logoUrl: logoUrl || null,
      },
    });

    return NextResponse.json({ company });
  } catch (error) {
    console.error("PUT /api/onboarding/company error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
