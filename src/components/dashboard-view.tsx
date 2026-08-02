import Link from "next/link";
import type { DashboardSnapshot } from "@/types/workflow";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const metricLabels = [
  ["requirements", "Requirements", "Created in this project"],
  ["pendingApprovals", "Pending approvals", "Human decisions needed"],
  ["activeTasks", "Active tasks", "Approved or in progress"],
  ["workProducts", "WorkProducts", "Artifacts recorded"],
  ["auditEvents", "Audit events", "Traceable state changes"],
] as const;

export function DashboardView({ data }: { data: DashboardSnapshot }) {
  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Control plane overview</p>
          <h1>Keep the work visible.</h1>
          <p className="lede">
            A compact local workspace for moving one approved task from requirement to QA with evidence at every step.
          </p>
        </div>
        <Link className="button button-primary" href="/workflow">Open workflow <span aria-hidden="true">→</span></Link>
      </div>

      <section className="card mock-banner" aria-label="Mock planner notice">
        <span aria-hidden="true">◆</span>
        <div>
          <strong>Mock Planner is active</strong>
          Task drafts are generated deterministically for this alpha. No external model, API key, or autonomous execution is involved.
        </div>
      </section>

      <section className="grid metrics-grid" aria-label="Project metrics">
        {metricLabels.map(([key, label, note]) => (
          <article className="card metric-card" key={key}>
            <div className="metric-label">{label}</div>
            <div className="metric-value">{data.metrics[key]}</div>
            <div className="metric-note">{note}</div>
          </article>
        ))}
      </section>

      <section className="grid two-column">
        <article className="card">
          <div className="section-header">
            <div>
              <h2>{data.project.name}</h2>
              <p>{data.project.description}</p>
            </div>
            <span className="status-pill success">{data.project.status}</span>
          </div>
          <div className="stack-list">
            {data.agents.map((agent) => (
              <div className="list-row" key={agent.id}>
                <div>
                  <strong>{agent.name}</strong>
                  <p>{agent.role} · ready for the demo workflow</p>
                </div>
                <span className="status-pill approved">{agent.status}</span>
              </div>
            ))}
          </div>
          <p className="footer-note">This seeded project is safe to reset locally. It contains no private project data.</p>
        </article>

        <article className="card">
          <div className="section-header">
            <div>
              <h2>Latest audit activity</h2>
              <p>Recent state changes from the local workflow.</p>
            </div>
            <Link className="button button-quiet button-small" href="/audit">View all</Link>
          </div>
          {data.latestEvents.length > 0 ? (
            <div className="timeline">
              {data.latestEvents.map((event) => (
                <div className="timeline-item" key={event.id}>
                  <span className="timeline-dot" aria-hidden="true" />
                  <div className="timeline-body">
                    <strong>{event.event.replaceAll("_", " ")}</strong>
                    <p>{event.actorName} · {event.objectType}</p>
                    <span className="timeline-time">{formatTime(event.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No audit events yet. Run the demo workflow to create the first event.</div>
          )}
        </article>
      </section>
    </main>
  );
}
