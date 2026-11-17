import { pipelineSummary, withCloseDates } from "@/lib/career-ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const summary = pipelineSummary();
  const applications = await withCloseDates(summary.applications);
  // Deliberately omit local filesystem paths and deployment internals.
  return Response.json({
    inbox: summary.inbox,
    applications,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
