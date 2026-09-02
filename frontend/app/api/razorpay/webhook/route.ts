import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type PlanKey = "starter" | "pro";

const PLANS: Record<
  PlanKey,
  {
    amount: number;
    name: string;
  }
> = {
  starter: {
    amount: 99900,
    name: "Starter",
  },
  pro: {
    amount: 199900,
    name: "Pro",
  },
};

export async function POST(
  request: NextRequest
) {
  try {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID;

    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (
      !webhookSecret ||
      !razorpayKeyId ||
      !razorpayKeySecret ||
      !supabaseUrl ||
      !supabaseSecretKey
    ) {
      console.error(
        "Razorpay webhook environment variables are missing."
      );

      return NextResponse.json(
        {
          error:
            "Webhook server is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Razorpay requires webhook signature
     * verification against the raw body.
     * Do not call request.json() before this.
     */
    const rawBody =
      await request.text();

    const receivedSignature =
      request.headers.get(
        "x-razorpay-signature"
      );

    if (!receivedSignature) {
      return NextResponse.json(
        {
          error:
            "Missing Razorpay signature.",
        },
        {
          status: 400,
        }
      );
    }

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          webhookSecret
        )
        .update(rawBody)
        .digest("hex");

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        receivedSignature,
        "utf8"
      );

    const signatureValid =
      expectedBuffer.length ===
        receivedBuffer.length &&
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );

    if (!signatureValid) {
      console.error(
        "Invalid Razorpay webhook signature."
      );

      return NextResponse.json(
        {
          error:
            "Invalid webhook signature.",
        },
        {
          status: 400,
        }
      );
    }

    let event: any;

    try {
      event =
        JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid webhook JSON.",
        },
        {
          status: 400,
        }
      );
    }

    const eventName =
      String(
        event?.event || ""
      );

    /*
     * For the MVP we activate only from
     * payment.captured.
     */
    if (
      eventName !==
      "payment.captured"
    ) {
      return NextResponse.json(
        {
          received: true,
          ignored: true,
          event:
            eventName,
        },
        {
          status: 200,
        }
      );
    }

    const paymentEntity =
      event?.payload
        ?.payment?.entity;

    if (!paymentEntity) {
      return NextResponse.json(
        {
          error:
            "Payment payload missing.",
        },
        {
          status: 400,
        }
      );
    }

    const paymentId =
      String(
        paymentEntity.id || ""
      );

    const orderId =
      String(
        paymentEntity.order_id ||
          ""
      );

    if (
      !paymentId ||
      !orderId
    ) {
      return NextResponse.json(
        {
          error:
            "Payment or order ID missing.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Fetch the order from Razorpay rather
     * than trusting browser or webhook notes.
     */
    const razorpay =
      new Razorpay({
        key_id:
          razorpayKeyId,
        key_secret:
          razorpayKeySecret,
      });

    const order =
      await razorpay.orders.fetch(
        orderId
      );

    const companyId =
      String(
        order.notes?.company_id ||
          ""
      );

    const plan =
      String(
        order.notes?.plan || ""
      ).toLowerCase() as PlanKey;

    if (
      !companyId ||
      !(plan in PLANS)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid Razorpay order metadata.",
        },
        {
          status: 400,
        }
      );
    }

    const selectedPlan =
      PLANS[plan];

    const orderAmount =
      Number(order.amount);

    const paymentAmount =
      Number(
        paymentEntity.amount
      );

    if (
      orderAmount !==
        selectedPlan.amount ||
      paymentAmount !==
        selectedPlan.amount ||
      order.currency !== "INR" ||
      paymentEntity.currency !==
        "INR"
    ) {
      return NextResponse.json(
        {
          error:
            "Payment amount or currency mismatch.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      paymentEntity.status !==
      "captured"
    ) {
      return NextResponse.json(
        {
          received: true,
          activated: false,
          message:
            "Payment is not captured.",
        },
        {
          status: 200,
        }
      );
    }

    /*
     * Server-only Supabase client.
     * Never expose SUPABASE_SECRET_KEY
     * to browser code.
     */
    const supabaseAdmin =
      createClient(
        supabaseUrl,
        supabaseSecretKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

    /*
     * Activation is performed atomically
     * inside PostgreSQL. The payment ID is
     * unique, so duplicate Razorpay webhook
     * deliveries cannot add another 30 days.
     */
    const {
      data: activationData,
      error: activationError,
    } = await supabaseAdmin.rpc(
      "activate_recruiter_payment",
      {
        p_company_id:
          companyId,
        p_payment_id:
          paymentId,
        p_order_id:
          orderId,
        p_plan:
          plan,
        p_amount:
          selectedPlan.amount,
        p_currency:
          "INR",
      }
    );

    if (activationError) {
      console.error(
        "Subscription activation error:",
        activationError
      );

      return NextResponse.json(
        {
          error:
            "Payment was captured, but subscription activation failed.",
        },
        {
          status: 500,
        }
      );
    }

    const result =
      Array.isArray(
        activationData
      ) &&
      activationData.length > 0
        ? activationData[0]
        : null;

    return NextResponse.json(
      {
        received: true,
        activated:
          Boolean(
            result?.activated
          ),
        duplicate:
          Boolean(
            result?.duplicate
          ),
        companyId,
        paymentId,
        orderId,
        plan,
        planName:
          selectedPlan.name,
        subscriptionStatus:
          result?.subscription_status ??
          null,
        expiresAt:
          result?.subscription_expires_at ??
          null,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Razorpay webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}
