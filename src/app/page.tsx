import { DashboardView } from "@/components/dashboard-view";
import { getDashboardSnapshot } from "@/lib/services/workflow.service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardSnapshot();
  return <DashboardView data={data} />;
}
