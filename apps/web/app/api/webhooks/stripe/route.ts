import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, sum } from "drizzle-orm";
import { db } from "@openpims/db/client";
import { invoices, payments } from "@openpims/db";
import { constructWebhookEvent } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    const event = await constructWebhookEvent(body, signature);

    if (!event) {
      return NextResponse.json(
        { error: "Webhook verification failed or Stripe not configured" },
        { status: 400 },
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        metadata?: { invoiceId?: string };
        amount_total?: number | null;
      };

      const invoiceId = session.metadata?.invoiceId;
      if (!invoiceId) {
        console.error("[Stripe Webhook] No invoiceId in session metadata");
        return NextResponse.json({ received: true });
      }

      // Calculate payment amount from Stripe (convert smallest unit to major unit)
      const amountSmallestUnit = session.amount_total ?? 0;
      const currency = (session as any).currency ?? "DZD";
      const fractionDigits = new Intl.NumberFormat("fr-DZ", {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2;

      const amountMajor = (amountSmallestUnit / Math.pow(10, fractionDigits)).toFixed(fractionDigits);

      // Record the payment
      await db.insert(payments).values({
        invoiceId,
        amount: amountMajor,
        method: "online",
        notes: "Paid via Stripe Checkout",
      });

      // Sum all payments for this invoice
      const [result] = await db
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(
          and(
            eq(payments.invoiceId, invoiceId),
            isNull(payments.deletedAt),
          ),
        );

      const paidAmount = result?.total ?? "0";

      // Get invoice total to check if fully paid
      const [invoice] = await db
        .select({ total: invoices.total })
        .from(invoices)
        .where(eq(invoices.id, invoiceId));

      if (invoice) {
        const updates: Record<string, any> = { paidAmount };
        if (parseFloat(paidAmount) >= parseFloat(invoice.total)) {
          updates.status = "paid";
        }

        await db
          .update(invoices)
          .set(updates)
          .where(eq(invoices.id, invoiceId));
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
