import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  pincode: z.string().min(6, "Valid pincode is required").max(6),
  contactPerson: z.string().min(1, "Contact person is required"),
  contactPhone: z.string().min(10, "Valid phone number is required"),
  deliveryWindow: z.enum(["MORNING", "AFTERNOON"]),
});

const createBranchesSchema = z.object({
  branches: z.array(branchSchema).min(1, "At least one branch is required"),
});

export async function POST(request: Request) {
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
    const validation = createBranchesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { branches } = validation.data;

    const created = await prisma.$transaction(
      branches.map((branch) =>
        prisma.branch.create({
          data: {
            ...branch,
            companyId,
          },
        })
      )
    );

    return NextResponse.json({ branches: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/onboarding/branches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
