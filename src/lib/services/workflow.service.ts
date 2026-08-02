import {
  countActiveTasks,
  countAuditEvents,
  countPendingApprovals,
  countRequirements,
  countWorkProducts,
  createApproval,
  createAuditEvent,
  createHandoff as createHandoffRecord,
  createRequirement as createRequirementRecord,
  createReview as createReviewRecord,
  createTask as createTaskRecord,
  createWorkProduct as createWorkProductRecord,
  findAcceptedHandoffForTask,
  findAgentByRole,
  findHandoff,
  findRequirement,
  findTask,
  findWorkProduct,
  getFirstProject,
  getProject,
  listAgents,
  listAuditEvents,
  listHandoffs,
  listRequirements,
  listReviews,
  listTasks,
  listWorkProducts,
  updateApproval,
  updateHandoff,
  updateTask,
  updateWorkProduct,
  withTransaction,
  type Database,
} from "@/lib/repositories/workflow.repository";
import {
  assertApprovalTransition,
  assertHandoffTransition,
  assertTaskTransition,
} from "@/lib/workflow-state";
import type {
  AgentSummary,
  AuditEventSummary,
  DashboardSnapshot,
  HandoffSummary,
  ProjectSummary,
  ReviewSummary,
  RequirementSummary,
  TaskStatus,
  TaskSummary,
  WorkProductSummary,
  WorkflowAction,
  WorkflowSnapshot,
} from "@/types/workflow";

type Focus = {
  requirementId?: string;
  taskId?: string;
  workProductId?: string;
  handoffId?: string;
};

type ActionResult = {
  projectId: string;
  focus: Focus;
};

function requireText(value: string | undefined, field: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`${field} is required.`);
  }
  return normalized;
}

function projectSummary(project: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
}): ProjectSummary {
  return project;
}

function agentSummary(agent: {
  id: string;
  name: string;
  role: string;
  status: string;
}): AgentSummary {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    status: agent.status,
  };
}

function mapRequirement(requirement: {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: Date;
}): RequirementSummary {
  return { ...requirement, createdAt: requirement.createdAt.toISOString() };
}

function mapTask(task: {
  id: string;
  title: string;
  description: string;
  status: string;
  plannerMode: string;
  requirementId: string;
  updatedAt: Date;
  requirement: { title: string };
  assignedAgent: { id: string; name: string; role: string; status: string } | null;
  approval: {
    id: string;
    taskId: string;
    status: string;
    requestedBy: string;
    approvedBy: string | null;
    decisionNote: string | null;
  } | null;
}): TaskSummary {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    plannerMode: task.plannerMode,
    requirementId: task.requirementId,
    requirementTitle: task.requirement.title,
    assignedAgent: task.assignedAgent ? agentSummary(task.assignedAgent) : null,
    approval: task.approval
      ? {
          id: task.approval.id,
          taskId: task.approval.taskId,
          status: task.approval.status as "PENDING" | "APPROVED" | "REJECTED",
          requestedBy: task.approval.requestedBy,
          approvedBy: task.approval.approvedBy,
          decisionNote: task.approval.decisionNote,
        }
      : null,
    updatedAt: task.updatedAt.toISOString(),
  };
}

function mapWorkProduct(product: {
  id: string;
  taskId: string;
  agent: { id: string; name: string; role: string; status: string };
  type: string;
  title: string;
  content: string;
  status: string;
  evidence: string | null;
  createdAt: Date;
}): WorkProductSummary {
  return {
    id: product.id,
    taskId: product.taskId,
    agent: agentSummary(product.agent),
    type: product.type,
    title: product.title,
    content: product.content,
    status: product.status,
    evidence: product.evidence,
    createdAt: product.createdAt.toISOString(),
  };
}

function mapHandoff(handoff: {
  id: string;
  taskId: string;
  workProductId: string;
  status: string;
  message: string;
  fromAgent: { id: string; name: string; role: string; status: string };
  toAgent: { id: string; name: string; role: string; status: string };
  createdAt: Date;
}): HandoffSummary {
  return {
    id: handoff.id,
    taskId: handoff.taskId,
    workProductId: handoff.workProductId,
    status: handoff.status as "PENDING" | "ACCEPTED",
    message: handoff.message,
    fromAgent: agentSummary(handoff.fromAgent),
    toAgent: agentSummary(handoff.toAgent),
    createdAt: handoff.createdAt.toISOString(),
  };
}

function mapReview(review: {
  id: string;
  taskId: string;
  workProductId: string;
  reviewer: { id: string; name: string; role: string; status: string };
  decision: string;
  summary: string;
  evidence: string;
  createdAt: Date;
}): ReviewSummary {
  return {
    id: review.id,
    taskId: review.taskId,
    workProductId: review.workProductId,
    reviewer: agentSummary(review.reviewer),
    decision: review.decision as "APPROVED" | "CHANGES_REQUESTED",
    summary: review.summary,
    evidence: review.evidence,
    createdAt: review.createdAt.toISOString(),
  };
}

function mapAuditEvent(event: {
  id: string;
  event: string;
  actorName: string;
  objectType: string;
  objectId: string;
  previousState: string | null;
  newState: string;
  evidence: string;
  createdAt: Date;
}): AuditEventSummary {
  return { ...event, createdAt: event.createdAt.toISOString() };
}

async function resolveProject(projectId?: string) {
  const project = projectId ? await getProject(projectId) : await getFirstProject();
  if (!project) {
    throw new Error("No project found. Run `pnpm db:setup` to create Demo Project.");
  }
  return project;
}

export async function getWorkflowSnapshot(projectId?: string): Promise<WorkflowSnapshot> {
  const project = await resolveProject(projectId);
  const [agents, requirements, tasks, workProducts, handoffs, reviews, auditEvents] =
    await Promise.all([
      listAgents(project.id),
      listRequirements(project.id),
      listTasks(project.id),
      listWorkProducts(project.id),
      listHandoffs(project.id),
      listReviews(project.id),
      listAuditEvents(project.id),
    ]);

  return {
    project: projectSummary(project),
    agents: agents.map(agentSummary),
    requirements: requirements.map(mapRequirement),
    tasks: tasks.map(mapTask),
    workProducts: workProducts.map(mapWorkProduct),
    handoffs: handoffs.map(mapHandoff),
    reviews: reviews.map(mapReview),
    auditEvents: auditEvents.map(mapAuditEvent),
  };
}

export async function getDashboardSnapshot(
  projectId?: string,
): Promise<DashboardSnapshot> {
  const project = await resolveProject(projectId);
  const [requirements, pendingApprovals, activeTasks, workProducts, auditEvents, agents, latestEvents] =
    await Promise.all([
      countRequirements(project.id),
      countPendingApprovals(project.id),
      countActiveTasks(project.id),
      countWorkProducts(project.id),
      countAuditEvents(project.id),
      listAgents(project.id),
      listAuditEvents(project.id, 8),
    ]);

  return {
    project: projectSummary(project),
    metrics: { requirements, pendingApprovals, activeTasks, workProducts, auditEvents },
    latestEvents: latestEvents.map(mapAuditEvent),
    agents: agents.map(agentSummary),
  };
}

export async function getAuditSnapshot(projectId?: string) {
  const project = await resolveProject(projectId);
  const events = await listAuditEvents(project.id, 250);
  return {
    project: projectSummary(project),
    events: events.map(mapAuditEvent),
  };
}

async function audit(
  database: Database,
  input: {
    projectId: string;
    actorId?: string | null;
    actorName: string;
    event: string;
    objectType: string;
    objectId: string;
    previousState?: string | null;
    newState: string;
    evidence: string;
  },
) {
  return createAuditEvent(
    {
      projectId: input.projectId,
      actorId: input.actorId ?? null,
      actorName: input.actorName,
      event: input.event,
      objectType: input.objectType,
      objectId: input.objectId,
      previousState: input.previousState ?? null,
      newState: input.newState,
      evidence: input.evidence,
    },
    database,
  );
}

async function createRequirementAction(
  action: Extract<WorkflowAction, { type: "create_requirement" }>,
): Promise<ActionResult> {
  const title = requireText(action.title, "Requirement title");
  const description = requireText(action.description, "Requirement description");
  const project = await getProject(action.projectId);
  if (!project) throw new Error("Project does not exist.");

  const requirement = await withTransaction(async (database) => {
    const created = await createRequirementRecord(
      { projectId: project.id, title, description, createdBy: "Human" },
      database,
    );
    await audit(database, {
      projectId: project.id,
      actorName: "Human",
      event: "REQUIREMENT_CREATED",
      objectType: "Requirement",
      objectId: created.id,
      newState: "DRAFT",
      evidence: "Created from the Workflow UI by a human operator.",
    });
    return created;
  });

  return { projectId: project.id, focus: { requirementId: requirement.id } };
}

async function generateTaskAction(
  action: Extract<WorkflowAction, { type: "generate_task" }>,
): Promise<ActionResult> {
  const requirement = await findRequirement(action.requirementId);
  if (!requirement || requirement.projectId !== action.projectId) {
    throw new Error("Requirement does not exist in this project.");
  }
  const project = await getProject(action.projectId);
  if (!project) throw new Error("Project does not exist.");

  const task = await withTransaction(async (database) => {
    const created = await createTaskRecord(
      {
        projectId: project.id,
        requirementId: requirement.id,
        title: `Implement: ${requirement.title}`,
        description: `Deterministic alpha draft for “${requirement.title}”. Validate the requirement, produce an auditable work product, and hand it to QA.`,
        plannerMode: "MOCK_DETERMINISTIC",
        status: "DRAFT",
      },
      database,
    );
    const approval = await createApproval(
      {
        projectId: project.id,
        taskId: created.id,
        status: "PENDING",
        requestedBy: "Mock Planner",
      },
      database,
    );
    await audit(database, {
      projectId: project.id,
      actorName: "Mock Planner",
      event: "TASK_DRAFT_GENERATED",
      objectType: "Task",
      objectId: created.id,
      newState: "DRAFT",
      evidence: `Deterministic Mock Planner created ${created.id}; no model or external API was called.`,
    });
    await audit(database, {
      projectId: project.id,
      actorName: "Mock Planner",
      event: "APPROVAL_REQUEST_CREATED",
      objectType: "ApprovalRequest",
      objectId: approval.id,
      newState: "PENDING",
      evidence: "Human approval is required before Developer can receive this task.",
    });
    return created;
  });

  return { projectId: project.id, focus: { taskId: task.id } };
}

async function approveTaskAction(
  action: Extract<WorkflowAction, { type: "approve_task" }>,
): Promise<ActionResult> {
  const task = await findTask(action.taskId);
  if (!task || task.projectId !== action.projectId || !task.approval) {
    throw new Error("Task or Approval Request does not exist in this project.");
  }
  assertTaskTransition(task.status as TaskStatus, "APPROVED");
  assertApprovalTransition(task.approval.status, "APPROVED");
  const note = action.note?.trim() || "Approved by the human operator.";

  await withTransaction(async (database) => {
    await updateTask(task.id, { status: "APPROVED" }, database);
    await updateApproval(
      task.approval!.id,
      {
        status: "APPROVED",
        approvedBy: "Human / CEO",
        decisionNote: note,
        decidedAt: new Date(),
      },
      database,
    );
    await audit(database, {
      projectId: action.projectId,
      actorName: "Human / CEO",
      event: "TASK_APPROVED",
      objectType: "Task",
      objectId: task.id,
      previousState: "DRAFT",
      newState: "APPROVED",
      evidence: note,
    });
    await audit(database, {
      projectId: action.projectId,
      actorName: "Human / CEO",
      event: "APPROVAL_DECIDED",
      objectType: "ApprovalRequest",
      objectId: task.approval!.id,
      previousState: "PENDING",
      newState: "APPROVED",
      evidence: note,
    });
  });

  return { projectId: action.projectId, focus: { taskId: task.id } };
}

async function receiveTaskAction(
  action: Extract<WorkflowAction, { type: "receive_task" }>,
): Promise<ActionResult> {
  const task = await findTask(action.taskId);
  const developer = await findAgentByRole(action.projectId, "DEVELOPER");
  if (!task || task.projectId !== action.projectId || !developer) {
    throw new Error("Task or Developer agent does not exist in this project.");
  }
  assertTaskTransition(task.status as TaskStatus, "IN_PROGRESS");

  await withTransaction(async (database) => {
    await updateTask(
      task.id,
      { status: "IN_PROGRESS", assignedAgentId: developer.id },
      database,
    );
    await audit(database, {
      projectId: action.projectId,
      actorId: developer.id,
      actorName: developer.name,
      event: "TASK_RECEIVED",
      objectType: "Task",
      objectId: task.id,
      previousState: "APPROVED",
      newState: "IN_PROGRESS",
      evidence: "Developer received an approved task through the local workflow UI.",
    });
  });

  return { projectId: action.projectId, focus: { taskId: task.id } };
}

async function createWorkProductAction(
  action: Extract<WorkflowAction, { type: "create_work_product" }>,
): Promise<ActionResult> {
  const task = await findTask(action.taskId);
  const developer = await findAgentByRole(action.projectId, "DEVELOPER");
  const title = requireText(action.title, "WorkProduct title");
  const content = requireText(action.content, "WorkProduct content");
  if (!task || task.projectId !== action.projectId || !developer) {
    throw new Error("Task or Developer agent does not exist in this project.");
  }
  assertTaskTransition(task.status as TaskStatus, "WORK_PRODUCT_READY");

  const product = await withTransaction(async (database) => {
    const created = await createWorkProductRecord(
      {
        projectId: action.projectId,
        taskId: task.id,
        agentId: developer.id,
        type: "DEVELOPER_OUTPUT",
        title,
        content,
        status: "READY_FOR_HANDOFF",
        evidence: "Created in the local UI; no external model call or repository mutation occurred.",
      },
      database,
    );
    await updateTask(task.id, { status: "WORK_PRODUCT_READY" }, database);
    await audit(database, {
      projectId: action.projectId,
      actorId: developer.id,
      actorName: developer.name,
      event: "WORK_PRODUCT_CREATED",
      objectType: "WorkProduct",
      objectId: created.id,
      newState: "READY_FOR_HANDOFF",
      evidence: "Developer manually recorded a work product with local evidence.",
    });
    await audit(database, {
      projectId: action.projectId,
      actorId: developer.id,
      actorName: developer.name,
      event: "TASK_WORK_PRODUCT_READY",
      objectType: "Task",
      objectId: task.id,
      previousState: "IN_PROGRESS",
      newState: "WORK_PRODUCT_READY",
      evidence: `WorkProduct ${created.id} is ready to hand off to QA.`,
    });
    return created;
  });

  return { projectId: action.projectId, focus: { workProductId: product.id, taskId: task.id } };
}

async function createHandoffAction(
  action: Extract<WorkflowAction, { type: "create_handoff" }>,
): Promise<ActionResult> {
  const task = await findTask(action.taskId);
  const product = await findWorkProduct(action.workProductId);
  const developer = await findAgentByRole(action.projectId, "DEVELOPER");
  const qa = await findAgentByRole(action.projectId, "QA");
  const message = requireText(action.message, "Handoff message");
  if (
    !task ||
    !product ||
    !developer ||
    !qa ||
    task.projectId !== action.projectId ||
    product.projectId !== action.projectId ||
    product.taskId !== task.id
  ) {
    throw new Error("Task, WorkProduct, or QA agents do not match this project.");
  }
  assertTaskTransition(task.status as TaskStatus, "HANDED_OFF");

  const handoff = await withTransaction(async (database) => {
    const created = await createHandoffRecord(
      {
        projectId: action.projectId,
        taskId: task.id,
        workProductId: product.id,
        fromAgentId: developer.id,
        toAgentId: qa.id,
        status: "PENDING",
        message,
      },
      database,
    );
    await updateWorkProduct(product.id, { status: "HANDED_OFF" }, database);
    await updateTask(task.id, { status: "HANDED_OFF" }, database);
    await audit(database, {
      projectId: action.projectId,
      actorId: developer.id,
      actorName: developer.name,
      event: "HANDOFF_CREATED",
      objectType: "Handoff",
      objectId: created.id,
      newState: "PENDING",
      evidence: `WorkProduct ${product.id} handed off to ${qa.name}.`,
    });
    await audit(database, {
      projectId: action.projectId,
      actorId: developer.id,
      actorName: developer.name,
      event: "TASK_HANDED_OFF",
      objectType: "Task",
      objectId: task.id,
      previousState: "WORK_PRODUCT_READY",
      newState: "HANDED_OFF",
      evidence: `Waiting for ${qa.name} to accept the handoff.`,
    });
    return created;
  });

  return { projectId: action.projectId, focus: { handoffId: handoff.id, taskId: task.id } };
}

async function acceptHandoffAction(
  action: Extract<WorkflowAction, { type: "accept_handoff" }>,
): Promise<ActionResult> {
  const handoff = await findHandoff(action.handoffId);
  if (!handoff || handoff.projectId !== action.projectId) {
    throw new Error("Handoff does not exist in this project.");
  }
  assertHandoffTransition(handoff.status, "ACCEPTED");
  assertTaskTransition(handoff.task.status as TaskStatus, "IN_QA");

  await withTransaction(async (database) => {
    await updateHandoff(
      handoff.id,
      { status: "ACCEPTED", acceptedAt: new Date() },
      database,
    );
    await updateTask(handoff.task.id, { status: "IN_QA" }, database);
    await audit(database, {
      projectId: action.projectId,
      actorId: handoff.toAgent.id,
      actorName: handoff.toAgent.name,
      event: "HANDOFF_ACCEPTED",
      objectType: "Handoff",
      objectId: handoff.id,
      previousState: "PENDING",
      newState: "ACCEPTED",
      evidence: "QA accepted the WorkProduct handoff in the local UI.",
    });
    await audit(database, {
      projectId: action.projectId,
      actorId: handoff.toAgent.id,
      actorName: handoff.toAgent.name,
      event: "TASK_ENTERED_QA",
      objectType: "Task",
      objectId: handoff.task.id,
      previousState: "HANDED_OFF",
      newState: "IN_QA",
      evidence: `QA is now responsible for reviewing WorkProduct ${handoff.workProductId}.`,
    });
  });

  return { projectId: action.projectId, focus: { handoffId: handoff.id, taskId: handoff.task.id } };
}

async function submitReviewAction(
  action: Extract<WorkflowAction, { type: "submit_review" }>,
): Promise<ActionResult> {
  const handoff = await findHandoff(action.handoffId);
  const summary = requireText(action.summary, "Review summary");
  const evidence = requireText(action.evidence, "Review evidence");
  if (!handoff || handoff.projectId !== action.projectId) {
    throw new Error("Handoff does not exist in this project.");
  }
  if (handoff.status !== "ACCEPTED") {
    throw new Error("QA cannot review a handoff before accepting it.");
  }
  if (handoff.task.status !== "IN_QA") {
    throw new Error(`Illegal review entry state: ${handoff.task.status}`);
  }
  const qa = handoff.toAgent;
  if (qa.role !== "QA") {
    throw new Error("Only the QA agent can submit this review.");
  }
  const nextTaskState: TaskStatus = action.decision === "APPROVED" ? "DONE" : "IN_QA";
  if (action.decision === "APPROVED") {
    assertTaskTransition(handoff.task.status as TaskStatus, nextTaskState);
  }

  const review = await withTransaction(async (database) => {
    const created = await createReviewRecord(
      {
        projectId: action.projectId,
        taskId: handoff.task.id,
        workProductId: handoff.workProductId,
        reviewerId: qa.id,
        status: "SUBMITTED",
        decision: action.decision,
        summary,
        evidence,
      },
      database,
    );
    if (action.decision === "APPROVED") {
      await updateTask(handoff.task.id, { status: "DONE" }, database);
      await updateWorkProduct(handoff.workProductId, { status: "QA_APPROVED" }, database);
    }
    await audit(database, {
      projectId: action.projectId,
      actorId: qa.id,
      actorName: qa.name,
      event: "QA_REVIEW_SUBMITTED",
      objectType: "Review",
      objectId: created.id,
      previousState: "IN_QA",
      newState: action.decision,
      evidence,
    });
    if (action.decision === "APPROVED") {
      await audit(database, {
        projectId: action.projectId,
        actorId: qa.id,
        actorName: qa.name,
        event: "TASK_COMPLETED",
        objectType: "Task",
        objectId: handoff.task.id,
        previousState: "IN_QA",
        newState: "DONE",
        evidence: summary,
      });
    }
    return created;
  });

  return { projectId: action.projectId, focus: { handoffId: handoff.id, taskId: handoff.task.id } };
}

export async function performWorkflowAction(action: WorkflowAction): Promise<ActionResult> {
  switch (action.type) {
    case "create_requirement":
      return createRequirementAction(action);
    case "generate_task":
      return generateTaskAction(action);
    case "approve_task":
      return approveTaskAction(action);
    case "receive_task":
      return receiveTaskAction(action);
    case "create_work_product":
      return createWorkProductAction(action);
    case "create_handoff":
      return createHandoffAction(action);
    case "accept_handoff":
      return acceptHandoffAction(action);
    case "submit_review":
      return submitReviewAction(action);
    default:
      return assertNever(action);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported workflow action: ${JSON.stringify(value)}`);
}

export async function getLatestAcceptedHandoff(taskId: string) {
  return findAcceptedHandoffForTask(taskId);
}
