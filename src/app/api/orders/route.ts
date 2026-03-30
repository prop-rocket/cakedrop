import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: any = { companyId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.employee = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    if (dateFrom || dateTo) {
      where.deliveryDate = {};
      if (dateFrom) {
        where.deliveryDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.deliveryDate.lte = new Date(dateTo);
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          employee: {
            select: { id: true, name: true, email: true, dateOfBirth: true },
          },
          branch: {
            select: { id: true, name: true, address: true, pincode: true },
          },
          bakeryPartner: {
            select: { id: true, name: true, contactPhone: true },
          },
        },
        orderBy: { deliveryDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Also return status counts for the pipeline view
    const statusCounts = await prisma.order.groupBy({
      by: ["status"],
      where: { companyId },
      _count: { status: true },
    });

    const pipeline = {
      PENDING: 0,
      CONFIRMED: 0,
      BAKING: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      FAILED: 0,
    };

    statusCounts.forEach((item) => {
      pipeline[item.status as keyof typeof pipeline] = item._count.status;
    });

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      pipeline,
    });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
