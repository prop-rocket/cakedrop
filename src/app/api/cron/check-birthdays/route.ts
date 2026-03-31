export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/razorpay";
import { getDeliveryDate } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate the date 3 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    const targetMonth = targetDate.getMonth() + 1; // 1-indexed
    const targetDay = targetDate.getDate();

    // Query all active employees whose birthday month+day matches
    // We need to use raw SQL for extracting month and day from dateOfBirth
    const employees = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        email: string | null;
        dateOfBirth: Date;
        cakePreference: string;
        companyId: string;
        branchId: string;
      }>
    >`
      SELECT e.id, e.name, e.email, e."dateOfBirth", e."cakePreference", e."companyId", e."branchId"
      FROM "Employee" e
      WHERE e."isActive" = true
        AND EXTRACT(MONTH FROM e."dateOfBirth") = ${targetMonth}
        AND EXTRACT(DAY FROM e."dateOfBirth") = ${targetDay}
    `;

    if (employees.length === 0) {
      return NextResponse.json({
        message: "No birthdays found",
        ordersCreated: 0,
        date: targetDate.toISOString().split("T")[0],
      });
    }

    const ordersCreated: string[] = [];
    const errors: string[] = [];

    for (const employee of employees) {
      try {
        // Check if order already exists for this employee and delivery date range
        const birthdayThisYear = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate()
        );
        const deliveryDate = getDeliveryDate(birthdayThisYear);

        const existingOrder = await prisma.order.findFirst({
          where: {
            employeeId: employee.id,
            deliveryDate: {
              gte: new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate()),
              lt: new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate() + 1),
            },
          },
        });

        if (existingOrder) {
          continue; // Skip if order already exists
        }

        // Get company details for default preferences
        const company = await prisma.company.findUnique({
          where: { id: employee.companyId },
        });

        if (!company || company.subscriptionStatus === "CANCELLED") {
          continue;
        }

        // Determine effective cake preference
        const cakePreference =
          employee.cakePreference === "DEFAULT"
            ? company.defaultCakePreference
            : (employee.cakePreference as any);

        // Get cake size based on subscription plan
        const planConfig = PLANS[company.subscriptionPlan as keyof typeof PLANS];
        const cakeSize = planConfig?.cakeSize || "500g";

        // Find bakery partner serving the branch's pincode
        const branch = await prisma.branch.findUnique({
          where: { id: employee.branchId },
        });

        if (!branch || !branch.isActive) {
          errors.push(`Branch not found or inactive for employee ${employee.id}`);
          continue;
        }

        // Find a bakery partner that serves this pincode and supports the cake preference
        const preferenceFilter: any = {};
        if (cakePreference === "EGGLESS") preferenceFilter.supportsEggless = true;
        if (cakePreference === "VEGAN") preferenceFilter.supportsVegan = true;
        if (cakePreference === "SUGAR_FREE") preferenceFilter.supportsSugarFree = true;

        const bakeryPartners = await prisma.bakeryPartner.findMany({
          where: {
            isActive: true,
            city: branch.city,
            ...preferenceFilter,
          },
        });

        // Filter by pincode served (areasServed is a JSON array of pincodes)
        const matchingBakery = bakeryPartners.find((bp) => {
          const areas = bp.areasServed as string[];
          return Array.isArray(areas) && areas.includes(branch.pincode);
        });

        // Create order
        const order = await prisma.order.create({
          data: {
            employeeId: employee.id,
            companyId: employee.companyId,
            branchId: employee.branchId,
            bakeryPartnerId: matchingBakery?.id || null,
            status: "PENDING",
            cakePreference,
            cakeSize,
            cakeType: `${cakePreference} ${cakeSize} Birthday Cake`,
            cardMessage: company.defaultCardMessage,
            cardTemplate: company.cardTemplateId || "classic",
            deliveryDate,
          },
        });

        ordersCreated.push(order.id);
      } catch (err) {
        console.error(`Error creating order for employee ${employee.id}:`, err);
        errors.push(`Failed to create order for employee ${employee.id}`);
      }
    }

    return NextResponse.json({
      message: `Birthday check complete for ${targetDate.toISOString().split("T")[0]}`,
      employeesFound: employees.length,
      ordersCreated: ordersCreated.length,
      orderIds: ordersCreated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("GET /api/cron/check-birthdays error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
