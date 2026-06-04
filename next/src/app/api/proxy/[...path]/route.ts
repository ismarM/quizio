import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/server-auth";
import { serverFetch } from "@/lib/api/server-fetch";

export const runtime = "nodejs";

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
  { methods: ["GET"], pattern: /^\/api\/quizzes\/[^/]+\/attempts\/admin\/?$/ },
  { methods: ["GET"], pattern: /^\/api\/quizzes\/[^/]+\/attempt\/[^/]+\/?$/ },
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

  try {
    const upstream = await serverFetch(`${pathname}${search}`, {
      method,
      headers: sanitizeRequestHeaders(request.headers),
      body: body ?? undefined,
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
