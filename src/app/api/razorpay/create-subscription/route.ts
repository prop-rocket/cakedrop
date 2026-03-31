export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/razorpay";

const createSubscriptionSchema = z.object({
  plan: z.enum(["STARTER", "GROWTH", "ENTERPRISE"]),
  employeeCount: z.number().int().min(1, "Employee count must be at least 1"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await request.json();

    const validation = createSubscriptionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { plan, employeeCount } = validation.data;
    const planConfig = PLANS[plan];
    const totalAmount = planConfig.pricePerEmployee * employeeCount;

    // For MVP: directly update the company subscription in the database
    // In production, this would create a real Razorpay subscription
    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionPlan: plan,
        subscriptionStatus: "ACTIVE",
        // In production, these would come from Razorpay response
        razorpaySubId: `sub_mvp_${Date.now()}`,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: company.razorpaySubId,
        plan,
        employeeCount,
        pricePerEmployee: planConfig.pricePerEmployee,
        totalAmount,
        billingCycle: planConfig.billingCycle,
        status: "ACTIVE",
      },
    });
  } catch (error) {
    console.error("POST /api/razorpay/create-subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
