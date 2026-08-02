export type TaskStatus =
  | "DRAFT"
  | "APPROVED"
  | "IN_PROGRESS"
  | "WORK_PRODUCT_READY"
  | "HANDED_OFF"
  | "IN_QA"
  | "DONE";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type HandoffStatus = "PENDING" | "ACCEPTED";
export type ReviewDecision = "APPROVED" | "CHANGES_REQUESTED";

export type AgentSummary = {
  id: string;
  name: string;
  role: string;
  status: string;
};

export type RequirementSummary = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
};

export type ApprovalSummary = {
  id: string;
  taskId: string;
  status: ApprovalStatus;
  requestedBy: string;
  approvedBy: string | null;
  decisionNote: string | null;
};

export type TaskSummary = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  plannerMode: string;
  requirementId: string;
  requirementTitle: string;
  assignedAgent: AgentSummary | null;
  approval: ApprovalSummary | null;
  updatedAt: string;
};

export type WorkProductSummary = {
  id: string;
  taskId: string;
  agent: AgentSummary;
  type: string;
  title: string;
  content: string;
  status: string;
  evidence: string | null;
  createdAt: string;
};

export type HandoffSummary = {
  id: string;
  taskId: string;
  workProductId: string;
  status: HandoffStatus;
  message: string;
  fromAgent: AgentSummary;
  toAgent: AgentSummary;
  createdAt: string;
};

export type ReviewSummary = {
  id: string;
  taskId: string;
  workProductId: string;
  reviewer: AgentSummary;
  decision: ReviewDecision;
  summary: string;
  evidence: string;
  createdAt: string;
};

export type AuditEventSummary = {
  id: string;
  event: string;
  actorName: string;
  objectType: string;
  objectId: string;
  previousState: string | null;
  newState: string;
  evidence: string;
  createdAt: string;
};

export type ProjectSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
};

export type WorkflowSnapshot = {
  project: ProjectSummary;
  agents: AgentSummary[];
  requirements: RequirementSummary[];
  tasks: TaskSummary[];
  workProducts: WorkProductSummary[];
  handoffs: HandoffSummary[];
  reviews: ReviewSummary[];
  auditEvents: AuditEventSummary[];
};

export type DashboardSnapshot = {
  project: ProjectSummary;
  metrics: {
    requirements: number;
    pendingApprovals: number;
    activeTasks: number;
    workProducts: number;
    auditEvents: number;
  };
  latestEvents: AuditEventSummary[];
  agents: AgentSummary[];
};

export type WorkflowAction =
  | {
      type: "create_requirement";
      projectId: string;
      title: string;
      description: string;
    }
  | {
      type: "generate_task";
      projectId: string;
      requirementId: string;
    }
  | {
      type: "approve_task";
      projectId: string;
      taskId: string;
      note?: string;
    }
  | {
      type: "receive_task";
      projectId: string;
      taskId: string;
    }
  | {
      type: "create_work_product";
      projectId: string;
      taskId: string;
      title: string;
      content: string;
    }
  | {
      type: "create_handoff";
      projectId: string;
      taskId: string;
      workProductId: string;
      message: string;
    }
  | {
      type: "accept_handoff";
      projectId: string;
      handoffId: string;
    }
  | {
      type: "submit_review";
      projectId: string;
      handoffId: string;
      summary: string;
      evidence: string;
      decision: ReviewDecision;
    };
