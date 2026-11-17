import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkBasicAuth } from "@/lib/web-auth.mjs";
import { checkBearerApiKey } from "@/lib/gpt-auth.mjs";
import {
  checkRequest,
  parseAllowedHosts,
  parseAllowedOrigins,
} from "@/lib/origin-guard.mjs";


function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="CareerOps", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

function authenticate(req: NextRequest) {
  const result = checkBasicAuth({
    authorization: req.headers.get("authorization") ?? undefined,
    username: process.env.CAREER_OPS_WEB_AUTH_USER,
    password: process.env.CAREER_OPS_WEB_AUTH_PASSWORD,
    production: process.env.NODE_ENV === "production",
  });
  if (result === "misconfigured") {
    return new NextResponse("Website authentication is not configured correctly.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
  return result === "ok" ? null : unauthorized();
}

export function proxy(req: NextRequest) {
  // Render's health probe gets only a fixed liveness response, never user data.
  if (req.nextUrl.pathname === "/healthz") return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/gpt/")) {
    const result = checkBearerApiKey({
      authorization: req.headers.get("authorization") ?? undefined,
      apiKey: process.env.CAREER_OPS_GPT_API_KEY,
      production: process.env.NODE_ENV === "production",
    });
    if (result !== "ok") {
      const status = result === "misconfigured" ? 503 : 401;
      return new NextResponse(
        result === "misconfigured" ? "GPT API authentication is not configured." : "Authentication required",
        {
          status,
          headers: {
            ...(status === 401 ? { "WWW-Authenticate": "Bearer" } : {}),
            "Cache-Control": "no-store",
          },
        },
      );
    }
  } else {
    const authFailure = authenticate(req);
    if (authFailure) return authFailure;
  }

  // Render assigns the public service hostname at runtime. Include it in both
  // the listener plan (server.mjs) and this Host allowlist; local behaviour is
  // unchanged when the Render variable is absent.
  const allowedHostsValue = [
    process.env.CAREER_OPS_WEB_ALLOWED_HOSTS,
    process.env.RENDER_EXTERNAL_HOSTNAME,
  ].filter(Boolean).join(",");

  const decision = checkRequest({
    secFetchSite: req.headers.get("sec-fetch-site"),
    origin: req.headers.get("origin"),
    host: req.headers.get("host"),
    allowedHosts: parseAllowedHosts(allowedHostsValue),
    allowedOrigins: parseAllowedOrigins(process.env.CAREER_OPS_ALLOWED_ORIGINS),
  });
  if (!decision.ok) {
    return NextResponse.json({ error: decision.reason }, { status: decision.status });
  }
  return NextResponse.next();
}

export const config = { matcher: "/((?!_next/static|_next/image|favicon.ico).*)" };
