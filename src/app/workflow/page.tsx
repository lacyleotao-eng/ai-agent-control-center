import { WorkflowConsole } from "@/components/workflow-console";
import { getWorkflowSnapshot } from "@/lib/services/workflow.service";

export const dynamic = "force-dynamic";

export default async function WorkflowPage() {
  const initial = await getWorkflowSnapshot();
  return <WorkflowConsole initial={initial} />;
}
