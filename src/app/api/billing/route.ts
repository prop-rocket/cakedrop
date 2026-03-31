export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/razorpay";

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
        subscriptionPlan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        razorpaySubId: true,
        _count: {
          select: { employees: { where: { isActive: true } } },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const planKey = company.subscriptionPlan as keyof typeof PLANS;
    const planInfo = PLANS[planKey];

    const invoices = await prisma.invoice.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        billingPeriodStart: true,
        billingPeriodEnd: true,
        pdfUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      subscription: {
        plan: company.subscriptionPlan,
        planName: planInfo.name,
        pricePerEmployee: planInfo.pricePerEmployee,
        billingCycle: planInfo.billingCycle,
        status: company.subscriptionStatus,
        trialEndsAt: company.trialEndsAt,
        activeEmployees: company._count.employees,
        razorpaySubId: company.razorpaySubId,
      },
      invoices: invoices.map((inv) => ({
        id: inv.id,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        billingPeriodStart: inv.billingPeriodStart,
        billingPeriodEnd: inv.billingPeriodEnd,
        pdfUrl: inv.pdfUrl,
        createdAt: inv.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/billing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
