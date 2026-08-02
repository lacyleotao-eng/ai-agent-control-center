import type { TaskStatus } from "@/types/workflow";

const taskTransitions: Record<TaskStatus, readonly TaskStatus[]> = {
  DRAFT: ["APPROVED"],
  APPROVED: ["IN_PROGRESS"],
  IN_PROGRESS: ["WORK_PRODUCT_READY"],
  WORK_PRODUCT_READY: ["HANDED_OFF"],
  HANDED_OFF: ["IN_QA"],
  IN_QA: ["DONE"],
  DONE: [],
};

export function assertTaskTransition(
  current: TaskStatus,
  next: TaskStatus,
): void {
  if (!taskTransitions[current].includes(next)) {
    throw new Error(`Illegal task transition: ${current} -> ${next}`);
  }
}

export function assertApprovalTransition(
  current: string,
  next: string,
): void {
  const allowed: Record<string, readonly string[]> = {
    PENDING: ["APPROVED", "REJECTED"],
    APPROVED: [],
    REJECTED: [],
  };

  if (!allowed[current]?.includes(next)) {
    throw new Error(`Illegal approval transition: ${current} -> ${next}`);
  }
}

export function assertHandoffTransition(current: string, next: string): void {
  const allowed: Record<string, readonly string[]> = {
    PENDING: ["ACCEPTED"],
    ACCEPTED: [],
  };

  if (!allowed[current]?.includes(next)) {
    throw new Error(`Illegal handoff transition: ${current} -> ${next}`);
  }
}
