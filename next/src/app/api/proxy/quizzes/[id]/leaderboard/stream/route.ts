import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/server-auth";
import { serverFetch } from "@/lib/api/server-fetch";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Verify user is logged in
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Validate quiz ID parameter
  const { id: quizIdStr } = await params;
  const quizId = parseInt(quizIdStr, 10);
  if (isNaN(quizId) || quizId <= 0) {
    return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
  }

  // 3. Connect to the upstream Go backend stream
  try {
    const upstream = await serverFetch(`/api/quizzes/${quizId}/leaderboard/stream`, {
      method: "GET",
      headers: {
        "Accept": "text/event-stream",
      },
    });

    if (!upstream.ok) {
      return new Response("Failed to connect to leaderboard stream", {
        status: upstream.status,
      });
    }

    // 4. Pipe the upstream stream directly back to the client
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Leaderboard stream proxy error", error);
    return NextResponse.json(
      { error: "Upstream request failed" },
      { status: 502 }
    );
  }
}
