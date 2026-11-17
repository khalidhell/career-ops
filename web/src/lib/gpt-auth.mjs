// Dedicated bearer-token gate for ChatGPT Actions. This key is separate from
// the browser password and grants access only to the /api/gpt/* routes.

function constantTimeEqual(left, right) {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return difference === 0;
}

/** @returns {"ok" | "unauthorized" | "misconfigured"} */
export function checkBearerApiKey({ authorization, apiKey, production }) {
  if (production && (!apiKey || apiKey.length < 32)) return "misconfigured";
  if (!apiKey) return production ? "misconfigured" : "unauthorized";
  if (!authorization || !/^Bearer\s/i.test(authorization)) return "unauthorized";
  const supplied = authorization.replace(/^Bearer\s/i, "").trim();
  return constantTimeEqual(supplied, apiKey) ? "ok" : "unauthorized";
}
