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
    // Razorpay amount is in paise.
    // ₹999 = 99,900 paise
    amount: 100,
    name: "Starter",
  },

  pro: {
    // ₹1,999 = 199,900 paise
    amount: 100,
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

    /*
     * We expect the logged-in user's
     * Supabase access token from the client.
     */
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

    /*
     * Create a Supabase server client
     * using the user's access token.
     *
     * We are NOT using a service-role key.
     */
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

    /*
     * Verify that the token belongs
     * to a real logged-in user.
     */
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

    /*
     * Confirm that this user really
     * has a recruiter/company account.
     */
    const {
      data: company,
      error: companyError,
    } = await supabase
      .from("companies")
      .select(
        "id, company_name, email"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

    if (
      companyError ||
      !company
    ) {
      return NextResponse.json(
        {
          error:
            "Only company accounts can purchase recruiter plans.",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await request.json();

    const requestedPlan =
      String(
        body?.plan || ""
      ).toLowerCase() as PlanKey;

    /*
     * IMPORTANT:
     * Never accept the payment amount
     * from the frontend.
     *
     * Frontend only sends "starter"
     * or "pro".
     *
     * Server decides the price.
     */
    if (
      !(
        requestedPlan in
        PLANS
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid recruiter plan.",
        },
        {
          status: 400,
        }
      );
    }

    const selectedPlan =
      PLANS[requestedPlan];

    const razorpay =
      new Razorpay({
        key_id:
          razorpayKeyId,

        key_secret:
          razorpayKeySecret,
      });

    /*
     * Razorpay receipt should stay short.
     */
    const receipt =
      `fh_${Date.now()}_${user.id.slice(
        0,
        6
      )}`.slice(
        0,
        40
      );

    const order =
      await razorpay.orders.create(
        {
          amount:
            selectedPlan.amount,

          currency:
            "INR",

          receipt,

          notes: {
            company_id:
              user.id,

            plan:
              requestedPlan,

            plan_name:
              selectedPlan.name,
          },
        }
      );

    /*
     * Key ID is safe to send to
     * Razorpay Checkout.
     *
     * Key SECRET is never returned.
     */
    return NextResponse.json(
      {
        orderId:
          order.id,

        amount:
          order.amount,

        currency:
          order.currency,

        plan:
          requestedPlan,

        planName:
          selectedPlan.name,

        keyId:
          razorpayKeyId,

        companyName:
          company.company_name,

        companyEmail:
          company.email ||
          user.email ||
          "",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Razorpay create-order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not create Razorpay order.",
      },
      {
        status: 500,
      }
    );
  }
}