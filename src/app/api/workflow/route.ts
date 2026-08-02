import { getWorkflowSnapshot, performWorkflowAction } from "@/lib/services/workflow.service";
import type { WorkflowAction } from "@/types/workflow";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId") ?? undefined;
  try {
    return Response.json({ ok: true, snapshot: await getWorkflowSnapshot(projectId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load workflow.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const action = (await request.json()) as WorkflowAction;
    const result = await performWorkflowAction(action);
    const snapshot = await getWorkflowSnapshot(result.projectId);
    return Response.json({ ok: true, snapshot, focus: result.focus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow action failed.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
