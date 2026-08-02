import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type Database = PrismaClient | Prisma.TransactionClient;

export function withTransaction<T>(
  callback: (database: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(callback);
}

export function getFirstProject() {
  return prisma.project.findFirst({ orderBy: { createdAt: "asc" } });
}

export function getProject(projectId: string, database: Database = prisma) {
  return database.project.findUnique({ where: { id: projectId } });
}

export function listAgents(projectId: string, database: Database = prisma) {
  return database.agent.findMany({
    where: { projectId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export function listRequirements(
  projectId: string,
  database: Database = prisma,
) {
  return database.requirement.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export function listTasks(projectId: string, database: Database = prisma) {
  return database.task.findMany({
    where: { projectId },
    include: {
      requirement: true,
      assignedAgent: true,
      approval: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function listWorkProducts(
  projectId: string,
  database: Database = prisma,
) {
  return database.workProduct.findMany({
    where: { projectId },
    include: { agent: true },
    orderBy: { createdAt: "desc" },
  });
}

export function listHandoffs(projectId: string, database: Database = prisma) {
  return database.handoff.findMany({
    where: { projectId },
    include: { fromAgent: true, toAgent: true },
    orderBy: { createdAt: "desc" },
  });
}

export function listReviews(projectId: string, database: Database = prisma) {
  return database.review.findMany({
    where: { projectId },
    include: { reviewer: true },
    orderBy: { createdAt: "desc" },
  });
}

export function listAuditEvents(
  projectId: string,
  take = 100,
  database: Database = prisma,
) {
  return database.auditEvent.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function countRequirements(projectId: string) {
  return prisma.requirement.count({ where: { projectId } });
}

export function countPendingApprovals(projectId: string) {
  return prisma.approvalRequest.count({
    where: { projectId, status: "PENDING" },
  });
}

export function countActiveTasks(projectId: string) {
  return prisma.task.count({
    where: {
      projectId,
      status: { in: ["APPROVED", "IN_PROGRESS", "WORK_PRODUCT_READY", "HANDED_OFF", "IN_QA"] },
    },
  });
}

export function countWorkProducts(projectId: string) {
  return prisma.workProduct.count({ where: { projectId } });
}

export function countAuditEvents(projectId: string) {
  return prisma.auditEvent.count({ where: { projectId } });
}

export function findRequirement(id: string, database: Database = prisma) {
  return database.requirement.findUnique({ where: { id } });
}

export function findTask(id: string, database: Database = prisma) {
  return database.task.findUnique({
    where: { id },
    include: { requirement: true, assignedAgent: true, approval: true },
  });
}

export function findAgentByRole(
  projectId: string,
  role: string,
  database: Database = prisma,
) {
  return database.agent.findFirst({ where: { projectId, role } });
}

export function findWorkProduct(id: string, database: Database = prisma) {
  return database.workProduct.findUnique({
    where: { id },
    include: { agent: true, task: true },
  });
}

export function findHandoff(id: string, database: Database = prisma) {
  return database.handoff.findUnique({
    where: { id },
    include: { fromAgent: true, toAgent: true, workProduct: true, task: true },
  });
}

export function findAcceptedHandoffForTask(
  taskId: string,
  database: Database = prisma,
) {
  return database.handoff.findFirst({
    where: { taskId, status: "ACCEPTED" },
    orderBy: { createdAt: "desc" },
    include: { fromAgent: true, toAgent: true, workProduct: true, task: true },
  });
}

export function createRequirement(
  data: Prisma.RequirementUncheckedCreateInput,
  database: Database,
) {
  return database.requirement.create({ data });
}

export function createTask(
  data: Prisma.TaskUncheckedCreateInput,
  database: Database,
) {
  return database.task.create({ data });
}

export function updateTask(
  id: string,
  data: Prisma.TaskUncheckedUpdateInput,
  database: Database,
) {
  return database.task.update({ where: { id }, data });
}

export function createApproval(
  data: Prisma.ApprovalRequestUncheckedCreateInput,
  database: Database,
) {
  return database.approvalRequest.create({ data });
}

export function updateApproval(
  id: string,
  data: Prisma.ApprovalRequestUncheckedUpdateInput,
  database: Database,
) {
  return database.approvalRequest.update({ where: { id }, data });
}

export function createWorkProduct(
  data: Prisma.WorkProductUncheckedCreateInput,
  database: Database,
) {
  return database.workProduct.create({ data });
}

export function updateWorkProduct(
  id: string,
  data: Prisma.WorkProductUncheckedUpdateInput,
  database: Database,
) {
  return database.workProduct.update({ where: { id }, data });
}

export function createHandoff(
  data: Prisma.HandoffUncheckedCreateInput,
  database: Database,
) {
  return database.handoff.create({ data });
}

export function updateHandoff(
  id: string,
  data: Prisma.HandoffUncheckedUpdateInput,
  database: Database,
) {
  return database.handoff.update({ where: { id }, data });
}

export function createReview(
  data: Prisma.ReviewUncheckedCreateInput,
  database: Database,
) {
  return database.review.create({ data });
}

export function createAuditEvent(
  data: Prisma.AuditEventUncheckedCreateInput,
  database: Database,
) {
  return database.auditEvent.create({ data });
}
