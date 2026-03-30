import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Count total active employees
    const totalEmployees = await prisma.employee.count({
      where: { companyId, isActive: true },
    });

    // Count upcoming birthdays in the next 7 days
    // We need to match month + day regardless of year
    const today = new Date();
    const employees = await prisma.employee.findMany({
      where: { companyId, isActive: true },
      select: { dateOfBirth: true },
    });

    let upcomingBirthdays = 0;
    for (const emp of employees) {
      const dob = new Date(emp.dateOfBirth);
      const nextBirthday = new Date(
        today.getFullYear(),
        dob.getMonth(),
        dob.getDate()
      );

      // If the birthday already passed this year, check next year
      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }

      const diffDays = Math.ceil(
        (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays >= 0 && diffDays <= 7) {
        upcomingBirthdays++;
      }
    }

    // Count delivered orders this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const deliveredThisMonth = await prisma.order.count({
      where: {
        companyId,
        status: "DELIVERED",
        deliveryDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Sum of monthly invoice amounts (current month, amount is in paise)
    const invoices = await prisma.invoice.aggregate({
      where: {
        companyId,
        billingPeriodStart: { gte: startOfMonth },
        billingPeriodEnd: { lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    const monthlySpend = (invoices._sum.amount || 0) / 100; // Convert paise to rupees

    return NextResponse.json({
      totalEmployees,
      upcomingBirthdays,
      deliveredThisMonth,
      monthlySpend,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
