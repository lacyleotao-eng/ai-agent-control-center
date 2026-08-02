import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import type { WorkflowAction } from "../src/types/workflow";

const root = process.cwd();
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

async function main() {
  const testDirectory = await mkdtemp(join(tmpdir(), "agent-control-center-"));
  const databaseUrl = `file:${join(testDirectory, "workflow.db")}`;
  const environment = { ...process.env, DATABASE_URL: databaseUrl };

  try {
    execFileSync(pnpm, ["db:setup"], {
      cwd: root,
      env: environment,
      encoding: "utf8",
      stdio: "pipe",
    });
    process.env.DATABASE_URL = databaseUrl;

    const { prisma } = await import("../src/lib/prisma");
    const { getWorkflowSnapshot, performWorkflowAction } = await import("../src/lib/services/workflow.service");

    const project = await prisma.project.create({
      data: {
        name: "Workflow Test Project",
        slug: `workflow-test-${Date.now()}`,
        description: "Isolated test fixture.",
      },
    });
    const [planner, developer, qa] = await Promise.all([
      prisma.agent.create({ data: { projectId: project.id, name: "Planner", role: "PLANNER" } }),
      prisma.agent.create({ data: { projectId: project.id, name: "Developer", role: "DEVELOPER" } }),
      prisma.agent.create({ data: { projectId: project.id, name: "QA", role: "QA" } }),
    ]);
    assert.equal(planner.role, "PLANNER");

    const run = (action: WorkflowAction) => performWorkflowAction(action);
    const projectId = project.id;
    const requirement = await run({
      type: "create_requirement",
      projectId,
      title: "Make the workflow auditable",
      description: "Record every human-approved handoff with clear evidence.",
    });
    let snapshot = await getWorkflowSnapshot(projectId);
    assert.equal(snapshot.requirements.length, 1, "Requirement creation should persist one requirement");
    assert.equal(snapshot.auditEvents.some((event) => event.event === "REQUIREMENT_CREATED"), true);

    const taskDraft = await run({
      type: "generate_task",
      projectId,
      requirementId: requirement.focus.requirementId!,
    });
    snapshot = await getWorkflowSnapshot(projectId);
    const taskId = taskDraft.focus.taskId!;
    assert.equal(snapshot.tasks[0]?.status, "DRAFT", "Planner should create a Task Draft");
    assert.equal(snapshot.tasks[0]?.approval?.status, "PENDING", "Task Draft should create a pending Approval Request");
    assert.equal(snapshot.tasks[0]?.plannerMode, "MOCK_DETERMINISTIC");

    await assert.rejects(
      () => run({ type: "receive_task", projectId, taskId }),
      /Illegal task transition: DRAFT -> IN_PROGRESS/,
      "Unapproved task must not enter Developer flow",
    );

    await run({ type: "approve_task", projectId, taskId, note: "Approved in isolated test." });
    snapshot = await getWorkflowSnapshot(projectId);
    assert.equal(snapshot.tasks.find((task) => task.id === taskId)?.status, "APPROVED");
    assert.equal(snapshot.tasks.find((task) => task.id === taskId)?.approval?.status, "APPROVED");

    await run({ type: "receive_task", projectId, taskId });
    snapshot = await getWorkflowSnapshot(projectId);
    assert.equal(snapshot.tasks.find((task) => task.id === taskId)?.status, "IN_PROGRESS");
    assert.equal(snapshot.tasks.find((task) => task.id === taskId)?.assignedAgent?.id, developer.id);

    const product = await run({
      type: "create_work_product",
      projectId,
      taskId,
      title: "Audit-ready implementation notes",
      content: "Local workflow evidence was captured without a model call or repository mutation.",
    });
    snapshot = await getWorkflowSnapshot(projectId);
    const workProductId = product.focus.workProductId!;
    assert.equal(snapshot.workProducts[0]?.status, "READY_FOR_HANDOFF", "WorkProduct should persist before handoff");
    assert.equal(snapshot.tasks.find((task) => task.id === taskId)?.status, "WORK_PRODUCT_READY");

    const handoff = await run({
      type: "create_handoff",
      projectId,
      taskId,
      workProductId,
      message: "Please verify the evidence fields and final state transition.",
    });
    snapshot = await getWorkflowSnapshot(projectId);
    const handoffId = handoff.focus.handoffId!;
    assert.equal(snapshot.handoffs[0]?.status, "PENDING", "Handoff should start pending");
    assert.equal(snapshot.tasks.find((task) => task.id === taskId)?.status, "HANDED_OFF");

    await run({ type: "accept_handoff", projectId, handoffId });
    snapshot = await getWorkflowSnapshot(projectId);
    assert.equal(snapshot.handoffs.find((item) => item.id === handoffId)?.status, "ACCEPTED");
    assert.equal(snapshot.tasks.find((task) => task.id === taskId)?.status, "IN_QA");

    await run({
      type: "submit_review",
      projectId,
      handoffId,
      decision: "APPROVED",
      summary: "QA verified the recorded workflow evidence.",
      evidence: "Isolated service test assertions passed.",
    });
    snapshot = await getWorkflowSnapshot(projectId);
    assert.equal(snapshot.reviews[0]?.decision, "APPROVED", "QA review should persist");
    assert.equal(snapshot.tasks.find((task) => task.id === taskId)?.status, "DONE");
    assert.equal(snapshot.workProducts.find((product) => product.id === workProductId)?.status, "QA_APPROVED");

    await assert.rejects(
      () => run({ type: "approve_task", projectId, taskId }),
      /Illegal task transition: DONE -> APPROVED/,
      "Completed task must reject an illegal transition",
    );
    await assert.rejects(
      () => run({ type: "accept_handoff", projectId, handoffId }),
      /Illegal handoff transition: ACCEPTED -> ACCEPTED/,
      "Accepted handoff must reject duplicate acceptance",
    );

    const requiredEvents = [
      "REQUIREMENT_CREATED",
      "TASK_DRAFT_GENERATED",
      "APPROVAL_REQUEST_CREATED",
      "TASK_APPROVED",
      "TASK_RECEIVED",
      "WORK_PRODUCT_CREATED",
      "HANDOFF_CREATED",
      "HANDOFF_ACCEPTED",
      "QA_REVIEW_SUBMITTED",
      "TASK_COMPLETED",
    ];
    const eventNames = new Set(snapshot.auditEvents.map((event) => event.event));
    for (const event of requiredEvents) assert.equal(eventNames.has(event), true, `Missing audit event: ${event}`);
    assert.ok(snapshot.auditEvents.length >= requiredEvents.length, "Every workflow action should create audit evidence");

    console.log("Workflow test passed: requirement → draft → approval → developer → WorkProduct → handoff → QA review.");
    console.log(`Audit events verified: ${snapshot.auditEvents.length}`);
  } finally {
    await rm(testDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
