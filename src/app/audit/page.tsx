import { AuditTrail } from "@/components/audit-trail";
import { getAuditSnapshot } from "@/lib/services/workflow.service";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const data = await getAuditSnapshot();
  return <AuditTrail project={data.project} events={data.events} />;
}
