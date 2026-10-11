import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://fresherhire.onrender.com";

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const url = new URL(req.url);

  const upstream = await fetch(
    `${BACKEND}/${path.join("/")}${url.search}`,
    {
      method: req.method,
      headers: {
        "content-type": req.headers.get("content-type") || "",
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
  headers.set(
    "content-type",
    upstream.headers.get("content-type") || "application/json"
  );

  const cookies = upstream.headers.getSetCookie?.() || [];
  cookies.forEach((cookie) =>
    headers.append("set-cookie", cookie)
  );

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
