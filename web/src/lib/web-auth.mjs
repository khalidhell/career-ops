// Small, dependency-free HTTP Basic Auth decision helper. Kept separate from
// Next.js so the production fail-closed behaviour can be covered by node:test.

function constantTimeEqual(left, right) {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return difference === 0;
}

/**
 * @returns {"ok" | "unauthorized" | "misconfigured"}
 */
export function checkBasicAuth({ authorization, username, password, production }) {
  if (production && (!username || !password || password.length < 16)) {
    return "misconfigured";
  }
  if (!username && !password) return "ok";
  if (!username || !password || password.length < 16) return "unauthorized";
  if (!authorization || !/^Basic\s/i.test(authorization)) return "unauthorized";

  try {
    const binary = atob(authorization.replace(/^Basic\s/i, "").trim());
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const credentials = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const separator = credentials.indexOf(":");
    if (separator < 0) return "unauthorized";
    const suppliedUser = credentials.slice(0, separator);
    const suppliedPassword = credentials.slice(separator + 1);
    return constantTimeEqual(suppliedUser, username) && constantTimeEqual(suppliedPassword, password)
      ? "ok"
      : "unauthorized";
  } catch {
    return "unauthorized";
  }
}
