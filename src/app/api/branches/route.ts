export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  pincode: z
    .string()
    .min(6, "Pincode must be 6 digits")
    .max(6, "Pincode must be 6 digits")
    .regex(/^\d{6}$/, "Pincode must be 6 digits"),
  contactPerson: z.string().min(1, "Contact person is required"),
  contactPhone: z
    .string()
    .min(10, "Phone must be 10 digits")
    .max(10, "Phone must be 10 digits")
    .regex(/^\d{10}$/, "Phone must be 10 digits"),
  deliveryWindow: z.enum(["MORNING", "AFTERNOON"]),
});

const updateBranchSchema = createBranchSchema.extend({
  id: z.string().uuid("Invalid branch ID"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    const branches = await prisma.branch.findMany({
      where: { companyId, isActive: true },
      include: {
        _count: {
          select: {
            employees: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      city: branch.city,
      pincode: branch.pincode,
      contactPerson: branch.contactPerson,
      contactPhone: branch.contactPhone,
      deliveryWindow: branch.deliveryWindow,
      isActive: branch.isActive,
      employeeCount: branch._count.employees,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    }));

    return NextResponse.json({ branches: formatted });
  } catch (error) {
    console.error("GET /api/branches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await request.json();

    const validation = createBranchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, address, city, pincode, contactPerson, contactPhone, deliveryWindow } =
      validation.data;

    // Check for duplicate branch name within company
    const existing = await prisma.branch.findFirst({
      where: { name, companyId, isActive: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A branch with this name already exists" },
        { status: 409 }
      );
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        city,
        pincode,
        contactPerson,
        contactPhone,
        deliveryWindow,
        companyId,
      },
    });

    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    console.error("POST /api/branches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await request.json();

    const validation = updateBranchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { id, name, address, city, pincode, contactPerson, contactPhone, deliveryWindow } =
      validation.data;

    // Verify branch belongs to company
    const existing = await prisma.branch.findFirst({
      where: { id, companyId, isActive: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    // Check for duplicate branch name (excluding current branch)
    const duplicate = await prisma.branch.findFirst({
      where: {
        name,
        companyId,
        isActive: true,
        id: { not: id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "A branch with this name already exists" },
        { status: 409 }
      );
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        name,
        address,
        city,
        pincode,
        contactPerson,
        contactPhone,
        deliveryWindow,
      },
    });

    return NextResponse.json({ branch });
  } catch (error) {
    console.error("PUT /api/branches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Branch ID is required" },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findFirst({
      where: { id, companyId, isActive: true },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    await prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Branch deleted" });
  } catch (error) {
    console.error("DELETE /api/branches error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
