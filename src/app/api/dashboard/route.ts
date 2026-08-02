import { getDashboardSnapshot } from "@/lib/services/workflow.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ ok: true, snapshot: await getDashboardSnapshot() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load dashboard.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
