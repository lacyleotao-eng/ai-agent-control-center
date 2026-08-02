import type { AuditEventSummary, ProjectSummary } from "@/types/workflow";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AuditTrail({ project, events }: { project: ProjectSummary; events: AuditEventSummary[] }) {
  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Evidence ledger</p>
          <h1>Audit Trail</h1>
          <p className="lede">Every alpha workflow action records its actor, object, state transition, evidence, and timestamp in the local SQLite database.</p>
        </div>
        <span className="status-pill success">{events.length} events</span>
      </div>

      <section className="card mock-banner">
        <span aria-hidden="true">◎</span>
        <div><strong>Project scope: {project.name}</strong> This is a local, append-only-style activity view for the demo workflow. It is not a security log or multi-user identity system.</div>
      </section>

      <section className="card">
        {events.length > 0 ? (
          <div className="audit-table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Actor</th>
                  <th>Object</th>
                  <th>Previous state</th>
                  <th>New state</th>
                  <th>Evidence</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td><span className="audit-event">{event.event.replaceAll("_", " ")}</span></td>
                    <td>{event.actorName}</td>
                    <td><span className="code-label">{event.objectType}</span><br /><span className="muted">{event.objectId.slice(0, 12)}…</span></td>
                    <td>{event.previousState ? <span className="status-pill">{event.previousState}</span> : <span className="muted">—</span>}</td>
                    <td><span className={`status-pill ${event.newState === "DONE" || event.newState === "APPROVED" ? "approved" : "pending"}`}>{event.newState}</span></td>
                    <td className="muted">{event.evidence}</td>
                    <td className="muted">{formatTime(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No events yet. Run the workflow to create the first evidence record.</div>
        )}
      </section>
    </main>
  );
}
