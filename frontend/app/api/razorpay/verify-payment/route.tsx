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
    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID;

    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      return NextResponse.json(
        {
          error:
            "Razorpay is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !supabaseUrl ||
      !supabaseKey
    ) {
      return NextResponse.json(
        {
          error:
            "Supabase is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      !authorization?.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authorization.slice(
        "Bearer ".length
      );

    const supabase =
      createClient(
        supabaseUrl,
        supabaseKey,
        {
          global: {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser(
      accessToken
    );

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired session.",
        },
        {
          status: 401,
        }
      );
    }

    const user =
      authData.user;

    const {
      data: company,
      error: companyError,
    } = await supabase
      .from("companies")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (
      companyError ||
      !company
    ) {
      return NextResponse.json(
        {
          error:
            "Only company accounts can verify recruiter payments.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const razorpayOrderId =
      String(
        body?.razorpay_order_id ||
          ""
      ).trim();

    const razorpayPaymentId =
      String(
        body?.razorpay_payment_id ||
          ""
      ).trim();

    const razorpaySignature =
      String(
        body?.razorpay_signature ||
          ""
      ).trim();

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        {
          error:
            "Missing Razorpay payment verification fields.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Razorpay requires:
     *
     * HMAC_SHA256(
     *   order_id + "|" + payment_id,
     *   key_secret
     * )
     */
    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          razorpayKeySecret
        )
        .update(
          `${razorpayOrderId}|${razorpayPaymentId}`
        )
        .digest("hex");

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        razorpaySignature,
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
      return NextResponse.json(
        {
          verified: false,
          error:
            "Invalid Razorpay payment signature.",
        },
        {
          status: 400,
        }
      );
    }

    const razorpay =
      new Razorpay({
        key_id:
          razorpayKeyId,
        key_secret:
          razorpayKeySecret,
      });

    /*
     * Fetch both records directly from
     * Razorpay instead of trusting
     * browser-supplied amount/plan data.
     */
    const [
      order,
      payment,
    ] = await Promise.all([
      razorpay.orders.fetch(
        razorpayOrderId
      ),
      razorpay.payments.fetch(
        razorpayPaymentId
      ),
    ]);

    if (
      payment.order_id !==
      razorpayOrderId
    ) {
      return NextResponse.json(
        {
          verified: false,
          error:
            "Payment does not belong to this order.",
        },
        {
          status: 400,
        }
      );
    }

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
      companyId !== user.id
    ) {
      return NextResponse.json(
        {
          verified: false,
          error:
            "This Razorpay order belongs to another recruiter account.",
        },
        {
          status: 403,
        }
      );
    }

    if (!(plan in PLANS)) {
      return NextResponse.json(
        {
          verified: false,
          error:
            "Invalid plan stored on Razorpay order.",
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
      Number(payment.amount);

    if (
      orderAmount !==
        selectedPlan.amount ||
      paymentAmount !==
        selectedPlan.amount ||
      order.currency !== "INR" ||
      payment.currency !== "INR"
    ) {
      return NextResponse.json(
        {
          verified: false,
          error:
            "Payment amount or currency does not match the selected plan.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * A valid signature proves authenticity,
     * but paid access should only be granted
     * once Razorpay reports the payment as
     * captured.
     */
    if (
      payment.status !==
      "captured"
    ) {
      return NextResponse.json(
        {
          verified: true,
          captured: false,
          paymentStatus:
            payment.status,
          plan,
          message:
            "Payment is authentic but has not been captured yet.",
        },
        {
          status: 202,
        }
      );
    }

    return NextResponse.json(
      {
        verified: true,
        captured: true,
        paymentStatus:
          payment.status,
        paymentId:
          razorpayPaymentId,
        orderId:
          razorpayOrderId,
        plan,
        planName:
          selectedPlan.name,
        amount:
          selectedPlan.amount,
        message:
          "Payment verified successfully.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Razorpay verify-payment error:",
      error
    );

    return NextResponse.json(
      {
        verified: false,
        error:
          "Could not verify Razorpay payment.",
      },
      {
        status: 500,
      }
    );
  }
}
