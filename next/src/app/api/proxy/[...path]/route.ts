import { NextResponse } from "next/server";

import { applyHmacHeaders } from "@/lib/requestIntegrity";
import { getSessionUser } from "@/lib/serverAuth";

export const runtime = "nodejs";

const GO_BACKEND_URL = process.env.GO_BACKEND_URL;
const HMAC_SECRET = process.env.HMAC_SECRET;

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

type AdminRule = {
  methods: string[];
  pattern: RegExp;
};

const adminRules: AdminRule[] = [
  { methods: ["PUT", "DELETE"], pattern: /^\/api\/questions\/[^/]+\/?$/ },
  { methods: ["POST"], pattern: /^\/api\/quizzes\/[^/]+\/questions\/?$/ },
  { methods: ["POST"], pattern: /^\/api\/quizzes\/?$/ },
  { methods: ["GET", "PUT", "DELETE"], pattern: /^\/api\/quizzes\/[^/]+\/?$/ },
  { methods: ["PATCH"], pattern: /^\/api\/quizzes\/[^/]+\/(archive|publish)\/?$/ },
];

function isAdminRoute(
  method: string,
  pathname: string,
  searchParams: URLSearchParams
) {
  if (method === "GET" && /^\/api\/quizzes\/?$/.test(pathname)) {
    const scope = searchParams.get("scope");
    if (scope === "not_published" || scope === "archived") {
      return true;
    }
  }

  return adminRules.some(
    (rule) => rule.methods.includes(method) && rule.pattern.test(pathname)
  );
}

function buildTargetUrl(baseUrl: string, pathname: string, search: string) {
  const target = new URL(baseUrl);
  const normalizedBase = target.pathname.replace(/\/$/, "");
  target.pathname = `${normalizedBase}${pathname}`;
  target.search = search;
  return target;
}

function sanitizeRequestHeaders(headers: Headers) {
  const sanitized = new Headers(headers);
  sanitized.delete("cookie");
  sanitized.delete("host");
  sanitized.delete("content-length");
  sanitized.delete("connection");
  return sanitized;
}

function sanitizeResponseHeaders(headers: Headers) {
  const sanitized = new Headers(headers);
  sanitized.delete("set-cookie");
  return sanitized;
}

async function handleProxy(request: Request, { params }: RouteContext) {
  if (!GO_BACKEND_URL) {
    return NextResponse.json(
      { error: "Missing GO_BACKEND_URL" },
      { status: 500 }
    );
  }

  if (!HMAC_SECRET) {
    return NextResponse.json({ error: "Missing HMAC_SECRET" }, { status: 500 });
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path = [] } = await params;
  const pathname = `/api/${path.join("/")}`;
  const { search, searchParams } = new URL(request.url);
  const method = request.method.toUpperCase();

  if (isAdminRoute(method, pathname, searchParams) && !sessionUser.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const headers = sanitizeRequestHeaders(request.headers);
  headers.set("X-User-Email", sessionUser.email ?? "");
  headers.set("X-User-Id", sessionUser.postgresId.toString());
  headers.set("X-User-IsAdmin", sessionUser.isAdmin ? "true" : "false");

  const targetUrl = buildTargetUrl(GO_BACKEND_URL, pathname, search);
  const requestPath = `${targetUrl.pathname}${targetUrl.search}`;
  applyHmacHeaders(headers, requestPath, body, HMAC_SECRET);

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body: body ?? undefined,
      cache: "no-store",
    });

    const responseHeaders = sanitizeResponseHeaders(upstream.headers);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error", error);
    return NextResponse.json(
      { error: "Upstream request failed" },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const HEAD = handleProxy;
export const OPTIONS = handleProxy;
