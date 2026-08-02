import { getAuditSnapshot } from "@/lib/services/workflow.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId") ?? undefined;
  try {
    return Response.json({ ok: true, snapshot: await getAuditSnapshot(projectId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load audit trail.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
