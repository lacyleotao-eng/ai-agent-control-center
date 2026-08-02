"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type {
  TaskSummary,
  WorkflowAction,
  WorkflowSnapshot,
} from "@/types/workflow";

type Focus = {
  requirementId?: string;
  taskId?: string;
  workProductId?: string;
  handoffId?: string;
};

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (["DONE", "APPROVED", "QA_APPROVED", "ACCEPTED"].includes(status)) return "approved";
  if (["IN_PROGRESS", "IN_QA"].includes(status)) return "active";
  if (["DRAFT", "PENDING", "HANDED_OFF", "WORK_PRODUCT_READY", "READY_FOR_HANDOFF"].includes(status)) return "pending";
  return "";
}

function taskMatches(task: TaskSummary, status: TaskSummary["status"]) {
  return task.status === status;
}

export function WorkflowConsole({ initial }: { initial: WorkflowSnapshot }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initial);
  const [selectedRequirementId, setSelectedRequirementId] = useState(initial.requirements[0]?.id ?? "");
  const [selectedTaskId, setSelectedTaskId] = useState(initial.tasks[0]?.id ?? "");
  const [selectedWorkProductId, setSelectedWorkProductId] = useState(initial.workProducts[0]?.id ?? "");
  const [selectedHandoffId, setSelectedHandoffId] = useState(initial.handoffs[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const selectedRequirement = snapshot.requirements.find((item) => item.id === selectedRequirementId);
  const draftTasks = snapshot.tasks.filter((task) => taskMatches(task, "DRAFT"));
  const approvedTasks = snapshot.tasks.filter((task) => taskMatches(task, "APPROVED"));
  const inProgressTasks = snapshot.tasks.filter((task) => taskMatches(task, "IN_PROGRESS"));
  const readyProducts = snapshot.workProducts.filter((product) => product.status === "READY_FOR_HANDOFF");
  const pendingHandoffs = snapshot.handoffs.filter((handoff) => handoff.status === "PENDING");
  const acceptedHandoffs = snapshot.handoffs.filter((handoff) => handoff.status === "ACCEPTED");

  const selectedDraftTask = draftTasks.find((task) => task.id === selectedTaskId) ?? draftTasks[0];
  const selectedApprovedTask = approvedTasks.find((task) => task.id === selectedTaskId) ?? approvedTasks[0];
  const selectedInProgressTask = inProgressTasks.find((task) => task.id === selectedTaskId) ?? inProgressTasks[0];
  const selectedReadyProduct = readyProducts.find((product) => product.id === selectedWorkProductId) ?? readyProducts[0];
  const selectedPendingHandoff = pendingHandoffs.find((handoff) => handoff.id === selectedHandoffId) ?? pendingHandoffs[0];
  const selectedAcceptedHandoff = acceptedHandoffs.find((handoff) => handoff.id === selectedHandoffId) ?? acceptedHandoffs[0];
  const existingReview = selectedAcceptedHandoff
    ? snapshot.reviews.find((review) => review.workProductId === selectedAcceptedHandoff.workProductId)
    : undefined;

  async function run(action: WorkflowAction, label: string, focus?: Focus) {
    setBusy(label);
    setNotice(null);
    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(action),
      });
      const body = (await response.json()) as {
        ok: boolean;
        error?: string;
        snapshot?: WorkflowSnapshot;
        focus?: Focus;
      };
      if (!response.ok || !body.ok || !body.snapshot) {
        throw new Error(body.error ?? "The workflow action failed.");
      }
      setSnapshot(body.snapshot);
      const nextFocus = body.focus ?? focus;
      if (nextFocus?.requirementId) setSelectedRequirementId(nextFocus.requirementId);
      if (nextFocus?.taskId) setSelectedTaskId(nextFocus.taskId);
      if (nextFocus?.workProductId) setSelectedWorkProductId(nextFocus.workProductId);
      if (nextFocus?.handoffId) setSelectedHandoffId(nextFocus.handoffId);
      setNotice({ kind: "success", text: `${label} completed and recorded in Audit Trail.` });
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "The workflow action failed." });
    } finally {
      setBusy(null);
    }
  }

  function submitRequirement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run(
      {
        type: "create_requirement",
        projectId: snapshot.project.id,
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
      },
      "Requirement creation",
    );
    event.currentTarget.reset();
  }

  function submitWorkProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedInProgressTask) return;
    const form = new FormData(event.currentTarget);
    void run({
      type: "create_work_product",
      projectId: snapshot.project.id,
      taskId: selectedInProgressTask.id,
      title: String(form.get("title") ?? ""),
      content: String(form.get("content") ?? ""),
    }, "WorkProduct creation");
    event.currentTarget.reset();
  }

  function submitHandoff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedReadyProduct) return;
    const form = new FormData(event.currentTarget);
    void run({
      type: "create_handoff",
      projectId: snapshot.project.id,
      taskId: selectedReadyProduct.taskId,
      workProductId: selectedReadyProduct.id,
      message: String(form.get("message") ?? ""),
    }, "Handoff creation");
    event.currentTarget.reset();
  }

  function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAcceptedHandoff) return;
    const form = new FormData(event.currentTarget);
    void run({
      type: "submit_review",
      projectId: snapshot.project.id,
      handoffId: selectedAcceptedHandoff.id,
      decision: "APPROVED",
      summary: String(form.get("summary") ?? ""),
      evidence: String(form.get("evidence") ?? ""),
    }, "QA review");
    event.currentTarget.reset();
  }

  const completed = {
    requirement: snapshot.requirements.length > 0,
    task: snapshot.tasks.length > 0,
    approval: snapshot.tasks.some((task) => task.status !== "DRAFT"),
    developer: snapshot.tasks.some((task) => ["IN_PROGRESS", "WORK_PRODUCT_READY", "HANDED_OFF", "IN_QA", "DONE"].includes(task.status)),
    handoff: snapshot.handoffs.length > 0,
    review: snapshot.reviews.length > 0,
  };

  const progressItems: Array<[string, string, boolean]> = [
    ["1", "Requirement", completed.requirement],
    ["2", "Task draft", completed.task],
    ["3", "Approval", completed.approval],
    ["4", "Developer", completed.developer],
    ["5", "Handoff", completed.handoff],
    ["6", "QA review", completed.review],
  ];

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Human-approved workflow</p>
          <h1>Move one task with evidence.</h1>
          <p className="lede">Use this page to create a requirement, review the deterministic task draft, approve it, and pass a work product to QA.</p>
        </div>
        <span className="status-pill success">{snapshot.project.name}</span>
      </div>

      {notice ? <div className={`notice ${notice.kind === "error" ? "notice-error" : ""}`} role="status">{notice.text}</div> : null}

      <section className="progress-rail" aria-label="Workflow progress">
        {progressItems.map(([number, label, done]) => (
          <div className={`progress-node ${done ? "done" : "current"}`} key={label}>
            <span>{number}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </section>

      <section className="mock-banner" aria-label="Planner boundary">
        <span aria-hidden="true">◆</span>
        <div><strong>Planner boundary</strong> “Generate Task Draft” uses a deterministic Mock Planner. It creates a stored draft and an Approval Request; it does not call an AI model.</div>
      </section>

      <section className="workflow-grid">
        <div className="workflow-column">
          <article className="card step-card">
            <span className="step-number">1</span>
            <div className="step-kicker">Input</div>
            <h2>Create Requirement</h2>
            <p className="muted">Describe the smallest unit of work you want the team to inspect.</p>
            <form className="form-stack" onSubmit={submitRequirement}>
              <div className="field">
                <label htmlFor="requirement-title">Title</label>
                <input className="input" id="requirement-title" name="title" placeholder="e.g. Add an evidence summary" required />
              </div>
              <div className="field">
                <label htmlFor="requirement-description">Description</label>
                <textarea className="textarea" id="requirement-description" name="description" placeholder="What should be true when this is complete?" required />
              </div>
              <div className="form-actions"><button className="button button-primary" disabled={busy !== null} type="submit">Create requirement</button></div>
            </form>
          </article>

          <article className="card step-card">
            <span className="step-number">2</span>
            <div className="step-kicker">Planning</div>
            <h2>Generate Task Draft</h2>
            <p className="muted">Select a requirement and let the deterministic planner prepare a draft for approval.</p>
            <div className="selection-list">
              {snapshot.requirements.length > 0 ? snapshot.requirements.map((requirement) => (
                <button className={`selection-item ${selectedRequirement?.id === requirement.id ? "selected" : ""}`} key={requirement.id} onClick={() => setSelectedRequirementId(requirement.id)} type="button">
                  <span><strong>{requirement.title}</strong><small>{requirement.description}</small></span>
                  <span className={`status-pill ${statusClass(requirement.status)}`}>{statusLabel(requirement.status)}</span>
                </button>
              )) : <div className="empty-state">Create a requirement first.</div>}
            </div>
            <div className="form-actions">
              <button className="button button-primary" disabled={!selectedRequirement || busy !== null} onClick={() => selectedRequirement && void run({ type: "generate_task", projectId: snapshot.project.id, requirementId: selectedRequirement.id }, "Task draft generation")} type="button">Generate task draft</button>
            </div>
          </article>

          <article className="card step-card">
            <span className="step-number">3</span>
            <div className="step-kicker">Gate</div>
            <h2>Human Approval</h2>
            <p className="muted">A task cannot enter the Developer stage until a human approves its Approval Request.</p>
            <div className="selection-list">
              {draftTasks.length > 0 ? draftTasks.map((task) => (
                <button className={`selection-item ${selectedDraftTask?.id === task.id ? "selected" : ""}`} key={task.id} onClick={() => setSelectedTaskId(task.id)} type="button">
                  <span><strong>{task.title}</strong><small>{task.approval?.status ?? "No approval"} · {task.plannerMode}</small></span>
                  <span className="status-pill pending">DRAFT</span>
                </button>
              )) : <div className="empty-state">Generate a task draft to create an Approval Request.</div>}
            </div>
            <div className="form-actions">
              <button className="button button-primary" disabled={!selectedDraftTask || busy !== null} onClick={() => selectedDraftTask && void run({ type: "approve_task", projectId: snapshot.project.id, taskId: selectedDraftTask.id, note: "Approved for the alpha workflow." }, "Human approval")} type="button">Approve task</button>
            </div>
          </article>
        </div>

        <div className="workflow-column">
          <article className="card step-card">
            <span className="step-number">4</span>
            <div className="step-kicker">Developer</div>
            <h2>Receive Approved Task</h2>
            <p className="muted">Developer can only receive tasks that are already APPROVED.</p>
            <div className="selection-list">
              {approvedTasks.length > 0 ? approvedTasks.map((task) => (
                <button className={`selection-item ${selectedApprovedTask?.id === task.id ? "selected" : ""}`} key={task.id} onClick={() => setSelectedTaskId(task.id)} type="button">
                  <span><strong>{task.title}</strong><small>{task.requirementTitle} · Approval {task.approval?.status}</small></span>
                  <span className="status-pill approved">APPROVED</span>
                </button>
              )) : <div className="empty-state">Approve a task before Developer can receive it.</div>}
            </div>
            <div className="form-actions">
              <button className="button button-primary" disabled={!selectedApprovedTask || busy !== null} onClick={() => selectedApprovedTask && void run({ type: "receive_task", projectId: snapshot.project.id, taskId: selectedApprovedTask.id }, "Developer receipt")} type="button">Developer receives task</button>
            </div>
          </article>

          <article className="card step-card">
            <span className="step-number">5</span>
            <div className="step-kicker">Artifact</div>
            <h2>Create WorkProduct</h2>
            <p className="muted">Record the Developer’s output and evidence. This alpha does not modify a repository.</p>
            {selectedInProgressTask ? (
              <form className="form-stack" onSubmit={submitWorkProduct}>
                <div className="empty-state">Task: <strong>{selectedInProgressTask.title}</strong></div>
                <div className="field">
                  <label htmlFor="work-product-title">WorkProduct title</label>
                  <input className="input" id="work-product-title" name="title" placeholder="Implementation notes" required />
                </div>
                <div className="field">
                  <label htmlFor="work-product-content">Content</label>
                  <textarea className="textarea" id="work-product-content" name="content" placeholder="Summarize the output, assumptions, and next verification." required />
                </div>
                <div className="form-actions"><button className="button button-primary" disabled={busy !== null} type="submit">Save WorkProduct</button></div>
              </form>
            ) : <div className="empty-state">Receive an approved task first. Only an IN_PROGRESS task can create a WorkProduct.</div>}
          </article>

          <article className="card step-card">
            <span className="step-number">6</span>
            <div className="step-kicker">Handoff</div>
            <h2>Send to QA</h2>
            <p className="muted">Developer starts the handoff; QA must explicitly accept it before reviewing.</p>
            {selectedReadyProduct ? (
              <form className="form-stack" onSubmit={submitHandoff}>
                <div className="empty-state">WorkProduct: <strong>{selectedReadyProduct.title}</strong></div>
                <div className="field">
                  <label htmlFor="handoff-message">Handoff message</label>
                  <textarea className="textarea" id="handoff-message" name="message" placeholder="What should QA verify?" required />
                </div>
                <div className="form-actions"><button className="button button-primary" disabled={busy !== null} type="submit">Create handoff</button></div>
              </form>
            ) : <div className="empty-state">Create a WorkProduct first. It will appear here when ready for handoff.</div>}
            {selectedPendingHandoff ? (
              <div className="list-row" style={{ marginTop: 17 }}>
                <div><strong>Pending QA handoff</strong><p>{selectedPendingHandoff.message}</p></div>
                <button className="button button-small" disabled={busy !== null} onClick={() => void run({ type: "accept_handoff", projectId: snapshot.project.id, handoffId: selectedPendingHandoff.id }, "QA handoff acceptance")} type="button">QA accepts</button>
              </div>
            ) : null}
          </article>

          <article className="card step-card">
            <span className="step-number">7</span>
            <div className="step-kicker">Verification</div>
            <h2>QA Review</h2>
            <p className="muted">Submit a review with explicit evidence. An approved review completes the task.</p>
            {selectedAcceptedHandoff && !existingReview ? (
              <form className="form-stack" onSubmit={submitReview}>
                <div className="empty-state">Reviewing: <strong>{selectedAcceptedHandoff.workProductId}</strong></div>
                <div className="field">
                  <label htmlFor="review-summary">Review summary</label>
                  <textarea className="textarea" id="review-summary" name="summary" placeholder="What did QA verify?" required />
                </div>
                <div className="field">
                  <label htmlFor="review-evidence">Evidence</label>
                  <textarea className="textarea" id="review-evidence" name="evidence" placeholder="Test command, screenshot, or local observation." required />
                </div>
                <div className="form-actions"><button className="button button-primary" disabled={busy !== null} type="submit">Submit approved review</button></div>
              </form>
            ) : existingReview ? (
              <div className="empty-state"><strong>Review submitted: {existingReview.decision}</strong><br />{existingReview.summary}<br /><span className="muted">Evidence: {existingReview.evidence}</span></div>
            ) : <div className="empty-state">QA must accept the handoff before a review can be submitted.</div>}
          </article>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="section-header">
          <div><h2>Workflow records</h2><p>Stored objects currently visible in this Demo Project.</p></div>
          <span className="status-pill">{snapshot.tasks.length} task{snapshot.tasks.length === 1 ? "" : "s"}</span>
        </div>
        {snapshot.tasks.length > 0 ? (
          <div className="stack-list">
            {snapshot.tasks.map((task) => (
              <div className="list-row" key={task.id}>
                <div><strong>{task.title}</strong><p>{task.requirementTitle} · {task.assignedAgent?.name ?? "Unassigned"} · updated {formatTime(task.updatedAt)}</p></div>
                <span className={`status-pill ${statusClass(task.status)}`}>{statusLabel(task.status)}</span>
              </div>
            ))}
          </div>
        ) : <div className="empty-state">No tasks yet. The workflow starts with a requirement.</div>}
      </section>
    </main>
  );
}
