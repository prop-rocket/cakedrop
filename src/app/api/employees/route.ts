export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  branchId: z.string().uuid("Invalid branch"),
  cakePreference: z.enum(["EGGLESS", "EGG", "VEGAN", "SUGAR_FREE", "DEFAULT"]).default("DEFAULT"),
});

const updateEmployeeSchema = createEmployeeSchema.extend({
  id: z.string().uuid("Invalid employee ID"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const branchId = searchParams.get("branchId") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sortBirthday = searchParams.get("sortBirthday") === "true";

    const where: any = {
      companyId,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (branchId) {
      where.branchId = branchId;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true } },
        },
        orderBy: sortBirthday
          ? { dateOfBirth: "asc" }
          : { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({
      employees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/employees error:", error);
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

    const validation = createEmployeeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, dateOfBirth, branchId, cakePreference } = validation.data;

    // Verify branch belongs to company
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, companyId, isActive: true },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    // Check for duplicate email within company
    if (email) {
      const existing = await prisma.employee.findFirst({
        where: { email, companyId, isActive: true },
      });
      if (existing) {
        return NextResponse.json(
          { error: "An employee with this email already exists" },
          { status: 409 }
        );
      }
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        email: email || null,
        dateOfBirth: new Date(dateOfBirth),
        branchId,
        companyId,
        cakePreference,
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error("POST /api/employees error:", error);
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

    const validation = updateEmployeeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { id, name, email, dateOfBirth, branchId, cakePreference } = validation.data;

    // Verify employee belongs to company
    const existing = await prisma.employee.findFirst({
      where: { id, companyId, isActive: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Verify branch belongs to company
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, companyId, isActive: true },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Branch not found" },
        { status: 404 }
      );
    }

    // Check for duplicate email (excluding current employee)
    if (email) {
      const duplicate = await prisma.employee.findFirst({
        where: {
          email,
          companyId,
          isActive: true,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "An employee with this email already exists" },
          { status: 409 }
        );
      }
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        email: email || null,
        dateOfBirth: new Date(dateOfBirth),
        branchId,
        cakePreference,
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("PUT /api/employees error:", error);
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
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findFirst({
      where: { id, companyId, isActive: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Employee deleted" });
  } catch (error) {
    console.error("DELETE /api/employees error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
