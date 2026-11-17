import { POST as updateStatus } from "../../status/route";

export const runtime = "nodejs";

// Reuse the existing lock-safe status writer. The proxy requires the dedicated
// GPT bearer key for this route; the action schema marks it consequential.
export async function POST(request: Request) {
  return updateStatus(request);
}
