import { supabase } from "./supabase";

export type UserRole = "fresher" | "company" | null;

export async function getCurrentUserRole(): Promise<UserRole> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  /*
    CHECK COMPANY ACCOUNT
  */

  const {
    data: company,
    error: companyError,
  } = await supabase
    .from("companies")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (companyError) {
    console.error(
      "Company role check error:",
      companyError
    );
  }

  if (company) {
    return "company";
  }

  /*
    CHECK FRESHER ACCOUNT
  */

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "Fresher role check error:",
      profileError
    );
  }

  if (
    profile?.user_type === "fresher"
  ) {
    return "fresher";
  }

  return null;
}

/*
  REQUIRE COMPANY

  Returns true only when the
  logged-in account is a company.
*/

export async function requireCompany() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      redirectTo: "/login",
      user: null,
    };
  }

  const role =
    await getCurrentUserRole();

  if (role !== "company") {
    return {
      allowed: false,
      redirectTo:
        role === "fresher"
          ? "/dashboard"
          : "/login",
      user,
    };
  }

  return {
    allowed: true,
    redirectTo: null,
    user,
  };
}

/*
  REQUIRE FRESHER

  Returns true only when the
  logged-in account is a fresher.
*/

export async function requireFresher() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      redirectTo: "/login",
      user: null,
    };
  }

  const role =
    await getCurrentUserRole();

  if (role !== "fresher") {
    return {
      allowed: false,
      redirectTo:
        role === "company"
          ? "/company/dashboard"
          : "/login",
      user,
    };
  }

  return {
    allowed: true,
    redirectTo: null,
    user,
  };
}

/*
  REDIRECT LOGGED-IN USER
  TO THEIR CORRECT DASHBOARD
*/

export async function getDashboardForCurrentUser() {
  const role =
    await getCurrentUserRole();

  if (role === "company") {
    return "/company/dashboard";
  }

  if (role === "fresher") {
    return "/dashboard";
  }

  return "/login";
}