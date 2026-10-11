import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND = "https://fresherhire.onrender.com";

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const incoming = new URL(req.url);

  const upstream = await fetch(
    `${BACKEND}/${path.join("/")}${incoming.search}`,
    {
      method: req.method,
      headers: {
        "content-type": req.headers.get("content-type") || "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : await req.arrayBuffer(),
      cache: "no-store",
    }
  );

  const headers = new Headers();

  const contentType = upstream.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const setCookies = upstream.headers.getSetCookie();

  for (const cookie of setCookies) {
    headers.append("set-cookie", cookie);
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
