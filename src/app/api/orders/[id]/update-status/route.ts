import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_ORDER = [
  "PENDING",
  "CONFIRMED",
  "BAKING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
] as const;

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "BAKING", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED"]),
  deliveryPhotoUrl: z.string().url().optional(),
  deliveryNotes: z.string().optional(),
  bakeryOrderRef: z.string().optional(),
  actualDeliveryAt: z.string().datetime().optional(),
  failureReason: z.string().optional(),
});

function isValidTransition(currentStatus: string, newStatus: string): boolean {
  // FAILED can be set from any status
  if (newStatus === "FAILED") return true;

  const currentIndex = STATUS_ORDER.indexOf(currentStatus as any);
  const newIndex = STATUS_ORDER.indexOf(newStatus as any);

  // Cannot go backward in the pipeline (except FAILED which is handled above)
  if (newIndex === -1 || currentIndex === -1) return false;
  // FAILED index is 5, DELIVERED is 4 - only allow forward movement among the main pipeline
  if (newIndex <= currentIndex) return false;

  return true;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth: either CRON_SECRET header or authenticated session
    const cronSecret = request.headers.get("authorization");
    const isCronAuth =
      cronSecret && process.env.CRON_SECRET && cronSecret === `Bearer ${process.env.CRON_SECRET}`;

    if (!isCronAuth) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const orderId = params.id;
    const body = await request.json();

    const validation = updateStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { status, deliveryPhotoUrl, deliveryNotes, bakeryOrderRef, actualDeliveryAt, failureReason } =
      validation.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isValidTransition(order.status, status)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${order.status} to ${status}. Status can only move forward in the pipeline.`,
        },
        { status: 400 }
      );
    }

    const updateData: any = { status };

    if (deliveryPhotoUrl !== undefined) updateData.deliveryPhotoUrl = deliveryPhotoUrl;
    if (deliveryNotes !== undefined) updateData.deliveryNotes = deliveryNotes;
    if (bakeryOrderRef !== undefined) updateData.bakeryOrderRef = bakeryOrderRef;
    if (actualDeliveryAt !== undefined) updateData.actualDeliveryAt = new Date(actualDeliveryAt);
    if (failureReason !== undefined) updateData.failureReason = failureReason;

    // Auto-set actualDeliveryAt when marking as delivered
    if (status === "DELIVERED" && !actualDeliveryAt) {
      updateData.actualDeliveryAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        bakeryPartner: {
          select: { id: true, name: true, contactPhone: true },
        },
      },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("PUT /api/orders/[id]/update-status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
