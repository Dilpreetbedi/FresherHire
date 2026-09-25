import {
  NextRequest,
  NextResponse,
} from "next/server";


export function proxy(
  request: NextRequest
) {
  const pathname =
    request.nextUrl.pathname;


  const adminToken =
    request.cookies.get(
      "fresherhire_admin"
    )?.value;


  const recruiterToken =
    request.cookies.get(
      "fresherhire_recruiter"
    )?.value;


  // =====================================================
  // ADMIN
  // =====================================================

  if (
    pathname.startsWith(
      "/admin"
    )
  ) {
    const isAdminLogin =
      pathname ===
      "/admin/login";


    // Not logged in
    if (
      !isAdminLogin &&
      !adminToken
    ) {
      return NextResponse.redirect(
        new URL(
          "/admin/login",
          request.url
        )
      );
    }


    // Already logged in
    if (
      isAdminLogin &&
      adminToken
    ) {
      return NextResponse.redirect(
        new URL(
          "/admin/leads",
          request.url
        )
      );
    }
  }


  // =====================================================
  // RECRUITER
  // =====================================================

  /*
    Public recruiter pages:

    /recruiter
        → company hiring enquiry form

    /recruiter/login
        → recruiter login

    Everything else under
    /recruiter/*
    requires authentication.
  */


  const isRecruiterMainPage =
    pathname ===
    "/recruiter";


  const isRecruiterLogin =
    pathname ===
    "/recruiter/login";


  const isRecruiterPrivatePage =
    pathname.startsWith(
      "/recruiter/"
    ) &&
    !isRecruiterLogin;


  // =====================================================
  // PRIVATE RECRUITER ROUTE WITHOUT LOGIN
  // =====================================================

  if (
    isRecruiterPrivatePage &&
    !recruiterToken
  ) {
    return NextResponse.redirect(
      new URL(
        "/recruiter/login",
        request.url
      )
    );
  }


  // =====================================================
  // LOGGED-IN RECRUITER VISITING LOGIN
  // =====================================================

  if (
    isRecruiterLogin &&
    recruiterToken
  ) {
    return NextResponse.redirect(
      new URL(
        "/recruiter/dashboard",
        request.url
      )
    );
  }


  // =====================================================
  // PUBLIC RECRUITER FORM
  // =====================================================

  if (isRecruiterMainPage) {
    return NextResponse.next();
  }


  return NextResponse.next();
}


export const config = {
  matcher: [
    "/admin/:path*",
    "/recruiter/:path*",
  ],
};