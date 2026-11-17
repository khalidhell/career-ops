import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  checkRequest,
  parseAllowedHosts,
  parseAllowedOrigins,
} from "@/lib/origin-guard.mjs";

function constantTimeEqual(left: string, right: string): boolean {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return difference === 0;
}

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
  const username = process.env.CAREER_OPS_WEB_AUTH_USER;
  const password = process.env.CAREER_OPS_WEB_AUTH_PASSWORD;

  // Local development remains unchanged. Production fails closed if the owner
  // has not configured both credentials or has chosen a short password.
  if (process.env.NODE_ENV === "production" && (!username || !password || password.length < 16)) {
    return new NextResponse("Website authentication is not configured correctly.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (!username && !password) return null;
  if (!username || !password || password.length < 16) return unauthorized();

  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Basic ")) return unauthorized();

  try {
    const binary = atob(header.slice(6).trim());
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const credentials = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const separator = credentials.indexOf(":");
    if (separator < 0) return unauthorized();
    const suppliedUser = credentials.slice(0, separator);
    const suppliedPassword = credentials.slice(separator + 1);
    if (!constantTimeEqual(suppliedUser, username) || !constantTimeEqual(suppliedPassword, password)) {
      return unauthorized();
    }
    return null;
  } catch {
    return unauthorized();
  }
}

export function proxy(req: NextRequest) {
  // Render's health probe gets only a fixed liveness response, never user data.
  if (req.nextUrl.pathname === "/healthz") return NextResponse.next();

  const authFailure = authenticate(req);
  if (authFailure) return authFailure;

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
