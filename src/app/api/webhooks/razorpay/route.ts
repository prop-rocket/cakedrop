export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    switch (eventType) {
      case "subscription.charged": {
        const subscriptionId = event.payload?.subscription?.entity?.id;
        if (!subscriptionId) break;

        // Find the company with this subscription
        const company = await prisma.company.findFirst({
          where: { razorpaySubId: subscriptionId },
        });

        if (company) {
          // Update subscription status to active
          await prisma.company.update({
            where: { id: company.id },
            data: { subscriptionStatus: "ACTIVE" },
          });

          // Create invoice record
          const payment = event.payload?.payment?.entity;
          if (payment) {
            const now = new Date();
            const billingStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const billingEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            await prisma.invoice.create({
              data: {
                companyId: company.id,
                razorpayInvId: payment.invoice_id || payment.id,
                amount: payment.amount, // amount is in paise
                currency: payment.currency || "INR",
                status: "paid",
                billingPeriodStart: billingStart,
                billingPeriodEnd: billingEnd,
              },
            });
          }
        }
        break;
      }

      case "subscription.cancelled": {
        const subscriptionId = event.payload?.subscription?.entity?.id;
        if (!subscriptionId) break;

        const company = await prisma.company.findFirst({
          where: { razorpaySubId: subscriptionId },
        });

        if (company) {
          await prisma.company.update({
            where: { id: company.id },
            data: { subscriptionStatus: "CANCELLED" },
          });
        }
        break;
      }

      case "payment.failed": {
        const subscriptionId =
          event.payload?.payment?.entity?.subscription_id;
        if (!subscriptionId) break;

        const company = await prisma.company.findFirst({
          where: { razorpaySubId: subscriptionId },
        });

        if (company) {
          await prisma.company.update({
            where: { id: company.id },
            data: { subscriptionStatus: "PAUSED" },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled Razorpay webhook event: ${eventType}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("POST /api/webhooks/razorpay error:", error);
    // Return 200 even on error to prevent Razorpay from retrying excessively
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
